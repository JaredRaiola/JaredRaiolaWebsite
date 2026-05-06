import { describe, it, expect } from 'vitest';
import { makeDeck, deal, DEFAULT_OPTIONS } from './engine';
import { makeRng } from './rng';

describe('makeDeck', () => {
  it('produces 52 unique cards', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });
  it('all cards face down', () => {
    expect(makeDeck().every((c) => c.faceUp === false)).toBe(true);
  });
});

describe('deal', () => {
  it('puts 28 cards in the tableau (1+2+3+4+5+6+7)', () => {
    const s = deal(makeRng(1));
    const tab = [0, 1, 2, 3, 4, 5, 6].map((i) => s.piles[`tableau-${i}` as const].length);
    expect(tab).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('only top tableau card is face up', () => {
    const s = deal(makeRng(1));
    for (let i = 0; i < 7; i++) {
      const col = s.piles[`tableau-${i}` as const];
      expect(col[col.length - 1].faceUp).toBe(true);
      for (let j = 0; j < col.length - 1; j++) expect(col[j].faceUp).toBe(false);
    }
  });
  it('puts the remaining 24 cards face-down in the stock', () => {
    const s = deal(makeRng(1));
    expect(s.piles.stock).toHaveLength(24);
    expect(s.piles.stock.every((c) => c.faceUp === false)).toBe(true);
  });
  it('foundations and waste start empty', () => {
    const s = deal(makeRng(1));
    expect(s.piles.waste).toHaveLength(0);
    expect(s.piles['foundation-spades']).toHaveLength(0);
    expect(s.piles['foundation-hearts']).toHaveLength(0);
    expect(s.piles['foundation-clubs']).toHaveLength(0);
    expect(s.piles['foundation-diamonds']).toHaveLength(0);
  });
  it('is deterministic for the same seed', () => {
    const a = deal(makeRng(42));
    const b = deal(makeRng(42));
    expect(a.piles).toEqual(b.piles);
  });
  it('initial phase is playing, score 0, recyclesUsed 0', () => {
    const s = deal(makeRng(1));
    expect(s.phase).toBe('playing');
    expect(s.score).toBe(0);
    expect(s.recyclesUsed).toBe(0);
  });
});

import { canStackOnTableau, canStackOnFoundation, isValidRun, color } from './engine';

describe('color', () => {
  it('hearts and diamonds are red', () => {
    expect(color('hearts')).toBe('red');
    expect(color('diamonds')).toBe('red');
  });
  it('spades and clubs are black', () => {
    expect(color('spades')).toBe('black');
    expect(color('clubs')).toBe('black');
  });
});

describe('canStackOnTableau', () => {
  const ks = { id: 'KS', suit: 'spades', rank: 13, faceUp: true } as const;
  const qh = { id: 'QH', suit: 'hearts', rank: 12, faceUp: true } as const;
  const qc = { id: 'QC', suit: 'clubs', rank: 12, faceUp: true } as const;
  const jc = { id: 'JC', suit: 'clubs', rank: 11, faceUp: true } as const;
  it('king on empty', () => {
    expect(canStackOnTableau(undefined, ks)).toBe(true);
  });
  it('non-king on empty rejects', () => {
    expect(canStackOnTableau(undefined, qh)).toBe(false);
  });
  it('opposite color one rank lower', () => {
    expect(canStackOnTableau(ks, qh)).toBe(true);
    expect(canStackOnTableau(qh, jc)).toBe(true);
  });
  it('same color rejects', () => {
    expect(canStackOnTableau(ks, qc)).toBe(false);
  });
  it('wrong rank rejects', () => {
    expect(canStackOnTableau(ks, jc)).toBe(false);
  });
});

describe('canStackOnFoundation', () => {
  const as = { id: 'AS', suit: 'spades', rank: 1, faceUp: true } as const;
  const twos = { id: '2S', suit: 'spades', rank: 2, faceUp: true } as const;
  const twoh = { id: '2H', suit: 'hearts', rank: 2, faceUp: true } as const;
  it('ace on empty', () => {
    expect(canStackOnFoundation(undefined, as)).toBe(true);
  });
  it('non-ace on empty rejects', () => {
    expect(canStackOnFoundation(undefined, twos)).toBe(false);
  });
  it('same suit one rank higher', () => {
    expect(canStackOnFoundation(as, twos)).toBe(true);
  });
  it('different suit rejects', () => {
    expect(canStackOnFoundation(as, twoh)).toBe(false);
  });
  it('wrong rank rejects', () => {
    const ks = { id: 'KS', suit: 'spades', rank: 13, faceUp: true } as const;
    expect(canStackOnFoundation(as, ks)).toBe(false);
  });
});

describe('isValidRun', () => {
  it('single card is a valid run', () => {
    expect(isValidRun([{ id: '5H', suit: 'hearts', rank: 5, faceUp: true }])).toBe(true);
  });
  it('alternating colors descending', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
        { id: '4S', suit: 'spades', rank: 4, faceUp: true },
        { id: '3D', suit: 'diamonds', rank: 3, faceUp: true },
      ]),
    ).toBe(true);
  });
  it('rejects same color', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
        { id: '4D', suit: 'diamonds', rank: 4, faceUp: true },
      ]),
    ).toBe(false);
  });
  it('rejects non-descending', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
        { id: '6S', suit: 'spades', rank: 6, faceUp: true },
      ]),
    ).toBe(false);
  });
  it('rejects face-down cards in the run', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: false },
      ]),
    ).toBe(false);
  });
});

import { reducer, emptyPiles } from './engine';
import type { GameState } from './engine';
import type { Suit, Rank, Card, PileId } from './engine';

describe('reducer/drawFromStock', () => {
  it('draw 1 moves one card from stock to waste face-up', () => {
    const s0 = deal(makeRng(1));
    const stockBefore = s0.piles.stock.length;
    const s1 = reducer(s0, { type: 'drawFromStock' });
    expect(s1.piles.stock).toHaveLength(stockBefore - 1);
    expect(s1.piles.waste).toHaveLength(1);
    expect(s1.piles.waste[0].faceUp).toBe(true);
  });
  it('draw 3 moves three cards from stock to waste face-up', () => {
    const s0 = deal(makeRng(1), { ...DEFAULT_OPTIONS, draw: 3 });
    const s1 = reducer(s0, { type: 'drawFromStock' });
    expect(s1.piles.waste).toHaveLength(3);
    expect(s1.piles.waste.every((c) => c.faceUp)).toBe(true);
  });
  it('draw 3 moves remaining cards if fewer than 3', () => {
    const s0 = deal(makeRng(1), { ...DEFAULT_OPTIONS, draw: 3 });
    const s = { ...s0, piles: { ...s0.piles, stock: s0.piles.stock.slice(0, 2) } };
    const s2 = reducer(s, { type: 'drawFromStock' });
    expect(s2.piles.stock).toHaveLength(0);
    expect(s2.piles.waste.length - s.piles.waste.length).toBe(2);
  });
  it('drawFromStock on empty stock with non-empty waste recycles', () => {
    const s0 = deal(makeRng(1));
    const s = { ...s0, piles: { ...s0.piles, stock: [], waste: s0.piles.stock.slice() } };
    const wasteBefore = s.piles.waste.length;
    const s2 = reducer(s, { type: 'drawFromStock' });
    expect(s2.piles.stock).toHaveLength(wasteBefore);
    expect(s2.piles.waste).toHaveLength(0);
    expect(s2.piles.stock.every((c) => c.faceUp === false)).toBe(true);
    expect(s2.recyclesUsed).toBe(1);
  });
  it('vegas mode blocks recycle after one pass for draw 1', () => {
    const s0 = deal(makeRng(1), { ...DEFAULT_OPTIONS, scoring: 'vegas', draw: 1 });
    const s = { ...s0, piles: { ...s0.piles, stock: [], waste: s0.piles.stock.slice() }, recyclesUsed: 1 };
    const s2 = reducer(s, { type: 'drawFromStock' });
    expect(s2).toBe(s);
  });
});

describe('reducer/tryMove', () => {
  it('illegal move returns same state reference', () => {
    const s0 = deal(makeRng(1));
    const r = reducer(s0, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'tableau-1' });
    expect(r).toBe(s0);
  });
  it('legal single-card tableau→tableau move transfers and reveals new top', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: 'XX', suit: 'spades', rank: 7, faceUp: false },
      { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
    ];
    piles['tableau-1'] = [{ id: '6S', suit: 'spades', rank: 6, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 1, to: 'tableau-1' });
    expect(r.piles['tableau-1'].map((c) => c.id)).toEqual(['6S', '5H']);
    expect(r.piles['tableau-0']).toHaveLength(1);
    expect(r.piles['tableau-0'][0].faceUp).toBe(true);
  });
  it('legal multi-card tableau→tableau move requires valid run', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: '6S', suit: 'spades', rank: 6, faceUp: true },
      { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
      { id: '4C', suit: 'clubs', rank: 4, faceUp: true },
    ];
    piles['tableau-1'] = [{ id: '7H', suit: 'hearts', rank: 7, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'tableau-1' });
    expect(r.piles['tableau-1']).toHaveLength(4);
    expect(r.piles['tableau-0']).toHaveLength(0);
  });
  it('foundation only accepts single card', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: 'AS', suit: 'spades', rank: 1, faceUp: true },
      { id: '2S', suit: 'spades', rank: 2, faceUp: true },
    ];
    piles['foundation-spades'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'foundation-spades' });
    expect(r).toBe(s);
    const r2 = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 1, to: 'foundation-spades' });
    expect(r2.piles['foundation-spades'].map((c) => c.id)).toEqual(['AS', '2S']);
  });
});

describe('reducer/autoMoveToFoundation', () => {
  it('moves the top card of source to its suit foundation when legal', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'autoMoveToFoundation', from: 'waste' });
    expect(r.piles['foundation-spades'].map((c) => c.id)).toEqual(['AS']);
    expect(r.piles.waste).toHaveLength(0);
  });
  it('no-ops when illegal', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: '5H', suit: 'hearts', rank: 5, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    expect(reducer(s, { type: 'autoMoveToFoundation', from: 'waste' })).toBe(s);
  });
});

describe('reducer/autoFinish + win detection', () => {
  it('autoFinish only runs when all face-down + stock + waste empty', () => {
    const piles = emptyPiles();
    piles['stock'] = [{ id: '5H', suit: 'hearts', rank: 5, faceUp: false }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    expect(reducer(s, { type: 'autoFinish' })).toBe(s);
  });
  it('autoFinish moves all tableau cards to foundations and wins', () => {
    const piles = emptyPiles();
    const cols: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
    for (let i = 0; i < 4; i++) {
      const cards: Card[] = [];
      for (let r = 13; r >= 1; r--) {
        const rankChar = r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r);
        const suitChar = cols[i][0].toUpperCase();
        cards.push({
          id: `${rankChar}${suitChar}`,
          suit: cols[i],
          rank: r as Rank,
          faceUp: true,
        });
      }
      piles[`tableau-${i}` as PileId] = cards;
    }
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'autoFinish' });
    expect(r.phase).toBe('won');
    for (const suit of cols) expect(r.piles[`foundation-${suit}` as PileId]).toHaveLength(13);
  });
});

import type { Phase } from './engine';

describe('reducer/undo', () => {
  it('undo restores piles + score + recyclesUsed', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'drawFromStock' });
    expect(s1.prev).not.toBeNull();
    const s2 = reducer(s1, { type: 'undo' });
    expect(s2.piles.stock).toEqual(s0.piles.stock);
    expect(s2.piles.waste).toEqual(s0.piles.waste);
    expect(s2.prev).toBeNull();
  });
  it('undo with no prev no-ops', () => {
    const s0 = deal(makeRng(1));
    expect(reducer(s0, { type: 'undo' })).toBe(s0);
  });
  it('cannot undo twice in a row', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'drawFromStock' });
    const s2 = reducer(s1, { type: 'undo' });
    expect(reducer(s2, { type: 'undo' })).toBe(s2);
  });
});

describe('reducer/deal action', () => {
  it('deal action wipes prev and starts fresh', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'drawFromStock' });
    const s2 = reducer(s1, { type: 'deal', rng: makeRng(2) });
    expect(s2.phase).toBe('playing');
    expect(s2.prev).toBeNull();
    expect(s2.piles).not.toEqual(s0.piles);
    expect(s2.options).toEqual(s0.options);
  });
});

describe('reducer/setOptions', () => {
  it('updates options and persists current game piles', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'setOptions', options: { draw: 3 } });
    expect(s1.options.draw).toBe(3);
    expect(s1.piles).toEqual(s0.piles);
  });
});

describe('reducer/tick', () => {
  it('updates elapsedMs based on startedAt', () => {
    const s0 = { ...deal(makeRng(1)), startedAt: 1000 };
    const s1 = reducer(s0, { type: 'tick', now: 5000 });
    expect(s1.elapsedMs).toBe(4000);
  });
  it('no-ops when not playing', () => {
    const s0: GameState = { ...deal(makeRng(1)), phase: 'won' as Phase };
    const s1 = reducer(s0, { type: 'tick', now: 999999 });
    expect(s1.elapsedMs).toBe(0);
  });
});
