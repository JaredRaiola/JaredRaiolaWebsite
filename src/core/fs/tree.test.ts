import { describe, it, expect } from 'vitest';
import { makeDir, makeFile, getNode, insertNode, removeNode, listChildren } from './tree';

describe('tree ops', () => {
  it('creates a dir and lists empty children', () => {
    const root = makeDir('C:');
    expect(listChildren(root, 'C:\\')).toEqual([]);
  });

  it('inserts and retrieves a file', () => {
    const root = makeDir('C:');
    const file = makeFile('hello.txt', 'text/plain', 5, 'blob1');
    insertNode(root, 'C:\\hello.txt', file);
    expect(getNode(root, 'C:\\hello.txt')).toBe(file);
  });

  it('insert into nested dir', () => {
    const root = makeDir('C:');
    insertNode(root, 'C:\\Windows', makeDir('Windows'));
    insertNode(root, 'C:\\Windows\\readme.txt', makeFile('readme.txt', 'text/plain', 0, 'b'));
    expect(getNode(root, 'C:\\Windows\\readme.txt')?.kind).toBe('file');
  });

  it('insert is case-insensitive on lookup', () => {
    const root = makeDir('C:');
    insertNode(root, 'C:\\Windows', makeDir('Windows'));
    expect(getNode(root, 'c:\\windows')).not.toBeNull();
  });

  it('removes a node', () => {
    const root = makeDir('C:');
    insertNode(root, 'C:\\f.txt', makeFile('f.txt', 'text/plain', 0, 'b'));
    removeNode(root, 'C:\\f.txt');
    expect(getNode(root, 'C:\\f.txt')).toBeNull();
  });

  it('throws when inserting into missing parent', () => {
    const root = makeDir('C:');
    expect(() =>
      insertNode(root, 'C:\\Missing\\f.txt', makeFile('f.txt', 'text/plain', 0, 'b')),
    ).toThrow();
  });
});
