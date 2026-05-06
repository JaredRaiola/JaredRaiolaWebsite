import type { Cell as CellState } from '../engine';
import { CellSpriteSvg, type CellSprite } from '../sprites';

function spriteFor(c: CellState, gameOver: boolean): CellSprite {
  if (c.revealed) {
    if (c.mine) return c.exploded ? 'mineExploded' : 'mine';
    if (c.adjacent === 0) return 'empty';
    return c.adjacent as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  }
  if (c.mark === 'flag') {
    // Once the game is lost, expose wrong flags as crossed-out mines.
    if (gameOver && !c.mine) return 'mineWrong';
    return 'flag';
  }
  if (c.mark === 'question') return 'question';
  // After loss, reveal hidden mines.
  if (gameOver && c.mine) return 'mine';
  return 'covered';
}

type Props = {
  cell: CellState;
  gameOver: boolean;
  pressed: boolean;
};

export function Cell({ cell, gameOver, pressed }: Props) {
  const sprite = spriteFor(cell, gameOver);
  const cls = ['ms-cell'];
  if (cell.revealed || sprite !== 'covered' || pressed) cls.push('ms-cell-flat');
  else cls.push('ms-cell-raised');
  return <div className={cls.join(' ')}><CellSpriteSvg state={sprite} /></div>;
}
