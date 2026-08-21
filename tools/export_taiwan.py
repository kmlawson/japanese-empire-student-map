#!/usr/bin/env python3
"""Taiwan as this map draws it, out to GeoJSON.

    python3 tools/export_taiwan.py <folder>

**Read the provenance before using this for anything.** Unlike the Korea export
beside it, this is not a period source. Taiwan is one of the places where this
map draws Natural Earth's present-day coastline, because no period layer of it
has been made; the Sources page says so. What the export gives you is therefore
Natural Earth's outline, unsimplified, with one editorial decision applied and
one not:

* **Kinmen is left out**, as it is on the map. Natural Earth files Kinmen under
  Taiwan because it is governed from Taipei today; it belonged to Fujian
  throughout the colonial period and this map draws it with China. The box that
  removes it is `KINMEN_BOX` in `tools/build_map.py`.
* **The Pescadores are kept**, because they were ceded with Taiwan in 1895 and
  were part of the colony.

Nothing is simplified: this is what the build starts from, not what it draws.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_map as bm

PROPS = {
    "name": "Taiwan (Formosa)",
    "en": "Táiwān (Taiwan, Formosa)",
    "ja": "台湾 (Taiwan)",
    "zh": "臺灣",
    "when": "Ceded by China in 1895; Japanese to 1945",
    "rule": "Japanese colony",
    "source": "Natural Earth 1:10m, present-day coastline — not a period "
              "source. Kinmen removed, being Fujian's throughout the colonial "
              "period; the Pescadores kept, having been ceded with Taiwan.",
}


def main(dest):
    a0 = bm.load("admin0", False)
    rings = []
    for feat in a0["features"]:
        if feat["properties"].get("ADMIN") != "Taiwan":
            continue
        for ring in bm.iter_rings(feat["geometry"]):
            if bm.split_taiwan(ring) == "taiwan" and len(ring) >= 3:
                rings.append(ring)
    if not rings:
        sys.stderr.write("no Taiwan rings found in admin0\n")
        return

    # biggest first, so the island leads and the islets follow
    rings.sort(key=lambda r: abs(bm.signed_ring_area(r)), reverse=True)
    feats = [{"type": "Feature", "properties": dict(PROPS),
              "geometry": {"type": "MultiPolygon",
                           "coordinates": [[[list(p) for p in r]] for r in rings]}}]
    out = os.path.join(dest, "Taiwan")
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, "taiwan-1930.geojson")
    with open(path, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    sys.stderr.write("Taiwan/taiwan-1930.geojson: %d rings, %d vertices\n"
                     % (len(rings), sum(len(r) for r in rings)))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
