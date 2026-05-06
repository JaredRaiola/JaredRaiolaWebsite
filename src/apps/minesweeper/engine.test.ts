import { describe, it, expect } from 'vitest';
import { createInitialState, reveal, neighbors, toggleMark, chord } from './engine';
import type { GameState } from './engine';

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

describe('reveal — flood fill', () => {
  it('revealing a 0-adjacent cell opens the connected zero region plus its number border', () => {
    // Construct a controlled board: 5x5, mines only in the bottom-right corner cell.
    const s0 = createInitialState({ width: 5, height: 5, mines: 1 });
    // RNG that always returns 0.999 → picks last candidate (after Fisher-Yates of remaining)
    // Easier: directly set state for testing rather than fight RNG.
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[24].mine = true; // bottom-right
    // Manually compute adjacency
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const idx = row * 5 + col;
        if (cells[idx].mine) continue;
        let count = 0;
        for (const n of neighbors(col, row, 5, 5)) if (cells[n].mine) count++;
        cells[idx].adjacent = count;
      }
    }
    const seeded: GameState = { ...s0, phase: 'playing', cells, startedAt: 0 };
    const s1 = reveal(seeded, 0); // top-left, far from mine, should flood
    const revealedCount = s1.cells.filter((c) => c.revealed).length;
    // 5x5 = 25 cells. 1 is a mine (not revealed). Top-left flood reveals all non-mines reachable.
    // Adjacent-to-mine cells (the L-shaped border around bottom-right) are revealed too.
    // Expected: 24 cells revealed.
    expect(revealedCount).toBe(24);
  });

  it('does not flood when revealing a numbered cell', () => {
    const s0 = createInitialState({ width: 3, height: 3, mines: 1 });
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[0].mine = true;
    cells[1].adjacent = 1;
    cells[3].adjacent = 1;
    cells[4].adjacent = 1;
    const seeded: GameState = { ...s0, phase: 'playing', cells, startedAt: 0 };
    const s1 = reveal(seeded, 4); // numbered cell, should reveal only itself
    const revealedCount = s1.cells.filter((c) => c.revealed).length;
    expect(revealedCount).toBe(1);
  });
});

describe('toggleMark', () => {
  it('cycles none → flag → question → none with marks enabled', () => {
    const s0 = createInitialState({ width: 9, height: 9, mines: 10 });
    const s1 = toggleMark(s0, 0);
    expect(s1.cells[0].mark).toBe('flag');
    expect(s1.flagsPlaced).toBe(1);
    const s2 = toggleMark(s1, 0);
    expect(s2.cells[0].mark).toBe('question');
    expect(s2.flagsPlaced).toBe(0);
    const s3 = toggleMark(s2, 0);
    expect(s3.cells[0].mark).toBe('none');
  });
  it('skips question when marks disabled (none → flag → none)', () => {
    const s0 = { ...createInitialState({ width: 9, height: 9, mines: 10 }), marksEnabled: false };
    const s1 = toggleMark(s0, 0);
    expect(s1.cells[0].mark).toBe('flag');
    const s2 = toggleMark(s1, 0);
    expect(s2.cells[0].mark).toBe('none');
  });
  it('does nothing on revealed cells', () => {
    const s0 = createInitialState({ width: 9, height: 9, mines: 10 });
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[0].revealed = true;
    const seeded: GameState = { ...s0, cells };
    const s1 = toggleMark(seeded, 0);
    expect(s1).toBe(seeded);
  });
});

describe('chord', () => {
  function buildBoard(): GameState {
    // 3x3, mine at idx 8 (bottom-right). idx 4 has adjacent=1.
    const s0 = createInitialState({ width: 3, height: 3, mines: 1 });
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[8].mine = true;
    cells[4].adjacent = 1;
    cells[5].adjacent = 1;
    cells[7].adjacent = 1;
    cells[4].revealed = true;
    return { ...s0, phase: 'playing', cells, startedAt: 0 };
  }

  it('reveals all unflagged neighbors when flag count matches number', () => {
    let s = buildBoard();
    s = toggleMark(s, 8); // flag the mine
    const after = chord(s, 4);
    // Neighbors of idx 4: 0,1,2,3,5,6,7,8. idx 8 is flagged. Others should reveal.
    for (const n of [0, 1, 2, 3, 5, 6, 7]) {
      expect(after.cells[n].revealed).toBe(true);
    }
    expect(after.cells[8].revealed).toBe(false); // still flagged
  });

  it('is a no-op on under-flagged numbers', () => {
    const s = buildBoard(); // idx 4 has number 1, no flags placed
    const after = chord(s, 4);
    expect(after).toBe(s);
  });

  it('triggers loss when a chord hits a mine because of a wrong flag', () => {
    let s = buildBoard();
    s = toggleMark(s, 0); // wrongly flag a non-mine corner
    // Now idx 4 has 1 flag (corner) but the actual mine is unflagged.
    const after = chord(s, 4);
    expect(after.phase).toBe('lost');
  });

  it('is a no-op on a revealed 0 cell', () => {
    const s0 = createInitialState({ width: 3, height: 3, mines: 0 });
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[4].revealed = true; // adjacent stays 0
    const seeded: GameState = { ...s0, phase: 'playing', cells, startedAt: 0 };
    const after = chord(seeded, 4);
    expect(after).toBe(seeded);
  });
});

describe('win detection', () => {
  it('transitions to won when every non-mine cell is revealed and auto-flags remaining mines', () => {
    const s0 = createInitialState({ width: 2, height: 2, mines: 1 });
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[3].mine = true;
    cells[0].adjacent = 0;
    cells[1].adjacent = 1;
    cells[2].adjacent = 1;
    const seeded: GameState = { ...s0, phase: 'playing', cells, startedAt: 0 };
    let s = reveal(seeded, 0); // floods through 0-cell, opens 1,2
    // 0 has neighbors 1, 2, 3. Flood reveals 0,1,2 (numbers stop the flood at themselves; 3 is mine).
    expect(s.phase).toBe('won');
    expect(s.cells[3].mark).toBe('flag');
    expect(s.flagsPlaced).toBe(1);
  });
});

describe('lose detection', () => {
  it('reveals all mines when one is clicked and marks the clicked one exploded', () => {
    const s0 = createInitialState({ width: 2, height: 2, mines: 2 });
    const cells = s0.cells.map((c) => ({ ...c }));
    cells[0].mine = true;
    cells[3].mine = true;
    cells[1].adjacent = 2;
    cells[2].adjacent = 2;
    const seeded: GameState = { ...s0, phase: 'playing', cells, startedAt: 0 };
    const s = reveal(seeded, 0);
    expect(s.phase).toBe('lost');
    expect(s.cells[0].exploded).toBe(true);
    expect(s.cells[0].revealed).toBe(true);
    expect(s.cells[3].revealed).toBe(true);
  });
});
