/* A table of the empire's parts: places across the top, several parts, a series.
 *
 *     node tools/test/tableshapes.js      # needs a server on 8123
 *
 * The payload is 日本都市年鑑 1941, p0041_1, 我が版圖内各地の人口, sent the way
 * docs/table-links.md says the statistics site should send a table of that shape:
 * turned so that the places are the rows, its three parts as headings with levels,
 * `units: "territory"`, Japan proper as `naichi`. The figures are the transcription's.
 * Asked of it: Japan proper is every prefecture in one colour and answers as itself
 * from any of them; Taiwan answers by its record id; the key is the list of places;
 * a series shares a scale and the arrows step inside a part; the card groups the
 * columns; the file has every figure and its source. With a mouse, with a finger,
 * and at two zooms.
 *
 * It fetches nothing from the statistics site. */
'use strict';
const zlib = require('zlib');
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const encode = o => zlib.deflateRawSync(Buffer.from(JSON.stringify(o), 'utf8'), { level: 9 })
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const VIEW = '?where=110,0,160,52&layers=2w';
const link = o => VIEW + '#t=' + encode(o);

/* Generated from the tables site's data/japan-toshi-1941.json, p0041_1. */
const EMPIRE = {
  v: 1,
  src: {"url": "https://froginawell.net/reference/old-tables/book/japan-toshi-1941/#p0041_1", "path": "book/japan-toshi-1941/#p0041_1", "book": "japan-toshi-1941", "table": "p0041_1"},
  title: {"ja": "我が版圖内各地の人口", "en": "Population of the Various Parts of the Empire"},
  volume: {"title": "日本都市年鑑 1941", "year": "1941"},
  date: "1935",
  period: "1930",
  part: null,
  units: "territory",
  cols: [
    {"name": "人口 — 大正9年", "en": "Population — 1920 (Taishō 9)", "unit": "人", "kind": "count", "series": "population"},
    {"name": "人口 — 大正14年", "en": "Population — 1925 (Taishō 14)", "unit": "人", "kind": "count", "series": "population"},
    {"name": "人口 — 昭和5年", "en": "Population — 1930 (Shōwa 5)", "unit": "人", "kind": "count", "series": "population"},
    {"name": "人口 — 昭和10年", "en": "Population — 1935 (Shōwa 10)", "unit": "人", "kind": "count", "series": "population"},
    {"name": "増加數 — 大9～大14", "en": "Increase — 1920–1925", "unit": "人", "kind": "count", "color": "div"},
    {"name": "増加數 — 大14～昭5", "en": "Increase — 1925–1930", "unit": "人", "kind": "count", "color": "div"},
    {"name": "増加數 — 昭5～昭10", "en": "Increase — 1930–1935", "unit": "人", "kind": "count", "color": "div"},
    {"name": "増加數 — 大9～昭5", "en": "Increase — 1920–1930", "unit": "人", "kind": "count", "color": "div"},
    {"name": "増加數 — 大14～昭10", "en": "Increase — 1925–1935", "unit": "人", "kind": "count", "color": "div"},
    {"name": "増加數 — 大9～昭10", "en": "Increase — 1920–1935", "unit": "人", "kind": "count", "color": "div"},
    {"name": "増加率 (%) — 大9～大14 (5年)", "en": "Rate of increase — 1920–1925 (5 years)", "unit": "%", "kind": "rate", "series": "rate-5"},
    {"name": "増加率 (%) — 大14～昭5 (5年)", "en": "Rate of increase — 1925–1930 (5 years)", "unit": "%", "kind": "rate", "series": "rate-5"},
    {"name": "増加率 (%) — 昭5～昭10 (5年)", "en": "Rate of increase — 1930–1935 (5 years)", "unit": "%", "kind": "rate", "series": "rate-5"},
    {"name": "増加率 (%) — 大9～昭5 (10年)", "en": "Rate of increase — 1920–1930 (10 years)", "unit": "%", "kind": "rate", "series": "rate-10"},
    {"name": "増加率 (%) — 大14～昭10 (10年)", "en": "Rate of increase — 1925–1935 (10 years)", "unit": "%", "kind": "rate", "series": "rate-10"},
    {"name": "増加率 (%) — 大9～昭10 (15年)", "en": "Rate of increase — 1920–1935 (15 years)", "unit": "%", "kind": "rate", "series": "rate-15"},
  ],
  def: 15,
  rows: [
    {"id": "naichi", "label": "内地", "row": 0, "v": [55963053, 59736822, 64450005, 69254148, 3773769, 4713183, 4804143, 8486952, 9517326, 13291095, 6.7, 7.9, 7.5, 15.2, 15.9, 23.7]},
    {"id": "chosen", "label": "朝鮮*", "row": 1, "v": [17264119, 19522945, 21058305, 22899038, 2258826, 1535360, 1840733, 3794186, 3376093, 5634919, 13.1, 7.9, 8.7, 22.0, 17.3, 32.6]},
    {"id": "taiwan", "label": "臺灣", "row": 2, "v": [3655308, 3993408, 4592537, 5212426, 338100, 599129, 619889, 937229, 1219018, 1557118, 9.2, 15.0, 13.5, 25.6, 30.5, 42.6]},
    {"id": "karafuto", "label": "樺太", "row": 3, "v": [105899, 203754, 295196, 331944, 97855, 91442, 36748, 189297, 128190, 226045, 9.2, 44.9, 12.5, 178.8, 62.9, 213.5]},
    {"id": "kwantung", "label": "關東州及鐵道附屬地", "row": 4, "v": [919568, 1054074, 1328011, 1656726, 134506, 273937, 328715, 408443, 602652, 737158, 14.6, 26.0, 24.8, 44.4, 57.2, 80.2]},
    {"id": "nanyo", "label": "南洋群島", "row": 5, "v": [52222, 56294, 69626, 102537, 4072, 13332, 32911, 17404, 46243, 50315, 7.8, 23.7, 47.3, 33.3, 81.6, 95.8]},
  ],
  total: {"label": "總數", "row": null, "v": [76988379, 83456929, 90396043, 99456819, 6468550, 6939114, 9060776, 13407664, 15999890, 22468440, 8.4, 8.3, 8.1, 17.4, 17.1, 26.9], "mismatch": {"0": 77960169, "1": 84567297, "2": 91793680, "4": 6607128, "5": 7226383, "6": 7663139, "7": 13833511, "8": 14889522, "9": 21496650}},
  notes: ["Korea's 1920 figure is a register count, thought to leave many people out.", "The printed totals leave out Kwantung and the South Seas until 1935."],
};

/* 日本都市年鑑 1931, p0368_1: the parts down the side, the empire as the printed total,
   and a series printed newest first. */
const EMPIRE31 = {
  v: 1,
  src: {"url": "https://froginawell.net/reference/old-tables/book/japan-toshi-1931/#p0368_1", "path": "book/japan-toshi-1931/#p0368_1", "book": "japan-toshi-1931", "table": "p0368_1"},
  title: {"ja": "我が版圖内各地の世帯數及人口", "en": "Households and Population of Each Part of the Empire"},
  volume: {"title": "日本都市年鑑 1931", "year": "1931"},
  date: "1930-10-01",
  period: "1930",
  part: null,
  units: "territory",
  cols: [
    {"name": "世帶", "en": "Households", "unit": "世帶", "kind": "count"},
    {"name": "總數", "en": "Population, 1930", "unit": "人", "kind": "count", "series": "population", "date": "1930-10-01"},
    {"name": "男", "en": "Males, 1930", "unit": "人", "kind": "count"},
    {"name": "女", "en": "Females, 1930", "unit": "人", "kind": "count"},
    {"name": "大正14年", "en": "Population, 1925", "unit": "人", "kind": "count", "series": "population", "date": "1925-10-01"},
    {"name": "大正9年", "en": "Population, 1920", "unit": "人", "kind": "count", "series": "population", "date": "1920-10-01"},
  ],
  def: 1,
  rows: [
    {"id": "naichi", "label": "内地", "row": 1, "v": [12705896, 64447724, 32388369, 32059355, 59736822, 55963053]},
    {"id": "chosen", "label": "朝鮮", "row": 2, "v": [3987742, 21057969, 10763230, 10294739, 19522945, 17264119]},
    {"id": "taiwan", "label": "臺灣", "row": 3, "v": [809088, 4594161, 2354607, 2239554, 3993403, 3655308]},
    {"id": "karafuto", "label": "樺太", "row": 4, "v": [59877, 295187, 168527, 126659, 203754, 105899]},
    {"id": "kwantung", "label": "關東州及鐵道附屬地", "row": 5, "v": ["-", 1327971, 809173, 518798, 1054074, 919568]},
    {"id": "nanyo", "label": "南洋群島", "row": 6, "v": ["-", 69627, 37929, 31698, 56294, 52222]},
  ],
  total: {"label": "帝國", "en": "Empire", "row": 0, "v": [17562593, 90395041, 45674734, 44720307, 83456929, 76988379], "mismatch": {"0": 17562603, "1": 91792639, "2": 46521835, "3": 45270803, "4": 84567292, "5": 77960169}},
  notes: ["Korea's 1920 figure is from the registers."],
};

/* A count as skewed as the geisha table: Tōkyō far above the rest, which run over
   two orders of magnitude; a column with a nought, and one either side of it. */
const PREFS = ['Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki', 'Tochigi',
  'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano',
  'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane',
  'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki',
  'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'];
const SKEW_VALS = {};
PREFS.forEach((key, i) => { SKEW_VALS[key] = key === 'Tokyo' ? 6349 : Math.round(4 * Math.pow(1.12, i)); });
const SKEW = {
  v: 1, src: { url: 'https://kmlawson.github.io/playground-stat-tables/book/test/#p9', book: 'test', table: 'p9' },
  title: { ja: '藝妓本籍道府縣別', en: 'Skewed counts' }, volume: { title: 'test', year: '1935' },
  date: '1935', period: '1930', units: 'prefecture',
  cols: [{ name: 'a', en: 'Count', kind: 'count' }, { name: 'b', en: 'With a nought', kind: 'count' },
    { name: 'c', en: 'Either side', kind: 'count', color: 'div' }],
  def: 0,
  rows: PREFS.map((key, i) => ({ id: String(i + 1).padStart(2, '0'), label: key,
    v: [SKEW_VALS[key], i === 3 ? 0 : SKEW_VALS[key], i < 20 ? -i - 1 : i] })),
};

const fillOf = (p, sel) => p.evaluate(q => {
  const el = document.querySelector(q);
  return el ? el.style.getPropertyValue('--c') : null;
}, sel);
const tableUp = p => p.waitForFunction(() => !!document.querySelector('#land path.pop-shaded[data-prov="Tokyo"]'),
  { timeout: 30000 }).catch(() => {});
const cardText = p => p.evaluate(() => document.getElementById('info').innerText);
const keyText = p => p.evaluate(() => document.getElementById('legend').innerText);
/* A point really on a shape: a prefecture by key, or a colony's paths, where
   what is under the point is that shape or something else drawn in the same
   colony (Taiwan's 蕃地 lies over its prefectures). */
const pointOn = (p, sel) => p.evaluate(q => {
  const els = [...document.querySelectorAll(q)];
  els.sort((a, b) => b.getBBox().width * b.getBBox().height - a.getBBox().width * a.getBBox().height);
  for (const el of els.slice(0, 4)) {
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[.5, .5], [.4, .5], [.6, .5], [.5, .4], [.5, .6], [.3, .3], [.7, .7], [.4, .3], [.6, .7]]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      const atom = el.closest('#land > g, #land > path');
      if (hit === el || (/^#a-/.test(q) && atom && atom.contains(hit))) return { x, y };
    }
  }
  return null;
}, sel);
async function press(p, at) {
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(60);               // a press, not a flick
  await p.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(p);
}
async function hover(p, at) {
  await p.mouse.move(at.x - 3, at.y - 3);
  await p.mouse.move(at.x, at.y, { steps: 3 });
  await sleep(250);              // the tooltip's delay
  await calm(p);
  return p.evaluate(() => { const t = document.getElementById('tooltip'); return t ? t.innerText : ''; });
}
const NAGANO = '#land [data-prov="Nagano"]';
const KOREA = '#a-korea path';
const TAIWAN = '#a-taiwan path';

(async () => {
  const b = await launch({ downloads: true });

  console.log('\n— with a mouse —');
  const m = await open(b, link(EMPIRE), { width: 1280, height: 800 });
  await tableUp(m);
  await calm(m);
  let card = await cardText(m);
  check('the table opens, not the card saying it cannot', !/Table not shown/.test(card) && /Population of the Various Parts/.test(card), card.slice(0, 160));
  const fills = {
    nagano: await fillOf(m, NAGANO), tokyo: await fillOf(m, '#land [data-prov="Tokyo"]'),
    hokkaido: await fillOf(m, '#land [data-prov="Hokkaido"]'), okinawa: await fillOf(m, '#land [data-prov="Okinawa"]'),
    korea: await fillOf(m, KOREA), taiwan: await fillOf(m, TAIWAN), karafuto: await fillOf(m, '#a-karafuto path, path#a-karafuto'),
    kwantung: await fillOf(m, '#a-kwantung path, path#a-kwantung'), nanyo: await fillOf(m, '#a-nanyo path, path#a-nanyo'),
  };
  check('Japan proper is every prefecture in one colour', fills.nagano && fills.nagano === fills.tokyo
    && fills.tokyo === fills.hokkaido && fills.hokkaido === fills.okinawa, JSON.stringify(fills));
  check('  and each colony is shaded', ['korea', 'taiwan', 'karafuto', 'kwantung', 'nanyo'].every(k => fills[k]), JSON.stringify(fills));
  check('  the fastest-growing darkest, Japan proper lightest, 1920–1935',
    fills.karafuto === '#1f5b8f' && fills.nagano === '#dfeaf4', JSON.stringify(fills));
  check('  on the map’s own 1930 borders', await m.evaluate(() => document.querySelector('#epoch-seg button.on').getAttribute('data-epoch') === 'e1930'));
  check('no figures written on prefectures: they are not the rows', await m.evaluate(() => !document.querySelector('.popval')));
  check('no per-capita box: the map has no census for the parts', await m.evaluate(() => !document.querySelector('.tbl-pc')));
  check('the card says what the total is, for a rate', /Overall rate \(總數\): 26\.9/.test(card), card.slice(0, 400));
  check('  and lists every place', /Every place/i.test(card));

  let key = await keyText(m);
  const order = await m.evaluate(() => [...document.querySelectorAll('#legend .tbl-key-place')].map(e => e.getAttribute('data-place')));
  check('the key is the six places, highest first', order.join() === 'karafuto,nanyo,kwantung,taiwan,chosen,naichi', order.join());
  check('  each with its figure', /Karafuto 樺太\s*213\.5/.test(key) && /Japan proper 内地\s*23\.7/.test(key), key.slice(0, 300));
  check('  and no swatch for places it has no row for', !/No data/.test(key), key);

  /* The arrows step inside the part in use. */
  const bar = () => m.evaluate(() => ({
    prev: document.getElementById('tbl-prev').disabled, next: document.getElementById('tbl-next').disabled,
    now: document.querySelector('#tbl-menu-btn .now').textContent,
  }));
  let st = await bar();
  check('on the last rate, the next arrow is off and the previous is on', st.next && !st.prev, JSON.stringify(st));
  await m.click('#tbl-prev');
  await calm(m);
  st = await bar();
  check('  the previous arrow goes to the column before', /1925–1935 \(10 years\)/.test(st.now), st.now);
  key = await keyText(m);
  check('  a series of two shares its scale, and the key says so', /one scale with the other columns of its series/.test(key), key.slice(0, 200));

  // the menu: Population, 1920
  await m.click('#tbl-menu-btn');
  const groups = await m.evaluate(() => [...document.querySelectorAll('#tbl-menu summary')].map(s => s.firstChild.textContent));
  check('the menu folds by part, named in English', groups.join('|') === 'Population|Increase|Rate of increase', groups.join('|'));
  await m.evaluate(() => {
    const d = document.querySelector('#tbl-menu details');
    d.open = true;
  });
  await m.click('#tbl-menu .tbl-menu-item[data-col="0"]');
  await calm(m);
  st = await bar();
  check('a column chosen from the menu', /Population — 1920/.test(st.now) && st.prev && !st.next, JSON.stringify(st));
  const k1920 = await fillOf(m, TAIWAN);
  card = await cardText(m);
  check('in 1920 the card says the six do not add up to the printed total', /Printed total \(總數\): 76,988,379/.test(card)
    && /add up to 77,960,169/.test(card), card.slice(0, 400));
  const steps = [];
  for (let i = 0; i < 3; i++) {
    await m.click('#tbl-next');
    await calm(m);
    steps.push((await bar()).now);
  }
  check('the next arrow walks the series and stops at its end', /1925/.test(steps[0]) && /1930/.test(steps[1]) && /1935/.test(steps[2])
    && (await bar()).next, steps.join(' | '));
  const k1935 = await fillOf(m, TAIWAN);
  check('  on one scale, so Taiwan darkens as it grows, 3.7 to 5.2 million', k1920 !== k1935, k1920 + ' → ' + k1935);
  check('  and Japan proper stays at the top', await fillOf(m, NAGANO) === '#1f5b8f');
  card = await cardText(m);
  check('the printed total is given', /Printed total \(總數\): 99,456,819/.test(card), card.slice(0, 400));
  check('  with nothing about a sum: in 1935 the six add up to it', !/add up to/.test(card), card.slice(0, 400));

  /* Hover: the name over the tip is the prefecture's, so the tip says whose figure it is. */
  let at = await pointOn(m, NAGANO);
  let tip = await hover(m, at);
  check('hovering a prefecture gives Japan proper’s figure, and says so', /Japan proper/.test(tip) && /69,254,148/.test(tip), tip);
  at = await pointOn(m, TAIWAN);
  tip = at ? await hover(m, at) : '';
  check('hovering Taiwan gives Taiwan’s, by its own record', /臺灣/.test(tip) && /5,212,426/.test(tip), tip);

  at = await pointOn(m, NAGANO);
  await press(m, at);
  card = await cardText(m);
  check('pressing a prefecture opens Japan proper', /Japan proper/.test(card) && /Printed as: 内地/.test(card), card.slice(0, 200));
  const grouped = await m.evaluate(() => ({
    heads: [...document.querySelectorAll('#info .tbl-group')].map(e => e.textContent),
    values: document.querySelectorAll('#info .tbl-value').length,
    first: document.querySelector('#info .tbl-value .nm').textContent,
    outlined: document.querySelectorAll('.tbl-sel').length,
  }));
  check('  with its sixteen figures under their three parts', grouped.values === 16 && grouped.heads.join('|') === 'Population|Increase|Rate of increase', JSON.stringify(grouped));
  check('  each named without its part again', /^1920 \(Taishō 9\) \(人\)$/.test(grouped.first), grouped.first);
  check('  and forty-seven prefectures not outlined one by one', grouped.outlined === 0, String(grouped.outlined));
  check('  its share of the printed total', /69\.6% of the printed total/.test(card), card.slice(0, 600));

  await m.evaluate(() => document.querySelector('#legend .tbl-key-place[data-place="nanyo"]').click());
  await calm(m);
  card = await cardText(m);
  check('a place in the key is a press away: the South Seas, too small to aim at', /South Seas Islands/.test(card) && /102,537/.test(card), card.slice(0, 200));

  /* Further in: the shapes still answer, and the key is the same. */
  const before = await keyText(m);
  const kc = await pointOn(m, KOREA);
  for (let i = 0; i < 6; i++) { await m.mouse.move(kc.x, kc.y); await m.mouse.wheel({ deltaY: -200 }); }
  await calm(m);
  at = await pointOn(m, KOREA);
  if (at) await press(m, at);
  card = await cardText(m);
  check('zoomed in, Korea still answers', !!at && /Korea/.test(card) && /Printed as: 朝鮮\*/.test(card), card.slice(0, 160));
  check('  and the key has not changed', before === await keyText(m));

  await m.evaluate(() => [...document.querySelectorAll('#info-trains button')].find(x => /About this table/.test(x.textContent)).click());
  await calm(m);
  await m.evaluate(() => [...document.querySelectorAll('#info-trains button')].find(x => /All figures/.test(x.textContent)).click());
  await calm(m);
  const csv = await m.evaluate(() => new Promise(res => {
    const of = URL.createObjectURL;
    URL.createObjectURL = blob => { URL.createObjectURL = of; blob.text().then(res); return of.call(URL, blob); };
    document.querySelector('#dlg-table .pop-csv').click();
  }));
  const lines = csv.split(/\r?\n/);
  check('the file has a line per place', ['Japan proper', 'Korea', 'Taiwan', 'Karafuto', 'Kwantung', 'South Seas Islands']
    .every(n => lines.some(l => l.startsWith(n + ','))), lines.slice(0, 9).join(' / '));
  check('  the figures as numbers, and the source', lines.some(l => /^Japan proper,内地,.*69254148/.test(l)) && /Source.*p0041_1/.test(csv), csv.slice(0, 400));
  await m.close();

  console.log('\n— the empire as the total, and a series printed newest first —');
  const e = await open(b, link(EMPIRE31), { width: 1280, height: 800 });
  await tableUp(e);
  await calm(e);
  key = await keyText(e);
  check('the empire’s figure is in the key, by name', /Empire 帝國: 90,395,041 人/.test(key), key.slice(0, 400));
  card = await cardText(e);
  check('  and in the card, with what the six add up to', /Empire 帝國: 90,395,041/.test(card) && /add up to 91,792,639/.test(card), card.slice(0, 400));
  const eb = () => e.evaluate(() => ({ prev: document.getElementById('tbl-prev').disabled, next: document.getElementById('tbl-next').disabled,
    now: (s => s.options[s.selectedIndex].textContent)(document.getElementById('tbl-col')) }));
  st = await eb();
  check('1930 is the newest of the series: next is off', st.next && !st.prev && /1930/.test(st.now), JSON.stringify(st));
  await e.click('#tbl-prev');
  await calm(e);
  check('  and back goes to 1925, though 1925 is printed after 1930', /Population, 1925/.test((await eb()).now));
  check('  the key does not add the table’s date to a column that has its own', !/1925 \(人\), 1930/.test(await keyText(e)), (await keyText(e)).slice(0, 200));
  await e.click('#tbl-prev');
  await calm(e);
  st = await eb();
  check('  then 1920, where it stops', /Population, 1920/.test(st.now) && st.prev, JSON.stringify(st));
  await e.select('#tbl-col', '0');
  await calm(e);
  key = await keyText(e);
  st = await eb();
  check('outside a series the arrows walk the columns as printed', st.prev && !st.next && /Households/.test(st.now), JSON.stringify(st));
  check('a printed nil in the key says nil, not a figure', /Kwantung 關東州\s*— Nil/.test(key), key.slice(0, 400));
  await e.close();

  console.log('\n— how the classes are cut —');
  const k = await open(b, link(SKEW), { width: 1280, height: 800 });
  await tableUp(k);
  await calm(k);
  const picker = await k.evaluate(() => {
    const s = document.getElementById('tbl-classes');
    const about = [...document.querySelectorAll('#legend .cen-chip')].find(x => /About this table/.test(x.textContent));
    return s && { labels: [...s.options].map(o => o.textContent), at: s.value,
      before: !!about && s.parentNode === about.parentNode && s.nextElementSibling === about };
  });
  check('the key has the dropdown, left of About this table', picker && picker.before, JSON.stringify(picker));
  check('  with the four ways, quantiles first and chosen',
    picker && picker.labels.join('|') === 'Quantiles|Natural Breaks|Equal Intervals|Logarithmic' && picker.at === 'quantile', JSON.stringify(picker));
  /* Every place's class against its figure: a larger figure never in a lower class. */
  const classesNow = () => k.evaluate((ramp, vals) => {
    const at = c => ramp.indexOf(c);
    const got = Object.entries(vals).map(([key, v]) => {
      const el = document.querySelector('#land [data-prov="' + key + '"]');
      return [v, at(el.style.getPropertyValue('--c'))];
    });
    const sorted = got.slice().sort((a, b) => a[0] - b[0]);
    let ok = true;
    for (let i = 1; i < sorted.length; i++) if (sorted[i][1] < sorted[i - 1][1]) ok = false;
    const used = new Set(got.map(g => g[1]));
    const per = [0, 1, 2, 3, 4].map(i => got.filter(g => g[1] === i).length);
    return { ok, used: used.size, per, unknown: got.filter(g => g[1] < 0).length };
  }, ['#dfeaf4', '#c3d6e8', '#8fb4d4', '#5286b4', '#1f5b8f'], SKEW_VALS);
  const keyNums = () => k.evaluate(() => [...document.querySelectorAll('#legend .pop-key-row')]
    .map(r => r.textContent).filter(t => /under|over|–/.test(t)));
  const choose = async m => { await k.select('#tbl-classes', m); await calm(k); };
  let o = await classesNow();
  check('quantiles: about the same number in each class', o.ok && o.per.every(n => n >= 7 && n <= 12), JSON.stringify(o));
  await choose('equal');
  o = await classesNow();
  check('equal intervals: nearly everything in the first class, Tōkyō in the last', o.ok && o.per[0] >= 44 && o.per[4] === 1, JSON.stringify(o));
  check('  and the address says so', /&tk=equal/.test(await k.evaluate(() => location.hash)));
  check('  the key’s steps equal', (await keyNums()).join() === 'under 1,300,1,300–2,500,2,500–3,800,3,800–5,100,5,100 and over', (await keyNums()).join());
  await choose('jenks');
  o = await classesNow();
  check('natural breaks: in order, five classes, Tōkyō alone at the top', o.ok && o.used === 5 && o.per[4] === 1, JSON.stringify(o));
  await choose('log');
  o = await classesNow();
  const logs = await keyNums();
  check('logarithmic: in order, every class used', o.ok && o.used === 5, JSON.stringify(o));
  check('  cut at 1, 2 or 5 times a power of ten', logs.length === 5 && logs.join(' ').match(/[\d,]+/g)
    .every(n => /^[125]0*$/.test(n.replace(/,/g, ''))), logs.join(' | '));
  check('  the card and the hover follow the same classes', o.unknown === 0);
  // a reload keeps it
  const addr = await k.evaluate(() => location.href);
  await k.goto(addr, { waitUntil: 'domcontentloaded' });
  await tableUp(k);
  await calm(k);
  check('a reload, or the link sent on, keeps the method', await k.evaluate(() => document.getElementById('tbl-classes').value) === 'log');
  await k.select('#tbl-col', '1');
  await calm(k);
  const zero = await k.evaluate(() => {
    const s = document.getElementById('tbl-classes');
    return { off: s.querySelector('option[value="log"]').disabled, note: document.getElementById('legend').innerText };
  });
  check('a column with a nought cannot be logarithmic, and the key says what is shown instead',
    zero.off && /Logarithmic needs figures above nought, so quantiles are shown/.test(zero.note), JSON.stringify(zero).slice(0, 300));
  await k.select('#tbl-col', '2');
  await calm(k);
  check('a column split round nought has no dropdown', await k.evaluate(() => !document.getElementById('tbl-classes')));
  await k.evaluate(() => [...document.querySelectorAll('#legend .cen-chip')].find(x => /Remove/.test(x.textContent)).click());
  await calm(k);
  const left = await k.evaluate(() => location.hash);
  check('Remove takes the method out of the address with the table', !/t=|tk=/.test(left), left);
  await k.close();

  const kt = await open(b, link(SKEW) + '&tk=jenks', { touch: true, width: 390, height: 664 });
  await tableUp(kt);
  await calm(kt);
  check('a link with the method opens with it, on a phone', await kt.evaluate(() => document.getElementById('tbl-classes').value) === 'jenks');
  // on a phone the key gives way to the card's sheet: close the card to reach it
  await kt.evaluate(() => document.getElementById('info-close').click());
  await calm(kt);
  await kt.evaluate(() => { const l = document.getElementById('legend'); if (l.classList.contains('folded')) l.querySelector('.legend-head').click(); });
  await calm(kt);
  const sp = await kt.evaluate(() => {
    const r = document.getElementById('tbl-classes').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { on: !!hit && hit.id === 'tbl-classes', r: r.right, w: innerWidth, h: r.height };
  });
  check('  where the dropdown is on the screen and can be pressed', sp.on && sp.r <= sp.w, JSON.stringify(sp));
  await kt.select('#tbl-classes', 'equal');
  await calm(kt);
  check('  and changes the map', /&tk=equal/.test(await kt.evaluate(() => location.hash)));
  await kt.close();

  console.log('\n— what a kind of table may hold —');
  const mixed = Object.assign({}, EMPIRE, { rows: EMPIRE.rows.concat([{ id: '13', label: '東京', v: EMPIRE.cols.map(() => 1) }]) });
  const x = await open(b, link(mixed), { width: 1280, height: 800 });
  await tableUp(x);
  await calm(x);
  card = await cardText(x);
  check('a prefecture in a table of the parts is not placed', /1 row could not be placed/.test(card), card.slice(0, 500));
  await x.close();
  const pref = { v: 1, units: 'prefecture', src: EMPIRE.src, title: { ja: 'x' }, cols: [{ name: 'x', kind: 'count' }],
    rows: [{ id: '13', v: [5] }, { id: 'naichi', v: [9] }] };
  const y = await open(b, link(pref), { width: 1280, height: 800 });
  await tableUp(y);
  await calm(y);
  card = await cardText(y);
  check('  nor Japan proper in a table of prefectures', /1 row could not be placed/.test(card), card.slice(0, 300));
  check('  whose key still has no-data, and keeps its ranges', /No data/.test(await keyText(y)));
  await y.close();

  console.log('\n— with a finger —');
  const t = await open(b, link(EMPIRE), { touch: true, width: 390, height: 664 });
  await tableUp(t);
  await calm(t);
  const tb = await t.evaluate(() => {
    const e = document.getElementById('tbl-bar').getBoundingClientRect();
    const hit = id => { const r = document.getElementById(id).getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el && el.closest('#' + id) ? r.width : 0; };
    return { l: e.left, r: e.right, w: innerWidth, prev: hit('tbl-prev'), menu: hit('tbl-menu-btn'), next: hit('tbl-next') };
  });
  check('the bar is on the screen, the arrows and the menu each pressable',
    tb.l >= 0 && tb.r <= tb.w && tb.prev >= 32 && tb.next >= 32 && tb.menu >= 120, JSON.stringify(tb));
  await t.evaluate(() => document.getElementById('tbl-prev').click());
  await calm(t);
  check('  and an arrow steps', /1925–1935/.test(await t.evaluate(() => document.querySelector('#tbl-menu-btn .now').textContent)));
  at = await pointOn(t, KOREA);
  if (at) await press(t, at);
  card = await cardText(t);
  check('a first tap on Korea answers with Korea, and its figure', !!at && /Korea/.test(card) && /17\.3 %/.test(card), card.slice(0, 160));
  at = await pointOn(t, '#land [data-prov="Kumamoto"]');
  if (at) await press(t, at);
  card = await cardText(t);
  check('a tap on a prefecture answers with Japan proper', !!at && /Japan proper/.test(card) && /15\.9 %/.test(card), card.slice(0, 160));
  await t.close();

  await b.close();
  report();
})().catch(e => { console.error(e); process.exit(1); });
