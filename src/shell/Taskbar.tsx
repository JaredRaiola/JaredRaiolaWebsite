import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWindowStore } from '@/stores/windowStore';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useSoundStore } from '@/stores/soundStore';
import './Taskbar.css';

function useClock(): { time: string; date: string } {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return {
    time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    date: now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

export function Taskbar() {
  const windows = useWindowStore(useShallow((s) => Object.values(s.windows)));
  const focusedId = useWindowStore((s) => s.focusedId);
  const focus = useWindowStore((s) => s.focus);
  const minimize = useWindowStore((s) => s.minimize);
  const startOpen = useTaskbarStore((s) => s.startMenuOpen);
  const toggleStart = useTaskbarStore((s) => s.toggleStartMenu);
  const muted = useSoundStore((s) => s.muted);
  const toggleMuted = useSoundStore((s) => s.toggleMuted);
  const { time, date } = useClock();

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
      <div className="tb-tray">
        <button
          className="tb-tray-icon"
          onClick={toggleMuted}
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          <img
            src={muted ? '/assets/win98/svg/speaker-muted.svg' : '/assets/win98/svg/speaker.svg'}
            alt=""
          />
        </button>
        <span className="tb-clock" title={date}>{time}</span>
      </div>
    </div>
  );
}
