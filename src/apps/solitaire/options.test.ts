import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadOptions, saveOptions, loadVegasBalance, saveVegasBalance } from './options';
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
    const o = { ...DEFAULT_OPTIONS, draw: 3 as const, scoring: 'vegas' as const, timed: false };
    saveOptions(o);
    expect(loadOptions()).toEqual(o);
  });
  it('returns defaults for malformed JSON', () => {
    localStorage.setItem('win95.solitaire.options', '{not json');
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
  });
  it('vegas balance round trip', () => {
    expect(loadVegasBalance()).toBe(0);
    saveVegasBalance(123);
    expect(loadVegasBalance()).toBe(123);
  });
});
