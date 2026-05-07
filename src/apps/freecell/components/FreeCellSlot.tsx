import type { Card as CardModel } from '../engine';
import CardFaceSvg from '@/apps/solitaire/cards/CardFaceSvg';

type Props = {
  card: CardModel | null;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  dragging?: boolean;
  outlineDragging?: boolean;
};

export default function FreeCellSlot({ card, onPointerDown, onDoubleClick, dragging, outlineDragging }: Props): React.ReactElement {
  return (
    <div className="fc-cell">
      {card && (
        <div
          className="fc-card"
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
          style={{ opacity: dragging ? (outlineDragging ? 0.55 : 0) : 1 }}
        >
          <CardFaceSvg suit={card.suit} rank={card.rank} />
        </div>
      )}
    </div>
  );
}
