"""Bangkok's fifty khet, gathered into the two provinces of the period.

Phra Nakhon on the left bank of the Chao Phraya and Thonburi on the right were
separate changwat until they were merged in 1971, so modern Thailand's
first-level units — which this map's Siam provinces otherwise come from — are
wrong on both of its dates. geoBoundaries publishes Thailand at ADM2 as well,
928 khet and amphoe, and the fifteen khet that descend from Thonburi's
districts dissolve back into that province exactly.

The ADM2 file is 253 MB and is not cached here; this script fetches it, keeps
the fifty units whose centroid falls inside the ADM1 outline of Bangkok,
dissolves the two groups and writes tools/cache/tha_bangkok_2.json, which is
208 KB and is committed. Both groups come out as a single ring, so no district
boundary is drawn inside either province.

    python3 tools/fetch_tha_bangkok.py
"""

import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
OUT = "tha_bangkok_2.json"
ADM1 = "adm1_THA.json"

# A descriptive user-agent and no contact address: the convention that invites
# one is not a reason to publish anybody's.
UA = "japanese-empire-map/1.0 (offline teaching map build)"
API = "https://www.geoboundaries.org/api/current/gbOpen/THA/ADM2/"

# The khet on the Thonburi side of the river. Bang Phlat came out of Bangkok
# Noi in 1989, Chom Thong and Bang Bon out of Bang Khun Thian, Bang Khae out of
# Phasi Charoen, Thawi Watthana out of Taling Chan and Thung Khru out of Rat
# Burana — all of them within the old province, so the union is its area.
THONBURI = {
    "Thon Buri", "Khlong San", "Bangkok Yai", "Bangkok Noi", "Bang Phlat",
    "Taling Chan", "Thawi Watthana", "Bang Khun Thian", "Chom Thong",
    "Rat Burana", "Thung Khru", "Phasi Charoen", "Nong Khaem", "Bang Khae",
    "Bang Bon",
}


def get(url):
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=600)


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    return [poly[0] for poly in geom["coordinates"]]


def point_in_ring(pt, ring):
    x, y = pt
    inside = False
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % n]
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            inside = not inside
    return inside


def main():
    sys.path.insert(0, HERE)
    import build_map as bm

    with open(os.path.join(CACHE, ADM1)) as fh:
        adm1 = json.load(fh)
    bkk = [f for f in adm1["features"]
           if f["properties"].get("shapeName") == "Bangkok"]
    if not bkk:
        raise SystemExit("no Bangkok feature in " + ADM1)
    outline = rings_of(bkk[0]["geometry"])

    meta = json.load(get(API))
    sys.stderr.write("geoBoundaries THA ADM2, %s\n"
                     % meta.get("boundaryYearRepresented"))
    adm2 = json.load(get(meta["gjDownloadURL"]))

    groups = {"Phra Nakhon": [], "Thonburi": []}
    kept = 0
    for feat in adm2["features"]:
        rs = rings_of(feat["geometry"])
        pts = [p for r in rs for p in r]
        c = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
        if not any(point_in_ring(c, r) for r in outline):
            continue
        kept += 1
        name = feat["properties"].get("shapeName")
        groups["Thonburi" if name in THONBURI else "Phra Nakhon"].extend(
            [[(round(x, 6), round(y, 6)) for x, y in r] for r in rs])
    if kept != 50:
        sys.stderr.write("note: %d khet inside Bangkok, expected 50\n" % kept)

    feats = []
    for name, rs in sorted(groups.items()):
        merged = bm.dissolve(rs) or bm.union_rings(rs)
        merged = [r for r in merged
                  if len(r) >= 3 and abs(bm.signed_ring_area(r)) > 1e-8]
        merged.sort(key=lambda r: -abs(bm.signed_ring_area(r)))
        sys.stderr.write("%-12s %2d khet -> %d ring(s), %d points\n"
                         % (name, len(rs), len(merged),
                            sum(len(r) for r in merged)))
        feats.append({"type": "Feature", "properties": {"shapeName": name},
                      "geometry": {"type": "MultiPolygon",
                                   "coordinates": [[[list(p) for p in r]]
                                                   for r in merged]}})
    dest = os.path.join(CACHE, OUT)
    with open(dest, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    sys.stderr.write("wrote %s, %.0f KB\n" % (dest, os.path.getsize(dest) / 1024))


if __name__ == "__main__":
    main()
