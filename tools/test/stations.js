/* The Taiwan station squares, and the one name at a time they show.
 *
 *     node tools/test/stations.js        # with a server on 8123
 *
 * A square per colonial station, held at a constant size on screen, and no
 * name on any of them until the reader asks for one. The asking is different
 * on the two kinds of pointer and that is the whole of what this checks:
 *
 *   * a mouse hovers, and the name follows the pointer on and off;
 *   * a finger taps, and a second tap on the same square puts the name away.
 *
 * The two have to be tested separately because one tap fires *both* halves of
 * the hover pair — pointerover, pointerenter, pointerdown, pointerout,
 * pointerleave, all inside one tap, because the touch pointer is destroyed the
 * moment the finger lifts. Ungated, the leave wiped out the tap's own name a
 * few milliseconds after it appeared and the tap read as a dead square. So the
 * enter/leave handlers take mouse pointers only and the tap handler takes
 * everything else.
 *
 * A caution for anyone extending this: shut the Layers dialog before pointing
 * at the map. It is modal, it covers the middle of the sheet, and with it open
 * `elementFromPoint` over a station returns the dialog — every hover check
 * then fails for a reason that has nothing to do with the map.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('stations test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};

const TAIWAN='?bbox=119.5,21.5,122.5,25.6';
const URL='http://localhost:8123/index.html'+TAIWAN;

/* Whatever station names are on the sheet right now. The label elements are
   always present; an unasked-for one simply holds no text. */
const names=p=>p.evaluate(()=>{const o=[];
  document.querySelectorAll('#labels text.sta').forEach(t=>{const s=t.textContent.trim(); if(s)o.push(s);});
  return o;});

/* What the card is saying. Hidden fields read as empty, which is what the
   card itself does with them. */
const card=p=>p.evaluate(()=>{
  const b=document.getElementById('info');
  const t=s=>{const e=b.querySelector(s); return e && !e.hidden ? e.textContent.trim() : '';};
  return {hidden:b.hidden, chip:t('.chip'), primary:t('.primary'), alt:t('.alt'),
          own:t('.note-own'), group:t('.note-group')};});

const tip=p=>p.evaluate(()=>{
  const t=document.getElementById('tooltip');
  if(t.hidden) return null;
  return [...t.childNodes].map(n=>(n.textContent||'').trim()).filter(Boolean);});

/* The Other button in the bar — `state.labels`, the switch that writes names
   across the map. */
const otherOn=async p=>{
  await p.evaluate(()=>{const b=document.querySelector('[data-opt="labels"]');
    if(b && b.getAttribute('aria-pressed')!=='true') b.click();});
  await sleep(800);};

/* Turn the two layers on through the real checkboxes, then shut the dialog. */
const turnOn=async p=>{
  await p.evaluate(()=>{
    const r=document.getElementById('opt-tw-rail'), s=document.getElementById('opt-tw-stations');
    if(r&&!r.checked){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));}
    if(s&&!s.checked){s.checked=true;s.dispatchEvent(new Event('change',{bubbles:true}));}
  });
  await sleep(1100);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());});
  await sleep(300);
};

/* The centre of a station square that is well inside the viewport, so a
   pointer sent there is not fighting the edge of the sheet or a legend. */
const aSquare=(p,skip)=>p.evaluate(n=>{
  let seen=0;
  for(const m of document.querySelectorAll('#tw-stations .sta-mark')){
    const r=m.getBoundingClientRect();
    if(!(r.width && r.left>90 && r.right<820 && r.top>140 && r.bottom<860)) continue;
    if(seen++<n) continue;
    return {x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2), w:Math.round(r.width)};
  }
  return null;},skip||0);

(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
const errs=[];

/* ————————————————————————— the mouse ————————————————————————— */
const p=await b.newPage();
await p.setViewport({width:900,height:1000});
await p.evaluateOnNewDocument(SHIM);
p.on('pageerror',e=>errs.push(String(e)));
await p.goto(URL,{waitUntil:'networkidle0'});
await sleep(3200);

console.log('\n— the toggle only exists once the railways are drawn —');
{
  const before=await p.evaluate(()=>{
    const row=document.getElementById('row-tw-stations');
    return {row:!!row, hidden:row?row.hidden:null,
            label:row?row.textContent.trim():null};
  });
  check('the row is in the page', before.row);
  check('and hidden while the railways are off', before.hidden===true);
  check('and reads Show Taiwan Stations', /Show Taiwan Stations/.test(before.label||''),
    before.label);
  const after=await p.evaluate(()=>{
    const r=document.getElementById('opt-tw-rail');
    r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));
    return document.getElementById('row-tw-stations').hidden;
  });
  await sleep(700);
  check('and shows once they are on', after===false);
}

console.log('\n— a square for every station, and not one name —');
await turnOn(p);
{
  const st=await p.evaluate(()=>{
    const g=document.getElementById('tw-stations');
    return {marks:g?g.querySelectorAll('.sta-mark').length:0,
            hits:g?g.querySelectorAll('.sta-hit').length:0,
            shown:g?getComputedStyle(g).display!=='none':false,
            total:(JMAP.TW_STATIONS||[]).length};
  });
  check('one mark per station', st.marks===st.total && st.total>150,
    st.marks+' of '+st.total);
  check('each with a hit target over it', st.hits===st.marks);
  check('the layer is showing', st.shown);
  check('and no station is named yet', (await names(p)).length===0);
}

console.log('\n— the hit target is bigger than the square it covers —');
{
  const sz=await p.evaluate(()=>{
    const m=document.querySelector('#tw-stations .sta-mark');
    const sq=m.querySelector('.sta-sq').getBoundingClientRect();
    const hit=m.querySelector('.sta-hit').getBoundingClientRect();
    return {sq:Math.round(sq.width), hit:Math.round(hit.width)};
  });
  check('the square reads as a stop, not a town', sz.sq>=4 && sz.sq<=7, sz.sq+'px');
  check('and the target is forgiving', sz.hit>=sz.sq*1.8, sz.hit+'px over '+sz.sq+'px');
}

console.log('\n— pointing at one raises the box and letters nothing —');
{
  const t=await aSquare(p);
  check('there is a square to point at', !!t);
  const el=await p.evaluate(({x,y})=>{
    const e=document.elementFromPoint(x,y);
    return e?(e.getAttribute('class')||e.tagName):null;},t);
  check('and the pointer reaches it', el==='sta-hit'||el==='sta-sq', 'got '+el);
  await p.mouse.move(t.x-60,t.y-60); await sleep(200);
  await p.mouse.move(t.x,t.y,{steps:8}); await sleep(500);
  check('the floating box comes up', !!(await tip(p)));
  /* And no white label under the square. The box already says the name, the
     other reading, the characters and what the place was; a label repeating
     the first line of that a few pixels below was the same word twice. */
  check('and nothing is lettered on the map', (await names(p)).length===0,
    JSON.stringify(await names(p)));
  await p.mouse.move(20,20,{steps:8}); await sleep(400);
  check('the box goes when the pointer does', (await tip(p))===null);
}

console.log('\n— and the squares go when the layer does —');
{
  await p.evaluate(()=>{const s=document.getElementById('opt-tw-stations');
    s.checked=false; s.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(600);
  check('the squares go',
    (await p.evaluate(()=>getComputedStyle(document.getElementById('tw-stations'))
      .display))==='none');
}

/* ————————————————————————— a finger ————————————————————————— */
console.log('\n— a finger, which has no hover at all —');
const q=await b.newPage();
await q.setViewport({width:900,height:1000,isMobile:true,hasTouch:true});
q.on('pageerror',e=>errs.push(String(e)));
await q.goto(URL,{waitUntil:'networkidle0'});
await sleep(3200);
await turnOn(q);
{
  const t=await aSquare(q);
  check('there is a square to tap', !!t);
  await q.touchscreen.tap(t.x,t.y); await sleep(700);
  const c1=await card(q);
  check('a tap opens the card', c1.hidden===false, JSON.stringify(c1.primary));
  check('and marks the square it opened on',
    (await q.evaluate(()=>document.querySelectorAll('#tw-stations .sta-mark.sel').length))===1);
  check('and still letters nothing', (await names(q)).length===0);
  await q.touchscreen.tap(t.x,t.y); await sleep(700);
  check('a second tap on the same one closes it', (await card(q)).hidden===true);

  /* Two different squares: the second tap should move the card, not stack. */
  const a=await aSquare(q,0), d=await aSquare(q,4);
  check('two different squares to work with', a && d && (a.x!==d.x||a.y!==d.y));
  await q.touchscreen.tap(a.x,a.y); await sleep(600);
  const first=(await card(q)).primary;
  await q.touchscreen.tap(d.x,d.y); await sleep(600);
  const second=await card(q);
  check('tapping another moves the card', second.hidden===false);
  check('and it names a different station', second.primary!==first,
    first+' then '+second.primary);
}

/* ————————————————— what a station says ————————————————— */
console.log('\n— hovering one says the same things every other unit says —');
{
  /* A page of its own. The section above deliberately leaves the layer
     switched off, and re-navigating the same tab did not put the view back
     where the bbox asks for it — the map restores what the reader was looking
     at, which is right for a reader and wrong for a test that wants a known
     starting frame. */
  await p.mouse.move(5,5); await sleep(150);
  await turnOn(p);
  const t=await aSquare(p);
  if(!t) throw new Error('no station square in view');
  await p.mouse.move(t.x-70,t.y-70); await sleep(200);
  await p.mouse.move(t.x,t.y,{steps:8}); await sleep(600);
  const lines=await tip(p);
  check('the tooltip comes up', !!lines && lines.length>=2, JSON.stringify(lines));
  check('with a name at the top', !!(lines&&lines[0]&&lines[0].length), JSON.stringify(lines&&lines[0]));
  check('the characters under it', !!(lines&&lines.some(l=>/[\u4e00-\u9fff]/.test(l))),
    JSON.stringify(lines));
  check('and the ground it stood on', !!(lines&&lines.some(l=>/^A (station|halt|temporary halt|goods yard) /.test(l))),
    JSON.stringify(lines));
}

console.log('\n— and clicking one opens the card —');
{
  const t=await aSquare(p);
  await p.mouse.move(t.x,t.y,{steps:4}); await sleep(300);
  await p.mouse.down(); await p.mouse.up(); await sleep(700);
  const c=await card(p);
  check('the card is open', c.hidden===false);
  check('the chip says what kind of stop it was', /^(Railway station|Railway halt|Temporary halt|Goods yard)$/.test(c.chip), c.chip);
  check('the headline is the name alone', c.primary.length>0 && c.primary.length<40, c.primary);
  check('the other script is on its own line', /[\u4e00-\u9fff]/.test(c.alt), c.alt);
  /* The alt line takes one field per language everywhere else on the map, and
     for a station the Japanese and the Chinese are the same characters — so
     it printed the same name twice, once with the reading in brackets. */
  check('and not the same name twice', c.alt.split('·').length===1, c.alt);
  check('the short line is the ground it stood on', /^A (station|halt|temporary halt|goods yard) in /.test(c.own), c.own.slice(0,60));
  check('the selected square is marked',
    (await p.evaluate(()=>document.querySelectorAll('#tw-stations .sta-mark.sel').length))===1);
}

console.log('\n— a key station carries prose, and the rest do not —');
{
  const counts=await p.evaluate(()=>{
    const all=JMAP.TW_STATIONS||[];
    return {total:all.length, short:all.filter(s=>s.short).length,
            note:all.filter(s=>s.note).length};});
  check('every station has a short line', counts.short===counts.total,
    counts.short+' of '+counts.total);
  check('and only some have a note', counts.note>10 && counts.note<counts.total/4,
    counts.note+' of '+counts.total);
  // Takao: the southern end of the trunk line, and one of the ones with prose
  const takao=await p.evaluate(()=>{
    const r=(JMAP.TW_STATIONS||[]).find(s=>s.han==='\u9ad8\u96c4');
    if(!r) return null;
    const m=document.querySelector('[data-id="'+r.id+'"]');
    if(!m) return null;
    const b=m.getBoundingClientRect();
    return {id:r.id, x:Math.round(b.left+b.width/2), y:Math.round(b.top+b.height/2)};});
  check('Takao is on the map', !!takao);
  if(takao && takao.x>0 && takao.y>0 && takao.x<900 && takao.y<1000){
    await p.mouse.move(takao.x,takao.y,{steps:6}); await sleep(300);
    await p.mouse.down(); await p.mouse.up(); await sleep(700);
    const c=await card(p);
    check('and its card carries the long note', c.group.length>150, c.group.slice(0,60));
    check('with the short line still above it', /^A station in /.test(c.own), c.own.slice(0,40));
  }
}

console.log('\n— with Other on, the names wait for the zoom —');
{
  const far=await b.newPage();
  await far.setViewport({width:1100,height:900});
  await far.evaluateOnNewDocument(SHIM);
  far.on('pageerror',e=>errs.push(String(e)));
  await far.goto('http://localhost:8123/index.html?bbox=119.5,21.5,122.5,25.6',{waitUntil:'networkidle0'});
  await sleep(3000);
  await turnOn(far);
  await otherOn(far);
  check('the whole island in view names nothing', (await names(far)).length===0);
  await far.goto('http://localhost:8123/index.html?bbox=120.8,24.3,121.3,24.7',{waitUntil:'networkidle0'});
  await sleep(3000);
  await turnOn(far);
  check('and still nothing before Other is pressed', (await names(far)).length===0);
  await otherOn(far);
  const near=await names(far);
  check('half a degree of latitude in view names them', near.length>50, near.length+' named');
  const drawn=await far.evaluate(()=>{
    let n=0;
    document.querySelectorAll('#labels text.sta').forEach(t=>{
      if(!t.textContent.trim()) return;
      const cs=getComputedStyle(t);
      if(cs.display!=='none' && cs.visibility!=='hidden' && +cs.opacity>0.05) n++;});
    return n;});
  check('though the placer still drops the ones that would collide',
    drawn>5 && drawn<near.length, drawn+' of '+near.length+' actually drawn');
  /* One name, not the pair. The label used to read `Nántóu (Nantō)`, which
     beside a card that already gives the other reading was the same fact a
     third time and the longest thing on that part of the map. */
  check('and each label carries one name, not two',
    near.every(n=>!/\(/.test(n)), JSON.stringify(near.slice(0,3)));
  /* A junction is in the Korean source once per line, at one coordinate. Left
     as they arrive that is three squares on one spot and one name lettered
     three times, which is what a reader saw at Iri. */
  const stacked=await far.evaluate(()=>{
    const seen={}; let n=0;
    document.querySelectorAll('.sta-layer .sta-mark').forEach(m=>{
      if(m.style.display==='none') return;
      const t=m.getAttribute('transform')||'';
      if(seen[t]) n++; else seen[t]=1;});
    return n;});
  check('and no two squares are stacked on one spot', stacked===0, stacked+' stacked');
  await far.close();
}

/* ————————————————————————— Korea ————————————————————————— */
console.log('\n— Korea: the same machinery, a different pair of names —');
{
  const k=await b.newPage();
  await k.setViewport({width:1100,height:950});
  await k.evaluateOnNewDocument(SHIM);
  k.on('pageerror',e=>errs.push(String(e)));
  await k.goto('http://localhost:8123/index.html?bbox=125.0,34.5,130.0,38.5',{waitUntil:'networkidle0'});
  await sleep(3000);

  check('the row is hidden until the railways are on',
    (await k.evaluate(()=>document.getElementById('row-kr-stations').hidden))===true);
  check('and it sits beside the railway switch, not under it',
    (await k.evaluate(()=>{
      const row=document.getElementById('row-kr-stations');
      return !!(row.parentNode && row.parentNode.classList.contains('pair')
                && row.parentNode.querySelector('#opt-kr-rail'));})));
  await k.evaluate(()=>{const r=document.getElementById('opt-kr-rail');
    r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(900);
  check('the railway draws one path for the date shown',
    (await k.evaluate(()=>[...document.querySelectorAll('#kr-rail path')]
      .filter(e=>e.style.display!=='none').length))===1);
  check('and the station row appears with it',
    (await k.evaluate(()=>document.getElementById('row-kr-stations').hidden))===false);

  /* Nothing is built until it is asked for. Eleven hundred groups and eleven
     hundred label entries across the two systems is not a thing to hand a
     reader who never opens the Transport panel. */
  check('no squares are built before the switch is touched',
    (await k.evaluate(()=>!document.getElementById('kr-stations'))));
  await k.evaluate(()=>{const s=document.getElementById('opt-kr-stations');
    s.checked=true; s.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(1400);
  await k.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await sleep(400);
  const built=await k.evaluate(()=>({
    total:(JMAP.KR_STATIONS||[]).length,
    marks:document.querySelectorAll('#kr-stations .sta-mark').length,
    shown:[...document.querySelectorAll('#kr-stations .sta-mark')]
      .filter(m=>m.style.display!=='none').length}));
  /* 850 and not the source's 918: a junction is in the source once per line,
     at the same coordinate under a different id — Iri three times, on the
     Honam, the Jeolla and the Gunsan — and they are merged into one station
     that knows all its lines. 55 junctions out of 123 rows. */
  check('one mark per station in the table', built.marks===built.total && built.total>800,
    built.marks+' of '+built.total);
  check('and the source\'s repeated junctions are merged away',
    built.total < 918 && built.total > 820, built.total+' from 918 rows');
  /* The two files are the same 918 stations; a station that did not exist at
     that date carries a null geometry rather than being absent, and 282 of
     them are null in 1930. */
  check('and only the ones that stood in 1930 are drawn',
    built.shown>500 && built.shown<built.total, built.shown+' of '+built.total);

  const t=await k.evaluate(()=>{
    for(const m of document.querySelectorAll('#kr-stations .sta-mark')){
      if(m.style.display==='none') continue;
      const r=m.getBoundingClientRect();
      if(r.width && r.left>100 && r.right<1000 && r.top>200 && r.bottom<800)
        return {id:m.getAttribute('data-id'),
                x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2)};}
    return null;});
  check('there is a square to point at', !!t);
  if(t){
    await k.mouse.move(t.x-70,t.y-70); await sleep(200);
    await k.mouse.move(t.x,t.y,{steps:8}); await sleep(600);
    const mr=await tip(k);
    check('with Japanese names off the headline is McCune-Reischauer',
      !!mr && /^[A-Z][A-Za-z\u02bb\u2019'\- ]+$/.test(mr[0]), JSON.stringify(mr&&mr[0]));
    check('the hanja is under it', !!(mr&&mr.some(l=>/[\u4e00-\u9fff]/.test(l))),
      JSON.stringify(mr));
    check('and the line it stood on is said',
      !!(mr&&mr.some(l=>/^A (station on|junction of) the /.test(l))), JSON.stringify(mr));

    await k.mouse.down(); await k.mouse.up(); await sleep(700);
    const c=await card(k);
    check('the card opens on it', c.hidden===false);
    check('with the hanja and the hangul under the headline',
      /[\u4e00-\u9fff]/.test(c.alt) && /[\uac00-\ud7af]/.test(c.alt), c.alt);

    /* The whole point of the switch: the same station, read the other way. */
    const before=(await tip(k)||[])[0] || c.primary;
    await k.evaluate(()=>{const j=document.getElementById('opt-jpnames');
      if(j&&!j.checked){j.checked=true; j.dispatchEvent(new Event('change',{bubbles:true}));}});
    await sleep(700);
    await k.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
    await k.mouse.move(5,5); await sleep(200);
    await k.mouse.move(t.x,t.y,{steps:6}); await sleep(500);
    const jp=await tip(k);
    check('and with Japanese names on it is the Japanese reading',
      !!jp && jp[0] !== before, before+' then '+(jp&&jp[0]));
    check('with the hanja still under it', !!(jp&&jp.some(l=>/[\u4e00-\u9fff]/.test(l))),
      JSON.stringify(jp));
  }

  console.log('\n— and the 1942 map has the stations 1930 did not —');
  {
    const was=await k.evaluate(()=>[...document.querySelectorAll('#kr-stations .sta-mark')]
      .filter(m=>m.style.display!=='none').length);
    await k.evaluate(()=>{const btn=[...document.querySelectorAll('#epoch-seg button')]
      .find(x=>/1942/.test(x.textContent)); if(btn) btn.click();});
    await sleep(1800);
    const now=await k.evaluate(()=>[...document.querySelectorAll('#kr-stations .sta-mark')]
      .filter(m=>m.style.display!=='none').length);
    check('more stations stand in 1942 than in 1930', now>was, was+' then '+now);
    check('and the railway still draws one path for the date',
      (await k.evaluate(()=>[...document.querySelectorAll('#kr-rail path')]
        .filter(e=>e.style.display!=='none').length))===1);
  }
  await k.close();
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
