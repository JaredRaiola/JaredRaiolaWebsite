import { useEffect, useRef } from 'react';

/**
 * Win95-style "3D Pipes" screensaver. Pseudo-3D: pipes drawn on a 2D canvas
 * with isometric-ish projection. Each pipe segment is a colored cuboid that
 * can branch at right angles. When the canvas fills up, fades to black and
 * starts over.
 */
export function Pipes(): React.ReactElement {
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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const CELL = 24; // grid cell size in px

    // Directions: 0=right, 1=down, 2=left, 3=up
    type Pipe = { x: number; y: number; dir: number; color: string; alive: boolean };
    const COLORS = ['#ff5b6e', '#5bd0ff', '#ffe45b', '#7fff5b', '#ff5be3', '#ff9a3c', '#a37bff', '#3cffd6'];

    const pipes: Pipe[] = [];
    const trail = new Set<string>(); // cells already drawn

    const newPipe = (): Pipe => ({
      x: Math.floor(Math.random() * (W() / CELL)),
      y: Math.floor(Math.random() * (H() / CELL)),
      dir: Math.floor(Math.random() * 4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alive: true,
    });

    const reset = (): void => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W(), H());
      pipes.length = 0;
      trail.clear();
      for (let i = 0; i < 3; i++) pipes.push(newPipe());
    };
    reset();

    let raf = 0;
    let tick = 0;
    let resetCountdown = -1;

    const drawSegment = (p: Pipe): void => {
      const cx = p.x * CELL + CELL / 2;
      const cy = p.y * CELL + CELL / 2;
      const r = CELL * 0.42;
      // Sphere/joint at every cell.
      const grad = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.2, cx, cy, r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.4, p.color);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = (): void => {
      for (const p of pipes) {
        if (!p.alive) continue;
        drawSegment(p);
        trail.add(`${p.x},${p.y}`);
        // 12% chance to turn 90°.
        if (Math.random() < 0.12) p.dir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) & 3;
        const dx = p.dir === 0 ? 1 : p.dir === 2 ? -1 : 0;
        const dy = p.dir === 1 ? 1 : p.dir === 3 ? -1 : 0;
        p.x += dx; p.y += dy;
        // Out of bounds or hit a trail cell — kill this pipe and spawn another.
        if (p.x < 0 || p.x * CELL >= W() || p.y < 0 || p.y * CELL >= H() || trail.has(`${p.x},${p.y}`)) {
          p.alive = false;
        }
      }
      // Replace dead pipes (cap total).
      for (let i = 0; i < pipes.length; i++) {
        if (!pipes[i].alive) pipes[i] = newPipe();
      }
      // Filled enough? Schedule a reset.
      if (resetCountdown < 0 && trail.size > (W() * H()) / (CELL * CELL) * 0.55) {
        resetCountdown = 60;
      }
      if (resetCountdown > 0) {
        resetCountdown--;
        if (resetCountdown === 0) { reset(); resetCountdown = -1; }
      }
    };

    const animate = (): void => {
      tick++;
      if (tick % 2 === 0) step();
      raf = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="screensaver-canvas" />;
}
