import { useEffect, useRef, useState } from 'react';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useWindowStore } from '@/stores/windowStore';
import { useFsStore } from '@/stores/fsStore';
import { getApp } from '@/core/apps/registry';
import { resolveAssociation } from '@/core/apps/associations';
import { sysAlert } from '@/lib/dialog';
import { useScreensaverStore } from '@/stores/screensaverStore';

const HISTORY_KEY = 'win95.run.history';

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveHistory(entries: string[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 5)));
}

export function RunDialog() {
  const open = useTaskbarStore((s) => s.runDialogOpen);
  const close = useTaskbarStore((s) => s.closeRunDialog);
  const openWindow = useWindowStore((s) => s.open);
  const fs = useFsStore((s) => s.fs);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const winRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(history[0] ?? '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onTitlePointerDown = (e: React.PointerEvent): void => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const el = winRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: rect.left, y: rect.top });
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const onMove = (mv: PointerEvent) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const nx = Math.max(0, Math.min(window.innerWidth - w, mv.clientX - offsetX));
      const ny = Math.max(0, Math.min(window.innerHeight - h, mv.clientY - offsetY));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const submit = (): void => {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...history.filter((h) => h !== v)].slice(0, 5);
    setHistory(next);
    saveHistory(next);

    // Quick triggers for full-screen modes.
    const lower = v.toLowerCase();
    if (lower === 'saver' || lower === 'screensaver') {
      useScreensaverStore.getState().setActive(true);
      close();
      return;
    }

    if (v.includes('\\') || v.toLowerCase().startsWith('c:')) {
      if (!fs) return;
      if (!fs.exists(v)) {
        void sysAlert(`Cannot find "${v}"`, { title: 'Run', icon: 'error' });
        return;
      }
      const node = fs.stat(v);
      if (node?.kind === 'dir') {
        const explorer = getApp('explorer');
        if (!explorer) return;
        openWindow('explorer', { path: v }, {
          title: 'My Computer',
          icon: explorer.icon,
          width: explorer.defaultSize.width,
          height: explorer.defaultSize.height,
        });
      } else {
        const appId = resolveAssociation(v);
        if (!appId) {
          void sysAlert('No application is associated with that file.', { title: 'Run', icon: 'error' });
          return;
        }
        const app = getApp(appId);
        if (!app) return;
        openWindow(appId, { path: v }, {
          title: app.displayName,
          icon: app.icon,
          width: app.defaultSize.width,
          height: app.defaultSize.height,
        });
      }
    } else {
      const app = getApp(v.toLowerCase());
      if (!app) {
        void sysAlert(`Cannot find program "${v}"`, { title: 'Run', icon: 'error' });
        return;
      }
      openWindow(app.id, undefined, {
        title: app.displayName,
        icon: app.icon,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
        singleInstance: app.singleInstance,
      });
    }
    close();
  };

  const baseWinStyle: React.CSSProperties = { minWidth: 420, fontSize: 14 };
  const winStyle: React.CSSProperties = pos
    ? { ...baseWinStyle, position: 'fixed', left: pos.x, top: pos.y, margin: 0 }
    : baseWinStyle;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.15)', zIndex: 99000,
      }}
    >
      <div ref={winRef} className="window" style={winStyle}>
        <div
          className="title-bar"
          onPointerDown={onTitlePointerDown}
          style={{ cursor: 'move', userSelect: 'none', fontSize: 14 }}
        >
          <div className="title-bar-text" style={{ fontSize: 14 }}>Run</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={close} />
          </div>
        </div>
        <div className="window-body" style={{ fontSize: 14 }}>
          <p style={{ fontSize: 14, marginTop: 0 }}>
            Type the name of a program or path, and Windows will open it for you.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="run-input" style={{ fontSize: 14 }}>Open:</label>
            <input
              id="run-input"
              ref={inputRef}
              type="text"
              value={value}
              list="run-history"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') close();
              }}
              style={{ flex: 1, fontSize: 14, padding: '4px 5px' }}
            />
            <datalist id="run-history">
              {history.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
            <button onClick={submit} style={{ fontSize: 14, minWidth: 88, height: 28 }}>OK</button>
            <button onClick={close} style={{ fontSize: 14, minWidth: 88, height: 28 }}>Cancel</button>
            <button disabled style={{ fontSize: 14, minWidth: 88, height: 28 }}>Browse...</button>
          </div>
        </div>
      </div>
    </div>
  );
}
