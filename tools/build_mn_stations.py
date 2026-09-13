#!/usr/bin/env python3
"""Manchuria's railway stations: the geojson turned into the table the map draws.

    python3 tools/build_mn_stations.py

The source is `data/manchuria/manchuria-1942-stations.geojson`: the stations of the July 1942
滿洲・支那汽車時間表 that could be placed, 614 of them, each carrying the name as the timetable
prints it, the same name in the characters used today, its pinyin, a Japanese romanisation and
the lines it stood on. The kana reading comes from the reference file beside it, which is the
same 614 points with the matching notes attached.

NOT EVERY STATION IS HERE. The timetable names about 900 places on the Manchurian pages and 614
were placed from today's station points and the traced lines; the rest are listed in
`data/manchuria/reference/missing.md`. A train between two placed stops still runs (trains.js
steps over a stop with no coordinate), so the network animates with what there is, and the
timetable page carries every stop whether placed or not.

WHAT THE MAP SHOWS. The Japanese reading leads, as it does for the other systems, with the pinyin
of the name the timetable prints as the local reading, and the modern name in the card because
that is what is on a map of today. Nothing is guessed: every field is carried from the geojson.
"""
import io
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_mn_trains import LINE_JA, split_line as line_and_company

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "deploy")     # what the web server gets; the rest is how it is made
SRC = os.path.join(ROOT, 'data', 'manchuria', 'manchuria-1942-stations.geojson')
REF = os.path.join(ROOT, 'data', 'manchuria', 'reference',
                   'manchuria-1942-stations-reference-info.geojson')
OUT = os.path.join(SITE, 'mn-stations.js')

# The company prefix the timetable puts before each line name, for the card's own line field.
PREFIX = ('滿鐵社線 ', '滿洲國線 ', '國線 ', '滿鐵 ', '其他 ')

COMPANY = {'滿鐵社線': 'South Manchuria Railway', '滿鐵': 'South Manchuria Railway',
           '滿洲國線': 'Manchukuo National Railways', '國線': 'Manchukuo National Railways'}


def split_line(s):
    """'國線 平梅線' -> ('國線', '平梅線'); a name with no prefix keeps an empty company."""
    s = s.strip()
    for p in PREFIX:
        if s.startswith(p):
            return p.strip(), s[len(p):]
    return '', s


def read_line(full):
    """'國線 平梅線' -> 'Heibai-sen (平梅線)', the reading the train bundle gives it."""
    name, _ = line_and_company(full)
    ja = LINE_JA.get(name)
    return ('%s (%s)' % (ja, name)) if ja else name


def sentence(p, modern):
    """One or two sentences for the station card, in the shape Korea's and
    Karafuto's have: the line or the junction, and the name of the place today."""
    lines = [l.strip() for l in (p.get('lines') or '').split(';') if l.strip()]
    bits = []
    if len(lines) == 1:
        co, _ = split_line(lines[0])
        co_en = COMPANY.get(co, '')
        bits.append('On the %s%s.' % (read_line(lines[0]), (', ' + co_en) if co_en else ''))
    elif lines:
        names = [read_line(l) for l in lines]
        # a card is read at a glance: 奉天 is a junction of eight lines, and eight
        # readings with their characters is a paragraph, so four are named
        if len(names) > 4:
            bits.append('A junction of the %s and %d other lines.'
                        % (', the '.join(names[:3]), len(names) - 3))
        else:
            bits.append('A junction of the %s and the %s.' % (', the '.join(names[:-1]), names[-1]))
    if modern and modern != p['name']:
        bits.append('Today %s%s.' % (modern, (' (%s)' % p['pinyin']) if p.get('pinyin') else ''))
    return ' '.join(bits)


def pinyin_of(name):
    """The pinyin of the name as printed -- 奉天 is Fèngtiān, whatever the place is
    called now -- so the card's reading line reads the characters beside it."""
    try:
        from pypinyin import lazy_pinyin, Style
    except ImportError:
        return ''
    syl = lazy_pinyin(name, style=Style.TONE)
    return ''.join(syl).capitalize() if syl else ''


def build():
    gj = json.load(open(SRC, encoding='utf-8'))
    ref = {}
    if os.path.exists(REF):
        for ft in json.load(open(REF, encoding='utf-8'))['features']:
            ref[ft['id']] = ft['properties']
    out = []
    for i, ft in enumerate(sorted(gj['features'], key=lambda f: f['id']), 1):
        p = ft['properties']
        r = ref.get(ft['id'], {})
        lon, lat = ft['geometry']['coordinates']
        modern = p.get('name_modern') or ''
        rec = {
            'id': 'mns%03d' % i,
            'han': p['name'],                        # as the timetable prints it
            'shin': modern,                          # the name today
            'py': pinyin_of(p['name']) or p.get('pinyin') or '',
            'ro': p.get('romaji') or '',
            'kana': r.get('yomi') or '',
            'lon': round(lon, 5), 'lat': round(lat, 5),
            'line': ' / '.join(l.strip() for l in (p.get('lines') or '').split(';') if l.strip()),
            'kind': 'station',
            'short': sentence(p, modern),
        }
        out.append(rec)
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write("/* Built by tools/build_mn_stations.py -- do not edit.\n"
                 " * Manchuria's railway stations in July 1942: the %d of them that\n"
                 " * could be placed, named in the characters the timetable prints, in\n"
                 " * the characters used today, in kana and in romaji from the source,\n"
                 " * and in the pinyin of the printed name. `line` is the line or lines\n"
                 " * the timetable puts the station on, with the company's prefix as\n"
                 " * printed. */\n" % len(out))
        fh.write("window.JMAP = window.JMAP || {};\n")
        fh.write("JMAP.MN_STATIONS = [\n")
        for o in out:
            fh.write("  %s,\n" % json.dumps(o, ensure_ascii=False, sort_keys=True))
        fh.write("];\n")
    sys.stderr.write("mn-stations.js: %d stations, %d with pinyin, %d with romaji, %d with kana, "
                     "%d on more than one line\n"
                     % (len(out), sum(1 for o in out if o['py']),
                        sum(1 for o in out if o['ro']), sum(1 for o in out if o['kana']),
                        sum(1 for o in out if ' / ' in o['line'])))
    return out


if __name__ == '__main__':
    build()
