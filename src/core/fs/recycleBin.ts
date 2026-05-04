import type { FS } from './index';
import { uuid } from '@/lib/uuid';

export const RECYCLE_BIN_DIR = 'C:\\Recycle Bin';
export const RECYCLE_INDEX_PATH = 'C:\\Recycle Bin\\.index.json';
const RECYCLE_INDEX_VERSION = 1 as const;

export type RecycleEntry = {
  id: string;
  binName: string;
  originPath: string;
  deletedAt: number;
  kind: 'file' | 'dir';
  size: number;
};

type RecycleIndex = { version: typeof RECYCLE_INDEX_VERSION; entries: RecycleEntry[] };

export type RecycleBin = {
  sendToBin(paths: string[]): Promise<RecycleEntry[]>;
  restore(
    id: string,
    conflictResolution: 'replace' | 'rename' | 'cancel',
  ): Promise<{ restored: boolean; restoredPath?: string }>;
  permanentlyDelete(id: string): Promise<void>;
  empty(): Promise<void>;
  list(): RecycleEntry[];
  hasOrigin(originPath: string): boolean;
};

const isUnderBin = (path: string): boolean =>
  path.toLowerCase() === RECYCLE_BIN_DIR.toLowerCase() ||
  path.toLowerCase().startsWith(RECYCLE_BIN_DIR.toLowerCase() + '\\');

const loadIndex = async (fs: FS): Promise<RecycleEntry[]> => {
  if (!fs.exists(RECYCLE_INDEX_PATH)) return [];
  try {
    const raw = await fs.readText(RECYCLE_INDEX_PATH);
    const parsed = JSON.parse(raw) as RecycleIndex;
    if (parsed?.version !== RECYCLE_INDEX_VERSION || !Array.isArray(parsed.entries)) return [];
    return parsed.entries;
  } catch {
    return [];
  }
};

const saveIndex = async (fs: FS, entries: RecycleEntry[]): Promise<void> => {
  const idx: RecycleIndex = { version: RECYCLE_INDEX_VERSION, entries };
  await fs.writeText(RECYCLE_INDEX_PATH, JSON.stringify(idx));
};

export async function createRecycleBin(fs: FS): Promise<RecycleBin> {
  if (!fs.exists(RECYCLE_BIN_DIR)) await fs.mkdir(RECYCLE_BIN_DIR);
  let entries = await loadIndex(fs);
  // entries used by closures below; keep a `void` reference until later tasks
  // wire sendToBin/restore/etc. so TS doesn't flag it as unused.
  void entries;
  void uuid;

  const api: RecycleBin & { _saveIndexForTests(entries: RecycleEntry[]): Promise<void> } = {
    async sendToBin(_paths) {
      throw new Error('Not implemented yet');
    },
    async restore(_id, _conflictResolution) {
      throw new Error('Not implemented yet');
    },
    async permanentlyDelete(_id) {
      throw new Error('Not implemented yet');
    },
    async empty() {
      throw new Error('Not implemented yet');
    },
    list: () => entries,
    hasOrigin: (origin) => entries.some((e) => e.originPath.toLowerCase() === origin.toLowerCase()),
    async _saveIndexForTests(next) {
      entries = next;
      await saveIndex(fs, next);
    },
  };
  return api;
}

export const _internalForTests = { isUnderBin };
