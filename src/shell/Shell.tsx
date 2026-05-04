import { useShallow } from 'zustand/react/shallow';
import { useWindowStore } from '@/stores/windowStore';
import { Desktop } from './Desktop';
import { Taskbar } from './Taskbar';
import { Window } from './Window';
import { StartMenu } from './StartMenu';
import { RunDialog } from './RunDialog';
import { ContextMenu } from './ContextMenu';

export function Shell() {
  const windows = useWindowStore(useShallow((s) => Object.values(s.windows)));
  return (
    <>
      <Desktop />
      {windows.map((w) => (
        <Window key={w.id} window={w} />
      ))}
      <Taskbar />
      <StartMenu />
      <RunDialog />
      <ContextMenu />
    </>
  );
}
