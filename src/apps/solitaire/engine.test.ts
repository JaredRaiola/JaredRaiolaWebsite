import { describe, it, expect } from 'vitest';
import { makeDeck, deal } from './engine';
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
