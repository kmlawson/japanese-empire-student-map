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

/* The date is not a URL parameter — `?epoch=1942` is read by nothing and the
   map opens on 1930 whatever it says, which is how the second half of this
   file came to test the 1930 sheet twice. The segmented control in the header
   is the switch. */
const epoch = async (p, to) => {
  /* By `data-epoch`, not by the words on the button: each carries three spans
     for three screen widths and `textContent` is all three run together. */
  await p.evaluate(t => {
    const b = document.querySelector('#epoch-seg [data-epoch="' + t + '"]');
    if (b) b.click();
  }, to);
  await sleep(2800);
};

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
  /* Drawn, not merely present. Indochina's divisions are in the document
     twice — once for each date — and `data-epoch` decides which set is shown,
     so counting the elements would count both. */
  return [...el.querySelectorAll('path[data-prov]')]
    .filter(x => x.style.display !== 'none')
    .map(x => ({
      prov: x.getAttribute('data-prov'),
      parent: x.getAttribute('data-parent') || '',
      epoch: x.getAttribute('data-epoch') || '',
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
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await ready(p);
    await p.evaluate(() => document.querySelectorAll('dialog[open]')
      .forEach(d => d.close()));
    await adminOn(p);

    const ic = await p.evaluate(BLOCKS, 'indochina');
    const sg = await p.evaluate(BLOCKS, 'siamgain');
    /* **The 1930 sheet draws the federation whole.** The cession had not
       happened, so the five provinces it later cut are one shape each and the
       cession's own atom has no divisions at all. */
    check('the 1930 federation is drawn division by division',
          ic && ic.length === 89, ic ? ic.length : 'no atom');
    check('and the ground the cession later took has none of its own',
          sg && sg.length === 0, sg ? sg.length : 'no atom');

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

    /* And each of the five is one block, not two abutting ones. This is the
       seam that was reported down the middle of Siem Reap: drawn as a pair,
       each half is thinned inside its own atom, so the edge they share is
       simplified twice and the two results differ. */
    const FIVE = ['Luang Prabang', 'Champasak', 'Siem Reap', 'Stung Treng',
                  'Kampong Thom'];
    const twice = FIVE.filter(n =>
      ic.filter(b => b.prov === n).length !== 1);
    check('and the five provinces the cession cuts are one shape each in 1930',
          twice.length === 0, twice.join(',') || 'all five whole');

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
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await ready(p);
    await p.evaluate(() => document.querySelectorAll('dialog[open]')
      .forEach(d => d.close()));
    await epoch(p, 'e1942');
    const onThat = await p.evaluate(() => {
      const b = document.querySelector('#epoch-seg button.on');
      return b ? b.getAttribute('data-epoch') : '';
    });
    check('the December 1942 sheet is the one showing',
          onThat === 'e1942', onThat);
    await adminOn(p);
    const ic42 = await p.evaluate(BLOCKS, 'indochina');
    const sg42 = await p.evaluate(BLOCKS, 'siamgain');
    check('the 1942 federation is 88 divisions, the cession cut out of it',
          ic42.length === 88, ic42.length);
    check('and the cession is six of its own', sg42.length === 6, sg42.length);
    /* The other way round from 1930: here the five are two blocks, one on each
       side of the line, because one side is Thailand's. */
    const FIVE42 = ['Luang Prabang', 'Champasak', 'Siem Reap', 'Stung Treng',
                    'Kampong Thom'];
    const paired = FIVE42.filter(n =>
      ic42.some(b => b.prov === n) && sg42.some(b => b.prov === n));
    check('and each of the five is drawn on both sides of the 1941 line',
          paired.length === 5, paired.join(','));
    check('every drawn division names the date it belongs to',
          ic42.concat(sg42).every(b => b.epoch === 'e1942'),
          ic42.concat(sg42).filter(b => b.epoch !== 'e1942').length + ' without');
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
