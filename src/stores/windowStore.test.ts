import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from './windowStore';

describe('windowStore', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {}, focusedId: null, zCounter: 0 });
  });

  it('opens a window and focuses it', () => {
    const id = useWindowStore.getState().open('notepad', undefined, { title: 'Notepad', icon: 'i.png', width: 400, height: 300 });
    const s = useWindowStore.getState();
    expect(s.windows[id].title).toBe('Notepad');
    expect(s.focusedId).toBe(id);
  });

  it('focus bumps zIndex above others', () => {
    const a = useWindowStore.getState().open('notepad', undefined, { title: 'A', icon: 'i', width: 100, height: 100 });
    const b = useWindowStore.getState().open('notepad', undefined, { title: 'B', icon: 'i', width: 100, height: 100 });
    useWindowStore.getState().focus(a);
    const s = useWindowStore.getState();
    expect(s.windows[a].zIndex).toBeGreaterThan(s.windows[b].zIndex);
    expect(s.focusedId).toBe(a);
  });

  it('toggleMaximize stores prevBounds and restores them', () => {
    const id = useWindowStore.getState().open('explorer', undefined, { title: 'E', icon: 'i', width: 400, height: 300, x: 50, y: 60 });
    useWindowStore.getState().toggleMaximize(id);
    expect(useWindowStore.getState().windows[id].state).toBe('maximized');
    expect(useWindowStore.getState().windows[id].prevBounds?.x).toBe(50);
    useWindowStore.getState().toggleMaximize(id);
    expect(useWindowStore.getState().windows[id].state).toBe('normal');
    expect(useWindowStore.getState().windows[id].x).toBe(50);
  });

  it('minimize hides without removing', () => {
    const id = useWindowStore.getState().open('notepad', undefined, { title: 'N', icon: 'i', width: 100, height: 100 });
    useWindowStore.getState().minimize(id);
    expect(useWindowStore.getState().windows[id].state).toBe('minimized');
  });

  it('close removes the window', () => {
    const id = useWindowStore.getState().open('notepad', undefined, { title: 'N', icon: 'i', width: 100, height: 100 });
    useWindowStore.getState().close(id);
    expect(useWindowStore.getState().windows[id]).toBeUndefined();
  });
});
