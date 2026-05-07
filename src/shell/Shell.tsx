import { useShallow } from 'zustand/react/shallow';
import { useWindowStore } from '@/stores/windowStore';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useDesktopStore } from '@/stores/desktopStore';
import { useFsStore } from '@/stores/fsStore';
import { useHotkeys } from '@/lib/useHotkeys';
import { sysConfirm } from '@/lib/dialog';
import { Desktop } from './Desktop';
import { Taskbar } from './Taskbar';
import { Window } from './Window';
import { StartMenu } from './StartMenu';
import { RunDialog } from './RunDialog';
import { ContextMenu } from './ContextMenu';
import { SystemDialogHost } from './SystemDialog';
import { RestoreConflictDialogHost } from './RestoreConflictDialog';
import { PropertiesDialogHost } from './PropertiesDialog';
import { Bsod } from './Bsod';

// Keep in sync with DesktopIcon.tsx's PROTECTED_ICON_IDS.
const PROTECTED_ICON_IDS = new Set([
  'icon-recycle',
  'icon-mycomputer',
  'icon-linkedin',
  'icon-github',
  'icon-resume',
]);

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
      // Permanently delete selected desktop icons (bypasses Recycle Bin)
      'shift+delete': () => {
        const sel = useDesktopStore.getState().selection;
        if (sel.size === 0) return;
        const icons = useDesktopStore.getState().icons;
        const items: { id: string; path: string; label: string }[] = [];
        for (const id of sel) {
          const icon = icons[id];
          if (!icon || icon.target.kind !== 'file') continue;
          if (PROTECTED_ICON_IDS.has(id)) continue;
          items.push({ id, path: icon.target.path, label: icon.label });
        }
        if (items.length === 0) return;
        const msg =
          items.length === 1
            ? `Are you sure you want to permanently delete '${items[0].label}'? This action cannot be undone.`
            : `Are you sure you want to permanently delete these ${items.length} items? This action cannot be undone.`;
        void sysConfirm(msg, { title: 'Confirm File Delete', icon: 'warn' }).then(async (ok) => {
          if (!ok) return;
          const fs = useFsStore.getState().fs;
          if (!fs) return;
          for (const it of items) await fs.unlinkPermanent(it.path);
          useFsStore.getState().bump();
        });
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
      <PropertiesDialogHost />
      <Bsod />
    </>
  );
}
