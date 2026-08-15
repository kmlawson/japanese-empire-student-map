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
    // The map opens bare: 1930, no cities, no events, no divisions. Everything
    // here is something the reader can switch on, and a map that arrives with
    // three layers already on gives them nothing to switch. Administrative is
    // also more than half the weight of the map and is fetched only when it is
    // asked for, so an opening view without it is a faster one.
    cats: { city: false, battle: false, territory: false },
    labels: false,
    extent: true,
    rivers: true,
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
  var subsLiftLayer = null;
  var hiDefs = null;
  var ownedDefs = { hi: [], sub: [] };
  var proj = null;
  var mapW = 0, mapH = 0;

  var atomEls = {};
  // the whole-country fillers, in their own layer under every atom
  var backingEls = {};       // atom id -> element
  var seamEls = {};          // atom id -> [elements] in the seam layer
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
      // The year and the three layer buttons are deliberately not restored.
      // The map is a teaching one and every visit should start from the same
      // place — 1930, nothing switched on — rather than from wherever the last
      // reader happened to leave it, which on a shared machine is nowhere the
      // next reader chose. The rest below is preference and does carry over.
      state.labels = !!saved.labels;
      if (typeof saved.extent === 'boolean') state.extent = saved.extent;
      if (typeof saved.rivers === 'boolean') state.rivers = saved.rivers;
      if (typeof saved.legend === 'boolean') state.legend = saved.legend;
    } catch (err) { /* first visit, or storage is off — defaults are fine */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        epoch: state.epoch, level: state.level,
        cats: state.cats, labels: state.labels, extent: state.extent,
        rivers: state.rivers, legend: state.legend,
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

  /* Every other name a record carries, in a fixed order, with the one already
     shown as the headline left out. */
  /* Two spellings of one name should not both be printed. Strip the reading in
     brackets, strip the separators, and fold the kyūjitai and traditional forms
     onto the modern ones — 長野縣 and 長野県 are one name, and so are 日本內地
     and 日本内地. */
  var KANJI_VARIANTS = { '縣': '県', '國': '国', '內': '内', '灣': '湾', '臺': '台',
                         '滿': '満', '鐵': '鉄', '澤': '沢', '廣': '広', '眞': '真',
                         '對': '対', '單': '単', '會': '会', '學': '学', '龍': '竜' };
  function nameKey(s) {
    return String(s)
      .replace(/\s*[（(][^)）]*[)）]\s*/g, '')
      .replace(/[\s·・,，]/g, '')
      .replace(/[縣國內灣臺滿鐵澤廣眞對單會學龍]/g, function (c) { return KANJI_VARIANTS[c]; })
      .toLowerCase();
  }

  function otherNames(rec) {
    if (!rec) return '';
    var r = shown(rec);
    // One entry per distinct name, keeping the fullest spelling of each: the
    // same name is often stored two or three times over — Chinese holds the
    // bare characters, Japanese the characters with a reading, and the two
    // scripts differ only in which forms of the kanji they use.
    var best = {};
    var reads = {};
    var order = [];
    ['orig', 'ja', 'zh', 'ko', 'en'].forEach(function (k) {
      var v = r[k];
      if (!v) return;
      var id = nameKey(v);
      // a name that carries a reading in brackets is not a bare duplicate of a
      // longer one: 汕頭 (Suatō) is the pronunciation, which is the only reason
      // the Japanese is there at all
      if (/[（(]/.test(v)) reads[id] = true;
      if (!(id in best)) { best[id] = v; order.push(id); }
      else if (v.length > best[id].length) best[id] = v;
    });
    var keys = order.slice();
    var head = nameKey(nameOf(r));
    return order
      .filter(function (id) {
        // and nothing that is already contained in the headline, or in another
        // name on the same line: 内地 says nothing beside 日本内地
        if (head.indexOf(id) >= 0) return false;
        // A name is a bare duplicate only if the longer one says everything it
        // says. 中華民國 (Zhōnghuá Mínguó) is contained in 中華民国・重慶政権
        // (Chūka Minkoku), reading and all, so it goes; 汕頭 (Suatō) is
        // contained in 汕頭・潮州, which has no reading, so the reading would
        // be lost with it and it stays.
        return !keys.some(function (w) {
          return w !== id && w.indexOf(id) >= 0 && (!reads[id] || reads[w]);
        });
      })
      .map(function (id) { return best[id]; })
      .join('  ');
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

  /* The dots. Not filtered by the detail level: the Layers panel says that
     setting is for "how many places the quiz asks about and how many names the
     map will try to fit", and it was quietly deciding which places existed at
     all — Batavia, Kobe and Pusan were on the map and invisible, because they
     are level 2 and 3 and the map opens at level 1. Cities on means cities. */
  function siteVisible(s) {
    if (s.kind === 'gaz') return gazVisible(s);
    // the old browse dots are the same places the gazetteer draws better, so
    // they stand down while it is there rather than being hit-tested underneath
    if (s.kind === 'browse') return !JMAP.GAZ && browseVisible();
    return state.cats[s.cat] && siteInEpoch(s);
  }

  function gazVisible(s) {
    return state.cats.city && s.epoch === state.epoch && s.t >= gazMinTier();
  }

  /* Zooming in is a request for more detail, so it raises the level the map
     labels at — never what the quiz asks about, which stays where it was set.
     At the opening view you get the places every student should know; closing
     in on a corner of the map brings out the rest of them, and the collision
     test still decides which of those actually fit. */
  function labelLevel() {
    var bonus = view.w < mapW / 10 ? 2 : (view.w < mapW / 3 ? 1 : 0);
    return Math.min(3, state.level + bonus);
  }

  function labelVisible(rec) {
    // A country's name has nothing to do with the Administrative layer, which
    // is about its divisions. Gating it on that switch meant "Show names on
    // the map" showed no country names at all until a second, unrelated button
    // was pressed.
    // — except one that is only drawn when that layer is on, which cannot be
    // named while it is not there.
    if (rec.kind === 'territory') {
      // A province drawn as a territory of its own so that it can be named —
      // Manchuria, Jehol, Chahar and Suiyuan, Sinkiang — is not a country and
      // must not be labelled as one while the Administrative layer is off. On
      // that switch it is part of China and nothing else.
      if (rec.within && !state.cats.territory) return false;
      return rec.lvl <= labelLevel() && (!rec.adminOnly || state.cats.territory);
    }
    // The context cities are two hundred names, and at the opening view they
    // are a grey mat across the whole map. Their dots are there from the
    // moment Cities is switched on; their names wait until the reader has
    // closed in on somewhere, which is when a name is any use to them.
    if (rec.kind === 'browse') return browseVisible() && labelLevel() >= 2;
    return state.cats[rec.cat] && rec.lvl <= labelLevel() && siteInEpoch(rec);
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
    // Province boundaries lifted clear of an atom drawn over them. Above all of
    // #land and below the standing outlines and the labels, so a hairline that
    // was buried is visible without anything else changing places.
    subsLiftLayer = svgEl('g', { id: 'subs-lift' });
    svg.appendChild(subsLiftLayer);
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
    buildGazetteer();
    hatchGroup = svg.querySelector('#hatching');

    $$('.atom', svg).forEach(function (el) { atomEls[el.id.replace(/^a-/, '')] = el; });
    $$('#backings [data-for]', svg).forEach(function (el) {
      backingEls[el.getAttribute('data-for')] = el;
    });
    // The seams take their atom's colour and nothing else about it: they are
    // not in atomsOf, so they are never lit, never outlined and never named.
    $$('#seams [data-for]', svg).forEach(function (el) {
      (seamEls[el.getAttribute('data-for')] = seamEls[el.getAttribute('data-for')] || []).push(el);
    });
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
    applyPhoneLayout();
    if (firstVisit) showHint();

    // Only now, with the atoms built. Started from loadState() it raced the
    // map's own fetch: whenever the administrative file arrived first the
    // graft found no atoms to graft into, put nothing on the map, and marked
    // itself ready — so the layer was on, the button said so, and no province
    // would ever name itself until the page was reloaded and the race fell the
    // other way.
    if (state.cats.territory) loadAdmin();

    // The admin panel, if it was open when the page was last left. Without
    // this its settings would not survive a reload, and comparing a pan with
    // the backings against a pan without them is exactly a thing you want to
    // do across reloads. A reader has never set the key and never fetches it.
    try {
      if (window.localStorage.getItem('jmap-admin')) loadAdminPanel();
    } catch (err) { /* private mode; the panel is not important enough to care */ }

    window.addEventListener('resize', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
  }

  /* admin.js, once, on demand. It is a tool for working on the map and not
     part of it: it is never referenced from index.html, and nothing but an
     option-click on Layers or the key it leaves behind will fetch it. */
  var adminPending = false;
  function loadAdminPanel() {
    if (window.JMAP_ADMIN) { window.JMAP_ADMIN.toggle(); return; }
    if (adminPending) return;
    adminPending = true;
    var s = document.createElement('script');
    s.src = 'admin.js';
    s.onerror = function () { adminPending = false; };
    document.head.appendChild(s);
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
  /* The dotted rectangle round the South Seas Mandate is not drawn. It was a
     hand-drawn approximation of the mandate's limits and not accurate enough
     to stand beside the rest of the map; a traced one will replace it. The
     ring is still in data.js and the code below still builds it — set this to
     true and it comes back. */
  var NANYO_BOUNDS_SHOWN = false;

  function buildNanyoBounds() {
    if (!JMAP.NANYO_BOUNDS || !NANYO_BOUNDS_SHOWN) return;
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

  /* The gazetteer: four hundred and forty places from data/cities-*.csv, drawn
     as plain black dots at four sizes with two kinds of capital marked.
     Cartographic convention rather than invention — a filled dot for a town, a
     dot inside a ring for a provincial capital, a dot inside a square for the
     capital of a country or a territory — so the symbol says what kind of place
     it is and the size says how big, and the two can be read separately.

     It replaces the browse dots, which are the same hundred and seventy places
     in one undifferentiated grey. Those are left in the code and in data.js,
     drawn only when the gazetteer is switched off, so nothing has been thrown
     away. The quiz markers stay on top of it: where a gazetteer city is also a
     quiz site, the coloured marker sits over the black dot, which reads as
     "this one is asked about" and is true. */
  var gazGroup = null;
  var gazEls = [];
  var gazRecs = [];
  var GAZ_R = [2.5, 3.4, 4.4, 5.8];      // small, medium, large, largest

  /* What the browse layer knew and the gazetteer does not. The CSVs carry a
     name, a position, a size and a capital mark; the 170 context cities in
     data.js carry a Japanese reading for 131 of them, a Chinese form for 102,
     and nine notes — Trincomalee's fleet base, the Burma Road railhead at
     Lashio, the oil at Tarakan. Every one of those 170 ids is in the gazetteer
     under the same id, so the two are merged rather than one replacing the
     other: the dot is the gazetteer's and everything said about the place is
     both. Without this, standing the browse layer down lost all of it. */
  function gazEnrich(c) {
    var b = browseById[c.id];
    if (b) {
      ['ja', 'zh', 'ko', 'orig'].forEach(function (k) {
        if (!c[k] && b[k]) c[k] = b[k];
      });
      if (b.note) c.extra = b.note;
    }
    // and the quiz sites, 51 of which are the same place under the same id.
    // Their names only: what a site's note and date say is about the event it
    // is a marker for, and the marker itself is drawn over the dot to say it.
    var s = siteById[c.id];
    if (s) {
      ['ja', 'zh', 'ko', 'orig'].forEach(function (k) {
        if (!c[k] && s[k]) c[k] = s[k];
      });
    }
  }

  var browseById = {};
  var siteById = {};

  function buildGazetteer() {
    if (!JMAP.GAZ) return;
    (JMAP.BROWSE || []).forEach(function (b) { browseById[b.id] = b; });
    (JMAP.SITES || []).forEach(function (s) { if (s.cat === 'city') siteById[s.id] = s; });
    gazGroup = svgEl('g', { id: 'gaz' });
    svg.insertBefore(gazGroup, markersGroup);
    Object.keys(JMAP.GAZ).forEach(function (epoch) {
      JMAP.GAZ[epoch].forEach(function (c) {
        var p = project(c.lon, c.lat);
        var r = GAZ_R[c.t] || GAZ_R[0];
        var g = svgEl('g', {
          'class': 'gaz t' + c.t + (c.c ? ' cap' + c.c : ''),
          'data-epoch': epoch, 'data-id': c.id,
        });
        g.appendChild(svgEl('circle', { 'class': 'hit', r: Math.max(HIT_R * 0.6, r + 3) }));
        // the capital's ring or box goes first, so the dot sits inside it
        if (c.c === 1) {
          g.appendChild(svgEl('circle', { 'class': 'ring', r: r + 2.6 }));
        } else if (c.c === 2) {
          var s = r + 2.4;
          g.appendChild(svgEl('rect', {
            'class': 'box', x: -s, y: -s, width: s * 2, height: s * 2,
          }));
        }
        g.appendChild(svgEl('circle', { 'class': 'dot', r: r }));
        gazGroup.appendChild(g);
        gazEls.push({ el: g, epoch: epoch, tier: c.t, rec: c });
        scalables.push({ el: g, x: p.x, y: p.y });
        // named and hoverable on the same machinery as everything else. The id
        // is prefixed because 222 of these places are already in data.js under
        // the same name, and two records under one key is one record.
        c.kind = 'gaz';
        c.epoch = epoch;
        c.rid = 'g_' + epoch + '_' + c.id;
        c.en = c.n;
        // `when` is the line the tooltip shows under a name; `note` is the
        // longer one the detail card shows. What is worth saying about these
        // places is what kind of place they were.
        c.when = c.c === 2 ? 'Capital of ' + (c.of || 'the territory')
          : c.c === 1 ? 'Provincial capital' + (c.of ? ' — ' + c.of : '')
          : '';
        gazEnrich(c);
        // "Capital of British India · British India" says it twice; the polity
        // is dropped when the capital line has already named it.
        c.note = [c.when,
                  (c.p && (!c.when || c.when.indexOf(c.p) < 0)) ? c.p : '',
                  c.extra].filter(Boolean).join(' · ');
        gazRecs.push(c);
        elById[c.rid] = g;
        sitePos[c.rid] = p;
        g.setAttribute('data-id', c.rid);
      });
    });
  }

  /* Which gazetteer dots are drawn. The epoch decides which set, and the zoom
     decides how far down the tiers to go: four hundred dots at the opening view
     is a rash across the map, and the small places are the ones a reader only
     wants once they have closed in on somewhere. */
  function gazMinTier() {
    var w = view.w || mapW;
    if (w > mapW / 1.6) return 3;
    if (w > mapW / 3) return 2;
    if (w > mapW / 7) return 1;
    return 0;
  }

  function applyGazetteer() {
    if (!gazGroup) return;
    var on = state.cats.city && !!JMAP.GAZ;
    gazGroup.style.display = on ? '' : 'none';
    if (!on) return;
    var floor = gazMinTier();
    gazEls.forEach(function (g) {
      g.el.style.display = (g.epoch === state.epoch && g.tier >= floor) ? '' : 'none';
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
    var key = el.id.replace(/^a-/, '');
    var src = el.tagName === 'path' ? el
                                    : backingEls[key] || el.querySelector('path');
    if (!src) return;
    var line = svgEl('path', { d: src.getAttribute('d'), 'class': 'edge-line' });
    line.style.setProperty('--edge', t.edge);
    if (t.edgeWidth) line.style.setProperty('--edge-w', t.edgeWidth);
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
      var bk = backingEls[a];
      if (bk) {
        bk.removeAttribute('data-id');
        bk.style.removeProperty('--c');
        bk.style.display = 'none';
        bk.classList.remove('hot');
        bk.classList.remove('sel');
      }
      (seamEls[a] || []).forEach(function (sm) {
        sm.style.removeProperty('--c');
        sm.style.display = 'none';
      });
      (atomHits[a] || []).forEach(function (h) { h.removeAttribute('data-id'); });
    });
    hatchGroup.innerHTML = '';
    if (subOutlineLayer) { subOutlineLayer.innerHTML = ''; dropDefs('sub'); }
    clearHighlight();
    hot = null;
    hotProv = null;
    subsAtoms.forEach(function (a) { a.classList.remove('subs'); });
    subsAtoms = [];
    subsAtom = null;
    if (subsLiftLayer) subsLiftLayer.innerHTML = '';
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
    gazRecs.forEach(function (c) { byId[c.rid] = c; });

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
        (seamEls[a] || []).forEach(function (sm) {
          sm.style.display = '';
          if (colour) sm.style.setProperty('--c', colour.c);
        });
        var bk = backingEls[a];
        if (bk) {
          bk.style.display = '';
          bk.setAttribute('data-id', t.id);
          if (colour) bk.style.setProperty('--c', colour.c);
          els.push(bk);
        }
        // a territory that shares its neighbour's fill can still be told from
        // it by a hairline: Tuva inside Mongolia, Burma inside British India
        if (t.edge && (!t.edgeAtoms || t.edgeAtoms.indexOf(a) >= 0)) drawEdge(t, el);
        if (t.outline) {
          // an atom whose sub-units went to the other file has no paths of its
          // own, and outlining it drew nothing at all; its filler is the shape
          var own = el.tagName === 'path' ? 1 : $$('path', el).length;
          subUnits.push(own ? el : (backingEls[a] || el));
        }
        els.push(el);
        (atomHits[a] || []).forEach(function (h) { h.setAttribute('data-id', t.id); });

        var area = parseFloat(el.getAttribute('data-area')) || 1;
        mx += area * parseFloat(el.getAttribute('data-cx'));
        my += area * parseFloat(el.getAttribute('data-cy'));
        total += area;

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

      // `unseen` is a shape with nothing drawn in it: the box of open water
      // east of the Gilberts, which exists to answer the pointer and nothing
      // else. A label over it would be a name floating in empty sea.
      if (total > 0 && !t.unseen) {
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

    buildHatch();

    // the labels just created have no transform yet, and rescale() only runs
    // on a zoom change, so place them now or they sit at the map origin
    if (lastScaleW > 0) rescale();
    hideTooltip();
    buildLegend();
  }

  /* The stripes laid over a territory that two powers were on at once:
     Japanese over Portuguese Timor, American over Guadalcanal.

     Built here rather than inline in the epoch, because it has to be built
     again when the fine coastlines arrive. They are copies of the atom's own
     shapes, and the sweep that stands the coarse shapes down once a finer one
     has taken over walks every path in #land — which includes these. So the
     moment a reader zoomed far enough into Guadalcanal for its real coastline
     to load, the American stripes were marked superseded and hidden, and the
     one island on the map with two flags over it quietly lost one of them. */
  function buildHatch() {
    if (!hatchGroup) return;
    hatchGroup.innerHTML = '';
    territories().forEach(function (t) {
      if (!t.hatch) return;
      // 'occupied' is the Japanese stripe, 'us' the American one; true on its
      // own is the plain dark hatch
      var cls = 'hatch-fill' + (typeof t.hatch === 'string'
        ? ' hatch-' + (t.hatch === 'occupied' ? 'occ' : t.hatch) : '');
      t.atoms.forEach(function (a) {
        var el = atomEls[a];
        if (!el) return;
        var clip = el.getAttribute('clip-path');
        var paths = el.tagName === 'path' ? [el] : $$('path:not(.superseded)', el);
        // An atom whose divisions are still in the administrative file is an
        // empty group, and what the reader sees is its backing. Kengtung is
        // one, so its Thai stripes were drawn only when the Administrative
        // layer happened to be on — which is a question about districts and
        // has nothing to do with whose troops were in the country.
        if (!paths.length && backingEls[a]) paths = [backingEls[a]];
        paths.forEach(function (path) {
          var d = path.getAttribute('d');
          if (!d) return;
          var attrs = { 'class': cls, d: d };
          var own = path.getAttribute('clip-path') || clip;
          if (own) attrs['clip-path'] = own;
          hatchGroup.appendChild(svgEl('path', attrs));
        });
      });
    });
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

  /* How far in the map will go. It was 40x, which is as far as Natural Earth's
     coastline is worth following — but the fine coastlines go much further,
     and at 40x the Senkakus are eight pixels across and Uotsuri-shima cannot
     be pointed at. At 100x it is twenty-two. Away from the fine layer the base
     map does go visibly polygonal down here, which it did not before; that is
     the price of being able to look at the small islands at all. */
  var MAX_ZOOM = 100;

  function clampView(v) {
    var c = containerSize();
    var aspect = c.w / c.h;
    v.h = v.w / aspect;

    // fitView contains the whole map, which on a tall phone leaves the land a
    // third of the screen. Stop at the point where the map still covers the
    // short axis, so zooming out never goes past useful. On a container taller
    // than the drawing this leaves bands of page above and below — which is
    // what a framed map on a page looks like, and is better than not being
    // able to see the whole of it at once.
    var maxW = Math.min(fitView().w, mapW);
    var minW = mapW / MAX_ZOOM;
    if (v.w > maxW) { v.w = maxW; v.h = v.w / aspect; }
    if (v.w < minW) { v.w = minW; v.h = v.w / aspect; }

    // How far past the edge of the drawing the map may be pushed. On a phone
    // the detail sheet and the legend take a third of the screen and there is
    // nowhere to put the thing you are looking at, so the map has to move well
    // past its own edge; on a desktop a little give is enough that the pan
    // does not feel walled in. The frame drawn round the SVG is what stops the
    // overscroll reading as the sea simply running out.
    var slackX = v.w * (coarse ? 0.45 : 0.06);
    var slackY = v.h * (coarse ? 0.45 : 0.06);
    var restX = mapW - v.w, restY = mapH - v.h;
    v.x = Math.min(Math.max(v.x, Math.min(0, restX) - slackX), Math.max(0, restX) + slackX);
    v.y = Math.min(Math.max(v.y, Math.min(0, restY) - slackY), Math.max(0, restY) + slackY);
    return v;
  }

  function round(v) { return Math.round(v * 100) / 100; }

  function applyView(force) {
    clampView(view);
    svg.setAttribute('viewBox',
      round(view.x) + ' ' + round(view.y) + ' ' + round(view.w) + ' ' + round(view.h));
    var home = defaultView();
    // Once the islands are worth looking at rather than merely locating, drop
    // the rings. Measured against the opening view and not against the map's
    // full width: a phone opens cropped to the empire and a wide desktop opens
    // on the whole hemisphere, and "how far in has the reader come" is the
    // question, not "how much of the world fits".
    //
    // The rings are for the reader who has not gone looking yet — zoomed out,
    // or barely in. Half a turn of the wheel past the opening view and the
    // Gilberts and the Carolines are large enough to point at, while the rings
    // are still the size they always are and now read as marks on the sea.
    svg.classList.toggle('zoomed-in', view.w < home.w / 1.6);
    // it resets the view, so at the opening view there is nothing for it to do
    // and it looked like a dead button; say so instead
    var rst = $('#zoom-reset');
    if (rst) {
      var atHome = Math.abs(view.w - home.w) < 0.5;
      rst.classList.toggle('idle', atHome);
      rst.setAttribute('aria-disabled', atHome ? 'true' : 'false');
    }
    var zoomed = force || Math.abs(view.w - lastScaleW) > 0.01;
    if (zoomed) lastScaleW = view.w;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        if (zoomed) rescale();
        if (browseGroup) browseGroup.style.display =
          (!JMAP.GAZ && browseVisible()) ? '' : 'none';
        applyGazetteer();
        if (zoomed) gateLabels();
        placeLabels();
      });
    }
    // On settle, not per frame: this fires on every wheel tick and every step
    // of a pan, and a pinch would otherwise queue a dozen fetches.
    if (fineTimer) clearTimeout(fineTimer);
    fineTimer = setTimeout(function () {
      fineTimer = 0;
      syncFine();
    }, 220);
  }
  var fineTimer = 0;

  /* The shading patterns and the way each is turned. The base areas are ruled
     the other way from the occupation's own stripes so that where the two cross
     both can still be read. */
  var HATCH_IDS = [
    { id: 'hatch', rot: 45 },
    { id: 'hatch-occ', rot: 45 },
    { id: 'hatch-us', rot: 45 },
    { id: 'hatch-thai', rot: 45 },
    { id: 'hatch-brit', rot: 45 },
    { id: 'hatch-raid', rot: 45 },
    { id: 'hatch-ccp', rot: -45 },
  ];
  var hatchPatterns = null;
  var lastDouble = 0;
  var lastTap = null;
  var pendingTap = 0;

  /* The context cities come in with the Cities button, which is the button a
     reader would press to see cities. They had a switch of their own in the
     Layers panel, which asked the reader to know that this map has two kinds
     of city and to decide about each — a distinction that is about how the map
     was built and not about anything they came here to find out.

     The zoom guard that used to hold them back is gone with it, and it was the
     other half of the same problem: the map opens fitted to its full width, so
     the guard was never satisfied at the opening view and pressing the switch
     appeared to do nothing at all. It survives on a touch screen, where two
     hundred dots at arm's length cannot be picked out from one another. */
  function browseVisible() {
    return state.cats.city && (!coarse || view.w < mapW / 2.2);
  }

  function rescale() {
    var c = containerSize();
    var k = view.w / c.w;                       // SVG units per screen pixel
    for (var i = 0; i < scalables.length; i++) {
      var s = scalables[i];
      s.el.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ') scale(' + k + ')');
    }
    // Keep the shading stripes a constant width on screen rather than letting
    // them grow into stripes the width of a province as you zoom in. Only the
    // plain dark hatch was being rescaled; the four coloured ones were not, so
    // the American stripes over Guadalcanal, the Thai stripes over Kengtung,
    // the Japanese ones over Portuguese Timor and the ruling over the Communist
    // base areas all grew with the zoom until a single band was wider than the
    // island it was drawn on — and shrank below a pixel at the opening view.
    if (!hatchPatterns) {
      hatchPatterns = HATCH_IDS.map(function (h) {
        var el = svg.querySelector('#' + h.id);
        return el ? { el: el, rot: h.rot } : null;
      }).filter(Boolean);
    }
    for (var h = 0; h < hatchPatterns.length; h++) {
      hatchPatterns[h].el.setAttribute(
        'patternTransform', 'rotate(' + hatchPatterns[h].rot + ') scale(' + k + ')');
    }
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
  /* Which names are candidates at all, before the collision test decides which
     of them fit. Re-run on zoom as well as on a state change, because the
     level it asks at moves with the zoom. */
  function gateLabels() {
    var showLabels = state.labels && state.mode !== 'quiz';
    labels.forEach(function (L) {
      if (!(showLabels && labelVisible(L.rec))) {
        L.el.textContent = '';
        L.el.style.display = 'none';
        L.w = 0;
        return;
      }
      var text = nameOf(L.rec);
      if (L.el.textContent !== text) {
        L.el.textContent = text;
        L.w = estimateWidth(text, L.size);
      }
    });
  }

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
    var newW = Math.min(Math.max(view.w / factor, mapW / MAX_ZOOM), fitView().w);
    if (Math.abs(newW - oldW) < 1e-6) return;
    var ratio = newW / oldW;
    view.x = p.x - (p.x - view.x) * ratio;
    view.y = p.y - (p.y - view.y) * ratio;
    view.w = newW;
    applyView();
  }

  function onResize() {
    applyPhoneLayout();
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
    view.w = Math.min(Math.max(w, mapW / MAX_ZOOM), fitView().w);
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
        setHot(null); setHotProv(null); setSubsAtom(null); hideTooltip();
      });
    }
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button > 0) return;
    // The zoom buttons sit inside the map's own box, so a press on one of them
    // reaches this handler first — and capturing the pointer to the container
    // means the click that follows is delivered to the container and never to
    // the button. All three of them were dead to the mouse because of it; the
    // reset button was the one anybody noticed, because the wheel does the
    // other two. Anything that is a control answers for itself.
    if (e.target && e.target.closest && e.target.closest('button, a, input, label')) {
      return;
    }
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
      var newW = Math.min(Math.max(pinchStart.w * (pinchStart.dist / now.dist), mapW / MAX_ZOOM), maxW);
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
      // An admin tool may want the tap instead — drawing a polygon is one.
      // Offered here and not to `click`, so that a tool gets taps without
      // having to tell a tap from a drag itself, and so that panning and
      // pinching are untouched while one is armed. Absent unless admin.js has
      // been loaded, which a reader never does.
      if (window.JMAP_TAP && window.JMAP_TAP(e) === false) return;
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
      if (!rec || (rec.kind !== 'site' && rec.kind !== 'browse'
                   && rec.kind !== 'gaz')) continue;
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
      var sub = nearestSubUnit(atomEl, cx, cy, true);
      // measured on the sub-unit where there is one, because an atom can be a
      // scatter: French India runs from Mahe to Chandernagore and its box is
      // two thousand kilometres wide, while the settlement under the pointer
      // is a speck
      var shape = sub || atomEl;
      var box = shape && shape.getBoundingClientRect ? shape.getBoundingClientRect() : null;
      // 6 px: below that the browser cannot be relied on to hit the shape at
      // all, which is the only reason to prefer the circle over the country
      // the pointer is really on. Anything bigger is hittable, and if it is
      // not in the stack then the pointer is not on it
      if (own && box && box.width < 6 && box.height < 6) {
        return { hit: own, el: shape || target };
      }
      if (first) return first;
      if (own) return { hit: own, el: shape || target };
    }
    var rec = recordFor(target);
    if (rec) return { hit: rec, el: target };
    // nothing under the pointer: a fine island just off it will do, so a reef
    // three pixels across can still be pointed at
    var near = typeof cx === 'number' ? nearestFine(cx, cy) : null;
    var nrec = near && recordFor(near);
    return nrec ? { hit: nrec, el: near } : null;
  }

  /* The sub-unit of an atom nearest a point on the screen, for when the shape
     itself is too small for the browser to hit-test. */
  function nearestSubUnit(atomEl, cx, cy, strict) {
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
    // strict: only a sub-unit the pointer is actually on. Used when deciding
    // whether a target circle beats the country under the pointer, where
    // "the nearest one within 8 px" would hand Penang to Kedah
    return strict ? inside : (inside || near);
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
    // the Straits Settlements are a Crown colony of four scattered pieces
    // inside a peninsula of protectorates, and telling them apart is the point
    // of that corner of the map whether or not divisions are switched on
    var own = got.el && got.el.getAttribute
      && got.el.getAttribute('data-cluster') === 'Straits Settlements';
    // A fine coastline is a place, not an administrative division. The Ryukyu
    // and Pacific atoms carry `data-islands` and so have always named their
    // islands with the layer off; Ulleungdo and Singapore's islands are in
    // atoms that do not, and there is no sense in which naming an island
    // should wait on a switch about provinces.
    var fine = got.el && got.el.classList
      && got.el.classList.contains('fine');
    if (!state.cats.territory && !own && !fine &&
        !(atom && atom.getAttribute('data-islands'))) {
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
    var el = target.closest('.site, .browse, .gaz, .atom');
    // a backing is no longer inside its atom, so it answers for itself — which
    // it only ever gets the chance to do while its sub-units are in the other
    // file and it is the only thing there
    if (!el && target.getAttribute && target.getAttribute('data-for')) el = target;
    if (!el) return null;
    var id = el.getAttribute('data-id');
    var rec = id && byId[id];
    if (!rec) return null;
    if ((rec.kind === 'site' || rec.kind === 'browse' || rec.kind === 'gaz')
        && !siteVisible(rec)) return null;
    // Unless the Administrative layer is on, the whole of China is one unit.
    // Manchuria, Jehol, Chahar and Suiyuan and Sinkiang are drawn as
    // territories of their own only so that each can be named when divisions
    // are being shown; with that switch off they are provinces of the Republic
    // and answer as it — one name, one outline, no line between them.
    if (rec.within && !state.cats.territory && byId[rec.within]) {
      rec = byId[rec.within];
    }
    return { rec: rec, el: el };
  }

  function handleTap(target, cx, cy) {
    var got = pick(target, cx, cy);
    var hit = got && got.hit;
    // on a touch screen the tap is the pointer, so it is what decides whose
    // divisions are drawn
    setSubsAtom(hit && hit.rec.kind === 'territory' && got.el && got.el.closest
                ? got.el.closest('.atom') : null);
    var prov = hit && hit.rec.kind === 'territory' ? provinceAt(got, cx, cy) : null;
    lastProv = prov;
    if (state.mode === 'quiz') {
      if (hit) { quizAnswer(hit); return; }
      if (quiz && quiz.current) {
        var fb = $('#q-feedback');
        fb.className = 'feedback bad';
        fb.textContent = 'Nothing there — try again.';
      }
      return;
    }
    var id = hit ? (hit.rec.rid || hit.rec.id) : null;
    // On a touch screen there is no hover, so the two questions a tap might be
    // asking — what country is this, and what province of it am I on — have to
    // be separated in time instead of by the pointer. The first tap answers
    // the first and the second tap answers the second, which also means a
    // student who only wants the country is never told more than they asked.
    if (coarse) {
      if (id && id === selected && prov) {
        setHotProv(prov.el);
      } else {
        lastProv = null;
        setHotProv(null);
      }
    }
    select(id);
  }

  var hot = null;

  /* Light up every atom of the territory under the pointer, not just the one
   * polygon it happens to be over. */
  /* Sub-units that belong together and light up together. Hovering Singapore
     lit the whole Malay peninsula, which says the wrong thing: the Straits
     Settlements were a Crown colony of four scattered pieces, and the states
     around them were protectorates that were never British soil. */
  var hotCluster = null;

  /* A cluster is written into the SVG and the SVG serves both dates, so a
     sub-unit that left its cluster between them needs saying here. The
     Dindings are the case: a Straits Settlement from 1826 and retroceded to
     Perak on 16 February 1935, so on the 1942 map they are Perak and lighting
     them with Singapore is simply wrong. */
  function clusterName(el) {
    if (!el || !el.getAttribute) return null;
    var name = el.getAttribute('data-cluster');
    if (!name) return null;
    var atom = el.closest && el.closest('.atom');
    var key = (atom ? atom.id.replace(/^a-/, '') : '') + '/' +
              (el.getAttribute('data-prov') || '');
    var over = (JMAP.CLUSTER_EPOCH || {})[state.epoch];
    if (over && Object.prototype.hasOwnProperty.call(over, key)) return over[key];
    return name;
  }

  /* Every sub-unit of the same cluster, wherever it is drawn. This used to
     gather siblings inside one atom only, which meant a cluster could not
     cross one — and two of them do. The Straits Settlements are five scattered
     pieces in three atoms: Singapore, Penang, Malacca and the Dindings in
     Malaya, Labuan in North Borneo, Christmas Island on its own. And Laos and
     Cambodia are each drawn in two, the part that stayed French and the part
     ceded to Thailand in 1941, so hovering Laos on the 1930 map lit the French
     half and left the rest of the country dark. */
  function clusterOf(el) {
    var name = clusterName(el);
    if (!name) return null;
    var out = [];
    $$('#land [data-cluster]', svg).forEach(function (n) {
      if (clusterName(n) === name) out.push(n);
    });
    return out.length ? out : null;
  }

  /* What lights up when a territory is hovered: itself, and anything it says
     it lights with. In 1930 that is China and the four territories drawn
     separately so they can be named — Manchuria, Jehol, Chahar and Suiyuan,
     and Sinkiang — which were all the Republic on that date. */
  function litFor(id) {
    if (hotCluster) return hotCluster;
    var els = (atomsOf[id] || []).slice();
    var rec = id && byId[id];
    if (rec && rec.lights) {
      rec.lights.forEach(function (other) {
        (atomsOf[other] || []).forEach(function (el) {
          if (els.indexOf(el) < 0) els.push(el);
        });
      });
    }
    // and anything that says it is part of this one, so the relation only has
    // to be written once and on the part rather than on the whole
    if (id) {
      territories().forEach(function (t) {
        if (t.within !== id) return;
        (atomsOf[t.id] || []).forEach(function (el) {
          if (els.indexOf(el) < 0) els.push(el);
        });
      });
    }
    return els;
  }

  /* The seam strips of every atom that is lit. They take their atom's colour
     and they are deliberately not in `atomsOf`, so that they are never
     outlined, never named and never part of anyone's shape — but that also
     left them out of the *lighting*, and a strip four pixels wide along a
     frontier then stayed dark while the country it belongs to brightened. On
     the ceded provinces of Cambodia, where the strips are widest, that read as
     a thick band of another colour inside the outline. They light with their
     atom now and are outlined with nothing. */
  function seamsFor(id) {
    var els = [];
    if (!id) return els;
    // By colour, not by atom. The strip that shows is not always the hovered
    // country's own: Thailand and the provinces ceded to it in 1941 are two
    // territories on the 1942 map and share one colour, so hovering the ceded
    // provinces brightened them and left Thailand's strips along the same
    // frontier dark — a band of the same teal, unlit, inside the outline.
    // Anything painted the colour that is lighting up lights with it.
    var want = {};
    litFor(id).forEach(function (el) {
      var c = el.style && el.style.getPropertyValue('--c');
      if (c) want[c.trim()] = true;
    });
    Object.keys(seamEls).forEach(function (key) {
      var src = backingEls[key] || atomEls[key];
      var c = src && src.style && src.style.getPropertyValue('--c');
      if (!c || !want[c.trim()]) return;
      seamEls[key].forEach(function (sm) {
        if (els.indexOf(sm) < 0) els.push(sm);
      });
    });
    // And the standing edge lines painted in that colour. Thailand's is a
    // cover stroke six units wide, laid along its own frontier to hide a crack
    // between two datasets — invisible while nothing is hovered, because it is
    // the colour of the ground on both sides of it, and a thick band of the
    // unlit colour the moment one side brightens. It was the "thick inner
    // colour" inside the outline of the ceded provinces.
    if (subOutlineLayer) {
      $$('.edge-line', subOutlineLayer).forEach(function (ln) {
        var c = ln.style && ln.style.getPropertyValue('--edge');
        if (c && want[c.trim()] && els.indexOf(ln) < 0) els.push(ln);
      });
    }
    return els;
  }

  function setHot(id, cluster) {
    cluster = cluster || null;
    if (hot === id && hotCluster === cluster) return;
    litFor(hot).forEach(function (el) { el.classList.remove('hot'); });
    seamsFor(hot).forEach(function (el) { el.classList.remove('hot'); });
    hot = id;
    hotCluster = cluster;
    litFor(hot).forEach(function (el) { el.classList.add('hot'); });
    seamsFor(hot).forEach(function (el) { el.classList.add('hot'); });
    redrawHighlight();
  }

  var hotProv = null;
  var lastProv = null;

  /* Which country draws its internal boundaries. With the Administrative layer
     on, every division of every country used to be drawn at once — about
     fifteen hundred lines, a grey mesh over the whole map, and no help to a
     reader who is looking at one place. Only the country under the pointer
     draws them now; the exceptions that stay drawn wherever the pointer is are
     named in the stylesheet, and are the enclaves and scattered colonies whose
     whole point is that they are not part of what surrounds them. */
  var subsAtom = null;
  var subsAtoms = [];

  /* Atoms whose own divisions are drawn over by a later atom, and the sub-unit
     hairlines therefore buried. British India is the case: its provinces come
     from modern first-level units, so they cover the whole subcontinent, and
     the princely states are painted on top of them — every province boundary
     that threads between the Deccan states, the Punjab hill states or the
     Eastern States disappears under the layer that is not part of the Raj at
     all. The hovered province itself was never affected: its outline goes into
     the highlight layer, which is above everything. It is the neighbours the
     reader is being shown, and they were the half that vanished. */
  var SUBS_LIFT = { india: true };

  /* Stroke-only copies of the subs atom's province paths, in a layer above all
     of #land. Nothing is moved and nothing is recoloured: the fills stay where
     they are, so the princely states still read as a layer over the Raj, and
     only the lines come up. Rebuilt on an atom change, which is rare — not on
     pointer movement within one country. */
  function liftSubs(el) {
    if (!svg || !subsLiftLayer) return;
    subsLiftLayer.innerHTML = '';
    $$('.atom.lifted', svg).forEach(function (a) { a.classList.remove('lifted'); });
    if (!el || !SUBS_LIFT[el.id.replace(/^a-/, '')]) return;
    if (!svg.classList.contains('admin-on')) return;
    var n = 0;
    $$(':scope > path[data-prov]', el).forEach(function (p) {
      if (p.classList.contains('fine')) return;
      var d = p.getAttribute('d');
      if (!d) return;
      subsLiftLayer.appendChild(svgEl('path', { d: d, 'class': 'lift-line' }));
      n++;
    });
    // The line is moved, not copied: `lifted` takes the stroke off the paths in
    // place, so each boundary is drawn exactly once and the only difference is
    // which layer it is drawn in. A second identical stroke underneath would
    // darken every boundary that was never buried in the first place.
    if (n) el.classList.add('lifted');
  }

  /* A country's divisions are drawn for the country under the pointer, and a
     country can be more than one atom. Thailand in December 1942 is two — its
     own ground and the provinces ceded to it in 1941 — and setting the class on
     the atom under the pointer alone drew the changwat and left the ceded
     provinces blank, which says they have no divisions rather than that they
     are the same country's. */
  function setSubsAtom(el) {
    if (subsAtom === el) return;
    subsAtoms.forEach(function (a) { a.classList.remove('subs'); });
    subsAtom = el;
    subsAtoms = [];
    if (el) {
      var id = el.getAttribute('data-id');
      subsAtoms = (id && atomsOf[id] ? atomsOf[id] : [el])
        .filter(function (a) { return a.classList && a.classList.contains('atom'); });
      if (subsAtoms.indexOf(el) < 0) subsAtoms.push(el);
      subsAtoms.forEach(function (a) { a.classList.add('subs'); });
    }
    liftSubs(subsAtom);
  }

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
    // The fine coastlines carry their names on the shape itself. There are a
    // couple of hundred of them, they arrive with the geometry and only when
    // it is asked for, and putting them in data.js would mean shipping them to
    // every reader who never zooms in.
    if (target.getAttribute('data-ja') || target.getAttribute('data-group')) {
      // OSM names most of these but not all: a third of the Pacific islets are
      // reefs nobody has named. Those take their group as the headline rather
      // than showing an empty line, so the reader is still told where they
      // are, and the group is not then repeated underneath.
      var grp = target.getAttribute('data-group') || '';
      var head = key || target.getAttribute('data-ja') || grp;
      var own = { en: head,
                  ja: target.getAttribute('data-ja') || '',
                  zh: target.getAttribute('data-zh') || '',
                  group: head === grp ? '' : grp,
                  groupJa: head === grp ? '' : (target.getAttribute('data-group-ja') || ''),
                  parent: target.getAttribute('data-parent') || '',
                  region: target.getAttribute('data-region') || '' };
      if (head === grp) own.ja = target.getAttribute('data-group-ja') || '';
      // An island the map has something of its own to say about. The shape
      // carries the name OSM gives it; data.js carries the Korean form, the
      // period name, and the note — that the Liancourt Rocks are disputed
      // today, that Jurong Island was made by joining seven smaller ones in
      // 1995 and is not a shape of this period at all. Keyed on the name the
      // shape carries, so nothing has to be said twice.
      var said = key && (JMAP.PROVINCES || {})[key];
      if (said) {
        Object.keys(said).forEach(function (k) { own[k] = said[k]; });
      }
      return { key: key || own.ja || grp, rec: own, el: target };
    }
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
    if (state.mode === 'quiz' || dragStart) {
      setHot(null); setHotProv(null); setSubsAtom(null); return;
    }
    var got = pick(e.target, e.clientX, e.clientY);
    var hit = got && got.hit;
    if (!hit) {
      setHot(null); setHotProv(null); setSubsAtom(null); hideTooltip(); return;
    }
    setSubsAtom(hit.rec.kind === 'territory' && got.el && got.el.closest
                ? got.el.closest('.atom') : null);
    var prov = hit.rec.kind === 'territory' ? provinceAt(got, e.clientX, e.clientY) : null;
    setHot(hit.rec.kind === 'territory' ? hit.rec.id : null,
           prov && clusterOf(prov.el));
    lastProv = prov;
    setHotProv(prov ? prov.el : null);
    showTooltip(hit.rec, e.clientX, e.clientY, prov);
  }

  /* ------------------------------------------------------------ labels -- */

  /* The nearest thing first. Under the pointer is a province, an island or a
     settlement, and that is what the reader is asking about; the country it
     belongs to is context and goes underneath. When there is no sub-unit the
     country is itself the nearest thing and takes the top line. */
  function showTooltip(base, cx, cy, prov) {
    var rec = shown(base);
    var head = prov && prov.rec ? shown(prov.rec) : rec;
    tooltip.innerHTML = '';
    tooltip.appendChild(document.createTextNode(nameOf(head)));
    if (head !== rec) {
      var alt = otherNames(head);
      if (alt) {
        var pa = document.createElement('span');
        pa.className = 'sub alt-script';
        pa.textContent = alt;
        tooltip.appendChild(pa);
      }
      // the island group sits between the island and the country: Ishigaki,
      // then the Yaeyamas, then the colony they were part of
      if (head.group || head.region) {
        // the group, and the part of the Pacific it is in: Ishigaki, then the
        // Yaeyamas, then who held them
        var gp = document.createElement('span');
        gp.className = 'sub group';
        var line = [head.group, head.groupJa].filter(Boolean).join('  ');
        if (head.parent) line = (line ? line + ' · ' : '') + head.parent;
        if (head.region) line = (line ? line + '  ' : '') + '(' + head.region + ')';
        gp.textContent = line;
        tooltip.appendChild(gp);
      }
      var pv = document.createElement('span');
      pv.className = 'sub prov';
      pv.textContent = [nameOf(rec)].concat(otherNames(rec) || []).join('  ');
      tooltip.appendChild(pv);
      // What the country line does not say plainly. In the Pacific the name
      // carries the sovereignty inside it — "South Seas Mandate", "Papua & the
      // Territory of New Guinea" — and a reader looking at one atoll in the
      // Carolines has to parse it out of a phrase. `rule` says it in three
      // words: Japanese mandate, British colony, Australian territory.
      if (rec.rule) {
        var rl = document.createElement('span');
        rl.className = 'sub rule';
        rl.textContent = rec.rule;
        tooltip.appendChild(rl);
      }
    } else {
      var second = state.lang === 'en' ? rec.ja : rec.en;
      if (second && second !== nameOf(rec)) {
        var sub = document.createElement('span');
        sub.className = 'sub';
        sub.textContent = second;
        tooltip.appendChild(sub);
      }
    }
    var when = rec.date || rec.when;
    if (when) {
      var w = document.createElement('span');
      w.className = 'sub when';
      w.textContent = when;
      tooltip.appendChild(w);
    }
    // A sub-unit may carry a note of its own — the Senkakus are disputed
    // today, Labuan joined the Straits Settlements on a date. It belongs under
    // the name it is about, not in it.
    if (head !== rec && head.note) {
      var pn = document.createElement('span');
      pn.className = 'sub prov-note';
      pn.textContent = head.note;
      tooltip.appendChild(pn);
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
    // A shape a finer one has taken over is not part of the silhouette. It has
    // to be dropped here as well as in the drawing, and dropped at this level
    // rather than only among an atom's children: a country's filler is a path
    // in its own right, so the filter applied to children never reached it,
    // and selecting Okinawa traced Natural Earth's coastline in mid-air beside
    // the real one.
    els = els.filter(function (e) {
      return !(e.classList && e.classList.contains('superseded'));
    });
    // A backing is not the shape either. It is Natural Earth's outline of the
    // same country, drawn underneath an atom's sub-units so that a crack
    // between two of them shows the country and not the sea — a different
    // source from the sub-units, whose coast lies a few pixels off theirs. In
    // `atomsOf` so that it lights with its territory, it was also being
    // stroked, and the two coastlines read as one line drawn twice: British
    // Borneo hovered came up with a second outline just outside Brunei's own,
    // parallel to it and the width of the disagreement between the two sources
    // away. It fills; it does not describe.
    //
    // The exception is an atom whose divisions are still in the administrative
    // file. That is an empty group, and its backing is the only shape it has —
    // the same case the hatching has to make an exception for.
    els = els.filter(function (e) {
      if (!e.parentNode || e.parentNode.id !== 'backings') return true;
      var atom = atomEls[e.getAttribute('data-for')];
      if (!atom) return true;
      return !(atom.tagName === 'path' ? 1 : $$('path:not(.superseded)', atom).length);
    });
    if (!layer || !els.length || !hiDefs) return;
    var owned = ownedDefs[layer === subOutlineLayer ? 'sub' : 'hi'];
    var id = 'mask-' + (++maskSeq);
    // The mask covers the shapes it is masking and a margin, and nothing more.
    // It used to be the whole map: a mask is rendered into an offscreen buffer
    // at the resolution of its own region, and the browser caps how big that
    // buffer may be, so at deep zoom a mask three thousand units wide came back
    // coarse — the bays along Manchuria's Soviet frontier were smaller than one
    // buffer pixel and the outline cut straight across them, a visibly simpler
    // line than the fill it was supposed to be tracing. Sized to the shape, the
    // buffer is spent where the shape is.
    var pad = 60;
    var mx0 = -pad, my0 = -pad;
    var mx1 = mapW + pad, my1 = mapH + pad;
    var bb = null;
    els.forEach(function (e) {
      try {
        var r = e.getBBox();
        if (!r.width && !r.height) return;
        if (!bb) bb = { x0: r.x, y0: r.y, x1: r.x + r.width, y1: r.y + r.height };
        else {
          bb.x0 = Math.min(bb.x0, r.x); bb.y0 = Math.min(bb.y0, r.y);
          bb.x1 = Math.max(bb.x1, r.x + r.width); bb.y1 = Math.max(bb.y1, r.y + r.height);
        }
      } catch (err) { /* not laid out yet */ }
    });
    if (bb) {
      mx0 = Math.max(mx0, bb.x0 - pad); my0 = Math.max(my0, bb.y0 - pad);
      mx1 = Math.min(mx1, bb.x1 + pad); my1 = Math.min(my1, bb.y1 + pad);
    }
    var mw = mx1 - mx0, mh = my1 - my0;
    var mask = svgEl('mask', { id: id, maskUnits: 'userSpaceOnUse',
                               x: mx0, y: my0, width: mw, height: mh });
    mask.appendChild(svgEl('rect', { x: mx0, y: my0, width: mw, height: mh,
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

    // the clip that governs this shape, whether it is on the shape or on a
    // group above it
    function clipOf(node) {
      for (var n = node; n && n !== svg; n = n.parentNode) {
        var c = n.getAttribute && n.getAttribute('clip-path');
        if (c) return c;
      }
      return null;
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
      // The clip is looked for up the tree and not on this element alone: it
      // sits on the atom's group, and a sub-unit outline is handed the child
      // path, which carries none. Read off the child it came out unclipped —
      // and the occupied zone's blocks run a long way out to sea on purpose, so
      // that the clip to China's land finds the coast instead of a hand-drawn
      // line threading the offshore islands. Hovering a block therefore drew
      // that ocean edge as a curve across the East China Sea.
      var clip = clipOf(el);
      // .superseded is a coarse shape a finer one has taken over: hidden in the
      // drawing, and it must be hidden here too, or selecting Okinawa traces
      // both coastlines at once
      var paths = el.tagName === 'path' ? [el] : $$('path:not(.superseded)', el);
      // .islet is a ring drawn round an island too small to see, not a shape.
      // Filled black in the mask it wiped out the coastline underneath it, and
      // stroked in the outline it drew a circle in open water.
      var circles = el.tagName === 'path' ? []
        : $$('circle:not(.islet-hit):not(.islet):not(.superseded)', el);

      /* Every path of one element outlined as a single path. The occupied zone
         is 722 traced rings in as many children, and one stroked copy per
         child — each carrying a mask reference and a clip reference — is 755
         masked, clipped layers for one hover. At the opening view, where the
         whole zone is on screen and all of them have to rasterise, that does
         not merely stall: it hangs the renderer outright, which is what
         hovering occupied China on the 1942 map did.

         A stroke over the concatenation of the subpaths is the same stroke as
         the union of the strokes, and the mask solid concatenates the same way,
         so this is the same picture drawn in two elements instead of 1,444. */
      if (paths.length > 1) {
        var merged = [];
        paths.forEach(function (p) {
          var d = p.getAttribute('d');
          if (d) merged.push(d);
        });
        if (merged.length) {
          var one = svgEl('path', { d: merged.join('') });
          paths = [one];
        }
      }

      paths.concat(circles).forEach(function (shape) {
        // Stroked as well as filled, and at the width the atoms themselves are
        // stroked. Two atoms of one territory abut without quite meeting — the
        // 1.3 stroke on the atom is what closes that crack in the fill — and a
        // mask built from the fills alone leaves the crack open, so hovering a
        // country whose atoms are several drew a hairline down every join
        // inside it. China is the case a reader sees: with the Administrative
        // layer off it is one unit, and it was coming up with Manchuria, Jehol
        // and Chahar ruled off inside it.
        var solid = copyOf(shape, {
          fill: '#000', stroke: '#000', 'stroke-width': 1.3,
          'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke',
        });
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

  // nothing is drawn in an `unseen` shape, and tracing one would draw the
  // rectangle it happens to be: a box ruled across empty ocean
  function seen(id) { return id && byId[id] && !byId[id].unseen; }

  function redrawHighlight() {
    clearHighlight();
    // One line per shape. The hover outline and the selection outline are
    // different widths — 3.3 against 3.7 — so a country that is both selected
    // and under the pointer was drawn round twice, and the two strokes read as
    // one line that changes thickness along its length wherever they did not
    // land on exactly the same pixels. The selection is the stronger statement
    // and the one that survives the pointer moving away, so it wins.
    var bothSame = selected && hot === selected && !hotCluster;
    if (hotCluster) outlineOf(hotCluster, 'hi-territory');
    else if (!bothSame && hot && atomsOf[hot] && seen(hot)) {
      outlineOf(litFor(hot), 'hi-territory');
    }
    if (hotProv) outlineOf([hotProv], 'hi-province');
    if (selected && atomsOf[selected] && seen(selected)) {
      outlineOf(atomsOf[selected], 'hi-selected');
    }
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

    // The nearest thing first, as in the tooltip: the province, island or
    // settlement under the pointer is what was asked about, and the country it
    // belongs to is the line under it.
    var sub = lastProv && lastProv.rec ? shown(lastProv.rec) : null;
    var head = sub || rec;
    var primary = nameOf(head);
    var others = LANGS
      .filter(function (l) { return l !== state.lang; })
      .map(function (l) { return head[l]; })
      .filter(function (n) { return n && n !== primary; });

    var info = catInfo(rec.cat);
    var chip = $('.chip', infoBox);
    chip.textContent = info ? nameOf(info) : rec.cat;
    chip.style.setProperty('--chip', info ? info.c : 'var(--muted)');
    $('.primary', infoBox).textContent = primary;
    $('.alt', infoBox).textContent = others.join('  ·  ');
    // and the country underneath, with every name it answers to
    var owner = sub ? [nameOf(rec)].concat(otherNames(rec) || []).join('  ') : '';
    // and, where the name alone does not say it, what kind of rule that was
    if (owner && rec.rule) owner += '  ·  ' + rec.rule;
    $('.prov', infoBox).textContent = owner;
    $('.prov', infoBox).hidden = !owner;
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
    // The switch drew nothing. Sub-units take their atom's fill *and* stroke,
    // so the seams between them were invisible and turning the layer on
    // changed nothing you could see — its only effect was that hovering named
    // a province, which is feedback you have to go looking for. It reads as a
    // switch that works sometimes. Now it draws the divisions.
    if (svg) svg.classList.toggle('admin-on', !!state.cats.territory);
    // the lifted hairlines exist only while that layer is on, and the geometry
    // they copy arrives with it, so they are rebuilt whenever it changes
    liftSubs(subsAtom);

    JMAP.SITES.forEach(function (s) {
      var el = elById[s.id];
      if (el) el.style.display = siteVisible(s) ? '' : 'none';
    });
    if (browseGroup) browseGroup.style.display =
      (!JMAP.GAZ && browseVisible()) ? '' : 'none';
    applyGazetteer();

    gateLabels();

    // A territory marked adminOnly is administrative detail drawn inside
    // another one — the princely states inside British India — so it comes and
    // goes with the Administrative switch rather than standing on its own.
    territories().forEach(function (t) {
      if (!t.adminOnly) return;
      (atomsOf[t.id] || []).forEach(function (el) {
        el.style.display = state.cats.territory ? '' : 'none';
      });
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
    // a territory with nothing drawn in it puts no colour on the map and so
    // earns no swatch in the legend
    territories().forEach(function (t) { if (!t.unseen) used[t.cat] = true; });

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

    if (JMAP.GAZ && state.cats.city) {
      // The gazetteer says two things at once and the legend has to unpick
      // them: the size of a dot is how big the place was, the mark around it
      // is what kind of place it was.
      [['gaz-sm', 'Town'], ['gaz-lg', 'Larger city'],
       ['gaz-cap1', 'Provincial capital'],
       ['gaz-cap2', 'Capital of a country or territory']].forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'item';
        var sw = document.createElement('span');
        sw.className = 'sw ' + r[0];
        row.appendChild(sw);
        row.appendChild(document.createTextNode(r[1]));
        legend.appendChild(row);
      });
    } else if (browseVisible()) {
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
    // there is no quiz on a phone, so do not offer it one
    if (isPhone()) hint.textContent = 'Tap any place to see what it was';
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

  /* The administrative divisions live in a second file. Fetch it once, graft
     each atom's sub-units into the atom they belong to, and let the backing
     stop taking the pointer now that there is something above it to name. */
  var adminState = 'none';          // none | loading | ready | failed

  /* The switch turns provinces on and off every time; what it cannot do is
     make three quarters of a megabyte arrive instantly. Pressed cold on a slow
     line it looked broken, because nothing happened for as long as the fetch
     took and nothing said why. The button says so now. */
  function setAdminBusy() {
    var b = $('#layer-seg button[data-cat="territory"]');
    if (!b) return;
    b.classList.toggle('busy', adminState === 'loading');
    b.classList.toggle('failed', adminState === 'failed');
    b.setAttribute('aria-busy', adminState === 'loading' ? 'true' : 'false');
    b.title = adminState === 'loading' ? 'Loading the administrative divisions…'
      : adminState === 'failed' ? 'The administrative divisions did not load — press again to retry'
      : '';
  }

  /* ------------------------------------------- the fine coastlines ------ */

  /* A third file, of island outlines several times finer than the base map's
     and — the point of it — of island names, which the map has never had below
     a few dozen well-known ones. It is fetched only on a deep zoom into one of
     the places it covers, so a reader who never leaves China never pays for it.

     Below this viewBox width, Natural Earth's coastline starts to read as a
     polygon rather than a coast. The map's own floor is mapW/40, so this is
     the deepest fifth of the zoom range. */
  var FINE_W = 150;

  /* The file covers fourteen windows and they used to arrive together: one
     deep zoom anywhere grafted the Ryukyus, the Bonins, the mandate, the
     Gilberts, New Guinea, the Solomons and Wake at once and kept them all
     drawn for the rest of the visit. A reader looking at Okinawa was carrying
     the Pacific with them. Each window is grafted on its own now, when the
     view reaches it, and taken out again when the view leaves — its coarse
     shapes going back exactly as they were. */
  var fineState = 'none';           // none | loading | ready | failed
  var fineBoxes = null;             // atom -> [x0, y0, x1, y1], from the map
  var fineDoc = null;               // the parsed file, kept for regrafting
  var fineLive = {};                // region key -> the nodes it has grafted
  var fineHits = [];                // every live island's box, for the reach
  /* What each coarse shape looked like before any window pruned it, so that
     taking a window out restores the map rather than an approximation of it.
     Recorded once, the first time a shape is touched. */
  var coarseOrig = [];

  /* How far past an island the pointer still counts as being on it, in screen
     pixels. Most of these are specks — a third of the Pacific ones are under a
     tenth of a square kilometre — and asking a reader to land exactly on a reef
     is asking too much. Nearest wins, so the reach never takes an island from
     its neighbour: between two islands the halo stops halfway. */
  var FINE_REACH = 9;

  function nearestFine(cx, cy) {
    if (!fineHits.length || !svg) return null;
    var m = svg.getScreenCTM();
    if (!m) return null;
    var pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    var q = pt.matrixTransform(m.inverse());
    var reach = FINE_REACH / (m.a || 1);      // screen px into map units
    var best = null, bd = reach * reach;
    for (var i = 0; i < fineHits.length; i++) {
      var b = fineHits[i].b;
      if (q.x < b[0] - reach || q.x > b[2] + reach ||
          q.y < b[1] - reach || q.y > b[3] + reach) continue;
      var dx = q.x < b[0] ? b[0] - q.x : (q.x > b[2] ? q.x - b[2] : 0);
      var dy = q.y < b[1] ? b[1] - q.y : (q.y > b[3] ? q.y - b[3] : 0);
      var d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = fineHits[i].el; }
    }
    return best;
  }

  function fineRegions() {
    if (fineBoxes) return fineBoxes;
    fineBoxes = {};
    var md = $('#proj', svg);
    var spec = md && md.getAttribute('data-fine');
    if (spec) {
      spec.split(/\s+/).forEach(function (part) {
        var bits = part.split(':');
        if (bits.length !== 2) return;
        var n = bits[1].split(',').map(Number);
        if (n.length === 4 && n.every(function (v) { return !isNaN(v); }))
          fineBoxes[bits[0]] = n;
      });
    }
    return fineBoxes;
  }

  /* Which windows the view is looking at. Their boxes overlap in the Pacific —
     Wake sits inside the mandate's box and the Gilberts reach into it — so this
     is a set and not a single answer, and a view that takes in two of them
     legitimately gets both. What it will not do is give a reader in the
     Ryukyus the Solomons. */
  function wantsFine() {
    if (view.w >= FINE_W) return [];
    var boxes = fineRegions();
    var out = [];
    for (var k in boxes) {
      var b = boxes[k];
      if (view.x < b[2] && view.x + view.w > b[0] &&
          view.y < b[3] && view.y + view.h > b[1]) out.push(k);
    }
    return out;
  }

  /* The bounding box of each sub-path of a shape. A sub-path of a coastline
     is one island, which is the unit the fine layer works in. */
  function boxesOf(d) {
    var out = [];
    var parts = String(d || '').split('M').slice(1);
    for (var p = 0; p < parts.length; p++) {
      var nums = parts[p].match(/-?\d+(?:\.\d+)?/g);
      if (!nums || nums.length < 4) { out.push(null); continue; }
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (var i = 0; i + 1 < nums.length; i += 2) {
        var x = +nums[i], y = +nums[i + 1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      out.push([x0, y0, x1, y1]);
    }
    return out;
  }

  /* The file is fetched once and kept parsed. Grafting is per window: a window
     is asked for when the view reaches it and taken back when the view leaves,
     and the coarse shapes are restored from what they were before any window
     touched them, which is the only way two overlapping windows can be added
     and removed in any order without leaving the map half-pruned. */
  function fetchFine(then) {
    if (fineState === 'ready') { then(); return; }
    if (fineState === 'loading') return;
    fineState = 'loading';
    var parse = function (text) {
      fineDoc = new DOMParser().parseFromString(text, 'image/svg+xml');
      fineState = 'ready';
      then();
    };
    if (window.JMAP_INLINE_FINE) { parse(window.JMAP_INLINE_FINE); return; }
    fetch('japan-empire-map-fine.svg')
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(parse)
      .catch(function () { fineState = 'none'; });
  }

  /* Every island in the windows currently grafted. An island's coarse copy is
     not always in the atom its fine copy belongs to — Tanegashima is drawn
     with the Ryukyus, as this map has always drawn it, but Natural Earth also
     carries it inside Japan's filler — so the sweep below goes over the whole
     of #land and not over the named atom alone. */
  function liveFineBoxes() {
    var out = [];
    Object.keys(fineLive).forEach(function (k) {
      fineLive[k].forEach(function (node) {
        boxesOf(node.getAttribute('d')).forEach(function (b) { if (b) out.push(b); });
      });
    });
    return out;
  }

  /* Every coarse shape put back as it was, then pruned again against whatever
     is grafted now. Idempotent by construction: nothing depends on the order
     windows were added in, and with no window grafted it leaves the map
     exactly as it was built. */
  function reprune() {
    coarseOrig.forEach(function (r) {
      if (r.d !== null) r.el.setAttribute('d', r.d);
      r.el.classList.remove('superseded');
    });

    var fine = liveFineBoxes();
    if (!fine.length) return;

    /* Has a finer island taken this one's place? By overlap, not by
       containment. Two drawings of one coastline each reach past the other
       somewhere, so their boxes agree only roughly — Iwo Jima's agree to
       within a half — and asking for containment called that a different
       island and left both drawn. */
    var covers = function (b) {
      var pad = 0.4;
      for (var i = 0; i < fine.length; i++) {
        var f = fine[i];
        if (b[0] >= f[0] - pad && b[1] >= f[1] - pad &&
            b[2] <= f[2] + pad && b[3] <= f[3] + pad) return true;
        var ix0 = Math.max(b[0], f[0]), iy0 = Math.max(b[1], f[1]);
        var ix1 = Math.min(b[2], f[2]), iy1 = Math.min(b[3], f[3]);
        if (ix1 <= ix0 || iy1 <= iy0) continue;
        var inter = (ix1 - ix0) * (iy1 - iy0);
        var u = (b[2] - b[0]) * (b[3] - b[1]) + (f[2] - f[0]) * (f[3] - f[1]) - inter;
        if (u > 0 && inter / u > 0.15) return true;
      }
      return false;
    };

    var remember = function (node, d) {
      if (node.__coarse) return;
      node.__coarse = true;
      coarseOrig.push({ el: node, d: d });
    };

    /* Island by island: the replaced sub-paths are cut out of the shape and
       the rest is left drawing. A shape with nothing left steps aside whole.
       Doing it per shape instead would mean the filler — one path holding the
       entire Ryukyu arc — either kept drawing Okinawa's coarse coastline
       beside the fine one, or vanished and took with it the handful of islands
       too small for the fine file to carry. */
    var prune = function (node) {
      if (node.classList.contains('fine')) return;
      var d = node.getAttribute && node.getAttribute('d');
      if (!d) {
        // A circle rather than a shape: the ring the base map draws round an
        // island too small to see, and the invisible one beside it that takes
        // the pointer for it. Both stand down once the island itself is drawn
        // properly — the hit circle is five map units across, which deep in a
        // zoom is a hundred and fifty pixels of ocean answering for an island
        // a reader can now see and point at directly.
        var bb;
        try { bb = node.getBBox(); } catch (e) { return; }
        if (!bb || (!bb.width && !bb.height)) return;
        var box = [bb.x, bb.y, bb.x + bb.width, bb.y + bb.height];
        if (covers(box)) { remember(node, null); node.classList.add('superseded'); return; }
        for (var i = 0; i < fine.length; i++) {
          var f = fine[i];
          var fx = (f[0] + f[2]) / 2, fy = (f[1] + f[3]) / 2;
          if (fx >= box[0] && fx <= box[2] && fy >= box[1] && fy <= box[3]) {
            remember(node, null);
            node.classList.add('superseded');
            return;
          }
        }
        return;
      }
      var parts = d.split('M').slice(1);
      var boxes = boxesOf(d);
      var kept = [];
      for (var p = 0; p < parts.length; p++) {
        if (!boxes[p] || !covers(boxes[p])) kept.push(parts[p]);
      }
      if (kept.length === parts.length) return;
      remember(node, d);
      if (!kept.length) node.classList.add('superseded');
      else node.setAttribute('d', 'M' + kept.join('M'));
    };

    $$('#land path, #land circle', svg).forEach(prune);
  }

  function graftFine(key) {
    if (fineLive[key] || !fineDoc) return false;
    var g = $('g[data-for="' + key + '"]', fineDoc.documentElement);
    var el = atomEls[key];
    if (!g || !el) return false;
    var nodes = [];
    var before = el.querySelector('circle');
    $$(':scope > *', g).forEach(function (child) {
      var node = document.importNode(child, true);
      node.setAttribute('class', 'fine');
      el.insertBefore(node, before);
      nodes.push(node);
    });
    fineLive[key] = nodes;
    return true;
  }

  function dropFine(key) {
    var nodes = fineLive[key];
    if (!nodes) return false;
    nodes.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    delete fineLive[key];
    return true;
  }

  /* The hover reach, in map units, so pointing at an islet costs no geometry
     calls at all. Rebuilt whenever the live set changes. */
  function rebuildFineHits() {
    fineHits = [];
    Object.keys(fineLive).forEach(function (k) {
      fineLive[k].forEach(function (node) {
        boxesOf(node.getAttribute('d')).forEach(function (b) {
          if (b) fineHits.push({ b: b, el: node });
        });
      });
    });
  }

  function syncFine() {
    var want = wantsFine();
    if (!want.length && !Object.keys(fineLive).length) return;
    if (want.length && fineState !== 'ready') {
      fetchFine(syncFine);
      return;
    }
    var wanted = {};
    want.forEach(function (k) { wanted[k] = true; });
    var changed = false;
    Object.keys(fineLive).forEach(function (k) {
      if (!wanted[k]) changed = dropFine(k) || changed;
    });
    want.forEach(function (k) { changed = graftFine(k) || changed; });
    if (!changed) return;
    rebuildFineHits();
    reprune();
    // the coarse shapes the stripes were copied from have just changed
    buildHatch();
    applyState();
    redrawHighlight();
  }

  /* China's provinces come from two sources and the reader picks one in
     Layers. The sets are kept apart rather than hidden: a hidden path still
     answers `querySelectorAll`, and every sweep over sub-units — the hover
     outline, the cluster, the name — would then see both sources at once and
     draw each boundary twice. Whichever set is not in use is held here, out of
     the document altogether. */
  var provSets = { enp: {}, roc: {} };
  var provSource = 'enp';
  var rocState = 'none';            // none | loading | ready | failed

  function rememberProvinces(which, key, nodes) {
    (provSets[which][key] = provSets[which][key] || []).push.apply(
      provSets[which][key], nodes);
  }

  function setProvinceSource(which) {
    if (which !== 'enp' && which !== 'roc') return;
    provSource = which;
    if (which === 'roc' && rocState === 'none') loadRoc();
    Object.keys(atomEls).forEach(function (key) {
      var el = atomEls[key];
      var wanted = provSets[which][key];
      var other = provSets[which === 'enp' ? 'roc' : 'enp'][key];
      // nothing to swap to: the atom keeps what it has
      if (!wanted || !wanted.length) return;
      if (other) other.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      var before = el.querySelector('circle');
      wanted.forEach(function (n) { el.insertBefore(n, before); });
    });
    applyState();
    if (selected) select(selected);
    redrawHighlight();
  }

  function loadRoc() {
    if (rocState === 'loading' || rocState === 'ready') return;
    rocState = 'loading';
    fetch('japan-empire-map-roc.svg')
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        var got = 0;
        $$('g[data-for]', doc.documentElement).forEach(function (g) {
          var key = g.getAttribute('data-for');
          if (!atomEls[key]) return;
          var nodes = [];
          while (g.firstElementChild) {
            var node = document.importNode(g.firstElementChild, true);
            g.removeChild(g.firstElementChild);
            nodes.push(node);
          }
          if (nodes.length) { rememberProvinces('roc', key, nodes); got++; }
        });
        rocState = got ? 'ready' : 'none';
        if (got && provSource === 'roc') setProvinceSource('roc');
      })
      .catch(function () {
        rocState = 'failed';
        // fall back rather than leaving China with no provinces at all
        var back = $('#prov-enp');
        if (back) { back.checked = true; setProvinceSource('enp'); }
      });
  }

  function loadAdmin() {
    // 'failed' is retried, 'loading' and 'ready' are left alone
    if (adminState === 'loading' || adminState === 'ready') return;
    adminState = 'loading';
    setAdminBusy();
    var graft = function (text) {
      var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      var grafted = 0;
      $$('g[data-for]', doc.documentElement).forEach(function (g) {
        var el = atomEls[g.getAttribute('data-for')];
        if (!el) return;
        grafted++;
        var before = el.querySelector('circle');   // islet rings stay on top
        var mine = [];
        while (g.firstElementChild) {
          var node = document.importNode(g.firstElementChild, true);
          g.removeChild(g.firstElementChild);
          el.insertBefore(node, before);
          mine.push(node);
        }
        rememberProvinces('enp', g.getAttribute('data-for'), mine);
        el.classList.remove('deferred');
      });
      if (!grafted) {
        // nothing matched: the map cannot have been built yet, so leave the
        // state alone and let it be asked for again rather than declaring
        // success over an empty document
        adminState = 'none';
        setAdminBusy();
        return;
      }
      adminState = 'ready';
      setAdminBusy();
      applyState();
      if (selected) select(selected);
    };
    if (window.JMAP_INLINE_ADMIN) { graft(window.JMAP_INLINE_ADMIN); return; }
    fetch('japan-empire-map-admin.svg')
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(graft)
      .catch(function () {
        // say so rather than sitting there looking switched on and empty; the
        // next press retries
        adminState = 'failed';
        setAdminBusy();
      });
  }

  /* A phone gets one row of buttons and no quiz: the quiz card, its two mode
     buttons and its feedback line took most of a phone screen and left the map
     a strip. About has no button either, so its text moves into the bottom of
     Layers, where there is room for it. */
  function isPhone() {
    return window.matchMedia('(max-width: 620px), (max-height: 520px)').matches;
  }

  function applyPhoneLayout() {
    var phone = isPhone();
    var about = $('#dlg-about');
    var slot = $('#about-slot');
    if (about && slot) {
      var body = $$('#dlg-about > *:not(form):not(h2)');
      if (phone && slot.children.length === 0) {
        body.forEach(function (n) { slot.appendChild(n); });
        slot.hidden = false;
      } else if (!phone && slot.children.length) {
        while (slot.firstChild) about.appendChild(slot.firstChild);
        slot.hidden = true;
      }
    }
    if (phone && state.mode === 'quiz') {
      state.mode = 'explore';
      setModeButtons();
      applyState();
    }
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
    // Measured against the map, not the stage. The stage also holds the card
    // column, so clipping to it counted ground hidden behind the cards as
    // visible; and the quiz card only sits *over* the map on a narrow screen —
    // on a wide one it is beside it, near the top, so taking its top as the
    // floor made every territory score nothing, and every question then
    // zoomed and recentred on its own answer before the student could look.
    var st = container.getBoundingClientRect();
    var box = quizBox.hidden ? null : quizBox.getBoundingClientRect();
    var over = box && box.left < st.right && box.right > st.left &&
               box.top < st.bottom && box.bottom > st.top;
    var floor = over ? Math.min(st.bottom, box.top) : st.bottom;
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
        if (cat === 'territory' && state.cats[cat]) loadAdmin();
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


    var optLabels = $('#opt-labels');
    optLabels.checked = state.labels;
    optLabels.addEventListener('change', function () { state.labels = optLabels.checked; applyState(); });

    var optExtent = $('#opt-extent');
    optExtent.checked = state.extent;
    optExtent.addEventListener('change', function () { state.extent = optExtent.checked; applyState(); });

    var optRivers = $('#opt-rivers');
    optRivers.checked = state.rivers;
    optRivers.addEventListener('change', function () { state.rivers = optRivers.checked; applyState(); });

    // Which source draws China's provinces. Deliberately not remembered
    // between visits, for the same reason the year and the three layer buttons
    // are not: this is a teaching map and every reader should start from the
    // same place, which is the period-correct source.
    $$('input[name="prov-src"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) setProvinceSource(r.value);
      });
    });


    // Option-click opens the admin panel instead of the Layers dialogue. It is
    // a separate file and a reader never fetches it; see admin.js.
    $('#btn-options').addEventListener('click', function (e) {
      if (e.altKey) { loadAdminPanel(); return; }
      $('#dlg-options').showModal();
    });
    $('#btn-about').addEventListener('click', function () { $('#dlg-about').showModal(); });
    $$('dialog').forEach(function (d) {
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });

    $('#info-close').addEventListener('click', function () { select(null); });
    // the same button is "Show me" during a quiz and "Try again" after it
    $('#q-reveal').addEventListener('click', function () {
      if (quiz && !quiz.current) { startQuiz(); return; }
      revealAnswer();
    });
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
    setModeButtons();
  }

  function zoomCentre(factor) {
    var r = container.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  }
}());
