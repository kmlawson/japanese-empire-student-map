























window.JMAP_AIRPLAY = function (host) {
  'use strict';

  var DAY = 1440;
  var SPAN = 7 * DAY;                  // the window: a week
  var PLANE_R = 4.2;                   // screen px: the aeroplane's half-length
  var PAUSE = 90;                      // ticks of dead time at a day boundary
  var EDGE = 20;                       // minutes of empty air kept either side



  var layer = null, bar = null, els = {};
  var plans = [], marks = [];
  var simMin = 0, simTick = 0, nightNow = false;
  var playing = false, raf = 0, lastTs = 0;
  var shownClock = '', mounted = false;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function fmtMin(m) {
    var v = ((m % DAY) + DAY) % DAY;
    return two(Math.floor(v / 60)) + ':' + two(Math.floor(v % 60));
  }
  function clockOf(mn) {
    var m = ((mn % SPAN) + SPAN) % SPAN;
    return 'Day ' + (Math.floor(m / DAY) + 1) + '  ' + two(Math.floor((m % DAY) / 60))
           + ':' + two(Math.floor(m % 60));
  }
  function mins(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '').trim());
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }







  function gcPoints(a, b) {
    var R = Math.PI / 180;
    var la1 = a.lat * R, lo1 = a.lon * R, la2 = b.lat * R, lo2 = b.lon * R;
    var d = 2 * Math.asin(Math.sqrt(
      Math.pow(Math.sin((la2 - la1) / 2), 2)
      + Math.cos(la1) * Math.cos(la2) * Math.pow(Math.sin((lo2 - lo1) / 2), 2)));
    var n = Math.max(2, Math.min(64, Math.round(d / R / 1.2) + 2));
    var out = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n, p;
      if (d < 1e-9) { p = { lon: a.lon, lat: a.lat }; }
      else {
        var A = Math.sin((1 - f) * d) / Math.sin(d);
        var B = Math.sin(f * d) / Math.sin(d);
        var x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
        var y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
        var z = A * Math.sin(la1) + B * Math.sin(la2);
        p = { lat: Math.atan2(z, Math.hypot(x, y)) / R,
              lon: Math.atan2(y, x) / R };
      }
      out.push(host.project(p.lon, p.lat));
    }
    var cum = [0];
    for (var j = 1; j < out.length; j++) {
      cum.push(cum[j - 1] + Math.hypot(out[j].x - out[j - 1].x,
                                       out[j].y - out[j - 1].y));
    }
    return { p: out, cum: cum, total: cum[cum.length - 1] };
  }

  function along(seg, f) {
    var p = seg.p, cum = seg.cum;
    if (!seg.total) return { x: p[0].x, y: p[0].y, a: 0 };
    var t = Math.max(0, Math.min(1, f)) * seg.total, i = 1;
    while (i < p.length && cum[i] < t) i++;
    if (i >= p.length) i = p.length - 1;
    var d = cum[i] - cum[i - 1];
    var g = d > 0 ? (t - cum[i - 1]) / d : 0;
    return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * g,
             y: p[i - 1].y + (p[i].y - p[i - 1].y) * g,
             a: Math.atan2(p[i].y - p[i - 1].y, p[i].x - p[i - 1].x) * 180 / Math.PI };
  }















  function buildPlans(routes) {
    plans = [];
    routes.forEach(function (r) {
      var stops = r.stops || [];
      if (stops.length < 2) return;
      var svcs = (r.times || []).map(function (t) { return t.svc || ''; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; });
      svcs.forEach(function (svc) {
        var rows = (r.times || []).filter(function (t) { return (t.svc || '') === svc; });
        if (!rows.length) return;
        var freq = rows.map(function (t) { return t.freq || ''; })
          .filter(Boolean)[0] || '';
        [['down', false, 'd'], ['up', true, 'u']].forEach(function (dir) {
          var seq = rows.slice();
          if (dir[1]) seq.reverse();
          var calls = [];
          seq.forEach(function (t) {
            var idx = (+t.seq) - 1;
            var st = stops[idx];
            if (!st) return;
            var p = dir[2];
            var at = function (half) {
              var v = t[p + (half === 'arrive' ? 'a' : 'd')];
              if (!v) return null;
              var m = mins(v);
              if (m === null) return null;
              var d = parseInt(t[p + (half === 'arrive' ? 'ad' : 'dd')], 10);
              return ((isFinite(d) && d > 0 ? d : 1) - 1) * DAY + m;
            };
            calls.push({ st: st, at: idx, arrive: at('arrive'), depart: at('depart') });
          });


















          var gfrom = host.grounded ? host.grounded(r) : r.groundedFrom;
          var gi = -1;
          if (gfrom) {
            for (var gx = 0; gx < stops.length; gx++) {
              if ((stops[gx].id || stops[gx].name) === gfrom) { gi = gx; break; }
            }
          }
          var legs = [];
          for (var i = 0; i + 1 < calls.length; i++) {
            var from = calls[i], to = calls[i + 1];
            if (from.depart === null || to.arrive === null) continue;
            if (gi >= 0 && Math.min(from.at, to.at) >= gi) continue;
            legs.push({ off: from.depart, on: to.arrive,
                        seg: gcPoints(from.st, to.st),
                        from: from.st, to: to.st });
          }
          if (!legs.length) return;




































          var wk = rows.map(function (t) {
            return dir[0] === 'up' ? (t.uw || '') : (t.dw || '');
          }).filter(Boolean)[0] || '';
          var said = wk
            ? String(wk).split(/\s+/).map(Number).filter(function (d) { return d >= 1 && d <= 7; })
            : (r.days || []).filter(function (d) { return d >= 1 && d <= 7; });
          var offs = said.length ? said.map(function (d) { return d - 1; })
                   : /twice a month|month/.test(freq) ? [0]
                   : /even-numbered|other day/.test(freq) ? [-1, 1, 3, 5]
                   : [-1, 0, 1, 2, 3, 4, 5, 6];
          offs.forEach(function (o) {
            plans.push({ route: r, svc: svc, dir: dir[0], legs: legs,
                         freq: freq, dayOff: o });
          });
        });
      });
    });
    buildWindows();
    return plans;
  }












  var wins = [];                       // [{day, from, to, at}] in ticks
  var ticks = 0;

  function buildWindows() {
    wins = []; ticks = 0;
    for (var d = 0; d < 7; d++) {
      var lo = Infinity, hi = -Infinity;
      plans.forEach(function (p) {
        p.legs.forEach(function (lg) {
          var a = lg.off + p.dayOff * DAY, b = lg.on + p.dayOff * DAY;

          if (b < d * DAY || a > (d + 1) * DAY) return;
          lo = Math.min(lo, Math.max(a - d * DAY, 0));
          hi = Math.max(hi, Math.min(b - d * DAY, DAY));
        });
      });
      if (!isFinite(lo)) continue;     // a day with nothing in the air
      lo = Math.max(0, Math.floor((lo - EDGE) / 5) * 5);
      hi = Math.min(DAY, Math.ceil((hi + EDGE) / 5) * 5);
      wins.push({ day: d, from: lo, to: hi, at: ticks });
      ticks += (hi - lo);
      ticks += PAUSE;                  // the night, in the time it takes to read
    }
    if (wins.length) ticks -= PAUSE;   // no pause after the last day
    ticks = Math.max(1, ticks);
  }


  function spanOf(tick) {
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i], len = w.to - w.from;
      if (tick <= w.at + len) {
        return { min: w.day * DAY + w.from + Math.max(0, tick - w.at),
                 day: w.day, night: false };
      }
      if (tick < w.at + len + PAUSE) {

        return { min: w.day * DAY + w.to, day: w.day, night: true };
      }
    }
    var last = wins[wins.length - 1];
    return last ? { min: last.day * DAY + last.to, day: last.day, night: true }
                : { min: 0, day: 0, night: false };
  }





  function positionAt(plan, T) {
    var base = plan.dayOff * DAY;
    for (var i = 0; i < plan.legs.length; i++) {
      var lg = plan.legs[i];
      var off = lg.off + base, on = lg.on + base;
      if (T >= off && T <= on) {
        var f = on > off ? (T - off) / (on - off) : 0;
        return along(lg.seg, f);
      }
    }
    return null;
  }



















  var FOKKER = [
    ['path', 'M 3.924 19.775 C 3.924 17.775 4.924 16.608 6.924 16.275 L 29.924 12.775 L 33.924 12.775 L 56.924 16.275 C 58.924 16.608 59.924 17.775 59.924 19.775 L 59.924 23.775 C 59.924 25.442 58.924 26.275 56.924 26.275 L 6.924 26.275 C 4.924 26.275 3.924 25.442 3.924 23.775 L 3.924 19.775 Z'],
    ['path', 'M 27.424 10.275 C 27.757 6.275 29.257 3.608 31.924 2.275 C 34.591 3.608 36.091 6.275 36.424 10.275 L 36.308 26.539 L 32.861 57.459 L 30.842 57.434 L 27.741 26.641 L 27.424 10.275 Z'],
    ['path', 'M 19.424 50.775 C 19.424 49.442 20.091 48.608 21.424 48.275 L 29.424 45.775 L 34.424 45.775 L 42.424 48.275 C 43.757 48.608 44.424 49.442 44.424 50.775 L 44.424 53.275 L 19.424 53.275 L 19.424 50.775 Z'],
    ['path', 'M 15.22 13.39 L 17.417 13.39 L 17.732 25.602 C 17.732 27.823 17.261 28.933 16.319 28.933 C 15.377 28.933 14.906 27.823 14.906 25.602 L 15.22 13.39 Z'],
    ['path', 'M 47.221 13.446 L 49.418 13.446 L 49.733 25.658 C 49.733 27.879 49.262 28.989 48.32 28.989 C 47.378 28.989 46.907 27.879 46.907 25.658 L 47.221 13.446 Z'],
    ['rect', { x: 7.924, y: 20.275, width: 16, height: 2, rx: 1 }],
    ['rect', { x: 39.924, y: 17.275, width: 16, height: 2, rx: 1 }],
    ['circle', { cx: 15.924, cy: 21.275, r: 2.2 }],
    ['circle', { cx: 47.924, cy: 21.275, r: 2.2 }],
    ['circle', { cx: 31.924, cy: 7.275, r: 2.4 }],
  ];



























  var NAKAJIMA = [
    ['path', 'M 190.2,75.1 C 161.6,78.8 131.1,84.0 99.6,90.8 C 77.8,95.5 59.3,98.5 45.2,100.3 C 39.6,101.0 36.4,104.4 36.7,108.8 C 37.0,113.2 40.5,116.1 46.5,117.9 C 83.4,122.6 125.5,126.7 185.9,132.0 C 189.6,132.3 192.2,129.5 192.2,125.8 L 192.2,82.7 C 192.2,78.9 191.7,76.5 190.2,75.1 Z M 207.9,75.4 C 236.6,79.0 267.0,84.5 299.0,91.2 C 320.5,95.7 339.1,98.5 353.2,100.2 C 358.7,100.9 362.1,104.3 361.8,108.8 C 361.5,113.3 357.9,116.2 352.0,118.0 C 315.0,122.7 272.8,126.8 212.5,132.0 C 208.8,132.3 206.2,129.6 206.2,125.9 L 206.2,82.9 C 206.2,79.1 206.7,76.7 207.9,75.4 Z'],
    ['path', 'M 160.8,45.7 C 155.2,45.7 151.6,49.0 151.3,54.1 L 152.4,77.2 C 152.8,89.5 155.7,100.4 160.9,108.4 C 166.0,100.4 169.0,89.5 169.4,77.2 L 170.4,54.1 C 170.2,49.0 166.5,45.7 160.8,45.7 Z M 238.7,45.8 C 233.0,45.8 229.4,49.1 229.2,54.2 L 230.2,77.4 C 230.7,89.6 233.6,100.5 238.8,108.5 C 243.9,100.5 246.8,89.6 247.3,77.4 L 248.3,54.2 C 248.0,49.1 244.4,45.8 238.7,45.8 Z'],
    ['rect', { x: 139.0, y: 47.5, width: 43.8, height: 2.4, rx: 1.2 }],
    ['rect', { x: 216.9, y: 47.6, width: 43.8, height: 2.4, rx: 1.2 }],
    ['path', 'M 196.2,223.3 C 180.5,225.4 166.2,229.4 155.5,234.5 C 150.4,236.9 148.7,240.6 150.5,244.7 C 152.5,249.2 158.0,251.3 165.0,251.4 C 176.5,251.4 187.7,249.9 198.2,247.2 L 200.1,247.2 C 210.6,249.9 221.8,251.4 233.3,251.4 C 240.3,251.3 245.8,249.2 247.8,244.7 C 249.6,240.6 247.9,236.9 242.8,234.5 C 232.1,229.4 217.8,225.4 202.1,223.3 Z'],
    ['path', 'M 199.2,9.4 C 195.5,11.2 193.2,17.1 192.0,25.9 C 190.1,39.4 188.9,55.1 188.2,71.6 C 187.3,91.3 187.0,109.1 187.2,126.0 C 187.5,146.8 188.5,165.4 190.0,181.9 C 191.7,200.7 193.6,217.9 195.8,233.7 L 198.3,258.3 C 198.5,261.0 198.8,263.3 199.2,265.1 C 199.7,263.3 200.0,261.0 200.2,258.3 L 202.7,233.7 C 204.9,217.9 206.8,200.7 208.5,181.9 C 210.0,165.4 211.0,146.8 211.2,126.0 C 211.5,109.1 211.2,91.3 210.3,71.6 C 209.6,55.1 208.3,39.4 206.4,25.9 C 205.2,17.1 202.9,11.2 199.2,9.4 Z'],
  ];





  var TYPES = {
    e1930: { shapes: null,      // filled in below: the Fokker
             tf: 'rotate(90) scale(0.395) translate(-32,-30)' },
    e1942: { shapes: null,      // the Nakajima
             tf: 'rotate(90) scale(0.062) translate(-199.2,-137)' },
  };

  function drawnPlane(kind) {
    var spec = TYPES[kind] || TYPES.e1930;
    var shapes = kind === 'e1942' ? NAKAJIMA : FOKKER;
    var g = host.svgEl('g', { 'class': 'plane-art plane-' + kind });
    g.setAttribute('transform', spec.tf);
    ['plane-case', 'plane-body-fill'].forEach(function (cls) {
      var layer = host.svgEl('g', { 'class': cls });
      shapes.forEach(function (sh) {
        if (sh[0] === 'path') layer.appendChild(host.svgEl('path', { d: sh[1] }));
        else layer.appendChild(host.svgEl(sh[0], sh[1]));
      });
      g.appendChild(layer);
    });
    return g;
  }

  function markFor(i) {
    if (marks[i]) return marks[i];
    var g = host.svgEl('g', { 'class': 'plane' });




    g.setAttribute('data-plan', String(i));





    if (plans[i] && plans[i].route) g.setAttribute('data-route', plans[i].route.id);
    g.appendChild(host.svgEl('circle', { 'class': 'plane-hit', r: 11 }));










    var eps = (plans[i] && plans[i].route && plans[i].route.epochs) || [];
    var mine = (eps.length === 1) ? eps[0]
                                  : ((host.epoch && host.epoch()) || 'e1930');
    g.appendChild(drawnPlane(mine));
    layer.appendChild(g);
    marks[i] = g;
    return g;
  }

  var lastK = 1;
  function render() {
    var k = lastK;
    var flying = 0;
    for (var i = 0; i < plans.length; i++) {
      var at = positionAt(plans[i], simMin);
      var m = marks[i];
      if (!at) { if (m) m.style.display = 'none'; continue; }
      m = markFor(i);
      m.style.display = '';


      m.setAttribute('transform', 'translate(' + at.x.toFixed(2) + ','
        + at.y.toFixed(2) + ') scale(' + (k * PLANE_R / 4.2).toFixed(4) + ') rotate('
        + at.a.toFixed(1) + ')');
      flying++;
    }
    var c = nightNow ? ('Day ' + (Math.floor(simMin / DAY) + 1) + '  night')
                     : clockOf(simMin);
    if (c !== shownClock) {
      els.clock.textContent = c;
      els.count.textContent = flying + ' in the air';
      shownClock = c;
    }
    return flying;
  }



  function setTick(t, fromSlider) {
    simTick = Math.max(0, Math.min(ticks, t));
    var at = spanOf(simTick);
    simMin = at.min;
    nightNow = at.night;
    if (!fromSlider && els.slider) els.slider.value = String(Math.round(simTick));
    render();
  }


  function setTime(mn, fromSlider) {
    var want = ((mn % SPAN) + SPAN) % SPAN;
    var best = 0, bd = Infinity;
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i];
      var d = w.day * DAY;
      if (want >= d + w.from && want <= d + w.to) { best = w.at + (want - d - w.from); bd = 0; break; }
      var near = Math.min(Math.abs(want - (d + w.from)), Math.abs(want - (d + w.to)));
      if (near < bd) { bd = near; best = w.at + (want < d + w.from ? 0 : w.to - w.from); }
    }
    setTick(best, fromSlider);
  }

  function tick(ts) {
    if (!playing) { raf = 0; return; }
    var dt = lastTs ? Math.min(250, ts - lastTs) : 16;
    lastTs = ts;



    var next = simTick + dt / 1000 * (+els.speed.value);
    if (next >= ticks) next = 0;       // round again at the end of the week
    setTick(next);
    raf = requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    var was = playing;
    playing = on;






    if (was !== on && host && host.playChanged) {
      try { host.playChanged(on); } catch (e) { /* the drawing is not load-bearing */ }
    }


    if (layer) layer.style.pointerEvents = on ? 'none' : 'auto';
    els.play.textContent = on ? '❙❙' : '▶';
    els.play.setAttribute('aria-label', on ? 'Pause' : 'Play the two days');
    els.play.title = on ? 'Pause' : 'Play the two days';
    lastTs = 0;
    if (on && !raf) raf = requestAnimationFrame(tick);
  }

  function buildBar() {
    bar = el('div', 'air-bar');
    bar.id = 'air-bar';
    els.play = el('button', 'plain air-play', '▶');
    els.play.type = 'button';
    els.play.title = 'Play the two days';
    els.play.setAttribute('aria-label', 'Play the two days');
    els.play.addEventListener('click', function () { setPlaying(!playing); });
    els.clock = el('span', 'air-clock', clockOf(simMin));
    els.slider = document.createElement('input');
    els.slider.type = 'range';
    els.slider.min = '0'; els.slider.max = String(ticks); els.slider.step = '1';
    els.slider.value = String(simTick);




    els.marks = document.createElement('datalist');
    els.marks.id = 'air-day-marks';
    wins.forEach(function (w, i) {
      if (!i) return;
      var o = document.createElement('option');
      o.value = String(w.at);
      o.label = 'Day ' + (w.day + 1);
      els.marks.appendChild(o);
    });
    els.slider.setAttribute('list', els.marks.id);
    els.slider.className = 'air-slider';
    els.slider.setAttribute('aria-label', 'Time of day');
    els.slider.addEventListener('input', function () {
      setPlaying(false);
      setTick(+els.slider.value, true);
    });
    els.speed = document.createElement('select');
    els.speed.className = 'air-speed';
    els.speed.setAttribute('aria-label', 'How fast the clock runs');
    [[15, '15×'], [60, '1 min/s'], [240, '4 min/s'], [900, '15 min/s']]
      .forEach(function (o, i) {
        var op = document.createElement('option');
        op.value = String(o[0]);
        op.textContent = o[1];
        if (i === 2) op.selected = true;
        els.speed.appendChild(op);
      });
    els.count = el('span', 'air-count', '');
    bar.appendChild(els.play);
    bar.appendChild(els.clock);
    bar.appendChild(els.slider);
    bar.appendChild(els.speed);
    bar.appendChild(els.count);
    bar.appendChild(els.marks);
    host.stage().appendChild(bar);
    if (host.obstacle) host.obstacle(bar, true);
  }

  var api = {
    mounted: function () { return mounted; },




    mount: function (routes, k) {
      if (mounted) return api.stats;
      lastK = k || 1;
      layer = host.svgEl('g', { id: 'planes' });
      layer.style.pointerEvents = 'auto';   // it opens stopped
      host.insertLayer(layer);
      buildPlans(routes || []);
      marks = [];
      buildBar();
      mounted = true;
      simTick = 0;
      simMin = wins.length ? wins[0].day * DAY + wins[0].from : 0;
      if (els.slider) els.slider.value = '0';
      shownClock = '';
      render();
      return api.stats();
    },
    unmount: function () {
      if (!mounted) return;
      setPlaying(false);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
      if (bar) {
        if (host.obstacle) host.obstacle(bar, false);
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }
      layer = null; bar = null; els = {}; plans = []; marks = [];
      mounted = false;
    },
    rescaled: function (k) { lastK = k; if (mounted) render(); },
    setTime: function (mn) { if (mounted) setTime(mn); },
    setTick: function (t) { if (mounted) setTick(t); },
    time: function () { return simMin; },
    tick: function () { return simTick; },
    ticks: function () { return ticks; },
    windows: function () { return wins.map(function (w) {
      return { day: w.day, from: w.from, to: w.to, at: w.at }; }); },
    playing: function () { return playing; },
    play: function (on) { if (mounted) setPlaying(!!on); },
    flying: function () { return mounted ? render() : 0; },



    planAt: function (i) {
      var p = plans[i];
      if (!p) return null;
      {
        var base = p.dayOff * DAY;
        for (var k = 0; k < p.legs.length; k++) {
          var lg = p.legs[k];
          if (simMin < lg.off + base || simMin > lg.on + base) continue;
          var name = function (st) { return String(st.name || '').split(' (')[0]; };
          return {
            route: p.route.id, routeName: p.route.shortName || p.route.name,
            svc: p.svc, dir: p.dir, freq: p.freq,
            from: name(lg.from), to: name(lg.to),
            off: fmtMin(lg.off + base), on: fmtMin(lg.on + base),
            offDay: Math.floor((lg.off + base) / DAY) + 1,
            onDay: Math.floor((lg.on + base) / DAY) + 1,
            leg: k + 1, legs: p.legs.length,
            calls: p.legs.map(function (x, j) {
              return { from: name(x.from), to: name(x.to),
                       off: fmtMin(x.off + base), on: fmtMin(x.on + base),
                       offDay: Math.floor((x.off + base) / DAY) + 1,
                       onDay: Math.floor((x.on + base) / DAY) + 1,
                       done: simMin > x.on + base, now: j === k };
            }),
          };
        }
      }
      return null;
    },
    stats: function () {
      return { plans: plans.length, days: wins.length, ticks: ticks,
               legs: plans.reduce(function (n, p) { return n + p.legs.length; }, 0) };
    },
  };
  return api;
};
