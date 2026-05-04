import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { FileDialog } from '@/shell/FileDialog';
import { basename } from '@/core/fs/paths';
import { useWindowStore } from '@/stores/windowStore';
import { useHotkeys } from '@/lib/useHotkeys';
import { History } from './history';
import { PaintCanvas, type PaintCanvasRef } from './canvas';
import { Toolbox } from './toolbox';
import { Palette } from './palette';
import { pencilTool } from './tools/pencil';
import { brushTool } from './tools/brush';
import { eraserTool } from './tools/eraser';
import { fillTool } from './tools/fill';
import { lineTool } from './tools/line';
import { rectTool } from './tools/rect';
import { ellipseTool } from './tools/ellipse';
import { pickerTool } from './tools/picker';
import type { Tool } from './types';
import './paint.css';

const CANVAS_W = 480;
const CANVAS_H = 360;
const HISTORY_CAPACITY = 32;

const TOOLS: Record<Tool['id'], Tool> = {
  pencil: pencilTool,
  brush: brushTool,
  eraser: eraserTool,
  fill: fillTool,
  line: lineTool,
  rect: rectTool,
  ellipse: ellipseTool,
  picker: pickerTool,
};

const BRUSH_SIZES = [3, 5, 9];

type Args = { path?: string };
type DialogMode = 'open' | 'save' | null;

type MenuItem =
  | { label: string; onSelect?: () => void; disabled?: boolean; kind?: undefined }
  | { kind: 'sep' };

function Menu({
  label,
  items,
  openMenu,
  setOpenMenu,
}: {
  label: string;
  items: MenuItem[];
  openMenu: string | null;
  setOpenMenu: (s: string | null) => void;
}) {
  const open = openMenu === label;
  return (
    <div
      className={`paint-menu${open ? ' open' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenu(open ? null : label);
      }}
    >
      {label}
      {open && (
        <div className="paint-menu-popup">
          {items.map((it, i) =>
            'kind' in it && it.kind === 'sep' ? (
              <div key={i} className="sep" />
            ) : (
              <div
                key={i}
                className={`item ${'disabled' in it && it.disabled ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if ('disabled' in it && it.disabled) return;
                  if ('onSelect' in it) it.onSelect?.();
                  setOpenMenu(null);
                }}
              >
                {(it as { label: string }).label}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function Paint({ api, fs, args }: AppProps) {
  const initial = (args as Args | undefined) ?? {};
  const [toolId, setToolId] = useState<Tool['id']>('pencil');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [size, setSize] = useState(3);
  const [path, setPath] = useState<string | null>(initial.path ?? null);
  const [dirty, setDirty] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<PaintCanvasRef>(null);
  const historyRef = useRef<History>(new History(HISTORY_CAPACITY));
  const pendingResolve = useRef<((b: boolean) => void) | null>(null);

  const focused = useWindowStore((s) => s.focusedId === api.windowId);
  const currentTool = TOOLS[toolId];

  // Update window title
  useEffect(() => {
    const title = (path ? basename(path) : 'Untitled') + (dirty ? ' *' : '') + ' - Paint';
    api.setTitle(title);
  }, [path, dirty, api]);

  // Open file passed as arg on mount
  useEffect(() => {
    if (!initial.path) return;
    void loadFromPath(initial.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCtx = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current?.getCanvas();
    return canvas ? canvas.getContext('2d') : null;
  };

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    historyRef.current.push(imgData);
    setDirty(true);
  }, []);

  const applySnapshot = (imgData: ImageData | null) => {
    if (!imgData) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.putImageData(imgData, 0, 0);
  };

  const undo = useCallback(() => {
    const imgData = historyRef.current.undo();
    applySnapshot(imgData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redo = useCallback(() => {
    const imgData = historyRef.current.redo();
    applySnapshot(imgData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    historyRef.current.reset(imgData);
    setDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg]);

  const invertColors = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(imgData, 0, 0);
    historyRef.current.push(imgData);
    setDirty(true);
  }, []);

  const loadFromPath = async (filePath: string) => {
    try {
      const blob = await fs.readBlob(filePath);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Scale to fit while preserving aspect ratio
        const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (CANVAS_W - w) / 2;
        const y = (CANVAS_H - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        URL.revokeObjectURL(url);
        const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        historyRef.current.reset(imgData);
        setPath(filePath);
        setDirty(false);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } catch {
      await api.showDialog({
        title: 'Paint',
        message: 'Could not open file.',
        buttons: ['ok'],
        icon: 'error',
      });
    }
  };

  const newFile = async () => {
    if (dirty && !(await confirmDiscard())) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    historyRef.current.reset(imgData);
    setPath(null);
    setDirty(false);
  };

  const save = async (): Promise<boolean> => {
    if (!path) return saveAs();
    return writeToDisk(path);
  };

  const saveAs = (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialogMode('save');
      pendingResolve.current = resolve;
    });
  };

  const writeToDisk = async (filePath: string): Promise<boolean> => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return false;
    return new Promise<boolean>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await fs.writeBlob(filePath, blob, 'image/png');
          setPath(filePath);
          setDirty(false);
          resolve(true);
        } catch {
          await api.showDialog({
            title: 'Paint',
            message: 'Could not save file.',
            buttons: ['ok'],
            icon: 'error',
          });
          resolve(false);
        }
      }, 'image/png');
    });
  };

  const confirmDiscard = async (): Promise<boolean> => {
    const r = await api.showDialog({
      title: 'Paint',
      message: `Save changes to ${path ? basename(path) : 'Untitled'}?`,
      buttons: ['yes', 'no', 'cancel'],
      icon: 'question',
    });
    if (r === 'cancel') return false;
    if (r === 'yes') {
      const ok = await save();
      if (!ok) return false;
    }
    return true;
  };

  const handlePickColor = useCallback((hex: string) => {
    setFg(hex);
  }, []);

  useHotkeys(
    {
      'ctrl+z': undo,
      'ctrl+y': redo,
      'ctrl+n': () => void newFile(),
      'ctrl+o': () => setDialogMode('open'),
      'ctrl+s': () => void save(),
    },
    { enabled: focused },
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    if (x >= 0 && x < CANVAS_W && y >= 0 && y < CANVAS_H) {
      setCoords({ x, y });
    } else {
      setCoords(null);
    }
  };

  const handlePointerLeave = () => setCoords(null);

  return (
    <div
      className="paint-root"
      onClick={() => setOpenMenu(null)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Menu bar */}
      <div className="paint-menubar">
        <Menu
          label="File"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[
            { label: 'New', onSelect: () => void newFile() },
            { label: 'Open...', onSelect: () => setDialogMode('open') },
            { label: 'Save', onSelect: () => void save() },
            { label: 'Save As...', onSelect: () => void saveAs() },
            { kind: 'sep' },
            { label: 'Exit', onSelect: () => void api.requestClose() },
          ]}
        />
        <Menu
          label="Edit"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[
            { label: 'Undo\tCtrl+Z', onSelect: undo },
            { label: 'Redo\tCtrl+Y', onSelect: redo },
          ]}
        />
        <Menu
          label="Image"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[
            { label: 'Clear Image', onSelect: clearCanvas },
            { label: 'Invert Colors', onSelect: invertColors },
          ]}
        />
      </div>

      {/* Workspace */}
      <div className="paint-workspace">
        {/* Toolbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Toolbox active={toolId} onPick={setToolId} />
          {/* Brush size (only shown for brush/eraser) */}
          {(toolId === 'brush' || toolId === 'eraser') && (
            <div className="paint-sizes" style={{ padding: '4px', flexDirection: 'column' }}>
              {BRUSH_SIZES.map((s) => (
                <button
                  key={s}
                  className={`paint-size-btn${size === s ? ' active' : ''}`}
                  onClick={() => setSize(s)}
                >
                  {s}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas scroll area */}
        <div className="paint-scroll">
          <PaintCanvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            tool={currentTool}
            fg={fg}
            bg={bg}
            size={toolId === 'pencil' ? 1 : size}
            onSnapshot={snapshot}
            onPickColor={handlePickColor}
          />
        </div>
      </div>

      {/* Palette */}
      <Palette fg={fg} bg={bg} onSetFg={setFg} onSetBg={setBg} />

      {/* Status bar */}
      <div className="paint-status">
        <span className="paint-status-pane">{toolId}</span>
        <span className="paint-status-pane">
          {coords ? `${coords.x}, ${coords.y}` : ''}
        </span>
        <span className="paint-status-pane">{CANVAS_W} × {CANVAS_H}</span>
      </div>

      {/* File dialog */}
      {dialogMode && (
        <FileDialog
          mode={dialogMode}
          initialPath={
            path
              ? path.replace(/\\[^\\]+$/, '')
              : 'C:\\Windows\\User\\My Documents'
          }
          defaultFileName={path ? basename(path) : 'untitled.png'}
          filterExt={['.png']}
          onCancel={() => {
            setDialogMode(null);
            pendingResolve.current?.(false);
            pendingResolve.current = null;
          }}
          onSubmit={async (chosen) => {
            const filePath = chosen.toLowerCase().endsWith('.png')
              ? chosen
              : chosen + '.png';
            if (dialogMode === 'open') {
              await loadFromPath(filePath);
            } else {
              await writeToDisk(filePath);
              pendingResolve.current?.(true);
              pendingResolve.current = null;
            }
            setDialogMode(null);
          }}
        />
      )}
    </div>
  );
}
