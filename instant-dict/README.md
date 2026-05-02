# 萬能通 OMNI·DICT OD-2026 PRO

A single-page HTML5 fan recreation of the Hong Kong **快譯通 INSTANT-DICT EC4900H Super** electronic dictionary, renamed to the fictional **萬能通 OMNI·DICT OD-2026 PRO**.

No build step, no framework, no server. Open `index.html` in a browser.

## Features

| # | Mode | What it does |
|---|------|--------------|
| 1 | 詞典 Dictionary | English ⇄ Chinese lookup. ECDICT (40k entries with IPA) + CC-CEDICT (95k) + curated 520-entry highlight set. Fuzzy spelling suggestions via Levenshtein distance. |
| 2 | 中辭 Chinese Char | Single-character lookup by 部首 (radical) or 筆劃 (stroke count). 10,906 chars from g0v moedict-data-csld plus Unihan-derived 倉頡 codes and 廣東拼音 (Cantonese) readings. |
| 3 | 唐詩 Tang Poems | All 320 poems of 唐詩三百首. Browse by author chip or search by line/title. Karaoke-style read-aloud with line highlighting. |
| 4 | 計算 Calculator | Scientific calc — sin/cos/tan, log/ln, √, x², ^, π, e. Calc-mode dim/highlight reskins the keyboard so the orange operators lead. |
| 5 | 百科 Encyclopedia | 1,114 Wikipedia summaries (EN + 繁中 + 簡中) categorised across 11 topics — tech, science, history, animals, plants, geography, pop, etc. Pre-WWII history + modern tech vocabulary. |
| 6 | 遊戲 Mini Games | Four word games: 猜字 Hangman, 配對 Match, 拼字 Anagram, 拼音 Pinyin. |

## Chinese IME

中辭 and 唐詩 have a 4-method Chinese IME, switched by the green 輸入法 keyboard button:

| Method | Type | Default | How it works |
|--------|------|---------|--------------|
| 廣東拼音 | Yale-style Cantonese | ✓ | `jong → 莊`, `jung → 中`, `ching → 青`, `yeung → 央`. Internally converts Yale → LSHK Jyutping (j↔z, y↔j, ch→c, eu→oe/eo) and matches against Unihan `kCantonese`. |
| 注音 | Bopomofo / Zhuyin | | Latin keys map to bopomofo (matches the device's red annotations). E.g. `g + 0 → ㄕㄢ → 山`. |
| 拼音 | Mandarin Hanyu Pinyin | | Standard latin pinyin, tones optional. Matches against Unihan-pinyin and moedict `py`. |
| 倉頡 | Cangjie | | Standard letter-to-radical mapping (`a→日, b→月, …`). Buffer displays radical chars, matches Unihan `kCangjie`. |

The keyboard auto-restyles per active method: 注音 enlarges/lights the red bopomofo annotations, 倉頡 lights the green cangjie radicals, 拼音/廣東拼音 dim both so the latin letters lead.

Candidate flow: type → buffer + 1-9 candidate row appears → press 1-9 (or click) to select → SPACE selects #1 → BACKSPACE deletes one buffer char.

## Other UI bits

- Bookmarks (★ 書籤) and history (歷史) persist in `localStorage`.
- Web Speech API for pronunciation — separate buttons for 發音 (auto), 國語 (Mandarin), 粵語 (Cantonese).
- Click any definition / explanation / poem line in the LCD to read it aloud.
- HOME ⌂ button returns to main menu; ◀ 返回 peels one UI layer at a time.
- F1–F6 hotkeys jump straight to the six modes; Tab cycles forward/back.
- Welcome boot splash → main menu → mode of choice.
- Responsive: pixel-perfect at 720px wide, transform-scales down to fit any narrower viewport (phones included) without re-flowing.

## Data sources

| File | Size | Source | License |
|------|------|--------|---------|
| `dict.js` | 47 KB | Curated ~520 entries | hand-picked |
| `ecdict.js` | 5.5 MB | [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT), 40k entries | MIT |
| `cedict.js` | 8.4 MB | [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict), 95,382 entries | CC BY-SA 4.0 |
| `cnchars.js` | 1.6 MB | [g0v/moedict-data-csld](https://github.com/g0v/moedict-data-csld) (10,906 chars) + Unicode [Unihan](https://www.unicode.org/charts/unihan.html) `kCangjie` / `kCantonese` | CC BY-ND 3.0 TW + Unicode terms |
| `poems.js` | 97 KB | 唐詩三百首 (320 poems) | Public Domain |
| `wiki.js` | 1.3 MB | en.wikipedia.org + zh.wikipedia.org summaries (1,114 entries) | CC BY-SA 4.0 |

## Project layout

```
instant-dict/
├── index.html      # 4,000 lines — UI, CSS, all logic, all modes
├── dict.js         # window.DICT = [...]
├── ecdict.js       # window.ECDICT = [...]
├── cedict.js       # window.CEDICT = [...]
├── cnchars.js      # window.CNCHARS = [...]   (c, r, ts, ns, py, bp, cj, jp, d)
├── poems.js        # window.POEMS = [...]
└── wiki.js         # window.WIKI = [...]      (en, zh, ee, ez, es, c, d)
```

Build scripts that produced these data files live under `/tmp/cn-build`, `/tmp/wiki-build`, `/tmp/ecdict-build`. They are regeneration helpers, not part of the runtime.

## Running

```sh
# Just open the file
open index.html

# Or serve over HTTP if you'd like CORS-clean dev tools / Wikipedia REST in the iframe
python3 -m http.server 8000
# then visit http://localhost:8000/
```

No npm install, no bundler. Edit `index.html` and reload — that's the loop.

## Keyboard cheatsheet

| Key | Action |
|-----|--------|
| F1–F6 | Jump to mode (詞典/中辭/唐詩/計算/百科/遊戲) |
| Tab / Shift-Tab | Cycle modes |
| ↑ ↓ ← → | Navigate list / menu |
| Enter | Open / confirm / new game round |
| Esc | Power on/off |
| Home | Main menu |
| Backspace | Delete buffer / spelling backspace |
| 1–9 | Select IME candidate (when buffer is non-empty) |
| Space | Commit IME candidate #1, or word boundary |
| Alt-R / Alt-B / Alt-H | Random / Bookmark / History |

## License

Project code: MIT-licensed for personal use; not affiliated with 快譯通 or any third party. Dictionary data carries the licenses listed above. This is a fan project — no commercial use of the original brand or device design is intended.
