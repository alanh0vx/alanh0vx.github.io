// ============================================================
// notation.js — Traditional Chinese notation (炮二平五 style)
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var SIDE = G.SIDE;
  var TYPE = G.TYPE;

  // Red column numbers (from Red's right = col 8 → 一, col 0 → 九)
  var RED_COL_CHARS = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
  // Black column numbers (from Black's right = col 0 → 9, col 8 → 1)
  var BLACK_COL_CHARS = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];

  var CN_NUMBERS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  // Piece characters for notation
  function pieceChar(type, side) {
    return G.PIECE_CHAR[side + '_' + type];
  }

  function colChar(col, side) {
    if (side === SIDE.RED) return RED_COL_CHARS[col];
    return BLACK_COL_CHARS[col];
  }

  function numChar(n, side) {
    if (side === SIDE.RED) return CN_NUMBERS[n];
    return String(n);
  }

  // Is this piece type a "linear" mover (distance = row diff for 進/退)?
  function isLinear(type) {
    return type === TYPE.CHARIOT || type === TYPE.CANNON || type === TYPE.SOLDIER || type === TYPE.GENERAL;
  }

  // Find disambiguation prefix for pieces of same type on same column
  function getDisambiguation(board, move) {
    var piece = move.piece;
    var fromR = move.from[0], fromC = move.from[1];

    // Find all same-type same-side pieces
    var sameTypePieces = [];
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (p && p.type === piece.type && p.side === piece.side) {
          sameTypePieces.push([r, c]);
        }
      }
    }

    // Find pieces on the same column
    var sameCol = sameTypePieces.filter(function (pos) { return pos[1] === fromC; });
    if (sameCol.length <= 1) return null; // no disambiguation needed

    // Sort by row: for Red, smaller row = further from Red (front toward enemy)
    // For Black, larger row = further from Black (front toward enemy)
    if (piece.side === SIDE.RED) {
      sameCol.sort(function (a, b) { return a[0] - b[0]; }); // front (smaller row) first
    } else {
      sameCol.sort(function (a, b) { return b[0] - a[0]; }); // front (larger row) first
    }

    if (sameCol.length === 2) {
      // Use 前/後
      var idx = -1;
      for (var i = 0; i < sameCol.length; i++) {
        if (sameCol[i][0] === fromR && sameCol[i][1] === fromC) { idx = i; break; }
      }
      return idx === 0 ? '前' : '後';
    }

    // 3+ pieces (soldiers): number them 一~五
    if (piece.type === TYPE.SOLDIER) {
      // Need to consider soldiers across multiple columns
      // Find all columns with multiple soldiers
      var allSoldiers = [];
      for (var r2 = 0; r2 < 10; r2++) {
        for (var c2 = 0; c2 < 9; c2++) {
          var p2 = board[r2][c2];
          if (p2 && p2.type === TYPE.SOLDIER && p2.side === piece.side) {
            allSoldiers.push([r2, c2]);
          }
        }
      }

      // Group by column
      var colGroups = {};
      allSoldiers.forEach(function (pos) {
        if (!colGroups[pos[1]]) colGroups[pos[1]] = [];
        colGroups[pos[1]].push(pos);
      });

      // Columns with 2+ soldiers
      var multiCols = Object.keys(colGroups).filter(function (c) { return colGroups[c].length >= 2; });
      var totalMulti = 0;
      multiCols.forEach(function (c) { totalMulti += colGroups[c].length; });

      if (totalMulti >= 3) {
        // Number all soldiers on multi-columns from front to back
        var allMultiSoldiers = [];
        multiCols.forEach(function (c) {
          colGroups[c].forEach(function (pos) {
            allMultiSoldiers.push(pos);
          });
        });

        if (piece.side === SIDE.RED) {
          allMultiSoldiers.sort(function (a, b) {
            return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1];
          });
        } else {
          allMultiSoldiers.sort(function (a, b) {
            return a[0] !== b[0] ? b[0] - a[0] : b[1] - a[1];
          });
        }

        for (var k = 0; k < allMultiSoldiers.length; k++) {
          if (allMultiSoldiers[k][0] === fromR && allMultiSoldiers[k][1] === fromC) {
            return CN_NUMBERS[k + 1]; // 一, 二, 三...
          }
        }
      }

      // Fallback for 2 on same col
      var idx2 = -1;
      for (var i2 = 0; i2 < sameCol.length; i2++) {
        if (sameCol[i2][0] === fromR && sameCol[i2][1] === fromC) { idx2 = i2; break; }
      }
      return idx2 === 0 ? '前' : '後';
    }

    // Fallback for other piece types with 3+ on same column (very rare)
    var idx3 = -1;
    for (var i3 = 0; i3 < sameCol.length; i3++) {
      if (sameCol[i3][0] === fromR && sameCol[i3][1] === fromC) { idx3 = i3; break; }
    }
    return idx3 === 0 ? '前' : '後';
  }

  // Generate notation string for a move
  function moveToNotation(board, move) {
    var piece = move.piece;
    var side = piece.side;
    var fromR = move.from[0], fromC = move.from[1];
    var toR = move.to[0], toC = move.to[1];

    var pChar = pieceChar(piece.type, side);
    var disambig = getDisambiguation(board, move);

    // Part 1: piece + origin column (or disambiguation prefix)
    var part1;
    if (disambig) {
      part1 = disambig + pChar;
    } else {
      part1 = pChar + colChar(fromC, side);
    }

    // Part 2: action + destination
    var action, dest;

    if (fromR === toR) {
      // Lateral move
      action = '平';
      dest = colChar(toC, side);
    } else {
      // Determine direction
      var advancing;
      if (side === SIDE.RED) {
        advancing = toR < fromR; // Red advances upward (decreasing row)
      } else {
        advancing = toR > fromR; // Black advances downward (increasing row)
      }
      action = advancing ? '進' : '退';

      if (isLinear(piece.type)) {
        // Distance = number of rows moved
        dest = numChar(Math.abs(toR - fromR), side);
      } else {
        // Diagonal pieces: destination column
        dest = colChar(toC, side);
      }
    }

    return part1 + action + dest;
  }

  // --- Export ---
  window.ChineseChess.Notation = {
    moveToNotation: moveToNotation,
    RED_COL_CHARS: RED_COL_CHARS,
    BLACK_COL_CHARS: BLACK_COL_CHARS,
    CN_NUMBERS: CN_NUMBERS
  };
})();
