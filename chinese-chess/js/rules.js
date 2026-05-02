// ============================================================
// rules.js — Move generation, validation, check/checkmate
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var SIDE = G.SIDE;
  var TYPE = G.TYPE;

  // --- Helpers ---

  function inBounds(r, c) {
    return r >= 0 && r <= 9 && c >= 0 && c <= 8;
  }

  // Palace bounds
  function inPalace(r, c, side) {
    if (c < 3 || c > 5) return false;
    if (side === SIDE.RED) return r >= 7 && r <= 9;
    return r >= 0 && r <= 2;
  }

  // Is the row on this side's half? (for elephant river check)
  function onOwnSide(r, side) {
    if (side === SIDE.RED) return r >= 5;
    return r <= 4;
  }

  function findGeneral(board, side) {
    var rStart = (side === SIDE.RED) ? 7 : 0;
    var rEnd = (side === SIDE.RED) ? 9 : 2;
    for (var r = rStart; r <= rEnd; r++) {
      for (var c = 3; c <= 5; c++) {
        var p = board[r][c];
        if (p && p.type === TYPE.GENERAL && p.side === side) {
          return [r, c];
        }
      }
    }
    return null;
  }

  // --- Per-piece candidate move generators ---
  // Each returns array of [row, col] target positions (pseudo-legal, ignoring check)

  function generalMoves(board, r, c, side) {
    var moves = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      if (inPalace(nr, nc, side)) {
        var target = board[nr][nc];
        if (!target || target.side !== side) {
          moves.push([nr, nc]);
        }
      }
    }
    return moves;
  }

  function advisorMoves(board, r, c, side) {
    var moves = [];
    var dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      if (inPalace(nr, nc, side)) {
        var target = board[nr][nc];
        if (!target || target.side !== side) {
          moves.push([nr, nc]);
        }
      }
    }
    return moves;
  }

  function elephantMoves(board, r, c, side) {
    var moves = [];
    var dirs = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
    var eyes = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      var er = r + eyes[i][0], ec = c + eyes[i][1];
      if (inBounds(nr, nc) && onOwnSide(nr, side) && !board[er][ec]) {
        var target = board[nr][nc];
        if (!target || target.side !== side) {
          moves.push([nr, nc]);
        }
      }
    }
    return moves;
  }

  function chariotMoves(board, r, c, side) {
    var moves = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        var target = board[nr][nc];
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (target.side !== side) moves.push([nr, nc]);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  function horseMoves(board, r, c, side) {
    var moves = [];
    // [leg direction, then two diagonal destinations from that leg]
    var patterns = [
      { leg: [-1, 0], targets: [[-2, -1], [-2, 1]] },
      { leg: [1, 0],  targets: [[2, -1], [2, 1]] },
      { leg: [0, -1], targets: [[-1, -2], [1, -2]] },
      { leg: [0, 1],  targets: [[-1, 2], [1, 2]] }
    ];
    for (var i = 0; i < patterns.length; i++) {
      var lr = r + patterns[i].leg[0], lc = c + patterns[i].leg[1];
      if (!inBounds(lr, lc) || board[lr][lc]) continue; // blocked
      var targets = patterns[i].targets;
      for (var j = 0; j < targets.length; j++) {
        var nr = r + targets[j][0], nc = c + targets[j][1];
        if (inBounds(nr, nc)) {
          var t = board[nr][nc];
          if (!t || t.side !== side) {
            moves.push([nr, nc]);
          }
        }
      }
    }
    return moves;
  }

  function cannonMoves(board, r, c, side) {
    var moves = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var nr = r + dr, nc = c + dc;
      var jumped = false;
      while (inBounds(nr, nc)) {
        var target = board[nr][nc];
        if (!jumped) {
          if (!target) {
            moves.push([nr, nc]);
          } else {
            jumped = true; // found the screen piece
          }
        } else {
          if (target) {
            if (target.side !== side) moves.push([nr, nc]);
            break;
          }
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  function soldierMoves(board, r, c, side) {
    var moves = [];
    var forward = (side === SIDE.RED) ? -1 : 1;
    var crossed = (side === SIDE.RED) ? (r <= 4) : (r >= 5);

    // Forward
    var nr = r + forward;
    if (inBounds(nr, c)) {
      var t = board[nr][c];
      if (!t || t.side !== side) moves.push([nr, c]);
    }

    // Sideways (only after crossing river)
    if (crossed) {
      var laterals = [[0, -1], [0, 1]];
      for (var i = 0; i < laterals.length; i++) {
        var nc = c + laterals[i][1];
        if (inBounds(r, nc)) {
          var t2 = board[r][nc];
          if (!t2 || t2.side !== side) moves.push([r, nc]);
        }
      }
    }

    return moves;
  }

  // --- Generate pseudo-legal moves for a piece ---

  var moveGenerators = {};
  moveGenerators[TYPE.GENERAL] = generalMoves;
  moveGenerators[TYPE.ADVISOR] = advisorMoves;
  moveGenerators[TYPE.ELEPHANT] = elephantMoves;
  moveGenerators[TYPE.CHARIOT] = chariotMoves;
  moveGenerators[TYPE.HORSE] = horseMoves;
  moveGenerators[TYPE.CANNON] = cannonMoves;
  moveGenerators[TYPE.SOLDIER] = soldierMoves;

  function getPseudoLegalMoves(board, r, c) {
    var piece = board[r][c];
    if (!piece) return [];
    var gen = moveGenerators[piece.type];
    if (!gen) return [];
    return gen(board, r, c, piece.side);
  }

  // --- Flying general check ---

  function flyingGeneralViolation(board) {
    var redGen = findGeneral(board, SIDE.RED);
    var blackGen = findGeneral(board, SIDE.BLACK);
    if (!redGen || !blackGen) return false;
    if (redGen[1] !== blackGen[1]) return false; // different columns

    // Same column — check if any piece between them
    var minR = Math.min(redGen[0], blackGen[0]);
    var maxR = Math.max(redGen[0], blackGen[0]);
    for (var r = minR + 1; r < maxR; r++) {
      if (board[r][redGen[1]]) return false; // piece blocks
    }
    return true; // face to face — violation
  }

  // --- Check detection ---

  // Is the given side's general under attack?
  function isInCheck(board, side) {
    var gen = findGeneral(board, side);
    if (!gen) return true; // general captured — shouldn't happen, treat as check
    var enemy = G.oppositeSide(side);

    // Check if any enemy piece can reach the general's position
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (p && p.side === enemy) {
          var targets = getPseudoLegalMoves(board, r, c);
          for (var i = 0; i < targets.length; i++) {
            if (targets[i][0] === gen[0] && targets[i][1] === gen[1]) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // --- Legal move generation ---

  // Generate all legal moves for a side
  function generateLegalMoves(board, side) {
    var moves = [];
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (p && p.side === side) {
          var targets = getPseudoLegalMoves(board, r, c);
          for (var i = 0; i < targets.length; i++) {
            var tr = targets[i][0], tc = targets[i][1];
            // Try the move on a clone
            var testBoard = G.cloneBoard(board);
            testBoard[tr][tc] = testBoard[r][c];
            testBoard[r][c] = null;

            // Check flying general
            if (flyingGeneralViolation(testBoard)) continue;
            // Check if own general is in check after the move
            if (isInCheck(testBoard, side)) continue;

            moves.push({
              from: [r, c],
              to: [tr, tc],
              piece: { type: p.type, side: p.side },
              captured: board[tr][tc] ? { type: board[tr][tc].type, side: board[tr][tc].side } : null
            });
          }
        }
      }
    }
    return moves;
  }

  // Legal moves for a specific piece
  function getLegalMovesForPiece(board, r, c) {
    var p = board[r][c];
    if (!p) return [];
    var targets = getPseudoLegalMoves(board, r, c);
    var legal = [];

    for (var i = 0; i < targets.length; i++) {
      var tr = targets[i][0], tc = targets[i][1];
      var testBoard = G.cloneBoard(board);
      testBoard[tr][tc] = testBoard[r][c];
      testBoard[r][c] = null;

      if (flyingGeneralViolation(testBoard)) continue;
      if (isInCheck(testBoard, p.side)) continue;

      legal.push({
        from: [r, c],
        to: [tr, tc],
        piece: { type: p.type, side: p.side },
        captured: board[tr][tc] ? { type: board[tr][tc].type, side: board[tr][tc].side } : null
      });
    }
    return legal;
  }

  // --- End conditions ---

  function isCheckmate(board, side) {
    if (!isInCheck(board, side)) return false;
    return generateLegalMoves(board, side).length === 0;
  }

  function isStalemate(board, side) {
    if (isInCheck(board, side)) return false;
    return generateLegalMoves(board, side).length === 0;
  }

  // Simple repetition detection: check if same FEN appears 3 times in history
  function detectRepetition(boardHistory) {
    if (boardHistory.length < 6) return false;
    var current = boardHistory[boardHistory.length - 1];
    var count = 0;
    for (var i = 0; i < boardHistory.length; i++) {
      if (boardHistory[i] === current) count++;
    }
    return count >= 3;
  }

  // --- Export ---
  window.ChineseChess.Rules = {
    inBounds: inBounds,
    inPalace: inPalace,
    findGeneral: findGeneral,
    getPseudoLegalMoves: getPseudoLegalMoves,
    flyingGeneralViolation: flyingGeneralViolation,
    isInCheck: isInCheck,
    generateLegalMoves: generateLegalMoves,
    getLegalMovesForPiece: getLegalMovesForPiece,
    isCheckmate: isCheckmate,
    isStalemate: isStalemate,
    detectRepetition: detectRepetition
  };
})();
