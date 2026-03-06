# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Stack

- **React 19** + **Vite 7** — JSX only (no TypeScript)
- **Tailwind CSS v4** — configured via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed)
- **Framer Motion** — for animations
- **clsx** — for conditional class names
- **lucide-react** — icon library

## Architecture

Entry point is [src/main.jsx](src/main.jsx), root component is [src/App.jsx](src/App.jsx).

Page is composed of: `Nav` + `SubNav` (sticky, scroll-aware) → `Hero` (fullscreen with animated orb) → `PromptsSection` (category tabs + copyable prompt cards) → `Footer`.

**Styling approach**: All layout and component styles are in [src/index.css](src/index.css) as plain CSS classes (`.nav`, `.hero`, `.bento-*`, etc.). Component-level styles use inline `style` props. Tailwind v4 is available but used minimally — prefer the existing CSS class patterns.

**Animation**: Framer Motion `motion` components with `whileInView` + `viewport={{ once: true }}` for scroll-triggered entrance animations. `useScroll` + `useTransform` for parallax in Hero.

## Backend

Express server in [server/index.js](server/index.js), SQLite via `better-sqlite3` in [server/db.js](server/db.js). Run with `node server/index.js`.

**Notion CMS**: Set `NOTION_TOKEN`, `NOTION_GALLERY_DB`, `NOTION_PROMPTS_DB` in `server/.env` to enable. When set, gallery and prompts are fetched from Notion (60s cache) instead of SQLite. Likes/favorites always stored in SQLite. See [server/notion.js](server/notion.js) for expected Notion property names.

**Deployment**: Server at `38.76.199.94`, path `/www/wwwroot/tsc.dengshiying.com`. Backend runs on PM2 (`tsc-server`, port 3002). Nginx proxies `/api/` → `localhost:3002`, serves `dist/` as static files.

## ESLint Notes

- `no-unused-vars` is set to error, but variables matching `^[A-Z_]` (uppercase or underscore-prefixed) are ignored.
- Config covers `.js` and `.jsx` files only.
