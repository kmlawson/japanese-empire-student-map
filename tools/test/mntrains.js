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
    connOn: !!(document.querySelector('#train-conn')||{}).checked,
    connChips: document.querySelectorAll('.train-chip-conn').length,
    connLines: (()=>{const g=document.getElementById('train-layer');
      return g?g.classList.contains('conn-off'):null;})(),
    mn: typeof JMAP!=='undefined' && !!JMAP.MN_TRAINS,
    kr: typeof JMAP!=='undefined' && !!JMAP.KR_TRAINS,
    stations: +((document.querySelector('#mn-stations .sta-pic-fill')||{getAttribute:()=>0}).getAttribute('data-total')),
    shown:+((document.querySelector('#mn-stations .sta-pic-fill')||{getAttribute:()=>0}).getAttribute('data-n')),
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
    /* 55 lines in the tables less the 北票線, kept off the map until it is
       traced, and then the 50 beyond Manchuria: the same booklet prints
       Korea's railway from page 54 and Japan's from page 84, and those are
       read as connections. 53 + 50. */
    check('a chip per line in the bar', v.chips===103, 'chips='+v.chips);
    check('  of which 50 are beyond the network', v.connChips===50,
      'conn chips='+v.connChips);
    check('the connections switch is offered', v.conn, '');
    check('  and it is off to begin with', !v.connOn, '');
    check('  so the layer is drawn without them', v.connLines===true, '');

    /* **AND SWITCHING THEM ON PUTS TRACK OVER KOREA AND JAPAN.**
       The booklet is 滿洲・支那汽車時間表 and the Manchurian section is only
       its first forty pages: Korea's railway is printed from page 54 and
       Japan's from 84, over stations this map already has. The test that
       matters is not that the chips appear but that the *track* does, a long
       way from Manchuria — so the layer's own box is measured with the switch
       off and again with it on. Kyūshū is some 1,500 km south of Shinkyō, so
       the box has to grow by a great deal rather than by a margin. */
    /* **Count what is drawn, not what is built.** `trains.js` builds every
       stretch and hides the connections with a class on the layer, so
       `.train-line` is 1,429 either way and an element count proves nothing.
       `getBBox` does respect `display:none`, so the layer's own box is the
       honest measure — and it is in map units, so it does not move with the
       zoom the test happens to be at. */
    const box = pg => pg.evaluate(() => {
      const g = document.getElementById('train-layer');
      if (!g) return null;
      const b = g.getBBox();
      return { w: b.width, h: b.height, area: b.width * b.height,
               n: [...g.querySelectorAll('.train-line')]
                    .filter(e => getComputedStyle(e).display !== 'none').length };
    });
    const shut = await box(p);
    await setSwitch(p, '#train-conn', true);
    await sleep(1200);
    const open = await box(p);
    const vc = await look(p);
    check('switching the connections on draws them',
      vc.connOn && vc.connLines === false, JSON.stringify({on:vc.connOn, off:vc.connLines}));
    check('  many more stretches of track drawn', open.n > shut.n * 1.4,
      shut.n + ' \u2192 ' + open.n + ' drawn');
    /* Japan lies east and south of Manchuria, and on this projection it is the
       width that shows it most: the box goes 333 to 524 across and 415 to 499
       down. Area rather than either alone, so the check does not depend on
       which way the projection happens to spread them. */
    check('  reaching well beyond Manchuria', open.area > shut.area * 1.4,
      'layer box ' + shut.w.toFixed(0) + '\u00d7' + shut.h.toFixed(0)
      + ' \u2192 ' + open.w.toFixed(0) + '\u00d7' + open.h.toFixed(0));
    await setSwitch(p, '#train-conn', false);
    await sleep(1200);
    const again = await box(p);
    /* **The link under a connection line has to land on its own table.**
       `cfg.page` in trains.js is one page per system — Manchuria's — and the
       booklet's Korean and Japanese sections are dressed as pages of their
       own. A line carrying an anchor into a file that does not contain it
       gives the reader a promise and a wrong page, which is worse than no
       link, so every anchor is fetched and looked for. */
    const links = await p.evaluate(async () => {
      const d = JMAP.MN_TRAINS, want = {}, out = { lines: 0, noPage: [], missing: [] };
      d.lines.forEach(l => {
        if (!l.x) return;
        out.lines++;
        if (!l.pg || !l.a) { out.noPage.push(l.n); return; }
        (want[l.pg] = want[l.pg] || []).push(l.a);
      });
      for (const pg of Object.keys(want)) {
        let txt = '';
        // the page doing the fetching is deploy/index.html, so the path is
        // already relative to deploy/ — and a 404 does not throw, so the
        // status is checked rather than the body being trusted
        try {
          const r = await fetch(pg);
          txt = r.ok ? await r.text() : '';
        } catch (e) { txt = ''; }
        if (!txt) { out.missing.push(pg + ' (not fetched)'); continue; }
        want[pg].forEach(a => {
          if (txt.indexOf('id="' + a + '"') < 0) out.missing.push(pg + '#' + a);
        });
      }
      out.pages = Object.keys(want);
      return out;
    });
    check('every connection line names a printed table',
      links.lines === 50 && links.noPage.length === 0,
      links.lines + ' lines, without a page: ' + (links.noPage.join(', ') || 'none'));
    check('  on the two pages the other sections were dressed onto',
      links.pages.length === 2, links.pages.join(', '));
    check('  and every anchor is really in the page it names',
      links.missing.length === 0, links.missing.slice(0, 5).join(', ') || 'all found');

    check('  and back to Manchuria alone when it is switched off',
      Math.abs(again.area - shut.area) < 1 && again.n === shut.n,
      again.n + ' drawn, box ' + again.w.toFixed(0) + '\u00d7' + again.h.toFixed(0));
    /* 692 stretches between placed stops, 663 of them routed along the line file; the rest
       are on lines not yet traced and are drawn straight where the stops are close. */
    check('the track is drawn, hundreds of stretches', v.lines>600, 'lines='+v.lines);
    check('in many colours', v.colours>=40, 'colours='+v.colours);
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
    /* two of the 614 stand only on the 北票線, which is kept off the map until traced */
    check('  every one of them known to the timetable is shown, all but the two on the hidden line',
      sv.shown===sv.stations-2, JSON.stringify({shown:sv.shown,stations:sv.stations}));
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
    /* 132 tables on the page; 128 are railway lines and carry the line and direction the
       map links to; two are the 河北・營口 ferry and two the 北票線, printed and not drawn */
    check('the Manchuria page carries all 132 tables, 128 of them a line’s', pv.tables===132 && pv.anchors===128,
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

    /* ---- 8. a line answers by name with the tools down ---------------- */
    console.log('\n— a pressed line, with the tools down —');
    {
      const r = await browser.newPage();
      await r.evaluateOnNewDocument(SHIM);
      await r.setViewport({ width: 1300, height: 950 });
      const rErr = []; r.on('pageerror', e => rErr.push(String(e).slice(0, 200)));
      await r.goto(BASE + '?where=115,35,136,53', { waitUntil: 'domcontentloaded' });
      await ready(r);
      await shutDialogs(r);
      await r.evaluate(() => {
        const y = [...document.querySelectorAll('button')].find(b => /Dec 1942/.test(b.textContent));
        if (y) y.click();
      });
      await setSwitch(r, '#opt-mn-rail', true);
      await sleep(1500);
      const card = await r.evaluate(() => {
        const hit = [...document.querySelectorAll('#mn-rail .rail-hit')]
          .find(h => h.getAttribute('data-name') === '滿鐵社線 連京線');
        if (!hit) return { no: 'no hit band' };
        const pt = hit.getPointAtLength(hit.getTotalLength() / 2);
        const m = hit.getScreenCTM();
        const x = m.a * pt.x + m.c * pt.y + m.e, y = m.b * pt.x + m.d * pt.y + m.f;
        const ev = n => hit.dispatchEvent(new PointerEvent(n, { bubbles: true, clientX: x, clientY: y, pointerType: 'mouse' }));
        ev('pointerover'); ev('pointerdown'); ev('pointerup'); ev('click');
        const info = document.querySelector('#info');
        const btn = [...document.querySelectorAll('#info-trains button')].map(b => b.textContent);
        return { hidden: info.hidden, chip: info.querySelector('.chip').textContent,
                 primary: info.querySelector('.primary').textContent,
                 alt: info.querySelector('.alt').textContent, buttons: btn,
                 tools: !!document.querySelector('#train-bar') };
      });
      check('pressing the 連京線 opens a card for the line, not the network',
        !card.hidden && card.chip === 'Railway line' && card.primary === 'Renkyō-sen',
        JSON.stringify(card));
      check('  with the characters and the pinyin name under it',
        /連京線/.test(card.alt) && /Lianjing Line/.test(card.alt), card.alt);
      check('  and a Turn on Train Tools button, though the view is too wide for them',
        card.buttons.indexOf('Turn on Train Tools') >= 0 && !card.tools, JSON.stringify(card.buttons));
      await r.evaluate(() => {
        [...document.querySelectorAll('#info-trains button')]
          .find(b => b.textContent === 'Turn on Train Tools').click();
      });
      await sleep(4500);
      const up = await r.evaluate(() => ({
        bar: !!document.querySelector('#train-bar'),
        note: (document.querySelector('.train-note') || {}).textContent || '',
        span: (() => { const u = new URL(location.href).searchParams.get('where') || ''; const n = u.split(',').map(Number); return n.length === 4 ? n[3] - n[1] : 0; })(),
      }));
      check('  pressing it flies to the network and puts the tools up',
        up.bar && /1942/.test(up.note) && up.span < 16, JSON.stringify(up));
      check('  no page errors', rErr.length === 0, rErr.join(' | '));
      await r.close();
    }

    /* ---- 9. two boxes hold the centre: the one it is deepest in wins ---- */
    console.log('\n— over the border country —');
    for (const [name, where, want] of [
      ['Hōten', '120.4,38.8,126.4,44.8', '1942'],
      ['Kirin', '123.5,40.8,129.5,46.8', '1942'],
      ['P\u2019yŏngyang', '122.75,36,128.75,42', '1938'],
    ]) {
      const r = await browser.newPage();
      await r.evaluateOnNewDocument(SHIM);
      await r.setViewport({ width: 1300, height: 950 });
      await r.goto(BASE + '?where=' + where, { waitUntil: 'domcontentloaded' });
      await ready(r);
      await shutDialogs(r);
      await setSwitch(r, '#opt-train-tools', true);
      // waited on, not slept through: the bar is the side effect read below,
      // and where it must *not* come the wait runs out at the old sleep's length
      await until(r, () => !!document.querySelector('#train-bar'), null, { timeout: 4200 }).catch(() => {});
      await sleep(300);
      const up = await r.evaluate(() => ({
        bar: !!document.querySelector('#train-bar'),
        note: (document.querySelector('.train-note') || {}).textContent || '',
      }));
      check('centred on ' + name + ' the tools are the ' + want + ' timetable\u2019s',
        up.bar && up.note.indexOf(want) >= 0, JSON.stringify(up));
      await r.close();
    }

    /* ---- 10. the button asks which, and panning does not switch ------- */
    console.log('\n— the button over the border country, and panning —');
    {
      const r = await browser.newPage();
      await r.evaluateOnNewDocument(SHIM);
      await r.setViewport({ width: 1300, height: 950 });
      const rErr = []; r.on('pageerror', e => rErr.push(String(e).slice(0, 200)));
      // over Hōten, tools off: both Korea's and Manchuria's boxes are in view
      await r.goto(BASE + '?where=120.4,38.8,126.4,44.8', { waitUntil: 'domcontentloaded' });
      await ready(r);
      await shutDialogs(r);
      // the button is only offered over a drawn railway, and the menu only
      // when two drawn networks are in the frame: Korea's and Manchuria's
      // both run through this one -- on the 1942 map, where Manchuria's is drawn
      await r.evaluate(() => { const y = [...document.querySelectorAll('button')].find(b => /Dec 1942/.test(b.textContent)); if (y) y.click(); });
      await sleep(600);
      await setSwitch(r, '#opt-mn-rail', true);
      await setSwitch(r, '#opt-kr-rail', true);
      await sleep(800);
      const menu = await r.evaluate(() => {
        const b = document.querySelector('#btn-trains');
        const offered = !!b && !b.hidden;
        if (b) b.click();
        const m = document.querySelector('#train-menu');
        return { offered, shown: !!m && !m.hidden, rows: m ? [...m.querySelectorAll('input[data-train-sys]')].map(i => i.getAttribute('data-train-sys')) : [],
                 bar: !!document.querySelector('#train-bar'), box: !!document.querySelector('#opt-train-tools').checked };
      });
      check('pressing the train button with two networks in view opens a menu, not the tools',
        menu.offered && menu.shown && menu.rows.length === 2 && menu.rows.indexOf('mn') >= 0 && menu.rows.indexOf('kr') >= 0
        && !menu.bar && !menu.box, JSON.stringify(menu));
      await r.evaluate(() => { document.querySelector('#train-menu input[data-train-sys="mn"]').click(); });
      await sleep(4500);
      let up = await r.evaluate(() => ({
        bar: !!document.querySelector('#train-bar'), menu: !(document.querySelector('#train-menu') || { hidden: true }).hidden,
        note: (document.querySelector('.train-note') || {}).textContent || '' }));
      check('  choosing Manchuria closes the menu and puts its tools up', up.bar && !up.menu && /1942/.test(up.note), JSON.stringify(up));
      // pan south-east by a screen and a half: the centre is now over Korea, but Manchuria is still in view
      const drag = async (dx, dy) => {
        await r.mouse.move(650, 700); await r.mouse.down();
        for (let i = 1; i <= 10; i++) { await r.mouse.move(650 + dx * i / 10, 700 + dy * i / 10); await sleep(20); }
        await r.mouse.up(); await sleep(300);
      };
      await drag(-300, -500);
      await drag(-300, -500);
      await sleep(1500);
      up = await r.evaluate(() => ({ bar: !!document.querySelector('#train-bar'),
        note: (document.querySelector('.train-note') || {}).textContent || '',
        c: (() => { const w = (new URL(location.href).searchParams.get('where') || '').split(',').map(Number); return w.length === 4 ? [(w[0] + w[2]) / 2, (w[1] + w[3]) / 2] : null; })() }));
      check('  panned over Korea with Manchuria still in view: still Manchuria’s tools, not Korea’s',
        up.bar && /1942/.test(up.note) && up.c && up.c[1] < 43, JSON.stringify(up));
      // and clear of it altogether: the tools go off, switch and all
      for (let i = 0; i < 6; i++) await drag(-500, -600);
      await sleep(1500);
      up = await r.evaluate(() => ({ bar: !!document.querySelector('#train-bar'), box: !!document.querySelector('#opt-train-tools').checked,
        c: (() => { const w = (new URL(location.href).searchParams.get('where') || '').split(',').map(Number); return w.length === 4 ? [(w[0] + w[2]) / 2, (w[1] + w[3]) / 2] : null; })() }));
      check('  panned clear of the network: the tools are off, switch and all', !up.bar && !up.box, JSON.stringify(up));
      check('  no page errors', rErr.length === 0, rErr.join(' | '));
      await r.close();
    }

    /* ---- 11. the station button offers one network's squares at a time --- */
    console.log('\n— the station menu —');
    {
      const r = await browser.newPage();
      await r.evaluateOnNewDocument(SHIM);
      await r.setViewport({ width: 1300, height: 950 });
      const rErr = []; r.on('pageerror', e => rErr.push(String(e).slice(0, 200)));
      await r.goto(BASE + '?where=118,38,133,51', { waitUntil: 'domcontentloaded' });
      await ready(r);
      await shutDialogs(r);
      await r.evaluate(() => { const y = [...document.querySelectorAll('button')].find(b => /Dec 1942/.test(b.textContent)); if (y) y.click(); });
      await setSwitch(r, '#opt-mn-rail', true);
      await sleep(800);
      const menu = await r.evaluate(() => {
        const b = document.querySelector('#btn-stations'); const offered = !!b && !b.hidden; if (b) b.click();
        const m = document.querySelector('#station-menu');
        return { offered, shown: !!m && !m.hidden,
                 rows: m ? [...m.querySelectorAll('input[data-station-sys]')].map(i => i.getAttribute('data-station-sys') + (i.checked ? '*' : '')) : [],
                 radio: m ? [...m.querySelectorAll('input')].every(i => i.type === 'radio') : false };
      });
      check('the station button opens a menu of radio rows, one per network and None',
        menu.offered && menu.shown && menu.radio && menu.rows.length === 6 && menu.rows.indexOf('*') >= 0, JSON.stringify(menu));
      await r.evaluate(() => document.querySelector('#station-menu input[data-station-sys="mn"]').click());
      await sleep(1500);
      let sq = await r.evaluate(() => ({ mn: +((document.querySelector('#mn-stations .sta-pic-fill')||{getAttribute:()=>0}).getAttribute('data-total')), box: document.querySelector('#opt-mn-stations').checked }));
      check('  choosing Manchuria draws its squares', sq.mn === 614 && sq.box, JSON.stringify(sq));
      await r.evaluate(() => { document.querySelector('#btn-stations').click(); });
      await sleep(300);
      await r.evaluate(() => document.querySelector('#station-menu input[data-station-sys="kr"]').click());
      await sleep(1500);
      sq = await r.evaluate(() => ({
        mnShown: (e=>e&&e.getBoundingClientRect().width>0?+e.getAttribute('data-n'):0)(document.querySelector('#mn-stations .sta-pic-fill')),
        mnBox: document.querySelector('#opt-mn-stations').checked, krBox: document.querySelector('#opt-kr-stations').checked,
        krRail: document.querySelector('#opt-kr-rail').checked, kr: +((document.querySelector('#kr-stations .sta-pic-fill')||{getAttribute:()=>0}).getAttribute('data-total')) }));
      check('  choosing Korea puts Manchuria’s away and switches Korea’s railway on with its squares',
        sq.mnShown === 0 && !sq.mnBox && sq.krBox && sq.krRail && sq.kr > 800, JSON.stringify(sq));
      // and the panel keeps the same rule
      await setSwitch(r, '#opt-mn-stations', true);
      await sleep(800);
      sq = await r.evaluate(() => ({ mnBox: document.querySelector('#opt-mn-stations').checked, krBox: document.querySelector('#opt-kr-stations').checked }));
      check('  ticking Manchuria’s in the panel unticks Korea’s', sq.mnBox && !sq.krBox, JSON.stringify(sq));
      check('  no page errors', rErr.length === 0, rErr.join(' | '));
      await r.close();
    }

    /* ---- 12. how far out the tools come up: 15 on, 16.5 off ----------- */
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
      // waited on, not slept through: the bar is the side effect read below,
      // and where it must *not* come the wait runs out at the old sleep's length
      await until(r, () => !!document.querySelector('#train-bar'), null, { timeout: 4200 }).catch(() => {});
      await sleep(300);
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
