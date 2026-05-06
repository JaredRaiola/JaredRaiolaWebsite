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

export type Rng = () => number; // returns float in [0, 1)

export function neighbors(col: number, row: number, w: number, h: number): number[] {
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= h || c < 0 || c >= w) continue;
      out.push(r * w + c);
    }
  }
  return out;
}

function placeMines(state: GameState, safeIdx: number, rng: Rng): GameState {
  const total = state.width * state.height;
  const candidates: number[] = [];
  for (let i = 0; i < total; i++) if (i !== safeIdx) candidates.push(i);
  // Fisher-Yates shuffle prefix of size `mines`.
  for (let i = 0; i < state.mines; i++) {
    const j = i + Math.floor(rng() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const cells = state.cells.map((c) => ({ ...c }));
  for (let i = 0; i < state.mines; i++) cells[candidates[i]].mine = true;
  // Compute adjacency.
  for (let row = 0; row < state.height; row++) {
    for (let col = 0; col < state.width; col++) {
      const idx = row * state.width + col;
      if (cells[idx].mine) continue;
      let count = 0;
      for (const n of neighbors(col, row, state.width, state.height)) {
        if (cells[n].mine) count++;
      }
      cells[idx].adjacent = count;
    }
  }
  return { ...state, cells };
}

export function reveal(state: GameState, idx: number, rng: Rng = Math.random): GameState {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  if (state.cells[idx].revealed || state.cells[idx].mark === 'flag') return state;

  let next = state;
  if (next.phase === 'idle') {
    next = placeMines(next, idx, rng);
    next = { ...next, phase: 'playing', startedAt: Date.now() };
  }
  // Reveal logic implemented in next task. For now, just mark the clicked cell revealed.
  const cells = next.cells.map((c) => ({ ...c }));
  cells[idx].revealed = true;
  return { ...next, cells };
}
