const KEY = 'minesweeper.bestTimes.v1';
const MAX_NAME = 25;

export type BuiltinDifficulty = 'beginner' | 'intermediate' | 'expert';

export type BestTimeRecord = { name: string; seconds: number };

export type BestTimes = {
  beginner: BestTimeRecord | null;
  intermediate: BestTimeRecord | null;
  expert: BestTimeRecord | null;
};

const EMPTY: BestTimes = { beginner: null, intermediate: null, expert: null };

export function loadBestTimes(): BestTimes {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as BestTimes;
    return {
      beginner: parsed.beginner ?? null,
      intermediate: parsed.intermediate ?? null,
      expert: parsed.expert ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveIfBest(difficulty: BuiltinDifficulty, seconds: number, name: string): boolean {
  const current = loadBestTimes();
  const existing = current[difficulty];
  if (existing && seconds >= existing.seconds) return false;
  const trimmed = name.slice(0, MAX_NAME);
  current[difficulty] = { name: trimmed, seconds };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* quota: silently fail */
  }
  return true;
}

export function resetBestTimes(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
