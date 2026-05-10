# Past Simple

Interactive historical timeline (1850–1950) showing how famous historical figures lived in the same era and were connected to each other.

Live: <https://past-simple.ru>

## Quick start

```bash
npm install
npm run dev
```

Vite opens the dev server in your browser automatically (default port 5173).

To build and preview the production bundle:

```bash
npm run build
npm run preview
```

## Stack

- Vite 6 (build tool, no framework)
- Vanilla JavaScript (ES modules)
- CSS Custom Properties (design tokens generated from Figma)
- Static JSON for data (no backend)
- Hosted on Cloudflare Pages

## Project pages

- `/` — main timeline view
- `/tokens` — design tokens reference (kitchen sink for tokens)
- `/components` — component library (also accessible at `/library` via redirect)
- `/privacy` — privacy policy

## Documentation

- `CLAUDE.md` — rules for Claude (Russian).
- `SESSION.md` — session journal (Russian).
- `BACKLOG.md` — backlog (Russian).
- `DECISIONS.md` — architecture decision log (Russian).
- `DEPLOY.md` — deployment notes (Russian).
- `MAIN_SCREEN.md` — mental model of the main screen (Russian).
