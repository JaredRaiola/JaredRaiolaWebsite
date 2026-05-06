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

function checkWin(state: GameState): GameState {
  // Win when every non-mine cell is revealed.
  for (const c of state.cells) {
    if (!c.mine && !c.revealed) return state;
  }
  // Auto-flag remaining mines.
  let flagsPlaced = state.flagsPlaced;
  const cells = state.cells.map((c) => {
    if (c.mine && c.mark !== 'flag') {
      flagsPlaced++;
      return { ...c, mark: 'flag' as const };
    }
    return c;
  });
  return { ...state, cells, flagsPlaced, phase: 'won' };
}

export function reveal(state: GameState, idx: number, rng: Rng = Math.random): GameState {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  if (state.cells[idx].revealed || state.cells[idx].mark === 'flag') return state;

  let next = state;
  if (next.phase === 'idle') {
    next = placeMines(next, idx, rng);
    next = { ...next, phase: 'playing', startedAt: Date.now() };
  }

  // Click on a mine: reveal all mines, mark the clicked one exploded.
  if (next.cells[idx].mine) {
    const cells = next.cells.map((c, i) => {
      if (i === idx) return { ...c, revealed: true, exploded: true };
      if (c.mine) return { ...c, revealed: true };
      return c;
    });
    return { ...next, cells, phase: 'lost' };
  }

  const cells = next.cells.map((c) => ({ ...c }));
  const w = next.width;
  const h = next.height;
  const stack: number[] = [idx];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const cell = cells[cur];
    if (cell.revealed || cell.mark === 'flag') continue;
    cell.revealed = true;
    if (cell.mine) continue;
    if (cell.adjacent === 0) {
      const col = cur % w;
      const row = Math.floor(cur / w);
      for (const n of neighbors(col, row, w, h)) {
        if (!cells[n].revealed && cells[n].mark !== 'flag') stack.push(n);
      }
    }
  }
  return checkWin({ ...next, cells });
}

export function chord(state: GameState, idx: number, rng: Rng = Math.random): GameState {
  if (state.phase !== 'playing') return state;
  const cell = state.cells[idx];
  if (!cell.revealed || cell.adjacent === 0) return state;
  const col = idx % state.width;
  const row = Math.floor(idx / state.width);
  const ns = neighbors(col, row, state.width, state.height);
  let flagged = 0;
  for (const n of ns) if (state.cells[n].mark === 'flag') flagged++;
  if (flagged !== cell.adjacent) return state;
  let next = state;
  for (const n of ns) {
    if (next.cells[n].mark === 'flag' || next.cells[n].revealed) continue;
    if (next.cells[n].mine) {
      // Wrong flag → mine click → loss. Mark exploded; subsequent task fully reveals other mines via reveal().
      const cells = next.cells.map((c) => ({ ...c }));
      cells[n].revealed = true;
      cells[n].exploded = true;
      return { ...next, cells, phase: 'lost' };
    }
    next = reveal(next, n, rng);
  }
  return next;
}

export function toggleMark(state: GameState, idx: number): GameState {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  const cell = state.cells[idx];
  if (cell.revealed) return state;
  let nextMark: Mark;
  let flagDelta = 0;
  if (cell.mark === 'none') {
    nextMark = 'flag';
    flagDelta = 1;
  } else if (cell.mark === 'flag') {
    nextMark = state.marksEnabled ? 'question' : 'none';
    flagDelta = -1;
  } else {
    nextMark = 'none';
  }
  const cells = state.cells.map((c, i) => (i === idx ? { ...c, mark: nextMark } : c));
  return { ...state, cells, flagsPlaced: state.flagsPlaced + flagDelta };
}

export function tick(state: GameState, now: number): GameState {
  if (state.phase !== 'playing' || state.startedAt === null) return state;
  const elapsedMs = Math.max(0, now - state.startedAt);
  if (elapsedMs === state.elapsedMs) return state;
  return { ...state, elapsedMs };
}

export function newGame(state: GameState): GameState {
  const fresh = createInitialState({ width: state.width, height: state.height, mines: state.mines });
  return { ...fresh, marksEnabled: state.marksEnabled };
}

export function setMarksEnabled(state: GameState, enabled: boolean): GameState {
  if (state.marksEnabled === enabled) return state;
  return { ...state, marksEnabled: enabled };
}
