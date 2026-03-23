// ============================================================
// main.js — App initialization, routing, game controller
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var Rules = window.ChineseChess.Rules;
  var Board = window.ChineseChess.Board;
  var AI = window.ChineseChess.AI;
  var Notation = window.ChineseChess.Notation;
  var History = window.ChineseChess.History;
  var Storage = window.ChineseChess.Storage;
  var Profile = window.ChineseChess.Profile;
  var Audio = window.ChineseChess.Audio;
  var UI = window.ChineseChess.UI;
  var Endgame = window.ChineseChess.Endgame;
  var Tutorial = window.ChineseChess.Tutorial;

  var SIDE = G.SIDE;

  // --- App state ---
  var gameState = null;
  var currentScreen = 'lobby';
  var selectedPiece = null;
  var isThinking = false;  // AI is computing
  var autoPlayMode = false; // CPU plays on human's behalf
  var autoPlayTimer = null;
  var puzzleMode = false;
  var puzzleState = null;
  var tutorialMode = false;
  var tutorialStep = null;

  // Difficulty mapping
  var DIFF_MAP = {
    easy: '初級', medium: '中級', hard: '高級',
    '初級': 'easy', '中級': 'medium', '高級': 'hard'
  };

  // --- Initialization ---

  function init() {
    Tutorial.init();
    Endgame.init();

    // Load puzzle data
    loadPuzzleData();

    // Set up board
    var canvas = document.getElementById('gameCanvas');
    Board.init(canvas, onBoardClick);

    // Set up history panel
    var historyEl = document.getElementById('historyPanel');
    History.init(historyEl, onHistoryNavigate);

    // Set up navigation button handlers
    bindEvents();

    // Window resize
    window.addEventListener('resize', function () {
      Board.resize();
      if (gameState) Board.draw(gameState.board, getCheckSide());
    });

    // Check if profile exists
    if (!Profile.exists()) {
      showScreen('lobby');
      UI.showProfileDialog(function () {
        updateLobbyProfile();
      });
    } else {
      showScreen('lobby');
      updateLobbyProfile();
    }
  }

  function loadPuzzleData() {
    // Puzzle data inlined — no external requests needed, works from file://
    Endgame.setPuzzles([
      {"id":"basic_001","name":"單車殺士","source":"基礎殺法","fen":"3k5/4a4/9/9/9/9/9/9/3R5/4K4 w","side":"red","difficulty":1,"solution":["車六進八","士5退4","車六平五"],"hint":"用車控制將的走位，先逼士離開"},
      {"id":"basic_002","name":"雙車殺","source":"基礎殺法","fen":"4k4/9/9/9/9/9/9/9/9/3RKR3 w","side":"red","difficulty":1,"solution":["車四進一","將5進1","車六進二"],"hint":"兩車交替將軍"},
      {"id":"basic_003","name":"馬後炮","source":"基礎殺法","fen":"3k5/9/9/9/3N5/9/4C4/9/9/4K4 w","side":"red","difficulty":1,"solution":["馬六進五","將6進1","炮五進五"],"hint":"先用馬將軍逼將上走，再用炮將殺"},
      {"id":"basic_004","name":"鐵門栓","source":"基礎殺法","fen":"3ak4/9/9/9/9/9/9/4C4/9/3RK4 w","side":"red","difficulty":2,"solution":["炮五進七","士4進5","車六進九"],"hint":"先用炮引開士，再用車將殺"},
      {"id":"basic_005","name":"悶宮殺","source":"基礎殺法","fen":"3k5/3aP4/4a4/9/9/9/9/9/9/4K4 w","side":"red","difficulty":2,"solution":["兵五平六"],"hint":"兵到將面前，士堵住退路"},
      {"id":"basic_006","name":"白臉將","source":"基礎殺法","fen":"3k5/9/4R4/9/9/9/9/9/9/4K4 w","side":"red","difficulty":1,"solution":["車五進一","將6進1","車五進一"],"hint":"利用對面將的規則配合車"},
      {"id":"basic_007","name":"雙馬飲泉","source":"基礎殺法","fen":"4k4/9/9/4N4/9/3N5/9/9/9/4K4 w","side":"red","difficulty":2,"solution":["馬五進四","將5平4","馬六進五","將4平5","馬四退三"],"hint":"兩馬配合步步將軍"},
      {"id":"basic_008","name":"車炮聯殺","source":"基礎殺法","fen":"3k5/9/4C4/9/9/9/9/4R4/9/4K4 w","side":"red","difficulty":2,"solution":["車五進六","將6進1","炮五退一"],"hint":"車逼將上走，炮退一步絕殺"},
      {"id":"sqyq_001","name":"七星聚會","source":"適情雅趣","fen":"2R1k4/4a4/4b4/9/2r6/9/4p4/4B4/4A4/4K4 w","side":"red","difficulty":4,"solution":["車七進二","士5退4","車七平六","將5平4","車六退一"],"hint":"先棄車引開士，再車殺"},
      {"id":"sqyq_002","name":"千里獨行","source":"適情雅趣","fen":"4k4/4a4/3ab4/9/9/9/4P4/9/9/4K4 w","side":"red","difficulty":3,"solution":["兵五進一","士5進4","兵五進一","將5平4","兵五平六"],"hint":"孤兵深入，步步為營"},
      {"id":"sqyq_003","name":"野馬操田","source":"適情雅趣","fen":"3k5/9/9/9/9/6N2/9/9/3p5/4K4 w","side":"red","difficulty":3,"solution":["馬三進四","將6平5","馬四進三","將5進1","馬三退四"],"hint":"馬跳日字，控制將的走位"},
      {"id":"jzm_001","name":"大膽穿心","source":"橘中秘","fen":"3k5/4a4/3a5/4R4/9/9/4C4/9/9/4K4 w","side":"red","difficulty":3,"solution":["車五進一","將6進1","車五進一","將6進1","炮五進七"],"hint":"車逼將到頂，炮絕殺"},
      {"id":"jzm_002","name":"海底撈月","source":"橘中秘","fen":"4k4/9/9/9/9/9/9/4C4/3pR4/4K4 w","side":"red","difficulty":2,"solution":["車五退一","將5退1","車五平六","將5平4","炮五平六"],"hint":"車退引將下來，再配合炮殺"},
      {"id":"jzm_003","name":"棄車得勝","source":"橘中秘","fen":"2bak4/4a4/9/9/9/2R6/9/4C4/9/4K4 w","side":"red","difficulty":3,"solution":["車七進七","象3退5","炮五進五","士5退4","車七平五"],"hint":"棄車破象，炮將配合殺"},
      {"id":"custom_001","name":"炮輾丹砂","source":"經典殘局","fen":"3k5/9/4C4/9/9/9/9/9/3p5/3K5 w","side":"red","difficulty":2,"solution":["炮五進二","將6進1","炮五退一","將6退1","炮五平四"],"hint":"炮反覆將軍逼將走位"},
      {"id":"custom_002","name":"三子歸邊","source":"經典殘局","fen":"3k5/4a4/9/9/9/9/9/4N4/2R6/4K4 w","side":"red","difficulty":3,"solution":["馬五進四","將6平5","車七進七","將5進1","馬四進三"],"hint":"馬先佔位，車配合將殺"},
      {"id":"custom_003","name":"二鬼拍門","source":"經典殘局","fen":"3k5/9/9/9/9/9/9/3PP4/9/4K4 w","side":"red","difficulty":2,"solution":["兵六進一","將6平5","兵五進一","將5進1","兵六平五"],"hint":"雙兵配合步步逼將"},
      {"id":"custom_004","name":"雙炮轟擊","source":"經典殘局","fen":"4k4/4a4/9/9/9/9/9/4C4/4C4/4K4 w","side":"red","difficulty":3,"solution":["炮五進五","士5退4","炮五平六","將5平4","炮五進二"],"hint":"一炮引開士，另一炮殺"},
      {"id":"custom_005","name":"車馬冷著","source":"經典殘局","fen":"4k4/4a4/3ab4/9/9/9/9/3N5/4R4/4K4 w","side":"red","difficulty":4,"solution":["馬六進五","士5退4","車五進六","將5進1","車五進一","將5進1","馬五退三"],"hint":"馬先引士，車追將到頂"}
    ]);
  }

  // --- Screen routing ---

  function showScreen(name) {
    currentScreen = name;
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('active', screens[i].id === 'screen-' + name);
    }

    // Update hash
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + name);
    }

    // Screen-specific setup
    if (name === 'lobby') {
      updateLobbyProfile();
      puzzleMode = false;
      tutorialMode = false;
    } else if (name === 'game') {
      Board.resize();
      if (gameState) Board.draw(gameState.board, getCheckSide());
    } else if (name === 'puzzles') {
      renderPuzzleList();
    } else if (name === 'tutorial') {
      renderTutorialList();
    } else if (name === 'settings') {
      renderSettings();
    }
  }

  // --- Lobby ---

  function updateLobbyProfile() {
    var profile = Profile.load();
    var el = document.getElementById('lobbyProfile');
    if (!el) return;

    if (profile) {
      var avatarHtml = profile.avatar
        ? '<img src="' + profile.avatar + '" alt="頭像" class="lobby-avatar">'
        : '<span class="lobby-avatar-placeholder">棋</span>';

      el.innerHTML = avatarHtml +
        '<div class="lobby-profile-info">' +
        '<span class="lobby-nickname">' + profile.nickname + '</span>' +
        '<span class="lobby-stats">' +
        '勝 ' + profile.stats.wins + ' / 負 ' + profile.stats.losses + ' / 和 ' + profile.stats.draws +
        '</span>' +
        '</div>';

      el.onclick = function () {
        UI.showProfileDialog(function () { updateLobbyProfile(); });
      };
    }
  }

  // --- Pre-game settings ---

  function showPregame() {
    showScreen('pregame');
  }

  function startGameFromSettings() {
    var diff = document.querySelector('input[name="difficulty"]:checked');
    var side = document.querySelector('input[name="playSide"]:checked');
    var allowUndo = document.getElementById('allowUndo').checked;
    var allowHint = document.getElementById('allowHint').checked;

    var options = {
      difficulty: diff ? diff.value : 'medium',
      humanSide: side ? side.value : SIDE.RED,
      allowUndo: allowUndo,
      allowHint: allowHint
    };

    startNewGame(options);
  }

  // --- Game control ---

  function startNewGame(options) {
    options = options || {};
    puzzleMode = false;
    tutorialMode = false;
    autoPlayMode = false;
    if (autoPlayTimer) { clearTimeout(autoPlayTimer); autoPlayTimer = null; }

    gameState = G.createGameState(options);
    selectedPiece = null;
    isThinking = false;

    Board.setFlip(gameState.humanSide === SIDE.BLACK);
    Board.setSelected(null);
    Board.setLegalTargets([]);
    Board.setLastMove(null);

    History.setMoves([]);
    updateGameUI();

    showScreen('game');
    Board.resize();
    Board.draw(gameState.board);

    // If human is black, AI moves first
    if (gameState.humanSide === SIDE.BLACK && gameState.turn === SIDE.RED) {
      scheduleAIMove();
    }
  }

  function onBoardClick(row, col) {
    if (puzzleMode) {
      handlePuzzleClick(row, col);
      return;
    }
    if (tutorialMode) {
      handleTutorialClick(row, col);
      return;
    }
    if (!gameState || gameState.status === G.STATUS.CHECKMATE ||
        gameState.status === G.STATUS.STALEMATE || gameState.status === G.STATUS.RESIGNED ||
        gameState.status === G.STATUS.DRAW) return;
    if (isThinking) return;
    if (autoPlayMode) return; // block input during CPU takeover
    if (gameState.turn !== gameState.humanSide) return;

    // Check if navigated away from latest move
    var histIdx = History.getCurrentIndex();
    if (histIdx !== gameState.moveHistory.length - 1 && gameState.moveHistory.length > 0) {
      // Jump back to latest position
      History.goLast();
      restoreToLatest();
    }

    var piece = gameState.board[row][col];

    if (selectedPiece) {
      // Try to move to this position
      var legalMoves = Rules.getLegalMovesForPiece(gameState.board, selectedPiece[0], selectedPiece[1]);
      var targetMove = null;
      for (var i = 0; i < legalMoves.length; i++) {
        if (legalMoves[i].to[0] === row && legalMoves[i].to[1] === col) {
          targetMove = legalMoves[i];
          break;
        }
      }

      if (targetMove) {
        executeHumanMove(targetMove);
        return;
      }

      // Clicked own piece — reselect
      if (piece && piece.side === gameState.humanSide) {
        selectPiece(row, col);
        return;
      }

      // Deselect
      deselectPiece();
      return;
    }

    // Select own piece
    if (piece && piece.side === gameState.humanSide) {
      selectPiece(row, col);
    }
  }

  function selectPiece(row, col) {
    selectedPiece = [row, col];
    var legalMoves = Rules.getLegalMovesForPiece(gameState.board, row, col);
    Board.setSelected([row, col]);
    Board.setLegalTargets(legalMoves);
    Board.draw(gameState.board, getCheckSide());
    Audio.playClick();
  }

  function deselectPiece() {
    selectedPiece = null;
    Board.setSelected(null);
    Board.setLegalTargets([]);
    Board.draw(gameState.board, getCheckSide());
  }

  function executeHumanMove(move) {
    // Generate notation before applying
    move.notation = Notation.moveToNotation(gameState.board, move);

    var captured = gameState.board[move.to[0]][move.to[1]];
    var pieceData = { type: move.piece.type, side: move.piece.side };

    // Animate
    var boardBeforeApply = G.cloneBoard(gameState.board);
    Board.setSelected(null);
    Board.setLegalTargets([]);
    selectedPiece = null;

    Board.animateMove(move.from, move.to, pieceData, boardBeforeApply, null, function () {
      G.applyMove(gameState, move);
      Board.setLastMove(move);
      History.addMove(move);

      if (captured) {
        Audio.playCapture();
      } else {
        Audio.playMove();
      }

      // Check game end
      var ended = checkGameEnd();
      if (!ended) {
        // Auto-save
        autoSave();
        // AI's turn
        scheduleAIMove();
      } else {
        autoSave();
      }

      updateGameUI();
      Board.draw(gameState.board, getCheckSide());
    });
  }

  function scheduleAIMove() {
    if (gameState.turn === gameState.humanSide) return;
    isThinking = true;
    updateGameUI();

    // Use setTimeout to let UI update
    setTimeout(function () {
      var aiMove = AI.getBestMove(gameState.board, gameState.turn, gameState.difficulty);

      if (!aiMove) {
        isThinking = false;
        updateGameUI();
        return;
      }

      // Generate notation
      aiMove.notation = Notation.moveToNotation(gameState.board, aiMove);

      var captured = gameState.board[aiMove.to[0]][aiMove.to[1]];
      var pieceData = { type: aiMove.piece.type, side: aiMove.piece.side };
      var boardBefore = G.cloneBoard(gameState.board);

      Board.animateMove(aiMove.from, aiMove.to, pieceData, boardBefore, null, function () {
        G.applyMove(gameState, aiMove);
        Board.setLastMove(aiMove);
        History.addMove(aiMove);
        isThinking = false;

        if (captured) {
          Audio.playCapture();
        } else {
          Audio.playMove();
        }

        checkGameEnd();
        autoSave();
        updateGameUI();
        Board.draw(gameState.board, getCheckSide());
      });
    }, 100);
  }

  function checkGameEnd() {
    var nextSide = gameState.turn;

    if (Rules.isCheckmate(gameState.board, nextSide)) {
      gameState.status = G.STATUS.CHECKMATE;
      var winner = G.oppositeSide(nextSide);
      var isWin = (winner === gameState.humanSide);
      Audio.playGameOver(isWin);

      // Update profile stats
      if (isWin) {
        Profile.incrementStat('wins');
      } else {
        Profile.incrementStat('losses');
      }
      Profile.incrementStat('gamesPlayed');

      setTimeout(function () {
        UI.showModal({
          title: isWin ? '恭喜你贏了！' : '你輸了！',
          content: '<p>' + (isWin ? '你成功將死了對手！' : '你的帥被將死了。') + '</p>',
          buttons: [
            { text: '返回主頁', class: 'btn-secondary', onClick: function () { showScreen('lobby'); } },
            { text: '再來一局', class: 'btn-primary', onClick: function () { startNewGame(getLastSettings()); } }
          ]
        });
      }, 500);
      return true;
    }

    if (Rules.isStalemate(gameState.board, nextSide)) {
      gameState.status = G.STATUS.STALEMATE;
      var stalemateWinner = G.oppositeSide(nextSide);
      var isStWin = (stalemateWinner === gameState.humanSide);
      Audio.playGameOver(isStWin);

      Profile.incrementStat(isStWin ? 'wins' : 'losses');
      Profile.incrementStat('gamesPlayed');

      setTimeout(function () {
        UI.showModal({
          title: isStWin ? '對方無棋可走，你贏了！' : '你無棋可走，你輸了！',
          content: '<p>困斃——無棋可走的一方判負。</p>',
          buttons: [
            { text: '返回主頁', class: 'btn-secondary', onClick: function () { showScreen('lobby'); } },
            { text: '再來一局', class: 'btn-primary', onClick: function () { startNewGame(getLastSettings()); } }
          ]
        });
      }, 500);
      return true;
    }

    // Check for check
    if (Rules.isInCheck(gameState.board, nextSide)) {
      gameState.status = G.STATUS.CHECK;
      Audio.playCheck();
      UI.showToast('將軍！', 1200);
    } else {
      gameState.status = G.STATUS.PLAYING;
    }

    // Repetition check
    if (Rules.detectRepetition(gameState.boardHistory)) {
      gameState.status = G.STATUS.DRAW;
      Audio.playGameOver(false);
      Profile.incrementStat('draws');
      Profile.incrementStat('gamesPlayed');

      setTimeout(function () {
        UI.showModal({
          title: '和棋',
          content: '<p>局面重複三次，判和。</p>',
          buttons: [
            { text: '返回主頁', class: 'btn-secondary', onClick: function () { showScreen('lobby'); } },
            { text: '再來一局', class: 'btn-primary', onClick: function () { startNewGame(getLastSettings()); } }
          ]
        });
      }, 500);
      return true;
    }

    return false;
  }

  function getCheckSide() {
    if (!gameState) return null;
    if (Rules.isInCheck(gameState.board, gameState.turn)) return gameState.turn;
    return null;
  }

  function getLastSettings() {
    if (!gameState) return {};
    return {
      difficulty: gameState.difficulty,
      humanSide: gameState.humanSide,
      allowUndo: gameState.allowUndo,
      allowHint: gameState.allowHint
    };
  }

  // --- Game actions ---

  function doUndo() {
    if (!gameState || isThinking) return;
    if (!gameState.allowUndo || gameState.undoRemaining <= 0) return;

    // Undo AI move + human move (2 moves)
    var undone = 0;
    if (gameState.turn === gameState.humanSide) {
      // It's human's turn, undo last AI move + last human move
      if (gameState.moveHistory.length >= 2) {
        G.undoLastMove(gameState);
        History.removeLastMove();
        G.undoLastMove(gameState);
        History.removeLastMove();
        undone = 2;
      }
    } else {
      // It's AI's turn (shouldn't happen normally, but just in case)
      if (gameState.moveHistory.length >= 1) {
        G.undoLastMove(gameState);
        History.removeLastMove();
        undone = 1;
      }
    }

    if (undone > 0) {
      gameState.undoRemaining--;
      gameState.status = G.STATUS.PLAYING;
      selectedPiece = null;
      Board.setSelected(null);
      Board.setLegalTargets([]);
      Board.setLastMove(gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null);
      Board.draw(gameState.board, getCheckSide());
      updateGameUI();
      UI.showToast('已悔棋（剩餘 ' + gameState.undoRemaining + ' 次）', 1500);
    }
  }

  function doHint() {
    if (!gameState || isThinking) return;
    if (!gameState.allowHint || gameState.hintRemaining <= 0) return;
    if (gameState.turn !== gameState.humanSide) return;

    gameState.hintRemaining--;
    var hint = AI.getHint(gameState.board, gameState.humanSide);
    if (hint) {
      Board.highlightHint(hint.from, hint.to);
      var notation = Notation.moveToNotation(gameState.board, hint);
      UI.showToast('建議：' + notation, 3000);
    }
    updateGameUI();
  }

  function doResign() {
    if (!gameState || isThinking) return;
    UI.confirm('認輸', '確定要認輸嗎？', function () {
      gameState.status = G.STATUS.RESIGNED;
      Audio.playGameOver(false);
      Profile.incrementStat('losses');
      Profile.incrementStat('gamesPlayed');
      UI.showModal({
        title: '你認輸了',
        content: '<p>不要氣餒，再接再厲！</p>',
        buttons: [
          { text: '返回主頁', class: 'btn-secondary', onClick: function () { showScreen('lobby'); } },
          { text: '再來一局', class: 'btn-primary', onClick: function () { startNewGame(getLastSettings()); } }
        ]
      });
    });
  }

  function doDraw() {
    if (!gameState || isThinking) return;
    // Simple AI decision: accept draw if score is near 0 or AI is losing
    var aiSide = G.oppositeSide(gameState.humanSide);
    var score = AI.evaluate(gameState.board, aiSide);

    if (score <= 50) {
      // AI accepts draw
      gameState.status = G.STATUS.DRAW;
      Audio.playGameOver(false);
      Profile.incrementStat('draws');
      Profile.incrementStat('gamesPlayed');
      UI.showModal({
        title: '和棋',
        content: '<p>雙方同意和棋。</p>',
        buttons: [
          { text: '返回主頁', class: 'btn-secondary', onClick: function () { showScreen('lobby'); } },
          { text: '再來一局', class: 'btn-primary', onClick: function () { startNewGame(getLastSettings()); } }
        ]
      });
    } else {
      UI.showToast('對方拒絕和棋', 1500);
    }
  }

  // --- Auto-play (CPU takeover) ---

  function doAutoPlay() {
    if (!gameState || isThinking) return;
    if (gameState.status === G.STATUS.CHECKMATE || gameState.status === G.STATUS.STALEMATE ||
        gameState.status === G.STATUS.RESIGNED || gameState.status === G.STATUS.DRAW) return;

    if (autoPlayMode) {
      // Already in auto-play, stop it
      stopAutoPlay();
      return;
    }

    autoPlayMode = true;
    UI.showToast('已託管，電腦代你下棋', 2000);
    updateGameUI();
    scheduleAutoPlayMove();
  }

  function stopAutoPlay() {
    autoPlayMode = false;
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
    UI.showToast('已取回控制', 1500);
    updateGameUI();
  }

  function scheduleAutoPlayMove() {
    if (!autoPlayMode || !gameState) return;
    if (gameState.status === G.STATUS.CHECKMATE || gameState.status === G.STATUS.STALEMATE ||
        gameState.status === G.STATUS.RESIGNED || gameState.status === G.STATUS.DRAW) {
      autoPlayMode = false;
      updateGameUI();
      return;
    }

    isThinking = true;
    updateGameUI();

    autoPlayTimer = setTimeout(function () {
      if (!autoPlayMode) { isThinking = false; updateGameUI(); return; }

      var currentSide = gameState.turn;
      var diff = gameState.difficulty;
      var aiMove = AI.getBestMove(gameState.board, currentSide, diff);

      if (!aiMove) {
        isThinking = false;
        autoPlayMode = false;
        updateGameUI();
        return;
      }

      aiMove.notation = Notation.moveToNotation(gameState.board, aiMove);

      var captured = gameState.board[aiMove.to[0]][aiMove.to[1]];
      var pieceData = { type: aiMove.piece.type, side: aiMove.piece.side };
      var boardBefore = G.cloneBoard(gameState.board);

      Board.animateMove(aiMove.from, aiMove.to, pieceData, boardBefore, null, function () {
        G.applyMove(gameState, aiMove);
        Board.setLastMove(aiMove);
        History.addMove(aiMove);
        isThinking = false;

        if (captured) {
          Audio.playCapture();
        } else {
          Audio.playMove();
        }

        var ended = checkGameEnd();
        autoSave();
        updateGameUI();
        Board.draw(gameState.board, getCheckSide());

        if (!ended && autoPlayMode) {
          // Schedule next move with a short delay for watchability
          autoPlayTimer = setTimeout(function () {
            scheduleAutoPlayMove();
          }, 800);
        } else {
          autoPlayMode = false;
          updateGameUI();
        }
      });
    }, 200);
  }

  function doSave() {
    if (!gameState) return;
    UI.showSaveDialog(function (slot) {
      var data = Storage.serializeGameState(gameState);
      data.name = '存檔 ' + (slot + 1);
      if (Storage.saveGame(slot, data)) {
        UI.showToast('棋局已儲存', 1500);
      } else {
        UI.showToast('儲存失敗', 1500);
      }
    });
  }

  function doLoad(slotId) {
    var data;
    if (slotId === 'auto') {
      data = Storage.loadAutoSave();
    } else {
      data = Storage.loadGame(parseInt(slotId, 10));
    }
    if (!data) {
      UI.showToast('無法載入存檔', 1500);
      return;
    }

    // Restore game state
    var options = {
      fen: data.initialFEN || G.STARTING_FEN,
      difficulty: data.settings ? data.settings.difficulty : 'medium',
      humanSide: data.settings ? data.settings.humanSide : SIDE.RED,
      allowUndo: data.settings ? data.settings.allowUndo : true,
      allowHint: data.settings ? data.settings.allowHint : true
    };

    gameState = G.createGameState(options);
    gameState.undoRemaining = data.undoRemaining !== undefined ? data.undoRemaining : 3;
    gameState.hintRemaining = data.hintRemaining !== undefined ? data.hintRemaining : 3;

    // Replay moves
    if (data.moves) {
      for (var i = 0; i < data.moves.length; i++) {
        var m = data.moves[i];
        m.piece = m.piece || gameState.board[m.from[0]][m.from[1]];
        G.applyMove(gameState, m);
      }
    }

    Board.setFlip(gameState.humanSide === SIDE.BLACK);
    Board.setLastMove(gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null);
    History.setMoves(gameState.moveHistory);
    selectedPiece = null;
    puzzleMode = false;

    showScreen('game');
    updateGameUI();
    Board.draw(gameState.board, getCheckSide());

    // If it's AI's turn, schedule move
    if (gameState.turn !== gameState.humanSide &&
        gameState.status !== G.STATUS.CHECKMATE &&
        gameState.status !== G.STATUS.STALEMATE) {
      scheduleAIMove();
    }
  }

  function autoSave() {
    if (!gameState) return;
    var data = Storage.serializeGameState(gameState);
    data.name = '自動存檔';
    Storage.autoSave(data);
  }

  // --- History navigation ---

  function onHistoryNavigate(index) {
    if (!gameState) return;
    // Replay from initial position to the given move index
    var parsed = G.parseFEN(gameState.initialFEN || G.STARTING_FEN);
    var board = parsed.board;

    for (var i = 0; i <= index && i < gameState.moveHistory.length; i++) {
      var m = gameState.moveHistory[i];
      board[m.to[0]][m.to[1]] = board[m.from[0]][m.from[1]];
      board[m.from[0]][m.from[1]] = null;
    }

    var move = index >= 0 ? gameState.moveHistory[index] : null;
    Board.setLastMove(move);
    Board.setSelected(null);
    Board.setLegalTargets([]);
    selectedPiece = null;
    Board.draw(board);
  }

  function restoreToLatest() {
    if (!gameState) return;
    Board.setLastMove(gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null);
    Board.draw(gameState.board, getCheckSide());
  }

  // --- Puzzle mode ---

  function startPuzzle(id) {
    puzzleMode = true;
    tutorialMode = false;
    puzzleState = Endgame.startPuzzle(id);
    if (!puzzleState) {
      UI.showToast('無法載入殘局', 1500);
      return;
    }

    // Create a minimal game state for the puzzle
    gameState = G.createGameState({
      fen: puzzleState.puzzle.fen,
      humanSide: puzzleState.turn,
      allowUndo: false,
      allowHint: true
    });
    gameState.hintRemaining = 3;

    Board.setFlip(puzzleState.turn === SIDE.BLACK);
    Board.setSelected(null);
    Board.setLegalTargets([]);
    Board.setLastMove(null);
    History.setMoves([]);
    selectedPiece = null;

    showScreen('game');
    updateGameUI();
    Board.draw(gameState.board);

    UI.showToast(puzzleState.puzzle.name + '（' + puzzleState.puzzle.source + '）', 2500);
  }

  function handlePuzzleClick(row, col) {
    if (!gameState || !puzzleState || isThinking) return;
    if (puzzleState.completed) return;

    var piece = gameState.board[row][col];

    if (selectedPiece) {
      var legalMoves = Rules.getLegalMovesForPiece(gameState.board, selectedPiece[0], selectedPiece[1]);
      var targetMove = null;
      for (var i = 0; i < legalMoves.length; i++) {
        if (legalMoves[i].to[0] === row && legalMoves[i].to[1] === col) {
          targetMove = legalMoves[i];
          break;
        }
      }

      if (targetMove) {
        // Generate notation
        targetMove.notation = Notation.moveToNotation(gameState.board, targetMove);

        // Check against solution
        var result = Endgame.checkMove(targetMove, gameState.board);

        if (result && result.correct) {
          // Apply the move
          G.applyMove(gameState, targetMove);
          Board.setLastMove(targetMove);
          History.addMove(targetMove);
          Audio.playMove();

          selectedPiece = null;
          Board.setSelected(null);
          Board.setLegalTargets([]);

          if (result.completed) {
            puzzleState.completed = true;
            Board.draw(gameState.board);
            Audio.playGameOver(true);
            setTimeout(function () {
              UI.showModal({
                title: '恭喜過關！',
                content: '<p>你成功解開了「' + puzzleState.puzzle.name + '」！</p>',
                buttons: [
                  { text: '返回殘局列表', class: 'btn-secondary', onClick: function () { showScreen('puzzles'); } },
                  { text: '再試一次', class: 'btn-primary', onClick: function () { startPuzzle(puzzleState.puzzle.id); } }
                ]
              });
            }, 500);
          } else if (result.response) {
            // Play opponent's response
            Board.draw(gameState.board, getCheckSide());
            isThinking = true;
            setTimeout(function () {
              // Find and apply the response move
              var opSide = G.oppositeSide(puzzleState.turn);
              var allMoves = Rules.generateLegalMoves(gameState.board, opSide);

              // Match by notation
              var responseMove = null;
              for (var j = 0; j < allMoves.length; j++) {
                var n = Notation.moveToNotation(gameState.board, allMoves[j]);
                if (n === result.response) {
                  responseMove = allMoves[j];
                  responseMove.notation = n;
                  break;
                }
              }

              if (responseMove) {
                G.applyMove(gameState, responseMove);
                Board.setLastMove(responseMove);
                History.addMove(responseMove);
                Audio.playMove();
              }

              isThinking = false;
              Board.draw(gameState.board, getCheckSide());
              updateGameUI();

              // Check if puzzle is now complete
              if (result.completed || Endgame.getCurrentStep() >= puzzleState.puzzle.solution.length) {
                puzzleState.completed = true;
                Audio.playGameOver(true);
                setTimeout(function () {
                  UI.showModal({
                    title: '恭喜過關！',
                    content: '<p>你成功解開了「' + puzzleState.puzzle.name + '」！</p>',
                    buttons: [
                      { text: '返回殘局列表', class: 'btn-secondary', onClick: function () { showScreen('puzzles'); } },
                      { text: '再試一次', class: 'btn-primary', onClick: function () { startPuzzle(puzzleState.puzzle.id); } }
                    ]
                  });
                }, 500);
              }
            }, 600);
          }
        } else {
          // Wrong move
          Audio.playClick();
          UI.showToast('唔係最佳走法，再試下！', 1500);
          deselectPiece();
        }
        return;
      }

      if (piece && piece.side === puzzleState.turn) {
        selectPiece(row, col);
        return;
      }
      deselectPiece();
      return;
    }

    if (piece && piece.side === puzzleState.turn) {
      selectPiece(row, col);
    }
  }

  // --- Tutorial mode ---

  function startTutorialLesson(index) {
    tutorialMode = true;
    puzzleMode = false;
    tutorialStep = Tutorial.startLesson(index);
    if (!tutorialStep) return;

    showScreen('game');
    renderTutorialStep();
  }

  function renderTutorialStep() {
    if (!tutorialStep) return;

    var step = tutorialStep.step;
    var parsed = G.parseFEN(step.fen);
    gameState = G.createGameState({ fen: step.fen });

    Board.setFlip(false);
    Board.setSelected(null);
    Board.setLegalTargets([]);
    Board.setLastMove(null);
    selectedPiece = null;

    Board.resize();
    Board.draw(parsed.board);

    // Show tutorial text
    updateTutorialUI();

    // If interactive, allow clicking pieces to show moves
    if (step.interactive === 'show_moves' && step.highlights) {
      for (var i = 0; i < step.highlights.length; i++) {
        var h = step.highlights[i];
        if (h.type === 'piece') {
          selectPiece(h.row, h.col);
        }
      }
    }
  }

  function handleTutorialClick(row, col) {
    if (!tutorialStep) return;
    var step = tutorialStep.step;

    if (step.interactive === 'show_moves') {
      var piece = gameState.board[row][col];
      if (piece) {
        selectPiece(row, col);
      } else {
        deselectPiece();
      }
    }
  }

  function tutorialNext() {
    tutorialStep = Tutorial.nextStep();
    if (tutorialStep) {
      renderTutorialStep();
    } else {
      UI.showToast('課程完成！', 2000);
      showScreen('tutorial');
    }
  }

  function tutorialPrev() {
    tutorialStep = Tutorial.prevStep();
    if (tutorialStep) renderTutorialStep();
  }

  // --- Render puzzle list ---

  function renderPuzzleList() {
    var container = document.getElementById('puzzleList');
    if (!container) return;

    var puzzles = Endgame.getPuzzles();
    var html = '';

    if (puzzles.length === 0) {
      html = '<div class="empty-msg">殘局資料載入中...</div>';
    } else {
      puzzles.forEach(function (p) {
        var status = Endgame.getStatus(p.id);
        var statusClass = status === 'solved' ? 'solved' : (status === 'seen' ? 'seen' : '');
        var stars = '';
        for (var s = 0; s < 5; s++) {
          stars += s < p.difficulty ? '★' : '☆';
        }

        html += '<div class="puzzle-card ' + statusClass + '" data-puzzle-id="' + p.id + '">';
        html += '<div class="puzzle-name">' + p.name + '</div>';
        html += '<div class="puzzle-info">';
        html += '<span class="puzzle-source">' + p.source + '</span>';
        html += '<span class="puzzle-stars">' + stars + '</span>';
        html += '</div>';
        if (status === 'solved') html += '<span class="puzzle-badge">✓ 已解</span>';
        else if (status === 'seen') html += '<span class="puzzle-badge seen">已睇答案</span>';
        html += '</div>';
      });
    }

    container.innerHTML = html;

    // Click handlers
    var cards = container.querySelectorAll('.puzzle-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function () {
        var id = this.getAttribute('data-puzzle-id');
        startPuzzle(id);
      });
    }
  }

  // --- Render tutorial list ---

  function renderTutorialList() {
    var container = document.getElementById('tutorialList');
    if (!container) return;

    var lessons = Tutorial.getLessons();
    var html = '';

    lessons.forEach(function (l, i) {
      html += '<div class="tutorial-card' + (l.completed ? ' completed' : '') + '" data-lesson="' + i + '">';
      html += '<span class="tutorial-icon">' + l.icon + '</span>';
      html += '<div class="tutorial-info">';
      html += '<span class="tutorial-title">' + l.title + '</span>';
      html += '<span class="tutorial-steps">' + l.stepsCount + ' 步</span>';
      html += '</div>';
      if (l.completed) html += '<span class="tutorial-check">✓</span>';
      html += '</div>';
    });

    container.innerHTML = html;

    var cards = container.querySelectorAll('.tutorial-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-lesson'), 10);
        startTutorialLesson(idx);
      });
    }
  }

  // --- Settings ---

  function renderSettings() {
    var soundCheckbox = document.getElementById('settingSound');
    if (soundCheckbox) {
      soundCheckbox.checked = Audio.isEnabled();
    }
  }

  // --- Update game UI ---

  function updateGameUI() {
    // Turn indicator
    var turnEl = document.getElementById('turnIndicator');
    if (turnEl && gameState) {
      if (isThinking) {
        turnEl.textContent = '電腦思考中...';
        turnEl.className = 'turn-indicator thinking';
      } else if (gameState.status === G.STATUS.CHECKMATE || gameState.status === G.STATUS.STALEMATE || gameState.status === G.STATUS.RESIGNED || gameState.status === G.STATUS.DRAW) {
        turnEl.textContent = '棋局結束';
        turnEl.className = 'turn-indicator ended';
      } else {
        var isHumanTurn = gameState.turn === gameState.humanSide;
        turnEl.textContent = isHumanTurn ? '輪到你走棋' : '對方回合';
        turnEl.className = 'turn-indicator ' + (isHumanTurn ? 'human' : 'ai');
      }
    }

    // Difficulty display
    var diffEl = document.getElementById('difficultyDisplay');
    if (diffEl && gameState) {
      diffEl.textContent = DIFF_MAP[gameState.difficulty] || gameState.difficulty;
    }

    // Undo button
    var undoBtn = document.getElementById('btnUndo');
    if (undoBtn && gameState) {
      if (gameState.allowUndo && gameState.undoRemaining > 0) {
        undoBtn.style.display = '';
        undoBtn.textContent = '悔棋 ' + gameState.undoRemaining + '/3';
        undoBtn.disabled = isThinking || gameState.moveHistory.length < 2;
      } else {
        undoBtn.style.display = gameState.allowUndo ? '' : 'none';
        undoBtn.disabled = true;
        undoBtn.textContent = '悔棋 0/3';
      }
    }

    // Hint button
    var hintBtn = document.getElementById('btnHint');
    if (hintBtn && gameState) {
      if (gameState.allowHint && gameState.hintRemaining > 0) {
        hintBtn.style.display = '';
        hintBtn.textContent = '提示 ' + gameState.hintRemaining + '/3';
        hintBtn.disabled = isThinking || gameState.turn !== gameState.humanSide;
      } else {
        hintBtn.style.display = gameState.allowHint ? '' : 'none';
        hintBtn.disabled = true;
        hintBtn.textContent = '提示 0/3';
      }
    }

    // Auto-play button
    var autoBtn = document.getElementById('btnAutoPlay');
    if (autoBtn && gameState) {
      if (autoPlayMode) {
        autoBtn.textContent = '取回控制';
        autoBtn.className = 'btn btn-small btn-primary game-only';
      } else {
        autoBtn.textContent = '託管';
        autoBtn.className = 'btn btn-small game-only';
        autoBtn.disabled = gameState.status === G.STATUS.CHECKMATE || gameState.status === G.STATUS.STALEMATE ||
                           gameState.status === G.STATUS.RESIGNED || gameState.status === G.STATUS.DRAW;
      }
    }

    // Puzzle mode UI adjustments
    var gameActions = document.getElementById('gameActions');
    if (gameActions) {
      var puzzleBtns = gameActions.querySelectorAll('.game-only');
      for (var i = 0; i < puzzleBtns.length; i++) {
        puzzleBtns[i].style.display = puzzleMode ? 'none' : '';
      }
    }

    // Tutorial UI
    var tutorialBar = document.getElementById('tutorialBar');
    if (tutorialBar) {
      if (tutorialMode && tutorialStep) {
        tutorialBar.style.display = '';
        tutorialBar.innerHTML =
          '<div class="tutorial-text">' + tutorialStep.step.text + '</div>' +
          '<div class="tutorial-nav">' +
          '<span class="tutorial-progress">' + (tutorialStep.stepIndex + 1) + '/' + tutorialStep.totalSteps + '</span>' +
          '<button id="tutPrev" class="btn btn-small"' + (tutorialStep.stepIndex === 0 ? ' disabled' : '') + '>上一步</button>' +
          '<button id="tutNext" class="btn btn-small btn-primary">下一步</button>' +
          '</div>';

        document.getElementById('tutPrev').onclick = tutorialPrev;
        document.getElementById('tutNext').onclick = tutorialNext;
      } else {
        tutorialBar.style.display = 'none';
      }
    }

    // Puzzle hint button
    if (puzzleMode) {
      var hintBtn2 = document.getElementById('btnHint');
      if (hintBtn2) {
        hintBtn2.style.display = '';
        hintBtn2.textContent = '提示';
        hintBtn2.disabled = false;
        hintBtn2.onclick = function () {
          var hint = Endgame.getHint();
          if (hint) {
            UI.showToast(hint.hint || hint.notation, 3000);
          }
        };
      }
    }

    updateTutorialUI();
  }

  function updateTutorialUI() {
    // Handled in updateGameUI
  }

  // --- Event binding ---

  function bindEvents() {
    // Lobby buttons
    bind('btnStartGame', 'click', showPregame);
    bind('btnLoadGame', 'click', function () {
      UI.showLoadDialog(doLoad);
    });
    bind('btnPuzzles', 'click', function () { showScreen('puzzles'); });
    bind('btnTutorial', 'click', function () { showScreen('tutorial'); });
    bind('btnSettings', 'click', function () { showScreen('settings'); });

    // Pre-game
    bind('btnStartPlay', 'click', startGameFromSettings);
    bind('btnBackToLobby', 'click', function () { showScreen('lobby'); });

    // Game actions (all with confirmation)
    bind('btnUndo', 'click', function () {
      if (!gameState || !gameState.allowUndo || gameState.undoRemaining <= 0) return;
      UI.confirm('悔棋', '確定要悔棋嗎？（剩餘 ' + gameState.undoRemaining + ' 次）', doUndo);
    });
    bind('btnHint', 'click', function () {
      if (puzzleMode) { doHint(); return; }
      if (!gameState || !gameState.allowHint || gameState.hintRemaining <= 0) return;
      UI.confirm('提示', '確定要使用提示嗎？（剩餘 ' + gameState.hintRemaining + ' 次）', doHint);
    });
    bind('btnResign', 'click', doResign);
    bind('btnDraw', 'click', function () {
      UI.confirm('求和', '確定要向對方提出和棋嗎？', doDraw);
    });
    bind('btnAutoPlay', 'click', function () {
      if (autoPlayMode) {
        stopAutoPlay();
      } else {
        UI.confirm('託管', '確定要讓電腦代你下完這局棋嗎？你可以隨時取回控制。', doAutoPlay);
      }
    });
    bind('btnSave', 'click', doSave);
    bind('btnBackMenu', 'click', function () {
      if (gameState && (gameState.status === G.STATUS.PLAYING || gameState.status === G.STATUS.CHECK)) {
        UI.showModal({
          title: '離開棋局',
          content: '<p>你想儲存目前的棋局嗎？</p>',
          dismissible: false,
          buttons: [
            { text: '不儲存', class: 'btn-secondary', onClick: function () { showScreen('lobby'); } },
            { text: '儲存', class: 'btn-primary', onClick: function () {
              UI.showSaveDialog(function (slot) {
                var data = Storage.serializeGameState(gameState);
                data.name = '存檔 ' + (slot + 1);
                if (Storage.saveGame(slot, data)) {
                  UI.showToast('棋局已儲存', 1500);
                }
                showScreen('lobby');
              });
            }}
          ]
        });
      } else {
        showScreen('lobby');
      }
    });

    // History navigation
    bind('btnHistFirst', 'click', function () { History.goFirst(); });
    bind('btnHistPrev', 'click', function () { History.goPrev(); });
    bind('btnHistNext', 'click', function () { History.goNext(); });
    bind('btnHistLast', 'click', function () { History.goLast(); });

    // Puzzle back
    bind('btnBackFromPuzzles', 'click', function () { showScreen('lobby'); });

    // Tutorial back
    bind('btnBackFromTutorial', 'click', function () { showScreen('lobby'); });

    // Settings
    bind('btnBackFromSettings', 'click', function () { showScreen('lobby'); });
    bind('settingSound', 'change', function () {
      Audio.setEnabled(this.checked);
    });
    bind('btnClearData', 'click', function () {
      UI.confirm(
        '清除所有資料',
        '此操作將刪除所有遊戲存檔、玩家檔案及設定，且無法復原。確定要繼續嗎？',
        function () {
          // Double confirm
          UI.confirm('再次確認', '真的確定要刪除所有資料嗎？此操作無法復原！', function () {
            Storage.clearAllData();
            Profile.remove();
            localStorage.removeItem('xiangqi_tutorial_progress');
            localStorage.removeItem('xiangqi_puzzle_progress');
            UI.showToast('所有資料已清除', 2000);
            setTimeout(function () {
              window.location.reload();
            }, 1000);
          });
        }
      );
    });
    bind('btnEditProfile', 'click', function () {
      UI.showProfileDialog(function () { renderSettings(); updateLobbyProfile(); });
    });
  }

  function bind(id, event, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  // --- Start ---
  document.addEventListener('DOMContentLoaded', init);

  window.ChineseChess.Main = {
    startNewGame: startNewGame,
    showScreen: showScreen
  };
})();
