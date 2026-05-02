# Instant-Dict (HTML5) — Requirements

A browser-based recreation of the **快譯通 INSTANT-DICT EC4900H Super** (English-Chinese Talking Dictionary Plus PDA), playable as a single HTML5 page.

## Goals

- Visual homage to the EC4900H clamshell device — dark plastic body, monochrome LCD, QWERTY + 注音/倉頡 key legends, language row, function keys, speaker grille, stylus.
- Functional **English ⇄ Chinese** lookup with the device's signature *instant-as-you-type* search.
- Talking: speak the looked-up word in English / 國語 (Mandarin) / 粵語 (Cantonese), best-effort, via the Web Speech API.
- Works offline as a single static page (no build step). Opens with `open index.html`.

## Scope (must-have)

1. **Device frame**
   - Hinged, two-panel layout (top: LCD; bottom: keyboard).
   - LCD area shows current entry and a results list.
   - Speaker grille, brand marks (`快譯通`, `INSTANT-DICT`, `EC4900H SUPER`, `English Chinese Talking Dictionary Plus PDA`, `手寫識別`).
   - Subtle red felt/cloth backdrop matching the photo.

2. **Keyboard**
   - QWERTY main grid with secondary 注音 / 倉頡 hints printed on each key (visual only — not required to be functionally typeable).
   - Top row: `英 ENG`, `粵 CHI`, `日 JAP`, `西 SPA`, `法 FRE`, `德 GER`, `意 ITA`, `荷 DUT`.
   - Number row `1`–`0`.
   - Function keys visible in the photo: `MARK/SMBL`, `中/英` (toggle direction), `辭典切換`, `同義詞`, `反義詞`, `文法/例句`, `衍生字`, `輸入法`, `詞頭變化`, `混淆字`, `同音字`, `SPACE`, `ENTER =`, `BS`, arrow cluster (`DEL` / `EDIT` / `INS`), `DATA LINK`, `ON/OFF` (red), `發音`, `國語`, `粵語`, scroll triangles (orange).
   - Clicking a letter/number key types into the search field; backspace deletes; enter commits.
   - Physical keyboard input also works (mirrors on-screen keys with a brief press animation).

3. **Dictionary lookup**
   - Embedded English-Chinese wordlist (≥200 common entries) shipped with the page.
   - As the user types, results filter by prefix; highlighted top result shown in detail with English headword, part of speech, 中文 gloss, and example sentence where available.
   - `中/英` toggles direction (English→Chinese vs Chinese→English).
   - `↑`/`↓` move the selection in the result list.
   - `ENTER` opens the highlighted entry; `BS` backspaces; `ON/OFF` clears.

4. **Talking**
   - `發音` speaks the current entry in the active language.
   - `國語` forces Mandarin TTS; `粵語` forces Cantonese (falls back to Mandarin if no zh-HK voice).
   - Uses `window.speechSynthesis`; gracefully degrades if unavailable.

5. **Auxiliary panels** (placeholder content acceptable)
   - `同義詞` synonyms, `反義詞` antonyms, `文法/例句` grammar/examples, `衍生字` derivatives — pull from the entry's data when present, otherwise show "—".

## Non-goals

- Real handwriting recognition (`手寫識別` is decorative).
- Real PDA features (calendar, calc, etc.).
- Full multilingual support beyond English ⇄ Chinese — other language LEDs are decorative.
- Mobile-first responsive polish — desktop-first is fine, but should not break on tablets.

## Acceptance

- Open `index.html` directly in Chrome/Safari → device renders and is interactive without errors in the console.
- Typing `app` shows `apple` (蘋果) at the top of the list within one keystroke of typing the prefix.
- Pressing `發音` after selecting `apple` produces audible English speech (where browser supports it).
- Pressing `中/英` flips lookup direction; typing `蘋` then surfaces `蘋果 → apple`.
- All on-screen keys are clickable; the page does not need a server.

## Deliverables

- `requirements.md` — this file.
- `plan.md` — implementation outline.
- `index.html` — the running app (HTML + inline CSS + inline JS, plus a small `dict.js` data file).
- `dict.js` — English-Chinese entries.
