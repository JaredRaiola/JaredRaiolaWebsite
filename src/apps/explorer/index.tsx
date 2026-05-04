import { useEffect, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useFsStore } from '@/stores/fsStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useWindowStore } from '@/stores/windowStore';
import { useHotkeys } from '@/lib/useHotkeys';
import type { FsNode } from '@/core/fs/tree';
import { join, parent, basename } from '@/core/fs/paths';
import { setDndPayload, getDndPayload, moveInto } from '@/core/fs/dnd';
import './explorer.css';

type Args = { path?: string };
type View = 'icons' | 'list' | 'details';

export default function Explorer({ api, fs, args }: AppProps) {
  const initial = (args as Args | undefined) ?? {};
  const [history, setHistory] = useState<string[]>([initial.path ?? 'C:\\']);
  const [hi, setHi] = useState(0);
  const [addr, setAddr] = useState(initial.path ?? 'C:\\');
  const [view, setView] = useState<View>('icons');
  const [selected, setSelected] = useState<string | null>(null);
  const bumpVersion = useFsStore((s) => s.bumpVersion);
  const showCtx = useContextMenuStore((s) => s.show);
  const focused = useWindowStore((s) => s.focusedId === api.windowId);

  const cwd = history[hi];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddr(cwd);
    api.setTitle(`${basename(cwd)} - My Computer`);
  }, [cwd, api]);

  const items = fs.list(cwd);

  const navigate = (path: string): void => {
    if (!fs.exists(path) || fs.stat(path)?.kind !== 'dir') return;
    const next = [...history.slice(0, hi + 1), path];
    setHistory(next);
    setHi(next.length - 1);
    setSelected(null);
  };

  const goBack = (): void => {
    if (hi > 0) setHi(hi - 1);
  };
  const goForward = (): void => {
    if (hi < history.length - 1) setHi(hi + 1);
  };
  const goUp = (): void => {
    const p = parent(cwd);
    if (p) navigate(p);
  };

  useHotkeys(
    {
      'alt+left': goBack,
      'alt+right': goForward,
      backspace: goUp,
      f5: () => useFsStore.getState().bump(),
      delete: () => {
        if (!selected) return;
        const path = join(cwd, selected);
        if (window.confirm(`Delete ${selected}?`)) {
          void fs.unlink(path).then(() => useFsStore.getState().bump());
        }
      },
      f2: () => {
        if (!selected) return;
        const path = join(cwd, selected);
        const nu = window.prompt('New name:', selected);
        if (nu) void fs.rename(path, join(cwd, nu)).then(() => useFsStore.getState().bump());
      },
      enter: () => {
        if (!selected) return;
        const node = fs.stat(join(cwd, selected));
        if (node) openItem(node);
      },
    },
    { enabled: focused, ignoreInInputs: true },
  );

  const openItem = (n: FsNode): void => {
    const path = join(cwd, n.name);
    if (n.kind === 'dir') navigate(path);
    else api.openFile(path);
  };

  const onItemContext = (e: React.MouseEvent, n: FsNode): void => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(n.name);
    const path = join(cwd, n.name);
    showCtx(e.clientX, e.clientY, [
      { kind: 'item', label: 'Open', onSelect: () => openItem(n) },
      { kind: 'item', label: 'Open With...', onSelect: () => {}, disabled: true },
      { kind: 'separator' },
      { kind: 'item', label: 'Cut', onSelect: () => {}, disabled: true },
      { kind: 'item', label: 'Copy', onSelect: () => {}, disabled: true },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Delete',
        onSelect: () => {
          void (async () => {
            if (window.confirm(`Delete ${n.name}?`)) {
              await fs.unlink(path);
              useFsStore.getState().bump();
            }
          })();
        },
      },
      {
        kind: 'item',
        label: 'Rename',
        onSelect: () => {
          void (async () => {
            const nu = window.prompt('New name:', n.name);
            if (nu) {
              await fs.rename(path, join(cwd, nu));
              useFsStore.getState().bump();
            }
          })();
        },
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Properties', onSelect: () => {}, disabled: true },
    ]);
  };

  const onBgContext = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    showCtx(e.clientX, e.clientY, [
      {
        kind: 'item',
        label: 'New Folder',
        onSelect: () => {
          void (async () => {
            const name = window.prompt('Folder name:', 'New Folder');
            if (!name) return;
            await fs.mkdir(join(cwd, name));
            useFsStore.getState().bump();
          })();
        },
      },
      {
        kind: 'item',
        label: 'New Text Document',
        onSelect: () => {
          void (async () => {
            const name = window.prompt('File name:', 'New Text Document.txt');
            if (!name) return;
            await fs.writeText(join(cwd, name), '');
            useFsStore.getState().bump();
          })();
        },
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Refresh', onSelect: () => useFsStore.getState().bump() },
    ]);
  };

  const renderIcon = (n: FsNode): string => {
    if (n.kind === 'dir') return '/assets/win98/png/directory_closed-0.png';
    if (n.name.toLowerCase().endsWith('.txt')) return '/assets/win98/png/notepad-0.png';
    return '/assets/win98/png/file_lines-0.png';
  };

  const onItemDragStart = (e: React.DragEvent, n: FsNode): void => {
    setDndPayload(e, { source: 'fs', path: join(cwd, n.name) });
  };

  const onFolderDragOver = (e: React.DragEvent): void => {
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const onFolderDrop = (e: React.DragEvent, destFolderName: string): void => {
    const payload = getDndPayload(e);
    if (!payload) return;
    e.preventDefault();
    e.stopPropagation();
    const dest = join(cwd, destFolderName);
    void (async () => {
      const result = await moveInto(fs, payload.path, dest);
      if (!result.ok) {
        alert(result.reason);
        return;
      }
      // If it came from desktop, remove the desktop icon for it.
      if (payload.source === 'desktop' && payload.iconId) {
        const { useDesktopStore } = await import('@/stores/desktopStore');
        useDesktopStore.getState().remove(payload.iconId);
      }
      useFsStore.getState().bump();
    })();
  };

  const onBodyDragOver = (e: React.DragEvent): void => {
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onBodyDrop = (e: React.DragEvent): void => {
    const payload = getDndPayload(e);
    if (!payload) return;
    e.preventDefault();
    void (async () => {
      const result = await moveInto(fs, payload.path, cwd);
      if (!result.ok) {
        // Silently ignore "already in this folder"; otherwise surface
        if (result.reason !== 'Already in this folder.') alert(result.reason);
        return;
      }
      if (payload.source === 'desktop' && payload.iconId) {
        const { useDesktopStore } = await import('@/stores/desktopStore');
        useDesktopStore.getState().remove(payload.iconId);
      }
      useFsStore.getState().bump();
    })();
  };

  return (
    <div className="exp-root" data-bump={bumpVersion}>
      <div className="exp-menubar">
        <div>File</div>
        <div>Edit</div>
        <div onClick={() => setView(view === 'icons' ? 'list' : view === 'list' ? 'details' : 'icons')}>View ({view})</div>
        <div>Help</div>
      </div>
      <div className="exp-toolbar">
        <button disabled={hi === 0} onClick={goBack} title="Back">←</button>
        <button disabled={hi >= history.length - 1} onClick={goForward} title="Forward">→</button>
        <button disabled={!parent(cwd)} onClick={goUp} title="Up">↑</button>
        <span style={{ width: 8 }} />
        <button disabled title="Cut">✂</button>
        <button disabled title="Copy">⎘</button>
        <button disabled title="Paste">📋</button>
      </div>
      <div className="exp-addr">
        <label>Address:</label>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(addr);
          }}
        />
      </div>
      <div
        className="exp-body"
        onContextMenu={onBgContext}
        onDragOver={onBodyDragOver}
        onDrop={onBodyDrop}
      >
        {view === 'icons' && (
          <div className="exp-grid">
            {items.map((n) => (
              <div
                key={n.name}
                className={`item ${selected === n.name ? 'selected' : ''} ${n.kind === 'dir' ? 'is-dir' : ''}`}
                onClick={() => setSelected(n.name)}
                onDoubleClick={() => openItem(n)}
                onContextMenu={(e) => onItemContext(e, n)}
                draggable
                onDragStart={(e) => onItemDragStart(e, n)}
                onDragOver={n.kind === 'dir' ? onFolderDragOver : undefined}
                onDrop={n.kind === 'dir' ? (e) => onFolderDrop(e, n.name) : undefined}
              >
                <img src={renderIcon(n)} alt="" />
                <div className="label">{n.name}</div>
              </div>
            ))}
          </div>
        )}
        {view === 'list' && (
          <div className="exp-list">
            {items.map((n) => (
              <div
                key={n.name}
                className={`item ${selected === n.name ? 'selected' : ''} ${n.kind === 'dir' ? 'is-dir' : ''}`}
                onClick={() => setSelected(n.name)}
                onDoubleClick={() => openItem(n)}
                onContextMenu={(e) => onItemContext(e, n)}
                draggable
                onDragStart={(e) => onItemDragStart(e, n)}
                onDragOver={n.kind === 'dir' ? onFolderDragOver : undefined}
                onDrop={n.kind === 'dir' ? (e) => onFolderDrop(e, n.name) : undefined}
              >
                <img src={renderIcon(n)} alt="" />
                {n.name}
              </div>
            ))}
          </div>
        )}
        {view === 'details' && (
          <div className="exp-details">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Modified</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr
                    key={n.name}
                    className={`row ${selected === n.name ? 'selected' : ''} ${n.kind === 'dir' ? 'is-dir' : ''}`}
                    onClick={() => setSelected(n.name)}
                    onDoubleClick={() => openItem(n)}
                    onContextMenu={(e) => onItemContext(e, n)}
                    draggable
                    onDragStart={(e) => onItemDragStart(e, n)}
                    onDragOver={n.kind === 'dir' ? onFolderDragOver : undefined}
                    onDrop={n.kind === 'dir' ? (e) => onFolderDrop(e, n.name) : undefined}
                  >
                    <td>
                      <img src={renderIcon(n)} alt="" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {n.name}
                    </td>
                    <td>{n.kind === 'file' ? `${n.size} B` : ''}</td>
                    <td>{n.kind === 'dir' ? 'File Folder' : 'Text Document'}</td>
                    <td>{new Date(n.modifiedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
