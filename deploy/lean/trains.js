























window.JMAP_TRAINS = function (host) {
  'use strict';

  var DAY = 1440;                      // minutes in the day the timetable runs
  var TRAIN_R = 3.4;                   // screen px: the radius of a train
  var TRAIN_RING = 1.1;                // screen px: its white ring
  var LINE_W = 3.8;                    // screen px: the coloured track













  var CASE_W = 5.6;                    // screen px: the pale halo under it
  var CASE_A = 0.85;












  var BRIDGE_KM = 15;
  var DEFAULT_MIN = 300;               // the day opens at 05:00, before the



  var cfg = null;                      // the system being shown, or null
  var data = null;








  var lineLayer = null;                // the coloured track, below the squares
  var markLayer = null;                // the trains, above them
  var trainGroup = null;
  var bar = null;                      // the control strip
  var els = {};
  var plans = [];                      // one per train that can be drawn
  var marks = [];                      // one per plan, made on first use
  var segCache = null;
  var inks = [];                       // the colour each line is drawn in
  var linePaths = [];                  // [{el, li}], so a recolour can find them
  var casePaths = [];                  // the halo under them
  var caseInk = '#fff';                // which way round the halo goes
  var chips = [];                      // the swatch in the bar, likewise
  var groundNow = '';                  // the land colour the inks were fitted to
  var lineGeom = [];                   // [{li, key, pts}] for hit testing
  var livePos = [];                    // where each train is now, in map units
  var byStation = null;                // our station id -> timetable index
  var byName = null;                   // the characters -> the station record
  var simMin = DEFAULT_MIN;







  var connOn = false;


  var moreWords = null;
  try { connOn = localStorage.getItem('jem-train-conn') === '1'; } catch (e) {}
  var playing = false;
  var raf = 0;
  var lastTs = 0;
  var lastK = 1;
  var shownClock = '';

  function two(n) { return (n < 10 ? '0' : '') + n; }


























  var NEAR = 62;            // sRGB distance at which two colours read as one
  var SHIFT = 0.45;         // how far towards black or white to move one

  function rgbOf(c) {
    var m = /(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(String(c) || '');
    if (m) {
      var v = [+m[1], +m[2], +m[3]];

      if (v[0] <= 1 && v[1] <= 1 && v[2] <= 1) {
        v = v.map(function (x) { return x * 255; });
      }
      return v;
    }
    var h = /^#([0-9a-f]{6})$/i.exec(String(c).trim());
    if (!h) return null;
    var n = parseInt(h[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function hex(v) {
    return '#' + v.map(function (x) {
      var n = Math.max(0, Math.min(255, Math.round(x)));
      return (n < 16 ? '0' : '') + n.toString(16);
    }).join('');
  }

  function far(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  function lum(v) {
    var l = v.map(function (x) {
      x /= 255;
      return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }









  var CASE_LIGHT = '#ffffff';
  var CASE_DARK = '#23201b';

  function separate(colour, ground, caseIsLight) {
    var c = rgbOf(colour);
    if (!c || !ground) return colour;
    if (far(c, ground) >= NEAR) return colour;
    var towards = caseIsLight ? 0 : 255;      // away from the halo
    return hex(c.map(function (x) { return x + (towards - x) * SHIFT; }));
  }




  function recolour(force) {
    if (!cfg) return false;
    var g = host.ground(cfg.ground);
    if (!force && g === groundNow) return false;
    groundNow = g;
    var ground = rgbOf(g);
    var light = !ground || lum(ground) <= 0.42;
    caseInk = light ? CASE_LIGHT : CASE_DARK;
    inks = data.lines.map(function (l) { return separate(l.c, ground, light); });
    linePaths.forEach(function (p) {
      p.el.setAttribute('stroke', inks[p.li] || '#555');
    });
    casePaths.forEach(function (p) { p.setAttribute('stroke', caseInk); });
    chips.forEach(function (c) { c.el.style.background = inks[c.li]; });
    marks.forEach(function (m, i) {
      if (!m) return;
      var circle = m.firstChild;
      if (!circle) return;
      circle.setAttribute('fill', inks[plans[i].tr.li] || '#555');
      circle.setAttribute('stroke', caseInk);
    });
    return true;
  }

  function fmt(mn) {
    mn = Math.floor(((mn % DAY) + DAY) % DAY);
    return two(Math.floor(mn / 60)) + ':' + two(mn % 60);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }












  function segment(a, b) {
    var key = a + '>' + b;
    var seg = segCache[key];
    if (seg !== undefined) return seg;
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var flat = data.paths[lo + '|' + hi];
    var pts = [], i;
    if (flat) {
      for (i = 0; i < flat.length; i += 2) {
        pts.push(host.project(flat[i], flat[i + 1]));
      }
      if (a > b) pts.reverse();
    } else {




      var A = data.stations[a], B = data.stations[b];
      if (!A || !B || A.lon === undefined || B.lon === undefined
          || apart(A, B) > BRIDGE_KM) {
        segCache[key] = null;
        return null;
      }
      pts = [host.project(A.lon, A.lat), host.project(B.lon, B.lat)];
    }
    var cum = [0];
    for (i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x,
                                       pts[i].y - pts[i - 1].y));
    }
    seg = { p: pts, cum: cum, total: cum[cum.length - 1] };
    segCache[key] = seg;
    return seg;
  }













  function pairCoords(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var flat = data.paths[lo + '|' + hi];
    var pts = [], i;
    if (flat) {






      for (i = 0; i < flat.length; i += 2) {
        var x = flat[i], y = flat[i + 1], last = pts[pts.length - 1];
        if (last && last[0] === x && last[1] === y) continue;
        pts.push([x, y]);
      }
      return pts.length > 1 ? pts : null;
    }
    var A = data.stations[lo], B = data.stations[hi];
    if (!A || !B || A.lon === undefined || B.lon === undefined) return null;
    if (apart(A, B) > BRIDGE_KM) return null;
    return [[A.lon, A.lat], [B.lon, B.lat]];
  }




































  var CHORD_KM = 3.0;

  function twoPointChord(c) {
    if (c.length !== 2) return false;
    var kx = Math.cos((c[0][1] + c[1][1]) / 2 * Math.PI / 180);
    var dx = (c[1][0] - c[0][0]) * kx, dy = c[1][1] - c[0][1];
    return Math.sqrt(dx * dx + dy * dy) * 111.0 > CHORD_KM;
  }

  function splitParts(li) {
    var traced = [], chords = [], routed = 0;
    var wasRouted = data.routed || [];
    Object.keys(lineOwns).forEach(function (k) {
      if (lineOwns[k] !== li) return;
      var c = pairCoords.apply(null, k.split('|').map(Number));
      if (!c) return;
      if (!data.paths[k] || twoPointChord(c)) { chords.push(c); return; }
      if (wasRouted.indexOf(k) >= 0) routed++;
      traced.push(c);
    });
    return { traced: traced, chords: chords, routed: routed };
  }

  function lineFeature(li) {
    var line = data.lines[li];
    if (!line) return null;
    var sp = splitParts(li);
    var parts = sp.traced.concat(sp.chords);
    var straight = sp.chords.length, routed = sp.routed;
    if (!parts.length) return null;
    return {
      type: 'Feature',
      geometry: { type: 'MultiLineString', coordinates: parts },
      properties: {
        line: lineName(li, false),
        line_chars: line.n || null,
        line_en: line.en || null,
        line_ja: line.ja || null,
        system: cfg ? cfg.sys : null,
        timetable: (cfg && cfg.note) || null,
        source: (cfg && cfg.src) || null,
        source_url: (cfg && cfg.srcHref) || null,
        stretches: parts.length,
        straight: straight,
        routed: routed,
        approximate: !!line.x,
        note: GEO_NOTE,
      },
    };
  }




  function lineFeatures(li) {
    var line = data.lines[li];
    if (!line) return [];
    var sp = splitParts(li);
    var base = lineFeature(li);
    if (!base) return [];
    var out = [];
    if (sp.traced.length) {
      var t = JSON.parse(JSON.stringify(base));
      t.geometry.coordinates = sp.traced;
      t.properties.geometry_kind = 'traced';
      t.properties.stretches = sp.traced.length;
      t.properties.straight = 0;
      t.properties.routed = sp.routed;
      t.properties.note = GEO_NOTE;
      out.push(t);
    }
    if (sp.chords.length) {
      var c = JSON.parse(JSON.stringify(base));
      c.geometry.coordinates = sp.chords;
      c.properties.geometry_kind = 'chord';
      c.properties.stretches = sp.chords.length;
      c.properties.straight = sp.chords.length;
      c.properties.routed = 0;
      c.properties.note = CHORD_NOTE;
      out.push(c);
    }
    return out;
  }

  var CHORD_NOTE = 'Straight lines between two stations, not a survey. Either '
    + 'the source could not place the stops between them, or this map draws no '
    + 'railway there at all \u2014 the Korean bundle is the 1938 Korea, '
    + 'Manchuria and Japan timetable, and its Manchurian and home-island '
    + 'stretches have no drawn railway to follow. They are separated from the '
    + 'traced geometry so they can be styled apart or dropped; do not measure '
    + 'a distance along them.';

  var GEO_NOTE = 'Longitude and latitude, unprojected. The track between two '
    + 'consecutive stops is traced along the line file where the source has '
    + 'it, routed along the map\u2019s own railway where the source drew a '
    + 'chord across stops it could not place, and drawn straight where it '
    + 'has neither; the `routed` and `straight` counts say how many of this '
    + 'line\u2019s stretches are the second and third kinds.';




  function apart(A, B) {
    var dx = (A.lon - B.lon) * Math.cos(A.lat * Math.PI / 180);
    var dy = A.lat - B.lat;
    return Math.hypot(dx, dy) * 111;
  }

  function pointAt(seg, f) {
    var p = seg.p, cum = seg.cum;
    if (seg.total <= 0) return p[0];
    var target = f * seg.total;
    var i = 1;
    while (i < p.length && cum[i] < target) i++;
    if (i >= p.length) return p[p.length - 1];
    var d = cum[i] - cum[i - 1];
    var g = d > 0 ? (target - cum[i - 1]) / d : 0;
    return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * g,
             y: p[i - 1].y + (p[i].y - p[i - 1].y) * g };
  }











  function deriveOwns(d) {
    d = d || data;
    var use = {};                     // "lo|hi" -> counts per line








    d.trains.forEach(function (t) {
      var prev = -1;
      t.st.forEach(function (s) {
        var fl = s[3] || 0;
        if (fl & 1) { prev = -1; return; }   // timed on another line's table
        var st = d.stations[s[0]];
        if (!st || st.lon === undefined) return;
        if (prev >= 0 && prev !== s[0]) {
          var lo = Math.min(prev, s[0]), hi = Math.max(prev, s[0]);
          var k = lo + '|' + hi;
          (use[k] || (use[k] = {}))[t.li] = ((use[k] || {})[t.li] || 0) + 1;
        }
        prev = s[0];
      });
    });
    var owns = {}, shared = 0;
    Object.keys(use).forEach(function (k) {
      var counts = use[k];
      var best = -1, bestN = -1, n = 0;
      Object.keys(counts).forEach(function (li) {
        n++;
        if (counts[li] > bestN) { bestN = counts[li]; best = +li; }
      });
      if (n > 1) shared++;
      owns[k] = best;
    });
    return { owns: owns, shared: shared };
  }











  function buildLines() {



    var got = data.owns
      ? { owns: data.owns, shared: data.sharedN || 0 }
      : deriveOwns();
    var caseGroup = host.svgEl('g', { 'class': 'train-cases' });
    var lineGroup = host.svgEl('g', { 'class': 'train-lines' });
    var shared = got.shared, drawn = 0, straight = 0, refused = 0;
    Object.keys(got.owns).forEach(function (k) {
      lineOwns[k] = got.owns[k];
      var best = got.owns[k];
      var pair = k.split('|');
      var traced = !!data.paths[k];
      var seg = segment(+pair[0], +pair[1]);
      if (!seg || seg.p.length < 2) { if (!traced) refused++; return; }
      if (!traced) straight++;
      var d = seg.p.map(function (p, i) {
        return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }).join('');
      var isConn = !!(data.lines[best] && data.lines[best].x);
      var halo = host.svgEl('path', {
        'class': 'train-case' + (isConn ? ' train-case-approx' : ''), d: d, fill: 'none',
        stroke: caseInk, 'stroke-opacity': CASE_A,
        'stroke-width': CASE_W,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
      });
      caseGroup.appendChild(halo);
      casePaths.push(halo);






      var faint = !!(data.lines[best] && data.lines[best].x);
      var path = host.svgEl('path', {
        'class': 'train-line' + (faint ? ' train-line-approx' : ''), d: d, fill: 'none',
        stroke: inks[best] || '#555',
        'stroke-opacity': faint ? 0.55 : 1,
        'stroke-width': LINE_W,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
      });
      lineGroup.appendChild(path);
      linePaths.push({ el: path, li: best });





      lineGeom.push({ li: best, key: k, pts: seg.p });
      drawn++;
    });
    lineLayer.appendChild(caseGroup);
    lineLayer.appendChild(lineGroup);
    applyConn();
    return { drawn: drawn, shared: shared, straight: straight,
             refused: refused };
  }































  var timesPending = false;     // a fetch is out; do not ask for another
  var playWanted = false;       // play was pressed before the times arrived
  var fitWanted = false;        // a line was picked before they arrived

  function haveTimes() { return !!(data && data.trains); }

  function needTimes() {
    if (haveTimes()) return true;
    if (!timesPending && host.loadTimes) {
      timesPending = true;
      host.loadTimes();
    }
    return false;
  }

  function setTimes(arr) {
    if (!cfg || !arr) return;
    timesPending = false;
    data.trains = arr;
    buildPlans();
    syncWaiting();
    render();



    if (playWanted) { playWanted = false; setPlaying(true); }


    if (fitWanted) { fitWanted = false; if (pickLi >= 0) showPick(); }
    if (host.timesArrived) host.timesArrived();
  }




  function syncWaiting() {
    var waiting = !haveTimes();
    if (bar) bar.classList.toggle('times-waiting', waiting);
    if (els.play) {
      els.play.title = waiting ? 'The timetable is still loading'
                               : (playing ? 'Pause' : 'Play the day');
      els.play.setAttribute('aria-label', els.play.title);
    }
    if (els.count && waiting) els.count.textContent = 'loading the timetable\u2026';
  }

  function buildPlans() {
    plans = [];
    marks = [];
    var skipped = 0;
    if (!haveTimes()) return { plans: 0, skippedStops: 0 };
    data.trains.forEach(function (t) {
      var pts = [];
      t.st.forEach(function (s) {
        var fl = s[3] || 0;
        if (fl & 1) return;
        var st = data.stations[s[0]];
        if (!st || st.lon === undefined) { skipped++; return; }
        if (s[1] !== null && s[1] !== undefined) pts.push({ t: s[1], s: s[0] });
        if (s[2] !== null && s[2] !== undefined) pts.push({ t: s[2], s: s[0] });
      });
      if (pts.length < 2) return;
      plans.push({ tr: t, pts: pts, t0: pts[0].t, t1: pts[pts.length - 1].t });
    });
    marks = new Array(plans.length);
    return { plans: plans.length, skippedStops: skipped };
  }

  function positionAt(plan, T) {
    var pts = plan.pts;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      if (T < a.t) return null;
      if (T <= b.t) {
        if (a.s === b.s) {
          var st = data.stations[a.s];
          return host.project(st.lon, st.lat);
        }
        var seg = segment(a.s, b.s);
        if (!seg) return null;
        var f = (b.t === a.t) ? 1 : (T - a.t) / (b.t - a.t);
        return pointAt(seg, Math.max(0, Math.min(1, f)));
      }
    }
    return null;
  }

  function markFor(i) {
    var m = marks[i];
    if (m) return m;
    var plan = plans[i];
    m = host.svgEl('g', { 'class': 'train-mark' });
    m.appendChild(host.svgEl('circle', {
      r: TRAIN_R, fill: inks[plan.tr.li] || '#555',
      stroke: caseInk, 'stroke-width': TRAIN_RING }));
    var line = data.lines[plan.tr.li];





    var title = host.svgEl('title');
    title.textContent = trainTitle(plan.tr, line);
    m.appendChild(title);
    trainGroup.appendChild(m);
    marks[i] = m;
    return m;
  }

  function trainTitle(t, line) {
    var bits = ['Train ' + t.no];
    if (line) bits.push(lineName(t.li, true));
    bits.push(t.dir ? 'up' : 'down');
    if (t.dest) bits.push('to ' + t.dest);
    if (t.cls) bits.push(classOf(t.cls));
    return bits.join(' · ');
  }




  function classOf(cls) {
    if (!cls) return '';
    if (cls === '機') return 'mixed';
    var s = cls.replace(/急/, '');
    var out = s === '2.3' || s === '二、三等' ? '2nd & 3rd class'
            : s === '三等' ? '3rd class'
            : s === '1.2' ? '1st & 2nd class'
            : s === '1.2.3' || s === '1.23' ? '1st, 2nd & 3rd class'
            : s;
    return /急/.test(cls) ? out + ', express' : out;
  }







  var pickLi = -1;

  function applyPick() {



    linePaths.forEach(function (p, i) {
      var dim = pickLi >= 0 && p.li !== pickLi;
      p.el.style.opacity = dim ? '0.12' : '';
      var c = casePaths[i];
      if (c) c.style.opacity = dim ? '0.12' : '';
    });
    if (bar) {
      var cs = bar.querySelectorAll('.train-chip');
      for (var i = 0; i < cs.length; i++) {
        cs[i].classList.toggle('on', pickLi >= 0
          && +cs[i].getAttribute('data-li') === pickLi);
      }
    }
    render();
  }







  var pickFlash = 0;
  function flashPick() {
    if (pickFlash) { clearTimeout(pickFlash); pickFlash = 0; }
    if (pickLi < 0) return;
    linePaths.forEach(function (p) {
      if (p.li !== pickLi) return;
      p.el.style.strokeWidth = (LINE_W * 2.4).toFixed(1);
    });
    pickFlash = setTimeout(function () {
      pickFlash = 0;
      linePaths.forEach(function (p) { p.el.style.strokeWidth = ''; });
    }, 700);
  }







  function showPick() {
    if (pickLi < 0 || !host.fitBox) return;




    if (!needTimes()) { fitWanted = true; return; }
    fitWanted = false;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
    data.trains.forEach(function (t) {
      if (t.li !== pickLi) return;
      t.st.forEach(function (r) {
        if ((r[3] || 0) & 1) return;         // a call timed on another line
        var st = data.stations[r[0]];
        if (!st || st.lon === undefined) return;
        var p = host.project(st.lon, st.lat);
        if (!p || !isFinite(p.x) || !isFinite(p.y)) return;
        n++;
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
      });
    });
    if (n > 1) host.fitBox(x0, y0, x1, y1);
  }

  function setPick(li, force) {
    pickLi = (!force && pickLi === li) ? -1 : li;


    showPick();
    applyPick();
    flashPick();






    if (pickLi >= 0 && host.showCard) {
      var card = lineCard(pickLi);
      if (card) host.showCard(card);
    }
  }

  function isConnTrain(t) {
    var l = data && data.lines[t.li];
    return !!(l && l.x);
  }





  function foldConn(shut) {
    if (!els.legend || !els.more || !moreWords) return;
    els.legend.classList.toggle('conn-folded', !!shut);
    els.more.textContent = shut ? moreWords.open : moreWords.shut;
    els.more.title = shut ? moreWords.openTitle : moreWords.shutTitle;
    els.more.setAttribute('aria-expanded', shut ? 'false' : 'true');
  }

  function applyConn() {
    if (lineLayer) lineLayer.classList.toggle('conn-off', !connOn);
    if (bar) bar.classList.toggle('conn-off', !connOn);
    if (els.conn) els.conn.checked = connOn;






    if (!connOn) foldConn(true);
  }

  function setConn(on) {
    connOn = !!on;
    try { localStorage.setItem('jem-train-conn', connOn ? '1' : '0'); } catch (e) {}
    applyConn();
    render();







    if (host.connChanged) host.connChanged(connOn);
  }

  function render() {
    var k = lastK;
    var live = 0;
    for (var i = 0; i < plans.length; i++) {
      var plan = plans[i];
      var m = marks[i];
      var pos = null;



      if (isConnTrain(plan.tr)) {
        if (!connOn) { livePos[i] = null; if (m) m.style.display = 'none'; continue; }
      }
      if (simMin >= plan.t0 && simMin <= plan.t1) pos = positionAt(plan, simMin);
      if (!pos && simMin + DAY >= plan.t0 && simMin + DAY <= plan.t1) {
        pos = positionAt(plan, simMin + DAY);
      }



      if (pickLi >= 0 && plans[i].tr.li !== pickLi) {
        livePos[i] = null; if (m) m.style.display = 'none'; continue;
      }
      m = marks[i];
      if (!pos) {
        livePos[i] = null;
        if (m) m.style.display = 'none';
        continue;
      }
      m = markFor(i);
      livePos[i] = pos;
      m.style.display = '';
      m.setAttribute('transform',
        'translate(' + pos.x.toFixed(1) + ' ' + pos.y.toFixed(1) + ') scale(' + k + ')');
      live++;
    }
    if (els.count) {
      els.count.textContent = haveTimes() ? live + ' running'
                                          : 'loading the timetable\u2026';
    }
    var c = fmt(simMin);
    if (c !== shownClock) { els.clock.textContent = c; shownClock = c; }
  }

  function setTime(mn, fromSlider) {
    simMin = ((mn % DAY) + DAY) % DAY;
    if (!fromSlider && els.slider) els.slider.value = String(Math.floor(simMin));
    render();
  }

  function tick(ts) {
    if (!playing) { raf = 0; return; }
    if (lastTs) {
      var dt = ts - lastTs;



      if (dt > 1000) dt = 1000;
      setTime(simMin + dt / 1000 * (+els.speed.value));
    }
    lastTs = ts;
    raf = requestAnimationFrame(tick);
  }

  function setPlaying(on) {




    if (on && !needTimes()) {
      playWanted = true;
      syncWaiting();
      return;
    }
    playWanted = false;
    playing = on;
    els.play.textContent = on ? '❙❙' : '▶';
    els.play.setAttribute('aria-label', on ? 'Pause' : 'Play the day');
    els.play.title = on ? 'Pause' : 'Play the day';
    lastTs = 0;
    if (on && !raf) raf = requestAnimationFrame(tick);
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
















  var TRAIN_HIT_PX = 11;      // a train dot is 3.4 px; this is a finger's worth
  var LINE_HIT_PX = 9;        // wider than the 3.8 px line, as asked for

  function distToSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len = dx * dx + dy * dy;
    var t = len > 0 ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }





  function hitAt(cx, cy) {
    if (!cfg) return null;
    var p = host.clientToSvg(cx, cy);
    if (!p) return null;
    var k = lastK > 0 ? lastK : 1;
    var best = null, bestD = TRAIN_HIT_PX;
    for (var i = 0; i < livePos.length; i++) {
      var q = livePos[i];
      if (!q) continue;
      var d = Math.hypot(p.x - q.x, p.y - q.y) / k;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best !== null) return { kind: 'train', dist: bestD, index: best };
    var bl = null, blD = LINE_HIT_PX;
    for (var g = 0; g < lineGeom.length; g++) {
      if (!connOn && data.lines[lineGeom[g].li] && data.lines[lineGeom[g].li].x) continue;
      var pts = lineGeom[g].pts;
      for (var j = 1; j < pts.length; j++) {
        var dd = distToSeg(p.x, p.y, pts[j - 1].x, pts[j - 1].y,
                           pts[j].x, pts[j].y) / k;
        if (dd < blD) { blD = dd; bl = lineGeom[g].li; }
      }
    }
    if (bl !== null) return { kind: 'line', dist: blD, index: bl };
    return null;
  }










  function linesAt(cx, cy) {
    if (!cfg) return [];
    var p = host.clientToSvg(cx, cy);
    if (!p) return [];
    var k = lastK > 0 ? lastK : 1;
    var near = {};
    for (var g = 0; g < lineGeom.length; g++) {
      var li = lineGeom[g].li;
      if (!connOn && data.lines[li] && data.lines[li].x) continue;
      var pts = lineGeom[g].pts;
      for (var j = 1; j < pts.length; j++) {
        var dd = distToSeg(p.x, p.y, pts[j - 1].x, pts[j - 1].y,
                           pts[j].x, pts[j].y) / k;
        if (dd < LINE_HIT_PX && (near[li] === undefined || dd < near[li])) {
          near[li] = dd;
        }
      }
    }
    return Object.keys(near).map(function (li) {
      return { index: +li, dist: near[li], name: lineName(+li, false),
               colour: inks[+li] || (data.lines[+li] || {}).c || '#555' };
    }).sort(function (a, b) { return a.dist - b.dist; });
  }







  function stationName(i) {
    var st = data.stations[i];
    return st ? st.n : '';
  }







  function stationNames(i) {
    var st = data.stations[i] || {};
    return [st.n || '', st.py || '', st.ro || ''];
  }

















  function placeName(st) {
    if (!st) return '';
    var want = host.jpNames() ? (st.ro || st.py) : (st.py || st.ro);
    if (!want) return st.n || '';
    return st.n ? want + ' (' + st.n + ')' : want;
  }

  function stationLabel(i) { return placeName(data.stations[i]); }





  function lineName(li, withChars) {
    var l = data.lines[li];
    if (!l) return '';








    if (host.hanLabels && host.hanLabels() && l.n) return l.n;
    var head = host.jpNames() ? (l.ja || l.en) : l.en;
    return withChars && l.n ? head + ' ' + l.n : head;
  }




  function trainCard(index) {
    var plan = plans[index];
    if (!plan) return null;
    var t = plan.tr;
    var line = lineFor(t.li);
    var stops = t.st.filter(function (s) { return !((s[3] || 0) & 1); });
    var first = stops[0], last = stops[stops.length - 1];
    var fromT = first && (first[2] !== null && first[2] !== undefined
                          ? first[2] : first[1]);
    var toT = last && (last[1] !== null && last[1] !== undefined
                       ? last[1] : last[2]);
    var note = '';
    if (first && last) {
      note = 'Left ' + stationLabel(first[0])
        + (fromT !== null && fromT !== undefined ? ' at ' + fmt(fromT) : '')
        + ', due ' + stationLabel(last[0])
        + (toT !== null && toT !== undefined ? ' at ' + fmt(toT) : '') + '.';
      if (toT >= DAY) note += ' It arrives the next morning.';
    }
    var rows = stops.map(function (s) {
      var fl = s[3] || 0;
      return {
        cells: stationNames(s[0]).concat([
          (s[1] !== null && s[1] !== undefined) ? fmt(s[1]) : '',
          (s[2] !== null && s[2] !== undefined) ? fmt(s[2]) : '']),
        title: (fl & 2) ? 'passes without stopping' : '',
        nums: [3, 4],
        timeCells: 5, first: 1,
        uncertain: !!(fl & 4),
      };
    });
    return {
      chip: 'Train', colour: inks[t.li] || '#555',
      primary: 'Train ' + t.no,
      alt: lineName(t.li, true),
      prov: [t.dir ? 'Up' : 'Down', classOf(t.cls),
             t.dest ? 'for ' + placeName(byName[t.dest]) : ''
            ].filter(Boolean).join('  \u00b7  '),
      note: note,
      head: rows.length + ' calls \u00b7 ' + data.year,
      cols: ['Station', data.local || 'Pinyin', 'Romaji', 'Arr', 'Dep'],
      rows: rows,
      links: line && line.a
        ? [{ page: cfg.page, anchor: line.a,
             text: 'The printed table for this line' }]
        : [],
    };
  }






















  function isFerry(line) {
    var n = (line && line.n) || '';
    return /\u9023\u7d61\u8239$/.test(n) || /\u9023\u7d61\u7dda$/.test(n);
  }



  function cardWords(line) {
    return isFerry(line) ? {
      chip: 'Ferry',
      ends: 'Sailings start or end at ',
      count: 'Sailings a day',
      dirs: 'Outward / return',
      calls: 'Ports called at',
      dist: 'Crossing drawn',
      first: 'First sailing',
      last: 'Last sailing',
      list: 'Ports on the crossing, with the sailings that called (%d in all)',
      head: 'A day on it, counted from the ',
    } : {
      chip: 'Railway line',
      ends: 'Trains start or end at ',
      count: 'Trains a day',
      dirs: 'Down / up',
      calls: 'Stations called at',
      dist: 'Track drawn',
      first: 'First departure',
      last: 'Last departure',
      list: 'Stations on the line, with the trains that stopped (%d in all)',
      head: 'A day on it, counted from the ',
    };
  }

  function waitingCard(li, line) {
    return {
      geoLi: li,
      chip: cardWords(line).chip, colour: inks[li] || '#555',
      primary: lineName(li, false),
      alt: line.n,
      note: (line.d || '') + (line.x
        ? ' The map draws this line straight between the cities it can place; the track\'s real alignment is not yet sourced.'
        : ''),
      head: 'The timetable is still loading.',
      waiting: true,
    };
  }

  function lineCard(li) {
    var line = lineFor(li);
    if (!line) return null;




    if (!needTimes()) return waitingCard(li, line);
    var trains = data.trains.filter(function (t) { return t.li === li; });
    var down = trains.filter(function (t) { return !t.dir; }).length;
    var stops = {};






    var calls = {};



    var order = [];
    var firstT = null, lastT = null;
    trains.forEach(function (t) {
      var seq = t.st.filter(function (s) { return !((s[3] || 0) & 1); })
                    .map(function (s) { return s[0]; });
      if (seq.length > order.length) order = t.dir ? seq.slice().reverse() : seq;
      t.st.forEach(function (s) {
        if ((s[3] || 0) & 1) return;
        var fl = s[3] || 0;
        if (!(fl & 2) && (s[1] !== null && s[1] !== undefined
                          || s[2] !== null && s[2] !== undefined)) {
          calls[s[0]] = (calls[s[0]] || 0) + 1;
        }
        stops[s[0]] = 1;
        var d = s[2];
        if (d === null || d === undefined) return;
        if (firstT === null || d < firstT) firstT = d;
        if (lastT === null || d > lastT) lastT = d;
      });
    });




    var km = 0;
    Object.keys(data.paths).forEach(function (key) {







      if (lineOwns[key] !== li) return;
      var flat = data.paths[key];
      for (var i = 2; i < flat.length; i += 2) {
        km += apart({ lon: flat[i - 2], lat: flat[i - 1] },
                    { lon: flat[i], lat: flat[i + 1] });
      }
    });
    var ends = {};
    trains.forEach(function (t) {
      var st = t.st.filter(function (s) { return !((s[3] || 0) & 1); });
      if (!st.length) return;
      ends[stationName(st[0][0])] = 1;
      ends[stationName(st[st.length - 1][0])] = 1;
    });
    var W = cardWords(line);
    var rows = [
      { cells: [W.count, String(trains.length)] },
      { cells: [W.dirs, down + ' / ' + (trains.length - down)] },
      { cells: [W.calls, String(Object.keys(stops).length)] },
      { cells: [W.dist, km >= 1 ? Math.round(km) + ' km' : '\u2014'] },
      { cells: [W.first, firstT === null ? '\u2014' : fmt(firstT)] },
      { cells: [W.last, lastT === null ? '\u2014' : fmt(lastT)] },
    ];




    var stopList = order.filter(function (ix, i) {
      return order.indexOf(ix) === i;
    }).map(function (ix) {
      return placeName(data.stations[ix]) + ' (' + (calls[ix] || 0) + ')';
    });
    return {


      geoLi: li,
      chip: W.chip, colour: inks[li] || '#555',
      primary: lineName(li, false),
      alt: line.n,




      prov: Object.keys(ends).length
        ? W.ends
          + Object.keys(ends).slice(0, 8)
              .map(function (n) { return placeName(byName[n]); })
              .join('\u3001')
          + (Object.keys(ends).length > 8 ? '\u2026' : '')
        : '',




      note: (line.d || '') + (line.x
        ? (isFerry(line)
             ? ' The map draws this crossing straight between the ports; the course the boats actually steered is not yet sourced.'
             : ' The map draws this line straight between the cities it can place; the track\'s real alignment is not yet sourced.')
        : ''),
      head: W.head + (data.issued || data.year) + ' table',
      cols: ['', ''],
      rows: rows,



      list: stopList.length > 1
        ? { head: W.list.replace('%d', trains.length), items: stopList }
        : null,
      links: [
        line.w ? { href: line.w,
                   text: 'Read more on ' + ({ ja: 'Japanese', zh: 'Chinese',
                                                ko: 'Korean', en: 'English' }[line.wl] || '')
                         + ' Wikipedia' } : null,
        line.a ? { page: cfg.page, anchor: line.a,
                   text: 'The printed tables for this line' } : null,
      ].filter(Boolean),
    };
  }



  var lineOwns = {};







  function buildBar() {
    bar = el('div');
    bar.id = 'train-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Timetable playback');

    els.play = el('button', 'train-play', '▶');
    els.play.type = 'button';
    els.play.title = 'Play the day';
    els.play.setAttribute('aria-label', 'Play the day');
    els.play.addEventListener('click', function () { setPlaying(!playing); });

    els.clock = el('span', 'train-clock', fmt(simMin));

    els.slider = document.createElement('input');
    els.slider.type = 'range';
    els.slider.id = 'train-time';
    els.slider.min = '0';
    els.slider.max = String(DAY - 1);
    els.slider.value = String(Math.floor(simMin));
    els.slider.title = 'The time of day';
    els.slider.setAttribute('aria-label', 'The time of day');
    els.slider.addEventListener('input', function () {
      setTime(+els.slider.value, true);
    });

    els.speed = document.createElement('select');
    els.speed.id = 'train-speed';
    els.speed.title = 'How fast the day runs';
    els.speed.setAttribute('aria-label', 'How fast the day runs');
    [[2, '2 min/s'], [5, '5 min/s'], [10, '10 min/s'], [20, '20 min/s']]
      .forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = String(o[0]);
        opt.textContent = o[1];
        if (o[0] === 5) opt.selected = true;
        els.speed.appendChild(opt);
      });

    els.count = el('span', 'train-count', '');

    var legend = el('div', 'train-legend');
    els.legend = legend;
    data.lines.forEach(function (l) {
      var chip = el('span', 'train-chip');
      var sw = el('span', 'sw');
      sw.style.background = inks[data.lines.indexOf(l)] || l.c;
      chips.push({ el: sw, li: data.lines.indexOf(l) });
      chip.appendChild(sw);
      chip.appendChild(document.createTextNode(lineName(data.lines.indexOf(l), false)));
      chip.title = l.en + '   ' + (l.ja ? l.ja + '   ' : '') + l.n
        + (l.x ? '   (drawn straight between cities; alignment unsourced)' : '');
      chip.setAttribute('data-li', data.lines.indexOf(l));
      if (l.x) chip.classList.add('train-chip-conn');







      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.addEventListener('click', function () {
        setPick(+chip.getAttribute('data-li'));
      });
      chip.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault(); setPick(+chip.getAttribute('data-li'));
        }
      });
      legend.appendChild(chip);
    });








    var connChips = data.lines.filter(function (l) { return l.x; }).length;
    if (connChips) {





      var homeName = host.home ? host.home(cfg && cfg.sys) : '';
      moreWords = {
        open: 'More lines',



        shut: homeName ? homeName + '\u2019s lines only' : 'This network only',
        openTitle: 'The ' + connChips + ' lines beyond this network, by name',
        shutTitle: 'Leave only the lines of this network in the list',
      };
      els.more = el('button', 'train-more', moreWords.open);
      els.more.type = 'button';
      els.more.addEventListener('click', function () {
        foldConn(!legend.classList.contains('conn-folded'));
      });
      legend.appendChild(els.more);
      foldConn(true);
    }


    var hasConn = data.lines.some(function (l) { return l.x; });
    var connLabel = null;
    if (hasConn) {
      connLabel = el('label', 'train-conn');
      els.conn = document.createElement('input');
      els.conn.type = 'checkbox';
      els.conn.id = 'train-conn';
      els.conn.checked = connOn;
      els.conn.addEventListener('change', function () { setConn(els.conn.checked); });
      connLabel.appendChild(els.conn);
      connLabel.appendChild(document.createTextNode(' Connections beyond the network'));
      connLabel.title = 'The lines this timetable connects to — drawn as straight lines '
        + 'between cities, because their real alignment is not yet sourced. Off until it is.';
    }

    var link = el('a', 'train-full', 'Full timetable');
    link.href = host.asset(cfg.page);
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = 'The eighteen printed tables this was transcribed from';

    var note = el('span', 'train-note', cfg.note);

    var close = el('button', 'train-close', '×');
    close.type = 'button';
    close.title = 'Put the train tools away';
    close.setAttribute('aria-label', 'Put the train tools away');
    close.addEventListener('click', function () { host.switchOff(); });

    var row = el('div', 'train-row');
    [els.play, els.clock, els.slider, els.speed, els.count].forEach(function (e) {
      row.appendChild(e);
    });
    row.appendChild(close);
    var row2 = el('div', 'train-row train-row2');
    row2.appendChild(legend);
    if (connLabel) row2.appendChild(connLabel);
    row2.appendChild(note);
    row2.appendChild(link);
    bar.appendChild(row);
    bar.appendChild(row2);
    host.stage().appendChild(bar);

    applyConn();



    host.obstacle(bar, true);
  }














  function lineFor(li) {
    var l = data.lines[li];
    if (!l) return null;
    return { n: l.n, en: l.en, a: l.a, d: l.d, w: l.w, wl: l.wl,
             c: inks[li] || l.c };
  }





  function destNames(name) {
    var st = byName[name];
    if (!st) return name || '';
    var parts = [st.n];
    if (st.py) parts.push(st.py);
    if (st.ro && st.ro !== st.py) parts.push(st.ro);
    return parts.join('  ');
  }

  function departures(sid) {
    if (!byStation) return null;




    if (!needTimes()) return null;
    var idx = byStation[sid];
    if (idx === undefined) return null;
    var st = data.stations[idx];
    var rows = [];
    data.trains.forEach(function (t) {
      t.st.forEach(function (s) {
        if (s[0] !== idx) return;
        var fl = s[3] || 0;
        if (fl & 1) return;                     // timed on another table
        var dep = s[2], arr = s[1];
        if (dep === null || dep === undefined) {
          if (arr === null || arr === undefined) return;   // passes without stopping
        }
        var line = lineFor(t.li);
        if (!connOn && line && line.x) return;
        rows.push({
          t: ((dep !== null && dep !== undefined) ? dep : arr) % DAY,
          key: t.no + '|' + (((dep !== null && dep !== undefined) ? dep : arr) % DAY),
          cells: [(arr !== null && arr !== undefined) ? fmt(arr) : '',
                  (dep !== null && dep !== undefined) ? fmt(dep) : '',
                  t.no,
                  line ? lineName(t.li, false).replace(/ Line$/, '') + ' '
                         + (t.dir ? '\u2191' : '\u2193') : '',
                  destNames(t.dest)],
          swatchAt: 3,
          nums: [0, 1],
          swatch: line ? line.c : '',
          title: line ? line.n + '  ' + (t.dir ? '\u4e0a\u308a' : '\u4e0b\u308a')
                        + (t.cls ? '  \u00b7  ' + classOf(t.cls) : '') : '',
          timeCells: 2,
          uncertain: !!(fl & 4),
        });
      });
    });
    var seen = {};
    rows = rows.filter(function (r) {
      if (seen[r.key]) return false;
      seen[r.key] = 1;
      return true;
    }).sort(function (a, b) { return a.t - b.t; });
    var lines = (st.li || []).map(lineFor).filter(Boolean);
    return {
      name: st.n, romaji: st.ro || '',
      head: rows.length + ' trains called here \u00b7 ' + data.year,
      cols: ['Arr', 'Dep', 'Train', 'Line', 'To'],
      rows: rows,
      links: lines[0] && lines[0].a
        ? [{ page: cfg.page, anchor: lines[0].a,
             text: 'The printed table for this line' }]
        : [],
    };
  }



  var api = {




    mount: function (conf) {
      if (cfg) return api.stats;
      cfg = conf;
      data = conf.data;
      segCache = {};
      byStation = {};
      byName = {};
      data.stations.forEach(function (s, i) {
        if (s.sid) byStation[s.sid] = i;
        byName[s.n] = s;
      });
      inks = data.lines.map(function (l) { return l.c; });
      linePaths = [];
      casePaths = [];
      chips = [];
      lineGeom = [];
      livePos = [];
      lineOwns = {};
      groundNow = '';
      recolour(true);
      lineLayer = host.svgEl('g', { id: 'train-layer' });
      markLayer = host.svgEl('g', { id: 'train-marks' });
      host.insertLayer(lineLayer, markLayer);
      var lineStats = buildLines();
      trainGroup = host.svgEl('g', { 'class': 'train-marks' });
      markLayer.appendChild(trainGroup);
      var planStats = buildPlans();
      buildBar();
      syncWaiting();
      lastK = host.scale();
      render();
      api.stats = {
        lines: lineStats.drawn, shared: lineStats.shared,
        straight: lineStats.straight, refused: lineStats.refused,
        plans: planStats.plans, skippedStops: planStats.skippedStops,
        stations: data.stations.length,
        linked: Object.keys(byStation).length,
      };
      return api.stats;
    },

    unmount: function () {
      if (!cfg) return;
      setPlaying(false);
      if (bar) {
        host.obstacle(bar, false);
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }
      [lineLayer, markLayer].forEach(function (g) {
        if (g && g.parentNode) g.parentNode.removeChild(g);
      });
      cfg = null; data = null; trainGroup = null; bar = null;
      lineLayer = null; markLayer = null; lineGeom = []; livePos = [];
      lineOwns = {};
      els = {}; plans = []; marks = []; segCache = null; byStation = null;
      byName = null;
      inks = []; linePaths = []; casePaths = []; chips = []; groundNow = '';
      pickLi = -1;
      shownClock = '';



      timesPending = false;
      playWanted = false;
      fitWanted = false;
    },




    setTimes: setTimes,
    hasTimes: function () { return haveTimes(); },
















    bounds: function () {
      if (!cfg || !data) return null;
      var w = 1e9, s2 = 1e9, e = -1e9, n = -1e9, seen = 0;
      data.stations.forEach(function (st, i) {
        if (!st || st.lon === undefined) return;
        var on = (st.li || []).some(function (li) {
          var l = data.lines[li];
          return l && (connOn || !l.x);
        });
        if (!on) return;
        seen++;
        if (st.lon < w) w = st.lon;
        if (st.lon > e) e = st.lon;
        if (st.lat < s2) s2 = st.lat;
        if (st.lat > n) n = st.lat;
      });
      return seen > 1 ? { w: w, s: s2, e: e, n: n } : null;
    },








    timesFailed: function () {
      timesPending = false;
      playWanted = false;
      fitWanted = false;
      syncWaiting();
    },










    deriveOwns: deriveOwns,

    mounted: function () { return !!cfg; },
    system: function () { return cfg ? cfg.sys : ''; },






    connOn: function () { return !!(cfg && connOn); },
    playing: function () { return playing; },




    rescaled: function (k) {
      if (!cfg || !(k > 0)) return;
      lastK = k;
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        if (!m || m.style.display === 'none') continue;
        var t = m.getAttribute('transform') || '';
        var p = /translate\(([^)]*)\)/.exec(t);
        if (p) m.setAttribute('transform', 'translate(' + p[1] + ') scale(' + k + ')');
      }
    },









    reprojected: function () {
      if (!cfg) return;
      segCache = {};




      lineGeom.forEach(function (g) {
        var pair = g.key.split('|');
        var seg = segment(+pair[0], +pair[1]);
        if (seg) g.pts = seg.p;
      });
      render();
    },









    serves: function (sid) {
      return !!(byStation && sid && byStation[sid] !== undefined);
    },

    hitAt: hitAt,
    linesAt: linesAt,
    trainCard: trainCard,
    lineCard: lineCard,




    lineFeature: lineFeature,
    systemFeatures: function () {
      var out = [];
      (data.lines || []).forEach(function (l, i) {
        lineFeatures(i).forEach(function (f) { out.push(f); });
      });
      return out;
    },


    lineFeatures: function (li) { return lineFeatures(li); },




    renamed: function () {
      if (!cfg || !bar) return;
      var chips = bar.querySelectorAll('.train-chip');
      for (var i = 0; i < chips.length; i++) {
        var li = +chips[i].getAttribute('data-li');
        var sw = chips[i].querySelector('.sw');
        chips[i].textContent = '';
        if (sw) chips[i].appendChild(sw);
        chips[i].appendChild(document.createTextNode(lineName(li, false)));
      }
      marks.forEach(function (m, i) {
        var t = m && m.querySelector('title');
        if (t) t.textContent = trainTitle(plans[i].tr, data.lines[plans[i].tr.li]);
      });
    },


    pick: function (li) { if (bar) setPick(li, li >= 0); return pickLi; },
    departures: departures,
    recolour: recolour,
    connections: function (on) { if (on !== undefined) setConn(on); return connOn; },
    stats: null,
  };

  return api;
};
