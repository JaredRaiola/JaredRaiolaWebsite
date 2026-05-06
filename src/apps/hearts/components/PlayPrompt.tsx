import type { PlayerId } from '../engine';

const NAMES: Record<PlayerId, string> = { 0: 'You', 1: 'Jared', 2: 'Meatball', 3: 'John' };

type Props = { turn: PlayerId | null; heartsBroken: boolean };

export default function PlayPrompt({ turn, heartsBroken }: Props): React.ReactElement {
  const text =
    turn === 0 ? 'Your turn'
    : turn !== null ? `${NAMES[turn]}'s turn...`
    : 'Resolving trick...';
  return (
    <div className="hearts-status">
      <span>{text}</span>
      {heartsBroken && <span className="hearts-broken-flag">Hearts broken</span>}
    </div>
  );
}
