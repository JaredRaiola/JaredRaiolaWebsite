import { create } from 'zustand';

/**
 * Built-in wallpapers ship with the site. Custom wallpapers (user uploads) are
 * stored in localStorage as data URLs alongside the rest of the theme. The
 * `wallpaperKey` selects either a built-in name or a `custom:<id>` key.
 */
const BUILTIN_WALLPAPERS: Record<string, string> = {
  teal: '',
};

const THEME_KEY = 'win95.theme';

export type WallpaperMode = 'tile' | 'center' | 'stretch';

export type CustomWallpaper = {
  id: string;
  name: string;
  dataUrl: string;
};

type Persisted = {
  wallpaperKey?: string;
  bgColor?: string;
  wallpaperMode?: WallpaperMode;
  customWallpapers?: CustomWallpaper[];
};

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    return {};
  }
};

const savePersisted = (p: Persisted): void => {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota errors */
  }
};

type ThemeStore = {
  wallpaperKey: string;
  bgColor: string;
  wallpaperMode: WallpaperMode;
  customWallpapers: CustomWallpaper[];
  setWallpaper(key: string): void;
  setBgColor(color: string): void;
  setWallpaperMode(mode: WallpaperMode): void;
  addCustomWallpaper(name: string, dataUrl: string): string;
  removeCustomWallpaper(id: string): void;
};

const initial = loadPersisted();

export const useThemeStore = create<ThemeStore>((set, get) => ({
  wallpaperKey: initial.wallpaperKey ?? 'teal',
  bgColor: initial.bgColor ?? '#008080',
  wallpaperMode: initial.wallpaperMode ?? 'tile',
  customWallpapers: initial.customWallpapers ?? [],
  setWallpaper(key) { set({ wallpaperKey: key }); },
  setBgColor(color) { set({ bgColor: color }); },
  setWallpaperMode(mode) { set({ wallpaperMode: mode }); },
  addCustomWallpaper(name, dataUrl) {
    const id = `cw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    set({ customWallpapers: [...get().customWallpapers, { id, name, dataUrl }] });
    return `custom:${id}`;
  },
  removeCustomWallpaper(id) {
    const cur = get().customWallpapers.filter((w) => w.id !== id);
    set({ customWallpapers: cur });
    // If the removed wallpaper was selected, fall back to teal.
    if (get().wallpaperKey === `custom:${id}`) set({ wallpaperKey: 'teal' });
  },
}));

useThemeStore.subscribe((s) => {
  savePersisted({
    wallpaperKey: s.wallpaperKey,
    bgColor: s.bgColor,
    wallpaperMode: s.wallpaperMode,
    customWallpapers: s.customWallpapers,
  });
});

/** Resolve a wallpaper key to its URL (built-in path, custom data URL, or ''). */
export function wallpaperUrl(key: string): string {
  if (key.startsWith('custom:')) {
    const id = key.slice('custom:'.length);
    const found = useThemeStore.getState().customWallpapers.find((w) => w.id === id);
    return found?.dataUrl ?? '';
  }
  return BUILTIN_WALLPAPERS[key] ?? '';
}

export const BUILTIN_WALLPAPER_KEYS = Object.keys(BUILTIN_WALLPAPERS);
