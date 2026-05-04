import { createFs } from '@/core/fs';
import { getTree, putTree, putBlob } from '@/core/fs/indexeddb';
import { buildSeedTree, SEED_TEXT } from '@/core/fs/seed';
import { useFsStore } from '@/stores/fsStore';
import { useDesktopStore, type DesktopIcon } from '@/stores/desktopStore';
import notepadMeta from '@/apps/notepad/meta';
import explorerMeta from '@/apps/explorer/meta';
import { registerApp } from '@/core/apps/registry';
import type { FsNode } from '@/core/fs/tree';

const DESKTOP_KEY = 'win95.desktop.icons';

const DEFAULT_ICONS: DesktopIcon[] = [
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
    id: 'icon-readme',
    label: 'README.txt',
    iconUrl: '/assets/win98/png/notepad-0.png',
    x: 0,
    y: 3,
    target: { kind: 'file', path: 'C:\\Windows\\README.txt' },
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

async function seedIfEmpty(): Promise<void> {
  const existing = await getTree();
  if (existing) return;
  const tree = buildSeedTree();
  await putTree(tree);

  // Walk tree, write blob content for any seeded text files
  const walk = (n: FsNode, path: string): { blobId: string; content: string }[] => {
    if (n.kind === 'file') {
      if (path === 'C:\\Windows\\README.txt') return [{ blobId: n.blobId, content: SEED_TEXT.README }];
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
  const stored = localStorage.getItem(DESKTOP_KEY);
  if (stored) {
    try {
      const parsed: DesktopIcon[] = JSON.parse(stored);
      useDesktopStore.getState().hydrate(parsed);
      return;
    } catch {
      // fall through to defaults
    }
  }
  // Convert default grid coords (col, row) to pixel coords
  useDesktopStore.getState().hydrate(DEFAULT_ICONS.map((i) => ({ ...i, x: i.x * 84, y: i.y * 92 })));
}

export function persistDesktopOnChange(): void {
  useDesktopStore.subscribe((s) => {
    localStorage.setItem(DESKTOP_KEY, JSON.stringify(Object.values(s.icons)));
  });
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
}
