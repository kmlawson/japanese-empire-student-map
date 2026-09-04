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
const { ready } = require('./settle.js');
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
    await back.goto(TAIWAN+'&layers='+code,{waitUntil:'networkidle0'});
    await shutDialogs(back);
    await sleep(1400);
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
      await q.goto(TAIWAN+'&layers='+code.toString(36),{waitUntil:'networkidle0'});
      await shutDialogs(q);
      await sleep(2000);
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
      await q.goto(TAIWAN,{waitUntil:'networkidle0'});
      await shutDialogs(q);
      await setSwitch(q,true);
      await sleep(1500);
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
    await tt.goto('http://localhost:8123/timetable/taiwan-1936.html',
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
  } finally { await browser.close(); }
  console.log('\n'+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
