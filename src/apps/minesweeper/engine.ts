import type { DifficultyConfig } from './difficulties';

export type Phase = 'idle' | 'playing' | 'won' | 'lost';
export type Mark = 'none' | 'flag' | 'question';

export type Cell = {
  mine: boolean;
  revealed: boolean;
  mark: Mark;
  adjacent: number;
  exploded?: boolean;
};

export type GameState = {
  phase: Phase;
  width: number;
  height: number;
  mines: number;
  cells: Cell[];
  flagsPlaced: number;
  startedAt: number | null;
  elapsedMs: number;
  pressedTile: number | null;
  marksEnabled: boolean;
};

export function createInitialState(config: DifficultyConfig): GameState {
  const cells: Cell[] = [];
  for (let i = 0; i < config.width * config.height; i++) {
    cells.push({ mine: false, revealed: false, mark: 'none', adjacent: 0 });
  }
  return {
    phase: 'idle',
    width: config.width,
    height: config.height,
    mines: config.mines,
    cells,
    flagsPlaced: 0,
    startedAt: null,
    elapsedMs: 0,
    pressedTile: null,
    marksEnabled: true,
  };
}
