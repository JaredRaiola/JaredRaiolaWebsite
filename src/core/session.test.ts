import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSnapshot,
  loadSnapshot,
  SESSION_KEY,
  type SessionSnapshot,
} from './session';

const sample: SessionSnapshot = {
  version: 1,
  savedAt: 12345,
  windows: [
    {
      id: 'w1',
      appId: 'notepad',
      title: 'Untitled - Notepad',
      args: undefined,
      x: 20,
      y: 20,
      width: 480,
      height: 360,
      state: 'normal',
      zIndex: 1,
      focused: true,
      appState: { text: 'hello', path: null, dirty: false },
    },
  ],
};

function ensureLocalStorage(): void {
  if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    });
  }
}

describe('session — localStorage', () => {
  beforeEach(() => {
    ensureLocalStorage();
    localStorage.removeItem(SESSION_KEY);
  });

  it('returns null when nothing is stored', () => {
    expect(loadSnapshot()).toBeNull();
  });

  it('round-trips a snapshot', () => {
    saveSnapshot(sample);
    expect(loadSnapshot()).toEqual(sample);
  });

  it('returns null on corrupt JSON', () => {
    localStorage.setItem(SESSION_KEY, 'not json');
    expect(loadSnapshot()).toBeNull();
  });

  it('returns null on schema version mismatch', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...sample, version: 99 }));
    expect(loadSnapshot()).toBeNull();
  });

  it('returns null on missing version', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ savedAt: 0, windows: [] }));
    expect(loadSnapshot()).toBeNull();
  });

  it('quota errors during save are swallowed silently', () => {
    const orig = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('quota'); };
    expect(() => saveSnapshot(sample)).not.toThrow();
    localStorage.setItem = orig;
  });
});
