import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'chess',
  displayName: 'Chess',
  icon: '/assets/win98/png/executable-0.png',
  defaultSize: { width: 480, height: 560 },
  minSize: { width: 480, height: 560 },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: false,
  component: () => import('./index'),
};

export default meta;
