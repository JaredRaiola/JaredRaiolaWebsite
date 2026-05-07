/**
 * Wrapper around the browser's SpeechSynthesis API. Picks a deeper, robotic
 * voice when available — gives the Phone Dialer easter eggs a Sam-style
 * computer voice on iOS and a Microsoft David / Zira on Windows.
 */

type SpeakOpts = {
  rate?: number;   // 0.1 – 10. Default 0.9.
  pitch?: number;  // 0 – 2. Lower = more robotic. Default 0.6.
  volume?: number; // 0 – 1. Default 1.
};

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickRobotVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  voicesLoaded = true;
  // Preference order: deeper/more synthetic-sounding voices first.
  const patterns = [
    /microsoft david/i,
    /microsoft mark/i,
    /microsoft george/i,
    /google us english/i,
    /alex/i,
    /fred/i,           // classic macOS robotic voice
    /daniel/i,
    /\ben-us\b/i,
  ];
  for (const re of patterns) {
    const match = voices.find((v) => re.test(v.name) || re.test(v.lang));
    if (match) { cachedVoice = match; return match; }
  }
  cachedVoice = voices[0];
  return cachedVoice;
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

export function cancelSpeech(): void {
  if (!isSpeechAvailable()) return;
  window.speechSynthesis.cancel();
}

export function speak(text: string, opts: SpeakOpts = {}): void {
  if (!isSpeechAvailable()) return;
  // Strip "—" since most synthesizers say "em dash" out loud.
  const cleaned = text.replace(/[—–]/g, ',').replace(/\s+/g, ' ').trim();
  if (!cleaned) return;
  // Voices may not be ready immediately on Chromium; defer until they are.
  const queue = (): void => {
    const u = new SpeechSynthesisUtterance(cleaned);
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 0.65;
    u.volume = opts.volume ?? 1;
    const voice = pickRobotVoice();
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  if (voicesLoaded || pickRobotVoice() !== null) {
    queue();
  } else {
    const onReady = (): void => {
      voicesLoaded = true;
      queue();
      window.speechSynthesis.removeEventListener('voiceschanged', onReady);
    };
    window.speechSynthesis.addEventListener('voiceschanged', onReady);
    // Fallback: if the event never fires, try once after a short wait.
    setTimeout(queue, 250);
  }
}
