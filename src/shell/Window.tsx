import { Component, Suspense, lazy, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowStore, TASKBAR_HEIGHT, type WindowState } from '@/stores/windowStore';
import { useFsStore } from '@/stores/fsStore';
import { getApp, type AppProps, type WindowApi, type DialogOpts, type DialogResult } from '@/core/apps/registry';
import { resolveAssociation } from '@/core/apps/associations';
import './Window.css';

type Props = { window: WindowState };

// Module-scope cache so each app is lazy() wrapped exactly once across the
// app lifetime. Without this, every Window mount re-creates the wrapper and
// Suspense forces a fresh import, which made apps feel slow to open.
const lazyAppCache = new Map<string, ComponentType<AppProps>>();
function getLazyApp(appId: string, importer: () => Promise<{ default: ComponentType<AppProps> }>): ComponentType<AppProps> {
  let cached = lazyAppCache.get(appId);
  if (!cached) {
    cached = lazy(importer);
    lazyAppCache.set(appId, cached);
  }
  return cached;
}

class AppErrorBoundary extends Component<
  { name: string; onClose: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="win-error">
          <p>{this.props.name} encountered a problem and needs to close.</p>
          <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
          <button onClick={this.props.onClose}>OK</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Window({ window: w }: Props) {
  const focused = useWindowStore((s) => s.focusedId === w.id);
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.close);
  const minimize = useWindowStore((s) => s.minimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const move = useWindowStore((s) => s.move);
  const resize = useWindowStore((s) => s.resize);
  const setTitle = useWindowStore((s) => s.setTitle);
  const setIcon = useWindowStore((s) => s.setIcon);
  const fs = useFsStore((s) => s.fs);
  const open = useWindowStore((s) => s.open);

  const [dialog, setDialog] = useState<{ opts: DialogOpts; resolve: (r: DialogResult) => void } | null>(null);

  const def = getApp(w.appId);
  const Comp = useMemo<ComponentType<AppProps> | null>(
    () => (def ? getLazyApp(def.id, def.component) : null),
    [def],
  );

  const api: WindowApi = useMemo(
    () => ({
      windowId: w.id,
      setTitle: (t) => setTitle(w.id, t),
      setIcon: (i) => setIcon(w.id, i),
      setSize: (width, height) => resize(w.id, width, height),
      requestClose: () => close(w.id),
      openFile: (path) => {
        const appId = resolveAssociation(path);
        if (!appId) {
          setDialog({
            opts: { title: 'Open With', message: `No application is associated with "${path}".`, buttons: ['ok'], icon: 'info' },
            resolve: () => setDialog(null),
          });
          return;
        }
        const target = getApp(appId);
        if (!target) return;
        open(appId, { path }, {
          title: target.displayName,
          icon: target.icon,
          width: target.defaultSize.width,
          height: target.defaultSize.height,
          singleInstance: target.singleInstance,
        });
      },
      showDialog: (opts) =>
        new Promise<DialogResult>((resolve) => {
          setDialog({ opts, resolve: (r) => { setDialog(null); resolve(r); } });
        }),
    }),
    [w.id, setTitle, setIcon, resize, close, open],
  );

  if (!def || !fs) return null;
  if (w.state === 'minimized') return null;

  const minSize = def.minSize ?? { width: 200, height: 120 };

  return (
    <Rnd
      size={{ width: w.width, height: w.height }}
      position={{ x: w.x, y: w.y }}
      minWidth={minSize.width}
      minHeight={minSize.height}
      bounds="parent"
      dragHandleClassName="win-titlebar"
      onDragStop={(_, d) => move(w.id, d.x, d.y)}
      onResizeStop={(_, __, ref, ___, pos) => {
        resize(w.id, ref.offsetWidth, ref.offsetHeight);
        move(w.id, pos.x, pos.y);
      }}
      onMouseDown={() => !focused && focus(w.id)}
      style={{ zIndex: w.zIndex }}
      disableDragging={w.state === 'maximized'}
      enableResizing={def.resizable !== false && w.state !== 'maximized'}
    >
      <div className={`win-frame ${focused ? 'focused' : ''}`} style={{ width: '100%', height: '100%' }}>
        <div
          className={`win-titlebar ${focused ? '' : 'inactive'}`}
          onDoubleClick={() => toggleMaximize(w.id)}
        >
          <div className="win-title">
            {w.icon && <img src={w.icon} alt="" />}
            <span>{w.title}</span>
          </div>
          <div className="win-buttons">
            <button onClick={() => minimize(w.id)} title="Minimize">_</button>
            <button
              onClick={() => def.resizable !== false && toggleMaximize(w.id)}
              disabled={def.resizable === false}
              title="Maximize"
            >▢</button>
            <button onClick={() => close(w.id)} title="Close">×</button>
          </div>
        </div>
        <div className="win-body">
          <AppErrorBoundary name={def.displayName} onClose={() => close(w.id)}>
            {Comp && (
              <Suspense fallback={<div style={{ padding: 8 }}>Loading…</div>}>
                <Comp api={api} fs={fs} args={w.args} />
              </Suspense>
            )}
          </AppErrorBoundary>
        </div>
        {dialog && <DialogOverlay opts={dialog.opts} onResolve={dialog.resolve} />}
      </div>
    </Rnd>
  );
}

function DialogOverlay({ opts, onResolve }: { opts: DialogOpts; onResolve: (r: DialogResult) => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div className="window" style={{ minWidth: 280 }}>
        <div className="title-bar">
          <div className="title-bar-text">{opts.title}</div>
        </div>
        <div className="window-body">
          <p>{opts.message}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {opts.buttons.map((b) => (
              <button key={b} onClick={() => onResolve(b)}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const _TASKBAR_HEIGHT = TASKBAR_HEIGHT;
