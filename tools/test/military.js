/* The 1931 military divisions of British India, as a thematic layer.
 *
 *     node tools/test/military.js          # needs a server on 8123
 *
 * From the *Military Divisions* plate of the 1931 Imperial Gazetteer Atlas of
 * India: five commands in their colours, the districts under them, and the
 * independent brigade areas. `build_themes.py` writes it to its own file;
 * `buildThemeAreas` in map.js draws it. What is guarded:
 *
 *   * the book offers it under the name the author gave, with its source;
 *   * eighteen areas in the five command colours, a solid and a dashed line;
 *   * **it stops at the map's western edge** — Baluchistan runs to 61° E, the
 *     map to 66°, and a longitude west of the edge used to be drawn 360° round
 *     at the far east, as a British band across Tibet to Burma;
 *   * the hover and the card name the area and its command, with the
 *     Administrative layer left off — this theme does not switch it on;
 *   * going Burma → this → Burma → off puts the Administrative layer and the
 *     names back as they were each time;
 *   * the layer note gives the source and the download, the right-click menu
 *     offers the file, and the file is served;
 *   * with a finger, the second tap names the area on the card.
 */
'use strict';
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const COLOURS = {
  Northern: '#a998bf', Western: '#b07f8e', Eastern: '#a9bf7a',
  Southern: '#efd96b', 'Burma Independent District': '#ec9a5b',
};
const PLACES = {
  Lahore: [74.3, 31.5, 'Lahore District, Northern Command'],
  Quetta: [67.0, 30.2, 'Baluchistan District, Western Command'],
  Zhob: [69.0, 31.2, 'Zhob Independent Brigade Area, Western Command'],
  Karachi: [68.5, 25.5, 'Sind Independent Brigade Area, Western Command'],
  Delhi: [77.2, 28.6, 'Delhi Independent Brigade Area, Eastern Command'],
  Poona: [74.0, 18.3, 'Poona Independent Brigade Area, Southern Command'],
  Madras: [79.5, 12.0, 'Madras District, Southern Command'],
  Calcutta: [88.3, 22.8, 'Presidency & Assam District, Eastern Command'],
  Mandalay: [96.0, 22.0, 'Burma Independent District'],
};

const screenAt = (p, lon, lat) => p.evaluate((lon, lat) => {
  const q = window.JMAP_GEO.project(lon, lat);
  const m = document.querySelector('#jmap').getScreenCTM();
  return { x: m.a * q.x + m.c * q.y + m.e, y: m.b * q.x + m.d * q.y + m.f };
}, lon, lat);

async function choose(p, re) {
  await p.evaluate(() => {
    const m = document.getElementById('theme-menu');
    if (!m || m.hidden) document.getElementById('btn-theme').click();
  });
  await sleep(700);              // the menu opens, and fetches themes.js the first time
  await p.evaluate(re => {
    const i = [...document.querySelectorAll('#theme-menu input')]
      .find(x => new RegExp(re).test(x.parentNode.textContent));
    if (i) i.click();
  }, re);
  await p.waitForFunction(() => !!document.getElementById('thematic')
    || !document.querySelector('#theme-menu'), { timeout: 20000 }).catch(() => {});
  await calm(p);
}

const switches = p => p.evaluate(() => ({
  theme: (document.getElementById('thematic') || { getAttribute: () => '' }).getAttribute('data-theme'),
  admin: document.querySelector('#layer-seg [data-cat="territory"]').getAttribute('aria-pressed'),
  names: document.querySelector('#layer-seg [data-opt="labels"]').getAttribute('aria-pressed'),
}));

(async () => {
  const b = await launch();

  console.log('\n— the book offers it —');
  const p = await open(b, '?bbox=60,6,102,38', { width: 1400, height: 950 });
  await p.evaluate(() => document.getElementById('btn-theme').click());
  await sleep(900);              // the menu, and themes.js on the first press
  const rows = await p.evaluate(() => [...document.querySelectorAll('#theme-menu label')]
    .map(l => l.textContent.trim()));
  check('under the name and source the author gave',
    rows.includes('1931 Military Divisions of British India (Map from the 1931 Imperial Gazetteer of India)'),
    JSON.stringify(rows));
  await p.evaluate(() => document.getElementById('btn-theme').click());
  await choose(p, 'Military');

  console.log('\n— what it draws —');
  const drawn = await p.evaluate(() => {
    const g = document.getElementById('thematic');
    const areas = [...g.querySelectorAll('.theme-area')];
    return {
      areas: areas.length,
      fills: areas.map(a => [a.getAttribute('data-cat'), a.getAttribute('fill')]),
      solid: g.querySelectorAll('.theme-line:not(.theme-dash)').length,
      dashed: g.querySelectorAll('.theme-line.theme-dash').length,
      dash: getComputedStyle(g.querySelector('.theme-dash')).strokeDasharray,
      // the map's width, and the widest any area reaches, in map units
      mapW: +document.querySelector('#jmap').getAttribute('viewBox').split(' ')[2],
      right: Math.max(...areas.map(a => { const bb = a.getBBox(); return bb.x + bb.width; })),
      widest: Math.max(...areas.map(a => a.getBBox().width)),
    };
  });
  check('eighteen areas', drawn.areas === 18, drawn.areas);
  check('each in its command\'s colour',
    drawn.fills.every(([c, f]) => COLOURS[c] === f), JSON.stringify(drawn.fills.slice(0, 3)));
  check('a solid line and a dashed one', drawn.solid === 1 && drawn.dashed === 1 && drawn.dash !== 'none',
    JSON.stringify({ s: drawn.solid, d: drawn.dashed, dash: drawn.dash }));
  const balu = await p.evaluate(() => {
    const e = [...document.querySelectorAll('#thematic .theme-area')]
      .find(a => /Baluchistan/.test(a.getAttribute('data-cat-en')));
    const bb = e.getBBox();
    return { x: bb.x, w: bb.width };
  });
  check('Baluchistan stops at the map\'s western edge instead of wrapping round',
    balu.x >= -0.5 && balu.w < 400, JSON.stringify(balu));
  const admin0 = await switches(p);
  check('the Administrative layer and the names are left alone',
    admin0.admin === 'false' && admin0.names === 'false', JSON.stringify(admin0));

  console.log('\n— the hover names the area and its command —');
  for (const [n, [lon, lat, want]] of Object.entries(PLACES)) {
    const at = await screenAt(p, lon, lat);
    await p.mouse.move(at.x - 3, at.y - 3);
    await p.mouse.move(at.x, at.y, { steps: 3 });
    await sleep(350);            // the hover's own delay before the box
    const got = await p.evaluate(() => [...document.querySelectorAll('#tooltip .theme-cat')]
      .map(e => e.textContent).join(' | '));
    check('  ' + n, got === want, got + ' (wanted ' + want + ')');
  }

  console.log('\n— the card, the note and the file —');
  const lah = await screenAt(p, 74.3, 31.5);
  await p.mouse.click(lah.x, lah.y);
  await sleep(400);              // past the double-click window
  await calm(p);
  const note = await p.evaluate(() => document.querySelector('#info .note-own').textContent);
  check('a click says which area the ground was in',
    /On the 1931 Military Divisions of British India this is Lahore District, Northern Command\./.test(note),
    note.slice(0, 120));
  await p.evaluate(() => document.getElementById('info-close').click());
  await p.evaluate(() => document.getElementById('btn-layer-info').click());
  await sleep(300);              // the dialog opens
  const info = await p.evaluate(() => {
    const s = document.querySelector('[data-layer-info="theme-india-military"]');
    return s ? { text: s.textContent.replace(/\s+/g, ' '),
                 links: [...s.querySelectorAll('a')].map(a => [a.getAttribute('href'), a.hasAttribute('download')]) }
             : null;
  });
  check('the layer note gives the source', !!info && /Source: Map from the 1931 Imperial Gazetteer of India/.test(info.text),
    info && info.text);
  check('  linked to the original map', !!info && info.links.some(([h]) => /dsal\.uchicago\.edu\/reference\/gaz_atlas_1931/.test(h)),
    JSON.stringify(info && info.links));
  check('  and the download, as a download', !!info
    && info.links.some(([h, d]) => h === 'gis/source/india-1931-military-divisions.geojson' && d),
    JSON.stringify(info && info.links));
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const md = await screenAt(p, 96, 22);
  await p.mouse.click(md.x, md.y, { button: 'right' });
  await sleep(400);              // the menu is built on the press
  const items = await p.evaluate(() => [...document.querySelectorAll('#jmap-menu button')].map(x => x.textContent));
  check('right-click offers the layer as GeoJSON',
    items.includes('Download GeoJSON — 1931 Military Divisions of British India'), JSON.stringify(items));
  await p.keyboard.press('Escape');
  const served = await p.evaluate(async () => {
    const r = await fetch('gis/source/india-1931-military-divisions.geojson');
    const j = await r.json();
    return r.status + ' ' + j.features.length;
  });
  check('and the file is served, all eighteen areas', served === '200 18', served);

  console.log('\n— from one theme to another and back —');
  await p.goto(p.url().replace(/([?&])(bbox|where)=[^&]*/, '$1bbox=88,10,102,29'), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelectorAll('#land .atom').length > 0);
  await calm(p);
  const start = await switches(p);
  await choose(p, 'Burma');
  const bur = await switches(p);
  await choose(p, 'Military');
  const mil = await switches(p);
  await choose(p, 'Burma');
  const bur2 = await switches(p);
  await p.evaluate(() => document.getElementById('btn-theme').click());   // on with a theme up: off
  await calm(p);
  const off = await switches(p);
  check('Burma switches the districts and names on',
    bur.theme === 'burma-rule' && bur.admin === 'true' && bur.names === 'true', JSON.stringify(bur));
  check('this one after it puts them back', mil.theme === 'india-military'
    && mil.admin === start.admin && mil.names === start.names, JSON.stringify(mil));
  check('Burma again has them on', bur2.admin === 'true', JSON.stringify(bur2));
  check('and off leaves them as they started', !off.theme
    && off.admin === start.admin && off.names === start.names, JSON.stringify(off));

  console.log('\n— with a finger —');
  const f = await open(b, '?bbox=66,17,80,34', { touch: true, width: 390, height: 664 });
  await choose(f, 'Military');
  const pt = await screenAt(f, 74.3, 31.5);
  const cards = [];
  for (let t = 0; t < 2; t++) {
    await f.mouse.move(pt.x, pt.y);
    await f.mouse.down();
    await sleep(60);             // a press, not a flick
    await f.mouse.up();
    await sleep(450);            // past the 320 ms double-tap window
    await calm(f);
    cards.push(await f.evaluate(() => (document.querySelector('#info .note-own') || {}).textContent || ''));
  }
  check('a tap on the ground names the area on the card',
    cards.some(c => /Lahore District, Northern Command/.test(c)), JSON.stringify(cards.map(c => c.slice(0, 80))));

  const failed = report();
  await b.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
