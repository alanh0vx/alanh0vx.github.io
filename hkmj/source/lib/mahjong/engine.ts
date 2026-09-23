/** Pure 136-tile core. Scoring eligibility is deliberately separate from shape. */
export type Suit = '萬' | '筒' | '索';
export type Tile = { suit?: Suit; n?: number; honor?: string; flower?: number; id: string };
export const suits: Suit[] = ['萬', '筒', '索'];
export const honors = ['東', '南', '西', '北', '中', '發', '白'];
export function tileIndex(tile: Tile): number {
  if(tile.flower!==undefined)throw new Error('Flower cannot form a meld');
  const index = tile.honor ? 27 + honors.indexOf(tile.honor) : suits.indexOf(tile.suit!) * 9 + (tile.n ?? 0) - 1;
  if (index < 0 || index > 33 || (tile.honor ? !honors.includes(tile.honor) || tile.suit !== undefined || tile.n !== undefined : !suits.includes(tile.suit!) || !Number.isInteger(tile.n) || tile.n! < 1 || tile.n! > 9)) throw new Error('Invalid tile');
  return index;
}
export function makeWall(random: () => number = Math.random): Tile[] {
  const wall: Tile[] = [];
  for (const suit of suits) for (let n = 1; n <= 9; n++) for (let copy = 0; copy < 4; copy++) wall.push({ suit, n, id: `${suit}${n}-${copy}` });
  for (const honor of honors) for (let copy = 0; copy < 4; copy++) wall.push({ honor, id: `${honor}-${copy}` });
  for (let i = wall.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('RNG must return [0, 1)');
    const j = Math.floor(value * (i + 1));
    [wall[i], wall[j]] = [wall[j], wall[i]];
  }
  return wall;
}
export type Meld = { kind: 'chow' | 'pung' | 'kong'; tiles: Tile[]; from: number };
export type RiverTile = { tile: Tile; player: number };
export type HandState = {
  wall: Tile[]; hands: Tile[][]; melds: Meld[][]; river: RiverTile[];
  current: number; phase: 'discard' | 'claims' | 'draw';
};
export function newHand(dealer = 0, random: () => number = Math.random): HandState {
  if (!Number.isInteger(dealer) || dealer < 0 || dealer > 3) throw new Error('Invalid dealer');
  const wall = makeWall(random), hands = Array.from({ length: 4 }, () => wall.splice(0, 13));
  hands[dealer].push(wall.shift()!);
  return { wall, hands, melds: [[], [], [], []], river: [], current: dealer, phase: 'discard' };
}
/** Standard four melds and a pair, or thirteen orphans. No seven pairs house rule. */
export function isWinningShape(tiles: Tile[], exposedMelds = 0): boolean {
  if (!Number.isInteger(exposedMelds) || exposedMelds < 0 || exposedMelds > 4 || tiles.length !== 14 - 3 * exposedMelds) return false;
  if(tiles.some(t=>t.flower!==undefined))return false;
  const counts = Array<number>(34).fill(0);
  for (const tile of tiles) if (++counts[tileIndex(tile)] > 4) return false;
  const orphans = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  if (exposedMelds === 0 && orphans.every(i => counts[i] > 0) && orphans.reduce((sum, i) => sum + counts[i], 0) === 14) return true;
  function groups(): boolean {
    const i = counts.findIndex(n => n > 0);
    if (i < 0) return true;
    if (counts[i] >= 3) {
      counts[i] -= 3; const valid = groups(); counts[i] += 3;
      if (valid) return true;
    }
    if (i < 27 && i % 9 <= 6 && counts[i + 1] && counts[i + 2]) {
      counts[i]--; counts[i + 1]--; counts[i + 2]--;
      const valid = groups();
      counts[i]++; counts[i + 1]++; counts[i + 2]++;
      if (valid) return true;
    }
    return false;
  }
  for (let i = 0; i < 34; i++) if (counts[i] >= 2) {
    counts[i] -= 2; const valid = groups(); counts[i] += 2;
    if (valid) return true;
  }
  return false;
}
export function discardTile(state: HandState, player: number, id: string): HandState {
  if (state.phase !== 'discard' || state.current !== player) throw new Error('Not your discard');
  const tile = state.hands[player].find(t => t.id === id);
  if (!tile) throw new Error('Tile is not in hand');
  return { ...state, hands: state.hands.map((hand, i) => i === player ? hand.filter(t => t.id !== id) : hand), river: [...state.river, { tile, player }], phase: 'claims' };
}
export type Claim = { player: number; kind: Meld['kind']; ids: string[] };
/** Resolve all responses together, so UI timing cannot override claim priority. */
export function resolveClaims(state: HandState, claims: Claim[] = []): HandState {
  if (state.phase !== 'claims') throw new Error('No claim window');
  const pending = state.river.at(-1)!;
  const unique = new Set<number>();
  for (const claim of claims) {
    if (!Number.isInteger(claim.player) || claim.player < 0 || claim.player > 3 || claim.player === pending.player || unique.has(claim.player)) throw new Error('Invalid claimant');
    unique.add(claim.player);
    const tiles = claim.ids.map(id => state.hands[claim.player].find(t => t.id === id));
    if (new Set(claim.ids).size !== claim.ids.length || tiles.some(t => !t)) throw new Error('Invalid claim tiles');
    const indices = [...tiles as Tile[], pending.tile].map(tileIndex).sort((a, b) => a - b);
    if (claim.kind === 'chow') {
      if (claim.player !== (pending.player + 1) % 4 || indices.length !== 3 || indices[0] >= 27 || Math.floor(indices[0] / 9) !== Math.floor(indices[2] / 9) || indices[1] !== indices[0] + 1 || indices[2] !== indices[0] + 2) throw new Error('Invalid chow');
    } else if (claim.kind === 'pung' || claim.kind === 'kong') {
      if (indices.length !== (claim.kind === 'kong' ? 4 : 3) || !indices.every(i => i === indices[0]) || (claim.kind === 'kong' && state.wall.length === 0)) throw new Error('Invalid pung/kong');
    } else throw new Error('Invalid claim kind');
  }
  const priority = (c: Claim) => (c.kind === 'chow' ? 4 : 0) + (c.player - pending.player + 4) % 4;
  const chosen = [...claims].sort((a, b) => priority(a) - priority(b))[0];
  if (!chosen) {
    const current = (pending.player + 1) % 4;
    if (!state.wall.length) return { ...state, current, phase: 'draw' };
    return { ...state, current, phase: 'discard', wall: state.wall.slice(1), hands: state.hands.map((h, i) => i === current ? [...h, state.wall[0]] : h) };
  }
  const taken = state.hands[chosen.player].filter(t => chosen.ids.includes(t.id));
  const replacement = chosen.kind === 'kong' ? state.wall.at(-1) : undefined;
  return { ...state, current: chosen.player, phase: 'discard', river: state.river.slice(0, -1),
    wall: replacement ? state.wall.slice(0, -1) : state.wall,
    hands: state.hands.map((h, i) => i === chosen.player ? [...h.filter(t => !chosen.ids.includes(t.id)), ...(replacement ? [replacement] : [])] : h),
    melds: state.melds.map((m, i) => i === chosen.player ? [...m, { kind: chosen.kind, from: pending.player, tiles: [...taken, pending.tile] }] : m) };
}
export function assertConservation(state: HandState): void {
  const tiles = [...state.wall, ...state.hands.flat(), ...state.melds.flat().flatMap(m => m.tiles), ...state.river.map(r => r.tile)];
  const expected = new Map(makeWall(() => 0).map(t => [t.id, tileIndex(t)]));
  if (tiles.length !== 136 || new Set(tiles.map(t => t.id)).size !== 136 || tiles.some(t => expected.get(t.id) !== tileIndex(t))) throw new Error('Tile conservation violated');
}
