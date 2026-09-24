import { makeWall, type Tile } from './engine.ts';
export const FLOWER_NAMES=['梅','蘭','菊','竹','春','夏','秋','冬'];
export function flowerTiles():Tile[]{return FLOWER_NAMES.map((_,flower)=>({id:`flower-${flower}`,flower}));}
export function makeFlowerWall(random:()=>number=Math.random):Tile[]{
 const wall=[...makeWall(random),...flowerTiles()];
 for(let i=wall.length-1;i>0;i--){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw new Error('Invalid RNG');const j=Math.floor(r*(i+1));[wall[i],wall[j]]=[wall[j],wall[i]];}return wall;
}
/** Flowers are exposed, then repeatedly replaced from the tail, never entering the hand. */
export function drawPlayable(wall:readonly Tile[],fromBack=false){
 const rest=[...wall],flowers:Tile[]=[];let tile=fromBack?rest.pop():rest.shift();
 while(tile?.flower!==undefined){flowers.push(tile);tile=rest.pop();}
 return {wall:rest,tile,flowers};
}
export type OpeningEvent={kind:'shuffle'|'stack'|'dice-wait'|'dice'|'break'|'deal'|'flowers'|'ready';player?:number;count?:number;flowers?:number[];counts:number[]};
export type OpeningState={index:number;dice:number[];breakSide:number;breakStack:number;events:OpeningEvent[]};
export function prepareOpening(random:()=>number=Math.random,dealer=0){
 let wall=makeFlowerWall(random);const dice=Array.from({length:3},()=>Math.floor(random()*6)+1),sum=dice.reduce((a,b)=>a+b,0),breakSide=(dealer+sum-1)%4,cut=(breakSide*36+sum*2)%144;
 wall=[...wall.slice(cut),...wall.slice(0,cut)];
 const hands:Tile[][]=[[],[],[],[]],flowers:Tile[][]=[[],[],[],[]],counts=[0,0,0,0],events:OpeningEvent[]=[];
 const event=(kind:OpeningEvent['kind'],extra:Partial<OpeningEvent>={})=>events.push({kind,counts:[...counts],...extra});
 for(const kind of ['shuffle','stack','dice-wait','dice','break'] as const)event(kind);
 // Three rounds of two stacks per player, then dealer's jump and the single tiles.
 for(let round=0;round<3;round++)for(let offset=0;offset<4;offset++){const player=(dealer+offset)%4;hands[player].push(...wall.splice(0,4));counts[player]+=4;event('deal',{player,count:4});}
 const last=wall.splice(0,5);hands[dealer].push(last[0],last[4]);counts[dealer]+=2;event('deal',{player:dealer,count:2});
 for(let offset=1;offset<4;offset++){const player=(dealer+offset)%4;hands[player].push(last[offset]);counts[player]++;event('deal',{player,count:1});}
 for(let player=0;player<4;player++){
  const exposed=hands[player].filter(t=>t.flower!==undefined);hands[player]=hands[player].filter(t=>t.flower===undefined);flowers[player].push(...exposed);
  for(const flower of exposed){const replacement=drawPlayable(wall,true);wall=replacement.wall;flowers[player].push(...replacement.flowers);if(replacement.tile)hands[player].push(replacement.tile);event('flowers',{player,flowers:[flower.flower!,...replacement.flowers.map(t=>t.flower!)]});}
 }
 event('ready');
 return {wall,hands,flowers,opening:{index:0,dice,breakSide,breakStack:sum,events} satisfies OpeningState};
}
