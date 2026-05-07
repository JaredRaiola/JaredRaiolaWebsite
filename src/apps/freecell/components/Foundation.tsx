import type { Card as CardModel, Suit } from '../engine';
import { SUIT_GLYPHS, SUIT_COLOR } from '@/apps/solitaire/cards/suitGlyphs';
import CardFaceSvg from '@/apps/solitaire/cards/CardFaceSvg';

type Props = {
  suit: Suit;
  cards: CardModel[];
  onPointerDownTop?: (e: React.PointerEvent) => void;
  onDoubleClickTop?: (e: React.MouseEvent) => void;
  dragging?: boolean;
  outlineDragging?: boolean;
};

export default function Foundation({ suit, cards, onPointerDownTop, onDoubleClickTop, dragging, outlineDragging }: Props): React.ReactElement {
  const top = cards[cards.length - 1];
  const glyph = SUIT_GLYPHS[suit];
  return (
    <div className="fc-foundation">
      {!top && (
        <svg className="fc-foundation-outline" viewBox={glyph.viewBox} preserveAspectRatio="xMidYMid meet">
          <path d={glyph.path} fill={SUIT_COLOR[suit]} fillOpacity={0.35} />
        </svg>
      )}
      {top && (
        <div
          className="fc-card"
          onPointerDown={onPointerDownTop}
          onDoubleClick={onDoubleClickTop}
          style={{ opacity: dragging ? (outlineDragging ? 0.55 : 0) : 1 }}
        >
          <CardFaceSvg suit={top.suit} rank={top.rank} />
        </div>
      )}
    </div>
  );
}
