












(function () {
  'use strict';
  var JEM_VERSION = '365';
























  var LEAN = ['admin.js', 'annotate.js', 'trains.js', 'air-play.js'];
  function asset(name) {
    var table = window.JEM_ASSETS || null;
    var key = (table && table[name]) || null;


    if (LEAN.indexOf(name) >= 0) name = 'lean/' + name;
    if (!key && typeof JEM_VERSION !== 'undefined' && JEM_VERSION) key = JEM_VERSION;
    return key ? name + '?v=' + encodeURIComponent(key) : name;
  }












  var scriptLoads = {};
  function loadScript(name) {
    if (!scriptLoads[name]) {
      scriptLoads[name] = new Promise(function (resolve, reject) {
        var el = document.createElement('script');
        el.src = asset(name);
        el.onload = function () { resolve(name); };
        el.onerror = function () {
          delete scriptLoads[name];
          reject(new Error(name + ' could not be loaded'));
        };
        document.head.appendChild(el);
      });
    }
    return scriptLoads[name];
  }





  function fetchText(name) {
    return fetch(asset(name)).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    });
  }
  function fetchSvg(name) {
    return fetchText(name).then(function (text) {
      return new DOMParser().parseFromString(text, 'image/svg+xml');
    });
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var DOT_R = 5.5;        // marker radius, in screen pixels








  var SIZES = ['small', 'medium', 'large', 'largest'];
  var SIZE_R = [2.5, 3.4, 4.4, 5.8];
  var HIT_R_TOUCH = 22;   // finger-sized tap target
  var HIT_R_MOUSE = 13;
  var TAP_SLOP = 9;       // px of movement still counted as a tap
  var DBL_MS = 320;       // ms between two taps for them to be one gesture
  var DBL_SLOP = 32;      // px apart the two may land and still be one
  var DBL_ZOOM = 1.9;     // what one double tap is worth, as the wheel has it





  var ZOOM_DRAG_PX = 190;
  var TERR_PX = 13.5;     // label sizes, in screen pixels
  var SITE_PX = 11.5;
  var SUB_PX = 10.5;      // provinces and islands, a step under a country











  var GROUP_PX = 12;
  var STA_PX = 8.5;       // stations, the smallest thing on the map that reads
  var STA_SQ = 5;         // the square, in screen pixels: a stop, not a town
  var FEAT_PX = 11;       // seas, deserts, plateaus: the physical map
  var EPOCH_1930_CUTOFF = 1930;   // the 1930 sheet's own year
  var EVENT_1930_FROM   = 1910;   // and how far back its detail reaches
  var LANGS = ['en', 'ja', 'zh', 'ko'];

  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var HIT_R = coarse ? HIT_R_TOUCH : HIT_R_MOUSE;




  var state = {
    mode: 'explore',
    epoch: JMAP.DEFAULT_EPOCH,
    level: 1,
    lang: 'en',







    cats: { city: false, battle: false, territory: false, poi: false },
    labels: false,











    labelCats: { territory: true, city: true, sub: true, poi: true, feature: true },


















    hideTerr: {},
    legendPick: false,
    extent: true,
    rivers: true,





    hairline: false,












    backs: false,




    indiaRivers: false,


    twRail: false,
    krRail: false,
    kfRail: false,
    burmaRail: false,
    jpRail: false,
    jpStations: false,
    air: false,
    krStations: false,
    twStations: false,
    kfStations: false,





    trainTools: false,




    twSugar: false,


    railZoom: false,












    themeId: '',










    pop: {},







    theme: 'auto',

    graticule: false,








    relief: false,




    reliefDetail: 0,



    projection: 'mercator',






    occSource: 'traced',






    manchukuo: true,
    mengjiang: true,




    airAll: false,








    airNames: true,



    airSets: {},
    hanLabels: false,












    jpNames: false,
    mono: false,                    // every state and province one grey




    monoColour: null,




    colours: {},









    world: true,





    ccp: true,


    legend: window.innerWidth >= 700 && window.innerHeight >= 600,
  };

  var container = $('#map-container');   // pointer target and size reference
  var svgHost = $('#map-svg');           // the SVG's own box, so the zoom

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







  var pinFilter = null;
  var PIN_BLUR_PX = 2.2;












  var PIN_CASE_PX = 2.6;
  var ownedDefs = { hi: [], sub: [] };
  var proj = null;
  var mapW = 0, mapH = 0;


  var mapW0 = 0, mapH0 = 0;

  var atomEls = {};

  var backingEls = {};       // atom id -> element






  var backingEdges = {};     // atom id -> the stroke-only path along its edge
  var seamEls = {};          // atom id -> [elements] in the seam layer
  var byId = {};          // item id -> record (current epoch territories + sites)
  var elById = {};        // item id -> a representative element (for flashing)
  var atomsOf = {};       // item id -> [elements]
  var sitePos = {};       // site id -> {x, y} in map units
  var scalables = [];     // {el, x, y} kept at constant screen size
  var labels = [];        // {rec, el, x, y, dy, size, w, h}
  var selected = null;




  var trainCardWaiting = -1;









  var pinned = null;    // { id, cluster, provEl } — see pinnedEls()














  function loadState() { /* the defaults above are the load */ }

  function saveState() { /* the URL is the store */ }














  function localWins(rec) {
    if (!rec || !rec.local) return false;
    if (!state.jpNames) return true;
    return !!rec.jpfrom && rec.jpfrom !== state.epoch;
  }

  function shown(rec) {
    if (!rec) return rec;





    var over = rec.id && JMAP.EPOCH_OVERRIDES && JMAP.EPOCH_OVERRIDES[rec.id];
    over = over && over[state.epoch];
    var swap = localWins(rec);
    if (!over && !swap) return rec;
    var out = {};
    Object.keys(rec).forEach(function (k) { out[k] = rec[k]; });
    if (over) Object.keys(over).forEach(function (k) { out[k] = over[k]; });

    if (localWins(out)) out.en = out.local;
    return out;
  }







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





  function otherNames(rec, headline) {
    if (!rec) return '';
    var r = shown(rec);




    var best = {};
    var reads = {};
    var order = [];
    ['orig', 'ja', 'zh', 'ko', 'en'].forEach(function (k) {
      var v = r[k];
      if (!v) return;
      var id = nameKey(v);



      if (/[（(]/.test(v)) reads[id] = true;
      if (!(id in best)) { best[id] = v; order.push(id); }
      else if (v.length > best[id].length) best[id] = v;
    });
    var keys = order.slice();
    var head = nameKey(headline || nameOf(r));
    return order
      .filter(function (id) {


        if (head.indexOf(id) >= 0) return false;





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








































  var KANA_ANY = /[\u30a0-\u30f5\u30f7-\u30fa\u3040-\u309f]/;






  function charsOf(v) {
    var raw = String(v || '').trim()
      .replace(/\s*[（(]([^）)]*)[）)]\s*$/, function (all, inner) {
        return /[\u3400-\u9fff]/.test(inner) ? all : '';
      })
      .trim();
    if (!raw) return '';
    var probe = raw.replace(/[\u30f6\u30fb\u30fc\u3000\s\u00b7-]/g, '');
    if (!probe || KANA_ANY.test(probe)) return '';
    return /[\u3400-\u9fff]/.test(probe) ? raw : '';
  }

  function hanOf(rec) {
    if (!rec) return '';














    var over = rec.id && JMAP.EPOCH_OVERRIDES && JMAP.EPOCH_OVERRIDES[rec.id];
    over = over && over[state.epoch];
    if (over) {
      var fixed = charsOf(over.ja) || charsOf(over.zh);
      if (fixed) return fixed;
    }
    var r = shown(rec);







    return charsOf(r.ja_kyu) || charsOf(r.ja) || charsOf(r.zh) || '';
  }




  function splitGloss(name) {
    var cut = name ? name.indexOf(' — ') : -1;
    if (cut < 0) return { name: name || '', gloss: '' };
    var gloss = name.slice(cut + 3).trim();



    if (gloss) {
      gloss = gloss.charAt(0).toUpperCase() + gloss.slice(1);
      if (!/[.!?…]$/.test(gloss)) gloss += '.';
    }
    return { name: name.slice(0, cut), gloss: gloss };
  }

  function territories() { return JMAP.TERRITORIES[state.epoch]; }






















  function pointType(rec) {
    if (!rec) return null;
    if (rec.kind === 'station') return 'city';   // a station is a place to stop
    if (rec.kind === 'gaz') return 'city';
    return rec.cat || null;
  }













  function pointSubtype(rec) {
    if (!rec) return '';
    if (rec.subtype) return rec.subtype;
    if (rec.kind === 'station') return 'station';
    return '';
  }








  function pointTier(rec) {
    if (!rec) return null;
    if (rec.size) {
      var i = SIZES.indexOf(String(rec.size).trim());
      if (i >= 0) return i;
    }
    return rec.t !== undefined ? rec.t : null;
  }









  function pointAlways(rec) {
    return !!(rec && (rec.always || rec.a !== undefined));
  }





  function zoomShows(rec) {
    if (pointAlways(rec)) return true;
    var t = pointTier(rec);
    return t === null || t >= gazMinTier();
  }


  function pointR(rec) {
    var t = pointTier(rec);
    return t === null ? DOT_R : (SIZE_R[t] || SIZE_R[0]);
  }

  function catList() { return JMAP.CATEGORIES[state.epoch]; }





  var STATION_CATS = {
    station: { id: 'station', en: 'Railway station', ja: '\u505c\u8eca\u5834',
               zh: '\u8eca\u7ad9', ko: '\uc5ed', c: '#6b4a2f' },
    halt: { id: 'station', en: 'Railway halt', ja: '\u4e57\u964d\u5834',
            zh: '\u7c21\u6613\u7ad9', ko: '\uac04\uc774\uc5ed', c: '#6b4a2f' },
    'temporary halt': { id: 'station', en: 'Temporary halt',
                        ja: '\u4eee\u4e57\u964d\u5834', zh: '\u81e8\u6642\u7ad9',
                        ko: '\uc784\uc2dc\uc5ed', c: '#6b4a2f' },
    yard: { id: 'station', en: 'Goods yard', ja: '\u8ca8\u7269\u99c5',
            zh: '\u8ca8\u904b\u7ad9', ko: '\ud654\ubb3c\uc5ed', c: '#6b4a2f' },
  };

  function catInfo(id) {
    var all = catList().concat(JMAP.SITE_CATEGORIES);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }














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





  function srcOK(rec) {
    if (!rec) return true;




    if (rec.id === 'ccp' && !state.ccp) return false;
    return !rec.srcOnly || rec.srcOnly === state.occSource;
  }






  function terrHidden(id) { return !!(id && state.hideTerr[id]); }

  function inQuiz(rec) {
    if (!srcOK(rec)) return false;
    if (rec.kind === 'site') return rec.lvl <= state.level && state.cats[rec.cat] && siteInEpoch(rec);
    return rec.lvl <= state.level && state.cats.territory;
  }






  function siteVisible(s) {


    if (s.kind === 'station') return stationsOn(s.sys) && stationShown(s);
    if (s.kind === 'gaz') return gazVisible(s);




    return state.cats[pointType(s)] && siteInEpoch(s) && zoomShows(s);
  }

  function gazVisible(s) {
    return state.cats[pointType(s)] && s.epoch === state.epoch && zoomShows(s);
  }



















  var LEVEL_4_ZOOM = 12;

  function labelLevel() {
    var bonus = view.w < mapW / LEVEL_4_ZOOM ? 3
      : (view.w < mapW / 10 ? 2 : (view.w < mapW / 3 ? 1 : 0));
    return Math.min(4, state.level + bonus);
  }













  var SHORT_MAX = 88;
  function shortOf(rec) {
    if (!rec) return '';
    var r = shown(rec);
    if (r.short) return r.short;
    var gloss = splitGloss(nameOf(r)).gloss;
    return gloss && gloss.length <= SHORT_MAX ? gloss : '';
  }
















  function stationLabel(rec) {


    if (state.hanLabels && rec && rec.han) return rec.han;
    var head = state.jpNames ? rec.jpro : rec.locro;


    return head || rec.han || rec.locro || rec.jpro || '';
  }

  function mapLabel(rec) {











    if (rec && rec.kind === 'station') return stationLabel(rec);

    if (rec && rec.kind === 'popval') return rec.txt;





    if (state.hanLabels) {
      var han = hanOf(rec);
      if (han) return han;
    }
    var r = shown(rec);
    if (r && r.label && state.lang === 'en') {
      return r.label === '-' ? '' : r.label;
    }
    var name = nameOf(rec);
    if (state.lang !== 'en') return name;







    name = splitGloss(name).name;
    return name.replace(/\s+\([^()]*\)\s*$/, '');
  }












  function featureLevel() {
    var home = defaultView().w;
    if (view.w < home / 8) return 4;
    if (view.w < home / 4) return 3;
    if (view.w < home / 2) return 2;
    if (view.w < home / 1.35) return 1;
    return 0;
  }


















  var LABEL_CATS = [
    { id: 'territory', place: 64,   label: 'Country and colony names',
      kinds: ['territory'] },
    { id: 'city',      place: 128,  label: 'City names',
      kinds: ['gaz'], cat: 'city' },
    { id: 'sub',       place: 256,  label: 'Province names',
      kinds: ['sub'] },
    { id: 'poi',       place: 512,  label: 'Places of interest',
      kinds: [], cat: 'poi' },
    { id: 'feature',   place: 1024, label: 'Seas, mountains and other natural features',
      kinds: ['feature'] },
  ];





  function labelsOn(cat) {
    return !!(state.labels && state.mode !== 'quiz'
              && (!cat || state.labelCats[cat] !== false));
  }

  function labelVisible(rec) {



















    if (rec && rec.kind === 'station') {
      if (!stationsOn(rec.sys) || !stationShown(rec)) return false;
      return !!(labelsOn() && latSpan() <= STATION_LABEL_LAT);
    }


    if (rec && rec.kind === 'sub') return subLabelsWanted() && subFits(rec);




    if (rec && rec.kind === 'popval') return popValueFits(rec);




    if (rec && rec.kind === 'feature') {
      return labelsOn('feature') && rec.lvl <= featureLevel();
    }






    if (rec.kind === 'territory') {
      if (!labelsOn('territory') || !srcOK(rec)) return false;

      if (terrHidden(rec.id)) return false;




      if (rec.within && !state.cats.territory) return false;
      return rec.lvl <= labelLevel() && (!rec.adminOnly || state.cats.territory);
    }


















    if (rec.kind === 'gaz') {
      if (!labelsOn('city') || labelLevel() < 2) return false;













      var twin = siteById[rec.id];
      if (twin && siteVisible(twin)) return false;
      var dot = gazFor(rec.id);
      return !!dot && gazVisible(dot);
    }





    var lc = rec.cat === 'city' ? 'city' : rec.cat === 'poi' ? 'poi' : '';
    return labelsOn(lc)
      && state.cats[rec.cat] && rec.lvl <= labelLevel() && siteInEpoch(rec);
  }

  function quizPool() {
    return territories().concat(JMAP.SITES).filter(inQuiz);
  }



  loadState();




  if (window.JMAP_INLINE_SVG) {



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
    checkLayerBits();
    svgHost.innerHTML = markup;
    svg = svgHost.querySelector('svg');
    if (!svg) { showLoadError(); return; }

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');










    if (/Apple/.test(navigator.vendor || '')) svg.classList.add('saf');
    var t0 = svg.querySelector(':scope > title');
    if (t0) {
      if (!svg.getAttribute('aria-label')) {
        svg.setAttribute('aria-label', t0.textContent);
        svg.setAttribute('role', 'img');
      }
      t0.parentNode.removeChild(t0);
    }

    var vb = svg.getAttribute('viewBox');
    var meta = svg.querySelector('#proj');

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





    ['ocean', 'frame'].forEach(function (id) {
      var r = svg.querySelector('rect#' + id);
      if (!r) return;
      var pth = svgEl('path', { id: id });
      r.parentNode.replaceChild(pth, r);
    });
    reframe();

    markersGroup = svg.querySelector('#markers');





    hiDefs = svgEl('defs', { id: 'hi-defs' });
    svg.appendChild(hiDefs);



    subsLiftLayer = svgEl('g', { id: 'subs-lift' });
    svg.appendChild(subsLiftLayer);








    mandateLiftLayer = svgEl('g', { id: 'mandate-lift' });
    svg.appendChild(mandateLiftLayer);

    subOutlineLayer = svgEl('g', { id: 'sub-outlines' });
    svg.appendChild(subOutlineLayer);













    if (markersGroup) svg.appendChild(markersGroup);

    highlightLayer = svgEl('g', { id: 'highlight' });
    svg.appendChild(highlightLayer);
    extentPath = svg.querySelector('#extent-1942');
    riversGroup = svg.querySelector('#rivers');
    indiaRiversGroup = svg.querySelector('#india-rivers');
    twRailGroup = svg.querySelector('#tw-rail');
    krRailGroup = svg.querySelector('#kr-rail');
    kfRailGroup = svg.querySelector('#kf-rail');
    burmaRailGroup = svg.querySelector('#burma-rail');
    buildYellow1938();
    buildAir();
    buildPopRows();
    buildLayerDls();
    buildLabelRows();
    buildGazetteer();
    hatchGroup = svg.querySelector('#hatching');

    $$('.atom', svg).forEach(function (el) { atomEls[el.id.replace(/^a-/, '')] = el; });








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




      var owner = svg.getElementById('a-' + el.getAttribute('data-for'));
      if (owner) owner.classList.add('has-fill');
    });


    $$('[data-edge-for]', svg).forEach(function (el) {
      backingEdges[el.getAttribute('data-edge-for')] = el;
    });


    $$('#seams [data-for]', svg).forEach(function (el) {
      (seamEls[el.getAttribute('data-for')] = seamEls[el.getAttribute('data-for')] || []).push(el);
    });
    buildAtomHits();

    JMAP.SITES.forEach(function (s) { s.kind = 'site'; });









    var shared = readUrl();
    tidyUrl();

    buildMarkers();
    buildSiteLabels();
    nudgeOverlaps();
    buildEpochControl();
    syncLayerButtons();

    wireControls();
    wirePointer();

    composeEpoch();




    if (Object.keys(state.colours).length) applyColours();
    applyState();
    view = (shared && viewForBox(shared[0], shared[1], shared[2], shared[3]))
      || defaultView();
    applyView(true);

    applyPhoneLayout();







    if (state.cats.territory) loadAdmin();



    if (urlProvSource === 'roc') {
      var rocRadio = $('#prov-roc');
      if (rocRadio) rocRadio.checked = true;
      setProvinceSource('roc');
    }





    try {
      if (window.localStorage.getItem('jmap-admin')) loadAdminPanel();
    } catch (err) { /* private mode; the panel is not important enough to care */ }

    window.addEventListener('resize', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);




    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(function () { bumpLayout(); });

      uiObserver = ro;
      ['#legend', '#zoom-controls', '#corner-controls', '#info', '#quiz',
       '#train-bar'].forEach(function (sel) {
        var el = $(sel);
        if (el) ro.observe(el);
      });
    }
    initCornerControls();
  }




  function loadAdminPanel() {
    if (window.JMAP_ADMIN) { window.JMAP_ADMIN.toggle(); return; }
    loadScript('admin.js').catch(function () { /* the panel is a tool, not the map */ });
  }
















































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



  function storedLonLat(x, y) {
    return {
      lon: proj.lonMin + x / proj.pxPerDeg,
      lat: (Math.atan(Math.exp((proj.yTop - y) / proj.R)) - Math.PI / 4) * 360 / Math.PI,
    };
  }



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




  function edgeClipPath(id, box) {
    var a1 = project(box[0], box[1]), a2 = project(box[2], box[3]);
    var cp = svgEl('clipPath', { id: id, clipPathUnits: 'userSpaceOnUse' });
    cp.appendChild(svgEl('rect', {
      x: Math.min(a1.x, a2.x), y: Math.min(a1.y, a2.y),
      width: Math.abs(a2.x - a1.x), height: Math.abs(a2.y - a1.y),
    }));
    hiDefs.appendChild(cp);
    ownedDefs.sub.push(cp);
    return cp;
  }




  function reprojectCircle(el) {
    if (el.__c0 === undefined) {
      el.__c0 = [parseFloat(el.getAttribute('cx')), parseFloat(el.getAttribute('cy'))];
    }
    var q = reprojectXY(el.__c0[0], el.__c0[1]);
    el.setAttribute('cx', Math.round(q.x * 100) / 100);
    el.setAttribute('cy', Math.round(q.y * 100) / 100);
  }





  function reprojectGraft(nodes) {
    if (!nodes || !nodes.length) return;
    nodes.forEach(function (n) {
      if (!n || n.nodeType !== 1) return;
      var all = [n].concat(Array.prototype.slice.call(n.querySelectorAll('*')));
      all.forEach(function (el) {
        if (el.tagName === 'path' && el.hasAttribute('d')) {
          if (el.__d0 === undefined) el.__d0 = el.getAttribute('d');










          var gKey = '__d_' + projMode;
          if (el[gKey] === undefined) {
            el[gKey] = projMode === 'mercator' ? el.__d0 : moveD(el.__d0);
          }
          if (el.getAttribute('d') !== el[gKey]) el.setAttribute('d', el[gKey]);
        } else if (el.tagName === 'circle' && el.hasAttribute('cx')) {
          reprojectCircle(el);
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








  function refitEdgeClips() {
    if (!hiDefs) return;
    territories().forEach(function (t) {
      if (!t.edgeClip) return;
      var want = 'edge-clip-' + t.id + '-' + projMode;
      var line = $$('#sub-outlines .edge-line[data-id="' + t.id + '"]', svg)[0];
      var cp = hiDefs.querySelector('#' + want);
      if (!cp) {
        cp = edgeClipPath(want, t.edgeClip);
      }
      if (line) line.setAttribute('clip-path', 'url(#' + want + ')');
    });
  }

  function reprojectDocument() {
    if (!svg) return;
    var t0 = (window.performance || Date).now();
    var moved = 0;















    var dKey = '__d_' + projMode;
    $$('path[d]', svg).forEach(function (el) {
      if (el.closest('pattern')) return;
      if (el.__d0 === undefined) el.__d0 = el.getAttribute('d');
      if (el[dKey] === undefined) {
        el[dKey] = projMode === 'mercator' ? el.__d0 : moveD(el.__d0);
      }
      el.setAttribute('d', el[dKey]);
      moved++;
    });
    $$('circle[cx]', svg).forEach(function (el) {
      if (el.closest('pattern')) return;
      reprojectCircle(el);
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


































  var reliefGroup = null, reliefImg = null, reliefFor = '';
  var reliefState = 'none';     // none | loading | ready | failed
  var reliefHave = {};          // 'mercator/finest' -> a blob URL, once fetched








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








  var reliefPending = 0;
  function reliefFetch(want, src, then) {
    if (reliefHave[want]) { then(reliefHave[want]); return; }






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

      if (reliefFor === want) then(reliefHave[want]);
    }).catch(function () {
      reliefPending = Math.max(0, reliefPending - 1);


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






  var RELIEF_ONLY = 'finest';


  function reliefLevel() {
    var all = (JMAP.RELIEF && JMAP.RELIEF.levels) || [];
    if (RELIEF_ONLY) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].key === RELIEF_ONLY) return all[i];
      }
    }
    return all[Math.min(all.length - 1, Math.max(0, state.reliefDetail | 0))] || null;
  }
















  function reliefStretch() {
    var L = reliefLevel();
    var c = containerSize();
    var k = c.w && view.w ? view.w / c.w : 1;      // map units per screen pixel
    if (!L || !L.deg || !proj || !proj.pxPerDeg || !k) return 1;
    return (proj.pxPerDeg / L.deg) / k;
  }





  var RELIEF_FULL = 2.8;
  var RELIEF_GONE = 6.5;

  function reliefFade() {
    if (!reliefGroup) return;
    var z = reliefStretch();
    var a = z <= RELIEF_FULL ? 1
          : z >= RELIEF_GONE ? 0
          : (RELIEF_GONE - z) / (RELIEF_GONE - RELIEF_FULL);
    if (reliefImg) reliefImg.style.opacity = String(RELIEF_MAX * a);


    reliefGroup.style.display = (state.relief && a > 0.01) ? '' : 'none';
  }


























  var RAIL_FULL_W = 6;        // view.w <= mapW / 6: drawn in full
  var RAIL_GONE_W = 3;        // view.w >= mapW / 3: not drawn at all

























  var RAIL_TIE_ON = 90;       // view.w <= mapW / 90 (~1.6 deg): ties in full
  var RAIL_TIE_OFF = 32;      // view.w >= mapW / 32 (~4.4 deg): a plain line


















  var sugarGroup = null, sugarState = 'none';

  function loadSugar() {
    if (sugarState === 'loading' || sugarState === 'ready') return;
    sugarState = 'loading';
    fetchSvg('japan-empire-map-tw-sugar.svg')
      .then(function (doc) {
        var g = doc.querySelector('#tw-sugar');
        if (!g || !svg) { sugarState = 'failed'; return; }
        sugarGroup = document.importNode(g, true);

        svg.insertBefore(sugarGroup, twRailGroup || null);
        reprojectGraft([sugarGroup]);
        sugarState = 'ready';
        railFade();
      })
      .catch(function () { sugarState = 'failed'; });
  }
























  var jpRailState = 'none';

  function loadJpRails() {
    if (jpRailState === 'loading' || jpRailState === 'ready') return;
    jpRailState = 'loading';
    loadScript('jp-rails.js').then(function () {
      if (!JMAP.JP_RAILS || !svg) { jpRailState = 'failed'; return; }
      buildJpRails();



      jpRailState = 'ready';








      applyState();
      syncStationLayers();
    }, function () { jpRailState = 'failed'; });
  }

  function buildJpRails() {
    if (jpRailGroup) return;
    var g = svgEl('g', { id: 'jp-rail' });
    g.style.display = 'none';
    (JMAP.JP_RAILS || []).forEach(function (r) {
      var f = r.p, d = '';
      for (var i = 0; i < f.length; i += 2) {
        var q = mercFwd(f[i], f[i + 1]);
        d += (i ? 'L' : 'M') + (Math.round(q.x * 10) / 10) + ' '
           + (Math.round(q.y * 10) / 10);
      }
      if (!d) return;
      g.appendChild(svgEl('path', {
        'class': 'rail', d: d, fill: 'none',


        'data-epochs': (r.e || '3042') === '42' ? 'e1942' : 'e1930 e1942',
        'data-over': 'japan',



        'data-name': r.n || '',
        'data-year': r.y ? String(r.y) : '',
        'data-ro': r.ro || '',
        'data-wiki': r.w || '',
      }));
    });


    svg.insertBefore(g, markersGroup || null);
    jpRailGroup = g;



    if (projMode !== 'mercator') reprojectGraft([g]);
  }

  function setSugar(on) {
    state.twSugar = !!on;
    if (state.twSugar) loadSugar();
    railFade();
    scheduleUrl();
    saveState();
  }

  function railFade() {




    if (state.twSugar && sugarState === 'none' && railUnderView() === 'tw') {
      loadSugar();
    }
    if (sugarGroup) {














      sugarGroup.style.setProperty('--rail-ink', railInk('taiwan'));








      railFadeOne(sugarGroup,
        state.twSugar && (state.twRail || trainDraws('tw')));
    }
    railFadeOne(twRailGroup, state.twRail && !trainDraws('tw'));
    railFadeOne(krRailGroup, state.krRail && !trainDraws('kr'));
    railFadeOne(kfRailGroup, state.kfRail && !trainDraws('kf'));




    railFadeOne(burmaRailGroup, state.burmaRail);



    if (state.jpRail && jpRailState === 'none') loadJpRails();
    railFadeOne(jpRailGroup, state.jpRail && !trainDraws('jp'));



    applyAir();
    syncMapButtons();



    syncLayerInfo();
  }




  function railAlpha() {







    if (!state.railZoom) return 1;
    var full = mapW / RAIL_FULL_W, gone = mapW / RAIL_GONE_W;
    return view.w <= full ? 1
         : view.w >= gone ? 0
         : (gone - view.w) / (gone - full);
  }






  function viewLonLat() {
    var pts = [[view.x, view.y], [view.x + view.w, view.y],
               [view.x, view.y + view.h], [view.x + view.w, view.y + view.h]];
    var w = Infinity, s2 = Infinity, e = -Infinity, n = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      var q = unproject(pts[i][0], pts[i][1]);
      if (!isFinite(q.lon) || !isFinite(q.lat)) return null;
      if (q.lon < w) w = q.lon;
      if (q.lon > e) e = q.lon;
      if (q.lat < s2) s2 = q.lat;
      if (q.lat > n) n = q.lat;
    }
    return [w, s2, e, n];
  }

  function viewMeets(box) {
    var v = viewLonLat();
    if (!v || !box) return false;
    return v[0] <= box[2] && v[2] >= box[0] && v[1] <= box[3] && v[3] >= box[1];
  }








  function railUnderView() {
    if (railAlpha() <= 0.02) return '';
    return groundHere(function (k) { return !!state[STATION_SYS[k].rail]; });
  }













  function groundHere(want) {
    var found = '', best = Infinity;
    Object.keys(STATION_SYS).forEach(function (k) {
      var cfg = STATION_SYS[k];
      if (!cfg.ground || (want && !want(k))) return;
      if (!viewMeets(cfg.ground)) return;
      var g = cfg.ground;
      var area = (g[2] - g[0]) * (g[3] - g[1]);
      if (area < best) { best = area; found = k; }
    });
    return found;
  }







  function railZone() {
    if (railAlpha() <= 0.02) return '';
    return groundHere(null);
  }






















  function trainBoxAt(useOff) {
    var span = latSpan();
    var c = unproject(view.x + view.w / 2, view.y + view.h / 2);
    if (!isFinite(c.lon) || !isFinite(c.lat)) return '';













    var upSys = trainApi && trainApi.mounted() ? trainApi.system() : '';
    var upBox = null;
    if (upSys && trainApi.bounds) {
      var bb = trainApi.bounds();
      if (bb) upBox = [bb.w, bb.s, bb.e, bb.n];
    }
    var found = '', bestArea = Infinity;
    Object.keys(TRAIN_SYS).forEach(function (k) {
      var cfg = TRAIN_SYS[k], b = (k === upSys && upBox) ? upBox : cfg.box;
      var limit = useOff ? (cfg.latOff || TRAIN_LAT_OFF)
                         : (cfg.latOn || TRAIN_LAT_ON);




      if (k === upSys && upBox) {
        limit = Math.max(limit, (upBox[3] - upBox[1]) * 1.2);
      }
      if (span > limit) return;
      if (c.lon < b[0] - TRAIN_BOX_PAD || c.lon > b[2] + TRAIN_BOX_PAD
          || c.lat < b[1] - TRAIN_BOX_PAD || c.lat > b[3] + TRAIN_BOX_PAD) return;
      var area = (b[2] - b[0]) * (b[3] - b[1]);
      if (area < bestArea) { bestArea = area; found = k; }
    });
    return found;
  }







  function trainZone() { return trainBoxAt(true); }





  var btnStationsSyss = [];


  var btnStaEl = null, btnTrnEl = null, btnSugarEl = null, btnRailEl = null;
  var btnAirEl = null, btnThemeEl = null;
  var btnElsFound = false;





  function syncMapButtons() {
    if (!btnElsFound) {
      btnElsFound = true;
      btnStaEl = $('#btn-stations');
      btnTrnEl = $('#btn-trains');
      btnSugarEl = $('#btn-sugar');
      btnRailEl = $('#btn-rail');
      btnAirEl = $('#btn-air');
      btnThemeEl = $('#btn-theme');
    }




    if (btnThemeEl) {
      var mine = themesHere();
      var haveTheme = mine.length > 0;
      if (btnThemeEl.hidden !== !haveTheme) btnThemeEl.hidden = !haveTheme;
      var tp = themeOn() ? 'true' : 'false';
      if (btnThemeEl.getAttribute('aria-pressed') !== tp) {
        btnThemeEl.setAttribute('aria-pressed', tp);
      }
      btnThemeEl.classList.toggle('on', !!themeOn());
      var tt = themeOn()
        ? (themeRec(themeOn()) ? nameOf(themeRec(themeOn())) || themeRec(themeOn()).en : 'Thematic layer')
        : (mine.length === 1 ? 'Thematic layer for this place'
                             : 'Thematic layers for this place');
      if (btnThemeEl.title !== tt) btnThemeEl.title = tt;
    }
    themeFollowsView();



    if (btnAirEl) {
      btnAirEl.setAttribute('aria-pressed', state.air ? 'true' : 'false');
      btnAirEl.classList.toggle('on', !!state.air);



      btnAirEl.setAttribute('data-epoch', state.epoch || '');
    }











    var railSys = railZone() || railUnderView();
    if (btnRailEl) {
      if (btnRailEl.hidden) btnRailEl.hidden = false;














      var railOn = railSys
        ? !!state[STATION_SYS[railSys].rail]
        : railSwitches().some(function (k) { return !!state[k]; });
      var rp = railOn ? 'true' : 'false';



      var rl = (railOn ? 'Hide ' : 'Show ')
        + (RAIL_LABEL[railSys]
             ? RAIL_LABEL[railSys] + '\u2019s railways' : 'the railways');









      if (railOn && railAlpha() <= 0.02) rl += ' \u2014 zoom in to see them';
      if (btnRailEl.getAttribute('aria-pressed') !== rp || btnRailEl.title !== rl) {
        btnRailEl.setAttribute('aria-pressed', rp);
        btnRailEl.classList.toggle('on', railOn);
        btnRailEl.title = rl;
        btnRailEl.setAttribute('aria-label', rl);
      }
    }










    if (btnSugarEl) {
      var sugarHere = (railUnderView() === 'tw' || trainDraws('tw'))
        && (state.twRail || trainDraws('tw'));
      if (btnSugarEl.hidden !== !sugarHere) btnSugarEl.hidden = !sugarHere;
      var sp = state.twSugar ? 'true' : 'false';
      if (btnSugarEl.getAttribute('aria-pressed') !== sp) {
        btnSugarEl.setAttribute('aria-pressed', sp);
        var sl = state.twSugar ? 'Hide the sugar railways'
                               : 'The sugar company railways, 1929';
        btnSugarEl.title = sl;
        btnSugarEl.setAttribute('aria-label', sl);
      }
    }
    if (!btnStaEl && !btnTrnEl) return;
    var sys = railUnderView();














    var syss = sys ? [sys] : [];
    var mounted = (trainApi && trainApi.mounted()) ? trainApi.system() : '';
    if (mounted && STATION_SYS[mounted] && syss.indexOf(mounted) < 0
        && connReaches(sys)) {
      syss.push(mounted);
    }
    btnStationsSyss = syss;
    var bs = btnStaEl;
    if (bs) {



      var on = syss.length > 0 && syss.every(function (k) {
        return !!state[STATION_SYS[k].on];
      });
      var want = !syss.length;
      if (bs.hidden !== want) bs.hidden = want;
      var pressed = on ? 'true' : 'false';

      var whose = syss.length > 1
        ? syss.map(function (k) { return RAIL_LABEL[k] || k; }).join(' and ')
          + '\u2019s railway stations'
        : ' railway stations';
      var label = (on ? 'Hide' : 'Show')
        + (syss.length > 1 ? ' ' + whose : whose);
      if (bs.getAttribute('aria-pressed') !== pressed || bs.title !== label) {
        bs.setAttribute('aria-pressed', pressed);
        bs.title = label;
        bs.setAttribute('aria-label', label);
      }
    }
    var bt = btnTrnEl;











    var noRail = railsAllOff() && !state.trainTools;
    var trRow = $('#row-train-tools');
    if (trRow && trRow.hidden !== noRail) trRow.hidden = noRail;
    if (bt) {
      var zone = trainZone();
      var hide = !zone || noRail;
      if (bt.hidden !== hide) bt.hidden = hide;
      var tp = state.trainTools ? 'true' : 'false';
      if (bt.getAttribute('aria-pressed') !== tp) {
        bt.setAttribute('aria-pressed', tp);
        var tl = state.trainTools
          ? 'Put the train tools away'
          : 'Train tools: run the timetable';
        bt.title = tl;
        bt.setAttribute('aria-label', tl);
      }
    }
  }

  function trainDraws(sys) {
    return !!(trainApi && trainApi.mounted() && trainApi.system() === sys);
  }























  var RAIL_ONLY = ['burmaRail'];

  function railSwitches() {
    return Object.keys(STATION_SYS).map(function (k) {
      return STATION_SYS[k].rail;
    }).concat(RAIL_ONLY);
  }

  function railsAllOff() {
    return !railSwitches().some(function (k) { return !!state[k]; });
  }

  function dropToolsWithRails() {
    if (state.trainTools && railsAllOff()) setTrainTools(false);
  }











  var RAIL_FLASH_HOLD = 900, RAIL_FLASH_FADE = 600;
  var railFlashEnd = 0, railFlashTimer = 0;

  function railFlash() {
    railFlashEnd = Date.now() + RAIL_FLASH_HOLD + RAIL_FLASH_FADE;
    if (railFlashTimer) return;
    var step = function () {
      railFlashTimer = 0;
      railFade();
      if (Date.now() < railFlashEnd) railFlashTimer = requestAnimationFrame(step);
    };
    railFlashTimer = requestAnimationFrame(step);
  }





  function railFadeOne(group, on) {
    if (!group) return;






































    if (!on) {
      group.style.display = 'none';
      group.style.opacity = '0';
      return;
    }


    var a = railAlpha();
    var left = railFlashEnd - Date.now();
    if (left > 0) {
      a = Math.max(a, left > RAIL_FLASH_FADE ? 1 : left / RAIL_FLASH_FADE);
    }
    group.style.opacity = String(a);
    group.style.display = a > 0.02 ? '' : 'none';
    if (a <= 0.02) return;
    var tieOn = mapW / RAIL_TIE_ON, tieOff = mapW / RAIL_TIE_OFF;
    var t = view.w <= tieOn ? 1
          : view.w >= tieOff ? 0
          : (tieOff - view.w) / (tieOff - tieOn);
    $$('path.rail-tie', group).forEach(function (el) {
      el.style.opacity = String(t);
    });
  }

























  var TRAIN_SYS = {
    tw: {
      sys: 'tw',
      data: 'TW_TRAINS',
      file: 'tw-trains.js',


      times: 'TW_TIMES',
      timesFile: 'tw-times.js',
      page: 'timetable/taiwan-1936.html',
      note: 'Timetable of February 1936',



      src: '\u81fa\u7063\u9435\u9053\u6642\u523b\u8868 (1936)',
      srcHref: 'https://archive.org/details/taiwan-train-times-1936',
      box: [119.9, 21.8, 122.1, 25.5],



      atom: 'taiwan',
    },
    kr: {
      sys: 'kr',
      data: 'KR_TRAINS',
      file: 'kr-trains.js',


      times: 'KR_TIMES',
      timesFile: 'kr-times.js',
      page: 'timetable/korea-1938.html',
      note: 'Timetable of early 1938',
      src: '\u671d\u9bae\u5217\u8eca\u6642\u523b\u8868 (1938)',
      srcHref: 'https://archive.org/details/chosen-ressha-jikokuhyo-1938',
      box: [124.0, 33.0, 131.2, 43.1],
      atom: 'korea',




      latOn: 13.0,
      latOff: 14.5,
    },
    kf: {
      sys: 'kf',
      data: 'KF_TRAINS',
      file: 'kf-trains.js',


      times: 'KF_TIMES',
      timesFile: 'kf-times.js',
      page: 'timetable/karafuto-1935.html',
      note: 'Timetable of April 1935',
      src: '\u6a3a\u592a\u570b\u6709\u9435\u9053\u5217\u8eca\u6642\u523b\u8868 (1935)',
      srcHref: 'https://archive.org/details/karafuto-kokuyu-tetsudo-ressha-jikokuhyo',
      box: [141.5, 45.9, 145.0, 50.1],
      atom: 'karafuto',









      latOn: 7.0,
      latOff: 8.0,
    },
  };








  var TRAIN_LAT_ON = 5.0;
  var TRAIN_LAT_OFF = 5.8;
  var TRAIN_BOX_PAD = 0.6;      // degrees of slack round the system's ground

  var trainApi = null;          // the module, once it is here
  var trainLoading = false;
  var trainWanted = '';         // which system should be up, '' for none




  var trainBusy = false;
  var trainFailed = false;      // said once, not on every re-tick





  function trainSysFor(mounted) {
    if (!state.trainTools) return '';
    return trainBoxAt(!!mounted);
  }




  function syncTrainTools() {
    if (trainBusy) return;
    var up = trainApi && trainApi.mounted() ? trainApi.system() : '';
    var want = trainSysFor(!!up);
    trainWanted = want;
    if (want === up) return;
    if (up && want !== up) {
      trainBusy = true;












      try {
        trainApi.unmount();
        document.body.classList.remove('trains-up');
        giveBackStations(!state.trainTools);
      } finally { trainBusy = false; }
      fillTrainCard(null);
      if (!want) return;
    }
    if (!want) return;
    var cfg = TRAIN_SYS[want];
    if (!window.JMAP_TRAINS || !JMAP[cfg.data]) { loadTrainTools(cfg); return; }
    mountTrainTools(cfg);
  }


























  var trainBorrowed = null;

  function borrowStations(cfg) {
    var railKey = STATION_SYS[cfg.sys] && STATION_SYS[cfg.sys].rail;
    var onKey = STATION_SYS[cfg.sys] && STATION_SYS[cfg.sys].on;
    if (!railKey || !onKey) return;
    trainBorrowed = { rail: railKey, on: onKey,
                      hadRail: state[railKey], hadOn: state[onKey] };
    state[railKey] = true;



    syncTrainBoxes();
    syncStationLayers();
    railFade();
  }

  function giveBackStations(keep) {
    var b = trainBorrowed;
    trainBorrowed = null;
    if (!b) return;
    if (!keep) {

      if (state[b.rail] === true) state[b.rail] = b.hadRail;
      if (state[b.on] === true) state[b.on] = b.hadOn;
    }
    syncTrainBoxes();
    syncStationLayers();
    railFade();


    gateLabels();
    placeLabels();


    scheduleUrl();
  }

  function syncTrainBoxes() {
    [['#opt-air', 'air'], ['#opt-air-all', 'airAll'],
     ['#opt-han-labels', 'hanLabels'],
     ['#opt-tw-rail', 'twRail'], ['#opt-tw-stations', 'twStations'],
     ['#opt-kr-rail', 'krRail'], ['#opt-kr-stations', 'krStations'],
     ['#opt-kf-rail', 'kfRail'], ['#opt-kf-stations', 'kfStations'],
     ['#opt-burma-rail', 'burmaRail'],
     ['#opt-jp-rail', 'jpRail'], ['#opt-jp-stations', 'jpStations'],
     ['#opt-rail-zoom', 'railZoom']]
      .forEach(function (pair) {
        var box = $(pair[0]);
        if (box) box.checked = !!state[pair[1]];
      });
  }

  function mountTrainTools(cfg) {
    if (trainBusy) return;
    if (!trainApi) trainApi = window.JMAP_TRAINS(trainHost());
    if (trainApi.mounted()) return;
    trainBusy = true;
    try {








      Object.keys(STATION_SYS).forEach(function (k) {
        if (k === cfg.sys) return;
        var key = STATION_SYS[k].rail;
        if (!state[key]) return;
        state[key] = false;
        var box = $('#opt-' + k + '-rail');
        if (box) box.checked = false;
      });
      borrowStations(cfg);




      trainApi.mount({ sys: cfg.sys, data: JMAP[cfg.data], page: cfg.page,
                       note: cfg.note, ground: cfg.atom,
                       src: cfg.src || '', srcHref: cfg.srcHref || '' });




      document.body.classList.add('trains-up');




      syncStationLayers();
      gateLabels();
      placeLabels();
    } finally { trainBusy = false; }

    trainApi.rescaled(view.w / containerSize().w);

    if (selected && byId[selected]) fillTrainCard(byId[selected]);
  }






  function loadTrainTools(cfg) {
    if (trainLoading) return;
    trainLoading = true;
    var left = 0;
    var failed = false;
    var done = function () {
      if (--left > 0) return;
      trainLoading = false;






      if (failed) {
        state.trainTools = false;
        var box = $('#opt-train-tools');
        if (box) box.checked = false;
        if (!trainFailed) {
          trainFailed = true;
          window.alert('The train tools could not be loaded. They are in '
            + 'trains.js and ' + cfg.file + ', which have to sit beside '
            + 'index.html.');
        }
        return;
      }
      if (trainWanted === cfg.sys) mountTrainTools(cfg);
    };
    var fetchOne = function (file, ready) {
      if (ready()) return;
      left++;
      loadScript(file).then(
        function () { if (!ready()) failed = true; done(); },
        function () { failed = true; done(); });
    };
    fetchOne('trains.js', function () { return !!window.JMAP_TRAINS; });
    fetchOne(cfg.file, function () { return !!JMAP[cfg.data]; });
    if (!left) { trainLoading = false; mountTrainTools(cfg); }
  }














  var timesFailed = {};

  function loadTimes(cfg) {
    if (!cfg || !cfg.timesFile) return;
    var give = function () {
      if (trainApi && trainApi.mounted() && trainApi.system() === cfg.sys) {
        trainApi.setTimes(JMAP[cfg.times]);
      }
    };
    if (JMAP[cfg.times]) { give(); return; }
    loadScript(cfg.timesFile).then(function () {
      if (JMAP[cfg.times]) give(); else fail();
    }, fail);
    function fail() {



      if (trainApi && trainApi.mounted() && trainApi.system() === cfg.sys
          && trainApi.timesFailed) {
        trainApi.timesFailed();
      }
      if (timesFailed[cfg.sys]) return;
      timesFailed[cfg.sys] = true;
      window.alert('The timetable could not be loaded. It is in '
        + cfg.timesFile + ', which has to sit beside index.html. The railway '
        + 'itself is drawn from ' + cfg.file + ' and is unaffected.');
    }
  }





  function trainHost() {
    return {
      svgEl: svgEl,









      home: function (sys) { return RAIL_LABEL[sys] || ''; },




      connChanged: function () { applyState(); saveState(); },
      project: function (lon, lat) { return project(lon, lat); },
      scale: function () { return view.w / containerSize().w; },
      stage: function () { return $('#stage') || document.body; },
      asset: asset,







      insertLayer: function (lines, marks) {
        var sta = null;
        Object.keys(STATION_SYS).forEach(function (k) {
          var g = STATION_SYS[k].group;
          if (g && g.parentNode === svg && !sta) sta = g;
        });
        svg.insertBefore(lines, sta || markersGroup || null);
        svg.insertBefore(marks, markersGroup || null);
      },
      clientToSvg: clientToSvg,









      fitBox: fitSvgBox,





      ground: railGround,




      jpNames: function () { return !!state.jpNames; },
      hanLabels: function () { return !!state.hanLabels; },



      showCard: function (block) { if (block) showTrainCard(block); },





      loadTimes: function () { loadTimes(TRAIN_SYS[trainApi && trainApi.mounted()
                                                   ? trainApi.system() : '']); },





      timesArrived: function () {
        if (selected && byId[selected]) fillTrainCard(byId[selected]);
        if (trainCardWaiting >= 0 && trainApi && trainApi.mounted()) {
          var li = trainCardWaiting;
          var card = trainApi.lineCard && trainApi.lineCard(li);
          if (card) showTrainCard(card);
        }
      },



      obstacle: function (el, on) {
        if (uiObserver) {
          try { on ? uiObserver.observe(el) : uiObserver.unobserve(el); }
          catch (err) { /* an implementation without ResizeObserver */ }
        }
        bumpLayout();
      },
      switchOff: function () {
        state.trainTools = false;
        var box = $('#opt-train-tools');
        if (box) box.checked = false;
        applyState();
        saveState();
      },
    };
  }

  function drawRelief() {
    if (!svg) return;
    var L = reliefLevel();
    var boxes = JMAP.RELIEF && JMAP.RELIEF.boxes;
    var man = L && boxes && boxes[state.projection]
      ? { box: boxes[state.projection], src: L.src[state.projection] } : null;
    if (!state.relief || !man) {
      if (reliefGroup) reliefGroup.style.display = 'none';

      if (reliefState === 'loading') { reliefState = 'none'; reliefFor = ''; }
      setReliefBusy();
      return;
    }
    if (!reliefGroup) {
      reliefGroup = svgEl('g', { id: 'relief' });




      reliefGroup.style.pointerEvents = 'none';
      reliefImg = svgEl('image', { preserveAspectRatio: 'none' });
      reliefImg.style.pointerEvents = 'none';
      reliefImg.style.mixBlendMode =
        (JMAP.RELIEF && JMAP.RELIEF.blend) || 'multiply';
      reliefGroup.appendChild(reliefImg);
      svg.appendChild(reliefGroup);
    }

    var before = svg.querySelector('#graticule') || svg.querySelector('#markers')
      || highlightLayer || labelLayer;
    if (before && before.parentNode === svg && reliefGroup.nextSibling !== before) {
      svg.insertBefore(reliefGroup, before);
    }

    var want = state.projection + '/' + L.key;
    if (reliefFor !== want) {
      reliefFor = want;
      reliefImg.setAttribute('x', man.box.x);
      reliefImg.setAttribute('y', man.box.y);
      reliefImg.setAttribute('width', man.box.w);
      reliefImg.setAttribute('height', man.box.h);





      reliefImg.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      reliefImg.removeAttribute('href');
      reliefFetch(want, man.src, function (href) {
        reliefImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
        reliefImg.setAttribute('href', href);
      });
    }
    reliefFade();
    railFade();
  }












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











  function gratText(v, pos, neg) {
    var r = Math.round(v * 1000) / 1000;
    if (Math.abs(r) < 1e-6) return '0\u00b0';
    return Math.abs(r) + '\u00b0' + (r > 0 ? pos : neg);
  }













  function firstInside(pts, r, back) {
    for (var n = 0; n < pts.length; n++) {
      var p = pts[back ? pts.length - 1 - n : n];
      if (p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) return p;
    }
    return null;
  }

  var gratSig = '';

  function placeGratLabels() {
    if (!gratLabelGroup) return;



    var sig = view.x + '|' + view.y + '|' + view.w + '|' + state.epoch;
    if (sig === gratSig && gratLabelGroup.childNodes.length) return;
    gratSig = sig;
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



    var have = gratLabelGroup.childNodes;
    while (have.length > want.length) gratLabelGroup.removeChild(gratLabelGroup.lastChild);
    while (have.length < want.length) {
      gratLabelGroup.appendChild(svgEl('text', { 'class': 'grat-label' }));
    }
    want.forEach(function (w, i) {
      var el = have[i];
      if (el.textContent !== w.t) el.textContent = w.t;

      if (el.__anchor !== w.anchor) {
        el.__anchor = w.anchor;
        el.setAttribute('text-anchor', w.anchor);
      }


      el.setAttribute('transform', 'translate(' + w.x + ' ' + w.y + ') scale(' + k
        + ') translate(' + w.ox + ' ' + w.oy + ')');
    });
  }




  function reframe() {
    var ocean = svg.querySelector('#ocean');
    var frame = svg.querySelector('#frame');
    var lonMax = proj.lonMin + mapW0 / proj.pxPerDeg;
    var latMin = (Math.atan(Math.exp((proj.yTop - mapH0) / proj.R)) - Math.PI / 4) * 360 / Math.PI;

    if (projMode === 'mercator') {

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


    rebuildFineHits();


    if (annApi) annApi.reproject();
    if (lastScaleW > 0) rescale();
    applyView(true);
    placeLabels();
  }


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


















  function railGround(over) {
    var atom = over && (atomEls[over] || $('#a-' + over, svg));
    try {
      var f = atom ? getComputedStyle(atom).fill : '';
      if (f && f !== 'none') return f;
    } catch (err) { /* not laid out */ }
    return 'var(--bg)';
  }









  function fillLum(el) {
    var fill = '';
    try { fill = el ? getComputedStyle(el).fill : ''; } catch (err) { fill = ''; }
    var m = /(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(fill || '');
    if (!m) return null;
    var v = [+m[1], +m[2], +m[3]];
    if (v[0] > 1 || v[1] > 1 || v[2] > 1) v = v.map(function (x) { return x / 255; });
    var lin = v.map(function (x) {
      return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  function railInk(over) {
    var atom = over && (atomEls[over] || $('#a-' + over, svg));
    var lum = fillLum(atom);
    if (lum === null) return state.colours.raillight || RAIL_LIGHT_DEF;



    return lum > 0.55
      ? (state.colours.raillight || RAIL_LIGHT_DEF)
      : (state.colours.raildark || RAIL_DARK_DEF);
  }




  var sizedSites = [];

  function buildMarkers() {
    JMAP.SITES.forEach(function (s) {
      var p = project(s.lon, s.lat);
      var g = svgEl('g', { 'class': 'site', id: 's-' + s.id, 'data-id': s.id, 'data-cat': s.cat });
      if (pointSubtype(s)) g.setAttribute('data-subtype', pointSubtype(s));
      if (s.size) g.setAttribute('data-size', s.size);
      if (pointTier(s) !== null && !pointAlways(s)) sizedSites.push(s);
      g.appendChild(svgEl('circle', { 'class': 'hit', r: HIT_R }));

      var r = pointR(s);
      if (s.cat === 'battle') {
        var d = r + 1.2;
        g.appendChild(svgEl('path', { 'class': 'dot', d: 'M0 ' + -d + 'L' + d + ' 0L0 ' + d + 'L' + -d + ' 0Z' }));
      } else if (s.cat === 'poi') {



        var pr = pointTier(s) === null ? SIZE_R[0] : r;
        g.appendChild(svgEl('rect', { 'class': 'dot', x: -pr, y: -pr,
                                      width: pr * 2, height: pr * 2 }));
      } else {
        g.appendChild(svgEl('circle', { 'class': 'dot', r: r }));
      }
      var colour = catInfo(s.cat);
      if (colour) g.style.setProperty('--c', colour.c);
      markersGroup.appendChild(g);
      elById[s.id] = g;
      sitePos[s.id] = p;
      scalables.push({ el: g, x: p.x, y: p.y, sid: s.id, cat: s.cat });
    });
  }







  var SMALL_ATOM_AREA = 2600;
  var atomHits = {};

  function buildAtomHits() {
    var layer = svgEl('g', { id: 'atom-hits' });






    svg.insertBefore(layer, airGroup || markersGroup);
    Object.keys(atomEls).forEach(function (a) {
      var el = atomEls[a];
      var area = parseFloat(el.getAttribute('data-area'));
      if (!(area < SMALL_ATOM_AREA)) return;


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
  var twRailGroup = null;
  var krRailGroup = null;
  var kfRailGroup = null;
  var burmaRailGroup = null;


  var jpRailGroup = null;
  var staRecs = [];                   // the station records, to re-register
  var buildStations = null;           // set in buildSiteLabels, called on demand













  var STATION_SYS = {
    tw: {
      data: 'TW_STATIONS', file: 'tw-stations.js', gid: 'tw-stations',
      rail: 'twRail', on: 'twStations',
      row: 'row-tw-stations', box: 'opt-tw-stations',




      ground: [119.9, 21.8, 122.1, 25.5],
      rec: function (t) {
        return { en: t.ro || t.han, local: t.py,
                 ja: t.kana ? t.han + '\uff08' + t.kana + '\uff09' : t.han,
                 jpro: t.ro || '', locro: t.py || '', han: t.han,
                 wiki: t.wiki || '', when: t.when || '',
                 staKind: t.kind || 'station' };
      },
    },
    kr: {
      data: 'KR_STATIONS', file: 'kr-stations.js', gid: 'kr-stations',
      rail: 'krRail', on: 'krStations',
      row: 'row-kr-stations', box: 'opt-kr-stations',











      ground: [124.0, 34.6, 130.7, 43.1],





      rec: function (t) {
        return { en: t.ro || t.han, local: t.mr || t.kr,
                 ja: t.han, ko: t.kr,
                 jpro: t.ro || '', locro: t.mr || '', han: t.han,




                 wiki: t.wiki || '',
                 staKind: 'station' };
      },
    },
    kf: {
      data: 'KF_STATIONS', file: 'kf-stations.js', gid: 'kf-stations',
      rail: 'kfRail', on: 'kfStations',
      row: 'row-kf-stations', box: 'opt-kf-stations',
      ground: [141.5, 45.9, 145.0, 50.1],
















      rec: function (t) {
        return { en: t.ro || t.han, local: t.ro || t.han,
                 ja: t.kana ? t.han + '\uff08' + t.kana + '\uff09' : t.han,
                 ru: t.ru || '',
                 jpro: t.ro || '', locro: t.ruen || '', han: t.han,
                 wiki: t.wiki || '',
                 staKind: 'station' };
      },
    },








    jp: {
      data: 'JP_STATIONS', file: 'jp-stations.js', gid: 'jp-stations',
      rail: 'jpRail', on: 'jpStations',
      row: 'row-jp-stations', box: 'opt-jp-stations',
      ground: [129.5, 30.9, 146.0, 45.5],
      rec: function (t) {
        return { en: t.n, local: t.n, ja: t.n, han: t.n,
                 jpro: '', locro: '',


                 when: t.y ? String(t.y) : '',
                 wiki: '', staKind: 'station' };
      },
    },
  };




















  function connReaches(sys) {
    var cfg = STATION_SYS[sys];
    if (!cfg || !cfg.ground) return false;
    if (!trainApi || !trainApi.mounted() || !trainApi.connOn
        || !trainApi.connOn()) return false;
    if (trainApi.system() === sys) return false;
    var b = trainApi.bounds ? trainApi.bounds() : null;
    if (!b) return false;
    var g = cfg.ground;
    return !(b.e < g[0] || b.w > g[2] || b.n < g[1] || b.s > g[3]);
  }

  function stationsOn(sys) {
    var cfg = STATION_SYS[sys];
    if (!cfg || !state[cfg.on]) return false;
    return !!state[cfg.rail] || connReaches(sys);
  }







  function syncStationLayers() {
    Object.keys(STATION_SYS).forEach(function (sys) {
      var cfg = STATION_SYS[sys];




      var line = !!state[cfg.rail] || connReaches(sys);
      var row = $('#' + cfg.row);
      if (row) row.hidden = !line;













      var box = $('#' + cfg.box);
      if (box && box.checked !== !!state[cfg.on]) box.checked = !!state[cfg.on];
      var on = stationsOn(sys);
      if (on && !cfg.built && buildStations) { buildStations(sys); return; }
      if (!cfg.group) return;
      cfg.group.style.display = on ? '' : 'none';




      if (on) {
        for (var i = 0; i < cfg.group.childNodes.length; i++) {
          var m = cfg.group.childNodes[i];
          var rec = byId[m.getAttribute('data-id')];
          m.style.display = (!rec || stationShown(rec)) ? '' : 'none';
        }
      }
    });
  }




  function stationInEpoch(rec) {
    if (!rec || !rec.epochs) return true;
    return rec.epochs.indexOf(state.epoch === 'e1930' ? '30' : '42') >= 0;
  }
















  function stationShown(rec) {
    if (!rec || !stationInEpoch(rec)) return false;
    if (!trainDraws(rec.sys)) return true;
    return trainApi.serves(rec.id);
  }

  var yellow1938 = null;


  function buildYellow1938() {
    if (!riversGroup || !JMAP.YELLOW_1938) return;
    var d = JMAP.YELLOW_1938.map(function (p, i) {
      var q = project(p[0], p[1]);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join('');
    yellow1938 = svgEl('path', { id: 'river-yellow_1938', 'class': 'river', fill: 'none', d: d });
    riversGroup.appendChild(yellow1938);
  }




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














  var gazGroup = null;
  var gazEls = [];
  var gazRecs = [];
  var gazByKey = {};              // epoch + '|' + id -> the gazetteer record




  function gazFor(id) {
    return gazByKey[state.epoch + '|' + id];
  }
  var GAZ_R = SIZE_R;   // the gazetteer's old name for it









  function gazEnrich(c) {
    var b = cityNameById[c.id];
    if (b) {


      ['ja', 'ja_kyu', 'zh', 'ko', 'orig', 'wiki'].forEach(function (k) {
        if (!c[k] && b[k]) c[k] = b[k];
      });







      ['en', 'local', 'jpfrom'].forEach(function (k) {
        if (b[k]) c[k] = b[k];
      });
      if (b.note) c.extra = b.note;
    }


















    var s = siteById[c.id];
    if (s) {
      ['ja', 'ja_kyu', 'zh', 'ko', 'orig', 'wiki'].forEach(function (k) {
        if (!c[k] && s[k]) c[k] = s[k];
      });


      ['en', 'local', 'jpfrom'].forEach(function (k) {
        if (s[k]) c[k] = s[k];
      });
      if (!c.extra && s.note) c.extra = s.note;
    }
  }

  var cityNameById = {};
  var siteById = {};

  function buildGazetteer() {
    if (!JMAP.GAZ) return;
    (JMAP.CITY_NAMES || []).forEach(function (b) { cityNameById[b.id] = b; });
    (JMAP.SITES || []).forEach(function (s) { if (s.cat === 'city') siteById[s.id] = s; });
    gazGroup = svgEl('g', { id: 'gaz' });
    svg.insertBefore(gazGroup, markersGroup);
    Object.keys(JMAP.GAZ).forEach(function (epoch) {
      JMAP.GAZ[epoch].forEach(function (c) {
        var p = project(c.lon, c.lat);


        var r = GAZ_R[c.a !== undefined ? c.a : c.t] || GAZ_R[0];
        var g = svgEl('g', {
          'class': 'gaz t' + c.t + (c.c ? ' cap' + c.c : ''),
          'data-epoch': epoch, 'data-id': c.id,
        });
        g.appendChild(svgEl('circle', { 'class': 'hit', r: Math.max(HIT_R * 0.6, r + 3) }));







        if (c.c === 1) {
          g.appendChild(svgEl('circle', { 'class': 'ring', r: r * 1.35 + 1 }));
        } else if (c.c === 2) {
          var s = r * 1.35 + 0.9;
          g.appendChild(svgEl('rect', {
            'class': 'box', x: -s, y: -s, width: s * 2, height: s * 2,
          }));
        }
        g.appendChild(svgEl('circle', { 'class': 'dot', r: r }));
        gazGroup.appendChild(g);
        gazEls.push({ el: g, epoch: epoch, tier: c.t,
                      always: c.a !== undefined, rec: c });
        scalables.push({ el: g, x: p.x, y: p.y });



        c.kind = 'gaz';
        c.epoch = epoch;
        c.rid = 'g_' + epoch + '_' + c.id;
        c.en = c.n;



        c.when = c.c === 2 ? 'Capital of ' + (c.of || 'the territory')
          : c.c === 1 ? 'Provincial capital' + (c.of ? ' — ' + c.of : '')
          : '';
        gazEnrich(c);




        var whose = (c.p && (!c.when || c.when.indexOf(c.p) < 0)) ? c.p : '';



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





  function gazMinTier() {
    var w = view.w || mapW;
    if (w > mapW / 1.6) return 3;
    if (w > mapW / 3) return 2;
    if (w > mapW / 7) return 1;
    return 0;
  }























  function applySizes() {
    JMAP.SITES.forEach(function (s) {
      var el = elById[s.id];
      if (!el || !el.querySelector) return;
      var rec = shown(s);
      var r = pointR(rec);
      var dot = el.querySelector('circle.dot');
      if (dot) { dot.setAttribute('r', r); return; }
      var dia = el.querySelector('path.dot');
      if (dia) {
        var d = r + 1.2;
        dia.setAttribute('d', 'M0 ' + -d + 'L' + d + ' 0L0 ' + d + 'L' + -d + ' 0Z');
        return;
      }
      var sq = el.querySelector('rect.dot');
      if (sq) {
        var pr = pointTier(rec) === null ? SIZE_R[0] : r;
        sq.setAttribute('x', -pr); sq.setAttribute('y', -pr);
        sq.setAttribute('width', pr * 2); sq.setAttribute('height', pr * 2);
      }
    });
  }









  function applySizedSites() {
    sizedSites.forEach(function (s) {
      var el = elById[s.id];
      if (el) el.style.display = siteVisible(s) ? '' : 'none';
    });
  }

  function applyGazetteer() {
    if (!gazGroup) return;
    var on = state.cats.city && !!JMAP.GAZ;
    gazGroup.style.display = on ? '' : 'none';
    if (!on) return;
    var floor = gazMinTier();
    gazEls.forEach(function (g) {





      g.el.style.display =
        (g.epoch === state.epoch && (g.always || g.tier >= floor)) ? '' : 'none';
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




















    buildStations = function (sys) {
      var cfg = STATION_SYS[sys];
      if (!cfg || cfg.built) return;






      if (!JMAP[cfg.data]) {
        if (cfg.loading) return;
        cfg.loading = true;
        loadScript(cfg.file).then(function () {
          cfg.loading = false;
          buildStations(sys);
        }, function () {
          cfg.loading = false;
          cfg.failed = true;
          state[cfg.on] = false;
          var box = $('#' + cfg.box);
          if (box) box.checked = false;
        });
        return;
      }
      cfg.built = true;
      var group = svgEl('g', { id: cfg.gid, 'class': 'sta-layer' });






      svg.insertBefore(group, markersGroup || null);
      cfg.group = group;
      (JMAP[cfg.data] || []).forEach(function (t) {
        var p = project(t.lon, t.lat);
        var mark = svgEl('g', { 'class': 'sta-mark', 'data-id': t.id });
        mark.appendChild(svgEl('rect', { x: -STA_SQ / 2, y: -STA_SQ / 2,
                                         width: STA_SQ, height: STA_SQ,
                                         'class': 'sta-sq' }));



        mark.appendChild(svgEl('rect', { x: -STA_SQ, y: -STA_SQ,
                                         width: STA_SQ * 2, height: STA_SQ * 2,
                                         'class': 'sta-hit' }));
        group.appendChild(mark);








        scalables.push({ el: mark, x: p.x, y: p.y });
        var text = svgEl('text', { 'class': 'tlabel sta', 'font-size': STA_PX,
                                   y: STA_PX + 5 });
        labelLayer.appendChild(text);





        var rec = cfg.rec(t);
        rec.kind = 'station';
        rec.sys = sys;
        rec.cat = 'station';
        rec.id = t.id;
        rec.lvl = 0;
        rec.short = t.short || '';
        rec.note = t.note || '';
        rec.epochs = t.e || '';       // '', or '30', '42', '3042'




        staRecs.push(rec);
        byId[t.id] = rec;


        sitePos[t.id] = { x: p.x, y: p.y };
        elById[t.id] = mark;


        if (rec.han) text.setAttribute('aria-label', rec.han);
        var entry = { rec: rec, el: text, x: p.x, y: p.y, dy: STA_PX + 5,
                      size: STA_PX, w: 0, h: STA_PX * 1.2, sta: true };
        labels.push(entry);
        entry.sc = { el: text, x: p.x, y: p.y };
        scalables.push(entry.sc);
      });






      syncStationLayers();
      rescale();
      gateLabels();
      placeLabels();
    };






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












    var namedCity = {};
    gazRecs.forEach(function (c) {
      if (namedCity[c.id]) return;
      var p = sitePos[c.rid];
      if (!p) return;
      namedCity[c.id] = true;
      var text = svgEl('text', { 'class': 'blabel', 'font-size': SITE_PX - 1.5,
                                 y: SITE_PX + 4 });
      labelLayer.appendChild(text);
      var cEntry = { rec: c, el: text, x: p.x, y: p.y, dy: SITE_PX + 4,
                     size: SITE_PX - 1.5, w: 0, h: SITE_PX * 1.1 };
      labels.push(cEntry);
      cEntry.sc = { el: text, x: p.x, y: p.y };
      scalables.push(cEntry.sc);
    });
  }







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











      var id = 'edge-clip-' + t.id + '-' + projMode;
      if (!hiDefs.querySelector('#' + id)) {
        edgeClipPath(id, t.edgeClip);
      }
      line.setAttribute('clip-path', 'url(#' + id + ')');
    }
    subOutlineLayer.appendChild(line);
  }

  function composeEpoch() {
    bumpLayout();
    dropLitIndex();               // the epoch's own lookups are rebuilt lazily

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
    gazRecs.forEach(function (c) { byId[c.rid] = c; });
    staRecs.forEach(function (r) { byId[r.id] = r; });

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


        if (t.edge && (!t.edgeAtoms || t.edgeAtoms.indexOf(a) >= 0)) drawEdge(t, el);
        if (t.outline) {


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


      if (!elById[t.id] || !elById[t.id].classList.contains('site')) {
        elById[t.id] = els[0] || null;
      }

      if (t.outline && subUnits.length) {
        var ring = outlineOf(subUnits.splice(0, subUnits.length), 'sub-outline',
                             subOutlineLayer);



        if (ring) ring.setAttribute('data-id', t.id);
        if (ring && t.outlineColor) ring.style.setProperty('--sub', t.outlineColor);
      }




      if (total > 0 && !t.unseen) {
        var x = mx / total, y = my / total;










        if (t.labelAt) {
          var ll = String(t.labelAt).split(',');
          var pt = project(parseFloat(ll[0]), parseFloat(ll[1]));
          if (isFinite(pt.x) && isFinite(pt.y)) { x = pt.x; y = pt.y; }
        }





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






    $$('#land [data-cluster]', svg).forEach(function (el) {
      el.classList.toggle('foreign-sub', foreignSub(el));
    });

    var rank = { territory: 0, feature: 1, site: 2, gaz: 3 };
    labels.sort(function (a, b) {
      var ra = rank[a.rec.kind] || 1, rb = rank[b.rec.kind] || 1;
      if (ra !== rb) return ra - rb;
      return (a.rec.lvl || 9) - (b.rec.lvl || 9);
    });

    buildHatch();



    if (lastScaleW > 0) rescale();
    hideTooltip();
    buildLegend();
  }











  function buildHatch() {
    if (!hatchGroup) return;
    hatchGroup.innerHTML = '';
    territories().forEach(function (t) {
      if (!t.hatch) return;


      var cls = 'hatch-fill' + (typeof t.hatch === 'string'
        ? ' hatch-' + (t.hatch === 'occupied' ? 'occ' : t.hatch) : '');
      t.atoms.forEach(function (a) {
        var el = atomEls[a];
        if (!el) return;
        var clip = el.getAttribute('clip-path');
        var paths = el.tagName === 'path' ? [el]
          : $$('path:not(.superseded):not(.fine)', el);





        if (!paths.length && backingEls[a]) paths = [backingEls[a]];
        paths.forEach(function (path) {
          var d = path.getAttribute('d');
          if (!d) return;




          var attrs = { 'class': cls, d: d, 'data-id': t.id };
          var own = path.getAttribute('clip-path') || clip;
          if (own) attrs['clip-path'] = own;
          hatchGroup.appendChild(svgEl('path', attrs));
        });
      });
    });
  }



  function estimateWidth(text, size) {
    var w = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      w += (c > 0x2e80 && c < 0xffa0) ? 1.0 : (c === 32 ? 0.3 : 0.56);
    }
    return w * size;
  }














  var LABEL_MAX_PX = 165;







  var LABEL_EST_BOLD = 1.17;

  function fillLines(words, size, budget) {
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + ' ' + words[i] : words[i];
      if (cur && estimateWidth(t, size) > budget) { lines.push(cur); cur = words[i]; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function wrapLabel(text, size) {
    var whole = estimateWidth(text, size) * LABEL_EST_BOLD;
    if (whole <= LABEL_MAX_PX) return null;
    var words = text.split(/\s+/);
    if (words.length < 2) return null;      // one word has nothing to break
    var budget = LABEL_MAX_PX / LABEL_EST_BOLD;
    var lines = fillLines(words, size, budget);
    if (lines.length < 2) return null;




    var even = fillLines(words, size,
                         (whole / LABEL_EST_BOLD / lines.length) * 1.12);
    if (even.length === lines.length) lines = even;
    return lines;
  }





  function setLabelText(L, text) {
    L.txt = text;
    var lines = wrapLabel(text, L.size);
    if (!lines) {
      L.el.textContent = text;
      L.lines = 1;
      L.extra = 0;
      L.w = estimateWidth(text, L.size);
      return;
    }
    var lh = L.size * 1.2;
    L.el.textContent = '';
    for (var i = 0; i < lines.length; i++) {
      var ts = svgEl('tspan', { x: 0, dy: i ? lh : -(lines.length - 1) * lh / 2 });
      ts.textContent = lines[i];
      L.el.appendChild(ts);
      L.w = Math.max(L.w || 0, estimateWidth(lines[i], L.size));
    }
    L.lines = lines.length;
    L.extra = (lines.length - 1) * lh / 2;
  }



  var view = { x: 0, y: 0, w: 100, h: 100 };
  var lastScaleW = -1;
  var rafPending = false;








  var rafZoomed = false;























  var layoutGen = 0;


  var uiObserver = null;
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













  var LOW_SHIFT = { level: 8, projection: 15, reliefDetail: 19 };
  var LOW_BIT = {
    epoch: 1, cities: 2, battles: 4, territory: 8, labels: 16, extent: 32,
    rivers: 64, roc: 128,                      // LAYER_FLAGS, in that order
    level: 3 << LOW_SHIFT.level,               // two bits
    hairline: 1 << 10, nca: 1 << 11, ccp: 1 << 12, backs: 1 << 13,
    indiaRivers: 1 << 14,
    projection: 3 << LOW_SHIFT.projection,     // two bits
    graticule: 1 << 17, relief: 1 << 18,
    reliefDetail: 3 << LOW_SHIFT.reliefDetail, // two bits
    mono: 1 << 21, jpNames: 1 << 22, occNone: 1 << 23, world: 1 << 24,
    twRail: 1 << 25, twStations: 1 << 26, krRail: 1 << 27, krStations: 1 << 28,
    trainTools: 1 << 29,
  };
  function checkLayerBits() {
    var bad = [];
    var names = Object.keys(LOW_BIT);
    for (var i = 0; i < names.length; i++) {
      if (LOW_BIT[names[i]] >= HI_BASE) bad.push(names[i] + ' is past bit 29');
      for (var j = i + 1; j < names.length; j++) {
        if (LOW_BIT[names[i]] & LOW_BIT[names[j]]) {
          bad.push(names[i] + ' and ' + names[j] + ' share a bit');
        }
      }
    }


    var hi = [];
    Object.keys(POP_BITS).forEach(function (k) { hi.push([k, POP_BITS[k], 4]); });
    hi.push(['sugar', SUGAR_PLACE, 2], ['theme', THEME_PLACE, 4],
            ['air', AIR_PLACE, 2], ['airplay', AIRPLAY_PLACE, 2],
            ['manchukuo', MANCHUKUO_PLACE, 2], ['mengjiang', MENGJIANG_PLACE, 2],
            ['airAll', AIRALL_PLACE, 2], ['airNames', AIRNAMES_PLACE, 2],
            ['hanLabels', HANLABELS_PLACE, 2], ['kfRail', KFRAIL_PLACE, 2],
            ['jpRail', JPRAIL_PLACE, 2], ['jpStations', JPSTA_PLACE, 2],
            ['kfStations', KFSTA_PLACE, 2],
            ['burmaRail', BURMARAIL_PLACE, 2]);
    LABEL_CATS.forEach(function (c) { hi.push(['labels:' + c.id, c.place, 2]); });
    hi.sort(function (a, b) { return a[1] - b[1]; });
    for (var h = 0; h + 1 < hi.length; h++) {
      if (hi[h][1] * hi[h][2] > hi[h + 1][1]) {
        bad.push(hi[h][0] + ' (' + hi[h][1] + ', ' + hi[h][2] + ' values) runs into '
                 + hi[h + 1][0] + ' (' + hi[h + 1][1] + ')');
      }
    }
    if (bad.length) {
      try { console.error('layers= code: ' + bad.join('; ')); } catch (e) { /* no console */ }
    }
    return bad;
  }

  function layerCode() {
    var bits = 0;
    LAYER_FLAGS.forEach(function (on, i) { if (on()) bits |= (1 << i); });
    bits |= ((Math.min(3, Math.max(1, state.level)) - 1) & 3) << LOW_SHIFT.level;

    if (state.hairline) bits |= LOW_BIT.hairline;
    if (state.occSource === 'nca') bits |= LOW_BIT.nca;









    if (state.occSource === 'none') bits |= LOW_BIT.occNone;















    if (state.mono) bits |= LOW_BIT.mono;





    if (!state.world) bits |= LOW_BIT.world;     // inverted: the whole map is the default







    if (!state.ccp) bits |= LOW_BIT.ccp;
    if (state.backs) bits |= LOW_BIT.backs;
    if (state.indiaRivers) bits |= LOW_BIT.indiaRivers;









    var asRead = {};
    Object.keys(STATION_SYS).forEach(function (k) {
      var cfg = STATION_SYS[k];
      asRead[cfg.rail] = state[cfg.rail];
      asRead[cfg.on] = state[cfg.on];
    });
    if (trainBorrowed) {
      asRead[trainBorrowed.rail] = trainBorrowed.hadRail;
      asRead[trainBorrowed.on] = trainBorrowed.hadOn;
    }











    Object.keys(STATION_SYS).forEach(function (k) {
      if (asRead[STATION_SYS[k].on]) asRead[STATION_SYS[k].rail] = true;
    });
    if (asRead.twRail) bits |= LOW_BIT.twRail;   // bit 25: Taiwan's railways
    if (asRead.twStations) bits |= LOW_BIT.twStations;    // bit 26: and their stations
    if (asRead.krRail) bits |= LOW_BIT.krRail; // bit 27: Korea's railways
    if (asRead.krStations) bits |= LOW_BIT.krStations;  // bit 28: and their stations
    if (state.trainTools) bits |= LOW_BIT.trainTools; // bit 29: the train tools












    bits |= ({ albers: 1, laea: 2 }[state.projection] || 0) << LOW_SHIFT.projection;
    if (state.graticule) bits |= LOW_BIT.graticule;
    if (state.relief) bits |= LOW_BIT.relief;
    bits |= (state.reliefDetail & 3) << LOW_SHIFT.reliefDetail;
    if (state.jpNames) bits |= LOW_BIT.jpNames;    // set = Japanese names on (off is the default)




    var hi = 0;
    popGroups().forEach(function (g) {
      var place = POP_BITS[g.id];
      if (place) hi += place * (POP_MODES.indexOf(state.pop[g.id]) + 1 || 0);
    });
    if (state.twSugar) hi += SUGAR_PLACE;
    if (state.air) hi += AIR_PLACE;



    if (airPlayWanted) hi += AIRPLAY_PLACE;


    if (!state.manchukuo) hi += MANCHUKUO_PLACE;
    if (!state.mengjiang) hi += MENGJIANG_PLACE;
    if (state.airAll) hi += AIRALL_PLACE;
    if (!state.airNames) hi += AIRNAMES_PLACE;   // inverted; see LABEL_CATS
    if (state.hanLabels) hi += HANLABELS_PLACE;
    if (asRead.kfRail) hi += KFRAIL_PLACE;      // Karafuto's railways; see the note there
    if (asRead.jpRail) hi += JPRAIL_PLACE;      // Japan's, fetched on demand
    if (asRead.jpStations) hi += JPSTA_PLACE;
    if (asRead.kfStations) hi += KFSTA_PLACE;   // and their stations





    if (state.burmaRail) hi += BURMARAIL_PLACE;   // Burma's, lines only
    hi += THEME_PLACE * (THEME_MODES.indexOf(state.theme) + 1 || 0);


    LABEL_CATS.forEach(function (c) {
      if (!state.labelCats[c.id]) hi += c.place;
    });























    if (hi > HI_MAX) {
      try { console.error('layerCode: the high field has outgrown 2^53 — ' + hi
        + '. Settings above it will be rounded. Give it its own field.'); }
      catch (e) { /* no console */ }
    }











    var said = 0, onMask = 0;
    airSets().forEach(function (set, i) {
      if (!Object.prototype.hasOwnProperty.call(state.airSets, set.key)) return;
      said += Math.pow(2, i);
      if (state.airSets[set.key]) onMask += Math.pow(2, i);
    });
    var tail = said ? ('.' + said.toString(36) + '-' + onMask.toString(36)) : '';
    if (!hi && tail) hi = 0;        // the field has to be there to hold a place
    return (hi || tail)
      ? (bits.toString(36) + '.' + (hi || 0).toString(36) + tail)
      : bits.toString(36);
  }

  function applyLayerCode(code) {
    var bits, hi;


    var whole = String(code || '');
    var parts = whole.split('.');
    if (parts.length > 2) {
      var pair = String(parts[2] || '').split('-');
      var said = parseInt(pair[0], 36) || 0;
      var onMask = parseInt(pair[1], 36) || 0;
      state.airSets = {};
      airSets().forEach(function (set, i) {
        var bit = Math.pow(2, i);
        if (Math.floor(said / bit) % 2) {
          state.airSets[set.key] = !!(Math.floor(onMask / bit) % 2);
        }
      });
      whole = parts[0] + '.' + parts[1];
      code = whole;
    } else {
      state.airSets = {};
    }
    var dot = String(code || '').indexOf('.');
    if (dot >= 0) {
      bits = parseInt(String(code).slice(0, dot), 36);
      hi = parseInt(String(code).slice(dot + 1), 36);
      if (!isFinite(bits) || bits < 0 || !isFinite(hi) || hi < 0) return;
    } else {



      var whole = parseInt(code, 36);
      if (!isFinite(whole) || whole < 0) return;
      bits = whole % HI_BASE;
      hi = Math.floor(whole / HI_BASE);
    }
    var epochs = JMAP.EPOCHS ? JMAP.EPOCHS.map(function (e) { return e.id; }) : [];
    var other = epochs.filter(function (id) { return id !== JMAP.DEFAULT_EPOCH; })[0];
    if ((bits & LOW_BIT.epoch) && other) state.epoch = other;
    state.cats.city = !!(bits & LOW_BIT.cities);
    state.cats.poi = state.cats.city;
    state.cats.battle = !!(bits & LOW_BIT.battles);
    state.cats.territory = !!(bits & LOW_BIT.territory);
    state.labels = !!(bits & LOW_BIT.labels);
    state.extent = !!(bits & LOW_BIT.extent);
    state.rivers = !!(bits & LOW_BIT.rivers);




    state.level = Math.min(3, ((bits >> LOW_SHIFT.level) & 3) + 1);
    state.hairline = !!(bits & LOW_BIT.hairline);
    state.occSource = (bits & LOW_BIT.occNone) ? 'none' : ((bits & LOW_BIT.nca) ? 'nca' : 'traced');
    state.mono = !!(bits & LOW_BIT.mono);
    state.world = !(bits & LOW_BIT.world);
    state.ccp = !(bits & LOW_BIT.ccp);          // inverted; see layerCode
    state.backs = !!(bits & LOW_BIT.backs);
    state.indiaRivers = !!(bits & LOW_BIT.indiaRivers);
    state.twRail = !!(bits & LOW_BIT.twRail);
    state.twStations = !!(bits & LOW_BIT.twStations);
    state.krRail = !!(bits & LOW_BIT.krRail);
    state.krStations = !!(bits & LOW_BIT.krStations);
    state.trainTools = !!(bits & LOW_BIT.trainTools);
    popGroups().forEach(function (g) {
      var place = POP_BITS[g.id];
      var mode = place ? POP_MODES[(Math.floor(hi / place) % 4) - 1] : null;
      if (mode) state.pop[g.id] = mode; else delete state.pop[g.id];
    });
    state.twSugar = !!(Math.floor(hi / SUGAR_PLACE) % 2);
    state.jpRail = !!(Math.floor(hi / JPRAIL_PLACE) % 2);
    state.jpStations = !!(Math.floor(hi / JPSTA_PLACE) % 2);
    state.air = !!(Math.floor(hi / AIR_PLACE) % 2);
    airPlayWanted = !!(Math.floor(hi / AIRPLAY_PLACE) % 2);
    state.manchukuo = !(Math.floor(hi / MANCHUKUO_PLACE) % 2);   // inverted
    state.mengjiang = !(Math.floor(hi / MENGJIANG_PLACE) % 2);   // inverted
    state.airAll = !!(Math.floor(hi / AIRALL_PLACE) % 2);
    state.airNames = !(Math.floor(hi / AIRNAMES_PLACE) % 2);    // inverted
    state.hanLabels = !!(Math.floor(hi / HANLABELS_PLACE) % 2);
    state.kfRail = !!(Math.floor(hi / KFRAIL_PLACE) % 2);
    state.burmaRail = !!(Math.floor(hi / BURMARAIL_PLACE) % 2);
    state.kfStations = !!(Math.floor(hi / KFSTA_PLACE) % 2);
    state.theme = THEME_MODES[(Math.floor(hi / THEME_PLACE) % 4) - 1] || 'auto';
    LABEL_CATS.forEach(function (c) {          // inverted; see layerCode
      state.labelCats[c.id] = !(Math.floor(hi / c.place) % 2);
    });
    state.projection = ['mercator', 'albers', 'laea'][(bits >> LOW_SHIFT.projection) & 3] || 'mercator';
    state.graticule = !!(bits & LOW_BIT.graticule);
    state.relief = !!(bits & LOW_BIT.relief);
    state.reliefDetail = Math.min(2, (bits >> LOW_SHIFT.reliefDetail) & 3);
    state.jpNames = !!(bits & LOW_BIT.jpNames);
    urlProvSource = (bits & LOW_BIT.roc) ? 'roc' : 'enp';
  }

  var urlProvSource = null;      // applied once the administrative file is in








  function xForLon(lon) { return (lon - proj.lonMin) * proj.pxPerDeg; }




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















  function viewBox() {
    var a = unproject(view.x, view.y);                       // north-west
    var b = unproject(view.x + view.w, view.y + view.h);     // south-east
    var q = (b.lon - a.lon) < 3 ? 1000 : 100;
    var r = function (v) { return Math.round(v * q) / q; };
    return [r(a.lon), r(b.lat), r(b.lon), r(a.lat)];
  }














  function viewForBox(w, s, e, n) {
    var x0, x1, y0, y1;
    if (projMode === 'mercator') {
      var ax = xForLon(w), zx = xForLon(e);


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




  var urlTimer = 0;
  function scheduleUrl() {
    if (!proj || !view) return;
    if (urlTimer) window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(writeUrl, 400);
  }






























  var JUNK = /^(fbclid|gclid|dclid|msclkid|yclid|twclid|igshid|mc_[ce]id|_ga|ref|ref_src|ref_url|si|s_kwcid|vero_id|oly_enc_id|__s|_hsenc|_hsmi|utm_[a-z_]+)$/i;

  function cleanQuery(search) {
    return String(search || '')
      .replace(/^\?/, '')
      .replace(/&(?:amp;|#0*38;|#x0*26;)/gi, '&')
      .replace(/\?/g, '&');
  }

  function params() {
    try { return new URLSearchParams(cleanQuery(window.location.search)); }
    catch (err) { return new URLSearchParams(); }
  }




  function tidyUrl() {
    if (!window.history || !history.replaceState) return;
    var raw = String(window.location.search || '');
    var repaired = cleanQuery(raw);
    var q = params();
    var junk = false;
    var keep = [];
    q.forEach(function (v, k) {
      if (JUNK.test(k)) { junk = true; return; }


      keep.push(encodeURIComponent(k) + '='
                + encodeURIComponent(v).replace(/%2C/g, ','));
    });
    if (!junk && repaired === raw.replace(/^\?/, '')) return;
    try {
      history.replaceState(null, '', window.location.pathname
        + (keep.length ? '?' + keep.join('&') : '') + window.location.hash);
    } catch (err) { /* older browser; nothing here is load-bearing */ }
  }

  function writeUrl() {
    urlTimer = 0;
    if (!proj || !view || !window.history || !history.replaceState) return;
    try {
      var rest = [];
      params().forEach(function (v, k) {
        if (JUNK.test(k)) return;      // never written back out
        if (k !== 'where' && k !== 'bbox' && k !== 'layers'
            && k !== 'mono' && k !== 'colours' && k !== 'pop') {
          rest.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
      });
      if (state.mono && state.monoColour && HEX.test(state.monoColour)) {
        rest.unshift('mono=' + state.monoColour.slice(1));
      }



      var cc = colourCode();
      if (cc) rest.unshift('colours=' + cc);


      var q = ['where=' + viewBox().join(','), 'layers=' + layerCode()].concat(rest);
      history.replaceState(null, '',
        window.location.pathname + '?' + q.join('&') + window.location.hash);
    } catch (err) { /* older browser; the map does not depend on this */ }
  }






















  var RELIEF_WIDE_PX = 1000;

  function reliefByDefault() {
    var bare = !cleanQuery(window.location.search);
    var wide = (window.innerWidth || 0) >= RELIEF_WIDE_PX;
    return bare && wide;
  }

  function readUrl() {
    var q = params();
    var code = q.get('layers');
    if (!code && reliefByDefault()) state.relief = true;
    if (code) applyLayerCode(code);
    var mc = q.get('mono');
    if (mc && HEX.test('#' + mc)) state.monoColour = '#' + mc;
    var cc = q.get('colours');
    if (cc) state.colours = readColourCode(cc);




    var pp = q.get('pop');
    if (pp) {
      pp.split(',').forEach(function (id) {
        var d = popSet(id);

        if (d) state.pop[d.group] = 'density';
      });
    }
    var raw = q.get('where') || q.get('bbox');
    if (!raw) return null;






    var n = raw.replace(/(\d)-/g, '$1,').split(',').map(Number);
    if (n.length !== 4 || n.some(function (v) { return !isFinite(v); })) return null;
    return n;
  }












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














  var MAX_ZOOM = 250;













  var ZOOM_REF_PX = 1200;



















  var TOUCH_ZOOM_BOOST = 2;

  function maxZoom() {
    return MAX_ZOOM * (coarse ? TOUCH_ZOOM_BOOST : 1);
  }

  function minViewW() {



    return (mapW / maxZoom()) / ZOOM_REF_PX * containerSize().w;
  }

  function clampView(v) {
    var c = containerSize();
    var aspect = c.w / c.h;
    v.h = v.w / aspect;







    var maxW = Math.min(fitView().w, mapW);
    var minW = Math.min(minViewW(), maxW);
    if (v.w > maxW) { v.w = maxW; v.h = v.w / aspect; }
    if (v.w < minW) { v.w = minW; v.h = v.w / aspect; }







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











    svg.classList.toggle('zoomed-in', view.w < home.w / 3.2);


    var rst = $('#zoom-reset');
    if (rst) {
      var atHome = Math.abs(view.w - home.w) < 0.5;
      rst.classList.toggle('idle', atHome);
      rst.setAttribute('aria-disabled', atHome ? 'true' : 'false');
    }
    if (state.graticule) drawGraticule();

    reliefFade();
    railFade();
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
        applyGazetteer();
        if (zoomed) applySizedSites();
        if (zoomed) gateLabels();




















        var now = Date.now();
        if (zoomed || !dragStart || now - lastPlaced > PLACE_MS) {
          lastPlaced = now;
          placeLabels();
        }
      });
    }


    if (fineTimer) clearTimeout(fineTimer);
    fineTimer = setTimeout(function () {
      fineTimer = 0;

      lastPlaced = 0;
      placeLabels();
      syncFine();
    }, 220);
  }
  var fineTimer = 0;



  var PLACE_MS = 100;
  var lastPlaced = 0;




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








  var spaceHeld = false;




  var spaceFrom = null;
  var pendingTap = 0;











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










  var SMALL_ISLE_PX = 46;

  function isleOffset(L, k) {
    if (!L || !L.half) return 0;
    var hpx = (L.half * 2) / k;
    return hpx < SMALL_ISLE_PX ? hpx / 2 + L.h * 0.9 : 0;
  }














  function placeScalable(s, k) {
    var ox = (s.ox || 0) + (s.nx || 0);
    var oy = (s.oy || 0) + (s.ny || 0);
    var t = 'translate(' + s.x + ' ' + s.y + ') scale(' + k + ')';
    if (ox || oy) t += ' translate(' + ox + ' ' + oy + ')';
    s.el.setAttribute('transform', t);
  }
















  function rescaleAnn() {
    if (lastScaleW <= 0) { rescale(); return; }
    var k = view.w / containerSize().w;
    for (var i = 0; i < scalables.length; i++) {
      if (scalables[i].ann) placeScalable(scalables[i], k);
    }
    if (annApi && annApi.rescaled) annApi.rescaled(k);
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




    if (annApi && annApi.rescaled) annApi.rescaled(k);

    setPinBlur(k);
    reliefFade();
    railFade();




    syncTrainTools();
    if (trainApi && trainApi.mounted()) trainApi.rescaled(k);


    if (airApi && airApi.mounted()) airApi.rescaled(k);

    syncKoreaFine();


    if (annApi && annApi.viewMoved) annApi.viewMoved();







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













  var uiBoxCache = null, uiBoxGen = -1;

  function uiBoxes() {
    if (uiBoxCache && uiBoxGen === layoutGen) return uiBoxCache.slice();
    var base = container.getBoundingClientRect();
    var boxes = [];
    ['#legend', '#zoom-controls', '#info', '#quiz', '#train-bar'].forEach(function (sel) {
      var el = $(sel);
      if (!el || el.hidden || el.offsetParent === null) return;
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      boxes.push({
        l: r.left - base.left - 4, r: r.right - base.left + 4,
        t: r.top - base.top - 4, b: r.bottom - base.top + 4,
      });
    });
    uiBoxCache = boxes;
    uiBoxGen = layoutGen;
    return boxes.slice();
  }









































  var SUB_BUILD_ZOOM = 4;
  var SUB_LABEL_ZOOM = 12;
  var SUB_MIN_SIDE = 90;
  var subLabels = [];
  var subLabelled = null;





  var subNamed = null;

  var subNodes = null;
  var subParentNames = null;








  var STATION_LABEL_LAT = 1.0;



  var AIR_NAME_CLOSE_LAT = 12;
  var latKey = null, latVal = 0;

  function latSpan() {
    var key = view.y + '|' + view.h + '|' + projMode;
    if (key === latKey) return latVal;
    latKey = key;
    latVal = Math.abs(unproject(view.x, view.y).lat
                      - unproject(view.x, view.y + view.h).lat);
    return latVal;
  }

  function subLabelsWanted() {
    return labelsOn('sub') && view.w < mapW / SUB_BUILD_ZOOM;
  }



  function viewK() { return view.w / containerSize().w; }


  function subFits(rec) {
    if (!(rec.side > 0)) return view.w < mapW / SUB_LABEL_ZOOM;
    return (rec.side / viewK()) >= SUB_MIN_SIDE;
  }





  function subRec(el, key) {
    var rec = JMAP.PROVINCES && JMAP.PROVINCES[key];
    var en = (rec && rec.en) || key;
    var cut = en.indexOf(' — ');






    var local = (rec && rec.local) || '';
    var lcut = local.indexOf(' — ');




    var area = parseFloat(el.getAttribute('data-area') || '0');
    return {
      kind: 'sub',
      side: area > 0 ? Math.sqrt(area) : 0,
      en: cut > 0 ? en.slice(0, cut) : en,
      local: lcut > 0 ? local.slice(0, lcut) : local,
      jpfrom: (rec && rec.jpfrom) || '',
      ja: (rec && rec.ja) || el.getAttribute('data-ja') || '',
      zh: (rec && rec.zh) || el.getAttribute('data-zh') || '',
      ko: (rec && rec.ko) || '',
    };
  }



  function nameKeyFor(el, key) {
    var a = el.closest ? el.closest('.atom') : null;
    return (a && a.id ? a.id : '?') + '|' + key;
  }

  function ensureSubLabels() {
    if (!subLabelsWanted()) return;


    if (adminState !== 'ready' && adminState !== 'loading') loadAdmin();
    if (!subLabelled) subLabelled = new WeakSet();
    if (!subNamed) subNamed = {};
    var made = 0;








    if (!subNodes) subNodes = $$('#land [data-prov]', svg);
    var nodes = subNodes;







    if (!subParentNames) {
      subParentNames = {};
      for (var pi = 0; pi < nodes.length; pi++) {
        var pn = nodes[pi].getAttribute('data-parent');
        if (pn) subParentNames[pn] = 1;
      }
    }
    var parentNames = subParentNames;











    var groups = {};
    nodes.forEach(function (el) {
      if (subLabelled.has(el)) return;
      subLabelled.add(el);
      var key = el.getAttribute('data-prov');
      if (!key) return;
      var parent = el.getAttribute('data-parent');
      if (parent) {
        (groups[parent] = groups[parent] || []).push(el);








        if (!(parseFloat(el.getAttribute('data-area') || '0') > 0)) return;
        if (parentNames[key]) return;
        var nk = nameKeyFor(el, key);
        if (subNamed[nk]) return;
        subNamed[nk] = 1;
        el.__nameKey = nk;
      }










      var x = parseFloat(el.getAttribute('data-cx'));
      var y = parseFloat(el.getAttribute('data-cy'));
      var half = 0, area = Infinity;
      if (!isFinite(x) || !isFinite(y)) {









        if (!el.getAttribute('data-ja') && !el.getAttribute('data-group')) return;
        var bb;
        try { bb = el.getBBox(); } catch (err) { return; }
        if (!bb || !bb.width) return;
        x = bb.x + bb.width / 2;
        y = bb.y + bb.height / 2;


        half = bb.height / 2;
        area = bb.width * bb.height;
      }
      var text = svgEl('text', { 'class': 'tlabel sublabel', 'font-size': SUB_PX });
      labelLayer.appendChild(text);
      var entry = { rec: subRec(el, key), el: text, x: x, y: y, dy: 0,
                    size: SUB_PX, w: 0, h: SUB_PX * 1.2, half: half, key: key,
                    area: area, nameKey: el.__nameKey || '',
                    owner: el, atom: el.closest ? el.closest('.atom') : null };
      labels.push(entry);
      subLabels.push(entry);
      var sc = { el: text, x: x, y: y };
      entry.sc = sc;
      if (half) sc.label = entry;
      scalables.push(sc);
      made++;
    });


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
      var gk = nameKeyFor(els[0], pkey);
      if (subNamed[gk]) return;
      subNamed[gk] = 1;
      var text = svgEl('text', { 'class': 'tlabel sublabel grouplabel',
                                 'font-size': GROUP_PX });






      text.style.fontSize = GROUP_PX + 'px';
      labelLayer.appendChild(text);
      var entry = { rec: subRec(els[0], pkey), el: text,
                    x: (x0 + x1) / 2, y: (y0 + y1) / 2, dy: 0,
                    size: GROUP_PX, w: 0, h: GROUP_PX * 1.2, half: 0, key: pkey,
                    area: Infinity, nameKey: gk,
                    owner: els[0], atom: els[0].closest ? els[0].closest('.atom') : null };




      entry.rec.side = Math.sqrt(Math.max(1, (x1 - x0) * (y1 - y0)));
      labels.push(entry);
      subLabels.push(entry);
      entry.sc = { el: text, x: entry.x, y: entry.y };
      scalables.push(entry.sc);
      made++;
    });



















    if (made) { sortLabels(); rescale(); }
  }









  var LABEL_RANK = { territory: 0, feature: 1, popval: 2, sub: 3,
                     site: 4, gaz: 5 };

  function sortLabels() {
    labels.sort(function (a, b) {
      var d = (LABEL_RANK[a.rec.kind] === undefined ? 3 : LABEL_RANK[a.rec.kind])
            - (LABEL_RANK[b.rec.kind] === undefined ? 3 : LABEL_RANK[b.rec.kind]);
      if (d) return d;
      return (b.area || 0) - (a.area || 0);
    });
  }

  function gateLabels() {
    ensureSubLabels();
    ensurePopValues();
    var measure = [];









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
        L.shown = false;               // placeLabels mirrors what was written
        L.w = 0;
        L.txt = '';
        return;
      }











      var gone = L.owner
        && (!L.owner.isConnected
            || L.owner.style.display === 'none'
            || (L.atom && L.atom.style.display === 'none'));








      if (gone || !labelVisible(L.rec)) {
        L.el.textContent = '';
        L.el.style.display = 'none';
        L.shown = false;
        L.w = 0;
        L.txt = '';
        return;
      }
      var text = mapLabel(L.rec);
      if (!text) { L.el.textContent = ''; L.el.style.display = 'none';
                   L.shown = false; L.w = 0; L.txt = ''; return; }
      if (L.txt !== text) {
        L.w = 0;
        setLabelText(L, text);







        measure.push(L);




        L.el.style.display = '';
        L.shown = true;
      }
    });




    for (var m = 0; m < measure.length; m++) {
      var M = measure[m], real = 0;
      try {
        if (M.lines > 1) {


          var kids = M.el.childNodes;
          for (var q = 0; q < kids.length; q++) {
            real = Math.max(real, kids[q].getComputedTextLength());
          }
        } else {
          real = M.el.getComputedTextLength();
        }
      } catch (err) { real = 0; }



      if (real > 0) M.w = real;
    }
  }



  var NUDGES = [[0, -1], [0, 1], [-1, 0], [1, 0],
                [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -2], [0, 2]];






























  var QUOTA_PX = 170;
  var quotaAt = { size: 0, n: -1 };













  var ISLAND_CAP = 40;

  function islandQuota() {
    var k = view.w / containerSize().w;             // map units per screen pixel





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





























  var REACH_K = 2.5;

  function labelReach(L) {
    if (L.reach === undefined) {
      var a = L.owner ? parseFloat(L.owner.getAttribute('data-area') || '0') : 0;
      L.reach = (a > 0) ? Math.sqrt(a) * REACH_K : -1;   // -1: never relocated
    }
    return L.reach;
  }

  function labelBox(L) {
    if (L.bb === undefined) {
      L.bb = null;
      try {
        var b = L.owner.getBBox();
        if (b && b.width && b.height) L.bb = b;
      } catch (err) { /* not in the document, or no box */ }
    }
    return L.bb;
  }





  function canRelocate(L) {
    return !!(L.owner && !L.half
              && (L.rec.kind === 'sub' || L.rec.kind === 'popval'));
  }





  var RELOC_AT = [0.5, 0.38, 0.62, 0.26, 0.74];

  function relocate(L, sx, sy) {
    if (labelReach(L) < 0) return null;

    var vx = view.x + view.w / 2, vy = view.y + view.h / 2;
    var far = labelReach(L) + Math.max(view.w, view.h) / 2;
    if (Math.abs(L.x - vx) > far || Math.abs(L.y - vy) > far) return null;
    var bb = labelBox(L);
    if (!bb) return null;
    var x0 = Math.max(bb.x, view.x), x1 = Math.min(bb.x + bb.width, view.x + view.w);
    var y0 = Math.max(bb.y, view.y), y1 = Math.min(bb.y + bb.height, view.y + view.h);
    if (x1 <= x0 || y1 <= y0) return null;
    if (!svg || !svg.createSVGPoint) return null;
    var pt = svg.createSVGPoint();
    for (var i = 0; i < RELOC_AT.length; i++) {
      for (var j = 0; j < RELOC_AT.length; j++) {
        pt.x = x0 + (x1 - x0) * RELOC_AT[i];
        pt.y = y0 + (y1 - y0) * RELOC_AT[j];
        var hit;
        try { hit = L.owner.isPointInFill(pt); } catch (err) { return null; }
        if (hit) {
          return { x: (pt.x - view.x) * sx, y: (pt.y - view.y) * sy + L.dy };
        }
      }
    }
    return null;
  }

  function placeLabels() {
    if (state.mode === 'quiz') return;



    if (!state.labels && !popValues.length) return;
    var c = containerSize();
    var sx = c.w / view.w;
    var sy = c.h / view.h;
    var k = view.w / c.w;                 // map units per screen pixel
    var placed = uiBoxes();
    islandQuota();
    var isles = 0;





    var free = function (b) {
      if (b.l < 2 || b.r > c.w - 2 || b.t < 2 || b.b > c.h - 2) return false;
      for (var j = 0; j < placed.length; j++) {
        var p = placed[j];
        if (b.l < p.r && b.r > p.l && b.t < p.b && b.b > p.t) return false;
      }
      return true;
    };
    var show = function (L, yes) {
      if (L.shown === yes) return;
      L.shown = yes;
      L.el.style.display = yes ? '' : 'none';
    };

    for (var i = 0; i < labels.length; i++) {
      var L = labels[i];
      if (!L.w) { show(L, false); continue; }
      var isIsle = L.half && isFinite(L.area);



      if (isIsle && (L.crowded || isles >= ISLAND_CAP)) {
        show(L, false);
        continue;
      }





      if (!state.world && L.rec.kind === 'territory' && !EAST_ASIA[L.rec.id]) {
        show(L, false);
        continue;
      }

      var x = (L.x - view.x) * sx;
      var y = (L.y - view.y) * sy + L.dy;
      var mkBox = function (px, py) {
        return { l: px - L.w / 2, r: px + L.w / 2,
                 t: py - L.h * 0.85 - (L.extra || 0),
                 b: py + L.h * 0.25 + (L.extra || 0) };
      };
      var box = mkBox(x, y);









      var rx = 0, ry = 0;
      if ((box.l < 2 || box.r > c.w - 2 || box.t < 2 || box.b > c.h - 2)
          && canRelocate(L)) {
        var to = relocate(L, sx, sy);
        if (to) {
          rx = to.x - x; ry = to.y - y;
          x = to.x; y = to.y;
          box = mkBox(x, y);
        }
      }













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
      if (!ok) { show(L, false); continue; }















      if (L.sc && (L.sc.nx !== nx + rx || L.sc.ny !== ny + ry)) {
        L.sc.nx = nx + rx;
        L.sc.ny = ny + ry;
        placeScalable(L.sc, k);
      }

      placed.push(box);
      if (isIsle) isles++;
      show(L, true);
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


    var aspect = c.w / c.h;
    view.w = Math.min(Math.sqrt(before.area * aspect), fitView().w);
    view.h = view.w / aspect;
    view.x = before.cx - view.w / 2;
    view.y = before.cy - view.h / 2;
    applyView(true);
  }




  function focusOn(rec, spread) {
    var cx, cy, want;
    if (rec.kind === 'site') {
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



    var w = aspect < 1 ? want * aspect : want;
    view.w = Math.min(Math.max(w, minViewW()), fitView().w);
    view.h = view.w / aspect;
    view.x = cx - view.w / 2;
    view.y = cy - view.h / 2;

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



  var pointers = new Map();
  var dragStart = null;
  var pinchStart = null;



  var zoomHold = null;
  var downTarget = null;
  var movedFar = false;






  var marquee = null;
  var marqueeBox = null;
  var MARQUEE_MIN = 12;                       // px, below which it was a click

  function wirePointer() {



    container.addEventListener('contextmenu', function (e) {





      if (annApi && annApi.rightClick(e.target)) { e.preventDefault(); return; }
      if (openMenu(e.clientX, e.clientY, e.target)) e.preventDefault();
    });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });






    container.addEventListener('dblclick', function (e) { e.preventDefault(); });





    var typing = function (t) {
      return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
                   || t.tagName === 'SELECT' || t.isContentEditable);
    };
    window.addEventListener('keydown', function (e) {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (typing(e.target) || e.repeat) return;
      if (spaceHeld) return;
      spaceHeld = true;
      spaceFrom = null;                    // the first move sets the anchor
      container.classList.add('space-pan');
      e.preventDefault();
    });
    var releaseSpace = function () {
      if (!spaceHeld) return;
      spaceHeld = false;
      spaceFrom = null;
      container.classList.remove('space-pan');
    };
    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space' || e.key === ' ') releaseSpace();
    });

    window.addEventListener('blur', releaseSpace);











    var syncCtrl = function (e) { revealAllSubs(!!e.ctrlKey); };
    window.addEventListener('keydown', function (e) {
      if (typing(e.target)) return;
      syncCtrl(e);
    });
    window.addEventListener('keyup', syncCtrl);
    window.addEventListener('blur', function () { revealAllSubs(false); });



    container.addEventListener('contextmenu', function (e) { if (coarse) e.preventDefault(); });
    if (hoverCapable) {
      container.addEventListener('mousemove', onHover);
      container.addEventListener('mouseleave', function () {
        setHot(null); setHotProv(null); setSubsAtom(null); hideTooltip();
      });

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






    if (e.target && e.target.closest && e.target.closest('button, a, input, label')) {
      return;
    }


    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { container.setPointerCapture(e.pointerId); } catch (err) { /* not fatal */ }

    if (pointers.size === 1) {
      downTarget = e.target;
      movedFar = false;





      if (e.shiftKey && annApi && annApi.boxStart
          && annApi.boxStart(e.clientX, e.clientY)) {
        dragStart = null;
        movedFar = true;
        hideTooltip();
        return;
      }






      if (e.shiftKey && window.JMAP_SHIFT && window.JMAP_SHIFT(e)) {

      } else if (e.shiftKey && e.pointerType !== 'touch') {
        marquee = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
        dragStart = null;
        movedFar = true;                     // never a tap, whatever it does
        dropForGesture();
        drawMarquee();
        return;
      }









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


      zoomHold = null;
      dragStart = null;
      movedFar = true;                       // a second finger is never a tap
      pinchStart = pinchState();
      dropForGesture();
    }
  }





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














  function fitSvgBox(x0, y0, x1, y1) {
    if (!isFinite(x0) || !isFinite(y0) || !isFinite(x1) || !isFinite(y1)) return false;
    var c = containerSize();
    var aspect = c.w / c.h;
    var pad = 1.14;                          // a little air round the ends
    var bw = Math.abs(x1 - x0) * pad;
    var bh = Math.abs(y1 - y0) * pad;
    var want = Math.max(bw, bh * aspect, minViewW());
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var inside = x0 >= view.x && x1 <= view.x + view.w
              && y0 >= view.y && y1 <= view.y + view.h;
    if (inside && want <= view.w) return false;    // already all on the screen
    if (want <= view.w) {

      view.x = cx - view.w / 2;
      view.y = cy - view.h / 2;
    } else {
      view.w = Math.min(want, fitView().w);
      view.h = view.w / aspect;
      view.x = cx - view.w / 2;
      view.y = cy - view.h / 2;
    }
    applyView();
    return true;
  }

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
    var r = container.getBoundingClientRect();
    var k = view.w / containerSize().w;
    return {
      dist: Math.max(1, Math.hypot(dx, dy)),
      mid: mid,
      rect: r,
      svgMid: { x: view.x + (mid.x - r.left) * k,
                y: view.y + (mid.y - r.top) * k },
      w: view.w,
    };
  }

  function onPointerMove(e) {





    if (annApi) {
      if (annApi.boxMove && annApi.boxMove(e.clientX, e.clientY)) return;
      annApi.held(e.clientX, e.clientY);
      if (annApi.drag(e.clientX, e.clientY)) { e.preventDefault(); return; }
    }














    if (spaceHeld && !dragStart && pointers.size === 0) {
      if (spaceFrom) {
        var sdx = e.clientX - spaceFrom.x;
        var sdy = e.clientY - spaceFrom.y;
        if (sdx || sdy) {
          var scs = containerSize();
          var sscale = view.w / scs.w;
          view.x -= sdx * sscale;
          view.y -= sdy * sscale;
          dropForGesture();
          applyView();
        }
      }
      spaceFrom = { x: e.clientX, y: e.clientY };
      hideTooltip();
      e.preventDefault();
      return;
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



      var pts2 = Array.from(pointers.values());
      var now = { dist: Math.max(1, Math.hypot(pts2[0].x - pts2[1].x,
                                               pts2[0].y - pts2[1].y)),
                  mid: { x: (pts2[0].x + pts2[1].x) / 2,
                         y: (pts2[0].y + pts2[1].y) / 2 } };
      var maxW = fitView().w;
      var newW = Math.min(Math.max(pinchStart.w * (pinchStart.dist / now.dist), minViewW()), maxW);
      var c = containerSize();
      var k = newW / c.w;
      var r = pinchStart.rect;
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

        if (Math.hypot(e.clientX - zoomHold.x, zdy) <= TAP_SLOP) return;
        zoomHold.drawn = true;
        container.classList.add('dragging');
        dropForGesture();
      }



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


      if (!drawn && e.type === 'pointerup') {
        dropForGesture();
        zoomAt(zx, zy, DBL_ZOOM);
      }


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





      if (window.JMAP_TAP && window.JMAP_TAP(e) === false) return;



      var now = Date.now();
      var dbl = lastTap && now - lastTap.t < DBL_MS &&
                Math.abs(e.clientX - lastTap.x) < DBL_SLOP &&
                Math.abs(e.clientY - lastTap.y) < DBL_SLOP;
      lastTap = { t: now, x: e.clientX, y: e.clientY };
      if (pendingTap) { window.clearTimeout(pendingTap); pendingTap = 0; }
      if (!dbl) {
        if (state.mode === 'quiz') {


          var t = downTarget, tx = e.clientX, ty = e.clientY;
          pendingTap = window.setTimeout(function () {
            pendingTap = 0;
            handleTap(t, tx, ty);       // no pinning in the quiz
          }, 300);
        } else if (!(annApi && annApi.tap(e.clientX, e.clientY, downTarget))) {


          handleTap(downTarget, e.clientX, e.clientY, stickyPress(e));
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












  function nearestMarker(cx, cy) {
    if (typeof cx !== 'number' || !svg) return null;
    var m = svg.getScreenCTM();
    if (!m) return null;




    var reach = state.mode === 'quiz' ? DOT_R + 7 : HIT_R;
    var best = null, bestD = reach * reach;
    var ids = Object.keys(sitePos);
    for (var i = 0; i < ids.length; i++) {
      var rec = byId[ids[i]];
      if (!rec || (rec.kind !== 'site'
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
    if (target && target.closest && target.closest('.site')) {
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




        if (own && found.rec === own.rec) return { hit: found, el: stack[i] };
        if (!first) first = { hit: found, el: stack[i] };
      }







      var atomEl = atomEls[target.getAttribute('data-atom')];
      var sub = nearestSubUnit(atomEl, cx, cy, true);




      var shape = sub || atomEl;
      var box = shape && shape.getBoundingClientRect ? shape.getBoundingClientRect() : null;




      if (own && box && box.width < 6 && box.height < 6) {
        return { hit: own, el: shape || target };
      }
      if (first) return first;
      if (own) return { hit: own, el: shape || target };
    }
    var rec = recordFor(target);
    if (rec) return { hit: rec, el: target };


    var near = typeof cx === 'number' ? nearestFine(cx, cy) : null;
    var nrec = near && recordFor(near);
    return nrec ? { hit: nrec, el: near } : null;
  }



  function nearestSubUnit(atomEl, cx, cy, strict) {
    if (!atomEl || !atomEl.querySelectorAll) return null;
    var pad = 3;
    var inside = null, insideArea = Infinity;
    var near = null, nearD = 64;          // 8 px, squared
    $$('[data-prov]', atomEl).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (cx >= r.left - pad && cx <= r.right + pad &&
          cy >= r.top - pad && cy <= r.bottom + pad) {



        var area = r.width * r.height;
        if (area < insideArea) { insideArea = area; inside = el; }
        return;
      }
      var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      var d = dx * dx + dy * dy;
      if (d < nearD) { nearD = d; near = el; }
    });



    return strict ? inside : (inside || near);
  }




  function provinceAt(got, cx, cy) {
    if (!got) return null;



    var atom = got.el && got.el.closest ? got.el.closest('.atom') : null;







    var cand = provinceOf(got.el);
    if (!cand && typeof cx === 'number') {
      var early = nearestSubUnit(atom, cx, cy);
      if (early) cand = provinceOf(early);
    }
    var candEl = (cand && cand.el) || got.el;



    var own = candEl && candEl.getAttribute
      && candEl.getAttribute('data-cluster') === 'Straits Settlements';





    var fine = candEl && candEl.classList
      && candEl.classList.contains('fine');









    var shaded = candEl && candEl.classList
      && (candEl.classList.contains('pop-shaded')
          || candEl.classList.contains('pop-edged'));
    if (!state.cats.territory && !own && !fine && !shaded &&
        !(atom && atom.getAttribute('data-islands'))) {
      return null;
    }
    return cand || null;
  }

  function recordFor(target) {
    if (!target || !target.closest) return null;
    var el = target.closest('.site, .gaz, .atom, .sta-mark');



    if (!el && target.getAttribute && target.getAttribute('data-for')) el = target;
    if (!el) return null;
    var id = el.getAttribute('data-id');
    var rec = id && byId[id];
    if (!rec) return null;
    if ((rec.kind === 'site' || rec.kind === 'gaz')
        && !siteVisible(rec)) return null;





    if (rec.within && !state.cats.territory && byId[rec.within]) {
      rec = byId[rec.within];
    }
    return { rec: rec, el: el };
  }




  function stationDist(hit, got, cx, cy) {
    if (!hit || hit.rec.kind !== 'station') return Infinity;
    var el = got && got.el;
    if (!el || !el.getBoundingClientRect) return Infinity;
    var b = el.getBoundingClientRect();
    if (!b.width && !b.height) return Infinity;
    return Math.hypot(cx - (b.left + b.width / 2), cy - (b.top + b.height / 2));
  }



  var IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '') ||
               /Mac OS X/.test(navigator.userAgent || '');
  function stickyPress(e) {
    return !!(e && (e.metaKey || (e.ctrlKey && !IS_MAC)));
  }
















  function cardFields() {
    return { chip: infoBox.querySelector('.chip'), prim: infoBox.querySelector('.primary'),
             alt: infoBox.querySelector('.alt'), when: infoBox.querySelector('.when'),
             note: infoBox.querySelector('.note-own') };
  }








  function selectPlane(idx) {
    if (!airApi || !airApi.mounted() || airApi.playing()) return false;
    var d = airApi.planAt(idx);
    if (!d) return false;
    select(null);
    if (!infoBox) return false;
    var f = cardFields(), chip = f.chip, prim = f.prim, alt = f.alt, when = f.when, note = f.note;
    if (chip) chip.textContent = 'In the air';
    if (prim) prim.textContent = d.from + ' \u2192 ' + d.to;
    if (alt) {
      alt.textContent = d.routeName + (d.svc ? ' \u00b7 ' + d.svc : '');
      alt.hidden = false;
    }
    if (when) {
      when.textContent = 'Left ' + d.from + ' at ' + d.off
        + (d.offDay > 1 ? ' on day ' + d.offDay : '')
        + ' \u00b7 due ' + d.to + ' at ' + d.on
        + (d.onDay > d.offDay ? ' on day ' + d.onDay : '')
        + (d.freq ? ' \u00b7 ' + d.freq : '');
    }
    if (note) {
      note.textContent = 'Leg ' + d.leg + ' of ' + d.legs + ' on the '
        + (d.dir === 'up' ? 'return' : 'outward') + ' journey.';
      note.hidden = false;
    }
    var prov = infoBox.querySelector('.prov');
    if (prov) prov.hidden = true;




    var host = airCardHost();
    host.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'pop-table-block';
    var h = document.createElement('p');
    h.className = 'pop-head';
    h.textContent = 'This aeroplane\u2019s circuit';
    wrap.appendChild(h);
    var ol = document.createElement('ol');
    ol.className = 'air-calls air-legs';
    d.calls.forEach(function (c) {
      var li = document.createElement('li');
      if (c.now) li.className = 'now';
      else if (c.done) li.className = 'done';
      var pl = document.createElement('span');
      pl.className = 'air-place';
      pl.textContent = c.from + ' \u2192 ' + c.to;
      li.appendChild(pl);
      var sp = document.createElement('span');
      sp.className = 'air-t';
      sp.textContent = c.off + ' \u2013 ' + c.on
        + (c.offDay > 1 ? '  day ' + c.offDay : '');
      li.appendChild(sp);
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    host.appendChild(wrap);

    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    return true;
  }

  function planeTap(target) {
    if (!target || !target.closest) return false;
    var g = target.closest('#planes [data-plan]');
    if (!g) return false;
    return selectPlane(+g.getAttribute('data-plan'));
  }

  function airTap(target, cx, cy) {
    if (!state.air || !target || !target.closest) return false;
    var ring = target.closest('#air [data-air-stop]');
    if (ring) {
      var st = airStopAt[ring.getAttribute('data-air-stop')];
      if (st) { selectAirport(st); return true; }
    }
    var line = target.closest('#air .air-route');
    if (line) {
      var r = airById[line.getAttribute('data-air')];
      if (r) { return airPressed(r, cx, cy); }
    }
    return false;
  }











  function airLegAt(r, cx, cy) {
    var geom = airGeoms[r && r.id];
    if (!geom || cx == null || cy == null) return -1;
    var m = svg.getScreenCTM();
    if (!m) return -1;
    var best = -1, bd = Infinity;
    for (var i = 0; i < geom.length; i++) {
      if (!airDrawsLeg(r.id, i)) continue;
      var pts = geom[i];
      for (var j = 0; j < pts.length; j++) {
        var x = pts[j].x * m.a + pts[j].y * m.c + m.e;
        var y = pts[j].x * m.b + pts[j].y * m.d + m.f;
        var d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d < bd) { bd = d; best = i; }
      }
    }
    return best;
  }

  function airPressed(r, cx, cy) {
    var leg = airLegAt(r, cx, cy);
    var on = leg >= 0 ? airAtLeg(r, leg) : [];
    if (on.length < 2) { selectAir(r); return true; }
    openAirChooser(on, cx, cy);
    return true;
  }








  function openChooser(heading, items, cx, cy) {
    closeMenu();
    menuEl = document.createElement('div');
    menuEl.id = 'jmap-menu';
    menuEl.className = 'air-chooser';
    menuEl.setAttribute('role', 'menu');
    var head = document.createElement('p');
    head.className = 'menu-head';
    head.textContent = heading;
    menuEl.appendChild(head);
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'plain';
      b.setAttribute(it.attr, it.value);
      var dot = document.createElement('span');
      dot.className = 'air-swatch';
      dot.style.background = it.ink;
      b.appendChild(dot);
      var t = document.createElement('span');
      t.className = 'air-pick-text';
      var one = document.createElement('span');
      one.className = 'air-pick-name';
      one.textContent = it.name;
      t.appendChild(one);
      if (it.op) {
        var two = document.createElement('span');
        two.className = 'air-pick-op';
        two.textContent = it.op;
        t.appendChild(two);
      }
      b.appendChild(t);
      b.addEventListener('click', function () { closeMenu(); it.pick(); });
      menuEl.appendChild(b);
    });
    document.body.appendChild(menuEl);
    var box = menuEl.getBoundingClientRect();
    var left = Math.min(cx || 0, window.innerWidth - box.width - 8);
    var top = Math.min(cy || 0, window.innerHeight - box.height - 8);
    menuEl.style.left = Math.max(4, left) + 'px';
    menuEl.style.top = Math.max(4, top) + 'px';
  }
  function openAirChooser(routes, cx, cy) {
    openChooser(routes.length + ' services fly this stretch', routes.map(function (r) {
      return { attr: 'data-air-pick', value: r.id,
               ink: r.ink || 'var(--air-ink, #23405c)',
               name: r.shortName || r.name, op: r.operator,
               pick: function () { selectAir(r); } };
    }), cx, cy);
  }







  function openLineChooser(lines, cx, cy) {
    openChooser(lines.length + ' lines run along here', lines.map(function (l) {
      return { attr: 'data-line-pick', value: String(l.index), ink: l.colour,
               name: l.name,
               pick: function () {
                 var card = trainApi.lineCard(l.index);
                 if (trainApi.pick) trainApi.pick(l.index);
                 if (card) showTrainCard(card);
               } };
    }), cx, cy);
  }

  function handleTap(target, cx, cy, sticky) {
    if (planeTap(target)) return;
    if (airTap(target, cx, cy)) return;
    var got = pick(target, cx, cy);
    var hit = got && got.hit;


    setSubsAtom(hit && hit.rec.kind === 'territory' && got.el && got.el.closest
                ? got.el.closest('.atom') : null);
    var prov = hit && hit.rec.kind === 'territory' ? provinceAt(got, cx, cy) : null;
    lastProv = prov;
    lastProvAt = prov ? toUser(cx, cy) : null;
    if (state.mode === 'quiz') {
      if (hit) { quizAnswer(hit); return; }
      if (quiz && quiz.current) {
        var fb = $('#q-feedback');
        fb.className = 'feedback bad';
        fb.textContent = 'Nothing there — try again.';
      }
      return;
    }








































    var onMarker = !!(hit && hit.rec
                      && (hit.rec.kind === 'site' || hit.rec.kind === 'gaz'));
    var tHit = (trainApi && trainApi.mounted() && state.mode !== 'quiz'
                && !onMarker)
      ? trainApi.hitAt(cx, cy) : null;
    if (tHit && tHit.kind === 'train'
        && tHit.dist < stationDist(hit, got, cx, cy)) {
      var tCard = trainApi.trainCard(tHit.index);
      if (tCard) { showTrainCard(tCard); return; }
    }
    if (tHit && tHit.kind === 'line' && !(hit && hit.rec.kind === 'station')) {


      var manyL = trainApi.linesAt ? trainApi.linesAt(cx, cy) : [];
      if (manyL.length > 1) { openLineChooser(manyL, cx, cy); return; }
      var lCard = trainApi.lineCard(tHit.index);
      if (lCard) {




        if (trainApi.pick) trainApi.pick(tHit.index);
        showTrainCard(lCard);
        return;
      }
    }



    if (trainApi && trainApi.mounted && trainApi.mounted() && trainApi.pick) {
      trainApi.pick(-1);
    }






    var plainSys = railSysOf(target);
    if (plainSys && !trainDraws(plainSys)) {





      var jpCard = plainSys === 'jp' ? jpLineCard(target) : null;
      if (jpCard) { showTrainCard(jpCard); return; }
      showRailCard(plainSys);
      return;
    }
    if (railPicked) setRailPicked('');

    var id = hit ? (hit.rec.rid || hit.rec.id) : null;




    if (hit && hit.rec.kind === 'station' && id === selected) {
      select(null);
      return;
    }



    var clust = prov && prov.el ? clusterOf(prov.el) : null;





    if (coarse) {




      if (clust) {
        setHotProv(prov.el);
      } else if (id && id === selected && prov) {
        setHotProv(prov.el);
      } else {
        lastProv = null;
        setHotProv(null);
      }
    }




    if (inPin(id, prov)) {
      pinned = null;
      redrawHighlight();
      if (sticky) return;
    } else if (sticky) {



      var onProv = !!(state.cats.territory && prov && prov.el);
      pinned = !id ? null
                   : { id: id,
                       cluster: onProv ? null : clust,
                       provEl: onProv ? prov.el : null };
      if (pinned && !pinnedEls()) pinned = null;
      redrawHighlight();
      return;
    }
    select(id, clust);
  }

  var hot = null;







  var hotCluster = null;








  var CLUSTER_HOME = { 'Straits Settlements': 'malaya' };






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









  function clusterOf(el) {
    var name = clusterName(el);
    if (!name) return null;
    var out = [];
    $$('#land [data-cluster]', svg).forEach(function (n) {
      if (clusterName(n) === name) out.push(n);
    });
    return out.length ? out : null;
  }




  function foreignSub(el) {
    if (!el || !el.getAttribute || !el.getAttribute('data-cluster')) return false;
    var home = CLUSTER_HOME[clusterName(el) || ''];
    if (!home) return false;
    var atom = el.closest && el.closest('.atom');
    return !!atom && atom.getAttribute('data-id') !== home;
  }






  function hostOf(rec, provEl) {
    if (!foreignSub(provEl)) return rec;
    var home = byId[CLUSTER_HOME[clusterName(provEl)]];
    return home ? shown(home) : rec;
  }












  var withinIdx = null;
  var litExtraEls = null;

  function dropLitIndex() { withinIdx = null; litExtraEls = null; }

  function litIndexes() {
    if (!withinIdx) {
      withinIdx = {};
      territories().forEach(function (t) {
        if (t.within) (withinIdx[t.within] = withinIdx[t.within] || []).push(t.id);
      });
    }
    if (!litExtraEls) {
      litExtraEls = {};
      $$('[data-lit-for]', svg).forEach(function (el) {
        var t = el.getAttribute('data-lit-for');
        (litExtraEls[t] = litExtraEls[t] || []).push(el);
      });
    }
  }

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


    if (id) {
      litIndexes();
      (withinIdx[id] || []).forEach(function (tid) {
        (atomsOf[tid] || []).forEach(function (el) {
          if (els.indexOf(el) < 0) els.push(el);
        });
      });





      (litExtraEls[id] || []).forEach(function (el) {
        if (el.style.display !== 'none' && els.indexOf(el) < 0) els.push(el);
      });
    }
    return els;
  }









  function seamsFor(id, cluster) {
    var els = [];
    if (!id) return els;






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




  var lastProvAt = null;














  var selProv = null;










  var selCluster = null;








  var subsAtom = null;
  var subsAtoms = [];



















  var SUBS_LIFT = { india: true, siam: true };






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




    if (n) el.classList.add('lifted');
  }












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


    if (subsAllOn) { subsAllWas = el; return; }
    if (subsAtom === el) return;
    subsAtoms.forEach(function (a) { a.classList.remove('subs'); });
    subsAtom = el;
    subsAtoms = [];
    if (el) {
      var id = el.getAttribute('data-id');







      subsAtoms = (id ? litFor(id, null) : [el])
        .filter(function (a) { return a.classList && a.classList.contains('atom'); });
      if (subsAtoms.indexOf(el) < 0) subsAtoms.push(el);
      subsAtoms.forEach(function (a) { a.classList.add('subs'); });
    }
    markSplitProvinces();
    liftSubs(subsAtom);
  }





















  var themeLayer = null, themeState = 'none', themeShown = '';
  var themeMenuEl = null;


  var themeRestore = null;














  var THEMES_FOR = {
    burma: { box: [92.1, 9.9, 101.2, 28.5], ids: ['burma-rule'] },
  };

  function themeRec(id) {
    return (JMAP.THEMES || {})[id] || null;
  }





  function themesHere() {
    var ids = [];
    Object.keys(THEMES_FOR).forEach(function (key) {
      var rec = THEMES_FOR[key];
      if (viewMeets(rec.box)) ids = ids.concat(rec.ids);
    });
    return ids;
  }

  function loadThemes(then) {
    if (themeState === 'ready') { then(); return; }
    if (themeState === 'loading') return;
    themeState = 'loading';
    loadScript('themes.js').then(function () {
      themeState = JMAP.THEMES ? 'ready' : 'failed';
      if (themeState === 'ready') then();
    }, function () { themeState = 'failed'; });
  }









  function clipFor(atom) {
    if (!atom || !svg) return '';
    var el = $('#a-' + atom + ' [data-prov][clip-path]', svg);
    var m = el && /url\(#([^)]+)\)/.exec(el.getAttribute('clip-path') || '');
    return m ? m[1] : '';
  }

  function buildTheme(id) {
    var rec = themeRec(id);
    if (!rec || !svg) return null;
    var g = svgEl('g', { id: 'thematic', 'data-theme': id });










    (rec.cats || []).forEach(function (cat) {
      var d = '';
      (cat.r || []).forEach(function (flatRing) {
        for (var i = 0; i < flatRing.length; i += 2) {
          var q = mercFwd(flatRing[i], flatRing[i + 1]);
          d += (i ? 'L' : 'M') + (Math.round(q.x * 10) / 10) + ' '
             + (Math.round(q.y * 10) / 10);
        }
        d += 'Z';
      });
      if (!d) return;
      g.appendChild(svgEl('path', {
        d: d, fill: cat.c, 'data-cat': cat.id, 'data-cat-en': cat.en,
      }));
    });



    svg.insertBefore(g, subsLiftLayer || markersGroup || null);
    if (projMode !== 'mercator') reprojectGraft([g]);
    themeLayer = g;
    applyThemeClip();
    return g;
  }















  function applyThemeClip() {
    if (!themeLayer || themeLayer.getAttribute('clip-path')) return;
    var rec = themeRec(themeShown);
    var clip = clipFor(rec && rec.atom);
    if (clip) themeLayer.setAttribute('clip-path', 'url(#' + clip + ')');
  }

  function themeOn() { return themeShown; }

  function setTheme(id) {
    id = id || '';
    if (id === themeShown) return;
    if (id && !themeRec(id)) {
      loadThemes(function () { setTheme(id); });
      return;
    }
    if (themeLayer) { themeLayer.remove(); themeLayer = null; }
    if (!id) {
      var wasAtom = atomEls[(themeRec(themeShown) || {}).atom]
        || $('#a-' + ((themeRec(themeShown) || {}).atom || ''), svg);



      if (wasAtom && subsAtoms.indexOf(wasAtom) < 0) wasAtom.classList.remove('subs');
      themeShown = '';
      state.themeId = '';


      if (themeRestore) {
        if (!themeRestore.admin) state.cats.territory = false;
        if (!themeRestore.labels) state.labels = false;
        themeRestore = null;
        applyState();
      }
      buildLegend();
      syncMapButtons();
      return;
    }
    themeRestore = { admin: !!state.cats.territory, labels: !!state.labels };




    state.cats.territory = true;
    state.labels = true;
    themeShown = id;
    state.themeId = id;
    applyState();
    themeLayer = buildTheme(id);








    var tAtom = atomEls[(themeRec(id) || {}).atom]
      || $('#a-' + ((themeRec(id) || {}).atom || ''), svg);
    if (tAtom) tAtom.classList.add('subs');
    buildLegend();
    syncMapButtons();
    scheduleUrl();
    saveState();
  }





  function themeFollowsView() {
    if (!themeShown) return;
    var rec = themeRec(themeShown);
    var home = rec && THEMES_FOR[rec.atom];






    if (home && home.box && !viewMeets(home.box)) setTheme('');
  }















  function themeCatOf(el) {
    if (!themeShown) return '';
    var name = el && el.getAttribute ? el.getAttribute('data-prov') : '';
    var rec = themeRec(themeShown);
    var key = name && rec && rec.rule ? rec.rule[name] : '';
    if (!key) return '';
    var cats = (rec.cats || []).filter(function (c) { return c.id === key; });
    return cats.length ? cats[0].en : '';
  }















  function themeCatAt(cx, cy) {
    var u = toUser(cx, cy);
    return u ? themeCatAtUser(u.x, u.y) : '';
  }






  function toUser(cx, cy) {
    if (!svg) return null;
    var m = svg.getScreenCTM();
    if (!m) return null;
    var pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    var u = pt.matrixTransform(m.inverse());
    return { x: u.x, y: u.y };
  }

  function themeCatAtUser(ux, uy) {
    if (!themeShown || !themeLayer || !svg) return '';
    var q = svg.createSVGPoint();
    q.x = ux; q.y = uy;
    var paths = themeLayer.childNodes;
    for (var i = 0; i < paths.length; i++) {
      var el = paths[i];
      if (!el.isPointInFill) continue;
      try {
        if (el.isPointInFill(q)) return el.getAttribute('data-cat-en') || '';
      } catch (err) { /* no geometry yet */ }
    }
    return '';
  }























  var SUB_INK_DARK = 'rgba(18, 15, 10, .62)';
  var SUB_INK_LIGHT = 'rgba(255, 255, 255, .72)';

  var SUB_INK_DARK_GROUND = 0.22;
  var subsAllOn = false, subsAllWas = null;

  function revealAllSubs(on) {






    on = !!on && !!svg && svg.classList.contains('admin-on');
    if (on === subsAllOn) return;
    if (on) {
      subsAllWas = subsAtom;
      subsAtoms.forEach(function (a) { a.classList.remove('subs'); });
      subsAtom = null;


      subsAtoms = $$('.atom', svg).filter(function (a) {
        return !!$('[data-prov]', a);
      });
      subsAtoms.forEach(function (a) {
        a.classList.add('subs');






























        var lum = fillLum(a);
        a.style.setProperty('--sub-line',
          (lum !== null && lum <= SUB_INK_DARK_GROUND) ? SUB_INK_LIGHT : SUB_INK_DARK);
      });
      subsAllOn = true;
      markSplitProvinces();
      liftSubs(null);
      return;
    }
    subsAtoms.forEach(function (a) {
      a.classList.remove('subs');
      a.style.removeProperty('--sub-line');
    });
    subsAtoms = [];
    subsAtom = null;
    subsAllOn = false;





    setSubsAtom(subsAllWas || $('.atom.hot', svg) || null);
    subsAllWas = null;
  }



  function provLabel(key) {
    var rec = (JMAP.PROVINCES || {})[key];
    var per = JMAP.PROVINCE_EPOCH && JMAP.PROVINCE_EPOCH[state.epoch];
    var over = per && per[key];
    var en = (over && over.en) || (rec && rec.en) || key;
    var cut = en.indexOf(' — ');
    return cut > 0 ? en.slice(0, cut) : en;
  }








  function provPeers(el) {
    if (!el || !el.getAttribute) return [];
    var key = el.getAttribute('data-prov');
    var atom = el.closest && el.closest('.atom');
    var id = atom && atom.getAttribute('data-id');
    if (!key || !id) return [el];






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

    return out.length > PEER_CAP ? [el] : out;
  }











  var hotParent = null;
  function parentPeers(el) {
    var want = el && el.getAttribute && el.getAttribute('data-parent');
    if (!want) return null;







    var out = [];
    $$('#land [data-shu="' + want + '"]', svg).forEach(function (n) { out.push(n); });
    if (!out.length) {
      $$('#land [data-parent="' + want + '"]', svg).forEach(function (n) { out.push(n); });
    }
    return out.length ? out : null;
  }














  var selProvEls = [];

  function setSelProv(el) {
    selProvEls.forEach(function (n) { n.classList.remove('prov-sel'); });
    selProvEls = el ? (provPeers(el) || []) : [];
    selProvEls.forEach(function (n) { n.classList.add('prov-sel'); });


    redrawHighlight();
  }

  function setHotProv(el) {
    if (hotProvEl === el) return;
    hotProv.forEach(function (n) { n.classList.remove('prov-hot'); });
    if (hotParent) hotParent.forEach(function (n) { n.classList.remove('parent-hot'); });
    hotProvEl = el;
    hotProv = provPeers(el);
    hotParent = parentPeers(el);
    hotProv.forEach(function (n) { n.classList.add('prov-hot'); });


    if (hotParent) hotParent.forEach(function (n) { n.classList.add('parent-hot'); });
    redrawHighlight();
  }

  function provinceOf(target) {
    if (!target || !target.getAttribute) return null;
    var key = target.getAttribute('data-prov');




    if (target.getAttribute('data-ja') || target.getAttribute('data-group')) {




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






      var said = key && (JMAP.PROVINCES || {})[key];
      if (said) {
        Object.keys(said).forEach(function (k) { own[k] = said[k]; });
      }
      return { key: key || own.ja || grp, rec: own, el: target };
    }
    if (!key) return null;
    var rec = (JMAP.PROVINCES || {})[key];








    var parent = target.getAttribute('data-parent') || '';
    if (rec && parent) {
      var withParent = {};
      Object.keys(rec).forEach(function (k) { withParent[k] = rec[k]; });
      withParent.parent = parent;
      rec = withParent;
    }


    var per = JMAP.PROVINCE_EPOCH && JMAP.PROVINCE_EPOCH[state.epoch];
    var over = per && per[key];
    if (rec && over) {
      var merged = {};
      Object.keys(rec).forEach(function (k) { merged[k] = rec[k]; });
      Object.keys(over).forEach(function (k) { merged[k] = over[k]; });






      var baseGloss = splitGloss(rec.en || '').gloss;
      if (over.en && baseGloss && (over.en || '').indexOf(' — ') < 0) {
        merged.en = over.en + ' — ' + baseGloss.replace(/\.$/, '');
      }
      rec = merged;
    }
    return { key: key, rec: rec, el: target };
  }

  function onHover(e) {

    if (annApi && annApi.dragging && annApi.dragging()) return;


    if (annApi && annApi.drawing()) { setHot(null); setHotProv(null); hideTooltip(); return; }


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
    lastProvAt = prov ? toUser(e.clientX, e.clientY) : null;
    setHotProv(prov ? prov.el : null);
    showTooltip(hit.rec, e.clientX, e.clientY, prov);
  }


















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













  var contestedEls = null;
  function contestedAt(cx, cy) {
    if (!svg) return false;
    if (!contestedEls) {
      contestedEls = ['a-contested', 'a-contested_burma']
        .map(function (id) { return $('#' + id, svg); })
        .filter(Boolean);
    }
    if (!contestedEls.length) return false;
    var u = toUser(cx, cy);
    if (!u) return false;
    var q = svg.createSVGPoint();
    q.x = u.x; q.y = u.y;
    for (var i = 0; i < contestedEls.length; i++) {
      var el = contestedEls[i];

      if (el.style.display === 'none') continue;
      try { if (el.isPointInFill(q)) return true; } catch (err) { /* no geometry yet */ }
    }
    return false;
  }

  function showTooltip(base, cx, cy, prov) {
    var rec = shown(base);
    var head = prov && prov.rec ? shown(prov.rec) : rec;

    var host = hostOf(rec, prov && prov.el);
    tipAt = { x: cx, y: cy };


    var key = (rec && (rec.rid || rec.id)) + '|' + (head && (head.rid || head.id || head.en)) +
              '|' + (host && (host.rid || host.id)) + '|' + state.epoch + '|' + state.lang



              + '|' + (popPieOn()[0] ? popPieOn()[0].mode : '')



              + '|' + (state.hanLabels ? 'han' : '')



              + '|' + (state.themeId || '')



              + '|' + themeCatAt(cx, cy)



              + '|' + (contestedAt(cx, cy) ? 'ct' : '');
    if (key === tipKey && !tooltip.hidden) {
      if (!tipFrame) tipFrame = requestAnimationFrame(placeTooltip);
      return;
    }
    tipKey = key;
    tooltip.innerHTML = '';











    var headline = splitGloss(nameOf(head)).name;
    var displaced = '';
    if (state.hanLabels) {
      var hh = head.kind === 'station' ? (head.han || '') : hanOf(head);
      if (hh && hh !== headline) { displaced = headline; headline = hh; }
    }
    tooltip.appendChild(document.createTextNode(headline));
    if (head !== rec) {


      var alt = [displaced, otherNames(head, headline)]
        .filter(Boolean).join('  ');
      if (alt) {
        var pa = document.createElement('span');
        pa.className = 'sub alt-script';
        pa.textContent = alt;
        tooltip.appendChild(pa);
      }


      if (head.group || head.region) {


        var gp = document.createElement('span');
        gp.className = 'sub group';
        var line = [head.group, head.groupJa].filter(Boolean).join('  ');
        if (head.parent) line = (line ? line + ' · ' : '') + head.parent;
        if (head.region) line = (line ? line + '  ' : '') + '(' + head.region + ')';
        gp.textContent = line;
        tooltip.appendChild(gp);
      }





      if (head.parent && !head.group) {
        var pp = document.createElement('span');
        pp.className = 'sub group';
        var prot = (JMAP.PROVINCES || {})[head.parent];
        pp.textContent = (prot && nameOf(shown(prot))) || head.parent;
        tooltip.appendChild(pp);
      }
      var pv = document.createElement('span');
      pv.className = 'sub prov';








      var owner = host.under || otherNames(host) || [];
      pv.textContent = [nameOf(host)].concat(owner).join('  ');
      tooltip.appendChild(pv);


















      if (contestedAt(cx, cy) && (!rec || rec.id !== 'contested')) {
        var ctRec = territoryOf('contested');
        var ct = document.createElement('span');
        ct.className = 'sub contested-note';
        ct.textContent = ctRec ? splitGloss(nameOf(ctRec)).name
                               : 'Border is contested or not fixed';
        tooltip.appendChild(ct);
      }



      var tcat = themeCatAt(cx, cy) || themeCatOf(prov && prov.el);
      if (tcat) {
        var tc = document.createElement('span');
        tc.className = 'sub theme-cat';
        tc.textContent = tcat;
        tooltip.appendChild(tc);
      }
      if (host.rule) {
        var rl = document.createElement('span');
        rl.className = 'sub rule';
        rl.textContent = host.rule;
        tooltip.appendChild(rl);
      }
    } else {


      var second = displaced
        || (state.lang === 'en' ? rec.ja : rec.en);






      if (second && second !== headline
          && (displaced || second !== nameOf(rec))) {
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














    var pie = prov ? popTipBlock(prov.key) : null;



    if (!pie && prov && popBlankAt(prov.key)) {
      pie = document.createElement('span');
      pie.className = 'sub tip-pie-of';
      pie.textContent = 'N/A — no data available';
    }
    if (pie) {
      tooltip.appendChild(pie);
    } else {
      var brief = shortOf(head);
      if (brief) {
        var pn = document.createElement('span');
        pn.className = 'sub prov-note';
        pn.textContent = brief;
        tooltip.appendChild(pn);
      }
    }
    tooltip.hidden = false;
    if (!tipFrame) tipFrame = requestAnimationFrame(placeTooltip);
  }

  function hideTooltip() {
    tooltip.hidden = true;
    tipKey = null;
    tipAt = null;
  }












  var maskSeq = 0;

  function outlineOf(els, cls, layer) {
    layer = layer || highlightLayer;






    els = els.filter(function (e) {
      return !(e.classList && e.classList.contains('superseded'));
    });













    els = els.filter(function (e) {
      if (!e.parentNode || e.parentNode.id !== 'backings') return true;
      var atom = atomEls[e.getAttribute('data-for')];
      if (!atom) return true;
      return !ownShapes(atom);
    });
    if (!layer || !els.length || !hiDefs) return;
    var owned = ownedDefs[layer === subOutlineLayer ? 'sub' : 'hi'];
    var id = 'mask-' + (++maskSeq);








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













      mx0 = bb.x0 - pad; my0 = bb.y0 - pad;
      mx1 = bb.x1 + pad; my1 = bb.y1 + pad;
    }
    var mw = mx1 - mx0, mh = my1 - my0;
    var mask = svgEl('mask', { id: id, maskUnits: 'userSpaceOnUse',
                               x: mx0, y: my0, width: mw, height: mh });
    mask.appendChild(svgEl('rect', { x: mx0, y: my0, width: mw, height: mh,
                                     fill: '#fff' }));
    var group = svgEl('g', { 'class': cls });




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












      var clip = clipOf(el);





      var paths = el.tagName === 'path' ? [el] : $$('path:not(.superseded):not(.foreign-sub)', el);



      var circles = el.tagName === 'path' ? []
        : $$('circle:not(.islet-hit):not(.islet):not(.superseded)', el);












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













      var guard = /hi-parent|hi-province|sub-/.test(cls) ? 0.1 : 1.3;
      paths.concat(circles).forEach(function (shape) {








        var solid = copyOf(shape, {
          fill: '#000', stroke: '#000', 'stroke-width': guard,
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






















  var hiSlots = { territory: null, province: null, selprov: null,
                  selected: null, pinned: null };
  var hiHost = { territory: null, province: null, selprov: null,
                 selected: null, pinned: null };


  var HI_ORDER = ['territory', 'province', 'selprov', 'selected', 'pinned'];








  var hiGen = 0;
  function bumpHi() { hiGen++; emptyPark(); }






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

      HI_ORDER.forEach(function (k) {
        if (!hiHost[k] || !hiHost[k].isConnected) {
          hiHost[k] = svgEl('g', { 'class': 'hi-slot' });
          highlightLayer.appendChild(hiHost[k]);
        }
      });
    }
    return hiHost[name];
  }













  var outlinePark = {};
  var outlineParkKeys = [];
  var OUTLINE_PARK_MAX = 8;

  function emptyPark() { outlinePark = {}; outlineParkKeys = []; }

  function parkSlot(slot) {
    if (!slot || !slot.key || outlinePark[slot.key]) return;
    outlinePark[slot.key] = slot;
    outlineParkKeys.push(slot.key);
    if (outlineParkKeys.length > OUTLINE_PARK_MAX) {
      delete outlinePark[outlineParkKeys.shift()];
    }
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
    parkSlot(slot);
    hiSlots[name] = null;
  }




  function fillSlot(name, key, els, cls) {
    if (hiSlots[name] && hiSlots[name].key === key) return;
    dropSlot(name);
    if (!key || !els || !els.length) return;
    var host = hiHostFor(name);
    if (!host) return;
    var parked = outlinePark[key];
    if (parked) {
      delete outlinePark[key];
      outlineParkKeys.splice(outlineParkKeys.indexOf(key), 1);
      parked.defs.forEach(function (d) {
        hiDefs.appendChild(d);
        ownedDefs.hi.push(d);
      });
      host.appendChild(parked.group);
      hiSlots[name] = parked;
      return;
    }
    var before = ownedDefs.hi.length;
    var group = outlineOf(els, cls, host);
    if (!group) return;
    hiSlots[name] = { key: key, group: group,
                      defs: ownedDefs.hi.slice(before) };
  }

  function clearHighlight() {
    emptyPark();
    HI_ORDER.forEach(function (n) {
      dropSlot(n);
    });
    emptyPark();                  // and what dropSlot just parked goes too
    if (highlightLayer) highlightLayer.innerHTML = '';
    hiHost = { territory: null, province: null, selected: null, pinned: null };


    pinned = null;
    pinFilter = null;
    dropDefs('hi');
  }



  function seen(id) { return id && byId[id] && !byId[id].unseen; }




  function slotKey(kind, id, cluster, els) {
    if (!els || !els.length) return null;
    return kind + '|' + (id || '') + '|' +
      (cluster ? (clusterName(cluster[0]) || 'c') + ':' + cluster.length : '') +
      '|' + els.length + '|' + hiGen;
  }





  function ensurePinFilter() {
    if (pinFilter && pinFilter.isConnected) return pinFilter;
    if (!hiDefs) return null;
    pinFilter = hiDefs.querySelector('#pin-glow');
    if (pinFilter) return pinFilter;
    pinFilter = svgEl('filter', { id: 'pin-glow', x: '-45%', y: '-45%',
                                  width: '190%', height: '190%' });

    pinFilter.appendChild(svgEl('feMorphology', {
      'in': 'SourceAlpha', operator: 'dilate', radius: PIN_CASE_PX,
      result: 'wide' }));
    pinFilter.appendChild(svgEl('feFlood', {
      'flood-color': '#1b1508', 'flood-opacity': '0.92', result: 'ink' }));
    pinFilter.appendChild(svgEl('feComposite', {
      'in': 'ink', in2: 'wide', operator: 'in', result: 'case' }));
    pinFilter.appendChild(svgEl('feGaussianBlur', {
      'in': 'case', stdDeviation: PIN_BLUR_PX, result: 'soft' }));

    var merge = svgEl('feMerge', {});
    merge.appendChild(svgEl('feMergeNode', { 'in': 'soft' }));
    merge.appendChild(svgEl('feMergeNode', { 'in': 'SourceGraphic' }));
    pinFilter.appendChild(merge);
    hiDefs.appendChild(pinFilter);
    return pinFilter;
  }





  function setPinBlur(k) {
    if (!pinned) return;                 // nothing is wearing it
    var f = ensurePinFilter();
    if (!f) return;
    var round = function (v) { return Math.round(v * 1000) / 1000; };
    var morph = f.querySelector('feMorphology');
    var blur = f.querySelector('feGaussianBlur');
    if (morph) morph.setAttribute('radius', round(PIN_CASE_PX * k));
    if (blur) blur.setAttribute('stdDeviation', round(PIN_BLUR_PX * k));
  }






  function pinnedEls() {
    if (!pinned) return null;
    if (pinned.provEl) {
      if (!pinned.provEl.isConnected) return null;
      return provPeers(pinned.provEl);
    }
    if (!atomsOf[pinned.id] || !seen(pinned.id)) return null;
    return litFor(pinned.id, pinned.cluster);
  }



  function inPin(id, prov) {
    if (!pinned) return false;
    if (pinned.provEl) {
      if (!prov || !prov.el || !pinned.provEl.isConnected) return false;
      return provPeers(pinned.provEl).indexOf(prov.el) >= 0;
    }
    return !!id && id === pinned.id;
  }

  function redrawHighlight() {






    var bothSame = selected && hot === selected && !hotCluster && !selCluster;
    var tEls = null;
    if (hotCluster) tEls = hotCluster;





    else if (hotParent && hotParent.length) tEls = hotParent;
    else if (!bothSame && hot && atomsOf[hot] && seen(hot)) {
      tEls = litFor(hot, hotCluster);
    }





    var deep = !!(hotParent && hotParent.length);







    var parentKey = deep && hotProvEl && hotProvEl.getAttribute
      ? hotProvEl.getAttribute('data-parent') : null;
    fillSlot('territory',
      slotKey('t', parentKey || hot, hotCluster || hotParent, tEls),
      tEls, 'hi-territory' + (deep ? ' hi-parent' : ''));
    fillSlot('province', slotKey('p', hotProvEl && hotProvEl.getAttribute('data-prov'),
                                 (deep ? ['deep'] : null), hotProv),
             hotProv, 'hi-province' + (deep ? ' hi-inner' : ''));





    if (selProvEls.length) {
      fillSlot('selprov',
               slotKey('q', selProvEls[0].getAttribute('data-prov'),
                       null, selProvEls),
               selProvEls, 'hi-selprov');
    } else {
      dropSlot('selprov');
    }
    if (selected && atomsOf[selected] && seen(selected)) {





      var sEls = litFor(selected, selCluster);
      fillSlot('selected', slotKey('s', selected, selCluster, sEls), sEls, 'hi-selected');
    } else {
      dropSlot('selected');
    }
    var pEls = pinnedEls();
    if (pinned && !pEls) pinned = null;      // its ground went out from under it
    if (pinned) {
      ensurePinFilter();
      fillSlot('pinned',
               slotKey('k', pinned.provEl
                            ? pinned.provEl.getAttribute('data-prov') : pinned.id,
                       pinned.cluster, pEls),
               pEls, 'hi-pinned');




      var ps = hiSlots.pinned;
      if (ps && ps.group && ps.group.getAttribute('filter') !== 'url(#pin-glow)') {
        ps.group.setAttribute('filter', 'url(#pin-glow)');
      }
      setPinBlur(view.w / containerSize().w);
    } else {
      dropSlot('pinned');
    }
  }


















  var EMPH = /(\*\*?)(?!\s)([^*]+?)\1/;




  var MDLINK = /\[([^\]\n]+)\]\((\S+?)\)/;







  function safeHref(u) {
    var raw = String(u || '').trim();
    if (!/^https?:\/\//i.test(raw)) return '';
    try {
      var url = new URL(raw);
      return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
    } catch (err) { return ''; }
  }

  function setProse(el, text) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    var rest = String(text == null ? '' : text);
    if (!rest) return;


    for (var guard = 0; guard < 500; guard++) {


      var lm = MDLINK.exec(rest);
      var em = EMPH.exec(rest);
      if (lm && (!em || lm.index <= em.index)) {
        if (lm.index) el.appendChild(document.createTextNode(rest.slice(0, lm.index)));
        var href = safeHref(lm[2]);
        if (href) {
          var link = document.createElement('a');





          link.className = 'note-link';
          link.href = href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = lm[1];
          el.appendChild(link);
        } else {

          el.appendChild(document.createTextNode(lm[0]));
        }
        rest = rest.slice(lm.index + lm[0].length);
        continue;
      }
      var m = em;
      if (!m || !m[2]) break;


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
    trainCardWaiting = -1;



    selCluster = (cluster !== undefined ? cluster
                  : (lastProv && lastProv.el ? clusterOf(lastProv.el) : null)) || null;
    var airHost = infoBox && infoBox.querySelector('#info-air');
    if (airHost) airHost.innerHTML = '';
    if (!id || !byId[id]) {
      selCluster = null;
      selProv = null;
      setSelProv(null);
      infoBox.hidden = true;
      fillPopCard(null);
      fillTrainCard(null);
      document.body.classList.toggle('panel-open', !quizBox.hidden);
      redrawHighlight();


      gateLabels();
      placeLabels();
      return;
    }

    var rec = shown(byId[id]);
    selected = id;
    markSelected(id, true);
    redrawHighlight();




    var sub = lastProv && lastProv.rec ? shown(lastProv.rec) : null;


    selProv = lastProv || null;
    setSelProv(selProv && selProv.el);



    var host = hostOf(rec, lastProv && lastProv.el);
    var head = sub || rec;





    var split = splitGloss(nameOf(head));
    var primary = split.name;




    if (state.hanLabels) {
      var headHan = rec.kind === 'station' ? (head.han || '') : hanOf(head);
      if (headHan && headHan !== primary) primary = headHan;
    }






    var others = rec.kind === 'station'
      ? [otherNames(head)].filter(Boolean)
      : LANGS
        .filter(function (l) { return l !== state.lang; })
        .map(function (l) { return head[l]; })
        .filter(function (n) { return n && n !== primary; });




    if (state.hanLabels && split.name && split.name !== primary) {



      others = others.filter(function (n) { return n !== primary; });
      if (others.indexOf(split.name) < 0) others.unshift(split.name);
    }

    var info = rec.kind === 'station'
      ? (STATION_CATS[rec.staKind] || STATION_CATS.station) : catInfo(rec.cat);
    var chip = $('.chip', infoBox);
    chip.textContent = info ? nameOf(info) : rec.cat;
    chip.style.setProperty('--chip', info ? info.c : 'var(--muted)');












    [head.fr, head.alt].forEach(function (other) {
      if (other && other !== primary && others.indexOf(other) < 0) {
        others.push(other);
      }
    });
    $('.primary', infoBox).textContent = primary;
    $('.alt', infoBox).textContent = others.join('  ·  ');





    var owner = (sub && rec.cat !== 'ccp')
      ? [nameOf(host)].concat(otherNames(host) || []).join('  ') : '';






    if (owner && head.parent) {
      var prot = (JMAP.PROVINCES || {})[head.parent];
      owner = ((prot && nameOf(shown(prot))) || head.parent) + '  ·  ' + owner;
    }

    if (owner && host.rule) owner += '  ·  ' + host.rule;
    $('.prov', infoBox).textContent = owner;
    $('.prov', infoBox).hidden = !owner;
    $('.when', infoBox).textContent = host.date || host.when || '';
    $('.when', infoBox).hidden = !(host.date || host.when);























    var isSta = rec.kind === 'station';
    var ownNote = isSta ? (shortOf(rec) || '')
                : sub ? (head.note || split.gloss || shortOf(head) || '')
                      : (rec.note || '');

























    var themeCat = sub
      ? ((lastProvAt ? themeCatAtUser(lastProvAt.x, lastProvAt.y) : '')
         || themeCatOf(lastProv && lastProv.el))
      : '';
    var provEl = lastProv && lastProv.el;
    var mil = (sub && provEl && provEl.getAttribute)
      ? (provEl.getAttribute('data-mil') || '') : '';
    if (mil) {
      ownNote = 'Administrative boundaries as they were on the eve of the '
        + 'Japanese occupation. This area was under the control of the '
        + mil + ' during the occupation.'
        + (ownNote ? '  ' + ownNote : '');
    }



    if (themeCat) {
      var trec2 = themeRec(themeOn());
      ownNote = 'On the ' + ((trec2 && trec2.en) || 'thematic map')
        + ' this is **' + themeCat + '**.'
        + (ownNote ? '  ' + ownNote : '');
    }
    var groupNote = isSta ? (rec.note || '') : (sub ? (host.note || '') : '');
    var own = $('.note-own', infoBox);
    var grp = $('.note-group', infoBox);
    setProse(own, ownNote);
    setProse(grp, groupNote);









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






    var groupName = nameOf(host);
    grp.setAttribute('data-group',
      (groupNote && groupName !== primary) ? groupName : '');


    fillPopCard(sub ? (lastProv && lastProv.key) : id, primary);

    fillTrainCard(byId[id]);
    collapseInfo();





    if (infoBox.hidden && state.legend && !isPhone()) {
      state.legend = false;
      buildLegend();
      saveState();
    }
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    hideTooltip();
    gateLabels();
    placeLabels();
    keepClear(id);
  }














  function fillTrainCard(rec) {
    var host = $('#info-trains');
    if (!host) return;
    host.textContent = '';
    host.hidden = true;
    if (!trainApi || !trainApi.mounted()) return;
    if (!rec || rec.kind !== 'station' || rec.sys !== trainApi.system()) return;
    var d = trainApi.departures(rec.id);




    if (!d || !d.rows.length) return;
    renderTrainBlock(host, d);
  }










  function renderTrainBlock(host, block) {
    host.textContent = '';
    host.hidden = true;
    if (!block) return;




    if (!block.rows || !block.rows.length) {






      var said = false;
      if (block.waiting && block.head) {
        var wait = document.createElement('p');
        wait.className = 'trains-head trains-waiting';
        wait.textContent = block.head;
        host.appendChild(wait);
        said = true;
      }
      if ((block.links || []).length) {
        appendCardLinks(host, block);
        said = true;
      }
      host.hidden = !said;
      return;
    }
    if (block.head) {
      var head = document.createElement('p');
      head.className = 'trains-head';
      head.textContent = block.head;
      host.appendChild(head);
    }
    var scroll = document.createElement('div');
    scroll.className = 'trains-scroll';
    var table = document.createElement('table');
    table.className = 'trains-table';
    var named = (block.cols || []).some(function (c) { return c; });
    if (named) {
      var thead = document.createElement('tr');
      block.cols.forEach(function (h) {
        var th = document.createElement('th');
        th.textContent = h;
        thead.appendChild(th);
      });
      table.appendChild(thead);
    }
    block.rows.forEach(function (r) {
      var tr = document.createElement('tr');
      r.cells.forEach(function (text, i) {
        var td = document.createElement('td');
        if (i === r.swatchAt && r.swatch) {
          var sw = document.createElement('span');
          sw.className = 'sw';
          sw.style.background = r.swatch;
          td.appendChild(sw);
          td.appendChild(document.createTextNode(text));
        } else {
          td.textContent = text;
        }
        if (i === 0 && r.first) td.className = 'first';




        if (r.nums && r.nums.indexOf(i) >= 0) {
          td.className = (td.className ? td.className + ' ' : '') + 'num';
        }


        if (r.uncertain && text && i < (r.timeCells || 0)
            && (!r.first || i > 0)) {
          td.className = (td.className ? td.className + ' ' : '') + 'unc';
        }
        if (r.title) td.title = r.title;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    scroll.appendChild(table);
    host.appendChild(scroll);




    if (block.list && block.list.items && block.list.items.length) {
      var lh = document.createElement('p');
      lh.className = 'trains-head trains-list-head';
      lh.textContent = block.list.head;
      host.appendChild(lh);
      var lp = document.createElement('p');
      lp.className = 'trains-list';
      lp.textContent = block.list.items.join('\u3001');
      host.appendChild(lp);
    }





    appendCardLinks(host, block);
  }



  function appendCardLinks(host, block) {
    (block.links || []).forEach(function (l) {
      var a = document.createElement('a');
      a.className = 'note-src';





      a.href = l.page
        ? asset(l.page) + (state.jpNames ? '&rd=ja' : '')
          + (l.anchor ? '#' + l.anchor : '')
        : l.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = l.text;



      if (l.page) {
        a.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
          if (!roomForTable()) return;
          e.preventDefault();




          openTable(withLang(a.href), l.text);
        });
      }
      host.appendChild(a);
    });






    if (block.geoLi !== undefined && block.geoLi !== null
        && trainApi && trainApi.mounted() && trainApi.lineFeature) {
      var geo = trainApi.lineFeature(block.geoLi);
      if (geo) {


        var grow = document.createElement('p');
        grow.className = 'pop-actions';
        var gname = railFileName(geo);
        var gb = document.createElement('button');
        gb.type = 'button';
        gb.className = 'plain pop-csv';
        gb.textContent = 'Download GeoJSON';
        gb.title = 'The track of this line in longitude and latitude, '
          + 'unprojected, for QGIS or anything else';
        gb.addEventListener('click', function () {
          var ok = saveRailGeoJSON([geo], gname);
          gb.textContent = ok ? 'Downloaded' : 'Could not save';
          window.setTimeout(function () {
            gb.textContent = 'Download GeoJSON';
          }, 1400);
        });
        grow.appendChild(gb);
        host.appendChild(grow);
      }
    }





    var srcSys = trainApi && trainApi.mounted && trainApi.mounted()
      && trainApi.system && trainApi.system();
    var srcCfg = srcSys && TRAIN_SYS[srcSys];
    if (srcCfg && srcCfg.src) {
      var sp = document.createElement('p');
      sp.className = 'trains-src';
      if (srcCfg.srcHref) {
        var sa = document.createElement('a');
        sa.href = srcCfg.srcHref;
        sa.target = '_blank';
        sa.rel = 'noopener noreferrer';
        sa.textContent = srcCfg.src;
        sp.appendChild(sa);
      } else {
        sp.textContent = srcCfg.src;
      }
      host.appendChild(sp);
    }
    host.hidden = false;
  }








  function roomForTable() {
    return window.innerWidth >= 900 && window.innerHeight >= 600;
  }



  function withLang(href) {
    var hash = href.indexOf('#');
    var head = hash < 0 ? href : href.slice(0, hash);
    var tail = hash < 0 ? '' : href.slice(hash);
    return head + (head.indexOf('?') < 0 ? '?' : '&')
         + 'lang=' + (state.jpNames ? 'ja' : 'en') + tail;
  }

  var tableDlg = null;





  function tableBox() {
    var dlg = $('#dlg-table');
    if (!dlg || !dlg.showModal) return null;
    if (!tableDlg) {
      tableDlg = dlg;
      $('.table-close', dlg).addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('close', function () {
        $('.table-body', dlg).textContent = '';
      });
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
    }
    return dlg;
  }








  var popTableAt = null;          // which dataset the box is showing

  function openPopTable(key, want) {
    var dlg = tableBox();
    var sets = popSets().filter(function (d) { return d.rows; });
    if (!dlg || !sets.length) return;



    var year = String(state.epoch).replace(/^e/, '');
    var d = want
      || sets.filter(function (x) { return x.rows[key] && x.epoch === year; })[0]
      || sets.filter(function (x) { return x.rows[key]; })[0]
      || sets[0];
    popTableAt = d;
    $('.table-title', dlg).textContent = 'Population';
    var open = $('.table-open', dlg);
    if (open) open.hidden = true;          // nothing to open: this is not a page
    var body = $('.table-body', dlg);
    body.textContent = '';
    body.appendChild(popTableFor(d, key));
    body.appendChild(popOtherTables(d, key));
    var cmp = popCompare(d, key);
    if (cmp) body.appendChild(cmp);
    if (!dlg.open) dlg.showModal();
    body.scrollTop = 0;
  }



  function popOtherTables(d, key) {
    var wrap = document.createElement('div');
    wrap.className = 'pop-switch';
    popSets().forEach(function (x) {
      if (x === d || !x.rows) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plain';
      btn.textContent = x.label;
      btn.addEventListener('click', function () { openPopTable(key, x); });
      wrap.appendChild(btn);
    });
    return wrap;
  }



  function popKanji(rec) {
    var raw = (rec && (rec.ja || rec.zh)) || '';
    return raw.replace(/\s*[（(].*$/, '').trim();
  }

  function popRowNameParts(k, row) {
    var rec = (JMAP.PROVINCES || {})[k] || byId[k]
      || (gazByKey && gazByKey[state.epoch + '|' + k]);
    if (!rec) return { name: row.en || k, kanji: '' };
    var per = JMAP.PROVINCE_EPOCH && JMAP.PROVINCE_EPOCH[state.epoch];
    var over = per && per[k];
    var merged = rec;
    if (over && over.en) {
      merged = {};
      Object.keys(rec).forEach(function (x) { merged[x] = rec[x]; });
      merged.en = over.en;
    }
    var name = splitGloss(nameOf(shown(merged))).name;
    var kanji = popKanji(merged);
    if (kanji && name.indexOf(kanji) > -1) kanji = '';
    return { name: name, kanji: kanji || '' };
  }










  function popRowName(k, row) {
    var q = popRowNameParts(k, row);
    if (!q.kanji) return q.name;
    return /\)$/.test(q.name) ? q.name.slice(0, -1) + ', ' + q.kanji + ')'
                               : q.name + ' (' + q.kanji + ')';
  }





  function popTableRows(d) {
    var keys = Object.keys(d.rows);
    var top = keys.filter(function (k) {
      return d.rows[k].scope === 'territory' || d.rows[k].scope === 'summary';
    });
    var parts = keys.filter(function (k) {
      var r = d.rows[k];
      return r.scope !== 'territory' && r.scope !== 'summary' && !r.sameAs;
    });
    return { top: top, parts: parts };
  }

  var POP_NUM = function (v) {
    return (v === undefined || v === null || v === '') ? null : Number(v);
  };






  function popSortable(cols, rows, here) {
    var scroll = document.createElement('div');
    scroll.className = 'pop-table-scroll';
    var table = document.createElement('table');
    table.className = 'pop-table';
    var sortAt = 1, sortDir = -1;
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    cols.forEach(function (c, i) {
      var th = document.createElement('th');
      if (i) th.className = 'num';
      th.scope = 'col';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pop-sort';



      if (c.group) {
        var tag = document.createElement('span');
        tag.className = 'col-group';
        tag.textContent = c.group;
        btn.appendChild(tag);
      }
      btn.appendChild(document.createTextNode(c.head || 'Name'));
      var arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.setAttribute('aria-hidden', 'true');
      btn.appendChild(arrow);
      btn.addEventListener('click', function () {


        if (sortAt === i) sortDir = -sortDir;
        else { sortAt = i; sortDir = i ? -1 : 1; }
        draw();
      });
      th.appendChild(btn);
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');

    function draw() {
      tbody.textContent = '';
      cols.forEach(function (c, i) {
        var th = hr.children[i];
        var on = i === sortAt;
        th.setAttribute('aria-sort',
          on ? (sortDir < 0 ? 'descending' : 'ascending') : 'none');
        $('.arrow', th).textContent = on ? (sortDir < 0 ? ' ↓' : ' ↑') : '';
        $('.pop-sort', th).classList.toggle('on', on);
      });
      var order = rows.filter(function (r) { return !r.pinned; }).slice()
        .sort(function (a, b) {
          var x = a.cells[sortAt], y = b.cells[sortAt];
          if (sortAt === 0) return String(x.t).localeCompare(String(y.t)) * sortDir;
          if (x.n === null && y.n === null) return 0;
          if (x.n === null) return 1;      // nothing counted sinks, either way
          if (y.n === null) return -1;
          return (x.n - y.n) * sortDir;
        });
      rows.filter(function (r) { return r.pinned; }).concat(order)
        .forEach(function (r) {
          var tr = document.createElement('tr');
          if (r.pinned) tr.className = 'whole';
          if (here && r.key === here) tr.classList.add('here');
          r.cells.forEach(function (cell, i) {
            var td = document.createElement(i ? 'td' : 'th');
            td.textContent = cell.t;
            td.className = i ? 'num' : 'name';
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
    }
    draw();
    table.appendChild(tbody);
    scroll.appendChild(table);




    scroll.tableSpec = { cols: cols, rows: rows };
    return scroll;
  }












  function csvCell(v) {
    var t = (v === undefined || v === null) ? '' : String(v);
    return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }

  function csvFrom(spec, notes, source, title) {
    var out = [];
    if (title) out.push([csvCell(title)].join(','));




    var split = spec.rows.some(function (r) { return r.cells[0] && r.cells[0].name; });
    out.push(spec.cols.map(function (c, i) {
      if (i === 0 && split) return 'Name,Characters';
      return csvCell(c.group ? c.group + ' — ' + c.head : c.head);
    }).join(','));
    spec.rows.forEach(function (r) {
      out.push(r.cells.map(function (cell, i) {
        if (i === 0) {
          return split
            ? csvCell(cell.name || cell.t) + ',' + csvCell(cell.kanji || '')
            : csvCell(cell.t === '—' ? '' : cell.t);
        }


        if (cell.n === null || cell.n === undefined) {
          return csvCell(cell.t === '—' ? '' : cell.t);
        }
        return csvCell(cell.n);
      }).join(','));
    });
    out.push('');
    (notes || []).forEach(function (n) { out.push('Note,' + csvCell(n)); });
    if (source) out.push('Source,' + csvCell(source));
    return out.join('\n') + '\n';
  }

  function downloadText(text, name, mime) {
    try {
      var type = mime || 'text/csv';











      var body = /csv/.test(type) ? '\uFEFF' + text : text;
      var blob = new Blob([body], { type: type + ';charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return true;
    } catch (err) { return false; }
  }


  function slug(s2) {
    return String(s2 || 'table').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'table';
  }






















  var airGroup = null;
  var airRings = null;
  var airById = {};              // route id -> record
  var airStopAt = {};            // the key on a ring -> its stop record



  function fmt2(n) { return (Math.round(n * 100) / 100); }

  function gcStep(a, b) {



    var R = Math.PI / 180;
    var la1 = a.lat * R, lo1 = a.lon * R, la2 = b.lat * R, lo2 = b.lon * R;
    var d = 2 * Math.asin(Math.sqrt(
      Math.pow(Math.sin((la2 - la1) / 2), 2)
      + Math.cos(la1) * Math.cos(la2) * Math.pow(Math.sin((lo2 - lo1) / 2), 2)));
    if (!isFinite(d) || d === 0) return [a];
    var n = Math.max(2, Math.min(96, Math.round(d * 6371 / 60)));
    var out = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var A = Math.sin((1 - f) * d) / Math.sin(d);
      var B = Math.sin(f * d) / Math.sin(d);
      var x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
      var y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
      var z = A * Math.sin(la1) + B * Math.sin(la2);
      out.push({ lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / R,
                 lon: Math.atan2(y, x) / R });
    }
    return out;
  }
























  function airGeom(stops, chords) {
    var legs = [];
    var pairs = [];
    var add = function (a, b) {
      var seg = gcStep(stops[a], stops[b]);
      var pts = [];
      for (var j = 0; j < seg.length; j++) {
        var p = project(seg[j].lon, seg[j].lat);
        pts.push({ x: p.x, y: p.y });
      }
      legs.push(pts);
      pairs.push([a, b]);
    };
    for (var i = 0; i + 1 < stops.length; i++) add(i, i + 1);
    (chords || []).forEach(function (c) { add(c[0], c[1]); });
    legs.pairs = pairs;
    return legs;
  }





  function airServiceRuns(rows, each) {
    var svcs = rows.map(function (t) { return t.svc || ''; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; });
    svcs.forEach(function (svc) {
      var mine = rows.filter(function (t) { return (t.svc || '') === svc; });
      ['d', 'u'].forEach(function (pre) {
        var seq = mine.filter(function (t) { return t[pre + 'a'] || t[pre + 'd']; })
          .map(function (t) { return (+t.seq) - 1; })
          .sort(function (a, b) { return a - b; });
        for (var k = 0; k + 1 < seq.length; k++) each(seq[k], seq[k + 1]);
      });
    });
  }




  function airChordsOf(r) {
    var rows = (r && r.times) || [];
    var out = [], seen = {};
    airServiceRuns(rows, function (a, b) {
      if (b - a < 2) return;
      var key = a + ':' + b;
      if (seen[key]) return;
      seen[key] = true;
      out.push([a, b]);
    });
    return out;
  }






















  var airLanes = {};              // route id -> which of its legs it must not draw
  var airShare = {};              // leg key -> the routes on it, in order

  function airLegKey(a, b) {
    return a < b ? a + '\u0000' + b : b + '\u0000' + a;
  }



  function buildAirLanes() {
    airLanes = {};
    airShare = {};
    (JMAP.AIR || []).forEach(function (r) {
      if (!airShown(r)) return;
      var ss = r.stops || [];
      var pairs = (airGeoms[r.id] && airGeoms[r.id].pairs) || [];
      pairs.forEach(function (pr, i) {
        var a = ss[pr[0]], b = ss[pr[1]];
        if (!a || !b) return;
        var key = airLegKey(a.id || a.name, b.id || b.name);
        (airShare[key] || (airShare[key] = [])).push({ id: r.id, leg: i });
      });
    });
    Object.keys(airShare).forEach(function (key) {
      var mine = airShare[key];

      mine.sort(function (p, q) { return p.id < q.id ? -1 : p.id > q.id ? 1 : 0; });

      mine.slice(1).forEach(function (m) {
        (airLanes[m.id] || (airLanes[m.id] = {}))[m.leg] = true;
      });
    });
  }

  function airDrawsLeg(id, leg) {
    var mine = airLanes[id];
    return !(mine && mine[leg]);
  }





  function airShareAt(r, leg) {
    var ss = (r && r.stops) || [];
    var pairs = (airGeoms[r && r.id] && airGeoms[r.id].pairs) || [];
    var pr = pairs[leg];
    if (!pr || !ss[pr[0]] || !ss[pr[1]]) return [];
    return airShare[airLegKey(ss[pr[0]].id || ss[pr[0]].name,
                              ss[pr[1]].id || ss[pr[1]].name)] || [];
  }


  function airAtLeg(r, leg) {
    var ss = (r && r.stops) || [];
    var pairs = (airGeoms[r && r.id] && airGeoms[r.id].pairs) || [];
    var pr = pairs[leg];
    if (!pr || !ss[pr[0]] || !ss[pr[1]]) return [];
    var mine = airShare[airLegKey(ss[pr[0]].id || ss[pr[0]].name,
                                  ss[pr[1]].id || ss[pr[1]].name)] || [];
    return mine.map(function (m) { return airById[m.id]; }).filter(Boolean);
  }





  function airPathOf(legs, pick) {
    var d = '';
    var last = null;                     // where the pen is, if it is down
    for (var i = 0; i < legs.length; i++) {
      if (pick && !pick(i)) { last = null; continue; }
      var pts = legs[i];
      if (!pts.length) continue;









      var join = last && Math.abs(last.x - pts[0].x) < 1e-6
                      && Math.abs(last.y - pts[0].y) < 1e-6;
      for (var j = (join ? 1 : 0); j < pts.length; j++) {
        d += (j === 0 && !join ? 'M' : 'L') + fmt2(pts[j].x) + ' ' + fmt2(pts[j].y);
      }
      last = pts[pts.length - 1];
    }
    return d;
  }





  function airLegMixed(r, leg) {
    var on = airAtLeg(r, leg);
    if (on.length < 2) return false;
    var ink = on[0].ink || '';
    for (var i = 1; i < on.length; i++) if ((on[i].ink || '') !== ink) return true;
    return false;
  }








































  function airGrounding(r) {
    if (state.airAll && state.epoch === 'e1942') return '';
    return (r && r.groundedFrom) || '';
  }

  function airGroundedLegs(r, pairs) {
    var stops = (r && r.stops) || [];
    var out = pairs.map(function () { return false; });
    var from = airGrounding(r);
    if (!from) return out;
    var at = -1;
    for (var j = 0; j < stops.length; j++) {
      if ((stops[j].id || stops[j].name) === from) { at = j; break; }
    }
    if (at < 0) return out;


    pairs.forEach(function (pr, i) {
      if (Math.min(pr[0], pr[1]) >= at) out[i] = true;
    });
    return out;
  }






  function airFlownLegs(r, pairs) {
    var out = pairs.map(function () { return false; });
    var rows = (r && r.times) || [];
    if (!rows.length) return out;
    var dead = airGroundedLegs(r, pairs);
    var index = {};
    pairs.forEach(function (pr, i) {
      index[Math.min(pr[0], pr[1]) + ':' + Math.max(pr[0], pr[1])] = i;
    });
    airServiceRuns(rows, function (a, b) {
      var at = index[a + ':' + b];

      if (at != null && !dead[at]) out[at] = true;
    });
    return out;
  }








  var airPaths = {};
  var airGeoms = {};              // route id -> the projected legs
  var airLaneEpoch = null;        // the sheet the lanes were worked out for
  var airFlown = {};              // route id -> which legs something flies
  var airDead = {};               // route id -> which legs could not be flown

























  function airMarkLegs() {
    (JMAP.AIR || []).forEach(function (r) {
      var geom = airGeoms[r.id];
      if (!geom) return;
      var legs = airFlownLegs(r, geom.pairs);
      var dead = airGroundedLegs(r, geom.pairs);


      var reach = function (pick) {
        var keep = {};
        geom.pairs.forEach(function (pr, i) {
          if (!pick[i]) return;
          keep[r.stops[pr[0]].id || r.stops[pr[0]].name] = true;
          keep[r.stops[pr[1]].id || r.stops[pr[1]].name] = true;
        });
        return keep;
      };
      airFlown[r.id] = legs;
      airDead[r.id] = dead;
      var pp = airPaths[r.id];
      if (pp) {
        pp.stops = reach(legs);
        pp.stopsPaused = reach(dead.map(function (x) { return !x; }));
      }
    });
  }

















  function airReprojected() {
    if (!airGroup || !JMAP.AIR) return;
    JMAP.AIR.forEach(function (r) {
      var geom = airGeom(r.stops, airChordsOf(r));
      if (geom.length) airGeoms[r.id] = geom;
    });
    airRepath();
    applyAir();
  }

  function airRepath() {
    Object.keys(airGeoms).forEach(function (id) {
      var geom = airGeoms[id];
      var r = airById[id];
      var legs = airFlown[id] || [];
      var dead = airDead[id] || [];
      var pp = airPaths[id];
      if (!pp) return;
      var mine = function (i) { return airDrawsLeg(id, i); };
      var mixed = function (i) { return mine(i) && airLegMixed(r, i); };
      var solo = function (i) { return mine(i) && !airLegMixed(r, i); };










      var deadHere = function (i) {
        var on = airShareAt(r, i);
        if (!on.length) return !!dead[i];
        for (var j = 0; j < on.length; j++) {
          var dd = airDead[on[j].id];
          if (!(dd && dd[on[j].leg])) return false;
        }
        return true;
      };
      var flownHere = function (i) {
        var on = airShareAt(r, i);
        if (!on.length) return !!legs[i];
        for (var j = 0; j < on.length; j++) {
          var ff = airFlown[on[j].id];
          if (ff && ff[on[j].leg]) return true;
        }
        return false;
      };
      pp.own = airPathOf(geom, mine);
      pp.all = airPathOf(geom, function (i) { return solo(i) && !deadHere(i); });
      pp.mixed = airPathOf(geom, function (i) { return mixed(i) && !deadHere(i); });
      pp.allDim = airPathOf(geom, function (i) { return mine(i) && deadHere(i); });
      pp.flown = airPathOf(geom, function (i) { return solo(i) && flownHere(i); });
      pp.flownMixed = airPathOf(geom, function (i) { return mixed(i) && flownHere(i); });
      pp.idle = airPathOf(geom, function (i) { return mine(i) && !flownHere(i); });
    });
  }













  function airShortNames() {
    var routes = JMAP.AIR || [];
    var ends = function (r) {
      var ss = r.stops || [];
      if (!ss.length) return r.name;
      var e = function (x) { return String(x.name || '').split(' (')[0]; };
      return ss.length === 1 ? e(ss[0]) : e(ss[0]) + ' \u2013 ' + e(ss[ss.length - 1]);
    };





    var over = function (a, b) {
      var x = a.epochs || [], y = b.epochs || [];
      if (!x.length || !y.length) return true;      // no dates means every date
      return x.some(function (e) { return y.indexOf(e) >= 0; });
    };
    routes.forEach(function (r) { r.shortKey = ends(r); r.shortName = r.shortKey; });
    routes.forEach(function (r, i) {
      var same = routes.filter(function (o, j) {
        return j !== i && o.shortKey === r.shortKey && over(o, r);
      });
      if (!same.length) return;
      var mine = routes.filter(function (o) {
        return o.shortKey === r.shortKey && over(o, r);
      });
      r.shortName = r.shortKey + ' (' + (mine.indexOf(r) + 1) + ')';
    });
  }

  function buildAir() {
    if (!svg || !JMAP.AIR || airGroup) return;
    airShortNames();





    airRings = svgEl('g', { id: 'air-stops' });






  JMAP.__setProse = setProse;
  JMAP.__airShortNames = airShortNames;

    airGroup = svgEl('g', { id: 'air' });
    airGroup.style.display = 'none';

    svg.insertBefore(airGroup, markersGroup || null);
    JMAP.AIR.forEach(function (r) {
      var geom = airGeom(r.stops, airChordsOf(r));
      if (!geom.length) return;
      airGeoms[r.id] = geom;
      airPaths[r.id] = { own: '', all: '', mixed: '', allDim: '', flown: '',
                         flownMixed: '', idle: '', stops: {}, stopsPaused: {} };
      var d = airPathOf(geom, null);
      var g = svgEl('g', { 'class': 'air-route', 'data-air': r.id });






      if (r.ink) g.style.setProperty('--air-ink', r.ink);
      airById[r.id] = r;
      g.setAttribute('data-epochs', (r.epochs || []).join(' '));







      var tip = [r.name];
      if (r.operator) tip.push(r.operator);
      if (r.opened) tip.push('from ' + r.opened);
      if (r.season) tip.push(r.season + ' timetable');
      var freq = (r.times || []).map(function (t) { return t.freq; })
        .filter(Boolean);
      var uniq = freq.filter(function (v, i) { return freq.indexOf(v) === i; });
      if (uniq.length === 1) tip.push(uniq[0]);
      else if (uniq.length > 1) tip.push(uniq.join('; '));





      var first = (r.times || [])[0];
      if (first && (first.dd || first.ua)) {
        tip.push([first.dd && ('out ' + first.dd),
                  first.ua && ('back ' + first.ua)].filter(Boolean).join(', '));
      }
      var ttl = svgEl('title', {});
      ttl.textContent = tip.join(' · ');
      g.appendChild(ttl);
      g.appendChild(svgEl('path', { 'class': 'air-halo', d: d }));





      g.appendChild(svgEl('path', { 'class': 'air-line-idle', d: '' }));


      g.appendChild(svgEl('path', { 'class': 'air-line-shared', d: '' }));
      g.appendChild(svgEl('path', { 'class': 'air-line', d: d }));


      g.appendChild(svgEl('path', { 'class': 'air-hit', d: d }));











      r.stops.forEach(function (st) {
        var p = project(st.lon, st.lat);
        var ring = svgEl('g', { 'class': 'air-stop-at' });



        ring.appendChild(svgEl('circle', { 'class': 'air-stop-hit', r: 11 }));
        ring.appendChild(svgEl('circle', { 'class': 'air-stop', r: 3.4 }));
        ring.setAttribute('data-air-stop', st.id || st.name);
        airStopAt[st.id || st.name] = st;
        var ttl2 = svgEl('title', {});
        ttl2.textContent = st.name + ' — every flight that called here';
        ring.appendChild(ttl2);









        var nm = svgEl('text', { 'class': 'air-name', x: 7, y: 3.4 });





        var lf = airNameForms(st);
        nm.setAttribute('data-ro', lf.lead);
        if (lf.han) nm.setAttribute('data-han', lf.han);




        nm.textContent = (state.hanLabels && lf.han) ? lf.han : lf.lead;
        ring.appendChild(nm);
        airRings.appendChild(ring);
        scalables.push({ el: ring, x: p.x, y: p.y });
      });
      airGroup.appendChild(g);
    });
    airGroup.appendChild(airRings);
    airMarkLegs();
  }



















  function airMins(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '').trim());
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }





















  var KANA_ONLY = /^[゠-ヿ　・ー\s-]+$/;

  function airHan(v) {
    var han = String((v && v.ja) || '').split(' (')[0].trim();
    return han && !KANA_ONLY.test(han) ? han : '';
  }




  function airLabelsWrite() {
    if (!airGroup) return;
    var want = !!state.hanLabels;
    var all = airGroup.querySelectorAll('.air-name');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var han = el.getAttribute('data-han');
      el.textContent = (want && han) ? han : (el.getAttribute('data-ro') || '');
    }
  }

  function airStopName(st) {
    var rec = st && st.id && (gazFor(st.id) || byId[st.id]);
    if (!rec) return String((st && st.name) || '').split(' (')[0];
    var v = shown(rec);
    var han = airHan(v);
    var ro = String(v.en || v.n || '').split(' (')[0].trim();
    return han && ro ? han + ' ' + ro : (ro || han);
  }















  function airNameForms(st) {
    if (!st) return { lead: '', hist: '', han: '' };
    var whole = String(st.name || '');
    var m = /^(.+?) \((.+)\)$/.exec(whole);
    var lead = (m ? m[1] : whole).trim();
    var hist = m ? m[2].trim() : '';




    var han = String(st.han || '').trim();
    if (!han) {
      var rec = st.id && (gazFor(st.id) || byId[st.id]);
      if (rec) han = airHan(shown(rec));
    }
    if (KANA_ONLY.test(han || 'x')) han = '';
    return { lead: lead, hist: hist, han: han };
  }




  function airAltNames(st) {
    var f = airNameForms(st);
    var out = [];
    var seen = {};
    seen[f.lead.toLowerCase()] = 1;
    [f.han, f.hist].forEach(function (v) {
      if (!v) return;
      var k = v.toLowerCase();
      if (seen[k]) return;
      seen[k] = 1;
      out.push(v);
    });
    return out;
  }

  function airPlace(r, t) {
    var st = r && r.stops && t && t.seq ? r.stops[(+t.seq) - 1] : null;
    if (st) return airStopName(st);
    var rec = null;
    if (!rec) return String((t && t.station) || '');
    var v = shown(rec);
    var han = airHan(v);
    var ro = String(v.en || v.n || '').split(' (')[0].trim();
    return han && ro ? han + ' ' + ro : (ro || han);
  }




  function airJourney(r, svc, dir) {
    var up = dir === 'up';
    var pre = up ? 'u' : 'd';
    var rows = (r.times || []).filter(function (t) { return (t.svc || '') === svc; });
    var seq = rows.slice();
    if (up) seq.reverse();
    var out = [];
    seq.forEach(function (t) {
      var call = { station: airPlace(r, t), freq: t.freq || '', rec: t,
                   arrive: t[pre + 'a'] || '', depart: t[pre + 'd'] || '' };





      var dayOf = function (half) {
        var k = pre + (half === 'arrive' ? 'ad' : 'dd');
        var v = parseInt(t[k], 10);
        return isFinite(v) && v > 0 ? v : 1;
      };
      ['arrive', 'depart'].forEach(function (half) {
        if (!call[half]) return;
        var m = airMins(call[half]);
        if (m === null) return;
        call[half + 'Day'] = dayOf(half);
        call[half + 'At'] = (call[half + 'Day'] - 1) * 1440 + m;
      });
      if (call.arrive || call.depart) out.push(call);
    });
    return out;
  }


  function airServices(r) {
    return (r.times || []).map(function (t) { return t.svc || ''; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  var AIR_DIRS = [{ k: 'down', label: 'Outward' }, { k: 'up', label: 'Return' }];














  function airJourneyStrip(host, r) {
    var svcs = airServices(r);
    var cols = [];
    svcs.forEach(function (svc) {
      var legs = AIR_DIRS.map(function (d) {
        return { dir: d, calls: airJourney(r, svc, d.k) };
      }).filter(function (x) { return x.calls.length; });
      if (legs.length) cols.push({ svc: svc, legs: legs });
    });
    if (!cols.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'pop-table-block';
    var h = document.createElement('p');
    h.className = 'pop-head';







    h.textContent = 'Timetable, ' + (r.season || 'source unstated');
    wrap.appendChild(h);

    var strip = document.createElement('div');
    strip.className = 'air-strip';
    cols.forEach(function (c) {
      var col = document.createElement('div');
      col.className = 'air-jrn';


      var freqs = [];
      c.legs.forEach(function (l) {
        l.calls.forEach(function (x) {
          if (x.freq && freqs.indexOf(x.freq) < 0) freqs.push(x.freq);
        });
      });
      if (c.svc) {
        var sh = document.createElement('p');
        sh.className = 'air-jrn-head';
        sh.textContent = c.svc;
        col.appendChild(sh);
      }
      if (freqs.length) {
        var fh = document.createElement('p');
        fh.className = 'air-jrn-freq';
        fh.textContent = freqs.join(', ');
        col.appendChild(fh);
      }
      c.legs.forEach(function (l) {
        var dh = document.createElement('p');
        dh.className = 'air-leg-head';
        dh.textContent = l.dir.label;
        col.appendChild(dh);
        var ol = document.createElement('ol');
        ol.className = 'air-calls';
        l.calls.forEach(function (call) {
          var li = document.createElement('li');
          var pl = document.createElement('span');
          pl.className = 'air-place';
          pl.textContent = call.station;
          li.appendChild(pl);
          [['arrive', '\u2193'], ['depart', '\u2191']].forEach(function (pair) {
            if (!call[pair[0]]) return;
            var sp = document.createElement('span');
            sp.className = 'air-t air-' + pair[0];
            var w = document.createElement('em');
            w.className = 'air-arrow';
            w.textContent = pair[1];
            sp.appendChild(w);
            sp.appendChild(document.createTextNode(' ' + call[pair[0]]));



            var dy = call[pair[0] + 'Day'] || 1;
            if (dy > 1) {
              var n = document.createElement('em');
              n.className = 'air-next';
              n.textContent = 'day ' + dy;
              sp.appendChild(n);
            }
            li.appendChild(sp);
          });
          ol.appendChild(li);
        });
        col.appendChild(ol);
      });
      strip.appendChild(col);
    });
    wrap.appendChild(strip);




    var csvCols = [{ key: 'svc', label: 'Service' }, { key: 'dir', label: 'Direction' },
                   { key: 'seq', label: 'Call' }, { key: 'station', label: 'Station' },
                   { key: 'arrive', label: 'Arrives' }, { key: 'depart', label: 'Departs' },
                   { key: 'freq', label: 'Runs' }];
    var csvRows = [];
    cols.forEach(function (c) {
      c.legs.forEach(function (l) {
        l.calls.forEach(function (call, i) {
          var vals = { svc: c.svc, dir: l.dir.label, seq: String(i + 1),
                       station: call.station, arrive: call.arrive,
                       depart: call.depart, freq: call.freq };
          var o = {};
          csvCols.forEach(function (cc) {
            o[cc.key] = { text: vals[cc.key] || '',
                          value: cc.key === 'seq' ? +vals.seq : undefined };
          });
          csvRows.push(o);
        });
      });
    });
    var spec = document.createElement('div');
    spec.tableSpec = { cols: csvCols, rows: csvRows };

    var notes = ['\u2193 is an arrival and \u2191 a departure.'];
    notes.forEach(function (n) {
      var p2 = document.createElement('p');
      p2.className = 'pop-note';
      p2.textContent = n;
      wrap.appendChild(p2);
    });
    if (r.source) {
      var sp2 = document.createElement('p');
      sp2.className = 'pop-src';
      if (r.srcUrl) {
        var a2 = document.createElement('a');
        a2.href = r.srcUrl; a2.target = '_blank'; a2.rel = 'noopener';
        a2.textContent = r.source;
        sp2.appendChild(a2);
      } else sp2.textContent = r.source;
      wrap.appendChild(sp2);
    }
    addCsvButton(wrap, spec, h.textContent, notes, r.source || '');
    host.appendChild(wrap);
  }

  function selectAir(r) {
    select(null);
    if (!infoBox) return;
    var f = cardFields(), chip = f.chip, prim = f.prim, alt = f.alt, when = f.when, note = f.note;
    if (chip) chip.textContent = 'Air route';
    if (prim) prim.textContent = r.name;





    if (alt) { alt.textContent = ''; alt.hidden = true; }
    if (when) {





      when.textContent = [r.operator,
                          r.opened && ('from ' + r.opened),
                          r.season && ('in the ' + r.season + ' timetable')]
        .filter(Boolean).join(' · ');
    }









    if (note) {
      setProse(note, r.note || '');
      note.hidden = !r.note;
    }
    var prov = infoBox.querySelector('.prov');
    if (prov) prov.hidden = true;





    var host = airCardHost();
    host.innerHTML = '';
    var src = r.source
      ? (r.source + (r.opened ? '' : ''))
      : '';
    if (r.times && r.times.length) {
      airJourneyStrip(host, r);
    }
    if (r.fares && r.fares.length) {
      var legs = [];
      for (var i = 0; i + 1 < r.stops.length; i++) {
        var a = r.stops[i].name.split(' (')[0];
        var b = r.stops[i + 1].name.split(' (')[0];
        var f = r.fares.filter(function (x) { return x.from === a && x.to === b; })[0];
        if (f) legs.push(f);
      }
      var whole = r.fares.filter(function (x) {
        return x.from === r.stops[0].name.split(' (')[0]
            && x.to === r.stops[r.stops.length - 1].name.split(' (')[0];
      })[0];
      airTable(host, 'Fares, 1931',
        [{ k: 'from', h: 'From' }, { k: 'to', h: 'To' },
         { k: 'yen', h: 'Yen', num: true }],
        legs.concat(whole ? [whole] : []),
        ['The legs, and the whole line at the foot.',
         'Every through fare in the source is the sum of its legs — all '
         + 'twenty-one of them — and so is every distance. The full table is '
         + 'in data/air/fares.csv.'],
        r.source, r.srcUrl);
    }

    infoBox.hidden = false;
    document.body.classList.add('panel-open');
  }



  function airCardHost() {
    var host = infoBox.querySelector('#info-air');
    if (!host) {
      host = document.createElement('div');
      host.id = 'info-air';
      var note = infoBox.querySelector('.note-own');
      if (note && note.parentNode) note.parentNode.insertBefore(host, note.nextSibling);
      else infoBox.appendChild(host);
    }
    return host;
  }







  function sameSrcShown(host, source) {
    if (!host) return false;
    var seen = host.querySelectorAll('.pop-src');
    for (var i = 0; i < seen.length; i++) {
      if ((seen[i].textContent || '').trim() === String(source).trim()) return true;
    }
    return false;
  }

  function airTable(host, title, cols, rows, notes, source, srcUrl) {
    if (!rows.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'pop-table-block';
    var h = document.createElement('p');
    h.className = 'pop-head';
    h.textContent = title;
    wrap.appendChild(h);
    var scroll = document.createElement('div');
    scroll.className = 'pop-scroll';
    var t = document.createElement('table');
    t.className = 'pop-table';
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    cols.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c.h;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    t.appendChild(thead);
    var tb = document.createElement('tbody');
    rows.forEach(function (r) {
      var row = document.createElement('tr');
      cols.forEach(function (c) {
        var td = document.createElement('td');
        td.textContent = r[c.k] === undefined || r[c.k] === null ? '' : r[c.k];
        if (c.num) td.className = 'num';
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    t.tableSpec = {
      cols: cols.map(function (c) { return { key: c.k, label: c.h }; }),
      rows: rows.map(function (r) {
        var o = {};
        cols.forEach(function (c) { o[c.k] = { text: r[c.k] === undefined ? '' : String(r[c.k]),
                                               value: c.num ? r[c.k] : undefined }; });
        return o;
      }),
    };
    scroll.appendChild(t);
    wrap.appendChild(scroll);
    (notes || []).forEach(function (n) {
      var p2 = document.createElement('p');
      p2.className = 'pop-note';
      p2.textContent = n;
      wrap.appendChild(p2);
    });












    if (source && !sameSrcShown(host, source)) {
      var sp = document.createElement('p');
      sp.className = 'pop-src';
      if (srcUrl) {
        var a2 = document.createElement('a');
        a2.href = srcUrl; a2.target = '_blank'; a2.rel = 'noopener';
        a2.textContent = source;
        sp.appendChild(a2);
      } else sp.textContent = source;
      wrap.appendChild(sp);
    }
    addCsvButton(wrap, t, title, notes || [], source || '');
    host.appendChild(wrap);
  }











  function airportRoutes(st) {
    var key = st.id || st.name;
    return (JMAP.AIR || []).filter(function (r) {
      return airShown(r)
        && r.stops.some(function (s2) { return (s2.id || s2.name) === key; });
    });
  }















  function airStopIndex(r, st) {
    var key = st && (st.id || st.name);
    var ss = (r && r.stops) || [];
    for (var i = 0; i < ss.length; i++) {
      if ((ss[i].id || ss[i].name) === key) return i;
    }
    return -1;
  }

  function airTimesAt(r, st) {
    var at = airStopIndex(r, st);
    if (at < 0) return [];
    return (r.times || []).filter(function (t) {
      return (+t.seq - 1) === at;
    });
  }

  function selectAirport(st) {
    select(null);
    if (!infoBox) return;
    var mine = airportRoutes(st);
    var f = cardFields(), chip = f.chip, prim = f.prim, alt = f.alt, when = f.when, note = f.note;





    var forms = airNameForms(st);
    var others = airAltNames(st);
    var count = mine.length === 1 ? 'On one of the scheduled routes'
      : ('On ' + mine.length + ' of the scheduled routes');




    var head = forms.lead || st.name;
    if (state.hanLabels && forms.han) {
      head = forms.han;
      others = [forms.lead].concat(others.filter(function (v) {
        return v !== forms.han;
      })).filter(Boolean);
    }
    if (chip) chip.textContent = 'Airport';
    if (prim) prim.textContent = head;
    if (alt) {
      alt.textContent = others.length ? others.join(' · ') : count;
      alt.hidden = false;
    }



    if (when) {
      when.textContent = others.length ? count : '';
      when.hidden = !others.length;
    }
    if (note) { note.textContent = ''; note.hidden = true; }
    var prov = infoBox.querySelector('.prov');
    if (prov) prov.hidden = true;











    var host = airCardHost();
    host.innerHTML = '';
    var key = st.id || st.name;

    var base = String(st.name || '').split(' (')[0];
    var evs = [];
    mine.forEach(function (r) {



      var at = -1;
      for (var i = 0; i < r.stops.length; i++) {
        if ((r.stops[i].id || r.stops[i].name) === key) { at = i; break; }
      }
      var short = function (j) { return airStopName(r.stops[j]); };
      var ends = r.shortName || (short(0) + ' – ' + short(r.stops.length - 1));
      var many = airServices(r).length > 1;
      airServices(r).forEach(function (svc) {
        AIR_DIRS.forEach(function (d) {
          var calls = airJourney(r, svc, d.k);
          calls.forEach(function (call) {

            if (!call.rec || (+call.rec.seq - 1) !== at) return;
            var up = d.k === 'up';
            if (call.arrive) {
              evs.push({ at: call.arriveAt, time: call.arrive, what: 'Arrives',
                         other: at < 0 ? '' : short(up ? at + 1 : at - 1),
                         route: r.name, ends: ends, svc: svc, manySvc: many,
                         dir: d.label, freq: call.freq,
                         src: r.source, srcUrl: r.srcUrl });
            }
            if (call.depart) {
              evs.push({ at: call.departAt, time: call.depart, what: 'Departs',
                         other: at < 0 ? '' : short(up ? at - 1 : at + 1),
                         route: r.name, ends: ends, svc: svc, manySvc: many,
                         dir: d.label, freq: call.freq,
                         src: r.source, srcUrl: r.srcUrl });
            }
          });
        });
      });

      if (!airTimesAt(r, st).length) {
        evs.push({ at: null, time: '', what: '', other: '', route: r.name,
                   ends: ends, svc: '', dir: '', freq: '',
                   src: r.source, srcUrl: r.srcUrl });
      }
    });











    evs.sort(function (a, b) {
      if (a.at === null) return b.at === null ? 0 : 1;
      if (b.at === null) return -1;
      return (a.at % 1440) - (b.at % 1440);
    });







    var hhmm = function (m) {
      var v = ((m % 1440) + 1440) % 1440;
      return Math.floor(v / 60) + ':' + ('0' + (v % 60)).slice(-2);
    };
    var recast = evs.some(function (e) {
      return e.at !== null && hhmm(e.at) !== e.time;
    });
    var rows = evs.map(function (e) {
      return { time: (e.at === null ? '' : hhmm(e.at))
                     + (e.what === 'Arrives' ? ' \u2193'
                        : e.what === 'Departs' ? ' \u2191' : ''),
               what: e.what,






               other: (e.other ? ((e.what === 'Arrives' ? 'from ' : 'to ') + e.other)
                               : (e.what ? '' : 'not timed here'))
                      + (e.svc && e.manySvc ? ' \u00b7 ' + e.svc : ''),
               route: e.route + (e.svc ? ' — ' + e.svc : ''),

               short: e.ends + (e.svc ? ' — ' + e.svc : ''),
               freq: e.freq };
    });







    var cols = [{ k: 'time', h: 'Time' },
                { k: 'other', h: 'From / to' }];
    if (rows.some(function (x) { return x.freq; })) {
      cols.push({ k: 'freq', h: 'Runs' });
    }
    var srcs = mine.map(function (r) { return r.source; }).filter(Boolean);
    airTable(host, 'Flights through ' + base, cols, rows,
      ['Every call at this airport in the order of the clock, with the place '
       + 'at the other end of that leg.',
       'A blank is a call the timetable does not time, not a flight that did '
       + 'not happen.'].concat(recast
        ? ['Some of these sources print an afternoon in twelve-hour form '
           + 'without a marker. The times here are on a twenty-four hour '
           + 'clock, read from the order of each flight\'s own calls; the '
           + 'route\'s own card shows them as the source prints them.']
        : []),
      srcs[0] || '', (mine[0] || {}).srcUrl || '');

    infoBox.hidden = false;
    document.body.classList.add('panel-open');
  }

























  function airSetKey(r) {
    var op = String((r && r.operator) || '').replace(/\s*·.*$/, '').trim();
    var se = String((r && r.season) || '').trim();
    return (op + '|' + se).replace(/\s+/g, ' ');
  }




  function airSetLabel(r) {
    var op = String((r && r.operator) || '').replace(/\s*·.*$/, '').trim();
    var se = String((r && r.season) || '').trim();


    var yrs = se.match(/1[89]\d\d/g);
    var when = yrs ? (yrs.length > 1 && yrs[0] !== yrs[yrs.length - 1]
                        ? yrs[0] + '–' + yrs[yrs.length - 1].slice(2) : yrs[0])
                   : (se || 'undated');
    if (/map/i.test(se)) when += ' map';
    return op + ' (' + when + ')';
  }







  function airSetYear(r) {
    var m = String((r && r.season) || '').match(/1[89]\d\d/);
    return m ? +m[0] : 9999;
  }





  var airSetsCache = null;
  function airSets() {
    if (airSetsCache) return airSetsCache;
    var by = {};
    (JMAP.AIR || []).forEach(function (r) {
      var k = airSetKey(r);
      if (!by[k]) by[k] = { key: k, label: airSetLabel(r), epochs: {}, n: 0,
                            year: airSetYear(r) };
      by[k].n++;
      (r.epochs || []).forEach(function (e) { by[k].epochs[e] = true; });
    });
    airSetsCache = Object.keys(by).sort().map(function (k) { return by[k]; });
    return airSetsCache;
  }




  function airSetDefault(set) {
    return !!(set && (!set.epochs || set.epochs[state.epoch]));
  }

  function airSetOn(key) {
    if (Object.prototype.hasOwnProperty.call(state.airSets, key)) {
      return !!state.airSets[key];
    }
    var all = airSets();
    for (var i = 0; i < all.length; i++) {
      if (all[i].key === key) return airSetDefault(all[i]);
    }
    return false;
  }

  function airShown(r) {
    return airSetOn(airSetKey(r));
  }














  var airApi = null;
  var airPlayWanted = false;

  function airHost() {
    return {
      svgEl: svgEl,
      project: function (lon, lat) { return project(lon, lat); },
      stage: function () { return $('#stage') || document.body; },



      insertLayer: function (g) {
        svg.insertBefore(g, markersGroup || null);
      },
      obstacle: function (el, on) {
        if (uiObserver) {
          try { on ? uiObserver.observe(el) : uiObserver.unobserve(el); }
          catch (e) { /* an observer that will not take it is not fatal */ }
        }
      },



      epoch: function () { return state.epoch; },


      playChanged: function () { applyAir(); },



      grounded: function (r) { return airGrounding(r); },
    };
  }


  function airPlayRoutes() {
    return (JMAP.AIR || []).filter(airShown);
  }

  function mountAirPlay() {
    if (!window.JMAP_AIRPLAY || !airGroup) return;
    if (!airApi) airApi = window.JMAP_AIRPLAY(airHost());
    if (airApi.mounted()) return;
    airApi.mount(airPlayRoutes(), view.w / containerSize().w);
  }

  function unmountAirPlay() {
    if (airApi && airApi.mounted()) airApi.unmount();
  }

  function loadAirPlay() {
    if (window.JMAP_AIRPLAY) { mountAirPlay(); return; }
    loadScript('air-play.js').then(
      function () {
        if (window.JMAP_AIRPLAY && airPlayWanted) mountAirPlay();
        syncAirPlayButton();
      },
      function () {
        airPlayWanted = false;
        syncAirPlayButton();
      });
  }

  function syncAirPlayButton() {
    var b = $('#btn-planes');
    if (!b) return;

    b.hidden = !state.air;
    b.setAttribute('aria-pressed', airPlayWanted ? 'true' : 'false');
    b.classList.toggle('on', !!airPlayWanted);
  }






  var airPlaySyncing = false;



























  var TOOLS_CROWD_OUT = '(max-width: 820px), (max-height: 520px)';

  function clearForTools() {
    if (!infoBox || infoBox.hidden) return;
    try {
      if (!window.matchMedia(TOOLS_CROWD_OUT).matches) return;
    } catch (err) { return; }
    select(null);
  }

  function setTrainTools(on) {
    if (on) clearForTools();
    var hadAdmin = state.cats.territory;
    state.trainTools = !!on;
    var box = $('#opt-train-tools');
    if (box) box.checked = state.trainTools;
    if (state.trainTools) setAirPlay(false);



























    if (state.trainTools && hadAdmin) {
      state.cats.territory = false;
      syncLayerButtons();
    }
    applyState();
  }

  function setAirPlay(on) {
    if (on && state.air) clearForTools();
    airPlayWanted = !!on && !!state.air;
    var tookTrains = false;
    if (airPlayWanted && state.trainTools) {
      state.trainTools = false;
      var trainBox = $('#opt-train-tools');
      if (trainBox) trainBox.checked = false;
      tookTrains = true;
    }
    if (airPlayWanted) { buildAir(); loadAirPlay(); }
    else unmountAirPlay();
    syncAirPlayButton();

    if (tookTrains) applyState();




    if (!airPlaySyncing) {
      airPlaySyncing = true;
      try { applyAir(); } finally { airPlaySyncing = false; }
    }
  }















  function pathToLines(d) {
    var lines = [], cur = null, re = /([MLZ])([^MLZ]*)/g, m;
    while ((m = re.exec(String(d || '')))) {
      if (m[1] === 'Z') { if (cur && cur.length > 1) lines.push(cur); cur = null; continue; }
      if (m[1] === 'M') { if (cur && cur.length > 1) lines.push(cur); cur = []; }
      if (!cur) cur = [];
      var n = m[2].split(/[\s,]+/).filter(function (x) { return x !== ''; }).map(Number);
      for (var i = 0; i + 1 < n.length; i += 2) {
        if (isFinite(n[i]) && isFinite(n[i + 1])) cur.push([n[i], n[i + 1]]);
      }
    }
    if (cur && cur.length > 1) lines.push(cur);
    return lines.map(function (r) {
      return r.map(function (q) {
        var u = unproject(q[0], q[1]);
        return [Math.round(u.lon * 1e5) / 1e5, Math.round(u.lat * 1e5) / 1e5];
      });
    });
  }



  function saveLayerPolys(els, name, props) {
    var feats = [];
    els.forEach(function (el) {
      var f = featureFor(el);
      if (!f) return;
      Object.keys(props || {}).forEach(function (k) { f.properties[k] = props[k]; });
      if (!f.properties.name) f.properties.name = name;
      feats.push(f);
    });
    if (!feats.length) return false;
    return downloadText(JSON.stringify({ type: 'FeatureCollection',
                                         features: feats }, null, 1),
                        slug(name) + '.geojson', 'application/geo+json');
  }

  function saveLayerLines(els, name, props) {
    var feats = [];
    els.forEach(function (el) {
      var ls = pathToLines(el.getAttribute('d'));
      if (!ls.length) return;
      var pr = { name: el.getAttribute('data-name') || el.id || name,
                 epoch: state.epoch, note: GEO_NOTE };
      Object.keys(props || {}).forEach(function (k) { pr[k] = props[k]; });
      feats.push({ type: 'Feature', properties: pr,
                   geometry: { type: 'MultiLineString', coordinates: ls } });
    });
    if (!feats.length) return false;
    return downloadText(JSON.stringify({ type: 'FeatureCollection',
                                         features: feats }, null, 1),
                        slug(name) + '.geojson', 'application/geo+json');
  }







  var LAYER_GEO = {
    'occ-traced': { label: 'Japanese occupation of China, traced', kind: 'poly',
                 get: function () { return atomShapes('occupiedzone'); } },
    'occ-nca': { label: 'North China Area Army, September 1942', kind: 'poly',
                 get: function () {
                   return atomShapes('nca_pacified')
                     .concat(atomShapes('nca_unpacified'));
                 } },
    'opt-ccp': { label: 'Resistance base areas', kind: 'poly',
                 get: function () { return atomShapes('ccp'); } },
    'opt-manchukuo': { label: 'Manchukuo', kind: 'poly',
                       get: function () { return atomShapes('manchukuo'); } },

















    'opt-mengjiang': { label: 'Mengjiang, the claim of 1940', kind: 'poly',
                       get: function () {
                         var e = svg && svg.querySelector('#mengjiang-whole');
                         return e ? [e] : [];
                       },
                       props: { area_km2: 603888,
                         note_claim: 'The whole of what Mengjiang claimed. '
                           + '441,459 km² of it was under Japanese control; the '
                           + 'rest is the companion file, "never held".' } },
    'opt-mengjiang-claim': { label: 'Mengjiang, the claim never held',
                             kind: 'poly',
                             get: function () {
                               var e = svg && svg.querySelector('#mengjiang-claim');
                               return e ? [e] : [];
                             },
                             props: { note_claim: 'The part of the 1940 claim '
                               + 'never under Japanese control — the west, '
                               + 'beyond Paotow. Subtract this from the claim '
                               + 'for the ground actually held.' } },
    'opt-rivers': { label: 'Yangzi and Yellow rivers', kind: 'line',
                    get: function () {
                      return riversGroup ? drawnPaths(riversGroup) : [];
                    },
                    props: { note_course: 'The Yellow River is drawn in its '
                      + '1938–47 course as well as its earlier one.' } },
    'opt-india-rivers': { label: 'Rivers of India', kind: 'line',
                          get: function () {
                            return indiaRiversGroup ? drawnPaths(indiaRiversGroup) : [];
                          } },
    'opt-extent': { label: 'Extent of Japanese control, December 1942',
                    kind: 'line',
                    get: function () { return extentPath ? [extentPath] : []; } },










    'opt-relief': { label: 'Shaded relief', kind: 'image',
                    get: function () {
                      var lv = reliefLevel && reliefLevel();
                      var src = lv && lv.src && lv.src[state.projection];
                      return src ? [asset(src)] : [];
                    } },
    'opt-graticule': { label: 'Graticule', kind: 'line',
                       get: function () {
                         return gratGroup ? drawnPaths(gratGroup) : [];
                       },
                       props: { note_drawn: 'Drawn by this map at the spacing '
                         + 'the current zoom asks for, not traced from a sheet.' } },
  };

  function saveLayerGeo(key) {
    var spec = LAYER_GEO[key];
    if (!spec) return false;
    var els = spec.get() || [];
    if (!els.length) return false;
    if (spec.kind === 'image') {



      var a = document.createElement('a');
      a.href = els[0];
      a.download = String(els[0]).split('/').pop().split('?')[0];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
    return spec.kind === 'line'
      ? saveLayerLines(els, spec.label, spec.props)
      : saveLayerPolys(els, spec.label, spec.props);
  }





  function addLayerDl(row, key) {
    var spec = LAYER_GEO[key];
    if (!row || !spec) return;
    if (row.querySelector('.pop-dl[data-geo="' + key + '"]')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'plain pop-dl';
    b.textContent = '\u2193';
    b.title = 'Download ' + spec.label + ' as GeoJSON';
    b.setAttribute('aria-label', 'Download ' + spec.label + ' as GeoJSON');
    b.setAttribute('data-geo', key);
    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();




      var box = document.getElementById(key === 'opt-mengjiang-claim'
                                        ? 'opt-mengjiang' : key);
      if (box && box.type === 'checkbox' && !box.checked) {
        box.checked = true;
        box.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (box && box.type === 'radio' && !box.checked) {
        box.checked = true;
        box.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var ok = saveLayerGeo(key);
      b.textContent = ok ? '\u2713' : '\u2717';
      b.title = ok ? 'Downloaded' : 'Nothing to download — the layer is not drawn';
      window.setTimeout(function () {
        b.textContent = '\u2193';
        b.title = 'Download ' + spec.label + ' as GeoJSON';
      }, 1400);
    });
    row.appendChild(b);
  }




  function buildLayerDls() {
    Object.keys(LAYER_GEO).forEach(function (key) {




      var id = key === 'opt-mengjiang-claim' ? 'opt-mengjiang' : key;
      var input = document.getElementById(id);
      var row = input && input.closest ? input.closest('label.row') : null;
      if (row) addLayerDl(row, key);
    });
  }




















  var layerInfoStack = [];        // ids, newest first
  var layerInfoFlash = 0;









  function layerInfoOn(row) {
    if (!row) return false;
    if (row.on_epoch) return state.epoch === row.on_epoch;
    return !!(row.flag && state[row.flag]);
  }





  function syncLayerInfo() {
    var rows = JMAP.LAYER_INFO || [];
    if (!rows.length) return;
    var fresh = [];
    rows.forEach(function (row) {
      var i = layerInfoStack.indexOf(row.id);
      if (layerInfoOn(row)) { if (i < 0) fresh.push(row.id); }
      else if (i >= 0) layerInfoStack.splice(i, 1);
    });

    if (fresh.length) layerInfoStack = fresh.concat(layerInfoStack);
    var b = $('#btn-layer-info');
    if (!b) return;
    b.hidden = !layerInfoStack.length;
    if (!layerInfoStack.length) {
      var dlg = $('#dlg-layer-info');
      if (dlg && dlg.open) dlg.close();
      return;
    }
    if (!fresh.length) return;



    if (layerInfoFlash) window.clearTimeout(layerInfoFlash);
    layerInfoFlash = window.setTimeout(function () {
      layerInfoFlash = 0;
      if (!b || b.hidden) return;
      b.classList.remove('flash');
      void b.offsetWidth;              // restart the animation
      b.classList.add('flash');
    }, 2000);
  }

  function fillLayerInfo() {
    var host = $('#layer-info-body');
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    var by = {};
    (JMAP.LAYER_INFO || []).forEach(function (r) { by[r.id] = r; });
    layerInfoStack.forEach(function (id) {
      var row = by[id];
      if (!row) return;
      var wrap = document.createElement('section');
      wrap.className = 'layer-info-item';
      wrap.setAttribute('data-layer-info', id);
      var h = document.createElement('h3');
      h.textContent = row.title || id;
      wrap.appendChild(h);
      if (row.note) {
        var p = document.createElement('p');
        p.className = 'layer-info-note';



        setProse(p, row.note);
        wrap.appendChild(p);
      }
      if (row.source) {
        var src = document.createElement('p');
        src.className = 'layer-info-src';
        src.appendChild(document.createTextNode('Source: '));














        if (/\[[^\]]+\]\(/.test(row.source)) {
          var many = document.createElement('span');
          setProse(many, row.source);
          src.appendChild(many);
        } else if (row.source_url) {
          var a = document.createElement('a');
          a.href = row.source_url;
          a.target = '_blank';
          a.rel = 'noopener';







          setProse(a, row.source);
          src.appendChild(a);
        } else {





          var plain = document.createElement('span');
          setProse(plain, row.source);
          src.appendChild(plain);
        }
        wrap.appendChild(src);
      }
      host.appendChild(wrap);
    });
  }
















  function fullscreenOn() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function syncFullscreen() {
    var b = $('#btn-fullscreen');
    if (!b) return;
    var on = fullscreenOn();
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Leave full screen' : 'Full screen');
    b.title = on ? 'Leave full screen' : 'Full screen';
  }

  function toggleFullscreen() {
    var root = document.documentElement;
    try {
      if (fullscreenOn()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      }
    } catch (err) { /* refused: the button simply does nothing */ }
  }

  function initCornerControls() {
    var fs = $('#btn-fullscreen');
    var root = document.documentElement;
    var can = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    if (fs && can && !coarse) {
      fs.hidden = false;
      fs.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', syncFullscreen);
      document.addEventListener('webkitfullscreenchange', syncFullscreen);
      syncFullscreen();
    }
    var info = $('#btn-layer-info');
    var dlg = $('#dlg-layer-info');
    if (info && dlg) {
      info.addEventListener('click', function () {
        info.classList.remove('flash');
        fillLayerInfo();
        if (!dlg.open) dlg.showModal();
      });
    }
    syncLayerInfo();
  }

  function applyAir() {
    if (!airGroup) return;
    airGroup.style.display = state.air ? '' : 'none';
    if (!state.air) { if (!airPlaySyncing) setAirPlay(false); return; }






    if (airPlayWanted && !(airApi && airApi.mounted())) {
      buildAir();
      loadAirPlay();
    }
    syncAirPlayButton();











    var airKey = state.epoch + (state.airAll ? '|all' : '');
    if (airLaneEpoch !== airKey) {
      airLaneEpoch = airKey;
      buildAirLanes();
      airMarkLegs();
      airRepath();
    }















    var playing = !!(airPlayWanted && airApi && airApi.mounted() && airApi.playing());
    if (airGroup) {
      Array.prototype.forEach.call(airGroup.children, function (g) {
        var id = g.getAttribute && g.getAttribute('data-air');
        var pp = id && airPaths[id];
        if (!pp) return;






        var lit = playing ? pp.flown : pp.all;
        var mix = playing ? pp.flownMixed : pp.mixed;
        var dim = playing ? pp.idle : pp.allDim;
        var set = function (sel, v) {
          var el = g.querySelector(sel);
          if (el && el.getAttribute('d') !== v) el.setAttribute('d', v);
        };
        set('.air-halo', lit + mix);
        set('.air-line', lit);
        set('.air-line-shared', mix);
        set('.air-line-idle', dim);

        set('.air-hit', pp.own);
      });
    }





    var live = {};          // reached by a leg something actually flies
    var onDate = {};        // on a route this date draws at all
    (JMAP.AIR || []).forEach(function (r) {
      if (!airShown(r)) return;
      (r.stops || []).forEach(function (st) { onDate[st.id || st.name] = true; });
      var pp = airPaths[r.id];
      var set = pp && (playing ? pp.stops : pp.stopsPaused);
      if (set) Object.keys(set).forEach(function (k) { live[k] = true; });
    });
    if (airGroup) {





      airGroup.classList.toggle('air-names',
        !!(state.airNames && labelsOn() && state.air));

      airGroup.classList.toggle('air-close', latSpan() <= AIR_NAME_CLOSE_LAT);
    }
    airLabelsWrite();
    if (airRings) {
      Array.prototype.forEach.call(airRings.children, function (g) {
        var k = g.getAttribute('data-air-stop');


        g.style.display = onDate[k] ? '' : 'none';



        g.classList.toggle('air-idle', !live[k]);
      });
    }
    (JMAP.AIR || []).forEach(function (r) {
      var g = airGroup.querySelector('[data-air="' + cssEsc(r.id) + '"]');
      if (!g) return;





      g.style.display = airShown(r) ? '' : 'none';
    });
  }

















  function popLayerFeatures(set, mode) {
    if (!set || !set.rows || !svg) return [];
    var shade = POP_SHADES[mode];













    var byKey = {};
    var order = [];
    $$('#land [data-prov]', svg).forEach(function (el) {
      var drawn = el.getAttribute('data-prov');
      var key = set.rows[drawn] ? drawn
        : (set.rows[partOf(drawn)] ? partOf(drawn)
          : (set.rows[groupPartOf(el)] ? groupPartOf(el) : null));
      if (!key) return;
      var polys = ringsToLonLat(pathToRings(el.getAttribute('d')));
      if (!polys.length) return;
      if (!byKey[key]) { byKey[key] = { polys: [], shapes: 0 }; order.push(key); }
      byKey[key].polys = byKey[key].polys.concat(polys);
      byKey[key].shapes += 1;
    });
    return order.map(function (key) {
      var r = set.rows[key];
      var np = popRowNameParts(key, r);
      var props = {
        name: np.name || null, kanji: np.kanji || null,
        key: key, scope: r.scope || null,
        population: r.pop === undefined ? null : r.pop,
        per_km2: r.dens === undefined ? null : r.dens,
        km2: r.km2 === undefined ? null : r.km2,
        m_per_100_f: r.mf === undefined ? null : r.mf,
        pct_of_total: r.pct === undefined ? null : r.pct,
        shapes: byKey[key].shapes,
      };
      if (shade) {
        var v = shade.value(r);
        props.shaded_value = (v === null || v === undefined) ? null : v;
        props.shaded_unit = shade.unit;
      }
      if (byKey[key].shapes > 1) {
        props.note = 'Drawn as ' + byKey[key].shapes + ' shapes — the unit and '
          + 'the islands the census counted in it — gathered here into one '
          + 'feature so the figures are not repeated.';
      }
      return { type: 'Feature', properties: props,
               geometry: { type: 'MultiPolygon',
                           coordinates: byKey[key].polys.map(function (q) { return [q]; }) } };
    });
  }

  function savePopLayer(set, mode, label) {
    var feats = popLayerFeatures(set, mode);
    if (!feats.length) return false;
    var fc = {
      type: 'FeatureCollection',



      layer: {
        title: label,
        caption: set.caption || '',
        epoch: set.epoch,
        source: set.source || '',
        source_url: set.srcUrl || '',
        breaks: (POP_SHADES[mode] && POP_SHADES[mode].breaks(set)) || [],
        unit: (POP_SHADES[mode] && POP_SHADES[mode].unit) || '',
        geometry_note: GEO_NOTE,
      },
      features: feats,
    };
    return downloadText(JSON.stringify(fc, null, 1),
                        slug(label + '-' + set.epoch) + '.geojson',
                        'application/geo+json');
  }

















  var menuEl = null;

  function closeMenu() {
    if (menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
    menuEl = null;
  }





  function pathToRings(d) {
    var rings = [], cur = null, re = /([MLZ])([^MLZ]*)/g, m;
    while ((m = re.exec(String(d || '')))) {
      if (m[1] === 'Z') { if (cur && cur.length > 2) rings.push(cur); cur = null; continue; }
      if (m[1] === 'M') { if (cur && cur.length > 2) rings.push(cur); cur = []; }
      if (!cur) cur = [];
      var n = m[2].split(/[\s,]+/).filter(function (x) { return x !== ''; }).map(Number);
      for (var i = 0; i + 1 < n.length; i += 2) {
        if (isFinite(n[i]) && isFinite(n[i + 1])) cur.push([n[i], n[i + 1]]);
      }
    }
    if (cur && cur.length > 2) rings.push(cur);
    return rings;
  }

  function ringsToLonLat(rings) {
    return rings.map(function (r) {
      var out = r.map(function (p) {
        var q = unproject(p[0], p[1]);
        return [Math.round(q.lon * 1e5) / 1e5, Math.round(q.lat * 1e5) / 1e5];
      });

      if (out.length && (out[0][0] !== out[out.length - 1][0]
                         || out[0][1] !== out[out.length - 1][1])) out.push(out[0]);
      return out;
    }).filter(function (r) { return r.length > 3; });
  }

  var GEO_NOTE = 'The shape as this map draws it: read from the drawn geometry '
    + 'and unprojected, so it carries the thinning the map draws at. For the '
    + 'unthinned source geometry run tools/build_map.py --export.';

  function featureFor(el) {
    var polys = ringsToLonLat(pathToRings(el.getAttribute('d')));
    if (!polys.length) return null;
    var atom = el.closest ? el.closest('.atom') : null;
    var props = { name: el.getAttribute('data-prov') || null,
                  atom: atom ? String(atom.id || '').replace(/^a-/, '') : null,
                  epoch: state.epoch, note: GEO_NOTE };
    var g = el.getAttribute('data-group');
    if (g) props.group = g;
    var parent = partOf(props.name) || groupPartOf(el);
    if (parent) props.part_of = parent;
    return { type: 'Feature',
             geometry: { type: 'MultiPolygon',
                         coordinates: polys.map(function (r) { return [r]; }) },
             properties: props };
  }

  function saveGeoJSON(els, name) {
    var feats = [];
    els.forEach(function (el) { var f = featureFor(el); if (f) feats.push(f); });
    if (!feats.length) return false;
    return downloadText(JSON.stringify({ type: 'FeatureCollection',
                                         features: feats }, null, 1),
                        slug(name) + '.geojson', 'application/geo+json');
  }













  function saveRailGeoJSON(feats, name) {
    if (!feats || !feats.length) return false;
    return downloadText(JSON.stringify({ type: 'FeatureCollection',
                                         features: feats }, null, 1),
                        slug(name) + '.geojson', 'application/geo+json');
  }













  function saveDrawnRail(sys, want) {
    var g = document.getElementById(sys + '-rail');
    if (!g) return false;
    var pick = want || state.epoch;
    var feats = [];
    $$('path.rail', g).forEach(function (el) {





      var eps = el.getAttribute('data-epochs');
      var ep;
      if (eps) {
        var list = eps.split(' ');
        if (pick !== 'both' && list.indexOf(pick) < 0) return;
        ep = pick === 'both' ? list.join(' ') : pick;
      } else {
        ep = el.getAttribute('data-epoch') || state.epoch;
        if (pick !== 'both' && ep !== pick) return;
      }
      var lines = ringsToLonLat(pathToRings(el.getAttribute('d')));
      lines.forEach(function (c) {
        if (c.length > 1) {
          feats.push({ type: 'Feature',
                       geometry: { type: 'LineString', coordinates: c },
                       properties: railDrawnProps(sys, ep, el) });
        }
      });
    });
    if (!feats.length) return false;



    var name = (RAIL_LABEL[sys] || sys) + '-railways';
    if (pick === 'both') {
      var ys = ['e1930', 'e1942'].map(function (e) { return railYear(sys, e); })
        .filter(function (y, i, a) { return y && a.indexOf(y) === i; });
      name += '-' + ys.join('-and-');
    } else {
      name += '-' + (railYear(sys, pick) || String(pick).replace(/^e/, ''));
    }
    return saveRailGeoJSON(feats, name);
  }





  function railDrawnProps(sys, ep, el) {
    var inf = RAIL_INFO[sys] || {};
    var p = { system: sys, railway: RAIL_LABEL[sys] || sys, epoch: ep,
              network_year: railYear(sys, ep.split(' ')[0]) || '',
              source: inf.source || '', source_url: inf.url || '' };
    var nm = el.getAttribute('data-name');
    if (nm) {
      p.line = nm;
      p.opened = el.getAttribute('data-year') || '';
      p.note = RAIL_NAMED_NOTE;
    } else {
      p.note = RAIL_DRAWN_NOTE;
    }
    return p;
  }

  var RAIL_NAMED_NOTE = 'Read from the drawn network and unprojected, so it '
    + 'carries the thinning the map draws at. `opened` is the year service '
    + 'began, which is what this layer is filtered on.';

  var RAIL_DRAWN_NOTE = 'Read from the drawn network and unprojected, so it '
    + 'carries the thinning the map draws at, and it has no line names: the '
    + 'plain layer is one shape. Open the train tools over this ground and the '
    + 'same menu offers the lines separately, from the source coordinates.';




  function railFileName(f) {
    var pr = (f && f.properties) || {};
    var where = RAIL_LABEL[pr.system] || pr.system || 'railway';



    return where + ' ' + (pr.line_en || pr.line || 'line');
  }





  function railSysOf(target) {
    if (!target || !target.closest) return '';
    var g = target.closest('#tw-rail, #kr-rail, #kf-rail, #jp-rail');
    if (!g) return '';
    return String(g.id || '').replace(/-rail$/, '');
  }





  var RAIL_LABEL = { tw: 'Taiwan', kr: 'Korea', kf: 'Karafuto', jp: 'Japan',
                     burma: 'Burma' };
  var RAIL_SWITCH_ROWS = [
    { sys: 'tw', state: 'twRail' },
    { sys: 'kr', state: 'krRail' },
    { sys: 'jp', state: 'jpRail' },
    { sys: 'kf', state: 'kfRail' },
    { sys: 'burma', state: 'burmaRail' },
  ];

















  var N05_URL = 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N05-v1_3.html';

  var RAIL_INFO = {










    burma: {
      label: 'Burma Railways',
      years: { e1930: '1930', e1942: 'December 1942' },
      srcShort: 'traced for this map',
      srcTitle: 'traced for this map',
      source: 'traced for this map: 30 lines, 6,081 km, the network as it '
        + 'stood through both dates. The trace carries no line or station '
        + 'names.',
      note: 'Lines only \u2014 there are no stations and no line is '
        + 'pressable, the trace naming neither.',
    },
    tw: {
      label: 'Taiwan Railways',











      years: { e1930: '1930', e1942: 'December 1942' },




      srcShort: '日治時期鐵路分布圖, Academia Sinica',
      srcTitle: '日治時期鐵路分布圖',
      source: '日治時期鐵路分布圖 (Academia Sinica), reprojected to TWD97, with '
        + 'several stretches traced from the 1944 American 1:25,000 sheet',
      url: 'https://data.depositar.io/dataset/rd15-07030',
      note: 'Drawn per date, because the island gained lines between them: some '
        + 'southern lines are on the 1942 map and not the 1930 one.',
    },
    jp: {
      label: 'Japan Railways',



      years: { e1930: '1930', e1942: 'December 1942' },
      srcShort: 'N05 \u9244\u9053\u6642\u7cfb\u5217\u30c7\u30fc\u30bf, \u56fd\u571f\u4ea4\u901a\u7701',
      srcTitle: 'N05 \u9244\u9053\u6642\u7cfb\u5217\u30c7\u30fc\u30bf',
      source: 'N05 \u9244\u9053\u6642\u7cfb\u30c7\u30fc\u30bf, '
        + '\u56fd\u571f\u4ea4\u901a\u7701\u56fd\u571f\u6570\u5024\u60c5\u5831'
        + ', filtered by the year each line opened',
      url: N05_URL,


      note: 'The source\u2019s survey begins in 1950, so railways that closed '
        + 'before 1950 are likely to be missing from the data.',
    },
    kr: {
      label: 'Korea Railways',
      years: { e1930: '1930', e1942: '1942' },
      srcShort: '근대 철도 DB, 김종혁',
      srcTitle: '근대 철도 DB',
      source: '근대 철도 DB (김종혁), filtered by the year each line opened',
      url: 'https://www.hisgeo.info/wiki/%EA%B7%BC%EB%8C%80_%EC%B2%A0%EB%8F%84_DB',
      note: 'Lines open by 1931 on the 1930 map and by 1943 on the December '
        + '1942 map. Not yet checked against contemporary sheets.',
    },
    kf: {
      label: 'Karafuto Railways',
      years: { e1930: '1935', e1942: '1935' },
      srcShort: 'traced for this map, after 樺太路線図',
      srcTitle: 'traced for this map, after 樺太路線図',
      source: 'traced for this map from 最新樺太地圖 and the 樺太路線図 at '
        + '時刻表倉庫, checked against the 1947 U.S. Army sheets',
      url: 'https://jikokusouko.pages.dev/index.htm',
      note: 'One drawing for both dates: the island’s railways were built '
        + 'between 1906 and the late 1920s and the rails did not move between '
        + '1930 and 1942.',
    },
  };


  function railYear(sys, epoch) {
    var inf = RAIL_INFO[sys];
    return (inf && inf.years[epoch || state.epoch]) || '';
  }




























  var CITY_TIER = ['small', 'medium', 'large', 'largest'];
  var CITY_CAP = { 1: 'provincial', 2: 'country or territory' };

  var CITY_NOTE = 'Positions are the source coordinates, not read off the '
    + 'drawing: they carry no projection and no thinning. Sizes are the '
    + 'gazetteer’s four tiers, which are a coarse statement about a '
    + 'place, not a population; the population columns are in '
    + 'data/cities-*.csv.';

  function cityFeature(c) {
    var props = {
      id: c.id,


      label: shownName(c) || c.n || '',
      name: c.n || '',
      name_en: c.en || c.n || '',
      name_local: c.local || '',
      name_ja: c.ja || '',
      name_ja_kyujitai: c.ja_kyu || '',
      name_zh: c.zh || '',
      name_ko: c.ko || '',
      characters: c.orig || '',
      size: CITY_TIER[c.t] === undefined ? '' : CITY_TIER[c.t],
      size_tier: c.t === undefined ? null : c.t,


      drawn_at_tier: c.a === undefined ? null : c.a,
      always_drawn: c.a !== undefined,
      capital: CITY_CAP[c.c] || '',
      capital_of: c.of || '',
      polity: c.p || '',
      epoch: c.epoch || state.epoch,
      wikipedia: c.wiki || '',
      note: c.extra || '',
    };
    return { type: 'Feature',
             geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
             properties: props };
  }




  function shownName(c) {
    try {
      var r = shown(c) || c;
      return nameOf(r) || r.en || r.n || '';
    } catch (e) { return c.en || c.n || ''; }
  }

  function saveCities(epoch) {
    var floor = gazMinTier();
    var feats = gazRecs.filter(function (c) { return c.epoch === epoch; })
      .map(function (c) {
        var f = cityFeature(c);
        f.properties.drawn_at_this_zoom =
          (c.a !== undefined || c.t >= floor);
        return f;
      });
    if (!feats.length) return false;
    var ep = (JMAP.EPOCHS || []).filter(function (e) { return e.id === epoch; })[0];
    var when = (ep && ep.en) || String(epoch).replace(/^e/, '');
    return downloadText(JSON.stringify({
      type: 'FeatureCollection',
      layer: { title: 'Cities and towns, ' + when,
               epoch: epoch,
               count: feats.length,
               source: 'data/cities-*.csv in the map’s repository',
               note: CITY_NOTE },
      features: feats,
    }, null, 1), slug('cities-' + when) + '.geojson', 'application/geo+json');
  }




  function cityAt(target) {
    var hit = recordFor(target);
    var rec = hit && hit.rec;
    if (!rec) return null;
    if (rec.kind === 'gaz') return rec;


    if (rec.cat === 'city') return gazFor(rec.id) || null;
    return null;
  }





  function sourcesFor(atomKey) {
    var all = JMAP.SOURCES_SHORT || [];
    var hit = all.filter(function (r) {
      return (r.atoms || []).indexOf(atomKey) >= 0;
    });
    if (!hit.length) hit = all.filter(function (r) {
      return (r.atoms || []).indexOf('*') >= 0;
    });
    return hit;
  }




  function figureSourcesFor(key) {
    var out = [];
    popOn().forEach(function (job) {
      var set = job.set;
      if (!set || !set.rows) return;
      if (!set.rows[key] && !set.rows[partOf(key)]) return;
      if (set.source) out.push({ short: set.source, url: set.srcUrl || '' });
    });
    return out;
  }

  function menuItem(label, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'plain';
    b.textContent = label;
    b.addEventListener('click', function () { closeMenu(); fn(); });
    return b;
  }





















  function atomKeyOf(target) {
    if (!target || !target.closest) return '';
    var hit = target.closest('[data-atom]');
    if (hit) return hit.getAttribute('data-atom') || '';
    var a = target.closest('.atom');
    if (a) return String(a.id || '').replace(/^a-/, '');




    var w = target.closest('path.whole[data-for], [data-for]');
    return w ? (w.getAttribute('data-for') || '') : '';
  }

  function drawnPaths(root) {
    return $$('path', root).filter(function (n) {
      return n.getAttribute('d') && !n.classList.contains('superseded')
        && !n.classList.contains('fine');
    });
  }

  function atomShapes(key) {
    if (!key) return [];
    var host = document.getElementById('a-' + key);
    if (host) {
      if (host.tagName === 'path') return host.getAttribute('d') ? [host] : [];
      var inside = drawnPaths(host);
      if (inside.length) return inside;
    }




    return $$('path.whole[data-for="' + cssEsc(key) + '"]', svg)
      .filter(function (n) { return n.getAttribute('d'); });
  }

  function openMenu(x, y, target) {
    closeMenu();
    var el = target && target.closest ? target.closest('#land [data-prov]') : null;
    var atomKey = atomKeyOf(target);
    var atomEl = atomKey ? document.getElementById('a-' + atomKey) : null;












    var railLine = null, railSys = railSysOf(target);
    if (trainApi && trainApi.mounted() && trainApi.hitAt && trainApi.lineFeature) {
      var rh = trainApi.hitAt(x, y);
      if (rh && rh.kind === 'line') railLine = trainApi.lineFeature(rh.index);
      if (railLine) railSys = railSys || trainApi.system();
    }
    var city = cityAt(target);
    if (!el && !atomKey && !railLine && !railSys && !city) return false;
    var name = el ? (el.getAttribute('data-prov') || '') : '';
    var group = el ? el.getAttribute('data-group') : '';

    menuEl = document.createElement('div');
    menuEl.id = 'jmap-menu';
    menuEl.setAttribute('role', 'menu');

    var head = document.createElement('p');
    head.className = 'menu-head';
    head.textContent = (city && shownName(city))
      || name || atomName(atomKey) || atomKey || 'This shape';
    menuEl.appendChild(head);




    if (city) {
      menuEl.appendChild(menuItem('Download GeoJSON \u2014 '
        + (shownName(city) || 'this place'),
        function () {
          downloadText(JSON.stringify({ type: 'FeatureCollection',
                                        layer: { note: CITY_NOTE },
                                        features: [cityFeature(city)] }, null, 1),
                       slug(city.en || city.n || city.id) + '.geojson',
                       'application/geo+json');
        }));
      var nCity = gazRecs.filter(function (c) { return c.epoch === state.epoch; }).length;
      if (nCity > 1) {
        var epLab = (JMAP.EPOCHS || []).filter(function (e) {
          return e.id === state.epoch;
        })[0];
        menuEl.appendChild(menuItem('Download GeoJSON \u2014 all cities and towns, '
          + ((epLab && epLab.en) || String(state.epoch).replace(/^e/, ''))
          + ' (' + nCity + ')',
          function () { saveCities(state.epoch); }));
      }
    }



    if (railLine) {



      const lineFeats = (trainApi.lineFeatures && rh && rh.index !== undefined)
        ? trainApi.lineFeatures(rh.index) : [railLine];
      menuEl.appendChild(menuItem('Download GeoJSON \u2014 '
        + (railLine.properties.line || 'this line'),
        function () {
          saveRailGeoJSON(lineFeats.length ? lineFeats : [railLine],
                          railFileName(railLine));
        }));
    }
    if (railSys && trainApi && trainApi.mounted()
        && trainApi.system() === railSys && trainApi.systemFeatures) {


















      const netFeats = trainApi.systemFeatures();
      if (netFeats.length > (railLine ? 1 : 0)) {
        menuEl.appendChild(menuItem('Download GeoJSON \u2014 all of '
          + (RAIL_LABEL[railSys] || railSys) + '\u2019s railways ('
          + netFeats.length + ' lines)',
          function () {
            saveRailGeoJSON(netFeats,
                            (RAIL_LABEL[railSys] || railSys) + '-railways');
          }));
      }
    } else if (railSys) {









      var railName = RAIL_LABEL[railSys] || railSys;
      var here = state.epoch;
      var other = here === 'e1930' ? 'e1942' : 'e1930';
      var yHere = railYear(railSys, here), yOther = railYear(railSys, other);
      menuEl.appendChild(menuItem('Download GeoJSON \u2014 ' + railName
        + '\u2019s railways' + (yHere ? ', ' + yHere : ''),
        function () { saveDrawnRail(railSys, here); }));


      if (yOther && yOther !== yHere) {
        menuEl.appendChild(menuItem('Download GeoJSON \u2014 ' + railName
          + '\u2019s railways, ' + yOther,
          function () { saveDrawnRail(railSys, other); }));
        menuEl.appendChild(menuItem('Download GeoJSON \u2014 ' + railName
          + '\u2019s railways, both dates',
          function () { saveDrawnRail(railSys, 'both'); }));
      }
    }





    if (el) {
      menuEl.appendChild(menuItem('Download GeoJSON — ' + (name || 'this shape'),
        function () { saveGeoJSON([el], name || atomKey); }));
    }
    if (el && group) {
      var kin = $$('#land [data-group="' + cssEsc(group) + '"]', svg);
      if (kin.length > 1) {
        menuEl.appendChild(menuItem('Download GeoJSON — ' + group
          + ' (' + kin.length + ')',
          function () { saveGeoJSON(kin, group); }));
      }
    }
    if (atomKey) {
      var label = atomName(atomKey) || atomKey;





      var layer = atomEl ? $$('path[data-prov]:not(.fine)', atomEl) : [];
      if (layer.length > 1) {
        menuEl.appendChild(menuItem('Download GeoJSON — all of ' + label
          + ' (' + layer.length + ')',
          function () { saveGeoJSON(layer, label + '-units'); }));
      }
      var whole = atomShapes(atomKey);
      if (whole.length && !(layer.length > 1 && whole.length === layer.length)) {
        menuEl.appendChild(menuItem('Download GeoJSON — ' + label
          + (whole.length > 1 ? ' (' + whole.length + ' shapes)' : ''),
          function () { saveGeoJSON(whole, label); }));
      }




      var terr = territoryOf(atomKey);
      var cat = terr && terr.cat;
      var kin = cat ? catAtoms(cat) : [];
      if (kin.length > 1) {
        var big = [];
        kin.forEach(function (k) {
          atomShapes(k).forEach(function (n) { if (big.indexOf(n) < 0) big.push(n); });
        });
        var cl = catLabel(cat) || cat;
        if (big.length > whole.length) {
          menuEl.appendChild(menuItem('Download GeoJSON — all of ' + cl
            + ' (' + kin.length + ' territories)',
            function () { saveGeoJSON(big, cl); }));
        }
      }
    }





    popOn().forEach(function (job) {
      var d = job.set;
      if (!d || !d.rows) return;
      var n = popLayerFeatures(d, job.mode).length;
      if (!n) return;




      var lab = (d.country || d.layer || d.label || 'this layer')
        + ' ' + (POP_MODE_LABEL[job.mode] || job.mode);
      menuEl.appendChild(menuItem('Download GeoJSON — ' + lab + ', '
        + d.epoch + ' (' + n + ' units with figures)',
        function () { savePopLayer(d, job.mode, lab); }));
    });




    var pt = clientToSvg(x, y);
    var ll = unproject(pt.x, pt.y);
    var coords = ll.lat.toFixed(5) + ', ' + ll.lon.toFixed(5);
    menuEl.appendChild(menuItem('Copy coordinates — ' + coords, function () {
      var t = coords;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t)['catch'](function () { copyFallback(t); });
      } else copyFallback(t);
    }));

    var srcs = sourcesFor(atomKey);
    var figs = el ? figureSourcesFor(name) : [];






    var rails = [];
    if (railSys && RAIL_INFO[railSys] && (RAIL_INFO[railSys].source
                                          || RAIL_INFO[railSys].url)) {
      rails.push({ short: RAIL_INFO[railSys].source || RAIL_INFO[railSys].label,
                   url: RAIL_INFO[railSys].url || '',
                   note: RAIL_INFO[railSys].note || '' });
    }
    if (srcs.length || figs.length || rails.length) {
      var sec = document.createElement('div');
      sec.className = 'menu-src';
      var h = document.createElement('p');
      h.className = 'menu-src-head';
      h.textContent = 'Source';
      sec.appendChild(h);






      var line = function (rec, what) {
        var p2 = document.createElement('p');
        var lab = document.createElement('span');
        lab.className = 'menu-src-what';
        lab.textContent = what;
        p2.appendChild(lab);
        if (rec.url) {
          var a = document.createElement('a');
          a.href = rec.url; a.target = '_blank'; a.rel = 'noopener';
          a.textContent = rec.short;
          p2.appendChild(a);
        } else {
          p2.appendChild(document.createTextNode(rec.short));
        }
        if (rec.note) {
          var n = document.createElement('span');
          n.className = 'menu-src-note';
          n.textContent = ' — ' + rec.note;
          p2.appendChild(n);
        }
        sec.appendChild(p2);
      };
      srcs.forEach(function (r) { line(r, 'Shape: '); });
      figs.forEach(function (r) { line(r, 'Figures: '); });
      rails.forEach(function (r) { line(r, 'Railway: '); });
      var more = document.createElement('p');
      more.className = 'menu-src-more';
      var a2 = document.createElement('a');
      a2.href = 'sources.html'; a2.target = '_blank'; a2.rel = 'noopener';
      a2.textContent = 'All sources in full';
      more.appendChild(a2);
      sec.appendChild(more);
      menuEl.appendChild(sec);
    }

    document.body.appendChild(menuEl);


    var b = menuEl.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - b.width - 8);
    var top = Math.min(y, window.innerHeight - b.height - 8);
    menuEl.style.left = Math.max(4, left) + 'px';
    menuEl.style.top = Math.max(4, top) + 'px';
    return true;
  }

  function copyFallback(t) {
    var ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
    document.body.removeChild(ta);
  }

  function cssEsc(v) { return String(v).replace(/"/g, '\\"'); }












  function territoryOf(key) {
    var list = (JMAP.TERRITORIES && JMAP.TERRITORIES[state.epoch]) || [];
    for (var i = 0; i < list.length; i++) {
      var own = list[i].atoms;
      if (list[i].id === key) return list[i];
      if (own && own.indexOf && own.indexOf(key) >= 0) return list[i];
    }
    return null;
  }


  function catAtoms(cat) {
    var list = (JMAP.TERRITORIES && JMAP.TERRITORIES[state.epoch]) || [];
    var out = [];
    list.forEach(function (t) {
      if (t.cat !== cat) return;
      (t.atoms || [t.id]).forEach(function (a) {
        if (out.indexOf(a) < 0) out.push(a);
      });
    });
    return out;
  }

  function catLabel(cat) {
    var list = catList() || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === cat) return list[i].en;
    return '';
  }

  function atomName(key) {
    if (!key) return '';
    var list = (JMAP.TERRITORIES && JMAP.TERRITORIES[state.epoch]) || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === key) return list[i].en;
    }
    for (i = 0; i < list.length; i++) {
      var own = list[i].atoms;
      if (own && own.indexOf && own.indexOf(key) >= 0) return list[i].en;
    }
    return '';
  }

  document.addEventListener('pointerdown', function (e) {
    if (menuEl && !menuEl.contains(e.target)) closeMenu();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  function addCsvButton(wrap, tableEl, title, notes, source) {
    if (!tableEl || !tableEl.tableSpec) return;
    var row = document.createElement('p');
    row.className = 'pop-actions';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'plain pop-csv';
    b.textContent = 'Download CSV';
    b.title = 'The figures as a spreadsheet, with the source and the notes at '
            + 'the foot of the file';
    b.addEventListener('click', function () {
      var ok = downloadText(csvFrom(tableEl.tableSpec, notes, source, title),
                            slug(title) + '.csv');
      b.textContent = ok ? 'Downloaded' : 'Could not save';
      window.setTimeout(function () { b.textContent = 'Download CSV'; }, 1400);
    });
    row.appendChild(b);
    wrap.appendChild(row);
  }

  var POP_INT = function (v) {
    return (v === undefined || v === null || v === '') ? '—'
      : Number(v).toLocaleString('en-US');
  };









  var POP_FIG = function (v, dp) {
    if (v === undefined || v === null || v === '') return '—';
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    return n.toLocaleString('en-US', { minimumFractionDigits: dp || 0,
                                       maximumFractionDigits: dp || 0 });
  };

















  function popBars(d, set, named) {
    var box = document.createElement('div');
    box.className = 'pop-bars';
















    var holds = {};
    set.parts.forEach(function (k) {
      if (d.rows[k].parent) holds[d.rows[k].parent] = true;
    });
    var parts = set.parts.filter(function (k) {
      var r = d.rows[k];
      return r.pop && !r.apart && !holds[r.en];
    });
    if (parts.length < 2) return box;
    var max = 0;
    parts.forEach(function (k) { max = Math.max(max, d.rows[k].pop); });
    if (!max) return box;





    var whole = set.top.length ? d.rows[set.top[0]] : null;
    var total = whole && whole.pop
      ? whole.pop
      : parts.reduce(function (a, k) { return a + d.rows[k].pop; }, 0);
    var cap = document.createElement('p');
    cap.className = 'pop-bars-cap';
    cap.textContent = parts.length + ' of them, '
      + POP_INT(total) + ' in all'
      + (whole && whole.pop ? ' — ' + splitGloss(named[set.top[0]]).name : '');
    box.appendChild(cap);

    var sorted = parts.slice().sort(function (a, b2) {
      return d.rows[b2].pop - d.rows[a].pop;
    });
    sorted.forEach(function (k) {
      var row = document.createElement('div');
      row.className = 'pop-bar';
      var nm = document.createElement('span');
      nm.className = 'nm';


      nm.textContent = splitGloss(named[k]).name.replace(/\s*\([^()]*\)$/, '');
      row.appendChild(nm);
      var track = document.createElement('span');
      track.className = 'track';
      var fill = document.createElement('i');
      fill.style.width = (100 * d.rows[k].pop / max).toFixed(2) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      var vv = document.createElement('span');
      vv.className = 'vv';
      vv.textContent = POP_INT(d.rows[k].pop);
      row.appendChild(vv);
      box.appendChild(row);
    });
    return box;
  }





  function popTableFor(d, key) {
    var wrap = document.createElement('section');
    wrap.className = 'pop-table-block';
    var h = document.createElement('p');
    h.className = 'pop-head';
    h.textContent = d.label;
    wrap.appendChild(h);






    if (d.noteTop) {
      var top = document.createElement('p');
      top.className = 'pop-note pop-note-top';
      top.textContent = d.noteTop;
      wrap.appendChild(top);
    }
    if (d.note) {
      var note = document.createElement('p');
      note.className = 'pop-note';
      note.textContent = d.note;
      wrap.appendChild(note);
    }

    var set = popTableRows(d);
    var order = set.top.concat(set.parts);
    var named = {};
    order.forEach(function (k) { named[k] = popRowName(k, d.rows[k]); });

    wrap.appendChild(popBars(d, set, named));















    var cols = [{ head: '' }, { head: 'Population' }];
    var hasMF = order.some(function (k) { return d.rows[k].mf; });
    if (hasMF) cols.push({ head: 'Males per 100 females' });




    var hasPct = d.pctOf && order.some(function (k) { return d.rows[k].pct; });
    if (hasPct) cols.push({ head: '% of total ' + d.pctOf });
    var hasArea = order.some(function (k) { return d.rows[k].km2; });
    if (hasArea) { cols.push({ head: 'Area km²' }); cols.push({ head: 'Per km²' }); }
    var extra = (d.fields || []).filter(function (f) {
      return (d.tableSkip || []).indexOf(f.group) < 0;
    });
    extra.forEach(function (f) { cols.push({ head: f.label, group: f.group }); });

    var tableEl = popSortable(cols, order.map(function (k) {
      var r = d.rows[k];
      var x = r.x || {};
      var np = popRowNameParts(k, r);
      var cells = [{ n: null, t: named[k], name: np.name, kanji: np.kanji },
                   { n: POP_NUM(r.pop), t: POP_INT(r.pop) }];
      if (hasMF) cells.push({ n: POP_NUM(r.mf), t: r.mf || '—' });
      if (hasPct) cells.push({ n: POP_NUM(r.pct), t: r.pct || '—' });
      if (hasArea) {
        cells.push({ n: POP_NUM(r.km2), t: POP_INT(r.km2) });
        cells.push({ n: POP_NUM(r.dens), t: r.dens || '—' });
      }
      extra.forEach(function (f) {
        cells.push({ n: POP_NUM(x[f.c]), t: POP_FIG(x[f.c], f.dp) });
      });
      return { key: k, cells: cells,
               pinned: r.scope === 'territory' || r.scope === 'summary' };
    }), key);
    wrap.appendChild(tableEl);

    var notes = [];
    if (d.noteTop) notes.push(d.noteTop);
    if (d.note) notes.push(d.note);
    order.forEach(function (k) {
      if (d.rows[k].note) notes.push(named[k] + ' — ' + d.rows[k].note);
    });



    notes.slice((d.noteTop ? 1 : 0) + (d.note ? 1 : 0)).forEach(function (n) {
      var p = document.createElement('p');
      p.className = 'pop-note';
      p.textContent = '* ' + n;
      wrap.appendChild(p);
    });
    var src = document.createElement('p');
    src.className = 'pop-src';
    src.textContent = d.source;
    wrap.appendChild(src);
    addCsvButton(wrap, tableEl, d.label, notes, d.source);
    return wrap;
  }




  function popCompare(d, key) {





    var family = popSets().filter(function (x) {
      return x.rows && x.group === d.group;
    }).sort(function (a, b) { return String(a.when).localeCompare(b.when); });
    if (family.length < 2) return null;
    var a = family[0], b = family[family.length - 1];

    var wrap = document.createElement('section');
    wrap.className = 'pop-table-block pop-compare';
    var h = document.createElement('p');
    h.className = 'pop-head';





    h.textContent = a.when + ' and ' + b.when + ' compared';
    wrap.appendChild(h);
    var note = document.createElement('p');
    note.className = 'pop-note';



    note.textContent = 'The figures both tables carry — the ' + a.caption
      + ' against the ' + b.caption + '.'
      + (a.lineLabel !== b.lineLabel
         ? ' They are not the same kind of number, so the change is between'
           + ' two kinds of count as much as between two counts.' : '');
    wrap.appendChild(note);
    if (b.compareNote || a.compareNote) {
      var caution = document.createElement('p');
      caution.className = 'pop-note';
      caution.textContent = b.compareNote || a.compareNote;
      wrap.appendChild(caution);
    }

    var keys = Object.keys(b.rows).filter(function (k) {
      var r = b.rows[k], x = a.rows[k];





      if (!x || r.sameAs || x.sameAs || r.apart || x.apart) return false;
      return r.scope === 'territory' || r.scope === 'sub-unit' || r.scope === 'city';
    });








    function cmpOf(r) { return r.cmpPop || r.pop; }
    var swapped = keys.filter(function (k) {
      return a.rows[k].cmpPop || b.rows[k].cmpPop;
    });
    var named = {};
    keys.forEach(function (k) {
      named[k] = popRowName(k, b.rows[k]) + (swapped.indexOf(k) >= 0 ? ' †' : '');
    });
    var cols = [{ head: '' },
                { head: a.when + ' population' }, { head: b.when + ' population' },
                { head: 'Change' }, { head: '% change' },
                { head: a.when + ' per km²' }, { head: b.when + ' per km²' },
                { head: a.when + ' M/100F' }, { head: b.when + ' M/100F' }];
    var cmpEl = popSortable(cols, keys.map(function (k) {
      var x = a.rows[k], y = b.rows[k];
      var xp = cmpOf(x), yp = cmpOf(y);
      var diff = (yp || 0) - (xp || 0);
      var pct = xp ? (diff / xp) * 100 : null;
      var np2 = popRowNameParts(k, y);
      return { key: k, pinned: y.scope === 'territory',
               cells: [
        { n: null, t: named[k], name: np2.name, kanji: np2.kanji },
        { n: POP_NUM(xp), t: POP_INT(xp) },
        { n: POP_NUM(yp), t: POP_INT(yp) },
        { n: diff, t: (diff > 0 ? '+' : '') + diff.toLocaleString('en-US') },
        { n: pct, t: pct === null ? '—'
                     : (pct > 0 ? '+' : '') + pct.toFixed(1) + '%' },



        { n: swapped.indexOf(k) >= 0 ? null : POP_NUM(x.dens),
          t: swapped.indexOf(k) >= 0 ? '—' : (x.dens || '—') },
        { n: swapped.indexOf(k) >= 0 ? null : POP_NUM(y.dens),
          t: swapped.indexOf(k) >= 0 ? '—' : (y.dens || '—') },
        { n: POP_NUM(x.cmpMf || x.mf), t: (x.cmpMf || x.mf) || '—' },
        { n: POP_NUM(y.cmpMf || y.mf), t: (y.cmpMf || y.mf) || '—' }] };
    }), key);
    wrap.appendChild(cmpEl);
    var cmpNotes = [note.textContent];
    if (b.compareNote || a.compareNote) cmpNotes.push(b.compareNote || a.compareNote);
    swapped.forEach(function (k) {
      var why = a.rows[k].cmpWhy || b.rows[k].cmpWhy;
      if (!why) return;
      var p = document.createElement('p');
      p.className = 'pop-note';
      p.textContent = '† ' + splitGloss(named[k]).name.replace(/ †$/, '')
        + ' — ' + why + '. No density is given in this row: that is over the '
        + 'ground the map draws, which is not the ground these figures are of.';
      wrap.appendChild(p);
      cmpNotes.push(p.textContent);
    });
    addCsvButton(wrap, cmpEl, a.when + ' and ' + b.when + ' compared', cmpNotes,
                 a.source === b.source ? a.source : a.source + '  |  ' + b.source);
    return wrap;
  }

  function openTable(href, title) {
    var dlg = $('#dlg-table');
    if (!dlg || !dlg.showModal) { window.open(href, '_blank', 'noopener'); return; }
    if (!tableDlg) {
      tableDlg = dlg;
      $('.table-close', dlg).addEventListener('click', function () { dlg.close(); });




      dlg.addEventListener('close', function () {
        $('.table-body', dlg).textContent = '';
      });


      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
    }
    $('.table-title', dlg).textContent = title || 'The printed timetable';
    var open = $('.table-open', dlg);
    if (open) { open.href = href; open.hidden = false; }
    var body = $('.table-body', dlg);
    body.textContent = '';
    var frame = document.createElement('iframe');
    frame.src = href;
    frame.title = title || 'The printed timetable';
    frame.loading = 'eager';
    body.appendChild(frame);
    dlg.showModal();
  }




















  function showRailCard(sys) {
    var inf = RAIL_INFO[sys];
    if (!inf || !infoBox) return;
    markSelected(selected, false);
    selected = null;
    trainCardWaiting = -1;
    selCluster = null;
    redrawHighlight();
    setRailPicked(sys);

    var chip = $('.chip', infoBox);
    chip.textContent = 'Railway';
    chip.style.setProperty('--chip', 'var(--muted)');
    $('.primary', infoBox).textContent = inf.label;
    var yr = railYear(sys, state.epoch);
    $('.alt', infoBox).textContent = yr ? 'the network of ' + yr : '';
    var prov = $('.prov', infoBox);
    prov.textContent = '';
    prov.hidden = true;
    var when = $('.when', infoBox);
    when.textContent = '';
    when.hidden = true;
    var own = $('.note-own', infoBox);
    setProse(own, inf.note || '');
    own.hidden = !inf.note;
    var grp = $('.note-group', infoBox);
    setProse(grp, '');
    grp.hidden = true;
    grp.setAttribute('data-group', '');
    var flip = $('#info-flip', infoBox);
    if (flip) flip.hidden = true;
    var pop = $('#info-pop');
    if (pop) { pop.innerHTML = ''; pop.hidden = true; }
    renderRailBlock($('#info-trains'), sys, inf);
    collapseInfo();
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    hideTooltip();
    gateLabels();
    placeLabels();
  }




  function renderRailBlock(host, sys, inf) {
    if (!host) return;
    host.textContent = '';
    host.hidden = false;

    var src = document.createElement('p');
    src.className = 'trains-head';
    src.textContent = 'Source: ';
    var a = document.createElement('a');
    a.href = inf.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = inf.source;
    src.appendChild(a);
    host.appendChild(src);

    var row = document.createElement('p');
    row.className = 'tbar';




    if (TRAIN_SYS[sys] && trainZone() === sys && !state.trainTools) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'plain';
      t.textContent = 'Open the train tools';
      t.addEventListener('click', function () { setTrainTools(true); });
      row.appendChild(t);
    }

    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'plain';
    d.textContent = 'Download GeoJSON';
    d.addEventListener('click', function () { saveDrawnRail(sys, state.epoch); });
    row.appendChild(d);

    host.appendChild(row);

    var hint = document.createElement('p');
    hint.className = 'trains-foot';
    hint.textContent = 'Right-click the line for the other date, or both together.';
    host.appendChild(hint);
  }





  function jpLineCard(target) {
    var el = target && target.closest ? target.closest('[data-name]') : null;
    if (!el) return null;
    var name = el.getAttribute('data-name') || '';
    var year = el.getAttribute('data-year') || '';
    var ro = el.getAttribute('data-ro') || '';
    var wiki = el.getAttribute('data-wiki') || '';
    if (!name) return null;














    var han = name;
    var lead = (state.hanLabels || !ro) ? han : ro;
    var second = (state.hanLabels || !ro) ? (ro || '') : han;
    var bits = [];
    if (second) bits.push(second);
    if (year) bits.push('opened ' + year);

    var links = [];
    if (wiki) {
      links.push({ href: wiki,
                   text: /^https?:\/\/ja\./.test(wiki)
                     ? 'Read more on Wikipedia (Japanese)'
                     : 'Read more on Wikipedia' });
    }

    links.push({ href: N05_URL, text: 'The railway dataset this is drawn from' });

    return {
      chip: 'Railway line', colour: 'var(--muted)',
      primary: lead,
      alt: bits.join('  \u00b7  '),






      links: links,
    };
  }



  var railPicked = '';

  function setRailPicked(sys) {
    railPicked = sys || '';
    Object.keys(STATION_SYS).forEach(function (k) {
      var g = document.getElementById(k + '-rail');
      if (g) g.classList.toggle('picked', k === railPicked);
    });
  }

  function showTrainCard(block) {
    if (!block || !infoBox) return;
    markSelected(selected, false);
    selected = null;


    trainCardWaiting = (block.waiting && block.geoLi >= 0) ? block.geoLi : -1;
    selCluster = null;
    redrawHighlight();
    var chip = $('.chip', infoBox);
    chip.textContent = block.chip;
    chip.style.setProperty('--chip', block.colour || 'var(--muted)');
    $('.primary', infoBox).textContent = block.primary || '';
    $('.alt', infoBox).textContent = block.alt || '';
    var prov = $('.prov', infoBox);
    prov.textContent = block.prov || '';
    prov.hidden = !block.prov;
    var when = $('.when', infoBox);
    when.textContent = '';
    when.hidden = true;
    var own = $('.note-own', infoBox);
    setProse(own, block.note || '');
    own.hidden = !block.note;
    var grp = $('.note-group', infoBox);
    setProse(grp, '');
    grp.hidden = true;
    grp.setAttribute('data-group', '');
    var flip = $('#info-flip', infoBox);
    if (flip) flip.hidden = true;







    var pop = $('#info-pop');
    if (pop) { pop.innerHTML = ''; pop.hidden = true; }
    renderTrainBlock($('#info-trains'), block);
    collapseInfo();
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
    hideTooltip();
    gateLabels();
    placeLabels();
  }







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







  function collapseInfo() {
    if (!infoBox) return;
    infoBox.classList.remove('open');
    var b = $('.more', infoBox);
    if (b) {
      b.textContent = 'More';
      b.setAttribute('aria-expanded', 'false');

      var some = ['.prov', '.when', '.note-own', '.note-group',
                  '#info-pop'].some(function (s) {
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



  var HEX = /^#[0-9a-fA-F]{6}$/;









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

















  var subEpochGated = null;
  function gateSubEpochs() {
    if (!svg) return;





    if (!subEpochGated) {
      subEpochGated = $$('#land [data-prov][data-epoch]', svg);
    }
    for (var i = 0; i < subEpochGated.length; i++) {
      var el = subEpochGated[i];
      var mine = el.getAttribute('data-epoch') === state.epoch;
      var want = mine ? '' : 'none';
      if (el.style.display !== want) el.style.display = want;
    }
  }

  function applyState() {




    applyTheme();


    bumpLayout();
    scheduleUrl();
    var quizzing = state.mode === 'quiz';
    var showLabels = state.labels && !quizzing;





    if (svg) svg.classList.toggle('admin-on', !!state.cats.territory);
    syncStationLayers();



    syncTrainTools();




    if (trainApi && trainApi.mounted()) {
      trainApi.recolour();


      trainApi.renamed();
      if (selected && byId[selected]) fillTrainCard(byId[selected]);
    }


    syncMapButtons();





    syncKoreaFine();


    if (svg) svg.classList.toggle('e1942', state.epoch === 'e1942');


    if (svg && (state.projection || 'mercator') !== projMode) {



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


      if (trainApi && trainApi.mounted()) trainApi.reprojected();


      airReprojected();
    }
    drawGraticule();
    drawRelief();
    if (svg) svg.classList.toggle('hairline', !!state.hairline);



    bumpHi();
    if (svg) svg.classList.toggle('backs-off', !state.backs);
    syncBackings();


    liftSubs(subsAtom);




    applySizes();
    JMAP.SITES.forEach(function (s) {
      var el = elById[s.id];
      if (el) el.style.display = siteVisible(s) ? '' : 'none';
    });
    applyGazetteer();



    gateLabels(true);




    territories().forEach(function (t) {
      if (!t.adminOnly) return;
      (atomsOf[t.id] || []).forEach(function (el) {
        el.style.display = state.cats.territory ? '' : 'none';
      });
    });






    territories().forEach(function (t) {
      if (!t.srcOnly) return;
      var on = srcOK(t);
      (atomsOf[t.id] || []).forEach(function (el) {
        el.style.display = on ? '' : 'none';
      });

      $$('[data-edge-for="' + t.atoms[0] + '"]', svg).forEach(function (el) {
        el.style.display = on ? '' : 'none';
      });
    });











    territories().forEach(function (t) {

      var keep = (state.world || !!EAST_ASIA[t.id]) && !terrHidden(t.id);
      var els = (atomsOf[t.id] || []).slice();




      (t.atoms || []).forEach(function (a) {
        (atomHits[a] || []).forEach(function (h) { els.push(h); });
      });
      $$('[data-edge-for="' + (t.atoms || [])[0] + '"]', svg).forEach(function (e) {
        els.push(e);
      });




      $$('#sub-outlines [data-id="' + t.id + '"]', svg).forEach(function (e) {
        els.push(e);
      });
      if (hatchGroup) {
        $$('[data-id="' + t.id + '"]', hatchGroup).forEach(function (e) { els.push(e); });
      }



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








    ['manchukuo', 'mengjiang'].forEach(function (id) {
      var rec = byId[id];
      if (!rec) return;
      var shown = state[id] !== false;






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




    ['#mengjiang-claim', '#mengjiang-whole'].forEach(function (sel) {
      var el = svg && svg.querySelector(sel);
      if (el) el.style.display =
        (state.epoch === 'e1942' && state.mengjiang !== false) ? '' : 'none';
    });
    if (svg) svg.classList.toggle('mono', !!state.mono);
    applyMonoColour();





    syncLayerButtons();
    if (extentPath) {


















      extentPath.style.display =
        (state.epoch === 'e1942' && state.extent && state.world) ? '' : 'none';
    }


    railFade();

    gateSubEpochs();
    [twRailGroup, krRailGroup, kfRailGroup, jpRailGroup,
     burmaRailGroup].forEach(function (g) {
      if (!g) return;




















      $$('path.rail', g).forEach(function (el) {






        var eps = el.getAttribute('data-epochs');
        var on = eps ? eps.split(' ').indexOf(state.epoch) >= 0
                     : el.getAttribute('data-epoch') === state.epoch;
        el.style.display = on ? '' : 'none';
        var over = el.getAttribute('data-over');
        el.style.setProperty('--rail-ink', railInk(over));
        var tie = el.nextSibling;
        if (!tie || !tie.classList || !tie.classList.contains('rail-tie')) {
          tie = svgEl('path', { 'class': 'rail-tie', d: el.getAttribute('d') });
          el.parentNode.insertBefore(tie, el.nextSibling);
        }
        tie.style.display = on ? '' : 'none';
        tie.style.setProperty('--rail-ground', railGround(over));











        var hit = tie.nextSibling;
        if (!hit || !hit.classList || !hit.classList.contains('rail-hit')) {
          hit = svgEl('path', { 'class': 'rail-hit', d: el.getAttribute('d') });
          tie.parentNode.insertBefore(hit, tie.nextSibling);
        }




        if (el.hasAttribute('data-name')) {





          ['data-name', 'data-year', 'data-ro', 'data-wiki'].forEach(function (a) {
            var v = el.getAttribute(a);
            if (v) hit.setAttribute(a, v); else hit.removeAttribute(a);
          });
        }
        hit.style.display = on ? '' : 'none';
      });
    });

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


    syncBarExtras();
    applyPop();
    buildLegend();








    if (popValuesDirty) gateLabels();


    if (showLabels || popValues.length) placeLabels();
    saveState();
  }











  var paletteCache = null;
  var OCEAN_DEF = '#cadfeb';




  var RAIL_LIGHT_DEF = '#161310';   // over a pale country
  var RAIL_DARK_DEF = '#fbf7ef';    // over a dark one







  var PALETTE_GROUPS = ['On both dates', 'The 1930 map',
                        'The December 1942 map', 'Marks and the sea'];














  var PALETTE_CODE = {
    metropole: 'mp', jpcolony: 'jc', chinese: 'ch', british: 'br',
    french: 'fr', dutch: 'du', american: 'am', portuguese: 'pt',
    soviet: 'sv', frontier: 'ft', independent: 'in', contested: 'ct',
    other: 'ot', colony: 'cl', puppet: 'pp', occupied: 'oc',
    cobelligerent: 'cb', freechina: 'fc', ccp: 'cc', pacified: 'pa',
    unpacified: 'up', allied: 'al', neutral: 'ne', city: 'ci',
    battle: 'ba', poi: 'po', ocean: 'se', raillight: 'rl', raildark: 'rd',
  };

  function palette() {
    if (paletteCache) return paletteCache;
    var eps = Object.keys(JMAP.CATEGORIES || {}).sort();
    var where = {};
    var rec = {};
    eps.forEach(function (ep) {
      (JMAP.CATEGORIES[ep] || []).forEach(function (c) {
        if (!c || !c.id || !HEX.test(c.c || '')) return;
        (where[c.id] = where[c.id] || []).push(ep);


        if (!rec[c.id]) rec[c.id] = c;
      });
    });
    var out = [];
    var seen = {};
    var add = function (r, group) {
      if (!r || !r.id || seen[r.id] || !HEX.test(r.c || '')) return;
      seen[r.id] = true;
      out.push({ id: r.id, label: r.en || r.id, def: r.c, group: group });
    };
    var groupFor = function (id) {
      var w = where[id] || [];
      if (w.length > 1) return PALETTE_GROUPS[0];
      return w[0] === 'e1930' ? PALETTE_GROUPS[1] : PALETTE_GROUPS[2];
    };
    PALETTE_GROUPS.slice(0, 3).forEach(function (g) {
      Object.keys(where).forEach(function (id) {
        if (groupFor(id) === g) add(rec[id], g);
      });
    });
    var marks = PALETTE_GROUPS[3];
    (JMAP.SITE_CATEGORIES || []).forEach(function (c) { add(c, marks); });



    out.push({ id: 'ocean', label: 'The sea', def: OCEAN_DEF, group: marks });
    out.push({ id: 'raillight', label: 'Railways over a pale country',
               def: RAIL_LIGHT_DEF, group: marks });
    out.push({ id: 'raildark', label: 'Railways over a dark country',
               def: RAIL_DARK_DEF, group: marks });
    paletteCache = out;
    return out;
  }

  function paletteById(id) {
    var p = palette();
    for (var i = 0; i < p.length; i++) if (p[i].id === id) return p[i];
    return null;
  }







  function cleanColours(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    var n = 0;
    var max = palette().length;
    Object.keys(raw).forEach(function (k) {
      if (n >= max) return;
      if (!paletteById(k)) return;
      var v = raw[k];
      if (typeof v !== 'string') return;
      v = v.trim().toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(v)) return;
      out[k] = v;
      n++;
    });
    return out;
  }

  function colourCode() {
    var bits = [];
    palette().forEach(function (p) {
      var v = state.colours[p.id];
      var c = PALETTE_CODE[p.id];
      if (c && v && v !== p.def) bits.push(c + v.slice(1));
    });
    return bits.join('');
  }

  function readColourCode(code) {
    var out = {};
    if (!code) return out;
    code = String(code);


    if (code.indexOf('-') >= 0 || code.indexOf('.') >= 0) {
      code.split('.').forEach(function (bit) {
        var cut = bit.lastIndexOf('-');
        if (cut < 1) return;
        out[bit.slice(0, cut)] = '#' + bit.slice(cut + 1);
      });
      return cleanColours(out);
    }

    var by = {};
    Object.keys(PALETTE_CODE).forEach(function (id) { by[PALETTE_CODE[id]] = id; });
    for (var i = 0; i + 8 <= code.length; i += 8) {
      var id = by[code.slice(i, i + 2)];
      if (id) out[id] = '#' + code.slice(i + 2, i + 8);
    }
    return cleanColours(out);
  }









  function applyColours() {
    var over = state.colours;
    Object.keys(JMAP.CATEGORIES || {}).forEach(function (ep) {
      (JMAP.CATEGORIES[ep] || []).forEach(function (c) {
        var p = paletteById(c.id);
        if (p) c.c = over[c.id] || p.def;
      });
    });
    (JMAP.SITE_CATEGORIES || []).forEach(function (c) {
      var p = paletteById(c.id);
      if (p) c.c = over[c.id] || p.def;
    });
    var sea = over.ocean;
    if (sea) document.documentElement.style.setProperty('--ocean', sea);
    else document.documentElement.style.removeProperty('--ocean');
    if (!svg) return;
    composeEpoch();
    (JMAP.SITES || []).forEach(function (s) {
      var el = elById[s.id];
      var info = catInfo(s.cat);
      if (el && el.style && info) el.style.setProperty('--c', info.c);
    });
    buildLegend();
    applyState();
  }


  var colourRowsBuilt = false;

  function buildColourEditor() {
    var host = $('#colour-rows');
    if (!host || colourRowsBuilt) return;
    colourRowsBuilt = true;
    var group = null;
    palette().forEach(function (p) {
      if (p.group !== group) {
        group = p.group;
        var h = document.createElement('div');
        h.className = 'colour-group';
        h.style.gridColumn = '1 / -1';
        h.textContent = group;
        host.appendChild(h);
      }
      var pick = document.createElement('input');
      pick.type = 'color';
      pick.id = 'colour-' + p.id;
      pick.value = state.colours[p.id] || p.def;
      pick.title = p.label;
      var name = document.createElement('label');
      name.className = 'colour-name';
      name.setAttribute('for', pick.id);
      name.textContent = p.label;
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'colour-back';
      back.textContent = 'Reset';
      back.title = 'Back to ' + p.def;





      pick.addEventListener('change', function () {
        var v = (pick.value || '').toLowerCase();
        if (!/^#[0-9a-f]{6}$/.test(v)) return;
        if (v === p.def) delete state.colours[p.id];
        else state.colours[p.id] = v;
        syncColourRow(p, pick, back);
        applyColours();
        scheduleUrl();
        saveState();
      });
      back.addEventListener('click', function () {
        delete state.colours[p.id];
        pick.value = p.def;
        syncColourRow(p, pick, back);
        applyColours();
        scheduleUrl();
        saveState();
      });
      host.appendChild(pick);
      host.appendChild(name);
      host.appendChild(back);
      p._pick = pick;
      p._back = back;
      syncColourRow(p, pick, back);
    });
  }

  function syncColourRow(p, pick, back) {
    var moved = !!state.colours[p.id];
    back.classList.toggle('on', moved);
    if (pick.value.toLowerCase() !== (state.colours[p.id] || p.def)) {
      pick.value = state.colours[p.id] || p.def;
    }
  }

  function refreshColourRows() {
    palette().forEach(function (p) {
      if (p._pick) syncColourRow(p, p._pick, p._back);
    });
  }

  function colourSay(msg) {
    var el = $('#colour-say');
    if (el) el.textContent = msg || '';
  }


































  var POP_RAMP = ['#dfeaf4', '#c3d6e8', '#8fb4d4', '#5286b4', '#1f5b8f'];








  var POP_MODES = ['density', 'japanese', 'occupation'];
  var HI_BASE = 1073741824;      // 2³⁰: where the bitwise field ends



  var HI_MAX = 9007199254740991;      // 2⁵³ − 1










  var POP_BITS = { 'korea-density': 1, 'taiwan-density': 16,
                   'japan-density': 2048, 'manchukuo-density': 32768 };
  var SUGAR_PLACE = 4;





  var THEME_PLACE = 8192;









  var AIR_PLACE = 131072;
  var AIRPLAY_PLACE = 262144;
  var MANCHUKUO_PLACE = 524288;
  var MENGJIANG_PLACE = 1048576;



  var AIRALL_PLACE = 2097152;
  var AIRNAMES_PLACE = 4194304;   // the names beside the airport rings



  var HANLABELS_PLACE = 8388608;





  var KFRAIL_PLACE = 16777216;
  var KFSTA_PLACE = 33554432;



  var JPRAIL_PLACE = 67108864;
  var JPSTA_PLACE = 134217728;


  var BURMARAIL_PLACE = 268435456;
  var THEME_MODES = ['light', 'dark'];






  function applyTheme() {
    var root = document.documentElement;
    if (!root) return;
    if (state.theme === 'light' || state.theme === 'dark') {
      root.setAttribute('data-theme', state.theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }




  function syncThemeSeg() {
    var seg = $('#theme-seg');
    if (!seg) return;
    $$('button', seg).forEach(function (b) {
      var on = b.getAttribute('data-theme') === state.theme;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function wireThemeSeg() {
    var seg = $('#theme-seg');
    if (!seg) return;
    $$('button', seg).forEach(function (b) {
      b.addEventListener('click', function () {
        var want = b.getAttribute('data-theme') || 'auto';
        if (state.theme === want) return;
        state.theme = want;
        syncThemeSeg();
        applyState();
        saveState();
      });
    });
    syncThemeSeg();
  }

  function popSets() { return JMAP.POPULATION || []; }

  function popSet(id) {
    return popSets().filter(function (d) { return d.id === id; })[0] || null;
  }



  function popShaded() {
    return popSets().filter(function (d) {
      return d.breaks && d.breaks.length;
    });
  }




  function popGroups() {
    var seen = {}, out = [];
    popShaded().forEach(function (d) {
      var g = seen[d.group];
      if (!g) {
        g = seen[d.group] = { id: d.group, label: d.layer,
                              country: d.country || '', sets: [] };
        out.push(g);
      }
      g.sets.push(d);
    });
    return out;
  }




  function popForEpoch(g) {
    var year = String(state.epoch).replace(/^e/, '');
    return g.sets.filter(function (d) { return String(d.epoch) === year; })[0] || null;
  }



  var POP_MODE_FIELDS = { occupation: 'Occupation' };
  var POP_MODE_LABEL = {
    density: 'Population Density',
    japanese: 'Proportion Japanese',
    occupation: 'Occupation Density',
  };


  var POP_SHADES = {
    density: {
      breaks: function (d) { return d.breaks || []; },
      value: function (r) { return r.dens; },
      unit: 'people per km²',
    },
    japanese: {
      breaks: function (d) { return d.jpBreaks || []; },
      value: function (r) {
        var n = r.x && r.x.reg_jp;
        return (n && r.pop) ? (100 * n / r.pop) : null;
      },
      unit: '% of the population on the Japanese (naichijin) register',
    },
  };





  var POP_SLICES = {
    citizenship: [
      { label: 'Koreans', c: '#e8d9b8', cols: ['reg_ko'] },
      { label: 'Japanese (naichijin)', c: '#c2463d', cols: ['reg_jp'] },
      { label: 'Chinese', c: '#e2b23a', cols: ['for_cn'] },
      { label: 'Taiwanese', c: '#7a9a5b', cols: ['reg_tw'] },
      { label: 'Karafuto', c: '#7b6aa0', cols: ['reg_karafuto'] },
      { label: 'Other foreign', c: '#4a7ba7', cols: ['for_other'] },
    ],
    occupation: [
      { label: 'Agriculture', c: '#7a9a5b', cols: ['occ_agri'] },
      { label: 'Fisheries', c: '#4a7ba7', cols: ['occ_fish'] },
      { label: 'Mining', c: '#6b5b4a', cols: ['occ_mine'] },
      { label: 'Industry', c: '#b0553f', cols: ['occ_ind'] },
      { label: 'Commerce', c: '#e2b23a', cols: ['occ_comm'] },
      { label: 'Transport', c: '#7b6aa0', cols: ['occ_trans'] },
      { label: 'Public service and professions', c: '#3f7d70', cols: ['occ_public'] },
      { label: 'Domestic service', c: '#c98b9a', cols: ['occ_domestic'] },
      { label: 'Other gainful occupation', c: '#9a9187', cols: ['occ_other'] },
    ],
  };




  function popModeReady(d, mode) {
    if (!d) return false;
    var shade = POP_SHADES[mode];
    if (shade) {






      if (!shade.breaks(d).length) return false;
      return Object.keys(d.rows || {}).some(function (k) {
        var v = shade.value(d.rows[k]);
        return v || v === 0;
      });
    }
    var want = POP_MODE_FIELDS[mode];
    return !!(d.fields || []).some(function (f) { return f.group === want; });
  }




  function popOn() {
    var out = [];
    popGroups().forEach(function (g) {
      var mode = state.pop[g.id];
      if (!POP_SHADES[mode]) return;
      var d = popForEpoch(g);
      if (popModeReady(d, mode)) out.push({ set: d, mode: mode });
    });
    return out;
  }


  function popPieOn() {
    var out = [];
    popGroups().forEach(function (g) {
      var mode = state.pop[g.id];
      if (POP_SHADES[mode] || !mode) return;      // the shaded maps are not pies
      var d = popForEpoch(g);
      if (popModeReady(d, mode)) out.push({ set: d, mode: mode });
    });
    return out;
  }



  function popClass(dens, breaks) {
    var i = 0;
    while (i < breaks.length && dens >= breaks[i]) i++;
    return Math.min(POP_RAMP.length - 1, i);
  }




  function popClassLabels(breaks) {
    var out = [];
    for (var i = 0; i <= breaks.length; i++) {
      if (i === 0) out.push('under ' + breaks[0]);
      else if (i === breaks.length) out.push(breaks[i - 1] + ' and over');
      else out.push(breaks[i - 1] + '–' + breaks[i]);
    }
    return out;
  }







  function popKey(key) {
    return String(key || '').replace(/^g_e\d+_/, '');
  }

  function popFor(key) {
    var k = popKey(key);
    if (!k) return [];





    var got = popSets().filter(function (d) { return d.rows && d.rows[k]; });
    if (!got.length) {
      var up = figuresFrom(k);
      if (up) got = popSets().filter(function (d) { return d.rows && d.rows[up]; });
    }
    return got.sort(function (a, b) { return String(a.epoch).localeCompare(b.epoch); });
  }






  function popForCard(key) {
    var year = String(state.epoch).replace(/^e/, '');
    return popFor(key).filter(function (d) { return String(d.epoch) === year; });
  }




  function popGroupFor(key) {
    var k = popKey(key);
    var up = figuresFrom(k);
    return popGroups().filter(function (g) {
      return g.sets.some(function (d) {
        return d.rows && (d.rows[k] || (up && d.rows[up]));
      });
    })[0] || null;
  }

  var popPainted = [];



  var popCardKey = null;
  var popCardName = '';

  function setPop(id, on) {
    if (!POP_BITS[id] && !popGroups().some(function (g) { return g.id === id; })) return;

    var mode = on === true ? 'density' : on;
    if (mode && POP_MODES.indexOf(mode) > -1) state.pop[id] = mode;
    else delete state.pop[id];





    if (mode) state.legend = true;
    syncPopBoxes();
    applyState();






    if (popCardKey !== null) fillPopCard(popCardKey, popCardName);
  }







  function labelRow(c, host, idPrefix) {
    var label = document.createElement('label');
    label.className = 'row';
    var el = document.createElement('input');
    el.type = 'checkbox';
    el.id = idPrefix + c.id;
    el.setAttribute('data-lcat', c.id);
    el.addEventListener('change', function () { setLabelCat(c.id, el.checked); });
    label.appendChild(el);
    label.appendChild(document.createTextNode(' ' + c.label));
    host.appendChild(label);
  }


  function airNameRow(host, id) {
    var label = document.createElement('label');
    label.className = 'row';
    var el = document.createElement('input');
    el.type = 'checkbox';
    el.id = id;
    el.setAttribute('data-lcat', 'airport');
    el.addEventListener('change', function () {
      state.airNames = el.checked;



      if (el.checked && !state.labels) state.labels = true;
      syncLabelBoxes();
      syncLayerButtons();
      applyState();
    });
    label.appendChild(el);
    label.appendChild(document.createTextNode(' Airport names'));
    host.appendChild(label);
  }

  function buildLabelRows() {
    var host = $('#label-rows');
    if (host) {
      host.innerHTML = '';
      LABEL_CATS.forEach(function (c) { labelRow(c, host, 'opt-lcat-'); });
    }
    var menu = $('#label-menu');
    if (menu) {
      menu.innerHTML = '';
      var head = document.createElement('p');
      head.className = 'menu-head';
      head.textContent = 'Which names to show';
      menu.appendChild(head);
      LABEL_CATS.forEach(function (c) { labelRow(c, menu, 'menu-lcat-'); });




      airNameRow(menu, 'menu-air-names');
    }
    syncLabelBoxes();
  }









  function syncLabelBoxes() {
    LABEL_CATS.forEach(function (c) {
      var on = !!(state.labels && state.labelCats[c.id]);
      ['opt-lcat-', 'menu-lcat-'].forEach(function (pre) {
        var el = $('#' + pre + c.id);
        if (el) el.checked = on;
      });
    });

    var airOn = !!(state.labels && state.airNames);
    ['#opt-airport-names', '#menu-air-names'].forEach(function (sel) {
      var el = $(sel);
      if (el) el.checked = airOn;
    });
  }

  function setLabelCat(id, on) {








    if (on && !state.labels) {
      LABEL_CATS.forEach(function (c) { state.labelCats[c.id] = false; });
    }
    state.labelCats[id] = on;


    if (on) state.labels = true;




    if (!on && !LABEL_CATS.some(function (c) { return state.labelCats[c.id]; })) {
      state.labels = false;
      LABEL_CATS.forEach(function (c) { state.labelCats[c.id] = true; });
    }
    if (state.labelCats.sub && state.labels) loadAdmin();
    syncLayerButtons();
    applyState();
  }







  var LABEL_HOLD_MS = 500;
  var labelMenuOn = false;


  var labelPressLong = false;

  function placeLabelMenu() {
    var menu = $('#label-menu');
    var btn = $('#layer-seg button[data-opt="labels"]');
    if (!menu || !btn) return;
    var b = btn.getBoundingClientRect();

    var w = menu.offsetWidth, h = menu.offsetHeight;
    var left = Math.max(6, Math.min(b.left, window.innerWidth - w - 6));

    var top = (b.bottom + h + 6 <= window.innerHeight) ? b.bottom + 4
                                                       : Math.max(6, b.top - h - 4);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }







  var airMenuOn = false;
  var airPressLong = false;

  function airMenuEl() {
    var m = $('#air-menu');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'air-menu';
    m.className = 'pick-menu';
    m.setAttribute('role', 'group');
    m.setAttribute('aria-label', 'Which airline sheets to draw');
    m.hidden = true;
    (container || document.body).appendChild(m);
    return m;
  }

  function buildAirMenu() {
    var m = airMenuEl();
    m.innerHTML = '';
    var head = document.createElement('p');
    head.className = 'menu-head';
    head.textContent = 'Which airlines to draw';
    m.appendChild(head);














    var groups = [{ ep: 'e1930', title: '1930 map' },
                  { ep: 'e1942', title: 'December 1942 map' }];
    var placed = {};
    groups.forEach(function (g) {
      var mine = airSets().filter(function (set) {
        return set.epochs && set.epochs[g.ep];
      });
      if (!mine.length) return;
      mine.forEach(function (set) { placed[set.key] = true; });
      mine.sort(function (a, b) {
        return (a.year - b.year) || (a.label < b.label ? -1 : 1);
      });
      var h = document.createElement('p');
      h.className = 'menu-sub';
      h.textContent = g.title;
      m.appendChild(h);
      mine.forEach(addSetRow);
    });
    var rest = airSets().filter(function (set) { return !placed[set.key]; });
    if (rest.length) rest.forEach(addSetRow);

    function addSetRow(set) {
      var label = document.createElement('label');
      label.className = 'row';
      var el = document.createElement('input');
      el.type = 'checkbox';
      el.setAttribute('data-air-set', set.key);






      el.checked = !!state.air && airSetOn(set.key);
      el.addEventListener('change', function () {




        state.airSets[set.key] = el.checked;
        if (el.checked && !state.air) state.air = true;
        applyState();
        syncLayerButtons();
        saveState();
      });
      label.appendChild(el);
      label.appendChild(document.createTextNode(' ' + set.label));
      m.appendChild(label);
    }

    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'plain menu-reset';
    back.textContent = 'Back to this date’s own';
    back.addEventListener('click', function () {
      state.airSets = {};
      syncAirMenu();
      applyState();
      saveState();
    });
    m.appendChild(back);
  }

  function syncAirMenu() {
    $$('#air-menu input[data-air-set]').forEach(function (el) {
      el.checked = !!state.air && airSetOn(el.getAttribute('data-air-set'));
    });
  }






  function placeAirMenu() {
    var m = $('#air-menu'), btn = $('#btn-air');
    if (!m || !btn) return;
    var b = btn.getBoundingClientRect();
    var w = m.offsetWidth, h = m.offsetHeight;
    var left = b.left - w - 8;
    if (left < 6) left = Math.min(b.right + 8, window.innerWidth - w - 6);
    var top = Math.max(6, Math.min(b.top, window.innerHeight - h - 6));
    m.style.left = Math.max(6, left) + 'px';
    m.style.top = top + 'px';
  }



















  var railMenuOn = false;
  var railPressLong = false;

  function railMenuEl() {
    var m = $('#rail-menu');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'rail-menu';
    m.className = 'pick-menu';
    m.setAttribute('role', 'group');
    m.setAttribute('aria-label', 'Which railway networks to draw');
    m.hidden = true;
    (container || document.body).appendChild(m);
    return m;
  }

  function buildRailMenu() {
    var m = railMenuEl();
    m.innerHTML = '';
    var head = document.createElement('p');
    head.className = 'menu-head';
    head.textContent = 'Which railways to draw';
    m.appendChild(head);








    RAIL_SWITCH_ROWS.forEach(function (row) {
      var inf = RAIL_INFO[row.sys] || {};
      var label = document.createElement('label');
      label.className = 'row';
      var el = document.createElement('input');
      el.type = 'checkbox';
      el.setAttribute('data-rail-sys', row.sys);
      el.checked = !!state[row.state];
      el.addEventListener('change', function () {
        state[row.state] = el.checked;



        var box = $('#opt-' + row.sys + '-rail');
        if (box) box.checked = el.checked;
        if (trainBorrowed && trainBorrowed.rail === row.state) {
          trainBorrowed.hadRail = el.checked;
        }

        dropToolsWithRails();
        applyState();
        saveState();
        scheduleUrl();
      });
      label.appendChild(el);



      var txt = document.createElement('span');
      txt.className = 'menu-text';
      txt.appendChild(document.createTextNode(
        inf.label || RAIL_LABEL[row.sys] || row.sys));
      var yr = (inf.years && inf.years[state.epoch]) || '';
      var title = inf.srcTitle || inf.srcShort || '';
      var paren = [title, yr].filter(Boolean).join(', ');
      if (paren) {
        var src = document.createElement('span');
        src.className = 'src';
        src.textContent = ' (' + paren + ')';
        txt.appendChild(src);
      }
      label.appendChild(txt);


      if (inf.source) label.title = inf.source;
      m.appendChild(label);
    });
  }

  function syncRailMenu() {
    $$('#rail-menu input[data-rail-sys]').forEach(function (el) {
      var row = null;
      RAIL_SWITCH_ROWS.forEach(function (r) {
        if (r.sys === el.getAttribute('data-rail-sys')) row = r;
      });
      if (row) el.checked = !!state[row.state];
    });
  }

  function placeRailMenu() {
    var m = $('#rail-menu'), btn = $('#btn-rail');
    if (!m || !btn) return;
    var b = btn.getBoundingClientRect();
    var w = m.offsetWidth, h = m.offsetHeight;
    var left = b.left - w - 8;
    if (left < 6) left = Math.min(b.right + 8, window.innerWidth - w - 6);
    var top = Math.max(6, Math.min(b.top, window.innerHeight - h - 6));
    m.style.left = Math.max(6, left) + 'px';
    m.style.top = top + 'px';
  }










  var themeMenuOn = false;

  function themeMenuNode() {
    var m = $('#theme-menu');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'theme-menu';
    m.className = 'pick-menu';
    m.setAttribute('role', 'group');
    m.setAttribute('aria-label', 'Thematic layers for this place');
    m.hidden = true;
    (container || document.body).appendChild(m);
    return m;
  }

  function buildThemeMenu(ids) {
    var m = themeMenuNode();
    m.innerHTML = '';
    var head = document.createElement('p');
    head.className = 'menu-head';
    head.textContent = 'Thematic layers';
    m.appendChild(head);









    function row(id) {
      var rec = id ? (themeRec(id) || { en: id }) : null;
      var label = document.createElement('label');
      label.className = 'row';
      var el = document.createElement('input');
      el.type = 'radio';
      el.name = 'theme-pick';
      el.checked = id ? (themeOn() === id) : !themeOn();
      el.addEventListener('change', function () {
        if (!el.checked) return;
        setTheme(id || '');
        closeThemeMenu();
      });
      label.appendChild(el);
      var txt = document.createElement('span');
      txt.className = 'menu-text';
      if (!id) {
        txt.textContent = 'Off';
      } else {
        txt.appendChild(document.createTextNode(rec.en || id));
        if (rec.source) {
          var src = document.createElement('span');
          src.className = 'src';
          src.textContent = ' (' + rec.source + ')';
          txt.appendChild(src);
        }
      }
      label.appendChild(txt);
      m.appendChild(label);
    }

    ids.forEach(row);





    row('');
  }

  function placeThemeMenu() {
    var m = $('#theme-menu'), btn = $('#btn-theme');
    if (!m || !btn) return;
    var b = btn.getBoundingClientRect();
    var w = m.offsetWidth, h = m.offsetHeight;
    var left = b.left - w - 8;
    if (left < 6) left = Math.min(b.right + 8, window.innerWidth - w - 6);
    var top = Math.max(6, Math.min(b.top, window.innerHeight - h - 6));
    m.style.left = Math.max(6, left) + 'px';
    m.style.top = top + 'px';
  }

  function openThemeMenu(ids) {
    closeOtherMenus('theme');
    buildThemeMenu(ids);
    var m = themeMenuNode();
    m.hidden = false;
    themeMenuOn = true;
    placeThemeMenu();
  }

  function closeThemeMenu() {
    var m = $('#theme-menu');
    if (!m || !themeMenuOn) return;
    m.hidden = true;
    themeMenuOn = false;
  }




  function pressTheme() {
    if (themeOn()) { setTheme(''); return; }
    var ids = themesHere();
    if (!ids.length) return;








    loadThemes(function () { openThemeMenu(ids); });
  }







  function closeOtherMenus(keep) {
    if (keep !== 'air' && airMenuOn) closeAirMenu();
    if (keep !== 'rail' && railMenuOn) closeRailMenu();
    if (keep !== 'theme' && themeMenuOn) closeThemeMenu();
    if (keep !== 'label' && labelMenuOn) closeLabelMenu();
  }

  function openRailMenu() {
    closeOtherMenus('rail');
    buildRailMenu();
    var m = railMenuEl();
    m.hidden = false;
    railMenuOn = true;
    placeRailMenu();
  }

  function closeRailMenu() {
    var m = $('#rail-menu');
    if (!m || !railMenuOn) return;
    m.hidden = true;
    railMenuOn = false;
  }

  function openAirMenu() {
    closeOtherMenus('air');
    buildAirMenu();
    var m = airMenuEl();
    m.hidden = false;
    airMenuOn = true;
    placeAirMenu();
  }

  function closeAirMenu() {
    var m = $('#air-menu');
    if (!m || !airMenuOn) return;
    m.hidden = true;
    airMenuOn = false;
  }

  function openLabelMenu() {
    closeOtherMenus('label');
    var menu = $('#label-menu');
    if (!menu) return;
    syncLabelBoxes();
    menu.hidden = false;
    labelMenuOn = true;
    placeLabelMenu();
  }

  function closeLabelMenu() {
    var menu = $('#label-menu');
    if (!menu || !labelMenuOn) return;
    menu.hidden = true;
    labelMenuOn = false;
  }

  function syncPopBoxes() {
    popGroups().forEach(function (g) {
      var d = popForEpoch(g);
      POP_MODES.concat(['none']).forEach(function (mode) {

        var el = $('#opt-pop-' + g.id + '-' + mode);
        if (!el) return;
        el.checked = mode === 'none' ? !state.pop[g.id]
                                     : state.pop[g.id] === mode;





        if (mode !== 'none') {
          var can = popModeReady(d, mode);
          el.disabled = !can;
          var say = g.sets.filter(function (x) { return popModeReady(x, mode); })
            .map(function (x) { return x.epoch; });
          var row = el.parentNode;
          if (row) {
            row.title = can ? '' : (say.length
              ? 'On the ' + say.join(' and ') + ' map' + (say.length > 1 ? 's' : '')
              : 'No figures for this yet');
            row.classList.toggle('row-off', !can);
          }
        }
      });
    });
  }



  function buildPopRows() {
    var host = $('#pop-rows');
    if (!host) return;
    host.innerHTML = '';
    var groups = popGroups();
    var section = $('#pop-section');
    if (section) section.hidden = !groups.length;




    groups.forEach(function (g) {
      var head = document.createElement('p');
      head.className = 'pane-sub';
      head.textContent = g.country || g.label;
      host.appendChild(head);





      var offer = POP_MODES.filter(function (mode) {
        return g.sets.some(function (d) { return popModeReady(d, mode); });
      });
      offer.concat(['none']).forEach(function (mode) {
        var label = document.createElement('label');
        label.className = 'row';
        var el = document.createElement('input');
        el.type = 'radio';
        el.name = 'pop-' + g.id;
        el.id = 'opt-pop-' + g.id + '-' + mode;
        el.value = mode;
        el.addEventListener('change', function () {
          if (el.checked) setPop(g.id, mode === 'none' ? null : mode);
        });
        label.appendChild(el);
        label.appendChild(document.createTextNode(
          ' ' + (mode === 'none' ? 'None' : POP_MODE_LABEL[mode])));





        if (mode !== 'none' && POP_SHADES[mode]) {
          var dl = document.createElement('button');
          dl.type = 'button';
          dl.className = 'plain pop-dl';
          dl.textContent = '\u2193';
          dl.title = 'Download this layer as GeoJSON — the shapes with their figures';
          dl.setAttribute('aria-label',
            'Download ' + (g.country || g.label) + ' ' + POP_MODE_LABEL[mode]
            + ' as GeoJSON');
          dl.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();          // the label would toggle the radio
            var want = popForEpoch(g);
            if (!want || !popModeReady(want, mode)) return;
            if (state.pop[g.id] !== mode) {
              setPop(g.id, mode);
              syncPopBoxes();
            }

            requestAnimationFrame(function () {
              savePopLayer(want, mode,
                (g.country || g.label) + ' ' + POP_MODE_LABEL[mode]);
            });
          });
          label.appendChild(dl);
        }
        host.appendChild(label);
      });
    });
    syncPopBoxes();
  }

















  var POP_BLANK = '#ffffff';

  function popFills() {
    var out = {};
    popOn().forEach(function (job) {
      var shade = POP_SHADES[job.mode];
      var breaks = shade.breaks(job.set);
      Object.keys(job.set.rows).forEach(function (k) {
        var r = job.set.rows[k];
        if (r.scope !== 'sub-unit') return;
        var v = shade.value(r);
        out[k] = (v || v === 0) ? POP_RAMP[popClass(v, breaks)] : POP_BLANK;
      });
    });
    return out;
  }


  function popBlankAt(key) {
    var k = popKey(key);
    var job = popOn()[0];
    if (!job || !k) return false;
    var r = job.set.rows[k];
    if (!r || r.scope !== 'sub-unit') return false;
    var v = POP_SHADES[job.mode].value(r);
    return !(v || v === 0);
  }







  function pieSlicePath(r, a0, a1, whole) {
    if (whole) {
      return 'M0 ' + (-r) + 'A' + r + ' ' + r + ' 0 1 1 0 ' + r
        + 'A' + r + ' ' + r + ' 0 1 1 0 ' + (-r) + 'Z';
    }
    var big = (a1 - a0) > Math.PI ? 1 : 0;
    return 'M0 0L' + (r * Math.cos(a0)).toFixed(2) + ' ' + (r * Math.sin(a0)).toFixed(2)
      + 'A' + r + ' ' + r + ' 0 ' + big + ' 1 '
      + (r * Math.cos(a1)).toFixed(2) + ' ' + (r * Math.sin(a1)).toFixed(2) + 'Z';
  }










  var PIE_R = 15;
  var pieGroup = null;

  function pieSlices(mode, x) {
    var defs = POP_SLICES[mode] || [];
    var vals = defs.map(function (s) {
      return s.cols.reduce(function (a, c) { return a + (Number(x[c]) || 0); }, 0);
    });
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    return { total: total, vals: vals, defs: defs };
  }










  var TIP_R = 34;

  function popTipBlock(key) {
    var on = popPieOn()[0];
    if (!on || !key) return null;
    var r = on.set.rows[popKey(key)];
    if (!r || !r.x || r.scope !== 'sub-unit') return null;
    var cut = pieSlices(on.mode, r.x);
    if (!cut.total) return null;

    var wrap = document.createElement('span');
    wrap.className = 'sub tip-pie';
    var svgEl2 = function (n, a) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', n);
      Object.keys(a).forEach(function (k) { el.setAttribute(k, a[k]); });
      return el;
    };
    var box = svgEl2('svg', { viewBox: [-TIP_R - 2, -TIP_R - 2,
                                        (TIP_R + 2) * 2, (TIP_R + 2) * 2].join(' '),
                              width: (TIP_R + 2) * 2, height: (TIP_R + 2) * 2,
                              'aria-hidden': 'true' });
    var a0 = -Math.PI / 2;
    cut.vals.forEach(function (v, i) {
      if (!v) return;
      var a1 = a0 + (v / cut.total) * Math.PI * 2;
      var big = (a1 - a0) > Math.PI ? 1 : 0;
      box.appendChild(svgEl2('path', {
        fill: cut.defs[i].c, stroke: 'rgba(18,15,10,.35)', 'stroke-width': .6,
        d: pieSlicePath(TIP_R, a0, a1, v >= cut.total),
      }));
      a0 = a1;
    });
    wrap.appendChild(box);

    var list = document.createElement('span');
    list.className = 'tip-pie-key';
    cut.defs.forEach(function (def, i) {
      var v = cut.vals[i];
      if (!v) return;                       // a slice of nobody is not a line
      var pct = (v / cut.total) * 100;
      var row = document.createElement('span');
      row.className = 'tip-pie-row';
      var sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = def.c;
      row.appendChild(sw);
      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = def.label;
      row.appendChild(nm);
      var vv = document.createElement('span');
      vv.className = 'vv';

      vv.textContent = (pct < 0.05 ? '<0.1' : pct.toFixed(1)) + '%';
      row.appendChild(vv);
      list.appendChild(row);
    });
    wrap.appendChild(list);
    var what = document.createElement('span');
    what.className = 'tip-pie-of';
    what.textContent = on.mode === 'occupation'
      ? 'share of those in gainful occupation, ' + on.set.epoch
      : 'share of the population, ' + on.set.epoch;
    wrap.appendChild(what);
    return wrap;
  }

  function drawPies() {
    var on = popPieOn();
    if (!pieGroup && svg && on.length) {
      pieGroup = svgEl('g', { id: 'pop-pies' });

      svg.insertBefore(pieGroup, markersGroup || null);
    }
    if (!pieGroup) return;
    pieGroup.textContent = '';
    pieGroup.style.display = on.length ? '' : 'none';
    if (!on.length) return;
    on.forEach(function (job) {
      var d = job.set;
      Object.keys(d.rows).forEach(function (k) {
        var r = d.rows[k];
        if (r.scope !== 'sub-unit' || r.sameAs || !r.x) return;


        var best = null, area = -1;
        $$('#land [data-prov="' + k + '"]', svg).forEach(function (el) {
          var a = parseFloat(el.getAttribute('data-area') || '0');
          if (a > area) { area = a; best = el; }
        });
        if (!best) return;
        var cx = parseFloat(best.getAttribute('data-cx'));
        var cy = parseFloat(best.getAttribute('data-cy'));
        if (!isFinite(cx) || !isFinite(cy)) return;
        var cut = pieSlices(job.mode, r.x);
        if (!cut.total) return;
        var g = svgEl('g', { 'class': 'pop-pie', 'data-prov': k });
        g.appendChild(svgEl('circle', { 'class': 'pie-back', r: PIE_R + 1.2 }));
        var a0 = -Math.PI / 2;
        cut.vals.forEach(function (v, i) {
          if (!v) return;
          var a1 = a0 + (v / cut.total) * Math.PI * 2;
          var big = (a1 - a0) > Math.PI ? 1 : 0;
          var p = svgEl('path', {
            'class': 'pie-slice',
            fill: cut.defs[i].c,
            d: pieSlicePath(PIE_R, a0, a1, v >= cut.total),
          });
          g.appendChild(p);
          a0 = a1;
        });
        pieGroup.appendChild(g);
        scalables.push({ el: g, x: cx, y: cy, pie: true });
      });
    });


    rescale();
  }

  function applyPop() {
    var want = popFills();
    var any = false;
    for (var k in want) { if (want.hasOwnProperty(k)) { any = true; break; } }





    if ((any || popPieOn().length) && adminState !== 'ready') loadAdmin();
    popPainted.forEach(function (el) {
      el.style.removeProperty('--c');
      el.classList.remove('pop-shaded');
      el.classList.remove('pop-edged');
    });
    popPainted = [];




    var edges = {};
    popPieOn().forEach(function (job) {
      Object.keys(job.set.rows).forEach(function (k) {
        if (job.set.rows[k].scope === 'sub-unit') edges[k] = true;
      });
    });
    if (svg) {
      $$('#land [data-prov]', svg).forEach(function (el) {
        var k = el.getAttribute('data-prov');
        if (!edges[k] && !edges[partOf(k)] && !edges[groupPartOf(el)]) return;
        el.classList.add('pop-edged');
        popPainted.push(el);
      });
    }
    if (svg) svg.classList.toggle('pop-on', any);


    for (var i = scalables.length - 1; i >= 0; i--) {
      if (scalables[i].pie) scalables.splice(i, 1);
    }
    drawPies();

    popValuesDirty = true;
    if (!any || !svg) { drawPopVoid([]); return; }
    var blanks = [];
    var litAtom = {};
    $$('#land [data-prov]', svg).forEach(function (el) {
      var k = el.getAttribute('data-prov');

      var c = want[k] || want[partOf(k)] || want[groupPartOf(el)];
      if (!c) return;
      el.style.setProperty('--c', c);
      el.classList.add('pop-shaded');
      popPainted.push(el);
      if (el.parentNode && el.parentNode.id) litAtom[el.parentNode.id] = true;
      if (c === POP_BLANK) blanks.push(el);
    });


























    if (any) {
      $$('#land .atom > path.fine', svg).forEach(function (el) {
        if (el.classList.contains('pop-shaded')) return;
        if (!el.parentNode || !litAtom[el.parentNode.id]) return;




        var c = want[groupPartOf(el)] || POP_BLANK;
        el.style.setProperty('--c', c);
        el.classList.add('pop-shaded');
        popPainted.push(el);
        if (c === POP_BLANK) blanks.push(el);
      });
    }
    drawPopVoid(blanks);
  }

















  function partOf(key) {
    var rec = key && JMAP.PROVINCES ? JMAP.PROVINCES[key] : null;
    return (rec && rec.part_of) || null;
  }

























  function groupPartOf(el) {
    var g = el && el.getAttribute ? el.getAttribute('data-group') : null;
    return (g && JMAP.ISLAND_GROUPS && JMAP.ISLAND_GROUPS[g]) || null;
  }











  function groupPartOfKey(key) {
    if (!key || !svg) return null;
    var el = svg.querySelector('path.fine[data-prov="' + cssEsc(key) + '"]');
    return el ? groupPartOf(el) : null;
  }



  function figuresFrom(key) {
    return partOf(key) || groupPartOfKey(key);
  }

















  var popVoidGroup = null;

  function drawPopVoid(els) {
    if (!svg) return;
    if (!popVoidGroup) {
      if (!els.length) return;
      popVoidGroup = svgEl('g', { id: 'pop-void' });
      popVoidGroup.style.pointerEvents = 'none';
    }


    if (labelLayer && labelLayer.parentNode === svg
        && popVoidGroup.nextSibling !== labelLayer) {
      svg.insertBefore(popVoidGroup, labelLayer);
    } else if (!popVoidGroup.parentNode) {
      svg.appendChild(popVoidGroup);
    }
    popVoidGroup.textContent = '';
    popVoidGroup.style.display = els.length ? '' : 'none';
    els.forEach(function (el) {
      var d = el.getAttribute('d');
      if (!d) return;
      popVoidGroup.appendChild(svgEl('path', { d: d, 'class': 'pop-void' }));
    });
  }



















  var POPVAL_PX = 10.5;
  var popValues = [];
  var popValuesDirty = false;




  function popValInk(cls) {
    return cls >= 3 ? { fill: '#fff', halo: 'rgba(10,22,34,.65)' }
                    : { fill: '#16232e', halo: 'rgba(255,255,255,.75)' };
  }





  function popValText(mode, v) {


    if (mode === 'japanese') {
      return (v >= 10 ? String(Math.round(v)) : v.toFixed(1)) + '%';
    }




    return v >= 10 ? String(Math.round(v)) : v.toFixed(1);
  }

  function popValueFits(rec) {
    if (!rec || !isFinite(rec.bw)) return false;
    var c = containerSize();
    var k = view.w / c.w;                     // map units per screen pixel
    return (rec.bw / k) >= rec.needW && (rec.bh / k) >= rec.needH;
  }

  function clearPopValues() {
    if (!popValues.length) return;
    popValues.forEach(function (L) {
      if (L.el && L.el.parentNode) L.el.parentNode.removeChild(L.el);
    });
    popValues = [];
    labels = labels.filter(function (L) { return !L.popval; });
    scalables = scalables.filter(function (s) { return !s.popval; });
  }

  function ensurePopValues() {
    if (!popValuesDirty) return;
    popValuesDirty = false;
    clearPopValues();
    var jobs = popOn().filter(function (j) { return POP_SHADES[j.mode]; });
    if (!jobs.length || !svg || !labelLayer) return;



    var blocks = {};
    $$('#land [data-prov]', svg).forEach(function (el) {
      var key = el.getAttribute('data-prov');
      if (!key) return;
      var a = parseFloat(el.getAttribute('data-area') || '0');
      if (!blocks[key] || a > blocks[key].a) blocks[key] = { a: a, el: el };
    });
    jobs.forEach(function (job) {
      var shade = POP_SHADES[job.mode];
      var breaks = shade.breaks(job.set);
      Object.keys(job.set.rows).forEach(function (key) {
        var r = job.set.rows[key];
        if (r.scope !== 'sub-unit' || r.sameAs) return;
        var v = shade.value(r);
        if (!(v || v === 0)) return;          // a blank unit has no figure
        var blk = blocks[key];
        if (!blk) return;
        var x = parseFloat(blk.el.getAttribute('data-cx'));
        var y = parseFloat(blk.el.getAttribute('data-cy'));
        if (!isFinite(x) || !isFinite(y)) return;
        var bb;
        try { bb = blk.el.getBBox(); } catch (err) { return; }
        if (!bb || !bb.width) return;
        var txt = popValText(job.mode, v);
        var ink = popValInk(popClass(v, breaks));
        var el = svgEl('text', { 'class': 'tlabel popval',
                                 'font-size': POPVAL_PX });
        el.style.fill = ink.fill;
        el.style.stroke = ink.halo;
        labelLayer.appendChild(el);







        var rec = { kind: 'popval', txt: txt,
                    bw: bb.width, bh: bb.height,
                    needW: txt.length * POPVAL_PX * 0.58 + 3,
                    needH: POPVAL_PX * 1.9 };
        var entry = { rec: rec, el: el, x: x, y: y, dy: 0, size: POPVAL_PX,
                      w: 0, h: POPVAL_PX * 1.2, half: 0, key: key,
                      area: Infinity, popval: true, owner: blk.el,
                      atom: blk.el.closest ? blk.el.closest('.atom') : null };
        entry.sc = { el: el, x: x, y: y, popval: true };
        labels.push(entry);
        scalables.push(entry.sc);
        popValues.push(entry);
      });
    });
    if (popValues.length) sortLabels();
  }



  function popRow(host, label, value, cls) {
    var row = document.createElement('div');
    row.className = 'pop-row' + (cls ? ' ' + cls : '');
    var k = document.createElement('span');
    k.className = 'pop-k';
    k.textContent = label;
    var v = document.createElement('span');
    v.className = 'pop-v';
    v.textContent = value;
    row.appendChild(k);
    row.appendChild(v);
    host.appendChild(row);
  }




  function fillPopCard(key, name) {
    var host = $('#info-pop');
    if (!host) return;
    host.innerHTML = '';
    var sets = popForCard(key);
    var k = popKey(key);





    var borrowed = null;
    if (sets.length && !(sets[0].rows || {})[k]) {
      var up = figuresFrom(k);
      if (up) { borrowed = up; k = up; }
    } else if (sets.length && ((sets[0].rows || {})[k] || {}).sameAs) {














      borrowed = sets[0].rows[k].sameAs;
    }
    popCardKey = sets.length ? key : null;
    popCardName = name || '';
    if (!sets.length) { host.hidden = true; return; }
    sets.forEach(function (d) {
      var r = d.rows[k];
      var block = document.createElement('div');
      block.className = 'pop-block';
      var head = document.createElement('p');
      head.className = 'pop-head';




      var whose = borrowed
        ? splitGloss(popRowName(borrowed, r)).name
        : name;
      head.textContent = ((r.scope === 'sub-unit' || r.scope === 'city') && whose)
        ? whose + ', ' + d.caption : d.label;
      block.appendChild(head);






      if (borrowed && !r.note) {
        var lend = document.createElement('p');
        lend.className = 'pop-note';
        lend.textContent = 'The island was governed as part of '
          + splitGloss(popRowName(borrowed, r)).name
          + ', and the census counted its people there. These are that '
          + 'province\'s figures, and the shading on the island is its '
          + 'province\'s too.';
        block.appendChild(lend);
      }
      if (r.pop) popRow(block, 'Population', r.pop.toLocaleString('en-US'));
      if (r.mf) popRow(block, 'Males per 100 females', r.mf);
      if (r.pct) popRow(block, '% of total ' + d.pctOf, r.pct);
      if (r.dens) popRow(block, 'Per km²', r.dens + '  (' + r.km2.toLocaleString('en-US') + ' km²)');



      if (r.parent) {
        popRow(block, 'In ' + r.parent,
               r.parentPop ? Number(r.parentPop).toLocaleString('en-US') : '—');
      }




      var groups = [];
      (d.fields || []).forEach(function (f) {
        if (groups.indexOf(f.group) < 0) groups.push(f.group);
      });
      groups.forEach(function (g) {
        var some = d.fields.filter(function (f) {
          return f.group === g && r.x && r.x[f.c] !== undefined;
        });
        if (!some.length) return;
        var gh = document.createElement('p');
        gh.className = 'pop-group-head';
        gh.textContent = g;
        block.appendChild(gh);
        some.forEach(function (f) {





          popRow(block, f.label, POP_FIG(r.x[f.c], f.dp),
                 f.role === 'total' ? 'pop-sum' : '');
        });
      });
      if (r.note) {
        var note = document.createElement('p');
        note.className = 'pop-note';
        note.textContent = r.note;
        block.appendChild(note);
      }
      host.appendChild(block);
    });






    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'plain pop-more';
    more.textContent = 'Population Table';
    more.addEventListener('click', function () { openPopTable(popKey(key)); });
    host.appendChild(more);

    var group = popGroupFor(key);
    if (group) {
      var on = state.pop[group.id] === 'density';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plain pop-btn' + (on ? ' on' : '');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');


      btn.textContent = on ? 'Hide the population density map'
                           : 'Provinces by Population Density';
      btn.addEventListener('click', function () {
        setPop(group.id, on ? null : 'density');
      });
      host.appendChild(btn);
    }
    host.hidden = false;
  }






























  function legendPickable() { return !!state.legendPick && state.mode !== 'quiz'; }




  var legendOpen = {};


  var headPressLong = false;














  var swPicker = null;

  function pickColourFor(id, sw) {
    var p = paletteById(id);
    if (!p) return false;
    if (!swPicker) {
      swPicker = document.createElement('input');
      swPicker.type = 'color';
      swPicker.className = 'sw-picker';
      swPicker.setAttribute('aria-label', 'Colour');
      document.body.appendChild(swPicker);
    }
    swPicker.value = state.colours[id] || p.def;
    swPicker.oncancel = null;
    swPicker.onchange = function () {
      var v = (swPicker.value || '').toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(v)) return;
      if (v === p.def) delete state.colours[id];
      else state.colours[id] = v;
      if (sw) sw.style.background = v;
      applyColours();


      syncColourEditor();
      scheduleUrl();
      saveState();
    };


    if (sw && sw.getBoundingClientRect) {
      var b = sw.getBoundingClientRect();
      swPicker.style.left = Math.round(b.left) + 'px';
      swPicker.style.top = Math.round(b.bottom) + 'px';
    }
    swPicker.click();
    return true;
  }



  function syncColourEditor() {
    if (!colourRowsBuilt) return;
    palette().forEach(function (p) {
      var pick = document.getElementById('colour-' + p.id);
      if (!pick) return;
      pick.value = state.colours[p.id] || p.def;
      var back = pick.parentNode
        && pick.parentNode.querySelector('.colour-back');
      if (back) syncColourRow(p, pick, back);
    });
  }


  function legendRow(host, swClass, swColour, text, tick, colourId) {
    var row = document.createElement('div');
    row.className = 'item';
    if (tick) {
      row.classList.add('pickable');
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'legend-tick';
      box.checked = tick.on;
      box.indeterminate = !!tick.mixed;
      box.setAttribute('aria-label', text);
      box.addEventListener('change', function () { tick.set(box.checked); });
      row.appendChild(box);
    }
    var sw = document.createElement('span');
    sw.className = 'sw' + (swClass ? ' ' + swClass : '');
    if (swColour) sw.style.background = swColour;
    if (colourId && paletteById(colourId)) {
      sw.classList.add('sw-editable');
      sw.title = (coarse ? 'Hold' : 'Option-click') + ' to change this colour';
      sw.addEventListener('click', function (e) {
        if (!e.altKey) return;              // a plain click is the switch
        e.preventDefault();
        e.stopPropagation();
        pickColourFor(colourId, sw);
      });


      var held = null;
      var drop = function () { if (held) { clearTimeout(held); held = null; } };
      sw.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        drop();
        held = setTimeout(function () {
          held = null;
          pickColourFor(colourId, sw);
        }, 550);
      });
      ['pointerup', 'pointercancel', 'pointermove', 'pointerleave']
        .forEach(function (n) { sw.addEventListener(n, drop); });
    }
    row.appendChild(sw);
    row.appendChild(document.createTextNode(text));
    host.appendChild(row);
    return row;
  }











  function legendResetNeeded() {
    for (var k in state.hideTerr) { if (state.hideTerr[k]) return true; }
    return !state.rivers || (state.epoch === 'e1942' && !state.extent);
  }

  function legendReset() {
    state.hideTerr = {};
    state.rivers = true;
    state.extent = true;
    syncLayerButtons();
    applyState();
  }

  function buildLegend() {
    var legend = $('#legend');
    if (!legend) return;
    legend.innerHTML = '';
    if (state.mode === 'quiz') { legend.hidden = true; return; }

    var used = {};









    var inCat = {};
    territories().forEach(function (t) {
      if (t.unseen || !srcOK(t)) return;
      if (!state.world && !EAST_ASIA[t.id]) return;
      used[t.cat] = true;
      (inCat[t.cat] = inCat[t.cat] || []).push(t);
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



    var root = legend;











    head.addEventListener('click', function (ev) {
      if (headPressLong) { headPressLong = false; return; }
      if (ev.altKey) { setLegendPick(!state.legendPick); return; }
      state.legend = !state.legend;
      root.classList.toggle('folded', !state.legend);
      head.setAttribute('aria-expanded', state.legend ? 'true' : 'false');
      saveState();
      placeLabels();
    });
    var headHold = 0;
    var stopHead = function () { if (headHold) { clearTimeout(headHold); headHold = 0; } };
    head.addEventListener('pointerdown', function () {
      headPressLong = false;
      stopHead();
      headHold = setTimeout(function () {
        headHold = 0;
        headPressLong = true;
        setLegendPick(!state.legendPick);
      }, LABEL_HOLD_MS);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evn) {
      head.addEventListener(evn, stopHead);
    });
    head.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    legend.appendChild(head);
    legend.classList.toggle('folded', !state.legend);

    var body = document.createElement('div');
    body.id = 'legend-body';
    body.className = 'legend-body';
    legend.appendChild(body);
    var appendTo = legend;
    legend = body;                   // rows go inside the folding part

    var pick = legendPickable();
    catList().forEach(function (c) {
      if (!used[c.id]) return;
      var mine = inCat[c.id] || [];
      var off = mine.filter(function (t) { return terrHidden(t.id); }).length;
      var row = legendRow(legend, '', c.c, nameOf(c), pick && {
        on: off < mine.length,

        mixed: off > 0 && off < mine.length,
        set: function (on) {
          mine.forEach(function (t) {
            if (on) delete state.hideTerr[t.id]; else state.hideTerr[t.id] = true;
          });
          applyState();
        },
      }, c.id);



      if (!pick || mine.length < 2) return;
      var open = !!legendOpen[c.id];
      var caret = document.createElement('button');
      caret.type = 'button';
      caret.className = 'legend-open' + (open ? ' open' : '');
      caret.setAttribute('aria-expanded', open ? 'true' : 'false');
      caret.setAttribute('aria-label',
        (open ? 'Hide' : 'Show') + ' the places under ' + nameOf(c));
      caret.addEventListener('click', function () {
        legendOpen[c.id] = !legendOpen[c.id];
        buildLegend();
      });
      row.appendChild(caret);
      if (!open) return;
      mine.forEach(function (t) {
        var sub = legendRow(legend, '', c.c, nameOf(t), {
          on: !terrHidden(t.id),
          set: function (on) {
            if (on) delete state.hideTerr[t.id]; else state.hideTerr[t.id] = true;
            applyState();
          },
        });
        sub.classList.add('legend-sub');
      });
    });



    if (state.epoch === 'e1942' && (state.extent || pick) && JMAP.EXTENT_1942) {
      legendRow(legend, 'line', '', nameOf(JMAP.EXTENT_1942), pick && {
        on: state.extent,
        set: function (on) { state.extent = on; syncLayerButtons(); applyState(); },
      });
      if (state.extent) {
        var src = document.createElement('p');
        src.className = 'legend-src';
        src.textContent = JMAP.EXTENT_1942.source;
        legend.appendChild(src);
      }
    }

    if (state.rivers || pick) {
      legendRow(legend, 'river', '',
        state.epoch === 'e1942'
          ? 'Yangzi and Yellow rivers (Yellow River in its 1938–47 course)'
          : 'Yangzi and Yellow rivers',
        pick && {
          on: state.rivers,
          set: function (on) { state.rivers = on; syncLayerButtons(); applyState(); },
        });
    }






    if (themeOn()) {
      var trec = themeRec(themeOn());
      if (trec && (trec.cats || []).length) {
        var thead = document.createElement('p');
        thead.className = 'legend-sub';
        thead.textContent = trec.en || 'Thematic layer';
        legend.appendChild(thead);
        trec.cats.forEach(function (cat) {
          legendRow(legend, 'sw-theme', cat.c, cat.en, null, null);
        });
      }
    }





    popGroups().forEach(function (g) {
      if (!state.pop[g.id] || popForEpoch(g)) return;
      var none = document.createElement('div');
      none.className = 'item pop-key-head';
      none.textContent = g.label + ' — no figures for this date yet';
      legend.appendChild(none);
    });




    popPieOn().forEach(function (job) {
      var head = document.createElement('div');
      head.className = 'item pop-key-head';





      head.textContent = (job.set.country || '') + ' ' + POP_MODE_LABEL[job.mode]
        + ' ' + (job.set.when || job.set.epoch) + ' — '
        + (job.mode === 'occupation'
           ? 'share of those in gainful occupation' : 'share of the population');
      legend.appendChild(head);
      (POP_SLICES[job.mode] || []).forEach(function (sl) {
        var row = document.createElement('div');
        row.className = 'item pop-key-row';
        var sw = document.createElement('span');
        sw.className = 'sw';
        sw.style.background = sl.c;
        row.appendChild(sw);
        row.appendChild(document.createTextNode(sl.label));
        legend.appendChild(row);
      });
      var psrc = document.createElement('p');
      psrc.className = 'legend-src';
      psrc.textContent = job.set.source;
      legend.appendChild(psrc);
    });

    popOn().forEach(function (job) {
      var d = job.set, shade = POP_SHADES[job.mode];
      var head = document.createElement('div');
      head.className = 'item pop-key-head';



      head.textContent = (d.country || d.layer) + ' ' + POP_MODE_LABEL[job.mode]
        + ' ' + (d.when || d.epoch) + ' — ' + shade.unit;
      legend.appendChild(head);
      popClassLabels(shade.breaks(d)).forEach(function (txt, i) {
        var row = document.createElement('div');
        row.className = 'item pop-key-row';
        var sw = document.createElement('span');
        sw.className = 'sw';
        sw.style.background = POP_RAMP[i];
        row.appendChild(sw);
        row.appendChild(document.createTextNode(txt));
        legend.appendChild(row);
      });



      var blank = Object.keys(d.rows).some(function (k) {
        var r = d.rows[k];
        if (r.scope !== 'sub-unit') return false;
        var v = shade.value(r);
        return !(v || v === 0);
      });
      if (blank) {
        var brow = document.createElement('div');
        brow.className = 'item pop-key-row';
        var bsw = document.createElement('span');
        bsw.className = 'sw pop-blank-sw';
        bsw.style.background = POP_BLANK;
        brow.appendChild(bsw);
        brow.appendChild(document.createTextNode('no data'));
        legend.appendChild(brow);
      }
      var psrc = document.createElement('p');
      psrc.className = 'legend-src';
      psrc.textContent = d.source;
      legend.appendChild(psrc);
    });

    JMAP.SITE_CATEGORIES.forEach(function (c) {
      if (!state.cats[c.id] && !pick) return;
      legendRow(legend,
        c.id === 'city' ? 'round' : c.id === 'poi' ? 'square' : 'diamond',
        c.c, nameOf(c), pick && {
          on: !!state.cats[c.id],
          set: function (on) {
            state.cats[c.id] = on;

            if (c.id === 'city') state.cats.poi = on;
            if (c.id === 'poi' && on) state.cats.city = true;
            syncLayerButtons();
            applyState();
          },
        });
    });

    if (JMAP.GAZ && state.cats.city) {



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
    }



    if (pick && legendResetNeeded()) {
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'legend-reset';
      reset.textContent = 'Reset map';
      reset.addEventListener('click', legendReset);
      legend.appendChild(reset);
    }

    appendTo.hidden = false;
  }
























  function restoreSelection(id, provKey, cluster) {
    if (!id) return false;
    var m = /^g_e\d+_(.+)$/.exec(id);
    if (m) id = 'g_' + state.epoch + '_' + m[1];
    if (!byId[id]) return false;
    lastProv = null;
    selProv = null;
    setSelProv(null);
    if (provKey && svg) {
      var el = $$('#land [data-prov="' + provKey + '"]', svg).filter(function (x) {
        var atom = x.closest ? x.closest('.atom') : null;
        return atom && atom.style.display !== 'none';
      })[0];
      if (el) lastProv = provinceOf(el);
    }
    select(id, lastProv ? cluster : null);
    return true;
  }

  function setEpoch(id) {
    if (!id || state.epoch === id) return;
    var wasId = selected;
    var wasProv = selProv && selProv.key ? selProv.key : null;
    var wasCluster = selCluster;
    state.epoch = id;




    state.airSets = {};
    $$('#epoch-seg button').forEach(function (x) {
      x.classList.toggle('on', x.getAttribute('data-epoch') === id);
    });
    select(null);
    composeEpoch();
    applyState();





    if (airPlayWanted && airApi && airApi.mounted()) {
      var was = airApi.time(), wasPlaying = airApi.playing();
      airApi.unmount();
      mountAirPlay();
      if (airApi.mounted()) {
        airApi.setTime(was);
        if (wasPlaying) airApi.play(true);
      }
    }



    if (!restoreSelection(wasId, wasProv, wasCluster)) showEpochBlurb();
  }










  var EAST_ASIA = {





    china: 1, freechina: 1, xinjiang: 1, tibet: 1, ccp: 1,
    jehol: 1, chahar: 1, suiyuan: 1, paracel: 1, pratas: 1,





    japan: 1, ryukyu: 1, ogasawara: 1, chishima: 1,
    chosen: 1, formosa: 1, karafuto: 1,

    kwantung: 1, weihaiwei: 1, guangzhouwan: 1, hongkong: 1, macau: 1,

    manchuria: 1, manchukuo: 1, mengjiang: 1, occupiedzone: 1, nanjinggov: 1,






    nca_pacified: 1, nca_unpacified: 1,



    contested: 1,
  };

  var OCC_LABEL = { traced: '1942 general occupation extent',
                    nca: 'the North China Area Army reading',
                    none: 'no occupation layer' };

  function setOccSource(v) {
    if (v !== 'traced' && v !== 'nca' && v !== 'none') return;





    if (v === 'none' && state.occSource !== 'none' && state.ccp) {
      state.ccp = false;
      var cc = $('#opt-ccp');
      if (cc) cc.checked = false;
    }








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


      b.title = e.id === 'e1942'
        ? 'December 1942: the empire at its widest, and how Japan held it'
        : '1930: whose empire each place belonged to, on the eve of the Manchurian Incident';
      b.classList.toggle('on', e.id === state.epoch);
      b.addEventListener('click', function () { setEpoch(e.id); });
      seg.appendChild(b);
    });
  }



  function setLegendPick(on) {
    state.legendPick = on;
    if (on && !state.legend) state.legend = true;
    buildLegend();
    placeLabels();
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




    fillPopCard(null);
    fillTrainCard(null);
    collapseInfo();
    infoBox.hidden = false;
    document.body.classList.add('panel-open');
  }




  var adminState = 'none';          // none | loading | ready | failed





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











  var FINE_W = 150;











  var FINE_W_FOR = { japan: 420 };








  var fineState = 'none';           // none | loading | ready | failed






  var fineFailedAt = 0;
  var FINE_RETRY_MS = 30000;
  var fineBoxes = null;             // atom -> [x0, y0, x1, y1], from the map
  var fineDoc = null;               // the parsed file, kept for regrafting
  var fineLive = {};                // region key -> the nodes it has grafted
  var fineHits = [];                // every live island's box, for the reach



  var coarseOrig = [];






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
    fetchText('japan-empire-map-fine.svg')
      .then(parse)
      .catch(function () {
        fineState = 'failed';
        fineFailedAt = (window.performance || Date).now();
      });
  }






  function liveFineBoxes() {
    var out = [];




    if (!fineSupersedes) return out;
    Object.keys(fineLive).forEach(function (k) {
      fineLive[k].forEach(function (node) {
        boxesOf(node.getAttribute('d')).forEach(function (b) { if (b) out.push(b); });
      });
    });
    return out;
  }





  function reprune() {


    bumpHi();
    coarseOrig.forEach(function (r) {


      if (r.d !== null) {
        r.el.setAttribute('d', projMode === 'mercator' ? r.d : moveD(r.d));
      }
      r.el.classList.remove('superseded');
    });

    var fine = liveFineBoxes();
    if (!fine.length) return;






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
      var base = d;
      if (base !== null && node.__d0 !== undefined) base = node.__d0;
      coarseOrig.push({ el: node, d: base });
    };







    var prune = function (node) {
      if (node.classList.contains('fine')) return;







      if (node.classList.contains('mandate')) return;
      var d = node.getAttribute && node.getAttribute('d');
      if (!d) {






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








  function subNodesChanged() {
    subNodes = null;
    subParentNames = null;
  }

  function graftFine(key) {
    if (fineLive[key] || !fineDoc) return false;
    bumpHi();
    var g = $('g[data-for="' + key + '"]', fineDoc.documentElement);
    var el = atomEls[key];
    if (!g || !el) return false;
    var nodes = [];
    var before = el.querySelector('circle');
    subNodesChanged();
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


















  function dropLabelsFor(els) {
    if (!els.length) return;
    subNodesChanged();
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
      dropped.forEach(function (L) {
        if (L.sc) L.sc.__dropping = 1;
        if (L.nameKey && subNamed) delete subNamed[L.nameKey];
      });
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



  var fineSupersedes = false;








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


    if (deep !== fineSupersedes) {
      fineSupersedes = deep;
      changed = true;
    }
    if (!changed) return;
    rebuildFineHits();
    reprune();

    buildHatch();
    applyState();
    redrawHighlight();
  }










  var provSets = { enp: {}, roc: {}, kfine: {} };
  var provSource = 'enp';
  var rocState = 'none';            // none | loading | ready | failed

  function rememberProvinces(which, key, nodes) {
    var bag = (provSets[which][key] = provSets[which][key] || []);



    nodes.forEach(function (n) { if (bag.indexOf(n) < 0) bag.push(n); });
  }

  function setProvinceSource(which) {
    subNodesChanged();
    if (which !== 'enp' && which !== 'roc') return;
    provSource = which;



    if (which === 'roc' && (rocState === 'none' || rocState === 'failed')) loadRoc();
    Object.keys(atomEls).forEach(function (key) {
      var el = atomEls[key];
      var wanted = provSets[which][key];
      var other = provSets[which === 'enp' ? 'roc' : 'enp'][key];

      if (!wanted || !wanted.length) return;
      if (other) other.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });











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







      reprojectGraft(wanted);
    });




    lastProv = null;
    setHotProv(null);
    applyState();
    if (selected) select(selected);
    redrawHighlight();
  }

  function loadRoc() {
    if (rocState === 'loading' || rocState === 'ready') return;
    rocState = 'loading';
    fetchSvg('japan-empire-map-roc.svg')
      .then(function (doc) {
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

        var back = $('#prov-enp');
        if (back) { back.checked = true; setProvinceSource('enp'); }
      });
  }





















  var KOREA_FINE_LAT = 4.0;      // degrees of latitude on screen, coming in
  var KOREA_FINE_OFF = 5.0;      // and going out; apart, so a pinch cannot flap
  var KOREA_BOX = [124.0, 33.0, 131.3, 43.2];
  var koreaFineState = 'none';   // none | loading | ready | failed
  var koreaFineOn = false;

  function overKorea(limit) {
    if (latSpan() > limit) return false;
    var c = unproject(view.x + view.w / 2, view.y + view.h / 2);
    return isFinite(c.lon) && isFinite(c.lat)
      && c.lon >= KOREA_BOX[0] - 1 && c.lon <= KOREA_BOX[2] + 1
      && c.lat >= KOREA_BOX[1] - 1 && c.lat <= KOREA_BOX[3] + 1;
  }



  function syncKoreaFine() {
    var want = overKorea(koreaFineOn ? KOREA_FINE_OFF : KOREA_FINE_LAT);
    if (want === koreaFineOn) return;




    if (want && adminState !== 'ready') return;
    if (want && koreaFineState === 'none') { loadKoreaFine(); return; }
    if (want && koreaFineState !== 'ready') return;
    koreaFineOn = want;
    showKoreaFine(want);
  }

  function showKoreaFine(fine) {
    var el = atomEls.korea;
    if (!el) return;
    var on = provSets.kfine.korea || [];
    var off = provSets[provSource].korea || [];
    if (!on.length) return;
    var going = fine ? off : on;
    var coming = fine ? on : off;
    going.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    var before = el.querySelector('circle');
    coming.forEach(function (n) { el.insertBefore(n, before); });


    reprojectGraft(coming);
    bumpHi();
    applyState();
    if (selected) select(selected);
  }

  function loadKoreaFine() {
    koreaFineState = 'loading';
    fetchSvg('japan-empire-map-korea.svg')
      .then(function (doc) {
        var g = doc.querySelector('g[data-for="korea"]');
        var el = atomEls.korea;
        if (!g || !el) { koreaFineState = 'failed'; return; }
        var mine = [];
        while (g.firstElementChild) {
          var node = document.importNode(g.firstElementChild, true);
          g.removeChild(g.firstElementChild);
          mine.push(node);
        }
        rememberProvinces('kfine', 'korea', mine);
        koreaFineState = 'ready';

        syncKoreaFine();
      })
      .catch(function () { koreaFineState = 'failed'; });
  }

  function loadAdmin() {

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







        if (provSource !== 'enp' && provSets.roc[forKey] && provSets.roc[forKey].length) {
          mine.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
        } else {
          reprojectGraft(mine);
        }
        el.classList.remove('deferred');
      });
      if (!grafted) {



        adminState = 'none';
        setAdminBusy();
        return;
      }
      adminState = 'ready';


      subEpochGated = null;

      subNodesChanged();

      applyThemeClip();
      setAdminBusy();
      applyState();
      if (selected) select(selected);
    };
    if (window.JMAP_INLINE_ADMIN) { graft(window.JMAP_INLINE_ADMIN); return; }
    fetchText('japan-empire-map-admin.svg')
      .then(graft)
      .catch(function () {


        adminState = 'failed';
        setAdminBusy();
      });
  }





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
      var opt = b.getAttribute('data-opt');
      var on = opt ? !!state[opt] : !!state.cats[b.getAttribute('data-cat')];
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });




    var rc = $('#opt-relief');
    if (rc) rc.checked = !!state.relief;





    [['#opt-rivers', 'rivers'], ['#opt-extent', 'extent'],
     ['#opt-india-rivers', 'indiaRivers'], ['#opt-graticule', 'graticule'],
     ['#opt-mono', 'mono'], ['#opt-world', 'world'],
     ['#opt-jpnames', 'jpNames'], ['#opt-ccp', 'ccp'],
     ['#opt-manchukuo', 'manchukuo'], ['#opt-mengjiang', 'mengjiang']]
      .forEach(function (pair) {
        var el = $(pair[0]);
        if (el) el.checked = !!state[pair[1]];
      });



    syncPopBoxes();


    syncLabelBoxes();
    syncThemeSeg();
    syncBarExtras();
  }










  var BAR_EXTRAS_MIN = 1120;

  function syncBarExtras() {


    var ver = $('#bar-version');
    if (ver) ver.hidden = !ver.textContent
      || (window.innerWidth || 0) < BAR_EXTRAS_MIN;
    var ext = $('#extent-seg'), occ = $('#occ-seg');
    if (!ext || !occ) return;
    var room = (window.innerWidth || 0) >= BAR_EXTRAS_MIN;





    var annSeg = $('#ann-seg');
    if (annSeg) annSeg.hidden = !(room && state.mode !== 'quiz');




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





  function ensureOnScreen(rec) {
    if (!rec || !svg) return;
    var state0 = reachable(rec);
    if (state0 === true) return;


    if (state0 === 'crowded') { focusOn(rec); return; }
    view = defaultView();
    applyView(true);
    if (reachable(rec) === true) return;
    focusOn(rec, 3);
  }

  function reachable(rec) {
    if (!rec || !svg) return true;






    var st = container.getBoundingClientRect();
    var box = quizBox.hidden ? null : quizBox.getBoundingClientRect();
    var over = box && box.left < st.right && box.right > st.left &&
               box.top < st.bottom && box.bottom > st.top;
    var floor = over ? Math.min(st.bottom, box.top) : st.bottom;



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






        if (b.getAttribute('data-occ') === 'traced' && !state.ccp) {
          state.ccp = true;
          var cy2 = $('#opt-ccp');
          if (cy2) cy2.checked = true;
        }
        setOccSource(b.getAttribute('data-occ'));
        syncLayerButtons();
        saveState();
      });
    });
    window.addEventListener('resize', syncBarExtras);



    $$('#layer-seg button').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var opt = b.getAttribute('data-opt');









        if (opt === 'labels' && labelPressLong) {
          labelPressLong = false;
          return;
        }
        if (opt === 'labels' && e.altKey) {
          if (labelMenuOn) closeLabelMenu(); else openLabelMenu();
          return;
        }
        closeLabelMenu();
        if (opt) {
          state[opt] = !state[opt];
          if (opt === 'labels') syncLabelBoxes();
        } else {
          var cat = b.getAttribute('data-cat');
          state.cats[cat] = !state.cats[cat];
          if (cat === 'city') state.cats.poi = state.cats.city;
          if (cat === 'territory' && state.cats[cat]) loadAdmin();
        }
        syncLayerButtons();
        applyState();
      });
    });













    var labelHold = 0;
    var otherBtn = $('#layer-seg button[data-opt="labels"]');
    if (otherBtn) {
      var stopHold = function () {
        if (labelHold) { clearTimeout(labelHold); labelHold = 0; }
      };
      otherBtn.addEventListener('pointerdown', function () {
        labelPressLong = false;
        stopHold();
        labelHold = setTimeout(function () {
          labelHold = 0;
          labelPressLong = true;      // swallowed by the click handler above
          if (labelMenuOn) closeLabelMenu(); else openLabelMenu();
        }, LABEL_HOLD_MS);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        otherBtn.addEventListener(ev, stopHold);
      });

      otherBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }



    document.addEventListener('pointerdown', function (e) {
      if (airMenuOn) {
        var am = $('#air-menu');
        var ab = $('#btn-air');
        if (!(am && am.contains(e.target)) && !(ab && ab.contains(e.target))) {
          closeAirMenu();
        }
      }
      if (railMenuOn) {
        var rm = $('#rail-menu');
        var rb = $('#btn-rail');
        if (!(rm && rm.contains(e.target)) && !(rb && rb.contains(e.target))) {
          closeRailMenu();
        }
      }
      if (themeMenuOn) {
        var tm = $('#theme-menu');
        var tb = $('#btn-theme');
        if (!(tm && tm.contains(e.target)) && !(tb && tb.contains(e.target))) {
          closeThemeMenu();
        }
      }
      if (!labelMenuOn) return;
      var menu = $('#label-menu');
      if (menu && menu.contains(e.target)) return;
      if (otherBtn && otherBtn.contains(e.target)) return;
      closeLabelMenu();
    }, true);
    document.addEventListener('keydown', function (e) {
      if (labelMenuOn && e.key === 'Escape') closeLabelMenu();
      if (railMenuOn && e.key === 'Escape') closeRailMenu();
      if (themeMenuOn && e.key === 'Escape') closeThemeMenu();
    });
    window.addEventListener('resize', function () {
      if (labelMenuOn) placeLabelMenu();
      if (railMenuOn) placeRailMenu();
      if (themeMenuOn) placeThemeMenu();
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

        if (r.checked && r.value === 'traced' && !state.ccp) {
          state.ccp = true;
          var cy3 = $('#opt-ccp');
          if (cy3) cy3.checked = true;
        }
        if (r.checked) setOccSource(r.value);
      });
    });

    [['#opt-manchukuo', 'manchukuo'], ['#opt-mengjiang', 'mengjiang'],
     ['#opt-mono', 'mono'], ['#opt-world', 'world'],
     ['#opt-jpnames', 'jpNames'],




     ['#opt-han-labels', 'hanLabels']].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.checked = !!state[pair[1]];
      el.addEventListener('change', function () {
        state[pair[1]] = el.checked;









        applyState();

        if (pair[1] === 'mono') syncMono();




        if ((pair[1] === 'hanLabels' || pair[1] === 'jpNames') && selected) {
          select(selected);
        }
        redrawHighlight();






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

        if (selected && !srcOK(byId[selected])) select(null);
        applyState();
        redrawHighlight();
      });
    }













    var coOpen = $('#opt-colours-open');
    var coBox = $('#colour-editor');
    if (coOpen && coBox) {
      coOpen.addEventListener('click', function () {
        var on = coBox.hidden;
        if (on) buildColourEditor();
        coBox.hidden = !on;
        coOpen.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }
    var coSave = $('#colour-save');
    if (coSave) {
      coSave.addEventListener('click', function () {
        var body = { version: 1, colours: {} };
        palette().forEach(function (p) {
          body.colours[p.id] = state.colours[p.id] || p.def;
        });
        try {
          var blob = new Blob([JSON.stringify(body, null, 2)],
                              { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'japanese-empire-map-colours.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          colourSay('saved');
        } catch (err) { colourSay('could not save: ' + err.message); }
      });
    }
    var coLoad = $('#colour-load');
    var coFile = $('#colour-file');
    if (coLoad && coFile) {
      coLoad.addEventListener('click', function () { coFile.click(); });
      coFile.addEventListener('change', function () {
        var f = coFile.files && coFile.files[0];
        if (!f) return;


        if (f.size > 64 * 1024) { colourSay('that file is not a colour set'); return; }
        var fr = new FileReader();
        fr.onload = function () {
          var data;
          try { data = JSON.parse(String(fr.result)); }
          catch (err) { colourSay('that is not JSON'); coFile.value = ''; return; }




          var want = cleanColours((data && data.colours) || data);
          var n = Object.keys(want).length;
          if (!n) { colourSay('no colours in it that this map knows'); coFile.value = ''; return; }
          state.colours = want;
          refreshColourRows();
          applyColours();
          scheduleUrl();
          saveState();
          colourSay(n + ' colour' + (n === 1 ? '' : 's') + ' loaded');
          coFile.value = '';
        };
        fr.onerror = function () { colourSay('could not read it'); coFile.value = ''; };
        fr.readAsText(f);
      });
    }
    var coReset = $('#colour-reset');
    if (coReset) {
      coReset.addEventListener('click', function () {
        state.colours = {};
        refreshColourRows();
        applyColours();
        scheduleUrl();
        saveState();
        colourSay('back to the map\u2019s own');
      });
    }

    var monoPick = $('#opt-mono-colour');
    var monoReset = $('#opt-mono-reset');
    function syncMono() {
      var row = $('#mono-colour-row');
      if (row) row.hidden = !state.mono;
      if (monoReset) monoReset.hidden = !state.monoColour;
      if (monoPick && svg) {


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
    wireThemeSeg();

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










    var railPairs = [['#opt-air', 'air'], ['#opt-burma-rail', 'burmaRail']];
    var railKeys = {};
    Object.keys(STATION_SYS).forEach(function (k) {
      railPairs.push(['#opt-' + k + '-rail', STATION_SYS[k].rail]);
      railPairs.push(['#' + STATION_SYS[k].box, STATION_SYS[k].on]);
      railKeys[STATION_SYS[k].rail] = true;
    });
    railPairs.forEach(function (pair) {
        var box = $(pair[0]);
        if (!box) return;
        box.checked = state[pair[1]];
        box.addEventListener('change', function () {
          state[pair[1]] = box.checked;







          if (trainBorrowed) {
            if (trainBorrowed.rail === pair[1]) trainBorrowed.hadRail = box.checked;
            if (trainBorrowed.on === pair[1]) trainBorrowed.hadOn = box.checked;
          }


          if (railKeys[pair[1]]) dropToolsWithRails();
          applyState();
        });
      });




    var boxTrainTools = $('#opt-train-tools');
    if (boxTrainTools) {
      boxTrainTools.checked = state.trainTools;
      boxTrainTools.addEventListener('change', function () {
        setTrainTools(boxTrainTools.checked);
      });
    }









    var boxAirNm = $('#opt-airport-names');
    if (boxAirNm) {
      boxAirNm.checked = !!(state.labels && state.airNames);
      boxAirNm.addEventListener('change', function () {
        state.airNames = boxAirNm.checked;

        if (boxAirNm.checked && !state.labels) state.labels = true;
        syncLabelBoxes();
        syncLayerButtons();
        applyState();
      });
    }

    var boxAll = $('#opt-air-all');
    if (boxAll) {
      boxAll.checked = !!state.airAll;
      boxAll.addEventListener('change', function () {
        state.airAll = boxAll.checked;
        var wasUp = !!(airApi && airApi.mounted());
        if (wasUp) unmountAirPlay();
        applyState();
        if (wasUp) mountAirPlay();
      });
    }




    var btnSta = $('#btn-stations');
    if (btnSta) {
      btnSta.addEventListener('click', function () {
        var syss = btnStationsSyss;
        if (!syss.length) return;



        var want = !syss.every(function (k) {
          return !!state[STATION_SYS[k].on];
        });
        syss.forEach(function (sys) {
          var key = STATION_SYS[sys].on;
          state[key] = want;
          var box = $('#' + STATION_SYS[sys].box);
          if (box) box.checked = want;




          if (trainBorrowed && trainBorrowed.on === key) {
            trainBorrowed.hadOn = want;
          }
        });
        applyState();
      });
    }

    var btnTrn = $('#btn-trains');
    if (btnTrn) {
      btnTrn.addEventListener('click', function () {
        setTrainTools(!state.trainTools);
        saveState();
      });
    }


    var btnAir = $('#btn-air');
    if (btnAir) {






      var airHold = 0;
      var stopAirHold = function () {
        if (airHold) { clearTimeout(airHold); airHold = 0; }
      };
      btnAir.addEventListener('pointerdown', function () {
        airPressLong = false;
        stopAirHold();
        airHold = setTimeout(function () {
          airHold = 0;
          airPressLong = true;
          if (airMenuOn) closeAirMenu(); else openAirMenu();
        }, LABEL_HOLD_MS);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        btnAir.addEventListener(ev, stopAirHold);
      });
      btnAir.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      btnAir.addEventListener('click', function (e) {
        if (airPressLong) { airPressLong = false; return; }
        if (e.altKey) {
          if (airMenuOn) closeAirMenu(); else openAirMenu();
          return;
        }
        closeAirMenu();
        state.air = !state.air;





        if (state.air && trainApi && trainApi.mounted()) {
          trainWanted = '';
          trainApi.unmount();
          syncLayerButtons();
        }
        var box = $('#opt-air');
        if (box) box.checked = state.air;
        applyState();
        saveState();
        scheduleUrl();
      });
    }





    var btnPlanes = $('#btn-planes');
    if (btnPlanes) {
      btnPlanes.addEventListener('click', function () {
        setAirPlay(!airPlayWanted);




        scheduleUrl();
      });
    }





    var btnTheme = $('#btn-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', function () {
        if (themeMenuOn) { closeThemeMenu(); return; }
        pressTheme();
      });
    }

    var btnRail = $('#btn-rail');
    if (btnRail) {






      var railHold = 0;
      var stopRailHold = function () {
        if (railHold) { clearTimeout(railHold); railHold = 0; }
      };
      btnRail.addEventListener('pointerdown', function () {
        railPressLong = false;
        stopRailHold();
        railHold = setTimeout(function () {
          railHold = 0;
          railPressLong = true;
          if (railMenuOn) closeRailMenu(); else openRailMenu();
        }, LABEL_HOLD_MS);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        btnRail.addEventListener(ev, stopRailHold);
      });
      btnRail.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      btnRail.addEventListener('click', function (e) {
        if (railPressLong) { railPressLong = false; return; }











        if (railMenuOn) closeRailMenu(); else openRailMenu();
      });
    }

    var btnSugar = $('#btn-sugar');
    if (btnSugar) {
      btnSugar.addEventListener('click', function () { setSugar(!state.twSugar); });
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




    var optRailZoom = $('#opt-rail-zoom');
    if (optRailZoom) {
      optRailZoom.checked = !!state.railZoom;
      optRailZoom.addEventListener('change', function () {
        state.railZoom = optRailZoom.checked;
        railFade();
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





    $$('input[name="prov-src"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) setProvinceSource(r.value);
      });
    });
























    var layFind = $('#layers-find');
    if (layFind) {
      var dlgOpts = $('#dlg-options');
      var kids = function () {
        return Array.prototype.filter.call(dlgOpts.children, function (el) {
          return el.tagName !== 'FORM' && el.tagName !== 'H2'
                 && el.id !== 'layers-find' && el.id !== 'layers-none'
                 && !el.classList.contains('lay-find');
        });
      };






      var wordsOf = function (el) {
        var t = [el.textContent || '', el.getAttribute('aria-label') || ''];
        Array.prototype.forEach.call(el.querySelectorAll('[aria-label]'),
          function (x) { t.push(x.getAttribute('aria-label') || ''); });
        return t.join(' ').toLowerCase();
      };






      var headOf = function (el) {
        var n = el;
        while (n && n !== dlgOpts) {
          var q2 = n.previousElementSibling;
          while (q2) {
            if (q2.tagName === 'H3') return (q2.textContent || '').toLowerCase();
            var deep = q2.querySelectorAll('h3');
            if (deep.length) return (deep[deep.length - 1].textContent || '').toLowerCase();
            q2 = q2.previousElementSibling;
          }
          n = n.parentElement;
        }
        return '';
      };
      var layFilter = function () {
        var q = String(layFind.value || '').trim().toLowerCase();
        var els = kids();
        var hits = 0;


        var shown = els.map(function () { return false; });
        var last = -1;
        els.forEach(function (el, i) {
          var tag = el.tagName;
          if (tag === 'H3' || tag === 'HR') return;
          var rider = tag === 'P'
            || (el.classList.contains('seg') && last >= 0
                && els[last].tagName === 'LABEL');
          if (rider) { if (last >= 0) shown[i] = shown[last]; return; }



          var rows = el.querySelectorAll('.row');
          if (rows.length) {
            var any = false;
            Array.prototype.forEach.call(rows, function (row) {
              var ok = !q || (wordsOf(row) + ' ' + headOf(row)).indexOf(q) >= 0;
              row.classList.toggle('lay-hide', !ok);
              if (ok) any = true;
            });
            shown[i] = any;
          } else {
            shown[i] = !q || (wordsOf(el) + ' ' + headOf(el)).indexOf(q) >= 0;
          }
          last = i;
          if (shown[i]) hits++;
        });


        for (var i = els.length - 1, alive = false; i >= 0; i--) {
          var tag = els[i].tagName;
          if (tag === 'H3') { shown[i] = !q || alive; alive = false; continue; }
          if (tag === 'HR') { shown[i] = !q; continue; }



          if (shown[i] && !els[i].querySelector('h3')) alive = true;
        }
        els.forEach(function (el, i) { el.classList.toggle('lay-hide', !shown[i]); });
        var none = $('#layers-none');
        if (none) none.hidden = !(q && !hits);
        var clr = $('#layers-clear');
        if (clr) clr.hidden = !layFind.value;
      };
      layFind.addEventListener('input', layFilter);



      var layClear = $('#layers-clear');
      if (layClear) {
        layClear.addEventListener('click', function () {
          layFind.value = ''; layFilter(); layFind.focus();
        });
      }


      layFind.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && layFind.value) {
          e.stopPropagation(); e.preventDefault();
          layFind.value = ''; layFilter();
        }
      });
      JMAP.__layerFilter = layFilter;
    }



    $('#btn-options').addEventListener('click', function (e) {
      if (e.altKey) { loadAdminPanel(); return; }


      var lf = $('#layers-find');
      if (lf && lf.value) { lf.value = ''; if (JMAP.__layerFilter) JMAP.__layerFilter(); }
      $('#dlg-options').showModal();
    });
    $('#btn-about').addEventListener('click', function () { $('#dlg-about').showModal(); });



    var helpBtn = $('#btn-help');
    if (helpBtn) helpBtn.addEventListener('click', function () { $('#dlg-help').showModal(); });
    $$('dialog').forEach(function (d) {
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });







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

    $('#q-reveal').addEventListener('click', function () {
      if (quiz && !quiz.current) { startQuiz(); return; }
      revealAnswer();
    });
    $('#q-skip').addEventListener('click', skipQuestion);
    $('#q-end').addEventListener('click', endQuiz);

    $('#zoom-in').addEventListener('click', function () { zoomCentre(1.5); });
    $('#zoom-out').addEventListener('click', function () { zoomCentre(1 / 1.5); });
    $('#zoom-reset').addEventListener('click', function () { view = defaultView(); applyView(true); });














    var pressLayer = function (sel) {
      var b = $(sel);
      if (b && !b.hidden && !b.disabled) b.click();
    };
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, dialog')) return;
      if (t && t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      if (k === 'Escape') {
        if (!infoBox.hidden) { select(null); hideTooltip(); }
        else { view = defaultView(); applyView(true); }
        return;
      }
      if (k === '+' || k === '=') { zoomCentre(1.4); return; }
      if (k === '-' || k === '_') { zoomCentre(1 / 1.4); return; }
      if (k === '?') { pressLayer('#btn-help'); return; }
      if (k === '0') { setEpoch(JMAP.DEFAULT_EPOCH); return; }
      if (k === '2') {
        var other = otherEpoch();
        if (other) setEpoch(other);
        return;
      }
      var low = String(k).toLowerCase();
      if (low === 'l') { pressLayer('#btn-options'); return; }
      if (low === 'n') { pressLayer('#bar-ann-create'); return; }



      var seg = { c: '[data-cat="city"]', a: '[data-cat="territory"]',
                  e: '[data-cat="battle"]', t: '[data-opt="relief"]',
                  o: '[data-opt="labels"]' }[low];
      if (seg) {
        var b = $('#layer-seg ' + seg);
        if (b) b.click();
        return;
      }



      if (low === 'r') { pressLayer('#btn-rail'); return; }




      if (low === 'f') { pressLayer('#btn-air'); return; }




      if (low === 'g') {
        var gb = $('#opt-graticule');
        if (gb) { gb.checked = !gb.checked;
                  gb.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
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





      dropScalables: function (idx) {
        scalables = scalables.filter(function (s) {
          if (!s.ann) return true;
          return idx !== undefined && s.annIdx !== idx;
        });
      },
      rescale: function () { if (lastScaleW > 0) rescale(); },
      rescaleAnn: rescaleAnn,



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













      makeRoom: function () {
        annWasLegend = state.legend;
        if (state.legend) { state.legend = false; buildLegend(); saveState(); }
        if (infoBox && !infoBox.hidden) {
          markSelected(selected, false);
          selected = null;
          infoBox.hidden = true;
          document.body.classList.toggle('panel-open', !quizBox.hidden);



          redrawHighlight();
        }
      },
      giveBack: function () {
        if (annWasLegend && !state.legend) {
          state.legend = true; buildLegend(); saveState();
        }
        annWasLegend = false;
      },



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
    loadScript('annotate.js').then(
      function () {
        if (!window.JMAP_ANNOTATE) { done(false); return; }
        annApi = window.JMAP_ANNOTATE(annHost());
        done(true);
      },
      function () {
        done(false);
        window.alert('The annotation tools could not be loaded. '
          + 'They are in annotate.js, which has to sit beside index.html.');
      });
  }




































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












  function stampVersion() {
    var el = $('#jem-version');
    if (!el || typeof JEM_VERSION === 'undefined') return;
    var page = (el.textContent || '').trim();
    if (page === JEM_VERSION) return;
    el.textContent = JEM_VERSION;







    var note = document.createElement('span');
    note.className = 'version-stale';
    note.textContent = ' — this page was built for ' + page
      + ', so one of the two is coming from your browser\'s cache.'
      + ' A hard reload will put them in step.';
    el.parentNode.appendChild(note);
  }







  function barVersion() {
    var el = $('#bar-version');
    if (!el) return;
    var page = ($('#jem-version') || {}).textContent || '';
    var v = (typeof JEM_VERSION !== 'undefined' ? JEM_VERSION : page).trim();
    el.textContent = v ? '1.' + v + (isBeta() ? ' beta' : '') : '';
    syncBarExtras();
  }















  function betaHost(h) {
    return /(^|\.)github\.io$/i.test(String(h || ''));
  }

  function isBeta() {
    try { return betaHost(location.hostname); } catch (e) { return false; }
  }





  function applyBeta() {
    var on = isBeta();
    var badge = $('#beta-badge');
    if (badge) badge.hidden = !on;
    var tag = document.querySelector('.beta-tag');
    if (tag) tag.hidden = !on;
    document.documentElement.classList.toggle('is-beta', on);
  }



  JMAP.__betaHost = betaHost;











  window.JMAP_GEO = {
    project: function (lon, lat) { return project(lon, lat); },
    unproject: function (x, y) { return unproject(x, y); },
    mode: function () { return projMode; },
  };

  function annWire() {
    stampVersion();
    applyBeta();
    barVersion();






    var ANN_MIN_W = 700;







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

    var code = null;
    try { code = params().get('ann'); }
    catch (err) { code = null; }
    if (code) annLoad(function (api) { if (api) api.fromUrl(code); });
  }

}());
