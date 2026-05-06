import { useDialogDrag } from '@/lib/useDialogDrag';
import type { GameState } from '../engine';

type Props = {
  state: GameState;
  onNewGame: () => void;
  onClose: () => void;
};

export default function OutcomeDialog({ state, onNewGame, onClose }: Props): React.ReactElement {
  const drag = useDialogDrag();
  let title = '';
  let body = '';
  if (state.phase === 'checkmate') {
    const winner = state.position.toMove === 'white' ? 'Black' : 'White';
    const youWon = state.position.toMove !== state.playerColor;
    title = youWon ? 'Checkmate — Victory' : 'Checkmate';
    body = `${winner} wins by checkmate.`;
  } else if (state.phase === 'stalemate') {
    title = 'Stalemate'; body = 'Draw by stalemate.';
  } else if (state.phase === 'draw') {
    title = 'Draw';
    body = state.drawReason === 'fifty-move' ? 'Draw by the fifty-move rule.'
         : state.drawReason === 'threefold' ? 'Draw by threefold repetition.'
         : state.drawReason === 'insufficient-material' ? 'Draw — insufficient material.'
         : 'Draw.';
  } else if (state.phase === 'resigned') {
    title = 'Resigned'; body = 'You resigned.';
  }
  return (
    <div className="ch-dialog-overlay">
      <div className="ch-dialog window" style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">{title}</div></div>
        <div className="window-body ch-dialog-body"><p>{body}</p></div>
        <div className="ch-dialog-buttons">
          <button onClick={onNewGame}>New Game</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
