/* An edge line's clip window belongs to the projection it was worked out in.
 *
 *     node tools/test/projclip.js        # with a server on 8123
 *
 * `drawEdge` restricts some territories' edge lines to a lon/lat window — the
 * one that keeps British India's line off Burma. The rectangle is made by
 * projecting two corners, and it used to be made *once* and kept: switch to an
 * equal-area projection and a Mercator rectangle went on clipping in a space
 * where it meant something else, so the window landed over Rajputana and the
 * stroke it kept there read as a straight line across the princely states.
 *
 * It is the same family as the blur and the arrowhead: a quantity worked out
 * in one space and used in another. This is the guard.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('projclip test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };

const clips=p=>p.evaluate(()=>[...document.querySelectorAll('clipPath[id^="edge-clip"]')]
  .map(c=>{const r=c.querySelector('rect');
    return {id:c.id, x:Math.round(+r.getAttribute('x')), y:Math.round(+r.getAttribute('y')),
            w:Math.round(+r.getAttribute('width'))};}));
const used=p=>p.evaluate(()=>[...document.querySelectorAll('#sub-outlines .edge-line[clip-path]')]
  .map(e=>e.getAttribute('clip-path')));

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const p=await b.newPage(); await p.setViewport({width:1200,height:900});
await p.goto('http://localhost:8123/index.html?bbox=68,20,84,30',{waitUntil:'networkidle0'});
await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
await sleep(1400);

console.log('\n— the clip window follows the projection —');
const m=await clips(p);
check('Mercator has a window, and it is named for Mercator',
  m.length>0 && m.every(c=>/-mercator$/.test(c.id)), JSON.stringify(m));
const mUsed=await used(p);
check('and the edge line is using it', mUsed.some(u=>/mercator/.test(u)), JSON.stringify(mUsed));

for (const proj of ['albers','laea']) {
  await p.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(400);
  await p.evaluate(v=>{const r=document.querySelector('#proj-'+v);
    r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));},proj);
  await sleep(3200);
  await p.evaluate(()=>{const d=document.querySelector('#dlg-options'); if(d&&d.open) d.close();});
  await sleep(500);
  const c=await clips(p);
  const mine=c.filter(x=>x.id.indexOf('-'+proj)>0);
  check(proj+': a window of its own is built', mine.length>0, JSON.stringify(c.map(x=>x.id)));
  const u=await used(p);
  check(proj+': and the edge line uses that one, not the Mercator one',
    u.length>0 && u.every(x=>x.indexOf(proj)>0), JSON.stringify(u));
  /* The point of the whole thing: the rectangle is not where the Mercator one
     was. If it were, it would be clipping in the wrong place. */
  const mer = c.filter(x=>/-mercator$/.test(x.id))[0];
  const now = mine[0];
  check(proj+': and it is not the Mercator rectangle in a new coat',
    !mer || Math.abs(now.x - mer.x) > 2 || Math.abs(now.y - mer.y) > 2 || Math.abs(now.w - mer.w) > 2,
    JSON.stringify({mercator:mer, [proj]:now}));
}
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
