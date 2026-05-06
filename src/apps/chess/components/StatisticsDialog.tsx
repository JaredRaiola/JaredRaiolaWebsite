import { useDialogDrag } from '@/lib/useDialogDrag';
import { loadStats } from '../scores';

type Props = { onClose: () => void };

export default function StatisticsDialog({ onClose }: Props): React.ReactElement {
  const drag = useDialogDrag();
  const s = loadStats();
  const decided = s.wins + s.losses;
  const pct = decided === 0 ? 0 : Math.round((s.wins / decided) * 100);
  return (
    <div className="ch-dialog-overlay" onClick={onClose}>
      <div className="ch-dialog window" onClick={(e) => e.stopPropagation()} style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">Statistics</div></div>
        <div className="window-body ch-dialog-body">
          <p>Wins: {s.wins}</p>
          <p>Losses: {s.losses}</p>
          <p>Draws: {s.draws}</p>
          <p>Win %: {pct}%</p>
        </div>
        <div className="ch-dialog-buttons"><button onClick={onClose}>OK</button></div>
      </div>
    </div>
  );
}
