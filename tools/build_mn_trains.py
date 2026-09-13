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
                                in the compact form trains.js reads
  mn-times.js                   the trains, fetched when the reader asks the timetable a question
  timetable/manchuria-1942.html the printed tables of pages 12 to 53, dressed with a link to the
                                scan for every table, a reading under every station name, and a
                                CSV under every table

WHICH TABLES. The Manchurian section of the booklet, pages 12 to 53: the South Manchuria Railway's
own lines (滿鐵社線), the Manchukuo National Railways (國線) and the three private companies
(其他). The through tables of pages 8 to 11 are not taken -- their trains are the same trains,
printed again with their connections -- and neither are the Korean pages, which the Korea bundle
already carries, nor the bus pages. The 河北・營口 ferry is a table on the page and not a line
here, for the reason Karafuto's crossings are not: nothing sails along a railway.

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

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "deploy")     # what the web server gets; the rest is how it is made
SRC = os.path.join(ROOT, 'data', 'manchuria')
TT = os.path.join(SRC, 'timetable')
JSON_DIR = os.path.join(TT, 'transcription', 'json')
PAGE_SRC = os.path.join(TT, 'html', 'manchuria.html')
LINES_GEOJSON = os.path.join(SRC, 'manchuria-1942-lines.geojson')
OUT_JS = os.path.join(SITE, 'mn-trains.js')
OUT_TIMES = os.path.join(SITE, 'mn-times.js')   # the timetable, fetched on demand
OUT_HTML = os.path.join(SITE, 'timetable', 'manchuria-1942.html')

PAGE_LO, PAGE_HI = 12, 53        # the Manchurian section of the booklet

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
          ('其他 ', ''))

# One table prints two lines end to end and names both; it is one line here.
MERGE = {'綏佳線（佳木斯・蓮江口間）・鶴岡線（蓮江口・鶴岡間）': '綏佳線・鶴岡線'}

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
    """The Manchurian rail tables in page order: (table id, json)."""
    out = []
    for path in sorted(glob.glob(os.path.join(JSON_DIR, 'p*.json'))):
        tid = os.path.basename(path)[:-5]
        m = re.match(r'p(\d+)', tid)
        if not m:
            continue
        page = int(m.group(1))
        if page < PAGE_LO or page > PAGE_HI:
            continue
        with io.open(path, encoding='utf-8') as fh:
            x = json.load(fh)
        if x.get('kind') == 'bus' or x.get('clock') == '12':
            continue
        if x.get('line') in SKIP_LINES or x.get('line') in HIDDEN_LINES:
            continue
        x['_id'] = tid
        x['_page'] = page
        out.append(x)
    # the booklet's own order: by page, then by the letter the table has on it
    out.sort(key=lambda x: (x['_page'], x['_id']))
    return out


def our_stations():
    """mn-stations.js is written one record to a line with a trailing comma, so it is read a
    line at a time rather than as one array."""
    out = []
    for line in io.open(os.path.join(SITE, 'mn-stations.js'), encoding='utf-8'):
        line = line.strip().rstrip(',')
        if line.startswith('{') and line.endswith('}'):
            out.append(json.loads(line))
    return out


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


def dress_html(tables, anchors_by_line, reads):
    """The transcription project's page, with the map's furniture on it.

    Patched here rather than in data/manchuria/timetable/html/manchuria.html because that file is
    the transcription as it was made, and a replacement of it should not have to carry this
    map's furniture. Every substitution is asserted, so a source that has moved on fails the
    build instead of quietly shipping a page missing half of what was asked for.
    """
    html = io.open(PAGE_SRC, encoding='utf-8').read()

    def sub(old, new, what, count=1):
        n = html.count(old)
        if count is not None and n != count:
            raise SystemExit('manchuria.html: %s -- expected %s of %r, found %d'
                             % (what, count, old[:60], n))
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
    if n != len(tables) and n < 100:
        raise SystemExit('manchuria.html: %d page references, expected about %d' % (n, len(tables)))

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
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)
    with io.open(OUT_HTML, 'w', encoding='utf-8', newline='\n') as fh:
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
            lines.append({'n': name, 'co': co})
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
    stations, ix = [], {}
    unmatched = set()

    def station_for(name, line_full):
        cands = by_name.get(name, [])
        o = None
        if len(cands) == 1:
            o = cands[0]
        elif len(cands) > 1:
            here = [c for c in cands if line_full in c['line']]
            o = here[0] if len(here) == 1 else None
        key = name if len(cands) < 2 else name + '|' + line_full
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
    def placed_point(n, line_full):
        cands = by_name.get(n, [])
        if len(cands) == 1:
            return cands[0]
        here = [c for c in cands if line_full in c['line']]
        return here[0] if len(here) == 1 else None

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
                o = placed_point(s['st'], x['line'])
                if o and not (run and run[-1][0] == s['st']):
                    run.append((s['st'], minutes(s['t']), o))
            for (a, ta, pa), (b, tb, pb) in zip(run, run[1:]):
                km = rail_route._km((pa['lon'], pa['lat']), (pb['lon'], pb['lat']))
                if km / (max(1, abs(tb - ta)) / 60.0) <= 150:
                    continue
                for n, o in ((a, pa), (b, pb)):
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
                    stations.append({'n': n, 'li': []})
                i = ix[key]
            else:
                i = station_for(n, x['line'])
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

    # --- the line records: colour, readings, anchor, description
    romaji = {s['n']: s.get('ro') for s in stations if s.get('ro')}
    no_ja = []
    for i, l in enumerate(lines):
        n = l['n']
        a, b = ends[n]
        who = lambda p: ('%s (%s)' % (romaji[p], p)) if romaji.get(p) else p
        co = l.pop('co')
        l['en'] = pinyin_name(n)
        if n in LINE_JA:
            l['ja'] = LINE_JA[n]
        else:
            no_ja.append(n)
        l['c'] = PALETTE[i % len(PALETTE)]
        l['a'] = first_table[n]
        l['d'] = ('%s: %s to %s.' % (co, who(a), who(b))) if co else ('%s to %s.' % (who(a), who(b)))

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
    rail_route.SNAP_KM = 3.0
    routed = rail_route.fill(bundle, [LINES_GEOJSON], 'Manchuria 1942',
                             bridge_km=800, stretch=2.6, node_crossings=True)
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
                       'Built by tools/build_mn_trains.py -- do not edit.')

    # --- the printed page
    reads = {}
    for o in ours:
        if o.get('kana') or o.get('ro'):
            reads[o['han']] = [o.get('kana', ''), o.get('ro', '')]
    n_pg, n_h2, n_dl = dress_html(tables, first_table, reads)

    # --- what was done
    placed = sum(1 for s in stations if s.get('lon') is not None)
    with open(LINES_GEOJSON) as fh:
        drawn = {split_line(f['properties'].get('name-zh', ''))[0]
                 for f in json.load(fh)['features']}
    undrawn = [l['n'] for l in lines if l['n'] not in drawn]
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
    sys.stderr.write('timetable/manchuria-1942.html: %d tables, %d page references linked to '
                     'the scan, %d CSV links, %d station readings, %d KB\n'
                     % (n_h2, n_pg, n_dl, len(reads), os.path.getsize(OUT_HTML) // 1024))


if __name__ == '__main__':
    main()
