import { useEffect, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import './doom.css';

/**
 * DOOM running on a Chocolate-Doom WASM port (via @nicejsisverycool/tizendoom,
 * itself based on cloudflare/doom-wasm). The engine binary, the shareware
 * doom1.wad, and a default.cfg all live under /doom-wasm/ — no external CDN
 * and no DOSBox; pure browser-native Doom.
 *
 * Controls (default doom mapping, with WASD remapped to arrows below):
 *   Arrow keys / WASD — move
 *   Ctrl              — fire
 *   Space             — open / use
 *   Shift             — run
 *   1–7               — switch weapons
 *   Esc               — pause / menu
 */

const DOOM_DIR = '/doom-wasm';
const DOOM_SCRIPT = `${DOOM_DIR}/websockets-doom.js`;
const DOOM_ARGS = ['-iwad', 'doom1.wad', '-window', '-nogui', '-nomusic', '-nomouse', '-config', 'default.cfg'];

declare global {
  interface Window {
    Module?: DoomModule;
    callMain?: (args: string[]) => void;
  }
}

type DoomModule = {
  canvas: HTMLCanvasElement;
  noInitialRun: boolean;
  preRun: () => void;
  onRuntimeInitialized: () => void;
  printErr: (text: string) => void;
  print: (text: string) => void;
  setStatus: (text: string) => void;
  monitorRunDependencies: (left: number) => void;
  totalDependencies: number;
  locateFile?: (path: string) => string;
  FS?: { createPreloadedFile: (parent: string, name: string, url: string, canRead: boolean, canWrite: boolean) => void };
};

type Status = 'idle' | 'loading' | 'running' | 'error';

export default function DoomApp(_props: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [statusText, setStatusText] = useState('Loading engine…');
  const [started, setStarted] = useState(false);

  // Verify assets exist + show download progress for the .wasm file. The
  // emscripten Module callbacks alone don't surface a percentage, so we
  // fetch the .wasm ourselves and feed the bytes back via instantiate.
  useEffect(() => {
    if (!started || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    setStatus('loading');
    setStatusText('Loading engine…');

    // Defense-in-depth against mouse capture. -nomouse disables Doom's mouse
    // input at the engine level, but the SDL/emscripten layer can still call
    // requestPointerLock on click. No-op the request so the cursor stays free.
    canvas.requestPointerLock = () => Promise.resolve();

    // Configure the emscripten Module before the script loads — the doom-wasm
    // build reads window.Module on startup.
    window.Module = {
      canvas,
      noInitialRun: true,
      preRun() {
        const fs = window.Module?.FS;
        if (!fs) return;
        fs.createPreloadedFile('', 'doom1.wad', `${DOOM_DIR}/doom1.wad`, true, true);
        fs.createPreloadedFile('', 'default.cfg', `${DOOM_DIR}/default.cfg`, true, true);
      },
      onRuntimeInitialized() {
        if (cancelled) return;
        try {
          window.callMain?.(DOOM_ARGS);
          setStatus('running');
        } catch (e) {
          setStatus('error');
          setErrMsg((e as Error).message);
        }
      },
      locateFile: (path: string) => `${DOOM_DIR}/${path}`,
      printErr: (t: string) => console.error('[doom]', t),
      print: (t: string) => console.log('[doom]', t),
      setStatus(text: string) {
        if (cancelled) return;
        // Emscripten emits things like "Downloading data... (5392/8421)".
        const m = text.match(/\((\d+)\/(\d+)\)/);
        if (m) {
          setProgress({ loaded: Number(m[1]), total: Number(m[2]) });
          setStatusText('Loading game data…');
        } else if (text) {
          setStatusText(text);
        }
      },
      monitorRunDependencies(left: number) {
        if (cancelled) return;
        const t = window.Module?.totalDependencies ?? 0;
        if (t > 0) setProgress({ loaded: t - left, total: t });
      },
      totalDependencies: 0,
    };

    // Inject the engine script. WebGL context is established when callMain
    // runs Doom's renderer.
    const script = document.createElement('script');
    script.src = DOOM_SCRIPT;
    script.async = true;
    script.onerror = () => {
      if (cancelled) return;
      setStatus('error');
      setErrMsg('Failed to load doom-wasm engine.');
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.remove();
      // Doom-wasm has no clean shutdown; the runtime stays alive until the
      // page reloads. Close+reopen of the app is effectively a hard reset
      // since react re-mounts the canvas — that's acceptable for this use.
      // (`callMain` is defined non-configurable by emscripten, so assign
      // rather than delete to avoid TypeError on unmount.)
      try { (window as { Module?: unknown }).Module = undefined; } catch { /* ignore */ }
      try { (window as { callMain?: unknown }).callMain = undefined; } catch { /* ignore */ }
    };
  }, [started]);

  // WASD → arrow remap. Doom's default config uses arrows for movement.
  // We forward the keystrokes to the canvas as if the user pressed arrows.
  useEffect(() => {
    if (status !== 'running' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const map: Record<string, { code: string; key: string; keyCode: number }> = {
      KeyW: { code: 'ArrowUp',    key: 'ArrowUp',    keyCode: 38 },
      KeyA: { code: 'ArrowLeft',  key: 'ArrowLeft',  keyCode: 37 },
      KeyS: { code: 'ArrowDown',  key: 'ArrowDown',  keyCode: 40 },
      KeyD: { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39 },
    };

    const synth = (type: 'keydown' | 'keyup', m: { code: string; key: string; keyCode: number }): void => {
      const ev = new KeyboardEvent(type, {
        code: m.code, key: m.key, keyCode: m.keyCode, which: m.keyCode, bubbles: true, cancelable: true,
      });
      canvas.dispatchEvent(ev);
    };
    const onDown = (e: KeyboardEvent): void => {
      const m = map[e.code];
      if (!m) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) synth('keydown', m);
    };
    const onUp = (e: KeyboardEvent): void => {
      const m = map[e.code];
      if (!m) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      synth('keyup', m);
    };
    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup', onUp, true);
    return () => {
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup', onUp, true);
    };
  }, [status]);

  if (!started) {
    return (
      <div className="doom-root">
        <div className="doom-splash">
          <div className="doom-splash-title">DOOM</div>
          <p className="doom-splash-text">
            Shareware Episode 1: <em>Knee-Deep in the Dead</em>.<br />
            WebAssembly port — runs natively in your browser.
          </p>
          <p className="doom-splash-controls">
            <strong>Controls:</strong> arrows or WASD to move, Ctrl to fire,
            Space to open doors, Shift to run, 1–7 to switch weapons, Esc for menu.
          </p>
          <button className="doom-splash-btn" onClick={() => setStarted(true)}>
            START GAME
          </button>
          <p className="doom-splash-note">
            Click on the game canvas after it loads so your keystrokes reach the engine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="doom-root">
      <canvas
        ref={canvasRef}
        id="canvas"
        className="doom-canvas"
        tabIndex={-1}
        onContextMenu={(e) => e.preventDefault()}
      />
      {status === 'loading' && (
        <div className="doom-loading">
          <div className="doom-loading-text">{statusText}</div>
          <div className="doom-progress">
            <div
              className={`doom-progress-bar ${progress ? 'determinate' : 'indeterminate'}`}
              style={progress ? { width: `${Math.round((progress.loaded / progress.total) * 100)}%` } : undefined}
            />
          </div>
          {progress && (
            <div className="doom-progress-pct">
              {Math.round((progress.loaded / progress.total) * 100)}%
            </div>
          )}
        </div>
      )}
      {status === 'error' && (
        <div className="doom-loading" style={{ color: '#ff6060' }}>
          Failed: {errMsg}
        </div>
      )}
    </div>
  );
}
