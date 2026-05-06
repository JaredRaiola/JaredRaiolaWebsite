import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadStats, recordOutcome } from './scores';

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

describe('chess scores', () => {
  it('returns zeros when nothing stored', () => {
    expect(loadStats()).toEqual({ wins: 0, losses: 0, draws: 0 });
  });
  it('records win', () => {
    recordOutcome('win');
    expect(loadStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });
  it('records loss', () => {
    recordOutcome('loss');
    expect(loadStats()).toEqual({ wins: 0, losses: 1, draws: 0 });
  });
  it('records draw', () => {
    recordOutcome('draw');
    expect(loadStats()).toEqual({ wins: 0, losses: 0, draws: 1 });
  });
  it('accumulates correctly', () => {
    recordOutcome('win'); recordOutcome('win'); recordOutcome('loss'); recordOutcome('draw');
    expect(loadStats()).toEqual({ wins: 2, losses: 1, draws: 1 });
  });
});
