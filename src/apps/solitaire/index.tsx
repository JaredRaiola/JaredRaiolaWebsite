import { useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppProps } from '@/core/apps/registry';
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
import { reducer, deal, isValidRun, isValidSolitaireSnapshot, type GameState, type Suit, type PileId, type Card, type Options } from './engine';
import { makeRng } from './rng';
import { loadOptions, saveOptions, loadVegasBalance, saveVegasBalance } from './options';
import { sysPrompt } from '@/lib/dialog';
import { saveIfBest, loadBestTime } from './bestTimes';
import Stock from './components/Stock';
import Waste from './components/Waste';
import Foundation from './components/Foundation';
import Tableau from './components/Tableau';
import StatusBar from './components/StatusBar';
import OptionsDialog from './components/OptionsDialog';
import StatisticsDialog from './components/StatisticsDialog';
import WinCascade from './components/WinCascade';
import CardFaceSvg from './cards/CardFaceSvg';
import './solitaire.css';

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

function initFrom(restored: unknown, fallbackOptions: Options): GameState {
  if (isValidSolitaireSnapshot(restored)) {
    const opts = restored.options;
    const startedAt = restored.phase === 'playing' && opts.timed ? Date.now() - restored.elapsedMs : null;
    return {
      phase: restored.phase,
      piles: restored.piles,
      options: opts,
      score: restored.score,
      vegasBalance: restored.vegasBalance,
      startedAt,
      elapsedMs: restored.elapsedMs,
      recyclesUsed: restored.recyclesUsed,
      wasteFanSize: restored.wasteFanSize ?? 0,
      prev: null,
      drag: null,
    };
  }
  return deal(makeRng((Math.random() * 0x7fffffff) | 0), fallbackOptions);
}

export default function Solitaire({ api, restoreState }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initFrom(restoreState, loadOptions()));
  const [openMenu, setOpenMenu] = useState<'game' | 'help' | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragMetaRef = useRef<{ from: PileId; fromIdx: number } | null>(null);
  const wonHandledRef = useRef(false);

  useEffect(() => { saveOptions(state.options); }, [state.options]);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);

  useHotkeys(
    {
      'f2': () => dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }),
      'ctrl+z': () => dispatch({ type: 'undo' }),
    },
    { enabled: focused },
  );

  useEffect(() => {
    if (state.phase !== 'playing' || !state.options.timed) return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase, state.options.timed]);

  useEffect(() => {
    return api.registerSnapshot(() => ({
      piles: state.piles,
      options: state.options,
      score: state.score,
      vegasBalance: state.vegasBalance,
      startedAt: null,
      elapsedMs: state.elapsedMs,
      recyclesUsed: state.recyclesUsed,
      wasteFanSize: state.wasteFanSize,
      phase: state.phase === 'won' || state.phase === 'cascading' ? 'idle' : state.phase,
    }));
  }, [state, api]);

  useEffect(() => {
    if (state.phase !== 'won') return;
    const id = window.setTimeout(() => dispatch({ type: 'setPhase', phase: 'cascading' }), 500);
    return () => window.clearTimeout(id);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== 'won') {
      wonHandledRef.current = false;
      return;
    }
    if (wonHandledRef.current) return;
    wonHandledRef.current = true;

    if (state.options.scoring === 'vegas' && state.options.vegasKeepScore) {
      saveVegasBalance(loadVegasBalance() + state.score);
    }

    if (state.options.scoring !== 'standard' || !state.options.timed) return;
    const seconds = Math.floor(state.elapsedMs / 1000);
    if (seconds < 30) return;
    const best = loadBestTime();
    if (best && seconds >= best.seconds) return;
    void sysPrompt('You have a new best time. Please enter your name.', 'Anonymous', { title: 'Solitaire Best Time' })
      .then((name) => {
        if (name === null) return;
        saveIfBest(seconds, name || 'Anonymous');
      });
  }, [state.phase, state.elapsedMs, state.options, state.score]);

  const isDragSource = (cardId: string): boolean => {
    if (!state.drag) return false;
    return state.drag.cards.some((c) => c.id === cardId);
  };

  const startDrag = (from: PileId, fromIdx: number, e: React.PointerEvent): void => {
    if (state.phase !== 'playing') return;
    const src = state.piles[from];
    const cards: Card[] = src.slice(fromIdx);
    if (cards.length === 0 || !cards[0].faceUp) return;
    if (!isValidRun(cards)) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragMetaRef.current = { from, fromIdx };
    dispatch({ type: 'pickUpDrag', from, cards, pointerOffset: offset });
    setDragPos({ x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent): void => {
    if (!state.drag) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent): void => {
    if (!state.drag || !dragMetaRef.current) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const pileEl = target?.closest('[data-pile-id]') as HTMLElement | null;
    const dropPile = pileEl?.dataset.pileId as PileId | undefined;
    const meta = dragMetaRef.current;
    if (dropPile) {
      dispatch({ type: 'tryMove', from: meta.from, fromIdx: meta.fromIdx, to: dropPile });
    }
    dispatch({ type: 'cancelDrag' });
    dragMetaRef.current = null;
    setDragPos(null);
  };

  const elapsedSec = Math.floor(state.elapsedMs / 1000);

  return (
    <div
      className="sol-root"
      onClick={() => setOpenMenu(null)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'autoFinish' }); }}
    >
      <div className="sol-menubar">
        <div className={`sol-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }); setOpenMenu(null); }}>Deal&nbsp;&nbsp;&nbsp;F2</div>
              <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;&nbsp;Ctrl+Z</div>
              <div className="sep" />
              <div className="item" onClick={() => { setOptionsOpen(true); setOpenMenu(null); }}>Options...</div>
              <div className="item" onClick={() => { setStatsOpen(true); setOpenMenu(null); }}>Statistics...</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
        <div className={`sol-menu${openMenu === 'help' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'help' ? null : 'help'); }}>
          Help
          {openMenu === 'help' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item disabled">About Solitaire</div>
            </div>
          )}
        </div>
      </div>

      <div className="sol-felt">
        <div className="sol-top-row">
          <div className="sol-top-left">
            <div data-pile-id="stock">
              <Stock cards={state.piles.stock} recyclesUsed={state.recyclesUsed} options={state.options} onClick={() => dispatch({ type: 'drawFromStock' })} />
            </div>
            <div data-pile-id="waste">
              <Waste
                cards={state.piles.waste}
                fanSize={state.wasteFanSize}
                outlineDragging={state.options.outlineDragging}
                isDragSource={isDragSource}
                onPointerDownTop={(e) => startDrag('waste', state.piles.waste.length - 1, e)}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: 'waste' })}
              />
            </div>
          </div>
          <div className="sol-top-right">
            {SUITS.map((s) => (
              <div key={s} data-pile-id={`foundation-${s}`}>
                <Foundation
                  suit={s}
                  cards={state.piles[`foundation-${s}` as PileId]}
                  outlineDragging={state.options.outlineDragging}
                  isDragSource={isDragSource}
                  onPointerDownTop={(e) => startDrag(`foundation-${s}` as PileId, state.piles[`foundation-${s}` as PileId].length - 1, e)}
                  onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `foundation-${s}` as PileId })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="sol-tableau-row">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} data-pile-id={`tableau-${i}`}>
              <Tableau
                cards={state.piles[`tableau-${i}` as PileId]}
                outlineDragging={state.options.outlineDragging}
                isDragSource={isDragSource}
                onPointerDownAt={(idx, e) => startDrag(`tableau-${i}` as PileId, idx, e)}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `tableau-${i}` as PileId })}
              />
            </div>
          ))}
        </div>
        {state.phase === 'cascading' && (
          <WinCascade onSkip={() => dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) })} />
        )}
      </div>

      {state.drag && dragPos && createPortal(
        <div
          className="sol-drag-layer"
          style={{ left: dragPos.x - state.drag.pointerOffset.x, top: dragPos.y - state.drag.pointerOffset.y }}
        >
          {state.drag.cards.map((c, i) => (
            <div key={c.id} className="sol-card" style={{ position: 'absolute', top: i * 22, left: 0 }}>
              <CardFaceSvg suit={c.suit} rank={c.rank} />
            </div>
          ))}
        </div>,
        document.body,
      )}

      {state.options.statusBar && (
        <StatusBar score={state.score} elapsedSec={elapsedSec} showScore={state.options.scoring !== 'none'} />
      )}
      {optionsOpen && (
        <OptionsDialog
          initial={state.options}
          onCancel={() => setOptionsOpen(false)}
          onOk={(next) => { dispatch({ type: 'setOptions', options: next }); setOptionsOpen(false); }}
        />
      )}
      {statsOpen && <StatisticsDialog onClose={() => setStatsOpen(false)} />}
    </div>
  );
}
