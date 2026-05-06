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

import { saveBlobs, loadBlobs, type AllBlobs } from './session';

async function makeBlob(text: string): Promise<Blob> {
  return new Blob([text], { type: 'text/plain' });
}

async function readBlobAsText(blob: Blob): Promise<string> {
  return await blob.text();
}

describe('session — IDB blobs', () => {
  beforeEach(() => {
    ensureLocalStorage();
  });

  it('returns empty record when no blobs stored', async () => {
    const result = await loadBlobs(['nonexistent-w']);
    expect(result).toEqual({});
  });

  it('round-trips blobs by windowId', async () => {
    const blob = await makeBlob('hi');
    const all: AllBlobs = { 'rt-w1': { canvas: blob } };
    await saveBlobs(all, ['rt-w1']);
    const loaded = await loadBlobs(['rt-w1']);
    expect(loaded['rt-w1']).toBeDefined();
    expect(loaded['rt-w1'].canvas).toBeInstanceOf(Blob);
    expect(await readBlobAsText(loaded['rt-w1'].canvas)).toBe('hi');
  });

  it('only loads blobs for requested windowIds', async () => {
    await saveBlobs(
      { 'scope-w1': { canvas: await makeBlob('a') }, 'scope-w2': { canvas: await makeBlob('b') } },
      ['scope-w1', 'scope-w2'],
    );
    const loaded = await loadBlobs(['scope-w1']);
    expect(loaded['scope-w1']).toBeDefined();
    expect(loaded['scope-w2']).toBeUndefined();
  });

  it('removes blobs for windowIds no longer in liveWindowIds', async () => {
    await saveBlobs({ 'rm-w1': { canvas: await makeBlob('a') } }, ['rm-w1']);
    await saveBlobs({}, []);
    const loaded = await loadBlobs(['rm-w1']);
    expect(loaded).toEqual({});
  });

  it('removes specific keys when an app drops a blob registration', async () => {
    await saveBlobs(
      { 'drop-w1': { canvas: await makeBlob('a'), thumb: await makeBlob('t') } },
      ['drop-w1'],
    );
    await saveBlobs({ 'drop-w1': { canvas: await makeBlob('a2') } }, ['drop-w1']);
    const loaded = await loadBlobs(['drop-w1']);
    expect(loaded['drop-w1'].thumb).toBeUndefined();
    expect(await readBlobAsText(loaded['drop-w1'].canvas)).toBe('a2');
  });
});

import { clearSession } from './session';

describe('session — clear', () => {
  beforeEach(() => {
    ensureLocalStorage();
  });

  it('removes localStorage key and drops IDB DB', async () => {
    saveSnapshot(sample);
    await saveBlobs({ 'cls-w1': { canvas: await makeBlob('a') } }, ['cls-w1']);

    await clearSession();

    expect(loadSnapshot()).toBeNull();
    expect(await loadBlobs(['cls-w1'])).toEqual({});
  });
});
