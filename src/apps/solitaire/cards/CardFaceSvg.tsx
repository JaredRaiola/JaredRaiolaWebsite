import type { Suit, Rank } from '../engine';
import { SUIT_GLYPHS, SUIT_COLOR } from './suitGlyphs';

const RANK_LABEL: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

const PIP_LAYOUTS: Partial<Record<Rank, [number, number][]>> = {
  2: [[50, 42], [50, 98]],
  3: [[50, 42], [50, 70], [50, 98]],
  4: [[35, 45], [65, 45], [35, 95], [65, 95]],
  5: [[35, 45], [65, 45], [50, 70], [35, 95], [65, 95]],
  6: [[35, 42], [65, 42], [35, 70], [65, 70], [35, 98], [65, 98]],
  7: [[35, 42], [65, 42], [50, 56], [35, 70], [65, 70], [35, 98], [65, 98]],
  8: [[35, 42], [65, 42], [50, 56], [35, 70], [65, 70], [50, 84], [35, 98], [65, 98]],
  9: [[35, 42], [65, 42], [35, 60], [65, 60], [50, 70], [35, 80], [65, 80], [35, 98], [65, 98]],
  10: [[35, 42], [65, 42], [50, 52], [35, 62], [65, 62], [35, 78], [65, 78], [50, 88], [35, 98], [65, 98]],
};

const COURT_LABEL: Partial<Record<Rank, string>> = { 11: 'J', 12: 'Q', 13: 'K' };

const PIP_SIZE = 16;
const CORNER_SIZE = 14;

type Props = { suit: Suit; rank: Rank };

export default function CardFaceSvg({ suit, rank }: Props): React.ReactElement {
  const color = SUIT_COLOR[suit];
  const glyph = SUIT_GLYPHS[suit];
  const label = RANK_LABEL[rank];
  const isCourt = rank >= 11;
  const isAce = rank === 1;
  const SuitMark = ({ x, y, size }: { x: number; y: number; size: number }) => (
    <svg x={x} y={y} width={size} height={size} viewBox={glyph.viewBox} preserveAspectRatio="xMidYMid meet">
      <path d={glyph.path} fill={color} />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" className="card-face">
      <rect width="100" height="140" rx="6" ry="6" fill="#fff" stroke="#000" strokeWidth="1" />
      <text x="6" y="20" fontFamily="Arial Black, Arial, sans-serif" fontSize="16" fontWeight="bold" fill={color}>{label}</text>
      <SuitMark x={4} y={22} size={CORNER_SIZE} />
      <g transform="translate(94 134) rotate(180)">
        <text x="0" y="14" fontFamily="Arial Black, Arial, sans-serif" fontSize="16" fontWeight="bold" fill={color}>{label}</text>
        <SuitMark x={-2} y={16} size={CORNER_SIZE} />
      </g>
      {isAce && <SuitMark x={30} y={50} size={40} />}
      {!isAce && !isCourt && PIP_LAYOUTS[rank]?.map(([x, y], i) => (
        <SuitMark key={i} x={x - PIP_SIZE / 2} y={y - PIP_SIZE / 2} size={PIP_SIZE} />
      ))}
      {isCourt && (
        <g>
          <rect x="20" y="35" width="60" height="70" fill="#fff" stroke={color} strokeWidth="2" />
          <text x="50" y="80" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="40" fontWeight="bold" fill={color}>
            {COURT_LABEL[rank]}
          </text>
        </g>
      )}
    </svg>
  );
}
