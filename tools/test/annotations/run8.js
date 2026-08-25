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
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(250);};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const COORD=()=>{const m=document.querySelector('#annotations .ann-mark');
  if(!m)return null; const r=m.getBoundingClientRect(); return {x:Math.round((r.left+r.right)/2),y:Math.round((r.top+r.bottom)/2)};};
const VB=p=>p.evaluate(()=>document.getElementById('jmap').getAttribute('viewBox'));

/* A browser of its own per section, and it is closed with the page. Three
   sections through one browser timed out on `Runtime.callFunctionOn` at the
   third — the accumulation the README warns about, which closing the page
   does not undo. */
async function open(_ignored, touch){
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
  const p=await b.newPage();
  p.__b=b;
  await p.setViewport(touch?{width:900,height:1100,isMobile:true,hasTouch:true}:{width:1500,height:950});
  if(!touch) await p.evaluateOnNewDocument(SHIM);
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p, false);
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1400);
  return p;
}
// arm it *and* make it stick: a tool now steps back after one shape, and
// these cases place several in a row
const armTool=async(p,t)=>p.evaluate(t=>{const b=document.querySelector('.ann-tool[data-tool="'+t+'"]');
  if(!b.classList.contains('on')) b.click();
  if(!b.classList.contains('sticky')) b.click();},t);
const putAway=async p=>p.evaluate(()=>{const b=document.querySelector('.ann-tool[aria-pressed="true"]'); if(b) b.click();});

(async()=>{const b=null;

console.log('\n— right click —');
{ const p=await open(b,false);
  await armTool(p,'point'); await tap(p,700,450); await tap(p,780,500);
  await putAway(p); await sleep(300);
  check('two marks', await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===2);
  await p.mouse.click(780,500,{button:'right'}); await sleep(500);
  check('right click removes a mark',
    await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===1,
    await p.evaluate(()=>document.querySelector('#ann-msg').textContent));
  await p.evaluate(()=>document.querySelector('#ann-undo').click()); await sleep(500);
  check('and one Undo brings it back',
    await p.evaluate(()=>document.querySelectorAll('#ann-list li').length)===2);
  // a line, and one corner out of it
  await armTool(p,'line');
  await tap(p,400,600); await tap(p,500,660); await tap(p,600,620); await tap(p,700,680);
  await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
  await putAway(p); await sleep(400);
  const before=await p.evaluate(()=>document.querySelectorAll('#annotations .ann-vertex').length);
  await p.mouse.click(600,620,{button:'right'}); await sleep(500);
  const after=await p.evaluate(()=>document.querySelectorAll('#annotations .ann-vertex').length);
  check('right click on a corner takes only that corner', after===before-1, before+' → '+after);
  check('the shape is still there',
    await p.evaluate(()=>document.querySelectorAll('#annotations .ann-shape').length)>0);
  await p.evaluate(()=>document.querySelector('#ann-undo').click()); await sleep(500);
  check('one Undo puts the corner back',
    await p.evaluate(()=>document.querySelectorAll('#annotations .ann-vertex').length)===before);
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.__b.close(); }

console.log('\n— a mouse still drags at once —');
{ const p=await open(b,false);
  await armTool(p,'point'); await tap(p,700,450); await putAway(p); await sleep(300);
  const c0=await p.evaluate(COORD);
  await p.mouse.move(c0.x,c0.y); await p.mouse.down(); await sleep(70);
  await p.mouse.move(c0.x+110,c0.y+70,{steps:8}); await sleep(80); await p.mouse.up(); await sleep(500);
  const c1=await p.evaluate(COORD);
  check('the mark follows the mouse', Math.abs(c1.x-c0.x)>60, JSON.stringify([c0,c1]));
  await p.__b.close(); }

console.log('\n— a finger: hold to move, flick to pan —');
{ const p=await open(b,true);
  await armTool(p,'point');
  await tap(p,450,500); await putAway(p); await sleep(400);
  const c0=await p.evaluate(COORD);
  // a quick drag off the mark must still pan the map
  const vb0=await VB(p);
  await p.mouse.move(c0.x,c0.y); await p.mouse.down(); await sleep(60);
  await p.mouse.move(c0.x-120,c0.y+40,{steps:10}); await sleep(60); await p.mouse.up(); await sleep(600);
  const vb1=await VB(p);
  const cA=await p.evaluate(COORD);
  check('a quick drag off a mark still pans the map', vb1!==vb0, vb0+' → '+vb1);
  // now hold, then move
  const c1=await p.evaluate(COORD);
  await p.mouse.move(c1.x,c1.y); await p.mouse.down();
  await sleep(500);                                  // longer than the hold
  const held=await p.evaluate(()=>document.querySelector('#ann-msg').textContent);
  await p.mouse.move(c1.x+130,c1.y+60,{steps:10}); await sleep(100); await p.mouse.up(); await sleep(600);
  const c2=await p.evaluate(COORD);
  check('a hold arms the move', /Hold to move/.test(held), JSON.stringify(held));
  check('and the finger then moves the mark', Math.abs(c2.x-c1.x)>70, JSON.stringify([c1,c2]));
  check('the map did not pan while moving it',
    (await VB(p))===vb1, vb1+' → '+(await VB(p)));
  check('no page errors on touch', p.__errs.length===0, p.__errs[0]);
  await p.__b.close(); }

console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail);})();
