#!/usr/bin/env python3
"""Karafuto and the Kuriles as this map draws them, out to GeoJSON.

    python3 tools/export_karafuto.py <folder>

Karafuto is Natural Earth's Sakhalin cut at the 50th parallel. The cut is exact
— the border *was* the parallel, from the Treaty of Portsmouth in 1905 until the
Soviet invasion in August 1945 — so the only approximation in the file is the
coastline itself, which is a present-day one.

The Kuriles come out beside it as one collection, a feature per island, carrying
the names the map shows for the ones it names. See the notes written beside both.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_map as bm

PROPS = {
    "name": "Karafuto",
    "en": "Karafuto (southern Sakhalin)",
    "ja": "樺太 (Karafuto)",
    "zh": "樺太",
    "when": "Japanese from 1905; Soviet from August 1945",
    "rule": "Japanese prefecture from 1943; before that an external territory",
    "source": "Natural Earth 1:10m, present-day coastline, cut at 50 degrees "
              "north. The cut is the historical border exactly; the coast is "
              "not a period source.",
}

NOTE = """# Karafuto, as the interactive Japanese Empire map draws it

`karafuto-1930.geojson` — %d rings, %d vertices, EPSG:4326.

## What is exact and what is not

**The cut is exact.** Karafuto was southern Sakhalin below the **50th parallel**,
and the parallel is the border: Russia ceded the south at Portsmouth in 1905 and
the Soviet Union took it back in August 1945. So the straight northern edge of
this polygon is not an approximation — it is the boundary, and any map of the
period draws it as a straight line too.

**The coast is not a period source.** It is Natural Earth's present-day
coastline, the same as the Taiwan export in this collection. No period layer of
Sakhalin has been traced for this map. For most purposes this matters little —
Sakhalin's coast has not moved much — but it is not a 1930s survey and should
not be cited as one.

## What is in the file

One polygon: the southern half of the island. Natural Earth's Sakhalin ring
clipped to latitude 50 and below, which is what the build does, at
`tools/build_map.py` in the Russia branch. The small islands off the coast —
Moneron, Kaiba-tō — are not in it: the map draws only the main island as
Karafuto.

The northern half of Sakhalin, Soviet throughout this period, is in the Soviet
Union layer instead and stops at the same parallel.

## How to remake it

    python3 tools/export_karafuto.py <the GIS folder>

Nothing is simplified: this is what the map's build starts from, not the thinned
version it draws.
"""


def main(dest):
    a0 = bm.load("admin0", False)
    south = None
    for feat in a0["features"]:
        if feat["properties"].get("ADMIN") != "Russia":
            continue
        for ring in bm.iter_rings(feat["geometry"]):
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            # the same test the build uses to find Sakhalin
            if 140.0 < min(xs) and max(xs) < 146.0 and 45.0 < min(ys) and max(ys) < 55.0:
                cut = bm.clip_halfplanes(
                    ring, bm.box_planes(bm.LON_MIN, bm.LAT_MIN, bm.LON_MAX, 50.0))
                if len(cut) >= 3:
                    south = cut
    if not south:
        sys.stderr.write("no Sakhalin ring found in admin0\n")
        return

    feats = [{"type": "Feature", "properties": dict(PROPS),
              "geometry": {"type": "Polygon",
                           "coordinates": [[list(p) for p in south]]}}]
    out = os.path.join(dest, "Japan", "karafuto-1930")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "karafuto-1930.geojson"), "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    with open(os.path.join(out, "karafuto-1930.md"), "w") as fh:
        fh.write(NOTE % (1, len(south)))
    sys.stderr.write("Japan/karafuto-1930/: 1 ring, %d vertices, and the note\n"
                     % len(south))
    kuriles(a0, dest)


KURILE_PROPS = {
    "name": "The Kurile Islands",
    "en": "The Kurile Islands (Chishima)",
    "ja": "千島列島 (Chishima rettō)",
    "zh": "千島群島",
    "when": "Japanese from 1875; Soviet from August 1945",
    "source": "Natural Earth 1:10m, present-day coastlines. Not a period "
              "source; the chain is picked out of Russia's rings by position.",
}

KURILE_NOTE = """# The Kurile Islands, as the interactive Japanese Empire map draws them

`kuriles-1930.geojson` — %d islands, %d vertices, EPSG:4326. %d of them carry a
name; the rest are unnamed in this map's own table and are left unnamed here
rather than guessed at.

## What is in the file

The whole chain from Kunashiri in the south to Shumshu off Kamchatka, Japanese
from the Treaty of St Petersburg in 1875 until the Soviet landings of August and
September 1945. One feature per island.

They are picked out of Natural Earth's *Russia* by position — a centroid between
145 and 157.5 east and 43 and 51.5 north, on a ring less than four degrees
across — because Natural Earth files them under the country that holds them
today. That test is `split_russia` in `tools/build_map.py`. It is a rule about
where the islands are, not about who held them, so it is stable regardless of
the date being drawn.

## Not a period source

Present-day coastlines, like the Karafuto and Taiwan exports beside them. No
period layer of the chain has been traced for this map. The names are the
period ones where the map has them — Etorofu, Kunashiri, Shikotan, Paramushiro
and the rest — with the present-day forms in brackets on the map itself.

## How to remake it

    python3 tools/export_karafuto.py <the GIS folder>

Nothing is simplified.
"""


def kuriles(a0, dest):
    """Every Kurile island, one feature each, named where the map names it."""
    feats = []
    for feat in a0["features"]:
        if feat["properties"].get("ADMIN") != "Russia":
            continue
        for ring in bm.iter_rings(feat["geometry"]):
            if bm.split_russia(ring) != "chishima" or len(ring) < 3:
                continue
            props = dict(KURILE_PROPS)
            label = bm.island_name("chishima", ring)
            if label:
                props["island"] = label
            feats.append({"type": "Feature", "properties": props,
                          "geometry": {"type": "Polygon",
                                       "coordinates": [[list(p) for p in ring]]}})
    if not feats:
        sys.stderr.write("no Kurile rings found in admin0\n")
        return
    feats.sort(key=lambda f: -len(f["geometry"]["coordinates"][0]))
    out = os.path.join(dest, "Japan", "kuriles-1930")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "kuriles-1930.geojson"), "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    verts = sum(len(f["geometry"]["coordinates"][0]) for f in feats)
    named = sum(1 for f in feats if "island" in f["properties"])
    with open(os.path.join(out, "kuriles-1930.md"), "w") as fh:
        fh.write(KURILE_NOTE % (len(feats), verts, named))
    sys.stderr.write("Japan/kuriles-1930/: %d islands (%d named), %d vertices, "
                     "and the note\n" % (len(feats), named, verts))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
