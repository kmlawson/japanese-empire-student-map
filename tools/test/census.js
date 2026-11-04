/* The 1931 census language maps, as two thematic layers.
 *
 *     node tools/test/census.js          # needs a server on 8123
 *
 * From Languages of India, 1931: `tools/build_census.py` writes the figures
 * and the geometry, `theme-census.js` draws them and answers in the info pane.
 * What is guarded:
 *
 *   * the book offers both, under their names and sources;
 *   * **every figure on the screen is the source's**: read here from
 *     data/india-language-1931/ on its own, and compared;
 *   * every vertex the source published is drawn, and neighbours keep one
 *     shared line;
 *   * largest language, one label per contiguous block, none on another, at
 *     more than one zoom (a label is in SCREEN pixels at every zoom);
 *   * the hover and the card name the unit, not the country, and the hover
 *     still answers where this map's coast and the census's differ;
 *   * a language from the key or a card recolours the map and gets its own
 *     card; a group of the classification maps the whole group;
 *   * Burma's coarse tables and Gwalior's damaged pages stay grey, and the card
 *     says why; the Hindi composite is on offer;
 *   * every table opens from the card, sorts, filters, offers a CSV carrying
 *     its source, and takes numbers rather than the screen's strings;
 *   * **the link to the full site is at the foot of every card** while the
 *     theme is up, a city's included, and gone when it is not;
 *   * off puts the map back, one theme to another, panning away stands it down;
 *   * under another projection the hover still finds the right unit;
 *   * with a finger: a first tap gets the unit, `More` the rest, the table opens.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const FULL_SITE = 'https://kmlawson.github.io/playground-india-language/';
const SRC = path.join(__dirname, '..', '..', 'data', 'india-language-1931');

function readSource(name, v) {
  const raw = fs.readFileSync(path.join(SRC, name), 'utf8');
  const start = raw.indexOf('=', raw.indexOf('window.' + v)) + 1;
  return (0, eval)('(' + raw.slice(start).trim().replace(/;\s*$/, '') + ')');
}
const CENSUS = readSource('census.js', 'CENSUS');
const DIST = readSource('districts.js', 'DISTRICTS');
const fmt = n => Number(n).toLocaleString('en-US');

const screenAt = (p, lon, lat) => p.evaluate((lon, lat) => {
  const q = window.JMAP_GEO.project(lon, lat);
  const m = document.querySelector('#jmap').getScreenCTM();
  return { x: m.a * q.x + m.c * q.y + m.e, y: m.b * q.x + m.d * q.y + m.f };
}, lon, lat);

async function choose(p, re) {
  await p.evaluate(() => {
    const m = document.getElementById('theme-menu');
    if (!m || m.hidden) document.getElementById('btn-theme').click();
  });
  await sleep(700);              // the menu opens, and fetches themes.js the first time
  await p.evaluate(re => {
    const i = [...document.querySelectorAll('#theme-menu input')]
      .find(x => new RegExp(re).test(x.parentNode.textContent));
    if (i) i.click();
  }, re);
  await p.waitForFunction(re => {
    const t = document.getElementById('thematic');
    return re === '^Off$' ? !t : !!t && !!t.querySelector('.census-area');
  }, { timeout: 30000 }, re).catch(() => {});
  await calm(p);
}

async function hoverOn(p, lon, lat) {
  const at = await screenAt(p, lon, lat);
  await p.mouse.move(at.x - 3, at.y - 3);
  await p.mouse.move(at.x, at.y, { steps: 3 });
  await sleep(350);              // the hover's own delay before the box
  return p.evaluate(() => {
    const t = document.getElementById('tooltip');
    return { hidden: t.hidden, unit: (t.querySelector('.theme-unit') || {}).textContent || '',
      text: t.textContent, hot: !!document.querySelector('#thematic .theme-hot') };
  });
}

async function pressOn(p, lon, lat) {
  const at = await screenAt(p, lon, lat);
  await p.mouse.click(at.x, at.y);
  await sleep(400);              // past the double-click window
  await calm(p);
}

const cardText = p => p.evaluate(() => document.getElementById('info').innerText);
const cardHead = p => p.evaluate(() => ({
  chip: document.querySelector('#info .chip').textContent,
  primary: document.querySelector('#info .primary').textContent,
  open: !document.getElementById('info').hidden,
}));
const footLink = p => p.evaluate(() => {
  const f = document.getElementById('info-theme-foot');
  const a = f && f.querySelector('a');
  return { shown: !!f && !f.hidden && getComputedStyle(f).display !== 'none', href: a ? a.href : '' };
});
const fillOf = (p, unit) => p.evaluate(unit => {
  const e = document.querySelector('#thematic path[data-unit="' + unit + '"]');
  return e ? getComputedStyle(e).fill : '';
}, unit);
const pressButton = (p, sel, re) => p.evaluate((sel, re) => {
  const b = [...document.querySelectorAll(sel)].find(x => new RegExp(re).test(x.textContent));
  if (b) b.click();
  return !!b;
}, sel, re);

/* The way back on the map: there only while a language shows, a real press
   works and does not fall through to the unit under it, and it stays put when
   the map moves. Mouse and finger, and more than one zoom. */
async function checkBackButton(b, who, opts) {
  const p = await open(b, '?bbox=76,18,84,26', opts);
  await choose(p, 'by Province');
  const box = () => p.evaluate(() => {
    const e = document.getElementById('cen-back');
    if (!e || e.hidden) return null;
    const r = e.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const m = document.getElementById('map-container').getBoundingClientRect();
    return { x, y, h: r.height, left: r.left, right: r.right, top: r.top, off: r.left + r.width / 2 - (m.left + m.width / 2),
      vis: getComputedStyle(e).visibility, onTop: document.elementFromPoint(x, y) === e };
  });
  const showLang = async () => {
    await p.evaluate(() => document.querySelector('#legend .cen-fam .cen-chip').click());
    await calm(p);
  };
  check(who + ': no button on the largest language', !(await box()));
  await showLang();
  const on = await box();
  check(who + ': a language brings it up, big enough to press', !!on && on.vis === 'visible' && on.h >= 40, JSON.stringify(on));
  check(who + ':   on top, on the screen', on.onTop && on.left >= 0 && on.right <= opts.width && on.top >= 0, JSON.stringify(on));
  if (opts.width > 600) check(who + ':   centred on the map', Math.abs(on.off) < 1, String(on.off));

  await p.mouse.move(on.x, on.y);
  await p.mouse.down();
  await sleep(60);               // a press, not a flick
  await p.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(p);
  const after = await p.evaluate(() => ({
    ramp: !!document.querySelector('#legend .cen-ramp'),
    fam: !!document.querySelector('#legend .cen-fam'),
    sel: !!document.querySelector('#thematic .census-area.sel'),
  }));
  check(who + ': pressing it goes back to the largest language', !after.ramp && after.fam, JSON.stringify(after));
  check(who + ':   and selects nothing underneath', !after.sel, JSON.stringify(after));
  check(who + ':   and it goes away', !(await box()));
  // the map answers by position, not by the element under the pointer, so ask
  // it: the same press with the button gone must select the unit it was over
  await p.mouse.move(on.x, on.y);
  await p.mouse.down();
  await sleep(60);               // a press, not a flick
  await p.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(p);
  check(who + ':   though there is a unit under it to select',
    await p.evaluate(() => !!document.querySelector('#thematic .census-area.sel')));

  await showLang();
  const before = await box();
  await p.mouse.move(opts.width * 0.5, opts.height * 0.5);
  await p.mouse.down();
  await p.mouse.move(opts.width * 0.4, opts.height * 0.42, { steps: 4 });
  await p.mouse.up();
  await calm(p);
  await p.evaluate(() => document.getElementById('zoom-in').click());
  await calm(p);
  const moved = await box();
  check(who + ': it stays put when the map pans and zooms',
    !!moved && Math.abs(moved.x - before.x) < 1 && Math.abs(moved.y - before.y) < 1 && moved.vis === 'visible', JSON.stringify([before, moved]));

  await choose(p, '^Off$');
  check(who + ': the theme going takes it too', await p.evaluate(() => !document.getElementById('cen-back')));
  await p.close();
}

async function csvOf(p) {
  return p.evaluate(() => new Promise(resolve => {
    const realBlob = window.Blob, realURL = URL.createObjectURL;
    let caught = '';
    window.Blob = function (parts, opts) { caught = String(parts[0]); return new realBlob(parts, opts); };
    URL.createObjectURL = function () { return 'blob:stub'; };
    document.querySelector('#dlg-table .pop-csv').click();
    window.Blob = realBlob;
    URL.createObjectURL = realURL;
    resolve(caught);
  }));
}
const closeTable = async p => {
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(60);               // the close event, which empties the box, is its own task
};
const tableRows = p => p.evaluate(() => [...document.querySelectorAll('#dlg-table tbody tr')].map(tr => tr.textContent));

(async () => {
  const b = await launch();

  console.log('\n— the book offers both —');
  const p = await open(b, '?bbox=60,6,102,38', { width: 1400, height: 950 });
  await p.evaluate(() => document.getElementById('btn-theme').click());
  await sleep(900);              // the menu, and themes.js on the first press
  const rows = await p.evaluate(() => [...document.querySelectorAll('#theme-menu label')]
    .map(l => l.textContent.trim()));
  check('by province, with its source',
    rows.includes('1931 Census Languages of India, by Province (Census of India, 1931, Vol. I, Table XV)'),
    JSON.stringify(rows));
  check('by district, with its source',
    rows.includes('1931 Census Languages of India, by District (Census of India, 1931, provincial and state volumes, Table XV)'),
    JSON.stringify(rows));
  check('the two that were there are still there',
    rows.some(r => /Administration Map of Burma/.test(r)) && rows.some(r => /Military Divisions/.test(r)),
    JSON.stringify(rows));
  await p.evaluate(() => document.getElementById('btn-theme').click());
  await choose(p, 'by Province');

  console.log('\n— by province: what it draws —');
  const prov = await p.evaluate(() => {
    const g = document.getElementById('thematic');
    const a = [...g.querySelectorAll('.census-area')];
    return { n: a.length, under: g.querySelectorAll('.census-under').length,
      verts: a.reduce((s, e) => s + (e.getAttribute('d').match(/[ML]/g) || []).length, 0),
      fill: getComputedStyle(a[0]).fillRule };
  });
  check('35 units and the five areas outside the table', prov.n === 40, prov.n);
  const srcGeo = readSource('geo.js', 'GEO');
  const count = d => (d.match(/[ML]/g) || []).length;
  const srcVerts = Object.values(srcGeo.units).concat(Object.values(srcGeo.extra))
    .reduce((s, u) => s + count(u.d), 0);
  check('every vertex the source published is drawn', prov.verts === srcVerts,
    prov.verts + ' of ' + srcVerts);
  check('holes by even-odd, as the source draws them', prov.fill === 'evenodd', prov.fill);
  check('standing on the map\'s own India, so no frontier gap shows the British colour',
    prov.under >= 3, prov.under);
  const state0 = await p.evaluate(() => ({
    admin: document.querySelector('#layer-seg [data-cat="territory"]').getAttribute('aria-pressed'),
  }));
  check('the Administrative layer is left alone', state0.admin === 'false', JSON.stringify(state0));

  console.log('\n— by province: the opening card and the key —');
  const over = await cardHead(p);
  check('choosing it opens a card saying what it is',
    over.open && over.chip === '1931 Census' && /by Province/.test(over.primary), JSON.stringify(over));
  const leadWH = CENSUS.langs.find(l => l.name === 'Western Hindi').v.INDIA[0];
  check('with the largest languages, in the source\'s figures',
    (await cardText(p)).includes(fmt(leadWH)), fmt(leadWH));
  let f = await footLink(p);
  check('the full site at its foot', f.shown && f.href === FULL_SITE, JSON.stringify(f));
  const chips = await p.evaluate(() => [...document.querySelectorAll('#legend .cen-chip')].map(c => c.textContent));
  check('the key offers the languages that lead a unit',
    ['Bengali', 'Tamil', 'Burmese', 'Telugu'].every(n => chips.includes(n)), chips.join(', '));
  const keyTop = await p.evaluate(() => {
    const body = document.getElementById('legend-body');
    return !!body && body.firstElementChild.querySelector('.cen-key') !== null;
  });
  check('  first in the key, not under the fold', keyTop);

  console.log('\n— by province: the names, at more than one zoom —');
  const labels = pg => pg.evaluate(() => [...document.querySelectorAll('#thematic .theme-label')]
    .filter(t => t.style.display !== 'none').map(t => {
      const r = t.getBoundingClientRect();
      return { t: t.textContent, box: [r.left, r.top, r.right, r.bottom], h: r.height };
    }));
  const overlapCount = l => l.filter((a, i) => l.some((o, j) => j !== i
    && a.box[0] < o.box[2] && o.box[0] < a.box[2] && a.box[1] < o.box[3] && o.box[1] < a.box[3])).length;
  const lab0 = await labels(p);
  check('one for each block of a language', lab0.some(l => l.t === 'Bengali') && lab0.some(l => l.t === 'Tamil'),
    lab0.map(l => l.t).join(', '));
  check('  none on another at the opening view', overlapCount(lab0) === 0, overlapCount(lab0) + ' overlapping');
  const z = await open(b, '?bbox=84,20,94,28', { width: 1000, height: 800 });
  await choose(z, 'by Province');
  const lab1 = await labels(z);
  check('  none on another close in', overlapCount(lab1) === 0, overlapCount(lab1) + ' overlapping');
  const h0 = Math.max(...lab0.map(l => l.h)), h1 = Math.max(...lab1.map(l => l.h));
  check('  and the same size on screen at both zooms', Math.abs(h0 - h1) < 2, h0 + ' and ' + h1);
  const hClose = await hoverOn(z, 88.5, 24);
  check('  and the hover still finds Bengal close in', hClose.unit === 'Bengal', JSON.stringify(hClose));
  await z.close();

  console.log('\n— by province: the hover and the card —');
  const beng = CENSUS.units['5'];
  const bengali = CENSUS.langs.find(l => l.name === 'Bengali');
  const hov = await hoverOn(p, 88.5, 24);
  check('the hover leads with the unit and outlines it', hov.unit === beng.short && hov.hot, JSON.stringify(hov));
  check('  and says what leads there', /Bengali: 93%/.test(hov.text), hov.text);
  await pressOn(p, 88.5, 24);
  let head = await cardHead(p);
  check('a click opens the unit, not British India', head.primary === beng.name, JSON.stringify(head));
  const bc = await cardText(p);
  check('  with its population, as printed', bc.includes(fmt(beng.pop[0])), bc.slice(0, 160));
  check('  and its languages, as printed', bc.includes(fmt(bengali.v['5'][0])), fmt(bengali.v['5'][0]));
  f = await footLink(p);
  check('  and the full site at its foot', f.shown && f.href === FULL_SITE, JSON.stringify(f));
  const selOutline = await p.evaluate(() => {
    const s = document.querySelector('#thematic path.census-area.sel');
    return s ? s.getAttribute('data-unit') : '';
  });
  check('  and it stays outlined', selOutline === '5', selOutline);

  console.log('\n— by province: one language —');
  const leadFill = await fillOf(p, '5');
  await pressButton(p, '#info-trains .cen-bar', 'Eastern Hindi');
  await calm(p);
  const lang1 = await p.evaluate(() => ({
    title: (document.querySelector('#legend .cen-key-title') || {}).textContent,
    ramp: !!document.querySelector('#legend .cen-ramp'),
    now: (document.querySelector('#info-trains .cen-now') || {}).textContent,
    primary: document.querySelector('#info .primary').textContent,
    on: (document.querySelector('#info-trains .cen-bar.on .nm') || {}).textContent,
  }));
  check('a language on a unit\'s card maps it, and the key says so',
    /^Eastern Hindi: speakers as %/.test(lang1.title) && lang1.ramp, JSON.stringify(lang1));
  check('  the card stays on the unit, with the row lit and the share here',
    lang1.primary === beng.name && lang1.on === 'Eastern Hindi' && /3\.2% here/.test(lang1.now), JSON.stringify(lang1));
  check('  and the colour changed', (await fillOf(p, '5')) !== leadFill);
  const pctLabels = (await labels(p)).filter(l => /%$/.test(l.t)).length;
  check('  and the names are its shares now', pctLabels > 5, pctLabels);
  await pressButton(p, '#info-trains .cen-now button', 'About it');
  await calm(p);
  const langCard = await cardText(p);
  const eh = CENSUS.langs.find(l => l.name === 'Eastern Hindi');
  check('its own card gives the figure for India', langCard.includes(fmt(eh.v.INDIA[0])), fmt(eh.v.INDIA[0]));
  f = await footLink(p);
  check('  with the full site at its foot too', f.shown && f.href === FULL_SITE, JSON.stringify(f));
  const scanned = await p.evaluate(() => [...document.querySelectorAll('#info-trains .pop-src a')].map(a => a.href));
  check('  and a link to its page scan', scanned.some(h => /archive\.org\/details\/india\.history\.resource\.92539\/page\/n\d+/.test(h)),
    JSON.stringify(scanned));
  check('  and it offers to map the group it belongs to', /Map the whole of/.test(langCard), langCard.slice(0, 200));
  await pressButton(p, '#info-trains .cen-path button', 'Indo-European Family');
  await calm(p);
  head = await cardHead(p);
  check('  which maps it', /Indo-European Family/.test(head.primary), head.primary);
  await pressButton(p, '#info-trains .cen-now button', 'largest language');
  await calm(p);
  const backKey = await p.evaluate(() => !document.querySelector('#legend .cen-ramp')
    && !!document.querySelector('#legend .cen-fam'));
  check('and it goes back to the largest language', backKey && (await fillOf(p, '5')) === leadFill);

  console.log('\n— by province: the tables —');
  await pressOn(p, 88.5, 24);
  await pressButton(p, '#info-trains .pop-more', 'languages here');
  await sleep(300);              // the dialog opens
  const t1 = await tableRows(p);
  const srcReturns = CENSUS.langs.filter(l => !l.kids.length && l.v['5'] && l.v['5'][0] > 0);
  check('every language returned in Bengal, and the whole', t1.length === srcReturns.length + 1,
    t1.length + ' for ' + srcReturns.length);
  const csv = await csvOf(p);
  check('the CSV opens as UTF-8 in Excel', csv.charCodeAt(0) === 0xFEFF, csv.charCodeAt(0));
  const lines = csv.split('\n');
  check('the CSV starts with the title and the columns',
    /Mother tongues in Bengal, 1931/.test(lines[0]) && /^Language,Persons,Males,Females/.test(lines[1]), lines.slice(0, 2).join(' / '));
  check('  writes the figures, not the screen',
    lines.some(l => l.startsWith('Bengali,' + bengali.v['5'][0] + ',' + bengali.v['5'][1] + ',' + bengali.v['5'][2])),
    lines[3]);
  check('  and carries its source', lines.some(l => /^Source,.*Census of India, 1931.*playground-india-language/.test(l)),
    lines.slice(-3).join(' / '));
  await p.evaluate(() => { const i = document.querySelector('#dlg-table .cen-filter'); i.value = 'dravid'; i.dispatchEvent(new Event('input')); });
  const filtered = await tableRows(p);
  check('the filter narrows it by family', filtered.length > 1 && filtered.length < t1.length && filtered.some(r => /Tamil/.test(r)),
    filtered.length + ' of ' + t1.length);
  const csv2 = await csvOf(p);
  check('  and the CSV is still every row', csv2.split('\n').filter(l => l && !/^(Note|Source),/.test(l)).length === lines.filter(l => l && !/^(Note|Source),/.test(l)).length);
  await p.evaluate(() => { const i = document.querySelector('#dlg-table .cen-filter'); i.value = ''; i.dispatchEvent(new Event('input')); });
  const sortBy = await p.evaluate(() => {
    const heads = [...document.querySelectorAll('#dlg-table thead button')];
    heads[0].click();
    return [...document.querySelectorAll('#dlg-table tbody tr th')].slice(1, 3).map(x => x.textContent);
  });
  check('a head sorts it, the whole stays at the top', sortBy[0].localeCompare(sortBy[1]) <= 0, sortBy.join(' / '));
  await pressButton(p, '#dlg-table .pop-pick', '^Tamil$');
  await calm(p);
  const afterPick = await p.evaluate(() => ({ open: document.getElementById('dlg-table').open,
    title: (document.querySelector('#legend .cen-key-title') || {}).textContent,
    primary: document.querySelector('#info .primary').textContent }));
  check('a row maps that language and closes the table',
    !afterPick.open && /^Tamil/.test(afterPick.title) && afterPick.primary === beng.name, JSON.stringify(afterPick));
  await pressButton(p, '#info-trains .cen-now button', 'About it');
  await calm(p);
  await pressButton(p, '#info-trains .pop-more', 'In every');
  await sleep(300);              // the dialog opens
  const t2 = await tableRows(p);
  const tamil = CENSUS.langs.find(l => l.name === 'Tamil');
  check('a language in every province, India first',
    /^India/.test(t2[0]) && t2[0].includes(fmt(tamil.v.INDIA[0])) && t2.length === 36, t2.length + ': ' + t2[0]);
  await closeTable(p);
  await pressButton(p, '#info-trains .pop-more', 'Second languages');
  await sleep(300);              // the dialog opens
  const t3 = await p.evaluate(() => ({ title: document.querySelector('#dlg-table .pop-head').textContent,
    n: document.querySelectorAll('#dlg-table tbody tr').length,
    scan: [...document.querySelectorAll('#dlg-table .pop-src a')].map(a => a.href) }));
  check('its second languages, Part II, with the page', /Second languages of Tamil/.test(t3.title) && t3.n > 2
    && t3.scan.some(h => /archive\.org/.test(h)), JSON.stringify(t3));
  await closeTable(p);
  await pressButton(p, '#info-trains .cen-now button', 'largest language');
  await calm(p);

  console.log('\n— by province: what has no figures —');
  await pressOn(p, 72.4, 35.3);
  const nw = await cardText(p);
  check('the frontier agencies say it is garrisons', /garrisons, posts and cantonments/.test(nw), nw.slice(0, 200));
  const nwFill = await fillOf(p, '29');
  check('  and are grey', /220, 216, 207|53, 61, 70/.test(nwFill), nwFill);

  console.log('\n— the foot of a card that is not the theme\'s —');
  // Nepal: on the map, not in the census, so the country answers for itself
  await pressOn(p, 84.0, 28.3);
  const nepal = await cardHead(p);
  f = await footLink(p);
  check('a place the census did not draw opens its own card, with the link',
    nepal.open && nepal.chip !== '1931 Census' && f.shown && f.href === FULL_SITE, JSON.stringify({ nepal, f }));
  await choose(p, 'Military');
  const mil = await p.evaluate(() => document.getElementById('thematic').getAttribute('data-theme'));
  check('another theme takes this one\'s place', mil === 'india-military', mil);
  const milStill = await hoverOn(p, 74.3, 31.5);
  check('  and the military divisions still answer as they did', milStill.unit === 'Lahore District', JSON.stringify(milStill));
  await pressOn(p, 74.3, 31.5);
  f = await footLink(p);
  check('  with no link on their cards', !f.shown, JSON.stringify(f));
  await p.evaluate(() => document.getElementById('info-close').click());

  console.log('\n— by district —');
  await choose(p, 'by District');
  const dist = await p.evaluate(() => {
    const g = document.getElementById('thematic');
    const a = [...g.querySelectorAll('.census-area')];
    return { n: a.length, prov: g.querySelectorAll('.census-prov').length,
      verts: a.reduce((s, e) => s + (e.getAttribute('d').match(/[ML]/g) || []).length, 0) };
  });
  check('349 units and 24 province outlines', dist.n === 349 && dist.prov === 24, JSON.stringify(dist));
  const srcD = DIST.units.reduce((s, u) => s + count(u.d), 0);
  check('every vertex the source published is drawn', dist.verts === srcD, dist.verts + ' of ' + srcD);
  const luck = DIST.units.findIndex(u => u.names31.includes('Lucknow'));
  const hd = await hoverOn(p, 80.9, 26.85);
  check('the hover names the unit and what leads there', hd.unit === 'Lucknow' && /Hindustani, Hindi or Urdu/.test(hd.text),
    JSON.stringify(hd));
  await pressOn(p, 80.9, 26.85);
  head = await cardHead(p);
  check('a click opens it', head.primary === 'Lucknow', JSON.stringify(head));
  const lc = await cardText(p);
  check('  with its population, as printed', lc.includes(fmt(DIST.units[luck].pop[0])), fmt(DIST.units[luck].pop[0]));
  f = await footLink(p);
  check('  and the full site at its foot', f.shown && f.href === FULL_SITE, JSON.stringify(f));
  await pressButton(p, '#info-trains .pop-more', 'languages here');
  await sleep(300);              // the dialog opens
  const dt = await tableRows(p);
  check('every language returned there, and the whole',
    dt.length === Object.values(DIST.units[luck].vals).filter(v => v[0] > 0).length + 1, dt.length);
  const dcsv = (await csvOf(p)).split('\n');
  check('  and the CSV carries its source', dcsv.some(l => /^Source,.*provincial and state volumes/.test(l)), dcsv.slice(-2).join(' / '));
  await closeTable(p);
  await pressButton(p, '#info-trains .pop-more', 'area');
  await sleep(300);              // the dialog opens
  const scans = await p.evaluate(() => [...document.querySelectorAll('#dlg-table tbody a')].map(a => a.href));
  check('its 1931 areas, with links to the scans', scans.length > 0 && scans.every(h => /archive\.org\/details\/.+\/page\/n\d+/.test(h)),
    scans.slice(0, 2).join(' '));
  await closeTable(p);

  console.log('\n— by district: the cautions —');
  // the source's own test for a page too damaged to map: its docs/regional.md, 9
  const damaged = DIST.units.findIndex(u => {
    const S = Object.values(u.vals).reduce((a, v) => a + v[0], 0);
    const P = Math.max(u.pop[0] || 0, S);
    return u.status === 'ok' && P && S / P < 0.8;
  });
  const grey = await fillOf(p, String(damaged));
  check('a district whose pages are damaged is grey (' + DIST.units[damaged].names31.join(', ') + ')',
    /220, 216, 207|53, 61, 70/.test(grey), grey);
  const noData = DIST.units.findIndex(u => u.status !== 'ok');
  check('  and so is ground the census did not count', /220, 216, 207|53, 61, 70/.test(await fillOf(p, String(noData))));
  await pressOn(p, 74.0, 15.4);
  const goa = await cardText(p);
  check('its card says why', /Portuguese India in 1931/.test(goa), goa.slice(0, 140));
  f = await footLink(p);
  check('  and has the link', f.shown, JSON.stringify(f));
  await pressButton(p, '#legend .cen-chip', 'Hindi composite');
  await calm(p);
  head = await cardHead(p);
  check('the Hindi composite is on offer', /Hindustani \+ Western Hindi/.test(head.primary), head.primary);
  const burma = DIST.units.findIndex(u => u.coarse);
  check('  and Burma, whose tables give groups, is grey for it', /220, 216, 207|53, 61, 70/.test(await fillOf(p, String(burma))));
  await pressButton(p, '#info-trains .pop-more', 'In every');
  await sleep(300);              // the dialog opens
  const everyU = await tableRows(p);
  check('  and is left out of its table', everyU.length > 250 && everyU.length < 330, everyU.length);
  await closeTable(p);
  await pressButton(p, '#info-trains .cen-now button', 'largest language');
  await calm(p);
  await pressButton(p, '#info-trains .pop-more', 'All map units');
  await sleep(300);              // the dialog opens
  const allU = await tableRows(p);
  check('every map unit with figures, in one table', allU.length > 300, allU.length);
  await closeTable(p);

  console.log('\n— off, and panned away —');
  await choose(p, '^Off$');
  const off = await p.evaluate(() => ({ t: !!document.getElementById('thematic'),
    card: !document.getElementById('info').hidden,
    foot: !document.getElementById('info-theme-foot').hidden,
    key: !!document.querySelector('#legend .cen-key') }));
  check('off takes the layer, its card, its link and its key', !off.t && !off.card && !off.foot && !off.key, JSON.stringify(off));
  await pressOn(p, 88.5, 24);
  head = await cardHead(p);
  check('  and a click there answers for the country again', head.chip !== '1931 Census' && head.open, JSON.stringify(head));
  await p.evaluate(() => document.getElementById('info-close').click());

  const away = await open(b, '?bbox=60,6,102,38', { width: 1000, height: 800 });
  await choose(away, 'by Province');
  // well away to the east, out over the Pacific: a drag at a time
  for (let i = 0; i < 6; i++) {
    await away.mouse.move(600, 400);
    await away.mouse.down();
    await away.mouse.move(40, 400, { steps: 4 });
    await away.mouse.up();
    await calm(away);
    if (!(await away.evaluate(() => !!document.getElementById('thematic')))) break;
  }
  const gone = await away.evaluate(() => ({ t: !!document.getElementById('thematic'),
    card: !document.getElementById('info').hidden, btn: document.getElementById('btn-theme').hidden }));
  check('panned off its ground it stands down, and takes its card', !gone.t && !gone.card, JSON.stringify(gone));
  await away.close();

  console.log('\n— the note, and the other date —');
  const n = await open(b, '?bbox=60,6,102,38', { width: 1200, height: 900 });
  await choose(n, 'by Province');
  await n.evaluate(() => document.getElementById('btn-layer-info').click());
  await sleep(300);              // the dialog opens
  const noteP = await n.evaluate(() => {
    const e = document.querySelector('[data-layer-info="theme-india-census-province"]');
    return e ? { text: e.textContent.replace(/\s+/g, ' '), links: [...e.querySelectorAll('a')].map(a => a.href) } : null;
  });
  check('the layer note gives the source, linked', !!noteP && /Census of India, 1931/.test(noteP.text)
    && noteP.links.includes(FULL_SITE), JSON.stringify(noteP));
  await closeTable(n);
  await n.evaluate(() => document.querySelector('[data-epoch="e1942"]').click());
  await calm(n);
  const later = await n.evaluate(() => ({
    t: !!document.querySelector('#thematic .census-area'),
    under: document.querySelectorAll('#thematic .census-under').length,
    key: !!document.querySelector('#legend .cen-key'),
    foot: !document.getElementById('info-theme-foot').hidden,
  }));
  check('it stays up on the December 1942 map, with its key and its link',
    later.t && later.key && later.foot, JSON.stringify(later));
  const n42 = await hoverOn(n, 88.5, 24);
  check('  and the hover still answers', n42.unit === CENSUS.units['5'].short, JSON.stringify(n42));
  await n.close();

  console.log('\n— under another projection —');
  const q = await open(b, '?bbox=60,6,102,38', { width: 1200, height: 900 });
  await q.evaluate(() => document.querySelector('#btn-options').click());
  await sleep(400);              // the dialog opens
  await q.evaluate(() => { const r = document.querySelector('#proj-albers');
    r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); });
  await calm(q);
  await q.evaluate(() => { const d = document.querySelector('#dlg-options'); if (d && d.open) d.close(); });
  await calm(q);
  await choose(q, 'by Province');
  const qh = await hoverOn(q, 78.5, 17.5);
  check('the hover finds Hyderabad', qh.unit === CENSUS.units['25'].short, JSON.stringify(qh));
  await pressOn(q, 78.5, 17.5);
  const qc = await cardHead(q);
  check('  and a click opens it', qc.primary === CENSUS.units['25'].name, JSON.stringify(qc));
  const qLab = await q.evaluate(() => {
    const t = [...document.querySelectorAll('#thematic .theme-label')].find(x => x.textContent === 'Telugu');
    if (!t || t.style.display === 'none') return false;
    const r = t.getBoundingClientRect();
    const hit = document.querySelector('#thematic path[data-unit="25"]');
    const pt = document.querySelector('#jmap').createSVGPoint();
    const m = document.querySelector('#jmap').getScreenCTM().inverse();
    pt.x = r.left + r.width / 2; pt.y = r.top + r.height / 2;
    return hit.isPointInFill(pt.matrixTransform(m));
  });
  check('  and the name is on it', qLab === true, qLab);
  await q.close();

  console.log('\n— the way back, on the map —');
  await checkBackButton(b, 'mouse', { width: 1280, height: 800 });
  await checkBackButton(b, 'finger', { touch: true, width: 390, height: 664 });

  console.log('\n— with a finger —');
  const t = await open(b, '?bbox=66,8,98,36', { touch: true, width: 390, height: 664 });
  await choose(t, 'by District');
  const opened = await t.evaluate(() => ({
    open: !document.getElementById('info').hidden,
    body: getComputedStyle(document.getElementById('info-trains')).display,
    foot: getComputedStyle(document.getElementById('info-theme-foot')).display,
  }));
  check('the card opens as the name alone', opened.open && opened.body === 'none' && opened.foot === 'none', JSON.stringify(opened));
  const pt = await screenAt(t, 80.9, 26.85);
  await t.mouse.move(pt.x, pt.y);
  await t.mouse.down();
  await sleep(60);               // a press, not a flick
  await t.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(t);
  head = await cardHead(t);
  check('a first tap names the unit', head.primary === 'Lucknow', JSON.stringify(head));
  await t.evaluate(() => document.querySelector('#info .more').click());
  await sleep(250);              // the sheet opens
  const more = await t.evaluate(() => {
    const f = document.getElementById('info-theme-foot');
    return { body: getComputedStyle(document.getElementById('info-trains')).display,
      foot: getComputedStyle(f).display, bars: document.querySelectorAll('#info-trains .cen-bar').length };
  });
  check('More opens the languages, and the link at the foot',
    more.body !== 'none' && more.foot !== 'none' && more.bars > 3, JSON.stringify(more));
  await pressButton(t, '#info-trains .cen-bar', 'English');
  await calm(t);
  const fingerLang = await t.evaluate(() => (document.querySelector('#info-trains .cen-now') || {}).textContent || '');
  check('a language on the card maps it', /The map shows English/.test(fingerLang), fingerLang);
  await pressButton(t, '#info-trains .pop-more', 'languages here');
  await sleep(300);              // the dialog opens
  const fingerTable = await t.evaluate(() => {
    const d = document.getElementById('dlg-table');
    const r = d.getBoundingClientRect();
    return { open: d.open, w: r.width, rows: d.querySelectorAll('tbody tr').length };
  });
  check('the table opens, and fits', fingerTable.open && fingerTable.w <= 390 && fingerTable.rows > 3, JSON.stringify(fingerTable));
  await t.close();

  const failed = report();
  await b.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
