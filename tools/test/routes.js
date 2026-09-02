/* The shipping-route tool in the admin panel.
 *
 *     node tools/test/routes.js         # with a server on 8123
 *
 * A route is a chain of ports with a *drawn* course between them: a shipping
 * lane rounds Shandong and threads the Inland Sea, and a straight line between
 * two dots says none of that. So the tool takes cities as stops, takes bends
 * between them, and draws a spline through every one of them.
 *
 * Four things about it could go quietly wrong, and each is checked here
 * because each of them did while it was being built.
 *
 * **There are two kinds of city dot.** The curated places are
 * `#markers g.site[data-cat="city"]` and the gazetteer's are `#gaz g`, keyed
 * `g_e1930_kobe`. Looking only in `#gaz` found nothing at Kobe — Kobe is
 * curated — and the tool did nothing at all when tapped, with no sign of why.
 *
 * **Shift already belonged to something.** A shift-press on the map starts the
 * admin marquee, which returns before the tap hook is ever reached, so the
 * bend gesture never arrived. A tool claims shift through `JMAP_SHIFT` now.
 *
 * **The course must pass through the bends**, not near them. It is a
 * Catmull-Rom spline written as cubics; with no bends it is the straight line
 * between two ports, which is what open water should be.
 *
 * **And the readout is the whole product.** The tool saves nothing to the map;
 * `Finish line` has to leave the JSON in the box, because taking it away at
 * the moment the reader says finished would throw the work out.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('routes test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { ready } = require('./settle.js');
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const SEC = () => [...document.querySelectorAll('#jmap-admin section')]
  .find(x => /Shipping routes/.test((x.querySelector('h2') || {}).textContent || ''));

const state = p => p.evaluate(() => {
  const sc = [...document.querySelectorAll('#jmap-admin section')]
    .find(x => /Shipping routes/.test((x.querySelector('h2') || {}).textContent || ''));
  if (!sc) return null;
  const leg = document.querySelector('#jmap-route .leg');
  return {
    read: (sc.querySelector('.readout') || {}).textContent || '',
    ta: ((sc.querySelector('textarea') || {}).value || ''),
    btns: [...sc.querySelectorAll('button')]
      .map(b => b.textContent + (b.disabled ? '(x)' : '')),
    stops: document.querySelectorAll('#jmap-route circle.stop').length,
    bends: document.querySelectorAll('#jmap-route circle.bend').length,
    d: leg ? leg.getAttribute('d') || '' : '',
    cities: (document.querySelector('[data-cat="city"]') || {}).getAttribute
      ? document.querySelector('[data-cat="city"]').getAttribute('aria-pressed') : null,
  };
});
const pressBtn = (p, label) => p.evaluate(l => {
  const sc = [...document.querySelectorAll('#jmap-admin section')]
    .find(x => /Shipping routes/.test((x.querySelector('h2') || {}).textContent || ''));
  [...sc.querySelectorAll('button')].find(x => x.textContent === l).click();
}, label);
const dotAt = (p, id) => p.evaluate(id => {
  const all = document.querySelectorAll(
    '#markers g.site[data-cat="city"], #gaz g[data-id]');
  for (const e of all) {
    if ((e.getAttribute('data-id') || '').split('_').pop() !== id) continue;
    const r = e.getBoundingClientRect();
    if (r.width) return { x: Math.round(r.left + r.width / 2),
                          y: Math.round(r.top + r.height / 2) };
  }
  return null;
}, id);
const tap = async (p, x, y, shift) => {
  if (shift) await p.keyboard.down('Shift');
  await p.mouse.move(x, y); await p.mouse.down(); await sleep(70); await p.mouse.up();
  if (shift) await p.keyboard.up('Shift');
  await sleep(500);
};
const onCourse = (p, frac) => p.evaluate(f => {
  const el = document.querySelector('#jmap-route .leg');
  const q = el.getPointAtLength(el.getTotalLength() * f);
  const s = el.ownerSVGElement.createSVGPoint();
  s.x = q.x; s.y = q.y;
  const sc = s.matrixTransform(el.getScreenCTM());
  return { x: Math.round(sc.x), y: Math.round(sc.y) };
}, frac);

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1500, height: 950 });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.evaluateOnNewDocument(() => {
    const m = window.matchMedia;
    window.matchMedia = q => (/hover: hover|pointer: fine/.test(q)
      ? { matches: true, media: q, addListener() {}, removeListener() {},
          addEventListener() {}, removeEventListener() {} }
      : m.call(window, q));
    try { localStorage.setItem('jmap-admin', '1'); } catch (e) { /* private */ }
  });
  await p.goto('http://localhost:8123/index.html?where=118,26,146,44',
               { waitUntil: 'networkidle0' });
  await ready(p);

  console.log('\n— the tool is there and asleep —');
  let s = await state(p);
  check('the panel carries a Shipping routes section', !!s);
  check('and it starts with nothing armed and nothing to copy',
    s.btns.join(',') === 'Add route,Add another stop(x),Finish line(x),Undo(x),Clear(x),Copy route(x)',
    s.btns.join(','));

  console.log('\n— Add route brings the cities on —');
  /* The dots have to be on to be tapped, and pressing Add route is the reader
     saying they want them. This map opens with Cities off. */
  const before = await p.evaluate(() =>
    document.querySelector('[data-cat="city"]').getAttribute('aria-pressed'));
  check('this map opens with the cities off', before !== 'true', String(before));
  await pressBtn(p, 'Add route');
  await sleep(1400);
  s = await state(p);
  check('and Add route turns them on', s.cities === 'true', String(s.cities));
  check('the readout says what to do', /tap a city for the next stop/.test(s.read), s.read);

  console.log('\n— two ports make a leg —');
  const kobe = await dotAt(p, 'kobe');
  check('Kobe has a dot, and it is a curated one rather than a gazetteer one',
    !!kobe, JSON.stringify(kobe));
  await tap(p, kobe.x, kobe.y);
  const nag = await dotAt(p, 'nagasaki');
  await tap(p, nag.x, nag.y);
  s = await state(p);
  check('two stops', s.stops === 2 && /2 stops/.test(s.read), s.read);
  /* A leg is a great circle walked on the sphere and projected, so it is many
     short cubics rather than one span — the count is what says it is an arc
     and not a chord. */
  /* Kōbe to Nagasaki is five and a half degrees of arc, so at one sample every
     two degrees it is three spans — few, because the leg is short and the
     sampling is proportional to it. What matters is that it is more than the
     one span a chord would be; the four-thousand-mile leg checked at the foot
     of this file comes out at twenty-four. */
  const legCurves = (s.d.match(/C/g) || []).length;
  check('and the leg is drawn as a sampled arc, not a chord',
    legCurves > 1, String(legCurves));
  /* The tool steps aside after a leg exists, so a stray tap on the sea does
     not add a port the reader did not mean. */
  check('and it stops picking, so the next tap is not a third port',
    /shift-click the line to bend it/.test(s.read), s.read);

  console.log('\n— shift-click bends it —');
  const mid = await onCourse(p, 0.5);
  await tap(p, mid.x, mid.y, true);
  s = await state(p);
  check('a bend goes in where the line was pressed', s.bends === 1 && /1 bend/.test(s.read), s.read);
  check('and the course is longer for it, the bend adding a span of its own',
    (s.d.match(/C/g) || []).length > legCurves,
    (s.d.match(/C/g) || []).length + ' vs ' + legCurves);
  check('the stops are untouched', s.stops === 2, String(s.stops));

  console.log('\n— and the bend can be dragged —');
  const h = await p.evaluate(() => {
    const c = document.querySelector('#jmap-route circle.bend');
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  await p.mouse.move(h.x, h.y); await p.mouse.down(); await sleep(90);
  await p.mouse.move(h.x, h.y + 90, { steps: 10 }); await sleep(140);
  await p.mouse.up(); await sleep(600);
  /* The course has to go *through* the bend, not near it. Sample the drawn
     path and find how close it comes to where the handle now is. */
  const miss = await p.evaluate(() => {
    const c = document.querySelector('#jmap-route circle.bend');
    const r = c.getBoundingClientRect();
    const hx = r.left + r.width / 2, hy = r.top + r.height / 2;
    const el = document.querySelector('#jmap-route .leg');
    const L = el.getTotalLength();
    let best = Infinity;
    for (let i = 0; i <= 500; i++) {
      const q = el.getPointAtLength(L * i / 500);
      const s = el.ownerSVGElement.createSVGPoint();
      s.x = q.x; s.y = q.y;
      const sc = s.matrixTransform(el.getScreenCTM());
      best = Math.min(best, Math.hypot(sc.x - hx, sc.y - hy));
    }
    return Math.round(best * 10) / 10;
  });
  check('the drawn course passes through the bend', miss < 1.5, miss + ' px away');

  console.log('\n— another stop, and finishing —');
  await pressBtn(p, 'Add another stop');
  await sleep(300);
  s = await state(p);
  check('Add another stop goes back to picking',
    /tap a city for the next stop/.test(s.read), s.read);
  const sh = await dotAt(p, 'shanghai');
  await tap(p, sh.x, sh.y);
  s = await state(p);
  check('a third port joins on from the last one', s.stops === 3, String(s.stops));
  await p.evaluate(() => {
    const sc = [...document.querySelectorAll('#jmap-admin section')]
      .find(x => /Shipping routes/.test((x.querySelector('h2') || {}).textContent || ''));
    const i = sc.querySelector('input.txt');
    i.value = 'weekly'; i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(300);
  await pressBtn(p, 'Finish line');
  await sleep(700);
  s = await state(p);
  check('Finish line says so', /finished/.test(s.read), s.read);
  /* The readout is the whole product of the tool — it saves nothing to the map
     — so finishing must leave it standing. */
  check('and leaves the course drawn and the JSON in the box',
    s.stops === 3 && s.bends === 1 && s.ta.length > 40,
    s.stops + '/' + s.bends + ', ' + s.ta.length + ' chars');
  check('and puts the cities back as it found them', s.cities !== 'true', String(s.cities));

  console.log('\n— what comes out —');
  let out = null;
  try { out = JSON.parse(s.ta); } catch (e) { /* checked below */ }
  check('it is JSON', !!out, s.ta.slice(0, 80));
  check('with the frequency the reader typed', out.frequency === 'weekly', out.frequency);
  check('the ports in order', out.stops.join(',') === 'kobe,nagasaki,shanghai',
    out.stops.join(','));
  check('their names beside them', /Kobe/.test(out.names[0]) && /Nagasaki/.test(out.names[1]),
    out.names.join(','));
  check('and the date, the ids being one per map', /^e\d+$/.test(out.epoch), out.epoch);
  /* Two readings of the same route. `legs` is what has to be drawn, port to
     port with the bends between; `course` is the whole thing as one line. */
  check('two legs, and the bend is in the first of them',
    out.legs.length === 2 && out.legs[0].bends.length === 1
    && out.legs[1].bends.length === 0,
    JSON.stringify(out.legs.map(l => l.bends.length)));
  check('the legs are chained, each from where the last ended',
    out.legs[0].to === out.legs[1].from, out.legs[0].to + ' / ' + out.legs[1].from);
  check('and the whole course is four points, ports and bend alike',
    out.course.length === 4, String(out.course.length));
  check('every one of them a plausible lon/lat',
    out.course.every(c => c.length === 2 && c[0] > 100 && c[0] < 160
                          && c[1] > 20 && c[1] < 50),
    JSON.stringify(out.course));

  check('no page errors', !errs.length, errs.join(' | '));
  await p.close();

  console.log('\n— a leg is a great circle, so it bends as the projection bends —');
  /* Interpolated straight in projected units a leg was a straight line on the
     screen, which is a course no ship steered and which means something
     different in every projection the map offers. The span is walked on the
     sphere now and every point on it projected, so what is drawn follows
     whatever projection is on with no special case for any of them.
     
     Measured as the greatest departure from the straight line between the two
     ends, in screen pixels: zero for a straight line, and a different number
     in each projection for a great circle. */
  const BASE = 32 | 64;                      // the opening state: extent, rivers
  const code = bits => (bits >>> 0).toString(36);
  const bow = pg => pg.evaluate(() => {
    const el = document.querySelector('#jmap-route .leg');
    const d = el.getAttribute('d') || '';
    if (!d) return null;
    const L = el.getTotalLength(), S = el.ownerSVGElement;
    const at = f => {
      const q = el.getPointAtLength(L * f);
      const s = S.createSVGPoint(); s.x = q.x; s.y = q.y;
      const c = s.matrixTransform(el.getScreenCTM());
      return { x: c.x, y: c.y };
    };
    const a = at(0), b2 = at(1);
    let best = 0;
    for (let i = 1; i < 200; i++) {
      const q = at(i / 200);
      const den = Math.pow(b2.x - a.x, 2) + Math.pow(b2.y - a.y, 2) || 1;
      const t = ((q.x - a.x) * (b2.x - a.x) + (q.y - a.y) * (b2.y - a.y)) / den;
      best = Math.max(best, Math.hypot(a.x + (b2.x - a.x) * t - q.x,
                                       a.y + (b2.y - a.y) * t - q.y));
    }
    return { bow: Math.round(best * 10) / 10, cubics: (d.match(/C/g) || []).length };
  });
  const seen = {};
  for (const [bits, want, label] of [[BASE, 'mercator', 'Web Mercator'],
                                     [BASE | (1 << 15), 'albers', 'Albers conic'],
                                     [BASE | (2 << 15), 'laea', 'Lambert azimuthal']]) {
    const q = await b.newPage();
    await q.setViewport({ width: 1500, height: 950 });
    await q.evaluateOnNewDocument(() => {
      try { localStorage.setItem('jmap-admin', '1'); } catch (e) { /* private */ }
    });
    await q.goto('http://localhost:8123/index.html?layers=' + code(bits),
                 { waitUntil: 'networkidle0' });
    await ready(q);
    const mode = await q.evaluate(() =>
      window.JMAP_GEO ? window.JMAP_GEO.mode() : null);
    check(label + ': the map is in it, and admin.js can read that',
      mode === want, String(mode));
    await pressBtn(q, 'Add route');
    await sleep(1400);
    const vis = id => q.evaluate(id => {
      for (const e of document.querySelectorAll(
        '#markers g.site[data-cat="city"], #gaz g[data-id]')) {
        if ((e.getAttribute('data-id') || '').split('_').pop() !== id) continue;
        const r = e.getBoundingClientRect();
        if (r.width && r.left > 0 && r.top > 60 && r.right < 1490 && r.bottom < 940) {
          return { x: Math.round(r.left + r.width / 2),
                   y: Math.round(r.top + r.height / 2) };
        }
      }
      return null;
    }, id);
    const t1 = await vis('tokyo'), t2 = await vis('singapore');
    if (t1 && t2) {
      await tap(q, t1.x, t1.y);
      await tap(q, t2.x, t2.y);
      const m = await bow(q);
      seen[want] = m;
      /* Tōkyō to Singapore is four thousand miles. A straight line would be
         zero; anything a reader would call bent is several pixels. */
      check(label + ': the course leaves the straight line', m && m.bow > 2,
        JSON.stringify(m));
      check(label + ': and is drawn as the sampled arc, not one span',
        m && m.cubics > 8, JSON.stringify(m));
    } else {
      check(label + ': both ports are on screen', false, JSON.stringify([t1, t2]));
    }
    await q.close();
  }
  /* The point of doing it on the sphere: the same two ports, a different
     picture, because the projection is what decides how a great circle looks.
     Mercator throws it much further off the chord than the azimuthal does. */
  check('and the same two ports bow differently in different projections',
    seen.mercator && seen.laea && Math.abs(seen.mercator.bow - seen.laea.bow) > 1,
    JSON.stringify(seen));

  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
