/* Names on the map: where they are put, and what is cleaned up after them.
 *
 *     node tools/test/labels.js          # with a server on 8123
 *
 * Three faults an outside review found in `placeLabels` and its neighbours,
 * each of which had been in the file long enough to be invisible:
 *
 *   1. A name that collides is moved through ten offsets until one is free —
 *      and then was drawn in the collision anyway. The offset went into local
 *      variables and into the *reservation*, never onto the label. So the map
 *      wrote one name over another and also blocked a third from the empty
 *      space it had just claimed. Nepal, Sikkim and Bhutan — the case the
 *      comment in `map.js` is written about — had never worked.
 *
 *   2. Leaving a window of fine coastline took out its islands and left their
 *      names: the entries stayed in `labels`, the `<text>` stayed in the
 *      document, and coming back built a second complete set. 909 labels grew
 *      to 4,305 over four trips between the Ryukyus and the Solomons.
 *
 *   3. A pan and a zoom that land in the same animation frame lost the zoom's
 *      `rescale`, because the flag lived in the closure of whichever call
 *      booked the frame. Markers stayed at the old screen size and no amount
 *      of panning put them right.
 *
 * The first and the third are measured here. The second is guarded rather
 * than reproduced — see the note above that section.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('labels test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };

/* Every name that is actually drawn, and every pair of them that overlap.
   The placer's whole job is that this list is empty. */
const OVERLAPS=()=>{
  const els=[...document.querySelectorAll('text')]
    .filter(e=>e.textContent.trim() && e.style.display!=='none');
  const bs=els.map(e=>{const r=e.getBoundingClientRect();
    return {t:e.textContent,l:r.left,r:r.right,tp:r.top,bt:r.bottom,w:r.width};})
    .filter(x=>x.w>0);
  const hits=[];
  for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
    const a=bs[i],c=bs[j];
    if(a.l<c.r&&a.r>c.l&&a.tp<c.bt&&a.bt>c.tp) hits.push(a.t+' / '+c.t);
  }
  return {n:bs.length,hits};
};

/* What `rescale` is putting on the scalables against what the view asks for.
   `k` is map units per screen pixel; a marker whose `scale()` disagrees with
   it is drawn at the wrong size and the reader sees it. */
const SCALE=()=>{
  const svg=document.querySelector('#jmap svg')||document.querySelector('svg');
  const vb=svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const cw=svg.getBoundingClientRect().width;
  const g=[...document.querySelectorAll('[transform*="scale("]')][0];
  const m=g&&/scale\(([-\d.eE]+)\)/.exec(g.getAttribute('transform'));
  return {want:+(vb[2]/cw).toFixed(4), got:m?+(+m[1]).toFixed(4):null};
};

const COUNT=()=>({
  labels: document.querySelectorAll('#labels text').length,
  live:   document.querySelectorAll('#land .fine').length,
});

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:240000});
const p=await b.newPage(); await p.setViewport({width:1400,height:900});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));

/* ---------------------------------------------- 1. the nudge is applied -- */
// names on, level 3, administrative on: as many names in play as the map has
await p.goto('http://localhost:8123/index.html?layers='+((16|8|512).toString(36)),
  {waitUntil:'networkidle0'});
await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
await sleep(2500);

console.log('\n— a name that is moved to clear another is drawn where it was moved to —');
{
  const o=await p.evaluate(OVERLAPS);
  check('names are on and there are plenty of them', o.n>20, 'only '+o.n);
  check('and no two of them overlap at the opening view', o.hits.length===0,
    o.hits.slice(0,4).join(' | '));
}
// the three the comment names. All three were never placeable together.
{
  const got=await p.evaluate(()=>['Nepal','Sikkim','Bhutan'].filter(n=>
    [...document.querySelectorAll('text')].some(e=>
      e.textContent.trim()===n && e.style.display!=='none' &&
      e.getBoundingClientRect().width>0)));
  check('Nepal, Sikkim and Bhutan are all three written', got.length===3, 'got '+got.join(','));
}
// and it holds as the zoom changes, which is where the nudges actually fire
for (const step of [1,2,3,4,5,6]) {
  await p.mouse.move(700,480);
  await p.mouse.wheel({deltaY:-260});
  await sleep(430);
  const o=await p.evaluate(OVERLAPS);
  check('no overlapping names '+step+' wheel steps in', o.hits.length===0,
    o.hits.slice(0,3).join(' | '));
}

/* ------------------------------------ 2. a window's names go with it -- */
/* What this can and cannot show. A window is only dropped when the view
   reaches a *different* window, and nothing outside the page can move the view
   except `bbox`, which means a reload — and a reload cannot show an
   accumulation. So the growth itself was measured with an instrumented build
   (909 labels to 4,305 over four trips; the numbers are in
   reports/2026.08.25-mapjs-review.md) and what is guarded here is the pair of
   things that would break if `dropLabelsFor` took too much: that the count for
   a given view is the same every time it is opened, and that the islands still
   have their names when you come back to them. */
console.log('\n— leaving a fine-coastline window takes its names with it —');
await p.goto('http://localhost:8123/index.html?layers='+((16|8|512).toString(36)),
  {waitUntil:'networkidle0'});
await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
await sleep(2500);
// `bbox` is the only way in from outside; a reload per hop is the price
const RYU='126.5,25.5,128.5,27.0', SOL='156.0,-9.5,158.5,-7.0';
const hop=async where=>{
  await p.goto('http://localhost:8123/index.html?layers='+((16|8|512).toString(36))+'&bbox='+where,
    {waitUntil:'networkidle0'});
  await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
  await sleep(2500);
};
await hop(RYU);
const first=await p.evaluate(COUNT);
check('the Ryukyus bring in fine coastline', first.live>50, JSON.stringify(first));
check('and names for it', first.labels>900, JSON.stringify(first));
const counts=[first];
for (let i=0;i<2;i++){
  await hop(SOL); counts.push(await p.evaluate(COUNT));
  await hop(RYU); counts.push(await p.evaluate(COUNT));
}
check('a second visit to the Ryukyus carries the same number of names as the first',
  counts[2].labels===counts[0].labels && counts[4].labels===counts[0].labels,
  counts.map(c=>c.labels).join(' → '));
check('and so does a second visit to the Solomons',
  counts[3].labels===counts[1].labels,
  counts.map(c=>c.labels).join(' → '));
check('the islands are still named when you come back',
  (await p.evaluate(()=>[...document.querySelectorAll('#labels text.sublabel')]
    .filter(e=>e.style.display!=='none'&&e.textContent.trim()).length))>5);

/* -------------------------- 3. a zoom in a pan's frame is not lost -- */
console.log('\n— a pan and a zoom in one frame keep the screen scale —');
await p.goto('http://localhost:8123/index.html?layers=2',{waitUntil:'networkidle0'});
await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
await sleep(2500);
{
  const base=await p.evaluate(SCALE);
  check('at rest, the markers are at the scale the view asks for',
    base.got!==null && Math.abs(base.want-base.got)<0.002, JSON.stringify(base));
  // one frame, two calls: a drag books it, a wheel arrives before it runs
  await p.evaluate(async()=>{
    const svg=document.querySelector('#jmap svg')||document.querySelector('svg');
    const host=svg.parentNode;
    const o={bubbles:true,cancelable:true,pointerId:1,pointerType:'mouse',isPrimary:true,
             buttons:1,clientX:700,clientY:450};
    host.dispatchEvent(new PointerEvent('pointerdown',o));
    host.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientX:760,clientY:470})));
    host.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-300,clientX:760,clientY:470}));
    host.dispatchEvent(new PointerEvent('pointerup',Object.assign({},o,{buttons:0,clientX:760,clientY:470})));
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  });
  await sleep(700);
  const after=await p.evaluate(SCALE);
  check('the zoom really happened', Math.abs(after.want-base.want)>0.05,
    JSON.stringify(base)+' → '+JSON.stringify(after));
  check('and the markers went with it', Math.abs(after.want-after.got)<0.002,
    JSON.stringify(after));
  // and a plain pan afterwards must not be the thing that repairs it
  await p.evaluate(async()=>{
    const svg=document.querySelector('#jmap svg')||document.querySelector('svg');
    const host=svg.parentNode;
    const o={bubbles:true,cancelable:true,pointerId:2,pointerType:'mouse',isPrimary:true,
             buttons:1,clientX:600,clientY:400};
    host.dispatchEvent(new PointerEvent('pointerdown',o));
    for(let i=1;i<=4;i++){
      host.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientX:600+i*10})));
      await new Promise(r=>requestAnimationFrame(r));
    }
    host.dispatchEvent(new PointerEvent('pointerup',Object.assign({},o,{buttons:0,clientX:640,clientY:400})));
  });
  await sleep(600);
  const panned=await p.evaluate(SCALE);
  check('and are still right after a further pan', Math.abs(panned.want-panned.got)<0.002,
    JSON.stringify(panned));
}

/* A name too long for the shape it belongs to, broken across lines.
 *
 * The 蕃地 is the case: "Taiwan Government-General's demarcated "Aborigine
 * Territory"" ran 388 screen pixels on one line across a 253-pixel island and
 * out over the sea at both ends. Two things are checked, and the second is
 * the one that would break quietly — `getComputedTextLength` on a <text> adds
 * every line together, so a three-line name measures three times its width
 * and the placer reserves a box that wide. */
console.log('\n— a long name is broken across lines —');
{
  await p.goto('http://localhost:8123/index.html?bbox=119.5,21.5,122.6,25.6',
               {waitUntil:'networkidle0'});
  await sleep(2600);
  await p.evaluate(()=>{document.querySelector('header button[data-cat="territory"]').click();});
  await sleep(1400);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('header button')]
    .find(x=>/Other/.test(x.textContent)); if(b) b.click();});
  await sleep(1600);
  const seen=await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('text').forEach(t=>{
      if(t.style.display==='none'||!t.textContent.trim()) return;
      const sp=[...t.querySelectorAll('tspan')];
      // a wrapped label's textContent runs the lines together with no space
      // between them, so read the tspans and join them back up
      out.push({txt: sp.length ? sp.map(x=>x.textContent).join(' ') : t.textContent,
                lines:sp.length||1,
                w:Math.round(t.getBoundingClientRect().width)});
    });
    return out;
  });
  const banchi=seen.find(x=>/Aborigine/.test(x.txt));
  check('the 蕃地 name is drawn', !!banchi,
    JSON.stringify(seen.map(s=>s.txt.slice(0,24))));
  if (banchi) {
    check('and is broken onto more than one line', banchi.lines>1, String(banchi.lines));
    check('the lines read as written: '+banchi.txt.slice(0,60),
      /^Taiwan Government-General's demarcated "Aborigine Territory"$/.test(banchi.txt),
      banchi.txt);
    check('so it fits inside the island: '+banchi.w+'px against 253',
      banchi.w<253, String(banchi.w));
  }
  const wide=seen.filter(x=>x.w>175);
  check('and no name on screen is wider than the budget',
    wide.length===0, JSON.stringify(wide));
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
