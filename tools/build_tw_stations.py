#!/usr/bin/env python3
"""Taiwan's colonial railway stations: the geojson turned into a table.

    python3 tools/build_tw_stations.py            # rewrite data/taiwan/stations.csv
    python3 tools/build_tw_stations.py --report   # what is still unverified

The source is `tools/cache/taiwan_1930_station_names_v1.geojson`, 199 points in
TWD97 / TM2 zone 121 (EPSG:3826), carrying the station name in hanji and, for
some of them, a romanisation.

WHAT THIS DOES NOT DO IS GUESS A JAPANESE READING. A large share of these
names are ateji -- characters picked to carry an Amis, Puyuma, Paiwan or
Hokkien sound, whose readings have nothing to do with the characters'
Sino-Japanese values. 萬里橋 is Maribashi and not Banrikyō; 鹿野 is Shikano
and not Kano; 名間 is Nama; 車籠埔 is Sharampo; 北絲鬮 is Pashikō, from the
Puyuma Pashikau. Others are deliberate Japanese coinages from the 1917 and
1937 renaming waves -- Yoshino, Toyoda, Kotobuki, Yamato, Mizuho, Mikasa,
Suehiro, Shirakawa -- and those do take ordinary readings. Nothing about the
characters says which class a name is in, so every reading needs a source,
and a row with no reading and `unverified` against it is a correct result
where a plausible-looking one is not.

`confidence` is one of:
    verified    a source states the reading, in kana or in romaji
    inferred    a Japanese coinage with a source for the name, not the reading
    unverified  everything else, including what arrived in the geojson

The pinyin is this project's own, written out with tone marks to match the
rest of the map's Chinese names.
"""
import csv
import io
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "cache", "taiwan_1930_station_names_v1.geojson")
OUT = os.path.join(ROOT, "data", "taiwan", "stations.csv")

FIELDS = ["id", "hanji", "pinyin", "romaji", "kana", "kind", "lon", "lat",
          "confidence", "source_type", "source_url",
          "valid_from", "valid_to", "alt_names", "note",
          "district", "district_kanji", "shu", "short"]

# Columns this build does not produce and must never drop. `district`, `shu`
# and `short` are written by tools/station_districts.py out of the district
# sheet; `note` is hand-written prose for the twenty-odd stations that carry
# one. None of it is in the geojson, so a rebuild that reads only the geojson
# deletes it -- which is exactly what happened to 46 readings once already.
KEPT = ["romaji", "kana", "confidence", "source_type", "source_url",
        "alt_names", "note", "district", "district_kanji", "shu", "short"]

# What follows a station's name on the sheet, and what it says about the stop.
KINDS = {"驛": "station", "繹": "station",       # 繹 is a scanning slip for 驛
         "乘降場": "halt", "假乘降場": "temporary halt", "停車場": "yard"}

# EPSG:3826 -> lon/lat. Transverse Mercator on GRS80, and the inverse is
# written out here rather than pulled in, because the only dependency this
# build has ever had is the standard library.
A = 6378137.0
F = 1 / 298.257222101
K0, LON0, FE, FN = 0.9999, 121.0, 250000.0, 0.0


def to_lonlat(x, y):
    e2 = F * (2 - F)
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    m = (y - FN) / K0
    mu = m / (A * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256))
    p = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
         + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
         + (151 * e1 ** 3 / 96) * math.sin(6 * mu)
         + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))
    ep2 = e2 / (1 - e2)
    c1 = ep2 * math.cos(p) ** 2
    t1 = math.tan(p) ** 2
    n1 = A / math.sqrt(1 - e2 * math.sin(p) ** 2)
    r1 = A * (1 - e2) / (1 - e2 * math.sin(p) ** 2) ** 1.5
    d = (x - FE) / (n1 * K0)
    lat = p - (n1 * math.tan(p) / r1) * (
        d ** 2 / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2
           - 3 * c1 ** 2) * d ** 6 / 720)
    lon = math.radians(LON0) + (
        d - (1 + 2 * t1 + c1) * d ** 3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2)
        * d ** 5 / 120) / math.cos(p)
    return math.degrees(lon), math.degrees(lat)


def load_pinyin():
    path = os.path.join(HERE, "tw_station_pinyin.tsv")
    out = {}
    with io.open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            han, py = line.split("\t")
            out[han] = py
    return out


def split_name(raw):
    """The name, and what kind of stop it was."""
    raw = (raw or "").strip()
    # A stray Latin letter in one record: 番子l田 for 番子田. Left in the
    # source, taken out here, and said out loud rather than fixed silently.
    cleaned = re.sub(r"[A-Za-z]", "", raw)
    # longest first: 南港假乘降場 is a temporary halt, and matching 乘降場
    # before 假乘降場 leaves the 假 stuck on the front of the name
    for suffix in sorted(KINDS, key=len, reverse=True):
        kind = KINDS[suffix]
        if cleaned.endswith(suffix):
            return cleaned[:-len(suffix)], kind, cleaned != raw
    return cleaned, "", cleaned != raw


# ---------------------------------------------------------------------------
# STATIONS THE GEOJSON DOES NOT HAVE.
#
# The source sheet has 199 stops. The February 1936 timetable calls at 34 that
# are not among them -- the north-east corner of the Yilan line almost
# entirely, and a scatter of halts elsewhere -- so a reader with the train
# tools open saw trains stop at nothing. These are those, with a position and,
# where a source states one, a reading.
#
# THE TIMETABLE'S OWN ROMANISATION IS NOT USED AS A READING. It is a good field
# and it is not a field of readings: it carries the reading of whatever the
# stop was called when the romaniser met it. 四腳亭 is given there as Taikōho
# and reads しきゃくてい; 澳底 is given as Ōtei and reads あおぞこ; 瑞芳 is
# given as Ryūtanto, which is 龍潭堵, a name this station never had -- it
# opened as 瑞芳驛 on 5 May 1919. Three wrong in eight is not a rate to import
# at. Every reading below is from the Japanese or Chinese Wikipedia article on
# the station, which quotes the opening notice, and the two with no reading in
# any of them are left blank: the map shows the characters, which is what it
# does everywhere else a reading is unsourced.
#
# The positions are the same: from those articles where there is one, and from
# the timetable's own geocoding otherwise. That geocoding can be trusted for a
# position even though its romanisation cannot -- for the 153 stations it
# shares with this table the two agree to within a metre.
EXTRA = [
    # hanji, pinyin, romaji, kana, kind, lon, lat, confidence, source
    ("四腳亭", "Sìjiǎotíng", "Shikyakutei", "しきゃくてい", "station",
     121.76119, 25.10288, "verified",
     "https://ja.wikipedia.org/wiki/四脚亭駅"),
    ("瑞芳", "Ruìfāng", "", "", "station",
     121.80636, 25.10875, "unverified",
     "https://ja.wikipedia.org/wiki/瑞芳駅"),
    ("猴硐", "Hóudòng", "Kōdō", "こうどう", "station",
     121.82769, 25.08722, "verified",
     "https://ja.wikipedia.org/wiki/侯硐駅"),
    ("三貂嶺", "Sāndiāolǐng", "Sanchōrei", "さんちょうれい", "station",
     121.82264, 25.06592, "verified",
     "https://ja.wikipedia.org/wiki/三貂嶺駅"),
    ("武丹坑", "Wǔdānkēng", "Butankō", "ぶたんこう", "station",
     121.85189, 25.05856, "verified",
     "https://ja.wikipedia.org/wiki/牡丹駅_(新北市)"),
    ("頂雙溪", "Dǐngshuāngxī", "Chōsōkei", "ちょうそうけい", "station",
     121.86661, 25.03878, "verified",
     "https://ja.wikipedia.org/wiki/双渓駅"),
    ("貢寮庄", "Gòngliáozhuāng", "Kōryōshō", "こうりょうしょう", "station",
     121.90867, 25.02206, "verified",
     "https://ja.wikipedia.org/wiki/貢寮駅"),
    ("澳底", "Àodǐ", "Aozoko", "あおぞこ", "station",
     121.94486, 25.01594, "verified",
     "https://ja.wikipedia.org/wiki/福隆駅"),
    ("四結", "Sìjié", "", "", "halt",
     121.76277, 24.78632, "unverified",
     "https://zh.wikipedia.org/wiki/四城車站"),
    # and the five elsewhere that the timetable can place
    ("鼻子頭", "Bízitóu", "", "", "station", 120.62885, 23.83188, "unverified", ""),
    ("竹北", "Zhúběi", "", "", "station", 121.00437, 24.83905, "unverified", ""),
    ("汐止", "Xīzhǐ", "", "", "station", 121.65312, 25.06429, "unverified", ""),
    ("后里", "Hòulǐ", "", "", "station", 120.71173, 24.30935, "unverified", ""),
    ("宮ノ下", "", "Miyanoshita", "みやのした", "station",
     121.50278, 25.11667, "inferred", ""),
]


def extra_rows(start_id):
    """The hand-added stops, in the same shape the geojson ones come out in."""
    out = []
    for i, e in enumerate(EXTRA):
        han, py, romaji, kana, kind, lon, lat, conf, url = e
        out.append({
            "id": "tws%03d" % (start_id + i),
            "hanji": han, "pinyin": py, "romaji": romaji, "kana": kana,
            "kind": kind, "lon": "%.5f" % lon, "lat": "%.5f" % lat,
            "confidence": conf,
            "source_type": "wikipedia" if url else "timetable",
            "source_url": url,
            "valid_from": "", "valid_to": "", "alt_names": "", "note": "",
            "district": "", "district_kanji": "", "shu": "", "short": "",
        })
    return out


def build():
    with io.open(SRC, encoding="utf-8") as fh:
        fc = json.load(fh)
    py = load_pinyin()
    # WHAT HAS ALREADY BEEN LOOKED UP IS NOT THROWN AWAY. This rebuilds the
    # table from the geojson, and the readings are not in the geojson -- they
    # are hours of somebody reading sources. The first version rewrote the
    # file from scratch and took 46 of them out in one run. Keyed on the name
    # rather than the row: a row number is only true of one version of a file.
    held = {}
    if os.path.exists(OUT):
        with io.open(OUT, encoding="utf-8", newline="") as fh:
            for old in csv.DictReader(fh):
                # Every row, not only the ones with a reading. Keying on
                # `romaji` meant a station with a note and no reading -- and
                # most of the ones with notes have no reading -- was not held
                # at all, so the prose went out with the rebuild.
                #
                # And keyed on the id where there is no name to key on. Eight
                # of these have a romanisation and no characters, so they all
                # answered to the empty string, collided with each other, and
                # came out of the rebuild with whichever one was read last --
                # which is how they lost the line saying where they stood.
                held[old.get("hanji") or old.get("id")] = old
    rows, missing, repaired = [], [], []
    for feat in fc["features"]:
        p = feat["properties"]
        han, kind, fixed = split_name(p.get("NOTE"))
        sid = "tws%03d" % int(p.get("fid") or 0)
        was = held.get(han) or held.get(sid) or {}
        romaji = (was.get("romaji") or p.get("ROMAJI") or "").strip()
        x, y = feat["geometry"]["coordinates"]
        lon, lat = to_lonlat(x, y)
        if han and han not in py:
            missing.append(han)
        if fixed:
            repaired.append((p.get("NOTE"), han))
        rows.append({
            "id": sid,
            "hanji": han,
            "pinyin": py.get(han, ""),
            "romaji": romaji,
            "kana": was.get("kana", ""),
            "kind": kind,
            "lon": "%.5f" % lon,
            "lat": "%.5f" % lat,
            # The romanisations that arrived in the geojson were checked by
            # hand by the author, one at a time, which is a source -- and a
            # better one than most of what is on the web for these names.
            # Anything without one starts unverified and stays that way until
            # something is written beside it.
            "confidence": was.get("confidence") or
                          ("verified" if romaji else "unverified"),
            "source_type": was.get("source_type") or
                           ("author" if romaji else ""),
            "source_url": was.get("source_url", ""),
            "valid_from": str(p.get("START") or ""),
            "valid_to": str(p.get("END") or ""),
            "alt_names": was.get("alt_names", ""),
            # The geojson's own Comments field seeds this and nothing more:
            # once anything has been written here by hand it wins, because it
            # is the thing that cannot be rebuilt.
            "note": was.get("note") or (p.get("Comments") or "").strip(),
            "district": was.get("district", ""),
            "district_kanji": was.get("district_kanji", ""),
            "shu": was.get("shu", ""),
            "short": was.get("short", ""),
        })
    # The stops the geojson does not have. Added after the loop above rather
    # than inside it, and merged the same way as everything else: whatever is
    # already in the CSV for one of these names wins, so a reading looked up
    # later is not overwritten by the table in this file on the next rebuild.
    have = {r["hanji"] for r in rows if r["hanji"]}
    for row in extra_rows(len(rows) + 1):
        if row["hanji"] in have:
            continue
        was = held.get(row["hanji"]) or {}
        for col in KEPT:
            if was.get(col):
                row[col] = was[col]
        if not row["pinyin"]:
            row["pinyin"] = py.get(row["hanji"], "")
        rows.append(row)
    rows.sort(key=lambda r: r["id"])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with io.open(OUT, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    write_js(rows)
    named = [r for r in rows if r["hanji"]]
    sys.stderr.write(
        "%s: %d stations, %d named, %d with pinyin, %d with a romanisation\n"
        % (os.path.relpath(OUT, ROOT), len(rows), len(named),
           sum(1 for r in rows if r["pinyin"]),
           sum(1 for r in rows if r["romaji"])))
    if repaired:
        sys.stderr.write("  repaired %d name(s) from the source: %s\n"
                         % (len(repaired), ", ".join("%s -> %s" % t for t in repaired)))
    if missing:
        sys.stderr.write("  NO PINYIN for %d: %s\n"
                         % (len(missing), " ".join(sorted(set(missing)))))
    return rows


def write_js(rows):
    """The same table as a script the page loads, one object per station.

    Only what the map draws: the name in three forms, where it is, and what
    kind of stop it was. The sources and the confidence stay in the CSV, which
    is where the work of checking them happens.
    """
    out = []
    for r in rows:
        # A NAME OF ANY KIND IS ENOUGH TO BE DRAWN. Eight stations on the
        # Giran line -- Sekijōshi, Ōtei, Kōryosho, Chō-sōkei, Butankō,
        # Sanshōrei, Ryūtanto, Taikōho -- reach the geojson with a romanisation
        # in ROMAJI and nothing in NOTE, so they have no characters and no
        # pinyin. This used to skip them, and eight stops on the north-east
        # coast simply were not on the map: no square, nothing to point at, and
        # no way to find out they were missing except by knowing the line.
        #
        # A name that is only a romanisation is still a name. What is not known
        # about them is left empty, and the map shows what there is.
        if not (r["hanji"] or r["romaji"] or r["pinyin"]):
            continue
        o = {"id": r["id"], "han": r["hanji"], "py": r["pinyin"],
             "ro": r["romaji"], "kind": r["kind"] or "station",
             "lon": float(r["lon"]), "lat": float(r["lat"])}
        # What the card says. `short` is the ground it stood on and every
        # station has one; `note` is prose and only the key stations do.
        if r.get("kana"):
            o["kana"] = r["kana"]
        if r.get("short"):
            o["short"] = r["short"]
        if r.get("note"):
            o["note"] = r["note"]
        if r.get("source_url"):
            o["wiki"] = r["source_url"]
        # Two of them are dated: one closed in 1941 and one opened in 1939.
        # The card has a line for it and it would otherwise go unsaid.
        if r.get("valid_from") or r.get("valid_to"):
            o["when"] = ("from " + r["valid_from"] if r.get("valid_from")
                         else "until " + r["valid_to"])
        out.append(o)
    path = os.path.join(ROOT, "tw-stations.js")
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("/* Built by tools/build_tw_stations.py -- do not edit.\n"
                 " * Taiwan's colonial railway stations: %d of them, named in\n"
                 " * hanji, in Pinyin, and in Japanese where a source gives the\n"
                 " * reading. `ro` is empty where none does, and the map shows\n"
                 " * the hanji rather than a guess. */\n" % len(out))
        fh.write("window.JMAP = window.JMAP || {};\n")
        fh.write("JMAP.TW_STATIONS = [\n")
        for o in out:
            fh.write("  %s,\n" % json.dumps(o, ensure_ascii=False,
                                             sort_keys=True))
        fh.write("];\n")
    sys.stderr.write("tw-stations.js: %d stations, %d with a reading, "
                     "%d with characters, %d with a short line, %d with a "
                     "note\n"
                     % (len(out), sum(1 for o in out if o["ro"]),
                        sum(1 for o in out if o["han"]),
                        sum(1 for o in out if o.get("short")),
                        sum(1 for o in out if o.get("note"))))


def report(rows):
    need = [r for r in rows if r["hanji"] and r["confidence"] != "verified"]
    sys.stderr.write("\n%d of %d stations have no verified Japanese reading.\n"
                     % (len(need), len([r for r in rows if r["hanji"]])))
    have = [r for r in need if r["romaji"]]
    none = [r for r in need if not r["romaji"]]
    sys.stderr.write("  %d carry a romanisation from the source, unchecked\n"
                     % len(have))
    sys.stderr.write("  %d have none at all:\n    %s\n"
                     % (len(none), " ".join(r["hanji"] for r in none)))


if __name__ == "__main__":
    _rows = build()
    if "--report" in sys.argv:
        report(_rows)
