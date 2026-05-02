// ============================================================
// storage.js — Save/load to localStorage
// ============================================================
(function () {
  'use strict';

  var PREFIX = 'xiangqi_';
  var SAVE_KEY = PREFIX + 'save_';
  var AUTOSAVE_KEY = PREFIX + 'autosave';
  var MAX_SLOTS = 5;

  function isAvailable() {
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveGame(slot, data) {
    var key = SAVE_KEY + slot;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('儲存失敗:', e);
      return false;
    }
  }

  function loadGame(slot) {
    var key = SAVE_KEY + slot;
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function deleteGame(slot) {
    localStorage.removeItem(SAVE_KEY + slot);
  }

  function listSaves() {
    var saves = [];
    for (var i = 0; i < MAX_SLOTS; i++) {
      var data = loadGame(i);
      if (data) {
        saves.push({ slot: i, data: data });
      }
    }
    return saves;
  }

  function autoSave(data) {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // silent
    }
  }

  function loadAutoSave() {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearAutoSave() {
    localStorage.removeItem(AUTOSAVE_KEY);
  }

  // Serialize the current game state for saving
  function serializeGameState(state) {
    return {
      name: state.saveName || '未命名棋局',
      timestamp: new Date().toISOString(),
      fen: window.ChineseChess.Game.toFEN(state.board, state.turn),
      initialFEN: state.initialFEN,
      moves: state.moveHistory.map(function (m) {
        return {
          from: m.from,
          to: m.to,
          piece: m.piece,
          captured: m.captured || null,
          notation: m.notation || ''
        };
      }),
      settings: {
        difficulty: state.difficulty,
        humanSide: state.humanSide,
        allowUndo: state.allowUndo,
        allowHint: state.allowHint
      },
      undoRemaining: state.undoRemaining,
      hintRemaining: state.hintRemaining,
      moveIndex: state.moveHistory.length
    };
  }

  // Clear all app data
  function clearAllData() {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PREFIX) === 0) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(function (k) { localStorage.removeItem(k); });
  }

  // --- Export ---
  window.ChineseChess.Storage = {
    isAvailable: isAvailable,
    saveGame: saveGame,
    loadGame: loadGame,
    deleteGame: deleteGame,
    listSaves: listSaves,
    autoSave: autoSave,
    loadAutoSave: loadAutoSave,
    clearAutoSave: clearAutoSave,
    serializeGameState: serializeGameState,
    clearAllData: clearAllData,
    MAX_SLOTS: MAX_SLOTS
  };
})();
