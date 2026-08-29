#!/usr/bin/env node
/* What this map costs, measured the same way every time.
 *
 *     python3 -m http.server 8123 &
 *     node tools/stats.js            # measure, write stats/<version>.json
 *     node tools/stats.js --print    # measure and print, write nothing
 *
 * WHY A FILE PER VERSION. Performance work on this map has twice been argued
 * from memory — "it feels slower since the stations went in" — and memory is
 * not evidence. A number written down at update 220 can be compared with the
 * same number at 260 without anybody having to remember what it used to be.
 *
 * WHAT IS AND IS NOT MEASURABLE HERE. This runs in headless Chrome, which
 * rasterises without a compositor or vsync: SCRIPTING is measured faithfully
 * and PAINT is not. So a change that halves the paint cost will not show up,
 * and a regression that doubles it will not either. The numbers that follow
 * are honest about which side of that line they fall on, and the paint proxy —
 * how many things are on screen to be painted — is recorded precisely because
 * the paint itself cannot be.
 *
 * Every timing is the median of three runs. A single run of anything here
 * varies by a fifth between invocations; three medians land within a couple of
 * per cent, which is enough to see a real change and not enough to chase noise.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = (function () {
  const t = [];
  if (process.env.PUPPETEER_PATH) t.push(process.env.PUPPETEER_PATH);
  t.push('puppeteer');
  for (const x of t) { try { return require(x); } catch (e) {} }
  console.error('stats: puppeteer not found.');
  process.exit(1);
})();

const ROOT = path.join(__dirname, '..');
const HOST = 'http://localhost:8123/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const round = (v, n) => Math.round(v * Math.pow(10, n)) / Math.pow(10, n);

/* The views the drags are measured at. Chosen to span the range a reader
   actually uses and to be stable: they are bounding boxes, so the same call
   frames the same ground whatever the window is. */
const VIEWS = [
  ['world',  '61,-33,201,68'],
  ['region', '110,15,140,40'],
  ['island', '119.5,21.5,122.5,25.6'],
  ['local',  '120.3,23.8,121.2,24.6'],
];

const SHIM = () => {
  const o = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} }
    : o.call(window, q));
};

function version() {
  const csv = fs.readFileSync(path.join(ROOT, 'texts/version.csv'), 'utf8');
  return csv.trim().split('\n').pop().trim();
}

function bytes() {
  const want = ['index.html', 'map.js', 'styles.css', 'data.js', 'admin.js',
                'annotate.js', 'cities-gaz.js', 'tw-stations.js',
                'kr-stations.js', 'japan-empire-map.svg',
                'japan-empire-map-admin.svg', 'japan-empire-map-fine.svg',
                'japan-empire-map-roc.svg', 'japan-empire-map-ne.svg'];
  const out = {};
  let first = 0;
  for (const f of want) {
    try {
      const n = fs.statSync(path.join(ROOT, f)).size;
      out[f] = n;
      // what a reader waits for before the map is on screen: the page, the
      // scripts it needs and the one SVG it opens with. The rest is fetched
      // only if asked for.
      if (['index.html', 'map.js', 'styles.css', 'data.js', 'cities-gaz.js',
           'japan-empire-map.svg'].indexOf(f) >= 0) first += n;
    } catch (e) { /* not built */ }
  }
  out['_first paint needs'] = first;
  return out;
}

/* One drag, and what the page spent doing it. Returns the share of samples
   that were not idle, which is the number that survives a change of machine
   better than milliseconds do. */
async function drag(p) {
  const client = await p.target().createCDPSession();
  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', { interval: 50 });
  await client.send('Profiler.start');
  const r = await p.evaluate(() => {
    const b = document.getElementById('map-container').getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  await p.mouse.move(r.x - 200, r.y);
  await p.mouse.down();
  for (let i = 0; i < 80; i++) {
    await p.mouse.move(r.x - 200 + i * 5, r.y + Math.sin(i / 7) * 50);
  }
  await p.mouse.up();
  const { profile } = await client.send('Profiler.stop');
  await client.detach();
  const nodes = {};
  (profile.nodes || []).forEach(n => { nodes[n.id] = n; });
  let busy = 0, total = 0, label = 0;
  (profile.samples || []).forEach(id => {
    const n = nodes[id];
    if (!n) return;
    total++;
    const f = n.callFrame.functionName || '';
    if (f === '(idle)') return;
    busy++;
    if (/placeLabels|free|islandQuota|estimateWidth|setLabelText|gateLabels/.test(f)) label++;
  });
  return { busy: 100 * busy / Math.max(1, total),
           label: 100 * label / Math.max(1, busy) };
}

async function open(b, where, layers) {
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 900 });
  await p.evaluateOnNewDocument(SHIM);
  const t0 = Date.now();
  await p.goto(HOST + '?where=' + where, { waitUntil: 'networkidle0' });
  await p.waitForFunction(() => document.querySelectorAll('#land .atom').length > 0,
                          { polling: 'raf', timeout: 30000 });
  const ready = Date.now() - t0;
  await sleep(1800);
  if (layers) {
    await p.evaluate(() => {
      for (const id of ['opt-tw-rail', 'opt-tw-stations',
                        'opt-kr-rail', 'opt-kr-stations']) {
        const e = document.getElementById(id);
        if (e && !e.checked) { e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      const o = document.querySelector('[data-opt="labels"]');
      if (o && o.getAttribute('aria-pressed') !== 'true') o.click();
      const a = document.querySelector('[data-cat="territory"]');
      if (a && !a.classList.contains('on')) a.click();
    });
    await sleep(2500);
    await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    await sleep(500);
  }
  return { p, ready };
}

/* What is on screen to be painted. Headless cannot time the paint, so it
   counts the work instead: this is the proxy, and it is the number that moved
   when panning got slower. */
const onScreen = p => p.evaluate(() => {
  const vis = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right > 0 && r.left < innerWidth
        && r.bottom > 0 && r.top < innerHeight;
  };
  /* Two counts, because they answer different questions. `lettered` is every
     label carrying words — the work `gateLabels` and `placeLabels` do. `labels`
     is how many of those are actually in the frame — the work the rasteriser
     does, which is the one that cannot be timed here. */
  let labels = 0, lettered = 0;
  document.querySelectorAll('#labels text').forEach(t => {
    if (!t.textContent.trim()) return;
    lettered++;
    if (vis(t)) labels++;
  });
  return {
    labels: labels,
    lettered: lettered,
    nodes: document.getElementsByTagName('*').length,
    svgPaths: document.querySelectorAll('#jmap path').length,
    stationMarks: document.querySelectorAll('.sta-mark').length,
    heapMB: performance.memory
      ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
  };
});

(async () => {
  const printOnly = process.argv.indexOf('--print') >= 0;
  const v = version();
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--enable-precise-memory-info'] });
  const out = { version: Number(v), files: bytes(), views: {} };

  // the plain opening, three times, for the load figure
  const readies = [];
  for (let i = 0; i < 3; i++) {
    const { p, ready } = await open(b, VIEWS[0][1], false);
    readies.push(ready);
    if (i === 2) out.opening = await onScreen(p);
    await p.close();
  }
  out.readyMs = median(readies);

  for (const [name, where] of VIEWS) {
    const row = {};
    for (const layers of [false, true]) {
      const key = layers ? 'withLayers' : 'bare';
      const busy = [], label = [];
      let seen = null;
      for (let i = 0; i < 3; i++) {
        const { p } = await open(b, where, layers);
        if (i === 0) seen = await onScreen(p);
        const d = await drag(p);
        busy.push(d.busy); label.push(d.label);
        await p.close();
      }
      row[key] = { busyPct: round(median(busy), 1),
                   labelSharePct: round(median(label), 2),
                   labels: seen.labels, lettered: seen.lettered,
                   nodes: seen.nodes, stationMarks: seen.stationMarks,
                   heapMB: seen.heapMB };
    }
    out.views[name] = row;
  }
  await b.close();

  const pad = (v, n) => String(v).padStart(n);
  const lpad = (v, n) => String(v).padEnd(n);
  const line = (k, v) => console.log('  ' + (k + ' ').padEnd(34, '.') + ' ' + v);
  console.log('\nupdate ' + v);
  line('first paint needs', (out.files['_first paint needs'] / 1024).toFixed(0) + ' KB');
  line('ready', out.readyMs + ' ms');
  line('nodes at the opening view', out.opening.nodes);
  console.log('');
  console.log('  ' + lpad('view', 8) + lpad('layers', 12) + pad('busy%', 7)
              + pad('label%', 8) + pad('drawn', 7) + pad('lettered', 9)
              + pad('nodes', 8) + pad('heapMB', 8));
  for (const [name] of VIEWS) {
    for (const k of ['bare', 'withLayers']) {
      const r = out.views[name][k];
      console.log('  ' + lpad(name, 8) + lpad(k, 12) + pad(r.busyPct, 7)
                  + pad(r.labelSharePct, 8) + pad(r.labels, 7)
                  + pad(r.lettered, 9) + pad(r.nodes, 8) + pad(r.heapMB, 8));
    }
  }
  if (printOnly) return;
  const dir = path.join(ROOT, 'stats');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, v + '.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('\nwrote stats/%s.json', v);
})();
