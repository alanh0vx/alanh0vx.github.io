# Implementation Plan

## File layout

```
instant-dict/
├── requirements.md
├── plan.md
├── index.html      # markup + styles + app logic
└── dict.js         # English ⇄ Chinese entries (window.DICT = [...])
```

Single-page, no build step. `dict.js` is loaded via a `<script>` tag so it's easy to extend without touching app code.

## Build order

1. **Skeleton** — `index.html` shell with `<main class="device">` containing `.lid` (screen) and `.base` (keyboard). Red felt body background.
2. **Screen** — LCD frame (`#display`): top status row (mode indicator, battery glyph, scroll arrows), input echo line, scrollable result list, detail pane below the divider. Greenish-grey LCD palette, monospace + Noto Sans CJK.
3. **Keyboard layout** — grid of rows matching the photo:
   - Row 0: language tabs (英/粵/日/西/法/德/意/荷) + DATA LINK + ON/OFF.
   - Row 1: `1`–`0` + 詞頭變化 + 混淆字 + 同音字 + 發音.
   - Row 2: Q W E R T Y U I O P + 國語.
   - Row 3: A S D F G H J K L + ' + ENTER + 粵語.
   - Row 4: MARK/SMBL Z X C V B N M + Ü?光 + arrow cluster.
   - Row 5: 中/英 辭典切換 輸入法 SPACE ENTER= 衍生字 + scroll triangles.
   - Row 6 (function strip): 同義詞 反義詞 文法/例句.
   Use CSS grid per row, with `.key` base style + modifier classes (`.key--lang`, `.key--func`, `.key--power`, `.key--orange`).
   Each key gets data attributes for action (`data-key="a"`, `data-action="speak"` etc.).
4. **Key legends** — overlay smaller spans for 注音 (red, top-right), 倉頡 (green, bottom-left). Decorative only — pulled from a JS map so the markup stays clean.
5. **Data** — `dict.js`: ~250 common entries shaped as
   ```js
   { en: "apple", pos: "n.", zh: "蘋果", py: "píng guǒ",
     example: { en: "An apple a day keeps the doctor away.",
                zh: "一日一蘋果，醫生遠離我。" },
     syn: ["fruit"], ant: [], deriv: ["applet"] }
   ```
   Curated list spans foods, animals, body, weather, tech, verbs, adjectives, common phrases.
6. **App logic** (`<script>` at end of `index.html`):
   - State: `{ direction: 'en2zh', query: '', results: [], selected: 0, mode: 'on' }`.
   - `render()` rewrites `#display` from state — cheap, no framework needed.
   - `search(q)` — prefix match, then substring match; ranked; capped at 30 rows.
   - Key handler: dispatch on `data-key` / `data-action`. Mirrors `window.keydown` so physical keys press the on-screen ones (briefly add `.is-pressed`).
   - Direction toggle (`中/英`): swaps the search field over `zh` vs `en`.
   - Speech: `speak(text, lang)` using `speechSynthesis` — pick best matching `voice` for `en-US`, `zh-CN`, `zh-HK`. If none, no-op + flash a `NO VOICE` indicator on the LCD.
   - Aux panels: `同義詞 / 反義詞 / 文法.例句 / 衍生字` swap the LCD's lower pane to the corresponding section.
7. **Polish**
   - Soft inner shadow on the LCD for the look.
   - Press animation on keys (transform + box-shadow).
   - Boot animation: brief `萬能通 OMNI·DICT OD-2026 PRO` splash on first paint.
   - Subtle CRT-style scanlines? Skip — LCDs don't scanline. Just a faint pixel grid.

## Test plan

1. Open `file:///…/instant-dict/index.html` in Chrome and Safari.
2. Type `app` → list shows `apple` first; detail pane fills with 蘋果 + example.
3. Type `xy` (no match) → list shows `NOT FOUND`.
4. Click `中/英` → label flips, search now matches Chinese.
5. Click `發音` → audible TTS for selected word in current language.
6. Click `國語` then `粵語` → speech uses zh-CN / zh-HK voices respectively.
7. Click `↑`/`↓` triangles → selection moves; detail pane updates.
8. Press physical `a` `p` `p` `l` `e` keys → on-screen keys flash in sync.
9. Click `ON/OFF` → screen blanks; click again → boot splash, screen restores.
10. DevTools console clean (no errors / warnings).

## Open decisions

- **Wordlist size**: 250 hand-curated entries gives a believable demo. Larger lists balloon page weight; we can add later if needed.
- **Cantonese voice**: depends on OS. macOS Safari ships `Sin-ji` (zh-HK). Falls back gracefully on others.
- **Pinyin display**: include `py` field but render only when present — no runtime pinyin generator.
