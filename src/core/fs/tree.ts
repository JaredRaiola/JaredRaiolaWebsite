import { split, basename, parent } from './paths';

export type DirNode = {
  kind: 'dir';
  name: string;
  children: Record<string, FsNode>;
  createdAt: number;
  modifiedAt: number;
};

export type FileNode = {
  kind: 'file';
  name: string;
  mime: string;
  size: number;
  blobId: string;
  createdAt: number;
  modifiedAt: number;
};

export type FsNode = DirNode | FileNode;

export function makeDir(name: string, now = Date.now()): DirNode {
  return { kind: 'dir', name, children: {}, createdAt: now, modifiedAt: now };
}

export function makeFile(name: string, mime: string, size: number, blobId: string, now = Date.now()): FileNode {
  return { kind: 'file', name, mime, size, blobId, createdAt: now, modifiedAt: now };
}

function findChildKey(dir: DirNode, name: string): string | null {
  const lower = name.toLowerCase();
  for (const k of Object.keys(dir.children)) {
    if (k.toLowerCase() === lower) return k;
  }
  return null;
}

export function getNode(root: DirNode, path: string): FsNode | null {
  const parts = split(path);
  if (parts.length === 0) return null;
  if (parts[0].toLowerCase() !== root.name.toLowerCase()) return null;
  let cur: FsNode = root;
  for (let i = 1; i < parts.length; i++) {
    if (cur.kind !== 'dir') return null;
    const key = findChildKey(cur, parts[i]);
    if (!key) return null;
    cur = cur.children[key];
  }
  return cur;
}

export function insertNode(root: DirNode, path: string, node: FsNode): void {
  const parentPath = parent(path);
  if (!parentPath) throw new Error(`Cannot insert at root: ${path}`);
  const p = getNode(root, parentPath);
  if (!p || p.kind !== 'dir') throw new Error(`Parent not found or not a dir: ${parentPath}`);
  const name = basename(path);
  const existing = findChildKey(p, name);
  if (existing) delete p.children[existing];
  p.children[name] = node;
  p.modifiedAt = Date.now();
}

export function removeNode(root: DirNode, path: string): void {
  const parentPath = parent(path);
  if (!parentPath) throw new Error(`Cannot remove root: ${path}`);
  const p = getNode(root, parentPath);
  if (!p || p.kind !== 'dir') return;
  const name = basename(path);
  const key = findChildKey(p, name);
  if (key) {
    delete p.children[key];
    p.modifiedAt = Date.now();
  }
}

export function listChildren(root: DirNode, path: string): FsNode[] {
  const node = getNode(root, path);
  if (!node || node.kind !== 'dir') return [];
  return Object.values(node.children).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}
