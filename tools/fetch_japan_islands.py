#!/usr/bin/env python3
"""Fetch the offshore islands of the home islands from OSM.

    python3 tools/fetch_japan_islands.py

The coastline extract the fine layer was built from stops at 33.17 N, so it has
the Ryukyus and the Izu outliers and none of the islands off the main coast:
Sado, Oki, Tsushima, Iki, Awaji, Shodoshima, Amakusa, Rishiri, Rebun, Okushiri
and Izu Oshima were drawn as part of the Japan landmass and could not be named.

Islands come from Overpass as closed ways (the small ones) or as relations of
outer ways (the large ones), so the ways are chained end to end here and a
chain whose two ends meet is an island. Written in the same shape as the other
fine sources: one MultiLineString of closed rings, plus a name index in the
shape build_map.py expects for naming them.
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
API = "https://overpass-api.de/api/interpreter"
UA = {"User-Agent": "japanese-empire-map/1.0 (offline teaching map build)"}

# south, west, north, east
WINDOWS = [
    ("Sado",        37.70, 137.90, 38.45, 138.75),
    ("Oki",         35.90, 132.50, 36.50, 133.60),
    ("Tsushima",    34.00, 129.10, 34.80, 129.60),
    ("Iki",         33.60, 129.50, 33.95, 129.95),
    ("Awaji",       34.10, 134.50, 34.70, 135.10),
    ("Shodoshima",  34.40, 133.95, 34.60, 134.50),
    ("Amakusa",     32.10, 129.90, 32.85, 130.60),
    ("Rishiri",     45.00, 140.70, 45.60, 141.50),
    ("Okushiri",    42.00, 139.30, 42.30, 139.65),
    ("IzuOshima",   33.90, 139.10, 34.95, 139.90),
]


def fetch(name, s, w, n, e, tries=0):
    q = ('[out:json][timeout:180];('
         'way["place"="island"]["name"](%f,%f,%f,%f);'
         'relation["place"="island"]["name"](%f,%f,%f,%f););out geom;'
         % (s, w, n, e, s, w, n, e))
    try:
        req = urllib.request.Request(API, data=urllib.parse.urlencode({"data": q}).encode(),
                                     headers=UA)
        return json.load(urllib.request.urlopen(req, timeout=200))["elements"]
    except Exception as exc:
        if tries < 4:
            time.sleep(12 * (tries + 1))
            return fetch(name, s, w, n, e, tries + 1)
        sys.stderr.write("  %s: %s\n" % (name, exc))
        return []


def chain(ways):
    """Ways joined end to end; a chain whose ends meet is a closed ring."""
    segs = [list(w) for w in ways if len(w) > 1]
    rings = []
    while segs:
        cur = segs.pop(0)
        moved = True
        while moved and cur[0] != cur[-1]:
            moved = False
            for i, s in enumerate(segs):
                if s[0] == cur[-1]:
                    cur += s[1:]; segs.pop(i); moved = True; break
                if s[-1] == cur[-1]:
                    cur += list(reversed(s))[1:]; segs.pop(i); moved = True; break
                if s[-1] == cur[0]:
                    cur = s[:-1] + cur; segs.pop(i); moved = True; break
                if s[0] == cur[0]:
                    cur = list(reversed(s))[:-1] + cur; segs.pop(i); moved = True; break
        if cur[0] == cur[-1] and len(cur) > 3:
            rings.append(cur)
    return rings


def main():
    rings, names = [], []
    for name, s, w, n, e in WINDOWS:
        els = fetch(name, s, w, n, e)
        got = 0
        for el in els:
            tags = el.get("tags") or {}
            label = tags.get("name:en") or tags.get("name")
            if el["type"] == "way" and el.get("geometry"):
                pts = [(p["lon"], p["lat"]) for p in el["geometry"]]
                made = chain([pts])
            else:
                outers = [[(p["lon"], p["lat"]) for p in m["geometry"]]
                          for m in el.get("members", [])
                          if m.get("role") in ("outer", "") and m.get("geometry")]
                made = chain(outers)
            for r in made:
                rings.append(r); got += 1
            if made and label:
                xs = [p[0] for r in made for p in r]
                ys = [p[1] for r in made for p in r]
                names.append({"type": "node", "tags": tags,
                              "center": {"lat": (min(ys) + max(ys)) / 2,
                                         "lon": (min(xs) + max(xs)) / 2}})
        sys.stderr.write("  %-11s %2d island(s)\n" % (name, got))
        time.sleep(1.5)

    geo = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {},
         "geometry": {"type": "MultiLineString",
                      "coordinates": [[[round(x, 6), round(y, 6)] for x, y in r]
                                      for r in rings]}}]}
    p1 = os.path.join(CACHE, "northern-japan-islands.geojson")
    p2 = os.path.join(CACHE, "osm-islands-northern-japan.json")
    json.dump(geo, open(p1, "w"), ensure_ascii=False)
    json.dump({"elements": names}, open(p2, "w"), ensure_ascii=False)
    sys.stderr.write("wrote %d rings and %d names\n" % (len(rings), len(names)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
