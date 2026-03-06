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

## ESLint Notes

- `no-unused-vars` is set to error, but variables matching `^[A-Z_]` (uppercase or underscore-prefixed) are ignored.
- Config covers `.js` and `.jsx` files only.
