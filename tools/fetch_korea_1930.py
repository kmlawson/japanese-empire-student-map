"""Rebuild tools/cache/korea_13_provinces.json — colonial Korea's thirteen
provinces, with the coastline that goes with them.

Korea used to be assembled here from the modern provinces of the two republics,
which cannot be made to give the period map: Hwanghae was one province until
1954, Ryanggang and Jagang did not exist, and Kaesong was in Keiki-do rather
than in Hwanghae. This takes the boundaries from a QGIS map of the thirteen
provinces published at spatialhistory.net, drawn over Natural Earth 1:10m land,
so both the province lines and the coast are better than what they replace.

The page is an SVG export in an equirectangular projection whose parameters are
stated in the file, so the drawing can be turned back into longitude and
latitude. The small residual offset was measured against Natural Earth's own
coastline and is corrected below. Jeju, which the province layer omits, is
taken from the land layer and put back into South Cholla, where it belonged.
"""

import json
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
URL = "https://spatialhistory.net/yale/done/korea.html"
UA = "japanese-empire-student-map/1.0 (teaching map build)"

# stated in the SVG's own comments: equirectangular, N/S stretched to 124.5%,
# latitude 33 to 43.07 N, longitude 124.1 to 131.9 E, over a 660 x 1070 view
# with the drawing itself at scale(1,1.245) translate(-228,-17)
VIEW_W, VIEW_H = 660.0, 1070.0
LON0, LON1 = 124.1, 131.9
LAT0, LAT1 = 43.07, 33.0
STRETCH, OFF_X, OFF_Y = 1.245, 228.0, 17.0
# median offset against Natural Earth's coastline, over 253 matched points
DLON, DLAT = 0.0053, 0.0201

# their layer labels, in modern romanisation, to the period keys this map uses
TO_PERIOD = {
    "Gyeonggi": "Keiki",
    "Gangwon": "Kogen",
    "North_Chungcheong": "Chuseihoku",
    "South_Chungcheong": "Chuseinan",
    "North_Jeolla": "Zenrahoku",
    "South_Jeolla": "Zenranan",
    "North_Gyeongsang": "Keishohoku",
    "South_Gyeongsang": "Keishonan",
    "Hwanghae": "Kokai",
    "North_P'yŏngan": "Heianhoku",
    "South_P'yŏngan": "Heiannan",
    "North_Hamgyŏng": "Kankyohoku",
    "South_Hamgyŏng": "Kankyonan",
}

# Jeju, missing from the province layer, is lifted out of the land layer
JEJU_BOX = (125.9, 32.9, 127.1, 33.8)
JEJU_PROVINCE = "Zenranan"


def unproject(x, y):
    vx = x - OFF_X
    vy = (y - OFF_Y) * STRETCH
    return (round(LON0 + vx / VIEW_W * (LON1 - LON0) + DLON, 5),
            round(LAT0 - vy / VIEW_H * (LAT0 - LAT1) + DLAT, 5))


def rings_in(body):
    out = []
    for d in re.findall(r'<path d="([^"]+)"', body):
        pts = [tuple(map(float, p.split(",")))
               for p in re.findall(r"([-\d.]+,[-\d.]+)", d)]
        if len(pts) >= 3:
            out.append([unproject(x, y) for x, y in pts])
    return out


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    page = urllib.request.urlopen(req).read().decode("utf-8", "replace")

    blocks = {}
    for m in re.finditer(
            r'<g id="ne_10m_korea_13_provinces_\d+" inkscape:label="([^"]+)">(.*?)</g>',
            page, re.S):
        key = TO_PERIOD.get(m.group(1))
        if not key:
            raise SystemExit("unknown province layer: " + m.group(1))
        blocks.setdefault(key, []).extend(rings_in(m.group(2)))
    if len(blocks) != 13:
        raise SystemExit("expected thirteen provinces, got %d" % len(blocks))

    x0, y0, x1, y1 = JEJU_BOX
    for m in re.finditer(
            r'<g id="ne_10m_land_scale_rank_\d+" inkscape:label="Land">(.*?)</g>',
            page, re.S):
        for ring in rings_in(m.group(1)):
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            if x0 < min(xs) and max(xs) < x1 and y0 < min(ys) and max(ys) < y1:
                blocks[JEJU_PROVINCE].append(ring)

    feats = [{"type": "Feature", "properties": {"shapeName": k},
              "geometry": {"type": "MultiPolygon",
                           "coordinates": [[r] for r in rings]}}
             for k, rings in sorted(blocks.items())]
    dest = os.path.join(CACHE, "korea_13_provinces.json")
    os.makedirs(CACHE, exist_ok=True)
    with open(dest, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    n = sum(len(r) for rings in blocks.values() for r in rings)
    print("wrote %s: %d provinces, %d rings, %d points, %.2f MB"
          % (dest, len(blocks), sum(len(v) for v in blocks.values()), n,
             os.path.getsize(dest) / 1e6))


if __name__ == "__main__":
    main()
