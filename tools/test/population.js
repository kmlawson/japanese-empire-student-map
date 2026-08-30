/* What was counted, and the map of it.
 *
 *     node tools/test/population.js       # with a server on 8123
 *
 * Three things, and the second and third are the ones that would go wrong
 * quietly:
 *
 *   * the figures reach the card and the shading reaches the map, from
 *     data/population/ and not from anything written into texts/;
 *   * **the shading survives the pointer.** The lift a hovered country gets is
 *     a resolved colour set on the group, and a custom property inherits: the
 *     first cut read `--lit` before `--c`, so putting the pointer anywhere on
 *     Korea turned all five classes back into the red of Korea. Both are
 *     measured here, at rest and under the pointer;
 *   * **a shaded province answers for itself with Administrative off.** The
 *     reader asked for thirteen units, not for every division of every
 *     country, and a choropleth whose units cannot be pointed at is a picture.
 *     Checked with a mouse and with a finger, where it takes two taps.
 *
 * And the fourteen 府 of colonial Korea, which are drawn at every zoom on both
 * dates: the one thing a reader looking at the peninsula should not have to
 * hunt for is the towns.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('population test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const SHIM = () => { const o = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} } : o.call(window, q)); };

const KOREA = 'http://localhost:8123/index.html?where=123.5,32.8,132.5,43.5';
const CITIES = ['seoul', 'incheon', 'kaesong', 'kunsan', 'mokpo', 'taegu',
                'pusan', 'masan', 'pyongyang', 'nampo', 'sinuiju', 'wonsan',
                'hamhung', 'chongjin'];

const open = async (b, url, opts) => {
  const p = await b.newPage();
  if (!(opts && opts.touch)) await p.evaluateOnNewDocument(SHIM);
  await p.setViewport(opts && opts.touch
    ? { width: 390, height: 844, isMobile: true, hasTouch: true }
    : { width: 1280, height: 900 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2600);
  return p;
};

const spot = (p, sel, fx, fy) => p.evaluate((s, ax, ay) => {
  const e = document.querySelector(s);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: Math.round(r.x + r.width * ax), y: Math.round(r.y + r.height * ay) };
}, sel, fx === undefined ? 0.5 : fx, fy === undefined ? 0.5 : fy);

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  /* ---- the shading, from a link that asks for it ------------------- */
  console.log('\n— the choropleth —');
  let p = await open(b, KOREA + '&layers=hra0ht');
  const shaded = await p.evaluate(() => {
    const els = [...document.querySelectorAll('path.pop-shaded')];
    const fill = {};
    els.forEach(e => { fill[e.getAttribute('data-prov')] = getComputedStyle(e).fill; });
    return { n: els.length, fill,
             admin: !!document.querySelector('#jmap.admin-on'),
             checked: (document.querySelector('#opt-pop-korea-density-density') || {}).checked };
  });
  // thirteen provinces and Cheju, which carries Zenranan-dō's figures
  check('a link shades fourteen units', shaded.n === 14, String(shaded.n));
  check('and does it with Administrative off', !shaded.admin);
  check('the panel row agrees with the link', shaded.checked === true);
  /* Three, on this date. The ladder is the *layer's* — pooled across 1930 and
     1942 — so that the same colour means the same thing on both maps, and no
     province in 1942 was under 50 or between 75 and 100. Fitted to 1942 alone
     the classes would spread better and mean something different on each map,
     which is the one thing a reader flipping between the dates must not meet. */
  check('the classes this date uses are its own colours',
    new Set(Object.values(shaded.fill)).size === 3,
    JSON.stringify(Object.values(shaded.fill).slice(0, 3)));
  check('the densest province is the deepest colour',
    shaded.fill.Keiki === 'rgb(31, 91, 143)', shaded.fill.Keiki);
  check('the emptiest is the palest this date reaches',
    shaded.fill.Kankyohoku === 'rgb(195, 214, 232)', shaded.fill.Kankyohoku);
  check('Cheju is shaded as the province it is counted in',
    shaded.fill.Saishu === shaded.fill.Zenranan,
    shaded.fill.Saishu + ' vs ' + shaded.fill.Zenranan);

  const key = await p.evaluate(() => (document.querySelector('#legend') || {}).textContent || '');
  check('the key gives the five classes and where they begin',
    /under 50/.test(key) && /50–75/.test(key) && /75–100/.test(key)
    && /100–150/.test(key) && /150 and over/.test(key), key.slice(-90));
  check('and whose figures they are', /朝鮮總督府/.test(key));

  /* The pointer must not repaint the data. */
  const at = await spot(p, '#a-korea path[data-prov="Keiki"]');
  await p.mouse.move(at.x - 40, at.y);
  await sleep(150);
  await p.mouse.move(at.x, at.y);
  await sleep(450);
  const under = await p.evaluate(() => {
    const out = {};
    document.querySelectorAll('path.pop-shaded').forEach(e => {
      out[e.getAttribute('data-prov')] = getComputedStyle(e).fill;
    });
    return { fill: out,
             tip: (document.querySelector('#tooltip') || {}).textContent || '' };
  });
  check('hovering the country leaves the other classes alone',
    under.fill.Kankyohoku === shaded.fill.Kankyohoku
    && under.fill.Zenrahoku === shaded.fill.Zenrahoku,
    under.fill.Kankyohoku);
  check('and the province under the pointer is named without Administrative',
    /Ky.nggi|Keiki/.test(under.tip), under.tip.slice(0, 60));
  check('and its figures are in the tooltip',
    /2,830,778/.test(under.tip) && /Per km²: 224/.test(under.tip),
    under.tip.slice(-60));

  /* ---- the card ---------------------------------------------------- */
  console.log('\n— the card —');
  await p.mouse.click(at.x, at.y);
  await sleep(600);
  const card = await p.evaluate(() => {
    const h = document.querySelector('#info-pop');
    const blocks = [...h.querySelectorAll('.pop-block')].map(b => ({
      head: (b.querySelector('.pop-head') || {}).textContent || '',
      rows: [...b.querySelectorAll('.pop-row')].map(r => r.textContent.trim()),
      groups: [...b.querySelectorAll('.pop-group-head')].map(g => g.textContent),
    }));
    return { hidden: h.hidden, blocks: blocks,
             order: [...document.querySelector('#info').children]
               .map(e => e.id || e.className),
             head: (h.querySelector('.pop-head') || {}).textContent || '',
             src: (h.querySelector('.pop-src') || {}).textContent || '',
             btn: (h.querySelector('.pop-btn') || {}).textContent || '' };
  });
  /* One block per date, oldest first, so the card reads down the way time
     runs. The 1942 estimate is four figures; the 1930 census counted the ages,
     the registers and the occupations as well. */
  check('a province card carries a block per date, in date order',
    card.blocks.length === 2 && /1930/.test(card.blocks[0].head)
    && /1942/.test(card.blocks[1].head),
    card.blocks.map(b => b.head).join(' | '));
  const y42 = card.blocks[1];
  check('population, sex ratio, share and density, in that order',
    y42.rows.length === 4
    && /^Population2,830,778$/.test(y42.rows[0].replace(/\s+/g, ''))
    && /100females101\.0$/.test(y42.rows[1].replace(/\s+/g, ''))
    && /Korea11\.7$/.test(y42.rows[2].replace(/\s+/g, ''))
    && /^Perkm²224/.test(y42.rows[3].replace(/\s+/g, '')),
    JSON.stringify(y42.rows));
  /* Everything else the census counted, a group to a heading, and none of it
     in the short description — that is a sentence. */
  check('the 1930 block groups the ages, the registers and the occupations',
    card.blocks[0].groups.join(' | ')
      === 'Ages | Register and nationality | Occupation',
    card.blocks[0].groups.join(' | '));
  const flat = card.blocks[0].rows.map(r => r.replace(/\s+/g, ''));
  check('with the figures under them',
    flat.indexOf('Japanese(naichijin)135,863') > -1
    && flat.indexOf('Agriculture545,687') > -1
    && flat.indexOf('0–14801,943') > -1,
    flat.slice(4, 9).join(' | '));
  /* Headed with the place, not with the table: every province card used to
     say "Korea" over figures that were the province's. */
  check('headed with the province and what was counted',
    card.blocks[0].head === 'Kyŏnggi-do (Keiki-dō), census of 1 October 1930'
    && card.blocks[1].head
       === 'Kyŏnggi-do (Keiki-dō), estimated population at 1 October 1942',
    card.head);
  /* And above the block about Chōsen. What the reader asked about comes first
     and what it belongs to comes after — the order the rest of the card is
     in. */
  check('the figures sit above the country block',
    card.order.indexOf('info-pop') > -1
    && card.order.indexOf('info-pop') < card.order.indexOf('note note-group'),
    card.order.join(' → '));
  check('and the source', /朝鮮總督府/.test(card.src));
  check('the button offers to put the map away, the shading being on',
    /Hide/.test(card.btn), card.btn);
  /* Pressing it must not disturb the card. `select` was being re-run, which
     rebuilds and collapses it — on a phone the sheet snapped shut on the
     reader and the province they had open was gone, so turning the shading
     back on meant finding it again. Only the block is redrawn now. */
  const kept = await p.evaluate(async () => {
    const b = document.querySelector('.pop-btn');
    b.click();
    await new Promise(r => setTimeout(r, 900));
    const after = {
      name: (document.querySelector('#info .primary') || {}).textContent,
      shaded: document.querySelectorAll('path.pop-shaded').length,
      btn: (document.querySelector('.pop-btn') || {}).textContent };
    document.querySelector('.pop-btn').click();
    await new Promise(r => setTimeout(r, 900));
    after.backOn = document.querySelectorAll('path.pop-shaded').length;
    after.backName = (document.querySelector('#info .primary') || {}).textContent;
    return after;
  });
  check('hiding it leaves the province selected and the card as it was',
    /Ky.nggi|Keiki/.test(kept.name) && kept.shaded === 0
    && /Provinces by/.test(kept.btn), JSON.stringify(kept));
  check('so the same button puts it straight back',
    kept.backOn === 14 && /Ky.nggi|Keiki/.test(kept.backName), JSON.stringify(kept));
  await p.close();

  /* ---- and the other way round: the card turns it on --------------- */
  /* Nothing switched on, so `#a-korea` is empty — the administrative sheet is
     fetched only when something asks for it, and until then Korea is its
     backing. That is what answers the pointer, and the country's card is where
     the offer has to be. */
  p = await open(b, KOREA + '&layers=1');
  const at2 = await spot(p, '#backings [data-for="korea"]', 0.5, 0.45);
  await p.mouse.move(at2.x - 40, at2.y); await sleep(150);
  await p.mouse.move(at2.x, at2.y); await sleep(400);
  await p.mouse.click(at2.x, at2.y);
  await sleep(600);
  const before = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    btn: (document.querySelector('.pop-btn') || {}).textContent || '',
    url: location.search,
    head: (document.querySelector('.pop-head') || {}).textContent,
    code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1] }));
  check('with nothing on, the card offers the map', /Provinces by Population/.test(before.btn),
        before.btn);
  check('and the colony-wide card is headed with the colony',
    before.head === 'Korea, census of 1 October 1930', before.head);
  check('and nothing is shaded yet', before.shaded === 0, String(before.shaded));
  await p.evaluate(() => document.querySelector('.pop-btn').click());
  await sleep(1600);
  const after = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    checked: (document.querySelector('#opt-pop-korea-density-density') || {}).checked,
    url: location.search,
    code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1],
    key: /under 50/.test((document.querySelector('#legend') || {}).textContent || '') }));
  check('pressing it shades the map', after.shaded === 14, String(after.shaded));
  check('ticks the row in the Layers panel', after.checked === true);
  check('writes itself into the layers code, with no parameter of its own',
    !/pop=/.test(after.url) && after.code !== before.code, after.url);
  check('and opens the key, which is what the colours mean', after.key);
  await p.close();

  /* ---- a finger --------------------------------------------------- */
  console.log('\n— with a finger —');
  p = await open(b, KOREA + '&layers=hra0ht', { touch: true });
  const at3 = await spot(p, '#a-korea path[data-prov="Heianhoku"]', 0.5, 0.45);
  await p.touchscreen.tap(at3.x, at3.y);
  await sleep(800);
  const tap1 = await p.evaluate(() => (document.querySelector('#info .primary') || {}).textContent);
  await p.touchscreen.tap(at3.x, at3.y);
  await sleep(800);
  const tap2 = await p.evaluate(() => ({
    name: (document.querySelector('#info .primary') || {}).textContent,
    figs: document.querySelector('#info-pop').textContent.replace(/\s+/g, ' ') }));
  check('the first tap names the country', /Ch.sen|Korea/.test(tap1), tap1);
  check('the second names the province under it',
    /Heianhoku|P.y.nganbuk/.test(tap2.name), tap2.name);
  check('and gives its figures', /1,728,627/.test(tap2.figs), tap2.figs.slice(0, 80));
  await p.close();

  /* ---- the fourteen 府 -------------------------------------------- */
  console.log('\n— the fourteen cities —');
  /* The weight each earns on its own date: over 300,000 large, over 100,000
     medium, under that small. The two dates differ because the cities grew —
     P'yŏngyang is 140,703 in the 1930 census and 286,000 by 1940, and four
     more cross 100,000 in between — so a test that expected one answer for
     both would be asking the map to ignore ten years. */
  const R = { big: '4.4', mid: '3.4', small: '2.5' };
  const WEIGHT = {
    e1930: { seoul: R.big, pusan: R.mid, pyongyang: R.mid },
    e1942: { seoul: R.big, pusan: R.mid, pyongyang: R.mid,
             chongjin: R.mid, taegu: R.mid, incheon: R.mid },
  };
  for (const [what, url, epoch] of [
        ['the whole map, 1942', '?layers=3', 'e1942'],
        ['the whole map, 1930', '?layers=2', 'e1930'],
        ['close in on Korea', '?where=123.5,32.8,132.5,43.5&layers=3', 'e1942']]) {
    const q = await open(b, 'http://localhost:8123/index.html' + url);
    const got = await q.evaluate(ids => {
      const out = {};
      ids.forEach(id => {
        const els = [...document.querySelectorAll('#gaz .gaz')]
          .filter(e => (e.getAttribute('data-id') || '').endsWith('_' + id));
        const vis = els.filter(e => e.style.display !== 'none');
        out[id] = vis.length
          ? (vis[0].querySelector('.dot') || {}).getAttribute('r') : null;
      });
      return out;
    }, CITIES);
    const missing = CITIES.filter(c => !got[c]);
    check(what + ': all fourteen are drawn', !missing.length, missing.join(', '));
    const want = WEIGHT[epoch];
    const wrong = CITIES.filter(c => got[c] !== (want[c] || R.small));
    check(what + ': each is drawn at the weight its figures earn',
      !wrong.length,
      wrong.map(c => c + ' ' + got[c] + ' want ' + (want[c] || R.small)).join(', '));
    await q.close();
  }

  /* ---- the whole column, in a box ---------------------------------- */
  /* The card answers "what about this province"; the table answers "and how
     does it sit against the others", which needs the column at once. */
  console.log('\n— the population table —');
  p = await open(b, KOREA + '&layers=hra0ht');
  const spot2 = await spot(p, '#a-korea path[data-prov="Keiki"]');
  await p.mouse.move(spot2.x - 40, spot2.y); await sleep(150);
  await p.mouse.move(spot2.x, spot2.y); await sleep(400);
  await p.mouse.click(spot2.x, spot2.y); await sleep(600);
  const tbl = await p.evaluate(() => {
    document.querySelector('.pop-more').click();
    const d = document.querySelector('#dlg-table');
    // the first table in the box: the box also holds the group tables and,
    // under them, the two dates compared
    const rows = [...d.querySelectorAll('.pop-table')[0].querySelectorAll('tbody tr')];
    return { open: d.open, title: d.querySelector('.table-title').textContent,
             tab: d.querySelector('.table-open').hidden,
             head: (d.querySelector('.pop-head') || {}).textContent,
             n: rows.length,
             first: rows[0].textContent.replace(/\s+/g, ' ').trim(),
             order: rows.map(r => r.querySelector('th').textContent),
             here: (d.querySelector('tr.here th') || {}).textContent,
             note: [...d.querySelectorAll('.pop-note')]
               .map(n => n.textContent).filter(t => /^\*/.test(t)).join(' ') || '',
             src: (d.querySelector('.pop-src') || {}).textContent || '' };
  });
  check('the link opens the box', tbl.open === true && tbl.title === 'Population');
  check('with no "open in a tab": it is a table, not a page', tbl.tab === true);
  check('the whole first, then the provinces by size',
    /Ch.sen/.test(tbl.first) && /24,105,906/.test(tbl.first)
    && /^Kyŏnggi-do \(Keiki-dō/.test(tbl.order[1])
    && /Chūseihoku-dō/.test(tbl.order[13]),
    tbl.order.slice(0, 3).join(' | '));
  check('fourteen rows: the country and the thirteen', tbl.n === 14, String(tbl.n));
  /* The characters belong in a table, where there is room for them, and they
     go inside the bracket the reading is already in rather than opening a
     second one. */
  check('each name carries its characters in the same bracket',
    tbl.order.every(n => /[\u4e00-\u9fff]\)$/.test(n)),
    tbl.order.filter(n => !/[\u4e00-\u9fff]\)$/.test(n)).join(' | '));
  /* Cheju has no row. It has no figures of its own — it carried Zenranan-dō's
     — so a row for it is the same numbers twice, and in a column of provinces
     it reads as a fourteenth. Its card is where that belongs. */
  check('a place counted inside another has no row of its own',
    !tbl.order.some(n => /Cheju|Saish/.test(n)) && !tbl.note, tbl.note || tbl.order.join(' | '));
  check('the province the card was about is picked out', /Ky.nggi/.test(tbl.here), tbl.here);

  /* Each column is a question — which was biggest, which emptiest, where were
     there most men — and the answer is a sort. The whole is not one of the
     answers: Korea stays at the top, not in the running against its own
     provinces. */
  const sorted = await p.evaluate(async () => {
    const names = () => [...document.querySelectorAll('#dlg-table .pop-table tbody tr')]
      .map(r => r.querySelector('th').textContent.replace(/\s*\(.*/, ''));
    const heads = () => [...document.querySelectorAll('#dlg-table .pop-table thead th')]
      .map(t => t.getAttribute('aria-sort'));
    const press = async i => {
      document.querySelectorAll('#dlg-table .pop-sort')[i].click();
      await new Promise(r => setTimeout(r, 60));
    };
    const out = { start: names().slice(0, 2), startHeads: heads() };
    await press(5); out.dense = names().slice(0, 2); out.denseHeads = heads();
    await press(5); out.empty = names().slice(0, 2); out.emptyHeads = heads();
    await press(0); out.alpha = names().slice(0, 3);
    return out;
  });
  check('it opens sorted by population, biggest first',
    sorted.start[1] === 'Kyŏnggi-do' && sorted.startHeads[1] === 'descending',
    JSON.stringify(sorted.start));
  check('a column head sorts by it, and again turns it over',
    sorted.dense[1] === 'Kyŏnggi-do' && sorted.denseHeads[5] === 'descending'
    && sorted.empty[1] === 'Hamgyŏngbuk-to' && sorted.emptyHeads[5] === 'ascending',
    JSON.stringify([sorted.dense[1], sorted.empty[1]]));
  check('the whole stays at the top however it is sorted',
    sorted.start[0] === 'Chōsen' && sorted.dense[0] === 'Chōsen'
    && sorted.empty[0] === 'Chōsen' && sorted.alpha[0] === 'Chōsen',
    JSON.stringify([sorted.start[0], sorted.dense[0], sorted.empty[0], sorted.alpha[0]]));
  check('and the names sort as names',
    sorted.alpha[1] === 'Ch’ungch’ŏngbuk-to' && sorted.alpha[2] === 'Ch’ungch’ŏngnam-do',
    JSON.stringify(sorted.alpha));
  check('and the source is at the foot', /朝鮮總督府/.test(tbl.src), tbl.src);
  await p.close();

  /* On a phone the table is wider than the screen, and it has to scroll inside
     its own box: a table that pushes the page sideways takes the map with it. */
  p = await open(b, KOREA + '&layers=hra0ht', { touch: true });
  const atP = await spot(p, '#a-korea path[data-prov="Heianhoku"]', 0.5, 0.45);
  await p.touchscreen.tap(atP.x, atP.y); await sleep(700);
  await p.touchscreen.tap(atP.x, atP.y); await sleep(700);
  const phone = await p.evaluate(() => {
    const m = document.querySelector('#info .more'); if (m) m.click();
    document.querySelector('.pop-more').click();
    const d = document.querySelector('#dlg-table');
    const sc = d.querySelector('.pop-table-scroll');
    return { open: d.open, scrolls: sc.scrollWidth > sc.clientWidth,
             pageWide: document.documentElement.scrollWidth > window.innerWidth };
  });
  check('a finger opens it too', phone.open === true);
  check('the table scrolls inside its own box, not the page',
    phone.scrolls === true && phone.pageWide === false, JSON.stringify(phone));
  await p.close();

  /* ---- one layer, whichever date the reader is on ------------------- */
  /* The switch is the *layer* and a file in data/population/ is one date of
     it, so the panel offers "Korea Population Density" once. Switching to a
     date with no figures leaves the switch where the reader put it and says
     why nothing is shaded — a layer that silently draws nothing reads as
     broken. */
  console.log('\n— one switch, both dates —');
  p = await open(b, KOREA + '&layers=hra0ht');
  const on42 = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    key: (document.querySelector('#legend') || {}).textContent || '' }));
  check('the layers code alone brings the shading', on42.shaded === 14, String(on42.shaded));
  check('and the key names the year with the classes',
    /Korea Population Density 1942 — people per km²/.test(on42.key.replace(/\s+/g, ' ')),
    on42.key.slice(-80));
  await p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '1930');
    if (b) b.click();
  });
  await sleep(2500);
  const on30 = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    checked: (document.querySelector('#opt-pop-korea-density-density') || {}).checked,
    fill: (document.querySelector('#a-korea path[data-prov="Kankyohoku"]') || {})
            .style && getComputedStyle(
              document.querySelector('#a-korea path[data-prov="Kankyohoku"]')).fill,
    key: (document.querySelector('#legend') || {}).textContent || '' }));
  check('the other date shades from its own census', on30.shaded === 14, String(on30.shaded));
  check('the switch stays where it was put',
    on30.checked === true, String(on30.checked));
  check('the key names that date and its source',
    /Korea Population Density 1930/.test(on30.key.replace(/\s+/g, ' '))
    && /朝鮮國勢調査報告/.test(on30.key), on30.key.slice(-80));
  /* The same ladder, so a province that is pale on one map and deep on the
     other has actually changed. Kankyŏngbuk-to is 37 per km² in 1930 and 55 in
     1942 — the palest class and then the one above it. */
  check('and the ladder is the layer\'s, not the date\'s',
    on30.fill === 'rgb(238, 243, 248)', on30.fill);
  check('the classes read the same on both maps',
    /under 50/.test(on30.key) && /150 and over/.test(on30.key), on30.key.slice(-60));
  await p.close();

  /* The parameter this travelled as for one update still opens a link. */
  p = await open(b, KOREA + '&layers=1&pop=korea-1942');
  const legacy = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    url: location.search }));
  check('a link written with pop= still opens shaded', legacy.shaded === 14,
        String(legacy.shaded));
  check('and the address is rewritten without it', !/pop=/.test(legacy.url), legacy.url);
  await p.close();

  /* ---- the census beside the estimate, and the cities --------------- */
  console.log('\n— two dates, and the fourteen 府 —');
  p = await open(b, KOREA + '&layers=hra0ht');
  const at42 = await spot(p, '#a-korea path[data-prov="Keiki"]');
  await p.mouse.move(at42.x - 40, at42.y); await sleep(150);
  await p.mouse.move(at42.x, at42.y); await sleep(400);
  await p.mouse.click(at42.x, at42.y); await sleep(600);
  const box = await p.evaluate(() => {
    document.querySelector('.pop-more').click();
    const d = document.querySelector('#dlg-table');
    return { head: d.querySelector('.pop-head').textContent,
             note: (d.querySelector('.pop-note') || {}).textContent || '',
             tables: d.querySelectorAll('.pop-table').length,
             groups: [...d.querySelectorAll('.pop-group-head')].map(g => g.textContent),
             switches: [...d.querySelectorAll('.pop-switch button')].map(x => x.textContent),
             cmp: (d.querySelector('.pop-compare .pop-head') || {}).textContent || '',
             cmpRow: (d.querySelector('.pop-compare tbody tr') || {}).textContent || '' };
  });
  /* Asked for: the reader should be told what kind of number the 1942 column
     is before they read it against a census. */
  check('the 1942 table says what its figures are',
    /Government-General estimates/.test(box.note), box.note.slice(0, 60));
  check('the estimate has no groups to show, being four figures',
    box.groups.length === 0, box.groups.join(' | '));
  check('the other tables are offered at the foot',
    box.switches.length === 2 && box.switches.some(t => /1930/.test(t))
    && box.switches.some(t => /府/.test(t)), box.switches.join(' | '));
  /* And under them the two dates on what they share. Only what they share: a
     comparison is worth no more than its narrowest column. */
  check('and the two dates are compared below', /1930 and 1942 compared/.test(box.cmp),
        box.cmp);
  check('with the change worked out',
    /21,058,305/.test(box.cmpRow) && /24,105,906/.test(box.cmpRow)
    && /\+3,047,601/.test(box.cmpRow) && /\+14\.5%/.test(box.cmpRow),
    box.cmpRow.replace(/\s+/g, ' ').slice(0, 90));

  // and the switch at the foot moves to the census, which has its groups
  const to30 = await p.evaluate(() => {
    [...document.querySelectorAll('.pop-switch button')]
      .filter(x => /census of 1 October 1930/.test(x.textContent))[0].click();
    const d = document.querySelector('#dlg-table');
    return { head: d.querySelector('.pop-head').textContent,
             tables: d.querySelectorAll('.pop-table').length,
             groups: [...d.querySelectorAll('.pop-group-head')].map(g => g.textContent) };
  });
  check('the foot switches the table to the other date',
    /census of 1 October 1930/.test(to30.head), to30.head);
  check('and the census brings a table for each thing it counted',
    to30.tables === 5
    && to30.groups.join(' | ') === 'Ages | Register and nationality | Occupation',
    to30.tables + ' — ' + to30.groups.join(' | '));
  await p.close();

  /* A city carries the same three groups, and its own table of the fourteen. */
  p = await open(b, KOREA + '&layers=2');
  const city = await p.evaluate(() => {
    const g = [...document.querySelectorAll('#gaz .gaz')]
      .find(e => (e.getAttribute('data-id') || '').endsWith('_kaesong')
                 && e.style.display !== 'none');
    const r = g.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await p.mouse.move(city.x - 30, city.y); await sleep(150);
  await p.mouse.move(city.x, city.y); await sleep(350);
  await p.mouse.click(city.x, city.y); await sleep(600);
  const cityCard = await p.evaluate(() => {
    const h = document.querySelector('#info-pop');
    return { name: document.querySelector('#info .primary').textContent,
             head: (h.querySelector('.pop-head') || {}).textContent,
             groups: [...h.querySelectorAll('.pop-group-head')].map(g => g.textContent),
             rows: [...h.querySelectorAll('.pop-row')].map(r => r.textContent.replace(/\s+/g, '')),
             shade: !!h.querySelector('.pop-btn') };
  });
  /* The gazetteer's id carries the date — g_e1930_kaesong — and the figures are
     the city's, so the date comes off before they are looked up. */
  check('a city card finds its census figures',
    /Kaes.ng/.test(cityCard.head) && cityCard.rows.indexOf('Population49,520') > -1,
    cityCard.head);
  check('with the register and the occupations under it',
    cityCard.groups.join(' | ') === 'Ages | Register and nationality | Occupation',
    cityCard.groups.join(' | '));
  check('and no offer to shade the map: a city is not a province',
    cityCard.shade === false);
  const cityTbl = await p.evaluate(() => {
    document.querySelector('.pop-more').click();
    const d = document.querySelector('#dlg-table');
    const rows = [...d.querySelectorAll('.pop-table')[0].querySelectorAll('tbody tr')];
    return { head: d.querySelector('.pop-head').textContent,
             tables: d.querySelectorAll('.pop-table').length,
             n: rows.length,
             first: rows[0].textContent.replace(/\s+/g, ' '),
             here: (d.querySelector('tr.here th') || {}).textContent,
             cmp: !!d.querySelector('.pop-compare') };
  });
  check('the fourteen 府 have a table of their own',
    /fourteen 府/.test(cityTbl.head) && cityTbl.n === 15 && cityTbl.tables === 4,
    cityTbl.head + ' — ' + cityTbl.n + ' rows, ' + cityTbl.tables + ' tables');
  check('with the fourteen together at the top',
    /All fourteen/.test(cityTbl.first) && /1,189,791/.test(cityTbl.first),
    cityTbl.first.slice(0, 60));
  check('the city the card was about picked out',
    /Kaes.ng/.test(cityTbl.here), cityTbl.here);
  check('and nothing compared, there being one date',
    cityTbl.cmp === false);
  await p.close();

  /* ---- and the marker drawn over the dot ---------------------------- */
  /* Four of the fourteen are also curated sites with prose of their own, and
     the curated marker is drawn over the gazetteer dot. At a flat 5.5 it
     covered the weights up: Keijō, Pusan, Inch'ŏn and P'yŏngyang came out as
     four identical circles. */
  console.log('\n— the marker over the dot —');
  for (const [what, url, want] of [
        ['1942', '?where=124.5,33.2,131.5,43.2&layers=3',
         { seoul: '4.4', pusan: '3.4', incheon: '3.4', pyongyang: '3.4' }],
        ['1930', '?where=124.5,33.2,131.5,43.2&layers=2',
         { seoul: '4.4', pusan: '3.4', incheon: '2.5', pyongyang: '3.4' }]]) {
    const q = await open(b, 'http://localhost:8123/index.html' + url);
    const got = await q.evaluate(ids => {
      const out = {};
      ids.forEach(id => {
        const d = document.querySelector('#s-' + id + ' circle.dot');
        out[id] = d ? d.getAttribute('r') : null;
      });
      out.tokyo = (document.querySelector('#s-tokyo circle.dot') || {}).getAttribute('r');
      out.dam = (function () {
        const g = document.querySelector('#s-supung');
        const m = g && g.querySelector('.dot');
        return m ? m.tagName + ':' + (m.getAttribute('width') || m.getAttribute('r')) : null;
      })();
      return out;
    }, Object.keys(want));
    check(what + ': the curated marker takes the pinned weight',
      Object.keys(want).every(k => got[k] === want[k]), JSON.stringify(got));
    check(what + ': a curated city with no pin is untouched', got.tokyo === '5.5', got.tokyo);
    /* The Suihō dam was filed as a city, so it drew the 5.5 city circle and
       was the largest thing on the peninsula — a dam outranking Keijō. */
    check(what + ': the Suihō dam is a place of interest, not a city',
      got.dam === 'rect:5', got.dam);
    await q.close();
  }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
