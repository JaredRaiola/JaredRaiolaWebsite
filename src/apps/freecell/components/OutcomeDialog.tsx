import { useDialogDrag } from '@/lib/useDialogDrag';

type Props = {
  outcome: 'won' | 'lost';
  gameNumber: number;
  moveCount: number;
  onNewGame: () => void;
  onClose: () => void;
};

export default function OutcomeDialog({ outcome, gameNumber, moveCount, onNewGame, onClose }: Props): React.ReactElement {
  const drag = useDialogDrag();
  return (
    <div className="fc-dialog-overlay">
      <div className="fc-dialog window" style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">{outcome === 'won' ? 'Congratulations' : 'Game Over'}</div></div>
        <div className="window-body fc-dialog-body">
          {outcome === 'won' ? (
            <p>You won game #{gameNumber} in {moveCount} moves.</p>
          ) : (
            <p>No legal moves remain in game #{gameNumber}.</p>
          )}
        </div>
        <div className="fc-dialog-buttons">
          <button onClick={onNewGame}>New Game</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
