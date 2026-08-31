/* Taiwan's resident population of 1941, on the cards of the units that were
 * counted.
 *
 *     node tools/test/taiwanpop.js       # with a server on 8123
 *
 * Sixty-four second-tier divisions — eleven 市, fifty-one 郡, two 支廳 — against
 * the units this map actually draws, which are not the same set:
 *
 *   * three cities were cut out of their districts in 1933 and 1940, after the
 *     boundaries here, so each is added back into the district it came from and
 *     the card says so;
 *   * the two eastern prefectures and the Pescadores are drawn whole, so their
 *     districts are summed into them;
 *   * and every row carries the prefecture it sat in, with that prefecture's
 *     own population, because a 郡 is read against its 州.
 *
 * The arithmetic is checked here rather than assumed: the sums the source
 * prints are the ones the map shows.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('taiwanpop test: puppeteer not found.');
  process.exit(1);
})();
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const SHIM = () => { const o = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} } : o.call(window, q)); };

/* ---- what the file says, before any browser is opened ---------------- */
console.log('\n— the table itself —');
const rows = (function () {
  /* CRLF: Python's csv writer ends every line with \r\n, so splitting on \n
     alone leaves a carriage return on the last column of every row — which
     turned the last register into NaN and made twenty-two rows look as though
     they did not sum. */
  const text = fs.readFileSync(
    __dirname + '/../../data/population/taiwan-1941.csv', 'utf8')
    .replace(/\r/g, '').trim().split('\n');
  const head = text[0].split(',');
  /* A real split, not a regex: the note field is quoted and has commas in it,
     and a pattern that allows an empty match slid every column after it along
     — which showed up as twenty-two rows whose registers "did not sum". */
  const cells = line => {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  return text.slice(1).map(line => {
    const out = {}, c = cells(line);
    head.forEach((h, i) => { out[h] = c[i]; });
    return out;
  });
})();
const n = k => Number(k || 0);
const shu = rows.filter(r => /^TwShu/.test(r.key));
/* `apart` is a row counted *inside* the others rather than beside them: the
   高砂族 of the demarcated territory are also in the district whose ground it
   lies in, so nothing may sum it with them. */
const dist = rows.filter(r => r.scope === 'sub-unit' && !/^TwShu/.test(r.key)
                              && r.apart !== 'yes');
const whole = rows.filter(r => r.scope === 'territory')[0];
/* Five of them: the three the map draws whole — 臺東廳, 花蓮港廳, 澎湖廳 — are in
   the district set instead, because there the prefecture *is* the unit. Both
   halves together are the island. */
check('the prefectures and the three drawn whole sum to the island',
  shu.reduce((a, r) => a + n(r.population), 0)
  + ['TwTaito', 'TwKarenko', 'TwHoko']
      .reduce((a, k) => a + n(rows.filter(r => r.key === k)[0].population), 0)
    === n(whole.population),
  shu.length + ' prefecture rows');
check('and so do the units the map draws',
  dist.reduce((a, r) => a + n(r.population), 0) === n(whole.population),
  dist.reduce((a, r) => a + n(r.population), 0) + ' vs ' + whole.population);
/* The demarcated territory is a count of 高砂族 people and not a five-way
   register, so it is left out of this one and says so on its card. */
const bad = rows.filter(r => r.population && r.apart !== 'yes' &&
  n(r.reg_jp) + n(r.reg_tw) + n(r.reg_ko) + n(r.for_cn) + n(r.for_other)
    !== n(r.population));
check('the five registers sum to every row\'s own total', !bad.length,
      bad.map(r => r.key).join(', '));
/* 宜蘭郡 70,442 and 宜蘭市 38,922 in the source; the map draws one shape. */
const giran = rows.filter(r => r.key === 'TwGiran')[0];
check('a city cut out after these boundaries is added back',
  n(giran.population) === 109364 && /宜蘭市/.test(giran.note), giran.population);
check('the eastern prefectures are given whole',
  n(rows.filter(r => r.key === 'TwTaito')[0].population) === 93138);
/* And the demarcated 「蕃地」, which had no figure at all: the 高砂族 count of
   1941, with the note that it leaves out the Japanese and others living
   there. */
const banchi = rows.filter(r => r.key === 'TwBanchi')[0];
check('the demarcated territory has its own count',
  n(banchi.population) === 159594 && banchi.m_per_100_f === '100.39',
  banchi.population + ' / ' + banchi.m_per_100_f);
check('and says what it leaves out',
  /Does not include Japanese and others/.test(banchi.note), banchi.note.slice(0, 60));
check('and is marked as counted inside the districts', banchi.apart === 'yes');

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.evaluateOnNewDocument(SHIM);
  await p.setViewport({ width: 1280, height: 950 });
  // Taiwan on the December 1942 map with its divisions drawn
  await p.goto('http://localhost:8123/index.html?where=119.5,21.5,122.5,25.5&layers=9',
               { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(3400);

  console.log('\n— on the card —');
  const at = await p.evaluate(() => {
    const e = document.querySelector('#a-taiwan path[data-prov="TwShichisei"]');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  check('the districts are on the map to be clicked', !!at);
  if (at) {
    await p.mouse.move(at.x - 30, at.y); await sleep(200);
    await p.mouse.move(at.x, at.y); await sleep(400);
    await p.mouse.click(at.x, at.y); await sleep(700);
    const card = await p.evaluate(() => {
      const h = document.querySelector('#info-pop');
      return { head: (h.querySelector('.pop-head') || {}).textContent || '',
               rows: [...h.querySelectorAll('.pop-row')].map(r => r.textContent.replace(/\s+/g, '')),
               groups: [...h.querySelectorAll('.pop-group-head')].map(g => g.textContent) };
    });
    check('a 郡 card is headed with the district and the date',
      /Shichisei/.test(card.head) && /1941/.test(card.head), card.head);
    check('and gives its population and sex ratio',
      card.rows.indexOf('Population91,341') > -1
      && card.rows.some(r => /100females105\.11/.test(r)), card.rows.slice(0, 2).join(' | '));
    /* A 郡 is read against its 州: one part in thirteen of Taihoku-shū. */
    check('with the prefecture it sat in, and how big that was',
      card.rows.some(r => /^InTaihoku-sh/.test(r) && /1,233,882/.test(r)),
      card.rows.join(' | ').slice(0, 90));
    check('and the five registers under one heading',
      card.groups.join(' | ') === 'Register and nationality'
      && card.rows.indexOf('Taiwanese88,521') > -1
      && card.rows.indexOf('Japanese(naichijin)2,387') > -1,
      card.groups.join(' | '));
    /* Sixty-four districts is sixty-four sentences nobody asked for on hover,
       so this dataset stays off the short description — `in_short` in the
       index. What the tooltip says about a 郡 is what it always said. */
    const tip = await p.evaluate(() => {
      const e = document.querySelector('#a-taiwan path[data-prov="TwShichisei"]');
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    await p.mouse.move(tip.x - 30, tip.y); await sleep(200);
    await p.mouse.move(tip.x, tip.y); await sleep(500);
    const words = await p.evaluate(() =>
      document.querySelector('#tooltip').textContent.replace(/\s+/g, ' '));
    check('and the hover is not made to carry them',
      !/Resident Population/.test(words), words.slice(0, 80));

    /* The main table only. Taiwan has a 1930 dataset now, so the box also
       holds the two dates compared, and counting every `tbody tr` in the
       dialog was counting that as well — 123 where the table has 62. Scoped
       the way `population.js` scopes its own count. */
    const box = await p.evaluate(() => {
      document.querySelector('.pop-more').click();
      const d = document.querySelector('#dlg-table');
      const main = d.querySelector('.pop-table-block:not(.pop-compare)');
      return { head: d.querySelector('.pop-head').textContent,
               n: main.querySelectorAll('.pop-table tbody tr').length,
               cmp: (d.querySelector('.pop-compare .pop-head') || {}).textContent || '',
               here: (d.querySelector('tr.here th') || {}).textContent || '',
               note: (main.querySelector('.pop-note') || {}).textContent || '' };
    });
    check('the table holds every unit the map draws and the five above them',
      box.n === 62, String(box.n));
    /* And the 1930 register is set against it underneath, named for the years
       the figures are of rather than the maps they are drawn on. */
    check('with the two dates compared under it',
      box.cmp === '1930 and 1941 compared', box.cmp);
    check('with the district the card was about picked out',
      /Shichisei/.test(box.here), box.here);
    check('and says what kind of count it was', /常住/.test(box.note),
          box.note.slice(0, 60));
  }
  await p.close();

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
