/* game.js — game state machine. No DOM, no three.js: takes a generated room,
 * applies actions, emits events. ui.js renders it; save.js persists it. */

import { PROP_DEFS } from './themes.js';

export class Game {
  static MAX_HINTS = 3;

  constructor(room, progress = null) {
    this.room = room;
    this.propById = {};
    room.props.forEach((p) => { this.propById[p.id] = p; });
    this.lockById = {};
    room.locks.forEach((l) => { this.lockById[l.id] = l; });
    this.clueById = {};
    room.clues.forEach((c) => { this.clueById[c.id] = c; });
    this.itemById = {};
    room.items.forEach((i) => { this.itemById[i.id] = i; });

    const p = progress || {};
    this.solvedLocks = new Set(p.solvedLocks || []);
    this.inventory = new Set(p.inventory || []);
    this.foundClues = new Set(p.foundClues || []);
    this.searched = new Set(p.searched || []);
    this.clueOrder = (p.clueOrder || []).filter((id) => this.foundClues.has(id));
    this.elapsedMs = p.elapsedMs || 0;
    this.hintsUsed = p.hintsUsed || 0;
    this.escaped = !!p.escaped;
    this.lastHint = p.lastHint || null; // {nodeId, stage}
    this.listeners = [];
  }

  on(fn) { this.listeners.push(fn); }
  emit(type, payload) { this.listeners.forEach((fn) => fn(type, payload || {})); }

  // ------------------------------------------------------------- queries

  locksOn(propId) { return this.room.locks.filter((l) => l.attachedTo === propId); }
  unsolvedLocksOn(propId) { return this.locksOn(propId).filter((l) => !this.solvedLocks.has(l.id)); }
  isLocked(propId) { return this.unsolvedLocksOn(propId).length > 0; }

  /** Spots the inspect panel offers for a prop. */
  spotsFor(propId) {
    const p = this.propById[propId];
    const def = PROP_DEFS[p.type];
    return def ? def.spots.slice() : [];
  }

  spotAccessible(propId, spot) {
    if (spot !== 'inside') return true;
    const def = PROP_DEFS[this.propById[propId].type];
    if (def && def.lockable && this.isLocked(propId)) return false;
    return true;
  }

  canSolve(lock) {
    if (lock.type === 'key') return this.inventory.has(lock.keyItemId);
    return lock.clueIds.every((id) => this.foundClues.has(id));
  }

  doorOpen() { return this.locksOn('door').every((l) => this.solvedLocks.has(l.id)); }

  // ------------------------------------------------------------- actions

  /** Search one spot of a prop. Items are pocketed, clues journaled. */
  search(propId, spot) {
    if (!this.spotAccessible(propId, spot)) return { locked: true, found: [] };
    const key = propId + ':' + spot;
    const found = [];
    for (const c of this.room.clues) {
      if (!this.foundClues.has(c.id) && c.location.propId === propId && c.location.spot === spot) {
        this.foundClues.add(c.id);
        this.clueOrder.push(c.id);
        found.push({ type: 'clue', clue: c });
      }
    }
    for (const it of this.room.items) {
      if (!this.inventory.has(it.id) && it.hidden.propId === propId && it.hidden.spot === spot) {
        this.inventory.add(it.id);
        found.push({ type: 'item', item: it });
      }
    }
    const first = !this.searched.has(key);
    this.searched.add(key);
    this.emit('change');
    if (found.length) this.emit('found', { found });
    return { locked: false, found, first };
  }

  /** Try a lock. For key locks answer is ignored (inventory is checked);
   *  for code locks answer is the entered string/array. */
  tryLock(lockId, answer) {
    const lock = this.lockById[lockId];
    if (!lock || this.solvedLocks.has(lock.id)) return { ok: false, reason: 'gone' };
    let ok = false, reason = '';
    if (lock.type === 'key') {
      if (this.inventory.has(lock.keyItemId)) ok = true;
      else {
        const hasAnyKey = this.room.items.some((i) => i.type === 'key' && this.inventory.has(i.id));
        reason = hasAnyKey ? 'wrongKey' : 'needKey';
      }
    } else {
      const want = Array.isArray(lock.answer) ? lock.answer.join(',') : String(lock.answer);
      const got = Array.isArray(answer) ? answer.join(',') : String(answer || '');
      ok = want === got;
      if (!ok) reason = 'wrongCode';
    }
    if (ok) {
      this.solvedLocks.add(lock.id);
      this.emit('change');
      this.emit('unlock', { lock });
      if (this.doorOpen()) this.emit('doorReady');
    }
    return { ok, reason, lock };
  }

  /** Player walks out (only when the door is open). */
  escape() {
    if (!this.doorOpen() || this.escaped) return false;
    this.escaped = true;
    this.emit('change');
    this.emit('win', this.stats());
    return true;
  }

  tick(dt) { if (!this.escaped) this.elapsedMs += dt; }

  stats() {
    return {
      elapsedMs: this.elapsedMs,
      clues: this.foundClues.size,
      locks: this.solvedLocks.size,
      hints: this.hintsUsed,
    };
  }

  // ------------------------------------------------------------- hints

  nodeDone(id) {
    return this.foundClues.has(id) || this.inventory.has(id) || this.solvedLocks.has(id);
  }

  hintsRemaining() { return Math.max(0, Game.MAX_HINTS - this.hintsUsed); }

  /** Progressive hint: first pending node in solutionOrder; asking twice about
   *  the same node escalates from vague to explicit. Returns a descriptor
   *  that ui.js turns into localized text, null when the door is next, or
   *  {exhausted:true} once all hints are spent. */
  hint() {
    const nextId = (this.room.solutionOrder || []).find((id) => !this.nodeDone(id));
    if (!nextId) return null;
    if (this.hintsRemaining() <= 0) return { exhausted: true };
    let stage = 1;
    if (this.lastHint && this.lastHint.nodeId === nextId) stage = 2;
    this.lastHint = { nodeId: nextId, stage };
    this.hintsUsed++;
    this.emit('change');

    if (this.clueById[nextId]) {
      const c = this.clueById[nextId];
      return { kind: 'clue', stage, propId: c.location.propId, spot: c.location.spot };
    }
    if (this.itemById[nextId]) {
      const it = this.itemById[nextId];
      return { kind: 'item', stage, propId: it.hidden.propId, spot: it.hidden.spot, itemId: it.id };
    }
    const l = this.lockById[nextId];
    return {
      kind: 'lock', stage, lockType: l.type, propId: l.attachedTo,
      itemId: l.keyItemId || null,
    };
  }

  // ------------------------------------------------------------- persistence

  serialize() {
    return {
      solvedLocks: [...this.solvedLocks],
      inventory: [...this.inventory],
      foundClues: [...this.foundClues],
      clueOrder: this.clueOrder.slice(),
      searched: [...this.searched],
      elapsedMs: Math.round(this.elapsedMs),
      hintsUsed: this.hintsUsed,
      escaped: this.escaped,
      lastHint: this.lastHint,
    };
  }
}
