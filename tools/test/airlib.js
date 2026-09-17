/* What the two air-route scripts share: how to find a line on the screen,
 * press it, and read the card it opens. `air.js` holds the routes and the
 * cards; `airlines.js` the menus, the names and the notes. One file, so a
 * press that has to be taught something new is taught it once.
 */
const { sleep, until } = require('./settle.js');

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

/* **A line's points, and it may be several subpaths.**
 *
 * `d.slice(1).split('L')` assumed one `M` at the front, which was true when
 * every route was drawn as one unbroken chain. It is not now: a route leaves a
 * gap where another owns the shared leg, and a grounded stretch is drawn
 * separately — so the string is `M…L…M…L…` and splitting on L alone yields
 * "4M5" and a NaN that reaches `createSVGPoint` as a non-finite y. */
const dPoints = d => String(d || '').split(/(?=[ML])/)
  .map(s => s.replace(/^[ML]/, '').trim())
  .filter(Boolean)
  .map(s => s.split(/[\s,]+/).map(Number))
  .filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1]));

const onLine=(p,id)=>p.evaluate(i=>{
  const svg=document.getElementById('jmap'), m=svg.getScreenCTM();
  const d=document.querySelector('.air-route[data-air="'+i+'"] .air-line').getAttribute('d');
  const pts=String(d||'').split(/(?=[ML])/).map(s=>s.replace(/^[ML]/,'').trim())
    .filter(Boolean).map(s=>s.split(/[\s,]+/).map(Number))
    .filter(a=>a.length>=2&&isFinite(a[0])&&isFinite(a[1]));
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
  // the date takes on the press itself; the wait is for the button to say so
  await until(p, t=>{const b=[...document.querySelectorAll('#epoch-seg button')]
    .find(x=>new RegExp(t).test(x.textContent)); return !!b && b.getAttribute('aria-pressed')==='true';},
    y, {timeout:5000}).catch(()=>{});
  await sleep(400);
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
      /* `.air-hit` rather than `.air-line`: the hit path is every leg the route
         draws, faint ones included, and a route can now be faint over most of
         its length — the KLM trunk is grounded from Rangoon, so Bandoeng is
         not on the lit path at all. */
      const el=document.querySelector('.air-route[data-air="'+i+'"] .air-hit');
      if(!el) return [];
      const raw=String(el.getAttribute('d')||'').split(/(?=[ML])/)
        .map(s=>s.replace(/^[ML]/,'').trim()).filter(Boolean)
        .map(s=>s.split(/[\s,]+/).map(Number))
        .filter(a=>a.length>=2&&isFinite(a[0])&&isFinite(a[1]));
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
      /* **A press on a stretch several services share opens the chooser, not a
         card.** That is the point of the chooser; for a helper that wants one
         named route it is one more step, and taking it exercises the menu as
         well as the card. */
      const picked=await p.evaluate(i=>{
        const b=document.querySelector('#jmap-menu.air-chooser [data-air-pick="'+i+'"]');
        if(!b) return false;
        b.click(); return true;
      }, id);
      if(picked) await sleep(400);
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

module.exports = { lineSpot, dPoints, onLine, onRing, toEpoch, drawn, openRoute, card_ };
