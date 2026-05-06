export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

export type PileId =
  | 'stock' | 'waste'
  | 'foundation-spades' | 'foundation-hearts' | 'foundation-clubs' | 'foundation-diamonds'
  | 'tableau-0' | 'tableau-1' | 'tableau-2' | 'tableau-3' | 'tableau-4' | 'tableau-5' | 'tableau-6';

export type Phase = 'idle' | 'playing' | 'won' | 'cascading';

export type Options = {
  draw: 1 | 3;
  scoring: 'standard' | 'vegas' | 'none';
  timed: boolean;
  statusBar: boolean;
  outlineDragging: boolean;
  vegasKeepScore: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  draw: 1,
  scoring: 'standard',
  timed: true,
  statusBar: true,
  outlineDragging: false,
  vegasKeepScore: false,
};

export type GameState = {
  phase: Phase;
  piles: Record<PileId, Card[]>;
  options: Options;
  score: number;
  vegasBalance: number;
  startedAt: number | null;
  elapsedMs: number;
  recyclesUsed: number;
  prev: { piles: Record<PileId, Card[]>; score: number; recyclesUsed: number } | null;
  drag: { from: PileId; cards: Card[]; pointerOffset: { x: number; y: number } } | null;
};

export const ALL_PILES: PileId[] = [
  'stock', 'waste',
  'foundation-spades', 'foundation-hearts', 'foundation-clubs', 'foundation-diamonds',
  'tableau-0', 'tableau-1', 'tableau-2', 'tableau-3', 'tableau-4', 'tableau-5', 'tableau-6',
];

export function emptyPiles(): Record<PileId, Card[]> {
  return {
    stock: [], waste: [],
    'foundation-spades': [], 'foundation-hearts': [], 'foundation-clubs': [], 'foundation-diamonds': [],
    'tableau-0': [], 'tableau-1': [], 'tableau-2': [], 'tableau-3': [], 'tableau-4': [], 'tableau-5': [], 'tableau-6': [],
  };
}

import type { RNG } from './rng';

export function makeDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const suitChar: Record<Suit, string> = { spades: 'S', hearts: 'H', clubs: 'C', diamonds: 'D' };
  const out: Card[] = [];
  for (const suit of suits) {
    for (let r = 1; r <= 13; r++) {
      const rank = r as Rank;
      const rankChar = rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
      out.push({ id: `${rankChar}${suitChar[suit]}`, suit, rank, faceUp: false });
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

export function deal(rng: RNG, options: Options = DEFAULT_OPTIONS): GameState {
  const deck = shuffle(makeDeck(), rng);
  const piles = emptyPiles();
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] };
      if (row === col) card.faceUp = true;
      piles[`tableau-${col}` as PileId].push(card);
    }
  }
  for (; idx < deck.length; idx++) piles.stock.push({ ...deck[idx], faceUp: false });

  const startedAt = options.timed ? Date.now() : null;
  return {
    phase: 'playing',
    piles,
    options,
    score: options.scoring === 'vegas' ? -52 : 0,
    vegasBalance: 0,
    startedAt,
    elapsedMs: 0,
    recyclesUsed: 0,
    prev: null,
    drag: null,
  };
}

export function color(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function canStackOnTableau(top: Card | undefined, candidate: Card): boolean {
  if (!candidate.faceUp) return false;
  if (top === undefined) return candidate.rank === 13;
  if (!top.faceUp) return false;
  return color(top.suit) !== color(candidate.suit) && top.rank === candidate.rank + 1;
}

export function canStackOnFoundation(top: Card | undefined, candidate: Card): boolean {
  if (!candidate.faceUp) return false;
  if (top === undefined) return candidate.rank === 1;
  return top.suit === candidate.suit && candidate.rank === top.rank + 1;
}

export function isValidRun(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  if (!cards.every((c) => c.faceUp)) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i];
    const b = cards[i + 1];
    if (a.rank !== b.rank + 1) return false;
    if (color(a.suit) === color(b.suit)) return false;
  }
  return true;
}
