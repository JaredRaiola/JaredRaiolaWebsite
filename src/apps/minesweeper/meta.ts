import type { AppDef } from '@/core/apps/registry';
import { computeWindowSize } from './difficulties';

const beginner = computeWindowSize(9, 9);

const meta: AppDef = {
  id: 'minesweeper',
  displayName: 'Minesweeper',
  icon: '/assets/win98/png/game_mine_1-0.png',
  defaultSize: { width: beginner.windowWidth, height: beginner.windowHeight },
  minSize: { width: beginner.windowWidth, height: beginner.windowHeight },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: false,
  component: () => import('./index'),
};

export default meta;
