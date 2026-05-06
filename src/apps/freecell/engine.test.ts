import { describe, it, expect } from 'vitest';
import {
  dealGame,
  canStackOnTableau, canStackOnFoundation, isValidRun, supermoveCapacity,
  type Card, type GameState,
} from './engine';

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

const c = (id: string, suit: Card['suit'], rank: Card['rank']): Card => ({ id, suit, rank });

describe('canStackOnTableau', () => {
  it('any card on empty', () => {
    expect(canStackOnTableau(undefined, c('5H', 'hearts', 5))).toBe(true);
  });
  it('opposite color one rank lower', () => {
    expect(canStackOnTableau(c('6S', 'spades', 6), c('5H', 'hearts', 5))).toBe(true);
  });
  it('rejects same color', () => {
    expect(canStackOnTableau(c('6S', 'spades', 6), c('5C', 'clubs', 5))).toBe(false);
  });
  it('rejects wrong rank', () => {
    expect(canStackOnTableau(c('6S', 'spades', 6), c('4H', 'hearts', 4))).toBe(false);
  });
});

describe('canStackOnFoundation', () => {
  it('Ace on empty', () => {
    expect(canStackOnFoundation(undefined, c('AS', 'spades', 1))).toBe(true);
  });
  it('non-Ace on empty rejects', () => {
    expect(canStackOnFoundation(undefined, c('2S', 'spades', 2))).toBe(false);
  });
  it('same suit one rank higher', () => {
    expect(canStackOnFoundation(c('AS', 'spades', 1), c('2S', 'spades', 2))).toBe(true);
  });
  it('different suit rejects', () => {
    expect(canStackOnFoundation(c('AS', 'spades', 1), c('2H', 'hearts', 2))).toBe(false);
  });
});

describe('isValidRun', () => {
  it('single card OK', () => {
    expect(isValidRun([c('5H', 'hearts', 5)])).toBe(true);
  });
  it('descending alternating colors', () => {
    expect(isValidRun([
      c('5H', 'hearts', 5), c('4S', 'spades', 4), c('3D', 'diamonds', 3),
    ])).toBe(true);
  });
  it('rejects same color in run', () => {
    expect(isValidRun([c('5H', 'hearts', 5), c('4D', 'diamonds', 4)])).toBe(false);
  });
  it('rejects non-descending', () => {
    expect(isValidRun([c('5H', 'hearts', 5), c('6S', 'spades', 6)])).toBe(false);
  });
});

describe('supermoveCapacity', () => {
  function blank(): GameState {
    return {
      phase: 'playing',
      piles: {
        'cell-0': [], 'cell-1': [], 'cell-2': [], 'cell-3': [],
        'foundation-spades': [], 'foundation-hearts': [], 'foundation-clubs': [], 'foundation-diamonds': [],
        'tableau-0': [c('AS', 'spades', 1)], 'tableau-1': [c('AS', 'spades', 1)], 'tableau-2': [c('AS', 'spades', 1)], 'tableau-3': [c('AS', 'spades', 1)],
        'tableau-4': [c('AS', 'spades', 1)], 'tableau-5': [c('AS', 'spades', 1)], 'tableau-6': [c('AS', 'spades', 1)], 'tableau-7': [c('AS', 'spades', 1)],
      },
      gameNumber: 0, startedAt: null, elapsedMs: 0, moveCount: 0, prev: null,
    };
  }
  it('all cells free, no empty cols → 5', () => {
    expect(supermoveCapacity(blank(), false)).toBe(5);
  });
  it('one empty col, all cells free → 10', () => {
    const s = blank();
    s.piles['tableau-0'] = [];
    expect(supermoveCapacity(s, false)).toBe(10);
  });
  it('two empty cols, all cells free → 20', () => {
    const s = blank();
    s.piles['tableau-0'] = []; s.piles['tableau-1'] = [];
    expect(supermoveCapacity(s, false)).toBe(20);
  });
  it('destination IS empty col → that col excluded from count', () => {
    const s = blank();
    s.piles['tableau-0'] = []; s.piles['tableau-1'] = [];
    expect(supermoveCapacity(s, true)).toBe(10);
  });
  it('one cell occupied → factor (cells+1) is 4', () => {
    const s = blank();
    s.piles['cell-0'] = [c('5H', 'hearts', 5)];
    expect(supermoveCapacity(s, false)).toBe(4);
  });
});
