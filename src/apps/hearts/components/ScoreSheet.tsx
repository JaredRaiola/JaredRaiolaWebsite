import { useRef, useState } from 'react';
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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onTitleDown = (e: React.PointerEvent): void => {
    const dialog = (e.currentTarget as HTMLElement).parentElement!;
    const rect = dialog.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
    setPos({ x: rect.left, y: rect.top });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onTitleMove = (e: React.PointerEvent): void => {
    const d = dragRef.current;
    if (!d) return;
    setPos({ x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) });
  };
  const onTitleUp = (e: React.PointerEvent): void => {
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const dialogStyle: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, margin: 0 }
    : {};

  return createPortal(
    <div className="hearts-dialog-overlay">
      <div className="hearts-dialog hearts-scoresheet-dialog window" style={dialogStyle}>
        <div
          className="title-bar"
          style={{ cursor: 'move', touchAction: 'none' }}
          onPointerDown={onTitleDown}
          onPointerMove={onTitleMove}
          onPointerUp={onTitleUp}
        >
          <div className="title-bar-text">Hand Score</div>
        </div>
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
