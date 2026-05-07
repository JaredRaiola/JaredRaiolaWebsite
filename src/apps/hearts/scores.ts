const KEY = 'win95.hearts.stats';

export type Stats = { wins: number; losses: number; bestScore: number | null };

const EMPTY: Stats = { wins: 0, losses: 0, bestScore: null };

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
      losses: typeof parsed.losses === 'number' ? parsed.losses : 0,
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : null,
    };
  } catch { return { ...EMPTY }; }
}

export function recordResult({ humanWon, humanScore }: { humanWon: boolean; humanScore: number }): void {
  const cur = loadStats();
  const next: Stats = { ...cur };
  if (humanWon) {
    next.wins += 1;
    next.bestScore = next.bestScore === null ? humanScore : Math.min(next.bestScore, humanScore);
  } else {
    next.losses += 1;
  }
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}
