# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A GitHub Pages personal portfolio site featuring **SimpleOS** — a browser-based virtual operating system built with vanilla JavaScript (no frameworks, no build tools, no npm dependencies). The site also hosts several standalone web games.

Live at: https://alanh0vx.github.io/

## Development

- **No build step**: All files are served directly as static assets via GitHub Pages.
- **Dev server**: Open `index.html` in a browser, or use any local HTTP server (e.g., `python -m http.server`).
- **Deploy**: Push to `main` branch — GitHub Pages auto-deploys.
- **No tests or linting** configured.

## Architecture

### SimpleOS (`simple-os/`)

The core of the site is a simulated desktop OS rendered in the browser.

- **`os-core.js`** — The OS kernel: window management (drag, resize, minimize, maximize, close), application registry, virtual file system (localStorage-backed), taskbar, start menu, and mobile/desktop detection.
- **`styles.css`** — All OS styling including window chrome, taskbar, mobile-responsive layout (breakpoint at 768px).
- **`apps/`** — Each app is a self-contained JS module that registers itself via `os.registerApp()`.

### Application Registration Pattern

Every app follows this pattern:

```javascript
os.registerApp({
    id: 'app-id',
    name: 'Display Name',
    icon: '🎮',
    category: 'games',  // utilities | games | entertainment | productivity | system | ai | external | custom
    onLaunch(windowId) { /* render into window */ }
});
```

Apps are loaded as `<script>` tags in `index.html` and register themselves on the global `os` object.

### Data Persistence

All state (virtual file system, settings, chat history, custom apps) is stored in `localStorage` as JSON. No backend or database.

### Standalone Games

Separate from SimpleOS, these are self-contained HTML files in their own directories: `snake/`, `horses/`, `tic/`, `tetris/`, `solar_system/`, `star_glazing/`.

### External Integrations

The AI Chat app (`apps/ai-chat.js`) supports OpenAI API and custom API endpoints, configured by the user at runtime.
