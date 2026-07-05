/* rng.js — seeded PRNG (FNV-1a hash + mulberry32, same recipe as virtual-shopping).
 * Pure module: no DOM, safe to import from node for headless generator tests. */

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** rng from any seed value (string or number). */
export const makeRng = (seed) => mulberry32(hashStr(String(seed)));

/** Integer in [a, b] inclusive. */
export const rInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

export const rPick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function rShuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const rPickN = (rng, arr, n) => rShuffle(rng, arr).slice(0, n);
