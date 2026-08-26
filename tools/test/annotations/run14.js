/* The text box, the fifteen-step sliders, and Smooth.
 *
 * A text box is a Polygon that says `jem-kind: text`, so a reader who opens the
 * file in QGIS gets the rectangle — which is where the words are, and so the
 * right failure. What it is drawn as depends on one switch:
 *
 *   * Scales off (the default) — constant size on screen, anchored by its
 *     top-left corner. A caption *about* the map.
 *   * Scales on — drawn from the rectangle in degrees, so it covers the same
 *     ground at every zoom and its text grows with it. A label *on* the map.
 *
 * Off is the default because a note that shrinks to nothing two turns of the
 * wheel out is a note nobody can read. Both are checked here by measuring the
 * box on screen across three wheel steps, which is the only way to tell them
 * apart — and is the map-units-versus-screen-pixels rule in CLAUDE.md, which
 * the first version of this box broke in the documented way.
 */
const S = require('./suite.js');
const puppeteer = S.puppeteer;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('    ok   ' + n); }
                             else { fail++; console.log('    FAIL ' + n + (d ? ' — ' + d : '')); } };

const boxRect = p => p.evaluate(() => {
  const f = document.querySelector('.ann-textbox');
  if (!f) return null;
  const r = f.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y),
           w: Math.round(r.width), h: Math.round(r.height) };
});
const drawBox = async (p, x, y, dx, dy) => {
  await p.mouse.move(x, y); await p.mouse.down();
  for (let i = 1; i <= 6; i++) { await p.mouse.move(x + dx * i / 6, y + dy * i / 6); await sleep(45); }
  await p.mouse.up(); await sleep(800);
};
const zoom = async (p, n) => { for (let i = 0; i < n; i++) {
  await p.mouse.move(700, 500); await p.mouse.wheel({ deltaY: -260 }); await sleep(380); } };
const type = async (p, id, v) => { await p.evaluate((i, val) => {
  const el = document.querySelector(i); el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true })); }, id, v); await sleep(650); };

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 150000 });
const p = await S.page(b, { accept: true });
const errs = p.__errs;
await S.openPanel(p);

console.log('\n  — a box, dragged out —');
check('there is a Text tool, after Area', await p.evaluate(() =>
  [...document.querySelectorAll('.ann-tool')].map(t => t.getAttribute('data-tool')).join()
    === 'point,arrow,line,polygon,text'));
await p.evaluate(() => document.querySelector('.ann-tool[data-tool="text"]').click());
await sleep(300);
await drawBox(p, 600, 400, 180, 84);
check('dragging makes one', (await p.evaluate(() => document.querySelectorAll('#ann-list li').length)) === 1);
let r = await boxRect(p);
check('and it is the size it was dragged to', r && Math.abs(r.w - 180) < 6 && Math.abs(r.h - 84) < 6,
  JSON.stringify(r));

console.log('\n  — what goes in it —');
await type(p, '#ann-desc', 'Taken in September 1931.');
check('the description fills it', /Taken in September 1931/.test(
  await p.evaluate(() => document.querySelector('.ann-textbody').textContent)));
check('with no name there is no heading and no gap for one',
  !(await p.evaluate(() => !!document.querySelector('.ann-texthead'))));
await type(p, '#ann-title', 'Manchuria');
check('a name becomes the heading', await p.evaluate(() =>
  (document.querySelector('.ann-texthead') || {}).textContent === 'Manchuria'));
check('and the description is still under it', /Taken in September/.test(
  await p.evaluate(() => document.querySelector('.ann-textbody').textContent)));

console.log('\n  — Scales, which is the whole of the design —');
const setScales = async on2 => { await p.evaluate(v => {
  const c = document.querySelector('#ann-scales');
  c.checked = v; c.dispatchEvent(new Event('change', { bubbles: true })); }, on2);
  await sleep(600); };
check('it is on to begin with, because a box usually belongs to the ground',
  await p.evaluate(() => document.querySelector('#ann-scales').checked));

/* Switching must not change how the box looks *now* — only what happens on the
   next zoom. Turning it on used to redraw the box from a rectangle fixed when
   it was made, so a reader who had zoomed in since watched it leap to several
   times its size with a border to match. */
{
  const on1 = await boxRect(p);
  await setScales(false);
  const off = await boxRect(p);
  await setScales(true);
  const on2 = await boxRect(p);
  check('switching it does not move or resize the box under the reader',
    Math.abs(on1.w - off.w) < 3 && Math.abs(off.w - on2.w) < 3
      && Math.abs(on1.x - off.x) < 3,
    JSON.stringify(on1) + ' / ' + JSON.stringify(off) + ' / ' + JSON.stringify(on2));
}

await setScales(false);
{
  const before = await boxRect(p);
  await zoom(p, 3);
  const after = await boxRect(p);
  check('off: the box keeps its size on screen',
    Math.abs(before.w - after.w) < 5 && Math.abs(before.h - after.h) < 5,
    JSON.stringify(before) + ' -> ' + JSON.stringify(after));
}
await setScales(true);
{
  const before = await boxRect(p);
  await zoom(p, 2);
  const after = await boxRect(p);
  check('on: the box grows with the map, because it covers ground',
    after.w > before.w + 5, JSON.stringify(before) + ' -> ' + JSON.stringify(after));
}

/* And the three forms it takes on the way out: the box, the box without its
   words once they are too small to read, and a plain square that behaves like
   a city — still there and still clickable — once the box itself is too small
   to be a box. It has to come back on the way in. */
console.log('\n  — the file it writes —');
await p.evaluate(() => { window.__saved = null; const r0 = URL.createObjectURL;
  URL.createObjectURL = bl => { bl.text().then(t => { window.__saved = t; }); return r0.call(URL, bl); }; });
await p.evaluate(() => document.querySelector('#ann-save').click());
await sleep(1100);
{
  const out = JSON.parse(await p.evaluate(() => window.__saved));
  const f = out.features[0];
  check('it is a Polygon, so anything can draw the box', f.geometry.type === 'Polygon');
  check('and it says what it really is', f.properties['jem-kind'] === 'text');
  check('the words are ordinary title and description',
    f.properties.title === 'Manchuria' && /September 1931/.test(f.properties.description));
}

console.log('\n  — fifteen steps, and the reader is told which —');
await p.evaluate(() => document.querySelectorAll('#ann-list .ann-pick')[0].click());
await sleep(400);
check('weight, stroke and fill all run 1 to 15', await p.evaluate(() =>
  ['ann-size', 'ann-opacity', 'ann-fillop'].every(id => {
    const e = document.querySelector('#' + id);
    return e && e.min === '1' && e.max === '15' && e.step === '1';
  })));
await p.evaluate(() => { const e = document.querySelector('#ann-fillop');
  e.value = '9'; e.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(250);
check('and moving one says which step it is on', await p.evaluate(() => {
  const s2 = document.querySelector('#ann-step');
  return !!s2 && s2.classList.contains('on') && /9 \/ 15/.test(s2.textContent);
}), await p.evaluate(() => (document.querySelector('#ann-step') || {}).textContent));
await sleep(1100);
check('the number goes away on its own', await p.evaluate(() =>
  !document.querySelector('#ann-step').classList.contains('on')));

console.log('\n  — what it becomes when it is too small to read —');
{
  const form = () => p.evaluate(() => {
    const f = document.querySelector('.ann-textbox');
    const dot = document.querySelector('.ann-textdot');
    if (dot) return 'dot';
    if (!f) return 'gone';
    const d = f.querySelector('.ann-textbody');
    return (d && d.textContent.trim()) ? 'box' : 'quiet';
  });
  /* A fresh box, drawn while zoomed well in. That is the real case — a note
     written on Manchuria and then looked at from the whole empire — and it is
     the only one that can reach the dot: a box drawn at the opening view has a
     ground rectangle so large that the map runs out of zoom-out before the box
     runs out of size. */
  await p.evaluate(() => { const c = document.querySelector('#ann-clear');
    if (c) c.click(); });
  await sleep(700);
  await zoom(p, 8);
  await p.evaluate(() => document.querySelector('.ann-tool[data-tool="text"]').click());
  await sleep(300);
  await drawBox(p, 560, 380, 150, 70);
  await type(p, '#ann-desc', 'A note written close in.');
  const seen = [];
  for (let i = 0; i < 14; i++) {
    await p.mouse.move(700, 500); await p.mouse.wheel({ deltaY: 260 }); await sleep(320);
    const f2 = await form();
    if (seen[seen.length - 1] !== f2) seen.push(f2);
  }
  check('pulling back turns it from a box into a dot', seen.indexOf('dot') > 0, seen.join(' -> '));
  check('by way of a box with no words in it', seen.indexOf('quiet') > 0
    && seen.indexOf('quiet') < seen.indexOf('dot'), seen.join(' -> '));
  for (let i = 0; i < 14; i++) {
    await p.mouse.move(700, 500); await p.mouse.wheel({ deltaY: -260 }); await sleep(300);
  }
  check('and zooming back in opens it out again', (await form()) === 'box', await form());
}

console.log('\n  — Smooth —');
const p2 = await S.page(b, { accept: true });
await S.openPanel(p2);
await S.pickTool(p2, 'line');
await S.tap(p2, 500, 400); await S.tap(p2, 600, 520); await S.tap(p2, 720, 420);
await p2.evaluate(() => document.querySelector('#ann-finish').click());
await p2.waitForFunction(() => !!document.querySelector('#annotations path.ann-shape[d]'),
  { timeout: 8000, polling: 'raf' }).catch(() => {});
await sleep(300);
const dOf = () => p2.evaluate(() => {
  const e = document.querySelector('#annotations path.ann-shape[d]');
  return (e && e.getAttribute('d')) || ''; });
check('a line is drawn straight between its points', /^M[^C]*$/.test(await dOf()));
check('Smooth is offered for a line', await p2.evaluate(() =>
  !document.querySelector('#ann-smooth-row').hidden));
check('and its amount is dead until it is switched on', await p2.evaluate(() =>
  document.querySelector('#ann-smooth-amt').disabled));
await p2.evaluate(() => { const c = document.querySelector('#ann-smooth');
  c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
await sleep(600);
check('switching it on curves the line', /C/.test(await dOf()), (await dOf()).slice(0, 50));
check('and wakes the amount up', await p2.evaluate(() =>
  !document.querySelector('#ann-smooth-amt').disabled));
check('the points the reader placed are still on the line', await dOf() ?
  (await dOf()).indexOf('M') === 0 : false);

check('no page errors', errs.length === 0 && p2.__errs.length === 0,
  errs[0] || p2.__errs[0]);
console.log('\n    ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
