/* The Netherlands Indies: its residencies, its gouvernements and its outline.
 *
 *     node tools/test/dei.js               # needs a server on 8123
 *
 * Sixty-five units from Cribb's residency boundaries on Natural Earth
 * coastlines, fifty of them inside one of eight gouvernements and fifteen
 * answering to Batavia direct. Three things are worth guarding.
 *
 * **The shades have to differ from each other and from the lit atom.** A
 * hovered atom is already lifted about eleven per cent toward white, so a
 * shade mixed at 88 or 89 per cent resolves to the same three decimal places
 * as the lift: `Westerafdeeling van Borneo` did, and west Borneo therefore
 * read as belonging to no gouvernement at all — which is the one thing the
 * shading exists to say. Measured here through `getComputedStyle`, because
 * `color-mix` is resolved by the browser and cannot be checked by reading the
 * stylesheet.
 *
 * **A residency with no gouvernement must not be shaded.** Fifteen of them had
 * none, and giving them a parent to make the picture tidy would assert an
 * administrative level that did not exist.
 *
 * **And the island names have to survive the residencies.** An island is a
 * place whatever the Administrative switch says; Java is Java. The residencies
 * are drawn in front of them, so both must be in the sheet.
 */
'use strict';
const { ready, check, report, SHIM, launch, HOST } = require('./suite.js');
const BASE = process.env.MAP_URL || HOST + '/index.html';

/* Every gouvernement in the source, with how many units the build put in it.
   A number that moves means the coverage changed, which is worth being told
   about rather than absorbing. */
const GOUVERNEMENTS = {
  'West-Java': 9, 'Midden-Java': 11, 'Oost-Java': 15,
  'Soerakarta': 2, 'Jogjakarta': 1,
  'Westerafdeeling van Borneo': 4,
  'Zuider- en Oosterafdeeling van Borneo': 7,
  'Gouvernement der Molukken': 1,
};

/* The 1942 sheet groups by the occupying command instead, and these three
   cover all 47 of its units. Counted here for the same reason the
   gouvernements are: a number that moves means the coverage changed. */
const COMMANDS = { 'Java 17th Army': 21, 'Japanese Navy': 16,
                   'Japanese 25th Army': 10 };

(async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({ width: 1200, height: 900 });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await ready(p);

    const got = await p.evaluate(async (groups) => {
      const atom = document.getElementById('a-dei');
      if (!atom) return { err: 'no #a-dei' };
      const inAtom = sel => [...atom.querySelectorAll(sel)];
      const names = inAtom('[data-prov]').map(e => e.getAttribute('data-prov'));
      const parented = inAtom('[data-parent]');
      const counts = {};
      parented.forEach(e => {
        const g = e.getAttribute('data-parent');
        counts[g] = (counts[g] || 0) + 1;
      });
      /* Lit by hand rather than by the pointer. What is being measured is
         whether the stylesheet resolves eight different colours, and the
         classes are what the hover puts on — driving the pointer would test
         the hit-testing as well and tell us less about either. */
      document.getElementById('jmap').classList.add('admin-on');
      atom.classList.add('hot');
      await new Promise(r => requestAnimationFrame(r));
      const fill = el => el ? getComputedStyle(el).fill : '';
      const shades = {};
      Object.keys(groups).forEach(g => {
        shades[g] = fill(atom.querySelector('[data-parent="' + g + '"]'));
      });
      /* **PAINT ORDER, WHICH IS WHAT ACTUALLY BROKE.**
         Every one of these blocks is filled with the country's colour, so a
         block painted later hides the strokes of the ones before it. An
         island block is the whole of Borneo or of Java as one shape: with it
         drawn after its own residencies, the boundaries were painted and then
         buried, and the Indies came out flat orange with a crisp coast and
         nothing inside. The computed stroke was right the whole time — which
         is why this is an order check and not a colour one. */
      const kids = [...atom.children].filter(e => e.hasAttribute
        && e.hasAttribute('data-prov'));
      const idx = {};
      kids.forEach((e, i) => { idx[e.getAttribute('data-prov')] = i; });
      const bare = [...atom.children].findIndex(e => e.tagName === 'path'
        && e.hasAttribute('d') && !e.hasAttribute('data-prov'));
      const dated = kids.filter(e => e.hasAttribute('data-epoch'));
      const isles = kids.filter(e => !e.hasAttribute('data-epoch'));
      return {
        order: {
          bareAt: bare,
          lastIsle: Math.max.apply(null, isles.map(e => idx[e.getAttribute('data-prov')])),
          firstDated: Math.min.apply(null, dated.map(e => idx[e.getAttribute('data-prov')])),
          isles: isles.length, dated: dated.length,
        },
        provs: names.length,
        units: names,
        counts: counts,
        shades: shades,
        atomFill: fill(atom),
        bare: fill(atom.querySelector('[data-prov="Palembang"]')),
      };
    }, Object.assign({}, GOUVERNEMENTS, COMMANDS));

    check('the Indies atom is in the sheet', !got.err, got.err || '');
    if (got.err) { report('dei'); return; }

    const residencies = Object.keys(GOUVERNEMENTS).concat(Object.keys(COMMANDS));
    check('both sheets of residencies are drawn, and the islands with them',
          got.provs === 156,
          got.provs + ' sub-units (65 of 1930 + 47 of 1942 + 44 islands)');
    check('Java is still a place as well as a set of residencies',
          got.units.indexOf('Java') >= 0 && got.units.indexOf('Bagelen') >= 0,
          'Java and Bagelen both present');
    /* Ambon is the case that decided how the two coastlines are joined: the
       coverage has no residency for it, Natural Earth has the island, and the
       Moluccas were governed from it. */
    check('and so is Ambon, which no residency claimed',
          got.units.indexOf('Ambon') >= 0,
          got.units.indexOf('Ambon') >= 0 ? 'drawn' : 'lost with the swap');

    Object.keys(GOUVERNEMENTS).forEach(g => {
      check('  ' + g + ' holds its ' + GOUVERNEMENTS[g] + ' unit(s)',
            got.counts[g] === GOUVERNEMENTS[g],
            (got.counts[g] || 0) + ' found');
    });
    Object.keys(COMMANDS).forEach(g => {
      check('  the ' + g + ' holds its ' + COMMANDS[g] + ' unit(s)',
            got.counts[g] === COMMANDS[g], (got.counts[g] || 0) + ' found');
    });
    check('fifty of the 1930 units sit in a gouvernement',
          Object.keys(GOUVERNEMENTS).reduce((n, k) => n + (got.counts[k] || 0), 0) === 50,
          JSON.stringify(got.counts));
    check('and all 47 of the 1942 units sit under a command',
          Object.keys(COMMANDS).reduce((n, k) => n + (got.counts[k] || 0), 0) === 47,
          JSON.stringify(got.counts));

    const shades = residencies.map(g => got.shades[g]);
    check('every gouvernement shades differently from the others',
          new Set(shades).size === residencies.length,
          new Set(shades).size + ' distinct of ' + residencies.length);
    const clash = residencies.filter(g => got.shades[g] === got.atomFill);
    check('and none of them comes out as the lit atom’s own colour',
          clash.length === 0,
          clash.length ? clash.join(', ') + ' = ' + got.atomFill
                       : 'all clear of ' + got.atomFill);
    check('a residency with no gouvernement is not shaded at all',
          got.bare === got.atomFill,
          'Palembang ' + got.bare);

    /* The islands must all be painted before any dated residency, or the
       residencies' boundaries are buried under them. */
    check('every island is painted under the residencies',
          got.order.lastIsle < got.order.firstDated,
          JSON.stringify(got.order));
    check('and the unnamed leftover is painted first of all',
          got.order.bareAt === 0, 'at index ' + got.order.bareAt);

    check('no page errors', errs.length === 0, errs.join(' | '));
  } finally {
    await browser.close();
  }
  report('dei');
})();
