import { createPortal } from 'react-dom';
import type { Color, PromotionType } from '../engine';

const GLYPHS: Record<PromotionType, { white: string; black: string }> = {
  queen:  { white: '♕', black: '♛' },
  rook:   { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
};

type Props = {
  color: Color;
  onChoose: (p: PromotionType) => void;
  onCancel: () => void;
};

export default function PromotionDialog({ color, onChoose, onCancel }: Props): React.ReactElement {
  return createPortal(
    <div className="ch-dialog-overlay" onClick={onCancel}>
      <div className="ch-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Promote pawn</div></div>
        <div className="window-body ch-dialog-body">
          <div className="ch-promo-grid">
            {(['queen','rook','bishop','knight'] as const).map((t) => (
              <button key={t} className="ch-promo-button" onClick={() => onChoose(t)} autoFocus={t === 'queen'}>
                <span className={`ch-piece ch-piece-${color}`}>{GLYPHS[t][color]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
