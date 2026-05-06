// src/core/session.ts

export const SESSION_KEY = 'win95.session.v1';
export const SESSION_DB = 'win95-session';
export const SESSION_DB_VERSION = 1;
export const BLOBS_STORE = 'blobs';

export type WindowSnapshot = {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  args: unknown;
  x: number;
  y: number;
  width: number;
  height: number;
  state: 'normal' | 'minimized' | 'maximized';
  zIndex: number;
  focused: boolean;
  appState?: unknown;
  blobKeys?: string[];
};

export type SessionSnapshot = {
  version: 1;
  savedAt: number;
  windows: WindowSnapshot[];
};

export type WindowBlobs = Record<string, Blob>;
export type AllBlobs = Record<string, WindowBlobs>;

export function saveSnapshot(snapshot: SessionSnapshot): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / privacy mode — silent best-effort */
  }
}

export function loadSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    if (parsed.version !== 1) return null;
    if (!Array.isArray(parsed.windows)) return null;
    return parsed as SessionSnapshot;
  } catch {
    return null;
  }
}

type BlobRecord = {
  compoundKey: string;
  windowId: string;
  key: string;
  /** Stored as ArrayBuffer + type (rather than Blob) so it round-trips
   *  reliably through structuredClone in test environments that don't
   *  fully preserve Blob identity. */
  data: ArrayBuffer;
  type: string;
};

function openSessionDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(SESSION_DB, SESSION_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        const store = db.createObjectStore(BLOBS_STORE, { keyPath: 'compoundKey' });
        store.createIndex('byWindowId', 'windowId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Persist blobs and prune anything not in `all` for the windows listed in
 * `liveWindowIds`. Windows entirely absent from `liveWindowIds` get all
 * their blobs deleted.
 */
export async function saveBlobs(all: AllBlobs, liveWindowIds: string[]): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openSessionDb();
  } catch {
    return;
  }
  return new Promise<void>((resolve) => {
    const tx = db.transaction(BLOBS_STORE, 'readwrite');
    const store = tx.objectStore(BLOBS_STORE);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };

    const wantedKeys = new Set<string>();
    for (const [windowId, blobs] of Object.entries(all)) {
      for (const key of Object.keys(blobs)) {
        wantedKeys.add(`${windowId}/${key}`);
      }
    }
    const liveSet = new Set(liveWindowIds);

    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        const rec = cursor.value as BlobRecord;
        const keep = liveSet.has(rec.windowId) && wantedKeys.has(rec.compoundKey);
        if (!keep) cursor.delete();
        cursor.continue();
      } else {
        void (async () => {
          for (const [windowId, blobs] of Object.entries(all)) {
            for (const [key, blob] of Object.entries(blobs)) {
              const data = await blob.arrayBuffer();
              const rec: BlobRecord = {
                compoundKey: `${windowId}/${key}`,
                windowId,
                key,
                data,
                type: blob.type,
              };
              store.put(rec);
            }
          }
        })();
      }
    };
  });
}

export async function loadBlobs(windowIds: string[]): Promise<AllBlobs> {
  if (windowIds.length === 0) return {};
  let db: IDBDatabase;
  try {
    db = await openSessionDb();
  } catch {
    return {};
  }
  return new Promise<AllBlobs>((resolve) => {
    const wanted = new Set(windowIds);
    const out: AllBlobs = {};
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const store = tx.objectStore(BLOBS_STORE);
    tx.oncomplete = () => { db.close(); resolve(out); };
    tx.onerror = () => { db.close(); resolve({}); };
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return;
      const rec = cursor.value as BlobRecord;
      if (wanted.has(rec.windowId)) {
        if (!out[rec.windowId]) out[rec.windowId] = {};
        out[rec.windowId][rec.key] = new Blob([rec.data], { type: rec.type });
      }
      cursor.continue();
    };
  });
}
