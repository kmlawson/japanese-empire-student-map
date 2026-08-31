/* Manchukuo at the 1943 count.
 *
 *     node tools/test/manchupop.js        # with a server on 8123
 *
 * 滿洲國『臨時國勢調査報告』, 第一表 p5 and the density plate 第一圖 at the front,
 * with 第二表 pp6–7 for the nationalities. Every figure was checked against the
 * report's own arithmetic before it was drawn — the twenty rows sum to the
 * printed total and to the printed area, and both derived columns recompute
 * from the printed figures — and those checks re-run here.
 *
 * Three things about this dataset are unlike any other in the folder, and each
 * is a way it could go quietly wrong.
 *
 * **The map draws fourteen of the nineteen provinces.** Its Manchukuo is
 * traced from a 1935 sheet and five provinces were made out of those fourteen
 * afterwards, none from a single parent. So the five have no shape, and they
 * are in the table as `unmapped` rows — a scope that exists for exactly this:
 * a real place with real figures and nowhere on the map to put them. If they
 * were dropped instead, the fourteen would not sum to the whole and the chart
 * over the table would be captioned with a total its bars did not come to.
 *
 * **The classes are the report's own.** It drew this map itself, at 5, 20, 40
 * and 100 to the square kilometre, and the point of shading it is to reproduce
 * that rather than to fit a ladder. `breaks` in index.csv pins them.
 *
 * **The densities are the report's, over the report's areas.** A density
 * worked out over the polygon would be the 1943 population over the 1935
 * ground. And they need a decimal: Kōan-hoku is 0.8 to the square kilometre
 * and Kokka 1.3, and rounded to whole numbers both print 1.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('manchupop test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const WHERE = '&where=115,38,135,54';
const MANCHURIA = 'http://localhost:8123/index.html?layers=1' + WHERE;
// the same view, with whatever layer code is being tried
const withCode = code => 'http://localhost:8123/index.html?layers=' + code + WHERE;

const open = async (b, url) => {
  const p = await b.newPage();
  await p.evaluateOnNewDocument(() => {
    const m = window.matchMedia;
    window.matchMedia = q => (/hover: hover|pointer: fine/.test(q)
      ? { matches: true, media: q, addListener() {}, removeListener() {},
          addEventListener() {}, removeEventListener() {} }
      : m.call(window, q));
  });
  await p.setViewport({ width: 1400, height: 1000 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(3000);
  return p;
};

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— the figures —');
  let p = await open(b, MANCHURIA);
  const d = await p.evaluate(() => {
    const s = (JMAP.POPULATION || []).filter(x => x.id === 'manchukuo-1943')[0];
    if (!s) return null;
    const keys = Object.keys(s.rows);
    const parts = keys.filter(k => s.rows[k].scope !== 'territory');
    const w = s.rows.manchukuo;
    return {
      rows: keys.length,
      subs: keys.filter(k => s.rows[k].scope === 'sub-unit').length,
      unmapped: keys.filter(k => s.rows[k].scope === 'unmapped').length,
      cities: keys.filter(k => s.rows[k].scope === 'city').length,
      whole: w.pop, mf: w.mf, dens: w.dens, km2: w.km2,
      sum: parts.reduce((a, k) => a + s.rows[k].pop, 0),
      inMap: keys.filter(k => s.rows[k].scope === 'sub-unit')
        .reduce((a, k) => a + s.rows[k].pop, 0),
      nat: w.x,
      breaks: s.breaks, when: s.when, group: s.group,
      hoten: s.rows['Feng Tien'], kokka: s.rows.Heiho,
      kohoku: s.rows['Hsing An Peh'], shinkyo: s.rows.changchun,
      peian: s.rows.Peian,
      line: w.line, source: s.source,
    };
  });
  check('the dataset is there', !!d);
  check('twenty-one rows: the state, the capital, fourteen provinces drawn and five not',
    d.rows === 21 && d.subs === 14 && d.unmapped === 5 && d.cities === 1,
    [d.rows, d.subs, d.unmapped, d.cities].join('/'));
  check('the state is 43,202,880 at 123.9 men to a hundred women, 33 per km²',
    d.whole === 43202880 && d.mf === '123.9' && d.dens === 33, String(d.whole));
  /* The source's own arithmetic, in the running map rather than only in a note
     beside the file. */
  check('the twenty parts sum to it exactly', d.sum === 43202880, String(d.sum));
  check('and the printed area is 1,303,143 km²', d.km2 === 1303143, String(d.km2));
  check('the fourteen the map draws hold 35,140,793 of them',
    d.inMap === 35140793, String(d.inMap));
  /* The nationality table, which balances three ways over. */
  const n = d.nat;
  check('滿洲人 add from their five parts',
    n.nat_manchu + n.nat_han + n.nat_mongol + n.nat_hui + n.nat_other === n.nat_total
    && n.nat_total === 40858473, String(n.nat_total));
  check('日本人 from their three',
    n.nat_jp + n.nat_ko + n.nat_jp_other === n.nat_jp_total && n.nat_jp_total === 2271495,
    String(n.nat_jp_total));
  check('and the four together are the whole state',
    n.nat_total + n.nat_jp_total + n.nat_third + n.nat_stateless === 43202880);
  check('Koreans outnumber Japanese from the home islands',
    n.nat_ko === 1450384 && n.nat_jp === 819614, n.nat_ko + ' vs ' + n.nat_jp);
  check('and 69,180 people held no nationality at all', n.nat_stateless === 69180);

  console.log('\n— the report drew this map, so the map uses its classes —');
  check('five classes at 5, 20, 40 and 100', d.breaks.join(',') === '5,20,40,100',
    String(d.breaks));
  /* A density under ten keeps its decimal. Rounded to whole numbers Kōan-hoku
     (0.8) and Kokka (1.3) both print 1, and the map says the emptiest province
     in Manchuria is the same as one three times as full. */
  check('Kōan-hoku is 0.8 to the square kilometre and Kokka 1.3',
    d.kohoku.dens === 0.8 && d.kokka.dens === 1.3,
    d.kohoku.dens + ' / ' + d.kokka.dens);
  check('and Hōten, the fullest, is 152', d.hoten.dens === 152, String(d.hoten.dens));
  /* Not the polygon's area: that is the 1935 province and this is the 1943
     population. The report prints both, so neither has to be derived. */
  check('the densities are the report\'s, over the report\'s own areas',
    d.hoten.km2 === 49632 && d.kokka.km2 === 118899,
    d.hoten.km2 + ' / ' + d.kokka.km2);

  console.log('\n— the years —');
  /* The count is of 1943 and the map is December 1942. Naming the line and the
     key from the epoch put 1942 over figures that are not of 1942. */
  check('the dataset says its figures are of 1943', d.when === '1943', d.when);
  check('and the sentence a reader hovers says so too',
    /^1943 Census Population: 43,202,880/.test(d.line), d.line.slice(0, 60));
  check('the key cites the report', /臨時國勢調査報告/.test(d.source), d.source.slice(0, 40));

  console.log('\n— a province, and what its card admits —');
  check('Hōten-shō is 7,565,599', d.hoten.pop === 7565599, String(d.hoten.pop));
  check('and its card says the outline is 1935 and the figure 1943',
    /1935/.test(d.hoten.note || '') && /1943/.test(d.hoten.note || ''),
    (d.hoten.note || '').slice(0, 70));
  /* The six that lost no ground say nothing, there being nothing to say. */
  check('a province that did not change says nothing of the kind',
    !/1935/.test(d.kohoku.note || ''), d.kohoku.note || '(no note)');
  check('a province the map cannot draw is in the table and says so',
    d.peian.scope === 'unmapped' && d.peian.pop === 2318957
    && /no shape for it/.test(d.peian.note || ''), (d.peian.note || '').slice(0, 60));
  check('新京 is on the city point at 555,009, 1,268 to the km²',
    d.shinkyo.scope === 'city' && d.shinkyo.pop === 555009 && d.shinkyo.dens === 1268,
    String(d.shinkyo.pop));

  console.log('\n— on the map —');
  await p.evaluate(() => document.querySelector('#opt-pop-manchukuo-density-density').click());
  await sleep(3200);
  const drawn = await p.evaluate(() => {
    const fill = {};
    document.querySelectorAll('path.pop-shaded').forEach(e => {
      const k = e.getAttribute('data-prov'); if (k) fill[k] = 1;
    });
    return { shaded: Object.keys(fill).length,
             figures: [...document.querySelectorAll('#labels text.popval')]
               .map(t => t.textContent),
             key: (document.querySelector('#legend').textContent || '')
                    .replace(/\s+/g, ' '),
             code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1] };
  });
  check('fourteen provinces are shaded', drawn.shaded === 14, String(drawn.shaded));
  check('each carries its figure', drawn.figures.length === 14, String(drawn.figures.length));
  check('and the sparse ones keep their decimal on the map too',
    drawn.figures.indexOf('0.8') >= 0 && drawn.figures.indexOf('1.3') >= 0,
    drawn.figures.join(' '));
  check('the key is headed 1943, not 1942',
    /Manchukuo Population Density 1943 — people per km²/.test(drawn.key),
    drawn.key.slice(-200));
  check('and gives the report\'s five classes',
    /under 55–2020–4040–100100 and over/.test(drawn.key), drawn.key.slice(-200));
  check('the code is a positive number', !/^-/.test(drawn.code), drawn.code);
  await p.close();

  console.log('\n— through a link —');
  p = await open(b, withCode(drawn.code));
  const back = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    on: [...document.querySelectorAll('#pop-rows input')]
      .filter(i => i.checked).map(i => i.id.replace(/^opt-pop-/, '')),
  }));
  check('it opens the same map again', back.shaded >= 14, String(back.shaded));
  /* Manchukuo's two bits sit at 32768 and 65536, above the colour scheme. A
     group reading its neighbour's would switch on a layer nobody chose. */
  check('and switches on nothing else',
    back.on.filter(i => !/-none$/.test(i)).join(' ') === 'manchukuo-density-density',
    back.on.join(' '));
  await p.close();

  console.log('\n— the table —');
  /* The province outlines are the administrative sheet, which is fetched when
     something asks for it. Switching the shading on is what asks. */
  p = await open(b, MANCHURIA);
  await p.evaluate(() => document.querySelector('#opt-pop-manchukuo-density-density').click());
  await sleep(3200);
  const at = await p.evaluate(() => {
    const e = document.querySelector('[data-prov="Feng Tien"]');
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await p.mouse.click(at.x, at.y);
  await sleep(1400);
  const card = await p.evaluate(() =>
    (document.querySelector('#info-pop') || { textContent: '' })
      .textContent.replace(/\s+/g, ' '));
  check('a province card carries the population, the ratio and the density',
    /7,565,599/.test(card) && /118\.9/.test(card) && /152 \(49,632 km²\)/.test(card),
    card.slice(0, 120));
  await p.evaluate(() => {
    const x = [...document.querySelectorAll('#info button')]
      .find(y => /Population Table/i.test(y.textContent));
    x.click();
  });
  await sleep(1900);
  const box = await p.evaluate(() => {
    const bl = document.querySelector('.pop-table-block');
    const bars = [...bl.querySelectorAll('.pop-bar')];
    const val = r => Number((r.querySelector('.vv') || { textContent: '0' })
      .textContent.replace(/,/g, ''));
    return { rows: bl.querySelectorAll('tbody tr').length,
             bars: bars.length,
             sum: bars.reduce((a, r) => a + val(r), 0),
             cap: (bl.querySelector('.pop-bars-cap') || {}).textContent || '',
             text: bl.textContent.replace(/\s+/g, ' ') };
  });
  check('the table holds all twenty-one', box.rows === 21, String(box.rows));
  /* The five with no shape are what make this add up. Dropped, the bars would
     come to 35,140,793 under a caption saying 43,202,880. */
  check('twenty bars, and they come to the whole state',
    box.bars === 20 && box.sum === 43202880, box.bars + ' / ' + box.sum);
  check('which is what the caption says',
    /20 of them, 43,202,880 in all/.test(box.cap), box.cap);
  check('and the five with no shape are in it',
    /Hokuan|北安/.test(box.text) && /Shihei|四平/.test(box.text));
  await p.close();

  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
