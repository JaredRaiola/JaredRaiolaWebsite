import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'calculator',
  displayName: 'Calculator',
  icon: '/assets/win98/png/calculator-0.png',
  defaultSize: { width: 580, height: 340 },
  minSize: { width: 290, height: 340 },
  singleInstance: true,
  menuPath: ['Programs', 'Accessories'],
  component: () => import('./index'),
};

export default meta;
