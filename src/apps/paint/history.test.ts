import { describe, it, expect } from 'vitest';
import { History } from './history';

const fakeImage = (n: number): ImageData =>
  ({ data: new Uint8ClampedArray([n, 0, 0, 255]), width: 1, height: 1, colorSpace: 'srgb' }) as ImageData;

describe('History', () => {
  it('records and replays via undo/redo', () => {
    const h = new History(8);
    h.push(fakeImage(1));
    h.push(fakeImage(2));
    h.push(fakeImage(3));
    expect(h.undo()?.data[0]).toBe(2);
    expect(h.undo()?.data[0]).toBe(1);
    expect(h.redo()?.data[0]).toBe(2);
  });

  it('clears redo stack on a fresh push', () => {
    const h = new History(8);
    h.push(fakeImage(1));
    h.push(fakeImage(2));
    h.undo();
    h.push(fakeImage(99));
    expect(h.redo()).toBeNull();
  });

  it('caps at capacity (drops oldest)', () => {
    const h = new History(3);
    [1, 2, 3, 4, 5].forEach((n) => h.push(fakeImage(n)));
    let last: ImageData | null = null;
    while (true) {
      const x = h.undo();
      if (!x) break;
      last = x;
    }
    expect(last?.data[0]).toBe(3); // oldest retained snapshot
  });

  it('returns null when nothing to undo', () => {
    const h = new History(8);
    expect(h.undo()).toBeNull();
  });

  it('returns null when nothing to redo', () => {
    const h = new History(8);
    h.push(fakeImage(1));
    expect(h.redo()).toBeNull();
  });

  it('current() returns the latest snapshot', () => {
    const h = new History(8);
    h.push(fakeImage(42));
    expect(h.current()?.data[0]).toBe(42);
  });

  it('reset clears stacks and sets initial', () => {
    const h = new History(8);
    h.push(fakeImage(1));
    h.push(fakeImage(2));
    h.reset(fakeImage(99));
    expect(h.current()?.data[0]).toBe(99);
    expect(h.undo()).toBeNull();
    expect(h.redo()).toBeNull();
  });
});
