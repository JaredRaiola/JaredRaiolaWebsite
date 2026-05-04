import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'cmd',
  displayName: 'Command Prompt',
  icon: '/assets/win98/png/console_prompt-0.png',
  defaultSize: { width: 640, height: 400 },
  minSize: { width: 320, height: 200 },
  component: () => import('./index'),
};

export default meta;
