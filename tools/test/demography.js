/* Three maps of the same thirteen shapes, and one switch between them.
 *
 *     node tools/test/demography.js       # with a server on 8123
 *
 * The Layers panel offers a place — Korea — and under it the maps of it:
 * Population Density, Citizenship Density, Occupation Density, None. Radios
 * and not ticks, because they are three answers to three questions about the
 * same ground and two at once is neither.
 *
 * What is checked, and why each would go wrong quietly:
 *
 *   * **a map the date cannot draw is greyed, not offered.** The 1942 estimate
 *     counted a population and a sex ratio and asked nobody their trade;
 *     leaving those radios live would give the reader a switch that does
 *     nothing when it is pressed, which reads as a fault in the map;
 *   * **the pies are screen pixels.** They are drawn once at a fixed radius
 *     and scaled by `k` on every rescale. Drawn in map units they would be
 *     dots at the island view and continents four wheel steps in — this
 *     project's most-repeated bug, and the sugar layer made it again the same
 *     afternoon;
 *   * **the mode survives a link.** It rides above the bitwise field, in
 *     arithmetic, because `|=` is 32-bit signed and bit 31 comes back
 *     negative — which it did, as `layers=-zik0zk`;
 *   * **and the shapes are drawn.** Thirteen pies floating on one red country
 *     say nothing about which province is which, so the boundaries come with
 *     the layer.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('demography test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const KOREA = 'http://localhost:8123/index.html?where=123.5,32.8,132.5,43.5';
const open = async (b, url) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2800);
  return p;
};
const st = p => p.evaluate(() => ({
  sub: (document.querySelector('#pop-rows .pane-sub') || {}).textContent,
  subs: [...document.querySelectorAll('#pop-rows .pane-sub')].map(e => e.textContent),
  radios: [...document.querySelectorAll('#pop-rows input')].map(i => i.value),
  on: [...document.querySelectorAll('#pop-rows input')].filter(i => i.checked).map(i => i.value),
  off: [...document.querySelectorAll('#pop-rows input')].filter(i => i.disabled).map(i => i.value),
  pies: document.querySelectorAll('#pop-pies .pop-pie').length,
  slices: document.querySelectorAll('#pop-pies .pie-slice').length,
  edged: document.querySelectorAll('path.pop-edged').length,
  shaded: document.querySelectorAll('path.pop-shaded').length,
  key: ((document.querySelector('#legend') || {}).textContent || '').replace(/\s+/g, ' '),
  code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1],
}));

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— the panel —');
  let p = await open(b, KOREA + '&layers=0');          // 1930, nothing on
  let s = await st(p);
  check('the section is headed with the place', s.sub === 'Korea', s.sub);
  /* Two places now, each with the same four choices under it: a group is a
     country and the panel is written from the folder. */
  check('and offers the three maps and none, per place',
    s.radios.join(' ') === 'density japanese occupation none '
                         + 'density japanese occupation none', s.radios.join(' '));
  check('none of them to begin with',
    s.on.join(' ') === 'none none', s.on.join(' '));
  check('and nothing drawn', s.pies === 0 && s.shaded === 0);

  console.log('\n— the three maps —');
  /* Two of them shade and one draws pies. Proportion Japanese is a share and
     has its own ladder: a pie whose largest slice is 93% was a shape with a
     sliver in it, which is why it stopped being a pie. */
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-japanese').click());
  await sleep(1600);
  s = await st(p);
  check('japanese: it shades rather than drawing pies',
    s.shaded === 14 && s.pies === 0, s.shaded + ' shaded, ' + s.pies + ' pies');
  /* The key's rows run together once the whitespace is collapsed, so what is
     looked for is the wording, not the spacing. */
  check('and the key says what the share is of',
    /Proportion Japanese/.test(s.key) && /naichijin\) register/.test(s.key)
    && /under 1/.test(s.key), s.key.slice(-120));
  for (const [mode, want] of [['occupation', 9]]) {
    await p.evaluate(m => document.querySelector('#opt-pop-korea-density-' + m).click(), mode);
    await sleep(1600);
    s = await st(p);
    check(mode + ': a pie over each of the thirteen', s.pies === 13, String(s.pies));
    /* Not 13 × the number of categories: a slice with nobody in it is not
       drawn, and several provinces had no Taiwanese and no Karafuto register
       at all. What must hold is that no province has more slices than there
       are categories, and that between them they use the lot. */
    check(mode + ': and no more slices than there are categories',
      s.slices <= 13 * want && s.slices >= 13, String(s.slices));
    check(mode + ': the boundaries come with it', s.edged >= 13, String(s.edged));
    check(mode + ': and nothing is shaded — the pie is the reading',
      s.shaded === 0, String(s.shaded));
    check(mode + ': the key says what a slice is a share of',
      new RegExp(mode === 'occupation'
        ? 'share of those in gainful occupation' : 'share of the population')
        .test(s.key), s.key.slice(-90));
  }
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-density').click());
  await sleep(1600);
  s = await st(p);
  check('density: the choropleth, and the pies put away',
    s.shaded === 14 && s.pies === 0, s.shaded + ' shaded, ' + s.pies + ' pies');
  const code = s.code;
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-none').click());
  await sleep(1200);
  s = await st(p);
  check('none: nothing at all', s.shaded === 0 && s.pies === 0 && s.edged === 0);
  await p.close();

  console.log('\n— what the date can answer —');
  p = await open(b, KOREA + '&layers=1');              // Dec 1942
  s = await st(p);
  /* Korea's estimate counted a population and a sex ratio: no registers, so no
     Japanese share, and nobody's trade. Taiwan's occupation has no figures on
     either date. */
  check('a date that cannot draw a map says so by greying it',
    s.off.join(' ') === 'japanese occupation occupation', s.off.join(' '));
  /* And says which date can. A greyed switch with nothing beside it reads as a
     switch that is broken, which is how it was reported: "I can't select any
     of these". */
  const why = await p.evaluate(() =>
    [...document.querySelectorAll('#pop-rows input')]
      .filter(i => i.disabled).map(i => i.parentNode.title));
  check('with the date that can, on the row itself, where there is one',
    why.length === 3 && why.filter(t => /1930/.test(t)).length === 2
    && why.some(t => /No figures/.test(t)), why.join(' | '));
  check('the density map is still offered', s.off.indexOf('density') < 0);
  await p.close();

  console.log('\n— through a link —');
  /* Every mode, out and back. The high field is arithmetic and the low one is
     bitwise, and mixing them is how this went wrong the first time. */
  for (const mode of ['japanese', 'occupation', 'density']) {
    p = await open(b, KOREA + '&layers=0');
    await p.evaluate(m => document.querySelector('#opt-pop-korea-density-' + m).click(), mode);
    await sleep(1500);
    const wrote = (await st(p)).code;
    check(mode + ': the code is a positive number', !/^-/.test(wrote), wrote);
    await p.close();
    p = await open(b, KOREA + '&layers=' + wrote);
    s = await st(p);
    check(mode + ': and opens the same map again',
      s.on.join(' ') === mode + ' none'
      && (mode === 'occupation' ? s.pies === 13 : s.shaded === 14),
      s.on.join(' ') + ' — ' + s.shaded + ' shaded, ' + s.pies + ' pies');
    await p.close();
  }

  console.log('\n— the size of a pie —');
  /* Measured at two zooms, because one zoom proves nothing about a scale: at
     the opening view `k` is about 1 and map units and screen pixels are
     interchangeable, which is why this bug always passes the first test. */
  // the occupation map, which is the one that draws pies
  p = await open(b, KOREA + '&layers=1h9u1hc');
  await p.waitForSelector('#pop-pies .pop-pie', { timeout: 15000 });
  const wide = await p.evaluate(() => {
    const g = document.querySelector('#pop-pies .pop-pie');
    const r = g.getBoundingClientRect();
    return Math.round(r.width);
  });
  await p.evaluate(() => {
    const z = document.querySelector('#zoom-in');
    for (let i = 0; i < 6; i++) z.click();
  });
  await sleep(1800);
  const close = await p.evaluate(() => {
    const g = document.querySelector('#pop-pies .pop-pie');
    const r = g.getBoundingClientRect();
    return Math.round(r.width);
  });
  check('a pie is the same size six wheel steps in',
    Math.abs(wide - close) <= 2 && wide > 20 && wide < 40,
    wide + ' px then ' + close + ' px');
  await p.close();

  /* ---- and the pie the pointer is on ------------------------------- */
  /* A pie on the map is a shape at a glance; the number is what a reader wants
     next, and the tooltip is where they are already looking. It takes the
     description's place on those provinces — the reader asked about the
     register or the trade, not about the ground. */
  console.log('\n— the pie in the tooltip —');
  p = await open(b, KOREA + '&layers=1h9u1hc');          // the occupation pies
  // the provinces arrive with the administrative sheet, which is fetched only
  // because this layer asked for it: wait for the shape rather than for a clock
  await p.waitForSelector('#a-korea path[data-prov="Keiki"]', { timeout: 15000 });
  await sleep(600);
  const at = await p.evaluate(() => {
    const e = document.querySelector('#a-korea path[data-prov="Keiki"]');
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await p.mouse.move(at.x - 40, at.y); await sleep(200);
  await p.mouse.move(at.x, at.y); await sleep(600);
  let tip = await p.evaluate(() => {
    const t = document.querySelector('#tooltip');
    return { name: t.firstChild ? t.firstChild.textContent : '',
             pie: !!t.querySelector('.tip-pie svg path'),
             slices: t.querySelectorAll('.tip-pie svg path').length,
             rows: [...t.querySelectorAll('.tip-pie-row')].map(r => r.textContent),
             of: (t.querySelector('.tip-pie-of') || {}).textContent || '',
             note: !!t.querySelector('.prov-note') };
  });
  /* The province has to answer the pointer at all, which is the gate this went
     wrong on: only `pop-shaded` was allowed through it, so with a pie map up
     the provinces went back to not answering and the pie never appeared. */
  check('hovering a province names it', /Ky.nggi/.test(tip.name), tip.name);
  check('and draws its pie, big, in the tooltip', tip.pie && tip.slices >= 3,
        tip.slices + ' slices');
  /* Every register and nationality, none folded away: a share too small to
     round to a tenth is said as that rather than as nought. */
  check('with every share named',
    tip.rows.length === 9 && /Agriculture62\.3%/.test(tip.rows[0]),
    tip.rows.join(' | '));
  check('and what the shares are of',
    /share of those in gainful occupation, 1930/.test(tip.of), tip.of);
  check('the description stands aside for it', tip.note === false);
  /* And the shaded map has no pie to show under the pointer: the province is
     still named and still says its figures, but the tooltip does not invent a
     pie for a single share. */
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-japanese').click());
  await sleep(1600);
  await p.mouse.move(at.x - 40, at.y); await sleep(200);
  await p.mouse.move(at.x, at.y); await sleep(600);
  const shadeTip = await p.evaluate(() => {
    const t = document.querySelector('#tooltip');
    return { pie: !!t.querySelector('.tip-pie'), note: !!t.querySelector('.prov-note') };
  });
  check('a shaded map puts no pie in the tooltip', shadeTip.pie === false);
  check('and gives the description back', shadeTip.note === true);
  await p.close();

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
