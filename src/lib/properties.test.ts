import { describe, it, expect } from 'vitest';
import { formatBytes, fileTypeFromExt, computeFolderStats } from './properties';
import { createFs } from '@/core/fs';
import { makeDir } from '@/core/fs/tree';

describe('formatBytes', () => {
  it('renders small values in bytes', () => {
    expect(formatBytes(0)).toBe('0 bytes');
    expect(formatBytes(1023)).toBe('1023 bytes');
  });
  it('switches to KB / MB with both forms', () => {
    expect(formatBytes(1024)).toMatch(/KB.*\(1,024 bytes\)/);
    expect(formatBytes(1024 * 1024)).toMatch(/MB.*\(1,048,576 bytes\)/);
  });
});

describe('fileTypeFromExt', () => {
  it('maps known extensions', () => {
    expect(fileTypeFromExt('a.txt')).toBe('Text Document');
    expect(fileTypeFromExt('a.png')).toBe('PNG Image');
    expect(fileTypeFromExt('shortcut.lnk')).toBe('Shortcut');
  });
  it('falls back for unknown extensions', () => {
    expect(fileTypeFromExt('a.xyz')).toBe('XYZ File');
  });
  it('handles no extension', () => {
    expect(fileTypeFromExt('Makefile')).toBe('File');
  });
});

describe('computeFolderStats', () => {
  it('walks nested folders and sums sizes', async () => {
    indexedDB.deleteDatabase('win95-fs');
    const fs = await createFs(makeDir('C:'));
    await fs.mkdir('C:\\Folder');
    await fs.mkdir('C:\\Folder\\Sub');
    await fs.writeText('C:\\Folder\\a.txt', 'aa');
    await fs.writeText('C:\\Folder\\Sub\\b.txt', 'bbb');
    const stats = computeFolderStats(fs, 'C:\\Folder');
    expect(stats.files).toBe(2);
    expect(stats.folders).toBe(1);
    expect(stats.size).toBe(5);
  });
});
