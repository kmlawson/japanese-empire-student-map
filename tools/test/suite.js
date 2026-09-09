/* The shared harness for every test script in this directory.
 *
 * Until 9 September 2026 there was none: fifty-seven scripts each carried
 * their own copy of the puppeteer resolver, the pass/fail counter, the
 * `matchMedia` shim and a page opener, in two formatting families and five
 * launch configurations — so a fix to any of them was a fix in one file and
 * a wish in the rest. Everything that was copied is here once.
 *
 *     const { launch, open, check, report, sleep, until } = require('./suite.js');
 *     const b = await launch();
 *     const p = await open(b, '?bbox=119.5,21.5,122.5,25.6');
 *     check('the map drew', await p.evaluate(() => !!document.querySelector('#land .atom')));
 *     await b.close();
 *     process.exit(report());
 *
 * `open` waits for the map to have drawn, not for the network to go quiet:
 * `networkidle0` is a fixed half second after the last request on top of the
 * transfer, and `ready()` in `settle.js` then waited again for the thing the
 * script was actually about to read. `domcontentloaded` and `ready()` is
 * what every script needs, and it is a second cheaper per page.
 *
 * `annotations/suite.js` builds on this and adds what the drawing tools need.
 */
'use strict';

/* Puppeteer is not a dependency of this repository — it is 300 MB and nothing
   the map ships needs it — so it is looked for rather than required outright.
   `npm install puppeteer` in the repository root, or set PUPPETEER_PATH. */
const puppeteer = (function () {
  const tries = [];
  if (process.env.PUPPETEER_PATH) tries.push(process.env.PUPPETEER_PATH);
  tries.push('puppeteer');
  for (const t of tries) { try { return require(t); } catch (e) { /* keep looking */ } }
  console.error('tests: puppeteer not found.\n\n'
    + '  npm install puppeteer            # in the repository root, or\n'
    + '  PUPPETEER_PATH=/path/to/puppeteer node tools/test/all.js\n');
  process.exit(1);
})();

const { ready, until, sleep } = require('./settle.js');
const { sandboxDownloads } = require('./downloads.js');

/* ---------------------------------------------------------------- checks --
   One counter per process. `report()` prints the line `all.js` parses —
   `N passed, M failed` — lists what failed, and returns the failure count for
   `process.exit`. */
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); return true; }
  fail++;
  const line = name + (detail ? ' — ' + detail : '');
  failures.push(line);
  console.log('  FAIL ' + line);
  return false;
}
function report() {
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  if (fail) failures.forEach(f => console.log('   × ' + f));
  return fail;
}

/* ----------------------------------------------------------------- pages --
   Headless Chrome does not match `(hover: hover) and (pointer: fine)`, so the
   map's hover handlers are never wired and a mouse test silently measures
   nothing. This makes those queries true. It is installed on every page that
   is not pretending to be a touch screen. */
const SHIM = () => {
  const o = window.matchMedia;
  window.matchMedia = q => (/hover:\s*hover|pointer:\s*fine/.test(q)
    ? { matches: true, media: q, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {} }
    : o.call(window, q));
};

const BASE = process.env.MAP_URL || 'http://localhost:8123/index.html';
/* The origin the map is served from, so every script can be pointed at
   another copy — a pinned worktree on another port, say — with one
   variable: `MAP_URL=http://localhost:8124/index.html node tools/test/all.js`. */
const HOST = BASE.replace(/\/[^/]*$/, '');

/* One launch configuration. `protocolTimeout` is long because a script that
   is starved of CPU while three other browsers start can take a while to get
   its first answer, and `all.js` treats a protocol timeout as "never started"
   and retries — so it should be long enough that a running script does not
   hit it. */
const LAUNCH = { headless: 'new', args: ['--no-sandbox'], protocolTimeout: 180000 };
async function launch(opts) {
  const o = Object.assign({}, LAUNCH, opts || {});
  // extra `args` add to the standard ones rather than replacing them
  o.args = LAUNCH.args.concat((opts && opts.args) || []);
  const b = await puppeteer.launch(o);
  if (opts && opts.downloads) await sandboxDownloads(b);
  return b;
}

/* A page with the map on it, drawn and settled.

     open(b)                         the map as it opens
     open(b, '?bbox=119,21,122,25')  a query on the map page
     open(b, 'http://…/timetable/…', { ready: false })   another page entirely

   Options: `touch` (a phone: mobile viewport, touch events, no shim),
   `width`/`height`, `accept` (answer confirms yes rather than no), `then`
   (milliseconds to settle after the map is ready — for a transition, not a
   guess), `ready: false` (do not wait for the map: the page is not the map).
   Page errors are collected on `p.__errs` for the closing check. */
async function open(browser, url, opts) {
  const o = opts || {};
  const p = await browser.newPage();
  await p.setViewport(o.touch
    ? { width: o.width || 900, height: o.height || 1000, isMobile: true, hasTouch: true }
    : { width: o.width || 1280, height: o.height || 950 });
  if (!o.touch && o.shim !== false) await p.evaluateOnNewDocument(SHIM);
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(String(e)));
  p.on('dialog', async d => {
    if (d.type() === 'beforeunload') { await d.accept(); return; }
    await (o.accept ? d.accept() : d.dismiss());
  });
  let target = url || BASE;
  if (target.charAt(0) === '?' || target.charAt(0) === '#') target = BASE + target;
  await p.goto(target, { waitUntil: 'domcontentloaded' });
  if (o.ready !== false) await ready(p, { then: o.then });
  return p;
}

module.exports = { puppeteer, sleep, ready, until, check, report, SHIM,
                   launch, open, BASE, HOST, sandboxDownloads };
