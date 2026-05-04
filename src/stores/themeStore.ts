import { create } from 'zustand';

const WALLPAPERS: Record<string, string> = {
  teal: '',
  clouds: '/assets/wallpapers/clouds.png',
  setup: '/assets/wallpapers/setup.png',
};

type ThemeStore = {
  wallpaperKey: keyof typeof WALLPAPERS;
  bgColor: string;
  setWallpaper(key: keyof typeof WALLPAPERS): void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  wallpaperKey: 'teal',
  bgColor: '#008080',
  setWallpaper(key) {
    set({ wallpaperKey: key });
  },
}));

export const wallpaperUrl = (key: keyof typeof WALLPAPERS): string => WALLPAPERS[key];
