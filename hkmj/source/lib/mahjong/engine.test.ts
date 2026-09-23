import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWall, newHand, isWinningShape, discardTile, resolveClaims, assertConservation } from './engine.ts';
import type { HandState, Tile } from './engine.ts';
function tiles(indices: number[]): Tile[] {
  const wall = makeWall(() => 0);
  const ordered = ['萬', '筒', '索'];
  return indices.map(index => {
    const i = wall.findIndex(t => index < 27 ? t.suit === ordered[Math.floor(index / 9)] && t.n === index % 9 + 1 : t.honor === ['東','南','西','北','中','發','白'][index - 27]);
    assert.ok(i >= 0); return wall.splice(i, 1)[0];
  });
}
test('shuffle preserves all physical tiles and rejects invalid RNG', () => {
  const wall = makeWall(() => 0.5);
  assert.equal(wall.length, 136); assert.equal(new Set(wall.map(t => t.id)).size, 136);
  assert.deepEqual(wall, makeWall(() => 0.5));
  assert.throws(() => makeWall(() => 1));
  assert.throws(() => newHand(4));
});
test('standard, exposed, ambiguous and orphan shapes; reject false wins', () => {
  assert.ok(isWinningShape(tiles([0,1,2,3,4,5,9,10,11,27,27,27,31,31])));
  assert.ok(isWinningShape(tiles([0,0,0,1,1,1,2,2,2,3,3,3,4,4])));
  assert.ok(isWinningShape(tiles([0,1,2,9,10,11,27,27,27,31,31]), 1));
  assert.ok(isWinningShape(tiles([0,8,9,17,18,26,27,28,29,30,31,32,33,33])));
  assert.equal(isWinningShape(tiles([0,1,2,3,4,5,9,10,11,27,27,28,31,31])), false);
  assert.equal(isWinningShape(tiles([0,0,2,2,4,4,9,9,11,11,13,13,27,27])), false);
  assert.equal(isWinningShape(tiles([0,1,2])), false);
});
test('all dealers play to exhaustion without disappearing or extra tiles', () => {
  for (let dealer = 0; dealer < 4; dealer++) {
    let state = newHand(dealer, () => 0.3), discards = 0;
    assertConservation(state);
    assert.throws(() => discardTile(state, (dealer + 1) % 4, state.hands[(dealer + 1) % 4][0].id));
    while (state.phase !== 'draw') {
      const before = JSON.stringify(state);
      const next = discardTile(state, state.current, state.hands[state.current][0].id);
      assert.equal(JSON.stringify(state), before);
      state = resolveClaims(next); discards++;
      assertConservation(state);
      assert.ok(discards <= 84);
    }
    assert.equal(discards, 84); assert.equal(state.wall.length, 0);
    assert.deepEqual(state.hands.map(h => h.length), [13,13,13,13]);
    assert.throws(() => discardTile(state, state.current, state.hands[state.current][0].id));
  }
});
function claimFixture(): HandState {
  const wall = makeWall(() => 0);
  const take = (n: number) => wall.splice(wall.findIndex(t => t.suit === '萬' && t.n === n), 1)[0];
  const discard = take(3), chow = [take(1), take(2)], pung = [take(3), take(3)], fourth = take(3);
  return {wall, hands:[[],chow,pung,[fourth]], melds:[[],[],[],[]], river:[{tile:discard,player:0}], current:0,phase:'claims'};
}
test('pung overrides next-seat chow; claim moves exact physical tiles', () => {
  const state = claimFixture(); assertConservation(state);
  const result = resolveClaims(state, [{player:1,kind:'chow',ids:state.hands[1].map(t=>t.id)}, {player:2,kind:'pung',ids:state.hands[2].map(t=>t.id)}]);
  assert.equal(result.current,2); assert.equal(result.melds[2][0].kind,'pung'); assert.equal(result.river.length,0); assertConservation(result);
  assert.equal(state.river.length,1);
  assert.throws(()=>resolveClaims(state,[{player:2,kind:'chow',ids:state.hands[2].map(t=>t.id)}]));
  assert.throws(()=>resolveClaims(state,[{player:1,kind:'pung',ids:[state.hands[1][0].id,state.hands[1][0].id]}]));
});
test('kong draws one replacement from the back of the wall', () => {
  const state = claimFixture(); state.hands[2].push(state.hands[3].pop()!);
  const replacement = state.wall.at(-1)!;
  const result = resolveClaims(state,[{player:2,kind:'kong',ids:state.hands[2].map(t=>t.id)}]);
  assert.deepEqual(result.hands[2],[replacement]); assert.equal(result.wall.length,state.wall.length-1); assertConservation(result);
});
