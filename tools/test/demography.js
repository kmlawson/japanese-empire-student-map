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
  /* Korea has an occupation table and Taiwan has none, so Taiwan is offered
     the two it could draw and Korea all three. */
  check('and offers each place the maps it could draw',
    s.radios.join(' ') === 'density japanese occupation none '
                         + 'density japanese none', s.radios.join(' '));
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

  console.log('\n— a unit the table has nothing for —');
  /* Left alone it showed the country's own colour and the relief through the
     middle of a shaded island, which reads as a fault in the drawing rather
     than as a gap in the table. */
  p = await open(b, 'http://localhost:8123/index.html?where=119.5,21.5,122.5,25.5&layers=1');
  await p.evaluate(() => document.querySelector('#opt-pop-taiwan-density-density').click());
  // and the relief, because the fault reported was the hillshade coming
  // through the blank — with Topography off there is no `#relief` to be above
  await p.evaluate(() => document.querySelector('#opt-relief').click());
  await sleep(5000);
  const na = await p.evaluate(() => {
    const e = document.querySelector('#a-taiwan path[data-prov="TwBanchi"]');
    return { shaded: e && e.classList.contains('pop-shaded'),
             fill: e && getComputedStyle(e).fill,
             key: /no data/.test((document.querySelector('#legend') || {}).textContent || ''),
             voids: document.querySelectorAll('#pop-void path').length,
             voidAbove: (function () {
               const kids = [...document.querySelector('#jmap').children];
               const r = kids.findIndex(x => x.id === 'relief');
               const v = kids.findIndex(x => x.id === 'pop-void');
               return r >= 0 && v > r;
             })(),
             box: (function () {
               const r = e.getBoundingClientRect();
               return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
             })() };
  });
  check('the demarcated territory is blanked rather than left showing the map',
    na.shaded === true && na.fill === 'rgb(255, 255, 255)', na.fill);
  check('and the blank is in the key', na.key === true);
  /* And it is drawn a *second* time, above the relief. The hillshade is an
     `overlay` blend across the whole frame rather than something under the
     land, so a fill alone left the mountains showing through the one hole in
     the table — the fault as reported. Grey took the blend at full strength
     besides, being mid-toned, which is why it is white now. */
  check('and a white copy of it is drawn above the relief',
    na.voids === 1 && na.voidAbove === true,
    na.voids + ' void(s), above relief: ' + na.voidAbove);
  await p.mouse.move(na.box.x - 30, na.box.y); await sleep(200);
  await p.mouse.move(na.box.x, na.box.y); await sleep(600);
  const naTip = await p.evaluate(() =>
    document.querySelector('#tooltip').textContent.replace(/\s+/g, ' '));
  check('and the pointer says so', /N\/A — no data available/.test(naTip),
        naTip.slice(-60));
  /* Taiwan has no occupation table on any date, so that map is not offered at
     all — greying is for a mode another date can answer. */
  const offered = await p.evaluate(() =>
    [...document.querySelectorAll('#pop-rows input')]
      .filter(i => /taiwan/.test(i.id)).map(i => i.value));
  check('and a map this place never had is not offered',
    offered.join(' ') === 'density japanese none', offered.join(' '));
  await p.close();

  console.log('\n— what the date can answer —');
  p = await open(b, KOREA + '&layers=1');              // Dec 1942
  s = await st(p);
  /* Korea's estimate counted a population and a sex ratio: no registers, so no
     Japanese share, and nobody's trade. Taiwan's occupation has no figures on
     either date. */
  check('a date that cannot draw a map says so by greying it',
    s.off.join(' ') === 'japanese occupation', s.off.join(' '));
  /* And says which date can. A greyed switch with nothing beside it reads as a
     switch that is broken, which is how it was reported: "I can't select any
     of these". */
  const why = await p.evaluate(() =>
    [...document.querySelectorAll('#pop-rows input')]
      .filter(i => i.disabled).map(i => i.parentNode.title));
  check('with the date that can, on the row itself',
    why.length === 2 && why.every(t => /On the 1930 map/.test(t)), why.join(' | '));
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

  /* ---------------------------------------- the figure on each unit --- */

  /* A five-step ramp says more, less and about the same. The number is the
     reading itself, so it goes on the shape — and *which* shapes can hold one
     is a question in screen pixels, which is the thing this project keeps
     getting wrong. Taiwan is the case: fifty-five districts, most of them too
     small to letter at the island view and all of them big enough somewhere
     further in. */
  console.log('\n— the figure on each unit —');
  const vals = p2 => p2.evaluate(() => {
    const v = [...document.querySelectorAll('#labels text.popval')];
    const on = v.filter(t => t.style.display !== 'none');
    return { made: v.length, shown: on.length,
             txt: on.map(t => t.textContent),
             inks: [...new Set(on.map(t => t.style.fill))],
             box: on.length ? (function () { const r = on[0].getBoundingClientRect();
               return Math.round(r.height); })() : 0 };
  });

  p = await open(b, KOREA);
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-density').click());
  await sleep(2200);
  let v = await vals(p);
  check('a figure on each of the thirteen', v.made === 13 && v.shown === 13,
        v.made + ' made, ' + v.shown + ' shown');
  check('and it is the density, not the band',
    v.txt.every(t => /^\d+$/.test(t)) && v.txt.indexOf('37') >= 0,
    v.txt.join(' '));
  /* The ink turns over with the band: dark type on the three pale classes and
     white on the two dark ones, which is the only way one figure is legible on
     a five-step ramp. */
  check('dark type where the ground is pale',
    v.inks.indexOf('rgb(22, 35, 46)') >= 0, v.inks.join(' '));

  /* And with Other off, because a density figure is not a name. The master
     switch used to be asked once for the whole gate pass, which would have
     taken these with it. */
  await p.evaluate(() => {
    const btn = document.querySelector('#layer-seg button[data-opt="labels"]');
    if (btn.getAttribute('aria-pressed') === 'true') btn.click();
  });
  await sleep(1600);
  v = await vals(p);
  check('written with Other off — a figure is not a name', v.shown === 13,
        String(v.shown));

  /* A share is said as a share, to a tenth, and always to a tenth: 3.0 beside
     2.6 and 4.4 must not come out as "3". */
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-japanese').click());
  await sleep(1800);
  v = await vals(p);
  check('the share map says percentages',
    v.txt.every(t => /^\d+(\.\d)?%$/.test(t)) && v.txt.some(t => /\.\d%$/.test(t)),
    v.txt.join(' '));
  // and a pie map has none: the pie is the reading there
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-occupation').click());
  await sleep(1800);
  v = await vals(p);
  check('a pie map writes no figures', v.made === 0, String(v.made));

  /* And the figures follow the switch **on the press**, not at the next zoom.
     They are built by the gate, the gate runs on a zoom, and `applyState`
     ran it *before* `applyPop` marked them dirty — so the rebuild waited for
     whatever gated next. Any interaction that gates in between eats the mark:
     open a province card and then change the map, and the old numbers stay on
     it until the reader touches the wheel, which is how it was reported. */
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-density').click());
  await sleep(1800);
  const before = (await vals(p)).txt.join(' ');
  await p.mouse.click(640, 470); await sleep(1000);      // a card, which gates
  await p.mouse.click(640, 470); await sleep(1000);
  await p.evaluate(() => document.querySelector('#opt-pop-korea-density-japanese').click());
  await sleep(1600);                                      // no zoom, no pan
  const after = (await vals(p)).txt.join(' ');
  check('the figures follow the switch without a zoom',
    /%/.test(after) && after !== before, after.slice(0, 40));
  await p.close();

  /* Taiwan, at two zooms. The prefectures and the larger districts answer at
     the island view; the rest come in as the reader does. The unit with no
     figure never gets one at either. */
  const TW_WIDE = 'http://localhost:8123/index.html?layers=1&where=118.8,21.4,122.6,25.8';
  const TW_NEAR = 'http://localhost:8123/index.html?layers=1&where=120.4,24.2,122.0,25.4';
  p = await open(b, TW_WIDE);
  await p.evaluate(() => document.querySelector('#opt-pop-taiwan-density-density').click());
  await sleep(2400);
  const twWide = await vals(p);
  check('fifty-five districts have a figure, the blank one has none',
    twWide.made === 55, String(twWide.made));
  check('and not all of them fit at the island view',
    twWide.shown < twWide.made && twWide.shown > 20,
    twWide.shown + ' of ' + twWide.made);
  await p.close();

  p = await open(b, TW_NEAR);
  await p.evaluate(() => document.querySelector('#opt-pop-taiwan-density-density').click());
  await sleep(2400);
  const twNear = await vals(p);
  /* The city districts are the point of the test: Kīrun and Taihoku city are a
     few pixels wide at the island view and are lettered once the reader is in.
     They are also the two deepest bands, so this is where the white ink is. */
  check('a city district is lettered once there is room',
    twNear.txt.indexOf('7813') >= 0 && twNear.txt.indexOf('2010') >= 0,
    twNear.txt.join(' '));
  check('and the ink turns white on the deep bands',
    twNear.inks.indexOf('rgb(255, 255, 255)') >= 0, twNear.inks.join(' '));
  check('the figures are the same size on screen at both zooms',
    Math.abs(twNear.box - twWide.box) <= 1, twWide.box + 'px then ' + twNear.box + 'px');
  await p.close();

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
