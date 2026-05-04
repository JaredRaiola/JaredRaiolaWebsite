import { create } from 'zustand';

export type ContextItem =
  | { kind: 'item'; label: string; onSelect: () => void; disabled?: boolean }
  | { kind: 'separator' }
  | { kind: 'submenu'; label: string; items: ContextItem[] };

type ContextStore = {
  open: boolean;
  x: number;
  y: number;
  items: ContextItem[];
  show(x: number, y: number, items: ContextItem[]): void;
  close(): void;
};

export const useContextMenuStore = create<ContextStore>((set) => ({
  open: false,
  x: 0,
  y: 0,
  items: [],
  show(x, y, items) {
    set({ open: true, x, y, items });
  },
  close() {
    set({ open: false, items: [] });
  },
}));
