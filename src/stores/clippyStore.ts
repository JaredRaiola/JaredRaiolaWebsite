import { create } from 'zustand';

const KEY = 'win95.clippy.enabled';

const loadEnabled = (): boolean => {
  try { return localStorage.getItem(KEY) !== '0'; } catch { return true; }
};

const saveEnabled = (enabled: boolean): void => {
  try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch { /* ignore */ }
};

type ClippyStore = {
  enabled: boolean;
  setEnabled(enabled: boolean): void;
};

export const useClippyStore = create<ClippyStore>((set) => ({
  enabled: loadEnabled(),
  setEnabled(enabled) { set({ enabled }); saveEnabled(enabled); },
}));
