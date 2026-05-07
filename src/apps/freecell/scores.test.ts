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
    expect(loadStats()).toEqual({ wins: 0, losses: 0, streak: 0, bestStreak: 0 });
  });
  it('records win', () => {
    recordResult('won');
    expect(loadStats()).toEqual({ wins: 1, losses: 0, streak: 1, bestStreak: 1 });
  });
  it('records loss', () => {
    recordResult('lost');
    expect(loadStats()).toEqual({ wins: 0, losses: 1, streak: 0, bestStreak: 0 });
  });
  it('streak grows on consecutive wins', () => {
    recordResult('won'); recordResult('won'); recordResult('won');
    expect(loadStats()).toEqual({ wins: 3, losses: 0, streak: 3, bestStreak: 3 });
  });
  it('loss resets streak', () => {
    recordResult('won'); recordResult('won'); recordResult('lost');
    expect(loadStats()).toEqual({ wins: 2, losses: 1, streak: 0, bestStreak: 2 });
  });
  it('bestStreak is monotonic', () => {
    recordResult('won'); recordResult('won'); recordResult('won');
    recordResult('lost');
    recordResult('won');
    expect(loadStats().bestStreak).toBe(3);
  });
});
