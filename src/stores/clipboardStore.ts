import { create } from 'zustand';

export type ClipboardOp = 'cut' | 'copy';

type ClipboardStore = {
  paths: string[];
  op: ClipboardOp | null;
  set(paths: string[], op: ClipboardOp): void;
  clear(): void;
  has(path: string): boolean;
};

export const useClipboardStore = create<ClipboardStore>((set, get) => ({
  paths: [],
  op: null,
  set(paths, op) {
    set({ paths, op });
  },
  clear() {
    set({ paths: [], op: null });
  },
  has(path) {
    const { paths } = get();
    const lower = path.toLowerCase();
    return paths.some((p) => p.toLowerCase() === lower);
  },
}));
