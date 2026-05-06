const KEY = 'win95.solitaire.bestTimes';
const MAX_NAME = 25;

export type BestTime = { name: string; seconds: number };

export function loadBestTime(): BestTime | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BestTime;
    if (typeof parsed?.seconds !== 'number' || typeof parsed?.name !== 'string') return null;
    return parsed;
  } catch { return null; }
}

export function saveIfBest(seconds: number, name: string): boolean {
  const existing = loadBestTime();
  if (existing && seconds >= existing.seconds) return false;
  const trimmed = name.slice(0, MAX_NAME);
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: trimmed, seconds }));
    return true;
  } catch { return false; }
}

export function resetBestTime(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
