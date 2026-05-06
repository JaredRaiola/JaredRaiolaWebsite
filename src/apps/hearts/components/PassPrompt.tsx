import type { PassDirection } from '../engine';

const DIRECTION_LABEL: Record<PassDirection, string> = {
  left: 'Jared',
  right: 'John',
  across: 'Meatball',
  keep: '(keep — no pass this hand)',
};

type Props = {
  direction: PassDirection;
  selectedCount: number;
  onPass: () => void;
};

export default function PassPrompt({ direction, selectedCount, onPass }: Props): React.ReactElement {
  if (direction === 'keep') {
    return (
      <div className="hearts-status">
        <span>{DIRECTION_LABEL[direction]}</span>
        <button onClick={onPass}>Continue</button>
      </div>
    );
  }
  return (
    <div className="hearts-status">
      <span>Pass 3 cards to {DIRECTION_LABEL[direction]} ({selectedCount}/3 selected)</span>
      <button onClick={onPass} disabled={selectedCount !== 3}>Pass</button>
    </div>
  );
}
