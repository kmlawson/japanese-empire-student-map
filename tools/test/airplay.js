/* The plane tools: the air timetable flown.
 *
 *     node tools/test/airplay.js          # with a server on 8123
 *
 * Three things here are worth more than the rest.
 *
 *   * **The aeroplane is a size on screen, not in map units.** It is a shape
 *     rather than a stroke, so it carries `scale(k)` and `rescaled(k)` has to
 *     rewrite it on every zoom. This project has made that mistake three times
 *     and every time it passed a test taken at one zoom, so this measures the
 *     same aeroplane at two.
 *   * **A lay-over is time on the ground.** The 1938–39 trunk reaches Dairen
 *     at 15:10 and does not start back until 09:30 the next morning. Nothing
 *     of that route may be in the air in between — an aeroplane that keeps
 *     flying through the night is the signature of a clock that has silently
 *     wrapped.
 *   * **Two days, because the sources need two.** An alternate-day service
 *     cannot be shown on a one-day clock without either flying it daily, which
 *     is false, or never, which is worse.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('airplay test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const URL='http://localhost:8123/index.html';

const at=p=>p.evaluate(()=>({
  bar:!!document.getElementById('air-bar'),
  clock:(document.querySelector('.air-clock')||{}).textContent||'',
  flying:[...document.querySelectorAll('#planes > g')]
    .filter(g=>g.style.display!=='none').length,
}));
const setMin=(p,m)=>p.evaluate(v=>{const s=document.querySelector('.air-slider');
  s.value=String(v); s.dispatchEvent(new Event('input',{bubbles:true}));},m);
const toEpoch=async(p,y)=>{
  await p.evaluate(t=>{const b=[...document.querySelectorAll('#epoch-seg button')]
    .find(x=>new RegExp(t).test(x.textContent)); if(b)b.click();},y);
  await sleep(2500);
};

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:950});
  await page.evaluateOnNewDocument(SHIM);
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle0'});
  await sleep(2000);

  console.log('\n— the button comes with the network and goes with it —');
  check('hidden before the routes are drawn',
    await page.evaluate(()=>document.getElementById('btn-planes').hidden), '');
  await toEpoch(page,'1942');
  await page.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(1100);
  check('and shown once they are',
    !(await page.evaluate(()=>document.getElementById('btn-planes').hidden)), '');
  /* Drawing a network and flying it are two different asks. */
  check('but nothing is flying until it is pressed',
    !(await page.evaluate(()=>!!document.getElementById('air-bar'))), '');

  await page.evaluate(()=>document.getElementById('btn-planes').click());
  await sleep(2000);
  const up=await at(page);
  check('pressing it brings up the strip', up.bar, JSON.stringify(up));
  check('which opens before the first departure',
    /Day 1\s+06:00/.test(up.clock) && up.flying===0, JSON.stringify(up));

  console.log('\n— the day fills and empties —');
  await setMin(page,7*60+30); await sleep(200);
  const morning=await at(page);
  check('aeroplanes are up soon after seven', morning.flying>=2,
    JSON.stringify(morning));
  await setMin(page,10*60); await sleep(200);
  const noon=await at(page);
  check('and the network is busiest in the middle of the day',
    noon.flying>morning.flying, morning.flying+' at 07:30, '+noon.flying+' at 10:00');
  await setMin(page,3*60); await sleep(200);
  const night=await at(page);
  /* Nothing in this network flew at three in the morning: no lighting and no
     instruments, which is the reading the whole 24-hour normalisation rests
     on. If anything is up here, a time is still on a twelve-hour clock. */
  check('and empty in the small hours', night.flying===0, JSON.stringify(night));

  console.log('\n— a night on the ground is time on the ground —');
  const trunk=async m=>{
    await setMin(page,m); await sleep(180);
    return page.evaluate(()=>{
      /* Which of the drawn aeroplanes is on the 1938–39 trunk: the one whose
         position lies on that route's own line. */
      const line=document.querySelector('.air-route[data-air="korea-1938"] .air-line');
      if(!line) return -1;
      const L=line.getTotalLength(), pts=[];
      for(let i=0;i<=240;i++){const q=line.getPointAtLength(L*i/240); pts.push(q);}
      let n=0;
      [...document.querySelectorAll('#planes > g')]
        .filter(g=>g.style.display!=='none').forEach(g=>{
          const t=g.getAttribute('transform')||'';
          const m2=/translate\(([-\d.]+),([-\d.]+)\)/.exec(t);
          if(!m2) return;
          const x=+m2[1], y=+m2[2];
          const near=pts.some(q=>Math.hypot(q.x-x,q.y-y)<1.5);
          if(near) n++;
        });
      return n;
    });
  };
  check('the trunk is in the air at noon on the first day',
    (await trunk(12*60))>=1, String(await trunk(12*60)));
  check('on the ground at Dairen at seven that evening',
    (await trunk(19*60))===0, String(await trunk(19*60)));
  check('still on the ground at two in the morning',
    (await trunk(26*60))===0, String(await trunk(26*60)));
  check('and away again by half past ten the next day',
    (await trunk(1440+10*60+30))>=1, String(await trunk(1440+10*60+30)));

  console.log('\n— two days, because an alternate-day service needs two —');
  await setMin(page,10*60); await sleep(200);
  const d1=(await at(page)).flying;
  await setMin(page,1440+10*60); await sleep(200);
  const d2=(await at(page)).flying;
  check('the second day carries a service the first does not', d2>d1,
    d1+' at 10:00 on day 1, '+d2+' on day 2');

  console.log('\n— a size on screen, not in map units —');
  await setMin(page,10*60); await sleep(200);
  const planeAt=()=>page.evaluate(()=>{
    const g=[...document.querySelectorAll('#planes > g')]
      .find(x=>x.style.display!=='none');
    if(!g) return 0;
    const b=g.getBoundingClientRect();
    return Math.round(Math.max(b.width,b.height)*10)/10;
  });
  const wide=await planeAt();
  for(let i=0;i<6;i++) await page.evaluate(()=>document.getElementById('zoom-in').click());
  await sleep(1000);
  await setMin(page,10*60); await sleep(250);
  const deep=await planeAt();
  check('the aeroplane is the same size at two zooms',
    wide>0 && deep>0 && Math.abs(wide-deep)<1.5,
    wide+' px out, '+deep+' px zoomed in');
  check('and big enough to see', wide>=5, wide+' px');
  await page.evaluate(()=>document.getElementById('zoom-reset').click());
  await sleep(1000);

  console.log('\n— the clock runs, and the date changes what flies —');
  await setMin(page,9*60); await sleep(150);
  await page.evaluate(()=>document.querySelector('.air-play').click());
  await sleep(1500);
  const ran=await at(page);
  await page.evaluate(()=>document.querySelector('.air-play').click());
  check('play moves the clock on', !/Day 1\s+09:00/.test(ran.clock), ran.clock);

  await toEpoch(page,'1930');
  await setMin(page,10*60); await sleep(250);
  const y1930=await at(page);
  check('the 1930 sheet flies the one service it has',
    y1930.flying===1, JSON.stringify(y1930));
  check('and the strip survived the date change', y1930.bar, '');
  await toEpoch(page,'1942');
  await setMin(page,10*60); await sleep(250);
  const back=await at(page);
  check('and switching back brings the rest of them',
    back.flying>=8, JSON.stringify(back));

  console.log('\n— and it goes away when the network does —');
  await page.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(900);
  const gone=await page.evaluate(()=>({
    bar:!!document.getElementById('air-bar'),
    layer:!!document.getElementById('planes'),
    btn:document.getElementById('btn-planes').hidden}));
  check('switching the routes off puts the tools away',
    !gone.bar && !gone.layer && gone.btn===true, JSON.stringify(gone));

  console.log('\n— and a finger works it —');
  const phone=await browser.newPage();
  await phone.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const perrs=[]; phone.on('pageerror',e=>perrs.push(String(e)));
  await phone.goto(URL,{waitUntil:'networkidle0'});
  await sleep(2000);
  await toEpoch(phone,'1942');
  await phone.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(900);
  /* **Close the card first, the way a reader would.** On a narrow screen an
     open card takes the whole foot of the map and the strip stands down —
     which is the fix for a real bug this found: the strip was being drawn
     *under* `#info`, visible and pressable by nothing at all. */
  await phone.evaluate(()=>{const c=document.getElementById('info-close');
    if(c) c.click();});
  await sleep(500);
  const pb=await phone.evaluate(()=>{
    const e=document.getElementById('btn-planes'); const r=e.getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};});
  await phone.touchscreen.tap(pb.x,pb.y);
  await sleep(1800);
  const pon=await at(phone);
  check('a tap brings the strip up on a phone', pon.bar, JSON.stringify(pon));
  const play=await phone.evaluate(()=>{
    const e=document.querySelector('.air-play'); const r=e.getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2),
            w:Math.round(r.width)};});
  check('and the play button is a finger-sized target', play.w>=30, play.w+' px');
  check('with nothing lying over it',
    await phone.evaluate(()=>{
      const e=document.querySelector('.air-play');
      const r=e.getBoundingClientRect();
      const top=document.elementsFromPoint(r.x+r.width/2, r.y+r.height/2)[0];
      return top===e || e.contains(top);
    }), 'something is drawn on top of the play button');
  await phone.touchscreen.tap(play.x,play.y);
  await sleep(1200);
  check('which a tap starts', (await at(phone)).clock!==pon.clock,
    pon.clock+' -> '+(await at(phone)).clock);
  check('no page errors', errs.length===0 && perrs.length===0,
    errs.concat(perrs).join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
