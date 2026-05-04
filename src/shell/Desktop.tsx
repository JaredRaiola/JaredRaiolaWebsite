import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDesktopStore } from '@/stores/desktopStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useFsStore } from '@/stores/fsStore';
import { useThemeStore, wallpaperUrl } from '@/stores/themeStore';
import { DesktopIcon } from './DesktopIcon';
import { getDndPayload, moveAllInto } from '@/core/fs/dnd';
import { createUrlShortcut, createAppShortcut } from '@/core/fs/shortcut';
import { join } from '@/core/fs/paths';
import { DESKTOP_DIR } from '@/core/boot';
import './Desktop.css';

export function Desktop() {
  const icons = useDesktopStore(useShallow((s) => Object.values(s.icons)));
  const setSelection = useDesktopStore((s) => s.setSelection);
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

  const onDesktopDragOver = (e: React.DragEvent): void => {
    if (!e.dataTransfer.types.includes('application/x-win95-fs')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDesktopDrop = (e: React.DragEvent): void => {
    const payload = getDndPayload(e);
    if (!payload || !fs) return;
    // Anything originating from the desktop dropped back on the desktop is a
    // reposition — DesktopIcon's onDragEnd handles the snap. Don't create
    // shortcut files or no-op move.
    if (payload.source === 'desktop') return;
    e.preventDefault();
    void (async () => {
      if (payload.urlShortcut) {
        await createUrlShortcut(fs, DESKTOP_DIR, payload.urlShortcut.label, payload.urlShortcut.url);
        useFsStore.getState().bump();
        return;
      }
      if (payload.appShortcut) {
        await createAppShortcut(fs, DESKTOP_DIR, payload.appShortcut.label, payload.appShortcut.appId);
        useFsStore.getState().bump();
        return;
      }
      const { errors } = await moveAllInto(fs, payload.paths, DESKTOP_DIR, {
        silentSameFolder: true,
      });
      if (errors.length > 0) alert(errors.join('\n'));
      useFsStore.getState().bump();
    })();
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
        onSelect: () => {
          if (!fs) return;
          const name = window.prompt('Folder name:', 'New Folder');
          if (!name) return;
          void fs.mkdir(join(DESKTOP_DIR, name)).then(() => useFsStore.getState().bump());
        },
      },
      {
        kind: 'item',
        label: 'New Text Document',
        onSelect: () => {
          if (!fs) return;
          const name = window.prompt('File name:', 'New Text Document.txt');
          if (!name) return;
          void fs.writeText(join(DESKTOP_DIR, name), '').then(() => useFsStore.getState().bump());
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
