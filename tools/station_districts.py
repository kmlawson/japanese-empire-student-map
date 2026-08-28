#!/usr/bin/env python3
"""Which 郡 and which 州 each colonial station stood in.

    python3 tools/station_districts.py           # report, writes nothing
    python3 tools/station_districts.py --write   # fill the columns

The station table has a name and a coordinate and nothing else, so the card a
reader opens on one has a headline and no sentence. The ground it stood on is
the one thing that can be said about all 191 without anybody writing 191
paragraphs -- and it is not invented, it is a point-in-polygon against the same
1926 districts the map draws, `tools/cache/taiwan_1930_districts.json`.

A station outside every district is left blank rather than given the nearest
one. Twenty of them are: the 蕃地 -- the highlands and the east coast, outside
the 郡/市 hierarchy altogether -- has no district polygon, and the Taitō and
Karenkō lines run through it for most of their length. Blank is the true
answer there, and the prefecture is filled from the 州/廳 sheet instead.
"""
import csv
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIST = os.path.join(HERE, "cache", "taiwan_1930_districts.json")
CSV = os.path.join(ROOT, "data", "taiwan", "stations.csv")
NAMES = os.path.join(ROOT, "texts", "territories", "sub-units", "taiwan.csv")

# Which 州 or 廳 each 郡 was in comes off the district sheet's own `shu` field,
# so nothing is joined by geometry twice. What a unit is *called*, though, is
# texts/ business and not the cache's: the 蕃地 is the case that proves it --
# the geojson still calls it "Taiwan Indigenous Peoples", which is the name
# this project was told to stop using. Names are read from
# texts/territories/sub-units/taiwan.csv by key, and the cache is used for
# geometry alone.
def shu_key(name):
    """`Taihoku-shū` -> the key of the prefecture record, `TwShuTaihoku`."""
    return "TwShu" + name.split("-")[0].replace("ō", "o").replace("ū", "u") \
        .replace("Taichu", "Taichu")


def load_names():
    out = {}
    with io.open(NAMES, encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            out[row["key"]] = row
    return out


def rings(geom):
    """Every ring of a polygon or multipolygon, outer and inner alike."""
    t = geom.get("type")
    if t == "Polygon":
        return list(geom["coordinates"])
    if t == "MultiPolygon":
        out = []
        for poly in geom["coordinates"]:
            out.extend(poly)
        return out
    return []


def in_ring(x, y, ring):
    """Crossing number. The ring is closed or not; either works."""
    inside = False
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i][0], ring[i][1]
        x1, y1 = ring[(i + 1) % n][0], ring[(i + 1) % n][1]
        if (y0 > y) != (y1 > y):
            xc = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
            if x < xc:
                inside = not inside
    return inside


def in_feature(x, y, geom):
    """Outer rings count in, holes count out -- which is what a multipolygon's
    second and later rings are. A station in a hole is in no district."""
    t = geom.get("type")
    polys = [geom["coordinates"]] if t == "Polygon" else geom.get("coordinates", [])
    for poly in polys:
        if not poly:
            continue
        if in_ring(x, y, poly[0]) and not any(in_ring(x, y, h) for h in poly[1:]):
            return True
    return False


def load():
    return json.load(io.open(DIST, encoding="utf-8"))["features"]


def locate(lon, lat, districts):
    for f in districts:
        if in_feature(lon, lat, f["geometry"]):
            return f["properties"]
    return None


# What the tooltip says and the card opens with. A phrase, not a paragraph:
# what kind of stop it was and the ground it stood on.
KIND_PHRASE = {"station": "A station", "halt": "A halt",
               "temporary halt": "A temporary halt", "yard": "A goods yard"}


def bare(en):
    """The name without the gloss and without the bracketed alternates:
    `Taihoku-shi (Taihoku, Taipei)` is Taihoku-shi here."""
    cut = en.find(" \u2014 ")
    if cut > 0:
        en = en[:cut]
    cut = en.find(" (")
    return (en[:cut] if cut > 0 else en).strip()


def phrase(row, dist, names):
    kind = KIND_PHRASE.get(row.get("kind") or "station", "A station")
    if not dist:
        return kind + " on the Government Railway."
    rec = names.get(dist["key"]) or {}
    dname = bare(rec.get("en") or dist["romaji"] or "")
    where = dname + " (" + dist["kanji"] + ")" if dist["kanji"] else dname
    # Taitō-chō and Karenkō-chō are each one district covering the whole
    # prefecture, so naming both said "in Taitō-chō (臺東廳), Taitō-chō".
    shu = dist.get("shu") or ""
    if shu:
        srec = names.get(shu_key(shu)) or {}
        sname = bare(srec.get("en") or shu)
        if sname != dname:
            where += ", " + sname
    return kind + " in " + where + "."


def main():
    write = "--write" in sys.argv
    districts = load()
    names = load_names()
    rows = list(csv.DictReader(io.open(CSV, encoding="utf-8", newline="")))
    fields = list(rows[0].keys())
    for extra in ("district", "district_kanji", "shu", "short"):
        if extra not in fields:
            fields.append(extra)
    no_district = 0
    no_shu = 0
    for r in rows:
        dist = locate(float(r["lon"]), float(r["lat"]), districts)
        r["district"] = dist["key"] if dist else ""
        r["district_kanji"] = dist["kanji"] if dist else ""
        r["shu"] = (dist.get("shu") or "") if dist else ""
        if not r.get("short"):
            r["short"] = phrase(r, dist, names)
        if not dist:
            no_district += 1
        elif not dist.get("shu"):
            no_shu += 1
    print("%d stations; %d outside every district, %d in the 蕃地 and so in no "
          "prefecture" % (len(rows), no_district, no_shu))
    if not write:
        for r in rows[:6]:
            print("  %s %s -> %s" % (r["id"], r["hanji"], r["short"]))
        print("(nothing written; pass --write)")
        return
    with io.open(CSV, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print("wrote " + CSV)


main()
