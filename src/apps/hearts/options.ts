import { DEFAULT_OPTIONS, type Options } from './engine';

const KEY = 'win95.hearts.options';

export function loadOptions(): Options {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    const parsed = JSON.parse(raw);
    return {
      difficulty: parsed.difficulty === 'easy' || parsed.difficulty === 'hard' ? parsed.difficulty : 'medium',
      showAiHands: typeof parsed.showAiHands === 'boolean' ? parsed.showAiHands : DEFAULT_OPTIONS.showAiHands,
    };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

export function saveOptions(o: Options): void {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* quota: ignore */ }
}
