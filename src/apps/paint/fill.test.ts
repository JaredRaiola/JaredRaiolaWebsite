import { describe, it, expect } from 'vitest';
import { floodFill } from './tools/fill';

const makeImage = (
  w: number,
  h: number,
  fill: [number, number, number, number],
): ImageData => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return { data, width: w, height: h, colorSpace: 'srgb' } as ImageData;
};

describe('floodFill', () => {
  it('fills a uniform region', () => {
    const img = makeImage(2, 2, [255, 255, 255, 255]);
    floodFill(img, 0, 0, [255, 0, 0, 255]);
    expect(Array.from(img.data)).toEqual([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
    ]);
  });

  it('does not cross color boundaries', () => {
    const img = makeImage(2, 1, [255, 255, 255, 255]);
    img.data.set([0, 0, 0, 255], 4); // right pixel is black
    floodFill(img, 0, 0, [255, 0, 0, 255]);
    expect(Array.from(img.data)).toEqual([255, 0, 0, 255, 0, 0, 0, 255]);
  });

  it('no-op when seed already matches target color', () => {
    const img = makeImage(1, 1, [255, 0, 0, 255]);
    floodFill(img, 0, 0, [255, 0, 0, 255]);
    expect(Array.from(img.data)).toEqual([255, 0, 0, 255]);
  });

  it('fills only connected region in a divided image', () => {
    // 3x1: [white, black, white] — fill left white, right white unchanged
    const img = makeImage(3, 1, [255, 255, 255, 255]);
    img.data.set([0, 0, 0, 255], 4); // middle pixel black
    floodFill(img, 0, 0, [0, 0, 255, 255]); // fill left with blue
    expect(img.data[0]).toBe(0); // left: blue R
    expect(img.data[2]).toBe(255); // left: blue B
    expect(img.data[4]).toBe(0); // middle: black R (unchanged)
    expect(img.data[8]).toBe(255); // right: white R (unchanged)
  });
});
