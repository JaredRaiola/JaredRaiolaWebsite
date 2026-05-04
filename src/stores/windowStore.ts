import { create } from 'zustand';
import { uuid } from '@/lib/uuid';

export type Bounds = { x: number; y: number; width: number; height: number };

// Per-app remembered bounds (last position + size). Restored on next open of
// the same app so users don't have to reposition every time. Persisted under
// `win95.windows.lastBounds` so it survives reloads but is wiped on Reset.
const LAST_BOUNDS_KEY = 'win95.windows.lastBounds';

const loadLastBounds = (): Record<string, Bounds> => {
  try {
    const raw = localStorage.getItem(LAST_BOUNDS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Bounds>) : {};
  } catch {
    return {};
  }
};

const saveLastBounds = (map: Record<string, Bounds>): void => {
  try {
    localStorage.setItem(LAST_BOUNDS_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
};

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
  lastBoundsByApp: Record<string, Bounds>;
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
  lastBoundsByApp: loadLastBounds(),

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
    // Use the app's last remembered bounds when the caller didn't specify
    // an explicit position. Width/height fall back to the app default.
    const remembered = get().lastBoundsByApp[appId];
    const cascade = cascadePosition(get().cascadeIndex);
    const startX = opts.x ?? remembered?.x ?? cascade.x;
    const startY = opts.y ?? remembered?.y ?? cascade.y;
    const startW = remembered?.width ?? opts.width;
    const startH = remembered?.height ?? opts.height;
    const w: WindowState = {
      id,
      appId,
      title: opts.title,
      icon: opts.icon,
      x: startX,
      y: startY,
      width: startW,
      height: startH,
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
      const next = { ...w, x, y };
      // Don't overwrite remembered bounds while maximized — that'd capture
      // 0,0/full-screen, which isn't useful for restoring on next open.
      const lastBoundsByApp =
        w.state === 'maximized'
          ? s.lastBoundsByApp
          : { ...s.lastBoundsByApp, [w.appId]: { x, y, width: w.width, height: w.height } };
      if (w.state !== 'maximized') saveLastBounds(lastBoundsByApp);
      return { windows: { ...s.windows, [id]: next }, lastBoundsByApp };
    });
  },

  resize(id, width, height) {
    set((s) => {
      const w = s.windows[id];
      if (!w) return s;
      const next = { ...w, width, height };
      const lastBoundsByApp =
        w.state === 'maximized'
          ? s.lastBoundsByApp
          : { ...s.lastBoundsByApp, [w.appId]: { x: w.x, y: w.y, width, height } };
      if (w.state !== 'maximized') saveLastBounds(lastBoundsByApp);
      return { windows: { ...s.windows, [id]: next }, lastBoundsByApp };
    });
  },

  setTitle(id, title) {
    set((s) => (s.windows[id] ? { windows: { ...s.windows, [id]: { ...s.windows[id], title } } } : s));
  },

  setIcon(id, icon) {
    set((s) => (s.windows[id] ? { windows: { ...s.windows, [id]: { ...s.windows[id], icon } } } : s));
  },
}));
