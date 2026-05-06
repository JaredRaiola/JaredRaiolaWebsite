import type { Suit, Rank } from '../engine';

const SUIT_PATHS: Record<Suit, string> = {
  spades:   'M50 10 C 30 35, 10 50, 25 65 C 35 75, 50 65, 50 60 L 50 60 C 50 65, 65 75, 75 65 C 90 50, 70 35, 50 10 Z M40 70 L 60 70 L 55 85 L 45 85 Z',
  hearts:   'M50 85 C 20 60, 10 35, 30 25 C 40 20, 48 25, 50 35 C 52 25, 60 20, 70 25 C 90 35, 80 60, 50 85 Z',
  clubs:    'M50 10 A 14 14 0 1 1 49 38 A 14 14 0 1 1 36 55 A 14 14 0 1 1 64 55 A 14 14 0 1 1 51 38 A 14 14 0 1 1 50 10 Z M40 70 L 60 70 L 55 85 L 45 85 Z',
  diamonds: 'M50 8 L 85 50 L 50 92 L 15 50 Z',
};

const SUIT_COLOR: Record<Suit, string> = {
  spades: '#000', clubs: '#000', hearts: '#c00', diamonds: '#c00',
};

const RANK_LABEL: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

const PIP_LAYOUTS: Partial<Record<Rank, [number, number][]>> = {
  2: [[50, 22], [50, 78]],
  3: [[50, 22], [50, 50], [50, 78]],
  4: [[30, 25], [70, 25], [30, 75], [70, 75]],
  5: [[30, 25], [70, 25], [50, 50], [30, 75], [70, 75]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
  7: [[30, 20], [70, 20], [50, 33], [30, 50], [70, 50], [30, 80], [70, 80]],
  8: [[30, 20], [70, 20], [50, 33], [30, 50], [70, 50], [50, 67], [30, 80], [70, 80]],
  9: [[30, 20], [70, 20], [30, 38], [70, 38], [50, 50], [30, 62], [70, 62], [30, 80], [70, 80]],
  10: [[30, 20], [70, 20], [30, 35], [70, 35], [30, 50], [70, 50], [30, 65], [70, 65], [30, 80], [70, 80]],
};

const COURT_LABEL: Partial<Record<Rank, string>> = { 11: 'J', 12: 'Q', 13: 'K' };

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
        <svg key={i} x={x - 8} y={y * 1.4 - 10 + 10} width="16" height="16" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
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
