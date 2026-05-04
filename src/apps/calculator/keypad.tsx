import type { Action } from './engine';

type Props = {
  memory: number;
  dispatch: (a: Action) => void;
};

export function Keypad({ memory, dispatch }: Props) {
  const num = (v: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9') =>
    () => dispatch({ kind: 'digit', value: v });
  const op = (v: '+' | '-' | '*' | '/') => () => dispatch({ kind: 'op', value: v });
  const un = (v: 'sign' | 'percent' | 'sqrt' | 'inverse') =>
    () => dispatch({ kind: 'unary', value: v });
  const mem = (v: 'mc' | 'mr' | 'ms' | 'm+' | 'm-') =>
    () => dispatch({ kind: 'memory', value: v });
  const memActive = memory !== 0 ? 'calc-mem-active' : '';

  return (
    <div className="calc-keypad">
      <div className="calc-row">
        <button onClick={() => dispatch({ kind: 'backspace' })}>Backspace</button>
        <button onClick={() => dispatch({ kind: 'clearEntry' })}>CE</button>
        <button onClick={() => dispatch({ kind: 'clearAll' })}>C</button>
      </div>
      <div className="calc-grid">
        <button className={`calc-mem ${memActive}`} onClick={mem('mc')}>MC</button>
        <button onClick={num('7')}>7</button>
        <button onClick={num('8')}>8</button>
        <button onClick={num('9')}>9</button>
        <button className="calc-op" onClick={op('/')}>÷</button>
        <button onClick={un('sqrt')}>√</button>

        <button className={`calc-mem ${memActive}`} onClick={mem('mr')}>MR</button>
        <button onClick={num('4')}>4</button>
        <button onClick={num('5')}>5</button>
        <button onClick={num('6')}>6</button>
        <button className="calc-op" onClick={op('*')}>×</button>
        <button onClick={un('percent')}>%</button>

        <button className={`calc-mem ${memActive}`} onClick={mem('ms')}>MS</button>
        <button onClick={num('1')}>1</button>
        <button onClick={num('2')}>2</button>
        <button onClick={num('3')}>3</button>
        <button className="calc-op" onClick={op('-')}>−</button>
        <button onClick={un('inverse')}>1/x</button>

        <button className={`calc-mem ${memActive}`} onClick={mem('m+')}>M+</button>
        <button onClick={num('0')}>0</button>
        <button onClick={un('sign')}>±</button>
        <button onClick={() => dispatch({ kind: 'decimal' })}>.</button>
        <button className="calc-op" onClick={op('+')}>+</button>
        <button className="calc-op" onClick={() => dispatch({ kind: 'equals' })}>=</button>
      </div>
    </div>
  );
}
