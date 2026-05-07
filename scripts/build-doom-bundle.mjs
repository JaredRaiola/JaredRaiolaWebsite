#!/usr/bin/env node
/**
 * Bundle a Doom WAD + EXE into a `.jsdos` archive that js-dos can load.
 *
 * Usage:
 *   node scripts/build-doom-bundle.mjs <DOOM1.WAD> <DOOM.EXE>
 *
 * Writes `public/games/doom/doom.jsdos`.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { execSync } from 'node:child_process';

const [, , wadArg, exeArg] = process.argv;
if (!wadArg || !exeArg) {
  console.error('usage: node scripts/build-doom-bundle.mjs <DOOM1.WAD> <DOOM.EXE>');
  process.exit(1);
}
const wadPath = resolve(wadArg);
const exePath = resolve(exeArg);
if (!existsSync(wadPath)) { console.error(`not found: ${wadPath}`); process.exit(1); }
if (!existsSync(exePath)) { console.error(`not found: ${exePath}`); process.exit(1); }

const dosboxConf = `[autoexec]
mount c .
c:
DOOM.EXE
exit
`;

// Stage files into a temp dir, then zip with the system zip tool. Works on
// macOS/Linux (BSD zip) and Windows 10+ (PowerShell Compress-Archive).
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const stage = mkdtempSync(resolve(tmpdir(), 'doom-bundle-'));
try {
  copyFileSync(wadPath, resolve(stage, basename(wadPath).toUpperCase()));
  copyFileSync(exePath, resolve(stage, basename(exePath).toUpperCase()));
  writeFileSync(resolve(stage, 'dosbox.conf'), dosboxConf);

  const out = resolve('public', 'games', 'doom', 'doom.jsdos');
  // Try Unix zip first, fall back to PowerShell Compress-Archive.
  try {
    execSync(`zip -j "${out}" "${stage}"/*`, { stdio: 'inherit' });
  } catch {
    const psCmd = `Compress-Archive -Path '${stage}\\*' -DestinationPath '${out}' -Force`;
    execSync(`powershell -Command "${psCmd}"`, { stdio: 'inherit' });
  }
  console.log(`wrote ${out}`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
