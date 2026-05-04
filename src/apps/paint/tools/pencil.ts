import type { Tool } from '../types';

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

export const pencilTool: Tool = {
  id: 'pencil',
  cursor: 'crosshair',
  onDown(p, tc) {
    drawDot(tc.ctx, p.x, p.y, tc.fg, 1);
    let last = p;
    return {
      onMove(np) {
        drawLine(tc.ctx, last.x, last.y, np.x, np.y, tc.fg, 1);
        last = np;
      },
    };
  },
};
