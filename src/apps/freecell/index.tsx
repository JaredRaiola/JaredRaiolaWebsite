import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppProps } from '@/core/apps/registry';
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
import {
  reducer, dealGame, isValidRun, supermoveCapacity,
  CELLS, FOUNDATIONS, TABLEAUS,
  type GameState, type Card, type PileId, type Suit,
} from './engine';
import FreeCellSlot from './components/FreeCellSlot';
import Foundation from './components/Foundation';
import Tableau from './components/Tableau';
import CardFaceSvg from '@/apps/solitaire/cards/CardFaceSvg';
import './freecell.css';

function init(): GameState {
  const n = 1 + Math.floor(Math.random() * 32000);
  return dealGame(n);
}

export default function FreeCell({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragMetaRef = useRef<{ from: PileId; fromIdx: number; cards: Card[]; offset: { x: number; y: number } } | null>(null);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  useHotkeys(
    {
      'f2': () => {
        const n = 1 + Math.floor(Math.random() * 32000);
        dispatch({ type: 'newGame', gameNumber: n });
      },
      'ctrl+z': () => dispatch({ type: 'undo' }),
    },
    { enabled: focused },
  );

  // Timer.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase]);

  // Auto-cascade tick.
  useEffect(() => {
    if (state.phase !== 'cascading') return;
    const id = window.setInterval(() => dispatch({ type: 'cascadeStep' }), 100);
    return () => window.clearInterval(id);
  }, [state.phase]);

  // Drag listeners.
  useEffect(() => {
    if (!dragMetaRef.current) return;
    const onMove = (e: PointerEvent): void => setDragPos({ x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent): void => {
      const meta = dragMetaRef.current;
      if (meta) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const pileEl = target?.closest('[data-pile-id]') as HTMLElement | null;
        const dropPile = pileEl?.dataset.pileId as PileId | undefined;
        if (dropPile) dispatch({ type: 'tryMove', from: meta.from, fromIdx: meta.fromIdx, to: dropPile });
      }
      dragMetaRef.current = null;
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

  const startDrag = (from: PileId, fromIdx: number, e: React.PointerEvent): void => {
    if (state.phase !== 'playing') return;
    const src = state.piles[from];
    if (fromIdx < 0 || fromIdx >= src.length) return;
    let cards = src.slice(fromIdx);
    if (cards.length > 1) {
      if (!isValidRun(cards)) {
        // Fall back to dragging just the top card.
        cards = src.slice(src.length - 1);
        fromIdx = src.length - 1;
      } else {
        const cap = supermoveCapacity(state, false);
        if (cards.length > cap) {
          // Sequence too long for our current free space — drag top card only.
          cards = src.slice(src.length - 1);
          fromIdx = src.length - 1;
        }
      }
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragMetaRef.current = { from, fromIdx, cards, offset };
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const draggingIds = new Set((dragMetaRef.current?.cards ?? []).map((c) => c.id));
  const outlineDragging = false;

  const elapsedSec = Math.floor(state.elapsedMs / 1000);
  const fmtTime = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div
      className="fc-root"
      onClick={() => setOpenMenu(null)}
      onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'undo' }); }}
    >
      <div className="fc-menubar">
        <div className={`fc-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && (
            <div className="fc-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'newGame', gameNumber: 1 + Math.floor(Math.random() * 32000) }); setOpenMenu(null); }}>New Game&nbsp;&nbsp;F2</div>
              <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;Ctrl+Z</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
      </div>

      <div className="fc-felt">
        <div className="fc-top-row">
          <div className="fc-cells">
            {CELLS.map((cellId) => (
              <div key={cellId} data-pile-id={cellId}>
                <FreeCellSlot
                  card={state.piles[cellId][0] ?? null}
                  onPointerDown={(e) => startDrag(cellId, 0, e)}
                  onDoubleClick={() => dispatch({ type: 'autoMoveToFoundation', from: cellId })}
                  dragging={draggingIds.has(state.piles[cellId][0]?.id ?? '')}
                  outlineDragging={outlineDragging}
                />
              </div>
            ))}
          </div>
          <div className="fc-foundations">
            {FOUNDATIONS.map((fId) => {
              const suit = fId.replace('foundation-', '') as Suit;
              return (
                <div key={fId} data-pile-id={fId}>
                  <Foundation
                    suit={suit}
                    cards={state.piles[fId]}
                    onPointerDownTop={(e) => startDrag(fId, state.piles[fId].length - 1, e)}
                    onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: fId })}
                    dragging={draggingIds.has(state.piles[fId][state.piles[fId].length - 1]?.id ?? '')}
                    outlineDragging={outlineDragging}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="fc-tableau-row">
          {TABLEAUS.map((tId) => (
            <div key={tId} data-pile-id={tId}>
              <Tableau
                cards={state.piles[tId]}
                draggingIds={draggingIds}
                outlineDragging={outlineDragging}
                onPointerDownAt={(idx, e) => startDrag(tId, idx, e)}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: tId })}
              />
            </div>
          ))}
        </div>
      </div>

      {dragMetaRef.current && dragPos && createPortal(
        <div
          className="fc-drag-layer"
          style={{ left: dragPos.x - dragMetaRef.current.offset.x, top: dragPos.y - dragMetaRef.current.offset.y }}
        >
          {dragMetaRef.current.cards.map((c, i) => (
            <div key={c.id} className="fc-card" style={{ position: 'absolute', top: i * 22, left: 0 }}>
              <CardFaceSvg suit={c.suit} rank={c.rank} />
            </div>
          ))}
        </div>,
        document.body,
      )}

      <div className="fc-status">
        <span>Game {state.gameNumber}</span>
        <span>Moves: {state.moveCount}</span>
        <span>Time: {fmtTime(elapsedSec)}</span>
        {state.phase === 'cascading' && (
          <button onClick={() => dispatch({ type: 'cascadeSkip' })}>Skip</button>
        )}
      </div>
    </div>
  );
}
