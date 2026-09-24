import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeWall} from './engine.ts';import {chowChoices,validMeld} from './claims.ts';
test('chow is previous-seat only, offers every sequence, rejects honors and wrapping',()=>{
 const wall=makeWall(()=>0);const take=(n:number)=>wall.find(t=>t.suit==='萬'&&t.n===n)!;
 const hand=[1,2,4,5].map(take);assert.equal(chowChoices(hand,take(3),0,3).length,3);assert.equal(chowChoices(hand,take(3),0,2).length,0);assert.equal(chowChoices(hand,wall.find(t=>t.honor==='東')!,0,3).length,0);assert(!validMeld([take(9),take(1),take(2)]));
});
