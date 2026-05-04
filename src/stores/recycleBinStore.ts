import { create } from 'zustand';
import type { RecycleBin, RecycleEntry } from '@/core/fs/recycleBin';

type RecycleBinState = {
  bin: RecycleBin | null;
  entries: RecycleEntry[];
  bumpVersion: number;
  setBin(bin: RecycleBin): void;
  /** Re-read from `bin.list()` and bump. Call after every mutation. */
  refresh(): void;
};

export const useRecycleBinStore = create<RecycleBinState>((set, get) => ({
  bin: null,
  entries: [],
  bumpVersion: 0,
  setBin(bin) {
    set({ bin, entries: bin.list(), bumpVersion: get().bumpVersion + 1 });
  },
  refresh() {
    const bin = get().bin;
    if (!bin) return;
    set({ entries: bin.list(), bumpVersion: get().bumpVersion + 1 });
  },
}));
