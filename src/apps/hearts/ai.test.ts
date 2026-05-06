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

describe('Medium AI', () => {
  it('passes Q♠, K♠, A♠ when held', () => {
    const hand: Card[] = [
      c('AS', 'spades', 14), c('KS', 'spades', 13), c('QS', 'spades', 12),
      c('2C', 'clubs', 2), c('3C', 'clubs', 3),
    ];
    const passed = chooseAiPass(hand, 'left', 'medium');
    expect(passed.map((x) => x.id).sort()).toEqual(['AS', 'KS', 'QS']);
  });
  it('leads lowest non-heart while hearts unbroken', () => {
    const hand: Card[] = [
      c('5C', 'clubs', 5), c('2D', 'diamonds', 2), c('3H', 'hearts', 3),
    ];
    const trick: Trick = { leader: 1, leadSuit: null, plays: [] };
    const choice = chooseAiPlay(hand, trick, [], false, false, 'medium');
    expect(choice.suit).not.toBe('hearts');
    expect(choice.id).toBe('2D');
  });
  it('ducks under current winner when avoidable', () => {
    const hand: Card[] = [c('2C', 'clubs', 2), c('JC', 'clubs', 11)];
    const trick: Trick = {
      leader: 0, leadSuit: 'clubs',
      plays: [{ player: 0, card: c('KC', 'clubs', 13) }],
    };
    const choice = chooseAiPlay(hand, trick, [], false, false, 'medium');
    expect(choice.id).toBe('JC');
  });
  it('takes with lowest legal when forced', () => {
    const hand: Card[] = [c('3C', 'clubs', 3), c('JC', 'clubs', 11)];
    const trick: Trick = {
      leader: 0, leadSuit: 'clubs',
      plays: [{ player: 0, card: c('2C', 'clubs', 2) }],
    };
    const choice = chooseAiPlay(hand, trick, [], false, false, 'medium');
    expect(choice.id).toBe('3C');
  });
});
