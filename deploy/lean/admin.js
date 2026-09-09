














(function () {
  'use strict';

  var OPEN_KEY = 'jmap-admin';        // panel was open; reload should reopen it
  var SET_KEY = 'jmap-admin-settings';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };






  function switchRow(sec, html) {
    var wrap = document.createElement('label');
    wrap.className = 'sw';
    wrap.innerHTML = html;
    sec.appendChild(wrap);
    return $('input', wrap);
  }
  function readout(sec) {
    var out = document.createElement('div');
    out.className = 'readout';
    sec.appendChild(out);
    return out;
  }
  function textarea(sec) {
    var ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.spellcheck = false;
    sec.appendChild(ta);
    return ta;
  }


  function buttonRow(sec) {
    var row = document.createElement('div');
    row.className = 'row';
    sec.appendChild(row);
    return function (label, fn, cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (cls) b.className = cls;
      b.addEventListener('click', function () { fn(b); });
      row.appendChild(b);
      return b;
    };
  }

  var settings = {};
  try { settings = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); } catch (err) { settings = {}; }
  function setting(k, v) {
    if (arguments.length > 1) {
      settings[k] = v;
      try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (err) { /* private mode */ }
    }
    return settings[k];
  }

  var svg = $('#map-svg svg');
  var container = $('#map-container');
  if (!svg || !container) return;



  var meta = svg.querySelector('#proj');
  var P = {
    lonMin: parseFloat(meta.getAttribute('data-lon-min')),
    latMax: parseFloat(meta.getAttribute('data-lat-max')),
    pxPerDeg: parseFloat(meta.getAttribute('data-px-per-deg')),
    R: parseFloat(meta.getAttribute('data-r')),
  };
  P.yTop = P.R * Math.log(Math.tan(Math.PI / 4 + P.latMax * Math.PI / 360));









  function toLonLat(x, y) {
    if (window.JMAP_GEO && window.JMAP_GEO.unproject) {
      var q = window.JMAP_GEO.unproject(x, y);
      if (q && isFinite(q.lon) && isFinite(q.lat)) return q;
    }
    return {
      lon: P.lonMin + x / P.pxPerDeg,
      lat: (Math.atan(Math.exp((P.yTop - y) / P.R)) - Math.PI / 4) * 360 / Math.PI,
    };
  }

  function fromLonLat(lon, lat) {
    if (window.JMAP_GEO && window.JMAP_GEO.project) {
      var q = window.JMAP_GEO.project(lon, lat);
      if (q && isFinite(q.x) && isFinite(q.y)) return q;
    }
    var rad = lat * Math.PI / 180;
    return {
      x: (lon - P.lonMin) * P.pxPerDeg,
      y: P.yTop - P.R * Math.log(Math.tan(Math.PI / 4 + rad / 2)),
    };
  }

  function clientToUser(cx, cy) {
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    var pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    return pt.matrixTransform(ctm.inverse());
  }



  function unitsPerPixel() {
    var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    var w = svg.getBoundingClientRect().width || 1;
    return (vb[2] || w) / w;
  }



  var STYLE = [
    '#jmap-admin{position:fixed;top:0;right:0;bottom:0;width:var(--admin-w,320px);',
    ' z-index:70;display:flex;flex-direction:column;font:13px/1.45 system-ui,sans-serif;',
    ' background:#191512;color:#f2ece4;box-shadow:-2px 0 14px rgba(0,0,0,.35);overflow:hidden}',
    '#jmap-admin header{display:flex;align-items:center;gap:8px;padding:10px 12px;',
    ' background:#0f0c0a;border-bottom:1px solid #3a322b;flex:0 0 auto}',
    '#jmap-admin header b{font-size:12px;letter-spacing:.09em;text-transform:uppercase;font-weight:600}',
    '#jmap-admin header small{color:#9a8f83;font-size:11px}',
    '#jmap-admin .grow{flex:1 1 auto}',
    '#jmap-admin .body{flex:1 1 auto;overflow:auto;padding:4px 0 24px}',
    '#jmap-admin section{border-bottom:1px solid #2c2620;padding:12px}',
    '#jmap-admin h2{margin:0 0 2px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;',
    ' color:#e8b98a;font-weight:600}',
    '#jmap-admin p.hint{margin:0 0 9px;color:#9a8f83;font-size:11.5px}',
    '#jmap-admin button{font:inherit;background:#2b2520;color:#f2ece4;border:1px solid #4a413a;',
    ' border-radius:6px;padding:5px 10px;cursor:pointer}',
    '#jmap-admin button:hover{background:#3a322b}',
    '#jmap-admin button.on{background:#c2542e;border-color:#c2542e;color:#fff}',
    '#jmap-admin button.wide{width:100%;margin-top:6px}',
    '#jmap-admin .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px}',
    '#jmap-admin label.sw{display:flex;gap:8px;align-items:center;cursor:pointer;user-select:none}',
    '#jmap-admin .readout{margin-top:8px;color:#9a8f83;font-size:11.5px;white-space:pre-wrap}',
    '#jmap-admin textarea{width:100%;box-sizing:border-box;margin-top:8px;height:96px;resize:vertical;',
    ' background:#0f0c0a;color:#cfe6c6;border:1px solid #3a322b;border-radius:6px;padding:6px;',
    ' font:11px/1.4 ui-monospace,Menlo,monospace}',
    '#jmap-admin .close{border:0;background:transparent;color:#9a8f83;font-size:18px;padding:0 4px}',
    'body.jmap-admin-open #stage{padding-right:var(--admin-w,320px)}',


    '#jmap-draw .edge{fill:rgba(255,146,54,.34);stroke:#c2542e;stroke-width:1.8;',
    ' vector-effect:non-scaling-stroke;stroke-linejoin:round}',
    '#jmap-draw .vtx{fill:#fff;stroke:#c2542e;stroke-width:1.4;vector-effect:non-scaling-stroke}',
    '#jmap-draw .vtx.first{fill:#c2542e}',
    '#jmap-extent-edit .edited{fill:none;stroke:#2f9e6b;stroke-width:2.2;',
    ' stroke-dasharray:7 5;vector-effect:non-scaling-stroke;pointer-events:none}',
    '#jmap-extent-edit .vtx{fill:#fff;stroke:#2f9e6b;stroke-width:1.4;',
    ' vector-effect:non-scaling-stroke;cursor:grab;pointer-events:all}',
    '#jmap-extent-edit .vtx.moved{fill:#2f9e6b;stroke:#0f6b45}',
    '#jmap-extent-edit .vtx.sel{stroke:#c2542e;stroke-width:3}',
    '#jmap-extent-edit .vtx.gone{fill:none;stroke:#c2542e;stroke-width:1.6;',
    ' stroke-dasharray:2 2;cursor:pointer}',
    'body.jmap-drawing #map-container{cursor:crosshair}',


    '#jmap-route .leg{fill:none;stroke:#1d9bd1;stroke-width:2.4;',
    ' vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}',
    '#jmap-route .grab{fill:none;stroke:transparent;stroke-width:14;',
    ' vector-effect:non-scaling-stroke;pointer-events:stroke;cursor:copy}',
    '#jmap-route .stop{fill:#fff;stroke:#1d9bd1;stroke-width:2.2;',
    ' vector-effect:non-scaling-stroke}',
    '#jmap-route .stop.first{fill:#1d9bd1}',
    '#jmap-route .bend{fill:#ffd200;stroke:#1d9bd1;stroke-width:1.4;',
    ' vector-effect:non-scaling-stroke;pointer-events:all;cursor:grab}',
    '#jmap-route .bend.sel{stroke:#c2542e;stroke-width:3}',
    '#jmap-admin input.txt{font:inherit;background:#0f0c0a;color:#f2ece4;',
    ' border:1px solid #3a322b;border-radius:6px;padding:5px 7px;min-width:0;flex:1 1 90px}',
  ].join('');

  var panel, bodyEl, tapTools = [];

  function build() {
    var style = document.createElement('style');
    style.id = 'jmap-admin-style';
    style.textContent = STYLE;
    document.head.appendChild(style);

    panel = document.createElement('div');
    panel.id = 'jmap-admin';
    panel.innerHTML =
      '<header><b>Admin</b><small>option-click Layers</small>' +
      '<span class="grow"></span>' +
      '<button type="button" class="close" title="Close (Esc)">&times;</button></header>' +
      '<div class="body"></div>';
    document.body.appendChild(panel);
    bodyEl = $('.body', panel);
    $('.close', panel).addEventListener('click', close);

    TOOLS.forEach(function (t) {
      var sec = document.createElement('section');
      sec.innerHTML = '<h2>' + t.title + '</h2>' +
        (t.hint ? '<p class="hint">' + t.hint + '</p>' : '');
      bodyEl.appendChild(sec);
      t.build(sec, api);
    });

    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape' && panel && !drawing()) close();
  }

  function relayout() {


    window.dispatchEvent(new Event('resize'));
  }

  function open() {
    if (!panel) build();
    panel.style.display = '';
    document.body.classList.add('jmap-admin-open');
    try { localStorage.setItem(OPEN_KEY, '1'); } catch (err) { /* private mode */ }
    relayout();
  }

  function close() {
    if (!panel) return;
    panel.style.display = 'none';
    document.body.classList.remove('jmap-admin-open');
    try { localStorage.removeItem(OPEN_KEY); } catch (err) { /* private mode */ }
    relayout();
  }

  function toggle() {
    if (panel && panel.style.display !== 'none') close(); else open();
  }




  window.JMAP_TAP = function (e) {
    for (var i = 0; i < tapTools.length; i++) {
      if (tapTools[i](e) === false) return false;
    }
    return true;
  };






  var shiftTools = [];
  window.JMAP_SHIFT = function (e) {
    for (var i = 0; i < shiftTools.length; i++) {
      if (shiftTools[i](e)) return true;
    }
    return false;
  };

  var api = {
    svg: svg,
    container: container,
    toLonLat: toLonLat,
    fromLonLat: fromLonLat,
    clientToUser: clientToUser,
    unitsPerPixel: unitsPerPixel,
    setting: setting,
    onTap: function (fn) { tapTools.push(fn); },
    onShift: function (fn) { shiftTools.push(fn); },
    copy: copyText,
  };

  function copyText(text, btn) {
    var done = function (ok) {
      if (!btn) return;
      var was = btn.textContent;
      btn.textContent = ok ? 'Copied' : 'Select it yourself';
      window.setTimeout(function () { btn.textContent = was; }, 1200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); },
                                               function () { done(false); });
      return;
    }

    done(false);
  }



  var TOOLS = [];









  TOOLS.push({
    title: 'Natural Earth outline',
    hint: 'Natural Earth 1:10m, unsimplified, drawn as a line over the map. ' +
          'Where the two disagree, the drawn shape is not its source: Korea sat ' +
          'a median of 2.7&nbsp;km from this line before it was moved, which is ' +
          'why the railways ran through water. Heavy — 1.7&nbsp;MB, fetched once ' +
          'when first asked for.',
    build: function (sec) {
      var group = null;
      var loading = false;

      var box = switchRow(sec, '<input type="checkbox"> Show Natural Earth outline');

      var out = readout(sec);

      function say(m) { out.textContent = m; }

      function show(on) {
        if (group) {
          group.style.display = on ? '' : 'none';
          say(on ? 'over the map' : 'off');
          return;
        }
        if (!on || loading) return;
        loading = true;
        say('fetching…');
        var url = 'japan-empire-map-ne.svg';
        try {


          if (window.JEM_ASSETS && window.JEM_ASSETS[url]) {
            url += '?v=' + encodeURIComponent(window.JEM_ASSETS[url]);
          }
        } catch (err) { /* the map is not obliged to expose it */ }
        fetch(url).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        }).then(function (text) {
          var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
          var g = doc.getElementById('ne-outline');
          if (!g) throw new Error('no #ne-outline in the sheet');
          group = document.importNode(g, true);
          svg.appendChild(group);
          loading = false;
          if (!box.checked) { group.style.display = 'none'; say('off'); return; }
          say(group.childNodes.length + ' rings over the map');
        }).catch(function (err) {
          loading = false;
          box.checked = false;
          say('could not fetch it: ' + err.message);
        });
      }

      box.addEventListener('change', function () {
        setting('neOutline', box.checked);
        show(box.checked);
      });
      if (setting('neOutline')) { box.checked = true; show(true); }
      else say('off');
    },
  });



  TOOLS.push({
    title: 'Backings',
    hint: 'Natural Earth’s outline of each country, in a layer under the atoms. ' +
          'Half the path data in the file. With Administrative <b>on</b> it is a ' +
          'filler — the provinces are drawn over it and it only shows through the ' +
          'cracks between them. With Administrative <b>off</b> the provinces have ' +
          'not been fetched, so for China, India, Japan, Korea, Siam, Burma, ' +
          'Indochina, the Indies and a dozen more the backing <b>is</b> the ' +
          'country, and switching it off empties the map. Off, they are detached ' +
          'from the document, so a pan measures the map without them — and the page ' +
          'reloads, so what you measure afterwards has never had them in it. The ' +
          'view comes back as you left it.',
    build: function (sec) {
      var group = svg.querySelector('#backings');
      var anchor = document.createComment('backings');
      var detached = null;

      var box = switchRow(sec, '<input type="checkbox" checked> Draw backings');

      var out = readout(sec);












      function measure() {
        var g = detached || svg.querySelector('#backings');
        if (!g) return '';
        var paths = g.querySelectorAll('path');
        var chars = 0, drawn = 0;
        for (var i = 0; i < paths.length; i++) {
          chars += (paths[i].getAttribute('d') || '').length;
          if (paths[i].style.display !== 'none') drawn++;
        }
        return paths.length + ' paths, ' + drawn + ' drawn in this epoch, ' +
               Math.round(chars / 1024) + ' KB of path data';
      }




      function leaning() {
        var n = 0;
        var atoms = svg.querySelectorAll('.atom');
        for (var i = 0; i < atoms.length; i++) {
          var a = atoms[i];
          if (a.style.display === 'none') continue;
          var own = a.tagName === 'path' ? 1
            : a.querySelectorAll('path:not(.superseded)').length;
          if (!own && backingFor(a)) n++;
        }
        return n;
      }

      function backingFor(atom) {
        var g = detached || svg.querySelector('#backings');
        return g && g.querySelector('[data-for="' + atom.id.replace(/^a-/, '') + '"]');
      }

      function apply(on) {
        var live = svg.querySelector('#backings');
        var lean = leaning();
        if (!on && live) {
          live.parentNode.insertBefore(anchor, live);
          detached = live.parentNode.removeChild(live);
        } else if (on && detached && anchor.parentNode) {
          anchor.parentNode.insertBefore(detached, anchor);
          anchor.parentNode.removeChild(anchor);
          detached = null;
        }
        out.textContent = measure() + (on ? '\n' + lean +
          ' drawn territories have no shape but this one' :
          '\ndetached — ' + lean + ' territories went with them; turn ' +
          'Administrative on and they are drawn from their provinces instead');
        setting('backings', on);
      }



      var booted = false;
      box.addEventListener('change', function () {
        apply(box.checked);
        if (booted) window.location.reload();
      });
      var want = setting('backings');
      box.checked = want !== false;
      apply(box.checked);
      booted = true;
      if (!group) { box.disabled = true; out.textContent = 'no #backings in this map'; }
    },
  });



  TOOLS.push({
    title: 'Land stroke',
    hint: 'Every shape on the map is painted fill <b>and</b> stroke in its own ' +
          'colour — a 1.3px line that does not scale with the zoom — because ' +
          'two neighbours simplified out of different files no longer share an ' +
          'edge, and the sea shows through the hairline between them. It is ' +
          'also about six sevenths of what the browser rasters: profiling put ' +
          'the land’s fills at two percentage points of a frame and its strokes ' +
          'at 85. Off, the cracks open and the coast thins by half a pixel. ' +
          'The reader\u2019s version of this \u2014 a per-shape hairline, off by ' +
          'default \u2014 is no longer in Layers, though <code>state.hairline<\/code> and ' +
          'bit 10 of the layer code still work. ' +
          'This one is blunter and is for measuring: it carries <code>!important<\/code>, ' +
          'so it also takes off the strokes the map draws deliberately, the province ' +
          'divisions under the pointer and the outlines round the Communist base ' +
          'areas among them. It is the floor, not an option.',
    build: function (sec) {
      var style = null;

      var box = switchRow(sec, '<input type="checkbox" checked> Draw the 1.3px stroke');

      var out = readout(sec);



      function census() {
        var sel = '#land .atom, #land .atom path, #backings path, #land path.coast';
        var els = svg.querySelectorAll(sel);
        var paths = 0, verts = 0;
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (el.tagName !== 'path') continue;
          var d = el.getAttribute('d');
          if (!d) continue;


          if (el.parentNode && el.parentNode.classList &&
              el.parentNode.classList.contains('atom') &&
              el.parentNode.getAttribute('d')) continue;
          paths++;
          verts += (d.match(/[MLlm]/g) || []).length;
        }
        return paths + ' paths, ' + verts.toLocaleString() + ' vertices stroked';
      }

      function apply(on) {
        if (!on) {
          if (!style) {
            style = document.createElement('style');
            style.id = 'jmap-admin-nostroke';
            document.head.appendChild(style);
          }
          style.textContent =
            '#land .atom, #land .atom path, #backings path, #land path.coast' +
            '{stroke:none !important}';
        } else if (style) {
          style.parentNode.removeChild(style);
          style = null;
        }
        out.textContent = census() + (on ? '\n' +
          'drawn — the cracks between neighbours are closed by it' :
          '\nnot drawn — fills only. Pan and zoom and compare; look at the ' +
          'Yalu, the Malay states and any province boundary for the cracks ' +
          'this was closing');
        setting('landstroke', on);
      }

      box.addEventListener('change', function () { apply(box.checked); });
      var want = setting('landstroke');
      box.checked = want !== false;
      apply(box.checked);
    },
  });



  TOOLS.push({
    title: 'China filler',
    hint: 'Two paths in the neutral “elsewhere” grey, laid under everything. ' +
          '<b>chinabase</b> was Natural Earth\u2019s outline of China, put there so ' +
          'that where it and the Republican provinces put a land frontier a ' +
          'kilometre apart the gap read as a seam and not as sea. That job is ' +
          'over: <code>NE_CHINA_MAINLAND<\/code> is off and the mainland ring is not in ' +
          'the layer at all. What is left is coastal — a few dozen island ' +
          'rings, of which most are covered by the provinces and a handful are ' +
          'not. <b>chinabase_land</b> is a different thing and is not in question: ' +
          'three boxes of ground no source on this map covers, the Karakoram ' +
          'and Aksai Chin among them. ' +
          'Switch each off and pan the coast: what disappears is what the layer ' +
          'is still doing. Shijiutuo, in the Gulf of Chihli at 118.6 E 39.0 N, ' +
          'is the one to look at — it is on this map only because of the ' +
          'filler, and the filler draws it in nobody\u2019s colour and will not ' +
          'answer when it is pointed at.',
    build: function (sec) {
      var rows = [
        { id: 'chinabase', label: 'Draw chinabase (the coastal filler)', key: 'chinabase' },
        { id: 'chinabase_land', label: 'Draw chinabase_land (the interior boxes)', key: 'chinabaseland' },
      ];
      var out = document.createElement('div');
      out.className = 'readout';

      function census() {
        var lines = [];
        rows.forEach(function (r) {
          var el = svg.querySelector('#' + r.id);
          if (!el) { lines.push(r.id + ': not in this map'); return; }
          var d = el.getAttribute('d') || '';
          var rings = (d.match(/M/g) || []).length;
          lines.push(r.id + ': ' + rings + ' rings, ' +
                     (d.match(/[MLlm]/g) || []).length.toLocaleString() + ' points, ' +
                     (el.style.display === 'none' ? 'hidden' : 'drawn'));
        });
        return lines.join('\n');
      }

      rows.forEach(function (r) {
        var wrap = document.createElement('label');
        wrap.className = 'sw';
        wrap.innerHTML = '<input type="checkbox" checked> ' + r.label;
        var box = $('input', wrap);
        sec.appendChild(wrap);

        function apply(on) {
          var el = svg.querySelector('#' + r.id);
          if (el) el.style.display = on ? '' : 'none';
          if (!el) box.disabled = true;
          out.textContent = census();
          setting(r.key, on);
        }
        box.addEventListener('change', function () { apply(box.checked); });
        var want = setting(r.key);
        box.checked = want !== false;
        apply(box.checked);
      });

      sec.appendChild(out);
      out.textContent = census();
    },
  });



  var drawingOn = false;




  var editingExtent = false;
  function drawing() { return drawingOn || editingExtent; }

  TOOLS.push({
    title: 'Draw polygon',
    hint: 'Tap to drop a point; drag to pan as usual. The ring is closed for ' +
          'you. It is drawn in the map’s own coordinates, so it stays put ' +
          'while you zoom, and it goes when you switch the tool off.',
    build: function (sec, api) {
      var pts = [];                       // [{lon, lat, x, y}]
      var layer = null, fill = null, dots = null;

      var btn = buttonRow(sec);
      var toggleBtn = btn('Draw polygon', function () { setOn(!drawingOn); });
      var undoBtn = btn('Undo point', function () { pts.pop(); redraw(); });
      var clearBtn = btn('Clear', function () { pts = []; redraw(); });

      var btn2 = buttonRow(sec);
      btn2('Copy lon,lat', function (b) { api.copy(asList(), b); });
      btn2('Copy GeoJSON', function (b) { api.copy(asGeoJSON(), b); });

      var out = readout(sec);

      var ta = textarea(sec);

      function asList() {
        return pts.map(function (p) {
          return '[' + p.lon.toFixed(5) + ', ' + p.lat.toFixed(5) + ']';
        }).join(',\n');
      }

      function asGeoJSON() {
        var ring = pts.map(function (p) { return [+p.lon.toFixed(5), +p.lat.toFixed(5)]; });
        if (ring.length > 2) ring.push(ring[0].slice());
        return JSON.stringify({
          type: 'Feature', properties: {},
          geometry: { type: 'Polygon', coordinates: [ring] },
        }, null, 1);
      }



      function areaKm2() {
        if (pts.length < 3) return 0;
        var a = 0;
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i], q = pts[(i + 1) % pts.length];
          a += p.lon * q.lat - q.lon * p.lat;
        }
        var lat = pts.reduce(function (s, p) { return s + p.lat; }, 0) / pts.length;
        return Math.abs(a / 2) * 111.32 * 111.32 * Math.cos(lat * Math.PI / 180);
      }

      function ensureLayer() {
        if (layer) return;
        layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.setAttribute('id', 'jmap-draw');
        layer.setAttribute('pointer-events', 'none');
        fill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fill.setAttribute('class', 'edge');
        dots = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.appendChild(fill);
        layer.appendChild(dots);
        api.svg.appendChild(layer);
      }

      function redraw() {
        ensureLayer();
        var d = pts.map(function (p, i) {
          return (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2);
        }).join('');
        fill.setAttribute('d', pts.length > 2 ? d + 'Z' : d);
        var r = api.unitsPerPixel() * 3.5;
        dots.textContent = '';
        pts.forEach(function (p, i) {
          var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('class', i ? 'vtx' : 'vtx first');
          c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', r);
          dots.appendChild(c);
        });
        out.textContent = pts.length + ' point' + (pts.length === 1 ? '' : 's') +
          (pts.length > 2 ? ' · about ' + Math.round(areaKm2()).toLocaleString() + ' km²' : '');
        ta.value = asList();
        undoBtn.disabled = !pts.length;
        clearBtn.disabled = !pts.length;
      }




      var pending = false;
      var obs = new MutationObserver(function () {
        if (pending || !pts.length) return;
        pending = true;
        window.requestAnimationFrame(function () { pending = false; redraw(); });
      });

      function setOn(on) {
        drawingOn = on;
        toggleBtn.classList.toggle('on', on);
        document.body.classList.toggle('jmap-drawing', on);
        if (on) {
          obs.observe(api.svg, { attributes: true, attributeFilter: ['viewBox'] });
          redraw();
        } else {
          obs.disconnect();
          pts = [];
          if (layer) { layer.parentNode.removeChild(layer); layer = null; }
          out.textContent = '';
          ta.value = '';
        }
      }

      api.onTap(function (e) {
        if (!drawingOn) return true;
        var u = api.clientToUser(e.clientX, e.clientY);
        if (!u) return true;
        var ll = api.toLonLat(u.x, u.y);
        pts.push({ lon: ll.lon, lat: ll.lat, x: u.x, y: u.y });
        redraw();
        return false;                     // the map does not also select here
      });

      redraw();
      setOn(false);
    },
  });
























  var routingOn = false;

  TOOLS.push({
    title: 'Shipping routes',
    hint: 'Press <b>Add route</b> and the city dots come on. Tap a city to ' +
          'start, tap the next to run a leg to it. <b>Shift-click the line</b> ' +
          'to put a bend in it and drag the bend to place it; the course is ' +
          'drawn through the bends, so a leg can round a headland. ' +
          '<b>Add another stop</b> goes back to picking cities, ' +
          '<b>Finish line</b> puts the tool away and leaves the readout to copy.',
    build: function (sec, api) {





      var nodes = [];                  // {kind, id, name, lon, lat, x, y}
      var freq = '';
      var picking = true;              // a tap on a city adds a stop
      var layer = null, legs = null, grab = null, dots = null;
      var dragging = null, sel = -1;

      var row = document.createElement('div');
      row.className = 'row';
      sec.appendChild(row);
      function btn(label, fn, host) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', function () { fn(b); });
        (host || row).appendChild(b);
        return b;
      }
      var onBtn = btn('Add route', function () { setOn(!routingOn); });
      var moreBtn = btn('Add another stop', function () { setPicking(true); });
      var doneBtn = btn('Finish line', function () { finish(); });

      var row2 = document.createElement('div');
      row2.className = 'row';
      sec.appendChild(row2);
      var undoBtn = btn('Undo', function () { nodes.pop(); sel = -1; redraw(); }, row2);
      var clearBtn = btn('Clear', function () { nodes = []; sel = -1; redraw(); }, row2);
      var copyBtn = btn('Copy route', function (b) { api.copy(ta.value, b); }, row2);




      var row3 = document.createElement('div');
      row3.className = 'row';
      sec.appendChild(row3);
      var lab = document.createElement('label');
      lab.className = 'sw';
      lab.textContent = 'Frequency';
      row3.appendChild(lab);
      var freqEl = document.createElement('input');
      freqEl.type = 'text';
      freqEl.className = 'txt';
      freqEl.placeholder = 'weekly, 2 a month, …';
      freqEl.addEventListener('input', function () { freq = freqEl.value; write(); });
      row3.appendChild(freqEl);

      var out = readout(sec);

      var ta = document.createElement('textarea');
      ta.readOnly = true;
      ta.spellcheck = false;
      ta.style.height = '150px';
      sec.appendChild(ta);


























      var ALPHA = 0.5;
      function knot(a, b) {
        var d = Math.hypot(b.x - a.x, b.y - a.y);
        return Math.pow(d, ALPHA) || 1e-6;
      }
















      function gcPoints(a, b) {
        var d2r = Math.PI / 180;
        var la1 = a.lat * d2r, lo1 = a.lon * d2r;
        var la2 = b.lat * d2r, lo2 = b.lon * d2r;
        var v1 = [Math.cos(la1) * Math.cos(lo1), Math.cos(la1) * Math.sin(lo1), Math.sin(la1)];
        var v2 = [Math.cos(la2) * Math.cos(lo2), Math.cos(la2) * Math.sin(lo2), Math.sin(la2)];
        var dot = Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
        var w = Math.acos(dot);
        var out = [];
        var n = Math.max(2, Math.min(64, Math.ceil(w / d2r / 2)));



        if (!isFinite(w) || w < 1e-9 || Math.abs(Math.PI - w) < 1e-9) return out;
        var sw = Math.sin(w);
        for (var i = 1; i < n; i++) {
          var t = i / n;
          var s1 = Math.sin((1 - t) * w) / sw, s2 = Math.sin(t * w) / sw;
          var x = s1 * v1[0] + s2 * v2[0];
          var y = s1 * v1[1] + s2 * v2[1];
          var z = s1 * v1[2] + s2 * v2[2];
          var lat = Math.atan2(z, Math.hypot(x, y)) / d2r;
          var lon = Math.atan2(y, x) / d2r;
          var u = api.fromLonLat(lon, lat);
          out.push({ x: u.x, y: u.y });
        }
        return out;
      }




      function coursepoints() {
        var out = [];
        for (var i = 0; i < nodes.length; i++) {
          out.push({ x: nodes[i].x, y: nodes[i].y });
          if (i < nodes.length - 1) {
            var mid = gcPoints(nodes[i], nodes[i + 1]);
            for (var j = 0; j < mid.length; j++) out.push(mid[j]);
          }
        }
        return out;
      }

      function pathD() {
        if (nodes.length < 2) return '';
        var p = coursepoints(), n = p.length;
        var d = 'M' + p[0].x.toFixed(2) + ' ' + p[0].y.toFixed(2);
        for (var i = 0; i < n - 1; i++) {
          var p0 = p[i > 0 ? i - 1 : 0], p1 = p[i], p2 = p[i + 1];
          var p3 = p[i + 2 < n ? i + 2 : n - 1];
          var d1 = knot(p0, p1), d2 = knot(p1, p2), d3 = knot(p2, p3);
          var c1x, c1y, c2x, c2y;
          if (i === 0) {                       // clamped: leave along the span
            c1x = p1.x + (p2.x - p1.x) / 3;
            c1y = p1.y + (p2.y - p1.y) / 3;
          } else {
            var k1 = 3 * d1 * (d1 + d2);
            c1x = (d1 * d1 * p2.x - d2 * d2 * p0.x
                   + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1.x) / k1;
            c1y = (d1 * d1 * p2.y - d2 * d2 * p0.y
                   + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1.y) / k1;
          }
          if (i === n - 2) {                   // and arrive along it
            c2x = p2.x + (p1.x - p2.x) / 3;
            c2y = p2.y + (p1.y - p2.y) / 3;
          } else {
            var k2 = 3 * d3 * (d3 + d2);
            c2x = (d3 * d3 * p1.x - d2 * d2 * p3.x
                   + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2.x) / k2;
            c2y = (d3 * d3 * p1.y - d2 * d2 * p3.y
                   + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2.y) / k2;
          }
          d += 'C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2)
             + ' ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2)
             + ' ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
        }
        return d;
      }

      function ensureLayer() {
        if (layer) return;
        var NS = 'http://www.w3.org/2000/svg';
        layer = document.createElementNS(NS, 'g');
        layer.setAttribute('id', 'jmap-route');
        legs = document.createElementNS(NS, 'path');
        legs.setAttribute('class', 'leg');
        legs.setAttribute('pointer-events', 'none');




        grab = document.createElementNS(NS, 'path');
        grab.setAttribute('class', 'grab');
        dots = document.createElementNS(NS, 'g');
        layer.appendChild(grab);
        layer.appendChild(legs);
        layer.appendChild(dots);
        api.svg.appendChild(layer);
      }

      function redraw() {
        ensureLayer();
        var d = pathD();
        legs.setAttribute('d', d);
        grab.setAttribute('d', d);
        var r = api.unitsPerPixel() * 4;
        dots.textContent = '';
        nodes.forEach(function (p, i) {
          var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('class', p.kind === 'bend'
            ? 'bend' + (i === sel ? ' sel' : '')
            : 'stop' + (i === 0 ? ' first' : ''));
          c.setAttribute('cx', p.x);
          c.setAttribute('cy', p.y);
          c.setAttribute('r', p.kind === 'bend' ? r * 0.8 : r);
          c.setAttribute('data-i', i);
          dots.appendChild(c);
        });
        say();
        write();
        var any = nodes.length > 0;
        undoBtn.disabled = !any;
        clearBtn.disabled = !any;
        copyBtn.disabled = !any;
      }

      function stops() {
        return nodes.filter(function (p) { return p.kind === 'stop'; });
      }

      function say() {
        if (!routingOn && !nodes.length) { out.textContent = ''; return; }
        var st = stops().length;
        var bd = nodes.length - st;
        out.textContent = st + ' stop' + (st === 1 ? '' : 's')
          + ', ' + bd + ' bend' + (bd === 1 ? '' : 's')
          + (routingOn
             ? ' · ' + (picking ? 'tap a city for the next stop'
                                : 'shift-click the line to bend it')
             : ' · finished');
      }







      function asJSON() {
        var st = stops();
        var legsOut = [], cur = null;
        nodes.forEach(function (p) {
          if (p.kind === 'stop') {
            if (cur) { cur.to = p.id; legsOut.push(cur); }
            cur = { from: p.id, to: null, bends: [] };
          } else if (cur) {
            cur.bends.push([+p.lon.toFixed(5), +p.lat.toFixed(5)]);
          }
        });
        return JSON.stringify({
          frequency: freq,
          epoch: epochNow(),
          stops: st.map(function (p) { return p.id; }),
          names: st.map(function (p) { return p.name; }),
          legs: legsOut,
          course: nodes.map(function (p) {
            return [+p.lon.toFixed(5), +p.lat.toFixed(5)];
          }),
        }, null, 1);
      }

      function write() { ta.value = nodes.length ? asJSON() : ''; }



      function epochNow() {
        var on = document.querySelector('#epoch-seg button.on');
        return (on && on.getAttribute('data-epoch')) || '';
      }




      var citiesWere = null;
      function cities(on) {
        var b = document.querySelector('[data-cat="city"]');
        if (!b) return;
        var isOn = b.getAttribute('aria-pressed') === 'true';
        if (on && !isOn) { citiesWere = false; b.click(); }
        else if (!on && citiesWere === false) { if (isOn) b.click(); citiesWere = null; }
      }














      function cityAt(cx, cy) {
        var stack = document.elementsFromPoint
          ? document.elementsFromPoint(cx, cy)
          : [document.elementFromPoint(cx, cy)];
        for (var i = 0; i < stack.length; i++) {
          var el = stack[i];
          if (!el || !el.closest) continue;
          var g = el.closest('#gaz g[data-id], #markers g.site[data-cat="city"]');
          if (!g) continue;
          var got = cityOf(g);
          if (got) return got;
        }
        return null;
      }

      function cityOf(g) {
        var raw = g.getAttribute('data-id') || '';
        var m = /^g_(e\d+)_(.+)$/.exec(raw);
        var id = m ? m[2] : raw;
        var rec = null;
        if (m && window.JMAP && JMAP.GAZ && JMAP.GAZ[m[1]]) {
          var list = JMAP.GAZ[m[1]];
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) { rec = list[i]; break; }
          }
        } else if (window.JMAP && JMAP.SITES) {
          for (var j = 0; j < JMAP.SITES.length; j++) {
            if (JMAP.SITES[j].id === id) { rec = JMAP.SITES[j]; break; }
          }
        }




        var box = g.getBoundingClientRect();
        var u = api.clientToUser(box.left + box.width / 2, box.top + box.height / 2);
        if (!u) return null;
        var ll = api.toLonLat(u.x, u.y);
        return { kind: 'stop', id: id,
                 name: (rec && (rec.n || rec.en)) || id,
                 lon: (rec && isFinite(rec.lon)) ? rec.lon : ll.lon,
                 lat: (rec && isFinite(rec.lat)) ? rec.lat : ll.lat,
                 x: u.x, y: u.y };
      }








      function spanAt(u) {
        var best = -1, bestD = Infinity;
        for (var i = 0; i < nodes.length - 1; i++) {
          var a = nodes[i], b = nodes[i + 1];
          var dx = b.x - a.x, dy = b.y - a.y;
          var L2 = dx * dx + dy * dy || 1;
          var t = ((u.x - a.x) * dx + (u.y - a.y) * dy) / L2;
          t = Math.max(0, Math.min(1, t));
          var px = a.x + dx * t - u.x, py = a.y + dy * t - u.y;
          var d = px * px + py * py;
          if (d < bestD) { bestD = d; best = i; }
        }
        return best;
      }

      function addBend(u) {
        if (nodes.length < 2) return false;
        var i = spanAt(u);
        if (i < 0) return false;
        var ll = api.toLonLat(u.x, u.y);
        nodes.splice(i + 1, 0,
          { kind: 'bend', id: null, name: '', lon: ll.lon, lat: ll.lat, x: u.x, y: u.y });
        sel = i + 1;
        setPicking(false);
        redraw();
        return true;
      }



      function onDown(e) {
        if (!routingOn) return;
        var t = e.target;
        if (!t || !t.classList || !t.classList.contains('bend')) return;
        e.stopPropagation();
        e.preventDefault();
        sel = +t.getAttribute('data-i');
        dragging = { i: sel, el: t };
        try { t.setPointerCapture(e.pointerId); } catch (err) { /* older engine */ }
      }

      function onMove(e) {
        if (!dragging) return;
        e.stopPropagation();
        e.preventDefault();
        var u = api.clientToUser(e.clientX, e.clientY);
        if (!u) return;
        var p = nodes[dragging.i];
        if (!p) return;
        var ll = api.toLonLat(u.x, u.y);
        p.x = u.x; p.y = u.y; p.lon = ll.lon; p.lat = ll.lat;
        dragging.el.setAttribute('cx', u.x);
        dragging.el.setAttribute('cy', u.y);




        var d = pathD();
        legs.setAttribute('d', d);
        grab.setAttribute('d', d);
        out.textContent = 'bend → ' + ll.lon.toFixed(4) + ', ' + ll.lat.toFixed(4);
      }

      function onUp() {
        if (!dragging) return;
        dragging = null;
        redraw();
      }


      api.onShift(function () { return routingOn; });

      api.onTap(function (e) {
        if (!routingOn) return true;
        var u = api.clientToUser(e.clientX, e.clientY);
        if (!u) return true;



        if (e.shiftKey) return addBend(u) ? false : true;
        if (!picking) return true;
        var c = cityAt(e.clientX, e.clientY);
        if (!c) return true;
        var last = stops()[stops().length - 1];
        if (last && last.id === c.id) return false;   // the same port twice is not a leg
        nodes.push(c);
        sel = -1;




        if (stops().length > 1) setPicking(false);
        redraw();
        return false;
      });

      function setPicking(on) {
        picking = on;
        moreBtn.classList.toggle('on', on);
        say();
      }

      function finish() {
        if (!routingOn) return;
        setOn(false, true);
      }



      var pending = false;
      var obs = new MutationObserver(function () {
        if (pending || !nodes.length || !routingOn) return;
        pending = true;
        window.requestAnimationFrame(function () { pending = false; redraw(); });
      });

      function setOn(on, keep) {
        routingOn = on;
        onBtn.classList.toggle('on', on);
        onBtn.textContent = on ? 'Routing…' : 'Add route';
        moreBtn.disabled = !on;
        doneBtn.disabled = !on;
        document.body.classList.toggle('jmap-drawing', on);
        if (on) {
          cities(true);
          setPicking(true);
          obs.observe(api.svg, { attributes: true, attributeFilter: ['viewBox'] });
          api.svg.addEventListener('pointerdown', onDown, true);
          window.addEventListener('pointermove', onMove, true);
          window.addEventListener('pointerup', onUp, true);
          redraw();
          return;
        }
        obs.disconnect();
        api.svg.removeEventListener('pointerdown', onDown, true);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);
        cities(false);
        dragging = null;




        if (keep) { say(); return; }
        nodes = [];
        sel = -1;
        if (layer) { layer.parentNode.removeChild(layer); layer = null; }
        out.textContent = '';
        ta.value = '';
      }

      redraw();
      setOn(false);
    },
  });


















  TOOLS.push({
    title: 'Edit the 1942 extent',
    hint: 'Switch it on and every vertex of the line of control in view gets ' +
          'a handle. Drag one to move it. The map still pans from anywhere ' +
          'else. Press a handle to pick it out, then <b>Backspace</b> takes ' +
          'that vertex out of the line altogether — the next one along is ' +
          'picked up, so a run can be cut by holding the key. A removed ' +
          'vertex stays on the map as a dashed red ring; press it to put it ' +
          'back. What comes out is a list of moves — <i>from</i> a ' +
          'coordinate, <i>to</i> a coordinate — and a list of removals, to ' +
          'hand back for the build. Work in <b>Web Mercator</b>: the line is ' +
          'stored in that space and a vertex dragged in another one means ' +
          'nothing to the source. Edits survive a reload; <b>Reset</b> ' +
          'clears them.',
    build: function (sec, api) {
      var EDIT_KEY = 'extent-edits';
      var on = false, layer = null, dots = null;
      var base = null;            // the vertices as built, in map units
      var moves = {};             // index -> {x, y} in map units, where it now is
      var drops = {};             // index -> 1, vertices taken out of the line
      var dragging = null;
      var sel = null;             // the vertex Backspace would take out
      var hist = [];              // what each edit replaced, newest last

      try {
        var saved = api.setting(EDIT_KEY);
        if (saved && typeof saved === 'object') {

          if (saved.moves || saved.drops) {
            moves = saved.moves || {};
            drops = saved.drops || {};
          } else { moves = saved; }
        }
      } catch (err) { moves = {}; drops = {}; }







      Object.keys(moves).forEach(function (i) { hist.push({ i: +i }); });
      Object.keys(drops).forEach(function (i) { hist.push({ i: +i }); });


      function note(i) {
        hist.push({ i: i, move: moves[i], drop: drops[i] });
      }

      var btn = buttonRow(sec);
      var toggleBtn = btn('Edit extent', function () { setOn(!on); });
      var undoBtn = btn('Undo', function () {
        var h = hist.pop();
        if (!h) return;
        if (h.move) moves[h.i] = h.move; else delete moves[h.i];
        if (h.drop) drops[h.i] = h.drop; else delete drops[h.i];
        sel = h.i;
        save(); redraw();
      });
      var resetBtn = btn('Reset', function () {
        if (!edits()) return;
        if (!window.confirm('Throw away every edit?')) return;
        moves = {}; drops = {}; hist = []; sel = null; save(); redraw();
      });

      function edits() {
        return Object.keys(moves).length + Object.keys(drops).length;
      }

      var btn2 = buttonRow(sec);
      btn2('Copy the moves', function (b) { api.copy(asMoves(), b); });
      btn2('Copy the whole line', function (b) { api.copy(asWholeLine(), b); });

      var out = readout(sec);

      var ta = textarea(sec);

      function save() {
        try {
          api.setting(EDIT_KEY, { moves: moves, drops: drops });
        } catch (err) { /* private mode */ }
      }

      function mercator() {
        var m = api.svg && api.svg.querySelector('#proj');

        return !api.svg.classList.contains('proj-albers')
            && !api.svg.classList.contains('proj-laea')
            && !!m;
      }

      function pathEl() { return api.svg && api.svg.querySelector('#extent-1942'); }





      function readBase() {
        var el = pathEl();
        if (!el) return null;
        var d = el.__d0 || el.getAttribute('d') || '';
        var nums = d.match(/-?\d+\.?\d*/g);
        if (!nums || nums.length < 4) return null;
        var pts = [];
        for (var i = 0; i + 1 < nums.length; i += 2) {
          pts.push({ x: +nums[i], y: +nums[i + 1] });
        }
        return pts;
      }

      function at(i) {
        var m = moves[i];
        return m ? { x: m.x, y: m.y } : { x: base[i].x, y: base[i].y };
      }

      function asMoves() {
        var keys = Object.keys(moves).map(Number).sort(function (a, b) { return a - b; });
        var gone = Object.keys(drops).map(Number).sort(function (a, b) { return a - b; });
        if (!keys.length && !gone.length) return '# nothing edited yet';




        if (!base) base = readBase();
        if (!base) return '# ' + (keys.length + gone.length) + ' edit(s) held — ' +
                          'switch the tool on, on the Dec 1942 map, to read ' +
                          'them out';
        var lines = ['# extent edits — from, to, in lon/lat',
                     '# vertex index is into the built #extent-1942 path',
                     'EXTENT_EDITS = ['];
        if (!keys.length) lines.pop();
        keys.forEach(function (i) {
          var a = api.toLonLat(base[i].x, base[i].y);
          var b = api.toLonLat(moves[i].x, moves[i].y);
          lines.push('    # ' + i + ': ' + a.lon.toFixed(5) + ',' + a.lat.toFixed(5) +
                     '  ->  ' + b.lon.toFixed(5) + ',' + b.lat.toFixed(5));
          lines.push('    ((' + a.lon.toFixed(5) + ', ' + a.lat.toFixed(5) + '), (' +
                     b.lon.toFixed(5) + ', ' + b.lat.toFixed(5) + ')),');
        });
        lines.push(']');
        if (gone.length) {
          lines.push('');
          lines.push('# vertices to take out of the line altogether');
          lines.push('EXTENT_DROPS = [');
          gone.forEach(function (i) {
            var c = api.toLonLat(base[i].x, base[i].y);
            lines.push('    # ' + i);
            lines.push('    (' + c.lon.toFixed(5) + ', ' + c.lat.toFixed(5) + '),');
          });
          lines.push(']');
        }
        return lines.join('\n');
      }

      function asWholeLine() {
        if (!base) base = readBase();
        if (!base) return '# no extent on the map — switch to Dec 1942';
        var lines = ['# the whole line as it now stands, lon/lat'];
        for (var i = 0; i < base.length; i++) {
          if (drops[i]) continue;
          var p = at(i), ll = api.toLonLat(p.x, p.y);
          lines.push('    (' + ll.lon.toFixed(5) + ', ' + ll.lat.toFixed(5) + '),');
        }
        return lines.join('\n');
      }

      function ensureLayer() {
        if (layer) return;
        layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.setAttribute('id', 'jmap-extent-edit');
        dots = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.appendChild(dots);
        api.svg.appendChild(layer);
      }



      function viewBox() {
        var vb = (api.svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
        return vb.length === 4 ? vb : null;
      }

      function ghostD() {
        var d = '', first = true;
        for (var k = 0; k < base.length; k++) {
          if (drops[k]) continue;         // gone from the line, so gone from it here
          var q = at(k);
          d += (first ? 'M' : 'L') + q.x.toFixed(2) + ' ' + q.y.toFixed(2);
          first = false;
        }
        return d;
      }

      function redraw() {
        if (!on) return;
        ensureLayer();
        if (!base) base = readBase();
        dots.textContent = '';
        var live = pathEl();
        if (live) {

          var d = ghostD();
          var ghost = layer.querySelector('.edited');
          if (!ghost) {
            ghost = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            ghost.setAttribute('class', 'edited');
            layer.insertBefore(ghost, dots);
          }
          ghost.setAttribute('d', d);
        }
        var vb = viewBox();
        var r = api.unitsPerPixel() * 4.5;
        var shown = 0;
        for (var i = 0; i < base.length; i++) {
          var p = at(i);
          if (vb && (p.x < vb[0] - r || p.x > vb[0] + vb[2] + r ||
                     p.y < vb[1] - r || p.y > vb[1] + vb[3] + r)) continue;
          var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('class', 'vtx' + (drops[i] ? ' gone' : moves[i] ? ' moved' : '') +
                                  (i === sel ? ' sel' : ''));
          c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
          c.setAttribute('r', drops[i] ? r * 0.8 : r);
          c.setAttribute('data-i', i);
          dots.appendChild(c);
          shown++;
          if (shown > 400) break;         // a crowded view is a zoom-in cue
        }
        var n = Object.keys(moves).length, g = Object.keys(drops).length;
        out.textContent = shown + ' handle' + (shown === 1 ? '' : 's') + ' in view · ' +
          n + ' moved' + (g ? ' · ' + g + ' taken out' : '') +
          (sel === null ? '' : ' · vertex ' + sel + ' picked — Backspace removes it') +
          (mercator() ? '' : ' · SWITCH TO WEB MERCATOR');
        ta.value = asMoves();
        undoBtn.disabled = !hist.length;
        resetBtn.disabled = !edits();
      }




      function onDown(e) {
        if (!on) return;
        var t = e.target;
        if (!t || !t.getAttribute || t.getAttribute('data-i') === null) return;
        e.stopPropagation();
        e.preventDefault();
        var i = +t.getAttribute('data-i');


        if (drops[i]) {
          note(i);
          delete drops[i];
          sel = i;
          save();
          redraw();
          return;
        }
        sel = i;
        markSel(t);
        dragging = { i: i, el: t, was: { move: moves[i], drop: drops[i] }, noted: false };
        try { t.setPointerCapture(e.pointerId); } catch (err) { /* older engine */ }
      }



      function markSel(el) {
        var prev = dots && dots.querySelector('.vtx.sel');
        if (prev) prev.classList.remove('sel');
        if (el) el.classList.add('sel');
      }

      function onMove(e) {
        if (!dragging) return;
        e.stopPropagation();
        e.preventDefault();
        var u = api.clientToUser(e.clientX, e.clientY);
        if (!u) return;
        if (!dragging.noted) {          // one history entry per drag, not per step
          hist.push({ i: dragging.i, move: dragging.was.move, drop: dragging.was.drop });
          dragging.noted = true;
        }
        moves[dragging.i] = { x: u.x, y: u.y };
        dragging.el.setAttribute('cx', u.x);
        dragging.el.setAttribute('cy', u.y);
        dragging.el.setAttribute('class', 'vtx moved sel');
        var ll = api.toLonLat(u.x, u.y);
        out.textContent = 'vertex ' + dragging.i + ' → ' +
          ll.lon.toFixed(4) + ', ' + ll.lat.toFixed(4);
        var ghost = layer && layer.querySelector('.edited');
        if (ghost) ghost.setAttribute('d', ghostD());
      }



      function nextLive(i) {
        var j;
        for (j = i + 1; j < base.length; j++) if (!drops[j]) return j;
        for (j = i - 1; j >= 0; j--) if (!drops[j]) return j;
        return null;
      }

      function onKey(e) {
        if (!on || sel === null) return;
        if (e.key !== 'Backspace' && e.key !== 'Delete') return;


        var t = e.target, n = t && t.tagName ? String(t.tagName).toLowerCase() : '';
        if (t && t.isContentEditable) return;
        if ((n === 'input' || n === 'textarea') && !t.readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        if (drops[sel]) return;
        note(sel);
        drops[sel] = 1;
        delete moves[sel];
        sel = nextLive(sel);
        save();
        redraw();
      }
      function onUp(e) {
        if (!dragging) return;
        e.stopPropagation();
        dragging = null;
        save();
        redraw();
      }

      var pending = false;
      var obs = new MutationObserver(function () {
        if (pending || !on) return;
        pending = true;
        window.requestAnimationFrame(function () { pending = false; redraw(); });
      });

      function setOn(v) {
        on = v;
        editingExtent = v;
        toggleBtn.classList.toggle('on', on);
        if (on) {
          base = readBase();
          if (!base) {
            out.textContent = 'No 1942 extent on the map — switch to Dec 1942 ' +
                              'and put the line of control on.';
            on = false;
            editingExtent = false;
            toggleBtn.classList.remove('on');
            return;
          }
          api.svg.addEventListener('pointerdown', onDown, true);
          window.addEventListener('pointermove', onMove, true);
          window.addEventListener('pointerup', onUp, true);
          window.addEventListener('keydown', onKey, true);
          obs.observe(api.svg, { attributes: true, attributeFilter: ['viewBox'] });
          redraw();
        } else {
          api.svg.removeEventListener('pointerdown', onDown, true);
          window.removeEventListener('pointermove', onMove, true);
          window.removeEventListener('pointerup', onUp, true);
          window.removeEventListener('keydown', onKey, true);
          sel = null;
          obs.disconnect();
          if (layer) { layer.parentNode.removeChild(layer); layer = null; dots = null; }
          out.textContent = edits()
            ? edits() + ' edit(s) kept — switch on again to go on'
            : '';
        }
      }

      ta.value = asMoves();
      setOn(false);
    },
  });



  TOOLS.push({
    title: 'Isolate or remove a shape',
    hint: 'Option-click any shape on the map and everything else goes away, so ' +
          'that one polygon can be looked at on its own — its coastline, its ' +
          'holes, the islands it does or does not carry. Option-click another ' +
          'shape to move to it, option-click the sea to bring the map back, or ' +
          'press <b>Escape</b>. <b>Control-click</b> does the opposite: it takes ' +
          'the shape under the pointer away and leaves the rest, which is how to ' +
          'find out what is underneath something — control-click again to take ' +
          'the next layer off. Nothing is deleted and nothing is redrawn: shapes ' +
          'are hidden and put back exactly as they were, so an atom that this ' +
          'epoch was already hiding stays hidden when you finish.',
    build: function (sec) {


      var KEEP_ID = { ocean: 1, proj: 1 };
      var KEEP_TAG = { defs: 1, metadata: 1, title: 1, style: 1 };


      var LAYERS = ['#land', '#backings', '#seams'];

      var stack = [];               // [element, the display it had]
      var solo = null;
      var removed = 0;              // how many of the stack were taken away



      var out = readout(sec);

      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'wide';
      back.textContent = 'Show everything again';
      back.addEventListener('click', function () { restore(); });
      sec.appendChild(back);

      function restore() {
        for (var i = stack.length - 1; i >= 0; i--) {
          stack[i][0].style.display = stack[i][1];
        }
        stack = [];
        solo = null;
        removed = 0;
        report();
      }

      function hide(el) {
        stack.push([el, el.style.display]);
        el.style.display = 'none';
      }

      function isolate(el) {
        restore();
        solo = el;
        for (var n = el; n && n !== svg && n.parentNode; n = n.parentNode) {
          var sibs = n.parentNode.children;
          for (var i = 0; i < sibs.length; i++) {
            var s = sibs[i];
            if (s === n) continue;
            if (s.id && KEEP_ID[s.id]) continue;
            if (KEEP_TAG[String(s.tagName).toLowerCase()]) continue;


            if (s.style.display === 'none') continue;
            hide(s);
          }
        }
        report();
      }




      function remove(el) {
        if (!el || el.style.display === 'none') return;
        hide(el);
        removed++;
        report(el);
      }

      function describe(el) {
        if (!el) return '';
        var bits = [el.tagName.toLowerCase()];
        var atom = el.closest ? el.closest('[id^="a-"]') : null;
        if (el.id) bits.push('#' + el.id);
        var prov = el.getAttribute('data-prov');
        var forWhat = el.getAttribute('data-for') || el.getAttribute('data-edge-for');
        if (prov) bits.push('“' + prov + '”');
        if (forWhat) bits.push('for ' + forWhat);
        if (atom && atom !== el) bits.push('in ' + atom.id);
        var cls = el.getAttribute('class');
        if (cls) bits.push('.' + cls.split(/\s+/).join('.'));
        var d = el.getAttribute('d') || '';
        if (d) {
          var subs = d.split('M').length - 1;
          var pts = (d.match(/-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g) || []).length;
          bits.push(subs + (subs === 1 ? ' ring' : ' rings'));
          bits.push(pts + ' points');
          bits.push(Math.round(d.length / 1024 * 10) / 10 + ' KB');
        }
        return bits.join(', ');
      }

      function report(justRemoved) {
        if (justRemoved) {
          out.textContent = 'Removed ' + describe(justRemoved) +
            ' — ' + removed + (removed === 1 ? ' shape' : ' shapes') + ' taken away';
        } else if (solo) {
          out.textContent = 'Showing ' + describe(solo) +
            ' — ' + stack.length + ' elements hidden';
        } else {
          out.textContent = 'Option-click a shape to isolate it, ' +
                            'control-click to take it away.';
        }
        back.disabled = !stack.length;
      }



      function shapeAt(x, y) {
        var els = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (!svg.contains(el) || el === svg) continue;
          if (el.id === 'ocean') return null;
          for (var k = 0; k < LAYERS.length; k++) {
            if (el.closest && el.closest(LAYERS[k])) return el;
          }
        }
        return null;
      }





      var lastCtrl = 0;
      function ctrlClick(x, y) {
        var now = new Date().getTime();
        if (now - lastCtrl < 400) return;
        lastCtrl = now;
        remove(shapeAt(x, y));
      }

      api.onTap(function (e) {
        if (e.ctrlKey) { ctrlClick(e.clientX, e.clientY); return false; }
        if (!e.altKey) return true;
        var el = shapeAt(e.clientX, e.clientY);
        if (el) isolate(el);
        else restore();
        return false;                     // the map does not also select here
      });

      container.addEventListener('contextmenu', function (e) {
        if (!e.ctrlKey) return;
        e.preventDefault();
        ctrlClick(e.clientX, e.clientY);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && stack.length) { restore(); e.stopPropagation(); }
      });

      report();
    },
  });



  window.JMAP_ADMIN = { open: open, close: close, toggle: toggle, tools: TOOLS };
  open();
}());
