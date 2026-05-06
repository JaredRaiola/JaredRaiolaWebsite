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
