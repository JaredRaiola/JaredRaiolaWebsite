import { useState } from 'react';
import type { Options } from '../engine';

type Props = {
  initial: Options;
  onCancel: () => void;
  onOk: (next: Options) => void;
};

export default function OptionsDialog({ initial, onCancel, onOk }: Props): React.ReactElement {
  const [o, setO] = useState<Options>(initial);
  return (
    <div className="sol-dialog-overlay" onClick={onCancel}>
      <div className="sol-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Options</div></div>
        <div className="window-body sol-dialog-body">
          <fieldset>
            <legend>Draw</legend>
            <label><input type="radio" name="d" checked={o.draw === 1} onChange={() => setO({ ...o, draw: 1 })} /> Draw one</label>
            <label><input type="radio" name="d" checked={o.draw === 3} onChange={() => setO({ ...o, draw: 3 })} /> Draw three</label>
          </fieldset>
          <fieldset>
            <legend>Scoring</legend>
            <label><input type="radio" name="s" checked={o.scoring === 'standard'} onChange={() => setO({ ...o, scoring: 'standard' })} /> Standard</label>
            <label><input type="radio" name="s" checked={o.scoring === 'vegas'} onChange={() => setO({ ...o, scoring: 'vegas' })} /> Vegas</label>
            <label><input type="radio" name="s" checked={o.scoring === 'none'} onChange={() => setO({ ...o, scoring: 'none' })} /> None</label>
          </fieldset>
          <label><input type="checkbox" checked={o.timed} onChange={(e) => setO({ ...o, timed: e.target.checked })} /> Timed game</label>
          <label><input type="checkbox" checked={o.statusBar} onChange={(e) => setO({ ...o, statusBar: e.target.checked })} /> Status bar</label>
          <label><input type="checkbox" checked={o.outlineDragging} onChange={(e) => setO({ ...o, outlineDragging: e.target.checked })} /> Outline dragging</label>
          <label><input type="checkbox" checked={o.vegasKeepScore} onChange={(e) => setO({ ...o, vegasKeepScore: e.target.checked })} disabled={o.scoring !== 'vegas'} /> Keep score (Vegas)</label>
        </div>
        <div className="sol-dialog-buttons">
          <button onClick={() => onOk(o)}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
