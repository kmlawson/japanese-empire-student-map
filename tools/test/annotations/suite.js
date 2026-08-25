/* The annotation test suite. One page per case, so nothing leaks between. */
/* Puppeteer is not a dependency of this repository — it is 300 MB and nothing
   the map ships needs it — so it is looked for rather than required outright.
   `npm install puppeteer` here, or set PUPPETEER_PATH. */
const puppeteer = (function () {
  const tries = [];
  if (process.env.PUPPETEER_PATH) tries.push(process.env.PUPPETEER_PATH);
  tries.push('puppeteer');
  for (const t of tries) { try { return require(t); } catch (e) { /* keep looking */ } }
  console.error('annotation tests: puppeteer not found.\n\n'
    + '  npm install puppeteer            # in the repository root, or\n'
    + '  PUPPETEER_PATH=/path/to/puppeteer node tools/test/annotations/run.js\n');
  process.exit(1);
})(); const path=require('path'); const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const FIX=path.join(__dirname,'fixtures');
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const CATCH=()=>{window.__saved=null;window.__clip=null;
  const r=URL.createObjectURL; URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return r.call(URL,b);};
  if(navigator.clipboard) navigator.clipboard.writeText=t=>{window.__clip=t;return Promise.resolve();};};
let pass=0, fail=0; const failures=[];
function check(name, cond, detail){ if(cond){pass++; console.log('  ok   '+name);} else {fail++; failures.push(name+(detail?' — '+detail:'')); console.log('  FAIL '+name+(detail?' — '+detail:''));} }

async function page(b, opts={}) {
  const p=await b.newPage();
  await p.setViewport(opts.touch?{width:900,height:1000,isMobile:true,hasTouch:true}
                                :{width:1500,height:950});
  if(!opts.touch) await p.evaluateOnNewDocument(SHIM);
  await p.evaluateOnNewDocument(CATCH);
  p.on('dialog', async d=>{ await (opts.accept? d.accept(): d.dismiss()); });
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error')p.__errs.push('console: '+m.text());});
  await p.goto('http://localhost:8123/index.html'+(opts.query||''),{waitUntil:'networkidle0'});
  await ready(p, opts);
  return p;
}

/* Wait for the map to be up rather than for a number of milliseconds.

   Every script slept 3,200 ms after loading, and 4,200 when a link had to be
   unpacked. Measured, the map has its atoms and its labels **730 ms** after
   the navigation resolves, and the annotation panel is open and wired at
   1,014. Nearly three and a half seconds per page were being spent waiting for
   something that had already happened, thirty-odd times across the suite.

   The wait is on what the next line is about to look at: the atoms exist, some
   labels have been placed, and — when a link carried annotations — the marks
   have been drawn. Then a short settle, because the README's warning still
   stands: measure a count too early and it comes back zero. A quarter of a
   second is enough for that and is not three seconds. */
async function ready(p, opts={}) {
  try {
    await p.waitForFunction(() =>
      document.querySelectorAll('#land .atom').length > 0 &&
      document.querySelectorAll('#labels text').length > 0,
      { timeout: 25000, polling: 'raf' });
  } catch (err) {
    // a script that is *testing* an empty or broken load still has to proceed;
    // it will fail on its own assertion, which says more than a timeout here
  }
  /* A link's marks are waited for **separately and briefly**. Half the point of
     the link tests is that a damaged link draws nothing, and folding that into
     the wait above charged every one of those cases the full timeout: run2 grew
     a 26-second pause at exactly the check that says a damaged link says so. */
  if (opts.query && opts.query.includes('ann=')) {
    try {
      await p.waitForFunction(() =>
        document.querySelectorAll('#annotations [data-ann]').length > 0,
        { timeout: 3500, polling: 'raf' });
    } catch (err) { /* a link that draws nothing is a case, not a fault */ }
  }
  await sleep(250);
}
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(260);};
const openPanel=async p=>{
  await p.evaluate(()=>document.querySelector('#ann-create').click());
  // the panel is fetched on demand, so this is a real wait — but it is a wait
  // for the panel, not for a guess at how long the fetch takes
  try {
    await p.waitForFunction(()=>{const a=document.querySelector('#annotate');
      return a && !a.hidden && document.querySelectorAll('.ann-tool').length===4;},
      {timeout:20000, polling:'raf'});
  } catch (err) { /* the caller's own check will say so */ }
  await sleep(150);
};
const pickTool=async(p,t)=>{await p.evaluate(t=>document.querySelector('.ann-tool[data-tool="'+t+'"]').click(),t); await sleep(200);};
/* Arm a tool and tell it to stay out. A tool now steps back after one shape —
   one press draws one thing, a second press on the same button makes it stick —
   so a test that places several in a row has to say which it means. Most of
   them mean this one. */
const stickTool=async(p,t)=>{
  await p.evaluate(t=>{const b=document.querySelector('.ann-tool[data-tool="'+t+'"]');
    if(!b.classList.contains('on')) b.click();
    if(!b.classList.contains('sticky')) b.click();},t);
  await sleep(220);
};
const dropTool=async p=>{
  await p.evaluate(()=>{const b=document.querySelector('.ann-tool.on');
    if(b){ b.click(); if(document.querySelector('.ann-tool.on')) b.click(); }});
  await sleep(200);
};
// an interior point of an atom, clear of every panel
// an interior point of one of these atoms, clear of every panel. Self
// contained, because page.evaluate ships this function and nothing else.
function SPOT(ids){
  const list=[].concat(ids);
  const panels=[...document.querySelectorAll('#annotate:not([hidden]), #legend:not([hidden]), #zoom-controls, #bar, #hint:not([hidden]), #tooltip:not([hidden])')]
    .map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
  const svg=document.getElementById('jmap'), m=svg.getScreenCTM(), pt=svg.createSVGPoint();
  for (const pass of [0,1]) {
    for (const id of list) {
      let el=document.querySelector(id);
      if(el&&!el.isPointInFill) el=el.querySelector('path')||el;
      if(!el||!el.isPointInFill) continue;
      const bb=el.getBBox();
      for(let i=1;i<24;i++) for(let j=1;j<24;j++){
        pt.x=bb.x+bb.width*i/24; pt.y=bb.y+bb.height*j/24;
        if(!el.isPointInFill(pt)) continue;
        const c=pt.matrixTransform(m);
        if(c.x<50||c.y<70||c.x>innerWidth-50||c.y>innerHeight-50) continue;
        if(pass===0){
          if(panels.some(r=>c.x>r.left-8&&c.x<r.right+8&&c.y>r.top-8&&c.y<r.bottom+8)) continue;
        } else {
          const top=document.elementFromPoint(c.x,c.y);
          if(!top||!top.closest||!top.closest('#jmap')) continue;
        }
        return {x:c.x,y:c.y,from:id};
      }
    }
  }
  /* Last resort: sweep the screen itself. The named atoms are the ones a test
     would rather have, but a portrait stage opens cropped to the empire — by
     design, `computeDefaultView` says so — and then China's bounding box is
     mostly Sinkiang, off to the left of the frame, and India is not on screen
     at all. Every sampled point falls outside the view and the caller gets a
     null it reads as a bug in the map. Walk the free part of the screen for
     any land the map has on top, which is what the caller actually needs. */
  const step=56; let spare=null;
  for(let y=96;y<innerHeight-60;y+=step) for(let x=64;x<innerWidth-60;x+=step){
    if(panels.some(r=>x>r.left-8&&x<r.right+8&&y>r.top-8&&y<r.bottom+8)) continue;
    const top=document.elementFromPoint(x,y);
    if(!top||!top.closest||!top.closest('#jmap')) continue;
    if(top.closest('[id^="a-"]')) return {x:x,y:y,from:'sweep'};
    if(!spare) spare={x:x,y:y,from:'sweep-sea'};
  }
  return spare;
}
const BIG=path.join(__dirname,'..','..','cache','india-rivers.geojson');
module.exports={puppeteer,sleep,page,ready,tap,openPanel,pickTool,stickTool,dropTool,SPOT,FIX,BIG,check,SHIM,
  report:()=>{console.log('\n  '+pass+' passed, '+fail+' failed');
    if(fail) failures.forEach(f=>console.log('   × '+f));
    return fail;}};
