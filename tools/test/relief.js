/* The Topography layer: off, on, in the right place, and gone when zoomed in.
 *
 *     node tools/test/relief.js          # with a server on 8123
 *
 * Natural Earth's shaded relief, warped once per projection at build time
 * because a raster cannot be reprojected in the browser — there is nothing to
 * move but the pixels. `tools/build_relief.py` writes the three images and
 * `relief.js` says where each goes, in map units.
 *
 * The two things worth proving are the two that could be wrong without looking
 * wrong at a glance:
 *
 *   * **it is where the land is.** The placement box is computed in Python by
 *     the same sampling loop `fitOf` runs in the browser, so a mistake in
 *     either would shift the hillshade off the coast by a few degrees and the
 *     map would still look plausible. Checked by measuring the drawn colour at
 *     places whose terrain is known — the Himalaya and Honshu are shaded, and
 *     the middle of the Philippine Sea is not.
 *
 *   * **it does not touch the sea.** The sheet paints water one flat grey, and
 *     the build moves that value to exactly mid grey so that `soft-light`
 *     leaves the colour beneath it alone. If that remap were wrong the ocean
 *     would be tinted across the whole map — the most visible possible fault,
 *     and one nobody would think to test for because it looks like a design
 *     choice.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('relief test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { ready } = require('./settle.js');
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const BASE = (1 << 5) | (1 << 6);          // line of control and rivers, as they start
const RELIEF = 1 << 18;
const PROJBIT = { mercator: 0, albers: 1 << 15, laea: 2 << 15 };
const DETAIL = n => n << 19;
const url = (bits) => 'http://localhost:8123/index.html?layers=' + (bits >>> 0).toString(36);

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

console.log('\n— off until it is asked for —');
{
  const p = await b.newPage();
  await p.setViewport({ width: 1300, height: 900 });
  const got = [];
  p.on('request', r => { if (/relief-/.test(r.url())) got.push(r.url().split('/').pop().split('?')[0]); });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(p);
  check('the box is unticked', !(await p.evaluate(() =>
    document.querySelector('#opt-relief').checked)));
  check('and a third of a megabyte is not fetched', got.length === 0, got.join(','));
  check('nothing is drawn for it either', !(await p.evaluate(() =>
    !!document.querySelector('#relief image'))));

  console.log('\n— and fetched once, when it is —');
  await p.evaluate(() => document.querySelector('#opt-relief').click());
  await sleep(2600);
  check('exactly one image is fetched', got.length === 1, got.join(','));
  check('and it is the one sheet that is offered, for the projection on screen',
    got[0] === 'relief-finest-mercator.webp', got.join(','));
  const img = await p.evaluate(() => {
    const i = document.querySelector('#relief image');
    if (!i) return null;
    const r = i.getBoundingClientRect();
    return { x: i.getAttribute('x'), y: i.getAttribute('y'),
             w: i.getAttribute('width'), h: i.getAttribute('height'),
             blend: getComputedStyle(i).mixBlendMode,
             op: getComputedStyle(i).opacity,
             // an ancestor that isolates, or that is itself see-through, is a
             // blending boundary and stops soft-light reaching the map
             walls: (function () {
               var bad = [], e = i.parentNode;
               while (e && e.nodeType === 1) {
                 var cs = getComputedStyle(e);
                 if (cs.isolation === 'isolate') bad.push((e.id || e.tagName) + ':isolate');
                 if (parseFloat(cs.opacity) < 1) bad.push((e.id || e.tagName) + ':opacity');
                 e = e.parentNode;
               }
               return bad;
             })(),
             drawn: r.width > 0 && r.height > 0 };
  });
  /* The mercator box is the document's own viewBox — the frame is the
     mercator rectangle by construction — so this is a real check on the
     Python that computed it and not a restatement of the manifest. */
  const vb = await p.evaluate(() => {
    const el = document.getElementById('jmap');
    return (el.getAttribute('data-viewbox0') || '0 0 2800 1584.9').split(' ').map(Number);
  });
  check('it covers the whole frame in map units',
    img && +img.w === 2800 && Math.abs(+img.h - 1584.92) < 0.2,
    JSON.stringify(img));
  /* Whichever blend the build chose — it writes the water to that blend's own
     neutral, and `map.js` reads the name out of the manifest rather than
     carrying one of its own. What must not happen is `normal`, which would
     paint flat grey over the map and over the sea with it. */
  check('it is blended, not painted over',
    img && img.blend !== 'normal' && img.blend === (await p.evaluate(() =>
      JMAP.RELIEF.blend)),
    img && img.blend);
  /* The fault this replaced: `isolation: isolate` and the fade's `opacity`
     were both on the wrapping group. Either one makes that group a blending
     boundary, so `soft-light` blended the image with an empty group instead
     of with the map and became plain grey paint at 55%. Measured then: the
     open Pacific went from [202,223,235] to [155,165,170], 51 points darker,
     with the land still looking right. Both belong on the image itself. */
  check('nothing between it and the map isolates the blend',
    img && img.walls.length === 0, img && img.walls.join(','));
  check('and the fade is on the image, where the blend is',
    img && parseFloat(img.op) > 0 && parseFloat(img.op) < 1, img && img.op);
  check('the image really loaded', img && img.drawn, JSON.stringify(img));
  check('no page errors', errs.length === 0, errs[0]);
  await p.close();
}

/* Is it in the right place?
 *
 * The first version of this asked only whether the colour *changed* where
 * there is terrain, and that is far too weak. The mercator warp was built 66
 * degrees out — its metres were measured from Greenwich, where `mercFwd`
 * measures them from the frame's left edge — and every one of those checks
 * still passed, because whatever landed on the Himalaya was some other piece
 * of ground and duly changed the colour. On screen the relief began at Japan
 * and China had nothing under it at all.
 *
 * So the question is put the other way round, where it has a sharp answer.
 * Shaded relief has no bathymetry: it paints water one flat value, and the
 * build moves that to exactly mid grey, at which `soft-light` changes nothing.
 * **Every open-sea pixel must therefore be untouched by the layer.** A shift
 * cannot survive that: move the sheet and land shading falls across the sea.
 *
 * No coordinates are computed here. A grid of screen points is classified by
 * asking the page what is under each one — which works because the relief is
 * `pointer-events: none`, so `elementFromPoint` sees through it to the ocean
 * rect or to a country. That makes the test projection-blind, and it runs in
 * all three.
 */
console.log('\n— it is in the right place, in all three projections —');
{
  const grid = (p) => p.evaluate(() => {
    const svg = document.getElementById('jmap');
    const r = svg.getBoundingClientRect();
    const out = [];
    for (let i = 1; i < 26; i++) {
      for (let j = 1; j < 17; j++) {
        const x = Math.round(r.left + r.width * i / 26);
        const y = Math.round(r.top + r.height * j / 17);
        const el = document.elementFromPoint(x, y);
        if (!el) continue;
        // the relief must not be what answers — it is a picture, not a target
        if (el.closest('#relief')) { out.push([x, y, 'RELIEF']); continue; }
        const what = p2 => {
          const e = document.elementFromPoint(p2[0], p2[1]);
          return !e ? '?' : e.closest('#land') ? 'land'
                 : e.closest('#ocean') ? 'sea' : 'other';
        };
        const here = what([x, y]);
        /* Open water, not merely water. A point in a strait or one pixel off a
           beach is shaded on purpose — the warp's resampling carries the land's
           value into the first sea pixel, and the sheet's own coastline is a
           gradient, not a step. So a sea point counts only if the sea reaches
           twelve pixels round it in every direction. Measured on the point
           that first failed this: 13 of 16 directions at 4px were land. */
        let open = here === 'sea';
        if (open) {
          for (let a = 0; a < 16 && open; a++) {
            const t = a * Math.PI / 8;
            if (what([Math.round(x + 12 * Math.cos(t)),
                      Math.round(y + 12 * Math.sin(t))]) !== 'sea') open = false;
          }
        }
        out.push([x, y, open ? 'sea' : here === 'land' ? 'land' : 'edge']);
      }
    }
    return out;
  });
  const sample = async (png, pts) => {
    const q = await b.newPage();
    await q.setViewport({ width: 400, height: 300 });
    const got = await q.evaluate(async (data, points) => {
      const im = new Image();
      await new Promise(res => { im.onload = res; im.src = 'data:image/png;base64,' + data; });
      const c = document.createElement('canvas');
      c.width = im.width; c.height = im.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(im, 0, 0);
      return points.map(v => [...ctx.getImageData(v[0], v[1], 1, 1).data].slice(0, 3));
    }, Buffer.from(png).toString('base64'), pts);
    await q.close();
    return got;
  };

  for (const mode of ['mercator', 'albers', 'laea']) {
    const open = async (on) => {
      const p = await b.newPage();
      await p.setViewport({ width: 1300, height: 900 });
      await p.goto(url(BASE | (on ? RELIEF : 0) | PROJBIT[mode]), { waitUntil: 'networkidle0' });
      await ready(p);
      return p;
    };
    const a = await open(false);
    const pts = await grid(a);
    const pngA = await a.screenshot({ encoding: 'binary' });
    await a.close();
    const c = await open(true);
    const hits = await grid(c);
    const pngB = await c.screenshot({ encoding: 'binary' });
    await c.close();

    check(mode + ': the layer is not what the pointer finds',
      hits.every(h => h[2] !== 'RELIEF'),
      hits.filter(h => h[2] === 'RELIEF').length + ' of ' + hits.length + ' points hit it');

    const A = await sample(pngA, pts);
    const B = await sample(pngB, pts);
    const diff = i => Math.max(...[0, 1, 2].map(k => Math.abs(A[i][k] - B[i][k])));
    const sea = pts.map((v, i) => [v, i]).filter(v => v[0][2] === 'sea');
    const land = pts.map((v, i) => [v, i]).filter(v => v[0][2] === 'land');
    const wet = sea.filter(v => diff(v[1]) > 3);
    check(mode + ': every open-sea point is left alone (' + sea.length + ' of them)',
      sea.length >= 40 && wet.length === 0,
      wet.length + ' tinted, worst ' + Math.max(0, ...sea.map(v => diff(v[1])))
        + '; first at ' + JSON.stringify((wet[0] || [[]])[0]));
    /* And the land really is being shaded. Not a fraction of it: most of the
       land in this frame is flat — the north China plain, the Ganges, the
       Siberian lowland — and flat ground is near the sheet's neutral, so a
       hillshade that left it alone would be right to. What has to be true is
       that the mountains show. */
    const moved = land.map(v => diff(v[1])).sort((x, y) => y - x);
    check(mode + ': and the mountains are shaded',
      land.length >= 20 && moved[5] >= 4 && moved[0] >= 8,
      land.length + ' land points, strongest ' + moved.slice(0, 8).join(','));
  }
}

/* The fade is a **screen pixel** measurement, not a document-zoom one, and
 * that is the whole of this section.
 *
 * It was `mapW0 / view.w` — how far the drawing is magnified — and pixelation
 * is not a fact about the drawing. At the same document zoom a narrow phone
 * puts fewer screen pixels on each pixel of the sheet than a wide desktop
 * does, so the sheet is still sharp there when the fade has already removed
 * it. Reported as the relief seeming to go sooner on a phone, and it did.
 */
console.log('\n— it goes away as the reader zooms in, and not before —');
{
  const wheelTo = async (p, w, h, want) => {
    for (let i = 0; i < 22; i++) {
      const r = await p.evaluate(() => {
        const g = document.querySelector('#relief');
        const im = g.querySelector('image');
        const vb = document.getElementById('jmap').getAttribute('viewBox').split(' ');
        return { z: 2800 / parseFloat(vb[2]),
                 op: getComputedStyle(g).display === 'none' ? 0
                     : parseFloat(getComputedStyle(im).opacity) };
      });
      if (r.z >= want) return r;
      await p.mouse.move(w / 2, h / 2); await p.mouse.wheel({ deltaY: -300 });
      await sleep(300);
    }
    return p.evaluate(() => {
      const g = document.querySelector('#relief');
      const im = g.querySelector('image');
      const vb = document.getElementById('jmap').getAttribute('viewBox').split(' ');
      return { z: 2800 / parseFloat(vb[2]),
               op: getComputedStyle(g).display === 'none' ? 0
                   : parseFloat(getComputedStyle(im).opacity) };
    });
  };
  const open = async (w, h, touch) => {
    const p = await b.newPage();
    await p.setViewport(touch ? { width: w, height: h, isMobile: true, hasTouch: true }
                              : { width: w, height: h });
    await p.goto(url(BASE | RELIEF), { waitUntil: 'networkidle0' });
    await ready(p);
    return p;
  };

  const p = await open(1300, 900, false);
  const home = await p.evaluate(() => {
    const g = document.querySelector('#relief');
    return { shown: getComputedStyle(g).display !== 'none',
             op: parseFloat(getComputedStyle(g.querySelector('image')).opacity) };
  });
  check('it is drawn at the opening view', home.shown && home.op > 0.3,
    JSON.stringify(home));
  const mid = await wheelTo(p, 1300, 900, 15);
  check('and is still there well past where it used to have gone',
    mid.z >= 12 && mid.op > 0.2, JSON.stringify(mid));
  const deep = await wheelTo(p, 1300, 900, 60);
  check('but gone once its pixels really would show', deep.op === 0,
    JSON.stringify(deep));
  for (let i = 0; i < 20; i++) {
    await p.mouse.move(650, 450); await p.mouse.wheel({ deltaY: 300 }); await sleep(260);
  }
  const back = await p.evaluate(() => {
    const g = document.querySelector('#relief');
    return getComputedStyle(g).display === 'none' ? 0
      : parseFloat(getComputedStyle(g.querySelector('image')).opacity);
  });
  check('coming back out brings it back', back > 0.3, String(back));
  await p.close();

  /* And the phone. Its map area is a third the width, so one pixel of the
     sheet covers a third as much of the screen and it should still be there
     at a zoom where the desktop has begun to lose it. */
  const q = await open(390, 780, true);
  const phone = await wheelTo(q, 390, 780, 15);
  check('on a phone it is still full strength where the desktop has faded',
    phone.z >= 12 && phone.op > 0.7,
    'phone ' + JSON.stringify(phone) + ' vs desktop ' + JSON.stringify(mid));
  await q.close();
}

console.log('\n— one warp per projection, and only the one in use —');
{
  for (const mode of ['albers', 'laea']) {
    const p = await b.newPage();
    await p.setViewport({ width: 1300, height: 900 });
    const got = [];
    p.on('request', r => { if (/relief-/.test(r.url())) got.push(r.url().split('/').pop().split('?')[0]); });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url(BASE | RELIEF | PROJBIT[mode]), { waitUntil: 'networkidle0' });
    await ready(p);
    check(mode + ': its own image and no other',
      got.length === 1 && got[0] === 'relief-finest-' + mode + '.webp', got.join(','));
    const box = await p.evaluate(() => {
      const i = document.querySelector('#relief image');
      return i ? [+i.getAttribute('w' + 'idth'), +i.getAttribute('height')] : null; });
    /* The box has to be this projection's own, not mercator's. The three
       differ by hundreds of units, so a stale box would be obvious here and
       nowhere else. */
    check(mode + ': placed in its own box, not mercator\'s',
      box && Math.abs(box[0] - 2800) > 100, JSON.stringify(box));
    check(mode + ': no page errors', errs.length === 0, errs[0]);
    await p.close();
  }
}

/* Three sheets to choose between, and the point of offering the choice is
   that a reader on a phone should not be made to decode 191 MB of pixels for
   a layer that is off by default. So what has to hold is that picking one
   fetches that one and *only* that one, and that the ramp moves with it: a
   finer sheet stays sharp further in and so must fade later, which is read
   off the manifest rather than written down three times. */
/* One sheet, for now.
 *
 * The build still writes three and the machinery to choose still works —
 * `state.reliefDetail`, bits 19 and 20, and the segment in the Layers panel —
 * but `RELIEF_ONLY` in `map.js` pins it to the finest, so a reader is not
 * asked a question they have no way to answer. What has to hold while that is
 * true: the chooser is not shown, and no link can make the map fetch one of
 * the other two, because a link that did would be quoting file sizes and
 * decode costs the reader was never told about.
 */
console.log('\n— one sheet is offered, and it is the finest —');
{
  /* One link, not three. This asked for coarse, fine and finest in turn — a
     page load and 3.4 seconds of settle apiece — to make the same point three
     times. What the pin has to survive is *a link asking for something else*,
     and `coarse` is that; `finest` asks for what it would get anyway, so it
     proves nothing at all. The chooser and the manifest are checked on the
     same page rather than on a fourth. Four loads became one. */
  const p = await b.newPage();
  await p.setViewport({ width: 1300, height: 900 });
  const got = [];
  p.on('request', r => { if (/relief-/.test(r.url())) got.push(r.url().split('/').pop().split('?')[0]); });
  await p.goto(url(BASE | RELIEF | (0 << 19)), { waitUntil: 'networkidle0' });
  await ready(p);
  check('a link asking for coarse still gets the finest',
    got.length === 1 && got[0] === 'relief-finest-mercator.webp', got.join(','));
  check('and the reader is not shown a chooser',
    await p.evaluate(() => document.querySelector('#relief-seg').hidden));
  /* The build still makes all three, so bringing the choice back is one
     constant and not a rebuild. If this fails, the manifest has been cut down
     and `RELIEF_ONLY = null` would no longer have three sheets to offer. */
  const levels = await p.evaluate(() => JMAP.RELIEF.levels.map(l => l.key));
  check('though the build still writes all three',
    levels.join(',') === 'coarse,fine,finest', levels.join(','));
  await p.close();
}

/* Topography has two switches — the bar's button on a wide screen and the tick
   in the Layers dialog — and they must not disagree about what is on the map.
   Before `applyState` wrote both, ticking the dialog left the bar's button
   reading "off" over a map that plainly had relief on it. */
console.log('\n— its two switches agree —');
{
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 950 });
  /* Every page in this file shares one browser and so one localStorage, and
     the sections above have been opening the layer through the address. A
     fresh reader is what this section is about.
     
     The store is emptied from a page on the same origin that does *not* run
     the map — clearing it from index.html does not work, because the app is
     already live and writes its state straight back over the empty store. */
  await p.goto('http://localhost:8123/relief.js', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) { /* fine */ } });
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(p);
  const both = () => p.evaluate(() => ({
    bar: document.querySelector('#btn-topo').getAttribute('aria-pressed'),
    box: document.querySelector('#opt-relief').checked,
    order: [...document.querySelectorAll('#layer-seg button')]
      .map(e => e.querySelector('.wide').textContent.trim()).join(' '),
    hidden: document.querySelector('#btn-topo').hidden,
  }));
  let st = await both();
  check('the bar reads Cities Admin Topo Events Other',
    st.order === 'Cities Admin Topo Events Other', st.order);
  check('and both switches start off', st.bar === 'false' && !st.box);
  await p.evaluate(() => document.querySelector('#btn-topo').click());
  await sleep(2600);
  st = await both();
  check('pressing the bar button ticks the dialog too', st.bar === 'true' && st.box);
  await p.evaluate(() => document.querySelector('#opt-relief').click());
  await sleep(1200);
  st = await both();
  check('and unticking the dialog releases the bar button',
    st.bar === 'false' && !st.box, JSON.stringify(st));
  await p.close();

  /* A fifth button in a bar that wraps at four on a phone, so it rides there
     on a wide screen only — the same rule the 1942 pair follows. */
  const q = await b.newPage();
  await q.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true });
  await q.goto('http://localhost:8123/relief.js', { waitUntil: 'domcontentloaded' });
  await q.evaluate(() => { try { localStorage.clear(); } catch (e) { /* fine */ } });
  await q.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(q);
  check('on a phone the bar does not carry it',
    await q.evaluate(() => document.querySelector('#btn-topo').hidden));
  check('but the Layers dialog still does',
    await q.evaluate(() => !!document.querySelector('#opt-relief')));
  await q.close();
}

/* What a reader sees while one and three quarter megabytes are on the way.
 *
 * Two things, and the second is the one that is easy to get wrong. An `<image>`
 * handed an address paints the file as it arrives, so a sheet this size wiped
 * down the map a band at a time. It is fetched into a blob first and the
 * `href` set once, so the map changes when there is a whole picture to change
 * it to — which is checked by the href being a `blob:` and never the file.
 */
console.log('\n— it says it is loading, and arrives whole —');
{
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 950 });
  const cdp = await p.createCDPSession();
  await cdp.send('Network.enable');
  /* Every page in this file shares one browser and so one HTTP cache, and the
     sections above have already fetched this sheet — throttling a download
     that never happens shows nothing. */
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false,
    downloadThroughput: 220 * 1024, uploadThroughput: 220 * 1024, latency: 120 });
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(p);
  const look = () => p.evaluate(() => {
    const btn = document.querySelector('#btn-topo');
    const n = document.querySelector('#relief-note');
    const im = document.querySelector('#relief image');
    return { busy: btn.classList.contains('busy'),
             aria: btn.getAttribute('aria-busy'),
             note: n.hidden ? '' : n.textContent,
             href: im ? (im.getAttribute('href') || '') : null };
  });
  await p.evaluate(() => document.querySelector('#btn-topo').click());
  await sleep(400);
  const mid = await look();
  check('the button says it is working', mid.busy && mid.aria === 'true',
    JSON.stringify(mid));
  /* The dialog says so too. On a phone the bar does not carry Topography at
     all and the tick is the only switch there is, so a spinner on a button
     nobody can see would be no feedback at all. */
  check('and so does the row in the Layers dialog', /loading/.test(mid.note),
    JSON.stringify(mid));
  check('and nothing is painted while it comes down', mid.href === '',
    JSON.stringify(mid));
  let end = mid;
  for (let i = 0; i < 40; i++) {
    end = await look();
    if (!end.busy && /^blob:/.test(end.href)) break;
    await sleep(700);
  }
  check('when it lands the map takes it whole, from a blob',
    /^blob:/.test(end.href), JSON.stringify(end));
  check('and the button stops saying anything',
    !end.busy && end.aria === 'false' && end.note === '', JSON.stringify(end));
  await p.close();
}

console.log('\n— a sheet already fetched is not fetched again —');
{
  /* Its own browser. Every other section here shares one, and this is the
     third time that has cost something: a shared HTTP cache hid the download
     from the throttling above, and a shared profile carried a projection
     and a stored state into a block that is about a reader starting fresh. */
  const b2 = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b2.newPage();
  await p.setViewport({ width: 1400, height: 950 });
  const got = [];
  p.on('request', r => { if (/relief-/.test(r.url())) got.push(r.url().split('/').pop().split('?')[0]); });
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(p);
  /* Waited on from the outside, by counting the requests that actually
     happen, rather than on a page-side proxy for them: the href is a blob
     after the first sheet whatever the second one is doing, so waiting for
     "a blob" returns at once and the count is read before the fetch fires. */
  const nRequests = async (n, secs) => {
    for (let i = 0; i < secs * 2; i++) {
      if (got.length >= n) return true;
      await sleep(500);
    }
    return false;
  };
  /* And each one is allowed to *finish* before the next is asked for. A sheet
     is only kept once it has arrived, so switching away mid-download and back
     again fetches it a second time — which is right, and is not what this
     section is about. */
  const idle = async () => {
    for (let i = 0; i < 60; i++) {
      if (!(await p.evaluate(() =>
        document.querySelector('#btn-topo').classList.contains('busy')))) return;
      await sleep(500);
    }
  };
  await p.evaluate(() => document.querySelector('#btn-topo').click());
  await nRequests(1, 25); await idle();
  const pick = m => p.evaluate(v => { const r = document.querySelector('input[value="' + v + '"]');
    if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }, m);
  await pick('albers');
  await nRequests(2, 25); await idle();
  check('changing projection fetches that projection\'s sheet',
    got.length === 2 && /albers/.test(got[1]), got.join(','));
  await pick('mercator');
  await sleep(1600);
  check('and going back fetches nothing — the blob was kept',
    got.length === 2, got.join(','));
  check('with no spinner for a picture already in hand',
    !(await p.evaluate(() => document.querySelector('#btn-topo').classList.contains('busy'))));
  await p.close();
  await b2.close();
}

console.log('\n— and it says so when it fails —');
{
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 950 });
  await p.setRequestInterception(true);
  p.on('request', r => { if (/relief-.*\.webp/.test(r.url())) r.abort(); else r.continue(); });
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(p);
  await p.evaluate(() => document.querySelector('#btn-topo').click());
  await sleep(2600);
  const st = await p.evaluate(() => {
    const btn = document.querySelector('#btn-topo');
    const n = document.querySelector('#relief-note');
    return { failed: btn.classList.contains('failed'),
             busy: btn.classList.contains('busy'),
             note: n.hidden ? '' : n.textContent, title: btn.title };
  });
  check('the button shows the failure rather than spinning for ever',
    st.failed && !st.busy, JSON.stringify(st));
  check('and both switches say what went wrong',
    /did not load/.test(st.note) && /did not load/.test(st.title), JSON.stringify(st));
  await p.close();
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
