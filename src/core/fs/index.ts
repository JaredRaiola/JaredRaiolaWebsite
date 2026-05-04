import { uuid } from '@/lib/uuid';
import {
  putTree,
  getTree,
  putBlob,
  getBlob,
  deleteBlob,
  openFsDb,
} from './indexeddb';
import {
  type DirNode,
  type FsNode,
  getNode,
  insertNode,
  removeNode,
  listChildren,
  makeDir,
  makeFile,
} from './tree';
import { parent, basename, extname } from './paths';

export type FS = {
  list(path: string): FsNode[];
  stat(path: string): FsNode | null;
  exists(path: string): boolean;
  mkdir(path: string): Promise<void>;
  rmdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
  readBlob(path: string): Promise<Blob>;
  writeBlob(path: string, blob: Blob, mime: string): Promise<void>;
  unlink(path: string): Promise<void>;
  unlinkPermanent(path: string): Promise<void>;
  ext(path: string): string;
  _root(): DirNode;
};

export async function createFs(initialRoot?: DirNode): Promise<FS> {
  await openFsDb();
  let root: DirNode = initialRoot ?? ((await getTree()) as DirNode | null) ?? makeDir('C:');

  let pendingFlush: ReturnType<typeof setTimeout> | null = null;
  const schedulePersist = (): void => {
    if (pendingFlush) clearTimeout(pendingFlush);
    pendingFlush = setTimeout(() => void putTree(root), 150);
  };

  const requireDir = (path: string): DirNode => {
    const n = getNode(root, path);
    if (!n) throw new Error(`Not found: ${path}`);
    if (n.kind !== 'dir') throw new Error(`Not a directory: ${path}`);
    return n;
  };
  const requireFile = (path: string) => {
    const n = getNode(root, path);
    if (!n) throw new Error(`Not found: ${path}`);
    if (n.kind !== 'file') throw new Error(`Not a file: ${path}`);
    return n;
  };

  return {
    list: (p) => listChildren(root, p),
    stat: (p) => getNode(root, p),
    exists: (p) => getNode(root, p) !== null,

    async mkdir(path) {
      if (getNode(root, path)) return;
      const parentPath = parent(path);
      if (!parentPath) throw new Error(`Cannot mkdir root: ${path}`);
      requireDir(parentPath);
      insertNode(root, path, makeDir(basename(path)));
      schedulePersist();
    },

    async rmdir(path, opts) {
      const node = getNode(root, path);
      if (!node || node.kind !== 'dir') return;
      const children = Object.values(node.children);
      if (children.length > 0 && !opts?.recursive) {
        throw new Error(`Directory not empty: ${path}`);
      }
      const collectBlobIds = (n: FsNode): string[] => {
        if (n.kind === 'file') return [n.blobId];
        return Object.values(n.children).flatMap(collectBlobIds);
      };
      const blobIds = collectBlobIds(node);
      removeNode(root, path);
      for (const id of blobIds) await deleteBlob(id);
      schedulePersist();
    },

    async rename(from, to) {
      const node = getNode(root, from);
      if (!node) throw new Error(`Not found: ${from}`);
      if (getNode(root, to)) throw new Error(`Destination exists: ${to}`);
      const parentTo = parent(to);
      if (!parentTo) throw new Error(`Invalid destination: ${to}`);
      requireDir(parentTo);
      const renamed = { ...node, name: basename(to), modifiedAt: Date.now() };
      removeNode(root, from);
      insertNode(root, to, renamed as FsNode);
      schedulePersist();
    },

    async move(from, to) {
      return this.rename(from, to);
    },

    async readText(path) {
      const f = requireFile(path);
      const blob = await getBlob(f.blobId);
      if (!blob) throw new Error(`Blob missing: ${path}`);
      return blob.text();
    },

    async writeText(path, content) {
      const blob = new Blob([content], { type: 'text/plain' });
      await this.writeBlob(path, blob, 'text/plain');
    },

    async readBlob(path) {
      const f = requireFile(path);
      const blob = await getBlob(f.blobId);
      if (!blob) throw new Error(`Blob missing: ${path}`);
      return blob;
    },

    async writeBlob(path, blob, mime) {
      const parentPath = parent(path);
      if (!parentPath) throw new Error(`Invalid path: ${path}`);
      requireDir(parentPath);
      const existing = getNode(root, path);
      const blobId = existing && existing.kind === 'file' ? existing.blobId : uuid();
      await putBlob(blobId, blob);
      insertNode(root, path, makeFile(basename(path), mime, blob.size, blobId));
      schedulePersist();
    },

    async unlink(path) {
      // Phase 1: hard delete (Phase 2 will route to Recycle Bin)
      return this.unlinkPermanent(path);
    },

    async unlinkPermanent(path) {
      const node = getNode(root, path);
      if (!node) return;
      if (node.kind === 'dir') {
        return this.rmdir(path, { recursive: true });
      }
      await deleteBlob(node.blobId);
      removeNode(root, path);
      schedulePersist();
    },

    ext: (p) => extname(basename(p)),

    _root: () => root,
  };
}
