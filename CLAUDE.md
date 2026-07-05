# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A GitHub Pages personal portfolio site featuring **SimpleOS** — a browser-based virtual operating system built with vanilla JavaScript (no frameworks, no build tools, no npm dependencies). The site also hosts several standalone web games.

Live at: https://alanh0vx.github.io/

## Development

- **No build step**: All files are served directly as static assets via GitHub Pages.
- **Dev server**: Open `index.html` in a browser, or use any local HTTP server (e.g., `python -m http.server`).
- **Deploy**: Push to `main` branch — GitHub Pages auto-deploys.
- **No tests or linting** configured. Verify changes by driving the site in a browser (a recipe using puppeteer-core + system Chrome lives in `.claude/skills/verify/SKILL.md`, local-only since `.claude/` is gitignored).

## Architecture

### SimpleOS (`simple-os/`)

The core of the site is a simulated desktop OS rendered in the browser.

- **`os-core.js`** — The OS kernel: window management (drag, resize, minimize, maximize, close, with mouse + touch support), application registry, virtual file system (localStorage-backed via `os.safeGet()`), taskbar, start menu, and responsive device modes (`phone` / `tablet` / `desktop`, re-evaluated on resize/orientation change; exposed as `body[data-device]`). Phones get a paginated fullscreen app grid; tablets keep floating windows with enlarged touch targets. Windows support an optional `onClose(windowId)` lifecycle hook; use `os.setWindowInterval()` / `os.addWindowListener()` for intervals/listeners that must be cleaned up when the window closes.
- **`ui-kit.js`** — Shared UI primitives on `os.ui`: promise-based `alert` / `confirm` / `prompt` / `form` / `dialog`, plus `toast`, `menu` (context/long-press), and `escapeHtml`. **Never use native `alert()` / `confirm()` / `prompt()` in apps** — handlers that await `os.ui.confirm()` become `async`. Always escape user/model-provided strings with `os.ui.escapeHtml()` before injecting into `innerHTML`.
- **`styles.css`** — All OS styling. Design tokens live in the `:root` block at the top (`--accent-1`, `--accent-2`, `--gradient-accent`, `--surface`, `--surface-2/3`, `--text`, `--text-muted`, `--border`, `--tap-min`, …). Dark mode overrides them via `body[data-theme="dark"]` and `prefers-color-scheme`; the Settings app drives accent tokens and `data-theme`, applied at boot. **Use `var()` tokens instead of hard-coded colors** so theming keeps working. Mobile breakpoint at 768px; safe-area insets (`env(safe-area-inset-*)`) are applied to the taskbar, windows, and start menu. Touch targets should be ≥44px (`var(--tap-min)`).
- **`apps/`** — Each app is a self-contained JS module that registers itself via `os.registerApp()`.

### Application Registration Pattern

Every app follows this pattern:

```javascript
os.registerApp({
    id: 'app-id',
    name: 'Display Name',
    icon: '🎮',
    category: 'games',  // utilities | games | entertainment | productivity | system | ai | external | custom
    onLaunch(windowId) { /* render into window */ },
    onClose(windowId) { /* optional: stop intervals/audio, remove listeners */ }
});
```

Apps are loaded as `<script>` tags in `index.html` (after `os-core.js` and `ui-kit.js`) and register themselves on the global `os` object.

### Accessibility

Shell controls (start menu, taskbar, icons) are keyboard-operable — `os.makeAccessible(el, activate)` adds role/tabindex/Enter-Space handling to div-buttons; use it for any new clickable divs. Escape closes menus; arrow keys navigate the start menu. Visible focus uses `:focus-visible` + `--focus-ring`; animations respect `prefers-reduced-motion`.

### Data Persistence

All state (virtual file system, settings, chat history, custom apps) is stored in `localStorage` as JSON. No backend or database. Read through `os.safeGet(key, fallback)` so corrupt entries can't break boot.

### Standalone Games

Separate from SimpleOS, these are self-contained HTML files in their own directories: `snake/`, `horses/`, `tic/` (only `tic3.html` is live), `tetris/`, `solar_system/`, `star_glazing/`, plus `chinese-chess/`, `virtual-shopping/`, `instant-dict/`, `villainhitting/` (`villianhitting/` is a redirect stub for the old misspelled URL — keep it).

`horses/` (Thunder Downs) is the quality bar. New/updated game pages should follow its mobile checklist:

- `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` plus `theme-color` and apple-mobile-web-app metas
- `env(safe-area-inset-*)` padding; `touch-action: manipulation` on body, `touch-action: none` on game canvases
- Touch controls (d-pad/buttons/swipe) shown via `@media (pointer: coarse)`; keyboard input listens on `document`, never on a focused canvas
- High scores persisted to `localStorage`
- Back buttons must not use bare `window.close()` — use the fallback chain: `history.back()` → `window.close()` (if opened by script) → `location.href = '/'`

Games are launched from SimpleOS as external apps (`window.open` in a new tab), registered inline in `index.html`.

### External Integrations

The AI Chat app (`apps/ai-chat.js`) supports OpenAI, Anthropic, Google, and OpenRouter APIs plus custom endpoints, configured by the user at runtime. All calls go directly from the browser; message content is HTML-escaped before rendering; the full (token-trimmed) conversation history is sent for every provider.
