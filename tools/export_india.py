#!/usr/bin/env python3
"""British India as a polygon, in the two shapes the map draws it.

    python3 tools/export_india.py

Writes two downloads into `deploy/gis/`, both one feature in lon/lat:

    india-1931.geojson          the 1931 tracing alone: the provinces and the
                                princely states as one outline, with the French
                                and Portuguese settlements inland of it as
                                holes. What the December 1942 map calls British
                                India (`britishindia` in texts/territories/1942.csv,
                                atom `india`).
    british-india-1930.geojson  the 1930 map's British India: the same outline
                                with Burma and the Andaman and Nicobar Islands
                                (`britishindia` in 1930.csv, atoms `india
                                andaman burma saharat`).

WHY A SCRIPT OF ITS OWN, AND NOT `build_map.py --export`. That export writes
every atom at once from the full build, and it wrote each ring as a polygon of
its own, so India's eleven settlement holes came out as eleven filled islands
over India. Here the sources are read directly and the polygon structure they
carry is kept: an outer ring and its holes stay one polygon.

THE SOURCES, which are the ones the build draws these atoms from:

    tools/cache/india-1931.geojson             INDIA_1931_FILE in build_map.py
    tools/cache/burma-modern-modified.geojson  BURMA_FILE — cut to meet the
                                               1931 tracing with no overlap
    tools/cache/admin0.geojson                 Natural Earth 1:10m; the
                                               Andamans are India's polygons in
                                               the box `split_india` uses

`saharat` is not added. It is the part of the Shan States Thailand took in
1942, drawn as an atom of its own so the later map can colour it; every one of
its pieces lies inside Burma's outline already, which this script checks.

Nothing is thinned and no coordinate is rounded. Vertex counts are printed so
that a change in a source shows.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", "cache")
OUT = os.path.join(ROOT, "deploy", "gis")

# the box `split_india` in build_map.py sends to the `andaman` atom
ANDAMAN_BOX = (91.0, 5.0, 95.5, 14.5)


def load(name):
    with open(os.path.join(CACHE, name), encoding="utf-8") as fh:
        return json.load(fh)


def polygons(geom):
    """A geometry as a list of polygons, each [outer, hole, ...]."""
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return list(geom["coordinates"])
    raise ValueError("not a polygon: %s" % geom["type"])


def area2(ring):
    """Twice the signed area; positive when anticlockwise."""
    return sum(ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
               for i in range(len(ring) - 1))


def closed(ring):
    ring = [list(p[:2]) for p in ring]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return ring


def rfc7946(poly):
    """Outer ring anticlockwise, holes clockwise, every ring closed."""
    out = []
    for i, ring in enumerate(poly):
        ring = closed(ring)
        a = area2(ring)
        if (i == 0 and a < 0) or (i > 0 and a > 0):
            ring = ring[::-1]
        out.append(ring)
    return out


def centroid(ring):
    return (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))


def inside(pt, ring):
    x, y = pt
    hit = False
    for i in range(len(ring) - 1):
        (x1, y1), (x2, y2) = ring[i][:2], ring[i + 1][:2]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            hit = not hit
    return hit


def dissolve(polys):
    """Polygons that share edges vertex for vertex, as one set of polygons.

    Edge cancellation, as build_burma.py and build_indochina.py do it: every
    outer ring goes in anticlockwise, so an edge two polygons share appears
    once in each direction and both copies are dropped. What is left chains
    into rings; anticlockwise ones are outers and clockwise ones are holes
    the dissolve opened (a gap along a seam). The holes the inputs already
    had are kept, and every hole goes to the outer that contains it.
    """
    edges = {}
    for p in polys:
        r = p[0]
        for k in range(len(r) - 1):
            a, b = tuple(r[k]), tuple(r[k + 1])
            if (b, a) in edges:
                del edges[(b, a)]
            else:
                edges[(a, b)] = True
    nxt = {}
    for a, b in edges:
        if a in nxt:
            raise SystemExit("dissolve: two edges leave %r; the seam is not "
                             "clean" % (a,))
        nxt[a] = b
    rings = []
    while nxt:
        start, cur = next(iter(nxt.items()))
        ring = [list(start)]
        del nxt[start]
        while cur != start:
            ring.append(list(cur))
            cur = nxt.pop(cur)
        ring.append(list(start))
        rings.append(ring)
    outers = [r for r in rings if area2(r) > 0]
    holes = [r for r in rings if area2(r) < 0] + [h for p in polys for h in p[1:]]
    out = [[o] for o in outers]
    for h in holes:
        home = [q for q in out if inside(h[0], q[0])]
        if len(home) != 1:
            raise SystemExit("dissolve: a hole at %r has %d outers" % (h[0], len(home)))
        home[0].append(h)
    return out


def verts(polys):
    return sum(len(r) for p in polys for r in p)


def feature(polys, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": "MultiPolygon" if len(polys) > 1 else "Polygon",
                         "coordinates": polys if len(polys) > 1 else polys[0]}}


def write(name, feat):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "features": [feat]}, fh,
                  ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    return os.path.getsize(path)


def main():
    india = [rfc7946(p) for f in load("india-1931.geojson")["features"]
             for p in polygons(f["geometry"])]
    burma = [rfc7946(p) for f in load("burma-modern-modified.geojson")["features"]
             for p in polygons(f["geometry"])]
    ne = [f for f in load("admin0.geojson")["features"]
          if f["properties"].get("ADMIN") == "India"]
    if len(ne) != 1:
        raise SystemExit("Natural Earth: expected one India, found %d" % len(ne))
    x0, y0, x1, y1 = ANDAMAN_BOX
    andaman = []
    for p in polygons(ne[0]["geometry"]):
        cx, cy = centroid(p[0])
        if x0 < cx < x1 and y0 < cy < y1:
            andaman.append(rfc7946(p))

    # Saharat must add nothing: every piece inside Burma's outline.
    land = os.path.join(OUT, "land.geojson")
    if os.path.exists(land):
        with open(land, encoding="utf-8") as fh:
            sah = [f for f in json.load(fh)["features"]
                   if f["properties"].get("atom") == "saharat"]
        for f in sah:
            for p in polygons(f["geometry"]):
                c = centroid(p[0])
                if not any(inside(c, q[0]) for q in burma):
                    raise SystemExit("a Saharat piece at %.2f, %.2f is outside "
                                     "Burma's outline; add it here" % c)

    holes = sum(len(p) - 1 for p in india)
    # The map the outline was traced from is not recorded in the repository;
    # say only what is known until the author supplies it.
    src = "British India: hand-traced for this map as it stood in 1931."
    a = feature(india, {
        "name": "British India, 1931",
        "atom": "india",
        "includes": "the provinces and the princely states",
        "excludes": "Burma; the Andaman and Nicobar Islands; Sikkim, Nepal and "
                    "Bhutan; the French and Portuguese settlements",
        "source": src,
    })
    whole = dissolve(india + burma)
    b = feature(whole + andaman, {
        "name": "British India, 1930 (including Burma)",
        "atoms": "india burma andaman",
        "includes": "the provinces and the princely states, Burma, and the "
                    "Andaman and Nicobar Islands",
        "excludes": "Sikkim, Nepal and Bhutan; the French and Portuguese "
                    "settlements",
        "source": src + " Burma: a modern outline cut to meet that tracing. "
                  "The Andaman and Nicobar Islands: Natural Earth 1:10m.",
        "note": "India and Burma share their frontier vertex for vertex and are "
                "dissolved into one outline along it.",
    })
    na = write("india-1931.geojson", a)
    nb = write("british-india-1930.geojson", b)
    sys.stderr.write(
        "india-1931.geojson          %d polygon, %d holes, %d vertices, %d KB\n"
        "british-india-1930.geojson  %d polygons (India and Burma dissolved %d, "
        "Andamans %d), %d holes, %d vertices of %d, %d KB\n"
        % (len(india), holes, verts(india), na // 1024,
           len(whole) + len(andaman), len(whole), len(andaman),
           sum(len(p) - 1 for p in whole), verts(whole + andaman),
           verts(india + burma + andaman), nb // 1024))


if __name__ == "__main__":
    main()
