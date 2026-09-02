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
const { ready } = require('./settle.js');
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
  /* **Clear of every other line as well as every ring.** Nineteen services
     over one sea overlap: the point farthest from the airports on the trunk
     ran along beside Keijō–Dairen for most of its length, and the press
     opened that instead — a card for the wrong route, which the checks then
     read as the right one saying the wrong things. */
  const rings=[
    // every airport, this route's own included — a point beside Koror is a
    // press on Koror however the line got there
    ...document.querySelectorAll('#air [data-air-stop]'),
    // and every *other* route: nineteen services over one sea overlap, and
    // the clearest stretch of the trunk ran alongside Keijō–Dairen for most
    // of its length, so the press opened that instead
    ...[...document.querySelectorAll('#air .air-route')]
      .filter(g=>g.getAttribute('data-air')!==i)]
    .map(g=>g.getBoundingClientRect())
    .filter(b=>b.width||b.height);
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

/* **Press along the line until this route answers.** `lineSpot` picks the one
   point farthest from any airport and presses it, which is right for a route
   with room around it and hopeless for one that shares its first leg with
   three others — every China Airways service leaves Peking. This walks the
   candidates in order and stops at the first press that opens the card asked
   for, so a check can name the route it wants rather than the emptiest pixel. */
const openRoute=async(p,id,want)=>{
  for(let z=0;z<3;z++){
    const cs=await p.evaluate(i=>{
      const svg=document.getElementById('jmap'), m=svg.getScreenCTM();
      const el=document.querySelector('.air-route[data-air="'+i+'"] .air-line');
      if(!el) return [];
      const raw=el.getAttribute('d').slice(1).split('L')
        .map(s=>s.trim().split(/\s+/).map(Number));
      const pts=[];
      for(let j=0;j<raw.length;j++){
        pts.push(raw[j]);
        if(j+1<raw.length) for(const f of [0.25,0.5,0.75])
          pts.push([raw[j][0]+(raw[j+1][0]-raw[j][0])*f,
                    raw[j][1]+(raw[j+1][1]-raw[j][1])*f]);
      }
      const rings=[...document.querySelectorAll('#air [data-air-stop]')]
        .map(g=>g.getBoundingClientRect()).filter(b=>b.width||b.height);
      const box=document.getElementById('map-container').getBoundingClientRect();
      const scr=q=>{const t=svg.createSVGPoint(); t.x=q[0]; t.y=q[1];
                    return t.matrixTransform(m);};
      const gap=r=>rings.length?Math.min.apply(null, rings.map(b=>Math.max(
        b.left-r.x, r.x-b.right, b.top-r.y, r.y-b.bottom))):1e6;
      return pts.map(scr)
        .filter(r=>r.x>box.left+14 && r.x<box.right-14
                && r.y>box.top+14 && r.y<box.bottom-14)
        .map(r=>({x:Math.round(r.x),y:Math.round(r.y),clear:Math.round(gap(r))}))
        .sort((a,b)=>b.clear-a.clear).slice(0,24);
    }, id);
    for(const c of cs){
      await p.mouse.click(c.x,c.y); await sleep(400);
      const r=await card_(p);
      if(r.open && r.chip==='Air route' && new RegExp(want).test(r.name||'')) return r;
      await p.keyboard.press('Escape'); await sleep(120);
    }
    if(cs.length) await p.mouse.move(cs[0].x,cs[0].y);
    await p.evaluate(()=>{const b=document.getElementById('zoom-in');if(b)b.click();});
    await sleep(900);
  }
  return null;
};

const card_=p=>p.evaluate(()=>{
  const i=document.getElementById('info');
  if(i.hidden) return {open:false};
  const t=document.querySelector('#info-air table');
  const noteEl=i.querySelector('.note-own')||document.createElement('p');
  return {open:true,
    chip:(i.querySelector('.chip')||{}).textContent,
    name:(i.querySelector('.primary')||{}).textContent,
    alt:(i.querySelector('.alt')||{}).textContent,
    when:(i.querySelector('.when')||{}).textContent,
    tables:document.querySelectorAll('#info-air .pop-table').length,
    strips:document.querySelectorAll('#info-air .air-jrn').length,
    heads:[...document.querySelectorAll('#info-air .air-leg-head')].map(x=>x.textContent),
    freq:[...document.querySelectorAll('#info-air .air-jrn-freq')].map(x=>x.textContent),
    // one entry per leg, in the order they are drawn down the column
    legs:[...document.querySelectorAll('#info-air .air-calls')].map(c=>
      [...c.querySelectorAll('li')].map(li=>li.textContent.replace(/\s+/g,' ').trim())),
    /* what the route's own note actually rendered as. `**emphasis**` is
       written into `data/air/routes.csv` the way it is written everywhere else
       in this project's prose, and for a while the pane assigned it with
       `textContent` — which put the asterisks themselves in front of the
       reader on twenty-six cards. */
    noteStars:(noteEl.textContent.match(/\*\*/g)||[]).length,
    noteStrong:[...noteEl.querySelectorAll('strong')].map(x=>x.textContent),
    noteWrap:noteEl.isConnected?getComputedStyle(noteEl).whiteSpace:'',
    nextday:document.querySelectorAll('#info-air .air-next').length,
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
  await ready(page);

  console.log('\n— the table —');
  const data=await page.evaluate(()=>({
    n:(JMAP.AIR||[]).length,
    ids:(JMAP.AIR||[]).map(r=>r.id),
    trunk:(JMAP.AIR||[]).filter(r=>r.id==='korea')[0],
    seasoned:(JMAP.AIR||[]).filter(r=>r.season).length,
    opWithSeason:(JMAP.AIR||[]).filter(r=>r.season&&r.operator).length,
    noLine:(JMAP.AIR||[]).filter(r=>r.stops.length<2).map(r=>r.id),
  }));
  /* Fifty across three companies: twenty Japanese, the KLM trunk from
     Amsterdam, twenty-five KNILM lines across the Indies from a 1935 route
     map, and four more KNILM lines with times from the company's own 1931
     timetable — those four on the 1930 sheet, where the rest of the Dutch
     network is not. */
  check('seventy routes', data.n===70, String(data.n));
  /* **Every route with a timetable says which sheet it was read from.** The
     card's heading used to fall back to "Summer timetable, June–August 1931"
     for any route with no season of its own, which put the 1931 trunk's
     diagram at the head of the Fukuoka–Naha–Taihoku table — a citation for a
     document those times were never in. `build_texts.py` refuses that now. */
  check('sixty-nine of the seventy name the sheet they were read from',
    data.seasoned===69, String(data.seasoned));
  const unsourced=await page.evaluate(()=>(JMAP.AIR||[])
    .filter(r=>(r.times||[]).length && !r.season).map(r=>r.id));
  check('and not one route with a timetable is missing it',
    unsourced.length===0, JSON.stringify(unsourced));
  check('each of those names the airline',
    data.opWithSeason===69, String(data.opWithSeason));
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
  check('the button builds them all', on.shown && on.routes===70, JSON.stringify(on));
  check('the pane box and the button agree',
    on.pressed==='true' && on.box===true, on.pressed+' / '+on.box);
  check('every route has a white halo under it', on.halo===70, String(on.halo));
  check('and the halo is wider than the line it backs',
    parseFloat(on.haloW)>parseFloat(on.lineW), on.haloW+' vs '+on.lineW);
  check('every stop is ringed', on.rings===228, String(on.rings));

  /* **A route belongs to the dates it was flown.** The 1930 sheet has one:
     the Tokyo–Dairen trunk, the only service already running and the only one
     timed here from a 1931 table. Drawing the rest over a 1930 map would put
     aeroplanes in the sky eight years early. */
  console.log('\n— and only the routes that date belongs to —');
  const on1930=await drawn(page);
  /* Eleven: the Japanese trunk; the four KNILM lines the company's own 1931
     timetable gives — Java, Bandoeng, Singapore and Medan; CNAC's four, three
     off a c. 1933 sheet and the coast line timed from 1935; PATCO's hop to
     Baguio; and the Siamese mail line up the Khorat plateau. The rest of the
     Dutch network belongs to the 1942 sheet, from later documents. */
  check('the 1930 sheet draws the trunk, the Dutch lines, CNAC, PATCO, Siam and India',
    on1930.length===13 && on1930.indexOf('korea')>=0
    && on1930.filter(function(x){return /^knilm30-/.test(x);}).length===4
    && on1930.filter(function(x){return /^cnac-/.test(x);}).length===4
    && on1930.indexOf('patco-manila-baguio')>=0
    && on1930.indexOf('siam-korat-nakhonphanom')>=0
    && on1930.filter(function(x){return /^ina-/.test(x);}).length===2,
    on1930.join(', '));
  await toEpoch(page,'1942');
  const on1942=await drawn(page);
  check('the 1942 sheet draws the other fifty-seven', on1942.length===57,
    String(on1942.length));
  /* **The trunk is not on both — it is a different aeroplane.** In 1931 it
     called at Ulsan and Heijō and slept at Keijō; by the 1938–39 timetable it
     ran Tokyo–Osaka–Fukuoka–Keijō–Dairen in a day and turned round the next
     morning at Dairen. One route each, and each on its own date. */
  check('the 1931 trunk is not drawn on the 1942 sheet',
    on1942.indexOf('korea')<0, on1942.join(', '));
  check('and its 1938–39 replacement is',
    on1942.indexOf('korea-1938')>=0, on1942.join(', '));
  await toEpoch(page,'1930');
  check('and switching back puts the rest away again',
    (await drawn(page)).length===13);
  await toEpoch(page,'1942');

  console.log('\n— a ring is a size on screen, not in map units —');
  /* A ring that is *drawn*. The first `.air-stop` in the document belongs to
     the 1931 trunk, which the 1942 sheet does not draw, so it measured zero. */
  const ringAt=async()=>page.evaluate(()=>{
    const c=[...document.querySelectorAll('#air .air-stop')]
      .find(e=>e.getBoundingClientRect().width>0);
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
  /* **Measured on the legs no other airline flies.**
   *
   * A leg two or more services share is drawn once per service, shifted
   * sideways into its own lane — so it *does* depart from its chord, on
   * purpose and by a couple of screen pixels, and mixing those in measures the
   * lane rather than the projection. Shinkyō–Mukden, which four services fly,
   * came out bending 9.69 and beating every genuinely long leg on the map.
   * The lanes are checked on their own further down. */
  const legs=await page.evaluate(()=>{
    const G=window.JMAP_GEO, out=[];
    const drawn=(JMAP.AIR||[]).filter(r=>{
      const g=document.querySelector('.air-route[data-air="'+r.id+'"]');
      return g && g.style.display!=='none';
    });
    const seen={};
    drawn.forEach(r=>{
      for(let i=0;i+1<r.stops.length;i++){
        const a=r.stops[i].id||r.stops[i].name, b=r.stops[i+1].id||r.stops[i+1].name;
        const k=a<b?a+'\u0000'+b:b+'\u0000'+a;
        seen[k]=(seen[k]||0)+1;
      }
    });
    (JMAP.AIR||[]).forEach(r=>{
      const d=document.querySelector('.air-route[data-air="'+r.id+'"] .air-line').getAttribute('d');
      const pts=d.slice(1).split('L').map(s=>s.trim().split(/\s+/).map(Number));
      for(let i=0;i+1<r.stops.length;i++){
        const ia=r.stops[i].id||r.stops[i].name, ib=r.stops[i+1].id||r.stops[i+1].name;
        const kk=ia<ib?ia+'\u0000'+ib:ib+'\u0000'+ia;
        if((seen[kk]||0)>1) continue;         // in a lane; see above
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
    /out 9:00, back 14:55/.test(tips['taiwan-west']), tips['taiwan-west']);
  /* The first stop's own two times. Using the *last* stop's arrival read as
     the end of the journey when it is the turn-round: Taihoku–Makō said "in
     11:05", the arrival at Makō, while the aeroplane was back at Taihoku at
     2:55. */
  check('and the return is the first stop’s, not the far end’s',
    !/11:05/.test(tips['taiwan-west']), tips['taiwan-west']);
  /* In English. The Japanese was in the file beside it — "偶数日 even-numbered
     days" — and saying it twice in a tooltip is not a translation, it is the
     same fact taking two lines on a phone. */
  check('the Pescadores leg says it ran every other day',
    /even-numbered days/.test(tips['taiwan-west'])
    && !/偶数日/.test(tips['taiwan-west']), tips['taiwan-west']);
  check('where every leg is daily, it is said once and not five times',
    (tips['taiwan-east'].match(/daily/g)||[]).length===1
    && !/毎日/.test(tips['taiwan-east']), tips['taiwan-east']);
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


  /* ---- the Dutch networks ------------------------------------------
   *
   * Two more systems on the 1942 sheet, in an ink of their own: the KLM trunk
   * from Amsterdam, which the frame catches from Karachi eastward, and the
   * KNILM lines across the Indies. Both are drawn from documents that predate
   * the occupation the map shows — a 1938 brochure and a map of about 1935 —
   * and both cards say so, because a line drawn on a December 1942 sheet that
   * had stopped flying by then is a claim that needs its date attached.
   */
  console.log('\n— the Dutch networks, in an ink of their own —');
  const nl=await page.evaluate(()=>{
    const air=JMAP.AIR||[];
    const klm=air.filter(r=>r.id==='klm-batavia')[0];
    const knilm=air.filter(r=>/^knilm-/.test(r.id));
    const on=[...document.querySelectorAll('#air .air-route')]
      .filter(g=>g.style.display!=='none');
    const inkOf=id=>{const g=document.querySelector('.air-route[data-air="'+id+'"] .air-line');
      return g?getComputedStyle(g).stroke:'';};
    return {
      klmStops:(klm&&klm.stops||[]).length,
      klmDays:(klm&&klm.days)||[],
      klmEpochs:(klm&&klm.epochs)||[],
      knilm:knilm.length,
      byOperator:(function(){
        var out={};
        on.forEach(function(g){
          var r=(JMAP.AIR||[]).filter(function(x){
            return x.id===g.getAttribute('data-air'); })[0];
          var k=(r&&r.operator)||'(none)';
          out[k]=(out[k]||0)+1;
        });
        return out;
      })(),
      dutchInk:inkOf('klm-batavia'), japInk:inkOf('korea-1938'),
      klmNote:(klm&&klm.note)||'', knilmNote:(knilm[0]&&knilm[0].note)||'',
      klmOp:(klm&&klm.operator)||'', knilmOp:(knilm[0]&&knilm[0].operator)||'',
      edge:((klm&&klm.stops||[])[0]||{}).name||'',
    };
  });
  check('the KLM trunk runs Karachi to Bandoeng, with the frame\u2019s edge first',
    nl.klmStops===13 && /Jask/.test(nl.edge), nl.klmStops+' stops, first '+nl.edge);
  check('and leaves on Mondays, Thursdays and Saturdays',
    JSON.stringify(nl.klmDays)==='[1,4,6]', JSON.stringify(nl.klmDays));
  /* Twenty-six now: the twenty-five drawn from the company's own route map,
     and the one that leaves the Indies altogether — Tarakan across the Sulu
     Sea to Manila, which is the only KNILM line on this map that ends
     outside the Dutch East Indies. */
  check('twenty-six KNILM lines beside it', nl.knilm===26, String(nl.knilm));
  check('all of them on the 1942 sheet and none on the 1930 one',
    nl.klmEpochs.length===1 && nl.klmEpochs[0]==='e1942',
    JSON.stringify(nl.klmEpochs));
  check('drawn in an ink of their own, not the Japanese network\u2019s',
    nl.dutchInk && nl.japInk && nl.dutchInk!==nl.japInk,
    nl.dutchInk+' vs '+nl.japInk);
  /* **Seven companies on the 1942 sheet**, named rather than bucketed. This
     was four buckets keyed on id prefixes, and every airline that arrived
     after them fell into the last one and was counted as Japanese — CNAC did,
     then 満洲航空, then Indian National Airways. The company is a field on the
     route; ask that. A tally by company is also the thing a reader of this
     file can check against the sources. */
  {
    const want = {
      'Japan Airways Co. Ltd (大日本航空株式会社)': 19,
      'China Airways Co. (中華航空株式會社)': 4,
      'China National Aviation Corporation (中國航空公司)': 3,
      'Manchuria Aviation Company (満洲航空株式会社)': 3,
      'KLM (Koninklijke Luchtvaart Maatschappij)': 1,
      'KNILM (Koninklijke Nederlandsch-Indische Luchtvaart Maatschappij)': 26,
      'Indian National Airways': 1,
    };
    const got = nl.byOperator;
    const same = Object.keys(want).length === Object.keys(got).length
      && Object.keys(want).every(k => got[k] === want[k]);
    check('seven companies on the 1942 sheet, in the numbers the sources give',
      same, JSON.stringify(got));
  }
  /* **The date on the document, not the date on the map.** */
  check('the KLM card says its times are from before the occupation',
    /1938/.test(nl.klmNote) && /occupation|stopped running/.test(nl.klmNote),
    nl.klmNote.slice(0,90));
  check('and the KNILM cards say theirs is a 1935 route map with no times',
    /1935/.test(nl.knilmNote) && /No times/.test(nl.knilmNote),
    nl.knilmNote.slice(0,90));
  check('each names the company that flew it',
    /KLM/.test(nl.klmOp) && /KNILM/.test(nl.knilmOp),
    nl.klmOp+' / '+nl.knilmOp);

  console.log('\n— the card —');
  const spot=await lineSpot(page,'korea-1938');
  check('there is a stretch of that line clear of every airport',
    !!spot && spot.clearOf >= 8,
    spot ? ('the best is only ' + spot.clearOf + ' px clear') : 'no point at all');
  await page.mouse.click(spot.x, spot.y);
  await sleep(700);
  const card=await card_(page);
  check('pressing a line opens its card', card.open, JSON.stringify(card));
  check('headed as an air route', card.chip==='Air route', card.chip);
  /* **The operator each date flew under.** Japan Air Transport ran the 1930
     network; the 1938 merger made 大日本航空 and it is that company's name on
     every route the 1942 sheet draws, this trunk included — the line opened in
     1929 and the company that was flying it by the timetable this card is read
     from is not the one that opened it. */
  check('with the operator and the year it opened',
    /大日本航空/.test(card.when) && /1929/.test(card.when), card.when);
  /* **One column is one circuit, read straight down.**
   *
   * It was a grid first, then two columns — outward and return — which still
   * asked the reader to start again halfway. An aeroplane does not: it goes
   * out, turns round and comes back, and that is one thing to follow. */
  check('the whole circuit is one column', card.strips===1,
    String(card.strips) + ' — ' + JSON.stringify(card.heads));
  check('with the outward and the return as two legs down it',
    card.legs.length===2 && /Outward/.test(card.heads[0]||'')
    && /Return/.test(card.heads[1]||''), JSON.stringify(card.heads));
  check('how often it ran is on a line of its own',
    card.freq.length===1 && /daily/.test(card.freq[0]),
    JSON.stringify(card.freq));
  check('the outward runs Tokyo to Dairen, in that order',
    /Tokyo/.test((card.legs[0]||[])[0]||'')
    && /Dairen|Dàlián/.test((card.legs[0]||[]).slice(-1)[0]||''),
    JSON.stringify((card.legs[0]||[]).slice(0,2)));
  check('and the return is the same stops the other way',
    /Dairen|Dàlián/.test((card.legs[1]||[])[0]||'')
    && /Tokyo/.test((card.legs[1]||[]).slice(-1)[0]||''),
    JSON.stringify((card.legs[1]||[]).slice(0,2)));
  /* ↓ is landing and ↑ is taking off: no key needed, and shorter than either
     word in any language this map is read in. */
  check('each call carries an arrival and a departure, by arrow',
    /\u2193 8:30/.test((card.legs[0]||[])[1]||'')
    && /\u2191 8:50/.test((card.legs[0]||[])[1]||''), (card.legs[0]||[])[1]||'');
  /* **The day is on the call, not counted from the one before.** The 1938–39
     trunk turns round at Dairen and comes back the next morning, so every call
     on the way home is marked day 2 — and the Yokohama flying boat, which lies
     up two nights at a time, needs days 3, 5 and 7 said outright. A column of
     times cannot say either by itself. */
  check('every call after the first day says which day it is on',
    card.nextday===8, String(card.nextday));
  check('and they read as days rather than as a vague "next"',
    (card.legs[1]||[]).some(x=>/day 2/.test(x)),
    JSON.stringify((card.legs[1]||[]).slice(0,2)));
  /* The 1931 fares belong to the 1931 trunk; this one is a timetable only. */
  check('the strip is the only table on this card', card.tables===0,
    String(card.tables));
  check('the timetable has no empty frequency column where the source gave none',
    !/Runs/.test(card.head||''), card.head||'');
  /* The project's rule: a table this map draws can be taken away, with its
     source on it. Two tables, two buttons. */
  check('and it carries its own CSV', card.csv===1, String(card.csv));
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
  /* One row per call, in the order of the clock: the time, whether it was an
     arrival or a departure, and the place at the other end of that leg. The
     old card gave one row per route with both directions folded into a cell
     as "13:10 / 11:00" — two aeroplanes on different errands written as one
     fact. */
  check('the columns are the time, the event and the far end',
    /Time/.test(fuk.head) && /From \/ to/.test(fuk.head), fuk.head);
  /* An arrow against the clock rather than a column of the words Arrives and
     Departs: ↓ is landing and ↑ is taking off, it needs no key, and it gave
     the far end of the leg the room its name wants. */
  check('an arrow against the clock says which it was',
    /\u2193/.test(fuk.body) && /\u2191/.test(fuk.body),
    (fuk.body||'').slice(0,90));
  check('and the words are gone with the column they filled',
    !/Arrives/.test(fuk.body) && !/Departs/.test(fuk.body),
    (fuk.body||'').slice(0,90));
  /* The far end of each leg, named the way the map names a city: characters,
     then the romanisation the names switch asks for. */
  check('each says where the leg went, in the reader\u2019s own names',
    /from 大阪 Osaka/.test(fuk.body) && /to 大邱 Taegu/.test(fuk.body),
    (fuk.body||'').slice(0,120));
  /* **The airport's day, not the aeroplane's.** `airJourney` counts forward
     across the lay-over, so the trunk's return reaches Fukuoka on its second
     day; sorted by that, 11:00 came after 13:20. And the Taiwan sheets print
     an afternoon in twelve-hour form, so "1:00" had to be read as 13:00 from
     the order of the flight's own calls before it could be sorted at all. */
  const times=await page.evaluate(()=>
    [...document.querySelectorAll('#info-air tbody tr')]
      .map(tr=>tr.children[0].textContent.trim()).filter(Boolean));
  const mins=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(t); return m?+m[1]*60+ +m[2]:null;};
  check('the calls are in clock order',
    times.map(mins).filter(v=>v!==null)
      .every((v,i,a)=>i===0||a[i-1]<=v), JSON.stringify(times));
  /* **Every clock is a twenty-four hour clock**, and the file is what makes it
     so: `build_texts.py` refuses a journey whose calls run backwards, which is
     what a twelve-hour afternoon looks like from the next call along. Nothing
     in this network flew before dawn, so a time under 05:00 is the signature
     of the mistake. */
  const raw=times.map(t=>t.replace(/[^0-9:]/g,''));
  check('nothing is printed on a twelve-hour clock',
    raw.every(t=>!/^[0-4]:/.test(t)), JSON.stringify(times));
  /* **Two names, and the short one has to stay unique.** None of the nineteen
     shares a pair of ends today, so the numbering has nothing to do — which is
     exactly why it is worth driving: a rule that has never once fired is a
     rule nobody has tested. A pair is planted here and the names recomputed. */
  const names=await page.evaluate(()=>{
    const real=(JMAP.AIR||[]).map(r=>r.shortName);
    const dup=new Set(), clash=[];
    real.forEach(n=>{ if(dup.has(n)) clash.push(n); dup.add(n); });
    return {n:real.length, sample:real.slice(0,3), clash,
            long:(JMAP.AIR||[])[0].name};
  });
  check('every route carries a short name as well as its full one',
    names.n===70 && /–/.test(names.sample[0]) && names.long.length>names.sample[0].length,
    JSON.stringify(names.sample));
  check('and the trunk is named by its two ends',
    names.sample[0]==='Tokyo – Dairen', names.sample[0]);
  /* **Only a clash a reader could see.** "Tokyo – Dairen" is the short name of
     both trunks — the 1931 one and the 1938–39 one that replaced it — and they
     are never drawn together, so neither is numbered. Numbering them would put
     a "(2)" on the 1942 sheet with no "(1)" anywhere on it. */
  const perEpoch=await page.evaluate(()=>{
    const out={};
    ['e1930','e1942'].forEach(e=>{
      const n=(JMAP.AIR||[]).filter(r=>!r.epochs||!r.epochs.length
                                       ||r.epochs.indexOf(e)>=0)
        .map(r=>r.shortName);
      out[e]=n.filter((v,i)=>n.indexOf(v)!==i);
    });
    return out;
  });
  check('no two routes drawn on the same date collide',
    perEpoch.e1930.length===0 && perEpoch.e1942.length===0,
    JSON.stringify(perEpoch));
  /* Two pairs share a short name across the two dates and neither is
     numbered, because neither pair is ever drawn together: the 1931 Tokyo–
     Dairen trunk and its 1938–39 replacement, and KNILM's Batavia–Bandoeng as
     the 1931 timetable gives it and as the 1935 route map does. */
  /* Three pairs now. The third is the Yangtze: CNAC flew Shanghai to Hankow
     on the 1930 sheet and the Japanese-run 中華航空 flew the same four towns
     on the 1942 one, which is the point of drawing both — one network
     replaced the other — and they are never on screen together. */
  check('names shared across the two dates are not numbered',
    names.clash.length===3
    && names.clash.indexOf('Tokyo – Dairen')>=0
    && names.clash.indexOf('Batavia – Bandoeng')>=0
    && names.clash.indexOf('Shanghai – Hankow')>=0,
    JSON.stringify(names.clash));
  const planted=await page.evaluate(()=>{
    /* Two lines from Tokyo to Dairen by different roads is a thing the file
       could hold tomorrow; today it does not, so one is made. */
    const a=JMAP.AIR[0];
    const twin=Object.assign({}, a, {id:'twin', stops:a.stops.slice()});
    JMAP.AIR.push(twin);
    JMAP.__airShortNames();
    // the twin shares the 1931 trunk's dates, so those two are the clash
    const out=JMAP.AIR.filter(r=>r.epochs&&r.epochs.indexOf('e1930')>=0
                                 &&r.shortName.indexOf('Tokyo – Dairen')===0)
      .map(r=>r.shortName);
    JMAP.AIR.pop(); JMAP.__airShortNames();
    return out;
  });
  check('and a clash is numbered rather than left to collide',
    planted.length===2 && planted[0]==='Tokyo – Dairen (1)'
    && planted[1]==='Tokyo – Dairen (2)', JSON.stringify(planted));

  const tky=await port('tokyo');
  /* **Which aeroplane, where it matters.** Dropping the route column dropped
     the service with it, and Tokyo–Nagoya was flown twice a day: the two came
     out as four rows differing by nothing a reader could see but the clock.
     The service is named beside the far end, and only on a route that had
     more than one — otherwise seventeen routes carry an empty phrase. */
  check('a corridor flown twice a day says which service each call was',
    /morning/.test(tky.body) && /afternoon/.test(tky.body),
    (tky.body||'').slice(0,140));
  /* A *drawn* one: the first `.air-stop-hit` in the document belongs to the
     1931 trunk, which the 1942 sheet does not draw, and measured zero. */
  check('the ring is a press target a finger can find', await page.evaluate(()=>{
    const h=[...document.querySelectorAll('#air .air-stop-hit')]
      .find(e=>e.getBoundingClientRect().width>0);
    return h ? h.getBoundingClientRect().width >= 14 : false;
  }), 'the drawn ring is 3.4 px across');

  console.log('\n— and a finger opens it too —');
  const phone=await browser.newPage();
  await phone.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const perrs=[]; phone.on('pageerror',e=>perrs.push(String(e)));
  await phone.goto(URL,{waitUntil:'networkidle0'});
  await ready(phone);
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
  /* Back to the whole sheet, and put the card away first. The tap above
     zoomed in to find a stretch of line, so Saipan is not on the screen it
     left behind; and the card it opened covers the foot of a 390px screen,
     which is where Saipan is. A reader closes it before pressing what is
     under it, and so does this. */
  await phone.evaluate(()=>{const c=document.getElementById('info-close');
    if (c) c.click();});
  await phone.evaluate(()=>document.getElementById('zoom-reset').click());
  await sleep(1200);
  const tring=await onRing(phone,'saipan');
  await phone.touchscreen.tap(tring.x, tring.y);
  await sleep(700);
  const tport=await card_(phone);
  check('and a finger on an airport opens that',
    tport.open && tport.chip==='Airport', JSON.stringify(tport).slice(0,140));
  check('the press targets are wider than what is drawn', await phone.evaluate(()=>{
    // drawn ones: the first of each belongs to the 1931 trunk, which this
    // sheet does not draw
    const hit=[...document.querySelectorAll('#air .air-hit')]
      .find(e=>e.getBoundingClientRect().width>0
             || e.getBoundingClientRect().height>0);
    const ring=[...document.querySelectorAll('#air .air-stop-hit')]
      .find(e=>e.getBoundingClientRect().width>0);
    if (!hit || !ring) return false;
    const l=parseFloat(getComputedStyle(hit).strokeWidth);
    const r=ring.getBoundingClientRect().width;
    return l>=12 && r>=14;
  }), 'a 1.7 px line and a 3.4 px ring are not finger-sized');

  /* ============ one pair of cities, several airlines, several lines ======
   *
   * Fifteen routes on the 1942 sheet share a leg with at least one other, and
   * four of them run Shinkyō to Mukden. Drawn on the same line the reader sees
   * one service where the sources give four, in whichever ink was painted
   * last. Each is given a lane and shifted sideways.
   *
   * **The shift is in screen pixels**, which is what this measures: the same
   * four lines at the opening view and six wheel steps in, and the spacing has
   * to be the same both times. Written into the geometry instead it would be a
   * fixed distance on the *ground* — invisible at the widest view and a mile
   * across when zoomed in, which is this project's most-repeated mistake.
   *
   * The lines meet on the airports at either end by design and separate in
   * between, so the spread is measured at the middle of the leg. The minimum
   * distance between two of them is zero wherever they touch down, which is
   * the answer to a different question.
   *
   * The lane also has to be a place on the *ground* rather than a place
   * relative to the heading: `manchuria` runs Shingishū to Shinkyō and
   * `mkkk-harbin-dairen` runs Shinkyō to Mukden, so their normals point
   * opposite ways, and neighbouring lanes put them on the same side and
   * exactly on top of one another. Four lines drew as two. */
  /* ====== every airport with times shows them ======
   *
   * The card matched the head of the stop's name against the timetable's
   * printed station, and the two are written by different hands: `stops.csv`
   * says "Xinjing (Changchun)", the card names the place from the map's own
   * record — Chángchūn — and the timetable prints 新京 Xinjing. Nothing in
   * that chain has to agree, and mostly it did not: **twenty-two of the
   * seventy-five airports on the 1942 sheet showed no times at all**, and six
   * more showed a fraction — Nanking one entry of twelve, Harbin none of ten.
   *
   * It is matched by the call's own stop number now. This walks every airport
   * on both sheets, counts the times the data says it has, opens its card and
   * counts what is in it — because the fault was invisible from inside the
   * code and plain the moment somebody pressed a dot. */
  console.log('\n— every airport with times shows them —');
  for (const ep of ['1930', '1942']) {
    await toEpoch(page, ep);
    await page.evaluate(() => { const a = document.getElementById('air');
      if (!a || getComputedStyle(a).display === 'none')
        document.getElementById('btn-air').click(); });
    await sleep(1500);
    const want = await page.evaluate(() => {
      const vis = r => { const g = document.querySelector('.air-route[data-air="' + r.id + '"]');
        return g && g.style.display !== 'none'; };
      const out = {};
      (JMAP.AIR || []).filter(vis).forEach(r => {
        (r.stops || []).forEach((s2, i) => {
          const k = s2.id || s2.name;
          (r.times || []).filter(t => (+t.seq - 1) === i).forEach(t => {
            const n = ['da', 'dd', 'ua', 'ud'].filter(f => t[f]).length;
            if (n) out[k] = (out[k] || 0) + n;
          });
        });
      });
      return out;
    });
    const empty = [], thin = [];
    for (const k of Object.keys(want)) {
      const box = await page.evaluate(id => {
        const g = document.querySelector('#air [data-air-stop="' + id + '"]');
        if (!g || g.style.display === 'none') return null;
        const r = g.getBoundingClientRect();
        if (!r.width) return null;
        return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
      }, k);
      if (!box) continue;        // not on screen at this view: a different question
      await page.mouse.click(box[0], box[1]); await sleep(200);
      const got = await page.evaluate(() => {
        const i = document.getElementById('info');
        if (i.hidden) return null;
        if ((i.querySelector('.chip') || {}).textContent !== 'Airport') return null;
        return document.querySelectorAll('#info-air .pop-table tbody tr').length;
      });
      await page.keyboard.press('Escape'); await sleep(70);
      if (got === null) continue;
      if (got === 0) empty.push(k + ' (wants ~' + want[k] + ')');
      else if (got < want[k] / 2) thin.push(k + ' ' + got + ' of ~' + want[k]);
    }
    check(ep + ': no airport with times shows an empty table',
      empty.length === 0, empty.slice(0, 12).join(', '));
    check('  and none shows a fraction of what it has',
      thin.length === 0, thin.slice(0, 12).join(', '));
  }
  await toEpoch(page, '1942');

  console.log('\n— several airlines over one pair of cities —');
  {
    const SHARED = ['manchuria', 'keijo-shinkyo',
                    'mkkk-harbin-dairen', 'mkkk-hsinking-shingishu'];
    const atMid = (ids, ka, kb) => page.evaluate((ids, ka, kb) => {
      const svg = document.getElementById('jmap'), m = svg.getScreenCTM();
      const ring = k => { const g = document.querySelector('#air [data-air-stop="' + k + '"]');
        if (!g) return null; const r = g.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      const A = ring(ka), B = ring(kb);
      if (!A || !B) return null;
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const out = {};
      ids.forEach(id => {
        const l = document.querySelector('.air-route[data-air="' + id + '"] .air-line');
        if (!l || getComputedStyle(l.parentNode).display === 'none') { out[id] = null; return; }
        const L = l.getTotalLength();
        let best = null, bd = 1e18;
        for (let i = 0; i <= 1200; i++) {
          const q = l.getPointAtLength(L * i / 1200).matrixTransform(m);
          const d = Math.hypot(q.x - mid.x, q.y - mid.y);
          if (d < bd) { bd = d; best = q; }
        }
        out[id] = { x: best.x, y: best.y };
      });
      return out;
    }, ids, ka, kb);
    const spread = r => {
      const pts = Object.keys(r).map(k => r[k]).filter(Boolean);
      let mn = 1e18, mx = 0;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        mn = Math.min(mn, d); mx = Math.max(mx, d);
      }
      return { n: pts.length, min: Math.round(mn * 100) / 100, max: Math.round(mx * 100) / 100 };
    };
    await toEpoch(page, '1942');
    const wideR = await atMid(SHARED, 'changchun', 'mukden');
    const wide = wideR ? spread(wideR) : null;
    check('all four Shinkyō–Mukden services are drawn separately',
      !!wide && wide.n === 4 && wide.min > 1.2, JSON.stringify(wide));
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => document.getElementById('zoom-in').click());
      await sleep(120);
    }
    await sleep(1600);
    const deepR = await atMid(SHARED, 'changchun', 'mukden');
    const deep = deepR ? spread(deepR) : null;
    check('and still separately six wheel steps in',
      !!deep && deep.n === 4 && deep.min > 1.2, JSON.stringify(deep));
    /* The point of the whole thing: the gap is a distance on screen, so it is
       the same at both zooms. A gap written into the geometry would have grown
       by the ratio of the two views, which is more than tenfold. */
    check('  and the gap is the same on screen at both',
      !!wide && !!deep && Math.abs(wide.max - deep.max) < 1.2,
      (wide && wide.max) + ' px out, ' + (deep && deep.max) + ' px in');
    await page.evaluate(() => document.getElementById('zoom-reset').click());
    await sleep(1200);
  }

  console.log('\n\u2014 the note a route carries \u2014');

  /* **A route note is prose, and it is rendered as prose.**
   *
   * The pane assigned `r.note` with `textContent`, so the emphasis marks the
   * author writes — the same `**…**` every other blurb on this map uses —
   * reached the reader as literal asterisks. Twenty-six cards carried them:
   * every KLM and KNILM line, where the marked sentence is the one that
   * matters ("these are 1938 times, from a brochure printed before the
   * occupation"). It goes through `setProse` now, which builds the nodes with
   * `createElement` and `textContent` rather than markup, so nothing in a data
   * file can inject into the pane.
   *
   * Checked on a card whose note *has* emphasis, because a card without any
   * passes either way and proves nothing. */
  const marked=await page.evaluate(()=>(JMAP.AIR||[])
    .filter(r=>/\*\*/.test(r.note||'')).map(r=>r.id));
  check('some route notes carry emphasis to render', marked.length>0,
    String(marked.length));
  const klm=await openRoute(page,'klm-batavia','Karachi');
  check('a marked note opens its card', !!klm,
    'no press along the KLM trunk opened it');
  if (klm) {
    check('the emphasis is rendered, not printed', klm.noteStars===0,
      klm.noteStars + ' literal asterisks in the note');
    check('and it became a <strong>', klm.noteStrong.length>=1,
      JSON.stringify(klm.noteStrong));
    /* And a blank line in a note is a paragraph break. Two-thought notes — what
       the service was, then what is inferred rather than printed — ran together
       into one block under the default `normal`. */
    check('a blank line in a note is honoured', klm.noteWrap==='pre-line',
      klm.noteWrap);
  }

  check('no page errors', errs.concat(perrs).length===0, errs.concat(perrs).join(' | '));
  await browser.close();
  console.log('\n  '+pass+' passed, '+fail+' failed');
  process.exit(fail?1:0);
})();
