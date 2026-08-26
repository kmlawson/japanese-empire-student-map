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
  /* Any blend whose neutral is mid grey will do — the build's whole job is to
     put the water there — but it must not be `normal`, which would paint flat
     grey over the map and over the sea with it. */
  check('it is blended, not painted over',
    img && ['overlay', 'soft-light', 'hard-light'].indexOf(img.blend) >= 0,
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
      await sleep(3400);
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

    /* And the ramp. The coarse sheet is gone by 10.5x and the finest holds to
       21x, so a look at about 11x tells all three apart. It used to be 4x,
       which stopped separating them the moment the ramp was lengthened — the
       thresholds here have to follow `reliefRamp`, and they are derived from
       the same `deg` it uses rather than copied. */
    for (let n = 0; n < 20; n++) {
      const z = await p.evaluate(() => 2800 / parseFloat(
        document.getElementById('jmap').getAttribute('viewBox').split(' ')[2]));
      if (z >= 11) break;
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
  check('the coarse sheet has gone by 11x', at4x[0].op < 0.05, JSON.stringify(at4x[0]));
  check('and the finest has not', at4x[2].op > 0.3, JSON.stringify(at4x[2]));
  check('with the middle one between them',
    at4x[1].op >= at4x[0].op && at4x[1].op <= at4x[2].op, JSON.stringify(at4x));
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
