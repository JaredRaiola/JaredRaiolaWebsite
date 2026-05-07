import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useFsStore } from '@/stores/fsStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useWindowStore } from '@/stores/windowStore';
import { getApp } from '@/core/apps/registry';
import { useClipboardStore } from '@/stores/clipboardStore';
import { useRecycleBinStore } from '@/stores/recycleBinStore';
import { showRestoreConflict, type RestoreConflictResolution } from '@/lib/restoreConflict';
import { useHotkeys } from '@/lib/useHotkeys';
import type { FsNode } from '@/core/fs/tree';
import { join, parent, basename, findUniqueSibling } from '@/core/fs/paths';
import { RECYCLE_BIN_DIR } from '@/core/fs/recycleBin';
import { setDndPayload, getDndPayload, moveAllInto, markDropConsumed, wasDropConsumed, isPathInside } from '@/core/fs/dnd';
import { createUrlShortcut, createAppShortcut, tryOpenShortcut } from '@/core/fs/shortcut';
import { sysAlert, sysConfirm, sysPrompt } from '@/lib/dialog';
import { playSound } from '@/stores/soundStore';
import { showProperties } from '@/lib/properties';
import './explorer.css';

type Args = { path?: string };
type View = 'icons' | 'list' | 'details';

type ExplorerSnapshot = {
  history: string[];
  hi: number;
  view: View;
};

export default function Explorer({ api, fs, args, restoreState }: AppProps) {
  const initial = (args as Args | undefined) ?? {};
  const restored = (restoreState as Partial<ExplorerSnapshot> | undefined);
  const [history, setHistory] = useState<string[]>(
    Array.isArray(restored?.history) && restored.history.length > 0
      ? restored.history
      : [initial.path ?? 'C:\\'],
  );
  const [hi, setHi] = useState(typeof restored?.hi === 'number' ? restored.hi : 0);
  const [addr, setAddr] = useState(
    (Array.isArray(restored?.history) && restored.history[restored?.hi ?? 0]) ||
      initial.path ||
      'C:\\',
  );
  const [view, setView] = useState<View>(restored?.view ?? 'icons');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [lasso, setLasso] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bumpVersion = useFsStore((s) => s.bumpVersion);
  const showCtx = useContextMenuStore((s) => s.show);
  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  const openWindow = useWindowStore((s) => s.open);

  const launchCmdHere = (): void => {
    const cmdApp = getApp('cmd');
    if (!cmdApp) return;
    openWindow('cmd', { cwd }, {
      title: cmdApp.displayName,
      icon: cmdApp.icon,
      width: cmdApp.defaultSize.width,
      height: cmdApp.defaultSize.height,
    });
  };
  const clipPaths = useClipboardStore((s) => s.paths);
  const clipOp = useClipboardStore((s) => s.op);

  const cwd = history[hi];
  const isBinMode = cwd.toLowerCase() === RECYCLE_BIN_DIR.toLowerCase();
  const recycleEntries = useRecycleBinStore((s) => s.entries);
  const recycleBin = useRecycleBinStore((s) => s.bin);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddr(cwd);
    api.setTitle(`${basename(cwd)} - My Computer`);
  }, [cwd, api]);

  // Register session snapshot.
  useEffect(() => {
    return api.registerSnapshot((): ExplorerSnapshot => ({ history, hi, view }));
  }, [history, hi, view, api]);

  const items = useMemo<FsNode[]>(() => {
    if (isBinMode) {
      return recycleEntries.map((entry) => {
        const node = fs.stat(`${RECYCLE_BIN_DIR}\\${entry.binName}`);
        if (node) return node;
        // Fallback FsNode shape if FS hasn't synced yet (rare).
        if (entry.kind === 'file') {
          return {
            kind: 'file',
            name: entry.binName,
            mime: 'application/octet-stream',
            size: entry.size,
            blobId: '',
            modifiedAt: entry.deletedAt,
          } as FsNode;
        }
        return {
          kind: 'dir',
          name: entry.binName,
          children: {},
          createdAt: entry.deletedAt,
          modifiedAt: entry.deletedAt,
        } as FsNode;
      });
    }
    // Defense-in-depth: filter .index.json even if someone navigates here via address bar.
    return fs
      .list(cwd)
      .filter((n) => !(cwd.toLowerCase() === RECYCLE_BIN_DIR.toLowerCase() && n.name === '.index.json'));
  }, [cwd, fs, bumpVersion, isBinMode, recycleEntries]);

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
    const { paths, op } = useClipboardStore.getState();
    if (!op || paths.length === 0) return;
    void (async () => {
      const newSelection = new Set<string>();
      const errors: string[] = [];
      for (const src of paths) {
        const desiredName = basename(src);
        const isCutSameFolder = op === 'cut' && parent(src)?.toLowerCase() === cwd.toLowerCase();
        if (isCutSameFolder) continue; // silent no-op
        // Don't allow pasting into self/descendant for cut+folder
        if (op === 'cut' && isPathInside(cwd, src)) {
          errors.push(`Cannot move "${desiredName}" into itself.`);
          continue;
        }
        const dest = op === 'copy' ? findUniqueSibling(fs, cwd, desiredName) : join(cwd, desiredName);
        try {
          if (op === 'cut') {
            if (fs.exists(dest)) {
              errors.push(`An item named "${desiredName}" already exists here.`);
              continue;
            }
            await fs.move(src, dest);
          } else {
            await fs.copy(src, dest);
          }
          newSelection.add(basename(dest));
        } catch (e) {
          errors.push(String(e));
        }
      }
      if (op === 'cut') useClipboardStore.getState().clear();
      if (newSelection.size > 0) {
        setSelection(newSelection);
        setAnchor(Array.from(newSelection)[0]);
      }
      useFsStore.getState().bump();
      if (errors.length > 0) void sysAlert(errors.join('\n'), { title: 'Paste', icon: 'error' });
    })();
  };

  const deleteSelection = (): void => {
    if (selection.size === 0) return;
    const list = Array.from(selection);
    const msg =
      list.length === 1
        ? `Are you sure you want to send '${list[0]}' to the Recycle Bin?`
        : `Are you sure you want to send these ${list.length} items to the Recycle Bin?`;
    void sysConfirm(msg, { title: 'Confirm File Delete', icon: 'warn' }).then((ok) => {
      if (!ok) return;
      void (async () => {
        for (const name of list) {
          await fs.unlink(join(cwd, name));
        }
        setSelection(new Set());
        useFsStore.getState().bump();
      })();
    });
  };

  const permanentlyDeleteSelection = (): void => {
    if (selection.size === 0) return;
    const list = Array.from(selection);
    const msg =
      list.length === 1
        ? `Are you sure you want to permanently delete '${list[0]}'? This action cannot be undone.`
        : `Are you sure you want to permanently delete these ${list.length} items? This action cannot be undone.`;
    void sysConfirm(msg, { title: 'Confirm File Delete', icon: 'warn' }).then((ok) => {
      if (!ok) return;
      void (async () => {
        for (const name of list) {
          await fs.unlinkPermanent(join(cwd, name));
        }
        setSelection(new Set());
        useFsStore.getState().bump();
      })();
    });
  };

  const restoreSelection = async (binNames: string[]): Promise<void> => {
    if (!recycleBin) return;
    const queue = recycleEntries.filter((e) => binNames.includes(e.binName));
    let stickyResolution: RestoreConflictResolution | null = null;
    for (let i = 0; i < queue.length; i++) {
      const entry = queue[i];
      const conflict = fs.exists(entry.originPath);
      let resolution: RestoreConflictResolution = 'replace';
      if (conflict) {
        if (stickyResolution) {
          resolution = stickyResolution;
        } else {
          const result = await showRestoreConflict({
            binName: entry.binName,
            originPath: entry.originPath,
            multi: queue.length - i > 1,
          });
          resolution = result.resolution;
          if (result.applyToAll) stickyResolution = result.resolution;
        }
      }
      await recycleBin.restore(entry.id, resolution);
    }
    useRecycleBinStore.getState().refresh();
    useFsStore.getState().bump();
    setSelection(new Set());
  };

  const renameSelected = (): void => {
    if (selection.size !== 1) return;
    const name = Array.from(selection)[0];
    const path = join(cwd, name);
    void sysPrompt('Enter a new name:', name, { title: 'Rename' }).then((nu) => {
      if (!nu || nu === name) return;
      void fs.rename(path, join(cwd, nu)).then(() => {
        setSelection(new Set([nu]));
        setAnchor(nu);
        useFsStore.getState().bump();
      });
    });
  };

  // ---- Hotkeys ------------------------------------------------------------
  const permDeleteSelectedBinEntries = (): void => {
    if (selection.size === 0) return;
    const selectedNames = Array.from(selection);
    const count = selectedNames.length;
    const msg =
      count === 1
        ? `Are you sure you want to permanently delete '${selectedNames[0]}'? This action cannot be undone.`
        : `Are you sure you want to permanently delete these ${count} items? This action cannot be undone.`;
    void sysConfirm(msg, { title: 'Confirm File Delete', icon: 'warn' }).then(async (ok) => {
      if (!ok || !recycleBin) return;
      for (const name of selectedNames) {
        const entry = recycleEntries.find((e) => e.binName === name);
        if (entry) await recycleBin.permanentlyDelete(entry.id);
      }
      useRecycleBinStore.getState().refresh();
      useFsStore.getState().bump();
      setSelection(new Set());
    });
  };

  useHotkeys(
    isBinMode
      ? {
          'alt+left': goBack,
          'alt+right': goForward,
          backspace: goUp,
          f5: () => useFsStore.getState().bump(),
          delete: permDeleteSelectedBinEntries,
          'shift+delete': permDeleteSelectedBinEntries,
          'ctrl+a': selectAll,
        }
      : {
          'alt+left': goBack,
          'alt+right': goForward,
          backspace: goUp,
          f5: () => useFsStore.getState().bump(),
          delete: deleteSelection,
          'shift+delete': permanentlyDeleteSelection,
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

    if (isBinMode) {
      const selectedNames = Array.from(
        selection.size > 0 && selection.has(n.name) ? selection : new Set([n.name]),
      );
      const entry = recycleEntries.find((e2) => e2.binName === n.name);
      showCtx(e.clientX, e.clientY, [
        {
          kind: 'item',
          label: 'Restore',
          disabled: !entry,
          onSelect: () => void restoreSelection(selectedNames),
        },
        { kind: 'separator' },
        { kind: 'item', label: 'Cut', onSelect: () => {}, disabled: true },
        { kind: 'item', label: 'Copy', onSelect: () => {}, disabled: true },
        { kind: 'separator' },
        {
          kind: 'item',
          label: 'Permanently Delete',
          onSelect: () => {
            const count = selectedNames.length;
            const msg =
              count === 1
                ? `Are you sure you want to permanently delete '${selectedNames[0]}'? This action cannot be undone.`
                : `Are you sure you want to permanently delete these ${count} items? This action cannot be undone.`;
            void sysConfirm(msg, { title: 'Confirm File Delete', icon: 'warn' }).then(async (ok) => {
              if (!ok || !recycleBin) return;
              for (const name of selectedNames) {
                const target = recycleEntries.find((e2) => e2.binName === name);
                if (target) await recycleBin.permanentlyDelete(target.id);
              }
              useRecycleBinStore.getState().refresh();
              useFsStore.getState().bump();
              setSelection(new Set());
            });
          },
        },
        { kind: 'separator' },
        { kind: 'item', label: 'Properties', onSelect: () => {}, disabled: true },
      ]);
      return;  // bin mode ends here
    }

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
          void sysPrompt('Enter a new name:', n.name, { title: 'Rename' }).then(async (nu) => {
            if (nu && nu !== n.name) {
              await fs.rename(path, join(cwd, nu));
              useFsStore.getState().bump();
            }
          });
        },
      },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Properties',
        onSelect: () => {
          const target = fs.stat(path);
          if (!target) return;
          void showProperties({ node: target, path, fs });
        },
      },
    ]);
  };

  const onBgContext = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    if (isBinMode) {
      showCtx(e.clientX, e.clientY, [
        {
          kind: 'item',
          label: 'Empty Recycle Bin',
          disabled: recycleEntries.length === 0,
          onSelect: () => {
            const count = recycleEntries.length;
            const msg =
              count === 1
                ? 'Are you sure you want to permanently delete this item? This action cannot be undone.'
                : `Are you sure you want to permanently delete these ${count} items? This action cannot be undone.`;
            void sysConfirm(msg, { title: 'Confirm Multiple File Delete', icon: 'warn' }).then((ok) => {
              if (!ok || !recycleBin) return;
              void recycleBin.empty().then(() => {
                playSound('recycle');
                useRecycleBinStore.getState().refresh();
                useFsStore.getState().bump();
              });
            });
          },
        },
        { kind: 'separator' },
        { kind: 'item', label: 'Refresh', onSelect: () => useFsStore.getState().bump() },
        { kind: 'separator' },
        { kind: 'item', label: 'Properties', onSelect: () => {}, disabled: true },
      ]);
      return;
    }

    showCtx(e.clientX, e.clientY, [
      {
        kind: 'item',
        label: 'New Folder',
        onSelect: () => {
          void sysPrompt('Enter a name for the new folder:', 'New Folder', { title: 'New Folder' }).then(async (name) => {
            if (!name) return;
            await fs.mkdir(join(cwd, name));
            useFsStore.getState().bump();
          });
        },
      },
      {
        kind: 'item',
        label: 'New Text Document',
        onSelect: () => {
          void sysPrompt('Enter a name for the new file:', 'New Text Document.txt', { title: 'New Text Document' }).then(async (name) => {
            if (!name) return;
            await fs.writeText(join(cwd, name), '');
            useFsStore.getState().bump();
          });
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
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Properties',
        onSelect: () => {
          const target = fs.stat(cwd);
          if (!target) return;
          void showProperties({ node: target, path: cwd, fs });
        },
      },
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
    if (clipOp === 'cut' && clipPaths.some((p) => p.toLowerCase() === path.toLowerCase())) cls.push('cut');
    return cls.join(' ');
  };

  // ---- Drag and drop ------------------------------------------------------
  const onItemDragStart = (e: React.DragEvent, n: FsNode): void => {
    const selectedNames = selection.has(n.name) && selection.size > 1
      ? Array.from(selection)
      : [n.name];
    const paths = selectedNames.map((name) => join(cwd, name));

    if (isBinMode) {
      const restoreIds = selectedNames
        .map((name) => recycleEntries.find((e2) => e2.binName === name)?.id)
        .filter((id): id is string => Boolean(id));
      setDndPayload(e, { source: 'recycle-bin', paths, restoreIds });
      return;
    }

    // Drag whatever's selected if this item is already selected; otherwise drag just this one.
    if (!selection.has(n.name)) selectOnly(n.name);
    setDndPayload(e, { source: 'fs', paths });
  };

  const onItemDragEnd = (): void => {
    // Clear selection after a successful drag-out (Win95 behavior; if the move
    // happened the items are gone, if not the user is unlikely to want them
    // selected anymore).
    setSelection(new Set());
  };

  const onBinItemDragEnd = async (_e: React.DragEvent): Promise<void> => {
    if (!recycleBin) return;
    if (!wasDropConsumed()) return;
    // After a successful drag-out, the bin folder no longer contains the item;
    // reconcile by dropping any index entry whose binPath is gone.
    const removedIds = recycleEntries
      .filter((e) => !fs.exists(`${RECYCLE_BIN_DIR}\\${e.binName}`))
      .map((e) => e.id);
    if (removedIds.length === 0) return;
    for (const id of removedIds) await recycleBin.permanentlyDelete(id);
    useRecycleBinStore.getState().refresh();
    useFsStore.getState().bump();
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
    if (errors.length > 0) void sysAlert(errors.join('\n'), { title: 'Move', icon: 'error' });
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
      {isBinMode ? (
        <div className="exp-toolbar exp-toolbar-bin">
          <button
            disabled={recycleEntries.length === 0}
            onClick={() => {
              const count = recycleEntries.length;
              const message =
                count === 1
                  ? 'Are you sure you want to permanently delete this item? This action cannot be undone.'
                  : `Are you sure you want to permanently delete these ${count} items? This action cannot be undone.`;
              void sysConfirm(message, { title: 'Confirm Multiple File Delete', icon: 'warn' }).then((ok) => {
                if (!ok || !recycleBin) return;
                void recycleBin.empty().then(() => {
                  useRecycleBinStore.getState().refresh();
                  useFsStore.getState().bump();
                });
              });
            }}
          >
            Empty Recycle Bin
          </button>
          <button
            disabled={recycleEntries.length === 0}
            onClick={() => void restoreSelection(recycleEntries.map((e) => e.binName))}
          >
            Restore All
          </button>
          <button
            disabled={selection.size === 0}
            onClick={() => void restoreSelection(Array.from(selection))}
          >
            Restore
          </button>
        </div>
      ) : (
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
      )}
      <div className="exp-addr">
        <label>Address:</label>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            if (addr.trim().toLowerCase() === 'cmd') {
              launchCmdHere();
              setAddr(cwd);
              return;
            }
            navigate(addr);
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
                onDoubleClick={() => (isBinMode ? undefined : openItem(n))}
                onContextMenu={(e) => onItemContext(e, n)}
                draggable
                onDragStart={(e) => onItemDragStart(e, n)}
                onDragEnd={isBinMode ? onBinItemDragEnd : onItemDragEnd}
                onDragOver={!isBinMode && n.kind === 'dir' ? onFolderDragOver : undefined}
                onDrop={!isBinMode && n.kind === 'dir' ? (e) => onFolderDrop(e, n.name) : undefined}
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
                onDoubleClick={() => (isBinMode ? undefined : openItem(n))}
                onContextMenu={(e) => onItemContext(e, n)}
                draggable
                onDragStart={(e) => onItemDragStart(e, n)}
                onDragEnd={isBinMode ? onBinItemDragEnd : onItemDragEnd}
                onDragOver={!isBinMode && n.kind === 'dir' ? onFolderDragOver : undefined}
                onDrop={!isBinMode && n.kind === 'dir' ? (e) => onFolderDrop(e, n.name) : undefined}
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
                  {isBinMode && <th>Original Location</th>}
                  {isBinMode && <th>Date Deleted</th>}
                  <th>Size</th>
                  <th>Type</th>
                  {!isBinMode && <th>Modified</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((n) => {
                  const entry = isBinMode
                    ? recycleEntries.find((e) => e.binName === n.name)
                    : null;
                  return (
                    <tr
                      key={n.name}
                      data-item-name={n.name}
                      className={`row ${itemClass(n)}`}
                      onClick={(e) => onItemClick(e, n.name)}
                      onDoubleClick={() => (isBinMode ? undefined : openItem(n))}
                      onContextMenu={(e) => onItemContext(e, n)}
                      draggable
                      onDragStart={(e) => onItemDragStart(e, n)}
                      onDragEnd={isBinMode ? onBinItemDragEnd : onItemDragEnd}
                      onDragOver={!isBinMode && n.kind === 'dir' ? onFolderDragOver : undefined}
                      onDrop={!isBinMode && n.kind === 'dir' ? (e) => onFolderDrop(e, n.name) : undefined}
                    >
                      <td>
                        <img src={renderIcon(n)} alt="" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {n.name}
                      </td>
                      {isBinMode && <td>{entry?.originPath ?? ''}</td>}
                      {isBinMode && <td>{entry ? new Date(entry.deletedAt).toLocaleString() : ''}</td>}
                      <td>{n.kind === 'file' ? `${n.size} B` : ''}</td>
                      <td>{n.kind === 'dir' ? 'File Folder' : 'Text Document'}</td>
                      {!isBinMode && <td>{new Date(n.modifiedAt).toLocaleDateString()}</td>}
                    </tr>
                  );
                })}
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

