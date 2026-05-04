import type { Tool } from '../types';

export const pickerTool: Tool = {
  id: 'picker',
  cursor: 'crosshair',
  onDown(p, tc) {
    const px = tc.ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
    const hex =
      '#' +
      [px[0], px[1], px[2]]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const evt = new CustomEvent('paint:pickColor', { detail: hex });
    tc.ctx.canvas.dispatchEvent(evt);
    return {};
  },
};
