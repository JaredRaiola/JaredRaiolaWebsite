type Props = { score: number; elapsedSec: number; showScore: boolean };

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function StatusBar({ score, elapsedSec, showScore }: Props): React.ReactElement {
  return (
    <div className="sol-status">
      <span className="sol-status-score">{showScore ? `Score: ${score}` : ''}</span>
      <span className="sol-status-time">Time: {fmt(elapsedSec)}</span>
    </div>
  );
}
