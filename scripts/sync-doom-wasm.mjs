#!/usr/bin/env node
/**
 * Copy the WebAssembly DOOM assets into public/doom-wasm/ so dev/build serves
 * them at /doom-wasm/. Runs as a postinstall step so a fresh `npm install`
 * leaves the site in a runnable state.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = resolve(root, 'node_modules/@nicejsisverycool/tizendoom');
const dst = resolve(root, 'public/doom-wasm');
const FILES = ['doom1.wad', 'default.cfg', 'websockets-doom.js', 'websockets-doom.wasm'];

if (!existsSync(src)) {
  console.warn(`[sync-doom-wasm] source missing at ${src} — skipping (run npm install).`);
  process.exit(0);
}
mkdirSync(dst, { recursive: true });
for (const f of FILES) {
  copyFileSync(resolve(src, f), resolve(dst, f));
}
console.log(`[sync-doom-wasm] synced ${FILES.length} files into ${dst}`);
