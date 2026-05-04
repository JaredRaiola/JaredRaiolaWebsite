import { describe, it, expect, beforeEach } from 'vitest';
import { createFs } from '@/core/fs';
import { makeDir } from '@/core/fs/tree';
import { dispatch, type ShellContext } from './shell';
import { registerAllCommands } from './commands';

let printed: string[] = [];
let cwd = 'C:\\';

const makeCtx = async (): Promise<ShellContext> => {
  const fs = await createFs(makeDir('C:'));
  printed = [];
  cwd = 'C:\\';
  return {
    fs,
    cwd,
    setCwd: (p) => { cwd = p; },
    print: (l) => { printed.push(l); },
    api: { requestClose() {} } as ShellContext['api'],
  } as ShellContext;
};

beforeEach(() => {
  indexedDB.deleteDatabase('win95-fs');
  registerAllCommands();
});

describe('cmd commands', () => {
  it('cd updates cwd', async () => {
    const ctx = await makeCtx();
    await ctx.fs.mkdir('C:\\Foo');
    await dispatch('cd Foo', ctx);
    expect(cwd).toBe('C:\\Foo');
  });

  it('mkdir + dir + del', async () => {
    const ctx = await makeCtx();
    await dispatch('mkdir Test', ctx);
    expect(ctx.fs.exists('C:\\Test')).toBe(true);
    await dispatch('dir', ctx);
    expect(printed.some((l) => l.includes('<DIR>') && l.includes('Test'))).toBe(true);
  });

  it('echo prints args', async () => {
    const ctx = await makeCtx();
    await dispatch('echo hello world', ctx);
    expect(printed.includes('hello world')).toBe(true);
  });

  it('unknown command', async () => {
    const ctx = await makeCtx();
    await dispatch('flerb', ctx);
    expect(printed[0]).toMatch(/'flerb' is not recognized/);
  });

  it('cd alone prints cwd', async () => {
    const ctx = await makeCtx();
    await dispatch('cd', ctx);
    expect(printed[0]).toBe('C:\\');
  });

  it('cd to nonexistent path prints error', async () => {
    const ctx = await makeCtx();
    await dispatch('cd Nonexistent', ctx);
    expect(printed[0]).toMatch(/cannot find the path/i);
  });

  it('cls prints form-feed', async () => {
    const ctx = await makeCtx();
    await dispatch('cls', ctx);
    expect(printed[0]).toBe('\f');
  });

  it('type prints file contents', async () => {
    const ctx = await makeCtx();
    await ctx.fs.writeText('C:\\hello.txt', 'line1\nline2');
    await dispatch('type hello.txt', ctx);
    expect(printed).toContain('line1');
    expect(printed).toContain('line2');
  });

  it('echo on prints ECHO is on', async () => {
    const ctx = await makeCtx();
    await dispatch('echo on', ctx);
    expect(printed[0]).toBe('ECHO is on.');
  });

  it('rmdir removes a directory', async () => {
    const ctx = await makeCtx();
    await ctx.fs.mkdir('C:\\Temp');
    await dispatch('rmdir Temp', ctx);
    expect(ctx.fs.exists('C:\\Temp')).toBe(false);
  });

  it('copy duplicates a file', async () => {
    const ctx = await makeCtx();
    await ctx.fs.writeText('C:\\orig.txt', 'data');
    await dispatch('copy orig.txt copy.txt', ctx);
    expect(ctx.fs.exists('C:\\copy.txt')).toBe(true);
    expect(printed.some((l) => l.includes('copied'))).toBe(true);
  });

  it('move renames a file', async () => {
    const ctx = await makeCtx();
    await ctx.fs.writeText('C:\\a.txt', 'hi');
    await dispatch('move a.txt b.txt', ctx);
    expect(ctx.fs.exists('C:\\a.txt')).toBe(false);
    expect(ctx.fs.exists('C:\\b.txt')).toBe(true);
  });

  it('ver prints version string', async () => {
    const ctx = await makeCtx();
    await dispatch('ver', ctx);
    expect(printed.some((l) => l.includes('Windows 95'))).toBe(true);
  });

  it('help lists commands', async () => {
    const ctx = await makeCtx();
    await dispatch('help', ctx);
    expect(printed.some((l) => l.includes('DIR'))).toBe(true);
    expect(printed.some((l) => l.includes('ECHO'))).toBe(true);
  });

  it('exit calls requestClose', async () => {
    let closed = false;
    const ctx = await makeCtx();
    ctx.api.requestClose = () => { closed = true; };
    await dispatch('exit', ctx);
    expect(closed).toBe(true);
  });

  it('del removes a file', async () => {
    const ctx = await makeCtx();
    await ctx.fs.writeText('C:\\todel.txt', 'bye');
    await dispatch('del todel.txt', ctx);
    expect(ctx.fs.exists('C:\\todel.txt')).toBe(false);
  });

  it('mkdir alias md works', async () => {
    const ctx = await makeCtx();
    await dispatch('md NewFolder', ctx);
    expect(ctx.fs.exists('C:\\NewFolder')).toBe(true);
  });

  it('cd alias chdir works', async () => {
    const ctx = await makeCtx();
    await ctx.fs.mkdir('C:\\Sub');
    await dispatch('chdir Sub', ctx);
    expect(cwd).toBe('C:\\Sub');
  });
});
