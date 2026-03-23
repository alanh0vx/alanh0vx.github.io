// ============================================================
// history.js — Move history panel & navigation
// ============================================================
(function () {
  'use strict';

  var G = window.ChineseChess.Game;
  var SIDE = G.SIDE;

  var container = null;
  var moveListEl = null;
  var currentIndex = -1;
  var moves = [];
  var onNavigate = null;

  function init(containerEl, navigateCallback) {
    container = containerEl;
    onNavigate = navigateCallback;
    render();
  }

  function setMoves(moveArray) {
    moves = moveArray || [];
    currentIndex = moves.length - 1;
    render();
  }

  function addMove(move) {
    moves.push(move);
    currentIndex = moves.length - 1;
    render();
    scrollToBottom();
  }

  function removeLastMove() {
    if (moves.length > 0) {
      moves.pop();
      currentIndex = moves.length - 1;
      render();
    }
  }

  function render() {
    if (!container) return;

    var html = '<div class="history-list">';

    for (var i = 0; i < moves.length; i += 2) {
      var roundNum = Math.floor(i / 2) + 1;
      var redMove = moves[i];
      var blackMove = (i + 1 < moves.length) ? moves[i + 1] : null;

      html += '<div class="history-round">';
      html += '<span class="round-num">' + roundNum + '.</span>';

      html += '<span class="move-red' + (i === currentIndex ? ' active' : '') + '" data-index="' + i + '">';
      html += '<span class="move-dot dot-red"></span>';
      html += (redMove.notation || '---');
      html += '</span>';

      if (blackMove) {
        html += '<span class="move-black' + ((i + 1) === currentIndex ? ' active' : '') + '" data-index="' + (i + 1) + '">';
        html += '<span class="move-dot dot-black"></span>';
        html += (blackMove.notation || '---');
        html += '</span>';
      } else {
        html += '<span class="move-black empty">...</span>';
      }

      html += '</div>';
    }

    if (moves.length === 0) {
      html += '<div class="history-empty">尚未走棋</div>';
    }

    html += '</div>';

    container.innerHTML = html;

    // Click handlers
    var moveEls = container.querySelectorAll('[data-index]');
    for (var j = 0; j < moveEls.length; j++) {
      moveEls[j].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-index'), 10);
        navigateTo(idx);
      });
    }
  }

  function navigateTo(index) {
    if (index < -1 || index >= moves.length) return;
    currentIndex = index;
    render();
    if (onNavigate) onNavigate(index);
  }

  function goFirst() { navigateTo(-1); }
  function goPrev() { navigateTo(Math.max(-1, currentIndex - 1)); }
  function goNext() { navigateTo(Math.min(moves.length - 1, currentIndex + 1)); }
  function goLast() { navigateTo(moves.length - 1); }

  function scrollToBottom() {
    if (container) {
      var list = container.querySelector('.history-list');
      if (list) list.scrollTop = list.scrollHeight;
    }
  }

  function getCurrentIndex() {
    return currentIndex;
  }

  // --- Export ---
  window.ChineseChess.History = {
    init: init,
    setMoves: setMoves,
    addMove: addMove,
    removeLastMove: removeLastMove,
    goFirst: goFirst,
    goPrev: goPrev,
    goNext: goNext,
    goLast: goLast,
    navigateTo: navigateTo,
    getCurrentIndex: getCurrentIndex,
    render: render
  };
})();
