import { create } from 'zustand';

export type ScreensaverKind = 'none' | 'mystify' | 'pipes';

const KEY = 'win95.screensaver';

type Persisted = {
  kind?: ScreensaverKind;
  /** Idle threshold before activation, in milliseconds. */
  timeoutMs?: number;
};

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch { return {}; }
};

const savePersisted = (p: Persisted): void => {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

type ScreensaverStore = {
  kind: ScreensaverKind;
  timeoutMs: number;
  active: boolean;
  setKind(kind: ScreensaverKind): void;
  setTimeoutMs(ms: number): void;
  setActive(active: boolean): void;
};

const initial = loadPersisted();
const FIVE_MIN = 5 * 60 * 1000;

export const useScreensaverStore = create<ScreensaverStore>((set) => ({
  kind: initial.kind ?? 'mystify',
  timeoutMs: initial.timeoutMs ?? FIVE_MIN,
  active: false,
  setKind(kind) { set({ kind }); savePersisted({ kind, timeoutMs: useScreensaverStore.getState().timeoutMs }); },
  setTimeoutMs(timeoutMs) { set({ timeoutMs }); savePersisted({ kind: useScreensaverStore.getState().kind, timeoutMs }); },
  setActive(active) { set({ active }); },
}));
