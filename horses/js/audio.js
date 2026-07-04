'use strict';

/**
 * Thunder Downs — synthesized audio (WebAudio, no assets).
 * Everything is generated: bugle call, gallop loop, crowd noise, fanfares.
 */
const GameAudio = (() => {
  let ac = null;
  let master = null;
  let muted = localStorage.getItem('horseRacing_muted') === '1';
  let noiseBuf = null;

  // race loop state
  let crowdSrc = null, crowdGain = null, crowdFilter = null;
  let gallopTimer = null, gallopNext = 0, gallopRate = 7;

  function ensure() {
    if (ac) {
      if (ac.state === 'suspended') ac.resume();
      return true;
    }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ac.destination);

      const len = ac.sampleRate * 2;
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;   // brown-ish noise
        data[i] = last * 3.5;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function tone(freq, start, dur, { type = 'triangle', vol = 0.16, slideTo = null } = {}) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.015);
    g.gain.setValueAtTime(vol, start + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function noiseHit(start, dur, freq, vol) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = 0.9 + Math.random() * 0.25;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(f).connect(g).connect(master);
    src.start(start, Math.random() * 1.2, dur + 0.05);
  }

  // ------------------------------------------------------------ public
  function toggleMute() {
    muted = !muted;
    localStorage.setItem('horseRacing_muted', muted ? '1' : '0');
    if (master) master.gain.value = muted ? 0 : 1;
    return muted;
  }
  const isMuted = () => muted;

  function click() {
    if (!ensure()) return;
    tone(660, ac.currentTime, 0.05, { type: 'sine', vol: 0.05 });
  }

  function bugle() {
    if (!ensure()) return;
    // "Call to the post"
    const t0 = ac.currentTime + 0.05;
    const G4 = 392, C5 = 523.25, E5 = 659.25, G5 = 783.99;
    const seq = [
      [G4, 0.14], [C5, 0.14], [E5, 0.14], [G5, 0.28],
      [E5, 0.14], [G5, 0.5],
    ];
    let t = t0;
    for (const [f, d] of seq) {
      tone(f, t, d, { type: 'sawtooth', vol: 0.09 });
      tone(f * 2, t, d, { type: 'sine', vol: 0.03 });
      t += d + 0.03;
    }
  }

  function gateOpen() {
    if (!ensure()) return;
    const t = ac.currentTime;
    noiseHit(t, 0.25, 2500, 0.4);
    tone(180, t, 0.12, { type: 'square', vol: 0.1, slideTo: 90 });
  }

  function startRaceLoop() {
    if (!ensure()) return;
    stopRaceLoop();
    // crowd bed
    crowdSrc = ac.createBufferSource();
    crowdSrc.buffer = noiseBuf;
    crowdSrc.loop = true;
    crowdFilter = ac.createBiquadFilter();
    crowdFilter.type = 'bandpass';
    crowdFilter.frequency.value = 950;
    crowdFilter.Q.value = 0.6;
    crowdGain = ac.createGain();
    crowdGain.gain.value = 0.015;
    crowdSrc.connect(crowdFilter).connect(crowdGain).connect(master);
    crowdSrc.start();
    // gallop scheduler
    gallopNext = ac.currentTime + 0.1;
    gallopTimer = setInterval(() => {
      if (!ac) return;
      while (gallopNext < ac.currentTime + 0.25) {
        noiseHit(gallopNext, 0.07, 420, 0.09);
        noiseHit(gallopNext + 0.06, 0.05, 300, 0.05);
        gallopNext += 1 / gallopRate + Math.random() * 0.01;
      }
    }, 100);
  }

  /** excitement / speed: 0..1 */
  function setRaceIntensity(excitement, speedNorm) {
    if (!ac) return;
    gallopRate = 5.5 + speedNorm * 3.5;
    if (crowdGain) {
      crowdGain.gain.setTargetAtTime(0.015 + excitement * 0.12, ac.currentTime, 0.4);
    }
  }

  function stopRaceLoop() {
    if (gallopTimer) { clearInterval(gallopTimer); gallopTimer = null; }
    if (crowdSrc) {
      try {
        crowdGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.5);
        const src = crowdSrc;
        setTimeout(() => { try { src.stop(); } catch (e) {} }, 1600);
      } catch (e) {}
      crowdSrc = null;
    }
  }

  function photoFlash() {
    if (!ensure()) return;
    noiseHit(ac.currentTime, 0.15, 5000, 0.25);
  }

  function winFanfare() {
    if (!ensure()) return;
    const t0 = ac.currentTime + 0.05;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      tone(f, t0 + i * 0.11, 0.22, { type: 'triangle', vol: 0.14 });
      tone(f / 2, t0 + i * 0.11, 0.22, { type: 'sine', vol: 0.06 });
    });
    tone(1046.5, t0 + 0.48, 0.55, { type: 'triangle', vol: 0.16 });
    tone(523.25, t0 + 0.48, 0.55, { type: 'sine', vol: 0.07 });
  }

  function losePlink() {
    if (!ensure()) return;
    const t0 = ac.currentTime + 0.05;
    tone(330, t0, 0.25, { type: 'sine', vol: 0.1 });
    tone(247, t0 + 0.22, 0.4, { type: 'sine', vol: 0.1 });
  }

  function cashRegister() {
    if (!ensure()) return;
    const t0 = ac.currentTime + 0.02;
    tone(1318, t0, 0.08, { type: 'square', vol: 0.05 });
    tone(1568, t0 + 0.09, 0.14, { type: 'square', vol: 0.05 });
  }

  return {
    ensure, toggleMute, isMuted, click, bugle, gateOpen,
    startRaceLoop, setRaceIntensity, stopRaceLoop,
    winFanfare, losePlink, cashRegister, photoFlash,
  };
})();
