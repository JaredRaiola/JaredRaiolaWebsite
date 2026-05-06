import { dealForGameNumber } from './msrng';

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

export function dealGame(gameNumber: number): GameState {
  return {
    phase: 'playing',
    piles: dealForGameNumber(gameNumber),
    gameNumber,
    startedAt: Date.now(),
    elapsedMs: 0,
    moveCount: 0,
    prev: null,
  };
}

export function canStackOnTableau(top: Card | undefined, candidate: Card): boolean {
  if (top === undefined) return true;
  return color(top.suit) !== color(candidate.suit) && top.rank === candidate.rank + 1;
}

export function canStackOnFoundation(top: Card | undefined, candidate: Card): boolean {
  if (top === undefined) return candidate.rank === 1;
  return top.suit === candidate.suit && candidate.rank === top.rank + 1;
}

export function isValidRun(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i];
    const b = cards[i + 1];
    if (a.rank !== b.rank + 1) return false;
    if (color(a.suit) === color(b.suit)) return false;
  }
  return true;
}

export function supermoveCapacity(state: GameState, destIsEmptyCol: boolean): number {
  let freeCells = 0;
  for (const c of CELLS) if (state.piles[c].length === 0) freeCells++;
  let emptyCols = 0;
  for (const t of TABLEAUS) if (state.piles[t].length === 0) emptyCols++;
  if (destIsEmptyCol) emptyCols = Math.max(0, emptyCols - 1);
  return (freeCells + 1) * Math.pow(2, emptyCols);
}

export type Action =
  | { type: 'tryMove'; from: PileId; fromIdx: number; to: PileId }
  | { type: 'autoMoveToFoundation'; from: PileId }
  | { type: 'cascadeStep' }
  | { type: 'cascadeSkip' }
  | { type: 'undo' }
  | { type: 'newGame'; gameNumber: number }
  | { type: 'tick'; now: number };

function clonePiles(p: Record<PileId, Card[]>): Record<PileId, Card[]> {
  const out = emptyPiles();
  for (const k of ALL_PILES) out[k] = p[k].map((c) => ({ ...c }));
  return out;
}

function snapshotPrev(s: GameState): GameState['prev'] {
  return { piles: clonePiles(s.piles), moveCount: s.moveCount };
}

function isCell(p: PileId): boolean { return p.startsWith('cell-'); }
function isFoundation(p: PileId): boolean { return p.startsWith('foundation-'); }
function isTableau(p: PileId): boolean { return p.startsWith('tableau-'); }

function tryMove(s: GameState, from: PileId, fromIdx: number, to: PileId): GameState {
  if (s.phase !== 'playing') return s;
  if (from === to) return s;
  const src = s.piles[from];
  if (fromIdx < 0 || fromIdx >= src.length) return s;
  const moving = src.slice(fromIdx);

  // Free cell can only accept a single card and only when empty.
  if (isCell(to)) {
    if (moving.length !== 1) return s;
    if (s.piles[to].length !== 0) return s;
  }

  // Foundation only accepts a single card.
  if (isFoundation(to)) {
    if (moving.length !== 1) return s;
    if (!canStackOnFoundation(s.piles[to][s.piles[to].length - 1], moving[0])) return s;
  }

  // Tableau accepts single card or a valid run.
  if (isTableau(to)) {
    if (!isValidRun(moving)) return s;
    const top = s.piles[to][s.piles[to].length - 1];
    if (!canStackOnTableau(top, moving[0])) return s;
    if (moving.length > 1) {
      const destEmpty = s.piles[to].length === 0;
      if (moving.length > supermoveCapacity(s, destEmpty)) return s;
    }
  }

  // Apply.
  const piles = clonePiles(s.piles);
  piles[from] = piles[from].slice(0, fromIdx);
  piles[to] = piles[to].concat(moving.map((c) => ({ ...c })));
  return { ...s, piles, moveCount: s.moveCount + 1, prev: snapshotPrev(s) };
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'tryMove': return tryMove(s, a.from, a.fromIdx, a.to);
    default: return s;
  }
}
