import { describe, it, expect } from 'vitest';
import { evaluate, chooseAiMove } from './ai';
import { initialPosition, makeSquare, generateLegalMoves, makeMove, fileOf, rankOf, type Position, type Piece } from './engine';

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

describe('chooseAiMove — Beginner', () => {
  it('returns a legal move from initial position', () => {
    const p = initialPosition();
    const m = chooseAiMove(p, 'beginner');
    const legal = generateLegalMoves(p);
    expect(legal.find(x => x.from === m.from && x.to === m.to && x.promotion === m.promotion)).toBeDefined();
  });
});

describe('chooseAiMove — Intermediate', () => {
  it('captures a hanging queen at depth 3', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'king' });
    place(p, 3, 0, { color: 'white', type: 'rook' });
    place(p, 7, 7, { color: 'black', type: 'king' });
    place(p, 3, 4, { color: 'black', type: 'queen' });
    p.toMove = 'white';
    const m = chooseAiMove(p, 'intermediate');
    expect(m.to).toBe(makeSquare(3, 4));
    expect(m.from).toBe(makeSquare(3, 0));
  });
  it('avoids hanging its queen for free', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'king' });
    place(p, 3, 0, { color: 'white', type: 'queen' });
    place(p, 7, 7, { color: 'black', type: 'king' });
    place(p, 3, 7, { color: 'black', type: 'rook' });
    p.toMove = 'white';
    const m = chooseAiMove(p, 'intermediate');
    if (m.from === makeSquare(3, 0)) {
      // If the AI moved the queen, the destination must not be a hanging square on the d-file.
      const dangerous = fileOf(m.to) === 3 && rankOf(m.to) !== 7;
      expect(dangerous).toBe(false);
    }
  });
});

describe('chooseAiMove — determinism', () => {
  it('same (position, difficulty) yields same move', () => {
    const p = initialPosition();
    const a = chooseAiMove(p, 'intermediate');
    const b = chooseAiMove(p, 'intermediate');
    expect(a).toEqual(b);
  });
});

describe('chooseAiMove — Advanced', () => {
  it('captures a hanging black queen on h8 with Rxh8', () => {
    // Position: White Kg1, Rh1. Black Kg8, Qh8 (black queen on h8, undefended).
    // Best line: 1. Rxh8+ — rook captures the queen (winning 900 cp),
    // giving check; the AI at depth 4 + quiescence must find this.
    const p = emptyPos();
    place(p, 6, 0, { color: 'white', type: 'king' });
    place(p, 7, 0, { color: 'white', type: 'rook' });
    place(p, 6, 7, { color: 'black', type: 'king' });
    place(p, 7, 7, { color: 'black', type: 'queen' });  // black Qh8
    p.toMove = 'white';
    const m = chooseAiMove(p, 'advanced');
    expect(m.from).toBe(makeSquare(7, 0));
    expect(m.to).toBe(makeSquare(7, 7));
  });
});
