import { useState } from 'react';
import { useDialogDrag } from '@/lib/useDialogDrag';
import type { Options } from '../engine';

type Props = {
  initial: Options;
  onCancel: () => void;
  onOk: (next: Options) => void;
};

export default function OptionsDialog({ initial, onCancel, onOk }: Props): React.ReactElement {
  const [o, setO] = useState<Options>(initial);
  const drag = useDialogDrag();
  return (
    <div className="hearts-dialog-overlay" onClick={onCancel}>
      <div className="hearts-dialog window" onClick={(e) => e.stopPropagation()} style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">Options</div></div>
        <div className="window-body hearts-dialog-body">
          <fieldset>
            <legend>Difficulty</legend>
            <div className="field-row">
              <input id="hearts-diff-easy" type="radio" name="d" checked={o.difficulty === 'easy'} onChange={() => setO({ ...o, difficulty: 'easy' })} />
              <label htmlFor="hearts-diff-easy">Easy</label>
            </div>
            <div className="field-row">
              <input id="hearts-diff-medium" type="radio" name="d" checked={o.difficulty === 'medium'} onChange={() => setO({ ...o, difficulty: 'medium' })} />
              <label htmlFor="hearts-diff-medium">Medium</label>
            </div>
            <div className="field-row">
              <input id="hearts-diff-hard" type="radio" name="d" checked={o.difficulty === 'hard'} onChange={() => setO({ ...o, difficulty: 'hard' })} />
              <label htmlFor="hearts-diff-hard">Hard</label>
            </div>
          </fieldset>
          <div className="field-row">
            <input id="hearts-show-ai" type="checkbox" checked={o.showAiHands} onChange={(e) => setO({ ...o, showAiHands: e.target.checked })} />
            <label htmlFor="hearts-show-ai">Show AI hands (debug)</label>
          </div>
        </div>
        <div className="hearts-dialog-buttons">
          <button onClick={() => onOk(o)}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
