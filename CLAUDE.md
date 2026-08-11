# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React + Fastify server-side rendered TypeScript website for a Cape Cod carpentry business (NextStepConstruction), with About, Projects, and Contact sections plus an estimate request form.

## Commands

```bash
npm install       # install dependencies
npm run dev        # start dev server (tsx server.ts) at http://localhost:3000, Vite in SSR middleware mode
npm run typecheck  # tsc --noEmit
npm run build      # vite build (client) + vite build --ssr src/entry-server.tsx (server), outputs to dist/
npm run start       # NODE_ENV=production tsx server.ts — serves the prebuilt dist/, requires `npm run build` first
```

There is no test suite or linter configured in this repo.

Node version is pinned via `.nvmrc` (20).

## Architecture

This is a single-page SSR app with one shared React tree rendered on both server and client:

- `server.ts` — Fastify server, the entry point for both dev and prod.
  - `POST /api/estimate` — validates and logs estimate-request leads (name, phone, projectType, details are required); no persistence or email/CRM integration currently wired up.
  - Dev mode (`NODE_ENV !== 'production'`): registers Vite in SSR middleware mode (via `@fastify/middie`), reads `index.html`, transforms it through Vite, and SSR-renders on every request via `vite.ssrLoadModule('/src/entry-server.tsx')`. No build step needed.
  - Prod mode: serves static assets from `dist/client` (via `@fastify/static`), and SSR-renders using the prebuilt `dist/server/entry-server.js`. Requires `npm run build` to have been run first — the catch-all route errors clearly if `dist/` is missing.
  - In both modes, a catch-all `GET *` route does the SSR render and injects the app HTML into the `<!--app-html-->` placeholder in `index.html`.
- `src/App.tsx` — the entire UI as one component: nav, hero, about, a projects grid with per-project image carousels and a shared lightbox modal, contact info, and the estimate form. Project data (`featuredProjects`) and form field config are defined inline at the top of the file; there is no routing or component-splitting.
- `src/entry-client.tsx` — browser entry point; hydrates `App` into `#root` via `hydrateRoot`.
- `src/entry-server.tsx` — SSR entry point; exports `render(url)` which calls `renderToString(<App />)`. Note: the `url` parameter is currently unused since there is no routing.
- `src/styles.css` — imported by both entry points so styles apply in SSR output and after hydration.
- `public/` — static assets served as-is (logo, project photos as SVG placeholders). Comment in `App.tsx`'s projects section notes replacing `/public/projects` images and `/public/logo.svg` with real assets.

Because the same `App` component is rendered on server and client, any browser-only API usage must be guarded (e.g. in `useEffect`, as already done for `document`/`window` in the lightbox keyboard handling).
