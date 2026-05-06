// src/core/session.ts

export const SESSION_KEY = 'win95.session.v1';
export const SESSION_DB = 'win95-session';
export const SESSION_DB_VERSION = 1;
export const BLOBS_STORE = 'blobs';

export type WindowSnapshot = {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  args: unknown;
  x: number;
  y: number;
  width: number;
  height: number;
  state: 'normal' | 'minimized' | 'maximized';
  zIndex: number;
  focused: boolean;
  appState?: unknown;
  blobKeys?: string[];
};

export type SessionSnapshot = {
  version: 1;
  savedAt: number;
  windows: WindowSnapshot[];
};

export type WindowBlobs = Record<string, Blob>;
export type AllBlobs = Record<string, WindowBlobs>;
