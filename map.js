/* The Japanese Empire — map practice.
 *
 * Everything is driven by the SVG's viewBox: pan and zoom rewrite it, and
 * markers are rescaled to keep a constant size on screen. That is a good deal
 * steadier on a phone than transforming the SVG and scrolling its container,
 * and it means one code path serves mouse, pen and touch through Pointer
 * Events.
 *
 * The SVG holds atoms, not territories. Switching epoch re-composes them:
 * every atom is told which territory it currently belongs to and painted that
 * territory's colour, so atoms sharing a territory show no boundary between
 * them and the same geometry serves 1930 and 1942.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var STORE_KEY = 'jmap.v3';
  var DOT_R = 5.5;        // marker radius, in screen pixels
  var HIT_R_TOUCH = 22;   // finger-sized tap target
  var HIT_R_MOUSE = 13;
  var TAP_SLOP = 9;       // px of movement still counted as a tap
  var TERR_PX = 13.5;     // label sizes, in screen pixels
  var SITE_PX = 11.5;
  var EPOCH_1930_CUTOFF = 1931;   // sites later than this are hidden in 1930
  var LANGS = ['en', 'ja', 'zh', 'ko'];

  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var HIT_R = coarse ? HIT_R_TOUCH : HIT_R_MOUSE;

  var state = {
    mode: 'explore',
    epoch: JMAP.DEFAULT_EPOCH,
    level: 1,
    lang: 'en',
    cats: { city: true, battle: true, territory: true },
    labels: false,
    extent: true,
    rivers: true,
    browse: false,
    // the legend is worth its space on a big screen and costs too much of it
    // on a phone, so it starts folded there and remembers what you chose
    legend: window.innerWidth >= 700 && window.innerHeight >= 600,
  };

  var container = $('#map-container');   // pointer target and size reference
  var svgHost = $('#map-svg');           // the SVG's own box, so the zoom
                                         // buttons survive being re-rendered
  var tooltip = $('#tooltip');
  var infoBox = $('#info');
  var quizBox = $('#quiz');

  var svg = null;
  var markersGroup = null;
  var hatchGroup = null;
  var highlightLayer = null;
  var subOutlineLayer = null;
  var hiDefs = null;
  var ownedDefs = { hi: [], sub: [] };
  var proj = null;
  var mapW = 0, mapH = 0;

  var atomEls = {};       // atom id -> element
  var byId = {};          // item id -> record (current epoch territories + sites)
  var elById = {};        // item id -> a representative element (for flashing)
  var atomsOf = {};       // item id -> [elements]
  var sitePos = {};       // site id -> {x, y} in map units
  var scalables = [];     // {el, x, y} kept at constant screen size
  var labels = [];        // {rec, el, x, y, dy, size, w, h}
  var terrLabelByEl = {}; // territory id -> label entry
  var selected = null;

  /* ------------------------------------------------------------ state -- */

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (saved.level >= 1 && saved.level <= 3) state.level = saved.level;
      if (LANGS.indexOf(saved.lang) >= 0) state.lang = saved.lang;
      if (JMAP.EPOCHS.some(function (e) { return e.id === saved.epoch; })) state.epoch = saved.epoch;
      if (saved.cats) {
        Object.keys(state.cats).forEach(function (k) {
          if (typeof saved.cats[k] === 'boolean') state.cats[k] = saved.cats[k];
        });
      }
      state.labels = !!saved.labels;
      if (typeof saved.extent === 'boolean') state.extent = saved.extent;
      if (typeof saved.rivers === 'boolean') state.rivers = saved.rivers;
      if (typeof saved.browse === 'boolean') state.browse = saved.browse;
      if (typeof saved.legend === 'boolean') state.legend = saved.legend;
    } catch (err) { /* first visit, or storage is off — defaults are fine */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        epoch: state.epoch, level: state.level, lang: state.lang,
        cats: state.cats, labels: state.labels, extent: state.extent,
        rivers: state.rivers, browse: state.browse, legend: state.legend,
      }));
    } catch (err) { /* private browsing; not worth complaining about */ }
  }

  /* A place on the 1930 map should not be labelled or described by something
   * that had not happened yet. Sites with a per-epoch entry get it merged over
   * the base record at display time; ids and geometry never change. */
  function shown(rec) {
    if (!rec || !rec.id) return rec;
    var over = JMAP.EPOCH_OVERRIDES && JMAP.EPOCH_OVERRIDES[rec.id];
    over = over && over[state.epoch];
    if (!over) return rec;
    var out = {};
    Object.keys(rec).forEach(function (k) { out[k] = rec[k]; });
    Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    return out;
  }

  function nameOf(rec) {
    if (!rec) return '';
    var r = shown(rec);
    return r[state.lang] || r.en;
  }

  function territories() { return JMAP.TERRITORIES[state.epoch]; }
  function catList() { return JMAP.CATEGORIES[state.epoch]; }

  function catInfo(id) {
    var all = catList().concat(JMAP.SITE_CATEGORIES);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* A site belongs to the 1930 map only if it had happened by then. */
  function siteInEpoch(s) {
    if (state.epoch !== 'e1930') return true;
    return (s.year || 0) <= EPOCH_1930_CUTOFF;
  }

  /* Territories are always shown and always clickable — the level decides
   * what the quiz asks for and what gets a label, not what you can look at. */
  function inQuiz(rec) {
    if (rec.kind === 'site') return rec.lvl <= state.level && state.cats[rec.cat] && siteInEpoch(rec);
    return rec.lvl <= state.level && state.cats.territory;
  }

  function siteVisible(s) {
    if (s.kind === 'browse') return browseVisible();
    return state.cats[s.cat] && s.lvl <= state.level && siteInEpoch(s);
  }

  function quizPool() {
    return territories().concat(JMAP.SITES).filter(inQuiz);
  }

  /* ------------------------------------------------------------- boot -- */

  var firstVisit = false;
  try { firstVisit = !window.localStorage.getItem(STORE_KEY); } catch (err) { firstVisit = true; }
  loadState();

  // The bundled single-file build inlines the map; otherwise fetch it. Either
  // way init() must run *after* the rest of this file has been evaluated, so
  // the inline path is deferred to a microtask rather than called outright.
  if (window.JMAP_INLINE_SVG) {
    Promise.resolve(window.JMAP_INLINE_SVG).then(init);
  } else {
    fetch('japan-empire-map.svg')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(init)
      .catch(showLoadError);
  }

  function showLoadError() {
    svgHost.innerHTML =
      '<div class="load-error">' +
      '<p><strong>The map file could not be loaded.</strong></p>' +
      '<p>Browsers refuse to read neighbouring files when a page is opened straight from the ' +
      'file system. Serve the folder over HTTP instead — from a terminal in this directory, run ' +
      '<code>python3 -m http.server</code> and then open ' +
      '<code>http://localhost:8000/</code>.</p>' +
      '<p>Alternatively use <code>japan-empire-map-standalone.html</code>, which has everything ' +
      'in a single file and opens directly.</p>' +
      '</div>';
  }

  function init(markup) {
    svgHost.innerHTML = markup;
    svg = svgHost.querySelector('svg');
    if (!svg) { showLoadError(); return; }

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var box = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    mapW = box[2];
    mapH = box[3];

    var meta = svg.querySelector('#proj');
    proj = {
      lonMin: parseFloat(meta.getAttribute('data-lon-min')),
      latMax: parseFloat(meta.getAttribute('data-lat-max')),
      pxPerDeg: parseFloat(meta.getAttribute('data-px-per-deg')),
      R: parseFloat(meta.getAttribute('data-r')),
    };
    proj.yTop = proj.R * Math.log(Math.tan(Math.PI / 4 + proj.latMax * Math.PI / 360));

    markersGroup = svg.querySelector('#markers');
    // above the markers, not below them: a selection outline that a row of
    // city dots can rub out is not much of an outline. It takes no pointer
    // events, so nothing underneath becomes harder to hit.
    // Masks and clip paths belong in defs. Left as siblings of the shapes
    // that use them, Chrome quietly stops painting the whole layer.
    hiDefs = svgEl('defs', { id: 'hi-defs' });
    svg.appendChild(hiDefs);
    // the standing outlines round territories that share a neighbour's colour
    subOutlineLayer = svgEl('g', { id: 'sub-outlines' });
    svg.appendChild(subOutlineLayer);
    highlightLayer = svgEl('g', { id: 'highlight' });
    svg.appendChild(highlightLayer);
    extentPath = svg.querySelector('#extent-1942');
    riversGroup = svg.querySelector('#rivers');
    buildYellow1938();
    buildNanyoBounds();
    buildBrowse();
    hatchGroup = svg.querySelector('#hatching');

    $$('.atom', svg).forEach(function (el) { atomEls[el.id.replace(/^a-/, '')] = el; });
    buildAtomHits();

    JMAP.SITES.forEach(function (s) { s.kind = 'site'; });
    buildMarkers();
    buildSiteLabels();
    buildEpochControl();
    syncLayerButtons();

    wireControls();
    wirePointer();

    composeEpoch();
    applyState();
    view = defaultView();
    applyView(true);

    // A student arriving cold sees a map, some rows of buttons and no words.
    // One line, once, that goes away as soon as they touch anything.
    if (firstVisit) showHint();

    window.addEventListener('resize', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
  }

  function project(lon, lat) {
    var l = lon < proj.lonMin ? lon + 360 : lon;
    return {
      x: (l - proj.lonMin) * proj.pxPerDeg,
      y: proj.yTop - proj.R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)),
    };
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function buildMarkers() {
    JMAP.SITES.forEach(function (s) {
      var p = project(s.lon, s.lat);
      var g = svgEl('g', { 'class': 'site', id: 's-' + s.id, 'data-id': s.id, 'data-cat': s.cat });
      g.appendChild(svgEl('circle', { 'class': 'hit', r: HIT_R }));
      if (s.cat === 'battle') {
        var d = DOT_R + 1.2;
        g.appendChild(svgEl('path', { 'class': 'dot', d: 'M0 ' + -d + 'L' + d + ' 0L0 ' + d + 'L' + -d + ' 0Z' }));
      } else {
        g.appendChild(svgEl('circle', { 'class': 'dot', r: DOT_R }));
      }
      var colour = catInfo(s.cat);
      if (colour) g.style.setProperty('--c', colour.c);
      markersGroup.appendChild(g);
      elById[s.id] = g;
      sitePos[s.id] = p;
      scalables.push({ el: g, x: p.x, y: p.y });
    });
  }

  /* Small territories — the Kwantung leasehold, Hong Kong, Macao, Guam — are a
   * few pixels across at the opening zoom and effectively impossible to hit,
   * which matters most in the quiz, where you are asked to find them. Each
   * gets an invisible disc at its centroid held at a constant size on screen,
   * so it is always a finger-sized target and always shrinks back inside the
   * territory once you zoom in. Markers are drawn later and so still win. */
  var SMALL_ATOM_AREA = 2600;
  var atomHits = {};

  function buildAtomHits() {
    var layer = svgEl('g', { id: 'atom-hits' });
    svg.insertBefore(layer, markersGroup);
    Object.keys(atomEls).forEach(function (a) {
      var el = atomEls[a];
      var area = parseFloat(el.getAttribute('data-area'));
      if (!(area < SMALL_ATOM_AREA)) return;
      // one target per piece, so a territory in two parts does not get a
      // single target sitting in the country between them
      var spots = (el.getAttribute('data-hits') || '').split(' ')
        .map(function (p) { return p.split(',').map(parseFloat); })
        .filter(function (p) { return p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]); });
      if (!spots.length) {
        var cx = parseFloat(el.getAttribute('data-cx'));
        var cy = parseFloat(el.getAttribute('data-cy'));
        if (isNaN(cx) || isNaN(cy)) return;
        spots = [[cx, cy]];
      }
      atomHits[a] = spots.map(function (p) {
        var hit = svgEl('circle', { 'class': 'atom atom-hit', r: HIT_R * 0.8,
                                     'data-atom': a });
        layer.appendChild(hit);
        scalables.push({ el: hit, x: p[0], y: p[1] });
        return hit;
      });
    });
  }

  var extentPath = null;
  var riversGroup = null;
  var yellow1938 = null;
  var browseGroup = null;

  /* The Yellow River as it ran from 1938 to 1947, after the dikes were cut. */
  function buildYellow1938() {
    if (!riversGroup || !JMAP.YELLOW_1938) return;
    var d = JMAP.YELLOW_1938.map(function (p, i) {
      var q = project(p[0], p[1]);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join('');
    yellow1938 = svgEl('path', { id: 'river-yellow_1938', 'class': 'river', fill: 'none', d: d });
    riversGroup.appendChild(yellow1938);
  }

  var nanyoPath = null;

  /* The mandate was mostly sea; without its boundary it is invisible. */
  function buildNanyoBounds() {
    if (!JMAP.NANYO_BOUNDS) return;
    var d = JMAP.NANYO_BOUNDS.ring.map(function (p, i) {
      var q = project(p[0], p[1]);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join('') + 'Z';
    nanyoPath = svgEl('path', { id: 'nanyo-bounds', fill: 'none', d: d });
    svg.insertBefore(nanyoPath, markersGroup);
  }

  /* Context cities: smaller, greyer, under the markers that are examinable. */
  function buildBrowse() {
    if (!JMAP.BROWSE) return;
    browseGroup = svgEl('g', { id: 'browse' });
    svg.insertBefore(browseGroup, markersGroup);
    JMAP.BROWSE.forEach(function (b) {
      b.kind = 'browse';
      b.rid = 'b_' + b.id;
      var p = project(b.lon, b.lat);
      var g = svgEl('g', { 'class': 'browse', id: 'b-' + b.id, 'data-id': b.rid });
      g.appendChild(svgEl('circle', { 'class': 'hit', r: HIT_R * 0.72 }));
      g.appendChild(svgEl('circle', { 'class': 'dot', r: DOT_R * 0.62 }));
      browseGroup.appendChild(g);
      elById[b.rid] = g;
      sitePos[b.rid] = p;
      scalables.push({ el: g, x: p.x, y: p.y });
    });
  }

  var labelLayer = null;

  function buildSiteLabels() {
    labelLayer = svgEl('g', { id: 'labels' });
    svg.appendChild(labelLayer);
    JMAP.SITES.forEach(function (s) {
      var p = sitePos[s.id];
      var text = svgEl('text', { 'class': 'slabel', 'font-size': SITE_PX, y: SITE_PX + 7 });
      labelLayer.appendChild(text);
      labels.push({ rec: s, el: text, x: p.x, y: p.y, dy: SITE_PX + 7, size: SITE_PX, w: 0, h: SITE_PX * 1.2 });
      scalables.push({ el: text, x: p.x, y: p.y });
    });

    (JMAP.BROWSE || []).forEach(function (b) {
      var p = sitePos[b.rid];
      var text = svgEl('text', { 'class': 'blabel', 'font-size': SITE_PX - 1.5, y: SITE_PX + 4 });
      labelLayer.appendChild(text);
      labels.push({ rec: b, el: text, x: p.x, y: p.y, dy: SITE_PX + 4, size: SITE_PX - 1.5,
                    w: 0, h: SITE_PX * 1.1 });
      scalables.push({ el: text, x: p.x, y: p.y });
    });
  }

  /* --------------------------------------------------- epoch composition -- */

  /* A line along a territory's own boundary, in a colour of its own, for
   * neighbours that share a fill: Tuva inside Mongolia, Burma inside British
   * India. It is a separate stroke-only path, so it can be clipped to the one
   * frontier that needs it without the fill being clipped with it. */
  function drawEdge(t, el) {
    if (!subOutlineLayer) return;
    var src = el.tagName === 'path' ? el
                                    : el.querySelector('path.whole') || el.querySelector('path');
    if (!src) return;
    var line = svgEl('path', { d: src.getAttribute('d'), 'class': 'edge-line' });
    line.style.setProperty('--edge', t.edge);
    if (t.edgeClip) {
      var id = 'edge-clip-' + t.id;
      if (!hiDefs.querySelector('#' + id)) {
        var b = t.edgeClip;
        var a1 = project(b[0], b[1]), a2 = project(b[2], b[3]);
        var cp = svgEl('clipPath', { id: id, clipPathUnits: 'userSpaceOnUse' });
        cp.appendChild(svgEl('rect', {
          x: Math.min(a1.x, a2.x), y: Math.min(a1.y, a2.y),
          width: Math.abs(a2.x - a1.x), height: Math.abs(a2.y - a1.y),
        }));
        hiDefs.appendChild(cp);
        ownedDefs.sub.push(cp);
      }
      line.setAttribute('clip-path', 'url(#' + id + ')');
    }
    subOutlineLayer.appendChild(line);
  }

  function composeEpoch() {
    // clear anything the previous epoch left behind
    Object.keys(atomEls).forEach(function (a) {
      var el = atomEls[a];
      el.removeAttribute('data-id');
      el.style.removeProperty('--c');
      el.classList.remove('sel');
      el.classList.remove('sub-unit');
      el.style.display = 'none';
      (atomHits[a] || []).forEach(function (h) { h.removeAttribute('data-id'); });
    });
    hatchGroup.innerHTML = '';
    if (subOutlineLayer) { subOutlineLayer.innerHTML = ''; dropDefs('sub'); }
    clearHighlight();
    hot = null;
    hotProv = null;
    labels = labels.filter(function (L) {
      if (L.rec.kind === 'territory') { L.el.remove(); return false; }
      return true;
    });
    scalables = scalables.filter(function (s) { return s.el.isConnected; });
    byId = {};
    atomsOf = {};
    Object.keys(elById).forEach(function (k) {
      if (!byId[k] && elById[k] && elById[k].classList.contains('site')) return;
    });

    var subUnits = [];
    JMAP.SITES.forEach(function (s) { byId[s.id] = s; });
    if (JMAP.BROWSE) JMAP.BROWSE.forEach(function (b) { byId[b.rid] = b; });

    territories().forEach(function (t) {
      t.kind = 'territory';
      byId[t.id] = t;
      var info = catInfo(t.cat);
      var colour = t.c ? { c: t.c } : info;
      var els = [];
      var mx = 0, my = 0, total = 0;

      t.atoms.forEach(function (a) {
        var el = atomEls[a];
        if (!el) { return; }
        el.setAttribute('data-id', t.id);
        el.setAttribute('data-cat', t.cat);
        el.style.display = '';
        if (colour) el.style.setProperty('--c', colour.c);
        // a territory that shares its neighbour's fill can still be told from
        // it by a hairline: Tuva inside Mongolia, Burma inside British India
        if (t.edge && (!t.edgeAtoms || t.edgeAtoms.indexOf(a) >= 0)) drawEdge(t, el);
        if (t.outline) subUnits.push(el);
        els.push(el);
        (atomHits[a] || []).forEach(function (h) { h.setAttribute('data-id', t.id); });

        var area = parseFloat(el.getAttribute('data-area')) || 1;
        mx += area * parseFloat(el.getAttribute('data-cx'));
        my += area * parseFloat(el.getAttribute('data-cy'));
        total += area;

        if (t.hatch) {
          // 'occupied' is the Japanese stripe, 'us' the American one; true on
          // its own is the plain dark hatch
          var cls = 'hatch-fill' + (typeof t.hatch === 'string'
            ? ' hatch-' + (t.hatch === 'occupied' ? 'occ' : t.hatch) : '');
          var paths = el.tagName === 'path' ? [el] : $$('path', el);
          var clip = el.getAttribute('clip-path');
          paths.forEach(function (path) {
            var attrs = { 'class': cls, d: path.getAttribute('d') };
            var own = path.getAttribute('clip-path') || clip;
            if (own) attrs['clip-path'] = own;
            hatchGroup.appendChild(svgEl('path', attrs));
          });
        }
      });

      atomsOf[t.id] = els;
      // a territory must never displace a marker of the same name in this map:
      // applyState hides markers through it, and it would hide the land
      if (!elById[t.id] || !elById[t.id].classList.contains('site')) {
        elById[t.id] = els[0] || null;
      }

      if (t.outline && subUnits.length) {
        var ring = outlineOf(subUnits.splice(0, subUnits.length), 'sub-outline',
                             subOutlineLayer);
        // a dashed black line over a coloured country reads as a border
        // somebody else drew; a darker shade of the country's own colour reads
        // as a line about the country
        if (ring && t.outlineColor) ring.style.setProperty('--sub', t.outlineColor);
      }

      if (total > 0) {
        var x = mx / total, y = my / total;
        var text = svgEl('text', { 'class': 'tlabel', 'font-size': TERR_PX });
        labelLayer.appendChild(text);
        var entry = { rec: t, el: text, x: x, y: y, dy: 0, size: TERR_PX, w: 0, h: TERR_PX * 1.2 };
        labels.push(entry);
        terrLabelByEl[t.id] = entry;
        scalables.push({ el: text, x: x, y: y });
      }
    });

    var rank = { territory: 0, site: 1, browse: 2 };
    labels.sort(function (a, b) {
      var ra = rank[a.rec.kind] || 1, rb = rank[b.rec.kind] || 1;
      if (ra !== rb) return ra - rb;
      return (a.rec.lvl || 9) - (b.rec.lvl || 9);
    });

    // the labels just created have no transform yet, and rescale() only runs
    // on a zoom change, so place them now or they sit at the map origin
    if (lastScaleW > 0) rescale();
    hideTooltip();
    buildLegend();
  }

  /* Rough width of a rendered label, in screen pixels. Measuring for real
   * means a layout flush per label on every pan, which is not worth it. */
  function estimateWidth(text, size) {
    var w = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      w += (c > 0x2e80 && c < 0xffa0) ? 1.0 : (c === 32 ? 0.3 : 0.56);
    }
    return w * size;
  }

  /* ------------------------------------------------------ view control -- */

  var view = { x: 0, y: 0, w: 100, h: 100 };
  var lastScaleW = -1;
  var rafPending = false;

  function containerSize() {
    var r = container.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  }

  function fitView() {
    var c = containerSize();
    var scale = Math.min(c.w / mapW, c.h / mapH);
    var w = c.w / scale;
    var h = c.h / scale;
    return { x: (mapW - w) / 2, y: (mapH - h) / 2, w: w, h: h };
  }

  function activeBounds() {
    var b = null;
    function grow(x0, y0, x1, y1) {
      if (!b) b = { x0: x0, y0: y0, x1: x1, y1: y1 };
      else {
        b.x0 = Math.min(b.x0, x0); b.y0 = Math.min(b.y0, y0);
        b.x1 = Math.max(b.x1, x1); b.y1 = Math.max(b.y1, y1);
      }
    }
    Object.keys(atomEls).forEach(function (a) {
      var el = atomEls[a];
      if (!el.getAttribute('data-id')) return;
      try {
        var bb = el.getBBox();
        if (bb.width || bb.height) grow(bb.x, bb.y, bb.x + bb.width, bb.y + bb.height);
      } catch (err) { /* not laid out yet */ }
    });
    JMAP.SITES.forEach(function (s) {
      if (!siteVisible(s)) return;
      var p = sitePos[s.id];
      grow(p.x - 30, p.y - 30, p.x + 30, p.y + 30);
    });
    return b || { x0: 0, y0: 0, x1: mapW, y1: mapH };
  }

  function homeBounds() {
    var a = project(JMAP.HOME.lon0, JMAP.HOME.lat1);
    var z = project(JMAP.HOME.lon1, JMAP.HOME.lat0);
    return { x0: a.x, y0: a.y, x1: z.x, y1: z.y };
  }

  /* The opening view. A landscape screen is close enough in shape to the map
   * to frame everything in play. A phone held upright is not: fitting the
   * whole Pacific into a tall, narrow window leaves a postage stamp adrift in
   * empty sea, so there we fill the height and open on the empire's core
   * instead, and leave the rest to panning. */
  function defaultView() {
    var c = containerSize();
    var aspect = c.w / c.h;
    var b = activeBounds();
    var bw = (b.x1 - b.x0) * 1.06;
    var bh = (b.y1 - b.y0) * 1.06;

    // A stage far narrower than the content wastes its height on sea; a stage
    // far wider wastes its width on the same. Either way, open on the empire
    // rather than on the whole hemisphere.
    var cropToHome = aspect < (bw / bh) / 1.7 || aspect > (bw / bh) * 1.2;
    if (cropToHome) {
      b = homeBounds();
      bw = b.x1 - b.x0;
      bh = b.y1 - b.y0;
    }

    var w = Math.max(bw, bh * aspect);
    var h = w / aspect;
    if (cropToHome && h > mapH) { h = mapH; w = h * aspect; }
    return clampView({
      x: (b.x0 + b.x1) / 2 - w / 2,
      y: (b.y0 + b.y1) / 2 - h / 2,
      w: w, h: h,
    });
  }

  function clampView(v) {
    var c = containerSize();
    var aspect = c.w / c.h;
    v.h = v.w / aspect;

    // fitView contains the whole map, which on a tall phone leaves the land a
    // third of the screen. Stop at the point where the map still covers the
    // short axis, so zooming out never goes past useful.
    var maxW = Math.min(fitView().w, mapW);
    var minW = mapW / 40;
    if (v.w > maxW) { v.w = maxW; v.h = v.w / aspect; }
    if (v.w < minW) { v.w = minW; v.h = v.w / aspect; }

    v.x = v.w >= mapW ? (mapW - v.w) / 2 : Math.min(Math.max(v.x, 0), mapW - v.w);
    v.y = v.h >= mapH ? (mapH - v.h) / 2 : Math.min(Math.max(v.y, 0), mapH - v.h);
    return v;
  }

  function round(v) { return Math.round(v * 100) / 100; }

  function applyView(force) {
    clampView(view);
    svg.setAttribute('viewBox',
      round(view.x) + ' ' + round(view.y) + ' ' + round(view.w) + ' ' + round(view.h));
    // once the islands themselves are big enough to see, drop the rings
    svg.classList.toggle('zoomed-in', view.w < mapW / 5);
    var zoomed = force || Math.abs(view.w - lastScaleW) > 0.01;
    if (zoomed) lastScaleW = view.w;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        if (zoomed) rescale();
        if (browseGroup) browseGroup.style.display = browseVisible() ? '' : 'none';
        placeLabels();
      });
    }
  }

  var hatchPattern = null;
  var lastDouble = 0;
  var lastTap = null;
  var pendingTap = 0;

  /* The browse layer is context, and at a wide zoom on a small screen it is
   * 131 dots on top of each other. It comes in once there is room for it. */
  function browseVisible() {
    return state.browse && view.w < mapW / (coarse ? 2.2 : 1.6);
  }

  function rescale() {
    var c = containerSize();
    var k = view.w / c.w;                       // SVG units per screen pixel
    for (var i = 0; i < scalables.length; i++) {
      var s = scalables[i];
      s.el.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ') scale(' + k + ')');
    }
    // keep the shading stripes a constant width on screen rather than letting
    // them grow into stripes the width of a province as you zoom in
    if (!hatchPattern) hatchPattern = svg.querySelector('#hatch');
    if (hatchPattern) hatchPattern.setAttribute('patternTransform', 'rotate(45) scale(' + k + ')');
  }

  /* The floating panels are treated as obstacles, so no name ends up hiding
   * under the legend, the zoom buttons or the detail card. */
  function uiBoxes() {
    var base = container.getBoundingClientRect();
    var boxes = [];
    ['#legend', '#zoom-controls', '#info', '#quiz'].forEach(function (sel) {
      var el = $(sel);
      if (!el || el.hidden || el.offsetParent === null) return;
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      boxes.push({
        l: r.left - base.left - 4, r: r.right - base.left + 4,
        t: r.top - base.top - 4, b: r.bottom - base.top + 4,
      });
    });
    return boxes;
  }

  /* Greedy label placement in screen space: walk the candidates in teaching
   * order and drop any whose box would collide with one already placed, or
   * would run off the edge. */
  function placeLabels() {
    if (!state.labels || state.mode === 'quiz') return;
    var c = containerSize();
    var sx = c.w / view.w;
    var sy = c.h / view.h;
    var placed = uiBoxes();

    for (var i = 0; i < labels.length; i++) {
      var L = labels[i];
      if (!L.w) { L.el.style.display = 'none'; continue; }
      // a browse name with no dot under it is just a word floating in the sea
      if (L.rec.kind === 'browse' && !browseVisible()) { L.el.style.display = 'none'; continue; }

      var x = (L.x - view.x) * sx;
      var y = (L.y - view.y) * sy + L.dy;
      var box = {
        l: x - L.w / 2, r: x + L.w / 2,
        t: y - L.h * 0.85, b: y + L.h * 0.25,
      };

      if (box.l < 2 || box.r > c.w - 2 || box.t < 2 || box.b > c.h - 2) {
        L.el.style.display = 'none';
        continue;
      }

      var clash = false;
      for (var j = 0; j < placed.length; j++) {
        var p = placed[j];
        if (box.l < p.r && box.r > p.l && box.t < p.b && box.b > p.t) { clash = true; break; }
      }
      if (clash) { L.el.style.display = 'none'; continue; }

      placed.push(box);
      L.el.style.display = '';
    }
  }

  function clientToSvg(cx, cy) {
    var ctm = svg.getScreenCTM();
    if (!ctm) return { x: view.x + view.w / 2, y: view.y + view.h / 2 };
    var pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    var out = pt.matrixTransform(ctm.inverse());
    return { x: out.x, y: out.y };
  }

  function zoomAt(cx, cy, factor) {
    var p = clientToSvg(cx, cy);
    var oldW = view.w;
    var newW = Math.min(Math.max(view.w / factor, mapW / 40), fitView().w);
    if (Math.abs(newW - oldW) < 1e-6) return;
    var ratio = newW / oldW;
    view.x = p.x - (p.x - view.x) * ratio;
    view.y = p.y - (p.y - view.y) * ratio;
    view.w = newW;
    applyView();
  }

  function onResize() {
    var before = { cx: view.x + view.w / 2, cy: view.y + view.h / 2,
                   area: view.w * view.h };
    var c = containerSize();
    // keep the area in view, not the width: preserving the width across a
    // rotation doubles the magnification and lands you in a thin slice
    var aspect = c.w / c.h;
    view.w = Math.min(Math.sqrt(before.area * aspect), fitView().w);
    view.h = view.w / aspect;
    view.x = before.cx - view.w / 2;
    view.y = before.cy - view.h / 2;
    applyView(true);
  }

  /* Centre the view on a record. Site markers carry a scale transform, so
   * their getBBox() is in their own local frame and useless here — the
   * projected position is the truth. */
  function focusOn(rec, spread) {
    var cx, cy, want;
    if (rec.kind === 'site' || rec.kind === 'browse') {
      var p = sitePos[rec.rid || rec.id];
      cx = p.x; cy = p.y; want = 420 * (spread || 1);
    } else {
      var els = atomsOf[rec.id] || [];
      var b = null;
      els.forEach(function (el) {
        try {
          var bb = el.getBBox();
          if (!bb.width && !bb.height) return;
          if (!b) b = { x0: bb.x, y0: bb.y, x1: bb.x + bb.width, y1: bb.y + bb.height };
          else {
            b.x0 = Math.min(b.x0, bb.x); b.y0 = Math.min(b.y0, bb.y);
            b.x1 = Math.max(b.x1, bb.x + bb.width); b.y1 = Math.max(b.y1, bb.y + bb.height);
          }
        } catch (err) { /* not laid out */ }
      });
      if (!b) return;
      cx = (b.x0 + b.x1) / 2;
      cy = (b.y0 + b.y1) / 2;
      want = Math.max((b.x1 - b.x0) * 1.9, (b.y1 - b.y0) * 1.9, 300) * (spread || 1);
    }
    var c = containerSize();
    var aspect = c.w / c.h;
    // On a tall screen, sizing the view by its width makes the height
    // overflow the map, clamping pushes it back, and the thing you asked to
    // see slides out of the frame. Fit whichever axis is the tighter one.
    var w = aspect < 1 ? want * aspect : want;
    view.w = Math.min(Math.max(w, mapW / 40), fitView().w);
    view.h = view.w / aspect;
    view.x = cx - view.w / 2;
    view.y = cy - view.h / 2;
    // and leave room for whichever card is open at the bottom
    var card = quizBox.hidden ? (infoBox.hidden ? null : infoBox) : quizBox;
    if (card && window.innerWidth < 1000) {
      var covered = Math.max(0, c.h - (card.getBoundingClientRect().top - stageTop()));
      view.y += (covered / 2) * (view.h / c.h);
    }
    applyView();
  }

  function stageTop() {
    var st = document.getElementById('stage');
    return st ? st.getBoundingClientRect().top : 0;
  }

  /* -------------------------------------------------------- pointering -- */

  var pointers = new Map();
  var dragStart = null;
  var pinchStart = null;
  var downTarget = null;
  var movedFar = false;

  function wirePointer() {
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('dblclick', function (e) {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, 1.9);
    });
    container.addEventListener('contextmenu', function (e) { if (coarse) e.preventDefault(); });
    if (hoverCapable) {
      container.addEventListener('mousemove', onHover);
      container.addEventListener('mouseleave', function () {
        setHot(null); setHotProv(null); hideTooltip();
      });
    }
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button > 0) return;
    // Track first: if capture is refused (it can be, mid-gesture) we still
    // want the pointer in the map or the next move is read as a fresh drag.
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { container.setPointerCapture(e.pointerId); } catch (err) { /* not fatal */ }

    if (pointers.size === 1) {
      downTarget = e.target;
      movedFar = false;
      dragStart = { cx: e.clientX, cy: e.clientY, vx: view.x, vy: view.y };
      container.classList.add('dragging');
      hideTooltip();
    } else if (pointers.size === 2) {
      dragStart = null;
      movedFar = true;                       // a second finger is never a tap
      pinchStart = pinchState();
    }
  }

  function pinchState() {
    var pts = Array.from(pointers.values());
    var dx = pts[0].x - pts[1].x;
    var dy = pts[0].y - pts[1].y;
    var mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    return {
      dist: Math.max(1, Math.hypot(dx, dy)),
      mid: mid,
      svgMid: clientToSvg(mid.x, mid.y),
      w: view.w,
    };
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2 && pinchStart) {
      var now = pinchState();
      var maxW = fitView().w;
      var newW = Math.min(Math.max(pinchStart.w * (pinchStart.dist / now.dist), mapW / 40), maxW);
      var c = containerSize();
      var k = newW / c.w;
      var r = container.getBoundingClientRect();
      view.w = newW;
      view.h = newW / (c.w / c.h);
      view.x = pinchStart.svgMid.x - (now.mid.x - r.left) * k;
      view.y = pinchStart.svgMid.y - (now.mid.y - r.top) * k;
      applyView();
      return;
    }

    if (!dragStart) return;
    var dx = e.clientX - dragStart.cx;
    var dy = e.clientY - dragStart.cy;
    if (!movedFar && Math.hypot(dx, dy) > TAP_SLOP) movedFar = true;
    if (!movedFar) return;

    var cs = containerSize();
    var scale = view.w / cs.w;
    view.x = dragStart.vx - dx * scale;
    view.y = dragStart.vy - dy * scale;
    applyView();
  }

  function onPointerUp(e) {
    var had = pointers.size;
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    try {
      if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
    } catch (err) { /* already gone */ }

    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 1) {
      var rest = Array.from(pointers.entries())[0];
      dragStart = { cx: rest[1].x, cy: rest[1].y, vx: view.x, vy: view.y };
      movedFar = true;
      return;
    }

    container.classList.remove('dragging');
    dragStart = null;

    if (had === 1 && !movedFar && e.type === 'pointerup') {
      // dblclick is synthesised after the second pointerup, too late to stop
      // the tap that came with it — so the pair is spotted here instead
      var now = Date.now();
      var dbl = lastTap && now - lastTap.t < 320 &&
                Math.abs(e.clientX - lastTap.x) < 32 && Math.abs(e.clientY - lastTap.y) < 32;
      lastTap = { t: now, x: e.clientX, y: e.clientY };
      if (pendingTap) { window.clearTimeout(pendingTap); pendingTap = 0; }
      if (!dbl) {
        if (state.mode === 'quiz') {
          // hold the answer just long enough that a double tap to zoom does
          // not also cost the student the question
          var t = downTarget, tx = e.clientX, ty = e.clientY;
          pendingTap = window.setTimeout(function () {
            pendingTap = 0;
            handleTap(t, tx, ty);
          }, 300);
        } else {
          handleTap(downTarget, e.clientX, e.clientY);
        }
      }
    }
    downTarget = null;
  }

  function onWheel(e) {
    e.preventDefault();
    var delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(e.clientX, e.clientY, Math.exp(-delta * 0.0016));
  }

  /* ------------------------------------------------------- hit testing -- */

  /* The finger-sized targets laid over tiny territories sit above the land, so
   * near a small shape they take the pointer even when it is squarely inside a
   * neighbour. Whatever real land is under the pointer wins; the target is only
   * consulted when there is nothing better there. */
  /* Markers are 44px targets on a touch screen and the map is crowded, so on a
   * phone a dozen of them overlap. Left to the DOM the winner is whichever was
   * appended last, which is how tapping Tokyo answered Shimoda and the quiz
   * marked a right answer wrong. Nearest centre wins instead, which turns the
   * pile of discs into Voronoi cells. */
  function nearestMarker(cx, cy) {
    if (typeof cx !== 'number' || !svg) return null;
    var m = svg.getScreenCTM();
    if (!m) return null;
    // In explore mode a generous catchment is a kindness. In the quiz it is
    // the opposite: 44px discs round every city tile right over Taiwan, Korea,
    // Kwantung and Weihaiwei, so the answer cannot be tapped at all. There the
    // marker has to be hit nearly on the dot, and the land wins otherwise.
    var reach = state.mode === 'quiz' ? DOT_R + 7 : HIT_R;
    var best = null, bestD = reach * reach;
    var ids = Object.keys(sitePos);
    for (var i = 0; i < ids.length; i++) {
      var rec = byId[ids[i]];
      if (!rec || (rec.kind !== 'site' && rec.kind !== 'browse')) continue;
      if (!siteVisible(rec)) continue;
      var p = sitePos[ids[i]];
      var dx = (m.a * p.x + m.c * p.y + m.e) - cx;
      var dy = (m.b * p.x + m.d * p.y + m.f) - cy;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = rec; }
    }
    return best;
  }

  function pick(target, cx, cy) {
    if (target && target.closest && target.closest('.site, .browse')) {
      var near = nearestMarker(cx, cy);
      if (near) return { hit: { rec: near, el: elById[near.rid || near.id] || target }, el: target };
    }
    if (target && target.classList && target.classList.contains('atom-hit') &&
        typeof cx === 'number' && document.elementsFromPoint) {
      var own = recordFor(target);
      var stack = document.elementsFromPoint(cx, cy);
      var first = null;
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].classList && stack[i].classList.contains('atom-hit')) continue;
        var found = recordFor(stack[i]);
        if (!found) continue;
        // the circle's own territory wins: the shape it stands for may be a
        // fraction of a pixel across at this zoom, so the browser hit-tests
        // the country underneath it instead — Karikal and Yanaon are two
        // square kilometres, and without this they answer "British India"
        if (own && found.rec === own.rec) return { hit: found, el: stack[i] };
        if (!first) first = { hit: found, el: stack[i] };
      }
      // Nothing in the stack is the circle's own territory. Either its shape
      // is too small for the browser to hit — Karikal is two square
      // kilometres — in which case the circle is the only way to reach it, or
      // the shape is perfectly reachable and simply is not under the pointer,
      // in which case the country that is under the pointer wins. Size tells
      // the two apart: a target circle is 35 px across and the shapes it
      // stands for are meant to be smaller than that.
      var atomEl = atomEls[target.getAttribute('data-atom')];
      var sub = nearestSubUnit(atomEl, cx, cy);
      // measured on the sub-unit where there is one, because an atom can be a
      // scatter: French India runs from Mahe to Chandernagore and its box is
      // two thousand kilometres wide, while the settlement under the pointer
      // is a speck
      var shape = sub || atomEl;
      var box = shape && shape.getBoundingClientRect ? shape.getBoundingClientRect() : null;
      if (own && box && box.width < 12 && box.height < 12) {
        return { hit: own, el: shape || target };
      }
      if (first) return first;
      if (own) return { hit: own, el: shape || target };
    }
    var rec = recordFor(target);
    return rec ? { hit: rec, el: target } : null;
  }

  /* The sub-unit of an atom nearest a point on the screen, for when the shape
     itself is too small for the browser to hit-test. */
  function nearestSubUnit(atomEl, cx, cy) {
    if (!atomEl || !atomEl.querySelectorAll) return null;
    var pad = 3;
    var inside = null, insideArea = Infinity;
    var near = null, nearD = 64;          // 8 px, squared
    $$('[data-prov]', atomEl).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (cx >= r.left - pad && cx <= r.right + pad &&
          cy >= r.top - pad && cy <= r.bottom + pad) {
        // several sub-units can cover one pixel out here — the Aleutians are
        // a chain of specks — so the smallest box wins, being the one the
        // pointer is most specifically on
        var area = r.width * r.height;
        if (area < insideArea) { insideArea = area; inside = el; }
        return;
      }
      var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      var d = dx * dx + dy * dy;
      if (d < nearD) { nearD = d; near = el; }
    });
    return inside || near;
  }

  /* The sub-unit under the pointer, whatever it actually landed on: an islet
     ring, the whole-country backing and the small-atom target circles all sit
     above the sub-unit paths and carry no name of their own. */
  function provinceAt(got, cx, cy) {
    if (!got) return null;
    // with the Administrative layer off, a country is one thing: no province
    // is named and none is outlined. Islands and enclaves are exempt -- their
    // sub-units are places rather than administrative divisions
    var atom = got.el && got.el.closest ? got.el.closest('.atom') : null;
    if (!state.cats.territory && !(atom && atom.getAttribute('data-islands'))) {
      return null;
    }
    var prov = provinceOf(got.el);
    if (prov) return prov;
    if (typeof cx !== 'number') return null;
    var atomEl = got.el && got.el.closest ? got.el.closest('.atom') : null;
    var sub = nearestSubUnit(atomEl, cx, cy);
    return sub ? provinceOf(sub) : null;
  }

  function recordFor(target) {
    if (!target || !target.closest) return null;
    var el = target.closest('.site, .browse, .atom');
    if (!el) return null;
    var id = el.getAttribute('data-id');
    var rec = id && byId[id];
    if (!rec) return null;
    if ((rec.kind === 'site' || rec.kind === 'browse') && !siteVisible(rec)) return null;
    return { rec: rec, el: el };
  }

  function handleTap(target, cx, cy) {
    var got = pick(target, cx, cy);
    var hit = got && got.hit;
    lastProv = hit && hit.rec.kind === 'territory' ? provinceAt(got, cx, cy) : null;
    if (state.mode === 'quiz') {
      if (hit) { quizAnswer(hit); return; }
      if (quiz && quiz.current) {
        var fb = $('#q-feedback');
        fb.className = 'feedback bad';
        fb.textContent = 'Nothing there — try again.';
      }
      return;
    }
    select(hit ? (hit.rec.rid || hit.rec.id) : null);
  }

  var hot = null;

  /* Light up every atom of the territory under the pointer, not just the one
   * polygon it happens to be over. */
  function setHot(id) {
    if (hot === id) return;
    if (hot) (atomsOf[hot] || []).forEach(function (el) { el.classList.remove('hot'); });
    hot = id;
    if (hot) (atomsOf[hot] || []).forEach(function (el) { el.classList.add('hot'); });
    redrawHighlight();
  }

  var hotProv = null;
  var lastProv = null;

  /* The province under the pointer, picked out inside the lit-up country. */
  function setHotProv(el) {
    if (hotProv === el) return;
    if (hotProv) hotProv.classList.remove('prov-hot');
    hotProv = el;
    if (hotProv) hotProv.classList.add('prov-hot');
    redrawHighlight();
  }

  function provinceOf(target) {
    if (!target || !target.getAttribute) return null;
    var key = target.getAttribute('data-prov');
    if (!key) return null;
    var rec = (JMAP.PROVINCES || {})[key];
    // a handful of sub-units were called something else on one of the two
    // dates, or had not been separated out yet
    var per = JMAP.PROVINCE_EPOCH && JMAP.PROVINCE_EPOCH[state.epoch];
    var over = per && per[key];
    if (rec && over) {
      var merged = {};
      Object.keys(rec).forEach(function (k) { merged[k] = rec[k]; });
      Object.keys(over).forEach(function (k) { merged[k] = over[k]; });
      rec = merged;
    }
    return { key: key, rec: rec, el: target };
  }

  function onHover(e) {
    if (state.mode === 'quiz' || dragStart) { setHot(null); setHotProv(null); return; }
    var got = pick(e.target, e.clientX, e.clientY);
    var hit = got && got.hit;
    if (!hit) { setHot(null); setHotProv(null); hideTooltip(); return; }
    setHot(hit.rec.kind === 'territory' ? hit.rec.id : null);
    var prov = hit.rec.kind === 'territory' ? provinceAt(got, e.clientX, e.clientY) : null;
    lastProv = prov;
    setHotProv(prov ? prov.el : null);
    showTooltip(hit.rec, e.clientX, e.clientY, prov);
  }

  /* ------------------------------------------------------------ labels -- */

  function showTooltip(base, cx, cy, prov) {
    var rec = shown(base);
    tooltip.innerHTML = '';
    tooltip.appendChild(document.createTextNode(nameOf(rec)));
    if (prov && prov.rec) {
      var pv = document.createElement('span');
      pv.className = 'sub prov';
      pv.textContent = nameOf(prov.rec);
      tooltip.appendChild(pv);
    }
    var second = state.lang === 'en' ? rec.ja : rec.en;
    if (second && second !== nameOf(rec)) {
      var sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent = second;
      tooltip.appendChild(sub);
    }
    var when = rec.date || rec.when;
    if (when) {
      var w = document.createElement('span');
      w.className = 'sub when';
      w.textContent = when;
      tooltip.appendChild(w);
    }
    tooltip.hidden = false;
    var r = tooltip.getBoundingClientRect();
    var x = Math.min(Math.max(8, cx + 16), window.innerWidth - r.width - 8);
    var y = cy - r.height - 14;
    if (y < 8) y = cy + 22;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() { tooltip.hidden = true; }

  /* Selecting also lifts the polygons to the front, because a territory drawn
   * under its neighbours only shows part of its outline otherwise. The place
   * each one came from is remembered so the drawing order can be put back. */
  /* Outlines are drawn in a layer above the map rather than by shuffling the
   * map itself, so a shape's whole boundary shows even where a neighbour is
   * painted over it — and nothing gets buried in the process, which is what
   * happened to Sikkim when British India was raised to the front.
   *
   * A mask keeps only the part of each stroke that falls outside the shape.
   * That is what turns a heap of province outlines into one silhouette: the
   * seams between them lie inside the union and are masked away. */
  var maskSeq = 0;

  function outlineOf(els, cls, layer) {
    layer = layer || highlightLayer;
    if (!layer || !els.length || !hiDefs) return;
    var owned = ownedDefs[layer === subOutlineLayer ? 'sub' : 'hi'];
    var id = 'mask-' + (++maskSeq);
    // The mask reaches past the frame, so a shape lying against the edge of the
    // map — the Soviet Union, Australia, the Aleutians — is not shaved flat.
    var pad = 60;
    var mask = svgEl('mask', { id: id, maskUnits: 'userSpaceOnUse',
                               x: -pad, y: -pad,
                               width: mapW + pad * 2, height: mapH + pad * 2 });
    mask.appendChild(svgEl('rect', { x: -pad, y: -pad,
                                     width: mapW + pad * 2, height: mapH + pad * 2,
                                     fill: '#fff' }));
    var group = svgEl('g', { 'class': cls });

    // built fresh rather than cloned: a clone drags its id, its data
    // attributes and its inline custom property along with it, and a second
    // element with the same id in the document is asking for trouble
    function copyOf(shape, attrs) {
      var el;
      if (shape.tagName === 'circle') {
        el = svgEl('circle', { cx: shape.getAttribute('cx'), cy: shape.getAttribute('cy'),
                               r: shape.getAttribute('r') });
      } else {
        el = svgEl('path', { d: shape.getAttribute('d') });
      }
      Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      return el;
    }

    function stroked(shape, clip) {
      var el = copyOf(shape, clip ? { 'clip-path': clip } : null);
      el.setAttribute('mask', 'url(#' + id + ')');
      group.appendChild(el);
    }

    els.forEach(function (el) {
      // an element that carries a clip is really the intersection of two
      // shapes: the occupied zone is its traced blocks cut to China's land.
      // The mask has to be that intersection, and the outline is made of both
      // boundaries, each cut by the other — otherwise the whole coast, where
      // the clip is the visible edge, comes out with no line on it at all.
      var clip = el.getAttribute('clip-path');
      var paths = el.tagName === 'path' ? [el] : $$('path', el);
      // .islet is a ring drawn round an island too small to see, not a shape.
      // Filled black in the mask it wiped out the coastline underneath it, and
      // stroked in the outline it drew a circle in open water.
      var circles = el.tagName === 'path' ? [] : $$('circle:not(.islet-hit):not(.islet)', el);
      paths.concat(circles).forEach(function (shape) {
        var solid = copyOf(shape, { fill: '#000' });
        if (clip) solid.setAttribute('clip-path', clip);
        mask.appendChild(solid);
        stroked(shape, clip);
      });
      if (clip) {
        var m = /url\(#([^)]+)\)/.exec(clip);
        var clipper = m && svg.querySelector('#' + m[1]);
        if (clipper) {
          // the other half of the intersection's boundary, cut to this shape
          var own = svgEl('clipPath', { id: id + '-own', clipPathUnits: 'userSpaceOnUse' });
          paths.forEach(function (shape) { own.appendChild(copyOf(shape)); });
          hiDefs.appendChild(own);
          owned.push(own);
          $$('path', clipper).forEach(function (shape) {
            stroked(shape, 'url(#' + id + '-own)');
          });
        }
      }
    });
    hiDefs.appendChild(mask);
    owned.push(mask);
    layer.appendChild(group);
    return group;
  }

  function dropDefs(which) {
    ownedDefs[which].forEach(function (d) { if (d.parentNode) d.parentNode.removeChild(d); });
    ownedDefs[which] = [];
  }

  function clearHighlight() {
    if (highlightLayer) highlightLayer.innerHTML = '';
    dropDefs('hi');
  }

  function redrawHighlight() {
    clearHighlight();
    if (hot && atomsOf[hot]) outlineOf(atomsOf[hot], 'hi-territory');
    if (hotProv) outlineOf([hotProv], 'hi-province');
    if (selected && atomsOf[selected]) outlineOf(atomsOf[selected], 'hi-selected');
  }

  function markSelected(id, on) {
    if (!id) return;
    var els = atomsOf[id] || (elById[id] ? [elById[id]] : []);
    if (!atomsOf[id]) els.forEach(function (el) { el.classList.toggle('sel', on); });
  }

  function select(id) {
    markSelected(selected, false);
    selected = null;
    if (!id || !byId[id]) {
      infoBox.hidden = true;
      document.body.classList.toggle('panel-open', !quizBox.hidden);
      redrawHighlight();
      placeLabels();
      return;
    }

    var rec = shown(byId[id]);
    selected = id;
    markSelected(id, true);
    redrawHighlight();

    var primary = rec[state.lang] || rec.en;
    var others = LANGS
      .filter(function (l) { return l !== state.lang; })
      .map(function (l) { return rec[l]; })
      .filter(function (n) { return n && n !== primary; });

    var info = catInfo(rec.cat);
    var chip = $('.chip', infoBox);
    chip.textContent = info ? nameOf(info) : rec.cat;
    chip.style.setProperty('--chip', info ? info.c : 'var(--muted)');
    $('.primary', infoBox).textContent = primary;
    $('.alt', infoBox).textContent = others.join('  ·  ');
    // on a touch screen there is no hover, so the sub-unit under the finger
    // has nowhere else to be said
    var prov = lastProv && lastProv.rec ? nameOf(lastProv.rec) : '';
    $('.prov', infoBox).textContent = prov;
    $('.prov', infoBox).hidden = !prov;
    $('.when', infoBox).textContent = rec.date || rec.when || '';
    $('.when', infoBox).hidden = !(rec.date || rec.when);
    $('.note', infoBox).textContent = rec.note || '';
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    hideTooltip();
    placeLabels();
    keepClear(id);
  }

  /* On a phone the detail sheet comes up over the bottom of the map, which is
   * often exactly where you just tapped. Slide the map up by however much the
   * sheet covers it, so what you asked about stays in view. */
  function keepClear(id) {
    if (!svg || window.innerWidth >= 1000 || infoBox.hidden) return;
    var m = svg.getScreenCTM();
    if (!m) return;
    var p = sitePos[id];
    if (!p) {
      var el = elById[id];
      if (!el || !el.getBBox) return;
      var box;
      try { box = el.getBBox(); } catch (err) { return; }
      p = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    var sx = m.a * p.x + m.c * p.y + m.e;
    var sy = m.b * p.x + m.d * p.y + m.f;
    var sheet = infoBox.getBoundingClientRect();
    if (sx < sheet.left - 8 || sx > sheet.right + 8) return;   // the sheet is not over it
    var over = sy - (sheet.top - 12);
    if (over <= 0) return;
    var c = containerSize();
    view.y += over * (view.h / c.h);
    applyView();
  }

  /* ----------------------------------------------------- applying state -- */

  function applyState() {
    var quizzing = state.mode === 'quiz';
    var showLabels = state.labels && !quizzing;

    JMAP.SITES.forEach(function (s) {
      var el = elById[s.id];
      if (el) el.style.display = siteVisible(s) ? '' : 'none';
    });
    if (browseGroup) browseGroup.style.display = browseVisible() ? '' : 'none';

    labels.forEach(function (L) {
      var show = showLabels && (L.rec.kind === 'territory'
        ? (L.rec.lvl <= state.level && state.cats.territory)
        : siteVisible(L.rec));
      if (!show) {
        L.el.textContent = '';
        L.el.style.display = 'none';
        L.w = 0;
        return;
      }
      var text = nameOf(L.rec);
      L.el.textContent = text;
      L.w = estimateWidth(text, L.size);
    });

    if (extentPath) {
      extentPath.style.display = (state.epoch === 'e1942' && state.extent) ? '' : 'none';
    }
    if (nanyoPath) {
      nanyoPath.style.display = state.epoch === 'e1930' ? '' : 'none';
    }
    if (riversGroup) {
      riversGroup.style.display = state.rivers ? '' : 'none';
      var flood = state.epoch === 'e1942';
      var lower = svg.querySelector('#river-yellow_lower');
      if (lower) lower.style.display = flood ? 'none' : '';
      if (yellow1938) yellow1938.style.display = flood ? '' : 'none';
    }

    container.classList.toggle('quizzing', quizzing);
    if (quizzing) { hideTooltip(); infoBox.hidden = true; }
    quizBox.hidden = !quizzing;
    document.body.classList.toggle('panel-open', !infoBox.hidden || !quizBox.hidden);

    $('#opt-labels').disabled = quizzing;
    buildLegend();
    if (showLabels) placeLabels();
    saveState();
  }

  /* ------------------------------------------------------------ legend -- */

  function buildLegend() {
    var legend = $('#legend');
    if (!legend) return;
    legend.innerHTML = '';
    if (state.mode === 'quiz') { legend.hidden = true; return; }

    var used = {};
    territories().forEach(function (t) { used[t.cat] = true; });

    var epoch = JMAP.EPOCHS.filter(function (e) { return e.id === state.epoch; })[0];
    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'legend-head';
    head.setAttribute('aria-expanded', state.legend ? 'true' : 'false');
    head.setAttribute('aria-controls', 'legend-body');
    head.appendChild(document.createTextNode(nameOf(epoch)));
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    head.appendChild(caret);
    // the fold state lives on #legend itself, which is why the handler holds
    // its own reference: the local below is repointed at the body in a moment,
    // and a closure over it would fold the wrong element
    var root = legend;
    head.addEventListener('click', function () {
      state.legend = !state.legend;
      root.classList.toggle('folded', !state.legend);
      head.setAttribute('aria-expanded', state.legend ? 'true' : 'false');
      saveState();
      placeLabels();
    });
    legend.appendChild(head);
    legend.classList.toggle('folded', !state.legend);

    var body = document.createElement('div');
    body.id = 'legend-body';
    body.className = 'legend-body';
    legend.appendChild(body);
    var appendTo = legend;
    legend = body;                   // rows go inside the folding part

    catList().forEach(function (c) {
      if (!used[c.id]) return;
      var row = document.createElement('div');
      row.className = 'item';
      var sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = c.c;
      row.appendChild(sw);
      row.appendChild(document.createTextNode(nameOf(c)));
      legend.appendChild(row);
    });

    if (state.epoch === 'e1942' && state.extent && JMAP.EXTENT_1942) {
      var row = document.createElement('div');
      row.className = 'item';
      var sw = document.createElement('span');
      sw.className = 'sw line';
      row.appendChild(sw);
      row.appendChild(document.createTextNode(nameOf(JMAP.EXTENT_1942)));
      legend.appendChild(row);
      var src = document.createElement('p');
      src.className = 'legend-src';
      src.textContent = JMAP.EXTENT_1942.source;
      legend.appendChild(src);
    }

    if (nanyoPath && nanyoPath.style.display !== 'none') {
      var nrow = document.createElement('div');
      nrow.className = 'item';
      var nsw = document.createElement('span');
      nsw.className = 'sw nanyo';
      nrow.appendChild(nsw);
      nrow.appendChild(document.createTextNode(nameOf(JMAP.NANYO_BOUNDS)));
      legend.appendChild(nrow);
    }

    if (state.rivers) {
      var rrow = document.createElement('div');
      rrow.className = 'item';
      var rsw = document.createElement('span');
      rsw.className = 'sw river';
      rrow.appendChild(rsw);
      rrow.appendChild(document.createTextNode(
        state.epoch === 'e1942'
          ? 'Yangzi and Yellow rivers (Yellow River in its 1938–47 course)'
          : 'Yangzi and Yellow rivers'));
      legend.appendChild(rrow);
    }

    JMAP.SITE_CATEGORIES.forEach(function (c) {
      if (!state.cats[c.id]) return;
      var row = document.createElement('div');
      row.className = 'item';
      var sw = document.createElement('span');
      sw.className = 'sw ' + (c.id === 'city' ? 'round' : 'diamond');
      sw.style.background = c.c;
      row.appendChild(sw);
      row.appendChild(document.createTextNode(nameOf(c)));
      legend.appendChild(row);
    });

    if (state.browse) {
      var brow = document.createElement('div');
      brow.className = 'item';
      var bsw = document.createElement('span');
      bsw.className = 'sw round browse-sw';
      brow.appendChild(bsw);
      brow.appendChild(document.createTextNode('Other major cities (not examined)'));
      legend.appendChild(brow);
    }

    appendTo.hidden = false;
  }

  function buildEpochControl() {
    var seg = $('#epoch-seg');
    JMAP.EPOCHS.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-epoch', e.id);
      b.textContent = e.en;
      b.classList.toggle('on', e.id === state.epoch);
      b.addEventListener('click', function () {
        if (state.epoch === e.id) return;
        state.epoch = e.id;
        $$('#epoch-seg button').forEach(function (x) { x.classList.toggle('on', x === b); });
        select(null);
        composeEpoch();
        applyState();
        if (state.mode === 'quiz') startQuiz();
        else showEpochBlurb();
      });
      seg.appendChild(b);
    });
  }

  function showHint() {
    var hint = document.getElementById('hint');
    if (!hint) return;
    hint.hidden = false;
    var go = function () { hint.hidden = true; };
    container.addEventListener('pointerdown', go, { once: true });
    window.setTimeout(go, 9000);
  }

  function showEpochBlurb() {
    var epoch = JMAP.EPOCHS.filter(function (e) { return e.id === state.epoch; })[0];
    if (!epoch) return;
    var chip = $('.chip', infoBox);
    chip.textContent = 'The map in ' + epoch.en;
    chip.style.setProperty('--chip', 'var(--accent)');
    $('.primary', infoBox).textContent = epoch.en;
    $('.alt', infoBox).textContent = '';
    $('.when', infoBox).textContent = '';
    $('.when', infoBox).hidden = true;
    $('.note', infoBox).textContent = epoch.blurb;
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
  }

  function syncLayerButtons() {
    $$('#layer-seg button').forEach(function (b) {
      var on = !!state.cats[b.getAttribute('data-cat')];
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* -------------------------------------------------------------- quiz -- */

  var quiz = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function startQuiz() {
    var pool = quizPool();
    if (pool.length < 2) {
      state.mode = 'explore';
      setModeButtons();
      window.alert('Turn on at least a couple of layers before starting a quiz.');
      applyState();
      return;
    }
    var stale = $('.summary', quizBox);
    if (stale) stale.remove();
    quiz = { queue: shuffle(pool.slice()), total: pool.length, asked: 0, correct: 0,
             attempts: 0, missed: [], skipped: [], current: null };
    nextQuestion();
  }

  function nextQuestion() {
    quizBox.classList.remove('done');
    $('#q-reveal').textContent = 'Show me';
    clearReveal();
    $('#q-feedback').textContent = '';
    $('#q-feedback').className = 'feedback';
    if (!quiz.queue.length) { finishQuiz(); return; }
    quiz.current = quiz.queue.pop();
    quiz.attempts = 0;
    quiz.asked++;
    renderQuizHead();
    $('#q-target').textContent = nameOf(quiz.current);
    $('#q-reveal').disabled = false;
    $('#q-skip').disabled = false;
    ensureOnScreen(quiz.current);
  }

  /* A question you cannot reach is not a question. But centring on the answer
   * would give it away, so the first move is simply to go back to the opening
   * view; only if the answer is still not reachable there does the map frame
   * it, and then loosely, among its neighbours. */
  function ensureOnScreen(rec) {
    if (!rec || !svg) return;
    var state0 = reachable(rec);
    if (state0 === true) return;
    // a marker that is on screen but has a neighbour's marker sitting on it
    // just needs the map opened out a little
    if (state0 === 'crowded') { focusOn(rec); return; }
    view = defaultView();
    applyView(true);
    if (reachable(rec) === true) return;
    focusOn(rec, 3);
  }

  function reachable(rec) {
    if (!rec || !svg) return true;
    var st = document.getElementById('stage').getBoundingClientRect();
    var floor = quizBox.hidden ? st.bottom
                               : Math.min(st.bottom, quizBox.getBoundingClientRect().top);
    // A territory is reachable if any of its shapes has real estate in the
    // part of the map you can still see. Testing a single centre point is no
    // good: the middle of the Indies bounding box is open sea.
    if (rec.kind === 'territory') {
      var area = 0;
      (atomsOf[rec.id] || []).forEach(function (el) {
        var r = el.getBoundingClientRect();
        var w = Math.min(r.right, st.right) - Math.max(r.left, st.left);
        var h = Math.min(r.bottom, floor) - Math.max(r.top, st.top);
        if (w > 0 && h > 0) area += w * h;
      });
      return area > 900;
    }
    var m = svg.getScreenCTM();
    if (!m) return true;
    var pt = sitePos[rec.rid || rec.id];
    if (!pt) return true;
    var sx = m.a * pt.x + m.c * pt.y + m.e;
    var sy = m.b * pt.x + m.d * pt.y + m.f;
    var pad = 24;
    if (!(sx > st.left + pad && sx < st.right - pad &&
          sy > st.top + pad && sy < floor - pad)) return false;
    // being on screen is not enough: at a wide zoom a neighbouring city's
    // marker can sit on top of the answer's own, so check the tap would land
    var el = document.elementFromPoint(sx, sy);
    var own = el && el.closest && el.closest('.site');
    return (own && own.getAttribute('data-id') === rec.id) ? true : 'crowded';
  }

  function renderQuizHead() {
    $('#q-correct').textContent = quiz.correct;
    $('#q-asked').textContent = quiz.asked;
    $('#q-total').textContent = quiz.current ? ' · ' + quiz.queue.length + ' to go' : '';
  }

  function quizAnswer(hit) {
    if (!quiz || !quiz.current) return;
    var fb = $('#q-feedback');
    if (hit.rec.id === quiz.current.id) {
      if (quiz.attempts === 0) quiz.correct++;
      fb.textContent = 'Correct — ' + nameOf(quiz.current) + '.';
      fb.className = 'feedback good';
      renderQuizHead();
      flash(quiz.current);
      window.setTimeout(function () { if (quiz) nextQuestion(); }, 1000);
      return;
    }

    quiz.attempts++;
    if (quiz.missed.indexOf(quiz.current) < 0) quiz.missed.push(quiz.current);
    hit.el.classList.add('wrong');
    window.setTimeout(function () { hit.el.classList.remove('wrong'); }, 450);
    fb.className = 'feedback bad';
    fb.textContent = quiz.attempts >= 2
      ? 'That is ' + nameOf(hit.rec) + '. Try “Show me”.'
      : 'That is ' + nameOf(hit.rec) + ' — try again.';
  }

  function revealAnswer() {
    if (!quiz || !quiz.current) return;
    if (quiz.missed.indexOf(quiz.current) < 0) quiz.missed.push(quiz.current);
    focusOn(quiz.current);
    flash(quiz.current);
    $('#q-feedback').textContent = 'Here it is: ' + nameOf(quiz.current) + '.';
    $('#q-feedback').className = 'feedback bad';
    $('#q-reveal').disabled = true;
    window.setTimeout(function () { if (quiz) nextQuestion(); }, 1900);
  }

  /* Skipping sends the question to the back of the queue so it comes round
   * again — but only once, or a place the student cannot find keeps the quiz
   * from ever ending. */
  function skipQuestion() {
    if (!quiz || !quiz.current) return;
    if (quiz.missed.indexOf(quiz.current) < 0) quiz.missed.push(quiz.current);
    if (quiz.skipped.indexOf(quiz.current) < 0) {
      quiz.skipped.push(quiz.current);
      quiz.queue.unshift(quiz.current);
      quiz.asked--;
    }
    nextQuestion();
  }

  function finishQuiz() {
    quiz.current = null;
    var pct = quiz.asked ? Math.round(100 * quiz.correct / quiz.asked) : 0;
    quizBox.classList.add('done');
    $('#q-target').textContent = 'Finished — ' + quiz.correct + ' of ' + quiz.asked
      + ' first time (' + pct + '%)';
    $('#q-feedback').textContent = '';
    $('#q-reveal').textContent = 'Try again';
    $('#q-reveal').disabled = false;
    $('#q-skip').disabled = true;

    var old = $('.summary', quizBox);
    if (old) old.remove();
    if (quiz.missed.length) {
      var div = document.createElement('div');
      div.className = 'summary';
      div.appendChild(document.createTextNode('Worth another look:'));
      var ul = document.createElement('ul');
      quiz.missed.forEach(function (m) {
        var li = document.createElement('li');
        li.textContent = nameOf(m);
        ul.appendChild(li);
      });
      div.appendChild(ul);
      quizBox.appendChild(div);
    }
  }

  function endQuiz() {
    quiz = null;
    var old = $('.summary', quizBox);
    if (old) old.remove();
    state.mode = 'explore';
    setModeButtons();
    applyState();
  }

  var flashTimer = null;

  function flash(rec) {
    clearReveal();
    var key = rec.rid || rec.id;
    var els = rec.kind === 'territory'
      ? (atomsOf[key] || [])
      : (elById[key] ? [elById[key]] : []);
    els.forEach(function (el) { el.classList.add('reveal'); });
    flashTimer = window.setTimeout(function () {
      els.forEach(function (el) { el.classList.remove('reveal'); });
    }, 1600);
  }

  function clearReveal() {
    if (flashTimer) { window.clearTimeout(flashTimer); flashTimer = null; }
    $$('.reveal', svg).forEach(function (el) { el.classList.remove('reveal'); });
  }

  /* ---------------------------------------------------------- controls -- */

  function setModeButtons() {
    $$('#bar [data-mode]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === state.mode);
    });
  }

  function wireControls() {
    $$('#bar [data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-mode');
        if (mode === state.mode) return;
        state.mode = mode;
        setModeButtons();
        if (mode === 'quiz') { select(null); applyState(); startQuiz(); }
        else { endQuiz(); }
      });
    });

    // the three kinds of place, on and off. They are switches rather than a
    // one-of-three group, so they carry aria-pressed and not aria-checked
    $$('#layer-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-cat');
        state.cats[cat] = !state.cats[cat];
        syncLayerButtons();
        applyState();
        if (state.mode === 'quiz') startQuiz();
      });
    });

    $$('#level-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = parseInt(b.getAttribute('data-level'), 10);
        var widening = next > state.level;
        state.level = next;
        $$('#level-seg button').forEach(function (x) { x.classList.toggle('on', x === b); });
        applyState();
        if (widening) { view = defaultView(); applyView(true); }
        if (state.mode === 'quiz') startQuiz();
      });
    });

    $$('#lang-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.lang = b.getAttribute('data-lang');
        $$('#lang-seg button').forEach(function (x) { x.classList.toggle('on', x === b); });
        applyState();
        if (selected) select(selected);
        if (quiz && quiz.current) $('#q-target').textContent = nameOf(quiz.current);
      });
    });

    var optLabels = $('#opt-labels');
    optLabels.checked = state.labels;
    optLabels.addEventListener('change', function () { state.labels = optLabels.checked; applyState(); });

    var optExtent = $('#opt-extent');
    optExtent.checked = state.extent;
    optExtent.addEventListener('change', function () { state.extent = optExtent.checked; applyState(); });

    var optRivers = $('#opt-rivers');
    optRivers.checked = state.rivers;
    optRivers.addEventListener('change', function () { state.rivers = optRivers.checked; applyState(); });

    var optBrowse = $('#opt-browse');
    optBrowse.checked = state.browse;
    optBrowse.addEventListener('change', function () {
      state.browse = optBrowse.checked;
      applyState();
      if (state.browse) rescale();
    });

    $('#btn-options').addEventListener('click', function () { $('#dlg-options').showModal(); });
    $('#btn-about').addEventListener('click', function () { $('#dlg-about').showModal(); });
    $$('dialog').forEach(function (d) {
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });

    $('#info-close').addEventListener('click', function () { select(null); });
    $('#q-reveal').addEventListener('click', revealAnswer);
    $('#q-skip').addEventListener('click', skipQuestion);
    $('#q-end').addEventListener('click', endQuiz);

    $('#zoom-in').addEventListener('click', function () { zoomCentre(1.5); });
    $('#zoom-out').addEventListener('click', function () { zoomCentre(1 / 1.5); });
    $('#zoom-reset').addEventListener('click', function () { view = defaultView(); applyView(true); });

    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('input, textarea, dialog')) return;
      if (e.key === 'Escape') { select(null); hideTooltip(); }
      if (e.key === '+' || e.key === '=') zoomCentre(1.4);
      if (e.key === '-' || e.key === '_') zoomCentre(1 / 1.4);
      if (e.key === '0') { view = defaultView(); applyView(true); }
    });

    $$('#level-seg button').forEach(function (b) {
      b.classList.toggle('on', parseInt(b.getAttribute('data-level'), 10) === state.level);
    });
    syncLayerButtons();
    $$('#lang-seg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-lang') === state.lang);
    });
    setModeButtons();
  }

  function zoomCentre(factor) {
    var r = container.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  }
}());
