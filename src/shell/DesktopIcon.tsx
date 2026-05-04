import { useEffect, useRef, useState } from 'react';
import { useDesktopStore, type DesktopIcon as Icon } from '@/stores/desktopStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useWindowStore } from '@/stores/windowStore';
import { useFsStore } from '@/stores/fsStore';
import { getApp } from '@/core/apps/registry';
import { resolveAssociation } from '@/core/apps/associations';
import {
  setDndPayload,
  getDndPayload,
  moveAllInto,
  markDropConsumed,
  wasDropConsumed,
  getLastDragPos,
  setLastDragPos,
  clearLastDragPos,
} from '@/core/fs/dnd';
import { createUrlShortcut, createAppShortcut, tryOpenShortcut } from '@/core/fs/shortcut';

const GRID_W = 84;
const GRID_H = 92;

export function DesktopIcon({ icon }: { icon: Icon }) {
  const selected = useDesktopStore((s) => s.selection.has(icon.id));
  const toggleSelect = useDesktopStore((s) => s.toggleSelect);
  const setSelection = useDesktopStore((s) => s.setSelection);
  const move = useDesktopStore((s) => s.move);
  const remove = useDesktopStore((s) => s.remove);
  const rename = useDesktopStore((s) => s.rename);
  const showCtx = useContextMenuStore((s) => s.show);
  const open = useWindowStore((s) => s.open);
  const fs = useFsStore((s) => s.fs);

  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  // While an HTML5 drag is in flight, update transforms on the dragged
  // elements directly via the document dragover. This dodges React state
  // updates per pointer move and feels instant.
  useEffect(() => {
    const handler = (e: DragEvent): void => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      for (const el of movedElementsRef.current) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    document.addEventListener('dragover', handler);
    return () => document.removeEventListener('dragover', handler);
  }, []);

  const activate = (): void => {
    if (icon.target.kind === 'app') {
      const app = getApp(icon.target.appId);
      if (!app) return;
      open(icon.target.appId, undefined, {
        title: app.displayName,
        icon: app.icon,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
        singleInstance: app.singleInstance,
      });
    } else if (icon.target.kind === 'file') {
      const path = icon.target.path;
      if (!fs?.exists(path)) return;
      const node = fs.stat(path);
      if (node?.kind === 'dir') {
        const explorer = getApp('explorer');
        if (!explorer) return;
        open(
          'explorer',
          { path },
          {
            title: 'My Computer',
            icon: explorer.icon,
            width: explorer.defaultSize.width,
            height: explorer.defaultSize.height,
          },
        );
      } else if (path.toLowerCase().endsWith('.url')) {
        void tryOpenShortcut(fs, path);
      } else {
        const appId = resolveAssociation(path);
        if (!appId) return;
        const app = getApp(appId);
        if (!app) return;
        open(
          appId,
          { path },
          {
            title: app.displayName,
            icon: app.icon,
            width: app.defaultSize.width,
            height: app.defaultSize.height,
          },
        );
      }
    } else if (icon.target.kind === 'url') {
      window.open(icon.target.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Pointer-based drag fallback (e.g., touch). For mouse, the browser begins
  // an HTML5 drag once the user moves a few pixels; we then snap-to-grid in
  // onDragEnd if no drop target consumed the drag.
  const dragStartedRef = useRef(false);
  const dragStartRef = useRef<
    | { x: number; y: number; selection: string[]; positions: Record<string, { x: number; y: number }> }
    | null
  >(null);

  const onPointerDown = (e: React.PointerEvent): void => {
    e.stopPropagation();
    dragStartedRef.current = false;
    // Click-to-select. Don't reset selection if this icon is already in it
    // (so a multi-select drag works). Single-click without modifiers and not
    // in selection = select only this.
    const sel = useDesktopStore.getState().selection;
    if (!sel.has(icon.id) && !e.shiftKey && !e.ctrlKey) {
      setSelection([icon.id]);
    } else if (e.shiftKey || e.ctrlKey) {
      toggleSelect(icon.id, true);
    } else {
      // already selected: keep as-is
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startSelection = Array.from(useDesktopStore.getState().selection);
    const startPositions: Record<string, { x: number; y: number }> = {};
    for (const id of startSelection) {
      const i = useDesktopStore.getState().icons[id];
      if (i) startPositions[id] = { x: i.x, y: i.y };
    }

    const onMove = (mv: PointerEvent) => {
      if (dragStartedRef.current) return; // HTML5 drag took over
      setDrag({ x: startPositions[icon.id].x + (mv.clientX - startX), y: startPositions[icon.id].y + (mv.clientY - startY) });
    };
    const onUp = (up: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragStartedRef.current) {
        // HTML5 drag handled it
        setDrag(null);
        return;
      }
      const dx = up.clientX - startX;
      const dy = up.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        // Snap each selected icon to grid by its delta
        for (const id of startSelection) {
          const orig = startPositions[id];
          if (!orig) continue;
          const nx = Math.round((orig.x + dx) / GRID_W) * GRID_W;
          const ny = Math.round((orig.y + dy) / GRID_H) * GRID_H;
          move(id, Math.max(0, nx), Math.max(0, ny));
        }
        // Deselect after moving (Win95-ish behavior).
        setSelection([]);
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!useDesktopStore.getState().selection.has(icon.id)) {
      setSelection([icon.id]);
    }
    showCtx(e.clientX, e.clientY, [
      { kind: 'item', label: 'Open', onSelect: activate },
      { kind: 'item', label: 'Open With...', onSelect: () => {}, disabled: true },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Rename',
        onSelect: () => {
          const next = window.prompt('New name:', icon.label);
          if (next) rename(icon.id, next);
        },
      },
      {
        kind: 'item',
        label: 'Delete',
        onSelect: () => {
          if (!window.confirm(`Delete ${icon.label}?`)) return;
          // If FS-backed and inside C:\Windows\Desktop, delete the actual file.
          if (icon.target.kind === 'file' && icon.target.path.toLowerCase().startsWith('c:\\windows\\user\\desktop\\')) {
            void fs?.unlink(icon.target.path).then(() => useFsStore.getState().bump());
          } else {
            remove(icon.id);
          }
        },
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Properties', onSelect: () => {}, disabled: true },
    ]);
  };

  const x = drag?.x ?? icon.x;
  const y = drag?.y ?? icon.y;

  const isFileTarget = icon.target.kind === 'file';
  const fileTargetPath = icon.target.kind === 'file' ? icon.target.path : null;
  const isFolderTarget = isFileTarget && fileTargetPath ? fs?.stat(fileTargetPath)?.kind === 'dir' : false;

  // 1x1 transparent ghost so the browser doesn't render its laggy default
  // drag image; we move icons live via direct DOM transforms instead.
  const blankImgRef = useRef<HTMLImageElement | null>(null);
  const movedElementsRef = useRef<HTMLElement[]>([]);

  const onDragStart = (e: React.DragEvent): void => {
    dragStartedRef.current = true;
    setLastDragPos(e.clientX, e.clientY);

    if (!blankImgRef.current) {
      const img = new Image(1, 1);
      img.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      blankImgRef.current = img;
    }
    e.dataTransfer.setDragImage(blankImgRef.current, 0, 0);

    const sel = useDesktopStore.getState().selection;
    const dragSet =
      sel.has(icon.id) && sel.size > 1 ? Array.from(sel) : [icon.id];
    const allIcons = useDesktopStore.getState().icons;
    const positions: Record<string, { x: number; y: number }> = {};
    const elements: HTMLElement[] = [];
    for (const id of dragSet) {
      const i = allIcons[id];
      if (i) positions[id] = { x: i.x, y: i.y };
      const el = document.querySelector<HTMLElement>(`.desktop-icon[data-icon-id="${id}"]`);
      if (el) {
        el.style.willChange = 'transform';
        elements.push(el);
      }
    }
    movedElementsRef.current = elements;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      selection: dragSet,
      positions,
    };

    // URL shortcut payload — receivers in folders/explorer create a `.url` file.
    if (icon.target.kind === 'url') {
      setDndPayload(e, {
        source: 'desktop',
        paths: [],
        urlShortcut: { url: icon.target.url, label: icon.label },
      });
      return;
    }
    // App shortcut payload.
    if (icon.target.kind === 'app') {
      setDndPayload(e, {
        source: 'desktop',
        paths: [],
        appShortcut: { appId: icon.target.appId, label: icon.label },
      });
      return;
    }
    // File target: drag the FS path(s). Multi-select drags the whole selection.
    let paths: string[] = [];
    let iconIds: string[] = [];
    if (sel.has(icon.id) && sel.size > 1) {
      for (const id of sel) {
        const i = allIcons[id];
        if (i?.target.kind === 'file') {
          paths.push(i.target.path);
          iconIds.push(id);
        }
      }
    } else {
      paths = [icon.target.path];
      iconIds = [icon.id];
    }
    setDndPayload(e, { source: 'desktop', paths, iconIds });
  };

  const onDragEnd = (): void => {
    const start = dragStartRef.current;
    const lastPos = getLastDragPos();
    dragStartRef.current = null;
    clearLastDragPos();
    // Clear inline transforms applied during live drag.
    for (const el of movedElementsRef.current) {
      el.style.transform = '';
      el.style.willChange = '';
    }
    movedElementsRef.current = [];
    if (start && !wasDropConsumed() && lastPos) {
      const dx = lastPos.x - start.x;
      const dy = lastPos.y - start.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        const taskbar = 40;
        const maxX = Math.max(0, window.innerWidth - GRID_W);
        const maxY = Math.max(0, window.innerHeight - taskbar - GRID_H);
        for (const id of start.selection) {
          const orig = start.positions[id];
          if (!orig) continue;
          const nx = Math.round((orig.x + dx) / GRID_W) * GRID_W;
          const ny = Math.round((orig.y + dy) / GRID_H) * GRID_H;
          const cx = Math.max(0, Math.min(maxX, nx));
          const cy = Math.max(0, Math.min(maxY, ny));
          move(id, cx, cy);
        }
      }
    }
    setSelection([]);
  };

  const onDragOver = (e: React.DragEvent): void => {
    if (!isFolderTarget) return;
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent): void => {
    if (!isFolderTarget || !fileTargetPath) return;
    const payload = getDndPayload(e);
    if (!payload || !fs) return;
    e.preventDefault();
    e.stopPropagation();
    markDropConsumed();
    const dest = fileTargetPath;
    void (async () => {
      if (payload.urlShortcut) {
        await createUrlShortcut(fs, dest, payload.urlShortcut.label, payload.urlShortcut.url);
      } else if (payload.appShortcut) {
        await createAppShortcut(fs, dest, payload.appShortcut.label, payload.appShortcut.appId);
      } else {
        const filtered = payload.paths.filter((p) => p.toLowerCase() !== dest.toLowerCase());
        const { errors } = await moveAllInto(fs, filtered, dest);
        if (errors.length > 0) alert(errors.join('\n'));
      }
      useFsStore.getState().bump();
    })();
  };

  return (
    <div
      ref={ref}
      className={`desktop-icon ${selected ? 'selected' : ''}`}
      style={{ left: x, top: y }}
      onPointerDown={onPointerDown}
      onDoubleClick={activate}
      onContextMenu={onContextMenu}
      data-icon-id={icon.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={isFolderTarget ? onDragOver : undefined}
      onDrop={isFolderTarget ? onDrop : undefined}
    >
      <img src={icon.iconUrl} alt="" draggable={false} />
      <div className="label">{icon.label}</div>
    </div>
  );
}
