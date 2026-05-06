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
