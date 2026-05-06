import type { Card as CardModel } from '../engine';
import Card from './Card';

const FACE_DOWN_OFFSET = 4;
const FACE_UP_OFFSET = 22;

type Props = {
  cards: CardModel[];
  outlineDragging: boolean;
  isDragSource: (cardId: string) => boolean;
  onPointerDownAt: (idx: number, e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Tableau({ cards, outlineDragging, isDragSource, onPointerDownAt, onDoubleClickTop }: Props): React.ReactElement {
  let y = 0;
  return (
    <div className="sol-tableau">
      {cards.map((c, i) => {
        const top = i === cards.length - 1;
        const offset = i === 0 ? 0 : (cards[i - 1].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET);
        y += offset;
        const dim = isDragSource(c.id) && outlineDragging;
        return (
          <Card
            key={c.id}
            card={c}
            style={{ position: 'absolute', top: y, left: 0 }}
            onPointerDown={c.faceUp ? (e) => onPointerDownAt(i, e) : undefined}
            onDoubleClick={top ? onDoubleClickTop : undefined}
            dimmed={dim}
          />
        );
      })}
    </div>
  );
}
