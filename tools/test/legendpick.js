/* The key used as a set of switches.
 *
 *     node tools/test/legendpick.js       # with a server on 8123
 *
 * Option-click the year at the head of the key — or hold it, which is the
 * touch half of the same gesture — and every row that stands for something on
 * the map grows a tick box. Untick *Client states* and Manchukuo and
 * Mengchiang come off; open *Colonies & leased territory* and untick Kwantung
 * alone, and Chōsen and Taiwan stay; untick *Cities* and the dots go and the
 * button in the bar goes out with them.
 *
 * What is checked, and why each would go wrong quietly:
 *
 *   * **a category comes off in five layers, not one.** A territory is a fill,
 *     a filler underneath, seam strips beside it, a ring in the outline layer
 *     and sometimes hatching — the East Asia switch found all five the hard
 *     way, and this rides through the same rule so that it cannot find them
 *     again;
 *   * **the rows that already had a switch are that switch.** Cities, Events,
 *     Places of interest, the rivers, the line of control: ticking one here is
 *     ticking it in the panel, and the panel is written from the same state.
 *     Two lists of the same thing is how they come to disagree;
 *   * **a row that is off is still listed while the boxes show.** Off and
 *     unlisted is the normal key; off and unticked is a switch. Listed only
 *     when on, a row could be turned off and never turned back;
 *   * **Reset offers itself only when there is something to put back.** Cities
 *     and Events start off, so "any box is clear" would offer it on an
 *     untouched map and pressing it would switch on layers nobody asked for;
 *   * **and both doors work.** The hold opens on the hold and swallows the
 *     click it still sends; the option-click toggles. One shared toggle turned
 *     the boxes on and straight off again.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('legendpick test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

/* 1942, cities on, the rivers and the line of control on — the map's own
   footing, so that Reset has nothing to offer until something is taken off. */
const WHOLE = 'http://localhost:8123/index.html?layers=2r&where=95,10,150,50';

const st = p => p.evaluate(() => {
  const row = re => [...document.querySelectorAll('#legend .item')]
    .find(x => re.test(x.textContent));
  const tick = re => { const r = row(re); if (!r) return 'absent';
    const i = r.querySelector('input'); return i ? String(i.checked) : 'no tick'; };
  return {
    ticks: document.querySelectorAll('#legend .legend-tick').length,
    reset: !!document.querySelector('#legend .legend-reset'),
    folded: document.querySelector('#legend').classList.contains('folded'),
    epoch: [...document.querySelectorAll('#epoch-seg button')]
      .filter(b => b.classList.contains('on')).map(b => b.textContent)[0],
    atoms: [...document.querySelectorAll('#land .atom')]
      .filter(e => e.style.display !== 'none').length,
    client: tick(/Client states/),
    cities: tick(/Cities & ports/),
    rivers: tick(/Yangzi/),
    citiesBtn: document.querySelector('#layer-seg button[data-cat="city"]')
      .getAttribute('aria-pressed'),
    riversBox: document.querySelector('#opt-rivers').checked,
    dots: [...document.querySelectorAll('#markers .site')]
      .filter(e => e.style.display !== 'none').length,
    // a reading rather than a layer: the four sizes of city dot take no tick
    townTick: tick(/^\s*Town/),
    carets: document.querySelectorAll('#legend .legend-open').length,
    subs: [...document.querySelectorAll('#legend .item.legend-sub')]
      .map(e => e.textContent.trim()),
    subTicks: [...document.querySelectorAll('#legend .item.legend-sub input')]
      .map(i => i.checked),
    colony: (function () {
      const r = row(/Colonies & leased territory/);
      const i = r && r.querySelector('input');
      return i ? (i.indeterminate ? 'mixed' : String(i.checked)) : 'absent';
    })(),
  };
});

const clickRow = (p, re) => p.evaluate(rx => {
  const r = [...document.querySelectorAll('#legend .item.pickable')]
    .find(x => new RegExp(rx).test(x.textContent));
  if (!r) return false;
  r.querySelector('input').click();
  return true;
}, re.source);

const open = async (b, vp) => {
  const p = await b.newPage();
  await p.setViewport(vp || { width: 1280, height: 950 });
  await p.goto(WHOLE, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2800);
  return p;
};

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— the boxes are not there until they are asked for —');
  let p = await open(b);
  let s = await st(p);
  check('no ticks on a plain key', s.ticks === 0, String(s.ticks));
  check('and no Reset', s.reset === false);
  const atoms0 = s.atoms;

  console.log('\n— option-click the year at the head of the key —');
  await p.keyboard.down('Alt');
  await p.click('#legend .legend-head');
  await p.keyboard.up('Alt');
  await sleep(900);
  s = await st(p);
  check('the rows grow ticks', s.ticks > 12, String(s.ticks));
  check('and the year does not change', s.epoch === 'Dec 1942', s.epoch);
  // a plain press on the head folds the key, so it must not have folded
  check('the key unfolds to show them', s.folded === false);
  check('nothing is off yet, so no Reset', s.reset === false);
  /* The three that start off are listed and unticked, which is the only way
     they can be turned on from here. */
  check('a layer that is off is listed, unticked',
    s.cities === 'true' && /^(true|false)$/.test(s.rivers), 'cities ' + s.cities);
  check('and a row that only explains a mark takes no tick',
    s.townTick === 'no tick', s.townTick);

  console.log('\n— a category comes off the map —');
  check('the row is there to press', await clickRow(p, /Client states/));
  await sleep(1400);
  s = await st(p);
  check('Client states unticks', s.client === 'false', s.client);
  check('and its territories leave the map', s.atoms < atoms0,
    s.atoms + ' of ' + atoms0);
  check('Reset appears', s.reset === true);

  console.log('\n— and a row that is also a switch in the panel —');
  await clickRow(p, /Cities & ports/);
  await sleep(1400);
  s = await st(p);
  check('the dots go', s.dots === 0, String(s.dots));
  check('and the button in the bar goes out with them',
    s.citiesBtn === 'false', s.citiesBtn);

  console.log('\n— a category opened out into the places in it —');
  /* Six colonies under one colour, and the reader wants Kwantung off with
     Chōsen left on. The category row is what stands for them, so its own box
     has to be able to say "some of these". */
  const opened = await p.evaluate(() => {
    const r = [...document.querySelectorAll('#legend .item')]
      .find(x => /Colonies & leased territory/.test(x.textContent));
    const c = r && r.querySelector('.legend-open');
    if (!c) return false;
    c.click();
    return true;
  });
  check('the category has a caret to open', opened === true);
  await sleep(700);
  s = await st(p);
  check('and the places under it are listed',
    s.subs.length === 6 && s.subs.some(x => /Kwantung/.test(x))
    && s.subs.some(x => /Ch.sen/.test(x)), s.subs.join(' | '));
  const atomsBefore = s.atoms;
  await p.evaluate(() => {
    const r = [...document.querySelectorAll('#legend .item.legend-sub')]
      .find(x => /Kwantung/.test(x.textContent));
    r.querySelector('input').click();
  });
  await sleep(1400);
  s = await st(p);
  check('unticking one takes that one off', s.atoms === atomsBefore - 1,
    s.atoms + ' of ' + atomsBefore);
  check('and leaves the rest of the category on',
    s.subTicks.filter(Boolean).length === 5, JSON.stringify(s.subTicks));
  /* Some on and some off. A box reading plainly true or false would be saying
     something untrue about six places in two states. */
  check('the category\'s own box goes indeterminate', s.colony === 'mixed',
    s.colony);
  await p.evaluate(() => {
    const r = [...document.querySelectorAll('#legend .item')]
      .find(x => /Colonies & leased territory/.test(x.textContent));
    r.querySelector('input').click();
  });
  await sleep(1400);
  s = await st(p);
  check('and the category box takes the whole category off',
    s.subTicks.every(function (x) { return x === false; })
    && s.atoms < atomsBefore - 1, s.atoms + ', ' + JSON.stringify(s.subTicks));

  console.log('\n— the panel writes back to the key —');
  await p.evaluate(() => document.querySelector('#opt-rivers').click());
  await sleep(1400);
  s = await st(p);
  check('unticking the rivers in the panel unticks them here',
    s.rivers === 'false', s.rivers);

  console.log('\n— Reset —');
  await p.evaluate(() => document.querySelector('#legend .legend-reset').click());
  await sleep(1500);
  s = await st(p);
  check('the categories come back', s.atoms === atoms0,
    s.atoms + ' of ' + atoms0);
  check('and the rivers with them',
    s.rivers === 'true' && s.riversBox === true, s.rivers);
  /* Cities is left where the reader put it: it starts off, so Reset must not
     switch it on — that would be putting back something that was never there. */
  check('but Cities is left alone, being off by default',
    s.citiesBtn === 'false', s.citiesBtn);
  check('and the button goes when there is nothing to reset', s.reset === false);
  await p.close();

  console.log('\n— and with a finger —');
  p = await open(b, { width: 430, height: 900, isMobile: true, hasTouch: true });
  const at = await p.evaluate(() => {
    const r = document.querySelector('#legend .legend-head').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(800);                        // past the hold
  await p.mouse.up();
  await sleep(900);
  s = await st(p);
  check('a long press opens the boxes', s.ticks > 12, String(s.ticks));
  check('and unfolds the key rather than folding it', s.folded === false);
  /* And a short press is still the fold, with the boxes left showing: the hold
     swallows its own click and nothing else. */
  await p.mouse.move(at.x, at.y);
  await p.mouse.down(); await sleep(60); await p.mouse.up();
  await sleep(1000);
  check('a short press still folds the key', (await st(p)).folded === true);
  await p.mouse.move(at.x, at.y);
  await p.mouse.down(); await sleep(60); await p.mouse.up();
  await sleep(1000);
  s = await st(p);
  check('and unfolds it again, with the boxes still there',
    s.folded === false && s.ticks > 12, s.ticks + ' ticks');
  await p.close();

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
