import { create } from 'zustand';

type BsodStore = {
  active: boolean;
  trigger(): void;
  dismiss(): void;
};

export const useBsodStore = create<BsodStore>((set) => ({
  active: false,
  trigger() { set({ active: true }); },
  dismiss() { set({ active: false }); },
}));
