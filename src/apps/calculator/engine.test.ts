import { describe, it, expect } from 'vitest';
import { formatNumber, calcReducer, initialCalcState } from './engine';
import type { Action, CalcState } from './engine';

describe('formatNumber', () => {
  it('renders integers without decimal point', () => {
    expect(formatNumber(3)).toBe('3');
    expect(formatNumber(-12)).toBe('-12');
  });
  it('trims trailing zeros from decimals', () => {
    expect(formatNumber(0.5)).toBe('0.5');
    expect(formatNumber(1.2300000000000001)).toBe('1.23');
  });
  it('uses scientific notation for very large or small magnitudes', () => {
    expect(formatNumber(1e20)).toMatch(/e\+?20$/i);
    expect(formatNumber(1e-15)).toMatch(/e-15$/i);
  });
  it('renders 0 as "0"', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-0)).toBe('0');
  });
});

describe('calcReducer — entry', () => {
  it('digits replace leading 0', () => {
    let s = initialCalcState;
    s = calcReducer(s, { kind: 'digit', value: '7' });
    expect(s.display).toBe('7');
    s = calcReducer(s, { kind: 'digit', value: '3' });
    expect(s.display).toBe('73');
  });
  it('decimal adds a single dot', () => {
    let s = calcReducer(initialCalcState, { kind: 'digit', value: '1' });
    s = calcReducer(s, { kind: 'decimal' });
    expect(s.display).toBe('1.');
    s = calcReducer(s, { kind: 'digit', value: '5' });
    expect(s.display).toBe('1.5');
    s = calcReducer(s, { kind: 'decimal' });
    expect(s.display).toBe('1.5'); // second decimal is a no-op
  });
  it('decimal on a fresh display gives "0."', () => {
    expect(calcReducer(initialCalcState, { kind: 'decimal' }).display).toBe('0.');
  });
  it('backspace removes one digit', () => {
    let s = calcReducer(initialCalcState, { kind: 'digit', value: '1' });
    s = calcReducer(s, { kind: 'digit', value: '2' });
    s = calcReducer(s, { kind: 'backspace' });
    expect(s.display).toBe('1');
    s = calcReducer(s, { kind: 'backspace' });
    expect(s.display).toBe('0');
  });
  it('clearEntry resets display only; clearAll resets everything', () => {
    let s = { ...initialCalcState, display: '5', accumulator: 3, pendingOp: '+' as const };
    s = calcReducer(s, { kind: 'clearEntry' });
    expect(s.display).toBe('0');
    expect(s.accumulator).toBe(3);
    s = calcReducer(s, { kind: 'clearAll' });
    expect(s).toEqual(initialCalcState);
  });
});

describe('calcReducer — math', () => {
  const seq = (s0: CalcState, ...actions: Action[]) =>
    actions.reduce((s, a) => calcReducer(s, a), s0);

  it('1 + 2 = 3', () => {
    const s = seq(
      initialCalcState,
      { kind: 'digit', value: '1' },
      { kind: 'op', value: '+' },
      { kind: 'digit', value: '2' },
      { kind: 'equals' },
    );
    expect(s.display).toBe('3');
  });

  it('chained ops commit left-to-right: 5 - 3 - 1 = 1', () => {
    const s = seq(
      initialCalcState,
      { kind: 'digit', value: '5' },
      { kind: 'op', value: '-' },
      { kind: 'digit', value: '3' },
      { kind: 'op', value: '-' },
      { kind: 'digit', value: '1' },
      { kind: 'equals' },
    );
    expect(s.display).toBe('1');
  });

  it('division by zero sets error', () => {
    const s = seq(
      initialCalcState,
      { kind: 'digit', value: '8' },
      { kind: 'op', value: '/' },
      { kind: 'digit', value: '0' },
      { kind: 'equals' },
    );
    expect(s.error).toBe(true);
    expect(s.display).toBe('Error');
  });

  it('digit press while in error is a no-op until cleared', () => {
    let s = { ...initialCalcState, error: true, display: 'Error' };
    s = calcReducer(s, { kind: 'digit', value: '5' });
    expect(s.error).toBe(true);
    s = calcReducer(s, { kind: 'clearAll' });
    expect(s.error).toBe(false);
    expect(s.display).toBe('0');
  });
});

describe('calcReducer — unary', () => {
  it('sign flips display only', () => {
    const s = calcReducer(
      calcReducer(initialCalcState, { kind: 'digit', value: '5' }),
      { kind: 'unary', value: 'sign' },
    );
    expect(s.display).toBe('-5');
  });
  it('sqrt 16 = 4; sqrt -1 = error', () => {
    let s = calcReducer(initialCalcState, { kind: 'digit', value: '1' });
    s = calcReducer(s, { kind: 'digit', value: '6' });
    s = calcReducer(s, { kind: 'unary', value: 'sqrt' });
    expect(s.display).toBe('4');
    s = calcReducer(initialCalcState, { kind: 'digit', value: '1' });
    s = calcReducer(s, { kind: 'unary', value: 'sign' });
    s = calcReducer(s, { kind: 'unary', value: 'sqrt' });
    expect(s.error).toBe(true);
  });
  it('inverse: 1/4 = 0.25; 1/0 = error', () => {
    let s = calcReducer(initialCalcState, { kind: 'digit', value: '4' });
    s = calcReducer(s, { kind: 'unary', value: 'inverse' });
    expect(s.display).toBe('0.25');
    s = calcReducer(initialCalcState, { kind: 'unary', value: 'inverse' });
    expect(s.error).toBe(true);
  });
  it('percent: 200 + 10 % = 220', () => {
    const s = [
      { kind: 'digit', value: '2' } as const,
      { kind: 'digit', value: '0' } as const,
      { kind: 'digit', value: '0' } as const,
      { kind: 'op', value: '+' } as const,
      { kind: 'digit', value: '1' } as const,
      { kind: 'digit', value: '0' } as const,
      { kind: 'unary', value: 'percent' } as const,
      { kind: 'equals' } as const,
    ].reduce(calcReducer, initialCalcState);
    expect(s.display).toBe('220');
  });
});

describe('calcReducer — memory', () => {
  it('MS stores; MR recalls; MC clears', () => {
    let s = calcReducer(initialCalcState, { kind: 'digit', value: '5' });
    s = calcReducer(s, { kind: 'memory', value: 'ms' });
    expect(s.memory).toBe(5);
    s = calcReducer(s, { kind: 'clearAll' });
    s = calcReducer(s, { kind: 'memory', value: 'mr' });
    expect(s.display).toBe('5');
    s = calcReducer(s, { kind: 'memory', value: 'mc' });
    expect(s.memory).toBe(0);
  });
  it('M+ adds to memory; M- subtracts', () => {
    let s: CalcState = { ...initialCalcState, memory: 10 };
    s = calcReducer(s, { kind: 'digit', value: '3' });
    s = calcReducer(s, { kind: 'memory', value: 'm+' });
    expect(s.memory).toBe(13);
    s = calcReducer(s, { kind: 'memory', value: 'm-' });
    expect(s.memory).toBe(10);
  });
});
