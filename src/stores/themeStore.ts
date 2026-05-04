import { create } from 'zustand';

const WALLPAPERS: Record<string, string> = {
  teal: '',
  clouds: '/assets/wallpapers/clouds.png',
  setup: '/assets/wallpapers/setup.png',
};

const THEME_KEY = 'win95.theme';

export type WallpaperMode = 'tile' | 'center' | 'stretch';

type Persisted = {
  wallpaperKey?: keyof typeof WALLPAPERS;
  bgColor?: string;
  wallpaperMode?: WallpaperMode;
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
    /* ignore */
  }
};

type ThemeStore = {
  wallpaperKey: keyof typeof WALLPAPERS;
  bgColor: string;
  wallpaperMode: WallpaperMode;
  setWallpaper(key: keyof typeof WALLPAPERS): void;
  setBgColor(color: string): void;
  setWallpaperMode(mode: WallpaperMode): void;
};

const initial = loadPersisted();

export const useThemeStore = create<ThemeStore>((set) => ({
  wallpaperKey: (initial.wallpaperKey ?? 'teal') as keyof typeof WALLPAPERS,
  bgColor: initial.bgColor ?? '#008080',
  wallpaperMode: initial.wallpaperMode ?? 'tile',
  setWallpaper(key) {
    set({ wallpaperKey: key });
  },
  setBgColor(color) {
    set({ bgColor: color });
  },
  setWallpaperMode(mode) {
    set({ wallpaperMode: mode });
  },
}));

// Persist any change.
useThemeStore.subscribe((s) => {
  savePersisted({
    wallpaperKey: s.wallpaperKey,
    bgColor: s.bgColor,
    wallpaperMode: s.wallpaperMode,
  });
});

export const wallpaperUrl = (key: keyof typeof WALLPAPERS): string => WALLPAPERS[key];
export const WALLPAPER_KEYS = Object.keys(WALLPAPERS) as Array<keyof typeof WALLPAPERS>;
