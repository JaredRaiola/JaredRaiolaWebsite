import { useReducer, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
import {
  reducer, initialState, type GameState, type Square as Sq,
} from './engine';
import Board from './components/Board';
import './chess.css';

function init(): GameState {
  return initialState('white', 'intermediate');
}

export default function Chess({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | null>(null);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  useHotkeys(
    {
      'ctrl+z': () => dispatch({ type: 'undo' }),
    },
    { enabled: focused },
  );

  const handleSquareClick = (sq: Sq, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (state.phase !== 'playing') return;
    if (state.selectedSquare === null) {
      dispatch({ type: 'selectSquare', square: sq });
      return;
    }
    if (state.legalDestinations.includes(sq)) {
      dispatch({ type: 'playerMove', move: { from: state.selectedSquare, to: sq } });
      return;
    }
    // Re-select if clicking your own piece, or deselect.
    dispatch({ type: 'selectSquare', square: sq });
  };

  const handleSquarePointerDown = (_sq: Sq, _e: React.PointerEvent): void => {
    // Drag wired in Task 15.
  };

  const turnText = state.phase === 'thinking' ? 'Computer thinking…' :
    state.position.toMove === 'white' ? "White's turn" : "Black's turn";

  return (
    <div className="ch-root" onClick={() => setOpenMenu(null)}>
      <div className="ch-menubar">
        <div
          className={`ch-menu${openMenu === 'game' ? ' open' : ''}`}
          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}
        >
          Game
          {openMenu === 'game' && (
            <div className="ch-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'newGame', playerColor: 'white', difficulty: 'intermediate' }); setOpenMenu(null); }}>New Game</div>
              <div
                className={`item${state.history.length === 0 ? ' disabled' : ''}`}
                onClick={() => { if (state.history.length > 0) { dispatch({ type: 'undo' }); setOpenMenu(null); } }}
              >Undo&nbsp;&nbsp;Ctrl+Z</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
      </div>

      <div className="ch-felt">
        <Board
          state={state}
          onSquarePointerDown={handleSquarePointerDown}
          onSquareClick={handleSquareClick}
        />
      </div>

      <div className="ch-status">
        <span>{turnText}</span>
        <span>Move {state.position.fullmoveNumber}</span>
      </div>
    </div>
  );
}
