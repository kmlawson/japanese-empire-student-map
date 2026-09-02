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
  var SPAN = 7 * DAY;                  // the window: a week
  var PLANE_R = 4.2;                   // screen px: the aeroplane's half-length
  var PAUSE = 90;                      // ticks of dead time at a day boundary
  var EDGE = 20;                       // minutes of empty air kept either side
                                       // of a day's flying, so the first
                                       // aeroplane is seen to take off

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
            calls.push({ st: st, arrive: at('arrive'), depart: at('depart') });
          });
          var legs = [];
          for (var i = 0; i + 1 < calls.length; i++) {
            var from = calls[i], to = calls[i + 1];
            if (from.depart === null || to.arrive === null) continue;
            legs.push({ off: from.depart, on: to.arrive,
                        seg: gcPoints(from.st, to.st),
                        from: from.st, to: to.st });
          }
          if (!legs.length) return;
          /* **One plan is one aeroplane on one day, not a service.**
           *
           * A daily service that takes two days each way has two machines in
           * the air at once — yesterday's still coming home while today's goes
           * out — and they are in different places. Held as a single plan with
           * a list of days, it had a single mark, and `positionAt` returned
           * whichever instance it found first: the mark jumped between two
           * aeroplanes and the other vanished. On the 1930 sheet that showed
           * as a machine appearing over the Yellow Sea for part of an
           * afternoon and going again, which is not what the 1931 timetable
           * says and was the fault, not the reading of it.
           *
           * The legs are shared by reference — the geometry is the same
           * journey — and only the day it left differs.
           *
           * Which days: a daily service leaves every morning; an
           * alternate-day one on three of the seven; and the Yokohama flying
           * boat went twice a month, so it makes one circuit and its seven
           * days are the seven days of the film. */
          /* **And one that left the day before the film starts.** A journey
             that takes two days is half over when the week opens, so without
             it the first day was visibly thinner than the six after it — one
             aeroplane in the sky all morning where every other day has two or
             three. The instance at −1 flies the part of its journey that falls
             inside the window and is ignored by everything outside it. */
          /* **The days the route says, where it says them.** `days` on the
             route is a list of days of the week it left on — the KLM trunk
             left Karachi on Mondays, Thursdays and Saturdays — and it beats
             reading the frequency as prose. Where there is no list the
             frequency is read: an alternate-day service on three of the seven,
             a twice-monthly one once, and everything else every morning. */
          /* **The days this service left on**, taken from the service itself
             where it says — the 1931 Java line came home on a Wednesday by one
             timing and on the other five days by another, so the answer cannot
             live on the route. Then the route's own list, then the frequency
             read as prose. */
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

  /* ------------------------------------------------------- the timeline --
   *
   * **Six nights of nothing is not worth scrubbing through.** Nothing in this
   * network flew after dark, so a week laid out minute by minute is two-thirds
   * empty and the reader drags across it looking for the next departure. The
   * slider runs over the hours that have flying in them and nothing else, with
   * a short pause where one day gives way to the next — long enough to read as
   * a night rather than as a jump — and a notch on the track at each.
   *
   * The map is piecewise: `spanOf` turns a slider tick into a minute of the
   * week, and the pauses are the ticks that fall between two windows. */
  var wins = [];                       // [{day, from, to, at}] in ticks
  var ticks = 0;

  function buildWindows() {
    wins = []; ticks = 0;
    for (var d = 0; d < 7; d++) {
      var lo = Infinity, hi = -Infinity;
      plans.forEach(function (p) {
        p.legs.forEach(function (lg) {
          var a = lg.off + p.dayOff * DAY, b = lg.on + p.dayOff * DAY;
          // the part of this leg that falls on day d
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

  /* A slider tick to a minute of the week, and whether we are in a night. */
  function spanOf(tick) {
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i], len = w.to - w.from;
      if (tick <= w.at + len) {
        return { min: w.day * DAY + w.from + Math.max(0, tick - w.at),
                 day: w.day, night: false };
      }
      if (tick < w.at + len + PAUSE) {
        // between two days: hold the clock at the end of the one just flown
        return { min: w.day * DAY + w.to, day: w.day, night: true };
      }
    }
    var last = wins[wins.length - 1];
    return last ? { min: last.day * DAY + last.to, day: last.day, night: true }
                : { min: 0, day: 0, night: false };
  }

  /* Where a plan's aeroplane is at T, or null if it is on the ground or has
     not left yet. A stop is a gap between two legs and the aeroplane simply is
     not drawn: an aeroplane sitting on an apron is not a fact this is trying
     to show, and a dot parked on a ring hides the ring. */
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

  /* **The aeroplane itself.**
   *
   * On the 1930 sheet there is one service and at most two machines in the air,
   * so it is drawn: a Fokker F.VII from above, the high wing across the top,
   * three engines on it, the slim fuselage and the tailplane. That is the type
   * that flew this trunk line, and with room on the map it is worth seeing.
   *
   * On the 1942 sheet a dozen are up at once and a picture at that size is a
   * smudge, so it is an arrowhead: the same information — where, and which
   * way — with nothing to lose at eight pixels.
   *
   * The drawing arrives pointing north in a 64-unit box whose artwork centres
   * near (32, 30). Both marks are put nose-along +x here so that `rotate(a)`,
   * which takes the course straight from `atan2`, needs no special case for
   * one of them. And it arrives filled white, which is invisible over half the
   * palettes this map offers: it takes the ink and a casing of the panel
   * colour, the same treatment the railway lines have and for the same reason.
   */
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

  /* **One silhouette, not thirteen outlined parts.**
   *
   * The drawing is thirteen shapes — wing, fuselage, tailplane, four struts,
   * three nacelles, three propeller discs — and giving each of them the ink
   * outline it needs to be seen drew every seam *inside* the aeroplane as
   * well: at twenty-four pixels it read as a tangle rather than as a shape.
   *
   * The fix is the usual one for outlining a compound shape without a union:
   * draw the set twice. The layer underneath is the same shapes filled *and*
   * stroked in ink, which fuses them into one fat blob; the layer on top is
   * the same shapes filled in the panel colour with no stroke at all, so
   * neighbouring parts meet without a line between them. What is left showing
   * of the blob is a rim round the outside — the silhouette, and nothing else.
   */

  /* **The 1942 aeroplane: a Nakajima Ki-34.**
   *
   * The twin-engine transport that the network was flying by the 1938–39
   * timetable, as the Fokker is the type that flew the 1930 trunk. Traced
   * plan view: wing, two nacelles reaching ahead of it so the twin engines
   * read in silhouette, propeller bars, tailplane and fuselage.
   *
   * It arrives in a 400×280 box pointing north, with the artwork centred near
   * (199, 137) and 325 units across the wing. Twenty pixels of wingspan is
   * what a sheet with a dozen aloft will take without the machines running
   * into one another. */
  var NAKAJIMA = [
    ['path', 'M 190.2,75.1 C 161.6,78.8 131.1,84.0 99.6,90.8 C 77.8,95.5 59.3,98.5 45.2,100.3 C 39.6,101.0 36.4,104.4 36.7,108.8 C 37.0,113.2 40.5,116.1 46.5,117.9 C 83.4,122.6 125.5,126.7 185.9,132.0 C 189.6,132.3 192.2,129.5 192.2,125.8 L 192.2,82.7 C 192.2,78.9 191.7,76.5 190.2,75.1 Z M 207.9,75.4 C 236.6,79.0 267.0,84.5 299.0,91.2 C 320.5,95.7 339.1,98.5 353.2,100.2 C 358.7,100.9 362.1,104.3 361.8,108.8 C 361.5,113.3 357.9,116.2 352.0,118.0 C 315.0,122.7 272.8,126.8 212.5,132.0 C 208.8,132.3 206.2,129.6 206.2,125.9 L 206.2,82.9 C 206.2,79.1 206.7,76.7 207.9,75.4 Z'],
    ['path', 'M 160.8,45.7 C 155.2,45.7 151.6,49.0 151.3,54.1 L 152.4,77.2 C 152.8,89.5 155.7,100.4 160.9,108.4 C 166.0,100.4 169.0,89.5 169.4,77.2 L 170.4,54.1 C 170.2,49.0 166.5,45.7 160.8,45.7 Z M 238.7,45.8 C 233.0,45.8 229.4,49.1 229.2,54.2 L 230.2,77.4 C 230.7,89.6 233.6,100.5 238.8,108.5 C 243.9,100.5 246.8,89.6 247.3,77.4 L 248.3,54.2 C 248.0,49.1 244.4,45.8 238.7,45.8 Z'],
    ['rect', { x: 139.0, y: 47.5, width: 43.8, height: 2.4, rx: 1.2 }],
    ['rect', { x: 216.9, y: 47.6, width: 43.8, height: 2.4, rx: 1.2 }],
    ['path', 'M 196.2,223.3 C 180.5,225.4 166.2,229.4 155.5,234.5 C 150.4,236.9 148.7,240.6 150.5,244.7 C 152.5,249.2 158.0,251.3 165.0,251.4 C 176.5,251.4 187.7,249.9 198.2,247.2 L 200.1,247.2 C 210.6,249.9 221.8,251.4 233.3,251.4 C 240.3,251.3 245.8,249.2 247.8,244.7 C 249.6,240.6 247.9,236.9 242.8,234.5 C 232.1,229.4 217.8,225.4 202.1,223.3 Z'],
    ['path', 'M 199.2,9.4 C 195.5,11.2 193.2,17.1 192.0,25.9 C 190.1,39.4 188.9,55.1 188.2,71.6 C 187.3,91.3 187.0,109.1 187.2,126.0 C 187.5,146.8 188.5,165.4 190.0,181.9 C 191.7,200.7 193.6,217.9 195.8,233.7 L 198.3,258.3 C 198.5,261.0 198.8,263.3 199.2,265.1 C 199.7,263.3 200.0,261.0 200.2,258.3 L 202.7,233.7 C 204.9,217.9 206.8,200.7 208.5,181.9 C 210.0,165.4 211.0,146.8 211.2,126.0 C 211.5,109.1 211.2,91.3 210.3,71.6 C 209.6,55.1 208.3,39.4 206.4,25.9 C 205.2,17.1 202.9,11.2 199.2,9.4 Z'],
  ];

  /* Which type each sheet flies, and how it is placed: the artwork points
     north, the marks go nose-along +x so `rotate(a)` can take the course
     straight from `atan2`, and each is scaled to about the length a reader can
     tell apart at that sheet's density. */
  var TYPES = {
    e1930: { shapes: null,      // filled in below: the Fokker
             tf: 'rotate(90) scale(0.44) translate(-32,-30)' },
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
    /* **Something to press, while the day is stopped.** The drawn aeroplane is
       fourteen pixels of thin silhouette and the arrowhead is ten; neither is
       a target. The disc under them is, and it is inside the counter-scaled
       group so it stays a finger's width at every zoom. */
    g.setAttribute('data-plan', String(i));
    g.appendChild(host.svgEl('circle', { 'class': 'plane-hit', r: 11 }));
    /* Each sheet flies the type that flew it: a Fokker F.VII on the 1930 map
       and a Nakajima Ki-34 on the 1942 one. The arrowhead this replaced said
       where and which way and nothing else. */
    g.appendChild(drawnPlane((host.epoch && host.epoch()) || 'e1930'));
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
    var c = nightNow ? ('Day ' + (Math.floor(simMin / DAY) + 1) + '  night')
                     : clockOf(simMin);
    if (c !== shownClock) {
      els.clock.textContent = c;
      els.count.textContent = flying + ' in the air';
      shownClock = c;
    }
    return flying;
  }

  /* `simTick` is where the slider is; `simMin` is the minute of the week it
     stands for. The two are not proportional — see `buildWindows`. */
  function setTick(t, fromSlider) {
    simTick = Math.max(0, Math.min(ticks, t));
    var at = spanOf(simTick);
    simMin = at.min;
    nightNow = at.night;
    if (!fromSlider && els.slider) els.slider.value = String(Math.round(simTick));
    render();
  }

  // kept for the outside: a minute of the week, mapped back onto the slider
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
    /* The slider advances, not the clock: a night is a fixed number of ticks
       and passes at the same rate whatever speed the flying is played at, so
       the pause reads as a beat rather than as a stall. */
    var next = simTick + dt / 1000 * (+els.speed.value);
    if (next >= ticks) next = 0;       // round again at the end of the week
    setTick(next);
    raf = requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    var was = playing;
    playing = on;
    /* **The map draws itself differently while the week is running**, and only
       while it is running: the lines nobody has the times for are dimmed back
       so that what is left is the network actually being flown, and they come
       back to full strength the moment the reader pauses. The host is told
       here because this is the one place the answer changes — the button, the
       end of the week, and `unmount` all come through it. */
    if (was !== on && host && host.playChanged) {
      try { host.playChanged(on); } catch (e) { /* the drawing is not load-bearing */ }
    }
    /* A moving aeroplane is not a target — the reader would be chasing it, and
       every press would land on the map behind. Stopped, it answers. */
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
    /* **A notch where each day ends.** The slider is a week with the nights
       taken out, so without them the reader has no way to see that the run
       from 16:00 to 06:00 is a night rather than a gap in the sources. A
       `datalist` is the browser's own tick mark and needs no drawing. */
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
    /* Up over whichever routes the date draws. Rebuilt rather than filtered on
       an epoch change: the 1930 sheet has one service and the 1942 sheet has
       nineteen, and the geometry of a route that is not drawn is work nobody
       asked for. */
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
    /* Where this aeroplane has come from and where it is going, at the minute
       the clock is stopped at. `leg` is the one it is on; `done` and `left`
       are the calls behind and ahead of it on the same circuit. */
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
