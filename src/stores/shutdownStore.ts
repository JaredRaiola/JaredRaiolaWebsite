import { create } from 'zustand';

export type ShutdownPhase = 'idle' | 'shutting-down' | 'safe';

type ShutdownStore = {
  phase: ShutdownPhase;
  setPhase(phase: ShutdownPhase): void;
  start(): void;
};

export const useShutdownStore = create<ShutdownStore>((set) => ({
  phase: 'idle',
  setPhase(phase) { set({ phase }); },
  start() { set({ phase: 'shutting-down' }); },
}));
