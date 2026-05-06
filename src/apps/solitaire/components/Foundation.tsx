import type { Card as CardModel, Suit } from '../engine';
import Pile from './Pile';
import Card from './Card';
import { SUIT_GLYPHS, SUIT_COLOR } from '../cards/suitGlyphs';

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
  const glyph = SUIT_GLYPHS[suit];
  return (
    <Pile className="sol-foundation">
      {!top && (
        <svg
          className="sol-foundation-outline"
          viewBox={glyph.viewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={glyph.path} fill={SUIT_COLOR[suit]} fillOpacity={0.35} />
        </svg>
      )}
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
