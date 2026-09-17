const { sandboxDownloads } = require('./downloads.js');
/* The tables behind the figures: the box a card opens, and what is in it.
 *
 *     node tools/test/poptables.js        # with a server on 8123
 *
 * The column of provinces in a box, sorted by whichever question the reader
 * asks of it; the same box on a phone, scrolling inside itself; the census
 * beside the estimate, the bars over the table, the CSV that leaves with the
 * source on it, the fourteen 府 with a table of their own; and Cheju headed
 * with the province that counted it. Split from `population.js` on
 * 15 September 2026 so the two run side by side — that file keeps the
 * shading, the card and the dots.
 */
const { puppeteer, sleep, ready, until, calm, check, report, SHIM, launch, HOST } = require('./suite.js');

const KOREA = HOST+'/index.html?where=123.5,32.8,132.5,43.5';

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
  let p;

  /* ---- the whole column, in a box ---------------------------------- */
  /* The card answers "what about this province"; the table answers "and how
     does it sit against the others", which needs the column at once. */
  console.log('\n— the population table —');
  p = await open(b, KOREA + '&layers=hra0ht');
  const spot2 = await spot(p, '#a-korea path[data-prov="Keiki"]');
  await p.mouse.move(spot2.x - 40, spot2.y); await sleep(150);
  await p.mouse.move(spot2.x, spot2.y); await sleep(400);
  await p.mouse.click(spot2.x, spot2.y); await calm(p);
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

  /* ---- the census beside the estimate, and the cities --------------- */
  console.log('\n— two dates, and the fourteen 府 —');
  p = await open(b, KOREA + '&layers=hra0ht');
  const at42 = await spot(p, '#a-korea path[data-prov="Keiki"]');
  await p.mouse.move(at42.x - 40, at42.y); await sleep(150);
  await p.mouse.move(at42.x, at42.y); await sleep(400);
  await p.mouse.click(at42.x, at42.y); await calm(p);
  const box = await p.evaluate(() => {
    document.querySelector('.pop-more').click();
    const d = document.querySelector('#dlg-table');
    return { head: d.querySelector('.pop-head').textContent,
             note: (d.querySelector('.pop-note') || {}).textContent || '',
             tables: d.querySelectorAll('.pop-table-block:not(.pop-compare) .pop-table').length,
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
  /* One table, however many columns the source has: a stack of them meant a
     reader comparing a province's Japanese population against its industry
     had to hold one table in their head while scrolling to another. */
  check('and it is one table, not a stack', box.tables === 1, String(box.tables));
  /* And a chart over it. A column of numbers answers "how big was Kyŏnggi-do";
     the bars answer "how are these people distributed", which is the question
     somebody opens a table of thirteen provinces to ask. The whole is not one
     of the bars — Korea against Kyŏnggi-do would press every other province
     into the left margin — so it is said in the caption instead. */
  const bars = await p.evaluate(() => {
    const bl = document.querySelector('.pop-table-block');
    const rows = [...bl.querySelectorAll('.pop-bar')];
    return { n: rows.length,
             cap: (bl.querySelector('.pop-bars-cap') || {}).textContent || '',
             first: rows.length ? rows[0].textContent.replace(/\s+/g, ' ') : '',
             firstW: rows.length ? rows[0].querySelector('.track i').style.width : '',
             lastW: rows.length ? rows[rows.length - 1].querySelector('.track i').style.width : '',
             before: !!(bl.querySelector('.pop-bars')
                        && bl.querySelector('table')
                        && bl.querySelector('.pop-bars').compareDocumentPosition(
                             bl.querySelector('table')) & Node.DOCUMENT_POSITION_FOLLOWING) };
  });
  check('a bar to each province, over the table', bars.n === 13 && bars.before,
    bars.n + ' bars');
  check('the longest is the longest', bars.firstW === '100%',
    bars.first + ' at ' + bars.firstW);
  check('and the shortest is shorter',
    parseFloat(bars.lastW) > 0 && parseFloat(bars.lastW) < 100, bars.lastW);
  /* The total belongs over them in words, not in a bar twelve times the
     length of the next one. */
  /* This is the 1942 estimate's table — 24,105,906 — and the 1930 census's is
     21,058,305; the caption carries whichever date's whole it is about, which
     is the point of taking it from the dataset rather than naming a number. */
  check('with the whole said in the caption',
    /13 of them/.test(bars.cap) && /24,105,906/.test(bars.cap)
    && /Ch.sen/.test(bars.cap), bars.cap);
  /* Every other table the folder holds, whichever place it is about. Counted
     rather than listed by name: a dataset added to data/population/ turns up
     here by itself, and a test that named three would fail on the fourth for
     no reason but its existence. */
  /* A table somebody can read is a table somebody will quote, so it can be
     taken away and the source goes with it. The CSV is built from the spec the
     table was made from rather than scraped off the screen: the cells carry
     `1,933,326` and `—` for reading, and the file has to carry the number and
     an empty cell or it cannot be added up. */
  {
    await p.evaluate(() => {
      window.__csv = null;
      const B = window.Blob;
      window.Blob = function (parts, opts) {
        window.__csv = String(parts[0]);
        return new B(parts, opts);
      };
    });
    const btns = await p.evaluate(() =>
      [...document.querySelectorAll('#dlg-table .pop-csv')].length);
    check('every table in the box offers a CSV', btns >= 2, String(btns));
    await p.evaluate(() => document.querySelector('#dlg-table .pop-csv').click());
    await calm(p);
    const csv = await p.evaluate(() => window.__csv || '');
    const lines = csv.split('\n');
    /* **Excel reads a bare .csv as Windows-1252.** The bytes were always
       UTF-8 and the blob always said so in its MIME type, but that is not
       consulted once the file is on disk, and every name in it came out as
       mojibake — 朝鮮 as `æœé®`. A byte-order mark is the only in-band
       signal Excel honours; every other reader of ours skips it. */
    check('it opens as UTF-8 in Excel, which wants a byte-order mark',
      csv.charCodeAt(0) === 0xFEFF, 'first code unit ' + csv.charCodeAt(0));
    check('and the mark is the only thing before the title',
      /^\uFEFF[^\n,]/.test(csv), JSON.stringify(csv.slice(0, 24)));
    check('the file has a header row and a row per place',
      lines.length > 10 && /Population/.test(lines[1]), String(lines.length));
    check('and the figures rather than the screen\'s wording',
      /,\d{4,}/.test(csv) && !/1,933,326|—/.test(csv), lines[2] || '');
    /* The name goes out as two columns. A spreadsheet with
       `Kyŏnggi-do (Keiki-dō, 京畿道)` in one cell cannot sort by name, match
       against another table, or print the characters on their own. */
    check('the name is split into romanisation and characters',
      /^Name,Characters,/.test(lines[1]), lines[1].slice(0, 60));
    const first = (lines[2] || '').replace(/^("(?:[^"]|"")*"|[^,]*),/, '');
    check('and the characters are in the second column',
      /^[^\x00-\x7F]/.test(first), lines[2] || '');
    check('while the screen still glues them together',
      /\(.*[^\x00-\x7F].*\)/.test(await p.evaluate(() =>
        (document.querySelector('#dlg-table .pop-table tbody tr th') || {}).textContent || '')),
      await p.evaluate(() =>
        (document.querySelector('#dlg-table .pop-table tbody tr th') || {}).textContent || ''));
    check('with a Source row at the foot', /\nSource,/.test(csv),
      lines.slice(-2).join(' | '));
    check('and the notes carried with it',
      (csv.match(/^Note,/gm) || []).length >= 1,
      String((csv.match(/^Note,/gm) || []).length));
  }

  check('the other tables are offered at the foot',
    box.switches.length >= 3 && box.switches.some(t => /1930/.test(t))
    && box.switches.some(t => /府/.test(t))
    && box.switches.some(t => /Taiwan/.test(t))
    && box.switches.some(t => /Japan/.test(t)), box.switches.join(' | '));
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
             tables: d.querySelectorAll('.pop-table-block:not(.pop-compare) .pop-table').length,
             cols: d.querySelectorAll('.pop-table-block:not(.pop-compare) thead th').length,
             heads: [...d.querySelectorAll('.pop-table-block:not(.pop-compare) thead th')]
               .map(t => t.textContent).join(' | '),
             groups: [...d.querySelectorAll('.pop-group-head')].map(g => g.textContent) };
  });
  check('the foot switches the table to the other date',
    /census of 1 October 1930/.test(to30.head), to30.head);
  /* Still one table on the census, which counted four times as much: the
     ages, every register and nationality it named, and the nine trades, all in
     the same row as the population and reachable by scrolling sideways. */
  check('and the census is one table too, as wide as it counted',
    to30.tables === 1 && to30.cols > 30,
    to30.tables + ' table, ' + to30.cols + ' columns');
  check('with every nationality the source names in it',
    /Czechoslovakia/.test(to30.heads) && /Persia/.test(to30.heads)
    && /Agriculture/.test(to30.heads) && /0–14/.test(to30.heads),
    to30.heads.slice(0, 90));
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
  await p.mouse.click(city.x, city.y); await calm(p);
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
    cityCard.groups.join(' | ')
      === 'Ages | Register and nationality | Foreign nationality | Occupation',
    cityCard.groups.join(' | '));
  check('and no offer to shade the map: a city is not a province',
    cityCard.shade === false);
  const cityTbl = await p.evaluate(() => {
    document.querySelector('.pop-more').click();
    const d = document.querySelector('#dlg-table');
    const rows = [...d.querySelectorAll('.pop-table')[0].querySelectorAll('tbody tr')];
    return { head: d.querySelector('.pop-head').textContent,
             tables: d.querySelectorAll('.pop-table-block:not(.pop-compare) .pop-table').length,
             heads: [...d.querySelectorAll('.pop-table-block:not(.pop-compare) thead th')]
               .map(t => t.textContent).join(' | '),
             n: rows.length,
             first: rows[0].textContent.replace(/\s+/g, ' '),
             here: (d.querySelector('tr.here th') || {}).textContent,
             cmp: !!d.querySelector('.pop-compare') };
  });
  /* Three tables, not four: the ages come out of the box. The figures are
     still on the card and in the data — `table_skip` says only that a table of
     them is not worth the room, which half a screen of columns nobody had
     asked a question of was not. */
  check('the fourteen 府 have a table of their own, without the ages',
    /fourteen 府/.test(cityTbl.head) && cityTbl.n === 15 && cityTbl.tables === 1
    && !/0–14/.test(cityTbl.heads),
    cityTbl.head + ' — ' + cityTbl.tables + ' table: ' + cityTbl.heads.slice(0, 80));
  check('with the fourteen together at the top',
    /All fourteen/.test(cityTbl.first) && /1,189,791/.test(cityTbl.first),
    cityTbl.first.slice(0, 60));
  check('the city the card was about picked out',
    /Kaes.ng/.test(cityTbl.here), cityTbl.here);
  check('and nothing compared, there being one date',
    cityTbl.cmp === false);
  await p.close();

  /* WHOSE FIGURES ARE THESE?
   *
   * Cheju's card carries Chŏllanam-do's count, because the census did not
   * break the island out — and it was headed *Cheju-do (Saishū-tō), census of
   * 1 October 1930*, over 2,332,256 people. Read straight, that says a
   * hundred-kilometre island held eleven per cent of Korea. Reported.
   *
   * The map already had the machinery: an island with no row of its own reads
   * its province's and is headed with the province. Cheju has a row — the
   * source prints one — and it says `same_as`, so it went down a different
   * path and was headed with itself. Both now name the lender.
   *
   * Checked on both dates, because the two tables carry the row separately
   * and a fix to one is not a fix to the other. The card's own headline is
   * checked to be *unchanged*: it is Cheju's card and it should say Cheju.
   */
  console.log('\n— Cheju is headed with the province that counted it —');
  for (const [when, to42, caption] of [
    ['1930', false, 'census of 1 October 1930'],
    ['1942', true, 'estimated population at 1 October 1942'],
  ]) {
    const q = await b.newPage();
    await q.evaluateOnNewDocument(SHIM);
    await q.setViewport({ width: 1400, height: 950 });
    await q.goto(HOST+'/index.html?where=125.2,32.6,128.8,35.4',
                 { waitUntil: 'domcontentloaded' });
    await ready(q);
    await q.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    if (to42) { await q.keyboard.press('2'); await calm(q); }
    await q.keyboard.press('a');
    await calm(q);
    const opened = await q.evaluate(() => {
      const el = [...document.querySelectorAll('[data-prov]')]
        .find(e => e.getAttribute('data-prov') === 'Saishu');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const o = { bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2,
                  pointerType: 'mouse', pointerId: 1, isPrimary: true, button: 0 };
      ['pointerover', 'pointerdown', 'pointerup', 'click']
        .forEach(n => el.dispatchEvent(new PointerEvent(n, o)));
      return true;
    });
    await calm(q);
    const got = await q.evaluate(() => {
      const h = document.querySelector('#info-pop');
      return {
        headline: (document.querySelector('#info .primary') || {}).textContent || '',
        heads: h && !h.hidden
          ? [...h.querySelectorAll('.pop-head')].map(e => e.textContent) : [],
        notes: h && !h.hidden
          ? [...h.querySelectorAll('.pop-note')].map(e => e.textContent) : [],
        pop: h && !h.hidden
          ? ([...h.querySelectorAll('.pop-row')]
              .find(r => /Population/.test(r.textContent)) || {}).textContent || '' : '',
      };
    });
    check(when + ': Cheju\u2019s card opens', opened && got.heads.length === 1,
      JSON.stringify(got.heads));
    check('  and the card is still Cheju\u2019s', /Cheju/.test(got.headline), got.headline);
    check('  but the figures are headed with the province',
      /Ch\u014fllanam-do/.test(got.heads[0]) && !/Cheju|Saish/.test(got.heads[0]),
      got.heads[0] || '(none)');
    check('  and dated from this map', got.heads[0].indexOf(caption) > -1, got.heads[0] || '');
    check('  with one note saying why, not two',
      got.notes.length === 1 && /break the island out/.test(got.notes[0]),
      JSON.stringify(got.notes));
    /* And the numbers themselves are untouched — only the name over them
       moved. 2,332,256 is Chŏllanam-do's on the 1930 census. */
    if (!to42) {
      check('  over the same figures as before', /2,332,256/.test(got.pop), got.pop);
    }
    await q.close();
  }


  await b.close();
  process.exit(report());
})();
