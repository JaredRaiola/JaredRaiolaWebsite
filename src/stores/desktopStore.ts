import { create } from 'zustand';

export type IconTarget =
  | { kind: 'app'; appId: string }
  | { kind: 'file'; path: string }
  | { kind: 'url'; url: string };

export type DesktopIcon = {
  id: string;
  label: string;
  iconUrl: string;
  x: number;
  y: number;
  target: IconTarget;
  /** System icons (My Computer, Recycle Bin, profile shortcuts) — can't be deleted or renamed. */
  protected?: boolean;
};

type DesktopStore = {
  icons: Record<string, DesktopIcon>;
  selection: Set<string>;
  add(icon: DesktopIcon): void;
  move(id: string, x: number, y: number): void;
  setSelection(ids: string[]): void;
  toggleSelect(id: string, additive: boolean): void;
  rename(id: string, label: string): void;
  remove(id: string): void;
  hydrate(icons: DesktopIcon[]): void;
};

export const useDesktopStore = create<DesktopStore>((set) => ({
  icons: {},
  selection: new Set(),
  add(icon) {
    set((s) => ({ icons: { ...s.icons, [icon.id]: icon } }));
  },
  move(id, x, y) {
    set((s) => (s.icons[id] ? { icons: { ...s.icons, [id]: { ...s.icons[id], x, y } } } : s));
  },
  setSelection(ids) {
    set({ selection: new Set(ids) });
  },
  toggleSelect(id, additive) {
    set((s) => {
      const next = new Set(additive ? s.selection : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selection: next };
    });
  },
  rename(id, label) {
    set((s) => (s.icons[id] ? { icons: { ...s.icons, [id]: { ...s.icons[id], label } } } : s));
  },
  remove(id) {
    set((s) => {
      const next = { ...s.icons };
      delete next[id];
      const sel = new Set(s.selection);
      sel.delete(id);
      return { icons: next, selection: sel };
    });
  },
  hydrate(icons) {
    set({ icons: Object.fromEntries(icons.map((i) => [i.id, i])) });
  },
}));
