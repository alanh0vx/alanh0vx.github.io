# CLAUDE.md — guidance for AI assistants working on this repo

## What this is

A single-page HTML5 browser-based electronic dictionary device, the fictional **萬能通 OMNI·DICT OD-2026 PRO**. See `README.md` for the user-facing description.

**No build step. No framework. No server.** Edit `index.html`, reload the browser. That's the loop.

## File layout

```
index.html       # ~4000 lines — all UI, all CSS, all logic, all modes
dict.js          # ~520 curated EN-ZH entries
ecdict.js        # 40k EN entries with IPA + tr (translations)
cedict.js        # 95k CC-CEDICT entries
cnchars.js       # 10,906 single CJK chars: { c, r, ts, ns, py, bp, cj, jp, d }
poems.js         # 320 唐詩三百首
wiki.js          # 1,114 Wikipedia summaries: { en, zh, ee, ez, es, c, d }
```

Build helpers live under `/tmp/cn-build`, `/tmp/wiki-build`, `/tmp/ecdict-build` — regeneration only, not loaded at runtime.

## Architecture conventions

- **All logic is inside one `<script>` IIFE** at the bottom of `index.html`. State is a single `state` object. Mode dispatch is `render()` → `renderDict / renderCnDict / renderPoem / renderCalc / renderWiki / renderGame / renderMenu / renderWelcome`.
- **CSS is inline `<style>` in the `<head>`**. Use the existing CSS variables (`--col`, `--gap`, `--lcd-bg`, `--lcd-ink`, `--bopomofo`, `--cangjie`).
- **All keyboard actions go through `ACTIONS[name]`**, the dispatcher object. On-screen key clicks and physical keyboard events both route through there. When adding a new key, add a `data-action="..."` attribute and an entry in `ACTIONS`.
- **`typeChar(ch)` is the central character-input funnel.** Calc routes early to `calcType`. IME routes early through `imeFeed` for cndict/poem. Then it falls through to `state.query += ch; refresh()`.
- **`refresh()` re-runs the search** for the current mode and triggers `render()`. Use it after any change to `state.query`.
- **`render()` is the single render entry point.** It reads state and rebuilds `elLcdBody.innerHTML`. Avoid mutating DOM outside it (except for fast-path animations like `is-pressed`).
- **Body-class state mirrors mode**: `is-calc-mode`, `is-game-mode`, `is-menu-mode`, `is-welcome-mode`, `is-cndict-mode`, `is-poem-mode`. CSS uses these to re-style keyboard annotations and hide the LCD input row in non-typing modes.
- **IME body classes** mirror IME state: `is-ime-zhuyin`, `is-ime-pinyin`, `is-ime-cangjie`, `is-ime-jyutping`. CSS dims/highlights the per-key annotations to match.

## Common gotchas

- **`setMode(m)` is the only safe mode switcher.** It clears query, IME buffer, results, selected, sets body classes, etc. Don't assign `state.mode` directly except in `boot()` and the power-on path (which manually toggle the welcome/menu body classes — see those for the pattern).
- **`.lcd-body` is a 2-column grid** (`grid-template-columns: 36% 1fr; height: 158px`) for dict/poem/wiki. cndict overrides to `display: block` via `.cn-mode`. New full-width children inside `.lcd-body` (like the IME bar) need `grid-column: 1 / -1` to span both columns.
- **Cangjie buffer stores latin** (`hgi…`) for matching against the `cj` field. `imeDisplayBuf()` converts to radical chars (`日土戈…`) at render time only. Don't store radicals in `imeBuf`.
- **廣東拼音 input is Yale-style** (`jong/jung/ching/yeung/eu`), but the stored `jp` field is **LSHK Jyutping** (`zong1/zung1/cing1/joeng5`). `yaleToJyutping(s)` converts before lookup. The mapping: `j↔z`, `y↔j`, `ch→c`, `eung→oeng`, `euk→oek`, `eun→eon`, `eut→eot`, `eu→oe`.
- **Wikipedia data uses 11 categories**: `tech, sci, space, hist, ppl, culture, animal, plant, geo, pop, other`. The category code is in `c`. Don't add new categories without updating `WIKI_CATS` and the recat scripts.
- **Bookmarks key format** is `mode|key` — e.g. `dict|hello`, `poem|杜甫|八陣圖`. Match this when adding new modes that should support bookmarks.
- **The device is sized at exactly 720px wide.** All keyboard math (`13 × var(--col) + 12 × var(--gap)`) assumes this. Don't change device width without auditing the `.lang-row`, `.kb-main`, and side-column widths.
- **Responsive scaling is a transform-scale wrapper**. The `.device-fit` wrapper is height-clamped by JS (`fitDevice()`) so body layout stays tight. If you add anything that grows the device's natural height, call `fitDevice()` after.

## Adding a new feature — checklist

1. **State?** Add field(s) to the `state` object literal. Document next to the existing fields.
2. **Mode?** If it's a new top-level mode, add to `MENU_ITEMS`, the F-key strip, the order array in `'switch-dict'` action, and `setMode`'s reset logic.
3. **Render?** Write `renderXxx()`, dispatch from `render()`. Set `elStatusMid`, `elCount`, etc. Build `elLcdBody.innerHTML` in one shot.
4. **Keyboard route?** Add to `ACTIONS` (preferred) or extend `typeChar`. For digit/Enter/arrow handling specific to your mode, add a branch in the keydown handler.
5. **Body class?** Toggle in `setMode`. Reset in HOME action.
6. **Persistence?** Use `loadStore` / `saveStore`. Add a key, default empty.

## Testing

There are no automated tests. The dev loop is:

```sh
python3 -m http.server 8000   # if you want HTTP, otherwise just open index.html
```

Open in browser, exercise the feature manually. Watch the console for errors. After every JS edit, run:

```sh
node -e "
  const fs = require('fs');
  const html = fs.readFileSync('/Users/alanho/development/instant-dict/index.html', 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/g);
  let best = ''; for (const s of m) if (s.length > best.length) best = s;
  try { new Function(best.replace(/^<script>|<\/script>\$/g, '')); console.log('OK'); }
  catch (e) { console.log('ERR:', e.message); }
"
```

This catches syntax errors before the user has to.

## Style notes

- Comments are sparse — only when the *why* is non-obvious. Don't restate what the code does.
- The on-screen keyboard mirrors a real bilingual device: bopomofo (red, top-right), cangjie (green, bottom-left), calc-hint (orange, top-left). Don't break those positions.
- LCD font is Menlo for monospace UI elements; Noto Serif TC / Noto Sans CJK TC for Chinese.
- Colors stay within the LCD palette (`--lcd-bg`, `--lcd-ink`, `--lcd-ghost`). External colors (red ON/OFF, green HOME, blue BACK) are intentional accents.

## Things that are *not* TODO items

- Don't extract to a framework. The single-file IIFE is intentional.
- Don't add a build step. Edit, save, reload.
- Don't replace data files unless the user asks. They're large but committed deliberately.
- Don't add automated tests unless asked. Manual browser exercise is the contract.
