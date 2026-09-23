import { isWinningShape, tileIndex, type Tile } from './engine.ts';
export const NAME_POOL=['醒目娟','十三么','阿叔','旺角明','深水埗芬姐','大埔強','荃灣珍','沙田豪','屯門輝','油麻地蓮姐','西環昌','北角玲','觀塘發','元朗琪','將軍澳樂','筲箕灣成','九龍城蘭','長洲波','太子敏','跑馬地健'];
export function pickNames(random:()=>number=Math.random){const pool=[...NAME_POOL];return Array.from({length:3},()=>pool.splice(Math.floor(random()*pool.length),1)[0]);}
export type HandScore={fan:number;handFan?:number;patterns:{name:string;fan:number}[]};
export type TableResult={winner:number|null;selfDrawn:boolean;score:HandScore;changes:number[];description:string};
export function scoreHand(hand:Tile[],melds:Tile[][]=[],selfDrawn=false,seat='東',round='東'):HandScore|null {
 if(!isWinningShape(hand,melds.length))return null;
 const counts=Array<number>(34).fill(0);hand.forEach(t=>counts[tileIndex(t)]++);
 const all=[...hand,...melds.flat()],indices=all.map(tileIndex),suits=new Set(indices.filter(i=>i<27).map(i=>Math.floor(i/9))),hasHonors=indices.some(i=>i>=27);
 const common:{name:string;fan:number}[]=[];
 const add=(name:string,fan:number)=>common.push({name,fan});
 if(selfDrawn)add('自摸',1);
 if(suits.size===1)add(hasHonors?'混一色':'清一色',hasHonors?3:7);
 if(!suits.size)add('字一色',10);
 const orphan=[0,8,9,17,18,26,27,28,29,30,31,32,33];
 if(!melds.length&&orphan.every(i=>counts[i])&&orphan.reduce((sum,i)=>sum+counts[i],0)===14)return {fan:13,patterns:[{name:'十三么',fan:13}]};
 let best:HandScore|null=null;
 const exposed=melds.map(m=>tileIndex(m[0]));
 function evaluate(pair:number,triplets:number[],chows:number){
  const patterns=[...common],pungs=[...exposed,...triplets];
  const put=(name:string,fan:number)=>patterns.push({name,fan});
  const dragons=pungs.filter(i=>i>=31).length,winds=pungs.filter(i=>i>=27&&i<=30).length;
  if(dragons===3)put('大三元',10);else if(dragons===2&&pair>=31)put('小三元',5);else pungs.filter(i=>i>=31).forEach(i=>put(['紅中','發財','白板'][i-31],1));
  if(winds===4)put('大四喜',13);else if(winds===3&&pair>=27&&pair<=30)put('小四喜',10);
  else {if(pungs.includes(27+'東南西北'.indexOf(seat)))put('門風刻子',1);if(pungs.includes(27+'東南西北'.indexOf(round)))put('圈風刻子',1);}
  if(chows===0&&suits.size>0)put('對對糊',3);
  if(chows===4&&pair<31&&pair!==27+'東南西北'.indexOf(seat)&&pair!==27+'東南西北'.indexOf(round))put('平糊',1);
  if(indices.every(i=>i<27&&(i%9===0||i%9===8)))put('清么九',10);
  else if(suits.size&&indices.every(i=>i>=27||i%9===0||i%9===8))put('混么九',3);
  const fan=patterns.reduce((n,p)=>n+p.fan,0);if(!best||fan>best.fan)best={fan,patterns:patterns.length?patterns:[{name:'雞糊',fan:0}]};
 }
 function groups(pair:number,triplets:number[],chows:number){const i=counts.findIndex(n=>n>0);if(i<0){evaluate(pair,triplets,chows);return;}if(counts[i]>=3){counts[i]-=3;groups(pair,[...triplets,i],chows);counts[i]+=3;}if(i<27&&i%9<=6&&counts[i+1]&&counts[i+2]){counts[i]--;counts[i+1]--;counts[i+2]--;groups(pair,triplets,chows+1);counts[i]++;counts[i+1]++;counts[i+2]++;}}
 for(let i=0;i<34;i++)if(counts[i]>=2){counts[i]-=2;groups(i,[],0);counts[i]+=2;}
 return best;
}
export function eligible(score:HandScore|null,chicken:boolean){return !!score&&(score.handFan??score.fan)>=(chicken?0:3);}
/** House table: full doubling to eight fan; discard pays double, others single. Cents only. */
export function settle(winner:number,discarder:number|null,fan:number,baseCents:number){
 const unit=baseCents*2**Math.min(fan,8),changes=[0,0,0,0];
 for(let i=0;i<4;i++)if(i!==winner){const amount=unit*(discarder===null||i===discarder?2:1);changes[i]-=amount;changes[winner]+=amount;}
 return changes;
}
export function kongChoices(hand:Tile[],melds:Tile[][],wallSize:number){
 if(!wallSize)return [];
 const choices:{tile:Tile;meldIndex:number}[]=[];
 for(const tile of hand){if(choices.some(c=>tileIndex(c.tile)===tileIndex(tile)))continue;
 const meldIndex=melds.findIndex(m=>m.length===3&&tileIndex(m[0])===tileIndex(tile));
 if(meldIndex>=0||hand.filter(t=>tileIndex(t)===tileIndex(tile)).length===4)choices.push({tile,meldIndex});}
 return choices;
}
export type TableSettings={chicken:boolean;baseCents:number;initialCents:number;balances:number[];names:string[];result:TableResult|null;ownPassed:boolean};
export function defaultTable():TableSettings{return {chicken:false,baseCents:100,initialCents:100000,balances:[100000,100000,100000,100000],names:NAME_POOL.slice(0,3),result:null,ownPassed:false};}
/** Flowers add settlement fan only; they do not bypass the chosen minimum hand fan. */
export function scoreWithFlowers(hand:Tile[],melds:Tile[][]=[],selfDrawn=false,seat='東',flowers:Tile[]=[]):HandScore|null{
 const score=scoreHand(hand,melds,selfDrawn,seat);if(!score)return null;
 const matching=flowers.filter(t=>t.flower!==undefined&&t.flower%4==='東南西北'.indexOf(seat));
 return {...score,handFan:score.fan,fan:score.fan+matching.length,patterns:[...score.patterns,...matching.map(t=>({name:`正花 ${['梅','蘭','菊','竹','春','夏','秋','冬'][t.flower!]}`,fan:1}))]};
}
