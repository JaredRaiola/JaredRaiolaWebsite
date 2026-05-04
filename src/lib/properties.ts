import type { FsNode } from '@/core/fs/tree';
import type { FS } from '@/core/fs';

export type PropertiesArgs = { node: FsNode; path: string; fs: FS };
type Subscriber = (args: PropertiesArgs, resolve: () => void) => void;

let subscriber: Subscriber | null = null;
export function _setPropertiesSubscriber(fn: Subscriber | null): void { subscriber = fn; }

export function showProperties(args: PropertiesArgs): Promise<void> {
  return new Promise((resolve) => {
    if (!subscriber) { resolve(); return; }
    subscriber(args, resolve);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 ? 0 : (v >= 10 ? 1 : 2))} ${units[i]} (${bytes.toLocaleString()} bytes)`;
}

export function computeFolderStats(fs: FS, dirPath: string): { files: number; folders: number; size: number } {
  let files = 0, folders = 0, size = 0;
  const walk = (path: string) => {
    for (const child of fs.list(path)) {
      if (child.kind === 'file') { files++; size += child.size; }
      else { folders++; walk(`${path}\\${child.name}`); }
    }
  };
  walk(dirPath);
  return { files, folders, size };
}

export function fileTypeFromExt(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return 'File';
  const ext = name.slice(dot + 1).toLowerCase();
  switch (ext) {
    case 'txt': return 'Text Document';
    case 'png': return 'PNG Image';
    case 'jpg':
    case 'jpeg': return 'JPEG Image';
    case 'lnk': return 'Shortcut';
    case 'url': return 'Internet Shortcut';
    case 'rtf': return 'Rich Text Document';
    default: return `${ext.toUpperCase()} File`;
  }
}
