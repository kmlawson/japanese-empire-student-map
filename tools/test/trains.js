/* The train tools: the 1936 timetable running over the island it ran on.
 *
 *     node tools/test/trains.js          # with a server on 8123
 *
 * What this has to prove, in the order the reader meets it:
 *
 *   * nothing is fetched, built or shown until the reader asks AND is close
 *     enough for it to mean anything — the switch alone is not the trigger;
 *   * the track is drawn in the timetable's own line colours;
 *   * the clock moves, trains appear on it, and they are the same size on
 *     screen at two zooms apart — see the map units/screen pixels rule in
 *     CLAUDE.md, which this project has got wrong three times;
 *   * a station answers with the trains that called there, by mouse AND by
 *     finger, and links to the printed table for its line;
 *   * zooming out takes the whole thing away and stops the clock.
 *
 * The cautions from stations.js apply here too: shut the Layers dialog before
 * pointing at the map, shim matchMedia for the mouse, and use
 * `touchscreen.tap` — never `mouse.down` — for the finger.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('trains test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};

const BASE='http://localhost:8123/index.html';
const WHOLE=BASE+'?where=66,-12,180,55';
const TAIWAN=BASE+'?where=119.9,21.7,122.2,25.5';

/* The state of the interface, in one read. */
const look=p=>p.evaluate(()=>{
  const layer=document.querySelector('#train-layer');
  const bar=document.querySelector('#train-bar');
  const lines=document.querySelectorAll('#train-layer .train-line');
  const marks=[...document.querySelectorAll('#train-layer .train-mark')]
    .filter(m=>m.style.display!=='none');
  const cols={};
  lines.forEach(l=>{const c=l.getAttribute('stroke');cols[c]=(cols[c]||0)+1;});
  return {
    layer:!!layer, bar:!!bar, lines:lines.length, colours:Object.keys(cols).length,
    marks:marks.length,
    clock: bar?bar.querySelector('.train-clock').textContent:'',
    count: bar?bar.querySelector('.train-count').textContent:'',
    play: bar?bar.querySelector('.train-play').textContent:'',
    chips: bar?bar.querySelectorAll('.train-chip').length:0,
    module: !!window.JMAP_TRAINS,
    /* data.js declares `const JMAP`, which lives in the global lexical scope
       and is NOT `window.JMAP` — every data file writes to the bare name. A
       probe through `window` reads a different, empty object and reports the
       data missing when it is there. */
    data: typeof JMAP!=='undefined' && !!JMAP.TW_TRAINS,
    stations: document.querySelectorAll('#tw-stations .sta-mark').length,
    railBox: !!(document.querySelector('#opt-tw-rail')||{}).checked,
  };});

/* One train's radius as the reader sees it, in screen pixels. */
const trainPx=p=>p.evaluate(()=>{
  const m=[...document.querySelectorAll('#train-layer .train-mark')]
    .find(m=>m.style.display!=='none');
  if(!m) return 0;
  return m.getBoundingClientRect().width;});

const setSwitch=async(p,on)=>{
  await p.evaluate(v=>{
    const b=document.querySelector('#opt-train-tools');
    if(b.checked!==v){b.checked=v;b.dispatchEvent(new Event('change',{bubbles:true}));}
  },on);
  await sleep(120);
};

const shutDialogs=p=>p.evaluate(()=>{
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());});

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  try{
    /* ---- 1. nothing until it is asked for --------------------------- */
    const p=await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({width:1200,height:860});
    const fetched=[];
    p.on('request',r=>{const u=r.url(); if(/trains\.js|tw-trains\.js/.test(u))fetched.push(u.split('/').pop().split('?')[0]);});
    await p.goto(TAIWAN,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    let v=await look(p);
    check('off: no layer, no bar', !v.layer && !v.bar, JSON.stringify(v));
    check('off: neither file fetched', fetched.length===0, fetched.join());

    /* ---- 2. the switch alone is not enough -------------------------- */
    await p.goto(WHOLE,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await setSwitch(p,true);
    await sleep(400);
    v=await look(p);
    check('on but zoomed out: still nothing built', !v.layer && !v.bar, JSON.stringify(v));
    check('on but zoomed out: nothing fetched', fetched.length===0, fetched.join());

    /* ---- 3. zooming in builds it ------------------------------------ */
    /* Carrying the switch from the step before rather than setting it again:
       the same reader, having ticked the box over the empire, now goes and
       looks at the island. Everything from here to step 9 is one page, so the
       fetch counts mean what they say. */
    const on=await p.evaluate(()=>new URL(location.href).searchParams.get('layers')||'');
    await p.goto(TAIWAN+'&layers='+on,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await sleep(1400);
    v=await look(p);
    check('zoomed in: the layer is built', v.layer, JSON.stringify(v));
    check('zoomed in: the bar is up', v.bar, JSON.stringify(v));
    /* 179, measured, and pinned rather than bounded. The 346 trains run over
       204 pairs of consecutive stops; 23 of those cannot be drawn because one
       end is one of the 22 stations with no coordinate, and joining across
       them leaves 181 stretches of track — of which two are refused as
       fabrications, being straight guesses 123 km and 96 km long over ground
       the railway did not cross. 177 traced, 2 short straight joins, 179
       drawn. A change in any of those numbers is a change in the data or in
       how the gaps are closed, and either is worth being told about. */
    check('the track is drawn, all 179 stretches', v.lines===179, 'lines='+v.lines);
    check('in more than one colour', v.colours>=6, 'colours='+v.colours);
    check('a chip per line in the bar', v.chips===7, 'chips='+v.chips);
    check('both files fetched once',
      fetched.filter(f=>f==='trains.js').length===1
      && fetched.filter(f=>f==='tw-trains.js').length===1, fetched.join());

    /* ---- 4. the clock and the trains -------------------------------- */
    const t0=(await look(p)).clock;
    await p.click('#train-bar .train-play');
    await sleep(1500);
    let v2=await look(p);
    check('play moves the clock', v2.clock!==t0, t0+' -> '+v2.clock);
    check('trains are on the map', v2.marks>0, 'marks='+v2.marks);
    check('the bar says how many are running', /\d+ running/.test(v2.count), v2.count);
    await p.click('#train-bar .train-play');
    const paused=(await look(p)).clock;
    await sleep(900);
    check('pause stops the clock', (await look(p)).clock===paused, paused);

    /* ---- 5. a train is the same size at two zooms -------------------- */
    await p.evaluate(()=>{
      const s=document.querySelector('#train-time');
      s.value='540'; s.dispatchEvent(new Event('input',{bubbles:true}));});
    await sleep(200);
    const near=await trainPx(p);
    await p.evaluate(()=>{
      for(let i=0;i<4;i++) document.querySelector('#zoom-in').click();});
    await sleep(500);
    const closer=await trainPx(p);
    check('a train keeps its size on screen across a zoom',
      near>2 && closer>2 && Math.abs(near-closer)<1.2,
      near.toFixed(2)+' px vs '+closer.toFixed(2)+' px');

    /* ---- 6. a station answers with its trains ------------------------ */
    /* The squares are the railway layer's, not the train tools', and the tools
       borrow them: a reader who has asked for a timetable has to be able to
       point at a station without first finding two more switches. */
    v=await look(p);
    check('the station squares are borrowed', v.stations>150 && v.railBox,
      JSON.stringify({stations:v.stations,railBox:v.railBox}));
    const card=await p.evaluate(()=>{
      // Taihoku, by its id in tw-stations.js, through the map's own selection
      const el=document.querySelector('[data-id="tws029"]');
      if(!el) return {no:'no mark'};
      const r=el.getBoundingClientRect();
      const ev=n=>el.dispatchEvent(new PointerEvent(n,{bubbles:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'mouse'}));
      ev('pointerover'); ev('pointerdown'); ev('pointerup'); ev('click');
      const host=document.querySelector('#info-trains');
      const link=host.querySelector('a');
      return {hidden:host.hidden, rows:host.querySelectorAll('.trains-table tr').length,
              head:(host.querySelector('.trains-head')||{}).textContent||'',
              href:link?link.getAttribute('href'):'',
              swatches:host.querySelectorAll('.trains-table .sw').length};
    });
    check('the card shows the trains that called', !card.hidden && card.rows>50, JSON.stringify(card));
    check('it says how many and when', /trains called here .* 1936/.test(card.head), card.head);
    check('every row carries its line colour', card.swatches>=card.rows-1,
      card.swatches+' swatches for '+card.rows+' rows');
    check('and links to the printed table for that line',
      /timetable\/taiwan-1936\.html/.test(card.href)&&/#line-1-1$/.test(card.href), card.href);

    /* ---- 7. zooming out takes it away ------------------------------- */
    await p.evaluate(()=>{
      for(let i=0;i<9;i++) document.querySelector('#zoom-out').click();});
    await sleep(700);
    v=await look(p);
    check('zoomed out: the layer is gone', !v.layer, JSON.stringify(v));
    check('zoomed out: the bar is gone', !v.bar, JSON.stringify(v));
    check('the card is emptied with it',
      await p.evaluate(()=>document.querySelector('#info-trains').hidden), '');
    check('but the data stays in memory', v.data && v.module, JSON.stringify(v));
    // and back in again, without a second fetch
    await p.evaluate(()=>{
      for(let i=0;i<9;i++) document.querySelector('#zoom-in').click();});
    await sleep(900);
    v=await look(p);
    check('and comes back on the way in', v.layer && v.bar, JSON.stringify(v));
    check('with no second fetch of either file',
      fetched.filter(f=>f==='trains.js').length===1, fetched.join());

    /* ---- 7b. and it survives a change of projection ----------------- */
    /* The track is reprojected by the map, along with every other path in the
       document. The trains are not: their positions are worked out from points
       this module has already projected, and a change of projection makes
       those answers to a question about a different map. Both are checked by
       measuring how far a train sits from the nearest coloured line, which is
       the thing that would come apart. */
    const gap=()=>p.evaluate(()=>{
      const m=[...document.querySelectorAll('#train-layer .train-mark')]
        .find(m=>m.style.display!=='none');
      if(!m) return -1;
      const b=m.getBoundingClientRect();
      const x=b.x+b.width/2, y=b.y+b.height/2;
      let best=1e9;
      document.querySelectorAll('#train-layer .train-line').forEach(l=>{
        const r=l.getBoundingClientRect();
        const dx=Math.max(r.left-x, 0, x-r.right), dy=Math.max(r.top-y, 0, y-r.bottom);
        best=Math.min(best, Math.hypot(dx,dy));
      });
      return best;
    });
    await p.evaluate(()=>{
      const s=document.querySelector('#train-time');
      s.value='540'; s.dispatchEvent(new Event('input',{bubbles:true}));});
    await sleep(300);
    const merc=await gap();
    await p.evaluate(()=>{
      const r=document.querySelector('#proj-albers');
      r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));});
    await sleep(900);
    const albers=await gap();
    check('a train stays on its line through a change of projection',
      merc>=0 && albers>=0 && albers<3, 'mercator '+merc.toFixed(2)
      +' px, albers '+albers.toFixed(2)+' px');
    await p.evaluate(()=>{
      const r=document.querySelector('#proj-mercator');
      r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));});
    await sleep(900);

    /* ---- 8. the switch is in the address ---------------------------- */
    const code=await p.evaluate(()=>new URL(location.href).searchParams.get('layers'));
    const back=await browser.newPage();
    await back.evaluateOnNewDocument(SHIM);
    await back.setViewport({width:1200,height:860});
    await back.goto(TAIWAN+'&layers='+code,{waitUntil:'networkidle0'});
    await shutDialogs(back);
    await sleep(1400);
    const shared=await look(back);
    check('a shared link carries the train tools', shared.bar && shared.layer,
      'layers='+code+' '+JSON.stringify(shared));
    check('and the switch is ticked in the panel',
      await back.evaluate(()=>document.querySelector('#opt-train-tools').checked), '');
    await back.close();

    /* ---- 9. the track does not take the pointer --------------------- */
    const overLine=await p.evaluate(()=>{
      const l=document.querySelector('#train-layer .train-line');
      if(!l) return 'none';
      const b=l.getBoundingClientRect();
      const el=document.elementFromPoint(b.x+b.width/2, b.y+b.height/2);
      return el?(el.id||el.getAttribute('class')||el.tagName):'null';
    });
    check('the coloured track answers no pointer', !/train-line/.test(overLine), overLine);
    await p.close();

    /* ---- 10. and all of it with a finger ---------------------------- */
    const t=await browser.newPage();
    await t.setViewport({width:414,height:820,isMobile:true,hasTouch:true});
    await t.goto(TAIWAN,{waitUntil:'networkidle0'});
    await shutDialogs(t);
    await setSwitch(t,true);
    await sleep(1400);
    const tv=await look(t);
    check('finger: the bar is up', tv.bar && tv.layer, JSON.stringify(tv));
    const playBox=await t.evaluate(()=>{
      const b=document.querySelector('#train-bar .train-play').getBoundingClientRect();
      return {x:b.x+b.width/2,y:b.y+b.height/2,h:b.height};});
    check('finger: the play button is big enough to hit', playBox.h>=30, playBox.h+'px');
    const before=(await look(t)).clock;
    await t.touchscreen.tap(playBox.x,playBox.y);
    await sleep(1400);
    check('finger: a tap plays the day', (await look(t)).clock!==before,
      before+' -> '+(await look(t)).clock);
    // and a tap on a station opens its trains
    const box=await t.evaluate(()=>{
      const el=document.querySelector('[data-id="tws029"]');
      if(!el) return null;
      const r=el.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2};});
    if(box){
      await t.touchscreen.tap(box.x,box.y);
      await sleep(400);
      const shown=await t.evaluate(()=>{
        const h=document.querySelector('#info-trains');
        return {hidden:h.hidden,rows:h.querySelectorAll('.trains-table tr').length,
                name:(document.querySelector('#info .primary')||{}).textContent||''};});
      /* Which station is not pinned here. The squares round Taihoku are a few
         pixels apart and a finger is not a pixel, so a tap aimed at one can
         perfectly well land on its neighbour — that is what a finger is like,
         and it is not a fault. What has to be true is that a tap opened a
         station's card and that the card has its trains in it. The exact
         station, and its 127 trains, are pinned by the mouse check above. */
      check('finger: a tap on a station shows its trains',
        !shown.hidden && shown.rows>1 && !!shown.name, JSON.stringify(shown));
    } else check('finger: a tap on a station shows its trains', false, 'no station mark on screen');
    /* The strip must fit the strip. A flex row overflows *visibly* rather than
       clipping, so a row that comes to more than the bar is wide draws its
       last child outside the bar and onto whatever is there — which on a phone
       is the zoom controls. Checked as geometry rather than by eye. */
    const fits=await t.evaluate(()=>{
      const bar=document.querySelector('#train-bar').getBoundingClientRect();
      const kids=[...document.querySelectorAll('#train-bar .train-row > *')]
        .filter(e=>e.offsetParent !== null)
        .map(e=>e.getBoundingClientRect());
      const z=document.querySelector('#zoom-in').getBoundingClientRect();
      return {out: kids.filter(k=>k.right>bar.right+1||k.left<bar.left-1).length,
              onZoom: bar.right>z.left && bar.left<z.right
                      && bar.bottom>z.top && bar.top<z.bottom};});
    check('finger: nothing spills out of the strip', fits.out===0, JSON.stringify(fits));
    check('finger: the strip is clear of the zoom buttons', !fits.onZoom, JSON.stringify(fits));
    // and zooming out with the buttons, which is how a phone leaves
    await t.evaluate(()=>{
      for(let i=0;i<9;i++) document.querySelector('#zoom-out').click();});
    await sleep(900);
    const gone=await look(t);
    check('finger: zooming out puts the tools away', !gone.bar && !gone.layer,
      JSON.stringify(gone));
    await t.close();

    /* ---- 11. and in landscape, where the screen is 375 px tall ------- */
    /* The zoom buttons are a row along the top left there, so the strip has to
       start after them; and a card open on a screen that short is 76% of it,
       so the strip stands down while one is, as the legend already does. */
    const L=await browser.newPage();
    await L.setViewport({width:667,height:375,isMobile:true,hasTouch:true});
    await L.goto(TAIWAN,{waitUntil:'networkidle0'});
    await shutDialogs(L);
    await setSwitch(L,true);
    await sleep(1500);
    const land=await L.evaluate(()=>{
      const R=s=>{const e=document.querySelector(s);const b=e.getBoundingClientRect();
        return {l:Math.round(b.left),r:Math.round(b.right),t:Math.round(b.top),b:Math.round(b.bottom)};};
      return {bar:R('#train-bar'), zoom:R('#zoom-in'), up:!!document.querySelector('#train-bar')};});
    check('landscape: the strip is up', land.up && land.bar.r>land.bar.l,
      JSON.stringify(land.bar));
    check('landscape: it starts after the row of zoom buttons',
      land.bar.l >= land.zoom.r, JSON.stringify(land));
    const lbox=await L.evaluate(()=>{
      const el=document.querySelector('[data-id="tws029"]');
      if(!el) return null;
      const r=el.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2};});
    if(lbox){
      await L.touchscreen.tap(lbox.x,lbox.y);
      await sleep(500);
      const covered=await L.evaluate(()=>{
        const bar=document.querySelector('#train-bar');
        const info=document.querySelector('#info').getBoundingClientRect();
        const b=bar.getBoundingClientRect();
        return {hidden:getComputedStyle(bar).display==='none',
                overlap: b.bottom>info.top && b.top<info.bottom && b.width>0};});
      check('landscape: a card does not land on top of the strip',
        !covered.overlap, JSON.stringify(covered));
    } else check('landscape: a card does not land on top of the strip', false,
      'no station mark on screen');
    await L.close();
  } finally { await browser.close(); }
  console.log('\n'+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
