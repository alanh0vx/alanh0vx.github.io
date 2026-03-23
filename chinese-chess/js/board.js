// ============================================================
// board.js — Canvas-based board rendering and interaction
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var SIDE = G.SIDE;

  // --- Drawing constants ---
  var BOARD_PADDING = 40;
  var LABEL_MARGIN = 22;
  var GRID_COLS = 9;
  var GRID_ROWS = 10;

  var cellSize = 56; // will be recalculated
  var boardX = 0;    // top-left of grid
  var boardY = 0;
  var canvas, ctx;
  var currentBoard = null;
  var selectedPos = null;
  var legalTargets = [];
  var lastMove = null;
  var animating = false;
  var animPiece = null;
  var animFrom = null;
  var animTo = null;
  var animProgress = 0;
  var onMoveCallback = null;
  var flipBoard = false;

  // Colors
  var COLORS = {
    boardBg: '#f0d9a0',
    gridLine: '#4a3728',
    river: '#f0d9a0',
    riverText: '#4a3728',
    pieceRedBg: '#ffeedd',
    pieceRedBorder: '#cc0000',
    pieceRedText: '#cc0000',
    pieceBlackBg: '#ffeedd',
    pieceBlackBorder: '#222222',
    pieceBlackText: '#222222',
    selected: 'rgba(255, 200, 0, 0.5)',
    legalDot: 'rgba(0, 180, 0, 0.5)',
    lastMove: 'rgba(100, 180, 255, 0.35)',
    checkGlow: 'rgba(255, 0, 0, 0.6)',
    palaceLine: '#4a3728'
  };

  // Column labels
  var RED_LABELS = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
  var BLACK_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  function init(canvasEl, moveCallback) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    onMoveCallback = moveCallback;

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });

    resize();
  }

  function setFlip(flip) {
    flipBoard = flip;
  }

  function resize() {
    var container = canvas.parentElement;
    var maxW = container.clientWidth;
    var maxH = container.clientHeight || window.innerHeight * 0.75;

    // Calculate cell size to fit
    var availW = maxW - BOARD_PADDING * 2;
    var availH = maxH - BOARD_PADDING * 2 - LABEL_MARGIN * 2;

    cellSize = Math.min(Math.floor(availW / (GRID_COLS - 1)), Math.floor(availH / (GRID_ROWS - 1)));
    cellSize = Math.max(cellSize, 36); // minimum

    var totalW = cellSize * (GRID_COLS - 1) + BOARD_PADDING * 2;
    var totalH = cellSize * (GRID_ROWS - 1) + BOARD_PADDING * 2 + LABEL_MARGIN * 2;

    canvas.width = totalW;
    canvas.height = totalH;
    canvas.style.width = totalW + 'px';
    canvas.style.height = totalH + 'px';

    boardX = BOARD_PADDING;
    boardY = BOARD_PADDING + LABEL_MARGIN;

    if (currentBoard) draw(currentBoard);
  }

  // Convert board [row, col] to canvas pixel
  function boardToPixel(r, c) {
    if (flipBoard) {
      r = 9 - r;
      c = 8 - c;
    }
    return {
      x: boardX + c * cellSize,
      y: boardY + r * cellSize
    };
  }

  // Convert canvas pixel to board [row, col]
  function pixelToBoard(px, py) {
    var c = Math.round((px - boardX) / cellSize);
    var r = Math.round((py - boardY) / cellSize);
    if (flipBoard) {
      r = 9 - r;
      c = 8 - c;
    }
    if (r < 0 || r > 9 || c < 0 || c > 8) return null;
    return [r, c];
  }

  // --- Drawing ---

  function draw(board, checkSide) {
    currentBoard = board;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBoard();
    drawLabels();
    drawLastMove();
    drawSelected();
    drawLegalTargets();
    drawPieces(board, checkSide);
  }

  function drawBoard() {
    // Background
    ctx.fillStyle = COLORS.boardBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1.2;

    // Horizontal lines
    for (var r = 0; r < GRID_ROWS; r++) {
      var y = boardY + r * cellSize;
      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + (GRID_COLS - 1) * cellSize, y);
      ctx.stroke();
    }

    // Vertical lines (with river gap for inner columns)
    for (var c = 0; c < GRID_COLS; c++) {
      var x = boardX + c * cellSize;
      if (c === 0 || c === GRID_COLS - 1) {
        // Edge columns: full line
        ctx.beginPath();
        ctx.moveTo(x, boardY);
        ctx.lineTo(x, boardY + (GRID_ROWS - 1) * cellSize);
        ctx.stroke();
      } else {
        // Top half
        ctx.beginPath();
        ctx.moveTo(x, boardY);
        ctx.lineTo(x, boardY + 4 * cellSize);
        ctx.stroke();
        // Bottom half
        ctx.beginPath();
        ctx.moveTo(x, boardY + 5 * cellSize);
        ctx.lineTo(x, boardY + (GRID_ROWS - 1) * cellSize);
        ctx.stroke();
      }
    }

    // Palace diagonals
    ctx.strokeStyle = COLORS.palaceLine;
    ctx.lineWidth = 1;
    drawPalace(0);  // top palace (rows 0-2)
    drawPalace(7);  // bottom palace (rows 7-9)

    // River text
    drawRiverText();

    // Star points (兵/卒 positions and cannon positions)
    drawStarPoints();
  }

  function drawPalace(startRow) {
    var r1, r2, c1, c2;
    if (flipBoard) {
      r1 = 9 - startRow;
      r2 = 9 - (startRow + 2);
      c1 = 8 - 3;
      c2 = 8 - 5;
    } else {
      r1 = startRow;
      r2 = startRow + 2;
      c1 = 3;
      c2 = 5;
    }
    var p1 = { x: boardX + c1 * cellSize, y: boardY + r1 * cellSize };
    var p2 = { x: boardX + c2 * cellSize, y: boardY + r2 * cellSize };
    var p3 = { x: boardX + c2 * cellSize, y: boardY + r1 * cellSize };
    var p4 = { x: boardX + c1 * cellSize, y: boardY + r2 * cellSize };

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  }

  function drawStarPoints() {
    // Standard star points positions (row, col) — original orientation
    var points = [
      [2, 1], [2, 7], // cannon positions (black side)
      [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], // soldier positions (black)
      [6, 0], [6, 2], [6, 4], [6, 6], [6, 8], // soldier positions (red)
      [7, 1], [7, 7]  // cannon positions (red side)
    ];

    var size = cellSize * 0.08;
    var gap = cellSize * 0.06;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;

    for (var i = 0; i < points.length; i++) {
      var pos = boardToPixel(points[i][0], points[i][1]);
      drawStarAt(pos.x, pos.y, size, gap, points[i][1]);
    }
  }

  function drawStarAt(x, y, size, gap, col) {
    // Draw small lines around the intersection (like a + sign with gaps)
    var dirs = [];
    if (col > 0) { // left side marks
      dirs.push([-1, -1], [-1, 1]);
    }
    if (col < 8) { // right side marks
      dirs.push([1, -1], [1, 1]);
    }

    for (var d = 0; d < dirs.length; d++) {
      var dx = dirs[d][0];
      var dy = dirs[d][1];
      ctx.beginPath();
      ctx.moveTo(x + dx * gap, y + dy * gap);
      ctx.lineTo(x + dx * (gap + size), y + dy * gap);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + dx * gap, y + dy * gap);
      ctx.lineTo(x + dx * gap, y + dy * (gap + size));
      ctx.stroke();
    }
  }

  function drawRiverText() {
    var fontSize = Math.max(cellSize * 0.4, 14);
    ctx.font = 'bold ' + fontSize + 'px "KaiTi", "DFKai-SB", "BiauKai", serif';
    ctx.fillStyle = COLORS.riverText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var riverY = boardY + 4.5 * cellSize;

    if (flipBoard) {
      ctx.fillText('漢  界', boardX + 1.5 * cellSize, riverY);
      ctx.fillText('楚  河', boardX + 6.5 * cellSize, riverY);
    } else {
      ctx.fillText('楚  河', boardX + 1.5 * cellSize, riverY);
      ctx.fillText('漢  界', boardX + 6.5 * cellSize, riverY);
    }
  }

  function drawLabels() {
    var fontSize = Math.max(cellSize * 0.28, 11);
    ctx.font = fontSize + 'px "KaiTi", "DFKai-SB", sans-serif';
    ctx.fillStyle = COLORS.gridLine;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var topLabels = flipBoard ? RED_LABELS.slice().reverse() : BLACK_LABELS;
    var bottomLabels = flipBoard ? BLACK_LABELS.slice().reverse() : RED_LABELS;

    for (var c = 0; c < 9; c++) {
      var x = boardX + c * cellSize;
      // Top labels
      ctx.fillText(topLabels[c], x, boardY - LABEL_MARGIN * 0.6);
      // Bottom labels
      ctx.fillText(bottomLabels[c], x, boardY + 9 * cellSize + LABEL_MARGIN * 0.6);
    }
  }

  function drawLastMove() {
    if (!lastMove) return;
    ctx.fillStyle = COLORS.lastMove;

    var from = boardToPixel(lastMove.from[0], lastMove.from[1]);
    var to = boardToPixel(lastMove.to[0], lastMove.to[1]);
    var r = cellSize * 0.45;

    ctx.beginPath();
    ctx.arc(from.x, from.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(to.x, to.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSelected() {
    if (!selectedPos) return;
    var pos = boardToPixel(selectedPos[0], selectedPos[1]);
    ctx.fillStyle = COLORS.selected;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, cellSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLegalTargets() {
    for (var i = 0; i < legalTargets.length; i++) {
      var t = legalTargets[i];
      var pos = boardToPixel(t.to[0], t.to[1]);
      ctx.fillStyle = COLORS.legalDot;
      if (t.captured) {
        // Ring for captures
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, cellSize * 0.43, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.6)';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, cellSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPieces(board, checkSide) {
    var pieceRadius = cellSize * 0.42;
    var fontSize = Math.max(cellSize * 0.48, 16);
    ctx.font = 'bold ' + fontSize + 'px "KaiTi", "DFKai-SB", "BiauKai", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 9; c++) {
        var piece = board[r][c];
        if (!piece) continue;

        // Skip animating piece at origin
        if (animating && animFrom && r === animFrom[0] && c === animFrom[1]) continue;

        var pos = boardToPixel(r, c);
        drawPieceAt(pos.x, pos.y, piece, pieceRadius, fontSize, checkSide);
      }
    }

    // Draw animating piece
    if (animating && animPiece) {
      var fromPos = boardToPixel(animFrom[0], animFrom[1]);
      var toPos = boardToPixel(animTo[0], animTo[1]);
      var ax = fromPos.x + (toPos.x - fromPos.x) * animProgress;
      var ay = fromPos.y + (toPos.y - fromPos.y) * animProgress;
      drawPieceAt(ax, ay, animPiece, pieceRadius, fontSize, null);
    }
  }

  function drawPieceAt(x, y, piece, radius, fontSize, checkSide) {
    var isRed = piece.side === SIDE.RED;

    // Check glow
    if (checkSide && piece.type === G.TYPE.GENERAL && piece.side === checkSide) {
      ctx.save();
      ctx.shadowColor = COLORS.checkGlow;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.checkGlow;
      ctx.fill();
      ctx.restore();
    }

    // Piece background circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isRed ? COLORS.pieceRedBg : COLORS.pieceBlackBg;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = isRed ? COLORS.pieceRedBorder : COLORS.pieceBlackBorder;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Character
    ctx.fillStyle = isRed ? COLORS.pieceRedText : COLORS.pieceBlackText;
    ctx.font = 'bold ' + fontSize + 'px "KaiTi", "DFKai-SB", "BiauKai", serif';
    ctx.fillText(G.getPieceChar(piece), x, y + 1);
  }

  // --- Animation ---

  function animateMove(from, to, piece, board, checkSide, callback) {
    animating = true;
    animFrom = from;
    animTo = to;
    animPiece = piece;
    animProgress = 0;

    var duration = 180;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      animProgress = Math.min(elapsed / duration, 1);

      // Ease out
      animProgress = 1 - Math.pow(1 - animProgress, 2);

      draw(board, checkSide);

      if (animProgress < 1) {
        requestAnimationFrame(step);
      } else {
        animating = false;
        animPiece = null;
        animFrom = null;
        animTo = null;
        if (callback) callback();
      }
    }

    requestAnimationFrame(step);
  }

  // --- Interaction ---

  function handleClick(e) {
    if (animating) return;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    processInput(x, y);
  }

  function handleTouch(e) {
    if (animating) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var touch = e.touches[0];
    var x = touch.clientX - rect.left;
    var y = touch.clientY - rect.top;
    processInput(x, y);
  }

  function processInput(x, y) {
    var pos = pixelToBoard(x, y);
    if (!pos) return;
    if (onMoveCallback) {
      onMoveCallback(pos[0], pos[1]);
    }
  }

  function setSelected(pos) {
    selectedPos = pos;
  }

  function setLegalTargets(targets) {
    legalTargets = targets || [];
  }

  function setLastMove(move) {
    lastMove = move;
  }

  function highlightHint(from, to) {
    // Draw hint arrows or highlights
    if (!currentBoard) return;
    draw(currentBoard);

    var fromPos = boardToPixel(from[0], from[1]);
    var toPos = boardToPixel(to[0], to[1]);
    var r = cellSize * 0.45;

    ctx.fillStyle = 'rgba(0, 200, 100, 0.35)';
    ctx.beginPath();
    ctx.arc(fromPos.x, fromPos.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 200, 100, 0.5)';
    ctx.beginPath();
    ctx.arc(toPos.x, toPos.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Arrow line
    ctx.strokeStyle = 'rgba(0, 180, 80, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- Export ---
  window.ChineseChess.Board = {
    init: init,
    draw: draw,
    resize: resize,
    setFlip: setFlip,
    setSelected: setSelected,
    setLegalTargets: setLegalTargets,
    setLastMove: setLastMove,
    animateMove: animateMove,
    highlightHint: highlightHint,
    boardToPixel: boardToPixel
  };
})();
