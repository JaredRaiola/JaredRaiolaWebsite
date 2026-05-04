import { useShallow } from 'zustand/react/shallow';
import { useWindowStore } from '@/stores/windowStore';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useHotkeys } from '@/lib/useHotkeys';
import { Desktop } from './Desktop';
import { Taskbar } from './Taskbar';
import { Window } from './Window';
import { StartMenu } from './StartMenu';
import { RunDialog } from './RunDialog';
import { ContextMenu } from './ContextMenu';
import { SystemDialogHost } from './SystemDialog';
import { RestoreConflictDialogHost } from './RestoreConflictDialog';

export function Shell() {
  const windows = useWindowStore(useShallow((s) => Object.values(s.windows)));
  const focusedId = useWindowStore((s) => s.focusedId);
  const close = useWindowStore((s) => s.close);
  const focus = useWindowStore((s) => s.focus);
  const toggleStartMenu = useTaskbarStore((s) => s.toggleStartMenu);
  const closeStartMenu = useTaskbarStore((s) => s.closeStartMenu);
  const closeRunDialog = useTaskbarStore((s) => s.closeRunDialog);
  const closeCtx = useContextMenuStore((s) => s.close);

  useHotkeys(
    {
      // Open Start menu (Win95: Ctrl+Esc; we also accept Meta key)
      'ctrl+esc': () => toggleStartMenu(),
      'meta+esc': () => toggleStartMenu(),
      // Close currently focused window
      'alt+f4': () => {
        if (focusedId) close(focusedId);
      },
      // Cycle windows forward
      'alt+tab': () => {
        const visible = windows
          .filter((w) => w.state !== 'minimized')
          .sort((a, b) => a.zIndex - b.zIndex);
        if (visible.length < 2) return;
        const i = visible.findIndex((w) => w.id === focusedId);
        const next = visible[(i + 1) % visible.length];
        focus(next.id);
      },
      // Close menus / popups
      esc: () => {
        closeStartMenu();
        closeRunDialog();
        closeCtx();
      },
    },
    { ignoreInInputs: false },
  );

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
      <SystemDialogHost />
      <RestoreConflictDialogHost />
    </>
  );
}
