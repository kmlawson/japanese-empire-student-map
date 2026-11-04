


























'use strict';

window.JMAP_TABLE = function (host) {
  const CHIP = 'Table';
  const CHIP_INK = '#1f5b8f';
  const MAX_FRAGMENT = 200000;      // characters of base64; payloads are 1–3 KB
  const MAX_JSON = 2000000;         // bytes once inflated
  const PER = 1000;                 // the per-capita view is per this many people


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

  const RAMP = ['#dfeaf4', '#c3d6e8', '#8fb4d4', '#5286b4', '#1f5b8f'];
  const RAMP_DIV = ['#b2533f', '#e3a793', '#f2efe9', '#8fb4d4', '#1f5b8f'];
  const NIL = '#efe6cf';
  const UNREADABLE = '#b9b4a8';

  let T = null;                     // the table
  let colAt = 0;
  let perCapita = false;
  let bar = null;
  let cardNow = null;               // what our card is showing: null, 'table', or a place id
  let marked = [];



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
    if (typeof DecompressionStream !== 'function') throw new Error('browser');
    let b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - b64.length % 4) % 4);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const reader = new Blob([bytes]).stream()
      .pipeThrough(new DecompressionStream('deflate-raw')).getReader();
    const parts = [];
    let size = 0;
    for (;;) {
      const got = await reader.read();
      if (got.done) break;
      size += got.value.length;

      if (size > MAX_JSON) { reader.cancel(); throw new Error('too long'); }
      parts.push(got.value);
    }
    const all = new Uint8Array(size);
    let at = 0;
    parts.forEach((p) => { all.set(p, at); at += p.length; });
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
  }



  function text(s) {
    if (typeof s !== 'string' && typeof s !== 'number') return '';
    const t = String(s).trim();
    return /^[=+@\t\r]/.test(t) || /^-./.test(t) && !/^-[\d.]/.test(t) ? "'" + t : t;
  }

  function sourceLink(src) {
    try {
      const u = new URL(String(src && src.url));
      if (u.protocol === 'https:' || u.protocol === 'http:') return { url: u.href, host: u.hostname };
    } catch (err) { /* not an address; there is simply no link */ }
    return null;
  }

  function readCell(v) {
    if (typeof v === 'number' && isFinite(v)) return { n: v, t: fmt(v), as: 'num' };
    if (v === '?') return { n: null, t: 'Unreadable in the scan', as: 'unreadable' };
    if (v === '-') return { n: null, t: '— (nil)', as: 'nil' };
    if (v === '' || v === null || v === undefined) return { n: null, t: 'No data', as: 'none' };
    return { n: null, t: text(v), as: 'other' };
  }

  function fmt(n) {
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 6 });
  }



  function normalise(p) {
    if (!p || typeof p !== 'object') throw new Error('shape');
    if (p.units !== 'prefecture') throw Object.assign(new Error('units'), { src: sourceLink(p.src) });
    if (!Array.isArray(p.cols) || !p.cols.length || p.cols.length > 200
        || !Array.isArray(p.rows) || p.rows.length > 500) throw new Error('shape');
    const cols = p.cols.map((c) => {
      const o = c && typeof c === 'object' ? c : {};
      return { name: text(o.name), en: text(o.en), unit: text(o.unit), kind: text(o.kind),
        pc: o.pc === true, div: o.color === 'div' };
    });
    const rows = new Map();
    let dropped = 0;
    p.rows.forEach((r) => {
      if (!r || !PLACES.has(r.id) || rows.has(r.id)) { dropped++; return; }
      const v = Array.isArray(r.v) ? r.v : [];
      rows.set(r.id, { id: r.id, label: text(r.label), cells: cols.map((c, i) => readCell(v[i])) });
    });
    if (!rows.size) throw Object.assign(new Error('empty'), { src: sourceLink(p.src) });
    const title = p.title && typeof p.title === 'object' ? p.title : {};
    const vol = p.volume && typeof p.volume === 'object' ? p.volume : {};
    let total = null;
    if (p.total && typeof p.total === 'object') {
      const v = Array.isArray(p.total.v) ? p.total.v : [];
      const mis = p.total.mismatch && typeof p.total.mismatch === 'object' ? p.total.mismatch : {};
      total = { label: text(p.total.label), cells: cols.map((c, i) => readCell(v[i])),
        adds: cols.map((c, i) => {
          const m = Object.prototype.hasOwnProperty.call(mis, String(i)) ? mis[String(i)] : null;
          return typeof m === 'number' ? m : null;
        }) };
    }
    const def = Number.isInteger(p.def) && p.def >= 0 && p.def < cols.length ? p.def : 0;
    return {
      version: p.v, src: sourceLink(p.src),
      ja: text(title.ja), en: text(title.en),
      volume: text(vol.title), year: text(vol.year), volumeEn: text(vol.en),
      date: /^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(p.date)) ? String(p.date) : '',
      period: p.period === '1930' || p.period === '1942' ? p.period : '',
      part: text(p.part), cols, def, rows, total, dropped,
      notes: (Array.isArray(p.notes) ? p.notes : []).map(text).filter(Boolean).slice(0, 12),
    };
  }



  function colName(c) { return c.en || c.name; }
  function colLabel(c) { return colName(c) + (c.unit ? ' (' + c.unit + ')' : ''); }
  function isSummable(c) { return c.kind === 'count' || c.kind === 'amount'; }

  function allowsPerCapita(c) { return c.pc && (isSummable(c) || !c.kind); }
  function perCapitaOn() { return perCapita && allowsPerCapita(T.cols[colAt]); }



  function censusYear() {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(T.date || T.year || '');
    if (!m) return 1930;
    const when = Number(m[1]) + (m[2]
      ? (Number(m[2]) - 1 + (m[3] ? Number(m[3]) / 31 : 0.5)) / 12 : 0.5);
    return Math.abs(when - 1930.75) <= Math.abs(when - 1940.75) ? 1930 : 1940;
  }
  function peopleOf(place) {
    if (!place.key) return null;      // colonies: no matching figure, so left out
    const row = host.popRows('japan-' + censusYear());
    const r = row && row[place.key];
    return r && r.pop ? r.pop : null;
  }


  function shown(id) {
    const row = T.rows.get(id);
    if (!row) return null;
    const n = row.cells[colAt].n;
    if (n === null) return null;
    if (!perCapitaOn()) return n;
    const people = peopleOf(PLACES.get(id));
    return people ? n / people * PER : null;
  }
  function allShown() {
    const out = [];
    T.rows.forEach((r, id) => { const v = shown(id); if (v !== null) out.push(v); });
    return out;
  }
  function sig2(x) {
    if (!x) return 0;
    const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);
    return Math.round(x / p) * p;
  }
  function tidy(x) { return Number(x.toPrecision(6)); }



  function scale() {
    const vals = allShown().sort((a, b) => a - b);
    const c = T.cols[colAt];
    if (c.div && vals.length && vals[0] < 0 && vals[vals.length - 1] > 0) {
      const m = sig2(Math.max(-vals[0], vals[vals.length - 1]));
      return { ramp: RAMP_DIV, breaks: [-0.5 * m, -0.1 * m, 0.1 * m, 0.5 * m].map(tidy) };
    }
    const distinct = Array.from(new Set(vals));
    if (distinct.length < 2) return { ramp: RAMP, breaks: [] };
    const classes = Math.min(RAMP.length, distinct.length);
    const breaks = [];
    for (let i = 1; i < classes; i++) {
      const cut = tidy(sig2(vals[Math.floor(i * vals.length / classes)]));
      if (cut > vals[0] && !breaks.includes(cut)) breaks.push(cut);
    }
    return { ramp: RAMP, breaks: breaks.sort((a, b) => a - b) };
  }

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
    const sc = scale();
    const out = {};
    PLACES.forEach((pl, id) => { if (pl.key) out[pl.key] = colourFor(id, sc); });
    return out;
  }
  function wholeFills() {
    const sc = scale();
    const out = {};
    PLACES.forEach((pl, id) => { if (pl.atom && T.rows.has(id)) out[pl.atom] = colourFor(id, sc); });
    return out;
  }
  function viewText(v) {
    if (!perCapitaOn()) return fmt(v);
    return v >= 10 ? fmt(Math.round(v * 10) / 10) : v >= 1 ? v.toFixed(2) : v.toPrecision(2);
  }

  function mapValues() {
    const sc = scale();
    const out = [];
    T.rows.forEach((r, id) => {
      const pl = PLACES.get(id);
      const v = shown(id);
      if (pl.key && v !== null) {
        const s = swatchOf(classOf(v, sc.breaks), sc.breaks.length + 1);
        out.push({ key: pl.key, text: viewText(v),
          dark: sc.ramp === RAMP_DIV ? s === 0 || s === 4 : s >= 3 });
      }
    });
    return out;
  }



  function placeAt(provKey, recId, el) {
    const code = CODE_OF_KEY.get(provKey) || CODE_OF_KEY.get(host.figuresFrom(provKey))
      || CODE_OF_KEY.get(host.groupPartOf(el));
    if (code) return code;
    const whole = PLACES.get(recId);
    return whole && whole.atom && T.rows.has(recId) ? recId : null;
  }
  function placeName(id) { const p = PLACES.get(id); return p.en + ' ' + p.ja; }

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
    const people = peopleOf(PLACES.get(id));
    if (!people) return '';
    const v = row.cells[i].n / people * PER;
    const s = v >= 10 ? fmt(Math.round(v * 10) / 10) : v >= 1 ? v.toFixed(2) : v.toPrecision(2);
    return s + ' per ' + fmt(PER) + ' people';
  }



  function mountBar() {
    unmountBar();
    const anyPc = T.cols.some(allowsPerCapita);
    if (T.cols.length < 2 && !anyPc) return;
    bar = mk('div');
    bar.id = 'tbl-bar';
    if (T.cols.length > 1) {
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
      bar.appendChild(sel);
    }
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

    bar.addEventListener('pointerdown', (e) => e.stopPropagation());
    bar.addEventListener('dblclick', (e) => e.stopPropagation());
    document.getElementById('map-container').appendChild(bar);
    syncBar();
  }
  function unmountBar() {
    if (bar) bar.remove();
    bar = null;
  }
  function syncBar() {
    const lab = bar && bar.querySelector('.tbl-pc');
    if (lab) lab.hidden = !allowsPerCapita(T.cols[colAt]);
  }

  function setColumn(i) {
    colAt = i;
    syncBar();
    refresh();
  }

  function refresh() {
    host.repaint();
    if (cardNow === 'table') tableCard();
    else if (cardNow) placeCard(cardNow);
  }



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
        h.appendChild(mk('p', 'pop-head', 'Highest'));
        h.appendChild(bars(list.slice(0, 10), (r) => placeCard(r.id)));
      }
      T.notes.forEach((n) => h.appendChild(mk('p', 'tbl-note', n)));
      if (T.dropped) {
        h.appendChild(mk('p', 'tbl-note', T.dropped + (T.dropped === 1 ? ' row' : ' rows')
          + ' could not be placed on this map.'));
      }
      const acts = mk('p', 'cen-actions');
      acts.appendChild(plainButton('All figures', allFigures));
      acts.appendChild(plainButton('Remove from the map', host.close));
      h.appendChild(acts);
    });
  }

  function totalLines(h, i) {
    if (!T.total) return;
    const cell = T.total.cells[i];
    if (cell.as === 'none') return;
    const c = T.cols[i];
    const what = c.kind === 'rate' ? 'National rate' : 'Printed total';
    h.appendChild(mk('p', 'tbl-line', what + (T.total.label ? ' (' + T.total.label + ')' : '')
      + ': ' + cell.t));
    if (T.total.adds[i] !== null) {
      h.appendChild(mk('p', 'tbl-line', 'The places mapped add up to ' + fmt(T.total.adds[i]) + '.'));
    }
  }

  function placeCard(id) {
    const pl = PLACES.get(id);
    const row = T.rows.get(id);
    cardNow = id;
    mark(id);

    const c = T.cols[colAt];
    const now = row ? row.cells[colAt] : null;
    const head = (row && row.label) || pl.ja;
    const alt = now ? head + ' · ' + now.t + (now.n !== null && c.unit ? ' ' + c.unit : '') : head;
    showCard({ primary: pl.en, alt: alt, prov: T.en || T.ja }, (h) => {
      if (!row) {
        h.appendChild(mk('p', 'tbl-line', 'This table has no row for this place.'));
      } else {
        if (row.label) h.appendChild(mk('p', 'tbl-line', 'Printed as: ' + row.label));
        const ul = mk('ul', 'tbl-values');
        T.cols.forEach((c, i) => {
          const li = mk('li', i === colAt ? 'on' : '');
          const b = mk('button', 'tbl-value');
          b.type = 'button';
          b.title = 'Map this column';
          b.appendChild(mk('span', 'nm', colLabel(c)));
          b.appendChild(mk('span', 'val', row.cells[i].t));
          const extra = [sharePct(row, i) ? sharePct(row, i) + ' of the printed total' : '',
            perCapitaText(id, i)].filter(Boolean).join(' · ');
          if (extra) b.appendChild(mk('span', 'sub', extra));
          b.addEventListener('click', () => {
            const sel = bar && bar.querySelector('#tbl-col');
            if (sel) sel.value = String(i);
            setColumn(i);
          });
          li.appendChild(b);
          ul.appendChild(li);
        });
        h.appendChild(ul);
        if (T.cols.some((c, i) => allowsPerCapita(c) && perCapitaText(id, i))) {
          h.appendChild(mk('p', 'tbl-note', 'Per person figures use the ' + censusYear() + ' census.'));
        }
      }
      const acts = mk('p', 'cen-now');
      acts.appendChild(linkButton('About this table', tableCard));
      h.appendChild(acts);
    });
  }


  function mark(id) {
    unmark();
    const pl = PLACES.get(id);
    const shapes = host.shapesOf(pl);
    shapes.forEach((el) => el.classList.add('tbl-sel'));
    marked = shapes;
  }
  function unmark() {
    marked.forEach((el) => el.classList.remove('tbl-sel'));
    marked = [];
  }


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
      if (allowsPerCapita(c)) cols.push({ head: colName(c) + ' per ' + fmt(PER) + ' people (' + censusYear() + ' census)' });
    });
    const rows = [];
    T.rows.forEach((r, id) => {
      const pl = PLACES.get(id);
      const cells = [{ t: pl.en + ' ' + (r.label || pl.ja), name: pl.en, kanji: r.label || pl.ja }];
      T.cols.forEach((c, i) => {
        const cell = r.cells[i];
        cells.push({ t: cell.as === 'num' ? cell.t : cell.as === 'none' ? '—' : cell.t, n: cell.n });
        if (allowsPerCapita(c)) {
          const people = peopleOf(pl);
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
    notes.forEach((n) => wrap.appendChild(mk('p', 'pop-note', '* ' + n)));
    const source = [T.volume, T.year, T.ja].filter(Boolean).join(', ')
      + (T.src ? '. ' + T.src.url : '');
    const src = mk('p', 'pop-src');
    if (T.src) {
      const a = mk('a', '', source);
      a.href = T.src.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      src.appendChild(a);
    } else src.textContent = source;
    wrap.appendChild(src);
    host.addCsvButton(wrap, tableEl, T.en || T.ja, notes, source);
    body.appendChild(wrap);
    if (!dlg.open) dlg.showModal();
    body.scrollTop = 0;
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



  return {
    up() { return !!T; },
    fills,
    wholeFills,
    mapValues,


    async open(fragment) {
      let parsed;
      try {
        const raw = await inflate(fragment);
        if (raw && raw.v !== 1) console.warn('Table payload version', raw.v, '— reading as v1');
        parsed = normalise(raw);
      } catch (err) {
        if (T) host.close();
        errorCard(err && err.message, err && err.src);
        return false;
      }
      T = parsed;
      colAt = T.def;
      perCapita = false;
      host.opened(T.period);
      mountBar();
      tableCard();
      return true;
    },


    close() {
      unmountBar();
      unmark();
      T = null;
      cardNow = null;
    },

    released() {
      unmark();
      cardNow = null;
    },
    ownsCard(chipText) { return chipText === CHIP; },


    tap(provKey, recId, el) {
      const id = placeAt(provKey, recId, el);
      if (!id) return false;
      placeCard(id);
      return true;
    },

    tipKey() { return T ? colAt + '|' + perCapita : ''; },

    tip(provKey, recId, el) {
      const id = placeAt(provKey, recId, el);
      if (!id) return null;
      const wrap = mk('span', 'sub tbl-tip');
      const row = T.rows.get(id);
      if (!row) {
        wrap.textContent = 'No row in this table';
        return wrap;
      }
      const c = T.cols[colAt];
      if (row.label) wrap.appendChild(mk('span', 'tbl-tip-label', row.label));
      wrap.appendChild(mk('span', 'tbl-tip-val', row.cells[colAt].t + (row.cells[colAt].n !== null && c.unit ? ' ' + c.unit : '')));
      if (perCapitaOn()) {
        const pc = perCapitaText(id, colAt);
        wrap.appendChild(mk('span', 'tbl-tip-sub', pc || 'No population figure'));
      }
      const share = sharePct(row, colAt);
      if (share) wrap.appendChild(mk('span', 'tbl-tip-sub', share + ' of the printed total'));
      return wrap;
    },


    more() {
      return T && T.src ? { href: T.src.url, en: 'Source table (' + T.src.host + ')' } : null;
    },


    legend(el) {
      const c = T.cols[colAt];
      el.appendChild(mk('p', 'legend-sub tbl-key-head', T.en || T.ja));
      const body = mk('div', 'cen-key');
      const what = colLabel(c) + (T.date ? ', ' + T.date : '');
      body.appendChild(mk('p', 'cen-key-title', what));
      if (perCapitaOn()) {
        body.appendChild(mk('p', 'cen-key-note', 'Per ' + fmt(PER) + ' people, using the '
          + censusYear() + ' census. Colonies are left out.'));
      }
      const row = (colour, label) => {
        const r = mk('div', 'item pop-key-row');
        const sw = mk('span', 'sw');
        sw.style.background = colour;
        r.appendChild(sw);
        r.appendChild(document.createTextNode(label));
        body.appendChild(r);
      };
      const sc = scale();
      const b = sc.breaks;
      const count = b.length + 1;
      const label = (x) => (perCapitaOn() ? String(x) : fmt(x));
      if (allShown().length) {
        for (let i = 0; i < count; i++) {
          const words = !b.length ? 'All places shown'
            : i === 0 ? 'under ' + label(b[0])
              : i === b.length ? label(b[i - 1]) + ' and over'
                : label(b[i - 1]) + '–' + label(b[i]);
          row(sc.ramp[swatchOf(i, count)], words);
        }
      }


      const seen = new Set();
      T.rows.forEach((r) => seen.add(r.cells[colAt].as));
      if (seen.has('nil')) row(NIL, '— Nil');
      if (seen.has('unreadable')) row(UNREADABLE, 'Unreadable in the scan');
      row(host.blank, 'No data');
      const acts = mk('div');
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


    report() {
      return T ? { col: colAt, perCapita: perCapitaOn(), census: censusYear(),
        rows: T.rows.size, dropped: T.dropped, card: cardNow } : null;
    },
  };
};
