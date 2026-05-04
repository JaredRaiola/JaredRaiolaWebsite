import { useEffect, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { dispatch } from './shell';
import { registerAllCommands } from './commands';
import './cmd.css';

const BANNER = [
  'Microsoft(R) Windows 95',
  '   (C)Copyright Microsoft Corp 1981-1995.',
  '',
];
const FORM_FEED = '\f';

export default function CmdApp({ api, fs }: AppProps) {
  const [cwd, setCwd] = useState('C:\\');
  const [lines, setLines] = useState<string[]>(BANNER);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [_hi, setHi] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const printedBuffer = useRef<string[]>([]);

  // Register commands on first mount.
  useEffect(() => { registerAllCommands(); }, []);

  // Scroll-to-bottom on render.
  useEffect(() => {
    const r = rootRef.current;
    if (r) r.scrollTop = r.scrollHeight;
  });

  // Focus + keyboard.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    node.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setLines((ls) => [...ls, prompt(cwd) + input + '^C']);
        setInput('');
        setHi(-1);
        return;
      }
      if (e.key === 'Enter') { e.preventDefault(); runLine(); return; }
      if (e.key === 'Backspace') { e.preventDefault(); setInput((s) => s.slice(0, -1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); cycleHistory(1); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); cycleHistory(-1); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setInput((s) => s + e.key);
      }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  });

  const prompt = (path: string) => `${path}>`;

  const runLine = (): void => {
    const line = input;
    const echo = prompt(cwd) + line;
    setLines((ls) => [...ls, echo]);
    if (line.trim()) setHistory((h) => [line, ...h].slice(0, 50));
    setInput('');
    setHi(-1);

    printedBuffer.current = [];
    const ctx = {
      fs,
      cwd,
      setCwd: (n: string) => setCwd(n),
      print: (l: string) => printedBuffer.current.push(l),
      api,
    };
    void dispatch(line, ctx).then(() => {
      const out = printedBuffer.current;
      // Handle special form-feed ('cls') → reset lines.
      if (out.length === 1 && out[0] === FORM_FEED) {
        setLines([]);
      } else {
        setLines((ls) => [...ls, ...out]);
      }
    });
  };

  const cycleHistory = (dir: 1 | -1): void => {
    setHi((cur) => {
      if (history.length === 0) return -1;
      const next = Math.min(history.length - 1, Math.max(-1, cur + dir));
      setInput(next < 0 ? '' : history[next]);
      return next;
    });
  };

  return (
    <div ref={rootRef} tabIndex={-1} className="cmd-root">
      {lines.map((l, i) => (
        <div key={i} className="cmd-line">{l}</div>
      ))}
      <div className="cmd-line">
        <span>{prompt(cwd)}</span>
        <span className="cmd-input-line">{input}</span>
        <span className="cmd-cursor" />
      </div>
    </div>
  );
}
