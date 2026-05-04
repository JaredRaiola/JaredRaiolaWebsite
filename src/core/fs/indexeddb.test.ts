import { describe, it, expect, beforeEach } from 'vitest';
import { openFsDb, putTree, getTree, putBlob, getBlob, deleteBlob } from './indexeddb';

describe('IndexedDB driver', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('win95-fs');
    await new Promise((r) => setTimeout(r, 0));
  });

  it('opens and round-trips tree metadata', async () => {
    await openFsDb();
    const tree = { kind: 'dir', name: 'C:', children: {}, createdAt: 0, modifiedAt: 0 };
    await putTree(tree as any);
    const got = await getTree();
    expect(got).toEqual(tree);
  });

  it('round-trips a blob', async () => {
    await openFsDb();
    const blob = new Blob(['hello'], { type: 'text/plain' });
    await putBlob('id1', blob);
    const got = await getBlob('id1');
    expect(got).not.toBeNull();
    expect(await got!.text()).toBe('hello');
  });

  it('deletes a blob', async () => {
    await openFsDb();
    await putBlob('id2', new Blob(['x']));
    await deleteBlob('id2');
    expect(await getBlob('id2')).toBeNull();
  });
});
