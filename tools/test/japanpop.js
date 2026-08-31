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
  /* This source counted heads and did not count a sex, so the column that
     would have held it is left out rather than printed as forty-eight dashes. */
  check('and leaves out the column its source never counted',
    !/Males per 100 females/.test(table), table.slice(0, 160));
  await p.close();

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
