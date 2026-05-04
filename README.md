# jaredraiola.com

A Windows 95 facsimile rendered in the browser. Personal portfolio site.

## Stack

React 19 + Vite + TypeScript, Zustand, react-rnd, 98.css, IndexedDB.

## Develop

```bash
npm install
npm run dev      # localhost:5173
npm run test     # vitest
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint     # eslint
```

## Deploy

Cloudflare Pages auto-deploys on push to `main`.

- Build command: `npm run build`
- Build output: `dist`
- Node version: 20

## Phases

This is Phase 1 of a multi-phase build. Phase 1 ships the OS shell + Notepad + File Explorer. See `docs/superpowers/specs/` for the design document and `docs/superpowers/plans/` for implementation plans.
