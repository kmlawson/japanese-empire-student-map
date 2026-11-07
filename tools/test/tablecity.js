/* A table of cities from the address: points, not ground.
 *
 *     node tools/test/tablecity.js        # needs a server on 8123
 *
 * `units: "city"` (the statistics site's MAPLINK_SPEC section 4b): each row is
 * one of the map's own city ids. Two real tables, sent as the site sends them:
 * 日本都市年鑑 1931 p0100_1, two of its columns in yen, and The Japan Year Book
 * 1930 p0058_1, monthly mean temperatures, figures as transcribed. Asked of it: a
 * count opens as five sizes of circle and a temperature as five colours of dot,
 * the reader can swap them, and Proportional circles have the figure as their
 * area; all are the same size on screen at every zoom and stay on their city
 * through a zoom and a change of projection; a city the gazetteer hides at this
 * zoom is drawn; hover and press answer with the city; per head says which
 * census; the cities not on the map are said; Remove takes it all away. With a
 * mouse and with a finger.
 *
 * It fetches nothing from the statistics site. */
'use strict';
const zlib = require('zlib');
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const encode = o => zlib.deflateRawSync(Buffer.from(JSON.stringify(o), 'utf8'), { level: 9 })
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const VIEW = '?where=128,30,146,44&layers=2w';
const link = (o, view) => (view || VIEW) + '#t=' + encode(o);

/* Generated from the tables site's data/japan-toshi-1931.json, p0100_1. */
const YEN = {
  v: 1,
  src: {"url": "https://froginawell.net/reference/old-tables/book/japan-toshi-1931/#p0100_1", "path": "book/japan-toshi-1931/#p0100_1", "book": "japan-toshi-1931", "table": "p0100_1"},
  title: {"ja": "昭和五年度各市特別經濟歲出", "en": "Special Account Expenditure of Each City, 1930"},
  volume: {"title": "日本都市年鑑 1931", "year": "1931"},
  date: "1930",
  period: "1930",
  part: null,
  units: "city",
  cols: [
    {"name": "水道事業", "en": "Waterworks", "unit": "圓", "kind": "amount", "pc": true},
    {"name": "公營質舗", "en": "Public pawnshops", "unit": "圓", "kind": "amount", "pc": true},
  ],
  def: 0,
  rows: [
    {"id": "osaka", "label": "大阪市", "row": 0, "v": [7900771, 78449]},
    {"id": "tokyo", "label": "東京市", "row": 1, "v": [18775160, 1400592]},
    {"id": "nagoya", "label": "名古屋市", "row": 2, "v": [3289534, 251342]},
    {"id": "kyoto", "label": "京都市", "row": 3, "v": [1791152, "-"]},
    {"id": "kobe", "label": "神戸市", "row": 4, "v": [2586446, 18533]},
    {"id": "yokohama", "label": "横濱市", "row": 5, "v": [7538141, 1256262]},
    {"id": "hiroshima", "label": "廣島市", "row": 6, "v": ["-", "-"]},
    {"id": "nagasaki", "label": "長崎市", "row": 7, "v": [562586, "-"]},
    {"id": "hakodate", "label": "函館市", "row": 8, "v": [523195, "-"]},
    {"id": "kanazawa", "label": "金澤市", "row": 9, "v": [1655397, "-"]},
    {"id": "kumamoto", "label": "熊本市", "row": 10, "v": [316577, 35908]},
    {"id": "fukuoka", "label": "福岡市", "row": 11, "v": [607974, 6325]},
    {"id": "sapporo", "label": "札幌市", "row": 12, "v": ["-", 96604]},
    {"id": "sendai", "label": "仙臺市", "row": 13, "v": [342880, "-"]},
    {"id": "kure", "label": "吳市", "row": 14, "v": [230006, "-"]},
    {"id": "otaru", "label": "小樽市", "row": 15, "v": [661313, "-"]},
    {"id": "kagoshima", "label": "鹿兒島市", "row": 16, "v": [251437, 32543]},
    {"id": "okayama", "label": "岡山市", "row": 17, "v": [606066, "-"]},
    {"id": "yawata", "label": "八幡市", "row": 18, "v": [361755, 63404]},
    {"id": "niigata", "label": "新潟市", "row": 19, "v": [866295, "-"]},
    {"id": "sakai", "label": "堺市", "row": 20, "v": [306798, 8352]},
    {"id": "yokosuka", "label": "横須賀市", "row": 21, "v": [436507, 85015]},
    {"id": "wakayama", "label": "和歌山市", "row": 22, "v": [491152, 47470]},
    {"id": "sasebo", "label": "佐世保市", "row": 23, "v": ["-", "-"]},
    {"id": "moji", "label": "門司市", "row": 24, "v": [1071368, "-"]},
    {"id": "shimonoseki", "label": "下關市", "row": 25, "v": [427243, "-"]},
    {"id": "hamamatsu", "label": "濱松市", "row": 26, "v": [1445920, 49245]},
    {"id": "shizuoka", "label": "靜岡市", "row": 27, "v": [290947, 166632]},
    {"id": "toyohashi", "label": "豐橋市", "row": 28, "v": [368882, "-"]},
    {"id": "gifu", "label": "岐阜市", "row": 29, "v": [311468, 173841]},
    {"id": "utsunomiya", "label": "宇都宮市", "row": 30, "v": ["-", "-"]},
    {"id": "tokushima", "label": "德島市", "row": 31, "v": [397936, "-"]},
    {"id": "maebashi", "label": "前橋市", "row": 32, "v": [636159, "-"]},
    {"id": "asahikawa", "label": "旭川市", "row": 33, "v": ["-", 127638]},
    {"id": "takamatsu", "label": "高松市", "row": 35, "v": [270283, 20644]},
    {"id": "kofu", "label": "甲府市", "row": 36, "v": [393191, "-"]},
    {"id": "omuta", "label": "大牟田市", "row": 37, "v": [248449, 23963]},
    {"id": "toyama", "label": "富山市", "row": 38, "v": ["-", "-"]},
    {"id": "nagano", "label": "長野市", "row": 39, "v": ["-", "-"]},
    {"id": "kochi", "label": "高知市", "row": 40, "v": [195959, "-"]},
    {"id": "fukui", "label": "福井市", "row": 42, "v": [421479, "-"]},
    {"id": "matsuyama", "label": "松山市", "row": 43, "v": ["-", "-"]},
    {"id": "aomori", "label": "青森市", "row": 44, "v": ["-", "-"]},
    {"id": "yamagata", "label": "山形市", "row": 45, "v": [130609, "-"]},
    {"id": "naha", "label": "那覇市", "row": 47, "v": ["-", "-"]},
    {"id": "kawasaki", "label": "川崎市", "row": 48, "v": [766504, "-"]},
    {"id": "oita", "label": "大分市", "row": 49, "v": [137186, "-"]},
    {"id": "tsu", "label": "津市", "row": 51, "v": [389200, 97103]},
    {"id": "kokura", "label": "小倉市", "row": 52, "v": [193119, "-"]},
    {"id": "muroran", "label": "室蘭市", "row": 53, "v": [82044, 128227]},
    {"id": "morioka", "label": "盛岡市", "row": 54, "v": ["-", 5334]},
    {"id": "nara", "label": "奈良市", "row": 56, "v": [176568, "-"]},
    {"id": "ube", "label": "宇部市", "row": 57, "v": [194861, "-"]},
    {"id": "mito", "label": "水戸市", "row": 58, "v": [1007442, "-"]},
    {"id": "ise", "label": "宇治山田市", "row": 62, "v": ["-", "-"]},
    {"id": "amagasaki", "label": "尼崎市", "row": 65, "v": [194941, "-"]},
    {"id": "akita", "label": "秋田市", "row": 66, "v": [33525, 83062]},
    {"id": "miyazaki", "label": "宮崎市", "row": 68, "v": [238325, 31149]},
    {"id": "kushiro", "label": "釧路市", "row": 71, "v": [227073, 166386]},
    {"id": "saga", "label": "佐賀市", "row": 72, "v": [130262, 56311]},
    {"id": "chiba", "label": "千葉市", "row": 74, "v": ["-", "-"]},
    {"id": "fukushima", "label": "福島市", "row": 75, "v": ["-", "-"]},
    {"id": "matsue", "label": "松江市", "row": 76, "v": [148914, "-"]},
  ],
  total: null,
  unplaced: ["久留米市", "松本市", "姫路市", "長岡市", "若松市(福岡)", "清水市", "高崎市", "八王子市", "米澤市", "岡崎市", "郡山市", "高岡市", "桐生市", "若松市(福島)"],
  notes: [],
};

/* Generated from the tables site's data/japan-1930.json, p0058_1. */
const TEMP = {
  v: 1,
  src: {"url": "https://froginawell.net/reference/old-tables/book/japan-1930/#p0058_1", "path": "book/japan-1930/#p0058_1"},
  title: {"en": "Monthly Mean Temperature of Air (in °C.)"},
  volume: {"title": "The Japan Year Book 1930", "year": "1930"},
  date: "1930",
  period: "1930",
  units: "city",
  cols: [
    {"name": "Jan.", "en": "Jan.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Feb.", "en": "Feb.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Mar.", "en": "Mar.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Apr.", "en": "Apr.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "May", "en": "May", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Jun.", "en": "Jun.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Jul.", "en": "Jul.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Aug.", "en": "Aug.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Sept.", "en": "Sept.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Oct.", "en": "Oct.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Nov.", "en": "Nov.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Dec.", "en": "Dec.", "unit": "°C", "kind": "other", "series": "month"},
    {"name": "Year", "en": "Year", "unit": "°C", "kind": "other", "series": ""},
  ],
  def: 12,
  rows: [
    {"id": "taipei", "label": "Taihoku", "row": 0, "v": [15.2, 14.7, 16.9, 20.6, 23.9, 26.6, 28.1, 27.9, 26.1, 22.9, 19.7, 16.7, 21.6]},
    {"id": "fukuoka", "label": "Fukuoka", "row": 1, "v": [5.0, 5.1, 8.1, 13.1, 17.0, 21.3, 25.6, 26.4, 22.2, 16.3, 11.5, 6.9, 14.9]},
    {"id": "kagoshima", "label": "Kagoshima", "row": 2, "v": [7.1, 7.4, 10.8, 15.5, 18.8, 22.2, 26.0, 26.7, 24.2, 19.0, 13.8, 8.8, 16.7]},
    {"id": "hiroshima", "label": "Hiroshima", "row": 3, "v": [4.0, 4.3, 7.4, 13.0, 17.1, 21.3, 25.6, 26.8, 23.0, 16.8, 11.1, 6.0, 14.7]},
    {"id": "osaka", "label": "Osaka", "row": 4, "v": [4.2, 4.4, 7.4, 13.3, 17.5, 21.8, 26.0, 27.3, 23.4, 17.1, 11.5, 6.5, 15.0]},
    {"id": "nagoya", "label": "Nagoya", "row": 5, "v": [3.2, 3.9, 7.0, 13.1, 17.3, 21.5, 25.7, 26.6, 22.9, 16.6, 10.6, 5.3, 14.5]},
    {"id": "kanazawa", "label": "Kanazawa", "row": 6, "v": [2.5, 2.4, 5.3, 11.1, 15.5, 20.0, 24.2, 25.5, 21.5, 15.4, 10.1, 5.1, 13.2]},
    {"id": "tokyo", "label": "Tokyo", "row": 7, "v": [3.0, 3.7, 6.8, 12.6, 16.6, 20.4, 24.2, 25.5, 22.0, 16.0, 10.5, 5.3, 13.9]},
    {"id": "niigata", "label": "Niigata", "row": 8, "v": [1.4, 1.4, 4.4, 10.3, 14.8, 19.4, 23.8, 25.6, 21.4, 15.2, 9.5, 4.1, 12.6]},
    {"id": "hakodate", "label": "Hakodate", "row": 10, "v": [3.0, 2.3, 0.7, 6.4, 10.4, 14.4, 18.9, 21.5, 17.8, 11.7, 5.6, 0.2, 8.5]},
    {"id": "chichijima", "label": "Bonin", "row": 12, "v": [17.5, 17.4, 18.3, 20.5, 22.7, 25.5, 27.1, 27.1, 26.8, 25.4, 22.8, 19.3, 22.5]},
  ],
  total: null,
  unplaced: ["Ishinomaki", "Nemuro"],
  notes: [],
};

const pointsUp = p => p.waitForFunction(() => !!document.querySelector('#tbl-points .tbl-pt'), { timeout: 30000 }).catch(() => {});
const cardText = p => p.evaluate(() => document.getElementById('info').innerText);
const keyText = p => p.evaluate(() => document.getElementById('legend').innerText);
const markOf = (p, id) => p.evaluate(i => {
  const g = document.querySelector('#tbl-points .tbl-pt[data-id="' + i + '"]');
  if (!g) return null;
  const mk = g.querySelector('.mk');
  const r = mk.getBoundingClientRect();
  return { r: Number(mk.getAttribute('r')), w: r.width, x: r.left + r.width / 2, y: r.top + r.height / 2,
    cls: mk.getAttribute('class'), fill: mk.getAttribute('fill'), t: g.getAttribute('transform') };
}, id);
/* Where the city layer's own dot for the same city is put: the point must agree. */
const gazAt = (p, id) => p.evaluate(i => {
  const g = document.querySelector('#gaz g[data-id="g_e1930_' + i + '"]');
  return g ? g.getAttribute('transform') : null;
}, id);
/* The first of these cities whose mark is what a press at its centre would hit:
   a smaller city drawn over a larger, or the key over the map, is not it. */
const reachable = (p, ids) => p.evaluate(list => {
  for (const id of list) {
    const g = document.querySelector('#tbl-points .tbl-pt[data-id="' + id + '"]');
    if (!g) continue;
    const r = g.querySelector('.mk').getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    if (hit && hit.closest && hit.closest('.tbl-pt') === g) return { id, x, y };
  }
  return null;
}, ids);
/* A point inside a city's mark that a press there would hit: a smaller city drawn
   over the middle of a larger one is not it. */
const pointOnMark = (p, id) => p.evaluate(i => {
  const g = document.querySelector('#tbl-points .tbl-pt[data-id="' + i + '"]');
  if (!g) return null;
  const r = g.querySelector('.mk').getBoundingClientRect();
  for (let fy = 0.5; fy > 0.05; fy -= 0.1) {
    for (const fx of [0.5, 0.35, 0.65]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      if (hit && hit.closest && hit.closest('.tbl-pt') === g) return { x, y };
    }
  }
  return null;
}, id);
const radii = p => p.evaluate(() => [...new Set([...document.querySelectorAll('#tbl-points .mk:not(.none)')].map(e => e.getAttribute('r')))].map(Number).sort((a, b) => a - b));
const pick = async (p, sel, v) => { await p.select(sel, v); await calm(p); };
/* The city layer on, so its own dot for a city is placed to compare with. */
const citiesOn = async p => {
  await p.evaluate(() => {
    const btn = document.querySelector('button[data-cat="city"]');
    if (btn.getAttribute('aria-pressed') !== 'true') btn.click();
  });
  await calm(p);
};
const xyOf = t => { const m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(t || ''); return m ? [Number(m[1]), Number(m[2])] : null; };
const near = (a, b) => !!a && !!b && Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
async function press(p, at) {
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(60);               // a press, not a flick
  await p.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(p);
}
async function hover(p, at) {
  await p.mouse.move(at.x - 4, at.y - 4);
  await p.mouse.move(at.x, at.y, { steps: 3 });
  await sleep(250);              // the tooltip's delay
  await calm(p);
  return p.evaluate(() => { const t = document.getElementById('tooltip'); return t && !t.hidden ? t.innerText : ''; });
}
async function setProjection(p, proj) {
  await p.evaluate(() => document.querySelector('#btn-options').click());
  await calm(p);
  await p.evaluate(v => {
    const r = document.querySelector('#proj-' + v);
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
  }, proj);
  await calm(p);
  await p.evaluate(() => { const d = document.querySelector('#dlg-options'); if (d && d.open) d.close(); });
  await calm(p);
}

(async () => {
  const b = await launch({ downloads: true });

  console.log('\n— a count, in circles —');
  const m = await open(b, link(YEN), { width: 1280, height: 800 });
  await pointsUp(m);
  await calm(m);
  await citiesOn(m);
  let card = await cardText(m);
  check('the table opens, not the card saying it cannot', !/Table not shown|cannot draw/.test(card) && /Special Account Expenditure/.test(card), card.slice(0, 200));
  const n = await m.evaluate(() => document.querySelectorAll('#tbl-points .tbl-pt').length);
  check('a point for every city placed', n === YEN.rows.length, n + ' of ' + YEN.rows.length);
  check('no ground is painted, and the map is not dimmed', await m.evaluate(() =>
    !document.querySelector('#land path.pop-shaded') && getComputedStyle(document.getElementById('land')).opacity === '1'));
  const pickers = () => m.evaluate(() => ({
    style: document.getElementById('tbl-style') && document.getElementById('tbl-style').value,
    method: document.getElementById('tbl-classes') && document.getElementById('tbl-classes').value,
    methods: [...document.querySelectorAll('#tbl-classes option')].map(o => o.textContent + (o.disabled ? '(off)' : '')),
    order: [...document.querySelectorAll('#legend .tbl-key-acts > *')].map(e => e.id || e.textContent),
  }));
  let pk = await pickers();
  check('a count opens as sizes, cut in quantiles', pk.style === 'size' && pk.method === 'quantile', JSON.stringify(pk));
  check('  the two dropdowns left of About this table, Proportional offered with sizes',
    pk.order.join('|') === 'tbl-style|tbl-classes|About this table|Remove' && pk.methods.includes('Proportional'), JSON.stringify(pk));
  let rs = await radii(m);
  check('  five sizes of circle, one for each class', rs.join() === '3.5,6,9,12.5,17', rs.join());
  let key = await keyText(m);
  check('  the key gives each size its range', (key.match(/\d[\d,]*–[\d,]+/g) || []).length === 3 && /and over/.test(key) && /under /.test(key)
    && await m.evaluate(() => document.querySelectorAll('#legend .tbl-size-row').length === 5), key.slice(0, 300));
  check('  and says how many cities are not on the map', /14 cities in the table are not on the map\./.test(key), key);
  await pick(m, '#tbl-classes', 'jenks');
  check('natural breaks cut the sizes as well', (await radii(m)).length === 5 && /&tk=jenks/.test(await m.evaluate(() => location.hash)));

  await pick(m, '#tbl-classes', 'prop');
  let tokyo = await markOf(m, 'tokyo');
  const osaka = await markOf(m, 'osaka');
  const ratio = tokyo.r / osaka.r;
  check('proportional: the area is the figure, Tōkyō to Ōsaka as the square root of 18,775,160 to 7,900,771',
    Math.abs(ratio - Math.sqrt(18775160 / 7900771)) < 0.01, ratio.toFixed(4));
  check('  the largest 22 px across the radius', Math.abs(tokyo.r - 22) < 0.01 && /round/.test(tokyo.cls), JSON.stringify(tokyo));
  key = await keyText(m);
  check('  the key has circles at round figures, and says the area is the figure', /13,000,000 圓/.test(key) && /Circle area is the figure/.test(key), key.slice(0, 300));
  check('  on its city: where the city layer puts Tōkyō', near(xyOf(tokyo.t), xyOf(await gazAt(m, 'tokyo'))), tokyo.t + ' / ' + await gazAt(m, 'tokyo'));

  await pick(m, '#tbl-style', 'colour');
  const cols = await m.evaluate(() => [...document.querySelectorAll('#tbl-points .mk:not(.none)')].map(e => [e.getAttribute('r'), e.getAttribute('fill')]));
  pk = await pickers();
  check('colours: one size of dot in the ramp’s colours', cols.every(c => c[0] === '6') && new Set(cols.map(c => c[1])).size >= 4, JSON.stringify(cols.slice(0, 5)));
  check('  Proportional is not offered for dots, and the classes are quantiles again', !pk.methods.includes('Proportional') && pk.method === 'quantile', JSON.stringify(pk));
  check('  the address says colours', /&ts=colour/.test(await m.evaluate(() => location.hash)));
  const addr = await m.evaluate(() => location.href);
  await m.goto(addr, { waitUntil: 'domcontentloaded' });
  await pointsUp(m);
  await calm(m);
  await citiesOn(m);
  pk = await pickers();
  check('  a reload, or the link sent on, keeps colours', pk.style === 'colour', JSON.stringify(pk));
  await pick(m, '#tbl-style', 'size');
  await pick(m, '#tbl-classes', 'prop');
  tokyo = await markOf(m, 'tokyo');
  check('the card names them', /14 cities in the table are not on the map: 久留米市, 松本市/.test(card), card.slice(0, 900));
  const hidden = await m.evaluate(() => {
    // the cities of the table the city layer is not showing at this zoom
    const out = [];
    document.querySelectorAll('#tbl-points .tbl-pt').forEach(pt => {
      const id = pt.getAttribute('data-id');
      const g = document.querySelector('#gaz g[data-id="g_e1930_' + id + '"]');
      if (g && getComputedStyle(g).display === 'none') out.push([id, pt.querySelector('.mk').getBoundingClientRect().width]);
    });
    return out;
  });
  check('cities the city layer hides at this zoom are drawn all the same', hidden.length > 0 && hidden.every(h => h[1] > 2), JSON.stringify(hidden).slice(0, 200));

  let tip = await hover(m, await pointOnMark(m, 'tokyo'));
  check('hovering a circle gives the city, the label as printed and the figure', /Tokyo/.test(tip) && /東京市/.test(tip) && /18,775,160 圓/.test(tip), tip);
  check('  with its share of nothing it has not got: no total, no share', !/of the printed total/.test(tip), tip);
  const sapporo = await reachable(m, ['sapporo']);
  await press(m, sapporo);
  card = await cardText(m);
  check('a press on a circle opens the city', /Sapporo/.test(card) && /Printed as: 札幌市/.test(card), card.slice(0, 200));
  check('  and outlines it', await m.evaluate(() => document.querySelector('#tbl-points .tbl-pt[data-id="sapporo"]').classList.contains('tbl-sel')));

  /* Further in: the same size on screen, and still on its city. */
  const before = tokyo.w;
  for (let i = 0; i < 5; i++) { await m.mouse.move(tokyo.x, tokyo.y); await m.mouse.wheel({ deltaY: -200 }); }
  await calm(m);
  tokyo = await markOf(m, 'tokyo');
  check('zoomed in, a circle is the same size on screen', Math.abs(tokyo.w - before) < 1, before + ' → ' + tokyo.w);
  check('  and still on its city', near(xyOf(tokyo.t), xyOf(await gazAt(m, 'tokyo'))), tokyo.t);
  tip = await hover(m, await pointOnMark(m, 'tokyo'));
  check('  and still answers', /18,775,160/.test(tip), tip);

  /* Another projection: the point goes where the city goes. */
  await setProjection(m, 'albers');
  tokyo = await markOf(m, 'tokyo');
  check('in another projection the point is still on its city', near(xyOf(tokyo.t), xyOf(await gazAt(m, 'tokyo'))), tokyo.t + ' / ' + await gazAt(m, 'tokyo'));
  // a table opened in that projection, then taken back to Mercator
  await m.evaluate(h => { location.hash = h; }, link(TEMP).split('#')[1]);
  await pointsUp(m);
  await calm(m);
  await m.waitForFunction(() => !!document.querySelector('#tbl-points .tbl-pt[data-id="taipei"]'), { timeout: 20000 }).catch(() => {});
  await setProjection(m, 'mercator');
  await citiesOn(m);
  const tp = await markOf(m, 'taipei');
  check('a table opened in that projection lands right back in Mercator', !!tp && near(xyOf(tp.t), xyOf(await gazAt(m, 'taipei'))),
    (tp && tp.t) + ' / ' + await gazAt(m, 'taipei'));
  await m.close();

  console.log('\n— per head —');
  const h = await open(b, link(YEN), { width: 1280, height: 800 });
  await pointsUp(h);
  await calm(h);
  await h.click('#tbl-percap');
  await calm(h);
  const pc = await markOf(h, 'tokyo');
  check('per head, a city opens as a dot on the ramp: a figure per head is a rate', !/round/.test(pc.cls) && pc.r === 6 && !!pc.fill, JSON.stringify(pc));
  check('  sizes are still offered, Proportional not', await h.evaluate(() => {
    const s = document.querySelector('#tbl-style option[value="size"]');
    return !!s && !s.disabled;
  }));
  key = await keyText(h);
  check('  the key says which census, of each city', /using the 1930 census of each city/.test(key), key.slice(0, 300));
  check('  and offers the class dropdown', await h.evaluate(() => !!document.getElementById('tbl-classes')));
  tip = await hover(h, pc);
  check('  the tip gives the figure per 1,000 and the census', /per 1,000 people, 1930 census/.test(tip), tip);
  await pick(h, '#tbl-style', 'size');
  check('  and chosen, per head is five sizes, with Proportional greyed out', (await radii(h)).length === 5 && await h.evaluate(() =>
    document.querySelector('#tbl-classes option[value="prop"]').disabled));
  await h.evaluate(() => [...document.querySelectorAll('#legend .cen-chip')].find(x => /Remove/.test(x.textContent)).click());
  await calm(h);
  check('Remove takes the points away, and the ground is itself again', await h.evaluate(() =>
    !document.getElementById('tbl-points') && getComputedStyle(document.getElementById('land')).opacity === '1'));
  check('  and the address with them, the settings too', !/t=|tk=|ts=/.test(await h.evaluate(() => location.hash)), await h.evaluate(() => location.hash));
  await h.close();

  console.log('\n— a temperature, in dots —');
  const t = await open(b, link(TEMP, '?where=118,20,150,46&layers=2w'), { width: 1280, height: 800 });
  await pointsUp(t);
  await calm(t);
  const dots = await t.evaluate(() => [...document.querySelectorAll('#tbl-points .tbl-pt .mk')].map(e => ({ r: e.getAttribute('r'), f: e.getAttribute('fill'), c: e.getAttribute('class') })));
  check('“other” opens as a dot of one size, coloured on the ramp', dots.length === 11 && dots.every(d => d.r === '6' && !/round/.test(d.c))
    && new Set(dots.map(d => d.f)).size >= 3, JSON.stringify(dots).slice(0, 300));
  check('  with the class dropdown', await t.evaluate(() => !!document.getElementById('tbl-classes')));
  await pick(t, '#tbl-style', 'size');
  check('  as sizes, one for each class in the key, and Proportional greyed out: a temperature is not an amount',
    (await radii(t)).length === await t.evaluate(() => document.querySelectorAll('#legend .tbl-size-row').length) && (await radii(t)).length >= 3
    && await t.evaluate(() => document.querySelector('#tbl-classes option[value="prop"]').disabled));
  await pick(t, '#tbl-style', 'colour');
  const bonin = await markOf(t, 'chichijima');
  tip = await hover(t, bonin);
  check('the tip gives the place, the label as printed and the figure', /Futami/.test(tip) && /Bonin/.test(tip) && /22\.5 °C/.test(tip), tip);
  const tk = await markOf(t, 'tokyo');
  tip = await hover(t, tk);
  check('  and does not say a name twice', tip.split('\n').filter(l => l.trim() === 'Tokyo').length === 1, tip);
  await t.evaluate(() => document.getElementById('tbl-menu-btn').click());
  await t.evaluate(() => document.querySelector('#tbl-menu .tbl-menu-item[data-col="0"]').click());
  await calm(t);
  const jan = await t.evaluate(() => document.querySelector('#tbl-points .tbl-pt[data-id="taipei"] .mk').getAttribute('fill'));
  await t.click('#tbl-next');
  await calm(t);
  check('the arrows walk the months', /Feb/.test(await t.evaluate(() => document.querySelector('#tbl-menu-btn .now').textContent)));
  key = await keyText(t);
  check('  on one scale', /one scale with the other columns of its series/.test(key), key.slice(0, 200));
  check('2 cities in the table are not on the map, and the key says so', /2 cities in the table are not on the map/.test(key), key);
  check('  January’s colour for Taihoku is a colour of the ramp', /^#/.test(jan || ''), jan);
  await t.close();

  // a figure below nought: Hakodate's January as it should read
  const cold = JSON.parse(JSON.stringify(TEMP));
  cold.rows.find(r => r.id === 'hakodate').v[0] = -3;
  cold.def = 0;
  const tc = await open(b, link(cold, '?where=118,20,150,46&layers=2w'), { width: 1280, height: 800 });
  await pointsUp(tc);
  await calm(tc);
  check('below nought, sizes are greyed out: a smaller circle cannot say less than none', await tc.evaluate(() =>
    document.querySelector('#tbl-style option[value="size"]').disabled && document.getElementById('tbl-style').value === 'colour'));
  await tc.close();

  console.log('\n— what a city table may hold —');
  const hostile = Object.assign({}, YEN, {
    rows: YEN.rows.slice(0, 3).concat([{ id: '__proto__', label: 'x', v: [1, 1] }, { id: 'nowhere', label: '<b>nowhere</b>', v: [1, 1] }]),
    unplaced: ['<img src=x onerror="window.__pwned=1">', { label: '大牟田市' }],
  });
  const x = await open(b, link(hostile), { width: 1280, height: 800 });
  await pointsUp(x);
  await calm(x);
  card = await cardText(x);
  check('an id the map has not got is not drawn, and is counted with the rest', await x.evaluate(() =>
    document.querySelectorAll('#tbl-points .tbl-pt').length) === 3 && /4 cities in the table are not on the map/.test(card), card.slice(0, 600));
  check('  their names stay text', !(await x.evaluate(() => window.__pwned)) && /<img src=x/.test(card) && /<b>nowhere<\/b>/.test(card));
  await x.close();

  console.log('\n— with a finger —');
  const f = await open(b, link(YEN), { touch: true, width: 390, height: 664 });
  await pointsUp(f);
  await calm(f);
  // the sheet covers the foot of the map: close it to reach the cities
  await f.evaluate(() => document.getElementById('info-close').click());
  await calm(f);
  const some = await reachable(f, ['sapporo', 'sendai', 'niigata', 'kanazawa', 'aomori', 'hakodate', 'otaru', 'morioka']);
  if (some) await press(f, some);
  card = await cardText(f);
  const want = some && f.evaluate(id => [...document.querySelectorAll('#tbl-points .tbl-pt')].some(g => g.getAttribute('data-id') === id), some.id);
  const label = some && (YEN.rows.find(r => r.id === some.id) || {}).label;
  // on a phone the head is what a first tap shows: the label and its figure
  check('a tap on a circle answers with the city, and the table stays', !!some && (await want) && !!label && card.includes(label + ' ·')
    && await f.evaluate(() => !!document.getElementById('tbl-bar')), (some && some.id) + ' ' + card.slice(0, 200));
  const bar = await f.evaluate(() => {
    const e = document.getElementById('tbl-bar').getBoundingClientRect();
    return { l: e.left, r: e.right, w: innerWidth };
  });
  check('  the bar is on the screen', bar.l >= 0 && bar.r <= bar.w, JSON.stringify(bar));
  await f.close();

  await b.close();
  report();
})().catch(e => { console.error(e); process.exit(1); });
