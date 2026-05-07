const KEY = 'win95.freecell.stats';

export type Stats = { wins: number; losses: number; streak: number; bestStreak: number };

const EMPTY: Stats = { wins: 0, losses: 0, streak: 0, bestStreak: 0 };

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
      losses: typeof parsed.losses === 'number' ? parsed.losses : 0,
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
    };
  } catch { return { ...EMPTY }; }
}

export function recordResult(outcome: 'won' | 'lost'): void {
  const cur = loadStats();
  const next: Stats = { ...cur };
  if (outcome === 'won') {
    next.wins += 1;
    next.streak += 1;
    if (next.streak > next.bestStreak) next.bestStreak = next.streak;
  } else {
    next.losses += 1;
    next.streak = 0;
  }
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}
