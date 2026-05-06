import { createPortal } from 'react-dom';

type Props = {
  score: number;
  elapsedSec: number;
  showScore: boolean;
  showTime: boolean;
  onNewGame: () => void;
  onClose: () => void;
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function WinDialog({ score, elapsedSec, showScore, showTime, onNewGame, onClose }: Props): React.ReactElement {
  return createPortal(
    <div className="sol-dialog-overlay">
      <div className="sol-dialog window">
        <div className="title-bar"><div className="title-bar-text">You won!</div></div>
        <div className="window-body sol-dialog-body">
          <p>Congratulations — all 52 cards are home.</p>
          {showTime && <p>Time: {fmtTime(elapsedSec)}</p>}
          {showScore && <p>Score: {score}</p>}
        </div>
        <div className="sol-dialog-buttons">
          <button onClick={onNewGame}>New Game</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
