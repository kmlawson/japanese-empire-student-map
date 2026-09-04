/* The train tools over Korea: the 1938 timetable running over the peninsula.
 *
 *     node tools/test/krtrains.js          # with a server on 8123
 *
 * The Taiwan script (trains.js) proves the mechanism — nothing fetched until
 * asked and close enough, the clock, the sizes, the cards, the way out. This
 * proves the second system rides on it: that Korea comes up at the view where
 * the peninsula is the subject (a wider one than Taiwan's, which is the whole
 * point of the per-system thresholds), draws in its own colours, links its
 * stations to the 1938 tables and its cards to the Korea page, and that the
 * page itself reads in Japanese, Korean and English.
 *
 * The cautions from trains.js apply: shut the Layers dialog before pointing
 * at the map, and shim matchMedia for the mouse.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('krtrains test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};

const BASE='http://localhost:8123/index.html';
const WHOLE=BASE+'?where=66,-12,180,55';
const KOREA=BASE+'?where=124,33,131.5,43.2';
/* Taiwan's opening view, which is under the Korea system's box padding and
   well under its threshold — a place the Korea tools must NOT come up. */
const TAIWAN=BASE+'?where=119.9,21.7,122.2,25.5';

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
    note: bar?(bar.querySelector('.train-note')||{}).textContent||'':'',
    chips: bar?bar.querySelectorAll('.train-chip').length:0,
    module: !!window.JMAP_TRAINS,
    kr: typeof JMAP!=='undefined' && !!JMAP.KR_TRAINS,
    tw: typeof JMAP!=='undefined' && !!JMAP.TW_TRAINS,
    stations: document.querySelectorAll('#kr-stations .sta-mark').length,
    shown:[...document.querySelectorAll('#kr-stations .sta-mark')].filter(m=>m.style.display!=='none').length,
    railBox: !!(document.querySelector('#opt-kr-rail')||{}).checked,
  };});

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
    const p=await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({width:1200,height:860});
    const errs=[];
    p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
    const fetched=[];
    p.on('request',r=>{const u=r.url(); if(/trains\.js|kr-trains\.js|tw-trains\.js/.test(u))fetched.push(u.split('/').pop().split('?')[0]);});

    /* ---- 1. the switch over the empire: nothing --------------------- */
    await p.goto(WHOLE,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await setSwitch(p,true);
    await sleep(400);
    let v=await look(p);
    check('on but zoomed out: nothing built', !v.layer && !v.bar, JSON.stringify(v));
    check('on but zoomed out: nothing fetched', fetched.length===0, fetched.join());

    /* ---- 2. the peninsula as the subject builds Korea's tools ------- */
    const on=await p.evaluate(()=>new URL(location.href).searchParams.get('layers')||'');
    await p.goto(KOREA+'&layers='+on,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await sleep(1600);
    v=await look(p);
    check('over Korea: the layer is built', v.layer, JSON.stringify(v));
    check('over Korea: the bar is up', v.bar, JSON.stringify(v));
    check('and it is the Korea data that was fetched',
      fetched.filter(f=>f==='kr-trains.js').length===1 && !fetched.includes('tw-trains.js'), fetched.join());
    check('the bar says which timetable it is', /1938/.test(v.note), v.note);
    /* 42 Korean lines and 32 connecting ones, every one with a chip; the track count is
       bounded rather than pinned because the gap-closing across unplaceable
       stations is the map's business and the data's — a change in either
       shows here as a change in the number. */
    check('a chip per line in the bar', v.chips===74, 'chips='+v.chips);
    check('the track is drawn, hundreds of stretches', v.lines>600, 'lines='+v.lines);
    check('in many colours', v.colours>=20, 'colours='+v.colours);
    const conn=()=>p.evaluate(()=>{
      const a=[...document.querySelectorAll('#train-layer .train-line-approx')];
      return {built:a.length, shown:a.filter(e=>getComputedStyle(e).display!=='none').length,
        box:!!document.querySelector('#train-conn'), boxOn:!!(document.querySelector('#train-conn')||{}).checked,
        chips:[...document.querySelectorAll('.train-chip-conn')].filter(e=>getComputedStyle(e).display!=='none').length};});
    let cv=await conn();
    check('the connections are built but off by default', cv.built>50 && cv.shown===0 && cv.box && !cv.boxOn && cv.chips===0, JSON.stringify(cv));
    await p.click('#train-conn'); await sleep(300);
    cv=await conn();
    check('the switch in the bar shows them, faint, with their chips', cv.shown===cv.built && cv.boxOn && cv.chips>20, JSON.stringify(cv));
    await p.click('#train-conn'); await sleep(300);
    cv=await conn();
    check('and puts them away again', cv.shown===0 && !cv.boxOn, JSON.stringify(cv));
    check('the station squares are borrowed', v.stations>800 && v.railBox,
      JSON.stringify({stations:v.stations,railBox:v.railBox}));
    check('and only those the timetable knows are shown', v.shown>500 && v.shown<v.stations,
      JSON.stringify({stations:v.stations,shown:v.shown}));

    /* ---- 3. the clock and the trains -------------------------------- */
    const t0=(await look(p)).clock;
    await p.click('#train-bar .train-play');
    await sleep(1500);
    let v2=await look(p);
    check('play moves the clock', v2.clock!==t0, t0+' -> '+v2.clock);
    check('trains are on the map', v2.marks>0, 'marks='+v2.marks);
    check('the bar says how many are running', /\d+ running/.test(v2.count), v2.count);
    /* **The reading column is named for the reading this railway uses.**
       `trains.js` was written for Taiwan and headed that column "Pinyin"; the
       bundle names it now — "M–R" for Korea — and a card that said Pinyin over
       McCune–Reischauer would be wrong about what the reader is looking at.
       Asked of a *train's* card, which is the one that lists its calls, and so
       while something is still in the air. */
    const trainHeads=await p.evaluate(()=>{
      const m=[...document.querySelectorAll('#train-marks .train-mark')]
        .find(x=>x.style.display!=='none');
      if(!m) return null;
      const r=m.getBoundingClientRect();
      const ev=n=>m.dispatchEvent(new PointerEvent(n,{bubbles:true,
        clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'mouse'}));
      ev('pointerover'); ev('pointerdown'); ev('pointerup'); ev('click');
      return [...document.querySelectorAll('#info-trains .trains-table th')]
        .map(t=>t.textContent.trim());
    });
    check('  a train\'s card names the reading column for Korea, not Taiwan',
      trainHeads && trainHeads.indexOf('M\u2013R')>=0 && trainHeads.indexOf('Pinyin')<0,
      trainHeads ? trainHeads.join('|') : 'no mark to press');
    await p.click('#train-bar .train-play');

    /* ---- 4. a station answers with its trains ------------------------ */
    const card=await p.evaluate(()=>{
      // Keijō, by its id in kr-stations.js, through the map's own selection
      const el=document.querySelector('[data-id="ke_001"]');
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
    check('Keijō\'s card shows the trains that called', !card.hidden && card.rows>40, JSON.stringify(card));
    check('it says how many and when', /trains called here .* 1938/.test(card.head), card.head);
    check('every row carries its line colour', card.swatches>=card.rows-1,
      card.swatches+' swatches for '+card.rows+' rows');
    check('and links to the printed Korea table for that line',
      /timetable\/korea-1938\.html/.test(card.href)&&/#line-\d+-\d+$/.test(card.href), card.href);
    /* **The line card dates itself from the bundle, not from Taiwan.** The
       head was "counted from the February <year> table", which is Taiwan's
       month; Korea's booklet is dated to the season and says so. */
    const lineHead=await p.evaluate(()=>{
      const t=document.querySelector('#train-layer .train-line');
      if(!t) return null;
      const r=t.getBoundingClientRect();
      const ev=n=>t.dispatchEvent(new PointerEvent(n,{bubbles:true,
        clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'mouse'}));
      ev('pointerover'); ev('pointerdown'); ev('pointerup'); ev('click');
      /* Where several lines run along the same ground the press opens the
         chooser rather than a card — that is the point of the chooser, and for
         a check that wants one line it is one more step. */
      const pick=document.querySelector('#jmap-menu.air-chooser [data-line-pick]');
      if(pick) pick.click();
      const h=document.querySelector('#info-trains .trains-head');
      return h?h.textContent:'';
    });
    check('  a line card is dated from this booklet',
      lineHead!==null && /early 1938/.test(lineHead) && !/February/.test(lineHead),
      String(lineHead));

    /* ---- 5. zooming out takes it away; Taiwan is not Korea ---------- */
    await p.evaluate(()=>{
      for(let i=0;i<8;i++) document.querySelector('#zoom-out').click();});
    await sleep(700);
    v=await look(p);
    check('zoomed out: the layer is gone', !v.layer && !v.bar, JSON.stringify(v));
    check('but the data stays in memory', v.kr && v.module, JSON.stringify(v));
    await p.goto(TAIWAN+'&layers='+on,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await sleep(1600);
    v=await look(p);
    check('over Taiwan the Taiwan tools come up, not Korea\'s',
      v.bar && !/1938/.test(v.note) && fetched.filter(f=>f==='tw-trains.js').length===1,
      JSON.stringify({note:v.note,fetched}));
    check('no page errors', errs.length===0, errs.join(' | '));
    await p.close();

    /* ---- 6. the printed tables ------------------------------------- */
    const tt=await browser.newPage();
    const ttErr=[];
    tt.on('pageerror',e=>ttErr.push(String(e).slice(0,160)));
    await tt.setViewport({width:1200,height:900});
    await tt.goto('http://localhost:8123/timetable/korea-1938.html',{waitUntil:'networkidle0'});
    await sleep(400);
    const page=()=>tt.evaluate(()=>({
      lang:document.documentElement.lang,
      h1:document.querySelector('h1').textContent,
      cols:[...document.querySelectorAll('tr.hd th')].slice(0,2).map(t=>t.textContent),
      readings:document.querySelectorAll('.rd').length,
      first:(()=>{const c=document.querySelector('[data-stn]');
        return c?[c.getAttribute('data-stn'),c.querySelector('.rd').textContent]:null;})(),
      tables:document.querySelectorAll('table').length,
      anchors:document.querySelectorAll('h2[id^="line-"]').length,
      warnFirst:(()=>{const w=document.querySelector('.warn');const t=document.querySelector('table');
        return !!(w&&w.textContent.trim()&&t&&(w.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING));})()}));
    let pv=await page();
    check('the Korea page carries all 173 tables', pv.tables===173 && pv.anchors===173,
      JSON.stringify({t:pv.tables,a:pv.anchors}));
    check('and warns before the tables', pv.warnFirst, '');
    /* It opens in English now; the original's own languages are a press away,
       which is what the next checks press. */
    check('it opens in English', pv.lang==='en' && /Timetable/.test(pv.h1),
      pv.lang+' '+pv.h1);
    await tt.click('#langbar button[data-lang="ja"]');
    await sleep(300);
    pv=await page();
    check('Japanese is a press away', pv.lang==='ja' && /転記/.test(pv.h1), pv.lang+' '+pv.h1);
    check('with the Japanese reading under the station names',
      pv.readings>1000 && pv.first && /^[A-Za-zĀ-ſ'’ -]+$/.test(pv.first[1]),
      JSON.stringify(pv.first)+' of '+pv.readings);
    await tt.click('#langbar button[data-lang="ko"]');
    await sleep(300);
    pv=await page();
    check('Korean gives the hangul', pv.lang==='ko' && /[가-힯]/.test(pv.first[1]),
      JSON.stringify(pv.first));
    await tt.click('#langbar button[data-lang="en"]');
    await sleep(300);
    pv=await page();
    check('English translates the furniture and the headings',
      pv.lang==='en' && /Timetable/.test(pv.h1) && pv.cols.join('|')==='km|Station',
      pv.h1+' / '+pv.cols.join('|'));
    check('and gives McCune-Reischauer under the names', /[A-Za-z]/.test(pv.first[1]), JSON.stringify(pv.first));
    check('no page errors on the timetable', ttErr.length===0, ttErr.join(' | '));
    await tt.close();
  } finally { await browser.close(); }
  console.log('\n'+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
