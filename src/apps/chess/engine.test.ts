import { describe, it, expect } from 'vitest';
import { initialPosition, fileOf, rankOf, makeSquare } from './engine';

describe('initialPosition', () => {
  it('returns 64-square board with white to move', () => {
    const p = initialPosition();
    expect(p.board).toHaveLength(64);
    expect(p.toMove).toBe('white');
    expect(p.fullmoveNumber).toBe(1);
    expect(p.halfmoveClock).toBe(0);
    expect(p.enPassantTarget).toBeNull();
  });
  it('places white major pieces on rank 1 (rank index 0)', () => {
    const p = initialPosition();
    const exp = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
    for (let f = 0; f < 8; f++) {
      const sq = makeSquare(f, 0);
      expect(p.board[sq]).toEqual({ color: 'white', type: exp[f] });
    }
  });
  it('places white pawns on rank 2 (rank index 1)', () => {
    const p = initialPosition();
    for (let f = 0; f < 8; f++) {
      expect(p.board[makeSquare(f, 1)]).toEqual({ color: 'white', type: 'pawn' });
    }
  });
  it('places black pawns on rank 7 and majors on rank 8', () => {
    const p = initialPosition();
    const exp = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
    for (let f = 0; f < 8; f++) {
      expect(p.board[makeSquare(f, 6)]).toEqual({ color: 'black', type: 'pawn' });
      expect(p.board[makeSquare(f, 7)]).toEqual({ color: 'black', type: exp[f] });
    }
  });
  it('middle ranks are empty', () => {
    const p = initialPosition();
    for (let r = 2; r <= 5; r++) {
      for (let f = 0; f < 8; f++) {
        expect(p.board[makeSquare(f, r)]).toBeNull();
      }
    }
  });
  it('all castling rights start true', () => {
    const p = initialPosition();
    expect(p.castling).toEqual({
      whiteKingside: true, whiteQueenside: true,
      blackKingside: true, blackQueenside: true,
    });
  });
  it('square coordinate helpers round-trip', () => {
    expect(fileOf(0)).toBe(0); expect(rankOf(0)).toBe(0);
    expect(fileOf(63)).toBe(7); expect(rankOf(63)).toBe(7);
    expect(makeSquare(4, 3)).toBe(28);
  });
});
