#!/usr/bin/env python3
"""Move colonial Korea onto Natural Earth's coastline.

    python3 tools/shift_korea.py            # report, writes nothing
    python3 tools/shift_korea.py --write    # rebuild the file the map reads
    python3 tools/shift_korea.py --revert   # put it back untouched

    tools/cache/korea_13_provinces_traced.json   the tracing, never edited
    tools/cache/korea_13_provinces.json          what build_map.py reads

WHY THIS EXISTS. Korea's coast on this map is not Natural Earth. It is a
re-digitisation of an SVG drawing of the thirteen provinces published at
spatialhistory.net, which `fetch_korea_1930.py` turns back into longitude and
latitude. The drawing is 660 x 1070 pixels over the peninsula -- 1,037 m per
pixel east-west, 1,041 m north-south -- so one pixel is a kilometre, and the
recovered coast sits a median 2.70 km from the coastline it was drawn over.

That would be tolerable on its own. What made it visible is that the railway
data is an order of magnitude better: the NIKH station coordinates are good to
a few hundred metres. A line drawn accurately along a shore that is itself a
kilometre or two inland runs through open water, and it did -- 51 of the 850
stations stood in the sea, and whole stretches of the east-coast line with
them.

THE DISPLACEMENT IS ALMOST PURELY NORTHWARD. Over 943 coast vertices matched
to their nearest Natural Earth vertex, Natural Earth lies north of ours at 72%
of them and east at 54% -- a coin toss. So the correction is north, with a
small eastward component that is barely worth its place.

`fetch_korea_1930.py` already carries a correction of exactly this kind,
DLON 0.0053 and DLAT 0.0201, described there as a median measured over 253
matched points. The mechanism was right and the number was about a third of
what it needed to be: a median of nearest-vertex offsets is biased toward zero
along a coastline, because the nearest vertex is usually the one straight out
to sea. This is fitted instead -- the offset that minimises the median distance
between the two coasts, searched over a grid.

WHAT IT BUYS, measured: the median distance from Natural Earth's coast falls
from 2.70 km to 1.51 km, the mean from 3.00 to 1.71, the 90th percentile from
5.67 to 3.20. Stations standing on land go from 799 of 850 to 828.

1.51 km is about the tracing's own floor -- a pixel is a kilometre -- so this
recovers most of what can be recovered without re-tracing. A shift allowed to
grow with latitude was tried and is no better at the median and worse at the
90th, so a single constant is the right instrument.

WHAT IT COSTS. Korea's overlap with Manchuria along the Yalu and the Tumen
widens from 387 km2 to about 700 km2 -- a band from roughly 280 m to 500 m
along 1,400 km of river frontier. It is overlap and not a gap, so it shows as
the frontier line sitting a little further from the water rather than as sea
leaking between two countries.

AND ULLEUNGDO DOES NOT MOVE. The island is drawn a second time, finely, in
`japan-empire-map-fine.svg` from a different source, and that copy is not
ours to shift. Moving the province file's copy would put the two 4 km apart.
It is the only ring in the file east of 130.3E, so it is left where it is.
"""
import io
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
TRACED = os.path.join(CACHE, "korea_13_provinces_traced.json")
OUT = os.path.join(CACHE, "korea_13_provinces.json")

# Fitted against Natural Earth over 943 matched coast vertices; see the module
# docstring. 0.036 degrees of latitude is 3.98 km, 0.010 of longitude is
# 0.88 km at this latitude.
DLON, DLAT = 0.010, 0.036

# Everything east of this is Ulleungdo, which the fine layer draws from its own
# source and which therefore stays where it is.
KEEP_EAST_OF = 130.3


def shift_rings(feats, dlon, dlat):
    moved = held = 0
    for f in feats:
        polys = f["geometry"]["coordinates"]
        for poly in polys:
            for i, ring in enumerate(poly):
                if min(p[0] for p in ring) > KEEP_EAST_OF:
                    held += 1
                    continue
                poly[i] = [[round(p[0] + dlon, 5), round(p[1] + dlat, 5)]
                           for p in ring]
                moved += 1
    return moved, held


def main():
    if not os.path.exists(TRACED):
        raise SystemExit(
            "no %s -- copy the current korea_13_provinces.json to it first, so\n"
            "there is an unshifted original to come back to." % TRACED)
    revert = "--revert" in sys.argv
    write = "--write" in sys.argv or revert
    dlon, dlat = (0.0, 0.0) if revert else (DLON, DLAT)

    with io.open(TRACED, encoding="utf-8") as fh:
        data = json.load(fh)
    moved, held = shift_rings(data["features"], dlon, dlat)

    sys.stderr.write(
        "korea: %+0.3f lon %+0.3f lat (%.2f km east, %.2f km north)\n"
        % (dlon, dlat, dlon * 111.32 * 0.788, dlat * 110.57))
    sys.stderr.write("  %d rings moved, %d left where they are (east of %.1fE)\n"
                     % (moved, held, KEEP_EAST_OF))
    if not write:
        sys.stderr.write("  nothing written; pass --write\n")
        return
    tmp = OUT + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh)
    shutil.move(tmp, OUT)
    sys.stderr.write("  wrote %s%s\n" % (os.path.relpath(OUT, os.path.dirname(HERE)),
                                         " (unshifted)" if revert else ""))


main()
