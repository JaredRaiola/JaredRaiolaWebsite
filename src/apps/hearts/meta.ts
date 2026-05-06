import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'hearts',
  displayName: 'Hearts',
  icon: '/assets/win98/png/game_hearts.png',
  defaultSize: { width: 700, height: 600 },
  minSize: { width: 700, height: 600 },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: false,
  component: () => import('./index'),
};

export default meta;
