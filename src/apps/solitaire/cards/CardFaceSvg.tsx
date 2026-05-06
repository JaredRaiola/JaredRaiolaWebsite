import type { Suit, Rank } from '../engine';

const SUIT_PATHS: Record<Suit, string> = {
  spades:   'M50 8 C 28 26, 14 50, 26 68 C 34 78, 46 76, 50 66 C 54 76, 66 78, 74 68 C 86 50, 72 26, 50 8 Z M38 66 L62 66 L60 90 L40 90 Z',
  hearts:   'M50 88 C 18 64, 8 36, 28 22 C 40 18, 48 24, 50 32 C 52 24, 60 18, 72 22 C 92 36, 82 64, 50 88 Z',
  clubs:    'M50 8 a 16 16 0 1 0 0 32 a 16 16 0 1 0 0 -32 z M34 36 a 16 16 0 1 0 0 32 a 16 16 0 1 0 0 -32 z M66 36 a 16 16 0 1 0 0 32 a 16 16 0 1 0 0 -32 z M40 60 L60 60 L62 90 L38 90 Z',
  diamonds: 'M50 8 L 84 50 L 50 92 L 16 50 Z',
};

const SUIT_COLOR: Record<Suit, string> = {
  spades: '#000', clubs: '#000', hearts: '#c00', diamonds: '#c00',
};

const RANK_LABEL: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

// Pip positions are in card-space (the outer 100x140 viewBox).
// The body region (between the corner indicators) is roughly y=38..102.
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

type Props = { suit: Suit; rank: Rank };

export default function CardFaceSvg({ suit, rank }: Props): React.ReactElement {
  const color = SUIT_COLOR[suit];
  const label = RANK_LABEL[rank];
  const isCourt = rank >= 11;
  const isAce = rank === 1;
  return (
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" className="card-face">
      <rect width="100" height="140" rx="6" ry="6" fill="#fff" stroke="#000" strokeWidth="1" />
      <text x="6" y="20" fontFamily="Arial Black, Arial, sans-serif" fontSize="16" fontWeight="bold" fill={color}>{label}</text>
      <svg x="4" y="22" width="14" height="14" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      <g transform="translate(94 134) rotate(180)">
        <text x="0" y="14" fontFamily="Arial Black, Arial, sans-serif" fontSize="16" fontWeight="bold" fill={color}>{label}</text>
        <svg x="-2" y="16" width="14" height="14" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      </g>
      {isAce && (
        <svg x="30" y="50" width="40" height="40" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      )}
      {!isAce && !isCourt && PIP_LAYOUTS[rank]?.map(([x, y], i) => (
        <svg key={i} x={x - PIP_SIZE / 2} y={y - PIP_SIZE / 2} width={PIP_SIZE} height={PIP_SIZE} viewBox="0 0 100 100">
          <path d={SUIT_PATHS[suit]} fill={color} />
        </svg>
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
