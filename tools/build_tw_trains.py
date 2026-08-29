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


"""What each line was, in a few sentences, for the card a tap on the track
opens.

The history is from the Japanese and Chinese Wikipedia articles on each line,
which is where the dates and the section openings come from and is said so on
the Sources page. THE TIMINGS ARE NOT: those are measured from the
transcription this file is built out of, so a reader can check them against the
printed table one link away. Where the two kinds of statement sit in the same
sentence the measured one is the one about this timetable — "in this table",
"a through working" — and the sourced one is about the railway.

Names are as the timetable writes them, which is the Japanese reading of the
period: Kirun for Keelung, Takao for Kaohsiung, Taihoku for Taipei, Giran for
Yilan, Karenko for Hualien.
"""
LINE_NOTES = {
    '\u7e31\u8caB\u7dda': (
        'The spine of the island, and the oldest railway on it: the Qing '
        'government built K\u012brun to Shinchiku between 1891 and 1893, and the '
        'Government-General rebuilt that and drove it south, opening the '
        'through route to Takao on 20 April 1908 and celebrating it at Taich\u016b '
        'that October. Between Chikunan and Sh\u014dka it is two railways by this '
        'date \u2014 the original inland route, whose gradients at J\u016brokufun backed '
        'freight up at the stations faster than it could be moved, and the '
        'coastal route opened on 11 October 1922 to relieve it. In this table '
        'the express runs the whole length in eight hours flat, stopping '
        'seventeen times and passing fifty-nine stations without a call; the '
        'ordinary train down takes eleven hours and a quarter and stops '
        'seventy-two times.'),
    '\u6de1\u6c34\u7dda': (
        'Twenty-one kilometres from Taihoku down to the river mouth, opened on '
        '25 August 1901 and laid partly with material lifted from the Qing '
        'line. It was built when Tansui was the better port and K\u012brun\u2019s '
        'harbour works were unfinished; as the river silted and K\u012brun was '
        'improved the freight went elsewhere, and the line lived on passengers '
        '\u2014 above all the hot springs at Hokut\u014d, which got a branch of their '
        'own to Shin-Hokut\u014d in 1916. Thirty-eight minutes end to end.'),
    '\u5b9c\u862d\u7dda': (
        'The way round the north-east corner to the Giran plain and the port '
        'of Su\u014d. Begun in July 1917 and built from both ends at once, it '
        'opened in sections through 1919 and 1920 and was finished on 1 '
        'December 1924 with the S\u014dry\u014d tunnel under the ridge that had kept '
        'the two halves apart. It leaves the trunk line at Hatt\u014d, a few '
        'minutes out of K\u012brun; a through working takes three hours and '
        'twenty-two minutes.'),
    '\u5e73\u6eaa\u7dda': (
        'A coal railway that carries passengers. The Taiy\u014d Mining Company '
        'built it up the K\u012brun river valley to reach its seams, opening in '
        'July 1921 and reaching the head of the line at Kikut\u014dk\u014d on 15 '
        'January 1923; the Government-General bought it on 10 July 1929 and '
        'took it over that October. Thirteen kilometres, and forty-nine '
        'minutes from end to end.'),
    '\u96c6\u96c6\u7dda': (
        'Built to make electricity rather than to carry anybody. The Taiwan '
        'Electric Power Company laid it inland from Nisui from 1919 to bring '
        'material up to the hydroelectric works at Sun Moon Lake, and opened '
        'it to freight and passengers on 14 January 1922; the '
        'Government-General bought it on 1 May 1927. Thirty kilometres to '
        'Gaishatei, an hour and a quarter.'),
    '\u6f6e\u5dde\u7dda': (
        'South from Takao, and named after a town its trains have already '
        'passed. Takao to Ky\u016bkyokud\u014d opened on 1 October 1907, and the '
        'crossing of the Lower Tansui river \u2014 the longest bridge on the '
        'island \u2014 carried it on to Ak\u014d, later Heit\u014d, from 20 December 1913. '
        'Ch\u014dsh\u016b was reached in February 1920 and gave the line its name that '
        'September; the rails went on to Keish\u016b on 21 October 1923, which is '
        'where this table still ends. They reached B\u014dry\u014d on 15 December 1941, '
        'which is why the December 1942 map draws this line further south than '
        'the 1930 one.'),
    '\u81fa\u6771\u7dda': (
        'The east coast\u2019s own railway, and not part of the same system: 762 '
        'mm gauge against the 1,067 mm of the west, a light line up the rift '
        'valley from Karenk\u014d to Ta\u012bt\u014d, built in stages from 16 December 1910 '
        'and finished on 25 March 1926. Nothing joined it to the trunk line '
        '\u2014 east and west were not connected by rail until 1980 \u2014 so its 171 '
        'kilometres were a railway reached by sea. A through working takes '
        'nine hours and a half.'),
}

# Where a reader is sent to read more, one link per line, and the article in
# whichever language is the longer of the two -- which is not always the same
# language. Measured as raw wikitext in bytes on 29 August 2026:
#
#   trunk    ja 11,271  zh 10,649      Tamsui   ja 14,551  zh 19,002
#   Yilan    ja 22,696  zh 22,708      Pingxi   ja  9,398  zh 23,674
#   Jiji     ja 22,603  zh 16,491      Chaozhou ja 21,408  zh 22,856
#   Taitung  ja 39,011  zh 34,173
#
# Yilan is a tie to within twelve bytes and could go either way; the rest are
# not close. The lengths are recorded here rather than left implicit so that
# somebody revisiting this knows what the choice was made on.
LINE_WIKI = {
    '\u7e31\u8caB\u7dda': ('ja', 'https://ja.wikipedia.org/wiki/'
                          '%E7%B8%A6%E8%B2%AB%E7%B7%9A_(%E5%8F%B0%E6%B9%BE'
                          '%E9%89%84%E8%B7%AF%E7%AE%A1%E7%90%86%E5%B1%80)'),
    '\u6de1\u6c34\u7dda': ('zh', 'https://zh.wikipedia.org/wiki/'
                          '%E6%B7%A1%E6%B0%B4%E7%B7%9A_(%E8%87%BA%E9%90%B5)'),
    '\u5b9c\u862d\u7dda': ('zh', 'https://zh.wikipedia.org/wiki/'
                          '%E5%AE%9C%E8%98%AD%E7%B7%9A'),
    '\u5e73\u6eaa\u7dda': ('zh', 'https://zh.wikipedia.org/wiki/'
                          '%E5%B9%B3%E6%BA%AA%E7%B7%9A'),
    '\u96c6\u96c6\u7dda': ('ja', 'https://ja.wikipedia.org/wiki/'
                          '%E9%9B%86%E9%9B%86%E7%B7%9A'),
    '\u6f6e\u5dde\u7dda': ('zh', 'https://zh.wikipedia.org/wiki/'
                          '%E5%B1%8F%E6%9D%B1%E7%B7%9A'),
    '\u81fa\u6771\u7dda': ('ja', 'https://ja.wikipedia.org/wiki/'
                          '%E5%8F%B0%E6%9D%B1%E7%B7%9A'),
}

# The Japanese reading of each line's name, for when the reader has asked for
# Japanese names. The rule this map follows everywhere is the local
# romanisation first and the Japanese one when that switch is on -- pinyin here
# and McCune-Reischauer when Korea gets a timetable -- with the characters in
# brackets after. A line is named the same way as a place.
LINE_JA = {
    '\u7e31\u8caB\u7dda': 'J\u016bkansen',
    '\u6de1\u6c34\u7dda': 'Tansui-sen',
    '\u5b9c\u862d\u7dda': 'Giran-sen',
    '\u5e73\u6eaa\u7dda': 'Heikei-sen',
    '\u96c6\u96c6\u7dda': 'Sh\u016bsh\u016b-sen',
    '\u6f6e\u5dde\u7dda': 'Ch\u014dsh\u016b-sen',
    '\u81fa\u6771\u7dda': 'Tait\u014d-sen',
}

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
        # THE TIMETABLE'S OWN ROMANISATION IS NOT CARRIED ACROSS. It gives the
        # reading of whatever the stop was called when the romaniser met it
        # rather than of the name as printed: three of the eight it offers for
        # the Yilan line are readings of former names. The readings this map
        # shows come from tw-stations.js, which sources every one of them.
        if mine:
            rec['sid'] = mine['id']
            # The names as this map holds them, so a card can print the
            # characters, the pinyin and the kana in one row without asking a
            # second file at run time. Only what is there: 204 of the 213
            # stations have a pinyin and 161 a reading, and a blank cell is the
            # honest answer for the rest.
            # `tw-stations.js` is what is read here, not the CSV behind it,
            # so the keys are its short ones -- py, kana, ro -- and not the
            # CSV's pinyin/kana/romaji. Read from the CSV's names this
            # silently carried nothing across: 0 pinyin out of 167 matches.
            for k in ('py', 'kana', 'ro'):
                if mine.get(k):
                    rec[k] = mine[k]
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
                   'a': (anchors or {}).get(n, ''),
                   'd': LINE_NOTES.get(n, ''),
                   'ja': LINE_JA.get(n, ''),
                   'wl': LINE_WIKI.get(n, ('', ''))[0],
                   'w': LINE_WIKI.get(n, ('', ''))[1]}
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


# ---------------------------------------------------------------------------
# THE PRINTED TABLES, IN THREE LANGUAGES.
#
# The page furniture is translated and the tables are not. That distinction is
# the whole design: the eighteen tables are a transcription of a printed
# document and changing what they say would make them a different document, so
# the only thing that happens inside one is that a station name gains its
# reading on a second line -- an addition, not a substitution. Everything
# round them -- the title, the links, the legend, the headings, the caption on
# the notes -- is the page talking to the reader and is said in whichever
# language they choose.
#
# The one exception is the column headings, and only in English: 粁程 and 驛名
# are Chinese characters and stay themselves in Chinese and Japanese, but a
# reader of neither cannot tell the distance column from the station column.
# They are translated in English mode with the original kept on the cell as a
# `title`, so nothing is lost and it is one hover away.
UI = {
    'title': ('\u81fa\u7063\u9435\u9053\u6642\u523b\u8868\uff08\u662d\u548c11\u5e74\u30fb1936\uff09\u2014 \u8ee2\u8a18',
              '\u81fa\u7063\u9435\u9053\u6642\u523b\u8868\uff08\u662d\u548c11\u5e74\u30fb1936\uff09\u2014 \u8f49\u8a18',
              'Taiwan Railway Timetable, February 1936 \u2014 transcription'),
    'map': ('\u5730\u5716', '\u5730\u5716', 'Map'),
    'orig': ('\u539f\u672c\uff08Internet Archive\uff09',
             '\u539f\u672c\uff08Internet Archive\uff09',
             'The original (Internet Archive)'),
    'legend': (
        '\u6642\u523b\u306f24\u6642\u9593\u8868\u8a18\uff08\u539f\u672c: '
        '\u7d30\u5b57=\u5348\u524d\u30fb\u592a\u5b57=\u5348\u5f8c\uff09\u3002'
        '\u30ec=\u901a\u904e\u3001\u00d7=\u8ffd\u5206\u63a5\u7e8c\u3001'
        '\u8d64?=\u5224\u8aad\u4e0d\u78ba\u5b9f\u3002',
        '\u6642\u523b\u63a1 24 \u5c0f\u6642\u5236\uff08\u539f\u672c\uff1a'
        '\u7d30\u5b57\u70ba\u4e0a\u5348\u3001\u7c97\u9ad4\u70ba\u4e0b\u5348\uff09\u3002'
        '\u30ec\uff1d\u901a\u904e\u3001\u00d7\uff1d\u8ffd\u5206\u63a5\u7e8c\u3001'
        '\u7d05\u8272?\uff1d\u5224\u8b80\u4e0d\u78ba\u5b9a\u3002',
        'Times are on the 24-hour clock \u2014 in the original, light type is '
        'morning and bold is afternoon. \u30ec means the train passes without '
        'stopping, \u00d7 a connection at Oiwake, and a red ? that the print '
        'could not be read with certainty.'),
    'check': ('\u539f\u672c\u306f{a}\u3067\u7167\u5408\u3067\u304d\u307e\u3059\u3002',
              '\u539f\u672c\u53ef\u5728{a}\u6838\u5c0d\u3002',
              'The original can be checked against {a}.'),
    'archive': ('Internet Archive \u306e\u300e\u5217\u8eca\u6642\u523b\u8868\u300f\uff081936\u5e742\u6708\uff09',
                'Internet Archive \u7684\u300a\u5217\u8eca\u6642\u523b\u8868\u300b\uff081936\u5e742\u6708\uff09',
                '\u300e\u5217\u8eca\u6642\u523b\u8868\u300f (February 1936) at the Internet Archive'),
    'page': ('\u539f\u672c', '\u539f\u672c', 'Original'),
    'notes': ('\u539f\u672c\u306e\u8a3b\u8a18',
              '\u539f\u672c\u7684\u8a3b\u8a18',
              'Notes on the original page, as transcribed'),
    'readings': ('\u8b80\u307f', '\u8b80\u97f3', 'Readings'),
    'down': ('\u4e0b\u308a', '\u4e0b\u884c', 'down'),
    'up': ('\u4e0a\u308a', '\u4e0a\u884c', 'up'),
    'from': ('\u3053\u306e\u9801\u306f kmlawson.github.io/taiwan-1936-timetable '
             '\u306e\u8ee2\u8a18\u3092\u305d\u306e\u307e\u307e\u53ce\u3081\u305f\u3082\u306e\u3067\u3059\u3002',
             '\u672c\u9801\u70ba kmlawson.github.io/taiwan-1936-timetable '
             '\u8f49\u8a18\u4e4b\u539f\u6a23\u6536\u9304\u3002',
             'This page is the transcription published at '
             'kmlawson.github.io/taiwan-1936-timetable, reproduced here so the '
             'map can link to it offline.'),
}

# The column headings, translated in English only. Anything not in this table
# is left exactly as the transcription has it.
COLS_EN = {
    '\u7c81\u7a0b': 'km',
    '\u9a5b\u540d': 'Station',
    '\u7b49\u7d1a': 'Class',
    '\u884c\u5148': 'To',
    '\u4e09\u7b49\u904b\u8cc3': '3rd-class fare',
    '\u8457': 'arr',
    '\u767c': 'dep',
}


def page_extras(stations):
    """The language bar, the styles and the script the page is given.

    Written out here rather than kept in a file of its own because it exists
    only for this page and is built from the same station table the map uses:
    the readings come out of `tw-stations.js`, so a station that gains a
    sourced reading there gains it here on the next build and nothing has to be
    kept in step by hand.
    """
    reads = {}
    for st in stations:
        if st.get('py') or st.get('kana'):
            reads[st['n']] = [st.get('py', ''), st.get('kana', '')]
    css = """
#langbar{display:flex;gap:6px;align-items:center;margin-left:auto;font-size:12px}
#langbar button{font:inherit;padding:3px 9px;border:1px solid #8a7a5c;border-radius:5px;
background:transparent;color:#e8c988;cursor:pointer}
#langbar button:hover{border-color:#e8c988}
/* Pressed is the pale one. The bar sits on the dark brown header, so a dark
   fill for the current language made it the one you could not see. */
#langbar button[aria-pressed=true]{background:#f5f0e6;color:#3a2b1e;border-color:#f5f0e6}
#langbar label{color:#e8c988;display:flex;gap:4px;align-items:center;cursor:pointer}
.rd{display:block;font-size:10px;line-height:1.25;color:#7a6a52;font-weight:400;
white-space:nowrap}
body.no-rd .rd{display:none}
.notes-head{margin:18px 0 4px;font-size:13px;color:#666}
"""
    js = ("(function(){\n"
          "var UI=" + json.dumps({k: list(v) for k, v in UI.items()},
                                 ensure_ascii=False) + ";\n"
          "var RD=" + json.dumps(reads, ensure_ascii=False) + ";\n"
          "var COLS=" + json.dumps(COLS_EN, ensure_ascii=False) + ";\n"
          + PAGE_JS + "})();")
    return css, js


# The page's own script. Kept as one string so the dictionaries above can be
# poured into it, and written plainly because a reader who views source on a
# transcription of a printed timetable deserves to be able to follow it.
PAGE_JS = r"""
var IX = {ja:0, zh:1, en:2};
/* The address wins over what the reader chose last time, because the map opens
   this page in a box and passes the language its own interface is in: a reader
   with Japanese names off is reading the map in English and should not be
   handed a Japanese page because they once pressed 日本語 here. A visit to the
   page directly has no `lang` and keeps their choice. */
var lang = 'ja';
try { lang = localStorage.getItem('tt-lang') || 'ja'; } catch (e) {}
var asked = (location.search.match(/[?&]lang=(\w+)/) || [])[1];
if (asked) lang = asked;
if (!(lang in IX)) lang = 'ja';

/* Every station name in the tables gets its reading on a second line: the
   kana in Japanese, the Mandarin with its tones otherwise. Matched on the
   whole text of a cell, so it catches the station column whichever column that
   is -- the Taitung tables have a fare column the others do not -- and the
   destination row at the head of each table as well. */
function annotate() {
  var cells = document.querySelectorAll('td, th');
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];
    if (c.querySelector('.rd')) continue;
    var t = (c.textContent || '').trim();
    if (!t || !RD[t]) continue;
    var rd = document.createElement('span');
    rd.className = 'rd';
    c.appendChild(rd);
    c.setAttribute('data-stn', t);
  }
}

function words(key) { return (UI[key] || ['', '', ''])[IX[lang]]; }

function apply() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (UI[k]) el.textContent = words(k);
  });
  /* The check-the-original sentence has a link inside it, so it is built
     rather than assigned: the words round the link differ by language and the
     link itself does not. */
  var chk = document.getElementById('check');
  if (chk) {
    var parts = words('check').split('{a}');
    chk.textContent = '';
    chk.appendChild(document.createTextNode(parts[0]));
    var a = document.createElement('a');
    a.href = 'https://archive.org/details/taiwan-train-times-1936';
    a.textContent = words('archive');
    chk.appendChild(a);
    chk.appendChild(document.createTextNode(parts[1] || ''));
  }
  /* A table's heading is its line, its direction and its two ends. Only the
     direction word is translated; the line and the stations keep the
     characters the table prints, which is what they are called. */
  document.querySelectorAll('h2[data-dir]').forEach(function (h) {
    var dir = h.getAttribute('data-dir') === 'up' ? words('up') : words('down');
    h.textContent = h.getAttribute('data-line') + ' ' + dir + ' '
      + h.getAttribute('data-ends');
  });
  document.querySelectorAll('p.pg').forEach(function (p) {
    var pages = p.getAttribute('data-pages') || '';
    p.textContent = '';
    // full-width brackets in the two languages that use them, ASCII in English
    var open = lang === 'en' ? ' (' : '（', shut = lang === 'en' ? ')' : '）';
    p.appendChild(document.createTextNode(words('page') + ' ' + pages + open));
    var a = document.createElement('a');
    a.href = 'https://archive.org/details/taiwan-train-times-1936';
    a.textContent = 'Internet Archive';
    p.appendChild(a);
    p.appendChild(document.createTextNode(shut));
  });
  /* The column headings, in English only. The original is kept on the cell so
     that a reader who wants the printed word has it one hover away. */
  document.querySelectorAll('tr.hd th').forEach(function (th) {
    var was = th.getAttribute('data-was');
    if (was === null) { was = (th.textContent || '').trim(); th.setAttribute('data-was', was); }
    if (!COLS[was]) return;
    th.textContent = lang === 'en' ? COLS[was] : was;
    th.title = lang === 'en' ? was : '';
  });
  document.querySelectorAll('td').forEach(function (td) {
    var was = td.getAttribute('data-was');
    if (was === null) {
      was = (td.textContent || '').trim();
      if (was !== '著' && was !== '發') return;
      td.setAttribute('data-was', was);
    }
    if (!COLS[was]) return;
    td.textContent = lang === 'en' ? COLS[was] : was;
  });
  document.querySelectorAll('[data-stn]').forEach(function (c) {
    var r = RD[c.getAttribute('data-stn')] || ['', ''];
    var rd = c.querySelector('.rd');
    if (rd) rd.textContent = lang === 'ja' ? r[1] : r[0];
  });
  document.querySelectorAll('#langbar button').forEach(function (b) {
    b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang
                                   ? 'true' : 'false');
  });
  document.title = words('title');
}

function boot() {
  annotate();
  var bar = document.getElementById('langbar');
  bar.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-lang]') : null;
    if (!b) return;
    lang = b.getAttribute('data-lang');
    try { localStorage.setItem('tt-lang', lang); } catch (err) {}
    apply();
  });
  var box = document.getElementById('rd-on');
  var on = true;
  try { on = localStorage.getItem('tt-rd') !== '0'; } catch (err) {}
  box.checked = on;
  document.body.classList.toggle('no-rd', !on);
  box.addEventListener('change', function () {
    document.body.classList.toggle('no-rd', !box.checked);
    try { localStorage.setItem('tt-rd', box.checked ? '1' : '0'); } catch (err) {}
  });
  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }
"""


def build_html(stations):
    """The printed tables, as published, made readable in three languages.

    Only three things are changed inside a table: an anchor on each heading so
    a card can link to a line, a `data-` attribute on each heading and page
    reference so the script can rewrite the words round the numbers, and the
    station readings the script adds. The times, the train numbers and the
    station names are the transcription untouched.
    """
    html = open(os.path.join(SRC, 'tables.html'), encoding='utf-8').read()
    seen = {}
    order = []
    first = {}

    def anchor(m):
        head = m.group(1)
        bits = head.split(' ')
        line = bits[0]
        # the Taitung tables print the direction with a katakana ri
        raw = bits[1] if len(bits) > 1 else ''
        direction = 'up' if raw.startswith('\u4e0a') else 'down'
        ends = ' '.join(bits[2:])
        if line not in seen:
            order.append(line)
        seen[line] = seen.get(line, 0) + 1
        slug = 'line-%d-%d' % (order.index(line) + 1, seen[line])
        first.setdefault(line, slug)
        return ('<h2 id="%s" data-line="%s" data-dir="%s" data-ends="%s">%s</h2>'
                % (slug, line, direction, ends, head))

    html, n = re.subn(r'<h2>([^<]*)</h2>', anchor, html)

    # The page reference under each heading: the page numbers are kept and the
    # word in front of them is not, because that word is the one that has to be
    # able to change language.
    def pages(m):
        nums = m.group(1)
        return ('<p class="pg" data-pages="%s">\u539f\u672c %s\uff08'
                '<a href="https://archive.org/details/taiwan-train-times-1936">'
                'Internet Archive</a>\uff09</p>' % (nums, nums))
    html, npg = re.subn(
        r'<p class="pg">\u539f\u672c ([^\uff08<]*)\uff08'
        r'<a href="https://archive\.org/details/taiwan-train-times-1936">'
        r'Internet Archive</a>\uff09</p>', pages, html)

    # The furniture: title, links, legend, and the caption over the notes.
    html = html.replace(
        '<h1>\u81fa\u7063\u9435\u9053\u6642\u523b\u8868\uff08\u662d\u548c11'
        '\u5e74\u30fb1936\uff09\u2014 \u8ee2\u8a18</h1>',
        '<h1 data-i18n="title">\u81fa\u7063\u9435\u9053\u6642\u523b\u8868'
        '\uff08\u662d\u548c11\u5e74\u30fb1936\uff09\u2014 \u8ee2\u8a18</h1>')
    html = html.replace('<a href="index.html">\u5730\u5716</a>',
                        '<a href="../index.html" data-i18n="map">\u5730\u5716</a>')
    html = html.replace(
        '<a href="https://archive.org/details/taiwan-train-times-1936">'
        '\u539f\u672c\uff08Internet Archive\uff09</a>',
        '<a href="https://archive.org/details/taiwan-train-times-1936" '
        'data-i18n="orig">\u539f\u672c\uff08Internet Archive\uff09</a>'
        + LANG_BAR, 1)

    # The legend is one paragraph with a link in the middle of it. Split in two:
    # the part that is only words, and the sentence built round the link.
    old_legend = html[html.index('<p class="legend">'):
                      html.index('</p>', html.index('<p class="legend">')) + 4]
    html = html.replace(old_legend,
                        '<p class="legend"><span data-i18n="legend"></span> '
                        '<span id="check"></span></p>', 1)

    html = html.replace('<div class="notes">',
                        '<p class="notes-head" data-i18n="notes"></p>'
                        '<div class="notes">')

    css, js = page_extras(stations)
    html = html.replace('</style>', css + '</style>', 1)
    html = html.replace(
        '</main>',
        '<p class="legend" data-i18n="from"></p></main>\n<script>\n'
        + js + '\n</script>')

    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)
    with open(OUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html)
    print('tables     %d headings anchored, %d page references, three '
          'languages -> %s (%d KB)'
          % (n, npg, os.path.relpath(OUT_HTML, ROOT),
             os.path.getsize(OUT_HTML) // 1024))
    if n != 18 or npg != 18:
        print('WARNING: expected 18 headings and 18 page references',
              file=sys.stderr)
    return first


LANG_BAR = (
    '<span id="langbar">'
    '<button type="button" data-lang="ja" aria-pressed="true">\u65e5\u672c\u8a9e</button>'
    '<button type="button" data-lang="zh" aria-pressed="false">\u4e2d\u6587</button>'
    '<button type="button" data-lang="en" aria-pressed="false">English</button>'
    '<label><input type="checkbox" id="rd-on" checked>'
    '<span data-i18n="readings">\u8b80\u307f</span></label>'
    '</span>')


if __name__ == '__main__':
    # The tables first: they are what says where in the printed timetable each
    # line begins, and a card links to that anchor rather than to the top of a
    # two-hundred-kilobyte page.
    # The tables first: they say where in the printed timetable each line
    # begins, and a card links to that anchor rather than to the top of a
    # two-hundred-kilobyte page. They also want the station readings, which
    # come out of the same join `build_js` makes, so that runs first and hands
    # its stations over.
    doc = build_js()
    anchors = build_html(doc['stations'])
    doc = build_js(anchors)
    missing = [l['n'] for l in doc['lines'] if not l['a']]
    if missing:
        print('WARNING: no table anchor found for ' + ', '.join(missing),
              file=sys.stderr)
    blank = [l['n'] for l in doc['lines'] if not l['d']]
    if blank:
        print('WARNING: no description written for ' + ', '.join(blank),
              file=sys.stderr)
