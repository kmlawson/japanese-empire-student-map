/* What a pointer event is allowed to cost, asserted as work and not as time.
 *
 *     node tools/test/annotations/run15.js      # with a server on 8123
 *
 * A reader reported that clicks felt slow and that dragging a mark lagged with
 * only a handful of marks on the map. Measured, with the CPU throttled to a
 * sixth and ten marks loaded, one pointer move of a drag cost 10.9 ms — and
 * fifty marks cost 11.5, which is the tell: almost none of it was the marks.
 *
 * `redraw()` ended by calling the map's whole `rescale()`, which walks every
 * scalable the map has — every city dot, every name, every hit target — and
 * writes a transform to each. Dragging one mark rewrote the entire map, once
 * per pointer event.
 *
 * A timing test for that would be a flaky test: it would pass or fail on how
 * busy the machine running it happened to be. So the three things fixed are
 * pinned here as **work**, which is exact:
 *
 *   1. a drag moves the marks and *nothing else on the map*;
 *   2. a keystroke in the description does not rebuild the drawing, and a
 *      keystroke in the name does — except in a text box, where the
 *      description is what is drawn;
 *   3. what a mark measures is remembered, and forgotten when it moves.
 *
 * The identity of a drawn node is what says whether the layer was rebuilt:
 * `redraw()` empties the group, so a node that survives was never touched.
 */
const S = require('./suite.js');
const puppeteer = S.puppeteer;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('    ok   ' + n); }
                             else { fail++; console.log('    FAIL ' + n + (d ? ' — ' + d : '')); } };

/* Every transform the map is holding, keyed by something stable. The city
   dots and the names are the bulk of it and are what a drag used to rewrite. */
const TRANSFORMS = () => {
  const out = {};
  document.querySelectorAll('#jmap [transform]').forEach((el, i) => {
    if (el.closest('#annotations') || el.closest('#ann-labels')) return;
    out[(el.id || el.getAttribute('class') || 'el') + '#' + i] = el.getAttribute('transform');
  });
  return out;
};

/* A tag on each drawn mark, so a rebuild can be told from a survival. */
const TAG = () => {
  let n = 0;
  document.querySelectorAll('#annotations [data-ann]').forEach(el => {
    el.__tag = 'tag' + (n++);
  });
  return n;
};
const TAGS = () => [...document.querySelectorAll('#annotations [data-ann]')]
  .map(el => el.__tag || 'new');

const type = async (p, sel, v) => {
  await p.evaluate((s, val) => {
    const el = document.querySelector(s);
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, v);
  await sleep(320);
};

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

console.log('\n  — a drag moves the marks and nothing else —');
{
  const p = await S.page(b, { accept: true });
  await S.openPanel(p);
  /* A line, so that there is something with a length to measure as well as
     something to take hold of. */
  await S.pickTool(p, 'line');
  const a = await p.evaluate(S.SPOT, ['#a-china', '#a-japan']);
  await p.mouse.click(a.x, a.y); await sleep(260);
  await p.mouse.click(a.x + 120, a.y + 70); await sleep(260);
  await p.evaluate(() => { const f = document.querySelector('#ann-finish');
    if (f && !f.hidden) f.click(); });
  await sleep(700);
  check('a line was drawn', await p.evaluate(() =>
    document.querySelectorAll('#annotations [data-ann]').length > 0));

  const before = await p.evaluate(TRANSFORMS);
  const many = Object.keys(before).length;
  check('the map is holding a good many transforms to leave alone', many > 40, many + '');

  /* Take the line by its middle and move it. */
  const mid = { x: a.x + 60, y: a.y + 35 };
  await p.mouse.move(mid.x, mid.y);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(mid.x + i * 6, mid.y + i * 3); await sleep(40); }
  const after = await p.evaluate(TRANSFORMS);
  await p.mouse.up(); await sleep(500);

  const moved = Object.keys(before).filter(k => before[k] !== after[k]);
  check('not one of the map\'s own transforms was rewritten',
    moved.length === 0, moved.slice(0, 4).join(' | '));

  /* And the marks themselves are still placed at constant screen size — the
     saving must not have been made by skipping the annotations' own rescale. */
  const zoomed = await p.evaluate(() => {
    const el = document.querySelector('#annotations .ann-vertex, #annotations .ann-mark');
    return el ? el.getAttribute('transform') : null; });
  check('and the marks are still placed at a screen scale',
    !!zoomed && /scale\(/.test(zoomed), zoomed || 'none');
  check('no page errors', p.__errs.length === 0, p.__errs[0]);
  await p.close();
}

console.log('\n  — a keystroke rebuilds the drawing only when the drawing changes —');
{
  const p = await S.page(b, { accept: true });
  await S.openPanel(p);
  await S.pickTool(p, 'point');
  const a = await p.evaluate(S.SPOT, ['#a-china', '#a-japan']);
  await p.mouse.click(a.x, a.y); await sleep(700);
  await p.evaluate(TAG);

  await type(p, '#ann-desc', 'A description, which is read in the card.');
  let tags = await p.evaluate(TAGS);
  check('typing a description leaves the drawn mark alone',
    tags.length > 0 && tags.every(t => t !== 'new'), tags.join(','));
  check('and it was still written to the feature', await p.evaluate(() =>
    /read in the card/.test(document.querySelector('#ann-desc').value)));

  await type(p, '#ann-title', 'Mukden');
  tags = await p.evaluate(TAGS);
  check('typing a name does rebuild it, because the map carries the name',
    tags.some(t => t === 'new'), tags.join(','));
  const label = await p.evaluate(() => [...document.querySelectorAll('#ann-labels text')]
    .map(t => t.textContent).join('|'));
  check('and the name is on the map', /Mukden/.test(label), label);
  /* The *selected* row, not the first one. Every script in this suite shares
     one browser, so a set left in localStorage by an earlier page is offered
     back and accepted here — and then row one belongs to that set rather than
     to the mark this page just made. Two checks failed that way while this
     file was being written, both of them reading a stranger's row. */
  const row = await p.evaluate(() =>
    (document.querySelector('#ann-list li.sel .ann-name') || {}).textContent || '');
  check('and in the list', /Mukden/.test(row), row);

  /* A date decides whether the clock shows the mark at all, so it is drawing. */
  await p.evaluate(TAG);
  await type(p, '#ann-start', '1931-09-18');
  tags = await p.evaluate(TAGS);
  check('a date rebuilds it too', tags.some(t => t === 'new'), tags.join(','));
  check('no page errors', p.__errs.length === 0, p.__errs[0]);
  await p.close();
}

console.log('\n  — except in a text box, where the description is the mark —');
{
  const p = await S.page(b, { accept: true });
  await S.openPanel(p);
  await S.pickTool(p, 'text');
  const a = await p.evaluate(S.SPOT, ['#a-china', '#a-japan']);
  await p.mouse.move(a.x, a.y); await p.mouse.down();
  for (let i = 1; i <= 6; i++) { await p.mouse.move(a.x + i * 30, a.y + i * 12); await sleep(45); }
  await p.mouse.up(); await sleep(800);
  await type(p, '#ann-desc', 'Words that go on the map.');
  const words = await p.evaluate(() => {
    const el = document.querySelector('.ann-textbody');
    return el ? el.textContent : ''; });
  check('the words a reader types appear in the box',
    /Words that go on the map/.test(words), words.slice(0, 60));
  check('no page errors', p.__errs.length === 0, p.__errs[0]);
  await p.close();
}

console.log('\n  — a measurement is remembered, and forgotten when it moves —');
{
  const p = await S.page(b, { accept: true });
  await S.openPanel(p);
  await S.pickTool(p, 'line');
  const a = await p.evaluate(S.SPOT, ['#a-china', '#a-japan']);
  await p.mouse.click(a.x, a.y); await sleep(260);
  await p.mouse.click(a.x + 100, a.y + 40); await sleep(260);
  await p.evaluate(() => { const f = document.querySelector('#ann-finish');
    if (f && !f.hidden) f.click(); });
  await sleep(800);
  const meas = () => p.evaluate(() =>
    (document.querySelector('#ann-list li.sel .ann-meas') || {}).textContent || '');
  const was = await meas();
  check('a line says how long it is', /km/.test(was), was);

  /* Drag one end a long way. If the answer were cached and never forgotten,
     the list would still be showing the old length. */
  await p.mouse.move(a.x + 100, a.y + 40);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(a.x + 100 + i * 22, a.y + 40 + i * 9); await sleep(45); }
  await p.mouse.up(); await sleep(700);
  const now = await meas();
  const km = t => parseFloat((t || '').replace(/,/g, ''));
  check('and after dragging its end it says a different one',
    /km/.test(now) && km(now) > km(was) * 1.3, was + ' -> ' + now);
  check('no page errors', p.__errs.length === 0, p.__errs[0]);
  await p.close();
}

/* And with a finger, because a finger takes a different road to the same
   place: there is no press-and-hold on a mouse, and `grab` arms a timer rather
   than beginning the drag. It ends in the same `redraw()`, and that is what
   changed, so it is checked here rather than assumed. */
console.log('\n  — and the same with a finger —');
{
  const p = await S.page(b, { touch: true, accept: true });
  await S.openPanel(p);
  await S.pickTool(p, 'point');
  const a = await p.evaluate(S.SPOT, ['#a-china', '#a-japan']);
  await S.tap(p, a.x, a.y);
  await sleep(600);
  const drawn = await p.evaluate(() =>
    document.querySelectorAll('#annotations [data-ann]').length);
  check('a tap places a mark', drawn > 0, drawn + '');

  /* The tool away first. A point tool still armed reads the next press as
     another placement, not as taking hold of the mark that is already there —
     which is right, and is why the first version of this check measured a
     mark that had never been asked to move. */
  await S.dropTool(p);
  /* The mark this page just made, which is the selected one — not the first
     `[data-ann]` in the layer. A set restored from an earlier page's
     localStorage is drawn first, and the first version of this check pressed
     one mark and measured another. */
  const where = () => p.evaluate(() => {
    const el = document.querySelector('#annotations [data-ann].sel')
           || document.querySelector('#annotations [data-ann]');
    const r = el.getBoundingClientRect();
    return { at: Math.round(r.left) + ',' + Math.round(r.top),
             x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const stood = await where();
  const before = await p.evaluate(TRANSFORMS);
  /* Press, wait past the hold that tells a drag from a pan, then move. */
  await p.mouse.move(stood.x, stood.y);
  await p.mouse.down();
  await sleep(420);
  for (let i = 1; i <= 8; i++) {
    await p.mouse.move(stood.x + i * 7, stood.y + i * 4); await sleep(45); }
  const after = await p.evaluate(TRANSFORMS);
  await p.mouse.up(); await sleep(500);
  /* The mark has to have gone somewhere, or the check below is only saying
     that nothing happened at all. */
  check('the finger really moved it', (await where()).at !== stood.at, stood.at);
  const moved = Object.keys(before).filter(k => before[k] !== after[k]);
  check('dragging with a finger leaves the map\'s own transforms alone',
    moved.length === 0, moved.slice(0, 4).join(' | '));
  check('no page errors', p.__errs.length === 0, p.__errs[0]);
  await p.close();
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
