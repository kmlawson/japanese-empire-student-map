#!/usr/bin/env python3
"""Korea's colonial railway stations: two geojsons turned into one table.

    python3 tools/build_kr_stations.py            # rewrite data/korea/stations.csv
    python3 tools/build_kr_stations.py --report   # what is missing a name

The source is the NIKH historical GIS of Korean railways, checked by 김종혁 --
`tools/cache/korea_1930_stations.geojson` and `korea_1942_stations.geojson`,
919 points each in WGS84.

UNLIKE TAIWAN'S, THIS TABLE NEEDS NO RESEARCH. The source already carries four
names for every station: the hangul, the hanja, a McCune-Reischauer
romanisation and the Japanese reading. Taiwan's needed a reading found one at a
time because its geojson had none and the characters do not give it; here the
work has been done by the people who built the database, and this script's job
is to carry it across without damage rather than to add to it.

THE TWO FILES ARE THE SAME 919 STATIONS. They differ in one thing: a station
that did not exist at that date has a **null geometry** rather than being
absent from the file. That is how each epoch's set is worked out -- 283 of them
are null in 1930 and 1 in both, so the 1930 map draws 636 stations and the 1942
map 918.

`id_lines` is the line the station stood on, in Korean. It is carried through
as the short line the card opens with, which for most of these is the only
thing that can be said about them without somebody writing 900 paragraphs.

A JUNCTION IS IN THE SOURCE ONCE PER LINE, at the same coordinate under a
different `st_id` -- Iri is there three times, on the Honam, the Jeolla and the
Gunsan. Drawn as they arrive that is three squares stacked on one spot and the
same name lettered three times over, which is what the map did. They are merged
here into one station that knows all its lines, which is both one square and a
better sentence: not "a station on the Honam line" but "a junction where three
lines met". 51 groups, 115 rows, 918 stations down to 854.
"""
import csv
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = {"e1930": os.path.join(HERE, "cache", "korea_1930_stations.geojson"),
       "e1942": os.path.join(HERE, "cache", "korea_1942_stations.geojson")}
OUT = os.path.join(ROOT, "data", "korea", "stations.csv")

FIELDS = ["id", "hangul", "hanja", "mr", "romaji", "line", "lon", "lat",
          "e1930", "e1942", "prov", "note"]

# Columns this build does not produce and must never drop -- the same rule as
# the Taiwan table, learned there the expensive way.
KEPT = ["note"]

BLANK = ("", "-", "<none>", "0", "None")


def clean(v):
    v = ("" if v is None else str(v)).strip()
    return "" if v in BLANK else v


# The line names, in the Korean the source writes them and in English. Only the
# lines that carry stations are here; anything unlisted falls back to the
# Korean, which is true if not helpful, and shows up in --report.
LINES = {
    "경부선": "Gyeongbu line (Keifu, Seoul–Pusan)",
    "경의선": "Gyeongui line (Keigi, Seoul–Sinuiju)",
    "경인선": "Gyeongin line (Keijin, Seoul–Inchon)",
    "경원선": "Gyeongwon line (Keigen, Seoul–Wonsan)",
    "함경선": "Hamgyong line (Kankyō, the north-east coast)",
    "호남선": "Honam line (Konan, the south-west)",
    "전라선": "Jeolla line (Zenra, the south-west)",
    "만포선": "Manpo line (Mampo, up the Yalu)",
    "북선": "Northern lines",
    "평원선": "Pyongwon line (Heigen, Pyongyang–Wonsan)",
    "중앙선": "Central line (Chūō)",
    "동해선": "East Sea line (Tōkai)",
    "황해선": "Hwanghae line (Kōkai)",
    "경전선": "Gyeongjeon line (Keiden)",
    "장항선": "Janghang line (Chōkō)",
    "안봉선": "Antung–Mukden line",
    "혜산선": "Hyesan line (Keizan)",
    "백무선": "Paengmu line (Hakumu)",
    "평북선": "North Pyongan line (Heihoku)",
    "개천선": "Kaechon line (Kaisen)",
    "송흥선": "Songhung line (Shōkō)",
    "차량선": "Charyang line",
    "금강산선": "Kumgangsan line (Kongōsan, to the Diamond Mountains)",
    # The rest, in the same order of size. Where the compound says plainly
    # what it is -- 남부 southern, 북부 northern, 중부 central, 탄광 colliery --
    # that is said in English; where the name is only a place name it is left
    # as a place name. Nothing here is a guess about what a line *did*.
    "동해남부선": "East Sea line (southern section)",
    "동해북부선": "East Sea line (northern section)",
    "동해중부선": "East Sea line (central section)",
    "경전남부선": "Gyeongjeon line (southern section)",
    "경경남부선": "Gyeonggyeong line (southern section)",
    "경경북부선": "Gyeonggyeong line (northern section)",
    "장진선": "Jangjin line (Chōshin)",
    "사장선": "Sajang line",
    "수려선": "Suryeo line (Suwon–Yeoju)",
    "경북선": "North Gyeongsang line (Keihoku)",
    "토해선": "Tohae line",
    "충북선": "North Chungcheong line (Chūhoku)",
    "경기선": "Gyeonggi line (Keiki)",
    "옹진선": "Ongjin line (Yōshin)",
    "수인선": "Suin line (Suwon–Incheon)",
    "삼척철도선": "Samcheok Railway Company line",
    "삼척선": "Samcheok line (Sanchoku)",
    "단풍선": "Danpung line",
    "평남선": "South Pyongan line (Heinan)",
    "평안선": "Pyongan line (Heian)",
    "함북선": "North Hamgyong line (Kanhoku)",
    "경춘선": "Gyeongchun line (Seoul–Chuncheon)",
    "평양탄광선": "Pyongyang colliery line",
    "회령탄광선": "Hoeryong colliery line",
    "다사도선": "Dasado line",
    "겸이포선": "Gyeomipo line (Kenipo)",
    "광주선": "Gwangju line (Kōshū)",
    "군산선": "Gunsan line (Gunzan)",
    "박천선": "Bakcheon line (Hakusen)",
    "북청선": "Bukcheong line (Hokusei)",
    "용등선": "Yongdeung line",
    "장지리선": "Jangjiri line",
    "진해선": "Jinhae line (Chinkai)",
    "철산차호선": "Cheolsan–Chaho line",
    "해주선": "Haeju line (Kaishū)",
    "황해청년선": "Hwanghae line",
    "서선중앙철도": "West Korea Central Railway",
    "북선철식철도": "Northern Korea Development Railway",
    "아오선": "Ao line",
}

# The thirteen provinces, for the ground each station stood on. The polygons
# are `tools/cache/korea_13_provinces.json` and their `shapeName` is already
# this project's own key for the province -- Keiki, Kōgen, Chūseihoku -- so
# what a province is *called* is read from texts/ and not from the cache.
PROVS = os.path.join(HERE, "cache", "korea_13_provinces.json")
NAMES = os.path.join(ROOT, "texts", "territories", "sub-units", "korea.csv")


def in_ring(x, y, ring):
    inside = False
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i][0], ring[i][1]
        x1, y1 = ring[(i + 1) % n][0], ring[(i + 1) % n][1]
        if (y0 > y) != (y1 > y):
            if x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
                inside = not inside
    return inside


def in_feature(x, y, geom):
    t = geom.get("type")
    polys = [geom["coordinates"]] if t == "Polygon" else geom.get("coordinates", [])
    for poly in polys:
        if poly and in_ring(x, y, poly[0]) and not any(in_ring(x, y, h) for h in poly[1:]):
            return True
    return False


def load_provinces():
    feats = json.load(io.open(PROVS, encoding="utf-8"))["features"]
    names = {}
    with io.open(NAMES, encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            en = row["en"]
            cut = en.find(" (")
            names[row["key"]] = (en[:cut] if cut > 0 else en).strip()
    return feats, names


def province(lon, lat, feats, names):
    for f in feats:
        if in_feature(lon, lat, f["geometry"]):
            key = f["properties"]["shapeName"]
            return names.get(key, key)
    return ""


def load():
    """id -> record, and the set of ids that are real at each date."""
    recs = {}
    live = {}
    for ep, path in SRC.items():
        here = set()
        with io.open(path, encoding="utf-8") as fh:
            for feat in json.load(fh)["features"]:
                p = feat["properties"]
                sid = clean(p.get("st_id"))
                if not sid:
                    continue
                g = feat.get("geometry")
                if g and g.get("coordinates"):
                    here.add(sid)
                    lon, lat = g["coordinates"][0], g["coordinates"][1]
                else:
                    lon = lat = None
                old = recs.get(sid)
                if old is None:
                    recs[sid] = {"id": sid,
                                 "hangul": clean(p.get("st_nm_kr")),
                                 "hanja": clean(p.get("st_nm_kj")),
                                 "mr": clean(p.get("st_nm_mr")),
                                 "romaji": clean(p.get("st_nm_rmj")),
                                 "line": clean(p.get("id_lines")),
                                 "lon": lon, "lat": lat}
                elif old["lon"] is None and lon is not None:
                    old["lon"], old["lat"] = lon, lat
        live[ep] = here
    return recs, live


def merge_junctions(recs, live):
    """One record per name and place, carrying every line that met there.

    Keyed on the name and the rounded position rather than on the position
    alone: two different stations a few metres apart are two stations, and the
    same name at the same coordinate is one station listed twice.
    """
    # Same name, and close enough that it cannot be a second station. The
    # source's copies of one junction sit 11m to 92m apart -- Taejon, Taegu,
    # Yongsan, Kyongju are all in that band -- so 300m is well clear of the
    # widest of them and nowhere near the distance between two real stations
    # that happen to share a name.
    SAME = 0.0027                     # degrees, about 300m at this latitude
    groups = {}
    order = []
    for sid in sorted(recs):
        r = recs[sid]
        if r["lon"] is None:
            continue
        key = None
        for k in order:
            g0 = groups[k]
            if g0["hangul"] != r["hangul"]:
                continue
            if (abs(g0["lon"] - r["lon"]) < SAME
                    and abs(g0["lat"] - r["lat"]) < SAME):
                key = k
                break
        if key is None:
            key = sid
            groups[key] = dict(r)
            groups[key]["lines"] = []
            groups[key]["ids"] = []
            order.append(key)
        g = groups[key]
        if r["line"] and r["line"] not in g["lines"]:
            g["lines"].append(r["line"])
        g["ids"].append(sid)
        # the merged station stands at a date if any of its rows does
        for ep in live:
            if sid in live[ep]:
                live[ep].add(g["id"])
    return [groups[k] for k in order]


def main():
    report = "--report" in sys.argv
    recs, live = load()
    pfeats, pnames = load_provinces()
    held = {}
    if os.path.exists(OUT):
        with io.open(OUT, encoding="utf-8", newline="") as fh:
            for old in csv.DictReader(fh):
                if old.get("id"):
                    held[old["id"]] = old
    placeless = [sid for sid in sorted(recs) if recs[sid]["lon"] is None]
    merged = merge_junctions(recs, live)
    rows = []
    for r in merged:
        sid = r["id"]
        was = held.get(sid) or {}
        rows.append({
            "id": sid,
            "hangul": r["hangul"], "hanja": r["hanja"],
            "mr": r["mr"], "romaji": r["romaji"],
            "line": " / ".join(r["lines"]),
            "lon": "%.5f" % r["lon"], "lat": "%.5f" % r["lat"],
            "e1930": "1" if sid in live["e1930"] else "",
            "e1942": "1" if sid in live["e1942"] else "",
            "prov": province(r["lon"], r["lat"], pfeats, pnames),
            "note": was.get("note", ""),
        })
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with io.open(OUT, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    write_js(rows)
    junctions = sum(1 for r in merged if len(r["lines"]) > 1)
    sys.stderr.write(
        "%s: %d stations, %d on the 1930 map, %d on the 1942 map; "
        "%d junctions merged from %d rows\n"
        % (os.path.relpath(OUT, ROOT), len(rows),
           sum(1 for r in rows if r["e1930"]), sum(1 for r in rows if r["e1942"]),
           junctions, sum(len(r["ids"]) for r in merged if len(r["ids"]) > 1)))
    if placeless:
        sys.stderr.write("  %d with no position in either file: %s\n"
                         % (len(placeless), " ".join(placeless)))
    missing = [r for r in rows if not (r["mr"] and r["romaji"])]
    if missing:
        sys.stderr.write("  %d without both romanisations\n" % len(missing))
    noprov = [r for r in rows if not r["prov"]]
    if noprov:
        sys.stderr.write("  %d outside every province polygon\n" % len(noprov))
    if report:
        unknown = sorted(set(r["line"] for r in rows if r["line"] not in LINES))
        sys.stderr.write("  lines with no English name (%d): %s\n"
                         % (len(unknown), " ".join(unknown)))
    return rows


def write_js(rows):
    """The same table as a script the page loads, one object per station.

    Only what the map draws. `e` is the epochs it existed in, so that one file
    serves both dates and map.js filters rather than loading two.
    """
    out = []
    for r in rows:
        o = {"id": r["id"], "han": r["hanja"], "kr": r["hangul"],
             "mr": r["mr"], "ro": r["romaji"],
             "lon": float(r["lon"]), "lat": float(r["lat"]),
             "e": ("30" if r["e1930"] else "") + ("42" if r["e1942"] else "")}
        names = [LINES.get(k, k) for k in (r["line"] or "").split(" / ") if k]
        if r["line"]:
            o["line"] = r["line"]
        if len(names) > 1:
            # A junction says so, and names what met there. `Honam line
            # (Konan, the south-west)` is a mouthful three times over, so in a
            # list the bracket goes and the word `line` is said once at the
            # end: "where the Honam, Jeolla and Gunsan lines met". Everything
            # after the first bracket is a gloss or a section, and two
            # sections of one line meeting is still one name.
            bare = []
            for n in names:
                b = n.split(" (")[0]
                if b not in bare:
                    bare.append(b)
            if len(bare) == 1:
                head = "A junction on the " + bare[0]
            else:
                # Each name in full and its own article. Factoring the word
                # `line` out to the end read badly the moment the list held
                # something that is not one -- "the Northern Korea Development
                # Railway and North Hamgyong lines" makes the company a line.
                head = ("A junction of the " + ", the ".join(bare[:-1])
                        + " and the " + bare[-1])
        elif names:
            head = "A station on the " + names[0]
        else:
            head = "A station"
        if r.get("prov"):
            head += ", in " + r["prov"]
        o["short"] = head + "."
        if r.get("note"):
            o["note"] = r["note"]
        out.append(o)
    path = os.path.join(ROOT, "kr-stations.js")
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("/* Built by tools/build_kr_stations.py -- do not edit.\n"
                 " * Korea's colonial railway stations: %d of them, named in\n"
                 " * hangul, in hanja, in McCune-Reischauer and in the Japanese\n"
                 " * reading -- all four from the source, none of them guessed.\n"
                 " * `e` says which of the two dates each stood at. */\n" % len(out))
        fh.write("window.JMAP = window.JMAP || {};\n")
        fh.write("JMAP.KR_STATIONS = [\n")
        for o in out:
            fh.write("  %s,\n" % json.dumps(o, ensure_ascii=False, sort_keys=True))
        fh.write("];\n")
    sys.stderr.write("kr-stations.js: %d stations, %d in 1930, %d in 1942\n"
                     % (len(out), sum(1 for o in out if "30" in o["e"]),
                        sum(1 for o in out if "42" in o["e"])))


main()
