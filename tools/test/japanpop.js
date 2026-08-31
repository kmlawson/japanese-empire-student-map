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
      ages: [j.x.age_0_14_pm, j.x.age_15_59_pm, j.x.age_60p_pm],
      // every row's three shares, to be summed
      sums: subs.concat(['japan']).map(k => {
        const x = d.rows[k].x;
        return (x.age_0_14_pm || 0) + (x.age_15_59_pm || 0) + (x.age_60p_pm || 0);
      }),
      shimane: [d.rows.Shimane.x.age_0_14_pm, d.rows.Shimane.x.age_60p_pm],
      born: j.x,
    };
  });
  check('Japan proper is 101.03 men to a hundred women', more.mf === '101.03', more.mf);
  /* The spread is the reading: Tōkyō pulling men in, Nagano sending them out. */
  check('and the spread is there — Tōkyō 111.83, Nagano 94.07',
    more.tokyoMF === '111.83' && more.naganoMF === '94.07',
    more.tokyoMF + ' / ' + more.naganoMF);
  /* Transcribed as far as 愛知; the rest of p25 has not been read yet, and a
     blank field is simply left off a card. When the page arrives this number
     goes to 47 and the check should be changed with it. */
  check('twenty-three prefectures have it so far', more.withMF === 23,
    String(more.withMF));

  check('the age groups are the source\'s per-thousand shares',
    more.ages.join(' ') === '366 560 74', more.ages.join(' '));
  /* Forty-eight rows of three rounded shares. All of them within one of a
     thousand is what says the reading is right — it cannot happen by accident,
     and it is the same check that was made before anything was drawn. */
  check('and all forty-eight rows sum to 1,000 within the rounding',
    more.sums.length === 48 && more.sums.every(v => v >= 999 && v <= 1001),
    more.sums.filter(v => v < 999 || v > 1001).join(' ') || 'none out');
  check('Shimane is the oldest and Tōkyō the youngest',
    more.shimane[1] === 111 && more.ages[2] === 74, more.shimane.join('/'));

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
  await p.close();

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
    /Ages per 1,000/.test(table), table.slice(0, 240));
  await p.close();

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
