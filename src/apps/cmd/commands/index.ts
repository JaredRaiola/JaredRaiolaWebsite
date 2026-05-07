import { registerCommand, resolvePath, listCommands, type CommandHandler } from '../shell';
import { basename } from '@/core/fs/paths';
import { getApp } from '@/core/apps/registry';
import { resolveAssociation } from '@/core/apps/associations';
import { useWindowStore } from '@/stores/windowStore';
import { useFsStore } from '@/stores/fsStore';

const dir: CommandHandler = {
  name: 'dir',
  describe: 'Lists files and subdirectories in a directory.',
  async run(args, ctx) {
    const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd;
    if (!ctx.fs.exists(target)) { ctx.print(`File Not Found`); return; }
    const node = ctx.fs.stat(target);
    if (node?.kind !== 'dir') { ctx.print(`Path is not a directory: ${target}`); return; }
    ctx.print(` Volume in drive C is WIN95`);
    ctx.print(` Directory of ${target}\n`);
    const items = ctx.fs.list(target);
    let totalBytes = 0;
    let fileCount = 0;
    let dirCount = 0;
    for (const child of items) {
      const date = new Date(child.modifiedAt);
      const datestr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      const timestr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      if (child.kind === 'dir') {
        ctx.print(`${datestr}  ${timestr}    <DIR>          ${child.name}`);
        dirCount++;
      } else {
        ctx.print(`${datestr}  ${timestr}    ${child.size.toString().padStart(13)} ${child.name}`);
        totalBytes += child.size;
        fileCount++;
      }
    }
    ctx.print(`              ${fileCount} File(s)        ${totalBytes.toLocaleString()} bytes`);
    ctx.print(`              ${dirCount} Dir(s)`);
  },
};

const cd: CommandHandler = {
  name: 'cd',
  aliases: ['chdir'],
  describe: 'Displays the name of or changes the current directory.',
  run(args, ctx) {
    if (args.length === 0) { ctx.print(ctx.cwd); return; }
    // cmd.exe treats the remainder of the line as the path, so spaces don't
    // require quoting (e.g. `cd My Documents`).
    const target = resolvePath(ctx.cwd, args.join(' '));
    if (!ctx.fs.exists(target)) { ctx.print(`The system cannot find the path specified.`); return; }
    if (ctx.fs.stat(target)?.kind !== 'dir') { ctx.print(`Not a directory: ${target}`); return; }
    ctx.setCwd(target);
  },
};

const cls: CommandHandler = {
  name: 'cls',
  describe: 'Clears the screen.',
  run(_, ctx) {
    ctx.print('\f');
  },
};

const type: CommandHandler = {
  name: 'type',
  describe: 'Displays the contents of a text file.',
  async run(args, ctx) {
    if (args.length === 0) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const target = resolvePath(ctx.cwd, args[0]);
    if (!ctx.fs.exists(target) || ctx.fs.stat(target)?.kind !== 'file') {
      ctx.print(`File not found: ${args[0]}`);
      return;
    }
    try {
      const text = await ctx.fs.readText(target);
      for (const line of text.split('\n')) ctx.print(line);
    } catch (e) {
      ctx.print(`Error reading file: ${String(e)}`);
    }
  },
};

const echo: CommandHandler = {
  name: 'echo',
  describe: 'Displays messages.',
  run(args, ctx) {
    if (args.length === 0 || args[0].toLowerCase() === 'on' || args[0].toLowerCase() === 'off') {
      ctx.print(`ECHO is on.`);
      return;
    }
    ctx.print(args.join(' '));
  },
};

const del: CommandHandler = {
  name: 'del',
  aliases: ['erase'],
  describe: 'Deletes one or more files (sends to Recycle Bin).',
  async run(args, ctx) {
    if (args.length === 0) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const target = resolvePath(ctx.cwd, args[0]);
    if (!ctx.fs.exists(target)) { ctx.print(`Could not find ${args[0]}`); return; }
    try {
      await ctx.fs.unlink(target);
      useFsStore.getState().bump();
    } catch (e) {
      ctx.print(`Error: ${String(e)}`);
    }
  },
};

const mkdir: CommandHandler = {
  name: 'mkdir',
  aliases: ['md'],
  describe: 'Creates a directory.',
  async run(args, ctx) {
    if (args.length === 0) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const target = resolvePath(ctx.cwd, args[0]);
    try {
      await ctx.fs.mkdir(target);
      useFsStore.getState().bump();
    } catch (e) {
      ctx.print(`Error: ${String(e)}`);
    }
  },
};

const rmdir: CommandHandler = {
  name: 'rmdir',
  aliases: ['rd'],
  describe: 'Removes a directory.',
  async run(args, ctx) {
    const recursive = args.some((a) => a.toLowerCase() === '/s');
    const positional = args.filter((a) => !a.startsWith('/'));
    if (positional.length === 0) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const target = resolvePath(ctx.cwd, positional[0]);
    try {
      await ctx.fs.rmdir(target, { recursive });
      useFsStore.getState().bump();
    } catch (e) {
      ctx.print(`Error: ${String(e)}`);
    }
  },
};

const copyCmd: CommandHandler = {
  name: 'copy',
  describe: 'Copies one or more files to another location.',
  async run(args, ctx) {
    if (args.length < 2) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const src = resolvePath(ctx.cwd, args[0]);
    const dest = resolvePath(ctx.cwd, args[1]);
    try {
      await ctx.fs.copy(src, dest);
      ctx.print(`        1 file(s) copied.`);
      useFsStore.getState().bump();
    } catch (e) {
      ctx.print(`Error: ${String(e)}`);
    }
  },
};

const moveCmd: CommandHandler = {
  name: 'move',
  aliases: ['ren', 'rename'],
  describe: 'Moves or renames a file or directory.',
  async run(args, ctx) {
    if (args.length < 2) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const src = resolvePath(ctx.cwd, args[0]);
    let dest = resolvePath(ctx.cwd, args[1]);
    if (ctx.fs.exists(dest) && ctx.fs.stat(dest)?.kind === 'dir') {
      dest = `${dest}\\${basename(src)}`;
    }
    try {
      await ctx.fs.move(src, dest);
      useFsStore.getState().bump();
    } catch (e) {
      ctx.print(`Error: ${String(e)}`);
    }
  },
};

const start: CommandHandler = {
  name: 'start',
  describe: 'Starts a program or opens a path.',
  run(args, ctx) {
    if (args.length === 0) { ctx.print(`The syntax of the command is incorrect.`); return; }
    const target = args[0];
    const app = getApp(target.toLowerCase());
    if (app) {
      useWindowStore.getState().open(app.id, undefined, {
        title: app.displayName,
        icon: app.icon,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
        singleInstance: app.singleInstance,
      });
      return;
    }
    const path = resolvePath(ctx.cwd, target);
    if (!ctx.fs.exists(path)) { ctx.print(`Cannot find: ${target}`); return; }
    const appId = resolveAssociation(path);
    if (!appId) { ctx.print(`No application associated with: ${path}`); return; }
    const a = getApp(appId);
    if (!a) { ctx.print(`Application not found: ${appId}`); return; }
    useWindowStore.getState().open(a.id, { path }, {
      title: a.displayName,
      icon: a.icon,
      width: a.defaultSize.width,
      height: a.defaultSize.height,
      singleInstance: a.singleInstance,
    });
  },
};

const help: CommandHandler = {
  name: 'help',
  describe: 'Provides Help information for Windows commands.',
  run(_, ctx) {
    for (const c of listCommands()) {
      ctx.print(`${c.name.toUpperCase().padEnd(8)} ${c.describe}`);
    }
  },
};

const ver: CommandHandler = {
  name: 'ver',
  describe: 'Displays the Windows version.',
  run(_, ctx) {
    ctx.print('');
    ctx.print('Microsoft Windows 95 [Version 4.00.950]');
    ctx.print('');
  },
};

const exit: CommandHandler = {
  name: 'exit',
  describe: 'Closes the Command Prompt window.',
  run(_, ctx) {
    ctx.api.requestClose();
  },
};

export function registerAllCommands(): void {
  for (const h of [dir, cd, cls, type, echo, del, mkdir, rmdir, copyCmd, moveCmd, start, help, ver, exit]) {
    registerCommand(h);
  }
}
