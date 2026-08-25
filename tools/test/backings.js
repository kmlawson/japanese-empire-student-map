/* Do the whole-country backings stay drawn?
 *
 *     node tools/test/backings.js          # needs a server on 8123
 *
 * A backing is the single polygon that draws a country whose atom is an empty
 * group. It is hidden as "redundant" once the atom carries the country's own
 * divisions — and it must NOT be hidden when the fine coastline layer grafts a
 * window of small islands into that same atom, which is how Japan came to
 * vanish for any reader who zoomed near it. See docs/tasks.md.
 */
'use strict';
const puppeteer = (function () {
  const tries = [];
  if (process.env.PUPPETEER_PATH) tries.push(process.env.PUPPETEER_PATH);
  tries.push('puppeteer');
  for (const t of tries) { try { return require(t); } catch (e) { /* keep looking */ } }
  console.error('backings test: puppeteer not found. npm install puppeteer, or set PUPPETEER_PATH.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.MAP_URL || 'http://localhost:8123/index.html';

/* How much of a country is actually painted: its atom's live paths plus its
   backing, if that is showing. Zero means the country is not on the map. */
const PAINTED = (key) => {
  const atom = document.getElementById('a-' + key);
  const back = document.querySelector('#backings [data-for="' + key + '"]');
  let n = 0;
  [...(atom ? atom.querySelectorAll('path') : []), back].forEach(e => {
    if (!e || getComputedStyle(e).display === 'none') return;
    if (e.classList.contains('superseded')) return;
    const b = e.getBBox();
    n += b.width * b.height;
  });
  return Math.round(n);
};

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 900, height: 1200, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(BASE, { waitUntil: 'networkidle0' });
  await sleep(3500);

  const home = await p.evaluate(PAINTED, 'japan');
  check('Japan is drawn at the opening view', home > 100000, home + ' units²');

  // in past the Japanese fine window (it grafts at 420, sooner than any other)
  for (let i = 0; i < 3; i++) {
    await p.evaluate(() => document.querySelector('#zoom-in').click());
    await sleep(1100);
  }
  const deep = await p.evaluate(PAINTED, 'japan');
  check('and still drawn once its fine coastline grafts', deep > 100000, deep + ' units²');

  for (let i = 0; i < 3; i++) {
    await p.evaluate(() => document.querySelector('#zoom-out').click());
    await sleep(1100);
  }
  const back = await p.evaluate(PAINTED, 'japan');
  check('and still drawn on the way back out', back > 100000, back + ' units²');
  check('nothing was lost across the round trip', back >= home,
    home + ' at home against ' + back + ' after');

  // and the thing the rule exists for still happens
  const before = await p.evaluate(() =>
    document.querySelectorAll('#backings [data-for]:not(.redundant)').length);
  await p.evaluate(() => document.querySelector('[data-cat="territory"]').click());
  await sleep(3500);
  const after = await p.evaluate(() =>
    document.querySelectorAll('#backings [data-for]:not(.redundant)').length);
  check('the administrative sheet still stands the backings down', after < before,
    before + ' live before, ' + after + ' after');
  check('no page errors', errs.length === 0, errs[0]);

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail);
})();
