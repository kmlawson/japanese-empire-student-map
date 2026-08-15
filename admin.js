/* The admin panel — tools for working on the map, not for reading it.
 *
 * Nothing here is fetched by a reader. `map.js` loads this file when someone
 * option-clicks (alt-clicks) Layers, and remembers in localStorage that the
 * panel was open so that a reload comes back with it and with whatever it was
 * set to — which is the point of the backings switch, below.
 *
 * It asks `map.js` for as little as possible: the projection is read off the
 * `#proj` element in the SVG, screen coordinates come from the SVG's own CTM,
 * and taps arrive through one optional hook (`window.JMAP_TAP`). So this file
 * can be edited, broken or deleted without the map noticing.
 *
 * To add a tool, push another object onto TOOLS. Each one gets a titled
 * section in the panel and is handed the same small api.
 */
(function () {
  'use strict';

  var OPEN_KEY = 'jmap-admin';        // panel was open; reload should reopen it
  var SET_KEY = 'jmap-admin-settings';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

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

  /* ---- the projection, read off the map rather than passed in ---- */

  var meta = svg.querySelector('#proj');
  var P = {
    lonMin: parseFloat(meta.getAttribute('data-lon-min')),
    latMax: parseFloat(meta.getAttribute('data-lat-max')),
    pxPerDeg: parseFloat(meta.getAttribute('data-px-per-deg')),
    R: parseFloat(meta.getAttribute('data-r')),
  };
  P.yTop = P.R * Math.log(Math.tan(Math.PI / 4 + P.latMax * Math.PI / 360));

  function toLonLat(x, y) {
    return {
      lon: P.lonMin + x / P.pxPerDeg,
      lat: (Math.atan(Math.exp((P.yTop - y) / P.R)) - Math.PI / 4) * 360 / Math.PI,
    };
  }

  function clientToUser(cx, cy) {
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    var pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    return pt.matrixTransform(ctm.inverse());
  }

  /* One CSS pixel in user units, so a mark drawn in the map's own coordinates
     can be given a size in screen terms. */
  function unitsPerPixel() {
    var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    var w = svg.getBoundingClientRect().width || 1;
    return (vb[2] || w) / w;
  }

  /* ---- the shell ---- */

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
    // 16% orange over the pale blue sea blends to a neutral grey and stops
    // reading as a drawing at all, so the tint is stronger than it looks here
    '#jmap-draw .edge{fill:rgba(255,146,54,.34);stroke:#c2542e;stroke-width:1.8;',
    ' vector-effect:non-scaling-stroke;stroke-linejoin:round}',
    '#jmap-draw .vtx{fill:#fff;stroke:#c2542e;stroke-width:1.4;vector-effect:non-scaling-stroke}',
    '#jmap-draw .vtx.first{fill:#c2542e}',
    'body.jmap-drawing #map-container{cursor:crosshair}',
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
    // #map-container is inset:0 inside #stage, so #stage's padding shrinks it;
    // the map refits itself off a resize and does not need telling directly
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

  /* Taps reach the tools through map.js's one hook. Returning false there
     means the map does not treat the tap as a selection. Drags are never
     offered, so panning and pinching go on working while a tool is armed. */
  window.JMAP_TAP = function (e) {
    for (var i = 0; i < tapTools.length; i++) {
      if (tapTools[i](e) === false) return false;
    }
    return true;
  };

  var api = {
    svg: svg,
    container: container,
    toLonLat: toLonLat,
    clientToUser: clientToUser,
    unitsPerPixel: unitsPerPixel,
    setting: setting,
    onTap: function (fn) { tapTools.push(fn); },
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
    // file:// and plain http have no clipboard; the textarea is the fallback
    done(false);
  }

  /* ================= tools ================= */

  var TOOLS = [];

  /* ---- backings on and off ---- */

  TOOLS.push({
    title: 'Backings',
    hint: 'Natural Earth’s outline of each country, in a layer under the atoms. ' +
          'Half the path data in the file. With Administrative <b>on</b> it is a ' +
          'filler — the provinces are drawn over it and it only shows through the ' +
          'cracks between them. With Administrative <b>off</b> the provinces have ' +
          'not been fetched, so for China, India, Japan, Korea, Siam, Burma, ' +
          'Indochina, the Indies and a dozen more the backing <b>is</b> the ' +
          'country, and switching it off empties the map. Off, they are detached ' +
          'from the document, so a pan measures the map without them.',
    build: function (sec) {
      var group = svg.querySelector('#backings');
      var anchor = document.createComment('backings');
      var detached = null;

      var wrap = document.createElement('label');
      wrap.className = 'sw';
      wrap.innerHTML = '<input type="checkbox" checked> Draw backings';
      var box = $('input', wrap);
      sec.appendChild(wrap);

      var out = document.createElement('div');
      out.className = 'readout';
      sec.appendChild(out);

      var reload = document.createElement('button');
      reload.type = 'button';
      reload.className = 'wide';
      reload.textContent = 'Reload the page with this setting';
      reload.addEventListener('click', function () { window.location.reload(); });
      sec.appendChild(reload);

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

      /* How many countries on screen would go with them — an atom whose
         divisions are still in the administrative file has no shape of its
         own, and its backing is all there is. */
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

      box.addEventListener('change', function () { apply(box.checked); });
      var want = setting('backings');
      box.checked = want !== false;
      apply(box.checked);
      if (!group) { box.disabled = true; out.textContent = 'no #backings in this map'; }
    },
  });

  /* ---- draw a polygon and take its coordinates away ---- */

  var drawingOn = false;
  function drawing() { return drawingOn; }

  TOOLS.push({
    title: 'Draw polygon',
    hint: 'Tap to drop a point; drag to pan as usual. The ring is closed for ' +
          'you. It is drawn in the map’s own coordinates, so it stays put ' +
          'while you zoom, and it goes when you switch the tool off.',
    build: function (sec, api) {
      var pts = [];                       // [{lon, lat, x, y}]
      var layer = null, fill = null, dots = null;

      var row = document.createElement('div');
      row.className = 'row';
      sec.appendChild(row);

      function btn(label, fn, cls) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        if (cls) b.className = cls;
        b.addEventListener('click', fn);
        row.appendChild(b);
        return b;
      }

      var toggleBtn = btn('Draw polygon', function () { setOn(!drawingOn); });
      var undoBtn = btn('Undo point', function () { pts.pop(); redraw(); });
      var clearBtn = btn('Clear', function () { pts = []; redraw(); });

      var row2 = document.createElement('div');
      row2.className = 'row';
      sec.appendChild(row2);
      function btn2(label, fn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', function () { fn(b); });
        row2.appendChild(b);
        return b;
      }
      btn2('Copy lon,lat', function (b) { api.copy(asList(), b); });
      btn2('Copy GeoJSON', function (b) { api.copy(asGeoJSON(), b); });

      var out = document.createElement('div');
      out.className = 'readout';
      sec.appendChild(out);

      var ta = document.createElement('textarea');
      ta.readOnly = true;
      ta.spellcheck = false;
      sec.appendChild(ta);

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

      /* Rough km², good enough to say whether a ring is the size intended.
         Shoelace on lon/lat with a cosine correction at the mean latitude. */
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

      /* The dots are drawn in map units, so they would grow with a zoom.
         Watched only while the tool is on, and only one redraw per frame, so
         it costs nothing when the panel is being used to measure a pan. */
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

  /* ================= go ================= */

  window.JMAP_ADMIN = { open: open, close: close, toggle: toggle, tools: TOOLS };
  open();
}());
