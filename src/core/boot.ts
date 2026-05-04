import { createFs } from '@/core/fs';
import { getTree, putTree, putBlob } from '@/core/fs/indexeddb';
import { buildSeedTree, SEED_TEXT } from '@/core/fs/seed';
import { useFsStore } from '@/stores/fsStore';
import { useDesktopStore, type DesktopIcon } from '@/stores/desktopStore';
import notepadMeta from '@/apps/notepad/meta';
import explorerMeta from '@/apps/explorer/meta';
import { registerApp } from '@/core/apps/registry';
import { uuid } from '@/lib/uuid';
import { extname } from '@/core/fs/paths';
import type { FsNode, DirNode } from '@/core/fs/tree';

const DESKTOP_KEY = 'win95.desktop.icons';
const DESKTOP_VERSION_KEY = 'win95.desktop.version';
const DESKTOP_VERSION = '5';
const FS_LAYOUT_KEY = 'win95.fs.layout';
const FS_LAYOUT_VERSION = '3';

export const DESKTOP_DIR = 'C:\\Windows\\User\\Desktop';
const DESKTOP_DIR_LOWER = DESKTOP_DIR.toLowerCase();

const GRID_W = 84;
const GRID_H = 92;

// Special "system" desktop icons that don't live in C:\Windows\User\Desktop.
// FS contents of the desktop folder are auto-managed by syncDesktopFromFs().
// Row 3 is reserved so the auto-synced README slots there.
const DEFAULT_SHORTCUTS: DesktopIcon[] = [
  {
    id: 'icon-mycomputer',
    label: 'My Computer',
    iconUrl: '/assets/win98/png/computer-0.png',
    x: 0,
    y: 0,
    target: { kind: 'app', appId: 'explorer' },
  },
  {
    id: 'icon-recycle',
    label: 'Recycle Bin',
    iconUrl: '/assets/win98/png/recycle_bin_empty-0.png',
    x: 0,
    y: 1,
    target: { kind: 'file', path: 'C:\\Windows\\User\\Desktop\\Recycle Bin' },
  },
  {
    id: 'icon-mydocs',
    label: 'My Documents',
    iconUrl: '/assets/win98/png/directory_closed-0.png',
    x: 0,
    y: 2,
    target: { kind: 'file', path: 'C:\\Windows\\User\\My Documents' },
  },
  {
    id: 'icon-github',
    label: 'GitHub',
    iconUrl: '/assets/misc/github.png',
    x: 0,
    y: 4,
    target: { kind: 'url', url: 'https://github.com/JaredRaiola' },
  },
  {
    id: 'icon-linkedin',
    label: 'LinkedIn',
    iconUrl: '/assets/misc/linkedin.png',
    x: 0,
    y: 5,
    target: { kind: 'url', url: 'https://www.linkedin.com/in/jared-raiola/' },
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
 *   C:\Recycle Bin       → C:\Windows\User\Desktop\Recycle Bin
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

  // Move C:\My Documents → C:\Windows\User\My Documents
  const oldMyDocs = detachChild(tree, 'My Documents');
  if (oldMyDocs && !findChildKey(userDir, 'My Documents')) {
    userDir.children['My Documents'] = oldMyDocs;
    userDir.modifiedAt = Date.now();
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

  // Move C:\Recycle Bin → C:\Windows\User\Desktop\Recycle Bin (so it shows on
  // the desktop). Also relocate any leftover at C:\Windows\User\Recycle Bin
  // from a prior intermediate layout.
  const oldRecycleAtRoot = detachChild(tree, 'Recycle Bin');
  if (oldRecycleAtRoot && !findChildKey(newDesktop, 'Recycle Bin')) {
    newDesktop.children['Recycle Bin'] = oldRecycleAtRoot;
    newDesktop.modifiedAt = Date.now();
  }
  const oldRecycleAtUser = detachChild(userDir, 'Recycle Bin');
  if (oldRecycleAtUser && !findChildKey(newDesktop, 'Recycle Bin')) {
    newDesktop.children['Recycle Bin'] = oldRecycleAtUser;
    newDesktop.modifiedAt = Date.now();
  }
  if (!findChildKey(newDesktop, 'Recycle Bin')) {
    getOrCreateDir(newDesktop, 'Recycle Bin');
  }

  // Old README at C:\Windows\README.txt → C:\Windows\User\Desktop\README.txt
  const oldReadme = detachChild(winDir, 'README.txt');
  if (oldReadme && !findChildKey(newDesktop, 'README.txt')) {
    newDesktop.children['README.txt'] = oldReadme;
    newDesktop.modifiedAt = Date.now();
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
      if (path === 'C:\\Windows\\User\\My Documents\\About Me.txt')
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
  useDesktopStore.getState().hydrate(
    DEFAULT_SHORTCUTS.map((i) => ({ ...i, x: i.x * GRID_W, y: i.y * GRID_H })),
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
  for (let col = 0; col < 30; col++) {
    for (let row = 0; row < 30; row++) {
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
}

export async function boot(): Promise<void> {
  registerAllApps();
  await seedIfEmpty();
  const fs = await createFs();
  useFsStore.getState().setFs(fs);
  hydrateDesktop();
  persistDesktopOnChange();
  syncDesktopFromFs();
  useFsStore.subscribe((s, prev) => {
    if (s.bumpVersion !== prev.bumpVersion) syncDesktopFromFs();
  });
}
