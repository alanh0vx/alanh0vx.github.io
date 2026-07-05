/* generator.js — procedural escape-room generator. Pure module (no DOM, no three.js).
 *
 * generateRoom(seed) → room JSON (also the export format). One seeded rng drives
 * everything in a fixed call order, so the same seed always yields the same room.
 *
 * The clue chain is built by backward-chaining from the exit door: every lock
 * spawns a requirement for its key or code, keys may nest inside further locked
 * containers, and codes are minted from decor facts of props that are actually
 * rendered (book counts, clock hands, painting shapes) so what you see is the
 * answer. Each prop is consumed from a shuffled pool at most once, so the
 * dependency graph is a tree rooted at the door — always solvable.
 *
 * solveRoom(room) simulates a perfect player and returns the solve order; the
 * generator runs it before returning, so an unsolvable room can never escape
 * this module.
 */

import { makeRng, rInt, rPick, rShuffle, rPickN } from './rng.js';
import { THEMES, THEME_IDS, PROP_DEFS, COLORS, SYMBOLS, RIDDLE_TYPES } from './themes.js';

export const ROOM_FORMAT = 'escape-room-3d';
export const ROOM_VERSION = 1;

const KEY_STYLES = ['brass', 'silver', 'golden', 'iron', 'rusty', 'tiny'];
const WALL_Y = { painting: 1.5, poster: 1.5, mirror: 1.45, clock: 1.95, wallshelf: 1.45, vent: 2.1, window: 1.5, birdhouse: 1.8 };

// ---------------------------------------------------------------- geometry

/** Point along a wall. wall: 0=north(z-), 1=east(x+), 2=south(z+), 3=west(x-).
 *  t in (0,1) along the wall, inset = distance from the wall into the room.
 *  rotY makes local +z face into the room. */
function wallPoint(wall, t, w, d, inset) {
  switch (wall) {
    case 0: return { x: -w / 2 + t * w, z: -d / 2 + inset, rotY: 0 };
    case 1: return { x: w / 2 - inset, z: -d / 2 + t * d, rotY: -Math.PI / 2 };
    case 2: return { x: -w / 2 + t * w, z: d / 2 - inset, rotY: Math.PI };
    default: return { x: -w / 2 + inset, z: -d / 2 + t * d, rotY: Math.PI / 2 };
  }
}

// ---------------------------------------------------------------- generator

export function generateRoom(seed) {
  // Deterministic retry ladder: if an attempt paints itself into a corner
  // (should not happen, but never ship an unsolvable room), derive a sub-seed.
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const room = genAttempt(attempt === 0 ? String(seed) : `${seed}#${attempt}`);
      room.seed = String(seed);
      return room;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function genAttempt(seedStr) {
  const rng = makeRng('er:' + seedStr);

  // ---- 1. theme, dimensions, palette (fixed rng call order throughout)
  const themeId = rPick(rng, THEME_IDS);
  const T = THEMES[themeId];
  const w = Math.round((5.2 + rng() * 1.8) * 10) / 10;
  const d = Math.round((5.2 + rng() * 1.8) * 10) / 10;
  const h = Math.round((2.8 + rng() * 0.4) * 10) / 10;
  const wallColor = rPick(rng, T.walls);
  const floorColor = rPick(rng, T.floor);

  const props = [];
  let propN = 0;
  const usedAccents = {}; // type -> [colors], to disambiguate duplicate types
  function addProp(type, placement) {
    const used = usedAccents[type] || (usedAccents[type] = []);
    const avail = COLORS.filter((c) => !used.includes(c));
    const accent = rPick(rng, avail.length ? avail : COLORS);
    used.push(accent);
    const p = { id: 'p' + (++propN), type, accent, decor: {}, ...placement };
    props.push(p);
    return p;
  }

  // ---- 2. door
  const doorWall = rInt(rng, 0, 3);
  const dp = wallPoint(doorWall, 0.5, w, d, 0.02);
  const door = { id: 'door', type: 'door', wall: doorWall, accent: 'brown', decor: {}, pos: [dp.x, 0, dp.z], rotY: dp.rotY };
  props.push(door);

  // ---- 3. floor props, packed with real AABB collision checks so furniture
  //         never overlaps. Rotations are multiples of 90°, so footprints stay
  //         axis-aligned: swap w/d for the east/west walls.
  const aabbFor = (type, x, z, rotY) => {
    const size = PROP_DEFS[type].size;
    const swap = Math.abs(Math.sin(rotY)) > 0.5;
    const hw = (swap ? size[2] : size[0]) / 2;
    const hd = (swap ? size[0] : size[2]) / 2;
    return { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd };
  };
  const overlaps = (a, b, gap = 0.12) =>
    a.x0 < b.x1 + gap && a.x1 > b.x0 - gap && a.z0 < b.z1 + gap && a.z1 > b.z0 - gap;
  const inRoom = (bb) =>
    bb.x0 > -w / 2 + 0.02 && bb.x1 < w / 2 - 0.02 && bb.z0 > -d / 2 + 0.02 && bb.z1 < d / 2 - 0.02;

  const placedBoxes = [];
  { // keep a clear zone in front of the door
    const c = wallPoint(doorWall, 0.5, w, d, 0.7);
    placedBoxes.push({ x0: c.x - 0.8, x1: c.x + 0.8, z0: c.z - 0.8, z1: c.z + 0.8 });
  }

  const themeFloor = T.floorProps.filter((x) => x !== 'rug');
  const lockableFloor = rShuffle(rng, themeFloor.filter((x) => PROP_DEFS[x].lockable));
  const countableFloor = rShuffle(rng, themeFloor.filter((x) => PROP_DEFS[x].countable));
  const otherFloor = rShuffle(rng, themeFloor.filter((x) => !PROP_DEFS[x].lockable && !PROP_DEFS[x].countable));
  const floorTypes = [];
  const pushUnique = (t) => { if (t && !floorTypes.includes(t)) floorTypes.push(t); };
  lockableFloor.forEach(pushUnique);
  countableFloor.forEach(pushUnique);
  otherFloor.forEach(pushUnique);
  // allow one duplicate of a lockable type if the theme is short on containers
  while (floorTypes.length < 8 && lockableFloor.length) floorTypes.push(rPick(rng, lockableFloor));
  // a theme's signature prop (e.g. the garage's car) gets first pick of space
  if (T.feature && floorTypes.includes(T.feature)) {
    floorTypes.splice(floorTypes.indexOf(T.feature), 1);
    floorTypes.unshift(T.feature);
  }

  const floorSlots = [];
  for (let wall = 0; wall < 4; wall++) {
    for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) floorSlots.push({ wall, t, used: false });
  }
  const shuffledFloorSlots = rShuffle(rng, floorSlots);
  const nFloorTarget = rInt(rng, 8, 10);
  const surfaces = [];
  const tallBoxes = []; // tall furniture that would hide wall art behind it
  let placedFloor = 0;
  for (const type of floorTypes) {
    if (placedFloor >= nFloorTarget) break;
    const def = PROP_DEFS[type];
    for (const slot of shuffledFloorSlots) {
      if (slot.used) continue;
      const pt = wallPoint(slot.wall, slot.t, w, d, 0.18 + def.size[2] / 2);
      const bb = aabbFor(type, pt.x, pt.z, pt.rotY);
      if (!inRoom(bb) || placedBoxes.some((b) => overlaps(bb, b))) continue;
      slot.used = true;
      placedBoxes.push(bb);
      if (def.size[1] > 1.3) tallBoxes.push(bb);
      const p = addProp(type, { pos: [pt.x, 0, pt.z], rotY: pt.rotY });
      if (def.surface) surfaces.push(p);
      placedFloor++;
      break;
    }
  }
  if (T.floorProps.includes('rug') && rng() < 0.75) {
    addProp('rug', { pos: [0, 0, 0], rotY: rng() * Math.PI }); // flat — may sit under furniture
  }

  // ---- 4. wall props (always include a clock — codes may need its hands);
  //         skip slots that tall furniture would visually block
  const wallSlots = [];
  for (let wall = 0; wall < 4; wall++) {
    for (const t of [0.22, 0.5, 0.78]) {
      if (wall === doorWall && Math.abs(t - 0.5) < 0.18) continue;
      wallSlots.push({ wall, t, used: false });
    }
  }
  const shuffledWallSlots = rShuffle(rng, wallSlots);
  const wallTypesWanted = ['clock'];
  const otherWall = rShuffle(rng, T.wallProps.filter((x) => x !== 'clock'));
  const nWall = rInt(rng, 5, 6);
  for (let i = 0; wallTypesWanted.length < nWall && otherWall.length; i++) {
    wallTypesWanted.push(otherWall[i % otherWall.length]);
  }
  for (const type of wallTypesWanted) {
    let spot = null;
    for (const slot of shuffledWallSlots) {
      if (slot.used) continue;
      const pt = wallPoint(slot.wall, slot.t, w, d, 0.03);
      const bb = aabbFor(type, pt.x, pt.z, pt.rotY);
      if (tallBoxes.some((b) => overlaps(bb, b, 0.2))) continue;
      spot = { slot, pt };
      break;
    }
    // the clock must exist (clue chains may read its hands) — if every free
    // slot is blocked, take any unused slot anyway
    if (!spot && type === 'clock') {
      const slot = shuffledWallSlots.find((s) => !s.used);
      if (slot) spot = { slot, pt: wallPoint(slot.wall, slot.t, w, d, 0.03) };
    }
    if (!spot) continue;
    spot.slot.used = true;
    addProp(type, {
      wall: spot.slot.wall,
      pos: [spot.pt.x, WALL_Y[type] || 1.5, spot.pt.z],
      rotY: spot.pt.rotY,
    });
  }

  // ---- 5. small props on surfaces (ensure at least one lockable box exists
  //         if the room is short on containers)
  const smallTypes = rShuffle(rng, T.smallProps);
  let lockableCount = props.filter((p) => PROP_DEFS[p.type] && PROP_DEFS[p.type].lockable).length;
  surfaces.forEach((parent, i) => {
    const wantBox = lockableCount < 4 && T.smallProps.includes('box');
    const roll = rng();
    if (!wantBox && roll > 0.85) return; // sometimes a surface stays empty
    const type = wantBox ? 'box' : smallTypes[i % smallTypes.length];
    if (type === 'box') lockableCount++;
    const pdef = PROP_DEFS[parent.type];
    const lx = (rng() - 0.5) * (pdef.size[0] * 0.5);
    const cos = Math.cos(parent.rotY), sin = Math.sin(parent.rotY);
    addProp(type, {
      parentId: parent.id,
      pos: [parent.pos[0] + lx * cos, pdef.size[1], parent.pos[2] - lx * sin],
      rotY: parent.rotY,
    });
  });

  // ---- 6. decor for countables + clock → the pool of observable "facts"
  const facts = [];
  for (const p of props) {
    const def = PROP_DEFS[p.type];
    if (!def) continue;
    if (p.type === 'clock') {
      const hh = rInt(rng, 1, 9), mm = rInt(rng, 1, 9);
      p.decor.time = { h: hh, m: mm * 5 };
      facts.push({ src: 'clockHour', propId: p.id, value: hh });
      facts.push({ src: 'clockMinute', propId: p.id, value: mm });
    } else if (def.countable === 'books') {
      const groups = rPickN(rng, COLORS, rInt(rng, 2, 3)).map((color) => ({ color, n: rInt(rng, 2, 8) }));
      p.decor.books = groups;
      groups.forEach((g) => facts.push({ src: 'count', propId: p.id, what: 'books', color: g.color, value: g.n }));
    } else if (def.countable) {
      const color = rPick(rng, COLORS);
      const n = rInt(rng, 2, 7);
      p.decor[def.countable] = { color, n };
      facts.push({ src: 'count', propId: p.id, what: def.countable, color, value: n });
    }
  }
  const factPool = rShuffle(rng, facts);

  // ---- 7. clue chain (backward-chaining from the door)
  const locks = [], items = [], clues = [];
  let lockN = 0, itemN = 0, clueN = 0;
  const budget = rInt(rng, 10, 15);
  const nodeCount = () => locks.length + items.length + clues.length;
  const remaining = () => budget - nodeCount();
  const pool = rShuffle(rng, props.filter((p) => p.type !== 'door'));
  const keyStyles = rShuffle(rng, KEY_STYLES);
  let code4Used = false;
  const usedSymbolProps = new Set();
  const usedRiddleTypes = new Set();

  const openSpots = (p) => {
    const def = PROP_DEFS[p.type];
    if (!def) return [];
    return def.spots.filter((s) => s !== 'inside' || !def.lockable);
  };

  function takeFromPool(filter) {
    const idx = pool.findIndex(filter);
    if (idx >= 0) return pool.splice(idx, 1)[0];
    // fallback: reuse an already-consumed prop rather than fail (rare)
    const candidates = props.filter((p) => p.type !== 'door' && filter(p));
    if (!candidates.length) throw new Error('generator: no prop available');
    return rPick(rng, candidates);
  }

  function placeClue(clue) {
    const prop = takeFromPool((p) => openSpots(p).length > 0);
    const spots = openSpots(prop);
    // notes prefer lying on / tucked behind things
    const spot = spots.includes('on') && rng() < 0.6 ? 'on' : rPick(rng, spots);
    clue.location = { propId: prop.id, spot };
    clues.push(clue);
    return clue;
  }

  function placeItem(item, depth) {
    const lockableInPool = () => pool.some((p) => PROP_DEFS[p.type] && PROP_DEFS[p.type].lockable);
    const pDeepen = remaining() >= 8 ? 0.9 : remaining() >= 6 ? 0.75 : 0.55;
    const roll = rng(); // draw eagerly to keep call order stable
    if (depth < 3 && remaining() >= 4 && lockableInPool() && roll < pDeepen) {
      const container = takeFromPool((p) => PROP_DEFS[p.type] && PROP_DEFS[p.type].lockable);
      item.hidden = { propId: container.id, spot: 'inside' };
      makeLock(container.id, depth + 1);
    } else {
      const prop = takeFromPool((p) => openSpots(p).length > 0);
      const spot = rPick(rng, openSpots(prop));
      item.hidden = { propId: prop.id, spot };
      if (remaining() >= 1) {
        placeClue({
          id: 'C' + (++clueN), kind: 'riddleItem',
          vars: { itemId: item.id, propId: prop.id, spot, variant: rInt(rng, 0, 1) },
        });
      }
    }
  }

  function makeLock(attachedTo, depth) {
    const unusedFacts = factPool.filter((f) => !f.used);
    const taggables = props.filter((p) =>
      PROP_DEFS[p.type] && PROP_DEFS[p.type].taggable && !usedSymbolProps.has(p.id) && p.id !== attachedTo);
    // riddle answers must describe something visibly present in this room
    const attachedType = attachedTo === 'door' ? 'door' : (props.find((p) => p.id === attachedTo) || {}).type;
    const riddleTargets = [...new Set(props.map((p) => p.type))]
      .filter((tp) => RIDDLE_TYPES.includes(tp) && !usedRiddleTypes.has(tp) && tp !== attachedType);
    const candidates = [];
    if (remaining() >= 3) candidates.push('key', 'key'); // keys weighted up — the classic
    if (!code4Used && unusedFacts.length >= 4 && remaining() >= 3) candidates.push('code4', 'code4');
    if (remaining() >= 2) candidates.push('colorSeq');
    if (taggables.length >= 3 && remaining() >= 2) candidates.push('symbol3');
    if (riddleTargets.length) candidates.push('riddle');
    let type;
    if (attachedTo === 'door' && !code4Used && unusedFacts.length >= 4 && remaining() >= 3 && rng() < 0.7) {
      type = 'code4';
    } else {
      type = candidates.length ? rPick(rng, candidates) : 'colorSeq';
    }

    const lock = { id: 'L' + (++lockN), type, attachedTo, clueIds: [] };
    locks.push(lock);

    if (type === 'key') {
      const style = keyStyles.length ? keyStyles.pop() : rPick(rng, KEY_STYLES);
      const item = { id: 'I' + (++itemN), type: 'key', style, lockId: lock.id };
      lock.keyItemId = item.id;
      items.push(item);
      placeItem(item, depth);
    } else if (type === 'code4') {
      code4Used = true;
      const four = unusedFacts.slice(0, 4);
      four.forEach((f) => { f.used = true; });
      lock.answer = four.map((f) => String(f.value)).join('');
      for (let half = 0; half < 2; half++) {
        const c = placeClue({
          id: 'C' + (++clueN), kind: 'codeRecipe',
          vars: {
            lockId: lock.id, startPos: half * 2 + 1,
            facts: four.slice(half * 2, half * 2 + 2).map(({ used, ...f }) => f),
          },
        });
        lock.clueIds.push(c.id);
      }
    } else if (type === 'riddle') {
      // the riddle is engraved on the lock itself: answer = a prop type in
      // the room. No prerequisite clue — the knowledge is the room itself.
      const answer = rPick(rng, riddleTargets);
      usedRiddleTypes.add(answer);
      lock.answer = answer;
    } else if (type === 'colorSeq') {
      lock.answer = rPickN(rng, COLORS, 4);
      const c = placeClue({
        id: 'C' + (++clueN), kind: 'colorPoem',
        vars: { lockId: lock.id, colors: lock.answer.slice() },
      });
      lock.clueIds.push(c.id);
    } else { // symbol3
      const marked = rPickN(rng, taggables, 3);
      const syms = rPickN(rng, SYMBOLS, 3);
      marked.forEach((p, i) => { p.decor.symbol = syms[i]; usedSymbolProps.add(p.id); });
      lock.answer = syms.slice();
      const c = placeClue({
        id: 'C' + (++clueN), kind: 'symbolOrder',
        vars: { lockId: lock.id, propIds: marked.map((p) => p.id) },
      });
      lock.clueIds.push(c.id);
    }
  }

  makeLock('door', 0);
  while (nodeCount() < budget - 2 && locks.filter((l) => l.attachedTo === 'door').length < 3 && remaining() >= 2) {
    makeLock('door', 0);
  }
  // side quests: a locked container guarding a diary page — pads short
  // chains with real puzzle content rather than loose filler notes
  let sideQuests = 0;
  while (nodeCount() <= budget - 4 && sideQuests < 3) {
    const idx = pool.findIndex((p) => PROP_DEFS[p.type] && PROP_DEFS[p.type].lockable);
    if (idx < 0) break;
    const container = pool.splice(idx, 1)[0];
    clues.push({
      id: 'C' + (++clueN), kind: 'lore',
      vars: { variant: rInt(rng, 0, 4) },
      location: { propId: container.id, spot: 'inside' },
    });
    makeLock(container.id, 1);
    sideQuests++;
  }
  // last resort: loose story notes
  let loreN = 0;
  while (nodeCount() < 10 && loreN < 8) {
    placeClue({ id: 'C' + (++clueN), kind: 'lore', vars: { variant: rInt(rng, 0, 4) } });
    loreN++;
  }

  // ---- 8. story
  const clock = props.find((p) => p.type === 'clock');
  const story = {
    char: rPick(rng, T.chars),
    introIdx: rInt(rng, 1, T.intros),
    outroIdx: rInt(rng, 1, 2),
    time: clock ? `${clock.decor.time.h}:${String(clock.decor.time.m).padStart(2, '0')}` : '7:25',
  };

  const room = {
    format: ROOM_FORMAT, version: ROOM_VERSION, seed: seedStr,
    theme: themeId,
    room: { w, d, h, wall: wallColor, floor: floorColor, ceil: T.ceil },
    props, door: { propId: 'door' },
    locks, items, clues, story,
  };

  const order = solveRoom(room);
  if (!order) throw new Error('generator: unsolvable room for seed ' + seedStr);
  room.solutionOrder = order;
  return room;
}

// ---------------------------------------------------------------- solver

/** Simulate a perfect player. Returns the ordered list of node ids
 *  (clues found, items found, locks solved) ending with the door open,
 *  or null if the room cannot be escaped. */
export function solveRoom(room) {
  const propById = {};
  room.props.forEach((p) => { propById[p.id] = p; });
  const locksOn = (propId) => room.locks.filter((l) => l.attachedTo === propId);
  const found = new Set(), solved = new Set(), order = [];

  const accessible = (loc) => {
    if (!loc) return false;
    const p = propById[loc.propId];
    if (!p) return false;
    if (loc.spot === 'inside') {
      const def = PROP_DEFS[p.type];
      if (def && def.lockable && locksOn(p.id).some((l) => !solved.has(l.id))) return false;
    }
    return true;
  };
  const canSolve = (lock) => {
    if (lock.type === 'key') return found.has(lock.keyItemId);
    return lock.clueIds.every((id) => found.has(id));
  };

  for (let guard = 0; guard < 200; guard++) {
    let progress = false;
    for (const c of room.clues) {
      if (!found.has(c.id) && accessible(c.location)) { found.add(c.id); order.push(c.id); progress = true; }
    }
    for (const it of room.items) {
      if (!found.has(it.id) && accessible(it.hidden)) { found.add(it.id); order.push(it.id); progress = true; }
    }
    for (const l of room.locks) {
      if (!solved.has(l.id) && canSolve(l)) { solved.add(l.id); order.push(l.id); progress = true; }
    }
    const doorOpen = locksOn('door').every((l) => solved.has(l.id));
    if (doorOpen) return order;
    if (!progress) return null;
  }
  return null;
}

/** Structural + solvability validation for imported room JSON.
 *  Returns { ok, errors } — never throws. */
export function validateRoom(json) {
  const errors = [];
  try {
    if (!json || typeof json !== 'object') errors.push('not an object');
    else {
      if (json.format !== ROOM_FORMAT) errors.push('wrong format');
      if (json.version !== ROOM_VERSION) errors.push('unsupported version');
      if (!THEMES[json.theme]) errors.push('unknown theme');
      if (!Array.isArray(json.props) || !json.props.some((p) => p.id === 'door')) errors.push('missing door');
      const ids = new Set((json.props || []).map((p) => p.id));
      for (const l of json.locks || []) {
        if (l.attachedTo !== 'door' && !ids.has(l.attachedTo)) errors.push(`lock ${l.id} on missing prop`);
        if (l.type === 'key' && !(json.items || []).some((i) => i.id === l.keyItemId)) errors.push(`lock ${l.id} missing key item`);
        if (l.type === 'riddle' && !(json.props || []).some((p) => p.type === l.answer)) errors.push(`lock ${l.id} riddle answer not in room`);
      }
      for (const it of json.items || []) {
        if (!it.hidden || !ids.has(it.hidden.propId)) errors.push(`item ${it.id} hidden in missing prop`);
      }
      for (const c of json.clues || []) {
        if (!c.location || !ids.has(c.location.propId)) errors.push(`clue ${c.id} in missing prop`);
      }
      if (!errors.length && !solveRoom(json)) errors.push('room is not solvable');
    }
  } catch (e) {
    errors.push('validation error: ' + e.message);
  }
  return { ok: errors.length === 0, errors };
}
