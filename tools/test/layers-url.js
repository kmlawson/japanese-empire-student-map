/* Every layer setting survives the `layers=` code in a link.
 *
 *     node tools/test/layers-url.js        # with a server on 8123
 *
 * The code is a base-36 bitfield and it has grown a bit at a time — the
 * occupation source is now three-valued, the two client states and the East
 * Asia frame start *on* and so are stored inverted, and the single colour is
 * new. A bit written and not read, or read at the wrong offset, is silent: the
 * link opens, the map looks plausible, and one setting is quietly wrong. So
 * every one of them is set to its non-default, packed, opened in a fresh page
 * and read back.
 */
const puppeteer=(function(){const t=[];if(process.env.PUPPETEER_PATH)t.push(process.env.PUPPETEER_PATH);t.push('puppeteer');
  for(const x of t){try{return require(x);}catch(e){}}
  console.error('layers-url test: puppeteer not found.');process.exit(1);})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SHIM=()=>{const o=window.matchMedia;window.matchMedia=q=>(/hover:\s*hover|pointer:\s*fine/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:o.call(window,q));};
let pass=0,fail=0; const check=(n,c,d)=>{ if(c){pass++;console.log('  ok   '+n);} else {fail++;console.log('  FAIL '+n+(d?' — '+d:''));} };

/* Everything the code carries, as it appears in the interface. Each is set to
   the opposite of its default, so a bit that is dropped shows up as a value
   that fell back rather than as one that happened to agree. */
const SETTINGS = [
  ['epoch',     p=>p.evaluate(()=>{const t=[...document.querySelectorAll('#epoch-seg button')]
                  .find(x=>/1942/.test(x.textContent)); t.click();}),
                p=>p.evaluate(()=>document.querySelector('#epoch-seg button.on').textContent.trim()), 'Dec 1942'],
  ['cities',    p=>toggle(p,'Cities'),      p=>barOn(p,'Cities'),      false],
  ['events',    p=>toggle(p,'Events'),      p=>barOn(p,'Events'),      false],
  ['admin',     p=>toggle(p,'Administrative'), p=>barOn(p,'Administrative'), false],
  ['labels',    p=>toggle(p,'Other'),       p=>barOn(p,'Other'),       true],
  ['extent',    p=>box(p,'#opt-extent',false),  p=>boxIs(p,'#opt-extent'),  false],
  ['rivers',    p=>box(p,'#opt-rivers',false),  p=>boxIs(p,'#opt-rivers'),  false],
  ['india',     p=>box(p,'#opt-india-rivers',true), p=>boxIs(p,'#opt-india-rivers'), true],
  ['graticule', p=>box(p,'#opt-graticule',true), p=>boxIs(p,'#opt-graticule'), true],
  ['projection',p=>radio(p,'#proj-laea'),    p=>p.evaluate(()=>document.querySelector('#proj-laea').checked), true],
  ['occ source',p=>radio(p,'#occ-nca'),      p=>p.evaluate(()=>document.querySelector('#occ-nca').checked), true],
  ['base areas',p=>box(p,'#opt-ccp',false),  p=>boxIs(p,'#opt-ccp'),   false],
  ['manchukuo', p=>box(p,'#opt-manchukuo',false), p=>boxIs(p,'#opt-manchukuo'), false],
  ['mengjiang', p=>box(p,'#opt-mengjiang',false), p=>boxIs(p,'#opt-mengjiang'), false],
  ['one colour',p=>box(p,'#opt-mono',true),  p=>boxIs(p,'#opt-mono'),  true],
  ['whole map', p=>box(p,'#opt-world',false),p=>boxIs(p,'#opt-world'), false],
];
const toggle=(p,label)=>p.evaluate(l=>{const b=[...document.querySelectorAll('#layer-seg button')]
  .find(x=>x.getAttribute('aria-label')===l); if(b) b.click();},label);
const barOn=(p,label)=>p.evaluate(l=>{const b=[...document.querySelectorAll('#layer-seg button')]
  .find(x=>x.getAttribute('aria-label')===l); return !!b && b.classList.contains('on');},label);
const box=(p,sel,v)=>p.evaluate((s,val)=>{const e=document.querySelector(s);
  if(e.checked!==val){ e.checked=val; e.dispatchEvent(new Event('change',{bubbles:true})); }},sel,v);
const boxIs=(p,sel)=>p.evaluate(s=>document.querySelector(s).checked,sel);
const radio=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);
  e.checked=true; e.dispatchEvent(new Event('change',{bubbles:true}));},sel);

const open=async(b,url)=>{const p=await b.newPage(); await p.setViewport({width:1500,height:950});
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(url||'http://localhost:8123/index.html',{waitUntil:'networkidle0'});
  await p.waitForFunction(()=>document.querySelectorAll('#land .atom').length>0,{polling:'raf',timeout:25000});
  await sleep(900);
  await p.evaluate(()=>document.querySelector('#btn-options').click()); await sleep(400);
  return p;};

(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox'],protocolTimeout:180000});
console.log('\n— every layer setting, out and back through the URL —');
const p=await open(b);
for (const [name,set] of SETTINGS) { await set(p); await sleep(500); }
await sleep(1800);
const url=await p.evaluate(()=>location.href);
const code=(/[?&]layers=([^&#]+)/.exec(url)||[])[1];
console.log('    layers=' + code);
check('the address carries a layers code', !!code, url.slice(0,80));
const before={};
for (const [name,,read] of SETTINGS) before[name]=await read(p);
await p.close();

const q=await open(b,url);
let wrong=[];
for (const [name,,read,want] of SETTINGS) {
  const got=await read(q);
  if (JSON.stringify(got)!==JSON.stringify(before[name])) wrong.push(name+': '+JSON.stringify(before[name])+' → '+JSON.stringify(got));
  check('  '+name, JSON.stringify(got)===JSON.stringify(before[name]),
    JSON.stringify(before[name])+' → '+JSON.stringify(got));
}
check('nothing was dropped', wrong.length===0, wrong.join(' | '));
/* And an address written before any of these bits existed still means what it
   meant: an absent bit is the default, which is why the three that start on
   are stored inverted. */
const old=await open(b,'http://localhost:8123/index.html?layers=1f');
check('a code from before these settings still opens sensibly',
  await boxIs(old,'#opt-manchukuo') && await boxIs(old,'#opt-mengjiang')
  && await boxIs(old,'#opt-world') && !(await boxIs(old,'#opt-mono')),
  JSON.stringify({man:await boxIs(old,'#opt-manchukuo'), men:await boxIs(old,'#opt-mengjiang'),
                  world:await boxIs(old,'#opt-world'), mono:await boxIs(old,'#opt-mono')}));
/* The collision this file existed to prevent, found the day a reader's link
   opened cropped to East Asia. Two pairs of settings had been written to the
   SAME bit — world and the Japanese-names switch both to 4194304, hiding the
   occupation and the relief both to 262144 — so flipping one silently flipped
   the other for whoever opened the link. Each pair is checked one way and
   then the other, straight off the parsed state, because the pairing is
   exactly what a whole-round-trip of every switch at once cannot see. */
console.log('\n— no two settings share a bit —');
for (const [flip, keep, want] of [
  ['jpNames', 'world', true],       // names off must not crop the map
  ['world', 'jpNames', true],       // East Asia must not strip Japanese names
  ['relief', 'occSource', 'traced'],// topography must not hide the occupation
]) {
  /* A clean slate each time. The browser is shared, and the previous
     iteration's flip is in localStorage — with it there, the second write
     honestly carries both bits and the check reads a collision that is not
     one. The same trap as ever: state persists across pages. */
  /* The page already read the old state into memory before the clear, and
     its own applyState writes it straight back — so writing is disabled on
     this page as well as cleared. It exists only to scrub the slate. */
  { const t = await b.newPage();
    await t.goto('http://localhost:8123/index.html', { waitUntil: 'domcontentloaded' });
    await t.evaluate(() => { localStorage.clear();
      Storage.prototype.setItem = function () {}; });
    await t.close(); }
  const r = await open(b);
  await r.evaluate(k => {
    if (k === 'jpNames') document.querySelector('#opt-jpnames').click();
    if (k === 'world') document.querySelector('#opt-world').click();
    if (k === 'relief') document.querySelector('#opt-relief').click();
  }, flip);
  await sleep(1200);
  const href = await r.evaluate(() => location.href);
  await r.close();
  const s2 = await open(b, href);
  const got = await s2.evaluate(k => JSON.parse(localStorage.getItem('jmap.v3'))[k], keep);
  check(flip + ' off leaves ' + keep + ' alone', JSON.stringify(got) === JSON.stringify(want),
    href.slice(-24) + ' -> ' + keep + '=' + JSON.stringify(got));
  await s2.close();
}

console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
