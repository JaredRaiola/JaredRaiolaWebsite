import { useState } from 'react';
import { useDialogDrag } from '@/lib/useDialogDrag';
import type { Color, Difficulty } from '../engine';

type Props = {
  onCancel: () => void;
  onOk: (color: Color, difficulty: Difficulty) => void;
};

type ColorChoice = Color | 'random';

export default function NewGameDialog({ onCancel, onOk }: Props): React.ReactElement {
  const drag = useDialogDrag();
  const [color, setColor] = useState<ColorChoice>('random');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const submit = (): void => {
    const c: Color = color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : color;
    onOk(c, difficulty);
  };
  return (
    <div className="ch-dialog-overlay" onClick={onCancel}>
      <div className="ch-dialog window" onClick={(e) => e.stopPropagation()} style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">New Game</div></div>
        <div className="window-body ch-dialog-body">
          <fieldset>
            <legend>Play as</legend>
            <div className="field-row"><input type="radio" id="ch-c-random" checked={color === 'random'} onChange={() => setColor('random')} /><label htmlFor="ch-c-random">Random</label></div>
            <div className="field-row"><input type="radio" id="ch-c-white" checked={color === 'white'} onChange={() => setColor('white')} /><label htmlFor="ch-c-white">White</label></div>
            <div className="field-row"><input type="radio" id="ch-c-black" checked={color === 'black'} onChange={() => setColor('black')} /><label htmlFor="ch-c-black">Black</label></div>
          </fieldset>
          <fieldset>
            <legend>Difficulty</legend>
            <div className="field-row"><input type="radio" id="ch-d-b" checked={difficulty === 'beginner'} onChange={() => setDifficulty('beginner')} /><label htmlFor="ch-d-b">Beginner</label></div>
            <div className="field-row"><input type="radio" id="ch-d-i" checked={difficulty === 'intermediate'} onChange={() => setDifficulty('intermediate')} /><label htmlFor="ch-d-i">Intermediate</label></div>
            <div className="field-row"><input type="radio" id="ch-d-a" checked={difficulty === 'advanced'} onChange={() => setDifficulty('advanced')} /><label htmlFor="ch-d-a">Advanced</label></div>
          </fieldset>
        </div>
        <div className="ch-dialog-buttons">
          <button onClick={submit}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
