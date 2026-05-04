import type { Tool } from '../types';

export const lineTool: Tool = {
  id: 'line',
  cursor: 'crosshair',
  onDown(p, tc) {
    const start = { ...p };
    return {
      onMove(np) {
        tc.preview.clearRect(0, 0, tc.preview.canvas.width, tc.preview.canvas.height);
        tc.preview.strokeStyle = tc.fg;
        tc.preview.lineWidth = tc.size;
        tc.preview.lineCap = 'round';
        tc.preview.beginPath();
        tc.preview.moveTo(start.x, start.y);
        tc.preview.lineTo(np.x, np.y);
        tc.preview.stroke();
      },
      onUp(np) {
        tc.preview.clearRect(0, 0, tc.preview.canvas.width, tc.preview.canvas.height);
        tc.ctx.strokeStyle = tc.fg;
        tc.ctx.lineWidth = tc.size;
        tc.ctx.lineCap = 'round';
        tc.ctx.beginPath();
        tc.ctx.moveTo(start.x, start.y);
        tc.ctx.lineTo(np.x, np.y);
        tc.ctx.stroke();
      },
    };
  },
};
