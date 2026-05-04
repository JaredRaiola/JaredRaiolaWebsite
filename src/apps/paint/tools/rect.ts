import type { Tool } from '../types';

export const rectTool: Tool = {
  id: 'rect',
  cursor: 'crosshair',
  onDown(p, tc) {
    const start = { ...p };
    return {
      onMove(np) {
        tc.preview.clearRect(0, 0, tc.preview.canvas.width, tc.preview.canvas.height);
        tc.preview.strokeStyle = tc.fg;
        tc.preview.lineWidth = tc.size;
        tc.preview.strokeRect(start.x, start.y, np.x - start.x, np.y - start.y);
      },
      onUp(np) {
        tc.preview.clearRect(0, 0, tc.preview.canvas.width, tc.preview.canvas.height);
        tc.ctx.strokeStyle = tc.fg;
        tc.ctx.lineWidth = tc.size;
        tc.ctx.strokeRect(start.x, start.y, np.x - start.x, np.y - start.y);
      },
    };
  },
};
