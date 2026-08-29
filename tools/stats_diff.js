#!/usr/bin/env node
/* Every version's stats side by side, and what moved.
 *
 *     node tools/stats_diff.js           # all of them
 *     node tools/stats_diff.js 218 220   # two of them
 *
 * A number on its own says nothing. This is the part that makes the folder
 * worth keeping: it puts the runs in a row so a regression is visible as a
 * step rather than as a feeling.
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'stats');

const files = fs.readdirSync(DIR).filter(f => /^\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));
const want = process.argv.slice(2).filter(a => /^\d+$/.test(a));
const runs = files
  .filter(f => !want.length || want.indexOf(String(parseInt(f))) >= 0)
  .map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));

if (!runs.length) { console.error('no stats in stats/'); process.exit(1); }

const pad = (v, n) => String(v).padStart(n);
const lpad = (v, n) => String(v).padEnd(n);
const head = ['', ...runs.map(r => 'u' + r.version)];

function table(title, rows) {
  console.log('\n' + title);
  console.log('  ' + lpad(head[0], 30) + head.slice(1).map(h => pad(h, 10)).join(''));
  rows.forEach(([label, get, fmt]) => {
    const vals = runs.map(r => { try { return get(r); } catch (e) { return null; } });
    console.log('  ' + lpad(label, 30)
      + vals.map(v => pad(v == null ? '-' : (fmt ? fmt(v) : v), 10)).join(''));
  });
}

const kb = v => (v / 1024).toFixed(0);
table('WEIGHT', [
  ['first paint needs (KB)', r => r.files['_first paint needs'], kb],
  ['map.js (KB)', r => r.files['map.js'], kb],
  ['data.js (KB)', r => r.files['data.js'], kb],
  ['japan-empire-map.svg (KB)', r => r.files['japan-empire-map.svg'], kb],
  ['...-admin.svg (KB)', r => r.files['japan-empire-map-admin.svg'], kb],
  ['...-fine.svg (KB)', r => r.files['japan-empire-map-fine.svg'], kb],
  ['kr-stations.js (KB)', r => r.files['kr-stations.js'], kb],
  ['tw-stations.js (KB)', r => r.files['tw-stations.js'], kb],
]);
table('OPENING', [
  ['ready (ms)', r => r.readyMs],
  ['DOM nodes', r => r.opening.nodes],
  ['SVG paths', r => r.opening.svgPaths],
]);
for (const view of ['world', 'region', 'island', 'local']) {
  table('PANNING AT ' + view.toUpperCase() + '  (busy% is scripting only —'
        + ' headless does not time paint)', [
    ['busy% bare', r => r.views[view].bare.busyPct],
    ['busy% with layers', r => r.views[view].withLayers.busyPct],
    ['label share of busy%', r => r.views[view].withLayers.labelSharePct],
    ['labels drawn on screen', r => r.views[view].withLayers.labels],
    ['labels lettered in all', r => r.views[view].withLayers.lettered],
    ['DOM nodes with layers', r => r.views[view].withLayers.nodes],
    ['heap MB with layers', r => r.views[view].withLayers.heapMB],
  ]);
}
console.log('');
