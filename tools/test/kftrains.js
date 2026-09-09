/* The train tools over Karafuto: the April 1935 timetable running over southern Sakhalin.
 *
 *     node tools/test/kftrains.js          # with a server on 8123
 *
 * The Taiwan script (trains.js) proves the mechanism and the Korea one (krtrains.js) proves that a
 * second system rides on it. This proves the third, and two things that are new with it:
 *
 *   the switches are wired off the registry, not off a list of two. Both the Layers panel and the
 *   button beside the map used to name Taiwan's box and Korea's in so many words, so Karafuto's
 *   switch ticked Korea's box and drew nothing.
 *
 *   the railway and the stations ride in the *arithmetic* half of the layer code. Bits 25 to 28
 *   are Taiwan's and Korea's and bit 29 is the tools; bit 30 is where the low field ends, so
 *   Karafuto's two are places in `hi` and a link has to carry them home.
 *
 * The cautions from trains.js apply: shut the Layers dialog before pointing at the map, and shim
 * matchMedia for the mouse.
 */
const { puppeteer, sleep, ready, until, check, report, SHIM, launch } = require('./suite.js');

const BASE='http://localhost:8123/index.html';
const WHOLE=BASE+'?where=66,-12,180,55';
const KARAFUTO=BASE+'?where=141.4,45.8,145.1,50.2';
/* Korea's ground, which is nowhere near Karafuto's box: the wrong system must not come up. */
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
    kf: typeof JMAP!=='undefined' && !!JMAP.KF_TRAINS,
    kr: typeof JMAP!=='undefined' && !!JMAP.KR_TRAINS,
    stations: document.querySelectorAll('#kf-stations .sta-mark').length,
    shown:[...document.querySelectorAll('#kf-stations .sta-mark')].filter(m=>m.style.display!=='none').length,
    railBox: !!(document.querySelector('#opt-kf-rail')||{}).checked,
    staBox: !!(document.querySelector('#opt-kf-stations')||{}).checked,
    staRow: !(document.querySelector('#row-kf-stations')||{}).hidden,
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
    p.on('request',r=>{const u=r.url(); if(/(tw|kr|kf)-trains\.js/.test(u))fetched.push(u.split('/').pop().split('?')[0]);});

    /* ---- 1. the switch over the empire: nothing --------------------- */
    await p.goto(WHOLE,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await setSwitch(p,'#opt-train-tools',true);
    await sleep(400);
    let v=await look(p);
    check('on but zoomed out: nothing built', !v.layer && !v.bar, JSON.stringify(v));
    check('on but zoomed out: nothing fetched', fetched.length===0, fetched.join());

    /* ---- 2. the island as the subject builds Karafuto's tools -------- */
    const on=await p.evaluate(()=>new URL(location.href).searchParams.get('layers')||'');
    await p.goto(KARAFUTO+'&layers='+on,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await sleep(1800);
    v=await look(p);
    check('over Karafuto: the layer is built', v.layer, JSON.stringify(v));
    check('over Karafuto: the bar is up', v.bar, JSON.stringify(v));
    check('and it is the Karafuto data that was fetched',
      fetched.filter(f=>f==='kf-trains.js').length===1
      && !fetched.includes('kr-trains.js') && !fetched.includes('tw-trains.js'), fetched.join());
    check('the bar says which timetable it is', /1935/.test(v.note), v.note);
    check('a chip per line in the bar', v.chips===7, 'chips='+v.chips);
    /* 97 stations in a chain with three branches: 96 stretches of track, every one of them
       traced along the line file rather than drawn straight. */
    check('the track is drawn, one stretch per pair of stops', v.lines===96, 'lines='+v.lines);
    check('in the seven colours of the seven lines', v.colours===7, 'colours='+v.colours);
    check('the railway is borrowed', v.railBox, JSON.stringify({railBox:v.railBox}));
    check('  but the station squares are left as the reader had them',
      !v.staBox && v.stations===0, JSON.stringify({staBox:v.staBox,stations:v.stations}));
    check('  and the row for them is offered', v.staRow, JSON.stringify({staRow:v.staRow}));

    /* **The switch is Karafuto's own.** This is what the two-way ternary got wrong: with a third
       system the button ticked Korea's box for Karafuto's flag. */
    await setSwitch(p,'#opt-kf-stations',true);
    await sleep(1200);
    let sv=await look(p);
    check('  and the reader can turn the squares on', sv.stations===97 && sv.staBox,
      JSON.stringify({stations:sv.stations,staBox:sv.staBox}));
    check('  every one of them known to the timetable, so every one shown',
      sv.shown===97, JSON.stringify({shown:sv.shown,stations:sv.stations}));
    const boxes=await p.evaluate(()=>({
      kf:!!(document.querySelector('#opt-kf-rail')||{}).checked,
      kr:!!(document.querySelector('#opt-kr-rail')||{}).checked,
      tw:!!(document.querySelector('#opt-tw-rail')||{}).checked}));
    check('  and Karafuto’s railway box is the one ticked, not Korea’s',
      boxes.kf && !boxes.kr && !boxes.tw, JSON.stringify(boxes));

    /* ---- 3. the clock and the trains -------------------------------- */
    const t0=(await look(p)).clock;
    await p.click('#train-bar .train-play');
    await sleep(1500);
    let v2=await look(p);
    check('play moves the clock', v2.clock!==t0, t0+' -> '+v2.clock);
    check('the bar says how many are running', /\d+ running/.test(v2.count), v2.count);

    /* **The reading column is named for the reading this railway uses.** Not Pinyin and not
       M–R: Karafuto's second name is the Russian one. Asked of a train's card, which is the one
       that lists its calls, and so while something is still in the air. */
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
    check('a train\u2019s card names the reading column for Karafuto',
      trainHeads && trainHeads.indexOf('Russian')>=0 && trainHeads.indexOf('Pinyin')<0,
      trainHeads ? trainHeads.join('|') : 'no mark to press');
    await p.click('#train-bar .train-play');
    await sleep(500);

    /* ---- 4. a station answers with its trains ----------------------- */
    const card=await p.evaluate(()=>{
      // Toyohara, the capital and the junction of three lines, by its id in kf-stations.js
      const el=document.querySelector('[data-id="kfs013"]');
      if(!el) return {no:'no mark'};
      const r=el.getBoundingClientRect();
      const ev=n=>el.dispatchEvent(new PointerEvent(n,{bubbles:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'mouse'}));
      ev('pointerover'); ev('pointerdown'); ev('pointerup'); ev('click');
      const host=document.querySelector('#info-trains');
      const link=host.querySelector('a');
      const info=document.querySelector('#info');
      return {hidden:host.hidden, rows:host.querySelectorAll('.trains-table tr').length,
              head:(host.querySelector('.trains-head')||{}).textContent||'',
              cols:[...host.querySelectorAll('.trains-table th')].map(t=>t.textContent),
              href:link?link.getAttribute('href'):'',
              text:(info?info.textContent:'').replace(/\s+/g,' ')};
    });
    check('Toyohara’s card shows the trains that called', !card.hidden && card.rows>20, JSON.stringify({rows:card.rows,head:card.head}));
    check('it says how many and when', /trains called here .* 1935/.test(card.head), card.head);
    check('and links to the printed Karafuto table for that line',
      /timetable\/karafuto-1935\.html/.test(card.href) && /#line-\d+$/.test(card.href), card.href);
    check('the card carries the Russian name of the place',
      /Toyohara/.test(card.text) && /Журавлево|Yuzhno|Южно/.test(card.text),
      card.text.slice(0,200));

    /* ---- 5. the layer code carries the two switches home ------------- */
    const code=await p.evaluate(()=>new URL(location.href).searchParams.get('layers')||'');
    await p.goto(KARAFUTO+'&layers='+code,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await sleep(1500);
    const back=await look(p);
    check('a link made here comes back with the railway and its squares on',
      back.railBox && back.staBox && back.stations===97,
      JSON.stringify({code:code,railBox:back.railBox,staBox:back.staBox,stations:back.stations}));

    /* ---- 6. zooming out takes it away; Korea is not Karafuto --------- */
    await p.evaluate(()=>{
      for(let i=0;i<8;i++) document.querySelector('#zoom-out').click();});
    await sleep(800);
    v=await look(p);
    check('zoomed out: the layer is gone', !v.layer && !v.bar, JSON.stringify(v));
    check('but the data stays in memory', v.kf, JSON.stringify(v));

    await p.goto(KOREA+'&layers='+code,{waitUntil:'networkidle0'});
    await shutDialogs(p);
    await sleep(1800);
    v=await look(p);
    check('over Korea the Korea tools come up, not Karafuto’s',
      v.bar && v.kr && fetched.includes('kr-trains.js'), JSON.stringify({bar:v.bar,kr:v.kr,fetched:fetched.join()}));
    check('no page errors', errs.length===0, errs.join(' | '));

    /* ---- 7. the printed page ---------------------------------------- */
    const ttErr=[];
    const q=await browser.newPage();
    q.on('pageerror',e=>ttErr.push(String(e).slice(0,200)));
    await q.goto('http://localhost:8123/timetable/karafuto-1935.html',{waitUntil:'networkidle0'});
    const pv=await q.evaluate(()=>{
      const h2=[...document.querySelectorAll('h2[data-dir]')];
      const first=document.querySelector('table td');
      return {tables:h2.length, anchors:h2.filter(h=>h.id).length,
              lang:document.documentElement.lang, h1:document.querySelector('h1').textContent,
              warnFirst:!!document.querySelector('.warn'),
              cell:first?first.textContent.trim():'',
              archive:!![...document.querySelectorAll('header a')].find(a=>/archive\.org/.test(a.href)),
              csv:!!document.querySelector('a.dl'), jitai:!!document.getElementById('jitai')};
    });
    check('the Karafuto page carries all 14 tables', pv.tables===14 && pv.anchors===14,
      JSON.stringify({tables:pv.tables,anchors:pv.anchors}));
    check('and warns before the tables', pv.warnFirst, '');
    check('it opens in the characters the sheet prints', /樺太國有鐵道/.test(pv.h1), pv.h1);
    check('with a link to the original and a way to take the tables away',
      pv.archive && pv.csv && pv.jitai, JSON.stringify(pv));
    const shin=await q.evaluate(()=>{
      document.getElementById('jitai').click();
      return document.querySelector('h1').textContent;});
    check('and a press puts the whole page into modern characters',
      /樺太国有鉄道/.test(shin), shin);
    check('no page errors on the timetable', ttErr.length===0, ttErr.join(' | '));

    /* **The characters switch reaches the line names.** It says "when
       available", and every Karafuto line has characters, so all seven chips
       change. Checked here rather than only for Korea because `lineName` is
       one function for three systems and a regression would show in all of
       them — but only if something looks. */
    console.log('\n— the lines in the characters the sheet prints —');
    {
      const q = await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({ width: 1300, height: 950 });
      await q.goto(KARAFUTO, { waitUntil: 'networkidle0' });
      await sleep(3000);
      await shutDialogs(q);
      await setSwitch(q, '#opt-train-tools', true);
      await sleep(4200);
      const chips = () => q.evaluate(() =>
        [...document.querySelectorAll('.train-chip')].map(c => c.textContent.trim()));
      const off = await chips();
      await setSwitch(q, '#opt-han-labels', true);
      await sleep(1800);
      const on = await chips();
      const han = t => /[\u3400-\u9fff]/.test(t);
      check('romanised with the switch off',
        off.length === 7 && off.every(t => !han(t)), JSON.stringify(off));
      check('  and in characters with it on',
        on.length === 7 && on.every(han), JSON.stringify(on));
      check('  the East Coast Line is \u6771\u6d77\u5cb8\u7dda',
        on.indexOf('\u6771\u6d77\u5cb8\u7dda') >= 0, JSON.stringify(on));
      await q.close();
    }

    /* **Karafuto comes up further out than Taiwan's defaults, by request.**
       Southern Sakhalin is 4.2 degrees of latitude to Taiwan's 3.6, so at the
       inherited 5.0 the island already filled the frame before the tools
       arrived. The threshold is 7.0 on and 8.0 off. Checked at three views:
       comfortably inside it, comfortably outside, and at 5.5 — which is where
       the old default would have refused and the new one must not. */
    console.log('\n— how far out the tools come up —');
    for (const [span, where, want] of [
      [6.5, '139.8,44.6,146.5,51.1', true],
      [5.5, '140.6,45.0,145.8,50.5', true],
      [11,  '137.5,41.5,148.5,52.5', false],
    ]) {
      const q = await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({ width: 1300, height: 950 });
      await q.goto(BASE + '?where=' + where, { waitUntil: 'networkidle0' });
      await sleep(3000);
      await shutDialogs(q);
      await setSwitch(q, '#opt-train-tools', true);
      await sleep(4200);
      const up = await q.evaluate(() => ({
        bar: !!document.querySelector('#train-bar'),
        note: (document.querySelector('.train-note') || {}).textContent || '',
      }));
      check('at about ' + span + '\u00b0 of latitude the tools are '
              + (want ? 'up' : 'away'),
        up.bar === want && (!want || /1935/.test(up.note)),
        JSON.stringify(up));
      await q.close();
    }

  } finally { await browser.close(); }
  process.exit(report());
})();
