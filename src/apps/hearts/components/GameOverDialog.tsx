import { useDialogDrag } from '@/lib/useDialogDrag';
import type { PlayerId } from '../engine';

const NAMES: Record<PlayerId, string> = { 0: 'You', 1: 'Jared', 2: 'Meatball', 3: 'John' };

type Props = {
  scores: Record<PlayerId, number>;
  onNewGame: () => void;
  onClose: () => void;
};

export default function GameOverDialog({ scores, onNewGame, onClose }: Props): React.ReactElement {
  const drag = useDialogDrag();
  const winner = ([0, 1, 2, 3] as PlayerId[]).reduce(
    (best, p) => scores[p] < scores[best] ? p : best,
    0 as PlayerId,
  );
  return (
    <div className="hearts-dialog-overlay">
      <div className="hearts-dialog window" style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">Game Over</div></div>
        <div className="window-body hearts-scoresheet">
          <p className="moon-banner">{NAMES[winner]} {winner === 0 ? 'won' : 'wins'}!</p>
          <table>
            <thead>
              <tr><th>Player</th><th>Total</th></tr>
            </thead>
            <tbody>
              {([0, 1, 2, 3] as PlayerId[]).map((p) => (
                <tr key={p}>
                  <td>{NAMES[p]}</td>
                  <td>{scores[p]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hearts-dialog-buttons">
          <button onClick={onNewGame}>New Game</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
