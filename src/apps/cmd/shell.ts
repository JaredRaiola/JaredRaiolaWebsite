import type { FS } from '@/core/fs';
import type { WindowApi } from '@/core/apps/registry';

export type ShellContext = {
  fs: FS;
  cwd: string;
  setCwd(next: string): void;
  print(line: string): void;
  api: WindowApi;
};

export type CommandHandler = {
  name: string;
  aliases?: string[];
  describe: string;
  run(args: string[], ctx: ShellContext): Promise<void> | void;
};

const commands = new Map<string, CommandHandler>();

export function registerCommand(h: CommandHandler): void {
  commands.set(h.name.toLowerCase(), h);
  for (const a of h.aliases ?? []) commands.set(a.toLowerCase(), h);
}

export function listCommands(): CommandHandler[] {
  const seen = new Set<CommandHandler>();
  for (const h of commands.values()) seen.add(h);
  return [...seen].sort((a, b) => a.name.localeCompare(b.name));
}

export async function dispatch(line: string, ctx: ShellContext): Promise<void> {
  const tokens = parse(line);
  if (tokens.length === 0) return;
  const head = tokens[0].toLowerCase();
  const handler = commands.get(head);
  if (!handler) {
    ctx.print(`'${tokens[0]}' is not recognized as an internal or external command.`);
    return;
  }
  await handler.run(tokens.slice(1), ctx);
}

export function parse(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < line.length) {
    while (line[i] === ' ' || line[i] === '\t') i++;
    if (i >= line.length) break;
    if (line[i] === '"') {
      i++;
      let buf = '';
      while (i < line.length && line[i] !== '"') buf += line[i++];
      i++;
      tokens.push(buf);
    } else {
      let buf = '';
      while (i < line.length && line[i] !== ' ' && line[i] !== '\t') buf += line[i++];
      tokens.push(buf);
    }
  }
  return tokens;
}

function normalizeWinPath(p: string): string {
  const [drive, ...rest] = p.split('\\');
  const parts = rest.filter(Boolean);
  const out: string[] = [];
  for (const seg of parts) {
    if (seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  const head = drive.toUpperCase();
  return out.length === 0 ? head + '\\' : head + '\\' + out.join('\\');
}

export function resolvePath(cwd: string, input: string): string {
  let abs: string;
  if (/^[a-zA-Z]:\\/.test(input)) abs = input;
  else if (input.startsWith('\\')) abs = 'C:\\' + input.slice(1);
  else abs = cwd.endsWith('\\') ? cwd + input : cwd + '\\' + input;
  return normalizeWinPath(abs);
}
