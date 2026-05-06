import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBestTimes, saveIfBest, resetBestTimes, type BuiltinDifficulty } from './scores';

describe('best times', () => {
  beforeEach(() => {
    // Ensure localStorage is available in the test environment
    if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
      const store: Record<string, string> = {};
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      });
    }
    localStorage.clear();
  });

  it('returns all-null when no data is stored', () => {
    const t = loadBestTimes();
    expect(t.beginner).toBeNull();
    expect(t.intermediate).toBeNull();
    expect(t.expert).toBeNull();
  });

  it('saveIfBest writes a new record when none exists', () => {
    const result = saveIfBest('beginner', 50, 'Alice');
    expect(result).toBe(true);
    expect(loadBestTimes().beginner).toEqual({ name: 'Alice', seconds: 50 });
  });

  it('saveIfBest replaces a slower record', () => {
    saveIfBest('beginner', 50, 'Alice');
    const result = saveIfBest('beginner', 30, 'Bob');
    expect(result).toBe(true);
    expect(loadBestTimes().beginner).toEqual({ name: 'Bob', seconds: 30 });
  });

  it('saveIfBest ignores a non-improving record', () => {
    saveIfBest('beginner', 30, 'Alice');
    const result = saveIfBest('beginner', 50, 'Bob');
    expect(result).toBe(false);
    expect(loadBestTimes().beginner).toEqual({ name: 'Alice', seconds: 30 });
  });

  it('resetBestTimes clears all', () => {
    saveIfBest('beginner', 50, 'Alice');
    saveIfBest('expert', 200, 'Carol');
    resetBestTimes();
    expect(loadBestTimes()).toEqual({ beginner: null, intermediate: null, expert: null });
  });

  it('handles corrupt JSON by returning all-null', () => {
    localStorage.setItem('minesweeper.bestTimes.v1', 'not json');
    expect(loadBestTimes()).toEqual({ beginner: null, intermediate: null, expert: null });
  });

  it('truncates names longer than 25 chars', () => {
    saveIfBest('beginner', 50, 'a'.repeat(40));
    expect(loadBestTimes().beginner!.name).toHaveLength(25);
  });
});

describe('BuiltinDifficulty type guard usage', () => {
  it('accepts valid keys', () => {
    const keys: BuiltinDifficulty[] = ['beginner', 'intermediate', 'expert'];
    expect(keys).toHaveLength(3);
  });
});
