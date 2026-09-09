"""Clip the detailed Karafuto coastline at the 50th parallel.

**This is not part of the build.** It was run once and its output *is*
`data/karafuto/karafuto-coast-detailed.geojson` -- the stored file is already
cut at the parallel, so nothing re-clips 25,734 vertices on every build. It is
kept because it is the record of how that cut was made, and because a replaced
source would need the same treatment:

    cp <new source> data/karafuto/karafuto-coast-detailed.geojson
    python3 tools/build_kf_coast.py     # writes the clipped file beside it
    # then move it over the source, as was done here

    python3 tools/build_kf_coast.py

The source is `data/karafuto/karafuto-coast-detailed.geojson`, traced at a
resolution the map's own outline is nowhere near: 25,865 vertices for southern
Sakhalin against the 446 the coarse sheet draws, and 1,581 more for Moneron
Island. It is the whole island as it is today, so it runs north past the
frontier to 50.64 -- and Karafuto stops at 50.0000, which is where the coarse
shape stops and where the border was from 1905 to 1945. Drawn unclipped it
would put Japanese territory across the Soviet half.

So the polygons are cut against the half-plane `lat <= 50`. Sutherland-Hodgman
is exact for that: the clip region is a half-plane, which is convex, and the
only new vertices are the two where a ring crosses the line. Nothing is moved
and nothing is thinned -- the whole point of this file is the detail, and
`TRACED_TOL` in CLAUDE.md says a hand-traced edge is not to be simplified.

What the clip is *not* is a redrawing of the frontier. The 50th parallel is a
straight line in longitude and latitude and this writes it as one; the coarse
shape does the same.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "data", "karafuto", "karafuto-coast-detailed.geojson")
OUT = os.path.join(ROOT, "data", "karafuto", "karafuto-coast-1905-1945.geojson")

# The frontier. Not a tolerance and not a guess: the coarse Karafuto shape's
# northern edge is exactly this, and the two have to agree or the fine coast
# would show a sliver of itself above the shape it supersedes.
BORDER = 50.0


def clip_ring(ring, lat):
    """The ring, cut to `lat` and below. Sutherland-Hodgman on one edge."""
    out = []
    n = len(ring)
    if not n:
        return out
    for i in range(n):
        cur = ring[i]
        prv = ring[i - 1]
        cur_in = cur[1] <= lat
        prv_in = prv[1] <= lat
        if cur_in != prv_in:
            # where the edge meets the parallel; guard the horizontal case,
            # which cannot actually reach here (one end is above and one below)
            dy = cur[1] - prv[1]
            t = (lat - prv[1]) / dy if dy else 0.0
            out.append([prv[0] + (cur[0] - prv[0]) * t, lat])
        if cur_in:
            out.append([cur[0], cur[1]])
    return out


def closed(ring):
    if len(ring) > 2 and ring[0] != ring[-1]:
        ring = ring + [ring[0]]
    return ring


def count(geom):
    t, c = geom["type"], geom["coordinates"]
    if t == "Polygon":
        return sum(len(r) for r in c)
    if t == "MultiPolygon":
        return sum(len(r) for p in c for r in p)
    return 0


def main():
    if not os.path.exists(SRC):
        sys.exit("no source at " + SRC)
    doc = json.load(open(SRC, encoding="utf-8"))
    feats, before, after, dropped = [], 0, 0, 0
    for ft in doc.get("features", []):
        g = ft["geometry"]
        polys = (g["coordinates"] if g["type"] == "MultiPolygon"
                 else [g["coordinates"]])
        before += count(g)
        kept = []
        for poly in polys:
            rings = []
            for j, ring in enumerate(poly):
                cut = clip_ring(ring, BORDER)
                if len(cut) < 4:
                    # an outer ring entirely north of the line takes its holes
                    # with it; a hole entirely north is simply gone
                    if j == 0:
                        rings = []
                        break
                    dropped += 1
                    continue
                rings.append(closed(cut))
            if rings:
                kept.append(rings)
        if not kept:
            continue
        props = dict(ft.get("properties") or {})
        props.setdefault("atom", "karafuto")
        props["note"] = ("Southern Sakhalin as traced in detail, cut at the "
                         "50th parallel, which was the frontier from 1905 to "
                         "1945.")
        feats.append({"type": "Feature",
                      "geometry": {"type": "MultiPolygon", "coordinates": kept},
                      "properties": props})
        after += sum(len(r) for p in kept for r in p)

    out = {"type": "FeatureCollection", "features": feats}
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False)
    lats = [p[1] for ft in feats
            for poly in ft["geometry"]["coordinates"]
            for r in poly for p in r]
    lons = [p[0] for ft in feats
            for poly in ft["geometry"]["coordinates"]
            for r in poly for p in r]
    print("%d features, %d vertices in, %d out (%d ring(s) dropped north of "
          "the line)" % (len(feats), before, after, dropped))
    print("bbox %.4f,%.4f .. %.4f,%.4f" % (min(lons), min(lats),
                                           max(lons), max(lats)))
    print("wrote " + OUT)


if __name__ == "__main__":
    main()
