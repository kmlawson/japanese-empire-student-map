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
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const encode = o => zlib.deflateRawSync(Buffer.from(JSON.stringify(o), 'utf8'), { level: 9 })
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const VIEW = '?where=125.41,21.53,147.92,48.77&layers=2w';
const link = o => VIEW + '#t=' + encode(o);
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
  const b = await launch();
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
  const csv = await p.evaluate(() => new Promise(res => {
    const of = URL.createObjectURL;
    URL.createObjectURL = blob => { blob.text().then(res); return of.call(URL, blob); };
    document.querySelector('#dlg-table .pop-csv').click();
  }));
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
  const bad = await h.evaluate(() => new Promise(res => {
    const of = URL.createObjectURL;
    URL.createObjectURL = blob => { blob.text().then(res); return of.call(URL, blob); };
    document.querySelector('#dlg-table .pop-csv').click();
  }));
  const cells = bad.split(/\r?\n/).join(',').split(',').map(x => x.replace(/^"|"$/g, ''));
  check('a formula cannot reach a spreadsheet', !cells.some(x => /^[=+@]/.test(x)), bad.slice(0, 300));
  await h.close();

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
