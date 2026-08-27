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
/* The newest layer, pinned the moment it shipped: its bit is 25, and the
   round-trip above only covers what SETTINGS lists. */
console.log('\n— the railway layer travels in the address —');
{
  /* Opened on the island, because the layer is faded out at the whole-map
     view by design — a network of dots on a thirteen-pixel Taiwan is a white
     blob, and the zoom gate below is the check for that. */
  const r = await open(b, 'http://localhost:8123/index.html?bbox=119.9,21.8,122.2,25.4');
  await r.evaluate(() => document.querySelector('#opt-tw-rail').click());
  await sleep(1200);
  const href = await r.evaluate(() => location.href);
  const drawnHere = await r.evaluate(() =>
    getComputedStyle(document.getElementById('tw-rail')).display);
  await r.close();
  const s3 = await open(b, href);
  const got = await s3.evaluate(() => ({
    ticked: document.querySelector('#opt-tw-rail').checked,
    display: getComputedStyle(document.getElementById('tw-rail')).display,
    epochs: [...document.querySelectorAll('#tw-rail path')]
      .filter(p => getComputedStyle(p).display !== 'none')
      .map(p => p.getAttribute('data-epoch')),
  }));
  check('ticking it draws the layer', drawnHere === 'inline', drawnHere);
  check('and a link brings it back', got.ticked && got.display === 'inline',
    JSON.stringify(got));
  check('with one date\u2019s network drawn, not both',
    got.epochs.length === 1 && got.epochs[0] === 'e1930', JSON.stringify(got.epochs));
  /* The ink is read off the ground, not written into the stylesheet: light
     dots over a dark country, dark dots over a pale one. Checked as a
     *relation* between the two rather than as two hex strings, so the rule
     survives anyone retuning either colour — and checked in mono too, where
     the ground is a pale grey and the same line must flip. */
  const lum = c => {
    const m = /(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(c || '');
    if (!m) return null;
    let v = [+m[1], +m[2], +m[3]];
    if (v.some(x => x > 1)) v = v.map(x => x / 255);
    const f = x => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
    return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
  };
  const inked = await s3.evaluate(() => {
    const el = document.querySelector('#tw-rail path[data-epoch="e1930"]');
    const atom = document.querySelector('#a-' + el.getAttribute('data-over'));
    return { rail: getComputedStyle(el).stroke, ground: getComputedStyle(atom).fill,
             dash: getComputedStyle(el).strokeDasharray };
  });
  check('the dots are inked against the ground they cross',
    lum(inked.rail) !== null && lum(inked.ground) !== null
    && (lum(inked.ground) < 0.55) === (lum(inked.rail) > 0.5),
    'rail ' + inked.rail + ' on ' + inked.ground);
  check('and they are dots, not dashes', /^0\.?0?1?px/.test(inked.dash), inked.dash);
  await s3.close();

  const s4 = await open(b, href + '&nocache=' + Math.random());
  await s4.evaluate(() => document.querySelector('#btn-options').click());
  await sleep(300);
  await s4.evaluate(() => document.querySelector('#opt-mono').click());
  await sleep(1200);
  const monoInk = await s4.evaluate(() => {
    const el = document.querySelector('#tw-rail path[data-epoch="e1930"]');
    const atom = document.querySelector('#a-' + el.getAttribute('data-over'));
    return { rail: getComputedStyle(el).stroke, ground: getComputedStyle(atom).fill };
  });
  /* And it is not drawn at all until the ground is worth it. At the opening
     view Taiwan is thirteen pixels across and the whole network merged into
     one white mass — reported as "a big white dot in SW Taiwan". */
  const wide = await open(b, 'http://localhost:8123/index.html?layers='
    + ((1|(1<<5)|(1<<6)|(1<<8)|(1<<25))>>>0).toString(36));
  const far = await wide.evaluate(() => {
    const g = document.getElementById('tw-rail');
    return { display: getComputedStyle(g).display, ticked:
      document.querySelector('#opt-tw-rail').checked };
  });
  check('at the opening view the railway is not drawn, though it is switched on',
    far.ticked && far.display === 'none', JSON.stringify(far));
  await wide.close();

  const close = await open(b, 'http://localhost:8123/index.html?layers='
    + ((1|(1<<5)|(1<<6)|(1<<8)|(1<<25))>>>0).toString(36) + '&bbox=119.9,21.8,122.2,25.4');
  const near = await close.evaluate(() => {
    const g = document.getElementById('tw-rail');
    return { display: getComputedStyle(g).display, opacity: +getComputedStyle(g).opacity };
  });
  check('and it is drawn in full once the island fills the frame',
    near.display !== 'none' && near.opacity > 0.98, JSON.stringify(near));
  await close.close();

  check('and the rule still holds when the map goes one colour',
    (lum(monoInk.ground) < 0.55) === (lum(monoInk.rail) > 0.5),
    'rail ' + monoInk.rail + ' on ' + monoInk.ground);
  await s4.close();
}

console.log('\n— no two settings share a bit —');
for (const [flip, keep, want] of [
  ['jpNames', 'world', true],       // toggling names must not crop the map
  ['world', 'jpNames', false],      // East Asia must not flip the names (off is the default now)
  ['relief', 'occSource', 'traced'],// topography must not hide the occupation
]) {
  /* No scrub needed any more: the map neither reads nor writes stored
     state, so every page opens on the canonical defaults. */
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
  /* Read the controls, not localStorage: the map no longer stores its state
     anywhere — the URL is the store — so the dialog's own checkboxes are the
     truth about what the link delivered. */
  const got = await s2.evaluate(k => {
    if (k === 'world') return document.querySelector('#opt-world').checked;
    if (k === 'jpNames') return document.querySelector('#opt-jpnames').checked;
    if (k === 'occSource') {
      const r = document.querySelector('input[name="occ-src"]:checked');
      return r ? r.value : null;
    }
    return null;
  }, keep);
  check(flip + ' off leaves ' + keep + ' alone', JSON.stringify(got) === JSON.stringify(want),
    href.slice(-24) + ' -> ' + keep + '=' + JSON.stringify(got));
  await s2.close();
}

console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
