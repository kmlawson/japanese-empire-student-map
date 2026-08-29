#!/usr/bin/env python3
"""Build tw-trains.js and timetable/taiwan-1936.html from the 1936 timetable.

The source is the transcription published at
github.com/kmlawson/taiwan-1936-timetable, vendored under
data/tw-1936-timetable/ so this build does not depend on the network.
Two things come out of it:

  tw-trains.js              the lines, the stations, the 346 trains and the
                            track geometry between consecutive stops, in the
                            compact form map.js reads
  timetable/taiwan-1936.html  the eighteen printed tables, as published, with
                            an anchor per table so a station card can link to
                            the line the reader is looking at

WHAT IS NOT DONE HERE. No geometry is simplified. The track between two
stations is carried point for point from the source, rounded to five decimal
places -- a metre at this latitude, well under the width of the line as drawn
-- and the count of points in and out is printed so a silent loss would show.

THE STATIONS ARE MATCHED TO OUR OWN TABLE BY NAME, folded through the same
kyujitai map map.js uses, because the timetable writes the island's name the
1936 way and tw-stations.js writes it the modern way: without the fold, Taihoku,
Taichu and Tainan -- the three busiest stations on the network -- match nothing.
Where a match is found the timetable station carries our station's id, and that
is the whole of the link between a square on the map and a column of departure
times. Where none is found the station still animates; it just has no square to
be clicked.
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'data', 'tw-1936-timetable')
OUT_JS = os.path.join(ROOT, 'tw-trains.js')
OUT_HTML = os.path.join(ROOT, 'timetable', 'taiwan-1936.html')

# The same fold as KANJI_VARIANTS in map.js. Kept in step by hand; the two
# tables are small and the alternative is map.js importing Python.
VARIANTS = {'縣': '県', '國': '国', '內': '内', '灣': '湾', '臺': '台',
            '滿': '満', '鐵': '鉄', '澤': '沢', '廣': '広', '眞': '真',
            '對': '対', '單': '単', '會': '会', '學': '学', '龍': '竜'}

LINE_EN = {
    '縱貫線': 'Trunk Line',
    '淡水線': 'Tamsui Line',
    '宜蘭線': 'Yilan Line',
    '平溪線': 'Pingxi Line',
    '集集線': 'Jiji Line',
    '潮州線': 'Chaozhou Line',
    '臺東線': 'Taitung Line',
}


def name_key(s):
    s = re.sub(r'\s*[（(][^)）]*[)）]\s*', '', str(s))
    s = re.sub(r'[\s·・,，]', '', s)
    return ''.join(VARIANTS.get(c, c) for c in s).lower()


def grab(text, name):
    """One `const NAME = <json>;` line out of the source bundle."""
    i = text.index('const %s = ' % name) + len('const %s = ' % name)
    j = text.index('\n', i)
    return json.loads(text[i:j].rstrip().rstrip(';'))


def our_stations():
    """tw-stations.js, which is JSON with a JS wrapper and trailing commas."""
    txt = open(os.path.join(ROOT, 'tw-stations.js'), encoding='utf-8').read()
    body = txt[txt.index('['):txt.rindex(']') + 1]
    return json.loads(re.sub(r',\s*([\]}])', r'\1', body))


def build_js(anchors=None):
    src = open(os.path.join(SRC, 'data.js'), encoding='utf-8').read()
    stations = grab(src, 'STATIONS')
    trains = grab(src, 'TRAINS')
    paths = grab(src, 'PATHS')
    colours = grab(src, 'LINE_COLORS')

    ours = {}
    for r in our_stations():
        ours.setdefault(name_key(r['han']), r)

    line_names = list(colours.keys())
    line_ix = {n: i for i, n in enumerate(line_names)}

    st_ix = {}
    out_st = []
    matched = coordless = 0
    for s in stations:
        st_ix[s['name']] = len(out_st)
        mine = ours.get(name_key(s['name']))
        if mine:
            matched += 1
        if s['lon'] is None:
            coordless += 1
        rec = {'n': s['name']}
        if s.get('romaji'):
            rec['ro'] = s['romaji']
        if mine:
            rec['sid'] = mine['id']
        if s['lon'] is not None:
            rec['lon'] = round(s['lon'], 5)
            rec['lat'] = round(s['lat'], 5)
        rec['li'] = [line_ix[l] for l in s['lines'] if l in line_ix]
        out_st.append(rec)

    out_tr = []
    for t in trains:
        stops = []
        for st in t['stops']:
            fl = 0
            if st.get('r'):
                fl |= 1        # timed on another line's table, not this one
            if st.get('p'):
                fl |= 2        # passes without stopping
            if st.get('u'):
                fl |= 4        # the source reading is uncertain
            row = [st_ix[st['s']], st.get('am'), st.get('dm')]
            if fl:
                row.append(fl)
            stops.append(row)
        out_tr.append({'no': t['no'], 'li': line_ix.get(t['line'], -1),
                       'dir': 0 if t['dir'].startswith('下') else 1,
                       'cls': t.get('cls') or '', 'dest': t.get('dest') or '',
                       'st': stops})

    # Re-keyed from a pair of names to a pair of indices, and the coordinates
    # made to run from the lower index to the higher one so the reader of this
    # file needs no second rule about which way round it is stored.
    pts_in = pts_out = 0
    out_pa = {}
    ends_ok = ends_seen = 0
    for k, pts in paths.items():
        a, b = k.split('|')
        ia, ib = st_ix[a], st_ix[b]
        pts_in += len(pts)
        run = list(pts) if ia < ib else list(reversed(pts))
        lo, hi = (ia, ib) if ia < ib else (ib, ia)
        flat = []
        for p in run:
            flat.append(round(p[0], 5))
            flat.append(round(p[1], 5))
        pts_out += len(run)
        out_pa['%d|%d' % (lo, hi)] = flat
        s0 = out_st[lo]
        if 'lon' in s0:
            ends_seen += 1
            if abs(flat[0] - s0['lon']) < 0.02 and abs(flat[1] - s0['lat']) < 0.02:
                ends_ok += 1

    doc = {
        'year': 1936,
        'lines': [{'n': n, 'en': LINE_EN.get(n, n), 'c': colours[n],
                   'a': (anchors or {}).get(n, '')}
                  for n in line_names],
        'stations': out_st,
        'trains': out_tr,
        'paths': out_pa,
    }
    head = (
        '/* Built by tools/build_tw_trains.py -- do not edit.\n'
        ' * The 1936 Taiwan railway timetable: %d trains over %d lines,\n'
        ' * calling at %d stations, with the track between consecutive stops.\n'
        ' * Source: the transcription in data/tw-1936-timetable/, from the\n'
        ' * February 1936 timetable of the Railway Department.\n'
        ' * Stop rows are [station, arrival, departure, flags] in minutes from\n'
        ' * midnight, past 1440 meaning the small hours of the next day; flags\n'
        ' * are 1 timed on another line, 2 passes without stopping, 4 the\n'
        ' * printed reading is uncertain. Path keys are a pair of station\n'
        ' * indices, low first, and the coordinates run that way. */\n'
        % (len(out_tr), len(line_names), len(out_st)))
    body = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    with open(OUT_JS, 'w', encoding='utf-8') as f:
        f.write(head)
        f.write('window.JMAP = window.JMAP || {};\n')
        f.write('JMAP.TW_TRAINS = ')
        f.write(body)
        f.write(';\n')

    print('stations   %d, %d matched to tw-stations.js, %d with no coordinate'
          % (len(out_st), matched, coordless))
    print('trains     %d, %d stop rows'
          % (len(out_tr), sum(len(t['st']) for t in out_tr)))
    print('paths      %d segments, %d points in, %d out (%.1f%% kept)'
          % (len(out_pa), pts_in, pts_out, 100.0 * pts_out / max(1, pts_in)))
    print('           %d of %d segments start within 0.02 deg of their station'
          % (ends_ok, ends_seen))
    print('wrote      %s (%d KB)' % (os.path.relpath(OUT_JS, ROOT),
                                     os.path.getsize(OUT_JS) // 1024))
    return doc


def build_html():
    """The printed tables, as published, with an anchor per table.

    Only three things change: the link back points at our own map rather than
    at the one it was built for, each heading gets an id so a card can link to
    a line, and a line is added saying where the page came from.
    """
    html = open(os.path.join(SRC, 'tables.html'), encoding='utf-8').read()
    seen = {}
    order = []
    first = {}
    def anchor(m):
        head = m.group(1)
        line = head.split(' ')[0]
        if line not in seen:
            order.append(line)
        seen[line] = seen.get(line, 0) + 1
        slug = 'line-%d-%d' % (order.index(line) + 1, seen[line])
        first.setdefault(line, slug)
        return '<h2 id="%s">%s</h2>' % (slug, head)
    html, n = re.subn(r'<h2>([^<]*)</h2>', anchor, html)
    html = html.replace('<a href="index.html">', '<a href="../index.html">')
    html = html.replace(
        '</main>',
        '<p class="legend">この頁は '
        'kmlawson.github.io/taiwan-1936-timetable '
        'の転記をそのまま収めたものです。'
        ' &mdash; This page is the transcription published at '
        '<a href="https://kmlawson.github.io/taiwan-1936-timetable/">'
        'kmlawson.github.io/taiwan-1936-timetable</a>, reproduced here so the '
        'map can link to it offline.</p></main>')
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)
    with open(OUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html)
    print('tables     %d headings anchored -> %s (%d KB)'
          % (n, os.path.relpath(OUT_HTML, ROOT),
             os.path.getsize(OUT_HTML) // 1024))
    return first


if __name__ == '__main__':
    # The tables first: they are what says where in the printed timetable each
    # line begins, and a card links to that anchor rather than to the top of a
    # two-hundred-kilobyte page.
    anchors = build_html()
    doc = build_js(anchors)
    missing = [l['n'] for l in doc['lines'] if not l['a']]
    if missing:
        print('WARNING: no table anchor found for ' + ', '.join(missing),
              file=sys.stderr)
