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
import type { FsNode } from '@/core/fs/tree';

const DESKTOP_KEY = 'win95.desktop.icons';
const DESKTOP_VERSION_KEY = 'win95.desktop.version';
const DESKTOP_VERSION = '3';
const DESKTOP_DIR = 'C:\\Windows\\Desktop';
const DESKTOP_DIR_LOWER = DESKTOP_DIR.toLowerCase();
const GRID_W = 84;
const GRID_H = 92;

// Special "system" desktop icons that don't live in C:\Windows\Desktop. Anything
// in C:\Windows\Desktop is auto-managed by syncDesktopFromFs() instead.
// Note row 3 is intentionally skipped so the auto-synced README desktop file
// lands there (nextFreeGridSlot fills the first empty cell).
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
    target: { kind: 'file', path: 'C:\\Recycle Bin' },
  },
  {
    id: 'icon-mydocs',
    label: 'My Documents',
    iconUrl: '/assets/win98/png/directory_closed-0.png',
    x: 0,
    y: 2,
    target: { kind: 'file', path: 'C:\\My Documents' },
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

async function migrateOldReadme(): Promise<void> {
  // One-time fixup: if the seed previously placed README at
  // C:\Windows\README.txt and the new location is empty, walk the existing
  // tree to migrate the file so existing users see the desktop README.
  const tree = await getTree();
  if (!tree) return;
  const findChild = (dir: any, name: string): any =>
    Object.values(dir.children).find((c: any) => c.name.toLowerCase() === name.toLowerCase());
  const winDir = findChild(tree, 'Windows');
  if (!winDir || winDir.kind !== 'dir') return;
  const oldReadme = findChild(winDir, 'README.txt');
  const desktopDir = findChild(winDir, 'Desktop');
  if (!oldReadme || oldReadme.kind !== 'file') return;
  if (!desktopDir || desktopDir.kind !== 'dir') return;
  if (findChild(desktopDir, 'README.txt')) return;
  // Move the node by mutating in place, then persist.
  desktopDir.children['README.txt'] = oldReadme;
  delete winDir.children['README.txt'];
  await putTree(tree);
}

async function seedIfEmpty(): Promise<void> {
  const existing = await getTree();
  if (existing) {
    await migrateOldReadme();
    return;
  }
  const tree = buildSeedTree();
  await putTree(tree);

  // Walk tree, write blob content for any seeded text files
  const walk = (n: FsNode, path: string): { blobId: string; content: string }[] => {
    if (n.kind === 'file') {
      if (path === 'C:\\Windows\\Desktop\\README.txt') return [{ blobId: n.blobId, content: SEED_TEXT.README }];
      if (path === 'C:\\My Documents\\About Me.txt') return [{ blobId: n.blobId, content: SEED_TEXT.ABOUT_ME }];
      return [];
    }
    return Object.entries(n.children).flatMap(([name, child]) =>
      walk(child, path === 'C:\\' || path === 'C:' ? `C:\\${name}` : `${path}\\${name}`),
    );
  };
  for (const { blobId, content } of walk(tree, 'C:\\')) {
    await putBlob(blobId, new Blob([content], { type: 'text/plain' }));
  }
}

function hydrateDesktop(): void {
  const ver = localStorage.getItem(DESKTOP_VERSION_KEY);
  if (ver !== DESKTOP_VERSION) {
    // Schema migration: clear stored positions so the new shortcut set takes effect.
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
      // fall through
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
  const lower = path.toLowerCase();
  return lower.startsWith(DESKTOP_DIR_LOWER + '\\');
}

function iconUrlForNode(n: FsNode): string {
  if (n.kind === 'dir') return '/assets/win98/png/directory_closed-0.png';
  const ext = extname(n.name);
  if (ext === '.txt') return '/assets/win98/png/notepad-0.png';
  return '/assets/win98/png/file_lines-0.png';
}

function nextFreeGridSlot(icons: Record<string, DesktopIcon>): { x: number; y: number } {
  const occupied = new Set<string>();
  for (const i of Object.values(icons)) {
    const col = Math.round(i.x / GRID_W);
    const row = Math.round(i.y / GRID_H);
    occupied.add(`${col},${row}`);
  }
  // Search column-by-column starting at (0,0).
  for (let col = 0; col < 30; col++) {
    for (let row = 0; row < 30; row++) {
      if (!occupied.has(`${col},${row}`)) {
        return { x: col * GRID_W, y: row * GRID_H };
      }
    }
  }
  return { x: 0, y: 0 };
}

/** Reconcile desktop icons with the FS contents of C:\Windows\Desktop. */
export function syncDesktopFromFs(): void {
  const fs = useFsStore.getState().fs;
  if (!fs || !fs.exists(DESKTOP_DIR)) return;

  const store = useDesktopStore.getState();

  // Map of currently-rendered icons backed by C:\Windows\Desktop entries.
  const existing = new Map<string, string>(); // pathLower -> iconId
  for (const icon of Object.values(store.icons)) {
    if (icon.target.kind === 'file' && isUnderDesktopDir(icon.target.path)) {
      existing.set(icon.target.path.toLowerCase(), icon.id);
    }
  }

  // Files/folders that should have icons.
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

  // Remove icons whose backing file is gone.
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
  // Re-sync whenever the FS bumps (file added/removed/moved).
  useFsStore.subscribe((s, prev) => {
    if (s.bumpVersion !== prev.bumpVersion) syncDesktopFromFs();
  });
}
