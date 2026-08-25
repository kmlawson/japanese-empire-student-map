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

  await b.close();
  process.exit(report());
})();
