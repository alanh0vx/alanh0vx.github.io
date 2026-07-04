'use strict';

/**
 * Thunder Downs — race engine.
 * Pure logic: track geometry, horse generation, odds market, race simulation.
 * No DOM access, so it can be unit-tested in Node.
 */
const Engine = (() => {

  // ---------------------------------------------------------------- helpers
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (v, m) => ((v % m) + m) % m;

  function weightedPick(items, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  // ---------------------------------------------------------------- track geometry (meters)
  // Oval: two straights joined by two semicircular turns. Horses run
  // counter-clockwise (bottom straight left → right). s = distance along the
  // centerline; off = lateral offset (negative → infield rail).
  const TRACK = { straight: 300, radius: 100, width: 19, laneGap: 1.7 };
  TRACK.lap = 2 * TRACK.straight + 2 * Math.PI * TRACK.radius; // ≈ 1228 m
  TRACK.finishS = TRACK.straight * 0.82;                        // on the home straight

  function pathPoint(s, off = 0) {
    const L = TRACK.straight, R = TRACK.radius, hw = L / 2;
    const turn = Math.PI * R;
    s = mod(s, TRACK.lap);
    if (s < L) {                                   // home (bottom) straight, +x
      return { x: -hw + s, y: R + off, heading: 0, turn: false };
    }
    s -= L;
    if (s < turn) {                                // right-hand turn
      const th = Math.PI / 2 - s / R;
      return {
        x: hw + (R + off) * Math.cos(th),
        y: (R + off) * Math.sin(th),
        heading: Math.atan2(-Math.cos(th), Math.sin(th)),
        turn: true,
      };
    }
    s -= turn;
    if (s < L) {                                   // back (top) straight, -x
      return { x: hw - s, y: -R - off, heading: Math.PI, turn: false };
    }
    s -= L;
    const th = -Math.PI / 2 - s / R;               // left-hand turn
    return {
      x: -hw + (R + off) * Math.cos(th),
      y: (R + off) * Math.sin(th),
      heading: Math.atan2(-Math.cos(th), Math.sin(th)),
      turn: true,
    };
  }

  const laneOffset = (lane) => -TRACK.width / 2 + 1.4 + lane * TRACK.laneGap;

  // ---------------------------------------------------------------- static data
  const NAMES = [
    'Thunder Bolt', 'Lightning Strike', 'Storm Chaser', 'Wind Runner', 'Fire Dancer',
    'Shadow Walker', 'Golden Arrow', 'Silver Bullet', 'Midnight Express', 'Dawn Breaker',
    'Royal Crown', 'Diamond Dust', 'Crimson Flash', 'Emerald Dream', 'Sapphire Star',
    'Iron Duke', 'Velvet Rocket', 'Northern Gale', 'Desert Mirage', 'Lucky Charm',
    'Bold Venture', 'Sea Biscuit Jr', 'Copper Canyon', 'Wild Symphony', 'Night Fury',
    'Amber Waves', 'Steel Resolve', 'Phantom Rider', 'Sunset Blaze', 'Frost Giant',
    'Merry Monarch', 'Quick Silver', 'Blazing Saddle', 'Ocean Drift', 'Star Admiral',
    'Rebel Heart', 'Winter Rose', 'Jade Emperor', 'Comet Tail', 'Brave Companion',
    'High Voltage', 'Paper Moon', 'Turbo Legacy', 'Grand Slam', 'Neon Knight',
  ];

  const BREEDS = ['Thoroughbred', 'Arabian', 'Quarter Horse', 'Standardbred', 'Akhal-Teke', 'Anglo-Arab'];

  const COATS = [
    { name: 'Bay', body: '#7a4a21', mane: '#3c2410' },
    { name: 'Dark Bay', body: '#57351a', mane: '#2b1a0c' },
    { name: 'Chestnut', body: '#94502b', mane: '#6b3418' },
    { name: 'Black', body: '#33322f', mane: '#151513' },
    { name: 'Grey', body: '#a9a9b2', mane: '#6f6f78' },
    { name: 'Palomino', body: '#c8a24f', mane: '#e8dcae' },
    { name: 'Roan', body: '#8d6f66', mane: '#4c3b34' },
    { name: 'White', body: '#dcd9d2', mane: '#b6b2a8' },
  ];

  const JOCKEYS = [
    { name: 'J. Santos', skill: 93 }, { name: 'M. Rodriguez', skill: 89 },
    { name: 'K. Nakamura', skill: 87 }, { name: 'A. Williams', skill: 85 },
    { name: 'C. Beaumont', skill: 84 }, { name: 'D. O’Leary', skill: 82 },
    { name: 'R. Garcia', skill: 80 }, { name: 'L. Chen', skill: 79 },
    { name: 'S. Dubois', skill: 77 }, { name: 'T. Wilson', skill: 75 },
    { name: 'B. Andersson', skill: 73 }, { name: 'N. Taylor', skill: 71 },
    { name: 'F. Rossi', skill: 69 }, { name: 'G. Jackson', skill: 67 },
    { name: 'H. Whitfield', skill: 64 }, { name: 'P. Novak', skill: 61 },
  ];

  const SILKS = [
    { primary: '#e63946', secondary: '#ffffff' }, { primary: '#1d7ed8', secondary: '#ffd60a' },
    { primary: '#2a9d4f', secondary: '#ffffff' }, { primary: '#f4a416', secondary: '#1a1a1a' },
    { primary: '#8338ec', secondary: '#ffffff' }, { primary: '#f8f9fa', secondary: '#d62828' },
    { primary: '#00b4d8', secondary: '#03045e' }, { primary: '#ff6b9d', secondary: '#ffffff' },
    { primary: '#264653', secondary: '#e9c46a' }, { primary: '#111827', secondary: '#f97316' },
  ];
  const PATTERNS = ['solid', 'stripes', 'hoops', 'sash', 'dots', 'quarters'];

  const WEATHER = [
    { name: 'Sunny', icon: '☀️', speed: 1.0, drain: 1.03, goingW: [0.5, 0.35, 0.1, 0.05, 0] },
    { name: 'Cloudy', icon: '⛅', speed: 1.0, drain: 1.0, goingW: [0.3, 0.4, 0.2, 0.1, 0] },
    { name: 'Overcast', icon: '☁️', speed: 0.995, drain: 0.98, goingW: [0.2, 0.35, 0.25, 0.15, 0.05] },
    { name: 'Light Rain', icon: '🌦️', speed: 0.97, drain: 1.02, goingW: [0, 0.15, 0.3, 0.35, 0.2] },
    { name: 'Heavy Rain', icon: '🌧️', speed: 0.94, drain: 1.06, goingW: [0, 0, 0.15, 0.4, 0.45] },
    { name: 'Windy', icon: '💨', speed: 0.975, drain: 1.04, goingW: [0.35, 0.35, 0.2, 0.1, 0] },
  ];

  const GOING = [
    { name: 'Firm', speed: 1.0, drain: 1.0 },
    { name: 'Good', speed: 0.985, drain: 1.0 },
    { name: 'Yielding', speed: 0.965, drain: 1.03 },
    { name: 'Soft', speed: 0.94, drain: 1.08 },
    { name: 'Heavy', speed: 0.91, drain: 1.14 },
  ];

  const STYLES = [
    { id: 'front', label: 'Front-runner' },
    { id: 'stalker', label: 'Stalker' },
    { id: 'closer', label: 'Closer' },
  ];

  const DIST_CATS = [
    { id: 'sprint', label: 'Sprint' },
    { id: 'mile', label: 'Mile' },
    { id: 'staying', label: 'Staying' },
  ];
  const distCat = (d) => (d <= 1200 ? 'sprint' : d <= 1800 ? 'mile' : 'staying');

  // Stat weights per distance category (speed / stamina / accel / experience)
  const WEIGHTS = {
    sprint: { speed: 0.45, stamina: 0.15, accel: 0.25, exp: 0.15 },
    mile: { speed: 0.35, stamina: 0.3, accel: 0.15, exp: 0.2 },
    staying: { speed: 0.25, stamina: 0.45, accel: 0.1, exp: 0.2 },
  };

  const TIERS = [
    { id: 0, name: 'Maiden Stakes', short: 'Maiden', runners: 6, unlock: 0, maxBet: 200, exotics: false, dists: [1000, 1200], classBoost: 0 },
    { id: 1, name: 'Metro Handicap', short: 'Handicap', runners: 8, unlock: 2500, maxBet: 1000, exotics: true, dists: [1200, 1600], classBoost: 6 },
    { id: 2, name: 'Golden Cup', short: 'Cup', runners: 9, unlock: 6000, maxBet: 5000, exotics: true, dists: [1600, 2000], classBoost: 12 },
    { id: 3, name: 'Thunder Downs Championship', short: 'Championship', runners: 10, unlock: 15000, maxBet: 25000, exotics: true, dists: [2000, 2400], classBoost: 18 },
  ];

  const RACE_NAMES = {
    0: ['Maiden Stakes', 'Debutante Plate', 'Newcomers Trial', 'First Light Maiden'],
    1: ['Metro Handicap', 'City Mile Handicap', 'Harbour Sprint Trophy', 'Riverside Handicap'],
    2: ['Golden Cup', 'Autumn Classic', 'Governor’s Plate', 'Sunset Gold Cup'],
    3: ['Thunder Downs Championship', 'Grand International', 'Champions Crown', 'The Thunder Invitational'],
  };

  // ---------------------------------------------------------------- horse & race generation
  function generateHorse(index, tier, used) {
    let name;
    do { name = pick(NAMES); } while (used.names.has(name));
    used.names.add(name);

    let silkIdx;
    do { silkIdx = randInt(0, SILKS.length - 1); } while (used.silks.has(silkIdx));
    used.silks.add(silkIdx);

    const lo = 48 + tier.classBoost, hi = 84 + tier.classBoost;
    const stats = {
      speed: randInt(lo, hi),
      stamina: randInt(lo, hi),
      accel: randInt(lo, hi),
      consistency: randInt(45, 95),
      experience: randInt(lo - 8, hi + 6),
    };

    return {
      id: index,
      number: index + 1,
      name,
      breed: pick(BREEDS),
      coat: pick(COATS),
      age: randInt(3, 8),
      silks: { ...SILKS[silkIdx], pattern: pick(PATTERNS) },
      jockey: pick(JOCKEYS),
      style: pick(STYLES),
      stats,
      distPref: pick(DIST_CATS).id,
      weatherPref: pick(WEATHER).name,
      goingPref: pick(GOING).name,
      form: generateForm(),
      // filled in by computeMarket:
      rating: 0, prob: 0, fairOdds: 0, odds: 0, openOdds: 0,
    };
  }

  function generateForm() {
    const form = [];
    for (let i = 0; i < 5; i++) {
      form.push(weightedPick(['W', 'P', 'S', 'L'], [0.16, 0.2, 0.24, 0.4]));
    }
    return form;
  }

  const FORM_SCORE = { W: 3, P: 2, S: 1, L: 0 };
  const formScore = (form) => form.reduce((s, r) => s + FORM_SCORE[r], 0) / form.length;

  function effRating(h, race) {
    const cat = distCat(race.distance);
    const w = WEIGHTS[cat];
    let r = h.stats.speed * w.speed + h.stats.stamina * w.stamina +
            h.stats.accel * w.accel + h.stats.experience * w.exp;
    r += h.distPref === cat ? 4 : -2;
    r += h.goingPref === race.going.name ? 3 : 0;
    r += h.weatherPref === race.weather.name ? 2.5 : 0;
    r += (formScore(h.form) - 1.1) * 2.2;
    r += (h.jockey.skill - 75) * 0.12;
    return r;
  }

  function roundOdds(o) {
    if (o < 5) return Math.round(o * 10) / 10;
    if (o < 15) return Math.round(o * 2) / 2;
    return Math.round(o);
  }

  const OVERROUND = 1.16; // bookmaker margin

  function computeMarket(race) {
    const ratings = race.horses.map((h) => effRating(h, race));
    const exps = ratings.map((r) => Math.exp(r / 6.5));
    const total = exps.reduce((s, e) => s + e, 0);
    race.horses.forEach((h, i) => {
      h.rating = ratings[i];
      h.prob = exps[i] / total;
      h.fairOdds = 1 / h.prob;
      const market = clamp((h.fairOdds / OVERROUND) * rand(0.94, 1.06), 1.25, 60);
      h.odds = roundOdds(market);
      h.openOdds = h.odds;
    });
  }

  /** Gentle live-market drift; call every few seconds pre-race. */
  function marketTick(race) {
    const moved = [];
    const n = randInt(1, 3);
    for (let i = 0; i < n; i++) {
      const h = pick(race.horses);
      const anchor = h.fairOdds / OVERROUND;
      const drifted = h.odds * rand(0.94, 1.06) * (h.odds > anchor * 1.18 ? 0.97 : h.odds < anchor * 0.82 ? 1.03 : 1);
      const next = roundOdds(clamp(drifted, 1.2, 65));
      if (next !== h.odds) {
        moved.push({ id: h.id, from: h.odds, to: next });
        h.odds = next;
      }
    }
    return moved;
  }

  function createRace(tierId, raceNo) {
    const tier = TIERS[tierId];
    const weather = pick(WEATHER);
    const going = weightedPick(GOING, weather.goingW);
    const distance = pick(tier.dists);
    const used = { names: new Set(), silks: new Set() };
    const horses = [];
    for (let i = 0; i < tier.runners; i++) horses.push(generateHorse(i, tier, used));

    const race = {
      tier,
      raceNo,
      name: pick(RACE_NAMES[tierId]),
      distance,
      distCat: distCat(distance),
      weather,
      going,
      temperature: randInt(14, 32),
      wind: randInt(3, 28),
      horses,
    };
    computeMarket(race);
    return race;
  }

  // ---------------------------------------------------------------- bet pricing
  const placeOdds = (winOdds) => Math.max(1.05, roundOdds(1 + (winOdds - 1) * 0.34));
  const showOdds = (winOdds) => Math.max(1.03, roundOdds(1 + (winOdds - 1) * 0.17));

  function exactaOdds(race, aId, bId) {
    const a = race.horses.find((h) => h.id === aId);
    const b = race.horses.find((h) => h.id === bId);
    if (!a || !b || a === b) return 0;
    const p = a.prob * (b.prob / (1 - a.prob));
    return roundOdds(clamp(0.82 / p, 4, 800));
  }

  function quinellaOdds(race, aId, bId) {
    const a = race.horses.find((h) => h.id === aId);
    const b = race.horses.find((h) => h.id === bId);
    if (!a || !b || a === b) return 0;
    const p = a.prob * (b.prob / (1 - a.prob)) + b.prob * (a.prob / (1 - b.prob));
    return roundOdds(clamp(0.82 / p, 2.5, 400));
  }

  /** Settle a list of bets against final results (array of horse ids in finish order). */
  function settleBets(bets, order) {
    return bets.map((bet) => {
      let won = false;
      if (bet.type === 'win') won = order[0] === bet.horses[0];
      else if (bet.type === 'place') won = order.slice(0, 2).includes(bet.horses[0]);
      else if (bet.type === 'show') won = order.slice(0, 3).includes(bet.horses[0]);
      else if (bet.type === 'exacta') won = order[0] === bet.horses[0] && order[1] === bet.horses[1];
      else if (bet.type === 'quinella') {
        const top2 = order.slice(0, 2);
        won = top2.includes(bet.horses[0]) && top2.includes(bet.horses[1]);
      }
      const payout = won ? Math.round(bet.stake * bet.odds) : 0;
      return { ...bet, won, payout, net: payout - bet.stake };
    });
  }

  // ---------------------------------------------------------------- race simulation
  const LENGTH = 2.4;      // one "length" in meters
  const BASE_PACE = 16.2;  // reference sustainable pace, m/s

  function createSim(race) {
    const D = race.distance;
    const startS = mod(TRACK.finishS - D, TRACK.lap);
    const startLanes = race.horses.map((_, i) => i);
    // random barrier draw
    for (let i = startLanes.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [startLanes[i], startLanes[j]] = [startLanes[j], startLanes[i]];
    }

    const runners = race.horses.map((h, i) => ({
      h,
      d: 0,                 // official distance covered
      v: 0,
      lane: startLanes[i],
      laneF: startLanes[i], // fractional lane for smooth movement
      targetLane: startLanes[i],
      energy: 100,
      time: 0,
      finished: false,
      finishTime: 0,
      place: 0,
      breakQ: clamp(0.78 + rand(0.34) + (h.stats.experience - 60) * 0.002, 0.68, 1.15),
      // day-to-day form, with rare big days / off days so longshots can fire
      dayForm: rand(0.968, 1.032) +
               (Math.random() < 0.09 ? rand(0.008, 0.035) : 0) -
               (Math.random() < 0.09 ? rand(0.008, 0.035) : 0),
      np1: rand(10), np2: rand(10),
      f1: rand(0.25, 0.6), f2: rand(1.1, 2.2),
      gallopPhase: rand(Math.PI * 2),
    }));

    const sim = {
      race, D, startS, runners,
      t: 0,
      started: false,
      done: false,
      results: [],           // runners in finish order
      leaderId: -1,
      laneTimer: 0,
      flags: { straightCalled: false, halfCalled: false },
    };

    /** world position of a runner (for rendering). */
    sim.pos = (r) => pathPoint(startS + r.d, laneOffset(r.laneF));

    sim.standings = () => {
      const arr = [...runners];
      arr.sort((a, b) => {
        if (a.finished && b.finished) return a.finishTime - b.finishTime;
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.d - a.d;
      });
      return arr;
    };

    sim.start = () => {
      sim.started = true;
      const evts = [{ type: 'off' }];
      runners.forEach((r) => { if (r.breakQ < 0.88) evts.push({ type: 'slowBreak', horse: r.h }); });
      return evts;
    };

    sim.tick = (dt) => {
      if (!sim.started || sim.done) return [];
      const events = [];
      sim.t += dt;
      sim.laneTimer += dt;
      const decideLanes = sim.laneTimer > 0.25;
      if (decideLanes) sim.laneTimer = 0;

      const wMod = race.weather.speed * race.going.speed;
      const drainEnv = race.weather.drain * race.going.drain;

      for (const r of runners) {
        if (r.finished) continue;
        const h = r.h;
        const p = r.d / D;

        // ---- target speed
        const base = (15.85 + (h.rating - 70) * 0.034) * wMod * r.dayForm;

        let phase;
        const style = h.style.id;
        if (p < 0.22) phase = style === 'front' ? 1.045 : style === 'stalker' ? 1.0 : 0.965;
        else if (p < 0.72) phase = style === 'front' ? 1.012 : style === 'stalker' ? 1.0 : 0.99;
        else {
          const kickPow = (style === 'closer' ? 0.075 : style === 'stalker' ? 0.05 : 0.018) *
                          (0.4 + 0.6 * (h.stats.accel / 100));
          const eR = clamp(r.energy / 40, 0, 1);
          phase = 1 + kickPow * Math.min(1, (p - 0.72) / 0.12) * eR;
        }

        const fade = r.energy > 25 ? 1 : r.energy > 0 ? 0.86 + 0.14 * (r.energy / 25) : 0.82;

        const amp = 0.012 + (100 - h.stats.consistency) * 0.0004;
        const noise = 1 + amp * (Math.sin(sim.t * r.f1 + r.np1) + Math.sin(sim.t * r.f2 + r.np2)) / 2;

        // slipstream: tucked in behind another runner
        let slip = 1, slipDrain = 1;
        for (const o of runners) {
          if (o === r || o.finished) continue;
          const gap = o.d - r.d;
          if (gap > 2.5 && gap < 7 && Math.abs(o.laneF - r.laneF) < 0.6) { slip = 1.013; slipDrain = 0.93; break; }
        }

        // traffic: blocked behind a slower horse
        let blocked = false;
        let minAheadV = Infinity;
        for (const o of runners) {
          if (o === r || o.finished) continue;
          const gap = o.d - r.d;
          if (gap > 0 && gap < 5.5 && Math.abs(o.laneF - r.laneF) < 0.8) {
            blocked = true;
            minAheadV = Math.min(minAheadV, o.v);
          }
        }

        let target = base * phase * fade * noise * slip;
        if (blocked && minAheadV < target) target = Math.max(minAheadV * 0.995, target * 0.97);

        // pack compression: far-back runners save ground and keep on; clear
        // leaders ease fractionally. Tightens finishes without flipping results.
        let maxD = 0;
        for (const o of runners) if (o.d > maxD) maxD = o.d;
        const gapL = (maxD - r.d) / LENGTH;
        if (gapL > 2) target *= 1 + 0.052 * Math.min(1, (gapL - 2) / 8);
        else if (gapL < 0.5 && p > 0.3) target *= 0.992;

        // ---- lane decisions
        if (decideLanes) {
          const maxLane = race.horses.length - 1 + 1.5;
          if (blocked && r.v > minAheadV - 0.1) {
            r.targetLane = Math.min(maxLane, r.laneF + 1); // pull out to overtake
          } else if (!blocked) {
            // drift toward the rail if the inside is clear
            const innerBusy = runners.some((o) => o !== r && !o.finished &&
              Math.abs(o.d - r.d) < 4 && o.laneF < r.laneF - 0.3 && r.laneF - o.laneF < 1.6);
            if (!innerBusy && r.laneF > 0.05) r.targetLane = Math.max(0, r.laneF - 1);
          }
        }
        const laneDelta = clamp(r.targetLane - r.laneF, -0.85 * dt, 0.85 * dt);
        r.laneF += laneDelta;

        // ---- accelerate toward target
        const maxA = (2.2 + h.stats.accel * 0.015) * (sim.t < 6 ? r.breakQ : 1);
        r.v += clamp(target - r.v, -3.5 * dt, maxA * dt);

        // ---- advance; wide on turns covers extra ground
        const pt = pathPoint(startS + r.d, 0);
        let ds = r.v * dt;
        if (pt.turn) ds *= TRACK.radius / (TRACK.radius + laneOffset(r.laneF));
        r.d += ds;
        r.time += dt;
        r.gallopPhase += r.v * dt * 0.42;

        // ---- energy
        const drainMult = 1.5 - (h.stats.stamina / 100) * 0.85;
        const drain = Math.pow(r.v / BASE_PACE, 3.6) * (100 / (D / BASE_PACE)) * 0.92 * drainMult * drainEnv * slipDrain;
        r.energy = Math.max(0, r.energy - drain * dt);

        // ---- finish
        if (r.d >= D) {
          r.finished = true;
          r.finishTime = r.time - (r.d - D) / Math.max(r.v, 1);
          r.d = D;
          r.place = sim.results.length + 1;
          sim.results.push(r);
          events.push({ type: 'finish', runner: r, place: r.place });
        }
      }

      // ---- race narration events
      const live = runners.filter((r) => !r.finished);
      if (live.length) {
        const leader = live.reduce((a, b) => (b.d > a.d ? b : a));
        if (sim.results.length === 0 && leader.h.id !== sim.leaderId && sim.t > 4) {
          sim.leaderId = leader.h.id;
          events.push({ type: 'leader', horse: leader.h });
        }
        const remaining = D - leader.d;
        if (!sim.flags.halfCalled && leader.d > D / 2) {
          sim.flags.halfCalled = true;
          events.push({ type: 'half', horse: leader.h });
        }
        if (!sim.flags.straightCalled && remaining < TRACK.finishS + 20 &&
            mod(startS + leader.d, TRACK.lap) < TRACK.finishS && remaining < 320) {
          sim.flags.straightCalled = true;
          events.push({ type: 'straight' });
        }
      }

      if (sim.results.length >= runners.length || sim.t > 400) {
        // safety: force any stragglers home
        for (const r of runners) {
          if (!r.finished) {
            r.finished = true;
            r.finishTime = r.time + (D - r.d) / Math.max(r.v, 8);
            r.place = sim.results.length + 1;
            sim.results.push(r);
          }
        }
        sim.done = true;
        const photo = sim.results.length > 1 &&
          (sim.results[1].finishTime - sim.results[0].finishTime) < 0.05;
        events.push({ type: 'end', photo });
      }
      return events;
    };

    return sim;
  }

  /** margin between consecutive finishers, in lengths */
  function marginLengths(a, b) {
    return Math.abs(b.finishTime - a.finishTime) * BASE_PACE / LENGTH;
  }

  function marginLabel(l) {
    if (l < 0.05) return 'nose';
    if (l < 0.15) return 'short head';
    if (l < 0.3) return 'head';
    if (l < 0.6) return 'neck';
    if (l < 0.85) return '¾ length';
    if (l < 1.25) return '1 length';
    if (l > 12) return 'distance';
    return `${(Math.round(l * 2) / 2)} lengths`;
  }

  return {
    TRACK, pathPoint, laneOffset,
    TIERS, WEATHER, GOING, STYLES, DIST_CATS, distCat, WEIGHTS,
    createRace, marketTick, createSim,
    placeOdds, showOdds, exactaOdds, quinellaOdds, settleBets,
    marginLengths, marginLabel, formScore,
    LENGTH, BASE_PACE,
    _test: { rand, clamp, mod },
  };
})();

if (typeof module !== 'undefined') module.exports = Engine;
