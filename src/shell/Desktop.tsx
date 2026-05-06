import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDesktopStore } from '@/stores/desktopStore';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import { useFsStore } from '@/stores/fsStore';
import { useThemeStore, wallpaperUrl } from '@/stores/themeStore';
import { useWindowStore } from '@/stores/windowStore';
import { getApp } from '@/core/apps/registry';
import { DesktopIcon } from './DesktopIcon';
import { getDndPayload, moveAllInto, markDropConsumed } from '@/core/fs/dnd';
import { createUrlShortcut, createAppShortcut } from '@/core/fs/shortcut';
import { join } from '@/core/fs/paths';
import { DESKTOP_DIR } from '@/core/boot';
import { sysAlert, sysPrompt } from '@/lib/dialog';
import './Desktop.css';

export function Desktop() {
  const icons = useDesktopStore(useShallow((s) => Object.values(s.icons)));
  const setSelection = useDesktopStore((s) => s.setSelection);
  const showCtx = useContextMenuStore((s) => s.show);
  const fs = useFsStore((s) => s.fs);
  const wallpaperKey = useThemeStore((s) => s.wallpaperKey);
  const bgColor = useThemeStore((s) => s.bgColor);
  const wallpaperMode = useThemeStore((s) => s.wallpaperMode);

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
    // Always preventDefault on drop — even when we're not actually moving
    // anything — so the browser doesn't run its slow ghost-snap-back
    // animation. DesktopIcon's onDragEnd handles intra-desktop reposition.
    e.preventDefault();
    if (payload.source === 'desktop') return;
    markDropConsumed();
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
      if (errors.length > 0) void sysAlert(errors.join('\n'), { title: 'Move', icon: 'error' });
      useFsStore.getState().bump();
    })();
  };

  const onPointerDown = (e: React.PointerEvent): void => {
    if (e.target !== ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setSelection([]);
    // Only start drawing the lasso once the pointer has moved a few pixels;
    // a plain click (with natural hand jitter) shouldn't paint a 1×1 dotted
    // speck on the desktop.
    const DRAG_THRESHOLD = 4;
    let dragging = false;
    const onMove = (mv: PointerEvent) => {
      const cx = mv.clientX - rect.left;
      const cy = mv.clientY - rect.top;
      if (!dragging) {
        if (Math.abs(cx - startX) < DRAG_THRESHOLD && Math.abs(cy - startY) < DRAG_THRESHOLD) return;
        dragging = true;
      }
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
    // Clean up on pointerup *and* pointercancel — touch pointers and some
    // browser states (e.g., lost capture) fire cancel instead of up, which
    // would otherwise leave the lasso stuck on screen.
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
      window.removeEventListener('pointercancel', cleanup);
      window.removeEventListener('blur', cleanup);
      setLasso(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup);
    window.addEventListener('pointercancel', cleanup);
    window.addEventListener('blur', cleanup);
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
          void sysPrompt('Enter a name for the new folder:', 'New Folder', { title: 'New Folder' }).then((name) => {
            if (!name) return;
            void fs.mkdir(join(DESKTOP_DIR, name)).then(() => useFsStore.getState().bump());
          });
        },
      },
      {
        kind: 'item',
        label: 'New Text Document',
        onSelect: () => {
          if (!fs) return;
          void sysPrompt('Enter a name for the new file:', 'New Text Document.txt', { title: 'New Text Document' }).then((name) => {
            if (!name) return;
            void fs.writeText(join(DESKTOP_DIR, name), '').then(() => useFsStore.getState().bump());
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
          const cp = getApp('controlpanel');
          if (!cp) return;
          useWindowStore.getState().open('controlpanel', { tab: 'display' }, {
            title: cp.displayName,
            icon: cp.icon,
            width: cp.defaultSize.width,
            height: cp.defaultSize.height,
            singleInstance: true,
          });
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
        backgroundRepeat: wallpaperMode === 'tile' ? 'repeat' : 'no-repeat',
        backgroundSize: wallpaperMode === 'stretch' ? '100% 100%' : 'auto',
        backgroundPosition: 'center',
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
      <div className="desktop-watermark" aria-hidden="true">
        <div className="desktop-watermark-line1">Windows 95 facsimile</div>
        <div className="desktop-watermark-line2">Not affiliated with Microsoft.</div>
      </div>
    </div>
  );
}
