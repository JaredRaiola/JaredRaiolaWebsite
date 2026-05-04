import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'explorer',
  displayName: 'My Computer',
  icon: '/assets/win98/png/computer-0.png',
  defaultSize: { width: 600, height: 420 },
  minSize: { width: 320, height: 200 },
  component: () => import('./index'),
};

export default meta;
