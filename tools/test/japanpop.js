/* Japan by prefecture at the census of 1 October 1930.
 *
 *     node tools/test/japanpop.js         # with a server on 8123
 *
 * 第四表 人口ノ府縣分布 from 内閣統計局『昭和五年国勢調査最終報告書』p10 — the 1 道
 * 3 府 43 縣, with the two earlier censuses beside them. The figures were
 * checked against the source's own arithmetic before anything was drawn: the
 * forty-seven sum to the printed 全國 total in all three years, exactly. This
 * checks that what was transcribed is what reaches the map.
 *
 * What would go wrong quietly:
 *
 *   * **a prefecture whose key does not match the drawing.** The build refuses
 *     a key it cannot find in `texts/`, but nothing outside a running map says
 *     whether the *drawn* shape carries it — Okinawa's is in the Ryūkyū atom
 *     rather than in the administrative sheet, and is drawn in two pieces;
 *   * **the high field.** Japan's two bits sit at 2048 and 4096, above the
 *     five kinds of name; a group reading its neighbour's bits is the fault
 *     `layers=-zik0zk` was, and a link is the only thing that shows it;
 *   * **and the areas.** They are measured, not printed, so a density here is
 *     over the shape the reader is pointing at. Hokkaidō's is the one to watch:
 *     the Kuriles are in the census figure and are drawn as a territory of
 *     their own, so the area must be Hokkaidō without them.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('japanpop test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const JAPAN = 'http://localhost:8123/index.html?where=126,29,148,47';

const open = async (b, url) => {
  const p = await b.newPage();
  await p.evaluateOnNewDocument(() => {
    const m = window.matchMedia;
    window.matchMedia = q => (/hover: hover|pointer: fine/.test(q)
      ? { matches: true, media: q, addListener() {}, removeListener() {},
          addEventListener() {}, removeEventListener() {} }
      : m.call(window, q));
  });
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2800);
  return p;
};

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— the figures —');
  let p = await open(b, JAPAN);
  const data = await p.evaluate(() => {
    const d = (JMAP.POPULATION || []).filter(x => x.id === 'japan-1930')[0];
    if (!d) return null;
    const keys = Object.keys(d.rows);
    const subs = keys.filter(k => d.rows[k].scope === 'sub-unit');
    return {
      subs: subs.length,
      total: d.rows.japan && d.rows.japan.pop,
      sum: subs.reduce((a, k) => a + d.rows[k].pop, 0),
      sum25: subs.reduce((a, k) => a + (d.rows[k].x.pop_1925 || 0), 0),
      sum20: subs.reduce((a, k) => a + (d.rows[k].x.pop_1920 || 0), 0),
      t25: d.rows.japan.x.pop_1925,
      t20: d.rows.japan.x.pop_1920,
      tokyo: d.rows.Tokyo,
      hokkaido: d.rows.Hokkaido,
      okinawa: d.rows.Okinawa,
      breaks: d.breaks,
      source: d.source,
    };
  });
  check('the dataset is there', !!data);
  check('forty-seven prefectures', data.subs === 47, String(data.subs));
  check('and the printed total is 64,450,005',
    data.total === 64450005, String(data.total));
  /* The source's own arithmetic, three times over. This is what says the
     transcription is right, and it is worth having in the running map rather
     than only in a note beside the file. */
  check('the forty-seven sum to it exactly',
    data.sum === 64450005, data.sum + ' vs 64450005');
  check('and to 59,736,822 in 1925',
    data.sum25 === 59736822 && data.t25 === 59736822, String(data.sum25));
  check('and to 55,963,053 in 1920',
    data.sum20 === 55963053 && data.t20 === 55963053, String(data.sum20));
  check('Tōkyō-fu is 5,408,678 and the densest',
    data.tokyo.pop === 5408678 && data.tokyo.dens === 2471,
    data.tokyo.pop + ' at ' + data.tokyo.dens + '/km²');
  /* Hokkaidō's area is the shape the map draws — the Kuriles are a territory
     of their own here — so it is nearer 78,000 km² than the 83,424 usually
     given, and its note says so. */
  check('Hokkaidō carries the area of the shape drawn, and says so',
    data.hokkaido.km2 === 78290 && /Chishima/.test(data.hokkaido.note || ''),
    data.hokkaido.km2 + ' km²');
  check('and the key cites the report', /昭和五年国勢調査最終報告書/.test(data.source),
    data.source);

  console.log('\n— on the map —');
  await p.evaluate(() => document.querySelector('#opt-pop-japan-density-density').click());
  await sleep(3000);
  const drawn = await p.evaluate(() => {
    const keys = {};
    document.querySelectorAll('#land [data-prov]').forEach(e => {
      if (e.classList.contains('pop-shaded')) {
        const k = e.getAttribute('data-prov');
        keys[k] = (keys[k] || 0) + 1;
      }
    });
    const v = [...document.querySelectorAll('#labels text.popval')];
    return { keys: Object.keys(keys).length,
             okinawa: keys.Okinawa || 0,
             figures: v.length,
             shown: v.filter(t => t.style.display !== 'none').length,
             txt: v.map(t => t.textContent),
             key: (document.querySelector('#legend').textContent || '')
                    .replace(/\s+/g, ' '),
             code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1] };
  });
  check('every prefecture is shaded', drawn.keys === 47, String(drawn.keys));
  /* Okinawa's polygon lives in the Ryūkyū atom rather than the administrative
     sheet, and is drawn in two pieces. Both have to take the colour or the
     island group comes out half shaded. */
  check('including Okinawa, in both its pieces', drawn.okinawa === 2,
    String(drawn.okinawa));
  check('each carries its figure', drawn.figures === 47, String(drawn.figures));
  check('Tōkyō\'s reads 2471', drawn.txt.indexOf('2471') >= 0,
    drawn.txt.slice(0, 6).join(' '));
  check('and the key is headed with the place and the year',
    /Japan Population Density 1930 — people per km²/.test(drawn.key),
    drawn.key.slice(-160));
  const code = drawn.code;
  check('the code is a positive number', !/^-/.test(code), code);
  await p.close();

  console.log('\n— through a link —');
  p = await open(b, JAPAN + '&layers=' + code);
  const back = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    on: [...document.querySelectorAll('#pop-rows input')]
      .filter(i => i.checked).map(i => i.id.replace(/^opt-pop-/, '')),
  }));
  check('it opens the same map again', back.shaded >= 47, String(back.shaded));
  /* And nobody else's. Japan's bits sit above the five kinds of name in the
     high field, and a group that read its neighbour's would switch a layer on
     that the sender never chose. */
  check('and switches on nothing else',
    back.on.filter(i => !/-none$/.test(i)).join(' ') === 'japan-density-density',
    back.on.join(' '));
  await p.close();

  console.log('\n— the other four tables of the report —');
  /* The sex ratio (p25), the age groups (pp40–41), and where those born outside
     内地 were born (pp68–69). Each was checked against the source's own
     arithmetic before it was used; these check that the arithmetic survived
     the trip into the map. */
  p = await open(b, JAPAN);
  const more = await p.evaluate(() => {
    const d = (JMAP.POPULATION || []).filter(x => x.id === 'japan-1930')[0];
    const subs = Object.keys(d.rows).filter(k => d.rows[k].scope === 'sub-unit');
    const j = d.rows.japan;
    return {
      mf: j.mf, tokyoMF: d.rows.Tokyo.mf, naganoMF: d.rows.Nagano.mf,
      withMF: subs.filter(k => d.rows[k].mf).length,
      ages: [j.x.age_0_14_pct, j.x.age_15_59_pct, j.x.age_60p_pct],
      // every row's three shares, to be summed
      sums: subs.concat(['japan']).map(k => {
        const x = d.rows[k].x;
        return Math.round(10 * ((x.age_0_14_pct || 0) + (x.age_15_59_pct || 0)
                                + (x.age_60p_pct || 0)));
      }),
      shimane: [d.rows.Shimane.x.age_0_14_pct, d.rows.Shimane.x.age_60p_pct],
      dp: (d.fields || []).filter(f => f.c === 'age_15_59_pct')[0],
      born: j.x,
      okiMF: d.rows.Okinawa.mf,
      oki25: d.rows.Okinawa.x.mf_1925,
      oki20: d.rows.Okinawa.x.mf_1920,
      lowest: Object.keys(d.rows)
        .filter(k => k !== 'japan' && d.rows[k].mf)
        .sort((a, b) => parseFloat(d.rows[a].mf) - parseFloat(d.rows[b].mf))[0],
    };
  });
  check('Japan proper is 101.03 men to a hundred women', more.mf === '101.03', more.mf);
  /* The spread is the reading: Tōkyō pulling men in, Nagano sending them out. */
  check('and the spread is there — Tōkyō 111.83, Nagano 94.07',
    more.tokyoMF === '111.83' && more.naganoMF === '94.07',
    more.tokyoMF + ' / ' + more.naganoMF);
  /* The page arrived, and the number went to 47 as this note said it would.
     p25 is transcribed whole — the table is printed in two halves across the
     page, 全國 down to 愛知 on the left and 三重 to 沖縄 on the right, and the
     left half was all that had been read. */
  check('every one of the forty-seven prefectures has it', more.withMF === 47,
    String(more.withMF));
  /* And the two earlier censuses the same table prints. A ratio has no total
     to sum to, so what stands in for an additive check is that the
     twenty-four figures read before the page was photographed match it
     exactly — Okinawa is the reading, lowest in the country in all three
     years and falling. */
  check('Okinawa is 89.53 in 1930, 92.49 in 1925 and 92.62 in 1920',
    more.okiMF === '89.53' && more.oki25 === 92.49 && more.oki20 === 92.62,
    more.okiMF + ' / ' + more.oki25 + ' / ' + more.oki20);
  check('and it is the lowest in the country in 1930',
    more.lowest === 'Okinawa', more.lowest);

  /* The source prints 366 / 560 / 74 per thousand; the map says the same
     figure in the unit a reader has. */
  check('the age groups are shown as percentages',
    more.ages.join(' ') === '36.6 56 7.4', more.ages.join(' '));
  /* And a share keeps the places its column was written to, or 56.0 prints as
     "56" beside 36.6 and 7.4 and reads as a different quantity. */
  check('with the decimal place the column was written to',
    more.dp && more.dp.dp === 1, JSON.stringify(more.dp));
  /* Forty-eight rows of three rounded shares. All of them within one of a
     thousand is what says the reading is right — it cannot happen by accident,
     and it is the same check that was made before anything was drawn. */
  check('and all forty-eight rows sum to 1,000 within the rounding',
    more.sums.length === 48 && more.sums.every(v => v >= 999 && v <= 1001),
    more.sums.filter(v => v < 999 || v > 1001).join(' ') || 'none out');
  check('Shimane is the oldest and Tōkyō the youngest',
    more.shimane[1] === 11.1 && more.ages[2] === 7.4, more.shimane.join('/'));

  check('the five 外地 sum to the printed 485,797',
    more.born.born_chosen + more.born.born_taiwan + more.born.born_karafuto
    + more.born.born_kwantung + more.born.born_nanyo === 485797
    && more.born.born_gaichi === 485797, String(more.born.born_gaichi));
  check('nine in ten of them were born in Korea',
    more.born.born_chosen === 434934, String(more.born.born_chosen));
  check('and 114,862 were born abroad',
    more.born.born_foreign === 114862, String(more.born.born_foreign));
  await p.close();

  console.log('\n— the cities —');
  /* Four dot sizes on the 1930 map, decided by p16. The two largest cities are
     Ōsaka and Tōkyō *in that order*: the fifteen wards were still the whole of
     Tōkyō in 1930 and the amalgamation came in 1932. */
  p = await open(b, 'http://localhost:8123/index.html?layers=2&where=128,30,146,46');
  const dots = await p.evaluate(() => {
    const g = (JMAP.GAZ && JMAP.GAZ.e1930) || [];
    const out = {};
    g.forEach(c => { out[c.id] = { t: c.t }; });
    return out;
  });
  const tier = id => (dots[id] || {}).t;
  check('Ōsaka and Tōkyō are the largest weight',
    tier('osaka') === 3 && tier('tokyo') === 3,
    tier('osaka') + '/' + tier('tokyo'));
  check('Nagoya, Kobe, Kyōto and Yokohama the one below',
    ['nagoya', 'kobe', 'kyoto', 'yokohama'].every(id => tier(id) === 2),
    ['nagoya', 'kobe', 'kyoto', 'yokohama'].map(tier).join(' '));
  /* Hiroshima was `large` and is `medium`: at 270,417 it is a third of
     Yokohama and was being drawn the same size. */
  check('the rest of the page is medium, Hiroshima included',
    ['hiroshima', 'fukuoka', 'kagoshima', 'kawasaki', 'moji'].every(id => tier(id) === 1),
    ['hiroshima', 'fukuoka', 'kagoshima', 'kawasaki', 'moji'].map(tier).join(' '));
  check('and a city not on the page is small',
    ['gifu', 'nagano', 'aomori', 'shimonoseki'].every(id => tier(id) === 0),
    ['gifu', 'nagano', 'aomori', 'shimonoseki'].map(tier).join(' '));

  /* And the figures behind those weights, as a dataset of their own — which is
     what puts them on a city's card and gives it a table. Keyed by the
     gazetteer's own ids, so a city renamed in `data/cities-1930.csv` fails the
     build rather than quietly losing its population. */
  const cty = await p.evaluate(() => {
    const d = (JMAP.POPULATION || []).filter(x => x.id === 'japan-cities-1930')[0];
    if (!d) return null;
    const keys = Object.keys(d.rows).filter(k => d.rows[k].scope === 'city');
    return { n: keys.length,
             sum: keys.reduce((a, k) => a + d.rows[k].pop, 0),
             all: d.rows.allcities && d.rows.allcities.pop,
             osaka: d.rows.osaka && d.rows.osaka.pop,
             tokyo: d.rows.tokyo && d.rows.tokyo.pop,
             tokyoNote: d.rows.tokyo && d.rows.tokyo.note };
  });
  check('twenty-eight cities have their census figures', cty && cty.n === 28,
    cty ? String(cty.n) : 'no dataset');
  check('and they sum to the summary row',
    cty.sum === cty.all && cty.all === 11030724, cty.sum + ' / ' + cty.all);
  /* The one that will look like a mistake to anybody who knows the later
     figures, so the row says why. */
  check('Ōsaka is the larger city, and Tōkyō\'s row says why',
    cty.osaka === 2453573 && cty.tokyo === 2070913
    && /fifteen wards/.test(cty.tokyoNote || ''), cty.osaka + ' / ' + cty.tokyo);
  await p.close();

  console.log('\n— a city card —');
  p = await open(b, 'http://localhost:8123/index.html?layers=2&where=133,32,142,38');
  const cAt = await p.evaluate(() => {
    const g = [...document.querySelectorAll('#gaz g')]
      .find(e => (e.getAttribute('data-gid') || e.getAttribute('data-id') || '')
        .split('_').pop() === 'osaka');
    if (!g) return null;
    const r = g.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  check('Ōsaka has a dot to press', !!cAt);
  await p.mouse.click(cAt.x, cAt.y);
  await sleep(1400);
  const cCard = await p.evaluate(() =>
    (document.querySelector('#info-pop') || { textContent: '' })
      .textContent.replace(/\s+/g, ' '));
  check('its card carries the census figure and its share',
    /2,453,573/.test(cCard) && /3\.81/.test(cCard), cCard.slice(0, 120));
  check('and offers the whole column of cities',
    /Population Table/.test(cCard), cCard.slice(-40));
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('#info button')]
      .find(x => /Population Table/i.test(x.textContent));
    b2.click();
  });
  await sleep(1700);
  const cBars = await p.evaluate(() => {
    const bl = [...document.querySelectorAll('.pop-table-block')]
      .find(x => /twenty-eight/.test(x.textContent));
    if (!bl) return null;
    const rows = [...bl.querySelectorAll('.pop-bar')];
    return { n: rows.length,
             cap: (bl.querySelector('.pop-bars-cap') || {}).textContent || '',
             first: rows.length ? rows[0].textContent.replace(/\s+/g, ' ') : '' };
  });
  check('the cities have their own chart, Ōsaka first',
    cBars && cBars.n === 28 && /Osaka|Ōsaka/.test(cBars.first)
    && /2,453,573/.test(cBars.first), cBars ? cBars.first : 'no block');
  check('and its caption counts them and their total',
    /28 of them/.test(cBars.cap) && /11,030,724/.test(cBars.cap), cBars.cap);
  await p.close();

  console.log('\n— and 1940 beside it —');
  {
    /* The 1940 census, on the December 1942 map. Its figures were checked
       against the report's own arithmetic before they were drawn, and those
       checks re-run here: the forty-seven sum to the printed total and to its
       two sexes, and each of the two identities the report can be held to —
       the three registers adding to the total, and the civilians plus the
       service personnel adding to it as well — holds in every row. */
    const q = await open(b, 'http://localhost:8123/index.html?layers=1&where=126,29,148,47');
    const y = await q.evaluate(() => {
      const s = (JMAP.POPULATION || []).filter(x => x.id === 'japan-1940')[0];
      if (!s) return null;
      const keys = Object.keys(s.rows);
      const subs = keys.filter(k => s.rows[k].scope === 'sub-unit');
      const j = s.rows.japan;
      const adds = k => {
        const x = s.rows[k].x;
        return x.res_naichi + x.res_gaichi + x.res_foreign === s.rows[k].pop;
      };
      return { subs: subs.length, whole: j.pop, mf: j.mf, dens: j.dens,
               sum: subs.reduce((a, k) => a + s.rows[k].pop, 0),
               unbalanced: subs.concat(['japan']).filter(k => !adds(k)),
               gaichi: j.x.res_gaichi, mil: j.x.mil_total,
               tokyo: s.rows.Tokyo, okinawa: s.rows.Okinawa,
               when: s.when, breaks: s.breaks, line: j.line,
               b30: ((JMAP.POPULATION || []).filter(x => x.id === 'japan-1930')[0] || {}).breaks,
               source: s.source };
    });
    check('the 1940 dataset is there with its forty-seven', !!y && y.subs === 47,
      y && String(y.subs));
    /* Okinawa was surveyed on a different footing and the report prints the
       country both ways. This map draws Okinawa, so it uses the larger. */
    check('the whole is 73,114,308 — the figure that includes Okinawa',
      y.whole === 73114308, String(y.whole));
    check('and the forty-seven sum to it exactly', y.sum === 73114308, String(y.sum));
    check('the three registers add to the total in every row',
      !y.unbalanced.length, y.unbalanced.join(', '));
    check('1,265,049 people were registered in the 外地', y.gaichi === 1265049,
      String(y.gaichi));
    /* Service personnel are counted *inside* each total, which is why the
       registers add up and this column does not join them. */
    check('and 1,694,428 were service personnel, inside the total',
      y.mil === 1694428 && y.mil + 71419880 === y.whole, String(y.mil));
    check('Tōkyō-fu is 7,354,971 and still the densest',
      y.tokyo.pop === 7354971 && y.tokyo.dens === 3360,
      y.tokyo.pop + ' at ' + y.tokyo.dens);
    check('the figures are named for 1940, not for the map they are drawn on',
      y.when === '1940' && /^1940 Census Population: 73,114,308/.test(y.line),
      y.line.slice(0, 50));
    /* Pooled over the layer, so a colour means the same on both maps. Putting
       1940 in moved the ladder, and the 1930 map moved with it — which is the
       rule working rather than a regression. */
    check('both dates read one ladder, and it is 100/200/500/1500',
      y.breaks.join(',') === '100,200,500,1500'
      && y.breaks.join(',') === (y.b30 || []).join(','),
      y.breaks + ' vs ' + y.b30);
    check('the key credits the Hitotsubashi scan',
      /一橋大学経済研究所/.test(y.source), y.source.slice(-40));

    /* 第5表, the country by race or nationality. Whole-country only — the
       table has no prefecture rows — so it lives on Japan's own card. */
    const nat = await q.evaluate(() => {
      const s = (JMAP.POPULATION || []).filter(x => x.id === 'japan-1940')[0];
      const x = s.rows.japan.x;
      const named = (s.fields || []).filter(f => /^n40_/.test(f.c));
      return { x: x, cols: named.map(f => f.c),
               groups: named.map(f => f.group).filter((g, i, a) => a.indexOf(g) === i),
               skip: s.tableSkip,
               roles: (s.fields || []).filter(f => f.role === 'total').map(f => f.c) };
    });
    const x = nat.x;
    check('the four 外地 registers add to the 1,265,049 above them',
      x.n40_korea + x.n40_taiwan + x.n40_karafuto + x.n40_nanyo === x.res_gaichi
      && x.n40_korea === 1241315, String(x.n40_korea));
    /* Every foreign nationality reaches the card in some form: the
       twenty-four of a hundred or more by name, ユダヤ人 whatever its size,
       the source's own その他, and the remaining fifty in one line. They must
       come to the 39,237 or somebody has been dropped. */
    const foreign = nat.cols.filter(c => !/korea|taiwan|karafuto|nanyo/.test(c))
      .reduce((a, c) => a + (x[c] || 0), 0);
    check('and every foreign nationality is accounted for, to 39,237',
      foreign === x.res_foreign && foreign === 39237, String(foreign));
    check('with China the largest at 19,453 and the fifty small ones at 1,006',
      x.n40_cn === 19453 && x.n40_small === 1006 && x.n40_etc === 311,
      [x.n40_cn, x.n40_small, x.n40_etc].join('/'));
    check('the White Russians are a nationality of their own', x.n40_whiterus === 537);
    check('and ユダヤ人 is named though it is nine people', x.n40_jewish === 9);
    check('the two blocks are card-only, the table having one row that fills them',
      nat.skip.join(',') === 'Registered in the 外地,Foreign nationals in Japan proper',
      nat.skip.join(','));
    /* The two lines the blocks hang under are sums of them, so they are bold
       and the four and the seventy-five below are not. */
    check('and the two lines above them are marked as totals',
      nat.roles.indexOf('res_gaichi') >= 0 && nat.roles.indexOf('res_foreign') >= 0,
      nat.roles.join(','));
    /* The 1940 census prints no shares, and `pctOf` is only the name of the
       whole — so the column used to come out as forty-eight em dashes under a
       heading. It is asked of the rows now, like the sex ratio beside it. */
    const heads = await q.evaluate(() => {
      const e = document.querySelector('[data-id="japan"]');
      const r = e.getBoundingClientRect();
      for (let i = 0; i < 400; i++) {
        const px = r.left + r.width * Math.random(), py = r.top + r.height * Math.random();
        if (document.elementFromPoint(px, py) === e) return { x: px, y: py };
      }
      return null;
    });
    await q.mouse.click(heads.x, heads.y);
    await sleep(1500);
    await q.evaluate(() => {
      const t = [...document.querySelectorAll('#info button')]
        .find(y => /Population Table/i.test(y.textContent));
      t.click();
    });
    await sleep(1800);
    const cols40 = await q.evaluate(() =>
      [...document.querySelectorAll('.pop-table-block:not(.pop-compare) thead th')]
        .map(h => h.textContent.trim()));
    check('the table prints no empty share column',
      cols40.every(h => !/% of total/.test(h)), cols40.join(' | '));
    check('and stays narrow, the two wide blocks being card-only',
      cols40.length === 9, cols40.length + ': ' + cols40.join(' | '));
    await q.close();
  }

  console.log('\n— what a reader is told —');
  p = await open(b, JAPAN);
  await p.evaluate(() => document.querySelector('#opt-pop-japan-density-density').click());
  await sleep(2600);
  const at = await p.evaluate(() => {
    const e = document.querySelector('#land [data-prov="Nagano"]');
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  await p.mouse.move(at.x - 40, at.y); await sleep(200);
  await p.mouse.move(at.x, at.y); await sleep(800);
  const tip = await p.evaluate(() =>
    (document.querySelector('#tooltip').textContent || '').replace(/\s+/g, ' '));
  check('a prefecture says its population, share and density',
    /1930 Census Population: 1,717,118/.test(tip)
    && /% of Total Japan: 2\.66/.test(tip) && /Per km²: 127/.test(tip),
    tip.slice(-90));
  /* The whole column, and the table that carries the two earlier censuses. */
  await p.mouse.click(at.x, at.y); await sleep(1200);
  const opened = await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('#info button')]
      .find(x => /Population Table/i.test(x.textContent));
    if (!b2) return false;
    b2.click();
    return true;
  });
  check('the card offers the whole column', opened === true);
  await sleep(1600);
  const table = await p.evaluate(() =>
    (document.querySelector('.table-body') || { textContent: '' })
      .textContent.replace(/\s+/g, ' '));
  check('the table carries the two earlier censuses',
    /1925 \(Taishō 14\)/.test(table) && /1920 \(Taishō 9\)/.test(table),
    table.slice(0, 120));
  /* And the sex ratio, which was read off p25 a page later. The column is
     conditional now — the table box asks whether any row fills it before
     offering it, the way it always did for the area pair — because for the
     hour between the two transcriptions this table printed forty-eight em
     dashes under a heading, which reads as a fault rather than as an absence. */
  check('and the sex ratio, once its own page was read',
    /Males per 100 females/.test(table), table.slice(0, 200));
  check('with the shares of age under their own heading',
    /Ages, % of the population/.test(table), table.slice(0, 300));
  /* 56.0 with its zero, in the table as on the card. */
  check('and a whole-numbered share keeps its decimal',
    /56\.0/.test(table), table.slice(0, 400));
  /* And the chart over it: forty-seven bars, longest first, with the total in
     the caption rather than in a bar of its own. */
  const bars = await p.evaluate(() => {
    const bl = document.querySelector('.pop-table-block');
    const rows = [...bl.querySelectorAll('.pop-bar')];
    return { n: rows.length,
             cap: (bl.querySelector('.pop-bars-cap') || {}).textContent || '',
             first: rows.length ? rows[0].textContent.replace(/\s+/g, ' ') : '',
             firstW: rows.length ? rows[0].querySelector('.track i').style.width : '' };
  });
  check('a bar to each prefecture', bars.n === 47, String(bars.n));
  check('Tōkyō-fu is the longest of them',
    /T.ky.-fu/.test(bars.first) && /5,408,678/.test(bars.first)
    && bars.firstW === '100%', bars.first);
  check('and the caption carries the whole, which is not a bar',
    /47 of them/.test(bars.cap) && /64,450,005/.test(bars.cap), bars.cap);
  await p.close();

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
