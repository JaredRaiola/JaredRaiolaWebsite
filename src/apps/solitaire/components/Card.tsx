import type { Card as CardModel } from '../engine';
import CardFaceSvg from '../cards/CardFaceSvg';
import CardBackSvg from '../cards/CardBackSvg';

type Props = {
  card: CardModel;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dimmed?: boolean;
  style?: React.CSSProperties;
};

export default function Card({ card, onPointerDown, onDoubleClick, onContextMenu, dimmed, style }: Props): React.ReactElement {
  return (
    <div
      className={`sol-card${dimmed ? ' sol-card-dimmed' : ''}`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      style={style}
      data-card-id={card.id}
    >
      {card.faceUp ? <CardFaceSvg suit={card.suit} rank={card.rank} /> : <CardBackSvg />}
    </div>
  );
}
