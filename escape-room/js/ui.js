/* ui.js — 2D HTML overlay: HUD, inspect panel, keypad modals, inventory,
 * journal, hints, story/win modals, toasts. Renders Game state; never mutates
 * it except through Game actions. */

import { t, getLang } from './i18n.js';
import { COLORS, COLOR_HEX, SYMBOLS } from './themes.js';
import { sfx } from './audio.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- text helpers

export function propName(room, propId) {
  const p = room.props.find((x) => x.id === propId);
  if (!p) return propId;
  const dup = room.props.filter((q) => q.type === p.type).length > 1;
  const base = t('prop.' + p.type);
  if (!dup) return base;
  const color = t('color.' + p.accent);
  return getLang() === 'zh' ? color + base : color + ' ' + base;
}

function charName(room) {
  const c = room.story.char || {};
  return (getLang() === 'zh' ? c.zh : c.en) || c.en || '???';
}

function lockTarget(room, lockId) {
  const lock = room.locks.find((l) => l.id === lockId);
  return lock ? propName(room, lock.attachedTo) : '?';
}

function factText(room, f) {
  if (f.src === 'clockHour') return t('fact.clockHour');
  if (f.src === 'clockMinute') return t('fact.clockMinute');
  return t('fact.count', {
    color: t('color.' + f.color),
    what: t('what.' + f.what),
    prop: propName(room, f.propId),
  });
}

export function clueText(room, clue) {
  const v = clue.vars || {};
  switch (clue.kind) {
    case 'riddleItem':
      return t(`riddle.${v.spot}.${v.variant || 0}`, { prop: propName(room, v.propId) });
    case 'codeRecipe':
      return t('clue.codeRecipe', {
        a: v.startPos, b: v.startPos + 1,
        target: lockTarget(room, v.lockId),
        f1: factText(room, v.facts[0]),
        f2: factText(room, v.facts[1]),
      });
    case 'colorPoem':
      return t('clue.colorPoem', {
        target: lockTarget(room, v.lockId),
        c1: t('poem.' + v.colors[0]), c2: t('poem.' + v.colors[1]),
        c3: t('poem.' + v.colors[2]), c4: t('poem.' + v.colors[3]),
      });
    case 'symbolOrder':
      return t('clue.symbolOrder', {
        target: lockTarget(room, v.lockId),
        p1: propName(room, v.propIds[0]),
        p2: propName(room, v.propIds[1]),
        p3: propName(room, v.propIds[2]),
      });
    default: // lore
      return t('clue.lore.' + (v.variant || 0), { char: charName(room) });
  }
}

export function itemName(item) {
  return t(`item.${item.type}.${item.style}`);
}

export function storyText(room, part) {
  const s = room.story;
  const key = part === 'intro'
    ? `story.${room.theme}.intro.${s.introIdx}`
    : `story.${room.theme}.outro.${s.outroIdx}`;
  return t(key, { char: charName(room), time: s.time });
}

// ---------------------------------------------------------------- toasts

let toastTimer = null;
export function toast(msg, ms = 2600) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---------------------------------------------------------------- modal

let modalCleanup = null;
export function showModal(html, { closable = true } = {}) {
  const overlay = $('modal');
  const box = $('modalBox');
  box.innerHTML = html;
  overlay.classList.add('show');
  const close = () => {
    overlay.classList.remove('show');
    if (modalCleanup) { modalCleanup(); modalCleanup = null; }
  };
  if (closable) {
    const onOverlay = (e) => { if (e.target === overlay) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('pointerdown', onOverlay);
    document.addEventListener('keydown', onKey);
    modalCleanup = () => {
      overlay.removeEventListener('pointerdown', onOverlay);
      document.removeEventListener('keydown', onKey);
    };
  }
  return close;
}

export function confirmDialog(msg) {
  return new Promise((resolve) => {
    const close = showModal(`
      <p class="modal-text">${esc(msg)}</p>
      <div class="modal-btns">
        <button class="btn" id="mCancel">${esc(t('btn.cancel'))}</button>
        <button class="btn btn-primary" id="mOk">${esc(t('btn.ok'))}</button>
      </div>`, { closable: false });
    $('mOk').onclick = () => { close(); resolve(true); };
    $('mCancel').onclick = () => { close(); resolve(false); };
  });
}

// ---------------------------------------------------------------- UI class

export class UI {
  /** callbacks: { onExport(), onNewRoom(), onMenu() } */
  constructor(callbacks) {
    this.cb = callbacks;
    this.game = null;
    this.scene = null;
    this.currentPropId = null;
    this.lastFound = []; // messages to show inside the panel after a search

    $('journalBtn').addEventListener('click', () => this.openJournal());
    $('hintBtn').addEventListener('click', () => this.giveHint());
    $('panelClose').addEventListener('click', () => this.closePanel());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentPropId) this.closePanel();
    });
    window.addEventListener('langchange', () => {
      if (this.game) {
        this.renderHud();
        this.renderInventory();
        if (this.currentPropId) this.renderPanel();
      }
    });
  }

  attach(game, scene) {
    this.game = game;
    this.scene = scene;
    this.currentPropId = null;
    this.lastFound = [];
    game.on((type, payload) => this.onGameEvent(type, payload));
    this.renderHud();
    this.renderInventory();
    this.closePanel();
  }

  onGameEvent(type, payload) {
    if (type === 'found') {
      for (const f of payload.found) {
        if (f.type === 'item') { sfx.item(); toast(t('panel.foundItem', { item: itemName(f.item) })); }
        else sfx.paper();
      }
      this.renderInventory();
    } else if (type === 'unlock') {
      sfx.unlock();
      toast(t('toast.unlocked'));
      this.scene.setLockSolved(payload.lock.id);
      this.renderHud();
    } else if (type === 'doorReady') {
      this.scene.openDoor();
    } else if (type === 'win') {
      sfx.win();
      setTimeout(() => this.showWin(payload), 700);
    }
    if (type === 'change') this.renderHud();
  }

  // ------------------------------------------------------------- HUD

  renderHud() {
    const g = this.game;
    $('lockCounter').textContent = t('hud.locks', {
      solved: g.solvedLocks.size, total: g.room.locks.length,
    });
    $('timer').textContent = fmtTime(g.elapsedMs);
    const remaining = g.hintsRemaining();
    const hintBtn = $('hintBtn');
    hintBtn.textContent = `💡${remaining}`;
    hintBtn.classList.toggle('depleted', remaining === 0);
  }

  renderInventory() {
    const g = this.game;
    const bar = $('invBar');
    bar.innerHTML = '';
    const items = g.room.items.filter((i) => g.inventory.has(i.id));
    if (!items.length) {
      const d = document.createElement('div');
      d.className = 'inv-empty';
      d.textContent = t('inv.empty');
      bar.appendChild(d);
      return;
    }
    items.forEach((it) => {
      const b = document.createElement('button');
      b.className = 'inv-item';
      const used = it.lockId && g.solvedLocks.has(it.lockId);
      if (used) b.classList.add('used');
      b.textContent = '🗝️';
      b.title = itemName(it);
      b.setAttribute('aria-label', itemName(it));
      b.addEventListener('click', () => toast(itemName(it)));
      bar.appendChild(b);
    });
  }

  // ------------------------------------------------------------- inspect panel

  openPanel(propId) {
    this.currentPropId = propId;
    this.lastFound = [];
    this.scene.lookAt(propId);
    this.renderPanel();
    $('panel').classList.add('show');
  }

  closePanel() {
    this.currentPropId = null;
    $('panel').classList.remove('show');
  }

  renderPanel() {
    const g = this.game;
    const propId = this.currentPropId;
    if (!propId) return;
    const room = g.room;
    const prop = g.propById[propId];
    $('panelTitle').textContent = propName(room, propId);
    $('panelDesc').textContent = t('desc.' + prop.type);

    const body = $('panelBody');
    const actions = $('panelActions');
    body.innerHTML = '';
    actions.innerHTML = '';

    const addMsg = (txt, cls = '') => {
      const d = document.createElement('div');
      d.className = 'panel-msg ' + cls;
      d.textContent = txt;
      body.appendChild(d);
    };
    const addBtn = (label, fn, cls = 'btn') => {
      const b = document.createElement('button');
      b.className = cls;
      b.textContent = label;
      b.addEventListener('click', fn);
      actions.appendChild(b);
      return b;
    };

    // door
    if (propId === 'door') {
      const unsolved = g.unsolvedLocksOn('door');
      if (g.doorOpen()) {
        addMsg(t('panel.door.open'));
        if (!g.escaped) {
          addBtn(t('panel.escape'), () => { this.closePanel(); g.escape(); }, 'btn btn-primary btn-big');
        }
      } else {
        addMsg(t('panel.door.locked', { n: unsolved.length }));
      }
    }

    // lock status + actions
    for (const lock of g.locksOn(propId)) {
      if (g.solvedLocks.has(lock.id)) continue;
      addMsg(t('panel.locked.' + lock.type), 'locked');
      if (lock.type === 'key') {
        addBtn(t('panel.useKey'), () => {
          const r = g.tryLock(lock.id);
          if (!r.ok) { sfx.wrong(); toast(t(r.reason === 'wrongKey' ? 'toast.wrongKey' : 'toast.needKey')); }
          this.renderPanel();
        });
      } else {
        addBtn(t('panel.enterCode.' + lock.type), () => this.openKeypad(lock));
      }
    }

    // fresh finds from the last search on this prop
    for (const f of this.lastFound) {
      if (f.type === 'clue') {
        addMsg(t('panel.foundClue'), 'found');
        addMsg(clueText(room, f.clue), 'clue');
      } else {
        addMsg(t('panel.foundItem', { item: itemName(f.item) }), 'found');
      }
    }

    // search actions per spot
    if (propId !== 'door') {
      for (const spot of g.spotsFor(propId)) {
        if (!g.spotAccessible(propId, spot)) continue; // gated by the lock UI above
        const key = propId + ':' + spot;
        const label = t('panel.search.' + spot) + (g.searched.has(key) ? ' ✓' : '');
        addBtn(label, () => {
          sfx.tap();
          const res = g.search(propId, spot);
          this.lastFound = res.found;
          if (!res.found.length) { sfx.empty(); toast(t('panel.nothing'), 1400); }
          this.renderPanel();
          this.renderInventory();
        });
      }
    }
  }

  // ------------------------------------------------------------- keypads

  openKeypad(lock) {
    if (lock.type === 'code4') this.keypadDigits(lock);
    else if (lock.type === 'colorSeq') this.keypadColors(lock);
    else if (lock.type === 'riddle') this.riddleModal(lock);
    else this.keypadSymbols(lock);
  }

  _tryAnswer(lock, answer, close) {
    const r = this.game.tryLock(lock.id, answer);
    if (r.ok) {
      close();
      this.renderPanel();
    } else {
      sfx.wrong();
      toast(t(lock.type === 'riddle' ? 'toast.wrongRiddle' : 'toast.wrongCode'));
      const box = $('modalBox');
      box.classList.remove('shake');
      void box.offsetWidth; // restart animation
      box.classList.add('shake');
    }
    return r.ok;
  }

  keypadDigits(lock) {
    let entry = '';
    const close = showModal(`
      <h3 class="modal-title">${esc(t('keypad.title.code4'))}</h3>
      <div class="code-display" id="codeDisplay">····</div>
      <div class="keypad" id="keypadGrid"></div>
      <div class="modal-btns">
        <button class="btn" id="kpClear">${esc(t('keypad.clear'))}</button>
        <button class="btn btn-primary" id="kpTry">${esc(t('keypad.try'))}</button>
      </div>`);
    const disp = $('codeDisplay');
    const render = () => { disp.textContent = (entry + '····').slice(0, 4).split('').join(' '); };
    const grid = $('keypadGrid');
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach((n) => {
      const b = document.createElement('button');
      b.className = 'btn key-btn' + (n === 0 ? ' key-zero' : '');
      b.textContent = n;
      b.addEventListener('click', () => {
        if (entry.length < 4) { entry += n; sfx.tap(); render(); }
      });
      grid.appendChild(b);
    });
    $('kpClear').onclick = () => { entry = ''; render(); };
    $('kpTry').onclick = () => { if (entry.length === 4) this._tryAnswer(lock, entry, close); };
    render();
  }

  keypadColors(lock) {
    let entry = [];
    const close = showModal(`
      <h3 class="modal-title">${esc(t('keypad.title.colorSeq'))}</h3>
      <div class="code-display" id="colorDisplay"></div>
      <div class="keypad color-pad" id="colorGrid"></div>
      <div class="modal-btns">
        <button class="btn" id="kpClear">${esc(t('keypad.clear'))}</button>
        <button class="btn btn-primary" id="kpTry">${esc(t('keypad.try'))}</button>
      </div>`);
    const disp = $('colorDisplay');
    const render = () => {
      disp.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const dot = document.createElement('span');
        dot.className = 'color-dot';
        if (entry[i]) dot.style.background = COLOR_HEX[entry[i]];
        disp.appendChild(dot);
      }
    };
    const grid = $('colorGrid');
    COLORS.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'btn key-btn color-btn';
      b.style.background = COLOR_HEX[c];
      b.setAttribute('aria-label', t('color.' + c));
      b.title = t('color.' + c);
      b.addEventListener('click', () => {
        if (entry.length < 4) { entry.push(c); sfx.tap(); render(); }
      });
      grid.appendChild(b);
    });
    $('kpClear').onclick = () => { entry = []; render(); };
    $('kpTry').onclick = () => { if (entry.length === 4) this._tryAnswer(lock, entry, close); };
    render();
  }

  /** Riddle lock: the riddle describes an object in the room — pick which. */
  riddleModal(lock) {
    const room = this.game.room;
    const types = [...new Set(room.props.map((p) => p.type))]
      .filter((tp) => tp !== lock.answer && tp !== 'door');
    for (let i = types.length - 1; i > 0; i--) { // decoy order can be non-deterministic
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    const options = [lock.answer, ...types.slice(0, 5)];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const close = showModal(`
      <h3 class="modal-title">${esc(t('keypad.title.riddle'))}</h3>
      <p class="modal-text story">“${esc(t('riddleq.' + lock.answer))}”</p>
      <div class="riddle-options" id="riddleGrid"></div>`);
    const grid = $('riddleGrid');
    options.forEach((tp) => {
      const b = document.createElement('button');
      b.className = 'btn riddle-option';
      b.textContent = t('prop.' + tp);
      b.addEventListener('click', () => this._tryAnswer(lock, tp, close));
      grid.appendChild(b);
    });
  }

  keypadSymbols(lock) {
    const dials = [0, 0, 0];
    const close = showModal(`
      <h3 class="modal-title">${esc(t('keypad.title.symbol3'))}</h3>
      <div class="keypad symbol-pad" id="symbolGrid"></div>
      <div class="modal-btns">
        <button class="btn btn-primary" id="kpTry">${esc(t('keypad.try'))}</button>
      </div>`);
    const grid = $('symbolGrid');
    dials.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'btn key-btn symbol-btn';
      b.textContent = SYMBOLS[0];
      b.addEventListener('click', () => {
        dials[i] = (dials[i] + 1) % SYMBOLS.length;
        b.textContent = SYMBOLS[dials[i]];
        sfx.tap();
      });
      grid.appendChild(b);
    });
    $('kpTry').onclick = () => this._tryAnswer(lock, dials.map((d) => SYMBOLS[d]), close);
  }

  // ------------------------------------------------------------- journal / hints

  openJournal() {
    const g = this.game;
    const entries = g.clueOrder
      .map((id) => g.clueById[id])
      .filter(Boolean)
      .map((c) => `<li>${esc(clueText(g.room, c))}</li>`)
      .join('');
    const close = showModal(`
      <h3 class="modal-title">${esc(t('journal.title'))}</h3>
      ${entries ? `<ul class="journal-list">${entries}</ul>` : `<p class="modal-text">${esc(t('journal.empty'))}</p>`}
      <p class="modal-text muted">${esc(t('journal.locks', { n: g.solvedLocks.size }))}</p>
      <div class="modal-btns"><button class="btn" id="mClose">${esc(t('btn.close'))}</button></div>`);
    $('mClose').onclick = close;
  }

  giveHint() {
    const g = this.game;
    const h = g.hint();
    if (!h) { toast(t('toast.hint.max')); return; }
    if (h.exhausted) { sfx.empty(); toast(t('toast.hint.none')); return; }
    let msg;
    if (h.stage === 1) {
      msg = t(h.kind === 'lock' ? 'hint.lock.1' : h.kind === 'item' ? 'hint.item.1' : 'hint.clue.1');
    } else {
      const prop = propName(g.room, h.propId);
      if (h.kind === 'lock') {
        if (h.lockType === 'key') {
          const item = g.itemById[h.itemId];
          msg = t('hint.lock.key.2', { item: itemName(item), prop });
        } else if (h.lockType === 'riddle') {
          msg = t('hint.lock.riddle.2', { prop });
        } else {
          msg = t('hint.lock.code.2', { prop });
        }
      } else {
        msg = t(`hint.${h.kind}.2`, { prop, spot: t('spot.' + h.spot) });
      }
      this.scene.lookAt(h.propId);
    }
    toast('💡 ' + msg, 5200);
  }

  // ------------------------------------------------------------- story / win

  showIntro(room, done) {
    const close = showModal(`
      <h3 class="modal-title">${esc(t('menu.title'))} — ${esc(t('theme.' + room.theme))}</h3>
      <p class="modal-text story">${esc(storyText(room, 'intro'))}</p>
      <div class="modal-btns"><button class="btn btn-primary btn-big" id="mGo">${esc(t('btn.ok'))}</button></div>`,
      { closable: false });
    $('mGo').onclick = () => { close(); if (done) done(); };
  }

  showWin(stats) {
    const g = this.game;
    showModal(`
      <h3 class="modal-title">${esc(t('win.title'))}</h3>
      <p class="modal-text story">${esc(storyText(g.room, 'outro'))}</p>
      <p class="modal-text">${esc(t('win.time', { t: fmtTime(stats.elapsedMs) }))}<br>
      ${esc(t('win.found', { c: stats.clues, l: stats.locks, h: stats.hints }))}</p>
      <div class="modal-btns">
        <button class="btn" id="mExport">${esc(t('win.export'))}</button>
        <button class="btn" id="mMenu">${esc(t('win.menu'))}</button>
        <button class="btn btn-primary" id="mNew">${esc(t('win.new'))}</button>
      </div>`, { closable: false });
    $('mExport').onclick = () => this.cb.onExport();
    $('mNew').onclick = () => { $('modal').classList.remove('show'); this.cb.onNewRoom(); };
    $('mMenu').onclick = () => { $('modal').classList.remove('show'); this.cb.onMenu(); };
  }

  showHowto() {
    const close = showModal(`
      <h3 class="modal-title">${esc(t('howto.title'))}</h3>
      <ol class="howto-list">
        ${[1, 2, 3, 4, 5].map((i) => `<li>${t('howto.' + i)}</li>`).join('')}
      </ol>
      <div class="modal-btns"><button class="btn btn-primary" id="mClose2">${esc(t('btn.close'))}</button></div>`);
    $('mClose2').onclick = close;
  }
}
