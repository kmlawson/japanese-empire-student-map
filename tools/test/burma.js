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
            indian: /210,?990/.test(t), race: /ethnic group/i.test(t),
            year: /1931/.test(t),
            table: [...document.querySelectorAll('#info button, #info a')]
              .some(e => /population table/i.test(e.textContent || '')),
          };
        });
        check('  its card carries the all-races figure', card.all, JSON.stringify(card));
        check('  and the ethnic-group figures with it',
              card.burma && card.indian && card.race, JSON.stringify(card));
        check('  dated to the census it came from', card.year);
        check('  and the whole table is one press away', card.table);
      }
    }
    /* **THE FIRST THEMATIC LAYER.**
       A theme is a question asked of a place — here, how far the
       administration of Burma actually reached — drawn over the districts
       rather than instead of them. Six things have to hold, and each of them
       was a decision:
         * the book appears where the ground has a theme and nowhere else;
         * pressing it draws the four categories, `pointer-events: none` so
           the districts underneath still answer;
         * it brings the Administrative layer and the names with it, because
           the categories mean nothing over a blank country;
         * the districts are *stroked*, not merely strokeable — the layer
           normally draws boundaries for the hovered country alone;
         * the key gains the four categories, since they are in colours the
           map does not otherwise use;
         * and the button goes blue rather than the accent every other
           pressed button goes, because a theme changes what the map says. */
    {
      const th = await p.evaluate(() => {
        const b2 = document.getElementById('btn-theme');
        return { exists: !!b2, hidden: b2 ? b2.hidden : null };
      });
      check('  the book is offered over Burma', th.exists && !th.hidden,
            JSON.stringify(th));
      if (th.exists && !th.hidden) {
        /* **THE PRESS OPENS THE MENU, IT DOES NOT SWITCH THE LAYER ON.**
           Even with one theme in it: the menu is what says what the layer is,
           its date and where it came from, and a reader pressing an
           unfamiliar book wants that before the map changes under them. It
           also makes the press mean the same thing over every country. The
           map must be untouched at this point — that is the half of it a
           straight toggle would pass anyway. */
        await p.click('#btn-theme');
        await sleep(900);
        const opened = await p.evaluate(() => {
          const m = document.getElementById('theme-menu');
          const rows = m ? [...m.querySelectorAll('label.row')] : [];
          return { shown: !!m && !m.hidden,
                   rows: rows.map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 34)),
                   button: !!(m && m.querySelector('.menu-reset')),
                   drawn: !!document.getElementById('thematic') };
        });
        /* One theme and the way out, which is a row like any other rather than
           a button under the list: turning the layer off is the same kind of
           act as turning one on, and these are radios. */
        check('    the press opens the menu, with the one theme and Off in it',
              opened.shown && opened.rows.length === 2
              && /1931 Administration/.test(opened.rows[0])
              && opened.rows[1] === 'Off' && !opened.button,
              JSON.stringify(opened));
        check('    and draws nothing until something is chosen',
              !opened.drawn, String(opened.drawn));
        await p.evaluate(() => {
          const m = document.getElementById('theme-menu');
          const lab = [...m.querySelectorAll('label.row')]
            .find(e => /1931 Administration/.test(e.textContent || ''));
          const inp = lab && lab.querySelector('input');
          if (inp) inp.click();
        });
        await sleep(2800);
        const on = await p.evaluate(() => {
          const g = document.getElementById('thematic');
          const cats = g ? [...g.querySelectorAll('path')]
            .map(e => e.getAttribute('data-cat')) : [];
          const first = g && g.querySelector('path');
          const btn = document.getElementById('btn-theme');
          const atom = document.getElementById('a-burma');
          return {
            cats: [...new Set(cats)].sort(),
            opacity: first ? getComputedStyle(first).fillOpacity : null,
            pointer: g ? getComputedStyle(g).pointerEvents : null,
            blue: btn ? getComputedStyle(btn).backgroundColor : '',
            on: btn ? btn.classList.contains('on') : false,
            admin: document.getElementById('jmap').classList.contains('admin-on'),
            subs: atom ? atom.classList.contains('subs') : false,
            labels: document.querySelectorAll('#labels text, #labels .lab').length > 0,
            key: [...document.querySelectorAll('#legend .item')]
              .map(e => e.textContent.trim())
              .filter(t => /Regular Administration|Loosely Administered|Special Administration|Unadministered/.test(t)),
          };
        });
        check('    the four categories are drawn',
              on.cats.length === 4, on.cats.join(', '));
        check('    over the districts, not instead of them',
              on.pointer === 'none' && parseFloat(on.opacity) > 0.3
              && parseFloat(on.opacity) < 0.8,
              'pointer-events ' + on.pointer + ', fill-opacity ' + on.opacity);
        check('    and it brings the districts and their names with it',
              on.admin && on.labels, JSON.stringify({ admin: on.admin, labels: on.labels }));
        check('    with their boundaries actually stroked', on.subs,
              'a-burma carries subs: ' + on.subs);
        check('    the key gains the four categories', on.key.length === 4,
              on.key.join(' | '));
        /* Blue, and specifically not the accent: an earlier draft of this
           rule sat before the one it had to beat and came out red. */
        check('    and the book goes blue, not the accent',
              /rgb\(31,\s*58,\s*104\)/.test(on.blue), on.blue);
      }
    }
    await p.close();

    /* **WHAT THE THEME ANSWERS, AND WHAT THE DISTRICTS ARE CALLED.**
       Two things the reader asked for once the layer was up, and both are
       about being able to read the map without clicking it.

       The category goes in the hover, beside the district's own names: a
       wash against a key in the corner is a lookup, and the question the
       layer exists to answer should not cost one.

       And a district inside a group writes its own name once it is big
       enough on screen to carry it. It never did — a `data-parent` returned
       before the label was made, so the seven Divisions were named and the
       eighty-five districts under them were nameless at every zoom. The
       gate is `subFits` on the district's own area, so this is a zoom
       threshold and not a switch: the delta must name several of its
       districts, and the far view must not name all of them. */
    {
      const z = await browser.newPage();
      await z.evaluateOnNewDocument(SHIM);
      await z.setViewport({ width: 1100, height: 850 });
      const e3 = [];
      z.on('pageerror', e => e3.push(String(e).slice(0, 160)));
      await z.goto(BASE + '?where=93.5,15,98.5,19.5',
                   { waitUntil: 'domcontentloaded' });
      await ready(z); await sleep(2200);
      // the book opens the menu; the theme is chosen from it
      await z.click('#btn-theme'); await sleep(900);
      await z.evaluate(() => {
        const m = document.getElementById('theme-menu');
        const lab = m && [...m.querySelectorAll('label.row')]
          .find(e => /1931 Administration/.test(e.textContent || ''));
        const inp = lab && lab.querySelector('input');
        if (inp) inp.click();
      });
      await sleep(2800);

      const labs = await z.evaluate(() => {
        const D = ['Bassein', 'Myaungmya', 'Henzada', 'Hanthawaddy', 'Thaton',
                   'Amherst', 'Prome', 'Toungoo'];
        const txt = [...document.querySelectorAll('#labels text')]
          .filter(e => e.style.display !== 'none' && (e.textContent || '').trim())
          .map(e => e.textContent.trim());
        return D.filter(d => txt.some(t => t.indexOf(d) === 0));
      });
      check('  the delta\'s districts write their own names',
            labs.length >= 5, labs.join(', ') || 'none');

      /* Aimed by the district's own box rather than by a guessed point: a
         sub-unit whose centre is off the edge of the view has a screen point
         outside the container, and the hover is a mousemove on the container,
         so the pointer would reach nothing at all. */
      const at = await z.evaluate(() => {
        const svg = document.getElementById('jmap');
        const el = document.querySelector('#a-burma [data-prov="Bassein"]');
        if (!el) return null;
        const bb = el.getBBox(), m = svg.getScreenCTM();
        const pt = svg.createSVGPoint();
        pt.x = bb.x + bb.width / 2; pt.y = bb.y + bb.height / 2;
        const s2 = pt.matrixTransform(m);
        const cr = document.getElementById('map-container').getBoundingClientRect();
        return (s2.x > cr.x + 8 && s2.x < cr.right - 8
                && s2.y > cr.y + 8 && s2.y < cr.bottom - 8)
          ? { x: Math.round(s2.x), y: Math.round(s2.y) } : null;
      });
      check('  Bassein is on screen to be hovered', !!at,
            at ? at.x + ',' + at.y : 'not drawn');
      if (at) {
        await z.mouse.move(at.x - 6, at.y - 6); await sleep(250);
        await z.mouse.move(at.x, at.y); await sleep(700);
        const tip = await z.evaluate(() => ({
          cat: (document.querySelector('#tooltip .theme-cat') || {}).textContent || '',
          all: ((document.querySelector('#tooltip') || {}).textContent || '').slice(0, 80),
        }));
        check('  the hover says which category the ground is in',
              tip.cat === 'Regular Administration', JSON.stringify(tip));
        check('  and still says what the district and its country are',
              /Bassein/.test(tip.all) && /Irrawaddy Division/.test(tip.all),
              tip.all);
      }
      /* **THE CATEGORY IS THE POLYGON'S, NOT THE DISTRICT'S.**
         `themeCatOf` places a district by its own centroid — one answer for
         the whole of it — which is right for "what kind of place was
         Myitkyina" and wrong for "what am I pointing at". Myitkyina is the
         case the author reported: its centroid is in the loosely administered
         red and the pointer was in the specially administered green, and the
         hover said red. Checked against the drawn shapes rather than against
         a list, so this cannot drift with the source. */
      const agree = await (async () => {
        const pts = await z.evaluate(() => {
          const svg = document.getElementById('jmap');
          const g = document.getElementById('thematic');
          const cr = document.getElementById('map-container').getBoundingClientRect();
          const m = svg.getScreenCTM();
          const out = [], seen = new Set();
          document.querySelectorAll('#a-burma [data-prov]').forEach(el => {
            const bb = el.getBBox();
            if (!bb.width) return;
            for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) {
              const q = svg.createSVGPoint();
              q.x = bb.x + bb.width * i / 6; q.y = bb.y + bb.height * j / 6;
              if (!el.isPointInFill(q)) continue;
              const hit = [...g.childNodes].find(k => k.isPointInFill && k.isPointInFill(q));
              if (!hit) continue;
              const cat = hit.getAttribute('data-cat-en');
              const key = el.getAttribute('data-prov') + '|' + cat;
              if (seen.has(key)) continue;
              const pt = svg.createSVGPoint(); pt.x = q.x; pt.y = q.y;
              const s2 = pt.matrixTransform(m);
              if (s2.x < cr.x + 14 || s2.x > cr.right - 14
                  || s2.y < cr.y + 14 || s2.y > cr.bottom - 14) continue;
              seen.add(key);
              out.push({ cat: cat, x: Math.round(s2.x), y: Math.round(s2.y) });
            }
          });
          return out.slice(0, 8);
        });
        let same = 0;
        for (const q of pts) {
          await z.mouse.move(q.x - 8, q.y - 8); await sleep(180);
          await z.mouse.move(q.x, q.y); await sleep(520);
          const got = await z.evaluate(() =>
            (document.querySelector('#tooltip .theme-cat') || {}).textContent || '');
          if (got === q.cat) same++;
        }
        return { n: pts.length, same: same };
      })();
      check('  the hover names the category of the ground, not of the district',
            agree.n >= 4 && agree.same === agree.n,
            agree.same + ' of ' + agree.n + ' points agree with the polygon');

      check('  no page errors under the theme', e3.length === 0, e3.join(' | '));
      await z.close();
    }

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
