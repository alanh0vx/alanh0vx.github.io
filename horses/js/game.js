'use strict';

/**
 * Thunder Downs — game layer: UI, betting, persistence, race flow.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('en-US');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------ state
  const S = {
    balance: 1000,
    totalWinnings: 0,
    maxBalance: 1000,
    sponsorships: 0,
    raceCounter: 1,
    tierId: 0,
    history: [],
    stats: { racesBet: 0, betsWon: 0, betsPlaced: 0, biggestWin: 0 },
    race: null,
    sim: null,
    mode: 'lobby',            // lobby | racing | results
    bets: [],
    expanded: null,
    time: 0,
    raceTime: 0,
    simSpeed: 3,
    excitement: 0,
    oddsTimer: null,
    towerAcc: 0,
    callAcc: 0,
    commentTimeout: null,
  };

  let renderer = null;
  let lastFrame = 0;

  // ------------------------------------------------------------ persistence
  function save() {
    localStorage.setItem('horseRacing_v2', JSON.stringify({
      balance: S.balance, totalWinnings: S.totalWinnings, maxBalance: S.maxBalance,
      sponsorships: S.sponsorships, raceCounter: S.raceCounter, tierId: S.tierId,
      history: S.history.slice(-15), stats: S.stats,
    }));
  }

  function load() {
    try {
      const v2 = JSON.parse(localStorage.getItem('horseRacing_v2') || 'null');
      if (v2) {
        Object.assign(S, {
          balance: v2.balance ?? 1000, totalWinnings: v2.totalWinnings ?? 0,
          maxBalance: v2.maxBalance ?? Math.max(1000, v2.balance ?? 1000),
          sponsorships: v2.sponsorships ?? 0, raceCounter: v2.raceCounter ?? 1,
          tierId: v2.tierId ?? 0, history: v2.history ?? [],
          stats: v2.stats ?? S.stats,
        });
        return;
      }
      // migrate v1 keys
      const oldBal = parseInt(localStorage.getItem('horseRacing_balance') || '', 10);
      const oldWin = parseInt(localStorage.getItem('horseRacing_totalWinnings') || '', 10);
      if (!Number.isNaN(oldBal)) S.balance = oldBal;
      if (!Number.isNaN(oldWin)) S.totalWinnings = oldWin;
      S.maxBalance = Math.max(1000, S.balance);
    } catch (e) { /* fresh start */ }
  }

  // ------------------------------------------------------------ small helpers
  const tier = () => Engine.TIERS[S.tierId];
  const totalStaked = () => S.bets.reduce((s, b) => s + b.stake, 0);
  const horseById = (id) => S.race.horses.find((h) => h.id === id);

  function silkStyle(silks) {
    const { primary: p, secondary: s, pattern } = silks;
    let bg;
    switch (pattern) {
      case 'stripes': bg = `repeating-linear-gradient(90deg, ${p} 0 6px, ${s} 6px 10px)`; break;
      case 'hoops': bg = `repeating-linear-gradient(0deg, ${p} 0 5px, ${s} 5px 9px)`; break;
      case 'sash': bg = `linear-gradient(135deg, ${p} 42%, ${s} 42% 58%, ${p} 58%)`; break;
      case 'dots': bg = `radial-gradient(circle at 30% 30%, ${s} 3px, transparent 3.5px), radial-gradient(circle at 70% 70%, ${s} 3px, transparent 3.5px), ${p}`; break;
      case 'quarters': bg = `conic-gradient(${p} 0 25%, ${s} 25% 50%, ${p} 50% 75%, ${s} 75%)`; break;
      default: bg = p;
    }
    const n = parseInt(p.slice(1), 16);
    const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff);
    return `background:${bg};color:${lum > 150 ? '#111' : '#fff'};text-shadow:0 1px 2px rgba(${lum > 150 ? '255,255,255' : '0,0,0'},.6)`;
  }

  function comment(msg, hold = 6000) {
    const el = $('commentary');
    el.textContent = msg;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
    clearTimeout(S.commentTimeout);
  }

  // ------------------------------------------------------------ wallet / header
  function updateWallet() {
    $('balanceVal').textContent = fmt(S.balance);
    $('winningsVal').textContent = (S.totalWinnings >= 0 ? '+' : '−') + fmt(Math.abs(S.totalWinnings));
    $('winningsVal').className = S.totalWinnings >= 0 ? 'good' : 'bad';
    // bailout
    const broke = S.balance < 10 && S.mode === 'lobby' && totalStaked() === 0;
    $('bailout').classList.toggle('hidden', !broke);
  }

  function renderTierTabs() {
    $('tierTabs').innerHTML = Engine.TIERS.map((t) => {
      const locked = S.maxBalance < t.unlock;
      const cls = ['tier-tab', t.id === S.tierId ? 'active' : '', locked ? 'locked' : ''].join(' ');
      const sub = locked ? `🔒 $${fmt(t.unlock)}` : `${t.runners} runners`;
      return `<button class="${cls}" data-tier="${t.id}" ${locked ? 'disabled' : ''} title="${esc(t.name)}">
        <span class="tt-name">${esc(t.short)}</span><span class="tt-sub">${sub}</span></button>`;
    }).join('');
    $('tierTabs').querySelectorAll('button[data-tier]').forEach((b) => {
      b.addEventListener('click', () => {
        if (S.mode !== 'lobby') return;
        GameAudio.click();
        S.tierId = parseInt(b.dataset.tier, 10);
        save();
        newRace();
      });
    });
  }

  // ------------------------------------------------------------ race setup
  function newRace() {
    if (S.mode === 'racing') return;
    S.mode = 'lobby';
    document.body.dataset.mode = 'lobby';
    S.bets = [];
    S.expanded = null;
    S.race = Engine.createRace(S.tierId, S.raceCounter);
    S.sim = Engine.createSim(S.race);   // pre-race: horses shown at the gate
    S.raceTime = 0;
    S.excitement = 0;
    S.simSpeed = 2.2 + S.race.distance / 1200;

    renderRaceStrip();
    renderRaceCard();
    renderSlip();
    renderTierTabs();
    renderTower(true);
    updateWallet();
    $('raceClock').classList.add('hidden');
    $('posTower').classList.add('hidden');
    comment(`${S.race.name} — ${S.race.distance}m, going ${S.race.going.name}. Study the card and place your bets.`);

    clearInterval(S.oddsTimer);
    S.oddsTimer = setInterval(() => {
      if (S.mode !== 'lobby' || !S.race) return;
      const moves = Engine.marketTick(S.race);
      for (const m of moves) {
        const cell = $(`odds-${m.id}`);
        if (!cell) continue;
        cell.textContent = m.to.toFixed(1);
        cell.classList.remove('flash-up', 'flash-down');
        void cell.offsetWidth;
        cell.classList.add(m.to > m.from ? 'flash-up' : 'flash-down');
      }
      if (moves.length) renderExoticOdds();
    }, 3200);
  }

  function renderRaceStrip() {
    const r = S.race;
    $('raceName').textContent = `Race ${r.raceNo} — ${r.name}`;
    $('raceMeta').innerHTML = `
      <span class="chip">${r.weather.icon} ${esc(r.weather.name)}</span>
      <span class="chip">🌡️ ${r.temperature}°C</span>
      <span class="chip">💨 ${r.wind} km/h</span>
      <span class="chip chip-going">Going: ${esc(r.going.name)}</span>
      <span class="chip chip-dist">${r.distance}m ${esc(r.distCat === 'sprint' ? 'Sprint' : r.distCat === 'mile' ? 'Mile' : 'Staying')}</span>`;
  }

  // ------------------------------------------------------------ race card
  function formDots(form) {
    return form.map((f) => `<span class="fdot fdot-${f}" title="${{ W: 'Win', P: 'Place', S: 'Show', L: 'Unplaced' }[f]}">${f}</span>`).join('');
  }

  function prefBadges(h) {
    const r = S.race;
    const out = [];
    if (h.goingPref === r.going.name) out.push('<span class="badge">going ✓</span>');
    if (h.weatherPref === r.weather.name) out.push('<span class="badge">weather ✓</span>');
    if (h.distPref === r.distCat) out.push('<span class="badge">distance ✓</span>');
    return out.join('');
  }

  function statBar(label, val) {
    return `<div class="sbar"><span class="sbar-l">${label}</span>
      <span class="sbar-t"><span class="sbar-f" style="width:${Math.min(100, val)}%"></span></span>
      <span class="sbar-v">${val}</span></div>`;
  }

  function renderRaceCard() {
    const r = S.race;
    $('raceCard').innerHTML = r.horses.map((h) => {
      const open = S.expanded === h.id;
      const betOn = S.bets.some((b) => b.horses.includes(h.id));
      return `
      <div class="rc-row ${open ? 'open' : ''} ${betOn ? 'has-bet' : ''}" data-id="${h.id}">
        <div class="rc-head" data-toggle="${h.id}">
          <div class="rc-silk" style="${silkStyle(h.silks)}">${h.number}</div>
          <div class="rc-main">
            <div class="rc-name">${esc(h.name)} ${prefBadges(h)}</div>
            <div class="rc-sub">${esc(h.jockey.name)} • ${esc(h.style.label)} • ${h.age}yo ${esc(h.breed)} • ${esc(h.coat.name)}</div>
          </div>
          <div class="rc-form">${formDots(h.form)}</div>
          <div class="rc-odds" id="odds-${h.id}">${h.odds.toFixed(1)}</div>
          <div class="rc-caret">${open ? '▴' : '▾'}</div>
        </div>
        <div class="rc-expand" ${open ? '' : 'hidden'}>
          <div class="rc-stats">
            ${statBar('SPD', h.stats.speed)}${statBar('STA', h.stats.stamina)}
            ${statBar('ACC', h.stats.accel)}${statBar('CON', h.stats.consistency)}
          </div>
          <div class="rc-prefs">
            Prefers: <b>${esc(h.distPref)}</b> trips • <b>${esc(h.goingPref)}</b> going • <b>${esc(h.weatherPref)}</b> weather
            • ${h.stats.experience} career starts
          </div>
          <div class="rc-bet">
            <div class="bet-types" data-horse="${h.id}">
              <button class="bt active" data-bt="win">Win <b>${h.odds.toFixed(1)}×</b></button>
              <button class="bt" data-bt="place">Place <b>${Engine.placeOdds(h.odds).toFixed(1)}×</b></button>
              <button class="bt" data-bt="show">Show <b>${Engine.showOdds(h.odds).toFixed(1)}×</b></button>
            </div>
            <div class="stake-row">
              ${[10, 25, 50, 100].map((v) => `<button class="chip-btn" data-stake="${v}">$${v}</button>`).join('')}
              <input type="number" inputmode="numeric" class="stake-input" value="50" min="10" step="5" aria-label="Stake">
              <button class="chip-btn" data-stake="max">MAX</button>
            </div>
            <button class="btn btn-add" data-add="${h.id}">Add bet</button>
          </div>
        </div>
      </div>`;
    }).join('');

    // handlers
    $('raceCard').querySelectorAll('[data-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        if (S.mode !== 'lobby') return;
        const id = parseInt(el.dataset.toggle, 10);
        S.expanded = S.expanded === id ? null : id;
        GameAudio.click();
        renderRaceCard();
      });
    });
    $('raceCard').querySelectorAll('.bet-types .bt').forEach((b) => {
      b.addEventListener('click', () => {
        b.closest('.bet-types').querySelectorAll('.bt').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        GameAudio.click();
      });
    });
    $('raceCard').querySelectorAll('.chip-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const input = b.closest('.rc-bet').querySelector('.stake-input');
        const avail = Math.min(tier().maxBet, S.balance - totalStaked());
        input.value = b.dataset.stake === 'max' ? Math.max(10, avail) : b.dataset.stake;
        GameAudio.click();
      });
    });
    $('raceCard').querySelectorAll('[data-add]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = parseInt(b.dataset.add, 10);
        const box = b.closest('.rc-bet');
        const type = box.querySelector('.bt.active').dataset.bt;
        const stake = parseInt(box.querySelector('.stake-input').value, 10) || 0;
        addBet(id, type, stake);
      });
    });

    renderExoticBox();
  }

  // ------------------------------------------------------------ betting
  function addBet(horseId, type, stake) {
    const h = horseById(horseId);
    if (!h) return;
    const err = validateStake(stake, S.bets.filter((b) => !(b.horses[0] === horseId && b.type === type)));
    if (err) return showToast(err);

    const odds = type === 'win' ? h.odds : type === 'place' ? Engine.placeOdds(h.odds) : Engine.showOdds(h.odds);
    S.bets = S.bets.filter((b) => !(b.type === type && b.horses.length === 1 && b.horses[0] === horseId));
    S.bets.push({
      type, horses: [horseId], stake, odds,
      label: `#${h.number} ${h.name}`,
    });
    GameAudio.cashRegister();
    renderSlip();
    renderRaceCard();
  }

  function addExotic() {
    const type = $('exoticType').value;
    const a = parseInt($('exoticA').value, 10);
    const b = parseInt($('exoticB').value, 10);
    if (a === b) return showToast('Pick two different horses.');
    const stake = parseInt($('exoticStake').value, 10) || 0;
    const err = validateStake(stake, S.bets);
    if (err) return showToast(err);
    const odds = type === 'exacta' ? Engine.exactaOdds(S.race, a, b) : Engine.quinellaOdds(S.race, a, b);
    const ha = horseById(a), hb = horseById(b);
    S.bets.push({
      type, horses: [a, b], stake, odds,
      label: `#${ha.number} ${type === 'exacta' ? '→' : '&'} #${hb.number}`,
    });
    GameAudio.cashRegister();
    renderSlip();
    renderRaceCard();
  }

  function validateStake(stake, existing) {
    const staked = existing.reduce((s, b) => s + b.stake, 0);
    if (!stake || stake < 10) return 'Minimum bet is $10.';
    if (stake > tier().maxBet) return `Max bet in this race class is $${fmt(tier().maxBet)}.`;
    if (staked + stake > S.balance) return 'Not enough balance for that stake.';
    return null;
  }

  function removeBet(i) {
    S.bets.splice(i, 1);
    renderSlip();
    renderRaceCard();
  }

  function renderSlip() {
    const box = $('slipEntries');
    if (!S.bets.length) {
      box.innerHTML = '<div class="slip-empty">No bets yet.<br>Tap a horse on the race card to bet — or start the race to just watch.</div>';
    } else {
      box.innerHTML = S.bets.map((b, i) => `
        <div class="slip-item">
          <div class="slip-info">
            <b>${esc(b.label)}</b>
            <span>${b.type.toUpperCase()} • $${fmt(b.stake)} @ ${b.odds.toFixed(1)}×</span>
          </div>
          <div class="slip-right">
            <span class="slip-pay">$${fmt(Math.round(b.stake * b.odds))}</span>
            <button class="slip-x" data-rm="${i}" aria-label="Remove bet">×</button>
          </div>
        </div>`).join('');
      box.querySelectorAll('[data-rm]').forEach((b) =>
        b.addEventListener('click', () => { GameAudio.click(); removeBet(parseInt(b.dataset.rm, 10)); }));
    }
    const staked = totalStaked();
    const maxRet = S.bets.reduce((s, b) => s + Math.round(b.stake * b.odds), 0);
    $('slipTotals').innerHTML = staked
      ? `<div><span>Total stake</span><b>$${fmt(staked)}</b></div>
         <div><span>Max return</span><b class="good">$${fmt(maxRet)}</b></div>`
      : '';
    $('startRaceBtn').textContent = staked ? `Start Race — $${fmt(staked)} staked` : 'Start Race (spectate)';
    // mobile action bar mirror
    $('mobileSummary').innerHTML = staked
      ? `<b>${S.bets.length} bet${S.bets.length > 1 ? 's' : ''} • $${fmt(staked)}</b><span>max return $${fmt(maxRet)}</span>`
      : '<b>No bets yet</b><span>tap a runner to bet</span>';
    $('startRaceBtnM').textContent = staked ? `Start • $${fmt(staked)}` : 'Spectate';
    updateWallet();
  }

  function renderExoticBox() {
    const boxWrap = $('exoticBox');
    if (!tier().exotics) { boxWrap.classList.add('hidden'); return; }
    boxWrap.classList.remove('hidden');
    const opts = S.race.horses.map((h) => `<option value="${h.id}">#${h.number} ${esc(h.name)}</option>`).join('');
    $('exoticA').innerHTML = opts;
    $('exoticB').innerHTML = opts;
    $('exoticB').selectedIndex = 1;
    renderExoticOdds();
  }

  function renderExoticOdds() {
    if (!tier().exotics || !S.race) return;
    const type = $('exoticType').value;
    const a = parseInt($('exoticA').value, 10);
    const b = parseInt($('exoticB').value, 10);
    const odds = Number.isNaN(a) || Number.isNaN(b) || a === b ? 0
      : type === 'exacta' ? Engine.exactaOdds(S.race, a, b) : Engine.quinellaOdds(S.race, a, b);
    $('exoticOdds').textContent = odds ? `${odds.toFixed(1)}×` : '—';
  }

  function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ------------------------------------------------------------ race flow
  function startRace() {
    if (S.mode !== 'lobby' || !S.race) return;
    GameAudio.ensure();
    clearInterval(S.oddsTimer);

    S.balance -= totalStaked();
    if (S.bets.length) {
      S.stats.racesBet++;
      S.stats.betsPlaced += S.bets.length;
    }
    updateWallet();
    save();

    S.mode = 'racing';
    document.body.dataset.mode = 'racing';
    $('posTower').classList.remove('hidden');
    $('raceClock').classList.remove('hidden');
    document.querySelector('.stage').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    comment('🎺 The horses are at the gate…');
    GameAudio.bugle();

    setTimeout(() => {
      if (S.mode !== 'racing') return;
      GameAudio.gateOpen();
      GameAudio.startRaceLoop();
      const evts = S.sim.start();
      handleEvents(evts);
    }, 1900);
  }

  function handleEvents(events) {
    for (const e of events) {
      switch (e.type) {
        case 'off': {
          const slow = events.filter((x) => x.type === 'slowBreak');
          comment(slow.length
            ? `And they're off! But ${slow.map((x) => `#${x.horse.number} ${x.horse.name}`).join(' and ')} missed the break!`
            : 'And they\'re off! A clean start for the field.');
          break;
        }
        case 'leader':
          comment(pickLine([
            `#${e.horse.number} ${e.horse.name} strides to the front!`,
            `${e.horse.name} takes over at the head of affairs!`,
            `Now it's #${e.horse.number} ${e.horse.name} showing the way!`,
          ]));
          break;
        case 'half': {
          const st = S.sim.standings();
          comment(`Halfway home — ${st[0].h.name} leads from ${st[1].h.name}${st[2] ? ` and ${st[2].h.name}` : ''}.`);
          break;
        }
        case 'straight':
          comment('They swing into the home straight — here comes the run to the line!');
          S.excitement = Math.max(S.excitement, 0.6);
          break;
        case 'finish':
          if (e.place === 1) {
            comment(`🏆 #${e.runner.h.number} ${e.runner.h.name} WINS the ${S.race.name}!`);
          } else if (e.place === 2 || e.place === 3) {
            comment(`#${e.runner.h.number} ${e.runner.h.name} takes ${e.place === 2 ? 'second' : 'third'}.`);
          }
          break;
        case 'end':
          finishRace(e.photo);
          break;
      }
    }
  }

  function pickLine(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function finishRace(photo) {
    GameAudio.stopRaceLoop();
    if (photo) {
      GameAudio.photoFlash();
      const pf = $('photoFinish');
      pf.classList.remove('hidden');
      comment('📸 PHOTO FINISH! The judges are examining the print…');
      setTimeout(() => {
        pf.classList.add('hidden');
        settleAndShow(true);
      }, 2300);
    } else {
      setTimeout(() => settleAndShow(false), 1400);
    }
  }

  function settleAndShow(photo) {
    S.mode = 'results';
    document.body.dataset.mode = 'results';
    const results = S.sim.results;
    const order = results.map((r) => r.h.id);
    const settled = Engine.settleBets(S.bets, order);
    const returned = settled.reduce((s, b) => s + b.payout, 0);
    const staked = settled.reduce((s, b) => s + b.stake, 0);
    const net = returned - staked;

    S.balance += returned;
    S.totalWinnings += net;
    S.maxBalance = Math.max(S.maxBalance, S.balance);
    settled.forEach((b) => { if (b.won) { S.stats.betsWon++; S.stats.biggestWin = Math.max(S.stats.biggestWin, b.net); } });

    S.history.push({
      raceNo: S.race.raceNo, tier: tier().short, name: S.race.name,
      dist: S.race.distance, going: S.race.going.name,
      winner: `#${results[0].h.number} ${results[0].h.name}`,
      time: results[0].finishTime, staked, returned, net, photo,
    });
    S.raceCounter++;
    save();
    updateWallet();
    renderHistory();
    renderTierTabs();   // may have unlocked a tier

    if (staked > 0) (net > 0 ? GameAudio.winFanfare : GameAudio.losePlink)();
    showResults(settled, photo, net);
  }

  function showResults(settled, photo, net) {
    const res = S.sim.results;
    const medals = ['🥇', '🥈', '🥉'];
    $('podium').innerHTML = res.slice(0, 3).map((r, i) => {
      const margin = i === 0 ? '' :
        `<div class="pd-margin">by ${Engine.marginLabel(Engine.marginLengths(res[i - 1], r))}</div>`;
      return `
        <div class="pd pd-${i}">
          <div class="pd-medal">${medals[i]}</div>
          <div class="rc-silk" style="${silkStyle(r.h.silks)}">${r.h.number}</div>
          <div class="pd-name">${esc(r.h.name)}</div>
          <div class="pd-time">${r.finishTime.toFixed(2)}s</div>
          ${margin}
        </div>`;
    }).join('');

    $('fullOrder').innerHTML = res.slice(3).map((r) =>
      `<span class="fo-item">${r.place}. #${r.h.number} ${esc(r.h.name)}</span>`).join(' ');

    $('betResults').innerHTML = settled.length ? settled.map((b) => `
      <div class="br-row ${b.won ? 'won' : 'lost'}">
        <span>${esc(b.label)} <small>${b.type.toUpperCase()} $${fmt(b.stake)} @ ${b.odds.toFixed(1)}×</small></span>
        <b>${b.won ? `+$${fmt(b.payout)}` : `−$${fmt(b.stake)}`}</b>
      </div>`).join('') : '<div class="br-row">You watched this one from the rail — no bets placed.</div>';

    $('netResult').className = net > 0 ? 'good' : net < 0 ? 'bad' : '';
    $('netResult').textContent = settled.length
      ? `Net: ${net >= 0 ? '+' : '−'}$${fmt(Math.abs(net))}`
      : '';
    $('resultsTitle').textContent = photo ? '📸 Photo Finish — Result' : '🏁 Race Result';
    $('resultsModal').classList.add('show');
  }

  function nextRace() {
    $('resultsModal').classList.remove('show');
    newRace();
  }

  // ------------------------------------------------------------ tower / clock / commentary during race
  function renderTower(initial) {
    const tw = $('posTower');
    if (!S.sim) { tw.innerHTML = ''; return; }
    const st = S.sim.standings();
    const leader = st[0];
    tw.innerHTML = st.map((r, i) => {
      let gap = '';
      if (r.finished) gap = `${r.finishTime.toFixed(2)}s`;
      else if (i > 0) gap = `+${((leader.finished ? leader.finishTime * Engine.BASE_PACE : leader.d) - r.d > 0 ? ((st[0].d - r.d) / Engine.LENGTH).toFixed(1) : '0.0')}L`;
      if (initial) gap = '';
      return `<div class="tw-row ${S.bets.some((b) => b.horses.includes(r.h.id)) ? 'tw-bet' : ''}">
        <span class="tw-pos">${initial ? r.lane + 1 : i + 1}</span>
        <span class="tw-silk" style="${silkStyle(r.h.silks)}">${r.h.number}</span>
        <span class="tw-name">${esc(r.h.name)}</span>
        <span class="tw-gap">${gap}</span>
      </div>`;
    }).join('');
  }

  function updateRaceClock() {
    const sim = S.sim;
    if (!sim || !sim.started) return;
    const live = sim.runners.filter((r) => !r.finished);
    const lead = live.length ? live.reduce((a, b) => (b.d > a.d ? b : a)) : sim.results[0];
    const remaining = Math.max(0, Math.round(sim.D - lead.d));
    $('raceClock').textContent = `⏱ ${sim.t.toFixed(1)}s  •  ${remaining}m to go`;
  }

  function periodicCall() {
    const sim = S.sim;
    if (!sim || !sim.started || sim.done || sim.results.length) return;
    const st = sim.standings();
    const gap = (st[0].d - st[1].d) / Engine.LENGTH;
    const lines = gap > 3
      ? [`${st[0].h.name} has kicked ${Math.round(gap)} lengths clear!`,
         `Daylight second — ${st[0].h.name} is running away with it!`]
      : gap < 0.7
        ? [`Nothing between ${st[0].h.name} and ${st[1].h.name}!`,
           `${st[1].h.name} is right on the leader's heels!`]
        : [`${st[0].h.name} from ${st[1].h.name}, then ${st[2] ? st[2].h.name : 'the pack'}.`,
           `${st[0].h.name} dictates ahead of ${st[1].h.name}.`];
    comment(pickLine(lines));
  }

  // ------------------------------------------------------------ history
  function renderHistory() {
    const list = $('historyList');
    if (!S.history.length) {
      list.innerHTML = '<div class="slip-empty">No races yet.</div>';
    } else {
      list.innerHTML = [...S.history].reverse().slice(0, 12).map((h) => `
        <div class="hist-row">
          <span class="hist-race">R${h.raceNo} ${esc(h.tier)} • ${h.dist}m</span>
          <span class="hist-winner">🏆 ${esc(h.winner)}${h.photo ? ' 📸' : ''}</span>
          <span class="hist-net ${h.net > 0 ? 'good' : h.net < 0 ? 'bad' : ''}">${h.staked ? (h.net >= 0 ? '+' : '−') + '$' + fmt(Math.abs(h.net)) : '—'}</span>
        </div>`).join('');
    }
    const st = S.stats;
    $('careerStats').textContent = st.betsPlaced
      ? `${st.racesBet} races bet • ${st.betsWon}/${st.betsPlaced} bets won • biggest win +$${fmt(st.biggestWin)}`
      : '';
  }

  // ------------------------------------------------------------ main loop
  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastFrame) / 1000 || 0.016);
    lastFrame = ts;
    S.time += dt;

    if (S.mode === 'racing' && S.sim && S.sim.started && !S.sim.done) {
      // fixed-step simulation
      let acc = dt * S.simSpeed;
      const step = 0.05;
      const events = [];
      while (acc > 0) {
        events.push(...S.sim.tick(Math.min(step, acc)));
        acc -= step;
      }
      S.raceTime += dt;
      handleEvents(events);

      // excitement & audio intensity
      const live = S.sim.runners.filter((r) => !r.finished);
      const lead = live.length ? live.reduce((a, b) => (b.d > a.d ? b : a)) : null;
      const prog = lead ? lead.d / S.sim.D : 1;
      S.excitement = Math.max(S.excitement * 0.995, prog > 0.7 ? (prog - 0.7) / 0.3 : 0.08);
      const vNorm = lead ? Math.min(1, lead.v / 17.5) : 0.4;
      GameAudio.setRaceIntensity(S.excitement, vNorm);

      // throttled UI updates
      S.towerAcc += dt;
      if (S.towerAcc > 0.18) { S.towerAcc = 0; renderTower(false); updateRaceClock(); }
      S.callAcc += dt;
      if (S.callAcc > 7 + Math.random() * 3) { S.callAcc = 0; periodicCall(); }
    }

    renderer.render({
      race: S.race,
      sim: S.sim,
      mode: S.mode === 'racing' ? 'race' : 'idle',
      excitement: S.excitement,
      raceTime: S.sim && S.sim.started ? S.sim.t : 0,
      time: S.time,
      betIds: new Set(S.bets.flatMap((b) => b.horses)),
    }, dt);

    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ boot
  function init() {
    load();
    renderer = Renderer($('trackCanvas'));
    renderer.resize();
    window.addEventListener('resize', () => renderer.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => renderer.resize(), 350));

    $('startRaceBtn').addEventListener('click', startRace);
    $('startRaceBtnM').addEventListener('click', startRace);
    $('mobileSummary').addEventListener('click', () => {
      GameAudio.click();
      document.querySelector('.bet-slip').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('newRaceBtn').addEventListener('click', () => { if (S.mode === 'lobby') { GameAudio.click(); newRace(); } });
    $('nextRaceBtn').addEventListener('click', nextRace);
    $('resultsModal').addEventListener('click', (e) => { if (e.target === $('resultsModal')) nextRace(); });

    $('soundBtn').addEventListener('click', () => {
      const m = GameAudio.toggleMute();
      $('soundBtn').textContent = m ? '🔇' : '🔊';
    });
    $('soundBtn').textContent = GameAudio.isMuted() ? '🔇' : '🔊';

    $('closeBtn').addEventListener('click', () => {
      window.close();
      setTimeout(() => { location.href = '../'; }, 150);
    });

    $('bailoutBtn').addEventListener('click', () => {
      S.sponsorships++;
      S.balance += 500;
      GameAudio.cashRegister();
      comment('A generous sponsor tops up your account with $500. Spend it wisely!');
      save();
      updateWallet();
      renderSlip();
    });

    $('resetBtn').addEventListener('click', () => {
      if (!confirm('Reset all progress? Balance returns to $1,000 and history is cleared.')) return;
      Object.assign(S, {
        balance: 1000, totalWinnings: 0, maxBalance: 1000, sponsorships: 0,
        raceCounter: 1, tierId: 0, history: [],
        stats: { racesBet: 0, betsWon: 0, betsPlaced: 0, biggestWin: 0 },
      });
      save();
      renderHistory();
      newRace();
    });

    ['exoticType', 'exoticA', 'exoticB'].forEach((id) =>
      $(id).addEventListener('change', renderExoticOdds));
    $('exoticAdd').addEventListener('click', addExotic);

    // first user gesture unlocks audio
    document.addEventListener('pointerdown', () => GameAudio.ensure(), { once: true });

    renderHistory();
    newRace();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
