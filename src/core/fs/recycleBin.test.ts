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

describe('recycleBin.sendToBin', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('win95-fs');
  });

  it('moves a file to the bin and records an entry', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\note.txt', 'hello');
    const bin = await createRecycleBin(fs);
    const created = await bin.sendToBin(['C:\\note.txt']);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      binName: 'note.txt',
      originPath: 'C:\\note.txt',
      kind: 'file',
      size: 5,
    });
    expect(fs.exists('C:\\note.txt')).toBe(false);
    expect(fs.exists('C:\\Recycle Bin\\note.txt')).toBe(true);
    expect(bin.list()).toHaveLength(1);
  });

  it('appends " (2)", " (3)" on basename collision in the bin', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\note.txt', 'A');
    await fs.mkdir('C:\\sub');
    await fs.writeText('C:\\sub\\note.txt', 'B');
    const bin = await createRecycleBin(fs);
    await bin.sendToBin(['C:\\note.txt']);
    await bin.sendToBin(['C:\\sub\\note.txt']);
    const names = bin.list().map((e) => e.binName).sort();
    expect(names).toEqual(['note (2).txt', 'note.txt']);
  });

  it('moves a folder and computes total size from contained files', async () => {
    const fs = await createFs(seedRoot());
    await fs.mkdir('C:\\Folder');
    await fs.writeText('C:\\Folder\\a.txt', 'aa');
    await fs.writeText('C:\\Folder\\b.txt', 'bbb');
    const bin = await createRecycleBin(fs);
    const [entry] = await bin.sendToBin(['C:\\Folder']);
    expect(entry.kind).toBe('dir');
    expect(entry.size).toBe(5);
    expect(fs.exists('C:\\Recycle Bin\\Folder\\a.txt')).toBe(true);
  });

  it('silently filters paths that are the bin itself, the index file, or anything under the bin', async () => {
    const fs = await createFs(seedRoot());
    const bin = await createRecycleBin(fs);
    await fs.writeText('C:\\Recycle Bin\\already-here.txt', 'x');
    const created = await bin.sendToBin([
      'C:\\Recycle Bin',
      'C:\\Recycle Bin\\.index.json',
      'C:\\Recycle Bin\\already-here.txt',
      'C:\\does-not-exist.txt',
    ]);
    expect(created).toEqual([]);
  });

  it('writes the index once per call regardless of input length', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\a.txt', '1');
    await fs.writeText('C:\\b.txt', '22');
    const bin = await createRecycleBin(fs);
    await bin.sendToBin(['C:\\a.txt', 'C:\\b.txt']);
    const reloaded = await createRecycleBin(fs);
    expect(reloaded.list()).toHaveLength(2);
  });
});

describe('recycleBin.restore', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('win95-fs');
  });

  it('restores cleanly when the origin path is free', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\note.txt', 'hi');
    const bin = await createRecycleBin(fs);
    const [entry] = await bin.sendToBin(['C:\\note.txt']);
    const result = await bin.restore(entry.id, 'replace');
    expect(result).toEqual({ restored: true, restoredPath: 'C:\\note.txt' });
    expect(fs.exists('C:\\note.txt')).toBe(true);
    expect(await fs.readText('C:\\note.txt')).toBe('hi');
    expect(bin.list()).toEqual([]);
  });

  it('replace overwrites a conflicting target', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\note.txt', 'old');
    const bin = await createRecycleBin(fs);
    const [entry] = await bin.sendToBin(['C:\\note.txt']);
    await fs.writeText('C:\\note.txt', 'new');
    const result = await bin.restore(entry.id, 'replace');
    expect(result.restored).toBe(true);
    expect(await fs.readText('C:\\note.txt')).toBe('old');
  });

  it('rename produces a unique sibling name at the origin', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\note.txt', 'old');
    const bin = await createRecycleBin(fs);
    const [entry] = await bin.sendToBin(['C:\\note.txt']);
    await fs.writeText('C:\\note.txt', 'new');
    const result = await bin.restore(entry.id, 'rename');
    expect(result.restored).toBe(true);
    expect(result.restoredPath).toBe('C:\\note (2).txt');
    expect(fs.exists('C:\\note.txt')).toBe(true);
    expect(fs.exists('C:\\note (2).txt')).toBe(true);
  });

  it('cancel is a no-op and keeps the entry', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\note.txt', 'old');
    const bin = await createRecycleBin(fs);
    const [entry] = await bin.sendToBin(['C:\\note.txt']);
    await fs.writeText('C:\\note.txt', 'new');
    const result = await bin.restore(entry.id, 'cancel');
    expect(result).toEqual({ restored: false });
    expect(bin.list()).toHaveLength(1);
    expect(fs.exists('C:\\Recycle Bin\\note.txt')).toBe(true);
  });

  it('returns { restored: false } for an unknown id', async () => {
    const fs = await createFs(seedRoot());
    const bin = await createRecycleBin(fs);
    const result = await bin.restore('does-not-exist', 'replace');
    expect(result).toEqual({ restored: false });
  });
});

describe('recycleBin.permanentlyDelete and empty', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('win95-fs');
  });

  it('permanentlyDelete removes the FS node and the index row', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\a.txt', 'A');
    const bin = await createRecycleBin(fs);
    const [entry] = await bin.sendToBin(['C:\\a.txt']);
    await bin.permanentlyDelete(entry.id);
    expect(fs.exists(`C:\\Recycle Bin\\${entry.binName}`)).toBe(false);
    expect(bin.list()).toEqual([]);
  });

  it('permanentlyDelete on an unknown id is a no-op', async () => {
    const fs = await createFs(seedRoot());
    const bin = await createRecycleBin(fs);
    await expect(bin.permanentlyDelete('nope')).resolves.toBeUndefined();
    expect(bin.list()).toEqual([]);
  });

  it('empty hard-deletes everything and clears the index', async () => {
    const fs = await createFs(seedRoot());
    await fs.writeText('C:\\a.txt', 'A');
    await fs.writeText('C:\\b.txt', 'B');
    const bin = await createRecycleBin(fs);
    await bin.sendToBin(['C:\\a.txt', 'C:\\b.txt']);
    await bin.empty();
    expect(bin.list()).toEqual([]);
    expect(fs.exists('C:\\Recycle Bin\\a.txt')).toBe(false);
    expect(fs.exists('C:\\Recycle Bin\\b.txt')).toBe(false);
    const reloaded = await createRecycleBin(fs);
    expect(reloaded.list()).toEqual([]);
  });
});
