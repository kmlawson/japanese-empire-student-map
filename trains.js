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
  var byName = null;                   // the characters -> the station record
  var simMin = DEFAULT_MIN;
  /* THE CONNECTIONS ARE OFF UNTIL THEY HAVE A SOURCE. A line whose track is a
     straight chord between city points (`x` on the line record: Korea's
     Manchurian and Japanese connections and its ferries) is built with the
     rest but hidden — its track, its trains, its chip and its rows in a
     station's card — until the reader ticks the box in the bar. The setting
     is remembered in this browser. When the alignments arrive the flag goes
     and so does the switch. */
  var connOn = false;
  /* The words on the fold button, both of them, set when the strip is built
     because one of them names the network. Null until then. */
  var moreWords = null;
  try { connOn = localStorage.getItem('jem-train-conn') === '1'; } catch (e) {}
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

  /* THE TRACK AS COORDINATES, NOT AS A DRAWING.
   *
   * `segment` above hands back map units, because what it is for is putting a
   * train on the screen. A reader who wants the line in QGIS wants the other
   * thing: longitude and latitude, as the source has them, before any
   * projection and before the thinning the drawing does. So this reads the
   * same two places `segment` reads — the traced path between a pair of
   * stations, or the pair of stations themselves where nothing was traced —
   * and returns the numbers rather than the picture.
   *
   * `data.paths` is a flat array of lon, lat, lon, lat as the build wrote it,
   * which is the whole reason it can be handed out unchanged. */
  function pairCoords(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var flat = data.paths[lo + '|' + hi];
    var pts = [], i;
    if (flat) {
      /* Dropping a point that repeats the one before it. The source traces a
         stretch from station to station and the snapped station node often
         repeats the first vertex of the track, so an exported line came out
         with 262 duplicate pairs in Taiwan alone. A zero-length segment is
         not wrong, exactly, but it is noise in every tool that reads the
         file and it makes a length sum need cleaning first. */
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

  /* One line, as one feature. The stretches are the pairs of consecutive
     stops the trains of this line actually ran between — `lineOwns` is what
     decides whose a shared stretch is, the same answer the colour on screen
     gives — so the file and the drawing agree by construction rather than by
     being kept in step.
     `straight` counts the stretches with no traced track under them, drawn as
     a chord between two stations; a reader plotting this needs to know which
     part of it is a survey and which is an assertion that two places were
     joined. */
  /* **A survey and an assertion are not the same line, and a file should not
     mix them.**

     Most of a stretch is traced along the line GIS. Some of it is a chord: two
     points across country, drawn because the source could not place the stops
     between, or because there is no drawn railway there at all. The Korean
     bundle is the case that matters — it is the 1938 Korea/Manchuria/Japan
     timetable, and 82 of its 86 chords run to stations in Manchuria and the
     home islands, where this map has no railway geometry whatever. Hailar to
     Manzhouli is a thousand kilometres from anything drawn.

     Those chords are what a reader sees as long straight lines cutting across
     the map, and they cannot be made to follow a railway that is not there. So
     they come out as **a feature of their own**, with `geometry_kind: 'chord'`,
     which a reader can style differently or drop outright. The traced part
     keeps the line's name and is what the line actually was. */
  /* A stretch is a chord if trains.js had to draw it straight (no path at all)
     **or** if the source's own "path" is two points across open country. The
     second is the common case and the one that was missed: the Korean bundle
     stores its 86 chords as two-point entries in `paths`, so a test of
     `!data.paths[k]` calls them traced and the file claims a survey it does
     not have.

     Three kilometres is the same threshold `tools/rail_route.py` uses to
     decide that a two-point trace is a chord worth rerouting rather than a
     genuinely short hop between adjacent stations. */
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

  /* The same line as one or two features: what was surveyed, and — kept
     apart — what was only asserted. This is what the downloads use; the single
     `lineFeature` above is left as it was for anything that wants one shape. */
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
  /* Which line owns each stretch, counted from the timetable — the original
     derivation, kept because it is the definition and because the build's
     precomputed answer is held against it by tools/test/owns.js. */
  function deriveOwns(d) {
    d = d || data;
    var use = {};                     // "lo|hi" -> counts per line
    /* THE SEQUENCE IS THE ONE THE TRAINS RUN, NOT THE ONE THE TABLE PRINTS.
       22 of the 187 stations have no coordinate, and joining only the pairs
       that are consecutive in the table left a hole in the track wherever one
       of them stood — the trunk line broke either side of Takao, at Yamashita
       and Sankaisho, and read as two lines that did not meet. Dropping the
       stations that cannot be placed and joining what is left across them
       closes it: 181 stretches of track instead of 156, and all but four of
       them still traced rather than drawn straight. */
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

  /* **AND THE TRACK IS DRAWN WITHOUT THE TIMETABLE.**

     `deriveOwns` above walks every stop of every train, which for Korea is
     21,789 rows — so the *drawing* used to wait on a 455 KB file it needed
     one derived fact from. The build writes that fact into the geometry now
     (`owns`, about 6 KB for Korea; see tools/trains_split.py) and the
     timetable is fetched only when the reader asks it something.

     The derivation stays as the fallback, for a bundle built before the split
     and as the thing the test compares against. */
  function buildLines() {
    /* `sharedN` — how many stretches more than one line ran over — is counted
       by the same pass and shipped beside `owns`, so the stat the mount
       reports is the measured figure either way rather than a sentinel. */
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
      /* A line whose alignment is unsourced — the Manchurian and Japanese
         connections, drawn straight between city points — is drawn at half
         strength, so the eye reads it as a diagram of where the trains went
         and not as a survey of where the track lay. Opacity rather than a
         dash, because a dash array is in map units and would have to be
         rewritten on every zoom; see the rule in CLAUDE.md. */
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
    applyConn();
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
  /* ------------------------------------------------- the timetable half ---

     THE TRACK IS ON SCREEN AND THE TIMES ARE NOT HERE YET.

     Four things in this module ask the timetable a question: the clock
     (`buildPlans`, which is what puts a mark on a running train), the line
     card's figures, a station's departures, and `showPick`, which pulls the
     view back far enough to hold a line the reader has just named. Nothing
     else does — the track, the colours, the station squares and the names in
     the strip are all drawn from the geometry.

     So all four go through here. `needTimes` says whether the answer can be
     given now, and asks the host to fetch the file if it cannot; `setTimes`
     is what the host calls when it lands, and it is responsible for going
     back over whatever was left half-answered.

     A fetch that fails leaves `data.trains` unset and every caller keeps
     saying *not yet*, which is honest. Saying so out loud is map.js's job,
     because it is the one that knows a `<script>` failed — it calls
     `api.timesFailed` on the way, which is only there to drop the latch below
     so the reader can try again. */
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
    /* Whatever the reader asked for while it was coming. A card is reopened
       rather than patched: it was built from a different set of facts and
       half of it did not exist. */
    if (playWanted) { playWanted = false; setPlaying(true); }
    /* And only if that line is still the one lit: a reader who picked another
       in the meantime, or let go of the first, is not asking for this. */
    if (fitWanted) { fitWanted = false; if (pickLi >= 0) showPick(); }
    if (host.timesArrived) host.timesArrived();
  }

  /* What the strip says while it waits, and what it says once it has stopped
     waiting. One sentence in the count's place — the reader is looking at a
     drawn network, not an error. */
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
    if (line) bits.push(lineName(t.li, true));
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
            : s === '1.2' ? '1st & 2nd class'
            : s === '1.2.3' || s === '1.23' ? '1st, 2nd & 3rd class'
            : s;
    return /急/.test(cls) ? out + ', express' : out;
  }

  /* One frame. Only the trains that are running are in the document: a mark is
     made the first time its train is needed and hidden, not destroyed, when it
     has arrived — the day is a loop and it will be wanted again. */
  /* Which line the reader has picked out of the strip, or -1 for all of them.
     Held here rather than in a class on the document because `render` has to
     ask it on every frame for the marks. */
  var pickLi = -1;

  function applyPick() {
    /* Written on the elements rather than left to a stylesheet rule: the line
       a path belongs to is held in `linePaths`, not on the node, and a
       selector cannot ask about it. The halo goes with its line. */
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

  /* **And it flashes on the way in.** A line picked out of a strip of forty is
     often a short one on ground the reader is not looking at, and dimming the
     other thirty-nine is a change they may not see. The picked line is drawn
     heavy for a moment and settles back — the same idea as the railway button's
     flash, and for the same reason: a press that changes nothing visible reads
     as a press that did not work. */
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

  /* **And the whole of it is brought on screen.** A line picked out of the
     strip is very often one the reader is not looking at — Korea lists
     seventy-odd and most of them are somewhere else — so the view pulls back
     far enough to hold it. Only ever *back*: `fitBox` leaves a view that
     already contains the line alone, which matters because the commonest use
     is picking out the line you are already reading. */
  function showPick() {
    if (pickLi < 0 || !host.fitBox) return;
    /* **Where the line ran is a question for the timetable**, so this cannot
       be answered yet — and the reader pressing a line's name has asked to be
       shown it, which is a request worth honouring late rather than dropping.
       Remembered here and done in `setTimes`, the same as the play button. */
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
    /* The view first, then the light: a flash on ground that is about to be
       replaced is a flash nobody sees. */
    showPick();
    applyPick();
    flashPick();
    /* **And the card that names what was just lit.** Pressing the track on the
       map has always opened the line's card; pressing its name in the strip
       lit the line and said nothing, so the two halves of the same act
       answered differently. Reported. Only on the way *on* — letting a line go
       is not a request to read about it, and closing the card there would take
       away whatever the reader had opened next. */
    if (pickLi >= 0 && host.showCard) {
      var card = lineCard(pickLi);
      if (card) host.showCard(card);
    }
  }

  function isConnTrain(t) {
    var l = data && data.lines[t.li];
    return !!(l && l.x);
  }

  /* Fold the connection names away, or let them out. One function so that the
     class, the words on the button and what it tells a screen reader are set
     in the same breath; they were set in three places and had already
     disagreed once. */
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
    /* **And switching them off puts the list back.** The button is hidden with
       them — see styles.css — so a reader who had opened the list and then
       switched the connections off would have no way to close it again, and
       switching them back on would show it already open with a button offering
       to open it. `foldConn` is the one place the class and the words are set
       together, so the two cannot drift apart. */
    if (!connOn) foldConn(true);
  }

  function setConn(on) {
    connOn = !!on;
    try { localStorage.setItem('jem-train-conn', connOn ? '1' : '0'); } catch (e) {}
    applyConn();
    render();
    /* **The switch changes how far the tools reach, and the map has to hear
       about it.** With the connections on, the track runs into Japan, and the
       station squares over that ground are then squares on a drawn line; with
       them off, they are squares on nothing. Both facts are the host's to act
       on — it owns the layers — and nothing here was telling it, so Japan's
       station row stayed hidden until some unrelated change re-synced it, and
       the squares stayed drawn after the connections had gone. */
    if (host.connChanged) host.connChanged(connOn);
  }

  function render() {
    var k = lastK;
    var live = 0;
    for (var i = 0; i < plans.length; i++) {
      var plan = plans[i];
      var m = marks[i];
      var pos = null;
      /* A train that left before midnight and arrives after it is timed past
         1440 in the source, so the clock is asked twice: once as the minute it
         is, and once as that minute a day later. */
      if (isConnTrain(plan.tr)) {
        if (!connOn) { livePos[i] = null; if (m) m.style.display = 'none'; continue; }
      }
      if (simMin >= plan.t0 && simMin <= plan.t1) pos = positionAt(plan, simMin);
      if (!pos && simMin + DAY >= plan.t0 && simMin + DAY <= plan.t1) {
        pos = positionAt(plan, simMin + DAY);
      }
      /* And the trains of the lines that are not picked go with their track:
         a lit line with somebody else's trains running over it is not a line
         picked out. */
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
    /* **Press play and the timetable is fetched, then it plays.** The reader
       has asked for the one thing the file is for, so the press is remembered
       and honoured rather than refused — `setTimes` calls back in here. The
       button shows ▶ meanwhile, because it has not started. */
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

  /* **Every line under the press, not only the nearest.**
   *
   * Where several run together — out of Keijō, along the Gyeongbu trunk, down
   * the Taiwan west coast — `hitAt` answers with whichever happens to be a
   * pixel closer, and the reader who wanted the other one has no way to say
   * so. This hands back all of them, nearest first, so map.js can offer the
   * same little menu the air routes have. Measured against the same radius
   * `hitAt` uses, so a line that would not have answered a press does not
   * appear in the list. */
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

  /* ------------------------------------------------------------- cards --

     Data, not markup. What a card looks like is map.js's business — it owns
     `#info` and every other card in it — so these hand back the same shape the
     station departures do and are drawn by the same code. */

  function stationName(i) {
    var st = data.stations[i];
    return st ? st.n : '';
  }

  /* A station's three names, as the map holds them: the characters, the
     local romanisation, and the Japanese one. Blank where there is none — 166
     of the 187 stops in this timetable have a pinyin and 124 a reading, and an
     empty cell is the honest answer for the rest rather than a romanisation
     worked out from the characters, which for a great many of these names
     would be wrong. */
  function stationNames(i) {
    var st = data.stations[i] || {};
    return [st.n || '', st.py || '', st.ro || ''];
  }

  /* ------------------------------------------------------ naming a place --

     THE RULE, WHICH IS THE MAP'S AND NOT THIS MODULE'S.

         the local romanisation, or the Japanese one if the reader has asked
         for Japanese names, and the characters in brackets after it

     Local means Mandarin here and will mean McCune-Reischauer when Korea gets
     a timetable, so what this asks for is `local` and `en` in the sense the
     rest of map.js uses them — never "pinyin" — and the switch is read from
     the map rather than kept here.

     A name with no romanisation of the kind wanted falls back to the
     characters alone. That is why the brackets are conditional: 山下町 has
     neither a pinyin nor a reading in this table, and `(山下町)` after nothing
     would be a bracket round the whole answer. */
  function placeName(st) {
    if (!st) return '';
    var want = host.jpNames() ? (st.ro || st.py) : (st.py || st.ro);
    if (!want) return st.n || '';
    return st.n ? want + ' (' + st.n + ')' : want;
  }

  function stationLabel(i) { return placeName(data.stations[i]); }

  /* And a line is named the same way. In English by default, because that is
     what the rest of the map calls a thing it has an English name for, and in
     the Japanese reading when the switch is on — J\u016bkansen rather than
     Trunk Line — with the characters after it either way. */
  function lineName(li, withChars) {
    var l = data.lines[li];
    if (!l) return '';
    /* **The characters switch reaches the lines too.** It says *when
       available, show labels and names in Kanji/Hanzi/Hanja*, and the strip
       was answering in romanisation whatever it was set to — 京釜線 read
       "Gyeongbu Line" beside a map lettered in characters. Reported. `l.n` is
       the line's own characters where the source prints them, so where there
       are none the romanised name stands, which is what *when available*
       means. One function, so the chips, the cards, the tooltip and the
       exported feature all follow at once. */
    if (host.hanLabels && host.hanLabels() && l.n) return l.n;
    var head = host.jpNames() ? (l.ja || l.en) : l.en;
    return withChars && l.n ? head + ' ' + l.n : head;
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

  /* A line: what it was, and the shape of a day on it. Every figure here is
     counted from the timetable rather than quoted from anywhere, so it says
     what this transcription holds and not what the railway was — the two
     differ wherever the source is short of a station or a working. */
  /* The same card, minus everything the timetable would have told us. It says
     what it is, what it is called, what the line was, and one sentence saying
     the rest is coming — which is more use than a blank panel and much more
     use than nothing happening when the reader presses the track. It is
     replaced by the full card when the file lands; see `timesArrived`. */
  /* **A FERRY IS NOT A RAILWAY AND ITS CARD MUST NOT READ AS ONE.**
   *
   * Four of the connections in the Korean tables are sailings — the Kanmon and
   * Kanpu straits, the Tsugaru crossing to Hakodate, and the Kum estuary — and
   * they were being described in the words the railway cards use: "Railway
   * line", "Trains start or end at", "Trains a day", "Track drawn", "stations
   * on the line". The Seikan ferry does not have track and nothing sails along
   * it that is a train. Reported with a screenshot of exactly that card.
   *
   * The source names them, so nothing has to be inferred: a Japanese line name
   * ending 連絡船 is a ferry, and 連絡線 is the Kum estuary crossing, which the
   * timetable also works as a boat. */
  function isFerry(line) {
    var n = (line && line.n) || '';
    return /\u9023\u7d61\u8239$/.test(n) || /\u9023\u7d61\u7dda$/.test(n);
  }

  /* The words a card uses, so a sailing is described as one. Everything else
     on these two cards is the same shape and goes through the same renderer. */
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
    /* Every figure below is counted from the timetable, so there is no short
       version of this card to show without it. The name and the note are
       what the geometry knows, and they are worth more than nothing while
       the file is on its way. */
    if (!needTimes()) return waitingCard(li, line);
    var trains = data.trains.filter(function (t) { return t.li === li; });
    var down = trains.filter(function (t) { return !t.dir; }).length;
    var stops = {};
    /* **Every station on the line, and how many of its trains stopped.** The
       tally above says how many stations were called at; a reader looking at a
       line wants to know *which*, and which of them were the busy ones. A
       station counts a train when that train's row for it carries a time of
       its own — a row flagged as passing without stopping, or timed from
       another line's table, is on the line but is not a call. */
    var calls = {};
    /* And the order to print them in: the longest stop list on the line, which
       is the line's own order as the table prints it. A station no train of
       this line reaches is not on this line. */
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
    /* The length of the track this line is drawn on, in kilometres, added up
       from the traced geometry rather than from the distance column of the
       printed table — which is a running total from the head of each table and
       does not survive being cut into stretches. */
    var km = 0;
    Object.keys(data.paths).forEach(function (key) {
      /* **Not `!lineOwns[key] ||`, which skipped line 0.** A stretch belongs to
         a line index, and index 0 is a real line — the Trunk Line in Taiwan,
         the Gyeongbu in Korea — so a falsy test read "owned by the first line"
         as "owned by nobody" and left that line's own track out of its own
         total. Every network has a line 0 and every one of them was
         undercounted. An absent key is `undefined`, which is already not equal
         to any index, so the guard was never needed for what it was there for. */
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
    /* The stations themselves, in the line's own order, each with the number
       of this line's trains that stopped there. Every station the line reaches
       is listed whether or not every train calls: a line is its stations, and
       the gaps in the column are what an express looks like. */
    var stopList = order.filter(function (ix, i) {
      return order.indexOf(ix) === i;
    }).map(function (ix) {
      return placeName(data.stations[ix]) + ' (' + (calls[ix] || 0) + ')';
    });
    return {
      /* So the card can offer this line's own geometry; see
         `renderTrainBlock` in map.js. */
      geoLi: li,
      chip: W.chip, colour: inks[li] || '#555',
      primary: lineName(li, false),
      alt: line.n,
      /* Said, rather than left as a row of names. These are where the day's
         workings begin and end, which is not the same as the two ends of the
         line: the Yilan line's trains start or finish at six different places,
         and a bare list of six looked like a claim that it had six termini. */
      prov: Object.keys(ends).length
        ? W.ends
          + Object.keys(ends).slice(0, 8)
              .map(function (n) { return placeName(byName[n]); })
              .join('\u3001')
          + (Object.keys(ends).length > 8 ? '\u2026' : '')
        : '',
      /* What the line was. The history is sourced and the timings are
         measured from this transcription; the caption on the table below says
         which of the two the figures are, so the note does not have to carry
         the caveat as well as the prose. */
      note: (line.d || '') + (line.x
        ? (isFerry(line)
             ? ' The map draws this crossing straight between the ports; the course the boats actually steered is not yet sourced.'
             : ' The map draws this line straight between the cities it can place; the track\'s real alignment is not yet sourced.')
        : ''),
      head: W.head + (data.issued || data.year) + ' table',
      cols: ['', ''],
      rows: rows,
      /* Under the figures rather than in them: it is a list, not a table, and
         at forty-odd stations it wants to wrap. The number in brackets is how
         many of the line's trains stopped there. */
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
      /* **Press the name and the line lights up.** Forty-two chips in a strip
         and forty-two lines on the map is a matching exercise the reader
         should not have to do by colour alone — several of these inks are a
         shade apart. Pressing one dims every other line and its trains;
         pressing it again, or pressing another, moves the light. A press is
         used rather than a hover because there is no hover on a touch screen
         and this is most wanted on the small map. */
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
    /* **THE CONNECTIONS ARE FOLDED AWAY UNTIL ASKED FOR.**
     *
     * Korea's own network is 42 lines and the connections are another 32, so
     * switching them on more than doubled the legend and buried the lines the
     * reader came for. They are hidden by a class on the legend and a button
     * under the names reveals them — the switch above says whether they are
     * *drawn*, this says whether their names are *listed*, and the button only
     * appears when there is something to list. */
    var connChips = data.lines.filter(function (l) { return l.x; }).length;
    if (connChips) {
      /* The two words the button says, and they are a pair: one names what
         pressing it will add, the other what pressing it again will leave.
         "Show fewer" said neither — a reader who had opened the list was told
         only that there was a smaller version of it, not that the smaller one
         was the network they came for. */
      var homeName = host.home ? host.home(cfg && cfg.sys) : '';
      moreWords = {
        open: 'More lines',
        /* The possessive, which is what the rest of the map says: the button
           beside it already reads "Korea's railways". It is also the only form
           that works for all four — Karafuto has no adjective. */
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

    /* The switch, only where there is something for it to switch. */
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
    // the bar exists now, so the connections switch can be applied to it
    applyConn();
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
    return { n: l.n, en: l.en, a: l.a, d: l.d, w: l.w, wl: l.wl,
             c: inks[li] || l.c };
  }

  /* Where a train was going, in all three: the characters, the Mandarin and
     the Japanese reading. One cell rather than three columns — this table is
     already five wide and lives in a card 283 px across — so the three are set
     on one line and allowed to wrap. */
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
    /* Null is what map.js already does the right thing with — the station's
       card is drawn without a timetable block rather than with an empty one —
       so the fetch is asked for and the card is refreshed when it lands, by
       `timesArrived`. */
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
      /* The fetch that may still be out belongs to the system being taken
         down: leaving these set would have the next mount believe a file was
         already on its way, and refuse to ask for its own. */
      timesPending = false;
      playWanted = false;
      fitWanted = false;
    },

    /* The timetable has landed. map.js hands it over rather than writing into
       the bundle, so a system whose tools have already been taken down while
       the file was in flight simply drops it — `cfg` is null and this returns. */
    setTimes: setTimes,
    hasTimes: function () { return haveTimes(); },

    /* **WHERE THE DRAWN NETWORK ACTUALLY IS, WHICH IS NOT ITS COUNTRY.**

       `TRAIN_SYS` gives each system a box, and for three networks that was a
       true statement of where their track lay. Korea's is not any more: its
       connections are traced along the real Tōkaidō and Tōhoku now, so the
       drawn network reaches Honshū while the box still says Korea. The tools
       were unmounted the moment anything asked the question over Japan — and
       nothing asked it while the reader was merely panning, so they survived
       the pan and died on the next layer switch, which read as turning cities
       on breaking the train tools.

       So map.js asks the module where it is instead. Only the stations of
       lines that are *shown*: with the connections switched off this is the
       home network again and the range contracts with it, which is what the
       switch means. */
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

    /* **The fetch failed, and the reader must be able to try again.**
       `timesPending` stops a second request going out while one is in flight,
       and without this it would stay set for the life of the mount: a reader
       who lost the connection for a moment would press play, get nothing, and
       have no way back short of zooming out and in again. map.js calls this
       from its own failure path — `loadScript` forgets a failed load, so the
       next press really does re-fetch rather than replaying the failure. */
    timesFailed: function () {
      timesPending = false;
      playWanted = false;
      fitWanted = false;
      syncWaiting();
    },

    /* **For tools/test/trains.js, and for nothing the map does.**
     *
     * The build precomputes `owns` and the drawing reads it, so the rule that
     * used to be enforced by running is now enforced by a Python
     * reimplementation of it in tools/trains_split.py. Two copies of a rule
     * drift, and this one drifts silently: a stretch given to the wrong line
     * is a slightly wrong colour on a network of eight hundred, which nobody
     * would report. Exposed so the test can hold the built answer against the
     * derived one rather than keeping a third copy of the rule itself. */
    deriveOwns: deriveOwns,

    mounted: function () { return !!cfg; },
    system: function () { return cfg ? cfg.sys : ''; },
    /* Whether the extended network is drawn. map.js needs it to know how far
       the tools reach: with the connections on, the track runs into Japan and
       Manchuria, and the station squares over that ground are then squares on
       a line the reader can see. `bounds()` above already contracts and
       expands with this switch; this is the switch itself, for the questions
       that are about the state rather than the extent. */
    connOn: function () { return !!(cfg && connOn); },
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
    linesAt: linesAt,
    trainCard: trainCard,
    lineCard: lineCard,

    /* The geometry, for taking away. One line, or every line this system
       draws — the second is what the reader gets from a right click when the
       tools are not up and there is no one line under the pointer. */
    lineFeature: lineFeature,
    systemFeatures: function () {
      var out = [];
      (data.lines || []).forEach(function (l, i) {
        lineFeatures(i).forEach(function (f) { out.push(f); });
      });
      return out;
    },

    /* One line, split into the surveyed part and the asserted part. */
    lineFeatures: function (li) { return lineFeatures(li); },

    /* The reader turned Japanese names on or off. Every name this module puts
       on the screen follows that switch, so the strip's line chips are
       relettered — the cards are refilled by map.js, which owns them. */
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

    /* The map presses a line too, and wants the same light on it. */
    pick: function (li) { if (bar) setPick(li, li >= 0); return pickLi; },
    departures: departures,
    recolour: recolour,
    connections: function (on) { if (on !== undefined) setConn(on); return connOn; },
    stats: null,
  };

  return api;
};
