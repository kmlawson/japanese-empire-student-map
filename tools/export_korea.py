#!/usr/bin/env python3
"""Korea as this map draws it, out to two GeoJSON files.

One is the thirteen provinces of the colonial period, each with the names the
map shows for it; the other is the country as a single outline, dissolved from
those same provinces so that the two files agree to the vertex — the outline is
not a second tracing, it is the provinces with their shared edges cancelled.

    python3 tools/export_korea.py <folder>

Coordinates are longitude and latitude, EPSG:4326, as they are in the cache:
`tools/fetch_korea_1930.py` has already turned the source SVG's equirectangular
grid back into degrees and corrected its residual offset against Natural Earth's
coastline. Nothing here reprojects or simplifies — this is the data the build
starts from, not the thinned version it draws.
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_map as bm                                   # for dissolve()

ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "tools", "cache", bm.KOREA_FILE)
NAMES = os.path.join(ROOT, "texts", "territories", "sub-units", "korea.csv")


def names():
    """The map's own names for each province, keyed as the shapes are."""
    out = {}
    if os.path.exists(NAMES):
        with open(NAMES, newline="") as fh:
            for row in csv.DictReader(fh):
                out[row["key"]] = {k: v for k, v in row.items()
                                   if k != "key" and v}
    return out


def main(dest):
    with open(SRC) as fh:
        feats = json.load(fh)["features"]
    by_name = names()

    provinces, rings = [], []
    for feat in feats:
        key = feat["properties"]["shapeName"]
        rs = list(bm.iter_rings(feat["geometry"]))
        rings.extend(rs)
        props = {"key": key}
        props.update(by_name.get(key, {}))
        provinces.append({"type": "Feature", "properties": props,
                          "geometry": feat["geometry"]})

    # The country: the same rings with every edge two provinces share cancelled.
    whole = bm.dissolve(rings)
    country = {"type": "Feature",
               "properties": {"name": "Korea (Chōsen)", "ja": "朝鮮",
                              "ko": "조선", "when": "Japanese from 1910",
                              "note": "Dissolved from the thirteen provinces in "
                                      "this folder; not a separate tracing."},
               "geometry": {"type": "MultiPolygon",
                            "coordinates": [[[list(p) for p in r]] for r in whole]}}

    os.makedirs(dest, exist_ok=True)
    out = [("korea-provinces-1930.geojson", provinces),
           ("korea-1930.geojson", [country])]
    for fname, fs in out:
        with open(os.path.join(dest, fname), "w") as fh:
            json.dump({"type": "FeatureCollection", "features": fs}, fh)
        v = sum(len(r) for f in fs
                for poly in ([f["geometry"]["coordinates"]]
                             if f["geometry"]["type"] == "Polygon"
                             else f["geometry"]["coordinates"])
                for r in poly)
        sys.stderr.write("%s: %d features, %d vertices\n" % (fname, len(fs), v))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
