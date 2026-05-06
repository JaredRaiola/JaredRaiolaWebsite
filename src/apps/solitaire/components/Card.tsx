import type { Card as CardModel } from '../engine';
import CardFaceSvg from '../cards/CardFaceSvg';
import CardBackSvg from '../cards/CardBackSvg';

type Props = {
  card: CardModel;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
};

export default function Card({ card, onPointerDown, onDoubleClick, style }: Props): React.ReactElement {
  return (
    <div
      className="sol-card"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={style}
      data-card-id={card.id}
    >
      {card.faceUp ? <CardFaceSvg suit={card.suit} rank={card.rank} /> : <CardBackSvg />}
    </div>
  );
}
