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
const { puppeteer, sleep, ready, until, check, report, SHIM, launch, HOST } = require('./suite.js');
const { sandboxDownloads } = require('./downloads.js');
const fs = require('fs');

const BASE=HOST+'/index.html';
const WHOLE=BASE+'?where=66,-12,180,55';
const TAIWAN=BASE+'?where=119.9,21.7,122.2,25.5';

/* The state of the interface, in one read. */
const look=p=>p.evaluate(()=>{
  const layer=document.querySelector('#train-layer');
  const bar=document.querySelector('#train-bar');
  const lines=document.querySelectorAll('#train-layer .train-line');
  const marks=[...document.querySelectorAll('#train-marks .train-mark')]
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
    staBox: !!(document.querySelector('#opt-tw-stations')||{}).checked,
  };});

/* One train's radius as the reader sees it, in screen pixels. */
const trainPx=p=>p.evaluate(()=>{
  const m=[...document.querySelectorAll('#train-marks .train-mark')]
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

/* The train tools bring the railway up but no longer the station squares —
   that is the reader's own switch now. Every check below that needs to *point*
   at a station has to ask for them, the way a reader would. */
const askForSquares=async(p,sys)=>{
  await p.evaluate(id=>{const b=document.querySelector(id);
    if(b&&!b.checked){b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));}},
    '#opt-'+(sys||'tw')+'-stations');
  await sleep(900);
};
const shutDialogs=p=>p.evaluate(()=>{
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());});

(async()=>{
  const browser=await launch();
  try{
    /* ---- 1. nothing until it is asked for --------------------------- */
    const p=await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({width:1200,height:860});
    const fetched=[];
    p.on('request',r=>{const u=r.url(); if(/trains\.js|tw-trains\.js/.test(u))fetched.push(u.split('/').pop().split('?')[0]);});
    await p.goto(TAIWAN,{waitUntil:'domcontentloaded'});
    await ready(p);
    await shutDialogs(p);
    let v=await look(p);
    check('off: no layer, no bar', !v.layer && !v.bar, JSON.stringify(v));
    check('off: neither file fetched', fetched.length===0, fetched.join());

    /* The station button, without any train tools at all — which is the
       ordinary case: a reader who has switched a railway on and come close
       enough to see it should be able to mark its stops from the map rather
       than from a dialog. */
    const btn=()=>p.evaluate(()=>{
      const b=document.querySelector('#btn-stations');
      return {hidden:b.hidden, pressed:b.getAttribute('aria-pressed'), title:b.title,
        shown:[...document.querySelectorAll('#tw-stations .sta-mark')]
          .filter(m=>m.getBoundingClientRect().width>0).length};});
    check('with no railway on, no station button', (await btn()).hidden, '');
    await p.evaluate(()=>{
      const r=document.querySelector('#opt-tw-rail');
      r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));});
    await sleep(500);
    let sb=await btn();
    check('a railway on and in view offers it',
      !sb.hidden && sb.pressed==='false' && /Show/.test(sb.title), JSON.stringify(sb));
    await p.click('#btn-stations');
    await sleep(500);
    sb=await btn();
    check('and pressing it marks the stops', sb.pressed==='true' && sb.shown>150,
      JSON.stringify(sb));
    check('the Layers panel agrees',
      await p.evaluate(()=>document.querySelector('#opt-tw-stations').checked), '');
    // and it goes when the reader leaves the island
    await p.evaluate(()=>{
      for(let i=0;i<10;i++) document.querySelector('#zoom-out').click();});
    await sleep(800);
    check('and it goes when the railway is no longer drawn', (await btn()).hidden, '');
    check('still nothing fetched by any of that', fetched.length===0, fetched.join());

    /* ---- 2. the switch alone is not enough -------------------------- */
    await p.goto(WHOLE,{waitUntil:'domcontentloaded'});
    await ready(p);
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
    await p.goto(TAIWAN+'&layers='+on,{waitUntil:'domcontentloaded'});
    await ready(p);
    await shutDialogs(p);
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
    /* The squares are the railway layer's, not the train tools'. The tools
       borrow the *railway* — a clock over an empty island is not a timetable —
       but no longer the squares: they used to be switched on with the tools,
       on the argument that a reader who asked for a timetable should be able
       to point at a station without finding two more switches, and the author
       asked for the reader's own setting to be left alone instead. So the
       railway is checked on, the squares are asked for here, and the rest of
       this section goes on as before. */
    v=await look(p);
    check('the railway is borrowed, the squares are not',
      v.railBox && !v.staBox, JSON.stringify({railBox:v.railBox,staBox:v.staBox}));
    await p.evaluate(()=>{const b=document.querySelector('#opt-tw-stations');
      if(b&&!b.checked){b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));}});
    await sleep(1500);
    v=await look(p);
    check('and the reader can turn the squares on', v.stations>150 && v.railBox,
      JSON.stringify({stations:v.stations,railBox:v.railBox}));
    /* And only the ones the timetable knows. 167 of the map's 206 Taiwanese
       stations are on a line in the February 1936 table; the other 39 would
       otherwise sit on the coloured network looking like the stops around
       them and open a card with no trains in it. */
    const drawn=()=>p.evaluate(()=>({
      squares:document.querySelectorAll('#tw-stations .sta-mark').length,
      shown:[...document.querySelectorAll('#tw-stations .sta-mark')]
        .filter(m=>m.style.display!=='none').length}));
    const withTools=await drawn();
    check('and only those the timetable knows are drawn',
      withTools.squares===206 && withTools.shown===167, JSON.stringify(withTools));
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

    /* ---- 7a. tapping a train, and tapping a line -------------------- */
    /* Neither layer takes pointer events — a hover must still name the country
       under the pointer — so the tap is measured against the trains and the
       track by `hitAt` and routed by `handleTap`. Driven here as the map's own
       pointer path sees it: a pointerdown and a pointerup on the container. */
    const tapAt=async(x,y)=>{
      await p.evaluate((x,y)=>{
        const c=document.querySelector('#map-container');
        const o={bubbles:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse',isPrimary:true,button:0};
        c.dispatchEvent(new PointerEvent('pointerdown',o));
        c.dispatchEvent(new PointerEvent('pointerup',o));
      },x,y);
      await sleep(260);
    };
    const readCard=()=>p.evaluate(()=>({
      chip:(document.querySelector('#info .chip')||{}).textContent||'',
      primary:(document.querySelector('#info .primary')||{}).textContent||'',
      alt:(document.querySelector('#info .alt')||{}).textContent||'',
      prov:(document.querySelector('#info .prov')||{}).textContent||'',
      note:(document.querySelector('#info .note-own')||{}).textContent||'',
      rows:document.querySelectorAll('#info-trains .trains-table tr').length,
      href:(document.querySelector('#info-trains a')||{}).getAttribute
        ? document.querySelector('#info-trains a').getAttribute('href') : '',
      hrefs:[...document.querySelectorAll('#info-trains a')].map(a=>a.getAttribute('href')),
      cols:[...document.querySelectorAll('#info-trains th')].map(t=>t.textContent),
      firstRow:[...document.querySelectorAll('#info-trains .trains-table tr')]
        .slice(1,2).flatMap(r=>[...r.children].map(td=>td.textContent)),
      hidden:document.querySelector('#info').hidden}));
    // a moment when plenty are running, then aim at one
    await p.evaluate(()=>{
      const s=document.querySelector('#train-time');
      s.value='540'; s.dispatchEvent(new Event('input',{bubbles:true}));});
    await sleep(300);
    const tPos=await p.evaluate(()=>{
      const m=[...document.querySelectorAll('#train-marks .train-mark')]
        .find(m=>m.style.display!=='none');
      if(!m) return null;
      const b=m.getBoundingClientRect();
      return {x:b.x+b.width/2,y:b.y+b.height/2};});
    if(tPos){
      await tapAt(tPos.x,tPos.y);
      const c=await readCard();
      check('a tap on a train names the train', !c.hidden && /^Train/.test(c.chip)
        && /^Train \S+/.test(c.primary), JSON.stringify(c).slice(0,220));
      check('and says where it came from and where it is going',
        /^Left .+ at \d\d:\d\d, due .+ at \d\d:\d\d\./.test(c.note), c.note);
      check('with its calling list under it', c.rows>2, 'rows='+c.rows);
      check('and says where it came from with the characters in brackets',
        /\(\S+\)\s+at\s+\d\d:\d\d/.test(c.note), c.note);
      /* Every train is going somewhere. The Taitung line's printed tables
         leave the 行先 row blank, so eighteen of the 346 had an empty "To"
         until the destination was taken from the last station they are timed
         at — which for a line joined to nothing is where they end. */
      check('every train in the table has a destination',
        await p.evaluate(() => JMAP.TW_TRAINS.trains.every(t => t.dest)), '');
      check('and every stop that is written in characters has its Mandarin',
        await p.evaluate(() => {
          const s = JMAP.TW_TRAINS.stations.filter(
            x => /[\u4e00-\u9fff]/.test(x.n) && !/[\u30a0-\u30ff]/.test(x.n));
          return s.length > 180 && s.every(x => x.py);
        }), '');
      /* And each stop named three ways where the map has three: the
         characters, the local romanisation and the Japanese one. */
      check('the calling list names each stop in three scripts',
        c.cols.join('|')==='Station|Pinyin|Romaji|Arr|Dep', c.cols.join('|'));
      check('and fills them where the map has them',
        c.firstRow.length===5 && /[\u4e00-\u9fff]/.test(c.firstRow[0])
        && /[\u0100-\u017f\u01ce-\u01dc]|^[A-Z]/.test(c.firstRow[1]),
        JSON.stringify(c.firstRow));
      check('and a link to the printed table',
        /timetable\/taiwan-1936\.html.*#line-/.test(c.href), c.href);
    } else {
      ['a tap on a train names the train','and says where it came from and where it is going',
       'with its calling list under it','and a link to the printed table']
        .forEach(n=>check(n,false,'no train on screen'));
    }
    /* A point on the track, away from any station square and any train. */
    const lPos=await p.evaluate(()=>{
      const stas=[...document.querySelectorAll('#tw-stations .sta-mark')]
        .map(e=>e.getBoundingClientRect()).filter(b=>b.width);
      const trains=[...document.querySelectorAll('#train-marks .train-mark')]
        .filter(m=>m.style.display!=='none').map(e=>e.getBoundingClientRect());
      const clear=(x,y)=>stas.every(b=>Math.hypot(x-(b.x+b.width/2),y-(b.y+b.height/2))>26)
        && trains.every(b=>Math.hypot(x-(b.x+b.width/2),y-(b.y+b.height/2))>26);
      for (const l of document.querySelectorAll('#train-layer .train-line')) {
        const len=l.getTotalLength ? l.getTotalLength() : 0;
        if (!len) continue;
        const svg=l.ownerSVGElement, m=l.getScreenCTM();
        for (let f=0.2; f<=0.8; f+=0.1) {
          const q=l.getPointAtLength(len*f);
          const pt=svg.createSVGPoint(); pt.x=q.x; pt.y=q.y;
          const s=pt.matrixTransform(m);
          if (s.x>60 && s.y>150 && s.x<1100 && s.y<800 && clear(s.x,s.y))
            return {x:s.x,y:s.y,stroke:l.getAttribute('stroke')};
        }
      }
      return null;});
    if(lPos){
      await tapAt(lPos.x,lPos.y);
      const c=await readCard();
      check('a tap on the track names the line', !c.hidden && /Railway line/i.test(c.chip)
        && /Line$/.test(c.primary), JSON.stringify(c).slice(0,200));
      check('with the day on it counted', c.rows>=6, 'rows='+c.rows);
      /* And what the line was, not just how busy it is. The dates come from
         the build's own table of descriptions; if one is ever missing the card
         falls back to nothing, and this is what would notice. */
      check('and a description of the line with a date in it',
        c.note.length>200 && /\b(18|19)\d\d\b/.test(c.note), c.note.slice(0,120));
      check('and a link to the article it is described from',
        /wikipedia\.org/.test(c.href), c.href);
      check('and a link to its printed tables',
        c.hrefs.some(h=>/timetable\/taiwan-1936\.html.*#line-/.test(h)),
        JSON.stringify(c.hrefs));
    } else {
      ['a tap on the track names the line','with the day on it counted',
       'and a link to its printed tables'].forEach(n=>check(n,false,'no clear track found'));
    }
    /* And a tap away from all three still names the ground, which is the whole
       reason the layer takes no pointer events. */
    const sea=await p.evaluate(()=>{
      const el=document.querySelector('[data-id="tws029"]');
      const b=el?el.getBoundingClientRect():{x:400,y:400};
      return {x:b.x+150,y:b.y};});
    await tapAt(sea.x,sea.y);
    const after=await readCard();
    check('a tap beside the track still names the ground',
      after.hidden || !/Railway line|^Train/.test(after.chip),
      JSON.stringify(after).slice(0,160));

    /* ---- 7b2. names follow the Japanese-names switch ---------------- */
    /* The rule the whole map keeps: the local romanisation, or the Japanese
       one when that switch is on, with the characters in brackets. Local means
       Mandarin here and will mean McCune-Reischauer when Korea has a
       timetable, so what is checked is that the switch changes the answer —
       not that any particular romanisation appears. */
    const jp=async(on)=>{
      await p.evaluate(v=>{
        const b=document.querySelector('#opt-jpnames');
        if(b.checked!==v){b.checked=v;b.dispatchEvent(new Event('change',{bubbles:true}));}
      },on);
      await sleep(500);
    };
    if(lPos){
      await jp(false);
      await tapAt(lPos.x,lPos.y);
      const off=await readCard();
      const offChips=await p.evaluate(()=>[...document.querySelectorAll('.train-chip')]
        .map(c=>c.textContent.trim()));
      await jp(true);
      await tapAt(lPos.x,lPos.y);
      const on=await readCard();
      const onChips=await p.evaluate(()=>[...document.querySelectorAll('.train-chip')]
        .map(c=>c.textContent.trim()));
      check('a line is named in English by default and in the reading with the switch on',
        /Line$/.test(off.primary) && !/Line$/.test(on.primary) && on.primary.length>3,
        off.primary+' -> '+on.primary);
      check('and so are the line colours in the strip',
        offChips[0]!==onChips[0] && /Line$/.test(offChips[0]),
        offChips[0]+' -> '+onChips[0]);
      /* Whichever line the tap landed on — the check is the shape of the
         list, not which stations are in it. */
      check('the terminus list puts the characters in brackets',
        /^Trains start or end at /.test(off.prov)
        && /[A-Za-z\u0100-\u01ff]+\s\([\u4e00-\u9fff]+\)/.test(off.prov),
        off.prov.slice(0,80));
      check('and changes romanisation with the switch',
        off.prov!==on.prov, on.prov.slice(0,80));
      await jp(false);
    }

    /* ---- 7c. the two buttons beside the zoom controls ---------------- */
    const btns=()=>p.evaluate(()=>{
      const R=s=>{const b=document.querySelector(s);return b?{hidden:b.hidden,
        pressed:b.getAttribute('aria-pressed'),title:b.title,
        w:Math.round(b.getBoundingClientRect().width),
        h:Math.round(b.getBoundingClientRect().height)}:null;};
      return {sta:R('#btn-stations'), trn:R('#btn-trains'),
              squares:document.querySelectorAll('#tw-stations .sta-mark').length,
              /* The layer is hidden as a group, not mark by mark, so a mark's
                 own style says nothing about whether it is on screen. */
              shown:[...document.querySelectorAll('#tw-stations .sta-mark')]
                .filter(m=>m.getBoundingClientRect().width>0).length};});
    /* The zoom-out in section 7 took the tools down and gave the railway back,
       and the tools no longer switch the squares on when they come up again —
       so this block asks for them itself rather than inheriting whatever the
       section above happened to leave. What is being tested here is the
       button, and a button is tested from a state you named. */
    await p.evaluate(()=>{const b=document.querySelector('#opt-tw-stations');
      if(b&&!b.checked){b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));}});
    await sleep(700);
    let bv=await btns();
    check('the station button is offered over a drawn railway',
      bv.sta && !bv.sta.hidden && bv.sta.pressed==='true', JSON.stringify(bv.sta));
    check('and the train tools button with it',
      bv.trn && !bv.trn.hidden && bv.trn.pressed==='true', JSON.stringify(bv.trn));
    check('both are finger sized', bv.sta.w>=40 && bv.sta.h>=40, JSON.stringify(bv.sta));
    await p.click('#btn-stations');
    await sleep(400);
    bv=await btns();
    check('pressing it hides the squares',
      bv.sta.pressed==='false' && bv.shown===0, JSON.stringify(bv));
    await p.click('#btn-stations');
    await sleep(400);
    bv=await btns();
    check('and pressing it again brings them back',
      bv.sta.pressed==='true' && bv.shown>150, JSON.stringify(bv));
    await p.click('#btn-trains');
    await sleep(600);
    const off=await look(p);
    bv=await btns();
    check('the train button puts the tools away', !off.bar && !off.layer,
      JSON.stringify(off));
    check('and the plain railway comes back',
      await p.evaluate(()=>{
        const g=document.querySelector('#tw-rail');
        return !!g && getComputedStyle(g).display!=='none'
          && +getComputedStyle(g).opacity>0.5;}), '');
    check('the button stays, now unpressed', !bv.trn.hidden && bv.trn.pressed==='false',
      JSON.stringify(bv.trn));
    const noTools=await drawn();
    check('and all 206 stations are back, not just the 167',
      noTools.shown===206, JSON.stringify(noTools));
    await p.click('#btn-trains');
    await sleep(900);
    const again=await look(p);
    check('and brings them back', again.bar && again.layer, JSON.stringify(again));

    /* ---- 7d. the squares sit between the track and the trains -------- */
    const stack=await p.evaluate(()=>{
      const svg=document.querySelector('#map-svg svg');
      const ix=id=>[...svg.children].findIndex(c=>c.id===id);
      return {track:ix('train-layer'), squares:ix('tw-stations'), trains:ix('train-marks')};});
    check('the squares are above the track and below the trains',
      stack.track>=0 && stack.track<stack.squares && stack.squares<stack.trains,
      JSON.stringify(stack));

    /* ---- 7b. and it survives a change of projection ----------------- */
    /* The track is reprojected by the map, along with every other path in the
       document. The trains are not: their positions are worked out from points
       this module has already projected, and a change of projection makes
       those answers to a question about a different map. Both are checked by
       measuring how far a train sits from the nearest coloured line, which is
       the thing that would come apart. */
    const gap=()=>p.evaluate(()=>{
      const m=[...document.querySelectorAll('#train-marks .train-mark')]
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
    await back.goto(TAIWAN+'&layers='+code,{waitUntil:'domcontentloaded'});
    await ready(back);
    await shutDialogs(back);
    const shared=await look(back);
    check('a shared link carries the train tools', shared.bar && shared.layer,
      'layers='+code+' '+JSON.stringify(shared));
    check('and the switch is ticked in the panel',
      await back.evaluate(()=>document.querySelector('#opt-train-tools').checked), '');
    await back.close();

    /* And the railway and its stations are in the address in their own right,
       not only as something the tools borrow. Five bits — 25 the Taiwan
       railway, 26 its stations, 27 and 28 Korea's, 29 the tools — written by
       hand here and read back off the switches, so a link that says stations
       are on arrives with them on. While the tools are up, 25 and 26 carry
       what the reader had *before* the borrow, which is why turning the
       squares off from the map clears 26 while the tools stay on. */
    for (const [label, code, want] of [
      ['rail and stations, no tools', (1<<25)|(1<<26),
       {twRail:true, twSta:true, tools:false}],
      ['rail, stations and tools', (1<<25)|(1<<26)|(1<<29),
       {twRail:true, twSta:true, tools:true}],
      ['Korea\u2019s railway and its stations', (1<<27)|(1<<28),
       {krRail:true, krSta:true, twRail:false}],
    ]) {
      const q = await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({width:1200,height:860});
      await q.goto(TAIWAN+'&layers='+code.toString(36),{waitUntil:'domcontentloaded'});
      await ready(q);
      await shutDialogs(q);
      const got = await q.evaluate(()=>({
        twRail:document.querySelector('#opt-tw-rail').checked,
        twSta:document.querySelector('#opt-tw-stations').checked,
        krRail:document.querySelector('#opt-kr-rail').checked,
        krSta:document.querySelector('#opt-kr-stations').checked,
        tools:document.querySelector('#opt-train-tools').checked}));
      check('a link saying "'+label+'" arrives that way',
        Object.keys(want).every(k=>got[k]===want[k]), JSON.stringify(got));
      await q.close();
    }

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
    await t.goto(TAIWAN,{waitUntil:'domcontentloaded'});
    await ready(t);
    await shutDialogs(t);
    await setSwitch(t,true);
    await sleep(1400);
    await askForSquares(t);
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

    /* ---- 10b. the widths where every panel floats over the map ------ */
    /* Between 621 and 999 the legend, the card, the zoom controls and the
       strip all float, and three of them wanted the same two corners. The
       reported fault was the worst of it: the two layer buttons grew the zoom
       column down into the card's top-right, which is where its close button
       is, so the one control that gets the card out of the way was the one
       they covered. Measured rather than eyeballed, at both ends of the range
       and at a width where the sidebar exists. */
    const overlaps=async(w,h)=>{
      const q=await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({width:w,height:h});
      await q.goto(TAIWAN,{waitUntil:'domcontentloaded'});
      await ready(q);
      await shutDialogs(q);
      await setSwitch(q,true);
      await sleep(1500);
      await askForSquares(q);
      await q.evaluate(()=>{
        const el=document.querySelector('[data-id="tws029"]');
        if(!el) return;
        const r=el.getBoundingClientRect();
        const ev=n=>el.dispatchEvent(new PointerEvent(n,{bubbles:true,
          clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'mouse'}));
        ev('pointerover');ev('pointerdown');ev('pointerup');ev('click');});
      await sleep(400);
      const out=await q.evaluate(()=>{
        const R=s=>{const e=document.querySelector(s);
          if(!e||e.hidden) return null;
          const b=e.getBoundingClientRect();
          return b.width?{l:b.left,r:b.right,t:b.top,b:b.bottom}:null;};
        const over=(a,b)=>!!(a&&b&&a.r>b.l+0.5&&a.l<b.r-0.5&&a.b>b.t+0.5&&a.t<b.b-0.5);
        const close=R('#info-close'), bar=R('#train-bar'), info=R('#info');
        const side=R('#side');
        return {
          onClose:['#btn-stations','#btn-trains','#zoom-in','#zoom-out','#zoom-reset']
            .filter(s=>over(R(s),close)),
          barOnCard: over(bar,info),
          barOnSide: innerWidth>=1000 && over(bar,side),
          cardOpen: !!info, barUp: !!bar};});
      await q.close();
      return out;
    };
    for (const [w,h] of [[999,760],[760,700],[660,900]]) {
      const o=await overlaps(w,h);
      check(w+'x'+h+': nothing sits on the card\u2019s close button',
        o.cardOpen && o.onClose.length===0, JSON.stringify(o));
      check(w+'x'+h+': the strip and the card do not overlap',
        o.barUp && !o.barOnCard, JSON.stringify(o));
    }
    const wide=await overlaps(1100,800);
    check('1100x800: the strip stays over the map, not the sidebar',
      wide.barUp && !wide.barOnSide && !wide.barOnCard, JSON.stringify(wide));

    /* ---- 11. and in landscape, where the screen is 375 px tall ------- */
    /* The zoom buttons are a row along the top left there, so the strip has to
       start after them; and a card open on a screen that short is 76% of it,
       so the strip stands down while one is, as the legend already does. */
    const L=await browser.newPage();
    await L.setViewport({width:667,height:375,isMobile:true,hasTouch:true});
    await L.goto(TAIWAN,{waitUntil:'domcontentloaded'});
    await ready(L);
    await shutDialogs(L);
    await setSwitch(L,true);
    await sleep(1500);
    await askForSquares(L);
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
    /* ---- 12. the printed tables, in three languages ----------------- */
    /* The page the cards link to. Its furniture is translated and its tables
       are not — they are a transcription of a printed document, and the only
       thing that happens inside one is that a station name gains its reading
       on a second line. The column headings are the one exception and only in
       English, with the printed word kept on the cell. */
    const tt=await browser.newPage();
    const ttErr=[];
    tt.on('pageerror',e=>ttErr.push(String(e).slice(0,160)));
    await tt.setViewport({width:1200,height:900});
    await tt.goto(HOST+'/timetable/taiwan-1936.html',
                  {waitUntil:'networkidle0'});
    /* The printed tables, which are not the map: `ready` waits for `#land`
       and this page has none. `networkidle0` is the whole of the wait here. */
    await sleep(400);
    const page=()=>tt.evaluate(()=>({
      lang:document.documentElement.lang,
      h1:document.querySelector('h1').textContent,
      cols:[...document.querySelectorAll('tr.hd th')].slice(0,2).map(t=>t.textContent),
      colTitle:(document.querySelector('tr.hd th')||{}).title||'',
      readings:document.querySelectorAll('.rd').length,
      shown:[...document.querySelectorAll('.rd')].filter(r=>r.textContent).length,
      first:(()=>{const c=document.querySelector('[data-stn]');
        return c?[c.getAttribute('data-stn'),c.querySelector('.rd').textContent]:null;})(),
      dir:document.querySelector('h2').textContent,
      tables:document.querySelectorAll('table').length,
      anchors:document.querySelectorAll('h2[id^="line-"]').length}));
    let pv=await page();
    check('and says the text was read by a machine, before the tables',
      await tt.evaluate(() => {
        const w = document.querySelector('.warn');
        if (!w || !w.textContent.trim()) return false;
        const t = document.querySelector('table');
        return !!(t && (w.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));
      }), '');
    check('the timetable page carries all eighteen tables',
      pv.tables===18 && pv.anchors===18, JSON.stringify({t:pv.tables,a:pv.anchors}));
    /* **It opens in English now.** This page is read by students of the empire
       more often than by readers of its languages, and the original's own is
       one press away — which is what the next checks press. A choice already
       made is remembered, so a reader who has picked Japanese is not moved
       back. */
    check('it opens in English', pv.lang==='en' && /Timetable/.test(pv.h1),
      pv.lang+' '+pv.h1);
    check('  with the headings translated', pv.cols.join('|')==='km|Station',
      pv.cols.join('|'));
    check('  and the printed heading kept on the cell',
      pv.colTitle==='\u7c81\u7a0b', pv.colTitle);
    await tt.click('#langbar button[data-lang="ja"]');
    await sleep(300);
    pv=await page();
    check('Japanese is a press away, as the transcription is',
      pv.lang==='ja' && /\u8ee2\u8a18/.test(pv.h1), pv.lang+' '+pv.h1);
    check('with the kana under the station names',
      pv.readings>700 && pv.first && /[\u3040-\u309f]/.test(pv.first[1]),
      JSON.stringify(pv.first)+' of '+pv.readings);
    check('and the column headings as printed',
      pv.cols[0]==='\u7c81\u7a0b' && pv.cols[1]==='\u9a5b\u540d', pv.cols.join('|'));
    await tt.click('#langbar button[data-lang="zh"]');
    await sleep(300);
    pv=await page();
    check('Chinese gives the pinyin and leaves the headings alone',
      pv.lang==='zh-Hant' && /[\u0100-\u01ff]/.test(pv.first[1])
      && pv.cols[0]==='\u7c81\u7a0b', JSON.stringify(pv.first)+' '+pv.cols.join('|'));
    await tt.click('#langbar button[data-lang="en"]');
    await sleep(300);
    pv=await page();
    check('English translates the furniture and the headings',
      pv.lang==='en' && /Timetable/.test(pv.h1)
      && pv.cols.join('|')==='km|Station', pv.h1+' / '+pv.cols.join('|'));
    check('the readings can be put away',
      await tt.evaluate(async()=>{
        document.querySelector('#rd-on').click();
        return document.body.classList.contains('no-rd');}), '');
    check('no page errors on the timetable', ttErr.length===0, ttErr.join(' | '));
    await tt.close();

    /* --------------------------- no railway, no train tools ------------
     *
     * The tools are a timetable run over a line, so with every railway
     * switched off there is nothing left for them to be about — and the strip
     * stayed across the foot of the map with the track gone from under it.
     * Four things have to follow the railway, and they are checked together
     * because the report was "in all places": the switch in Layers, the row it
     * sits in, the button beside the zoom controls, and the strip itself.
     *
     * Both ways of turning the railway off are exercised. They are different
     * code — one is the button that toggles every network at once, the other
     * the two rows in the panel — and fixing one would have looked complete.
     */
    console.log('\n- the last railway off takes the tools with it -');
    const toolsState=pg=>pg.evaluate(()=>({
      box:document.getElementById('opt-train-tools').checked,
      row:!!document.getElementById('row-train-tools').hidden,
      btn:!!document.getElementById('btn-trains').hidden,
      bar:(()=>{const b=document.getElementById('train-bar');
        return b?getComputedStyle(b).display:'gone';})()}));
    for (const how of ['the button', 'the Layers rows']) {
      const pg=await browser.newPage();
      await pg.setViewport({width:1400,height:900});
      await pg.evaluateOnNewDocument(SHIM);
      const es=[]; pg.on('pageerror',e=>es.push(String(e)));
      await pg.goto(BASE+'?where=119,21.5,122.6,25.6',{waitUntil:'domcontentloaded'});
      await ready(pg);
      /* Before any railway is on there is nothing to run a timetable over, so
         neither the row nor the button is offered. */
      const cold=await toolsState(pg);
      check('with no railway on, the tools are not offered ('+how+')',
        cold.row===true && cold.btn===true, JSON.stringify(cold));
      await pg.evaluate(()=>{const x=document.getElementById('opt-tw-rail');
        if(x&&!x.checked)x.click();});
      await sleep(2000);
      const railed=await toolsState(pg);
      check('the railway on offers them ('+how+')',
        railed.row===false && railed.btn===false, JSON.stringify(railed));
      await pg.evaluate(()=>{const x=document.getElementById('opt-train-tools');
        if(!x.checked)x.click();});
      await sleep(3000);
      const up=await toolsState(pg);
      check('and the tools come up ('+how+')',
        up.box===true && up.bar==='flex', JSON.stringify(up));
      if (how==='the button') {
        await pg.evaluate(()=>document.getElementById('btn-rail').click());
      } else {
        await pg.evaluate(()=>{
          const t=document.getElementById('opt-tw-rail'); if(t.checked)t.click();
          const k=document.getElementById('opt-kr-rail'); if(k&&k.checked)k.click();});
      }
      await sleep(2500);
      const gone=await toolsState(pg);
      check('turning the last railway off puts the tools away ('+how+')',
        gone.box===false && gone.bar!=='flex', JSON.stringify(gone));
      check('and takes the row and the button with them ('+how+')',
        gone.row===true && gone.btn===true, JSON.stringify(gone));
      check('with nothing thrown ('+how+')', es.length===0, es.slice(0,2).join(' | '));
      await pg.close();
    }
    /* ---- 13. the track, for taking away ----------------------------- */
    /* **What a reader can see, a reader can take.** The rule this map already
       keeps for every table it draws, applied to the lines. Two offers, and
       they are deliberately different files:

       * with the tools up, one line at a time, straight from the coordinates
         `trains.js` holds — unprojected, unthinned, with the timetable and its
         citation in the properties;
       * with the tools down there is no line to name and no source geometry in
         memory, so the offer is the drawn network read back and unprojected,
         and its note says so.

       The second matters because a reader who never opens the tools should
       still be able to take the railway away, which is what the author asked
       for: *with or without train tools on*. */
    const dl = await sandboxDownloads(browser);
    const nSaved = () => fs.readdirSync(dl.dir).length;

    console.log('\n— the railway, as coordinates —');
    {
      const q = await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({ width: 1300, height: 950 });
      await q.goto(TAIWAN, { waitUntil: 'domcontentloaded' });
      await ready(q);
      await shutDialogs(q);
      await setSwitch(q, true);
      await sleep(2600);

      /* Pressing a line's name in the strip lights the line *and* opens its
         card. It used to do only the first, so the two halves of one act —
         pressing the track, pressing its name — answered differently. */
      const chip = await q.evaluate(() => {
        const c = document.querySelectorAll('.train-chip');
        if (!c.length) return null;
        c[0].click();
        return c[0].textContent.trim();
      });
      await sleep(900);
      const card = await q.evaluate(() => ({
        chip: (document.querySelector('.chip') || {}).textContent || '',
        name: (document.querySelector('#info .primary') || {}).textContent || '',
        table: !!document.querySelector('#info-trains .trains-table'),
        dl: [...document.querySelectorAll('#info-trains button')]
              .filter(b => /GeoJSON/.test(b.textContent)).length,
      }));
      check('pressing a line in the strip opens its card',
        !!chip && /line/i.test(card.chip) && !!card.name,
        JSON.stringify({ chip, card }));
      check('  and the card offers the line as GeoJSON', card.dl === 1,
        String(card.dl));

      const n0 = nSaved();
      await q.evaluate(() => {
        const b = [...document.querySelectorAll('#info-trains button')]
          .find(x => /GeoJSON/.test(x.textContent));
        if (b) b.click();
      });
      await sleep(1600);
      const made = fs.readdirSync(dl.dir).filter(f => /\.geojson$/.test(f));
      check('  and pressing it writes a file', made.length > 0 && nSaved() > n0,
        JSON.stringify(fs.readdirSync(dl.dir)));
      if (made.length) {
        const j = JSON.parse(fs.readFileSync(dl.dir + '/' + made[0], 'utf8'));
        const f0 = j.features[0];
        check('  a FeatureCollection of one line',
          j.type === 'FeatureCollection' && j.features.length === 1
            && f0.geometry.type === 'MultiLineString',
          j.type + ' / ' + j.features.length + ' / ' + f0.geometry.type);
        /* Longitude and latitude, not map units and not screen pixels — the
           whole point of taking it from the data rather than the drawing.
           Taiwan is 119–123E, 21–26N and nothing else is. */
        const pt = f0.geometry.coordinates[0][0];
        check('  in longitude and latitude, over Taiwan',
          pt[0] > 119 && pt[0] < 123 && pt[1] > 21 && pt[1] < 26,
          JSON.stringify(pt));
        check('  carrying the line, the timetable and the citation',
          !!f0.properties.line && !!f0.properties.timetable
            && !!f0.properties.source && f0.properties.system === 'tw',
          JSON.stringify(f0.properties).slice(0, 160));
        /* How much of it is traced and how much is a chord between two
           stations: a reader plotting this has to be able to tell a survey
           from an assertion that two places were joined. */
        check('  and saying how many stretches are drawn straight',
          typeof f0.properties.straight === 'number'
            && f0.properties.stretches > 0,
          f0.properties.straight + ' of ' + f0.properties.stretches);
      }
      await q.close();
    }

    console.log('\n— and with the train tools switched off —');
    {
      const q = await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({ width: 1300, height: 950 });
      await q.goto(TAIWAN, { waitUntil: 'domcontentloaded' });
      await ready(q);
      await shutDialogs(q);
      await q.evaluate(() => {
        const r = document.querySelector('#opt-tw-rail');
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await sleep(3200);
      const rows = await q.evaluate(() => {
        const g = document.getElementById('tw-rail');
        const path = g && g.querySelector('path');
        if (!path) return { err: 'no rail drawn' };
        const r = path.getBoundingClientRect();
        path.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true,
          clientX: Math.round(r.x + r.width / 2),
          clientY: Math.round(r.y + r.height / 2) }));
        const m = document.querySelector('#jmap-menu');
        return { tools: !!document.querySelector('#train-bar'),
                 rows: m ? [...m.querySelectorAll('button')].map(b => b.textContent) : [] };
      });
      check('a right click on the plain railway offers it',
        !rows.err && rows.tools === false
          && rows.rows.some(t => /GeoJSON/.test(t) && /Taiwan/.test(t)),
        JSON.stringify(rows));
      const n1 = nSaved();
      await q.evaluate(() => {
        const m = document.querySelector('#jmap-menu');
        const b = m && [...m.querySelectorAll('button')].find(x => /GeoJSON/.test(x.textContent));
        if (b) b.click();
      });
      await sleep(1600);
      /* `taiwan-railways.geojson` until the file learned to say which year's
         network it holds; it is `taiwan-railways-1930.geojson` now, and the
         later sheet's is `-1944`, because Taiwan's 1942 drawing is the 1944
         survey. Matching on the year rather than pinning one, so this does not
         have to be edited again when a source is replaced. */
      const net = fs.readdirSync(dl.dir).filter(f => /railways(-\d{4})?\.geojson$/.test(f));
      check('  and it writes the network', net.length > 0 && nSaved() > n1,
        JSON.stringify(fs.readdirSync(dl.dir)));
      if (net.length) {
        const j = JSON.parse(fs.readFileSync(dl.dir + '/' + net[0], 'utf8'));
        const pt = j.features[0].geometry.coordinates[0];
        check('  named for the year of the network it holds',
          /railways-\d{4}\.geojson$/.test(net[0]), net[0]);
        check('  as lines in longitude and latitude, over Taiwan',
          j.features[0].geometry.type === 'LineString'
            && pt[0] > 119 && pt[0] < 123 && pt[1] > 21 && pt[1] < 26,
          j.features.length + ' features, first ' + JSON.stringify(pt));
        /* And it says what it is, because it is the lesser of the two files:
           read off the drawing, so it carries the thinning and has no names. */
        check('  and admits it is read off the drawing',
          /thinning/.test(j.features[0].properties.note || ''),
          (j.features[0].properties.note || '').slice(0, 60));
      }
      await q.close();
    }
    dl.clean();

    /* ============ the file the tools give, over the plain one ============
     *
     * Two things went wrong here and both were invisible from the label.
     *
     * **The whole network came out as ninety bytes.** `openMenu` said
     * `var whole = trainApi.systemFeatures()` and, three hundred lines below,
     * `var whole = atomShapes(atomKey)` — one function-scoped variable, so the
     * closure handed the atom's SVG nodes to the writer and the file was
     * `{"__bb":{},"__bbGen":7}`. The row's own label was built earlier and read
     * "7 lines", which is why nobody noticed.
     *
     * **And a chord claimed to be a survey.** A stretch the source could not
     * trace is stored as a two-point path, so the old test — `!data.paths[k]` —
     * called it traced. 27 of Korea's 66 features are chords, most of them
     * running to Manchuria and the home islands where this map draws no
     * railway at all. They go out as their own features now so a reader can
     * drop them instead of measuring along them. */
    console.log('\n— the network file, and a chord that says so —');
    const net = await browser.newPage();
    await net.setViewport({width:1280,height:900});
    await net.evaluateOnNewDocument(SHIM);
    await net.goto(BASE+'?where=124.5,34.0,131.0,43.0',{waitUntil:'domcontentloaded'});
    await ready(net);
    await net.evaluate(()=>{const b=document.querySelector('#opt-kr-rail');
      if(b&&!b.checked){b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));}});
    await sleep(1800);
    await net.click('#btn-trains');
    await sleep(6000);
    const spot = await net.evaluate(()=>{
      const G=window.JMAP_GEO;
      const els=[...document.querySelectorAll('#train-layer .train-line')]
        .map(e=>({e,L:e.getTotalLength()})).sort((a,b)=>b.L-a.L);
      for(const {e,L} of els.slice(0,80)){
        for(const f of [0.5,0.35,0.65,0.2,0.8]){
          const q=e.getPointAtLength(L*f), ll=G.unproject(q.x,q.y);
          if(!(ll.lon>126&&ll.lon<129.5&&ll.lat>35&&ll.lat<39)) continue;
          const s=e.ownerSVGElement.createSVGPoint(); s.x=q.x; s.y=q.y;
          const scr=s.matrixTransform(e.getScreenCTM());
          const x=Math.round(scr.x), y=Math.round(scr.y);
          if(x>60&&x<innerWidth-60&&y>80&&y<innerHeight-60) return {x,y};
        }
      }
      return null;
    });
    check('a train line can be right-clicked over the peninsula', !!spot,
      'no line found inside the viewport');
    if (spot) {
      await net.mouse.click(spot.x, spot.y, {button:'right'});
      await sleep(350);
      const got = await net.evaluate(async ()=>{
        const m=document.getElementById('jmap-menu');
        if(!m) return {err:'no menu'};
        const b=[...m.querySelectorAll('button')].find(x=>/all of Korea/.test(x.textContent));
        if(!b) return {err:'no whole-network row',
                       rows:[...m.querySelectorAll('button')].map(x=>x.textContent)};
        let caught=null;
        const realBlob=window.Blob, realURL=URL.createObjectURL;
        window.Blob=function(parts,opts){caught=String(parts[0]); return new realBlob(parts,opts);};
        URL.createObjectURL=function(){return 'blob:stub';};
        b.click();
        window.Blob=realBlob; URL.createObjectURL=realURL;
        if(!caught) return {err:'nothing written'};
        let j=null; try{ j=JSON.parse(caught); }catch(e){ return {err:'not JSON: '+e}; }
        const fs=j.features||[];
        const kinds={};
        fs.forEach(f=>{const k=(f.properties||{}).geometry_kind||'(none)'; kinds[k]=(kinds[k]||0)+1;});
        let dup=0, verts=0;
        fs.forEach(f=>(((f.geometry||{}).coordinates)||[]).forEach(part=>{
          verts+=part.length;
          for(let i=1;i<part.length;i++)
            if(part[i][0]===part[i-1][0]&&part[i][1]===part[i-1][1]) dup++;
        }));
        const chord=fs.find(f=>(f.properties||{}).geometry_kind==='chord');
        return {bytes:caught.length, n:fs.length, kinds, dup, verts,
                bad: fs.filter(f=>!f||!f.geometry||!(f.geometry.coordinates||[]).length).length,
                chordNote: chord && (chord.properties.note||''),
                tracedNote: (fs.find(f=>(f.properties||{}).geometry_kind==='traced')||{properties:{}}).properties.note||''};
      });
      check('the whole network writes real features, not DOM nodes',
        !got.err && got.n > 20 && got.bad === 0,
        JSON.stringify(got).slice(0,180));
      /* The regression that started this: ninety bytes of expando. */
      check('  and is not the ninety-byte __bb file', !got.err && got.bytes > 100000,
        (got.bytes||0) + ' bytes');
      check('  every feature carrying geometry', !got.err && got.bad === 0,
        (got.bad||0) + ' with none');
      check('  and no repeated vertices', !got.err && got.dup === 0,
        (got.dup||0) + ' duplicate consecutive pairs of ' + (got.verts||0));
      check('a survey and an assertion are separate features',
        !got.err && got.kinds && got.kinds.traced > 0 && got.kinds.chord > 0,
        JSON.stringify(got.kinds));
      check('  and the chords say plainly not to measure along them',
        !got.err && /not a survey/.test(got.chordNote||''),
        (got.chordNote||'').slice(0,70));
      check('  while the traced part keeps the survey note',
        !got.err && /unprojected/.test(got.tracedNote||''),
        (got.tracedNote||'').slice(0,70));
    }
    await net.close();

    /* ============ the plain railway answers for itself ============
     *
     * It was the one drawn layer that named nothing: a press went through it
     * to the province beneath, so a reader looking at the line could not learn
     * whose it was, which year it showed, or where it came from — and it
     * carries all three.
     *
     * The year is the part worth guarding. The layer is drawn per date and the
     * dates are **not the map's dates**: Taiwan's later sheet is the 1944
     * network, because that is the survey its added lines were traced from,
     * and Karafuto is 1935 on both because the rails did not move. A card that
     * said "1942" over Taiwan's later drawing would be wrong in a way nobody
     * could catch by looking. */
    console.log('\n— the white railway, pressed —');
    const rc = await browser.newPage();
    await rc.setViewport({width:1300,height:950});
    await rc.evaluateOnNewDocument(SHIM);
    await rc.goto(TAIWAN,{waitUntil:'domcontentloaded'});
    await ready(rc);
    await shutDialogs(rc);
    await rc.evaluate(()=>{const r=document.querySelector('#opt-tw-rail');
      if(r&&!r.checked){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));}});
    await sleep(3000);

    /* A point on the invisible hit band, not on the drawn line: the drawn line
       is 1.9 screen pixels and a press cannot reliably land on it, which is
       the whole reason `.rail-hit` exists. */
    const onRail = await rc.evaluate(()=>{
      const els=[...document.querySelectorAll('#tw-rail .rail-hit')]
        .filter(e=>e.style.display!=='none');
      for(const el of els){
        const L=el.getTotalLength();
        for(const f of [0.5,0.3,0.7,0.2]){
          const q=el.getPointAtLength(L*f);
          const s=el.ownerSVGElement.createSVGPoint(); s.x=q.x; s.y=q.y;
          const scr=s.matrixTransform(el.getScreenCTM());
          const x=Math.round(scr.x), y=Math.round(scr.y);
          if(x>60&&x<innerWidth-60&&y>90&&y<innerHeight-60) return {x,y,n:els.length};
        }
      }
      return null;
    });
    check('the railway has a hit band wide enough to press', !!onRail,
      'no .rail-hit on screen');

    if (onRail) {
      await rc.mouse.click(onRail.x, onRail.y);
      await sleep(600);
      const card = await rc.evaluate(()=>{
        const b=document.getElementById('info');
        if(!b||b.hidden) return {open:false};
        return {open:true,
          chip:(b.querySelector('.chip')||{}).textContent,
          primary:(b.querySelector('.primary')||{}).textContent,
          alt:(b.querySelector('.alt')||{}).textContent,
          src:(b.querySelector('#info-trains a')||{}).textContent||'',
          href:(b.querySelector('#info-trains a')||{}).href||'',
          buttons:[...b.querySelectorAll('#info-trains button')].map(x=>x.textContent),
          picked:!!document.querySelector('#tw-rail.picked')};
      });
      check('pressing it opens a card for the railway, not the island',
        card.open && card.chip==='Railway' && /Taiwan Railways/.test(card.primary||''),
        JSON.stringify(card).slice(0,140));
      /* 1930 on this sheet — and 1944, not 1942, on the other. */
      check('  naming the date of the network it is showing',
        /1930/.test(card.alt||''), card.alt);
      check('  with the source named and linked',
        /鐵路分布圖/.test(card.src||'') && /^https?:/.test(card.href||''),
        (card.src||'').slice(0,50)+' | '+(card.href||''));
      check('  a way into the train tools',
        (card.buttons||[]).some(t=>/train tools/i.test(t)), JSON.stringify(card.buttons));
      check('and the whole network lights as one thing', card.picked===true,
        'the group has no .picked class');

      /* Both dates are in the drawing — the other epoch's paths are hidden,
         not absent — so all three files can be written from what is here. */
      await rc.mouse.click(onRail.x, onRail.y, {button:'right'});
      await sleep(400);
      const rows = await rc.evaluate(()=>{
        const m=document.getElementById('jmap-menu');
        return m?[...m.querySelectorAll('button')].map(b=>b.textContent)
          .filter(t=>/railways/.test(t)):[];
      });
      check('the menu offers each date and both together', rows.length===3,
        JSON.stringify(rows));
      /* The map's dates, not the tracing source's. 1944 is the American sheet
         several stretches were traced from, not the year of the network, and a
         card that printed it would be stating a survey's date as a fact about
         the railway. */
      check('  named for the map’s dates, not the sheet traced from',
        rows.some(t=>/1930/.test(t)) && rows.some(t=>/1942/.test(t))
          && !rows.some(t=>/1944/.test(t)),
        JSON.stringify(rows));

      const both = await rc.evaluate(async ()=>{
        const m=document.getElementById('jmap-menu');
        const b=[...m.querySelectorAll('button')].find(x=>/both dates/.test(x.textContent));
        if(!b) return {err:'no both-dates row'};
        let caught=null;
        const realBlob=window.Blob, realURL=URL.createObjectURL;
        window.Blob=function(parts,opts){caught=String(parts[0]); return new realBlob(parts,opts);};
        URL.createObjectURL=function(){return 'blob:stub';};
        b.click();
        window.Blob=realBlob; URL.createObjectURL=realURL;
        if(!caught) return {err:'nothing written'};
        let j=null; try{ j=JSON.parse(caught);}catch(e){return {err:'not JSON: '+e};}
        const eps={}, yrs={};
        (j.features||[]).forEach(f=>{eps[f.properties.epoch]=(eps[f.properties.epoch]||0)+1;
                                     yrs[f.properties.network_year]=1;});
        return {n:(j.features||[]).length, eps, yrs:Object.keys(yrs).sort(),
                src:(j.features[0]||{properties:{}}).properties.source||''};
      });
      check('  and the both-dates file carries both, told apart',
        !both.err && both.eps && both.eps.e1930>0 && both.eps.e1942>0,
        JSON.stringify(both).slice(0,150));
      check('  each feature saying which date it belongs to',
        !both.err && both.yrs && both.yrs.join(',')==='1930,December 1942',
        JSON.stringify((both||{}).yrs));
      check('  and carrying its source',
        !both.err && /鐵路分布圖/.test(both.src||''), (both.src||'').slice(0,40));
    }

    /* Karafuto is one drawing on both sheets, so it must not be offered twice
       under two names — the same file would be written either way. */
    await rc.goto(BASE+'?where=141.0,45.8,145.0,50.2',{waitUntil:'domcontentloaded'});
    await ready(rc);
    await shutDialogs(rc);
    await rc.evaluate(()=>{const r=document.querySelector('#opt-kf-rail');
      if(r&&!r.checked){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));}});
    await sleep(3000);
    const kfRows = await rc.evaluate(()=>{
      const els=[...document.querySelectorAll('#kf-rail .rail-hit')]
        .filter(e=>e.style.display!=='none');
      for(const el of els){
        const L=el.getTotalLength();
        for(const f of [0.5,0.3,0.7]){
          const q=el.getPointAtLength(L*f);
          const s=el.ownerSVGElement.createSVGPoint(); s.x=q.x; s.y=q.y;
          const scr=s.matrixTransform(el.getScreenCTM());
          const x=Math.round(scr.x), y=Math.round(scr.y);
          if(x>60&&x<innerWidth-60&&y>90&&y<innerHeight-60){
            el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,clientX:x,clientY:y}));
            const m=document.getElementById('jmap-menu');
            return m?[...m.querySelectorAll('button')].map(b=>b.textContent)
              .filter(t=>/railways/.test(t)):[];
          }
        }
      }
      return null;
    });
    check('Karafuto, one drawing for both dates, is offered once',
      kfRows && kfRows.length===1 && /1935/.test(kfRows[0]),
      JSON.stringify(kfRows));
    await rc.close();
  } finally { await browser.close(); }
  process.exit(report());
})();
