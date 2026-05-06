import { describe, it, expect } from 'vitest';
import { chooseAiPass, chooseAiPlay } from './ai';
import { makeDeck, type Card, type Trick } from './engine';

const c = (id: string, suit: Card['suit'], rank: Card['rank']): Card => ({ id, suit, rank });

describe('Easy AI', () => {
  it('chooseAiPass returns 3 unique cards from the hand', () => {
    const deck = makeDeck();
    const hand = deck.slice(0, 13);
    const passed = chooseAiPass(hand, 'left', 'easy');
    expect(passed).toHaveLength(3);
    const ids = new Set(passed.map((x) => x.id));
    expect(ids.size).toBe(3);
    for (const p of passed) expect(hand.some((h) => h.id === p.id)).toBe(true);
  });
  it('chooseAiPlay returns a legal card when leading first trick', () => {
    const hand = [c('2C', 'clubs', 2), c('5H', 'hearts', 5), c('AS', 'spades', 14)];
    const trick: Trick = { leader: 1, leadSuit: null, plays: [] };
    const choice = chooseAiPlay(hand, trick, [], false, true, 'easy');
    expect(choice.id).toBe('2C');
  });
  it('chooseAiPlay always plays a legal card across many random hands', () => {
    const deck = makeDeck();
    for (let seed = 0; seed < 200; seed++) {
      const hand = deck.slice(0, 13);
      const trick: Trick = { leader: 1, leadSuit: 'clubs', plays: [{ player: 0, card: c('AC', 'clubs', 14) }] };
      const choice = chooseAiPlay(hand, trick, [], true, false, 'easy');
      expect(hand.some((h) => h.id === choice.id)).toBe(true);
    }
  });
});
