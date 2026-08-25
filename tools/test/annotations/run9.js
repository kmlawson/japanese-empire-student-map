const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('annotation tests: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})(); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(260);};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const STORE=()=>JSON.parse(window.localStorage.getItem('jem-annotations-v1')||'{"f":[]}').f;
const arm=async(p,t)=>p.evaluate(t=>{const b=document.querySelector('.ann-tool[data-tool="'+t+'"]');
  if(b.getAttribute('aria-pressed')!=='true') b.click();},t);
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:150000});
const p=await b.newPage(); await p.setViewport({width:1500,height:950});
await p.evaluateOnNewDocument(SHIM);
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3400);

console.log('\n— 8) the Event tool —');
await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1500);
const tools=await p.evaluate(()=>[...document.querySelectorAll('.ann-tool')].map(b=>b.getAttribute('data-tool')));
check('three tools, no Event', tools.join(',')==='point,line,polygon', tools.join(','));

console.log('\n— 10) the legend —');
check('the legend folds when the pane opens',
  await p.evaluate(()=>document.querySelector('#legend').classList.contains('folded')));

console.log('\n— 1) every shape, twice round —');
await arm(p,'point'); await tap(p,700,450);
const syms=await p.evaluate(()=>[...document.querySelectorAll('#ann-symbol option')].map(o=>o.value));
let stuck=null;
for (let r=0;r<2 && !stuck;r++) for (const sy of syms) {
  await p.evaluate(v=>{const el=document.querySelector('#ann-symbol'); el.value=v;
    el.dispatchEvent(new Event('change',{bubbles:true}));}, sy);
  await sleep(180);
  const got=await p.evaluate(STORE);
  if(got[0].properties['marker-symbol']!==sy){ stuck=sy+' → '+got[0].properties['marker-symbol']; }
}
check('every shape applies, twice round, including diamond then star', !stuck, String(stuck));

console.log('\n— 7) only the controls that apply —');
const vis=async()=>p.evaluate(()=>({shape:!document.querySelector('#ann-shape-row').hidden,
  fill:!document.querySelector('#ann-fill-row').hidden, dash:!document.querySelector('#ann-dash-row').hidden}));
check('with Point out: Shape only', JSON.stringify(await vis())==='{"shape":true,"fill":false,"dash":false}', JSON.stringify(await vis()));
await arm(p,'polygon'); await sleep(300);
check('with Area out: Fill only', JSON.stringify(await vis())==='{"shape":false,"fill":true,"dash":false}', JSON.stringify(await vis()));
await arm(p,'line'); await sleep(300);
check('with Line out: Dashed only', JSON.stringify(await vis())==='{"shape":false,"fill":false,"dash":true}', JSON.stringify(await vis()));

console.log('\n— 9) undo takes back a point, not the shape —');
await tap(p,500,600); await tap(p,600,660); await tap(p,700,620); await tap(p,780,680);
let n=await p.evaluate(()=>document.querySelectorAll('#annotations .ann-vertex').length);
check('four corners down', n===4, String(n));
await p.evaluate(()=>document.querySelector('#ann-undo').click()); await sleep(400);
n=await p.evaluate(()=>document.querySelectorAll('#annotations .ann-vertex').length);
check('undo removes one corner', n===3, String(n));
check('and the shape is still being drawn',
  await p.evaluate(()=>!document.querySelector('#annotate .ann-drawing').hidden));
await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
check('it finishes with three', (await p.evaluate(STORE)).length===2);

console.log('\n— 3+4) a mark answers for itself with a tool armed —');
await arm(p,'point'); await sleep(300);
const before=(await p.evaluate(STORE)).length;
const at=await p.evaluate(()=>{const g=document.querySelector('#annotations .ann-mark');
  const r=g.getBoundingClientRect(); return {x:Math.round((r.left+r.right)/2),y:Math.round((r.top+r.bottom)/2)};});
await tap(p,at.x,at.y);
check('tapping a mark selects rather than stacking a new one',
  (await p.evaluate(STORE)).length===before, before+' → '+(await p.evaluate(STORE)).length);
check('and it is the selected one',
  await p.evaluate(()=>document.querySelector('#ann-list li.sel')!==null));
// drag it with the tool still armed
const w0=await p.evaluate(STORE);
await p.mouse.move(at.x,at.y); await p.mouse.down(); await sleep(80);
await p.mouse.move(at.x+110,at.y+60,{steps:8}); await sleep(80); await p.mouse.up(); await sleep(600);
check('and dragging it moves it, tool armed',
  JSON.stringify((await p.evaluate(STORE))[0].geometry.coordinates)!==JSON.stringify(w0[0].geometry.coordinates));
// right click with the tool still armed
const at2=await p.evaluate(()=>{const g=document.querySelector('#annotations .ann-mark');
  const r=g.getBoundingClientRect(); return {x:Math.round((r.left+r.right)/2),y:Math.round((r.top+r.bottom)/2)};});
const nBefore=(await p.evaluate(STORE)).length;
await p.mouse.click(at2.x,at2.y,{button:'right'}); await sleep(500);
check('and right click deletes it, tool armed', (await p.evaluate(STORE)).length===nBefore-1);

console.log('\n— 5) the selected one reads differently —');
check('the selected feature carries a class of its own',
  await p.evaluate(()=>document.querySelector('#annotations .sel')!==null));

console.log('\n— 2) nothing runs under the scrollbar —');
console.log('  ' + JSON.stringify(await p.evaluate(()=>{
  const a=document.querySelector('#annotate'), s=document.querySelector('#side');
  const t=document.querySelector('#ann-desc').getBoundingClientRect();
  return {annOver:a.scrollWidth-a.clientWidth, sideOver:s.scrollWidth-s.clientWidth,
    descRight:Math.round(t.right), sideInner:Math.round(s.getBoundingClientRect().right)-
      (s.offsetWidth-s.clientWidth)};})));
check('the panel does not overflow',
  await p.evaluate(()=>document.querySelector('#annotate').scrollWidth===document.querySelector('#annotate').clientWidth));
check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
