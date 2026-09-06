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
const fs = require('fs');

/* ---------------------------------------------------------------------
 * HOW LONG THIS TAKES, REMEMBERED
 *
 * Every run appends what it was and how long it took to `runs.jsonl`, and
 * every run prints what the last one of the same shape cost before it starts.
 * The point is that nobody — reader, author or assistant — should have to
 * guess whether a check is thirty seconds or six minutes away, and a guess is
 * what it was: the SECS table had drifted so far that `stations` was listed at
 * 65 seconds and took 147.
 *
 * Keyed by the *scripts*, sorted, not by the words typed: `changed` means a
 * different run every day, and two selections that come to the same list
 * should share a memory. The label is kept beside it for reading.
 */
const RUNS = path.join(__dirname, 'runs.jsonl');

function runKey(list) { return list.slice().sort().join(','); }

function pastRuns(key) {
  try {
    return fs.readFileSync(RUNS, 'utf8').split('\n')
      .filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } })
      .filter(r => r && r.key === key);
  } catch (e) { return []; }
}

function noteRun(rec) {
  try { fs.appendFileSync(RUNS, JSON.stringify(rec) + '\n'); } catch (e) { /* a log is not the job */ }
}

/* **Every script this suite knows about.** A file dropped into `tools/test/`
   is not run by anything until its name is here: `airplay` and `clipping` were
   both written, both passing, and both silently absent from the full sweep,
   which reported 53 scripts and all-passing while running neither. Add the
   name here and its measured seconds to `SECS` below. */
const MAP = ['taiwan', 'labels', 'provsource', 'backings', 'mapstrip',
             'projclip', 'extent', 'layers-url', 'bookmarks', 'cache-keys',
             'relief', 'mono', 'names', 'labuan', 'pin', 'stations', 'zoom', 'colours',
             'trains', 'korea', 'population', 'demography', 'sugar', 'epoch', 'taiwanpop', 'keys',
             'labelcats', 'legendpick', 'subnames', 'japanpop', 'theme', 'twpop1930', 'manchupop', 'routes', 'pointsize', 'islands', 'menu', 'air', 'airplay',
             'clipping', 'layerinfo', 'krtrains', 'layerfind', 'beta', 'hanlabels'];
const ANN = ['run', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7',
             'run8', 'run9', 'run10', 'run11', 'run12', 'run13', 'run14',
             'run15'];

/* **A script nobody names is a script nobody runs.**
 *
 * `GROUPS` decides what `changed` picks; `MAP` and `ANN` above are what
 * *everything* means. The two are separate lists and they had drifted:
 * `krtrains` and `layerfind` were each added to a group and not to `MAP`, so
 * both ran when git said their subject had moved and neither ran in the full
 * suite before a release — which is the one run that is supposed to be
 * complete. Fifty-six scripts were reported where fifty-eight exist.
 *
 * So the lists are checked against the directory rather than trusted. Helpers
 * are named here because they are not scripts; anything else on disk that no
 * list mentions stops the run and says which. */
const HELPERS = ['all', 'settle', 'downloads', 'suite'];
(function orphanCheck() {
  const seen = {};
  MAP.concat(ANN).forEach(n => { seen[n] = true; });
  HELPERS.forEach(n => { seen[n] = true; });
  const orphans = [];
  [[__dirname, ''], [path.join(__dirname, 'annotations'), 'annotations/']]
    .forEach(([dir, pre]) => {
      let names = [];
      try { names = fs.readdirSync(dir); } catch (e) { return; }
      names.filter(f => f.endsWith('.js'))
        .map(f => f.replace(/\.js$/, ''))
        .forEach(n => { if (!seen[n]) orphans.push(pre + n); });
    });
  if (orphans.length) {
    console.error('\n  These test scripts are in neither MAP nor ANN, so "everything"'
                  + ' would not run them:\n    ' + orphans.join('\n    ')
                  + '\n  Add them to the lists at the top of all.js (and to a group'
                  + ' in GROUPS), or to HELPERS if they are not scripts.\n');
    process.exit(2);
  }
})();

const fileFor = n => /^run/.test(n)
  ? path.join(__dirname, 'annotations', n + '.js')
  : path.join(__dirname, n + '.js');

/* ---------------------------------------------------------------------
 * WHICH TESTS TO RUN, AND WHEN
 *
 * Six minutes is too long to spend on every change, and running everything
 * every time is a way of not deciding rather than a way of being careful. So
 * the scripts are grouped by *what they guard*, and `changed` picks the groups
 * from what git says has actually moved:
 *
 *     node tools/test/all.js changed     # the groups the diff implicates
 *     node tools/test/all.js core        # one group by name
 *     node tools/test/all.js map         # every map script
 *     node tools/test/all.js             # everything, map and annotations
 *
 * **The rule that keeps this honest: anything unrecognised runs everything.**
 * A new file, a rename, a tool nobody thought about — the tree does not get to
 * shrug. It only ever narrows on paths it has been taught, and the teaching is
 * in TRIGGERS below where it can be read and argued with.
 *
 * And `changed` is for the everyday loop. Before a release, run the lot.
 */

const GROUPS = {
  /* The map's own interaction — what a pointer, a key or a switch does. This
     is what `map.js` changes touch, and `map.js` changes hourly. */
  core: ['labels', 'labelcats', 'legendpick', 'subnames', 'mapstrip', 'keys',
         'theme', 'zoom', 'pin', 'labuan', 'epoch', 'mono', 'colours', 'extent',
         'names', 'clipping', 'layerfind', 'beta', 'hanlabels'],

  /* Everything drawn as a dot or read off one: the markers, the gazetteer,
     the sites table and the menu that hangs off a shape. */
  points: ['pointsize', 'islands', 'menu', 'routes'],

  /* The figures — `data/population/` and the cards, tables, choropleths and
     sentences built from them. A dataset added or edited touches these and
     little else, and there is no reason to spend six minutes finding out. */
  data: ['population', 'demography', 'japanpop', 'twpop1930', 'manchupop',
         'taiwanpop', 'korea', 'names', 'hanlabels'],

  /* The shapes themselves, and the sheets they are written to. These move when
     `build_map.py` runs, not when somebody edits behaviour. */
  geometry: ['backings', 'projclip', 'provsource', 'taiwan', 'korea', 'relief',
             'islands', 'mapstrip'],

  /* Railways, stations and the sugar lines. Four data files that change in
     bursts and then sit still for weeks. */
  transport: ['trains', 'krtrains', 'stations', 'sugar', 'air', 'airplay', 'layerinfo',
               'hanlabels'],

  /* What a link carries and what a reload remembers. */
  links: ['layers-url', 'bookmarks', 'cache-keys', 'layerinfo', 'beta', 'hanlabels'],

  ann: ANN,
};

/* Path → groups. First match wins; `null` means "this cannot break a test"
   and anything not matched at all means "run everything". Ordered most
   specific first. */
const TRIGGERS = [
  [/^tools\/test\//,               []],            // the tests themselves
  [/^docs\//,                       []],
  [/^reports\//,                    []],
  [/^gis\//,                        []],            // published exports
  [/^README|\.md$/,                 []],
  [/^\.gitignore$/,                  []],
  [/^texts\/version\.csv$/,         []],        // the update number
  [/^tools\/(?!test\/|build_)/,     []],        // the other build tools
  /* A generator, not a build step: it writes into `texts/` when somebody runs
     it, and editing it changes nothing the page loads until that happens and
     the output is committed — at which point the `texts/` rules apply. The
     `build_` prefix is held out of the line above so `build_texts` and
     `build_map` can have rules of their own, and this one needs saying. */
  [/^tools\/build_localnames\.py$/, []],
  /* The pre-war character tables. They are read by `build_texts.py` at build
     time and decide what the characters switch draws over Japan, so a change
     here reaches the labels and the cards. */
  [/^tools\/kyujitai\.py$/,          ['core', 'data']],
  [/^data\/(gazetteer|nikh-korea|ignored)\//, []],
  [/^stale\//,                       []],

  // the clipping guard walks its panes, so a pane's own code implicates it
  [/^annotate\.js$/,                ['ann', 'core']],
  [/^admin\.js$/,                   ['ann']],

  [/^data\/population\//,          ['data']],
  [/^texts\/(territories|pages)\//, ['data', 'core']],
  [/^texts\/sites/,                 ['points', 'core']],
  [/^texts\/sources-short\.csv$/,  ['points']],
  /* The gazetteer's names, notes and wiki links. It was the browse layer's own
     table and the catch-all below would have called it prose; the dots it
     feeds are `points`. */
  [/^texts\/city-names\.(csv|md)$/, ['points', 'data', 'core']],
  /* What a whole layer is, and what it is not: the "i" in the bottom corner.
     Prose and a row, not geometry — the only thing that reads it is the corner
     control, so it does not have to drag `core` along with it. */
  [/^texts\/layer-info\.(csv|md)$/, ['links', 'transport']],
  [/^texts\/.*\.csv$/,             ['data', 'core']],

  [/^cities-gaz\.js$/,              ['points']],
  [/^data\/cities/,                 ['points']],
  [/^data\/air\//,                  ['transport', 'points']],
  [/^(tw|kr)-(stations|trains)\.js$/, ['transport']],
  [/^tools\/build_(tw|kr)_trains\.py$/, ['transport']],
  [/^data\/(tw-1936|kr-1938)-timetable\//, []],   // vendored; the build reads it
  [/^timetable\//,                 ['transport']],
  [/^trains\.js$/,                  ['transport']],
  // the air player: its own module, fetched when the tools are asked for
  [/^air-play\.js$/,                ['transport']],
  [/^relief\.js$/,                  ['geometry']],

  [/\.svg$/,                        ['geometry', 'core']],
  [/^tools\/build_map\.py$/,       ['geometry', 'core']],
  [/^tools\/build_texts\.py$/,     ['data', 'core', 'points']],
  [/^tools\/texts_lib\.py$/,       ['data', 'core', 'points']],
  [/^tools\/build_cities\.py$/,    ['points']],

  /* `map.js` is the map. It cannot be narrowed to one group and it is not
     pretended otherwise — but it does not touch the relief raster, the railway
     data or the annotation pane, and those are the three most expensive things
     in the suite. */
  [/^map\.js$/,                     ['core', 'points', 'links', 'data']],
  [/^styles\.css$/,                 ['core', 'points']],
  [/^data\.js$/,                    ['core', 'points', 'data']],
  [/^index\.html$/,                 ['core', 'links']],
  [/^sources\.html$/,               []],
];

function changedFiles() {
  const { execSync } = require('child_process');
  const run = c => { try { return execSync(c, { encoding: 'utf8' }); }
                     catch (e) { return ''; } };
  const out = run('git diff --name-only HEAD')
            + run('git ls-files --others --exclude-standard');
  return [...new Set(out.split('\n').map(s => s.trim()).filter(Boolean))];
}

/* The tree itself. Returns the scripts to run and the reasoning, so the run
   can print why it chose them — a decision nobody can see is a decision
   nobody will trust. */
function chooseFor(files) {
  if (!files.length) return { list: [], why: ['nothing has changed'] };
  const want = new Set(), why = [];
  const ALL = MAP.concat(ANN);
  for (const f of files) {
    /* A test that has itself been edited is run, whatever it guards. The
       trigger table says `tools/test/` touches no product code, which is true
       and is not the whole answer: an edited check that has never been run is
       exactly as useful as no check. */
    const own = /^tools\/test\/(?:annotations\/)?([a-z0-9-]+)\.js$/.exec(f);
    if (own && ALL.indexOf(own[1]) >= 0) {
      want.add('#' + own[1]);
      why.push(f + ' → itself');
      continue;
    }
    const hit = TRIGGERS.find(([re]) => re.test(f));
    if (!hit) {
      why.push(f + ' → not recognised, so everything runs');
      return { list: MAP.concat(ANN), why };
    }
    if (!hit[1].length) continue;
    hit[1].forEach(g => want.add(g));
    why.push(f + ' → ' + hit[1].join(', '));
  }
  if (!want.size) return { list: [], why: why.concat(['nothing a test can see']) };
  const list = [];
  want.forEach(g => {
    if (g.charAt(0) === '#') {                      // one named script
      if (list.indexOf(g.slice(1)) < 0) list.push(g.slice(1));
      return;
    }
    (GROUPS[g] || []).forEach(n => { if (list.indexOf(n) < 0) list.push(n); });
  });
  return { list, why, groups: [...want].filter(g => g.charAt(0) !== '#') };
}

const DATA = GROUPS.data;

/* Flags are taken out before the names are read, so `--dry` works with any
   selection and a stray flag is never mistaken for a script. That is how
   `all.js data --dry` came to report two scripts named `data` and `--dry`
   which "never started". */
const argv = process.argv.slice(2);
const dry = argv.some(a => a === '--dry' || a === '-n');
const pick = argv.filter(a => a.charAt(0) !== '-');
let list;
if (!pick.length) list = MAP.concat(ANN);
else if (pick.length === 1 && pick[0] === 'map') list = MAP;
else if (pick.length === 1 && pick[0] === 'ann') list = ANN;
else if (pick.length === 1 && pick[0] === 'changed') {
  const files = changedFiles();
  const got = chooseFor(files);
  console.log('\n  ' + files.length + ' file(s) changed:');
  got.why.forEach(w => console.log('    ' + w));
  if (got.groups) console.log('  groups: ' + got.groups.sort().join(', '));
  if (!got.list.length) {
    console.log('\n  nothing to run.\n');
    process.exit(0);
  }
  list = got.list;
} else if (pick.length === 1 && GROUPS[pick[0]]) list = GROUPS[pick[0]];
else list = pick.map(a => (/^\d+$/.test(a) ? 'run' + (a === '1' ? '' : a) : a));

/* Longest first, so the tail of the run is short jobs filling the gaps rather
   than one 45-second script the other three workers wait out. Names not in the
   table go last: an unknown script is usually a new one, and a new one is
   usually quick. */
/* Measured, not guessed, and re-measured when it drifts. The runner sorts
   longest-first so the tail of a run is short jobs rather than long ones —
   which only works if the numbers are true. They had gone badly stale:
   `stations` was down as 65 seconds and takes 147, `relief` as 60 and takes
   140, `layers-url` as 18 and takes 70. All three were being scheduled near
   the *back*, so a run ended with its longest scripts and three idle
   workers. Regenerate from a full run's own per-script line. */
const SECS = { stations: 147, relief: 140, demography: 95, population: 71, 'layers-url': 70, names: 62, mapstrip: 56, trains: 54, krtrains: 40, japanpop: 44, theme: 40, labels: 40, subnames: 37, labelcats: 35, routes: 34, sugar: 33, twpop1930: 33, pin: 31, epoch: 29, mono: 27, colours: 26, extent: 26, islands: 25, manchupop: 25, keys: 24, legendpick: 22, labuan: 22, provsource: 19, bookmarks: 16, 'cache-keys': 15, backings: 15, taiwan: 15, korea: 14, zoom: 13, menu: 13, pointsize: 11, projclip: 11, taiwanpop: 7, beta: 22, hanlabels: 108, air: 66, airplay: 78, clipping: 24, layerinfo: 22,
               run2: 41, run15: 40, run5: 35, run14: 32, run: 19, run3: 28, run9: 30, run10: 25, run11: 24, run12: 19, run8: 19, run13: 18, run4: 17, run6: 12, run7: 5 };
list = list.slice().sort((a, b) => (SECS[b] || 0) - (SECS[a] || 0));

const KEY = runKey(list);
const PAST = pastRuns(KEY);
if (PAST.length) {
  const last = PAST[PAST.length - 1];
  const avg = Math.round(PAST.reduce((a, r) => a + r.secs, 0) / PAST.length);
  console.log('\n  last time this set ran it took ' + last.secs + 's'
    + (PAST.length > 1 ? ' (' + PAST.length + ' runs, average ' + avg + 's)' : '')
    + (last.failed ? ' and something failed' : ''));
}

if (dry) {
  const secs = list.reduce((a, n) => a + (SECS[n] || 0), 0);
  console.log('\n  would run ' + list.length + ' script(s), about '
              + Math.round(secs / 4) + 's at four at a time:');
  console.log('    ' + list.join(' ') + '\n');
  process.exit(0);
}

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
  noteRun({
    at: new Date().toISOString(),
    label: pick.length ? pick.join(' ') : 'all',
    key: KEY,
    scripts: results.length,
    checks: checks,
    secs: Number(secs),
    jobs: JOBS,
    failed: bad.length,
  });
  process.exit(bad.length);
}

console.log('Running ' + list.length + ' scripts, ' + JOBS + ' at a time.');
launch();
