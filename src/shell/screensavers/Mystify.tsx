import { useEffect, useRef } from 'react';

type Vec = { x: number; y: number; vx: number; vy: number };

/**
 * Win95 "Mystify Your Mind" screensaver: two polygons of N vertices each, all
 * vertices bounce off the screen edges. Each polygon leaves a rainbow trail of
 * its previous frames, fading out over time.
 */
export function Mystify(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = (): void => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const VERTS = 4;       // Win95 default
    const TRAIL = 20;      // length of fading trail
    const SPEED = 1.6;

    const makePoly = (): Vec[] => Array.from({ length: VERTS }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() * 2 - 1) * SPEED,
      vy: (Math.random() * 2 - 1) * SPEED,
    }));

    const polyA = makePoly();
    const polyB = makePoly();

    const trailA: Vec[][] = [];
    const trailB: Vec[][] = [];

    let hueA = 200;
    let hueB = 0;
    let raf = 0;

    const step = (poly: Vec[]): void => {
      for (const p of poly) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
    };

    const draw = (poly: Vec[], hue: number, alpha: number): void => {
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      poly.forEach((v, i) => i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y));
      ctx.closePath();
      ctx.stroke();
    };

    const tick = (): void => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      step(polyA);
      step(polyB);
      trailA.push(polyA.map((p) => ({ ...p })));
      trailB.push(polyB.map((p) => ({ ...p })));
      if (trailA.length > TRAIL) trailA.shift();
      if (trailB.length > TRAIL) trailB.shift();
      hueA = (hueA + 0.5) % 360;
      hueB = (hueB + 0.7) % 360;

      trailA.forEach((p, i) => draw(p, hueA, (i + 1) / TRAIL));
      trailB.forEach((p, i) => draw(p, hueB, (i + 1) / TRAIL));

      raf = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="screensaver-canvas" />;
}
