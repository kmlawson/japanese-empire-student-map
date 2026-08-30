/* What the reader had open, across a change of date.
 *
 *     node tools/test/epoch.js          # with a server on 8123
 *
 * Changing the date rebuilds the map: `byId` becomes the new epoch's records
 * and the shapes under the pointer are new shapes. So the selection is dropped
 * and made again from what it was *about* — a place, not an element.
 *
 * The three cases that are not simply "the same again":
 *
 *   * a territory that belongs to one date — the Nanking government, Manchuria
 *     before 1932 — is let go, because there is nothing on this map for the
 *     card to be about;
 *   * a province drawn on one date only leaves the country selected rather
 *     than a card for a shape that is not there;
 *   * a city is one record per date under two ids — `g_e1930_seoul` and
 *     `g_e1942_seoul` are the same place — so the id is rewritten first.
 *
 * And the blurb about the new date is shown only when nothing was restored:
 * a reader who had a card open asked to see *that* on this date, and a card
 * about the date on top of it is the map talking over them.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('epoch test: puppeteer not found.');
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

const open = async (b, url) => {
  const p = await b.newPage();
  await p.evaluateOnNewDocument(SHIM);
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(3000);
  return p;
};
const clickOn = async (p, sel, fx, fy) => {
  const at = await p.evaluate((s, ax, ay) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width * ax), y: Math.round(r.y + r.height * ay) };
  }, sel, fx === undefined ? 0.5 : fx, fy === undefined ? 0.5 : fy);
  if (!at) return false;
  await p.mouse.move(at.x - 40, at.y); await sleep(150);
  await p.mouse.move(at.x, at.y); await sleep(400);
  await p.mouse.click(at.x, at.y); await sleep(700);
  return true;
};
const flip = async (p, to) => {
  await p.evaluate(t => {
    const b = [...document.querySelectorAll('#epoch-seg button')]
      .find(x => x.textContent.trim() === t);
    if (b) b.click();
  }, to);
  await sleep(2400);
};
const card = p => p.evaluate(() => ({
  open: !document.querySelector('#info').hidden,
  name: (document.querySelector('#info .primary') || {}).textContent,
  chip: (document.querySelector('#info .chip') || {}).textContent,
  pop: [...document.querySelectorAll('#info-pop .pop-head')].map(e => e.textContent),
}));

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— a province on both dates —');
  let p = await open(b, 'http://localhost:8123/index.html?where=123.5,32.8,132.5,43.5&layers=8');
  await clickOn(p, '#a-korea path[data-prov="Kogen"]');
  let c = await card(p);
  check('opens on the province', /Kangw.n/.test(c.name), c.name);
  await flip(p, 'Dec 1942');
  c = await card(p);
  check('and the other date keeps it', /Kangw.n/.test(c.name), c.name);
  check('rather than the blurb about the date',
    !/^(1930|Dec 1942)$/.test(c.name), c.name);
  await flip(p, '1930');
  check('and back again', /Kangw.n/.test((await card(p)).name));
  await p.close();

  console.log('\n— a city, which is a record per date —');
  p = await open(b, 'http://localhost:8123/index.html?where=123.5,32.8,132.5,43.5&layers=2');
  await clickOn(p, '#gaz .gaz[data-id="g_e1930_kaesong"]');
  c = await card(p);
  check('opens on the city', /Kaes.ng/.test(c.name), c.name);
  check('with the 1930 census under it',
    c.pop.some(h => /1930/.test(h)), c.pop.join(' | '));
  await flip(p, 'Dec 1942');
  c = await card(p);
  check('the same city on the other date', /Kaes.ng/.test(c.name), c.name);
  /* The card carries the date the reader is on and no other, so a city on the
     1942 map has no block: nothing was counted for a city on that date. What
     is kept across the switch is the place — the figures are a date away, and
     in the table with both compared. */
  check('and its 1930 figures do not follow it there',
    !c.pop.length, c.pop.join(' | '));
  await flip(p, '1930');
  c = await card(p);
  check('going back brings them again',
    /Kaes.ng/.test(c.name) && c.pop.some(h => /1930/.test(h)),
    c.name + ' — ' + c.pop.join(' | '));
  await p.close();

  console.log('\n— a territory that is on one date only —');
  p = await open(b, 'http://localhost:8123/index.html?layers=1');
  // the backing, not the atom: at the whole-map view the atom is empty — its
  // divisions are in the sheet nobody has asked for — and has no box to click
  await clickOn(p, '#backings [data-for="manchukuo"]', 0.5, 0.45);
  c = await card(p);
  const got = /Manchukuo|Manshu/.test(c.name);
  check('opens on Manchukuo in 1942', got, c.name);
  if (got) {
    await flip(p, '1930');
    c = await card(p);
    check('1930 lets it go, and says what the map is now',
      /1930/.test(c.name) && /The map in/.test(c.chip), c.name + ' — ' + c.chip);
    check('with nothing left under it from the card before',
      !c.pop.length, c.pop.join(' | '));
  }
  await p.close();

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
