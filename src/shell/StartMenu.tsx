import { useEffect, useRef } from 'react';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useWindowStore } from '@/stores/windowStore';
import { listApps, getApp, type AppDef } from '@/core/apps/registry';
import { resetComputer } from '@/core/reset';
import { sysConfirm } from '@/lib/dialog';
import { Flyout, type FlyoutItem } from './Flyout';
import './StartMenu.css';

const PROGRAMS_GROUP_ICON = '/assets/win98/png/file_program_group-0.png';

function buildMenuTree(apps: AppDef[], topLevelLabel: string, launch: (id: string) => void): FlyoutItem[] {
  // Collect apps whose first menuPath segment matches topLevelLabel.
  const inGroup = apps.filter((a) => (a.menuPath ?? ['Programs'])[0] === topLevelLabel);
  // Group by remaining path segments.
  const subgroups = new Map<string, AppDef[]>();
  const direct: AppDef[] = [];
  for (const app of inGroup) {
    const rest = (app.menuPath ?? ['Programs']).slice(1);
    if (rest.length === 0) {
      direct.push(app);
    } else {
      const key = rest[0];
      const list = subgroups.get(key) ?? [];
      list.push(app);
      subgroups.set(key, list);
    }
  }
  const items: FlyoutItem[] = [];
  // Subgroups first, sorted alphabetically.
  for (const groupName of Array.from(subgroups.keys()).sort()) {
    const groupApps = subgroups.get(groupName)!;
    items.push({
      kind: 'submenu',
      label: groupName,
      icon: PROGRAMS_GROUP_ICON,
      items: groupApps.map<FlyoutItem>((a) => ({
        kind: 'action',
        label: a.displayName,
        icon: a.icon,
        onSelect: () => launch(a.id),
      })),
    });
  }
  // Then direct apps, sorted alphabetically.
  for (const app of direct.sort((a, b) => a.displayName.localeCompare(b.displayName))) {
    items.push({ kind: 'action', label: app.displayName, icon: app.icon, onSelect: () => launch(app.id) });
  }
  return items;
}

export function StartMenu() {
  const open = useTaskbarStore((s) => s.startMenuOpen);
  const close = useTaskbarStore((s) => s.closeStartMenu);
  const openRun = useTaskbarStore((s) => s.openRunDialog);
  const openWindow = useWindowStore((s) => s.open);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.start-btn')) return;
      if (!ref.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const launch = (appId: string): void => {
    const app = getApp(appId);
    if (!app) return;
    openWindow(appId, undefined, {
      title: app.displayName,
      icon: app.icon,
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      singleInstance: app.singleInstance,
    });
    close();
  };

  const apps = listApps();
  const programs = buildMenuTree(apps, 'Programs', launch);
  const settings = buildMenuTree(apps, 'Settings', launch);

  const items: FlyoutItem[] = [
    { kind: 'submenu', label: 'Programs', icon: PROGRAMS_GROUP_ICON, items: programs },
    { kind: 'submenu', label: 'Documents', icon: '/assets/win98/png/directory_open_file_mydocs-0.png', items: [], disabled: true },
    { kind: 'submenu', label: 'Settings', icon: '/assets/win98/png/settings_gear-0.png', items: settings, disabled: settings.length === 0 },
    { kind: 'submenu', label: 'Find', icon: '/assets/win98/png/search_file-0.png', items: [], disabled: true },
    { kind: 'action', label: 'Help', icon: '/assets/win98/png/help_book_big-0.png', onSelect: () => {}, disabled: true },
    { kind: 'action', label: 'Run...', icon: '/assets/win98/png/application_hourglass-0.png', onSelect: () => { openRun(); } },
    { kind: 'separator' },
    {
      kind: 'action',
      label: 'Reset Computer...',
      icon: '/assets/win98/png/recycle_bin_empty-0.png',
      onSelect: () => {
        close();
        void sysConfirm(
          'This will erase all files, icons, and settings and restore the original state.\n\nAre you sure?',
          { title: 'Reset Computer', icon: 'warn' },
        ).then((ok) => { if (ok) void resetComputer(); });
      },
    },
    {
      kind: 'action',
      label: 'Shut Down...',
      icon: '/assets/win98/png/shut_down_normal-0.png',
      onSelect: () => {
        close();
        try { sessionStorage.removeItem('win95.booted'); } catch { /* ignore */ }
        document.body.innerHTML =
          '<div style="background:#000;color:#fff;font-family:serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;">It is now safe to turn off your computer.<br/><small style="opacity:.5;display:block;margin-top:12px;">(Click anywhere to come back.)</small></div>';
        document.body.onclick = () => location.reload();
      },
    },
  ];

  return (
    <div ref={ref} className="start-menu">
      <div className="start-rail">Windows 95</div>
      <Flyout items={items} className="start-items" />
    </div>
  );
}
