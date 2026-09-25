/* With a heavy layer up, a gesture moves a picture and the map is drawn once.
 *
 *     node tools/test/picture.js           # needs a server on 8123
 *
 * `pictureMove` in map.js: while a thematic layer, the train tools or the
 * plane tools are up, a pan or a zoom is a CSS transform on `#map-svg` and the
 * `viewBox` is written once, when the hand stops. Asked here:
 *
 *   1. With nothing heavy up, a drag still redraws as it goes — the picture is
 *      only for the layers that need it.
 *   2. With the plane tools up, mid-drag the viewBox has not moved and the
 *      transform has; a finger resting mid-drag does not end the gesture.
 *   3. After release the transform is gone and the viewBox is the new view.
 *   4. **The picture and the redraw agree.** A place's position on screen,
 *      read through the SVG's screen matrix mid-gesture, is where the redrawn
 *      map puts it — to half a pixel, after a drag and a wheel zoom together.
 *      This is the map-units-versus-pixels mistake CLAUDE.md describes, and
 *      the check is at two sizes because one proves nothing about it.
 *   5. The same with a finger, drag and pinch.
 */
'use strict';
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const Q = '?epoch=1942&bbox=120,30,140,42';

const state = p => p.evaluate(() => ({
  vb: document.querySelector('#jmap').getAttribute('viewBox'),
  tf: document.getElementById('map-svg').style.transform,
}));
// Tokyo, on screen, through the SVG's own screen matrix
const tokyo = p => p.evaluate(() => {
  const q = window.JMAP_GEO.project(139.69, 35.69);
  const m = document.querySelector('#jmap').getScreenCTM();
  return [m.a * q.x + m.c * q.y + m.e, m.b * q.x + m.d * q.y + m.f];
});
const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

async function planesUp(p) {
  await p.evaluate(() => document.getElementById('btn-air').click());
  await sleep(900);               // the routes fade in
  await p.evaluate(() => document.getElementById('btn-planes').click());
  await sleep(1500);              // the strip mounts and the clock starts
  await calm(p);
}

(async () => {
  const b = await launch();

  console.log('\n— nothing heavy: the map redraws as it moves —');
  {
    const p = await open(b, Q, { width: 1280, height: 900 });
    const v0 = await state(p);
    await p.mouse.move(640, 450);
    await p.mouse.down();
    await p.mouse.move(560, 500, { steps: 5 });
    await sleep(60);             // a frame for the move to land
    const mid = await state(p);
    await p.mouse.up();
    await calm(p);
    check('a drag writes the viewBox as it goes', mid.vb !== v0.vb && !mid.tf, JSON.stringify(mid));
    await p.close();
  }

  for (const [w, h] of [[1280, 900], [390, 664]]) {
    console.log('\n— the plane tools up, with a mouse, at ' + w + '×' + h + ' —');
    const p = await open(b, Q, { width: w, height: h });
    await planesUp(p);
    const v0 = await state(p);
    await p.mouse.move(w / 2, h / 2);
    await p.mouse.down();
    await p.mouse.move(w / 2 - 80, h / 2 + 40, { steps: 4 });
    await p.mouse.wheel({ deltaY: -200 });
    await sleep(400);            // held past the settle time, button still down
    const mid = await state(p), midAt = await tokyo(p);
    check('mid-gesture the viewBox has not moved', mid.vb === v0.vb, mid.vb + ' was ' + v0.vb);
    check('  and the picture has', /translate/.test(mid.tf) && /scale/.test(mid.tf), mid.tf);
    await p.mouse.up();
    await calm(p);
    const after = await state(p), afterAt = await tokyo(p);
    check('released, the transform is gone', !after.tf, after.tf);
    check('  and the map is drawn at the new view', after.vb !== v0.vb, after.vb);
    check('the picture put Tokyo where the redraw does',
      gap(midAt, afterAt) < 0.5, gap(midAt, afterAt).toFixed(3) + 'px');
    await p.close();
  }

  console.log('\n— the plane tools up, with a finger —');
  {
    const p = await open(b, Q, { touch: true, width: 390, height: 664 });
    await planesUp(p);
    const v0 = await state(p);
    await p.touchscreen.touchStart(200, 300);
    for (let i = 1; i <= 6; i++) {
      await p.touchscreen.touchMove(200 - i * 12, 300 + i * 8);
      await sleep(16);           // a frame between moves, as a finger gives
    }
    await sleep(300);            // the finger rests, still down
    const mid = await state(p), midAt = await tokyo(p);
    check('a resting finger is still a gesture', mid.vb === v0.vb && !!mid.tf, JSON.stringify(mid));
    await p.touchscreen.touchEnd();
    await calm(p);
    const after = await state(p), afterAt = await tokyo(p);
    check('lifted, the map is drawn where the finger left it',
      !after.tf && after.vb !== v0.vb && gap(midAt, afterAt) < 0.5,
      gap(midAt, afterAt).toFixed(3) + 'px');

    const c = await p.target().createCDPSession();
    const touch = (type, pts) => c.send('Input.dispatchTouchEvent',
      { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
    await touch('touchStart', [[150, 350], [250, 350]]);
    for (let i = 1; i <= 6; i++) {
      await touch('touchMove', [[150 - i * 10, 350], [250 + i * 10, 350]]);
      await sleep(16);
    }
    await sleep(250);            // held apart
    const pm = await state(p), pmAt = await tokyo(p);
    await touch('touchEnd', []);
    await calm(p);
    const pa = await state(p), paAt = await tokyo(p);
    check('a pinch scales the picture', /scale\((?!1\))/.test(pm.tf), pm.tf);
    check('  and the redraw agrees with it', !pa.tf && gap(pmAt, paAt) < 0.5,
      gap(pmAt, paAt).toFixed(3) + 'px');
    await p.close();
  }

  const failed = report();
  await b.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
