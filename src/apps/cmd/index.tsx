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
const SCROLLBACK_CAP = 1000;

type CmdSnapshot = {
  scrollback: string[];
  cwd: string;
  history: string[];
};

export default function CmdApp({ api, fs, args, restoreState }: AppProps) {
  const restored = (restoreState as Partial<CmdSnapshot> | undefined);
  const initialArgs = (args as { cwd?: string } | undefined);
  const [cwd, setCwd] = useState(
    typeof restored?.cwd === 'string'
      ? restored.cwd
      : (typeof initialArgs?.cwd === 'string' ? initialArgs.cwd : 'C:\\')
  );
  const [lines, setLines] = useState<string[]>(
    Array.isArray(restored?.scrollback) ? restored.scrollback : BANNER,
  );
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(
    Array.isArray(restored?.history) ? restored.history : [],
  );
  const [_hi, setHi] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const printedBuffer = useRef<string[]>([]);

  // Register commands on first mount.
  useEffect(() => { registerAllCommands(); }, []);

  // Register session snapshot.
  useEffect(() => {
    return api.registerSnapshot((): CmdSnapshot => ({
      scrollback: lines.slice(-SCROLLBACK_CAP),
      cwd,
      history,
    }));
  }, [lines, cwd, history, api]);

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
      if (e.key === 'Tab') { e.preventDefault(); tabComplete(); return; }
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

  const tabComplete = (): void => {
    const cur = input;
    const lastSpace = cur.lastIndexOf(' ');
    const prefix = cur.slice(0, lastSpace + 1);
    const word = cur.slice(lastSpace + 1);
    if (word.length === 0) return;
    let entries: { name: string; isDir: boolean }[];
    try {
      entries = fs.list(cwd).map((n) => ({ name: n.name, isDir: n.kind === 'dir' }));
    } catch { return; }
    const matches = entries.filter((e) => e.name.toLowerCase().startsWith(word.toLowerCase()));
    if (matches.length === 0) return;
    if (matches.length === 1) {
      const m = matches[0];
      const name = m.name.includes(' ') ? `"${m.name}${m.isDir ? '\\' : ''}"` : m.name + (m.isDir ? '\\' : '');
      setInput(prefix + name);
      return;
    }
    // Multiple matches: complete to longest common prefix.
    let common = matches[0].name;
    for (let i = 1; i < matches.length; i++) {
      let j = 0;
      while (j < common.length && j < matches[i].name.length && common[j].toLowerCase() === matches[i].name[j].toLowerCase()) j++;
      common = common.slice(0, j);
    }
    if (common.length > word.length) setInput(prefix + common);
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
