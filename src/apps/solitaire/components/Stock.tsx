import { isRecycleExhausted, type Card as CardModel, type Options } from '../engine';
import Pile from './Pile';
import CardBackSvg from '../cards/CardBackSvg';

type Props = {
  cards: CardModel[];
  recyclesUsed: number;
  options: Options;
  onClick: () => void;
};

export default function Stock({ cards, recyclesUsed, options, onClick }: Props): React.ReactElement {
  const empty = cards.length === 0;
  const exhausted = empty && isRecycleExhausted(options, recyclesUsed);
  return (
    <Pile className="sol-stock" onClick={onClick}>
      {!empty && <CardBackSvg />}
      {empty && !exhausted && <div className="sol-stock-recycle">↻</div>}
      {exhausted && <div className="sol-stock-no-recycle">⊘</div>}
    </Pile>
  );
}
