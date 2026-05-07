import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadStats, recordResult } from './scores';

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

describe('scores', () => {
  it('returns zeros when nothing stored', () => {
    expect(loadStats()).toEqual({ wins: 0, losses: 0, bestScore: null });
  });
  it('records win', () => {
    recordResult({ humanWon: true, humanScore: 42 });
    expect(loadStats()).toEqual({ wins: 1, losses: 0, bestScore: 42 });
  });
  it('records loss', () => {
    recordResult({ humanWon: false, humanScore: 105 });
    expect(loadStats()).toEqual({ wins: 0, losses: 1, bestScore: null });
  });
  it('improves bestScore on better win', () => {
    recordResult({ humanWon: true, humanScore: 42 });
    recordResult({ humanWon: true, humanScore: 30 });
    expect(loadStats().bestScore).toBe(30);
  });
});
