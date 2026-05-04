import type { Tool } from '../types';

export function floodFill(
  img: ImageData,
  startX: number,
  startY: number,
  target: [number, number, number, number],
): void {
  const { data, width, height } = img;
  const idx = (x: number, y: number) => (y * width + x) * 4;
  const sx = idx(startX, startY);
  const seed = [data[sx], data[sx + 1], data[sx + 2], data[sx + 3]] as const;
  if (
    seed[0] === target[0] &&
    seed[1] === target[1] &&
    seed[2] === target[2] &&
    seed[3] === target[3]
  )
    return;
  const matches = (i: number) =>
    data[i] === seed[0] &&
    data[i + 1] === seed[1] &&
    data[i + 2] === seed[2] &&
    data[i + 3] === seed[3];
  const set = (i: number) => {
    data[i] = target[0];
    data[i + 1] = target[1];
    data[i + 2] = target[2];
    data[i + 3] = target[3];
  };
  const stack: [number, number][] = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    let xl = x;
    while (xl >= 0 && matches(idx(xl, y))) xl--;
    let xr = x;
    while (xr < width && matches(idx(xr, y))) xr++;
    for (let i = xl + 1; i < xr; i++) {
      set(idx(i, y));
      if (y > 0 && matches(idx(i, y - 1))) stack.push([i, y - 1]);
      if (y < height - 1 && matches(idx(i, y + 1))) stack.push([i, y + 1]);
    }
  }
}

export const fillTool: Tool = {
  id: 'fill',
  cursor: 'crosshair',
  onDown(p, tc) {
    const w = tc.ctx.canvas.width;
    const h = tc.ctx.canvas.height;
    const img = tc.ctx.getImageData(0, 0, w, h);
    const m = tc.fg.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    const target: [number, number, number, number] = m
      ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 255]
      : [0, 0, 0, 255];
    floodFill(img, Math.floor(p.x), Math.floor(p.y), target);
    tc.ctx.putImageData(img, 0, 0);
    return {};
  },
};
