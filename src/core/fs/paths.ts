const SEP = '\\';

export function normalize(p: string): string {
  let n = p.replace(/\//g, SEP);
  n = n.replace(/\\+/g, SEP);
  if (n.length > 3 && n.endsWith(SEP)) n = n.slice(0, -1);
  return n;
}

export function split(p: string): string[] {
  const n = normalize(p);
  if (n === 'C:\\' || n === 'C:') return ['C:'];
  const parts = n.split(SEP);
  return parts.filter((part, i) => i === 0 || part.length > 0);
}

export function join(...parts: string[]): string {
  if (parts.length === 0) return '';
  const [head, ...rest] = parts;
  const joined = [head.replace(/[\\/]+$/, ''), ...rest.map((s) => s.replace(/^[\\/]+|[\\/]+$/g, ''))]
    .filter((s) => s.length > 0)
    .join(SEP);
  return normalize(joined);
}

export function parent(p: string): string | null {
  const n = normalize(p);
  if (n === 'C:\\' || n === 'C:') return null;
  const parts = split(n);
  if (parts.length <= 1) return null;
  if (parts.length === 2) return 'C:\\';
  return parts.slice(0, -1).join(SEP);
}

export function basename(p: string): string {
  const parts = split(p);
  return parts[parts.length - 1];
}

export function extname(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return '';
  return name.slice(dot).toLowerCase();
}

export function eqPath(a: string, b: string): boolean {
  return normalize(a).toLowerCase() === normalize(b).toLowerCase();
}
