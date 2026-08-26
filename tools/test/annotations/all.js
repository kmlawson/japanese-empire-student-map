#!/usr/bin/env node
/* Run the whole annotation suite, several scripts at a time.
 *
 *     python3 -m http.server 8123 &
 *     node tools/test/annotations/all.js          # all of them
 *     node tools/test/annotations/all.js 8 9 11   # only these
 *     JOBS=2 node tools/test/annotations/all.js   # narrower, on a small machine
 *
 * The scripts are independent — each drives its own browser and its own pages,
 * and nothing is shared but the static server — so there is no reason to run
 * them one after another beyond the order they were written in. Run in
 * parallel they finish in about the time the longest one takes.
 *
 * Output is buffered per script and printed whole when that script ends, so
 * eleven interleaved streams do not become one unreadable one. The exit code
 * is the number of scripts that failed.
 */
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const SCRIPTS = ['run', 'run2', 'run3', 'run4', 'run5', 'run6',
                 'run7', 'run8', 'run9', 'run10', 'run11', 'run12', 'run13', 'run14'];

const pick = process.argv.slice(2);
const list = pick.length
  ? pick.map(a => (/^run/.test(a) ? a : 'run' + (a === '1' ? '' : a)))
  : SCRIPTS;

/* Each script drives a browser, and a browser is several processes. Half the
   cores, never fewer than two and never more than four: past that they queue
   on the machine rather than on each other, and a test that is starved of CPU
   starts failing on timing rather than on truth. */
const JOBS = Math.max(2, Math.min(4,
  parseInt(process.env.JOBS, 10) || Math.floor((os.cpus().length || 4) / 2)));

const started = Date.now();
const results = [];
let next = 0, running = 0;

function launch() {
  while (running < JOBS && next < list.length) {
    const name = list[next++];
    running++;
    const t0 = Date.now();
    const file = path.join(__dirname, name + '.js');
    const child = spawn(process.execPath, [file], { env: process.env });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('close', code => {
      const secs = Math.round((Date.now() - t0) / 100) / 10;
      const m = out.match(/(\d+) passed, (\d+) failed/);
      results.push({ name, code, secs,
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
    console.log('  ' + r.name.padEnd(7) + String(r.secs).padStart(6) + 's  '
      + (r.failed === null ? 'DID NOT REPORT'
         : r.passed + ' passed, ' + r.failed + ' failed'));
  });
  console.log('─'.repeat(64));
  console.log('  ' + checks + ' checks across ' + results.length + ' scripts, '
    + JOBS + ' at a time, in ' + secs + 's'
    + (bad.length ? '  —  ' + bad.length + ' SCRIPT(S) FAILED' : '  —  all passing'));
  console.log('═'.repeat(64));
  process.exit(bad.length);
}

console.log('Running ' + list.length + ' scripts, ' + JOBS + ' at a time.');
launch();
