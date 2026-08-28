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
          "valid_from", "valid_to", "alt_names", "note"]

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
                if old.get("hanji") and old.get("romaji"):
                    held[old["hanji"]] = old
    rows, missing, repaired = [], [], []
    for feat in fc["features"]:
        p = feat["properties"]
        han, kind, fixed = split_name(p.get("NOTE"))
        was = held.get(han) or {}
        romaji = (was.get("romaji") or p.get("ROMAJI") or "").strip()
        x, y = feat["geometry"]["coordinates"]
        lon, lat = to_lonlat(x, y)
        if han and han not in py:
            missing.append(han)
        if fixed:
            repaired.append((p.get("NOTE"), han))
        rows.append({
            "id": "tws%03d" % int(p.get("fid") or 0),
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
            "note": (p.get("Comments") or "").strip(),
        })
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
        if not r["hanji"]:
            continue
        out.append({"id": r["id"], "han": r["hanji"], "py": r["pinyin"],
                    "ro": r["romaji"], "kind": r["kind"],
                    "lon": float(r["lon"]), "lat": float(r["lat"])})
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
    sys.stderr.write("tw-stations.js: %d stations, %d with a reading\n"
                     % (len(out), sum(1 for o in out if o["ro"])))


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
