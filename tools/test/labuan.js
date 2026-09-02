/* Labuan, the worked example, finally pinned.
 *
 *     node tools/test/labuan.js          # with a server on 8123
 *
 * A Straits Settlement drawn inside the North Borneo atom, because that is
 * where the island is. Everything about it is a special case, and the project
 * notes call it the fault that "cost two goes" — yet nothing in the suite
 * held it. Four directions, each of which has been wrong at least once:
 *
 *   * hovering Labuan lights the Straits Settlements — all the scattered
 *     pieces, and not the atom it is drawn inside;
 *   * hovering North Borneo lights North Borneo and leaves Labuan dark
 *     (the foreign-sub exemption, now a plain fill rather than a
 *     reciprocal filter);
 *   * a finger's first tap on Labuan names Labuan, not North Borneo —
 *     the two-tap rule does not apply to a shape that is not part of the
 *     country it sits in;
 *   * and on the 1942 map the Dindings are Perak's, not Singapore's, so
 *     the lit set is one smaller.
 *
 * The lift is checked as a *computed fill*, not a class: the classes were
 * right in Safari for a month while nothing on screen changed. A fill that
 * differs from the base colour is what a reader actually sees.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('labuan test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { ready } = require('./settle.js');
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const SHIM = () => { const o = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} } : o.call(window, q)); };

const BASE = (1 << 3) | (1 << 5) | (1 << 6) | (2 << 8);
const BBOX = '&bbox=113.5,4.2,116.8,6.8';
const url = bits => 'http://localhost:8123/index.html?layers='
  + (bits >>> 0).toString(36) + BBOX;

const LABUAN_AT = () => {
  const el = document.querySelector('[data-prov="Labuan"]');
  if (!el) return null;
  const bb = el.getBBox(), svg = el.ownerSVGElement,
        m = svg.getScreenCTM(), q = svg.createSVGPoint();
  q.x = bb.x + bb.width / 2; q.y = bb.y + bb.height / 2;
  const s = q.matrixTransform(m);
  return { x: s.x, y: s.y };
};
const STATE = () => {
  const lab = document.querySelector('[data-prov="Labuan"]');
  const nb = lab && lab.closest('.atom');
  return {
    nbId: nb ? nb.id : null,
    nbHot: !!(nb && nb.classList.contains('hot')),
    nbFill: nb ? getComputedStyle(nb).fill : null,
    labFill: lab ? getComputedStyle(lab).fill : null,
    labForeign: !!(lab && lab.classList.contains('foreign-sub')),
    hotProvs: [...document.querySelectorAll('path.hot')]
      .map(e => e.getAttribute('data-prov')).filter(Boolean).sort(),
    tip: ((document.querySelector('#tooltip') || {}).textContent || '').slice(0, 40),
  };
};

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const open = async (bits, touch) => {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(touch ? { width: 900, height: 1000, isMobile: true, hasTouch: true }
                            : { width: 1300, height: 950 });
  if (!touch) await p.evaluateOnNewDocument(SHIM);
  await p.goto(url(bits), { waitUntil: 'networkidle0' });
  await ready(p);
  p.__ctx = ctx;
  return p;
};

console.log('\n— hovering Labuan lights the Straits Settlements, not its atom —');
{
  const p = await open(BASE);
  const at = await p.evaluate(LABUAN_AT);
  check('Labuan is drawn', !!at);
  await p.mouse.move(at.x - 50, at.y + 50); await sleep(300);
  await p.mouse.move(at.x, at.y); await sleep(900);
  const s = await p.evaluate(STATE);
  check('it is a foreign sub of ' + s.nbId, s.labForeign);
  check('the tooltip names Labuan', /^Labuan/.test(s.tip), s.tip);
  check('all the scattered pieces light: ' + s.hotProvs.join(', '),
    JSON.stringify(s.hotProvs) === JSON.stringify(
      ['Christmas Island', 'Dindings', 'Labuan', 'Malacca', 'Penang', 'Singapore']),
    s.hotProvs.join(','));
  check('and North Borneo does not', !s.nbHot);
  check('as a reader sees it: Labuan\'s fill lifts and the atom\'s stays',
    s.labFill !== s.nbFill, s.labFill + ' vs ' + s.nbFill);
  await p.__ctx.close();
}

console.log('\n— hovering North Borneo leaves Labuan dark —');
{
  const p = await open(BASE);
  const at = await p.evaluate(LABUAN_AT);
  const base = (await p.evaluate(STATE)).labFill;
  await p.mouse.move(at.x + 180, at.y + 100); await sleep(300);
  await p.mouse.move(at.x + 220, at.y + 120); await sleep(900);
  const s = await p.evaluate(STATE);
  check('North Borneo is hot', s.nbHot, s.tip);
  check('its fill lifts', s.nbFill !== base, s.nbFill);
  check('Labuan keeps the plain colour', s.labFill === base,
    s.labFill + ' vs base ' + base);
  await p.__ctx.close();
}

console.log('\n— a finger\'s first tap names Labuan, not North Borneo —');
{
  const p = await open(BASE, true);
  const at = await p.evaluate(LABUAN_AT);
  await p.mouse.move(at.x, at.y);
  await p.mouse.down(); await sleep(80); await p.mouse.up();
  await sleep(800);
  const card = await p.evaluate(() =>
    ((document.querySelector('#info') || {}).textContent || '').replace(/\s+/g, ' '));
  check('the card is Labuan\'s', /Labuan/.test(card.slice(0, 40)), card.slice(0, 60));
  check('and not North Borneo\'s', !/North Borneo/.test(card.slice(0, 40)), card.slice(0, 60));
  await p.__ctx.close();
}

console.log('\n— and in 1942 the Dindings are Perak\'s again —');
{
  const p = await open(BASE | 1);
  const at = await p.evaluate(LABUAN_AT);
  await p.mouse.move(at.x - 50, at.y + 50); await sleep(300);
  await p.mouse.move(at.x, at.y); await sleep(900);
  const s = await p.evaluate(STATE);
  check('the lit set drops to five: ' + s.hotProvs.join(', '),
    JSON.stringify(s.hotProvs) === JSON.stringify(
      ['Christmas Island', 'Labuan', 'Malacca', 'Penang', 'Singapore']),
    s.hotProvs.join(','));
  await p.__ctx.close();
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
