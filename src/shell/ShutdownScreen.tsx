import { useEffect } from 'react';
import { useShutdownStore } from '@/stores/shutdownStore';
import { playSound } from '@/stores/soundStore';
import './ShutdownScreen.css';

export function ShutdownScreen() {
  const phase = useShutdownStore((s) => s.phase);
  const setPhase = useShutdownStore((s) => s.setPhase);

  useEffect(() => {
    if (phase !== 'shutting-down') return;
    playSound('shutdown');
    try { sessionStorage.removeItem('win95.booted'); } catch { /* ignore */ }
    const t = window.setTimeout(() => setPhase('safe'), 2400);
    return () => window.clearTimeout(t);
  }, [phase, setPhase]);

  useEffect(() => {
    if (phase !== 'safe') return;
    const reload = (): void => location.reload();
    window.addEventListener('mousedown', reload);
    window.addEventListener('keydown', reload);
    return () => {
      window.removeEventListener('mousedown', reload);
      window.removeEventListener('keydown', reload);
    };
  }, [phase]);

  if (phase === 'idle') return null;

  if (phase === 'shutting-down') {
    return (
      <div className="shutdown-cloud-root">
        <div className="shutdown-clouds" />
        <div className="shutdown-card">
          <img className="shutdown-logo" src="/assets/win95-logo.svg" alt="" />
          <div className="shutdown-message">Please wait while your computer shuts down.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="shutdown-safe-root">
      <div className="shutdown-safe-message">
        It's now safe to turn off<br />
        your computer.
      </div>
      <div className="shutdown-safe-hint">Click anywhere to come back.</div>
    </div>
  );
}
