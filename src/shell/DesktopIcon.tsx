import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
  const placementDoneRef = useRef(false);
  const dragStartRef = useRef<
    | { x: number; y: number; selection: string[]; positions: Record<string, { x: number; y: number }> }
    | null
  >(null);

  const commitPlacement = (endX: number, endY: number): void => {
    if (placementDoneRef.current) return;
    placementDoneRef.current = true;
    const start = dragStartRef.current;
    if (!start) return;
    if (wasDropConsumed()) {
      setSelection([]);
      return;
    }
    const dx = endX - start.x;
    const dy = endY - start.y;
    if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) {
      setSelection([]);
      return;
    }
    const taskbar = 40;
    const maxX = Math.max(0, window.innerWidth - GRID_W);
    const maxY = Math.max(0, window.innerHeight - taskbar - GRID_H);
    flushSync(() => {
      for (const id of start.selection) {
        const orig = start.positions[id];
        if (!orig) continue;
        const nx = Math.round((orig.x + dx) / GRID_W) * GRID_W;
        const ny = Math.round((orig.y + dy) / GRID_H) * GRID_H;
        const cx = Math.max(0, Math.min(maxX, nx));
        const cy = Math.max(0, Math.min(maxY, ny));
        move(id, cx, cy);
      }
    });
    setSelection([]);
  };

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
    // pointerup fires before dragend in Chrome (dragend can be delayed until
    // the next user gesture). Commit the placement here for instant snap.
    const onUp = (up: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragStartedRef.current) {
        // HTML5 drag is in flight. Try to commit using the most reliable
        // coords we have. If neither pointerup nor lastDragPos are valid,
        // dragend will commit when it fires.
        const last = getLastDragPos();
        if (last && last.x > 0 && last.y > 0) commitPlacement(last.x, last.y);
        else if (up.clientX > 0 && up.clientY > 0) commitPlacement(up.clientX, up.clientY);
        setDrag(null);
        return;
      }
      // Pointer-only path (no HTML5 drag) — synthesize a dragStartRef so
      // commitPlacement has the data it needs.
      dragStartRef.current = { x: startX, y: startY, selection: startSelection, positions: startPositions };
      placementDoneRef.current = false;
      commitPlacement(up.clientX, up.clientY);
      dragStartRef.current = null;
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

  const onDragStart = (e: React.DragEvent): void => {
    dragStartedRef.current = true;
    dragFinishedRef.current = false;
    setLastDragPos(e.clientX, e.clientY);
    const sel = useDesktopStore.getState().selection;
    const dragSet =
      sel.has(icon.id) && sel.size > 1 ? Array.from(sel) : [icon.id];
    const allIcons = useDesktopStore.getState().icons;
    const positions: Record<string, { x: number; y: number }> = {};
    for (const id of dragSet) {
      const i = allIcons[id];
      if (i) positions[id] = { x: i.x, y: i.y };
    }
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

  const onDragEnd = (e: React.DragEvent): void => {
    // Try to commit if pointerup hasn't already (Firefox may fire dragend
    // before pointerup, or pointerup may have had invalid coords).
    if (!placementDoneRef.current) {
      const last = getLastDragPos();
      if (last && last.x > 0 && last.y > 0) commitPlacement(last.x, last.y);
      else if (e.clientX > 0 && e.clientY > 0) commitPlacement(e.clientX, e.clientY);
      else commitPlacement(dragStartRef.current?.x ?? 0, dragStartRef.current?.y ?? 0);
    }
    dragStartRef.current = null;
    clearLastDragPos();
    placementDoneRef.current = false;
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
