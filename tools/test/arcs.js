/* Are the boundaries two sub-units share drawn as one line?
 *
 *     node tools/test/arcs.js              # no server needed
 *     node tools/test/arcs.js siam india   # only these atoms
 *
 * Douglas-Peucker is not symmetric under direction or starting vertex, so a
 * border simplified once inside each of its two provinces yields two slightly
 * different polylines: slivers, overlaps, and a boundary that reads as two
 * lines a fraction of a unit apart. `arc_thin` in build_map.py exists to
 * prevent that, by simplifying each shared border once, and this script is
 * the proof: it reads the built SVGs — no browser, no server — and measures,
 * for each atom, how much of what should be one line actually is.
 *
 * Three measurements per atom and sheet:
 *
 *  - **pairing**: every interior edge should appear in exactly two
 *    sub-units, vertex for vertex. Counted undirected, at the precision the
 *    file was written at, because a coverage that pairs exactly cannot have
 *    a sliver anywhere — this is the strongest check and the cheapest.
 *  - **near misses**: edges with no exact twin but a segment of a different
 *    sub-unit within 0.6 units. These are the doubled lines the reader sees,
 *    and their median separation is how bad it looks. Cross-file borders
 *    (Bangkok's rim inside Siam) and narrow straits also land here, which is
 *    why a near miss is reported rather than failed on.
 *  - **the probe**: a quarter of a unit either side of every interior edge,
 *    counting how many sub-units the point falls inside. Exactly one is
 *    correct; two is an overlap; none is a gap — counted as such only when
 *    the point is inside the country's own backing, because a probe off a
 *    narrow strait lands in real sea and is not a defect.
 *
 * Atoms in ARC_DONE have been routed through `arc_thin` and are held to the
 * standard the unthinned Indochina set: zero overlaps, zero backed gaps.
 * The rest are reported, so that a layer whose divergence is measurable —
 * the reason to migrate it — is visible here rather than assumed.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { check, report } = require('./suite.js');

const ROOT = path.join(__dirname, '..', '..');

/* Migrated to arc_thin, and therefore asserted on. Grows a stage at a time —
   see ARC_TOPOLOGY in tools/build_map.py, which this list must mirror. */
const ARC_DONE = [];

/* Reported by default: the arc candidates, and the finely-thinned traced
   coverages whose divergence decides whether they are worth migrating. */
const DEFAULT_ATOMS = ['siam', 'philippines', 'dei', 'indochina', 'siamgain',
                       'taiwan', 'india', 'burma',
                       'nca_pacified', 'nca_unpacified'];

/* The 1942 sheet draws Indochina's divisions and the ceded territory side by
   side, and the Siem Reap seam ran between the two *atoms* — so the pair is
   also measured as one coverage, with owners kept apart by atom. */
const COMBINED = [['indochina', 'siamgain', 'e1942']];

/* ------------------------------------------------------------- parsing -- */

/* Both files are written one element to a line by build_map.py, so the parse
   is a line scan with a depth counter, not an XML parser. The admin file
   wraps each atom in <g data-for="…">; the main file in <g id="a-…">, which
   can hold a nested group (the occupied zone), hence the depth. */
function collect(file, groupRe) {
  const atoms = {};       // key -> [{prov, epoch, d, bare}]
  let cur = null, depth = 0;
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return atoms; }
  for (const line of text.split('\n')) {
    const g = line.match(groupRe);
    if (g) { cur = g[1]; depth = 1; continue; }
    if (cur) {
      if (line.includes('<g')) depth++;
      if (line.includes('</g>')) { depth--; if (depth <= 0) cur = null; continue; }
      const d = line.match(/ d="([^"]+)"/);
      if (!d || !line.includes('<path')) continue;
      const cls = (line.match(/class="([^"]*)"/) || [, ''])[1];
      /* shu outlines deliberately retrace the districts under them, and the
         occupied coast is a stroke, not a sub-unit */
      if (/\b(shu|coast|whole-edge)\b/.test(cls)) continue;
      const prov = (line.match(/data-prov="([^"]*)"/) || [, ''])[1];
      const epoch = (line.match(/data-epoch="([^"]*)"/) || [, ''])[1];
      (atoms[cur] = atoms[cur] || []).push({ prov, epoch, d: d[1] });
    }
  }
  return atoms;
}

function backingsOf(file) {
  const out = {};
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return out; }
  for (const line of text.split('\n')) {
    if (!/class="whole[" ]/.test(line)) continue;
    const m = line.match(/data-for="([^"]+)"[^>]* d="([^"]+)"/);
    if (m) out[m[1]] = rings(m[2]);
  }
  return out;
}

function rings(d) {
  const out = [];
  for (const sub of d.split(/[MZ]/)) {
    const nums = sub.match(/-?\d+\.?\d*/g);
    if (!nums || nums.length < 6) continue;
    const r = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      r.push([parseFloat(nums[i]), parseFloat(nums[i + 1])]);
    }
    out.push(r);
  }
  return out;
}

/* --------------------------------------------------------- geometry ----- */

const vkey = p => p[0].toFixed(3) + ',' + p[1].toFixed(3);
const ekey = (a, b) => { const ka = vkey(a), kb = vkey(b);
  return ka < kb ? ka + '|' + kb : kb + '|' + ka; };

function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const n = dx * dx + dy * dy;
  let t = n ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / n : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function inRings(p, rs) {
  let inside = false;
  for (const r of rs) {
    const n = r.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > p[1]) !== (yj > p[1]) &&
          p[0] < xi + (p[1] - yi) * (xj - xi) / (yj - yi)) inside = !inside;
    }
  }
  return inside;
}

/* ------------------------------------------------------------ analysis -- */

/* owners: [{name, rings}] for one atom (or pair of atoms) on one sheet. */
function analyse(owners, backing) {
  const edges = new Map();       // ekey -> {a, b, owners:Set}
  let verts = 0;
  owners.forEach((o, oi) => {
    for (const r of o.rings) {
      verts += r.length;
      for (let i = 0; i < r.length; i++) {
        const a = r[i], b = r[(i + 1) % r.length];
        const k = ekey(a, b);
        if (k.split('|')[0] === k.split('|')[1]) continue;
        let e = edges.get(k);
        if (!e) { e = { a, b, owners: new Set() }; edges.set(k, e); }
        e.owners.add(oi);
      }
    }
  });

  /* owner bounding boxes, for the membership probe */
  const boxes = owners.map(o => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of o.rings) for (const [x, y] of r) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
  });
  const members = p => {
    let n = 0;
    owners.forEach((o, oi) => {
      const bb = boxes[oi];
      if (p[0] < bb[0] || p[0] > bb[2] || p[1] < bb[1] || p[1] > bb[3]) return;
      if (inRings(p, o.rings)) n++;
    });
    return n;
  };

  /* near misses: unpaired edges of different owners within 0.6 units */
  const CELL = 1.0;
  const grid = new Map();
  const unpaired = [];
  for (const e of edges.values()) {
    if (e.owners.size >= 2) continue;
    const m = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    const ck = Math.floor(m[0] / CELL) + ',' + Math.floor(m[1] / CELL);
    (grid.get(ck) || grid.set(ck, []).get(ck)).push({ e, m });
    unpaired.push({ e, m });
  }
  const seps = [];
  const nearEdges = [];
  for (const u of unpaired) {
    const cx = Math.floor(u.m[0] / CELL), cy = Math.floor(u.m[1] / CELL);
    let best = Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const v of grid.get((cx + dx) + ',' + (cy + dy)) || []) {
        if ([...v.e.owners][0] === [...u.e.owners][0]) continue;
        const d = segDist(u.m, v.e.a, v.e.b);
        if (d < best) best = d;
      }
    }
    if (best < 0.6) { seps.push(best); nearEdges.push(u); }
  }
  seps.sort((a, b) => a - b);

  /* the probe, a quarter unit either side. Gaps are counted separately for
     paired and near-miss edges: a gap beside an edge both sub-units carry
     identically is a genuine hole in the coverage, while a gap beside a near
     miss is usually a river between two banks, or a border another source
     drew differently — real, but not something one-line simplification can
     ever fix, so not something to fail on. */
  let overlaps = 0, gapsPaired = 0, gapsNear = 0, seaGaps = 0, probes = 0;
  const probeEdge = (e, pairedEdge) => {
    const dx = e.b[0] - e.a[0], dy = e.b[1] - e.a[1];
    const L = Math.hypot(dx, dy);
    if (!L) return;
    const m = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    for (const s of [1, -1]) {
      const p = [m[0] - s * 0.25 * dy / L, m[1] + s * 0.25 * dx / L];
      const n = members(p);
      probes++;
      if (n >= 2) overlaps++;
      else if (n === 0) {
        if (!backing || backing.some(b => inRings(p, b))) {
          if (pairedEdge) gapsPaired++; else gapsNear++;
        } else seaGaps++;
      }
    }
  };
  let paired = 0;
  for (const e of edges.values()) {
    if (e.owners.size >= 2) { paired++; probeEdge(e, true); }
  }
  for (const u of nearEdges) probeEdge(u.e, false);

  return {
    owners: owners.length, verts,
    edges: edges.size, paired, near: nearEdges.length,
    sepMedian: seps.length ? seps[Math.floor(seps.length / 2)] : 0,
    sepMax: seps.length ? seps[seps.length - 1] : 0,
    probes, overlaps, gapsPaired, gapsNear, seaGaps,
    bytes: owners.reduce((a, o) => a + o.bytes, 0),
  };
}

/* --------------------------------------------------------------- main -- */

const admin = collect(path.join(ROOT, 'deploy', 'japan-empire-map-admin.svg'),
                      /<g data-for="([^"]+)">/);
const main = collect(path.join(ROOT, 'deploy', 'japan-empire-map.svg'),
                     /<g id="a-([^"]+)"/);
const backs = backingsOf(path.join(ROOT, 'deploy', 'japan-empire-map.svg'));

const wanted = process.argv.slice(2);
const atoms = wanted.length ? wanted : DEFAULT_ATOMS;

function ownersFor(key, epoch) {
  const paths = (admin[key] || []).concat(main[key] || []);
  const byName = new Map();
  paths.forEach((p, i) => {
    if (p.epoch && epoch && p.epoch !== epoch) return;
    if (p.epoch && !epoch) return;      // epoch-gated blocks need a sheet
    const name = key + ':' + (p.prov || ('#' + i));
    let o = byName.get(name);
    if (!o) { o = { name, rings: [], bytes: 0 }; byName.set(name, o); }
    o.rings.push(...rings(p.d));
    o.bytes += p.d.length;
  });
  return [...byName.values()];
}

function sheetsOf(key) {
  const paths = (admin[key] || []).concat(main[key] || []);
  const eps = new Set(paths.map(p => p.epoch).filter(Boolean));
  return eps.size ? [...eps].sort() : [''];
}

const row = (label, r) =>
  console.log('  ' + label.padEnd(28)
    + `${r.owners} units, ${r.verts} verts, ${(r.bytes / 1024).toFixed(0)} KB; `
    + `${r.paired} paired, ${r.near} near (median ${r.sepMedian.toFixed(3)}, `
    + `max ${r.sepMax.toFixed(3)}); probe ${r.probes}: `
    + `${r.overlaps} overlap, ${r.gapsPaired} gap at paired, `
    + `${r.gapsNear} at near, ${r.seaGaps} at sea`);

for (const key of atoms) {
  const sheets = sheetsOf(key);
  for (const ep of sheets) {
    const owners = ownersFor(key, ep);
    if (!owners.length) { console.log('  ' + key + ': no sub-unit blocks'); continue; }
    const r = analyse(owners, backs[key] ? [backs[key]] : null);
    row(key + (ep ? '@' + ep : ''), r);
    if (ARC_DONE.includes(key)) {
      check(key + (ep ? '@' + ep : '') + ': no overlaps', r.overlaps === 0,
            r.overlaps + ' probes in two sub-units');
      if (backs[key]) {
        check(key + (ep ? '@' + ep : '') + ': no gaps at paired edges',
              r.gapsPaired === 0, r.gapsPaired + ' probes in none');
      }
    }
  }
}

for (const [a, b, ep] of COMBINED) {
  const owners = ownersFor(a, ep).concat(ownersFor(b, ep));
  if (!owners.length) continue;
  const bl = [backs[a], backs[b]].filter(Boolean);
  const r = analyse(owners, bl.length ? bl : null);
  row(a + '+' + b + '@' + ep, r);
  if (ARC_DONE.includes(a) && ARC_DONE.includes(b)) {
    check(a + '+' + b + ': no overlaps across the pair', r.overlaps === 0,
          r.overlaps + ' probes in two sub-units');
  }
}

check('the built sheets were found and parsed',
      Object.keys(admin).length > 0 && Object.keys(main).length > 0,
      Object.keys(admin).length + ' admin atoms, ' + Object.keys(main).length + ' main');

process.exit(report());
