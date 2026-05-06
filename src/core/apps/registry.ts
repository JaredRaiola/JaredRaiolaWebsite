import type { ComponentType } from 'react';
import type { FS } from '@/core/fs';

export type DialogOpts = {
  title: string;
  message: string;
  buttons: ('ok' | 'cancel' | 'yes' | 'no')[];
  icon?: 'info' | 'error' | 'warn' | 'question';
};

export type DialogResult = 'ok' | 'cancel' | 'yes' | 'no';

export type WindowApi = {
  windowId: string;
  setTitle(title: string): void;
  setIcon(iconUrl: string): void;
  setSize(width: number, height: number): void;
  requestClose(): void;
  openFile(path: string): void;
  showDialog(opts: DialogOpts): Promise<DialogResult>;
};

export type AppProps = {
  api: WindowApi;
  fs: FS;
  args?: unknown;
};

export type AppComponent = ComponentType<AppProps>;

export type AppDef = {
  id: string;
  displayName: string;
  icon: string;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  singleInstance?: boolean;
  fileAssociations?: string[];
  /** Where the app appears in the Start menu. Default: ['Programs']. */
  menuPath?: string[];
  component: () => Promise<{ default: AppComponent }>;
};

const registry = new Map<string, AppDef>();

export function registerApp(def: AppDef): void {
  registry.set(def.id, def);
}

export function getApp(id: string): AppDef | undefined {
  return registry.get(id);
}

export function listApps(): AppDef[] {
  return Array.from(registry.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
