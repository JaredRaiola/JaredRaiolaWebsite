import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { useClippyStore } from '@/stores/clippyStore';
import './Clippy.css';

const TIPS_BY_APP: Record<string, string[]> = {
  notepad: [
    "It looks like you're writing a letter. Need help?",
    'Tip: Ctrl+S saves. Ctrl+Z undoes.',
  ],
  solitaire: [
    'Stuck? Right-click the felt to auto-finish.',
    'Double-click a card to auto-move it to the foundation.',
    'F2 deals a new game.',
  ],
  freecell: [
    'Capacity = (free cells + 1) × 2^(empty columns). The more space, the bigger the supermove.',
    'Stuck? Try emptying a column to multiply your supermove capacity.',
  ],
  hearts: [
    'Tip: shoot the moon = take all 13 hearts AND the queen of spades. -26 for everyone else.',
    "Avoid the queen of spades unless you're shooting the moon.",
  ],
  chess: [
    'Right-click does nothing here. Click a piece, click a destination.',
    'Stuck? Try Game → New Game → Beginner.',
  ],
  minesweeper: [
    'Right-click a square to flag it.',
    'Tip: middle-click (or both buttons) on a number to chord-clear adjacent unflagged squares.',
  ],
  cmd: [
    "Tip: type 'help' to list commands.",
    "Try 'cd My Documents' or 'dir'.",
    'Press Tab to autocomplete file and directory names.',
  ],
  paint: [
    'Tip: hold Shift while drawing a line for 45° angles.',
  ],
  explorer: [
    'Type a path in the address bar to navigate. Try "C:\\My Documents".',
    "Type 'cmd' in the address bar to open a Command Prompt at the current folder.",
  ],
  resume: [
    "It looks like you're checking out a résumé. Hire him!",
  ],
};

const DEFAULT_TIPS = [
  "It looks like you're poking around in Windows 95 (Jared's personal website).",
  "Open the Resume file on the desktop to learn more about Jared.",
  "Click 'Start' to launch a program.",
  "Try some of the games — Solitaire, FreeCell, Hearts, Chess, or Minesweeper.",
  "Press 'bsod' in the Run dialog. Just trust me.",
];

// Rare easter-egg tips. With small probability, the rotation picks one of
// these instead of the next default tip.
const RARE_TIPS = [
  "Did you know? Jared's cat is named John, and his dog is named Meatball.",
];
const RARE_TIP_PROBABILITY = 0.04;

export function Clippy() {
  const enabled = useClippyStore((s) => s.enabled);
  const setEnabled = useClippyStore((s) => s.setEnabled);
  const focusedId = useWindowStore((s) => s.focusedId);
  const focusedAppId = useWindowStore((s) => focusedId ? s.windows[focusedId]?.appId : undefined);
  const [tipIdx, setTipIdx] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(true);

  const tips = useMemo(() => {
    const appTips = focusedAppId ? TIPS_BY_APP[focusedAppId] : undefined;
    return (appTips && appTips.length > 0) ? appTips : DEFAULT_TIPS;
  }, [focusedAppId]);

  // Reset tip index when the tip set changes.
  useEffect(() => { setTipIdx(0); setBubbleVisible(true); }, [tips]);

  // Rotate tips every 25 seconds. When showing default tips, occasionally
  // surface a rare easter-egg tip instead.
  useEffect(() => {
    if (!enabled || !bubbleVisible) return;
    const id = window.setInterval(() => {
      if (tips === DEFAULT_TIPS && Math.random() < RARE_TIP_PROBABILITY && RARE_TIPS.length > 0) {
        setTipIdx(-1 - Math.floor(Math.random() * RARE_TIPS.length));
      } else {
        setTipIdx((i) => (Math.max(0, i) + 1) % tips.length);
      }
    }, 25_000);
    return () => window.clearInterval(id);
  }, [enabled, bubbleVisible, tips]);

  // Drag offset from the default bottom-right anchor. Persists for session.
  const [drag, setDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent): void => {
      const s = dragRef.current;
      if (!s) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (!s.moved && Math.abs(dx) + Math.abs(dy) > 4) s.moved = true;
      // Drag x/y are deltas from the anchor; positive y goes UP (further from
      // bottom). Translate sign-flips so the css transform reads naturally.
      setDrag({ x: s.origX + dx, y: s.origY + dy });
    };
    const onUp = (): void => { /* keep moved flag for the click handler to read */ };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const onFigurePointerDown = (e: React.PointerEvent): void => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: drag.x, origY: drag.y, moved: false };
  };

  const onFigureClick = (): void => {
    // Suppress the click if the user actually dragged.
    if (dragRef.current?.moved) {
      dragRef.current = null;
      return;
    }
    dragRef.current = null;
    setBubbleVisible((v) => !v);
  };

  if (!enabled) return null;

  // Negative tipIdx encodes a RARE_TIPS index (-1 → RARE_TIPS[0], etc).
  const tip = tipIdx < 0
    ? RARE_TIPS[(-tipIdx - 1) % RARE_TIPS.length]
    : tips[tipIdx % tips.length];
  const cycleTip = (): void => setTipIdx((i) => (Math.max(0, i) + 1) % tips.length);

  return (
    <div
      className="clippy-root"
      aria-hidden="false"
      style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
    >
      {bubbleVisible && (
        <div className="clippy-bubble">
          <button
            className="clippy-bubble-close"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); setBubbleVisible(false); }}
          >×</button>
          <div className="clippy-bubble-text">{tip}</div>
          <div className="clippy-bubble-actions">
            <button onClick={cycleTip}>Next tip</button>
            <button onClick={() => setEnabled(false)}>Hide Clippy</button>
          </div>
        </div>
      )}
      <button
        className="clippy-figure"
        onPointerDown={onFigurePointerDown}
        onClick={onFigureClick}
        title="Drag to move. Click to toggle tip."
      >
        <ClippySvg />
      </button>
    </div>
  );
}

function ClippySvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 64 96" width="96" height="144" xmlns="http://www.w3.org/2000/svg">
      {/* Outer paperclip */}
      <path
        d="M22 8 C32 4, 44 8, 48 22 L48 70 C48 80, 38 86, 30 80 C24 76, 24 70, 28 66 L28 30 C28 24, 32 22, 36 24 C38 26, 38 30, 36 32 L36 60"
        fill="none"
        stroke="#404040"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Eyes (whites) */}
      <ellipse cx="30" cy="32" rx="6" ry="7" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <ellipse cx="44" cy="30" rx="6" ry="7" fill="#fff" stroke="#000" strokeWidth="1.5" />
      {/* Pupils */}
      <circle cx="31" cy="34" r="2.5" fill="#000" />
      <circle cx="45" cy="32" r="2.5" fill="#000" />
      {/* Eyebrows */}
      <path d="M25 22 Q30 19, 35 22" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M40 21 Q45 18, 50 21" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
