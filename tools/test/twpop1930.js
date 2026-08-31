/* Taiwan at the end of 1930.
 *
 *     node tools/test/twpop1930.js        # with a server on 8123
 *
 * 昭和五年 臺灣總督府統計書, 第35表 戶口靜態總表 and 第37表 地方別現住人口,
 * pp. 28–37. The household registers at the end of 1930, not a census.
 *
 * The thing worth checking, and the reason this file exists rather than a line
 * in `taiwanpop.js`: **the 1930 return and the 1941 return count the 蕃地
 * differently, and the map draws it as a shape apart on both dates.**
 *
 * In 1941 the 高砂族 of the demarcated territory are counted *again* in the
 * district their ground lies in, so the district figures are over more ground
 * than the map gives them. In 1930 they are counted once, in a column of their
 * own, and the district figures leave them out — so the fifty-five drawn
 * districts and the 蕃地 tile the colony exactly, and that is checked here as
 * arithmetic rather than asserted in a note.
 *
 * What would go wrong quietly:
 *
 *   * **a prefecture read as the sum of its districts.** It is not: the
 *     difference is its 蕃人 column, and the five 州 are checked one at a time;
 *   * **the 蕃地 shaded.** It has a population and deliberately no area — the
 *     source gives the ground none — so a density over it would be over a
 *     figure this project measured for a different purpose;
 *   * **the ladder.** The classes are pooled over a group's dates, so putting
 *     1930 in moved 1941's. Both dates must be reading the same four breaks or
 *     a colour means two things.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('twpop1930 test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const TAIWAN = 'http://localhost:8123/index.html?where=118.5,21.5,123.2,25.9';

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

const SHU = ['TwShuTaihoku', 'TwShuShinchiku', 'TwShuTaichu', 'TwShuTainan', 'TwShuTakao'];
const CHO = ['TwTaito', 'TwKarenko', 'TwHoko'];

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— the figures —');
  let p = await open(b, TAIWAN);
  const d = await p.evaluate((SHU, CHO) => {
    const s = (JMAP.POPULATION || []).filter(x => x.id === 'taiwan-1930')[0];
    if (!s) return null;
    const keys = Object.keys(s.rows);
    const subs = keys.filter(k => s.rows[k].scope === 'sub-unit');
    const gun = subs.filter(k => s.rows[k].parent);
    const four = k => { const x = s.rows[k].x || {};
      return (x.reg_jp || 0) + (x.reg_tw || 0) + (x.reg_indig || 0) + (x.for_total || 0); };
    const kids = {};
    gun.forEach(k => { const p = s.rows[k].parent;
      kids[p] = (kids[p] || 0) + s.rows[k].pop; });
    return {
      rows: keys.length, subs: subs.length, gun: gun.length,
      total: s.rows.formosa.pop,
      fourWhole: four('formosa'),
      unbalanced: subs.concat(['formosa'])
        .filter(k => k !== 'TwBanchi' && four(k) !== s.rows[k].pop),
      tile: gun.reduce((a, k) => a + s.rows[k].pop, 0)
            + CHO.reduce((a, k) => a + s.rows[k].pop, 0)
            + s.rows.TwBanchi.pop,
      shu: SHU.map(k => ({ en: s.rows[k].en.split(' (')[0], pop: s.rows[k].pop,
                           indig: s.rows[k].x.reg_indig,
                           kids: kids[s.rows[k].en] })),
      banchi: s.rows.TwBanchi,
      taipei: s.rows.TwTaihoku,
      taito: s.rows.TwTaito,
      withArea: subs.filter(k => s.rows[k].km2).length,
      breaks: s.breaks,
      breaks41: ((JMAP.POPULATION || []).filter(x => x.id === 'taiwan-1941')[0] || {}).breaks,
      indigLabel: (s.fields || []).filter(f => f.c === 'reg_indig').map(f => f.label)[0],
      source: s.source,
      line: s.rows.formosa.line,
    };
  }, SHU, CHO);

  check('the dataset is there', !!d);
  check('sixty-two rows: the colony, eight jurisdictions, fifty-two districts and the 蕃地',
    d.rows === 62 && d.subs === 61 && d.gun === 52,
    d.rows + ' / ' + d.subs + ' / ' + d.gun);
  check('the colony is 4,679,066', d.total === 4679066, String(d.total));
  check('and its four categories add to it',
    d.fourWhole === 4679066, String(d.fourWhole));
  check('as do every other row\'s', !d.unbalanced.length, d.unbalanced.join(', '));
  /* The check this dataset exists for. Fifty-two 市 and 郡, three 廳 drawn
     outside the demarcated ground, and the 蕃地 itself: the shapes the map
     draws, and they come to the colony with nothing left over and nothing
     counted twice. */
  check('the fifty-five drawn districts and the 蕃地 tile the colony exactly',
    d.tile === 4679066, d.tile + ' vs 4679066');
  d.shu.forEach(s => {
    check(s.en + ': its districts come to the prefecture less its 蕃人',
      s.kids === s.pop - s.indig,
      s.kids + ' vs ' + (s.pop - s.indig));
  });
  /* It has people and no ground of its own — the source gives the demarcated
     territory no area — so there is no density and it is drawn blank. It is
     *not* marked `apart`, which the 1941 row is: in 1930 these people are
     counted here and in no district, so the row is a part of the colony and
     takes a bar in the chart below. */
  check('the 蕃地 carries 86,154, no density, and is a part rather than apart',
    d.banchi.pop === 86154 && !d.banchi.dens && !d.banchi.apart,
    d.banchi.pop + ' / ' + d.banchi.dens + ' / ' + d.banchi.apart);
  check('and says the 1930 return counts them once',
    /counts them here and nowhere else/.test(d.banchi.note || ''), d.banchi.note);
  check('Taihoku-shi is 240,435 at 5,116 per km²',
    d.taipei.pop === 240435 && d.taipei.dens === 5116,
    d.taipei.pop + ' at ' + d.taipei.dens);
  /* Taitō is the prefecture *outside* the 蕃地 — the coastal shelf the map
     draws — so its figure is the smaller one and its note carries the other. */
  check('Taitō-chō is the 47,542 of the ground drawn, with 59,335 in the note',
    d.taito.pop === 47542 && /59,335/.test(d.taito.note || ''),
    d.taito.pop + ' — ' + (d.taito.note || '').slice(0, 60));
  check('fifty-five units carry an area', d.withArea === 55, String(d.withArea));
  /* Pooled over the group, so the two dates are comparable. Putting 1930 in
     moved 1941's ladder, which is the intended behaviour and not a regression:
     what must never happen is the two disagreeing. */
  check('both dates read the same four breaks',
    d.breaks.join(',') === d.breaks41.join(','),
    d.breaks + ' vs ' + d.breaks41);
  check('the Indigenous column is named in English with the source\'s own word',
    d.indigLabel === 'Indigenous Peoples 「蕃人」', d.indigLabel);
  check('the key cites the statistical book',
    /臺灣總督府統計書/.test(d.source), d.source);
  check('and the line calls it a resident population, not a census',
    /1930 Resident Population: 4,679,066/.test(d.line), d.line);

  console.log('\n— on the map —');
  await p.evaluate(() => document.querySelector('#opt-pop-taiwan-density-density').click());
  await sleep(3000);
  const drawn = await p.evaluate(() => {
    const fill = {};
    document.querySelectorAll('path.pop-shaded').forEach(e => {
      const k = e.getAttribute('data-prov');
      if (k) fill[k] = getComputedStyle(e).fill;
    });
    return { shaded: Object.keys(fill).length,
             banchi: fill.TwBanchi,
             taipei: fill.TwTaihoku,
             figures: document.querySelectorAll('#labels text.popval').length,
             key: (document.querySelector('#legend').textContent || '').replace(/\s+/g, ' '),
             code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1] };
  });
  check('fifty-six shapes take the layer — the fifty-five districts and the 蕃地',
    drawn.shaded === 56, String(drawn.shaded));
  /* The 蕃地 takes the *blank*, which is the whole of the point: it has 86,154
     people and no ground of its own to divide them by, so it is drawn as the
     key's "no data" white rather than given a band it has not earned. */
  check('and the 蕃地 is the white one, not a band',
    drawn.banchi === 'rgb(255, 255, 255)' && drawn.taipei !== drawn.banchi,
    drawn.banchi + ' vs ' + drawn.taipei);
  check('fifty-five figures, one to each district that has a density',
    drawn.figures === 55, String(drawn.figures));
  check('the key is headed with the place, the map and the year',
    /Taiwan Population Density 1930 — people per km²/.test(drawn.key),
    drawn.key.slice(0, 200));
  check('and gives the four breaks the two dates share',
    /under 100100–300300–10001000–25002500 and over/.test(drawn.key),
    drawn.key.slice(0, 260));
  check('the code is a positive number', !/^-/.test(drawn.code), drawn.code);
  await p.close();

  console.log('\n— through a link —');
  p = await open(b, TAIWAN + '&layers=' + drawn.code);
  const back = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    on: [...document.querySelectorAll('#pop-rows input')]
      .filter(i => i.checked).map(i => i.id.replace(/^opt-pop-/, '')),
  }));
  check('it opens the same map again', back.shaded >= 55, String(back.shaded));
  check('and switches on nothing else',
    back.on.filter(i => !/-none$/.test(i)).join(' ') === 'taiwan-density-density',
    back.on.join(' '));
  await p.close();

  console.log('\n— the chart over the table —');
  /* A bar is a share of the whole, so a container must not stand beside its
     own contents: the five 州 are in the table and out of the chart. What is
     left is the fifty-five drawn districts and the 蕃地, and they sum to the
     colony — which is the caption's claim, checked here by adding the bars
     up. The 1941 chart had the fault and is fixed with it. */
  p = await open(b, TAIWAN);
  const at = await p.evaluate(() => {
    const e = document.querySelector('[data-atom="taiwan"], [data-id="formosa"]');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await p.mouse.click(at.x, at.y);
  await sleep(1400);
  const card = await p.evaluate(() =>
    (document.querySelector('#info-pop') || { textContent: '' })
      .textContent.replace(/\s+/g, ' '));
  check('the colony card carries the four categories',
    /4,679,066/.test(card) && /Indigenous Peoples 「蕃人」86,154/.test(card),
    card.slice(0, 140));
  await p.evaluate(() => {
    const x = [...document.querySelectorAll('#info button')]
      .find(y => /Population Table/i.test(y.textContent));
    x.click();
  });
  await sleep(1800);
  const chart = await p.evaluate(() => {
    const bl = document.querySelector('.pop-table-block');
    const bars = [...bl.querySelectorAll('.pop-bar')];
    const val = r => Number((r.querySelector('.vv') || { textContent: '0' })
      .textContent.replace(/,/g, ''));
    return { cap: (bl.querySelector('.pop-bars-cap') || {}).textContent || '',
             n: bars.length, sum: bars.reduce((a, r) => a + val(r), 0),
             first: (bars[0] || { textContent: '' }).textContent.replace(/\s+/g, ' '),
             rows: bl.querySelectorAll('tbody tr').length,
             shu: /Táinán-zhōu|Tainan-shū/.test(bl.querySelector('table').textContent) };
  });
  check('fifty-six bars: the districts and the 蕃地, and no prefecture among them',
    chart.n === 56, String(chart.n));
  check('and they add to the colony exactly', chart.sum === 4679066, String(chart.sum));
  check('which is what the caption says',
    /56 of them, 4,679,066 in all/.test(chart.cap), chart.cap);
  check('Taihoku-shi is the longest', /240,435/.test(chart.first), chart.first);
  /* The 州 stay in the *table* — a reader looks a district up and reads it
     against its prefecture — and only the chart leaves them out. */
  check('the prefectures are still in the table below', chart.shu && chart.rows === 62,
    String(chart.rows));

  console.log('\n— the two dates set against each other —');
  /* `popCompare` used to require `pctOf` as well as a shared group, and
     Taiwan prints no share — the source gives none — so the island had two
     tables and nothing setting them against one another. The group alone says
     these are two dates of one thing, which is all it needs to know. */
  const cmp = await p.evaluate(() => {
    const c = document.querySelector('.pop-compare');
    if (!c) return null;
    const rows = [...c.querySelectorAll('tbody tr')]
      .map(t => [...t.children].map(td => td.textContent.trim()));
    return { head: (c.querySelector('.pop-head') || {}).textContent,
             cols: [...c.querySelectorAll('thead th')].map(h => h.textContent.trim()),
             notes: [...c.querySelectorAll('.pop-note')].map(n => n.textContent),
             n: rows.length,
             banchi: rows.some(r => /蕃地|Aborigine/.test(r[0])),
             taito: rows.filter(r => /臺東廳/.test(r[0]))[0],
             taihoku: rows.filter(r => /臺北市/.test(r[0]))[0],
             whole: rows.filter(r => /^Taiwan \(Formosa/.test(r[0]))[0] };
  });
  check('the province table carries a comparison', !!cmp);
  /* Named for the years the *figures* are of. The later Taiwan return is the
     register at the end of 1941 and is drawn on the December 1942 map; a
     column headed 1942 over it would be wrong by a year in a table whose
     whole subject is the difference between two years. */
  check('headed 1930 and 1941, not 1930 and 1942',
    cmp.head === '1930 and 1941 compared', cmp.head);
  check('and its columns say the same', cmp.cols[1] === '1930 population ↓'
    && cmp.cols[2] === '1941 population', cmp.cols.join(' | '));
  check('the note names both returns rather than calling one a census',
    /resident population at the end of 1930 against the resident population at the end of 1941/
      .test(cmp.notes[0]) && !/is a census/.test(cmp.notes[0]), cmp.notes[0]);
  check('and warns that the two count the 蕃地 differently',
    cmp.notes.some(n => /do not count the Government-General’s demarcated 「蕃地」 the same way/.test(n)),
    cmp.notes.join(' // ').slice(0, 120));
  /* 蕃地 is out of it: 86,154 in 1930 is the people of that ground and 159,594
     in 1941 is every 高砂族 in the colony, and subtracting one from the other
     would be a number about nothing. */
  check('sixty-one rows, the 蕃地 not among them', cmp.n === 61 && !cmp.banchi,
    cmp.n + ' / ' + cmp.banchi);
  check('the colony grows 4,679,066 to 6,249,468, +33.6%',
    cmp.whole[1] === '4,679,066' && cmp.whole[2] === '6,249,468'
    && cmp.whole[4] === '+33.6%', cmp.whole.join(' | '));
  check('Taihoku-shi 240,435 to 367,213', cmp.taihoku[1] === '240,435'
    && cmp.taihoku[2] === '367,213', cmp.taihoku.join(' | '));
  /* The row this needed fixing for. Printed as they stand the two figures make
     Taitō grow 96%, nearly all of it the demarcated ground changing sides:
     1930's row is the coastal shelf the map draws and 1941's the whole
     prefecture. The dataset gives the figure that compares, and the sex ratio
     of that same population, and the row says so with a dagger. */
  check('Taitō is compared whole-prefecture to whole-prefecture, not 47,542 to 93,138',
    cmp.taito[1] === '59,335' && cmp.taito[2] === '93,138' && cmp.taito[4] === '+57.0%',
    cmp.taito.join(' | '));
  check('with the sex ratio of that population, not of the drawn ground',
    cmp.taito[7] === '107.23', cmp.taito[7]);
  check('and no density, which would be over ground these figures are not of',
    cmp.taito[5] === '—' && cmp.taito[6] === '—', cmp.taito[5] + ' / ' + cmp.taito[6]);
  check('the row is marked and the mark is explained',
    /†/.test(cmp.taito[0])
    && cmp.notes.some(n => /^† .*臺東廳.*whole prefecture, 59,335/.test(n)),
    cmp.taito[0]);
  await p.close();

  console.log('\n— the seven 市 as places —');
  p = await open(b, TAIWAN);
  const c = await p.evaluate(() => {
    const s = (JMAP.POPULATION || []).filter(x => x.id === 'taiwan-cities-1930')[0];
    if (!s) return null;
    const keys = Object.keys(s.rows);
    return { n: keys.length, keys: keys.sort(),
             taipei: s.rows.taipei, kaohsiung: s.rows.kaohsiung,
             city: keys.every(k => s.rows[k].scope === 'city'),
             sum: keys.reduce((a, k) => a + s.rows[k].pop, 0) };
  });
  check('seven of them, all city rows', c && c.n === 7 && c.city, c && c.keys.join(','));
  check('and they are the seven the districts hold',
    c.keys.join(',') === 'chiayi,hsinchu,kaohsiung,keelung,taichung,tainan,taipei',
    c.keys.join(','));
  check('Taihoku 240,435 and Takao 62,633',
    c.taipei.pop === 240435 && c.kaohsiung.pop === 62633,
    c.taipei.pop + ' / ' + c.kaohsiung.pop);
  check('together 638,886', c.sum === 638886, String(c.sum));
  /* And the same figures on the dots. A card is where a reader meets a city,
     and Taiwan's carried nothing at all before this. */
  await p.close();

  p = await open(b, TAIWAN + '&layers=2');
  const at30 = await p.evaluate(() => {
    for (const e of document.querySelectorAll('#gaz g')) {
      const id = (e.getAttribute('data-gid') || e.getAttribute('data-id') || '');
      if (id.split('_').pop() !== 'taipei') continue;
      const r = e.getBoundingClientRect();
      if (r.width) return { x: Math.round(r.left + r.width / 2),
                            y: Math.round(r.top + r.height / 2) };
    }
    return null;
  });
  check('Taihoku has a dot on the 1930 map', !!at30);
  await p.mouse.click(at30.x, at30.y);
  await sleep(1400);
  const card30 = await p.evaluate(() =>
    (document.querySelector('#info-pop') || { textContent: '' })
      .textContent.replace(/\s+/g, ' '));
  check('and its card carries the 1930 register figure and the categories',
    /240,435/.test(card30) && /108\.50/.test(card30) && /Taiwanese154,694/.test(card30),
    card30.slice(0, 140));
  await p.close();

  console.log('\n— and the eleven 市 of 1941 —');
  /* The 1942 map had no city figures at all for Taiwan. Eleven now, four of
     them raised to 市 after the boundaries this map draws — so the *shape*
     under those dots is still the district with the city inside it, and the
     card has to say so or the dot and the polygon under it disagree by tens of
     thousands. */
  p = await open(b, TAIWAN + '&layers=3');
  const c41 = await p.evaluate(() => {
    const s = (JMAP.POPULATION || []).filter(x => x.id === 'taiwan-cities-1941')[0];
    if (!s) return null;
    const keys = Object.keys(s.rows);
    return { n: keys.length, keys: keys.sort(),
             sum: keys.reduce((a, k) => a + s.rows[k].pop, 0),
             taipei: s.rows.taipei, hualien: s.rows.hualien,
             group: s.group, when: s.when };
  });
  check('eleven of them', c41 && c41.n === 11, c41 && c41.keys.join(','));
  check('the four later 市 among them',
    ['yilan', 'changhua', 'pingtung', 'hualien'].every(k => c41.keys.indexOf(k) >= 0),
    c41.keys.join(','));
  check('together 1,294,943', c41.sum === 1294943, String(c41.sum));
  check('and they share a layer with 1930, so the two are compared',
    c41.group === 'taiwan-cities' && c41.when === '1941',
    c41.group + ' / ' + c41.when);
  check('Taihoku 367,213 with its five registers',
    c41.taipei.pop === 367213 && c41.taipei.x.reg_ko === 343
    && c41.taipei.x.for_cn === 13403, String(c41.taipei.pop));
  check('and Karenkō says its shape still holds the district',
    c41.hualien.pop === 36984 && /cut out of Karenkō-chō in 1940/.test(c41.hualien.note || ''),
    (c41.hualien.note || '').slice(0, 60));
  const at41 = await p.evaluate(() => {
    for (const e of document.querySelectorAll('#gaz g')) {
      const id = (e.getAttribute('data-gid') || e.getAttribute('data-id') || '');
      if (id.split('_').pop() !== 'hualien') continue;
      const r = e.getBoundingClientRect();
      if (r.width) return { x: Math.round(r.left + r.width / 2),
                            y: Math.round(r.top + r.height / 2) };
    }
    return null;
  });
  check('Karenkō has a dot on the 1942 map', !!at41);
  await p.mouse.click(at41.x, at41.y);
  await sleep(1400);
  const card41 = await p.evaluate(() =>
    (document.querySelector('#info-pop') || { textContent: '' })
      .textContent.replace(/\s+/g, ' '));
  check('and its card carries the 1941 figure, the registers and the warning',
    /36,984/.test(card41) && /Koreans96/.test(card41)
    && /cut out of Karenkō-chō in 1940/.test(card41), card41.slice(0, 160));
  await p.close();

  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
