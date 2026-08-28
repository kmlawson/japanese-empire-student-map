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
  document.querySelectorAll('#labels text.twsta').forEach(t=>{const s=t.textContent.trim(); if(s)o.push(s);});
  return o;});

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
  for(const m of document.querySelectorAll('#tw-stations .twsta-mark')){
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
    return {marks:g?g.querySelectorAll('.twsta-mark').length:0,
            hits:g?g.querySelectorAll('.twsta-hit').length:0,
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
    const m=document.querySelector('#tw-stations .twsta-mark');
    const sq=m.querySelector('.twsta-sq').getBoundingClientRect();
    const hit=m.querySelector('.twsta-hit').getBoundingClientRect();
    return {sq:Math.round(sq.width), hit:Math.round(hit.width)};
  });
  check('the square reads as a stop, not a town', sz.sq>=4 && sz.sq<=7, sz.sq+'px');
  check('and the target is forgiving', sz.hit>=sz.sq*1.8, sz.hit+'px over '+sz.sq+'px');
}

console.log('\n— pointing at one names it, and only it —');
{
  const t=await aSquare(p);
  check('there is a square to point at', !!t);
  const el=await p.evaluate(({x,y})=>{
    const e=document.elementFromPoint(x,y);
    return e?(e.getAttribute('class')||e.tagName):null;},t);
  check('and the pointer reaches it', el==='twsta-hit'||el==='twsta-sq', 'got '+el);
  await p.mouse.move(t.x-60,t.y-60); await sleep(200);
  await p.mouse.move(t.x,t.y,{steps:8}); await sleep(500);
  const on=await names(p);
  check('hovering names exactly one station', on.length===1, JSON.stringify(on));
  check('and the name carries both readings', /\(/.test(on[0]||''), on[0]);
  await p.mouse.move(20,20,{steps:8}); await sleep(500);
  check('moving off puts it away', (await names(p)).length===0);
}

console.log('\n— and the name never survives the layer going off —');
{
  const t=await aSquare(p);
  await p.mouse.move(t.x,t.y,{steps:6}); await sleep(450);
  check('a name is showing to begin with', (await names(p)).length===1);
  await p.evaluate(()=>{const s=document.getElementById('opt-tw-stations');
    s.checked=false; s.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(600);
  const off=await p.evaluate(()=>({
    shown:getComputedStyle(document.getElementById('tw-stations')).display!=='none'}));
  check('the squares go', off.shown===false);
  check('and the name with them', (await names(p)).length===0);
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
  check('no name before anything is touched', (await names(q)).length===0);
  const t=await aSquare(q);
  check('there is a square to tap', !!t);
  await q.touchscreen.tap(t.x,t.y); await sleep(600);
  const one=await names(q);
  check('a tap names it', one.length===1, JSON.stringify(one));
  await q.touchscreen.tap(t.x,t.y); await sleep(600);
  check('and a second tap puts it away', (await names(q)).length===0);

  /* Two different squares: the second tap should move the name, not add one. */
  const a=await aSquare(q,0), c=await aSquare(q,4);
  check('two different squares to work with', a && c && (a.x!==c.x||a.y!==c.y));
  await q.touchscreen.tap(a.x,a.y); await sleep(500);
  const first=(await names(q))[0];
  await q.touchscreen.tap(c.x,c.y); await sleep(500);
  const second=await names(q);
  check('tapping another moves the name', second.length===1, JSON.stringify(second));
  check('and it is a different one', second[0]!==first, first+' then '+second[0]);
}

check('no page errors', errs.length===0, errs[0]);
console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
