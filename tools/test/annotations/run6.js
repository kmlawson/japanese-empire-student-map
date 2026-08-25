const S=require('./suite.js');   // for shot(): pictures go to tools/test/shots
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('annotation tests: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})(); const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* Wait for the map rather than for a number. Measured: the atoms and the first
   labels are there 730 ms after the navigation resolves — these scripts were
   sleeping three and a half seconds for it. See `suite.js`. */
async function ready(pg, wantsAnn){
  try {
    await pg.waitForFunction(want=>{
      if(!document.querySelectorAll('#land .atom').length) return false;
      if(!document.querySelectorAll('#labels text').length) return false;
      if(want && !document.querySelectorAll('#annotations [data-ann]').length) return false;
      return true;
    },{timeout:25000,polling:'raf'},!!wantsAnn);
  } catch(e){ /* the script's own checks will say so */ }
  await sleep(250);
}
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(260);};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const WHERE=()=>JSON.parse(window.localStorage.getItem('jem-annotations-shared-v1')
  ||window.localStorage.getItem('jem-annotations-v1')||'{"f":[]}').f.map(f=>f.geometry.coordinates.join(','));
const AT=(title)=>{
  const set=JSON.parse(window.localStorage.getItem('jem-annotations-shared-v1')
    ||window.localStorage.getItem('jem-annotations-v1')).f;
  const i=set.findIndex(f=>f.properties.title===title);
  const g=[...document.querySelectorAll('#annotations .ann-mark')].find(e=>+e.getAttribute('data-ann')===i);
  if(!g) return null;
  const r=g.getBoundingClientRect();
  return {x:Math.round((r.left+r.right)/2),y:Math.round((r.top+r.bottom)/2),i:i};
};
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:150000});
let url;
{ const p=await b.newPage(); await p.setViewport({width:1500,height:950});
  await p.evaluateOnNewDocument(SHIM);
  await p.evaluateOnNewDocument(()=>{window.__clip=null;
    if(navigator.clipboard) navigator.clipboard.writeText=t=>{window.__clip=t;return Promise.resolve();};});
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p, false);
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1400);
  await p.evaluate(()=>{const b=document.querySelector('.ann-tool[data-tool="point"]'); if(b.getAttribute('aria-pressed')!=='true') b.click();});
  await sleep(250); await tap(p,700,450);
  await p.evaluate(()=>{const t=document.querySelector('#ann-title'); t.value='Theirs'; t.dispatchEvent(new Event('input',{bubbles:true}));});
  await sleep(900);
  await p.evaluate(()=>document.querySelector('#ann-link').click()); await sleep(1200);
  url=await p.evaluate(()=>window.__clip); await p.close(); }

const p=await b.newPage(); await p.setViewport({width:1500,height:950});
await p.evaluateOnNewDocument(SHIM);
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(url,{waitUntil:'networkidle0'}); await ready(p, true);
check('the marks are drawn', await p.evaluate(()=>document.querySelectorAll('#annotations .ann-mark').length)===1);
check('the panel is put away', await p.evaluate(()=>document.querySelector('#annotate').hidden));
check('a pencil is offered', await p.evaluate(()=>{const e=document.querySelector('#ann-edit'); return !!e && !e.hidden;}));
// reading works while locked
const at=await p.evaluate(AT,'Theirs');
await p.mouse.move(300,250); await sleep(150);
await p.mouse.move(at.x,at.y); await sleep(500);
check('hovering names it while locked',
  /Theirs/.test(await p.evaluate(()=>document.getElementById('tooltip').textContent)),
  await p.evaluate(()=>document.getElementById('tooltip').textContent));
// editing does not
const w0=await p.evaluate(WHERE);
await p.mouse.move(at.x,at.y); await p.mouse.down(); await sleep(80);
await p.mouse.move(at.x+120,at.y+60,{steps:8}); await sleep(80); await p.mouse.up(); await sleep(600);
check('a drag leaves it where it was', JSON.stringify(await p.evaluate(WHERE))===JSON.stringify(w0));
const at2=await p.evaluate(AT,'Theirs');
await p.mouse.click(at2.x,at2.y,{button:'right'}); await sleep(500);
check('right click does not delete it', await p.evaluate(()=>document.querySelectorAll('#annotations .ann-mark').length)===1);
// the pencil lets them in
await p.evaluate(()=>document.querySelector('#ann-edit').click()); await sleep(700);
check('the pencil opens the panel', await p.evaluate(()=>!document.querySelector('#annotate').hidden));
check('open, not folded', await p.evaluate(()=>!document.querySelector('#annotate').classList.contains('folded')));
check('and steps aside', await p.evaluate(()=>document.querySelector('#ann-edit').hidden));
const at3=await p.evaluate(AT,'Theirs');
await p.mouse.move(at3.x,at3.y); await p.mouse.down(); await sleep(80);
await p.mouse.move(at3.x+120,at3.y+60,{steps:8}); await sleep(80); await p.mouse.up(); await sleep(700);
check('and now it can be moved', JSON.stringify(await p.evaluate(WHERE))!==JSON.stringify(w0));
await p.evaluate(()=>document.querySelector('#ann-lock').click()); await sleep(600);
check('the padlock puts it away again', await p.evaluate(()=>document.querySelector('#annotate').hidden));
check('and the pencil returns', await p.evaluate(()=>!document.querySelector('#ann-edit').hidden));
check('no page errors', errs.length===0, errs[0]);
await p.screenshot({path:S.shot('locked.png')});
console.log('  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
