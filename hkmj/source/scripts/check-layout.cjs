// Requires an installed Playwright package; set PLAYWRIGHT_MODULE if external.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {makeWall}=require('../lib/mahjong/engine.ts');
const {flowerTiles}=require('../lib/mahjong/opening.ts');
const {parseSave}=require('../lib/mahjong/save.ts');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try {
 const p=await b.newPage();p.setDefaultTimeout(10000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.LAYOUT_URL||'http://127.0.0.1:4175/');
 await p.getByRole('button',{name:'埋位開枱'}).click();await p.getByRole('button',{name:'跳過動畫'}).click();
 const base=await p.evaluate(()=>JSON.parse(localStorage.getItem('hkmj.game.v1')));
 function fixture(crowded,allFlowers,decision=false,claim=false){
 const pool=makeWall(()=>0);const take=keys=>keys.map(k=>{const i=pool.findIndex(t=>(t.honor??t.suit+t.n)===k);assert(i>=0);return pool.splice(i,1)[0]});
 const groups=crowded?['東','南','西','北','中','發','白','萬1','萬2','萬3','萬4','萬5'].map(k=>take([k,k,k])):[];
 const aiMelds=crowded?[groups.slice(0,4),groups.slice(4,8),groups.slice(8,12)]:[[],[],[]];
 const hand=decision?take(['萬1','萬1','萬1','萬2','萬2','萬2','萬3','萬3','萬3','萬4','萬4','萬4','萬5','萬5']):pool.splice(0,14),aiHands=aiMelds.map(ms=>pool.splice(0,13-ms.length*3)),discarded=pool.splice(0,crowded?78:7),fs=flowerTiles();
 const s={...base,opening:null,aiMelds,hand,aiHands,discarded,wall:pool,flowers:allFlowers?[[],[],fs,[]]:[fs.slice(0,2),fs.slice(2,4),fs.slice(4,6),fs.slice(6)],melds:[],drawnId:null,lastPlay:null,activeAI:null,claimPending:false,busy:false,flow:null,sound:false,table:{...base.table,result:null,ownPassed:!decision,dealer:2,repeats:12,names:['跑馬地健','西環昌','屯門輝']}};
 if(claim){const tile=s.hand.pop();s.discarded.push(tile);s.busy=true;s.claimPending=true;s.activeAI=2;s.lastPlay={tile,ai:2};s.flow={phase:'claims',player:3};}
 assert(parseSave(JSON.stringify(s)),'valid fixture');return s;
 }
 async function check(label){
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>Promise.all([...document.querySelectorAll('.last-play')].flatMap(e=>e.getAnimations()).map(a=>a.finished.catch(()=>{}))));
 const issues=await p.evaluate(()=>{
 const issues=[],rect=e=>e.getBoundingClientRect();
 const hit=(a,b)=>{a=rect(a);b=rect(b);return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1};
 const board=document.querySelector('.mahjong-table'),br=rect(board);
 const marker=document.querySelector('.table-center'),mr=rect(marker);if(mr.width<64)issues.push('round marker too small');
 for(const child of marker.children){const r=rect(child);if(r.height&&(r.bottom>mr.bottom||r.top<mr.top||r.left<mr.left||r.right>mr.right))issues.push('round marker label overflow');}
 const parts=[...board.querySelectorAll('.opponent > .avatar,.opponent > span:not(.ai-bubble),.seat-public,.ai-bubble,.wall,.table-center,.last-play,.river-grid')];
 for(let i=0;i<parts.length;i++){const a=parts[i],r=rect(a);if(!r.width||!r.height)continue;
 if(r.left<br.left||r.right>br.right||r.top<br.top||r.bottom>br.bottom)issues.push('outside '+a.className);
 for(const c of parts.slice(i+1))if(!a.contains(c)&&!c.contains(a)&&hit(a,c))issues.push('overlap '+a.className+' / '+c.className);}
 for(const e of board.querySelectorAll('.seat-public,.ai-melds,.seat-flowers,.river-tiles'))if(e.scrollWidth>e.clientWidth+1)issues.push('overflow '+e.className);
 const sections=[...document.querySelectorAll('.hand-dock > .seat-flowers,.turn-message,.claim-choice,.meld-row,.hand-row,.action-row')];for(let i=0;i<sections.length;i++)for(const c of sections.slice(i+1))if(hit(sections[i],c))issues.push('hand sections overlap');
 if(document.documentElement.scrollWidth>innerWidth+1)issues.push('page overflow');
 if(innerWidth>900&&document.documentElement.scrollHeight>innerHeight+1)issues.push('desktop page scroll');
 const wrap=document.querySelector('.table-wrap');if(innerWidth>900&&wrap.scrollHeight>wrap.clientHeight+1)issues.push('desktop table scroll');
 const outer=[...document.querySelectorAll('.game-status,.mobile-balance,.table-wrap,.hand-dock')];for(let i=0;i<outer.length;i++)for(const c of outer.slice(i+1))if(hit(outer[i],c))issues.push('outer sections overlap');
 const hand=document.querySelector('.hand-row');if(hand.scrollWidth>hand.clientWidth+1)issues.push('hand overflow');
 for(const tile of hand.querySelectorAll('.tile')){const r=rect(tile);if(Math.abs(r.width/r.height-5/7)>.015)issues.push('hand tile lost portrait proportions');}
 const choice=document.querySelector('.claim-choice');if(choice){const cr=rect(choice);for(const button of choice.querySelectorAll('button')){const r=rect(button);if(r.top<cr.top||r.bottom>cr.bottom)issues.push('decision button clipped');}const pass=choice.querySelector('button:not(.claim-button)'),pr=rect(pass);if(pr.left<cr.left||pr.right>cr.right)issues.push('pass button not visible');if(getComputedStyle(pass).color!=='rgb(23, 50, 42)')issues.push('pass button contrast');}
 const action=rect(document.querySelector('.action-row')),dock=rect(document.querySelector('.hand-dock'));if(action.bottom>dock.bottom+1)issues.push('clipped action');
 return issues;});assert.deepEqual(issues,[],label);assert.deepEqual(errors,[],label);
 }
 let count=0;
 for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[667,375],[844,390],[768,1024],[900,700],[901,700],[1024,600],[1366,768],[1440,900],[1920,1080]]){
 await p.setViewportSize({width,height});console.log('Checking',width,height);
 for(const [state,s] of [['early',fixture(false)],['crowded',fixture(true)],['flowers',fixture(true,true)],['claim',fixture(false,false,true,true)],['decision',fixture(false,false,true)]]){
 await p.evaluate(s=>localStorage.setItem('hkmj.game.v1',JSON.stringify(s)),s);await p.reload();await p.locator('.mahjong-table').waitFor();
 if(state==='decision'||state==='claim')await p.locator('.claim-choice').waitFor();
 await check(`${width} ${state}`);count++;
 const anchor=await p.evaluate(()=>({height:document.querySelector('.mahjong-table').getBoundingClientRect().height,handTop:document.querySelector('.hand-dock').getBoundingClientRect().top}));
 assert(anchor.height>0,'visible board');
 await p.evaluate(()=>document.querySelectorAll('.wall').forEach(w=>w.append(document.createElement('i'))));
 const afterDraw=await p.evaluate(()=>({height:document.querySelector('.mahjong-table').getBoundingClientRect().height,handTop:document.querySelector('.hand-dock').getBoundingClientRect().top}));
 assert.deepEqual(afterDraw,anchor,`${width} ${state}: draws must not move the hand`);
 // Deterministic transient messages use the same DOM as live AI reactions.
 await p.evaluate(()=>document.querySelectorAll('.opponent').forEach(seat=>{const e=document.createElement('span');e.className='ai-bubble';e.textContent='諗清楚先，呢隻牌要小心！我等緊你出牌，唔使急。';seat.insertBefore(e,seat.querySelector('.seat-public'));}));
 await p.evaluate(()=>{if(document.querySelector('.last-play'))return;const e=document.createElement('div');e.className='last-play';e.innerHTML='<span>西環昌 出牌</span>';e.append(document.querySelector('.hand-row .tile').cloneNode(true));document.querySelector('.mahjong-table').append(e);});
 await check(`${width} ${state} chat/discard`);count++;
 const afterChat=await p.evaluate(()=>({height:document.querySelector('.mahjong-table').getBoundingClientRect().height,handTop:document.querySelector('.hand-dock').getBoundingClientRect().top}));
 assert.deepEqual(afterChat,anchor,`${width} ${state}: chat/discard must not move the hand`);
 if(state==='crowded'&&[390,844,1440].includes(width))await p.screenshot({path:`/private/tmp/hkmj-review-${width}.png`,fullPage:true});
 }
 }
 console.log('Checking interactions');
 await p.getByRole('button',{name:'牌友提示',exact:true}).click();await p.locator('.coach-content').waitFor();await p.keyboard.press('Escape');
 await p.locator('.river-grid').click();await p.locator('.river-detail').waitFor();await p.keyboard.press('Escape');
 await p.locator('.north .seat-flowers').click();await p.locator('.flower-detail').waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'過，繼續出牌'}).click();
 await p.locator('.hand-row .tile').last().click();assert(await p.locator('.selected-preview').isVisible());
 await p.getByRole('button',{name:'出牌',exact:true}).click();
 await p.waitForFunction(()=>document.querySelectorAll('.hand-row .tile').length===13);
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
 await p.setViewportSize({width,height});
 await p.evaluate(s=>localStorage.setItem('hkmj.game.v1',JSON.stringify(s)),fixture(false,false,true));await p.reload();
 await p.locator('.claim-choice').waitFor();
 await p.locator('.north .seat-details-toggle').click();await p.locator('.public-detail').waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'過，繼續出牌'}).click();
 await p.locator('.hand-row .tile').last().click();
 await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 const visible=await p.evaluate(()=>{const a=document.querySelector('.action-row').getBoundingClientRect(),h=document.querySelector('.hand-row').getBoundingClientRect(),n=document.querySelector('.main-nav').getBoundingClientRect();return h.top>=0&&a.bottom<=n.top+1});
 assert(visible,`${width}: hand and discard control can scroll clear of navigation`);
 if(width===390)await p.screenshot({path:'/private/tmp/hkmj-review-controls.png'});
 }
 console.log('Checking AI wins');
 await require('./check-ai-wins.cjs')(p,base);
 console.log(`PASS: ${count} viewport/state checks plus coach, river and flower dialogs, decision/pass, tile selection and discard.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
