import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWindowStore } from '@/stores/windowStore';
import { useTaskbarStore } from '@/stores/taskbarStore';
import './Taskbar.css';

function useClock(): string {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function Taskbar() {
  const windows = useWindowStore(useShallow((s) => Object.values(s.windows)));
  const focusedId = useWindowStore((s) => s.focusedId);
  const focus = useWindowStore((s) => s.focus);
  const minimize = useWindowStore((s) => s.minimize);
  const startOpen = useTaskbarStore((s) => s.startMenuOpen);
  const toggleStart = useTaskbarStore((s) => s.toggleStartMenu);
  const time = useClock();

  return (
    <div className="taskbar">
      <button className={`start-btn ${startOpen ? 'pressed' : ''}`} onClick={toggleStart} aria-label="Start">
        <img src="/assets/win98/png/start_icon.png" alt="Start" />
      </button>
      <div className="taskbar-windows">
        {windows.map((w) => (
          <button
            key={w.id}
            className={`tb-win ${focusedId === w.id && w.state !== 'minimized' ? 'active' : ''}`}
            onClick={() => {
              if (focusedId === w.id && w.state !== 'minimized') minimize(w.id);
              else focus(w.id);
            }}
          >
            {w.icon && <img src={w.icon} alt="" />}
            {w.title}
          </button>
        ))}
      </div>
      <div className="tb-tray" title={new Date().toDateString()}>
        {time}
      </div>
    </div>
  );
}
