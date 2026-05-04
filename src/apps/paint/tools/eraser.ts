import type { Tool } from '../types';

function drawEraserDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
}

function drawEraserLine(
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
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

export const eraserTool: Tool = {
  id: 'eraser',
  cursor: 'crosshair',
  onDown(p, tc) {
    drawEraserDot(tc.ctx, p.x, p.y, tc.bg, tc.size);
    let last = p;
    return {
      onMove(np) {
        drawEraserLine(tc.ctx, last.x, last.y, np.x, np.y, tc.bg, tc.size);
        last = np;
      },
    };
  },
};
