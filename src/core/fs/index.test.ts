import { describe, it, expect, beforeEach } from 'vitest';
import { createFs } from './index';
import { makeDir } from './tree';
import { createRecycleBin } from './recycleBin';

describe('FS public API', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('win95-fs');
  });

  it('lists, mkdir, writeText, readText round-trip', async () => {
    const fs = await createFs(makeDir('C:'));
    await fs.mkdir('C:\\Foo');
    await fs.writeText('C:\\Foo\\hi.txt', 'hello');
    expect(fs.exists('C:\\Foo\\hi.txt')).toBe(true);
    expect(await fs.readText('C:\\Foo\\hi.txt')).toBe('hello');
    const items = fs.list('C:\\Foo');
    expect(items.map((n) => n.name)).toEqual(['hi.txt']);
  });

  it('rename moves a file', async () => {
    const fs = await createFs(makeDir('C:'));
    await fs.writeText('C:\\a.txt', 'A');
    await fs.rename('C:\\a.txt', 'C:\\b.txt');
    expect(fs.exists('C:\\a.txt')).toBe(false);
    expect(await fs.readText('C:\\b.txt')).toBe('A');
  });

  it('unlink removes a file', async () => {
    const fs = await createFs(makeDir('C:'));
    await fs.writeText('C:\\a.txt', 'A');
    await fs.unlink('C:\\a.txt');
    expect(fs.exists('C:\\a.txt')).toBe(false);
  });

  it('rmdir recursive removes a tree', async () => {
    const fs = await createFs(makeDir('C:'));
    await fs.mkdir('C:\\Dir');
    await fs.writeText('C:\\Dir\\x.txt', 'x');
    await fs.rmdir('C:\\Dir', { recursive: true });
    expect(fs.exists('C:\\Dir')).toBe(false);
  });
});

it('unlink soft-deletes a file into the Recycle Bin when wired through recycleBin', async () => {
  const fs = await createFs(makeDir('C:'));
  await fs.writeText('C:\\a.txt', 'A');
  const bin = await createRecycleBin(fs);
  // Wire fs.unlink to bin.sendToBin (mirrors the boot wiring).
  const originalUnlink = fs.unlink;
  fs.unlink = async (path) => {
    if (path.toLowerCase().startsWith('c:\\recycle bin')) return originalUnlink(path);
    await bin.sendToBin([path]);
  };
  await fs.unlink('C:\\a.txt');
  expect(fs.exists('C:\\a.txt')).toBe(false);
  expect(fs.exists('C:\\Recycle Bin\\a.txt')).toBe(true);
  expect(bin.list()).toHaveLength(1);
});
