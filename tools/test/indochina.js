/* French Indochina: the traced federation, its five protectorates, and the
 * 1941 cession.
 *
 *     node tools/test/indochina.js         # needs a server on 8123
 *
 * The layer replaced two sources that disagreed — Natural Earth's Vietnam cut
 * by two straight lines standing in for a watershed, next to geoBoundaries'
 * modern Lao and Cambodian provinces — with one coverage traced from the 1945
 * OSS map. What is checked here is what that was for: that the divisions are
 * the period's, that each says which protectorate it was in, that the cession
 * is drawn as units of the federation on the 1930 sheet and as Thailand's on
 * the 1942 one, and that the card names the French form and the note.
 */
'use strict';
const { sleep, ready, check, report, SHIM, launch, HOST } = require('./suite.js');
const BASE = process.env.MAP_URL || HOST + '/index.html';

const adminOn = async p => {
  await p.evaluate(() => {
    const b = [...document.querySelectorAll('#layer-seg button')]
      .find(x => /Admin/.test(x.textContent));
    if (b) b.click();
  });
  await sleep(2800);
};

/* The blocks of an atom, with what each carries. */
const BLOCKS = key => {
  const el = document.getElementById('a-' + key);
  if (!el) return null;
  return [...el.querySelectorAll('path[data-prov]')].map(x => ({
    prov: x.getAttribute('data-prov'),
    parent: x.getAttribute('data-parent') || '',
  }));
};

/* A point that is really inside a named block, in client coordinates.
 *
 * Not the centre of its bounding box: a province with a concave edge — and on
 * this coast most of them have one — has a box centre that lands in its
 * neighbour, or in the sea. The box is sampled on a grid and the first point
 * the browser says belongs to this shape is taken. */
const AT = name => {
  const el = [...document.querySelectorAll('[data-prov]')]
    .find(x => x.getAttribute('data-prov') === name);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  for (let fy = 2; fy <= 8; fy++) {
    for (let fx = 2; fx <= 8; fx++) {
      const x = Math.round(r.x + r.width * fx / 10);
      const y = Math.round(r.y + r.height * fy / 10);
      const hit = document.elementFromPoint(x, y);
      if (hit === el || (hit && hit.getAttribute &&
                         hit.getAttribute('data-prov') === name)) {
        return { x: x, y: y };
      }
    }
  }
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
};

/* Hover, then click, then read the card — a mouse in two moves, which is what
   the map is built to answer. */
const open = async (p, name) => {
  const at = await p.evaluate(AT, name);
  if (!at) return { missing: name };
  await p.mouse.move(at.x, at.y);
  await sleep(120);
  await p.mouse.click(at.x, at.y);
  await sleep(700);
  return p.evaluate(() => {
    const box = document.getElementById('info');
    return { primary: box.querySelector('.primary').textContent,
             alt: box.querySelector('.alt').textContent,
             prov: box.querySelector('.prov').textContent,
             note: box.querySelector('.note-own').textContent };
  });
};

(async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({ width: 1200, height: 900 });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));

    // ---------------------------------------------------- 1930, admin on
    await p.goto(BASE + '?epoch=1930', { waitUntil: 'domcontentloaded' });
    await ready(p);
    await p.evaluate(() => document.querySelectorAll('dialog[open]')
      .forEach(d => d.close()));
    await adminOn(p);

    const ic = await p.evaluate(BLOCKS, 'indochina');
    const sg = await p.evaluate(BLOCKS, 'siamgain');
    check('the federation is drawn division by division', ic && ic.length === 88,
          ic ? ic.length : 'no atom');
    check('and the 1941 cession is six more', sg && sg.length === 6,
          sg ? sg.length : 'no atom');

    const all = ic.concat(sg);
    check('every division says which protectorate it was in',
          all.every(b => b.parent), all.filter(b => !b.parent).length + ' without');
    const five = [...new Set(all.map(b => b.parent))].sort();
    check('and there are five of them, no more',
          five.join(',') === 'Annam,Cambodia,Cochinchina,Laos,Tonkin', five.join(','));

    /* The two straight cuts are gone. Tonkin, Annam and Cochinchina were three
       blocks sliced out of one Natural Earth polygon; they are provinces now. */
    check('Tonkin is not one block but its provinces',
          all.filter(b => b.parent === 'Tonkin').length === 27,
          all.filter(b => b.parent === 'Tonkin').length);
    check('no block is named for a protectorate',
          !all.some(b => five.indexOf(b.prov) >= 0),
          all.filter(b => five.indexOf(b.prov) >= 0).map(b => b.prov).join(','));

    /* One province drawn in two atoms, which is what the cession makes of the
       five it cuts through. Both halves answer to the one name. */
    const split = sg.map(b => b.prov)
      .filter(n => ic.some(b => b.prov === n));
    check('the provinces the cession cuts are one name in two atoms',
          split.length === 5 && split.indexOf('Luang Prabang') >= 0,
          split.join(','));

    // ------------------------------------------- the five shades, on hover
    const shades = await p.evaluate(async () => {
      const out = {};
      const pick = n => [...document.querySelectorAll('[data-prov]')]
        .find(x => x.getAttribute('data-prov') === n);
      // light the atom the way a hover does, without needing the pointer
      document.getElementById('a-indochina').classList.add('hot');
      document.getElementById('a-siamgain').classList.add('hot');
      [['Tonkin', 'Bắc Giang'], ['Annam', 'Quảng Nam'],
       ['Cochinchina', 'Mỹ Tho'], ['Cambodia', 'Kandal'],
       ['Laos', 'Vientiane']].forEach(([prot, prov]) => {
        const el = pick(prov);
        out[prot] = el ? getComputedStyle(el).fill : null;
      });
      return out;
    });
    const tones = Object.values(shades).filter(Boolean);
    check('hovering the federation shades all five protectorates',
          tones.length === 5, JSON.stringify(shades));
    check('and no two of them the same shade',
          new Set(tones).size === 5, tones.join(' | '));

    // ------------------------------------------------ the card and tooltip
    /* Driven with the real pointer. The map reads Pointer Events, so a
       synthesised `click` arrives without the move that tells it where the
       cursor is and selects nothing at all — the caution in CLAUDE.md. A point
       inside the shape rather than the centre of its box: a province with a
       concave edge has a box centre in its neighbour. */
    const card = await open(p, 'Đắk Lắk');
    check('the card leads with the name the map draws',
          /Đắk Lắk/.test(card.primary), card.primary);
    check('and gives the French form beside it',
          /Darlac/.test(card.alt), card.alt);
    check('and says which protectorate, before the federation',
          /Annam/.test(card.prov) && /Indochina/.test(card.prov), card.prov);

    const noted = await open(p, 'Kratié');
    check('and the note the trace carries', /Krâchéh/.test(noted.note), noted.note);
    check('Kratié is in Cambodia', /Cambodia/.test(noted.prov), noted.prov);

    // ------------------------------------------------------------- 1942
    await p.goto(BASE + '?epoch=1942', { waitUntil: 'domcontentloaded' });
    await ready(p);
    await p.evaluate(() => document.querySelectorAll('dialog[open]')
      .forEach(d => d.close()));
    await adminOn(p);
    const ic42 = await p.evaluate(BLOCKS, 'indochina');
    check('the 1942 federation is the same divisions', ic42.length === 88,
          ic42.length);
    const lit = await p.evaluate(() => {
      document.getElementById('a-indochina').classList.add('hot');
      const el = [...document.querySelectorAll('#a-siamgain [data-prov]')][0];
      return el ? getComputedStyle(el).fill : null;
    });
    const litIc = await p.evaluate(() => {
      const el = [...document.querySelectorAll('#a-indochina [data-prov]')]
        .find(x => x.getAttribute('data-parent') === 'Cambodia');
      return el ? getComputedStyle(el).fill : null;
    });
    check('and hovering it does not shade the ground Thailand was given',
          lit !== litIc, lit + ' vs ' + litIc);

    check('no page errors', errs.length === 0, errs.join(' | '));
  } finally {
    await browser.close();
  }
  report('indochina');
})();
