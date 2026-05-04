import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'controlpanel',
  displayName: 'Control Panel',
  icon: '/assets/win98/png/settings_gear-0.png',
  defaultSize: { width: 480, height: 460 },
  minSize: { width: 480, height: 460 },
  singleInstance: true,
  component: () => import('./index'),
};

export default meta;
