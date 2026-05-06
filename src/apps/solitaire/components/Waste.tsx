import type { Card as CardModel } from '../engine';
import Pile from './Pile';
import Card from './Card';

type Props = {
  cards: CardModel[];
  draw: 1 | 3;
  outlineDragging: boolean;
  isDragSource: (cardId: string) => boolean;
  onPointerDownTop: (e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Waste({ cards, draw, outlineDragging, isDragSource, onPointerDownTop, onDoubleClickTop }: Props): React.ReactElement {
  const visible = draw === 1 ? cards.slice(-1) : cards.slice(-3);
  return (
    <Pile className="sol-waste">
      {visible.map((c, i) => {
        const isTop = i === visible.length - 1;
        return (
          <Card
            key={c.id}
            card={c}
            style={{ position: 'absolute', left: i * 14, top: 0 }}
            onPointerDown={isTop ? onPointerDownTop : undefined}
            onDoubleClick={isTop ? onDoubleClickTop : undefined}
            dimmed={isDragSource(c.id) && outlineDragging}
          />
        );
      })}
    </Pile>
  );
}
