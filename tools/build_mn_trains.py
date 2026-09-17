#!/usr/bin/env python3
"""Build mn-trains.js, mn-times.js and timetable/manchuria-1942.html from the July 1942 timetable.

    python3 tools/build_mn_trains.py

The source is the transcription of the 滿洲・支那汽車時間表 昭和17年7月號 under
data/manchuria/timetable/ -- one JSON file per printed table in transcription/json/, and the
transcription project's own page for the Manchurian section, html/manchuria.html. Unlike the
Taiwan, Korea and Karafuto bundles there is no data.js in between: this build reads the tables
themselves, so it does the work export_map.py did for Korea as well as the work build_kr_trains.py
does after it. Three things come out of it:

  mn-trains.js                  the lines, the stations, and the track between consecutive stops,
                                in the compact form trains.js reads -- Manchuria's own network and
                                the Korean and Japanese lines the same booklet prints
  mn-times.js                   the trains, fetched when the reader asks the timetable a question
  timetable/manchuria-1942.html the printed tables of pages 12 to 53, dressed with a link to the
                                scan for every table, a reading under every station name, and a
                                CSV under every table

WHICH TABLES. The Manchurian section of the booklet, pages 12 to 53: the South Manchuria Railway's
own lines (滿鐵社線), the Manchukuo National Railways (國線) and the three private companies
(其他). The through tables of pages 8 to 11 are not taken -- their trains are the same trains,
printed again with their connections -- nor are the bus pages. The 河北・營口 ferry is a table on
the page and not a line here, for the reason Karafuto's crossings are not: nothing sails along a
railway.

AND THE CONNECTIONS BEYOND IT. The booklet is not only Manchuria's: it prints North and Central
China from page 56, Korea's railway from 54 and again from 72, and Japan's from 84. China has no
station geometry in this map and cannot be drawn; Korea's and Japan's are already here, put there
by their own bundles, so those tables are read as well and their 50 lines are flagged `x` -- the
**connections beyond the network**, which trains.js draws at half weight behind a switch in the
strip, off by default. See CONN_SECTIONS. Two things make that harder than it sounds and both are
argued out where they are solved: half of Japan's printed stop names are more than one place in
N05, settled by `resolve_beyond` from the company a name keeps in its own printed column; and a
name Manchuria also uses may or may not be the same place, settled by distance in `station_for`.

THE TRACK IS ROUTED, NOT TRACED PER STOP. The transcription gives no geometry. Every pair of
consecutive placed stops is put to tools/rail_route.py, which walks the traced 1942 line file the
map itself draws and keeps the shortest path along it when both stops lie on the rails and the
route is no great detour. What could not be routed is drawn straight by trains.js, and the count
is printed. Lines the trace does not yet carry are listed at the end of the build, by name.

STATIONS ARE MATCHED BY NAME AND LINE. The station file has one point per printed name except
大興, which is two places on two lines; a name that is in the file once is used wherever the
tables print it, and a name that is in it twice is matched by the line of the table.
"""
import glob
import io
import json
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rail_route
import trains_split
from trains_lib import read_stations

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "deploy")     # what the web server gets; the rest is how it is made
SRC = os.path.join(ROOT, 'data', 'manchuria')
TT = os.path.join(SRC, 'timetable')
JSON_DIR = os.path.join(TT, 'transcription', 'json')
PAGE_SRC = os.path.join(TT, 'html', 'manchuria.html')
# **The other two sections of the booklet have pages of their own.** The
# transcription project wrote one per section and their markup is the same, so
# Korea's and Japan's are dressed by the same hand and land beside Manchuria's.
# Without this a connection line's card has no printed table to point at, while
# every line of Manchuria's own network has one — and a table nobody can read
# is a figure with no provenance, which is the one thing this map must not
# produce. (`korea-1942` is not `korea-1938`: that is the Korean bundle's own
# booklet, four years earlier and a different set of trains.)
PAGE_SECTIONS = [('', 'manchuria.html', 'manchuria-1942.html'),
                 ('Korea', 'korea.html', 'korea-1942.html'),
                 ('Japan', 'japan.html', 'japan-1942.html')]
LINES_GEOJSON = os.path.join(SRC, 'manchuria-1942-lines.geojson')
# **The networks beyond Manchuria that this same booklet prints.** The stations
# and the traced rails are already in the map, put there by the Korea and Japan
# work; what was missing was the timetable over them, and it has been sitting
# in this transcription all along. See CONN_SECTIONS.
KR_STATIONS_JS = os.path.join(SITE, 'kr-stations.js')
JP_STATIONS_JS = os.path.join(SITE, 'jp-stations.js')
KR_LINES_GEOJSON = [os.path.join(ROOT, 'tools', 'cache', f)
                    for f in ('korea_1942_lines_dedup.geojson',
                              'korea_1930_lines_dedup.geojson')]
JP_LINES_GEOJSON = os.path.join(ROOT, 'data', 'jp-rails',
                                'japan-railway-lines-1942.geojson')
OUT_JS = os.path.join(SITE, 'mn-trains.js')
OUT_TIMES = os.path.join(SITE, 'mn-times.js')   # the timetable, fetched on demand
OUT_HTML = os.path.join(SITE, 'timetable', 'manchuria-1942.html')

PAGE_LO, PAGE_HI = 12, 53        # the Manchurian section of the booklet

# **THE BOOKLET IS NOT ONLY MANCHURIA'S.**
#
# 滿洲・支那汽車時間表 prints the whole through network a traveller out of
# Dairen or Shinkyō could reach: North and Central China from page 56, Korea
# from 54 and again from 72, Japan from 82, then Taiwan, Karafuto and four
# hundred pages of buses. Only the Manchurian section is this system's *own*
# network, and PAGE_LO..PAGE_HI is that.
#
# The rest is not all equally usable. China has no station geometry in this map
# and cannot be drawn at all. Taiwan and Karafuto have their own bundles and
# their own dates, and no train runs to either. **Korea and Japan are the two
# that both connect and can be placed**: the expresses out of Fuzan run over
# the Yalu at Antung into these very tables, and the map already carries 844
# Korean stations and 12,800 Japanese ones with the rails between them traced.
#
# So those tables are read as well, and their lines are flagged `x` — the
# **connections beyond the network**, which trains.js already draws at half
# weight behind a switch in the strip. The same arrangement the Korean bundle
# has for its Manchurian and Japanese connections, made in the other direction.
#
# Keyed on the section word in the transcription's own file names: 鮮鐵, 北鮮,
# 會寧炭礦 and 鐵道省. `kahoku`/`kachu` (China), `taiwan`, `taitetsu`,
# `karafuto`, `renrakusen` (the Hōkō–Nanking boat) and `bus` are not here and
# are not read.
CONN_SECTIONS = {'sentetsu': 'Korea', 'hokusen': 'Korea', 'kainei': 'Korea',
                 'tetsudosho': 'Japan'}

# The scan the transcription was made from, and the leaf each printed page is on. Measured by
# eye against three spreads: printed pages 12 and 13 are on leaf 14, 20 and 21 on leaf 18, 52 and
# 53 on leaf 34 -- one leaf per pair of pages, so a page's leaf is half its number plus eight.
# The header links the item and every table's page reference links its own leaf.
ARCHIVE = 'https://archive.org/details/manshu-shina-kisha-jikanhyo-1942.7'
LEAF_BASE = 8


def leaf_of(page):
    return int(page) // 2 + LEAF_BASE


# The company prefixes the booklet prints before a line name. Stripped to get the line's own
# name, which is what the chip in the bar has room for; the company goes in the description.
PREFIX = (('滿鐵社線 ', 'South Manchuria Railway'),
          ('滿洲國線 ', 'Manchukuo National Railways'),
          ('國線 ', 'Manchukuo National Railways'),
          ('滿鐵 ', 'South Manchuria Railway'),
          ('其他 ', ''),
          # and the two beyond Manchuria, for the connection tables
          ('鮮鐵 ', 'Chōsen Government Railway'),
          ('朝鮮總督府鐵道局 ', 'Chōsen Government Railway'),
          ('鐵道省航路 ', 'Japanese Government Railways'),
          ('鐵道省 ', 'Japanese Government Railways'))

# One table prints two lines end to end and names both; it is one line here.
MERGE = {'綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）': '綏佳線・鶴岡線',
         # the Seishin–Rashin table, worked by two companies over one run
         '北鮮線（上三峰・羅津間）／朝鮮總督府鐵道局 咸鏡線（淸津・上三峰間）':
             '北鮮線・咸鏡線',
         # **The up table of a composite route names its parts backwards.**
         # 名古屋→龜山→鳥羽 is printed 關西本線・參宮線 and the same run the
         # other way is 參宮線・關西本線. Read as they stand that is two lines
         # with one direction each: the same rails drawn twice, in two colours,
         # and neither of them with an up train. The 下り name is the canonical
         # one, because that is the direction the booklet prints first.
         '咸鏡・京元本線': '京元・咸鏡本線',
         '宇高連絡船・宇野線': '宇野線・宇高連絡船',
         '參宮線・關西本線': '關西本線・參宮線',
         '櫻井線・奈良線': '奈良線・櫻井線',
         '奧羽本線・羽越本線': '羽越本線・奧羽本線',
         '篠ノ井線・中央本線': '中央本線・篠ノ井線',
         '信越本線・高崎線・上越線': '高崎線・信越本線・上越線'}

# **The names of the lines beyond Manchuria.** `pinyin_name` reads characters
# as Chinese, which is right for this network and wrong for 東海道本線, so the
# connection lines are named here instead. Korea's own bundle already names
# most of its lines and those are taken from it rather than written again —
# the two bundles must not call the same railway two different things. What is
# added is what the 1938 tables had no need of: the sections this 1942 booklet
# prints separately (東海 in three parts, 慶全 in two), and Japan's.
CONN_EN = {
    '京義線': 'Kyŏngŭi Line', '京釜線': 'Kyŏngbu Line',
    '京慶北部線': 'Kyŏnggyŏng Northern Line',
    '慶全南部線': 'Kyŏngjŏn Southern Line', '慶全西部線': 'Kyŏngjŏn Western Line',
    '東海中部線': 'Tonghae Central Line', '東海北部線': 'Tonghae Northern Line',
    '東海南部線': 'Tonghae Southern Line',
    '北鮮線・咸鏡線': 'Pukson / Hamgyŏng Line',
    '三角線': 'Misumi Line', '上越線': 'Jōetsu Line',
    '中央本線': 'Chūō Main Line', '中央本線・篠ノ井線': 'Chūō Main / Shinonoi Line',
    '佐世保線': 'Sasebo Line', '函館本線': 'Hakodate Main Line',
    '北陸本線・信越本線': 'Hokuriku / Shin’etsu Main Line',
    '宇野線・宇高連絡船': 'Uno Line and the Ukō ferry',
    '宮島連絡船': 'Miyajima ferry', '宮津線': 'Miyazu Line',
    '山陰本線': 'San’in Main Line',
    '山陽線・東海道本線': 'San’yō / Tōkaidō Main Line',
    '常磐線': 'Jōban Line', '日豐本線': 'Nippō Main Line',
    '東北本線': 'Tōhoku Main Line', '東海道本線': 'Tōkaidō Main Line',
    '奧羽本線': 'Ōu Main Line', '羽越本線・奧羽本線': 'Uetsu / Ōu Main Line',
    '奈良線・櫻井線': 'Nara / Sakurai Line',
    '肥薩線（吉松以南 日豐本線・吉都線を含む）': 'Hisatsu Line',
    '豐肥本線': 'Hōhi Main Line', '豫讃本線': 'Yosan Main Line',
    '長崎本線': 'Nagasaki Main Line', '關西本線': 'Kansai Main Line',
    '關西本線・參宮線': 'Kansai Main / Sangū Line',
    '關門連絡船': 'Kanmon ferry',
    '高崎線・信越本線・上越線': 'Takasaki / Shin’etsu / Jōetsu Line',
    '高德本線': 'Kōtoku Main Line', '鹿兒島本線': 'Kagoshima Main Line',
}

CONN_JA = {
    '京義線': 'Keigi-sen', '京釜線': 'Keifu-sen',
    '京慶北部線': 'Keikei hokubu-sen',
    '慶全南部線': 'Keizen nanbu-sen', '慶全西部線': 'Keizen seibu-sen',
    '東海中部線': 'Tōkai chūbu-sen', '東海北部線': 'Tōkai hokubu-sen',
    '東海南部線': 'Tōkai nanbu-sen',
    '北鮮線・咸鏡線': 'Hokusen-sen / Kankyō-sen',
}

# Tables that are not railways: the ferry across the Liao mouth.
SKIP_LINES = {'連絡船 河北・營口間'}
# Lines kept off the map for now, by request, until their trace is drawn: the
# 北票線 has no geometry and two placed stops, so its trains ran along a chord
# joined to nothing. On the printed page still; not in the bundle.
HIDDEN_LINES = {'國線 北票線'}

# The Japanese reading of each line name, for the switch that puts the map into Japanese
# names; the pinyin name is derived. A line missing here is reported and gets its characters.
LINE_JA = {
    '連京線': 'Renkyō-sen', '安奉線': 'Anpō-sen', '金城線': 'Kinjō-sen', '撫順線': 'Bujun-sen',
    '營口線': 'Eikō-sen', '旅順線': 'Ryojun-sen', '煙臺炭礦線': 'Entai Tankō-sen',
    '溪城線': 'Keijō-sen', '安南線': 'Annan-sen', '奉吉線': 'Hōkitsu-sen', '壺蘆島線': 'Korotō-sen',
    '奉山線': 'Hōzan-sen', '新義線': 'Shingi-sen', '高新線': 'Kōshin-sen', '河北線': 'Kahoku-sen',
    '北票線': 'Hokuhyō-sen', '葉峰線': 'Yōhō-sen', '錦古線': 'Kinko-sen', '大鄭線': 'Daitei-sen',
    '平梅線': 'Heibai-sen', '大栗子線': 'Dairisushi-sen', '渾三線': 'Konsan-sen',
    '梅輯線': 'Baishū-sen', '平齊線': 'Heisei-sen', '榆樹線': 'Yuju-sen', '京白線': 'Keihaku-sen',
    '白阿線': 'Hakua-sen', '寧霍線': 'Neikaku-sen', '阿杜線': 'Ato-sen', '東當線': 'Tōtō-sen',
    '北黑線': 'Hokkoku-sen', '虎林線': 'Korin-sen', '齊北線': 'Seihoku-sen', '濱北線': 'Hinhoku-sen',
    '龍豐線': 'Ryūhō-sen', '京圖線': 'Keito-sen', '霍黑線': 'Kakkoku-sen', '拉濱線': 'Rahin-sen',
    '京濱線': 'Keihin-sen', '濱洲線': 'Hinshū-sen', '綏佳線': 'Suika-sen', '濱綏線': 'Hinsui-sen',
    '城雞線': 'Jōkei-sen', '綏寧線': 'Suinei-sen', '圖佳線': 'Toka-sen',
    '綏佳線・鶴岡線': 'Suika-sen / Kakkō-sen', '朝開線': 'Chōkai-sen', '青道線': 'Seidō-sen',
    '恒山線': 'Kōzan-sen', '興寧線': 'Kōnei-sen', '錦西鐵道線': 'Kinsei Tetsudō-sen',
    '開豐鐵道線': 'Kaihō Tetsudō-sen', '吉林鐵道線': 'Kirin Tetsudō-sen',
    '東滿洲會社線': 'Higashi-Manshū Kaisha-sen',
}

# The pinyin name of a line where the derivation from its characters is not the usual one.
LINE_EN = {
    '旅順線': 'Lüshun Line', '榆樹線': 'Yushu Line',
    '綏佳線・鶴岡線': 'Suijia / Hegang Line',
    '錦西鐵道線': 'Jinxi Railway', '開豐鐵道線': 'Kaifeng Railway', '吉林鐵道線': 'Jilin Railway',
    '東滿洲會社線': 'East Manchuria Company Line',
}

# The timetable's own colours, one per line, in the order the lines are met. Chosen to be
# tellable apart where lines meet; a network of fifty-odd lines repeats a colour, and the
# repeats are put far apart in the list so that neighbours differ.
PALETTE = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#7f8c8d',
           '#c2185b', '#1565c0', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f', '#5d4037',
           '#ad1457', '#0277bd', '#558b2f', '#4527a0', '#f57f17', '#00695c', '#616161',
           '#b71c1c', '#283593', '#33691e', '#880e4f', '#e65100', '#006064', '#3e2723',
           '#d81b60', '#1976d2', '#43a047', '#7b1fa2', '#ff8f00', '#00897b', '#455a64',
           '#e53935', '#3949ab', '#689f38', '#8e24aa', '#fb8c00', '#00acc1', '#6d4c41',
           '#ec407a', '#1e88e5', '#7cb342', '#5e35b1', '#ffb300', '#26a69a', '#546e7a',
           '#ef5350', '#5c6bc0', '#9ccc65', '#ab47bc', '#ffa726', '#26c6da', '#8d6e63',
           '#f06292', '#42a5f5', '#66bb6a', '#7e57c2']


def split_line(s):
    """'國線 平梅線' -> ('平梅線', 'Manchukuo National Railways')."""
    s = s.strip()
    for p, co in PREFIX:
        if s.startswith(p):
            return MERGE.get(s[len(p):], s[len(p):]), co
    return MERGE.get(s, s), ''


def pinyin_name(name):
    """A line's name in pinyin: 連京線 -> Lianjing Line."""
    if name in LINE_EN:
        return LINE_EN[name]
    try:
        from pypinyin import lazy_pinyin
    except ImportError:
        return name
    stem = name[:-1] if name.endswith('線') else name
    stem = stem.replace('鐵道', '')
    syl = lazy_pinyin(stem)
    return ''.join(syl).capitalize() + ' Line'


def minutes(t):
    h, m = t.split(':')
    return int(h) * 60 + int(m)


def read_tables():
    """The rail tables in page order, Manchuria's own and the connections.

    `_conn` is '' for Manchuria's own network and 'Korea' or 'Japan' for a
    table from one of the sections beyond it; everything downstream keys on
    that rather than on the page number, so a table's country survives a
    change of pagination."""
    out = []
    for path in sorted(glob.glob(os.path.join(JSON_DIR, 'p*.json'))):
        tid = os.path.basename(path)[:-5]
        m = re.match(r'p(\d+)[a-z]*_([a-z]+)_', tid)
        if not m:
            continue
        page = int(m.group(1))
        conn = CONN_SECTIONS.get(m.group(2), '')
        if not conn and (page < PAGE_LO or page > PAGE_HI):
            continue
        with io.open(path, encoding='utf-8') as fh:
            x = json.load(fh)
        # **`clock` says how the page prints, not what the data holds.** The
        # Japanese tables are printed 12-hour with the afternoon in bold, and
        # the transcription has already read that: a bold 1.39 comes through as
        # 13:39, and 1,617 of the 7,803 timed stops run past midnight in the
        # same 25:12-for-1.12 form the Manchurian tables use. So the flag is no
        # reason to refuse them. It still refuses a *bus* table, which is what
        # it was put here for.
        if x.get('kind') == 'bus':
            continue
        if x.get('clock') == '12' and not conn:
            continue
        if x.get('line') in SKIP_LINES or x.get('line') in HIDDEN_LINES:
            continue
        x['_id'] = tid
        x['_page'] = page
        x['_conn'] = conn
        out.append(x)
    # the booklet's own order: by page, then by the letter the table has on it
    out.sort(key=lambda x: (x['_page'], x['_id']))
    return out


# **The fold that lets two sources agree about a name.** The booklet prints
# 下關, 仙臺 and 鹿兒島; the Japanese station file has 下関, 仙台 and 鹿児島, and
# the Korean one is inconsistent with itself. Neither side is wrong and neither
# is going to be rewritten, so both are folded to the same shape before they
# are compared. This is `build_kr_trains.VARIANTS`, imported rather than
# copied: one table, argued about in one place.
try:
    from build_kr_trains import VARIANTS as _VARIANTS
    from build_kr_trains import LINE_EN as _KR_EN, LINE_JA as _KR_JA
except Exception:                       # pragma: no cover - the table is data
    _VARIANTS, _KR_EN, _KR_JA = {}, {}, {}


def fold(name):
    """A station name reduced to what two sources can be asked to share."""
    n = re.sub(r'[（(].*?[)）]', '', name or '').strip()
    n = re.sub(r'(著|發|着|発)$', '', n)
    return ''.join(_VARIANTS.get(c, c) for c in n)


def conn_stations():
    """Korea's stations and Japan's, folded, **kept in separate pools**.

    One pool for both was wrong and wrong in a way that looked right: 仁川 is
    not in Korea's 1938 station file, and there is a 仁川 in Hyōgo, so every
    Inch'ŏn local ran 838 km down the Keijin line in four minutes and came back.
    A Korean table is answered from Korea's file and a Japanese one from
    Japan's; a name neither has stays unplaced, which is the honest answer and
    the one that shows.

    Korea's bundle carries the Japanese reading of every name and Japan's
    carries none at all, so a Japanese connection stop is characters only. That
    is the source's doing and not a gap worth filling by guessing: how many
    have a reading is printed at the end of the build."""
    out = {'Korea': {}, 'Japan': {}}

    for line in io.open(KR_STATIONS_JS, encoding='utf-8'):
        line = line.strip().rstrip(',')
        if not (line.startswith('{') and line.endswith('}')):
            continue
        o = json.loads(line)
        k = fold(o.get('han') or '')
        if k and o.get('lon') is not None:
            out['Korea'].setdefault(k, []).append(
                {'lon': o['lon'], 'lat': o['lat'], 'ro': o.get('ro', ''),
                 'where': 'Korea'})
    src = io.open(JP_STATIONS_JS, encoding='utf-8').read()
    i, j = src.find('['), src.rfind(']')
    for o in json.loads(src[i:j + 1]) if i >= 0 else []:
        k = fold(o.get('n') or '')
        if k and o.get('lon') is not None:
            out['Japan'].setdefault(k, []).append(
                {'lon': o['lon'], 'lat': o['lat'], 'ro': '', 'where': 'Japan'})
    return out


# **HALF OF JAPAN'S NAMES ARE MORE THAN ONE PLACE.**
#
# N05 has 10,866 distinct station names over 12,800 places: 1,383 of those
# names are two places or more and 小倉 is five, 清水 six, 福島 seven. Of the
# 668 stops the Japanese tables print, **324 are ambiguous** — very nearly
# half. Taking the first row of that name is a coin flip, and it came up
# wrong often enough to be obvious: 門司港 to 小倉 measured 781 km in twenty
# minutes, and 靜岡 to 清水, which is twelve minutes along the Tōkaidō, came
# out at 973.
#
# The booklet itself says which one is meant, not in words but in order. A
# table is a line, and a line is a sequence of places near each other, so a
# name is resolved by **where its neighbours in the printed column are**. The
# unambiguous names — the other 344 — seed it, and the rest fall out in a few
# rounds. Korea needs almost none of this: 7 of its 843 names repeat and only
# 10 printed stops are touched.
#
# A candidate is only accepted if it is within MAX_ANCHOR_KM of the nearest
# anchor. A name whose neighbours are all still unplaced, or whose best
# candidate is a long way from them, is left for the next round and finally
# left unplaced — which is the answer that shows, rather than a point in the
# wrong prefecture that does not.
MAX_ANCHOR_KM = 120


def resolve_beyond(tables, pools):
    """One place per name per country, chosen by the company it keeps."""
    chosen = {'Korea': {}, 'Japan': {}}
    seqs = {'Korea': [], 'Japan': []}
    for x in tables:
        if not x['_conn']:
            continue
        run = []
        for st in x['stations']:
            n = fold(st.get('name') or '')
            if n and (not run or run[-1] != n):
                run.append(n)
        if len(run) > 1:
            seqs[x['_conn']].append(run)

    report = {}
    for cn in ('Korea', 'Japan'):
        pool = pools[cn]
        pick = chosen[cn]
        printed = set()
        for run in seqs[cn]:
            printed.update(run)
        # the names that need no choosing, which are the anchors
        unique = 0
        for n in printed:
            c = pool.get(n)
            if c and len(c) == 1:
                pick[n] = c[0]
                unique += 1
        ambiguous = sorted(n for n in printed
                           if n not in pick and len(pool.get(n) or ()) > 1)
        settled = 0
        moved = True
        while moved:
            moved = False
            for n in list(ambiguous):
                if n in pick:
                    continue
                anchors = []
                for run in seqs[cn]:
                    for k, m in enumerate(run):
                        if m != n:
                            continue
                        for step in (-1, 1):           # outward either way
                            j = k + step
                            while 0 <= j < len(run):
                                if run[j] in pick:
                                    anchors.append(pick[run[j]])
                                    break
                                j += step
                if not anchors:
                    continue
                best, best_d = None, None
                for c in pool[n]:
                    d = min(rail_route._km((c['lon'], c['lat']),
                                           (a['lon'], a['lat'])) for a in anchors)
                    if best_d is None or d < best_d:
                        best, best_d = c, d
                if best is None or best_d > MAX_ANCHOR_KM:
                    continue
                pick[n] = best
                settled += 1
                moved = True
        report[cn] = (unique, settled,
                      len([n for n in ambiguous if n not in pick]))
    return chosen, report


def our_stations():
    return read_stations('mn')


def dir_of(x):
    """'下り (大連→奉天)' or '金州→城子疃' -> the two ends."""
    m = re.search(r'([^\s()（）]+)→([^\s()（）]+)', x.get('dir') or '')
    return (m.group(1), m.group(2)) if m else ('', '')


# ---------------------------------------------------------------------------------------------
# the printed page

RD_CSS = """
#langbar label{color:#e8c988;display:flex;gap:4px;align-items:center;cursor:pointer}
.rd{display:block;font-size:10px;line-height:1.25;color:#7a6a52;font-weight:400;white-space:nowrap}
body.no-rd .rd{display:none}
.pg a{color:#8a5a2b}
p.dl{margin:4px 0 0;font-size:12px}p.dl a{color:#5a3d22}
"""

# What the header says, in the page's two languages, for the things this build adds.
PAGE_JS = r"""
/* ---- added by tools/build_mn_trains.py ------------------------------------------------
   Three things the map wants on the transcription project's page: the scan linked from every
   table's page reference, a reading under every station name behind a switch in the header,
   and a CSV under every table that carries the table's notes and its source with it. */
var ARCHIVE=%(archive)s, LEAF_BASE=%(leaf)d;
var RD=%(readings)s;
var X={ja:{page:'原本',ia:'Internet Archive',csv:'CSV を保存',src:'滿洲・支那汽車時間表 昭和17年7月號'},
       en:{page:'Original',ia:'Internet Archive',csv:'Download CSV',src:'滿洲・支那汽車時間表 (July 1942)'}};
var rdOn=true;
try{rdOn=localStorage.getItem('mt-rd')!=='off';}catch(e){}
function annotate(){
  var cells=document.querySelectorAll('.tw td:nth-child(2)');
  for(var i=0;i<cells.length;i++){
    var c=cells[i];
    if(c.querySelector('.rd')) continue;
    var t=(c.textContent||'').trim();
    if(!t||!RD[t]) continue;
    c.setAttribute('data-stn',t);
    var sp=document.createElement('span'); sp.className='rd'; c.appendChild(sp);
  }
}
function readings(){
  var l=(document.documentElement.lang==='en')?'en':'ja';
  document.querySelectorAll('[data-stn]').forEach(function(c){
    var r=RD[c.getAttribute('data-stn')]; if(!r) return;
    var sp=c.querySelector('.rd'); if(!sp) return;
    /* kana for the Japanese page, romaji for the English one; the second is the fallback
       because every station has it and not every one has kana */
    sp.textContent=(l==='en'?(r[1]||r[0]):(r[0]||r[1]))||'';
  });
  document.body.classList.toggle('no-rd',!rdOn);
}
function pages(){
  var l=(document.documentElement.lang==='en')?'en':'ja';
  document.querySelectorAll('p.pg').forEach(function(p){
    var pg=p.getAttribute('data-pages')||'';
    p.textContent='';
    var o=l==='en'?' (':'（', c=l==='en'?')':'）';
    p.appendChild(document.createTextNode(X[l].page+' p.'+pg+o));
    var a=document.createElement('a');
    a.href=ARCHIVE+'/page/n'+(Math.floor(parseInt(pg,10)/2)+LEAF_BASE);
    a.textContent=X[l].ia; p.appendChild(a);
    p.appendChild(document.createTextNode(c));
  });
  document.querySelectorAll('p.dl a').forEach(function(a){a.textContent=X[l].csv;});
}
/* The CSV: the table's title, its header rows and its stop rows -- times in the 24-hour form
   the cell carries as data, not as the reader has the page set -- then a blank line, a Note
   row for each note under the table, and a Source row naming the booklet, the page and the
   scan. A table somebody can read is a table somebody will quote. */
function csvOf(sec){
  var l=(document.documentElement.lang==='en')?'en':'ja';
  var q=function(s){s=String(s==null?'':s); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  var rows=[[sec.title]];
  var tbl=sec.table;
  for(var i=0;i<tbl.rows.length;i++){
    var cells=tbl.rows[i].cells, r=[];
    for(var j=0;j<cells.length;j++){
      var c=cells[j], v;
      if(c.hasAttribute('data-t')) v=c.getAttribute('data-t');
      else{ v=(c.getAttribute('data-stn')?c.firstChild.nodeValue:c.textContent)||''; v=v.trim(); if(v==='…')v=''; }
      r.push(v);
    }
    rows.push(r);
  }
  rows.push([]);
  sec.notes.forEach(function(n){rows.push(['Note',n]);});
  rows.push(['Source',X[l].src+', p.'+sec.page,ARCHIVE+'/page/n'+(Math.floor(parseInt(sec.page,10)/2)+LEAF_BASE)]);
  return rows.map(function(r){return r.map(q).join(',');}).join('\r\n')+'\r\n';
}
document.querySelectorAll('p.dl a').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    var box=a.parentNode.previousElementSibling, h2=box.previousElementSibling.previousElementSibling;
    var notes=[], nb=a.parentNode.nextElementSibling;
    if(nb&&nb.classList.contains('notes')) nb.querySelectorAll('p').forEach(function(p){notes.push(p.textContent.trim());});
    var sec={title:h2.textContent.trim(), table:box.querySelector('table'),
             page:h2.nextElementSibling.getAttribute('data-pages')||'', notes:notes};
    var blob=new Blob(['﻿'+csvOf(sec)],{type:'text/csv;charset=utf-8'});
    var u=URL.createObjectURL(blob), d=document.createElement('a');
    d.href=u; d.download=(h2.id||'table')+'.csv'; document.body.appendChild(d); d.click();
    setTimeout(function(){document.body.removeChild(d);URL.revokeObjectURL(u);},0);
  });
});
document.getElementById('langbar').addEventListener('change',function(e){
  if(e.target.id!=='rd-on')return; rdOn=e.target.checked;
  try{localStorage.setItem('mt-rd',rdOn?'on':'off');}catch(err){}
  readings();
});
var rb=document.getElementById('rd-on'); if(rb) rb.checked=rdOn;
annotate();
/* the page's own apply() runs on every language press; these follow it */
document.getElementById('bar').addEventListener('click',function(){setTimeout(function(){readings();pages();},0);});
readings(); pages();
"""


def dress_html(tables, anchors_by_line, reads, src=None, out=None):
    """The transcription project's page, with the map's furniture on it.

    Patched here rather than in data/manchuria/timetable/html/manchuria.html because that file is
    the transcription as it was made, and a replacement of it should not have to carry this
    map's furniture. Every substitution is asserted, so a source that has moved on fails the
    build instead of quietly shipping a page missing half of what was asked for.
    """
    src = src or PAGE_SRC
    out = out or OUT_HTML
    who = os.path.basename(src)
    html = io.open(src, encoding='utf-8').read()

    def sub(old, new, what, count=1):
        n = html.count(old)
        if count is not None and n != count:
            raise SystemExit('%s: %s -- expected %s of %r, found %d'
                             % (who, what, count, old[:60], n))
        return html.replace(old, new)

    # the header: the map instead of the transcription project's index, the scan, the readings
    html = sub('<a href="index.html" data-ja="目次" data-en="Contents">目次</a>'
               '<span id="bar">',
               '<a href="../index.html" data-ja="地圖" data-en="Map">地圖</a>'
               '<a href="' + ARCHIVE + '" data-ja="原本（Internet Archive）" '
               'data-en="Original (Internet Archive)">原本（Internet Archive）</a>'
               '<span id="bar">'
               '<span id="langbar"><label><input type="checkbox" id="rd-on" checked>'
               '<span data-ja="讀み" data-en="Readings">讀み</span></label></span>',
               'the header bar')
    html = sub('</style></head>', RD_CSS + '</style></head>', 'the stylesheet')
    # the page's own furniture opens in Japanese; the map's readers are more often students
    # of the empire than readers of its languages, so English first, remembered either way
    html = sub("var lang='ja', t24=false;", "var lang='en', t24=false;", 'the default language')
    html = sub("localStorage.getItem('mt-lang')||'ja'", "localStorage.getItem('mt-lang')||'en'",
               'the remembered language')

    # each table's page reference carries the page as data, so the script can link the leaf
    n_pg = [0]

    def pg(m):
        n_pg[0] += 1
        return '<p class="pg" data-pages="%s" data-src="%s">原本 p.%s</p>' % (
            m.group(1), m.group(2), m.group(1))
    html, n = re.subn(r'<p class="pg">原本 <b>p\.(\d+)</b>（([^）]*)）</p>', pg, html)
    # **The page may hold more than the build takes, but never fewer.** The
    # 連絡船 河北・營口 and the untraced 北票線 are printed and skipped, so
    # manchuria.html has 132 references for 128 tables. A page with *fewer*
    # than the build asked for is a source that has moved on, and fails.
    if n < len(tables):
        raise SystemExit('%s: %d page references, fewer than the %d tables read'
                         % (who, n, len(tables)))

    # every table heading says which line and which way, for the map and for the reader
    by_id = {x['_id']: x for x in tables}

    def h2(m):
        tid, text = m.group(1), m.group(2)
        x = by_id.get(tid)
        if not x:
            return m.group(0)
        name, _ = split_line(x['line'])
        a, b = dir_of(x)
        return '<h2 id="%s" data-line="%s" data-dir="%s" data-ends="%s">%s</h2>' % (
            tid, name, x['_dir'], (a + '→' + b) if a else '', text)
    html, n_h2 = re.subn(r'<h2 id="([^"]+)">([^<]*)</h2>', h2, html)

    # a CSV under every table
    html, n_dl = re.subn(r'</table></div>\n',
                         '</table></div>\n<p class="dl"><a class="dl" href="#">CSV</a></p>\n', html)

    html = sub('</script></body></html>',
               PAGE_JS % {'archive': json.dumps(ARCHIVE), 'leaf': LEAF_BASE,
                          'readings': json.dumps(reads, ensure_ascii=False)}
               + '</script></body></html>', 'the script')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with io.open(out, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(html)
    return n_pg[0], n_h2, n_dl


# ---------------------------------------------------------------------------------------------

def main():
    tables = read_tables()

    # --- the lines, in the order the booklet meets them
    line_ix, lines, first_table, ends = {}, [], {}, {}
    for x in tables:
        name, co = split_line(x['line'])
        x['_name'] = name
        if name not in line_ix:
            line_ix[name] = len(lines)
            first_table[name] = x['_id']
            ends[name] = dir_of(x)
            lines.append({'n': name, 'co': co, 'cn': x['_conn']})
    # which way each table runs: the first table of a line is down, a table running the
    # other way is up; the booklet prints 下り/上り on the trunk and only the ends elsewhere
    for x in tables:
        d = x.get('dir') or ''
        if d.startswith('下り'):
            x['_dir'] = 'down'
        elif d.startswith('上り'):
            x['_dir'] = 'up'
        else:
            a, b = dir_of(x)
            x['_dir'] = 'down' if (a, b) == ends[x['_name']] or a == ends[x['_name']][0] else 'up'

    # --- the stations: every name a table prints, placed where the station file has it
    ours = our_stations()
    by_name = {}
    for o in ours:
        by_name.setdefault(o['han'], []).append(o)
    beyond, beyond_report = resolve_beyond(tables, conn_stations())
    SAME_PLACE_KM = 100                 # see `station_for`
    stations, ix = [], {}
    unmatched = set()
    conn_placed = {'Korea': 0, 'Japan': 0}
    conn_missed = {'Korea': set(), 'Japan': set()}

    # **Manchuria's own file is asked first, whatever the table.** A Korean
    # table heads its expresses at 新京 and 奉天 and a Japanese one ends at
    # 下關: those are the same places the Manchurian tables call at, and they
    # have to come out as the *same station record* or the through train is
    # two trains with a hole between them. Only a name Manchuria has never
    # heard of goes to the country pool.
    def beyond_for(name, conn):
        return beyond.get(conn, {}).get(fold(name)) if conn else None


    # **A name two countries both use is two stations, unless it is one.**
    #
    # 安東, 新京 and 奉天 stand at the head of the Korean columns and are the
    # same places the Manchurian tables call at: they have to come out as one
    # record or the Fuzan express is two trains with a hole over the Yalu. But
    # 鶴岡 is a stop on Manchuria's 鶴岡線 *and* a town in Yamagata on the
    # 羽越本線, and those are 1,259 km apart. The name cannot tell them apart
    # and neither can the line; the distance can, and does it before anything
    # is drawn rather than afterwards from a train's impossible speed.
    def station_for(name, line_full, conn=''):
        cands = by_name.get(name, [])
        o = None
        if len(cands) == 1:
            o = cands[0]
        elif len(cands) > 1:
            here = [c for c in cands if line_full in c['line']]
            o = here[0] if len(here) == 1 else None
        b = beyond_for(name, conn)
        # the country's own file wins when the two are plainly not one place
        if o and b and rail_route._km((o['lon'], o['lat']),
                                      (b['lon'], b['lat'])) > SAME_PLACE_KM:
            o = None
        key = name if len(cands) < 2 else name + '|' + line_full
        if o is None and b:
            key = name + '|' + conn          # its own record, not Manchuria's
        if key in ix:
            return ix[key]
        rec = {'n': name}
        if o:
            rec['lon'], rec['lat'] = o['lon'], o['lat']
            rec['sid'] = o['id']
            if o.get('py'):
                rec['py'] = o['py']
            if o.get('ro'):
                rec['ro'] = o['ro']
        elif b:
            rec['lon'], rec['lat'] = b['lon'], b['lat']
            if b.get('ro'):
                rec['ro'] = b['ro']
            rec['_beyond'] = 1
            conn_placed[b['where']] += 1
        elif conn:
            conn_missed[conn].add(name)
        else:
            unmatched.add(name)
        rec['li'] = []
        ix[key] = len(stations)
        stations.append(rec)
        return ix[key]

    # **A name the file has once may still be two places.** The 錦西鐵道線 has a 老邊 four
    # kilometres out of 錦西 and the 營口線 has one outside 營口, and the station file placed
    # only the second; matched by name alone, the colliery line's trains ran 130 km to the coast
    # and back in four minutes. Distance alone cannot tell the two apart from a through run --
    # the 安奉線 tables start their expresses at 新京, 283 km from anything on the line, and
    # that is the same 新京. The clock can: a stop the file does not put on the table's line is
    # another place when the train would have to run faster than 150 km/h to reach it from the
    # timed stop before or after, and then it is an unplaced station of that line. Reported.
    # **It must answer exactly what `station_for` will use.** This feeds the
    # clock test, and a clock told about a point the build never drew reports
    # faults nobody has and misses the ones they do have. So the same order of
    # preference, including the distance rule that gives a connection table its
    # own country's station.
    def placed_point(n, line_full, conn=''):
        cands = by_name.get(n, [])
        b = beyond_for(n, conn)
        o = None
        if len(cands) == 1:
            o = cands[0]
        else:
            here = [c for c in cands if line_full in c['line']]
            if here and len(here) == 1:
                o = here[0]
            elif cands:
                return None
        if o and b and rail_route._km((o['lon'], o['lat']),
                                      (b['lon'], b['lat'])) > SAME_PLACE_KM:
            o = None
        if o:
            return o
        # Korea's and Japan's files carry no line for a station, so the "is it
        # on this line?" half of the test below has nothing to weigh — but the
        # other half, the speed, needs no line at all, and a stop that would
        # have to be flown to is the wrong stop whatever file it came from.
        # Handed back with an empty `line` so the test can still convict.
        return dict(b, line='') if b else None

    strangers = []
    strange_by_line = {}          # a name that is another place on a line is so in all its tables
    for x in tables:
        x['_strange'] = strange_by_line.setdefault(x['_name'], set())
        for t in x['trains']:
            # the timed stops that are placed, in order: an unplaced halt between two of
            # them is stepped over here as trains.js steps over it
            run = []
            for s in t['stops']:
                if not s.get('t'):
                    continue
                o = placed_point(s['st'], x['line'], x['_conn'])
                if o and not (run and run[-1][0] == s['st']):
                    run.append((s['st'], minutes(s['t']), o))
            for (a, ta, pa), (b, tb, pb) in zip(run, run[1:]):
                km = rail_route._km((pa['lon'], pa['lat']), (pb['lon'], pb['lat']))
                # **A short leg cannot convict, however fast it reads.** The
                # booklet prints whole minutes, so three kilometres between two
                # halts of the 會寧炭礦線 in "1 min" is 180 km/h by arithmetic
                # and a rounded figure in fact. The test is for a stop placed in
                # the wrong province, and that shows as tens of kilometres or
                # hundreds — never as three. Ten such legs were being thrown out
                # on this evidence once Korea's and Japan's tables came in.
                if km < 25:
                    continue
                if km / (max(1, abs(tb - ta)) / 60.0) <= 150:
                    continue
                for n, o in ((a, pa), (b, pb)):
                    # **The clock is no longer the best witness for these.**
                    # A connection stop is placed by `resolve_beyond`, which
                    # picks among the candidates of that name by where the
                    # table's own neighbours are and refuses anything more
                    # than MAX_ANCHOR_KM from them; and a name Manchuria also
                    # has is separated by SAME_PLACE_KM before it is ever
                    # drawn. Both are evidence about *position*, which is what
                    # is in question, where the clock is evidence about a
                    # printed minute. It convicted four stops of the 關西本線
                    # on 名古屋 to 龜山 "in 3 min" — 53 km, which is the right
                    # distance between the right two places and a misprinted
                    # time. So a stop the country's file placed is left alone.
                    if o.get('where'):
                        continue
                    if x['line'] not in o['line'] and n not in x['_strange']:
                        x['_strange'].add(n)
                        strangers.append('%s (%s: %s to %s, %.0f km in %d min)'
                                         % (n, x['_name'], a, b, km, abs(tb - ta)))
    for x in tables:
        li = line_ix[x['_name']]
        names = [s['name'] for s in x['stations']]
        for t in x['trains']:
            for s in t['stops']:
                if s['st'] not in names:
                    names.append(s['st'])
        x['_ix'] = {}
        for n in names:
            if n in x['_strange']:
                key = n + '|' + x['line']
                if key not in ix:
                    ix[key] = len(stations)
                    # **The other place of that name may be findable.** The
                    # clock has just said this is not the 鶴岡 the Manchurian
                    # file has — 1,259 km from 村上 in 119 minutes — and on a
                    # Japanese table it is the 鶴岡 in Yamagata, which the
                    # Japanese station file has and which nothing had thought
                    # to ask. Seven stops came out unplaced for want of this
                    # question: 大橋, 平山, 淸道, 龍門, 鶴山, 永安, 鶴岡.
                    rec = {'n': n, 'li': []}
                    b = beyond_for(n, x['_conn'])
                    if b:
                        rec['lon'], rec['lat'] = b['lon'], b['lat']
                        if b.get('ro'):
                            rec['ro'] = b['ro']
                        rec['_beyond'] = 1
                        conn_placed[b['where']] += 1
                    stations.append(rec)
                i = ix[key]
            else:
                i = station_for(n, x['line'], x['_conn'])
            x['_ix'][n] = i
            if li not in stations[i]['li']:
                stations[i]['li'].append(li)
    for s in stations:
        s['li'].sort()

    # --- the trains
    trains, dropped, misprints = [], 0, []
    for x in tables:
        li = line_ix[x['_name']]
        for t in x['trains']:
            st = []
            last = None
            undo = 0
            for s in t['stops']:
                i = x['_ix'][s['st']]
                fl = 0
                if s.get('reference'):
                    fl |= 1
                if s.get('uncertain'):
                    fl |= 4
                if s['ev'] == 'pass' or not s.get('t'):
                    if s['ev'] == 'pass':
                        fl |= 2
                    if st and st[-1][0] == i:
                        continue
                    st.append([i, None, None, fl] if fl else [i, None, None])
                    continue
                # `t` already runs on past midnight -- 25:12 for 1.12 the next morning -- by
                # the transcription's rule that a time below the one before it is tomorrow's.
                # That rule has no tolerance, so a misprint backwards -- 19.40 then 19.33 on
                # train 15, 12.21 then 9.03 for 13.09 on train 850 -- became most of a day at
                # the platform, and the train crawled between two halts for twenty hours. No
                # train in these tables takes eighteen hours between consecutive timed stops,
                # so a leg that long is read as a misprint: the day is taken back and the stop
                # flagged uncertain. How many, and which, are printed at the end.
                m = minutes(s['t']) - undo
                if last is not None and m - last >= 1080:
                    undo += 1440
                    m -= 1440
                    fl |= 4
                    misprints.append('%s %s %s %s' % (x['_id'], t.get('no', ''), s['st'],
                                                      s.get('printed', '')))
                    # a few minutes backwards is a leg of nothing, which the
                    # animation takes; hours backwards (33.03 for 13.09) is a
                    # figure that cannot be used, so the stop keeps its place in
                    # the column and loses its time
                    if m < last - 60:
                        if st and st[-1][0] == i:
                            continue
                        st.append([i, None, None, fl])
                        continue
                last = m
                if st and st[-1][0] == i and s['ev'] == 'dep' and st[-1][1] is not None \
                        and st[-1][2] is None:
                    st[-1][2] = m                  # the departure joins its arrival
                    if fl and (len(st[-1]) < 4 or not st[-1][3] & fl):
                        if len(st[-1]) < 4:
                            st[-1].append(fl)
                        else:
                            st[-1][3] |= fl
                    continue
                row = [i, m if s['ev'] == 'arr' else None, m if s['ev'] == 'dep' else None]
                if fl:
                    row.append(fl)
                st.append(row)
            timed = [r for r in st if r[1] is not None or r[2] is not None]
            if len(timed) < 2:
                dropped += 1
                continue
            mk = ' '.join(b for b in (t.get('marks', ''), t.get('name', '')) if b)
            rec = {'no': t.get('no', ''), 'li': li, 'dir': 1 if x['_dir'] == 'up' else 0,
                   'cls': t.get('cls', ''), 'dest': t.get('dest', ''), 'st': st}
            if mk:
                rec['mk'] = mk
            trains.append(rec)

    # ------------------------------------------------------------------
    # **ONE TRAIN PER SERVICE, NOT ONE PER PRINTED TABLE.**
    #
    # A through train is printed in every line table it runs over, and read
    # table by table it became that many trains. 341 was four: 濱北線
    # 哈爾濱→綏化, 綏佳線 哈爾濱→神樹, 綏佳線 綏化→佳木斯, and 綏佳線・鶴岡線
    # 蓮江口→佳木斯 — one service, Harbin 23.50 to Chiamussu 22.50 the next
    # day, drawn four times over. Reported as "why are there two train 341s".
    #
    # Worse than the doubling: the copies disagreed about the *day*. The
    # transcription's clock runs on from the top of each column, so a piece
    # that begins in the middle of the journey starts a day early — 綏化 is
    # 06.10 tomorrow in the pieces that start at Harbin and 06.10 today in the
    # one that starts at 綏化. At 08.03 both were on the map, a day apart in
    # the data and a hundred kilometres apart on the ground.
    #
    # So pieces are joined where the timetable itself proves they are one
    # train: the same number, and at a station they share, times that agree
    # **to the minute once whole days are taken out**. That is a strong test —
    # two different trains of the same number would have to call at the same
    # place at the same minute — and it is the same evidence a reader would
    # use with the booklet open. Anything that does not meet it is left alone.
    joined = 0
    by_no = {}
    for t in trains:
        if t.get('no'):
            by_no.setdefault(t['no'], []).append(t)

    def row_time(r):
        return r[1] if r[1] is not None else r[2]

    def shift_of(seed, other):
        """How many whole days `other` is behind `seed`, or None if the two
        share no station at which both are timed and agree."""
        a = {}
        for r in seed['st']:
            if row_time(r) is not None:
                a.setdefault(r[0], r)
        for r in other['st']:
            if r[0] not in a or row_time(r) is None:
                continue
            d = row_time(a[r[0]]) - row_time(r)
            if d % 1440 == 0:
                return d
        return None

    out = []
    for no, pieces in by_no.items():
        if len(pieces) < 2:
            continue
        # the longest piece leads; the rest are offered to it in turn, and a
        # piece that joins can itself bring in a third, so this repeats until
        # nothing more attaches
        pieces.sort(key=lambda t: -len([r for r in t['st'] if row_time(r) is not None]))
        used = set()
        for i, seed in enumerate(pieces):
            if i in used:
                continue
            group = [(seed, 0)]
            used.add(i)
            moved = True
            while moved:
                moved = False
                for j, other in enumerate(pieces):
                    if j in used:
                        continue
                    for member, base in group:
                        d = shift_of(member, other)
                        if d is None:
                            continue
                        group.append((other, base + d))
                        used.add(j)
                        moved = True
                        break
            if len(group) < 2:
                continue
            # **Merged on one clock.** Every row is shifted onto the seed's
            # day, then rows are put in time order and a station seen twice
            # keeps whichever of the arrival and the departure each copy had.
            rows = []
            for piece, d in group:
                last_t = None
                for k, r in enumerate(piece['st']):
                    rr = list(r)
                    if rr[1] is not None:
                        rr[1] += d
                    if rr[2] is not None:
                        rr[2] += d
                    t_here = row_time(rr)
                    if t_here is not None:
                        last_t = t_here
                    # an untimed stop sorts just after the last timed one in
                    # its own column, which is where the page puts it
                    rows.append(((last_t if last_t is not None else -1), k, rr))
            rows.sort(key=lambda x: (x[0], x[1]))
            merged = []
            for _, _, rr in rows:
                if merged and merged[-1][0] == rr[0]:
                    prev = merged[-1]
                    if prev[1] is None:
                        prev[1] = rr[1]
                    if prev[2] is None:
                        prev[2] = rr[2]
                    fl = (rr[3] if len(rr) > 3 else 0)
                    if fl:
                        if len(prev) > 3:
                            prev[3] |= fl
                        else:
                            prev.append(fl)
                    continue
                merged.append(rr)
            keep = dict(group[0][0])
            keep['st'] = merged
            # the line and the direction of the piece that carries most of the
            # journey, which is the one the card should name
            out.append(keep)
            for piece, _ in group:
                piece['_merged'] = True
            joined += len(group) - 1

    # **The columns as the booklet prints them, kept for one purpose.** Which
    # line owns a stretch of track is a fact about the tables — the 濱北線
    # prints the trains between Harbin and Suihua, so that stretch is the
    # 濱北線's — and a merged train has one line where its columns had
    # several. Voting over the merged list handed 341's Harbin end to the
    # 綏佳線 and took two colours off the map. The vote is taken with these.
    columns = [dict(t) for t in trains]
    if out:
        trains = [t for t in trains if not t.get('_merged')] + out
        trains.sort(key=lambda t: (t['li'], t.get('no', '')))
    for t in trains:
        t.pop('_merged', None)

    # --- the line records: colour, readings, anchor, description
    romaji = {s['n']: s.get('ro') for s in stations if s.get('ro')}
    no_ja = []
    for i, l in enumerate(lines):
        n = l['n']
        a, b = ends[n]
        who = lambda p: ('%s (%s)' % (romaji[p], p)) if romaji.get(p) else p
        co = l.pop('co')
        cn = l.pop('cn')
        # **A Korean or Japanese line is not named in pinyin.** `pinyin_name`
        # reads the characters as Chinese, which is right for Manchuria and
        # wrong for 東海道本線. The connection lines take the Japanese reading
        # the booklet itself implies, and where none is named here they keep
        # their characters rather than being given a reading nobody checked.
        if cn:
            l['en'] = CONN_EN.get(n) or _KR_EN.get(n) or n
            ja = CONN_JA.get(n) or _KR_JA.get(n) or CONN_EN.get(n) or ''
        else:
            l['en'] = pinyin_name(n)
            ja = LINE_JA.get(n, '')
        if ja:
            l['ja'] = ja
        else:
            no_ja.append(n)
        l['c'] = PALETTE[i % len(PALETTE)]
        l['a'] = first_table[n]
        # and which of the three dressed pages that anchor is on: `cfg.page`
        # in trains.js is the system's, which is Manchuria's, so a line from
        # one of the other two sections names its own. See `pageOf` there.
        if cn:
            l['pg'] = 'timetable/%s-1942.html' % cn.lower()
        if cn:
            l['x'] = 1
        l['d'] = ('%s: %s to %s.' % (co, who(a), who(b))) if co else ('%s to %s.' % (who(a), who(b)))

    print("  %d table column(s) joined to the through train they belong to"
          % joined)
    bundle = {'year': 1942, 'issued': 'July 1942', 'local': 'Pinyin',
              'lines': lines, 'stations': stations, 'trains': trains, 'paths': {}}
    # every stretch between placed stops is routed along the traced 1942 lines. The station
    # points come from today's stations and a few sit a little off the alignment the trace
    # follows -- 貔子窩 is 2.5 km from it -- so the snap is looser than the default 1.2 km.
    # And the bridge limit is lifted almost entirely: an express on the trunk calls at 奉天
    # and then 新京, 283 km on, and trains.js draws nothing between two stops that far apart
    # with no path, so the leg has to be routed or the express vanishes between its calls.
    # The stretch test is what keeps a long route honest.
    # The trace is one feature per line and its lines cross between vertices, so the crossings
    # are made junctions; and the detour limit is wider than Korea's 1.8 because this is a
    # mountain network -- 灤平 to 古北口 on the 錦古線 is 59 km of railway for a 29.5 km chord,
    # which is the line following the valleys and not the route going round. 2.6 takes that
    # and the 承德 hills; what it still refuses is listed in the build's output.
    # **AND THE TWO NETWORKS BEYOND, WITH THEIR OWN TRACED RAILS.**
    #
    # The connection stretches run over ground the Manchurian trace knows
    # nothing about, so with that file alone `fill` has no rails to walk
    # between two Korean stops and leaves the chord as a straight line. The
    # same Korean and Japanese line files the map itself draws go into the
    # graph — and into the *same* graph, not three separate ones, because the
    # expresses out of Fuzan cross the Yalu at Antung and a train that changes
    # country in the middle of a run has to find a route the whole way.
    #
    # `node_crossings` is Manchuria's alone. It makes a junction wherever two
    # features cross between their vertices, which is right for a trace drawn
    # one line per feature and wrong for a file already traced to share its
    # junctions — see `rail_route.fill`. And the weld is Korea's 80 m, for
    # Japan's N05: 1,977 features that come to 241 separate components, so
    # without it neighbouring stations eight kilometres apart have no path at
    # all between them. Both numbers are argued out in `build_kr_trains.py`.
    ferry_li = {i for n, i in line_ix.items() if '連絡船' in n}
    rail_route.SNAP_KM = 3.0
    routed = rail_route.fill(bundle,
                             [LINES_GEOJSON] + KR_LINES_GEOJSON + [JP_LINES_GEOJSON],
                             'Manchuria 1942',
                             bridge_km=800, stretch=2.6,
                             node_crossings=[LINES_GEOJSON],
                             weld_m=80,
                             # nothing sails along a railway: the Kanmon, Ukō
                             # and Miyajima crossings are left as they are
                             skip_li=ferry_li)

    # **THINNED WHERE IT IS NEW, AND NOWHERE ELSE.**
    #
    # N05 is a modern national dataset and its rails are drawn at a density no
    # map at this scale can show: 長萬部 to 岩見澤 came back as 2,587 points for
    # 214 km of railway, and the bundle went from 460 KB to 7.5 MB — sixteen
    # times, for track the reader cannot tell from a thinner line. The Korean
    # bundle already stores its Japanese connections at 40 m for exactly this
    # reason, which is the tolerance the Japanese layer is *drawn* at, so
    # nothing is lost that was ever going to be seen.
    #
    # **But `fill`'s own `simplify_m` would thin everything**, including
    # Manchuria's hand-traced 1942 lines, which are not a national dataset and
    # are not anybody's to thin. So the thinning is done here, after the fact,
    # and only on a stretch with an end beyond Manchuria. What fraction of the
    # vertices survives is printed, because a tolerance quietly undoing the
    # tracing is the thing this project has been bitten by before.
    BEYOND_TOL_M = 40
    beyond_ix = {i for i, st in enumerate(stations) if st.get('_beyond')}
    before = after = touched = 0
    for k in list(bundle['paths'].keys()):
        lo, hi = (int(v) for v in k.split('|'))
        if lo not in beyond_ix and hi not in beyond_ix:
            continue
        flat = bundle['paths'][k]
        pts = [(flat[j], flat[j + 1]) for j in range(0, len(flat), 2)]
        thin = rail_route._thin(pts, BEYOND_TOL_M)
        before += len(pts)
        after += len(thin)
        touched += 1
        bundle['paths'][k] = [c for q in thin for c in q]
    for st in stations:
        st.pop('_beyond', None)
    head = ("/* Built by tools/build_mn_trains.py -- do not edit.\n"
            " * The July 1942 Manchurian railway timetable: %d trains over %d lines,\n"
            " * calling at %d stations, with the track between consecutive stops\n"
            " * routed along the traced 1942 lines. Source: the transcription in\n"
            " * data/manchuria/timetable/, from the 滿洲・支那汽車時間表 昭和17年7月號.\n"
            " * Stop rows are [station, arrival, departure, flags] in minutes from\n"
            " * midnight, past 1440 meaning the small hours of the next day; flags\n"
            " * are 1 timed on another line, 2 passes without stopping, 4 the\n"
            " * printed reading is uncertain. Path keys are a pair of station\n"
            " * indices, low first, and the coordinates run that way. */\n"
            % (len(trains), len(lines), len(stations)))
    trains_split.write(OUT_JS, OUT_TIMES, 'MN_TRAINS', bundle, head,
                       'Built by tools/build_mn_trains.py -- do not edit.',
                       owns_from=columns)

    # --- the printed page
    reads = {}
    for o in ours:
        if o.get('kana') or o.get('ro'):
            reads[o['han']] = [o.get('kana', ''), o.get('ro', '')]
    pages = []
    for cn, srcname, outname in PAGE_SECTIONS:
        mine = [x for x in tables if x['_conn'] == cn]
        if not mine:
            continue
        n_pg, n_h2, n_dl = dress_html(
            mine, first_table, reads,
            src=os.path.join(TT, 'html', srcname),
            out=os.path.join(SITE, 'timetable', outname))
        pages.append((outname, n_h2, n_pg, n_dl))

    # --- what was done
    placed = sum(1 for s in stations if s.get('lon') is not None)
    with open(LINES_GEOJSON) as fh:
        drawn = {split_line(f['properties'].get('name-zh', ''))[0]
                 for f in json.load(fh)['features']}
    # the file this compares against is Manchuria's own trace, so a connection
    # line is not missing from it — it was never looked for there
    undrawn = [l['n'] for l in lines if l['n'] not in drawn and not l.get('x')]
    pairs = set()
    for t in trains:
        prev = -1
        for r in t['st']:
            if len(r) > 3 and r[3] & 1:
                prev = -1
                continue
            if stations[r[0]].get('lon') is None:
                continue
            if prev >= 0 and prev != r[0]:
                pairs.add((min(prev, r[0]), max(prev, r[0])))
            prev = r[0]
    conn_lines = sum(1 for l in lines if l.get('x'))
    sys.stderr.write('  connections beyond the network: %d lines, %d stops placed from '
                     "Korea's station file and %d from Japan's\n"
                     % (conn_lines, conn_placed['Korea'], conn_placed['Japan']))
    for where in ('Korea', 'Japan'):
        uni, settled, stuck = beyond_report[where]
        sys.stderr.write('    %s: %d name(s) the station file has once, %d of the repeated '
                         'ones settled by their printed neighbours, %d left undecided\n'
                         % (where, uni, settled, stuck))
    for where in ('Korea', 'Japan'):
        if conn_missed[where]:
            sys.stderr.write('  %d %s stop(s) the station file does not have, left unplaced: '
                             '%s\n' % (len(conn_missed[where]), where,
                                        ', '.join(sorted(conn_missed[where]))))
    if touched:
        sys.stderr.write('  %d connection stretch(es) thinned at %d m: %d of %d vertices '
                         'kept (%.0f%%); Manchuria\'s own track untouched\n'
                         % (touched, BEYOND_TOL_M, after, before, 100.0 * after / before))
    sys.stderr.write('mn-trains.js: %d trains, %d lines, %d stations (%d placed, %d not), '
                     '%d stretches between placed stops, %d routed along the drawn railway\n'
                     % (len(trains), len(lines), len(stations), placed, len(stations) - placed,
                        len(pairs), len(routed)))
    if dropped:
        sys.stderr.write('  %d trains dropped for want of two timed stops\n' % dropped)
    if misprints:
        sys.stderr.write('  %d times printed backwards, read as a misprint rather than a day '
                         'and flagged uncertain: %s\n' % (len(misprints), '; '.join(misprints)))
    if no_ja:
        sys.stderr.write('  no Japanese reading for: %s\n' % ', '.join(no_ja))
    if strangers:
        sys.stderr.write('  %d same-named stations left unplaced as another place: %s\n'
                         % (len(strangers), '; '.join(strangers)))
    if undrawn:
        sys.stderr.write('  %d lines not in the traced line file, their trains drawn straight '
                         'between placed stops: %s\n' % (len(undrawn), ', '.join(undrawn)))
    if HIDDEN_LINES:
        sys.stderr.write('  kept off the map until traced: %s\n' % ', '.join(sorted(HIDDEN_LINES)))
    for outname, n_h2, n_pg, n_dl in pages:
        sys.stderr.write('timetable/%s: %d tables, %d page references linked to the scan, '
                         '%d CSV links, %d KB\n'
                         % (outname, n_h2, n_pg, n_dl,
                            os.path.getsize(os.path.join(SITE, 'timetable', outname)) // 1024))
    sys.stderr.write('  %d station readings on all three\n' % len(reads))


if __name__ == '__main__':
    main()
