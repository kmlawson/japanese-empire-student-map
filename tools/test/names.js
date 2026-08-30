/* Japanese names inside the empire, or the local ones.
 *
 *     node tools/test/names.js          # with a server on 8123
 *
 * One switch, on by default. `en` carries the Japanese-first form and `local`
 * the other way round; `tools/build_localnames.py` derives both and `shown()`
 * picks. A record with no `local` has one name either way and is untouched.
 *
 * Three things have to hold, and the second and third are the ones that would
 * be wrong without anybody noticing:
 *
 *   * the switch reaches the map labels, the tooltip and the card — every
 *     reader of a name goes through `shown()`, so it is enough to change it
 *     there, but only if `shown()` is actually reached;
 *   * **the colonies keep their own names.** Chōsen, Taiwan and Manchukuo are
 *     what those polities were called. A switch about how their provinces are
 *     labelled has no business renaming them, and a mechanical swap would;
 *   * **Manchuria is not Japanese in 1930.** Manchukuo's provinces are drawn
 *     on the 1942 map alone, but its cities are on both. Calling Mukden
 *     `Hōten` on a map of 1930 would be an anachronism no switch can excuse,
 *     so those rows carry `jpfrom` and read Chinese-first there whatever the
 *     switch says.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('names test: puppeteer not found.');
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

const BASE = (1 << 1) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (2 << 8);
const JP = 1 << 22;                     // set means Japanese names ON — off is the default
const E1942 = 1;
const url = (bits, bbox) => 'http://localhost:8123/index.html?layers='
  + (bits >>> 0).toString(36) + (bbox ? '&bbox=' + bbox : '');

const LABELS = () => [...document.querySelectorAll('text')]
  .filter(e => e.textContent.trim() && e.getBoundingClientRect().width > 0)
  .map(e => e.textContent);

(async () => {
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const open = async (bits, bbox) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1300, height: 1000 });
  await p.evaluateOnNewDocument(SHIM);
  await p.goto(url(bits, bbox), { waitUntil: 'networkidle0' });
  await sleep(3400);
  return p;
};

console.log('\n— Korea, both ways —');
{
  const KOREA = '124,33,131.5,43.5';
  const off = await open(BASE, KOREA);
  const c = await off.evaluate(LABELS);
  check('the switch starts OFF — local names are the default (changed 28-08)',
    !(await off.evaluate(() => document.querySelector('#opt-jpnames').checked)));
  check('so the capital is Kyŏngsŏng', c.indexOf('Kyŏngsŏng') >= 0, c.slice(0, 8).join(' | '));
  check('and Pusan and Inch’ŏn',
    c.indexOf('Pusan') >= 0 && c.indexOf('Inch’ŏn') >= 0, c.slice(0, 10).join(' | '));
  check('with no Japanese form left standing as a headline',
    c.indexOf('Keijō') < 0 && c.indexOf('Fusan') < 0, c.join(' | '));
  await off.close();

  const on = await open(BASE | JP, KOREA);
  const a = await on.evaluate(LABELS);
  check('ticked, the capital is Keijō', a.indexOf('Keijō') >= 0, a.slice(0, 8).join(' | '));
  check('and the ports are Fusan and Jinsen',
    a.indexOf('Fusan') >= 0 && a.indexOf('Jinsen') >= 0, a.slice(0, 10).join(' | '));
  await on.close();
}

console.log('\n— and the provinces, which are keyed differently —');
{
  /* Sub-units are keyed by `key`, and that column is dropped from the record
     as the file's own business — so a province record has no `id`. `shown()`
     used to test for one before doing anything, which meant every Korean and
     Taiwanese province went through it unchanged. The guard belongs to the
     epoch-override lookup alone. */
  const p = await open(BASE | JP, '124,33,131.5,43.5');
  const rec = await p.evaluate(() => {
    const k = JMAP.PROVINCES && JMAP.PROVINCES.Keiki;
    return k ? { en: k.en, local: k.local } : null;
  });
  check('a province carries both forms', rec && !!rec.en && !!rec.local,
    JSON.stringify(rec));
  const hover = async key => {
    const pt = await p.evaluate(k => {
      const el = document.querySelector('[data-prov="' + k + '"]');
      if (!el) return null;
      const bb = el.getBBox(), svg = el.ownerSVGElement;
      const m = svg.getScreenCTM(), q = svg.createSVGPoint();
      q.x = bb.x + bb.width / 2; q.y = bb.y + bb.height / 2;
      const s = q.matrixTransform(m); return [s.x, s.y];
    }, key);
    if (!pt) return '';
    await p.mouse.move(5, 5); await sleep(200);
    await p.mouse.move(pt[0], pt[1]); await sleep(800);
    return p.evaluate(() => { const t = document.querySelector('#tip,#tooltip');
      return t ? t.textContent.replace(/\s+/g, ' ') : ''; });
  };
  /* Kōgen-dō, not Keiki-dō: a province is hovered at the middle of its box and
     the middle of Keiki-dō is Seoul, so the pointer landed on the city's own
     marker and the tooltip named the city. Kōgen is mountain in the middle. */
  /* PARKED, NOT DELETED. Korea's thirteen provinces are not drawn at the
     moment: the traced sheet they came from turned out to be a re-digitised
     drawing sitting kilometres off its own coastline, so the coast is Natural
     Earth's now and the divisions are being redrawn. When the new polygons go
     in, drop the guard and this check works again exactly as written — the
     name records in texts/ never went away, which is what the check above
     still proves. */
  const drawn = await p.evaluate(() => !!document.querySelector('[data-prov="Kogen"]'));
  if (!drawn) {
    console.log('  ..   Korea has no provinces drawn yet — two checks parked');
  } else {
    const tip = await hover('Kogen');
    check('and the tooltip shows the Japanese one first',
      /Kōgen-dō/.test(tip) && tip.indexOf('Kōgen-dō') < tip.indexOf('Kangwŏn'),
      tip.slice(0, 90));
  }
  await p.close();

  const q = await open(BASE, '124,33,131.5,43.5');
  const pt = await q.evaluate(() => {
    const el = document.querySelector('[data-prov="Kogen"]');
    if (!el) return null;
    const bb = el.getBBox(), svg = el.ownerSVGElement;
    const m = svg.getScreenCTM(), s = svg.createSVGPoint();
    s.x = bb.x + bb.width / 2; s.y = bb.y + bb.height / 2;
    const r = s.matrixTransform(m); return [r.x, r.y];
  });
  if (pt) {
    await q.mouse.move(pt[0], pt[1]); await sleep(900);
    const tip2 = await q.evaluate(() => { const t = document.querySelector('#tip,#tooltip');
      return t ? t.textContent.replace(/\s+/g, ' ') : ''; });
    check('unticked, the Korean one leads',
      /Kangwŏn-do/.test(tip2) && tip2.indexOf('Kangwŏn-do') < tip2.indexOf('Kōgen-dō'),
      tip2.slice(0, 90));
  }                               // parked with the one above
  await q.close();
}

console.log('\n— the colonies keep their own names —');
{
  for (const [bits, tag] of [[BASE | E1942 | JP, 'ticked'], [BASE | E1942, 'unticked']]) {
    const p = await open(bits, '118,30,140,48');
    const a = await p.evaluate(LABELS);
    check(tag + ': Chōsen and Manchukuo are still themselves',
      a.indexOf('Chōsen') >= 0 && a.indexOf('Manchukuo') >= 0,
      a.filter(t => /Chōsen|Chosŏn|Korea|Manchukuo|Manzhouguo/.test(t)).join(' | '));
    await p.close();
  }
}

console.log('\n— and Manchuria is not Japanese in 1930 —');
{
  const MANCH = '118,38,132,48';
  const later = await open(BASE | JP | E1942, MANCH);
  const a = await later.evaluate(LABELS);
  check('on the 1942 map, with the switch on, Mukden is Hōten',
    a.indexOf('Hōten') >= 0, a.filter(t => /Hōten|Shěnyáng|Mukden/.test(t)).join(' | '));
  await later.close();

  const early = await open(BASE | JP, MANCH);
  const c = await early.evaluate(LABELS);
  check('on the 1930 map, with the same switch on, it is Shěnyáng',
    c.indexOf('Shěnyáng') >= 0 && c.indexOf('Hōten') < 0,
    c.filter(t => /Hōten|Shěnyáng|Mukden/.test(t)).join(' | '));
  await early.close();
}

console.log('\n— the switch travels, and comes back —');
{
  const p = await open(BASE, '124,33,131.5,43.5');
  const before = (await p.evaluate(LABELS)).indexOf('Kyŏngsŏng') >= 0;
  await p.evaluate(() => document.querySelector('#opt-jpnames').click());
  await sleep(2200);
  const after = await p.evaluate(LABELS);
  const link = await p.evaluate(() => location.search);
  check('pressing it changes the map', before && after.indexOf('Keijō') >= 0,
    after.slice(0, 6).join(' | '));
  check('and the address says so', /layers=/.test(link) && link.length > 0, link);
  /* An absent bit is the default, and the default is local names now: a link
     made before the switch existed opens local-first. A deliberate change of
     what old links show, made 28-08 together with the default. */
  const q = await open(BASE, '124,33,131.5,43.5');
  const old = await q.evaluate(LABELS);
  check('a link made before the switch existed reads local-first, the new default',
    old.indexOf('Kyŏngsŏng') >= 0 && old.indexOf('Keijō') < 0, old.slice(0, 6).join(' | '));
  await q.close();
  await p.close();
}

/* ---- the 1942 population, on that date and no other ---------------- */
/* Asked for on the December 1942 snapshot only. The figures live in the
   per-epoch override, so what is checked is that the date decides it: the same
   province, hovered on both maps, carries the line on one and not on the
   other. The country carries the total and the sex ratio; a province carries
   those and its share and its density as well. */
/* Each date carries its own figures now, and says which kind of number it is:
   1930 is a census and 1942 an estimate. What is checked here is that the
   sentence follows the map — the tooltip on one date must not be quoting the
   other's numbers, which is the way this would go wrong and would look right. */
console.log('\n— the population figures, per date —');
for (const [year, layers, want] of [['1930', '0', 'c30'], ['Dec 1942', '1', 'e42']]) {
  const p = await b.newPage();
  await p.evaluateOnNewDocument(SHIM);
  await p.setViewport({ width: 1200, height: 860 });
  await p.goto('http://localhost:8123/index.html?where=123.5,32.8,132.5,43.5&layers=' + layers,
               { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await new Promise(r => setTimeout(r, 1500));
  const spot = async sel => p.evaluate(s => {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, sel);
  const tip = () => p.evaluate(() => {
    const t = document.querySelector('#tooltip');
    return t && !t.hidden ? t.textContent.trim() : '';
  });
  const hover = async sel => {
    const s = await spot(sel);
    if (!s) return '';
    await p.mouse.move(s.x - 40, s.y);
    await new Promise(r => setTimeout(r, 120));
    await p.mouse.move(s.x, s.y);
    await new Promise(r => setTimeout(r, 420));
    return tip();
  };
  const country = await hover('path[data-for="korea"]');
  const is30 = want === 'c30';
  check(year + ': the country gives that date\'s population',
    is30 ? (/1930 Census Population: 21,058,305/.test(country)
            && /104\.56/.test(country))
         : (/1942 Estimated Population: 24,105,906/.test(country)
            && /100\.4/.test(country)),
    country.slice(-80));
  await p.evaluate(() => {
    const x = [...document.querySelectorAll('#layer-seg button')].find(y => /Admin/.test(y.textContent));
    if (x) x.click();
  });
  await new Promise(r => setTimeout(r, 2600));
  const prov = await hover('#a-korea path[data-prov="Keiki"]');
  check(year + ': Keiki gives that date\'s population, share and density',
    is30 ? (/2,157,413/.test(prov) && /% of Total Korea: 10\.2/.test(prov)
            && /Per km²: 171/.test(prov))
         : (/2,830,778/.test(prov) && /% of Total Korea: 11\.7/.test(prov)
            && /Per km²: 224/.test(prov)),
    prov.slice(-100));
  /* And says which kind of number it is. Printing "Estimated Population" over
     a census is wrong on the face of it, and was. */
  check(year + ': and calls it what it is',
    is30 ? (/Census Population/.test(prov) && !/Estimated/.test(prov))
         : (/Estimated Population/.test(prov) && !/Census/.test(prov)),
    prov.slice(-100));
  /* And the card is the data file, not a copy of it. The figures live in
     data/population/ and are composed into the short at build time, so what
     the reader is shown has to be what that file says — including the
     density, which is not in the source at all and is population over the
     area of the polygon the reader is looking at. */
  if (!is30) {
    const rows = require('fs').readFileSync(
      __dirname + '/../../data/population/korea-1942.csv', 'utf8')
      .trim().split('\n').slice(1)
      .map(l => l.match(/^([^,]*),([^,]*),(?:"[^"]*"|[^,]*),([^,]*),([^,]*),([^,]*),([^,]*)/))
      .filter(Boolean);
    const k = rows.find(r => r[2] === 'Keiki');
    const pop = Number(k[3]), dens = Math.round(pop / Number(k[6]));
    check('Keiki\'s density is its population over its own area',
      new RegExp('Population: ' + pop.toLocaleString('en-US')
                 + '\\b.*Per km²: ' + dens + '\\b').test(prov),
      'want ' + dens + ' — ' + prov.slice(-60));
    const saishu = rows.find(r => r[2] === 'Saishu');
    check('Saishu carries its sentence and no figures',
      !saishu[3] && !saishu[4],
      JSON.stringify(saishu && saishu.slice(3, 7)));
  }
  await p.close();
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
