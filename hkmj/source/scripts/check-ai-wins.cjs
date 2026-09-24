const assert=require('node:assert/strict');
const {makeWall}=require('../lib/mahjong/engine.ts');
const {parseSave}=require('../lib/mahjong/save.ts');
const {settle,scoreHand}=require('../lib/mahjong/table-rules.ts');
module.exports=async function checkAIWins(page,base){
 let count=0;
 for(const winner of [1,2,3])for(const mode of ['self','human-discard','ai-discard']){
  console.log('AI case',winner,mode);
  const pool=makeWall(()=>0);
  const take=keys=>keys.map(k=>{const i=pool.findIndex(t=>(t.honor??t.suit+t.n)===k);assert(i>=0,k);return pool.splice(i,1)[0]});
  const winning=take(['中','中','中','發','發','發','白','白','白','萬1','萬1','萬1','萬2']);
  const [tile]=take(['萬2']);
  const nonWinning=()=>take(['筒1','筒3','筒5','筒7','筒9','索1','索3','索5','索7','索9','東','南','西']);
  const hand=nonWinning();
  const aiHands=[1,2,3].map(p=>p===winner?winning:nonWinning());
  assert.equal(scoreHand([...hand,tile]),null,'human must not outrank the intended AI winner');
  aiHands.forEach((h,i)=>{if(i!==winner-1)assert.equal(scoreHand([...h,tile]),null)});
  const source=mode==='human-discard'?0:winner%3+1;
  const s={...base,opening:null,flowers:[[],[],[],[]],melds:[],aiMelds:[[],[],[]],hand,aiHands,wall:mode==='self'?[tile,...pool]:pool,discarded:mode==='self'?[]:[tile],drawnId:null,lastPlay:null,activeAI:null,claimPending:false,busy:true,flow:mode==='self'?{phase:'draw',player:winner}:{phase:'claims',player:source},sound:false,table:{...base.table,result:null,chicken:false,ownPassed:false}};
  assert(parseSave(JSON.stringify(s)),`${winner} ${mode} valid save`);
  await page.evaluate(s=>localStorage.setItem('hkmj.game.v1',JSON.stringify(s)),s);await page.reload();
  try { await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hkmj.game.v1')).table.result,{},{timeout:10000}); } catch(e) {console.log(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hkmj.game.v1'));return {busy:s.busy,flow:s.flow,message:s.message,aiHands:s.aiHands,table:s.table,started:s.started,opening:s.opening}}));throw e;}
  await page.locator('.hand-result').waitFor();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hkmj.game.v1')));
  const result=saved.table.result;
  assert.equal(result.winner,winner,mode);assert.equal(result.selfDrawn,mode==='self');
  assert(result.score.fan>=3);assert(result.changes[winner]>0);
  assert.deepEqual(result.changes,settle(winner,mode==='self'?null:source,result.score.fan,s.table.baseCents,s.table.paymentMode));
  assert.equal(result.changes.reduce((a,b)=>a+b,0),0);
  assert.equal(saved.flow,null);assert.equal(saved.busy,false);
  assert.equal(result.reveal.hand.length,14);assert.equal(result.reveal.winningTileId,tile.id);
  assert.deepEqual(result.reveal.hand.map(t=>t.id).sort(),[...winning,tile].map(t=>t.id).sort());
  assert.equal(await page.locator('.winning-reveal .tile').count(),14);
  assert.equal(await page.locator('.winning-tile').count(),1);
  assert.match(await page.locator('.winner-total').innerText(),/贏得/);
  assert.equal(await page.locator('.hand-result').evaluate(e=>getComputedStyle(e).color),'rgb(23, 50, 42)');
  assert(parseSave(JSON.stringify(saved)),'result with revealed tiles survives save validation');
  const balances=saved.table.balances;
  await page.reload();await page.locator('.hand-result').waitFor();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hkmj.game.v1')).table.balances),balances,'settlement not repeated on reload');
  assert.equal(await page.locator('.winning-reveal .tile').count(),14,'reveal survives reload');
  if(winner===3&&mode==='ai-discard')for(const [width,height] of [[1440,900],[390,844],[844,390]]){await page.setViewportSize({width,height});assert(await page.locator('.hand-result').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'no horizontal result overflow');await page.screenshot({path:`/private/tmp/hkmj-result-${width}.png`});}
  count++;
 }
 console.log(`PASS: ${count} AI wins: every AI seat self-draws, wins a human discard and wins another AI discard; settlement and reload checked.`);
};
