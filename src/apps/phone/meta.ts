import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'phone',
  displayName: 'Phone Dialer',
  icon: '/assets/win98/png/application_hourglass-0.png',
  defaultSize: { width: 360, height: 480 },
  minSize: { width: 360, height: 480 },
  singleInstance: true,
  menuPath: ['Programs', 'Accessories'],
  resizable: false,
  component: () => import('./index'),
};

export default meta;
