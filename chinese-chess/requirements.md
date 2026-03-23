# Chinese Chess (象棋) Game — Requirements

## 1. Overview

A pure client-side Chinese Chess (象棋) game built with HTML5/CSS/JavaScript. Human vs Computer with multiple difficulty levels, featuring traditional Chinese notation, save/load, and tutorial modes. Default language is **zh-HK (繁體中文-香港)**.

---

## 2. User Profile (玩家檔案)

### 2.1 Profile Creation
- On first launch, prompt user to create a profile
- **暱稱 (Nickname)**: Free text, required, max 12 characters
- **頭像 (Avatar)**: Upload an image (JPG/PNG), processed client-side into a pixel-art style (8-bit or 16-bit aesthetic)
- If skipped, use a default avatar and "棋友" as default nickname
- Profile can be edited anytime from the lobby screen or settings

### 2.2 Avatar Processing
- User uploads any image via file input
- Client-side processing using Canvas API:
  1. Crop to square (center crop)
  2. Downscale to small resolution (e.g., 32×32 or 64×64)
  3. Reduce colour palette (quantise to 16 or 64 colours) to achieve retro pixel-art look
  4. Scale back up for display with nearest-neighbour interpolation (no smoothing)
- Final avatar stored as base64 data URL in localStorage
- Max stored size: ~50KB per avatar

### 2.3 Profile Data
- Stored in localStorage under a dedicated key
- Fields:
  - Nickname
  - Avatar (base64 data URL)
  - Created date
  - Stats: total games played, wins, losses, draws
  - Endgame puzzles solved count (reserved for future use)
- Profile displayed on lobby screen and during games (alongside the player's side)

### 2.4 Data Management (資料管理)
- **清除所有資料 (Clear All Data)** button in Settings
- Shows a **confirmation dialog with warning**:
  - "此操作將刪除所有遊戲存檔、玩家檔案及設定，且無法復原。確定要繼續嗎？"
  - (This will delete all saved games, player profile, and settings. This cannot be undone. Are you sure?)
- Requires explicit confirmation (e.g., type "確認" or double-confirm button)
- Clears all localStorage keys used by the app
- After clearing, returns to first-launch state (profile creation prompt)

---

## 3. Game Board & Pieces

### 2.1 Board
- 9 columns × 10 rows grid (pieces placed on intersections, not squares)
- River (楚河漢界) between ranks 5 and 6
- Palace (九宮): 3×3 area with diagonal lines on each side
- Red at bottom, Black at top (traditional orientation)
- Column labels: Red uses 九八七六五四三二一 (right to left), Black uses 1-9 (left to right)

### 2.2 Pieces (16 per side, 32 total)

| Red | Black | English | Count | Movement |
|-----|-------|---------|-------|----------|
| 帥 | 將 | General/King | 1 | One step orthogonally, confined to palace. Flying General rule: two generals cannot face each other on the same file with no pieces between. |
| 仕 | 士 | Advisor | 2 | One step diagonally, confined to palace (5 positions only) |
| 相 | 象 | Elephant | 2 | Two steps diagonally ("田" pattern), cannot cross river, blocked if intermediate point occupied (塞象眼) |
| 車 | 車 | Chariot/Rook | 2 | Any distance orthogonally, no jumping |
| 馬 | 馬 | Horse/Knight | 2 | L-shape: one orthogonal + one diagonal, blocked if adjacent orthogonal point occupied (蹩馬腿) |
| 炮 | 砲 | Cannon | 2 | Moves like chariot; captures by jumping over exactly one piece (炮架) |
| 兵 | 卒 | Soldier/Pawn | 5 | Forward one step before river; forward or sideways after crossing river. Never retreats. No promotion. |

### 2.3 Visual Style
- Traditional wooden board aesthetic
- Circular pieces with Chinese characters
- Red pieces: red text on light background; Black pieces: black/dark text on light background
- Highlight: last move, selected piece, valid move targets
- Piece animation for moves

---

## 4. Game Rules

### 3.1 Core Rules
- Red moves first
- Players alternate turns
- A piece capturing moves to the captured piece's position
- Must resolve check immediately (move general, block, or capture attacker)

### 3.2 End Conditions
- **Checkmate (將死)**: General in check with no legal escape → loss
- **Stalemate (困斃)**: No legal moves but not in check → loss (unlike Western chess)
- **Perpetual check (長將)**: Forbidden — the checking side must break the cycle or lose
- **Perpetual chase (長捉)**: Forbidden — the chasing side must break the cycle or lose
- **Draw**: Mutual agreement, insufficient material, or mutual perpetual non-violating repetition

---

## 5. Move Notation (記譜法)

### 4.1 Traditional Chinese Notation
Format: **[棋子][原列][動作][目標]**

- **棋子**: Piece character (帥/將, 仕/士, 相/象, 車, 馬, 炮/砲, 兵/卒)
- **原列**: Column number from player's right side
  - Red: 一二三四五六七八九
  - Black: 1 2 3 4 5 6 7 8 9
- **動作**: 進 (advance) / 退 (retreat) / 平 (traverse)
- **目標**:
  - 平: destination column number
  - 進/退 for linear pieces (車/炮/兵): number of steps moved
  - 進/退 for diagonal pieces (馬/仕/相): destination column number

### 4.2 Disambiguation
- Same file, two pieces: 前 (front) / 後 (rear) replaces column number
- Multiple pawns on same files: numbered 一~五 front to back

### 4.3 Examples
- 炮二平五 — Cannon on file 2, traverse to file 5
- 馬8進7 — Black horse on file 8, advance to file 7
- 前車進三 — Front chariot advances 3 steps

---

## 6. Game Modes

### 5.1 Standard Game (人機對弈)
- Human (Red) vs Computer (Black) by default
- Option to swap sides (play as Black)
- Difficulty levels:
  - **初級 (Beginner)**: Shallow search, occasional random moves
  - **中級 (Intermediate)**: Moderate search depth, basic positional evaluation
  - **高級 (Advanced)**: Deeper search, full positional + tactical evaluation
- **悔棋 (Undo)**: Maximum 3 times per game. Can be toggled on/off in pre-game settings. When disabled, the undo button is hidden/greyed out.
- **提示 (Hints)**: Highlights the best move for the player. Can be toggled on/off in pre-game settings. When disabled, the hint button is hidden/greyed out. Limited uses per game (e.g., 3 hints).
- **託管 (Auto-play / CPU takeover)**: During a game, the player can hand control to the AI to finish the game on their behalf. The AI plays both as the human's side using the current difficulty level. The player can watch the game unfold with move animations. A "取回控制" (Take Back Control) button allows the player to resume manual play at any time. Useful for observing endgame technique or when the player wants to see how the AI would finish.
- Draw offer / Resign buttons

### 5.2 Tutorial (新手教學)
- Interactive step-by-step lessons:
  1. **棋盤介紹** — Board layout, river, palace
  2. **棋子走法** — Each piece's movement with interactive demo (tap piece to see valid moves)
  3. **特殊規則** — Check, checkmate, blocking rules (蹩馬腿, 塞象眼), flying general
  4. **基本殺法** — Common checkmate patterns (白臉將, 悶宮, 鐵門栓, etc.)
  5. **開局入門** — Common openings (中炮, 飛相, 仙人指路, etc.)
  6. **記譜法** — How to read/write move notation
- Each lesson has practice exercises

---

## 7. AI Engine

### 6.1 Search Algorithm
- Minimax with Alpha-Beta pruning
- Iterative deepening with aspiration windows
- Null-move pruning (R=2) to skip non-critical branches
- Late move reduction (LMR) for quiet moves late in the move list
- Check extensions (search deeper when in check)
- Move ordering (captures first, killer heuristic, history heuristic, TT best move)
- Transposition table (Zobrist hashing) with best-move storage
- Quiescence search for captures at leaf nodes with delta pruning

### 6.2 Evaluation Function
- Material value (piece counting with standard weights)
- Positional factors:
  - Piece-square tables (positional bonuses per piece per position)
  - **King safety** (advisor/elephant formation around general, flying general exposure penalty)
  - **Chariot mobility** (open line counting, connected chariots bonus)
  - **Cannon activity** (screen piece availability, threatening through screens)
  - **Horse blocking penalty** (蹩馬腿 detection)
  - **Central control** (bonus for pieces on files 4-6)
  - Pawn advancement bonus
- **Endgame-specific evaluation**: chariot value increase, advanced soldier bonuses scaled by penetration depth

### 6.3 Difficulty Levels
| Level | Search Depth | Time Limit | Behaviour |
|-------|-------------|------------|-----------|
| 初級 | 4 ply | 2s | Rarely picks 2nd best move (10% chance), strong baseline play |
| 中級 | 6 ply | 4s | Always plays best move found, full positional evaluation |
| 高級 | 10+ ply | 8s | Deepest search, null-move pruning, aspiration windows, full evaluation |

### 6.4 Opening Book (optional enhancement)
- Common openings stored as move sequences
- Used for first 10-15 moves to play strong, natural openings

---

## 8. Move History & Navigation

### 7.1 Move List Panel
- Displays moves in traditional Chinese notation (e.g., 炮二平五)
- Two-column layout: Red moves on left, Black moves on right
- **Color indicators**: Each move is prefixed with a colored dot (red or black) to clearly identify which side made the move
- Move numbers (第1回合, 第2回合, ...)
- Current move highlighted
- Click any move to jump to that board state

### 7.2 Navigation Controls
- ⏮ First move (起始)
- ◀ Previous move (上一步)
- ▶ Next move (下一步)
- ⏭ Last move (最新)
- Auto-play mode with adjustable speed

---

## 9. Save & Load

### 8.1 Save Game
- Save to browser localStorage
- Multiple save slots (at least 5)
- When leaving a game (back button), prompt the user to save instead of auto-saving
- Save data includes:
  - Full move history
  - Current board state (FEN)
  - Game mode & difficulty
  - Timestamp & custom name
  - Which side the human plays
  - Pre-game settings (allow undo, allow hints)
  - Remaining undo count & hint count

### 8.2 Load Game
- List saved games with name, date, and move count
- Preview board position before loading
- Resume game from saved state
- **Delete saved games** with confirmation dialog (available from both save and load dialogs)

### 8.3 Import/Export
- Export game as FEN string (current position)
- Export full game as PGN-like format (move list)
- Import FEN to set up custom position
- Copy to clipboard support

---

## 10. UI & Layout

### 9.1 Intro / Lobby Screen (主畫面)
The first screen the user sees on launch. Serves as the main hub for all game activities.

- Title / Logo with traditional Chinese chess visual
- **Player profile area** (top or side): pixel-art avatar + nickname. Tap to edit profile.
- First launch: profile creation prompt before showing lobby
- **Menu buttons (vertical layout, centered):**
  - 開始對弈 (Start Game) → opens Pre-Game Settings panel
  - 讀取棋局 (Load Game) → opens saved game list
  - 新手教學 (Tutorial) → enters tutorial section
  - 設定 (Settings) → global settings (sound, theme, data management)

### 9.2 Pre-Game Settings Panel (開局設定)
Shown after clicking "開始對弈". User configures the game before starting.

- **難度 (Difficulty)**: 初級 / 中級 / 高級 — radio or segmented control
- **執棋 (Play as)**: 紅方 (Red, default) / 黑方 (Black)
- **允許悔棋 (Allow Undo)**: Toggle on/off (default: on). When on, player can undo up to 3 times per game.
- **允許提示 (Allow Hints)**: Toggle on/off (default: on). When on, player can request up to 3 hints per game.
- **開始 (Start)** button to begin the game
- **返回 (Back)** button to return to lobby

### 9.3 Game Screen Layout
```
┌─────────────────────────────────────────┐
│  [Menu]    Chinese Chess 象棋    [Settings]│
├──────────────────────┬──────────────────┤
│                      │  Difficulty: ███  │
│                      │                  │
│     Chess Board      │  Move History    │
│     (9×10 grid)      │  1. 炮二平五     │
│                      │     馬8進7       │
│                      │  2. 馬二進三     │
│                      │     車9平8       │
│                      │  ...             │
│                      │                  │
│                      ├──────────────────┤
│                      │  ⏮ ◀ ▶ ⏭       │
├──────────────────────┤  [提示 3/3]       │
│  Captured pieces     │  [悔棋 3/3] [認輸]│
│                      │  [求和] [存檔]    │
└──────────────────────┴──────────────────┘
```

### 9.4 Responsive Design
- Desktop: side-by-side layout (board + panel)
- Tablet/Mobile: stacked layout (board on top, collapsible panel below)
- Minimum supported width: 360px
- Touch-friendly: tap to select, tap to move

### 9.5 Theme & Settings
- Sound effects: move, capture, check, game end (with toggle)
- Board theme: classic wood / simple
- Piece style: traditional Chinese characters
- **Language: zh-HK (繁體中文-香港) as default and primary language**
- All UI text, labels, tooltips, and notifications in Traditional Chinese (Hong Kong conventions)

---

## 11. Technical Architecture

### 10.1 Stack
- Pure HTML5 + CSS3 + vanilla JavaScript (no frameworks)
- Canvas or SVG for board rendering
- localStorage for persistence
- Web Audio API for sound effects

### 10.2 Module Structure
```
/index.html           — Entry point
/css/
  style.css           — Global styles
/js/
  main.js             — App initialization & routing
  board.js            — Board rendering (canvas/SVG)
  game.js             — Game state management
  rules.js            — Move validation & generation
  ai.js               — AI engine (search + evaluation)
  notation.js         — Chinese notation formatter
  history.js          — Move history & navigation
  storage.js          — Save/load to localStorage
  profile.js          — User profile & avatar processing
  tutorial.js         — Tutorial module
  endgame.js          — Endgame puzzle module
  audio.js            — Sound effects
  ui.js               — UI components & interactions
/assets/
  images/             — Board textures, piece images
  sounds/             — Move, capture, check sounds
/data/
  openings.json       — Opening book data
  endgames.json       — Endgame puzzle collection (FEN + solutions)
```

### 10.3 Data Formats
- **Board State**: FEN string (e.g., `rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w`)
- **Move**: `{ from: [col, row], to: [col, row], piece, captured? }`
- **Save File**: JSON with full game state
- **Endgame Puzzle**: `{ id, name, fen, solution: [...moves], difficulty, category }`

---

## 12. Non-Functional Requirements

- **Performance**: AI responds within time limit per difficulty level; smooth 60fps board rendering
- **Offline**: Fully functional without internet (pure client-side)
- **Browser Support**: Modern browsers (Chrome, Firefox, Edge, Safari) latest 2 versions
- **Accessibility**: Keyboard navigation support for board
- **File Size**: Total < 2MB (no heavy dependencies)
- **No server required**: Can be opened directly from file system or any static host

---

## 13. Future Enhancements (Out of Scope for v1)

- **殘局挑戰 (Endgame Puzzles)** — Curated collection of classic endgame puzzles from 《適情雅趣》《橘中秘》《夢入神機》 etc. Currently hidden from the menu; puzzle data and module exist but need solution validation fixes before re-enabling.
- Human vs Human (local / online)
- Move analysis & evaluation bar
- Opening book explorer
- Web Worker for AI computation (non-blocking UI)
- PWA support (installable, offline-first)
- Replay famous historical games
