import type { Card as CardModel, Suit } from '../engine';
import Pile from './Pile';
import Card from './Card';

const SUIT_OUTLINE: Record<Suit, string> = {
  spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦',
};

type Props = {
  suit: Suit;
  cards: CardModel[];
  outlineDragging: boolean;
  isDragSource: (cardId: string) => boolean;
  onPointerDownTop: (e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Foundation({ suit, cards, outlineDragging, isDragSource, onPointerDownTop, onDoubleClickTop }: Props): React.ReactElement {
  const top = cards[cards.length - 1];
  const dragging = top ? isDragSource(top.id) : false;
  return (
    <Pile className="sol-foundation">
      {!top && <div className={`sol-foundation-outline sol-foundation-${suit}`}>{SUIT_OUTLINE[suit]}</div>}
      {top && (
        <Card
          card={top}
          onPointerDown={onPointerDownTop}
          onDoubleClick={onDoubleClickTop}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            opacity: dragging ? (outlineDragging ? 0.55 : 0) : 1,
          }}
        />
      )}
    </Pile>
  );
}
