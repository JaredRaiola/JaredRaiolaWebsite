import type { Tool } from '../types';

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
) {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;
  if (rx === 0 || ry === 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export const ellipseTool: Tool = {
  id: 'ellipse',
  cursor: 'crosshair',
  onDown(p, tc) {
    const start = { ...p };
    return {
      onMove(np) {
        tc.preview.clearRect(0, 0, tc.preview.canvas.width, tc.preview.canvas.height);
        drawEllipse(tc.preview, start.x, start.y, np.x, np.y, tc.fg, tc.size);
      },
      onUp(np) {
        tc.preview.clearRect(0, 0, tc.preview.canvas.width, tc.preview.canvas.height);
        drawEllipse(tc.ctx, start.x, start.y, np.x, np.y, tc.fg, tc.size);
      },
    };
  },
};
