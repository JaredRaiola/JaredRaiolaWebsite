import { create } from 'zustand';

type TaskbarStore = {
  startMenuOpen: boolean;
  runDialogOpen: boolean;
  toggleStartMenu(): void;
  closeStartMenu(): void;
  openRunDialog(): void;
  closeRunDialog(): void;
};

export const useTaskbarStore = create<TaskbarStore>((set) => ({
  startMenuOpen: false,
  runDialogOpen: false,
  toggleStartMenu() {
    set((s) => ({ startMenuOpen: !s.startMenuOpen, runDialogOpen: false }));
  },
  closeStartMenu() {
    set({ startMenuOpen: false });
  },
  openRunDialog() {
    set({ runDialogOpen: true, startMenuOpen: false });
  },
  closeRunDialog() {
    set({ runDialogOpen: false });
  },
}));
