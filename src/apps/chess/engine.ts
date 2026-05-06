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
  const oneAhead = makeSquare(f, r + dir);
  if (onBoard(f, r + dir) && pos.board[oneAhead] === null) {
    out.push({ from: sq, to: oneAhead });
    if (r === startRank) {
      const twoAhead = makeSquare(f, r + 2 * dir);
      if (pos.board[twoAhead] === null) out.push({ from: sq, to: twoAhead });
    }
  }
  for (const df of [-1, 1]) {
    const nf = f + df;
    const nr = r + dir;
    if (!onBoard(nf, nr)) continue;
    const target = pos.board[makeSquare(nf, nr)];
    if (target && target.color !== piece.color) {
      out.push({ from: sq, to: makeSquare(nf, nr), capture: target.type });
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
    case 'king': leaperMoves(pos, square, piece, KING_OFFSETS, out); break;
    case 'bishop': sliderMoves(pos, square, piece, BISHOP_DIRS, out); break;
    case 'rook': sliderMoves(pos, square, piece, ROOK_DIRS, out); break;
    case 'queen': sliderMoves(pos, square, piece, [...BISHOP_DIRS, ...ROOK_DIRS], out); break;
  }
  return out;
}
