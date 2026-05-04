import { extname, basename } from '@/core/fs/paths';
import { listApps } from './registry';

export function resolveAssociation(path: string): string | null {
  const ext = extname(basename(path));
  if (!ext) return null;
  for (const app of listApps()) {
    if (app.fileAssociations?.some((e) => e.toLowerCase() === ext)) return app.id;
  }
  return null;
}
