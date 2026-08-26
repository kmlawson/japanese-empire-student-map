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
  await sleep(2500);
  check('the box is unticked', !(await p.evaluate(() =>
    document.querySelector('#opt-relief').checked)));
  check('and a third of a megabyte is not fetched', got.length === 0, got.join(','));
  check('nothing is drawn for it either', !(await p.evaluate(() =>
    !!document.querySelector('#relief image'))));

  console.log('\n— and fetched once, when it is —');
  await p.evaluate(() => document.querySelector('#opt-relief').click());
  await sleep(2600);
  check('exactly one image is fetched', got.length === 1, got.join(','));
  check('and it is the coarse one, for the projection on screen',
    got[0] === 'relief-coarse-mercator.webp', got.join(','));
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
  check('it is blended, not painted over', img && img.blend === 'soft-light',
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

/* Where the land is. Measured as the difference the layer makes to the colour
   at a given place: shaded ground changes, flat water does not. */
console.log('\n— it lands on the land, and lets the sea alone —');
{
  const SPOTS = [
    // lon, lat, what is there, must the colour change?
    [86.9, 27.99, 'the Himalaya at Everest', true],
    [138.7, 35.4, 'the mountains of Honshu', true],
    [101.0, 31.0, 'the Sichuan ranges', true],
    [134.0, 20.0, 'the middle of the Philippine Sea', false],
    [155.0, 30.0, 'open Pacific east of Japan', false],
  ];
  const shot = async (on) => {
    const p = await b.newPage();
    await p.setViewport({ width: 1300, height: 900 });
    await p.goto(url(BASE | (on ? RELIEF : 0)), { waitUntil: 'networkidle0' });
    await sleep(3200);
    // the screen position of each place, through the map's own projection:
    // the graticule is drawn from it, so a label at a round coordinate is an
    // honest handle on where the projection puts things
    const pts = await p.evaluate(spots => spots.map(s => {
      const svg = document.getElementById('jmap');
      const vb = svg.getAttribute('viewBox').split(' ').map(Number);
      const r = svg.getBoundingClientRect();
      // map units -> screen, and lon/lat -> map units in mercator, which is
      // what the document is drawn in and what the test asks for
      const R = 1145.91559, lonMin = 66, pxPerDeg = 20;
      const yTop = R * Math.log(Math.tan(Math.PI / 4 + 55 * Math.PI / 360));
      const lon = s[0] < lonMin ? s[0] + 360 : s[0];
      const mx = (lon - lonMin) * pxPerDeg;
      const my = yTop - R * Math.log(Math.tan(Math.PI / 4 + s[1] * Math.PI / 360));
      return [Math.round(r.left + (mx - vb[0]) / vb[2] * r.width),
              Math.round(r.top + (my - vb[1]) / vb[3] * r.height)];
    }), SPOTS);
    const png = await p.screenshot({ encoding: 'binary' });
    await p.close();
    return { pts, png };
  };
  const off = await shot(false);
  const on = await shot(true);
  // read the two screenshots without a decoder: puppeteer can sample for us
  const sample = async (png, pts) => {
    const p = await b.newPage();
    await p.setViewport({ width: 1300, height: 900 });
    const b64 = Buffer.from(png).toString('base64');
    const out = await p.evaluate(async (data, points) => {
      const im = new Image();
      await new Promise(res => { im.onload = res; im.src = 'data:image/png;base64,' + data; });
      const c = document.createElement('canvas');
      c.width = im.width; c.height = im.height;
      c.getContext('2d').drawImage(im, 0, 0);
      const ctx = c.getContext('2d');
      return points.map(q => [...ctx.getImageData(q[0], q[1], 1, 1).data].slice(0, 3));
    }, b64, pts);
    await p.close();
    return out;
  };
  const a = await sample(off.png, off.pts);
  const c = await sample(on.png, on.pts);
  SPOTS.forEach((s, i) => {
    const d = Math.max(...[0, 1, 2].map(k => Math.abs(a[i][k] - c[i][k])));
    if (s[3]) {
      check('shaded: ' + s[2], d >= 6,
        'changed by ' + d + '  ' + JSON.stringify(a[i]) + ' -> ' + JSON.stringify(c[i]));
    } else {
      check('untouched: ' + s[2], d <= 2,
        'changed by ' + d + '  ' + JSON.stringify(a[i]) + ' -> ' + JSON.stringify(c[i]));
    }
  });
}

console.log('\n— it goes away as the reader zooms in —');
{
  const p = await b.newPage();
  await p.setViewport({ width: 1300, height: 900 });
  await p.goto(url(BASE | RELIEF), { waitUntil: 'networkidle0' });
  await sleep(3000);
  const read = () => p.evaluate(() => {
    const g = document.querySelector('#relief');
    const vb = document.getElementById('jmap').getAttribute('viewBox').split(' ');
    return { z: 2800 / parseFloat(vb[2]),
             op: parseFloat(getComputedStyle(g).opacity),
             shown: getComputedStyle(g).display !== 'none' };
  });
  const home = await read();
  check('it is drawn at the opening view', home.shown && home.op > 0.3,
    JSON.stringify(home));
  let deep = home;
  for (let i = 0; i < 10 && deep.z < 9; i++) {
    await p.mouse.move(650, 450); await p.mouse.wheel({ deltaY: -300 }); await sleep(340);
    deep = await read();
  }
  check('and is gone once its pixels would show', deep.z >= 6 && !deep.shown,
    JSON.stringify(deep));
  // and comes back
  for (let i = 0; i < 14; i++) {
    await p.mouse.move(650, 450); await p.mouse.wheel({ deltaY: 300 }); await sleep(300);
  }
  const back = await read();
  check('coming back out brings it back', back.shown && back.op > 0.3,
    JSON.stringify(back));
  await p.close();
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
    await sleep(3200);
    check(mode + ': its own image and no other',
      got.length === 1 && got[0] === 'relief-coarse-' + mode + '.webp', got.join(','));
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
console.log('\n— three sheets, and only the chosen one is fetched —');
{
  const LEVELS = ['coarse', 'fine', 'finest'];
  /* One page at a time, opened and closed. The three sheets decode to roughly
     48, 107 and 191 MB, and holding all three open at once ran the browser out
     of headroom here — `Input.dispatchMouseEvent` timed out mid-wheel. Which
     is itself the argument for offering the choice. */
  const at4x = [];
  let degs = null, kbs = null;
  for (let i = 0; i < 3; i++) {
    const p = await b.newPage();
    await p.setViewport({ width: 1300, height: 900 });
    const got = [];
    p.on('request', r => { if (/relief-/.test(r.url())) got.push(r.url().split('/').pop().split('?')[0]); });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url(BASE | RELIEF | DETAIL(i)), { waitUntil: 'networkidle0' });
    await sleep(3600);
    check(LEVELS[i] + ': fetches its own sheet and no other',
      got.length === 1 && got[0] === 'relief-' + LEVELS[i] + '-mercator.webp',
      got.join(','));
    const r = await p.evaluate(() => {
      const g = document.querySelector('#relief');
      const im = g && g.querySelector('image');
      const L = JMAP.RELIEF.levels;
      return { drawn: !!im && im.getBoundingClientRect().width > 0,
               op: im ? parseFloat(getComputedStyle(im).opacity) : 0,
               degs: L.map(x => x.deg), kbs: L.map(x => x.kb) };
    });
    check(LEVELS[i] + ': it is drawn at the opening view', r.drawn && r.op > 0.3,
      JSON.stringify(r));
    degs = r.degs; kbs = r.kbs;

    /* And the ramp. 4x is past where the coarse sheet has gone and inside
       where the finest is still untouched, so one zoom tells all three apart. */
    for (let n = 0; n < 12; n++) {
      const z = await p.evaluate(() => 2800 / parseFloat(
        document.getElementById('jmap').getAttribute('viewBox').split(' ')[2]));
      if (z >= 4) break;
      await p.mouse.move(650, 450); await p.mouse.wheel({ deltaY: -260 }); await sleep(330);
    }
    at4x.push(await p.evaluate(() => {
      const g = document.querySelector('#relief');
      const im = g.querySelector('image');
      return { z: +(2800 / parseFloat(document.getElementById('jmap')
                 .getAttribute('viewBox').split(' ')[2])).toFixed(2),
               op: getComputedStyle(g).display === 'none' ? 0
                   : parseFloat(getComputedStyle(im).opacity) };
    }));
    check(LEVELS[i] + ': no page errors', errs.length === 0, errs[0]);
    await p.close();
  }
  check('the three get finer, and heavier, in order',
    degs[0] < degs[1] && degs[1] < degs[2] && kbs[0] < kbs[1] && kbs[1] < kbs[2],
    JSON.stringify(degs) + ' ' + JSON.stringify(kbs));
  check('the coarse sheet has faded by 4x', at4x[0].op < 0.3, JSON.stringify(at4x[0]));
  check('and the finest has not', at4x[2].op > 0.5, JSON.stringify(at4x[2]));
  check('with the middle one between them',
    at4x[1].op >= at4x[0].op && at4x[1].op <= at4x[2].op, JSON.stringify(at4x));
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
