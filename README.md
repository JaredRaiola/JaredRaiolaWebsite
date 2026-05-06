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

## Credits

- **W95FA font** — community recreation of the original Windows 95 system font, licensed under the SIL Open Font License (free for personal and commercial use).
- **Win98 icons** (`/public/assets/win98/`) — community-archived icon set that has circulated freely since the late 1990s. Used here in good-faith homage.

## Disclaimer

This site is an unofficial Windows 95 visual homage built for fun and as a personal portfolio. It is not affiliated with, endorsed by, or sponsored by Microsoft Corporation. Windows and Windows 95 are trademarks of Microsoft Corporation.
