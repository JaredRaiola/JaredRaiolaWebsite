import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBestTime, saveIfBest, resetBestTime } from './bestTimes';

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

describe('bestTimes', () => {
  it('returns null when none', () => {
    expect(loadBestTime()).toBeNull();
  });
  it('saveIfBest accepts first entry', () => {
    expect(saveIfBest(120, 'Alice')).toBe(true);
    expect(loadBestTime()).toEqual({ name: 'Alice', seconds: 120 });
  });
  it('rejects worse times', () => {
    saveIfBest(120, 'Alice');
    expect(saveIfBest(150, 'Bob')).toBe(false);
    expect(loadBestTime()?.name).toBe('Alice');
  });
  it('accepts better times', () => {
    saveIfBest(120, 'Alice');
    expect(saveIfBest(100, 'Bob')).toBe(true);
    expect(loadBestTime()?.name).toBe('Bob');
  });
  it('reset clears', () => {
    saveIfBest(120, 'Alice');
    resetBestTime();
    expect(loadBestTime()).toBeNull();
  });
  it('truncates long names', () => {
    const longName = 'A'.repeat(100);
    saveIfBest(50, longName);
    expect(loadBestTime()!.name.length).toBeLessThanOrEqual(25);
  });
});
