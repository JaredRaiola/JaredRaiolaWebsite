import { describe, it, expect } from 'vitest';
import { dealGame } from './engine';

describe('dealGame', () => {
  it('returns playing phase with the right game number', () => {
    const s = dealGame(1);
    expect(s.phase).toBe('playing');
    expect(s.gameNumber).toBe(1);
    expect(s.moveCount).toBe(0);
  });
  it('deals 52 cards to tableaus, leaves cells/foundations empty', () => {
    const s = dealGame(1);
    let total = 0;
    for (const t of ['tableau-0','tableau-1','tableau-2','tableau-3','tableau-4','tableau-5','tableau-6','tableau-7'] as const) {
      total += s.piles[t].length;
    }
    expect(total).toBe(52);
    for (const c of ['cell-0','cell-1','cell-2','cell-3'] as const) expect(s.piles[c]).toHaveLength(0);
    for (const f of ['foundation-spades','foundation-hearts','foundation-clubs','foundation-diamonds'] as const) {
      expect(s.piles[f]).toHaveLength(0);
    }
  });
  it('deal #11982 still starts in playing (we do not pre-detect known-unsolvable)', () => {
    expect(dealGame(11982).phase).toBe('playing');
  });
});
