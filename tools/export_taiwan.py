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


NOTE = """# Taiwan, as the interactive Japanese Empire map draws it

`taiwan-1930.geojson` — %d rings, %d vertices, EPSG:4326.

## This is not a period source

Read this before using the file for anything historical.

Taiwan is one of the places the map draws **Natural Earth's present-day
coastline**, because no period layer of it has been made. The Korea export
beside it comes from a map of the period; the Weihaiwei and Kwangchowwan
exports come from hand-made layers; this one does not. Anyone taking this file
for a 1930s outline would be taking a 2020s one.

What that means in practice: the coast is where the coast is now, after a
century of reclamation at Kaohsiung, Taichung and the Tamsui mouth, and the
file records no boundary of any kind — no prefectures, no Japanese
administrative divisions, nothing but land against sea.

## Two decisions that are in the geometry

**Kinmen is left out.** Natural Earth files Kinmen under Taiwan because it is
governed from Taipei today. It belonged to Fujian throughout the colonial
period and the map draws it with China, so the export drops it. If you want it,
it is in Natural Earth's Taiwan feature inside the box 117.9-118.8 E,
24.2-24.8 N.

**The Pescadores are kept.** They were ceded with Taiwan in 1895 and were part
of the colony, so they belong here. They are four of the seven rings.

The other rings are the main island, Green Island and Orchid Island.

## Provenance and how to remake it

Natural Earth 1:10m cultural vectors, `ne_10m_admin_0_countries`, public domain.
Nothing is simplified: this is what the map's build starts from, not the thinned
version it draws.

    python3 tools/export_taiwan.py <the GIS folder>

## If you want a period Taiwan

It would have to be traced, not exported — from a Japanese colonial sheet, the
way Korea's thirteen provinces and the two leaseholds were. Taiwan's colonial
prefectures (州・庁) would come with it, and the map could then name them the
way it names Korea's provinces.
"""

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
    # the layer and its note in a folder of their own, so the warning cannot
    # be separated from the thing it warns about
    out = os.path.join(dest, "Taiwan", "taiwan-1930")
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, "taiwan-1930.geojson")
    with open(path, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    with open(os.path.join(out, "taiwan-1930.md"), "w") as fh:
        fh.write(NOTE % (len(rings), sum(len(r) for r in rings)))
    sys.stderr.write("Taiwan/taiwan-1930/: %d rings, %d vertices, and the note\n"
                     % (len(rings), sum(len(r) for r in rings)))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
