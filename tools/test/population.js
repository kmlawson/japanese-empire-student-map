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
             checked: (document.querySelector('#opt-pop-korea-density') || {}).checked };
  });
  // thirteen provinces and Cheju, which carries Zenranan-dō's figures
  check('a link shades fourteen units', shaded.n === 14, String(shaded.n));
  check('and does it with Administrative off', !shaded.admin);
  check('the panel row agrees with the link', shaded.checked === true);
  /* Four, not five. The ladder gives 75–100 and nothing in Korea sat there:
     the gap between 69 and 111 per km² is the mountains and the paddy, and the
     empty class stays in the key so the ramp does not lie about its spacing. */
  check('four of the five classes are used, and each is its own colour',
    new Set(Object.values(shaded.fill)).size === 4,
    JSON.stringify(Object.values(shaded.fill).slice(0, 3)));
  check('the densest province is the deepest colour',
    shaded.fill.Keiki === 'rgb(31, 91, 143)', shaded.fill.Keiki);
  check('the emptiest is the palest',
    shaded.fill.Kankyohoku === 'rgb(238, 243, 248)', shaded.fill.Kankyohoku);
  check('Cheju is shaded as the province it is counted in',
    shaded.fill.Saishu === shaded.fill.Zenranan,
    shaded.fill.Saishu + ' vs ' + shaded.fill.Zenranan);

  const key = await p.evaluate(() => (document.querySelector('#legend') || {}).textContent || '');
  check('the key gives the five classes and where they begin',
    /under 75/.test(key) && /75–100/.test(key) && /100–150/.test(key)
    && /150–200/.test(key) && /200 and over/.test(key), key.slice(-90));
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
    const rows = [...h.querySelectorAll('.pop-row')].map(r => r.textContent.trim());
    return { hidden: h.hidden, rows: rows,
             order: [...document.querySelector('#info').children]
               .map(e => e.id || e.className),
             head: (h.querySelector('.pop-head') || {}).textContent || '',
             src: (h.querySelector('.pop-src') || {}).textContent || '',
             btn: (h.querySelector('.pop-btn') || {}).textContent || '' };
  });
  check('a province card carries the four figures', card.rows.length === 4,
        JSON.stringify(card.rows));
  check('population, sex ratio, share and density, in that order',
    /^Population2,830,778$/.test(card.rows[0].replace(/\s+/g, ''))
    && /100females101\.0$/.test(card.rows[1].replace(/\s+/g, ''))
    && /Korea11\.7$/.test(card.rows[2].replace(/\s+/g, ''))
    && /^Perkm²224/.test(card.rows[3].replace(/\s+/g, '')),
    JSON.stringify(card.rows));
  /* Headed with the place, not with the table: every province card used to
     say "Korea" over figures that were the province's. */
  check('headed with the province and what was counted',
    card.head === 'Kyŏnggi-do (Keiki-dō), estimated population at 1 October 1942',
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
    before.head === 'Korea, estimated population at 1 October 1942', before.head);
  check('and nothing is shaded yet', before.shaded === 0, String(before.shaded));
  await p.evaluate(() => document.querySelector('.pop-btn').click());
  await sleep(1600);
  const after = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    checked: (document.querySelector('#opt-pop-korea-density') || {}).checked,
    url: location.search,
    code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1],
    key: /under 75/.test((document.querySelector('#legend') || {}).textContent || '') }));
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
    const rows = [...d.querySelectorAll('.pop-table tbody tr')];
    return { open: d.open, title: d.querySelector('.table-title').textContent,
             tab: d.querySelector('.table-open').hidden,
             head: (d.querySelector('.pop-head') || {}).textContent,
             n: rows.length,
             first: rows[0].textContent.replace(/\s+/g, ' ').trim(),
             order: rows.map(r => r.querySelector('th').textContent),
             here: (d.querySelector('tr.here th') || {}).textContent,
             note: (d.querySelector('.pop-note') || {}).textContent || '',
             src: (d.querySelector('.pop-src') || {}).textContent || '' };
  });
  check('the link opens the box', tbl.open === true && tbl.title === 'Population');
  check('with no "open in a tab": it is a table, not a page', tbl.tab === true);
  check('the whole first, then the provinces by size',
    /Ch.sen/.test(tbl.first) && /24,105,906/.test(tbl.first)
    && tbl.order[1] === 'Kyŏnggi-do (Keiki-dō)'
    && tbl.order[13] === 'Ch\u2019ungch\u2019ŏngbuk-to (Chūseihoku-dō)',
    tbl.order.slice(0, 3).join(' | '));
  check('fifteen rows: the country, the thirteen, and Cheju', tbl.n === 15, String(tbl.n));
  /* Cheju sits at the bottom rather than sorted in among the rest: it carries
     Zenranan-dō's figures, and in among them it would read as a fourteenth
     province with the same population as one of the others. */
  check('Cheju is last, marked, and its note is under the table',
    /Cheju/.test(tbl.order[14]) && /\*/.test(tbl.order[14])
    && /count Cheju inside Zenranan/.test(tbl.note), tbl.order[14] + ' | ' + tbl.note.slice(0, 60));
  check('the province the card was about is picked out', /Ky.nggi/.test(tbl.here), tbl.here);
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
    note: (document.querySelector('#note-pop-korea-density') || {}).textContent,
    key: (document.querySelector('#legend') || {}).textContent || '' }));
  check('the layers code alone brings the shading', on42.shaded === 14, String(on42.shaded));
  check('the switch says which date it is drawing', on42.note === '1942', on42.note);
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
    checked: (document.querySelector('#opt-pop-korea-density') || {}).checked,
    note: (document.querySelector('#note-pop-korea-density') || {}).textContent,
    key: (document.querySelector('#legend') || {}).textContent || '' }));
  check('on a date with no figures nothing is shaded', on30.shaded === 0, String(on30.shaded));
  check('but the switch stays where it was put', on30.checked === true);
  check('and both the switch and the key say why',
    /no figures for this date yet/.test(on30.note)
    && /no figures for this date yet/.test(on30.key), on30.note);
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
