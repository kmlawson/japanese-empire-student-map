/* The ferries, and whether any of them is drawn over land.
 *
 *     node tools/test/ferries.js           # needs a server on 8123
 *
 * The 1938 timetable connects Korea to Japan by four crossings, and they are
 * the one part of this network that is water rather than track: 關釜 between
 * Shimonoseki and Pusan, 青函 across the Tsugaru strait, 關門 across the
 * Kanmon, and the 長項—群山 ferry over the Kum estuary. A crossing drawn as a
 * straight line can run over a headland or an island, and the reader would be
 * looking at a boat sailing across a mountain.
 *
 * Measured rather than assumed. The land is the map's own — `gis/land.geojson`
 * is what it draws — and each crossing is sampled along its drawn geometry and
 * every sample tested against it.
 *
 * **What the measurement found, and why there is no routing.** Not one sample
 * of 關釜 or 青函 is over land: the Shimonoseki–Pusan line passes 34.95 N at
 * Tsushima's longitude, which is north of the island, and the Tsugaru crossing
 * has open water the whole way. 關門 and 長項—群山 *are* mostly over land, and
 * cannot be otherwise: at 5.1 km and 3.6 km they are narrower than the
 * coastline's own drawn resolution, which closes both, so there is no water
 * there to route through. They are named below with that reason rather than
 * silently skipped, and the test fails if a new crossing appears that nobody
 * has thought about.
 */
'use strict';
const { sleep, ready, check, report, SHIM, launch, HOST } = require('./suite.js');
const BASE = process.env.MAP_URL || HOST + '/index.html';

/* The crossings whose middle is over land because the map has no water there.
   Keyed by the line's own name, with how wide the strait actually is. */
const NARROWER_THAN_THE_COASTLINE = {
  '關門連絡船': 'the Kanmon strait is 700 m wide and the drawn coast closes it',
  '長項—群山 連絡線': 'the Kum estuary is closed by the drawn coast',
};

const flip = async (p, id, on) => {
  await p.evaluate((sel, v) => {
    const b = document.querySelector(sel);
    if (b && b.checked !== v) {
      b.checked = v;
      b.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, id, on);
};

(async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage();
    await p.evaluateOnNewDocument(SHIM);
    await p.setViewport({ width: 1200, height: 900 });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto(BASE + '?where=125,33.5,132,38.5', { waitUntil: 'domcontentloaded' });
    await ready(p);
    await p.evaluate(() => document.querySelectorAll('dialog[open]')
      .forEach(d => d.close()));
    await flip(p, '#opt-kr-rail', true);
    await sleep(1600);
    await flip(p, '#opt-train-tools', true);
    await sleep(8000);
    await flip(p, '#train-conn', true);
    await sleep(2500);

    const land = await p.evaluate(async () => {
      const r = await fetch('gis/land.geojson');
      return r.json();
    });

    const got = await p.evaluate(async (landDoc) => {
      /* The land, as polygons with their holes, near the crossings. */
      const BOX = [125.0, 32.0, 143.0, 43.0];
      const polys = [];
      for (const f of landDoc.features) {
        const g = f.geometry;
        const ps = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
        for (const poly of ps) {
          const outer = poly[0];
          let w = 1e9, s = 1e9, e = -1e9, n = -1e9;
          for (const c of outer) {
            if (c[0] < w) w = c[0];
            if (c[0] > e) e = c[0];
            if (c[1] < s) s = c[1];
            if (c[1] > n) n = c[1];
          }
          if (e < BOX[0] || w > BOX[2] || n < BOX[1] || s > BOX[3]) continue;
          polys.push(poly);
        }
      }
      const inRing = (x, y, ring) => {
        let inside = false;
        for (let i = 0; i + 1 < ring.length; i++) {
          const x0 = ring[i][0], y0 = ring[i][1];
          const x1 = ring[i + 1][0], y1 = ring[i + 1][1];
          if ((y0 > y) !== (y1 > y)) {
            const t = (y - y0) / (y1 - y0);
            if (x < x0 + t * (x1 - x0)) inside = !inside;
          }
        }
        return inside;
      };
      const onLand = (x, y) => {
        for (const poly of polys) {
          if (!inRing(x, y, poly[0])) continue;
          let hole = false;
          for (let h = 1; h < poly.length; h++) {
            if (inRing(x, y, poly[h])) { hole = true; break; }
          }
          if (!hole) return true;
        }
        return false;
      };

      const d = JMAP.KR_TRAINS;
      const out = [];
      d.lines.forEach((line, li) => {
        if (!/連絡(船|線)$/.test(line.n)) return;
        // the drawn geometry of every stretch of this ferry
        const legs = [];
        Object.keys(d.paths).forEach(key => {
          const [a, b] = key.split('|').map(Number);
          const sa = d.stations[a], sb = d.stations[b];
          const shared = (sa.li || []).filter(x => (sb.li || []).indexOf(x) >= 0);
          if (shared.indexOf(li) < 0) return;
          legs.push(d.paths[key]);
        });
        /* Sampled every 500 m along the whole crossing, and each sample kept
           with how far along it is. The distance matters: a ferry leaves a
           harbour and enters another, and the drawn line runs from station to
           station, so the first and last kilometres are over land in every
           case and always will be. What must be open water is the middle. */
        let km = 0;
        const marks = [];
        legs.forEach(flat => {
          for (let i = 0; i + 3 < flat.length; i += 2) {
            const x0 = flat[i], y0 = flat[i + 1];
            const x1 = flat[i + 2], y1 = flat[i + 3];
            const dx = (x1 - x0) * Math.cos((y0 + y1) / 2 * Math.PI / 180);
            const seg = Math.hypot(dx, y1 - y0) * 111.32;
            const n = Math.max(2, Math.round(seg / 0.5));
            for (let j = 0; j < n; j++) {
              const t = j / n;
              marks.push({ at: km + seg * t,
                           land: onLand(x0 + (x1 - x0) * t,
                                        y0 + (y1 - y0) * t) });
            }
            km += seg;
          }
        });
        /* **APPROACH_KM either end.** Shimonoseki station is 1.4 km from the
           pier and Aomori's about the same, and the harbours themselves read
           as land at the scale the coast is drawn. Four kilometres covers the
           approach at both ends of all four crossings and is far less than the
           narrowest thing a ferry could wrongly be drawn across. */
        const APPROACH_KM = 4;
        const mid = marks.filter(m => m.at > APPROACH_KM && m.at < km - APPROACH_KM);
        const bad = mid.filter(m => m.land);
        out.push({ name: line.n, legs: legs.length, km: Math.round(km * 10) / 10,
                   samples: mid.length, ashore: bad.length,
                   ends: marks.filter(m => m.land).length - bad.length,
                   where: bad.slice(0, 6).map(m => Math.round(m.at) + ' km') });
      });
      return out;
    }, land);

    check('all four ferries are in the network', got.length === 4,
          got.map(f => f.name).join(', '));
    check('and every one of them has a crossing drawn',
          got.every(f => f.legs > 0 && f.km > 0),
          got.filter(f => !f.legs).map(f => f.name).join(',') || 'all drawn');

    /* The Kanpu ferry is the one this whole network reaches Japan by, and it
       was drawn as nothing at all: 釜山 is in these tables twice and the
       Japanese pages carry no coordinate for it. */
    const kanpu = got.find(f => f.name === '關釜連絡船');
    check('the Kanpu ferry crosses to Pusan, not to nowhere',
          !!kanpu && kanpu.km > 180 && kanpu.km < 260,
          kanpu ? kanpu.km + ' km' : 'missing');

    got.forEach(f => {
      const excuse = NARROWER_THAN_THE_COASTLINE[f.name];
      if (excuse) {
        /* Nothing to assert about the middle: at this length there is no
           middle clear of the approaches. It is named so that the count below
           is a count of crossings somebody has thought about. */
        check('  ' + f.name + ' is shorter than the coastline it crosses',
              f.km < 2 * 4 + 1, excuse + ' (' + f.km + ' km)');
        return;
      }
      check('  ' + f.name + ' is over open water clear of its two harbours',
            f.ashore === 0,
            f.ashore + ' of ' + f.samples + ' mid-crossing samples ashore'
            + (f.where.length ? ' at ' + f.where.join(', ') : '')
            + ' -- ' + f.km + ' km, ' + f.ends + ' ashore in the approaches');
    });

    check('no page errors', errs.length === 0, errs.join(' | '));
  } finally {
    await browser.close();
  }
  report('ferries');
})();
