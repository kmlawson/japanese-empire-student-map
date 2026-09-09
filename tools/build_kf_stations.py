#!/usr/bin/env python3
"""Karafuto's railway stations: the geojson turned into the table the map draws.

    python3 tools/build_kf_stations.py

The source is `data/kf-1935-timetable/karafuto-1935-stations.geojson`, 97 points carrying, for
every one of them, the name as the 1935 timetable prints it, the same name in modern characters,
its kana, a romanisation, the Russian name of the station and of the place, and what became of it.

WHAT THE MAP SHOWS. The Japanese name is the name of the thing in 1935 and it leads; the second
name is the Russian one, because that is what stands there now and it is the only way a reader can
find the place on a map of today. Sixty of the ninety-seven are gone altogether -- the line north
of Shirutoru was lifted, and the colliery branches went with the pits -- so `status` is worth
saying and the card says it.

Nothing here is guessed. Every field is carried from the geojson, whose provenance is in
`coord_source` (a Japanese Wikipedia station infobox for most, OpenStreetMap for the ones still
open) and `position_confidence`.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'data', 'kf-1935-timetable', 'karafuto-1935-stations.geojson')
OUT = os.path.join(ROOT, 'kf-stations.js')

# What the card says about a station that is not there any more. The geojson's own wording is a
# phrase, not a sentence, and the card wants a sentence.
STATUS = {
    'no longer an active railway point': 'The line here is lifted.',
    'still an active railway point': 'Still an open railway point.',
}


def sentence(p):
    """One or two sentences for the station card: the line, the km, and what became of it."""
    bits = []
    km = (p.get('km_1935') or '').strip()
    line = (p.get('lines_1935_en') or '').strip()
    if line:
        first = line.split(';')[0].strip()
        if km:
            m = km.split(';')[0].strip().rsplit(' ', 1)
            bits.append('On the %s, %s km from its start.' % (first, m[-1]) if len(m) == 2
                        else 'On the %s.' % first)
        else:
            bits.append('On the %s.' % first)
    st = (p.get('status') or '').strip()
    opened = p.get('opened_year')
    if opened:
        bits.append('Opened %d.' % opened)
    for k, v in STATUS.items():
        if st.startswith(k):
            bits.append(v)
            break
    else:
        if st.startswith('closed ') or st.startswith('abolished '):
            bits.append(st[0].upper() + st[1:].split(',')[0].split('(')[0].strip() + '.')
    return ' '.join(bits)


def build():
    gj = json.load(open(SRC, encoding='utf-8'))
    out = []
    for i, ft in enumerate(sorted(gj['features'], key=lambda f: f['properties']['fid']), 1):
        p = ft['properties']
        lon, lat = ft['geometry']['coordinates']
        rec = {
            'id': 'kfs%03d' % i,
            'han': p['name_1935_printed'],          # as the timetable prints it
            'shin': p['name_ja'],                   # the same name in modern characters
            'kana': p.get('name_kana') or '',
            'ro': p.get('name_romaji') or '',
            'ru': p.get('name_ru_station') or p.get('name_ru_place') or '',
            'ruen': p.get('name_en_place') or '',
            'lon': round(lon, 5), 'lat': round(lat, 5),
            'line': (p.get('lines_1935') or '').replace(';', ' /'),
            'kind': 'station',
            'short': sentence(p),
            'wiki': p.get('ja_wikipedia') or '',
        }
        out.append(rec)
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write("/* Built by tools/build_kf_stations.py -- do not edit.\n"
                 " * Karafuto's railway stations in 1935: %d of them, named in the\n"
                 " * characters the timetable prints, in modern characters, in kana,\n"
                 " * in romaji and in Russian -- all five from the source.\n"
                 " * `ru` is the station's Russian name where it has one and the\n"
                 " * settlement's where it does not. */\n" % len(out))
        fh.write("window.JMAP = window.JMAP || {};\n")
        fh.write("JMAP.KF_STATIONS = [\n")
        for o in out:
            fh.write("  %s,\n" % json.dumps(o, ensure_ascii=False, sort_keys=True))
        fh.write("];\n")
    sys.stderr.write("kf-stations.js: %d stations, %d with a Russian name, %d with a reading, "
                     "%d with a note\n"
                     % (len(out), sum(1 for o in out if o['ru']),
                        sum(1 for o in out if o['ro']), sum(1 for o in out if o['short'])))
    return out


if __name__ == '__main__':
    build()
