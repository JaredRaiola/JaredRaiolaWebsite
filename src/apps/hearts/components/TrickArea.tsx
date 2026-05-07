import type { Trick, PlayerId, Rank } from '../engine';
import CardFaceSvg from '@/apps/solitaire/cards/CardFaceSvg';
import type { Rank as SolitaireRank } from '@/apps/solitaire/engine';

function toSolitaireRank(r: Rank): SolitaireRank {
  return (r === 14 ? 1 : r) as SolitaireRank;
}

type Props = { trick: Trick | null; resolving: boolean };

const SLOT_OFFSETS: Record<PlayerId, { x: number; y: number }> = {
  0: { x: 0, y: 60 },     // human (south)
  1: { x: -60, y: 0 },    // left (west)
  2: { x: 0, y: -60 },    // ai 2 (north)
  3: { x: 60, y: 0 },     // right (east)
};

export default function TrickArea({ trick, resolving }: Props): React.ReactElement {
  return (
    <div className={`hearts-trick${resolving ? ' resolving' : ''}`}>
      {trick?.plays.map(({ player, card }) => {
        const offset = SLOT_OFFSETS[player];
        return (
          <div
            key={card.id}
            className="hearts-trick-card"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          >
            <CardFaceSvg suit={card.suit} rank={toSolitaireRank(card.rank)} />
          </div>
        );
      })}
    </div>
  );
}
