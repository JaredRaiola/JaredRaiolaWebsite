import type { Card as CardModel } from '../engine';
import CardFaceSvg from '@/apps/solitaire/cards/CardFaceSvg';
import type { Rank as SolitaireRank } from '@/apps/solitaire/engine';

// Hearts uses Ace=14; Solitaire CardFaceSvg uses Ace=1. Map accordingly.
function toSolitaireRank(r: CardModel['rank']): SolitaireRank {
  return (r === 14 ? 1 : r) as SolitaireRank;
}

const STRIDE = 24;
const LIFT = 8;

type Props = {
  cards: CardModel[];
  selected: Set<string>;
  legalIds: Set<string> | null;
  onCardClick: (card: CardModel) => void;
};

export default function Hand({ cards, selected, legalIds, onCardClick }: Props): React.ReactElement {
  const total = cards.length;
  const width = total > 0 ? STRIDE * (total - 1) + 71 : 0;
  return (
    <div className="hearts-hand" style={{ width }}>
      {cards.map((card, i) => {
        const isSelected = selected.has(card.id);
        const isLegal = legalIds === null || legalIds.has(card.id);
        return (
          <div
            key={card.id}
            className={`hearts-hand-card${isSelected ? ' selected' : ''}${!isLegal ? ' illegal' : ''}`}
            style={{ left: i * STRIDE, bottom: isSelected ? LIFT : 0 }}
            onClick={() => onCardClick(card)}
          >
            <CardFaceSvg suit={card.suit} rank={toSolitaireRank(card.rank)} />
          </div>
        );
      })}
    </div>
  );
}
