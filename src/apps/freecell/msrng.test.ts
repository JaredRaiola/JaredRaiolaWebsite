import { describe, it, expect } from 'vitest';
import { dealForGameNumber } from './msrng';

describe('Microsoft RNG deal', () => {
  it('deal #1 column 0 matches reference', () => {
    // Microsoft FreeCell deal #1, column 0, top to bottom.
    const expected = ['JD', '2D', '9H', 'JC', '5D', '7H', '7C'];
    const piles = dealForGameNumber(1);
    const col0Ids = piles['tableau-0'].map((c) => c.id);
    expect(col0Ids).toEqual(expected);
  });
  it('produces 52 unique cards', () => {
    const piles = dealForGameNumber(7);
    const all: string[] = [];
    for (const t of ['tableau-0','tableau-1','tableau-2','tableau-3','tableau-4','tableau-5','tableau-6','tableau-7'] as const) {
      all.push(...piles[t].map((c) => c.id));
    }
    expect(all).toHaveLength(52);
    expect(new Set(all).size).toBe(52);
  });
  it('cols 0–3 hold 7 cards, cols 4–7 hold 6 cards', () => {
    const piles = dealForGameNumber(7);
    expect(piles['tableau-0']).toHaveLength(7);
    expect(piles['tableau-3']).toHaveLength(7);
    expect(piles['tableau-4']).toHaveLength(6);
    expect(piles['tableau-7']).toHaveLength(6);
  });
  it('same seed produces identical deal', () => {
    const a = dealForGameNumber(42);
    const b = dealForGameNumber(42);
    for (const t of ['tableau-0','tableau-3','tableau-7'] as const) {
      expect(a[t].map((c) => c.id)).toEqual(b[t].map((c) => c.id));
    }
  });
  it('different seeds produce different deals', () => {
    const a = dealForGameNumber(1);
    const b = dealForGameNumber(2);
    expect(a['tableau-0'].map((c) => c.id)).not.toEqual(b['tableau-0'].map((c) => c.id));
  });
});
