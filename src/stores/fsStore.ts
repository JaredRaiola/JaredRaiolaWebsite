import { create } from 'zustand';
import type { FS } from '@/core/fs';

type FsStore = {
  fs: FS | null;
  ready: boolean;
  bumpVersion: number; // incremented after mutations to force re-renders
  setFs(fs: FS): void;
  bump(): void;
};

export const useFsStore = create<FsStore>((set) => ({
  fs: null,
  ready: false,
  bumpVersion: 0,
  setFs(fs) {
    set({ fs, ready: true });
  },
  bump() {
    set((s) => ({ bumpVersion: s.bumpVersion + 1 }));
  },
}));
