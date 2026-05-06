import { createPortal } from 'react-dom';
import { loadStats } from '../scores';

type Props = { onClose: () => void };

export default function StatisticsDialog({ onClose }: Props): React.ReactElement {
  const stats = loadStats();
  const total = stats.wins + stats.losses;
  const pct = total === 0 ? 0 : Math.round((stats.wins / total) * 100);
  return createPortal(
    <div className="fc-dialog-overlay" onClick={onClose}>
      <div className="fc-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Statistics</div></div>
        <div className="window-body fc-dialog-body">
          <p>Wins: {stats.wins}</p>
          <p>Losses: {stats.losses}</p>
          <p>Win %: {pct}%</p>
          <p>Current streak: {stats.streak}</p>
          <p>Best streak: {stats.bestStreak}</p>
        </div>
        <div className="fc-dialog-buttons">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
