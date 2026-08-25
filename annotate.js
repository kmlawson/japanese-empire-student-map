/* Annotations: a reader's own marks on the map.
 *
 * Loaded only when somebody asks for it — from Layers, or because the address
 * carries a shared set. A reader who never annotates never fetches this file,
 * which is why it is a file and not another eight thousand lines of `map.js`.
 *
 * `map.js` hands it a small host object and takes back a handful of hooks;
 * nothing here reaches into the map's internals and nothing there knows what
 * a feature is.
 *
 * WHERE THE STYLING LIVES. GeoJSON says nothing about how a feature should
 * look, and the question has one good answer: **simplestyle-spec**, which
 * QGIS, geojson.io, GitHub's GeoJSON preview, Mapbox and the Leaflet plugins
 * all read. It is plain members of `properties`, so it survives a tool that
 * has never heard of it rather than being stripped as foreign:
 *
 *     title, description
 *     marker-color, marker-size, marker-symbol
 *     stroke, stroke-width, stroke-opacity
 *     fill, fill-opacity
 *
 * Two things the spec has no word for are kept in members of our own, prefixed
 * so that nobody mistakes them for standard: `jem-dash` for a dashed line, and
 * the diamond-versus-dot distinction, which rides in `marker-symbol` because
 * the spec leaves that open to any string. Anything else opening the file sees
 * a marker with an unfamiliar symbol and draws its default, which is the right
 * failure.
 */
(function () {
  'use strict';

  window.JMAP_ANNOTATE = function (host) {
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) {
      return Array.prototype.slice.call((r || document).querySelectorAll(s));
    };

    /* What this map will read. The ceiling was 24 MB and 240,000 points,
       which is not a limit so much as an absence of one: at that size the SVG
       is hundreds of thousands of nodes and the browser stops being able to
       pan. 6 MB and 60,000 points is the size at which the map still behaves
       — `tools/cache/india-rivers.geojson`, this project's own and one of the
       larger files anybody will hand it, is 354 KB and 14,851 points, a
       quarter of the ceiling. A file past it is refused with both numbers, so
       the reader can see how far past it they are. */
    var ANN_MAX_BYTES = 6 * 1024 * 1024;
    var ANN_MAX_VERTS = 60000;
    /* And past this, a set arrives with its names switched off. Sixty
       thousand points may be forty thousand names, and a map wearing forty
       thousand names is a grey mat with a coastline somewhere under it. */
    var ANN_QUIET_FEATURES = 40;
    var ANN_QUIET_VERTS = 4000;
    /* How much GeoJSON will go in a link. Browsers differ, and so do the
       servers and chat clients that pass a URL along; 6,000 characters of
       payload keeps the whole address near 6.2 KB, which everything in use
       accepts and which survives being pasted into mail. */
    var ANN_URL_MAX = 6000;
    var ANN_STORE = 'jem-annotations-v1';
    /* Where a set that arrived by link is kept while the reader still has work
       of their own in the ordinary place. See `shadowed`. */
    var ANN_STORE_SHARED = 'jem-annotations-shared-v1';
    var ANN_UNDO_MAX = 40;

    /* simplestyle-spec leaves `marker-symbol` open to any string, so these
       ride in it and anything else opening the file draws its own default. */
    var SYMBOLS = ['circle', 'ring', 'square', 'triangle', 'down-triangle',
                   'diamond', 'star', 'cross', 'plus', 'pin'];
    var PALETTE = ['#1b1b1b', '#8c2f39', '#1f5c7a', '#5b7d3a', '#7a4a86', '#a8642a'];

    var on = false;                 // the panel is up
    var tool = null;                // point | event | line | polygon
    var feats = [];                 // GeoJSON features, lon/lat
    var draft = null;               // the shape being drawn
    var sel = -1;                   // which feature the fields belong to
    var group = null;               // the SVG group they are drawn in
    var labelGroup = null;
    var sourceName = '';            // the file a loaded set came from
    var undoStack = [];
    var linkCode = null;            // the packed set, kept ready for the click
    var linkDirty = true;
    var dragging = null;            // {feat, ring, index} while a mark is moved
    /* The reader's own saved set, standing aside while a shared link is being
       looked at. Following a classmate's link used to overwrite it silently:
       `fromUrl` skipped the restore offer, `loadText` replaced everything and
       `store()` wrote it over the top, with no dialog and nothing said. Now
       their work is left exactly where it is and the shared set is kept under
       a key of its own until they choose. */
    var shadowed = null;
    /* Locked: the marks are on the map and nothing can move them. This is how
       a shared link opens, because the reader who followed it came to look,
       and a set somebody else made is the last thing that should lose a point
       to a stray press. Hover still names a mark — reading is not editing. */
    var locked = false;
    var editBtn = null;
    /* Whether there is work in memory that has not been written to a file.
       Loading a file or saving one clears it; drawing, moving or deleting
       sets it. It is what the leaving-the-page warning is armed on. */
    var dirty = false;
    var panel, msgEl, listEl, hintEl, drawEl, bodyEl, msgTimer = 0;

    /* ------------------------------------------------------------ state -- */

    function snapshot() {
      undoStack.push(JSON.stringify({ f: feats, s: sourceName }));
      if (undoStack.length > ANN_UNDO_MAX) undoStack.shift();
    }

    function undo() {
      /* While a shape is being drawn, undo means the last corner — not the
         whole shape, and not the feature before it. A reader who has clicked
         nine corners and misplaced the tenth wants the tenth back, and taking
         the lot was an answer to a question nobody asked. */
      if (draft && draft.pts.length) {
        draft.pts.pop();
        if (!draft.pts.length) {
          cancelDraft();
          say('That was the first point, so the shape is gone. Pick a tool to start again.');
        } else {
          redraw();
          say(draft.pts.length + ' point' + (draft.pts.length === 1 ? '' : 's') + ' left.');
        }
        return;
      }
      if (!undoStack.length) { say('Nothing left to undo.', 'bad'); return; }
      var was = JSON.parse(undoStack.pop());
      feats = was.f;
      sourceName = was.s;
      if (sel >= feats.length) sel = feats.length - 1;
      changed(true);
      say('Undone.');
    }

    /* Everything that has to happen after the set changes, in one place so
       that no path can forget one of them. `quiet` skips the undo snapshot,
       for the callers that took one themselves. */
    function changed(quiet) {
      linkDirty = true;
      setDirty(feats.length > 0);
      syncFields();
      drawList();
      redraw();
      store();
      if (!quiet) { /* callers snapshot before they mutate */ }
      schedulePack();
    }

    /* Packing is deflate, and a description is typed a letter at a time; a
       quarter of a second after the last one is soon enough for a counter and
       spares the reader's machine forty compressions of the same set. */
    var packTimer = 0;
    function schedulePack() {
      if (packTimer) window.clearTimeout(packTimer);
      packTimer = window.setTimeout(function () { packTimer = 0; prepLink(); }, 250);
    }

    /* THE WARNING ON LEAVING, and why it is not the greedy kind.

       `beforeunload` is abused often enough that browsers have rules about it:
       the handler is ignored unless the reader has interacted with the page,
       and the message is the browser's own rather than anything we write. Both
       suit us. A reader who has drawn something has interacted by definition,
       and the listener is **added only while there is unsaved work and removed
       the moment there is not** — so somebody who saves, or who never draws,
       or who is only looking at a shared set, is never stopped. That is the
       difference between a guard and a nuisance. */
    function setDirty(yes) {
      if (dirty === yes) return;
      dirty = yes;
      if (yes) window.addEventListener('beforeunload', beforeUnload);
      else window.removeEventListener('beforeunload', beforeUnload);
    }

    function beforeUnload(e) {
      if (!dirty) return undefined;
      e.preventDefault();
      e.returnValue = '';          // the browser writes its own words
      return '';
    }

    function store() {
      var key = shadowed ? ANN_STORE_SHARED : ANN_STORE;
      try {
        if (!feats.length) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key,
          JSON.stringify({ f: feats, s: sourceName, t: Date.now() }));
      } catch (err) { /* private mode, or a full quota: not worth a message */ }
    }

    function restore() {
      try {
        var raw = window.localStorage.getItem(ANN_STORE);
        if (!raw) return null;
        var o = JSON.parse(raw);
        return o && Array.isArray(o.f) && o.f.length ? o : null;
      } catch (err) { return null; }
    }

    /* ------------------------------------------------------------ style -- */

    function pct(id, dflt) {
      var el = $(id);
      if (!el) return dflt;
      var v = parseInt(el.value, 10);
      return isFinite(v) ? Math.max(0, Math.min(100, v)) / 100 : dflt;
    }

    function styleNow() {
      return {
        colour: ($('#ann-colour') || {}).value || '#1b1b1b',
        size: (function () {
          var v = parseInt(($('#ann-size') || {}).value, 10);
          return isFinite(v) ? v : 3;         // 0 is a weight, not a missing one
        }()),
        alpha: pct('#ann-opacity', 1),
        fillAlpha: pct('#ann-fillop', 0.28),
        head: ($('#ann-head') || {}).value || 'triangle',
        curve: (function () {
          var el = $('#ann-curve');
          if (!el) return 0;
          var v = parseInt(el.value, 10);
          return isFinite(v) ? v / 100 : 0;
        }()),
        dash: ($('#ann-dash') || {}).value || '',
        symbol: ($('#ann-symbol') || {}).value || 'circle',
      };
    }

    function props(kind, st) {
      var p = {
        title: '', description: '',
        stroke: st.colour,
        'stroke-width': st.size,
        'stroke-opacity': st.alpha,
      };
      if (kind === 'point') {
        p['marker-color'] = st.colour;
        p['marker-size'] = st.size <= 2 ? 'small' : (st.size >= 5 ? 'large' : 'medium');
        p['marker-symbol'] = st.symbol;
        // simplestyle has no opacity for a marker, so ours is prefixed
        if (st.alpha < 1) p['jem-marker-opacity'] = st.alpha;
      }
      if (kind === 'polygon') {
        p.fill = st.colour;
        p['fill-opacity'] = st.fillAlpha;
      }
      if ((kind === 'line' || kind === 'arrow') && st.dash) p['jem-dash'] = st.dash;
      if (kind === 'arrow') {
        p['jem-kind'] = 'arrow';
        p['jem-arrow-head'] = st.head;
        p['jem-curve'] = st.curve;
      }
      return p;
    }

    /* What a feature is, from its geometry alone.

       It used to read `marker-symbol === 'diamond'` as "this is an event", so
       that the Event tool could be told apart from the Point tool. That made
       choosing the diamond shape a **one-way door**: the feature became an
       event, `styleChanged` writes a symbol only for a point, and every later
       change of shape was silently ignored. Picking diamond and then star was
       the reported case, and star had nothing to do with it — it is simply the
       next one along in the menu.

       There is no Event tool now, so there is nothing to tell apart. A diamond
       is a shape like any other, and a file that arrives with `marker-symbol:
       diamond` draws a diamond, which is what it asked for. */
    function kindOf(f) {
      var t = (f.geometry || {}).type;
      if (t === 'Point' || t === 'MultiPoint') return 'point';
      if (t === 'LineString' || t === 'MultiLineString') {
        // an arrow is a two-point line that says so; anything reading the file
        // without knowing the word draws the line, which is the right failure
        return (f.properties || {})['jem-kind'] === 'arrow' ? 'arrow' : 'line';
      }
      return 'polygon';
    }

    /* --------------------------------------------------- what it measures -- */

    var R_EARTH = 6371.0088;                 // km, the mean radius
    var RAD = Math.PI / 180;

    function haversine(a, b) {
      var dLat = (b[1] - a[1]) * RAD, dLon = (b[0] - a[0]) * RAD;
      var s = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD)
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(s)));
    }

    /* The spherical excess, which is what a polygon on a globe actually
       encloses. Planar shoelace on longitude and latitude would call a shape
       in Hokkaido a third smaller than the same shape on the equator, which
       for a map whose whole point is that Mercator lies about area would be a
       poor thing to do in its own annotations. */
    function sphericalArea(ring) {
      if (ring.length < 3) return 0;
      var total = 0;
      for (var i = 0; i < ring.length; i++) {
        var a = ring[i], b = ring[(i + 1) % ring.length];
        total += (b[0] - a[0]) * RAD * (2 + Math.sin(a[1] * RAD) + Math.sin(b[1] * RAD));
      }
      return Math.abs(total * R_EARTH * R_EARTH / 2);
    }

    function measureOf(f) {
      var kind = kindOf(f);
      var rings = ringsOf(f.geometry);
      // an arrow is a line for this purpose: what it says is how far it reaches
      if (kind === 'line' || kind === 'arrow') {
        var km = 0;
        rings.forEach(function (r) {
          for (var i = 1; i < r.length; i++) km += haversine(r[i - 1], r[i]);
        });
        return km >= 10 ? Math.round(km).toLocaleString() + ' km'
          : (Math.round(km * 10) / 10) + ' km';
      }
      if (kind === 'polygon') {
        var km2 = 0;
        rings.forEach(function (r) { km2 += sphericalArea(r); });
        return Math.round(km2).toLocaleString() + ' km²';
      }
      var pt = rings[0] && rings[0][0];
      if (!pt) return '';
      return fmtLat(pt[1]) + ', ' + fmtLon(pt[0]);
    }

    function fmtLat(v) {
      return Math.abs(Math.round(v * 100) / 100) + '°' + (v < 0 ? 'S' : 'N');
    }
    function fmtLon(v) {
      var w = ((v + 180) % 360 + 360) % 360 - 180;
      return Math.abs(Math.round(w * 100) / 100) + '°' + (w < 0 ? 'W' : 'E');
    }

    /* ---------------------------------------------------------- drawing -- */

    /* Every ring of a geometry, whatever its type, as arrays of [lon, lat].
       One shape of code for the seven geometry types, so a file from anywhere
       — a Natural Earth export, a QGIS layer, one of this map's own caches —
       draws without a special case for each. */
    function ringsOf(g) {
      if (!g) return [];
      var t = g.type, c = g.coordinates;
      if (t === 'Point') return [[c]];
      if (t === 'MultiPoint' || t === 'LineString') return [c];
      if (t === 'MultiLineString' || t === 'Polygon') return c;
      if (t === 'MultiPolygon') {
        return c.reduce(function (a, poly) { return a.concat(poly); }, []);
      }
      if (t === 'GeometryCollection') {
        return (g.geometries || []).reduce(function (a, s) { return a.concat(ringsOf(s)); }, []);
      }
      return [];
    }

    /* An arrow, in projected units: where it starts, where it ends, the
       control point of the quadratic that bends it, and the apex a reader
       drags to bend it further.

       `curve` is a signed fraction of the arrow's own length, so a bend keeps
       its shape as the map is zoomed and as the projection changes — which a
       control point stored in map units would not. */
    function arrowGeom(f) {
      var c = (f.geometry || {}).coordinates || [];
      if (c.length < 2 || !ok2(c[0]) || !ok2(c[1])) return null;
      var a = host.project(c[0][0], c[0][1]);
      var b2 = host.project(c[1][0], c[1][1]);
      var bend = parseFloat((f.properties || {})['jem-curve']);
      if (!isFinite(bend)) bend = 0;
      var dx = b2.x - a.x, dy = b2.y - a.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var mx = (a.x + b2.x) / 2, my = (a.y + b2.y) / 2;
      // the perpendicular, which is what "one way or the other" means
      var px = -dy / len, py = dx / len;
      var ctrl = { x: mx + px * bend * len, y: my + py * bend * len };
      // a quadratic at t = 0.5
      var apex = { x: (a.x + 2 * ctrl.x + b2.x) / 4,
                   y: (a.y + 2 * ctrl.y + b2.y) / 4 };
      return { a: a, b: b2, ctrl: ctrl, apex: apex, len: len, bend: bend };
    }

    /* The head, drawn at the end and turned along the tangent there. It is a
       scalable, so it stays the size it was drawn at whatever the zoom — the
       same as the stroke it belongs to, which is `non-scaling-stroke`. A head
       in map units would grow while its own line did not. */
    function arrowHead(g, kind, colour, width, alpha, cls) {
      if (kind === 'none') return null;
      var ang = Math.atan2(g.b.y - g.ctrl.y, g.b.x - g.ctrl.x) * 180 / Math.PI;
      var r = 4 + width * 1.7;
      var wrap = host.svgEl('g', { 'class': 'ann-mark ann-head ' + cls });
      var turn = host.svgEl('g', { transform: 'rotate(' + (Math.round(ang * 10) / 10) + ')' });
      var el;
      if (kind === 'dot') {
        el = host.svgEl('circle', { r: r * 0.6, fill: colour, 'fill-opacity': alpha });
      } else if (kind === 'line') {
        el = host.svgEl('path', {
          d: 'M' + (-r) + ' ' + (-r * 0.72) + 'L0 0L' + (-r) + ' ' + (r * 0.72),
          fill: 'none', stroke: colour, 'stroke-width': Math.max(1.4, width),
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          'stroke-opacity': alpha });
      } else if (kind === 'barbed') {
        el = host.svgEl('path', {
          d: 'M0 0L' + (-r * 1.25) + ' ' + (-r * 0.7) + 'L' + (-r * 0.72) + ' 0L'
             + (-r * 1.25) + ' ' + (r * 0.7) + 'Z',
          fill: colour, 'fill-opacity': alpha });
      } else {
        el = host.svgEl('path', {
          d: 'M0 0L' + (-r * 1.15) + ' ' + (-r * 0.62) + 'L' + (-r * 1.15) + ' '
             + (r * 0.62) + 'Z',
          fill: colour, 'fill-opacity': alpha });
      }
      turn.appendChild(el);
      wrap.appendChild(turn);
      host.addScalable({ el: wrap, x: g.b.x, y: g.b.y });
      return wrap;
    }

    function pathFor(ring, close) {
      var d = '';
      for (var i = 0; i < ring.length; i++) {
        var q = host.project(ring[i][0], ring[i][1]);
        d += (i ? 'L' : 'M') + (Math.round(q.x * 100) / 100) + ' ' + (Math.round(q.y * 100) / 100);
      }
      return d + (close ? 'Z' : '');
    }

    /* Every mark carries a pale casing so that a dark one reads over dark
       ground and a pale one over pale — the same trick the mandate lines use.
       The two open shapes, `cross` and `plus`, have no fill to put a casing
       round, so they are drawn twice instead: a thick light stroke under a
       thin coloured one. */
    function markerShape(symbol, r, colour, alpha) {
      var g = host.svgEl('g', {});
      /* A point at no weight draws nothing and is still there: a name that
         belongs at a place, with no dot competing with the map under it. It
         keeps a transparent disc so it can still be pointed at, moved and
         deleted — an annotation nobody can reach is not an annotation. */
      if (r <= 2.7) {
        g.appendChild(host.svgEl('circle', { r: 9, fill: 'transparent', stroke: 'none' }));
        g.setAttribute('class', 'ann-ghost');
        return g;
      }
      var solid = function (attrs) {
        attrs.fill = colour;
        attrs.stroke = '#fffdf8';
        attrs['stroke-width'] = 1.2;
        attrs['fill-opacity'] = alpha;
        attrs['stroke-opacity'] = Math.min(1, alpha + 0.15);
        g.appendChild(host.svgEl(symbol === 'square' ? 'rect' : 'path', attrs));
        return g;
      };
      var open = function (d, w) {
        g.appendChild(host.svgEl('path', { d: d, fill: 'none', stroke: '#fffdf8',
          'stroke-width': w + 2, 'stroke-linecap': 'round', 'stroke-opacity': alpha }));
        g.appendChild(host.svgEl('path', { d: d, fill: 'none', stroke: colour,
          'stroke-width': w, 'stroke-linecap': 'round', 'stroke-opacity': alpha }));
        return g;
      };
      var poly = function (pts) {
        return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join('') + 'Z';
      };
      switch (symbol) {
        case 'ring':
          g.appendChild(host.svgEl('circle', { r: r, fill: 'none', stroke: '#fffdf8',
            'stroke-width': r * 0.85 + 2, 'stroke-opacity': alpha * 0.9 }));
          g.appendChild(host.svgEl('circle', { r: r, fill: 'none', stroke: colour,
            'stroke-width': r * 0.85, 'stroke-opacity': alpha }));
          return g;
        case 'square':
          return solid({ x: -r * 0.85, y: -r * 0.85, width: r * 1.7, height: r * 1.7 });
        case 'triangle':
          return solid({ d: poly([[0, -r * 1.15], [r, r * 0.8], [-r, r * 0.8]]) });
        case 'down-triangle':
          return solid({ d: poly([[0, r * 1.15], [r, -r * 0.8], [-r, -r * 0.8]]) });
        case 'diamond':
          return solid({ d: poly([[0, -r], [r, 0], [0, r], [-r, 0]]) });
        case 'star': {
          var pts = [];
          for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var rr = i % 2 ? r * 0.46 : r * 1.2;
            pts.push([Math.round(Math.cos(a) * rr * 100) / 100,
                      Math.round(Math.sin(a) * rr * 100) / 100]);
          }
          return solid({ d: poly(pts) });
        }
        case 'cross':
          return open('M' + (-r) + ' ' + (-r) + 'L' + r + ' ' + r
                    + 'M' + r + ' ' + (-r) + 'L' + (-r) + ' ' + r, Math.max(1.6, r * 0.42));
        case 'plus':
          return open('M0 ' + (-r * 1.15) + 'L0 ' + (r * 1.15)
                    + 'M' + (-r * 1.15) + ' 0L' + (r * 1.15) + ' 0', Math.max(1.6, r * 0.42));
        case 'pin':
          // a teardrop standing on the point it marks, so the coordinate is the
          // tip and not the middle of a blob
          return solid({ d: 'M0 0C' + (-r * 1.5) + ' ' + (-r * 1.5) + ' ' + (-r) + ' ' + (-r * 2.9)
            + ' 0 ' + (-r * 2.9) + 'C' + r + ' ' + (-r * 2.9) + ' ' + (r * 1.5) + ' '
            + (-r * 1.5) + ' 0 0Z' });
        default:
          return solid({ d: 'M' + (-r) + ' 0A' + r + ' ' + r + ' 0 1 0 ' + r
            + ' 0A' + r + ' ' + r + ' 0 1 0 ' + (-r) + ' 0Z' });
      }
    }

    /* A mark at a place already projected — the arrow's ends and its bend
       handle are worked out in map units, and going back to longitude and
       latitude only to project them again would be a round trip for nothing. */
    function addMarkerAt(symbol, x, y, colour, size, cls, meta, alpha) {
      var g = host.svgEl('g', { 'class': 'ann-mark ' + cls });
      g.appendChild(markerShape(symbol, 2.6 + size * 0.9, colour,
        alpha === undefined ? 1 : alpha));
      host.addScalable({ el: g, x: x, y: y });
      if (meta) {
        g.setAttribute('data-ann', meta.i);
        g.setAttribute('data-ring', meta.r);
        g.setAttribute('data-vert', meta.v);
      }
      return g;
    }

    function addMarker(symbol, lon, lat, colour, size, cls, meta, alpha) {
      var g = host.svgEl('g', { 'class': 'ann-mark ' + cls });
      g.appendChild(markerShape(symbol, 2.6 + size * 0.9, colour,
        alpha === undefined ? 1 : alpha));
      var p = host.project(lon, lat);
      host.addScalable({ el: g, x: p.x, y: p.y });
      if (meta) {
        g.setAttribute('data-ann', meta.i);
        g.setAttribute('data-ring', meta.r);
        g.setAttribute('data-vert', meta.v);
      }
      return g;
    }

    function redraw() {
      var svg = host.svg();
      if (!svg) return;
      if (!group) {
        group = host.svgEl('g', { id: 'annotations' });
        labelGroup = host.svgEl('g', { id: 'ann-labels' });
        var before = svg.querySelector('#highlight') || null;
        if (before) { svg.insertBefore(group, before); svg.insertBefore(labelGroup, before); }
        else { svg.appendChild(group); svg.appendChild(labelGroup); }
      }
      // the constant-size marks are rebuilt with the rest, so their old
      // entries have to go or the map rescales a list of detached nodes
      host.dropScalables();
      group.innerHTML = '';
      labelGroup.innerHTML = '';
      group.style.display = on ? '' : 'none';
      labelGroup.style.display = on ? '' : 'none';
      if (!on) { host.rescale(); return; }

      feats.forEach(function (f, i) {
        var kind = kindOf(f);
        var p = f.properties || {};
        var colour = p['marker-color'] || p.stroke || '#1b1b1b';
        var width = parseFloat(p['stroke-width']);
        if (!isFinite(width)) width = 3;
        var cls = 'ann-f' + (i === sel ? ' sel' : '');
        var rings = ringsOf(f.geometry);

        if (kind === 'point') {
          var sym = p['marker-symbol'] || 'circle';
          var alpha = p['jem-marker-opacity'];
          if (alpha === undefined) alpha = p['stroke-opacity'];
          if (!isFinite(alpha)) alpha = 1;
          rings.forEach(function (ring, ri) {
            ring.forEach(function (pt, vi) {
              if (!ok2(pt)) return;
              group.appendChild(addMarker(sym, pt[0], pt[1], colour, width, cls,
                { i: i, r: ri, v: vi }, alpha));
            });
          });
        } else if (kind === 'arrow') {
          var g2 = arrowGeom(f);
          if (g2) {
            var attrs2 = {
              'class': 'ann-f ann-shape ann-arrow' + (i === sel ? ' sel' : ''),
              'data-ann': i, 'data-shape': '1',
              d: 'M' + r2(g2.a.x) + ' ' + r2(g2.a.y) + 'Q' + r2(g2.ctrl.x) + ' '
                 + r2(g2.ctrl.y) + ' ' + r2(g2.b.x) + ' ' + r2(g2.b.y),
              stroke: p.stroke || colour, 'stroke-width': width,
              'stroke-opacity': p['stroke-opacity'] === undefined ? 1 : p['stroke-opacity'],
              'stroke-linecap': 'round', fill: 'none',
            };
            var dp2 = dashFor(p['jem-dash'], width);
            if (dp2) { attrs2['stroke-dasharray'] = dp2; attrs2['stroke-linecap'] = 'round'; }
            group.appendChild(host.svgEl('path', attrs2));
            var head = arrowHead(g2, p['jem-arrow-head'] || 'triangle', colour, width,
              p['stroke-opacity'] === undefined ? 1 : p['stroke-opacity'],
              i === sel ? 'sel' : '');
            if (head) { head.setAttribute('data-ann', i); group.appendChild(head); }
            if (i === sel) {
              // the two ends, and the handle that bends it
              [[g2.a, 0], [g2.b, 1]].forEach(function (pair) {
                group.appendChild(addMarkerAt('circle', pair[0].x, pair[0].y, colour,
                  0.6, 'ann-vertex', { i: i, r: 0, v: pair[1] }));
              });
              group.appendChild(addMarkerAt('square', g2.apex.x, g2.apex.y, colour,
                0.6, 'ann-vertex ann-bend', { i: i, r: 0, v: 2 }));
            }
          }
        } else {
          var closed = kind === 'polygon';
          rings.forEach(function (ring) {
            if (ring.length < 2) return;
            var attrs = {
              'class': 'ann-f ann-shape' + (i === sel ? ' sel' : ''),
              'data-ann': i,
              'data-shape': '1',
              d: pathFor(ring, closed),
              stroke: p.stroke || colour,
              'stroke-width': width,
              'stroke-opacity': p['stroke-opacity'] === undefined ? 1 : p['stroke-opacity'],
              fill: closed ? (p.fill || colour) : 'none',
              'fill-opacity': closed ? (p['fill-opacity'] === undefined ? 0.28 : p['fill-opacity']) : 0,
            };
            var dp = dashFor(p['jem-dash'], width);
            if (dp) { attrs['stroke-dasharray'] = dp; attrs['stroke-linecap'] = 'round'; }
            group.appendChild(host.svgEl('path', attrs));
          });
          // the vertices of whichever shape is selected, so it can be reshaped
          if (i === sel) {
            rings.forEach(function (ring, ri) {
              ring.forEach(function (pt, vi) {
                if (!ok2(pt)) return;
                if (closed && vi === ring.length - 1) return;   // the repeated close
                group.appendChild(addMarker('circle', pt[0], pt[1], colour, 0.6,
                  'ann-vertex', { i: i, r: ri, v: vi }));
              });
            });
          }
        }
        addLabel(f, rings, colour);
      });

      // the shape under the pointer, while it is still being drawn
      if (draft && draft.pts.length) {
        var st = styleNow();
        if (draft.pts.length > 1) {
          group.appendChild(host.svgEl('path', {
            'class': 'ann-draft', d: pathFor(draft.pts, draft.kind === 'polygon'),
            stroke: st.colour, 'stroke-width': st.size, fill: 'none',
          }));
        }
        draft.pts.forEach(function (pt) {
          group.appendChild(addMarker('circle', pt[0], pt[1], st.colour, 0.6, 'ann-vertex'));
        });
      }
      host.rescale();
    }

    function ok2(c) {
      return Array.isArray(c) && isFinite(c[0]) && isFinite(c[1]);
    }

    function r2(v) { return Math.round(v * 100) / 100; }

    /* A dash pattern, scaled to the line's own weight so that a dotted hairline
       and a dotted heavy line read as the same pattern rather than as two
       different ones. `true` is what the checkbox this replaced used to write. */
    function dashFor(spec, w) {
      if (spec === true) spec = 'dashed';
      if (!spec) return null;
      var u = Math.max(1, w);
      switch (spec) {
        case 'dotted':   return (u * 0.1) + ' ' + (u * 1.8);
        case 'dash-dot': return (u * 3) + ' ' + (u * 1.6) + ' ' + (u * 0.1) + ' ' + (u * 1.6);
        case 'long':     return (u * 6) + ' ' + (u * 2.6);
        case 'fine':     return (u * 1.4) + ' ' + (u * 1.4);
        default:         return (u * 2.4) + ' ' + (u * 1.8);
      }
    }

    /* A name typed into the panel belongs on the map, or the reader is writing
       into a list and looking at anonymous dots. */
    function addLabel(f, rings, colour) {
      var name = ((f.properties || {}).title || '').toString().trim();
      if (!name || !$('#ann-names') || !$('#ann-names').checked) return;
      var pt = anchorOf(rings);
      if (!pt) return;
      var t = host.svgEl('text', { 'class': 'ann-label' });
      t.textContent = name.length > 40 ? name.slice(0, 39) + '…' : name;
      var p = host.project(pt[0], pt[1]);
      host.addScalable({ el: t, x: p.x, y: p.y, oy: 15 });
      labelGroup.appendChild(t);
    }

    /* Where a name hangs: on a point, the point; on anything else the middle
       of its own extent, which for a line is the middle of the line and not
       the middle of the box round it. */
    function anchorOf(rings) {
      var all = [];
      rings.forEach(function (r) { r.forEach(function (c) { if (ok2(c)) all.push(c); }); });
      if (!all.length) return null;
      if (all.length === 1) return all[0];
      var x = 0, y = 0;
      all.forEach(function (c) { x += c[0]; y += c[1]; });
      return [x / all.length, y / all.length];
    }

    /* ------------------------------------------------------------ tools -- */

    function setTool(t) {
      if (draft && draft.kind !== t) cancelDraft();
      tool = tool === t ? null : t;
      $$('.ann-tool').forEach(function (b) {
        var isOn = b.getAttribute('data-tool') === tool;
        b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        b.classList.toggle('on', isOn);
      });
      var c = host.container();
      if (c) c.classList.toggle('ann-drawing', !!tool);
      // on a phone the sheet stands back while a tool is out: a reader who has
      // said "point" wants the map, not the description field
      if (panel) panel.classList.toggle('tooling', !!tool);
      syncControls();
      hintEl.textContent = !tool
        ? (feats.length ? 'Pick a tool to add more, or a name below to edit one.'
                        : 'Pick a tool, then click the map.')
        : tool === 'point'
          ? 'Click the map to place it. The place you click names it for you.'
          : tool === 'arrow'
            ? 'Click where it starts, then where it points. Drag the square to bend it.'
            : 'Click each corner, then Finish. Enter finishes, Escape cancels.';
      if (!tool) cancelDraft();
    }

    /* Which style controls are worth showing. Shape belongs to a point and
       Fill to an area, and offering either against the other is offering a
       control that does nothing. What is on screen follows whichever is being
       worked on: the tool that is out, or failing that the feature selected. */
    function syncControls() {
      if (!panel) return;
      var kind = tool || (feats[sel] ? kindOf(feats[sel]) : null);
      var shape = $('#ann-shape-row'), fill = $('#ann-fill-row'), dash = $('#ann-dash-row');
      var head = $('#ann-head-row'), curve = $('#ann-curve-row');
      if (shape) shape.hidden = kind !== 'point';
      if (fill) fill.hidden = kind !== 'polygon';
      if (dash) dash.hidden = kind !== 'line' && kind !== 'arrow';
      if (head) head.hidden = kind !== 'arrow';
      if (curve) curve.hidden = kind !== 'arrow';
    }

    function cancelDraft() {
      draft = null;
      if (drawEl) drawEl.hidden = true;
      redraw();
    }

    /* The pointer over one of the reader's own marks: its name and its
       description, in the map's own tooltip.

       This is what makes the names switch a display choice rather than a loss.
       Forty thousand names written across a map are unreadable and a set that
       size arrives with them off — but every one of them is still *there*, and
       pointing at the mark says what it is. It is also the only way to read a
       description, which never goes on the map at any setting.

       Returns true when it has taken the pointer, so the country underneath is
       not named over the top of it. */
    function hover(target, cx, cy) {
      // reading is not editing, so this one works locked too
      if (!on || dragging) return false;
      var el = target && target.closest ? target.closest('[data-ann]') : null;
      if (!el) return false;
      var f = feats[parseInt(el.getAttribute('data-ann'), 10)];
      if (!f) return false;
      var p = f.properties || {};
      var name = (p.title || '').toString().trim();
      var short = (p['jem-short'] || '').toString().trim();
      var desc = (p.description || '').toString().trim();
      var meas = measureOf(f);
      if (!name) name = kindOf(f).charAt(0).toUpperCase() + kindOf(f).slice(1);
      /* The short line if there is one, and the first clause of the long one
         if there is not — the same rule the map's own sub-units follow. A
         description of two hundred words does not go under a pointer. */
      var line = short || (desc.length <= 90 ? desc : desc.split(/(?<=[.!?])\s/)[0]);
      if (line && line.length > 110) line = '';
      host.tip(name, [line, meas].filter(Boolean).join('  ·  '), cx, cy);
      return true;
    }

    /* A tap on the map. Returns true when it has taken it, so the map's own
       selection never also happens. */
    /* Which of the reader's own features the pointer is on, or -1. */
    function featUnder(target) {
      var el = target && target.closest ? target.closest('[data-ann]') : null;
      if (!el) return -1;
      var i = parseInt(el.getAttribute('data-ann'), 10);
      return feats[i] ? i : -1;
    }

    function tap(cx, cy, target) {
      if (!on || locked) return false;
      /* A press on one of the reader's own marks addresses **that mark**,
         whatever tool is out: it selects it, with its name and description in
         the fields, ready to edit.

         This used to hold only when no tool was armed, and the tool stays
         armed after a point is placed — so the ordinary way of working, place
         one and then adjust it, met a map that ignored the mark and put a
         second point on top of it. Placing happens on empty map now, which is
         where somebody who means to place is pointing anyway. */
      var hit = featUnder(target);
      if (hit >= 0) {
        sel = hit;
        syncFields();
        drawList();
        redraw();
        if (panel && panel.classList.contains('folded')) fold(false);
        showCard(feats[hit]);
        return true;
      }
      if (!tool) return false;
      var pt = host.clientToSvg(cx, cy);
      var ll = host.unproject(pt.x, pt.y);
      if (!isFinite(ll.lon) || !isFinite(ll.lat)) return true;
      var here = [round5(ll.lon), round5(ll.lat)];

      if (tool === 'point') {
        snapshot();
        var st = styleNow();
        var p = props(tool, st);
        // the place under the pointer names it, which is most of the typing a
        // reader would otherwise do on a map like this one
        var where = host.placeAt ? host.placeAt(cx, cy) : '';
        if (where) p.title = where;
        feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: here },
                     properties: p });
        sel = feats.length - 1;
        changed(true);
        say(where ? 'Placed on ' + where + '.' : 'Placed. Name it if you like.');
        return true;
      }
      if (!draft) draft = { kind: tool, pts: [] };
      draft.pts.push(here);
      // an arrow has a start and an end and nothing in between, so the second
      // press finishes it rather than waiting to be told
      if (tool === 'arrow' && draft.pts.length === 2) { finish(); return true; }
      if (drawEl) drawEl.hidden = false;
      redraw();
      return true;
    }

    function round5(v) { return Math.round(v * 1e5) / 1e5; }

    /* What a click on a mark puts in the detail card. */
    function showCard(f) {
      if (!f || !host.card) return;
      var p = f.properties || {};
      var title = (p.title || '').toString().trim()
        || (kindOf(f).charAt(0).toUpperCase() + kindOf(f).slice(1));
      host.card(title, (p['jem-short'] || '').toString().trim(),
        measureOf(f), (p.description || '').toString().trim());
    }

    function finish() {
      if (!draft) return;
      var pts = draft.pts, kind = draft.kind;
      var need = kind === 'polygon' ? 3 : 2;
      if (pts.length < need) {
        say(kind === 'polygon' ? 'An area needs at least three corners.'
                               : 'A line needs at least two points.', 'bad');
        return;
      }
      if (kind === 'arrow') pts = pts.slice(0, 2);
      snapshot();
      var st = styleNow();
      feats.push({
        type: 'Feature',
        geometry: kind === 'polygon'
          ? { type: 'Polygon', coordinates: [pts.concat([pts[0]])] }
          : { type: 'LineString', coordinates: pts.slice() },
        properties: props(kind, st),
      });
      sel = feats.length - 1;
      draft = null;
      if (drawEl) drawEl.hidden = true;
      changed(true);
      say('Added — ' + measureOf(feats[sel]) + '. Name it if you like.');
    }

    /* ------------------------------------------------- moving a mark ----- */

    /* A mark can be dragged. The map's own pan is what a drag normally means,
       so this only takes the pointer when it went down on a mark of ours and
       no tool is armed — otherwise dragging to reposition and dragging to pan
       would be the same gesture with two meanings. */
    var holdTimer = 0;
    var armed = null;                   // a press waiting to become a hold

    /* THE LONG PRESS. A mouse can grab a mark the moment it goes down, because
       a mouse has a second button and a cursor to say what is under it. A
       finger has neither, and every press on the map might be the start of a
       pan — so on a touch screen the press has to *wait*, and only becomes a
       move if the finger stays put for a third of a second.
       `HOLD_SLOP` is what "stays put" means: a finger never rests perfectly
       still, and 10 px is the wobble of a held thumb rather than the beginning
       of a drag.

       This is also what fixes moving a mark with a finger at all. `drag` used
       to be called only from the map's `mousemove` handler, which is wired
       only where a pointer can hover — so on a phone the press cancelled the
       pan and then did nothing. */
    var HOLD_MS = 330;
    var HOLD_SLOP = 10;

    function markUnder(target) {
      var el = target && target.closest ? target.closest('[data-ann]') : null;
      if (!el || !el.classList.contains('ann-mark')) return null;
      var i = parseInt(el.getAttribute('data-ann'), 10);
      var r = parseInt(el.getAttribute('data-ring'), 10);
      var v = parseInt(el.getAttribute('data-vert'), 10);
      if (!feats[i] || isNaN(r) || isNaN(v)) return null;
      return { i: i, r: r, v: v };
    }

    function beginDrag(what) {
      snapshot();
      dragging = { i: what.i, r: what.r, v: what.v, moved: false };
      sel = what.i;
      syncFields();
      drawList();
      redraw();
      var c = host.container();
      if (c) c.classList.add('ann-moving');
    }

    /* `coarse` says the press came from a finger: wait for it to become a
       hold. A mouse takes the mark at once, as it always did. */
    function grab(target, cx, cy, coarse) {
      // likewise a press that lands on a mark: it moves the mark, not the map,
      // even mid-drawing
      if (!on || locked) return false;
      var what = markUnder(target);
      if (!what) return false;
      if (!coarse) { beginDrag(what); return true; }
      armed = { what: what, x: cx, y: cy };
      if (holdTimer) window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(function () {
        holdTimer = 0;
        if (!armed) return;
        var a = armed;
        armed = null;
        beginDrag(a.what);
        say('Hold to move — drag it where you want it.');
      }, HOLD_MS);
      // the press is not taken yet: until the hold matures it is still the
      // map's, so a finger that moves away pans as it always did
      return false;
    }

    /* A press that wandered before the timer fired was a pan after all. */
    function held(cx, cy) {
      if (!armed) return;
      if (Math.abs(cx - armed.x) > HOLD_SLOP || Math.abs(cy - armed.y) > HOLD_SLOP) {
        armed = null;
        if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = 0; }
      }
    }

    function letGo() {
      armed = null;
      if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = 0; }
    }

    function drag(cx, cy) {
      if (!dragging) return false;
      var pt = host.clientToSvg(cx, cy);
      var ll = host.unproject(pt.x, pt.y);
      if (!isFinite(ll.lon) || !isFinite(ll.lat)) return true;
      var f = feats[dragging.i];
      if (!f) { dragging = null; return false; }
      var g = f.geometry;
      var here = [round5(ll.lon), round5(ll.lat)];
      if (kindOf(f) === 'arrow') {
        if (dragging.v === 2) {
          /* The bend. The apex of a quadratic at t = 0.5 is (a + 2c + b) / 4,
             so the control point that puts the apex under the pointer is
             c = (4·apex − a − b) / 2; the bend is how far that lies off the
             chord, as a fraction of the chord's own length, signed. */
          var ga = host.project(g.coordinates[0][0], g.coordinates[0][1]);
          var gb = host.project(g.coordinates[1][0], g.coordinates[1][1]);
          var cx2 = (4 * pt.x - ga.x - gb.x) / 2, cy2 = (4 * pt.y - ga.y - gb.y) / 2;
          var dx2 = gb.x - ga.x, dy2 = gb.y - ga.y;
          var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
          var off = ((cx2 - (ga.x + gb.x) / 2) * (-dy2 / len2)
                   + (cy2 - (ga.y + gb.y) / 2) * (dx2 / len2)) / len2;
          f.properties = f.properties || {};
          f.properties['jem-curve'] = Math.max(-2, Math.min(2, Math.round(off * 1000) / 1000));
        } else {
          g.coordinates[dragging.v] = here;
        }
        dragging.moved = true;
        redraw();
        return true;
      }
      if (g.type === 'Point') g.coordinates = here;
      else if (g.type === 'LineString') g.coordinates[dragging.v] = here;
      else if (g.type === 'MultiPoint') g.coordinates[dragging.v] = here;
      else if (g.type === 'Polygon') {
        var ring = g.coordinates[dragging.r];
        ring[dragging.v] = here;
        // a polygon's first and last point are the same point
        if (dragging.v === 0) ring[ring.length - 1] = here;
      } else { dragging = null; return false; }
      dragging.moved = true;
      redraw();
      return true;
    }

    function drop() {
      letGo();
      var c = host.container();
      if (c) c.classList.remove('ann-moving');
      if (!dragging) return false;
      var moved = dragging.moved, was = dragging.i;
      dragging = null;
      if (moved) { changed(true); say('Moved.'); }
      else {
        undoStack.pop();             // a press that never moved is not an edit
        /* A mouse takes a mark on the press, so a plain click on one never
           reaches `tap` — the map has already written the press off as a
           handle rather than a tap. Lifting it where it landed is that click,
           and it is where the card is opened; without this the description
           could be read with a finger and not with a mouse. */
        if (panel && panel.classList.contains('folded')) fold(false);
        showCard(feats[was]);
      }
      return moved;
    }

    /* -------------------------------------------------------- the list -- */

    function labelOf(f, i) {
      var p = f.properties || {};
      var name = (p.title || p.name || p.NAME || '').toString().trim();
      return name || (kindOf(f) + ' ' + (i + 1));
    }

    function drawList() {
      if (!listEl) return;
      listEl.innerHTML = '';
      feats.forEach(function (f, i) {
        var li = document.createElement('li');
        if (i === sel) li.className = 'sel';
        var pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'ann-pick';
        var name = document.createElement('span');
        name.className = 'ann-name';
        name.textContent = labelOf(f, i);
        var meas = document.createElement('span');
        meas.className = 'ann-meas';
        meas.textContent = measureOf(f);
        pick.appendChild(name);
        pick.appendChild(meas);
        pick.addEventListener('click', function () {
          sel = i; syncFields(); drawList(); redraw();
        });
        var go = document.createElement('button');
        go.type = 'button';
        go.className = 'ann-go';
        go.title = 'Move the map to it';
        go.setAttribute('aria-label', 'Move the map to ' + labelOf(f, i));
        go.textContent = '⌖';
        go.addEventListener('click', function () {
          sel = i; syncFields(); drawList(); redraw(); zoomTo([f]);
        });
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'ann-del';
        del.setAttribute('aria-label', 'Delete ' + labelOf(f, i));
        del.textContent = '×';
        del.addEventListener('click', function () { removeAt(i); });
        li.appendChild(pick);
        li.appendChild(go);
        li.appendChild(del);
        listEl.appendChild(li);
      });
      var none = !feats.length;
      ['#ann-save', '#ann-link', '#ann-clear', '#ann-fit'].forEach(function (s) {
        var b = $(s);
        if (b) b.disabled = none;
      });
      showEdit();
      if (none) {
        ['#ann-warn', '#ann-cap'].forEach(function (s) {
          var el = $(s);
          if (el) el.hidden = true;
        });
      }
      var count = $('#ann-count');
      if (count) {
        count.textContent = none ? ''
          : feats.length + (feats.length === 1 ? ' mark' : ' marks');
      }
    }

    /* One point out of a shape, rather than the whole shape.

       A line of five points that should have been four is otherwise a line to
       be drawn again from scratch. Below the minimum — two for a line, three
       for an area — there is no shape left to take a point from, so the whole
       feature goes and the message says so. */
    function removeVertex(i, r, v) {
      var f = feats[i];
      if (!f) return false;
      var g = f.geometry, kind = kindOf(f);
      if (kind === 'point') { removeAt(i); return true; }
      var ring, closed = false;
      if (g.type === 'LineString') ring = g.coordinates;
      else if (g.type === 'MultiPoint') ring = g.coordinates;
      else if (g.type === 'Polygon') { ring = g.coordinates[r]; closed = true; }
      else return false;                       // the Multi- forms: see the note
      if (!ring || v < 0 || v >= ring.length) return false;

      var real = closed ? ring.length - 1 : ring.length;   // the repeated close
      var least = closed ? 3 : 2;
      if (real <= least) {
        removeAt(i);
        say('That was its last ' + (closed ? 'corner' : 'point')
          + ' to spare, so the whole ' + kind + ' has gone. Undo brings it back.');
        return true;
      }
      snapshot();
      ring.splice(v, 1);
      if (closed) {
        // a polygon's first and last point are one point
        ring[ring.length - 1] = ring[0].slice();
      }
      changed(true);
      say('Point removed — ' + measureOf(f) + '. Undo brings it back.');
      return true;
    }

    /* A press on a mark, asking for it to go. Returns true when it took the
       press, so the map's own context menu never appears over it. */
    function rightClick(target) {
      // whatever tool is out: a right click on a mark is unambiguous
      if (!on || locked) return false;
      var el = target && target.closest ? target.closest('[data-ann]') : null;
      if (!el) return false;
      var i = parseInt(el.getAttribute('data-ann'), 10);
      if (!feats[i]) return false;
      if (el.classList.contains('ann-mark')) {
        var r = parseInt(el.getAttribute('data-ring'), 10);
        var v = parseInt(el.getAttribute('data-vert'), 10);
        if (!isNaN(r) && !isNaN(v)) return removeVertex(i, r, v);
      }
      removeAt(i);
      return true;
    }

    function removeAt(i) {
      if (!feats[i]) return;
      snapshot();
      feats.splice(i, 1);
      if (sel >= feats.length) sel = feats.length - 1;
      changed(true);
      say('Deleted. Undo brings it back.');
    }

    function syncFields() {
      var t = $('#ann-title'), d = $('#ann-desc'), sh = $('#ann-short'), f = feats[sel];
      if (!t || !d) return;
      t.value = f ? ((f.properties && f.properties.title) || '') : '';
      d.value = f ? ((f.properties && f.properties.description) || '') : '';
      if (sh) {
        sh.value = f ? ((f.properties && f.properties['jem-short']) || '') : '';
        sh.disabled = !f;
      }
      t.disabled = d.disabled = !f;
      var m = $('#ann-measure');
      if (m) m.textContent = f ? measureOf(f) : '';
      syncControls();
      // the style controls follow the selection, so that pressing a colour
      // after clicking a mark changes that mark and not only the next one
      if (f) {
        var p = f.properties || {};
        var col = $('#ann-colour'), sz = $('#ann-size'),
            op = $('#ann-opacity'), fop = $('#ann-fillop'),
            dash = $('#ann-dash'), sym = $('#ann-symbol');
        if (col && (p['marker-color'] || p.stroke)) col.value = p['marker-color'] || p.stroke;
        if (sz && isFinite(parseFloat(p['stroke-width']))) {
          sz.value = Math.max(0, Math.min(6, Math.round(parseFloat(p['stroke-width']))));
        }
        if (op) {
          var a = p['jem-marker-opacity'];
          if (a === undefined) a = p['stroke-opacity'];
          op.value = Math.round((isFinite(a) ? a : 1) * 100);
        }
        if (fop && p['fill-opacity'] !== undefined) {
          fop.value = Math.round(parseFloat(p['fill-opacity']) * 100);
        }
        if (dash) {
          // `true` is what the first version of this wrote, when it was a
          // checkbox; a file from then still means "dashed"
          var d0 = p['jem-dash'];
          dash.value = d0 === true ? 'dashed' : (d0 || '');
        }
        var hd = $('#ann-head'), cv = $('#ann-curve');
        if (hd && p['jem-arrow-head']) hd.value = p['jem-arrow-head'];
        if (cv && p['jem-curve'] !== undefined) {
          cv.value = Math.round(parseFloat(p['jem-curve']) * 100);
        }
        if (sym && p['marker-symbol'] && SYMBOLS.indexOf(p['marker-symbol']) >= 0) {
          sym.value = p['marker-symbol'];
        }
      }
    }

    function fieldChanged() {
      var f = feats[sel];
      if (!f) return;
      f.properties = f.properties || {};
      f.properties.title = ($('#ann-title') || {}).value || '';
      f.properties.description = ($('#ann-desc') || {}).value || '';
      /* simplestyle has `title` and `description` and no third thing, so the
         short line is ours and prefixed. It is what the pointer says; the
         description is what a click puts in the card, where every other
         description on this map is read. */
      var sh2 = ($('#ann-short') || {}).value || '';
      if (sh2) f.properties['jem-short'] = sh2; else delete f.properties['jem-short'];
      linkDirty = true;
      drawList();
      redraw();                    // the name on the map follows the field
      store();
      schedulePack();
    }

    function styleChanged() {
      var f = feats[sel];
      if (!f) return;
      var st = styleNow();
      var p = f.properties = f.properties || {};
      var kind = kindOf(f);
      p.stroke = st.colour;
      p['stroke-width'] = st.size;
      p['stroke-opacity'] = st.alpha;
      if (kind === 'point') {
        p['marker-color'] = st.colour;
        p['marker-size'] = st.size <= 2 ? 'small' : (st.size >= 5 ? 'large' : 'medium');
        p['marker-symbol'] = st.symbol;
        if (st.alpha < 1) p['jem-marker-opacity'] = st.alpha;
        else delete p['jem-marker-opacity'];
      }
      if (kind === 'polygon') {
        p.fill = st.colour;
        p['fill-opacity'] = st.fillAlpha;
      }
      if (kind === 'line' || kind === 'arrow') {
        if (st.dash) p['jem-dash'] = st.dash; else delete p['jem-dash'];
      }
      if (kind === 'arrow') {
        p['jem-arrow-head'] = st.head;
        p['jem-curve'] = st.curve;
      }
      linkDirty = true;
      redraw();
      store();
      schedulePack();
    }

    /* ---------------------------------------------- reading a file in -- */

    /* What is wrong with this GeoJSON, in a sentence a reader can act on, or
       null if there is nothing wrong with it. Every message names the thing it
       found: "invalid GeoJSON" tells somebody with a broken file nothing. */
    function problemWith(o) {
      if (o === null || typeof o !== 'object') return 'That file is not a GeoJSON object.';
      if (Array.isArray(o)) return 'That file is a bare array. GeoJSON needs a "type" — a FeatureCollection, a Feature, or a geometry.';
      if (typeof o.type !== 'string') return 'That file has no "type" member, so it is not GeoJSON.';
      var known = ['FeatureCollection', 'Feature', 'Point', 'MultiPoint', 'LineString',
                   'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
      if (known.indexOf(o.type) < 0) return 'Its type is "' + o.type + '", which is not a GeoJSON type.';
      if (o.type === 'FeatureCollection') {
        if (!Array.isArray(o.features)) return 'A FeatureCollection needs a "features" array; this one has none.';
        if (!o.features.length) return 'That file is an empty FeatureCollection — nothing to draw.';
        for (var i = 0; i < o.features.length; i++) {
          var f = o.features[i];
          if (!f || typeof f !== 'object') return 'Feature ' + (i + 1) + ' is not an object.';
          if (f.type !== 'Feature') return 'Item ' + (i + 1) + ' of "features" has type "' + f.type + '" and should be "Feature".';
          if (f.geometry !== null && !geomOK(f.geometry)) {
            return 'Feature ' + (i + 1) + ' has a geometry this map cannot read.';
          }
        }
        return null;
      }
      if (o.type === 'Feature') {
        if (o.geometry !== null && !geomOK(o.geometry)) return 'That feature has a geometry this map cannot read.';
        return null;
      }
      return geomOK(o) ? null : 'That geometry has no usable coordinates.';
    }

    function geomOK(g) {
      if (!g || typeof g !== 'object' || typeof g.type !== 'string') return false;
      if (g.type === 'GeometryCollection') {
        return Array.isArray(g.geometries) && g.geometries.every(geomOK);
      }
      if (!Array.isArray(g.coordinates)) return false;
      var rings = ringsOf(g);
      if (!rings.length) return false;
      for (var i = 0; i < rings.length; i++) {
        var r = rings[i];
        if (!Array.isArray(r)) return false;
        for (var j = 0; j < r.length; j++) {
          var c = r[j];
          if (ok2(c) && Math.abs(c[0]) <= 720 && Math.abs(c[1]) <= 90) return true;
        }
      }
      return false;
    }

    function countVerts(list) {
      var n = 0;
      list.forEach(function (f) { ringsOf(f.geometry).forEach(function (r) { n += r.length; }); });
      return n;
    }

    function toFeatures(o) {
      if (o.type === 'FeatureCollection') {
        return o.features.filter(function (f) { return f && f.geometry; });
      }
      if (o.type === 'Feature') return [o];
      return [{ type: 'Feature', geometry: o, properties: {} }];
    }

    /* Fill in what a foreign file has not got. A layer exported from QGIS has
       no simplestyle at all, so it would draw in a default and then save back
       styleless — this gives every feature one, and takes a name from
       whichever of the usual property spellings the file happens to use. */
    function adopt(list, offset) {
      return list.map(function (f, i) {
        var p = (f.properties && typeof f.properties === 'object') ? f.properties : {};
        var out = {};
        Object.keys(p).forEach(function (k) { out[k] = p[k]; });
        if (!out.title) {
          out.title = (p.title || p.name || p.NAME || p.Name || p.label || '').toString();
        }
        if (out.description === undefined) {
          out.description = (p.description || p.desc || p.note || '').toString();
        }
        var kind = kindOf({ geometry: f.geometry, properties: out });
        var colour = out.stroke || out['marker-color'] || PALETTE[(i + (offset || 0)) % PALETTE.length];
        if (!out.stroke) out.stroke = colour;
        if (out['stroke-width'] === undefined) out['stroke-width'] = 3;
        if (kind === 'point') {
          if (!out['marker-color']) out['marker-color'] = colour;
          if (!out['marker-size']) out['marker-size'] = 'medium';
        }
        if (kind === 'polygon') {
          if (!out.fill) out.fill = colour;
          if (out['fill-opacity'] === undefined) out['fill-opacity'] = 0.28;
        }
        return { type: 'Feature', geometry: f.geometry, properties: out };
      });
    }

    function boundsOf(list) {
      var b = null;
      list.forEach(function (f) {
        ringsOf(f.geometry).forEach(function (r) {
          r.forEach(function (c) {
            if (!ok2(c)) return;
            if (!b) b = { w: c[0], e: c[0], s: c[1], n: c[1] };
            else {
              if (c[0] < b.w) b.w = c[0];
              if (c[0] > b.e) b.e = c[0];
              if (c[1] < b.s) b.s = c[1];
              if (c[1] > b.n) b.n = c[1];
            }
          });
        });
      });
      return b;
    }

    function zoomTo(list) {
      var b = boundsOf(list || feats);
      if (!b) return false;
      // a single point has no extent, so it is given room rather than a
      // zero-width box the map would refuse
      var padLon = Math.max((b.e - b.w) * 0.12, 0.6);
      var padLat = Math.max((b.n - b.s) * 0.12, 0.6);
      return host.zoomToBox(b.w - padLon, b.s - padLat, b.e + padLon, b.n + padLat);
    }

    /* `merge` keeps what is already on the map and adds to it, which is what a
       reader who has drawn something and then opens a second file means. */
    function loadText(text, name, merge) {
      var o;
      try {
        o = JSON.parse(text);
      } catch (err) {
        var m = /position (\d+)/.exec(String(err.message || ''));
        say('That file is not valid JSON'
          + (m ? ', and the first thing wrong with it is at character ' + m[1] + '.' : '.')
          + ' Nothing was loaded.', 'bad');
        return false;
      }
      var bad = problemWith(o);
      if (bad) { say(bad + ' Nothing was loaded.', 'bad'); return false; }

      var list = toFeatures(o);
      if (!list.length) { say('That file has no features with geometry in it.', 'bad'); return false; }
      var verts = countVerts(list) + (merge ? countVerts(feats) : 0);
      if (verts > ANN_MAX_VERTS) {
        say('That would come to ' + verts.toLocaleString() + ' points across '
          + (list.length + (merge ? feats.length : 0)).toLocaleString() + ' features, past the '
          + ANN_MAX_VERTS.toLocaleString() + ' points this map will draw. '
          + 'Nothing was loaded — simplify it and try again.', 'bad');
        return false;
      }
      snapshot();
      if (locked) setLocked(false);
      var fresh = adopt(list, merge ? feats.length : 0);
      feats = merge ? feats.concat(fresh) : fresh;
      var quiet = feats.length > ANN_QUIET_FEATURES || countVerts(feats) > ANN_QUIET_VERTS;
      var names = $('#ann-names');
      if (quiet && names && names.checked) names.checked = false;
      if (!merge) sourceName = (name || '').replace(/\.(geo)?json$/i, '');
      sel = feats.length ? (merge ? feats.length - fresh.length : 0) : -1;
      changed(true);
      if (!merge) setDirty(false);       // it came off a disk; it is still there
      var zoomed = zoomTo(merge ? fresh : feats);
      say((merge ? 'Added ' : 'Loaded ') + fresh.length + ' feature'
        + (fresh.length === 1 ? '' : 's') + ' — ' + countVerts(fresh).toLocaleString()
        + ' point' + (countVerts(fresh) === 1 ? '' : 's')
        + (zoomed ? ', and the map has moved to them' : '')
        + (quiet ? '. Names are off — that is too many to write on the map at '
                 + 'once; switch "Names on the map" back on if you want them.' : '.'));
      return true;
    }

    function loadFile(file, merge) {
      if (!file) return;
      if (file.size > ANN_MAX_BYTES) {
        say('That file is ' + (file.size / 1048576).toFixed(1) + ' MB, past the '
          + Math.round(ANN_MAX_BYTES / 1048576) + ' MB this map will read. '
          + 'Cut it down in QGIS or split it, and load the parts.', 'bad');
        return;
      }
      var fr = new FileReader();
      fr.onerror = function () { say('That file could not be read.', 'bad'); };
      fr.onload = function () { loadText(String(fr.result), file.name, merge); };
      fr.readAsText(file);
    }

    /* ------------------------------------------------------ saving out -- */

    function collection() {
      return {
        type: 'FeatureCollection',
        properties: {
          generator: 'The Japanese Empire in Asia and the Pacific',
          style: 'simplestyle-spec',
        },
        features: feats,
      };
    }

    function stamp() {
      var d = new Date();
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate())
        + '-' + p(d.getHours()) + p(d.getMinutes());
    }

    function save() {
      if (!feats.length) { say('There is nothing to save yet.', 'bad'); return; }
      var name = (sourceName ? sourceName + '-' + stamp() : 'annotations-' + stamp()) + '.geojson';
      try {
        var blob = new Blob([JSON.stringify(collection(), null, 1)],
          { type: 'application/geo+json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
        setDirty(false);           // it is on disk now
        say('Saved as ' + name + '.');
      } catch (err) {
        say('The file could not be written: ' + (err.message || err), 'bad');
      }
    }

    /* ----------------------------------------------- a link that holds -- */

    function b64(bytes) {
      var s = '';
      for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function unB64(str) {
      var s = str.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      var bin = atob(s);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }

    /* Deflate where the browser has it, plain where it has not. The prefix
       says which, so a link made in one browser opens in another. GeoJSON is
       mostly punctuation and repeated property names, and deflate takes a
       typical set to about a fifth of its size — the difference between a link
       that fits and one that does not. */
    function pack(obj) {
      var bytes = new TextEncoder().encode(JSON.stringify(obj));
      if (!window.CompressionStream) return Promise.resolve('p' + b64(bytes));
      try {
        var stream = new Blob([bytes]).stream()
          .pipeThrough(new CompressionStream('deflate-raw'));
        return new Response(stream).arrayBuffer().then(function (buf) {
          return 'z' + b64(new Uint8Array(buf));
        });
      } catch (err) {
        return Promise.resolve('p' + b64(bytes));
      }
    }

    function unpack(code) {
      var head = code.charAt(0), body = code.slice(1);
      var bytes;
      try { bytes = unB64(body); }
      catch (err) { return Promise.reject(new Error('the link is damaged')); }
      if (head === 'p') return Promise.resolve(new TextDecoder().decode(bytes));
      if (head !== 'z') return Promise.reject(new Error('the link is in a form this map does not know'));
      if (!window.DecompressionStream) {
        return Promise.reject(new Error('this browser cannot read a compressed link'));
      }
      return new Response(new Blob([bytes]).stream()
        .pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }

    /* THE LINK IS PACKED BEFORE IT IS ASKED FOR, and this is the whole reason
       Copy link needed fixing. Deflating is asynchronous, and a clipboard
       write that happens after an `await` is outside the click that caused it:
       Safari refuses it outright, and the old code then fell back to
       `window.prompt`, which is a dialog a reader did not ask for and which
       some browsers suppress altogether. So the press does nothing but read a
       string that is already there — synchronous, inside the gesture, allowed
       everywhere. */
    function prepLink() {
      var warn = $('#ann-warn');
      if (!feats.length) {
        if (warn) warn.hidden = true;
        return;
      }
      if (!linkDirty) return;
      var mine = feats;
      pack(collection()).then(function (code) {
        if (feats !== mine) return;              // it changed again while we packed
        linkCode = code;
        linkDirty = false;
        tellLinkSize();
      }, function () { linkCode = null; });
    }

    /* Whether these will go in a link, said before the reader presses the
       button rather than after. A set loaded from a file is very often past
       it — `india-rivers` packs to 160,000 characters against a ceiling of
       6,000 — and being told that only on pressing Copy link is being told it
       at the wrong moment. The line names both numbers and how far over. */
    function tellLinkSize() {
      var warn = $('#ann-warn'), b = $('#ann-link');
      var cap = $('#ann-cap'), capText = $('#ann-cap-text'), bar = $('#ann-bar-fill');
      if (!warn || !b) return;
      if (!linkCode || !feats.length) {
        warn.hidden = true;
        if (cap) cap.hidden = true;
        return;
      }
      var over = linkCode.length > ANN_URL_MAX;
      b.classList.toggle('too-big', over);
      b.title = over
        ? 'Too much for a link — save the file instead'
        : 'Copy a link that carries these annotations';

      /* The running count. It is the *compressed* length, because that is what
         actually has to fit in an address — and it is why a counter is worth
         having rather than a count of features: a name and a description are
         characters too, and so is every vertex of a shape traced closely, so
         two readers with ten marks each can be a long way apart. Deflate also
         means the number does not climb evenly; a second description much like
         the first costs far less than the first did. */
      if (cap && capText && bar) {
        var share = Math.min(1, linkCode.length / ANN_URL_MAX);
        cap.hidden = false;
        cap.className = 'ann-cap' + (over ? ' over' : (share > 0.8 ? ' near' : ''));
        bar.style.width = Math.round(share * 100) + '%';
        capText.textContent = linkCode.length.toLocaleString() + ' / '
          + ANN_URL_MAX.toLocaleString() + ' for a link'
          + (over ? ' — file only' : '');
      }
      if (!over) {
        warn.hidden = true;
        return;
      }
      warn.hidden = false;
      warn.textContent = 'Too much for a link: these '
        + feats.length.toLocaleString() + ' features come to '
        + linkCode.length.toLocaleString() + ' characters compressed, '
        + Math.round(linkCode.length / ANN_URL_MAX) + '× the '
        + ANN_URL_MAX.toLocaleString() + ' an address can carry. '
        + 'Save file works; Copy link cannot. Fewer or simpler features would fit.';
    }

    function linkUrl() {
      var loc = window.location;
      var base = (loc.origin && loc.origin !== 'null' ? loc.origin : '') + loc.pathname;
      var q = [];
      new URLSearchParams(loc.search).forEach(function (v, k) {
        if (k !== 'ann') q.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      });
      q.push('ann=' + linkCode);
      return base + '?' + q.join('&');
    }

    function copyLink() {
      if (!feats.length) { say('There is nothing to put in a link yet.', 'bad'); return; }
      if (linkDirty || !linkCode) {
        // packing has not finished — do it, then show the field rather than
        // trying a clipboard write outside the gesture that will be refused
        prepLink();
        window.setTimeout(function () { showLink(true); }, 350);
        return;
      }
      if (linkCode.length > ANN_URL_MAX) {
        say('These annotations come to ' + linkCode.length.toLocaleString()
          + ' characters compressed, past the ' + ANN_URL_MAX.toLocaleString()
          + ' a link can carry. Save the file and send that instead.', 'bad');
        return;
      }
      var url = linkUrl();
      var told = 'Link copied — ' + url.length.toLocaleString()
        + ' characters. Anyone who opens it sees these annotations.';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // synchronous call inside the click: no await stands between them
        navigator.clipboard.writeText(url).then(function () {
          say(told);
          showLink(false);
        }, function () { showLink(true); });
      } else {
        showLink(true);
      }
    }

    /* The link, visible and selected, for when the clipboard refuses — and
       always available from the box itself. A field beats `window.prompt`:
       it cannot be suppressed, it can be read before it is copied, and it does
       not stop the page. */
    function showLink(because) {
      var box = $('#ann-link-out'), field = $('#ann-link-field');
      if (!box || !field) return;
      if (linkDirty || !linkCode) { say('The link is still being made — try again.', 'bad'); return; }
      if (linkCode.length > ANN_URL_MAX) {
        say('Too much for a link: ' + linkCode.length.toLocaleString()
          + ' characters against a limit of ' + ANN_URL_MAX.toLocaleString()
          + '. Save the file instead.', 'bad');
        return;
      }
      field.value = linkUrl();
      box.hidden = false;
      try { field.focus(); field.select(); } catch (err) { /* not fatal */ }
      if (because) say('Your browser would not write to the clipboard, so here is the link — it is selected, ready to copy.', 'bad');
    }

    /* --------------------------------------------------------- the panel -- */

    var PANEL = '' +
      '<div class="ann-head">' +
        '<button type="button" id="ann-fold" class="ann-foldbtn" aria-expanded="true">' +
          '<span class="caret"></span><strong>Annotations</strong>' +
          '<span id="ann-count" class="ann-count"></span></button>' +
        '<button type="button" id="ann-lock" aria-label="Lock the annotations" ' +
          'title="Lock: put the tools away and leave the marks on the map">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<rect x="5" y="11" width="14" height="9" rx="1.6"/>' +
          '<path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></button>' +
        '<button type="button" id="ann-close" aria-label="Close annotations">×</button>' +
      '</div>' +
      '<div class="ann-body">' +
        '<div class="ann-tools" role="group" aria-label="Drawing tools">' +
          '<button type="button" class="ann-tool" data-tool="point" aria-pressed="false">Point</button>' +

          '<button type="button" class="ann-tool" data-tool="arrow" aria-pressed="false">Arrow</button>' +
          '<button type="button" class="ann-tool" data-tool="line" aria-pressed="false">Line</button>' +
          '<button type="button" class="ann-tool" data-tool="polygon" aria-pressed="false">Area</button>' +
        '</div>' +
        '<p class="ann-hint" id="ann-hint">Pick a tool, then click the map.</p>' +
        '<div class="ann-drawing" hidden>' +
          '<button type="button" id="ann-finish">Finish</button>' +
          '<button type="button" id="ann-undo-pt" class="plain">Undo point</button>' +
          '<button type="button" id="ann-cancel" class="plain">Cancel</button>' +
        '</div>' +
        '<div class="ann-style">' +
          '<label>Colour <input type="color" id="ann-colour" value="#1b1b1b"></label>' +
          '<label>Weight <input type="range" id="ann-size" min="0" max="6" step="1" value="3"></label>' +
          '<label id="ann-shape-row">Shape <select id="ann-symbol">' +
            '<option value="circle">Dot</option>' +
            '<option value="ring">Ring</option>' +
            '<option value="square">Square</option>' +
            '<option value="triangle">Triangle</option>' +
            '<option value="down-triangle">Triangle, down</option>' +
            '<option value="diamond">Diamond</option>' +
            '<option value="star">Star</option>' +
            '<option value="cross">Cross</option>' +
            '<option value="plus">Plus</option>' +
            '<option value="pin">Pin</option>' +
          '</select></label>' +
          '<label>Opacity <input type="range" id="ann-opacity" min="10" max="100" step="5" value="100"></label>' +
          '<label id="ann-fill-row">Fill <input type="range" id="ann-fillop" min="0" max="100" step="5" value="28"></label>' +
          '<label id="ann-dash-row">Line <select id="ann-dash">' +
            '<option value="">Solid</option>' +
            '<option value="dashed">Dashed</option>' +
            '<option value="dotted">Dotted</option>' +
            '<option value="dash-dot">Dash-dot</option>' +
            '<option value="long">Long dash</option>' +
            '<option value="fine">Fine dash</option>' +
          '</select></label>' +
          '<label id="ann-head-row">Head <select id="ann-head">' +
            '<option value="triangle">Solid</option>' +
            '<option value="barbed">Barbed</option>' +
            '<option value="line">Open</option>' +
            '<option value="dot">Dot</option>' +
            '<option value="none">None</option>' +
          '</select></label>' +
          '<label id="ann-curve-row">Bend' +
            '<input type="range" id="ann-curve" min="-60" max="60" step="5" value="0"></label>' +
          '<label class="ann-check"><input type="checkbox" id="ann-names" checked> Names on the map</label>' +
        '</div>' +
        '<label class="ann-field">Name <input type="text" id="ann-title" maxlength="120" placeholder="What is it?"></label>' +
        '<label class="ann-field">Short note <input type="text" id="ann-short" maxlength="120" placeholder="A phrase, for the pointer"></label>' +
        '<label class="ann-field">Description <textarea id="ann-desc" rows="3" maxlength="2000" placeholder="The longer account, shown when it is clicked"></textarea></label>' +
        '<p class="ann-measure" id="ann-measure"></p>' +
        '<ul id="ann-list" aria-label="Your annotations"></ul>' +
        '<p class="ann-mine" id="ann-mine" hidden>' +
          '<button type="button" id="ann-mine-btn"></button></p>' +
        '<p class="ann-cap" id="ann-cap" hidden>' +
          '<span class="ann-bar"><i id="ann-bar-fill"></i></span>' +
          '<span id="ann-cap-text"></span></p>' +
        '<p class="ann-warn" id="ann-warn" hidden></p>' +
        '<div class="ann-actions">' +
          '<button type="button" id="ann-save">Save file</button>' +
          '<button type="button" id="ann-link">Copy link</button>' +
          '<button type="button" id="ann-fit" class="plain">Fit</button>' +
          '<button type="button" id="ann-undo" class="plain">Undo</button>' +
          '<button type="button" id="ann-add" class="plain">Add file…</button>' +
          '<button type="button" id="ann-clear" class="plain">Clear</button>' +
        '</div>' +
        '<div class="ann-link-out" id="ann-link-out" hidden>' +
          '<input type="text" id="ann-link-field" readonly aria-label="Shareable link">' +
        '</div>' +
        '<p class="ann-msg" id="ann-msg" role="status"></p>' +
      '</div>';

    function say(text, kind) {
      if (!msgEl) return;
      msgEl.textContent = text || '';
      msgEl.className = 'ann-msg' + (kind ? ' ' + kind : '');
      if (msgTimer) window.clearTimeout(msgTimer);
      if (text && kind !== 'bad') {
        msgTimer = window.setTimeout(function () {
          msgTimer = 0;
          if (msgEl.textContent === text) msgEl.textContent = '';
        }, 7000);
      }
      // a message a folded panel cannot show is a message nobody reads
      if (text && kind === 'bad' && panel && panel.classList.contains('folded')) fold(false);
    }

    function fold(yes) {
      if (!panel) return;
      panel.classList.toggle('folded', !!yes);
      var b = $('#ann-fold');
      if (b) b.setAttribute('aria-expanded', yes ? 'false' : 'true');
      if (yes) setTool(null);
    }

    /* The panel's own stylesheet, injected when the file loads. It is here
       rather than in `styles.css` for the same reason the code is here: a
       reader who never annotates should not download the rules for a panel
       they will never see. */
    var CSS = "/* ------------------------------------------------------------ annotations */\n\n/* The panel lives in the rail with the legend and the card. On a phone the\n   rail is a sheet over the map, which is the same place the card goes, and\n   the same rules carry it. */\n#annotate {\n  position: absolute;\n  left: max(10px, var(--safe-l));\n  top: 10px;\n  width: min(46vw, 280px);\n  max-height: calc(100% - 20px);\n  overflow-y: auto;\n  padding: 10px;\n  background: rgba(255, 253, 248, .97);\n  border: 1px solid var(--line);\n  border-radius: 8px;\n  box-shadow: var(--shadow);\n  font-size: 12.5px;\n  z-index: 6;\n}\n\n#annotate .ann-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  margin-bottom: 8px;\n}\n\n#annotate .ann-head strong {\n  font-size: 11.5px;\n  font-weight: 700;\n  letter-spacing: .08em;\n  text-transform: uppercase;\n  color: var(--muted);\n}\n\n#ann-close {\n  border: 0;\n  background: none;\n  font: inherit;\n  font-size: 17px;\n  line-height: 1;\n  padding: 2px 4px;\n  color: var(--muted);\n  cursor: pointer;\n}\n#ann-close:hover { color: var(--ink); }\n\n#annotate .ann-tools {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 4px;\n}\n\n#annotate .ann-tool {\n  padding: 6px 2px;\n  border: 1px solid var(--line);\n  border-radius: 6px;\n  background: #fff;\n  font: inherit;\n  font-size: 11.5px;\n  color: var(--ink);\n  cursor: pointer;\n}\n#annotate .ann-tool:hover { border-color: var(--muted); }\n#annotate .ann-tool.on {\n  background: var(--ink);\n  border-color: var(--ink);\n  color: #fffdf8;\n}\n\n#annotate .ann-hint {\n  margin: 6px 0 8px;\n  color: var(--muted);\n  font-size: 11.5px;\n  line-height: 1.35;\n}\n\n/* `display` on a class beats the user agent's `[hidden] { display: none }`,\n   so the row of finish-and-cancel buttons stood there from the moment the\n   panel opened, offering to finish a shape nobody had started. */\n#annotate .ann-drawing {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n  margin-bottom: 8px;\n}\n#annotate .ann-drawing[hidden] { display: none; }\n#annotate .ann-drawing button {\n  padding: 5px 8px;\n  border: 1px solid var(--line);\n  border-radius: 6px;\n  background: #fff;\n  font: inherit;\n  font-size: 11.5px;\n  cursor: pointer;\n}\n#annotate #ann-finish { background: var(--ink); border-color: var(--ink); color: #fffdf8; }\n\n#annotate .ann-style {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 4px 10px;\n  margin-bottom: 8px;\n}\n#annotate .ann-style label[hidden] { display: none; }\n#annotate .ann-style label {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 11.5px;\n  color: var(--muted);\n}\n#annotate .ann-style input[type=\"color\"] {\n  width: 26px;\n  height: 20px;\n  padding: 0;\n  border: 1px solid var(--line);\n  border-radius: 4px;\n  background: none;\n  cursor: pointer;\n}\n#annotate .ann-style input[type=\"range\"] { width: 74px; }\n\n#annotate .ann-field {\n  display: block;\n  margin-bottom: 7px;\n  font-size: 11.5px;\n  color: var(--muted);\n}\n#annotate .ann-field input,\n#annotate .ann-field textarea {\n  display: block;\n  width: 100%;\n  margin-top: 3px;\n  padding: 5px 6px;\n  border: 1px solid var(--line);\n  border-radius: 5px;\n  background: #fff;\n  font: inherit;\n  font-size: 12.5px;\n  color: var(--ink);\n  resize: vertical;\n}\n#annotate .ann-field input:disabled,\n#annotate .ann-field textarea:disabled { background: #f4f1ea; color: var(--muted); }\n\n#ann-list {\n  list-style: none;\n  margin: 0 0 8px;\n  padding: 0;\n  max-height: 172px;\n  overflow-y: auto;\n}\n#ann-list li {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  border-bottom: 1px solid var(--line);\n}\n#ann-list li.sel { background: rgba(0, 0, 0, .05); }\n#ann-list .ann-pick {\n  flex: 1 1 auto;\n  min-width: 0;\n  text-align: left;\n  padding: 5px 4px;\n  border: 0;\n  background: none;\n  font: inherit;\n  font-size: 12px;\n  color: var(--ink);\n  cursor: pointer;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n#ann-list .ann-del {\n  flex: 0 0 auto;\n  border: 0;\n  background: none;\n  font: inherit;\n  font-size: 14px;\n  line-height: 1;\n  padding: 3px 5px;\n  color: var(--muted);\n  cursor: pointer;\n}\n#ann-list .ann-del:hover { color: #8c2f39; }\n\n#annotate .ann-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n}\n#annotate .ann-actions button {\n  padding: 6px 9px;\n  border: 1px solid var(--line);\n  border-radius: 6px;\n  background: #fff;\n  font: inherit;\n  font-size: 11.5px;\n  cursor: pointer;\n}\n#annotate .ann-actions button:disabled { opacity: .45; cursor: default; }\n#annotate #ann-save { background: var(--ink); border-color: var(--ink); color: #fffdf8; }\n#annotate #ann-save:disabled { background: var(--muted); border-color: var(--muted); }\n\n.ann-msg {\n  margin: 8px 0 0;\n  font-size: 11.5px;\n  line-height: 1.4;\n  color: var(--muted);\n}\n/* An error is the one message that has to be read, so it is the one that is\n   coloured and that stays until something replaces it. */\n.ann-msg.bad { color: #8c2f39; font-weight: 600; }\n\n/* The running count of what will fit in a link. Always there once there is\n   anything to count, because the useful moment to know is while typing the\n   description that will push it over, not afterwards. */\n.ann-cap {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  margin: 0 0 6px;\n  font-size: 11px;\n  font-variant-numeric: tabular-nums;\n  color: var(--muted);\n}\n.ann-cap .ann-bar {\n  flex: 0 0 62px;\n  height: 4px;\n  border-radius: 2px;\n  background: rgba(0, 0, 0, .12);\n  overflow: hidden;\n}\n.ann-cap .ann-bar i {\n  display: block;\n  height: 100%;\n  width: 0;\n  background: var(--muted);\n  transition: width .18s ease;\n}\n.ann-cap.near { color: #a8642a; }\n.ann-cap.near .ann-bar i { background: #a8642a; }\n.ann-cap.over { color: #8c2f39; font-weight: 600; }\n.ann-cap.over .ann-bar i { background: #8c2f39; }\n\n/* The pencil that unlocks a shared set. It sits under the zoom controls in\n   the corner of the map, and it is the only annotation control a reader who\n   followed a link is shown until they ask for more. */\n#ann-edit {\n  position: absolute;\n  right: 10px;\n  top: 176px;\n  z-index: 5;\n  display: grid;\n  place-items: center;\n  width: 40px;\n  height: 40px;\n  padding: 0;\n  border: 1px solid var(--line);\n  border-radius: 9px;\n  background: #8c2f39;\n  box-shadow: var(--shadow);\n  cursor: pointer;\n}\n#ann-edit svg {\n  width: 19px;\n  height: 19px;\n  fill: none;\n  stroke: #fffdf8;\n  stroke-width: 1.9;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n#ann-edit:hover { background: #7a2831; }\n\n/* locked: the marks are there to be read, and nothing else */\n#map-container.ann-locked #annotations .ann-mark { cursor: default; }\n#map-container.ann-locked #annotations .ann-vertex { display: none; }\n\n#annotate #ann-lock {\n  display: grid;\n  place-items: center;\n  width: 26px;\n  height: 24px;\n  padding: 0;\n  border: 0;\n  background: none;\n  cursor: pointer;\n}\n#annotate #ann-lock svg {\n  width: 15px;\n  height: 15px;\n  fill: none;\n  stroke: var(--muted);\n  stroke-width: 1.7;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n#annotate #ann-lock:hover svg { stroke: var(--ink); }\n\n/* the way back to a reader's own work, when a link has taken the screen */\n.ann-mine { margin: 0 0 7px; }\n.ann-mine button {\n  width: 100%;\n  padding: 7px 9px;\n  border: 1px solid var(--line);\n  border-radius: 6px;\n  background: rgba(31, 92, 122, .10);\n  font: inherit;\n  font-size: 11.5px;\n  font-weight: 600;\n  color: var(--ink);\n  cursor: pointer;\n}\n.ann-mine button:hover { border-color: var(--muted); }\n\n/* the standing note about a set too big for a link */\n.ann-warn {\n  margin: 0 0 7px;\n  padding: 6px 8px;\n  border-radius: 5px;\n  background: rgba(140, 47, 57, .09);\n  font-size: 11.5px;\n  line-height: 1.4;\n  color: #8c2f39;\n}\n#annotate .ann-actions button.too-big {\n  opacity: .55;\n  text-decoration: line-through;\n}\n\n/* the marks themselves */\n#annotations { pointer-events: none; }\n#annotations .ann-shape { vector-effect: non-scaling-stroke; stroke-linejoin: round; }\n#annotations .ann-draft {\n  vector-effect: non-scaling-stroke;\n  stroke-dasharray: 5 4;\n  opacity: .8;\n}\n/* The selected feature: a halo, and nothing else.\n   Lightening it was tried and is worse \u2014 the whole point of choosing a colour\n   is that the colour you chose is the colour you see, and a selection that\n   changes it makes you doubt what you picked. Two shadows instead, a tight\n   dark one to lift the shape off the map and a wider soft one to catch the\n   eye from across it. */\n#annotations .sel {\n  filter: drop-shadow(0 0 2px rgba(0, 0, 0, .9))\n          drop-shadow(0 0 7px rgba(0, 0, 0, .55));\n}\n#annotations .ann-mark.sel {\n  filter: drop-shadow(0 0 2px rgba(0, 0, 0, .95))\n          drop-shadow(0 0 9px rgba(0, 0, 0, .6));\n}\n\n/* a pen, not a pointer */\n#map-container.ann-drawing { cursor: crosshair; }\n\n/* Below the rail's breakpoint both the legend and this panel float in the\n   top-left corner of the map, and the annotation panel is the taller of the\n   two \u2014 so they were drawn one over the other, the legend's colours showing\n   faintly through. While a reader is drawing, the panel is what they are\n   using; the legend stands down and comes back when the panel closes. */\n/* Below the rail's breakpoint the panel docks to the foot of the screen\n   rather than floating in the top-left corner, where it took a third of a\n   phone and covered half the map's width \u2014 and where it stood on top of the\n   legend, which had to be hidden to make room. A sheet along the bottom\n   leaves the map whole above it, puts the tools under the thumb, and lets the\n   legend stay where it was. */\n@media (max-width: 999.98px) {\n  /* clear of the zoom controls on a narrow screen, where they stack lower */\n  #ann-edit { top: auto; bottom: calc(14px + var(--safe-b, 0px)); }\n  #annotate {\n    left: 0;\n    right: 0;\n    top: auto;\n    bottom: 0;\n    width: auto;\n    max-width: none;\n    max-height: 46vh;\n    border-width: 1px 0 0;\n    border-radius: 12px 12px 0 0;\n    padding: 8px 12px calc(10px + var(--safe-b, 0px));\n    box-shadow: 0 -4px 18px rgba(0, 0, 0, .16);\n  }\n  /* folded it is a bar the map can be worked around */\n  #annotate.folded { max-height: none; }\n  /* and with a tool out it keeps the tools and the hint and nothing else */\n  #annotate.tooling .ann-style,\n  #annotate.tooling .ann-field,\n  #annotate.tooling .ann-measure,\n  #annotate.tooling #ann-list,\n  #annotate.tooling .ann-actions,\n  #annotate.tooling .ann-link-out { display: none; }\n  #annotate .ann-style { gap: 6px 14px; }\n  #ann-list { max-height: 120px; }\n}\n\n@media (prefers-color-scheme: dark) {\n  #annotate { background: rgba(20, 26, 32, .97); }\n  #annotate .ann-tool,\n  #annotate .ann-drawing button,\n  #annotate .ann-actions button,\n  #annotate .ann-field input,\n  #annotate .ann-field textarea,\n  .ann-row button { background: #1b232b; color: var(--ink); }\n  #annotate .ann-field input:disabled,\n  #annotate .ann-field textarea:disabled { background: #161d24; }\n  #annotate .ann-tool.on,\n  #annotate #ann-finish,\n  #annotate #ann-save { background: var(--ink); color: #12181e; }\n  .ann-msg.bad { color: #e08b95; }\n  .ann-warn { background: rgba(224, 139, 149, .14); color: #e08b95; }\n  .ann-cap .ann-bar { background: rgba(255, 255, 255, .14); }\n  .ann-cap.near { color: #d99a5e; }\n  .ann-cap.near .ann-bar i { background: #d99a5e; }\n  .ann-cap.over { color: #e08b95; }\n  .ann-cap.over .ann-bar i { background: #e08b95; }\n}\n\n\n/* what the new controls need */\n#annotate .ann-style select {\n  padding: 2px 4px;\n  border: 1px solid var(--line);\n  border-radius: 4px;\n  background: #fff;\n  font: inherit;\n  font-size: 11.5px;\n  color: var(--ink);\n}\n\n#annotate .ann-foldbtn {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  flex: 1 1 auto;\n  min-width: 0;\n  padding: 3px 3px 3px 0;\n  border: 0;\n  background: none;\n  font: inherit;\n  color: var(--muted);\n  cursor: pointer;\n  text-align: left;\n}\n#annotate .ann-foldbtn strong {\n  font-size: 11.5px;\n  font-weight: 700;\n  letter-spacing: .08em;\n  text-transform: uppercase;\n}\n#annotate .ann-foldbtn:hover { color: var(--ink); }\n/* the caret is a square on one corner: its rotated bounding box is 1.41 times\n   its side, so it is given room rather than sticking out of the panel */\n#annotate .ann-foldbtn .caret {\n  flex: 0 0 auto;\n  width: 7px;\n  height: 7px;\n  margin-left: 2px;\n  border-right: 2px solid currentColor;\n  border-bottom: 2px solid currentColor;\n  transform: translateY(-2px) rotate(45deg);\n  transition: transform .15s ease;\n}\n#annotate.folded .ann-foldbtn .caret { transform: translateY(1px) rotate(-135deg); }\n#annotate.folded .ann-body { display: none; }\n#annotate .ann-count { font-size: 11px; color: var(--muted); }\n\n#annotate .ann-measure {\n  margin: 0 0 7px;\n  font-size: 11.5px;\n  font-variant-numeric: tabular-nums;\n  color: var(--muted);\n}\n\n#ann-list .ann-pick { display: flex; gap: 8px; align-items: baseline; }\n#ann-list .ann-name {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n#ann-list .ann-meas {\n  flex: 0 0 auto;\n  font-size: 10.5px;\n  font-variant-numeric: tabular-nums;\n  color: var(--muted);\n}\n#ann-list .ann-go {\n  flex: 0 0 auto;\n  border: 0;\n  background: none;\n  font: inherit;\n  font-size: 13px;\n  line-height: 1;\n  padding: 3px 4px;\n  color: var(--muted);\n  cursor: pointer;\n}\n#ann-list .ann-go:hover { color: var(--ink); }\n\n.ann-link-out { margin-top: 7px; }\n.ann-link-out input {\n  width: 100%;\n  padding: 5px 6px;\n  border: 1px solid var(--line);\n  border-radius: 5px;\n  background: #fff;\n  font: inherit;\n  font-size: 11px;\n  color: var(--ink);\n}\n\n/* a name the reader typed, written on the map beside its mark */\n#ann-labels .ann-label {\n  pointer-events: none;\n  text-anchor: middle;\n  paint-order: stroke;\n  stroke: #fffdf8;\n  stroke-width: 3.2px;\n  stroke-linejoin: round;\n  fill: #2b2b2b;\n  font-weight: 600;\n  font-size: 11px;\n}\n/* A mark is a handle, so it takes the pointer where nothing else here does.\n   A shape takes it on its stroke and on its fill where it has one, so that\n   pointing at an outlined area anywhere inside it still names it \u2014 `all`\n   rather than `visiblePainted`, because a fill at zero opacity is still the\n   thing the reader drew and still has a name. */\n#annotations .ann-mark { pointer-events: auto; cursor: grab; }\n#annotations .ann-shape { pointer-events: all; }\n#annotations .ann-vertex { opacity: .9; }\n#annotations .ann-bend { cursor: ew-resize; }\n/* A weightless point: nothing to see, and still something to press. Selected,\n   it is given a faint ring so that a reader editing it can find it again. */\n#annotations .ann-ghost circle { pointer-events: all; }\n#annotations .sel .ann-ghost circle,\n#annotations .ann-mark.sel .ann-ghost circle {\n  fill: rgba(0, 0, 0, .06);\n  stroke: rgba(0, 0, 0, .45);\n  stroke-width: 1;\n  stroke-dasharray: 3 3;\n}\n#annotations .ann-head { pointer-events: none; }\n/* A mark stays pressable while a tool is out. It used to be made inert so that\n   drawing over one was never blocked, and the cost was that the ordinary way of\n   working \u2014 place a point, then adjust it \u2014 could not reach the point at all:\n   the tool stays armed after a placement, so the mark was unclickable exactly\n   when a reader would first want it. Placing happens on empty map, which is\n   where somebody who means to place is pointing. */\n\n@media (prefers-color-scheme: dark) {\n  #annotate .ann-style select,\n  .ann-link-out input { background: #1b232b; color: var(--ink); }\n  #ann-labels .ann-label { stroke: #10161c; fill: #dfe6ec; }\n  /* over a dark map a black halo is invisible, so it is light there */\n  #annotations .sel {\n    filter: drop-shadow(0 0 2px rgba(255, 255, 255, .85))\n            drop-shadow(0 0 8px rgba(255, 255, 255, .5));\n  }\n  #annotations .ann-mark.sel {\n    filter: drop-shadow(0 0 2px rgba(255, 255, 255, .9))\n            drop-shadow(0 0 10px rgba(255, 255, 255, .55));\n  }\n}\n\n@media (min-width: 1000px) {\n  /* Leave the scrollbar its own lane. On a Mac the rail's scrollbar is an\n     overlay drawn *over* the content, so a field at `width: 100%` runs under\n     it and its right-hand border disappears \u2014 which is what \"the pane is too\n     wide to fit everything\" was. `scrollbar-gutter` reserves the space when\n     the browser supports it, and the padding covers the browsers that do not. */\n  #side { scrollbar-gutter: stable; }\n  #annotate {\n    position: relative;\n    inset: auto;\n    width: auto;\n    max-width: none;\n    max-height: none;\n    padding: 0 3px 0 0;\n    background: transparent;\n    border: 0;\n    box-shadow: none;\n  }\n}\n";

    function addCss() {
      if (document.getElementById('ann-css')) return;
      var st = document.createElement('style');
      st.id = 'ann-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    function build() {
      if (panel) return;
      addCss();
      panel = document.createElement('section');
      panel.id = 'annotate';
      panel.setAttribute('aria-label', 'Annotations');
      panel.innerHTML = PANEL;
      var side = document.getElementById('side');
      var legend = document.getElementById('legend');
      if (side && legend) side.insertBefore(panel, legend.nextSibling);
      else if (side) side.appendChild(panel);
      else document.body.appendChild(panel);

      msgEl = $('#ann-msg', panel);
      listEl = $('#ann-list', panel);
      hintEl = $('#ann-hint', panel);
      drawEl = $('.ann-drawing', panel);
      bodyEl = $('.ann-body', panel);

      $('#ann-fold', panel).addEventListener('click', function () {
        fold(!panel.classList.contains('folded'));
      });
      $('#ann-close', panel).addEventListener('click', close);
      $('#ann-lock', panel).addEventListener('click', function () {
        setLocked(true);
        say('Locked. The pencil in the corner of the map unlocks it.');
      });
      $$('.ann-tool', panel).forEach(function (b) {
        b.addEventListener('click', function () { setTool(b.getAttribute('data-tool')); });
      });
      $('#ann-finish', panel).addEventListener('click', finish);
      $('#ann-cancel', panel).addEventListener('click', cancelDraft);
      $('#ann-undo-pt', panel).addEventListener('click', function () {
        if (!draft) return;
        draft.pts.pop();
        if (!draft.pts.length) cancelDraft(); else redraw();
      });
      ['ann-title', 'ann-short', 'ann-desc'].forEach(function (id) {
        $('#' + id, panel).addEventListener('input', fieldChanged);
      });
      ['ann-colour', 'ann-size', 'ann-opacity', 'ann-fillop', 'ann-dash', 'ann-symbol',
       'ann-head', 'ann-curve'].forEach(function (id) {
        var el = $('#' + id, panel);
        el.addEventListener('input', styleChanged);
        el.addEventListener('change', styleChanged);
      });
      $('#ann-names', panel).addEventListener('change', redraw);
      $('#ann-save', panel).addEventListener('click', save);
      $('#ann-link', panel).addEventListener('click', copyLink);
      $('#ann-fit', panel).addEventListener('click', function () {
        if (!zoomTo(feats)) say('There is nothing to move to.', 'bad');
      });
      $('#ann-undo', panel).addEventListener('click', undo);
      $('#ann-add', panel).addEventListener('click', function () {
        var f = document.getElementById('ann-file');
        if (!f) return;
        f.value = '';
        f.setAttribute('data-merge', '1');
        f.click();
      });
      $('#ann-clear', panel).addEventListener('click', function () {
        if (!feats.length) return;
        if (!window.confirm('Remove all ' + feats.length + ' annotations? '
            + 'Undo will bring them back, but anything unsaved is otherwise lost.')) return;
        snapshot();
        feats = [];
        sel = -1;
        sourceName = '';
        cancelDraft();
        changed(true);
        say('Cleared. Undo brings them back.');
      });
      $('#ann-link-field', panel).addEventListener('focus', function (e) { e.target.select(); });
      $('#ann-mine-btn', panel).addEventListener('click', backToMine);

      document.addEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (!on) return;
      var t = e.target;
      var typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (typing) return;
        e.preventDefault(); undo(); return;
      }
      if (typing) return;
      if (draft && e.key === 'Enter') { e.preventDefault(); finish(); return; }
      if (e.key === 'Escape') {
        if (draft) { e.preventDefault(); cancelDraft(); return; }
        if (tool) { e.preventDefault(); setTool(null); return; }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel >= 0 && !draft) {
        e.preventDefault(); removeAt(sel);
      }
    }

    /* ------------------------------------------------------ opening up -- */

    /* The edit button: a pencil on a coloured disc, in the corner of the map.
       It is the only way back into the panel while the marks are locked, and
       it exists only while there are marks — a reader who has never annotated
       anything is never shown a control for annotations. */
    function makeEditBtn() {
      if (editBtn) return;
      editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.id = 'ann-edit';
      editBtn.hidden = true;
      editBtn.title = 'Edit these annotations';
      editBtn.setAttribute('aria-label', 'Edit these annotations');
      editBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>' +
        '<path d="M14.5 5.5l4 4"/></svg>';
      editBtn.addEventListener('click', function () { setLocked(false); });
      var host2 = document.getElementById('map-container') || document.body;
      host2.appendChild(editBtn);
    }

    function setLocked(yes) {
      locked = !!yes;
      makeEditBtn();
      if (panel) panel.hidden = locked || !on;
      var stage = document.getElementById('stage');
      if (stage) stage.classList.toggle('annotating', on && !locked);
      var c = host.container();
      if (c) c.classList.toggle('ann-locked', locked);
      if (locked) {
        setTool(null);
        cancelDraft();
      } else if (on) {
        // somebody who pressed the pencil asked to edit: give them the panel
        // open, not folded down to its title
        fold(false);
      }
      showEdit();
      redraw();
    }

    function showEdit() {
      if (!editBtn) return;
      editBtn.hidden = !(on && locked && feats.length);
    }

    function open(folded) {
      build();
      on = true;
      panel.hidden = false;
      var stage = document.getElementById('stage');
      if (stage) stage.classList.add('annotating');
      if (folded) fold(true);
      /* The legend folds to its title. Both live in the same rail and the
         panel is the taller of the two, so a reader who opens the tools is
         otherwise scrolling past a colour key to reach them. It is one press
         to bring it back, and it is left alone if the reader has already
         folded or unfolded it themselves. */
      var legend = document.getElementById('legend');
      if (legend && !legend.hidden && !legend.classList.contains('folded')
          && !legend.hasAttribute('data-ann-folded')) {
        legend.classList.add('folded');
        legend.setAttribute('data-ann-folded', '1');
        var head = legend.querySelector('.legend-head');
        if (head) head.setAttribute('aria-expanded', 'false');
      }
      redraw();
      drawList();
      syncFields();
      prepLink();
    }

    function close() {
      // and it comes back, unless the reader has since chosen otherwise
      var legend = document.getElementById('legend');
      if (legend && legend.hasAttribute('data-ann-folded')) {
        legend.removeAttribute('data-ann-folded');
        legend.classList.remove('folded');
        var head = legend.querySelector('.legend-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
      on = false;
      locked = false;
      setTool(null);
      if (panel) panel.hidden = true;
      if (editBtn) editBtn.hidden = true;
      var c0 = host.container();
      if (c0) c0.classList.remove('ann-locked');
      var stage = document.getElementById('stage');
      if (stage) stage.classList.remove('annotating');
      var c = host.container();
      if (c) c.classList.remove('ann-drawing');
      redraw();
    }

    function fromUrl(code) {
      /* Locked, and the panel not shown at all. Somebody followed a link to
         look at what a classmate made; the tools are not what they came for,
         and a set that is not theirs should not lose a point to a stray press.
         The pencil in the corner is how they get in. */
      open(true);
      setLocked(true);
      // whatever they had is set aside, not replaced
      shadowed = restore();
      unpack(code).then(function (text) {
        loadText(text, 'shared');
        setLocked(true);           // loadText unlocks; a link stays locked
        setDirty(false);           // nothing of theirs is at stake yet
        if (shadowed) {
          showShadow();
          say('These annotations came with the link. Your own '
            + shadowed.f.length + ' — still here, untouched — are one press away.');
        } else {
          // it was opened folded on purpose: the marks are the point, the
          // tools are there if wanted. The message says where they are.
          say('These annotations came with the link.');
        }
      }, function (err) {
        shadowed = null;
        fold(false);
        say('That shared link could not be read: ' + (err.message || err) + '.', 'bad');
      });
    }

    /* The way back to a reader's own work after a link has taken the screen. */
    function showShadow() {
      var row = $('#ann-mine');
      if (!row) return;
      row.hidden = !shadowed;
      if (!shadowed) return;
      $('#ann-mine-btn').textContent = 'Back to my ' + shadowed.f.length
        + ' annotation' + (shadowed.f.length === 1 ? '' : 's');
    }

    function backToMine() {
      if (!shadowed) return;
      var was = shadowed;
      snapshot();
      shadowed = null;
      feats = was.f;
      sourceName = was.s || '';
      sel = feats.length ? 0 : -1;
      changed(true);
      zoomTo(feats);
      showShadow();
      fold(false);
      try { window.localStorage.removeItem(ANN_STORE_SHARED); } catch (err) { /* fine */ }
      say('Back to your own ' + feats.length + ' annotation'
        + (feats.length === 1 ? '' : 's') + '. The shared set is in Undo if you want it.');
    }

    function offerRestore() {
      if (shadowed) return;              // it is already offered, as a button
      var was = restore();
      if (!was || feats.length) return;
      var when = was.t ? new Date(was.t) : null;
      var ago = when ? when.toLocaleString() : 'earlier';
      if (!window.confirm('You have ' + was.f.length + ' annotation'
          + (was.f.length === 1 ? '' : 's') + ' from ' + ago
          + ' still in this browser. Bring them back?')) {
        try { window.localStorage.removeItem(ANN_STORE); } catch (err) { /* fine */ }
        return;
      }
      feats = was.f;
      sourceName = was.s || '';
      sel = feats.length ? 0 : -1;
      changed(true);
      zoomTo(feats);
      say('Brought back ' + feats.length + ' annotation'
        + (feats.length === 1 ? '' : 's') + ' from this browser.');
    }

    /* Everything `map.js` is allowed to ask of this file. */
    return {
      open: function () { open(false); offerRestore(); },
      loadFile: loadFile,
      fromUrl: fromUrl,
      active: function () { return on; },
      drawing: function () { return on && !!tool; },
      tap: tap,
      hover: hover,
      rightClick: rightClick,
      grab: grab,
      held: held,
      dragging: function () { return !!dragging; },
      drag: drag,
      drop: drop,
      reproject: function () { if (on) redraw(); },
    };
  };
}());
