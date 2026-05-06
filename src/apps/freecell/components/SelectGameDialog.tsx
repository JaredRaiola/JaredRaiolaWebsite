import { useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  onCancel: () => void;
  onOk: (gameNumber: number) => void;
};

function clamp(n: number): number {
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(32000, Math.floor(n)));
}

export default function SelectGameDialog({ onCancel, onOk }: Props): React.ReactElement {
  const [text, setText] = useState('');
  const submit = (): void => {
    const n = clamp(parseInt(text, 10));
    onOk(n);
  };
  return createPortal(
    <div className="fc-dialog-overlay" onClick={onCancel}>
      <div className="fc-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Select Game</div></div>
        <div className="window-body fc-dialog-body">
          <p>Game number (1–32000):</p>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            autoFocus
          />
        </div>
        <div className="fc-dialog-buttons">
          <button onClick={submit}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
