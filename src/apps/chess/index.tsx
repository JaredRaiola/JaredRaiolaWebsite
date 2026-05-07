import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppProps } from '@/core/apps/registry';
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
import {
  reducer, initialState, isValidChessSnapshot, rebuildPositionsSeen, isCheck, type GameState, type Square as Sq,
} from './engine';
import { playSound } from '@/stores/soundStore';
import { chooseAiMove } from './ai';
import Board from './components/Board';
import NewGameDialog from './components/NewGameDialog';
import PromotionDialog from './components/PromotionDialog';
import OutcomeDialog from './components/OutcomeDialog';
import StatisticsDialog from './components/StatisticsDialog';
import AboutDialog from './components/AboutDialog';
import ResignConfirm from './components/ResignConfirm';
import { recordOutcome } from './scores';
import './chess.css';

const PIECE_GLYPH: Record<string, string> = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖', 'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜', 'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};

function initFrom(restored: unknown): GameState {
  if (isValidChessSnapshot(restored)) {
    return {
      phase: restored.phase === 'thinking' ? (restored.position.toMove === restored.playerColor ? 'playing' : 'thinking') : restored.phase,
      position: restored.position,
      history: restored.history,
      positionsSeen: rebuildPositionsSeen(restored.history, restored.position),
      playerColor: restored.playerColor,
      difficulty: restored.difficulty,
      selectedSquare: null,
      legalDestinations: [],
      pendingPromotion: null,
      drawReason: restored.drawReason,
    };
  }
  return initialState('white', 'intermediate');
}

export default function Chess({ api, restoreState }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initFrom(restoreState));
  const [openMenu, setOpenMenu] = useState<'game' | 'help' | null>(null);
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [resignOpen, setResignOpen] = useState(false);
  const [outcomeAck, setOutcomeAck] = useState(false);
  const recordedRef = useRef(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ from: Sq; offset: { x: number; y: number } } | null>(null);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  useHotkeys(
    {
      'ctrl+z': () => dispatch({ type: 'undo' }),
      'f2': () => setNewGameOpen(true),
    },
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
          const isCapture = !!state.position.board[dropSq];
          playSound(isCapture ? 'pieceCapture' : 'pieceMove');
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

  // Record outcome once when game reaches terminal phase.
  useEffect(() => {
    const terminal = state.phase === 'checkmate' || state.phase === 'stalemate' || state.phase === 'draw' || state.phase === 'resigned';
    if (!terminal) {
      recordedRef.current = false;
      setOutcomeAck(false);
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    if (state.phase === 'checkmate') {
      const result: 'win' | 'loss' = state.position.toMove === state.playerColor ? 'loss' : 'win';
      recordOutcome(result);
      playSound('checkmate');
    } else if (state.phase === 'resigned') {
      recordOutcome('loss');
    } else {
      recordOutcome('draw');
    }
  }, [state.phase, state.playerColor, state.position.toMove]);

  // Check sound: fire 200ms after a move lands the opponent in check (non-checkmate).
  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'thinking') return;
    if (!isCheck(state.position, state.position.toMove)) return;
    const id = window.setTimeout(() => playSound('check'), 200);
    return () => window.clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.position]);

  // AI move on thinking phase.
  useEffect(() => {
    if (state.phase !== 'thinking') return;
    const id = window.setTimeout(() => {
      let move = chooseAiMove(state.position, state.difficulty);
      if (move.promotion === undefined) {
        const piece = state.position.board[move.from];
        if (piece && piece.type === 'pawn') {
          const r = move.to >> 3;
          if (r === 0 || r === 7) move = { ...move, promotion: 'queen' };
        }
      }
      playSound(move.capture ? 'pieceCapture' : 'pieceMove');
      dispatch({ type: 'aiMove', move });
    }, 200);
    return () => window.clearTimeout(id);
  }, [state.phase, state.position, state.difficulty]);

  // Snapshot for session persistence.
  useEffect(() => {
    return api.registerSnapshot(() => {
      const phase = state.phase === 'promoting' ? 'playing' : state.phase;
      return {
        position: state.position,
        history: state.history,
        playerColor: state.playerColor,
        difficulty: state.difficulty,
        phase,
        drawReason: state.drawReason,
      };
    });
  }, [state, api]);

  const handleSquareClick = (sq: Sq, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (state.phase !== 'playing') return;
    if (state.selectedSquare === null) {
      dispatch({ type: 'selectSquare', square: sq });
      return;
    }
    if (state.legalDestinations.includes(sq)) {
      const isCapture = !!state.position.board[sq];
      playSound(isCapture ? 'pieceCapture' : 'pieceMove');
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
              <div className="item" onClick={() => { setNewGameOpen(true); setOpenMenu(null); }}>New Game…&nbsp;&nbsp;F2</div>
              <div
                className={`item${state.history.length === 0 ? ' disabled' : ''}`}
                onClick={() => { if (state.history.length > 0) { dispatch({ type: 'undo' }); setOpenMenu(null); } }}
              >Undo&nbsp;&nbsp;Ctrl+Z</div>
              <div
                className={`item${state.phase !== 'playing' && state.phase !== 'thinking' ? ' disabled' : ''}`}
                onClick={() => { if (state.phase === 'playing' || state.phase === 'thinking') { setResignOpen(true); setOpenMenu(null); } }}
              >Resign</div>
              <div className="sep" />
              <div className="item" onClick={() => { setStatsOpen(true); setOpenMenu(null); }}>Statistics…</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
        <div
          className={`ch-menu${openMenu === 'help' ? ' open' : ''}`}
          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'help' ? null : 'help'); }}
        >
          Help
          {openMenu === 'help' && (
            <div className="ch-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { setAboutOpen(true); setOpenMenu(null); }}>About Chess…</div>
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
      {newGameOpen && (
        <NewGameDialog
          onCancel={() => setNewGameOpen(false)}
          onOk={(playerColor, difficulty) => {
            dispatch({ type: 'newGame', playerColor, difficulty });
            setNewGameOpen(false);
          }}
        />
      )}
      {state.phase === 'promoting' && (
        <PromotionDialog
          color={state.playerColor}
          onChoose={(p) => { playSound('pieceMove'); dispatch({ type: 'choosePromotion', promotion: p }); }}
          onCancel={() => dispatch({ type: 'cancelPromotion' })}
        />
      )}
      {statsOpen && <StatisticsDialog onClose={() => setStatsOpen(false)} />}
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      {resignOpen && (
        <ResignConfirm
          onYes={() => { dispatch({ type: 'resign' }); setResignOpen(false); }}
          onNo={() => setResignOpen(false)}
        />
      )}
      {!outcomeAck && (state.phase === 'checkmate' || state.phase === 'stalemate' || state.phase === 'draw' || state.phase === 'resigned') && (
        <OutcomeDialog
          state={state}
          onNewGame={() => { setNewGameOpen(true); setOutcomeAck(true); }}
          onClose={() => setOutcomeAck(true)}
        />
      )}
    </div>
  );
}
