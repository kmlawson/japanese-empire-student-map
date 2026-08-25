/* The dashed perimeter of December 1942 — that it is drawn on the 1942 map,
   that the checkbox is what turns it off, and that choosing the other reading
   of occupied China does not take it away.
   
       node tools/test/extent.js        # with python3 -m http.server 8123 up

   It used to. `applyState` tied the perimeter to `occSource === 'traced'`,
   which is sound for the arc across China — there the dashed line *is* the
   inland edge of the traced zone — and wrong for the other nine tenths of the
   ring, which runs past the Kuriles, round the Pacific and back through the
   Indies and says nothing about China at all. Switching source silently took
   the whole line, and `occSource` is saved, so it stayed gone across reloads
   with the checkbox still ticked. */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('extent test: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const state=p=>p.evaluate(()=>{const e=document.querySelector('#extent-1942');
  return {line:!!e&&getComputedStyle(e).display!=='none',
          legend:[...document.querySelectorAll('#legend .item')].some(i=>/Extent of Japanese control/.test(i.textContent)),
          ticked:document.querySelector('#opt-extent').checked};});
const epoch=async(p,y)=>{await p.evaluate(y=>{const b=[...document.querySelectorAll('#epoch-seg button')]
  .find(x=>x.textContent.indexOf(y)>=0); if(b) b.click();},y); await sleep(2000);};
const occ=async(p,which)=>{await p.evaluate(w=>{const r=document.querySelector('#occ-'+w);
  r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));},which); await sleep(2200);};

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const p=await b.newPage(); await p.setViewport({width:1500,height:950});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3500);

console.log('\n— where it belongs —');
check('1930 has no perimeter', !(await state(p)).line);
await epoch(p,'1942');
let s=await state(p);
check('1942 draws it', s.line, JSON.stringify(s));
check('and names it in the legend', s.legend);

console.log('\n— the other reading of occupied China —');
await occ(p,'nca');
s=await state(p);
check('the North China Area Army reading keeps the perimeter', s.line, JSON.stringify(s));
check('and keeps it in the legend', s.legend, JSON.stringify(s));
check('the checkbox is still ticked, as it always was', s.ticked);
await p.reload({waitUntil:'networkidle0'}); await sleep(3500);
s=await state(p);
check('and it is still there after a reload', s.line, JSON.stringify(s));
await occ(p,'traced');
check('back on the traced reading too', (await state(p)).line);

console.log('\n— the checkbox is what turns it off —');
await p.evaluate(()=>{const c=document.querySelector('#opt-extent');
  c.checked=false; c.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1200);
s=await state(p);
check('unticked, the perimeter goes', !s.line, JSON.stringify(s));
check('and so does its legend entry', !s.legend);
await p.evaluate(()=>{const c=document.querySelector('#opt-extent');
  c.checked=true; c.dispatchEvent(new Event('change',{bubbles:true}));}); await sleep(1200);
check('ticked again, it comes back', (await state(p)).line);

console.log('\n— and in every projection —');
for (const m of ['albers','laea','mercator']) {
  await p.evaluate(v=>{const r=document.querySelector('#proj-'+v);
    r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));},m); await sleep(2400);
  const box=await p.evaluate(()=>{const r=document.querySelector('#extent-1942').getBoundingClientRect();
    return [r.width,r.height].map(Math.round);});
  check(m+' draws it, and at a size', (await state(p)).line && box[0]>200 && box[1]>200, JSON.stringify(box));
}
check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
