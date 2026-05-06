import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadOptions, saveOptions } from './options';
import { DEFAULT_OPTIONS } from './engine';

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  });
});

describe('options', () => {
  it('returns defaults when nothing stored', () => {
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
  });
  it('round trips full options', () => {
    const o = { ...DEFAULT_OPTIONS, difficulty: 'hard' as const, showAiHands: true };
    saveOptions(o);
    expect(loadOptions()).toEqual(o);
  });
  it('returns defaults for malformed JSON', () => {
    localStorage.setItem('win95.hearts.options', '{not json');
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
  });
});
