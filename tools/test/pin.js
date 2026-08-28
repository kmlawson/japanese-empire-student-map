/* The pinned outline, and the two things about it that will break first.
 *
 *     node tools/test/pin.js             # with a server on 8123
 *
 * A cmd-click keeps an outline on the map, and it is the only line here that
 * is not an answer to where the pointer is. Two invariants:
 *
 *   * IT SURVIVES A PAN AND A ZOOM. `dropForGesture` throws away the hover
 *     and the selection the moment a gesture starts, because a line round the
 *     country the pointer *was* over is a lie as soon as the map moves. The
 *     pin is deliberately outside that, and anything that folds it back into
 *     the ordinary highlight lifecycle takes the feature away.
 *
 *   * ITS BLUR IS IN SCREEN PIXELS. `stdDeviation` is a user-unit quantity —
 *     the project's most-repeated bug, shipped twice — so it is rewritten
 *     from `k` on every rescale. Checked at three zooms a hundredfold apart,
 *     because a single check at the opening view is where `k` is about 1 and
 *     everything passes whether or not the conversion is there.
 *
 * And the ways out: a click inside takes it off, a cmd-click inside toggles
 * it, a cmd-click on the sea clears it. A finger cannot pin at all — there is
 * no modifier on a touch screen — so a plain tap must be untouched.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('pin test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const SHIM = () => { const o = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} } : o.call(window, q)); };

const BLUR_PX = 2.2;                  // must match PIN_BLUR_PX in map.js
const STATE = () => {
  const g = document.querySelector('#highlight .hi-pinned');
  const f = document.querySelector('#pin-glow feGaussianBlur');
  const vb = document.getElementById('jmap').getAttribute('viewBox').split(/\s+/).map(Number);
  const p = g && g.querySelector('path');
  return { pin: !!g,
           paths: g ? g.querySelectorAll('path,circle').length : 0,
           filter: g ? g.getAttribute('filter') : null,
           stroke: p ? getComputedStyle(p).stroke : null,
           d0: p ? (p.getAttribute('d') || '').slice(0, 24) : '',
           dev: f ? +f.getAttribute('stdDeviation') : null,
           k: vb[2] / document.getElementById('map-container').clientWidth,
           vb: vb.join(' '),
           card: !document.querySelector('#info').hidden };
};

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const open = async (bbox, touch) => {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(touch ? { width: 900, height: 800, isMobile: true, hasTouch: true }
                            : { width: 1300, height: 900 });
  if (!touch) await p.evaluateOnNewDocument(SHIM);
  await p.goto('http://localhost:8123/index.html?bbox=' + bbox, { waitUntil: 'networkidle0' });
  await sleep(3000);
  p.__ctx = ctx;
  return p;
};
const cmdClick = async (p, x, y) => {
  await p.mouse.move(x, y); await sleep(250);
  await p.keyboard.down('Meta'); await p.mouse.click(x, y); await p.keyboard.up('Meta');
  await sleep(600);
};

console.log('— a country, with Admin off —');
{
  const p = await open('100,18,135,48');
  const at = { x: 470, y: 430 };
  await cmdClick(p, at.x, at.y);
  const a = await p.evaluate(STATE);
  check('a cmd-click pins an outline', a.pin, JSON.stringify(a).slice(0, 90));
  check('it is a country: more than one shape', a.paths > 1, String(a.paths));
  check('bright yellow', a.stroke === 'rgb(255, 210, 0)', String(a.stroke));
  check('and it wears the blur filter', a.filter === 'url(#pin-glow)', String(a.filter));
  check('the deviation is ' + BLUR_PX + ' screen pixels',
        Math.abs(a.dev / a.k - BLUR_PX) < 0.02, a.dev + ' / ' + a.k.toFixed(4));

  // the pointer leaving is not a reason to drop it
  await p.mouse.move(at.x + 300, at.y - 200); await sleep(400);
  check('it survives the pointer moving away', (await p.evaluate(STATE)).pin);

  // a pan
  await p.mouse.move(700, 500); await p.mouse.down();
  await p.mouse.move(560, 410, { steps: 10 }); await p.mouse.up();
  await sleep(500);
  const c = await p.evaluate(STATE);
  check('it survives a pan', c.pin);
  check('and the map really moved', c.vb !== a.vb, c.vb);

  // zoom in a long way, then out past where it started
  await p.mouse.move(700, 470);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel({ deltaY: -220 }); await sleep(160); }
  await sleep(600);
  const d = await p.evaluate(STATE);
  check('it survives a zoom in', d.pin);
  check('the blur is still ' + BLUR_PX + ' screen pixels at k=' + d.k.toFixed(3),
        Math.abs(d.dev / d.k - BLUR_PX) < 0.02, d.dev + ' / ' + d.k.toFixed(4));
  for (let i = 0; i < 9; i++) { await p.mouse.wheel({ deltaY: 220 }); await sleep(150); }
  await sleep(600);
  const e = await p.evaluate(STATE);
  check('and at k=' + e.k.toFixed(3) + ', a hundredfold away from the first',
        Math.abs(e.dev / e.k - BLUR_PX) < 0.02, e.dev + ' / ' + e.k.toFixed(4));
  check('the two zooms really were far apart', e.k / d.k > 15,
        d.k.toFixed(4) + ' -> ' + e.k.toFixed(4));
  await p.__ctx.close();
}

console.log('\n— a division, with Admin on —');
{
  const p = await open('104,28,120,42');
  await p.evaluate(() => document.querySelector('header button[data-cat="territory"]').click());
  await sleep(2500);
  const at = { x: 650, y: 450 };
  await p.mouse.move(at.x, at.y); await sleep(700);
  const prov = await p.evaluate(() => {
    const e = document.querySelector('#land [data-prov].prov-hot');
    return e ? e.getAttribute('data-prov') : null;
  });
  check('a province is under the pointer: ' + prov, !!prov);
  await cmdClick(p, at.x, at.y);
  const a = await p.evaluate(STATE);
  check('the pin holds the division, not the country', a.pin && a.paths === 1,
        a.paths + ' shape(s)');

  await p.mouse.move(500, 620); await p.mouse.down();
  await p.mouse.move(430, 560, { steps: 8 }); await p.mouse.up(); await sleep(500);
  check('and it too survives a pan', (await p.evaluate(STATE)).pin);

  // a plain click inside takes it off — and still selects, as a click does
  const mid = await p.evaluate(() => {
    const r = document.querySelector('#highlight .hi-pinned').getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  await p.mouse.move(mid.x, mid.y); await sleep(350);
  await p.mouse.click(mid.x, mid.y); await sleep(600);
  const c = await p.evaluate(STATE);
  check('a plain click inside takes the pin off', !c.pin);
  check('and still opens the card, as a click always did', c.card);

  await cmdClick(p, mid.x, mid.y);
  check('cmd-click puts it back', (await p.evaluate(STATE)).pin);
  await cmdClick(p, mid.x, mid.y);
  check('and a second one takes it off', !(await p.evaluate(STATE)).pin);

  /* Somewhere the map's own hit test finds nothing — searched for rather than
     guessed at, because at this zoom nearly every corner of the frame is
     still China and a guess pins a second country instead of clearing. */
  const sea = await p.evaluate(() => {
    const c = document.getElementById('map-container').getBoundingClientRect();
    for (let y = c.top + 40; y < c.bottom - 40; y += 40) {
      for (let x = c.left + 40; x < c.right - 40; x += 40) {
        const el = document.elementFromPoint(x, y);
        if (!el || !el.closest) continue;
        if (el.closest('#land, #backings, #seams, .hit, header, aside, #info')) continue;
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
    return null;
  });
  await cmdClick(p, mid.x, mid.y);
  check('found open sea to press', !!sea, JSON.stringify(sea));
  if (sea) {
    await cmdClick(p, sea.x, sea.y);
    check('a cmd-click on open sea clears it', !(await p.evaluate(STATE)).pin);
  }
  await p.__ctx.close();
}

console.log('\n— and a finger, which has no modifier to press —');
{
  const p = await open('104,28,120,42', true);
  const tap = async (x, y) => { await p.mouse.move(x, y); await p.mouse.down();
                                await sleep(70); await p.mouse.up(); await sleep(650); };
  await tap(450, 400);
  const a = await p.evaluate(STATE);
  check('a tap names what it hit, as before', a.card);
  check('and pins nothing', !a.pin);
  await tap(450, 400);
  const c = await p.evaluate(STATE);
  check('a second tap — the two-tap rule — still pins nothing', !c.pin);
  await p.__ctx.close();
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
