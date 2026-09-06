/* The five kinds of name behind the Other button.
 *
 *     node tools/test/labelcats.js        # with a server on 8123
 *
 * Other has always been one switch: names on, names off. It is still that —
 * a plain press is the master, and most readers will never want anything else
 * — with the five sorts of name behind it, in a Labels section of the panel
 * and in a menu the button itself opens.
 *
 * What is checked, and why each would go wrong quietly:
 *
 *   * **a tick is what is written, not what is remembered.** With Other off
 *     every row reads unticked, because nothing is on the map; what the reader
 *     chose is kept underneath and comes back when they press Other again. The
 *     two are easy to conflate and the conflation is invisible until somebody
 *     turns four rows off, turns Other off and on, and finds them back;
 *   * **the master switch is asked one kind at a time.** It used to be asked
 *     once for the whole gate pass. Moving it into `labelVisible` is what lets
 *     a category say no on its own — and what lets the density figures, which
 *     are not names, be written with Other off;
 *   * **the rows are inverted in the layers code.** A link written before this
 *     existed carries zeroes there, and read the obvious way round that would
 *     open with every name switched off — the opposite of what its sender saw;
 *   * **and both doors open the menu.** The option-click and the long press
 *     arrive differently: the hold has already opened it and its click must be
 *     swallowed, which is not the same code as the option-click's toggle. Done
 *     the same way, the hold opened the menu and its own click shut it again.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('labelcats test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

/* Central China, in far enough for the province names: the four provinces and
   the Dabie Mountains are what tells the categories apart from one another. */
const CHINA = 'http://localhost:8123/index.html?where=108.5,26.5,118.5,33.5';

/* Headless Chrome does not match `(hover: hover) and (pointer: fine)`, so the
   hover handlers are never wired and a mouse test measures nothing. */
const HOVER = () => {
  const real = window.matchMedia;
  window.matchMedia = q => (/hover: hover|pointer: fine/.test(q)
    ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
    : real.call(window, q));
};

const open = async (b, url, vp) => {
  const p = await b.newPage();
  if (!vp) await p.evaluateOnNewDocument(HOVER);
  await p.setViewport(vp || { width: 1280, height: 950 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2800);
  return p;
};

const st = p => p.evaluate(() => ({
  panel: [...document.querySelectorAll('#label-rows input')]
    .map(i => i.getAttribute('data-lcat') + '=' + i.checked).join(' '),
  menu: [...document.querySelectorAll('#label-menu input')]
    .map(i => i.getAttribute('data-lcat') + '=' + i.checked).join(' '),
  menuOpen: !document.querySelector('#label-menu').hidden,
  other: document.querySelector('#layer-seg button[data-opt="labels"]')
    .getAttribute('aria-pressed'),
  code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1],
  names: [...document.querySelectorAll('#labels text')]
    .filter(t => t.style.display !== 'none' && t.textContent.trim())
    .map(t => t.textContent.trim()),
}));

const ALL_ON = 'territory=true city=true sub=true poi=true feature=true';
const ALL_OFF = 'territory=false city=false sub=false poi=false feature=false';
/* **The airports are a sixth row in the menu and not a sixth category.** They
   belong to the air layer rather than to the map's own five kinds of name — so
   they are appended to the menu beside the five rather than added to
   `LABEL_CATS`, whose five places in the layer code stay as they are. They
   answer the same two questions the five do (is Other on, is this row ticked),
   which is why they read the same here. */
const ALL_ON_MENU = ALL_ON + ' airport=true';
const ALL_OFF_MENU = ALL_OFF + ' airport=false';

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— the panel and the menu are the same five rows —');
  let p = await open(b, CHINA);
  let s = await st(p);
  check('five rows in the Layers panel',
    s.panel.split(' ').length === 5, s.panel);
  check('and those five plus the airports in the button\'s menu',
    s.menu.split(' ').length === 6 && /(^| )airport=/.test(s.menu), s.menu);
  check('all unticked while Other is off', s.panel === ALL_OFF, s.panel);
  check('and nothing written', s.names.length === 0, String(s.names.length));

  console.log('\n— Other writes all five —');
  await p.click('#layer-seg button[data-opt="labels"]');
  await sleep(1600);
  s = await st(p);
  check('every row ticks', s.panel === ALL_ON, s.panel);
  check('the menu agrees', s.menu === ALL_ON_MENU, s.menu);
  /* Four provinces and one physical feature, which is what this frame holds
     with Cities off: it is the province names that a category has to be able
     to take away on its own. */
  check('and the province names are on the map',
    s.names.filter(n => /Húběi|Ānhuī|Jiāngxī|Húnán/.test(n)).length === 4,
    s.names.join(' '));

  console.log('\n— one row off, the rest left alone —');
  await p.evaluate(() => document.querySelector('#opt-lcat-sub').click());
  await sleep(1600);
  s = await st(p);
  check('the row unticks', /sub=false/.test(s.panel), s.panel);
  check('and so does the menu\'s copy of it', /sub=false/.test(s.menu), s.menu);
  check('the province names go', !/Húběi|Húnán/.test(s.names.join(' ')),
    s.names.join(' '));
  check('the feature stays', /Dabie/.test(s.names.join(' ')), s.names.join(' '));
  check('and Other is still on', s.other === 'true', s.other);
  const partial = s.code;
  await p.close();

  console.log('\n— and it survives the link —');
  p = await open(b, CHINA + '&layers=' + partial);
  s = await st(p);
  check('the row is off where it was left', /sub=false/.test(s.panel), s.panel);
  check('the other four are on',
    /territory=true/.test(s.panel) && /feature=true/.test(s.panel), s.panel);
  check('and the province names are still gone',
    !/Húběi|Húnán/.test(s.names.join(' ')), s.names.join(' '));
  await p.close();

  /* An address written before the rows existed has zeroes where they sit, and
     must open with all five on: `16` is bit 4, which is Other and nothing
     else. This is the whole reason the bits are stored inverted. */
  console.log('\n— an older link means what it meant —');
  p = await open(b, CHINA + '&layers=g');
  s = await st(p);
  check('a link with only the names bit opens with all five',
    s.panel === ALL_ON, s.panel);
  check('and writes the province names',
    s.names.filter(n => /Húběi|Ānhuī|Jiāngxī|Húnán/.test(n)).length === 4,
    s.names.join(' '));

  console.log('\n— turning off the last row is turning Other off —');
  for (const id of ['territory', 'city', 'sub', 'poi', 'feature']) {
    await p.evaluate(i => document.querySelector('#opt-lcat-' + i).click(), id);
    await sleep(700);
  }
  s = await st(p);
  check('Other goes out', s.other === 'false', s.other);
  check('every row reads unticked', s.panel === ALL_OFF, s.panel);
  check('and nothing is written', s.names.length === 0, s.names.join(' '));
  /* And the five are put back on underneath, so the next press of Other
     writes names rather than nothing. The code is the proof: no inverted bit
     is set, which is what "all five on" is written as. */
  await p.click('#layer-seg button[data-opt="labels"]');
  await sleep(1600);
  s = await st(p);
  check('pressing Other again brings all five back', s.panel === ALL_ON, s.panel);
  await p.close();

  console.log('\n— a tick with Other off turns Other on —');
  p = await open(b, CHINA);
  await p.evaluate(() => document.querySelector('#opt-lcat-feature').click());
  await sleep(1600);
  s = await st(p);
  check('Other comes on', s.other === 'true', s.other);
  check('and the map is written', s.names.length > 0, String(s.names.length));
  /* **And only the row that was pressed.** Reported: the first tick put every
     name on the map. With Other off nothing is written, so all five rows show
     unticked while all five settings are remembered as true — and turning the
     master switch on wrote the lot. The press names one kind of name. */
  const only = await p.evaluate(() => [...document.querySelectorAll('#label-rows input')]
    .map(i => ({ id: i.id, on: i.checked })));
  check('  and only the row that was pressed',
    only.filter(x => x.on).length === 1
    && /feature$/.test((only.find(x => x.on) || {}).id || ''),
    JSON.stringify(only.filter(x => x.on).map(x => x.id)));

  console.log('\n— the menu, with a mouse —');
  check('closed to begin with', s.menuOpen === false);
  await p.keyboard.down('Alt');
  await p.click('#layer-seg button[data-opt="labels"]');
  await p.keyboard.up('Alt');
  await sleep(600);
  s = await st(p);
  check('option-click opens it', s.menuOpen === true);
  check('and does not toggle the layer', s.other === 'true', s.other);
  /* A second option-click closes it again; a plain press anywhere else does
     too, and is the way most readers will leave it. */
  await p.keyboard.down('Alt');
  await p.click('#layer-seg button[data-opt="labels"]');
  await p.keyboard.up('Alt');
  await sleep(500);
  check('and a second option-click closes it',
    (await st(p)).menuOpen === false);
  await p.close();

  console.log('\n— and with a finger —');
  /* No matchMedia shim here: this is the touch half, and it has to be driven
     with pointer events rather than `click()`. */
  p = await open(b, CHINA + '&layers=g',
                 { width: 430, height: 900, isMobile: true, hasTouch: true });
  const at = await p.evaluate(() => {
    const r = document.querySelector('#layer-seg button[data-opt="labels"]')
      .getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(800);                       // past LABEL_HOLD_MS
  await p.mouse.up();
  await sleep(700);
  s = await st(p);
  check('a long press opens the menu', s.menuOpen === true);
  /* The press that opened it must not also be the press that toggles the
     layer — and the click it still sends must not close what the hold just
     opened, which is what a shared toggle did. */
  check('and leaves the layer where it was', s.other === 'true', s.other);
  check('the menu is on the screen', await p.evaluate(() => {
    const r = document.querySelector('#label-menu').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
  }));
  /* A tap on a row works the same as a tick in the panel. */
  await p.evaluate(() => document.querySelector('#menu-lcat-sub').click());
  await sleep(1400);
  s = await st(p);
  check('a row in the menu writes through to the panel',
    /sub=false/.test(s.panel) && /sub=false/.test(s.menu), s.panel);
  // and a short press is still the master switch
  await p.evaluate(() => { document.querySelector('#label-menu').hidden = true; });
  await p.mouse.move(at.x, at.y);
  await p.mouse.down(); await sleep(60); await p.mouse.up();
  await sleep(1400);
  s = await st(p);
  check('a short press still turns the layer off', s.other === 'false', s.other);
  await p.close();

  await b.close();
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
})();
