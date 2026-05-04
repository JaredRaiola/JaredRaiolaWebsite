import { describe, it, expect } from 'vitest';
import { normalize, split, join, parent, basename, extname, eqPath } from './paths';

describe('paths', () => {
  it('normalizes forward slashes to backslashes', () => {
    expect(normalize('C:/Windows/System')).toBe('C:\\Windows\\System');
  });
  it('strips trailing slash except for root', () => {
    expect(normalize('C:\\Windows\\')).toBe('C:\\Windows');
    expect(normalize('C:\\')).toBe('C:\\');
  });
  it('collapses repeated separators', () => {
    expect(normalize('C:\\\\Windows\\\\\\System')).toBe('C:\\Windows\\System');
  });
  it('splits a path into segments', () => {
    expect(split('C:\\Windows\\System')).toEqual(['C:', 'Windows', 'System']);
  });
  it('joins segments into a path', () => {
    expect(join('C:', 'Windows', 'System')).toBe('C:\\Windows\\System');
  });
  it('returns parent of a path', () => {
    expect(parent('C:\\Windows\\System')).toBe('C:\\Windows');
    expect(parent('C:\\Windows')).toBe('C:\\');
    expect(parent('C:\\')).toBe(null);
  });
  it('returns basename', () => {
    expect(basename('C:\\Windows\\hello.txt')).toBe('hello.txt');
    expect(basename('C:\\')).toBe('C:');
  });
  it('returns lower-case extension with leading dot', () => {
    expect(extname('hello.TXT')).toBe('.txt');
    expect(extname('archive.tar.gz')).toBe('.gz');
    expect(extname('noext')).toBe('');
  });
  it('compares paths case-insensitively', () => {
    expect(eqPath('C:\\Windows', 'c:\\windows')).toBe(true);
    expect(eqPath('C:\\Windows', 'C:\\System')).toBe(false);
  });
});
