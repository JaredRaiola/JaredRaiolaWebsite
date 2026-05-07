import { useEffect, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import './doom.css';

/**
 * DOOM (1993, shareware) embedded via archive.org's MS-DOS emulator. Their
 * service hosts the game legally and supports iframe embedding, so we get a
 * fully working Doom without bundling the WAD or a DOSBox runtime ourselves.
 *
 * Controls (canonical Doom):
 *   Arrow keys / WASD — move
 *   Ctrl              — fire
 *   Space             — open / use
 *   Shift             — run
 *   1–7               — switch weapons
 *   Esc               — pause / menu
 */

const ARCHIVE_EMBED = 'https://archive.org/embed/msdos_DOOM_1993';

export default function DoomApp(_props: AppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);

  // Auto-focus the iframe when started so keyboard input goes to Doom.
  useEffect(() => {
    if (!started) return;
    const t = window.setTimeout(() => iframeRef.current?.focus(), 250);
    return () => window.clearTimeout(t);
  }, [started]);

  if (!started) {
    return (
      <div className="doom-root">
        <div className="doom-splash">
          <div className="doom-splash-title">DOOM</div>
          <p className="doom-splash-text">
            DOOM (1993, shareware episode 1: <em>Knee-Deep in the Dead</em>).<br />
            Loaded from the Internet Archive — first launch may take a few seconds.
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

  return (
    <div className="doom-root">
      <iframe
        ref={iframeRef}
        className="doom-frame"
        src={ARCHIVE_EMBED}
        title="DOOM"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
