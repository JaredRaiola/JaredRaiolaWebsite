import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'doom',
  displayName: 'DOOM',
  icon: '/assets/win98/svg/doom.svg',
  defaultSize: { width: 720, height: 540 },
  minSize: { width: 480, height: 360 },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: true,
  component: () => import('./index'),
};

export default meta;
