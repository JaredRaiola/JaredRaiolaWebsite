import { useEffect, useRef } from 'react';

export type HotkeyHandler = (e: KeyboardEvent) => void;
export type HotkeyMap = Record<string, HotkeyHandler>;

export type HotkeyOpts = {
  enabled?: boolean;
  // If true, hotkeys won't fire while focus is in a text input/textarea/contenteditable.
  // Useful for global shortcuts; usually false for in-app shortcuts that should override.
  ignoreInInputs?: boolean;
  // If true (default), preventDefault on matched shortcuts.
  preventDefault?: boolean;
};

const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
};

const normalize = (combo: string): string =>
  combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .sort((a, b) => order(a) - order(b))
    .join('+');

const order = (p: string): number => {
  if (p === 'ctrl') return 0;
  if (p === 'alt') return 1;
  if (p === 'shift') return 2;
  return 3;
};

const eventCombo = (e: KeyboardEvent): string => {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  let key = e.key.toLowerCase();
  // Normalize a few keys
  if (key === ' ') key = 'space';
  if (key === 'arrowleft') key = 'left';
  if (key === 'arrowright') key = 'right';
  if (key === 'arrowup') key = 'up';
  if (key === 'arrowdown') key = 'down';
  if (key === 'escape') key = 'esc';
  parts.push(key);
  return parts.sort((a, b) => order(a) - order(b)).join('+');
};

export function useHotkeys(map: HotkeyMap, opts: HotkeyOpts = {}): void {
  const { enabled = true, ignoreInInputs = false, preventDefault = true } = opts;
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent): void => {
      if (ignoreInInputs && isEditable(e.target)) return;
      const combo = eventCombo(e);
      const handler = Object.entries(mapRef.current).find(([k]) => normalize(k) === combo)?.[1];
      if (handler) {
        if (preventDefault) e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, ignoreInInputs, preventDefault]);
}
