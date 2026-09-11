/* Japan's railways and their 12,800 stations.
 *
 *     node tools/test/jprails.js          # with a server on 8123
 *
 * The fourth railway on this map and the first that is *built* rather than
 * found. Taiwan's, Korea's and Karafuto's are drawn into japan-empire-map.svg
 * and picked up with the page; Japan's are 1,977 lines and 83,829 vertices,
 * 313 KB gzipped, fetched the first time the switch goes on and assembled into
 * `#jp-rail` by `buildJpRails`. Its 12,800 stations are another 258 KB and wait
 * for their own switch.
 *
 * What this has to prove:
 *
 *   * neither file is fetched until its own switch is on — the whole point of
 *     a layer this size;
 *   * the date is a property of the line, not of the path. 1,806 of the 1,977
 *     were open by 1930 and are written once with `data-epochs` naming both
 *     maps, where the other three networks write a line twice;
 *   * a line answers with its own name and opening year, not with a card about
 *     the network — Japan's layer is a national dataset of named lines, and
 *     the thing under the finger is the Tōkaidō and not "Japan's railways";
 *   * a station answers with its name and the year it opened;
 *   * and **the layer is projected like everything else**. It is built in
 *     Mercator on purpose so that `__d0` — which is what `reprojectDocument`
 *     re-projects from — is the Mercator `d` the rest of the document stores.
 *     Built with `project()` instead it would be right in one projection and
 *     wrong in the other two, and only after something moved.
 *
 * TWO THINGS THAT COST TIME WHEN THIS WAS WRITTEN, BOTH IN THE TEST.
 *
 *   * **Do not press Escape to dismiss a dialog here.** With no card open,
 *     Escape resets the view to the whole empire — where every railway on this
 *     map correctly fades out — so the layer under test vanishes and reads as a
 *     bug. The switches are set through the checkbox directly, so no dialog is
 *     ever opened and none needs dismissing.
 *   * **`elementFromPoint` rarely returns the band you sampled.** The hit bands
 *     are 16 screen pixels wide and Japan's lines run in bundles, so the
 *     topmost element at a point on one band is usually a neighbour's. Ask
 *     whether the topmost thing is *a* `.rail-hit` inside `#jp-rail`, and take
 *     the name off whatever answered.
 */
const { puppeteer, sleep, ready, until, check, report, SHIM, launch, HOST } = require('./suite.js');

const BASE = HOST + '/index.html';
const WHOLE = BASE + '?where=66,-12,180,55';
/* The Kantō plain: close enough that the railways are not faded, and dense
   enough that there is always a line and a station under the pointer. */
const KANTO = BASE + '?where=139,35,140.5,36.2';

const state = p => p.evaluate(() => {
  const g = document.querySelector('#jp-rail');
  const rails = g ? [...g.querySelectorAll('path.rail')] : [];
  const marks = [...document.querySelectorAll('#jp-stations .sta-mark')];
  return {
    group: !!g,
    rails: rails.length,
    railsShown: rails.filter(e => e.style.display !== 'none').length,
    hits: g ? [...g.querySelectorAll('.rail-hit')].filter(e => e.style.display !== 'none').length : 0,
    both: rails.filter(e => e.getAttribute('data-epochs') === 'e1930 e1942').length,
    later: rails.filter(e => e.getAttribute('data-epochs') === 'e1942').length,
    marks: marks.length,
    marksShown: marks.filter(e => e.style.display !== 'none').length,
  };
});

const card = p => p.evaluate(() => {
  const b = document.querySelector('#info');
  if (!b || b.hidden) return null;
  const t = s => (b.querySelector(s) || {}).textContent || '';
  return { chip: t('.chip'), primary: t('.primary'), alt: t('.alt'),
           when: t('.when'), note: t('.note-own').slice(0, 80) };
});

const setBox = (p, id, on) => p.evaluate((i, v) => {
  const b = document.querySelector(i);
  if (b && b.checked !== v) { b.checked = v; b.dispatchEvent(new Event('change', {bubbles: true})); }
}, id, on);

(async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage();
    await p.setViewport({ width: 1400, height: 900 });
    await p.evaluateOnNewDocument(SHIM);
    const got = [], errs = [];
    p.on('request', r => {
      const f = r.url().split('/').pop().split('?')[0];
      if (/^jp-(rails|stations)\.js$/.test(f)) got.push(f);
    });
    p.on('pageerror', e => errs.push(String(e).slice(0, 160)));

    await p.goto(KANTO, { waitUntil: 'domcontentloaded' });
    await ready(p);
    await sleep(1500);

    console.log('\n— nothing until it is asked for —');
    check('neither Japanese file is fetched with the page',
      got.length === 0, JSON.stringify(got));
    check('the two switches are in the Layers panel',
      await p.evaluate(() => !!document.querySelector('#opt-jp-rail')
                          && !!document.querySelector('#opt-jp-stations')));

    await setBox(p, '#opt-jp-rail', true);
    await until(p, () => !!document.querySelector('#jp-rail path.rail'),
                null, { timeout: 25000 });
    await sleep(1200);
    let s = await state(p);
    check('switching the railway on fetches jp-rails.js',
      got.includes('jp-rails.js'), JSON.stringify(got));
    check('  and not the stations, which nobody asked for',
      !got.includes('jp-stations.js'), JSON.stringify(got));
    check('1,977 lines are built', s.rails === 1977, 'rails=' + s.rails);

    console.log('\n— the date is a property of the line —');
    check('1,806 of them name both maps, 171 the later one only',
      s.both === 1806 && s.later === 171, JSON.stringify({both: s.both, later: s.later}));
    check('so the 1930 map draws 1,806', s.railsShown === 1806, 'shown=' + s.railsShown);
    check('and every drawn line has a band wide enough to press',
      s.hits === 1806, 'hits=' + s.hits);

    await p.evaluate(() => {
      const b = [...document.querySelectorAll('button[data-epoch]')]
        .find(e => e.getAttribute('data-epoch') === 'e1942');
      if (b) b.click();
    });
    await sleep(2500);
    s = await state(p);
    check('and the 1942 map draws all 1,977', s.railsShown === 1977, 'shown=' + s.railsShown);
    await p.evaluate(() => {
      const b = [...document.querySelectorAll('button[data-epoch]')]
        .find(e => e.getAttribute('data-epoch') === 'e1930');
      if (b) b.click();
    });
    await sleep(2500);

    console.log('\n— a line answers with its own name —');
    const spot = await p.evaluate(() => {
      const els = [...document.querySelectorAll('#jp-rail .rail-hit')]
        .filter(e => e.style.display !== 'none');
      for (const el of els) {
        let L; try { L = el.getTotalLength(); } catch (e) { continue; }
        if (!L) continue;
        for (const f of [0.5, 0.3, 0.7]) {
          const q = el.getPointAtLength(L * f);
          const s2 = el.ownerSVGElement.createSVGPoint(); s2.x = q.x; s2.y = q.y;
          const c = s2.matrixTransform(el.getScreenCTM());
          const x = Math.round(c.x), y = Math.round(c.y);
          if (x > 90 && x < 1310 && y > 140 && y < 730) {
            const t = document.elementFromPoint(x, y);
            if (t && t.closest && t.closest('#jp-rail') && t.classList.contains('rail-hit')) {
              return { x, y, name: t.getAttribute('data-name'), year: t.getAttribute('data-year') };
            }
          }
        }
      }
      return null;
    });
    check('a line is on screen and takes the pointer', !!spot, JSON.stringify(spot));
    if (spot) {
      await p.mouse.click(spot.x, spot.y);
      await sleep(900);
      const c = await card(p);
      check('pressing it opens a card for the line, not for the network',
        !!c && /railway line/i.test(c.chip || ''), JSON.stringify(c));
      check('  named as the source names it',
        !!c && c.primary === spot.name,
        JSON.stringify(c && c.primary) + ' vs ' + JSON.stringify(spot.name));
      check('  with the year service began',
        !!c && c.alt === 'Opened ' + spot.year, JSON.stringify(c && c.alt));
      /* The layer is filtered on the opening year out of a record that starts
         in 1950, so it is lines that opened by the date AND survived to 1950.
         The card has to say so; it is the one caveat that changes what the
         reader thinks they are looking at. */
      check('  and the sentence saying the survey begins in 1950',
        !!c && /1950/.test(c.note || ''), JSON.stringify(c && c.note));
    }

    console.log('\n— the stations, on their own switch —');
    await setBox(p, '#opt-jp-stations', true);
    await until(p, () => document.querySelectorAll('#jp-stations .sta-mark').length > 0,
                null, { timeout: 25000 });
    await sleep(2500);
    s = await state(p);
    check('switching them on fetches jp-stations.js',
      got.includes('jp-stations.js'), JSON.stringify(got));
    check('12,800 places are built', s.marks === 12800, 'marks=' + s.marks);
    /* **Every record needs an id.** The marks are drawn with `data-id` and
       looked up in `byId`; without one all 12,800 collapsed onto the key
       "undefined", and whichever station happened to be written last decided
       the epoch for the whole layer. It was one opened after 1930, so on the
       1930 map every square in Japan was hidden. */
    check('and 10,639 of them stood in 1930',
      s.marksShown === 10639, 'shown=' + s.marksShown);

    const sq = await p.evaluate(() => {
      for (const m of document.querySelectorAll('#jp-stations .sta-mark')) {
        const r = m.getBoundingClientRect();
        if (r.width > 0 && r.left > 100 && r.right < 1300 && r.top > 150 && r.bottom < 720) {
          const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
          const t = document.elementFromPoint(x, y);
          if (t && t.closest && t.closest('#jp-stations')) return { x, y };
        }
      }
      return null;
    });
    check('a station square takes the pointer', !!sq, JSON.stringify(sq));
    if (sq) {
      await p.mouse.click(sq.x, sq.y);
      await sleep(900);
      const c = await card(p);
      check('pressing it names the station',
        !!c && !!c.primary, JSON.stringify(c));
      check('  and gives the year it opened',
        !!c && /\b(18|19)\d\d\b/.test((c.when || '') + ' ' + (c.alt || '')), JSON.stringify(c));
    }

    console.log('\n— and it is projected like everything else —');
    /* Every station stands on a line, so in a correctly projected layer the
       nearest rail vertex to a station square is a fraction of a map unit away.
       The squares are placed by `project()`, so they are the reference: a layer
       built by a different rule would be tens of units out, and only in the two
       projections the file was not written in. */
    for (const mode of ['mercator', 'albers', 'laea']) {
      await p.evaluate(m => {
        const r = document.querySelector('input[name="projection"][value="' + m + '"]');
        if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles: true})); }
      }, mode);
      await sleep(3500);
      const d = await p.evaluate(() => {
        const ms = [...document.querySelectorAll('#jp-stations .sta-mark')]
          .filter(e => e.getBoundingClientRect().width > 0).slice(0, 120);
        const verts = [];
        for (const e of [...document.querySelectorAll('#jp-rail path.rail')]
                         .filter(e2 => e2.style.display !== 'none').slice(0, 700)) {
          const m = (e.getAttribute('d') || '').match(/-?[\d.]+/g);
          if (!m) continue;
          for (let i = 0; i < m.length; i += 2) verts.push([+m[i], +m[i + 1]]);
        }
        if (!ms.length || !verts.length) return { bad: 'nothing to compare' };
        const svg = document.querySelector('#jmap svg') || document.querySelector('svg');
        let worst = 0;
        for (const mk of ms) {
          const r = mk.getBoundingClientRect();
          const s2 = svg.createSVGPoint();
          s2.x = r.left + r.width / 2; s2.y = r.top + r.height / 2;
          const u = s2.matrixTransform(svg.getScreenCTM().inverse());
          let best = 1e9;
          for (const v of verts) {
            const dd = Math.hypot(v[0] - u.x, v[1] - u.y);
            if (dd < best) best = dd;
          }
          worst = Math.max(worst, best);
        }
        return { stations: ms.length, vertices: verts.length,
                 worstUnits: Math.round(worst * 100) / 100 };
      });
      check('in ' + mode + ', every station square sits on the track',
        !d.bad && d.worstUnits < 3, JSON.stringify(d));
    }

    check('no page errors throughout', errs.length === 0, JSON.stringify(errs.slice(0, 3)));
    await p.close();

    console.log('\n— built while the reader is already in another projection —');
    /* **THE CASE THE CHECKS ABOVE CANNOT SEE, AND THE ONLY ONE THAT FAILS.**
     *
     * Everything so far builds the layer with the page in Mercator, where
     * `project()` and `mercFwd()` return the same numbers — so building with
     * the wrong one of the two is invisible, and switching projection
     * afterwards works either way because `reprojectDocument` has the right
     * `__d0` by luck. Measured: swapping `mercFwd` for `project` in
     * `buildJpRails` left all three checks above passing.
     *
     * The layer is fetched on demand, so a reader can perfectly well set
     * Albers and *then* switch it on. Built with `project()` that writes an
     * Albers `d` into `__d0` — the slot every path in this document reserves
     * for its Mercator original — and `reprojectGraft` then moves an
     * already-moved path. This is the check that says so. */
    for (const mode of ['albers', 'laea']) {
      const q = await browser.newPage();
      await q.setViewport({ width: 1400, height: 900 });
      await q.evaluateOnNewDocument(SHIM);
      await q.goto(KANTO, { waitUntil: 'domcontentloaded' });
      await ready(q);
      await sleep(1500);
      // the projection FIRST, while there is no Japanese railway in the document
      await q.evaluate(m => {
        const r = document.querySelector('input[name="projection"][value="' + m + '"]');
        if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles: true})); }
      }, mode);
      await sleep(3000);
      await setBox(q, '#opt-jp-rail', true);
      await setBox(q, '#opt-jp-stations', true);
      await until(q, () => document.querySelectorAll('#jp-stations .sta-mark').length > 0,
                  null, { timeout: 30000 }).catch(() => {});
      await sleep(3000);
      const d = await q.evaluate(() => {
        const ms = [...document.querySelectorAll('#jp-stations .sta-mark')]
          .filter(e => e.getBoundingClientRect().width > 0).slice(0, 120);
        const verts = [];
        for (const e of [...document.querySelectorAll('#jp-rail path.rail')]
                         .filter(e2 => e2.style.display !== 'none').slice(0, 700)) {
          const m = (e.getAttribute('d') || '').match(/-?[\d.]+/g);
          if (!m) continue;
          for (let i = 0; i < m.length; i += 2) verts.push([+m[i], +m[i + 1]]);
        }
        if (!ms.length || !verts.length) return { bad: 'nothing to compare' };
        const svg = document.querySelector('#jmap svg') || document.querySelector('svg');
        let worst = 0;
        for (const mk of ms) {
          const r = mk.getBoundingClientRect();
          const s2 = svg.createSVGPoint();
          s2.x = r.left + r.width / 2; s2.y = r.top + r.height / 2;
          const u = s2.matrixTransform(svg.getScreenCTM().inverse());
          let best = 1e9;
          for (const v of verts) {
            const dd = Math.hypot(v[0] - u.x, v[1] - u.y);
            if (dd < best) best = dd;
          }
          worst = Math.max(worst, best);
        }
        return { stations: ms.length, worstUnits: Math.round(worst * 100) / 100 };
      });
      check('switched to ' + mode + ' first, the layer still lands on the track',
        !d.bad && d.worstUnits < 3, JSON.stringify(d));
      await q.close();
    }

    /* And at the whole-empire view the layer is not drawn at all, which is what
       every other railway does and is why pressing Escape mid-test read as a
       bug the first time round. */
    const w = await browser.newPage();
    await w.setViewport({ width: 1400, height: 900 });
    await w.evaluateOnNewDocument(SHIM);
    await w.goto(WHOLE, { waitUntil: 'domcontentloaded' });
    await ready(w);
    await sleep(1500);
    await setBox(w, '#opt-jp-rail', true);
    await sleep(6000);
    const faded = await w.evaluate(() => {
      const g = document.querySelector('#jp-rail');
      return g ? { display: getComputedStyle(g).display,
                   opacity: getComputedStyle(g).opacity } : null;
    });
    check('at the whole-empire view the layer fades out, as the others do',
      !!faded && (faded.display === 'none' || +faded.opacity < 0.05),
      JSON.stringify(faded));
    await w.close();
  } finally { await browser.close(); }
  process.exit(report());
})();
