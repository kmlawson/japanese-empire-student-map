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
  var JEM_VERSION = '1.79';
  var JEM_ASSETS = {"admin.js": "39d0f40f07", "annotate.js": "3758d3cf05", "japan-empire-map-admin.svg": "9de0304837", "japan-empire-map-fine.svg": "0f0c4fdf64", "japan-empire-map-roc.svg": "3f582f76fc", "japan-empire-map.svg": "9214380208", "relief-coarse-albers.webp": "b57f3373ec", "relief-coarse-laea.webp": "4a79ce52b8", "relief-coarse-mercator.webp": "dd24772c29", "relief-fine-albers.webp": "641d43c5c5", "relief-fine-laea.webp": "52676e1c50", "relief-fine-mercator.webp": "1dc7a621a2", "relief-finest-albers.webp": "05b24e1e30", "relief-finest-laea.webp": "1325488946", "relief-finest-mercator.webp": "cac01f8da0"};

  /* Every file this one fetches, with the version on it.

     `index.html` is short-cached and carries the version; everything heavy is
     cached for a week. Without this the week is a trap — a reader who has been
     before keeps last week's `map.js` and `data.js` while the page tells them
     they have the new one, which is exactly how a fixed bug came to be
     reported as unfixed. With it, a release changes every URL, so the browser
     has no choice but to fetch, and between releases the week-long cache does
     its work untouched.

     The key is a hash of the file's own contents, not the version number.
     That distinction is the whole of it: the version moves once per push, by
     the rule in `CLAUDE.md`, so keying on it meant a file edited and uploaded
     without a bump kept its old URL and its old place in the cache — for a
     week, since these URLs are what let the week-long cache come back. A
     content hash cannot be forgotten. Bump or not, an edited file gets a new
     name and an unedited one keeps its cache.

     `JEM_ASSETS` is written by `build_texts.py` and holds only what this file
     fetches for itself; the pages carry their own. The version is kept as a
     fallback for a build that has not been run. */
  function asset(name) {
    var key = (typeof JEM_ASSETS !== 'undefined' && JEM_ASSETS
               && JEM_ASSETS[name]) || null;
    if (!key && typeof JEM_VERSION !== 'undefined' && JEM_VERSION) key = JEM_VERSION;
    return key ? name + '?v=' + encodeURIComponent(key) : name;
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var STORE_KEY = 'jmap.v3';
  var DOT_R = 5.5;        // marker radius, in screen pixels
  var HIT_R_TOUCH = 22;   // finger-sized tap target
  var HIT_R_MOUSE = 13;
  var TAP_SLOP = 9;       // px of movement still counted as a tap
  var DBL_MS = 320;       // ms between two taps for them to be one gesture
  var DBL_SLOP = 32;      // px apart the two may land and still be one
  var DBL_ZOOM = 1.9;     // what one double tap is worth, as the wheel has it
  // px of drag for one doubling of the scale, in the gesture where the second
  // tap is held and drawn down the screen. A phone has no wheel and a pinch
  // needs two thumbs, one of which is usually holding the phone; this is the
  // one-handed way in. 190 is about a thumb's reach on a small screen for a
  // doubling, which makes four times the width the length of the screen.
  var ZOOM_DRAG_PX = 190;
  var TERR_PX = 13.5;     // label sizes, in screen pixels
  var SITE_PX = 11.5;
  var SUB_PX = 10.5;      // provinces and islands, a step under a country
  var FEAT_PX = 11;       // seas, deserts, plateaus: the physical map
  var EPOCH_1930_CUTOFF = 1930;   // the 1930 sheet's own year
  var EVENT_1930_FROM   = 1910;   // and how far back its detail reaches
  var LANGS = ['en', 'ja', 'zh', 'ko'];

  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var HIT_R = coarse ? HIT_R_TOUCH : HIT_R_MOUSE;

  // The quiz is off. `mode` stays 'explore': the control that would change
  // it is hidden in index.html, and every quiz path in this file is guarded
  // on `state.mode === 'quiz'`, so none of them can run. Nothing is deleted.
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
    // The 1.3px stroke round every filled shape. It is a repair — it closes the
    // hairline between two polygons that no longer share an edge once they have
    // been simplified — and it is also about three quarters of everything the
    // browser rasters, so the map is three to six times cheaper to pan without
    // it. Off unless it is asked for; `styles.css` says what asking buys.
    hairline: false,
    // The country's own outline, drawn under its divisions so that a crack
    // between two of them shows the country rather than the sea. Where the
    // divisions are drawn it is a second copy of the same ground, and it is
    // off by default now: the map shows one polygon per country with the
    // Administrative layer off and the divisions with it on, and not both at
    // once. Switching it on puts the filler back, which is the way to see
    // what it was doing.
    //
    // "Off" means off where it is redundant. Siam, Burma and Indochina keep
    // theirs whatever this says, because their divisions live in the
    // administrative file and the backing is the only shape they have until
    // it loads -- hiding it would take three countries off the map.
    backs: false,
    // Natural Earth's rivers of the subcontinent, off unless asked for. The
    // Yangzi and the Yellow River are two rivers this map argues with; these
    // are sixty-three lines of context under the Raj, which is a different
    // kind of thing and should not arrive with them.
    indiaRivers: false,
    // the mesh of meridians and parallels; off by default
    graticule: false,
    /* Shaded relief under the political colours. Off by default and fetched
       only when asked for: it is a third of a megabyte, and a map of who
       governed what does not need the ground to answer its question.

       It is a raster, so unlike everything else here it cannot be reprojected
       in the browser — there is nothing to move but the pixels. `relief.js`
       carries one warp per projection and where each one goes; see
       `tools/build_relief.py`. */
    relief: false,
    /* Which of the three sheets. 0 is the 1:50m one at 347 KB, 2 the 1:10m at
       1.7 MB and four times the pixels to decode. The reader chooses, because
       the right answer depends on their machine and their connection and this
       file cannot know either. */
    reliefDetail: 0,
    // 'mercator' or 'laea'. The file is drawn in the first; the second is
    // worked out in the browser, Mercator being exactly invertible. See the
    // projection block for what each is good and bad at.
    projection: 'mercator',
    // Which reading of the occupation in China is drawn. 'traced' is the map's
    // own: the 1940 sheet adjusted to December 1942, with Wu Yuexing's
    // Communist base areas over it. 'nca' is the North China Area Army's own
    // security survey of September 1942, which covers north China and nothing
    // else — so it replaces both rather than joining them, and the map then
    // shows what that one source shows.
    occSource: 'traced',
    /* The 1942 map's two client states, each on its own switch. A reader
       building their own account of the war wants the coastline and the
       Republic under it and nothing else asserted; these are the two shapes
       most often in the way of that. Off, the ground stays — it is still
       land — but it is painted the neutral the map uses for everywhere it
       makes no claim about. */
    manchukuo: true,
    mengjiang: true,
    /* Japanese names foremost inside the empire — the names an official
       document or a railway timetable of the period would print — or the local
       ones. On by default because the map is a map *of* the empire, and the
       names it administered under are the ones its own paperwork used; a
       reader who wants Kyŏnggi-do rather than Keiki-dō has one switch.

       It governs the insides only. Chōsen, Taiwan and Manchukuo are what those
       polities were called, and a switch about how their provinces are
       labelled has no business renaming them. */
    jpNames: true,
    mono: false,                    // every state and province one grey
    /* And which colour that is, once a reader has chosen one. Null means the
       stylesheet's own — which is not one colour but two, a warm parchment in
       the light scheme and a slate in the dark, and a choice made here
       replaces both. */
    monoColour: null,
    /* The whole map, or only the ground the course is about. On, everything is
       drawn as it always was; off, the frame keeps China and Tibet, Japan and
       its colonies, and the treaty ports on the China coast, and everything
       else is sea.

       Manchukuo, Mengjiang and the occupied zone are kept on the 1942 map even
       though the reader's list did not name them: they are the 1942 form of
       the same ground, and dropping them would leave a hole where Manchuria
       is, which reads as a fault rather than as a choice. */
    world: true,
    // The Communist base areas, drawn over the traced zone. They are a second
    // author's answer laid on top of the first, so they get a switch of their
    // own inside that reading: turning them off leaves the occupation as the
    // 1940 sheet drew it, and turning them back on is the point being made.
    // Nothing to switch under 'nca', which has no base areas in it.
    ccp: true,
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
  var mandateLiftLayer = null;
  var subsLiftLayer = null;
  var hiDefs = null;
  var ownedDefs = { hi: [], sub: [] };
  var proj = null;
  var mapW = 0, mapH = 0;
  // the same two as the file was drawn: `mapW`/`mapH` follow the projection on
  // screen, these do not, and every coordinate in the document is in these
  var mapW0 = 0, mapH0 = 0;

  var atomEls = {};
  // the whole-country fillers, in their own layer under every atom
  var backingEls = {};       // atom id -> element
  /* Lines that take an atom's colour without being part of its shape: the
     yellow half of China's coastal stroke, and the salmon half drawn along the
     occupied coast. They are kept out of `backingEls` and out of the atoms
     themselves, because everything that reaches for either wants a shape, and
     these only describe an edge. They show and hide with their atom and take
     its colour, and that is all. */
  var backingEdges = {};     // atom id -> the stroke-only path along its edge
  var seamEls = {};          // atom id -> [elements] in the seam layer
  var byId = {};          // item id -> record (current epoch territories + sites)
  var elById = {};        // item id -> a representative element (for flashing)
  var atomsOf = {};       // item id -> [elements]
  var sitePos = {};       // site id -> {x, y} in map units
  var scalables = [];     // {el, x, y} kept at constant screen size
  var labels = [];        // {rec, el, x, y, dy, size, w, h}
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
      ['manchukuo', 'mengjiang', 'mono', 'world'].forEach(function (k) {
        if (typeof saved[k] === 'boolean') state[k] = saved[k];
      });
      if (typeof saved.rivers === 'boolean') state.rivers = saved.rivers;
      if (typeof saved.hairline === 'boolean') state.hairline = saved.hairline;
      if (typeof saved.backs === 'boolean') state.backs = saved.backs;
      if (typeof saved.indiaRivers === 'boolean') state.indiaRivers = saved.indiaRivers;
      if (typeof saved.graticule === 'boolean') state.graticule = saved.graticule;
      if (typeof saved.relief === 'boolean') state.relief = saved.relief;
      if (typeof saved.jpNames === 'boolean') state.jpNames = saved.jpNames;
      if (typeof saved.monoColour === 'string' && HEX.test(saved.monoColour)) {
        state.monoColour = saved.monoColour;
      }
      if (typeof saved.reliefDetail === 'number') {
        state.reliefDetail = Math.max(0, Math.min(2, saved.reliefDetail | 0));
      }
      if (['mercator', 'albers', 'laea'].indexOf(saved.projection) >= 0) {
        state.projection = saved.projection;
      }
      if (typeof saved.ccp === 'boolean') state.ccp = saved.ccp;
      if (saved.occSource === 'nca' || saved.occSource === 'traced'
          || saved.occSource === 'none') {
        state.occSource = saved.occSource;
      }
      if (typeof saved.legend === 'boolean') state.legend = saved.legend;
    } catch (err) { /* first visit, or storage is off — defaults are fine */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        epoch: state.epoch, level: state.level,
        cats: state.cats, labels: state.labels, extent: state.extent,
        rivers: state.rivers, legend: state.legend, hairline: state.hairline,
        backs: state.backs, indiaRivers: state.indiaRivers,
        projection: state.projection, graticule: state.graticule,
        relief: state.relief, reliefDetail: state.reliefDetail,
        jpNames: state.jpNames,
        occSource: state.occSource, ccp: state.ccp,
        manchukuo: state.manchukuo, mengjiang: state.mengjiang, mono: state.mono,
        monoColour: state.monoColour,
        world: state.world,
      }));
    } catch (err) { /* private browsing; not worth complaining about */ }
  }

  /* A place on the 1930 map should not be labelled or described by something
   * that had not happened yet. Sites with a per-epoch entry get it merged over
   * the base record at display time; ids and geometry never change. */
  /* Which of a record's two English forms is the one to show.
     
     `en` is Japanese-first and `local` is the other way round; a record with no
     `local` has only one name and is unaffected. The local form wins when the
     switch is off — and also, whatever the switch says, when the Japanese form
     is not yet true: `jpfrom` marks the rows that only became Japanese at the
     later date, which is every Manchurian and Mengjiang city. Manchukuo's
     provinces are drawn on the 1942 map alone, but its cities are on both, and
     calling Mukden `Hōten` on a map of 1930 would be an anachronism no switch
     can excuse. */
  function localWins(rec) {
    if (!rec || !rec.local) return false;
    if (!state.jpNames) return true;
    return !!rec.jpfrom && rec.jpfrom !== state.epoch;
  }

  function shown(rec) {
    if (!rec) return rec;
    /* The `id` test guards the override lookup and nothing else. It used to
       guard the whole function, which meant sub-units never got this far: they
       are keyed by `key`, that column is dropped from the record as the file's
       own business, and so a province record has no `id` at all. Every Korean
       and Taiwanese name went through here unchanged for that reason. */
    var over = rec.id && JMAP.EPOCH_OVERRIDES && JMAP.EPOCH_OVERRIDES[rec.id];
    over = over && over[state.epoch];
    var swap = localWins(rec);
    if (!over && !swap) return rec;
    var out = {};
    Object.keys(rec).forEach(function (k) { out[k] = rec[k]; });
    if (over) Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    // after the epoch override, which may have replaced `en` and `local` both
    if (localWins(out)) out.en = out.local;
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

  /* `Name — what it was` splits into a headline and the first line of the
     card. Only the em dash with spaces round it counts: an en dash inside a
     date range, and a hyphen inside Kankyōhoku-dō, are not separators. */
  function splitGloss(name) {
    var cut = name ? name.indexOf(' — ') : -1;
    if (cut < 0) return { name: name || '', gloss: '' };
    var gloss = name.slice(cut + 3).trim();
    // Capitalised and given a full stop, unless it brought its own. The
    // province descriptions are whole paragraphs and end in one already, so
    // adding another put ".." at the end of thirty of them.
    if (gloss) {
      gloss = gloss.charAt(0).toUpperCase() + gloss.slice(1);
      if (!/[.!?…]$/.test(gloss)) gloss += '.';
    }
    return { name: name.slice(0, cut), gloss: gloss };
  }

  function territories() { return JMAP.TERRITORIES[state.epoch]; }
  function catList() { return JMAP.CATEGORIES[state.epoch]; }

  function catInfo(id) {
    var all = catList().concat(JMAP.SITE_CATEGORIES);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* A site belongs to the 1930 map only if it had happened by then. */
  /* Which sheet an event belongs on.
   *
   * Cities are unchanged: a place that existed by 1930 is on the 1930 map and
   * everything is on the 1942 one.
   *
   * Events answer to their decade instead. The pivotal ones — Perry at Uraga,
   * Kanghwa, Tsushima, the Mukden Incident, Pearl Harbor — carry `both` and
   * stand on either sheet, because they are the arc the two dates are points
   * on. The rest are the detail of their own period: 1910 to 1930 belongs to
   * the 1930 map and 1931 onwards to the 1942 map, so the earlier sheet is no
   * longer a map of territory with four events on it, and the later one is not
   * carrying incidents from twenty years before its date. */
  function siteInEpoch(s) {
    var y = s.year || 0;
    if (s.cat !== 'battle') {
      return state.epoch !== 'e1930' || y <= EPOCH_1930_CUTOFF;
    }
    if (s.both) return true;
    return state.epoch === 'e1930'
      ? (y >= EVENT_1930_FROM && y <= EPOCH_1930_CUTOFF)
      : (y > EPOCH_1930_CUTOFF);
  }

  /* Territories are always shown and always clickable — the level decides
   * what the quiz asks for and what gets a label, not what you can look at. */
  /* A record tied to one reading of the occupation is absent under the other:
     not drawn, not labelled, not in the legend, not asked about. */
  function srcOK(rec) {
    if (!rec) return true;
    // The base areas answer to their own switch as well as to the source they
    // belong to. Doing it here rather than in applyState is what makes the
    // switch reach the legend swatch, the label, the quiz and the selection
    // too, all of which already ask this question.
    if (rec.id === 'ccp' && !state.ccp) return false;
    return !rec.srcOnly || rec.srcOnly === state.occSource;
  }

  function inQuiz(rec) {
    if (!srcOK(rec)) return false;
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
  /* Level 4 is a band above the three the reader can ask for: a name that is
     only worth the room once somebody has gone looking for the speck it
     belongs to. Miangas is the case — one square kilometre of Dutch soil
     forty miles off Mindanao, and its name was on the map from the opening
     view, over open sea, because a territory of its own earns a territory's
     label however small it is. It waits for the same zoom the islands wait
     for now. Nothing else is level 4, and nothing below it is affected: a
     level-3 name still appears the moment the level reaches 3. */
  function labelLevel() {
    var bonus = view.w < mapW / SUB_LABEL_ZOOM ? 3
      : (view.w < mapW / 10 ? 2 : (view.w < mapW / 3 ? 1 : 0));
    return Math.min(4, state.level + bonus);
  }

  /* What a record is called *on the map*, which is not always what it is
     called. A card has room for "Karafuto (southern Sakhalin)" and a reader
     who has asked for it; a name floating over the island has room for one
     name, and the alternative in brackets is clutter at every zoom. `label` in
     the territory tables says what to write there when the two differ, and a
     single hyphen says to write nothing at all — the princely states and the
     contested frontiers are answers to a question the reader asks by pointing,
     not things whose names belong across the map.

     English only, deliberately: the other scripts carry their own strings and
     none of them has this problem. */
  /* The few words a record says when the pointer is on it. */
  var SHORT_MAX = 88;
  function shortOf(rec) {
    if (!rec) return '';
    var r = shown(rec);
    if (r.short) return r.short;
    var gloss = splitGloss(nameOf(r)).gloss;
    return gloss && gloss.length <= SHORT_MAX ? gloss : '';
  }

  function mapLabel(rec) {
    var r = shown(rec);
    if (r && r.label && state.lang === 'en') {
      return r.label === '-' ? '' : r.label;
    }
    var name = nameOf(rec);
    if (state.lang !== 'en') return name;
    // The gloss after an em dash is for the card, as it is everywhere else:
    // "Portuguese India — Goa, Damão, Diu, Dadra & Nagar Haveli" is a list of
    // five enclaves and a name for one place, and the map has room for the
    // name. And the alternative in brackets is the card's too: a reader who
    // wants to know that Chōsen is Korea, that Wēihǎi was Weihaiwei or that
    // Tannu Tuva called itself the Tuvan People's Republic can point at it.
    // Across the map it is one more thing to read at every zoom.
    name = splitGloss(name).name;
    return name.replace(/\s+\([^()]*\)\s*$/, '');
  }

  /* The physical names have a ladder of their own, one rung further in than
     the political ones. Thirteen of the thirty-seven are level 1 — nine seas,
     the Gobi, the Taklamakan, the Tibetan Plateau and the Himalaya — and at
     the opening view they all arrived at once, which is a mat of grey italic
     across the whole hemisphere before the reader has looked at anything.
     Nothing at the opening view; the seas at a turn of the wheel; the deserts
     and the basins after that.

     Measured against the opening view rather than the drawing's own width, as
     `zoomed-in` is: a phone opens cropped to the empire and a wide desktop on
     the whole hemisphere, and the question is how far the reader has come. */
  function featureLevel() {
    var home = defaultView().w;
    if (view.w < home / 8) return 4;
    if (view.w < home / 4) return 3;
    if (view.w < home / 2) return 2;
    if (view.w < home / 1.35) return 1;
    return 0;
  }

  function labelVisible(rec) {
    // a province or an island: shown only once the reader is close in, and
    // never mind the Administrative switch — see ensureSubLabels
    if (rec && rec.kind === 'sub') return subLabelsWanted();
    // The physical map. `lvl` is the zoom a feature earns: the Bay of Bengal
    // frames the whole picture, the Hexi Corridor is worth naming only once
    // somebody is looking at Gansu. Nothing else gates them — they are not a
    // layer, they are the ground the layers sit on.
    if (rec && rec.kind === 'feature') return rec.lvl <= featureLevel();
    // A country's name has nothing to do with the Administrative layer, which
    // is about its divisions. Gating it on that switch meant "Show names on
    // the map" showed no country names at all until a second, unrelated button
    // was pressed.
    // — except one that is only drawn when that layer is on, which cannot be
    // named while it is not there.
    if (rec.kind === 'territory') {
      if (!srcOK(rec)) return false;
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
    if (rec.kind === 'browse') {
      if (!browseVisible() || labelLevel() < 2) return false;
      /* Where the gazetteer is loaded it is what draws the dots — `#browse`'s
         own are hidden the moment `JMAP.GAZ` exists — and these names are the
         names of *those* dots. So a name must not outlast the dot it belongs
         to, and the gazetteer thins its dots by tier as the reader pulls back.
         It did not ask, and the result was a screen of city names over western
         China with nothing under them: Wūlǔmùqí, Hami, Éjìnà, Yínchuān, Xīníng
         and thirty more, floating, because their dots were below the tier
         floor at that zoom while their names were not gated at all. */
      if (JMAP.GAZ) {
        var dot = gazFor(rec.id);
        return !!dot && gazVisible(dot);
      }
      return true;
    }
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
    // the same net as the fetched build has. A standalone file with a damaged
    // or mismatched map in it used to throw into an unhandled rejection and
    // leave a blank page with nothing to read
    Promise.resolve(window.JMAP_INLINE_SVG).then(init).catch(showLoadError);
  } else {
    fetch(asset('japan-empire-map.svg'))
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

    var vb = svg.getAttribute('viewBox');
    var meta = svg.querySelector('#proj');
    // a map with no frame and no projection metadata is not this map
    if (!vb || !meta) { showLoadError(); return; }
    var box = vb.split(/\s+/).map(Number);
    mapW = mapW0 = box[2];
    mapH = mapH0 = box[3];

    proj = {
      lonMin: parseFloat(meta.getAttribute('data-lon-min')),
      latMax: parseFloat(meta.getAttribute('data-lat-max')),
      pxPerDeg: parseFloat(meta.getAttribute('data-px-per-deg')),
      R: parseFloat(meta.getAttribute('data-r')),
    };
    proj.yTop = proj.R * Math.log(Math.tan(Math.PI / 4 + proj.latMax * Math.PI / 360));

    // The sea and the edge of the drawing are rectangles in the file because a
    // box of longitude and latitude is a box in Mercator. In anything else it
    // is a curved quadrilateral, so both become paths here once and `reframe`
    // writes whichever shape is wanted.
    ['ocean', 'frame'].forEach(function (id) {
      var r = svg.querySelector('rect#' + id);
      if (!r) return;
      var pth = svgEl('path', { id: id });
      r.parentNode.replaceChild(pth, r);
    });
    reframe();

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
    // The mandate lines, lifted clear of the land they cross. The shape itself
    // has to stay *under* every island, because it is the hover target and an
    // island inside a mandate must answer for itself — but that buried its line
    // wherever it crossed ground, so the Australian mandate's boundary across
    // New Guinea was invisible and only the stretches over water showed. The
    // period charts draw the line straight across the island, and so does this:
    // a stroked copy above all of #land, taking no pointer events, while the
    // original keeps the fill that answers and washes.
    mandateLiftLayer = svgEl('g', { id: 'mandate-lift' });
    svg.appendChild(mandateLiftLayer);
    // the standing outlines round territories that share a neighbour's colour
    subOutlineLayer = svgEl('g', { id: 'sub-outlines' });
    svg.appendChild(subOutlineLayer);
    /* The markers go back on top of the three line layers just created.
       `#markers` is written into the SVG before them, so a province hairline
       lifted clear of its atom, a mandate line, or a standing sub-outline was
       drawn straight across a city dot — and a dark line through the white
       ring round a dot reads as a broken marker rather than as a boundary.
       Bangkok is the case a reader sees, with a changwat edge through it.

       Not above the highlight, and not above the labels: a selection outline a
       row of city dots can rub out is not much of an outline, and that was a
       deliberate choice made here before. Only the lines that belong to the
       land go under. `#browse`, `#gaz` and `#atom-hits` follow on their own:
       each is built later and inserted *before* `#markers`, so moving the one
       carries the other three. */
    if (markersGroup) svg.appendChild(markersGroup);

    highlightLayer = svgEl('g', { id: 'highlight' });
    svg.appendChild(highlightLayer);
    extentPath = svg.querySelector('#extent-1942');
    riversGroup = svg.querySelector('#rivers');
    indiaRiversGroup = svg.querySelector('#india-rivers');
    buildYellow1938();
    buildBrowse();
    buildGazetteer();
    hatchGroup = svg.querySelector('#hatching');

    $$('.atom', svg).forEach(function (el) { atomEls[el.id.replace(/^a-/, '')] = el; });
    // one stroked copy per mandate, above the land; `syncMandateLines` keeps
    // each one's colour and visibility with the shape it was copied from
    // Two paths, not one: a pale casing and the coloured dash over it. A
    // mandate line in its power's own colour is invisible over that power's own
    // land — Australia's #c9a6b0 line ran across New Guinea, which is drawn in
    // #c9a6b0 — so the boundary showed over water and disappeared the moment it
    // met the ground it divides. The casing gives it something to read against
    // whatever it crosses.
    $$('#land path.mandate', svg).forEach(function (el) {
      var key = el.id.replace(/^a-/, '');
      ['mandate-casing', 'mandate-line'].forEach(function (cls) {
        var line = svgEl('path', { d: el.getAttribute('d'), 'class': cls });
        line.setAttribute('data-for', key);
        mandateLiftLayer.appendChild(line);
      });
    });
    $$('#backings [data-for]', svg).forEach(function (el) {
      backingEls[el.getAttribute('data-for')] = el;
      /* The atom this filler belongs to is marked, so a stylesheet can tell
         "this shape is the country" from "these are the pieces it was built
         out of" — which is what the single-colour view needs in order to draw
         one outline round a country rather than every seam inside it. */
      var owner = svg.getElementById('a-' + el.getAttribute('data-for'));
      if (owner) owner.classList.add('has-fill');
    });
    // Anywhere in the drawing, not only among the backings: the occupied
    // coast is a sibling of its atom rather than a child of one.
    $$('[data-edge-for]', svg).forEach(function (el) {
      backingEdges[el.getAttribute('data-edge-for')] = el;
    });
    // The seams take their atom's colour and nothing else about it: they are
    // not in atomsOf, so they are never lit, never outlined and never named.
    $$('#seams [data-for]', svg).forEach(function (el) {
      (seamEls[el.getAttribute('data-for')] = seamEls[el.getAttribute('data-for')] || []).push(el);
    });
    buildAtomHits();

    JMAP.SITES.forEach(function (s) { s.kind = 'site'; });
    // Before the controls are built, so a shared link's year and layers are
    // what the map is drawn with rather than something switched on afterwards
    // in front of the reader.
    var shared = readUrl();

    buildMarkers();
    buildSiteLabels();
    nudgeOverlaps();
    buildEpochControl();
    syncLayerButtons();

    wireControls();
    wirePointer();

    composeEpoch();
    applyState();
    view = (shared && viewForBox(shared[0], shared[1], shared[2], shared[3]))
      || defaultView();
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
    // The Republic's provinces, if the link asked for them. setProvinceSource
    // fetches the file and re-applies itself when it arrives, so it can be
    // called before anything has been grafted.
    if (urlProvSource === 'roc') {
      var rocRadio = $('#prov-roc');
      if (rocRadio) rocRadio.checked = true;
      setProvinceSource('roc');
    }

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
    s.src = asset('admin.js');
    s.onerror = function () { adminPending = false; };
    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------- projection --

     The sheet is drawn in Web Mercator, and that is a fact about the file
     rather than a choice the reader is stuck with: Mercator inverts exactly,
     so every coordinate in the document can be turned back into longitude and
     latitude and sent through a different projection without fetching
     anything. `proj` below is how the file was drawn and never changes;
     `projMode` is what the reader is looking at.

     Why offer the choice at all. Mercator's area scale is sec squared of the
     latitude: at the equator 1, at 35N 1.5, at 45N 2.0, at the top of this
     frame 3.0. So Karafuto and the Soviet Far East are drawn at two to three
     times the area of Java and the mandate, relative to the truth — on a map
     whose subject is partly how much ocean this empire was, and which is
     thinnest exactly where Mercator is kindest.

     The alternative is Lambert azimuthal equal area on 20N 135E. Equal area,
     so Java against Hokkaido reads honestly; azimuthal because this region is
     about as tall as it is wide rather than a band, which is what conics want.
     It is not free: shape distortion grows with distance from the centre, and
     while Japan is 16 degrees out and the Indies 36, British India is 64 and
     the corners of the frame reach 77. Tangential stretch there is about 28%.
     The middle of the subject is drawn well and the edges pay for it, which is
     the opposite trade from Mercator and the reason both are offered rather
     than one being declared correct. */
  /* Three projections, one of which is how the file was drawn.

     `mercator` is the sheet as built: shapes right, north straight up, and
     area wrong by sec squared of the latitude — 1 at the equator, 2.0 at 45N,
     3.0 at the top of this frame, so Karafuto and the Soviet Far East come out
     two to three times the size of Java and the mandate.

     `albers` is an equal-area conic on 117.5E with standard parallels at 12.5N
     and 37.5N. A conic is the usual answer for a mid-latitude region and it is
     honest about area along those two parallels; what it is not built for is
     140 degrees of longitude, which is what this frame has. The cone constant
     is 0.41, so the meridians fan by about 21 degrees at the western edge and
     36 at the eastern, and the far Pacific swings round noticeably. That is
     the projection behaving correctly rather than a fault, and it is worth
     being able to see.

     `laea` is Lambert azimuthal equal area on 25N 115E. Azimuthal suits a
     region about as tall as it is wide, and this centre sits over the South
     China Sea, which puts the middle of the subject where the distortion is
     least: shape error grows with distance from the centre, so the Indies and
     the China coast are drawn well and the Aleutians and the far Pacific pay
     for it. */
  var PROJ_DEFS = {
    albers: { lon0: 117.5, lat1: 12.5, lat2: 37.5, lat0: 25 },
    laea: { lon0: 115, lat0: 25 },
  };
  var projMode = 'mercator';
  var projFits = {};                     // scale and offset per projection

  var RAD = Math.PI / 180;

  function mercFwd(lon, lat) {
    var l = lon < proj.lonMin ? lon + 360 : lon;
    return {
      x: (l - proj.lonMin) * proj.pxPerDeg,
      y: proj.yTop - proj.R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)),
    };
  }

  /* Longitude and latitude back out of a coordinate in the file. Always
     Mercator, whatever is on screen: this reads the drawing, not the view. */
  function storedLonLat(x, y) {
    return {
      lon: proj.lonMin + x / proj.pxPerDeg,
      lat: (Math.atan(Math.exp((proj.yTop - y) / proj.R)) - Math.PI / 4) * 360 / Math.PI,
    };
  }

  /* --- the two equal-area projections, in their own units, y north-up ---- */

  function laeaRaw(lon, lat) {
    var d0 = PROJ_DEFS.laea;
    var lam = (lon - d0.lon0) * RAD, phi = lat * RAD, p1 = d0.lat0 * RAD;
    var d = 1 + Math.sin(p1) * Math.sin(phi)
              + Math.cos(p1) * Math.cos(phi) * Math.cos(lam);
    if (d <= 1e-9) return null;          // the antipode; nothing here reaches it
    var k = Math.sqrt(2 / d) * proj.R;
    return {
      x: k * Math.cos(phi) * Math.sin(lam),
      y: k * (Math.cos(p1) * Math.sin(phi) - Math.sin(p1) * Math.cos(phi) * Math.cos(lam)),
    };
  }

  function laeaRawInv(x, y) {
    var d0 = PROJ_DEFS.laea, p1 = d0.lat0 * RAD;
    var rho = Math.hypot(x, y);
    if (rho < 1e-9) return { lon: d0.lon0, lat: d0.lat0 };
    var c = 2 * Math.asin(Math.min(1, rho / (2 * proj.R)));
    return {
      lat: Math.asin(Math.cos(c) * Math.sin(p1) + y * Math.sin(c) * Math.cos(p1) / rho) / RAD,
      lon: d0.lon0 + Math.atan2(x * Math.sin(c),
        rho * Math.cos(c) * Math.cos(p1) - y * Math.sin(c) * Math.sin(p1)) / RAD,
    };
  }

  var _alb = null;
  function albersConst() {
    if (_alb) return _alb;
    var d0 = PROJ_DEFS.albers;
    var p1 = d0.lat1 * RAD, p2 = d0.lat2 * RAD, p0 = d0.lat0 * RAD;
    var n = (Math.sin(p1) + Math.sin(p2)) / 2;
    var C = Math.cos(p1) * Math.cos(p1) + 2 * n * Math.sin(p1);
    _alb = { n: n, C: C, rho0: proj.R * Math.sqrt(Math.max(0, C - 2 * n * Math.sin(p0))) / n };
    return _alb;
  }

  function albersRaw(lon, lat) {
    var a = albersConst(), d0 = PROJ_DEFS.albers;
    var q = a.C - 2 * a.n * Math.sin(lat * RAD);
    if (q < 0) return null;                       // beyond the cone's limit
    var rho = proj.R * Math.sqrt(q) / a.n;
    var th = a.n * (lon - d0.lon0) * RAD;
    return { x: rho * Math.sin(th), y: a.rho0 - rho * Math.cos(th) };
  }

  function albersRawInv(x, y) {
    var a = albersConst(), d0 = PROJ_DEFS.albers;
    var dy = a.rho0 - y;
    var rho = Math.hypot(x, dy) * (a.n < 0 ? -1 : 1);
    var th = Math.atan2(x, dy);
    var q = (a.C - rho * rho * a.n * a.n / (proj.R * proj.R)) / (2 * a.n);
    return {
      lat: Math.asin(Math.max(-1, Math.min(1, q))) / RAD,
      lon: d0.lon0 + th / a.n / RAD,
    };
  }

  function rawFwd(mode, lon, lat) {
    return mode === 'albers' ? albersRaw(lon, lat) : laeaRaw(lon, lat);
  }
  function rawInv(mode, x, y) {
    return mode === 'albers' ? albersRawInv(x, y) : laeaRawInv(x, y);
  }

  /* The offset that puts the whole frame in positive coordinates with y down,
     measured off the frame itself rather than guessed. */
  function fitOf(mode) {
    if (projFits[mode]) return projFits[mode];
    var lonMax = proj.lonMin + mapW0 / proj.pxPerDeg;
    var latMin = (Math.atan(Math.exp((proj.yTop - mapH0) / proj.R)) - Math.PI / 4) * 360 / Math.PI;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i <= 100; i++) {
      for (var j = 0; j <= 80; j++) {
        var q = rawFwd(mode, proj.lonMin + (lonMax - proj.lonMin) * i / 100,
                             latMin + (proj.latMax - latMin) * j / 80);
        if (!q) continue;
        if (q.x < x0) x0 = q.x;
        if (q.x > x1) x1 = q.x;
        if (q.y < y0) y0 = q.y;
        if (q.y > y1) y1 = q.y;
      }
    }
    projFits[mode] = { dx: -x0, dy: y1, w: x1 - x0, h: y1 - y0 };
    return projFits[mode];
  }

  function project(lon, lat) {
    if (projMode === 'mercator') return mercFwd(lon, lat);
    var q = rawFwd(projMode, lon, lat);
    var f = fitOf(projMode);
    if (!q) return { x: 0, y: 0 };
    return { x: q.x + f.dx, y: f.dy - q.y };
  }

  /* Every coordinate in the document, moved. The original is kept on the
     element the first time it is touched, so switching back is the file
     exactly and not a round trip through two projections.

     What has to move: the `d` of every path, the centre of every circle, and
     the three attributes the build writes coordinates into — `data-cx`/`cy`,
     which is where a label hangs, and `data-hits`, which is where the finger
     targets for a tiny country go. Patterns are in their own space and are
     left alone; masks are rebuilt from the paths on the next hover anyway. */
  var COORD = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g;

  /* A straight line in one projection is not straight in another, and moving
     only the ends of it draws the chord instead of the line. Every shape here
     that was cut to the frame has a long straight edge along it — the Soviet
     Union's northern limit is one segment right across the sheet at 55N — and
     in Mercator that is a horizontal line while in an azimuthal projection it
     is a curve. Reprojected end to end it came out as a chord standing proud
     of the frame, with the Soviet fill spilling over the top of the drawing.

     So a segment longer than a degree is walked in steps of about a degree,
     interpolating in longitude and latitude, which is the space the line was
     straight in when it was cut. Nothing else needs it: a coastline's vertices
     are already far closer together than that, so this adds points to a
     handful of clipped edges and to nothing else. */
  var DENSIFY_DEG = 1.0;

  function moveD(d) {
    var out = '';
    var subs = d.split('M');
    for (var s2 = 1; s2 < subs.length; s2++) {
      var body = subs[s2];
      var closed = /Z\s*$/i.test(body);
      var pts = body.replace(/Z\s*$/i, '').split('L');
      var prev = null, first = true;
      for (var i = 0; i < pts.length; i++) {
        var c = pts[i].trim().split(/\s+/);
        if (c.length < 2) continue;
        var ll = storedLonLat(parseFloat(c[0]), parseFloat(c[1]));
        if (prev) {
          var dlon = ll.lon - prev.lon, dlat = ll.lat - prev.lat;
          var steps = Math.ceil(Math.max(Math.abs(dlon), Math.abs(dlat)) / DENSIFY_DEG);
          for (var k = 1; k < steps; k++) {
            var q = project(prev.lon + dlon * k / steps, prev.lat + dlat * k / steps);
            out += 'L' + (Math.round(q.x * 100) / 100) + ' ' + (Math.round(q.y * 100) / 100);
          }
        }
        var p = project(ll.lon, ll.lat);
        out += (first ? 'M' : 'L') + (Math.round(p.x * 100) / 100) + ' ' +
               (Math.round(p.y * 100) / 100);
        first = false;
        prev = ll;
      }
      if (closed) out += 'Z';
    }
    return out;
  }

  /* Points that are not part of a line, so nothing to walk between. */
  function movePairs(text) {
    return text.replace(COORD, function (_m, a, b) {
      var q = reprojectXY(parseFloat(a), parseFloat(b));
      return (Math.round(q.x * 100) / 100) + ' ' + (Math.round(q.y * 100) / 100);
    });
  }

  /* Anything grafted in later — the administrative sheet, a window of fine
     coastline — arrives in the projection the file was drawn in. If the reader
     is looking at another one it has to be moved before it is shown, or the
     divisions of a country land somewhere the country is not. */
  function reprojectGraft(nodes) {
    if (!nodes || !nodes.length) return;
    nodes.forEach(function (n) {
      if (!n || n.nodeType !== 1) return;
      var all = [n].concat(Array.prototype.slice.call(n.querySelectorAll('*')));
      all.forEach(function (el) {
        if (el.tagName === 'path' && el.hasAttribute('d')) {
          if (el.__d0 === undefined) el.__d0 = el.getAttribute('d');
          /* Mercator is how the file was drawn, so it is the stored `d` put
             back rather than nothing at all: these nodes may have spent a
             projection change out of the document, where `reprojectDocument`
             cannot see them, and still be carrying an equal-area `d`.
             Only when it differs, though — a freshly imported node has just
             had `__d0` read off it, so for the common case (a graft arriving
             in Mercator, which is the default) this writes nothing, and the
             administrative sheet is 1,300 paths. */
          var want = projMode === 'mercator' ? el.__d0 : moveD(el.__d0);
          if (el.getAttribute('d') !== want) el.setAttribute('d', want);
        } else if (el.tagName === 'circle' && el.hasAttribute('cx')) {
          if (el.__c0 === undefined) {
            el.__c0 = [parseFloat(el.getAttribute('cx')), parseFloat(el.getAttribute('cy'))];
          }
          var q = reprojectXY(el.__c0[0], el.__c0[1]);
          el.setAttribute('cx', Math.round(q.x * 100) / 100);
          el.setAttribute('cy', Math.round(q.y * 100) / 100);
        }
        if (el.hasAttribute && el.hasAttribute('data-cx')) {
          if (el.__a0 === undefined) {
            el.__a0 = [parseFloat(el.getAttribute('data-cx')), parseFloat(el.getAttribute('data-cy'))];
          }
          var a = reprojectXY(el.__a0[0], el.__a0[1]);
          el.setAttribute('data-cx', Math.round(a.x * 100) / 100);
          el.setAttribute('data-cy', Math.round(a.y * 100) / 100);
        }
      });
    });
    bumpHi();
  }

  /* The clip rectangles that hold an edge line to a window are worked out by
     projecting two corners, and they are built during the colouring pass —
     which does not run again when the projection changes. Left alone, a
     Mercator rectangle goes on clipping in a space where it means something
     else: British India's window over Burma landed across Rajputana, and the
     stroke it kept there read as a straight line across the princely states,
     in Albers and Lambert and never in Mercator. They are refitted here. */
  function refitEdgeClips() {
    if (!hiDefs) return;
    territories().forEach(function (t) {
      if (!t.edgeClip) return;
      var want = 'edge-clip-' + t.id + '-' + projMode;
      var line = $$('#sub-outlines .edge-line[data-id="' + t.id + '"]', svg)[0];
      var cp = hiDefs.querySelector('#' + want);
      if (!cp) {
        var b = t.edgeClip;
        var a1 = project(b[0], b[1]), a2 = project(b[2], b[3]);
        cp = svgEl('clipPath', { id: want, clipPathUnits: 'userSpaceOnUse' });
        cp.appendChild(svgEl('rect', {
          x: Math.min(a1.x, a2.x), y: Math.min(a1.y, a2.y),
          width: Math.abs(a2.x - a1.x), height: Math.abs(a2.y - a1.y),
        }));
        hiDefs.appendChild(cp);
        ownedDefs.sub.push(cp);
      }
      if (line) line.setAttribute('clip-path', 'url(#' + want + ')');
    });
  }

  function reprojectDocument() {
    if (!svg) return;
    var t0 = (window.performance || Date).now();
    var moved = 0;

    $$('path[d]', svg).forEach(function (el) {
      if (el.closest('pattern')) return;
      if (el.__d0 === undefined) el.__d0 = el.getAttribute('d');
      el.setAttribute('d', projMode === 'mercator' ? el.__d0 : moveD(el.__d0));
      moved++;
    });
    $$('circle[cx]', svg).forEach(function (el) {
      if (el.closest('pattern')) return;
      if (el.__c0 === undefined) {
        el.__c0 = [parseFloat(el.getAttribute('cx')), parseFloat(el.getAttribute('cy'))];
      }
      var q = reprojectXY(el.__c0[0], el.__c0[1]);
      el.setAttribute('cx', Math.round(q.x * 100) / 100);
      el.setAttribute('cy', Math.round(q.y * 100) / 100);
      moved++;
    });
    $$('[data-cx]', svg).forEach(function (el) {
      if (el.__a0 === undefined) {
        el.__a0 = [parseFloat(el.getAttribute('data-cx')), parseFloat(el.getAttribute('data-cy'))];
      }
      var q = reprojectXY(el.__a0[0], el.__a0[1]);
      el.setAttribute('data-cx', Math.round(q.x * 100) / 100);
      el.setAttribute('data-cy', Math.round(q.y * 100) / 100);
    });
    $$('[data-hits]', svg).forEach(function (el) {
      if (el.__h0 === undefined) el.__h0 = el.getAttribute('data-hits');
      el.setAttribute('data-hits', el.__h0.split(' ').map(function (pt) {
        var c = pt.split(',');
        if (c.length !== 2) return pt;
        var q = reprojectXY(parseFloat(c[0]), parseFloat(c[1]));
        return (Math.round(q.x * 100) / 100) + ',' + (Math.round(q.y * 100) / 100);
      }).join(' '));
    });

    reframe();
    bumpHi();
    var ms = (window.performance || Date).now() - t0;
    if (window.console && console.debug) {
      console.debug('reprojected %d shapes in %d ms', moved, Math.round(ms));
    }
  }

  /* The graticule. It earns its place here more than on most maps: with three
     projections on offer, the meridians and parallels are what shows the
     reader *what the projection is doing* — straight and square in Mercator,
     fanned in the conic, curved round a centre in the azimuthal. It is also
     the honest way to show Mercator's area stretch, which is otherwise
     invisible: the ten-degree bands get taller towards the top of the sheet.

     The spacing follows the zoom, so the mesh stays about the same density on
     screen rather than becoming a fog when you go in. Lines are drawn as
     polylines through `project`, a point every degree, so they bend correctly
     in whatever is on. */
  var gratGroup = null;
  var GRAT_STEPS = [30, 20, 10, 5, 2, 1];

  function graticuleStep() {
    var span = view.w / proj.pxPerDeg;          // degrees of longitude on screen
    for (var i = 0; i < GRAT_STEPS.length; i++) {
      if (span / GRAT_STEPS[i] >= 4) return GRAT_STEPS[i];
    }
    return GRAT_STEPS[GRAT_STEPS.length - 1];
  }

  var gratLabelGroup = null;
  var gratLines = { mer: [], par: [] };   // {v, pts} per line, in map units

  /* --------------------------------------------------------- shaded relief
     Natural Earth's hillshade, laid over the political colours.

     **Under the labels and over the land.** Under the land it would be
     invisible — the country fills are opaque — and over the labels it would
     grey the words. So it goes where the graticule goes, and for the same
     reason.

     **`overlay`, not `opacity`.** The sheet's own water value is remapped at
     build time to exactly mid grey, and `overlay` leaves the colour beneath it
     *unchanged* wherever the source is mid grey. `soft-light` shares that
     neutral and was tried first; it is too gentle for this sheet, whose land
     sits close to its own water value. Measured on the Japanese Alps, the drawn
     colour moved by 4 parts in 255 under soft-light at full strength and by 5
     under overlay — neither of them a hillshade a reader can see. What fixed it
     was the sheet's own contrast: `build_relief.py --gain` pushes the land away
     from the neutral before encoding, and the sea stays at 128 whatever the
     gain because the stretch is measured from it. So the sea is not
     tinted, the land is shaded both ways, and nothing had to be masked to the
     coastline — which would have meant a path with every island in it.
     **The opacity and the blend go on the same element.** An ancestor with
     `opacity < 1` — or with `isolation: isolate` — is a blending boundary: the
     child then blends with an empty group instead of with the map, and
     `soft-light` degenerates into painting grey over everything at that
     opacity. Both were on the wrapping group first and the sea came out
     51 points darker across the whole Pacific, which is what
     `tools/test/relief.js` measures.

     **It fades as the reader zooms in**, because it is a coarse sheet: 30
     pixels to the degree against the map's own 20 units, so it is sharp at the
     opening view, level with the screen about 1.5x in, and a mosaic well
     before the 40x the map allows. `reliefFade` is the ramp and `rescale`
     calls it, which is the one place in this file that knows about zoom. */
  var reliefGroup = null, reliefImg = null, reliefFor = '';
  var reliefState = 'none';     // none | loading | ready | failed
  var reliefHave = {};          // 'mercator/finest' -> a blob URL, once fetched

  /* The switch turns the relief on and off every time; what it cannot do is
     make one and three quarter megabytes arrive instantly. The same problem
     Administrative had and the same answer — the button says so.

     Two switches to mark, because Topography has two: the button in the bar,
     which takes the spinner `#layer-seg button.busy` already draws, and the
     tick in the Layers dialog, which is the only one a phone has. */
  function setReliefBusy() {
    var b = $('#btn-topo');
    if (b) {
      b.classList.toggle('busy', reliefState === 'loading');
      b.classList.toggle('failed', reliefState === 'failed');
      b.setAttribute('aria-busy', reliefState === 'loading' ? 'true' : 'false');
      b.title = reliefState === 'loading' ? 'Loading the shaded relief…'
        : reliefState === 'failed' ? 'The relief did not load — press again to retry'
        : 'Shaded relief under the political colours. It fades out as you zoom in.';
    }
    var note = $('#relief-note');
    if (note) {
      note.textContent = reliefState === 'loading' ? 'loading…'
        : reliefState === 'failed' ? 'did not load' : '';
      note.hidden = !note.textContent;
      note.classList.toggle('bad', reliefState === 'failed');
    }
  }

  /* Fetched whole, then drawn — not handed to the `<image>` as a URL.
     
     An `<image>` given an address paints the file as it arrives, so a sheet
     this size wiped down the map a band at a time while the reader watched.
     Reading it into a blob first costs nothing but the same bytes and the map
     changes once, when there is a whole picture to change it to. Each blob is
     kept, so going back to a projection already seen is instant and silent. */
  var reliefPending = 0;
  function reliefFetch(want, src, then) {
    if (reliefHave[want]) { then(reliefHave[want]); return; }
    /* Not `if already loading, give up`. That is what this said first, and it
       meant a reader who changed projection while the first sheet was still
       coming down got the second one dropped on the floor — with `reliefFor`
       already moved on, so nothing ever asked for it again and the map simply
       had no relief. Both run; each checks on arrival whether it is still the
       one wanted, and the spinner stops when the last of them is done. */
    reliefPending++;
    reliefState = 'loading';
    setReliefBusy();
    var url = asset(src);
    if (!window.fetch) {                       // nothing to be gained; just draw
      reliefPending--; reliefState = 'ready'; setReliefBusy(); then(url); return;
    }
    var done = function () {
      reliefPending = Math.max(0, reliefPending - 1);
      if (!reliefPending && reliefState === 'loading') reliefState = 'ready';
      setReliefBusy();
    };
    window.fetch(url).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.blob();
    }).then(function (blob) {
      reliefHave[want] = URL.createObjectURL(blob);
      done();
      // the reader may have moved on while it was in the air
      if (reliefFor === want) then(reliefHave[want]);
    }).catch(function () {
      reliefPending = Math.max(0, reliefPending - 1);
      // only the sheet the reader is actually waiting for is a failure worth
      // reporting; one they have already navigated away from is not
      if (reliefFor === want) {
        reliefState = 'failed';
        reliefFor = '';                        // so pressing again retries
      } else if (!reliefPending && reliefState === 'loading') {
        reliefState = 'ready';
      }
      setReliefBusy();
    });
  }
  var RELIEF_MAX = 0.8;      // how strong it ever gets

  /* One sheet for now. The build still writes all three and the machinery to
     choose still works — `state.reliefDetail`, bits 19 and 20, and the segment
     in the Layers panel — but only this one is offered, so the choice is not
     put to a reader who has no way to know what it means. Setting this to null
     brings the other two back and is the whole of the change. */
  var RELIEF_ONLY = 'finest';

  /* Which of the three sheets, and where its images are. */
  function reliefLevel() {
    var all = (JMAP.RELIEF && JMAP.RELIEF.levels) || [];
    if (RELIEF_ONLY) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].key === RELIEF_ONLY) return all[i];
      }
    }
    return all[Math.min(all.length - 1, Math.max(0, state.reliefDetail | 0))] || null;
  }

  /* How many screen pixels one pixel of the sheet is being stretched over.
     This is the whole of the fade, and it is a **screen pixel** measurement —
     see the rule in CLAUDE.md, which this got wrong first time.

     It used to be `mapW0 / view.w`, how far the document is magnified. That is
     a fact about the drawing and pixelation is not: at the same document zoom
     a narrow phone puts *fewer* screen pixels on each pixel of the sheet than
     a wide desktop does, so the sheet is still perfectly sharp there when the
     fade has already taken it away. Which is exactly how it was reported —
     that the relief seemed to go sooner on a phone.

     One pixel of the sheet is `pxPerDeg / deg` map units across, and `k` is
     map units per screen pixel, so the ratio is the two divided. It needs no
     separate handling for the three sheets: a finer one has a bigger `deg`,
     covers less ground per pixel, and so stays sharp further in on its own. */
  function reliefStretch() {
    var L = reliefLevel();
    var c = containerSize();
    var k = c.w && view.w ? view.w / c.w : 1;      // map units per screen pixel
    if (!L || !L.deg || !proj || !proj.pxPerDeg || !k) return 1;
    return (proj.pxPerDeg / L.deg) / k;
  }

  /* Untouched until one pixel of the sheet covers this many screen pixels,
     and gone by the second. Magnified three times over, a hillshade is still
     telling the reader where the mountains are; the first two rounds of this
     took it away while it was still doing that. */
  var RELIEF_FULL = 2.8;
  var RELIEF_GONE = 6.5;

  function reliefFade() {
    if (!reliefGroup) return;
    var z = reliefStretch();
    var a = z <= RELIEF_FULL ? 1
          : z >= RELIEF_GONE ? 0
          : (RELIEF_GONE - z) / (RELIEF_GONE - RELIEF_FULL);
    if (reliefImg) reliefImg.style.opacity = String(RELIEF_MAX * a);
    // and taken out of the drawing altogether once it contributes nothing, so
    // a deep zoom is not compositing a 4200-pixel image every frame for nothing
    reliefGroup.style.display = (state.relief && a > 0.01) ? '' : 'none';
  }

  function drawRelief() {
    if (!svg) return;
    var L = reliefLevel();
    var boxes = JMAP.RELIEF && JMAP.RELIEF.boxes;
    var man = L && boxes && boxes[state.projection]
      ? { box: boxes[state.projection], src: L.src[state.projection] } : null;
    if (!state.relief || !man) {
      if (reliefGroup) reliefGroup.style.display = 'none';
      // a reader who changed their mind is not still waiting for it
      if (reliefState === 'loading') { reliefState = 'none'; reliefFor = ''; }
      setReliefBusy();
      return;
    }
    if (!reliefGroup) {
      reliefGroup = svgEl('g', { id: 'relief' });
      /* It is a picture, not a target. An `<image>` takes the pointer by
         default, and this one is laid over the whole frame and above
         `#atom-hits` — so with the layer on, every hover landed on it and
         nothing on the map lit up or could be named at all. */
      reliefGroup.style.pointerEvents = 'none';
      reliefImg = svgEl('image', { preserveAspectRatio: 'none' });
      reliefImg.style.pointerEvents = 'none';
      reliefImg.style.mixBlendMode =
        (JMAP.RELIEF && JMAP.RELIEF.blend) || 'multiply';
      reliefGroup.appendChild(reliefImg);
      svg.appendChild(reliefGroup);
    }
    // above the land, below the markers and the labels — the graticule's rule
    var before = svg.querySelector('#graticule') || svg.querySelector('#markers')
      || highlightLayer || labelLayer;
    if (before && before.parentNode === svg && reliefGroup.nextSibling !== before) {
      svg.insertBefore(reliefGroup, before);
    }
    // the projection *and* the chosen sheet: either one changes the picture
    var want = state.projection + '/' + L.key;
    if (reliefFor !== want) {
      reliefFor = want;
      reliefImg.setAttribute('x', man.box.x);
      reliefImg.setAttribute('y', man.box.y);
      reliefImg.setAttribute('width', man.box.w);
      reliefImg.setAttribute('height', man.box.h);
      /* The box goes on straight away and the picture follows. The box is the
         same shape whichever sheet is in it, so there is nothing to see until
         the bytes land — and the old sheet is cleared, or a reader switching
         projection would look at the previous one stretched over the new
         frame while the new one came down. */
      reliefImg.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      reliefImg.removeAttribute('href');
      reliefFetch(want, man.src, function (href) {
        reliefImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
        reliefImg.setAttribute('href', href);
      });
    }
    reliefFade();
  }

  /* Where the graticule sits in the stack. Over the land: a reader who turns
     it on has asked to see where the parallels run, and a mesh hidden behind
     the countries answers that question only over the sea, which is where they
     least need it. Under the markers, the highlight and the labels, so that
     turning it on cannot rub out a city dot or a selection outline — the same
     rule the mandate lines follow.

     Reasserted on every call rather than only at creation: `#markers` is
     appended during init and the graticule can be built before or after it,
     depending on whether the reader arrives with the layer already on from a
     share link. */
  function placeGratGroup() {
    var before = svg.querySelector('#markers') || highlightLayer || labelLayer;
    if (before && before.parentNode === svg) {
      if (gratGroup.nextSibling !== before) svg.insertBefore(gratGroup, before);
      if (gratLabelGroup && gratLabelGroup.nextSibling !== before) {
        svg.insertBefore(gratLabelGroup, before);
      }
    }
  }

  function drawGraticule() {
    if (!svg) return;
    if (!gratGroup) {
      gratGroup = svgEl('g', { id: 'graticule' });
      svg.appendChild(gratGroup);
      gratLabelGroup = svgEl('g', { id: 'grat-labels' });
      svg.appendChild(gratLabelGroup);
    }
    placeGratGroup();
    gratGroup.style.display = state.graticule ? '' : 'none';
    gratLabelGroup.style.display = state.graticule ? '' : 'none';
    if (!state.graticule) return;

    var step = graticuleStep();
    if (gratGroup.__step !== step || gratGroup.__mode !== projMode) {
      gratGroup.__step = step;
      gratGroup.__mode = projMode;
      gratGroup.innerHTML = '';
      gratLines = { mer: [], par: [] };

      var lonMax = proj.lonMin + mapW0 / proj.pxPerDeg;
      var latMin = (Math.atan(Math.exp((proj.yTop - mapH0) / proj.R)) - Math.PI / 4)
                   * 360 / Math.PI;
      var d = '', lon, lat, first, q, pts;

      for (lon = Math.ceil(proj.lonMin / step) * step; lon <= lonMax; lon += step) {
        first = true; pts = [];
        for (lat = latMin; lat <= proj.latMax + 1e-9; lat = Math.min(lat + 1, proj.latMax)) {
          q = project(lon, lat);
          pts.push(q);
          d += (first ? 'M' : 'L') + Math.round(q.x * 10) / 10 + ' ' + Math.round(q.y * 10) / 10;
          first = false;
          if (lat >= proj.latMax) break;
        }
        gratLines.mer.push({ v: lon, pts: pts });
      }
      for (lat = Math.ceil(latMin / step) * step; lat <= proj.latMax; lat += step) {
        first = true; pts = [];
        for (lon = proj.lonMin; lon <= lonMax + 1e-9; lon = Math.min(lon + 1, lonMax)) {
          q = project(lon, lat);
          pts.push(q);
          d += (first ? 'M' : 'L') + Math.round(q.x * 10) / 10 + ' ' + Math.round(q.y * 10) / 10;
          first = false;
          if (lon >= lonMax) break;
        }
        gratLines.par.push({ v: lat, pts: pts });
      }
      gratGroup.appendChild(svgEl('path', { 'class': 'grat-line', d: d }));
    }
    placeGratLabels();
  }

  /* A meridian or parallel is no use unnamed. The labels ride the edge of the
     window rather than the edge of the sheet — a reader who has zoomed into
     Luzon wants to know which parallel is crossing Luzon, and the sheet's own
     margin is a thousand kilometres away and off screen.

     So each line is labelled where it crosses an inset from the top of the
     view (meridians) or from the left (parallels). The crossing is found by
     walking the line's own points, which are already computed at one-degree
     steps in whatever projection is on, so this needs no inverse and bends
     with the conic and the azimuthal exactly as the line does. */
  function gratText(v, pos, neg) {
    var r = Math.round(v * 1000) / 1000;
    if (Math.abs(r) < 1e-6) return '0\u00b0';
    return Math.abs(r) + '\u00b0' + (r > 0 ? pos : neg);
  }

  /* The first point of a line that is inside the window. Both kinds are built
     south to north and west to east, so a parallel is walked forwards to reach
     it from the left and a meridian backwards to reach it from the top — the
     usual places to hang the two, and read left to right along the top and
     down the left side.

     Walking the points rather than cutting at a fixed height is what makes
     this work in all three projections: when the whole sheet fits, "the top
     edge" is the top of the drawing itself, which in the two equal-area views
     is a curve, and a horizontal cut taken above the apex of that curve
     crosses nothing at all. The home view came up with a mesh and no names on
     it while this was a cut. */
  function firstInside(pts, r, back) {
    for (var n = 0; n < pts.length; n++) {
      var p = pts[back ? pts.length - 1 - n : n];
      if (p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) return p;
    }
    return null;
  }

  function placeGratLabels() {
    if (!gratLabelGroup) return;
    var c = containerSize();
    var k = view.w / c.w;                       // map units per screen pixel
    var pad = 3 * k;
    var r = { x0: view.x + pad, x1: view.x + view.w - pad,
              y0: view.y + pad, y1: view.y + view.h - pad };
    var want = [];

    gratLines.mer.forEach(function (m) {
      var p = firstInside(m.pts, r, true);
      if (!p) return;
      want.push({ t: gratText(m.v > 180 ? m.v - 360 : m.v, 'E', 'W'),
                  x: p.x, y: p.y, anchor: 'middle', ox: 0, oy: 10 });
    });
    gratLines.par.forEach(function (q) {
      var p = firstInside(q.pts, r);
      if (!p) return;
      want.push({ t: gratText(q.v, 'N', 'S'),
                  x: p.x, y: p.y, anchor: 'start', ox: 5, oy: 0 });
    });

    // the text elements are reused: this runs on every pan, and rebuilding a
    // dozen nodes a frame is churn for nothing
    var have = gratLabelGroup.childNodes;
    while (have.length > want.length) gratLabelGroup.removeChild(gratLabelGroup.lastChild);
    while (have.length < want.length) {
      gratLabelGroup.appendChild(svgEl('text', { 'class': 'grat-label' }));
    }
    want.forEach(function (w, i) {
      var el = have[i];
      if (el.textContent !== w.t) el.textContent = w.t;
      el.setAttribute('text-anchor', w.anchor);
      // the offset is applied inside the scale, so it stays the same number of
      // screen pixels off the edge at every zoom
      el.setAttribute('transform', 'translate(' + w.x + ' ' + w.y + ') scale(' + k
        + ') translate(' + w.ox + ' ' + w.oy + ')');
    });
  }

  /* The sea and the edge of the drawing. A rectangle in Mercator, where a box
     of longitude and latitude is a box; a curved quadrilateral in anything
     else, so it is traced along the frame rather than assumed. */
  function reframe() {
    var ocean = svg.querySelector('#ocean');
    var frame = svg.querySelector('#frame');
    var lonMax = proj.lonMin + mapW0 / proj.pxPerDeg;
    var latMin = (Math.atan(Math.exp((proj.yTop - mapH0) / proj.R)) - Math.PI / 4) * 360 / Math.PI;

    if (projMode === 'mercator') {
      // still a path, so that the two projections differ in the `d` alone
      var box = 'M0 0L' + mapW0 + ' 0L' + mapW0 + ' ' + mapH0 + 'L0 ' + mapH0 + 'Z';
      [ocean, frame].forEach(function (el) { if (el) el.setAttribute('d', box); });
      mapW = mapW0; mapH = mapH0;
      svg.setAttribute('viewBox', '0 0 ' + mapW + ' ' + mapH);
      return;
    }

    var pts = [], i;
    var N = 120;
    for (i = 0; i <= N; i++) pts.push(project(proj.lonMin + (lonMax - proj.lonMin) * i / N, proj.latMax));
    for (i = 0; i <= N; i++) pts.push(project(lonMax, proj.latMax + (latMin - proj.latMax) * i / N));
    for (i = 0; i <= N; i++) pts.push(project(lonMax + (proj.lonMin - lonMax) * i / N, latMin));
    for (i = 0; i <= N; i++) pts.push(project(proj.lonMin, latMin + (proj.latMax - latMin) * i / N));
    var d = pts.map(function (q, k) {
      return (k ? 'L' : 'M') + (Math.round(q.x * 100) / 100) + ' ' + (Math.round(q.y * 100) / 100);
    }).join('') + 'Z';
    [ocean, frame].forEach(function (el) {
      if (!el) return;
      ['x', 'y', 'width', 'height'].forEach(function (a) { el.removeAttribute(a); });
      el.setAttribute('d', d);
    });
    var f = fitOf(projMode);
    mapW = f.w; mapH = f.h;
    svg.setAttribute('viewBox', '0 0 ' + mapW + ' ' + mapH);
  }

  /* The things the page holds in map coordinates rather than the document:
     where each marker sits, where each label hangs. They were all worked out
     from the file, so they move the same way it does — and from the original
     each time, not from wherever the last projection left them. */
  function replaceInProjection() {
    bumpLayout();
    var i;
    for (i = 0; i < scalables.length; i++) {
      var sc = scalables[i];
      if (sc.x0 === undefined) { sc.x0 = sc.x; sc.y0 = sc.y; }
      var a = reprojectXY(sc.x0, sc.y0);
      sc.x = a.x; sc.y = a.y;
    }
    for (i = 0; i < labels.length; i++) {
      var L = labels[i];
      if (L.x0 === undefined) { L.x0 = L.x; L.y0 = L.y; }
      var b = reprojectXY(L.x0, L.y0);
      L.x = b.x; L.y = b.y;
    }
    Object.keys(sitePos).forEach(function (k) {
      var p = sitePos[k];
      if (p.x0 === undefined) { p.x0 = p.x; p.y0 = p.y; }
      var q = reprojectXY(p.x0, p.y0);
      p.x = q.x; p.y = q.y;
    });
    if (gratGroup) { gratGroup.__step = null; gratGroup.__mode = null; }
    drawGraticule();
    // the reach that lets a reader point at a reef is held in map units, so it
    // has to be rebuilt when those units change
    rebuildFineHits();
    // annotations are held in longitude and latitude, so they are simply
    // redrawn rather than moved
    if (annApi) annApi.reproject();
    if (lastScaleW > 0) rescale();
    applyView(true);
    placeLabels();
  }

  /* One coordinate in the file, moved into whatever projection is on. */
  function reprojectXY(x, y) {
    if (projMode === 'mercator') return { x: x, y: y };
    var ll = storedLonLat(x, y);
    return project(ll.lon, ll.lat);
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
      scalables.push({ el: g, x: p.x, y: p.y, sid: s.id, cat: s.cat });
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
  var annWasLegend = false;      // where the legend stood before the panel took the rail
  var riversGroup = null;
  var indiaRiversGroup = null;
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


  /* The lifted mandate lines follow the shapes they were copied from: the same
     colour, and shown only when the mandate itself is on the map. */
  function syncMandateLines() {
    if (!mandateLiftLayer) return;
    $$('path', mandateLiftLayer).forEach(function (line) {
      var src = atomEls[line.getAttribute('data-for')];
      if (!src) { line.style.display = 'none'; return; }
      line.style.display = getComputedStyle(src).display === 'none' ? 'none' : '';
      var c = src.style.getPropertyValue('--c');
      if (c) line.style.setProperty('--c', c);
    });
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
  var gazByKey = {};              // epoch + '|' + id -> the gazetteer record

  /* The gazetteer dot that a context city's name belongs to, in the epoch on
     screen. There is one per epoch, because a place can change tier between
     1930 and 1942. */
  function gazFor(id) {
    return gazByKey[state.epoch + '|' + id];
  }
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
      ['ja', 'zh', 'ko', 'orig', 'wiki'].forEach(function (k) {
        if (!c[k] && b[k]) c[k] = b[k];
      });
      if (b.note) c.extra = b.note;
    }
    /* And the examinable sites, 52 of which are the same place under the same
       id. Names, and the note as well where the browse layer had none.

       Taking only the names was right for a battle and wrong for a city, and
       `siteById` holds only the cities — `cat: 'city'`, 56 of the 127; the
       battle markers are not in it — so what is copied here is prose about the
       place and not about an event that happened at it.

       Withholding it left **fifty-one gazetteer cities in each epoch with no
       description at all, and they were the most important fifty-one on the
       map**: Tokyo, Shanghai, Beijing, Singapore, Manila, Seoul, Hiroshima,
       Nagasaki, Rangoon, Vladivostok. A reader who pointed at a county town in
       Húnán was told what it was; a reader who pointed at Tokyo got its name
       and the word Japan. It read as descriptions going missing at random,
       which is exactly what it was, and it changed with the epoch because
       whether the site's own marker was drawn over the dot — and so whether
       the site record or the bare gazetteer one answered — depends on the
       date. */
    var s = siteById[c.id];
    if (s) {
      ['ja', 'zh', 'ko', 'orig', 'wiki'].forEach(function (k) {
        if (!c[k] && s[k]) c[k] = s[k];
      });
      if (!c.extra && s.note) c.extra = s.note;
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
        // "Capital of British India · British India" says it twice; the polity
        // is dropped when the capital line has already named it.
        var whose = (c.p && (!c.when || c.when.indexOf(c.p) < 0)) ? c.p : '';
        /* The tooltip prints `when` on a line of its own already, so `short`
           carries only what that line does not say — otherwise Tokyo came up
           as "Capital of Japan" twice, once under the other. */
        c.short = whose;
        c.note = [c.when, whose, c.extra].filter(Boolean).join(' · ');
        gazRecs.push(c);
        gazByKey[epoch + '|' + c.id] = c;
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
      var sEntry = { rec: s, el: text, x: p.x, y: p.y, dy: SITE_PX + 7,
                     size: SITE_PX, w: 0, h: SITE_PX * 1.2 };
      labels.push(sEntry);
      sEntry.sc = { el: text, x: p.x, y: p.y, sid: s.id, cat: s.cat };
      scalables.push(sEntry.sc);
    });

    /* The physical map: seas, deserts, plateaus, ranges. They belong to no
       polity and to neither epoch — the Gobi did not change hands in 1937 —
       so they carry no dot, answer no pointer and are never asked about in the
       quiz. They are lettered the way an atlas letters them, spaced out and in
       italic, and they show only when Show names is on. */
    (JMAP.FEATURES || []).forEach(function (f) {
      var physical = f.kind;              // 'sea' or 'land', from the table
      f.kind = 'feature';                 // what the label machinery sorts on
      var p = project(f.lon, f.lat);
      var text = svgEl('text', { 'class': 'flabel f-' + physical,
                                 'font-size': FEAT_PX });
      labelLayer.appendChild(text);
      var fEntry = { rec: f, el: text, x: p.x, y: p.y, dy: 0, size: FEAT_PX,
                     w: 0, h: FEAT_PX * 1.2 };
      labels.push(fEntry);
      fEntry.sc = { el: text, x: p.x, y: p.y };
      scalables.push(fEntry.sc);
    });

    (JMAP.BROWSE || []).forEach(function (b) {
      var p = sitePos[b.rid];
      var text = svgEl('text', { 'class': 'blabel', 'font-size': SITE_PX - 1.5, y: SITE_PX + 4 });
      labelLayer.appendChild(text);
      var bEntry = { rec: b, el: text, x: p.x, y: p.y, dy: SITE_PX + 4,
                     size: SITE_PX - 1.5, w: 0, h: SITE_PX * 1.1 };
      labels.push(bEntry);
      bEntry.sc = { el: text, x: p.x, y: p.y };
      scalables.push(bEntry.sc);
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
    var line = svgEl('path', { d: src.getAttribute('d'), 'class': 'edge-line',
                               'data-id': t.id });
    line.style.setProperty('--edge', t.edge);
    if (t.edgeWidth) line.style.setProperty('--edge-w', t.edgeWidth);
    if (t.edgeClip) {
      /* Keyed by projection, because the rectangle is worked out by projecting
         two corners — and it was built once and kept for ever. Under Albers or
         Lambert the map is a different space, so a rectangle computed in
         Mercator lands somewhere else entirely: British India's edge line is
         clipped to a window over Burma, and in a reprojected map that window
         fell across Rajputana, where the stroke it kept showed up as a
         straight line with nothing to do with any frontier.

         A new key means a new rectangle, worked out in the space it is going
         to be used in. It cannot change Mercator, which is where the original
         one was already right. */
      var id = 'edge-clip-' + t.id + '-' + projMode;
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
    bumpLayout();
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
      var bkEdge = backingEdges[a];
      if (bkEdge) {
        bkEdge.style.removeProperty('--c');
        bkEdge.style.display = 'none';
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
    hotProv = [];
    hotProvEl = null;
    hotParent = null;
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
        var bkEdge = backingEdges[a];
        if (bkEdge) {
          bkEdge.style.display = '';
          if (colour) bkEdge.style.setProperty('--c', colour.c);
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
        if (ring) ring.setAttribute('data-id', t.id);
        if (ring && t.outlineColor) ring.style.setProperty('--sub', t.outlineColor);
      }

      // `unseen` is a shape with nothing drawn in it: the box of open water
      // east of the Gilberts, which exists to answer the pointer and nothing
      // else. A label over it would be a name floating in empty sea.
      if (total > 0 && !t.unseen) {
        var x = mx / total, y = my / total;
        // Where the name goes, when the middle of the shapes is the wrong
        // place for it. Two kinds of record need it. A country drawn as one
        // atom with something else laid over most of it — the Republic in
        // 1942 is the whole of China with the occupation on top, so its name
        // was computed into occupied ground, collided with "Japanese-occupied"
        // and was dropped; it belongs in the west, over the part that was
        // still Chungking's. And a country that is a scatter of enclaves —
        // French India is five of them from Mahé to Chandernagore, and the
        // mean of five specks two thousand kilometres apart is a point in the
        // Deccan belonging to none of them.
        if (t.labelAt) {
          var ll = String(t.labelAt).split(',');
          var pt = project(parseFloat(ll[0]), parseFloat(ll[1]));
          if (isFinite(pt.x) && isFinite(pt.y)) { x = pt.x; y = pt.y; }
        }
        /* A division of a country is named like a division. Suiyuan, Chahar,
           Jehol and Sinkiang are territories in this file because they were
           governed apart, and that made them *look* like countries: the same
           weight and the same size as China itself, set beside it. They are
           smaller and lighter now, which is what they were. */
        var px = t.sub ? TERR_PX * 0.82 : TERR_PX;
        var text = svgEl('text', {
          'class': 'tlabel' + (t.sub ? ' sub' : ''), 'font-size': px });
        labelLayer.appendChild(text);
        var entry = { rec: t, el: text, x: x, y: y, dy: 0, size: px, w: 0, h: px * 1.2 };
        labels.push(entry);
        entry.sc = { el: text, x: x, y: y };
        scalables.push(entry.sc);
      }
    });

    // Marked once per epoch, because which territory holds an atom is an
    // epoch's answer and `data-id` has only just been written. It is what
    // keeps Labuan dark when North Borneo lights: the atom's `.hot` is a
    // filter on the whole group and no child can opt out of a filter above
    // it, so styles.css gives this one a filter that undoes it exactly.
    $$('#land [data-cluster]', svg).forEach(function (el) {
      el.classList.toggle('foreign-sub', foreignSub(el));
    });

    var rank = { territory: 0, feature: 1, site: 2, browse: 3 };
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
        var paths = el.tagName === 'path' ? [el]
          : $$('path:not(.superseded):not(.fine)', el);
        // An atom whose divisions are still in the administrative file is an
        // empty group, and what the reader sees is its backing. Kengtung is
        // one, so its Thai stripes were drawn only when the Administrative
        // layer happened to be on — which is a question about districts and
        // has nothing to do with whose troops were in the country.
        if (!paths.length && backingEls[a]) paths = [backingEls[a]];
        paths.forEach(function (path) {
          var d = path.getAttribute('d');
          if (!d) return;
          // tagged with the territory, so a rule that takes a country off the
          // map can take its shading with it: a hatch is a *copy* of the
          // atom's path in another layer, so hiding the atom left the stripes
          // behind, drawn over open sea
          var attrs = { 'class': cls, d: d, 'data-id': t.id };
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
  /* Whether the frame that is queued has a zoom in it. It has to live here and
     not in the closure of whichever `applyView` happened to book the frame:
     the second call in a frame cannot reach into the first one's variables, so
     a pan that booked the frame and a zoom that arrived before it ran meant
     the zoom's `rescale()` was dropped — and because `lastScaleW` had already
     moved on, every later pan agreed there was nothing to do. Measured: a drag
     and a wheel tick in one frame left the city dots and the hatching at 62%
     too large, and panning afterwards never put them right. */
  var rafZoomed = false;

  /* Three answers that do not change while the reader is dragging, and that
     were being worked out afresh on every frame of the drag.

     `applyView` runs once a frame and asks `defaultView` how far in the reader
     has come. `defaultView` asks `containerSize`, which reads the container's
     rectangle, and `activeBounds`, which calls `getBBox` on **every atom on
     the map**. Both force the browser to lay the document out synchronously,
     in the middle of a pointer handler, once a frame — and the answer is the
     same every time, because none of what it depends on can change during a
     drag.

     Measured on India at 6x CPU throttle over a four-second pan and zoom:
     `getBoundingClientRect` under `containerSize` under `defaultView` was
     **74 ms with the Administrative layer off and 96 ms with it on**, the
     largest single entry in the profile, with `activeBounds`'s `getBBox` a
     further 11–13 ms. It is the same shape of fault as the tooltip's, which
     cost 99 ms and was fixed the same way: do the read when the answer
     changes, not when it is wanted.

     `bumpLayout` is called wherever the answer *can* change — a resize, a
     change of state, a new epoch, a reprojection, and each of the two grafts
     that put more geometry on the map. */
  var layoutGen = 0;
  var sizeCache = null;
  var homeCache = null;

  function bumpLayout() {
    layoutGen++;
    sizeCache = null;
    homeCache = null;
  }

  function containerSize() {
    if (sizeCache) return sizeCache;
    var r = container.getBoundingClientRect();
    sizeCache = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    return sizeCache;
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
    /* What is *drawn*, not what exists. With the map cut back to East Asia the
       Pacific is empty, and a frame that still reached the Marshalls opened on
       two thirds ocean — the reader asked for a closer look and got the same
       view with most of it blank. A hidden atom has no business setting the
       edge of the frame. */
    Object.keys(atomEls).forEach(function (a) {
      var el = atomEls[a];
      if (!el.getAttribute('data-id')) return;
      if (el.style.display === 'none') return;
      try {
        var bb = el.getBBox();
        if (bb.width || bb.height) grow(bb.x, bb.y, bb.x + bb.width, bb.y + bb.height);
      } catch (err) { /* not laid out yet */ }
    });
    JMAP.SITES.forEach(function (s) {
      if (!siteVisible(s)) return;
      var rec = byId[s.id];
      if (!state.world && rec && rec.of && !EAST_ASIA[rec.of]) return;
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

  /* --------------------------------------------------- shareable links -- */

  /* A link carries what is on the screen and what is switched on: no more, and
   * in as few characters as will hold it.
   *
   *   ?bbox=120.9,24.5,122.3,25.68&layers=3j
   *
   * The box is the ground the sharer could see, in degrees. It is not the
   * viewport — those differ by phone and by window, and asking for the same
   * viewport on a different screen gives a different piece of the world. The
   * box is *contained*: whoever opens the link sees at least everything the
   * sharer saw, and on a differently-shaped screen a margin of sea besides.
   *
   * The layers are one base-36 number, so two characters today and never more
   * than three — ten bits is 1,023, and three base-36 digits hold 46,655. The
   * bits, lowest first:
   *
   *   0  the year is Dec 1942 (clear: 1930)
   *   1  cities            4  place names        7  provinces from the
   *   2  events            5  line of control       Republic's 1947 set
   *   3  administrative    6  rivers                (clear: period sources)
   *   8,9  detail level, 1 to 3, stored one less
   *   10  hairline    11  the NCA reading    12  resistance base areas
   *   13  the filler under each country
   *   14  the rivers of India
   *   15,16  projection: 0 Web Mercator, 1 Albers conic, 2 Lambert azimuthal
   *   17  the graticule    18  shaded relief   19,20  which relief sheet
   *   22  local names inside the empire (stored inverted; on is the default)
   *
   * Bits 7 and 10 no longer have a switch in the Layers panel — the province
   * source came out once the period sheet was redrawn, and the hairline came
   * out with the rest of the panel's explanatory weight. Both still work from
   * an address, so an old link still means what it meant.
   *
   * The opening state is not zero — the line of control and the rivers start
   * on — so the code is always written rather than dropped when it looks like
   * a default. Bits that read backwards to save two characters in the address
   * bar would not be worth the next person's confusion.
   */
  var LAYER_FLAGS = [
    function () { return state.epoch !== JMAP.DEFAULT_EPOCH; },
    function () { return !!state.cats.city; },
    function () { return !!state.cats.battle; },
    function () { return !!state.cats.territory; },
    function () { return !!state.labels; },
    function () { return !!state.extent; },
    function () { return !!state.rivers; },
    function () { return provSource === 'roc'; },
  ];

  function layerCode() {
    var bits = 0;
    LAYER_FLAGS.forEach(function (on, i) { if (on()) bits |= (1 << i); });
    bits |= ((Math.min(3, Math.max(1, state.level)) - 1) & 3) << 8;
    // bit 10, not 8: the level has 8 and 9, and LAYER_FLAGS is indexed by bit
    if (state.hairline) bits |= 1024;
    if (state.occSource === 'nca') bits |= 2048;
    // A third reading — none at all — needs a second bit, and it is read
    // first, so a link written before this one existed still says what it
    // meant. The two client states and the base areas go the same way round
    // as `ccp` below and for the same reason: they start on.
    if (state.occSource === 'none') bits |= 262144;
    if (!state.manchukuo) bits |= 524288;
    if (!state.mengjiang) bits |= 1048576;
    if (state.mono) bits |= 2097152;
    if (!state.world) bits |= 4194304;      // inverted: the whole map is the default
    // Bit 4096 means the base areas are OFF, not on. It is the one layer here
    // that starts switched on, and a bitfield cannot tell "the sender had it
    // off" from "the sender's build had no such bit": every link made before
    // this bit existed carries a zero there, and read the obvious way round
    // that turned the base areas off for anybody following an older link.
    // Inverted, an absent bit means the default, which is what an old link
    // should mean.
    if (!state.ccp) bits |= 4096;
    if (state.backs) bits |= 8192;
    if (state.indiaRivers) bits |= 16384;
    bits |= ({ albers: 1, laea: 2 }[state.projection] || 0) << 15;
    if (state.graticule) bits |= 131072;
    if (state.relief) bits |= 262144;
    bits |= (state.reliefDetail & 3) << 19;
    if (!state.jpNames) bits |= 4194304;    // inverted; see the note above
    return bits.toString(36);
  }

  function applyLayerCode(code) {
    var bits = parseInt(code, 36);
    if (!isFinite(bits) || bits < 0) return;
    var epochs = JMAP.EPOCHS ? JMAP.EPOCHS.map(function (e) { return e.id; }) : [];
    var other = epochs.filter(function (id) { return id !== JMAP.DEFAULT_EPOCH; })[0];
    if ((bits & 1) && other) state.epoch = other;
    state.cats.city = !!(bits & 2);
    state.cats.battle = !!(bits & 4);
    state.cats.territory = !!(bits & 8);
    state.labels = !!(bits & 16);
    state.extent = !!(bits & 32);
    state.rivers = !!(bits & 64);
    // 1 to 3. The two bits can say 4 and nothing else can: the buttons offer
    // three, `layerCode` writes three, and a saved state is only accepted at
    // three — so a hand-edited link asking for 4 used to run at a level with
    // no button lit and an address bar that disagreed with the map.
    state.level = Math.min(3, ((bits >> 8) & 3) + 1);
    state.hairline = !!(bits & 1024);
    state.occSource = (bits & 262144) ? 'none' : ((bits & 2048) ? 'nca' : 'traced');
    state.manchukuo = !(bits & 524288);
    state.mengjiang = !(bits & 1048576);
    state.mono = !!(bits & 2097152);
    state.world = !(bits & 4194304);
    state.ccp = !(bits & 4096);          // inverted; see layerCode
    state.backs = !!(bits & 8192);
    state.indiaRivers = !!(bits & 16384);
    state.projection = ['mercator', 'albers', 'laea'][(bits >> 15) & 3] || 'mercator';
    state.graticule = !!(bits & 131072);
    state.relief = !!(bits & 262144);
    state.reliefDetail = Math.min(2, (bits >> 19) & 3);
    state.jpNames = !(bits & 4194304);
    urlProvSource = (bits & 128) ? 'roc' : 'enp';
  }

  var urlProvSource = null;      // applied once the administrative file is in

  /* Longitude in the map's own frame, running east from `lonMin` and never
     wrapped. `project` wraps — anything west of `lonMin` is taken to mean the
     same meridian a turn later, which is right for placing a country and wrong
     here: the opening view overhangs the drawing's western edge by a few
     degrees, and wrapping those put the box's west edge out past its east.
     Unwrapped, an east coordinate can read 201.8 rather than -158.2. It is the
     same meridian and it round-trips, which -158.2 did not. */
  function xForLon(lon) { return (lon - proj.lonMin) * proj.pxPerDeg; }

  /* A point on screen, as longitude and latitude. Mercator inverts in closed
     form; the azimuthal one is solved rather than inverted, which is three
     lines and runs only when the reader asks where they are. */
  function unproject(x, y) {
    if (projMode === 'mercator') {
      return {
        lon: proj.lonMin + x / proj.pxPerDeg,
        lat: (Math.atan(Math.exp((proj.yTop - y) / proj.R)) - Math.PI / 4) * 360 / Math.PI,
      };
    }
    var f = fitOf(projMode);
    return rawInv(projMode, x - f.dx, f.dy - y);
  }

  /* West, south, east, north, to two decimal places. The link says roughly
     where to look, and two places is finer than "roughly" needs: the map is
     140 degrees wide and MAX_ZOOM is 100, so the closest the reader can get is
     a view 1.4 degrees across, and a hundredth of a degree is 0.7% of that —
     about six pixels on a phone, and half that as a placement error once it is
     rounded rather than truncated. Anything finer is decimal places nobody can
     see, in a URL somebody has to paste. */
  function viewBox() {
    var a = unproject(view.x, view.y);                       // north-west
    var b = unproject(view.x + view.w, view.y + view.h);     // south-east
    var r = function (v) { return Math.round(v * 100) / 100; };
    return [r(a.lon), r(b.lat), r(b.lon), r(a.lat)];
  }

  /* The view that contains a box, whatever shape the window is.

     In Mercator x is a function of longitude alone and y of latitude alone, so
     the two edges give the box and there is nothing to walk. That is not true
     of either equal-area projection: a parallel bows and a meridian leans, so
     the corners no longer bound the shape and `xForLon` — which knows only
     about the cylinder — is meaningless. The other two walk the four edges
     instead and take the extremes of what comes back.

     This is what a share link is read through, so it is worth being plain
     about what was wrong: a link written while an equal-area view was on
     recorded the right longitudes and latitudes, and reading it back put the
     reader somewhere else entirely. A Korean view came back at 72°N. */
  function viewForBox(w, s, e, n) {
    var x0, x1, y0, y1;
    if (projMode === 'mercator') {
      var ax = xForLon(w), zx = xForLon(e);
      // a box written the other way round, as one crossing the date line would
      // be if it were ever normalised, is still meant to be read west to east
      if (zx < ax) zx += 360 * proj.pxPerDeg;
      var a = project(0, n), z = project(0, s);
      x0 = Math.min(ax, zx); x1 = Math.max(ax, zx);
      y0 = Math.min(a.y, z.y); y1 = Math.max(a.y, z.y);
    } else {
      var e2 = e < w ? e + 360 : e;
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      var eat = function (p) {
        if (!p) return;
        if (p.x < x0) x0 = p.x;
        if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y;
        if (p.y > y1) y1 = p.y;
      };
      // 24 steps: the widest box the map can be asked for is the whole sheet,
      // 140 degrees across, so this samples every six degrees, and the bow of
      // a parallel over six degrees is far under a pixel
      for (var i = 0; i <= 24; i++) {
        var f = i / 24;
        var lon = w + (e2 - w) * f, lat = s + (n - s) * f;
        eat(project(lon, s)); eat(project(lon, n));
        eat(project(w, lat)); eat(project(e2, lat));
      }
      if (!isFinite(x0) || !isFinite(y0)) return null;
    }
    if (!(x1 > x0) || !(y1 > y0)) return null;
    var c = containerSize();
    var aspect = c.w / c.h;
    var vw = Math.min(Math.max(x1 - x0, (y1 - y0) * aspect), fitView().w);
    var vh = vw / aspect;
    return clampView({ x: (x0 + x1) / 2 - vw / 2, y: (y0 + y1) / 2 - vh / 2,
                       w: vw, h: vh });
  }

  /* Written with replaceState and on a timer: applyView runs on every frame of
     a pan, and a history entry per frame would make the back button useless
     and the address bar flicker. */
  var urlTimer = 0;
  function scheduleUrl() {
    if (!proj || !view) return;
    if (urlTimer) window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(writeUrl, 400);
  }

  /* Built by hand rather than with URLSearchParams, for the separator's sake.
     The form-urlencoded serialiser that `URLSearchParams.toString` uses keeps
     only letters, digits and `* - . _`; a comma comes back as %2C and the
     address bar fills up with it. A comma is perfectly legal in a query string
     — every map URL uses one — and a hand-built query keeps it. Anything else
     already in the query is put back through URLSearchParams as before, since
     none of it is ours to reformat. */
  function writeUrl() {
    urlTimer = 0;
    if (!proj || !view || !window.history || !history.replaceState) return;
    try {
      var rest = [];
      new URLSearchParams(window.location.search).forEach(function (v, k) {
        if (k !== 'bbox' && k !== 'layers' && k !== 'mono') {
          rest.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
      });
      if (state.mono && state.monoColour && HEX.test(state.monoColour)) {
        rest.unshift('mono=' + state.monoColour.slice(1));
      }
      var q = ['bbox=' + viewBox().join(','), 'layers=' + layerCode()].concat(rest);
      history.replaceState(null, '',
        window.location.pathname + '?' + q.join('&') + window.location.hash);
    } catch (err) { /* older browser; the map does not depend on this */ }
  }

  /* Read once, before anything is composed, so the layers are right the first
     time the map is drawn rather than switched on in front of the reader. */
  function readUrl() {
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (err) { return null; }
    var code = q.get('layers');
    if (code) applyLayerCode(code);
    var mc = q.get('mono');
    if (mc && HEX.test('#' + mc)) state.monoColour = '#' + mc;
    var raw = q.get('bbox');
    if (!raw) return null;
    // A comma is never a minus sign, so the box comes apart on commas and a
    // negative latitude needs no thinking about. Hyphens are read too, for the
    // few links written while that was the separator: a separator hyphen is
    // the one with a digit in front of it, a minus sign never has one, so
    // `61.803--32.9547-201.803-68.7139` still comes apart correctly. Written
    // as a replace and not a lookbehind, which Safari only learned in 16.4.
    var n = raw.replace(/(\d)-/g, '$1,').split(',').map(Number);
    if (n.length !== 4 || n.some(function (v) { return !isFinite(v); })) return null;
    return n;
  }

  /* The opening view. A landscape screen is close enough in shape to the map
   * to frame everything in play. A phone held upright is not: fitting the
   * whole Pacific into a tall, narrow window leaves a postage stamp adrift in
   * empty sea, so there we fill the height and open on the empire's core
   * instead, and leave the rest to panning. */
  /* A fresh object every time, and the cache keeps its own. Four callers do
     `view = defaultView()`, so handing back the cached object would make the
     cache *be* the live view: every pan and zoom would then mutate what the
     map believes its opening view is. It did, and the symptom was the reset
     button — three notches in, it still called itself idle and did nothing,
     because `home.w` had followed `view.w` down. */
  function defaultView() {
    if (!homeCache || homeCache.gen !== layoutGen) {
      homeCache = { gen: layoutGen, v: computeDefaultView() };
    }
    var v = homeCache.v;
    return { x: v.x, y: v.y, w: v.w, h: v.h };
  }

  function computeDefaultView() {
    var c = containerSize();
    var aspect = c.w / c.h;
    var b = activeBounds();
    var bw = (b.x1 - b.x0) * 1.06;
    var bh = (b.y1 - b.y0) * 1.06;

    // A stage far narrower than the content wastes its height on sea; a stage
    // far wider wastes its width on the same. Either way, open on the empire
    // rather than on the whole hemisphere.
    /* A stage far narrower or wider than the content opens on the empire
       rather than on the whole hemisphere — except when the reader has already
       said which part of the world they want. Cropping *again* on top of that
       is answering a question they have just answered: on a phone the East
       Asia frame came out at 209% of the view, which is to say China ran off
       both sides of a map the reader had asked to be smaller. */
    var cropToHome = state.world
      && (aspect < (bw / bh) / 1.7 || aspect > (bw / bh) * 1.2);
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

  /* And the same magnification on every screen. The limit above is a view
     *width* in map units, which is the same number of degrees whatever the
     screen is — so the deepest view puts 28 units across a 1,200-pixel desktop
     and the same 28 units across a 390-pixel phone, and the phone stops three
     times further out with every island three times smaller. On a map whose
     point is islands a few hundred metres across, that is the wrong screen to
     be stingy with. The floor is the scale instead: a minimum number of map
     units per CSS pixel, taken from what a desktop already reached, so a phone
     now goes on to the same magnification and simply sees less ground at it.

     The reference width is a constant rather than the container's, so the
     limit does not move when the window is resized. */
  var ZOOM_REF_PX = 1200;

  function minViewW() {
    // mapW is read off the SVG, so this is worked out when it is asked for and
    // not when the file is parsed — computed at load time it was zero, and a
    // floor of zero is no floor at all.
    return (mapW / MAX_ZOOM) / ZOOM_REF_PX * containerSize().w;
  }

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
    var minW = Math.min(minViewW(), maxW);
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
    scheduleUrl();
    var home = defaultView();
    // Once the islands are worth looking at rather than merely locating, drop
    // the rings. Measured against the opening view and not against the map's
    // full width: a phone opens cropped to the empire and a wide desktop opens
    // on the whole hemisphere, and "how far in has the reader come" is the
    // question, not "how much of the world fits".
    //
    // The rings are for the reader who has not gone looking yet — zoomed out,
    // or barely in. It was 1.6x the opening view, half a turn of the wheel,
    // and that was too soon: the ring went while the island under it was still
    // a speck, so the reader lost the mark and gained nothing to aim at. At
    // 3.2x the Gilberts and the Carolines are shapes before their rings go.
    svg.classList.toggle('zoomed-in', view.w < home.w / 3.2);
    // it resets the view, so at the opening view there is nothing for it to do
    // and it looked like a dead button; say so instead
    var rst = $('#zoom-reset');
    if (rst) {
      var atHome = Math.abs(view.w - home.w) < 0.5;
      rst.classList.toggle('idle', atHome);
      rst.setAttribute('aria-disabled', atHome ? 'true' : 'false');
    }
    if (state.graticule) drawGraticule();
    // the picture is `applyState`'s business; this is only the zoom ramp
    reliefFade();
    if (force || Math.abs(view.w - lastScaleW) > 0.01) {
      lastScaleW = view.w;
      rafZoomed = true;
    }
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        var zoomed = rafZoomed;
        rafZoomed = false;
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
    { id: 'hatch-unclear', rot: 0 },
    { id: 'hatch-raid', rot: 45 },
    { id: 'hatch-ccp', rot: -45 },
  ];
  var hatchPatterns = null;
  var lastTap = null;

  /* Space held down means "pan", whatever else is going on.
     
     With a drawing tool out every press belongs to the tool, which is right —
     but it leaves a reader who wants to move the map having to put the tool
     away and take it out again. Every drawing program answers this the same
     way and readers arrive knowing it: hold the space bar and the pointer is a
     hand until it is let go. */
  var spaceHeld = false;
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

  /* An event that happened in a city sits on exactly the same point as the
     city: the atomic bombs on Hiroshima and Nagasaki, the battle of Shanghai
     on Shanghai, the siege on Qingdao. The diamond then covers the dot and
     neither can be read or hit, and the two carry different things to say.
     The event is nudged a few pixels clear of the city, which keeps the city
     on its true coordinate. The nudge is written after the scale in the
     marker's own transform, so it is a fixed distance on screen at every zoom
     rather than a distance on the ground that opens up as you go in. Its label
     carries the same nudge, so the name stays under its own marker. */
  var MARK_NUDGE = 7.5;

  function nudgeOverlaps() {
    var at = {};
    scalables.forEach(function (s) {
      if (!s.sid) return;
      var k = Math.round(s.x * 4) + ',' + Math.round(s.y * 4);
      (at[k] = at[k] || []).push(s);
    });
    Object.keys(at).forEach(function (k) {
      var group = at[k];
      var cat = {};
      group.forEach(function (s) { cat[s.sid] = s.cat; });
      var ids = Object.keys(cat);
      var events = ids.filter(function (i) { return cat[i] === 'battle'; });
      // nothing to separate unless an event shares the spot with something else
      if (!events.length || events.length === ids.length) return;
      events.forEach(function (id, i) {
        var a = -Math.PI / 4 - i * (Math.PI / 2.5);
        var dx = Math.cos(a) * MARK_NUDGE, dy = Math.sin(a) * MARK_NUDGE;
        group.forEach(function (s) {
          if (s.sid === id) { s.ox = dx; s.oy = dy; }
        });
      });
    });
  }

  /* An island's name is drawn from the middle of the island, and the text sits
     above that point — so on anything small the name lies across the island,
     with a white halo three and a half pixels wide under it. The island is
     then a few pixels of coastline showing round the edge of its own label,
     and a reader trying to tap it taps the sea. Below about four dozen pixels
     of island the name is moved clear, under the shape rather than over it;
     above that there is room for it and it stays where a map puts a name. The
     offset is in screen pixels and has to be recomputed as the zoom changes,
     which is exactly when rescale runs. */
  var SMALL_ISLE_PX = 46;

  function isleOffset(L, k) {
    if (!L || !L.half) return 0;
    var hpx = (L.half * 2) / k;
    return hpx < SMALL_ISLE_PX ? hpx / 2 + L.h * 0.9 : 0;
  }

  /* One scalable, put where it belongs at the current zoom.
   *
   * `translate(x y)` is in map units — where the thing is on the map.
   * `scale(k)` makes what follows a screen-pixel space, so `ox`/`oy` and
   * `nx`/`ny` are both in **screen pixels**, which is what they have to be:
   * `oy` is half an island's height on screen, and `nx`/`ny` come out of
   * `placeLabels`, which works entirely in screen pixels. See the map-units
   * note in CLAUDE.md — this is the same trap as the blur and the arrowhead.
   *
   * `ox`/`oy` are the offset the map gives a name (an islet's name lifted off
   * the islet). `nx`/`ny` are the nudge `placeLabels` applies on top to clear
   * a collision. They are added rather than one overwriting the other,
   * because a small island's name can need both. */
  function placeScalable(s, k) {
    var ox = (s.ox || 0) + (s.nx || 0);
    var oy = (s.oy || 0) + (s.ny || 0);
    var t = 'translate(' + s.x + ' ' + s.y + ') scale(' + k + ')';
    if (ox || oy) t += ' translate(' + ox + ' ' + oy + ')';
    s.el.setAttribute('transform', t);
  }

  function rescale() {
    var c = containerSize();
    var k = view.w / c.w;                       // SVG units per screen pixel
    for (var i = 0; i < scalables.length; i++) {
      var s = scalables[i];
      if (s.label) {
        s.oy = isleOffset(s.label, k);
        s.label.dy = s.oy;
      }
      placeScalable(s, k);
    }
    /* `k` is SVG units per screen pixel, and anything a reader's own marks draw
       in *screen* terms needs it. A filter's deviation is the case: it is in
       user units, so left alone it grows with the zoom until the shape it
       softens is a cloud across the map. */
    if (annApi && annApi.rescaled) annApi.rescaled(k);
    reliefFade();
    // the way-back button appears once the reader has moved off the frame the
    // annotations were meant to be seen from
    if (annApi && annApi.viewMoved) annApi.viewMoved();
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
  /* Provinces and islands are named only when the reader has come close
     enough for the name to mean something. At the opening view there are two
     thousand of them and they would be a grey mat; twelve times in, the map is
     showing one country and the divisions inside it are what the reader is
     looking at.

     The Administrative layer is not consulted. That switch is about drawing
     the *boundaries*, and a reader who has zoomed into Kwangtung wants to know
     it is Kwangtung whether or not there is a line round it. The geometry is
     fetched if it is not already here, which is all the switch was ever
     guarding; nothing is stroked, because nothing asks for `.subs`. */
  var SUB_LABEL_ZOOM = 12;
  var subLabels = [];
  var subLabelled = null;

  function subLabelsWanted() {
    return state.labels && state.mode !== 'quiz'
      && view.w < mapW / SUB_LABEL_ZOOM;
  }

  /* A sub-unit's name, from data.js where there is a record and off the shape
     where there is not — the fine coastlines carry theirs, there being a
     couple of hundred and no reason to ship them to a reader who never zooms.
     The gloss after an em dash is for the card, not for the map. */
  function subRec(el, key) {
    var rec = JMAP.PROVINCES && JMAP.PROVINCES[key];
    var en = (rec && rec.en) || key;
    var cut = en.indexOf(' — ');
    return {
      kind: 'sub',
      en: cut > 0 ? en.slice(0, cut) : en,
      ja: (rec && rec.ja) || el.getAttribute('data-ja') || '',
      zh: (rec && rec.zh) || el.getAttribute('data-zh') || '',
      ko: (rec && rec.ko) || '',
    };
  }

  function ensureSubLabels() {
    if (!subLabelsWanted()) return;
    // the divisions live in a second file until something asks for them, and
    // wanting to read their names is asking
    if (adminState !== 'ready' && adminState !== 'loading') loadAdmin();
    if (!subLabelled) subLabelled = new WeakSet();
    var made = 0;
    /* A district whose prefecture is named does not write its own name.
     *
     * Taiwan is fifty 郡 and 市 inside eight 州 and 廳, and writing fifty names
     * across an island that is fifty pixels wide at the opening view is not a
     * map, it is a smudge — the placer would drop most of them anyway and the
     * ones that survived would be an arbitrary handful. The eight prefectures
     * are the level worth writing, so one name goes on each group and the
     * districts keep their tooltips and their cards.
     *
     * Collected first, and made below: a group's name goes in the middle of
     * the whole group and not on whichever district happened to come first. */
    var groups = {};
    $$('#land [data-prov]', svg).forEach(function (el) {
      if (subLabelled.has(el)) return;
      subLabelled.add(el);
      var key = el.getAttribute('data-prov');
      if (!key) return;
      var parent = el.getAttribute('data-parent');
      if (parent) {
        (groups[parent] = groups[parent] || []).push(el);
        return;
      }
      var x = parseFloat(el.getAttribute('data-cx'));
      var y = parseFloat(el.getAttribute('data-cy'));
      var half = 0, area = Infinity;
      if (!isFinite(x) || !isFinite(y)) {
        // Not everything wearing data-prov is a division. The occupied zone
        // names its own blocks that way — "North China and the Yangtze
        // valley", "The Canton delta" — and they are one shading in several
        // pieces, so labelling each piece would write the same phrase across
        // half of China. The fine coastlines are the other kind: real islands,
        // named on the shape itself, drawn from a source that carries no
        // centroid. Those are wanted, and there are few enough of them, and
        // they are only ever in the document at deep zoom, so the browser can
        // be asked for a box.
        if (!el.getAttribute('data-ja') && !el.getAttribute('data-group')) return;
        var bb;
        try { bb = el.getBBox(); } catch (err) { return; }
        if (!bb || !bb.width) return;
        x = bb.x + bb.width / 2;
        y = bb.y + bb.height / 2;
        // half the island's own height, kept so the name can be moved off it
        // when the island is small — see isleOffset
        half = bb.height / 2;
        area = bb.width * bb.height;
      }
      var text = svgEl('text', { 'class': 'tlabel sublabel', 'font-size': SUB_PX });
      labelLayer.appendChild(text);
      var entry = { rec: subRec(el, key), el: text, x: x, y: y, dy: 0,
                    size: SUB_PX, w: 0, h: SUB_PX * 1.2, half: half, key: key,
                    area: area,
                    owner: el, atom: el.closest ? el.closest('.atom') : null };
      labels.push(entry);
      subLabels.push(entry);
      var sc = { el: text, x: x, y: y };
      entry.sc = sc;
      if (half) sc.label = entry;
      scalables.push(sc);
      made++;
    });

    // one name per prefecture, in the middle of the ground it covers
    Object.keys(groups).forEach(function (pkey) {
      var els = groups[pkey];
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, got = 0;
      els.forEach(function (el) {
        var bb;
        try { bb = el.getBBox(); } catch (err) { return; }
        if (!bb || !bb.width) return;
        got++;
        x0 = Math.min(x0, bb.x); y0 = Math.min(y0, bb.y);
        x1 = Math.max(x1, bb.x + bb.width); y1 = Math.max(y1, bb.y + bb.height);
      });
      if (!got) return;
      var text = svgEl('text', { 'class': 'tlabel sublabel', 'font-size': SUB_PX });
      labelLayer.appendChild(text);
      var entry = { rec: subRec(els[0], pkey), el: text,
                    x: (x0 + x1) / 2, y: (y0 + y1) / 2, dy: 0,
                    size: SUB_PX, w: 0, h: SUB_PX * 1.2, half: 0, key: pkey,
                    area: Infinity,
                    owner: els[0], atom: els[0].closest ? els[0].closest('.atom') : null };
      labels.push(entry);
      subLabels.push(entry);
      entry.sc = { el: text, x: entry.x, y: entry.y };
      scalables.push(entry.sc);
      made++;
    });

    /* Country names first, then divisions, then the rest: a province must
       never crowd out the country it is in.

       Within the divisions, the largest shape first. `placeLabels` is greedy
       and first-come-first-served, so whatever this order is decides which
       names survive a crowd — and it used to be the order the shapes happened
       to be grafted in. In the western Solomons that put 183 islands on screen
       and gave 84 of them names, of which 48 were islands under 100 square
       pixels and ten were four pixels or less, while **Santa Isabel and
       Choiseul, the two largest things in the frame at 175,000 and 111,000
       square pixels, got no name at all**: a one-pixel islet had taken the
       space first because it came first in the file.

       A division measured from `data-cx` has no box — asking the browser for
       thirteen hundred of them is a layout flush the fine coastlines do not
       cost — so it sorts as `Infinity` and keeps its place ahead of the
       islets, which is what the rank above already intends. Sorting is stable,
       so divisions keep their document order among themselves. */
    if (made) {
      var rank = { territory: 0, feature: 1, sub: 2, site: 3, browse: 4 };
      labels.sort(function (a, b) {
        var d = (rank[a.rec.kind] || 2) - (rank[b.rec.kind] || 2);
        if (d) return d;
        return (b.area || 0) - (a.area || 0);
      });
      rescale();
    }
  }

  function gateLabels() {
    ensureSubLabels();
    var showLabels = state.labels && state.mode !== 'quiz';
    var measure = [];
    /* An island can be named twice: once by the base map, from the centroid
       written into its shape, and again by the fine coastline layer, off the
       ring it grafts in. The two used to land on top of each other and the
       collision test dropped one of them — so it was never seen, and it was
       never fixed either. Moving the fine layer's name clear of the island it
       belongs to separated them, and Pagan and Agrihan were each written out
       twice. Where a fine ring is in the document, its name is the one to
       keep: it is drawn from the accurate shape and it is the one that has
       been placed to be read. */
    var doubled = null;
    for (var i = 0; i < subLabels.length; i++) {
      var F = subLabels[i];
      if (!F.half || !F.key || !F.owner || !F.owner.isConnected) continue;
      (doubled = doubled || {})[F.key] = true;
    }
    labels.forEach(function (L) {
      if (doubled && L.key && !L.half && doubled[L.key]) {
        L.el.textContent = '';
        L.el.style.display = 'none';
        L.w = 0;
        return;
      }
      // A division's name belongs to a shape, and the shape can go: the atom
      // is not drawn in this epoch, or the alternative province source has
      // replaced it. Read off the inline style rather than the computed one —
      // this runs over every label on every zoom.
      var gone = L.owner
        && (!L.owner.isConnected
            || (L.atom && L.atom.style.display === 'none'));
      if (gone || !(showLabels && labelVisible(L.rec))) {
        L.el.textContent = '';
        L.el.style.display = 'none';
        L.w = 0;
        return;
      }
      var text = mapLabel(L.rec);
      if (!text) { L.el.textContent = ''; L.el.style.display = 'none'; L.w = 0; return; }
      if (L.el.textContent !== text) {
        L.el.textContent = text;
        L.w = estimateWidth(text, L.size);
        /* A guess, for now. `estimateWidth` counts 0.56 em for a Latin letter
           and these names are set bold, so it is short — measured across the
           51 names on the opening view, short by 11% in the middle of the
           distribution and by 41% for "Guam". The placer believed the guess,
           reserved a box narrower than the word, and let two names that
           genuinely fought be placed side by side: Hong Kong over
           Guǎngzhōuwān, Macao over Hong Kong. The real width is read below. */
        measure.push(L);
        // A width can only be measured on something that is laid out, and the
        // element may have been hidden by the last pass. `placeLabels` runs
        // immediately after this, in the same frame, and will hide it again if
        // it does not fit — so nothing is painted in between.
        L.el.style.display = '';
      }
    });
    /* All the writing above, then all the reading here. Interleaved, each
       `getComputedTextLength` would force the browser to lay the document out
       again — thirteen hundred times over on the first pass with the
       administrative sheet in. Batched, it is one layout. */
    for (var m = 0; m < measure.length; m++) {
      var M = measure[m], real = 0;
      try { real = M.el.getComputedTextLength(); } catch (err) { real = 0; }
      // The text is drawn in local units and the scalable's `scale(k)` turns
      // those into screen pixels one for one, which is the space `placeLabels`
      // works in. A hidden or unlaid-out element answers 0; keep the guess.
      if (real > 0) M.w = real;
    }
  }

  /* Where a name may go when it cannot stay where it is: up and down first,
     because a label sits above its point and the room is usually there. */
  var NUDGES = [[0, -1], [0, 1], [-1, 0], [1, 0],
                [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -2], [0, 2]];

  /* How many island names one patch of map is allowed.

     Ranking the fine coastlines by size fixed which names survive a crowd but
     not how many there are. In the western Solomons 183 islands are on screen
     at once, 141 of them under a hundred square pixels, and the placer will
     happily fit 84 names among them because they are small enough to fit —
     each one legible, the sheet as a whole unreadable.

     What the reader wants is not a fixed number of names. It is *few names
     where the islands are few and only the big ones where they are many*: a
     lone islet off a coast is worth naming at any zoom, and the same islet in
     a shoal of thirty is not. So the map is divided into cells and each cell
     keeps its largest K, with K falling as the cell fills:

         K = clamp(round(10 / sqrt(n)), 1, n)

     one island in a cell keeps its name, three keep all three, nine keep three
     and thirty keep two.

     The cells are anchored to the map's own origin and sized in map units, so
     they do not slide under a pan — a cell boundary drifting across an island
     would make its name blink on and off as the reader dragged, which is worse
     than the clutter. The size steps in powers of two, chosen to be about
     QUOTA_PX across on screen, so zooming in genuinely thins the crowd rather
     than merely magnifying it: the same shoal that gets two names from across
     the Solomon Sea gets all thirty once the reader is in among them.

     Only the fine coastlines are counted. A division has no measured box —
     `area` is Infinity for those — and is never subject to this. */
  var QUOTA_PX = 170;
  var quotaAt = { size: 0, n: -1 };

  /* And a ceiling on top of the quota. The quota decides *which* islands are
     worth naming in each patch of sea, and it does that well in a sparse
     archipelago; in the western Solomons and along the north coast of New
     Guinea there are so many patches that the sum of a reasonable answer in
     each is still an unreasonable answer overall. Forty names is a map a
     reader can take in. Every island keeps its identity — it is still
     hoverable, still named in the panel — it simply is not written across the
     sea unless it is one of the forty largest in view.

     No sorting is needed to find them: the divisions and islands are already
     ordered largest first for the placer, so the fortieth island to be drawn
     is by construction the fortieth largest that fitted. */
  var ISLAND_CAP = 40;

  function islandQuota() {
    var k = view.w / containerSize().w;             // map units per screen pixel
    // Snapped to a ladder so the grid changes in steps and is the same grid
    // for every view at that zoom, rather than a new one on every notch of the
    // wheel. Half-powers of two rather than whole ones: on whole powers the
    // cell can be out by a factor of two either way, and the count of names
    // jumped between 30 and 49 across one step of the zoom.
    var size = Math.pow(2, Math.round(Math.log(QUOTA_PX * k) / Math.LN2 * 2) / 2);
    if (quotaAt.size === size && quotaAt.n === labels.length) return;
    quotaAt.size = size;
    quotaAt.n = labels.length;

    var cells = {}, i, L, key;
    for (i = 0; i < labels.length; i++) {
      L = labels[i];
      if (!L.half || !isFinite(L.area)) { if (L) L.crowded = false; continue; }
      key = Math.floor(L.x / size) + ',' + Math.floor(L.y / size);
      (cells[key] || (cells[key] = [])).push(L);
      L.crowded = true;
    }
    Object.keys(cells).forEach(function (c2) {
      var group = cells[c2];
      group.sort(function (a, b) { return b.area - a.area; });
      var keep = Math.max(1, Math.min(group.length,
        Math.round(10 / Math.sqrt(group.length))));
      for (var j = 0; j < keep; j++) group[j].crowded = false;
    });
  }

  function placeLabels() {
    if (!state.labels || state.mode === 'quiz') return;
    var c = containerSize();
    var sx = c.w / view.w;
    var sy = c.h / view.h;
    var k = view.w / c.w;                 // map units per screen pixel
    var placed = uiBoxes();
    islandQuota();
    var isles = 0;

    for (var i = 0; i < labels.length; i++) {
      var L = labels[i];
      if (!L.w) { L.el.style.display = 'none'; continue; }
      var isIsle = L.half && isFinite(L.area);
      // too many islands in this patch of sea for this one to be among the
      // names it is worth carrying — see islandQuota — or forty are already
      // written and this is the forty-first largest
      if (isIsle && (L.crowded || isles >= ISLAND_CAP)) {
        L.el.style.display = 'none';
        continue;
      }
      // a browse name with no dot under it is just a word floating in the sea
      if (L.rec.kind === 'browse' && !browseVisible()) { L.el.style.display = 'none'; continue; }
      /* And neither is a country's name when the country has been taken off
         the map. The label entries are built once, when the map is coloured,
         so nothing downstream knew the frame had been cut back: with the East
         Asia view on, the Indies, the Philippines, British India, Hawaii, the
         Soviet Union and Kengtung were all still named over open sea. */
      if (!state.world && L.rec.kind === 'territory' && !EAST_ASIA[L.rec.id]) {
        L.el.style.display = 'none';
        continue;
      }

      var x = (L.x - view.x) * sx;
      var y = (L.y - view.y) * sy + L.dy;
      var box = {
        l: x - L.w / 2, r: x + L.w / 2,
        t: y - L.h * 0.85, b: y + L.h * 0.25,
      };

      var free = function (b) {
        if (b.l < 2 || b.r > c.w - 2 || b.t < 2 || b.b > c.h - 2) return false;
        for (var j = 0; j < placed.length; j++) {
          var p = placed[j];
          if (b.l < p.r && b.r > p.l && b.t < p.b && b.b > p.t) return false;
        }
        return true;
      };

      /* A name that will not fit where it belongs is moved a little before it
         is given up on. Nepal, Sikkim and Bhutan are the case that asked for
         it: three small countries in a row along the Himalaya, all the same
         level, so they were placed in file order and whichever came first kept
         its name while the others lost theirs — and Nepal, much the largest of
         the three, was one of the ones that vanished.

         Only for a label that clashes where it stands. Anything that already
         fits is placed exactly where it was before, so this can add names to
         the map and cannot move one. The offsets are small on purpose: a
         country's name nudged far enough to clear its neighbour is a name over
         the neighbour. */
      var ok = free(box);
      var nx = 0, ny = 0;
      if (!ok) {
        var dx = L.w * 0.55, dy = L.h * 1.15;
        for (var n = 0; n < NUDGES.length && !ok; n++) {
          var o = NUDGES[n];
          var nb = { l: box.l + o[0] * dx, r: box.r + o[0] * dx,
                     t: box.t + o[1] * dy, b: box.b + o[1] * dy };
          if (free(nb)) { box = nb; nx = o[0] * dx; ny = o[1] * dy; ok = true; }
        }
      }
      if (!ok) { L.el.style.display = 'none'; continue; }

      /* And then the label is actually *moved* there. It was not, for as long
         as this code has existed: the offset went into local variables and
         `box`, so the map reserved the free space and went on drawing the name
         in the collision it had just found — which both wrote one name over
         another and blocked a third from the space nothing was using.
         Measured: Karafuto's box was recorded 37 px below where Karafuto was
         drawn.

         In screen pixels, and `placeScalable` is where they are turned back
         into map units. Nothing else may write `nx`/`ny`. */
      if (L.sc && (L.sc.nx !== nx || L.sc.ny !== ny)) {
        L.sc.nx = nx;
        L.sc.ny = ny;
        placeScalable(L.sc, k);
      }

      placed.push(box);
      if (isIsle) isles++;
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
    var newW = Math.min(Math.max(view.w / factor, minViewW()), fitView().w);
    if (Math.abs(newW - oldW) < 1e-6) return;
    var ratio = newW / oldW;
    view.x = p.x - (p.x - view.x) * ratio;
    view.y = p.y - (p.y - view.y) * ratio;
    view.w = newW;
    applyView();
  }

  /* The same as `zoomAt`, but told the width to arrive at rather than a factor
     to apply, and told which point of the map to hold still. A drag has to be
     read against where it started — width times two to the power of how far
     the thumb has come — because a factor applied per frame accumulates its
     own rounding, and a gesture that is drawn down and back up again would not
     return to the scale it left. */
  function zoomToWidth(newW, anchor, cx, cy) {
    newW = Math.min(Math.max(newW, minViewW()), fitView().w);
    if (Math.abs(newW - view.w) < 1e-6) return;
    var c = containerSize();
    var r = container.getBoundingClientRect();
    var k = newW / c.w;
    view.w = newW;
    view.x = anchor.x - (cx - r.left) * k;
    view.y = anchor.y - (cy - r.top) * k;
    applyView();
  }

  function onResize() {
    bumpLayout();                 // the window is a different shape
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
    view.w = Math.min(Math.max(w, minViewW()), fitView().w);
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
  /* The second half of a double tap, while the finger is still down. It has
     not yet decided which of two gestures it is: lifted where it landed it is
     a step of zoom, drawn up or down the screen it is a continuous one. */
  var zoomHold = null;
  var downTarget = null;
  var movedFar = false;
  /* Shift and drag draws a box, and the map goes to it. The wheel and the
     buttons zoom about a point, which is the wrong instrument when what you
     know is the ground you want on the screen rather than how many times to
     double: the Inland Sea, the Yangtze delta, the ground between two cities.
     Mouse only — a shift key is not a thing a finger has, and a touch drag is
     already the pan. */
  var marquee = null;
  var marqueeBox = null;
  var MARQUEE_MIN = 12;                       // px, below which it was a click

  function wirePointer() {
    /* The right button, or a long press that the browser turns into one,
       takes a point out of a shape or a mark off the map. Only over one of the
       reader's own marks: everywhere else the ordinary menu is theirs. */
    container.addEventListener('contextmenu', function (e) {
      if (annApi && annApi.rightClick(e.target)) e.preventDefault();
    });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    // The step of zoom is taken in the pointer path now, for the mouse as well
    // as the finger, because that is the only place a touch screen offers it:
    // `touch-action: none` means the browser synthesises no dblclick from a
    // pair of taps, so a phone had no double tap at all. Two handlers would
    // have zoomed twice on a mouse; this one is left to stop the text
    // selection a double click would otherwise make.
    container.addEventListener('dblclick', function (e) { e.preventDefault(); });

    /* The space bar, held. It is only a modifier — it never scrolls the page,
       because the map is not a scrolling thing — and it is ignored while the
       reader is typing, or a description with a space in it would start
       panning the map behind the panel. */
    var typing = function (t) {
      return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
                   || t.tagName === 'SELECT' || t.isContentEditable);
    };
    window.addEventListener('keydown', function (e) {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (typing(e.target) || e.repeat) return;
      if (spaceHeld) return;
      spaceHeld = true;
      container.classList.add('space-pan');
      e.preventDefault();
    });
    var releaseSpace = function () {
      if (!spaceHeld) return;
      spaceHeld = false;
      container.classList.remove('space-pan');
    };
    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space' || e.key === ' ') releaseSpace();
    });
    // a reader who alt-tabs away with it down is not still panning on return
    window.addEventListener('blur', releaseSpace);
    container.addEventListener('contextmenu', function (e) { if (coarse) e.preventDefault(); });
    if (hoverCapable) {
      container.addEventListener('mousemove', onHover);
      container.addEventListener('mouseleave', function () {
        setHot(null); setHotProv(null); setSubsAtom(null); hideTooltip();
      });
      // the cursor is the whole announcement that the gesture exists
      var mark = function (e) {
        container.classList.toggle('marking', !!e.shiftKey && !marquee);
      };
      window.addEventListener('keydown', mark);
      window.addEventListener('keyup', mark);
      window.addEventListener('blur', function () {
        container.classList.remove('marking');
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
      /* Shift and drag draws a selection box over the reader's own marks, and
         it has to be asked before the admin marquee below — which also takes
         shift, and which returns, so it was swallowing every one of these.
         The two never both apply: the marquee belongs to `admin.js`, which is
         reached by option-clicking Layers and which a reader never loads. */
      if (e.shiftKey && annApi && annApi.boxStart
          && annApi.boxStart(e.clientX, e.clientY)) {
        dragStart = null;
        movedFar = true;
        hideTooltip();
        return;
      }
      if (e.shiftKey && e.pointerType !== 'touch') {
        marquee = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
        dragStart = null;
        movedFar = true;                     // never a tap, whatever it does
        dropForGesture();
        drawMarquee();
        return;
      }
      // A second press in the same place as the last tap, soon enough after
      // it: this is the second half of a double tap and it does not pan. What
      // it does is settled when it ends -- lifted where it landed, one step of
      // zoom; drawn up or down first, the one-finger zoom.
      /* Not while a tool is out. Two presses in the same place is how a
         polygon's second corner gets placed on top of its first, and how a
         reader corrects a point they have just put down — and the map answered
         by zooming out from under them. A tool armed means the presses are the
         tool's, and the wheel and the buttons still zoom. */
      var drawing = !spaceHeld && annApi && annApi.drawing && annApi.drawing();
      var back = Date.now() - (lastTap ? lastTap.t : -1e9);
      if (!drawing && lastTap && back < DBL_MS &&
          Math.abs(e.clientX - lastTap.x) < DBL_SLOP &&
          Math.abs(e.clientY - lastTap.y) < DBL_SLOP) {
        zoomHold = { x: e.clientX, y: e.clientY, w: view.w,
                     anchor: clientToSvg(e.clientX, e.clientY), drawn: false };
        dragStart = null;
        hideTooltip();
        return;
      }
      // A press on a mark of the reader's own moves the mark, not the map. On a
      // finger it does not take the press at once — it arms a hold, and comes
      // back false so that a press that moves away still pans.
      if (!spaceHeld && annApi && annApi.grab(e.target, e.clientX, e.clientY,
                                e.pointerType === 'touch' || coarse)) {
        dragStart = null;
        movedFar = true;                     // never a tap: it is a handle
        hideTooltip();
        return;
      }
      dragStart = { cx: e.clientX, cy: e.clientY, vx: view.x, vy: view.y };
      container.classList.add('dragging');
      hideTooltip();
    } else if (pointers.size === 2) {
      // a second finger cancels it: what follows is a pinch, which says the
      // same thing better
      zoomHold = null;
      dragStart = null;
      movedFar = true;                       // a second finger is never a tap
      pinchStart = pinchState();
      dropForGesture();
    }
  }

  /* The box while it is being drawn. A plain element over the map rather than
     a rect inside the SVG: the SVG is under a viewBox that the drag does not
     change, and a screen-space rectangle drawn in map units would have to be
     converted back on every move for no gain. */
  function drawMarquee() {
    if (!marquee) {
      if (marqueeBox) marqueeBox.style.display = 'none';
      return;
    }
    if (!marqueeBox) {
      marqueeBox = document.createElement('div');
      marqueeBox.id = 'marquee';
      container.appendChild(marqueeBox);
    }
    var r = container.getBoundingClientRect();
    var l = Math.min(marquee.x0, marquee.x1) - r.left;
    var t = Math.min(marquee.y0, marquee.y1) - r.top;
    var w = Math.abs(marquee.x1 - marquee.x0);
    var h = Math.abs(marquee.y1 - marquee.y0);
    marqueeBox.style.display = '';
    marqueeBox.style.left = l + 'px';
    marqueeBox.style.top = t + 'px';
    marqueeBox.style.width = w + 'px';
    marqueeBox.style.height = h + 'px';
  }

  /* The drawn box, in screen pixels, becomes the view. The map keeps the
     container's aspect ratio, so the box is grown — never cropped — to it:
     a reader who draws a wide, flat box round the Inland Sea gets all of it
     and some sea above and below, rather than the middle of what they asked
     for. A box smaller than a keystroke is a shift-click, and does nothing. */
  function zoomToBox(m) {
    var w = Math.abs(m.x1 - m.x0);
    var h = Math.abs(m.y1 - m.y0);
    if (w < MARQUEE_MIN || h < MARQUEE_MIN) return;
    var a = clientToSvg(Math.min(m.x0, m.x1), Math.min(m.y0, m.y1));
    var b = clientToSvg(Math.max(m.x0, m.x1), Math.max(m.y0, m.y1));
    var c = containerSize();
    var aspect = c.w / c.h;
    var bw = Math.abs(b.x - a.x);
    var bh = Math.abs(b.y - a.y);
    var want = Math.max(bw, bh * aspect);
    var cx = (a.x + b.x) / 2;
    var cy = (a.y + b.y) / 2;
    view.w = Math.min(Math.max(want, minViewW()), fitView().w);
    view.h = view.w / aspect;
    view.x = cx - view.w / 2;
    view.y = cy - view.h / 2;
    applyView();
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
    /* The annotations see every move, not only the ones a mouse makes.
       `onHover` is wired only where a pointer can hover, so on a phone the
       drag was never delivered: pressing a mark cancelled the pan and then
       nothing happened. A hold that is still maturing is watched here too, so
       that a finger which wanders off is a pan again. */
    if (annApi) {
      if (annApi.boxMove && annApi.boxMove(e.clientX, e.clientY)) return;
      annApi.held(e.clientX, e.clientY);
      if (annApi.drag(e.clientX, e.clientY)) { e.preventDefault(); return; }
    }
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (marquee) {
      marquee.x1 = e.clientX;
      marquee.y1 = e.clientY;
      drawMarquee();
      return;
    }

    if (pointers.size >= 2 && pinchStart) {
      var now = pinchState();
      var maxW = fitView().w;
      var newW = Math.min(Math.max(pinchStart.w * (pinchStart.dist / now.dist), minViewW()), maxW);
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

    if (zoomHold) {
      var zdy = e.clientY - zoomHold.y;
      if (!zoomHold.drawn) {
        // still a double tap until it has moved further than a tap may
        if (Math.hypot(e.clientX - zoomHold.x, zdy) <= TAP_SLOP) return;
        zoomHold.drawn = true;
        container.classList.add('dragging');
        dropForGesture();
      }
      // down the screen pulls the map away, up pushes into it, which is the
      // way round every phone map does it and the way round a pinch already
      // reads: the fingers going apart is the view getting narrower
      zoomToWidth(zoomHold.w * Math.pow(2, zdy / ZOOM_DRAG_PX),
                  zoomHold.anchor, zoomHold.x, zoomHold.y);
      return;
    }

    if (!dragStart) return;
    var dx = e.clientX - dragStart.cx;
    var dy = e.clientY - dragStart.cy;
    if (!movedFar && Math.hypot(dx, dy) > TAP_SLOP) {
      movedFar = true;
      dropForGesture();
    }
    if (!movedFar) return;

    var cs = containerSize();
    var scale = view.w / cs.w;
    view.x = dragStart.vx - dx * scale;
    view.y = dragStart.vy - dy * scale;
    applyView();
  }

  /* A gesture lets go of whatever was selected.
   *
   * A selected territory is drawn in `#highlight` as a stroke through a mask,
   * and a mask renders into its own offscreen buffer which the compositor
   * re-renders on every viewBox change — which is every frame of a pan. It is
   * the most expensive thing on the map by a distance: measured over three
   * sandwiched rounds, a scripted pan costs 254 ms a frame with China selected
   * against 70 without, 222 against 97 over India, and on the throttled phone
   * profile 133 against 54. Between 2.4 and 3.6 times, for a line the reader
   * cannot see properly anyway while the map is sliding under it.
   *
   * So the drag, the pinch and the wheel drop it, along with the hover
   * outline, the province under the pointer and the divisions drawn inside the
   * country — all of which are the same masked machinery. The reader selects
   * again when the map has stopped moving.
   *
   * Not in the quiz, where the selection is the answer to the question on
   * screen, and not for the zoom buttons or the reset: those are single steps
   * with a settled frame after each, and a reader who presses + is usually
   * looking at the thing they just selected. */
  function dropForGesture() {
    if (state.mode === 'quiz') return;
    if (selected) select(null);
    setHot(null);
    setHotProv(null);
    setSubsAtom(null);
    hideTooltip();
  }

  function onPointerUp(e) {
    var had = pointers.size;
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (marquee) {
      var m = marquee;
      marquee = null;
      drawMarquee();
      try {
        if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
      } catch (err2) { /* already gone */ }
      if (e.type === 'pointerup') zoomToBox(m);
      return;
    }
    try {
      if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
    } catch (err) { /* already gone */ }

    if (zoomHold) {
      var drawn = zoomHold.drawn;
      var zx = zoomHold.x, zy = zoomHold.y;
      zoomHold = null;
      container.classList.remove('dragging');
      dragStart = null;
      // A gesture that ended where it began never became the continuous one,
      // so it is the plain double tap and worth one step.
      if (!drawn && e.type === 'pointerup') {
        dropForGesture();
        zoomAt(zx, zy, DBL_ZOOM);
      }
      // and the pair is spent: a third tap starts a new one rather than
      // zooming again off the back of the second
      lastTap = null;
      downTarget = null;
      return;
    }

    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 1) {
      var rest = Array.from(pointers.entries())[0];
      dragStart = { cx: rest[1].x, cy: rest[1].y, vx: view.x, vy: view.y };
      movedFar = true;
      return;
    }

    container.classList.remove('dragging');
    dragStart = null;
    if (annApi && annApi.boxEnd && annApi.boxEnd()) { downTarget = null; return; }
    if (annApi && annApi.drop()) { downTarget = null; return; }

    if (had === 1 && !movedFar && e.type === 'pointerup') {
      // An admin tool may want the tap instead — drawing a polygon is one.
      // Offered here and not to `click`, so that a tool gets taps without
      // having to tell a tap from a drag itself, and so that panning and
      // pinching are untouched while one is armed. Absent unless admin.js has
      // been loaded, which a reader never does.
      if (window.JMAP_TAP && window.JMAP_TAP(e) === false) return;
      // The second press of a pair is taken in `onPointerDown` and returns
      // above, so nothing that reaches here is one — but a press that was
      // armed and then panned away does, and it must not also count as a tap.
      var now = Date.now();
      var dbl = lastTap && now - lastTap.t < DBL_MS &&
                Math.abs(e.clientX - lastTap.x) < DBL_SLOP &&
                Math.abs(e.clientY - lastTap.y) < DBL_SLOP;
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
        } else if (!(annApi && annApi.tap(e.clientX, e.clientY, downTarget))) {
          // a drawing tool takes the tap when one is armed, so that placing a
          // point never also selects the country under it
          handleTap(downTarget, e.clientX, e.clientY);
        }
      }
    }
    downTarget = null;
  }

  function onWheel(e) {
    e.preventDefault();
    dropForGesture();
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
    /* Which sub-unit the pointer is really on has to be settled before the
       Administrative switch is asked whether to hide it. Labuan is a pixel
       across at the opening zoom, so the pointer lands on the invisible disc
       that stands in for a small atom — and that disc belongs to the atom, not
       to Labuan. Asking it whether it was a Straits Settlement always answered
       no, the sub-unit was dropped, and hovering Labuan lit the whole of
       British Borneo instead of the four Settlements it belonged to. */
    var cand = provinceOf(got.el);
    if (!cand && typeof cx === 'number') {
      var early = nearestSubUnit(atom, cx, cy);
      if (early) cand = provinceOf(early);
    }
    var candEl = (cand && cand.el) || got.el;
    // the Straits Settlements are a Crown colony of four scattered pieces
    // inside a peninsula of protectorates, and telling them apart is the point
    // of that corner of the map whether or not divisions are switched on
    var own = candEl && candEl.getAttribute
      && candEl.getAttribute('data-cluster') === 'Straits Settlements';
    // A fine coastline is a place, not an administrative division. The Ryukyu
    // and Pacific atoms carry `data-islands` and so have always named their
    // islands with the layer off; Ulleungdo and Singapore's islands are in
    // atoms that do not, and there is no sense in which naming an island
    // should wait on a switch about provinces.
    var fine = candEl && candEl.classList
      && candEl.classList.contains('fine');
    if (!state.cats.territory && !own && !fine &&
        !(atom && atom.getAttribute('data-islands'))) {
      return null;
    }
    return cand || null;
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
    // worked out before the two-tap rule below, which throws the province
    // away on the first tap: which cluster was tapped is a fact about the
    // territory and not about how much detail has been asked for
    var clust = prov && prov.el ? clusterOf(prov.el) : null;
    // On a touch screen there is no hover, so the two questions a tap might be
    // asking — what country is this, and what province of it am I on — have to
    // be separated in time instead of by the pointer. The first tap answers
    // the first and the second tap answers the second, which also means a
    // student who only wants the country is never told more than they asked.
    if (coarse) {
      // A sub-unit that belongs to a cluster is not part of the atom it is
      // drawn inside, so the two-tap rule does not apply to it: Labuan's
      // country is the Straits Settlements and answering "North Borneo" to
      // the first tap is not a coarser answer, it is a wrong one.
      if (clust) {
        setHotProv(prov.el);
      } else if (id && id === selected && prov) {
        setHotProv(prov.el);
      } else {
        lastProv = null;
        setHotProv(null);
      }
    }
    select(id, clust);
  }

  var hot = null;

  /* Light up every atom of the territory under the pointer, not just the one
   * polygon it happens to be over. */
  /* Sub-units that belong together and light up together. Hovering Singapore
     lit the whole Malay peninsula, which says the wrong thing: the Straits
     Settlements were a Crown colony of four scattered pieces, and the states
     around them were protectorates that were never British soil. */
  var hotCluster = null;

  /* The territory a cluster answers to, where the cluster is a polity in its
     own right and not a country drawn in two pieces. The Straits Settlements
     are the first kind: Labuan is drawn inside the North Borneo atom because
     that is where the island is, and it was never North Borneo's — it was a
     Crown colony administered from Singapore. Laos and Cambodia are the
     second, a country split across two atoms by the 1941 cession, and they
     have no home here because neither half is more Laos than the other. */
  var CLUSTER_HOME = { 'Straits Settlements': 'malaya' };

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

  /* A sub-unit drawn inside an atom its own polity does not hold. Only the
     Straits Settlements have any: Labuan, in the North Borneo atom. Christmas
     Island is not one — its atom is Malaya's, so the Settlements do hold it. */
  function foreignSub(el) {
    if (!el || !el.getAttribute || !el.getAttribute('data-cluster')) return false;
    var home = CLUSTER_HOME[clusterName(el) || ''];
    if (!home) return false;
    var atom = el.closest && el.closest('.atom');
    return !!atom && atom.getAttribute('data-id') !== home;
  }

  /* Which territory a card or a tooltip should name under a sub-unit. Normally
     the atom's own; for a foreign sub-unit, the polity it belonged to. The
     card for Labuan was headed Labuan and then said "North Borneo — chartered
     company from 1881", followed by North Borneo's paragraph, which is the
     country the island sits off rather than the colony it was governed as. */
  function hostOf(rec, provEl) {
    if (!foreignSub(provEl)) return rec;
    var home = byId[CLUSTER_HOME[clusterName(provEl)]];
    return home ? shown(home) : rec;
  }

  /* What lights up when a territory is hovered: itself, and anything it says
     it lights with. In 1930 that is China and the four territories drawn
     separately so they can be named — Manchuria, Jehol, Chahar and Suiyuan,
     and Sinkiang — which were all the Republic on that date. */
  function litFor(id, cluster) {
    if (cluster) return cluster;
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
      // and any shape the build has handed to this territory for the sake of
      // the outline alone. Mengchiang is the one: its fill is the ground it
      // held and #mengjiang-whole is the whole of what it claimed, drawn with
      // neither fill nor stroke, so that hovering the state draws a line round
      // all of it rather than round the limit of Japanese control.
      $$('[data-lit-for="' + id + '"]', svg).forEach(function (el) {
        if (el.style.display !== 'none' && els.indexOf(el) < 0) els.push(el);
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
  function seamsFor(id, cluster) {
    var els = [];
    if (!id) return els;
    // By colour, not by atom. The strip that shows is not always the hovered
    // country's own: Thailand and the provinces ceded to it in 1941 are two
    // territories on the 1942 map and share one colour, so hovering the ceded
    // provinces brightened them and left Thailand's strips along the same
    // frontier dark — a band of the same teal, unlit, inside the outline.
    // Anything painted the colour that is lighting up lights with it.
    var want = {};
    litFor(id, cluster).forEach(function (el) {
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
    // with the cluster, both times: the set being unlit is the set that was
    // lit, and litFor answers differently for a cluster than for an atom. It
    // was reading a module-level hotCluster and now takes it as an argument,
    // and these four calls were left behind when it changed — so hovering
    // Labuan stopped lighting the Straits Settlements and lit the whole of
    // North Borneo again, which is the fault that was fixed twice already.
    litFor(hot, hotCluster).forEach(function (el) { el.classList.remove('hot'); });
    seamsFor(hot, hotCluster).forEach(function (el) { el.classList.remove('hot'); });
    hot = id;
    hotCluster = cluster;
    litFor(hot, hotCluster).forEach(function (el) { el.classList.add('hot'); });
    seamsFor(hot, hotCluster).forEach(function (el) { el.classList.add('hot'); });
    redrawHighlight();
  }

  var hotProv = [];
  var hotProvEl = null;
  var lastProv = null;

  /* The cluster the *selection* belongs to, which is not always the atom the
     selection is drawn inside. Labuan is a sub-unit of the North Borneo atom
     and a Straits Settlement, so choosing it has to draw the line round
     Singapore, Penang and Malacca and not round the country it sits off.
     Hovering has done that since clusters were introduced, and the selection
     borrowed `hotCluster` to do it — which works with a mouse, where the
     hover sets it before the click lands, and does nothing at all on a touch
     screen, where there is no hover and the tap outlined North Borneo. The
     selection keeps its own. */
  var selCluster = null;

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
  /* Atoms whose own province lines are buried by something drawn over them,
     and so have to be lifted when their divisions are asked for.

     India was the first: the princely states are a layer over the Raj, and
     every provincial boundary that ran under one disappeared. Thailand is the
     same shape of problem — Battambang and Siem Reap, ceded in 1941, are an
     atom of their own drawn after Siam and in the same colour, so the changwat
     boundaries along that frontier vanished under them and the two provinces
     read as though nothing bordered them at all. */
  var SUBS_LIFT = { india: true, siam: true };

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
  /* A province drawn in more than one block on this date — see provPeers.
     The blocks share an edge that is no boundary, and the Administrative
     layer's thin line drew it. They are marked so the stylesheet leaves them
     unstroked, and one line is drawn round the group with the same machinery
     the selection outline uses, which masks away everything inside it. */
  var mergedSubNodes = [];
  var mergedSubDefs = [];

  function clearSplitProvinces() {
    $$('.merged-sub', svg).forEach(function (n) { n.classList.remove('merged-sub'); });
    mergedSubNodes.forEach(function (n) {
      if (n.parentNode) n.parentNode.removeChild(n);
    });
    mergedSubNodes = [];
    if (mergedSubDefs.length) {
      mergedSubDefs.forEach(function (d) {
        if (d.parentNode) d.parentNode.removeChild(d);
      });
      ownedDefs.sub = ownedDefs.sub.filter(function (d) {
        return mergedSubDefs.indexOf(d) < 0;
      });
      mergedSubDefs = [];
    }
  }

  /* No group of blocks is ever gathered beyond this. See provPeers: the
     occupied zone names 733 of its pieces the same thing, and one masked
     outline per piece is what hangs a renderer. */
  var PEER_CAP = 8;

  function markSplitProvinces() {
    clearSplitProvinces();
    if (!subOutlineLayer || !subsAtoms.length) return;
    var groups = {};
    subsAtoms.forEach(function (a) {
      var id = a.getAttribute('data-id') || a.id;
      $$('[data-prov]', a).forEach(function (n) {
        if (n.classList && n.classList.contains('fine')) return;
        var key = id + '/' + provLabel(n.getAttribute('data-prov'));
        var g = groups[key] = groups[key] || [];
        g.push(n);
        if (g.atoms !== a) { g.spread = (g.spread || 0) + 1; g.atoms = a; }
      });
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      // more than one block, in more than one atom, and not many of them
      if (g.length < 2 || g.spread < 2 || g.length > PEER_CAP) return;
      g.forEach(function (n) { n.classList.add('merged-sub'); });
      var before = ownedDefs.sub.length;
      var kids = subOutlineLayer.childNodes.length;
      outlineOf(g, 'sub-merged', subOutlineLayer);
      for (var i = kids; i < subOutlineLayer.childNodes.length; i++) {
        mergedSubNodes.push(subOutlineLayer.childNodes[i]);
      }
      for (var j = before; j < ownedDefs.sub.length; j++) {
        mergedSubDefs.push(ownedDefs.sub[j]);
      }
    });
  }

  function setSubsAtom(el) {
    if (subsAtom === el) return;
    subsAtoms.forEach(function (a) { a.classList.remove('subs'); });
    subsAtom = el;
    subsAtoms = [];
    if (el) {
      var id = el.getAttribute('data-id');
      // Everything the territory lights, not only the atoms it is made of.
      // On the 1930 sheet the Republic is drawn as China plus Manchuria,
      // Jehol, Chahar, Suiyuan and Sinkiang — separate atoms so that each can
      // be named — and asking China for its divisions drew the provinces of
      // China proper and left the whole north-east blank, which reads as a
      // country that has no provinces up there rather than as a country whose
      // provinces were not asked for.
      subsAtoms = (id ? litFor(id, null) : [el])
        .filter(function (a) { return a.classList && a.classList.contains('atom'); });
      if (subsAtoms.indexOf(el) < 0) subsAtoms.push(el);
      subsAtoms.forEach(function (a) { a.classList.add('subs'); });
    }
    markSplitProvinces();
    liftSubs(subsAtom);
  }

  /* A sub-unit's name on this date, the gloss taken off, which is what decides
     whether two blocks are one province. */
  function provLabel(key) {
    var rec = (JMAP.PROVINCES || {})[key];
    var per = JMAP.PROVINCE_EPOCH && JMAP.PROVINCE_EPOCH[state.epoch];
    var over = per && per[key];
    var en = (over && over.en) || (rec && rec.en) || key;
    var cut = en.indexOf(' — ');
    return cut > 0 ? en.slice(0, cut) : en;
  }

  /* Every block that is this province on this date. A province in more than
     one block is rare and deliberate: Suiyuan is cut at Paotow and again along
     the Yellow River so that the 1942 map can colour the corridor Mengchiang
     held apart from the country Fu Zuoyi kept. On the 1930 sheet it is one
     province again — both halves answer to one name, and overrides-1930 says
     so — and marking only the half under the pointer drew the cut as a
     sideways T straight across the middle of it. */
  function provPeers(el) {
    if (!el || !el.getAttribute) return [];
    var key = el.getAttribute('data-prov');
    var atom = el.closest && el.closest('.atom');
    var id = atom && atom.getAttribute('data-id');
    if (!key || !id) return [el];
    // Across atoms only. Several blocks of one name inside a single atom are
    // not a province in pieces — they are one shading drawn in pieces, and the
    // occupied zone is 733 of them all called "North China and the Yangtze
    // valley". Gathering those cost 733 masked outlines for one hover and
    // stalled the renderer for two and a half seconds. What this is for is the
    // opposite case: one province drawn in two atoms, which is Suiyuan.
    var kin = atomsOf[id] || [];
    if (kin.length < 2) return [el];
    var want = provLabel(key);
    var out = [el];
    kin.forEach(function (a) {
      if (a === atom) return;
      $$('[data-prov]', a).forEach(function (n) {
        if (provLabel(n.getAttribute('data-prov')) === want) out.push(n);
      });
    });
    // and never more than a handful, whatever the data comes to say
    return out.length > PEER_CAP ? [el] : out;
  }

  /* The province under the pointer, picked out inside the lit-up country. */
  /* The larger unit a sub-unit belongs to. Taiwan's districts are the case it
     was built for: a 郡 or a 市 sits inside a 州 or a 廳, and pointing at one
     should say both — the district under the pointer, lightly, and the
     prefecture it is part of as the main outline. The relation is written onto
     the district at build time as `data-parent`; see SUB_PARENTS.

     Not a cluster. A cluster is a scattered polity that *replaces* the
     territory when one of its pieces is pointed at (the Straits Settlements);
     this is a plain hierarchy inside one country, and it adds an outline. */
  var hotParent = null;
  function parentPeers(el) {
    var want = el && el.getAttribute && el.getAttribute('data-parent');
    if (!want) return null;
    /* The prefecture's own shape, not the sum of its districts. A 州 runs back
       over the mountains into the 蕃地 while its 郡 are a rind along the west
       coast, so adding the districts up drew a prefecture that stopped at the
       foothills. `data-shu` carries the real extent, drawn with neither fill
       nor stroke for exactly this. Falling back to the districts if the shape
       is missing, so a build without the prefecture layer still says
       something rather than nothing. */
    var out = [];
    $$('#land [data-shu="' + want + '"]', svg).forEach(function (n) { out.push(n); });
    if (!out.length) {
      $$('#land [data-parent="' + want + '"]', svg).forEach(function (n) { out.push(n); });
    }
    return out.length ? out : null;
  }

  function setHotProv(el) {
    if (hotProvEl === el) return;
    hotProv.forEach(function (n) { n.classList.remove('prov-hot'); });
    if (hotParent) hotParent.forEach(function (n) { n.classList.remove('parent-hot'); });
    hotProvEl = el;
    hotProv = provPeers(el);
    hotParent = parentPeers(el);
    hotProv.forEach(function (n) { n.classList.add('prov-hot'); });
    // the prefecture lifts very slightly too, so the reader can see how far it
    // reaches without reading the outline
    if (hotParent) hotParent.forEach(function (n) { n.classList.add('parent-hot'); });
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
      // An override exists to say what a province was called on this date —
      // Fengtien in 1942, Liaoning in 1930 — and it carries the name alone.
      // Taking it whole therefore threw away the description as well as the
      // name, and Liaoning, Heilungkiang and Suiyuan lost their paragraphs on
      // the epoch where they had one. The name comes from the override; the
      // description stays unless the override writes a new one.
      var baseGloss = splitGloss(rec.en || '').gloss;
      if (over.en && baseGloss && (over.en || '').indexOf(' — ') < 0) {
        merged.en = over.en + ' — ' + baseGloss.replace(/\.$/, '');
      }
      rec = merged;
    }
    return { key: key, rec: rec, el: target };
  }

  function onHover(e) {
    // a mark being dragged owns the pointer, and `onPointerMove` has it
    if (annApi && annApi.dragging && annApi.dragging()) return;
    // While a drawing tool is armed the pointer is a pen, and naming whatever
    // it passes over is both noise and a lie about what a click will do.
    if (annApi && annApi.drawing()) { setHot(null); setHotProv(null); hideTooltip(); return; }
    // and a mark of the reader's own answers for itself, over the country it
    // happens to sit on
    if (annApi && annApi.hover(e.target, e.clientX, e.clientY)) {
      setHot(null); setHotProv(null); setSubsAtom(null);
      return;
    }
    if (state.mode === 'quiz' || dragStart || marquee) {
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
  /* What the tooltip is currently saying, and where it has been asked to go.
     Rebuilding it on every pointer move was 99 ms of `getBoundingClientRect`
     over 240 moves — the whole document laid out again, synchronously, once a
     move — because the box was measured immediately after being rewritten and
     the browser has to flush layout to answer. Two things follow from that.

     The words change only when the record under the pointer changes, so the
     DOM is rebuilt then and not otherwise. And the measurement moved into a
     frame callback: the same read costs nothing there, because layout is
     about to happen anyway and is no longer being forced in the middle of an
     event handler. Moves arriving faster than frames coalesce for free. */
  var tipKey = null;
  var tipAt = null;
  var tipFrame = 0;

  function placeTooltip() {
    tipFrame = 0;
    if (!tipAt || tooltip.hidden) return;
    var r = tooltip.getBoundingClientRect();
    var x = Math.min(Math.max(8, tipAt.x + 16), window.innerWidth - r.width - 8);
    var y = tipAt.y - r.height - 14;
    if (y < 8) y = tipAt.y + 22;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function showTooltip(base, cx, cy, prov) {
    var rec = shown(base);
    var head = prov && prov.rec ? shown(prov.rec) : rec;
    // Whose the sub-unit was, which is not always whose atom it is drawn in.
    var host = hostOf(rec, prov && prov.el);
    tipAt = { x: cx, y: cy };
    // the epoch and the language are in it because both change what the same
    // record says without changing which record it is
    var key = (rec && (rec.rid || rec.id)) + '|' + (head && (head.rid || head.id || head.en)) +
              '|' + (host && (host.rid || host.id)) + '|' + state.epoch + '|' + state.lang;
    if (key === tipKey && !tooltip.hidden) {
      if (!tipFrame) tipFrame = requestAnimationFrame(placeTooltip);
      return;
    }
    tipKey = key;
    tooltip.innerHTML = '';
    // The name, and only the name. `en` is written `Name — what it was`, and
    // the tooltip was printing the whole string as its headline: Qīnghǎi came
    // up as five hundred and fifty-eight characters of pasture and salt lake
    // in bold. The card splits it, the map label splits it, and so does this.
    tooltip.appendChild(document.createTextNode(splitGloss(nameOf(head)).name));
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
      // `under` is what a country calls itself when it is standing underneath
      // one of its own provinces, for the few records where the usual set of
      // alternates is too much there. Manchukuo is the case: two lines above
      // it the province has already given its name in pinyin and again in
      // characters with a Japanese reading, and the country's full set added a
      // third romanisation to that. It is opt-in, and no other record sets it —
      // taking `orig` for every record instead cost Japan its 内地 and the
      // Philippines their 比島, which are not duplicates of anything.
      var owner = host.under || otherNames(host) || [];
      pv.textContent = [nameOf(host)].concat(owner).join('  ');
      tooltip.appendChild(pv);
      // What the country line does not say plainly. In the Pacific the name
      // carries the sovereignty inside it — "South Seas Mandate", "Papua & the
      // Territory of New Guinea" — and a reader looking at one atoll in the
      // Carolines has to parse it out of a phrase. `rule` says it in three
      // words: Japanese mandate, British colony, Australian territory.
      if (host.rule) {
        var rl = document.createElement('span');
        rl.className = 'sub rule';
        rl.textContent = host.rule;
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
    var when = host.date || host.when;
    if (when) {
      var w = document.createElement('span');
      w.className = 'sub when';
      w.textContent = when;
      tooltip.appendChild(w);
    }
    /* A phrase, not a paragraph. What the pointer is over gets a few words
       here — the whole of it is a click away, and the card has room for it.
       Hovering a changwat used to bring up four hundred and forty-four
       characters about how the changwat were drawn, which is a thing to read
       once and not something to be handed every time the mouse crosses a
       frontier.

       `short` is written for the record. Where there is none, the gloss on the
       name does the job for most sub-units — it is the one sentence anybody
       wrote about them — but only when it is short enough to be a phrase;
       past that it is prose and belongs in the card with the rest. */
    var brief = shortOf(head);
    if (brief) {
      var pn = document.createElement('span');
      pn.className = 'sub prov-note';
      pn.textContent = brief;
      tooltip.appendChild(pn);
    }
    tooltip.hidden = false;
    if (!tipFrame) tipFrame = requestAnimationFrame(placeTooltip);
  }

  function hideTooltip() {
    tooltip.hidden = true;
    tipKey = null;
    tipAt = null;
  }

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
      return !ownShapes(atom);
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
        var r = bboxOf(e);
        if (!r.width && !r.height) return;
        if (!bb) bb = { x0: r.x, y0: r.y, x1: r.x + r.width, y1: r.y + r.height };
        else {
          bb.x0 = Math.min(bb.x0, r.x); bb.y0 = Math.min(bb.y0, r.y);
          bb.x1 = Math.max(bb.x1, r.x + r.width); bb.y1 = Math.max(bb.y1, r.y + r.height);
        }
      } catch (err) { /* not laid out yet */ }
    });
    if (bb) {
      /* The shape's own box, and nothing else. It used to be intersected with
         the *document's* extent — `0 … mapW`, `0 … mapH` — which are the
         Mercator drawing's dimensions.

         In Mercator that intersection is a no-op: every shape is inside the
         document by definition. Under Albers or Lambert it is not. The
         projection moves the ground, and western India goes *left of zero* —
         so the mask was cut at `x = -60` and the outline ended in a straight
         vertical line down the middle of Rajputana, which is exactly how it
         was reported and only ever in a projection that is not Mercator.

         The shape's box already bounds the buffer, which is all the clamp was
         for. Taking it out cannot change Mercator, where it never bit. */
      mx0 = bb.x0 - pad; my0 = bb.y0 - pad;
      mx1 = bb.x1 + pad; my1 = bb.y1 + pad;
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
      // and a sub-unit that belongs to somebody else is not part of this
      // shape either: outlining North Borneo drew a ring round Labuan.
      var paths = el.tagName === 'path' ? [el] : $$('path:not(.superseded):not(.foreign-sub)', el);
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

  /* The three outlines in the highlight layer had one lifecycle between them:
     `redrawHighlight` emptied the whole layer and built all three again. The
     province under the pointer changes on nearly every move inside a country,
     and it took the country's own silhouette down with it and rebuilt it
     identically — `hot` had not changed, and neither had the shape.

     What that cost, measured over 120 pointer moves inside China with the
     Administrative layer on: sixteen province crossings, thirty-two masks
     built where sixteen would do, and 7.84 million characters of path data
     copied — 490 KB a crossing, of which the larger part is China's own atom,
     152,621 characters, read out, merged into one `d`, written into the mask
     solid and written again into the stroked copy.

     Each outline keeps its own slot now, with the key it was built for. A slot
     whose key has not changed is left alone. Each has a container of its own
     so that rebuilding one does not move it above the others: the selection is
     the stronger statement and has to stay on top of the hover. */
  var hiSlots = { territory: null, province: null, selected: null };
  var hiHost = { territory: null, province: null, selected: null };

  /* Every id in a slot's key answers for the shape it stands for -- but not
     for whether that shape is still the same shape. A fine coastline grafting
     in, the administrative file arriving, an atom standing down: all of them
     change what `litFor` returns while `hot` stays the word it was. This
     counts those, so a key can carry one. Anything that adds, removes or
     supersedes geometry has to bump it, or a slot goes stale and stops
     redrawing while looking as though it works. */
  var hiGen = 0;
  function bumpHi() { hiGen++; }

  /* A shape's own bounds, in map units, remembered until the geometry moves.
     `getBBox` has to flush layout to answer, and sizing the mask asked it once
     per outline per pointer move; the generation counter that tells a slot its
     shapes have changed is exactly the signal that tells this its answer has.
     Worth 20% of what the hover path costs after the tooltip was fixed. */
  function bboxOf(el) {
    if (el.__bbGen === hiGen && el.__bb) return el.__bb;
    var r = el.getBBox();
    el.__bb = r;
    el.__bbGen = hiGen;
    return r;
  }

  function hiHostFor(name) {
    if (!highlightLayer) return null;
    if (!hiHost[name] || !hiHost[name].isConnected) {
      // built in the order they must stay in
      ['territory', 'province', 'selected'].forEach(function (k) {
        if (!hiHost[k] || !hiHost[k].isConnected) {
          hiHost[k] = svgEl('g', { 'class': 'hi-slot' });
          highlightLayer.appendChild(hiHost[k]);
        }
      });
    }
    return hiHost[name];
  }

  function dropSlot(name) {
    var slot = hiSlots[name];
    if (!slot) return;
    if (slot.group && slot.group.parentNode) {
      slot.group.parentNode.removeChild(slot.group);
    }
    slot.defs.forEach(function (d) {
      if (d.parentNode) d.parentNode.removeChild(d);
      var i = ownedDefs.hi.indexOf(d);
      if (i >= 0) ownedDefs.hi.splice(i, 1);
    });
    hiSlots[name] = null;
  }

  /* Build this outline only if it is not the one already standing there. The
     defs `outlineOf` appended are read off the end of `ownedDefs.hi`, which is
     how the sub-outline layer already tracks its own. */
  function fillSlot(name, key, els, cls) {
    if (hiSlots[name] && hiSlots[name].key === key) return;
    dropSlot(name);
    if (!key || !els || !els.length) return;
    var host = hiHostFor(name);
    if (!host) return;
    var before = ownedDefs.hi.length;
    var group = outlineOf(els, cls, host);
    if (!group) return;
    hiSlots[name] = { key: key, group: group,
                      defs: ownedDefs.hi.slice(before) };
  }

  function clearHighlight() {
    ['territory', 'province', 'selected'].forEach(dropSlot);
    if (highlightLayer) highlightLayer.innerHTML = '';
    hiHost = { territory: null, province: null, selected: null };
    dropDefs('hi');
  }

  // nothing is drawn in an `unseen` shape, and tracing one would draw the
  // rectangle it happens to be: a box ruled across empty ocean
  function seen(id) { return id && byId[id] && !byId[id].unseen; }

  /* A key that stands for the exact set of shapes an outline was built from.
     The generation is in it because the ids do not change when the geometry
     under them does. */
  function slotKey(kind, id, cluster, els) {
    if (!els || !els.length) return null;
    return kind + '|' + (id || '') + '|' +
      (cluster ? (clusterName(cluster[0]) || 'c') + ':' + cluster.length : '') +
      '|' + els.length + '|' + hiGen;
  }

  function redrawHighlight() {
    // One line per shape. The hover outline and the selection outline are
    // different widths — 3.3 against 3.7 — so a country that is both selected
    // and under the pointer was drawn round twice, and the two strokes read as
    // one line that changes thickness along its length wherever they did not
    // land on exactly the same pixels. The selection is the stronger statement
    // and the one that survives the pointer moving away, so it wins.
    var bothSame = selected && hot === selected && !hotCluster && !selCluster;
    var tEls = null;
    if (hotCluster) tEls = hotCluster;
    /* The prefecture, where there is one. A reader pointing at Kagi-gun wants
       to be told two things — which district this is, and which prefecture it
       belongs to — and the outline round the whole of Taiwan answers neither.
       So the main outline is the prefecture and the district keeps the lighter
       one. Everywhere else on the map this is the country, as before. */
    else if (hotParent && hotParent.length) tEls = hotParent;
    else if (!bothSame && hot && atomsOf[hot] && seen(hot)) {
      tEls = litFor(hot, hotCluster);
    }
    /* With a prefecture on screen the two outlines have to be told apart at a
       glance, and two lines of nearly the same weight are not. The prefecture
       takes the strong one; the district's is dropped to almost nothing,
       because its own colour shift already says which district it is and a
       second line of the same weight only competed with the first. */
    var deep = !!(hotParent && hotParent.length);
    /* The prefecture's *own* key in the slot key, not the word "parent".
       `slotKey` falls back to 'c' for a set with no cluster name, so every
       prefecture came out as `t|parent|c:1|1|gen` — the same string — and
       `fillSlot` returns early when the key has not changed. The visible
       result was that moving the pointer straight from a district in one
       prefecture to a district in another left the first prefecture outlined:
       going out to open sea first made it work, because that changed the key. */
    var parentKey = deep && hotProvEl && hotProvEl.getAttribute
      ? hotProvEl.getAttribute('data-parent') : null;
    fillSlot('territory',
      slotKey('t', parentKey || hot, hotCluster || hotParent, tEls),
      tEls, 'hi-territory' + (deep ? ' hi-parent' : ''));
    fillSlot('province', slotKey('p', hotProvEl && hotProvEl.getAttribute('data-prov'),
                                 (deep ? ['deep'] : null), hotProv),
             hotProv, 'hi-province' + (deep ? ' hi-inner' : ''));
    if (selected && atomsOf[selected] && seen(selected)) {
      // `litFor` and not `atomsOf`, so that selecting draws round the same
      // ground hovering lights. They disagreed: hovering China on the 1930
      // map lit Manchuria, Jehol, Chahar and Suiyuan and Sinkiang with it —
      // all of them the Republic on that date — and then clicking outlined
      // China proper alone and left the rest of the country outside the line.
      var sEls = litFor(selected, selCluster);
      fillSlot('selected', slotKey('s', selected, selCluster, sEls), sEls, 'hi-selected');
    } else {
      dropSlot('selected');
    }
  }

  /* A note, with its emphasis drawn rather than spelled.
   *
   * The prose in `texts/` marks a book title the way prose does — *Outcasts of
   * Empire* — and the card was setting `textContent`, so a reader saw the
   * asterisks. This turns `*…*` into an <em> and `**…**` into a <strong>, and
   * nothing else: no links, no images, no raw HTML.
   *
   * Built out of text nodes rather than assigned as `innerHTML`, which is the
   * whole point. Notes are authored here and are trustworthy, but the same
   * card is lent to the annotation panel to show a description that arrived in
   * a shared link from a stranger. A parser that can only ever produce text
   * nodes, <em> and <strong> cannot be talked into producing a <script>,
   * whatever it is handed. */
  /* No lookbehind. Safari only learned it in 16.4, and an iPad two years old
     would throw a SyntaxError on the whole file — which is not a bug in the
     card, it is the map failing to load. The "no space before the closing
     marker" rule is checked in code below instead. */
  var EMPH = /(\*\*?)(?!\s)([^*]+?)\1/;
  function setProse(el, text) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    var rest = String(text == null ? '' : text);
    if (!rest) return;
    // a bound on the loop as well as on the string: a pattern that somehow
    // matched empty would otherwise spin here for ever
    for (var guard = 0; guard < 500; guard++) {
      var m = EMPH.exec(rest);
      if (!m || !m[2]) break;
      // ` *not this* ` — a marker with a space in front of it is a stray
      // asterisk in the prose, not emphasis, and is left as it was written
      if (/\s$/.test(m[2])) {
        el.appendChild(document.createTextNode(rest.slice(0, m.index + m[0].length)));
        rest = rest.slice(m.index + m[0].length);
        continue;
      }
      if (m.index) el.appendChild(document.createTextNode(rest.slice(0, m.index)));
      var tag = m[1].length === 2 ? 'strong' : 'em';
      var mark = document.createElement(tag);
      mark.textContent = m[2];
      el.appendChild(mark);
      rest = rest.slice(m.index + m[0].length);
    }
    if (rest) el.appendChild(document.createTextNode(rest));
  }

  function markSelected(id, on) {
    if (!id) return;
    var els = atomsOf[id] || (elById[id] ? [elById[id]] : []);
    if (!atomsOf[id]) els.forEach(function (el) { el.classList.toggle('sel', on); });
  }

  function select(id, cluster) {
    markSelected(selected, false);
    selected = null;
    // A tap says which cluster it landed on, because on a touch screen there
    // is no hover to have worked it out already. Every other caller means the
    // last thing the pointer was over.
    selCluster = (cluster !== undefined ? cluster
                  : (lastProv && lastProv.el ? clusterOf(lastProv.el) : null)) || null;
    if (!id || !byId[id]) {
      selCluster = null;
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
    // Whose it was. For all but a handful of sub-units this is the territory
    // of the atom they are drawn in; for a Straits Settlement drawn off
    // somebody else's coast it is the colony it was governed as.
    var host = hostOf(rec, lastProv && lastProv.el);
    var head = sub || rec;
    // A sub-unit's `en` is written `Name — what it was`: Christmas Island —
    // annexed 1888, attached to the Straits Settlements in 1900. The card was
    // printing the whole string as the headline, so the name of the place ran
    // into a clause about it in bold. The name is the headline and the clause
    // is the first thing the card says about it.
    var split = splitGloss(nameOf(head));
    var primary = split.name;
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
    // and the country underneath, with every name it answers to — except for
    // the resistance areas, where it is the same words over again. The chip at
    // the top already says "Communist base areas & guerrilla zones"; repeating
    // it under Taihang and Taiyueh, in four scripts, said nothing the reader
    // had not read two lines earlier.
    var owner = (sub && rec.cat !== 'ccp')
      ? [nameOf(host)].concat(otherNames(host) || []).join('  ') : '';
    // and, where the name alone does not say it, what kind of rule that was
    if (owner && host.rule) owner += '  ·  ' + host.rule;
    $('.prov', infoBox).textContent = owner;
    $('.prov', infoBox).hidden = !owner;
    $('.when', infoBox).textContent = host.date || host.when || '';
    $('.when', infoBox).hidden = !(host.date || host.when);
    // This place first, then the group it belongs to. Only eleven of the 489
    // sub-units carry a note of their own, and the group's note used to be
    // moved up into the first slot whenever one did not — so a reader who
    // clicked Kanchanaburi was shown a description of Siam in the style that
    // says *this is the thing you clicked*. It stays where it belongs now, and
    // the gloss on the name is what the first slot gets instead: for most
    // sub-units that is the only sentence written about them, and it was
    // being spent on the headline.
    /* And the short line, if that is all there is. `short` is what the tooltip
       says when the pointer rests on a sub-unit, and for a table like Taiwan's
       forty-nine districts it is the whole of what has been written about most
       of them — the prefecture each was in and a clause about the ground. It
       was going to the tooltip and nowhere else, so a card opened on one of
       them had a name, a kanji line and a link, and no sentence at all. */
    var ownNote = sub ? (head.note || split.gloss || shortOf(head) || '')
                      : (rec.note || '');
    var groupNote = sub ? (host.note || '') : '';
    var own = $('.note-own', infoBox);
    var grp = $('.note-group', infoBox);
    setProse(own, ownNote);
    setProse(grp, groupNote);
    // The source shows even where a record has no prose of its own. More than
    // half the provinces and islands are a name and a coordinate and nothing
    // else, and for those the article is the only thing the card has to offer;
    // withholding the link because there was no sentence to put it under was
    // hiding it exactly where it was most use.
    /* A record that belongs to one reading of the occupation offers the other,
       so the two can be compared from the thing itself rather than only from
       the Layers panel. `srcOnly` already says which reading a record is part
       of, so nothing new has to be written down to know when to show this. */
    var flip = $('#info-flip', infoBox);
    if (flip) {
      var src = rec && rec.srcOnly;
      flip.hidden = !src;
      if (src) {
        flip.setAttribute('data-to', src === 'traced' ? 'nca' : 'traced');
        flip.textContent = 'Show ' + OCC_LABEL[src === 'traced' ? 'nca' : 'traced'];
      }
    }
    var ownLink = appendSource(own, sub ? head : rec);
    if (groupNote) appendSource(grp, sub ? host : null);
    own.hidden = !ownNote && !ownLink;
    grp.hidden = !groupNote;
    // Whose note the second block is. Without this the reader has two
    // paragraphs and no way of telling which one answers what they asked;
    // styles.css draws it from the attribute, so no extra element is needed.
    // Not when it would repeat the headline: Tibet is drawn as one province of
    // itself, and captioning its own note TIBET on a card headed Tibet is
    // noise rather than an answer.
    var groupName = nameOf(host);
    grp.setAttribute('data-group',
      (groupNote && groupName !== primary) ? groupName : '');
    collapseInfo();
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    hideTooltip();
    placeLabels();
    keepClear(id);
  }

  /* Somewhere to read further, at the foot of what a record says. The note
     itself is set with textContent and stays that way: the prose is hand-written
     and nothing in it should be able to put markup on the page. So the link is
     built as its own element and appended after the text, rather than written
     into the sentence. Records with nothing worth linking to — the two events
     with no article — simply have no `wiki` and get no line. */
  function appendSource(el, rec) {
    if (!el || !rec || !rec.wiki) return false;
    var a = document.createElement('a');
    a.className = 'note-src';
    a.href = rec.wiki;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Read more on Wikipedia';
    el.appendChild(a);
    return true;
  }

  /* On a phone the sheet opens as the name and nothing else, and this opens
   * the rest of it. A full description is several paragraphs and it was taking
   * most of the screen the moment you touched anything — you tapped a place to
   * see where it was and the map went behind the answer. The button is only
   * drawn at phone widths; on anything wider the sheet has always shown
   * everything and still does. Every new selection starts closed again. */
  function collapseInfo() {
    if (!infoBox) return;
    infoBox.classList.remove('open');
    var b = $('.more', infoBox);
    if (b) {
      b.textContent = 'More';
      b.setAttribute('aria-expanded', 'false');
      // nothing to open is nothing to offer
      var some = ['.prov', '.when', '.note-own', '.note-group'].some(function (s) {
        var el = $(s, infoBox);
        return el && !el.hidden && el.textContent;
      });
      b.hidden = !some;
    }
  }

  function toggleInfo() {
    var on = !infoBox.classList.contains('open');
    infoBox.classList.toggle('open', on);
    var b = $('.more', infoBox);
    if (b) {
      b.textContent = on ? 'Less' : 'More';
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    if (on) infoBox.scrollTop = 0;
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

  var HEX = /^#[0-9a-fA-F]{6}$/;

  /* The outline that goes with a chosen land colour.
     
     A step away from it rather than a fixed grey: on a light land the line has
     to be darker and on a dark land lighter, or it disappears into what it is
     drawing round. The two ends of that rule reproduce the stylesheet's own
     pairs to within three parts in 255 — #ded7c4/#a9a08b in the light scheme
     and #2b333c/#55606c in the dark — which is the check that it is the right
     rule and not merely a plausible one. */
  function monoLine(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.45;
    var f = light ? 0.75 : 0.22;
    var out = light ? [r * f, g * f, b * f]
                    : [r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f];
    return '#' + out.map(function (v) {
      return ('0' + Math.round(v).toString(16)).slice(-2);
    }).join('');
  }

  /* Written onto the drawing rather than into the sheet, so that clearing it
     hands the two properties back to the stylesheet — and with them the
     light-and-dark pair, which an inline value cannot express. */
  function applyMonoColour() {
    if (!svg) return;
    var c = state.monoColour;
    if (state.mono && c && HEX.test(c)) {
      svg.style.setProperty('--mono-land', c);
      svg.style.setProperty('--mono-line', monoLine(c));
    } else {
      svg.style.removeProperty('--mono-land');
      svg.style.removeProperty('--mono-line');
    }
  }

  function applyState() {
    // an epoch, a layer or a projection can all change which shapes are on
    // the map, and so what the opening view frames
    bumpLayout();
    scheduleUrl();
    var quizzing = state.mode === 'quiz';
    var showLabels = state.labels && !quizzing;
    // The switch drew nothing. Sub-units take their atom's fill *and* stroke,
    // so the seams between them were invisible and turning the layer on
    // changed nothing you could see — its only effect was that hovering named
    // a province, which is feedback you have to go looking for. It reads as a
    // switch that works sometimes. Now it draws the divisions.
    if (svg) svg.classList.toggle('admin-on', !!state.cats.territory);
    // A change of projection moves every coordinate in the document, so it is
    // done once here and not on the way past.
    if (svg && (state.projection || 'mercator') !== projMode) {
      // Hold the reader's place. The view is a rectangle in map coordinates
      // and those are about to mean something else, so it is remembered as
      // the ground in the middle and how much of the drawing is on screen.
      var mid = unproject(view.x + view.w / 2, view.y + view.h / 2);
      var frac = view.w / mapW;
      projMode = ['albers', 'laea'].indexOf(state.projection) >= 0
        ? state.projection : 'mercator';
      reprojectDocument();
      refitEdgeClips();
      var c = project(mid.lon, mid.lat);
      view.w = Math.max(minViewW(), Math.min(frac * mapW, fitView().w));
      view.h = view.w / (containerSize().w / containerSize().h);
      view.x = c.x - view.w / 2;
      view.y = c.y - view.h / 2;
      replaceInProjection();
    }
    drawGraticule();
    drawRelief();
    if (svg) svg.classList.toggle('hairline', !!state.hairline);
    // A layer going on or off changes what `litFor` hands back for the same
    // id, so every outline standing on screen is out of date whatever its
    // key says.
    bumpHi();
    if (svg) svg.classList.toggle('backs-off', !state.backs);
    syncBackings();
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

    // One reading of the occupation at a time. The map's own traced zone and
    // the Communist base areas over it, or the North China Area Army's own
    // pacified and un-pacified areas — never both, because they are two
    // authors answering two different questions about the same ground, and a
    // map that showed them together would be asserting neither.
    territories().forEach(function (t) {
      if (!t.srcOnly) return;
      var on = srcOK(t);
      (atomsOf[t.id] || []).forEach(function (el) {
        el.style.display = on ? '' : 'none';
      });
      // the occupied coast is a sibling of its atom, not a child of it
      $$('[data-edge-for="' + t.atoms[0] + '"]', svg).forEach(function (el) {
        el.style.display = on ? '' : 'none';
      });
    });

    /* Only the ground the course is about, when the reader asks for it. Every
       territory outside the list is taken off the map — not greyed, taken off,
       because the point is to leave sea around what is left.

       It runs last, after the rules that hide a layer for their own reasons,
       and it marks what *it* hid. Without the mark, putting the whole map back
       would also un-hide the administrative-only territories and whichever
       reading of the occupation is not showing: measured, 65 atoms stayed
       hidden when the switch went back on, because the first version could
       only hide and never show. */
    territories().forEach(function (t) {
      var keep = state.world || !!EAST_ASIA[t.id];
      var els = (atomsOf[t.id] || []).slice();
      $$('[data-edge-for="' + (t.atoms || [])[0] + '"]', svg).forEach(function (e) {
        els.push(e);
      });
      /* The rings in the outline layer go with their territory. They are drawn
         from an atom's own path and live in a different layer, so hiding the
         atom left them behind: Indochina's teal ring and Tuva's grey one were
         still traced over open sea with the country gone from under them. */
      $$('#sub-outlines [data-id="' + t.id + '"]', svg).forEach(function (e) {
        els.push(e);
      });
      if (hatchGroup) {
        $$('[data-id="' + t.id + '"]', hatchGroup).forEach(function (e) { els.push(e); });
      }
      /* And the filler under each atom, and the seam strips beside it. They
         are separate elements in separate layers, so a hidden country left a
         faint ghost of its own coastline where its filler still showed. */
      (t.atoms || []).forEach(function (a) {
        if (backingEls[a]) els.push(backingEls[a]);
        if (backingEdges[a]) els.push(backingEdges[a]);
        (seamEls[a] || []).forEach(function (sm) { els.push(sm); });
      });
      els.forEach(function (el) {
        if (!keep) {
          if (el.style.display !== 'none') el.setAttribute('data-world-off', '1');
          el.style.display = 'none';
        } else if (el.hasAttribute('data-world-off')) {
          el.removeAttribute('data-world-off');
          el.style.display = '';
        }
      });
    });

    syncMandateLines();

    /* The two client states, each on its own switch. Hidden they are not
       *removed*: the land is still there and still answers to the pointer,
       because Manchuria did not stop being Manchuria — it is painted the
       neutral this map uses for ground it makes no claim about, so a reader
       drawing their own account has a coastline to draw on and no assertion
       under it. `--c` is what every fill here reads, so overriding it on the
       atom and its filler and its seams reaches all of them at once. */
    ['manchukuo', 'mengjiang'].forEach(function (id) {
      var rec = byId[id];
      if (!rec) return;
      var shown = state[id] !== false;
      /* Hidden, it takes the Republic's own colour rather than a neutral grey.
         The ground did not become unclaimed when the reader switched the client
         state off — it became, on this map's own terms, the rest of China, and
         a grey slab in the north-east reads as a hole rather than as a country.
         Its provinces are the ones drawn there in 1942, which are the
         administrative divisions that ground actually had. */
      var host = byId.freechina || byId.china;
      var col = shown ? ((rec.c || (catInfo(rec.cat) || {}).c) || null)
                      : ((host && (host.c || (catInfo(host.cat) || {}).c)) || null);
      (rec.atoms || []).forEach(function (a) {
        [atomEls[a], backingEls[a], backingEdges[a]].forEach(function (el) {
          if (el) el.style.setProperty('--c', col || 'var(--inactive)');
        });
        (seamEls[a] || []).forEach(function (sm) {
          sm.style.setProperty('--c', col || 'var(--inactive)');
        });
      });
    });

    // the state exists on the 1942 map only, and so do its claim and the
    // whole-claim shape the hover outline traces. Its dotted claim goes with
    // the state itself: a claim drawn round nothing is a line with no subject.
    ['#mengjiang-claim', '#mengjiang-whole'].forEach(function (sel) {
      var el = svg && svg.querySelector(sel);
      if (el) el.style.display =
        (state.epoch === 'e1942' && state.mengjiang !== false) ? '' : 'none';
    });
    if (svg) svg.classList.toggle('mono', !!state.mono);
    applyMonoColour();
    /* Every switch that has two places to be pressed is written from `state`
       here, so the bar and the Layers dialog cannot disagree about the map in
       front of the reader. Topography is the first to have both; before this
       the dialog's tick left the bar's button looking off while the relief was
       plainly on the map. */
    syncLayerButtons();
    if (extentPath) {
      /* The perimeter is one continuous ring: down the inland edge of occupied
         China, out past the Kuriles, round the Pacific and back through the
         Indies and Burma. It used to be tied to the traced reading, because
         across China the dashed line *is* that zone's inland edge and drawing
         it beside the other reading's shading asserts an extent the reader has
         just chosen against.

         That argument holds for the China arc and for nothing else. The rest
         of the ring — which is most of it, and the only line on the map that
         says how far the empire reached — has no bearing on which reading of
         China is shown, and switching source silently took the whole Pacific
         perimeter away with it. Separating the two means cutting a 12,000-
         character ring at two points; until that is done the whole line is
         drawn under both readings, and the legend says it is one of several
         maps used. */
      /* And not when the map has been cut back to East Asia: the ring runs out
         past the Marshalls and round the Solomons, and with everything under
         it gone it is a dashed line drawn round empty sea. */
      extentPath.style.display =
        (state.epoch === 'e1942' && state.extent && state.world) ? '' : 'none';
    }
    if (indiaRiversGroup) {
      indiaRiversGroup.style.display = state.indiaRivers ? '' : 'none';
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

    var ol = $('#opt-labels');
    if (ol) ol.disabled = quizzing;   // the switch lives in the header now
    // the two 1942 controls in the bar come and go with the date, so they are
    // settled here rather than only when a layer button is pressed
    syncBarExtras();
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
    // earns no swatch in the legend — and neither does one the reader has
    // taken off the map. With the frame cut back to East Asia the key still
    // listed British, French, Dutch, American, Portuguese, Soviet and Thai,
    // seven colours that appeared nowhere on it.
    territories().forEach(function (t) {
      if (t.unseen || !srcOK(t)) return;
      if (!state.world && !EAST_ASIA[t.id]) return;
      used[t.cat] = true;
    });

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

  /* One way in and out of a date, so the header control and the shortcut in
     the Layers panel cannot drift apart. */
  function setEpoch(id) {
    if (!id || state.epoch === id) return;
    state.epoch = id;
    $$('#epoch-seg button').forEach(function (x) {
      x.classList.toggle('on', x.getAttribute('data-epoch') === id);
    });
    select(null);
    composeEpoch();
    applyState();
    showEpochBlurb();
  }

  /* Two readings of the occupation of China, and only one is drawn at a time.
     Changed from the Layers panel or from the card of a record that belongs to
     one of them; both come through here so the radios and the card cannot
     disagree about which is showing. */
  /* What "Japan, its colonies, and China" means, by id. China and Tibet; Japan
     with the Ryukyus, Korea, Taiwan and Karafuto; the leased ground on the
     China coast; and on the 1942 map the three shapes that stand on the same
     ground — Manchukuo, Mengjiang and the occupied zone with the Nanjing
     government over it. Anything not here is sea when the switch is off. */
  var EAST_ASIA = {
    /* China, in all the pieces this map draws it in. Xinjiang, Jehol, Chahar
       and Suiyuan are territories in their own right here — they were governed
       apart, and three of the four are what the 1930s were about — so naming
       "china" alone left a hole across the whole north-west. Dongsha and the
       Paracels are Chinese ground in the South China Sea. */
    china: 1, freechina: 1, xinjiang: 1, tibet: 1, ccp: 1,
    jehol: 1, chahar: 1, suiyuan: 1, paracel: 1, pratas: 1,
    /* Japan proper: the home islands, the Ryūkyūs, and the two chains that are
       as much Japan as Kyūshū is — the Bonins to the south and the Kuriles to
       the north-east. The South Seas Mandate is a Japanese colony too and is
       *not* here: it is two thousand miles into the Pacific, and the point of
       this frame is East Asia. */
    japan: 1, ryukyu: 1, ogasawara: 1, chishima: 1,
    chosen: 1, formosa: 1, karafuto: 1,
    /* the leased and ceded ground on the China coast */
    kwantung: 1, weihaiwei: 1, guangzhouwan: 1, hongkong: 1, macau: 1,
    /* and what stood on Chinese ground in each epoch */
    manchuria: 1, manchukuo: 1, mengjiang: 1, occupiedzone: 1, nanjinggov: 1,
    /* Both readings of the occupation, not only the traced one. Leaving the
       North China Area Army's pacified and un-pacified areas out of this list
       meant that a reader with the map cut back to East Asia who then chose
       the Army report saw *nothing appear at all* — the layer was there and
       this rule was hiding it. Reported as "I switched to the 1942 army
       occupation map and it didn't appear". */
    nca_pacified: 1, nca_unpacified: 1,
    /* the hatching that says a frontier was not agreed: it belongs to the
       frontiers that are still on screen, and without it Tibet's and
       Xinjiang's edges assert lines nobody had settled */
    contested: 1,
  };

  var OCC_LABEL = { traced: '1942 general occupation extent',
                    nca: 'the North China Area Army reading',
                    none: 'no occupation layer' };

  function setOccSource(v) {
    if (v !== 'traced' && v !== 'nca' && v !== 'none') return;
    /* Choosing to hide the occupation takes the base areas with it. They are
       the other half of the same argument — where the occupier's writ did not
       run — and a map with the resistance shaded and nothing to resist reads
       as a claim nobody made. Turned off, not disabled: a reader who wants
       them back has the switch. */
    if (v === 'none' && state.occSource !== 'none' && state.ccp) {
      state.ccp = false;
      var cc = $('#opt-ccp');
      if (cc) cc.checked = false;
    }
    /* And the other way for the same reason. Max is the reading that says how
       far the occupier's writ was claimed to run, and the base areas are where
       it did not: choosing the one and being shown it without the other is
       half an argument. So Max brings them back.

       Only on the way *to* Max, never while already there — a reader who has
       Max on screen and unticks the base areas has said something, and pressing
       a button that is already pressed must not argue with them. */
    if (v === 'traced' && state.occSource !== 'traced' && !state.ccp) {
      state.ccp = true;
      var cy = $('#opt-ccp');
      if (cy) cy.checked = true;
    }
    state.occSource = v;
    $$('#dlg-options [name="occ-src"]').forEach(function (r) {
      r.checked = (r.value === v);
    });
    $$('#occ-seg button').forEach(function (x) {
      x.classList.toggle('on', x.getAttribute('data-occ') === v);
    });
    // whatever was selected may be one of the shapes that has just gone
    if (selected && !srcOK(byId[selected])) select(null);
    applyState();
    redrawHighlight();
  }

  function otherEpoch() {
    var ids = (JMAP.EPOCHS || []).map(function (e) { return e.id; });
    return ids.filter(function (i) { return i !== state.epoch; })[0] || null;
  }

  function buildEpochControl() {
    var seg = $('#epoch-seg');
    JMAP.EPOCHS.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-epoch', e.id);
      b.textContent = e.en;
      // every control in the bar says what it does on hover; these are built
      // here rather than in the markup, so this is where theirs goes
      b.title = e.id === 'e1942'
        ? 'December 1942: the empire at its widest, and how Japan held it'
        : '1930: whose empire each place belonged to, on the eve of the Manchurian Incident';
      b.classList.toggle('on', e.id === state.epoch);
      b.addEventListener('click', function () { setEpoch(e.id); });
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
    $('.prov', infoBox).textContent = '';
    $('.prov', infoBox).hidden = true;
    $('.when', infoBox).textContent = '';
    $('.when', infoBox).hidden = true;
    setProse($('.note-own', infoBox), epoch.blurb);
    $('.note-own', infoBox).hidden = false;
    $('.note-group', infoBox).textContent = '';
    $('.note-group', infoBox).hidden = true;
    collapseInfo();
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

  /* Except for the islands off the home coast, which arrive earlier. Sado is
     a degree across and sits inside Niigata prefecture; below the threshold
     there is no Sado on the map at all — the base map draws it as part of the
     Japan landmass and Niigata's outline covers it, so a reader who clicked
     the island was told about the prefecture, and the same click a few turns
     of the wheel later told them about the island. This window is 62 rings,
     which is nothing beside the Ryukyus' nineteen hundred, so it can be
     afforded much sooner. It does not supersede the coarse coastline at that
     width — that stays on FINE_W — it is only drawn over it, in the same
     colour, and answers for itself. */
  var FINE_W_FOR = { japan: 420 };

  /* The file covers fourteen windows and they used to arrive together: one
     deep zoom anywhere grafted the Ryukyus, the Bonins, the mandate, the
     Gilberts, New Guinea, the Solomons and Wake at once and kept them all
     drawn for the rest of the visit. A reader looking at Okinawa was carrying
     the Pacific with them. Each window is grafted on its own now, when the
     view reaches it, and taken out again when the view leaves — its coarse
     shapes going back exactly as they were. */
  var fineState = 'none';           // none | loading | ready | failed
  /* `failed` used to be documented and never used — the catch put the state
     back to `none`, and `syncFine` runs on every settled pan and wheel, so a
     reader who was offline at deep zoom fired a fresh request for a 2 MB file
     every time they moved. Not the opposite mistake either: `failed` forever
     would mean a blip on the school wifi cost the fine coastline for the rest
     of the lesson. One attempt every half minute. */
  var fineFailedAt = 0;
  var FINE_RETRY_MS = 30000;
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
  /* The view, in the units the fine windows are written in.

     `data-fine` is written by the build and is therefore in **Mercator**
     units, while `view` is in whatever projection is on. Comparing them
     directly was right by accident for one of the three and wrong for the
     others: an Okinawa view in Albers sits at x≈1308, which falls outside the
     Mercator `ryukyu` box and inside the Mercator `nanyo` box — so the
     Ryukyus were dropped and five hundred and fifty-nine Caroline islands
     were grafted in their place, and the reader was left looking at empty sea.

     The frame is sampled rather than taken at its corners, because off the
     cylinder a parallel bows and a meridian leans and the corners no longer
     bound the view. Thirteen by thirteen, and only when something has settled
     — `syncFine` is on a 220 ms timer, not on every frame. */
  function viewMercBox() {
    if (projMode === 'mercator') {
      return [view.x, view.y, view.x + view.w, view.y + view.h];
    }
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    var N = 12;
    for (var i = 0; i <= N; i++) {
      for (var j = 0; j <= N; j++) {
        var ll = unproject(view.x + view.w * i / N, view.y + view.h * j / N);
        if (!isFinite(ll.lon) || !isFinite(ll.lat)) continue;
        var q = mercFwd(ll.lon, ll.lat);
        if (q.x < x0) x0 = q.x;
        if (q.x > x1) x1 = q.x;
        if (q.y < y0) y0 = q.y;
        if (q.y > y1) y1 = q.y;
      }
    }
    if (!isFinite(x0)) return [view.x, view.y, view.x + view.w, view.y + view.h];
    return [x0, y0, x1, y1];
  }

  function wantsFine() {
    var boxes = fineRegions();
    var out = [];
    var v = viewMercBox();
    var vw = v[2] - v[0];
    for (var k in boxes) {
      if (vw >= (FINE_W_FOR[k] || FINE_W)) continue;
      var b = boxes[k];
      if (v[0] < b[2] && v[2] > b[0] &&
          v[1] < b[3] && v[3] > b[1]) out.push(k);
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
    if (fineState === 'failed' &&
        (window.performance || Date).now() - fineFailedAt < FINE_RETRY_MS) return;
    fineState = 'loading';
    var parse = function (text) {
      fineDoc = new DOMParser().parseFromString(text, 'image/svg+xml');
      fineState = 'ready';
      then();
    };
    if (window.JMAP_INLINE_FINE) { parse(window.JMAP_INLINE_FINE); return; }
    fetch(asset('japan-empire-map-fine.svg'))
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(parse)
      .catch(function () {
        fineState = 'failed';
        fineFailedAt = (window.performance || Date).now();
      });
  }

  /* Every island in the windows currently grafted. An island's coarse copy is
     not always in the atom its fine copy belongs to — Tanegashima is drawn
     with the Ryukyus, as this map has always drawn it, but Natural Earth also
     carries it inside Japan's filler — so the sweep below goes over the whole
     of #land and not over the named atom alone. */
  function liveFineBoxes() {
    var out = [];
    // Zoomed out past the fine layer's own threshold, what is grafted stays
    // grafted but stops superseding anything: at that width a fine island is a
    // sub-pixel speck, and the coarse shape and the ring the base map draws
    // round an islet are what a reader needs back.
    if (!fineSupersedes) return out;
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
    // shapes are about to be superseded or restored; the outlines drawn from
    // them are stale either way
    bumpHi();
    coarseOrig.forEach(function (r) {
      // `r.d` is the Mercator original — see `remember` — so it is put through
      // whatever projection is on rather than written back as it was captured
      if (r.d !== null) {
        r.el.setAttribute('d', projMode === 'mercator' ? r.d : moveD(r.d));
      }
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

    /* What a shape looked like before any window pruned it — kept as the
       **Mercator** original rather than as whatever was on screen at the time.
       Stored as drawn, a shape captured under Mercator and put back under
       Albers came back a hundred units from where it belonged, while the
       shapes that had never been pruned were correctly in Albers, so the two
       halves of one coastline disagreed.

       `__d0` is the file's own string, set the first time anything reprojects
       the document; before that has happened the attribute is already
       Mercator, so the pre-prune string passed in is the right one. */
    var remember = function (node, d) {
      if (node.__coarse) return;
      node.__coarse = true;
      var base = d;
      if (base !== null && node.__d0 !== undefined) base = node.__d0;
      coarseOrig.push({ el: node, d: base });
    };

    /* Island by island: the replaced sub-paths are cut out of the shape and
       the rest is left drawing. A shape with nothing left steps aside whole.
       Doing it per shape instead would mean the filler — one path holding the
       entire Ryukyu arc — either kept drawing Okinawa's coarse coastline
       beside the fine one, or vanished and took with it the handful of islands
       too small for the fine file to carry. */
    var prune = function (node) {
      if (node.classList.contains('fine')) return;
      // A mandate outline is an annotation, not a coastline, and a finer
      // coastline does not supersede it. Without this the box round Guam
      // vanished the moment the Marianas' fine window opened — its one subpath
      // sits inside that window, so every part of it was "covered" and the
      // whole path was struck out. The three mandate lines are exposed to the
      // same thing wherever a fine window overlaps them, and the mandate over
      // the Carolines overlaps a window carrying 559 islands.
      if (node.classList.contains('mandate')) return;
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
    bumpHi();
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
    reprojectGraft(nodes);
    fineLive[key] = nodes;
    bumpLayout();               // a window of coastline is new geometry
    syncBackings();
    return true;
  }

  /* The names of the islands in a window go out with the window.
   *
   * They used not to. `gateLabels` hides a label whose shape has gone, which
   * looks like enough and is not: the entry stays in `labels`, `subLabels` and
   * `scalables`, and its `<text>` stays in the document. Coming back to the
   * region imports the rings *afresh*, so `subLabelled` has never seen them
   * and builds a second complete set of names over the first. Measured, with
   * names on, going between the Ryukyus and the Solomons: 909 labels at the
   * start and 4,305 after four round trips, +802 every time and none of it
   * ever given back, with `placeLabels` — which runs on every frame of every
   * pan — walking the whole pile.
   *
   * Only the shapes this window is taking out. Not "every label whose owner is
   * detached", which would also catch the province set held out of the
   * document by `setProvinceSource`: those elements come back, and dropping
   * their labels would leave them nameless for good, because the WeakSet would
   * still recognise the elements and never rebuild them. */
  function dropLabelsFor(els) {
    if (!els.length) return;
    els.forEach(function (e) { e.__dropping = 1; });
    var dropped = [];
    labels = labels.filter(function (L) {
      if (!L.owner || !L.owner.__dropping) return true;
      if (L.el && L.el.parentNode) L.el.parentNode.removeChild(L.el);
      dropped.push(L);
      return false;
    });
    if (dropped.length) {
      subLabels = subLabels.filter(function (F) {
        return !(F.owner && F.owner.__dropping);
      });
      dropped.forEach(function (L) { if (L.sc) L.sc.__dropping = 1; });
      scalables = scalables.filter(function (s) { return !s.__dropping; });
    }
    els.forEach(function (e) { delete e.__dropping; });
  }

  function dropFine(key) {
    var nodes = fineLive[key];
    if (!nodes) return false;
    bumpLayout();
    var named = [];
    nodes.forEach(function (n) {
      if (!n || n.nodeType !== 1) return;
      if (n.hasAttribute('data-prov')) named.push(n);
      if (n.querySelectorAll) {
        Array.prototype.push.apply(named, $$('[data-prov]', n));
      }
    });
    nodes.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    delete fineLive[key];
    dropLabelsFor(named);
    syncBackings();
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

  /* Whether the live windows are close enough to stand in for the coarse
     shapes. Not the same question as whether they are loaded. */
  var fineSupersedes = false;

  /* A window is given up only when another one asks for the room.
     Zooming out or panning away leaves what has been drawn where it is: the
     detail is already fetched and already grafted, and throwing it away means
     the reader who zooms back in waits again for the same shapes. So the drop
     pass runs only when something new is wanted — zoom into the Spratlys and
     they stay drawn however far out you go afterwards, until a zoom into the
     mandate takes their place. */
  function syncFine() {
    var want = wantsFine();
    var mb = viewMercBox();
    var deep = (mb[2] - mb[0]) < FINE_W;
    if (!want.length && !Object.keys(fineLive).length) {
      fineSupersedes = false;
      return;
    }
    if (want.length && fineState !== 'ready') {
      fetchFine(syncFine);
      return;
    }
    var changed = false;
    if (want.length) {
      var wanted = {};
      want.forEach(function (k) { wanted[k] = true; });
      Object.keys(fineLive).forEach(function (k) {
        if (!wanted[k]) changed = dropFine(k) || changed;
      });
      want.forEach(function (k) { changed = graftFine(k) || changed; });
    }
    // crossing the threshold changes what supersedes what, without changing
    // what is loaded
    if (deep !== fineSupersedes) {
      fineSupersedes = deep;
      changed = true;
    }
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
    var bag = (provSets[which][key] = provSets[which][key] || []);
    // once each: the same node is put away again every time the source is
    // switched back and forth, and a bag that grew each time would hand the
    // same path to `insertBefore` twice
    nodes.forEach(function (n) { if (bag.indexOf(n) < 0) bag.push(n); });
  }

  function setProvinceSource(which) {
    if (which !== 'enp' && which !== 'roc') return;
    provSource = which;
    // 'failed' as well as 'none': a request that fell over once used to leave
    // the reader with a control that said ROC, a map that showed ENP and no
    // way to ask again, because only `none` started a fetch.
    if (which === 'roc' && (rocState === 'none' || rocState === 'failed')) loadRoc();
    Object.keys(atomEls).forEach(function (key) {
      var el = atomEls[key];
      var wanted = provSets[which][key];
      var other = provSets[which === 'enp' ? 'roc' : 'enp'][key];
      // nothing to swap to: the atom keeps what it has
      if (!wanted || !wanted.length) return;
      if (other) other.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      /* And whatever the atom is carrying of its own.
         China's provinces are drawn in the base map file, not in the
         administrative sheet, so they were never in `provSets` and the swap
         had nothing to take out — the Republic's sheet went in *beside* them
         and China's atom held 42 provinces where it should hold 21, each
         boundary drawn twice and answering the pointer twice. They are
         remembered under the source they belong to on the way out, so
         switching back puts them back.
         Not the fine coastline: those wear `data-prov` too, they are the
         islands' own names rather than a province set, and `graftFine` owns
         their lifetime. */
      var back = which === 'enp' ? 'roc' : 'enp';
      var inPlace = $$('[data-prov]', el).filter(function (n) {
        return !(n.closest && n.closest('.fine'));
      });
      if (inPlace.length) {
        rememberProvinces(back, key, inPlace);
        inPlace.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      }
      var before = el.querySelector('circle');
      wanted.forEach(function (n) { el.insertBefore(n, before); });
      /* And into the projection that is on. A set held out of the document is
         invisible to `reprojectDocument`, which walks the SVG, so it comes
         back carrying whatever coordinates it had when it left — and a set
         that has never been in the document at all, which is every ROC
         province on first use, is still in the Mercator the file was drawn in.
         Measured, in Albers: ROC Gansu was drawn at x 548 where the same
         province in the other source sits at x 786. */
      reprojectGraft(wanted);
    });
    /* The province the card is describing and the one under the pointer may be
       nodes that have just been taken out of the document. `select` rebuilds
       the card head from `lastProv`, so without this the card can go on naming
       a province that is no longer on the map. */
    lastProv = null;
    setHotProv(null);
    applyState();
    if (selected) select(selected);
    redrawHighlight();
  }

  function loadRoc() {
    if (rocState === 'loading' || rocState === 'ready') return;
    rocState = 'loading';
    fetch(asset('japan-empire-map-roc.svg'))
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
        var forKey = g.getAttribute('data-for');
        rememberProvinces('enp', forKey, mine);
        /* Two fetches, and whichever lands last used to win. This one appends
           its provinces whatever the reader asked for, so a link that chose
           the Republic's sheet and got it first ended up with *both* sets in
           the document — 42 provinces inside China's atom where there should
           be 21, every one of them doubled in the hover outline, the cluster
           and the names. Measured on four loads out of four. If ROC is what is
           wanted and ROC is there, these are remembered and put away. */
        if (provSource !== 'enp' && provSets.roc[forKey] && provSets.roc[forKey].length) {
          mine.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
        } else {
          reprojectGraft(mine);
        }
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
    fetch(asset('japan-empire-map-admin.svg'))
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

  /* Three of these switch a kind of place on and off; the fourth switches the
     names of countries and regions, which is a property of the map rather than
     a kind of place. It carries `data-opt` instead of `data-cat` and is read
     from `state` directly. */
  function syncLayerButtons() {
    $$('#layer-seg button').forEach(function (b) {
      var opt = b.getAttribute('data-opt');
      var on = opt ? !!state[opt] : !!state.cats[b.getAttribute('data-cat')];
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    /* Topography now has two switches — this one and the tick in the Layers
       dialog — and a reader who uses one and then opens the other must not
       find it disagreeing with the map. The dialog is written from `state`
       here rather than only at startup. */
    var rc = $('#opt-relief');
    if (rc) rc.checked = !!state.relief;
    syncBarExtras();
  }

  /* The two 1942 controls in the bar. They exist on that map only — the
     perimeter and the occupation are both December 1942 and nothing else —
     and only where there is width for them, because the bar already carries
     six controls and a title and wraps before it truncates.

     `BAR_EXTRAS_MIN` is the width at which the bar still has room after the
     four layer buttons have taken their short labels. Below it the reader has
     the Layers dialog, which is where these have always been and where the
     wording is fuller. */
  var BAR_EXTRAS_MIN = 1120;

  function syncBarExtras() {
    var ext = $('#extent-seg'), occ = $('#occ-seg');
    if (!ext || !occ) return;
    var room = (window.innerWidth || 0) >= BAR_EXTRAS_MIN;
    /* Create and Load belong to both maps and to no epoch, so they follow the
       width and the mode and nothing else. They are the same two actions as
       the pair in the Layers dialog, which stays: a narrow screen has no room
       in the bar, and somebody who has learned where they live should still
       find them there. */
    var annSeg = $('#ann-seg');
    if (annSeg) annSeg.hidden = !(room && state.mode !== 'quiz');
    /* Topography is a fifth button in a bar that already wraps at four on a
       phone, so it rides in the bar on a wide screen only. The Layers dialog
       carries it at every width, which is where it was first and where
       somebody who has learned its place will still find it. */
    var topo = $('#btn-topo');
    if (topo) topo.hidden = !room;
    var here = state.epoch === 'e1942' && room && state.mode !== 'quiz';
    ext.hidden = !here;
    occ.hidden = !here;
    if (!here) return;
    var b = ext.querySelector('button');
    b.classList.toggle('on', !!state.extent);
    b.setAttribute('aria-pressed', state.extent ? 'true' : 'false');
    $$('#occ-seg button').forEach(function (x) {
      x.classList.toggle('on', x.getAttribute('data-occ') === state.occSource);
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

    // the 1942 pair in the bar, which are the same two settings as the ones
    // in Layers and go through the same places
    var extBtn = $('#extent-seg button');
    if (extBtn) {
      extBtn.addEventListener('click', function () {
        state.extent = !state.extent;
        var box = $('#opt-extent');
        if (box) box.checked = state.extent;
        syncLayerButtons();
        applyState();
        saveState();
      });
    }
    $$('#occ-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        setOccSource(b.getAttribute('data-occ'));
        syncLayerButtons();
        saveState();
      });
    });
    window.addEventListener('resize', syncBarExtras);

    // the three kinds of place, on and off. They are switches rather than a
    // one-of-three group, so they carry aria-pressed and not aria-checked
    $$('#layer-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var opt = b.getAttribute('data-opt');
        if (opt) {
          state[opt] = !state[opt];
        } else {
          var cat = b.getAttribute('data-cat');
          state.cats[cat] = !state.cats[cat];
          if (cat === 'territory' && state.cats[cat]) loadAdmin();
        }
        syncLayerButtons();
        applyState();
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
    if (optLabels) {
      optLabels.checked = state.labels;
      optLabels.addEventListener('change', function () { state.labels = optLabels.checked; applyState(); });
    }

    var optExtent = $('#opt-extent');
    optExtent.checked = state.extent;
    optExtent.addEventListener('change', function () {
      state.extent = optExtent.checked; syncLayerButtons(); applyState();
    });

    var optRivers = $('#opt-rivers');
    optRivers.checked = state.rivers;
    optRivers.addEventListener('change', function () { state.rivers = optRivers.checked; applyState(); });

    $$('#dlg-options [name="occ-src"]').forEach(function (r) {
      r.checked = (r.value === state.occSource);
      r.addEventListener('change', function () {
        if (r.checked) setOccSource(r.value);
      });
    });

    [['#opt-manchukuo', 'manchukuo'], ['#opt-mengjiang', 'mengjiang'],
     ['#opt-mono', 'mono'], ['#opt-world', 'world'],
     ['#opt-jpnames', 'jpNames']].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.checked = !!state[pair[1]];
      el.addEventListener('change', function () {
        state[pair[1]] = el.checked;
        /* What is drawn decides the frame, so changing it moves the frame.
           `bumpLayout` alone only clears the cache — the reader is still
           looking at wherever they were, which with the Pacific emptied is two
           thirds ocean. Measured: the land came to 61% of the view on a
           desktop and 209% on a phone, which is to say it did not fit at all.
           The view is re-fitted here, which is what "the bounding box can be
           smaller" asks for. */
        // one of them may be what is selected, and it is still selectable —
        // only its colour changes — so nothing is deselected here
        applyState();
        // the colour picker belongs to the single-colour switch and goes with it
        if (pair[1] === 'mono') syncMono();
        redrawHighlight();
        /* And then, for the world switch, the frame. In that order: the frame
           is measured from what is *drawn*, so the atoms have to be hidden or
           shown before it is worked out, and `bumpLayout` has to clear the
           cached one before `defaultView` is asked for it. Getting the order
           wrong leaves the reader looking at wherever they were, which with
           the Pacific emptied is two thirds ocean. */
        if (pair[1] === 'world') {
          bumpLayout();
          view = defaultView();
          applyView(true);
        }
      });
    });

    var optCcp = $('#opt-ccp');
    if (optCcp) {
      optCcp.checked = state.ccp;
      optCcp.addEventListener('change', function () {
        state.ccp = optCcp.checked;
        // the base area under the pointer may be the thing that has just gone
        if (selected && !srcOK(byId[selected])) select(null);
        applyState();
        redrawHighlight();
      });
    }

    // Removed from the Layers panel. The state and bit 10 of the layer code
    // still work, so an old address still means what it meant; this is null
    // now and the block below is skipped.
    /* The colour a single-colour map is drawn in. Hidden until the switch is
       on, like the relief's three sheets: a colour picker for something that is
       not on screen is a control with nothing to show for itself.

       `input` rather than `change`, so the map follows the picker while it is
       being dragged — the whole point of choosing a colour for drawing over is
       seeing it against the sea and the annotation colours as you go. */
    var monoPick = $('#opt-mono-colour');
    var monoReset = $('#opt-mono-reset');
    function syncMono() {
      var row = $('#mono-colour-row');
      if (row) row.hidden = !state.mono;
      if (monoReset) monoReset.hidden = !state.monoColour;
      if (monoPick && svg) {
        // what the picker should be showing: the reader's own choice, or
        // whatever the stylesheet is currently using
        var cur = state.monoColour
          || (getComputedStyle(svg).getPropertyValue('--mono-land') || '').trim();
        if (HEX.test(cur)) monoPick.value = cur;
      }
    }
    if (monoPick) {
      monoPick.addEventListener('input', function () {
        if (!HEX.test(monoPick.value)) return;
        state.monoColour = monoPick.value;
        applyMonoColour();
        if (monoReset) monoReset.hidden = false;
        scheduleUrl();
      });
      monoPick.addEventListener('change', saveState);
    }
    if (monoReset) {
      monoReset.addEventListener('click', function () {
        state.monoColour = null;
        applyMonoColour();
        syncMono();
        saveState();
        scheduleUrl();
      });
    }

    syncMono();

    var optRelief = $('#opt-relief');
    var reliefSeg = $('#relief-seg');
    /* The tick says whether, the segment says which. The segment is dead while
       the tick is clear — a reader choosing between three sheets none of which
       is on screen is choosing nothing — and each button says what it will
       cost, because that is the whole of the decision. */
    function syncReliefSeg() {
      if (!reliefSeg) return;
      reliefSeg.hidden = !state.relief || !!RELIEF_ONLY;
      var L = (JMAP.RELIEF && JMAP.RELIEF.levels) || [];
      $$('button', reliefSeg).forEach(function (b, i) {
        b.classList.toggle('on', i === state.reliefDetail);
        b.setAttribute('aria-pressed', i === state.reliefDetail ? 'true' : 'false');
        if (L[i]) {
          b.title = L[i].note + ' — about ' + L[i].kb + ' KB to fetch and '
            + L[i].mb + ' MB once decoded, sharp to about '
            + (Math.round(L[i].deg / 20 * 10) / 10) + 'x zoom';
        }
      });
    }
    if (optRelief) {
      optRelief.checked = state.relief;
      optRelief.addEventListener('change', function () {
        state.relief = optRelief.checked;
        syncReliefSeg();
        applyState();
        saveState();
      });
    }
    if (reliefSeg) {
      $$('button', reliefSeg).forEach(function (b, i) {
        b.addEventListener('click', function () {
          if (state.reliefDetail === i) return;
          state.reliefDetail = i;
          syncReliefSeg();
          applyState();
          saveState();
        });
      });
      syncReliefSeg();
    }

    var optGrat = $('#opt-graticule');
    if (optGrat) {
      optGrat.checked = state.graticule;
      optGrat.addEventListener('change', function () {
        state.graticule = optGrat.checked;
        applyState();
        saveState();
      });
    }

    $$('input[name="projection"]').forEach(function (r) {
      r.checked = (r.value === state.projection);
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.projection = r.value;
        applyState();
        /* An outline is stroked through a mask sized to the shape's bounding
           box, and the projection has just moved every shape out of the box
           the standing outline was cut to. Measured: select the Soviet Union
           in Mercator and switch to Albers, and 695 map units of the country
           lie outside the mask and are simply not drawn. `applyState` bumps
           the generation, which marks the slot stale but does not rebuild it;
           this is the rebuild, and it is here for the same reason the other
           layer switches call it. */
        redrawHighlight();
        saveState();
      });
    });

    var optIndiaRivers = $('#opt-india-rivers');
    if (optIndiaRivers) {
      optIndiaRivers.checked = state.indiaRivers;
      optIndiaRivers.addEventListener('change', function () {
        state.indiaRivers = optIndiaRivers.checked;
        applyState();
        saveState();
      });
    }

    var optBacks = $('#opt-backings');
    if (optBacks) {
      optBacks.checked = state.backs;
      optBacks.addEventListener('change', function () {
        state.backs = optBacks.checked;
        applyState();
        saveState();
      });
    }

    var optHair = $('#opt-hairline');
    if (optHair) {
      optHair.checked = state.hairline;
      optHair.addEventListener('change', function () {
        state.hairline = optHair.checked;
        applyState();
      });
    }

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
    // how to work the map, in its own dialog: About is what it is and where it
    // came from, and a reader wanting to know which button draws a line should
    // not have to scroll past the provenance to find out
    var helpBtn = $('#btn-help');
    if (helpBtn) helpBtn.addEventListener('click', function () { $('#dlg-help').showModal(); });
    $$('dialog').forEach(function (d) {
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });

    /* The title goes back to the map as it opens: the address bar carries the
       bbox and the layer code through every other navigation, so without this
       a reader who has followed a link into one corner has to edit the URL by
       hand. The href in the markup is `./`, which is right on a web server and
       wrong on a file:// path, so it is replaced here with the page's own path
       and nothing after it. */
    var brand = $('#brand');
    if (brand) {
      brand.setAttribute('href', window.location.pathname);
      brand.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = window.location.pathname;
      });
    }

    $('#info-close').addEventListener('click', function () { select(null); });
    var infoFlip = $('#info-flip');
    if (infoFlip) infoFlip.addEventListener('click', function () {
      setOccSource(infoFlip.getAttribute('data-to'));
    });
    var moreBtn = $('.more', infoBox);
    if (moreBtn) moreBtn.addEventListener('click', toggleInfo);
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
    annWire();
  }

  function zoomCentre(factor) {
    var r = container.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  }

  /* -------------------------------------------------------- annotations -- */

  /* A reader's own marks live in `annotate.js`, which is fetched the first
     time somebody asks for them — from Layers, or because the address carries
     a shared set. It is 15 KB gzipped, and most readers of this map will never
     draw anything on it; charging them for it on every visit to save one
     request from the few who do is the wrong trade, and it is the trade the
     lazily-loaded administrative sheet and fine coastlines already refuse.

     `map.js` hands it a host object and takes back a handful of hooks. Nothing
     there reaches into this file and nothing here knows what a feature is. */
  var annApi = null;
  var annLoading = null;

  function annHost() {
    return {
      svgEl: svgEl,
      project: function (lon, lat) { return project(lon, lat); },
      unproject: function (x, y) { return unproject(x, y); },
      clientToSvg: clientToSvg,
      svg: function () { return svg; },
      container: function () { return container; },
      addScalable: function (entry) { entry.ann = true; scalables.push(entry); },
      dropScalables: function () {
        scalables = scalables.filter(function (s) { return !s.ann; });
      },
      rescale: function () { if (lastScaleW > 0) rescale(); },
      /* Where the map is looking, as west/south/east/north. The annotations
         use it to remember the frame a set is meant to be seen from — the
         same four numbers the address bar carries. */
      viewBox: function () {
        var a = unproject(view.x, view.y + view.h);
        var b = unproject(view.x + view.w, view.y);
        if (!isFinite(a.lon) || !isFinite(b.lat)) return null;
        return [a.lon, a.lat, b.lon, b.lat];
      },
      zoomToBox: function (w, s2, e, n) {
        var v = viewForBox(w, s2, e, n);
        if (!v) return false;
        view = v;
        applyView(true);
        return true;
      },
      /* Room for the panel, asked for by the panel.

         Folding the legend from inside `annotate.js` was not enough: the
         legend's folded class is written by `buildLegend()` from `state.legend`,
         so the next `applyState` — a hover, a layer switch, anything — put it
         straight back. The state has to move, not the class. And the detail
         card is set aside at the same time: rail, legend and card share one
         column, and a reader who has just asked for the drawing tools is not
         reading a country's description.

         Both are one press from coming back, and neither is remembered as a
         preference: `wasLegend` puts the legend where it was when the panel
         closes, unless the reader has meanwhile decided for themselves. */
      makeRoom: function () {
        annWasLegend = state.legend;
        if (state.legend) { state.legend = false; buildLegend(); saveState(); }
        if (infoBox && !infoBox.hidden) {
          markSelected(selected, false);
          selected = null;
          infoBox.hidden = true;
          document.body.classList.toggle('panel-open', !quizBox.hidden);
          // and the outline goes with the card. Dropping `selected` alone left
          // the masked outline — the expensive one — standing on screen with
          // nothing selected, until something else happened to redraw it.
          redrawHighlight();
        }
      },
      giveBack: function () {
        if (annWasLegend && !state.legend) {
          state.legend = true; buildLegend(); saveState();
        }
        annWasLegend = false;
      },
      /* The map's own detail card, lent out — a reader's own mark has a name
         and a description, and the description belongs where every other
         description on this map is read rather than in a box of its own. */
      card: function (title, sub, prov, note) {
        if (!infoBox) return;
        markSelected(selected, false);
        selected = null;
        redrawHighlight();          // see makeRoom
        infoBox.hidden = false;
        var chip = $('.chip', infoBox);
        if (chip) { chip.textContent = 'Annotation'; chip.hidden = false; }
        $('.primary', infoBox).textContent = title || 'Annotation';
        $('.alt', infoBox).textContent = sub || '';
        $('.prov', infoBox).textContent = prov || '';
        $('.prov', infoBox).hidden = !prov;
        $('.when', infoBox).textContent = '';
        $('.when', infoBox).hidden = true;
        var own = $('.note-own', infoBox);
        own.textContent = note || '';
        own.hidden = !note;
        var grp = $('.note-group', infoBox);
        grp.textContent = '';
        grp.hidden = true;
        var flip = $('#info-flip');
        if (flip) flip.hidden = true;
        var src = $('.source', infoBox);
        if (src) src.hidden = true;
      },
      /* The map's own tooltip, lent out. A reader's mark has a name and a
         description of its own and this is where they are read — which is
         what lets the names be switched off the map without being lost. */
      tip: function (title, sub, cx, cy) {
        if (!tooltip) return;
        var key = 'ann|' + title + '|' + sub;
        tipAt = { x: cx, y: cy };
        if (key !== tipKey || tooltip.hidden) {
          tipKey = key;
          tooltip.innerHTML = '';
          tooltip.appendChild(document.createTextNode(title));
          if (sub) {
            var el = document.createElement('span');
            el.className = 'sub prov-note';
            el.textContent = sub;
            tooltip.appendChild(el);
          }
          tooltip.hidden = false;
        }
        if (!tipFrame) tipFrame = requestAnimationFrame(placeTooltip);
      },
      untip: function () { hideTooltip(); },
      /* What the map calls the place under the pointer, so that dropping a
         mark on Mukden can name it Mukden without the reader typing it. */
      placeAt: function (cx, cy) {
        try {
          var t = document.elementFromPoint(cx, cy);
          var got = t ? pick(t, cx, cy) : null;
          if (!got || !got.hit) return '';
          var prov = got.hit.rec.kind === 'territory' ? provinceAt(got, cx, cy) : null;
          var rec = (prov && prov.rec) || got.hit.rec;
          return splitGloss(nameOf(rec)).name || '';
        } catch (err) { return ''; }
      },
    };
  }

  function annLoad(then) {
    if (annApi) { if (then) then(annApi); return; }
    // the single-file build inlines it, and a file:// page cannot fetch a
    // neighbour, so a module that is already here is simply used
    if (window.JMAP_ANNOTATE) {
      annApi = window.JMAP_ANNOTATE(annHost());
      if (then) then(annApi);
      return;
    }
    if (annLoading) { annLoading.push(then); return; }
    annLoading = [then];
    var done = function (ok) {
      var queue = annLoading;
      annLoading = null;
      queue.forEach(function (f) { if (f) f(ok ? annApi : null); });
    };
    var el = document.createElement('script');
    el.src = asset('annotate.js');
    el.onload = function () {
      if (!window.JMAP_ANNOTATE) { done(false); return; }
      annApi = window.JMAP_ANNOTATE(annHost());
      done(true);
    };
    el.onerror = function () {
      done(false);
      window.alert('The annotation tools could not be loaded. '
        + 'They are in annotate.js, which has to sit beside index.html.');
    };
    document.head.appendChild(el);
  }

  /* Which backings are a second copy of ground that is already drawn.

     Asked at run time rather than at build time because the answer changes
     when the administrative file arrives: until it does, Siam's atom is an
     empty group and its backing is the whole country; after it, the atom
     carries seventy changwat and the backing is underneath all of them.

     **The fine coastlines are not that, and treating them as if they were lost
     Japan.** Its atom is one of the empty ones — the backing is what draws
     Honshu, Hokkaido, Kyushu and Shikoku — and the fine file has a window of
     62 small rings for the Japanese coast that grafts at a shallower zoom than
     any other. The moment it arrived the atom held paths, the backing was
     called redundant and hidden, and what was left of Japan was those 62
     islets: the painted area went from 133,425 square units to 495 and stayed
     there for the rest of the visit, because nothing recomputed this on the
     way back out. A reader who zoomed anywhere near Japan lost the country.

     So only a division counts. A grafted coastline carries `fine` and is
     passed over, and this is re-run whenever a window is grafted or dropped
     rather than only when a layer is switched. */
  /* Has this atom any shape of its own, or is its backing the only thing
     drawing the country?

     Asked in three places — whether a backing is redundant, whether it belongs
     in a selection outline, and whether it takes the hatching — and it was
     written out three times, so the same mistake had to be found three times.
     It is one function now.

     A grafted fine coastline does not count. Japan's atom is one of the empty
     ones: the backing draws Honshu, Hokkaido, Kyushu and Shikoku, and the fine
     file has a window of 62 small rings for the Japanese coast. Counting those
     as "shapes of its own" hid the backing, and then — after that was fixed —
     dropped it from the selection outline too, so tapping Japan drew a line
     round Sado, Oki, Awaji, Tsushima and the Gotō islands and nothing round
     the country. */
  function ownShapes(atom) {
    if (!atom) return 0;
    if (atom.tagName === 'path') return 1;
    return $$('path:not(.superseded):not(.fine)', atom).length;
  }

  function syncBackings() {
    if (!svg) return;
    Object.keys(backingEls).forEach(function (k) {
      backingEls[k].classList.toggle('redundant', !!ownShapes(atomEls[k]));
    });
  }

  /* What version is actually running.

     `index.html` is cached for ten minutes and `map.js` for seven days, so a
     reader who returns gets a fresh page — carrying a fresh version number —
     over a `map.js` that may be a week old, and the About dialog reports the
     page's number with complete confidence. A fix that was pushed then reads
     as a fix that did not work, and the version number backs the reporter up.

     `JEM_VERSION` is stamped into this file by `build_texts.py`. Where the two
     disagree the dialog says so, which turns a silent wrong answer into a
     visible one and tells the reader exactly what to do about it. */
  function stampVersion() {
    var el = $('#jem-version');
    if (!el || typeof JEM_VERSION === 'undefined') return;
    var page = (el.textContent || '').trim();
    if (page === JEM_VERSION) return;
    el.textContent = JEM_VERSION;
    /* Which of the two is stale is not knowable from here, and the first
       wording guessed. A server ignores the `?v=` — the filename is unchanged
       — so an old page asking for `map.js?v=1.20` is handed the *current*
       script, and the running code is then newer than the page that asked for
       it. The opposite happens when the page is fresh and the script is held
       in cache. Both are fixed by the same reload, so the note reports the two
       numbers and does not pretend to know which way round it is. */
    var note = document.createElement('span');
    note.className = 'version-stale';
    note.textContent = ' — this page was built for ' + page
      + ', so one of the two is coming from your browser\'s cache.'
      + ' A hard reload will put them in step.';
    el.parentNode.appendChild(note);
  }

  function annWire() {
    stampVersion();
    /* The drawing tools need a panel with room for four tools, eight style
       controls, four fields and a list, and a map big enough to draw on beside
       it. Below the rail's own breakpoint there is neither: the panel becomes a
       sheet over the map and the reader is drawing through a letterbox. The
       buttons are withdrawn rather than left to disappoint, and the line says
       so. */
    var ANN_MIN_W = 700;

    /* The tools are offered at every width. They used to be taken away below
       700px and replaced with a line saying they were not supported, which was
       not true — the panel docks to the foot of a phone, every tool works with
       a finger, and the annotation suite tests exactly that. What is true is
       that drawing a coastline through a thumb is harder than through a mouse,
       so the note says so and the buttons stay. */
    function syncAnnRoom() {
      var row = $('#ann-row'), note = $('#ann-toosmall');
      if (!row || !note) return;
      row.hidden = false;
      note.hidden = (window.innerWidth || 0) >= ANN_MIN_W;
    }
    syncAnnRoom();
    window.addEventListener('resize', syncAnnRoom);

    var create = $('#ann-create'), load = $('#ann-load'), file = $('#ann-file');
    var shut = function () {
      var dlg = $('#dlg-options');
      if (dlg && dlg.close && dlg.open) dlg.close();
    };
    if (create) create.addEventListener('click', function () {
      shut();
      annLoad(function (api) { if (api) api.open(); });
    });
    // the same two actions from the bar, on a screen wide enough to carry them
    var barCreate = $('#bar-ann-create');
    if (barCreate) barCreate.addEventListener('click', function () {
      annLoad(function (api) { if (api) api.open(); });
    });
    if (load && file) {
      var pickFile = function () {
        file.value = '';
        file.removeAttribute('data-merge');
        file.click();
      };
      load.addEventListener('click', pickFile);
      var barLoad = $('#bar-ann-load');
      if (barLoad) barLoad.addEventListener('click', pickFile);
      file.addEventListener('change', function () {
        var merge = file.hasAttribute('data-merge');
        file.removeAttribute('data-merge');
        var chosen = file.files && file.files[0];
        if (!chosen) return;
        shut();
        annLoad(function (api) {
          if (!api) return;
          api.open();
          api.loadFile(chosen, merge);
        });
      });
    }
    // a shared set in the address opens itself
    var code = null;
    try { code = new URLSearchParams(window.location.search).get('ann'); }
    catch (err) { code = null; }
    if (code) annLoad(function (api) { if (api) api.fromUrl(code); });
  }

}());
