import { createPortal } from 'react-dom';
import type { Card, PlayerId } from '../engine';
import { applyHandScores, shotTheMoon } from '../engine';

const NAMES: Record<PlayerId, string> = { 0: 'You', 1: 'Jared', 2: 'Meatball', 3: 'John' };

type Props = {
  scoresBefore: Record<PlayerId, number>;
  taken: Record<PlayerId, Card[]>;
  onContinue: () => void;
};

export default function ScoreSheet({ scoresBefore, taken, onContinue }: Props): React.ReactElement {
  const after = applyHandScores(scoresBefore, taken);
  const shooter = ([0, 1, 2, 3] as PlayerId[]).find((p) => shotTheMoon(taken[p])) ?? null;
  return createPortal(
    <div className="hearts-dialog-overlay" onClick={onContinue}>
      <div className="hearts-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Hand Score</div></div>
        <div className="window-body hearts-scoresheet">
          {shooter !== null && (
            <p className="moon-banner">{NAMES[shooter]} shot the moon!</p>
          )}
          <table>
            <thead>
              <tr><th>Player</th><th>Hand</th><th>Total</th></tr>
            </thead>
            <tbody>
              {([0, 1, 2, 3] as PlayerId[]).map((p) => (
                <tr key={p}>
                  <td>{NAMES[p]}</td>
                  <td>{after[p] - scoresBefore[p]}</td>
                  <td>{after[p]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hearts-dialog-buttons">
          <button onClick={onContinue}>OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
