import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppProps } from '@/core/apps/registry';
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
import {
  reducer, initialState, type GameState, type Square as Sq,
} from './engine';
import Board from './components/Board';
import './chess.css';

const PIECE_GLYPH: Record<string, string> = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖', 'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜', 'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};

function init(): GameState {
  return initialState('white', 'intermediate');
}

export default function Chess({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ from: Sq; offset: { x: number; y: number } } | null>(null);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  useHotkeys(
    { 'ctrl+z': () => dispatch({ type: 'undo' }) },
    { enabled: focused },
  );

  // Drag listeners.
  useEffect(() => {
    if (dragRef.current === null) return;
    const onMove = (e: PointerEvent): void => setDragPos({ x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent): void => {
      const meta = dragRef.current;
      if (meta) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const sqEl = target?.closest('[data-sq]') as HTMLElement | null;
        const dropSq = sqEl ? Number(sqEl.dataset.sq) : -1;
        if (dropSq >= 0 && dropSq <= 63) {
          dispatch({ type: 'playerMove', move: { from: meta.from, to: dropSq } });
        }
      }
      dragRef.current = null;
      setDragPos(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragPos !== null]);

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
    dispatch({ type: 'selectSquare', square: sq });
  };

  const handleSquarePointerDown = (sq: Sq, e: React.PointerEvent): void => {
    if (state.phase !== 'playing') return;
    const piece = state.position.board[sq];
    if (!piece || piece.color !== state.playerColor) return;
    // Pre-select for click-to-move continuity, then arm drag.
    dispatch({ type: 'selectSquare', square: sq });
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = { from: sq, offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } };
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const turnText = state.phase === 'thinking' ? 'Computer thinking…' :
    state.position.toMove === 'white' ? "White's turn" : "Black's turn";

  const dragPiece = dragRef.current ? state.position.board[dragRef.current.from] : null;

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

      {dragRef.current && dragPos && dragPiece && createPortal(
        <div
          className="ch-drag-layer"
          style={{ left: dragPos.x - dragRef.current.offset.x, top: dragPos.y - dragRef.current.offset.y }}
        >
          <div className={`ch-piece ch-piece-${dragPiece.color}`}>
            {PIECE_GLYPH[`${dragPiece.color}-${dragPiece.type}`]}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
