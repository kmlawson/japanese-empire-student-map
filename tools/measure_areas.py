#!/usr/bin/env python3
"""Measure the area of each shape in a GeoJSON, by spherical excess.

    python3 tools/measure_areas.py tools/cache/adm1_JPN.json shapeName

Prints one line per feature: the key, the area in km², and the vertex count.

**Why measured rather than looked up.** A density on a card belongs to the
shape the reader is pointing at, or the card and the map under it can disagree
about the same place. Korea's thirteen provinces were done this way first and
`data/population/README.md` says so; this is the same arithmetic with the
source file as an argument.

**The arithmetic.** The signed area of a spherical polygon, Chamberlain and
Duquette's form:

    A = R²/2 · Σ (λ_{i+1} − λ_i)(2 + sin φ_i + sin φ_{i+1})

on a sphere of radius 6371.0088 km — the IUGG mean radius, which is the sphere
whose area matches the WGS-84 ellipsoid's to a part in ten thousand. A flat
cos-latitude approximation was tried on Korea and came out 930 km² heavy over
219,847, which moved six densities by one; this is the fix that was made then.

Ring 0 of a polygon is its outer boundary and the rest are holes, per the
GeoJSON specification, so holes are subtracted rather than trusted to wind the
other way — plenty of files in the wild do not wind at all.
"""
import json
import math
import sys

R_KM = 6371.0088


def ring_area(ring):
    """Signed area of one closed ring, in km². Sign follows the winding."""
    total = 0.0
    n = len(ring)
    if n < 3:
        return 0.0
    for i in range(n):
        lon1, lat1 = ring[i][0], ring[i][1]
        lon2, lat2 = ring[(i + 1) % n][0], ring[(i + 1) % n][1]
        total += (math.radians(lon2 - lon1)
                  * (2 + math.sin(math.radians(lat1)) + math.sin(math.radians(lat2))))
    return total * R_KM * R_KM / 2.0


def polygon_area(rings):
    """Outer ring less its holes."""
    if not rings:
        return 0.0
    out = abs(ring_area(rings[0]))
    for hole in rings[1:]:
        out -= abs(ring_area(hole))
    return out


def geometry_area(geom):
    t = geom.get("type")
    if t == "Polygon":
        return polygon_area(geom["coordinates"]), sum(len(r) for r in geom["coordinates"])
    if t == "MultiPolygon":
        a = 0.0
        v = 0
        for poly in geom["coordinates"]:
            a += polygon_area(poly)
            v += sum(len(r) for r in poly)
        return a, v
    if t == "GeometryCollection":
        a = 0.0
        v = 0
        for g in geom.get("geometries", []):
            ga, gv = geometry_area(g)
            a += ga
            v += gv
        return a, v
    return 0.0, 0


def main(argv):
    if len(argv) < 2:
        sys.stderr.write(__doc__)
        return 2
    path = argv[1]
    prop = argv[2] if len(argv) > 2 else "shapeName"
    with open(path) as fh:
        doc = json.load(fh)
    feats = doc["features"] if isinstance(doc, dict) else doc
    total = 0.0
    for f in feats:
        key = str((f.get("properties") or {}).get(prop, ""))
        a, v = geometry_area(f["geometry"])
        total += a
        print("%s\t%.1f\t%d" % (key, a, v))
    print("TOTAL\t%.1f" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
