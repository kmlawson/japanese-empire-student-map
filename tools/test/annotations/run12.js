/* The clock: stepping through time on the map itself.
 *
 * A different thing from walking the marks one at a time. A stage is a date at
 * which what is on the map changes — every start date and every end date in
 * the set — and stepping to one shows the marks that are in scope on that date
 * plus every mark with no date at all. The map does not move: the reader chose
 * the view, and watching shapes come and go over one piece of ground is the
 * whole point of it.
 *
 * The controls are on the map beside the zoom buttons and not in the panel,
 * because they are for reading a set rather than editing one.
 */
const puppeteer = require('./suite.js').puppeteer;
const S = require('./suite.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('    ok   ' + n); }
                             else { fail++; console.log('    FAIL ' + n + (d ? ' — ' + d : '')); } };

/* Four marks and four dates. One has no date at all and must never go: it is
   the ground the dated ones are drawn against. */
const SET = {
  type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { title: 'Manchuria', 'jem-start': '1931-09-18',
        stroke: '#b00', fill: '#b00', 'fill-opacity': 0.4 },
      geometry: { type: 'Polygon', coordinates: [[[122, 41], [131, 41], [131, 49], [122, 49], [122, 41]]] } },
    { type: 'Feature', properties: { title: 'North China', 'jem-start': '1937-07', stroke: '#07a' },
      geometry: { type: 'LineString', coordinates: [[114, 36], [121, 39]] } },
    { type: 'Feature', properties: { title: 'Wuhan', 'jem-start': '1938-10', 'jem-end': '1945', stroke: '#0a0' },
      geometry: { type: 'Point', coordinates: [114.3, 30.6] } },
    { type: 'Feature', properties: { title: 'The coast', stroke: '#555' },
      geometry: { type: 'LineString', coordinates: [[120, 25], [122, 31]] } },
  ]
};

const STATE = () => {
  const bar = document.querySelector('#ann-clock');
  return {
    shown: !!bar && !bar.hidden,
    now: bar ? bar.querySelector('#ann-clock-now').textContent : null,
    running: !!bar && bar.classList.contains('running'),
    marks: document.querySelectorAll('#annotations > *').length,
    labels: document.querySelectorAll('#ann-labels > *').length,
    view: (document.querySelector('#jmap svg') || document.querySelector('svg')).getAttribute('viewBox'),
  };
};

(async () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const file = path.join(os.tmpdir(), 'jem-clock-set.geojson');
  fs.writeFileSync(file, JSON.stringify(SET));

  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 150000 });

  /* ---------------------------------------------------- with a mouse -- */
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 950 });
  await p.evaluateOnNewDocument(S.SHIM);
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  p.on('dialog', async d => { try { await d.accept(); } catch (e) { /* gone */ } });
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await S.ready(p, false);
  await p.evaluate(() => document.querySelector('#ann-create').click());
  await sleep(1200);

  console.log('\n  — the clock —');
  check('no clock before there is anything to step through',
    await p.evaluate(() => { const c = document.querySelector('#ann-clock'); return !c || c.hidden; }));

  await (await p.$('#ann-file')).uploadFile(file);
  await sleep(1800);

  let st = await p.evaluate(STATE);
  const view0 = st.view;
  check('four dates make four stages', /4 stages/.test(st.now || ''), st.now);
  check('and every mark is drawn until one is chosen', st.marks === 8, JSON.stringify(st));
  check('it sits beside the zoom buttons, not in the panel', await p.evaluate(() => {
    const c = document.querySelector('#ann-clock').getBoundingClientRect();
    const z = document.querySelector('#zoom-controls').getBoundingClientRect();
    return c.right <= z.left + 2 && Math.abs(c.top - z.top) < 12;
  }));

  const step = async n => {
    for (let i = 0; i < n; i++) {
      await p.evaluate(() => document.querySelector('#ann-clock-next').click());
      await sleep(320);
    }
    return p.evaluate(STATE);
  };

  st = await step(1);
  check('the first stage is the earliest date, written as it was given',
    /18 September 1931\s+1\/4/.test(st.now || ''), st.now);
  check('and only what had happened by then is drawn', st.marks === 6, JSON.stringify(st));
  check('the undated mark is one of them', st.labels === 2, JSON.stringify(st));

  st = await step(1);
  check('the next stage brings the next mark in', st.marks === 7 && /July 1937/.test(st.now), JSON.stringify(st));
  st = await step(1);
  check('and the next', st.marks === 8 && /October 1938/.test(st.now), JSON.stringify(st));
  st = await step(1);
  check('the last stage is the last date', /1945\s+4\/4/.test(st.now || ''), st.now);
  check('and there is no stage after it',
    await p.evaluate(() => document.querySelector('#ann-clock-next').disabled));

  check('the map has not moved through any of it', st.view === view0, view0 + ' -> ' + st.view);

  /* Play: two seconds a stage, from the beginning, stopping at the end. */
  await p.evaluate(() => document.querySelector('#ann-clock-play').click());
  st = await p.evaluate(STATE);
  check('play starts again from the first stage', /1\/4/.test(st.now || ''), st.now);
  check('and says it is running', st.running);
  await sleep(1200);
  st = await p.evaluate(STATE);
  check('after a second it has not moved on yet', /1\/4/.test(st.now || ''), st.now);
  await sleep(1300);
  st = await p.evaluate(STATE);
  check('after two it has', /2\/4/.test(st.now || ''), st.now);
  await p.evaluate(() => document.querySelector('#ann-clock-play').click());
  await sleep(2400);
  const after = await p.evaluate(STATE);
  check('pause stops it where it was', !after.running && /2\/4/.test(after.now || ''), after.now);

  await p.evaluate(() => document.querySelector('#ann-clock-off').click());
  st = await p.evaluate(STATE);
  check('and the cross puts every mark back', st.marks === 8 && /4 stages/.test(st.now), JSON.stringify(st));
  check('no page errors', errs.length === 0, errs[0]);
  await p.close();

  /* ---------------------------------------------------- with a finger -- */
  console.log('\n  — the clock, with a finger —');
  const t = await b.newPage();
  await t.setViewport({ width: 1300, height: 1000, isMobile: true, hasTouch: true });
  const errs2 = []; t.on('pageerror', e => errs2.push(String(e)));
  t.on('dialog', async d => { try { await d.accept(); } catch (e) { /* gone */ } });
  await t.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await S.ready(t, false);
  await t.evaluate(() => document.querySelector('#ann-create').click());
  await sleep(1200);
  await (await t.$('#ann-file')).uploadFile(file);
  await sleep(1800);
  const tapId = async id => {
    const r = await t.evaluate(i => { const e = document.querySelector(i);
      const b2 = e.getBoundingClientRect(); return [b2.x + b2.width / 2, b2.y + b2.height / 2]; }, id);
    await t.mouse.move(r[0], r[1]); await t.mouse.down(); await sleep(70);
    await t.mouse.up(); await sleep(420);
  };
  const v0 = (await t.evaluate(STATE)).view;
  check('the clock is on screen and pressable', await t.evaluate(() => {
    const c = document.querySelector('#ann-clock');
    return !c.hidden && c.getBoundingClientRect().width > 0;
  }));
  await tapId('#ann-clock-next');
  await tapId('#ann-clock-next');
  const ts = await t.evaluate(STATE);
  check('two taps step two stages', /2\/4/.test(ts.now || ''), ts.now);
  check('and the map has not moved', ts.view === v0, v0 + ' -> ' + ts.view);
  await tapId('#ann-clock-play');
  await sleep(2300);
  const tp = await t.evaluate(STATE);
  check('play runs from a tap', /3\/4|4\/4/.test(tp.now || ''), tp.now);
  await tapId('#ann-clock-play');
  check('and a second tap pauses it',
    !(await t.evaluate(STATE)).running);
  check('no page errors on touch', errs2.length === 0, errs2[0]);

  console.log('\n    ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail);
})();
