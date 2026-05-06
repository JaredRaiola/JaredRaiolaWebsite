import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'resume',
  displayName: 'Resume',
  icon: '/assets/win98/png/notepad-0.png',
  defaultSize: { width: 900, height: 700 },
  minSize: { width: 480, height: 360 },
  singleInstance: true,
  menuPath: ['Programs'],
  component: () => import('./index'),
};

export default meta;
