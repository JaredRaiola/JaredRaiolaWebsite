import { createFs } from '@/core/fs';
import { getTree, putTree, putBlob } from '@/core/fs/indexeddb';
import { buildSeedTree, SEED_TEXT } from '@/core/fs/seed';
import { useFsStore } from '@/stores/fsStore';
import { createRecycleBin } from '@/core/fs/recycleBin';
import { useRecycleBinStore } from '@/stores/recycleBinStore';
import { useDesktopStore, type DesktopIcon } from '@/stores/desktopStore';
import notepadMeta from '@/apps/notepad/meta';
import explorerMeta from '@/apps/explorer/meta';
import resumeMeta from '@/apps/resume/meta';
import controlPanelMeta from '@/apps/controlpanel/meta';
import calculatorMeta from '@/apps/calculator/meta';
import cmdMeta from '@/apps/cmd/meta';
import paintMeta from '@/apps/paint/meta';
import minesweeperMeta from '@/apps/minesweeper/meta';
import solitaireMeta from '@/apps/solitaire/meta';
import freecellMeta from '@/apps/freecell/meta';
import { registerApp } from '@/core/apps/registry';
import { preload } from './preload';
import {
  loadSnapshot,
  loadBlobs,
  bindAutoSave,
  type SessionSnapshot,
  type AllBlobs,
} from './session';
import { useWindowStore } from '@/stores/windowStore';
import { uuid } from '@/lib/uuid';
import { extname } from '@/core/fs/paths';
import type { FsNode, DirNode } from '@/core/fs/tree';

const DESKTOP_KEY = 'win95.desktop.icons';
const DESKTOP_VERSION_KEY = 'win95.desktop.version';
const DESKTOP_VERSION = '14';
const FS_LAYOUT_KEY = 'win95.fs.layout';
const FS_LAYOUT_VERSION = '6';

export const DESKTOP_DIR = 'C:\\Windows\\User\\Desktop';
const DESKTOP_DIR_LOWER = DESKTOP_DIR.toLowerCase();

const GRID_W = 84;
const GRID_H = 92;
const TASKBAR_H = 40;

function maxRowsForViewport(): number {
  if (typeof window === 'undefined') return 8;
  const usable = window.innerHeight - TASKBAR_H;
  return Math.max(1, Math.floor(usable / GRID_H));
}

// Special "system" desktop icons that don't live in C:\Windows\User\Desktop.
// FS contents of the desktop folder are auto-managed by syncDesktopFromFs().
// Default-layout order: Recycle Bin, My Computer, LinkedIn, GitHub, then
// everything else. (Resume will be inserted after GitHub when the app ships.)
const DEFAULT_SHORTCUTS: DesktopIcon[] = [
  {
    id: 'icon-recycle',
    label: 'Recycle Bin',
    iconUrl: '/assets/win98/png/recycle_bin_empty-0.png',
    x: 0,
    y: 0,
    target: { kind: 'file', path: 'C:\\Recycle Bin' },
    protected: true,
  },
  {
    id: 'icon-mycomputer',
    label: 'My Computer',
    iconUrl: '/assets/win98/png/computer-0.png',
    x: 0,
    y: 1,
    target: { kind: 'app', appId: 'explorer' },
    protected: true,
  },
  {
    id: 'icon-linkedin',
    label: 'LinkedIn',
    iconUrl: '/assets/misc/linkedin.png',
    x: 0,
    y: 2,
    target: { kind: 'url', url: 'https://www.linkedin.com/in/jared-raiola/' },
    protected: true,
  },
  {
    id: 'icon-github',
    label: 'GitHub',
    iconUrl: '/assets/misc/github.png',
    x: 0,
    y: 3,
    target: { kind: 'url', url: 'https://github.com/JaredRaiola' },
    protected: true,
  },
  {
    id: 'icon-resume',
    label: 'Resume',
    iconUrl: '/assets/win98/png/notepad-0.png',
    x: 0,
    y: 4,
    target: { kind: 'app', appId: 'resume' },
    protected: true,
  },
];

// ---- Tree node helpers used by migration --------------------------------

function findChildKey(dir: DirNode, name: string): string | null {
  const lower = name.toLowerCase();
  for (const k of Object.keys(dir.children)) {
    if (k.toLowerCase() === lower) return k;
  }
  return null;
}

function getOrCreateDir(parent: DirNode, name: string): DirNode {
  const key = findChildKey(parent, name);
  if (key && parent.children[key].kind === 'dir') return parent.children[key] as DirNode;
  const now = Date.now();
  const dir: DirNode = { kind: 'dir', name, children: {}, createdAt: now, modifiedAt: now };
  parent.children[name] = dir;
  parent.modifiedAt = now;
  return dir;
}

function detachChild(parent: DirNode, name: string): FsNode | null {
  const key = findChildKey(parent, name);
  if (!key) return null;
  const node = parent.children[key];
  delete parent.children[key];
  parent.modifiedAt = Date.now();
  return node;
}

/**
 * Migrate legacy filesystem layout to the new one:
 *   C:\My Documents      → C:\Windows\User\My Documents
 *   C:\Windows\Desktop   → C:\Windows\User\Desktop
 *   Any nested Recycle Bin → C:\Recycle Bin
 *   C:\Windows\README.txt → C:\Windows\User\Desktop\README.txt   (very old)
 */
async function migrateFsLayout(): Promise<void> {
  if (localStorage.getItem(FS_LAYOUT_KEY) === FS_LAYOUT_VERSION) return;
  const tree = (await getTree()) as DirNode | null;
  if (!tree) {
    localStorage.setItem(FS_LAYOUT_KEY, FS_LAYOUT_VERSION);
    return;
  }

  const winKey = findChildKey(tree, 'Windows');
  const winDir = winKey ? (tree.children[winKey] as DirNode) : getOrCreateDir(tree, 'Windows');
  const userDir = getOrCreateDir(winDir, 'User');
  const newDesktop = getOrCreateDir(userDir, 'Desktop');

  // My Documents lives under Desktop now. Pull any prior copy back in: first
  // C:\My Documents (very old), then C:\Windows\User\My Documents (recent).
  // If multiple copies exist, the deepest/most-recent layout wins.
  const oldMyDocsAtRoot = detachChild(tree, 'My Documents');
  if (oldMyDocsAtRoot && oldMyDocsAtRoot.kind === 'dir' && !findChildKey(newDesktop, 'My Documents')) {
    newDesktop.children['My Documents'] = oldMyDocsAtRoot;
    newDesktop.modifiedAt = Date.now();
  }
  const oldMyDocsAtUser = detachChild(userDir, 'My Documents');
  if (oldMyDocsAtUser && oldMyDocsAtUser.kind === 'dir' && !findChildKey(newDesktop, 'My Documents')) {
    newDesktop.children['My Documents'] = oldMyDocsAtUser;
    newDesktop.modifiedAt = Date.now();
  }

  // Move C:\Windows\Desktop\* → C:\Windows\User\Desktop\*
  const oldWinDesktopKey = findChildKey(winDir, 'Desktop');
  if (oldWinDesktopKey) {
    const oldWinDesktop = winDir.children[oldWinDesktopKey];
    if (oldWinDesktop.kind === 'dir') {
      for (const [name, child] of Object.entries(oldWinDesktop.children)) {
        if (!findChildKey(newDesktop, name)) {
          newDesktop.children[name] = child;
        }
      }
      delete winDir.children[oldWinDesktopKey];
      winDir.modifiedAt = Date.now();
    }
  }

  // Recycle Bin lives at C:\Recycle Bin. Earlier layouts placed it under the
  // desktop or user dirs — pull any of those copies back to the root.
  const recycleAtDesktop = detachChild(newDesktop, 'Recycle Bin');
  if (recycleAtDesktop && !findChildKey(tree, 'Recycle Bin')) {
    tree.children['Recycle Bin'] = recycleAtDesktop;
    tree.modifiedAt = Date.now();
  }
  const recycleAtUser = detachChild(userDir, 'Recycle Bin');
  if (recycleAtUser && !findChildKey(tree, 'Recycle Bin')) {
    tree.children['Recycle Bin'] = recycleAtUser;
    tree.modifiedAt = Date.now();
  }
  if (!findChildKey(tree, 'Recycle Bin')) {
    getOrCreateDir(tree, 'Recycle Bin');
  }

  // Old README at C:\Windows\README.txt → C:\Windows\User\Desktop\README.txt
  const oldReadme = detachChild(winDir, 'README.txt');
  if (oldReadme && !findChildKey(newDesktop, 'README.txt')) {
    newDesktop.children['README.txt'] = oldReadme;
    newDesktop.modifiedAt = Date.now();
  }

  // Strip stale top-level dupes from the desktop. Projects and About Me.txt
  // belong inside My Documents, not next to it.
  for (const stale of ['Projects', 'About Me.txt']) {
    detachChild(newDesktop, stale);
  }

  await putTree(tree);
  localStorage.setItem(FS_LAYOUT_KEY, FS_LAYOUT_VERSION);
}

async function seedIfEmpty(): Promise<void> {
  const existing = await getTree();
  if (existing) {
    await migrateFsLayout();
    return;
  }
  const tree = buildSeedTree();
  await putTree(tree);

  const walk = (n: FsNode, path: string): { blobId: string; content: string }[] => {
    if (n.kind === 'file') {
      if (path === 'C:\\Windows\\User\\Desktop\\README.txt')
        return [{ blobId: n.blobId, content: SEED_TEXT.README }];
      if (path === 'C:\\Windows\\User\\Desktop\\My Documents\\About Me.txt')
        return [{ blobId: n.blobId, content: SEED_TEXT.ABOUT_ME }];
      return [];
    }
    return Object.entries(n.children).flatMap(([name, child]) =>
      walk(child, path === 'C:\\' || path === 'C:' ? `C:\\${name}` : `${path}\\${name}`),
    );
  };
  for (const { blobId, content } of walk(tree, 'C:\\')) {
    await putBlob(blobId, new Blob([content], { type: 'text/plain' }));
  }
  localStorage.setItem(FS_LAYOUT_KEY, FS_LAYOUT_VERSION);
}

function hydrateDesktop(): void {
  const ver = localStorage.getItem(DESKTOP_VERSION_KEY);
  if (ver !== DESKTOP_VERSION) {
    localStorage.removeItem(DESKTOP_KEY);
    localStorage.setItem(DESKTOP_VERSION_KEY, DESKTOP_VERSION);
  }

  const stored = localStorage.getItem(DESKTOP_KEY);
  if (stored) {
    try {
      const parsed: DesktopIcon[] = JSON.parse(stored);
      useDesktopStore.getState().hydrate(parsed);
      return;
    } catch {
      /* fall through */
    }
  }
  const maxRows = maxRowsForViewport();
  useDesktopStore.getState().hydrate(
    DEFAULT_SHORTCUTS.map((i, idx) => ({
      ...i,
      x: Math.floor(idx / maxRows) * GRID_W,
      y: (idx % maxRows) * GRID_H,
    })),
  );
}

export function persistDesktopOnChange(): void {
  useDesktopStore.subscribe((s) => {
    localStorage.setItem(DESKTOP_KEY, JSON.stringify(Object.values(s.icons)));
  });
}

function isUnderDesktopDir(path: string): boolean {
  return path.toLowerCase().startsWith(DESKTOP_DIR_LOWER + '\\');
}

function iconUrlForNode(n: FsNode): string {
  if (n.kind === 'dir') {
    if (n.name.toLowerCase() === 'recycle bin') return '/assets/win98/png/recycle_bin_empty-0.png';
    return '/assets/win98/png/directory_closed-0.png';
  }
  const ext = extname(n.name);
  if (ext === '.txt') return '/assets/win98/png/notepad-0.png';
  if (ext === '.png') return '/assets/win98/png/paint_old-0.png';
  if (ext === '.url') return '/assets/win98/png/html-0.png';
  if (ext === '.lnk') return '/assets/win98/png/document-0.png';
  return '/assets/win98/png/file_lines-0.png';
}

function nextFreeGridSlot(icons: Record<string, DesktopIcon>): { x: number; y: number } {
  const occupied = new Set<string>();
  for (const i of Object.values(icons)) {
    const col = Math.round(i.x / GRID_W);
    const row = Math.round(i.y / GRID_H);
    occupied.add(`${col},${row}`);
  }
  const maxRows = maxRowsForViewport();
  for (let col = 0; col < 30; col++) {
    for (let row = 0; row < maxRows; row++) {
      if (!occupied.has(`${col},${row}`)) {
        return { x: col * GRID_W, y: row * GRID_H };
      }
    }
  }
  return { x: 0, y: 0 };
}

/** Reconcile desktop icons with the FS contents of C:\Windows\User\Desktop. */
export function syncDesktopFromFs(): void {
  const fs = useFsStore.getState().fs;
  if (!fs || !fs.exists(DESKTOP_DIR)) return;

  const store = useDesktopStore.getState();

  const existing = new Map<string, string>();
  for (const icon of Object.values(store.icons)) {
    if (icon.target.kind === 'file' && isUnderDesktopDir(icon.target.path)) {
      existing.set(icon.target.path.toLowerCase(), icon.id);
    }
  }

  const wanted = new Set<string>();
  for (const node of fs.list(DESKTOP_DIR)) {
    const path = `${DESKTOP_DIR}\\${node.name}`;
    wanted.add(path.toLowerCase());
    if (!existing.has(path.toLowerCase())) {
      const pos = nextFreeGridSlot(useDesktopStore.getState().icons);
      useDesktopStore.getState().add({
        id: uuid(),
        label: node.name,
        iconUrl: iconUrlForNode(node),
        x: pos.x,
        y: pos.y,
        target: { kind: 'file', path },
      });
    }
  }

  for (const [pathLower, iconId] of existing.entries()) {
    if (!wanted.has(pathLower)) {
      useDesktopStore.getState().remove(iconId);
    }
  }
}

function registerAllApps(): void {
  registerApp(notepadMeta);
  registerApp(explorerMeta);
  registerApp(resumeMeta);
  registerApp(controlPanelMeta);
  registerApp(calculatorMeta);
  registerApp(cmdMeta);
  registerApp(paintMeta);
  registerApp(minesweeperMeta);
  registerApp(solitaireMeta);
  registerApp(freecellMeta);
}

export async function boot(): Promise<void> {
  registerAllApps();
  await seedIfEmpty();
  const fs = await createFs();
  useFsStore.getState().setFs(fs);
  const recycleBin = await createRecycleBin(fs);
  useRecycleBinStore.getState().setBin(recycleBin);
  const originalUnlink = fs.unlink.bind(fs);
  fs.unlink = async (path: string) => {
    // Items already inside the Bin can't be re-binned. Defensive: also forward
    // to the original (hard) unlink for any path under the Bin so bin-mode
    // "Permanently Delete" actions don't accidentally route here.
    if (path.toLowerCase().startsWith('c:\\recycle bin')) {
      return originalUnlink(path);
    }
    await recycleBin.sendToBin([path]);
    useRecycleBinStore.getState().refresh();
  };
  // FS bumps drive a refresh in case anything else edits the bin folder.
  useFsStore.subscribe((s, prev) => {
    if (s.bumpVersion !== prev.bumpVersion) {
      useRecycleBinStore.getState().refresh();
    }
  });
  hydrateDesktop();
  persistDesktopOnChange();
  syncDesktopFromFs();
  useFsStore.subscribe((s, prev) => {
    if (s.bumpVersion !== prev.bumpVersion) syncDesktopFromFs();
  });

  // Restore previous session (open windows + per-app state).
  // Best-effort silent — schema mismatch / missing app falls through.
  const sessionSnapshot = loadSnapshot();
  if (sessionSnapshot && sessionSnapshot.windows.length > 0) {
    const ids = sessionSnapshot.windows.map((w) => w.id);
    const sessionBlobs: AllBlobs = await loadBlobs(ids).catch(() => ({}));
    useWindowStore.getState().hydrate(sessionSnapshot, sessionBlobs);
  }

  // Bind auto-save AFTER hydration so the rehydration itself doesn't kick
  // off a save loop with stale getter state.
  bindAutoSave({ buildSnapshot: buildSnapshotFromStore });

  // Fire-and-forget: warm app code chunks + icon caches so first opens are
  // instant. Done after the desktop is hydrated so the icon URLs are known.
  preload();
}

async function buildSnapshotFromStore(): Promise<{ snapshot: SessionSnapshot; blobs: AllBlobs }> {
  const s = useWindowStore.getState();
  const windows: SessionSnapshot['windows'] = [];
  for (const w of Object.values(s.windows)) {
    let appState: unknown;
    try {
      appState = s.snapshotGetters[w.id]?.();
    } catch {
      appState = undefined;
    }
    const blobKeys = Object.keys(s.blobGetters[w.id] ?? {});
    windows.push({
      id: w.id,
      appId: w.appId,
      title: w.title,
      icon: w.icon,
      args: w.args,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
      state: w.state,
      zIndex: w.zIndex,
      focused: s.focusedId === w.id,
      appState,
      blobKeys: blobKeys.length > 0 ? blobKeys : undefined,
    });
  }
  // Resolve blob getters in parallel; tolerate individual failures.
  const blobs: AllBlobs = {};
  await Promise.all(
    Object.entries(s.blobGetters).map(async ([windowId, keyMap]) => {
      blobs[windowId] = {};
      await Promise.all(
        Object.entries(keyMap).map(async ([key, getter]) => {
          try {
            const result = getter();
            blobs[windowId][key] = result instanceof Blob ? result : await result;
          } catch {
            /* skip individual getter failures */
          }
        }),
      );
    }),
  );
  return { snapshot: { version: 1, savedAt: Date.now(), windows }, blobs };
}
