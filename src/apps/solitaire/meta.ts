import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'solitaire',
  displayName: 'Solitaire',
  icon: '/assets/win98/png/game_solitaire-0.png',
  defaultSize: { width: 700, height: 600 },
  minSize: { width: 580, height: 480 },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: true,
  component: () => import('./index'),
};

export default meta;
