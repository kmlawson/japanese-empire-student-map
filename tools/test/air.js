/* The air routes: five services drawn as they were flown.
 *
 *     node tools/test/air.js             # with a server on 8123
 *
 * Three things here are worth more than the rest.
 *
 *   * **The stop rings keep their size.** They were first written as a circle
 *     of `r: 2.6` in map units, which is about *one screen pixel* at the
 *     opening view — the frame is 2,800 units across a thousand-odd pixels.
 *     That is this project's most-repeated bug, made again and caught by
 *     looking at a picture. They are in counter-scaled groups now, and the
 *     check measures a ring at two zooms and requires the same screen radius.
 *   * **A leg is a great circle**, so it departs from its own chord. Measured
 *     per leg, because the bend of a multi-stop route is its dogleg and says
 *     nothing about the projection.
 *   * **The fares add up.** Every through fare in the source is the sum of its
 *     legs, and that is what proves the reading of a printed triangle whose
 *     rows and columns are only implied by position.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('air test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const URL='http://localhost:8123/index.html';

/* **Press it, do not dispatch at it.**
 *
 * These checks all sent a synthetic `click` straight to the element, which
 * skips hit-testing entirely — and so passed while the feature was broken on
 * the map. `onPointerDown` calls `container.setPointerCapture`, which
 * retargets the pointer events *and the click* to the container, so a listener
 * on a path inside the SVG is never called by a real press. Nothing here
 * dispatches any more: it finds a screen point and clicks it.
 */
/* A point on the line with room around it. At the opening view the trunk's
   seven stops are close enough that every point on it is inside some airport
   ring — the best is *nothing* clear — so a press there answers with the
   airport, or misses and hits the country underneath. Zooming in stretches the
   line while the rings stay the same size on screen, which is what makes a
   stretch of line to press exist at all. */
const lineSpot=async(p,id)=>{
  for (let i=0;i<4;i++){
    const q=await onLine(p,id);
    if (q && q.clearOf>=8) return q;
    if (q) { await p.mouse.move(q.x,q.y); }
    await p.evaluate(()=>{const b=document.getElementById('zoom-in');
      if(b){b.click();b.click();}});
    await sleep(900);
  }
  return onLine(p,id);
};

const onLine=(p,id)=>p.evaluate(i=>{
  const svg=document.getElementById('jmap'), m=svg.getScreenCTM();
  const d=document.querySelector('.air-route[data-air="'+i+'"] .air-line').getAttribute('d');
  const pts=d.slice(1).split('L').map(s=>s.trim().split(/\s+/).map(Number));
  const rings=[...document.querySelectorAll('#air [data-air-stop]')]
    .map(g=>g.getBoundingClientRect());
  const scr=q=>{const t=svg.createSVGPoint(); t.x=q[0]; t.y=q[1];
                return t.matrixTransform(m);};
  /* The point on the line *farthest* from any airport, rather than any point
     more than N px clear: the Korea trunk has seven stops close together at
     the opening view and no point on it clears a fixed threshold, so a
     threshold returned nothing and the check died instead of running. */
  const gap=r=>Math.min.apply(null, rings.map(b=>Math.max(
    b.left-r.x, r.x-b.right, b.top-r.y, r.y-b.bottom)));
  /* **On the screen, first.** Without this the winner was whichever point had
     drifted furthest off the map — infinitely far from every ring, and a click
     there lands on the page rather than the line. Zoomed in, most of a route
     is off-screen, so this was not a corner case but the usual answer. */
  const box=document.getElementById('map-container').getBoundingClientRect();
  const seen=pts.map(scr).filter(r=>r.x>box.left+12 && r.x<box.right-12
                                 && r.y>box.top+12 && r.y<box.bottom-12);
  let best=null, bg=-1e9;
  seen.forEach(r=>{const g=gap(r); if(g>bg){bg=g; best=r;}});
  return best?{x:Math.round(best.x), y:Math.round(best.y),
               clearOf:Math.round(bg)}:null;
}, id);

const onRing=(p,id)=>p.evaluate(i=>{
  const g=document.querySelector('#air [data-air-stop="'+i+'"]');
  if(!g) return null;
  const b=g.getBoundingClientRect();
  return {x:Math.round(b.left+b.width/2), y:Math.round(b.top+b.height/2)};
}, id);

const toEpoch=async(p,y)=>{
  await p.evaluate(t=>{const b=[...document.querySelectorAll('#epoch-seg button')]
    .find(x=>new RegExp(t).test(x.textContent)); if(b) b.click();}, y);
  await sleep(2500);
};

const drawn=p=>p.evaluate(()=>[...document.querySelectorAll('#air .air-route')]
  .filter(g=>g.style.display!=='none').map(g=>g.getAttribute('data-air')));

const card_=p=>p.evaluate(()=>{
  const i=document.getElementById('info');
  if(i.hidden) return {open:false};
  const t=document.querySelector('#info-air table');
  return {open:true,
    chip:(i.querySelector('.chip')||{}).textContent,
    name:(i.querySelector('.primary')||{}).textContent,
    alt:(i.querySelector('.alt')||{}).textContent,
    when:(i.querySelector('.when')||{}).textContent,
    tables:document.querySelectorAll('#info-air .pop-table').length,
    csv:document.querySelectorAll('#info-air .pop-csv').length,
    src:(document.querySelector('#info-air .pop-src a')||{}).href||'',
    head:[...document.querySelectorAll('#info-air .pop-table th')].map(x=>x.textContent).join(' '),
    rows:[...document.querySelectorAll('#info-air .pop-table')]
      .map(t=>t.querySelectorAll('tbody tr').length),
    body:t?t.textContent:''};
});


(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1400,height:950});
  await page.evaluateOnNewDocument(SHIM);
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'networkidle0'});
  await sleep(1800);

  console.log('\n— the table —');
  const data=await page.evaluate(()=>({
    n:(JMAP.AIR||[]).length,
    ids:(JMAP.AIR||[]).map(r=>r.id),
    trunk:(JMAP.AIR||[]).filter(r=>r.id==='korea')[0],
    seasoned:(JMAP.AIR||[]).filter(r=>r.season).length,
    opWithSeason:(JMAP.AIR||[]).filter(r=>r.season&&r.operator).length,
    noLine:(JMAP.AIR||[]).filter(r=>r.stops.length<2).map(r=>r.id),
  }));
  /* Nineteen: the four dated services, the fourteen listed off the 1938–39
     timetable, and Keijō–Kankō–Seishin, which the diagram carries and the list
     did not. */
  check('nineteen routes', data.n===19, String(data.n));
  check('fifteen of them are read off the 1938–39 timetable',
    data.seasoned===15, String(data.seasoned));
  check('each of those names the airline',
    data.opWithSeason===15, String(data.opWithSeason));
  check('the trunk runs Tokyo to Dairen in seven stops',
    data.trunk && data.trunk.stops.length===7
      && data.trunk.stops[0].name==='Tokyo'
      && /Dairen/.test(data.trunk.stops[6].name),
    data.trunk ? data.trunk.stops.map(s=>s.name).join(' → ') : 'absent');
  check('it carries the 1931 timetable', data.trunk && data.trunk.times.length===7);
  check('and twenty-one fares', data.trunk && data.trunk.fares.length===21,
    data.trunk ? String(data.trunk.fares.length) : '');
  /* The check that proves the triangle was read right. */
  const sums=await page.evaluate(()=>{
    const r=(JMAP.AIR||[]).filter(x=>x.id==='korea')[0];
    const names=r.stops.map(s=>s.name.split(' (')[0]);
    const leg={};
    for(let i=0;i+1<names.length;i++){
      const f=r.fares.filter(x=>x.from===names[i]&&x.to===names[i+1])[0];
      if(f) leg[names[i]+'|'+names[i+1]]=f.yen;
    }
    const bad=[];
    r.fares.forEach(f=>{
      const i=names.indexOf(f.from), j=names.indexOf(f.to);
      let s=0; for(let k=i;k<j;k++) s+=leg[names[k]+'|'+names[k+1]];
      if(s!==f.yen) bad.push(f.from+'–'+f.to+' '+f.yen+' vs '+s);
    });
    return {bad, whole:r.fares.filter(f=>f.from==='Tokyo'&&f.to==='Dairen')[0]};
  });
  check('every through fare is the sum of its legs', sums.bad.length===0,
    sums.bad.join('; '));
  check('Tokyo to Dairen is 145 yen', sums.whole && sums.whole.yen===145,
    sums.whole ? String(sums.whole.yen) : 'absent');

  check('every route has at least two stops to fly between',
    data.noLine.length===0, data.noLine.join(', '));

  console.log('\n— the switch —');
  check('the layer is off until it is asked for', await page.evaluate(()=>{
    const g=document.getElementById('air'); return !!g && g.style.display==='none';}));
  await page.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(700);
  const on=await page.evaluate(()=>({
    shown:document.getElementById('air').style.display==='',
    routes:document.querySelectorAll('#air .air-route').length,
    halo:document.querySelectorAll('#air .air-halo').length,
    rings:document.querySelectorAll('#air .air-stop').length,
    pressed:document.getElementById('btn-air').getAttribute('aria-pressed'),
    box:document.getElementById('opt-air').checked,
    haloW:getComputedStyle(document.querySelector('#air .air-halo')).strokeWidth,
    lineW:getComputedStyle(document.querySelector('#air .air-line')).strokeWidth,
  }));
  check('the button builds them all', on.shown && on.routes===19, JSON.stringify(on));
  check('the pane box and the button agree',
    on.pressed==='true' && on.box===true, on.pressed+' / '+on.box);
  check('every route has a white halo under it', on.halo===19, String(on.halo));
  check('and the halo is wider than the line it backs',
    parseFloat(on.haloW)>parseFloat(on.lineW), on.haloW+' vs '+on.lineW);
  check('every stop is ringed', on.rings===67, String(on.rings));

  /* **A route belongs to the dates it was flown.** The 1930 sheet has one:
     the Tokyo–Dairen trunk, the only service already running and the only one
     timed here from a 1931 table. Drawing the rest over a 1930 map would put
     aeroplanes in the sky eight years early. */
  console.log('\n— and only the routes that date belongs to —');
  const on1930=await drawn(page);
  check('the 1930 sheet draws the trunk and nothing else',
    on1930.length===1 && on1930[0]==='korea', on1930.join(', '));
  await toEpoch(page,'1942');
  const on1942=await drawn(page);
  check('the 1942 sheet draws them all', on1942.length===19, String(on1942.length));
  check('the trunk is on both', on1942.indexOf('korea')>=0, on1942.join(', '));
  await toEpoch(page,'1930');
  check('and switching back puts the rest away again',
    (await drawn(page)).length===1);
  await toEpoch(page,'1942');

  console.log('\n— a ring is a size on screen, not in map units —');
  const ringAt=async()=>page.evaluate(()=>{
    const c=document.querySelector('#air .air-stop');
    const b=c.getBoundingClientRect();
    return Math.round(b.width*10)/10;
  });
  const wide=await ringAt();
  for(let i=0;i<6;i++) await page.evaluate(()=>document.getElementById('zoom-in').click());
  await sleep(900);
  const deep=await ringAt();
  check('the same on screen at two zooms', Math.abs(wide-deep)<1.2,
    wide+' px wide out, ' + deep + ' px zoomed in');
  check('and it is big enough to see', wide>3, wide+' px');
  /* Back to the opening view. This check zooms six steps in and left it there,
     so every press after it was aimed at ground no longer on the screen — the
     line and the airport cards below all failed for that and not for anything
     they were testing. */
  await page.evaluate(()=>document.getElementById('zoom-reset').click());
  await sleep(1200);

  console.log('\n— a leg is a great circle —');
  const legs=await page.evaluate(()=>{
    const G=window.JMAP_GEO, out=[];
    (JMAP.AIR||[]).forEach(r=>{
      const d=document.querySelector('.air-route[data-air="'+r.id+'"] .air-line').getAttribute('d');
      const pts=d.slice(1).split('L').map(s=>s.trim().split(/\s+/).map(Number));
      for(let i=0;i+1<r.stops.length;i++){
        const a=G.project(r.stops[i].lon,r.stops[i].lat);
        const z=G.project(r.stops[i+1].lon,r.stops[i+1].lat);
        const near=(q,t)=>Math.hypot(q[0]-t.x,q[1]-t.y)<0.6;
        const s0=pts.findIndex(q=>near(q,a)), s1=pts.findIndex(q=>near(q,z));
        if(s0<0||s1<=s0) continue;
        const A=z.y-a.y, B=a.x-z.x, C=-(A*a.x+B*a.y);
        let max=0;
        pts.slice(s0,s1+1).forEach(q=>{
          max=Math.max(max, Math.abs(A*q[0]+B*q[1]+C)/Math.hypot(A,B));});
        out.push({leg:r.stops[i].name.split(' (')[0]+'→'+r.stops[i+1].name.split(' (')[0],
                  steps:s1-s0+1, chord:+Math.hypot(z.x-a.x,z.y-a.y).toFixed(1),
                  bulge:+max.toFixed(2)});
      }
    });
    return out;
  });
  check('every leg is drawn as many steps, not one', legs.every(l=>l.steps>=3),
    legs.filter(l=>l.steps<3).map(l=>l.leg).join(', '));
  /* **Only the long ones need to bend.** Taihoku–Giran is about 40 km and
     Kanazawa–Toyama 50; over that distance a great circle *is* a straight line
     to any precision this map writes, and demanding a curve of them was
     demanding the projection lie. The check is therefore on the legs long
     enough for the curvature to be real — and the short ones must still be
     drawn in steps, which is checked above. */
  const long_ = legs.filter(l=>l.chord>100);
  check('every long leg departs from its own straight chord',
    long_.length>4 && long_.every(l=>l.bulge>0),
    long_.filter(l=>!l.bulge).map(l=>l.leg+' ('+l.chord+')').join(', '));
  /* And the bend grows with the distance, which is the actual claim: a
     great circle departs from its chord in proportion to how far it runs.
     A fixed threshold on the short legs was tried and was simply a worse
     way of saying this — it failed on a 65-unit hop bending 0.21. */
  const bySize = legs.slice().sort((a,b)=>a.chord-b.chord);
  const shortest = bySize.slice(0, 6).reduce((a,l)=>a+l.bulge,0) / 6;
  const biggest = bySize.slice(-6).reduce((a,l)=>a+l.bulge,0) / 6;
  check('and the bend grows with the length of the leg', biggest > shortest * 3,
    'six shortest average ' + shortest.toFixed(3)
    + ', six longest ' + biggest.toFixed(3));
  const longest=legs.slice().sort((a,b)=>b.bulge-a.bulge)[0];
  check('the longest leg bends most', /Saipan|Naha|Ulsan|Dairen/.test(longest.leg),
    longest.leg+' by '+longest.bulge);

  console.log('\n— the times, on hover and in the card —');
  const tips=await page.evaluate(()=>{
    const out={};
    ['taiwan-west','taiwan-east','korea','shanghai'].forEach(id=>{
      const t=document.querySelector('.air-route[data-air="'+id+'"] title');
      out[id]=t?t.textContent:'';
    });
    return out;
  });
  check('a line says what it is on hover', /Taihoku/.test(tips['taiwan-west']),
    tips['taiwan-west']);
  check('with the times on it, not only the name',
    /out 9:00, back 2:55/.test(tips['taiwan-west']), tips['taiwan-west']);
  /* The first stop's own two times. Using the *last* stop's arrival read as
     the end of the journey when it is the turn-round: Taihoku–Makō said "in
     11:05", the arrival at Makō, while the aeroplane was back at Taihoku at
     2:55. */
  check('and the return is the first stop’s, not the far end’s',
    !/11:05/.test(tips['taiwan-west']), tips['taiwan-west']);
  check('the Pescadores leg says it ran every other day',
    /偶数日/.test(tips['taiwan-west']), tips['taiwan-west']);
  check('where every leg is daily, it is said once and not five times',
    (tips['taiwan-east'].match(/毎日/g)||[]).length===1, tips['taiwan-east']);
  /* Fukuoka–Shanghai–Nanking is one the source does not time here. */
  check('a route with no times still says what it is',
    /Shanghai/.test(tips['shanghai']) && !/out /.test(tips['shanghai']),
    tips['shanghai']);

  /* The order that broke: `#atom-hits` is rebuilt on every date switch and
     was landing above `#air`, so a press on a line over a small territory
     picked the territory's invisible fallback disc. */
  const order=await page.evaluate(()=>{
    const k=[...document.getElementById('jmap').children].map(e=>e.id);
    return {air:k.indexOf('air'), hits:k.indexOf('atom-hits')};
  });
  check('the airport layer stays above the small-territory hit discs',
    order.air>-1 && order.hits>-1 && order.air>order.hits, JSON.stringify(order));

  console.log('\n— the card —');
  const spot=await lineSpot(page,'korea');
  check('there is a stretch of that line clear of every airport',
    !!spot && spot.clearOf >= 8,
    spot ? ('the best is only ' + spot.clearOf + ' px clear') : 'no point at all');
  await page.mouse.click(spot.x, spot.y);
  await sleep(700);
  const card=await card_(page);
  check('pressing a line opens its card', card.open, JSON.stringify(card));
  check('headed as an air route', card.chip==='Air route', card.chip);
  check('with the operator and the year it opened',
    /Japan Air Transport/.test(card.when) && /1929/.test(card.when), card.when);
  check('the timetable and the fares are both drawn', card.tables===2,
    String(card.tables));
  check('the timetable has no empty frequency column where the source gave none',
    !/Runs/.test(card.head||''), card.head||'');
  /* The project's rule: a table this map draws can be taken away, with its
     source on it. Two tables, two buttons. */
  check('and each carries its own CSV', card.csv===2, String(card.csv));
  check('with the source linked', /teikyo-u\.ac\.jp/.test(card.src), card.src);

  /* **A dot answers the other half of the network.** A line says where it
     went; an airport has to say what came through it, which is the question a
     reader standing on Fukuoka actually has — and Fukuoka is on five of these
     routes. */
  console.log('\n— and an airport says what called there —');
  await page.evaluate(()=>document.getElementById('zoom-reset').click());
  await sleep(1200);
  const port=async id=>{
    const at=await onRing(page,id);
    await page.mouse.click(at.x, at.y);
    await sleep(600);
    const c=await card_(page);
    c.rows = (c.rows || [])[0] || 0;
    return c;
  };
  const fuk=await port('fukuoka');
  check('pressing a ring opens an airport card', fuk.chip==='Airport', fuk.chip);
  check('named for the airport', /Fukuoka/.test(fuk.name), fuk.name);
  check('Fukuoka is on five of the routes', /5 of the scheduled/.test(fuk.alt),
    fuk.alt);
  check('and every one of them is listed', fuk.rows>=5, String(fuk.rows));
  check('with arrivals and departures', /Arrives/.test(fuk.head) && /Departs/.test(fuk.head),
    fuk.head);
  const tky=await port('tokyo');
  check('a corridor flown twice a day shows both services',
    /morning/.test(tky.body) && /afternoon/.test(tky.body), tky.head);
  check('the ring is a press target a finger can find', await page.evaluate(()=>{
    const h=document.querySelector('#air .air-stop-hit');
    return h ? h.getBoundingClientRect().width >= 14 : false;
  }), 'the drawn ring is 3.4 px across');

  console.log('\n— and a finger opens it too —');
  const phone=await browser.newPage();
  await phone.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const perrs=[]; phone.on('pageerror',e=>perrs.push(String(e)));
  await phone.goto(URL,{waitUntil:'networkidle0'});
  await sleep(1900);
  await phone.evaluate(()=>document.getElementById('btn-air').click());
  await sleep(800);
  await toEpoch(phone,'1942');
  /* The ocean route and Saipan rather than the trunk and Tokyo: on a 390 px
     screen the home islands are a thumbnail and their stops overlap, so a tap
     there is a test of nothing but crowding. */
  const tspot=await lineSpot(phone,'nanyo');
  if (tspot) await phone.touchscreen.tap(tspot.x, tspot.y);
  await sleep(700);
  const tap=await card_(phone);
  check('a finger on a line opens its card', tap.open && tap.chip==='Air route',
    JSON.stringify(tap).slice(0,140));
  /* Back to the whole sheet: the tap above zoomed in to find a stretch of
     line, and Saipan is not on the screen it left behind. */
  await phone.evaluate(()=>document.getElementById('zoom-reset').click());
  await sleep(1200);
  const tring=await onRing(phone,'saipan');
  await phone.touchscreen.tap(tring.x, tring.y);
  await sleep(700);
  const tport=await card_(phone);
  check('and a finger on an airport opens that',
    tport.open && tport.chip==='Airport', JSON.stringify(tport).slice(0,140));
  check('the press targets are wider than what is drawn', await phone.evaluate(()=>{
    const l=parseFloat(getComputedStyle(document.querySelector('#air .air-hit')).strokeWidth);
    const r=document.querySelector('#air .air-stop-hit').getBoundingClientRect().width;
    return l>=12 && r>=14;
  }), 'a 1.7 px line and a 3.4 px ring are not finger-sized');

  check('no page errors', errs.concat(perrs).length===0, errs.concat(perrs).join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
