/* audio.js — tiny WebAudio synth cues (horses/js/audio.js pattern).
 * No assets; mute persisted to localStorage. */

const MUTE_KEY = 'escapeRoom_muted';
let ctx = null;
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* ignore */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, gain = 0.06) {
  const a = ac();
  if (!a || muted) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  tap() { tone(520, 0.06, 'triangle', 0.05); },
  paper() { noise(0.18, 0.05); tone(1400, 0.05, 'triangle', 0.02); },
  item() { tone(660, 0.09, 'triangle'); tone(880, 0.12, 'triangle', 0.1, 0.08); },
  unlock() { tone(340, 0.08, 'square', 0.08); tone(510, 0.1, 'square', 0.08, 0.09); tone(680, 0.16, 'triangle', 0.1, 0.18); },
  wrong() { tone(190, 0.16, 'sawtooth', 0.07); tone(160, 0.2, 'sawtooth', 0.06, 0.12); },
  empty() { noise(0.08, 0.03); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, i * 0.16)); },
};

export function isMuted() { return muted; }

export function setMuted(m) {
  muted = !!m;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
}
