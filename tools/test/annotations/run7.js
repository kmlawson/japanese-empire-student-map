const { sandboxDownloads } = require('../downloads.js');
const { puppeteer, sleep, check, report, SHIM } = require('./suite.js');

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
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(60);await p.mouse.up();await sleep(260);};
/* Does the page ask before it goes? Fire a real beforeunload and see whether
   anything cancels it — which is exactly what the browser tests. */
const ASKS=()=>{const e=new Event('beforeunload',{cancelable:true});
  window.dispatchEvent(e); return e.defaultPrevented || e.returnValue==='';};
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000}); await sandboxDownloads(b);
const p=await b.newPage(); await p.setViewport({width:1500,height:950});
await p.evaluateOnNewDocument(SHIM);
await p.evaluateOnNewDocument(()=>{window.__saved=null;const r=URL.createObjectURL;
  URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return r.call(URL,b);};});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
/* Clear asks "are you sure?", and a `confirm()` with nobody to answer it
   blocks the page until the protocol gives up — 150 seconds, swallowed by the
   `.catch()` below and charged to this script's running time. It was the whole
   reason the suite took three minutes: eight checks, six seconds of work, and
   two and a half minutes waiting for a dialog. */
p.on('dialog', async d => { try { await d.accept(); } catch (e) { /* gone already */ } });
await p.goto(require('./suite.js').BASE,{waitUntil:'networkidle0'}); await ready(p, false);
check('a reader who has drawn nothing is never stopped', (await p.evaluate(ASKS))===false);
await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1400);
check('nor one who has only opened the panel', (await p.evaluate(ASKS))===false);
check('and it opens unlocked', await p.evaluate(()=>!document.querySelector('#annotate').hidden));
check('with no pencil, there being nothing to edit',
  await p.evaluate(()=>{const e=document.querySelector('#ann-edit'); return !e||e.hidden;}));
await p.evaluate(()=>{const b=document.querySelector('.ann-tool[data-tool="point"]'); if(!b.classList.contains('on')) b.click(); if(!b.classList.contains('sticky')) b.click();});
await sleep(250); await tap(p,700,450);
check('but one with a mark of their own IS asked', (await p.evaluate(ASKS))===true);
await p.evaluate(()=>document.querySelector('#ann-save').click()); await sleep(900);
check('saving the file settles it', (await p.evaluate(ASKS))===false,
  await p.evaluate(()=>document.querySelector('#ann-msg').textContent));
await tap(p,780,510);
check('and drawing again arms it once more', (await p.evaluate(ASKS))===true);
await p.evaluate(()=>document.querySelector('#ann-clear').click()).catch(()=>{});
await sleep(200);
check('no page errors', errs.length===0, errs[0]);
await b.close(); process.exit(report());})();
