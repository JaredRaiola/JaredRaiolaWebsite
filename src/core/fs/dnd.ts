import { basename, eqPath, join, normalize, parent } from './paths';
import type { FS } from './index';

/** Custom MIME used for in-app drag payloads. */
export const DND_MIME = 'application/x-win95-fs';

export type DndPayload = {
  /** Where the drag originated. */
  source: 'fs' | 'desktop';
  /** Filesystem path of the dragged item. */
  path: string;
  /** Desktop icon ID, only when source === 'desktop'. */
  iconId?: string;
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
