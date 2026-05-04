import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'calculator',
  displayName: 'Calculator',
  icon: '/assets/win98/png/calculator-0.png',
  defaultSize: { width: 240, height: 320 },
  minSize: { width: 240, height: 320 },
  singleInstance: true,
  component: () => import('./index'),
};

export default meta;
