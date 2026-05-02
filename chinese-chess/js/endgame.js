// ============================================================
// endgame.js — Endgame puzzle module
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var SIDE = G.SIDE;

  var PROGRESS_KEY = 'xiangqi_puzzle_progress';
  var puzzles = [];
  var currentPuzzle = null;
  var currentStep = 0;
  var onUpdate = null;

  function init(callback) {
    onUpdate = callback;
    loadProgress();
  }

  function setPuzzles(data) {
    puzzles = data || [];
  }

  function getPuzzles() {
    return puzzles;
  }

  function getPuzzle(id) {
    for (var i = 0; i < puzzles.length; i++) {
      if (puzzles[i].id === id) return puzzles[i];
    }
    return null;
  }

  // Start a puzzle
  function startPuzzle(id) {
    var puzzle = getPuzzle(id);
    if (!puzzle) return null;

    currentPuzzle = puzzle;
    currentStep = 0;

    var parsed = G.parseFEN(puzzle.fen);

    return {
      puzzle: puzzle,
      board: parsed.board,
      turn: parsed.turn || (puzzle.side === 'red' ? SIDE.RED : SIDE.BLACK),
      step: 0,
      totalSteps: puzzle.solution.length,
      completed: false
    };
  }

  // Check if the player's move matches the expected solution move
  function checkMove(move, board) {
    if (!currentPuzzle || currentStep >= currentPuzzle.solution.length) return null;

    var expectedNotation = currentPuzzle.solution[currentStep];

    // Generate notation for the player's move
    var notation = window.ChineseChess.Notation.moveToNotation(board, move);

    if (notation === expectedNotation) {
      currentStep++;

      // Check if puzzle is complete
      if (currentStep >= currentPuzzle.solution.length) {
        markSolved(currentPuzzle.id);
        return { correct: true, completed: true, notation: notation };
      }

      // Return the opponent's response (next step in solution)
      var response = currentPuzzle.solution[currentStep];
      currentStep++;

      return {
        correct: true,
        completed: currentStep >= currentPuzzle.solution.length,
        notation: notation,
        response: response,
        responseStep: currentStep - 1
      };
    }

    return { correct: false, expected: expectedNotation, notation: notation };
  }

  // Get hint for current step
  function getHint() {
    if (!currentPuzzle || currentStep >= currentPuzzle.solution.length) return null;
    return {
      notation: currentPuzzle.solution[currentStep],
      hint: currentPuzzle.hint || null
    };
  }

  // Get full solution
  function getSolution() {
    if (!currentPuzzle) return null;
    return currentPuzzle.solution;
  }

  // --- Progress tracking ---

  var progress = {};

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      progress = raw ? JSON.parse(raw) : {};
    } catch (e) {
      progress = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {}
  }

  function markSolved(id) {
    progress[id] = { status: 'solved', solvedAt: new Date().toISOString() };
    saveProgress();
    // Update profile stats
    if (window.ChineseChess.Profile) {
      window.ChineseChess.Profile.incrementStat('puzzlesSolved');
    }
  }

  function markSeenSolution(id) {
    if (!progress[id] || progress[id].status !== 'solved') {
      progress[id] = { status: 'seen', seenAt: new Date().toISOString() };
      saveProgress();
    }
  }

  function getStatus(id) {
    return progress[id] ? progress[id].status : 'unsolved';
  }

  function getProgress() {
    return progress;
  }

  function getCurrentStep() {
    return currentStep;
  }

  // --- Export ---
  window.ChineseChess.Endgame = {
    init: init,
    setPuzzles: setPuzzles,
    getPuzzles: getPuzzles,
    getPuzzle: getPuzzle,
    startPuzzle: startPuzzle,
    checkMove: checkMove,
    getHint: getHint,
    getSolution: getSolution,
    markSeenSolution: markSeenSolution,
    getStatus: getStatus,
    getProgress: getProgress,
    getCurrentStep: getCurrentStep
  };
})();
