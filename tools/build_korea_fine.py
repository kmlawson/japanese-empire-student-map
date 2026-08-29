#!/usr/bin/env python3
"""Korea's provinces at survey resolution, in a sheet of their own.

    python3 tools/build_korea_fine.py

The coarse thirteen are in `japan-empire-map-admin.svg` with everybody else's
divisions, drawn at 0.006 degrees because the base map is what every pan pays
for. This is the same thirteen at 0.0004 -- half a pixel at the deepest zoom
the map now allows -- in a file nothing fetches until a reader is zoomed in and
over Korea.

WHY A SHEET OF ITS OWN rather than more of the fine-coastline file. That file
is 636 KB and is fetched on a deep zoom *anywhere*; Korea at this resolution is
some 1.5 MB, and putting it there would charge every reader looking closely at
the Bonins for a country on the other side of the map. It is also not the same
kind of thing: the fine coastlines graft a better *coast* onto an atom, and
this replaces thirteen *divisions* with thirteen better ones, which is what the
administrative sheet already knows how to do.

The output is the shape `loadAdmin` in map.js reads — one `<g data-for="korea">`
of `<path data-prov="...">` — so the grafting code is the code that already
exists.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import build_map as bm          # noqa: E402  (the projection and the formatter)

SRC = os.path.join(HERE, "cache", "korea_13_provinces_fine.json")
OUT = os.path.join(ROOT, "japan-empire-map-korea.svg")


def main():
    if not os.path.exists(SRC):
        sys.exit("missing %s -- run tools/build_korea_provinces.py" % SRC)
    with io.open(SRC, encoding="utf-8") as fh:
        doc = json.load(fh)

    out = ['<?xml version="1.0" encoding="utf-8"?>',
           '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" '
           'id="jmap-korea">' % (bm.fmt(bm.WIDTH), bm.fmt(bm.HEIGHT)),
           "  <title>Korea's provinces, at survey resolution</title>",
           '  <g data-for="korea">']
    total = 0
    # Cheju is lifted out of Zenranan here as it is in the coarse build, and
    # for the same reason: the island is its own block on this map, and a
    # reader zoomed in on it should be told Saishu rather than the province a
    # hundred and fifty kilometres north that administered it. The box is
    # build_map.py's own, so the two sheets cut it in the same place.
    prov, box = bm.KOREA_ISLAND_BLOCK[0], bm.KOREA_ISLAND_BLOCK[2]
    groups = {}
    for f in doc["features"]:
        name = f["properties"]["shapeName"]
        for poly in f["geometry"]["coordinates"]:
            for ring in poly:
                key = name
                if name == prov and all(box[0] <= x <= box[2]
                                        and box[1] <= y <= box[3]
                                        for x, y in ring):
                    key = bm.KOREA_ISLAND_BLOCK[1]
                groups.setdefault(key, []).append(ring)

    for name in sorted(groups):
        pieces = []
        for ring in groups[name]:
            pts = [bm.project(x, y) for x, y in ring]
            pieces.append(bm.ring_to_path(pts, bm.FINE_PRECISION))
        d = "".join(pieces)
        if not d:
            continue
        total += d.count("L") + d.count("M")
        # `data-cx`/`data-cy` are what the card and the label use to place
        # themselves; the coarse sheet carries them and this must too, or a
        # province swapped in here would have nowhere to put its name.
        xs = [p[0] for ring in groups[name] for p in ring]
        ys = [p[1] for ring in groups[name] for p in ring]
        cx, cy = bm.project(sum(xs) / len(xs), sum(ys) / len(ys))
        out.append('    <path data-prov="%s" data-cx="%s" data-cy="%s" d="%s"/>'
                   % (name, bm.fmt(cx), bm.fmt(cy), d))
    out.append("  </g>")
    out.append("</svg>")
    with io.open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    kb = os.path.getsize(OUT) / 1024.0
    print("japan-empire-map-korea.svg: %d blocks, %d vertices, %.0f KB"
          % (len(groups), total, kb))
    if kb > 5120:
        print("WARNING: past the 5 MB this is meant to stay under",
              file=sys.stderr)


if __name__ == "__main__":
    main()
