import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWall,isWinningShape} from './engine.ts';
import {flowerTiles,drawPlayable,prepareOpening} from './opening.ts';
import {eligible,scoreWithFlowers} from './table-rules.ts';
function rng(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
test('opening preserves 144 unique tiles, deals real stacks, resolves all flowers',()=>{
 for(let seed=0;seed<100;seed++){const p=prepareOpening(rng(seed)),all=[...p.wall,...p.hands.flat(),...p.flowers.flat()];assert.equal(all.length,144);assert.equal(new Set(all.map(t=>t.id)).size,144);assert.deepEqual(p.hands.map(h=>h.length),[14,13,13,13]);assert(p.hands.flat().every(t=>t.flower===undefined));assert(p.flowers.flat().every(t=>t.flower!==undefined));assert.equal(p.opening.breakStack,p.opening.dice.reduce((a,b)=>a+b));assert.equal(p.opening.breakSide,(p.opening.breakStack-1)%4);assert.equal(p.opening.events.filter(e=>e.kind==='deal'&&e.count===4).length,12);assert.deepEqual(p.opening.events.at(-1)?.counts,[14,13,13,13]);}
});
test('consecutive flowers draw replacements from tail without consuming front tiles',()=>{
 const [first,second]=makeWall(()=>0),flowers=flowerTiles();const result=drawPlayable([flowers[0],first,second,flowers[1]]);assert.deepEqual(result.flowers,[flowers[0],flowers[1]]);assert.equal(result.tile,second);assert.deepEqual(result.wall,[first]);const empty=drawPlayable([flowers[0],flowers[1]],true);assert.equal(empty.tile,undefined);assert.equal(empty.wall.length,0);assert.equal(empty.flowers.length,2);
});
test('flower fan does not satisfy minimum and flowers cannot enter winning shapes',()=>{
 const pool=makeWall(()=>0);const keys=['萬1','萬2','萬3','筒2','筒3','筒4','索4','索5','索6','索8','索8','索8','西','西'];const hand=keys.map(k=>pool.splice(pool.findIndex(t=>(t.honor??`${t.suit}${t.n}`)===k),1)[0]);const score=scoreWithFlowers(hand,[],true,'東',[flowerTiles()[0],flowerTiles()[4]]);assert.equal(score?.fan,3);assert.equal(score?.handFan,1);assert(!eligible(score,false));assert(eligible(score,true));assert(!isWinningShape([...hand.slice(0,-1),flowerTiles()[0]]));
});
