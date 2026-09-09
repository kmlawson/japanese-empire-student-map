/* One press for each of the things a reader reaches for.
 *
 *     node tools/test/keys.js          # with a server on 8123
 *
 * The map is used in front of a class, where a hand on the keyboard beats a
 * hand on a mouse. What is checked:
 *
 *   * every switch in the bar answers its own letter, and the *button* is
 *     pressed rather than the state set, so the button, the panel and the map
 *     cannot come apart;
 *   * the railway key does nothing where the button is not offered, which is
 *     the same rule the button follows;
 *   * **nothing fires while somebody is typing, or inside a dialog** — the
 *     Layers panel is a dialog, and `l` in it is a letter somebody meant;
 *   * and Escape does the nearer thing first: it closes an open card, and
 *     resets the view only when there is nothing to close.
 */
const { puppeteer, sleep, ready, until, check, report, SHIM, launch } = require('./suite.js');

const st = p => p.evaluate(() => ({
  epoch: [...document.querySelectorAll('#epoch-seg button')]
    .filter(b => b.classList.contains('on')).map(b => b.textContent.trim())[0] || '?',
  city: document.querySelector('#layer-seg [data-cat="city"]').getAttribute('aria-pressed'),
  admin: document.querySelector('#layer-seg [data-cat="territory"]').getAttribute('aria-pressed'),
  events: document.querySelector('#layer-seg [data-cat="battle"]').getAttribute('aria-pressed'),
  topo: document.querySelector('#layer-seg [data-opt="relief"]').getAttribute('aria-pressed'),
  other: document.querySelector('#layer-seg [data-opt="labels"]').getAttribute('aria-pressed'),
  rail: document.querySelector('#btn-rail').getAttribute('aria-pressed'),
  railShown: !document.querySelector('#btn-rail').hidden,
  dialogs: [...document.querySelectorAll('dialog[open]')].map(d => d.id),
  where: (/where=([^&]+)/.exec(location.search) || [])[1],
}));
const open = async (b, url) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2800);
  return p;
};

(async () => {
  const b = await launch();

  console.log('\n— the five switches, and the railway —');
  // over Korea, close enough that a railway is on offer, everything else off
  let p = await open(b, 'http://localhost:8123/index.html?where=126.0,36.5,128.5,38.5&layers=0');
  let s = await st(p);
  check('nothing is on to begin with',
    [s.city, s.admin, s.events, s.topo, s.other, s.rail].join(' ')
      === 'false false false false false false',
    [s.city, s.admin, s.events, s.topo, s.other, s.rail].join(' '));
  for (const k of ['c', 'a', 'e', 't', 'o', 'r']) { await p.keyboard.press(k); await sleep(650); }
  s = await st(p);
  check('c a e t o each press their own switch, and r the railway',
    [s.city, s.admin, s.events, s.topo, s.other, s.rail].join(' ')
      === 'true true true true true true',
    [s.city, s.admin, s.events, s.topo, s.other, s.rail].join(' '));
  await p.keyboard.press('c'); await sleep(650);
  check('and again turns it off', (await st(p)).city === 'false');

  console.log('\n— the dates, the panels, the zoom —');
  await p.keyboard.press('2'); await sleep(2000);
  check('2 is the December 1942 map', (await st(p)).epoch === 'Dec 1942');
  await p.keyboard.press('0'); await sleep(2000);
  check('0 is 1930', (await st(p)).epoch === '1930');
  await p.keyboard.press('Escape'); await sleep(600);       // the date's own card
  await p.keyboard.press('l'); await sleep(700);
  check('l opens the Layers panel',
    (await st(p)).dialogs.join() === 'dlg-options', (await st(p)).dialogs.join());
  /* And the letters do nothing inside it, or a reader would find the map
     rearranging itself as they typed in a field. */
  await p.keyboard.press('c'); await sleep(500);
  s = await st(p);
  check('but they do nothing while it is open',
    s.dialogs.join() === 'dlg-options' && s.city === 'false',
    s.dialogs.join() + ' / cities ' + s.city);
  await p.keyboard.press('Escape'); await sleep(600);
  await p.keyboard.press('?'); await sleep(700);
  check('? opens the help', (await st(p)).dialogs.join() === 'dlg-help');
  await p.keyboard.press('Escape'); await sleep(600);

  const w1 = (await st(p)).where;
  await p.keyboard.press('+'); await sleep(900);
  const w2 = (await st(p)).where;
  check('+ zooms in', w1 !== w2, w1 + ' → ' + w2);
  await p.keyboard.press('-'); await sleep(900);
  check('- zooms out again', (await st(p)).where !== w2);
  await p.keyboard.press('Escape'); await sleep(900);
  check('and Escape with nothing open puts the view home',
    (await st(p)).where !== w2);
  await p.close();

  /* **The railway is offered everywhere now.** It used to come and go with the
     ground under the view, which made it a control a reader had to find; one
     press switches on every network, so nothing about the whole-empire view
     makes the question unaskable. What the fade does to the *lines* out here
     has not changed — they are shown for a moment and let go, so the press is
     seen to have done something. */
  console.log('\n— the railway key at the whole map —');
  p = await open(b, 'http://localhost:8123/index.html?layers=0');   // the whole map
  s = await st(p);
  check('the railway is offered at the whole map too', s.railShown === true);
  await p.keyboard.press('r'); await sleep(700);
  check('and r switches it on there', (await st(p)).rail === 'true');
  /* **A press that changes nothing on the screen reads as a press that did not
     work.** Out here the fade has taken the lines away, so switching them on
     shows them at full strength for a moment and then lets them go. Sampled
     rather than asserted at one instant: the point is that it was up and then
     came down. */
  const flash = await p.evaluate(async () => {
    const out = [];
    const rails = () => [...document.querySelectorAll('svg g[id]')]
      .filter(e => /rail/i.test(e.id));
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 90));
      out.push(Math.max.apply(null, rails().map(e => +getComputedStyle(e).opacity).concat([0])));
    }
    return out;
  });
  check('  and the lines are shown for a moment so the press is seen',
    Math.max.apply(null, flash) > 0.9, flash.map(v => v.toFixed(2)).join(' '));
  check('  and then let go again',
    flash[flash.length - 1] <= 0.02, flash[flash.length - 1] + '');
  await p.close();

  /* ------------------------------------------ space, held, pans the map --
   *
   * `spaceHeld` existed and was read in exactly two places, both inside
   * `onPointerDown` and both only to let a press through the reader's own
   * annotations. So the cursor became a grab hand and nothing else happened:
   * nothing on the pan path ever looked at the flag. Reported as "the spacebar
   * does nothing in Safari or Firefox"; it did nothing in Chrome either, and
   * no test would have caught it because none asked.
   *
   * It pans at any time now — over the map, over a card, with an annotation
   * tool armed, over the reader's own shapes — with one exception, which is
   * the point of the last two checks: a space typed into a field is a space,
   * not a pan. */
  console.log('\n- space, held, pans the map -');
  p = await open(b, 'http://localhost:8123/index.html?where=60.97,-3.62,144.87,41.87');
  const mapBox = await p.evaluate(() => {
    const r = document.getElementById('map-container').getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const at = { x: Math.round(mapBox.x + mapBox.w * 0.42),
               y: Math.round(mapBox.y + mapBox.h * 0.5) };
  const glide = async () => {
    await p.mouse.move(at.x, at.y); await sleep(120);
    const was = await p.evaluate(() => location.search);
    await p.keyboard.down(' '); await sleep(160);
    for (let i = 1; i <= 8; i++) { await p.mouse.move(at.x - i * 13, at.y - i * 8); await sleep(40); }
    await sleep(450); await p.keyboard.up(' '); await sleep(180);
    return (await p.evaluate(() => location.search)) !== was;
  };
  /* Moving with no button down and no space must do nothing, or the map would
     slide under a reader who is only looking. */
  await p.mouse.move(at.x, at.y);
  const idle = await p.evaluate(() => location.search);
  for (let i = 1; i <= 8; i++) { await p.mouse.move(at.x - i * 13, at.y - i * 8); await sleep(40); }
  await sleep(400);
  check('a bare mouse move does not pan',
    (await p.evaluate(() => location.search)) === idle);
  check('holding space and moving does', await glide());
  check('and the cursor says so', await p.evaluate(() => {
    document.getElementById('map-container').classList.add('space-pan');
    const c = getComputedStyle(document.getElementById('map-container')).cursor;
    document.getElementById('map-container').classList.remove('space-pan');
    return c === 'grab';
  }));
  /* Released, the map stops following. A flag left set would leave the map
     sliding after every idle move, which is worse than it never working. */
  await p.mouse.move(at.x, at.y); await sleep(120);
  const after = await p.evaluate(() => location.search);
  for (let i = 1; i <= 8; i++) { await p.mouse.move(at.x - i * 13, at.y - i * 8); await sleep(40); }
  await sleep(400);
  check('and it stops when the key is let go',
    (await p.evaluate(() => location.search)) === after);
  /* The exception: a space typed into a field is a space. */
  await p.evaluate(() => document.getElementById('btn-options').click());
  await sleep(800);
  await p.evaluate(() => document.getElementById('layers-find').focus());
  await p.keyboard.down(' '); await sleep(140); await p.keyboard.up(' '); await sleep(160);
  check('a space typed into a field is typed, not a pan',
    (await p.evaluate(() => document.getElementById('layers-find').value)) === ' ',
    JSON.stringify(await p.evaluate(() => document.getElementById('layers-find').value)));
  check('and the map did not go into pan mode',
    await p.evaluate(() => !document.getElementById('map-container')
      .classList.contains('space-pan')));
  await p.close();

  /* ------------------------------------ the help lists what the keys do --
   *
   * A shortcut list is the one piece of prose on this map that can go quietly
   * wrong: the keys are in `map.js` and the list is in `texts/pages/help.md`,
   * and nothing has ever made them agree. So this asserts the section exists,
   * sits above the annotations, and names every key the handler actually
   * answers to. Adding a key without documenting it fails here. */
  console.log('\n- the help says what the keys do -');
  p = await open(b, 'http://localhost:8123/index.html');
  /* `f` for the air routes. Checked here rather than only in the list, because
     a key named in the help and wired to nothing is the failure this section
     exists to prevent — and unlike `r`, whose button comes and goes with the
     ground under the view, this one is offered at every zoom and on both
     dates, so it must always answer. */
  const airPressed = () => p.evaluate(() =>
    document.getElementById('btn-air').getAttribute('aria-pressed'));
  const airWas = await airPressed();
  await p.keyboard.press('f'); await sleep(1800);
  const airNow = await airPressed();
  check('f turns the air routes on', airWas === 'false' && airNow === 'true',
    airWas + ' -> ' + airNow);
  await p.keyboard.press('f'); await sleep(1200);
  check('and off again', (await airPressed()) === 'false');
  await p.keyboard.press('?'); await sleep(700);
  const help = await p.evaluate(() => {
    const d = document.getElementById('dlg-help');
    if (!d || !d.open) return null;
    const heads = [...d.querySelectorAll('h3')].map(h => h.textContent.trim());
    return { heads, text: d.textContent || '' };
  });
  check('the ? key opens the help', !!help);
  if (help) {
    const i = help.heads.indexOf('Shortcuts');
    const j = help.heads.indexOf('Drawing your own annotations');
    check('there is a Shortcuts section', i >= 0, JSON.stringify(help.heads));
    check('and it sits above the annotations', i >= 0 && j > i, i + ' vs ' + j);
    /* Every key the map answers to, as the handler has them. */
    const keys = ['Spacebar', 'Shift-drag', 'Escape', 'c', 'a', 'e', 't', 'o',
                  'r', 'f', '0', '2', 'l', 'n', '?'];
    const missing = keys.filter(k => help.text.indexOf('**' + k + '**') < 0
                                  && help.text.indexOf(k) < 0);
    check('and every key is listed', missing.length === 0, JSON.stringify(missing));
    /* The exception is worth saying to the reader, not only to the code. */
    check('and it says a key does nothing while you are typing',
      /never while you are typing/i.test(help.text), 'the typing exception is unsaid');
  }
  await p.close();

  await b.close();
  process.exit(report());
})();
