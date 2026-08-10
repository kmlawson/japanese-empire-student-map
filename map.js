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
  var chinaBase = null;   // modern China outline, under the provinces
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
    } catch (err) { /* first visit, or storage is off — defaults are fine */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        epoch: state.epoch, level: state.level, lang: state.lang,
        cats: state.cats, labels: state.labels, extent: state.extent,
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

  function siteVisible(s) { return state.cats[s.cat] && s.lvl <= state.level && siteInEpoch(s); }

  function quizPool() {
    return territories().concat(JMAP.SITES).filter(inQuiz);
  }

  /* ------------------------------------------------------------- boot -- */

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
    buildExtentLine();
    hatchGroup = svg.querySelector('#hatching');
    chinaBase = svg.querySelector('#chinabase');

    $$('.atom', svg).forEach(function (el) { atomEls[el.id.replace(/^a-/, '')] = el; });
    buildAtomHits();

    JMAP.SITES.forEach(function (s) { s.kind = 'site'; });
    buildMarkers();
    buildSiteLabels();
    buildEpochControl();
    buildCatToggles();

    wireControls();
    wirePointer();

    composeEpoch();
    applyState();
    view = defaultView();
    applyView(true);

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
      var cx = parseFloat(el.getAttribute('data-cx'));
      var cy = parseFloat(el.getAttribute('data-cy'));
      if (isNaN(cx) || isNaN(cy)) return;
      var hit = svgEl('circle', { 'class': 'atom atom-hit', r: HIT_R * 0.8 });
      layer.appendChild(hit);
      atomHits[a] = hit;
      scalables.push({ el: hit, x: cx, y: cy });
    });
  }

  var extentPath = null;

  /* Gordon's "greatest extent" perimeter, drawn over everything as a dashed
   * line. It is a limit, not a boundary, so it is never interactive. */
  function buildExtentLine() {
    if (!JMAP.EXTENT_1942) return;
    var d = JMAP.EXTENT_1942.ring.map(function (p, i) {
      var q = project(p[0], p[1]);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join('') + 'Z';
    extentPath = svgEl('path', { id: 'extent-1942', d: d });
    svg.insertBefore(extentPath, markersGroup);
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
  }

  /* --------------------------------------------------- epoch composition -- */

  function composeEpoch() {
    // clear anything the previous epoch left behind
    Object.keys(atomEls).forEach(function (a) {
      var el = atomEls[a];
      el.removeAttribute('data-id');
      el.style.removeProperty('--c');
      el.classList.remove('sel');
      if (atomHits[a]) atomHits[a].removeAttribute('data-id');
    });
    hatchGroup.innerHTML = '';
    hot = null;
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

    JMAP.SITES.forEach(function (s) { byId[s.id] = s; });

    territories().forEach(function (t) {
      t.kind = 'territory';
      byId[t.id] = t;
      var colour = catInfo(t.cat);
      var els = [];
      var mx = 0, my = 0, total = 0;

      t.atoms.forEach(function (a) {
        var el = atomEls[a];
        if (!el) { return; }
        el.setAttribute('data-id', t.id);
        el.setAttribute('data-cat', t.cat);
        if (colour) el.style.setProperty('--c', colour.c);
        els.push(el);
        if (atomHits[a]) atomHits[a].setAttribute('data-id', t.id);

        var area = parseFloat(el.getAttribute('data-area')) || 1;
        mx += area * parseFloat(el.getAttribute('data-cx'));
        my += area * parseFloat(el.getAttribute('data-cy'));
        total += area;

        if (t.hatch) {
          var path = el.tagName === 'path' ? el : el.querySelector('path');
          if (path) {
            var clone = svgEl('path', { 'class': 'hatch-fill', d: path.getAttribute('d') });
            hatchGroup.appendChild(clone);
          }
        }
      });

      atomsOf[t.id] = els;
      elById[t.id] = els[0] || null;

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

    labels.sort(function (a, b) {
      if (a.rec.lvl !== b.rec.lvl) return a.rec.lvl - b.rec.lvl;
      if (a.rec.kind !== b.rec.kind) return a.rec.kind === 'territory' ? -1 : 1;
      return 0;
    });

    // paint the backing outline in whatever colour China proper has this
    // epoch, so the seams between the two sources read as border, not sea
    if (chinaBase) {
      var host = territories().filter(function (t) { return t.atoms.indexOf('china') >= 0; })[0];
      var c = host && catInfo(host.cat);
      chinaBase.style.setProperty('--c', c ? c.c : 'var(--inactive)');
    }

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

    var cropToHome = aspect < (bw / bh) / 1.7;
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

    var maxW = fitView().w;
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
    var zoomed = force || Math.abs(view.w - lastScaleW) > 0.01;
    if (zoomed) lastScaleW = view.w;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        if (zoomed) rescale();
        placeLabels();
      });
    }
  }

  var hatchPattern = null;

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
    var before = { cx: view.x + view.w / 2, cy: view.y + view.h / 2, w: view.w };
    var c = containerSize();
    view.w = Math.min(before.w, fitView().w);
    view.h = view.w / (c.w / c.h);
    view.x = before.cx - view.w / 2;
    view.y = before.cy - view.h / 2;
    applyView(true);
  }

  /* Centre the view on a record. Site markers carry a scale transform, so
   * their getBBox() is in their own local frame and useless here — the
   * projected position is the truth. */
  function focusOn(rec) {
    var cx, cy, want;
    if (rec.kind === 'site') {
      var p = sitePos[rec.id];
      cx = p.x; cy = p.y; want = 420;
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
      want = Math.max((b.x1 - b.x0) * 1.9, (b.y1 - b.y0) * 1.9, 300);
    }
    var maxW = fitView().w;
    view.w = Math.min(Math.max(want, mapW / 40), maxW);
    view.h = view.w / (containerSize().w / containerSize().h);
    view.x = cx - view.w / 2;
    view.y = cy - view.h / 2;
    applyView();
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
      container.addEventListener('mouseleave', function () { setHot(null); hideTooltip(); });
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

    if (had === 1 && !movedFar && e.type === 'pointerup') handleTap(downTarget);
    downTarget = null;
  }

  function onWheel(e) {
    e.preventDefault();
    var delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(e.clientX, e.clientY, Math.exp(-delta * 0.0016));
  }

  /* ------------------------------------------------------- hit testing -- */

  function recordFor(target) {
    if (!target || !target.closest) return null;
    var el = target.closest('.site, .atom');
    if (!el) return null;
    var id = el.getAttribute('data-id');
    var rec = id && byId[id];
    if (!rec) return null;
    if (rec.kind === 'site' && !siteVisible(rec)) return null;
    return { rec: rec, el: el };
  }

  function handleTap(target) {
    var hit = recordFor(target);
    if (state.mode === 'quiz') {
      if (hit) quizAnswer(hit);
      return;
    }
    select(hit ? hit.rec.id : null);
  }

  var hot = null;

  /* Light up every atom of the territory under the pointer, not just the one
   * polygon it happens to be over. */
  function setHot(id) {
    if (hot === id) return;
    if (hot) (atomsOf[hot] || []).forEach(function (el) { el.classList.remove('hot'); });
    hot = id;
    if (hot) (atomsOf[hot] || []).forEach(function (el) { el.classList.add('hot'); });
  }

  function onHover(e) {
    if (state.mode === 'quiz' || dragStart) { setHot(null); return; }
    var hit = recordFor(e.target);
    if (!hit) { setHot(null); hideTooltip(); return; }
    setHot(hit.rec.kind === 'territory' ? hit.rec.id : null);
    showTooltip(hit.rec, e.clientX, e.clientY);
  }

  /* ------------------------------------------------------------ labels -- */

  function showTooltip(base, cx, cy) {
    var rec = shown(base);
    tooltip.innerHTML = '';
    tooltip.appendChild(document.createTextNode(nameOf(rec)));
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

  function markSelected(id, on) {
    if (!id) return;
    var els = atomsOf[id] || (elById[id] ? [elById[id]] : []);
    els.forEach(function (el) { el.classList.toggle('sel', on); });
  }

  function select(id) {
    markSelected(selected, false);
    selected = null;
    if (!id || !byId[id]) {
      infoBox.hidden = true;
      document.body.classList.toggle('panel-open', !quizBox.hidden);
      placeLabels();
      return;
    }

    var rec = shown(byId[id]);
    selected = id;
    markSelected(id, true);

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
    $('.when', infoBox).textContent = rec.date || rec.when || '';
    $('.when', infoBox).hidden = !(rec.date || rec.when);
    $('.note', infoBox).textContent = rec.note || '';
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    hideTooltip();
    placeLabels();
  }

  /* ----------------------------------------------------- applying state -- */

  function applyState() {
    var quizzing = state.mode === 'quiz';
    var showLabels = state.labels && !quizzing;

    JMAP.SITES.forEach(function (s) {
      var el = elById[s.id];
      if (el) el.style.display = siteVisible(s) ? '' : 'none';
    });

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
    var head = document.createElement('p');
    head.className = 'legend-head';
    head.textContent = nameOf(epoch);
    legend.appendChild(head);

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

    legend.hidden = false;
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

  function buildCatToggles() {
    var wrap = $('#cat-toggles');
    var rows = [{ id: 'territory', en: 'Territories', ja: '領域', orig: 'Territories', c: null }]
      .concat(JMAP.SITE_CATEGORIES);
    rows.forEach(function (c) {
      var label = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = state.cats[c.id];
      cb.addEventListener('change', function () {
        state.cats[c.id] = cb.checked;
        applyState();
      });
      label.appendChild(cb);
      if (c.c) {
        var sw = document.createElement('span');
        sw.className = 'sw ' + (c.id === 'city' ? 'round' : 'diamond');
        sw.style.background = c.c;
        label.appendChild(sw);
      }
      label.appendChild(document.createTextNode(
        c.id === 'territory' ? 'Territories (in the quiz; always clickable)' : c.en));
      wrap.appendChild(label);
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
  }

  function renderQuizHead() {
    $('#q-correct').textContent = quiz.correct;
    $('#q-asked').textContent = quiz.asked;
    $('#q-total').textContent = ' · ' + quiz.queue.length + ' to go';
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
    $('#q-target').textContent = 'Finished — ' + quiz.correct + ' of ' + quiz.asked + ' first time (' + pct + '%)';
    $('#q-feedback').textContent = '';
    $('#q-reveal').disabled = true;
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
    var els = rec.kind === 'site'
      ? (elById[rec.id] ? [elById[rec.id]] : [])
      : (atomsOf[rec.id] || []);
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
