import { create } from 'zustand';

export type DialogIcon = 'info' | 'error' | 'warn' | 'question';
export type DialogKind = 'alert' | 'confirm' | 'prompt';

export type DialogConfig = {
  id: number;
  kind: DialogKind;
  title: string;
  message: string;
  icon: DialogIcon;
  /** prompt only */
  defaultValue?: string;
  okLabel: string;
  cancelLabel?: string;
  /** Result: boolean for alert/confirm (alert always true), string|null for prompt. */
  resolve: (value: boolean | string | null) => void;
};

type DialogState = {
  queue: DialogConfig[];
  push(config: Omit<DialogConfig, 'id'>): number;
  resolve(id: number, value: boolean | string | null): void;
};

let nextId = 1;

export const useDialogStore = create<DialogState>((set, get) => ({
  queue: [],
  push(config) {
    const id = nextId++;
    set((s) => ({ queue: [...s.queue, { ...config, id }] }));
    return id;
  },
  resolve(id, value) {
    const entry = get().queue.find((d) => d.id === id);
    if (!entry) return;
    entry.resolve(value);
    set((s) => ({ queue: s.queue.filter((d) => d.id !== id) }));
  },
}));
