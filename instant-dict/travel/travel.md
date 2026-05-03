# 旅行會話 IC card — design notes

The Travel "IC card" is a multilingual phrasebook living inside 萬能通
OMNI·DICT. Loaded eagerly via `<script src="travel/travel.js?v=N">`
in `instant-dict/index.html`; the host enters this mode through F7
(外接卡) → 旅行會話.

## File layout

```
instant-dict/travel/
├── travel.js                # phrasebook module — window.TRAVEL API
└── travel.md                # this file
```

No bundled images — the IC chooser thumbnail is pure CSS
(`.ic-card-thumb.travel-thumb` with the 旅 glyph + "PHRASEBOOK" tag).

`travel.js` exposes `window.TRAVEL = { … }`:

- `init(state)` — initialise/reset `state.travel` if missing or schema-stale
- `render(state, el)` — paint into the LCD body (title / cats / phrases)
- `onKey(state, action)` — keyboard / arrow / ENTER / BACK dispatch.
  Returns `true` if handled, `false` to let the host fall through.
- `digit(state, n)` — number-key shortcut (cats: jump to category;
  phrases: speak language N).
- `pickCat / pickEnter / pickPrev / pickNext / cancel / restart` — click
  delegates that mutate state without triggering render (host re-renders).
- `LANGS` / `CATS` — the static data tables, exposed in case the host
  ever needs them.

The host wires:

- IC card entry in `IC_CARDS` with `loader: () => setMode('travel')`
- `renderTravel()` → `window.TRAVEL.render`
- body class `is-travel-mode`
- F-key flows: handled implicitly because travel is reached only via the
  IC chooser, never as a direct top-level mode (mirrors sango).

## Schema versioning

```js
const SCHEMA = N;     // bump on any state-shape change
```

`init()` resets the saved session if `state.travel._v !== SCHEMA`. When
you change the state shape **also** bump the script's cache-buster:

```html
<script src="travel/travel.js?v=N"></script>
```

…otherwise browsers serve the cached old JS.

## Languages (8)

| id  | code   | tag | name      | TTS notes                              |
|-----|--------|-----|-----------|----------------------------------------|
| en  | en-US  | EN  | English   | Samantha / Allison preferred           |
| zh  | zh-CN  | 國  | 國語      | 普通話 — Tingting / 婷婷               |
| yue | zh-HK  | 粵  | 粵語      | Sinji / 善怡                           |
| ja  | ja-JP  | 日  | 日本語    | Kyoko / Otoya                          |
| ko  | ko-KR  | 韓  | 한국어    | Yuna                                    |
| es  | es-ES  | 西  | Español   | Mónica / Paulina                        |
| pt  | pt-BR  | 葡  | Português | Luciana                                 |
| th  | th-TH  | 泰  | ไทย       | Kanya                                   |

The `tag` column is the 1-char Chinese-style label rendered in the LCD
phrase list. The `code` column is the BCP-47 tag fed to the host's
`speak(text, code)` (which uses `pickVoice(lang)` with the same fallback
chain as the dict modes).

Order is fixed: **EN → 國 → 粵 → 日 → 韓 → 西 → 葡 → 泰**. This matches
the keypad shortcut keys (1–8 in phrase view) and the row layout.

## Categories (10)

| n | id        | zh   | en           | size |
|---|-----------|------|--------------|------|
| 1 | greet     | 問候 | Greetings    | 12   |
| 2 | customs   | 海關 | Customs      | 8    |
| 3 | transport | 交通 | Transport    | 8    |
| 4 | hotel     | 酒店 | Hotel        | 8    |
| 5 | food      | 餐廳 | Restaurant   | 10   |
| 6 | shop      | 購物 | Shopping     | 8    |
| 7 | sight     | 觀光 | Sightseeing  | 8    |
| 8 | help      | 求助 | Emergency    | 8    |
| 9 | num       | 數字 | Numbers      | 12   |
| 0 | time      | 時間 | Time         | 8    |

Total ~90 phrases × 8 languages = ~720 spoken cells.

No emojis anywhere — the device is a 1990s LCD; emoji ROM didn't exist.
Category icons are just digit + 中/英 names. Per-row speak affordance
is a `►` glyph (CP437 / DOS-era), not 🔊.

Ordering matters: keys 1–9 jump to indexes 0–8, key 0 jumps to index 9
(time). Visual layout is a 3-column grid; arrow keys move
left/right/up/down within that grid.

## Game / UI loop

```
title (hub)
   ├── [1] 例句 PHRASES   → cats   ←→ phrases
   └── [2] 對話 SCENARIOS → scenarios ←→ dialog
```

`title` doubles as the hub: two side-by-side buttons jump straight into
either the phrasebook (`cats` view) or the scenario list (`scenarios`
view). ENTER on title still falls through to phrases for back-compat.

### Title / hub view
Banner + 8-language strip + two buttons: `[1] 例句 PHRASES` /
`[2] 對話 SCENARIOS`. Each button shows totals (10 类 / 90 句, 8 場 / 48 句).

### Cats view
3-col grid of 10 categories. Each cell shows the digit shortcut, the
emoji icon, the 2-char Chinese name, the English name, and the count.

- `1`..`9 0` — jump to that category (also enters `phrases`)
- `↑↓←→` — move selection (3-col wrapping grid)
- `ENTER` — open selected category
- `BACK` — back to title

### Phrases view
Header shows category + position (e.g. `海關　Customs   3 / 8`),
then 8 language rows, each click-to-speak. Foot row has prev/next nav
buttons + a hint line.

- `↑↓←→` — previous/next phrase (cycles)
- `1`..`8` — speak that language directly
- `ENTER` — speak the EN form (default)
- `BACK` — back to cats

### Scenarios view
3-col grid like cats. Each cell shows the scenario digit, 中文 name,
EN name, and turn count. 8 scenarios:

| n | id      | zh   | en          | them    | turns |
|---|---------|------|-------------|---------|-------|
| 1 | customs | 入境 | Customs     | 關員    | 5     |
| 2 | taxi    | 計程車 | Taxi      | 司機    | 6     |
| 3 | hotel   | 酒店 | Hotel       | 櫃台    | 7     |
| 4 | food    | 點菜 | Restaurant  | 服務員  | 8     |
| 5 | direct  | 問路 | Directions  | 路人    | 5     |
| 6 | shop    | 購物 | Shopping    | 店員    | 6     |
| 7 | clinic  | 求醫 | Clinic      | 醫生    | 6     |
| 8 | lost    | 失物 | Lost item   | 警員    | 5     |

Total 48 turns × 8 langs = 384 spoken cells.

### Dialog view (transcript)
The whole conversation is shown as a single-language transcript. The
user picks the language they want to read. Layout:

```
[◀ 目錄]  計程車　Taxi              司機 · 6 句
─────────────────────────────────────────────
[1 EN] [2 國] [3 粵] [4 日] [5 韓] [6 西] [7 葡●] [8 泰]
─────────────────────────────────────────────
[我]   Olá, leve-me a este endereço, por favor.   ►
[司機] Claro, entre.                                ►
[我]   Quanto tempo leva?                           ►
[司機] Cerca de vinte minutos.                      ►
[我]   Pare aqui, por favor. Quanto é?              ►
[我]   Obrigado. Pode ficar com o troco.            ►
─────────────────────────────────────────────
[► 朗讀全段]                  1-8 切換語言　ENT 朗讀全段　◀ 返回
```

Speaker labels render as filled `我` for the traveler and outlined
`司機 / 服務員 / 醫生 / …` for the local (per-scenario `themZh`).

- `1`..`8` — switch the transcript to that language
- `← →`     — cycle through languages (prev / next)
- `↑ ↓`     — jump to previous / next scenario (keeps the active language)
- `ENTER`   — read the entire conversation back-to-back in the active language
- click any line — speak that single line in the active language
- `BACK`    — back to scenarios

The `►朗讀全段` button in the foot, ENTER, or `pickPlayAll(state)` all
hit `speakConversation`, which forwards a list of `{text, lang}` items
to `window.OMNI_SPEAK_SEQ` (the host's `speakSequence` bridge).

## Speech wiring

Every language row emits standard `data-speak / data-speak-lang`
attributes. The host's existing click delegate already routes these
through `speak()`. The only host tweak is in that delegate: it normally
re-routes any `zh-*` tag through `state.voiceLang`, but in `travel`
mode it respects whatever the row declared so 粵 stays 粵 and 國 stays
國.

Number-key shortcuts (1–8 in phrase view) call `window.OMNI_SPEAK(text,
code)` — a small bridge the host exposes (`window.OMNI_SPEAK = speak`)
because the speak function is defined inside the host's IIFE.

## Player controls (in-game)

- `1`..`9 0` — top-level shortcut (cats: jump-to; phrases: speak lang)
- `↑ ↓ ← →` — navigate
- `ENTER` — confirm / speak default (EN)
- `◀ BACK` — go up one level (phrases → cats → title → IC chooser)
- `F1`–`F7` — switch dictionary modes (state preserved; re-enter via F7
  → 旅行會話 to continue at the same position).

## Where to extend

Roughly in order of impact:

1. **More phrases** — current ~90 covers the basics; add ride-sharing,
   pharmacy, weather, festivals, sports, banking, etc.
2. **More languages** — French, German, Italian, Vietnamese, Indonesian
   are obvious additions. Each one adds ~90 new translations + a tag +
   a BCP-47 code; UI adapts because rows are derived from `LANGS`.
3. **Bookmarks** — let the user star phrases for quick access (slot
   into the host's existing `mode|key` bookmark layer:
   `travel|cat-id/phrase-idx`).
4. **Search** — type any English / 中文 / kana fragment to filter
   phrases across all categories.
5. **Pronunciation guides** — show romaji / hangul-romanisation /
   pinyin / tone marks under non-Latin scripts. The IPA voice-strip in
   the host already gives hints on which voices are usable.
6. **Continuous read** — ENTER plays all 8 languages in sequence
   (using `speakSequence`) so the user can shadow the whole row.
7. **Custom phrase pack** — let users add their own scenarios (saved
   to localStorage as a custom category appended to `CATS`).
8. **Picture mode** — show the country flag of the current row's
   language as a column instead of the 1-char Chinese tag.

## Style notes

- All UI rendered into `elLcdBody.innerHTML` in one shot per call.
- LCD palette inherited; no `is-travel-mode` overrides on the LCD bg
  (unlike sango, which dims the panel for the painted maps).
- Category icons use the device's emoji font (no images bundled).
- Phrase rows use a 4-col grid (`14 22 1fr auto`) so the language
  column aligns vertically across phrases.
- Voice strip + IME column are hidden in `is-travel-mode` (matches
  sango / ic / menu modes).

## Cache-buster checklist

When changing `travel.js`:

1. Bump `SCHEMA` if the state shape changed.
2. Bump the `?v=N` query in the `<script>` tag inside
   `instant-dict/index.html`.
3. Smoke-test:

   ```sh
   node --check instant-dict/travel/travel.js
   ```

   …then the standard host syntax check from `instant-dict/CLAUDE.md`
   (catches index.html script-tag breakage).
