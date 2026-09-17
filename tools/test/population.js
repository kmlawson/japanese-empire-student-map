const { sandboxDownloads } = require('./downloads.js');
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
 *
 * The tables — the box a card opens, its sorting, the census beside the
 * estimate, the CSV, Cheju's heading — are `poptables.js` since 15 September
 * 2026, so the two run side by side.
 */
const { puppeteer, sleep, ready, until, calm, check, report, SHIM, launch, HOST } = require('./suite.js');

const KOREA = HOST+'/index.html?where=123.5,32.8,132.5,43.5';
const CITIES = ['seoul', 'incheon', 'kaesong', 'kunsan', 'mokpo', 'taegu',
                'pusan', 'masan', 'pyongyang', 'nampo', 'sinuiju', 'wonsan',
                'hamhung', 'chongjin'];

const open = async (b, url, opts) => {
  const p = await b.newPage();
  if (!(opts && opts.touch)) await p.evaluateOnNewDocument(SHIM);
  await p.setViewport(opts && opts.touch
    ? { width: 390, height: 844, isMobile: true, hasTouch: true }
    : { width: 1280, height: 900 });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(p);
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  return p;
};

const spot = (p, sel, fx, fy) => p.evaluate((s, ax, ay) => {
  const e = document.querySelector(s);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: Math.round(r.x + r.width * ax), y: Math.round(r.y + r.height * ay) };
}, sel, fx === undefined ? 0.5 : fx, fy === undefined ? 0.5 : fy);

(async () => {
  const b = await launch(); await sandboxDownloads(b);

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
  await calm(p);
  const card = await p.evaluate(() => {
    const h = document.querySelector('#info-pop');
    const blocks = [...h.querySelectorAll('.pop-block')].map(b => ({
      head: (b.querySelector('.pop-head') || {}).textContent || '',
      rows: [...b.querySelectorAll('.pop-row')].map(r => r.textContent.trim()),
      groups: [...b.querySelectorAll('.pop-group-head')].map(g => g.textContent),
    }));
    return { hidden: h.hidden, blocks: blocks,
             srcInCard: h.querySelectorAll('.pop-src').length,
             order: [...document.querySelector('#info').children]
               .map(e => e.id || e.className),
             head: (h.querySelector('.pop-head') || {}).textContent || '',
             btn: (h.querySelector('.pop-btn') || {}).textContent || '' };
  });
  /* One block per date, oldest first, so the card reads down the way time
     runs. The 1942 estimate is four figures; the 1930 census counted the ages,
     the registers and the occupations as well. */
  /* One block: the date the reader is on. The card is the map's answer about
     what is under the pointer *now*, and stacking every date made a card that
     scrolled past the description it was supposed to be beside. The other date
     is a switch away, and both are in the table with the two compared. */
  check('a province card carries this date and no other',
    card.blocks.length === 1 && /1942/.test(card.blocks[0].head),
    card.blocks.map(b => b.head).join(' | '));
  /* And no source line: that belongs on the sources page and in the table, not
     in a pane that is already long. */
  check('and no source line in the pane', card.srcInCard === 0,
        String(card.srcInCard));
  const y42 = card.blocks[0];
  check('population, sex ratio, share and density, in that order',
    y42.rows.length === 4
    && /^Population2,830,778$/.test(y42.rows[0].replace(/\s+/g, ''))
    && /100females101\.0$/.test(y42.rows[1].replace(/\s+/g, ''))
    && /Korea11\.7$/.test(y42.rows[2].replace(/\s+/g, ''))
    && /^Perkm²224/.test(y42.rows[3].replace(/\s+/g, '')),
    JSON.stringify(y42.rows));
  /* Headed with the place, not with the table: every province card used to
     say "Korea" over figures that were the province's. */
  check('headed with the province and what was counted',
    card.blocks[0].head
      === 'Kyŏnggi-do (Keiki-dō), estimated population at 1 October 1942',
    card.head);
  /* The census, on the map it belongs to: everything else it counted, a group
     to a heading, and none of it in the short description — that is a
     sentence. */
  await p.evaluate(() => {
    const b = [...document.querySelectorAll('#epoch-seg button')]
      .find(x => x.textContent.trim() === '1930');
    if (b) b.click();
  });
  await calm(p);
  const c30 = await p.evaluate(() => {
    const h = document.querySelector('#info-pop');
    return { head: (h.querySelector('.pop-head') || {}).textContent || '',
             groups: [...h.querySelectorAll('.pop-group-head')].map(g => g.textContent),
             rows: [...h.querySelectorAll('.pop-row')].map(r => r.textContent.replace(/\s+/g, '')) };
  });
  check('the 1930 card is the census, with its three groups',
    /census of 1 October 1930/.test(c30.head)
    && c30.groups.join(' | ')
       === 'Ages | Register and nationality | Foreign nationality | Occupation',
    c30.head + ' — ' + c30.groups.join(' | '));
  check('with the figures under them',
    c30.rows.indexOf('Japanese(naichijin)135,863') > -1
    && c30.rows.indexOf('Agriculture545,687') > -1
    && c30.rows.indexOf('0–14801,943') > -1,
    c30.rows.slice(4, 8).join(' | '));

  /* And above the block about Chōsen. What the reader asked about comes first
     and what it belongs to comes after — the order the rest of the card is
     in. */
  check('the figures sit above the country block',
    card.order.indexOf('info-pop') > -1
    && card.order.indexOf('info-pop') < card.order.indexOf('note note-group'),
    card.order.join(' → '));

  check('the button offers to put the map away, the shading being on',
    /Hide/.test(card.btn), card.btn);
  /* Pressing it must not disturb the card. `select` was being re-run, which
     rebuilds and collapses it — on a phone the sheet snapped shut on the
     reader and the province they had open was gone, so turning the shading
     back on meant finding it again. Only the block is redrawn now. */
  await p.evaluate(() => document.querySelector('.pop-btn').click());
  await calm(p);
  const kept = await p.evaluate(() => ({
    name: (document.querySelector('#info .primary') || {}).textContent,
    shaded: document.querySelectorAll('path.pop-shaded').length,
    btn: (document.querySelector('.pop-btn') || {}).textContent }));
  await p.evaluate(() => document.querySelector('.pop-btn').click());
  await calm(p);
  kept.backOn = await p.evaluate(() => document.querySelectorAll('path.pop-shaded').length);
  kept.backName = await p.evaluate(() => (document.querySelector('#info .primary') || {}).textContent);
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
  await calm(p);
  const before = await p.evaluate(() => ({
    shaded: document.querySelectorAll('path.pop-shaded').length,
    btn: (document.querySelector('.pop-btn') || {}).textContent || '',
    url: location.search,
    head: (document.querySelector('.pop-head') || {}).textContent,
    code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1] }));
  check('with nothing on, the card offers the map', /Provinces by Population/.test(before.btn),
        before.btn);
  check('and the colony-wide card is headed with the colony and this date',
    before.head === 'Korea, estimated population at 1 October 1942', before.head);
  check('and nothing is shaded yet', before.shaded === 0, String(before.shaded));
  await p.evaluate(() => document.querySelector('.pop-btn').click());
  await calm(p);
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
    const q = await open(b, HOST+'/index.html' + url);
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
  await calm(p);
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
    on30.fill === 'rgb(223, 234, 244)', on30.fill);
  check('the classes read the same on both maps',
    /under 50/.test(on30.key) && /150 and over/.test(on30.key), on30.key.slice(-60));
  await p.close();

  /* The parameter this travelled as for one update still opens a link. */
  p = await open(b, KOREA + '&layers=1&pop=korea-1942');
  // the address is rewritten 400 ms after the state settles, not at once
  try { await until(p, () => !/pop=/.test(location.search), null, { timeout: 3000 }); }
  catch (e) { /* the check below says so */ }
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
    const q = await open(b, HOST+'/index.html' + url);
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

  /* THE HEADER, A SIZE DOWN. Asked for: smaller type, less padding, less
     space between. Pinned as the three that were asked for, plus the finger
     rule the last of them is allowed to bend — 40px on a touch screen rather
     than the 44 everything else keeps, for a bar of seven controls across a
     phone. Anything under 36 would be a miss waiting to happen and is what
     this guards. */
  console.log('\n— the header buttons —');
  for (const [w, h, touch, floor] of [[1400, 950, false, 28], [390, 844, true, 36]]) {
    const q = await b.newPage();
    if (!touch) await q.evaluateOnNewDocument(SHIM);
    await q.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch });
    await q.goto(HOST+'/index.html', { waitUntil: 'domcontentloaded' });
    await ready(q);
    await q.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    const bar = await q.evaluate(() => {
      const el = document.querySelector('#bar');
      const bs = [...el.querySelectorAll('button')].filter(b => b.offsetParent);
      const cs = getComputedStyle(bs[0]);
      return { barH: Math.round(el.getBoundingClientRect().height),
               btnH: Math.round(bs[0].getBoundingClientRect().height),
               font: parseFloat(cs.fontSize),
               padX: parseFloat(cs.paddingLeft),
               gap: parseFloat(getComputedStyle(el).columnGap),
               n: bs.length };
    });
    const what = touch ? 'phone' : 'desktop';
    check(what + ': the type is smaller than it was', bar.font <= 13, bar.font + 'px');
    check(what + ': the padding is tighter', bar.padX <= 9, bar.padX + 'px');
    check(what + ': and so is the space between', bar.gap <= 7, bar.gap + 'px');
    /* **THE BAR IS TWO ROWS NOW, AND THE FOLD IS WHAT BUYS THE HEIGHT BACK.**
       This guarded a bar squeezed into one row, which is what it was until
       the row started running off the side of a 390px screen — Layers and the
       ? past the right-hand edge with nothing to say the row could be
       dragged. It wraps instead, so on a phone it is two rows and taller, and
       the tab folds the whole thing away when the reader wants the map. What
       is still worth holding is that the *row* is tight — the type, the
       padding and the gap above — and that folded it costs almost nothing. */
    const folded = await q.evaluate(async () => {
      const btn = document.getElementById('btn-bar-fold');
      if (!btn) return null;
      btn.click();
      await new Promise(r => setTimeout(r, 350));
      const h = Math.round(document.getElementById('bar').getBoundingClientRect().height);
      btn.click();
      await new Promise(r => setTimeout(r, 350));
      return h;
    });
    check(what + ': one row of buttons is as tight as it was',
      bar.btnH <= (touch ? 40 : 34), bar.btnH + 'px');
    check(what + ': and folded away the bar is a tab',
      folded !== null && folded <= (touch ? 52 : 48), folded + 'px');
    check(what + ': but a button is still big enough to hit',
      bar.btnH >= floor, bar.btnH + 'px');
    await q.close();
  }

  await b.close();
  process.exit(report());
})();
