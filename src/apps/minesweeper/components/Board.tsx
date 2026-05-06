import { useRef, useState } from 'react';
import { Cell } from './Cell';
import type { GameState } from '../engine';
import { TILE_PX } from '../difficulties';

type Props = {
  state: GameState;
  onReveal(idx: number): void;
  onToggleMark(idx: number): void;
  onChord(idx: number): void;
  onPressTile(idx: number | null): void;
};

export function Board({ state, onReveal, onToggleMark, onChord, onPressTile }: Props) {
  const buttonsDown = useRef<Set<number>>(new Set()); // mouse buttons currently pressed
  const lastIdx = useRef<number | null>(null);
  const [chordPreview, setChordPreview] = useState<Set<number> | null>(null);
  const gameOver = state.phase === 'won' || state.phase === 'lost';

  const computeChordPreview = (idx: number): Set<number> | null => {
    const c = state.cells[idx];
    if (!c.revealed || c.adjacent === 0) return null;
    const col = idx % state.width;
    const row = Math.floor(idx / state.width);
    const out = new Set<number>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const cc = col + dc;
        if (r < 0 || r >= state.height || cc < 0 || cc >= state.width) continue;
        const n = r * state.width + cc;
        const cell = state.cells[n];
        if (!cell.revealed && cell.mark !== 'flag') out.add(n);
      }
    }
    return out;
  };

  const handlePointerDown = (e: React.PointerEvent, idx: number): void => {
    if (gameOver) return;
    e.preventDefault();
    buttonsDown.current.add(e.button);
    lastIdx.current = idx;
    if (buttonsDown.current.has(0) && buttonsDown.current.has(2)) {
      // chord preview
      setChordPreview(computeChordPreview(idx));
      onPressTile(idx);
    } else if (e.button === 0) {
      onPressTile(idx);
    } else if (e.button === 2) {
      onToggleMark(idx);
    } else if (e.button === 1) {
      // middle-click: chord immediately
      onChord(idx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent, idx: number): void => {
    if (gameOver) {
      buttonsDown.current.clear();
      return;
    }
    const wasChord = buttonsDown.current.has(0) && buttonsDown.current.has(2);
    buttonsDown.current.delete(e.button);
    if (wasChord) {
      // Fire chord on first button up while both were held.
      setChordPreview(null);
      onPressTile(null);
      onChord(idx);
      return;
    }
    if (e.button === 0 && !buttonsDown.current.has(2)) {
      onPressTile(null);
      onReveal(idx);
    }
  };

  const handlePointerEnter = (idx: number): void => {
    if (gameOver) return;
    if (buttonsDown.current.size === 0) return;
    lastIdx.current = idx;
    if (buttonsDown.current.has(0) && buttonsDown.current.has(2)) {
      setChordPreview(computeChordPreview(idx));
      onPressTile(idx);
    } else if (buttonsDown.current.has(0)) {
      onPressTile(idx);
    }
  };

  const handlePointerLeave = (): void => {
    if (buttonsDown.current.size === 0) return;
    onPressTile(null);
    setChordPreview(null);
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    const pressed =
      state.pressedTile === i ||
      (chordPreview ? chordPreview.has(i) : false);
    cells.push(
      <div
        key={i}
        className="ms-board-cell"
        onPointerDown={(e) => handlePointerDown(e, i)}
        onPointerUp={(e) => handlePointerUp(e, i)}
        onPointerEnter={() => handlePointerEnter(i)}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Cell cell={state.cells[i]} gameOver={gameOver} pressed={pressed} />
      </div>,
    );
  }

  return (
    <div
      className="ms-board"
      style={{
        gridTemplateColumns: `repeat(${state.width}, ${TILE_PX}px)`,
        gridTemplateRows: `repeat(${state.height}, ${TILE_PX}px)`,
      }}
    >
      {cells}
    </div>
  );
}
