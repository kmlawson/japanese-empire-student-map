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
  let p = await open(b, KOREA + '&layers=1&pop=korea-1942');
  const shaded = await p.evaluate(() => {
    const els = [...document.querySelectorAll('path.pop-shaded')];
    const fill = {};
    els.forEach(e => { fill[e.getAttribute('data-prov')] = getComputedStyle(e).fill; });
    return { n: els.length, fill,
             admin: !!document.querySelector('#jmap.admin-on'),
             checked: (document.querySelector('#opt-pop-korea-1942') || {}).checked };
  });
  // thirteen provinces and Cheju, which carries Zenranan-dō's figures
  check('a link with pop= shades fourteen units', shaded.n === 14, String(shaded.n));
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
  check('under the name of the table it came from', /1 October 1942/.test(card.head));
  check('and the source', /朝鮮總督府/.test(card.src));
  check('the button offers to put the map away, the shading being on',
    /Hide/.test(card.btn), card.btn);
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
    url: location.search }));
  check('with nothing on, the card offers the map', /Provinces by Population/.test(before.btn),
        before.btn);
  check('and nothing is shaded yet', before.shaded === 0 && !/pop=/.test(before.url),
        before.url);
  await p.evaluate(() => document.querySelector('.pop-btn').click());
  await sleep(1600);
  const after = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    checked: (document.querySelector('#opt-pop-korea-1942') || {}).checked,
    url: location.search,
    key: /under 75/.test((document.querySelector('#legend') || {}).textContent || '') }));
  check('pressing it shades the map', after.shaded === 14, String(after.shaded));
  check('ticks the row in the Layers panel', after.checked === true);
  check('writes itself into the address', /pop=korea-1942/.test(after.url), after.url);
  check('and opens the key, which is what the colours mean', after.key);
  await p.close();

  /* ---- a finger --------------------------------------------------- */
  console.log('\n— with a finger —');
  p = await open(b, KOREA + '&layers=1&pop=korea-1942', { touch: true });
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

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
