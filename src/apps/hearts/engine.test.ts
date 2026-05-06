import { describe, it, expect } from 'vitest';
import {
  makeDeck,
  deal,
  legalCardsForLead,
  legalCardsForFollow,
  trickWinner,
  pointsInCards,
  shotTheMoon,
  type PlayerId,
  type Card,
  type Trick,
} from './engine';
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

const c = (id: string, suit: Card['suit'], rank: Card['rank']): Card => ({ id, suit, rank });

describe('legalCardsForLead', () => {
  it('first trick: must lead 2 of clubs', () => {
    const hand: Card[] = [c('2C', 'clubs', 2), c('5H', 'hearts', 5), c('AS', 'spades', 14)];
    expect(legalCardsForLead(hand, false, true).map((x) => x.id)).toEqual(['2C']);
  });
  it('cannot lead hearts before broken', () => {
    const hand: Card[] = [c('5H', 'hearts', 5), c('5C', 'clubs', 5), c('5D', 'diamonds', 5)];
    const legal = legalCardsForLead(hand, false, false);
    expect(legal.find((x) => x.suit === 'hearts')).toBeUndefined();
  });
  it('can lead hearts once broken', () => {
    const hand: Card[] = [c('5H', 'hearts', 5), c('5C', 'clubs', 5)];
    const legal = legalCardsForLead(hand, true, false);
    expect(legal.find((x) => x.suit === 'hearts')).toBeDefined();
  });
  it('can lead hearts when only hearts left', () => {
    const hand: Card[] = [c('5H', 'hearts', 5), c('7H', 'hearts', 7)];
    const legal = legalCardsForLead(hand, false, false);
    expect(legal).toHaveLength(2);
  });
});

describe('legalCardsForFollow', () => {
  const trick: Trick = {
    leader: 0, leadSuit: 'clubs',
    plays: [{ player: 0, card: c('5C', 'clubs', 5) }],
  };
  it('must follow led suit if able', () => {
    const hand: Card[] = [c('3C', 'clubs', 3), c('5H', 'hearts', 5), c('AS', 'spades', 14)];
    expect(legalCardsForFollow(hand, trick, false, false).map((x) => x.id)).toEqual(['3C']);
  });
  it('can play anything if no led suit cards', () => {
    const hand: Card[] = [c('5H', 'hearts', 5), c('AS', 'spades', 14)];
    const legal = legalCardsForFollow(hand, trick, false, false);
    expect(legal).toHaveLength(2);
  });
  it('first trick: cannot dump hearts or QS even when off-suit', () => {
    const hand: Card[] = [c('5H', 'hearts', 5), c('QS', 'spades', 12), c('AS', 'spades', 14)];
    const legal = legalCardsForFollow(hand, trick, false, true);
    expect(legal.map((x) => x.id)).toEqual(['AS']);
  });
  it('first trick: only points cards left in off-suit — allowed', () => {
    const hand: Card[] = [c('5H', 'hearts', 5), c('QS', 'spades', 12)];
    const legal = legalCardsForFollow(hand, trick, false, true);
    expect(legal.map((x) => x.id).sort()).toEqual(['5H', 'QS']);
  });
});

describe('trickWinner', () => {
  it('highest card of led suit wins', () => {
    const t: Trick = {
      leader: 0, leadSuit: 'clubs',
      plays: [
        { player: 0, card: c('5C', 'clubs', 5) },
        { player: 1, card: c('KC', 'clubs', 13) },
        { player: 2, card: c('3D', 'diamonds', 3) },
        { player: 3, card: c('7C', 'clubs', 7) },
      ],
    };
    expect(trickWinner(t)).toBe(1);
  });
  it('off-suit cannot win even if higher rank', () => {
    const t: Trick = {
      leader: 0, leadSuit: 'clubs',
      plays: [
        { player: 0, card: c('2C', 'clubs', 2) },
        { player: 1, card: c('AS', 'spades', 14) },
        { player: 2, card: c('AH', 'hearts', 14) },
        { player: 3, card: c('AD', 'diamonds', 14) },
      ],
    };
    expect(trickWinner(t)).toBe(0);
  });
});

describe('pointsInCards', () => {
  it('Q of spades worth 13', () => {
    expect(pointsInCards([c('QS', 'spades', 12)])).toBe(13);
  });
  it('each heart worth 1', () => {
    const hearts = [c('2H', 'hearts', 2), c('5H', 'hearts', 5), c('KH', 'hearts', 13)];
    expect(pointsInCards(hearts)).toBe(3);
  });
  it('mixed', () => {
    const cards = [c('QS', 'spades', 12), c('5H', 'hearts', 5), c('AS', 'spades', 14)];
    expect(pointsInCards(cards)).toBe(14);
  });
  it('no points for clubs / diamonds / non-Q spades', () => {
    expect(pointsInCards([c('AS', 'spades', 14), c('5C', 'clubs', 5)])).toBe(0);
  });
});

describe('shotTheMoon', () => {
  it('true when player took all 26 points', () => {
    const taken = [c('QS', 'spades', 12)];
    for (let r = 2; r <= 14; r++) taken.push(c(`H${r}`, 'hearts', r as Card['rank']));
    expect(shotTheMoon(taken)).toBe(true);
  });
  it('false when player took 25 points', () => {
    const taken = [c('QS', 'spades', 12)];
    for (let r = 2; r <= 13; r++) taken.push(c(`H${r}`, 'hearts', r as Card['rank']));
    expect(shotTheMoon(taken)).toBe(false);
  });
});
