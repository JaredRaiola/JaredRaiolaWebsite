import { useEffect, useReducer, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { reducer, deal, type GameState, type Suit, type PileId } from './engine';
import { makeRng } from './rng';
import { loadOptions, saveOptions } from './options';
import Stock from './components/Stock';
import Waste from './components/Waste';
import Foundation from './components/Foundation';
import Tableau from './components/Tableau';
import StatusBar from './components/StatusBar';
import './solitaire.css';

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

function init(): GameState {
  const opts = loadOptions();
  return deal(makeRng((Math.random() * 0x7fffffff) | 0), opts);
}

export default function Solitaire({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | 'help' | null>(null);
  const isDragSource = (_cardId: string): boolean => false;

  useEffect(() => { saveOptions(state.options); }, [state.options]);

  useEffect(() => {
    if (state.phase !== 'playing' || !state.options.timed) return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase, state.options.timed]);

  const elapsedSec = Math.floor(state.elapsedMs / 1000);

  return (
    <div className="sol-root" onClick={() => setOpenMenu(null)}>
      <div className="sol-menubar">
        <div className={`sol-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }); setOpenMenu(null); }}>Deal&nbsp;&nbsp;&nbsp;F2</div>
              <div className="sep" />
              <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;&nbsp;Ctrl+Z</div>
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
            <Stock cards={state.piles.stock} recyclesUsed={state.recyclesUsed} options={state.options} onClick={() => dispatch({ type: 'drawFromStock' })} />
            <Waste
              cards={state.piles.waste}
              draw={state.options.draw}
              outlineDragging={state.options.outlineDragging}
              isDragSource={isDragSource}
              onPointerDownTop={() => { /* drag wired in next task */ }}
              onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: 'waste' })}
            />
          </div>
          <div className="sol-top-right">
            {SUITS.map((s) => (
              <Foundation
                key={s}
                suit={s}
                cards={state.piles[`foundation-${s}` as PileId]}
                onPointerDownTop={() => { /* drag wired in next task */ }}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `foundation-${s}` as PileId })}
              />
            ))}
          </div>
        </div>
        <div className="sol-tableau-row">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Tableau
              key={i}
              cards={state.piles[`tableau-${i}` as PileId]}
              outlineDragging={state.options.outlineDragging}
              isDragSource={isDragSource}
              onPointerDownAt={() => { /* drag wired in next task */ }}
              onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `tableau-${i}` as PileId })}
            />
          ))}
        </div>
      </div>

      {state.options.statusBar && (
        <StatusBar score={state.score} elapsedSec={elapsedSec} showScore={state.options.scoring !== 'none'} />
      )}
    </div>
  );
}
