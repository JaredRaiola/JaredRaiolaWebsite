import { useEffect, useReducer, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useWindowStore } from '@/stores/windowStore';
import { useHotkeys } from '@/lib/useHotkeys';
import { sysAlert, sysConfirm, sysPrompt } from '@/lib/dialog';
import {
  createInitialState,
  reveal,
  toggleMark,
  chord,
  newGame,
  setMarksEnabled,
  tick,
  type GameState,
} from './engine';
import {
  DIFFICULTIES,
  type DifficultyName,
  type DifficultyConfig,
  computeWindowSize,
  maxMinesFor,
} from './difficulties';
import { loadBestTimes, saveIfBest, resetBestTimes, type BuiltinDifficulty } from './scores';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { CustomDialog } from './components/CustomDialog';
import { BestTimesDialog } from './components/BestTimesDialog';
import WinDialog from './components/WinDialog';
import type { FaceSprite } from './sprites';
import './minesweeper.css';

type Action =
  | { type: 'reveal'; idx: number }
  | { type: 'toggleMark'; idx: number }
  | { type: 'chord'; idx: number }
  | { type: 'pressTile'; idx: number | null }
  | { type: 'newGame' }
  | { type: 'setDifficulty'; config: DifficultyConfig }
  | { type: 'setMarksEnabled'; enabled: boolean }
  | { type: 'tick'; now: number };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'reveal':       return reveal(state, action.idx);
    case 'toggleMark':   return toggleMark(state, action.idx);
    case 'chord':        return chord(state, action.idx);
    case 'pressTile':    return { ...state, pressedTile: action.idx };
    case 'newGame':      return newGame(state);
    case 'setDifficulty': {
      const fresh = createInitialState(action.config);
      return { ...fresh, marksEnabled: state.marksEnabled };
    }
    case 'setMarksEnabled': return setMarksEnabled(state, action.enabled);
    case 'tick':         return tick(state, action.now);
    default: return state;
  }
}

function detectBuiltinDifficulty(state: GameState): BuiltinDifficulty | null {
  const checks: BuiltinDifficulty[] = ['beginner', 'intermediate', 'expert'];
  for (const k of checks) {
    const d = DIFFICULTIES[k];
    if (state.width === d.width && state.height === d.height && state.mines === d.mines) return k;
  }
  return null;
}

function isValidMinesweeperState(v: unknown): v is GameState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    Array.isArray(s.cells) &&
    typeof s.width === 'number' &&
    typeof s.height === 'number' &&
    typeof s.mines === 'number' &&
    typeof s.elapsedMs === 'number'
  );
}

export default function Minesweeper({ api, restoreState }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    if (isValidMinesweeperState(restoreState)) {
      // If the restored game was mid-play, clamp startedAt so the timer
      // continues from the saved elapsedMs rather than ballooning by the
      // wall-clock time the tab was closed.
      if (restoreState.phase === 'playing' && restoreState.startedAt !== null) {
        return { ...restoreState, startedAt: Date.now() - restoreState.elapsedMs };
      }
      return restoreState;
    }
    return createInitialState(DIFFICULTIES.beginner);
  });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [bestTimesOpen, setBestTimesOpen] = useState(false);
  const [winAck, setWinAck] = useState(false);
  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  const wonHandledRef = useRef(false);

  // Register session snapshot.
  useEffect(() => {
    return api.registerSnapshot(() => state);
  }, [state, api]);

  const elapsedSeconds = Math.min(999, Math.floor(state.elapsedMs / 1000));
  const minesRemaining = state.mines - state.flagsPlaced;

  // Resize window when difficulty changes.
  useEffect(() => {
    const { windowWidth, windowHeight } = computeWindowSize(state.width, state.height);
    api.setSize(windowWidth, windowHeight);
  }, [state.width, state.height, api]);

  // Timer.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 250);
    return () => window.clearInterval(id);
  }, [state.phase]);

  // Win handler.
  useEffect(() => {
    if (state.phase !== 'won') {
      wonHandledRef.current = false;
      setWinAck(false);
      return;
    }
    if (wonHandledRef.current) return;
    wonHandledRef.current = true;
    const diff = detectBuiltinDifficulty(state);
    if (!diff) return;
    const seconds = Math.floor(state.elapsedMs / 1000);
    const current = loadBestTimes()[diff];
    if (current && seconds >= current.seconds) return;
    void sysPrompt(
      `You have the fastest time for ${diff} level. Please enter your name.`,
      'Anonymous',
      { title: 'Fastest Mine Sweepers' },
    ).then((name) => {
      if (name === null) return;
      saveIfBest(diff, seconds, name || 'Anonymous');
    });
  }, [state.phase, state.elapsedMs, state]);

  useHotkeys({ 'f2': () => dispatch({ type: 'newGame' }) }, { enabled: focused });

  // Face state.
  let faceState: FaceSprite = 'smile';
  if (state.phase === 'won') faceState = 'cool';
  else if (state.phase === 'lost') faceState = 'dead';
  else if (state.pressedTile !== null) faceState = 'oh';
  // Smiley pressed visual handled separately.

  const setDifficulty = (name: DifficultyName, config?: DifficultyConfig): void => {
    if (name === 'custom' && !config) {
      setCustomOpen(true);
      return;
    }
    const cfg = config ?? DIFFICULTIES[name as Exclude<DifficultyName, 'custom'>];
    dispatch({ type: 'setDifficulty', config: cfg });
    setOpenMenu(null);
  };

  const currentDifficulty: DifficultyName = detectBuiltinDifficulty(state) ?? 'custom';

  const check = (active: boolean): React.ReactNode => (
    <span className="ms-check">{active ? '✓' : ''}</span>
  );

  const menuItems = (which: 'game' | 'help'): React.ReactNode => {
    if (which === 'game') {
      return (
        <div className="ms-menu-popup" onClick={(e) => e.stopPropagation()}>
          <div className="item" onClick={() => { dispatch({ type: 'newGame' }); setOpenMenu(null); }}>{check(false)}New&nbsp;&nbsp;&nbsp;F2</div>
          <div className="sep" />
          <div className="item" onClick={() => setDifficulty('beginner')}>{check(currentDifficulty === 'beginner')}Beginner</div>
          <div className="item" onClick={() => setDifficulty('intermediate')}>{check(currentDifficulty === 'intermediate')}Intermediate</div>
          <div className="item" onClick={() => setDifficulty('expert')}>{check(currentDifficulty === 'expert')}Expert</div>
          <div className="item" onClick={() => setDifficulty('custom')}>{check(currentDifficulty === 'custom')}Custom...</div>
          <div className="sep" />
          <div className="item" onClick={() => { dispatch({ type: 'setMarksEnabled', enabled: !state.marksEnabled }); setOpenMenu(null); }}>{check(state.marksEnabled)}Marks (?)</div>
          <div className="sep" />
          <div className="item" onClick={() => { setBestTimesOpen(true); setOpenMenu(null); }}>{check(false)}Best Times...</div>
          <div className="sep" />
          <div className="item" onClick={() => api.requestClose()}>{check(false)}Exit</div>
        </div>
      );
    }
    return (
      <div className="ms-menu-popup" onClick={(e) => e.stopPropagation()}>
        <div className="item disabled">{check(false)}About Minesweeper</div>
      </div>
    );
  };

  return (
    <div className="ms-root" onClick={() => setOpenMenu(null)}>
      <div className="ms-menubar">
        <div className={`ms-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && menuItems('game')}
        </div>
        <div className={`ms-menu${openMenu === 'help' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'help' ? null : 'help'); }}>
          Help
          {openMenu === 'help' && menuItems('help')}
        </div>
      </div>
      <div className="ms-content">
        <div className="ms-inner">
          <Header
            minesRemaining={minesRemaining}
            elapsedSeconds={elapsedSeconds}
            faceState={faceState}
            onFaceClick={() => dispatch({ type: 'newGame' })}
          />
          <Board
            state={state}
            onReveal={(idx) => dispatch({ type: 'reveal', idx })}
            onToggleMark={(idx) => dispatch({ type: 'toggleMark', idx })}
            onChord={(idx) => dispatch({ type: 'chord', idx })}
            onPressTile={(idx) => dispatch({ type: 'pressTile', idx })}
          />
        </div>
      </div>

      {customOpen && (
        <CustomDialog
          initialWidth={state.width}
          initialHeight={state.height}
          initialMines={state.mines}
          onCancel={() => setCustomOpen(false)}
          onSubmit={(w, h, m) => {
            const mines = Math.min(m, maxMinesFor(w, h));
            dispatch({ type: 'setDifficulty', config: { width: w, height: h, mines } });
            setCustomOpen(false);
          }}
        />
      )}

      {bestTimesOpen && (
        <BestTimesDialog
          times={loadBestTimes()}
          onReset={() => {
            void sysConfirm('Reset all best times?', { title: 'Reset Scores', icon: 'warn' }).then((ok) => {
              if (ok) {
                resetBestTimes();
                setBestTimesOpen(false);
                void sysAlert('Best times reset.', { title: 'Minesweeper' });
              }
            });
          }}
          onClose={() => setBestTimesOpen(false)}
        />
      )}

      {state.phase === 'won' && !winAck && (
        <WinDialog
          elapsedSec={elapsedSeconds}
          difficulty={detectBuiltinDifficulty(state) ?? 'custom'}
          onNewGame={() => { setWinAck(true); dispatch({ type: 'newGame' }); }}
          onClose={() => setWinAck(true)}
        />
      )}
    </div>
  );
}
