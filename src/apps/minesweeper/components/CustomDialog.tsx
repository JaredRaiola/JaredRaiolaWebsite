import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CUSTOM_LIMITS, maxMinesFor } from '../difficulties';

type Props = {
  initialWidth: number;
  initialHeight: number;
  initialMines: number;
  onCancel(): void;
  onSubmit(w: number, h: number, m: number): void;
};

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export function CustomDialog({ initialWidth, initialHeight, initialMines, onCancel, onSubmit }: Props) {
  const [w, setW] = useState(String(initialWidth));
  const [h, setH] = useState(String(initialHeight));
  const [m, setM] = useState(String(initialMines));

  const submit = (): void => {
    const width = clamp(parseInt(w, 10), CUSTOM_LIMITS.minWidth, CUSTOM_LIMITS.maxWidth);
    const height = clamp(parseInt(h, 10), CUSTOM_LIMITS.minHeight, CUSTOM_LIMITS.maxHeight);
    const mines = clamp(parseInt(m, 10), CUSTOM_LIMITS.minMines, maxMinesFor(width, height));
    onSubmit(width, height, mines);
  };

  return createPortal(
    <div className="ms-dialog-backdrop">
      <div className="ms-dialog">
        <div className="ms-dialog-title">Custom Field</div>
        <div className="ms-dialog-body">
          <label>Height: <input type="text" value={h} onChange={(e) => setH(e.target.value)} /></label>
          <label>Width: <input type="text" value={w} onChange={(e) => setW(e.target.value)} /></label>
          <label>Mines: <input type="text" value={m} onChange={(e) => setM(e.target.value)} /></label>
        </div>
        <div className="ms-dialog-buttons">
          <button onClick={submit}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
