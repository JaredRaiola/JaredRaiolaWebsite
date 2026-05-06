import { DEFAULT_OPTIONS, type Options } from './engine';

const OPTIONS_KEY = 'win95.solitaire.options';
const VEGAS_KEY = 'win95.solitaire.vegasBalance';

export function loadOptions(): Options {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    const parsed = JSON.parse(raw);
    return {
      draw: parsed.draw === 3 ? 3 : 1,
      scoring: parsed.scoring === 'vegas' || parsed.scoring === 'none' ? parsed.scoring : 'standard',
      timed: typeof parsed.timed === 'boolean' ? parsed.timed : DEFAULT_OPTIONS.timed,
      statusBar: typeof parsed.statusBar === 'boolean' ? parsed.statusBar : DEFAULT_OPTIONS.statusBar,
      outlineDragging: typeof parsed.outlineDragging === 'boolean' ? parsed.outlineDragging : DEFAULT_OPTIONS.outlineDragging,
      vegasKeepScore: typeof parsed.vegasKeepScore === 'boolean' ? parsed.vegasKeepScore : DEFAULT_OPTIONS.vegasKeepScore,
    };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

export function saveOptions(o: Options): void {
  try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(o)); } catch { /* quota: ignore */ }
}

export function loadVegasBalance(): number {
  try {
    const raw = localStorage.getItem(VEGAS_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

export function saveVegasBalance(n: number): void {
  try { localStorage.setItem(VEGAS_KEY, String(n)); } catch { /* ignore */ }
}
