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
