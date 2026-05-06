import { describe, it, expect } from 'vitest';
import { evaluate } from './ai';
import { initialPosition, makeSquare, type Position, type Piece } from './engine';

function emptyPos(): Position {
  return {
    board: new Array(64).fill(null),
    toMove: 'white',
    castling: { whiteKingside: false, whiteQueenside: false, blackKingside: false, blackQueenside: false },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}
function place(p: Position, file: number, rank: number, piece: Piece): void {
  p.board[makeSquare(file, rank)] = piece;
}

describe('evaluate', () => {
  it('initial position is roughly balanced', () => {
    expect(Math.abs(evaluate(initialPosition()))).toBeLessThan(50);
  });
  it('white up a queen evaluates strongly positive', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'king' });
    place(p, 4, 4, { color: 'white', type: 'queen' });
    place(p, 7, 7, { color: 'black', type: 'king' });
    expect(evaluate(p)).toBeGreaterThan(800);
  });
  it('black up a rook evaluates strongly negative', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'king' });
    place(p, 7, 7, { color: 'black', type: 'king' });
    place(p, 4, 4, { color: 'black', type: 'rook' });
    expect(evaluate(p)).toBeLessThan(-450);
  });
  it('symmetric material yields 0', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'king' });
    place(p, 7, 7, { color: 'black', type: 'king' });
    place(p, 4, 1, { color: 'white', type: 'pawn' });
    place(p, 4, 6, { color: 'black', type: 'pawn' });
    expect(evaluate(p)).toBe(0);
  });
});
