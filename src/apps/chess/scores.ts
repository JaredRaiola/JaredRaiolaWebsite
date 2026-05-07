const KEY = 'win95.chess.stats';

export type Stats = { wins: number; losses: number; draws: number };

const EMPTY: Stats = { wins: 0, losses: 0, draws: 0 };

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
      losses: typeof parsed.losses === 'number' ? parsed.losses : 0,
      draws: typeof parsed.draws === 'number' ? parsed.draws : 0,
    };
  } catch { return { ...EMPTY }; }
}

export function recordOutcome(outcome: 'win' | 'loss' | 'draw'): void {
  const cur = loadStats();
  const next: Stats = { ...cur };
  if (outcome === 'win') next.wins += 1;
  else if (outcome === 'loss') next.losses += 1;
  else next.draws += 1;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}
