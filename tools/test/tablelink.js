/* A printed table in the address: `#t=<payload>`, from the statistics site.
 *
 *     node tools/test/tablelink.js        # needs a server on 8123
 *
 * The contract is that site's build/MAPLINK_SPEC.md, version 1. Payloads are built
 * here the way its build/maplinks.py builds them: raw DEFLATE, base64url, no
 * padding. Asked of it: the shading follows the column chosen from the dropdown,
 * islands take their prefecture's colour, the three ways of having no figure stay
 * apart, per capita says which census and leaves the colonies out, the sidebar links
 * back, the fragment survives the map rewriting the address, and an address written
 * by a stranger can do nothing but be shown as text. With a mouse, with a finger,
 * and at more than one zoom.
 *
 * It fetches nothing from the statistics site. */
'use strict';
const zlib = require('zlib');
const { sleep, calm, check, report, launch, open, BASE } = require('./suite.js');

const encode = o => zlib.deflateRawSync(Buffer.from(JSON.stringify(o), 'utf8'), { level: 9 })
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const VIEW = '?where=125.41,21.53,147.92,48.77&layers=2w';
const link = o => VIEW + '#t=' + encode(o);
const encodeRaw = s => zlib.deflateRawSync(Buffer.from(s, 'utf8'), { level: 9 })
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/* A reader that takes a bare CR as a new row, as some spreadsheets do. */
function csvCells(text) {
  const cells = [];
  let cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',' || c === '\n' || c === '\r') { cells.push(cell); cell = ''; }
    else cell += c;
  }
  cells.push(cell);
  return cells;
}
const runsAsFormula = c => /^[\s\u200b-\u200f\u2060]*[=+\-@＝＋－＠]/.test(c) && !/^[+-]?[\d.,]*%?$/.test(c);
const csvOf = p => p.evaluate(() => new Promise(res => {
  const of = URL.createObjectURL;
  URL.createObjectURL = blob => { URL.createObjectURL = of; blob.text().then(res); return of.call(URL, blob); };
  document.querySelector('#dlg-table .pop-csv').click();
}));
const pressAll = p => p.evaluate(() => [...document.querySelectorAll('#info-trains button')].find(x => /All figures/.test(x.textContent)).click());
const footOf = p => p.evaluate(() => {
  const f = document.getElementById('info-theme-foot');
  return { hidden: f.hidden, href: f.querySelector('a').href };
});
const SRC = 'https://kmlawson.github.io/playground-stat-tables/book/test/#p1';

const ALL = [];
for (let i = 1; i <= 47; i++) ALL.push(String(i).padStart(2, '0'));

/* One count, with a per-capita view and a printed total; a colony or two. */
const COUNT = {
  v: 1,
  src: { url: SRC, book: 'test', table: 'p1' },
  title: { ja: '藝妓本籍道府縣別', en: 'Geisha by Prefecture' },
  volume: { title: '警視廳統計書 1935', year: '1935' },
  date: '1935-12-31', period: '1930', part: null, units: 'prefecture',
  cols: [{ name: '人員', en: 'Geisha (persons)', unit: '人', kind: 'count', pc: true, color: 'seq' }],
  def: 0,
  rows: ALL.filter(id => id !== '30').map((id, i) => ({
    id, label: id === '13' ? '東京府' : 'P' + id, row: i,
    v: [id === '13' ? 6349 : id === '15' ? 443 : id === '01' ? '?' : id === '02' ? '-'
      : id === '03' ? '17 03' : id === '04' ? '' : (i + 1) * 3],
  })).concat([{ id: 'chosen', label: '朝鮮', row: 60, v: [12] }, { id: 'kwantung', label: '關東州', row: 61, v: [30] }]),
  total: { label: '總計', row: 0, v: [10661], mismatch: { 0: 10659 } },
  notes: ['Licensed in the Tokyo district.'],
  somethingNew: { ignored: true },
};
/* Four rates, on the later map. */
const RATES = {
  v: 1,
  src: { url: SRC, book: 'test', table: 'p2' },
  title: { ja: '出生死亡', en: 'Births and deaths' },
  volume: { title: '家事年鑑 1939', year: '1939' },
  date: '1937', period: '1942', units: 'prefecture',
  cols: [
    { name: '出生', en: 'Births', unit: 'per 1,000', kind: 'rate', pc: true, color: 'seq' },
    { name: '死産', en: 'Stillbirths', unit: 'per 1,000', kind: 'rate', pc: false },
    { name: '死亡', en: 'Deaths', unit: 'per 1,000', kind: 'rate', pc: false },
    { name: '自然増加', en: 'Natural increase', unit: 'per 1,000', kind: 'rate', pc: false, color: 'div' },
  ],
  def: 2,
  rows: ALL.map((id, i) => ({ id, label: 'P' + id, row: i, v: [30 + i / 10, 1 + i / 100, 47 - i / 2, i < 10 ? -2 - i : i - 12] })),
  total: { label: '全國', row: 47, v: [30.6, 1.5, 17.1, 13.5] },
  notes: [],
};
const HOSTILE = {
  v: 1,
  src: { url: 'javascript:window.__pwned=1', book: 'x', table: 'y' },
  title: { ja: '<img src=x onerror="window.__pwned=1">', en: '<b id="injected">bold</b>' },
  volume: { title: '<img src=x onerror="window.__pwned=1">', year: '1935' },
  units: 'prefecture',
  cols: [{ name: '<i id="injected2">x</i>', kind: 'count', pc: true }, { name: '=HYPERLINK("http://x")' }],
  rows: [
    { id: '13', label: '=cmd|calc', v: [5, 6] },
    { id: '__proto__', label: 'x', v: [1, 1] },
    { id: 'constructor', label: 'x', v: [1, 1] },
    { id: '14', label: '<img src=x onerror="window.__pwned=1">', v: ['<img src=x onerror="window.__pwned=1">', 2] },
  ],
  total: { label: 'x', v: [1, 1], mismatch: { __proto__: 1 } },
  notes: ['<script>window.__pwned=1</script>'],
};

const fillOf = (p, prov) => p.evaluate(k => {
  const el = document.querySelector('#land [data-prov="' + k + '"]');
  return el ? el.style.getPropertyValue('--c') : null;
}, prov);
const tableUp = p => p.waitForFunction(() => !!document.querySelector('#land path.pop-shaded[data-prov="Tokyo"]'),
  { timeout: 30000 }).catch(() => {});
const cardText = p => p.evaluate(() => document.getElementById('info').innerText);
const keyText = p => p.evaluate(() => document.getElementById('legend').innerText);
const hash = p => p.evaluate(() => location.hash);
const atProv = (p, k) => p.evaluate(key => {
  const els = [...document.querySelectorAll('#land [data-prov="' + key + '"]')];
  const best = els.sort((a, b) => b.getBBox().width * b.getBBox().height - a.getBBox().width * a.getBBox().height)[0];
  const r = best.getBoundingClientRect();
  // a point that is really on it
  for (const [fx, fy] of [[.5, .5], [.4, .5], [.6, .5], [.5, .4], [.5, .6], [.3, .3], [.7, .7]]) {
    const x = r.left + r.width * fx, y = r.top + r.height * fy;
    const hit = document.elementFromPoint(x, y);
    if (hit && hit.getAttribute && hit.getAttribute('data-prov') === key) return { x, y };
  }
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, k);
async function press(p, at) {
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(60);               // a press, not a flick
  await p.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(p);
}
const pickCol = async (p, i) => {
  await p.select('#tbl-col', String(i));
  await calm(p);
};

(async () => {
  // the file goes to a folder of its own, not to the reader's Downloads
  const b = await launch({ downloads: true });
  let at;

  console.log('\n— no table in the address —');
  const plain = await open(b, VIEW);
  await calm(plain);
  check('the module is not even fetched', await plain.evaluate(() => !window.JMAP_TABLE));
  check('nothing over the map', await plain.evaluate(() => !document.getElementById('tbl-bar')));
  await plain.close();

  console.log('\n— several columns —');
  const r = await open(b, link(RATES), { width: 1280, height: 800 });
  await tableUp(r);
  await calm(r);
  const opts = await r.evaluate(() => {
    const s = document.getElementById('tbl-col');
    return s && { n: s.options.length, at: s.value, text: s.options[s.selectedIndex].textContent };
  });
  check('the dropdown has every column', opts && opts.n === 4, JSON.stringify(opts));
  check('  and starts on `def`, with its unit', opts && opts.at === '2' && /Deaths/.test(opts.text) && /per 1,000/.test(opts.text), JSON.stringify(opts));
  check('the map goes to the period the table asks for',
    await r.evaluate(() => document.querySelector('#epoch-seg button.on').getAttribute('data-epoch') === 'e1942'));
  const deaths = await fillOf(r, 'Tokyo');
  check('Tōkyō is shaded', !!deaths, deaths);
  check('no per-capita box for a rate, whatever `pc` says',
    await r.evaluate(() => { const l = document.querySelector('.tbl-pc'); return !l; }));
  await pickCol(r, 0);
  const births = await fillOf(r, 'Hokkaido');
  await pickCol(r, 2);
  check('choosing a column changes the map', births !== await fillOf(r, 'Hokkaido'), births);
  let key = await keyText(r);
  check('the key names the column', /Deaths/.test(key), key.slice(0, 120));
  let card = await cardText(r);
  check('the card gives the title, both ways', /Births and deaths/.test(card) && /出生死亡/.test(card), card.slice(0, 160));
  check('  the volume and year', /家事年鑑 1939/.test(card) && /1939/.test(card));
  check('  and the national rate, not called a total', /National rate/.test(card) && /17\.1/.test(card), card.slice(0, 300));
  const foot = await r.evaluate(() => {
    const f = document.getElementById('info-theme-foot');
    const a = f.querySelector('a');
    return { hidden: f.hidden, href: a.href, text: a.textContent, rel: a.rel };
  });
  check('the source table is linked at the foot', !foot.hidden && foot.href === SRC && /kmlawson\.github\.io/.test(foot.text), JSON.stringify(foot));
  await pickCol(r, 3);
  // Gunma is −11 and Okinawa +34: either side of nought
  const div = [await fillOf(r, 'Gunma'), await fillOf(r, 'Okinawa')];
  check('a diverging column with both signs uses both ends', /b2533f|e3a793/.test(div[0]) && /8fb4d4|1f5b8f/.test(div[1]), div.join(' '));

  const hh = await hash(r);
  await r.mouse.move(640, 400);
  await r.mouse.down();
  await r.mouse.move(600, 380, { steps: 4 });
  await r.mouse.up();
  await calm(r);
  await sleep(700);              // the address is written on a timer
  await r.evaluate(() => document.getElementById('zoom-in').click());
  await calm(r);
  await sleep(700);              // and again
  check('the map rewrites the address and keeps the table', (await hash(r)) === hh);
  const zoomed = await r.evaluate(() => {
    const e = document.getElementById('tbl-bar').getBoundingClientRect();
    return { top: e.top, shaded: document.querySelectorAll('#land path.pop-shaded').length,
      figures: document.querySelectorAll('text.popval').length };
  });
  check('still shaded, with the figures on the map, zoomed in', zoomed.shaded > 47 && zoomed.figures > 20, JSON.stringify(zoomed));
  await r.reload({ waitUntil: 'domcontentloaded' });
  await tableUp(r);
  await calm(r);
  check('a reload brings the table back', await r.evaluate(() => !!document.getElementById('tbl-col')));
  await r.close();

  console.log('\n— one column, with a mouse —');
  const p = await open(b, link(COUNT), { width: 1280, height: 800 });
  await tableUp(p);
  await calm(p);
  check('one column: no dropdown', await p.evaluate(() => !document.getElementById('tbl-col')));
  check('  but the per-capita box', await p.evaluate(() => !!document.querySelector('.tbl-pc input')));
  const tokyo = await fillOf(p, 'Tokyo');
  const niigata = await fillOf(p, 'Niigata');
  const none = await fillOf(p, 'Wakayama');
  check('a prefecture with no row is blank, not the lightest class', none === '#ffffff', none);
  check('  and a blank cell the same', (await fillOf(p, 'Miyagi')) === '#ffffff');
  check('  and a misprint, which is no figure', (await fillOf(p, 'Iwate')) === '#ffffff');
  const unread = await fillOf(p, 'Hokkaido');
  const nil = await fillOf(p, 'Aomori');
  check('unreadable, nil and no data are three things', new Set([unread, nil, none]).size === 3, [unread, nil, none].join(' '));
  check('  none of them a class', !/dfeaf4|c3d6e8|8fb4d4|5286b4|1f5b8f/.test(unread + nil), unread + nil);
  key = await keyText(p);
  check('  and all three are in the key', /Nil/.test(key) && /Unreadable/.test(key) && /No data/.test(key), key.slice(0, 300));
  const korea = await p.evaluate(() => {
    const ps = [...document.querySelectorAll('#a-korea path')];
    return { n: ps.length, on: ps.filter(x => x.classList.contains('pop-shaded')).length, colours: new Set(ps.map(x => x.style.getPropertyValue('--c'))).size };
  });
  check('a colony in the table is coloured whole', korea.n > 0 && korea.on === korea.n && korea.colours === 1, JSON.stringify(korea));
  const kw = await p.evaluate(() => {
    const e = document.getElementById('a-kwantung');
    return { c: e.style.getPropertyValue('--c'), fill: getComputedStyle(e).fill };
  });
  check('  Kwantung, which is one path, really is drawn in it', !!kw.c && kw.fill !== 'none' && kw.fill.indexOf('rgb') === 0, JSON.stringify(kw));
  check('a colony not in the table is left alone',
    await p.evaluate(() => ![...document.querySelectorAll('#a-taiwan path')].some(x => x.classList.contains('pop-shaded'))));

  card = await cardText(p);
  check('the card gives the printed total', /10,661/.test(card), card.slice(0, 300));
  check('  and that the places mapped do not add up to it', /10,659/.test(card));
  check('  the notes', /Licensed in the Tokyo district/.test(card));
  check('  and the highest place', /Tōkyō/.test(card));

  at = await atProv(p, 'Tokyo');
  await p.mouse.move(at.x - 2, at.y - 2);
  await p.mouse.move(at.x, at.y, { steps: 3 });
  await sleep(250);              // the tooltip's delay
  const tip = await p.evaluate(() => document.getElementById('tooltip') && document.getElementById('tooltip').innerText);
  check('the hover gives the label and figure as printed', /東京府/.test(tip || '') && /6,349/.test(tip || ''), tip);
  check('  and its share of the printed total', /59\.6%/.test(tip || ''), tip);

  await press(p, at);
  card = await cardText(p);
  check('pressing a prefecture gives its figures', /Tōkyō/.test(card) && /6,349/.test(card) && /東京府/.test(card), card.slice(0, 240));
  check('  and it is outlined', await p.evaluate(() => !!document.querySelector('#land path.tbl-sel[data-prov="Tokyo"]')));
  check('  with the source still at the foot', await p.evaluate(() => !document.getElementById('info-theme-foot').hidden));
  at = await atProv(p, 'Keiki');
  await press(p, at);
  card = await cardText(p);
  check('pressing Korea gives the colony’s row', /朝鮮/.test(card) && /12/.test(card), card.slice(0, 200));
  at = await atProv(p, 'Wakayama');
  await press(p, at);
  card = await cardText(p);
  check('pressing a prefecture with no row says so', /no row/.test(card) && /Wakayama/.test(card), card.slice(0, 200));

  await p.evaluate(() => document.getElementById('tbl-percap').click());
  await calm(p);
  key = await keyText(p);
  check('per capita says which census: the end of 1935 is nearer 1940', /1940 census/.test(key), key.slice(0, 240));
  check('  and the colony drops out', !(await p.evaluate(() => {
    const e = document.querySelector('#a-korea path');
    return /dfeaf4|c3d6e8|8fb4d4|5286b4|1f5b8f/.test(e.style.getPropertyValue('--c'));
  })));
  at = await atProv(p, 'Tokyo');
  await press(p, at);
  card = await cardText(p);
  // 6349 / 6,778,804 (1940) × 1000 = 0.94
  const pop1940 = await p.evaluate(() => {
    const s = (window.JMAP && JMAP.POPULATION || []).find(d => d.id === 'japan-1940');
    return s.rows.Tokyo.pop;
  });
  const wantPc = (6349 / pop1940 * 1000).toPrecision(2);
  check('the per-capita figure is the count over that census', card.includes(wantPc + ' per 1,000 people'), wantPc + ' ' + card.slice(0, 300));

  await p.evaluate(() => {
    [...document.querySelectorAll('#legend .cen-chip')].find(x => /About this table/.test(x.textContent)).click();
  });
  await calm(p);
  await p.evaluate(() => [...document.querySelectorAll('#info-trains button')].find(x => /All figures/.test(x.textContent)).click());
  await calm(p);
  const tbl = await p.evaluate(() => ({
    rows: document.querySelectorAll('#dlg-table tbody tr').length,
    text: document.querySelector('#dlg-table .table-body').innerText,
    csv: !!document.querySelector('#dlg-table .pop-csv'),
    link: (document.querySelector('#dlg-table .pop-src a') || {}).href,
  }));
  check('every row is in the table', tbl.rows === COUNT.rows.length, String(tbl.rows));
  check('  which offers its CSV, with the source', tbl.csv && tbl.link === SRC, JSON.stringify(tbl.link));
  const csv = await csvOf(p);
  check('  the file has the name in two columns, the numbers bare', /Name,Characters/.test(csv) && /,6349(,|\r?\n)/.test(csv), csv.slice(0, 200));
  check('  and the source at its foot', /Source,/.test(csv) && csv.includes(SRC));
  await p.evaluate(() => document.getElementById('dlg-table').close());
  await sleep(120);              // the close event clears the box on the next task
  await calm(p);

  await p.evaluate(() => [...document.querySelectorAll('#legend .cen-chip')].find(x => /Remove/.test(x.textContent)).click());
  await calm(p);
  check('removing it takes the table out of the address', (await hash(p)) === '', await hash(p));
  check('  the control off the map', await p.evaluate(() => !document.getElementById('tbl-bar')));
  check('  the shading with it', (await fillOf(p, 'Tokyo')) === '');
  check('  and the foot', await p.evaluate(() => document.getElementById('info-theme-foot').hidden));
  await p.close();

  console.log('\n— it has the map to itself —');
  // far enough west for the book to offer its themes
  const q = await open(b, '?where=66,8,150,48&layers=2w#t=' + encode(RATES), { width: 1280, height: 800 });
  await tableUp(q);
  await calm(q);
  await q.evaluate(() => document.getElementById('btn-theme').click());
  await sleep(700);              // the menu opens, and fetches themes.js the first time
  await q.evaluate(() => {
    const i = [...document.querySelectorAll('#theme-menu input')].find(x => /Burma/.test(x.parentNode.textContent));
    if (i) i.click();
  });
  await q.waitForFunction(() => !!document.getElementById('thematic'), { timeout: 30000 }).catch(() => {});
  await calm(q);
  check('choosing a thematic layer closes the table',
    await q.evaluate(() => !document.getElementById('tbl-bar') && !location.hash && !!document.getElementById('thematic')));
  await q.close();
  const y = await open(b, link(RATES), { width: 1280, height: 800 });
  await tableUp(y);
  await calm(y);
  check('it starts with no population layer on, whatever the link says',
    await y.evaluate(() => document.querySelector('#opt-pop-japan-density-none').checked));
  await y.evaluate(() => document.querySelector('#opt-pop-japan-density-density').click());
  await calm(y);
  check('choosing a population layer closes the table too',
    await y.evaluate(() => !document.getElementById('tbl-bar') && !location.hash));
  await y.close();

  console.log('\n— the islands, close to —');
  const s = await open(b, '?where=136.5,36.8,140.5,39.2&layers=2w#t=' + encode(COUNT), { width: 1280, height: 800 });
  await tableUp(s);
  await s.waitForFunction(() => !!document.querySelector('#land [data-prov="Sado Island"]'), { timeout: 30000 }).catch(() => {});
  await calm(s);
  const nii = await fillOf(s, 'Niigata');
  check('Sado takes Niigata’s colour', !!nii && (await fillOf(s, 'Sado Island')) === nii, nii);
  at = await atProv(s, 'Sado Island');
  await press(s, at);
  card = await cardText(s);
  check('and pressing it gives Niigata’s row', /Niigata/.test(card) && /443/.test(card), card.slice(0, 200));
  const z = await s.evaluate(() => ({ figures: [...document.querySelectorAll('text.popval')].map(x => x.textContent).filter(t => t === '443').length }));
  check('with the figure on the map at this zoom', z.figures > 0, JSON.stringify(z));
  await s.close();

  console.log('\n— a link arriving in the same tab —');
  const same = await open(b, VIEW, { width: 1280, height: 800 });
  await calm(same);
  await same.evaluate(h => { location.hash = h; }, '#t=' + encode(COUNT));
  await tableUp(same);
  await calm(same);
  check('a new fragment opens the table', await same.evaluate(() => !!document.querySelector('.tbl-pc')));
  await same.evaluate(() => { location.hash = ''; });
  await calm(same);
  check('and taking it away closes it', await same.evaluate(() => !document.querySelector('.tbl-pc')));
  await same.close();

  console.log('\n— an address written by a stranger —');
  const h = await open(b, link(HOSTILE), { width: 1280, height: 800 });
  await tableUp(h);
  await calm(h);
  const safe = await h.evaluate(() => ({
    pwned: !!window.__pwned,
    images: document.querySelectorAll('#info img, #legend img, #tbl-bar img').length,
    injected: !!document.getElementById('injected') || !!document.getElementById('injected2'),
    script: document.querySelectorAll('#info script').length,
    foot: document.getElementById('info-theme-foot').hidden,
    js: [...document.querySelectorAll('a')].filter(a => /^javascript:/i.test(a.getAttribute('href') || '')).length,
    proto: Object.prototype.polluted === undefined,
    title: document.querySelector('#info .primary').textContent,
  }));
  check('markup stays text', !safe.pwned && !safe.images && !safe.injected && !safe.script, JSON.stringify(safe));
  check('  shown as it came', /<b id="injected">/.test(safe.title), safe.title);
  check('a javascript: source is not linked', safe.foot && safe.js === 0, JSON.stringify(safe));
  const rep = await h.evaluate(() => {
    const out = [...document.querySelectorAll('#info-trains .tbl-note')].map(x => x.textContent).join(' | ');
    return out;
  });
  check('ids that are not places are dropped, and said so', /2 rows could not be placed/.test(rep), rep);
  await h.evaluate(() => [...document.querySelectorAll('#info-trains button')].find(x => /All figures/.test(x.textContent)).click());
  await calm(h);
  const bad = await csvOf(h);
  check('a formula cannot reach a spreadsheet', !csvCells(bad).some(runsAsFormula), bad.slice(0, 300));
  await h.close();

  console.log('\n— what the first review got past the file —');
  const SLIPS = ['-1+1+cmd|\' /C calc\'!A0', '-2+3', '-.5+1', 'safe\r=1+1', 'a;=3+3', '＝5+5', '\u200b=1+1', ' =1+1', '@SUM(A1)', '+10'];
  const slip = {
    v: 1, units: 'prefecture', src: { url: SRC },
    title: { ja: '=TITLE()', en: '-TITLE()+1' }, volume: { title: '=VOLUME()', year: '=1' },
    cols: [{ name: '=HEAD()', en: '-HEAD()+1', unit: '=UNIT()', kind: 'count' }],
    rows: SLIPS.map((s, i) => ({ id: ALL[i], label: s, v: [s] })),
    notes: ['=NOTE()', '-NOTE()+1'],
  };
  const f = await open(b, link(slip), { width: 1280, height: 800 });
  await tableUp(f);
  await calm(f);
  await pressAll(f);
  await calm(f);
  const out = await csvOf(f);
  const outCells = csvCells(out);
  check('none of them reaches a cell as a formula', !outCells.some(runsAsFormula),
    outCells.filter(runsAsFormula).join(' | ').slice(0, 300));
  check('  a semicolon is quoted, for locales that split on it', out.includes('"a;=3+3"'), out.slice(0, 300));
  const shown = await f.evaluate(() => document.querySelector('#dlg-table tbody').innerText);
  check('the screen keeps the text as printed, with no apostrophe', shown.includes('+10') && !shown.includes("'+10") && !shown.includes("'-2+3"), shown.slice(0, 200));
  check('a figure in text is left alone in the file', outCells.includes('+10'), '');
  await f.close();

  console.log('\n— where a source link may go —');
  for (const [what, src] of [
    ['another host', { url: 'https://evil.github.io/x' }],
    ['a look-alike host', { url: 'https://froginawell.net.evil.example/reference/old-tables/x' }],
    ['the right host, outside the site', { url: 'https://froginawell.net/elsewhere/' }],
    ['walking out of the site', { url: 'https://froginawell.net/reference/old-tables/../../evil' }],
    ['walking out, encoded', { url: 'https://froginawell.net/reference/old-tables/%2e%2e/%2e%2e/evil' }],
    ['plain http', { url: 'http://froginawell.net/reference/old-tables/x' }],
    ['another port', { url: 'https://froginawell.net:8443/reference/old-tables/x' }],
    ['credentials', { url: 'https://user:pw@froginawell.net/reference/old-tables/x' }],
    ['an array', { url: ['https://froginawell.net/reference/old-tables/x'] }],
    ['a path off a local preview', { path: 'book/x/' }],
    ['a string for src', 'https://froginawell.net/reference/old-tables/x'],
  ]) {
    const g = await open(b, link(Object.assign({}, RATES, { src })), { width: 1280, height: 800 });
    await tableUp(g);
    await calm(g);
    const ft = await footOf(g);
    check(what + ': the table, with no link', ft.hidden && await g.evaluate(() => !!document.getElementById('tbl-col')), JSON.stringify(ft));
    await g.close();
  }
  const lure = await open(b, VIEW + '#t=' + encode({ v: 2, units: 'city', cols: [{ name: 'x' }], rows: [], src: { url: 'https://evil.example/login' } }), { width: 1280, height: 800 });
  await lure.waitForFunction(() => !document.getElementById('info').hidden, { timeout: 15000 }).catch(() => {});
  await calm(lure);
  check('an error card does not link to a stranger either',
    await lure.evaluate(() => ![...document.querySelectorAll('#info a')].some(a => /evil/.test(a.href))));
  await lure.close();
  const live = await open(b, link(Object.assign({}, RATES, { src: { url: 'https://froginawell.net/reference/old-tables/book/x/#p1' } })), { width: 1280, height: 800 });
  await tableUp(live);
  await calm(live);
  check('the live tables site is linked', (await footOf(live)).href === 'https://froginawell.net/reference/old-tables/book/x/#p1');
  await live.evaluate(() => [...document.querySelectorAll('#legend .cen-chip')].find(x => /About/.test(x.textContent)).click());
  await calm(live);
  await pressAll(live);
  await calm(live);
  const anchor = await live.evaluate(() => {
    const a = document.querySelector('#dlg-table .pop-src a');
    return { text: a.textContent, href: a.href };
  });
  check('in the table the link’s words are the address it goes to', anchor.text === anchor.href, JSON.stringify(anchor));
  await live.close();

  /* The rule is by the map's own host, so the map has to be on it. */
  const u = new URL(BASE);
  const onLive = await launch({ downloads: true, args: ['--host-resolver-rules=MAP froginawell.net 127.0.0.1'] });
  const host = 'http://froginawell.net:' + u.port + u.pathname;
  const here = async src => {
    const w = await open(onLive, host + VIEW + '#t=' + encode(Object.assign({}, RATES, { src })), { width: 1280, height: 800 });
    await tableUp(w);
    await calm(w);
    const ft = await footOf(w);
    await w.close();
    return ft;
  };
  let ft = await here({ url: 'https://kmlawson.github.io/playground-stat-tables/book/x/#p1', path: 'book/x/#p1' });
  check('on froginawell.net `src.path` joins to the tables site there',
    !ft.hidden && ft.href === 'https://froginawell.net/reference/old-tables/book/x/#p1', JSON.stringify(ft));
  ft = await here({ url: 'https://evil.example/', path: 'book/y/' });
  check('  whatever `src.url` says', ft.href === 'https://froginawell.net/reference/old-tables/book/y/', JSON.stringify(ft));
  ft = await here({ path: '../../evil' });
  check('  and a path cannot walk out of it', ft.hidden, JSON.stringify(ft));
  ft = await here({ path: 'https://evil.example/' });
  check('  nor be an address of its own', ft.hidden || ft.href.startsWith('https://froginawell.net/reference/old-tables/'), JSON.stringify(ft));
  await onLive.close();

  console.log('\n— text with no end to it —');
  const long = 'x'.repeat(9000);
  const big = await open(b, link({
    v: 1, units: 'prefecture', src: { url: SRC }, title: { en: 'y'.repeat(1900000) },
    cols: [{ name: long, en: 'A\u202Egnp.exe' }], notes: [long],
    rows: ALL.map(id => ({ id, label: long, v: [long] })),
  }), { width: 1280, height: 800 });
  await tableUp(big);
  await calm(big);
  const sizes = await big.evaluate(() => ({
    title: document.querySelector('#info .primary').textContent.length,
    keyW: document.getElementById('legend').scrollWidth <= document.getElementById('legend').clientWidth + 1,
    bidi: /[\u202a-\u202e]/.test(document.getElementById('tbl-bar') ? '' : '') || /[\u202a-\u202e]/.test(document.getElementById('legend').textContent),
  }));
  check('a title is capped', sizes.title <= 301, String(sizes.title));
  check('the key stays its width', sizes.keyW, JSON.stringify(sizes));
  check('characters that reverse text are gone', !sizes.bidi);
  at = await atProv(big, 'Nagano');
  await big.mouse.move(at.x - 2, at.y - 2);
  await big.mouse.move(at.x, at.y, { steps: 3 });
  await sleep(250);              // the tooltip's delay
  const tipBox = await big.evaluate(() => {
    const r = document.getElementById('tooltip').getBoundingClientRect();
    return { w: r.width, h: r.height, right: r.right, bottom: r.bottom, vw: innerWidth, vh: innerHeight };
  });
  check('the tooltip stays on the screen', tipBox.w <= 280 && tipBox.right <= tipBox.vw, JSON.stringify(tipBox));
  await press(big, at);
  const reach = await big.evaluate(() => {
    const c = document.querySelector('#info-close').getBoundingClientRect();
    return document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2).id === 'info-close';
  });
  check('and the card can still be closed', reach);
  await big.close();

  console.log('\n— numbers that are not figures —');
  const odd = await open(b, VIEW + '#t=' + encodeRaw('{"v":1,"units":"prefecture","src":{"url":"' + SRC + '"},"title":{"en":"Odd"},"date":"9999-99-99",'
    + '"cols":[{"name":"a","kind":"count","pc":true},{"name":"b","kind":"count"}],'
    + '"rows":[{"id":"01","label":"a","v":[5e-324,1e999]},{"id":"02","label":"b","v":[-5e-324,-1e999]},{"id":"03","label":"c","v":[-0,1.7e308]},'
    + '{"id":"13","label":"d","v":[12,3]},{"id":"27","label":"e","v":[40,9]}],'
    + '"total":{"label":"t","v":[1e999,2],"mismatch":{"0":1e999}}}'), { width: 1280, height: 800 });
  await tableUp(odd);
  await calm(odd);
  for (const i of [0, 1]) {
    await pickCol(odd, i);
    key = await keyText(odd);
    check('column ' + i + ': the key has no NaN or ∞', !/NaN|∞|Infinity/.test(key), key.slice(0, 200));
  }
  card = await cardText(odd);
  check('a mismatch of infinity is not reported', !/add up to/.test(card), card.slice(0, 300));
  check('a date that cannot be one is left out', !/9999/.test(card), card.slice(0, 200));
  check('a colour for no absurd figure', (await fillOf(odd, 'Hokkaido')) === '#ffffff', await fillOf(odd, 'Hokkaido'));
  await odd.close();

  console.log('\n— links arriving faster than they can be read —');
  const fast = await open(b, VIEW, { width: 1280, height: 800 });
  await calm(fast);
  const slowly = (first, then) => fast.evaluate(async (a, z) => {
    const read = ReadableStreamDefaultReader.prototype.read;
    window.__slow = true;
    ReadableStreamDefaultReader.prototype.read = async function () {
      if (window.__slow) { window.__slow = false; await new Promise(r => setTimeout(r, 500)); }
      return read.call(this);
    };
    location.hash = a;
    await new Promise(r => setTimeout(r, 60));
    location.hash = z;
    await new Promise(r => setTimeout(r, 1100));
    ReadableStreamDefaultReader.prototype.read = read;
  }, first, then);
  await slowly('#t=' + encode(COUNT), '#t=' + encode(RATES));
  await calm(fast);
  card = await cardText(fast);
  check('the later link wins, not the slower one', /Births and deaths/.test(card) && !/Geisha/.test(card), card.slice(0, 120));
  await slowly('#t=' + encode(COUNT), '');
  await calm(fast);
  check('a link taken away while it is read does not come up',
    await fast.evaluate(() => !document.querySelector('.tbl-pc')));
  check('  and leaves no table without an address', await fast.evaluate(() => !!location.hash || !document.querySelector('.tbl-pc')));
  await fast.close();

  console.log('\n— a table open when another arrives —');
  const stale = await open(b, link(RATES), { width: 1280, height: 800 });
  await tableUp(stale);
  await calm(stale);
  await pressAll(stale);
  await calm(stale);
  await stale.evaluate(h => { location.hash = h; }, '#t=' + encode(COUNT));
  await stale.waitForFunction(() => !!document.querySelector('.tbl-pc'), { timeout: 15000 }).catch(() => {});
  await calm(stale);
  check('its figures do not stay open over the new one', await stale.evaluate(() => !document.getElementById('dlg-table').open));
  await stale.evaluate(() => [...document.querySelectorAll('#info-trains button')].find(x => /All figures/.test(x.textContent)).click());
  await calm(stale);
  await stale.evaluate(() => { location.hash = '#t=broken'; });
  await stale.waitForFunction(() => /Table not shown/.test(document.getElementById('info').innerText), { timeout: 15000 }).catch(() => {});
  await calm(stale);
  const broke = await stale.evaluate(() => ({ dlg: document.getElementById('dlg-table').open, bar: !!document.getElementById('tbl-bar') }));
  check('nor over a link that fails', !broke.dlg && !broke.bar, JSON.stringify(broke));
  await stale.close();

  console.log('\n— the code will not arrive —');
  const noScript = await b.newPage();
  await noScript.setViewport({ width: 1280, height: 800 });
  await noScript.setRequestInterception(true);
  noScript.on('request', q => (/table-link/.test(q.url()) ? q.abort() : q.continue()));
  await noScript.goto(BASE + link(RATES), { waitUntil: 'domcontentloaded' });
  await noScript.waitForFunction(() => /could not be loaded/.test(document.getElementById('info').innerText), { timeout: 30000 }).catch(() => {});
  card = await cardText(noScript);
  check('the map opens and says so', /could not be loaded/.test(card), card.slice(0, 160));
  await noScript.close();

  console.log('\n— saying the figures are not the map’s own —');
  const flagged = await open(b, link(COUNT), { width: 1280, height: 800 });
  await tableUp(flagged);
  await calm(flagged);
  const flagBox = () => flagged.evaluate(() => {
    const e = document.getElementById('tbl-flag');
    if (!e) return null;
    const r = e.getBoundingClientRect(), m = document.getElementById('map-container').getBoundingClientRect();
    return { text: e.textContent, x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left - m.left, top: r.top - m.top,
      onTop: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === e, vis: getComputedStyle(e).visibility };
  });
  let fb = await flagBox();
  check('a pill in the corner of the map says so', !!fb && /External data/.test(fb.text) && fb.onTop && fb.left < 30 && fb.top < 30, JSON.stringify(fb));
  const beforeDrag = await flagBox();
  await flagged.mouse.move(640, 400);
  await flagged.mouse.down();
  await flagged.mouse.move(600, 380, { steps: 4 });
  await flagged.mouse.up();
  await calm(flagged);
  await flagged.evaluate(() => document.getElementById('zoom-in').click());
  await calm(flagged);
  fb = await flagBox();
  check('  and stays there when the map pans and zooms', fb.x === beforeDrag.x && fb.y === beforeDrag.y && fb.vis === 'visible', JSON.stringify(fb));
  at = await atProv(flagged, 'Tokyo');
  await press(flagged, at);
  check('  and with another card open', !!(await flagBox()));
  fb = await flagBox();
  await press(flagged, fb);
  card = await cardText(flagged);
  check('pressing it gives the table’s details', /Geisha by Prefecture/.test(card) && /Printed total/.test(card), card.slice(0, 160));
  check('  and selects nothing underneath', await flagged.evaluate(() => !document.querySelector('.tbl-sel')));
  await flagged.evaluate(() => [...document.querySelectorAll('#legend .cen-chip')].find(x => /Remove/.test(x.textContent)).click());
  await calm(flagged);
  check('removing the table takes it away', !(await flagBox()));
  await flagged.close();
  const unflagged = await open(b, VIEW + '#t=broken', { width: 1280, height: 800 });
  await unflagged.waitForFunction(() => !document.getElementById('info').hidden, { timeout: 15000 }).catch(() => {});
  await calm(unflagged);
  check('a link that shows nothing has no pill', await unflagged.evaluate(() => !document.getElementById('tbl-flag')));
  await unflagged.close();

  console.log('\n— many columns —');
  const GROUPED = {
    v: 1, units: 'prefecture', src: { url: SRC }, title: { en: 'Occupations' },
    cols: Array.from({ length: 24 }, (x, i) => ({
      name: ['農業', '工業', '商業'][i % 3] + ' — ' + (i % 2 ? '女' : '男') + ' — ' + i,
      en: i === 7 ? 'Industry, women' : undefined, kind: 'count', unit: '人',
    })),
    def: 7,
    rows: ALL.map((id, r) => ({ id, label: 'P' + id, v: Array.from({ length: 24 }, (x, i) => (r + 1) * (i % 2 ? 24 - i : i + 1)) })),
  };
  const m = await open(b, link(GROUPED), { width: 1280, height: 800 });
  await tableUp(m);
  await calm(m);
  const menuState = () => m.evaluate(() => {
    const p = document.getElementById('tbl-menu');
    return { hidden: p.hidden, native: !!document.getElementById('tbl-col'), expanded: document.getElementById('tbl-menu-btn').getAttribute('aria-expanded'),
      now: document.querySelector('#tbl-menu-btn .now').textContent,
      open: [...p.querySelectorAll('details')].filter(d => d.open).map(d => d.querySelector('summary').firstChild.textContent),
      groups: p.querySelectorAll('details').length, items: p.querySelectorAll('.tbl-menu-item').length,
      on: (p.querySelector('.tbl-menu-item.on') || {}).textContent };
  });
  let ms = await menuState();
  check('past six columns the dropdown folds: one line to begin with', ms.hidden && !ms.native && ms.expanded === 'false' && /Industry, women/.test(ms.now), JSON.stringify(ms));
  check('  every column is in it, by the first level of its heading', ms.groups === 3 && ms.items === 24, JSON.stringify(ms));
  check('  and only the group in use is open', ms.open.join() === '工業', JSON.stringify(ms.open));
  const clickBtn = sel => m.evaluate(s => document.querySelector(s).click(), sel);
  const btnAt = await m.evaluate(() => { const r = document.getElementById('tbl-menu-btn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await press(m, btnAt);
  ms = await menuState();
  check('pressing it opens it', !ms.hidden && ms.expanded === 'true', JSON.stringify(ms));
  await press(m, btnAt);
  ms = await menuState();
  check('pressing it again folds it', ms.hidden && ms.expanded === 'false', JSON.stringify(ms));
  await press(m, btnAt);
  const fold = await m.evaluate(() => {
    const ds = [...document.querySelectorAll('#tbl-menu details')];
    const shut = ds.find(d => !d.open);
    const before = shut.querySelector('.tbl-menu-item').checkVisibility();
    shut.querySelector('summary').click();
    return { before, opened: shut.open, after: shut.querySelector('.tbl-menu-item').checkVisibility() };
  });
  check('a group opens on its own', !fold.before && fold.opened && fold.after, JSON.stringify(fold));
  const whereWas = await m.evaluate(() => { const svg = document.querySelector('#jmap'); return svg.getAttribute('viewBox'); });
  const panelAt = await m.evaluate(() => { const r = document.getElementById('tbl-menu').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await m.mouse.move(panelAt.x, panelAt.y);
  await m.mouse.wheel({ deltaY: 200 });
  await calm(m);
  check('scrolling the list does not zoom the map under it', !!whereWas && whereWas === await m.evaluate(() => document.querySelector('#jmap').getAttribute('viewBox')));
  await m.mouse.move(300, 600);
  await m.mouse.wheel({ deltaY: -300 });
  await calm(m);
  check('  though the same wheel on the map does', whereWas !== await m.evaluate(() => document.querySelector('#jmap').getAttribute('viewBox')));
  const fillBefore = await fillOf(m, 'Hokkaido');
  await clickBtn('#tbl-menu .tbl-menu-item[data-col="0"]');
  await calm(m);
  ms = await menuState();
  check('choosing a column folds it and names the column', ms.hidden && /男/.test(ms.now), JSON.stringify(ms));
  key = await keyText(m);
  check('  and the key follows', /男/.test(key), key.slice(0, 160));
  check('  and the map', !!fillBefore && !!(await fillOf(m, 'Hokkaido')));
  await press(m, btnAt);
  await m.keyboard.press('Escape');
  await calm(m);
  check('Escape folds it', (await menuState()).hidden);
  await press(m, btnAt);
  const mapBefore = await m.evaluate(() => document.querySelector('#jmap').getAttribute('viewBox'));
  await m.mouse.click(300, 600);
  await sleep(450);              // past the 320 ms double-tap window
  await calm(m);
  check('a press on the map folds it', (await menuState()).hidden && !!mapBefore && mapBefore === await m.evaluate(() => document.querySelector('#jmap').getAttribute('viewBox')));
  at = await atProv(m, 'Nagano');
  await press(m, at);
  await m.evaluate(() => document.querySelectorAll('#info-trains .tbl-value')[23].click());
  await calm(m);
  ms = await menuState();
  check('choosing a column in the card moves the menu too', /23/.test(ms.now) && /23/.test(ms.on), JSON.stringify(ms));
  await m.close();
  const flat = await open(b, link(Object.assign({}, GROUPED, {
    cols: Array.from({ length: 9 }, (x, i) => ({ name: 'Column ' + i })),
    rows: ALL.map((id, r) => ({ id, label: 'P' + id, v: Array(9).fill(r) })), def: 0,
  })), { width: 1280, height: 800 });
  await tableUp(flat);
  await calm(flat);
  const flatMenu = await flat.evaluate(() => ({ groups: document.querySelectorAll('#tbl-menu details').length, items: document.querySelectorAll('#tbl-menu .tbl-menu-item').length }));
  check('headings with no levels are a plain list', flatMenu.groups === 0 && flatMenu.items === 9, JSON.stringify(flatMenu));
  await flat.close();
  const six = await open(b, link(Object.assign({}, GROUPED, {
    cols: Array.from({ length: 6 }, (x, i) => ({ name: 'Column ' + i })),
    rows: ALL.map((id, r) => ({ id, label: 'P' + id, v: Array(6).fill(r) })), def: 0,
  })), { width: 1280, height: 800 });
  await tableUp(six);
  await calm(six);
  check('six columns keep the native dropdown', await six.evaluate(() => !!document.getElementById('tbl-col') && !document.getElementById('tbl-menu-btn')));
  await six.close();
  const mt = await open(b, link(GROUPED), { touch: true, width: 390, height: 664 });
  await tableUp(mt);
  await calm(mt);
  const phone = await mt.evaluate(() => {
    const f = document.getElementById('tbl-flag').getBoundingClientRect();
    const r = document.getElementById('tbl-bar').getBoundingClientRect();
    const b = document.getElementById('tbl-menu-btn').getBoundingClientRect();
    return { apart: f.bottom <= r.top, x: b.left + b.width / 2, y: b.top + b.height / 2, right: r.right, w: innerWidth };
  });
  check('with a finger the pill and the menu do not meet', phone.apart && phone.right <= phone.w, JSON.stringify(phone));
  await press(mt, phone);
  const scroller = await mt.evaluate(() => {
    const p = document.getElementById('tbl-menu');
    p.querySelectorAll('details').forEach(d => { d.open = true; });
    return { open: !p.hidden, scrolls: p.scrollHeight > p.clientHeight, action: getComputedStyle(p).touchAction };
  });
  check('  a tap opens it, and the long list can scroll', scroller.open && scroller.scrolls && scroller.action === 'pan-y', JSON.stringify(scroller));
  await mt.close();

  console.log('\n— the second line —');
  const csp = await open(b, link(RATES), { width: 1280, height: 800 });
  await tableUp(csp);
  await calm(csp);
  const pol = await csp.evaluate(() => {
    const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const first = document.querySelector('script');
    return { content: m && m.content, before: !!m && !!first && !!(m.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING),
      ran: !!window.JEM_ASSETS };
  });
  const scripts = (/script-src ([^;]+)/.exec(pol.content || '') || [])[1] || '';
  check('the page has a policy, ahead of its first script', pol.before, JSON.stringify(pol).slice(0, 200));
  check('  which lets no script run but the site’s', /'self'/.test(scripts) && !/unsafe|\*|https?:|data:/.test(scripts), scripts);
  check('  and sends nothing elsewhere', /connect-src 'self'/.test(pol.content) && /default-src 'none'/.test(pol.content) && /form-action 'none'/.test(pol.content), pol.content);
  check('  and the page’s own inline script still runs under it', pol.ran);
  await csp.close();

  for (const [what, frag, re] of [
    ['garbage', '#t=not-a-real-payload', /could not be read/],
    ['another kind of unit', '#t=' + encode({ v: 2, units: 'city', cols: [{ name: 'x' }], rows: [], src: { url: SRC } }), /cannot draw yet/],
    ['no row on the map', '#t=' + encode({ v: 1, units: 'prefecture', cols: [{ name: 'x' }], rows: [{ id: 'nowhere', v: [1] }], src: { url: SRC } }), /could be placed/],
  ]) {
    const e = await open(b, VIEW + frag, { width: 1280, height: 800 });
    await e.waitForFunction(() => !document.getElementById('info').hidden, { timeout: 15000 }).catch(() => {});
    await calm(e);
    const c = await cardText(e);
    check(what + ' opens the map and says so', re.test(c), c.slice(0, 160));
    check('  with nothing shaded', await e.evaluate(() => !document.querySelector('#land path.pop-shaded')));
    await e.close();
  }

  console.log('\n— with a finger —');
  const t = await open(b, link(RATES), { touch: true, width: 390, height: 664 });
  await tableUp(t);
  await calm(t);
  const bar = await t.evaluate(() => {
    const e = document.getElementById('tbl-bar').getBoundingClientRect();
    const s = document.getElementById('tbl-col').getBoundingClientRect();
    return { l: e.left, r: e.right, top: e.top, on: document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2).id, w: innerWidth };
  });
  check('the dropdown is on the screen, and can be pressed', bar.l >= 0 && bar.r <= bar.w && bar.on === 'tbl-col', JSON.stringify(bar));
  check('the key comes open: numbers need their classes', await t.evaluate(() => !document.getElementById('legend').classList.contains('folded')));
  await t.evaluate(() => {
    const l = document.getElementById('legend');
    l.querySelector('.legend-head').click();
  });
  await calm(t);
  at = await atProv(t, 'Niigata');
  await press(t, at);
  card = await cardText(t);
  check('a first tap answers with the prefecture', /Niigata/.test(card), card.slice(0, 160));
  const head = await t.evaluate(() => {
    const a = document.querySelector('#info .alt');
    const r = a.getBoundingClientRect();
    return { text: a.textContent, seen: r.height > 0 && getComputedStyle(a).visibility === 'visible' };
  });
  check('  with its figure showing, before anything is opened out', head.seen && /· 40 per 1,000/.test(head.text), JSON.stringify(head));
  await t.evaluate(() => document.querySelector('#info .more').click());
  await sleep(250);              // the sheet opens
  const more = await t.evaluate(() => {
    const body = document.getElementById('info-trains');
    const f = document.getElementById('info-theme-foot');
    return { values: body.querySelectorAll('.tbl-value').length, foot: getComputedStyle(f).display };
  });
  check('opened out it has every column, and the link back', more.values === 4 && more.foot !== 'none', JSON.stringify(more));
  await t.close();

  await b.close();
  report();
})().catch(e => { console.error(e); process.exit(1); });
