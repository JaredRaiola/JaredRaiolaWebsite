import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useFsStore } from '@/stores/fsStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useWindowStore } from '@/stores/windowStore';
import { useClipboardStore } from '@/stores/clipboardStore';
import { useHotkeys } from '@/lib/useHotkeys';
import type { FsNode } from '@/core/fs/tree';
import { join, parent, basename } from '@/core/fs/paths';
import { setDndPayload, getDndPayload, moveAllInto, markDropConsumed, isPathInside } from '@/core/fs/dnd';
import { createUrlShortcut, createAppShortcut, tryOpenShortcut } from '@/core/fs/shortcut';
import './explorer.css';

type Args = { path?: string };
type View = 'icons' | 'list' | 'details';

export default function Explorer({ api, fs, args }: AppProps) {
  const initial = (args as Args | undefined) ?? {};
  const [history, setHistory] = useState<string[]>([initial.path ?? 'C:\\']);
  const [hi, setHi] = useState(0);
  const [addr, setAddr] = useState(initial.path ?? 'C:\\');
  const [view, setView] = useState<View>('icons');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [lasso, setLasso] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bumpVersion = useFsStore((s) => s.bumpVersion);
  const showCtx = useContextMenuStore((s) => s.show);
  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  const clipPaths = useClipboardStore((s) => s.paths);
  const clipOp = useClipboardStore((s) => s.op);

  const cwd = history[hi];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddr(cwd);
    api.setTitle(`${basename(cwd)} - My Computer`);
  }, [cwd, api]);

  const items = fs.list(cwd);

  // bumpVersion is a render-trigger only; reference it so React 19's
  // unused-prop warning doesn't strip it
  void bumpVersion;

  const navigate = (path: string): void => {
    if (!fs.exists(path) || fs.stat(path)?.kind !== 'dir') return;
    const next = [...history.slice(0, hi + 1), path];
    setHistory(next);
    setHi(next.length - 1);
    setSelection(new Set());
    setAnchor(null);
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

  const openItem = (n: FsNode): void => {
    const path = join(cwd, n.name);
    if (n.kind === 'dir') {
      navigate(path);
      return;
    }
    const lower = path.toLowerCase();
    if (lower.endsWith('.url') || lower.endsWith('.lnk')) {
      void tryOpenShortcut(fs, path);
      return;
    }
    api.openFile(path);
  };

  // ---- Selection helpers --------------------------------------------------
  const selectOnly = (name: string): void => {
    setSelection(new Set([name]));
    setAnchor(name);
  };
  const toggleInSelection = (name: string): void => {
    setSelection((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setAnchor(name);
  };
  const extendSelection = (name: string): void => {
    if (!anchor) return selectOnly(name);
    const ai = items.findIndex((n) => n.name === anchor);
    const bi = items.findIndex((n) => n.name === name);
    if (ai === -1 || bi === -1) return selectOnly(name);
    const [from, to] = ai < bi ? [ai, bi] : [bi, ai];
    setSelection(new Set(items.slice(from, to + 1).map((n) => n.name)));
  };
  const onItemClick = (e: React.MouseEvent, name: string): void => {
    if (e.shiftKey) extendSelection(name);
    else if (e.ctrlKey || e.metaKey) toggleInSelection(name);
    else selectOnly(name);
  };
  const selectAll = (): void => {
    setSelection(new Set(items.map((n) => n.name)));
    setAnchor(items[0]?.name ?? null);
  };

  // ---- Clipboard ops ------------------------------------------------------
  const selectedPaths = useMemo(
    () => Array.from(selection).map((n) => join(cwd, n)),
    [selection, cwd],
  );

  const cutSelection = (): void => {
    if (selectedPaths.length === 0) return;
    useClipboardStore.getState().set(selectedPaths, 'cut');
  };
  const copySelection = (): void => {
    if (selectedPaths.length === 0) return;
    useClipboardStore.getState().set(selectedPaths, 'copy');
  };
  const paste = (): void => {
    if (clipPaths.length === 0 || !clipOp) return;
    void (async () => {
      const errors: string[] = [];
      const newSelection = new Set<string>();
      for (const src of clipPaths) {
        const name = basename(src);
        // Don't allow pasting into self/descendant for cut+folder
        if (clipOp === 'cut' && isPathInside(cwd, src)) {
          errors.push(`Cannot move "${name}" into itself.`);
          continue;
        }
        let dest = join(cwd, name);
        // If pasting into the same folder during a copy, append "Copy of"
        if (clipOp === 'copy' && fs.exists(dest)) {
          let i = 1;
          let candidate = `Copy of ${name}`;
          while (fs.exists(join(cwd, candidate))) {
            i += 1;
            candidate = `Copy (${i}) of ${name}`;
          }
          dest = join(cwd, candidate);
        } else if (fs.exists(dest)) {
          errors.push(`"${name}" already exists in this folder.`);
          continue;
        }
        try {
          if (clipOp === 'cut') await fs.move(src, dest);
          else await fs.copy(src, dest);
          newSelection.add(basename(dest));
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
      if (clipOp === 'cut') useClipboardStore.getState().clear();
      useFsStore.getState().bump();
      if (newSelection.size > 0) {
        setSelection(newSelection);
        setAnchor(Array.from(newSelection)[0]);
      }
      if (errors.length > 0) alert(errors.join('\n'));
    })();
  };

  const deleteSelection = (): void => {
    if (selection.size === 0) return;
    const list = Array.from(selection);
    const msg =
      list.length === 1 ? `Delete ${list[0]}?` : `Delete ${list.length} items?`;
    if (!window.confirm(msg)) return;
    void (async () => {
      for (const name of list) {
        await fs.unlink(join(cwd, name));
      }
      setSelection(new Set());
      useFsStore.getState().bump();
    })();
  };

  const renameSelected = (): void => {
    if (selection.size !== 1) return;
    const name = Array.from(selection)[0];
    const path = join(cwd, name);
    const nu = window.prompt('New name:', name);
    if (!nu || nu === name) return;
    void fs.rename(path, join(cwd, nu)).then(() => {
      setSelection(new Set([nu]));
      setAnchor(nu);
      useFsStore.getState().bump();
    });
  };

  // ---- Hotkeys ------------------------------------------------------------
  useHotkeys(
    {
      'alt+left': goBack,
      'alt+right': goForward,
      backspace: goUp,
      f5: () => useFsStore.getState().bump(),
      delete: deleteSelection,
      f2: renameSelected,
      enter: () => {
        if (selection.size !== 1) return;
        const name = Array.from(selection)[0];
        const node = fs.stat(join(cwd, name));
        if (node) openItem(node);
      },
      'ctrl+x': cutSelection,
      'ctrl+c': copySelection,
      'ctrl+v': paste,
      'ctrl+a': selectAll,
    },
    { enabled: focused, ignoreInInputs: true },
  );

  // ---- Context menus ------------------------------------------------------
  const onItemContext = (e: React.MouseEvent, n: FsNode): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!selection.has(n.name)) selectOnly(n.name);
    const path = join(cwd, n.name);
    showCtx(e.clientX, e.clientY, [
      { kind: 'item', label: 'Open', onSelect: () => openItem(n) },
      { kind: 'item', label: 'Open With...', onSelect: () => {}, disabled: true },
      { kind: 'separator' },
      { kind: 'item', label: 'Cut', onSelect: cutSelection },
      { kind: 'item', label: 'Copy', onSelect: copySelection },
      {
        kind: 'item',
        label: 'Paste',
        onSelect: paste,
        disabled: clipPaths.length === 0,
      },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Delete',
        onSelect: deleteSelection,
      },
      {
        kind: 'item',
        label: 'Rename',
        onSelect: () => {
          void (async () => {
            const nu = window.prompt('New name:', n.name);
            if (nu && nu !== n.name) {
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
      {
        kind: 'item',
        label: 'Paste',
        onSelect: paste,
        disabled: clipPaths.length === 0,
      },
      {
        kind: 'item',
        label: 'Select All',
        onSelect: selectAll,
        disabled: items.length === 0,
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Refresh', onSelect: () => useFsStore.getState().bump() },
    ]);
  };

  // ---- Renderers ----------------------------------------------------------
  const renderIcon = (n: FsNode): string => {
    if (n.kind === 'dir') {
      if (n.name.toLowerCase() === 'recycle bin') return '/assets/win98/png/recycle_bin_empty-0.png';
      return '/assets/win98/png/directory_closed-0.png';
    }
    const lower = n.name.toLowerCase();
    if (lower.endsWith('.txt')) return '/assets/win98/png/notepad-0.png';
    if (lower.endsWith('.url')) return '/assets/win98/png/html-0.png';
    if (lower.endsWith('.lnk')) return '/assets/win98/png/document-0.png';
    return '/assets/win98/png/file_lines-0.png';
  };

  const itemClass = (n: FsNode): string => {
    const path = join(cwd, n.name);
    const cls = [];
    if (selection.has(n.name)) cls.push('selected');
    if (n.kind === 'dir') cls.push('is-dir');
    if (clipOp === 'cut' && useClipboardStore.getState().has(path)) cls.push('cut');
    return cls.join(' ');
  };

  // ---- Drag and drop ------------------------------------------------------
  const onItemDragStart = (e: React.DragEvent, n: FsNode): void => {
    // Drag whatever's selected if this item is already selected; otherwise drag just this one.
    let paths: string[];
    if (selection.has(n.name)) {
      paths = Array.from(selection).map((name) => join(cwd, name));
    } else {
      selectOnly(n.name);
      paths = [join(cwd, n.name)];
    }
    setDndPayload(e, { source: 'fs', paths });
  };

  const onItemDragEnd = (): void => {
    // Clear selection after a successful drag-out (Win95 behavior; if the move
    // happened the items are gone, if not the user is unlikely to want them
    // selected anymore).
    setSelection(new Set());
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
    markDropConsumed();
    const dest = join(cwd, destFolderName);
    void runMove(payload, dest);
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
    markDropConsumed();
    void runMove(payload, cwd, true);
  };

  // Lasso-select inside the explorer body. Only fires when the pointerdown
  // target is the body itself (not on an item).
  const onBodyPointerDown = (e: React.PointerEvent): void => {
    if (!bodyRef.current) return;
    if (e.target !== bodyRef.current && (e.target as HTMLElement).closest('.item, .row')) return;
    if (e.button !== 0) return; // left button only
    const rect = bodyRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left + bodyRef.current.scrollLeft;
    const sy = e.clientY - rect.top + bodyRef.current.scrollTop;
    setSelection(new Set());
    setAnchor(null);
    const onMove = (mv: PointerEvent) => {
      if (!bodyRef.current) return;
      const r = bodyRef.current.getBoundingClientRect();
      const cx = mv.clientX - r.left + bodyRef.current.scrollLeft;
      const cy = mv.clientY - r.top + bodyRef.current.scrollTop;
      const lx1 = Math.min(sx, cx);
      const ly1 = Math.min(sy, cy);
      const lx2 = Math.max(sx, cx);
      const ly2 = Math.max(sy, cy);
      setLasso({ x: lx1, y: ly1, w: lx2 - lx1, h: ly2 - ly1 });
      const sel = new Set<string>();
      bodyRef.current.querySelectorAll<HTMLElement>('[data-item-name]').forEach((el) => {
        const er = el.getBoundingClientRect();
        const x1 = er.left - r.left + bodyRef.current!.scrollLeft;
        const y1 = er.top - r.top + bodyRef.current!.scrollTop;
        const x2 = x1 + er.width;
        const y2 = y1 + er.height;
        if (x1 < lx2 && x2 > lx1 && y1 < ly2 && y2 > ly1) {
          sel.add(el.dataset.itemName!);
        }
      });
      setSelection(sel);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLasso(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onUpDragOver = (e: React.DragEvent): void => {
    if (!parent(cwd)) return;
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onUpDrop = (e: React.DragEvent): void => {
    const payload = getDndPayload(e);
    const destDir = parent(cwd);
    if (!payload || !destDir) return;
    e.preventDefault();
    markDropConsumed();
    void runMove(payload, destDir);
  };

  const runMove = async (
    payload: ReturnType<typeof getDndPayload>,
    dest: string,
    silentSameFolder = false,
  ): Promise<void> => {
    if (!payload) return;
    if (payload.urlShortcut) {
      await createUrlShortcut(fs, dest, payload.urlShortcut.label, payload.urlShortcut.url);
      useFsStore.getState().bump();
      return;
    }
    if (payload.appShortcut) {
      await createAppShortcut(fs, dest, payload.appShortcut.label, payload.appShortcut.appId);
      useFsStore.getState().bump();
      return;
    }
    // Don't try to move the destination folder into itself.
    const filtered = payload.paths.filter((p) => p.toLowerCase() !== dest.toLowerCase());
    const { errors } = await moveAllInto(fs, filtered, dest, { silentSameFolder });
    if (errors.length > 0) alert(errors.join('\n'));
    useFsStore.getState().bump();
  };

  // ---- Render -------------------------------------------------------------
  return (
    <div className="exp-root">
      <div className="exp-menubar">
        <div>File</div>
        <div>Edit</div>
        <div onClick={() => setView(view === 'icons' ? 'list' : view === 'list' ? 'details' : 'icons')}>View ({view})</div>
        <div>Help</div>
      </div>
      <div className="exp-toolbar">
        <button disabled={hi === 0} onClick={goBack} title="Back">←</button>
        <button disabled={hi >= history.length - 1} onClick={goForward} title="Forward">→</button>
        <button
          disabled={!parent(cwd)}
          onClick={goUp}
          onDragOver={onUpDragOver}
          onDrop={onUpDrop}
          title="Up (drop here to move out of this folder)"
        >
          ↑
        </button>
        <span style={{ width: 8 }} />
        <button onClick={cutSelection} disabled={selection.size === 0} title="Cut (Ctrl+X)">✂</button>
        <button onClick={copySelection} disabled={selection.size === 0} title="Copy (Ctrl+C)">⎘</button>
        <button onClick={paste} disabled={clipPaths.length === 0} title="Paste (Ctrl+V)">📋</button>
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
        ref={bodyRef}
        className="exp-body"
        onContextMenu={onBgContext}
        onDragOver={onBodyDragOver}
        onDrop={onBodyDrop}
        onPointerDown={onBodyPointerDown}
        onClick={(e) => {
          // clicking empty body deselects
          if (e.target === e.currentTarget) {
            setSelection(new Set());
            setAnchor(null);
          }
        }}
      >
        {view === 'icons' && (
          <div className="exp-grid">
            {items.map((n) => (
              <div
                key={n.name}
                data-item-name={n.name}
                className={`item ${itemClass(n)}`}
                onClick={(e) => onItemClick(e, n.name)}
                onDoubleClick={() => openItem(n)}
                onContextMenu={(e) => onItemContext(e, n)}
                draggable
                onDragStart={(e) => onItemDragStart(e, n)}
                onDragEnd={onItemDragEnd}
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
                data-item-name={n.name}
                className={`item ${itemClass(n)}`}
                onClick={(e) => onItemClick(e, n.name)}
                onDoubleClick={() => openItem(n)}
                onContextMenu={(e) => onItemContext(e, n)}
                draggable
                onDragStart={(e) => onItemDragStart(e, n)}
                onDragEnd={onItemDragEnd}
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
                    data-item-name={n.name}
                    className={`row ${itemClass(n)}`}
                    onClick={(e) => onItemClick(e, n.name)}
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
        {lasso && (
          <div
            className="exp-lasso"
            style={{ left: lasso.x, top: lasso.y, width: lasso.w, height: lasso.h }}
          />
        )}
      </div>
    </div>
  );
}

