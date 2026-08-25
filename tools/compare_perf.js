#!/usr/bin/env node
/* Compare pan-and-zoom performance between builds of the map.
 *
 *     node tools/compare_perf.js
 *     node tools/compare_perf.js --region india --admin --throttle 8
 *     node tools/compare_perf.js --targets live,local --reps 5
 *
 * The point of this is the comparison before an update: the live site is one
 * version and the working tree is another, and the question is whether the new
 * one is slower. Absolute numbers from a headless browser mean very little;
 * the same script run against two builds back to back on one machine means a
 * good deal.
 *
 * Two things it took a while to learn, both of which this script does for you:
 *
 * CPU THROTTLING IS NOT OPTIONAL. Unthrottled, headless Chrome pins every
 * region of this map to vsync at 16.7 ms a frame and the CPU profile comes
 * back 93% idle. Every build and every region then measures the same and the
 * script says nothing. At 6x the ranking is legible. This is why an earlier
 * attempt at exactly this comparison concluded, wrongly, that there was
 * nothing to find.
 *
 * SELF-TIME IS THE WRONG QUESTION. `getBoundingClientRect` sitting at the top
 * of a profile tells you nothing you can act on. What matters is who called
 * it — a forced layout inside a once-a-frame handler is a bug, the same call
 * once on a click is not. So the profile's call tree is walked and the layout
 * reads are reported with three frames of their caller.
 */
'use strict';

const path = require('path');
const fs = require('fs');

/* Puppeteer is not a dependency of this repository — it is 300 MB and nothing
   the map ships needs it — so it is looked for rather than required outright.
   Set PUPPETEER_PATH if it lives somewhere unusual. */
function loadPuppeteer() {
  const tries = [];
  if (process.env.PUPPETEER_PATH) tries.push(process.env.PUPPETEER_PATH);
  tries.push('puppeteer');
  for (const t of tries) {
    try { return require(t); } catch (err) { /* keep looking */ }
  }
  console.error(
    'compare_perf: puppeteer not found.\n\n' +
    '  npm install puppeteer            # in this directory, or\n' +
    '  PUPPETEER_PATH=/path/to/puppeteer node tools/compare_perf.js\n\n' +
    'node_modules/ is gitignored, so installing here costs nothing but disk.');
  process.exit(1);
}

/* ------------------------------------------------------------- options -- */

const TARGETS = {
  live:  ['froginawell', 'https://froginawell.net/reference/japanese-empire/index.html'],
  pages: ['github pages', 'https://kmlawson.github.io/japanese-empire-student-map/index.html'],
  local: ['working tree', 'http://localhost:8123/index.html'],
};

/* Where to measure. India is first because it is the worst case — the most
   shapes in one view, and the region every performance complaint has been
   about. The others are for checking that a fix has not moved the cost
   somewhere else. */
const REGIONS = {
  india:    '68,8,90,32',
  japan:    '128,30,146,46',
  china:    '108,20,126,40',
  indies:   '95,-10,120,8',
  solomons: '155,-10,160,-6.5',
  home:     null,
};

function parseArgs(argv) {
  const o = { targets: ['live', 'pages', 'local'], region: 'india', reps: 3,
              throttle: 6, admin: false, epoch: null, json: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--targets') o.targets = next().split(',').map(s => s.trim());
    else if (a === '--region') o.region = next();
    else if (a === '--reps') o.reps = Number(next());
    else if (a === '--throttle') o.throttle = Number(next());
    else if (a === '--admin') o.admin = true;
    else if (a === '--epoch') o.epoch = next();
    else if (a === '--json') o.json = next();
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else { console.error('unknown option: ' + a); usage(); process.exit(1); }
  }
  return o;
}

function usage() {
  console.log(`
  node tools/compare_perf.js [options]

  --targets a,b     which builds, comma separated (default live,pages,local)
                    ${Object.keys(TARGETS).join(', ')}, or any http(s) URL
  --region name     ${Object.keys(REGIONS).join(', ')}   (default india)
  --reps n          repetitions per target (default 3; 4-5 for a close call)
  --throttle n      CPU slowdown factor (default 6; 1 measures nothing)
  --admin           switch the Administrative layer on first
  --epoch 1942      switch to the December 1942 sheet first
  --json file       also write the raw numbers

  'local' expects a server on 8123:  python3 -m http.server 8123
`);
}

/* --------------------------------------------------------------- probe -- */

/* Headless Chrome does not match (hover: hover) and (pointer: fine), so the
   map's hover handlers are never wired and a mouse test silently measures
   nothing. See CLAUDE.md. */
const SHIM = () => {
  const real = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} }
    : real.call(window, q));
};

const FRAME_HOOK = () => {
  window.__frames = [];
  const tick = () => { window.__frames.push(performance.now());
                       requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function measure(browser, url, opt) {
  /* A context of its own for every measured page.
   *
   * `map.js` keeps `labels`, `graticule`, `indiaRivers`, `projection`,
   * `occSource` and the annotation set in localStorage, so a second page in
   * the same browser starts where the first finished — and a script that
   * "switches labels on" for run two actually switches them off. This tool
   * reused one browser across targets and repetitions, so every `--admin` run
   * after the first was measuring something other than what it said.
   */
  const ctx = browser.createBrowserContext
    ? await browser.createBrowserContext()
    : (browser.createIncognitoBrowserContext
        ? await browser.createIncognitoBrowserContext() : null);
  const page = ctx ? await ctx.newPage() : await browser.newPage();
  await page.setViewport({ width: 1300, height: 900 });
  await page.evaluateOnNewDocument(SHIM);

  const bbox = REGIONS[opt.region];
  await page.goto(url + (bbox ? '?bbox=' + bbox : ''), { waitUntil: 'networkidle0' });
  await sleep(3500);

  /* The version of the code that is running, which is what `JEM_VERSION` in
     `map.js` is for — reading it out of the page would report whatever
     `index.html` says, and those two can differ by a week. */
  const version = await page.evaluate(() => {
    const el = document.getElementById('jem-version');
    if (el && el.textContent.trim()) return el.textContent.trim();
    const m = document.body.innerHTML.match(/[vV]ersion\s*([0-9.]+)/);
    return m ? m[1] : '?';
  });
  if (opt.epoch) {
    const label = opt.epoch === '1942' ? 'Dec 1942' : '1930';
    await page.evaluate(t => {
      const b = [...document.querySelectorAll('button')]
        .find(x => x.textContent.trim() === t);
      if (b) b.click();
    }, label);
    await sleep(1500);
  }
  if (opt.admin) {
    await page.evaluate(() => document.querySelector('[data-cat="territory"]').click());
    await sleep(3500);          // the administrative sheet is a separate fetch
  }

  const cdp = await page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: opt.throttle });
  await page.evaluate(FRAME_HOOK);
  await sleep(300);
  await page.evaluate(() => { window.__frames.length = 0; });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 60 });
  await cdp.send('Profiler.start');

  // one drag across the region, three notches in, three back out — the two
  // things a reader actually does, in the proportion they do them
  await page.mouse.move(650, 450);
  await page.mouse.down();
  for (let i = 0; i < 40; i++) { await page.mouse.move(650 - i * 7, 450 + i * 2); await sleep(12); }
  await page.mouse.up();
  await sleep(200);
  for (let z = 0; z < 3; z++) {
    await page.evaluate(() => document.querySelector('#zoom-in').click());
    await sleep(450);
  }
  for (let z = 0; z < 3; z++) {
    await page.evaluate(() => document.querySelector('#zoom-out').click());
    await sleep(450);
  }

  const { profile } = await cdp.send('Profiler.stop');
  const frames = await page.evaluate(() => window.__frames.slice());
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.close();
  if (ctx) await ctx.close();

  return { version, ...digest(profile, frames) };
}

/* What a profile says, once the call tree is put back together. */
function digest(profile, frames) {
  const node = {}, parent = {};
  profile.nodes.forEach(n => {
    node[n.id] = n;
    (n.children || []).forEach(c => { parent[c] = n.id; });
  });
  const span = (profile.endTime - profile.startTime) / 1000;
  const total = profile.samples.length || 1;
  const ms = n => n * span / total;

  const name = id => {
    const n = node[id];
    return n ? (n.callFrame.functionName || '(anon)') : '';
  };
  const chain = id => {
    const out = [];
    let x = id;
    for (let g = 0; g < 4 && x; g++) { out.push(name(x)); x = parent[x]; }
    return out.filter(Boolean);
  };

  let busy = 0;
  const self = {}, layout = {};
  profile.samples.forEach(id => {
    const n = node[id];
    if (!n) return;
    const fn = n.callFrame.functionName || '(anon)';
    if (fn === '(idle)') return;
    busy++;
    if (fn !== '(program)' && fn !== '(garbage collector)') self[fn] = (self[fn] || 0) + 1;
    // the reads that force the browser to lay the document out
    if (fn === 'getBoundingClientRect' || fn === 'getBBox') {
      const key = fn + ' <- ' + chain(parent[id]).join(' < ');
      layout[key] = (layout[key] || 0) + 1;
    }
  });

  const gaps = [];
  for (let i = 1; i < frames.length; i++) gaps.push(frames[i] - frames[i - 1]);
  gaps.sort((a, b) => a - b);
  const pct = q => (gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * q))] : 0);

  return {
    span, busy: ms(busy), frames: gaps.length,
    p50: pct(0.5), p90: pct(0.9), p99: pct(0.99),
    forcedLayout: ms(Object.values(layout).reduce((a, b) => a + b, 0)),
    top: Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([k, v]) => [k, ms(v)]),
    layout: Object.entries(layout).sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([k, v]) => [k, ms(v)]),
  };
}

/* -------------------------------------------------------------- report -- */

const mean = (xs, k) => xs.reduce((s, x) => s + x[k], 0) / xs.length;

function report(rows, opt) {
  /* Built by hand rather than with console.log's format specifiers. Node
     supports %s and %d and nothing else — the width and alignment flags a C
     programmer reaches for, `%-7s` and `%9s`, are printed literally and then
     every argument after them lands one column to the left. */
  const pad = (v, n) => String(v).padEnd(n);
  const num = (v, n) => String(v).padStart(n);

  const w = Math.max(11, ...rows.map(r => r.label.length));
  console.log('');
  console.log('  region ' + opt.region + ' | CPU throttle ' + opt.throttle
    + 'x | admin ' + (opt.admin ? 'on' : 'off') + ' | ' + opt.reps + ' reps each');
  console.log('');
  console.log('  ' + pad('build', w) + '  ' + pad('version', 8) + num('busy ms', 9)
    + num('layout ms', 11) + num('p50', 7) + num('p90', 7) + num('p99', 8));
  console.log('  ' + '-'.repeat(w + 52));

  const base = mean(rows[0].runs, 'busy');
  rows.forEach(r => {
    const busy = mean(r.runs, 'busy');
    const delta = r === rows[0] ? ''
      : '   ' + (busy < base ? '' : '+')
        + (100 * (busy - base) / base).toFixed(0) + '%';
    console.log('  ' + pad(r.label, w) + '  ' + pad(r.runs[0].version, 8)
      + num(busy.toFixed(0), 9)
      + num(mean(r.runs, 'forcedLayout').toFixed(0), 11)
      + num(mean(r.runs, 'p50').toFixed(1), 7)
      + num(mean(r.runs, 'p90').toFixed(1), 7)
      + num(mean(r.runs, 'p99').toFixed(1), 8) + delta);
  });

  console.log('');
  console.log('  Forced layout, by caller. A read here is once a frame, so it costs');
  console.log('  every frame of every drag — which is the thing worth finding.');
  rows.forEach(r => {
    console.log('');
    console.log('  ' + r.label);
    const l = r.runs[0].layout.filter(([, v]) => v >= 0.5);
    if (!l.length) { console.log('      none worth reporting'); return; }
    l.forEach(([k, v]) => console.log('    ' + num(Math.round(v), 5) + ' ms  ' + k));
  });
  console.log('');
}

/* ---------------------------------------------------------------- main -- */

(async () => {
  const opt = parseArgs(process.argv.slice(2));
  if (!(opt.region in REGIONS)) {
    console.error('unknown region: ' + opt.region + '  (' + Object.keys(REGIONS).join(', ') + ')');
    process.exit(1);
  }
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const rows = [];
  try {
    for (const t of opt.targets) {
      const [label, url] = TARGETS[t] || [t, t];
      if (!/^https?:\/\//.test(url)) {
        console.error('not a known target or a URL: ' + t);
        process.exit(1);
      }
      process.stderr.write('  measuring ' + label + ' ');
      const runs = [];
      for (let r = 0; r < opt.reps; r++) {
        try {
          runs.push(await measure(browser, url, opt));
          process.stderr.write('.');
        } catch (err) {
          process.stderr.write('x');
          console.error('\n  ' + label + ': ' + err.message);
        }
      }
      process.stderr.write('\n');
      if (runs.length) rows.push({ label, url, runs });
    }
  } finally {
    await browser.close();
  }
  if (!rows.length) { console.error('nothing measured'); process.exit(1); }
  report(rows, opt);
  if (opt.json) {
    fs.writeFileSync(opt.json, JSON.stringify({ opt, rows }, null, 1));
    console.log('  raw numbers in ' + opt.json + '\n');
  }
})();
