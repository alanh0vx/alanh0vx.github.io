// ============================================================
// ai.js — AI engine: evaluation, alpha-beta search, difficulty
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var Rules = window.ChineseChess.Rules;
  var SIDE = G.SIDE;
  var TYPE = G.TYPE;

  // --- Material values ---
  var PIECE_VALUE = {};
  PIECE_VALUE[TYPE.GENERAL] = 10000;
  PIECE_VALUE[TYPE.CHARIOT] = 900;
  PIECE_VALUE[TYPE.CANNON] = 450;
  PIECE_VALUE[TYPE.HORSE] = 400;
  PIECE_VALUE[TYPE.ADVISOR] = 200;
  PIECE_VALUE[TYPE.ELEPHANT] = 200;
  PIECE_VALUE[TYPE.SOLDIER] = 100;

  // --- Piece-square tables (10 rows x 9 cols, from Red's perspective) ---
  // Positive = good for the piece owner. Indexed [row][col] for Red; flipped for Black.

  var PST = {};

  PST[TYPE.GENERAL] = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,1,5,1,0,0,0],
    [0,0,0,5,8,5,0,0,0],
    [0,0,0,5,10,5,0,0,0]
  ];

  PST[TYPE.ADVISOR] = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,20,0,20,0,0,0],
    [0,0,0,0,25,0,0,0,0],
    [0,0,0,20,0,20,0,0,0]
  ];

  PST[TYPE.ELEPHANT] = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,20,0,0,0,20,0,0],
    [0,0,0,0,0,0,0,0,0],
    [18,0,0,0,25,0,0,0,18],
    [0,0,0,0,0,0,0,0,0],
    [0,0,20,0,0,0,20,0,0]
  ];

  PST[TYPE.CHARIOT] = [
    [14,14,12,18,16,18,12,14,14],
    [16,20,18,24,26,24,18,20,16],
    [12,12,12,18,18,18,12,12,12],
    [12,18,16,22,22,22,16,18,12],
    [12,14,12,18,18,18,12,14,12],
    [12,16,14,20,20,20,14,16,12],
    [6,10,8,14,14,14,8,10,6],
    [4,8,6,14,12,14,6,8,4],
    [8,4,8,16,8,16,8,4,8],
    [-2,10,6,14,12,14,6,10,-2]
  ];

  PST[TYPE.HORSE] = [
    [4,8,16,12,4,12,16,8,4],
    [4,10,28,16,8,16,28,10,4],
    [12,14,16,20,18,20,16,14,12],
    [8,24,18,24,20,24,18,24,8],
    [6,16,14,18,16,18,14,16,6],
    [4,12,16,14,12,14,16,12,4],
    [2,12,8,8,4,8,8,12,2],
    [4,2,8,8,4,8,8,2,4],
    [0,2,4,4,-2,4,4,2,0],
    [0,-4,0,0,0,0,0,-4,0]
  ];

  PST[TYPE.CANNON] = [
    [6,4,0,-10,-12,-10,0,4,6],
    [2,2,0,-4,-14,-4,0,2,2],
    [2,2,0,-10,-8,-10,0,2,2],
    [0,0,-2,4,10,4,-2,0,0],
    [0,0,0,2,8,2,0,0,0],
    [-2,0,4,2,6,2,4,0,-2],
    [0,0,0,2,4,2,0,0,0],
    [4,0,8,6,10,6,8,0,4],
    [0,2,4,6,6,6,4,2,0],
    [0,0,2,6,6,6,2,0,0]
  ];

  PST[TYPE.SOLDIER] = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [40,50,60,70,70,70,60,50,40],
    [30,40,50,60,60,60,50,40,30],
    [10,20,30,40,40,40,30,20,10],
    [8,0,10,0,8,0,10,0,8],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0]
  ];

  // --- Advanced Evaluation Helpers ---

  // Count pieces for a side
  function countPieces(board, side) {
    var counts = {};
    counts[TYPE.CHARIOT] = 0;
    counts[TYPE.HORSE] = 0;
    counts[TYPE.CANNON] = 0;
    counts[TYPE.ADVISOR] = 0;
    counts[TYPE.ELEPHANT] = 0;
    counts[TYPE.SOLDIER] = 0;
    counts[TYPE.GENERAL] = 0;
    var total = 0;
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (p && p.side === side) {
          counts[p.type]++;
          total++;
        }
      }
    }
    counts._total = total;
    return counts;
  }

  // King safety: bonus for having advisors and elephants protecting the general
  function kingSafety(board, side) {
    var score = 0;
    var genPos = null;
    var rStart = (side === SIDE.RED) ? 7 : 0;
    var rEnd = (side === SIDE.RED) ? 9 : 2;

    // Find general
    for (var r = rStart; r <= rEnd; r++) {
      for (var c = 3; c <= 5; c++) {
        var p = board[r][c];
        if (p && p.type === TYPE.GENERAL && p.side === side) {
          genPos = [r, c];
          break;
        }
      }
      if (genPos) break;
    }
    if (!genPos) return -500; // general missing is catastrophic

    // Count advisors and elephants
    var advisors = 0;
    var elephants = 0;
    for (var r2 = rStart; r2 <= rEnd; r2++) {
      for (var c2 = 0; c2 < 9; c2++) {
        var p2 = board[r2][c2];
        if (p2 && p2.side === side) {
          if (p2.type === TYPE.ADVISOR) advisors++;
          if (p2.type === TYPE.ELEPHANT) elephants++;
        }
      }
    }
    // Also check elephant positions outside palace but on own side
    if (side === SIDE.RED) {
      for (var r3 = 5; r3 <= 6; r3++) {
        for (var c3 = 0; c3 < 9; c3++) {
          var p3 = board[r3][c3];
          if (p3 && p3.side === side && p3.type === TYPE.ELEPHANT) elephants++;
        }
      }
    } else {
      for (var r4 = 3; r4 <= 4; r4++) {
        for (var c4 = 0; c4 < 9; c4++) {
          var p4 = board[r4][c4];
          if (p4 && p4.side === side && p4.type === TYPE.ELEPHANT) elephants++;
        }
      }
    }

    // Bonus for defensive formation
    score += advisors * 15;
    score += elephants * 10;

    // Full defense formation bonus (2 advisors + 2 elephants)
    if (advisors === 2 && elephants === 2) score += 30;

    // Penalty for general on center file exposed (no pieces blocking)
    if (genPos[1] === 4) {
      // Check if there's a direct file exposure to enemy general (flying general vulnerability)
      var oppSide = (side === SIDE.RED) ? SIDE.BLACK : SIDE.RED;
      var dir = (side === SIDE.RED) ? -1 : 1;
      var blocked = false;
      for (var checkR = genPos[0] + dir; checkR >= 0 && checkR <= 9; checkR += dir) {
        var cp = board[checkR][4];
        if (cp) {
          if (cp.type === TYPE.GENERAL && cp.side === oppSide) {
            // Direct file to enemy general with no blocks = very dangerous
            score -= 40;
          }
          blocked = true;
          break;
        }
      }
    }

    // Penalty if general is off-center without good reason
    var backRow = (side === SIDE.RED) ? 9 : 0;
    if (genPos[0] !== backRow) score -= 5;

    return score;
  }

  // Chariot mobility: count open lines
  function chariotMobility(board, r, c) {
    var moves = 0;
    var dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var d = 0; d < 4; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
        if (board[nr][nc]) {
          moves++; // can capture
          break;
        }
        moves++;
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  // Cannon threats: bonus when there's a screen piece available
  function cannonActivity(board, r, c, side) {
    var score = 0;
    var dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var d = 0; d < 4; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var nr = r + dr, nc = c + dc;
      var screenFound = false;
      while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
        var p = board[nr][nc];
        if (p) {
          if (!screenFound) {
            screenFound = true;
          } else {
            // Found a target behind screen
            if (p.side !== side) {
              score += 8; // threatening an enemy piece
              if (p.type === TYPE.GENERAL) score += 30; // threatening general!
            }
            break;
          }
        }
        nr += dr;
        nc += dc;
      }
    }
    return score;
  }

  // Horse blocking penalty: check if horse legs are blocked
  function horseBlocking(board, r, c) {
    var penalty = 0;
    // The 4 orthogonal directions for horse leg
    var legs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var i = 0; i < legs.length; i++) {
      var lr = r + legs[i][0], lc = c + legs[i][1];
      if (lr >= 0 && lr <= 9 && lc >= 0 && lc <= 8 && board[lr][lc]) {
        penalty += 6; // leg blocked
      }
    }
    return penalty;
  }

  // Detect connected chariots (same rank/file with nothing between)
  function connectedChariots(board, side) {
    var chariots = [];
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (p && p.type === TYPE.CHARIOT && p.side === side) {
          chariots.push([r, c]);
        }
      }
    }
    if (chariots.length < 2) return 0;

    var a = chariots[0], b = chariots[1];
    // Same file
    if (a[1] === b[1]) {
      var minR = Math.min(a[0], b[0]);
      var maxR = Math.max(a[0], b[0]);
      var clear = true;
      for (var r2 = minR + 1; r2 < maxR; r2++) {
        if (board[r2][a[1]]) { clear = false; break; }
      }
      if (clear) return 30;
    }
    // Same rank
    if (a[0] === b[0]) {
      var minC = Math.min(a[1], b[1]);
      var maxC = Math.max(a[1], b[1]);
      var clear2 = true;
      for (var c2 = minC + 1; c2 < maxC; c2++) {
        if (board[a[0]][c2]) { clear2 = false; break; }
      }
      if (clear2) return 30;
    }
    return 0;
  }

  // Central control: bonus for pieces controlling the center files (3,4,5)
  function centralControl(board, side) {
    var score = 0;
    for (var r = 0; r < 10; r++) {
      for (var c = 3; c <= 5; c++) {
        var p = board[r][c];
        if (p && p.side === side) {
          if (p.type === TYPE.CHARIOT) score += 5;
          else if (p.type === TYPE.CANNON) score += 3;
          else if (p.type === TYPE.HORSE) score += 3;
        }
      }
    }
    return score;
  }

  // --- Evaluation ---

  function evaluate(board, side) {
    var score = 0;
    var oppSide = (side === SIDE.RED) ? SIDE.BLACK : SIDE.RED;

    // Material + PST
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var p = board[r][c];
        if (!p) continue;

        var val = PIECE_VALUE[p.type];
        var pst = PST[p.type];
        var posBonus = 0;

        if (pst) {
          if (p.side === SIDE.RED) {
            posBonus = pst[r][c];
          } else {
            // Mirror: Black's row 0 = Red's row 9, etc.
            posBonus = pst[9 - r][8 - c];
          }
        }

        // Soldier value boost after crossing river
        if (p.type === TYPE.SOLDIER) {
          var crossed = (p.side === SIDE.RED) ? (r <= 4) : (r >= 5);
          if (crossed) val = 200;
        }

        var total = val + posBonus;

        // Piece-specific activity bonuses
        if (p.type === TYPE.CHARIOT) {
          total += chariotMobility(board, r, c) * 2;
        } else if (p.type === TYPE.CANNON) {
          total += cannonActivity(board, r, c, p.side);
        } else if (p.type === TYPE.HORSE) {
          total -= horseBlocking(board, r, c);
        }

        if (p.side === side) {
          score += total;
        } else {
          score -= total;
        }
      }
    }

    // King safety
    score += kingSafety(board, side);
    score -= kingSafety(board, oppSide);

    // Connected chariots
    score += connectedChariots(board, side);
    score -= connectedChariots(board, oppSide);

    // Central control
    score += centralControl(board, side);
    score -= centralControl(board, oppSide);

    // Piece count for endgame detection
    var myCounts = countPieces(board, side);
    var oppCounts = countPieces(board, oppSide);
    var totalPieces = myCounts._total + oppCounts._total;

    // Endgame adjustments (fewer than 10 major pieces)
    if (totalPieces <= 12) {
      // Chariot becomes even more valuable in endgame
      score += myCounts[TYPE.CHARIOT] * 40;
      score -= oppCounts[TYPE.CHARIOT] * 40;

      // Crossed soldiers are very strong in endgame
      for (var r2 = 0; r2 < 10; r2++) {
        for (var c2 = 0; c2 < 9; c2++) {
          var p2 = board[r2][c2];
          if (!p2 || p2.type !== TYPE.SOLDIER) continue;
          var crossed2 = (p2.side === SIDE.RED) ? (r2 <= 4) : (r2 >= 5);
          if (crossed2) {
            var bonus = 30;
            // Deeper penetration = better
            if (p2.side === SIDE.RED) bonus += (4 - r2) * 10;
            else bonus += (r2 - 5) * 10;
            if (p2.side === side) score += bonus;
            else score -= bonus;
          }
        }
      }
    }

    return score;
  }

  // --- Move ordering for better alpha-beta cutoffs ---

  function scoreMove(move, board) {
    var s = 0;
    if (move.captured) {
      // MVV-LVA: value of victim - value of attacker
      s += PIECE_VALUE[move.captured.type] * 10 - PIECE_VALUE[move.piece.type];
    }

    // Bonus for moves toward the center
    var toC = move.to[1];
    if (toC >= 3 && toC <= 5) s += 5;

    // Bonus for advancing pieces toward enemy territory
    if (move.piece.type === TYPE.CHARIOT || move.piece.type === TYPE.CANNON) {
      if (move.piece.side === SIDE.RED && move.to[0] < move.from[0]) s += 3;
      if (move.piece.side === SIDE.BLACK && move.to[0] > move.from[0]) s += 3;
    }

    return s;
  }

  function orderMoves(moves, killerMoves, board) {
    // Score and sort
    for (var i = 0; i < moves.length; i++) {
      moves[i]._score = scoreMove(moves[i], board);
      // Killer move bonus
      if (killerMoves) {
        for (var k = 0; k < killerMoves.length; k++) {
          if (killerMoves[k] &&
              killerMoves[k].from[0] === moves[i].from[0] &&
              killerMoves[k].from[1] === moves[i].from[1] &&
              killerMoves[k].to[0] === moves[i].to[0] &&
              killerMoves[k].to[1] === moves[i].to[1]) {
            moves[i]._score += 5000;
          }
        }
      }
    }
    moves.sort(function (a, b) { return b._score - a._score; });
    return moves;
  }

  // --- History heuristic ---
  var historyTable = {}; // historyTable["r,c->r,c"] = score

  function historyKey(move) {
    return move.from[0] + ',' + move.from[1] + '->' + move.to[0] + ',' + move.to[1];
  }

  function updateHistory(move, depth) {
    var key = historyKey(move);
    historyTable[key] = (historyTable[key] || 0) + depth * depth;
  }

  // --- Transposition table ---

  var TT_SIZE = 1 << 20; // ~1M entries
  var TT_MASK = TT_SIZE - 1;
  var TT_EXACT = 0, TT_LOWER = 1, TT_UPPER = 2;
  var ttable = null;

  function clearTT() {
    ttable = new Array(TT_SIZE);
  }

  function ttLookup(hash, depth, alpha, beta) {
    if (!ttable) return null;
    var entry = ttable[hash & TT_MASK];
    if (!entry || entry.hash !== hash || entry.depth < depth) return null;

    if (entry.flag === TT_EXACT) return { score: entry.score, bestMove: entry.bestMove };
    if (entry.flag === TT_LOWER && entry.score >= beta) return { score: entry.score, bestMove: entry.bestMove };
    if (entry.flag === TT_UPPER && entry.score <= alpha) return { score: entry.score, bestMove: entry.bestMove };
    return null;
  }

  function ttStore(hash, depth, score, flag, bestMove) {
    if (!ttable) return;
    var idx = hash & TT_MASK;
    var existing = ttable[idx];
    if (!existing || existing.depth <= depth) {
      ttable[idx] = { hash: hash, depth: depth, score: score, flag: flag, bestMove: bestMove || null };
    }
  }

  // --- Null Move Pruning ---
  var NULL_MOVE_REDUCTION = 2;

  // --- Alpha-Beta Search ---

  var nodesSearched = 0;
  var killerTable = []; // killerTable[depth] = [move1, move2]
  var searchAborted = false;
  var searchDeadline = 0;

  function quiescence(board, side, alpha, beta, depth) {
    nodesSearched++;

    if (depth <= -8) return evaluate(board, side); // max quiescence depth

    var standPat = evaluate(board, side);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    // Delta pruning: if we can't possibly raise alpha even with best capture, skip
    var DELTA = 1000; // slightly above chariot value
    if (standPat + DELTA < alpha) return alpha;

    // Generate only capture moves
    var moves = Rules.generateLegalMoves(board, side);
    var captures = [];
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].captured) captures.push(moves[i]);
    }

    orderMoves(captures, null, board);

    for (var j = 0; j < captures.length; j++) {
      var move = captures[j];

      // SEE-like pruning: skip captures of higher-value pieces by lower-value ones
      // that are likely to lose material (simple version)
      if (standPat + PIECE_VALUE[move.captured.type] + 200 < alpha) continue;

      var newBoard = G.cloneBoard(board);
      newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
      newBoard[move.from[0]][move.from[1]] = null;

      var score = -quiescence(newBoard, G.oppositeSide(side), -beta, -alpha, depth - 1);

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  function alphaBeta(board, side, depth, alpha, beta, isRoot, doNull) {
    nodesSearched++;

    // Time check every 4096 nodes
    if ((nodesSearched & 4095) === 0 && Date.now() > searchDeadline) {
      searchAborted = true;
      return 0;
    }

    // Terminal conditions
    var hash = G.computeZobristHash(board, side);

    // TT lookup
    var ttResult = ttLookup(hash, depth, alpha, beta);
    if (ttResult !== null && !isRoot) return ttResult.score;

    if (depth <= 0) {
      return quiescence(board, side, alpha, beta, 0);
    }

    var inCheck = Rules.isInCheck(board, side);

    // Check extension: search one ply deeper when in check
    if (inCheck) depth++;

    // Null move pruning: if we can pass and still have a good position, prune
    if (doNull && !inCheck && depth >= 3 && !isRoot) {
      var nullScore = -alphaBeta(board, G.oppositeSide(side), depth - 1 - NULL_MOVE_REDUCTION, -beta, -beta + 1, false, false);
      if (nullScore >= beta) return beta;
    }

    var moves = Rules.generateLegalMoves(board, side);

    // No legal moves
    if (moves.length === 0) {
      if (inCheck) {
        return -10000 + (100 - depth); // checkmate (prefer quicker mate)
      }
      return -10000 + (100 - depth); // stalemate is also a loss in Chinese Chess
    }

    // Move ordering: TT best move first, then captures, then killers, then history
    var killers = killerTable[depth] || null;
    orderMoves(moves, killers, board);

    // Put TT best move first if available
    if (ttResult && ttResult.bestMove) {
      for (var m = 0; m < moves.length; m++) {
        if (moves[m].from[0] === ttResult.bestMove.from[0] &&
            moves[m].from[1] === ttResult.bestMove.from[1] &&
            moves[m].to[0] === ttResult.bestMove.to[0] &&
            moves[m].to[1] === ttResult.bestMove.to[1]) {
          var ttMove = moves.splice(m, 1)[0];
          ttMove._score = 100000;
          moves.unshift(ttMove);
          break;
        }
      }
    }

    // Add history heuristic scores
    for (var h = 0; h < moves.length; h++) {
      var hk = historyKey(moves[h]);
      if (historyTable[hk]) {
        moves[h]._score += historyTable[hk];
      }
    }
    // Re-sort with history included
    moves.sort(function (a, b) { return b._score - a._score; });

    var bestMove = null;
    var bestScore = -Infinity;
    var flag = TT_UPPER;

    for (var i = 0; i < moves.length; i++) {
      if (searchAborted) return 0;

      var move = moves[i];
      var newBoard = G.cloneBoard(board);
      newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
      newBoard[move.from[0]][move.from[1]] = null;

      var score;

      // Late move reduction: reduce depth for non-capture, non-killer moves late in the list
      if (i >= 4 && depth >= 3 && !move.captured && !inCheck) {
        // Search with reduced depth first
        score = -alphaBeta(newBoard, G.oppositeSide(side), depth - 2, -alpha - 1, -alpha, false, true);
        // If it looks promising, re-search at full depth
        if (score > alpha) {
          score = -alphaBeta(newBoard, G.oppositeSide(side), depth - 1, -beta, -alpha, false, true);
        }
      } else {
        score = -alphaBeta(newBoard, G.oppositeSide(side), depth - 1, -beta, -alpha, false, true);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      if (score > alpha) {
        alpha = score;
        flag = TT_EXACT;
      }

      if (alpha >= beta) {
        // Killer move
        if (!move.captured) {
          if (!killerTable[depth]) killerTable[depth] = [];
          killerTable[depth].unshift(move);
          if (killerTable[depth].length > 2) killerTable[depth].pop();
          // Update history heuristic
          updateHistory(move, depth);
        }
        flag = TT_LOWER;
        break;
      }
    }

    ttStore(hash, depth, bestScore, flag, bestMove);

    if (isRoot) return bestMove;
    return bestScore;
  }

  // --- Iterative deepening with aspiration windows ---

  function search(board, side, maxDepth, timeLimitMs) {
    G.initZobrist();
    clearTT();
    killerTable = [];
    historyTable = {};
    nodesSearched = 0;
    searchAborted = false;
    searchDeadline = Date.now() + timeLimitMs;

    var bestMove = null;
    var prevScore = 0;

    for (var depth = 1; depth <= maxDepth; depth++) {
      searchAborted = false;
      var result;

      // Use aspiration window for depths > 3
      if (depth > 3 && bestMove) {
        var windowSize = 50;
        result = alphaBeta(board, side, depth, prevScore - windowSize, prevScore + windowSize, true, true);

        // If result fell outside the window, re-search with full window
        if (searchAborted) {
          if (bestMove) break;
        } else if (!result) {
          result = alphaBeta(board, side, depth, -Infinity, Infinity, true, true);
        }
      } else {
        result = alphaBeta(board, side, depth, -Infinity, Infinity, true, true);
      }

      if (searchAborted && bestMove) break; // keep previous best
      if (result) {
        bestMove = result;
        if (bestMove._score !== undefined) prevScore = bestMove._score;
      }

      // If we found a checkmate, no need to search deeper
      if (bestMove && bestMove._score && bestMove._score > 9000) break;
    }

    return bestMove;
  }

  // --- Difficulty presets ---
  // Easy: raised from depth 3 to 4, reduced randomization from 30% to 10%
  // Medium: raised from depth 5 to 6, increased time
  // Hard: raised from depth 8 to 10, more time for deeper search

  var DIFFICULTY = {
    easy: { maxDepth: 4, timeLimit: 2000, randomize: true, randomChance: 0.10 },
    medium: { maxDepth: 6, timeLimit: 4000, randomize: false },
    hard: { maxDepth: 10, timeLimit: 8000, randomize: false }
  };

  function getBestMove(board, side, difficulty) {
    var preset = DIFFICULTY[difficulty] || DIFFICULTY.medium;

    var move = search(board, side, preset.maxDepth, preset.timeLimit);

    // For easy difficulty, occasionally pick a slightly suboptimal move
    if (preset.randomize && Math.random() < (preset.randomChance || 0.1)) {
      var moves = Rules.generateLegalMoves(board, side);
      if (moves.length > 2) {
        // Pick from top 2 (not random top 3 — keeps it competitive)
        orderMoves(moves, null, board);
        var pool = moves.slice(0, 2);
        move = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    return move;
  }

  // Get hint (best move for the given side)
  function getHint(board, side) {
    return search(board, side, 5, 3000);
  }

  // --- Export ---
  window.ChineseChess.AI = {
    evaluate: evaluate,
    search: search,
    getBestMove: getBestMove,
    getHint: getHint,
    DIFFICULTY: DIFFICULTY
  };
})();
