/**
 * DTMF (Dual-Tone Multi-Frequency) tone synthesis. Each phone key produces
 * a unique two-tone signal — these are the authentic ITU-T frequencies.
 */

const ROW_FREQ: Record<string, number> = {
  '1': 697, '2': 697, '3': 697,
  '4': 770, '5': 770, '6': 770,
  '7': 852, '8': 852, '9': 852,
  '*': 941, '0': 941, '#': 941,
};

const COL_FREQ: Record<string, number> = {
  '1': 1209, '2': 1336, '3': 1477,
  '4': 1209, '5': 1336, '6': 1477,
  '7': 1209, '8': 1336, '9': 1477,
  '*': 1209, '0': 1336, '#': 1477,
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (ctx === null) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playDtmf(digit: string, durationMs = 140): void {
  const r = ROW_FREQ[digit];
  const c = COL_FREQ[digit];
  if (!r || !c) return;
  try {
    const ac = getCtx();
    const t0 = ac.currentTime;
    const dur = durationMs / 1000;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.16, t0 + 0.005);
    gain.gain.linearRampToValueAtTime(0.16, t0 + dur - 0.02);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
    gain.connect(ac.destination);

    const oscR = ac.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.value = r;
    oscR.connect(gain);
    oscR.start(t0);
    oscR.stop(t0 + dur + 0.02);

    const oscC = ac.createOscillator();
    oscC.type = 'sine';
    oscC.frequency.value = c;
    oscC.connect(gain);
    oscC.start(t0);
    oscC.stop(t0 + dur + 0.02);
  } catch { /* AudioContext blocked; silent fail */ }
}

/** "All circuits busy" reorder tone (two alternating tones, 250ms each). */
export function playReorder(): void {
  try {
    const ac = getCtx();
    const t0 = ac.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * 0.5;
      [480, 620].forEach((f) => {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(g).connect(ac.destination);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.01);
        g.gain.linearRampToValueAtTime(0.12, t + 0.24);
        g.gain.linearRampToValueAtTime(0, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.27);
      });
    }
  } catch { /* ignore */ }
}

/** Dial tone (350+440 Hz continuous) for ~1s. */
export function playDialTone(durationMs = 1000): void {
  try {
    const ac = getCtx();
    const t0 = ac.currentTime;
    const dur = durationMs / 1000;
    [350, 440].forEach((f) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(g).connect(ac.destination);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.1, t0 + 0.02);
      g.gain.linearRampToValueAtTime(0.1, t0 + dur - 0.05);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  } catch { /* ignore */ }
}
