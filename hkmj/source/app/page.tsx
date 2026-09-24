'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { playSound, setSoundEnabled, stopSounds, unlockSound, type SoundCue } from '@/lib/mahjong/sound';
import { OpeningSequence } from '@/components/opening-sequence';
import { drawPlayable, prepareOpening, FLOWER_NAMES, type OpeningState } from '@/lib/mahjong/opening';
import { MahjongFace } from '@/components/mahjong-face';
import { parseSave, SAVE_KEY } from '@/lib/mahjong/save';
import { defaultTable, eligible, kongChoices, pickNames, scoreWithFlowers as evaluateHand, settle, type HandScore } from '@/lib/mahjong/table-rules';
import { chowChoices, isChow, type Flow } from '@/lib/mahjong/claims';
import { advanceDealer, initialDealer, seatWind, roundLimit } from '@/lib/mahjong/dealer';
import { personalityLine, pickPersonalities } from '@/lib/mahjong/personality';
import { sortHand } from '@/lib/mahjong/sort';
import type { Tile } from '@/lib/mahjong/engine';
import { BookOpen, Calculator, ChartNoAxesColumn, ChevronRight, History, Lightbulb, Medal, Play, RotateCcw, Settings2, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
type View='play'|'history'|'tutorial'|'ranking'|'profile'; type Suit='萬'|'筒'|'索';
const suits:Suit[]=['萬','筒','索'], honors=['東','南','西','北','中','發','白'], avatars=['🐯','🦊','🐼','🐲','🦁','🐵','🐰','🦦'];
function tileKey(t:Tile){return t.honor??`${t.suit}${t.n}`}
function chooseAIDiscard(cards:Tile[],river:Tile[],level:string,turn:number,behind:boolean){
 if(level==='新手')return Math.floor(Math.random()*cards.length);
 const seen=new Map<string,number>();river.forEach(t=>seen.set(tileKey(t),(seen.get(tileKey(t))??0)+1));
 const count=(t:Tile)=>cards.filter(x=>tileKey(x)===tileKey(t)).length;
 const score=cards.map((t,i)=>{let keep=0,danger=0;const same=count(t);if(same>1)keep+=same*3;if(t.honor){keep+=(seen.get(tileKey(t))??0)>1?-3:1}else{for(const d of [-2,-1,1,2])if(cards.some(x=>x.suit===t.suit&&x.n===t.n!+d))keep+=Math.abs(d)===1?2.4:1;const publicCount=river.filter(x=>x.suit===t.suit).length;danger+=(9-publicCount)*.12;if(t.n===1||t.n===9)danger-=.7}if((seen.get(tileKey(t))??0)>0)danger-=2.5;const defence=turn>8||!behind;let discardValue=-keep-(defence?danger*1.4:danger*.45);if(level==='雀聖'){const nextPlayerPressure=river.slice(-9).filter(x=>x.suit===t.suit).length<2; if(nextPlayerPressure&&turn>5)discardValue-=1.8;if(behind)discardValue+=keep<2?.8:0}return {i,v:discardValue}});return score.sort((a,b)=>b.v-a.v)[0].i
}
function TileFace({tile,active,small,drawn,onClick}:{tile:Tile;active?:boolean;small?:boolean;drawn?:boolean;onClick?:()=>void}){return <button onClick={onClick} disabled={!onClick} className={`tile ${small?'tile-sm':''} ${active?'tile-active':''} ${drawn?'tile-drawn':''}`} aria-label={`${tile.flower!==undefined?FLOWER_NAMES[tile.flower]+'（花）':`${tile.n??''}${tile.suit??tile.honor}`}${drawn?'（新摸）':''}`}><MahjongFace tile={tile}/></button>}
function Avatar({value,size='md'}:{value:string;size?:'sm'|'md'|'lg'}){return <span className={`avatar avatar-${size}`} aria-hidden="true">{value}</span>}
const money=(cents:number)=>`$${(cents/100).toFixed(2)}`;
export default function Home(){
 const [table,setTable]=useState(()=>({...defaultTable(),names:pickNames(),personalities:pickPersonalities()}));
 const [view,setView]=useState<View>('play'),[started,setStarted]=useState(false),[difficulty,setDifficulty]=useState('熟手'),[rounds,setRounds]=useState('東南圈'),[seat,setSeat]=useState('東'),[hints,setHints]=useState(true),[sound,setSound]=useState(true),[avatar,setAvatar]=useState(avatars[0]);
 useEffect(()=>{setSoundEnabled(sound);const unlock=()=>{if(sound)unlockSound();};const visibility=()=>{if(document.hidden)stopSounds();};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',visibility);return ()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);stopSounds();};},[sound]);
 function toggleSound(value:boolean){setSoundEnabled(value);setSound(value);if(value){unlockSound();playSound('tile');}}
 const currentSeat=started?seatWind(0,table.dealer):seat;
 const roundWind='東南西北'[table.roundIndex],roundLabel=`${roundWind}${'一二三四'[table.handIndex]}局`;
 function scoreWithFlowers(cards:Tile[],groups:Tile[][]=[],selfDrawn=false,wind=currentSeat,petals:Tile[]=[]){return evaluateHand(cards,groups,selfDrawn,wind,petals,roundWind);}
 const nextDealer=advanceDealer(table,table.result?.winner??null),matchOver=!!table.result&&nextDealer.roundIndex>=roundLimit(rounds);
 const dealerName=table.dealer===0?'你':table.names[table.dealer-1];
 const opponents=table.names.map((name,i)=>({name,avatar:['🦊','🐲','🦁'][i],seat:started?seatWind(i+1,table.dealer):'東南西北'[('東南西北'.indexOf(seat==='隨機'?'東':seat)+i+1)%4],score:table.balances[i+1]}));
 const [wall,setWall]=useState<Tile[]>([]),[hand,setHand]=useState<Tile[]>([]),[aiHands,setAiHands]=useState<Tile[][]>([[],[],[]]),[discarded,setDiscarded]=useState<Tile[]>([]),[turn,setTurn]=useState(1),[message,setMessage]=useState('輪到你出牌'),[aiRead,setAiRead]=useState('AI 正在觀察牌河');
 const [drawnId,setDrawnId]=useState<string|null>(null),[busy,setBusy]=useState(false),[activeAI,setActiveAI]=useState<number|null>(null);
 const [flowers,setFlowers]=useState<Tile[][]>([[],[],[],[]]),[opening,setOpening]=useState<OpeningState|null>(null),[flowerNotice,setFlowerNotice]=useState<{player:number;tiles:Tile[]}|null>(null);
 const flowersRef=useRef(flowers),dialogPaused=useRef(false);
 const [savePrompt,setSavePrompt]=useState(false),[discardConfirm,setDiscardConfirm]=useState(false);
 const [melds,setMelds]=useState<Tile[][]>([]),[claimPending,setClaimPending]=useState(false);
 const [aiMelds,setAiMelds]=useState<Tile[][][]>([[],[],[]]),[flow,setFlow]=useState<Flow|null>(null);
 const [reactions,setReactions]=useState<Record<number,string>>({});
 const reactionTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
 function react(ai:number,event:'think'|'meld'|'win'|'lose'|'nudge',detail=''){
  if(!table.banter)return;const line=detail?`${detail} ${personalityLine(table.personalities[ai],event)}`:personalityLine(table.personalities[ai],event);
  setReactions(r=>({...r,[ai]:line}));const timer=setTimeout(()=>setReactions(r=>r[ai]===line?{...r,[ai]:''}:r),6500);reactionTimers.current.push(timer);
 }
 useEffect(()=>()=>reactionTimers.current.forEach(clearTimeout),[]);
 useEffect(()=>{if(!table.banter)setReactions({});},[table.banter]);

 const [selectedTile,setSelectedTile]=useState<string|null>(null);
 const claimLock=useRef(false);
 const [lastPlay,setLastPlay]=useState<{tile:Tile;ai:number}|null>(null);
 const sequence=useRef(0),locked=useRef(false),handRow=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{sequence.current++;},[]);
 useEffect(()=>{if(drawnId&&view==='play'){const row=handRow.current;if(row)row.scrollLeft=row.scrollWidth;}},[drawnId,view]);
 const [leavePrompt,setLeavePrompt]=useState(false),[savedNotice,setSavedNotice]=useState(false);
 const preserveSave=useRef(false);
 function leaveGame(save:boolean){if(save&&!saveCurrent())return;stopSounds();dialogPaused.current=false;setDiscardConfirm(false);setOpening(null);preserveSave.current=save;setLeavePrompt(false);sequence.current++;locked.current=false;setBusy(false);setActiveAI(null);setLastPlay(null);setStarted(false);}
 const [fan,setFan]=useState<Record<string,boolean>>({selfDrawn:true,allChows:false,dragon:false,clean:false});
 const [ready,setReady]=useState(false),[saveError,setSaveError]=useState(false);
 const resume=useRef(false);
 useEffect(()=>{
  try {const saved=parseSave(localStorage.getItem(SAVE_KEY));if(saved){
   setAiMelds(saved.aiMelds);setFlow(saved.flow);setFlowers(saved.flowers);flowersRef.current=saved.flowers;setOpening(saved.opening);setTable(saved.table);setMelds(saved.melds);setClaimPending(saved.claimPending);setStarted(saved.started);setWall(saved.wall);setHand(saved.hand);setAiHands(saved.aiHands);setDiscarded(saved.discarded);setTurn(saved.turn);setDrawnId(saved.drawnId);setBusy(saved.busy);setActiveAI(saved.activeAI);setLastPlay(saved.lastPlay);
   setDifficulty(saved.difficulty);setRounds(saved.rounds);setSeat(saved.seat);setHints(saved.hints);setSound(saved.sound);setAvatar(saved.avatar);setMessage(saved.message);setAiRead(saved.aiRead);resume.current=saved.started&&saved.busy&&!saved.claimPending&&!saved.table.result;
  }}catch{setSaveError(true);}setReady(true);
 },[]);
 useEffect(()=>{
  if(!ready||preserveSave.current)return;
  saveCurrent();
 },[ready,aiMelds,flow,flowers,opening,table,melds,claimPending,started,wall,hand,aiHands,discarded,turn,drawnId,busy,activeAI,lastPlay,difficulty,rounds,seat,hints,sound,avatar,message,aiRead]);
 useEffect(()=>{if(ready&&!opening&&resume.current){resume.current=false;void runOpponents(hand,[...wall],[...discarded],aiHands.map(x=>[...x]),0,flow??undefined);}},[ready,opening]);
 function saveCurrent(){
  try {localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,aiMelds,flow,flowers,opening,table,melds,claimPending,started,wall,hand,aiHands,discarded,turn,drawnId,busy,activeAI,lastPlay,difficulty,rounds,seat,hints,sound,avatar,message,aiRead}));setSaveError(false);return true;}catch{setSaveError(true);return false;}
 }
 function openConfirmation(mode:'save'|'leave'){stopSounds();dialogPaused.current=true;setDiscardConfirm(false);if(mode==='save')setSavePrompt(true);else setLeavePrompt(true);}
 function closeConfirmation(){dialogPaused.current=false;setSavePrompt(false);setLeavePrompt(false);setDiscardConfirm(false);}
 useEffect(()=>{
  if(!opening||leavePrompt||savePrompt)return;
  const current=opening.events[opening.index];if(current.kind==='dice-wait')return;
  const cue:Partial<Record<typeof current.kind,SoundCue>>={shuffle:'shuffle',stack:'stack',dice:'dice',break:'stack',deal:'deal',flowers:'flower'};if(sound&&cue[current.kind])playSound(cue[current.kind]!);
  const delays={shuffle:1500,stack:1200,'dice-wait':0,dice:1200,break:1100,deal:420,flowers:1300,ready:700};
  const timer=setTimeout(()=>{setOpening(o=>o&&o.index+1<o.events.length?{...o,index:o.index+1}:null);},delays[current.kind]);
  return ()=>{clearTimeout(timer);stopSounds();};
 },[opening,leavePrompt,savePrompt,sound]);
 function takeDraw(player:number,nextWall:Tile[],fromBack=false){
  const drawn=drawPlayable(nextWall,fromBack);nextWall.splice(0,nextWall.length,...drawn.wall);
  if(drawn.flowers.length){if(sound)playSound('flower');const next=flowersRef.current.map((list,i)=>i===player?[...list,...drawn.flowers]:list);flowersRef.current=next;setFlowers(next);setFlowerNotice({player,tiles:drawn.flowers});}
  return drawn.tile;
 }
 function endDraw(){setMessage('流局 · 無牌可補');setFlow(null);setLastPlay(null);setActiveAI(null);setBusy(false);locked.current=true;setTable(t=>({...t,result:{winner:null,selfDrawn:false,score:{fan:0,patterns:[]},changes:[0,0,0,0],description:'流局 · 無牌可補'}}));}
 const bestDiscard=useMemo(()=>hand.findIndex(t=>t.honor==='北'||t.honor==='白'),[hand]); const fanTotal=(fan.selfDrawn?1:0)+(fan.allChows?1:0)+(fan.dragon?1:0)+(fan.clean?3:0);
 function startGame(continuing=false){
  const chosenSeat=seat==='隨機'?'東南西北'[Math.floor(Math.random()*4)]:seat;
  const next=continuing&&!matchOver?nextDealer:initialDealer((4-'東南西北'.indexOf(chosenSeat))%4);
  const state={...table,...next,result:null,ownPassed:false,balances:continuing?table.balances:Array(4).fill(table.initialCents)};
  setTable(state);setAiMelds([[],[],[]]);setReactions({});reactionTimers.current.forEach(clearTimeout);reactionTimers.current=[];setSelectedTile(null);
  setMelds([]);setClaimPending(false);claimLock.current=false;preserveSave.current=false;setSavedNotice(false);sequence.current++;locked.current=next.dealer!==0;setBusy(next.dealer!==0);setActiveAI(next.dealer===0?null:next.dealer-1);setLastPlay(null);if(sound)unlockSound();
  const prepared=prepareOpening(Math.random,next.dealer),mine=prepared.hands[0];setOpening(prepared.opening);setFlowers(prepared.flowers);flowersRef.current=prepared.flowers;setFlowerNotice(null);
  setHand(next.dealer===0?[...sortHand(mine.slice(0,13)),mine[13]]:sortHand(mine));setDrawnId(next.dealer===0?mine[13].id:null);setAiHands(prepared.hands.slice(1));setWall(prepared.wall);setDiscarded([]);setTurn(1);setStarted(true);
  setFlow(next.dealer===0?null:{phase:'discard',player:next.dealer,drawn:true});resume.current=next.dealer!==0;
  setMessage(`${next.dealer===0?'你':state.names[next.dealer-1]}做莊，先出牌${next.repeats?` · 連莊 ${next.repeats}`:''}`);setAiRead(`${difficulty} AI 會按牌效、巡目同牌河決策`);setView('play');
 }

 async function discard(index:number){
  if(!started||opening||dialogPaused.current||table.result||ownDecision||locked.current||hand.length!==14-melds.length*3)return;
  setSelectedTile(null);setFlowerNotice(null);locked.current=true;setTable(t=>({...t,ownPassed:false}));setSavedNotice(false);setBusy(true);setDrawnId(null);setLastPlay(null);
  if(sound)playSound('tile');
  const playerDrop=hand[index],nextHand=sortHand(hand.filter((_,i)=>i!==index)),nextWall=[...wall],river=[...discarded,playerDrop],updated=aiHands.map(x=>[...x]);
  setHand(nextHand);setDiscarded([...river]);setMessage(`你打出 ${playerDrop.n??''}${playerDrop.suit??playerDrop.honor}`);
  await runOpponents(nextHand,nextWall,river,updated,0);
 }
 async function runOpponents(nextHand:Tile[],nextWall:Tile[],river:Tile[],updated:Tile[][],firstAI:number,continuation?:Flow,skipHuman=false){
  locked.current=true;setBusy(true);const exposed=aiMelds.map(ms=>ms.map(m=>[...m]));
  let cursor:Flow=continuation??{phase:'claims',player:firstAI};const run=++sequence.current;
  const pause=async(ms:number)=>{await new Promise(resolve=>setTimeout(resolve,ms));while(dialogPaused.current&&sequence.current===run)await new Promise(resolve=>setTimeout(resolve,100));return sequence.current===run;};
  const commit=()=>{setFlow({...cursor});setWall([...nextWall]);setAiHands(updated.map(h=>[...h]));setAiMelds(exposed.map(ms=>[...ms]));setDiscarded([...river]);};
  while(sequence.current===run){
   commit();if(!await pause(650))return;
   if(cursor.phase==='rob'){
    const player=cursor.player,ai=player-1,tile=updated[ai].find(t=>t.id===cursor.tileId)!;
    const winners=Array.from({length:3},(_,i)=>(player+i+1)%4).map(p=>({player:p,score:scoreWithFlowers([...(p===0?nextHand:updated[p-1]),tile],p===0?melds:exposed[p-1],false,p===0?currentSeat:opponents[p-1].seat,flowersRef.current[p])})).filter(w=>eligible(w.score,table.chicken)&&!(w.player===0&&skipHuman));
    if(winners[0]?.player===0){setLastPlay({tile,ai});setActiveAI(ai);setClaimPending(true);claimLock.current=false;setMessage(`${opponents[ai].name} 加槓，你可以搶槓食糊或過`);return;}
    if(winners.length){finishWin(winners[0].player,player,winners[0].score!);return;}
    skipHuman=false;const mi=exposed[ai].findIndex(m=>!isChow(m)&&tileKey(m[0])===tileKey(tile));exposed[ai][mi].push(tile);updated[ai]=updated[ai].filter(t=>t.id!==tile.id);const replacement=takeDraw(player,nextWall,true);if(replacement)updated[ai].push(replacement);setLastPlay(null);cursor={phase:'discard',player,drawn:true};commit();if(!replacement){endDraw();setBusy(false);return;}continue;
   }
   if(cursor.phase==='claims'){
    const source=cursor.player,drop=river.at(-1)!;
    const wins=Array.from({length:3},(_,i)=>(source+i+1)%4).map(player=>({player,score:scoreWithFlowers([...(player===0?nextHand:updated[player-1]),drop],player===0?melds:exposed[player-1],false,player===0?currentSeat:opponents[player-1].seat,flowersRef.current[player])})).filter(w=>eligible(w.score,table.chicken)&&!(w.player===0&&skipHuman));
    if(wins[0]&&wins[0].player!==0){finishWin(wins[0].player,source,wins[0].score!);return;}
    const choices=Array.from({length:3},(_,i)=>(source+i+1)%4).flatMap(player=>{const cards=player===0?nextHand:updated[player-1],ms=player===0?melds:exposed[player-1];if(ms.length>=4)return [];const same=cards.filter(t=>tileKey(t)===tileKey(drop));return [...(same.length>=2?[{player,kind: same.length>=3&&nextWall.length?'kong':'pung',taken:same.slice(0,same.length>=3&&nextWall.length?3:2),priority:1}]:[]),...chowChoices(cards,drop,player,source).map(taken=>({player,kind:'chow',taken,priority:2}))];}).sort((a,b)=>a.priority-b.priority);
    const humanChoices=choices.filter(c=>c.player===0),botChoice=choices.find(c=>c.player!==0);
    if(source!==0&&!skipHuman&&(wins[0]?.player===0||(!wins.length&&humanChoices.some(c=>!botChoice||c.priority<botChoice.priority||(c.priority===botChoice.priority&&(4-source)%4<(botChoice.player-source+4)%4))))){setActiveAI(source-1);setLastPlay({tile:drop,ai:source-1});setClaimPending(true);claimLock.current=false;setMessage(`${opponents[source-1].name} 出牌，等你決定上／碰／槓／食糊或過`);return;}
    skipHuman=false;
    if(botChoice){const {player,kind,taken}=botChoice,ai=player-1,ids=new Set(taken.map(t=>t.id));updated[ai]=updated[ai].filter(t=>!ids.has(t.id));exposed[ai].push(sortHand([...taken,drop]));river.pop();setLastPlay(null);setActiveAI(ai);react(ai,'meld',`${kind==='chow'?'上':kind==='kong'?'槓':'碰'}！ 😏`);setMessage(`${opponents[ai].name} ${kind==='chow'?'上':kind==='kong'?'槓':'碰'}，${kind==='kong'?'補牌後':'唔使摸牌，'}出牌`);if(sound)playSound(kind==='kong'?'kong':'pung');if(kind==='kong'){const tile=takeDraw(player,nextWall,true);if(tile)updated[ai].push(tile);else{commit();endDraw();setBusy(false);return;}}cursor={phase:'discard',player,drawn:kind==='kong'};commit();continue;}
    cursor={phase:'draw',player:(source+1)%4};setLastPlay(null);setActiveAI(null);continue;
   }
   const player=cursor.player;
   if(player===0){const draw=takeDraw(0,nextWall);setTable(t=>({...t,ownPassed:false}));setHand(draw?[...sortHand(nextHand),draw]:nextHand);setDrawnId(draw?.id??null);setWall([...nextWall]);setActiveAI(null);setLastPlay(null);setFlow(null);setBusy(false);locked.current=false;setTurn(t=>t+1);setMessage(draw?'右邊係新摸牌，請出牌':'流局');if(!draw)endDraw();else if(sound)playSound('draw');return;}
   const ai=player-1;setActiveAI(ai);setLastPlay(null);
   if(cursor.phase==='draw'){const tile=takeDraw(player,nextWall);if(!tile){endDraw();setBusy(false);setActiveAI(null);setFlow(null);return;}updated[ai].push(tile);cursor={phase:'discard',player,drawn:true};react(ai,'think');setMessage(`${opponents[ai].name} 摸牌，諗緊…`);commit();continue;}
   const score=scoreWithFlowers(updated[ai],exposed[ai],cursor.drawn!==false,opponents[ai].seat,flowersRef.current[player]);
   if(eligible(score,table.chicken)){finishWin(player,null,score!);return;}
   const kong=kongChoices(updated[ai],exposed[ai],nextWall.length)[0];
   if(kong&&kong.meldIndex>=0){cursor={phase:'rob',player,tileId:kong.tile.id};react(ai,'meld','加槓！ ✋');commit();continue;}
   if(kong){cursor={phase:'discard',player,drawn:true};const taken=kong.meldIndex>=0?[kong.tile]:updated[ai].filter(t=>tileKey(t)===tileKey(kong.tile));const ids=new Set(taken.map(t=>t.id));updated[ai]=updated[ai].filter(t=>!ids.has(t.id));if(kong.meldIndex>=0)exposed[ai][kong.meldIndex].push(kong.tile);else exposed[ai].push(taken);const tile=takeDraw(player,nextWall,true);if(tile)updated[ai].push(tile);react(ai,'meld','槓！補隻靚牌先！ 😄');setMessage(`${opponents[ai].name} 槓，從牌尾補牌`);if(sound)playSound('kong');commit();if(!tile){endDraw();setBusy(false);return;}continue;}
   const idx=chooseAIDiscard(updated[ai],river,difficulty,turn,opponents[ai].score<table.balances[0]),drop=updated[ai].splice(idx,1)[0];river.push(drop);setLastPlay({tile:drop,ai});setMessage(`${opponents[ai].name} 打出 ${drop.n??''}${drop.suit??drop.honor}`);setReactions(r=>({...r,[ai]:''}));if(sound)playSound('tile');cursor={phase:'claims',player};commit();
  }
 }

 function opponentWin(cards:Tile[][],tile:Tile,discarder:number){
  for(let step=1;step<4;step++){const player=(discarder+step)%4;if(player===0)continue;const score=scoreWithFlowers([...cards[player-1],tile],aiMelds[player-1],false,opponents[player-1].seat,flowersRef.current[player]);if(eligible(score,table.chicken))return {player,score:score!};}return null;
 }
 const competingWin=lastPlay?opponentWin(aiHands,lastPlay.tile,lastPlay.ai+1):null;
 const pendingScore=lastPlay?scoreWithFlowers([...hand,lastPlay.tile],melds,false,currentSeat,flowers[0]):null;
 const ownScore=scoreWithFlowers(hand,melds,!!drawnId,currentSeat,flowers[0]);
 const ownKongs=kongChoices(hand,melds,wall.length);
 const ownDecision=started&&!opening&&!busy&&!table.result&&!table.ownPassed&&hand.length===14-melds.length*3&&(eligible(ownScore,table.chicken)||ownKongs.length>0);
 const canIdleChat=ready&&started&&view==='play'&&!opening&&!busy&&!table.result&&!savePrompt&&!leavePrompt&&hand.length===14-melds.length*3&&table.banter;
 useEffect(()=>{if(!canIdleChat)return;let elapsed=0,count=0;const timer=setInterval(()=>{if(document.hidden||document.querySelector('[role="dialog"]'))return;elapsed++;if((elapsed===20||elapsed===50||elapsed===90)&&count<3){react((turn+count)%3,'nudge');count++;}},1000);return ()=>clearInterval(timer);},[canIdleChat,hand.map(t=>t.id).join(','),turn]);
 const robbing=flow?.phase==='rob';
 const chows=lastPlay&&!robbing&&!aiHands.some((h,i)=>i!==lastPlay.ai&&h.filter(t=>tileKey(t)===tileKey(lastPlay.tile)).length>=2)?chowChoices(hand,lastPlay.tile,0,lastPlay.ai+1):[];
 const matches=lastPlay?hand.filter(t=>tileKey(t)===tileKey(lastPlay.tile)):[];
 function finishWin(winner:number,discarder:number|null,score:HandScore){
  setFlow(null);if(winner>0)react(winner-1,'win');if(discarder!==null&&discarder>0)react(discarder-1,'lose');if(sound)playSound('win');sequence.current++;locked.current=true;setBusy(false);setClaimPending(false);setActiveAI(null);setLastPlay(null);setSavedNotice(false);
  const changes=settle(winner,discarder,score.fan,table.baseCents,table.paymentMode),description=`${winner===0?'你':opponents[winner-1].name}${discarder===null?'自摸':'食糊'} · ${score.fan} 番`;
  setTable(t=>t.result?t:{...t,balances:t.balances.map((v,i)=>v+changes[i]),result:{winner,selfDrawn:discarder===null,score,changes,description}});setMessage(description);
 }
 function decideClaim(kind:'chow'|'pung'|'kong'|'win'|'pass',chowIndex=0){
  if(opening||dialogPaused.current||!claimPending||!lastPlay||claimLock.current)return;
  if(kind==='chow'&&!chows[chowIndex])return;
  if(kind==='win'&&!eligible(pendingScore,table.chicken))return;
  if(kind==='kong'&&(matches.length<3||!wall.length))return;
  if(kind==='pung'&&matches.length<2)return;
  if((kind==='chow'||kind==='pung'||kind==='kong')&&competingWin)return;
  claimLock.current=true;setClaimPending(false);setSavedNotice(false);
  if(kind==='pass'){void runOpponents([...hand],[...wall],[...discarded],aiHands.map(x=>[...x]),lastPlay.ai+1,flow??{phase:'claims',player:lastPlay.ai+1},true);return;}
  if(kind==='win'){finishWin(0,lastPlay.ai+1,pendingScore!);return;}
  const taken=kind==='chow'?chows[chowIndex]:matches.slice(0,kind==='kong'?3:2),ids=new Set(taken.map(t=>t.id)),nextHand=sortHand(hand.filter(t=>!ids.has(t.id))),nextWall=[...wall];
  const replacement=kind==='kong'?takeDraw(0,nextWall,true):undefined;
  sequence.current++;setFlow(null);setMelds([...melds,sortHand([...taken,lastPlay.tile])]);setHand(replacement?[...nextHand,replacement]:nextHand);setWall(nextWall);setDiscarded(discarded.slice(0,-1));
  setTable(t=>({...t,ownPassed:false}));setLastPlay(null);setActiveAI(null);setDrawnId(replacement?.id??null);setBusy(false);locked.current=false;setMessage(kind==='kong'?'槓！已補牌，請出牌。':`${kind==='chow'?'上':'碰'}！請出牌，唔使摸牌。`);if(kind==='kong'&&!replacement)endDraw();if(sound)playSound(kind==='kong'?'kong':'pung');
 }
 function declareKong(id:string){
  if(opening||dialogPaused.current||busy||table.result||locked.current)return;
  const choice=ownKongs.find(c=>c.tile.id===id);if(!choice)return;
  // Added kongs allow opponents to rob the fourth tile before replacement.
  if(choice.meldIndex>=0){for(let ai=0;ai<3;ai++){const score=scoreWithFlowers([...aiHands[ai],choice.tile],aiMelds[ai],false,opponents[ai].seat,flowers[ai+1]);if(eligible(score,table.chicken)){finishWin(ai+1,0,score!);return;}}}
  const taken=choice.meldIndex>=0?[choice.tile]:hand.filter(t=>tileKey(t)===tileKey(choice.tile)),ids=new Set(taken.map(t=>t.id));
  const nextMelds=choice.meldIndex>=0?melds.map((m,i)=>i===choice.meldIndex?[...m,choice.tile]:m):[...melds,taken];
  if(sound)playSound('kong');const nextWall=[...wall],replacement=takeDraw(0,nextWall,true),nextHand=sortHand(hand.filter(t=>!ids.has(t.id)));setMelds(nextMelds);setWall(nextWall);setHand(replacement?[...nextHand,replacement]:nextHand);setDrawnId(replacement?.id??null);if(!replacement)endDraw();setTable(t=>({...t,ownPassed:false}));setMessage('槓！已從牌尾補牌，請決定或出牌。');setSavedNotice(false);
 }

 function opponentDetails(ai:number){
  const name=opponents[ai].name;
  return <Dialog><DialogTrigger render={<button className="seat-details-toggle" aria-label={`查看${name}的明牌`}><span>明牌 {aiMelds[ai].length} 組</span><small>花 {flowers[ai+1].length} · 放大</small></button>}/><DialogContent className="public-detail"><DialogHeader><DialogTitle>{name}的明牌</DialogTitle></DialogHeader><div className="meld-row">{aiMelds[ai].map((group,i)=><div className="meld-group" key={i}>{group.map(tile=><TileFace tile={tile} key={tile.id} small/>)}</div>)}</div>{!aiMelds[ai].length&&<p>未有上、碰或槓。</p>}<div className="flower-detail-tiles">{flowers[ai+1].map(tile=><figure key={tile.id}><TileFace tile={tile}/><figcaption>{FLOWER_NAMES[tile.flower!]}</figcaption></figure>)}</div></DialogContent></Dialog>;
 }
 function flowerRack(player:number){
  const list=flowers[player],name=player===0?'你':table.names[player-1],wind=player===0?currentSeat:opponents[player-1].seat;
  if(opening||!list.length)return null;
  return <Dialog><DialogTrigger render={<button className="seat-flowers" aria-label={`放大查看${name}的花牌`}><span className="seat-flower-label"><span className="flower-owner">{name} · </span>花 {list.length}</span><span className="seat-flower-tiles">{list.map(tile=><span className="flower-mini" key={tile.id}><MahjongFace tile={tile}/></span>)}</span><span className="flower-enlarge">點按放大</span></button>}/><DialogContent className="flower-detail"><DialogHeader><DialogTitle>{name}的花牌 · {wind}位</DialogTitle></DialogHeader><p>摸花後已從牌尾補牌。正花結算時每張加一番。</p><div className="flower-detail-tiles">{list.map(tile=><figure key={tile.id}><TileFace tile={tile}/><figcaption>{FLOWER_NAMES[tile.flower!]}{tile.flower!%4==='東南西北'.indexOf(wind)?' · 正花':''}</figcaption></figure>)}</div></DialogContent></Dialog>;
 }
 const nav=[['play',Play,'對局'],['history',History,'戰績'],['tutorial',BookOpen,'學堂'],['ranking',Medal,'排名'],['profile',UserRound,'我']] as const;
 if(!ready)return <main className="app-shell">載入牌局…</main>;
 return <main className={`app-shell ${view==='play'&&started?'playing-shell':''}`}><Dialog open={leavePrompt||savePrompt} onOpenChange={open=>{if(!open)closeConfirmation();}}><DialogContent><DialogHeader><DialogTitle>{savePrompt?'確認儲存牌局？':discardConfirm?'確定放棄呢局？':'離枱前儲存牌局？'}</DialogTitle></DialogHeader><p>{savePrompt?'將目前手牌、本錢及進度儲存在呢個瀏覽器。':discardConfirm?'本局進度會清除，不能還原。':'可以儲存後離枱，下次繼續；亦可以取消，留低繼續玩。'}</p><div className="leave-actions">{savePrompt?<Button onClick={()=>{if(saveCurrent()){setSavedNotice(true);closeConfirmation();}}} className="start-button">確認儲存</Button>:discardConfirm?<Button className="discard-confirm" onClick={()=>leaveGame(false)}>確認放棄並離枱</Button>:<><Button onClick={()=>leaveGame(true)} className="start-button">確認儲存並離枱</Button><Button variant="outline" onClick={()=>setDiscardConfirm(true)}>不儲存，放棄牌局</Button></>}<Button variant="outline" onClick={closeConfirmation}>取消，繼續玩</Button></div></DialogContent></Dialog><header className="topbar"><button className="brand" onClick={()=>setView('play')}><span className="brand-mark">雀</span><span>港雀館<small>香港麻雀 · {table.chicken?'雞糊起糊':'三番起糊'}</small></span></button><nav className="main-nav" aria-label="主選單">{nav.map(([id,Icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon/>{label}</button>)}</nav><button className="profile-chip" onClick={()=>setView('profile')}><span><b>麻雀仔</b><small>銀雀 · 1,284</small></span><Avatar value={avatar}/></button></header>{saveError&&<p className="save-warning" role="status">未能儲存牌局，重新整理會失去進度。</p>}
 {view==='play'&&!started&&<section className="lobby page"><div className="lobby-intro"><span className="eyebrow"><Sparkles/> 今晚開枱</span><h1>埋位，打返圈。</h1><p>一人對三位電腦牌友。揀好圈數、座位同難度，即刻起莊。</p><div className="lobby-note"><span>上局</span><b>南二局 · 自摸清一色</b><strong>+48</strong></div></div><div className="setup-card"><div className="card-heading"><div><span>私人牌局</span><h2>開局設定</h2></div><Settings2/></div>
 <label>電腦難度<Select value={difficulty} onValueChange={v=>setDifficulty(v as string)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="新手">新手 · 出牌較隨意</SelectItem><SelectItem value="熟手">熟手 · 懂攻守轉換</SelectItem><SelectItem value="雀聖">雀聖 · 精準計牌</SelectItem></SelectContent></Select></label>
 <div className="split-fields"><label>圈數<Select value={rounds} onValueChange={v=>setRounds(v as string)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['東圈','東南圈','一將'].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></label><label>座位<Select value={seat} onValueChange={v=>setSeat(v as string)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['隨機','東','南','西','北'].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></label></div>
 <div className="split-fields money-settings"><label>起始本錢（虛擬）<select value={table.initialCents} onChange={e=>setTable(t=>({...t,initialCents:Number(e.target.value),balances:Array(4).fill(Number(e.target.value))}))}>{[10000,50000,100000,500000].map(n=><option key={n} value={n}>{money(n)}</option>)}</select></label><label>打幾大<select value={table.baseCents} onChange={e=>setTable(t=>({...t,baseCents:Number(e.target.value)}))}><option value={25}>二五雞 · 底 $0.25</option><option value={50}>五一 · 底 $0.50</option><option value={100}>一二蚊 · 底 $1</option><option value={200}>二四蚊 · 底 $2</option><option value={500}>五、十蚊 · 底 $5</option></select></label></div>
 <fieldset className="payment-settings"><legend>出銃付款方式</legend><label><input type="radio" name="paymentMode" value="full" checked={table.paymentMode==='full'} onChange={()=>setTable(t=>({...t,paymentMode:'full'}))}/><span><b>全銃</b><small>出銃者付晒，其餘兩家唔使付</small></span></label><label><input type="radio" name="paymentMode" value="half" checked={table.paymentMode==='half'} onChange={()=>setTable(t=>({...t,paymentMode:'half'}))}/><span><b>半銃</b><small>出銃者付一半，其餘兩家各付四分一</small></span></label><p>自摸兩種都一樣：三家各付雙份。食糊總收入相同，只改由邊家付款。</p></fieldset>
 <div className="switch-line chicken-line"><span>容許雞糊<small>開：零番起糊；關：三番起糊</small></span><Switch aria-label="容許雞糊" checked={table.chicken} onCheckedChange={chicken=>setTable(t=>({...t,chicken}))}/></div>
 <details className="table-rules"><summary>本枱番數及收付表</summary><p>本枱莊家先取十四張並先出牌。莊家食糊或流局冧莊，閒家食糊則下家接莊；每四次輪莊換圈風。連莊不額外加番或加錢。本枱採用全辣、八番封頂。每番翻倍；{table.paymentMode==='full'?'全銃：出銃者付四份，其餘兩家不用付':'半銃：出銃者付雙份，其餘兩家各一份'}；自摸三家各付雙份。槓不另收錢。本錢可記負數。一炮一響，依出牌後的順序決定食糊優先；食糊優先於碰槓，碰槓優先於上。上只可叫上家打出的同門順子；上或碰後直接出牌，不摸牌。</p><table><thead><tr><th>番</th><th>出銃</th><th>其餘各付</th><th>自摸各付</th></tr></thead><tbody>{[0,1,2,3,4,5,6,7,8].map(f=><tr key={f}><td>{f===0?'雞糊':f}</td><td>{money(table.baseCents*2**f*(table.paymentMode==='full'?4:2))}</td><td>{money(table.paymentMode==='full'?0:table.baseCents*2**f)}</td><td>{money(table.baseCents*2**f*2)}</td></tr>)}</tbody></table><p>計番：自摸、平糊、番牌及風刻各 1；混一色、對對糊、混么九 3；小三元 5；清一色 7；字一色、清么九、大三元、小四喜 10；大四喜、十三么 13。以最高合法組合計番。共 144 張，含梅蘭菊竹、春夏秋冬。花牌攤開，從牌尾補牌；正花每張加一番（只計結算，不當起糊番數）。無花、門清及花牌組合不另加番。</p></details>
 <div className="switch-line"><span><Lightbulb/> 出牌提示<small>顯示牌效較高嘅選擇</small></span><Switch checked={hints} onCheckedChange={setHints}/></div><div className="switch-line"><span>牌友閒聊<small>好脾氣、心急同寸嘴牌友；等牌時偶爾講笑</small></span><Switch aria-label="牌友閒聊" checked={table.banter} onCheckedChange={banter=>setTable(t=>({...t,banter}))}/></div><div className="switch-line sound-line"><span>🔊 麻雀聲效<small>洗牌、疊牌、骰仔、補花及叫牌聲</small></span><Switch aria-label="麻雀聲效" checked={sound} onCheckedChange={toggleSound}/></div><Button className="shuffle-opponents" variant="outline" onClick={()=>setTable(t=>({...t,names:pickNames(),personalities:pickPersonalities()}))}>換一批牌友</Button><div className="players-preview"><div><Avatar value={avatar}/><span>你<small>{seat==='隨機'?'隨機位':`${seat}位`}</small></span></div>{opponents.map((p,i)=><div key={p.name}><Avatar value={p.avatar}/><span>{p.name}<small>{difficulty} · {table.personalities[i]}</small></span></div>)}</div>{preserveSave.current&&<Button className="resume-button" variant="outline" onClick={()=>window.location.reload()}>繼續已儲存牌局</Button>}<Button className="start-button" onClick={()=>startGame()}><Play/>{preserveSave.current?'開新局':'埋位開枱'}</Button></div></section>}
 {view==='play'&&started&&<section className="game-page"><div className="game-status"><div><span className="round-badge">{roundLabel}</span><span className="dealer-status">莊：{dealerName}{table.repeats>0?` · 連莊 ${table.repeats}`:''}</span><b>第 {turn} 巡</b><span>餘 {wall.length} 張</span></div><div className="scores"><span><i>{currentSeat}</i>你 <b>{money(table.balances[0])}</b></span>{opponents.map(p=><span key={p.name}><i>{p.seat}</i>{p.name}<b>{money(p.score)}</b></span>)}</div><div className="save-actions"><Button variant="outline" onClick={()=>openConfirmation('save')}>{savedNotice?'已儲存':'儲存'}</Button><Button variant="outline" onClick={()=>openConfirmation('leave')}><RotateCcw/>離枱</Button></div></div><div className="mobile-balance"><button className="sound-toggle" aria-label={sound?'關閉聲效':'開啟聲效'} aria-pressed={sound} onClick={()=>toggleSound(!sound)}>{sound?'🔊 聲效開':'🔇 聲效關'}</button><button className="sound-toggle banter-toggle" aria-pressed={table.banter} onClick={()=>setTable(t=>({...t,banter:!t.banter}))}>{table.banter?'💬 閒聊開':'💬 閒聊關'}</button>本錢 {money(table.balances[0])} · 底 {money(table.baseCents)} · {table.paymentMode==='full'?'全銃':'半銃'} · {table.chicken?'零番起糊':'三番起糊'}</div><div className="table-wrap"><div className="mahjong-table">{opening&&<OpeningSequence opening={opening} names={['你',...table.names]} onRoll={()=>setOpening(o=>o?{...o,index:o.index+1}:null)} onSkip={()=>{stopSounds();setOpening(null);}}/>}<div className={`opponent north ${activeAI===1?'opponent-active':''}`}><Avatar value={opponents[1].avatar}/><span>{opponents[1].name}{table.dealer===2&&<em className="dealer-marker">莊{table.repeats?` · ${table.repeats}連莊`:''}</em>}<small title={table.personalities[1]}>{aiHands[1].length} 張</small></span>{reactions[1]&&<span className="ai-bubble" role="status" title={reactions[1]}>{reactions[1]}</span>}<div className="seat-public">{aiMelds[1].length>0&&<div className="ai-melds">{aiMelds[1].map((m,i)=><span key={i} title={m.length===4?'槓':isChow(m)?'上':'碰'}>{m.map(t=><TileFace key={t.id} tile={t} small/>)}</span>)}</div>}{flowerRack(2)}{opponentDetails(1)}</div><div className="wall wall-north" role="img" aria-label={`${opponents[1].name}：${aiHands[1].length} 張暗牌`}>{Array.from({length:aiHands[1].length}).map((_,i)=><i key={i}/>)}</div></div><div className={`opponent west ${activeAI===2?'opponent-active':''}`}><Avatar value={opponents[2].avatar}/><span>{opponents[2].name}{table.dealer===3&&<em className="dealer-marker">莊{table.repeats?` · ${table.repeats}連莊`:''}</em>}<small title={table.personalities[2]}>{aiHands[2].length} 張</small></span>{reactions[2]&&<span className="ai-bubble" role="status" title={reactions[2]}>{reactions[2]}</span>}<div className="seat-public">{aiMelds[2].length>0&&<div className="ai-melds">{aiMelds[2].map((m,i)=><span key={i} title={m.length===4?'槓':isChow(m)?'上':'碰'}>{m.map(t=><TileFace key={t.id} tile={t} small/>)}</span>)}</div>}{flowerRack(3)}{opponentDetails(2)}</div><div className="wall wall-west" role="img" aria-label={`${opponents[2].name}：${aiHands[2].length} 張暗牌`}>{Array.from({length:aiHands[2].length}).map((_,i)=><i key={i}/>)}</div></div><div className={`opponent east ${activeAI===0?'opponent-active':''}`}><Avatar value={opponents[0].avatar}/><span>{opponents[0].name}{table.dealer===1&&<em className="dealer-marker">莊{table.repeats?` · ${table.repeats}連莊`:''}</em>}<small title={table.personalities[0]}>{aiHands[0].length} 張</small></span>{reactions[0]&&<span className="ai-bubble" role="status" title={reactions[0]}>{reactions[0]}</span>}<div className="seat-public">{aiMelds[0].length>0&&<div className="ai-melds">{aiMelds[0].map((m,i)=><span key={i} title={m.length===4?'槓':isChow(m)?'上':'碰'}>{m.map(t=><TileFace key={t.id} tile={t} small/>)}</span>)}</div>}{flowerRack(1)}{opponentDetails(0)}</div><div className="wall wall-east" role="img" aria-label={`${opponents[0].name}：${aiHands[0].length} 張暗牌`}>{Array.from({length:aiHands[0].length}).map((_,i)=><i key={i}/>)}</div></div><div className="table-center"><span>{roundWind}</span><b>{'一二三四'[table.handIndex]}</b><small>圈風 {roundWind}</small></div>{lastPlay&&<div key={lastPlay.tile.id} className={`last-play from-${['east','north','west'][lastPlay.ai]}`}><span>{opponents[lastPlay.ai].name} 出牌</span><TileFace tile={lastPlay.tile}/></div>}{discarded.length>0&&<Dialog><DialogTrigger render={<button className="discard-pool river-grid" aria-label={`放大查看牌河，共 ${discarded.length} 張`}><span className="river-caption">牌河 · {discarded.length} 張 · 點按放大</span><span className="river-tiles" style={{['--river-columns' as string]:Math.min(12,discarded.length),['--river-rows' as string]:Math.max(1,Math.ceil(discarded.length/12))}}>{discarded.map(t=><span key={t.id} className={`river-tile ${lastPlay?.tile.id===t.id?'river-latest':''}`}><MahjongFace tile={t}/></span>)}</span></button>}/><DialogContent className="river-dialog"><DialogHeader><DialogTitle>牌河 · {discarded.length} 張</DialogTitle></DialogHeader><p>按出牌先後排列，金框係最新打出的牌。已被上、碰、槓的牌會移到叫牌者面前。</p><div className="river-detail">{discarded.map((t,i)=><figure key={t.id}><TileFace tile={t} small/><figcaption>{i+1}</figcaption></figure>)}</div></DialogContent></Dialog>}</div><Dialog><DialogTrigger render={<Button variant="outline" className="coach-toggle"><Lightbulb/><span>牌友提示</span></Button>}/><DialogContent className="coach-dialog"><DialogHeader><DialogTitle>牌友提示</DialogTitle></DialogHeader><div className="coach-content"><div className="coach-head"><Lightbulb/><span><b>牌友提示</b><small>{difficulty}分析</small></span></div>{hints?<><p>先打 <b>{bestDiscard>=0?hand[bestDiscard]?.honor:'孤張字牌'}</b>，保留兩面搭子，向平糊方向行。</p><div className="ukeire"><span>AI 讀局</span><p>{aiRead}</p><small>只分析公開資訊，不會偷睇手牌</small></div></>:<p>提示已關閉。靠自己眼光打呢舖！</p>}<Dialog><DialogTrigger render={<Button variant="outline" className="fan-button"><Calculator/>番數計算器</Button>}/><DialogContent><DialogHeader><DialogTitle>番數計算器</DialogTitle></DialogHeader><FanCalculator fan={fan} setFan={setFan} total={fanTotal}/></DialogContent></Dialog></div></DialogContent></Dialog></div><div className="hand-dock">{!opening&&flowerNotice&&flowerNotice.player===0&&<div className="flower-notice" role="status">{flowerNotice.player===0?'你':table.names[flowerNotice.player-1]} 摸花：{flowerNotice.tiles.map(tile=><TileFace key={tile.id} tile={tile} small/>)}<span>已從牌尾補牌</span></div>}{flowerRack(0)}<div className="turn-message" role="status" aria-live="polite"><span className="pulse"/>{opening?'開局準備中…':message}</div>{claimPending&&<div className="claim-choice" role="group" aria-label="叫牌決定"><strong>等你決定</strong><Button variant="outline" onClick={()=>decideClaim('pass')}>過</Button>{eligible(pendingScore,table.chicken)&&<Button className="claim-button" onClick={()=>decideClaim('win')}>食糊 · {pendingScore!.fan} 番</Button>}{!competingWin&&chows.map((tiles,i)=><Button key={i} className="claim-button" onClick={()=>decideClaim('chow',i)}>上 {sortHand([...tiles,lastPlay!.tile]).map(t=>t.n).join('')} {tiles[0].suit}</Button>)}{!robbing&&!competingWin&&matches.length>=3&&wall.length>0&&<Button className="claim-button" onClick={()=>decideClaim('kong')}>槓</Button>}{!robbing&&!competingWin&&matches.length>=2&&melds.length<4&&<Button className="claim-button" onClick={()=>decideClaim('pung')}>碰</Button>}</div>}
 {ownDecision&&<div className="claim-choice" role="group" aria-label="摸牌決定"><strong>請決定</strong>{eligible(ownScore,table.chicken)&&<Button className="claim-button" onClick={()=>finishWin(0,null,ownScore!)}>{drawnId?'自摸':'食糊'} · {ownScore!.fan} 番</Button>}{ownKongs.map(c=><Button key={c.tile.id} className="claim-button" onClick={()=>declareKong(c.tile.id)}>{c.meldIndex>=0?'加槓':'暗槓'} {c.tile.n??''}{c.tile.suit??c.tile.honor}</Button>)}<Button variant="outline" onClick={()=>setTable(t=>({...t,ownPassed:true}))}>過，繼續出牌</Button></div>}
 {table.result&&<div className="hand-result" role="status"><h2>{table.result.description}</h2><p>{table.result.score.patterns.map(p=>`${p.name} ${p.fan}番`).join(' · ')}</p><div className="result-balances">{['你',...table.names].map((name,i)=><div key={name}><b>{name}</b><span>{table.result!.changes[i]>=0?'+':''}{money(table.result!.changes[i])}</span><strong>餘額 {money(table.balances[i])}</strong></div>)}</div><p className="dealer-next">{matchOver?'本場完結':nextDealer.dealer===table.dealer?`${dealerName}冧莊 · 連莊 ${nextDealer.repeats}`:`輪莊：${nextDealer.dealer===0?'你':table.names[nextDealer.dealer-1]}做莊`}</p><Button className="claim-button" onClick={()=>startGame(true)}>{matchOver?'再開一場 · 保留本錢':'下一局 · 保留本錢'}</Button></div>}
 {melds.length>0&&<div className="meld-row" aria-label="已叫牌">{melds.map((group,i)=><div className="meld-group" key={i}><span>{group.length===4?'槓':isChow(group)?'上':'碰'}</span>{group.map(tile=><TileFace key={tile.id} tile={tile} small/>)}</div>)}</div>}<div className={`hand-row ${opening?'dealing-hand':''}`} ref={handRow} aria-busy={busy}>{hand.map((tile,i)=><TileFace key={tile.id} tile={tile} active={!busy&&(selectedTile===tile.id||(!selectedTile&&hints&&i===bestDiscard))} drawn={tile.id===drawnId} onClick={!opening&&!busy&&!table.result&&!ownDecision&&hand.length===14-melds.length*3?()=>setSelectedTile(tile.id):undefined}/>)}</div><div className="action-row"><span>{table.result?'本局已完結':claimPending||ownDecision?'等你決定叫牌或過':busy?'等候牌友出牌…':selectedTile?'已選牌，確認後打出':'點牌選取，再按出牌'}</span><div>{selectedTile&&hand.find(t=>t.id===selectedTile)&&<span className="selected-preview"><MahjongFace tile={hand.find(t=>t.id===selectedTile)!}/></span>}<Button className="discard-button" disabled={busy||!!opening||!!table.result||ownDecision||!hand.some(t=>t.id===selectedTile)} onClick={()=>{const index=hand.findIndex(t=>t.id===selectedTile);if(index>=0)void discard(index);}}>出牌</Button></div></div></div></section>}
 {view==='history'&&<SimplePage icon={<History/>} title="對局戰績" subtitle="近十場 · 6 勝 4 負"><div className="stat-grid"><Stat n="+186" label="總分"/><Stat n="32%" label="自摸率"/><Stat n="4.8" label="平均番數"/></div><div className="list-card">{[['今日 21:18','東南圈','第 1 名','+48'],['昨日 23:04','東圈','第 3 名','-12'],['9月21日 20:46','東南圈','第 2 名','+8']].map(r=><div className="history-row" key={r[0]}><span><b>{r[0]}</b><small>{r[1]} · 熟手</small></span><span>{r[2]}</span><strong className={r[3].startsWith('+')?'win':''}>{r[3]}</strong><ChevronRight/></div>)}</div></SimplePage>}
 {view==='tutorial'&&<SimplePage icon={<BookOpen/>} title="港雀學堂" subtitle="由開門到計番，逐步學識香港麻雀"><div className="lesson-grid">{[['01','認牌與執位','萬、筒、索同番子'],['02','食碰槓規則','幾時可以叫牌'],['03','食糊入門','四組一對，三番起糊'],['04','攻守判斷','睇牌河、避銃牌']].map((x,i)=><button className="lesson" key={x[0]}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div><em>{i===0?'已完成':i===1?'學到一半':'未開始'}</em><ChevronRight/></button>)}</div></SimplePage>}
 {view==='ranking'&&<SimplePage icon={<ChartNoAxesColumn/>} title="本週排名" subtitle="銀雀組 · 週一重置"><div className="podium"><div><Avatar value="🦊" size="lg"/><b>2</b><strong>醒目娟</strong><small>1,462</small></div><div className="first"><Avatar value="🐲" size="lg"/><b>1</b><strong>十三么</strong><small>1,588</small></div><div><Avatar value={avatar} size="lg"/><b>3</b><strong>麻雀仔</strong><small>1,284</small></div></div><div className="rank-note"><Medal/>你距離第二名仲差 <b>178 分</b></div></SimplePage>}
 {view==='profile'&&<SimplePage icon={<UserRound/>} title="玩家檔案" subtitle="麻雀仔 · 加入第 128 日"><div className="profile-panel"><div className="avatar-picker"><Avatar value={avatar} size="lg"/><div><h3>揀個頭像</h3><p>每局都可以轉新形象。</p></div></div><div className="avatar-options">{avatars.map(a=><button key={a} className={avatar===a?'chosen':''} onClick={()=>setAvatar(a)}><Avatar value={a}/></button>)}<button onClick={()=>setAvatar(avatars[Math.floor(Math.random()*avatars.length)])}><RotateCcw/>隨機</button></div><div className="profile-stats"><Stat n="186" label="完成對局"/><Stat n="42" label="食糊次數"/><Stat n="8" label="最高連勝"/></div></div></SimplePage>}</main>}
function FanCalculator({fan,setFan,total}:{fan:Record<string,boolean>;setFan:(v:Record<string,boolean>)=>void;total:number}){const rows=[['selfDrawn','自摸','1 番'],['allChows','平糊','1 番'],['dragon','番牌刻子','1 番'],['clean','混一色','3 番']];return <div className="fan-calc">{rows.map(([k,l,n])=><label key={k}><span><b>{l}</b><small>{n}</small></span><Switch checked={fan[k]} onCheckedChange={v=>setFan({...fan,[k]:v})}/></label>)}<div className="fan-total"><span>合共</span><strong>{total} 番</strong><b>{total>=3?'可以食糊':'未夠三番'}</b></div></div>}
function SimplePage({icon,title,subtitle,children}:{icon:React.ReactNode;title:string;subtitle:string;children:React.ReactNode}){return <section className="sub-page page"><header><span>{icon}</span><div><h1>{title}</h1><p>{subtitle}</p></div></header>{children}</section>}; function Stat({n,label}:{n:string;label:string}){return <div className="stat"><strong>{n}</strong><span>{label}</span></div>}
