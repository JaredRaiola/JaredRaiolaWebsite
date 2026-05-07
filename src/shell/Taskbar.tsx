import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWindowStore } from '@/stores/windowStore';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useSoundStore } from '@/stores/soundStore';
import './Taskbar.css';

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M3 6 L6 6 L9 3 L9 13 L6 10 L3 10 Z" fill="#000" />
      {muted ? (
        <path d="M11 6 L14 9 M14 6 L11 9" stroke="#c00" strokeWidth="1.4" fill="none" />
      ) : (
        <>
          <path d="M11 5 Q13 8 11 11" stroke="#000" strokeWidth="1" fill="none" />
          <path d="M11 7 Q12 8 11 9" stroke="#000" strokeWidth="1" fill="none" />
        </>
      )}
    </svg>
  );
}

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
          <SpeakerIcon muted={muted} />
        </button>
        <span className="tb-clock" title={date}>{time}</span>
      </div>
    </div>
  );
}
