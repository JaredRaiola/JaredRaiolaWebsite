import { useEffect, useRef } from 'react';
import { useScreensaverStore } from '@/stores/screensaverStore';
import { Mystify } from './screensavers/Mystify';
import { Pipes } from './screensavers/Pipes';
import './Screensaver.css';

export function Screensaver() {
  const kind = useScreensaverStore((s) => s.kind);
  const timeoutMs = useScreensaverStore((s) => s.timeoutMs);
  const active = useScreensaverStore((s) => s.active);
  const setActive = useScreensaverStore((s) => s.setActive);
  const lastActivity = useRef(Date.now());

  // Track activity (only when not already active).
  useEffect(() => {
    if (kind === 'none') return;
    const bump = (): void => { lastActivity.current = Date.now(); };
    window.addEventListener('mousemove', bump, { passive: true });
    window.addEventListener('mousedown', bump, { passive: true });
    window.addEventListener('keydown', bump, { passive: true });
    window.addEventListener('wheel', bump, { passive: true });
    window.addEventListener('touchstart', bump, { passive: true });
    return () => {
      window.removeEventListener('mousemove', bump);
      window.removeEventListener('mousedown', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('wheel', bump);
      window.removeEventListener('touchstart', bump);
    };
  }, [kind]);

  // Idle poll. When idle >= timeout, activate.
  useEffect(() => {
    if (kind === 'none') return;
    const id = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= timeoutMs && !useScreensaverStore.getState().active) {
        setActive(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [kind, timeoutMs, setActive]);

  // Dismiss on any input. We add a 500ms grace period after activation
  // because the trigger itself (Run-dialog "saver" command, or just the
  // mouse coming to rest after being idle) involves a final mouse event
  // that would otherwise instant-dismiss the saver.
  useEffect(() => {
    if (!active) return;
    const activatedAt = Date.now();
    let lastPos: { x: number; y: number } | null = null;
    const dismiss = (e: Event): void => {
      if (Date.now() - activatedAt < 500) return;
      // Ignore tiny mouse jitter (>= 4px movement required).
      if (e.type === 'mousemove') {
        const me = e as MouseEvent;
        if (lastPos === null) { lastPos = { x: me.clientX, y: me.clientY }; return; }
        const dx = me.clientX - lastPos.x;
        const dy = me.clientY - lastPos.y;
        if (dx * dx + dy * dy < 16) return;
      }
      lastActivity.current = Date.now();
      setActive(false);
    };
    window.addEventListener('mousemove', dismiss, { passive: true });
    window.addEventListener('mousedown', dismiss, { passive: true });
    window.addEventListener('keydown', dismiss, { passive: true });
    window.addEventListener('touchstart', dismiss, { passive: true });
    return () => {
      window.removeEventListener('mousemove', dismiss);
      window.removeEventListener('mousedown', dismiss);
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('touchstart', dismiss);
    };
  }, [active, setActive]);

  if (!active || kind === 'none') return null;

  return (
    <div className="screensaver-root">
      {kind === 'mystify' && <Mystify />}
      {kind === 'pipes' && <Pipes />}
    </div>
  );
}
