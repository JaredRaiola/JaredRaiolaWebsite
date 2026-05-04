import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RunDialog } from './RunDialog';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { useWindowStore } from '@/stores/windowStore';
import { registerApp } from '@/core/apps/registry';
import { useFsStore } from '@/stores/fsStore';
import { createFs } from '@/core/fs';
import { makeDir } from '@/core/fs/tree';

describe('RunDialog', () => {
  beforeEach(async () => {
    // Ensure localStorage is available in the test environment
    if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
      const store: Record<string, string> = {};
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      });
    }
    indexedDB.deleteDatabase('win95-fs');
    const fs = await createFs(makeDir('C:'));
    useFsStore.setState({ fs, ready: true });
    useWindowStore.setState({ windows: {}, focusedId: null, zCounter: 0, cascadeIndex: 0 });
    useTaskbarStore.setState({ startMenuOpen: false, runDialogOpen: true });
    registerApp({
      id: 'notepad',
      displayName: 'Notepad',
      icon: '/i.png',
      defaultSize: { width: 400, height: 300 },
      component: () => Promise.resolve({ default: (() => null) as any }),
    });
  });

  it('opens an app by id', async () => {
    render(<RunDialog />);
    const input = screen.getByRole('combobox', { name: /open/i });
    fireEvent.change(input, { target: { value: 'notepad' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(Object.keys(useWindowStore.getState().windows).length).toBe(1);
    });
  });
});
