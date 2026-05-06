export type Color = 'white' | 'black';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Piece = { color: Color; type: PieceType };
export type Square = number;

export type CastlingRights = {
  whiteKingside: boolean; whiteQueenside: boolean;
  blackKingside: boolean; blackQueenside: boolean;
};

export type PromotionType = 'queen' | 'rook' | 'bishop' | 'knight';

export type Move = {
  from: Square;
  to: Square;
  promotion?: PromotionType;
  capture?: PieceType;
  castle?: 'kingside' | 'queenside';
  enPassant?: boolean;
};

export type Position = {
  board: (Piece | null)[];
  toMove: Color;
  castling: CastlingRights;
  enPassantTarget: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
};

export type Phase = 'playing' | 'thinking' | 'promoting' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';

export type DrawReason = 'fifty-move' | 'threefold' | 'stalemate' | 'insufficient-material' | null;

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export function fileOf(sq: Square): number { return sq & 7; }
export function rankOf(sq: Square): number { return sq >> 3; }
export function makeSquare(file: number, rank: number): Square { return rank * 8 + file; }
export function onBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}
export function opposite(c: Color): Color { return c === 'white' ? 'black' : 'white'; }

const BACK_RANK: PieceType[] = ['rook','knight','bishop','queen','king','bishop','knight','rook'];

export function initialPosition(): Position {
  const board: (Piece | null)[] = new Array(64).fill(null);
  for (let f = 0; f < 8; f++) {
    board[makeSquare(f, 0)] = { color: 'white', type: BACK_RANK[f] };
    board[makeSquare(f, 1)] = { color: 'white', type: 'pawn' };
    board[makeSquare(f, 6)] = { color: 'black', type: 'pawn' };
    board[makeSquare(f, 7)] = { color: 'black', type: BACK_RANK[f] };
  }
  return {
    board,
    toMove: 'white',
    castling: { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}

const KNIGHT_OFFSETS: Array<[number, number]> = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const KING_OFFSETS: Array<[number, number]> = [
  [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];
const BISHOP_DIRS: Array<[number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ROOK_DIRS: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function pawnMoves(pos: Position, sq: Square, piece: Piece, out: Move[]): void {
  const f = fileOf(sq);
  const r = rankOf(sq);
  const dir = piece.color === 'white' ? 1 : -1;
  const startRank = piece.color === 'white' ? 1 : 6;
  const promoteRank = piece.color === 'white' ? 7 : 0;

  const pushPawnMove = (target: Move): void => {
    if (rankOf(target.to) === promoteRank) {
      for (const promo of ['queen','rook','bishop','knight'] as const) {
        out.push({ ...target, promotion: promo });
      }
    } else {
      out.push(target);
    }
  };

  // Single push.
  if (onBoard(f, r + dir)) {
    const oneAhead = makeSquare(f, r + dir);
    if (pos.board[oneAhead] === null) {
      pushPawnMove({ from: sq, to: oneAhead });
      // Two-square push from start rank.
      if (r === startRank) {
        const twoAhead = makeSquare(f, r + 2 * dir);
        if (pos.board[twoAhead] === null) {
          out.push({ from: sq, to: twoAhead });
        }
      }
    }
  }
  // Diagonal captures (incl. en passant).
  for (const df of [-1, 1]) {
    const nf = f + df, nr = r + dir;
    if (!onBoard(nf, nr)) continue;
    const targetSq = makeSquare(nf, nr);
    const target = pos.board[targetSq];
    if (target && target.color !== piece.color) {
      pushPawnMove({ from: sq, to: targetSq, capture: target.type });
    } else if (pos.enPassantTarget === targetSq && target === null) {
      out.push({ from: sq, to: targetSq, enPassant: true, capture: 'pawn' });
    }
  }
}

function castlingMoves(pos: Position, sq: Square, piece: Piece, out: Move[]): void {
  if (piece.type !== 'king') return;
  const r = piece.color === 'white' ? 0 : 7;
  if (sq !== makeSquare(4, r)) return;
  const ks = piece.color === 'white' ? pos.castling.whiteKingside : pos.castling.blackKingside;
  const qs = piece.color === 'white' ? pos.castling.whiteQueenside : pos.castling.blackQueenside;
  if (ks) {
    const f5 = makeSquare(5, r);
    const f6 = makeSquare(6, r);
    const rookSq = makeSquare(7, r);
    const rook = pos.board[rookSq];
    if (pos.board[f5] === null && pos.board[f6] === null && rook && rook.type === 'rook' && rook.color === piece.color) {
      out.push({ from: sq, to: f6, castle: 'kingside' });
    }
  }
  if (qs) {
    const f1 = makeSquare(1, r);
    const f2 = makeSquare(2, r);
    const f3 = makeSquare(3, r);
    const rookSq = makeSquare(0, r);
    const rook = pos.board[rookSq];
    if (pos.board[f1] === null && pos.board[f2] === null && pos.board[f3] === null && rook && rook.type === 'rook' && rook.color === piece.color) {
      out.push({ from: sq, to: f2, castle: 'queenside' });
    }
  }
}

function leaperMoves(pos: Position, sq: Square, piece: Piece, offsets: Array<[number, number]>, out: Move[]): void {
  const f = fileOf(sq);
  const r = rankOf(sq);
  for (const [df, dr] of offsets) {
    const nf = f + df, nr = r + dr;
    if (!onBoard(nf, nr)) continue;
    const target = pos.board[makeSquare(nf, nr)];
    if (target === null) {
      out.push({ from: sq, to: makeSquare(nf, nr) });
    } else if (target.color !== piece.color) {
      out.push({ from: sq, to: makeSquare(nf, nr), capture: target.type });
    }
  }
}

function sliderMoves(pos: Position, sq: Square, piece: Piece, dirs: Array<[number, number]>, out: Move[]): void {
  const f = fileOf(sq);
  const r = rankOf(sq);
  for (const [df, dr] of dirs) {
    let nf = f + df, nr = r + dr;
    while (onBoard(nf, nr)) {
      const target = pos.board[makeSquare(nf, nr)];
      if (target === null) {
        out.push({ from: sq, to: makeSquare(nf, nr) });
      } else {
        if (target.color !== piece.color) {
          out.push({ from: sq, to: makeSquare(nf, nr), capture: target.type });
        }
        break;
      }
      nf += df; nr += dr;
    }
  }
}

export function generatePseudoLegalMoves(pos: Position, square: Square): Move[] {
  const piece = pos.board[square];
  if (!piece) return [];
  if (piece.color !== pos.toMove) return [];
  const out: Move[] = [];
  switch (piece.type) {
    case 'pawn': pawnMoves(pos, square, piece, out); break;
    case 'knight': leaperMoves(pos, square, piece, KNIGHT_OFFSETS, out); break;
    case 'king':
      leaperMoves(pos, square, piece, KING_OFFSETS, out);
      castlingMoves(pos, square, piece, out);
      break;
    case 'bishop': sliderMoves(pos, square, piece, BISHOP_DIRS, out); break;
    case 'rook': sliderMoves(pos, square, piece, ROOK_DIRS, out); break;
    case 'queen': sliderMoves(pos, square, piece, [...BISHOP_DIRS, ...ROOK_DIRS], out); break;
  }
  return out;
}

function copyBoard(board: (Piece | null)[]): (Piece | null)[] {
  return board.map(p => p ? { ...p } : null);
}

function copyCastling(c: CastlingRights): CastlingRights {
  return { ...c };
}

export function makeMove(pos: Position, move: Move): Position {
  const board = copyBoard(pos.board);
  const piece = board[move.from];
  if (!piece) throw new Error(`makeMove: no piece at ${move.from}`);
  const isPawn = piece.type === 'pawn';
  const isCapture = board[move.to] !== null || move.enPassant === true;

  // Move the piece (or place the promotion piece).
  if (move.promotion) {
    board[move.to] = { color: piece.color, type: move.promotion };
  } else {
    board[move.to] = piece;
  }
  board[move.from] = null;

  // En passant: remove the captured pawn from its actual square (one rank back).
  if (move.enPassant) {
    const capDir = piece.color === 'white' ? -1 : 1;
    const capSq = makeSquare(fileOf(move.to), rankOf(move.to) + capDir);
    board[capSq] = null;
  }

  // Castling: move the rook to its post-castle square.
  if (move.castle) {
    const r = piece.color === 'white' ? 0 : 7;
    if (move.castle === 'kingside') {
      board[makeSquare(5, r)] = board[makeSquare(7, r)];
      board[makeSquare(7, r)] = null;
    } else {
      board[makeSquare(3, r)] = board[makeSquare(0, r)];
      board[makeSquare(0, r)] = null;
    }
  }

  // Castling rights updates.
  const castling = copyCastling(pos.castling);
  if (piece.type === 'king') {
    if (piece.color === 'white') { castling.whiteKingside = false; castling.whiteQueenside = false; }
    else { castling.blackKingside = false; castling.blackQueenside = false; }
  }
  if (piece.type === 'rook') {
    if (piece.color === 'white' && move.from === makeSquare(0, 0)) castling.whiteQueenside = false;
    if (piece.color === 'white' && move.from === makeSquare(7, 0)) castling.whiteKingside = false;
    if (piece.color === 'black' && move.from === makeSquare(0, 7)) castling.blackQueenside = false;
    if (piece.color === 'black' && move.from === makeSquare(7, 7)) castling.blackKingside = false;
  }
  // Captured rook removes the corresponding right.
  if (move.to === makeSquare(0, 0)) castling.whiteQueenside = false;
  if (move.to === makeSquare(7, 0)) castling.whiteKingside = false;
  if (move.to === makeSquare(0, 7)) castling.blackQueenside = false;
  if (move.to === makeSquare(7, 7)) castling.blackKingside = false;

  // En passant target: only set after a two-square pawn advance.
  let enPassantTarget: Square | null = null;
  if (isPawn && Math.abs(rankOf(move.to) - rankOf(move.from)) === 2) {
    const between = (rankOf(move.from) + rankOf(move.to)) / 2;
    enPassantTarget = makeSquare(fileOf(move.from), between);
  }

  // Half-move clock.
  const halfmoveClock = (isPawn || isCapture) ? 0 : pos.halfmoveClock + 1;

  // Full-move number.
  const fullmoveNumber = pos.toMove === 'black' ? pos.fullmoveNumber + 1 : pos.fullmoveNumber;

  return {
    board,
    toMove: opposite(pos.toMove),
    castling,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
  };
}
