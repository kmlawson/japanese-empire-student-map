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
  await sleep(opts.query&&opts.query.includes('ann=')?4200:3200);
  return p;
}
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(260);};
const openPanel=async p=>{await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1200);};
const pickTool=async(p,t)=>{await p.evaluate(t=>document.querySelector('.ann-tool[data-tool="'+t+'"]').click(),t); await sleep(200);};
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
  return null;
}
const BIG=path.join(__dirname,'..','..','cache','india-rivers.geojson');
module.exports={puppeteer,sleep,page,tap,openPanel,pickTool,SPOT,FIX,BIG,check,
  report:()=>{console.log('\n  '+pass+' passed, '+fail+' failed');
    if(fail) failures.forEach(f=>console.log('   × '+f));
    return fail;}};
