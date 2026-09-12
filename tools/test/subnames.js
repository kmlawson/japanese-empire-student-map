/* When a division is named, and where the name goes when its anchor is off
 * screen.
 *
 *     node tools/test/subnames.js         # with a server on 8123
 *
 * Two rules, both of them about screen pixels rather than about zoom levels.
 *
 * **How big a shape has to be to carry its own name.** There used to be one
 * threshold for every division on the map, which asked the same question of
 * Sìchuān and of Taihoku-shi — four hundred times apart in area. The number
 * that keeps fifty-five Taiwanese districts off the island view is the number
 * that kept China's provinces off until the reader was inside one of them,
 * which is what was reported. The rule now is `√(data-area) / k >= 90` — the
 * shape's equivalent square side, in screen pixels — and it puts each country's
 * divisions in at about the zoom somebody is looking at that country.
 *
 * **And a name whose anchor has left the frame.** A division's name hangs from
 * the centre of its largest block, and `free()` wants a label's whole box
 * inside the window, so zooming into one corner of a large province took its
 * name away — at exactly the zoom where the reader most needs telling what
 * they are looking at. The name now moves to a point inside whatever of the
 * shape is on screen, tested with `isPointInFill` rather than against a
 * bounding box: the middle of the intersection of a box and the window is very
 * often in the *next* province, and a name over the wrong province is worse
 * than a name missing.
 */
const { puppeteer, sleep, ready, until, check, report, SHIM, launch, HOST } = require('./suite.js');

// names on and nothing else
const box = (lon, lat, w) => {
  const h = w * 0.62;
  return [lon - w / 2, lat - h / 2, lon + w / 2, lat + h / 2]
    .map(n => n.toFixed(2)).join(',');
};
const open = async (b, where) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto(HOST+'/index.html?layers=g&where=' + where,
               { waitUntil: 'domcontentloaded' });
  await ready(p);
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  return p;
};
const subs = p => p.evaluate(() => [...document.querySelectorAll('#labels text.sublabel')]
  .filter(e => e.style.display !== 'none' && e.textContent.trim())
  .map(e => e.textContent.trim()));

/* Every division name on screen, and the shape that is actually under the
   middle of it. This is the test that a relocated name has not wandered into
   the neighbour. */
const named = p => p.evaluate(() => {
  const svg = document.querySelector('#jmap');
  const ctm = svg.getScreenCTM().inverse();
  return [...document.querySelectorAll('#labels text.sublabel')]
    .filter(t => t.style.display !== 'none' && t.textContent.trim())
    .map(t => {
      const r = t.getBoundingClientRect();
      const pt = svg.createSVGPoint();
      pt.x = r.left + r.width / 2; pt.y = r.top + r.height / 2;
      const q = pt.matrixTransform(ctm);
      const sp = svg.createSVGPoint(); sp.x = q.x; sp.y = q.y;
      let under = null;
      document.querySelectorAll('#land [data-prov]').forEach(e => {
        if (under) return;
        try { if (e.isPointInFill(sp)) under = e.getAttribute('data-prov'); } catch (err) { /* no box */ }
      });
      return { name: t.textContent.trim(), under: under,
               onScreen: r.left >= 0 && r.right <= innerWidth
                         && r.top >= 0 && r.bottom <= innerHeight };
    });
});

(async () => {
  const b = await launch();

  console.log('\n— each country\'s divisions at its own zoom —');
  /* Nothing at all while the whole map is in view: the entries are not even
     built, which is also what keeps the administrative file unfetched. */
  let p = await open(b, box(113, 33, 90));
  check('no division names on the whole map', (await subs(p)).length === 0);
  await p.close();

  // China, a third of the hemisphere across — the case that was reported
  p = await open(b, box(113, 33, 32));
  let s = await subs(p);
  check('China\'s provinces at 32° of longitude in view',
    ['Húběi', 'Húnán', 'Sìchuān', 'Shāndōng', 'Hénán']
      .every(n => s.indexOf(n) >= 0), s.join(' '));
  /* And Korea's 도 are *not* yet in at that width — they are a twentieth of
     the area and would be a wall of type over a country the size of a thumb.
     This is the half of the rule that a single global threshold could not
     express. */
  check('and Korea\'s provinces are not, at that width',
    !s.some(n => /Ky.nggi|Kangw.n|Ch.llanam/.test(n)), s.join(' '));
  await p.close();

  p = await open(b, box(127.5, 37, 8));
  s = await subs(p);
  check('Korea\'s provinces once Korea is the frame',
    s.some(n => /Ky.nggi|Kangw.n|Ch.ngch..ngbuk|Ch.llanam/.test(n)), s.join(' '));
  await p.close();

  p = await open(b, box(121, 23.7, 3));
  s = await subs(p);
  check('and Taiwan\'s prefectures on Taiwan',
    s.some(n => /zh.u|t.ng/.test(n)), s.join(' '));
  await p.close();

  console.log('\n— a name whose anchor has left the frame —');
  /* Five deep views, each well inside a large province and well away from its
     centroid. Before, four of the five showed no name at all. */
  const DEEP = [
    ['Sichuan, the north-east corner', '106.50,31.60,108.00,32.60', 'Sichuan'],
    ['Gansu, the far west', '96.00,39.00,98.00,40.40', 'Gansu'],
    ['Xinjiang, the south-west', '76.00,37.50,78.00,38.90', 'Xinjiang'],
    ['Hunan, the south-east', '113.00,25.80,114.20,26.70', 'Hunan'],
    ['Suiyuan, the Ordos edge', '107.00,40.20,108.60,41.30', 'Suiyuan'],
  ];
  for (const [what, where, key] of DEEP) {
    p = await open(b, where);
    const got = await named(p);
    check(what + ': the province is named',
      got.some(g => g.under === key), got.map(g => g.name).join(' ') || '(nothing)');
    /* And every name that is written sits inside the shape it names, and
       inside the window. A relocated label is placed by hand rather than by
       its anchor, so both have to be said. */
    check(what + ': and every name is in its own shape, on screen',
      got.length > 0 && got.every(g => g.under && g.onScreen),
      JSON.stringify(got));
    await p.close();
  }

  /* **THE DIVISION THAT WAS CLICKED STAYS PICKED OUT.**
     `prov-hot` follows the pointer and goes with it, which is right for a
     hover and wrong for a choice: a reader with a card open about one of
     Java's thirty-eight residencies could not see which. `prov-sel` is the
     sticky one, written at the moment of choosing and cleared wherever the
     selection is.

     Three cautions learned driving this, all three of which made an earlier
     attempt measure zero:
       * the hover is a `mousemove` on `#map-container`, not a pointer event
         on the SVG, and `hoverCapable` gates it — so the SHIM matters;
       * a sub-unit off the edge of the view has a screen point outside the
         container and a click there reaches nothing, so the target is chosen
         by its centre being **on screen** rather than by its size;
       * and the selection has to be checked *after* the pointer has moved
         away, which is the whole point of it. */
  {
    const p = await b.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({ width: 1200, height: 900 });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    await p.goto(HOST + '/index.html?layers=8&where=103,19,108,23',
                 { waitUntil: 'domcontentloaded' });
    await ready(p);
    await sleep(2200);
    const at = await p.evaluate(() => {
      const svg = document.getElementById('jmap');
      const m = svg.getScreenCTM();
      const cr = document.getElementById('map-container').getBoundingClientRect();
      const pt = svg.createSVGPoint();
      let best = null;
      [...document.querySelectorAll('#a-indochina [data-prov]')].forEach(el => {
        if (getComputedStyle(el).display === 'none') return;
        const bb = el.getBBox();
        pt.x = bb.x + bb.width / 2; pt.y = bb.y + bb.height / 2;
        const s = pt.matrixTransform(m);
        if (s.x < cr.x + 8 || s.x > cr.right - 8) return;
        if (s.y < cr.y + 8 || s.y > cr.bottom - 8) return;
        const area = bb.width * bb.height;
        if (!best || area > best.area) {
          best = { x: Math.round(s.x), y: Math.round(s.y), area: area,
                   aim: el.getAttribute('data-prov') };
        }
      });
      return best;
    });
    check('a division of Indochina is on screen to aim at', !!at,
      at ? at.aim : 'nothing in view');
    if (at) {
      await p.mouse.move(at.x - 6, at.y - 6); await sleep(250);
      await p.mouse.move(at.x, at.y); await sleep(700);
      const hov = await p.evaluate(() =>
        document.querySelectorAll('.prov-hot').length);
      check('  hovering it picks it out', hov > 0, String(hov));
      check('  and nothing is selected yet', (await p.evaluate(() =>
        document.querySelectorAll('.prov-sel').length)) === 0);
      await p.mouse.down(); await sleep(120); await p.mouse.up();
      await sleep(700);
      const sel = await p.evaluate(() => ({
        names: [...document.querySelectorAll('.prov-sel')]
          .map(e => e.getAttribute('data-prov')),
        card: (document.querySelector('#info .primary') || {}).textContent || '',
      }));
      check('  clicking it selects it', sel.names.length > 0
        && sel.names.indexOf(at.aim) >= 0, JSON.stringify(sel.names));
      check('  and the card is about that division', sel.card === at.aim,
        sel.card + ' vs ' + at.aim);
      // away from it: the hover goes, the selection stays
      await p.mouse.move(40, 40); await sleep(200);
      await p.mouse.move(60, 60); await sleep(500);
      const after = await p.evaluate(() => ({
        sel: document.querySelectorAll('.prov-sel').length,
        fill: (() => {
          const e = document.querySelector('.prov-sel');
          return e ? getComputedStyle(e).fill : '';
        })(),
        outline: document.querySelectorAll('#highlight .hi-selprov path').length,
        outlineStroke: (() => {
          const e = document.querySelector('#highlight .hi-selprov path');
          return e ? getComputedStyle(e).stroke + ' w='
                     + getComputedStyle(e).strokeWidth : 'none drawn';
        })(),
      }));
      check('  and it stays picked out when the pointer leaves',
        after.sel > 0, JSON.stringify(after));
      check('  with a fill of its own, not the country’s',
        /srgb|rgb/.test(after.fill), after.fill);
      /* **And the line round it, which is what says *this one* most
         plainly.** The fill lift alone left a reader with a card about a
         province and only a quiet tint to find it by. `hi-selprov` is a
         highlight slot of its own — `hi-province` belongs to the pointer and
         is dropped when it leaves. */
      check('  and the outline round it stays too',
        after.outline > 0, after.outlineStroke);
    }
    check('no page errors selecting a division', errs.length === 0, errs.join(' | '));
    await p.close();
  }

  await b.close();
  process.exit(report());
})();
