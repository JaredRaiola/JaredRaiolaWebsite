import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        // Self-host js-dos so DOOM (and any future DOS games) load entirely from
        // our origin — no external CDN dependency. The js-dos bundle expects its
        // wasm cores at /jsdos/emulators/, which the Doom app sets via
        // `window.emulators.pathPrefix` before injecting the script.
        viteStaticCopy({
            targets: [{ src: 'node_modules/js-dos/dist/*', dest: 'jsdos' }],
        }),
    ],
    resolve: {
        alias: { '@': path.resolve(__dirname, 'src') },
    },
    build: {
        // lightningcss does not yet support `@media (not(hover))` from 98.css
        cssMinify: false,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: 'http://localhost/',
            },
        },
        setupFiles: ['./src/test-setup.ts'],
        css: true,
    },
});
