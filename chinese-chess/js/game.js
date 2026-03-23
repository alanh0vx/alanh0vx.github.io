// ============================================================
// game.js — Game state management, board representation, FEN
// ============================================================
(function () {
  'use strict';

  // --- Constants ---
  const SIDE = { RED: 'red', BLACK: 'black' };
  const TYPE = {
    GENERAL: 'general',
    ADVISOR: 'advisor',
    ELEPHANT: 'elephant',
    CHARIOT: 'chariot',
    HORSE: 'horse',
    CANNON: 'cannon',
    SOLDIER: 'soldier'
  };

  // FEN piece mapping
  const FEN_TO_PIECE = {
    'K': { type: TYPE.GENERAL, side: SIDE.RED },
    'A': { type: TYPE.ADVISOR, side: SIDE.RED },
    'B': { type: TYPE.ELEPHANT, side: SIDE.RED },
    'R': { type: TYPE.CHARIOT, side: SIDE.RED },
    'N': { type: TYPE.HORSE, side: SIDE.RED },
    'C': { type: TYPE.CANNON, side: SIDE.RED },
    'P': { type: TYPE.SOLDIER, side: SIDE.RED },
    'k': { type: TYPE.GENERAL, side: SIDE.BLACK },
    'a': { type: TYPE.ADVISOR, side: SIDE.BLACK },
    'b': { type: TYPE.ELEPHANT, side: SIDE.BLACK },
    'r': { type: TYPE.CHARIOT, side: SIDE.BLACK },
    'n': { type: TYPE.HORSE, side: SIDE.BLACK },
    'c': { type: TYPE.CANNON, side: SIDE.BLACK },
    'p': { type: TYPE.SOLDIER, side: SIDE.BLACK }
  };

  const PIECE_TO_FEN = {};
  Object.keys(FEN_TO_PIECE).forEach(function (k) {
    var p = FEN_TO_PIECE[k];
    PIECE_TO_FEN[p.side + '_' + p.type] = k;
  });

  // Chinese characters for pieces
  const PIECE_CHAR = {
    red_general: '帥', black_general: '將',
    red_advisor: '仕', black_advisor: '士',
    red_elephant: '相', black_elephant: '象',
    red_chariot: '車', black_chariot: '車',
    red_horse: '馬', black_horse: '馬',
    red_cannon: '炮', black_cannon: '砲',
    red_soldier: '兵', black_soldier: '卒'
  };

  const STARTING_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w';

  const STATUS = {
    PLAYING: 'playing',
    CHECK: 'check',
    CHECKMATE: 'checkmate',
    STALEMATE: 'stalemate',
    DRAW: 'draw',
    RESIGNED: 'resigned'
  };

  // --- Board helpers ---

  // Board is [row][col], row 0 = top (black side), row 9 = bottom (red side)
  // col 0 = left, col 8 = right

  function createEmptyBoard() {
    var board = [];
    for (var r = 0; r < 10; r++) {
      board[r] = [];
      for (var c = 0; c < 9; c++) {
        board[r][c] = null;
      }
    }
    return board;
  }

  function cloneBoard(board) {
    var b = [];
    for (var r = 0; r < 10; r++) {
      b[r] = [];
      for (var c = 0; c < 9; c++) {
        b[r][c] = board[r][c];
      }
    }
    return b;
  }

  function parseFEN(fen) {
    var parts = fen.trim().split(/\s+/);
    var rows = parts[0].split('/');
    var board = createEmptyBoard();

    for (var r = 0; r < 10; r++) {
      var col = 0;
      for (var i = 0; i < rows[r].length; i++) {
        var ch = rows[r][i];
        if (ch >= '1' && ch <= '9') {
          col += parseInt(ch, 10);
        } else {
          var piece = FEN_TO_PIECE[ch];
          if (piece) {
            board[r][col] = { type: piece.type, side: piece.side };
          }
          col++;
        }
      }
    }

    var turn = (parts[1] === 'b') ? SIDE.BLACK : SIDE.RED;
    return { board: board, turn: turn };
  }

  function toFEN(board, turn) {
    var rows = [];
    for (var r = 0; r < 10; r++) {
      var row = '';
      var empty = 0;
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) { row += empty; empty = 0; }
          row += PIECE_TO_FEN[p.side + '_' + p.type];
        }
      }
      if (empty > 0) row += empty;
      rows.push(row);
    }
    return rows.join('/') + ' ' + (turn === SIDE.BLACK ? 'b' : 'w');
  }

  function getPieceChar(piece) {
    return PIECE_CHAR[piece.side + '_' + piece.type] || '?';
  }

  function oppositeSide(side) {
    return side === SIDE.RED ? SIDE.BLACK : SIDE.RED;
  }

  // --- Game state ---

  function createGameState(options) {
    options = options || {};
    var fen = options.fen || STARTING_FEN;
    var parsed = parseFEN(fen);

    return {
      board: parsed.board,
      turn: parsed.turn,
      status: STATUS.PLAYING,
      moveHistory: [],        // array of move objects
      boardHistory: [toFEN(parsed.board, parsed.turn)], // FEN at each position
      humanSide: options.humanSide || SIDE.RED,
      difficulty: options.difficulty || 'medium',
      allowUndo: options.allowUndo !== undefined ? options.allowUndo : true,
      allowHint: options.allowHint !== undefined ? options.allowHint : true,
      undoRemaining: options.allowUndo !== false ? 3 : 0,
      hintRemaining: options.allowHint !== false ? 3 : 0,
      capturedPieces: { red: [], black: [] },
      initialFEN: fen
    };
  }

  // Apply a move to the game state (mutates state)
  function applyMove(state, move) {
    var board = state.board;
    var captured = board[move.to[0]][move.to[1]];

    if (captured) {
      move.captured = { type: captured.type, side: captured.side };
      state.capturedPieces[captured.side].push(captured);
    }

    board[move.to[0]][move.to[1]] = board[move.from[0]][move.from[1]];
    board[move.from[0]][move.from[1]] = null;

    state.moveHistory.push(move);
    state.turn = oppositeSide(state.turn);
    state.boardHistory.push(toFEN(state.board, state.turn));

    return move;
  }

  // Undo the last move
  function undoLastMove(state) {
    if (state.moveHistory.length === 0) return null;
    var move = state.moveHistory.pop();
    state.boardHistory.pop();

    // Restore piece to original position
    state.board[move.from[0]][move.from[1]] = state.board[move.to[0]][move.to[1]];

    // Restore captured piece or clear destination
    if (move.captured) {
      state.board[move.to[0]][move.to[1]] = { type: move.captured.type, side: move.captured.side };
      var capArr = state.capturedPieces[move.captured.side];
      capArr.pop();
    } else {
      state.board[move.to[0]][move.to[1]] = null;
    }

    state.turn = oppositeSide(state.turn);
    return move;
  }

  // --- Zobrist hashing ---
  var zobristTable = null;
  var zobristTurnKey = 0;

  function initZobrist() {
    if (zobristTable) return;
    zobristTable = [];
    for (var r = 0; r < 10; r++) {
      zobristTable[r] = [];
      for (var c = 0; c < 9; c++) {
        zobristTable[r][c] = {};
        var sides = [SIDE.RED, SIDE.BLACK];
        var types = Object.keys(TYPE).map(function (k) { return TYPE[k]; });
        for (var si = 0; si < sides.length; si++) {
          for (var ti = 0; ti < types.length; ti++) {
            var key = sides[si] + '_' + types[ti];
            zobristTable[r][c][key] = (Math.random() * 0xFFFFFFFF) >>> 0;
          }
        }
      }
    }
    zobristTurnKey = (Math.random() * 0xFFFFFFFF) >>> 0;
  }

  function computeZobristHash(board, turn) {
    initZobrist();
    var hash = 0;
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (p) {
          hash ^= zobristTable[r][c][p.side + '_' + p.type];
        }
      }
    }
    if (turn === SIDE.BLACK) hash ^= zobristTurnKey;
    return hash;
  }

  // --- Export ---
  window.ChineseChess = window.ChineseChess || {};
  window.ChineseChess.Game = {
    SIDE: SIDE,
    TYPE: TYPE,
    STATUS: STATUS,
    STARTING_FEN: STARTING_FEN,
    PIECE_CHAR: PIECE_CHAR,
    FEN_TO_PIECE: FEN_TO_PIECE,
    PIECE_TO_FEN: PIECE_TO_FEN,
    createEmptyBoard: createEmptyBoard,
    cloneBoard: cloneBoard,
    parseFEN: parseFEN,
    toFEN: toFEN,
    getPieceChar: getPieceChar,
    oppositeSide: oppositeSide,
    createGameState: createGameState,
    applyMove: applyMove,
    undoLastMove: undoLastMove,
    initZobrist: initZobrist,
    computeZobristHash: computeZobristHash
  };
})();
