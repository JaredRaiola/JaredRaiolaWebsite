import {
  generateLegalMoves, makeMove, isCheckmate, opposite,
  type Position, type Move, type PieceType, type Color, type Difficulty,
} from './engine';

const PIECE_VALUE: Record<PieceType, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000,
};

const PAWN_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10,-20,-20, 10, 10,  5,
   5, -5,-10,  0,  0,-10, -5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5,  5, 10, 25, 25, 10,  5,  5,
  10, 10, 20, 30, 30, 20, 10, 10,
  50, 50, 50, 50, 50, 50, 50, 50,
   0,  0,  0,  0,  0,  0,  0,  0,
];
const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];
const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];
const ROOK_PST = [
   0,  0,  0,  5,  5,  0,  0,  0,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   5, 10, 10, 10, 10, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];
const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -10,  5,  5,  5,  5,  5,  0,-10,
    0,  0,  5,  5,  5,  5,  0, -5,
   -5,  0,  5,  5,  5,  5,  0, -5,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];
const KING_PST = [
   20, 30, 10,  0,  0, 10, 30, 20,
   20, 20,  0,  0,  0,  0, 20, 20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
];
const PST: Record<PieceType, number[]> = {
  pawn: PAWN_PST, knight: KNIGHT_PST, bishop: BISHOP_PST,
  rook: ROOK_PST, queen: QUEEN_PST, king: KING_PST,
};

export function evaluate(pos: Position): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq];
    if (!p) continue;
    const value = PIECE_VALUE[p.type];
    const pstSq = p.color === 'white' ? sq : 63 - sq;
    const pst = PST[p.type][pstSq];
    score += p.color === 'white' ? (value + pst) : -(value + pst);
  }
  return score;
}

const MATE_SCORE = 100000;

function moveOrder(moves: Move[]): Move[] {
  const captures: Array<{ m: Move; key: number }> = [];
  const quiets: Move[] = [];
  for (const m of moves) {
    if (m.capture) {
      captures.push({ m, key: PIECE_VALUE[m.capture] });
    } else {
      quiets.push(m);
    }
  }
  captures.sort((a, b) => b.key - a.key);
  return [...captures.map(x => x.m), ...quiets];
}

function quiescence(pos: Position, alpha: number, beta: number, color: Color, depthLimit: number): number {
  const standPat = color === 'white' ? evaluate(pos) : -evaluate(pos);
  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;
  if (depthLimit === 0) return alpha;
  const moves = generateLegalMoves(pos).filter(m => m.capture);
  for (const m of moveOrder(moves)) {
    const next = makeMove(pos, m);
    const score = -quiescence(next, -beta, -alpha, opposite(color), depthLimit - 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(pos: Position, depth: number, alpha: number, beta: number, color: Color, useQ: boolean): number {
  if (depth === 0) {
    return useQ ? quiescence(pos, alpha, beta, color, 6) : (color === 'white' ? evaluate(pos) : -evaluate(pos));
  }
  const moves = generateLegalMoves(pos);
  if (moves.length === 0) {
    if (isCheckmate(pos)) return -MATE_SCORE + (10 - depth);
    return 0; // stalemate
  }
  let best = -Infinity;
  for (const m of moveOrder(moves)) {
    const next = makeMove(pos, m);
    const score = -negamax(next, depth - 1, -beta, -alpha, opposite(color), useQ);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function searchBestMove(pos: Position, depth: number, useQ: boolean): { move: Move; score: number; ties: Move[] } {
  const moves = generateLegalMoves(pos);
  if (moves.length === 0) throw new Error('chooseAiMove: no legal moves');
  let bestScore = -Infinity;
  let ties: Move[] = [];
  const color = pos.toMove;
  for (const m of moveOrder(moves)) {
    const next = makeMove(pos, m);
    const score = -negamax(next, depth - 1, -Infinity, Infinity, opposite(color), useQ);
    if (score > bestScore) {
      bestScore = score;
      ties = [m];
    } else if (score === bestScore) {
      ties.push(m);
    }
  }
  return { move: ties[0], score: bestScore, ties };
}

function seededIndex(pos: Position, n: number): number {
  const seed = pos.fullmoveNumber * 31 + pos.halfmoveClock + (pos.toMove === 'white' ? 1 : 0);
  return Math.abs(seed) % n;
}

export function chooseAiMove(pos: Position, difficulty: Difficulty): Move {
  const depth = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 3 : 4;
  const useQ = difficulty === 'advanced';
  const { ties } = searchBestMove(pos, depth, useQ);
  if (difficulty === 'beginner' && ties.length > 1) {
    return ties[seededIndex(pos, ties.length)];
  }
  return ties[0];
}
