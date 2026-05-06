import type { Card as CardModel } from '../engine';
import Pile from './Pile';
import Card from './Card';

type Props = {
  cards: CardModel[];
  fanSize: number;
  outlineDragging: boolean;
  isDragSource: (cardId: string) => boolean;
  onPointerDownTop: (e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Waste({ cards, fanSize, outlineDragging, isDragSource, onPointerDownTop, onDoubleClickTop }: Props): React.ReactElement {
  const n = Math.min(Math.max(1, fanSize), cards.length);
  const visible = cards.slice(-n);
  return (
    <Pile className="sol-waste">
      {visible.map((c, i) => {
        const isTop = i === visible.length - 1;
        const dragging = isDragSource(c.id);
        return (
          <Card
            key={c.id}
            card={c}
            style={{
              position: 'absolute',
              left: i * 14,
              top: 0,
              opacity: dragging ? (outlineDragging ? 0.55 : 0) : 1,
            }}
            onPointerDown={isTop ? onPointerDownTop : undefined}
            onDoubleClick={isTop ? onDoubleClickTop : undefined}
          />
        );
      })}
    </Pile>
  );
}
