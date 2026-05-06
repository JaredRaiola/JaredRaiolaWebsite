import type { Card, PileId, Rank, Suit } from './engine';
import { TABLEAUS } from './engine';

/**
 * Microsoft's 16-bit Linear Congruential Generator used by Win95 FreeCell.
 * Returns the upper 15 bits of the next 32-bit state.
 */
function makeMsRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 214013) + 2531011) >>> 0;
    return (state >>> 16) & 0x7fff;
  };
}

/**
 * Build the canonical Microsoft deck order: AC, AD, AH, AS, 2C, 2D, 2H, 2S, ...
 * This matches the Microsoft source (suit order C=0, D=1, H=2, S=3 within each rank).
 */
function buildCanonicalDeck(): Card[] {
  const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
  const suitChar: Record<Suit, string> = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'S' };
  const out: Card[] = [];
  for (let r = 1; r <= 13; r++) {
    const rank = r as Rank;
    const rankChar = rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
    for (const suit of suits) {
      out.push({ id: `${rankChar}${suitChar[suit]}`, suit, rank });
    }
  }
  return out;
}

/**
 * Deal cards into the 8 tableau columns using the Microsoft FreeCell algorithm:
 *   1. Start with canonical deck order.
 *   2. For i from 51 down to 1: swap deck[i] with deck[rand() % (i+1)].
 *   3. Fill columns sequentially from the top of the shuffled deck:
 *      cols 0–3 receive 7 cards each, cols 4–7 receive 6 cards each.
 *      Cards are drawn from deck[51] downward (MS reads the deck top-to-bottom).
 */
export function dealForGameNumber(gameNumber: number): Record<PileId, Card[]> {
  const rng = makeMsRng(gameNumber);
  const deck = buildCanonicalDeck();
  for (let i = 51; i > 0; i--) {
    const j = rng() % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const piles = {} as Record<PileId, Card[]>;
  for (const t of TABLEAUS) piles[t] = [];
  // Cells + foundations start empty; only tableau is dealt.
  piles['cell-0'] = []; piles['cell-1'] = []; piles['cell-2'] = []; piles['cell-3'] = [];
  piles['foundation-spades'] = []; piles['foundation-hearts'] = [];
  piles['foundation-clubs'] = []; piles['foundation-diamonds'] = [];
  // MS FreeCell fills each column top-to-bottom before moving to the next column.
  // The top of the shuffled deck is deck[51] (the last shuffle position touched).
  let pos = 51;
  for (let col = 0; col < 8; col++) {
    const size = col < 4 ? 7 : 6;
    for (let row = 0; row < size; row++) {
      piles[TABLEAUS[col]].push(deck[pos--]);
    }
  }
  return piles;
}
