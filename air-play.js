/* air-play.js — the air timetable, flown.
 *
 * The cards say when an aeroplane left and when it landed. This says where it
 * was at ten past two, which is the question a network map is actually for:
 * the reader watches the morning fill from Tokyo, the Korea trunk cross the
 * Yellow Sea, and Fukuoka take four machines within twenty minutes of noon.
 *
 * WHY FORTY-EIGHT HOURS AND NOT TWENTY-FOUR. Two reasons, both from the
 * sources rather than from a wish for a longer film. The 1938–39 trunk leaves
 * Tokyo at 07:00, reaches Dairen at 15:10 and does not start back until the
 * next morning: on a one-day clock that aeroplane vanishes at Dairen and a
 * different one appears there at 09:30, which is not what happened. And the
 * Pescadores leg ran 偶数日 — every other day — so on a one-day clock it either
 * flies daily, which is false, or never, which is worse. Two days shows the
 * lay-over as a lay-over and lets an alternate-day service fly once.
 *
 * MAP UNITS AND SCREEN PIXELS. Everything drawn here is in map units, and
 * every size the reader perceives is in screen pixels. `k` is the number of
 * map units to a screen pixel and it is the only bridge. The aeroplane is a
 * shape rather than a stroke, so it is drawn at its pixel size and given
 * `scale(k)`, and `rescaled(k)` rewrites that on every zoom. This project has
 * made that mistake three times; test at more than one zoom or this proves
 * nothing.
 */
window.JMAP_AIRPLAY = function (host) {
  'use strict';

  var DAY = 1440;
  var SPAN = 2 * DAY;                  // the window: two days
  var PLANE_R = 4.2;                   // screen px: the aeroplane's half-length
  var OPEN_AT = 6 * 60;                // 06:00 on the first day, before the
                                       // earliest departure (07:00), so the
                                       // reader sees the network fill

  var layer = null, bar = null, els = {};
  var plans = [], marks = [];
  var simMin = OPEN_AT, playing = false, raf = 0, lastTs = 0;
  var shownClock = '', mounted = false;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function clockOf(mn) {
    var m = ((mn % SPAN) + SPAN) % SPAN;
    return 'Day ' + (Math.floor(m / DAY) + 1) + '  ' + two(Math.floor((m % DAY) / 60))
           + ':' + two(Math.floor(m % 60));
  }
  function mins(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '').trim());
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }

  /* ------------------------------------------------------------ geometry --
   *
   * A leg is a great circle, not a straight line on the sheet — the same
   * course the drawn route follows, worked out the same way. Interpolating in
   * projected space instead would put the aeroplane off its own line, by 60 km
   * in the middle of Yokohama–Saipan. */
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

  /* --------------------------------------------------------------- plans --
   *
   * One plan per aeroplane: the legs it flew, each with the minute it left and
   * the minute it landed, on a clock that runs across both days.
   *
   * A journey is built in the order it was flown, which for the return half is
   * the stops read backwards. The lay-over is the only step that goes back on
   * the clock, and it is marked in the file — `ov` names the directions it
   * applies to — rather than inferred here.
   *
   * **Out and back are two aeroplanes, not one.** The author's own reading:
   * everything in this network flew in daylight, so a service that leaves
   * Keijō at 10:40 and one that arrives there at 12:50 cannot be the same
   * machine turning round. Drawing them as one would have it teleport. */
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
        [['down', false], ['up', true]].forEach(function (dir) {
          var seq = rows.slice();
          if (dir[1]) seq.reverse();
          var calls = [], dayOff = 0, prev = null;
          seq.forEach(function (t) {
            var idx = (+t.seq) - 1;
            var st = stops[idx];
            if (!st) return;
            var pair = dir[1] ? [t.ua, t.ud] : [t.da, t.dd];
            var a = mins(pair[0]), d = mins(pair[1]);
            var night = String(t.ov || '').split(/\s+/).indexOf(dir[0]) >= 0;
            if (a !== null) {
              if (prev !== null && a + dayOff * DAY < prev) dayOff++;
              a += dayOff * DAY; prev = a;
            }
            if (d !== null) {
              if (night) { dayOff++; }
              else if (prev !== null && d + dayOff * DAY < prev) dayOff++;
              d += dayOff * DAY; prev = d;
            }
            calls.push({ st: st, arrive: a, depart: d,
                         freq: t.freq || '' });
          });
          var legs = [];
          for (var i = 0; i + 1 < calls.length; i++) {
            var from = calls[i], to = calls[i + 1];
            if (from.depart === null || from.depart === undefined) continue;
            if (to.arrive === null || to.arrive === undefined) continue;
            legs.push({ off: from.depart, on: to.arrive,
                        seg: gcPoints(from.st, to.st),
                        from: from.st, to: to.st });
          }
          if (!legs.length) return;
          var freq = calls.map(function (c) { return c.freq; })
            .filter(Boolean)[0] || '';
          plans.push({
            route: r, svc: svc, dir: dir[0], legs: legs, freq: freq,
            /* Which of the two days it flies. A daily service flies both; one
               that ran every other day flies once, and on the second, so the
               reader who presses play sees the first day as the ordinary one
               and the second as the fuller. */
            days: /even-numbered/.test(freq) ? [1] : [0, 1],
          });
        });
      });
    });
    return plans;
  }

  /* Where a plan's aeroplane is at T, or null if it is on the ground or has
     not left yet. A stop is a gap between two legs and the aeroplane simply is
     not drawn: an aeroplane sitting on an apron is not a fact this is trying
     to show, and a dot parked on a ring hides the ring. */
  function positionAt(plan, T) {
    for (var d = 0; d < plan.days.length; d++) {
      var base = plan.days[d] * DAY;
      for (var i = 0; i < plan.legs.length; i++) {
        var lg = plan.legs[i];
        var off = lg.off + base, on = lg.on + base;
        if (T >= off && T <= on) {
          var f = on > off ? (T - off) / (on - off) : 0;
          return along(lg.seg, f);
        }
      }
    }
    return null;
  }

  function markFor(i) {
    if (marks[i]) return marks[i];
    var g = host.svgEl('g', { 'class': 'plane' });
    /* A shape pointed the way it is going, not a dot: on a map with sixty-odd
       rings already on it, one more circle says nothing about which way the
       aeroplane is flying, and that is half of what a network in motion is
       for. */
    g.appendChild(host.svgEl('path', {
      'class': 'plane-body',
      d: 'M 6 0 L -4 3.4 L -2 0 L -4 -3.4 Z',
    }));
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
      /* Placed in map units, sized in screen pixels: `scale(k)` is what makes
         the second true, and it is rewritten on every zoom by `rescaled`. */
      m.setAttribute('transform', 'translate(' + at.x.toFixed(2) + ','
        + at.y.toFixed(2) + ') scale(' + (k * PLANE_R / 4.2).toFixed(4) + ') rotate('
        + at.a.toFixed(1) + ')');
      flying++;
    }
    var c = clockOf(simMin);
    if (c !== shownClock) {
      els.clock.textContent = c;
      els.count.textContent = flying + (flying === 1 ? ' in the air' : ' in the air');
      shownClock = c;
    }
    return flying;
  }

  function setTime(mn, fromSlider) {
    simMin = ((mn % SPAN) + SPAN) % SPAN;
    if (!fromSlider && els.slider) els.slider.value = String(Math.round(simMin));
    render();
  }

  function tick(ts) {
    if (!playing) { raf = 0; return; }
    var dt = lastTs ? Math.min(250, ts - lastTs) : 16;
    lastTs = ts;
    setTime(simMin + dt / 1000 * (+els.speed.value));
    raf = requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    playing = on;
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
    els.slider.min = '0'; els.slider.max = String(SPAN - 1); els.slider.step = '1';
    els.slider.value = String(simMin);
    els.slider.className = 'air-slider';
    els.slider.setAttribute('aria-label', 'Time of day');
    els.slider.addEventListener('input', function () {
      setPlaying(false);
      setTime(+els.slider.value, true);
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
    host.stage().appendChild(bar);
    if (host.obstacle) host.obstacle(bar, true);
  }

  var api = {
    mounted: function () { return mounted; },
    /* Up over whichever routes the date draws. Rebuilt rather than filtered on
       an epoch change: the 1930 sheet has one service and the 1942 sheet has
       nineteen, and the geometry of a route that is not drawn is work nobody
       asked for. */
    mount: function (routes, k) {
      if (mounted) return api.stats;
      lastK = k || 1;
      layer = host.svgEl('g', { id: 'planes' });
      host.insertLayer(layer);
      buildPlans(routes || []);
      marks = [];
      buildBar();
      mounted = true;
      simMin = OPEN_AT;
      if (els.slider) els.slider.value = String(simMin);
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
    time: function () { return simMin; },
    playing: function () { return playing; },
    play: function (on) { if (mounted) setPlaying(!!on); },
    flying: function () { return mounted ? render() : 0; },
    stats: function () {
      return { plans: plans.length,
               legs: plans.reduce(function (n, p) { return n + p.legs.length; }, 0) };
    },
  };
  return api;
};
