import { useEffect, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import './doom.css';

/**
 * DOOM (1993, shareware) running on self-hosted js-dos. Bundle and emulator
 * cores are served from our own origin (/jsdos/* and /games/doom/doom.jsdos)
 * so there's no external CDN dependency.
 *
 * Controls:
 *   Arrow keys / WASD — move (WASD remapped to arrows below)
 *   Ctrl              — fire
 *   Space             — open / use
 *   Shift             — run
 *   1–7               — switch weapons
 *   Esc               — pause / menu
 */

const BUNDLE_URL = '/games/doom/doom.jsdos';
const JSDOS_SCRIPT = '/jsdos/js-dos.js';
const JSDOS_CSS = '/jsdos/js-dos.css';
const EMULATORS_PREFIX = '/jsdos/emulators/';

// js-dos key codes (GLFW-style).
const KEY_UP = 265, KEY_DOWN = 264, KEY_LEFT = 263, KEY_RIGHT = 262;

type CommandInterface = {
  sendKeyEvent: (keyCode: number, pressed: boolean) => void;
  exit: () => Promise<void>;
};

type DoomStatus = 'idle' | 'loading' | 'missing' | 'error' | 'running';

declare global {
  interface Window {
    Dos?: (root: HTMLElement, opts: { url: string }) => Promise<CommandInterface>;
    emulators?: { pathPrefix?: string };
  }
}

function loadCss(href: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  return link;
}

function loadScript(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) { resolve(existing); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(s);
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function DoomApp(_props: AppProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ciRef = useRef<CommandInterface | null>(null);
  const [status, setStatus] = useState<DoomStatus>('idle');
  const [errMsg, setErrMsg] = useState<string>('');
  const [started, setStarted] = useState(false);

  // Mount the emulator once the user clicks START.
  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const cssLink = loadCss(JSDOS_CSS);

    (async () => {
      // Verify the bundle exists before bothering with the emulator.
      setStatus('loading');
      try {
        const head = await fetch(BUNDLE_URL, { method: 'HEAD' });
        if (!head.ok) throw new Error(`HTTP ${head.status}`);
      } catch {
        if (!cancelled) setStatus('missing');
        return;
      }

      // js-dos reads window.emulators.pathPrefix to find its wasm cores.
      window.emulators = { pathPrefix: EMULATORS_PREFIX };

      try {
        await loadScript(JSDOS_SCRIPT);
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrMsg((e as Error).message);
        }
        return;
      }

      if (cancelled || !rootRef.current || !window.Dos) return;
      try {
        const ci = await window.Dos(rootRef.current, { url: BUNDLE_URL });
        if (cancelled) {
          void ci.exit();
          return;
        }
        ciRef.current = ci;
        setStatus('running');
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrMsg((e as Error).message);
        }
      }
    })();

    return () => {
      cancelled = true;
      cssLink.remove();
      const ci = ciRef.current;
      ciRef.current = null;
      if (ci) void ci.exit().catch(() => {});
    };
  }, [started]);

  // WASD → arrow key remap. Only active while the emulator is running and
  // the document hasn't moved focus elsewhere.
  useEffect(() => {
    if (status !== 'running') return;
    const map: Record<string, number> = {
      KeyW: KEY_UP,
      KeyA: KEY_LEFT,
      KeyS: KEY_DOWN,
      KeyD: KEY_RIGHT,
    };
    const send = (code: string, pressed: boolean): boolean => {
      const k = map[code];
      if (!k) return false;
      ciRef.current?.sendKeyEvent(k, pressed);
      return true;
    };
    const onDown = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      if (send(e.code, true)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent): void => {
      if (send(e.code, false)) e.preventDefault();
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
            DOOM (1993, shareware episode 1: <em>Knee-Deep in the Dead</em>).
          </p>
          <p className="doom-splash-controls">
            <strong>Controls:</strong> arrows or WASD to move, Ctrl to fire,
            Space to open doors, Shift to run, 1–7 to switch weapons, Esc for menu.
          </p>
          <button className="doom-splash-btn" onClick={() => setStarted(true)}>
            START GAME
          </button>
          <p className="doom-splash-note">
            Click inside the game window after it loads so your keystrokes reach the game.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <div className="doom-root">
        <div className="doom-splash">
          <div className="doom-splash-title">DOOM</div>
          <p className="doom-splash-text">
            <strong>Missing game data.</strong>
          </p>
          <p className="doom-splash-controls" style={{ textAlign: 'left' }}>
            The DOOM shareware bundle has not been added to this site yet. To play, drop
            <br /><code>doom.jsdos</code> into <code>public/games/doom/</code>.
            <br /><br />
            See <code>scripts/build-doom-bundle.mjs</code> for a helper that takes
            a <code>DOOM1.WAD</code> (shareware, freely redistributable) and produces
            the bundle.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="doom-root">
        <div className="doom-splash">
          <div className="doom-splash-title">DOOM</div>
          <p className="doom-splash-text">Failed to start: {errMsg || 'unknown error'}</p>
          <button className="doom-splash-btn" onClick={() => { setStarted(false); setStatus('idle'); }}>
            BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doom-root" ref={rootRef}>
      {status === 'loading' && (
        <div className="doom-loading">Loading shareware DOOM…</div>
      )}
    </div>
  );
}
