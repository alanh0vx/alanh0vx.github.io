# 港雀館 — client-side preview

`hkmj/index.html` and `hkmj/assets/` are the deployable static game. No server functions, API keys or runtime npm installation are required. The existing GitHub Pages path is `/hkmj/`.

Editable source is in `hkmj/source/`. Run `npm ci`, `npm run dev`, `npm test`, or `npm run build` there. Copy `dist-static/index.html` and `dist-static/assets/` into `hkmj/` after building. Assets use relative paths.

## Gameplay

- 144 physical tiles (including eight flowers/seasons), traditional vector faces, shuffled deals, heuristic AI, sound and avatar selection.
- Concealed tiles sort after discarding. The new draw stays separated and highlighted at the right, including the initial dealer tile.
- Each new hand opens with animated shuffling, 18 two-tile stacks per side, three interactive dice, a dice-dependent wall break, stack dealing and exposed flower replacements. The opening can be skipped or resumed after refresh without re-dealing.
- Flowers are exposed separately and replaced from the tail, including repeated flowers and kong replacement draws. Matching-seat flowers add one settlement fan each, but do not satisfy the minimum hand fan; no flower-set or flowerless bonus.
- Sequential AI turns show the active player and named discard animation.
- Eligible player 上 / 碰 / 明槓 / 食糊 claims pause indefinitely for a decision. Passing resumes the next turn; a win outranks meld claims.
- Own-turn 自摸 / 暗槓 / 加槓 choices pause until the player chooses or passes. Kongs draw a replacement from the wall's back; added kongs can be robbed by an eligible AI hand.
- AI can chow, pung, declare exposed/concealed/added kongs, and win by self-draw or discard. Chow only claims the previous seat; win takes priority over pung/kong, then chow. Added kongs allow a robbing-win response, including a paused human decision. This table uses one winner per discard, resolved in turn order after the discarder.
- Setup offers a virtual starting balance, stake presets, 雞糊 (zero-fan minimum) or the default three-fan minimum, and twenty possible AI names with a reroll button.
- Settlement shows scoring patterns, each player's change and balance. Next hand preserves balances and opponents.

## Explicit house table

The setup page shows the entire payout table before starting. Provisional stake interpretations are 二五雞 = $0.25 base, 五一 = $0.50, 一二蚊 = $1, 二四蚊 = $2, 五、十蚊 = $5. These names vary by household and are not a claim of universal Hong Kong rules.

Full doubling to an eight-fan payment cap: base × 2^fan; discarder pays two shares, other losers one each; on self-draw all three pay two shares. Amounts are integer cents. Kong has no separate payment. Negative virtual balances are allowed. There is no real-money transaction.

Implemented fan: self-draw, all chows, dragon pungs and matching seat/round-wind pungs (1 each); mixed one suit, all pungs, mixed terminals (3); little three dragons (5); pure one suit (7); all honors, pure terminals, big three dragons and little four winds (10); big four winds and thirteen orphans (13). The highest supported decomposition is used; higher fan hands pay at the cap. There is no flowerless/closed-hand bonus and no seven-pairs special hand in this version. The current round wind remains East.

Published HK rule tables differ; background references include [Sloperama's HK overview](https://sloperama.com/mjfaq/mjfaq17.html) and [Old Hong Kong table rules](https://c.tabletopia.com/games/old-hong-kong-mahjong/rules/mahjong-rules/en). The visible in-game table is authoritative for this prototype.

## Saving and mobile

Current game, settings, pending choices, exposed melds, names, balances and results automatically save to `hkmj.game.v1` in localStorage. Refresh resumes the pending AI phase or decision without re-dealing or paying twice. Manual Save asks for confirmation. The opaque leave-table dialog supports confirmed save-and-leave or cancel; discarding requires a second explicit confirmation. AI turns and the opening pause while a confirmation is open. Saves are local to this browser and origin; storage failures show a warning. Previous 136-tile saves continue unchanged until the next new hand; the next hand uses 144 tiles. Older saves receive default table settings.

The live table uses the dynamic viewport height on phones and desktops. All 13–14 concealed tiles fit in one row without horizontal scrolling; tapping a tile selects it with an enlarged preview, and the 出牌 button confirms the discard. Landscape phones show table and hand side by side. Safe-area padding, compact flower racks and an accessible calculator dialog keep controls in view. Chrome emulation covers narrow portrait and landscape layouts; this is not physical iOS/Android testing.

## Remaining prototype limitations

Full dealer/seat/round progression is not implemented; Next hand repeats the current round configuration. History, rankings and profile statistics remain example data. The manual fan calculator is a limited helper, separate from automatic settlement. Advanced AI strength has not been validated.

Optional synthesized sound effects cover shuffling, stacking, dice, dealing, drawing/discarding, flowers, pung/kong and wins. The setup switch and in-game mute button share a saved preference. Muting, opening a confirmation, skipping the opening, or hiding the page stops scheduled sounds. One reusable Web Audio context unlocks on a click/tap; unsupported or blocked audio never blocks gameplay. No sound downloads are required.

Opponent bubbles show brief Cantonese reactions to thinking, melds, wins and dealing in. Exposed AI melds appear beside their seats. The compact flower summary opens a dialog with enlarged, named flower tiles grouped by player.
