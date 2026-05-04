import type { FS } from './index';
import { uuid } from '@/lib/uuid';
import { basename, parent, extname, join } from './paths';
import type { FsNode } from './tree';

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

const splitNameExt = (name: string): { stem: string; ext: string } => {
  const ext = extname(name);
  return { stem: ext ? name.slice(0, -ext.length) : name, ext };
};

const computeSize = (node: FsNode): number => {
  if (node.kind === 'file') return node.size;
  return Object.values(node.children).reduce((sum, c) => sum + computeSize(c), 0);
};

const findUniqueBinName = (
  fs: FS,
  entries: RecycleEntry[],
  desired: string,
): string => {
  const taken = new Set<string>(entries.map((e) => e.binName.toLowerCase()));
  const exists = (name: string) =>
    taken.has(name.toLowerCase()) || fs.exists(`${RECYCLE_BIN_DIR}\\${name}`);
  if (!exists(desired)) return desired;
  const { stem, ext } = splitNameExt(desired);
  for (let i = 2; i < 10000; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!exists(candidate)) return candidate;
  }
  return `${stem} (${Date.now()})${ext}`;
};

const findUniqueOriginName = (fs: FS, originPath: string): string => {
  const par = parent(originPath);
  const desired = basename(originPath);
  if (!par) return desired;
  const exists = (name: string) => fs.exists(join(par, name));
  if (!exists(desired)) return desired;
  const { stem, ext } = splitNameExt(desired);
  for (let i = 2; i < 10000; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!exists(candidate)) return candidate;
  }
  return `${stem} (${Date.now()})${ext}`;
};

export async function createRecycleBin(fs: FS): Promise<RecycleBin> {
  if (!fs.exists(RECYCLE_BIN_DIR)) await fs.mkdir(RECYCLE_BIN_DIR);
  let entries = await loadIndex(fs);

  const api: RecycleBin & { _saveIndexForTests(entries: RecycleEntry[]): Promise<void> } = {
    async sendToBin(paths) {
      const filtered = paths.filter(
        (p) => !isUnderBin(p) && fs.exists(p),
      );
      if (filtered.length === 0) return [];
      const created: RecycleEntry[] = [];
      for (const path of filtered) {
        const node = fs.stat(path);
        if (!node) continue;
        const desired = basename(path);
        const binName = findUniqueBinName(fs, [...entries, ...created], desired);
        await fs.move(path, `${RECYCLE_BIN_DIR}\\${binName}`);
        const movedNode = fs.stat(`${RECYCLE_BIN_DIR}\\${binName}`);
        if (!movedNode) continue;
        created.push({
          id: uuid(),
          binName,
          originPath: path,
          deletedAt: Date.now(),
          kind: movedNode.kind,
          size: computeSize(movedNode),
        });
      }
      entries = [...entries, ...created];
      await saveIndex(fs, entries);
      return created;
    },
    async restore(id, conflictResolution) {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return { restored: false };
      if (conflictResolution === 'cancel') return { restored: false };

      const binPath = `${RECYCLE_BIN_DIR}\\${entry.binName}`;
      const conflict = fs.exists(entry.originPath);

      let destPath = entry.originPath;
      if (conflict) {
        if (conflictResolution === 'replace') {
          await fs.unlinkPermanent(entry.originPath);
        } else if (conflictResolution === 'rename') {
          const par = parent(entry.originPath);
          destPath = par
            ? join(par, findUniqueOriginName(fs, entry.originPath))
            : entry.originPath;
        }
      }

      await fs.move(binPath, destPath);
      entries = entries.filter((e) => e.id !== id);
      await saveIndex(fs, entries);
      return { restored: true, restoredPath: destPath };
    },
    async permanentlyDelete(id) {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      const binPath = `${RECYCLE_BIN_DIR}\\${entry.binName}`;
      if (fs.exists(binPath)) await fs.unlinkPermanent(binPath);
      entries = entries.filter((e) => e.id !== id);
      await saveIndex(fs, entries);
    },
    async empty() {
      for (const entry of entries) {
        const binPath = `${RECYCLE_BIN_DIR}\\${entry.binName}`;
        if (fs.exists(binPath)) await fs.unlinkPermanent(binPath);
      }
      entries = [];
      await saveIndex(fs, entries);
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
