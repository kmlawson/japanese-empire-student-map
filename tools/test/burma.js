/* Burma's districts, the divisions they sat in, and where they stop.
 *
 *     node tools/test/burma.js             # needs a server on 8123
 *
 * Eighty-five districts and states from the Imperial Gazetteer of India,
 * Atlas: 1931, in nine groups — the seven Divisions of Burma proper, the
 * Federated Shan States gathered from the five spellings the source uses, and
 * Karenni, which was never annexed. They replaced seven *modern* Burmese
 * divisions standing in for the framework.
 *
 * **The outline is not this coverage's, and that is the thing to guard.**
 * `burma-modern-modified` is a tracing cut to British India's own, which it
 * overlaps by exactly 0 km²; this coverage is an independent reading of the
 * same frontier and overlaps India by 166 km², leaving 764 km² of ground in
 * neither country against the old pair's 353. So the districts are clipped to
 * the tracing — `clip-burma` — and stop where Burma stops. If that clip ever
 * comes off the sub-units, the province grows a second outline a few
 * kilometres outside the first and the Kachin salient sprouts past it.
 *
 * The rest is the pattern the Indies established: the groups must shade
 * differently from each other and from the lit atom, a district the source
 * leaves unnamed must not be named, and the paint order must keep the unnamed
 * ground under the districts.
 */
'use strict';
const { ready, check, report, SHIM, launch, sleep } = require('./suite.js');
const BASE = process.env.MAP_URL || HOST_BASE();
function HOST_BASE() {
  const { HOST } = require('./suite.js');
  return HOST + '/index.html';
}

/* Every group, with how many district paths the build put in it. A number
   that moves means the coverage or the grouping changed.

   Counted in `#a-burma`, because the admin sheet is *grafted into the atom*
   when the layer goes on — the `<g data-for="burma">` wrapper it travels in
   does not survive the graft, and querying for it finds nothing at all. */
const GROUPS = {
  'Arakan Division': 4, 'Irrawaddy Division': 5, 'Magwe Division': 6,
  'Mandalay Division': 5, 'Pegu Division': 4, 'Sagaing Division': 9,
  'Tenasserim Division': 6, 'Federated Shan States': 48,
  'Karenni States': 3,
};

(async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({ width: 1200, height: 900 });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    // ?layers=8 switches Administrative on, which is what fetches the sheet
    // the districts live in: Burma is not an archipelago, so they are deferred
    await p.goto(BASE + '?layers=8&where=92,9,102,29',
                 { waitUntil: 'domcontentloaded' });
    await ready(p);
    // the districts are in the deferred admin sheet and grafted into the atom
    // when the layer goes on, so the wait is for a fetch and not a frame
    await sleep(4000);

    const got = await p.evaluate(async (groups) => {
      const atom = document.getElementById('a-burma');
      if (!atom) return { err: 'no #a-burma' };
      const subs = [...document.querySelectorAll('#a-burma [data-prov]')];
      const all = [...document.querySelectorAll('#a-burma path')];
      const counts = {};
      [...document.querySelectorAll('#a-burma [data-parent]')]
        .forEach(e => {
          const g = e.getAttribute('data-parent');
          counts[g] = (counts[g] || 0) + 1;
        });
      const names = subs.map(e => e.getAttribute('data-prov'));
      /* Lit by hand: what is measured is whether the stylesheet resolves nine
         different colours, and these are the classes the hover applies. */
      document.getElementById('jmap').classList.add('admin-on');
      atom.classList.add('hot');
      await new Promise(r => requestAnimationFrame(r));
      const fill = el => el ? getComputedStyle(el).fill : '';
      const shades = {};
      Object.keys(groups).forEach(g => {
        shades[g] = fill(document.querySelector(
          '#a-burma [data-parent="' + g + '"]'));
      });
      const kids = [...atom.children].filter(e => e.tagName === 'path');
      const bare = kids.findIndex(e => !e.hasAttribute('data-prov'));
      return {
        paths: all.length, named: subs.length, names, counts, shades,
        atomFill: fill(atom),
        clipped: subs.filter(e => (e.getAttribute('clip-path') || '')
                                  .indexOf('clip-burma') >= 0).length,
        bareAt: bare, kids: kids.length,
      };
    }, GROUPS);

    check('the Burma atom is in the sheet', !got.err, got.err || '');
    if (got.err) { report('burma'); return; }

    check('eighty-five districts are drawn', got.named === 85,
          got.named + ' named of ' + got.paths + ' paths');
    check('and the five the source leaves blank are not named',
          got.paths - got.named === 5,
          (got.paths - got.named) + ' unnamed');
    /* Asked for by name: the Gazetteer's `Tribal Area` is The Triangle. */
    check('the Tribal Area is called The Triangle',
          got.names.indexOf('The Triangle') >= 0
          && got.names.indexOf('Tribal Area') < 0,
          got.names.indexOf('Tribal Area') >= 0 ? 'still Tribal Area' : 'renamed');
    /* One district in two pieces, merged rather than fought over: the key is
       the name and the file had Hanthawaddy twice. */
    check('Hanthawaddy is one district, not two keys',
          got.names.filter(n => n === 'Hanthawaddy').length >= 1,
          got.names.filter(n => n === 'Hanthawaddy').length + ' block(s)');

    Object.keys(GROUPS).forEach(g => {
      check('  ' + g + ' holds its ' + GROUPS[g] + ' district path(s)',
            got.counts[g] === GROUPS[g], (got.counts[g] || 0) + ' found');
    });

    const gs = Object.keys(GROUPS);
    const shades = gs.map(g => got.shades[g]);
    check('every group shades differently from the others',
          new Set(shades).size === gs.length,
          new Set(shades).size + ' distinct of ' + gs.length);
    const clash = gs.filter(g => got.shades[g] === got.atomFill);
    check('and none of them comes out as the lit atom’s own colour',
          clash.length === 0,
          clash.length ? clash.join(', ') : 'all clear of ' + got.atomFill);

    /* **The clip is the whole of the frontier story.** Off, and Burma grows a
       second outline outside the first. */
    check('every district is clipped to Burma’s own outline',
          got.clipped === got.named,
          got.clipped + ' of ' + got.named + ' carry clip-burma');
    check('and the unnamed ground is painted under the districts',
          got.bareAt === 0, 'unnamed block at index ' + got.bareAt);

    check('no page errors', errs.length === 0, errs.join(' | '));

    /* **THE 1931 CENSUS FIGURES REACH THE DISTRICT'S OWN CARD.**
       Appendix B's Schedule for Racial Map, transcribed to
       `data/population/burma-1931.csv`. Akyab is the check because its row
       was re-read from the page cell by cell: 637,580 all races, 327,872 in
       the Burma Group, 210,990 Indian Races. The table behind it must be
       reachable from the card too — a figure a reader can see is a figure
       they will quote, and it has to be able to take the source with it. */
    {
      const at = await p.evaluate(() => {
        const svg = document.getElementById('jmap');
        const el = document.querySelector('#a-burma [data-prov="Akyab"]');
        if (!el) return null;
        const bb = el.getBBox(), m = svg.getScreenCTM();
        const pt = svg.createSVGPoint();
        pt.x = bb.x + bb.width / 2; pt.y = bb.y + bb.height / 2;
        const s = pt.matrixTransform(m);
        const cr = document.getElementById('map-container').getBoundingClientRect();
        return (s.x > cr.x && s.x < cr.right && s.y > cr.y && s.y < cr.bottom)
          ? { x: Math.round(s.x), y: Math.round(s.y) } : null;
      });
      check('  Akyab is on screen to click', !!at, at ? at.x + ',' + at.y : 'off view');
      if (at) {
        await p.mouse.move(at.x - 6, at.y - 6); await sleep(250);
        await p.mouse.move(at.x, at.y); await sleep(600);
        await p.mouse.down(); await sleep(120); await p.mouse.up();
        await sleep(1200);
        const card = await p.evaluate(() => {
          const t = (document.querySelector('#info') || {}).textContent || '';
          return {
            all: /637,?580/.test(t), burma: /327,?872/.test(t),
            indian: /210,?990/.test(t), race: /race-group/i.test(t),
            year: /1931/.test(t),
            table: [...document.querySelectorAll('#info button, #info a')]
              .some(e => /population table/i.test(e.textContent || '')),
          };
        });
        check('  its card carries the all-races figure', card.all, JSON.stringify(card));
        check('  and the race-group figures with it',
              card.burma && card.indian && card.race, JSON.stringify(card));
        check('  dated to the census it came from', card.year);
        check('  and the whole table is one press away', card.table);
      }
    }
    await p.close();

    /* **THE CONTESTED FRONTIER MUST NOT SWALLOW A CLICK MEANT FOR A
       DISTRICT.** The blocks nobody agreed on are in `ON_TOP`, drawn over
       every country they cross, and the one on the Kachin frontier lies over
       Myitkyina, the Hukawng valley and The Triangle — it answered for all of
       them. It stands down while the Administrative layer is on and answers
       for itself when the layer is off, which is the only thing the map has
       to say about that ground with no divisions drawn. */
    for (const [layers, want] of [['0', 'contested'], ['8', 'district']]) {
      const q = await browser.newPage();
      await q.evaluateOnNewDocument(SHIM);
      await q.setViewport({ width: 1000, height: 800 });
      const e2 = [];
      q.on('pageerror', e => e2.push(String(e).slice(0, 160)));
      await q.goto(BASE + '?layers=' + layers + '&where=95,23.5,100,28.5',
                   { waitUntil: 'domcontentloaded' });
      await ready(q);
      await sleep(3200);
      const at = await q.evaluate(() => {
        const svg = document.getElementById('jmap');
        const el = document.querySelector('#a-contested_burma path')
                || document.querySelector('#a-contested_burma');
        if (!el || !el.getBBox) return null;
        const bb = el.getBBox(), m = svg.getScreenCTM();
        const pt = svg.createSVGPoint();
        pt.x = bb.x + bb.width / 2; pt.y = bb.y + bb.height / 2;
        const s = pt.matrixTransform(m);
        return { x: Math.round(s.x), y: Math.round(s.y) };
      });
      check('  the Kachin contested block is on screen', !!at,
            at ? at.x + ',' + at.y : 'not drawn');
      if (at) {
        await q.mouse.move(at.x - 6, at.y - 6); await sleep(250);
        await q.mouse.move(at.x, at.y); await sleep(700);
        const got2 = await q.evaluate(() => ({
          prov: (() => { const e = document.querySelector('.prov-hot');
                         return e ? e.getAttribute('data-prov') : null; })(),
          tip: ((document.querySelector('#tooltip') || {}).textContent || '')
               .slice(0, 40),
        }));
        if (want === 'contested') {
          check('  with the layer off the frontier answers for itself',
                !got2.prov && /contested|未確定/.test(got2.tip),
                JSON.stringify(got2));
        } else {
          check('  with the layer on a district answers instead',
                !!got2.prov, JSON.stringify(got2));
        }
      }
      check('  no page errors over the contested block', e2.length === 0,
            e2.join(' | '));
      await q.close();
    }
  } finally {
    await browser.close();
  }
  report('burma');
})();
