import { useDialogDrag } from '@/lib/useDialogDrag';

type Props = {
  elapsedSec: number;
  difficulty: string;
  onNewGame: () => void;
  onClose: () => void;
};

export default function WinDialog({ elapsedSec, difficulty, onNewGame, onClose }: Props): React.ReactElement {
  const drag = useDialogDrag();
  return (
    <div className="ms-dialog-backdrop">
      <div className="ms-dialog" style={{ transform: drag.transform }}>
        <div className="ms-dialog-title" onPointerDown={drag.onPointerDown}>You won!</div>
        <div className="ms-dialog-body">
          <p>You cleared the board.</p>
          <p>Difficulty: {difficulty}</p>
          <p>Time: {elapsedSec} second{elapsedSec === 1 ? '' : 's'}</p>
        </div>
        <div className="ms-dialog-buttons">
          <button onClick={onNewGame}>New Game</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
