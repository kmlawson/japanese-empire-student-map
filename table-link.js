/* One printed table on the map, carried in the address.
 *
 * The statistics site (https://kmlawson.github.io/playground-stat-tables/) links
 * here with a table's figures in the fragment, `#t=<payload>`:
 * base64url(raw DEFLATE(UTF-8 JSON)). The contract is that site's
 * `build/MAPLINK_SPEC.md`, version 1: prefectures by JIS code, plus five colonies
 * as single rows; or, as `units: "territory"`, the empire's parts as wholes, Japan
 * proper (`naichi`) among them; or, as `units: "city"`, cities by the map's own city
 * ids, drawn as points (`drawPoints`); or provinces, districts and island groups
 * outside Japan proper by the map's own sub-unit keys (spec 4c, `SUB_KINDS`); or
 * whole countries by the map's territory records (`units: "country"`).
 * `docs/table-links.md` is how a printed table of each
 * shape is meant to arrive and be shown, and is the place to add the next shape.
 *
 * **What the reader does.** The map opens shaded by the table's first column, with
 * a pill in the corner saying the figures came from outside the map. A dropdown over
 * the map changes the column, and a box beside it divides by the census where the
 * table says that means something. Past `MANY_COLUMNS` the dropdown is a menu that
 * folds, because a native list of forty headings cannot. Hovering gives the figure as
 * printed. Pressing a place gives all of its figures in the card, and the link
 * back to the printed table is at the foot of every card for as long as the table
 * is up (`#info-theme-foot`, see `syncThemeFoot` in map.js).
 *
 * **The colouring is not here.** `popFills` in map.js asks `fills()` and the
 * population layer's own pass does the rest, which is what colours Sado as Niigata
 * and the Amami islands as Kagoshima. `wholeFills()` is the colonies, which have no
 * prefectures to stand on.
 *
 * **The address is written by anybody.** Everything in the payload is data: it goes
 * into the page as text only, capped and stripped of control characters; a place is
 * looked up in a `Map` and never by indexing an object with what arrived; the source
 * link must fall under one of the two known tables sites; and both the fragment and
 * what it inflates to have a ceiling. What a spreadsheet would run as a formula is
 * defused in `csvCell` in map.js, at the file, so the screen shows the text as printed.
 * The page's Content-Security-Policy is the second line behind all of this.
 *
 * One table at a time, and it shares the map with neither a thematic layer nor a
 * population layer: choosing either closes it (`setTheme` and `setPop` in map.js). */
'use strict';

window.JMAP_TABLE = function (host) {
  const CHIP = 'Table';
  const CHIP_INK = '#1f5b8f';
  const MAX_FRAGMENT = 200000;      // characters of base64; payloads are 1–3 KB
  const MAX_JSON = 2000000;         // bytes once inflated
  const PER = 1000;                 // the per-capita view is per this many people
  /* The only places a source link may go: the tables site, live and draft. */
  const SOURCE_ROOTS = ['https://froginawell.net/reference/old-tables/',
    'https://kmlawson.github.io/playground-stat-tables/'];
  /* Past these a number is not a printed figure from a year book. */
  const MAX_FIGURE = 1e15;
  const MIN_FIGURE = 1e-6;
  /* Up to this many columns a native dropdown does; past it, `columnMenu`. */
  const MANY_COLUMNS = 6;
  const LEVEL = ' — ';              // the spec's separator in a multi-level heading
  /* Up to this many places the key lists each one with its figure, because five
     classes cut from six figures say less than the six figures do. */
  const FEW = 8;
  /* How long a province table waits for the sheet its provinces are in. */
  const ADMIN_WAIT_MS = 20000;
  /* How the five classes are cut, as the key's dropdown offers them. The choice
     goes into the address as `tk=`, beside `t=`, so a shared link draws the same
     map; quantiles, the default, are left out of it. */
  const METHODS = [['quantile', 'Quantiles'], ['jenks', 'Natural Breaks'],
    ['equal', 'Equal Intervals'], ['log', 'Logarithmic'], ['prop', 'Proportional']];
  const METHOD_IDS = new Set(METHODS.map((m) => m[0]));

  /* The contract's ids, against this map's own province keys. */
  const PREFECTURES = [
    ['01', 'Hokkaido', 'Hokkaidō', '北海道'], ['02', 'Aomori', 'Aomori', '青森'],
    ['03', 'Iwate', 'Iwate', '岩手'], ['04', 'Miyagi', 'Miyagi', '宮城'],
    ['05', 'Akita', 'Akita', '秋田'], ['06', 'Yamagata', 'Yamagata', '山形'],
    ['07', 'Fukushima', 'Fukushima', '福島'], ['08', 'Ibaraki', 'Ibaraki', '茨城'],
    ['09', 'Tochigi', 'Tochigi', '栃木'], ['10', 'Gunma', 'Gunma', '群馬'],
    ['11', 'Saitama', 'Saitama', '埼玉'], ['12', 'Chiba', 'Chiba', '千葉'],
    ['13', 'Tokyo', 'Tōkyō', '東京'], ['14', 'Kanagawa', 'Kanagawa', '神奈川'],
    ['15', 'Niigata', 'Niigata', '新潟'], ['16', 'Toyama', 'Toyama', '富山'],
    ['17', 'Ishikawa', 'Ishikawa', '石川'], ['18', 'Fukui', 'Fukui', '福井'],
    ['19', 'Yamanashi', 'Yamanashi', '山梨'], ['20', 'Nagano', 'Nagano', '長野'],
    ['21', 'Gifu', 'Gifu', '岐阜'], ['22', 'Shizuoka', 'Shizuoka', '静岡'],
    ['23', 'Aichi', 'Aichi', '愛知'], ['24', 'Mie', 'Mie', '三重'],
    ['25', 'Shiga', 'Shiga', '滋賀'], ['26', 'Kyoto', 'Kyōto', '京都'],
    ['27', 'Osaka', 'Ōsaka', '大阪'], ['28', 'Hyogo', 'Hyōgo', '兵庫'],
    ['29', 'Nara', 'Nara', '奈良'], ['30', 'Wakayama', 'Wakayama', '和歌山'],
    ['31', 'Tottori', 'Tottori', '鳥取'], ['32', 'Shimane', 'Shimane', '島根'],
    ['33', 'Okayama', 'Okayama', '岡山'], ['34', 'Hiroshima', 'Hiroshima', '広島'],
    ['35', 'Yamaguchi', 'Yamaguchi', '山口'], ['36', 'Tokushima', 'Tokushima', '徳島'],
    ['37', 'Kagawa', 'Kagawa', '香川'], ['38', 'Ehime', 'Ehime', '愛媛'],
    ['39', 'Kochi', 'Kōchi', '高知'], ['40', 'Fukuoka', 'Fukuoka', '福岡'],
    ['41', 'Saga', 'Saga', '佐賀'], ['42', 'Nagasaki', 'Nagasaki', '長崎'],
    ['43', 'Kumamoto', 'Kumamoto', '熊本'], ['44', 'Oita', 'Ōita', '大分'],
    ['45', 'Miyazaki', 'Miyazaki', '宮崎'], ['46', 'Kagoshima', 'Kagoshima', '鹿児島'],
    ['47', 'Okinawa', 'Okinawa', '沖縄'],
  ];
  /* Whole territories: the id is also the map's record id; the atom is its shape. */
  const COLONIES = [
    ['karafuto', 'karafuto', 'Karafuto', '樺太'], ['taiwan', 'taiwan', 'Taiwan', '臺灣'],
    ['chosen', 'korea', 'Korea', '朝鮮'], ['kwantung', 'kwantung', 'Kwantung', '關東州'],
    ['nanyo', 'nanyo', 'South Seas Islands', '南洋群島'],
  ];
  const PLACES = new Map();
  const CODE_OF_KEY = new Map();
  PREFECTURES.forEach((p) => {
    PLACES.set(p[0], { id: p[0], key: p[1], en: p[2], ja: p[3] });
    CODE_OF_KEY.set(p[1], p[0]);
  });
  COLONIES.forEach((c) => PLACES.set(c[0], { id: c[0], atom: c[1], en: c[2], ja: c[3] }));
  /* Japan proper as one row, in a table of the empire's parts: every prefecture in
     one colour. It never shares a table with the prefectures themselves. */
  PLACES.set('naichi', { id: 'naichi', proper: true, en: 'Japan proper', ja: '内地' });
  /* Which ids each kind of table may hold. */
  const UNITS = new Map([
    ['prefecture', new Set(PREFECTURES.map((p) => p[0]).concat(COLONIES.map((c) => c[0])))],
    ['territory', new Set(['naichi'].concat(COLONIES.map((c) => c[0])))],
  ]);
  /* A table of cities is points, not ground. A count or an amount is a circle
     whose *area* is the figure, up to `R_MAX` screen pixels across the radius;
     anything else (a rate, an index, a temperature) is a dot of one size on the
     ramp, because a circle's area would claim a quantity the figure is not. */
  const R_MAX = 22;
  const R_DOT = 6;
  /* Five classes as five sizes, for a city table shown by size: radii in screen
     pixels, each step a little more than the last so the classes read apart. */
  const SIZE_R = [3.5, 6, 9, 12.5, 17];
  const CIRCLE = '#1f5b8f';
  const CENSUSES = [1920, 1930, 1940];
  /* Provinces and the like outside Japan proper: the map's own sub-unit keys, the
     set for each kind built from texts/territories/sub-units (`JMAP.SUB_SETS`).
     Taiwan's prefectures are not drawn as shapes of their own: each of their 郡
     and 市 takes its 州's colour, by the `shu` column. */
  const SUB_KINDS = new Set(['china-province', 'korea-province', 'manchukuo-province',
    'nanyo-group', 'taiwan-prefecture', 'taiwan-district']);
  /* What a row is called, for "N … in the table are not on the map". */
  const NOUNS = {
    city: ['city', 'cities'],
  };
  // a province table's misses are as often "Peking" or "Grand total" as a province
  /* The map's own population figures for each kind, with when each was taken, so
     that per head divides by the nearest. China, the South Seas and countries have
     none here, and get no per-head view. */
  const POP_FOR = {
    'korea-province': [['korea-1930', 1930.75], ['korea-1942', 1942.75]],
    'taiwan-prefecture': [['taiwan-1930', 1930.99], ['taiwan-1941', 1941.99]],
    'taiwan-district': [['taiwan-1930', 1930.99], ['taiwan-1941', 1941.99]],
    'manchukuo-province': [['manchukuo-1943', 1943.37]],
  };
  /* A country's record under its other date's name: Siam is Thailand in 1942. */
  const COUNTRY_ALIAS = new Map([['thailand', 'siam'], ['siam', 'thailand']]);
  /* The map's territory records that are not the contract's id for the same place. */
  const RECORD_PLACE = new Map([['formosa', 'taiwan']]);

  const RAMP = ['#dfeaf4', '#c3d6e8', '#8fb4d4', '#5286b4', '#1f5b8f'];
  const RAMP_DIV = ['#b2533f', '#e3a793', '#f2efe9', '#8fb4d4', '#1f5b8f'];
  const NIL = '#efe6cf';
  const UNREADABLE = '#b9b4a8';

  let T = null;                     // the table
  let colAt = 0;
  let perCapita = false;
  let method = 'quantile';          // how the classes are cut: one of METHODS
  let style = '';                   // a table of cities: 'size', 'colour', or '' for its default
  let bar = null;
  let flag = null;
  let menuOff = null;               // takes the open column menu's listeners away
  let cardNow = null;               // what our card is showing: null, 'table', or a place id
  let marked = [];

  /* -------------------------------------------------------------- reading */

  function mk(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  async function inflate(fragment) {
    const m = String(fragment).match(/(?:^#|&)t=([A-Za-z0-9_-]+)/);
    if (!m) throw new Error('no payload');
    if (m[1].length > MAX_FRAGMENT) throw new Error('too long');
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - b64.length % 4) % 4);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    let inflater;
    // a browser can have the stream and not this format, which is a TypeError
    try { inflater = new DecompressionStream('deflate-raw'); }
    catch (err) { throw new Error('browser'); }
    const reader = new Blob([bytes]).stream().pipeThrough(inflater).getReader();
    const parts = [];
    let size = 0;
    for (;;) {
      const got = await reader.read();
      if (got.done) break;
      size += got.value.length;
      // stopped as it grows: a few kilobytes can inflate to a great many
      if (size > MAX_JSON) { reader.cancel(); throw new Error('too long'); }
      parts.push(got.value);
    }
    const all = new Uint8Array(size);
    let at = 0;
    parts.forEach((p) => { all.set(p, at); at += p.length; });
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
  }

  /* Text as printed, less what no printed page holds: control characters, which
     include a bare CR, and the bidirectional overrides that show text reversed.
     Capped, because nothing else stops one field reaching the whole 2 MB. */
  function text(s, max = 300) {
    if (typeof s !== 'string' && typeof s !== 'number') return '';
    const t = String(s).replace(/[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, ' ').trim();
    return t.length > max ? t.slice(0, max) + '…' : t;
  }

  /* The spec's rule: `src.path` joined to the tables site on the map's own host,
     and `src.url` anywhere else, such as a local preview. Whichever it is must
     land under a known root once parsed, which is after `../`, `%2e` and
     backslashes have been resolved. Anything else is a table with no link. */
  function sourceLink(src) {
    if (!src || typeof src !== 'object') return null;
    const here = location.hostname.replace(/^www\./, '');
    const base = SOURCE_ROOTS.find((r) => new URL(r).hostname === here);
    const want = base && typeof src.path === 'string' ? base + src.path : src.url;
    if (typeof want !== 'string') return null;
    try {
      const u = new URL(want);
      if (u.username || u.password || !SOURCE_ROOTS.some((r) => u.href.startsWith(r))) return null;
      return { url: u.href, host: u.hostname };
    } catch (err) { return null; }
  }

  function isFigure(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return false;
    const m = Math.abs(v);
    return m === 0 || (m < MAX_FIGURE && m >= MIN_FIGURE);
  }

  function readCell(v) {
    if (isFigure(v)) return { n: v === 0 ? 0 : v, t: fmt(v === 0 ? 0 : v), as: 'num' };
    if (v === '?') return { n: null, t: 'Unreadable in the scan', as: 'unreadable' };
    if (v === '-') return { n: null, t: '— (nil)', as: 'nil' };
    const printed = text(v);
    if (!printed) return { n: null, t: 'No data', as: 'none' };
    return { n: null, t: printed, as: 'other' };
  }

  function fmt(n) {
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 6 });
  }

  /* The characters of a name, without the reading the table puts after them. */
  function shortJa(ja) { return text(String(ja || '').replace(/\s*\(.*$/, ''), 60); }
  /* The atoms a country is drawn as on one date's map, under its own name or
     its other date's. */
  function countryAtoms(pl, ep) {
    if (!pl || !pl.atoms) return [];
    if (pl.atoms[ep] && pl.atoms[ep].length) return pl.atoms[ep];
    const alias = COUNTRY_ALIAS.get(pl.id);
    const other = alias && T && T.cities ? T.cities.get(alias) : null;
    return (other && other.atoms[ep]) || [];
  }
  /* Whether a row's place is drawn on one date's map. */
  function placedOn(units, pl, ep) {
    if (!pl) return false;
    if (units === 'country') {
      if (pl.atoms[ep] && pl.atoms[ep].length) return true;
      const alias = COUNTRY_ALIAS.get(pl.id);
      return !!(alias && host.records(ep).some((r) => r.id === alias));
    }
    if (units === 'taiwan-prefecture') return true;
    const atom = host.atomOfKey(pl.id);
    return !!atom && host.epochAtoms(ep).has(atom);
  }

  /* What the payload said, reduced to what is known to be sound. Throws a word
     the error card can use. Unknown fields fall away here, as the spec requires. */
  const DATE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
  function normalise(p) {
    if (!p || typeof p !== 'object') throw new Error('shape');
    /* A table of cities takes the map's own city ids: the gazetteer of the
       period the table asks for, and failing that the other one's, so a city
       drawn on only one date's map still has a place. */
    let cities = null;
    if (p.units === 'city') {
      const want = p.period === '1942' ? ['e1942', 'e1930'] : ['e1930', 'e1942'];
      cities = new Map();
      want.forEach((ep) => host.cities(ep).forEach((c) => {
        if (typeof c.id === 'string' && !cities.has(c.id)) {
          cities.set(c.id, { id: c.id, city: true, en: text(c.n, 120), ja: '', lon: c.lon, lat: c.lat,
            cen: Array.isArray(c.cen) ? c.cen : null });
        }
      }));
    }
    /* Provinces and the like: the keys of the set, named as the map names them. */
    if (SUB_KINDS.has(p.units)) {
      cities = new Map();
      host.subSet(p.units).forEach((k) => {
        const rec = host.subUnit(k) || {};
        const pl = { id: k, sub: true, en: text(rec.en, 120) || k, ja: shortJa(rec.ja) };
        if (p.units === 'taiwan-prefecture') pl.shu = true;
        else pl.key = k;
        cities.set(k, pl);
      });
    }
    /* Countries: the territory records of either date. Which date the table is
       drawn on is decided below, by which places more of its rows. */
    if (p.units === 'country') {
      cities = new Map();
      ['e1930', 'e1942'].forEach((ep) => host.records(ep).forEach((r) => {
        if (typeof r.id !== 'string') return;
        const pl = cities.get(r.id) || { id: r.id, country: true, en: text(r.en, 120) || r.id, ja: '', atoms: {}, names: {} };
        pl.atoms[ep] = Array.isArray(r.atoms) ? r.atoms.slice() : [];
        pl.names[ep] = text(r.en, 120);
        cities.set(r.id, pl);
      }));
    }
    const allowed = cities || UNITS.get(p.units);
    if (!allowed) throw Object.assign(new Error('units'), { src: sourceLink(p.src) });
    if (!Array.isArray(p.cols) || !p.cols.length || p.cols.length > 200
        || !Array.isArray(p.rows) || p.rows.length > 500) throw new Error('shape');
    const cols = p.cols.map((c) => {
      const o = c && typeof c === 'object' ? c : {};
      return { name: text(o.name), en: text(o.en), unit: text(o.unit), kind: text(o.kind),
        pc: o.pc === true, div: o.color === 'div', series: text(o.series, 60),
        date: DATE.test(String(o.date)) ? String(o.date) : '' };
    });
    const rows = new Map();
    let dropped = 0;
    const lost = [];                  // printed names of rows with an id the map has not
    p.rows.forEach((r) => {
      if (!r || !allowed.has(r.id) || rows.has(r.id)) {
        dropped++;
        if (r && r.label) lost.push(text(r.label, 80));
        return;
      }
      const v = Array.isArray(r.v) ? r.v : [];
      rows.set(r.id, { id: r.id, label: text(r.label, 120), cells: cols.map((c, i) => readCell(v[i])) });
    });
    /* The date to draw it on: the table's own, unless the other date's map places
       more of its rows. Manchukuo's provinces are on the 1942 map only, and a
       table of 1941 that names "China" and "Manchuria" is a table of the 1930
       map's records. What the chosen date cannot place is said, not drawn. */
    let period = p.period === '1930' || p.period === '1942' ? p.period : '';
    if (cities && p.units !== 'city') {
      const first = period || '1930';
      const other = first === '1930' ? '1942' : '1930';
      const placed = (ep) => Array.from(rows.keys()).filter((id) => placedOn(p.units, cities.get(id), 'e' + ep)).length;
      period = placed(other) > placed(first) ? other : first;
      if (p.units === 'country') {
        cities.forEach((pl) => { if (pl.names && pl.names['e' + period]) pl.en = pl.names['e' + period]; });
      }
      Array.from(rows.keys()).forEach((id) => {
        if (placedOn(p.units, cities.get(id), 'e' + period)) return;
        lost.push(rows.get(id).label || cities.get(id).en);
        rows.delete(id);
      });
    }
    if (!rows.size) throw Object.assign(new Error('empty'), { src: sourceLink(p.src) });
    const title = p.title && typeof p.title === 'object' ? p.title : {};
    const vol = p.volume && typeof p.volume === 'object' ? p.volume : {};
    let total = null;
    if (p.total && typeof p.total === 'object') {
      const v = Array.isArray(p.total.v) ? p.total.v : [];
      const mis = p.total.mismatch && typeof p.total.mismatch === 'object' ? p.total.mismatch : {};
      total = { label: text(p.total.label), en: text(p.total.en, 80), cells: cols.map((c, i) => readCell(v[i])),
        adds: cols.map((c, i) => {
          const m = Object.prototype.hasOwnProperty.call(mis, String(i)) ? mis[String(i)] : null;
          return isFigure(m) ? m : null;
        }) };
    }
    const def = Number.isInteger(p.def) && p.def >= 0 && p.def < cols.length ? p.def : 0;
    return {
      version: p.v, src: sourceLink(p.src), units: p.units,
      ja: text(title.ja), en: text(title.en),
      volume: text(vol.title), year: text(vol.year), volumeEn: text(vol.en),
      date: DATE.test(String(p.date)) ? String(p.date) : '',
      period,
      part: text(p.part), cols, def, rows, total, dropped, cities,
      /* What the site could not match to a city on the map, by its printed name,
         and what it matched to an id this map does not have. */
      unplaced: (Array.isArray(p.unplaced) ? p.unplaced : []).slice(0, 500)
        .map((u) => text(u && typeof u === 'object' ? u.label : u, 80)).filter(Boolean).concat(lost),
      notes: (Array.isArray(p.notes) ? p.notes : []).slice(0, 12).map((n) => text(n, 1000)).filter(Boolean),
    };
  }

  /* ------------------------------------------------- what the map is saying */

  function isCity() { return T.units === 'city'; }
  /* A place of this table: a prefecture or colony from the contract, or a city
     from the gazetteer. */
  function placeOf(id) { return (T && T.cities && T.cities.get(id)) || PLACES.get(id); }

  function colName(c) { return c.en || c.name; }
  function colLabel(c) { return colName(c) + (c.unit ? ' (' + c.unit + ')' : ''); }
  function isSummable(c) { return c.kind === 'count' || c.kind === 'amount'; }
  /* `rate`, `index` and `other` never, whatever `pc` says; a missing `pc` never. */
  function isSub() { return SUB_KINDS.has(T.units); }
  function isCountry() { return T.units === 'country'; }
  /* A table whose rows the site matched to places, and whose misses it lists. */
  function listsMisses() { return isCity() || isSub() || isCountry(); }
  function allowsPerCapita(c) {
    const here = T.units === 'prefecture' || isCity() || !!POP_FOR[T.units];
    return here && c.pc && (isSummable(c) || !c.kind);
  }
  /* The figures' date as a year and a fraction, the column's own first. */
  function whenOf(i) {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec((T.cols[i] && T.cols[i].date) || T.date || T.year || '');
    if (!m) return null;
    return Number(m[1]) + (m[2] ? (Number(m[2]) - 1 + (m[3] ? Number(m[3]) / 31 : 0.5)) / 12 : 0.5);
  }
  /* The map's own population set nearest the figures, for a province table. */
  function popSetFor(i = colAt) {
    const sets = POP_FOR[T.units];
    if (!sets) return null;
    const w = whenOf(i);
    if (w === null) return sets[0][0];
    return sets.reduce((a, b) => (Math.abs(w - b[1]) < Math.abs(w - a[1]) ? b : a))[0];
  }
  /* Which count the per-head figures divide by, as the key and the tip say it. */
  function censusLabel(i = colAt) {
    if (POP_FOR[T.units]) return host.popCaption(popSetFor(i)) || 'population';
    return censusYear(i) + ' census';
  }
  function perCapitaOn() { return perCapita && allowsPerCapita(T.cols[colAt]); }

  /* The nearest census the map holds to the figures' date, each taken at its own
     1 October, so that the end of 1935 falls to 1940 and the bare year to 1930.
     The column's own date first, in a series. Cities have 1920 as well. */
  function censusYear(i = colAt) {
    const years = isCity() ? CENSUSES : [1930, 1940];
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec((T.cols[i] && T.cols[i].date) || T.date || T.year || '');
    if (!m) return 1930;
    const when = Number(m[1]) + (m[2]
      ? (Number(m[2]) - 1 + (m[3] ? Number(m[3]) / 31 : 0.5)) / 12 : 0.5);
    return years.reduce((a, y) => (Math.abs(when - (y + 0.75)) < Math.abs(when - (a + 0.75)) ? y : a), years[0]);
  }
  function peopleOf(place, i = colAt) {
    if (place && (place.sub || place.shu)) {
      const rows = host.popRows(popSetFor(i));
      const r = rows && rows[place.id];
      return r && r.pop ? r.pop : null;
    }
    if (place && place.city) {
      const n = place.cen ? place.cen[CENSUSES.indexOf(censusYear(i))] : null;
      return typeof n === 'number' && n > 0 ? n : null;
    }
    if (!place.key) return null;      // colonies: no matching figure, so left out
    const row = host.popRows('japan-' + censusYear());
    const r = row && row[place.key];
    return r && r.pop ? r.pop : null;
  }

  /* The number this view colours a place by, or null: in the column in use, or
     in another of its series, which shares its scale. */
  function shown(id, i = colAt) {
    const row = T.rows.get(id);
    if (!row) return null;
    const n = row.cells[i].n;
    if (n === null) return null;
    if (!perCapitaOn()) return n;
    const people = peopleOf(placeOf(id), i);
    return people ? n / people * PER : null;
  }
  /* The columns cut on one scale with the one in use: its series, which the
     payload names, so that stepping from 1920 to 1935 changes a colour only
     when a figure has changed. Without a series, the column alone. */
  function scaleCols() {
    const s = T.cols[colAt].series;
    if (!s) return [colAt];
    const out = [];
    T.cols.forEach((c, i) => { if (c.series === s && c.kind === T.cols[colAt].kind) out.push(i); });
    return out;
  }
  function allShown() {
    const out = [];
    scaleCols().forEach((i) => {
      T.rows.forEach((r, id) => { const v = shown(id, i); if (v !== null) out.push(v); });
    });
    return out;
  }
  function few() { return T.rows.size <= FEW; }
  function sig2(x) {
    if (!x || !Number.isFinite(x)) return 0;
    const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);
    const out = Math.round(x / p) * p;
    return Number.isFinite(out) ? out : x;
  }
  function tidy(x) { return Number(x.toPrecision(6)); }

  /* The classes, cut by `method`, or round nought when the column is diverging
     and has both signs, whatever the method: there the split is the point.

     * Quantiles: the same number of places in each, by rank. Robust to a table
       where Tōkyō has six thousand and the rest tens, but it hides how far apart
       the classes are. Cuts rounded to two figures so the key can be read.
     * Natural breaks: Fisher–Jenks, the cuts that make each class as tight as it
       can be. Each cut is the roundest number between the classes it divides,
       so no place changes class for the sake of a tidy key.
     * Equal intervals: the range in five equal steps. Honest about distance,
       useless on a skewed count, where nearly everything falls in the first.
     * Logarithmic: equal steps in the logarithm, each cut rounded to 1, 2 or 5
       times a power of ten. For counts that run over orders of magnitude; it
       has no meaning at or below nought, and quantiles stand in there. */
  function scale() {
    const vals = allShown().sort((a, b) => a - b);
    const c = T.cols[colAt];
    if (c.div && vals.length && vals[0] < 0 && vals[vals.length - 1] > 0) {
      const m = sig2(Math.max(-vals[0], vals[vals.length - 1]));
      return { ramp: RAMP_DIV, breaks: [-0.5 * m, -0.1 * m, 0.1 * m, 0.5 * m].map(tidy), method: 'div' };
    }
    const distinct = Array.from(new Set(vals));
    if (distinct.length < 2) return { ramp: RAMP, breaks: [], method };
    const classes = Math.min(RAMP.length, distinct.length);
    let used = method === 'prop' ? 'quantile' : method;   // proportional: see `propNow`
    if (used === 'log' && !(vals[0] > 0)) used = 'quantile';
    let breaks;
    if (used === 'jenks') breaks = jenksCuts(vals, classes);
    else if (used === 'equal') breaks = equalCuts(vals, classes);
    else if (used === 'log') breaks = logCuts(vals, classes);
    else breaks = quantileCuts(vals, classes);
    breaks = Array.from(new Set(breaks.filter((x) => Number.isFinite(x) && x > vals[0])))
      .sort((a, b) => a - b);
    return { ramp: RAMP, breaks, method: used };
  }
  function quantileCuts(vals, classes) {
    const out = [];
    for (let i = 1; i < classes; i++) out.push(tidy(sig2(vals[Math.floor(i * vals.length / classes)])));
    return out;
  }
  /* A number at the precision of `step`, to two figures of it. */
  function roundTo(x, step) {
    if (!step || !Number.isFinite(step)) return tidy(x);
    const p = Math.pow(10, Math.floor(Math.log10(Math.abs(step))) - 1);
    return tidy(Math.round(x / p) * p);
  }
  function equalCuts(vals, classes) {
    const lo = vals[0];
    const step = (vals[vals.length - 1] - lo) / classes;
    const out = [];
    for (let i = 1; i < classes; i++) out.push(roundTo(lo + i * step, step));
    return out;
  }
  /* 1, 2 or 5 times a power of ten: the nearest of them in the logarithm. */
  function niceLog(x) {
    const e = Math.floor(Math.log10(x));
    const p = Math.pow(10, e);
    let best = p;
    [1, 2, 5, 10].forEach((m) => {
      if (Math.abs(Math.log10(m * p) - Math.log10(x)) < Math.abs(Math.log10(best) - Math.log10(x))) best = m * p;
    });
    return tidy(best);
  }
  function logCuts(vals, classes) {
    const lo = vals[0];
    const hi = vals[vals.length - 1];
    const out = [];
    for (let i = 1; i < classes; i++) out.push(niceLog(lo * Math.pow(hi / lo, i / classes)));
    return out;
  }
  /* The roundest number above `below` and not above `atLeast`: a cut between two
     classes that moves nobody. */
  function roundestBetween(below, atLeast) {
    const span = atLeast - below;
    if (!(span > 0)) return atLeast;
    for (let e = Math.ceil(Math.log10(Math.abs(atLeast) || 1)); e > -8; e--) {
      const p = Math.pow(10, e);
      const c = Math.ceil((below + p * 1e-9) / p) * p;
      if (c > below && c <= atLeast) return tidy(c);
    }
    return atLeast;
  }
  /* Fisher–Jenks: the partition of the sorted figures into `classes` runs with
     the least total squared distance from each run's mean. Exact, by dynamic
     programming; a table here is at most a few hundred figures. */
  function jenksCuts(vals, classes) {
    const n = vals.length;
    const pre = [0];
    const pre2 = [0];
    vals.forEach((v, i) => { pre.push(pre[i] + v); pre2.push(pre2[i] + v * v); });
    const cost = (i, j) => {                // figures i..j inclusive
      const m = j - i + 1;
      const sum = pre[j + 1] - pre[i];
      return pre2[j + 1] - pre2[i] - sum * sum / m;
    };
    // best[k][j]: the least cost of the first j+1 figures in k+1 classes
    const best = [vals.map((v, j) => cost(0, j))];
    const from = [vals.map(() => 0)];
    for (let k = 1; k < classes; k++) {
      best.push(new Array(n).fill(Infinity));
      from.push(new Array(n).fill(0));
      for (let j = k; j < n; j++) {
        for (let i = k; i <= j; i++) {
          const v = best[k - 1][i - 1] + cost(i, j);
          if (v < best[k][j]) { best[k][j] = v; from[k][j] = i; }
        }
      }
    }
    const starts = [];
    let j = n - 1;
    for (let k = classes - 1; k > 0; k--) {
      const i = from[k][j];
      starts.unshift(i);
      j = i - 1;
    }
    return starts.filter((i) => vals[i] > vals[i - 1]).map((i) => roundestBetween(vals[i - 1], vals[i]));
  }
  /* Which swatch: the classes there are, spread over the whole ramp. */
  function swatchOf(cls, count) {
    return count < 2 ? RAMP.length - 2 : Math.round(cls * (RAMP.length - 1) / (count - 1));
  }
  function classOf(v, breaks) {
    let i = 0;
    while (i < breaks.length && v >= breaks[i]) i++;
    return i;
  }
  function colourFor(id, sc) {
    const row = T.rows.get(id);
    if (!row) return host.blank;
    const v = shown(id);
    if (v !== null) return sc.ramp[swatchOf(classOf(v, sc.breaks), sc.breaks.length + 1)];
    const as = row.cells[colAt].as;
    if (as === 'unreadable') return UNREADABLE;
    if (as === 'nil') return NIL;
    return host.blank;
  }

  function fills() {
    if (isCity() || isCountry()) return {};
    const sc = scale();
    const out = {};
    /* Every shape of the set, a blank where the table has no row, as a
       prefecture table does; Taiwan's districts in their prefecture's colour. */
    if (T.units === 'taiwan-prefecture') {
      host.subSet('taiwan-district').forEach((k) => {
        const rec = host.subUnit(k);
        out[k] = rec && rec.shu ? colourFor(rec.shu, sc) : host.blank;
      });
      out.TwBanchi = host.blank;
      return out;
    }
    if (isSub()) {
      T.cities.forEach((pl, id) => { out[id] = colourFor(id, sc); });
      return out;
    }
    if (T.units === 'territory') {
      const c = T.rows.has('naichi') ? colourFor('naichi', sc) : null;
      if (c) PREFECTURES.forEach((p) => { out[p[1]] = c; });
      return out;
    }
    PLACES.forEach((pl, id) => { if (pl.key) out[pl.key] = colourFor(id, sc); });
    return out;
  }
  function wholeFills() {
    if (isCity() || isSub()) return {};
    const sc = scale();
    const out = {};
    if (isCountry()) {
      T.rows.forEach((r, id) => {
        const c = colourFor(id, sc);
        countryAtoms(placeOf(id), host.epoch()).forEach((a) => { out[a] = c; });
      });
      return out;
    }
    PLACES.forEach((pl, id) => { if (pl.atom && T.rows.has(id)) out[pl.atom] = colourFor(id, sc); });
    return out;
  }
  function viewText(v) {
    if (!perCapitaOn()) return fmt(v);
    return v >= 10 ? fmt(Math.round(v * 10) / 10) : v >= 1 ? v.toFixed(2) : v.toPrecision(2);
  }
  /* The figure on each prefecture, where there is room: map.js decides that. */
  function mapValues() {
    const sc = scale();
    const out = [];
    T.rows.forEach((r, id) => {
      const pl = placeOf(id);
      const v = shown(id);
      if (pl.key && v !== null) {
        const s = swatchOf(classOf(v, sc.breaks), sc.breaks.length + 1);
        out.push({ key: pl.key, text: viewText(v),
          dark: sc.ramp === RAMP_DIV ? s === 0 || s === 4 : s >= 3 });
      }
    });
    return out;
  }

  /* A shape on the map, as a place in the contract: the prefecture, the prefecture
     an island belongs to, or the colony whose record the pointer is on. */
  function placeAt(provKey, recId, el) {
    if (isCity()) return null;        // the ground does not answer for a city
    if (isCountry()) {
      if (T.rows.has(recId)) return recId;
      const alias = COUNTRY_ALIAS.get(recId);
      return alias && T.rows.has(alias) ? alias : null;
    }
    if (isSub()) {
      // the shape, the province an island belongs to, or its archipelago's
      const keys = [provKey, host.figuresFrom(provKey), host.groupPartOf(el)];
      for (const k of keys) {
        if (!k) continue;
        if (T.units === 'taiwan-prefecture') {
          const rec = host.subUnit(k);
          if (rec && rec.shu && T.cities.has(rec.shu)) return rec.shu;
        } else if (T.cities.has(k)) return k;
      }
      return null;
    }
    const code = CODE_OF_KEY.get(provKey) || CODE_OF_KEY.get(host.figuresFrom(provKey))
      || CODE_OF_KEY.get(host.groupPartOf(el)) || CODE_OF_KEY.get(host.atomPartOf(recId));
    // in a table of the empire's parts, every prefecture is Japan proper
    if (code) return T.units === 'territory' ? (T.rows.has('naichi') ? 'naichi' : null) : code;
    const id = RECORD_PLACE.get(recId) || recId;
    const whole = PLACES.get(id);
    return whole && whole.atom && T.rows.has(id) ? id : null;
  }
  function placeName(id) {
    const p = placeOf(id);
    const row = T.rows.get(id);
    // a city's characters are the table's, as printed
    const ja = p.city ? (row && row.label) || '' : p.ja || (p.country ? (row && row.label) || '' : '');
    // a label the name already says ("China" after "China (Republic of China)") is not said again
    return ja && !p.en.includes(ja) ? p.en + ' ' + ja : p.en;
  }

  function sharePct(row, i) {
    const c = T.cols[i];
    const tot = T.total && T.total.cells[i].n;
    if (!isSummable(c) || !tot || row.cells[i].n === null) return null;
    const pct = row.cells[i].n / tot * 100;
    return pct < 0.05 ? '<0.1%' : pct.toFixed(1) + '%';
  }
  function perCapitaText(id, i) {
    const row = T.rows.get(id);
    if (!row || row.cells[i].n === null || !allowsPerCapita(T.cols[i])) return '';
    const people = peopleOf(placeOf(id), i);
    if (!people) return '';
    const v = row.cells[i].n / people * PER;
    const s = v >= 10 ? fmt(Math.round(v * 10) / 10) : v >= 1 ? v.toFixed(2) : v.toPrecision(2);
    return s + ' per ' + fmt(PER) + ' people';
  }

  /* ------------------------------------------------------------- the points */

  /* **Size or colour.** A table of cities can show its classes as five sizes of
     circle in one colour, or as one size of dot in five colours; the reader picks
     (`#tbl-style`), and the class dropdown cuts either. Sizes need no figure
     below nought: a smaller circle cannot say "less than none". Proportional
     circles, whose area is the figure, are a sixth way under Sizes, for a count
     or an amount and not per head, a figure per head being a rate.

     The default is sizes for what Proportional would suit, colours otherwise. */
  function canSize() {
    if (!isCity()) return false;
    const vals = allShown();
    return vals.length > 0 && vals.every((v) => v >= 0) && vals.some((v) => v > 0);
  }
  function canProp() { return canSize() && isSummable(T.cols[colAt]) && !perCapitaOn(); }
  function styleNow() {
    if (!isCity()) return 'colour';
    if (style === 'size') return canSize() ? 'size' : 'colour';
    if (style === 'colour') return 'colour';
    return canProp() ? 'size' : 'colour';
  }
  function circles() { return styleNow() === 'size'; }
  function propNow() { return circles() && method === 'prop' && canProp(); }
  /* The largest figure of the column, or of its series, so a step from one year
     to the next keeps the circles to one measure. */
  function circleMax() { return allShown().reduce((m, v) => Math.max(m, v), 0); }
  function radiusOf(v, max) { return max > 0 ? R_MAX * Math.sqrt(Math.max(0, v) / max) : 0; }

  function svgNode(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach((k) => e.setAttribute(k, String(attrs[k])));
    return e;
  }
  /* Every city of the table at its place, the largest drawn first so a small one
     is never under a large one. Sizes are screen pixels: the map scales each
     mark by the zoom (`setPoints` in map.js). A city the table has no figure
     for is a small ring, so it can still be found and pressed. */
  /* The South Seas groups are islands too small to carry a colour: each is also
     a dot at its label point, in its colour, to hover and press. */
  function pointsToo() { return T.units === 'nanyo-group'; }
  function drawPoints() {
    if (!T || !(isCity() || pointsToo())) { host.setPoints([]); return; }
    const sc = scale();
    const round = circles();
    const prop = propNow();
    const max = prop ? circleMax() : 0;
    const count = sc.breaks.length + 1;
    const sizeOf = (v) => (prop ? radiusOf(v, max)
      : SIZE_R[swatchOf(classOf(v, sc.breaks), count)]);
    const list = [];
    T.rows.forEach((r, id) => {
      const pl = placeOf(id);
      if (pl && pl.sub && !Number.isFinite(pl.lon)) {
        const ll = host.keyLonLat(id);
        if (ll) { pl.lon = ll.lon; pl.lat = ll.lat; }
      }
      if (!pl || !Number.isFinite(pl.lon) || !Number.isFinite(pl.lat)) return;
      const v = shown(id);
      list.push({ id, pl, v, r: v === null ? 0 : round ? sizeOf(v) : R_DOT });
    });
    list.sort((a, b) => b.r - a.r);
    host.setPoints(list.map((it) => {
      const g = svgNode('g', { class: 'tbl-pt' + (it.id === cardNow ? ' tbl-sel' : ''), 'data-id': it.id });
      g.appendChild(svgNode('circle', { class: 'hit', r: Math.max(it.r, 9) }));
      if (it.v === null) {
        g.appendChild(svgNode('circle', { class: 'mk none', r: 3.5, fill: colourFor(it.id, sc) }));
      } else if (prop && it.v === 0) {
        g.appendChild(svgNode('circle', { class: 'mk zero', r: 2.5 }));
      } else {
        g.appendChild(svgNode('circle', { class: 'mk' + (round ? ' round' : ''), r: Math.max(it.r, 1.5),
          fill: round ? CIRCLE : colourFor(it.id, sc) }));
      }
      return { el: g, lon: it.pl.lon, lat: it.pl.lat };
    }));
  }
  function pointId(target) {
    const g = target && target.closest ? target.closest('#tbl-points .tbl-pt') : null;
    const id = g ? g.getAttribute('data-id') : null;
    return id && T && T.rows.has(id) ? id : null;
  }
  /* The tip for a place: its name where the map's own tip will not give it, the
     label as printed, and the figure as printed. */
  function tipFor(id, named) {
    const wrap = mk('span', 'sub tbl-tip');
    const row = T.rows.get(id);
    if (!row) {
      wrap.textContent = 'No row in this table';
      return wrap;
    }
    const c = T.cols[colAt];
    if (named) wrap.appendChild(mk('span', 'tbl-tip-name', placeOf(id).en));
    else if (placeOf(id).proper || placeOf(id).shu || placeOf(id).country) wrap.appendChild(mk('span', 'tbl-tip-label', placeName(id)));
    // the label as printed, unless it is the name just given
    if (row.label && !(named && row.label === placeOf(id).en)) wrap.appendChild(mk('span', 'tbl-tip-label', row.label));
    wrap.appendChild(mk('span', 'tbl-tip-val', row.cells[colAt].t + (row.cells[colAt].n !== null && c.unit ? ' ' + c.unit : '')));
    if (perCapitaOn()) {
      const pc = perCapitaText(id, colAt);
      wrap.appendChild(mk('span', 'tbl-tip-sub', pc ? pc + ', ' + censusLabel() : 'No population figure'));
    }
    const share = sharePct(row, colAt);
    if (share) wrap.appendChild(mk('span', 'tbl-tip-sub', share + ' of the printed total'));
    return wrap;
  }
  /* The cities in the table that are not on the map, said once. */
  function unplacedCount() { return T.unplaced ? T.unplaced.length : 0; }
  function unplacedLine() {
    const n = unplacedCount();
    const noun = NOUNS[T.units] || ['row', 'rows'];
    return n ? n + ' ' + noun[n === 1 ? 0 : 1] + ' in the table ' + (n === 1 ? 'is' : 'are') + ' not on the map.' : '';
  }

  /* ----------------------------------------------------- the dropdown, on the map */

  /* **Whose figures these are.** Everything else on this map was checked and put
     here by its author; this came in the address, so it says so for as long as it
     is up, in the corner of the map, whichever card is open. */
  function mountFlag() {
    flag = mk('button', '', 'External data');
    flag.id = 'tbl-flag';
    flag.type = 'button';
    flag.title = 'These figures came with the link, not from the map’s own data. Press for details.';
    flag.addEventListener('click', tableCard);
    // the map starts a drag on any press inside its container
    flag.addEventListener('pointerdown', (e) => e.stopPropagation());
    flag.addEventListener('dblclick', (e) => e.stopPropagation());
    document.getElementById('map-container').appendChild(flag);
  }

  /* The columns, by the first level of a multi-level heading. One group, or none
     with levels, is a plain list. The printed heading decides the groups; an
     English heading with the same levels names them, so a table of several parts
     reads "Population › 1920" and not "人口 › Population, 1920". */
  function columnGroups() {
    const groups = [];
    const byName = new Map();
    T.cols.forEach((c, i) => {
      const levels = c.name.split(LEVEL);
      const key = levels.length > 1 ? levels[0] : '';
      const en = c.en ? c.en.split(LEVEL) : [];
      const leveled = key && en.length > 1;
      if (!byName.has(key)) {
        byName.set(key, { name: leveled ? en[0] : key, items: [] });
        groups.push(byName.get(key));
      }
      const label = leveled ? en.slice(1).join(LEVEL) : c.en || levels.slice(key ? 1 : 0).join(LEVEL) || c.name;
      byName.get(key).items.push({ i, label, unit: c.unit });
    });
    if (groups.length > 1) return groups;
    // one group is no group: each heading whole
    return [{ name: '', items: groups[0].items.map((it) => Object.assign(it, { label: T.cols[it.i].en || T.cols[it.i].name })) }];
  }
  /* The columns a step goes through: the series the column in use is in, oldest
     first where every one is dated, or else the group it is in. A table that
     prints 1930 before 1920 still steps forward in time. A series of one is
     no series to walk, and the group is used instead. */
  function stepCols() {
    const s = T.cols[colAt].series;
    const list = [];
    if (s) T.cols.forEach((c, i) => { if (c.series === s) list.push(i); });
    if (list.length > 1) {
      if (list.every((i) => T.cols[i].date)) {
        list.sort((a, b) => (T.cols[a].date < T.cols[b].date ? -1 : T.cols[a].date > T.cols[b].date ? 1 : a - b));
      }
      return list;
    }
    const g = columnGroups().find((x) => x.items.some((it) => it.i === colAt));
    return g ? g.items.map((it) => it.i) : [colAt];
  }
  /* Two buttons either side of the column, for a long table or a series: a
     column a press away, where the menu takes two. */
  function wantsStepper() {
    return T.cols.length > MANY_COLUMNS || T.cols.some((c) => c.series);
  }
  function stepButton(dir) {
    const b = mk('button', 'tbl-step', dir < 0 ? '‹' : '›');
    b.type = 'button';
    b.id = dir < 0 ? 'tbl-prev' : 'tbl-next';
    b.setAttribute('aria-label', dir < 0 ? 'Previous column' : 'Next column');
    b.addEventListener('click', () => {
      const list = stepCols();
      const at = list.indexOf(colAt) + dir;
      if (at >= 0 && at < list.length) setColumn(list[at]);
    });
    return b;
  }

  /* One line until it is pressed, and each group folded but the one in use. */
  function columnMenu() {
    const wrap = mk('div', 'tbl-menu');
    const btn = mk('button');
    btn.id = 'tbl-menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(mk('span', 'now'));
    btn.appendChild(mk('span', 'caret', '▾'));
    wrap.appendChild(btn);
    const panel = mk('div');
    panel.id = 'tbl-menu';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Column of the table to map');
    panel.hidden = true;
    // scrolling the list is not zooming the map under it
    panel.addEventListener('wheel', (e) => e.stopPropagation());
    const close = () => {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (menuOff) menuOff();
    };
    const open = () => {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      const onPress = (e) => { if (!wrap.contains(e.target)) close(); };
      const onKey = (e) => { if (e.key === 'Escape') { close(); btn.focus(); } };
      // capture: a press on the map stops before it would bubble this far
      document.addEventListener('pointerdown', onPress, true);
      document.addEventListener('keydown', onKey);
      menuOff = () => {
        document.removeEventListener('pointerdown', onPress, true);
        document.removeEventListener('keydown', onKey);
        menuOff = null;
      };
    };
    btn.addEventListener('click', () => { if (panel.hidden) open(); else close(); });
    const item = (it, unitSaid) => {
      const b = mk('button', 'tbl-menu-item');
      b.type = 'button';
      b.setAttribute('data-col', String(it.i));
      b.appendChild(document.createTextNode(it.label));
      if (it.unit && !unitSaid) b.appendChild(mk('span', 'unit', it.unit));
      b.addEventListener('click', () => { setColumn(it.i); close(); btn.focus(); });
      return b;
    };
    columnGroups().forEach((g) => {
      if (!g.name) {
        g.items.forEach((it) => panel.appendChild(item(it)));
        return;
      }
      const d = mk('details', 'tbl-menu-group');
      const s = mk('summary', '', g.name);
      // a unit every column of the group shares is said once, on the group
      const one = g.items.every((it) => it.unit === g.items[0].unit) ? g.items[0].unit : '';
      if (one) s.appendChild(mk('span', 'unit', one));
      s.appendChild(mk('span', 'count', String(g.items.length)));
      d.appendChild(s);
      g.items.forEach((it) => d.appendChild(item(it, !!one)));
      panel.appendChild(d);
    });
    wrap.appendChild(panel);
    return wrap;
  }

  function mountBar() {
    unmountBar();
    mountFlag();
    const anyPc = T.cols.some(allowsPerCapita);
    if (T.cols.length < 2 && !anyPc) return;
    bar = mk('div');
    bar.id = 'tbl-bar';
    /* The arrows and what they step through stay on one line; only the
       per-capita box may go to a second. */
    const pick = mk('div', 'tbl-pick');
    bar.appendChild(pick);
    if (wantsStepper()) pick.appendChild(stepButton(-1));
    if (T.cols.length > MANY_COLUMNS) {
      pick.appendChild(columnMenu());
    } else if (T.cols.length > 1) {
      const sel = mk('select');
      sel.id = 'tbl-col';
      sel.setAttribute('aria-label', 'Column of the table to map');
      T.cols.forEach((c, i) => {
        const o = mk('option', '', colLabel(c));
        o.value = String(i);
        sel.appendChild(o);
      });
      sel.value = String(colAt);
      sel.addEventListener('change', () => setColumn(Number(sel.value)));
      pick.appendChild(sel);
    }
    if (wantsStepper()) pick.appendChild(stepButton(1));
    if (!pick.firstChild) pick.remove();
    if (anyPc) {
      const lab = mk('label', 'tbl-pc');
      const box = mk('input');
      box.type = 'checkbox';
      box.id = 'tbl-percap';
      box.checked = perCapita;
      box.addEventListener('change', () => { perCapita = box.checked; refresh(); });
      lab.appendChild(box);
      lab.appendChild(document.createTextNode(' Per ' + fmt(PER) + ' people'));
      bar.appendChild(lab);
    }
    // the map starts a drag on any press inside its container
    bar.addEventListener('pointerdown', (e) => e.stopPropagation());
    bar.addEventListener('dblclick', (e) => e.stopPropagation());
    document.getElementById('map-container').appendChild(bar);
    syncBar();
  }
  function unmountBar() {
    if (menuOff) menuOff();
    if (bar) bar.remove();
    bar = null;
    if (flag) flag.remove();
    flag = null;
  }
  function syncBar() {
    if (!bar) return;
    const lab = bar.querySelector('.tbl-pc');
    if (lab) lab.hidden = !allowsPerCapita(T.cols[colAt]);
    const sel = bar.querySelector('#tbl-col');
    if (sel) sel.value = String(colAt);
    const list = stepCols();
    const at = list.indexOf(colAt);
    [['#tbl-prev', at - 1], ['#tbl-next', at + 1]].forEach(([q, to]) => {
      const b = bar.querySelector(q);
      if (!b) return;
      b.disabled = to < 0 || to >= list.length;
      b.title = b.disabled ? '' : colLabel(T.cols[list[to]]);
    });
    const now = bar.querySelector('#tbl-menu-btn .now');
    if (!now) return;
    now.textContent = colLabel(T.cols[colAt]);
    bar.querySelectorAll('.tbl-menu-item').forEach((b) => {
      const on = b.getAttribute('data-col') === String(colAt);
      b.classList.toggle('on', on);
      if (on) {
        b.setAttribute('aria-current', 'true');
        // what is in use is never folded away
        const d = b.closest('details');
        if (d) d.open = true;
      } else b.removeAttribute('aria-current');
    });
  }

  function setColumn(i) {
    colAt = i;
    syncBar();
    refresh();
  }
  /* The picture, the key, and the card if the card is ours. */
  function refresh() {
    host.repaint();
    drawPoints();
    if (cardNow === 'table') tableCard();
    else if (cardNow) placeCard(cardNow);
  }

  /* The method in the address, beside the table, with no `hashchange`: that
     would read the table again. */
  function methodFrom(fragment) {
    const m = /(?:^#|&)tk=([a-z]+)/.exec(String(fragment));
    return m && METHOD_IDS.has(m[1]) ? m[1] : 'quantile';
  }

  function styleFrom(fragment) {
    const m = /(?:^#|&)ts=([a-z]+)/.exec(String(fragment));
    return m && (m[1] === 'size' || m[1] === 'colour') ? m[1] : '';
  }
  /* One setting beside the table in the address, or none where it is the default. */
  function writeParam(name, value) {
    let h = location.hash.replace(new RegExp('&' + name + '=[a-z]*', 'g'), '');
    if (value) h += '&' + name + '=' + value;
    try { history.replaceState(history.state, '', location.pathname + location.search + h); }
    catch (err) { /* the map still changes; only the address does not */ }
  }
  function setMethod(m) {
    method = METHOD_IDS.has(m) ? m : 'quantile';
    writeParam('tk', method === 'quantile' ? '' : method);
    refresh();
  }
  function setStyle(v) {
    style = v === 'size' || v === 'colour' ? v : '';
    writeParam('ts', style);
    refresh();
  }
  /* Sizes or colours, for a table of cities. Sizes are not offered for a column
     with a figure below nought. */
  function stylePicker() {
    const sel = mk('select', 'tbl-classes');
    sel.id = 'tbl-style';
    sel.setAttribute('aria-label', 'Show the classes by size or by colour');
    [['size', 'Sizes'], ['colour', 'Colours']].forEach(([id, label]) => {
      const o = mk('option', '', label);
      o.value = id;
      if (id === 'size' && !canSize()) {
        o.disabled = true;
        o.title = 'Needs every figure at or above nought';
      }
      sel.appendChild(o);
    });
    sel.value = styleNow();
    sel.addEventListener('change', () => setStyle(sel.value));
    return sel;
  }
  /* The dropdown under the key. Hidden where nought splits the column, and
     Logarithmic not offered where a figure is at or below nought. */
  function methodPicker(sc) {
    const sel = mk('select', 'tbl-classes');
    sel.id = 'tbl-classes';
    sel.setAttribute('aria-label', 'How the classes are divided');
    const positive = allShown().every((v) => v > 0);
    METHODS.forEach(([id, label]) => {
      // proportional is a way of drawing circles, not of cutting classes
      if (id === 'prop' && !circles()) return;
      const o = mk('option', '', label);
      o.value = id;
      if (id === 'log' && !positive) {
        o.disabled = true;
        o.title = 'Needs every figure above nought';
      }
      if (id === 'prop' && !canProp()) {
        o.disabled = true;
        o.title = 'For a count or an amount, not per head';
      }
      sel.appendChild(o);
    });
    sel.value = propNow() ? 'prop' : sc.method === 'div' ? method : sc.method;
    sel.addEventListener('change', () => setMethod(sel.value));
    return sel;
  }

  /* --------------------------------------------------------------- the card */

  function showCard(block, render) {
    host.showCard(Object.assign({ chip: CHIP, colour: CHIP_INK }, block), (h) => {
      h.textContent = '';
      h.hidden = false;
      render(h);
    });
  }
  function linkButton(label, fn) {
    const b = mk('button', 'cen-link', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function plainButton(label, fn) {
    const b = mk('button', 'plain', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function headBlock() {
    return { primary: T.en || T.ja, alt: T.en ? T.ja : '',
      // most volume titles already end in their year
      prov: T.year && T.volume.includes(T.year) ? T.volume : [T.volume, T.year].filter(Boolean).join(' · ') };
  }
  function bars(rows, onPick) {
    const ul = mk('ul', 'cen-bars');
    const max = rows.reduce((m, r) => Math.max(m, Math.abs(r.n)), 0) || 1;
    rows.forEach((r) => {
      const li = mk('li');
      const b = mk('button', 'cen-bar');
      b.type = 'button';
      b.appendChild(mk('span', 'nm', r.name));
      b.appendChild(mk('span', 'val', r.val));
      const tr = mk('span', 'track');
      const fi = mk('span', 'fill');
      fi.style.width = (Math.abs(r.n) / max * 100).toFixed(1) + '%';
      tr.appendChild(fi);
      b.appendChild(tr);
      b.addEventListener('click', () => onPick(r));
      li.appendChild(b);
      ul.appendChild(li);
    });
    return ul;
  }

  function tableCard() {
    unmark();
    cardNow = 'table';
    showCard(headBlock(), (h) => {
      const c = T.cols[colAt];
      if (T.date) h.appendChild(mk('p', 'tbl-line', 'Figures for ' + T.date));
      if (T.part) h.appendChild(mk('p', 'tbl-line', 'Part: ' + T.part));
      h.appendChild(mk('p', 'tbl-line tbl-col-now', 'Showing: ' + colLabel(c)
        + (perCapitaOn() ? ', per ' + fmt(PER) + ' people, ' + censusYear() + ' census' : '')));
      if (c.en && c.name) h.appendChild(mk('p', 'tbl-line tbl-printed', 'Printed as: ' + c.name));
      totalLines(h, colAt);
      const list = [];
      T.rows.forEach((r, id) => {
        const v = shown(id);
        if (v !== null) list.push({ id, n: v, name: placeName(id), val: viewText(v) });
      });
      list.sort((a, b) => b.n - a.n);
      if (list.length) {
        h.appendChild(mk('p', 'pop-head', list.length <= 10 ? 'Every place' : 'Highest'));
        h.appendChild(bars(list.slice(0, 10), (r) => placeCard(r.id)));
      }
      T.notes.forEach((n) => h.appendChild(mk('p', 'tbl-note', n)));
      if (listsMisses()) {
        if (unplacedCount()) {
          const names = T.unplaced.slice(0, 40).join(', ') + (unplacedCount() > 40 ? ', …' : '');
          h.appendChild(mk('p', 'tbl-note tbl-unplaced', unplacedLine().replace(/\.$/, ': ') + names + '.'));
        }
      } else if (T.dropped) {
        h.appendChild(mk('p', 'tbl-note', T.dropped + (T.dropped === 1 ? ' row' : ' rows')
          + ' could not be placed on this map.'));
      }
      const acts = mk('p', 'cen-actions');
      acts.appendChild(plainButton('All figures', allFigures));
      acts.appendChild(plainButton('Remove from the map', host.close));
      h.appendChild(acts);
    });
  }

  /* "Printed total (總計): 10,661", or the whole the table names: "Empire 帝國". */
  function totalText(i) {
    if (!T.total) return '';
    const cell = T.total.cells[i];
    // a total that is not a figure, past the ceiling or unreadable, is not said
    if (cell.as !== 'num') return '';
    const c = T.cols[i];
    if (T.total.en) return T.total.en + (T.total.label ? ' ' + T.total.label : '') + ': ' + cell.t;
    const what = c.kind !== 'rate' ? 'Printed total' : T.units === 'territory' ? 'Overall rate' : 'National rate';
    return what + (T.total.label ? ' (' + T.total.label + ')' : '') + ': ' + cell.t;
  }
  function totalLines(h, i) {
    const said = totalText(i);
    if (!said) return;
    h.appendChild(mk('p', 'tbl-line', said));
    if (T.total.adds[i] !== null) {
      h.appendChild(mk('p', 'tbl-line', 'The places mapped add up to ' + fmt(T.total.adds[i]) + '.'));
    }
  }

  function placeCard(id) {
    const pl = placeOf(id);
    const row = T.rows.get(id);
    cardNow = id;
    mark(id);
    /* The figure in the head: on a phone the head is all a first tap shows. */
    const c = T.cols[colAt];
    const now = row ? row.cells[colAt] : null;
    const head = (row && row.label) || pl.ja || '';
    const alt = now ? head + ' · ' + now.t + (now.n !== null && c.unit ? ' ' + c.unit : '') : head;
    showCard({ primary: pl.en, alt: alt, prov: T.en || T.ja }, (h) => {
      if (!row) {
        h.appendChild(mk('p', 'tbl-line', 'This table has no row for this place.'));
      } else {
        if (row.label) h.appendChild(mk('p', 'tbl-line', 'Printed as: ' + row.label));
        /* A table of several parts, or of one measure at several dates, is a list
           under each part's heading, so the heading is said once and not on
           every line. */
        columnGroups().forEach((g) => {
          if (g.name) h.appendChild(mk('p', 'pop-head tbl-group', g.name));
          const ul = mk('ul', 'tbl-values');
          g.items.forEach((it) => {
            const i = it.i;
            const c = T.cols[i];
            const li = mk('li', i === colAt ? 'on' : '');
            const b = mk('button', 'tbl-value');
            b.type = 'button';
            b.title = 'Map this column';
            b.appendChild(mk('span', 'nm', g.name ? it.label + (c.unit ? ' (' + c.unit + ')' : '') : colLabel(c)));
            b.appendChild(mk('span', 'val', row.cells[i].t));
            const extra = [sharePct(row, i) ? sharePct(row, i) + ' of the printed total' : '',
              perCapitaText(id, i)].filter(Boolean).join(' · ');
            if (extra) b.appendChild(mk('span', 'sub', extra));
            b.addEventListener('click', () => setColumn(i));
            li.appendChild(b);
            ul.appendChild(li);
          });
          h.appendChild(ul);
        });
        if (T.cols.some((c, i) => allowsPerCapita(c) && perCapitaText(id, i))) {
          h.appendChild(mk('p', 'tbl-note', 'Per person figures use the ' + censusLabel()
            + (isCity() ? ' of the city.' : '.')));
        }
      }
      const acts = mk('p', 'cen-now');
      acts.appendChild(linkButton('About this table', tableCard));
      h.appendChild(acts);
    });
  }

  /* The outline of the place the card is about. */
  function mark(id) {
    unmark();
    const pl = placeOf(id);
    // Japan proper is forty-seven prefectures: outlining each is a grid, not a place
    if (pl.proper) return;
    if (pl.city) {
      const g = document.querySelector('#tbl-points .tbl-pt[data-id="' + CSS.escape(id) + '"]');
      if (g) { g.classList.add('tbl-sel'); marked = [g]; }
      return;
    }
    // a prefecture of Taiwan is its districts; a country, its atoms
    if (pl.shu || pl.country) {
      const shapes = [];
      if (pl.shu) {
        host.subSet('taiwan-district').forEach((k) => {
          const rec = host.subUnit(k);
          if (rec && rec.shu === id) host.shapesOf({ key: k }).forEach((el) => shapes.push(el));
        });
      } else {
        countryAtoms(pl, host.epoch()).forEach((a) => host.shapesOf({ atom: a }).forEach((el) => shapes.push(el)));
      }
      shapes.forEach((el) => el.classList.add('tbl-sel'));
      marked = shapes;
      return;
    }
    const shapes = host.shapesOf(pl);
    shapes.forEach((el) => el.classList.add('tbl-sel'));
    marked = shapes;
  }
  function unmark() {
    marked.forEach((el) => el.classList.remove('tbl-sel'));
    marked = [];
  }

  /* Every figure, with its source: the rule for any table this map draws. */
  function allFigures() {
    const dlg = host.tableBox();
    if (!dlg) return;
    dlg.querySelector('.table-title').textContent = CHIP;
    const open = dlg.querySelector('.table-open');
    if (open) open.hidden = true;
    const body = dlg.querySelector('.table-body');
    body.textContent = '';
    const wrap = mk('div', 'pop-table-block');
    const title = T.ja || T.en;
    wrap.appendChild(mk('p', 'pop-head', T.en && T.ja ? T.en + ' · ' + T.ja : title));
    const cols = [{ head: 'Place', text: true }];
    T.cols.forEach((c) => {
      cols.push({ head: colLabel(c) });
      if (allowsPerCapita(c)) cols.push({ head: colName(c) + ' per ' + fmt(PER) + ' people (' + censusLabel(T.cols.indexOf(c)) + ')' });
    });
    const rows = [];
    T.rows.forEach((r, id) => {
      const pl = placeOf(id);
      const cells = [{ t: pl.en + ' ' + (r.label || pl.ja), name: pl.en, kanji: r.label || pl.ja }];
      T.cols.forEach((c, i) => {
        const cell = r.cells[i];
        cells.push({ t: cell.as === 'num' ? cell.t : cell.as === 'none' ? '—' : cell.t, n: cell.n });
        if (allowsPerCapita(c)) {
          const people = peopleOf(pl, i);
          const v = people && cell.n !== null ? cell.n / people * PER : null;
          cells.push({ t: v === null ? '—' : v.toFixed(3), n: v === null ? null : Number(v.toFixed(3)) });
        }
      });
      rows.push({ key: id, cells });
    });
    const tableEl = host.popSortable(cols, rows);
    wrap.appendChild(tableEl);
    const notes = [];
    if (T.total) {
      T.cols.forEach((c, i) => {
        if (T.total.cells[i].as !== 'none') {
          notes.push((c.kind === 'rate' ? 'National rate, ' : 'Printed total, ') + colName(c) + ': ' + T.total.cells[i].t);
        }
      });
    }
    T.notes.forEach((n) => notes.push(n));
    if (listsMisses() && unplacedCount()) notes.push(unplacedLine().replace(/\.$/, ': ') + T.unplaced.join(', ') + '.');
    notes.forEach((n) => wrap.appendChild(mk('p', 'pop-note', '* ' + n)));
    const citation = [T.volume, T.year, T.ja].filter(Boolean).join(', ');
    const source = citation + (T.src ? '. ' + T.src.url : '');
    /* Only the address is the link. The citation is the payload's own words, and
       as anchor text it could read as one address while going to another. */
    const src = mk('p', 'pop-src', citation + (T.src ? '. ' : ''));
    if (T.src) {
      const a = mk('a', '', T.src.url);
      a.href = T.src.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      src.appendChild(a);
    }
    wrap.appendChild(src);
    host.addCsvButton(wrap, tableEl, T.en || T.ja, notes, source);
    body.appendChild(wrap);
    if (!dlg.open) dlg.showModal();
    body.scrollTop = 0;
  }

  /* A table a new link has replaced must not stay open over it. */
  function closeDialog() {
    const d = document.getElementById('dlg-table');
    if (d && d.open) d.close();
  }

  function errorCard(reason, src) {
    const why = {
      units: 'This link holds a kind of table the map cannot draw yet.',
      empty: 'None of this table’s rows could be placed on the map.',
      browser: 'This browser cannot read the table in this link.',
    }[reason] || 'The table in this link could not be read.';
    host.showCard({ chip: CHIP, colour: CHIP_INK, primary: 'Table not shown', alt: '', prov: '', note: '' },
      (h) => {
        h.textContent = '';
        h.hidden = false;
        h.appendChild(mk('p', 'tbl-line', why));
        if (src) {
          const p = mk('p', 'tbl-line');
          const a = mk('a', '', 'Source table (' + src.host + ')');
          a.href = src.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          p.appendChild(a);
          h.appendChild(p);
        }
      });
  }

  /* --------------------------------------------------------------- the api */

  return {
    up() { return !!T; },
    fills,
    wholeFills,
    mapValues,

    /* The fragment is read: a table, or a card that says why not. */
    async open(fragment) {
      let parsed;
      try {
        const raw = await inflate(fragment);
        if (raw && raw.v !== 1) console.warn('Table payload version', raw.v, '— reading as v1');
        /* Provinces are placed by asking the document which shape each is drawn
           in, so the sheet that holds them has to be there first. Not forever:
           past the limit the table is read with what has arrived. */
        if (raw && SUB_KINDS.has(raw.units)) {
          await Promise.race([host.whenAdmin(), new Promise((r) => setTimeout(r, ADMIN_WAIT_MS))]);
        }
        parsed = normalise(raw);
      } catch (err) {
        // the address has moved on while this was inflating: it is not the reader's now
        if (fragment !== location.hash) return false;
        closeDialog();
        if (T) host.close();
        errorCard(err && err.message, err && err.src);
        return false;
      }
      if (fragment !== location.hash) return false;
      closeDialog();
      if (T) { unmountBar(); unmark(); cardNow = null; }
      T = parsed;
      colAt = T.def;
      perCapita = false;
      method = methodFrom(fragment);
      style = styleFrom(fragment);
      /* All of it or none of it: a map shaded with no card and no dropdown cannot
         be read or closed. */
      try {
        host.opened(T.period);
        drawPoints();
        mountBar();
        tableCard();
      } catch (err) {
        console.warn('Table could not be shown', err);
        host.close();
        errorCard('shape', parsed.src);
        return false;
      }
      return true;
    },

    /* The map has closed it. */
    close() {
      closeDialog();
      unmountBar();
      unmark();
      host.setPoints([]);
      T = null;
      cardNow = null;
    },
    /* Any other card opened, or the card closed. */
    released() {
      unmark();
      cardNow = null;
    },
    ownsCard(chipText) { return chipText === CHIP; },

    /* Pressed on the map. True if the table answered. */
    tap(provKey, recId, el) {
      const id = placeAt(provKey, recId, el);
      if (!id) return false;
      placeCard(id);
      return true;
    },

    tipKey() { return T ? colAt + '|' + perCapita : ''; },
    /* The hover: the place as printed, and the figure as printed. */
    tip(provKey, recId, el) {
      const id = placeAt(provKey, recId, el);
      // the name over the tip is the prefecture's; for Japan proper the figure is not
      return id ? tipFor(id, false) : null;
    },

    /* A city of the table under the pointer: its tip, which carries its own name,
       there being no shape of the map's under it to name it. True if it answered. */
    hoverPoint(target, x, y) {
      const id = T ? pointId(target) : null;
      if (!id) return false;
      host.pointTip('tbl|' + id + '|' + colAt + '|' + perCapita, (box) => box.appendChild(tipFor(id, true)), x, y);
      return true;
    },
    /* Pressed on a city of the table: its card. */
    tapPoint(target) {
      const id = T ? pointId(target) : null;
      if (!id) return false;
      placeCard(id);
      return true;
    },

    /* The foot of every card. */
    more() {
      return T && T.src ? { href: T.src.url, en: 'Source table (' + T.src.host + ')' } : null;
    },

    /* The key. */
    legend(el) {
      const c = T.cols[colAt];
      el.appendChild(mk('p', 'legend-sub tbl-key-head', T.en || T.ja));
      const body = mk('div', 'cen-key');
      const when = c.date || T.date;
      // a heading that already says its year is not followed by it again
      const what = colLabel(c) + (when && !colLabel(c).includes(when.slice(0, 4)) ? ', ' + when : '');
      body.appendChild(mk('p', 'cen-key-title', what));
      if (perCapitaOn()) {
        body.appendChild(mk('p', 'cen-key-note', 'Per ' + fmt(PER) + ' people, using the '
          + censusLabel() + (isCity() ? ' of each city.' : T.units === 'prefecture' ? '. Colonies are left out.' : '.')));
      }
      const row = (colour, label) => {
        const r = mk('div', 'item pop-key-row');
        const sw = mk('span', 'sw');
        sw.style.background = colour;
        r.appendChild(sw);
        r.appendChild(document.createTextNode(label));
        body.appendChild(r);
      };
      /* A class as the circle the map draws for it, beside its range. */
      const sizeRow = (r, words) => {
        const it = mk('div', 'item pop-key-row tbl-size-row');
        const w = Math.ceil(SIZE_R[SIZE_R.length - 1] * 2 + 2);
        const svg = svgNode('svg', { width: w, height: Math.ceil(r * 2 + 2), 'aria-hidden': 'true' });
        svg.appendChild(svgNode('circle', { cx: w / 2, cy: r + 1, r, class: 'ref' }));
        it.appendChild(svg);
        it.appendChild(document.createTextNode(words));
        body.appendChild(it);
      };
      const sc = scale();
      const b = sc.breaks;
      const count = b.length + 1;
      const label = (x) => (perCapitaOn() ? String(x) : fmt(x));
      const pooled = scaleCols().length;
      if (pooled > 1) body.appendChild(mk('p', 'cen-key-note', 'On one scale with the other columns of its series.'));
      const round = circles();
      if (propNow()) {
        /* Three circles the size the map draws them, at round figures under the
           largest: the area is the figure. */
        const max = circleMax();
        const top = sig2(max) > max ? sig2(max / 1.5) : sig2(max);
        const refs = Array.from(new Set([top, sig2(top / 4), sig2(top / 20)])).filter((x) => x > 0);
        const box = mk('div', 'tbl-circles');
        const big = radiusOf(refs[0], max);
        const w = Math.ceil(big * 2 + 2);
        const svg = svgNode('svg', { width: w, height: w, viewBox: '0 0 ' + w + ' ' + w, 'aria-hidden': 'true' });
        refs.forEach((x) => {
          const r = radiusOf(x, max);
          svg.appendChild(svgNode('circle', { cx: w / 2, cy: w - 1 - r, r, class: 'ref' }));
        });
        box.appendChild(svg);
        const words = mk('div', 'tbl-circle-words');
        refs.forEach((x) => words.appendChild(mk('span', '', fmt(x) + (c.unit ? ' ' + c.unit : ''))));
        box.appendChild(words);
        body.appendChild(box);
        body.appendChild(mk('p', 'cen-key-note', 'Circle area is the figure.'));
      }
      if (few()) {
        /* Few places: each one, with its figure, highest first, and a press away. */
        const list = [];
        T.rows.forEach((r, id) => list.push({ id, v: shown(id), cell: r.cells[colAt] }));
        list.sort((x, y) => (y.v === null ? -Infinity : y.v) - (x.v === null ? -Infinity : x.v));
        list.forEach((it) => {
          const r = mk('button', 'item pop-key-row tbl-key-place');
          r.type = 'button';
          r.setAttribute('data-place', it.id);
          const sw = mk('span', 'sw');
          sw.style.background = round && it.v !== null ? CIRCLE : colourFor(it.id, sc);
          r.appendChild(sw);
          r.appendChild(mk('span', 'nm', placeName(it.id)));
          // no figure: which kind of none, not the cell's text, which can be anything
          const none = { nil: '— Nil', unreadable: 'Unreadable' }[it.cell.as] || 'No figure';
          r.appendChild(mk('span', 'val', it.v === null ? none : viewText(it.v)));
          r.addEventListener('click', () => placeCard(it.id));
          body.appendChild(r);
        });
      } else if (allShown().length && !propNow()) {
        for (let i = 0; i < count; i++) {
          const words = !b.length ? 'All places shown'
            : i === 0 ? 'under ' + label(b[0])
              : i === b.length ? label(b[i - 1]) + ' and over'
                : label(b[i - 1]) + '–' + label(b[i]);
          if (round) sizeRow(SIZE_R[swatchOf(i, count)], words);
          else row(sc.ramp[swatchOf(i, count)], words);
        }
      }
      /* The three ways of having no figure are not the same, and each swatch is
         here only if something on the map is wearing it. */
      /* The whole the table prints, which is no place on the map: the empire in a
         table of its parts, the country in a table of prefectures. */
      const whole = perCapitaOn() ? '' : totalText(colAt);
      if (whole) body.appendChild(mk('p', 'cen-key-note tbl-key-total', whole + (c.unit && T.total.cells[colAt].n !== null ? ' ' + c.unit : '')));
      const seen = new Set();
      T.rows.forEach((r) => seen.add(r.cells[colAt].as));
      if (!few()) {
        if (seen.has('nil')) row(NIL, '— Nil');
        if (seen.has('unreadable')) row(UNREADABLE, 'Unreadable in the scan');
      }
      // in a table of the empire's parts, nothing it has no row for is painted
      if (T.units === 'prefecture' || (isSub() && (T.units === 'taiwan-prefecture'
        || T.cities.size > T.rows.size))) row(host.blank, 'No data');
      if (listsMisses() && unplacedCount()) body.appendChild(mk('p', 'cen-key-note tbl-key-unplaced', unplacedLine()));
      if (method === 'log' && sc.method === 'quantile') {
        body.appendChild(mk('p', 'cen-key-note', 'Logarithmic needs figures above nought, so quantiles are shown.'));
      }
      const acts = mk('div', 'tbl-key-acts');
      if (isCity() && allShown().length > 1) acts.appendChild(stylePicker());
      if (sc.method !== 'div' && allShown().length > 1) acts.appendChild(methodPicker(sc));
      const about = mk('button', 'cen-chip', 'About this table');
      about.type = 'button';
      about.addEventListener('click', tableCard);
      acts.appendChild(about);
      const off = mk('button', 'cen-chip', 'Remove');
      off.type = 'button';
      off.addEventListener('click', host.close);
      acts.appendChild(off);
      body.appendChild(acts);
      el.appendChild(body);
    },

    // for the tests
    report() {
      return T ? { col: colAt, perCapita: perCapitaOn(), census: censusYear(),
        rows: T.rows.size, dropped: T.dropped, card: cardNow, units: T.units,
        scaleCols: scaleCols(), stepCols: stepCols(), few: few(), method, breaks: scale().breaks,
        circles: circles(), proportional: propNow(), style: styleNow(), unplaced: unplacedCount(), period: T.period,
        points: document.querySelectorAll('#tbl-points .tbl-pt').length } : null;
    },
  };
};
