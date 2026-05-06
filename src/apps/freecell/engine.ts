export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Card = { id: string; suit: Suit; rank: Rank };

export type CellId = 'cell-0' | 'cell-1' | 'cell-2' | 'cell-3';
export type FoundationId =
  | 'foundation-spades' | 'foundation-hearts'
  | 'foundation-clubs' | 'foundation-diamonds';
export type TableauId =
  | 'tableau-0' | 'tableau-1' | 'tableau-2' | 'tableau-3'
  | 'tableau-4' | 'tableau-5' | 'tableau-6' | 'tableau-7';
export type PileId = CellId | FoundationId | TableauId;

export const CELLS: CellId[] = ['cell-0', 'cell-1', 'cell-2', 'cell-3'];
export const FOUNDATIONS: FoundationId[] = [
  'foundation-spades', 'foundation-hearts', 'foundation-clubs', 'foundation-diamonds',
];
export const TABLEAUS: TableauId[] = [
  'tableau-0', 'tableau-1', 'tableau-2', 'tableau-3',
  'tableau-4', 'tableau-5', 'tableau-6', 'tableau-7',
];
export const ALL_PILES: PileId[] = [...CELLS, ...FOUNDATIONS, ...TABLEAUS];

export type Phase = 'playing' | 'cascading' | 'won' | 'lost';

export type GameState = {
  phase: Phase;
  piles: Record<PileId, Card[]>;
  gameNumber: number;
  startedAt: number | null;
  elapsedMs: number;
  moveCount: number;
  prev: { piles: Record<PileId, Card[]>; moveCount: number } | null;
};

export function emptyPiles(): Record<PileId, Card[]> {
  const out = {} as Record<PileId, Card[]>;
  for (const p of ALL_PILES) out[p] = [];
  return out;
}

export function color(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}
