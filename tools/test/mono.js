/* The single-colour map, and the colour a reader chooses for it.
 *
 *     node tools/test/mono.js          # with a server on 8123
 *
 * "Make the map a single colour" strips every fill and every hatching so that
 * the map can be drawn over. What colour that is used to be fixed, and it is
 * not one colour but two — a warm parchment in the light scheme and a slate in
 * the dark — which is the thing a picker has to be careful of: a reader who
 * has not chosen must keep *both*, and a reader who has chosen must override
 * both.
 *
 * Everything mono draws hangs off two custom properties, `--mono-land` and
 * `--mono-line`, so the picker only ever writes those. The line is derived
 * from the land rather than picked separately: a step darker on a light colour
 * and a step lighter on a dark one, or it disappears into the shape it is
 * drawing round. The two ends of that rule reproduce the stylesheet's own
 * pairs, which is checked here rather than asserted in a comment.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('mono test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const BASE = (1 << 5) | (1 << 6);
const MONO = 1 << 21;
const url = bits => 'http://localhost:8123/index.html?layers=' + (bits >>> 0).toString(36);

const STATE = () => {
  const svg = document.getElementById('jmap');
  const cs = getComputedStyle(svg);
  const a = document.querySelector('#backings path');
  const row = document.querySelector('#mono-colour-row');
  return {
    land: cs.getPropertyValue('--mono-land').trim(),
    line: cs.getPropertyValue('--mono-line').trim(),
    fill: a ? getComputedStyle(a).fill : null,
    pick: document.querySelector('#opt-mono-colour').value,
    rowHidden: row.hidden,
    resetHidden: document.querySelector('#opt-mono-reset').hidden,
    url: location.search,
  };
};
const rgb = hex => 'rgb(' + [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ') + ')';

(async () => {
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
  await sleep(2800);
  return p;
};

console.log('\n— the picker belongs to the switch —');
{
  const p = await open('http://localhost:8123/index.html', false);
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  let s = await p.evaluate(STATE);
  check('with the map in its colours there is no picker', s.rowHidden);
  await p.evaluate(() => document.querySelector('#opt-mono').click());
  await sleep(1100);
  s = await p.evaluate(STATE);
  check('ticking the switch offers one', !s.rowHidden);
  check('and it opens on the colour the map is actually using',
    s.pick === s.land, s.pick + ' vs ' + s.land);
  /* Reset is the way back to *having no colour*, which is not a colour a
     picker can hold: the default is a light one and a dark one. So it is only
     there once there is something to undo. */
  check('with nothing chosen there is nothing to reset', s.resetHidden);

  await p.evaluate(() => {
    const c = document.querySelector('#opt-mono-colour');
    c.value = '#cfe0f0';
    c.dispatchEvent(new Event('input', { bubbles: true }));
    c.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(1100);
  s = await p.evaluate(STATE);
  check('choosing one reaches the drawing', s.land === '#cfe0f0' && s.fill === rgb('#cfe0f0'),
    JSON.stringify(s));
  check('and the outline follows it rather than staying grey',
    s.line === '#9ba8b4', s.line);
  check('now there is something to reset', !s.resetHidden);
  check('and the colour travels in the link', /[?&]mono=cfe0f0/.test(s.url), s.url);

  await p.evaluate(() => document.querySelector('#opt-mono-reset').click());
  await sleep(900);
  s = await p.evaluate(STATE);
  check('reset hands both properties back to the stylesheet',
    s.land === '#ded7c4' && s.line === '#a9a08b', JSON.stringify(s));
  check('and takes it out of the link', !/mono=/.test(s.url), s.url);

  await p.evaluate(() => document.querySelector('#opt-mono').click());
  await sleep(900);
  s = await p.evaluate(STATE);
  check('unticking puts the picker away', s.rowHidden);
  check('and the map has its colours back', s.fill !== rgb('#ded7c4'), s.fill);
  check('no page errors', errs.length === 0, errs[0]);
  await p.close();
}

/* The part a fixed default would get wrong. `--mono-land` is declared twice in
   the stylesheet, once under `prefers-color-scheme: dark`, and a reader who
   has chosen nothing has to keep whichever applies. Writing a default hex into
   the picker and applying it would have quietly frozen the light one. */
console.log('\n— light and dark, and a chosen colour overriding both —');
{
  for (const [dark, land, line] of [[false, '#ded7c4', '#a9a08b'],
                                    [true,  '#2b333c', '#55606c']]) {
    const p = await open(url(BASE | MONO), dark);
    const s = await p.evaluate(STATE);
    check((dark ? 'dark' : 'light') + ': untouched, the scheme\'s own pair stands',
      s.land === land && s.line === line, JSON.stringify(s));
    await p.close();
  }
  /* And the derivation is right at both ends: a light choice takes a darker
     line, a dark choice a lighter one. Same rule, opposite directions — which
     is why the line cannot simply be a fixed grey. */
  for (const [dark, pick, wantLine, lighter] of [[false, 'cfe0f0', '#9ba8b4', false],
                                                 [true,  '2f3a2a', '#5d6559', true]]) {
    const p = await open(url(BASE | MONO) + '&mono=' + pick, dark);
    const s = await p.evaluate(STATE);
    const lum = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    check((dark ? 'dark' : 'light') + ': a link carrying a colour restores it',
      s.land === '#' + pick && s.fill === rgb('#' + pick), JSON.stringify(s));
    check((dark ? 'dark' : 'light') + ': and its outline is a '
      + (lighter ? 'lighter' : 'darker') + ' step',
      s.line === wantLine && (lighter ? lum(s.line) > lum(s.land)
                                      : lum(s.line) < lum(s.land)),
      s.land + ' / ' + s.line);
    await p.close();
  }
  const p = await open(url(BASE | MONO) + '&mono=zzz', false);
  const s = await p.evaluate(STATE);
  check('a link with a junk colour is ignored, not obeyed',
    s.land === '#ded7c4', JSON.stringify(s));
  await p.close();
}

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
await b.close();
process.exit(fail);
})();
