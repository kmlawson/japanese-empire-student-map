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
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('subnames test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

// names on and nothing else
const box = (lon, lat, w) => {
  const h = w * 0.62;
  return [lon - w / 2, lat - h / 2, lon + w / 2, lat + h / 2]
    .map(n => n.toFixed(2)).join(',');
};
const open = async (b, where) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto('http://localhost:8123/index.html?layers=g&where=' + where,
               { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(3000);
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
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

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

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
