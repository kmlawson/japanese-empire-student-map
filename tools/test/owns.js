/* The built `owns` must equal the derived `owns`, for all three networks.
 *
 *     node tools/test/owns.js          # no server needed
 *
 * WHY THIS EXISTS.
 *
 * Which line owns a stretch of track — and therefore what colour that stretch
 * is drawn in — used to be worked out at mount time by `buildLines` walking
 * every stop of every train. That made the *drawing* depend on the timetable,
 * so the 455 KB Korean timetable had to arrive before a line of track could be
 * coloured. tools/trains_split.py computes it at build time instead.
 *
 * Which leaves the rule stated twice, in two languages. A drift between them
 * would not crash and would not fail any other test: it would give one stretch
 * of track out of eight hundred to the wrong line, which is a slightly wrong
 * colour that nobody would ever report. So it is checked directly, against the
 * original derivation itself rather than against a third copy of the rule —
 * `deriveOwns` is exposed on the module for this and for nothing else.
 *
 * Two things this would catch that nothing else would:
 *   * the tie-break. JavaScript walks an object's integer-like keys in
 *     ascending numeric order and keeps the first strict maximum, so a stretch
 *     two lines ran equally often goes to the lower index. Python dictionaries
 *     keep insertion order, which is the order the trains happened to be in.
 *   * the chain break. A stop flagged 1 is timed on another line's table and
 *     ends the run; a station with no coordinate is stepped over rather than
 *     stopped at. Korea has 520 of the latter.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const SITE = path.join(ROOT, 'deploy');

let failed = 0, passed = 0;
const check = (name, ok, detail) => {
  if (ok) { passed++; console.log('  ok   ' + name); }
  else { failed++; console.log('  FAIL ' + name + (detail ? '   ' + detail : '')); }
};

/* The module, run with a window that has nothing in it. The factory builds no
   DOM — every element is made inside `mount` — so this is enough to reach
   `deriveOwns`, and using the real module is the whole point. */
function loadModule() {
  const ctx = { window: {}, document: undefined, console };
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'trains.js'), 'utf8'), ctx,
                  { filename: 'trains.js' });
  if (typeof ctx.window.JMAP_TRAINS !== 'function') {
    throw new Error('trains.js did not define window.JMAP_TRAINS');
  }
  return ctx.window.JMAP_TRAINS({});
}

/* A built file, read back the way the browser would see it: the bundles are
   `JMAP.NAME = {...};` with a comment header, so the JSON is what lies between
   the first `= ` after the name and the final semicolon. */
function readBundle(file, varName) {
  const txt = fs.readFileSync(path.join(SITE, file), 'utf8');
  const at = txt.indexOf('JMAP.' + varName + ' = ');
  if (at < 0) throw new Error(file + ' does not assign JMAP.' + varName);
  const body = txt.slice(at + ('JMAP.' + varName + ' = ').length).trim();
  return JSON.parse(body.replace(/;\s*$/, ''));
}

const SYSTEMS = [
  ['Taiwan',   'tw-trains.js', 'TW_TRAINS', 'tw-times.js', 'TW_TIMES'],
  ['Korea',    'kr-trains.js', 'KR_TRAINS', 'kr-times.js', 'KR_TIMES'],
  ['Karafuto', 'kf-trains.js', 'KF_TRAINS', 'kf-times.js', 'KF_TIMES'],
];

const api = loadModule();
check('the module exposes deriveOwns', typeof api.deriveOwns === 'function');

for (const [name, geomFile, geomVar, timesFile, timesVar] of SYSTEMS) {
  const geom = readBundle(geomFile, geomVar);
  const times = readBundle(timesFile, timesVar);

  check(name + ': the geometry carries `owns` and not `trains`',
        !!geom.owns && geom.trains === undefined,
        'owns=' + (geom.owns ? Object.keys(geom.owns).length : 'missing')
        + ' trains=' + (geom.trains === undefined ? 'absent' : 'STILL THERE'));
  check(name + ': the timetable is an array of trains',
        Array.isArray(times) && times.length > 0 && !!times[0].st,
        'length=' + (Array.isArray(times) ? times.length : typeof times));

  const derived = api.deriveOwns({ stations: geom.stations, trains: times }).owns;
  const built = geom.owns;

  const bk = Object.keys(built).sort();
  const dk = Object.keys(derived).sort();
  const missing = dk.filter(k => !(k in built));
  const extra = bk.filter(k => !(k in derived));
  const wrong = dk.filter(k => k in built && built[k] !== derived[k]);

  check(name + ': every stretch the timetable makes is in the built `owns`',
        missing.length === 0,
        missing.length + ' missing, e.g. ' + missing.slice(0, 4).join(' '));
  check(name + ': the built `owns` invents no stretch',
        extra.length === 0,
        extra.length + ' extra, e.g. ' + extra.slice(0, 4).join(' '));
  check(name + ': every stretch goes to the same line in both',
        wrong.length === 0,
        wrong.length + ' differ, e.g. '
        + wrong.slice(0, 4).map(k => k + ' built=' + built[k] + ' derived=' + derived[k]).join('  '));
  console.log('       ' + name + ': ' + dk.length + ' stretches, '
              + times.length + ' trains, '
              + times.reduce((n, t) => n + t.st.length, 0) + ' stop rows');
}

/* THE TIE-BREAK, WHICH NO REAL NETWORK EXERCISES.
 *
 * Measured: of 1,063 stretches across the three timetables, 26 are run over by
 * more than one line and *none* of those is a tie — one line always ran more
 * trains than the other. So the rule that decides a tie is, on this data,
 * dead code in both languages, and the checks above would pass however the two
 * disagreed about it. Manchuria is four times the ground with lines that share
 * far more track, and it is exactly the sort of thing that would first appear
 * there as one stretch in the wrong colour.
 *
 * So it is put to both directly. Two lines, two trains each, over the same
 * three stations: a dead heat. JavaScript walks integer-like keys in ascending
 * numeric order and keeps the first strict maximum, so the stretch goes to the
 * lower line index — and tools/trains_split.py sorts its keys and uses a
 * strict `>` for the same reason. The trains are written with the HIGHER index
 * first, so an implementation that simply kept the last winner, or walked in
 * insertion order, would answer 1 here and fail.
 */
{
  const tie = {
    stations: [
      { n: 'A', lon: 120.0, lat: 24.0 },
      { n: 'B', lon: 120.1, lat: 24.0 },
      { n: 'C', lon: 120.2, lat: 24.0 },
    ],
    trains: [
      { li: 1, st: [[0, null, 100], [1, 110, 111], [2, 120, null]] },
      { li: 1, st: [[0, null, 200], [1, 210, 211], [2, 220, null]] },
      { li: 0, st: [[0, null, 300], [1, 310, 311], [2, 320, null]] },
      { li: 0, st: [[0, null, 400], [1, 410, 411], [2, 420, null]] },
    ],
  };
  const got = api.deriveOwns(tie).owns;
  check('a dead heat goes to the lower line index, not the last seen',
        got['0|1'] === 0 && got['1|2'] === 0, JSON.stringify(got));

  /* And the same case through the Python, so the two are compared rather than
     each being compared to my expectation of it. */
  const { execFileSync } = require('child_process');
  const py = execFileSync('python3', ['-c',
    'import json,sys; sys.path.insert(0, ' + JSON.stringify(path.join(ROOT, 'tools')) + ');'
    + ' import trains_split;'
    + ' d = json.loads(sys.stdin.read());'
    + ' owns, shared = trains_split.line_owns(d);'
    + ' print(json.dumps(owns))'],
    { input: JSON.stringify(tie), encoding: 'utf8' });
  const pyOwns = JSON.parse(py);
  check('and the Python agrees with the JavaScript on it',
        JSON.stringify(pyOwns) === JSON.stringify(got),
        'python=' + JSON.stringify(pyOwns) + ' js=' + JSON.stringify(got));

  /* The chain break, likewise put directly rather than trusted: a stop flagged
     1 is timed on another line's table and ends the run, so A-B and B-C are
     never joined through it. */
  const broken = {
    stations: tie.stations,
    trains: [{ li: 0, st: [[0, null, 100], [1, 110, 111, 1], [2, 120, null]] }],
  };
  const bo = api.deriveOwns(broken).owns;
  check('a stop timed on another line\'s table breaks the chain',
        Object.keys(bo).length === 0, JSON.stringify(bo));

  /* And a station with no coordinate is stepped over, not stopped at: A and C
     are joined across B. */
  const noCoord = {
    stations: [tie.stations[0], { n: 'B' }, tie.stations[2]],
    trains: [{ li: 0, st: [[0, null, 100], [1, 110, 111], [2, 120, null]] }],
  };
  const no = api.deriveOwns(noCoord).owns;
  check('a station with no coordinate is stepped over, joining across it',
        Object.keys(no).length === 1 && no['0|2'] === 0, JSON.stringify(no));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
