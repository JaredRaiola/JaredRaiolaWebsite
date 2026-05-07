import type { Card as CardModel } from '../engine';
import CardFaceSvg from '@/apps/solitaire/cards/CardFaceSvg';

const STRIDE = 22;

type Props = {
  cards: CardModel[];
  draggingIds: Set<string>;
  outlineDragging: boolean;
  onPointerDownAt: (idx: number, e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Tableau({ cards, draggingIds, outlineDragging, onPointerDownAt, onDoubleClickTop }: Props): React.ReactElement {
  return (
    <div className="fc-tableau">
      {cards.map((card, i) => {
        const isTop = i === cards.length - 1;
        const isDrag = draggingIds.has(card.id);
        return (
          <div
            key={card.id}
            className="fc-card"
            style={{
              position: 'absolute',
              top: i * STRIDE,
              left: 0,
              opacity: isDrag ? (outlineDragging ? 0.55 : 0) : 1,
            }}
            onPointerDown={(e) => onPointerDownAt(i, e)}
            onDoubleClick={isTop ? onDoubleClickTop : undefined}
          >
            <CardFaceSvg suit={card.suit} rank={card.rank} />
          </div>
        );
      })}
    </div>
  );
}
