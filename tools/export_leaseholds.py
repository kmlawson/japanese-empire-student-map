#!/usr/bin/env python3
"""Weihaiwei and Kwangchowwan as this map draws them, out to GeoJSON.

Both come from the author's *Modern East Asia GIS* project as GeoPackages in an
azimuthal-equidistant grid centred on Wuhan, on the Clarke 1866 ellipsoid. This
writes them in longitude and latitude, converted the way the build converts
them — by solving the geodesic direct problem, which is what an
azimuthal-equidistant grid is: a true bearing and a true distance from the
centre. An earlier version of this project inverted that grid with the spherical
formula and put every layer between two and six kilometres out of place,
radially away from Wuhan, so the conversion is worth naming.

    python3 tools/export_leaseholds.py <folder inside which the two go>

Each leasehold gets a folder of its own, and Kwangchowwan gets a second file:
the hand-traced ring of Guangzhou Bay's water, which is not in the GeoPackage
and is not a boundary at all. It exists because Natural Earth paints the arms of
the bay as land, so China's yellow showed in the channels between the
leasehold's six pieces; everything inside that ring which the leasehold itself
does not cover is painted as water. It is included because it is data this map
holds and the GIS project does not.

Nothing is simplified: this is what the build starts from, not what it draws.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gpkg
import build_map as bm

LEASEHOLDS = [
    ("weihaiwei", "Weihaiwei", "weihaiwei-1930.geojson", {
        "name": "Weihaiwei", "en": "Wēihǎiwèi (Weihaiwei)",
        "ja": "威海衛 (Ikaiei)", "zh": "威海衛 (Wēihǎiwèi)", "ko": "威海衛",
        "when": "Leased 1898, returned 1 October 1930", "rule": "British",
    }),
    ("guangzhouwan", "Kwangchowwan", "kwangchowwan-1930.geojson", {
        "name": "Kwangchowwan", "en": "Guǎngzhōuwān (Kwangchowan)",
        "ja": "広州湾 (Kōshūwan)", "orig": "Kouang-Tchéou-Wan", "zh": "廣州灣",
        "when": "Leased to France 1898–1945", "rule": "French",
    }),
]


def feature(rings, props):
    """One feature, outer rings and holes kept apart by their winding."""
    polys, sign = [], None
    for r in rings:
        a = 0.0
        for i in range(len(r)):
            x0, y0 = r[i]
            x1, y1 = r[(i + 1) % len(r)]
            a += x0 * y1 - x1 * y0
        s = 1 if a >= 0 else -1
        if sign is None:
            sign = s
        if s == sign or not polys:
            polys.append([[list(p) for p in r]])
        else:
            polys[-1].append([list(p) for p in r])
    geom = ({"type": "Polygon", "coordinates": polys[0]} if len(polys) == 1
            else {"type": "MultiPolygon", "coordinates": polys})
    return {"type": "Feature", "properties": props, "geometry": geom}


def write(path, feats):
    with open(path, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    v = sum(len(r) for f in feats
            for poly in ([f["geometry"]["coordinates"]]
                         if f["geometry"]["type"] == "Polygon"
                         else f["geometry"]["coordinates"])
            for r in poly)
    sys.stderr.write("%s: %d features, %d vertices\n"
                     % (os.path.join(*path.split(os.sep)[-2:]), len(feats), v))


def main(dest):
    for key, folder, fname, props in LEASEHOLDS:
        src = os.path.join(bm.CACHE, "gis", bm.GIS_LAYERS[key])
        if not os.path.exists(src):
            sys.stderr.write("missing: %s\n" % src)
            continue
        rings = [r for r in gpkg.rings_lonlat(src) if len(r) >= 3]
        out = os.path.join(dest, folder)
        os.makedirs(out, exist_ok=True)
        write(os.path.join(out, fname), [feature(rings, dict(props))])

        sea = [ring for k, ring in bm.LEASEHOLD_SEA if k == key]
        if sea:
            write(os.path.join(out, fname.replace(".geojson", "-water.geojson")),
                  [feature([sea[0]], {
                      "name": props["name"] + ": the traced water",
                      "note": "Hand-traced for the map, not a boundary: the "
                              "water round the leasehold, painted as water so "
                              "that a coarser coastline underneath does not "
                              "show land in the channels between its pieces."})])


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
