import { createPortal } from 'react-dom';
import { loadVegasBalance } from '../options';
import { loadBestTime } from '../bestTimes';

type Props = { onClose: () => void };

export default function StatisticsDialog({ onClose }: Props): React.ReactElement {
  const balance = loadVegasBalance();
  const best = loadBestTime();
  return createPortal(
    <div className="sol-dialog-overlay" onClick={onClose}>
      <div className="sol-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Statistics</div></div>
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
