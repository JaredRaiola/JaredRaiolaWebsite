import type { FS } from './index';
import { join } from './paths';
import { getApp } from '@/core/apps/registry';
import { useWindowStore } from '@/stores/windowStore';

/**
 * Win95-style shortcuts:
 *   .url - INI text with URL=...      (web bookmarks)
 *   .lnk - INI text with APP=...      (app shortcuts; our facsimile uses
 *                                      a plain-text format since the real
 *                                      .lnk binary format is irrelevant here)
 */

// ---- URL shortcuts -------------------------------------------------------

export function urlShortcutContent(url: string): string {
  return `[InternetShortcut]\r\nURL=${url}\r\n`;
}

export function parseUrlShortcut(content: string): string | null {
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^url\s*=\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (/^https?:\/\//i.test(t)) return t;
  }
  return null;
}

export async function tryOpenUrlShortcut(fs: FS, path: string): Promise<boolean> {
  if (!path.toLowerCase().endsWith('.url')) return false;
  try {
    const content = await fs.readText(path);
    const url = parseUrlShortcut(content);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function createUrlShortcut(
  fs: FS,
  destDir: string,
  label: string,
  url: string,
): Promise<string> {
  let name = `${label}.url`;
  let i = 1;
  while (fs.exists(join(destDir, name))) {
    i += 1;
    name = `${label} (${i}).url`;
  }
  const path = join(destDir, name);
  await fs.writeText(path, urlShortcutContent(url));
  return path;
}

// ---- App shortcuts -------------------------------------------------------

export function appShortcutContent(appId: string): string {
  return `[Shortcut]\r\nAPP=${appId}\r\n`;
}

export function parseAppShortcut(content: string): string | null {
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^app\s*=\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  return null;
}

export async function tryOpenAppShortcut(fs: FS, path: string): Promise<boolean> {
  if (!path.toLowerCase().endsWith('.lnk')) return false;
  try {
    const content = await fs.readText(path);
    const appId = parseAppShortcut(content);
    if (!appId) return false;
    const app = getApp(appId);
    if (!app) return false;
    useWindowStore.getState().open(appId, undefined, {
      title: app.displayName,
      icon: app.icon,
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      singleInstance: app.singleInstance,
    });
    return true;
  } catch {
    return false;
  }
}

export async function createAppShortcut(
  fs: FS,
  destDir: string,
  label: string,
  appId: string,
): Promise<string> {
  let name = `${label}.lnk`;
  let i = 1;
  while (fs.exists(join(destDir, name))) {
    i += 1;
    name = `${label} (${i}).lnk`;
  }
  const path = join(destDir, name);
  await fs.writeText(path, appShortcutContent(appId));
  return path;
}

// ---- Combined -------------------------------------------------------------

/** Try opening a `.url` or `.lnk` shortcut. Returns true if handled. */
export async function tryOpenShortcut(fs: FS, path: string): Promise<boolean> {
  if (await tryOpenUrlShortcut(fs, path)) return true;
  if (await tryOpenAppShortcut(fs, path)) return true;
  return false;
}
