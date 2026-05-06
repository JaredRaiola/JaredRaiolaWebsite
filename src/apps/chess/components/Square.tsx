import type { Piece } from '../engine';

const GLYPH: Record<Piece['type'], { white: string; black: string }> = {
  king:   { white: '♔', black: '♚' },
  queen:  { white: '♕', black: '♛' },
  rook:   { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn:   { white: '♙', black: '♟' },
};

type Props = {
  square: number;
  piece: Piece | null;
  light: boolean;
  selected: boolean;
  legalDest: boolean;
  legalCapture: boolean;
  lastMove: boolean;
  inCheck: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
};

export default function Square(props: Props): React.ReactElement {
  const { square, piece, light, selected, legalDest, legalCapture, lastMove, inCheck, onPointerDown, onClick } = props;
  const cls = ['ch-sq'];
  cls.push(light ? 'ch-light' : 'ch-dark');
  if (selected) cls.push('ch-selected');
  if (lastMove) cls.push('ch-last');
  if (legalCapture) cls.push('ch-legal-capture');
  if (inCheck) cls.push('ch-check');
  return (
    <div className={cls.join(' ')} data-sq={String(square)} onPointerDown={onPointerDown} onClick={onClick}>
      {legalDest && !piece && <div className="ch-dot" />}
      {piece && (
        <div className={`ch-piece ch-piece-${piece.color}`}>
          {GLYPH[piece.type][piece.color]}
        </div>
      )}
    </div>
  );
}
