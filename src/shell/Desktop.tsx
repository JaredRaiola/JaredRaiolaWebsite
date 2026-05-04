import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDesktopStore } from '@/stores/desktopStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useFsStore } from '@/stores/fsStore';
import { useThemeStore, wallpaperUrl } from '@/stores/themeStore';
import { DesktopIcon } from './DesktopIcon';
import { uuid } from '@/lib/uuid';
import { getDndPayload } from '@/core/fs/dnd';
import { basename } from '@/core/fs/paths';
import './Desktop.css';

export function Desktop() {
  const icons = useDesktopStore(useShallow((s) => Object.values(s.icons)));
  const setSelection = useDesktopStore((s) => s.setSelection);
  const add = useDesktopStore((s) => s.add);
  const showCtx = useContextMenuStore((s) => s.show);
  const fs = useFsStore((s) => s.fs);
  const wallpaperKey = useThemeStore((s) => s.wallpaperKey);
  const bgColor = useThemeStore((s) => s.bgColor);

  const wallpaper = wallpaperUrl(wallpaperKey);
  const ref = useRef<HTMLDivElement>(null);
  const [lasso, setLasso] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = (): void => {
    setRefreshing(true);
    useFsStore.getState().bump();
    setTimeout(() => setRefreshing(false), 120);
  };

  // Drop handler: when a file is dragged from explorer onto the desktop
  // background, create a desktop shortcut icon pointing at it (does not move
  // the underlying file). Dragging an existing desktop icon onto the desktop
  // is a no-op (icon dragging itself is handled by DesktopIcon).
  const onDesktopDragOver = (e: React.DragEvent): void => {
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDesktopDrop = (e: React.DragEvent): void => {
    const payload = getDndPayload(e);
    if (!payload) return;
    if (payload.source === 'desktop') return; // desktop icon repositioning is handled elsewhere
    e.preventDefault();
    if (!fs) return;
    const node = fs.stat(payload.path);
    if (!node) return;
    // Skip if a shortcut already exists for this path
    const existing = Object.values(useDesktopStore.getState().icons).find(
      (i) => i.target.kind === 'file' && i.target.path.toLowerCase() === payload.path.toLowerCase(),
    );
    if (existing) return;
    const dropX = Math.max(0, Math.round((e.clientX - 40) / 84) * 84);
    const dropY = Math.max(0, Math.round((e.clientY - 40) / 92) * 92);
    add({
      id: uuid(),
      label: basename(payload.path),
      iconUrl:
        node.kind === 'dir'
          ? '/assets/win98/png/directory_closed-0.png'
          : payload.path.toLowerCase().endsWith('.txt')
            ? '/assets/win98/png/notepad-0.png'
            : '/assets/win98/png/file_lines-0.png',
      x: dropX,
      y: dropY,
      target: { kind: 'file', path: payload.path },
    });
  };

  const onPointerDown = (e: React.PointerEvent): void => {
    if (e.target !== ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setSelection([]);
    const onMove = (mv: PointerEvent) => {
      const cx = mv.clientX - rect.left;
      const cy = mv.clientY - rect.top;
      setLasso({
        x: Math.min(startX, cx),
        y: Math.min(startY, cy),
        w: Math.abs(cx - startX),
        h: Math.abs(cy - startY),
      });
      const sel: string[] = [];
      ref.current!.querySelectorAll<HTMLDivElement>('.desktop-icon').forEach((el) => {
        const r = el.getBoundingClientRect();
        const x1 = r.left - rect.left;
        const y1 = r.top - rect.top;
        const x2 = x1 + r.width;
        const y2 = y1 + r.height;
        const lx1 = Math.min(startX, cx);
        const ly1 = Math.min(startY, cy);
        const lx2 = Math.max(startX, cx);
        const ly2 = Math.max(startY, cy);
        if (x1 < lx2 && x2 > lx1 && y1 < ly2 && y2 > ly1) {
          sel.push(el.dataset.iconId!);
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

  const onContextMenu = (e: React.MouseEvent): void => {
    if (e.target !== ref.current) return;
    e.preventDefault();
    showCtx(e.clientX, e.clientY, [
      {
        kind: 'item',
        label: 'New Folder',
        onSelect: async () => {
          if (!fs) return;
          const name = window.prompt('Folder name:', 'New Folder');
          if (!name) return;
          add({
            id: uuid(),
            label: name,
            iconUrl: '/assets/win98/png/directory_closed-0.png',
            x: 0,
            y: 0,
            target: { kind: 'file', path: `C:\\Windows\\Desktop\\${name}` },
          });
          await fs.mkdir(`C:\\Windows\\Desktop\\${name}`);
        },
      },
      {
        kind: 'item',
        label: 'New Text Document',
        onSelect: async () => {
          if (!fs) return;
          const name = window.prompt('File name:', 'New Text Document.txt');
          if (!name) return;
          await fs.writeText(`C:\\Windows\\Desktop\\${name}`, '');
          add({
            id: uuid(),
            label: name,
            iconUrl: '/assets/win98/png/notepad-0.png',
            x: 0,
            y: 0,
            target: { kind: 'file', path: `C:\\Windows\\Desktop\\${name}` },
          });
        },
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Refresh', onSelect: refresh },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Properties',
        onSelect: () => {
          alert('Display Properties — coming in Phase 2');
        },
      },
    ]);
  };

  return (
    <div
      ref={ref}
      className={`desktop ${refreshing ? 'refreshing' : ''}`}
      style={{
        backgroundColor: bgColor,
        backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
      }}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onDragOver={onDesktopDragOver}
      onDrop={onDesktopDrop}
    >
      {icons.map((i) => (
        <DesktopIcon key={i.id} icon={i} />
      ))}
      {lasso && <div className="lasso" style={{ left: lasso.x, top: lasso.y, width: lasso.w, height: lasso.h }} />}
    </div>
  );
}
