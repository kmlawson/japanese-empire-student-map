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
    epochs: [...document.querySelectorAll('#tw-rail path.rail')]
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
    const el = document.querySelector('#tw-rail path.rail[data-epoch="e1930"]');
    const atom = document.querySelector('#a-' + el.getAttribute('data-over'));
    const tie = el.nextSibling;
    return { rail: getComputedStyle(el).stroke, ground: getComputedStyle(atom).fill,
             dash: getComputedStyle(el).strokeDasharray,
             tie: tie && tie.classList.contains('rail-tie')
                  ? { stroke: getComputedStyle(tie).stroke,
                      dash: getComputedStyle(tie).strokeDasharray } : null };
  });
  check('the line is inked against the ground it crosses',
    lum(inked.rail) !== null && lum(inked.ground) !== null
    && (lum(inked.ground) < 0.55) === (lum(inked.rail) > 0.5),
    'rail ' + inked.rail + ' on ' + inked.ground);
  /* A LINE WITH TIES, NOT A ROW OF DOTS. It was 0.01 on 2.7 under a round cap
     — a dot every 2.7 screen pixels — and where several lines ran close
     together, which at the opening view is most of the network, it read as a
     grey stipple rather than as railways. The symbol is two strokes on one
     path now: solid in the ink, and a hairline break in the colour of the
     ground every six pixels. */
  check('the line itself is unbroken', inked.dash === 'none', inked.dash);
  check('and a tie path sits over it', !!inked.tie, JSON.stringify(inked.tie));
  check('the ties are the colour of the ground, so they read as a gap',
    !!inked.tie && inked.tie.stroke === inked.ground,
    inked.tie && inked.tie.stroke + ' against ' + inked.ground);
  check('and they are hairlines on a long run, not the other way about',
    !!inked.tie && (function (d) {
      const n = (d || '').split(',').map(v => parseFloat(v));
      return n.length === 2 && n[0] > 0 && n[1] >= n[0] * 3;
    })(inked.tie.dash), inked.tie && inked.tie.dash);

  /* AND THE TIES COME IN LATER THAN THE LINE. Far out, a network is a great
     many lines within a few pixels of each other and any texture at all turns
     into a grey stipple — dots did it and so did a tie every six pixels. No
     choice of pattern fixes that, because the fault is having a pattern at
     all at that scale. So the ties fade in as the reader closes, and between
     the layer appearing and the ties appearing a railway is a plain line,
     which is what an atlas draws at a small scale. */
  {
    const tieAt = async box => {
      const z = await open(b, href.replace(/where=[^&]*/, 'where=' + box)
                           + '&nocache=' + Math.random());
      await sleep(1200);
      const v = await z.evaluate(() => {
        const g = document.getElementById('tw-rail');
        const t = [...g.querySelectorAll('.rail-tie')].find(e => e.style.display !== 'none');
        return { layer: +getComputedStyle(g).opacity,
                 tie: t ? +t.style.opacity : null };
      });
      await z.close();
      return v;
    };
    const wide = await tieAt('118.5,20.5,123.5,26.5');   // the island and then some
    const near = await tieAt('120.4,23.9,121.1,24.5');   // a stretch of coast
    check('the line itself is drawn at the island view', wide.layer > 0.9,
      String(wide.layer));
    check('but with no ties on it there', wide.tie === 0, String(wide.tie));
    /* Not exactly 1: the test window is 1500px wide, so a bbox fits to a view
       a little wider than the same box would on the map's own page, and the
       ramp is still a hair short of the top. What matters is that it is
       nearly all the way in, and nowhere near the island view's nothing. */
    check('and the ties are all but in full once the reader is close',
      near.tie > 0.85, String(near.tie));
  }
  await s3.close();

  const s4 = await open(b, href + '&nocache=' + Math.random());
  await s4.evaluate(() => document.querySelector('#btn-options').click());
  await sleep(300);
  await s4.evaluate(() => document.querySelector('#opt-mono').click());
  await sleep(1200);
  const monoInk = await s4.evaluate(() => {
    const el = document.querySelector('#tw-rail path.rail[data-epoch="e1930"]');
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

/* ---- a link that has been through somebody else's site ------------- */
/* Reported from Facebook: the map opened at the right place with none of the
   layers on. `fbclid` was the suspect and is innocent — an extra parameter is
   ignored, and the first two cases here pin that. What breaks it is `&amp;`
   between the parameters, an HTML-escaped ampersand from a URL that has been
   through a page and out again: the first parameter is read and the rest are
   called `amp;layers` and `amp;fbclid`, so the view arrives and the switches
   do not. The query is repaired before it is read, and the tracking
   parameters come out of the address bar so what the reader copies onward is
   the link and not somebody else's campaign. */
console.log('\n— a link that has been through somebody else\u2019s site —');
for (const [label, q] of [
  ['clean', '?where=120.3,22.9,121.4,24.7&layers=9frtd4'],
  ['fbclid appended', '?where=120.3,22.9,121.4,24.7&layers=9frtd4&fbclid=IwdGRleAUAXptw_aem_x'],
  ['&amp; separators', '?where=120.3,22.9,121.4,24.7&amp;layers=9frtd4&amp;fbclid=abc'],
  ['utm after a second ?', '?where=120.3,22.9,121.4,24.7&layers=9frtd4?utm_source=facebook&utm_medium=social'],
]) {
  const p = await b.newPage();
  await p.evaluateOnNewDocument(SHIM);
  await p.setViewport({ width: 1200, height: 860 });
  await p.goto('http://localhost:8123/index.html' + q, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await new Promise(r => setTimeout(r, 2200));
  const got = await p.evaluate(() => ({
    tools: document.querySelector('#opt-train-tools').checked,
    rail: document.querySelector('#opt-tw-rail').checked,
    sta: document.querySelector('#opt-tw-stations').checked,
    search: location.search,
  }));
  check('the layers survive "' + label + '"',
    got.tools && got.rail && got.sta, JSON.stringify(got));
  check('  and no tracking is left in the address',
    !/fbclid|utm_|amp;/.test(got.search), got.search);
  await p.close();
}

/* ------------------------------------------------ one bit, one setting --
 *
 * The round-trip above sets every switch at once, which is exactly what
 * cannot see a *collision*: two settings on the same bit both go out and both
 * come back, and each looks fine. Three of these have now shipped. The last
 * two were found by a reader:
 *
 *   * `state.air` was written to 65536 — bit 16, the projection's high bit. So
 *     "airlines on, Mercator" and "airlines off, Lambert azimuthal" wrote the
 *     SAME code, `1en4`, and opening either gave you both.
 *   * Hiding Manchukuo wrote 524288 and Mengjiang 1048576 — bits 19 and 20,
 *     which are the relief sheet. Choosing the finest relief and sharing it
 *     hid Mengjiang at the other end.
 *
 * So each pair is driven one at a time and the *other* half of the pair is
 * read back with it. A setting that travels is not enough; it has to travel
 * alone. */
console.log('\n— one setting at a time, and nothing rides along with it —');
{
  const read = p => p.evaluate(() => ({
    air: getComputedStyle(document.getElementById('air')).display,
    planes: document.getElementById('btn-planes')
      ? { on: document.getElementById('btn-planes').classList.contains('on'),
          bar: !!document.querySelector('.air-slider') } : null,
    proj: ['mercator', 'albers', 'laea']
      .find(k => { const e = document.querySelector('#proj-' + k); return e && e.checked; }),
    relief: document.querySelector('#opt-relief').checked,
    detail: [...document.querySelectorAll('#relief-seg button')]
      .map(x => x.classList.contains('on')),
    manchukuo: document.querySelector('#opt-manchukuo').checked,
    mengjiang: document.querySelector('#opt-mengjiang').checked,
    airAll: document.querySelector('#opt-air-all').checked,
    airNames: document.querySelector('#opt-airport-names').checked,
  }));
  const trip = async (name, setup, keys) => {
    const p = await open(b); await setup(p); await sleep(1600);
    const before = await read(p);
    const url = await p.evaluate(() => location.href);
    const code = (/[?&]layers=([^&#]+)/.exec(url) || [])[1];
    await p.close();
    const q = await open(b, url); await sleep(1400);
    const after = await read(q); await q.close();
    check(name + ' (layers=' + code + ')',
      keys.every(k => JSON.stringify(before[k]) === JSON.stringify(after[k])),
      keys.map(k => k + ': ' + JSON.stringify(before[k]) + ' → ' + JSON.stringify(after[k])).join(', '));
    return code;
  };
  const cAir = await trip('the air routes, and the projection is untouched',
    p => p.evaluate(() => document.getElementById('btn-air').click()),
    ['air', 'proj', 'relief', 'manchukuo', 'mengjiang']);
  const cProj = await trip('Lambert azimuthal, and the air routes stay off',
    p => p.evaluate(() => { const e = document.querySelector('#proj-laea');
      e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }),
    ['air', 'proj', 'manchukuo', 'mengjiang']);
  check('  and the two no longer write the same code', cAir !== cProj, cAir + ' vs ' + cProj);

  /* The plane tools were in no field at all — `airPlayWanted` is a variable of
     the module, and the button that sets it never wrote the address. A link
     shared with the week running arrived stopped. */
  await trip('the plane tools, running', async p => {
    await p.evaluate(() => document.getElementById('btn-air').click()); await sleep(1500);
    await p.evaluate(() => document.getElementById('btn-planes').click()); await sleep(2200);
  }, ['air', 'planes', 'proj']);

  await trip('the finest relief sheet, and the client states stay drawn', async p => {
    await p.evaluate(() => { const e = document.querySelector('#opt-relief');
      e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(1500);
    await p.evaluate(() => { const bs = [...document.querySelectorAll('#relief-seg button')];
      if (bs.length) bs[bs.length - 1].click(); });
    await sleep(1200);
  }, ['relief', 'detail', 'manchukuo', 'mengjiang', 'air']);

  /* The names beside the airport rings — their own switch, not one of the five
     behind Other, and off by default. */
  await trip('the airport names, and the routes stay on', async p => {
    await p.evaluate(() => document.getElementById('btn-air').click()); await sleep(1400);
    await p.evaluate(() => { const e = document.querySelector('#opt-airport-names');
      e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(1000);
  }, ['airNames', 'airAll', 'air', 'manchukuo', 'mengjiang']);

  /* The switch that flies the pre-war timetables over the 1942 sheet. Off by
     default, so an address written before it existed still opens grounded. */
  await trip('the pre-war lines flown, and the routes stay on', async p => {
    await p.evaluate(() => document.getElementById('btn-air').click()); await sleep(1400);
    await p.evaluate(() => { const e = document.querySelector('#opt-air-all');
      e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(1200);
  }, ['airAll', 'air', 'manchukuo', 'mengjiang', 'relief']);

  await trip('Manchukuo hidden, and the relief sheet is untouched',
    p => p.evaluate(() => { const e = document.querySelector('#opt-manchukuo');
      e.checked = false; e.dispatchEvent(new Event('change', { bubbles: true })); }),
    ['manchukuo', 'mengjiang', 'relief', 'detail', 'air']);
  await trip('Mengjiang hidden, and the relief sheet is untouched',
    p => p.evaluate(() => { const e = document.querySelector('#opt-mengjiang');
      e.checked = false; e.dispatchEvent(new Event('change', { bubbles: true })); }),
    ['manchukuo', 'mengjiang', 'relief', 'detail', 'air']);

  /* **The two fields are written apart now, and the old form still reads.**
     They used to be multiplied into one number — `bits + hi * 2³⁰` — which is
     exact only to 2⁵³, so the high field had room for two more flags and the
     third would have started rounding silently. Every code below was written
     by the build before the split. */
  console.log('\n— an address written before the two fields were split —');
  for (const [code, want] of [['1dvxwqtyzk', { air: 'inline' }],
                              ['1en4', { proj: 'laea' }],
                              ['1f', { manchukuo: true, mengjiang: true }],
                              ['s3fk', { relief: true }]]) {
    const o = await open(b, 'http://localhost:8123/index.html?layers=' + code);
    const got = await read(o); await o.close();
    check('  layers=' + code + ' still means what it meant',
      Object.keys(want).every(k => JSON.stringify(got[k]) === JSON.stringify(want[k])),
      Object.keys(want).map(k => k + ': want ' + JSON.stringify(want[k])
        + ' got ' + JSON.stringify(got[k])).join(', '));
  }
  /* And the room to grow, pinned as a number rather than left to be trusted:
     a code with anything in the high field is two parts with a stop between
     them, and each part is a number in its own right. */
  const shape = await (async () => {
    const p = await open(b);
    await p.evaluate(() => document.getElementById('btn-air').click());
    await sleep(1500);
    const c = (/[?&]layers=([^&#]+)/.exec(await p.evaluate(() => location.href)) || [])[1];
    await p.close(); return c;
  })();
  check('a code with a high field is written as two parts', /^[0-9a-z]+\.[0-9a-z]+$/.test(shape || ''), shape);
}

console.log('\n  '+pass+' passed, '+fail+' failed');
await b.close(); process.exit(fail);})();
