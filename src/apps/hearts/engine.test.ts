import { describe, it, expect } from 'vitest';
import {
  makeDeck,
  deal,
  legalCardsForLead,
  legalCardsForFollow,
  trickWinner,
  pointsInCards,
  shotTheMoon,
  emptyTaken,
  emptyScores,
  DEFAULT_OPTIONS,
  type PlayerId,
  type Card,
  type Trick,
  type GameState,
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

describe('reducer/passing', () => {
  it('selectPassCard adds to selections', () => {
    const s0 = deal(makeRng(1));
    const card = s0.hands[0][0];
    const s1 = reducer(s0, { type: 'selectPassCard', card });
    expect(s1.passSelections).toContainEqual(card);
  });
  it('cannot select more than 3 cards', () => {
    const s0 = deal(makeRng(1));
    let s = s0;
    for (let i = 0; i < 4; i++) {
      s = reducer(s, { type: 'selectPassCard', card: s0.hands[0][i] });
    }
    expect(s.passSelections).toHaveLength(3);
  });
  it('deselectPassCard removes from selections', () => {
    const s0 = deal(makeRng(1));
    const card = s0.hands[0][0];
    const s1 = reducer(s0, { type: 'selectPassCard', card });
    const s2 = reducer(s1, { type: 'deselectPassCard', card });
    expect(s2.passSelections).not.toContainEqual(card);
  });
  it('submitPass with fewer than 3 selections is a no-op', () => {
    const s0 = deal(makeRng(1));
    const aiPasses: Record<PlayerId, Card[]> = { 0: [], 1: [], 2: [], 3: [] };
    const s1 = reducer(s0, { type: 'submitPass', humanSelection: [], aiPasses });
    expect(s1).toBe(s0);
  });
  it('submitPass with 3 cards exchanges and moves to playing', () => {
    const s0 = deal(makeRng(1));
    const human3 = s0.hands[0].slice(0, 3);
    const ai1_3 = s0.hands[1].slice(0, 3);
    const ai2_3 = s0.hands[2].slice(0, 3);
    const ai3_3 = s0.hands[3].slice(0, 3);
    const aiPasses: Record<PlayerId, Card[]> = { 0: human3, 1: ai1_3, 2: ai2_3, 3: ai3_3 };
    const s1 = reducer(s0, { type: 'submitPass', humanSelection: human3, aiPasses });
    expect(s1.phase).toBe('playing');
    // Direction is 'left' so each player passes to (player+1)%4.
    for (const c of human3) {
      expect(s1.hands[1]).toContainEqual(c);
      expect(s1.hands[0]).not.toContainEqual(c);
    }
    const twoCHolder = ([0, 1, 2, 3] as PlayerId[]).find((p) =>
      s1.hands[p].some((c) => c.id === '2C'),
    );
    expect(s1.turn).toBe(twoCHolder);
  });
  it('keep direction: hands unchanged, jumps straight to playing', () => {
    const s0 = { ...deal(makeRng(1)), passDirection: 'keep' as const };
    const s1 = reducer(s0, { type: 'submitPass', humanSelection: [], aiPasses: { 0: [], 1: [], 2: [], 3: [] } });
    expect(s1.phase).toBe('playing');
    expect(s1.hands).toEqual(s0.hands);
  });
});

import { reducer } from './engine';

describe('reducer/resolveTrick', () => {
  it('moves trick cards to winner taken pile and starts new trick', () => {
    const trick: Trick = {
      leader: 0, leadSuit: 'clubs',
      plays: [
        { player: 0, card: c('5C', 'clubs', 5) },
        { player: 1, card: c('KC', 'clubs', 13) },
        { player: 2, card: c('3D', 'diamonds', 3) },
        { player: 3, card: c('7C', 'clubs', 7) },
      ],
    };
    const s: GameState = {
      phase: 'trick-resolved',
      hands: { 0: [c('A', 'spades', 14)], 1: [], 2: [], 3: [] },
      taken: emptyTaken(),
      scores: emptyScores(),
      handNumber: 0,
      passDirection: 'left',
      passSelections: null,
      passReceived: null,
      heartsBroken: false,
      trick,
      turn: null,
      history: [...trick.plays.map((p) => p.card)],
      options: DEFAULT_OPTIONS,
      prev: null,
    };
    const s1 = reducer(s, { type: 'resolveTrick' });
    expect(s1.taken[1]).toHaveLength(4);
    expect(s1.trick).toEqual({ leader: 1, leadSuit: null, plays: [] });
    expect(s1.turn).toBe(1);
    expect(s1.phase).toBe('playing');
  });
  it('after 13 tricks (52 cards in history), transitions to hand-over', () => {
    const trick: Trick = {
      leader: 0, leadSuit: 'clubs',
      plays: [
        { player: 0, card: c('5C', 'clubs', 5) },
        { player: 1, card: c('6C', 'clubs', 6) },
        { player: 2, card: c('7C', 'clubs', 7) },
        { player: 3, card: c('8C', 'clubs', 8) },
      ],
    };
    const history: Card[] = [];
    for (let i = 0; i < 48; i++) history.push(c(`X${i}`, 'clubs', 5));
    const s: GameState = {
      phase: 'trick-resolved',
      hands: { 0: [], 1: [], 2: [], 3: [] },
      taken: emptyTaken(),
      scores: emptyScores(),
      handNumber: 0,
      passDirection: 'left',
      passSelections: null,
      passReceived: null,
      heartsBroken: true,
      trick,
      turn: null,
      history: [...history, ...trick.plays.map((p) => p.card)],
      options: DEFAULT_OPTIONS,
      prev: null,
    };
    const s1 = reducer(s, { type: 'resolveTrick' });
    expect(s1.phase).toBe('hand-over');
  });
});

describe('reducer/playCard', () => {
  function startedState() {
    const s = deal(makeRng(1));
    const human3 = s.hands[0].slice(0, 3);
    const ai1_3 = s.hands[1].slice(0, 3);
    const ai2_3 = s.hands[2].slice(0, 3);
    const ai3_3 = s.hands[3].slice(0, 3);
    return reducer(s, { type: 'submitPass', humanSelection: human3, aiPasses: { 0: human3, 1: ai1_3, 2: ai2_3, 3: ai3_3 } });
  }
  it('legal play moves card from hand to trick and advances turn', () => {
    let s = startedState();
    const player = s.turn!;
    const card = s.hands[player].find((c) => c.id === '2C')!;
    s = reducer(s, { type: 'playCard', player, card });
    expect(s.hands[player]).not.toContainEqual(card);
    expect(s.trick!.plays.map((p) => p.card.id)).toContain('2C');
    expect(s.history.map((c) => c.id)).toContain('2C');
    expect(s.turn).toBe(((player + 1) % 4) as PlayerId);
  });
  it('illegal play (wrong player) is no-op', () => {
    const s = startedState();
    const wrongPlayer = ((s.turn! + 1) % 4) as PlayerId;
    const card = s.hands[wrongPlayer][0];
    expect(reducer(s, { type: 'playCard', player: wrongPlayer, card })).toBe(s);
  });
  it('first card sets leadSuit', () => {
    let s = startedState();
    const player = s.turn!;
    const card = s.hands[player].find((c) => c.id === '2C')!;
    s = reducer(s, { type: 'playCard', player, card });
    expect(s.trick!.leadSuit).toBe('clubs');
  });
  it('heartsBroken flips when a heart is played off-suit', () => {
    const hands: Record<PlayerId, Card[]> = {
      0: [c('5C', 'clubs', 5), c('5H', 'hearts', 5)],
      1: [c('XH', 'hearts', 5)],  // no clubs (id different from 5H to keep ids distinct)
      2: [c('6C', 'clubs', 6)],
      3: [c('7C', 'clubs', 7)],
    };
    const s: GameState = {
      phase: 'playing',
      hands,
      taken: emptyTaken(),
      scores: emptyScores(),
      handNumber: 0,
      passDirection: 'left',
      passSelections: null,
      passReceived: null,
      heartsBroken: false,
      trick: { leader: 0, leadSuit: null, plays: [] },
      turn: 0,
      history: [],
      options: DEFAULT_OPTIONS,
      prev: null,
    };
    const s1 = reducer(s, { type: 'playCard', player: 0, card: c('5C', 'clubs', 5) });
    expect(s1.heartsBroken).toBe(false);
    const s2 = reducer(s1, { type: 'playCard', player: 1, card: c('XH', 'hearts', 5) });
    expect(s2.heartsBroken).toBe(true);
  });
});
