/* The colour scheme: the reader's system, and the reader's override.
 *
 *     node tools/test/theme.js         # with a server on 8123
 *
 * The page followed `prefers-color-scheme` and nothing else until now. Three
 * things have to hold.
 *
 * **The two dark lists are one list.** CSS cannot say "this media query *or*
 * this attribute" in a single rule, so the dark tokens are written twice —
 * once under `:root:not([data-theme="light"])` inside the media query and once
 * under `:root[data-theme="dark"]` outside it. Two copies of anything drift.
 * This reads styles.css and compares them declaration for declaration, which
 * is the guard the comment in the file promises.
 *
 * **Every scheme difference is a token.** The seven scattered
 * `prefers-color-scheme` blocks that patched rules one at a time are gone; if
 * one comes back, forcing the scheme will move the media query's rules and not
 * the attribute's, and the map will be half dark. So: one dark block in the
 * file, and it is the token block.
 *
 * **The override works both ways round.** Light on a dark system and dark on a
 * light one, checked against the ocean — which is the one map colour the
 * scheme is allowed to move — and against the panel, which is chrome.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('theme test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { ready } = require('./settle.js');
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const CSS = fs.readFileSync(path.join(__dirname, '..', '..', 'styles.css'), 'utf8');

/* The declarations of the rule that starts at `sel`, as `name: value` lines
   with comments and blank lines dropped. Deliberately crude — the two blocks
   this compares are written one after the other in the file and neither
   contains a nested rule. */
function declsAfter(sel) {
  const i = CSS.indexOf(sel);
  if (i < 0) return null;
  const open = CSS.indexOf('{', i);
  let depth = 0, j = open;
  for (; j < CSS.length; j++) {
    if (CSS[j] === '{') depth++;
    else if (CSS[j] === '}') { depth--; if (!depth) break; }
  }
  return CSS.slice(open + 1, j)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

const STATE = () => {
  const root = getComputedStyle(document.documentElement);
  return {
    attr: document.documentElement.getAttribute('data-theme'),
    ocean: root.getPropertyValue('--ocean').trim(),
    panel: root.getPropertyValue('--panel').trim(),
    ink: root.getPropertyValue('--ink').trim(),
    grat: root.getPropertyValue('--grat-ink').trim(),
    sub: root.getPropertyValue('--sub-ink').trim(),
    seg: [...document.querySelectorAll('#theme-seg button')]
      .map(b => b.getAttribute('data-theme') + (b.classList.contains('on') ? '*' : '')),
    url: location.search,
  };
};

const LIGHT_OCEAN = '#cadfeb', DARK_OCEAN = '#1d3d4f';

(async () => {
console.log('\n— the two dark lists are one list —');
{
  const auto = declsAfter(':root:not([data-theme="light"])');
  const forced = declsAfter(':root[data-theme="dark"]');
  check('the media query has a guarded dark block', !!auto && auto.length > 10,
    auto ? auto.length + ' declarations' : 'not found');
  check('and the attribute has one of its own', !!forced && forced.length > 10,
    forced ? forced.length + ' declarations' : 'not found');
  check('they declare exactly the same things',
    !!auto && !!forced && auto.join('|') === forced.join('|'),
    auto && forced
      ? 'auto-only: ' + auto.filter(d => !forced.includes(d)).join(', ')
        + ' / forced-only: ' + forced.filter(d => !auto.includes(d)).join(', ')
      : '');
  /* One dark block. Every difference between the schemes is a custom property
     in it, so forcing the scheme moves all of them at once. A second block
     would be a rule the attribute cannot reach. */
  const blocks = (CSS.match(/@media \(prefers-color-scheme: dark\)/g) || []).length;
  check('and there is one dark block in the file, not seven', blocks === 1, blocks + ' found');
  const want = ['--ocean', '--panel', '--ink', '--sta-fill', '--grat-ink',
                '--sub-ink', '--f-sea-ink', '--extent-ink', '--warn-ink'];
  const miss = want.filter(k => !auto.some(d => d.startsWith(k + ':')));
  check('and it carries the map furniture the scattered blocks used to patch',
    !miss.length, miss.join(', '));
}

const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const open = async (u, dark) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1300, height: 900 });
  /* **Say which, always.** This used to emulate only the dark case and let
     the light one inherit whatever the host reported — which is fine on a
     machine that is light, and this one is until the sun goes down. Three
     checks that had passed all day began failing after dark, reporting the
     dark ocean where the light one was expected: not a bug in the page, a
     test that had never said what it wanted. */
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme',
                                  value: dark ? 'dark' : 'light' }]);
  await p.goto(u, { waitUntil: 'networkidle0' });
  await ready(p);
  return p;
};
const press = async (p, which) => {
  await p.evaluate(w => document.querySelector('#theme-seg button[data-theme="' + w + '"]').click(), which);
  await sleep(700);
  return p.evaluate(STATE);
};

console.log('\n— auto follows the system, and says so —');
{
  const p = await open('http://localhost:8123/index.html', false);
  let s = await p.evaluate(STATE);
  check('a light system opens light', s.ocean === LIGHT_OCEAN, s.ocean);
  check('with no attribute on the root', s.attr === null, String(s.attr));
  check('and Auto is the button lit', s.seg.join(',') === 'auto*,light,dark', s.seg.join(','));

  s = await press(p, 'dark');
  check('Dark on a light system darkens the sea', s.ocean === DARK_OCEAN, s.ocean);
  check('and the panels with it', s.panel === '#1b232b', s.panel);
  check('and the furniture the scattered blocks used to own', s.grat === '#93a6b6' && s.sub === '#b9bfc6',
    s.grat + ' / ' + s.sub);
  check('the root says which', s.attr === 'dark', String(s.attr));
  check('and the choice is in the address', /layers=/.test(s.url), s.url);

  s = await press(p, 'auto');
  check('back to Auto and the light system decides again', s.ocean === LIGHT_OCEAN && s.attr === null,
    s.ocean + ' / ' + s.attr);
  await p.close();
}

console.log('\n— and the other way round —');
{
  const p = await open('http://localhost:8123/index.html', true);
  let s = await p.evaluate(STATE);
  check('a dark system opens dark with no attribute', s.ocean === DARK_OCEAN && s.attr === null,
    s.ocean + ' / ' + s.attr);

  s = await press(p, 'light');
  check('Light on a dark system lightens the sea', s.ocean === LIGHT_OCEAN, s.ocean);
  check('and the panels', s.panel === '#fffdf8', s.panel);
  check('and the furniture', s.grat === '#6a7a88' && s.sub === '#4a453c', s.grat + ' / ' + s.sub);
  check('the root says light', s.attr === 'light', String(s.attr));
  await p.close();
}

console.log('\n— the annotation panel follows it too —');
{
  /* `annotate.js` carries its own stylesheet, injected when the panel is first
     opened, and it had six `prefers-color-scheme` blocks of its own. A media
     query cannot see `data-theme`, so without the rewrite in `addCss` a reader
     who forced the scheme got a light panel over a dark map — the exact
     half-dark failure this whole change exists to avoid.

     The rewrite must not change what the panel looks like on Auto, which is
     why it scopes with `:where()`: zero specificity, so every rule keeps the
     weight it had inside the media query. */
  const opened = async (p) => {
    await p.evaluate(() => {
      const d = document.querySelector('#dlg-options');
      if (d && !d.open) d.showModal();
      const c = document.querySelector('#ann-create');
      if (c) c.click();
    });
    await sleep(2200);
  };
  const tool = p => p.evaluate(() => {
    const t = document.querySelector('#annotate .ann-tool');
    const css = document.getElementById('ann-css');
    return { bg: t ? getComputedStyle(t).backgroundColor : null,
             guarded: css ? /:where\(:root\[data-theme="dark"\]\) #annotate/
                              .test(css.textContent) : false,
             media: css ? (css.textContent
                             .match(/@media \(prefers-color-scheme: dark\)/g) || []).length
                        : 0 };
  });
  const LIGHT = 'rgb(255, 253, 248)', DARK = 'rgb(27, 35, 43)';

  const p = await open('http://localhost:8123/index.html', false);
  await opened(p);
  let t = await tool(p);
  check('the panel goes in rewritten for the attribute', t.guarded);
  check('and keeps its media query for a reader who never touches the toggle',
    t.media === 6, String(t.media));
  check('on a light system it opens light', t.bg === LIGHT, t.bg);
  await press(p, 'dark');
  t = await tool(p);
  check('Dark darkens the panel with the map', t.bg === DARK, t.bg);
  await press(p, 'light');
  t = await tool(p);
  check('and Light puts it back', t.bg === LIGHT, t.bg);
  await p.close();

  const q = await open('http://localhost:8123/index.html', true);
  await opened(q);
  t = await tool(q);
  check('on a dark system it opens dark', t.bg === DARK, t.bg);
  await press(q, 'light');
  t = await tool(q);
  check('and Light lightens it there', (await tool(q)).bg === LIGHT, t.bg);
  await q.close();
}

console.log('\n— it travels in the link —');
{
  /* The scheme is in the layers code like every other switch, so a link
     carries it and a bare URL does not — which is this map's rule: nothing is
     stored, and the address is the whole of the state. */
  const p = await open('http://localhost:8123/index.html', false);
  await press(p, 'dark');
  const share = await p.evaluate(() => location.search);
  await p.close();

  const q = await open('http://localhost:8123/index.html' + share, false);
  const s = await q.evaluate(STATE);
  check('opening the shared link on a light system arrives dark',
    s.ocean === DARK_OCEAN && s.attr === 'dark', s.ocean + ' / ' + s.attr);
  check('and the panel agrees with the map', s.seg.join(',') === 'auto,light,dark*', s.seg.join(','));
  await q.close();

  const r = await open('http://localhost:8123/index.html', false);
  const t = await r.evaluate(STATE);
  check('a bare URL is still Auto', t.attr === null && t.seg[0] === 'auto*', String(t.attr));
  await r.close();
}

console.log('\n— and with a finger —');
{
  /* No hover on a phone, and the buttons here are plain buttons, so there is
     nothing pointer-dependent to get wrong. Checked anyway, because that
     sentence has been written about a control that then did not work: the
     rule in CLAUDE.md is that a fix is not done until it works both ways. */
  const p = await b.newPage();
  await p.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true,
                        deviceScaleFactor: 2 });
  await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle0' });
  await ready(p);
  await p.evaluate(() => {
    const d = document.querySelector('#dlg-options');
    if (d && !d.open) d.showModal();
    document.querySelector('#theme-seg').scrollIntoView();
  });
  await sleep(400);
  const at = await p.evaluate(() => {
    const b2 = document.querySelector('#theme-seg button[data-theme="dark"]');
    const r = b2.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(120);
  await p.mouse.up();
  await sleep(800);
  const s = await p.evaluate(STATE);
  check('a tap on Dark sets it', s.attr === 'dark' && s.ocean === DARK_OCEAN,
    s.attr + ' / ' + s.ocean);
  check('and the segment shows which', s.seg.join(',') === 'auto,light,dark*',
    s.seg.join(','));
  await p.close();
}

await b.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
})();
