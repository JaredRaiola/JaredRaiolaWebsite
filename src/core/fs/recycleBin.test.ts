import { describe, it, expect, beforeEach } from 'vitest';
import { createFs } from './index';
import { makeDir } from './tree';
import {
  RECYCLE_BIN_DIR,
  RECYCLE_INDEX_PATH,
  createRecycleBin,
  type RecycleEntry,
} from './recycleBin';

const seedRoot = () => {
  const root = makeDir('C:');
  return root;
};

describe('recycleBin index IO', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('win95-fs');
  });

  it('loadIndex on a fresh FS returns an empty index and creates the bin dir', async () => {
    const fs = await createFs(seedRoot());
    const bin = await createRecycleBin(fs);
    expect(bin.list()).toEqual([]);
    expect(fs.exists(RECYCLE_BIN_DIR)).toBe(true);
  });

  it('treats a corrupt .index.json as empty without throwing or hard-deleting orphans', async () => {
    const fs = await createFs(seedRoot());
    await fs.mkdir(RECYCLE_BIN_DIR);
    await fs.writeText(RECYCLE_INDEX_PATH, 'not-json');
    await fs.writeText(`${RECYCLE_BIN_DIR}\\orphan.txt`, 'x');
    const bin = await createRecycleBin(fs);
    expect(bin.list()).toEqual([]);
    expect(fs.exists(`${RECYCLE_BIN_DIR}\\orphan.txt`)).toBe(true);
  });

  it('round-trips an entry through saveIndex/loadIndex', async () => {
    const fs = await createFs(seedRoot());
    const bin = await createRecycleBin(fs);
    const entry: RecycleEntry = {
      id: 'abc',
      binName: 'note.txt',
      originPath: 'C:\\Windows\\User\\Desktop\\note.txt',
      deletedAt: 1700000000000,
      kind: 'file',
      size: 5,
    };
    await (bin as unknown as { _saveIndexForTests(entries: RecycleEntry[]): Promise<void> })
      ._saveIndexForTests([entry]);
    const reloaded = await createRecycleBin(fs);
    expect(reloaded.list()).toEqual([entry]);
  });
});
