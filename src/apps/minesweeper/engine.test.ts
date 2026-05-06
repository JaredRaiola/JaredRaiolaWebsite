import { describe, it, expect } from 'vitest';
import { createInitialState } from './engine';

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
