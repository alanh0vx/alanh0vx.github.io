import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortHand } from './sort.ts';
test('groups suits and honors in reference order without losing or mutating tiles', () => {
 const hand = [{id:'white',honor:'白'}, {id:'dot',suit:'筒',n:1}, {id:'wan9',suit:'萬',n:9}, {id:'east',honor:'東'}, {id:'bam',suit:'索',n:2}, {id:'wan1',suit:'萬',n:1}, {id:'wan1b',suit:'萬',n:1}];
 const before = [...hand];
 const sorted = sortHand(hand);
 assert.deepEqual(sorted.map(t=>t.id), ['wan1','wan1b','wan9','bam','dot','east','white']);
 assert.deepEqual(hand, before);
 assert.equal(new Set(sorted).size, hand.length);
 assert.deepEqual(sortHand(sorted), sorted);
});
