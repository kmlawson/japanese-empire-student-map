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
      /* The second line carries whatever the map knows besides the headline:
         the characters where the headline is a romanisation, and the opening
         year always. A line with no romanisation is headed by its characters
         and this is the year alone. */
      check('  with the year service began',
        !!c && c.alt.indexOf('opened ' + spot.year) >= 0, JSON.stringify(c && c.alt));
      /* **And NOT the standing caveat about 1950.** It was on the card once —
         the same sentence under every one of 1,977 lines, where the reader
         wanted the line's own name and date. A disclaimer repeated that often
         is one nobody reads, which is the prose rule in CLAUDE.md. It lives in
         the layer's own `i` panel and in sources.html now, and the card links
         the dataset instead. */
      check('  and not the standing 1950 caveat, which belongs to the layer',
        !!c && !/1950/.test(c.note || ''), JSON.stringify(c && c.note));
    }

    console.log('\n— the name the reader asked for, and where to read more —');
    /* **Which name leads is `Kanji labels`, the switch that already decides it
       for every place name on the map.** Romanisation in front with it off,
       characters in front with it on, the other underneath either way. The
       romanisation is taken from the line's own article and never worked out
       from the characters — CLAUDE.md's rule for station readings — so a line
       whose article this map could not find has none, and those are skipped
       here by asking only for a band that carries one. */
    const named = await p.evaluate(() => {
      const els = [...document.querySelectorAll('#jp-rail .rail-hit')]
        .filter(e => e.style.display !== 'none' && e.getAttribute('data-ro'));
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
            if (t && t.closest && t.closest('#jp-rail')
                && t.classList.contains('rail-hit') && t.getAttribute('data-ro')) {
              return { x, y, name: t.getAttribute('data-name'),
                       ro: t.getAttribute('data-ro') };
            }
          }
        }
      }
      return null;
    });
    /* The band is what the pointer lands on, so it has to carry all four
       attributes. It carried two for a while — a name and a year — and the
       card could never show a romanisation or an article because the rest was
       on the drawn path two siblings away. */
    check('a line carrying a romanisation is pressable', !!named, JSON.stringify(named));
    if (named) {
      const readCard = () => p.evaluate(() => {
        const b = document.querySelector('#info');
        if (!b || b.hidden) return null;
        return { primary: (b.querySelector('.primary') || {}).textContent,
                 alt: (b.querySelector('.alt') || {}).textContent,
                 links: [...b.querySelectorAll('#info-trains a')].map(a => a.href) };
      });
      await p.mouse.click(named.x, named.y);
      await sleep(900);
      const c1 = await readCard();
      check('with Kanji labels off the romanisation leads',
        !!c1 && c1.primary === named.ro,
        JSON.stringify(c1 && c1.primary) + ' vs ' + JSON.stringify(named.ro));
      check('  with the characters and the opening year under it',
        !!c1 && c1.alt.indexOf(named.name) >= 0 && /opened \d{4}/.test(c1.alt),
        JSON.stringify(c1 && c1.alt));
      check('  a link to the article',
        !!c1 && c1.links.some(h => /wikipedia\.org/.test(h)),
        JSON.stringify(c1 && c1.links));
      check('  and a link to the dataset it is drawn from',
        !!c1 && c1.links.some(h => /nlftp\.mlit\.go\.jp/.test(h)),
        JSON.stringify(c1 && c1.links));

      await setBox(p, '#opt-han-labels', true);
      await sleep(2000);
      await p.mouse.click(named.x, named.y);
      await sleep(900);
      const c2 = await readCard();
      check('with Kanji labels on the characters lead',
        !!c2 && c2.primary === named.name,
        JSON.stringify(c2 && c2.primary) + ' vs ' + JSON.stringify(named.name));
      check('  and the romanisation follows',
        !!c2 && c2.alt.indexOf(named.ro) >= 0, JSON.stringify(c2 && c2.alt));
      await setBox(p, '#opt-han-labels', false);
      await sleep(1200);

      console.log('\n— take it away, with its source —');
      await p.mouse.click(named.x, named.y, { button: 'right' });
      await sleep(900);
      const menu = await p.evaluate(() => {
        const el = document.querySelector('#jmap-menu');
        if (!el) return null;
        return { rows: [...el.querySelectorAll('button')].map(b => b.textContent),
                 src: [...el.querySelectorAll('.menu-src p')].map(x => x.textContent),
                 links: [...el.querySelectorAll('.menu-src a')].map(a => a.href) };
      });
      const dated = (menu && menu.rows || []).filter(t => /Japan.*railways/.test(t));
      /* The same three Korea offers: the date on screen, the other date, and
         both. The layer draws one date and hides the other rather than leaving
         it out, so all three can be written from what is already here. */
      check('the menu offers the three dated downloads',
        dated.length === 3, JSON.stringify(dated));
      check('and names the railway\'s source beside them',
        !!menu && menu.src.some(t => /Railway:/.test(t)), JSON.stringify(menu && menu.src));
      check('  with the dataset linked',
        !!menu && menu.links.some(h => /nlftp\.mlit\.go\.jp/.test(h)),
        JSON.stringify(menu && menu.links));
      await p.keyboard.press('Escape').catch(() => {});
      await p.evaluate(() => {
        const m = document.querySelector('#jmap-menu');
        if (m && m.parentNode) m.parentNode.removeChild(m);
      });
      await sleep(400);
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

    console.log('\n— the button beside the map follows the railway it names —');
    /* **Reported: opening the train tools over Korea hides Japan's lines and
       leaves the button looking active.**
     *
     * Two faults behind it. The button's lit state was `some` — on if *any*
     * railway anywhere was on — while the name beside it came from whichever
     * ground the view was over, so the two could disagree the moment there was
     * a fourth network. And `railZone` kept the first ground in key order,
     * which put Fukuoka inside Korea's box and offered *Korea's* railways to a
     * reader looking at Kyushu; Korea's ground has since been pulled north off
     * the strait, which costs it nothing — its own 850 stations stop at
     * 34.743 N and Kyushu's north coast is 33.9.
     *
     * What the reader asked for is that the other networks go and the button
     * go with them, and that they can put one back. All three are checked. */
    const bp = await browser.newPage();
    await bp.setViewport({ width: 1400, height: 900 });
    await bp.evaluateOnNewDocument(SHIM);
    const railBtn = () => bp.evaluate(() => {
      const b = document.querySelector('#btn-rail');
      const g = document.querySelector('#jp-rail');
      return { title: b ? b.title : '', pressed: b ? b.getAttribute('aria-pressed') : '',
               on: b ? b.classList.contains('on') : null,
               jpBox: !!(document.querySelector('#opt-jp-rail') || {}).checked,
               krBox: !!(document.querySelector('#opt-kr-rail') || {}).checked,
               jpDrawn: g ? getComputedStyle(g).display : '' };
    });

    /* Kyushu, which is Japan and was being called Korea. */
    await bp.goto(BASE + '?where=130.0,33.0,131.2,34.2', {waitUntil:'domcontentloaded'});
    await ready(bp);
    await sleep(2000);
    let r = await railBtn();
    check('over Kyushu the button offers Japan\'s railways, not Korea\'s',
      /Japan/.test(r.title), JSON.stringify(r.title));

    /* Korea, with both networks on, and then the tools. */
    await bp.goto(BASE + '?where=124.5,34.6,131.0,43.0', {waitUntil:'domcontentloaded'});
    await ready(bp);
    await sleep(1500);
    await setBox(bp, '#opt-jp-rail', true);
    await setBox(bp, '#opt-kr-rail', true);
    await until(bp, () => !!document.querySelector('#jp-rail path.rail'),
                null, {timeout: 25000}).catch(() => {});
    await sleep(2000);
    await setBox(bp, '#opt-train-tools', true);
    await until(bp, () => !!document.querySelector('#train-bar'), null, {timeout: 25000})
      .catch(() => {});
    await sleep(2500);
    r = await railBtn();
    check('the tools switch the other network off',
      r.jpBox === false && r.jpDrawn === 'none', JSON.stringify(r));
    check('  and leave their own on, which is what they are drawn over',
      r.krBox === true && /Korea/.test(r.title), JSON.stringify(r));

    /* Over Japan, with Japan's switched off and Korea's still on: the button
       must report Japan, and Japan is off. This is the one that was wrong. */
    await bp.goto(BASE + '?where=139,35,140.5,36.2', {waitUntil:'domcontentloaded'});
    await ready(bp);
    await sleep(1500);
    await setBox(bp, '#opt-kr-rail', true);
    await sleep(2500);
    r = await railBtn();
    check('over Japan with only Korea\'s on, the button does not look pressed',
      /Japan/.test(r.title) && /^Show/.test(r.title) && r.pressed === 'false' && !r.on,
      JSON.stringify(r));

    /* And the reader can put it back, which is the rest of the ask. */
    await setBox(bp, '#opt-jp-rail', true);
    await until(bp, () => !!document.querySelector('#jp-rail path.rail'),
                null, {timeout: 25000}).catch(() => {});
    await sleep(2000);
    r = await railBtn();
    check('and turning it back on lights it again',
      /^Hide Japan/.test(r.title) && r.pressed === 'true' && r.on
        && r.jpDrawn !== 'none', JSON.stringify(r));
    await bp.close();

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
