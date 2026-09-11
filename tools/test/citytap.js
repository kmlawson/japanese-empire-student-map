/* A city takes the tap before the track under it.
 *
 *     node tools/test/citytap.js           # needs a server on 8123
 *
 * The train tools take no pointer events — they cannot, or a transparent
 * ribbon along every railway would stop the country being named whenever the
 * pointer crossed one — so `handleTap` settles the order by measuring instead.
 * Measurement does not know what is painted on top, and the cities are: they
 * are drawn above the tools so a reader following a line can still see the
 * places it runs between. Pressing one opened the line under it.
 *
 * Both ways round, because there is no hover on a touch screen and the same
 * fix has been made twice here before for want of checking the second.
 */
'use strict';
const { sleep, ready, check, report, SHIM, launch, HOST } = require('./suite.js');
const BASE = process.env.MAP_URL || HOST + '/index.html';
const OVER_KOREA = '?epoch=1942&where=126.3,34.8,129.7,37.6';

const flip = async (p, id, on) => {
  await p.evaluate((sel, v) => {
    const b = document.querySelector(sel);
    if (b && b.checked !== v) {
      b.checked = v;
      b.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, id, on);
};

/* A city dot with a train line close enough under it to have stolen the tap.
 *
 * Measured here rather than asked of the tools: `hitAt` is the tools' own
 * answer and is private to that module, and a test hook published on `window`
 * for the sake of one assertion is production code carrying a test's weight.
 * The drawn track is public — `path.train-line` in the document — so its
 * points are sampled and mapped into client coordinates through
 * `getScreenCTM`, which is the same journey the pointer makes in reverse.
 *
 * Screen pixels throughout, deliberately. `getPointAtLength` walks the path in
 * *map* units and the samples are transformed before anything is compared, so
 * the 9-pixel test is a 9-pixel test at every zoom. Comparing a map-unit
 * distance against a pixel threshold is the mistake CLAUDE.md is about. */
const CITY_ON_TRACK = () => {
  const pts = [];
  for (const path of document.querySelectorAll('path.train-line')) {
    const m = path.getScreenCTM();
    if (!m) continue;
    const len = path.getTotalLength();
    if (!len) continue;
    const step = Math.max(len / 400, 0.5);
    for (let at = 0; at <= len; at += step) {
      const q = path.getPointAtLength(at);
      pts.push({ x: q.x * m.a + q.y * m.c + m.e, y: q.x * m.b + q.y * m.d + m.f });
    }
  }
  const out = [];
  for (const s of document.querySelectorAll('.gaz, .site')) {
    if (getComputedStyle(s).display === 'none') continue;
    const r = s.getBoundingClientRect();
    if (!r.width || r.x < 90 || r.y < 90) continue;
    if (r.x > innerWidth - 90 || r.y > innerHeight - 90) continue;
    const x = Math.round(r.x + r.width / 2), y = Math.round(r.y + r.height / 2);
    let best = Infinity;
    for (const q of pts) {
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < best) best = d;
    }
    if (best < 6) {
      out.push({ x: x, y: y, id: s.getAttribute('data-id') || s.id, dist: best });
    }
  }
  out.sort((a, b) => a.dist - b.dist);
  return out;
};

const CARD = () => {
  const box = document.getElementById('info');
  return { hidden: box.hidden,
           chip: box.querySelector('.chip').textContent,
           primary: box.querySelector('.primary').textContent };
};

async function stage(p, finger) {
  await p.goto(BASE + OVER_KOREA, { waitUntil: 'domcontentloaded' });
  await ready(p);
  await p.evaluate(() => document.querySelectorAll('dialog[open]')
    .forEach(d => d.close()));
  /* The cities have to be on. `#gaz` — the gazetteer, which is where all but
     a hundred of the dots are — is shown by `state.cats.city`, and the button
     that sets it is the Cities one in the header. Pressed rather than reached
     for directly: `applyGazetteer` is what actually unhides the group, and the
     button is what calls it. */
  await p.evaluate(() => {
    const b = document.querySelector('[data-cat="city"]');
    if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
  });
  await sleep(700);
  await flip(p, '#opt-kr-rail', true);
  await sleep(1800);
  await flip(p, '#opt-train-tools', true);
  await sleep(7000);
  /* Widening the detail level re-opens the whole empire and mounting the tools
     fits them to their own network, so the view has moved twice by now. It is
     put back by reloading with the code the map has just written for itself —
     which carries the cities, the railway and the tools — and `where` set over
     southern Korea, where the trunk line runs through Seoul, Taejŏn and Pusan
     and the dots sit on the track. Reloading rather than nudging the view:
     `?where=` is the one handle on it from outside, and it is the same handle
     a reader gets from a shared link. */
  const code = await p.evaluate(() =>
    new URL(location.href).searchParams.get('layers') || '');
  await p.goto(BASE + OVER_KOREA + '&layers=' + encodeURIComponent(code),
               { waitUntil: 'domcontentloaded' });
  await ready(p);
  await p.evaluate(() => document.querySelectorAll('dialog[open]')
    .forEach(d => d.close()));
  await sleep(8000);
  /* The drawn track, not the strip at the foot. Whether the bar is there is a
     fact about the furniture; what this test needs is that there is a line on
     the map to compete with a city for the tap. */
  const up = await p.evaluate(() =>
    document.querySelectorAll('path.train-line').length);
  check((finger ? 'finger: ' : 'mouse: ') + 'the train tools draw track over Korea',
        up > 0, up + ' lines drawn');
  return up;
}

(async () => {
  const browser = await launch();
  try {
    for (const finger of [false, true]) {
      const p = await browser.newPage();
      if (!finger) await p.evaluateOnNewDocument(SHIM);
      await p.setViewport(finger
        ? { width: 900, height: 1100, isMobile: true, hasTouch: true }
        : { width: 1200, height: 860 });
      const errs = [];
      p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      if (!(await stage(p, finger))) { await p.close(); continue; }

      const spots = await p.evaluate(CITY_ON_TRACK);
      check((finger ? 'finger: ' : 'mouse: ')
            + 'there is a city with a line under it to press',
            spots.length > 0, spots.length + ' found');
      if (spots.length) {
        const s = spots[0];
        if (finger) {
          await p.touchscreen.tap(s.x, s.y);
        } else {
          await p.mouse.move(s.x, s.y);
          await sleep(150);
          await p.mouse.click(s.x, s.y);
        }
        await sleep(800);
        const card = await p.evaluate(CARD);
        check((finger ? 'finger: ' : 'mouse: ')
              + 'pressing it opens the city, not the line under it',
              !card.hidden && !/line|ferry|railway/i.test(card.chip),
              s.id + ' at ' + s.dist.toFixed(1) + 'px from the track -> '
              + card.chip + ' / ' + card.primary);
      }
      check((finger ? 'finger: ' : 'mouse: ') + 'no page errors',
            errs.length === 0, errs.join(' | '));
      await p.close();
    }
  } finally {
    await browser.close();
  }
  report('citytap');
})();
