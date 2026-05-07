import { create } from 'zustand';
import { playRaw, type SoundName } from '@/lib/sounds';

const KEY = 'win95.sound.muted';

const loadMuted = (): boolean => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

const saveMuted = (muted: boolean): void => {
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* ignore */ }
};

type SoundStore = {
  muted: boolean;
  setMuted(muted: boolean): void;
  toggleMuted(): void;
  play(name: SoundName): void;
};

export const useSoundStore = create<SoundStore>((set, get) => ({
  muted: loadMuted(),
  setMuted(muted) {
    set({ muted });
    saveMuted(muted);
  },
  toggleMuted() {
    const next = !get().muted;
    set({ muted: next });
    saveMuted(next);
  },
  play(name) {
    if (get().muted) return;
    playRaw(name);
  },
}));

/** Imperative helper for non-React call sites (sysAlert, recycle bin, boot). */
export function playSound(name: SoundName): void {
  useSoundStore.getState().play(name);
}
