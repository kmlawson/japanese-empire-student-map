/* The train tools over Manchuria: the July 1942 timetable running over the Manchukuo network.
 *
 *     node tools/test/mntrains.js          # with a server on 8123
 *
 * The Taiwan script (trains.js) proves the mechanism, the Korea one that a second system rides
 * on it, the Karafuto one that the switches come off the registry. This proves the fourth, and
 * what is particular to it:
 *
 *   the ground overlaps Korea's. Manchuria's box holds most of the peninsula, so the rule that
 *   the smallest box round the centre of the view wins is what keeps Korea's tools Korea's.
 *
 *   the track is routed, not traced per stop: the transcription carries no geometry, and every
 *   stretch between placed stops was walked along the map's own line file at build time.
 *
 *   the timetable page is the transcription project's own, dressed: every table's page reference
 *   links its own leaf of the scan, and a CSV goes with every table.
 *
 * The cautions from trains.js apply: shut the Layers dialog before pointing at the map, and shim
 * matchMedia for the mouse.
 */
const { puppeteer, sleep, ready, until, check, report, SHIM, launch, HOST } = require('./suite.js');

const BASE=HOST+'/index.html';
const WHOLE=BASE+'?where=66,-12,180,55';
const MANCHURIA=BASE+'?where=118,38,133,51';
/* Korea's ground, which lies inside Manchuria's box: the smaller box must win. */
const KOREA=BASE+'?where=124,33,131.5,43.2';

const look=p=>p.evaluate(()=>{
  const bar=document.querySelector('#train-bar');
  const lines=document.querySelectorAll('#train-layer .train-line');
  const cols={}; lines.forEach(l=>{const c=l.getAttribute('stroke'); cols[c]=(cols[c]||0)+1;});
  return {
    layer:!!document.querySelector('#train-layer'), bar:!!bar,
    lines:lines.length, colours:Object.keys(cols).length,
    marks:[...document.querySelectorAll('#train-marks .train-mark')].filter(m=>m.style.display!=='none').length,
    clock: bar?bar.querySelector('.train-clock').textContent:'',
    count: bar?bar.querySelector('.train-count').textContent:'',
    note: bar?(bar.querySelector('.train-note')||{}).textContent||'':'',
    chips: bar?bar.querySelectorAll('.train-chip').length:0,
    conn: !!document.querySelector('#train-conn'),
    mn: typeof JMAP!=='undefined' && !!JMAP.MN_TRAINS,
    kr: typeof JMAP!=='undefined' && !!JMAP.KR_TRAINS,
    stations: document.querySelectorAll('#mn-stations .sta-mark').length,
    shown:[...document.querySelectorAll('#mn-stations .sta-mark')].filter(m=>m.style.display!=='none').length,
    railBox: !!(document.querySelector('#opt-mn-rail')||{}).checked,
    staBox: !!(document.querySelector('#opt-mn-stations')||{}).checked,
    staRow: !(document.querySelector('#row-mn-stations')||{}).hidden,
    railDrawn: (()=>{const g=document.getElementById('mn-rail'); return !!g && getComputedStyle(g).display!=='none';})(),
  };});

const setSwitch=async(p,sel,on)=>{
  await p.evaluate((s,v)=>{
    const b=document.querySelector(s);
    if(b&&b.checked!==v){b.checked=v;b.dispatchEvent(new Event('change',{bubbles:true}));}
  },sel,on);
  await sleep(150);
};
const shutDialogs=p=>p.evaluate(()=>{
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());});

(async()=>{
  const browser=await launch();
  try{
    const p=await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({width:1200,height:860});
    const errs=[];
    p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
    const fetched=[];
    p.on('request',r=>{const u=r.url(); if(/(tw|kr|kf|mn)-trains\.js/.test(u))fetched.push(u.split('/').pop().split('?')[0]);});

    /* ---- 1. the switch over the empire: nothing --------------------- */
    await p.goto(WHOLE,{waitUntil:'domcontentloaded'});
    await ready(p);
    await shutDialogs(p);
    await setSwitch(p,'#opt-train-tools',true);
    await sleep(400);
    let v=await look(p);
    check('on but zoomed out: nothing built', !v.layer && !v.bar, JSON.stringify(v));
    check('on but zoomed out: nothing fetched', fetched.length===0, fetched.join());

    /* ---- 2. Manchuria as the subject builds its tools ---------------- */
    const on=await p.evaluate(()=>new URL(location.href).searchParams.get('layers')||'');
    await p.goto(MANCHURIA+'&layers='+on,{waitUntil:'domcontentloaded'});
    await ready(p);
    await shutDialogs(p);
    await sleep(1500);
    v=await look(p);
    check('over Manchuria: the layer is built', v.layer, JSON.stringify(v));
    check('over Manchuria: the bar is up', v.bar, JSON.stringify(v));
    check('and it is the Manchuria data that was fetched',
      fetched.filter(f=>f==='mn-trains.js').length===1
      && !fetched.includes('kr-trains.js') && !fetched.includes('tw-trains.js'), fetched.join());
    check('the bar says which timetable it is', /1942/.test(v.note), v.note);
    check('a chip per line in the bar', v.chips===54, 'chips='+v.chips);
    check('no connections switch: every line is the network’s own', !v.conn, '');
    /* 692 stretches between placed stops, 663 of them routed along the line file; the rest
       are on lines not yet traced and are drawn straight where the stops are close. */
    check('the track is drawn, hundreds of stretches', v.lines>600, 'lines='+v.lines);
    check('in many colours', v.colours>40, 'colours='+v.colours);
    /* the group itself gives way to the tools' own track while they are up; see railFade */
    check('the railway is borrowed', v.railBox, JSON.stringify({railBox:v.railBox}));
    check('  but the station squares are left as the reader had them',
      !v.staBox && v.stations===0, JSON.stringify({staBox:v.staBox,stations:v.stations}));
    check('  and the row for them is offered', v.staRow, JSON.stringify({staRow:v.staRow}));

    await setSwitch(p,'#opt-mn-stations',true);
    await sleep(1500);
    let sv=await look(p);
    check('  and the reader can turn the squares on', sv.stations===614 && sv.staBox,
      JSON.stringify({stations:sv.stations,staBox:sv.staBox}));
    check('  every one of them known to the timetable, so every one shown',
      sv.shown===sv.stations, JSON.stringify({shown:sv.shown,stations:sv.stations}));
    const boxes=await p.evaluate(()=>({
      mn:!!(document.querySelector('#opt-mn-rail')||{}).checked,
      kf:!!(document.querySelector('#opt-kf-rail')||{}).checked,
      kr:!!(document.querySelector('#opt-kr-rail')||{}).checked,
      tw:!!(document.querySelector('#opt-tw-rail')||{}).checked}));
    check('  and Manchuria’s railway box is the one ticked',
      boxes.mn && !boxes.kr && !boxes.tw && !boxes.kf, JSON.stringify(boxes));

    /* ---- 3. the clock and the trains -------------------------------- */
    const t0=(await look(p)).clock;
    await p.click('#train-bar .train-play');
    await sleep(1500);
    let v2=await look(p);
    check('play moves the clock', v2.clock!==t0, t0+' -> '+v2.clock);
    check('the bar says how many are running', /\d+ running/.test(v2.count), v2.count);
    await sleep(2500);
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
    check('a train’s card names the reading column for Manchuria: Pinyin',
      trainHeads && trainHeads.indexOf('Pinyin')>=0,
      trainHeads ? trainHeads.join('|') : 'no mark to press');
    await p.click('#train-bar .train-play');
    await sleep(500);

    /* ---- 4. a station answers with its trains ----------------------- */
    const card=await p.evaluate(()=>{
      // Hōten (Mukden), where the trunk, the 安奉線 and the 奉吉線 meet
      const rec=(JMAP.MN_STATIONS||[]).find(s=>s.han==='奉天');
      const el=rec && document.querySelector('[data-id="'+rec.id+'"]');
      if(!el) return {no:'no mark', id: rec && rec.id};
      const r=el.getBoundingClientRect();
      const ev=n=>el.dispatchEvent(new PointerEvent(n,{bubbles:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'mouse'}));
      ev('pointerover'); ev('pointerdown'); ev('pointerup'); ev('click');
      const host=document.querySelector('#info-trains');
      const link=host.querySelector('a');
      const info=document.querySelector('#info');
      return {hidden:host.hidden, rows:host.querySelectorAll('.trains-table tr').length,
              head:(host.querySelector('.trains-head')||{}).textContent||'',
              href:link?link.getAttribute('href'):'',
              text:(info?info.textContent:'').replace(/\s+/g,' ')};
    });
    check('Hōten’s card shows the trains that called', !card.hidden && card.rows>40, JSON.stringify({rows:card.rows,head:card.head,no:card.no}));
    check('it says how many and when', /trains called here .* 1942/.test(card.head), card.head);
    check('and links to the printed Manchuria table for that line',
      /timetable\/manchuria-1942\.html(\?[^#]*)?#p\d+/.test(card.href), card.href);
    check('the card carries the pinyin and the name today',
      /Hōten/.test(card.text) && /Fèngtiān|沈阳/.test(card.text),
      card.text.slice(0,200));

    /* ---- 5. the layer code carries the two switches home ------------- */
    const code=await p.evaluate(()=>new URL(location.href).searchParams.get('layers')||'');
    await p.goto(MANCHURIA+'&layers='+code,{waitUntil:'domcontentloaded'});
    await ready(p);
    await shutDialogs(p);
    await sleep(1500);
    const back=await look(p);
    check('a link made here comes back with the railway and its squares on',
      back.railBox && back.staBox && back.stations===614,
      JSON.stringify({code:code,railBox:back.railBox,staBox:back.staBox,stations:back.stations}));

    /* ---- 6. zooming out takes it away; Korea is not Manchuria -------- */
    await p.evaluate(()=>{
      for(let i=0;i<8;i++) document.querySelector('#zoom-out').click();});
    await sleep(800);
    v=await look(p);
    check('zoomed out: the layer is gone', !v.layer && !v.bar, JSON.stringify(v));
    check('but the data stays in memory', v.mn, JSON.stringify(v));

    await p.goto(KOREA+'&layers='+code,{waitUntil:'domcontentloaded'});
    await ready(p);
    await shutDialogs(p);
    await sleep(1500);
    v=await look(p);
    check('over Korea the Korea tools come up, not Manchuria’s: the smaller box wins',
      v.bar && v.kr && fetched.includes('kr-trains.js') && /1938/.test(v.note),
      JSON.stringify({bar:v.bar,kr:v.kr,note:v.note,fetched:fetched.join()}));
    check('no page errors', errs.length===0, errs.join(' | '));

    /* ---- 7. the printed page ---------------------------------------- */
    const ttErr=[];
    const q=await browser.newPage();
    q.on('pageerror',e=>ttErr.push(String(e).slice(0,200)));
    await q.goto(HOST+'/timetable/manchuria-1942.html',{waitUntil:'networkidle0'});
    const pv=await q.evaluate(()=>{
      const h2=[...document.querySelectorAll('h2[data-dir]')];
      const pg=[...document.querySelectorAll('p.pg a')];
      return {tables:document.querySelectorAll('h2[id]').length, anchors:h2.filter(h=>h.id).length,
              lang:document.documentElement.lang, h1:document.querySelector('h1').textContent,
              warnFirst:!!document.querySelector('.warn'),
              archive:!![...document.querySelectorAll('header a')].find(a=>/archive\.org/.test(a.href)),
              map:!![...document.querySelectorAll('header a')].find(a=>/index\.html$/.test(a.href)),
              pgLinks:pg.length, firstLeaf:pg[0]?pg[0].getAttribute('href'):'',
              csv:document.querySelectorAll('a.dl').length,
              readings:document.querySelectorAll('td .rd').length,
              readSample:(document.querySelector('td[data-stn="大連"] .rd')||{}).textContent||''};
    });
    /* 132 tables on the page; 130 are railway lines and carry the line and direction the
       map links to, and two are the 河北・營口 ferry, which is printed and not drawn */
    check('the Manchuria page carries all 132 tables, 130 of them a line’s', pv.tables===132 && pv.anchors===130,
      JSON.stringify({tables:pv.tables,anchors:pv.anchors}));
    check('and warns before the tables', pv.warnFirst, '');
    check('it opens in English furniture, the tables in the characters the sheet prints',
      pv.lang==='en' && pv.h1==='Manchuria' && pv.readSample==='Dairen', pv.lang+' '+pv.h1);
    check('with links to the map and the original', pv.archive && pv.map, JSON.stringify(pv));
    check('every table’s page reference links its own leaf of the scan',
      pv.pgLinks===132 && /manshu-shina-kisha-jikanhyo-1942\.7\/page\/n14$/.test(pv.firstLeaf),
      JSON.stringify({pgLinks:pv.pgLinks,firstLeaf:pv.firstLeaf}));
    check('a CSV under every table', pv.csv===132, 'csv='+pv.csv);
    check('a reading under the station names, romaji in English',
      pv.readings>1000 && pv.readSample==='Dairen', JSON.stringify({readings:pv.readings,sample:pv.readSample}));
    const ja=await q.evaluate(()=>{
      document.querySelector('#bar button[data-lang="ja"]').click();
      return new Promise(r=>setTimeout(()=>r({
        sample:(document.querySelector('td[data-stn="大連"] .rd')||{}).textContent||'',
        pg:(document.querySelector('p.pg')||{}).textContent||''}),50));});
    check('and kana on the Japanese page', /だいれん/.test(ja.sample) && /原本/.test(ja.pg), JSON.stringify(ja));
    check('no page errors on the timetable', ttErr.length===0, ttErr.join(' | '));
    await q.close();

    /* ---- 8. how far out the tools come up: 15 on, 16.5 off ----------- */
    console.log('\n— how far out the tools come up —');
    for (const [span, where, want] of [
      [13, '118,38,133,51', true],
      [14.5, '117,37,134,51.5', true],
      [18, '115,35,136,53', false],
    ]) {
      const r = await browser.newPage();
      await r.evaluateOnNewDocument(SHIM);
      await r.setViewport({ width: 1300, height: 950 });
      await r.goto(BASE + '?where=' + where, { waitUntil: 'domcontentloaded' });
      await ready(r);
      await shutDialogs(r);
      await setSwitch(r, '#opt-train-tools', true);
      await sleep(4200);
      const up = await r.evaluate(() => ({
        bar: !!document.querySelector('#train-bar'),
        note: (document.querySelector('.train-note') || {}).textContent || '',
      }));
      check('at about ' + span + '° of latitude the tools are '
              + (want ? 'up' : 'away'),
        up.bar === want && (!want || /1942/.test(up.note)),
        JSON.stringify(up));
      await r.close();
    }

  } finally { await browser.close(); }
  process.exit(report());
})();
