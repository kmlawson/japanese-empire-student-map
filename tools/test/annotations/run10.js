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
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(280);};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const STORE=()=>JSON.parse(window.localStorage.getItem('jem-annotations-v1')||'{"f":[]}').f;
const arm=async(p,t)=>p.evaluate(t=>{const b=document.querySelector('.ann-tool[data-tool="'+t+'"]');
  if(b.getAttribute('aria-pressed')!=='true') b.click();},t);
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:150000});
const p=await b.newPage(); await p.setViewport({width:1500,height:950});
await p.evaluateOnNewDocument(SHIM);
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p, false);
await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1500);

const tools=await p.evaluate(()=>[...document.querySelectorAll('.ann-tool')].map(b=>b.textContent));
check('an Arrow tool where Event was, and Text after Area', tools.join(',')==='Point,Arrow,Line,Area,Text', tools.join(','));

await arm(p,'arrow'); await sleep(300);
const vis=await p.evaluate(()=>({head:!document.querySelector('#ann-head-row').hidden,
  curve:!document.querySelector('#ann-curve-row').hidden,
  shape:!document.querySelector('#ann-shape-row').hidden,
  fill:!document.querySelector('#ann-fill-row').hidden}));
check('its own controls show, and only those',
  vis.head&&vis.curve&&!vis.shape&&!vis.fill, JSON.stringify(vis));

await tap(p,600,400); await tap(p,850,520);
const f=await p.evaluate(STORE);
check('two presses make an arrow and finish it', f.length===1, JSON.stringify(f.length));
check('it is a two-point LineString',
  f[0].geometry.type==='LineString' && f[0].geometry.coordinates.length===2,
  JSON.stringify(f[0].geometry));
check('marked as an arrow in its properties', f[0].properties['jem-kind']==='arrow');
check('drawn as a curve command', await p.evaluate(()=>/Q/.test(document.querySelector('#annotations .ann-arrow').getAttribute('d'))));
check('with a head', await p.evaluate(()=>document.querySelectorAll('#annotations .ann-head').length)===1);

console.log('  heads:');
for (const h of ['triangle','barbed','line','dot','none']) {
  await p.evaluate(v=>{const el=document.querySelector('#ann-head'); el.value=v;
    el.dispatchEvent(new Event('change',{bubbles:true}));},h);
  /* Wait for the stored value, do not sleep at it. This read is of the
     *automatic copy*, and `styleChanged` debounces that by a quarter-second —
     so a flat `sleep(250)` raced the debounce exactly, and read the previous
     head about one run in three once four browsers shared the machine. It
     passed alone every time, which is what a race looks like. */
  try {
    await p.waitForFunction(want => {
      const raw = window.localStorage.getItem('jem-annotations-v1');
      if (!raw) return false;
      return JSON.parse(raw).f[0].properties['jem-arrow-head'] === want;
    }, {timeout:4000, polling:'raf'}, h);
  } catch (e) { /* the check below reports what it actually found */ }
  const st=await p.evaluate(()=>({stored:JSON.parse(window.localStorage.getItem('jem-annotations-v1')).f[0].properties['jem-arrow-head'],
    heads:document.querySelectorAll('#annotations .ann-head').length}));
  console.log('    '+h.padEnd(9)+' stored '+String(st.stored).padEnd(9)+' drawn '+st.heads);
  check('  head '+h, st.stored===h && st.heads===(h==='none'?0:1), JSON.stringify(st));
}

// straight by default, and the slider bends it
await p.evaluate(()=>{const el=document.querySelector('#ann-head'); el.value='triangle';
  el.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(250);
const straight=await p.evaluate(()=>document.querySelector('#annotations .ann-arrow').getAttribute('d'));
await p.evaluate(()=>{const el=document.querySelector('#ann-curve'); el.value='45';
  el.dispatchEvent(new Event('input',{bubbles:true}));}); await sleep(350);
const bent=await p.evaluate(()=>document.querySelector('#annotations .ann-arrow').getAttribute('d'));
check('the bend slider changes the curve', straight!==bent, straight+' vs '+bent);
// again the debounced copy: wait for the value rather than for a duration
try {
  await p.waitForFunction(() => {
    const raw = window.localStorage.getItem('jem-annotations-v1');
    return raw && JSON.parse(raw).f[0].properties['jem-curve'] === 0.45;
  }, {timeout:4000, polling:'raf'});
} catch (e) { /* the check reports what was found */ }
check('and it is recorded', (await p.evaluate(STORE))[0].properties['jem-curve']===0.45,
  String((await p.evaluate(STORE))[0].properties['jem-curve']));

// the bend handle on the map
await arm(p,'arrow');   // put the tool away so the handles are reachable
await p.evaluate(()=>{const b=document.querySelector('.ann-tool[aria-pressed="true"]'); if(b) b.click();});
await sleep(400);
const handle=await p.evaluate(()=>{const h=document.querySelector('#annotations .ann-bend');
  if(!h) return null; const r=h.getBoundingClientRect();
  return {x:Math.round((r.left+r.right)/2),y:Math.round((r.top+r.bottom)/2)};});
check('a bend handle is drawn on the selected arrow', !!handle, JSON.stringify(handle));
if (handle) {
  const before=(await p.evaluate(STORE))[0].properties['jem-curve'];
  await p.mouse.move(handle.x,handle.y); await p.mouse.down(); await sleep(80);
  await p.mouse.move(handle.x-70,handle.y-70,{steps:8}); await sleep(80); await p.mouse.up(); await sleep(600);
  const after=(await p.evaluate(STORE))[0].properties['jem-curve'];
  check('dragging it bends the arrow', after!==before, before+' → '+after);
  check('and the ends did not move',
    JSON.stringify((await p.evaluate(STORE))[0].geometry.coordinates)===JSON.stringify(f[0].geometry.coordinates));
}
check('it measures in km', /km$/.test(await p.evaluate(()=>document.querySelector('#ann-list .ann-meas').textContent)),
  await p.evaluate(()=>document.querySelector('#ann-list .ann-meas').textContent));

/* A sharp tip at any weight. The shaft is drawn with a round cap, so at a
   heavy weight half its width used to dome out over the apex sitting at the
   same point — a blunt nose exactly where the point should be. The apex now
   reaches past the placed point and the shaft stops short of the head. */
console.log('\n— a sharp tip at every weight —');
{ const b2=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
  const p2=await b2.newPage(); await p2.setViewport({width:1400,height:900});
  await p2.evaluateOnNewDocument(SHIM);
  const e2=[]; p2.on('pageerror',x=>e2.push(String(x)));
  await p2.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p2, false);
  await p2.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1500);
  // The slider carries a step now, 1 to 15, and the table behind it ends at a
  // stroke width of 16 — so the thing to check is that the heaviest step still
  // draws the heaviest line, not what the input's `max` attribute says.
  check('the weight slider has fifteen steps',
    await p2.evaluate(()=>document.querySelector('#ann-size').max)==='15',
    await p2.evaluate(()=>document.querySelector('#ann-size').max));
  await arm(p2,'arrow');
  await tap(p2,300,300); await tap(p2,700,300); await sleep(400);
  for (const w of [2,6,16]) {
    await p2.evaluate(v=>{const el=document.querySelector('#ann-size'); el.value=v;
      el.dispatchEvent(new Event('input',{bubbles:true}));},String(w)); await sleep(320);
    const m=await p2.evaluate(()=>{
      const sh=document.querySelector('#annotations .ann-arrow').getBoundingClientRect();
      const hd=document.querySelector('#annotations .ann-head');
      const hr=hd.getBoundingClientRect();
      const d=hd.querySelector('path').getAttribute('d');
      const xs=[...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);
      const apex=Math.max(...xs.map(v=>v[0])), back=Math.min(...xs.map(v=>v[0]));
      const half=Math.max(...xs.map(v=>Math.abs(v[1])));
      return {shaftRight:Math.round(sh.right), headRight:Math.round(hr.right),
              len:Math.round((apex-back)*10)/10, wide:Math.round(half*20)/10};});
    console.log('    weight '+String(w).padStart(2)+': head '+m.len+' long, '+m.wide+
                ' across; shaft ends '+(m.headRight-m.shaftRight)+'px inside the tip');
    check('  w'+w+': the point is the outermost thing', m.headRight>m.shaftRight,
      JSON.stringify(m));
    check('  w'+w+': the head is longer than it is wide', m.len>m.wide, JSON.stringify(m));
  }
  // and the shaft really is cut, not merely covered
  const cut=await p2.evaluate(()=>{
    const d=document.querySelector('#annotations .ann-arrow').getAttribute('d');
    const n=[...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);
    const end=n[n.length-1];
    const v=document.querySelector('#annotations .ann-head').getBoundingClientRect();
    return {endX:end[0], headMid:Math.round((v.left+v.right)/2)};});
  check('  at weight 16 the shaft is cut short of the end it was drawn to',
    cut.endX>0, JSON.stringify(cut));
  check('  no page errors', e2.length===0, e2[0]);
  await p2.screenshot({path:S.shot('arrow-tips.png')});
  await b2.close(); }   // its own browser: a second page in the first one times out

/* Anything the reader sees the size of has to stay that size as the map zooms.
   This is the project's most-repeated bug — see CLAUDE.md — and it never shows
   at the opening view, where a map unit is about a screen pixel and the two are
   interchangeable. So it is measured across four zooms, not one. */
console.log('\n— what the reader sees the size of stays that size —');
{ const b3=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
  const p3=await b3.newPage(); await p3.setViewport({width:1400,height:900});
  await p3.evaluateOnNewDocument(SHIM);
  const e3=[]; p3.on('pageerror',x=>e3.push(String(x)));
  await p3.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await ready(p3, false);
  await p3.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1500);
  const put3=async(id,v)=>p3.evaluate((i,val)=>{const el=document.querySelector(i);
    el.value=val; el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));},id,v);
  await arm(p3,'polygon');
  await tap(p3,300,300); await tap(p3,520,320); await tap(p3,500,470);
  await p3.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
  await put3('#ann-edge','blurred'); await sleep(400);
  await arm(p3,'arrow');
  await tap(p3,700,300); await tap(p3,950,430); await sleep(400);
  await put3('#ann-size','9'); await sleep(400);
  await p3.evaluate(()=>{const t=document.querySelector('.ann-tool[aria-pressed="true"]'); if(t) t.click();});
  const measure=()=>p3.evaluate(()=>{
    const svg=document.getElementById('jmap');
    const vb=svg.getAttribute('viewBox').split(' ').map(Number);
    const k=vb[2]/svg.getBoundingClientRect().width;   // user units per screen px
    const sh=document.querySelector('#annotations .ann-shape[filter]');
    const id=sh&&sh.getAttribute('filter').replace(/^url\(#|\)$/g,'');
    const d=id&&document.getElementById(id);
    const dev=d?parseFloat(d.querySelector('feGaussianBlur').getAttribute('stdDeviation')):null;
    const hd=document.querySelector('#annotations .ann-head');
    return {viewW:Math.round(vb[2]),
      blurPx: dev===null?null:Math.round(dev/k*10)/10,
      headPx: hd?Math.round(hd.getBoundingClientRect().width*10)/10:null};});
  const seen=[];
  for (const step of [0,1,2,3]) {
    if(step){ for(let i=0;i<3;i++){ await p3.mouse.move(560,380);
      await p3.mouse.wheel({deltaY:-260}); await sleep(150); } }
    await sleep(900);
    const m=await measure(); seen.push(m);
    console.log('    viewW '+String(m.viewW).padStart(6)+'   blur '+m.blurPx
      +' px   arrowhead '+m.headPx+' px');
  }
  const spread=a=>{const v=a.filter(x=>x!==null); return Math.max(...v)-Math.min(...v);};
  check('the blur is the same number of screen pixels at every zoom',
    spread(seen.map(x=>x.blurPx)) < 1, JSON.stringify(seen.map(x=>x.blurPx)));
  check('and so is the arrowhead',
    spread(seen.map(x=>x.headPx)) < 2, JSON.stringify(seen.map(x=>x.headPx)));
  check('no page errors', e3.length===0, e3[0]);
  await b3.close(); }
check('no page errors', errs.length===0, errs[0]);
await p.screenshot({path:S.shot('arrow.png')});
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
