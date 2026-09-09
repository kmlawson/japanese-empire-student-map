#!/usr/bin/env python3
"""Build kf-trains.js and timetable/karafuto-1935.html from the 1935 Karafuto timetable.

The source is the transcription of the 樺太國有鐵道列車時刻表 of 15 April 1935, vendored under
data/kf-1935-timetable/ in the same shape as the Taiwan and Korea bundles so this build does not
depend on the network. Two things come out of it:

  kf-trains.js                 the seven lines, the 97 stations, the 86 trains and the track
                               between consecutive stops, in the compact form trains.js reads
  timetable/karafuto-1935.html the fourteen printed tables, one per line and direction, with an
                               anchor per table so a station card can link to the line the reader
                               is looking at

WHAT IS NOT DONE HERE. No geometry is simplified. The track between two stations is carried point
for point from the source — the line file traced for this map, along which the transcription
project ran a shortest path between each pair of consecutive stops — and the count of points in
and out is printed so a silent loss would show.

THE STATIONS ARE MATCHED TO OUR OWN TABLE BY NAME, folded through the 舊字體 pairs, because the
timetable prints 內幌 and 豐原 and the GeoJSON behind kf-stations.js spells three of them in the
modern forms. All 97 match, so every square on the map opens the column of departure times that
belongs to it.

FERRIES ARE NOT DRAWN. The sheet carries the Ōdomari–Wakkanai and Honto–Wakkanai crossings as
prose — sailing times by season, not a column of stops — and a chord between two ports would be a
line this transcription cannot time. They are in the printed page instead, at the foot.
"""
import io
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'data', 'kf-1935-timetable')
OUT_JS = os.path.join(ROOT, 'kf-trains.js')
OUT_HTML = os.path.join(ROOT, 'timetable', 'karafuto-1935.html')

FOLD = {'內': '内', '奧': '奥', '寶': '宝', '巢': '巣', '廣': '広', '榮': '栄', '樂': '楽',
        '氣': '気', '淸': '清', '溪': '渓', '澤': '沢', '濱': '浜', '眞': '真', '禮': '礼',
        '穗': '穂', '臺': '台', '豐': '豊', '瀧': '滝', '溫': '温', '惠': '恵', '鐵': '鉄',
        '會': '会', '國': '国', '驛': '駅', '礦': '鉱'}

# The Japanese reading of each line, for the switch that puts the map into Japanese names.
LINE_JA = {
    '東海岸線': 'Tōkaigan-sen',
    '川上線': 'Kawakami-sen',
    '豐眞線': 'Hōshin-sen',
    '西海岸線': 'Nishikaigan-sen',
    '樺太鐵道株式會社線': 'Karafuto Tetsudō-sen',
    '南樺太鐵道株式會社線': 'Minami-Karafuto Tetsudō-sen',
    '南樺太炭礦鐵道株式會社線': 'Minami-Karafuto Tankō Tetsudō-sen',
}


def fold(s):
    return ''.join(FOLD.get(c, c) for c in s)


def read_consts(path, names):
    s = io.open(path, encoding='utf-8').read()
    out = {}
    for n in names:
        m = re.search(r'^const %s = ' % n, s, re.M)
        if not m:
            raise SystemExit('%s: no %s' % (path, n))
        i = m.end()
        out[n] = json.loads(s[i:s.index('\n', i)].rstrip(';'))
    return out


def our_stations():
    """kf-stations.js is written one record to a line with a trailing comma, so it is read a
    line at a time rather than as one array."""
    out = []
    for line in io.open(os.path.join(ROOT, 'kf-stations.js'), encoding='utf-8'):
        line = line.strip().rstrip(',')
        if line.startswith('{') and line.endswith('}'):
            out.append(json.loads(line))
    return out


def table_anchors():
    """The anchor of each table in the printed page, in the page's own order."""
    html = io.open(os.path.join(SRC, 'tables.html'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r'<h2 id="(line-\d+)" data-line="([^"]*)" data-dir="([^"]*)"', html):
        out.append({'a': m.group(1), 'line': m.group(2), 'dir': m.group(3)})
    return out


def main():
    d = read_consts(os.path.join(SRC, 'data.js'),
                    ['STATIONS', 'TRAINS', 'PATHS', 'LINE_COLORS', 'LINE_META'])
    src_st, src_tr, src_paths, meta = d['STATIONS'], d['TRAINS'], d['PATHS'], d['LINE_META']

    # --- the lines, in the order the sheet prints them, with the anchor of the first printed table
    anchors = table_anchors()
    first_anchor = {}
    for a in anchors:
        # the page heads a table with the line's own name, minus the state railway's prefix
        first_anchor.setdefault(a['line'], a['a'])
    lines, line_ix = [], {}
    for i, m in enumerate(meta):
        line_ix[m['n']] = i
        short = m['n'].replace('株式會社', '')
        lines.append({'n': m['n'], 'en': m['en'], 'ja': LINE_JA.get(m['n'], ''),
                      'c': m['c'], 'a': first_anchor.get(short) or first_anchor.get(m['n'], ''),
                      'd': m['d']})
    missing_anchor = [l['n'] for l in lines if not l['a']]
    if missing_anchor:
        sys.stderr.write('note: no printed table found for %s\n' % ', '.join(missing_anchor))

    # --- the stations, with our own id where the table has one
    ours = {fold(o['han']): o for o in our_stations()}
    stations, ix, unmatched = [], {}, []
    for s in src_st:
        o = ours.get(fold(s['name']))
        if not o:
            unmatched.append(s['name'])
        ix[s['name']] = len(stations)
        rec = {'n': s['name'], 'lon': s['lon'], 'lat': s['lat'],
               'li': sorted({line_ix[l] for l in s['lines'] if l in line_ix})}
        if o:
            rec['sid'] = o['id']
        # `py` is the slot the map calls the local romanisation; here that is the Russian name of
        # the place as it is written in Latin letters, which is how a reader finds it today.
        if s.get('en_place'):
            rec['py'] = s['en_place']
        if s.get('romaji'):
            rec['ro'] = s['romaji']
        if s.get('ru'):
            rec['ru'] = s['ru']
        stations.append(rec)

    # --- the trains
    trains, dropped = [], 0
    for t in src_tr:
        li = line_ix.get(t['line'])
        if li is None:
            dropped += 1
            continue
        st = []
        for s in t['stops']:
            if s['s'] not in ix:
                continue
            fl = 0
            if s.get('p'):
                fl |= 2
            if s.get('u'):
                fl |= 4
            row = [ix[s['s']], s.get('am'), s.get('dm')]
            if fl:
                row.append(fl)
            st.append(row)
        if len(st) < 2:
            dropped += 1
            continue
        trains.append({'no': t['no'], 'li': li, 'dir': 1 if t['dir'] == '上り' else 0,
                       'cls': t.get('cls', ''), 'dest': t.get('dest', ''),
                       'marks': t.get('marks', ''), 'st': st})

    # --- the track, re-keyed from names to station indices, low first
    paths, pts_in, pts_out = {}, 0, 0
    for k, coords in src_paths.items():
        a, b = k.split('|')
        if a not in ix or b not in ix:
            continue
        i, j = ix[a], ix[b]
        pts_in += len(coords)
        run = coords if i < j else list(reversed(coords))
        flat = []
        for p in run:
            flat.append(round(p[0], 5))
            flat.append(round(p[1], 5))
        pts_out += len(flat) // 2
        paths['%d|%d' % (min(i, j), max(i, j))] = flat

    bundle = {'year': 1935, 'issued': '15 April 1935', 'local': 'Russian',
              'lines': lines, 'stations': stations, 'trains': trains, 'paths': paths}
    with io.open(OUT_JS, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write("/* Built by tools/build_kf_trains.py -- do not edit.\n"
                 " * The 1935 Karafuto railway timetable: %d trains over %d lines,\n"
                 " * calling at %d stations, with the track between consecutive stops.\n"
                 " * Source: the transcription in data/kf-1935-timetable/, from the\n"
                 " * 樺太國有鐵道列車時刻表 revised 15 April 1935.\n"
                 " * Stop rows are [station, arrival, departure, flags] in minutes from\n"
                 " * midnight, past 1440 meaning the small hours of the next day; flags\n"
                 " * are 1 timed on another line, 2 passes without stopping, 4 the\n"
                 " * printed reading is uncertain. Path keys are a pair of station\n"
                 " * indices, low first, and the coordinates run that way. */\n"
                 % (len(trains), len(lines), len(stations)))
        fh.write("window.JMAP = window.JMAP || {};\n")
        fh.write("JMAP.KF_TRAINS = %s;\n" % json.dumps(bundle, ensure_ascii=False,
                                                       separators=(',', ':')))

    # --- the printed tables, as the transcription project builds them
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)
    shutil.copyfile(os.path.join(SRC, 'tables.html'), OUT_HTML)

    sys.stderr.write('kf-trains.js: %d trains, %d lines, %d stations (%d matched to kf-stations.js'
                     '%s), %d stretches of track, %d points in and %d out\n'
                     % (len(trains), len(lines), len(stations), len(stations) - len(unmatched),
                        (', unmatched: ' + ' '.join(unmatched)) if unmatched else '',
                        len(paths), pts_in, pts_out))
    if dropped:
        sys.stderr.write('  %d trains dropped for want of a line or of two placed stops\n' % dropped)
    sys.stderr.write('timetable/karafuto-1935.html: %d tables, %d KB\n'
                     % (len(anchors), os.path.getsize(OUT_HTML) // 1024))


if __name__ == '__main__':
    main()
