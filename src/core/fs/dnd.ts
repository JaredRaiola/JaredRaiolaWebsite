import { basename, eqPath, join, normalize, parent } from './paths';
import type { FS } from './index';

/** Custom MIME used for in-app drag payloads. */
export const DND_MIME = 'application/x-win95-fs';

// Browser dropEffect reporting on dragend is inconsistent across engines, so
// we use an explicit timestamp-based flag. Drop handlers that successfully
// process a drag call markDropConsumed(); the source's onDragEnd checks
// wasDropConsumed() to decide whether to fall back to a desktop reposition.
let _lastDropConsumed = 0;
export function markDropConsumed(): void {
  _lastDropConsumed = performance.now();
}
export function wasDropConsumed(thresholdMs = 200): boolean {
  return performance.now() - _lastDropConsumed < thresholdMs;
}

// dragend's clientX/Y is unreliable in Chrome (often reports 0). We track the
// cursor via a document-level dragover listener instead — that fires
// continuously throughout the drag with valid coordinates.
let _lastDragPos: { x: number; y: number } | null = null;
export function getLastDragPos(): { x: number; y: number } | null {
  return _lastDragPos;
}
export function clearLastDragPos(): void {
  _lastDragPos = null;
}
export function setLastDragPos(x: number, y: number): void {
  _lastDragPos = { x, y };
}

if (typeof window !== 'undefined') {
  window.addEventListener('dragover', (e: DragEvent) => {
    if (e.clientX > 0 && e.clientY > 0) {
      _lastDragPos = { x: e.clientX, y: e.clientY };
    }
  });
}

export type DndPayload = {
  /** Where the drag originated. */
  source: 'fs' | 'desktop';
  /** Filesystem paths of all dragged items (supports multi-select drag). */
  paths: string[];
  /** Desktop icon IDs corresponding to each path, only when source === 'desktop'. */
  iconIds?: string[];
  /** Set when dragging a desktop URL shortcut (LinkedIn/GitHub/etc.). On drop,
   * the receiver creates a `.url` shortcut file at the destination. */
  urlShortcut?: { url: string; label: string };
  /** Set when dragging a desktop app shortcut (My Computer/etc.). On drop,
   * the receiver creates a `.lnk` shortcut file at the destination. */
  appShortcut?: { appId: string; label: string };
};

export function setDndPayload(e: React.DragEvent, payload: DndPayload): void {
  e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = 'move';
}

export function getDndPayload(e: React.DragEvent): DndPayload | null {
  const raw = e.dataTransfer.getData(DND_MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DndPayload;
  } catch {
    return null;
  }
}

/** True if `child` is `parent` or a descendant of it. Used to reject cycle moves. */
export function isPathInside(child: string, ancestor: string): boolean {
  const c = normalize(child).toLowerCase();
  const a = normalize(ancestor).toLowerCase();
  if (c === a) return true;
  return c.startsWith(a.endsWith('\\') ? a : a + '\\');
}

export type MoveResult = { ok: true; newPath: string } | { ok: false; reason: string };

/**
 * Validates and performs a filesystem move from `source` into directory `destDir`.
 * The new path is `destDir/basename(source)`. Rejects no-ops and cycle moves.
 */
export async function moveInto(fs: FS, source: string, destDir: string): Promise<MoveResult> {
  if (!fs.exists(source)) return { ok: false, reason: `Source not found: ${source}` };
  if (!fs.exists(destDir) || fs.stat(destDir)?.kind !== 'dir') {
    return { ok: false, reason: `Destination is not a folder: ${destDir}` };
  }
  // Don't allow moving a folder into itself or any of its children.
  if (isPathInside(destDir, source)) {
    return { ok: false, reason: 'Cannot move a folder into itself.' };
  }
  // No-op: already in destDir.
  const sourceParent = parent(source);
  if (sourceParent && eqPath(sourceParent, destDir)) {
    return { ok: false, reason: 'Already in this folder.' };
  }
  const newPath = join(destDir, basename(source));
  if (fs.exists(newPath)) {
    return { ok: false, reason: `An item named "${basename(source)}" already exists here.` };
  }
  await fs.move(source, newPath);
  return { ok: true, newPath };
}

/** Move every path in the payload into destDir, collecting errors but continuing. */
export async function moveAllInto(
  fs: FS,
  paths: string[],
  destDir: string,
  opts: { silentSameFolder?: boolean } = {},
): Promise<{ moved: number; errors: string[] }> {
  const errors: string[] = [];
  let moved = 0;
  for (const path of paths) {
    const result = await moveInto(fs, path, destDir);
    if (result.ok) {
      moved += 1;
    } else if (!(opts.silentSameFolder && result.reason === 'Already in this folder.')) {
      errors.push(result.reason);
    }
  }
  return { moved, errors };
}
