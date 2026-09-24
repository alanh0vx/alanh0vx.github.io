import { tileIndex, type Tile } from './engine.ts';
export function isChow(m:Tile[]){const a=m.map(tileIndex).sort((a,b)=>a-b);return a.length===3&&a[0]<27&&Math.floor(a[0]/9)===Math.floor(a[2]/9)&&a[1]===a[0]+1&&a[2]===a[0]+2;}
export function validMeld(m:Tile[]){return [3,4].includes(m.length)&&(m.every(t=>tileIndex(t)===tileIndex(m[0]))||isChow(m));}
export function chowChoices(hand:Tile[],tile:Tile,player:number,source:number):Tile[][]{
 if(player!==(source+1)%4||!tile.suit)return [];
 const choices:Tile[][]=[];
 for(let start=tile.n!-2;start<=tile.n!;start++){if(start<1||start>7)continue;const ns=[start,start+1,start+2].filter(n=>n!==tile.n);const tiles=ns.map(n=>hand.find(t=>t.suit===tile.suit&&t.n===n));if(tiles.every(Boolean))choices.push(tiles as Tile[]);}
 return choices;
}
export type Flow={phase:'claims'|'draw'|'discard'|'rob';player:number;tileId?:string;drawn?:boolean};
