import { useEffect, useRef } from 'react';
import type { Suit } from '../engine';

type Props = { onSkip: () => void };

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
const COLORS: Record<Suit, string> = {
  spades: '#000', clubs: '#000', hearts: '#c00', diamonds: '#c00',
};

type Particle = {
  suit: Suit;
  rank: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number; hue: number }[];
};

export default function WinCascade({ onSkip }: Props): React.ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d')!;

    const particles: Particle[] = [];
    let rafId = 0;
    let stopped = false;
    let hue = 0;
    let nextSpawn = 0;
    let spawnIdx = 0;

    const spawn = (): void => {
      const suit = SUITS[spawnIdx % 4];
      const rank = (spawnIdx % 13) + 1;
      const startX = canvas.width - 60 - (spawnIdx % 4) * 80;
      particles.push({
        suit, rank,
        x: startX, y: 50,
        vx: -2 - Math.random() * 4,
        vy: 0,
        trail: [],
      });
      spawnIdx++;
    };

    const tick = (t: number): void => {
      if (stopped) return;
      ctx.fillStyle = 'rgba(0,128,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (t > nextSpawn && spawnIdx < 52) {
        spawn();
        nextSpawn = t + 250;
      }
      hue = (hue + 4) % 360;
      for (const p of particles) {
        p.vy += 0.4;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > canvas.height - 96) {
          p.y = canvas.height - 96;
          p.vy = -p.vy * 0.85;
        }
        p.trail.push({ x: p.x + 35, y: p.y + 48, hue });
        if (p.trail.length > 30) p.trail.shift();
        for (let i = 0; i < p.trail.length; i++) {
          const tr = p.trail[i];
          ctx.fillStyle = `hsla(${tr.hue}, 90%, 60%, ${i / p.trail.length})`;
          ctx.fillRect(tr.x, tr.y, 3, 3);
        }
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x, p.y, 71, 96);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(p.x, p.y, 71, 96);
        ctx.fillStyle = COLORS[p.suit];
        ctx.font = 'bold 16px Arial';
        const label = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'][p.rank - 1];
        ctx.fillText(label, p.x + 6, p.y + 20);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onClick = (): void => { stopped = true; cancelAnimationFrame(rafId); onSkip(); };
    canvas.addEventListener('click', onClick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onClick);
    };
  }, [onSkip]);

  return <canvas ref={ref} className="sol-cascade" />;
}
