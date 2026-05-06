import { describe, it, expect } from 'vitest';
import { makeDeck, deal, type PlayerId } from './engine';
import { makeRng } from './rng';

describe('makeDeck', () => {
  it('produces 52 unique cards (no jokers)', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });
  it('contains 13 of each suit', () => {
    const deck = makeDeck();
    for (const s of ['spades', 'hearts', 'clubs', 'diamonds'] as const) {
      expect(deck.filter((c) => c.suit === s)).toHaveLength(13);
    }
  });
  it('ranks 2..14 only', () => {
    const deck = makeDeck();
    expect(deck.every((c) => c.rank >= 2 && c.rank <= 14)).toBe(true);
  });
});

describe('deal', () => {
  it('gives each of 4 players 13 cards', () => {
    const s = deal(makeRng(1));
    for (const p of [0, 1, 2, 3] as PlayerId[]) {
      expect(s.hands[p]).toHaveLength(13);
    }
  });
  it('uses every card exactly once across all hands', () => {
    const s = deal(makeRng(1));
    const all = [...s.hands[0], ...s.hands[1], ...s.hands[2], ...s.hands[3]];
    const ids = new Set(all.map((c) => c.id));
    expect(ids.size).toBe(52);
  });
  it('is deterministic for the same seed', () => {
    const a = deal(makeRng(42));
    const b = deal(makeRng(42));
    expect(a.hands).toEqual(b.hands);
  });
  it('starts in passing phase, hand 0, pass left, scores all zero', () => {
    const s = deal(makeRng(1));
    expect(s.phase).toBe('passing');
    expect(s.handNumber).toBe(0);
    expect(s.passDirection).toBe('left');
    expect(s.scores).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
  });
});
