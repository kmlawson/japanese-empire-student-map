/* theme-census.js — the 1931 census language maps, as a thematic layer.
 *
 * Mother tongues in the Census of India, 1931, from Konrad Lawson's Languages
 * of India, 1931 (https://kmlawson.github.io/playground-india-language/). Two
 * rows in the book, one module: by province (Vol. I, Table XV) and by district
 * (24 provincial and state volumes, on present-day boundaries). Fetched only
 * when one is chosen, with its figures: `tools/build_census.py` writes
 * `theme-census-langs.js` and the two geometry files.
 *
 * **What the reader does.** The map opens on the largest mother tongue in each
 * unit. A chip in the key or a row on a card maps one language as a share of
 * the population, and a group of the classification maps the whole group. The
 * info pane answers everything: pressing a unit gives its languages, pressing a
 * language gives where it was spoken, and from both a table opens with every
 * figure, sortable, with its source and a CSV (the rule in CLAUDE.md). What is
 * not here is on the full site, which the foot of every card links to.
 *
 * **The arithmetic is the source site's own**, and is kept the same on purpose:
 * `disp`, `leadLabel`, `assign` and `blocks` follow its app.js, districts-app.js
 * and langcolors.js, so a language has the same name and colour here as there
 * and a share comes to the same figure. Where it says Burma is coarse or a
 * Gwalior district is damaged, this says so too, in its words.
 *
 * Map units and screen pixels: nothing here computes a length. Labels are
 * placed by `placeThemeLabels` in map.js and strokes are `non-scaling-stroke`.
 */
window.JMAP_CENSUS = function (host) {
  'use strict';

  const CHIP = '1931 Census';
  const CHIP_INK = '#7a5c3e';
  const fmtInt = (n) => (n === undefined || n === null) ? '—' : Number(n).toLocaleString('en-US');
  function pct(x) {
    if (x === null || x === undefined || isNaN(x)) return '–';
    if (x === 0) return '0%';
    if (x < 0.01) return '<0.01%';
    if (x < 1) return x.toFixed(2) + '%';
    if (x < 10) return x.toFixed(1) + '%';
    return Math.round(x) + '%';
  }
  // the column's figure in a CSV: two places, so the file can be added up
  const pctNum = (x) => (x === null || x === undefined || isNaN(x)) ? null : Math.round(x * 100) / 100;

  function mk(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function plainButton(cls, text, fn) {
    const b = mk('button', 'plain ' + cls, text);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function linkTo(href, text) {
    const a = mk('a', '', text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  /* ---------------------------------------------------- the classification */

  const DATA = window.JMAP.CENSUS_DATA;
  const L = DATA.langs;
  L.forEach((l, i) => { l.id = i; });
  const IA = L.filter((l) => l.name === 'Indo-Aryan Branch')[0];
  // the two entries the district tables need, and the rest: see the source's
  // docs/regional.md, section 6
  const HU = { id: 'HU', name: 'Hindustani, Hindi or Urdu (as printed)', kids: [], parent: IA ? IA.id : null,
    note: 'Returned as Hindustani, Hindi or Urdu in volumes that did not divide it into Western Hindi, Eastern Hindi and Bihari (chiefly the United Provinces and Bihar and Orissa). Compare across provinces only with the composite.' };
  const HB = { id: 'HB', name: 'Hindustani + Western Hindi + Eastern Hindi + Bihari', kids: [], parent: null,
    composite: ['HU', 268, 265, 260],
    note: 'The only Hindi-area figure that means the same thing in every volume.' };
  const NM = { id: '?', name: 'Not matched to the Vol. I classification', kids: [], parent: null,
    note: 'Leaves whose printed name could not be placed in the all-India classification, mostly Burma’s “Indian languages” returned without further detail.' };
  const SPLIT_HINDI = { 268: 1, 265: 1, 260: 1 };
  const BYID = { HU: HU, HB: HB, '?': NM };
  L.forEach((l) => { BYID[l.id] = l; });

  const GENERIC = /^(others?\b|other\b|.*unspecified|unclassed$|.*not stated|.*n\.o\.s)/i;
  const SECTION_TAG = { A: 'languages of India', B: 'other Asiatic and African languages', C: 'European languages' };
  const NAME_COUNT = {};
  L.forEach((l) => { NAME_COUNT[l.name] = (NAME_COUNT[l.name] || 0) + 1; });
  function sectionOf(l) {
    while (l.parent !== null && l.parent !== undefined) l = L[l.parent];
    const m = /^([ABC])\./.exec(l.name);
    return m ? m[1] : null;
  }
  function disp(l) {
    if (typeof l.id === 'string') return l.name;
    const n = l.name.replace(/^[A-Z]\.\s*/, '');
    if (GENERIC.test(l.name) && l.parent !== null && l.parent !== undefined) {
      return l.name + ' (' + L[l.parent].name + ')';
    }
    const sec = NAME_COUNT[l.name] > 1 && l.kids.length ? sectionOf(l) : null;
    return sec ? n + ' (' + SECTION_TAG[sec] + ')' : n;
  }
  // the node's ancestors, root first, and the node itself last
  function pathOf(l) {
    const p = [];
    while (l) {
      p.unshift(l);
      l = (l.parent !== null && l.parent !== undefined) ? BYID[l.parent] : null;
    }
    return p;
  }
  const familyOf = (l) => { const p = pathOf(l); return p.length > 1 ? p[1].name : null; };
  // "A. Vernaculars of India" heads nearly everything and says nothing; the two
  // other sections do say something
  const pathText = (l) => pathOf(l).slice(0, -1).filter((a) => !/^A\./.test(a.name))
    .map((a) => a.name.replace(/^[A-Z]\.\s*/, '')).join(' › ');
  function leadLabel(l, u) {
    if (l.kids.length && !(u && u.coarse)) return 'Other (not itemised)';
    return l.name.replace(/^[A-Z]\.\s*/, '').replace(/ \(as printed\)$/, '').replace(/, Hindi or Urdu$/, '')
      .replace(/ or .*$/, '').replace(/ \(.*\)$/, '').replace(/ Group$/, '');
  }
  function scanVolI(l) {
    return l.leaf ? 'https://archive.org/details/' + DATA.volI + '/page/n' + l.leaf + '/mode/1up' : '';
  }

  /* ------------------------------------------------- related languages, in
     related colours: the source's langcolors.js, which fixes the shades over a
     list of every language that leads a unit on either map, so that a language
     is one colour on both. */
  const FAMILY_HUES = { 'Indo-European Family': [338, 72], 'Dravidian Family': [100, 160], 'Karen Family': [178, 178],
    'Tibeto-Chinese Family': [196, 268], 'Austric Family': [282, 318] };
  const FAMILY_ORDER = ['Indo-European Family', 'Dravidian Family', 'Karen Family', 'Tibeto-Chinese Family', 'Austric Family'];
  const OTHER_HUE = [30, 12, 58];
  const IE = 'Indo-European Family', TC = 'Tibeto-Chinese Family', DR = 'Dravidian Family', AU = 'Austric Family';
  const UNIVERSE = [[0, null], [9, AU], [21, AU], [35, TC], [56, TC], [61, TC], [77, TC], [93, TC], [95, TC],
    [116, TC], [142, TC], [144, TC], [145, TC], [178, TC], [190, 'Karen Family'], [211, DR], [212, DR], [213, DR],
    [221, DR], [226, DR], [228, DR], [233, IE], [234, IE], [241, IE], [242, IE], [253, IE], [254, IE], [256, IE],
    [259, IE], [260, IE], [261, IE], [262, IE], [265, IE], [268, IE], [268.5, IE], [269, IE], [270, IE], [271, IE],
    [273, IE], [276, IE], [277, IE], [278, IE]];
  function assignColours(items) {
    const slots = {}, out = {};
    UNIVERSE.concat(items.map((it) => [it.order, it.family])).forEach((x) => {
      if (!FAMILY_HUES[x[1]]) return;
      const a = slots[x[1]] = slots[x[1]] || [];
      if (a.indexOf(x[0]) < 0) a.push(x[0]);
    });
    Object.keys(slots).forEach((f) => { slots[f].sort((a, b) => a - b); });
    items.forEach((it) => {
      const f = FAMILY_HUES[it.family] ? it.family : null;
      if (!f) { out[it.key] = OTHER_HUE; return; }
      const list = slots[f], i = list.indexOf(it.order), n = list.length, r = FAMILY_HUES[f];
      const span = ((r[1] - r[0]) % 360 + 360) % 360;
      const h = r[0] + (n === 1 ? span / 2 : span * i / (n - 1));
      out[it.key] = [Math.round(((h % 360) + 360) % 360), [66, 58, 72][i % 3], [44, 34, 56][i % 3]];
    });
    return out;
  }
  function hsl(c, under) {
    if (!c) return null;
    return under
      ? 'hsl(' + c[0] + ' ' + Math.max(20, c[1] - 18) + '% ' + Math.min(80, c[2] + 24) + '%)'
      : 'hsl(' + c[0] + ' ' + c[1] + '% ' + c[2] + '%)';
  }

  /* One label for each contiguous block of units with the same leading
     language, on the unit nearest the block's area-weighted centre. */
  function blocksOf(list) {
    const byId = {}, seen = {}, out = [];
    list.forEach((u) => { byId[u.id] = u; });
    list.forEach((u) => {
      if (seen[u.id] || u.key === null) return;
      const st = [u], comp = [];
      seen[u.id] = 1;
      while (st.length) {
        const x = st.pop();
        comp.push(x);
        (x.nb || []).forEach((j) => {
          const y = byId[j];
          if (y && !seen[j] && y.key === u.key) { seen[j] = 1; st.push(y); }
        });
      }
      let A = 0, cx = 0, cy = 0;
      comp.forEach((c) => { const w = c.area || 1; A += w; cx += w * c.x; cy += w * c.y; });
      cx /= A; cy /= A;
      const best = comp.reduce((a, b) => {
        const da = (a.x - cx) * (a.x - cx) + (a.y - cy) * (a.y - cy);
        const db = (b.x - cx) * (b.x - cx) + (b.y - cy) * (b.y - cy);
        return db < da ? b : a;
      });
      out.push({ key: u.key, anchor: best.id, ids: comp.map((c) => c.id), n: comp.length });
    });
    return out;
  }

  /* --------------------------------------------------- one theme at a time */

  let rec = null, level = '', geom = null, layer = null;
  let units = [], byUnit = {};
  let mode = 'lead', lang = null, sel = null;
  let LEAVES = [], TOT = {}, LEAD_ITEMS = [], LEAD_COLORS = {};
  let sumAll = 0;

  const isDistrict = () => level === 'district';
  const unitWord = (plural) => isDistrict()
    ? (plural ? 'units' : 'unit') : (plural ? 'provinces and states' : 'province or state');

  function modelProvince() {
    const NOT_COMPARABLE = { 29: 1 };
    units = geom.units.map((g) => {
      const U = DATA.units[g.code];
      return { id: g.code, g: g, name: U.name, short: U.short, type: U.type, pop: U.pop || [0, 0, 0],
        P: U.pop ? U.pop[0] : 0, flag: U.flag, nc: !!NOT_COMPARABLE[g.code], status: 'ok',
        nb: g.nb, ar: g.ar, at: g.at };
    });
    (geom.extra || []).forEach((g) => {
      units.push({ id: 'x_' + g.key, g: g, name: g.name, short: g.name, type: 'extra', pop: [0, 0, 0], P: 0,
        status: 'nodata', note: g.note, nb: [], ar: 0, at: null });
    });
    LEAVES = L.filter((l) => !l.kids.length);
    LEAVES.forEach((l) => { TOT[l.id] = 0; });
    L.forEach((l) => { TOT[l.id] = l.v.INDIA ? l.v.INDIA[0] : 0; });
    units.forEach((u) => {
      if (u.status !== 'ok') return;
      let best = null, bn = -1;
      LEAVES.forEach((l) => {
        const t = l.v[u.id], n = t ? (t[0] || 0) : 0;
        if (n > bn) { bn = n; best = l; }
      });
      u.lead = best ? { l: best, n: bn } : null;
    });
    sumAll = DATA.units.INDIA.pop[0];
    const seen = {};
    LEAD_ITEMS = [];
    units.forEach((u) => {
      if (u.nc || !u.lead) return;
      const k = String(u.lead.l.id);
      if (seen[k]) return;
      seen[k] = 1;
      LEAD_ITEMS.push({ key: k, family: familyOf(u.lead.l), order: u.lead.l.id, label: leadLabel(u.lead.l), l: u.lead.l });
    });
  }

  function ancestorIds(id) {
    const out = [];
    let l = BYID[id];
    while (l) {
      out.push(l.id);
      l = (l.parent !== null && l.parent !== undefined) ? BYID[l.parent] : null;
    }
    return out;
  }

  function modelDistrict() {
    units = geom.units.map((g, i) => {
      const u = { id: String(i), i: i, g: g, name: g.short, short: g.short, type: 'unit', pop: g.pop, P: g.P, S: g.S,
        status: g.status, note: g.note || '', coarse: !!g.coarse, dmg: !!g.dmg, a31: g.a31 || 0, nb: g.nb.map(String),
        ar: g.ar, at: g.at, vals: g.vals, members: g.members, shapes: g.shapes, missing31: g.missing31 || [], agg: {} };
      Object.keys(g.vals).forEach((k) => {
        const id = (k === 'HU' || k === '?') ? k : +k;
        ancestorIds(id).forEach((a) => { u.agg[a] = (u.agg[a] || 0) + g.vals[k][0]; });
      });
      u.agg.HB = HB.composite.reduce((s, k) => s + (g.vals[k] ? g.vals[k][0] : 0), 0);
      u.gaps = g.members.filter((m) => m.check && m.check[0]
        && Math.abs(m.check[0] - m.check[1]) / m.check[0] > 0.01);
      let best = null;
      Object.keys(g.vals).forEach((k) => {
        if (k !== '?' && (!best || g.vals[k][0] > g.vals[best][0])) best = k;
      });
      u.lead = best ? { l: BYID[best === 'HU' ? 'HU' : +best], n: g.vals[best][0] } : null;
      return u;
    });
    TOT = {};
    units.forEach((u) => { Object.keys(u.agg).forEach((k) => { TOT[k] = (TOT[k] || 0) + u.agg[k]; }); });
    sumAll = units.reduce((s, u) => s + (u.P || 0), 0);
    LEAVES = L.concat([HU, NM]).filter((l) => TOT[l.id] > 0 && !l.kids.length);
    // a group that also holds figures of its own is a leaf of the volumes
    units.forEach((u) => {
      Object.keys(u.vals).forEach((k) => {
        const l = BYID[(k === 'HU' || k === '?') ? k : +k];
        if (LEAVES.indexOf(l) < 0) LEAVES.push(l);
      });
    });
    LEAVES.sort((a, b) => TOT[b.id] - TOT[a.id]);
    const seen = {};
    LEAD_ITEMS = [];
    units.forEach((u) => {
      const k = leadKey(u);
      if (k === null || seen[k]) return;
      seen[k] = 1;
      const l = u.lead.l;
      LEAD_ITEMS.push({ key: k, family: l === NM ? null : familyOf(l),
        order: l === HU ? 268.5 : typeof l.id === 'number' ? l.id : 9999,
        label: leadLabel(l, u), l: l });
    });
  }

  /* ----------------------------------------------------- what a unit shows */

  const COARSE = 'Burma’s district tables give language groups only; the Indian languages are one lump (“Indian languages”).';

  function itemised(u) {
    if (!isDistrict()) return !u.nc;
    return mode === 'lang' && lang ? itemisedFor(lang, u) : !u.dmg;
  }
  /* Burma's tables hold language groups, so an entry they do not give is grey.
     The composite is the one thing always present in `agg`, as a nought, and
     that nought is not a count: the Indian languages there are one lump. Grey
     too, as the source's docs/regional.md, section 9, has it; its own page
     currently shows Burma as "none recorded" for this one entry. */
  function itemisedFor(l, u) {
    return !u.dmg && (!u.coarse || (l !== HB && l.id in u.agg));
  }
  function hasFigures(u) { return u.status === 'ok' && !!u.P; }
  function mapped(u) { return hasFigures(u) && itemised(u); }
  function leadKey(u) {
    if (!isDistrict()) return u.lead && !u.nc ? String(u.lead.l.id) : null;
    return u.status === 'ok' && u.lead && u.P && !u.dmg ? String(u.lead.l.id) : null;
  }
  function persons(l, u) {
    if (isDistrict()) return u.agg[l.id] || 0;
    const t = l.v && l.v[u.id];
    return t ? (t[0] || 0) : 0;
  }
  function triple(l, u) {
    if (isDistrict()) return u.vals[l.id] || null;
    return (l.v && l.v[u.id]) || null;
  }
  function shareOf(l, u) { return u.P ? persons(l, u) / u.P * 100 : 0; }
  function value(u) {
    if (mode === 'lang') return shareOf(lang, u);
    return u.lead && u.P ? u.lead.n / u.P * 100 : null;
  }
  function leadName(u) {
    if (!u.lead) return '';
    return (isDistrict() && u.lead.l.kids.length && !u.coarse)
      ? disp(u.lead.l) + ': other or unspecified' : disp(u.lead.l);
  }
  function statusNote(u) {
    if (u.status !== 'ok') return u.note || 'No 1931 figures.';
    if (!isDistrict()) return DATA.unitNotes[u.id] || '';
    const out = [];
    if (u.dmg) {
      out.push(u.a31
        ? 'Not mapped: the printed population is illegible, and the legible language figures (' + fmtInt(u.S)
          + ') are far below the 1931 population of this area (' + fmtInt(u.a31) + ', Census 2011 Table A-2).'
        : 'Not mapped: the language figures legible in the scan cover only ' + pct(u.S / u.P * 100)
          + ' of the printed population.');
    }
    if (u.missing31.length) out.push('Incomplete: no district figures for ' + u.missing31.join(', ') + '.');
    u.gaps.forEach((m) => {
      out.push(m.area + ': the language figures add up to ' + fmtInt(m.check[1]) + ', the printed population is '
        + fmtInt(m.check[0]) + ' (illegible or damaged cells, or a misprint).');
    });
    return out.join(' ');
  }

  // the unit's returns, largest first: { l, n, t } with `t` persons/males/females
  function returnsOf(u) {
    if (u.status !== 'ok') return [];
    if (isDistrict()) {
      return Object.keys(u.vals).map((k) => {
        const l = BYID[(k === 'HU' || k === '?') ? k : +k];
        return { l: l, n: u.vals[k][0], t: u.vals[k] };
      }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    }
    return LEAVES.map((l) => ({ l: l, n: persons(l, u), t: l.v[u.id] }))
      .filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  }
  function returnName(x, u) {
    return (isDistrict() && x.l.kids.length && !u.coarse)
      ? disp(x.l) + ': other or unspecified' : disp(x.l);
  }

  /* ---------------------------------------------------------- the drawing */

  const RAMP = ['var(--cen-s0)', 'var(--cen-s1)', 'var(--cen-s2)', 'var(--cen-s3)',
                'var(--cen-s4)', 'var(--cen-s5)', 'var(--cen-s6)'];
  const CUTS = [0.1, 1, 5, 15, 35, 65];
  const TICKS = ['>0', '0.1', '1', '5', '15', '35', '65%'];
  function bin(v) {
    let i = 0;
    while (i < CUTS.length && v >= CUTS[i]) i++;
    return i;
  }

  function fillAll() {
    units.forEach((u) => {
      if (!u.el) return;
      let c = 'var(--cen-nofig)';
      if (mapped(u)) {
        if (mode === 'lead') {
          const k = leadKey(u);
          if (k !== null) c = hsl(LEAD_COLORS[k], value(u) < 50);
        } else {
          const v = value(u);
          c = v ? RAMP[bin(v)] : 'var(--cen-zero)';
        }
      }
      u.el.style.fill = c;
    });
  }

  function paint() {
    fillAll();
    host.setLabels(labelList());
    host.rebuildKey();
    syncBack();
  }

  /* **The way back, on the map itself.** A reader who has pressed a language is
     looking at the map, not at a line in the card or the foot of a long key, so
     the button sits over the map for as long as one language is showing.
     It lives in `#map-container` so that it centres on the map and not on the
     map plus the side column; `dockPanels` keeps it clear of everything else
     (`DOCK_LIFT` in map.js). The container starts a drag on any press inside
     it, so the press stops here. */
  let backBtn = null;
  function mountBack() {
    if (backBtn) return;
    backBtn = mk('button', '', '← Back to the largest language');
    backBtn.id = 'cen-back';
    backBtn.type = 'button';
    backBtn.hidden = true;
    backBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    backBtn.addEventListener('dblclick', (e) => e.stopPropagation());
    backBtn.addEventListener('click', setLead);
    document.getElementById('map-container').appendChild(backBtn);
  }
  function unmountBack() {
    if (backBtn) backBtn.remove();
    backBtn = null;
  }
  function syncBack() {
    if (backBtn) backBtn.hidden = mode !== 'lang';
  }

  function blockWidth(ids) {
    let x0 = Infinity, x1 = -Infinity;
    ids.forEach((id) => {
      const u = byUnit[id];
      if (!u || !u.el || !u.el.isConnected) return;
      try {
        const b = u.el.getBBox();
        x0 = Math.min(x0, b.x);
        x1 = Math.max(x1, b.x + b.width);
      } catch (err) { /* not laid out */ }
    });
    return isFinite(x0) ? x1 - x0 : 0;
  }

  function labelList() {
    if (mode === 'lead') {
      return blocksOf(units.filter((u) => u.at && leadKey(u) !== null).map((u) => ({
        id: u.id, key: leadKey(u), nb: u.nb, area: u.ar, x: u.at[0], y: u.at[1],
      }))).map((bk) => {
        const u = byUnit[bk.anchor];
        return { lon: u.at[0], lat: u.at[1], text: leadLabel(u.lead.l, u),
          measure: () => blockWidth(bk.ids) };
      });
    }
    const min = isDistrict() ? 0.5 : 0;
    return units.filter((u) => u.at && u.el && mapped(u) && value(u) > min).map((u) => ({
      lon: u.at[0], lat: u.at[1], text: pct(value(u)), ap: u.el,
    }));
  }

  function setLang(l, opts) {
    mode = 'lang';
    lang = l;
    paint();
    if (!(opts && opts.keepCard)) languageCard(l);
    else if (sel) unitCard(sel);
  }
  function setLead() {
    mode = 'lead';
    lang = null;
    paint();
    if (sel) unitCard(sel);
    else overviewCard();
  }

  function markSelected(u) {
    if (sel && sel.el) sel.el.classList.remove('sel');
    sel = u || null;
    if (sel && sel.el && layer) {
      sel.el.classList.add('sel');
      // above its neighbours, so all of its outline shows; still under the
      // province lines and the names, which come after the last area
      const above = layer.querySelector('.census-prov, .theme-label');
      layer.insertBefore(sel.el, above);
    }
  }

  /* ------------------------------------------------------------- the card */

  /* The link to the full site is not here: it is `#info-theme-foot` in the
     page, under whatever card is open. See `syncThemeFoot` in map.js. */
  function card(block, render) {
    host.showCard({ chip: CHIP, colour: CHIP_INK, primary: block.primary, alt: block.alt || '',
      prov: block.prov || '', note: block.note || '' },
    (h) => { h.textContent = ''; h.hidden = false; render(h); });
  }

  function bars(rows, onPick, isOn) {
    const ul = mk('ul', 'cen-bars');
    const max = rows.reduce((m, r) => Math.max(m, r.n), 0) || 1;
    rows.forEach((r) => {
      const li = mk('li');
      const b = mk('button', 'cen-bar' + (isOn && isOn(r) ? ' on' : ''));
      b.type = 'button';
      b.appendChild(mk('span', 'nm', r.name));
      b.appendChild(mk('span', 'val', r.val));
      const tr = mk('span', 'track');
      const fi = mk('span', 'fill');
      fi.style.width = (r.n / max * 100).toFixed(1) + '%';
      tr.appendChild(fi);
      b.appendChild(tr);
      b.addEventListener('click', () => onPick(r));
      li.appendChild(b);
      ul.appendChild(li);
    });
    return ul;
  }

  function buttonsRow(h, list) {
    const row = mk('p', 'cen-actions');
    list.forEach((x) => { if (x) row.appendChild(x); });
    h.appendChild(row);
  }

  function mapNowLine(h, u, onItsCard) {
    if (mode !== 'lang') return;
    const line = mk('p', 'cen-now');
    if (!onItsCard) {
      line.appendChild(document.createTextNode('The map shows ' + disp(lang)
        + (u ? ': ' + pct(shareOf(lang, u)) + ' here. ' : '. ')));
      line.appendChild(plainLink('About it', () => languageCard(lang)));
      line.appendChild(document.createTextNode(' · '));
    }
    line.appendChild(plainLink('Back to the largest language', setLead));
    h.appendChild(line);
  }
  function plainLink(text, fn) {
    const b = mk('button', 'cen-link', text);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  function overviewCard() {
    markSelected(null);
    const top = LEAVES.map((l) => ({ l: l, n: TOT[l.id] || 0 }))
      .filter((x) => x.n > 0 && x.l !== NM).sort((a, b) => b.n - a.n).slice(0, 10);
    card({
      primary: rec.en,
      alt: isDistrict() ? 'Mother tongues in the provincial and state volumes' : 'Mother tongues in the all-India volume',
      prov: fmtInt(sumAll) + ' people in Table XV',
      note: isDistrict()
        ? 'A map unit is often larger than one 1931 district: nothing is apportioned, and every shape is a present-day boundary standing in for the 1931 areas it holds.'
        : 'Mother tongue was what the enumerator wrote down, and the language classification is the census’s own.',
    }, (h) => {
      mapNowLine(h, null);
      h.appendChild(mk('p', 'pop-head', 'Largest mother tongues'));
      h.appendChild(bars(top.map((x) => ({ l: x.l, n: x.n, name: disp(x.l),
        val: fmtInt(x.n) + ' · ' + pct(x.n / sumAll * 100) })), (r) => setLang(r.l),
      (r) => mode === 'lang' && lang === r.l));
      buttonsRow(h, [plainButton('pop-more', 'All languages', allLanguagesTable),
        plainButton('pop-more', isDistrict() ? 'All map units' : 'All provinces and states', allUnitsTable)]);
    });
  }

  function unitCard(u) {
    markSelected(u);
    const note = statusNote(u);
    if (u.status !== 'ok') {
      card({ primary: u.name, alt: 'No 1931 figures to show', note: note }, (h) => { void h; });
      return;
    }
    const popLine = 'Population ' + fmtInt(u.pop[0]) + ' (' + fmtInt(u.pop[1]) + ' m, ' + fmtInt(u.pop[2]) + ' f)';
    const list = returnsOf(u);
    card({
      primary: u.name,
      alt: isDistrict() ? shapesLine(u) : (u.type === 'prov' ? 'Province' : 'State or agency'),
      prov: popLine,
      note: [u.coarse ? COARSE : '', note].filter(Boolean).join(' '),
    }, (h) => {
      mapNowLine(h, u);
      if (list.length) {
        h.appendChild(mk('p', 'pop-head', 'Mother tongues, 1931'));
        h.appendChild(bars(list.slice(0, 8).map((x) => ({ l: x.l, n: x.n, name: returnName(x, u),
          val: fmtInt(x.n) + ' · ' + pct(u.P ? x.n / u.P * 100 : 0) })),
        (r) => setLang(r.l, { keepCard: true }), (r) => mode === 'lang' && lang === r.l));
      }
      if (!isDistrict() && DATA.subs[u.id]) subUnitsBlock(h, u);
      buttonsRow(h, [
        list.length ? plainButton('pop-more', 'All ' + list.length + ' languages here', () => unitLanguagesTable(u)) : null,
        isDistrict() && u.members.length
          ? plainButton('pop-more', u.members.length > 1 ? 'The ' + u.members.length + ' areas of 1931' : 'The area of 1931', () => areasTable(u)) : null,
      ]);
    });
  }

  // what is drawn, where it is not simply the unit's own name
  function shapesLine(u) {
    const names = u.shapes.map((s) => s.replace(/ \((India|Pakistan|Bangladesh|Burma, 1931)\)$/, ''));
    if (!names.length || names.join(', ') === u.name) return '';
    return 'Drawn on present-day ' + names.slice(0, 4).join(', ')
      + (names.length > 4 ? ' and ' + (names.length - 4) + ' more' : '');
  }

  function subUnitsBlock(h, u) {
    h.appendChild(mk('p', 'pop-head', 'Printed separately inside this row'));
    DATA.subs[u.id].forEach((code) => {
      const S = DATA.units[code];
      const p = mk('p', 'pop-note');
      let best = null, bn = -1;
      LEAVES.forEach((l) => {
        const t = l.v[code], n = t ? (t[0] || 0) : 0;
        if (n > bn) { bn = n; best = l; }
      });
      p.textContent = S.name + ': ' + fmtInt(S.pop[0]) + ' people; largest '
        + (best ? disp(best) + ' ' + pct(bn / S.pop[0] * 100) : '–') + '.';
      h.appendChild(p);
    });
  }

  function languageCard(l) {
    markSelected(null);
    const national = l.v && l.v.INDIA ? l.v.INDIA[0] : null;
    let prov;
    if (isDistrict()) {
      prov = fmtInt(TOT[l.id] || 0) + ' speakers in the district tables'
        + (national ? ' · ' + fmtInt(national) + ' in Vol. I' : '');
    } else {
      prov = fmtInt(national || 0) + ' speakers · ' + pct((national || 0) / sumAll * 100) + ' of the population';
    }
    const notes = [];
    if (typeof l.id === 'string') notes.push(l.note);
    if (isDistrict() && SPLIT_HINDI[l.id]) {
      notes.push('In the United Provinces and Bihar and Orissa volumes these speakers are mostly inside “Hindustani, Hindi or Urdu (as printed)”. Use the composite for a comparable map.');
    }
    if (l.computed) notes.push('The printed table gives no total for this group. The figures are the sum of its members.');
    card({
      primary: disp(l),
      alt: typeof l.id === 'number' ? pathText(l) : '',
      prov: prov,
      note: notes.join(' '),
    }, (h) => {
      mapNowLine(h, null, mode === 'lang' && lang === l);
      if (typeof l.id === 'number') classification(h, l);
      const members = kidsOf(l);
      if (members.length) {
        h.appendChild(mk('p', 'pop-head', 'Includes'));
        h.appendChild(bars(members.slice(0, 10).map((k) => ({ l: k, n: TOT[k.id] || 0,
          name: disp(k) + (k.kids.length ? ' ›' : ''), val: fmtInt(TOT[k.id] || 0) })), (r) => setLang(r.l)));
      }
      const here = units.filter((u) => mapped(u) && persons(l, u) > 0)
        .sort((a, b) => persons(l, b) - persons(l, a)).slice(0, 8);
      if (here.length) {
        h.appendChild(mk('p', 'pop-head', 'Most speakers in'));
        h.appendChild(bars(here.map((u) => ({ u: u, n: persons(l, u), name: u.short,
          val: fmtInt(persons(l, u)) + ' · ' + pct(shareOf(l, u)) })), (r) => unitCard(r.u)));
      }
      const be = bilOf(l);
      buttonsRow(h, [
        plainButton('pop-more', 'In every ' + unitWord(false), () => languageTable(l)),
        be ? plainButton('pop-more', 'Second languages of its speakers', () => secondLanguagesTable(be)) : null,
      ]);
      if (l.col) {
        const s = mk('p', 'pop-src', 'Table XV Part I, cols. ' + l.col + '–' + (l.col + 2) + ', printed p. ' + (l.page || '?') + ': ');
        s.appendChild(linkTo(scanVolI(l), 'page scan ↗'));
        h.appendChild(s);
      }
    });
  }

  function classification(h, l) {
    const path = pathOf(l).slice(0, -1).filter((a) => (TOT[a.id] || 0) > 0);
    if (!path.length) return;
    const p = mk('p', 'cen-path');
    p.appendChild(document.createTextNode('Map the whole of: '));
    path.forEach((a, i) => {
      if (i) p.appendChild(document.createTextNode(' › '));
      p.appendChild(plainLink(a.name.replace(/^[A-Z]\.\s*/, ''), () => setLang(a)));
    });
    h.appendChild(p);
  }

  function kidsOf(l) {
    const ks = (l.kids || []).map((k) => L[k]).filter((k) => (TOT[k.id] || 0) > 0);
    if (isDistrict() && l === IA && (TOT.HU || 0) > 0) ks.push(HU);
    return ks.sort((a, b) => (TOT[b.id] || 0) - (TOT[a.id] || 0));
  }

  function bilOf(l) {
    return (DATA.bil || []).filter((e) => e.lang === l.id)[0] || null;
  }

  /* ----------------------------------------------------------- the tables */

  function openTable(title, cols, rows, opts) {
    const o = opts || {};
    const dlg = host.tableBox();
    if (!dlg) return;
    dlg.querySelector('.table-title').textContent = CHIP;
    const open = dlg.querySelector('.table-open');
    if (open) open.hidden = true;
    const body = dlg.querySelector('.table-body');
    body.textContent = '';
    const wrap = mk('div', 'pop-table-block');
    wrap.appendChild(mk('p', 'pop-head', title));
    (o.intro || []).forEach((n) => { wrap.appendChild(mk('p', 'pop-note', n)); });
    const tableEl = host.popSortable(cols, rows, o.here);
    if (o.filter) {
      const f = document.createElement('input');
      f.type = 'search';
      f.className = 'cen-filter';
      f.placeholder = o.filter;
      f.setAttribute('aria-label', o.filter);
      f.addEventListener('input', () => tableEl.setFilter(f.value));
      wrap.appendChild(f);
    }
    wrap.appendChild(tableEl);
    (o.notes || []).forEach((n) => { wrap.appendChild(mk('p', 'pop-note', '* ' + n)); });
    const src = mk('p', 'pop-src');
    if (o.srcUrl) src.appendChild(linkTo(o.srcUrl, o.source));
    else src.textContent = o.source;
    wrap.appendChild(src);
    host.addCsvButton(wrap, tableEl, title, (o.intro || []).concat(o.notes || []), o.source);
    wrap.appendChild(host.moreLink());
    body.appendChild(wrap);
    if (!dlg.open) dlg.showModal();
    body.scrollTop = 0;
  }
  function closeTable() {
    const dlg = host.tableBox();
    if (dlg && dlg.open) dlg.close();
  }
  const numCell = (n, shown) => ({ n: n === undefined ? null : n, t: shown !== undefined ? shown : fmtInt(n) });
  const textCell = (t) => ({ n: null, t: t || '—' });
  const source = () => (isDistrict() ? DATA.sources.district : DATA.sources.province);

  function markOf(l, code) {
    return (l.f && l.f[code]) || null;
  }

  function unitLanguagesTable(u) {
    const list = returnsOf(u);
    const cols = [{ head: 'Language' }, { head: 'Persons' }, { head: 'Males' }, { head: 'Females' },
      { head: '% of population' }, { head: 'Classification', text: true }];
    if (!isDistrict()) cols.push({ head: 'Printed page', text: true });
    const notes = [];
    const rows = list.map((x) => {
      const fl = isDistrict() ? null : markOf(x.l, u.id);
      if (fl) notes.push(disp(x.l) + ': ' + fl[0] + ' ' + fl[1]);
      const t = x.t || [x.n, null, null];
      const cells = [{ n: null, t: returnName(x, u) },
        numCell(t[0], fmtInt(t[0]) + (fl ? ' ' + fl[0] : '')), numCell(t[1]), numCell(t[2]),
        numCell(pctNum(u.P ? x.n / u.P * 100 : null), pct(u.P ? x.n / u.P * 100 : null)),
        textCell(typeof x.l.id === 'number' ? pathText(x.l) : '')];
      if (!isDistrict()) {
        cells.push(x.l.page ? { n: null, t: 'p. ' + x.l.page, links: [{ t: 'p. ' + x.l.page, href: scanVolI(x.l) }] } : textCell(''));
      }
      return { key: String(x.l.id), cells: cells,
        pick: () => { closeTable(); setLang(x.l, { keepCard: true }); } };
    });
    rows.unshift({ pinned: true, key: 'all', cells: [{ n: null, t: 'Population' }, numCell(u.pop[0]), numCell(u.pop[1]), numCell(u.pop[2]),
      numCell(100, '100%'), textCell('')].concat(isDistrict() ? [] : [textCell('')]) });
    openTable('Mother tongues in ' + u.name + ', 1931', cols, rows, {
      intro: [isDistrict() ? 'Press a language to map it.' : 'Press a language to map it. Printed pages link to the scan.'],
      notes: (u.coarse ? [COARSE] : []).concat(statusNote(u) ? [statusNote(u)] : []).concat(notes),
      source: source(), filter: 'Filter by language or family',
    });
  }

  function languageTable(l) {
    const cols = [{ head: isDistrict() ? 'Map unit' : 'Province or state' }, { head: 'Persons' }];
    if (!isDistrict() || !l.kids.length) { cols.push({ head: 'Males' }); cols.push({ head: 'Females' }); }
    cols.push({ head: '% of population' }, { head: '% of its speakers' });
    const allSpeakers = TOT[l.id] || 0;
    const notes = [];
    const showMF = cols.length === 6;
    const rows = units.filter((u) => u.status === 'ok' && u.P && (isDistrict() ? itemisedFor(l, u) : true)).map((u) => {
      const t = triple(l, u) || [persons(l, u), null, null];
      const fl = isDistrict() ? null : markOf(l, u.id);
      if (fl) notes.push(u.name + ': ' + fl[0] + ' ' + fl[1]);
      const n = persons(l, u);
      const cells = [{ n: null, t: u.name }, numCell(n, fmtInt(n) + (fl ? ' ' + fl[0] : ''))];
      if (showMF) { cells.push(numCell(t[1])); cells.push(numCell(t[2])); }
      cells.push(numCell(pctNum(shareOf(l, u)), pct(shareOf(l, u))));
      cells.push(numCell(pctNum(allSpeakers ? n / allSpeakers * 100 : null), pct(allSpeakers ? n / allSpeakers * 100 : null)));
      return { key: u.id, cells: cells, pick: () => { closeTable(); pickUnit(u); } };
    });
    if (!isDistrict() && l.v.INDIA) {
      const t = l.v.INDIA;
      rows.unshift({ pinned: true, key: 'INDIA', cells: [{ n: null, t: 'India' }, numCell(t[0]), numCell(t[1]), numCell(t[2]),
        numCell(pctNum(t[0] / sumAll * 100), pct(t[0] / sumAll * 100)), numCell(100, '100%')] });
    }
    const intro = ['Press a row to open it on the map.'];
    if (isDistrict() && SPLIT_HINDI[l.id]) intro.push('In the United Provinces and Bihar and Orissa volumes these speakers are mostly inside “Hindustani, Hindi or Urdu (as printed)”.');
    openTable(disp(l) + ' in every ' + unitWord(false) + ', 1931', cols, rows, {
      intro: intro, notes: notes, source: source(), srcUrl: '', filter: 'Filter by name',
    });
  }


  function allLanguagesTable() {
    const totals = {};
    if (isDistrict()) {
      units.forEach((u) => {
        Object.keys(u.vals).forEach((k) => {
          const t = totals[k] = totals[k] || [0, 0, 0];
          t[0] += u.vals[k][0] || 0; t[1] += u.vals[k][1] || 0; t[2] += u.vals[k][2] || 0;
        });
      });
    }
    const list = isDistrict()
      ? LEAVES.map((l) => ({ l: l, t: totals[l.id] || [TOT[l.id] || 0, null, null] }))
      : LEAVES.filter((l) => TOT[l.id] > 0).map((l) => ({ l: l, t: l.v.INDIA }));
    const cols = [{ head: 'Language' }, { head: isDistrict() ? 'In the district tables' : 'Persons' },
      { head: 'Males' }, { head: 'Females' }, { head: '% of population' }, { head: 'Classification', text: true }];
    const rows = list.map((x) => ({
      key: String(x.l.id),
      search: typeof x.l.id === 'number' ? pathText(x.l) : '',
      cells: [{ n: null, t: disp(x.l) }, numCell(x.t[0]), numCell(x.t[1]), numCell(x.t[2]),
        numCell(pctNum(x.t[0] / sumAll * 100), pct(x.t[0] / sumAll * 100)),
        textCell(typeof x.l.id === 'number' ? pathText(x.l) : '')],
      pick: () => { closeTable(); setLang(x.l); },
    }));
    if (isDistrict()) {
      const n = TOT.HB || 0;
      rows.unshift({ pinned: true, key: 'HB', cells: [{ n: null, t: 'Hindi composite: ' + HB.name }, numCell(n), numCell(null), numCell(null),
        numCell(pctNum(n / sumAll * 100), pct(n / sumAll * 100)), textCell('')],
      pick: () => { closeTable(); setLang(HB); } });
    }
    openTable('All mother tongues, 1931', cols, rows, {
      intro: ['Press a language to map it.'].concat(isDistrict() ? [HB.note + ' ' + HU.note] : []),
      source: source(), filter: 'Filter by language or family',
    });
  }

  function allUnitsTable() {
    const cols = [{ head: isDistrict() ? 'Map unit' : 'Province or state' }, { head: 'Population' },
      { head: 'Largest language', text: true }, { head: 'Its share' },
      { head: 'Next language', text: true }, { head: 'Its share' }, { head: 'Entries returned' }];
    const rows = units.filter((u) => u.status === 'ok' && u.P).map((u) => {
      const list = isDistrict() && u.dmg ? [] : returnsOf(u);
      const a = list[0], b = list[1];
      return { key: u.id, cells: [{ n: null, t: u.name }, numCell(u.P),
        textCell(a ? returnName(a, u) : ''), numCell(a ? pctNum(a.n / u.P * 100) : null, a ? pct(a.n / u.P * 100) : '—'),
        textCell(b ? returnName(b, u) : ''), numCell(b ? pctNum(b.n / u.P * 100) : null, b ? pct(b.n / u.P * 100) : '—'),
        numCell(list.length)], pick: () => { closeTable(); pickUnit(u); } };
    });
    openTable(isDistrict() ? 'Largest mother tongue in each map unit, 1931' : 'Largest mother tongue in each province and state, 1931', cols, rows, {
      intro: ['Press a row to open it on the map.'], source: source(), filter: 'Filter by name',
    });
  }

  function secondLanguagesTable(e) {
    const cols = [{ head: 'Second language' }, { head: 'Persons' }, { head: '% of speakers in the return' }];
    const rows = e.subs.map((x) => ({ key: x.name, cells: [{ n: null, t: x.name },
      x.n === null ? { n: null, t: '?' } : numCell(x.n),
      numCell(x.n !== null && e.total ? pctNum(x.n / e.total * 100) : null, x.n !== null && e.total ? pct(x.n / e.total * 100) : '—')] }));
    if (e.bilingual !== null) {
      rows.unshift({ pinned: true, key: 'all', cells: [{ n: null, t: 'Returned a second language' }, numCell(e.bilingual),
        numCell(e.total ? pctNum(e.bilingual / e.total * 100) : null, e.total ? pct(e.bilingual / e.total * 100) : '—')] });
    }
    const intro = ['Part II is a sample, from ' + e.areas.join(', ') + ' only'
      + (e.coverage !== null && e.coverage !== undefined
        ? ': it covers ' + fmtInt(e.total) + ' of the ' + fmtInt(e.india) + ' speakers in Part I (' + e.coverage + '%).' : '.')];
    const notes = [];
    if (e.diff) notes.push('In the print these counts add up to ' + fmtInt(e.sum) + ', not the ' + fmtInt(e.bilingual) + ' given as the total. Both are shown as printed.');
    if (e.note) notes.push('Transcription note: ' + e.note);
    openTable('Second languages of ' + e.mt + ' speakers, 1931', cols, rows, {
      intro: intro, notes: notes, source: DATA.sources.bilingual,
      srcUrl: e.leaf ? 'https://archive.org/details/' + DATA.volI + '/page/n' + e.leaf + '/mode/1up' : '',
    });
  }

  function areasTable(u) {
    const vols = geom.vols || {};
    const cols = [{ head: '1931 area' }, { head: 'Printed population' }, { head: 'Language figures' },
      { head: 'Under', text: true }, { head: 'Volume', text: true }, { head: 'Printed pages', text: true }];
    const rows = u.members.map((m, i) => {
      const v = vols[m.vol] || {};
      const links = (m.leaves || []).map((leaf, j) => ({
        t: 'p. ' + (m.pages[j] === null || m.pages[j] === undefined ? 'n' + leaf : m.pages[j]),
        href: v.id ? 'https://archive.org/details/' + v.id + '/page/n' + leaf + '/mode/1up' : '',
      })).filter((x) => x.href);
      return { key: String(i), cells: [{ n: null, t: m.area },
        numCell(m.check ? m.check[0] : null), numCell(m.check ? m.check[1] : null),
        textCell((m.path || []).slice(1).join(' › ')),
        textCell(m.vol === 'india' ? 'Vol. I (no district table)' : (v.title || m.vol)),
        { n: null, t: links.map((x) => x.t).join(', ') || '—', links: links }] };
    });
    openTable('The 1931 areas in ' + u.name, cols, rows, {
      intro: [u.members.length > 1
        ? 'Shown together because present-day districts were formed from parts of more than one of these areas. The figures are the sum of the areas as printed; none are split by estimate.'
        : 'Printed pages link to the scan.'],
      source: DATA.sources.district,
    });
  }

  function pickUnit(u) {
    unitCard(u);
    host.showUnit(u.el);
  }

  /* ------------------------------------------------------------ the module */

  const api = {
    /* Draw the theme into its group. Called by `buildTheme`. */
    build(g, theRec, theGeom) {
      rec = theRec;
      level = rec.level;
      geom = theGeom;
      layer = g;
      mode = 'lead';
      lang = null;
      sel = null;
      if (isDistrict()) modelDistrict(); else modelProvince();
      LEAD_COLORS = assignColours(LEAD_ITEMS);
      byUnit = {};
      host.under(g, rec.under || []);
      units.forEach((u) => {
        byUnit[u.id] = u;
        const d = host.ringsD(u.g.r);
        if (!d) return;
        const cls = 'theme-area census-area' + (isDistrict() ? ' census-fine' : '');
        const el = host.svgEl('path', { d: d, 'class': cls, 'data-unit': u.id });
        g.appendChild(el);
        u.el = el;
      });
      (geom.prov || []).forEach((p) => {
        const d = host.ringsD(p.r);
        if (d) g.appendChild(host.svgEl('path', { d: d, 'class': 'census-prov' }));
      });
      fillAll();
      host.setLabels(labelList(), true);
      host.labelsInto(g);
      mountBack();
      syncBack();
    },

    /* The theme is up: say what it is, in the pane it will answer in. */
    opened() { overviewCard(); },

    /* The theme has gone. The card goes with it if it is one of ours. */
    unmount() {
      unmountBack();
      markSelected(null);
      layer = null;
      units = [];
      byUnit = {};
    },
    ownsCard(chipText) { return chipText === CHIP; },

    /* Pressed, on the map. */
    tap(area) {
      const u = byUnit[area.getAttribute('data-unit')];
      if (u) unitCard(u);
    },
    /* Any other card opened, or the card closed. */
    released() { markSelected(null); },

    tipKey() { return (lang ? lang.id : 'lead') + '|' + mode; },

    /* The hover: which unit, and what the map is saying about it. */
    fillTip(tip, area) {
      const u = byUnit[area.getAttribute('data-unit')];
      if (!u) return;
      tip.appendChild(mk('strong', 'theme-unit', u.short));
      const line = (t) => tip.appendChild(mk('span', 'sub', t));
      if (u.status !== 'ok') { line(u.note || 'No 1931 figures.'); return; }
      if (!isDistrict() && u.nc) { line('Enumerated population only 46,451 (troops and posts). Not the tribal population.'); return; }
      if (isDistrict() && u.dmg) { line('Not mapped: pages damaged in the only scan.'); return; }
      if (mode === 'lang') {
        if (!itemised(u)) { line('This language is not itemised in Burma’s district tables.'); return; }
        const n = persons(lang, u);
        line(disp(lang) + ': ' + pct(shareOf(lang, u)));
        line(fmtInt(n) + ' of ' + fmtInt(u.P));
      } else if (u.lead) {
        line(leadName(u) + ': ' + pct(u.lead.n / u.P * 100));
        line('of ' + fmtInt(u.P));
      }
    },

    /* The key: what the colours mean, and the way to a language. */
    legend(legendEl) {
      // the map asks for its key while switching a theme on, before there is one
      if (!layer) return;
      const head = mk('p', 'legend-sub cen-key-head', rec.en);
      legendEl.appendChild(head);
      const body = mk('div', 'cen-key');
      if (mode === 'lead') {
        body.appendChild(mk('p', 'cen-key-title', 'Largest mother tongue. Press one to map it.'));
        const groups = {};
        LEAD_ITEMS.forEach((it) => {
          const f = FAMILY_HUES[it.family] ? it.family : 'Other';
          (groups[f] = groups[f] || []).push(it);
        });
        FAMILY_ORDER.concat(['Other']).forEach((f) => {
          if (!groups[f]) return;
          const fam = mk('div', 'cen-fam');
          fam.appendChild(mk('span', 'cen-fam-name', f.replace(' Family', '')));
          groups[f].sort((a, b) => a.order - b.order).forEach((it) => {
            const b = mk('button', 'cen-chip');
            b.type = 'button';
            b.title = 'Map ' + disp(it.l);
            const sw = mk('span', 'sw');
            sw.style.background = hsl(LEAD_COLORS[it.key]);
            b.appendChild(sw);
            b.appendChild(document.createTextNode(it.label));
            b.addEventListener('click', () => setLang(it.l));
            fam.appendChild(b);
          });
          body.appendChild(fam);
        });
        body.appendChild(mk('p', 'cen-key-note', 'Lighter: the largest language, but under half the population.'));
        if (isDistrict() && (TOT.HB || 0) > 0) {
          const b = mk('button', 'cen-chip');
          b.type = 'button';
          b.title = HB.name;
          b.textContent = 'Hindi composite';
          b.addEventListener('click', () => setLang(HB));
          body.appendChild(b);
        }
      } else {
        body.appendChild(mk('p', 'cen-key-title', disp(lang) + ': speakers as % of the population'));
        const ramp = mk('div', 'cen-ramp');
        RAMP.forEach((c) => { const s = mk('span'); s.style.background = c; ramp.appendChild(s); });
        body.appendChild(ramp);
        const ticks = mk('div', 'cen-ticks');
        TICKS.forEach((t) => ticks.appendChild(mk('span', '', t)));
        body.appendChild(ticks);
        const none = mk('div', 'item');
        const z = mk('span', 'sw');
        z.style.background = 'var(--cen-zero)';
        none.appendChild(z);
        none.appendChild(document.createTextNode('None recorded'));
        body.appendChild(none);
        const b = mk('button', 'cen-chip');
        b.type = 'button';
        b.textContent = 'Back to the largest language';
        b.addEventListener('click', setLead);
        body.appendChild(b);
      }
      const grey = mk('div', 'item');
      const gs = mk('span', 'sw');
      gs.style.background = 'var(--cen-nofig)';
      grey.appendChild(gs);
      grey.appendChild(document.createTextNode('No figures to show. Press it to see why.'));
      body.appendChild(grey);
      const all = mk('button', 'cen-chip');
      all.type = 'button';
      all.textContent = 'All languages';
      all.addEventListener('click', allLanguagesTable);
      body.appendChild(all);
      legendEl.appendChild(body);
    },

    // for the tests
    report() {
      return { level: level, mode: mode, lang: lang ? lang.id : null, sel: sel ? sel.id : null,
        units: units.length, items: LEAD_ITEMS.length };
    },
  };
  return api;
};
