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
    <div className="sol-dialog-overlay" onClick={onCancel}>
      <div className="sol-dialog window" onClick={(e) => e.stopPropagation()} style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}>
          <div className="title-bar-text">Options</div>
        </div>
        <div className="window-body sol-dialog-body">
          <fieldset>
            <legend>Draw</legend>
            <div className="field-row">
              <input id="sol-draw-1" type="radio" name="d" checked={o.draw === 1} onChange={() => setO({ ...o, draw: 1 })} />
              <label htmlFor="sol-draw-1">Draw one</label>
            </div>
            <div className="field-row">
              <input id="sol-draw-3" type="radio" name="d" checked={o.draw === 3} onChange={() => setO({ ...o, draw: 3 })} />
              <label htmlFor="sol-draw-3">Draw three</label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Scoring</legend>
            <div className="field-row">
              <input id="sol-sc-std" type="radio" name="s" checked={o.scoring === 'standard'} onChange={() => setO({ ...o, scoring: 'standard' })} />
              <label htmlFor="sol-sc-std">Standard</label>
            </div>
            <div className="field-row">
              <input id="sol-sc-veg" type="radio" name="s" checked={o.scoring === 'vegas'} onChange={() => setO({ ...o, scoring: 'vegas' })} />
              <label htmlFor="sol-sc-veg">Vegas</label>
            </div>
            <div className="field-row">
              <input id="sol-sc-none" type="radio" name="s" checked={o.scoring === 'none'} onChange={() => setO({ ...o, scoring: 'none' })} />
              <label htmlFor="sol-sc-none">None</label>
            </div>
          </fieldset>
          <div className="field-row">
            <input id="sol-timed" type="checkbox" checked={o.timed} onChange={(e) => setO({ ...o, timed: e.target.checked })} />
            <label htmlFor="sol-timed">Timed game</label>
          </div>
          <div className="field-row">
            <input id="sol-status" type="checkbox" checked={o.statusBar} onChange={(e) => setO({ ...o, statusBar: e.target.checked })} />
            <label htmlFor="sol-status">Status bar</label>
          </div>
          <div className="field-row">
            <input id="sol-outline" type="checkbox" checked={o.outlineDragging} onChange={(e) => setO({ ...o, outlineDragging: e.target.checked })} />
            <label htmlFor="sol-outline">Outline dragging</label>
          </div>
          <div className="field-row">
            <input id="sol-vkeep" type="checkbox" checked={o.vegasKeepScore} onChange={(e) => setO({ ...o, vegasKeepScore: e.target.checked })} disabled={o.scoring !== 'vegas'} />
            <label htmlFor="sol-vkeep">Keep score (Vegas)</label>
          </div>
        </div>
        <div className="sol-dialog-buttons">
          <button onClick={() => onOk(o)}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
