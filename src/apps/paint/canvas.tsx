import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Tool, ToolContext } from './types';

export type PaintCanvasRef = {
  getCanvas(): HTMLCanvasElement | null;
};

type Props = {
  width: number;
  height: number;
  tool: Tool;
  fg: string;
  bg: string;
  size: number;
  onSnapshot(): void;
  onPickColor(hex: string): void;
};

export const PaintCanvas = forwardRef<PaintCanvasRef, Props>(function PaintCanvas(
  { width, height, tool, fg, bg, size, onSnapshot, onPickColor },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  useEffect(() => {
    const c = canvasRef.current!;
    const onPick = (e: Event) => {
      const ev = e as CustomEvent<string>;
      onPickColor(ev.detail);
    };
    c.addEventListener('paint:pickColor', onPick as EventListener);
    return () => c.removeEventListener('paint:pickColor', onPick as EventListener);
  }, [onPickColor]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const c = canvasRef.current!;
    const p = previewRef.current!;
    const ctx = c.getContext('2d')!;
    const pctx = p.getContext('2d')!;
    const rect = c.getBoundingClientRect();
    const tc: ToolContext = { ctx, preview: pctx, fg, bg, size };
    onSnapshot();
    const handlers = tool.onDown(
      { x: Math.floor(e.clientX - rect.left), y: Math.floor(e.clientY - rect.top) },
      tc,
    );

    const onMove = (mv: PointerEvent) => {
      const np = {
        x: Math.floor(mv.clientX - rect.left),
        y: Math.floor(mv.clientY - rect.top),
      };
      handlers.onMove?.(np);
    };
    const onUp = (up: PointerEvent) => {
      const np = {
        x: Math.floor(up.clientX - rect.left),
        y: Math.floor(up.clientY - rect.top),
      };
      handlers.onUp?.(np);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className="paint-canvas-wrap"
      style={{ width, height, cursor: tool.cursor, position: 'relative', flexShrink: 0 }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="paint-canvas-main"
        onPointerDown={onPointerDown}
        style={{ position: 'absolute', top: 0, left: 0, imageRendering: 'pixelated' }}
      />
      <canvas
        ref={previewRef}
        width={width}
        height={height}
        className="paint-canvas-preview"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          imageRendering: 'pixelated',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});
