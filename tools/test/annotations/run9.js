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
const STORE=()=>JSON.parse(window.localStorage.getItem('jem-annotations-v1')||'{"f":[]}').f;
const arm=async(p,t)=>p.evaluate(t=>{const b=document.querySelector('.ann-tool[data-tool="'+t+'"]');
  if(b.getAttribute('aria-pressed')!=='true') b.click();},t);
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:150000});
const p=await b.newPage(); await p.setViewport({width:1500,height:950});
await p.evaluateOnNewDocument(SHIM);
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p, false);

console.log('\n— 8) the tools on offer —');
await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1500);
const tools=await p.evaluate(()=>[...document.querySelectorAll('.ann-tool')].map(b=>b.getAttribute('data-tool')));
// Event was dropped and Arrow took its place, so the tools are four
check('four tools — point, arrow, line, area — and no Event',
  tools.join(',')==='point,arrow,line,polygon', tools.join(','));

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
  fill:!document.querySelector('#ann-fill-row').hidden, dash:!document.querySelector('#ann-dash-row').hidden,
  edge:!document.querySelector('#ann-edge-row').hidden, dist:!document.querySelector('#ann-dist-row').hidden}));
const only=(...on)=>JSON.stringify(['shape','fill','dash','edge','dist']
  .reduce((o,k)=>{o[k]=on.indexOf(k)>=0; return o;},{}));
check('with Point out: Shape only', JSON.stringify(await vis())===only('shape'), JSON.stringify(await vis()));
await arm(p,'polygon'); await sleep(300);
check('with Area out: Fill and Edge', JSON.stringify(await vis())===only('fill','edge'), JSON.stringify(await vis()));
await arm(p,'line'); await sleep(300);
check('with Line out: Line style and Distances', JSON.stringify(await vis())===only('dash','dist'), JSON.stringify(await vis()));
await arm(p,'arrow'); await sleep(300);
check('with Arrow out: Line style, no Distances', JSON.stringify(await vis())===only('dash'), JSON.stringify(await vis()));
await arm(p,'line'); await sleep(300);

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

console.log('\n— an approximate area, and distances on a line —');
await arm(p,'polygon');
await tap(p,300,300); await tap(p,420,320); await tap(p,400,430);
await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
const sharp=await p.evaluate(()=>[...document.querySelectorAll('#annotations .ann-shape')].pop().getAttribute('filter'));
check('an area is sharp to begin with', !sharp, String(sharp));
await p.evaluate(()=>{const el=document.querySelector('#ann-edge'); el.value='blurred';
  el.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(400);
const soft=await p.evaluate(()=>[...document.querySelectorAll('#annotations .ann-shape')].pop().getAttribute('filter'));
check('blurred gives it a filter', /ann-blur/.test(String(soft)), String(soft));
check('and the filter is a real definition',
  await p.evaluate(()=>{const f=[...document.querySelectorAll('#annotations .ann-shape')].pop().getAttribute('filter');
    const id=f.replace(/^url\(#|\)$/g,''); const d=document.getElementById(id);
    return !!(d && d.querySelector('feGaussianBlur'));}));
check('and it is recorded',
  (await p.evaluate(STORE)).pop().properties['jem-edge']==='blurred');
await p.evaluate(()=>{const el=document.querySelector('#ann-edge'); el.value='';
  el.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(400);
check('sharp again takes it off',
  !(await p.evaluate(()=>[...document.querySelectorAll('#annotations .ann-shape')].pop().getAttribute('filter'))));

await arm(p,'line');
await tap(p,300,700); await tap(p,470,760); await tap(p,640,700);
await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
const nDist=()=>p.evaluate(()=>document.querySelectorAll('#ann-labels .ann-dist').length);
check('no distances to begin with', await nDist()===0);
await p.evaluate(()=>{const el=document.querySelector('#ann-dist'); el.value='segments';
  el.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(500);
check('each leg gets one — two legs, two labels', await nDist()===2, String(await nDist()));
await p.evaluate(()=>{const el=document.querySelector('#ann-dist'); el.value='total';
  el.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(500);
check('a total is one label', await nDist()===1, String(await nDist()));
check('and it reads in km',
  /km$/.test(await p.evaluate(()=>document.querySelector('#ann-labels .ann-dist').textContent)),
  await p.evaluate(()=>document.querySelector('#ann-labels .ann-dist').textContent));
/* The name hangs below the middle of the line and a total wants the same
   place, so they take opposite sides of it. Measured as a *move*: the two
   labels hang from different anchors — the name from the centroid, the total
   from the point halfway along — so comparing their positions to each other
   says nothing, and comparing the distance's own position before and after
   the name arrives says exactly the thing being claimed. */
const distTop=()=>p.evaluate(()=>Math.round(
  document.querySelector('#ann-labels .ann-dist').getBoundingClientRect().top));
const bare=await distTop();
await p.evaluate(()=>{const el=document.querySelector('#ann-title'); el.value='Advance';
  el.dispatchEvent(new Event('input',{bubbles:true}));}); await sleep(500);
const named=await distTop();
check('named, the distance moves to the other side of the line', named < bare - 10,
  bare + ' → ' + named);
check('and back again when the name goes', await (async()=>{
  await p.evaluate(()=>{const el=document.querySelector('#ann-title'); el.value='';
    el.dispatchEvent(new Event('input',{bubbles:true}));}); await sleep(500);
  return Math.abs((await distTop()) - bare) <= 2;})());

console.log('\n— a tool does one shape, unless it is told to stay —');
const toolNow=()=>p.evaluate(()=>{const t=document.querySelector('.ann-tool.on');
  return t?t.getAttribute('data-tool')+(t.classList.contains('sticky')?':sticky':''):'none';});
const press9=t=>p.evaluate(t=>document.querySelector('.ann-tool[data-tool="'+t+'"]').click(),t);
await press9('point'); await sleep(250);
check('one press arms it', await toolNow()==='point', await toolNow());
await tap(p,640,300); await sleep(400);
check('and it steps back once a shape is made', await toolNow()==='none', await toolNow());
await press9('point'); await sleep(200); await press9('point'); await sleep(250);
check('a second press makes it stay', await toolNow()==='point:sticky', await toolNow());
await tap(p,690,330); await sleep(400);
check('and then it stays', await toolNow()==='point:sticky', await toolNow());
await press9('point'); await sleep(250);
check('a third press puts it away', await toolNow()==='none', await toolNow());

console.log('\n— a copy of the selected mark —');
const count9=()=>p.evaluate(STORE).then(f=>f.length);
const was=await count9();
await p.evaluate(()=>document.querySelector('#ann-copy').click()); await sleep(600);
check('Duplicate adds one', await count9()===was+1, was+' → '+(await count9()));
check('and it is the copy that is selected',
  await p.evaluate(()=>{const li=[...document.querySelectorAll('#ann-list li')];
    return li.length && li[li.length-1].classList.contains('sel');}));
check('the copy is not on top of the original', await (async()=>{
  const f=await p.evaluate(STORE);
  return JSON.stringify(f[f.length-1].geometry.coordinates)
      !== JSON.stringify(f[f.length-2].geometry.coordinates);})());

console.log('\n— a handle is bigger than it looks —');
/* Vertices are drawn for the selected feature only, and only for a shape that
   has corners — a point has none. So an area is what gets selected here. */
await p.evaluate(()=>{
  const f=JSON.parse(localStorage.getItem('jem-annotations-v1')).f;
  let at=-1; f.forEach((x,i)=>{ if(/Polygon|LineString/.test(x.geometry.type)) at=i; });
  const li=[...document.querySelectorAll('#ann-list .ann-pick')];
  if(at>=0 && li[at]) li[at].click();}); await sleep(500);
const grab=await p.evaluate(()=>{const v=[...document.querySelectorAll('#annotations .ann-vertex')];
  return {n:v.length, withDisc:v.filter(g=>g.querySelector('.ann-grab')).length,
          r:v.length?(v[0].querySelector('.ann-grab')||{}).getAttribute
            ? v[0].querySelector('.ann-grab').getAttribute('r') : null : null};});
check('every vertex carries a grab disc, and it is bigger than the dot',
  grab.n>0 && grab.withDisc===grab.n && +grab.r >= 8, JSON.stringify(grab));

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
