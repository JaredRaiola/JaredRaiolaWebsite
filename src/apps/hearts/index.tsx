import { useEffect, useReducer, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
import {
  reducer, deal,
  legalCardsForLead, legalCardsForFollow,
  type GameState, type Card, type PlayerId,
} from './engine';
import { makeRng } from './rng';
import { loadOptions, saveOptions } from './options';
import { chooseAiPass, chooseAiPlay } from './ai';
import Hand from './components/Hand';
import AiHand from './components/AiHand';
import TrickArea from './components/TrickArea';
import PassPrompt from './components/PassPrompt';
import PlayPrompt from './components/PlayPrompt';
import ScoreSheet from './components/ScoreSheet';
import OptionsDialog from './components/OptionsDialog';
import GameOverDialog from './components/GameOverDialog';
import { recordResult } from './scores';
import './hearts.css';

function init(): GameState {
  return deal(makeRng((Math.random() * 0x7fffffff) | 0), loadOptions());
}

export default function Hearts({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const scoresAtHandStartRef = useRef<Record<PlayerId, number>>(state.scores);
  useEffect(() => {
    if ((state.phase === 'passing' || state.phase === 'playing') && state.history.length === 0) {
      scoresAtHandStartRef.current = state.scores;
    }
  }, [state.phase, state.history.length, state.scores]);

  useEffect(() => { saveOptions(state.options); }, [state.options]);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase !== 'game-over') {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    const humanScore = state.scores[0];
    const lowest = Math.min(state.scores[0], state.scores[1], state.scores[2], state.scores[3]);
    recordResult({ humanWon: humanScore === lowest, humanScore });
  }, [state.phase, state.scores]);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  useHotkeys(
    {
      'f2': () => dispatch({ type: 'newGame', rng: makeRng((Math.random() * 0x7fffffff) | 0) }),
      'ctrl+z': () => dispatch({ type: 'undo' }),
    },
    { enabled: focused && !optionsOpen && state.phase !== 'game-over' },
  );

  // AI play effect.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    if (state.turn === null || state.turn === 0) return;
    const player = state.turn;
    const id = window.setTimeout(() => {
      const card = chooseAiPlay(
        state.hands[player],
        state.trick!,
        state.history,
        state.heartsBroken,
        state.history.length === 0,
        state.options.difficulty,
      );
      dispatch({ type: 'aiPlay', player, card });
    }, 600);
    return () => window.clearTimeout(id);
  }, [state.turn, state.phase, state.hands, state.trick, state.history, state.heartsBroken, state.options.difficulty]);

  // End-of-trick auto-resolve effect.
  useEffect(() => {
    if (state.phase !== 'trick-resolved') return;
    const id = window.setTimeout(() => dispatch({ type: 'resolveTrick' }), 1000);
    return () => window.clearTimeout(id);
  }, [state.phase]);

  const legalIds: Set<string> | null = (() => {
    if (state.phase !== 'playing' || state.turn !== 0 || !state.trick) return null;
    const isFirstTrick = state.history.length === 0;
    const legal = state.trick.plays.length === 0
      ? legalCardsForLead(state.hands[0], state.heartsBroken, isFirstTrick)
      : legalCardsForFollow(state.hands[0], state.trick, state.heartsBroken, isFirstTrick);
    return new Set(legal.map((c) => c.id));
  })();

  const selectedSet = new Set((state.passSelections ?? []).map((c) => c.id));

  const onCardClick = (card: Card): void => {
    if (state.phase === 'passing') {
      if (selectedSet.has(card.id)) dispatch({ type: 'deselectPassCard', card });
      else dispatch({ type: 'selectPassCard', card });
    } else if (state.phase === 'playing' && state.turn === 0) {
      if (legalIds && legalIds.has(card.id)) {
        dispatch({ type: 'playCard', player: 0, card });
      }
    }
  };

  const onPass = (): void => {
    if (state.passDirection === 'keep') {
      dispatch({ type: 'submitPass', humanSelection: [], aiPasses: { 0: [], 1: [], 2: [], 3: [] } });
      return;
    }
    if ((state.passSelections ?? []).length !== 3) return;
    const aiPasses: Record<PlayerId, Card[]> = {
      0: state.passSelections!,
      1: chooseAiPass(state.hands[1], state.passDirection, state.options.difficulty),
      2: chooseAiPass(state.hands[2], state.passDirection, state.options.difficulty),
      3: chooseAiPass(state.hands[3], state.passDirection, state.options.difficulty),
    };
    dispatch({ type: 'submitPass', humanSelection: state.passSelections!, aiPasses });
  };

  return (
    <div className="hearts-root" onClick={() => setOpenMenu(null)}>
      <div className="hearts-menubar">
        <div className={`hearts-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && (
            <div className="hearts-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'newGame', rng: makeRng((Math.random() * 0x7fffffff) | 0) }); setOpenMenu(null); }}>New Game&nbsp;&nbsp;F2</div>
              <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;Ctrl+Z</div>
              <div className="sep" />
              <div className="item" onClick={() => { setOptionsOpen(true); setOpenMenu(null); }}>Options...</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
      </div>
      <div className="hearts-felt">
        <div className="hearts-top"><AiHand count={state.hands[2].length} orientation="horizontal" name="Meatball" /></div>
        <div className="hearts-mid">
          <div className="hearts-left"><AiHand count={state.hands[1].length} orientation="vertical" name="Jared" /></div>
          <TrickArea trick={state.trick} resolving={state.phase === 'trick-resolved'} />
          <div className="hearts-right"><AiHand count={state.hands[3].length} orientation="vertical" name="John" /></div>
        </div>
        <div className="hearts-bottom">
          <Hand
            cards={state.hands[0]}
            selected={selectedSet}
            legalIds={legalIds}
            onCardClick={onCardClick}
          />
        </div>
      </div>
      {state.phase === 'passing' ? (
        <PassPrompt direction={state.passDirection} selectedCount={selectedSet.size} onPass={onPass} />
      ) : (
        <PlayPrompt turn={state.turn} heartsBroken={state.heartsBroken} />
      )}
      {state.phase === 'hand-over' && (
        <ScoreSheet
          scoresBefore={scoresAtHandStartRef.current}
          taken={state.taken}
          onContinue={() => dispatch({ type: 'nextHand', rng: makeRng((Math.random() * 0x7fffffff) | 0) })}
        />
      )}
      {state.phase === 'game-over' && (
        <GameOverDialog
          scores={state.scores}
          onNewGame={() => dispatch({ type: 'newGame', rng: makeRng((Math.random() * 0x7fffffff) | 0) })}
          onClose={() => api.requestClose()}
        />
      )}
      {optionsOpen && (
        <OptionsDialog
          initial={state.options}
          onCancel={() => setOptionsOpen(false)}
          onOk={(next) => { dispatch({ type: 'setOptions', options: next }); setOptionsOpen(false); }}
        />
      )}
    </div>
  );
}
