import { useRef, useState } from 'react';
import { useDesktopStore, type DesktopIcon as Icon } from '@/stores/desktopStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useWindowStore } from '@/stores/windowStore';
import { useFsStore } from '@/stores/fsStore';
import { getApp } from '@/core/apps/registry';
import { resolveAssociation } from '@/core/apps/associations';
import { setDndPayload, getDndPayload, moveInto } from '@/core/fs/dnd';

const GRID_W = 84;
const GRID_H = 92;

export function DesktopIcon({ icon }: { icon: Icon }) {
  const selected = useDesktopStore((s) => s.selection.has(icon.id));
  const toggleSelect = useDesktopStore((s) => s.toggleSelect);
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
        open('explorer', { path }, {
          title: 'My Computer',
          icon: explorer.icon,
          width: explorer.defaultSize.width,
          height: explorer.defaultSize.height,
        });
      } else {
        const appId = resolveAssociation(path);
        if (!appId) return;
        const app = getApp(appId);
        if (!app) return;
        open(appId, { path }, {
          title: app.displayName,
          icon: app.icon,
          width: app.defaultSize.width,
          height: app.defaultSize.height,
        });
      }
    } else if (icon.target.kind === 'url') {
      window.open(icon.target.url, '_blank', 'noopener,noreferrer');
    }
  };

  const onPointerDown = (e: React.PointerEvent): void => {
    e.stopPropagation();
    toggleSelect(icon.id, e.shiftKey || e.ctrlKey);
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = icon.x;
    const origY = icon.y;
    const onMove = (mv: PointerEvent) => {
      setDrag({ x: origX + (mv.clientX - startX), y: origY + (mv.clientY - startY) });
    };
    const onUp = (up: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const dx = up.clientX - startX;
      const dy = up.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        const nx = Math.round((origX + dx) / GRID_W) * GRID_W;
        const ny = Math.round((origY + dy) / GRID_H) * GRID_H;
        move(icon.id, Math.max(0, nx), Math.max(0, ny));
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelect(icon.id, false);
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
          if (window.confirm(`Delete ${icon.label}?`)) remove(icon.id);
        },
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Properties', onSelect: () => {}, disabled: true },
    ]);
  };

  const x = drag?.x ?? icon.x;
  const y = drag?.y ?? icon.y;

  const isFileTarget = icon.target.kind === 'file';
  const isFolderTarget = isFileTarget && fs?.stat(icon.target.kind === 'file' ? icon.target.path : '')?.kind === 'dir';

  const onDragStart = (e: React.DragEvent): void => {
    if (icon.target.kind !== 'file') return;
    setDndPayload(e, { source: 'desktop', path: icon.target.path, iconId: icon.id });
  };

  const onDragOver = (e: React.DragEvent): void => {
    if (!isFolderTarget) return;
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent): void => {
    if (!isFolderTarget || icon.target.kind !== 'file') return;
    const payload = getDndPayload(e);
    if (!payload || !fs) return;
    e.preventDefault();
    e.stopPropagation();
    const dest = icon.target.path;
    void (async () => {
      const result = await moveInto(fs, payload.path, dest);
      if (!result.ok) {
        if (result.reason !== 'Already in this folder.') alert(result.reason);
        return;
      }
      if (payload.source === 'desktop' && payload.iconId && payload.iconId !== icon.id) {
        useDesktopStore.getState().remove(payload.iconId);
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
      draggable={isFileTarget}
      onDragStart={isFileTarget ? onDragStart : undefined}
      onDragOver={isFolderTarget ? onDragOver : undefined}
      onDrop={isFolderTarget ? onDrop : undefined}
    >
      <img src={icon.iconUrl} alt="" draggable={false} />
      <div className="label">{icon.label}</div>
    </div>
  );
}
