import type { Card as CardModel, Options } from '../engine';
import Pile from './Pile';
import CardBackSvg from '../cards/CardBackSvg';

type Props = {
  cards: CardModel[];
  recyclesUsed: number;
  options: Options;
  onClick: () => void;
};

function recycleExhausted(options: Options, recyclesUsed: number): boolean {
  if (options.scoring !== 'vegas') return false;
  return options.draw === 1 ? recyclesUsed >= 1 : recyclesUsed >= 3;
}

export default function Stock({ cards, recyclesUsed, options, onClick }: Props): React.ReactElement {
  const empty = cards.length === 0;
  const exhausted = empty && recycleExhausted(options, recyclesUsed);
  const handle = (): void => {
    // eslint-disable-next-line no-console
    console.log('[solitaire/stock-click]', { stockLength: cards.length, exhausted });
    onClick();
  };
  return (
    <Pile className="sol-stock" onClick={handle}>
      {!empty && <CardBackSvg />}
      {empty && !exhausted && <div className="sol-stock-recycle">↻</div>}
      {exhausted && <div className="sol-stock-no-recycle">⊘</div>}
    </Pile>
  );
}
