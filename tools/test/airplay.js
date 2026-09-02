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
 *   * **A week, with the nights taken out.** Nothing here flew after dark, so
 *     a week laid out minute by minute is two-thirds empty and the reader
 *     drags across it looking for the next departure. The slider runs over the
 *     hours that have flying in them, with a pause and a notch where one day
 *     gives way to the next. Seven days because the sources need seven: the
 *     Yokohama flying boat is out and back over a week, two nights at Saipan,
 *     two at Palau and two more at Saipan on the way home.
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
/* The slider is in ticks, not minutes: the two are not proportional, because
   the nights have been taken out of it. */
const setTick=(p,t)=>p.evaluate(v=>{const s=document.querySelector('.air-slider');
  s.value=String(v); s.dispatchEvent(new Event('input',{bubbles:true}));},t);
const maxTick=p=>p.evaluate(()=>+document.querySelector('.air-slider').max);
const notches=p=>p.evaluate(()=>[...document.querySelectorAll('#air-day-marks option')]
  .map(o=>+o.value));
/* Walk the whole slider and report the clock at every step, so a check can ask
   what the week actually looked like rather than guessing at a tick. */
const walk=(p,step)=>p.evaluate(async s2=>{
  const sl=document.querySelector('.air-slider'), max=+sl.max, out=[];
  for(let t=0;t<=max;t+=s2){
    sl.value=String(t); sl.dispatchEvent(new Event('input',{bubbles:true}));
    out.push({t, clock:document.querySelector('.air-clock').textContent,
      flying:[...document.querySelectorAll('#planes > g')]
        .filter(g=>g.style.display!=='none').length});
  }
  return out;
}, step);
const onLineAt=(p,id)=>p.evaluate(i=>{
  const line=document.querySelector('.air-route[data-air="'+i+'"] .air-line');
  if(!line) return 0;
  const L=line.getTotalLength(), pts=[];
  for(let k=0;k<=300;k++) pts.push(line.getPointAtLength(L*k/300));
  return [...document.querySelectorAll('#planes > g')]
    .filter(g=>g.style.display!=='none')
    .filter(g=>{const m=/translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform')||'');
      if(!m) return false; const x=+m[1],y=+m[2];
      return pts.some(q=>Math.hypot(q.x-x,q.y-y)<2);}).length;
}, id);
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
  /* Twenty minutes of empty air before the first departure, so the reader sees
     the first aeroplane take off rather than finding it already up. */
  check('which opens on the first day with nothing yet in the air',
    /Day 1\s+0[56]:/.test(up.clock) && up.flying===0, JSON.stringify(up));

  console.log('\n— a week, with the nights taken out —');
  const max=await maxTick(page);
  const marks=await notches(page);
  check('the slider covers seven days', marks.length===6,
    marks.length + ' notches: ' + JSON.stringify(marks));
  check('with a notch where each day gives way to the next',
    marks.every((v,i)=>v>0 && v<max && (i===0||v>marks[i-1])),
    JSON.stringify(marks) + ' of ' + max);
  const week=await walk(page, 15);
  const days={};
  week.forEach(w=>{const m=/Day (\d)\s+(\d\d):(\d\d)/.exec(w.clock);
    if(!m) return; const d=+m[1];
    (days[d]=days[d]||[]).push({min:+m[2]*60+ +m[3], flying:w.flying});});
  check('all seven days are reachable on it',
    Object.keys(days).length===7, Object.keys(days).join(','));
  /* **Nothing here flew after dark**, which is the reading the whole 24-hour
     normalisation rests on — so no part of the slider should land there. */
  const allMin=[].concat.apply([], Object.keys(days).map(d=>days[d].map(x=>x.min)));
  check('and not one tick of it falls in the small hours',
    Math.min.apply(null, allMin) >= 5*60 && Math.max.apply(null, allMin) <= 20*60,
    'from ' + Math.min.apply(null,allMin) + ' to ' + Math.max.apply(null,allMin) + ' minutes');
  check('the day opens before the first departure',
    days[1][0].flying===0, JSON.stringify(days[1][0]));
  const busiest=d=>Math.max.apply(null, days[d].map(x=>x.flying));
  check('and fills once the morning is under way', busiest(1)>=8, String(busiest(1)));
  /* The pause is dead time by design: a night, read as a beat. */
  const pauses=week.filter(w=>/night/.test(w.clock));
  check('a night reads as a night rather than as a jump',
    pauses.length>=5 && pauses.every(w=>w.flying===0),
    pauses.length + ' held, ' + pauses.filter(w=>w.flying).length + ' with something up');

  console.log('\n— the lay-over is time on the ground —');
  /* The 1938–39 trunk reaches Dairen at 15:10 and does not start back until
     09:30 the next morning. */
  const trunkByDay = {};
  for (const d of [1, 2]) {
    const win = week.filter(w=>new RegExp('Day '+d+'\\s').test(w.clock));
    trunkByDay[d] = [];
    for (const w of win) {
      await setTick(page, w.t); await sleep(60);
      trunkByDay[d].push({clock:w.clock, n:await onLineAt(page,'korea-1938')});
    }
  }
  const flying1 = trunkByDay[1].filter(x=>x.n>0);
  check('the trunk is in the air during the first day', flying1.length>0,
    String(flying1.length));
  check('and it has landed by the end of it',
    trunkByDay[1][trunkByDay[1].length-1].n===0,
    JSON.stringify(trunkByDay[1].slice(-1)));

  console.log('\n— and a seven-day circuit needs the seven days —');
  /* The Yokohama flying boat: out on the first day, two nights at Saipan, on
     to Palau on the third, two more, back to Saipan on the fifth, two more,
     and home on the seventh. Twice a month, so it makes one circuit here. */
  const boat = {};
  for (const w of week) {
    await setTick(page, w.t); await sleep(45);
    const d=(/Day (\d)/.exec(w.clock)||[])[1];
    if (!d) continue;
    if (await onLineAt(page,'nanyo')) (boat[d]=boat[d]||[]).push(w.clock);
  }
  const flew = Object.keys(boat).sort();
  check('the flying boat is up on the first, third, fifth and seventh days',
    flew.join(',')==='1,3,5,7', flew.join(',') || 'never');
  check('and on the ground on the second, fourth and sixth',
    !boat['2'] && !boat['4'] && !boat['6'],
    JSON.stringify(Object.keys(boat)));

  console.log('\n— a size on screen, not in map units —');
  await setTick(page, Math.round(max*0.12)); await sleep(200);
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
  await setTick(page, Math.round(max*0.12)); await sleep(250);
  const deep=await planeAt();
  check('the aeroplane is the same size at two zooms',
    wide>0 && deep>0 && Math.abs(wide-deep)<1.5,
    wide+' px out, '+deep+' px zoomed in');
  check('and big enough to see', wide>=5, wide+' px');
  await page.evaluate(()=>document.getElementById('zoom-reset').click());
  await sleep(1000);

  console.log('\n— the clock runs, and the date changes what flies —');
  await setTick(page, Math.round(max*0.10)); await sleep(150);
  const before=(await at(page)).clock;
  await page.evaluate(()=>document.querySelector('.air-play').click());
  await sleep(1500);
  const ran=await at(page);
  await page.evaluate(()=>document.querySelector('.air-play').click());
  check('play moves the clock on', ran.clock!==before, before+' -> '+ran.clock);

  await toEpoch(page,'1930');
  await sleep(400);
  const w30=await walk(page, 20);
  const up30=Math.max.apply(null, w30.map(x=>x.flying));
  /* **One service is two aeroplanes.** The 1931 trunk ran daily and took two
     days each way, so on any morning one is going out and another is coming
     back — which is what a daily service looks like from the ground, and what
     the two-day window could not show. */
  check('the 1930 sheet flies its one service, out and back',
    up30===2, 'most in the air at once: '+up30);
  check('and the strip survived the date change',
    (await at(page)).bar, '');
  await toEpoch(page,'1942');
  await sleep(400);
  const wBack=await walk(page, 30);
  check('and switching back brings the rest of them',
    Math.max.apply(null, wBack.map(x=>x.flying))>=8,
    'most in the air at once: '+Math.max.apply(null, wBack.map(x=>x.flying)));

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
