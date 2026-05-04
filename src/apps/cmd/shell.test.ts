import { describe, it, expect } from 'vitest';
import { parse, resolvePath } from './shell';

describe('parse', () => {
  it('splits whitespace', () => {
    expect(parse('echo hello world')).toEqual(['echo', 'hello', 'world']);
  });
  it('honors double-quoted segments', () => {
    expect(parse('type "C:\\my folder\\note.txt"')).toEqual(['type', 'C:\\my folder\\note.txt']);
  });
  it('returns empty array on blank input', () => {
    expect(parse('')).toEqual([]);
    expect(parse('   ')).toEqual([]);
  });
  it('handles trailing whitespace', () => {
    expect(parse('dir   ')).toEqual(['dir']);
  });
});

describe('resolvePath', () => {
  it('absolute paths pass through normalized', () => {
    expect(resolvePath('C:\\Foo', 'C:\\Bar')).toBe('C:\\Bar');
  });
  it('relative paths join cwd', () => {
    expect(resolvePath('C:\\Foo', 'bar')).toBe('C:\\Foo\\bar');
  });
  it('drive-rooted paths replace cwd subpath', () => {
    expect(resolvePath('C:\\Foo\\baz', '\\X\\y')).toBe('C:\\X\\y');
  });
  it('.. collapses one segment', () => {
    expect(resolvePath('C:\\Foo\\Bar', '..')).toBe('C:\\Foo');
  });
  it('. is a no-op', () => {
    expect(resolvePath('C:\\Foo', '.')).toBe('C:\\Foo');
  });
  it('handles compound paths with ..', () => {
    expect(resolvePath('C:\\', 'X\\..\\Y\\Z')).toBe('C:\\Y\\Z');
  });
});
