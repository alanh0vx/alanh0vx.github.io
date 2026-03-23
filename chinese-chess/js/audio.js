// ============================================================
// audio.js — Sound effects using Web Audio API
// ============================================================
(function () {
  'use strict';

  var audioCtx = null;
  var enabled = true;

  function getContext() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function setEnabled(on) {
    enabled = on;
  }

  function isEnabled() {
    return enabled;
  }

  // Generate a simple tone
  function playTone(freq, duration, type, volume) {
    if (!enabled) return;
    var ctx = getContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // Sound effects using synthesized tones
  function playMove() {
    playTone(800, 0.08, 'sine', 0.12);
    setTimeout(function () { playTone(600, 0.06, 'sine', 0.08); }, 40);
  }

  function playCapture() {
    playTone(400, 0.1, 'square', 0.15);
    setTimeout(function () { playTone(300, 0.15, 'square', 0.1); }, 50);
  }

  function playCheck() {
    playTone(1000, 0.12, 'sawtooth', 0.12);
    setTimeout(function () { playTone(1200, 0.12, 'sawtooth', 0.1); }, 120);
    setTimeout(function () { playTone(1000, 0.15, 'sawtooth', 0.08); }, 240);
  }

  function playGameOver(isWin) {
    if (isWin) {
      // Victory fanfare
      playTone(523, 0.15, 'sine', 0.15);
      setTimeout(function () { playTone(659, 0.15, 'sine', 0.15); }, 150);
      setTimeout(function () { playTone(784, 0.15, 'sine', 0.15); }, 300);
      setTimeout(function () { playTone(1047, 0.3, 'sine', 0.15); }, 450);
    } else {
      // Defeat
      playTone(400, 0.2, 'sine', 0.12);
      setTimeout(function () { playTone(350, 0.2, 'sine', 0.1); }, 200);
      setTimeout(function () { playTone(300, 0.3, 'sine', 0.08); }, 400);
    }
  }

  function playClick() {
    playTone(1000, 0.04, 'sine', 0.08);
  }

  // --- Export ---
  window.ChineseChess.Audio = {
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    playMove: playMove,
    playCapture: playCapture,
    playCheck: playCheck,
    playGameOver: playGameOver,
    playClick: playClick
  };
})();
