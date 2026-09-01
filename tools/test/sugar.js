/* The sugar company railways of Taiwan, 1929.
 *
 *     node tools/test/sugar.js          # with a server on 8123
 *
 * 762 mm plantation track, thousands of kilometres of it across the western
 * plain, fetched only when somebody asks. What is checked:
 *
 *   * the button is offered where it means something — over Taiwan, with its
 *     railways drawn, and the train tools away — and nowhere else;
 *   * **the stroke is screen pixels.** `vector-effect` is not an inherited
 *     property: set on the group it applied to nothing, the width went back to
 *     map units, and at Tainan the network was a field of brown sausages a
 *     kilometre wide. Measured at two zooms, because at the opening view map
 *     units and screen pixels are interchangeable and this always passes;
 *   * the layer travels in a link, and a link that carries it fetches it.
 */
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) { /* keep looking */ } }
  console.error('sugar test: puppeteer not found.');
  process.exit(1);
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); }
                             else { fail++; console.log('  FAIL ' + n + (d ? ' — ' + d : '')); } };

const RAIL = (33554432 + 1).toString(36);      // Taiwan railways, Dec 1942
const ISLAND = 'http://localhost:8123/index.html?where=119.5,21.5,122.5,25.5&layers=';
const open = async (b, url) => {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await sleep(2800);
  return p;
};
const st = p => p.evaluate(() => {
  const b = document.querySelector('#btn-sugar');
  const g = document.querySelector('#tw-sugar');
  return { offered: b ? !b.hidden : null,
           pressed: b ? b.getAttribute('aria-pressed') : null,
           lines: g ? g.querySelectorAll('path').length : 0,
           drawn: g ? getComputedStyle(g).display !== 'none' : false,
           code: (/[?&]layers=([^&#]+)/.exec(location.search) || [])[1] };
});

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n— where the button is —');
  let p = await open(b, ISLAND + RAIL);
  let s = await st(p);
  check('over Taiwan with its railways on, it is there', s.offered === true);
  check('and nothing is fetched until it is pressed', s.lines === 0, String(s.lines));
  await p.close();

  p = await open(b, 'http://localhost:8123/index.html?layers=' + RAIL);
  check('at the whole map it is not', (await st(p)).offered === false);
  await p.close();

  p = await open(b, ISLAND + (1).toString(36));      // no railways
  check('and not without the railway it belongs to', (await st(p)).offered === false);
  await p.close();

  console.log('\n— the lines —');
  p = await open(b, ISLAND + RAIL);
  await p.evaluate(() => document.querySelector('#btn-sugar').click());
  await sleep(2500);
  s = await st(p);
  check('pressing it draws the network', s.lines === 531 && s.drawn, String(s.lines));
  check('and the button says it is on', s.pressed === 'true');
  const wide = await p.evaluate(() => {
    const el = document.querySelector('#tw-sugar path');
    return { w: getComputedStyle(el).strokeWidth, solid: getComputedStyle(el).strokeDasharray };
  });
  await p.evaluate(() => {
    const z = document.querySelector('#zoom-in');
    for (let i = 0; i < 6; i++) z.click();
  });
  await sleep(1800);
  const close = await p.evaluate(() =>
    getComputedStyle(document.querySelector('#tw-sugar path')).strokeWidth);
  check('the stroke is the same six wheel steps in', wide.w === close,
        wide.w + ' then ' + close);
  /* Solid, because a dash is how this map says a line is approximate and these
     were surveyed. */
  check('and solid, not dashed',
    wide.solid === 'none' || wide.solid === '', wide.solid);
  /* The railway's own ink, not a colour of their own and not the stylesheet's
     fallback grey. Two separate mistakes made it grey: setting the property in
     `applyState`, which runs long before the fetch that makes the group, and
     asking `railInk` for the *territory* `formosa` when what it wants is the
     *atom* `taiwan` — which quietly answers with the ink for a pale ground.
     Both came out as a dark network under a white trunk line. */
  const ink = await p.evaluate(() => {
    const rail = document.querySelector('#tw-rail path.rail');
    return { sugar: getComputedStyle(document.querySelector('#tw-sugar path')).stroke,
             rail: rail ? getComputedStyle(rail).stroke : null,
             op: getComputedStyle(document.querySelector('#tw-sugar path')).strokeOpacity };
  });
  check('drawn in the ink the railway itself is using', ink.sugar === ink.rail,
        ink.sugar + ' vs ' + ink.rail);
  check('and fainter than it', Number(ink.op) > 0 && Number(ink.op) < 1, ink.op);
  const code = (await st(p)).code;
  await p.close();

  console.log('\n— and in a link —');
  p = await open(b, ISLAND + code);
  s = await st(p);
  check('a link carrying it fetches and draws it', s.lines === 531 && s.drawn,
        String(s.lines));
  check('with the button pressed', s.pressed === 'true');
  check('and the code is a positive number', !/^-/.test(code), code);
  await p.close();

  /* The switch next to it, which is the same kind of thing: a railway control
     beside the map rather than in a dialog. It is here rather than in
     stations.js because the two share a gate and that gate is where this went
     wrong — `railUnderView` asks whether a railway is *being drawn*, which is
     right for the station button and wrong for the one whose job is to draw
     it, so gated on that it appeared only once the line it switches was
     already on. */
  console.log('\n— the railway switch beside it —');
  p = await open(b, 'http://localhost:8123/index.html?where=126.0,36.5,128.5,38.5&layers=1');
  let r = await p.evaluate(() => {
    const b = document.querySelector('#btn-rail');
    return { shown: !b.hidden, pressed: b.getAttribute('aria-pressed'),
             order: [...document.querySelectorAll('#zoom-controls button')].map(x => x.id),
             railOn: document.querySelector('#opt-kr-rail').checked };
  });
  check('over Korea with no railway drawn, the switch is still offered',
    r.shown === true && r.railOn === false);
  /* The relationships, not the literal sequence. This pinned the whole string
     and so broke the day a button was added between two it named — which is a
     test failing on a change rather than on a fault. What has to hold is that
     the railway switch is under the zoom controls and ahead of the stations
     that hang off it; the air-route button sits between them, under the track
     button, which is where it was asked to go. */
  const at = id => r.order.indexOf(id);
  check('it sits under the zoom controls', at('btn-rail') > at('zoom-reset'),
    r.order.join(' '));
  check('and ahead of the stations that hang off it',
    at('btn-rail') < at('btn-stations') && at('btn-stations') < at('btn-trains'),
    r.order.join(' '));
  check('with the air routes under it', at('btn-air') === at('btn-rail') + 1,
    r.order.join(' '));
  const pressed = await p.evaluate(() => {
    document.querySelector('#btn-rail').click();
    return new Promise(res => setTimeout(() => res({
      pressed: document.querySelector('#btn-rail').getAttribute('aria-pressed'),
      box: document.querySelector('#opt-kr-rail').checked,
      station: !document.querySelector('#btn-stations').hidden,
      bg: getComputedStyle(document.querySelector('#btn-rail')).backgroundColor,
      plain: getComputedStyle(document.querySelector('#zoom-in')).backgroundColor,
    }), 1200));
  });
  check('pressing it draws that ground\'s railway',
    pressed.pressed === 'true' && pressed.box === true);
  check('and the station switch follows it out', pressed.station === true);
  /* Pressed, it takes the same filled background the station button does:
     asked for, because a switch that looks the same on and off is not one. */
  check('a switched-on button is filled, not plain',
    pressed.bg !== pressed.plain, pressed.bg + ' vs ' + pressed.plain);
  await p.close();

  p = await open(b, 'http://localhost:8123/index.html?layers=1');
  check('and at the whole map there is no railway to offer',
    (await p.evaluate(() => document.querySelector('#btn-rail').hidden)) === true);
  await p.close();

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
