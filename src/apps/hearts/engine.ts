export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Card = { id: string; suit: Suit; rank: Rank };

export type PlayerId = 0 | 1 | 2 | 3;
export const PLAYERS: PlayerId[] = [0, 1, 2, 3];

export type Phase = 'passing' | 'playing' | 'trick-resolved' | 'hand-over' | 'game-over';
export type PassDirection = 'left' | 'right' | 'across' | 'keep';

export type Trick = {
  leader: PlayerId;
  plays: { player: PlayerId; card: Card }[];
  leadSuit: Suit | null;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Options = {
  difficulty: Difficulty;
  showAiHands: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  difficulty: 'medium',
  showAiHands: false,
};

export type GameState = {
  phase: Phase;
  hands: Record<PlayerId, Card[]>;
  taken: Record<PlayerId, Card[]>;
  scores: Record<PlayerId, number>;
  handNumber: number;
  passDirection: PassDirection;
  passSelections: Card[] | null;
  passReceived: Record<PlayerId, Card[]> | null;
  heartsBroken: boolean;
  trick: Trick | null;
  turn: PlayerId | null;
  history: Card[];
  options: Options;
  prev: Pick<GameState, 'hands' | 'taken' | 'trick' | 'turn' | 'history' | 'heartsBroken'> | null;
};

export function passDirectionForHand(handNumber: number): PassDirection {
  const cycle: PassDirection[] = ['left', 'right', 'across', 'keep'];
  return cycle[handNumber % 4];
}

export function emptyHands(): Record<PlayerId, Card[]> {
  return { 0: [], 1: [], 2: [], 3: [] };
}

export function emptyTaken(): Record<PlayerId, Card[]> {
  return { 0: [], 1: [], 2: [], 3: [] };
}

export function emptyScores(): Record<PlayerId, number> {
  return { 0: 0, 1: 0, 2: 0, 3: 0 };
}

import type { RNG } from './rng';

export function makeDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const suitChar: Record<Suit, string> = { spades: 'S', hearts: 'H', clubs: 'C', diamonds: 'D' };
  const out: Card[] = [];
  for (const suit of suits) {
    for (let r = 2; r <= 14; r++) {
      const rank = r as Rank;
      const rankChar = rank === 14 ? 'A' : rank === 13 ? 'K' : rank === 12 ? 'Q' : rank === 11 ? 'J' : String(rank);
      out.push({ id: `${rankChar}${suitChar[suit]}`, suit, rank });
    }
  }
  return out;
}

function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortHand(cards: Card[]): Card[] {
  const order: Record<Suit, number> = { clubs: 0, diamonds: 1, spades: 2, hearts: 3 };
  return cards.slice().sort((a, b) => {
    if (a.suit !== b.suit) return order[a.suit] - order[b.suit];
    return a.rank - b.rank;
  });
}

export function deal(rng: RNG, options: Options = DEFAULT_OPTIONS): GameState {
  const deck = shuffle(makeDeck(), rng);
  const hands: Record<PlayerId, Card[]> = emptyHands();
  for (let i = 0; i < 52; i++) {
    const p = (i % 4) as PlayerId;
    hands[p].push(deck[i]);
  }
  for (const p of PLAYERS) hands[p] = sortHand(hands[p]);
  return {
    phase: 'passing',
    hands,
    taken: emptyTaken(),
    scores: emptyScores(),
    handNumber: 0,
    passDirection: passDirectionForHand(0),
    passSelections: [],
    passReceived: null,
    heartsBroken: false,
    trick: null,
    turn: null,
    history: [],
    options,
    prev: null,
  };
}

const POINTS_CARDS_FILTER = (c: Card): boolean => c.suit === 'hearts' || (c.suit === 'spades' && c.rank === 12);

export function legalCardsForLead(hand: Card[], heartsBroken: boolean, isFirstTrick: boolean): Card[] {
  if (isFirstTrick) {
    const twoClubs = hand.find((c) => c.suit === 'clubs' && c.rank === 2);
    return twoClubs ? [twoClubs] : hand.slice();
  }
  if (heartsBroken) return hand.slice();
  const nonHearts = hand.filter((c) => c.suit !== 'hearts');
  return nonHearts.length > 0 ? nonHearts : hand.slice();
}

export function legalCardsForFollow(
  hand: Card[],
  trick: Trick,
  _heartsBroken: boolean,
  isFirstTrick: boolean,
): Card[] {
  const lead = trick.leadSuit;
  if (lead) {
    const inSuit = hand.filter((c) => c.suit === lead);
    if (inSuit.length > 0) return inSuit;
  }
  if (isFirstTrick) {
    const nonPoints = hand.filter((c) => !POINTS_CARDS_FILTER(c));
    if (nonPoints.length > 0) return nonPoints;
  }
  return hand.slice();
}

export function trickWinner(trick: Trick): PlayerId {
  if (trick.plays.length === 0 || trick.leadSuit === null) {
    throw new Error('trickWinner called on empty trick');
  }
  const lead = trick.leadSuit;
  let best = trick.plays[0];
  for (const p of trick.plays) {
    if (p.card.suit === lead && p.card.rank > best.card.rank) best = p;
    if (best.card.suit !== lead && p.card.suit === lead) best = p;
  }
  return best.player;
}

export function pointsInCards(cards: Card[]): number {
  let sum = 0;
  for (const c of cards) {
    if (c.suit === 'hearts') sum += 1;
    if (c.suit === 'spades' && c.rank === 12) sum += 13;
  }
  return sum;
}

export function shotTheMoon(taken: Card[]): boolean {
  return pointsInCards(taken) === 26;
}

export type Action =
  | { type: 'selectPassCard'; card: Card }
  | { type: 'deselectPassCard'; card: Card }
  | { type: 'submitPass'; humanSelection: Card[]; aiPasses: Record<PlayerId, Card[]> }
  | { type: 'playCard'; player: PlayerId; card: Card }
  | { type: 'aiPlay'; player: PlayerId; card: Card }
  | { type: 'resolveTrick' }
  | { type: 'nextHand'; rng: RNG }
  | { type: 'undo' }
  | { type: 'newGame'; rng: RNG }
  | { type: 'setOptions'; options: Partial<Options> };

function passRecipient(from: PlayerId, direction: PassDirection): PlayerId | null {
  if (direction === 'keep') return null;
  if (direction === 'left') return ((from + 1) % 4) as PlayerId;
  if (direction === 'right') return ((from + 3) % 4) as PlayerId;
  return ((from + 2) % 4) as PlayerId;
}

function findTwoClubsHolder(hands: Record<PlayerId, Card[]>): PlayerId {
  for (const p of PLAYERS) {
    if (hands[p].some((c) => c.id === '2C')) return p;
  }
  throw new Error('2C not found in any hand');
}

function selectPassCard(s: GameState, card: Card): GameState {
  if (s.phase !== 'passing') return s;
  if (s.passSelections === null) return s;
  if (s.passSelections.some((c) => c.id === card.id)) return s;
  if (s.passSelections.length >= 3) return s;
  return { ...s, passSelections: [...s.passSelections, card] };
}

function deselectPassCard(s: GameState, card: Card): GameState {
  if (s.phase !== 'passing' || s.passSelections === null) return s;
  return { ...s, passSelections: s.passSelections.filter((c) => c.id !== card.id) };
}

function submitPass(
  s: GameState,
  humanSelection: Card[],
  aiPasses: Record<PlayerId, Card[]>,
): GameState {
  if (s.phase !== 'passing') return s;
  if (s.passDirection !== 'keep' && humanSelection.length !== 3) return s;
  const newHands: Record<PlayerId, Card[]> = {
    0: s.hands[0].slice(), 1: s.hands[1].slice(), 2: s.hands[2].slice(), 3: s.hands[3].slice(),
  };
  const passReceived: Record<PlayerId, Card[]> = { 0: [], 1: [], 2: [], 3: [] };
  if (s.passDirection !== 'keep') {
    const sources: Record<PlayerId, Card[]> = { ...aiPasses, 0: humanSelection };
    for (const from of PLAYERS) {
      const to = passRecipient(from, s.passDirection)!;
      newHands[from] = newHands[from].filter((c) => !sources[from].some((x) => x.id === c.id));
      newHands[to] = [...newHands[to], ...sources[from]];
      passReceived[to] = sources[from];
    }
  }
  const turn = findTwoClubsHolder(newHands);
  return {
    ...s,
    phase: 'playing',
    hands: newHands,
    passSelections: null,
    passReceived: s.passDirection === 'keep' ? null : passReceived,
    turn,
    trick: { leader: turn, leadSuit: null, plays: [] },
    history: [],
    heartsBroken: false,
  };
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'selectPassCard': return selectPassCard(s, a.card);
    case 'deselectPassCard': return deselectPassCard(s, a.card);
    case 'submitPass': return submitPass(s, a.humanSelection, a.aiPasses);
    default: return s;
  }
}
