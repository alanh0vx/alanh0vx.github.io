import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWall} from './engine.ts';
import {scoreHand,eligible,settle,kongChoices,pickNames} from './table-rules.ts';
import {parseSave} from './save.ts';
function tiles(keys:string[]){const pool=makeWall(()=>0);return keys.map(key=>{const i=pool.findIndex(t=>(t.honor??`${t.suit}${t.n}`)===key);assert(i>=0);return pool.splice(i,1)[0];});}
const chicken=['萬1','萬2','萬3','筒2','筒3','筒4','索4','索5','索6','索8','索8','索8','西','西'];
test('chicken toggle only relaxes minimum; incomplete hands never win',()=>{const score=scoreHand(tiles(chicken));assert.equal(score?.fan,0);assert(!eligible(score,false));assert(eligible(score,true));assert(!eligible(scoreHand(tiles(chicken.slice(0,13))),true));assert.equal(scoreHand(tiles(chicken),[],true)?.fan,1);});
test('decomposes for scoring, handles exposed kongs and high hands',()=>{const hand=tiles(['萬1','萬1','萬1','筒2','筒2','筒2','索3','索3','索3','西','西','西','北','北']);assert.equal(scoreHand(hand)?.fan,3);const meld=tiles(['中','中','中','中']);assert.equal(scoreHand(hand.slice(3),[meld])?.fan,4);assert.equal(scoreHand(tiles(['萬1','萬9','索1','索9','筒1','筒9','東','南','西','北','中','發','白','白']))?.fan,13);});
test('integer money conserves funds and caps payments at eight fan',()=>{assert.deepEqual(settle(0,1,0,25),[100,-50,-25,-25]);assert.deepEqual(settle(0,null,3,100),[4800,-1600,-1600,-1600]);assert.deepEqual(settle(2,0,13,100),settle(2,0,8,100));for(let winner=0;winner<4;winner++)assert.equal(settle(winner,null,4,25).reduce((a,b)=>a+b),0);});
test('kong choices need a replacement and preserve distinct options',()=>{const hand=tiles(['東','東','東','東','中']);assert.equal(kongChoices(hand,[],1).length,1);assert.equal(kongChoices(hand,[],0).length,0);assert.equal(kongChoices(tiles(['中']),[tiles(['中','中','中'])],1)[0].meldIndex,0);});
test('opponent selection has no duplicates even with repeated RNG values',()=>{assert.equal(new Set(pickNames(()=>0)).size,3);assert.equal(new Set(pickNames(()=>.999)).size,3);});
test('bad saves safely reject without throwing',()=>{assert.equal(parseSave('{'),null);assert.equal(parseSave('{}'),null);});
