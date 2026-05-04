import { create } from 'zustand';
import { uuid } from '@/lib/uuid';

export type Bounds = { x: number; y: number; width: number; height: number };

export type WindowState = {
  id: string;
  appId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prevBounds?: Bounds;
  zIndex: number;
  state: 'normal' | 'minimized' | 'maximized';
  args?: unknown;
  singleInstance?: boolean;
};

export type OpenOpts = {
  title: string;
  icon: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  singleInstance?: boolean;
};

type Store = {
  windows: Record<string, WindowState>;
  focusedId: string | null;
  zCounter: number;
  cascadeIndex: number;
  open(appId: string, args: unknown, opts: OpenOpts): string;
  close(id: string): void;
  focus(id: string): void;
  minimize(id: string): void;
  toggleMaximize(id: string): void;
  move(id: string, x: number, y: number): void;
  resize(id: string, width: number, height: number): void;
  setTitle(id: string, title: string): void;
  setIcon(id: string, icon: string): void;
};

export const TASKBAR_HEIGHT = 40;

const cascadePosition = (i: number): { x: number; y: number } => {
  const step = 24;
  const max = 12;
  const k = i % max;
  return { x: 20 + k * step, y: 20 + k * step };
};

export const useWindowStore = create<Store>((set, get) => ({
  windows: {},
  focusedId: null,
  zCounter: 0,
  cascadeIndex: 0,

  open(appId, args, opts) {
    if (opts.singleInstance) {
      const existing = Object.values(get().windows).find((w) => w.appId === appId);
      if (existing) {
        get().focus(existing.id);
        return existing.id;
      }
    }
    const id = uuid();
    const z = get().zCounter + 1;
    const cascade = cascadePosition(get().cascadeIndex);
    const w: WindowState = {
      id,
      appId,
      title: opts.title,
      icon: opts.icon,
      x: opts.x ?? cascade.x,
      y: opts.y ?? cascade.y,
      width: opts.width,
      height: opts.height,
      zIndex: z,
      state: 'normal',
      args,
      singleInstance: opts.singleInstance,
    };
    set((s) => ({
      windows: { ...s.windows, [id]: w },
      focusedId: id,
      zCounter: z,
      cascadeIndex: s.cascadeIndex + 1,
    }));
    return id;
  },

  close(id) {
    set((s) => {
      const next = { ...s.windows };
      delete next[id];
      const focusedId =
        s.focusedId === id
          ? Object.values(next).sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null
          : s.focusedId;
      return { windows: next, focusedId };
    });
  },

  focus(id) {
    set((s) => {
      const w = s.windows[id];
      if (!w) return s;
      const z = s.zCounter + 1;
      return {
        windows: { ...s.windows, [id]: { ...w, zIndex: z, state: w.state === 'minimized' ? 'normal' : w.state } },
        focusedId: id,
        zCounter: z,
      };
    });
  },

  minimize(id) {
    set((s) => {
      const w = s.windows[id];
      if (!w) return s;
      return {
        windows: { ...s.windows, [id]: { ...w, state: 'minimized' } },
        focusedId: s.focusedId === id ? null : s.focusedId,
      };
    });
  },

  toggleMaximize(id) {
    set((s) => {
      const w = s.windows[id];
      if (!w) return s;
      if (w.state === 'maximized' && w.prevBounds) {
        return {
          windows: {
            ...s.windows,
            [id]: { ...w, state: 'normal', x: w.prevBounds.x, y: w.prevBounds.y, width: w.prevBounds.width, height: w.prevBounds.height, prevBounds: undefined },
          },
        };
      }
      const prev: Bounds = { x: w.x, y: w.y, width: w.width, height: w.height };
      return {
        windows: {
          ...s.windows,
          [id]: { ...w, state: 'maximized', prevBounds: prev, x: 0, y: 0, width: window.innerWidth, height: window.innerHeight - TASKBAR_HEIGHT },
        },
      };
    });
  },

  move(id, x, y) {
    set((s) => {
      const w = s.windows[id];
      if (!w) return s;
      return { windows: { ...s.windows, [id]: { ...w, x, y } } };
    });
  },

  resize(id, width, height) {
    set((s) => {
      const w = s.windows[id];
      if (!w) return s;
      return { windows: { ...s.windows, [id]: { ...w, width, height } } };
    });
  },

  setTitle(id, title) {
    set((s) => (s.windows[id] ? { windows: { ...s.windows, [id]: { ...s.windows[id], title } } } : s));
  },

  setIcon(id, icon) {
    set((s) => (s.windows[id] ? { windows: { ...s.windows, [id]: { ...s.windows[id], icon } } } : s));
  },
}));
