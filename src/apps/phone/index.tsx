import { useEffect, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useSoundStore } from '@/stores/soundStore';
import { useBsodStore } from '@/stores/bsodStore';
import { sysAlert } from '@/lib/dialog';
import { speak, cancelSpeech } from '@/lib/speech';
import { playDtmf, playReorder, playDialTone } from './dtmf';
import './phone.css';

const KEYS: Array<Array<string>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

const KEY_LETTERS: Record<string, string> = {
  '1': '   ',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '*': '   ',
  '0': '   ',
  '#': '   ',
};

type SpeedDial = {
  label: string;
  number: string;
  /** What happens when this speed dial connects. */
  action: 'open' | 'easter';
  url?: string;
};

const SPEED_DIALS: SpeedDial[] = [
  { label: 'GitHub',   number: 'GIT-HUB',  action: 'open', url: 'https://github.com/JaredRaiola' },
  { label: 'LinkedIn', number: '555-LINK',  action: 'open', url: 'https://www.linkedin.com/in/jaredraiola' },
  { label: 'Microsoft',number: '555-1995',  action: 'easter' },
  { label: 'Pizza',    number: '555-PIZZA', action: 'easter' },
];

type EasterEgg = {
  test: (n: string) => boolean;
  reply: string;
  speak?: boolean;
};

const EASTER_EGGS: EasterEgg[] = [
  {
    // Jared's actual number.
    test: (n) => /8454907692$/.test(n),
    reply: "Hi! You've reached Jared. He's probably playing Counter-Strike right now. Leave a message after the beep — beep!",
  },
  {
    // Tommy Tutone — "Jenny, I got your number".
    test: (n) => /8675309$/.test(n),
    reply: "Jenny, I tried that number — she's not picking up.",
  },
  {
    // Ghostbusters.
    test: (n) => /5552368$/.test(n),
    reply: "Who you gonna call?",
  },
  {
    // Empire Carpet.
    test: (n) => /18005882300$/.test(n) || /5882300$/.test(n),
    reply: "Five-eight-eight, two-three-hundred — Empire!",
  },
  {
    // Counter-Strike bomb defuse code (foreshadows the Counter-Strike voicemail).
    test: (n) => /7355608$/.test(n),
    reply: "The bomb has been planted.",
  },
  {
    // LOST numbers.
    test: (n) => /^4815162342$/.test(n),
    reply: "We have to go back!",
  },
  {
    // The answer.
    test: (n) => n === '42',
    reply: "The answer to life, the universe, and everything.",
  },
  {
    // Pi.
    test: (n) => n === '31415' || n === '314159' || n === '3141592',
    reply: "Mmm, pie.",
  },
  {
    // 666.
    test: (n) => n === '666',
    reply: "...the line went dead.",
  },
  {
    // Moon landing.
    test: (n) => n === '1969',
    reply: "Houston, the Eagle has landed.",
  },
  {
    // Operator.
    test: (n) => n === '0' || n === '00',
    reply: "Operator. How may I direct your call?",
  },
  {
    // Schoolyard classic — read upside down.
    test: (n) => n === '5318008' || n === '80085',
    reply: "Real mature.",
  },
  {
    // Generic test/junk numbers.
    test: (n) => n === '1234' || n === '12345' || n === '123' || n === '11111',
    reply: "Are you just hitting random buttons?",
  },
  {
    // 411 — directory assistance.
    test: (n) => n === '411',
    reply: "Information. What city, please?",
  },
  {
    // 1995 — Win95 nostalgia.
    test: (n) => /1995$/.test(n),
    reply: "Microsoft Information Line — please hold while we connect you to 1995.",
  },
];

type PhoneSnapshot = { number: string };

function normalize(num: string): string {
  return num.replace(/[^0-9*#]/g, '');
}

export default function PhoneApp({ api, restoreState }: AppProps) {
  const restored = restoreState as Partial<PhoneSnapshot> | undefined;
  const [number, setNumber] = useState<string>(typeof restored?.number === 'string' ? restored.number : '');
  const [status, setStatus] = useState<string>('');
  const muted = useSoundStore((s) => s.muted);

  useEffect(() => {
    return api.registerSnapshot((): PhoneSnapshot => ({ number }));
  }, [number, api]);

  const beep = (digit: string): void => { if (!muted) playDtmf(digit); };
  const say = (text: string): void => { if (!muted) speak(text); };

  // Stop speech when the window unmounts.
  useEffect(() => () => cancelSpeech(), []);

  const press = (key: string): void => {
    setStatus('');
    beep(key);
    if (number.length < 14) setNumber((n) => n + key);
  };

  const clear = (): void => { setNumber(''); setStatus(''); };

  const dial = (): void => {
    const n = normalize(number);
    if (n.length === 0) {
      if (!muted) playDialTone(800);
      setStatus('Pick up the receiver and dial.');
      return;
    }
    setStatus('Connecting…');

    setTimeout(() => {
      // Special-action easter eggs (not just a status line).
      if (n === '1234567' || n === '5551234') {
        useBsodStore.getState().trigger();
        return;
      }
      if (n === '911') {
        void sysAlert(
          "This is a Win95 facsimile. Please don't dial 911 here. Hang up and call again from a real phone if there's an actual emergency.",
          { title: 'Phone Dialer', icon: 'warn' },
        );
        setStatus('');
        return;
      }

      // Status-line easter eggs.
      for (const egg of EASTER_EGGS) {
        if (egg.test(n)) {
          setStatus(egg.reply);
          if (egg.speak !== false) say(egg.reply);
          return;
        }
      }

      // Generic: "all circuits are busy".
      if (!muted) playReorder();
      setStatus('All circuits are busy. Please try your call again later.');
    }, 350);
  };

  const hangup = (): void => {
    setStatus('');
    setNumber('');
  };

  const speedDial = (entry: SpeedDial): void => {
    setNumber(entry.number);
    setStatus('Dialing…');
    // Play DTMF tones for each digit in the label, staggered.
    if (!muted) {
      const digits = normalize(entry.number);
      for (let i = 0; i < digits.length; i++) {
        setTimeout(() => playDtmf(digits[i] || '0'), i * 90);
      }
    }
    const dialDelay = Math.max(450, normalize(entry.number).length * 90 + 200);
    setTimeout(() => {
      if (entry.action === 'open' && entry.url) {
        window.open(entry.url, '_blank', 'noopener,noreferrer');
        const msg = `Connected to ${entry.label}.`;
        setStatus(msg);
        say(msg);
        return;
      }
      if (entry.label === 'Microsoft') {
        const msg = "We're sorry — Microsoft is not affiliated with this site.";
        setStatus(msg);
        say(msg);
      } else if (entry.label === 'Pizza') {
        const msg = "Hello, Pizza Palace. We deliver in 30 minutes or it's free!";
        setStatus(msg);
        say(msg);
      } else {
        setStatus('All circuits are busy.');
        if (!muted) playReorder();
      }
    }, dialDelay);
  };

  return (
    <div className="ph-root">
      <div className="ph-display">
        <div className="ph-number">{number || ' '}</div>
        <div className="ph-status">{status || ' '}</div>
      </div>

      <div className="ph-body">
        <div className="ph-keypad">
          {KEYS.flat().map((k) => (
            <button key={k} className="ph-key" onClick={() => press(k)}>
              <div className="ph-key-digit">{k}</div>
              <div className="ph-key-letters">{KEY_LETTERS[k]}</div>
            </button>
          ))}
        </div>

        <div className="ph-side">
          <div className="ph-side-label">Speed Dial</div>
          <div className="ph-speed-list">
            {SPEED_DIALS.map((sd) => (
              <button key={sd.label} className="ph-speed" onClick={() => speedDial(sd)}>
                <span className="ph-speed-label">{sd.label}</span>
                <span className="ph-speed-num">{sd.number}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ph-actions">
        <button className="ph-clear" onClick={clear} disabled={number.length === 0}>Clear</button>
        <button className="ph-dial" onClick={dial}>Dial</button>
        <button className="ph-hang" onClick={hangup}>Hang Up</button>
      </div>
    </div>
  );
}
