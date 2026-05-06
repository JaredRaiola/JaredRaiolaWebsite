import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'notepad',
  displayName: 'Notepad',
  icon: '/assets/win98/png/notepad-0.png',
  defaultSize: { width: 480, height: 360 },
  minSize: { width: 240, height: 160 },
  fileAssociations: ['.txt'],
  menuPath: ['Programs', 'Accessories'],
  component: () => import('./index'),
};

export default meta;
