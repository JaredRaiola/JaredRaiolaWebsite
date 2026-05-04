import { describe, it, expect, beforeEach } from 'vitest';
import { resolveAssociation } from './associations';
import { registerApp } from './registry';

describe('resolveAssociation', () => {
  beforeEach(() => {
    registerApp({
      id: 'notepad',
      displayName: 'Notepad',
      icon: '/i.png',
      defaultSize: { width: 400, height: 300 },
      fileAssociations: ['.txt'],
      component: () => Promise.resolve({ default: (() => null) as any }),
    });
  });

  it('finds app for known extension', () => {
    expect(resolveAssociation('C:\\readme.txt')).toBe('notepad');
  });

  it('returns null for unknown extension', () => {
    expect(resolveAssociation('C:\\f.unknown')).toBeNull();
  });

  it('case-insensitive', () => {
    expect(resolveAssociation('C:\\F.TXT')).toBe('notepad');
  });
});
