/* The running count of what will fit in a link.
 *
 *     node tools/test/annotations/run5.js      # needs a server on 8123
 *
 * Why a counter rather than a count of features: a name and a description are
 * characters too, and so is every vertex of a closely traced shape, so two
 * readers with ten marks each can be a long way apart. And because the payload
 * is deflated, the number does not climb evenly — the tests below measure
 * both of those rather than asserting them.
 */
const H = require('./suite.js');

/* Wait for the map rather than for a number. Measured: the atoms and the first
   labels are there 730 ms after the navigation resolves — these scripts were
   sleeping three and a half seconds for it. See `suite.js`. */
async function ready(pg, wantsAnn){
  try {
    await pg.waitForFunction(want=>{
      if(!document.querySelectorAll('#land .atom').length) return false;
      if(!document.querySelectorAll('#labels text').length) return false;
      if(want && !document.querySelectorAll('#annotations [data-ann]').length) return false;
      return true;
    },{timeout:25000,polling:'raf'},!!wantsAnn);
  } catch(e){ /* the script's own checks will say so */ }
  await sleep(250);
}
const { puppeteer, sleep, page, tap, openPanel, pickTool, BIG, check, report } = H;

const CAP = () => {
  const c = document.querySelector('#ann-cap');
  if (!c || c.hidden) return null;
  return {
    text: document.querySelector('#ann-cap-text').textContent,
    state: c.className.replace('ann-cap', '').trim() || 'ok',
    bar: document.querySelector('#ann-bar-fill').style.width,
  };
};
const num = t => parseInt(String(t).replace(/,/g, ''), 10);

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 120000 });

  console.log('\n— the counter —');
  {
    const p = await page(b);
    await openPanel(p);
    check('nothing to count, nothing shown', (await p.evaluate(CAP)) === null);

    await pickTool(p, 'point');
    await tap(p, 700, 450);
    await sleep(700);
    const one = await p.evaluate(CAP);
    check('it appears with the first mark', !!one, JSON.stringify(one));
    console.log('      one mark: ' + one.text + '  bar ' + one.bar);

    // a description is characters too
    await p.evaluate(() => {
      const d = document.querySelector('#ann-desc');
      d.value = 'x'.repeat(1200);
      d.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(900);
    const flat = await p.evaluate(CAP);
    check('a description moves it', num(flat.text) > num(one.text), one.text + ' → ' + flat.text);

    // and deflate means WHICH characters matters, not only how many
    await p.evaluate(() => {
      const d = document.querySelector('#ann-desc');
      let s = '';
      for (let i = 0; i < 1200; i++) s += String.fromCharCode(33 + ((i * 37) % 90));
      d.value = s;
      d.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(900);
    const varied = await p.evaluate(CAP);
    check('the same length of varied text costs more',
      num(varied.text) > num(flat.text), flat.text + ' vs ' + varied.text);
    console.log('      1,200 repeated chars: ' + flat.text);
    console.log('      1,200 varied chars  : ' + varied.text);

    // marks themselves
    await p.evaluate(() => {
      const d = document.querySelector('#ann-desc');
      d.value = '';
      d.dispatchEvent(new Event('input', { bubbles: true }));
      const t = document.querySelector('.ann-tool[data-tool="point"]');
      if (t.getAttribute('aria-pressed') !== 'true') t.click();
    });
    await sleep(400);
    for (let i = 0; i < 30; i++) await tap(p, 300 + (i % 15) * 30, 320 + Math.floor(i / 15) * 70);
    await sleep(900);
    const many = await p.evaluate(CAP);
    check('more marks move it', num(many.text) > num(one.text), one.text + ' → ' + many.text);
    console.log('      31 marks: ' + many.text + '  bar ' + many.bar);
    check('and it is still well inside the limit', many.state === 'ok', many.state);
    await p.close();
  }

  console.log('\n— and when it will not fit —');
  {
    const p = await page(b);
    await (await p.$('#ann-file')).uploadFile(BIG);
    await sleep(6000);
    const over = await p.evaluate(CAP);
    check('the counter goes red', over && over.state === 'over', JSON.stringify(over));
    check('and says the file is the only way out', /file only/.test(over.text), over.text);
    check('the bar is full', over.bar === '100%', over.bar);
    check('Copy link is struck through',
      await p.evaluate(() => document.querySelector('#ann-link').classList.contains('too-big')));
    check('and the standing warning gives the numbers',
      await p.evaluate(() => {
        const w = document.querySelector('#ann-warn');
        return !w.hidden && /characters compressed/.test(w.textContent) && /×/.test(w.textContent);
      }));
    console.log('      ' + over.text);
    await p.close();
  }

  /* What the link leaves out, and that leaving it out costs nothing.
     A link is capped at 6,000 characters and a file is not, so the two are not
     the same document: the link drops coordinates below four decimals and
     every property that only repeats a default. Both halves have to be
     measured — the saving, and that the map comes back identical. */
  console.log('\n— the link carries less than the file —');
  {
    const p = await page(b);
    await openPanel(p);
    const put = async (id, v) => p.evaluate((i, val) => { const el = document.querySelector(i);
      el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true })); }, id, v);
    await pickTool(p, 'point'); await tap(p, 400, 300);
    await pickTool(p, 'point'); await tap(p, 470, 340);
    await put('#ann-colour', '#1f5c7a'); await put('#ann-size', '9');
    await put('#ann-symbol', 'division'); await put('#ann-opacity', '60');
    await put('#ann-title', 'Kwantung');
    await pickTool(p, 'polygon');
    await tap(p, 600, 400); await tap(p, 700, 440); await tap(p, 660, 520);
    await p.evaluate(() => document.querySelector('#ann-finish').click()); await sleep(400);
    await pickTool(p, 'arrow'); await tap(p, 300, 600); await tap(p, 500, 660);
    await sleep(400);
    await put('#ann-head', 'barbed'); await put('#ann-curve', '25');
    await sleep(1600);
    const before = await p.evaluate(() =>
      JSON.parse(localStorage.getItem('jem-annotations-v1')).f);
    const cap = await p.evaluate(CAP);
    const fileSize = JSON.stringify(before).length;
    console.log('      file ' + fileSize + ' chars, link ' + cap.text);
    check('the link is a fraction of the file', num(cap.text) < fileSize,
      num(cap.text) + ' vs ' + fileSize);
    await p.evaluate(() => document.querySelector('#ann-link').click());
    await sleep(1200);
    const link = await p.evaluate(() => {
      const f = document.querySelector('#ann-link-field'); return f ? f.value : ''; });
    // the annotations ride in a query parameter, not a fragment
    check('and there is a link to follow', /[?&]ann=/.test(link), link.slice(0, 70));
    const p2 = await page(b, { query: '' });
    await p2.goto(link, { waitUntil: 'networkidle0' }); await ready(p2, true);
    const after = await p2.evaluate(() => {
      const k = localStorage.getItem('jem-annotations-shared-v1')
             || localStorage.getItem('jem-annotations-v1');
      return k ? JSON.parse(k).f : null; });
    check('every mark comes back', after && after.length === before.length,
      before.length + ' → ' + (after ? after.length : 'none'));
    // A property equal to its own default is the same as no property: those
    // are what the link drops, and what the drawing code fills back in.
    const DEF = { 'stroke-opacity': 1, 'marker-symbol': 'circle', 'stroke-width': 3,
                  'fill-opacity': 0.28, 'jem-curve': 0, 'jem-arrow-head': 'triangle' };
    const diffs = [];
    (after || []).forEach((g, i) => {
      const f = before[i]; if (!f) return;
      new Set([...Object.keys(f.properties), ...Object.keys(g.properties)]).forEach(k => {
        const a = f.properties[k], c = g.properties[k];
        if ((a === '' && c === undefined) || (a === undefined && c === '')) return;
        if (c === undefined && DEF[k] === a) return;
        if (a === undefined && DEF[k] === c) return;
        if (JSON.stringify(a) !== JSON.stringify(c)) diffs.push('#' + i + ' ' + k
          + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(c));
      });
      const rd = v => JSON.parse(JSON.stringify(v).replace(/-?\d+\.\d+/g,
        m => String(Math.round(+m * 1e4) / 1e4)));
      if (JSON.stringify(rd(f.geometry.coordinates))
          !== JSON.stringify(rd(g.geometry.coordinates))) diffs.push('#' + i + ' geometry');
    });
    check('and comes back the same, to four decimals and every property',
      diffs.length === 0, diffs.slice(0, 4).join(' | '));
    await p2.close();
    await p.close();
  }

  await b.close();
  process.exit(report());
})();
