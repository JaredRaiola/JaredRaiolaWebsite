/**
 * Win95-style system sounds, synthesized with Web Audio API.
 * No external assets — keeps the bundle lean and works offline.
 *
 * Sound names map to canonical Win95 events:
 *   chord     — error/warning ding (descending major-7 arpeggio with harp envelope)
 *   ding      — generic notification (single short tone)
 *   tada      — info/success (ascending major arpeggio)
 *   exclam    — exclamation (two-tone alert)
 *   recycle   — empty recycle bin (paper-crumple white-noise burst)
 *   startup   — boot chime (sustained chord build)
 *   shutdown  — power-off (descending sweep)
 *   bsod      — bsod easter egg (long monotone)
 */

export type SoundName =
  | 'chord' | 'ding' | 'tada' | 'exclam'
  | 'recycle' | 'startup' | 'shutdown' | 'bsod';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (ctx === null) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function envelope(node: GainNode, t: number, attack: number, decay: number, sustain: number, release: number, peak = 1): void {
  const ac = node.context;
  node.gain.cancelScheduledValues(t);
  node.gain.setValueAtTime(0, t);
  node.gain.linearRampToValueAtTime(peak, t + attack);
  node.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
  node.gain.linearRampToValueAtTime(0, t + attack + decay + release);
  void ac; // satisfies strict mode
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.18): void {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain).connect(ac.destination);
  envelope(gain, start, 0.01, duration * 0.3, 0.6, duration * 0.7, volume);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function chordSound(): void {
  const ac = getCtx();
  const t0 = ac.currentTime;
  // Microsoft "chord": E5, G5, C6 played as a harp-like arpeggio.
  const freqs = [659.25, 784.0, 1046.5];
  freqs.forEach((f, i) => tone(f, t0 + i * 0.06, 0.55, 'triangle', 0.16));
}

function dingSound(): void {
  const ac = getCtx();
  tone(880, ac.currentTime, 0.18, 'sine', 0.2);
}

function tadaSound(): void {
  const ac = getCtx();
  const t0 = ac.currentTime;
  // C5, E5, G5, C6 ascending.
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t0 + i * 0.08, 0.5, 'triangle', 0.18));
}

function exclamSound(): void {
  const ac = getCtx();
  const t0 = ac.currentTime;
  tone(740, t0, 0.18, 'square', 0.14);
  tone(587, t0 + 0.18, 0.22, 'square', 0.14);
}

function recycleSound(): void {
  // Paper-crumple: short white-noise burst with fast attack and slow decay.
  const ac = getCtx();
  const duration = 0.6;
  const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // Pinkish noise, decaying.
    const decay = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * decay * decay;
  }
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = buffer;
  src.connect(gain).connect(ac.destination);
  gain.gain.value = 0.4;
  src.start(ac.currentTime);
}

function startupSound(): void {
  const ac = getCtx();
  const t0 = ac.currentTime;
  // Two-second swelling chord: C major triad spanning two octaves.
  const freqs = [130.81, 196.0, 261.63, 329.63, 392.0, 523.25];
  for (const f of freqs) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.connect(gain).connect(ac.destination);
    envelope(gain, t0, 0.4, 0.6, 0.65, 1.0, 0.06);
    osc.start(t0);
    osc.stop(t0 + 2.1);
  }
}

function shutdownSound(): void {
  const ac = getCtx();
  const t0 = ac.currentTime;
  // Descending sweep.
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, t0);
  osc.frequency.exponentialRampToValueAtTime(110, t0 + 1.2);
  osc.connect(gain).connect(ac.destination);
  envelope(gain, t0, 0.05, 0.3, 0.7, 0.85, 0.12);
  osc.start(t0);
  osc.stop(t0 + 1.3);
}

function bsodSound(): void {
  const ac = getCtx();
  const t0 = ac.currentTime;
  // Cold flat tone — uneasy.
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 110;
  osc.connect(gain).connect(ac.destination);
  envelope(gain, t0, 0.02, 0.05, 0.95, 0.5, 0.18);
  osc.start(t0);
  osc.stop(t0 + 0.6);
}

const REGISTRY: Record<SoundName, () => void> = {
  chord: chordSound,
  ding: dingSound,
  tada: tadaSound,
  exclam: exclamSound,
  recycle: recycleSound,
  startup: startupSound,
  shutdown: shutdownSound,
  bsod: bsodSound,
};

export function playRaw(name: SoundName): void {
  try { REGISTRY[name](); } catch { /* AudioContext blocked; silent fail */ }
}
