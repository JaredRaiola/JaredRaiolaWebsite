import type { BestTimes } from '../scores';

type Props = {
  times: BestTimes;
  onReset(): void;
  onClose(): void;
};

export function BestTimesDialog({ times, onReset, onClose }: Props) {
  const row = (label: string, rec: BestTimes[keyof BestTimes]): React.ReactNode => (
    <div className="ms-bt-row">
      <span className="ms-bt-label">{label}</span>
      <span className="ms-bt-time">{rec ? `${rec.seconds} seconds` : '—'}</span>
      <span className="ms-bt-name">{rec ? rec.name : 'Anonymous'}</span>
    </div>
  );
  return (
    <div className="ms-dialog-backdrop">
      <div className="ms-dialog ms-bt-dialog">
        <div className="ms-dialog-title">Fastest Mine Sweepers</div>
        <div className="ms-dialog-body">
          {row('Beginner:', times.beginner)}
          {row('Intermediate:', times.intermediate)}
          {row('Expert:', times.expert)}
        </div>
        <div className="ms-dialog-buttons">
          <button onClick={onReset}>Reset Scores</button>
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
