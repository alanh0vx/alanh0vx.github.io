# Mahjong rules and table helpers

`engine.ts` provides the pure 136-tile engine, physical tile conservation, draw/discard turns, chow/pung/kong claim validation and winning-hand shapes. `table-rules.ts` adds the prototype's explicit fan table, minimum-fan eligibility, integer-cent settlement, player kong choices and opponent names. `save.ts` validates and migrates local game snapshots, including pending decisions, exposed kongs and settled results.

The UI implements player pung/kong/win choices plus AI wins. The engine's chow and AI meld claims remain unconnected. `opening.ts` supplies the 144-tile flower wall, dice-dependent break, stack dealing, flower replacement and saved opening steps. The original pure engine remains a 136-tile rules core. Seven-pairs special scoring, complete match progression and additional house-rule scoring are not implemented. See the top-level HKMJ README and in-game payout table for the exact supported rules.

Run `npm test` from `source/`. Tests use Node's built-in test runner and TypeScript stripping.
