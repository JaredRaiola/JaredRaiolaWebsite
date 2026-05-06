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
