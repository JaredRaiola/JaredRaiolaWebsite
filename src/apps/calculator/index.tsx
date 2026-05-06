import { useEffect, useReducer, useRef } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { calcReducer, initialCalcState, type Action, type CalcState } from './engine';
import { Keypad } from './keypad';
import './calculator.css';

function isValidCalcState(v: unknown): v is CalcState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return typeof s.display === 'string' && typeof s.memory === 'number';
}

const KEY_MAP: Record<string, Action | null> = {
  '0': { kind: 'digit', value: '0' },
  '1': { kind: 'digit', value: '1' },
  '2': { kind: 'digit', value: '2' },
  '3': { kind: 'digit', value: '3' },
  '4': { kind: 'digit', value: '4' },
  '5': { kind: 'digit', value: '5' },
  '6': { kind: 'digit', value: '6' },
  '7': { kind: 'digit', value: '7' },
  '8': { kind: 'digit', value: '8' },
  '9': { kind: 'digit', value: '9' },
  '.': { kind: 'decimal' },
  '+': { kind: 'op', value: '+' },
  '-': { kind: 'op', value: '-' },
  '*': { kind: 'op', value: '*' },
  '/': { kind: 'op', value: '/' },
  Enter: { kind: 'equals' },
  '=': { kind: 'equals' },
  Escape: { kind: 'clearAll' },
  Backspace: { kind: 'backspace' },
  '%': { kind: 'unary', value: 'percent' },
};

export default function Calculator({ api, restoreState }: AppProps) {
  const initial = isValidCalcState(restoreState) ? restoreState : initialCalcState;
  const [state, dispatch] = useReducer(calcReducer, initial);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      e.preventDefault();
      dispatch(action);
    };
    const node = ref.current;
    node?.addEventListener('keydown', onKey);
    node?.focus();
    return () => node?.removeEventListener('keydown', onKey);
  }, []);

  // Register session snapshot.
  useEffect(() => {
    return api.registerSnapshot(() => state);
  }, [state, api]);

  return (
    <div ref={ref} tabIndex={-1} className="calc-root">
      <div className="calc-display">{state.display}</div>
      <Keypad memory={state.memory} dispatch={dispatch} />
    </div>
  );
}
