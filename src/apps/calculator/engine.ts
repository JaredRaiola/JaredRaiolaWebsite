export type CalcState = {
  display: string;
  accumulator: number | null;
  pendingOp: '+' | '-' | '*' | '/' | null;
  awaitingNewEntry: boolean;
  memory: number;
  error: boolean;
};

export const initialCalcState: CalcState = {
  display: '0',
  accumulator: null,
  pendingOp: null,
  awaitingNewEntry: false,
  memory: 0,
  error: false,
};

const MAX_DIGITS = 16;

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  if (Object.is(n, -0)) n = 0;
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e16 || abs < 1e-9)) {
    return n.toExponential(MAX_DIGITS - 6).replace(/0+e/, 'e');
  }
  return parseFloat(n.toPrecision(MAX_DIGITS)).toString();
}

export type Action =
  | { kind: 'digit'; value: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' }
  | { kind: 'decimal' }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' }
  | { kind: 'equals' }
  | { kind: 'unary'; value: 'sign' | 'percent' | 'sqrt' | 'inverse' }
  | { kind: 'backspace' }
  | { kind: 'clearEntry' }
  | { kind: 'clearAll' }
  | { kind: 'memory'; value: 'mc' | 'mr' | 'ms' | 'm+' | 'm-' };

function applyOp(a: number, b: number, op: '+' | '-' | '*' | '/'): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? Infinity : a / b;
  }
}

function errorState(state: CalcState): CalcState {
  return {
    ...state,
    error: true,
    display: 'Error',
    accumulator: null,
    pendingOp: null,
    awaitingNewEntry: true,
  };
}

export function calcReducer(state: CalcState, action: Action): CalcState {
  if (state.error && action.kind !== 'clearAll' && action.kind !== 'clearEntry') {
    return state;
  }
  switch (action.kind) {
    case 'digit': {
      if (state.awaitingNewEntry) {
        return { ...state, display: action.value, awaitingNewEntry: false };
      }
      const next = state.display === '0' ? action.value : state.display + action.value;
      return { ...state, display: next };
    }
    case 'decimal': {
      if (state.awaitingNewEntry) {
        return { ...state, display: '0.', awaitingNewEntry: false };
      }
      if (state.display.includes('.')) return state;
      return { ...state, display: state.display + '.' };
    }
    case 'backspace': {
      if (state.awaitingNewEntry) return state;
      const next = state.display.length > 1 ? state.display.slice(0, -1) : '0';
      return { ...state, display: next };
    }
    case 'clearEntry':
      return { ...state, display: '0', awaitingNewEntry: false, error: false };
    case 'clearAll':
      return { ...initialCalcState, memory: state.memory };
    case 'op': {
      const current = parseFloat(state.display);
      if (state.pendingOp && state.accumulator !== null && !state.awaitingNewEntry) {
        const result = applyOp(state.accumulator, current, state.pendingOp);
        if (!Number.isFinite(result)) return errorState(state);
        return {
          ...state,
          display: formatNumber(result),
          accumulator: result,
          pendingOp: action.value,
          awaitingNewEntry: true,
        };
      }
      return {
        ...state,
        accumulator: current,
        pendingOp: action.value,
        awaitingNewEntry: true,
      };
    }
    case 'equals': {
      if (state.pendingOp === null || state.accumulator === null) return state;
      const current = parseFloat(state.display);
      const result = applyOp(state.accumulator, current, state.pendingOp);
      if (!Number.isFinite(result)) return errorState(state);
      return {
        ...state,
        display: formatNumber(result),
        accumulator: null,
        pendingOp: null,
        awaitingNewEntry: true,
      };
    }
    case 'unary': {
      const current = parseFloat(state.display);
      switch (action.value) {
        case 'sign':
          return { ...state, display: formatNumber(-current) };
        case 'sqrt': {
          if (current < 0) return errorState(state);
          return { ...state, display: formatNumber(Math.sqrt(current)), awaitingNewEntry: true };
        }
        case 'inverse': {
          if (current === 0) return errorState(state);
          return { ...state, display: formatNumber(1 / current), awaitingNewEntry: true };
        }
        case 'percent': {
          if (state.pendingOp === null || state.accumulator === null) return state;
          const pct = (state.accumulator * current) / 100;
          return { ...state, display: formatNumber(pct), awaitingNewEntry: false };
        }
      }
      break;
    }
    case 'memory': {
      const current = parseFloat(state.display);
      switch (action.value) {
        case 'mc': return { ...state, memory: 0 };
        case 'mr': return { ...state, display: formatNumber(state.memory), awaitingNewEntry: true };
        case 'ms': return { ...state, memory: current };
        case 'm+': return { ...state, memory: state.memory + current };
        case 'm-': return { ...state, memory: state.memory - current };
      }
      break;
    }
    default:
      return state;
  }
  return state;
}
