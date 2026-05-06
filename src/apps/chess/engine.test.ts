import { describe, it, expect } from 'vitest';
import { initialPosition, fileOf, rankOf, makeSquare, generatePseudoLegalMoves, type Move, type Position, type Piece } from './engine';

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

function tos(moves: Move[]): number[] { return moves.map(m => m.to).sort((a, b) => a - b); }

describe('generatePseudoLegalMoves — pawns', () => {
  it('white pawn from start can push 1 or 2', () => {
    const p = emptyPos();
    place(p, 4, 1, { color: 'white', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 1));
    expect(tos(m)).toEqual([makeSquare(4, 2), makeSquare(4, 3)].sort((a,b)=>a-b));
  });
  it('white pawn off start can push 1 only', () => {
    const p = emptyPos();
    place(p, 4, 3, { color: 'white', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 3));
    expect(tos(m)).toEqual([makeSquare(4, 4)]);
  });
  it('white pawn captures diagonally', () => {
    const p = emptyPos();
    place(p, 4, 3, { color: 'white', type: 'pawn' });
    place(p, 3, 4, { color: 'black', type: 'pawn' });
    place(p, 5, 4, { color: 'black', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 3));
    expect(tos(m)).toEqual([makeSquare(3,4), makeSquare(4,4), makeSquare(5,4)].sort((a,b)=>a-b));
  });
  it('white pawn cannot push through a piece', () => {
    const p = emptyPos();
    place(p, 4, 1, { color: 'white', type: 'pawn' });
    place(p, 4, 2, { color: 'black', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 1));
    expect(m).toHaveLength(0);
  });
  it('black pawn pushes downward', () => {
    const p = emptyPos();
    p.toMove = 'black';
    place(p, 4, 6, { color: 'black', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 6));
    expect(tos(m)).toEqual([makeSquare(4, 4), makeSquare(4, 5)].sort((a,b)=>a-b));
  });
});

describe('generatePseudoLegalMoves — knights', () => {
  it('knight in center reaches 8 squares', () => {
    const p = emptyPos();
    place(p, 4, 3, { color: 'white', type: 'knight' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 3));
    expect(m).toHaveLength(8);
  });
  it('knight in corner reaches 2 squares', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'knight' });
    const m = generatePseudoLegalMoves(p, makeSquare(0, 0));
    expect(m).toHaveLength(2);
  });
  it('knight cannot land on own piece', () => {
    const p = emptyPos();
    place(p, 4, 3, { color: 'white', type: 'knight' });
    place(p, 5, 5, { color: 'white', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 3));
    expect(m.find(x => x.to === makeSquare(5, 5))).toBeUndefined();
  });
});

describe('generatePseudoLegalMoves — bishops', () => {
  it('bishop on empty board reaches 13 squares from d4', () => {
    const p = emptyPos();
    place(p, 3, 3, { color: 'white', type: 'bishop' });
    const m = generatePseudoLegalMoves(p, makeSquare(3, 3));
    expect(m).toHaveLength(13);
  });
  it('bishop blocked by friendly piece stops before it', () => {
    const p = emptyPos();
    place(p, 3, 3, { color: 'white', type: 'bishop' });
    place(p, 5, 5, { color: 'white', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(3, 3));
    expect(m.find(x => x.to === makeSquare(5, 5))).toBeUndefined();
    expect(m.find(x => x.to === makeSquare(4, 4))).toBeDefined();
  });
  it('bishop can capture enemy piece on the diagonal', () => {
    const p = emptyPos();
    place(p, 3, 3, { color: 'white', type: 'bishop' });
    place(p, 5, 5, { color: 'black', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(3, 3));
    expect(m.find(x => x.to === makeSquare(5, 5))).toBeDefined();
    expect(m.find(x => x.to === makeSquare(6, 6))).toBeUndefined();
  });
});

describe('generatePseudoLegalMoves — rooks', () => {
  it('rook on empty board reaches 14 squares from d4', () => {
    const p = emptyPos();
    place(p, 3, 3, { color: 'white', type: 'rook' });
    const m = generatePseudoLegalMoves(p, makeSquare(3, 3));
    expect(m).toHaveLength(14);
  });
});

describe('generatePseudoLegalMoves — queens', () => {
  it('queen on empty board from d4 reaches 27 squares', () => {
    const p = emptyPos();
    place(p, 3, 3, { color: 'white', type: 'queen' });
    const m = generatePseudoLegalMoves(p, makeSquare(3, 3));
    expect(m).toHaveLength(27);
  });
});

describe('generatePseudoLegalMoves — kings (no castling)', () => {
  it('king reaches 8 surrounding squares', () => {
    const p = emptyPos();
    place(p, 3, 3, { color: 'white', type: 'king' });
    const m = generatePseudoLegalMoves(p, makeSquare(3, 3));
    expect(m).toHaveLength(8);
  });
  it('king on edge reaches fewer', () => {
    const p = emptyPos();
    place(p, 0, 0, { color: 'white', type: 'king' });
    const m = generatePseudoLegalMoves(p, makeSquare(0, 0));
    expect(m).toHaveLength(3);
  });
});

describe('generatePseudoLegalMoves — initial position', () => {
  it('white has 20 pseudo-legal moves at start', () => {
    const p = initialPosition();
    const all: Move[] = [];
    for (let sq = 0; sq < 64; sq++) {
      const piece = p.board[sq];
      if (piece && piece.color === 'white') all.push(...generatePseudoLegalMoves(p, sq));
    }
    expect(all).toHaveLength(20);
  });
});

describe('generatePseudoLegalMoves — castling', () => {
  it('white kingside castle when path clear and rights held', () => {
    const p = emptyPos();
    place(p, 4, 0, { color: 'white', type: 'king' });
    place(p, 7, 0, { color: 'white', type: 'rook' });
    p.castling.whiteKingside = true;
    const m = generatePseudoLegalMoves(p, makeSquare(4, 0));
    const castleMove = m.find(x => x.castle === 'kingside');
    expect(castleMove).toBeDefined();
    expect(castleMove?.to).toBe(makeSquare(6, 0));
  });
  it('white queenside castle when path clear', () => {
    const p = emptyPos();
    place(p, 4, 0, { color: 'white', type: 'king' });
    place(p, 0, 0, { color: 'white', type: 'rook' });
    p.castling.whiteQueenside = true;
    const m = generatePseudoLegalMoves(p, makeSquare(4, 0));
    const castleMove = m.find(x => x.castle === 'queenside');
    expect(castleMove).toBeDefined();
    expect(castleMove?.to).toBe(makeSquare(2, 0));
  });
  it('castle blocked by piece in path', () => {
    const p = emptyPos();
    place(p, 4, 0, { color: 'white', type: 'king' });
    place(p, 7, 0, { color: 'white', type: 'rook' });
    place(p, 5, 0, { color: 'white', type: 'bishop' });
    p.castling.whiteKingside = true;
    const m = generatePseudoLegalMoves(p, makeSquare(4, 0));
    expect(m.find(x => x.castle === 'kingside')).toBeUndefined();
  });
  it('castle disabled when right is false', () => {
    const p = emptyPos();
    place(p, 4, 0, { color: 'white', type: 'king' });
    place(p, 7, 0, { color: 'white', type: 'rook' });
    p.castling.whiteKingside = false;
    const m = generatePseudoLegalMoves(p, makeSquare(4, 0));
    expect(m.find(x => x.castle === 'kingside')).toBeUndefined();
  });
});

describe('generatePseudoLegalMoves — en passant', () => {
  it('en passant capture available when target set', () => {
    const p = emptyPos();
    place(p, 4, 4, { color: 'white', type: 'pawn' });
    place(p, 5, 4, { color: 'black', type: 'pawn' });
    p.enPassantTarget = makeSquare(5, 5);
    const m = generatePseudoLegalMoves(p, makeSquare(4, 4));
    const ep = m.find(x => x.enPassant);
    expect(ep).toBeDefined();
    expect(ep?.to).toBe(makeSquare(5, 5));
    expect(ep?.capture).toBe('pawn');
  });
  it('no en passant when target null', () => {
    const p = emptyPos();
    place(p, 4, 4, { color: 'white', type: 'pawn' });
    place(p, 5, 4, { color: 'black', type: 'pawn' });
    p.enPassantTarget = null;
    const m = generatePseudoLegalMoves(p, makeSquare(4, 4));
    expect(m.find(x => x.enPassant)).toBeUndefined();
  });
});

describe('generatePseudoLegalMoves — promotion', () => {
  it('white pawn reaching rank 8 expands to 4 promotion moves', () => {
    const p = emptyPos();
    place(p, 4, 6, { color: 'white', type: 'pawn' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 6));
    const promotes = m.filter(x => x.promotion !== undefined);
    expect(promotes).toHaveLength(4);
    expect(new Set(promotes.map(x => x.promotion))).toEqual(new Set(['queen', 'rook', 'bishop', 'knight']));
  });
  it('promotion via capture also expands', () => {
    const p = emptyPos();
    place(p, 4, 6, { color: 'white', type: 'pawn' });
    place(p, 5, 7, { color: 'black', type: 'rook' });
    const m = generatePseudoLegalMoves(p, makeSquare(4, 6));
    const captures = m.filter(x => x.to === makeSquare(5, 7));
    expect(captures).toHaveLength(4);
    expect(captures.every(x => x.capture === 'rook')).toBe(true);
  });
});
