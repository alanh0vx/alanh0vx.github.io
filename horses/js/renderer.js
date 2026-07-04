'use strict';

/**
 * Thunder Downs — canvas renderer.
 * Draws the track world (meters) through a smoothed follow-camera.
 * All art is procedural; no image assets.
 */
function Renderer(canvas) {
  const ctx = canvas.getContext('2d');
  const T = Engine.TRACK;
  const hw = T.straight / 2, R = T.radius, w2 = T.width / 2;

  const WORLD = {
    minX: -(hw + R + w2 + 36), maxX: hw + R + w2 + 36,
    minY: -(R + w2 + 42), maxY: R + w2 + 46,
  };
  WORLD.w = WORLD.maxX - WORLD.minX;
  WORLD.h = WORLD.maxY - WORLD.minY;

  let cssW = 300, cssH = 150, dpr = 1;
  const cam = { cx: 0, cy: 2, zoom: 1, tx: 0, ty: 2, tz: 1 };

  // ------------------------------------------------------------ scenery (precomputed)
  const rnd = (a, b) => a + Math.random() * (b - a);

  const trees = [];
  for (let i = 0; i < 46; i++) {
    const s = Math.random() * T.lap;
    const p = Engine.pathPoint(s, w2 + rnd(8, 30));
    if (p.y > R - 10) continue; // keep the grandstand side clear
    trees.push({ x: p.x + rnd(-4, 4), y: p.y + rnd(-4, 4), r: rnd(2.2, 4.6), tone: rnd(0, 1) });
  }

  const STAND = { x0: -170, x1: 170, y0: R + w2 + 7, y1: R + w2 + 30 };
  const crowd = [];
  const crowdColors = ['#e8c39e', '#d9a066', '#c0392b', '#2980b9', '#f1c40f', '#ecf0f1', '#9b59b6', '#27ae60', '#e67e22', '#f5f5dc'];
  for (let i = 0; i < 560; i++) {
    crowd.push({
      x: rnd(STAND.x0 + 6, STAND.x1 - 6),
      y: rnd(STAND.y0 + 3.5, STAND.y1 - 2),
      c: crowdColors[Math.floor(Math.random() * crowdColors.length)],
      ph: rnd(0, Math.PI * 2),
    });
  }

  // dirt harrow line offsets
  const harrows = [];
  for (let off = -w2 + 2.2; off < w2 - 1; off += 2.4) harrows.push(off);

  // ------------------------------------------------------------ particles
  const dust = [];
  let rain = [];

  function initRain(count) {
    rain = [];
    for (let i = 0; i < count; i++) {
      rain.push({ x: Math.random() * cssW, y: Math.random() * cssH, spd: rnd(380, 620), len: rnd(8, 16) });
    }
  }

  // ------------------------------------------------------------ camera & sizing
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    if (rain.length) initRain(rain.length);
  }

  const fitZoom = () => Math.min(cssW / WORLD.w, cssH / WORLD.h) * 0.985;

  function updateCamera(state, dt) {
    const fz = fitZoom();
    const sim = state.sim;
    if (state.mode === 'race' && sim && sim.started && !sim.done) {
      const live = sim.runners.filter((r) => !r.finished);
      const group = live.length ? live : sim.runners;
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (const r of group) {
        const p = sim.pos(r);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      const margin = 30;
      const bw = maxX - minX + margin * 2, bh = maxY - minY + margin * 2;
      cam.tz = Math.max(fz, Math.min(cssW / bw, cssH / bh, 6.5));
      cam.tx = (minX + maxX) / 2;
      cam.ty = (minY + maxY) / 2;
      // clamp view inside world
      const vw = cssW / cam.tz / 2, vh = cssH / cam.tz / 2;
      cam.tx = Math.max(WORLD.minX + vw, Math.min(WORLD.maxX - vw, cam.tx));
      cam.ty = Math.max(WORLD.minY + vh, Math.min(WORLD.maxY - vh, cam.ty));
    } else {
      cam.tz = fz;
      cam.tx = 0;
      cam.ty = (WORLD.minY + WORLD.maxY) / 2;
    }
    const k = Math.min(1, dt * 2.6);
    cam.cx += (cam.tx - cam.cx) * k;
    cam.cy += (cam.ty - cam.cy) * k;
    cam.zoom += (cam.tz - cam.zoom) * Math.min(1, dt * 2.2);
  }

  const project = (x, y) => ({
    x: cssW / 2 + (x - cam.cx) * cam.zoom,
    y: cssH / 2 + (y - cam.cy) * cam.zoom,
  });

  // ------------------------------------------------------------ track path helpers
  function ovalPath(off) {
    ctx.beginPath();
    ctx.moveTo(-hw, R + off);
    ctx.lineTo(hw, R + off);
    ctx.arc(hw, 0, R + off, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(-hw, -R - off);
    ctx.arc(-hw, 0, R + off, -Math.PI / 2, Math.PI / 2, true);
    ctx.closePath();
  }

  function crossTrackLine(s, inset = 0) {
    const a = Engine.pathPoint(s, -w2 + inset);
    const b = Engine.pathPoint(s, w2 - inset);
    return [a, b];
  }

  // ------------------------------------------------------------ drawing
  function drawBackground(race) {
    const wet = race && /Rain/.test(race.weather.name);
    ctx.fillStyle = wet ? '#2f5c33' : '#3a7440';
    ctx.fillRect(WORLD.minX - 50, WORLD.minY - 50, WORLD.w + 100, WORLD.h + 100);
    // mowing stripes
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffffff';
    for (let x = WORLD.minX; x < WORLD.maxX; x += 24) ctx.fillRect(x, WORLD.minY - 50, 12, WORLD.h + 100);
    ctx.globalAlpha = 1;
  }

  function drawTrees(t) {
    for (const tr of trees) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(tr.x + 1.2, tr.y + 1.4, tr.r, tr.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tr.tone > 0.5 ? '#2d5a27' : '#356b2e';
      ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.3, tr.y - tr.r * 0.3, tr.r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawDirt(race) {
    const wet = race && (/Rain/.test(race.weather.name) || race.going.name === 'Soft' || race.going.name === 'Heavy');
    ovalPath(w2);
    ctx.fillStyle = wet ? '#7d5a3c' : '#b3855a';
    ctx.fill();
    ovalPath(-w2);
    ctx.fillStyle = wet ? '#33632f' : '#3f8046';
    ctx.fill();

    // harrow lines
    ctx.strokeStyle = wet ? 'rgba(40,25,12,0.16)' : 'rgba(90,60,30,0.18)';
    ctx.lineWidth = 0.35;
    for (const off of harrows) { ovalPath(off); ctx.stroke(); }

    // rails
    ctx.strokeStyle = '#f4f4f0';
    ctx.lineWidth = 0.85;
    ovalPath(-w2); ctx.stroke();
    ovalPath(w2); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.3;
    ovalPath(-w2 - 0.6); ctx.stroke();
  }

  function drawFurlongMarkers(race) {
    if (!race) return;
    const n = Math.floor(race.distance / 200);
    for (let i = 1; i <= n; i++) {
      const s = T.finishS - i * 200;
      const p = Engine.pathPoint(s, -w2 - 2.6);
      ctx.fillStyle = '#f4f4f0';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d7ed8';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.0, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawFinishLine() {
    const [a, b] = crossTrackLine(T.finishS);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      ctx.strokeStyle = i % 2 ? '#111' : '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x + (dx * i) / steps, a.y + (dy * i) / steps);
      ctx.lineTo(a.x + (dx * (i + 1)) / steps, a.y + (dy * (i + 1)) / steps);
      ctx.stroke();
    }
    // winning post (infield side)
    const post = Engine.pathPoint(T.finishS, -w2 - 1.6);
    ctx.strokeStyle = '#d62828';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(post.x, post.y); ctx.lineTo(post.x, post.y - 6); ctx.stroke();
    ctx.fillStyle = '#d62828';
    ctx.beginPath();
    ctx.moveTo(post.x, post.y - 6);
    ctx.lineTo(post.x + 4, post.y - 5);
    ctx.lineTo(post.x, post.y - 4);
    ctx.closePath(); ctx.fill();
  }

  function drawStartGate(sim, raceTime) {
    if (!sim) return;
    const alpha = sim.started ? Math.max(0, 1 - raceTime / 3.5) : 1;
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    const s = sim.startS;
    const [a, b] = crossTrackLine(s);
    ctx.strokeStyle = '#e8e8e2';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    // stalls
    const n = sim.runners.length + 1;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#c9c9c2';
    for (let i = 0; i < n; i++) {
      const off = -w2 + 1.4 + i * T.laneGap - T.laneGap / 2;
      if (off > w2) break;
      const p0 = Engine.pathPoint(s - 2.4, off);
      const p1 = Engine.pathPoint(s + 0.6, off);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawInfield(race, t) {
    // pond
    ctx.fillStyle = '#3a6ea5';
    ctx.beginPath(); ctx.ellipse(-88, 6, 26, 12, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(-94, 3 + Math.sin(t * 0.8) * 0.4, 9, 3, -0.2, 0, Math.PI * 2); ctx.fill();

    // flower beds by the winning post
    const fp = Engine.pathPoint(T.finishS, -w2 - 6);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#e05263' : i % 3 === 1 ? '#f4a416' : '#f8f9fa';
      ctx.beginPath();
      ctx.arc(fp.x - 12 + i * 2.1, fp.y + Math.sin(i * 2.4) * 1.4, 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    // tote board
    const bx = 30, by = -16, bw = 88, bh = 22;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(bx - bw / 2 + 1.5, by - bh / 2 + 1.8, bw, bh);
    ctx.fillStyle = '#182126';
    ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
    ctx.fillStyle = '#ff6b35';
    ctx.textAlign = 'center';
    ctx.font = '700 7px system-ui, sans-serif';
    ctx.fillText('THUNDER DOWNS', bx, by - 1.5);
    ctx.fillStyle = '#dfe6ea';
    ctx.font = '600 4.6px system-ui, sans-serif';
    if (race) ctx.fillText(`R${race.raceNo} • ${race.name} • ${race.distance}m • ${race.going.name}`, bx, by + 5.5);
    // legs
    ctx.strokeStyle = '#182126';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - bw / 3, by + bh / 2); ctx.lineTo(bx - bw / 3, by + bh / 2 + 4);
    ctx.moveTo(bx + bw / 3, by + bh / 2); ctx.lineTo(bx + bw / 3, by + bh / 2 + 4);
    ctx.stroke();
  }

  function drawGrandstand(t, excitement) {
    // roof + tiers
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(STAND.x0 + 2, STAND.y0 + 2, STAND.x1 - STAND.x0, STAND.y1 - STAND.y0);
    const grad = ctx.createLinearGradient(0, STAND.y0, 0, STAND.y1);
    grad.addColorStop(0, '#4b5563');
    grad.addColorStop(1, '#2f3742');
    ctx.fillStyle = grad;
    ctx.fillRect(STAND.x0, STAND.y0, STAND.x1 - STAND.x0, STAND.y1 - STAND.y0);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(STAND.x0, STAND.y0, STAND.x1 - STAND.x0, 1.6);
    // pillars
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = STAND.x0 + 20; x < STAND.x1; x += 40) ctx.fillRect(x, STAND.y0, 2, STAND.y1 - STAND.y0);
    // crowd
    const jitter = 0.35 + excitement * 1.1;
    for (const c of crowd) {
      ctx.fillStyle = c.c;
      const bounce = excitement > 0.15 ? Math.max(0, Math.sin(t * 7 + c.ph)) * jitter : Math.sin(t * 1.2 + c.ph) * 0.12;
      ctx.fillRect(c.x, c.y - bounce, 0.9, 0.9);
    }
  }

  function drawHorse(r, p, k, t, isBet) {
    const h = r.h;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.heading);
    ctx.scale(k, k);

    // bet highlight ring
    if (isBet) {
      ctx.strokeStyle = 'rgba(255,214,10,0.85)';
      ctx.lineWidth = 0.22;
      ctx.beginPath(); ctx.ellipse(0, 0, 2.1, 1.15, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(0.08, 0.22, 1.35, 0.5, 0, 0, Math.PI * 2); ctx.fill();

    const coat = h.coat.body, mane = h.coat.mane;
    const ph = r.gallopPhase + (r.v < 1 ? t * 1.8 : 0);
    const stride = r.v < 1 ? 0.1 : Math.min(1, r.v / 14);

    // legs (two pairs, galloping)
    ctx.strokeStyle = mane;
    ctx.lineWidth = 0.16;
    ctx.lineCap = 'round';
    const legs = [
      [0.72, -0.26, 0], [0.72, 0.26, 0.9],
      [-0.78, -0.26, 3.4], [-0.78, 0.26, 4.2],
    ];
    for (const [lx, ly, lp] of legs) {
      const ext = Math.sin(ph + lp) * 0.52 * stride;
      ctx.beginPath();
      ctx.moveTo(lx, ly * 0.6);
      ctx.lineTo(lx + ext, ly);
      ctx.stroke();
    }

    // tail
    ctx.strokeStyle = mane;
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ctx.moveTo(-1.22, 0);
    ctx.quadraticCurveTo(-1.6, Math.sin(t * 3 + h.id) * 0.15, -1.85 - stride * 0.25, Math.sin(ph * 0.5) * 0.18);
    ctx.stroke();

    // body
    const bodyGrad = ctx.createLinearGradient(0, -0.5, 0, 0.5);
    bodyGrad.addColorStop(0, lighten(coat, 18));
    bodyGrad.addColorStop(1, coat);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.ellipse(-0.05, 0, 1.2, 0.44, 0, 0, Math.PI * 2); ctx.fill();

    // neck + head
    ctx.fillStyle = coat;
    ctx.beginPath(); ctx.ellipse(0.98, 0, 0.5, 0.24, 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.5, 0.02, 0.3, 0.15, 0.1, 0, Math.PI * 2); ctx.fill();
    // ears
    ctx.fillStyle = mane;
    ctx.beginPath(); ctx.arc(1.32, -0.12, 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.32, 0.12, 0.07, 0, Math.PI * 2); ctx.fill();
    // mane
    ctx.strokeStyle = mane;
    ctx.lineWidth = 0.14;
    ctx.beginPath(); ctx.moveTo(0.62, -0.06); ctx.quadraticCurveTo(1.0, -0.16, 1.3, -0.06); ctx.stroke();

    // saddle cloth + number
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(-0.42, -0.4, 0.72, 0.8);
    ctx.fillStyle = '#111';
    ctx.font = '700 0.62px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(-0.06, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(String(h.number), 0, 0);
    ctx.restore();

    // jockey
    const bob = Math.sin(ph) * 0.05 * stride;
    ctx.fillStyle = h.silks.primary;
    ctx.beginPath(); ctx.ellipse(-0.18 + bob, 0, 0.3, 0.24, 0, 0, Math.PI * 2); ctx.fill();
    if (h.silks.pattern !== 'solid') {
      ctx.fillStyle = h.silks.secondary;
      if (h.silks.pattern === 'stripes' || h.silks.pattern === 'sash') ctx.fillRect(-0.26 + bob, -0.22, 0.16, 0.44);
      else if (h.silks.pattern === 'hoops') ctx.fillRect(-0.4 + bob, -0.07, 0.44, 0.14);
      else { ctx.beginPath(); ctx.arc(-0.18 + bob, 0, 0.09, 0, Math.PI * 2); ctx.fill(); }
    }
    // helmet
    ctx.fillStyle = h.silks.secondary;
    ctx.beginPath(); ctx.arc(0.08 + bob, 0, 0.13, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  // ------------------------------------------------------------ particles
  function spawnDust(sim, race, dt) {
    if (!sim || !sim.started) return;
    const wet = /Rain/.test(race.weather.name) || race.going.name === 'Soft' || race.going.name === 'Heavy';
    for (const r of sim.runners) {
      if (r.finished || r.v < 11) continue;
      if (Math.random() < dt * 9) {
        const p = sim.pos(r);
        dust.push({
          x: p.x - Math.cos(p.heading) * 1.4 + rnd(-0.4, 0.4),
          y: p.y - Math.sin(p.heading) * 1.4 + rnd(-0.4, 0.4),
          vx: -Math.cos(p.heading) * rnd(1, 3) + rnd(-1, 1),
          vy: -Math.sin(p.heading) * rnd(1, 3) + rnd(-1, 1) - (wet ? 0 : 0.8),
          life: 0, max: wet ? rnd(0.25, 0.5) : rnd(0.45, 0.9),
          size: wet ? rnd(0.25, 0.5) : rnd(0.5, 1.3),
          wet,
        });
      }
    }
  }

  function drawDust(dt) {
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i];
      d.life += dt;
      if (d.life > d.max) { dust.splice(i, 1); continue; }
      d.x += d.vx * dt; d.y += d.vy * dt;
      const a = (1 - d.life / d.max) * (d.wet ? 0.4 : 0.3);
      ctx.fillStyle = d.wet ? `rgba(70,50,30,${a})` : `rgba(190,150,105,${a})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.size * (1 + d.life * 1.5), 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawWeatherScreen(race, dt) {
    if (!race) return;
    const name = race.weather.name;
    if (/Rain/.test(name)) {
      const want = name === 'Heavy Rain' ? 110 : 50;
      if (rain.length !== want) initRain(want);
      const drift = race.wind * 1.6;
      ctx.strokeStyle = 'rgba(185,205,235,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const r of rain) {
        r.y += r.spd * dt; r.x += drift * dt;
        if (r.y > cssH) { r.y = -r.len; r.x = Math.random() * cssW; }
        if (r.x > cssW) r.x -= cssW;
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - drift * 0.02, r.y - r.len);
      }
      ctx.stroke();
      ctx.fillStyle = name === 'Heavy Rain' ? 'rgba(30,45,70,0.16)' : 'rgba(40,55,80,0.09)';
      ctx.fillRect(0, 0, cssW, cssH);
    } else if (name === 'Overcast' || name === 'Cloudy') {
      ctx.fillStyle = 'rgba(90,100,110,0.07)';
      ctx.fillRect(0, 0, cssW, cssH);
    } else if (name === 'Sunny') {
      ctx.fillStyle = 'rgba(255,220,130,0.05)';
      ctx.fillRect(0, 0, cssW, cssH);
    }
  }

  // ------------------------------------------------------------ main render
  function render(state, dt) {
    const { race, sim } = state;
    updateCamera(state, dt);
    const t = state.time;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // world transform
    ctx.setTransform(
      cam.zoom * dpr, 0, 0, cam.zoom * dpr,
      dpr * (cssW / 2 - cam.cx * cam.zoom),
      dpr * (cssH / 2 - cam.cy * cam.zoom)
    );

    drawBackground(race);
    drawTrees(t);
    drawDirt(race);
    drawFurlongMarkers(race);
    drawFinishLine();
    drawStartGate(sim, state.raceTime || 0);
    drawInfield(race, t);
    drawGrandstand(t, state.excitement || 0);

    // horses (painter's order by screen y)
    if (sim) {
      spawnDust(sim, race, dt);
      drawDust(dt);
      const order = [...sim.runners];
      const poses = new Map(order.map((r) => [r, sim.pos(r)]));
      order.sort((a, b) => poses.get(a).y - poses.get(b).y);
      const k = Math.max(1, Math.min(3.6, 20 / (2.6 * cam.zoom))); // oversize horses at low zoom
      for (const r of order) {
        drawHorse(r, poses.get(r), k, t, state.betIds && state.betIds.has(r.h.id));
      }

      // screen-space number bubbles (once the field has left the gate)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const r of sim.started ? sim.runners : []) {
        const p = poses.get(r);
        const sp = project(p.x, p.y);
        const by = sp.y - Math.max(14, 2.6 * cam.zoom * k * 0.55) - 6;
        ctx.fillStyle = r.h.silks.primary;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sp.x, by, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = contrastText(r.h.silks.primary);
        ctx.font = '700 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(r.h.number), sp.x, by + 0.5);
      }
    }

    // screen-space weather
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWeatherScreen(race, dt);

    // vignette
    const vg = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.45, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function contrastText(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff);
    return lum > 150 ? '#111' : '#fff';
  }

  return { render, resize };
}
