#!/usr/bin/env node
/* Run every test the project has, several at a time.
 *
 *     python3 -m http.server 8123 &
 *     node tools/test/all.js                 # all of them
 *     node tools/test/all.js taiwan labels   # only these
 *     node tools/test/all.js map             # only the map suites
 *     node tools/test/all.js ann             # only the annotation suites
 *     node tools/test/all.js data            # only what reads data/population/
 *     JOBS=2 node tools/test/all.js          # narrower, on a small machine
 *
 * `annotations/all.js` has done this for its own half since the scripts there
 * were sped up, and the map suites were left being run one at a time by hand.
 * Measured: the ten of them take 206s in a row and the longest is 45s, so
 * nearly all of that was the wait between them rather than the work.
 *
 * The scripts are independent — each drives its own browser and its own pages,
 * and nothing is shared but the static server — so they are pooled together
 * rather than run as two groups: a long map suite and a long annotation suite
 * can then overlap instead of queueing behind their own kind.
 *
 * Output is buffered per script and printed whole when that script ends, so
 * several interleaved streams do not become one unreadable one. The exit code
 * is the number of scripts that failed.
 */
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const MAP = ['taiwan', 'labels', 'provsource', 'backings', 'mapstrip',
             'projclip', 'extent', 'layers-url', 'bookmarks', 'cache-keys',
             'relief', 'mono', 'names', 'labuan', 'pin', 'stations', 'zoom', 'colours',
             'trains', 'korea', 'population', 'demography', 'sugar', 'epoch', 'taiwanpop', 'keys',
             'labelcats', 'legendpick', 'subnames', 'japanpop', 'theme', 'twpop1930', 'manchupop', 'routes'];
const ANN = ['run', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7',
             'run8', 'run9', 'run10', 'run11', 'run12', 'run13', 'run14',
             'run15'];

const fileFor = n => /^run/.test(n)
  ? path.join(__dirname, 'annotations', n + '.js')
  : path.join(__dirname, n + '.js');

/* The scripts that read `data/population/` — the figures, the cards, the
   tables, the choropleths and the sentences built from them. A dataset added
   or edited touches these and nothing else, and there is no reason to spend
   six minutes on the whole map suite to find that out: `node tools/test/all.js
   data` is about two.

   It is a *first* check, not the only one. Run `map` before a push: a CSV in
   that folder reaches `data.js`, which every script on the map reads. */
const DATA = ['population', 'demography', 'japanpop', 'twpop1930', 'manchupop',
              'taiwanpop', 'korea', 'names'];

const pick = process.argv.slice(2);
let list;
if (!pick.length) list = MAP.concat(ANN);
else if (pick.length === 1 && pick[0] === 'map') list = MAP;
else if (pick.length === 1 && pick[0] === 'ann') list = ANN;
else if (pick.length === 1 && pick[0] === 'data') list = DATA;
else list = pick.map(a => (/^\d+$/.test(a) ? 'run' + (a === '1' ? '' : a) : a));

/* Longest first, so the tail of the run is short jobs filling the gaps rather
   than one 45-second script the other three workers wait out. Names not in the
   table go last: an unknown script is usually a new one, and a new one is
   usually quick. */
const SECS = { mapstrip: 45, run2: 41, labels: 32, run5: 35, run14: 32, run9: 30,
               run3: 28, extent: 26, run10: 25, run11: 24, run12: 19, run: 19,
               run8: 19, provsource: 18, run13: 18, 'layers-url': 18, run4: 17,
               bookmarks: 16, 'cache-keys': 15, backings: 15, run6: 12,
               projclip: 11, taiwan: 15, relief: 60, mono: 30, names: 53, run7: 5,
               run15: 40, labuan: 35, pin: 44, stations: 65, zoom: 11, colours: 30, trains: 28, korea: 30,
               population: 75, demography: 60, sugar: 40, epoch: 45, taiwanpop: 35, keys: 40, theme: 25, twpop1930: 40, manchupop: 40, routes: 30 };
list = list.slice().sort((a, b) => (SECS[b] || 0) - (SECS[a] || 0));

/* Each script drives a browser, and a browser is several processes. Half the
   cores, never fewer than two and never more than four: past that they queue
   on the machine rather than on each other, and a test that is starved of CPU
   starts failing on timing rather than on truth. */
const JOBS = Math.max(2, Math.min(4,
  parseInt(process.env.JOBS, 10) || Math.floor((os.cpus().length || 4) / 2)));

const started = Date.now();
const results = [];
const retried = {};
let next = 0, running = 0;

function launch() {
  while (running < JOBS && next < list.length) {
    const name = list[next++];
    running++;
    const t0 = Date.now();
    const child = spawn(process.execPath, [fileFor(name)], { env: process.env });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('close', code => {
      const secs = Math.round((Date.now() - t0) / 100) / 10;
      const m = out.match(/(\d+) passed, (\d+) failed/);
      /* A script that never reported a count did not fail — it never ran. Two
         shapes of this have been seen, both of them several browsers starting
         at once and one of them losing:

           * it dies in a second or two, before anything opens;
           * or puppeteer's own connection to the browser times out, which
             shows as a `ProtocolError` and can take two minutes to give up.

         Either way there is no verdict to report, so it goes to the back of
         the queue where the machine is quieter and is tried once more. A real
         failure prints its checks and is never retried. */
      var stillborn = !m && (secs < 5 || /ProtocolError|Target\.\w+ timed out/.test(out));
      if (stillborn && !retried[name]) {
        retried[name] = true;
        console.log('  ' + name + ' never started (' + secs + 's, no verdict) — retrying once');
        list.push(name);
        running--;
        launch();
        return;
      }
      results.push({ name: name + (retried[name] ? ' *' : ''), code, secs,
                     passed: m ? +m[1] : 0, failed: m ? +m[2] : null });
      console.log('\n' + '─'.repeat(64));
      console.log('  ' + name + '  —  ' + secs + 's'
        + (m ? '  ' + m[1] + ' passed, ' + m[2] + ' failed'
             : '  DID NOT REPORT (exit ' + code + ')'));
      console.log('─'.repeat(64));
      process.stdout.write(out.replace(/^/gm, '  '));
      running--;
      launch();
      if (!running && next >= list.length) done();
    });
  }
}

function done() {
  const secs = Math.round((Date.now() - started) / 100) / 10;
  const bad = results.filter(r => r.code !== 0 || r.failed === null || r.failed > 0);
  const checks = results.reduce((n, r) => n + r.passed, 0);
  console.log('\n' + '═'.repeat(64));
  results.sort((a, b) => b.secs - a.secs).forEach(r => {
    console.log('  ' + r.name.padEnd(11) + String(r.secs).padStart(6) + 's  '
      + (r.failed === null ? 'DID NOT REPORT'
         : r.passed + ' passed, ' + r.failed + ' failed'));
  });
  console.log('─'.repeat(64));
  const late = results.filter(r => / \*$/.test(r.name)).length;
  console.log('  ' + checks + ' checks across ' + results.length + ' scripts, '
    + JOBS + ' at a time, in ' + secs + 's'
    + (late ? '  (* ' + late + ' retried after failing to start)' : '')
    + (bad.length ? '  —  ' + bad.length + ' SCRIPT(S) FAILED' : '  —  all passing'));
  console.log('═'.repeat(64));
  process.exit(bad.length);
}

console.log('Running ' + list.length + ' scripts, ' + JOBS + ' at a time.');
launch();
