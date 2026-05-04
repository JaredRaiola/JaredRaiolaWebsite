import { openDB, type IDBPDatabase } from 'idb';
import type { FsNode } from './tree';

const DB_NAME = 'win95-fs';
const DB_VERSION = 1;
const TREE_STORE = 'tree';
const BLOB_STORE = 'blobs';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function openFsDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TREE_STORE)) db.createObjectStore(TREE_STORE);
        if (!db.objectStoreNames.contains(BLOB_STORE)) db.createObjectStore(BLOB_STORE);
      },
    });
  }
  return dbPromise;
}

export async function getTree(): Promise<FsNode | null> {
  const db = await openFsDb();
  return (await db.get(TREE_STORE, 'root')) ?? null;
}

export async function putTree(tree: FsNode): Promise<void> {
  const db = await openFsDb();
  await db.put(TREE_STORE, tree, 'root');
}

type StoredBlob = { buffer: ArrayBuffer; type: string };

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await openFsDb();
  const stored: StoredBlob | undefined = await db.get(BLOB_STORE, id);
  if (!stored) return null;
  return new Blob([stored.buffer], { type: stored.type });
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openFsDb();
  const buffer = await blob.arrayBuffer();
  const stored: StoredBlob = { buffer, type: blob.type };
  await db.put(BLOB_STORE, stored, id);
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await openFsDb();
  await db.delete(BLOB_STORE, id);
}

export function _resetForTests(): void {
  dbPromise = null;
}
