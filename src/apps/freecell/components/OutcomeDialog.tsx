import { createPortal } from 'react-dom';

type Props = {
  outcome: 'won' | 'lost';
  gameNumber: number;
  moveCount: number;
  onNewGame: () => void;
  onClose: () => void;
};

export default function OutcomeDialog({ outcome, gameNumber, moveCount, onNewGame, onClose }: Props): React.ReactElement {
  return createPortal(
    <div className="fc-dialog-overlay">
      <div className="fc-dialog window">
        <div className="title-bar"><div className="title-bar-text">{outcome === 'won' ? 'Congratulations' : 'Game Over'}</div></div>
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
    </div>,
    document.body,
  );
}
