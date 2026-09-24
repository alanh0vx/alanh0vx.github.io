import { chowChoices, validMeld, type Flow } from './claims.ts';
import { flowerTiles, type OpeningState } from './opening.ts';
import { defaultTable, eligible, scoreHand, type TableSettings } from './table-rules.ts';
import { makeWall, type Tile } from './engine.ts';
export const SAVE_KEY = 'hkmj.game.v1';
export type GameSave = {
 aiMelds:Tile[][][]; flow:Flow|null;
 flowers: Tile[][]; opening: OpeningState|null;
 table: TableSettings;
 melds: Tile[][]; claimPending: boolean;
 version: 1; started: boolean; wall: Tile[]; hand: Tile[]; aiHands: Tile[][]; discarded: Tile[];
 turn: number; drawnId: string|null; busy: boolean; activeAI: number|null; lastPlay: {tile:Tile;ai:number}|null;
 difficulty: string; rounds: string; seat: string; hints: boolean; sound: boolean; avatar: string;
 message: string; aiRead: string;
};
export function parseSave(raw: string|null): GameSave|null {
 try {
  if(!raw)return null; const s=JSON.parse(raw) as GameSave;
  s.aiMelds??=[[],[],[]];s.flow??=s.busy?{phase:s.lastPlay?'claims':s.activeAI===null?'claims':'discard',player:s.lastPlay?s.lastPlay.ai+1:s.activeAI===null?0:s.activeAI+1}:null;
  if(s.flow&&(!['claims','draw','discard','rob'].includes(s.flow.phase)||![0,1,2,3].includes(s.flow.player)))return null;
  if(!Array.isArray(s.aiMelds)||s.aiMelds.length!==3||!s.aiMelds.every(ms=>Array.isArray(ms)&&ms.length<=4&&ms.every(m=>Array.isArray(m)&&validMeld(m))))return null;
  s.flowers??=[[],[],[],[]];s.opening??=null;
  if(!Array.isArray(s.flowers)||s.flowers.length!==4||!s.flowers.every(list=>Array.isArray(list)&&list.every(tile=>Number.isInteger(tile.flower)&&tile.flower!>=0&&tile.flower!<8)))return null;
  if(s.opening){const o=s.opening;if(!Array.isArray(o.dice)||o.dice.length!==3||!o.dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6)||!Number.isInteger(o.breakSide)||o.breakSide<0||o.breakSide>3||!Number.isInteger(o.breakStack)||o.breakStack<3||o.breakStack>18||!Array.isArray(o.events)||o.events.length>40||!Number.isInteger(o.index)||o.index<0||o.index>=o.events.length)return null;
   if(!o.events.every(e=>['shuffle','stack','dice-wait','dice','break','deal','flowers','ready'].includes(e.kind)&&Array.isArray(e.counts)&&e.counts.length===4&&e.counts.every(n=>Number.isInteger(n)&&n>=0&&n<=14)&&(!['deal','flowers'].includes(e.kind)||(Number.isInteger(e.player)&&e.player!>=0&&e.player!<=3))&&(e.kind!=='flowers'||(Array.isArray(e.flowers)&&e.flowers.every(n=>Number.isInteger(n)&&n>=0&&n<8)))))return null;
  }
  s.table??=defaultTable();
  const t=s.table;
  if(typeof t.chicken!=='boolean'||typeof t.ownPassed!=='boolean'||![25,50,100,200,500].includes(t.baseCents)||![10000,50000,100000,500000].includes(t.initialCents))return null;
  if(!Array.isArray(t.balances)||t.balances.length!==4||!t.balances.every(Number.isSafeInteger)||t.balances.reduce((a,b)=>a+b,0)!==t.initialCents*4)return null;
  if(!Array.isArray(t.names)||t.names.length!==3||new Set(t.names).size!==3||!t.names.every(n=>typeof n==='string'&&n.length>0&&n.length<30))return null;
  if(t.result&&(![null,0,1,2,3].includes(t.result.winner)||typeof t.result.selfDrawn!=='boolean'||typeof t.result.description!=='string'||!Array.isArray(t.result.changes)||t.result.changes.length!==4||!t.result.changes.every(Number.isSafeInteger)||t.result.changes.reduce((a,b)=>a+b,0)!==0||!Number.isInteger(t.result.score?.fan)||!Array.isArray(t.result.score?.patterns)))return null;
  s.melds??=[];s.claimPending??=false;
  if(!Array.isArray(s.melds)||s.melds.length>4||typeof s.claimPending!=='boolean')return null;
  if(!s.melds.every(m=>Array.isArray(m)&&validMeld(m)))return null;
  if(s.version!==1||typeof s.started!=='boolean'||typeof s.busy!=='boolean'||typeof s.hints!=='boolean'||typeof s.sound!=='boolean')return null;
  if(!['新手','熟手','雀聖'].includes(s.difficulty)||!['東圈','東南圈','一將'].includes(s.rounds)||!['隨機','東','南','西','北'].includes(s.seat))return null;
  if(!['avatar','message','aiRead'].every(k=>typeof s[k as keyof GameSave]==='string')||!Number.isInteger(s.turn)||s.turn<1)return null;
  if(![null,0,1,2].includes(s.activeAI)||!Array.isArray(s.aiHands)||s.aiHands.length!==3)return null;
  const groups=[s.wall,s.hand,s.discarded,...s.aiHands,...s.melds,...s.aiMelds.flat(),...s.flowers];if(!groups.every(Array.isArray))return null;
  if(s.started){
   const tiles=groups.flat(),hasFlowers=tiles.some(t=>t.flower!==undefined),canonical=new Map([...makeWall(()=>0),...(hasFlowers?flowerTiles():[])].map(t=>[t.id,t]));
   if(tiles.length!==canonical.size||new Set(tiles.map(t=>t.id)).size!==canonical.size||!tiles.every(t=>{const c=canonical.get(t.id);return c&&c.suit===t.suit&&c.n===t.n&&c.honor===t.honor&&c.flower===t.flower;}))return null;
   if([...s.hand,...s.aiHands.flat(),...s.melds.flat(),...s.discarded].some(t=>t.flower!==undefined))return null;
   const waiting=13-s.melds.length*3,playing=waiting+1;
   if((!t.result&&s.hand.length!==(s.busy?waiting:s.wall.length?playing:s.hand.length))||![waiting,playing].includes(s.hand.length))return null;
   if(s.claimPending){
    if(!s.busy||!s.lastPlay||t.result)return null;
    const canPung=s.melds.length<4&&s.hand.filter(tile=>tile.suit===s.lastPlay!.tile.suit&&tile.n===s.lastPlay!.tile.n&&tile.honor===s.lastPlay!.tile.honor).length>=2;
    if(!canPung&&!chowChoices(s.hand,s.lastPlay.tile,0,s.lastPlay.ai+1).length&&!eligible(scoreHand([...s.hand,s.lastPlay.tile],s.melds,false,s.seat),t.chicken))return null;
   }
   if(!s.aiHands.every((h,i)=>t.result?[13-s.aiMelds[i].length*3,14-s.aiMelds[i].length*3].includes(h.length):h.length===((s.busy&&s.flow?.player===i+1&&['discard','rob'].includes(s.flow.phase))?14:13)-s.aiMelds[i].length*3))return null;
   if(!s.busy&&(s.activeAI!==null||s.lastPlay!==null))return null;
   if(s.lastPlay&&(s.lastPlay.ai!==s.activeAI||(s.flow?.phase==='rob'?s.lastPlay.tile.id!==s.flow.tileId||!s.aiHands[s.lastPlay.ai].some(t=>t.id===s.flow!.tileId):s.lastPlay.tile.id!==s.discarded.at(-1)?.id)))return null;
   if(s.drawnId!==null&&(s.busy||s.hand.at(-1)?.id!==s.drawnId))return null;
  }
  return s;
 } catch {return null;}
}
