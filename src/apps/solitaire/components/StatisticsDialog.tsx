import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadVegasBalance } from '../options';
import { loadBestTime } from '../bestTimes';

type Props = { onClose: () => void };

export default function StatisticsDialog({ onClose }: Props): React.ReactElement {
  const balance = loadVegasBalance();
  const best = loadBestTime();
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
    <div className="sol-dialog-overlay" onClick={onClose}>
      <div className="sol-dialog window" style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div
          className="title-bar"
          style={{ cursor: 'move', touchAction: 'none' }}
          onPointerDown={onTitleDown}
          onPointerMove={onTitleMove}
          onPointerUp={onTitleUp}
        >
          <div className="title-bar-text">Statistics</div>
        </div>
        <div className="window-body sol-dialog-body">
          <p>Vegas running balance: ${balance}</p>
          <p>Best time (Standard, timed): {best ? `${best.seconds}s — ${best.name}` : 'None'}</p>
        </div>
        <div className="sol-dialog-buttons">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
