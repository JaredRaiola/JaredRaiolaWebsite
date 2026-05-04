import { useEffect, useRef, useState } from 'react';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useWindowStore } from '@/stores/windowStore';
import { useFsStore } from '@/stores/fsStore';
import { getApp } from '@/core/apps/registry';
import { resolveAssociation } from '@/core/apps/associations';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(history[0] ?? '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = (): void => {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...history.filter((h) => h !== v)].slice(0, 5);
    setHistory(next);
    saveHistory(next);

    if (v.includes('\\') || v.toLowerCase().startsWith('c:')) {
      if (!fs) return;
      if (!fs.exists(v)) {
        alert(`Cannot find "${v}"`);
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
          alert('No application is associated with that file.');
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
        alert(`Cannot find program "${v}"`);
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.15)', zIndex: 99000,
      }}
    >
      <div className="window" style={{ minWidth: 360 }}>
        <div className="title-bar">
          <div className="title-bar-text">Run</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={close} />
          </div>
        </div>
        <div className="window-body">
          <p>Type the name of a program or path, and Windows will open it for you.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="run-input">Open:</label>
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
              style={{ flex: 1 }}
            />
            <datalist id="run-history">
              {history.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={submit}>OK</button>
            <button onClick={close}>Cancel</button>
            <button disabled>Browse...</button>
          </div>
        </div>
      </div>
    </div>
  );
}
