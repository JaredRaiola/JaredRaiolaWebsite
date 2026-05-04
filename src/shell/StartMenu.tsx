import { useEffect, useRef } from 'react';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useWindowStore } from '@/stores/windowStore';
import { listApps, getApp } from '@/core/apps/registry';
import './StartMenu.css';

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

  const launchApp = (appId: string): void => {
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

  return (
    <div ref={ref} className="start-menu">
      <div className="start-rail">Windows 95</div>
      <div className="start-items">
        <div className="start-item">
          <img src="/assets/win98/png/file_program_group-0.png" alt="" />
          Programs ▶
        </div>
        <div style={{ paddingLeft: 32 }}>
          {listApps().map((app) => (
            <div key={app.id} className="start-item" onClick={() => launchApp(app.id)}>
              <img src={app.icon} alt="" />
              {app.displayName}
            </div>
          ))}
        </div>
        <div className="start-sep" />
        <div className="start-item disabled">
          <img src="/assets/win98/png/directory_open_file_mydocs-0.png" alt="" />
          Documents ▶
        </div>
        <div className="start-item disabled">
          <img src="/assets/win98/png/settings_gear-0.png" alt="" />
          Settings ▶
        </div>
        <div className="start-item disabled">
          <img src="/assets/win98/png/search_file-0.png" alt="" />
          Find ▶
        </div>
        <div className="start-item disabled">
          <img src="/assets/win98/png/help_book_big-0.png" alt="" />
          Help
        </div>
        <div className="start-item" onClick={() => { openRun(); }}>
          <img src="/assets/win98/png/application_hourglass-0.png" alt="" />
          Run...
        </div>
        <div className="start-sep" />
        <div
          className="start-item"
          onClick={() => {
            close();
            try { sessionStorage.removeItem('win95.booted'); } catch { /* ignore */ }
            document.body.innerHTML =
              '<div style="background:#000;color:#fff;font-family:serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;">It is now safe to turn off your computer.<br/><small style="opacity:.5;display:block;margin-top:12px;">(Click anywhere to come back.)</small></div>';
            document.body.onclick = () => location.reload();
          }}
        >
          <img src="/assets/win98/png/shut_down_normal-0.png" alt="" />
          Shut Down...
        </div>
      </div>
    </div>
  );
}
