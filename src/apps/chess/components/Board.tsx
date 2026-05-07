import type { GameState, Square as Sq } from '../engine';
import { generateLegalMoves, isCheck } from '../engine';
import SquareView from './Square';

type Props = {
  state: GameState;
  onSquarePointerDown: (sq: Sq, e: React.PointerEvent) => void;
  onSquareClick: (sq: Sq, e: React.MouseEvent) => void;
};

function findKingSquare(state: GameState): Sq {
  for (let sq = 0; sq < 64; sq++) {
    const p = state.position.board[sq];
    if (p && p.type === 'king' && p.color === state.position.toMove) return sq;
  }
  return -1;
}

export default function Board({ state, onSquarePointerDown, onSquareClick }: Props): React.ReactElement {
  const flipped = state.playerColor === 'black';
  const last = state.history[state.history.length - 1]?.move ?? null;
  const showCheck = (state.phase === 'playing' || state.phase === 'thinking' || state.phase === 'checkmate') && isCheck(state.position, state.position.toMove);
  const checkedKingSq = showCheck ? findKingSquare(state) : -1;

  const ranks = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const files = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  const legalCaptureSet = new Set<number>();
  if (state.selectedSquare !== null) {
    const lm = generateLegalMoves(state.position, state.selectedSquare);
    for (const m of lm) if (m.capture || m.enPassant) legalCaptureSet.add(m.to);
  }

  return (
    <div className="ch-board">
      {ranks.map((r) => (
        <div key={r} className="ch-board-row">
          <div className="ch-rank-label">{r + 1}</div>
          {files.map((f) => {
            const sq = r * 8 + f;
            const piece = state.position.board[sq];
            const light = (f + r) % 2 === 1;
            return (
              <SquareView
                key={sq}
                square={sq}
                piece={piece}
                light={light}
                selected={state.selectedSquare === sq}
                legalDest={state.legalDestinations.includes(sq)}
                legalCapture={legalCaptureSet.has(sq)}
                lastMove={last !== null && (last.from === sq || last.to === sq)}
                inCheck={checkedKingSq === sq}
                onPointerDown={(e) => onSquarePointerDown(sq, e)}
                onClick={(e) => onSquareClick(sq, e)}
              />
            );
          })}
        </div>
      ))}
      <div className="ch-file-labels">
        <div className="ch-rank-label" />
        {files.map(f => <div key={f} className="ch-file-label">{String.fromCharCode(97 + f)}</div>)}
      </div>
    </div>
  );
}
