# 三國演義 IC card — design notes

The Sango "IC card" is a turn-based strategy mini-game living inside 萬能通
OMNI·DICT (instant-dict). Loaded eagerly via `<script src="sango/sango.js?v=N">`
in `instant-dict/index.html`; the host enters this mode through F7 → 外接卡 →
三國演義 (or main menu item 7).

## File layout

```
instant-dict/sango/
├── sango.js                    # game module — window.SANGO API
├── sango.md                    # this file
├── sango_title.png             # 1774×887 — title screen
├── sango_map1.png              # 1619×971  — China map background
└── sango_characters_map.png    # 1536×1024 — 4×4 sprite sheet of 16 portraits
```

`sango.js` is the only script. It exposes `window.SANGO = { … }` with these
functions called by `instant-dict/index.html`:

- `init(state)` — initialise/reset `state.sango` if missing or schema-stale
- `render(state, el)` — paint into the LCD body
- `onKey(state, action)` — keyboard / arrow / ENTER / BACK dispatch
- `digit(state, n)` — number-key shortcut on the main view
- `pickLord / pickAction / pickSub / pickCity / pick / cancel / restart` — click delegates
- `spriteStyle(idx, scale)` — CSS sprite-slice helper for portraits

The host wires F7 + the main-menu entry; everything in-game lives here.

## Schema versioning

```js
const SCHEMA = N;   // bump on any state-shape change
```

`init()` resets the saved session if `state.sango._v !== SCHEMA`, so old
in-flight games don't crash a freshly-loaded build.

When you change the state shape **also** bump the script's cache-buster:

```html
<script src="sango/sango.js?v=N"></script>
```

…otherwise browsers serve the cached old JS.

## World

### Calendar
Starts **中平六年 (189 AD) 正月**. Time advances 1 month each time the player
picks `結束`.

### Lords (8 total — 4 playable, 4 NPC)
| id | name | playable | mark |
|---|---|---|---|
| `liubei`     | 劉備 玄德    | ✓ | 劉 |
| `caocao`     | 曹操 孟德    | ✓ | 曹 |
| `sunjian`    | 孫堅 文台    | ✓ | 孫 |
| `lubu`       | 呂布 奉先    | ✓ | 呂 |
| `dongzhuo`   | 董卓 仲穎    | – | 卓 |
| `yuanshao`   | 袁紹 本初    | – | 紹 |
| `gongsunzan` | 公孫瓚 伯珪  | – | 瓚 |
| `yuanshu`    | 袁術 公路    | – | 術 |

Wu lord 孫堅 borrows 孫權's portrait (only Wu portrait we have). 呂布 in 徐州
is anachronistic (he was at 洛陽 with 董卓 in 189) — kept for playability.

### Cities (8 total) — `CITIES_DEF`
Each city has: `id, name, pos[x%, y%], adj[ids]`, and an `init` block with
`lord, gold, rice, soldiers, develop, commerce, gens[]`.

| City | Pos | Owner (189) | Notes |
|---|---|---|---|
| 北平     | NE | 公孫瓚 | edge of empire |
| 渤海     | N  | 袁紹   | rich north |
| 洛陽     | C  | 董卓   | imperial capital, strongest |
| 平原     | NE | 劉備   | weakest player start |
| 陳留     | C  | 曹操   | best generals + economy |
| 徐州     | E  | 呂布   | central east |
| 南陽     | C  | 袁術   | mid south |
| 長沙     | S  | 孫堅   | only 1 adj — must take 南陽 to expand |

### 武將 — `ALL[]` = `G[]` ∪ `EXTRA[]` (70 total)
- `G[]` = 16 portrait-backed generals (positions in the sprite sheet).
- `EXTRA[]` = 54 historical generals, text-only.

Each general has `{ name, zi, faction, war, hp, iq, chr }`. Ownership is
implicit — a general is "employed" iff its index appears in some `city.gens`,
otherwise 在野 (recruitable via 訪賢).

Initial roster assignments at 189 are roughly historical (e.g. 陳留 starts
with 曹操 + 夏侯惇 + 張遼 + 典韋 + 夏侯淵 + 曹仁 + 許褚 + 郭嘉 + 荀彧).

## Game loop

```
title → lord-pick → briefing → main ↔ {characters / character-detail / cities / roster}
                                  ↘ gameover (win/lose) → lord-pick
```

`main` has sub-states:
- `actions` — top-level command menu
- `admin-menu` / `military-menu` — sub-menu of commands
- `pick-develop / pick-commerce / pick-recruit / pick-search / pick-attack-from / pick-attack-to`
- `result` — post-action alert (always followed by ENTER → `actions`)

### 行動力 (Action Points)
- Cap **100**, restored **+60** at the start of each new month.
- Costs:

| Action | AP |
|---|---|
| 開發    | 30 |
| 商業    | 30 |
| 徵兵    | 30 |
| 訪賢    | 40 |
| 出陣    | 50 |

Free actions (do not advance time and don't cost AP): 武將 / 名簿 / 城池.

### Player commands

1. **內政**
   - **開發** — 300 金 → 民度 +10 (rice income tied to 民度)
   - **商業** — 200 金 → 商業度 +10 (gold income tied to 商業)
   - **徵兵** — 200 金 + 500 米 → 兵 +500
   - **訪賢** — ~40% chance to find a 在野 武將, joins selected city
2. **軍事**
   - **出陣** — pick own city → adjacent enemy → resolve battle
3. **武將** — 16 portrait grid (visual)
4. **名簿** — paginated text list of all 70, with current employer
5. **城池** — list of all 8 cities + stats
6. **結束** — end month → AI ticks, economy ticks, AP +60

### Result alert
Every successful action and every failure pops a `result` panel with title +
before/after deltas. `結束` shows a `本月結算` alert summarising what every
NPC did this month. Press ENTER to dismiss.

### Economy (per-city, per-month)

```
goldIn   = 民度 × 2 + 商業 × 4
riceIn   = 民度 × 40
goldUpkeep = soldiers / 100
riceUpkeep = soldiers / 4

When rice < 0 → lost = min(soldiers, -rice * 4) deserters
```

### Combat (`resolveAttack`)
```
atkPow = atk.soldiers × (1 + sumGenWar(atk)/400) × rand(0.85..1.15)
defPow = def.soldiers × (1 + sumGenWar(def)/400) × rand(1.0..1.3) + def.develop × 30

if atkPow > defPow:
  surviving = atk.soldiers × 0.7
  city flips owner
  half of surviving stays in source, half garrisons new city
  defending generals scatter (city.gens cleared)
else:
  atk loses 55% of soldiers
  def loses 18%
```
`sumGenWar` is **capped at 500** to prevent runaway stacks.

### AI (each NPC, once per month)
1. If has > 6000 soldiers and an adjacent enemy exists → maybe attack the
   weakest adjacent enemy. Threshold and chance depend on whether the target
   is the player and whether we're still in the year-189 grace period.
2. Else: `40% 開發 / 30% 商業 / 30% 徵兵`, on a random own city, if affordable.
3. Else `idle` (休養).

The result is collected and shown verbatim in the player's end-turn alert.

### Win / lose
- Own all 8 cities → `result = 'win'` → 統一天下 screen.
- Own 0 cities → `result = 'lose'` → 勢力盡失 screen.
- Either path: ENTER returns to lord-pick.

## Player controls (in-game)

- `1` … `6` — top-level command shortcut (in `actions` subState)
- `1` … `4` — sub-option shortcut inside admin-menu (1 開發 2 商業 3 徵兵 4 訪賢)
- `↑ ↓ ← →` — move selection (also pages the 名簿 view)
- `ENTER` — confirm / dismiss alert / next
- `◀ BACK` — cancel / go up one menu level. **In `actions` it is a no-op** —
  the only ways to exit the game are F1–F7 (top-level mode switch).
- `F1`–`F7` — switch dictionary modes (state is preserved; re-enter via F7
  → 三國演義 to continue the same game).

## Where to extend (TODO / 後續可加)

Roughly in order of impact:

1. **武將 deployment** — move generals between own cities (currently they
   only move via city capture, which scatters defenders).
2. **AI 訪賢** — let NPCs also recruit 在野 generals (currently only the
   player does, so the talent pool stays full forever).
3. **AI multi-action** — give NPCs an AP budget too, so strong powers
   actually press their advantage. Currently 1 NPC action / month.
4. **外交** — alliance / non-aggression pact / break. Use 武將 charm stat.
5. **Battle detail screen** — animate the combat formula step by step
   instead of one-line outcome.
6. **Random events** — disasters, plague, defections, wandering generals
   (especially historic ones like 諸葛亮 visiting), to spice up year-by-year.
7. **More cities / map** — currently only 8 nodes. Adding 並州 / 涼州 /
   益州 / 冀州 / 兗州 / 揚州 / 荊州 / 司隸 etc would give the map proper
   shape. The `pos` and `adj` lookups make this a data-only change.
8. **Special abilities** — e.g. 諸葛亮 → +1 free 內政 action / month,
   呂布 → +30% combat power, 貂蟬 → 美人計 to disable an enemy general.
9. **Victory paths beyond conquest** — 漢室禪讓, 三分天下, 民心得分.
10. **武將 detail for non-portrait** — text-only generals currently only
    show in the 名簿 list. Could add a non-portrait detail screen.
11. **Persistence** — currently lives in `state.sango` and persists across
    F-key mode switches but resets on browser reload (state lives in memory
    only; the host doesn't serialise to localStorage). If we want save
    games, hook into the host's existing localStorage layer.

## Style notes

- All UI rendered into `elLcdBody.innerHTML` in one shot per call.
- LCD palette overridden in `is-sango-mode` body class so the bundled PNG
  art (which has a pale-olive background ~`#cfd7aa`) blends with the screen
  rather than appearing as a bright box.
- City dots (`.sango-dot`) are absolute-positioned over the map at `pos[x%, y%]`.
- 名簿 / 城池 / 結算 alerts use monospace Menlo for stat columns, serif for
  Chinese names.
- No F-key references in the in-game UI vocabulary — F-keys are device-level
  mode switches, treated as "exit" from the game's perspective.

## Cache-buster checklist

When changing `sango.js`:

1. Bump `SCHEMA` if the state shape changed (so stale saves auto-reset).
2. Bump the `?v=N` query in the `<script>` tag inside `instant-dict/index.html`.
3. Smoke-test with `node --check sango.js` and a quick `node -e` flow that
   simulates `init → enter → enter → enter → digit → digit → enter → …`.
