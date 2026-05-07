import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'freecell',
  displayName: 'FreeCell',
  icon: '/assets/win98/png/game_freecell-0.png',
  defaultSize: { width: 720, height: 600 },
  minSize: { width: 720, height: 600 },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: false,
  component: () => import('./index'),
};

export default meta;
