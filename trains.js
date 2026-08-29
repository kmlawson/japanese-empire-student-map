/* trains.js — the working timetable, on the map.
 *
 * A railway timetable is a document about time, and a map is a document about
 * space; this is the join between them. It draws the passenger network in the
 * colours the timetable gives its lines, runs the day's trains along it at a
 * chosen rate, and answers a tap on a station with the trains that called
 * there. The table it was transcribed from is one page away, whole.
 *
 * WHY IT IS A MODULE AND NOT PART OF map.js. It costs 267 KB of train times
 * and track and it is of no use at all until the reader is looking at the
 * island the trains ran on. So neither the code nor the data is in the page
 * until the reader has asked for the tools *and* zoomed in far enough for them
 * to mean anything, and both go again on the way back out. map.js decides
 * when; this decides what.
 *
 * MAP UNITS AND SCREEN PIXELS. Everything drawn here lives in map units, and
 * every size the reader perceives — the width of a line, the radius of a train
 * — is in screen pixels. `k` is the number of map units to a screen pixel, and
 * it is the only bridge between them. The lines carry `non-scaling-stroke`, so
 * their width is already in screen pixels and needs nothing. The train dots
 * cannot: they are shapes, not strokes, so each one is drawn at its pixel size
 * and given `scale(k)`, and `rescaled(k)` rewrites that on every zoom. Test at
 * more than one zoom or this proves nothing.
 */
window.JMAP_TRAINS = function (host) {
  'use strict';

  var DAY = 1440;                      // minutes in the day the timetable runs
  var TRAIN_R = 3.4;                   // screen px: the radius of a train
  var TRAIN_RING = 1.1;                // screen px: its white ring
  var LINE_W = 3.8;                    // screen px: the coloured track
  /* THE CASING IS WHY THE TRUNK LINE CAN BE SEEN AT ALL.
   *
   * The line colours are the timetable's own, and the map's are the reader's:
   * the trunk line is #c0392b and a Japanese colony is #c2463d, which is the
   * same red. Drawn straight onto the island the busiest line on the network
   * was invisible, and the six branch lines — blue, green, purple, orange —
   * were not, so the map said the trunk line did not exist.
   *
   * The answer is the cartographer's one and not a change of palette: a pale
   * casing under each line, so the colour reads against its own halo rather
   * than against whatever country it happens to cross. It costs a second path
   * per stretch, 362 instead of 181, and it works for every palette the reader
   * can choose without knowing what any of them are. */
  var CASE_W = 5.6;                    // screen px: the pale halo under it
  var CASE_A = 0.85;
  /* HOW LONG A GUESS IS ALLOWED TO BE, in kilometres.
   *
   * Where two stations that can be placed have only unplaceable ones between
   * them, the track is drawn as the straight line between them. Over a few
   * kilometres that is honest — it differs from the real alignment by less
   * than the width of the line. Over a hundred it is a fabrication: two trains
   * in this timetable have every intermediate stop unplaceable, and the map
   * drew their journeys as chords 123 km and 96 km long, straight across the
   * central mountains, where no railway has ever run. Both stretches are drawn
   * properly by other trains' stops anyway, so nothing is lost by refusing:
   * past this distance the map says nothing rather than something false, and a
   * train is simply not shown while it is on that leg. */
  var BRIDGE_KM = 15;
  var DEFAULT_MIN = 300;               // the day opens at 05:00, before the
                                       // first train, so pressing play shows
                                       // the network fill rather than empty

  var cfg = null;                      // the system being shown, or null
  var data = null;
  /* TWO LAYERS, NOT ONE, and the station squares go between them.
   *
   * A station belongs on top of the line it stands on — under the line it is a
   * dot half-hidden by a stroke five pixels wide — and under the trains, which
   * are the thing moving and have to be seen to arrive at it. The squares are
   * the railway layer's and sit where they always have, so the track goes
   * below them and the trains above, and this layer is two groups rather than
   * one for that reason alone. */
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
  var simMin = DEFAULT_MIN;
  var playing = false;
  var raf = 0;
  var lastTs = 0;
  var lastK = 1;
  var shownClock = '';

  function two(n) { return (n < 10 ? '0' : '') + n; }

  /* ------------------------------------------------------- line colours --

     THE TIMETABLE'S RED AND THE MAP'S RED ARE THE SAME RED.
     
     The seven lines are coloured as the source colours them, and that is the
     right default: those colours are a fact about the document. But the trunk
     line is #c0392b and a Japanese colony on this map is #c2463d — twelve
     units apart in a space of 255 — so the busiest line on the network was
     drawn invisibly, and the six branches, being blue and green and purple,
     were not. The map said the trunk line did not exist.

     A casing does not fix that: it makes the *line* visible and leaves its
     colour unreadable, so the trunk line reads as a white line and its entry
     in the legend is a lie.

     So a colour that collides with the ground it is drawn on is moved until it
     does not — darkened where the ground is light, lightened where it is dark
     — and everything that shows that colour, the track, the trains, the chip
     in the bar and the swatch in a station's card, shows the moved one. It is
     recomputed against the ground as the reader has it, so a changed palette,
     a single-colour map or a dark screen each get their own answer rather than
     one fitted to the default and wrong everywhere else.

     Nothing here changes which line is which. It changes what shade of it the
     reader can see, and only when the alternative is seeing nothing. */
  var NEAR = 62;            // sRGB distance at which two colours read as one
  var SHIFT = 0.45;         // how far towards black or white to move one

  function rgbOf(c) {
    var m = /(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(String(c) || '');
    if (m) {
      var v = [+m[1], +m[2], +m[3]];
      // rgb() gives 0-255 and color(srgb ...) gives 0-1; both arrive here
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

  /* WHICH WAY THE HALO GOES, AND THEREFORE WHICH WAY A COLOUR MOVES.
   *
   * The halo has to read against the *ground*, so it is pale over dark land and
   * dark over pale land. A line whose colour collides with the ground then has
   * only one direction left: away from the halo, or it disappears into that
   * instead. Moved the wrong way the trunk line went from invisible red on red
   * to a pale pink inside a white casing, which is the same fault with an
   * extra step. */
  var CASE_LIGHT = '#ffffff';
  var CASE_DARK = '#23201b';

  function separate(colour, ground, caseIsLight) {
    var c = rgbOf(colour);
    if (!c || !ground) return colour;
    if (far(c, ground) >= NEAR) return colour;
    var towards = caseIsLight ? 0 : 255;      // away from the halo
    return hex(c.map(function (x) { return x + (towards - x) * SHIFT; }));
  }

  /* Fit the line colours to the ground, and repaint everything showing one.
     Cheap and guarded: the ground is read once and nothing is rewritten unless
     it has actually changed since the last time. */
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

  /* ------------------------------------------------------------ geometry --

     The track between two stations, as the source draws it, with the running
     distance along it so a train can be put at a fraction of the way. Held in
     map units because that is what it is drawn in, and cached because a train
     asks for the same segment on every frame it is on it.

     Distances are computed in map units too, not in degrees: the projection is
     Mercator and a degree of longitude is not a degree of latitude anywhere on
     this map, so pacing a train by degrees would have it hurry through the
     north-south stretches and dawdle across the east-west ones. */
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
      /* No traced track between these two: a straight line between the
         stations, which is what the source's own map does. 22 of the 187
         stations have no coordinate at all and those pairs get nothing —
         the train is simply not drawn over that stretch. */
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

  /* Kilometres between two stations as the crow flies. Not in map units: this
     is a question about the ground, and a map unit is worth a different number
     of kilometres at every latitude on a Mercator sheet. */
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

  /* --------------------------------------------------------------- lines --

     One coloured path per pair of consecutive stops, drawn in the colour of
     the line that ran the most trains over it. Track shared by two lines —
     Takao, where the Chaozhou line leaves the trunk — would otherwise be drawn
     twice, one colour hiding the other by document order rather than by
     anything meaningful. */
  function buildLines() {
    var use = {};                     // "lo|hi" -> counts per line
    /* THE SEQUENCE IS THE ONE THE TRAINS RUN, NOT THE ONE THE TABLE PRINTS.
       22 of the 187 stations have no coordinate, and joining only the pairs
       that are consecutive in the table left a hole in the track wherever one
       of them stood — the trunk line broke either side of Takao, at Yamashita
       and Sankaisho, and read as two lines that did not meet. Dropping the
       stations that cannot be placed and joining what is left across them
       closes it: 181 stretches of track instead of 156, and all but four of
       them still traced rather than drawn straight. */
    data.trains.forEach(function (t) {
      var prev = -1;
      t.st.forEach(function (s) {
        var fl = s[3] || 0;
        if (fl & 1) { prev = -1; return; }   // timed on another line's table
        var st = data.stations[s[0]];
        if (!st || st.lon === undefined) return;
        if (prev >= 0 && prev !== s[0]) {
          var lo = Math.min(prev, s[0]), hi = Math.max(prev, s[0]);
          var k = lo + '|' + hi;
          (use[k] || (use[k] = {}))[t.li] = ((use[k] || {})[t.li] || 0) + 1;
        }
        prev = s[0];
      });
    });
    var caseGroup = host.svgEl('g', { 'class': 'train-cases' });
    var lineGroup = host.svgEl('g', { 'class': 'train-lines' });
    var shared = 0, drawn = 0, straight = 0, refused = 0;
    Object.keys(use).forEach(function (k) {
      var counts = use[k];
      var best = -1, bestN = -1, n = 0;
      Object.keys(counts).forEach(function (li) {
        n++;
        if (counts[li] > bestN) { bestN = counts[li]; best = +li; }
      });
      if (n > 1) shared++;
      lineOwns[k] = best;
      var pair = k.split('|');
      var traced = !!data.paths[k];
      var seg = segment(+pair[0], +pair[1]);
      if (!seg || seg.p.length < 2) { if (!traced) refused++; return; }
      if (!traced) straight++;
      var d = seg.p.map(function (p, i) {
        return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }).join('');
      var halo = host.svgEl('path', {
        'class': 'train-case', d: d, fill: 'none',
        stroke: caseInk, 'stroke-opacity': CASE_A,
        'stroke-width': CASE_W,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
      });
      caseGroup.appendChild(halo);
      casePaths.push(halo);
      var path = host.svgEl('path', {
        'class': 'train-line', d: d, fill: 'none',
        stroke: inks[best] || '#555',
        'stroke-width': LINE_W,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
      });
      lineGroup.appendChild(path);
      linePaths.push({ el: path, li: best });
      /* Kept for the pointer, not for drawing. The track answers a tap by a
         distance test in this module rather than by taking pointer events —
         see `hitAt` — so the points have to be somewhere they can be measured
         against, and reading them back out of a `d` string on every tap is
         not that place. */
      lineGeom.push({ li: best, key: k, pts: seg.p });
      drawn++;
    });
    lineLayer.appendChild(caseGroup);
    lineLayer.appendChild(lineGroup);
    return { drawn: drawn, shared: shared, straight: straight,
             refused: refused };
  }

  /* -------------------------------------------------------------- trains --

     A plan is the list of places a train is known to be and when, in order.
     A stop timed on another line's table is left out — the source records the
     through working there, not this train's own path — and so is a stop at a
     station with no coordinate, of which there are 22. Leaving those out means
     a train crosses the gap in a straight run at an even pace rather than
     disappearing, which is the lesser of the two wrongs and is what the
     source's own map does. */
  function buildPlans() {
    plans = [];
    var skipped = 0;
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
    /* For the accessibility tree, not for the pointer: the whole layer is
       `pointer-events: none` in styles.css, because a dot on it that answered
       the pointer would be answering instead of the province underneath, and
       on a touch screen a tap that landed on a moving four-pixel target would
       clear the card rather than open one. */
    var title = host.svgEl('title');
    title.textContent = trainTitle(plan.tr, line);
    m.appendChild(title);
    trainGroup.appendChild(m);
    marks[i] = m;
    return m;
  }

  function trainTitle(t, line) {
    var bits = ['Train ' + t.no];
    if (line) bits.push(line.en + ' ' + line.n);
    bits.push(t.dir ? 'up' : 'down');
    if (t.dest) bits.push('to ' + t.dest);
    if (t.cls) bits.push(classOf(t.cls));
    return bits.join(' · ');
  }

  /* The class column as the timetable prints it. 機 is a mixed train worked by
     a locomotive turn rather than a class of accommodation, and the numerals
     are which classes of carriage it took; 急 on the end is an express. */
  function classOf(cls) {
    if (!cls) return '';
    if (cls === '機') return 'mixed';
    var s = cls.replace(/急/, '');
    var out = s === '2.3' || s === '二、三等' ? '2nd & 3rd class'
            : s === '三等' ? '3rd class'
            : s === '1.2.3' || s === '1.23' ? '1st, 2nd & 3rd class'
            : s;
    return /急/.test(cls) ? out + ', express' : out;
  }

  /* One frame. Only the trains that are running are in the document: a mark is
     made the first time its train is needed and hidden, not destroyed, when it
     has arrived — the day is a loop and it will be wanted again. */
  function render() {
    var k = lastK;
    var live = 0;
    for (var i = 0; i < plans.length; i++) {
      var plan = plans[i];
      var pos = null;
      /* A train that left before midnight and arrives after it is timed past
         1440 in the source, so the clock is asked twice: once as the minute it
         is, and once as that minute a day later. */
      if (simMin >= plan.t0 && simMin <= plan.t1) pos = positionAt(plan, simMin);
      if (!pos && simMin + DAY >= plan.t0 && simMin + DAY <= plan.t1) {
        pos = positionAt(plan, simMin + DAY);
      }
      var m = marks[i];
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
    if (els.count) els.count.textContent = live + ' running';
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
      /* Capped at a second. A tab left in the background gets one enormous
         delta on the way back, which would jump the clock by however long the
         reader was away — the day would appear to have skipped. */
      if (dt > 1000) dt = 1000;
      setTime(simMin + dt / 1000 * (+els.speed.value));
    }
    lastTs = ts;
    raf = requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    playing = on;
    els.play.textContent = on ? '❙❙' : '▶';
    els.play.setAttribute('aria-label', on ? 'Pause' : 'Play the day');
    els.play.title = on ? 'Pause' : 'Play the day';
    lastTs = 0;
    if (on && !raf) raf = requestAnimationFrame(tick);
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* --------------------------------------------------------- the pointer --

     WHY THIS IS A DISTANCE TEST AND NOT A POINTER-EVENTS LAYER.

     The obvious way to make a line clickable is to give it a wide transparent
     stroke and let the browser hit-test it. That would break hovering: the
     whole map answers the pointer by naming what is under it, and a transparent
     ribbon twelve pixels wide laid along every railway would mean the country
     stopped being named every time the mouse crossed one. The layer takes no
     pointer events at all, as it always has, and the map hands a tap here to
     be measured instead. Nothing hovers over a railway that did not before.

     It also puts the order of precedence in one place and makes it plain: a
     train first, because it is drawn on top and is the smaller target; then
     the station, which the map answers for itself; then the line. */
  var TRAIN_HIT_PX = 11;      // a train dot is 3.4 px; this is a finger's worth
  var LINE_HIT_PX = 9;        // wider than the 3.8 px line, as asked for

  function distToSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len = dx * dx + dy * dy;
    var t = len > 0 ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  /* What is under this point on the screen, or null. Distances are worked out
     in map units and reported in screen pixels, because a hit target is a
     thing the reader aims a finger at and `k` is the only bridge between the
     two — the same rule the rest of this file keeps. */
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

  /* ------------------------------------------------------------- cards --

     Data, not markup. What a card looks like is map.js's business — it owns
     `#info` and every other card in it — so these hand back the same shape the
     station departures do and are drawn by the same code. */

  function stationName(i) {
    var st = data.stations[i];
    return st ? st.n : '';
  }

  /* A train: what it is, where it came from and when, and where it is going.
     The calling list underneath is the train's own timetable column, which is
     what the reader has just pointed at a moving dot to ask about. */
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
      note = 'Left ' + stationName(first[0])
        + (fromT !== null && fromT !== undefined ? ' at ' + fmt(fromT) : '')
        + ', due ' + stationName(last[0])
        + (toT !== null && toT !== undefined ? ' at ' + fmt(toT) : '') + '.';
      if (toT >= DAY) note += ' It arrives the next morning.';
    }
    var rows = stops.map(function (s) {
      var fl = s[3] || 0;
      return {
        cells: [stationName(s[0]),
                (s[1] !== null && s[1] !== undefined) ? fmt(s[1]) : '',
                (s[2] !== null && s[2] !== undefined) ? fmt(s[2]) : ''],
        title: (fl & 2) ? 'passes without stopping' : '',
        timeCells: 3, first: 1,
        uncertain: !!(fl & 4),
      };
    });
    return {
      chip: 'Train', colour: inks[t.li] || '#555',
      primary: 'Train ' + t.no,
      alt: line ? line.en + '  ' + line.n : '',
      prov: [t.dir ? 'Up' : 'Down', classOf(t.cls),
             t.dest ? 'for ' + t.dest : ''].filter(Boolean).join('  \u00b7  '),
      note: note,
      head: rows.length + ' calls \u00b7 ' + data.year,
      cols: ['Station', 'Arr', 'Dep'],
      rows: rows,
      link: line && line.a
        ? { page: cfg.page, anchor: line.a, text: 'The printed table for this line' }
        : null,
    };
  }

  /* A line: what it was, and the shape of a day on it. Every figure here is
     counted from the timetable rather than quoted from anywhere, so it says
     what this transcription holds and not what the railway was — the two
     differ wherever the source is short of a station or a working. */
  function lineCard(li) {
    var line = lineFor(li);
    if (!line) return null;
    var trains = data.trains.filter(function (t) { return t.li === li; });
    var down = trains.filter(function (t) { return !t.dir; }).length;
    var stops = {};
    var firstT = null, lastT = null;
    trains.forEach(function (t) {
      t.st.forEach(function (s) {
        if ((s[3] || 0) & 1) return;
        stops[s[0]] = 1;
        var d = s[2];
        if (d === null || d === undefined) return;
        if (firstT === null || d < firstT) firstT = d;
        if (lastT === null || d > lastT) lastT = d;
      });
    });
    /* The length of the track this line is drawn on, in kilometres, added up
       from the traced geometry rather than from the distance column of the
       printed table — which is a running total from the head of each table and
       does not survive being cut into stretches. */
    var km = 0;
    Object.keys(data.paths).forEach(function (key) {
      if (!lineOwns[key] || lineOwns[key] !== li) return;
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
    var rows = [
      { cells: ['Trains a day', String(trains.length)] },
      { cells: ['Down / up', down + ' / ' + (trains.length - down)] },
      { cells: ['Stations called at', String(Object.keys(stops).length)] },
      { cells: ['Track drawn', km >= 1 ? Math.round(km) + ' km' : '\u2014'] },
      { cells: ['First departure', firstT === null ? '\u2014' : fmt(firstT)] },
      { cells: ['Last departure', lastT === null ? '\u2014' : fmt(lastT)] },
    ];
    return {
      chip: 'Railway line', colour: inks[li] || '#555',
      primary: line.en,
      alt: line.n,
      /* Said, rather than left as a row of names. These are where the day's
         workings begin and end, which is not the same as the two ends of the
         line: the Yilan line's trains start or finish at six different places,
         and a bare list of six looked like a claim that it had six termini. */
      prov: Object.keys(ends).length
        ? 'Trains start or end at ' + Object.keys(ends).slice(0, 8).join('\u3001')
          + (Object.keys(ends).length > 8 ? '\u2026' : '')
        : '',
      /* What the line was. The history is sourced and the timings are
         measured from this transcription; the caption on the table below says
         which of the two the figures are, so the note does not have to carry
         the caveat as well as the prose. */
      note: line.d || '',
      head: 'A day on it, counted from the February ' + data.year + ' table',
      cols: ['', ''],
      rows: rows,
      link: line.a
        ? { page: cfg.page, anchor: line.a, text: 'The printed tables for this line' }
        : null,
    };
  }

  /* Which line owns each stretch of track, worked out once with the drawing so
     the line card can add up its own length without walking the trains again. */
  var lineOwns = {};

  /* ----------------------------------------------------------------- bar --

     The controls, over the map rather than in the Layers panel: they are used
     while looking at the thing they move, and a reader should not have to open
     a dialog to stop the clock. It is removed with the layer, so nothing is
     left on screen advertising a thing that is no longer there. */
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
    data.lines.forEach(function (l) {
      var chip = el('span', 'train-chip');
      var sw = el('span', 'sw');
      sw.style.background = inks[data.lines.indexOf(l)] || l.c;
      chips.push({ el: sw, li: data.lines.indexOf(l) });
      chip.appendChild(sw);
      chip.appendChild(document.createTextNode(l.en));
      chip.title = l.en + '   ' + l.n;
      legend.appendChild(chip);
    });

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
    row2.appendChild(note);
    row2.appendChild(link);
    bar.appendChild(row);
    bar.appendChild(row2);
    host.stage().appendChild(bar);
    /* The map keeps its names out from under the floating panels, and this is
       one of them: without saying so, every label along the south coast would
       be lettered underneath it. */
    host.obstacle(bar, true);
  }

  /* -------------------------------------------------------- the stations --

     What called here, in the order it called. Departures and arrivals both:
     a terminus has no departure to give and printing nothing for Takao would
     be saying no train ever reached it.

     A through train appears in the source once per line it is timed on, so the
     same working turns up twice at a junction — once on the trunk line's table
     and once on the branch's. Same number, same minute: one row. */
  /* A line as the card should show it: its names and its table anchor from
     the source, and the colour it is actually drawn in rather than the one the
     source names — otherwise the swatch in the card and the line on the map
     are two different colours for the same railway. */
  function lineFor(li) {
    var l = data.lines[li];
    if (!l) return null;
    return { n: l.n, en: l.en, a: l.a, d: l.d, c: inks[li] || l.c };
  }

  function departures(sid) {
    if (!byStation) return null;
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
        rows.push({
          t: ((dep !== null && dep !== undefined) ? dep : arr) % DAY,
          key: t.no + '|' + (((dep !== null && dep !== undefined) ? dep : arr) % DAY),
          cells: [(dep !== null && dep !== undefined) ? fmt(dep) : '',
                  (arr !== null && arr !== undefined) ? fmt(arr) : '',
                  t.no,
                  line ? line.en.replace(/ Line$/, '') + ' '
                         + (t.dir ? '\u2191' : '\u2193') : '',
                  t.dest || ''],
          swatchAt: 3,
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
      cols: ['Dep', 'Arr', 'Train', 'Line', 'To'],
      rows: rows,
      link: lines[0] && lines[0].a
        ? { page: cfg.page, anchor: lines[0].a,
            text: 'The printed table for this line' }
        : null,
    };
  }

  /* ---------------------------------------------------------------- api --- */

  var api = {
    /* Bring the interface up over one system. Everything here is built once
       per mount and thrown away on unmount: a reader who zooms out has said
       they are done with it, and a layer kept alive off screen is a layer
       being rescaled and re-rendered for nobody. */
    mount: function (conf) {
      if (cfg) return api.stats;
      cfg = conf;
      data = conf.data;
      segCache = {};
      byStation = {};
      data.stations.forEach(function (s, i) {
        if (s.sid) byStation[s.sid] = i;
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
      inks = []; linePaths = []; casePaths = []; chips = []; groundNow = '';
      shownClock = '';
    },

    mounted: function () { return !!cfg; },
    system: function () { return cfg ? cfg.sys : ''; },
    playing: function () { return playing; },

    /* The zoom changed. The lines look after themselves — a non-scaling stroke
       is already in screen pixels — but a train is a circle in map units, and
       without this it is a speck at one zoom and a blot at the next. */
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

    /* THE READER CHANGED PROJECTION.
     *
     * `reprojectDocument` in map.js walks every path in the document, so the
     * coloured track moves with everything else and this layer needs no help
     * with it. The trains do: their positions come from `segCache`, which
     * holds points already *projected*, and those are now answers to a
     * question about a different map. Thrown away and asked again — the source
     * coordinates are longitude and latitude and have not moved. */
    reprojected: function () {
      if (!cfg) return;
      segCache = {};
      /* The paths themselves are moved by `reprojectDocument`, but the points
         kept here for the pointer are not in the document and nothing else
         will touch them. Asked again from longitude and latitude, which have
         not moved. */
      lineGeom.forEach(function (g) {
        var pair = g.key.split('|');
        var seg = segment(+pair[0], +pair[1]);
        if (seg) g.pts = seg.p;
      });
      render();
    },

    /* Does this map's station stand on a line in the timetable?
     *
     * 153 of the map's 199 Taiwanese stations do. The other 46 are in the
     * table of stations and not in the table of trains — built after February
     * 1936, or on a stretch this transcription does not cover — and while the
     * tools are open they are squares that answer no question the tools can
     * ask. `false` for anything unknown, so the caller can use it as a filter
     * without checking whether a system is up. */
    serves: function (sid) {
      return !!(byStation && sid && byStation[sid] !== undefined);
    },

    hitAt: hitAt,
    trainCard: trainCard,
    lineCard: lineCard,

    departures: departures,
    recolour: recolour,
    stats: null,
  };

  return api;
};
