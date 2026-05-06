import { describe, it, expect } from 'vitest';
import { createInitialState, reveal, neighbors } from './engine';

describe('createInitialState', () => {
  it('starts in idle phase with no mines placed', () => {
    const s = createInitialState({ width: 9, height: 9, mines: 10 });
    expect(s.phase).toBe('idle');
    expect(s.cells).toHaveLength(81);
    expect(s.cells.every((c) => !c.mine && !c.revealed && c.mark === 'none')).toBe(true);
    expect(s.flagsPlaced).toBe(0);
    expect(s.startedAt).toBeNull();
    expect(s.elapsedMs).toBe(0);
    expect(s.marksEnabled).toBe(true);
  });
});

describe('neighbors', () => {
  it('returns 8 indexes for an interior cell', () => {
    const idxs = neighbors(4, 4, 9, 9); // (col=4, row=4) of 9x9 → idx 40
    expect(idxs).toHaveLength(8);
  });
  it('clips at corners', () => {
    expect(neighbors(0, 0, 9, 9)).toHaveLength(3);
    expect(neighbors(8, 8, 9, 9)).toHaveLength(3);
  });
  it('clips at edges', () => {
    expect(neighbors(4, 0, 9, 9)).toHaveLength(5);
  });
});

describe('reveal — first click', () => {
  it('places exactly N mines, none on the clicked cell, and computes adjacencies', () => {
    const s0 = createInitialState({ width: 9, height: 9, mines: 10 });
    const s1 = reveal(s0, 0, () => 0); // deterministic RNG: returns 0
    expect(s1.phase).toBe('playing');
    const mineCount = s1.cells.filter((c) => c.mine).length;
    expect(mineCount).toBe(10);
    expect(s1.cells[0].mine).toBe(false);
    // adjacency on a non-revealed mine should be 0..8
    for (const c of s1.cells) {
      expect(c.adjacent).toBeGreaterThanOrEqual(0);
      expect(c.adjacent).toBeLessThanOrEqual(8);
    }
    expect(s1.startedAt).not.toBeNull();
  });
  it('first click never lands on a mine even with skewed RNG', () => {
    const s0 = createInitialState({ width: 9, height: 9, mines: 10 });
    // RNG that always picks slot 0 — mine placer must skip that slot for the click cell.
    const s1 = reveal(s0, 0, () => 0);
    expect(s1.cells[0].mine).toBe(false);
  });
});
