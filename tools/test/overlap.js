/* Nothing floating over the map sits on anything else, on a phone.
 *
 *     node tools/test/overlap.js           # needs a server on 8123
 *
 * Reported 23 September 2026: the close button of the Layers and About panes
 * could not be found on a phone. It had scrolled away — `position: sticky` on
 * a button inside a 44px form sticks only inside the form — and a walk of the
 * other states found the card's × under the railway button, the annotation
 * sheet's close under the stations button, and the plane strip over the ⓘ and
 * the key's own fold. Each had been placed by its own rule; `dockPanels` in
 * map.js now places them all by one.
 *
 * This walks the states that put things at the foot of a phone — the key
 * opened, a card, the card opened out, the plane strip, the train strip, the
 * annotation sheet, and every dialog at the top, middle and end of its
 * scroll — at four phone and tablet sizes, and asks two things of each:
 *
 *   1. **Every control that is showing can be pressed.** It is inside the
 *      screen, and a finger at its middle and at four points inset from its
 *      corners lands on it and not on something drawn over it. A control the
 *      dock has stood down is not showing and is not asked about.
 *   2. **No two floating panels share any ground.** Measured button by button
 *      for the three columns, since a column's box is mostly gaps.
 *
 * A pop-up menu is allowed to cover what it hangs off; it closes on the next
 * tap. Everything else is not. **A new floating panel belongs in `CONTROLS`
 * and `PANELS` below, and in `DOCK_*` in map.js.**
 *
 * With a finger, not a mouse: the phone layout is what is being measured, and
 * `open(…, { touch: true })` gives it the viewport and the touch events. */
'use strict';
const zlib = require('zlib');
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const SIZES = [[390, 664], [360, 560], [740, 340], [768, 1000]];

const CONTROLS = ['#bar button', '#zoom-controls > button', '#map-extras > button',
  '#corner-controls > button', '#legend .legend-head', '#info-close',
  '#info:not(.open) .more', '#train-bar button', '#train-bar input',
  '.air-bar button', '.air-bar input', '#annotate .ann-head button',
  '#ann-clock button', '#ann-edit', '#cen-back', '#tbl-col', '.tbl-pc', '#tbl-flag', '#tbl-menu-btn', '.tbl-step'].join(', ');
const PANELS = ['#legend', '#info', '#train-bar', '#air-bar', '#annotate',
  '#ann-clock', '#ann-edit', '#cen-back', '#tbl-bar', '#tbl-flag'];
const COLUMNS = ['#zoom-controls', '#map-extras', '#corner-controls'];

/* Run in the page. Returns one line per fault; none is a pass. */
const AUDIT = (CONTROLS, PANELS, COLUMNS) => {
  const W = window.innerWidth, H = window.innerHeight;
  const shows = el => {
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (el.closest('.docked-away')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = el => el.id ? '#' + el.id
    : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className
      ? '.' + el.className.split(' ')[0] : '')
      + (el.textContent.trim() ? '「' + el.textContent.trim().slice(0, 12) + '」' : '');
  const faults = [];
  const modal = document.querySelector('dialog[open]');
  const controls = modal
    ? [...modal.querySelectorAll('form > .x, .table-close')]
    : [...document.querySelectorAll(CONTROLS)];
  for (const el of controls) {
    if (!shows(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5) {
      faults.push('off the screen: ' + name(el) + ' at ' + [r.left, r.top, r.right, r.bottom]
        .map(Math.round).join(','));
      continue;
    }
    const over = new Set();
    for (const [fx, fy] of [[.5, .5], [.2, .2], [.8, .2], [.2, .8], [.8, .8]]) {
      const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
      if (h && h.closest('.pick-menu, #jmap-menu, #tbl-menu')) continue;
      if (!h || !(h === el || el.contains(h))) over.add(h ? name(h.closest('[id]') || h) : 'nothing');
    }
    if (over.size) faults.push('under something: ' + name(el) + ' is under ' + [...over].join(', '));
  }
  if (!modal) {
    const boxes = [];
    for (const s of PANELS.concat(COLUMNS)) {
      const el = document.querySelector(s);
      if (!shows(el)) continue;
      if (COLUMNS.includes(s)) {
        [...el.children].filter(shows)
          .forEach(c => boxes.push([s, name(c), c.getBoundingClientRect()]));
      } else if (['absolute', 'fixed'].includes(getComputedStyle(el).position)) {
        boxes.push([s, s, el.getBoundingClientRect()]);
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [ga, a, ra] = boxes[i], [gb, b, rb] = boxes[j];
        if (ga === gb) continue;
        const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (ix > 1 && iy > 1) faults.push('overlap: ' + a + ' and ' + b + ', '
          + Math.round(ix) + '×' + Math.round(iy) + 'px');
      }
    }
  }
  return faults;
};

/* A finger, down and up with a pause: the map reads pointer events, and a
   synthesised click can arrive without them. */
async function tap(p, x, y) {
  await p.mouse.move(x, y);
  await p.mouse.down();
  await sleep(60);             // a press, not a flick
  await p.mouse.up();
  await sleep(350);            // past the 320 ms double-tap window
  await calm(p);
}
const press = (p, sel) => p.evaluate(s => {
  const e = document.querySelector(s);
  if (e && !e.hidden) e.click();
  return !!e;
}, sel);

(async () => {
  const b = await launch();
  for (const [w, h] of SIZES) {
    const size = w + '×' + h;
    const p = await open(b, null, { touch: true, width: w, height: h });
    const audit = async state => {
      const faults = await p.evaluate(AUDIT, CONTROLS, PANELS, COLUMNS);
      check(size + ' ' + state, faults.length === 0, faults.slice(0, 4).join(' | '));
    };
    const land = () => tap(p, w * 0.3, h * 0.45);   // China, at every size here

    await audit('as it opens');
    await p.evaluate(() => {
      const l = document.getElementById('legend');
      if (l.classList.contains('folded')) l.querySelector('.legend-head').click();
    });
    await calm(p);
    await audit('with the key open');
    await land();
    await audit('with a card');
    await press(p, '#info .more');
    await calm(p);
    await audit('with the card opened out');
    await press(p, '#info-close');
    await calm(p);

    await press(p, '#btn-air');
    await sleep(900);           // the routes fade in
    await calm(p);
    await press(p, '#btn-planes');
    await sleep(1200);          // the strip mounts and the clock starts
    await calm(p);
    await audit('with the plane strip');
    await land();
    await audit('with the plane strip and a card');
    await press(p, '#info-close');
    await press(p, '#btn-planes');
    await press(p, '#btn-air');
    await sleep(600);
    await calm(p);

    await press(p, '#btn-rail');
    await sleep(500);           // the menu opens
    await p.evaluate(() => {
      const i = document.querySelector('#rail-menu input[data-rail-sys]');
      if (i && !i.checked) i.click();
    });
    await sleep(1200);
    await calm(p);
    await audit('with the railway menu');
    await p.evaluate(() => { const m = document.getElementById('rail-menu'); if (m) m.hidden = true; });
    await press(p, '#btn-trains');
    await sleep(1500);          // the timetable is fetched and the strip mounts
    await calm(p);
    await audit('with the train strip');
    await land();
    await audit('with the train strip and a card');
    await press(p, '#info-close');
    await press(p, '#btn-trains');
    await sleep(400);

    await press(p, '#btn-options');
    await press(p, '#ann-create');
    await sleep(600);
    await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    await calm(p);
    await audit('with the annotation sheet');
    await press(p, '#ann-close');
    await calm(p);

    /* The census theme with one language showing: its way back is on the map.
       Its own page, because the book only offers the theme over India. */
    const c = await open(b, '?bbox=66,8,98,36', { touch: true, width: w, height: h });
    const auditC = async state => {
      const faults = await c.evaluate(AUDIT, CONTROLS, PANELS, COLUMNS);
      check(size + ' ' + state, faults.length === 0, faults.slice(0, 4).join(' | '));
    };
    await press(c, '#btn-theme');
    await sleep(700);           // the menu opens, and fetches themes.js the first time
    await c.evaluate(() => {
      const i = [...document.querySelectorAll('#theme-menu input')]
        .find(x => /by Province/.test(x.parentNode.textContent));
      if (i) i.click();
    });
    await c.waitForFunction(() => !!document.querySelector('#thematic .census-area'), { timeout: 30000 });
    await calm(c);
    await c.evaluate(() => {
      const m = document.getElementById('theme-menu');
      if (m) m.hidden = true;
      document.querySelector('#legend .cen-fam .cen-chip').click();
    });
    await calm(c);
    check(size + ' a language is showing, with its way back',
      await c.evaluate(() => { const e = document.getElementById('cen-back'); return !!e && !e.hidden; }));
    await auditC('with a language mapped');
    await c.evaluate(() => {
      const l = document.getElementById('legend');
      if (l.classList.contains('folded')) l.querySelector('.legend-head').click();
    });
    await calm(c);
    await auditC('with a language mapped and the key open');
    await press(c, '#info .more');
    await calm(c);
    await auditC('with a language mapped and the card opened out');
    await c.close();

    /* A table from the address, with its dropdown over the map. */
    const payload = zlib.deflateRawSync(Buffer.from(JSON.stringify({
      v: 1, units: 'prefecture', src: { url: 'https://example.org/' }, title: { en: 'A table' },
      cols: [{ name: 'A rather long column heading as it was printed — second level', kind: 'count', pc: true }, { name: 'B', kind: 'rate' }],
      rows: [{ id: '13', v: [1, 2] }, { id: '27', v: [3, 4] }],
    }))).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const k = await open(b, '?where=125.41,21.53,147.92,48.77&layers=2w#t=' + payload, { touch: true, width: w, height: h });
    await k.waitForFunction(() => !!document.getElementById('tbl-col'), { timeout: 30000 });
    await calm(k);
    const auditK = async state => {
      const faults = await k.evaluate(AUDIT, CONTROLS, PANELS, COLUMNS);
      check(size + ' ' + state, faults.length === 0, faults.slice(0, 4).join(' | '));
    };
    await auditK('with a table from the address');
    await press(k, '#info .more');
    await calm(k);
    await auditK('with a table and the card opened out');
    await k.close();

    /* And one with many columns, its menu folded and open. */
    const many = zlib.deflateRawSync(Buffer.from(JSON.stringify({
      v: 1, units: 'prefecture', src: { url: 'https://example.org/' }, title: { en: 'Many' },
      cols: Array.from({ length: 30 }, (x, i) => ({ name: 'Group ' + (i % 3) + ' — Column ' + i, kind: 'count', pc: true })),
      rows: [{ id: '13', v: Array(30).fill(1) }, { id: '27', v: Array(30).fill(2) }],
    }))).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const n = await open(b, '?where=125.41,21.53,147.92,48.77&layers=2w#t=' + many, { touch: true, width: w, height: h });
    await n.waitForFunction(() => !!document.getElementById('tbl-menu-btn'), { timeout: 30000 });
    await calm(n);
    const auditN = async state => {
      const faults = await n.evaluate(AUDIT, CONTROLS, PANELS, COLUMNS);
      check(size + ' ' + state, faults.length === 0, faults.slice(0, 4).join(' | '));
    };
    await auditN('with many columns');
    await press(n, '#tbl-menu-btn');
    await calm(n);
    await auditN('with many columns and the menu open');
    const menu = await n.evaluate(() => {
      const r = document.getElementById('tbl-menu').getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: innerWidth, h: innerHeight };
    });
    check(size + ' the open menu is on the screen', menu.l >= 0 && menu.r <= menu.w && menu.t >= 0 && menu.b <= menu.h, JSON.stringify(menu));
    await n.close();

    /* Every dialog, whether or not this width has a button for it: About's
       button is gone on a phone but the dialog is still in the page. */
    const dialogs = await p.evaluate(() => [...document.querySelectorAll('dialog')].map(d => d.id));
    for (const id of dialogs) {
      await p.evaluate(i => {
        const d = document.getElementById(i);
        /* The layer note fills itself when its button is pressed; the printed
           timetable is empty until a train asks for it, and is asked about
           only for its close. */
        if (i === 'dlg-layer-info') { const t = document.getElementById('btn-layer-info'); if (t && !t.hidden) { t.click(); return; } }
        d.showModal();
      }, id);
      await sleep(250);         // the sheet rises
      for (const [at, where] of [[0, 'at the top'], [0.5, 'half way down'], [1, 'at the end']]) {
        await p.evaluate(f => {
          const d = document.querySelector('dialog[open]');
          if (d) d.scrollTop = (d.scrollHeight - d.clientHeight) * f;
        }, at);
        await sleep(120);       // a scroll lands on the next frame
        await audit('#' + id + ' ' + where);
      }
      await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    }
    await p.close();
  }
  const failed = report();
  await b.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
