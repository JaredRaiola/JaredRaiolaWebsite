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

export type Action =
  | { type: 'drawFromStock' }
  | { type: 'tryMove'; from: PileId; fromIdx: number; to: PileId }
  | { type: 'autoMoveToFoundation'; from: PileId }
  | { type: 'autoFinish' }
  | { type: 'undo' }
  | { type: 'deal'; rng: RNG }
  | { type: 'pickUpDrag'; from: PileId; cards: Card[]; pointerOffset: { x: number; y: number } }
  | { type: 'cancelDrag' }
  | { type: 'setOptions'; options: Partial<Options> }
  | { type: 'tick'; now: number };

function snapshotPrev(s: GameState): GameState['prev'] {
  return { piles: clonePiles(s.piles), score: s.score, recyclesUsed: s.recyclesUsed };
}

function clonePiles(p: Record<PileId, Card[]>): Record<PileId, Card[]> {
  const out = emptyPiles();
  for (const k of ALL_PILES) out[k] = p[k].map((c) => ({ ...c }));
  return out;
}

function maxRecyclesForVegas(draw: 1 | 3): number {
  return draw === 1 ? 1 : 3;
}

function drawFromStock(s: GameState): GameState {
  if (s.phase !== 'playing') return s;
  if (s.piles.stock.length > 0) {
    const piles = clonePiles(s.piles);
    const n = Math.min(s.options.draw, piles.stock.length);
    for (let i = 0; i < n; i++) {
      const card = piles.stock.pop()!;
      card.faceUp = true;
      piles.waste.push(card);
    }
    return { ...s, piles, prev: snapshotPrev(s) };
  }
  if (s.piles.waste.length === 0) return s;
  if (s.options.scoring === 'vegas' && s.recyclesUsed >= maxRecyclesForVegas(s.options.draw)) return s;
  const piles = clonePiles(s.piles);
  while (piles.waste.length > 0) {
    const card = piles.waste.pop()!;
    card.faceUp = false;
    piles.stock.push(card);
  }
  let score = s.score;
  if (s.options.scoring === 'standard') {
    score = Math.max(0, score - (s.options.draw === 1 ? 100 : 20));
  }
  return { ...s, piles, score, recyclesUsed: s.recyclesUsed + 1, prev: snapshotPrev(s) };
}

function isFoundationPile(p: PileId): boolean {
  return p.startsWith('foundation-');
}

function isTableauPile(p: PileId): boolean {
  return p.startsWith('tableau-');
}

function tryMove(s: GameState, from: PileId, fromIdx: number, to: PileId): GameState {
  if (s.phase !== 'playing') return s;
  if (from === to) return s;
  const src = s.piles[from];
  if (fromIdx < 0 || fromIdx >= src.length) return s;
  const moving = src.slice(fromIdx);
  if (!isValidRun(moving)) return s;

  if (isFoundationPile(to)) {
    if (moving.length !== 1) return s;
    if (!canStackOnFoundation(s.piles[to][s.piles[to].length - 1], moving[0])) return s;
  } else if (isTableauPile(to)) {
    const top = s.piles[to][s.piles[to].length - 1];
    if (!canStackOnTableau(top, moving[0])) return s;
  } else {
    return s;
  }

  const piles = clonePiles(s.piles);
  piles[from] = piles[from].slice(0, fromIdx);
  piles[to] = piles[to].concat(moving.map((c) => ({ ...c })));
  if (isTableauPile(from)) {
    const newTop = piles[from][piles[from].length - 1];
    if (newTop && !newTop.faceUp) newTop.faceUp = true;
  }

  return { ...s, piles, prev: snapshotPrev(s) };
}

function autoMoveToFoundation(s: GameState, from: PileId): GameState {
  if (s.phase !== 'playing') return s;
  const src = s.piles[from];
  if (src.length === 0) return s;
  const top = src[src.length - 1];
  if (!top.faceUp) return s;
  const dest = `foundation-${top.suit}` as PileId;
  return tryMove(s, from, src.length - 1, dest);
}

function checkWin(s: GameState): GameState {
  const total =
    s.piles['foundation-spades'].length +
    s.piles['foundation-hearts'].length +
    s.piles['foundation-clubs'].length +
    s.piles['foundation-diamonds'].length;
  if (total === 52 && s.phase === 'playing') return { ...s, phase: 'won' };
  return s;
}

function canAutoFinish(s: GameState): boolean {
  if (s.piles.stock.length > 0 || s.piles.waste.length > 0) return false;
  for (let i = 0; i < 7; i++) {
    const col = s.piles[`tableau-${i}` as PileId];
    if (col.some((c) => !c.faceUp)) return false;
  }
  return true;
}

function autoFinish(s: GameState): GameState {
  if (s.phase !== 'playing') return s;
  if (!canAutoFinish(s)) return s;
  let cur = s;
  let safety = 200;
  while (safety-- > 0) {
    let moved = false;
    for (let i = 0; i < 7; i++) {
      const pile = `tableau-${i}` as PileId;
      const next = autoMoveToFoundation(cur, pile);
      if (next !== cur) { cur = next; moved = true; break; }
    }
    if (!moved) break;
  }
  return checkWin(cur);
}

function applied(s: GameState): GameState { return checkWin(s); }

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'drawFromStock': return applied(drawFromStock(s));
    case 'tryMove': return applied(tryMove(s, a.from, a.fromIdx, a.to));
    case 'autoMoveToFoundation': return applied(autoMoveToFoundation(s, a.from));
    case 'autoFinish': return autoFinish(s);
    default: return s;
  }
}
