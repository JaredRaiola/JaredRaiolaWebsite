import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'paint',
  displayName: 'Paint',
  icon: '/assets/win98/png/paint_old-0.png',
  defaultSize: { width: 600, height: 480 },
  minSize: { width: 480, height: 360 },
  fileAssociations: ['.png'],
  menuPath: ['Programs', 'Accessories'],
  component: () => import('./index'),
};

export default meta;
