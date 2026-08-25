/* Short note against long description, the menu of dashes, and a point of no
   weight — with a mouse and then with a finger, because the card is opened
   from two different places in the code and only one of them is the tap. */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('annotation tests: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
const press=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await sleep(70);await p.mouse.up();await sleep(300);};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };
const STORE=()=>JSON.parse(window.localStorage.getItem('jem-annotations-v1')||'{"f":[]}').f;
const CARD=()=>{const i=document.querySelector('#info');
  return {open:!i.hidden, title:i.querySelector('.primary').textContent,
          alt:i.querySelector('.alt').textContent, note:i.querySelector('.note-own').textContent};};
const MARK=()=>{const g=document.querySelector('#annotations .ann-mark');
  const r=g.getBoundingClientRect(); return {x:Math.round((r.left+r.right)/2),y:Math.round((r.top+r.bottom)/2)};};
const arm=async(p,t)=>p.evaluate(t=>{const b=document.querySelector('.ann-tool[data-tool="'+t+'"]');
  if(b.getAttribute('aria-pressed')!=='true') b.click();},t);
const putAway=async p=>{await p.evaluate(()=>{const t=document.querySelector('.ann-tool[aria-pressed="true"]'); if(t) t.click();}); await sleep(400);};
const put=async(p,id,v)=>p.evaluate((i,val)=>{const el=document.querySelector(i);
  el.value=val; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));},id,v);
async function open(touch){
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
  const p=await b.newPage(); p.__b=b;
  await p.setViewport(touch?{width:414,height:860,isMobile:true,hasTouch:true,deviceScaleFactor:2}
                           :{width:1500,height:950});
  if(!touch) await p.evaluateOnNewDocument(SHIM);
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html',{waitUntil:'networkidle0'}); await sleep(3500);
  await p.evaluate(()=>document.querySelector('#ann-create').click()); await sleep(1500);
  return p;
}
const LONG='On the evening of 18 September 1931 a small charge was set off beside the South Manchuria Railway, and the Kwantung Army used it as its pretext for taking the whole of Manchuria.';

(async()=>{
console.log('\n— a short note for the pointer, the description for the card —');
{ const p=await open(false);
  await arm(p,'point'); await press(p,700,450);
  await put(p,'#ann-title','Mukden');
  await put(p,'#ann-short','Where the incident began');
  await put(p,'#ann-desc',LONG);
  await sleep(600);
  check('the short note is kept apart from the description',
    (await p.evaluate(STORE))[0].properties['jem-short']==='Where the incident began');
  check('and the description is kept too',
    /Kwantung Army/.test((await p.evaluate(STORE))[0].properties.description));
  await putAway(p);
  const at=await p.evaluate(MARK);
  await p.mouse.move(300,250); await sleep(150); await p.mouse.move(at.x,at.y); await sleep(500);
  const tip=await p.evaluate(()=>document.getElementById('tooltip').textContent);
  check('the pointer shows the name and the short note',
    /Mukden/.test(tip)&&/Where the incident began/.test(tip), JSON.stringify(tip));
  check('and not the long one', !/Kwantung Army/.test(tip), JSON.stringify(tip));
  /* A mouse takes a mark on the press, so this click never reaches `tap` —
     the map has already written it off as a handle. It is `drop` that has to
     notice a press which never moved. */
  await press(p,at.x,at.y); await sleep(400);
  const card=await p.evaluate(CARD);
  check('a click opens the card', card.open, JSON.stringify(card).slice(0,100));
  check('with the name in it', card.title==='Mukden', card.title);
  check('and the long description', /Kwantung Army/.test(card.note), card.note.slice(0,50));
  check('the short note is the subtitle, not the long one',
    /incident/.test(card.alt)&&!/Kwantung/.test(card.alt), card.alt);
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.__b.close(); }

console.log('\n— a menu of dashes for lines —');
{ const p=await open(false);
  await arm(p,'line');
  await press(p,500,600); await press(p,650,660); await press(p,800,620);
  await p.evaluate(()=>document.querySelector('#ann-finish').click()); await sleep(400);
  const opts=await p.evaluate(()=>[...document.querySelectorAll('#ann-dash option')].map(o=>o.value));
  const tag=await p.evaluate(()=>document.querySelector('#ann-dash').tagName);
  check('six line styles offered, from a menu and not a checkbox',
    opts.length===6&&tag==='SELECT', tag+': '+opts.join(','));
  const seen=new Set();
  for (const d of opts) {
    await put(p,'#ann-dash',d); await sleep(280);
    const got=await p.evaluate(()=>{const s=[...document.querySelectorAll('#annotations .ann-shape')].pop();
      return s.getAttribute('stroke-dasharray')||'(none)';});
    seen.add(got);
    console.log('    '+(d||'solid').padEnd(10)+' → '+got);
  }
  check('each one draws a different pattern', seen.size===opts.length, [...seen].join(' | '));
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.__b.close(); }

console.log('\n— a point of no weight —');
{ const p=await open(false);
  await arm(p,'point'); await press(p,900,400);
  await put(p,'#ann-size','0');
  await put(p,'#ann-title','Just a name');
  await sleep(600);
  const w=await p.evaluate(STORE);
  check('the weight is recorded as 0', w[w.length-1].properties['stroke-width']===0,
    String(w[w.length-1].properties['stroke-width']));
  check('nothing visible is drawn for it',
    await p.evaluate(()=>[...document.querySelectorAll('#annotations .ann-mark')]
      .some(g=>g.querySelector('.ann-ghost')||g.classList.contains('ann-ghost'))));
  check('its name is still written on the map',
    await p.evaluate(()=>[...document.querySelectorAll('#ann-labels .ann-label')]
      .some(t=>t.textContent==='Just a name')));
  await putAway(p);
  await p.mouse.move(300,250); await sleep(150); await p.mouse.move(900,400); await sleep(500);
  check('and it can still be pointed at',
    /Just a name/.test(await p.evaluate(()=>document.getElementById('tooltip').textContent)),
    await p.evaluate(()=>document.getElementById('tooltip').textContent));
  check('no page errors', p.__errs.length===0, p.__errs[0]);
  await p.__b.close(); }

console.log('\n— the card, with a finger —');
{ const p=await open(true);
  await arm(p,'point'); await press(p,200,300);
  await put(p,'#ann-title','Mukden');
  await put(p,'#ann-short','Where the incident began');
  await put(p,'#ann-desc',LONG);
  await sleep(600);
  await putAway(p);
  const at=await p.evaluate(MARK);
  await press(p,at.x,at.y);
  const card=await p.evaluate(CARD);
  check('a tap opens the card', card.open, JSON.stringify(card).slice(0,100));
  check('with the name in it', card.title==='Mukden', card.title);
  check('and the long description', /Kwantung Army/.test(card.note), card.note.slice(0,50));
  // and the hold must still move it, which is the other thing a press can mean.
  // Re-measure first: on a phone the card is a bottom sheet, so opening it
  // shrinks the map and the mark is no longer where it was pressed.
  /* Wait for it to stop moving first. The card is a bottom sheet, so opening
     it resizes the map and the mark slides for a frame or two; measuring into
     that gap put the press beside the mark rather than on it, and the case
     failed about one run in three. */
  var at2=await p.evaluate(MARK);
  for (let i=0;i<12;i++) { await sleep(220);
    const now=await p.evaluate(MARK);
    if (now.x===at2.x && now.y===at2.y) break;
    at2=now; }
  const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('jem-annotations-v1')).f[0].geometry.coordinates.slice());
  await p.mouse.move(at2.x,at2.y); await p.mouse.down(); await sleep(800);
  await p.mouse.move(at2.x+40,at2.y+30,{steps:8}); await sleep(200); await p.mouse.up(); await sleep(600);
  const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('jem-annotations-v1')).f[0].geometry.coordinates.slice());
  check('and a long press still moves it', before[0]!==after[0]||before[1]!==after[1], before+' → '+after);
  check('no page errors on touch', p.__errs.length===0, p.__errs[0]);
  await p.__b.close(); }

console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail);})();
