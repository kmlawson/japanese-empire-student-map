#!/usr/bin/env python3
"""Colonial Korea's thirteen provinces, at two resolutions.

    python3 tools/build_korea_provinces.py

Reads `tools/cache/provinces_1930_1942.geojson` -- the National Institute of
Korean History's historical administrative districts, 13 provinces and 1.66
million vertices -- and writes two files in the shape `build_map.py` already
reads:

    korea_13_provinces.json        the coarse set, drawn at every zoom
    korea_13_provinces_fine.json   the fine set, fetched only on a deep zoom
                                   into Korea

WHY TWO. The coarse file has to cost about what the Natural Earth outline it
replaces cost, because it is in the base sheet and every pan and every zoom
pays for it: that outline is 4,689 vertices. The fine file has no such
constraint at the opening view -- nobody fetches it until they are looking at
Korea -- but it does have a download to keep to, and 1.66 million vertices is
some 20 MB of path text.

WHAT IS THROWN AWAY, AND HOW MUCH.

Two different things, and the numbers for both are printed:

  * Islands under a floor. The source carries every rock: at the coarse
    tolerance a hundred-metre islet is a dot that cannot be told from a stray
    vertex, and there are thousands of them. The floor is an area, so what goes
    is decided by size rather than by which ring happened to be short.
  * Vertices, by Douglas-Peucker. The tolerances are in degrees and are chosen
    against what the map can show: the coarse one against the width of a line
    at the opening view, the fine one against half a pixel at the deepest zoom
    the map allows.

Neither is a judgement about what matters. Both are stated here, printed on
every run, and reversible by changing a number.
"""
import io
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
SRC = os.path.join(CACHE, "provinces_1930_1942.geojson")
OUT_COARSE = os.path.join(CACHE, "korea_13_provinces.json")
OUT_FINE = os.path.join(CACHE, "korea_13_provinces_fine.json")

# The thirteen 道, keyed by the hanja the source gives, named as the rest of
# this map names them: the Japanese reading of the period, which is what
# `texts/territories/sub-units/korea.csv` and the old traced file both use.
PROVINCES = {
    "江原道": "Kogen",
    "京畿道": "Keiki",
    "慶尙南道": "Keishonan",
    "慶尙北道": "Keishohoku",
    "全羅南道": "Zenranan",
    "全羅北道": "Zenrahoku",
    "忠淸南道": "Chuseinan",
    "忠淸北道": "Chuseihoku",
    "平安南道": "Heiannan",
    "平安北道": "Heianhoku",
    "咸鏡南道": "Kankyonan",
    "咸鏡北道": "Kankyohoku",
    "黃海道": "Kokai",
}

# What the two files are cut to. Degrees, and both are chosen against
# something the reader can see rather than against a file size:
#
#   0.010  MEASURED AGAINST WHAT IT REPLACES, not chosen for its looks. The
#          Natural Earth outline this takes over from is 4,689 vertices in the
#          base sheet, and the base sheet is what every pan and every zoom
#          pays for. At this tolerance the thirteen provinces come to 4,771 --
#          within two per cent of it -- so the opening view costs what it cost
#          before and the reader gets thirteen provinces for the same money.
#          In ground terms it is about 1.1 km, a fifth of a pixel at the
#          opening view.
#   0.0004 half a pixel at 250x, the deepest a desktop now goes. The same
#          reasoning TRACED_TOL in build_map.py uses for India and Taiwan, one
#          zoom level further in.
COARSE_TOL = 0.006
FINE_TOL = 0.0004

# And the islands. km², measured on the ring itself.
#
#   6.0  at the coarse tolerance an island of 6 km² is under three pixels at
#        the opening view. Below that the base sheet is drawing dots, and there
#        are four and a half thousand of them in this source.
#   0.05 five hectares, the same floor the fine coastlines elsewhere on this
#        map use (FINE_MIN_KM2 in build_map.py).
COARSE_MIN_KM2 = 1.0
FINE_MIN_KM2 = 0.05


def ring_km2(ring):
    """Area of a ring in square kilometres, on a sphere-ish approximation.

    Good to a per cent at these latitudes, which is far better than the
    decision it is being used for."""
    if len(ring) < 3:
        return 0.0
    lat0 = sum(p[1] for p in ring) / len(ring)
    k = math.cos(math.radians(lat0))
    a = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i - 1]
        x2, y2 = ring[i]
        a += (x1 * k) * y2 - (x2 * k) * y1
    return abs(a) / 2.0 * (111.32 ** 2)


def simplify(points, tol):
    """Douglas-Peucker, iterative so a ring of a hundred thousand points does
    not overflow the stack."""
    if len(points) < 3:
        return list(points)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi <= lo + 1:
            continue
        ax, ay = points[lo]
        bx, by = points[hi]
        dx, dy = bx - ax, by - ay
        den = dx * dx + dy * dy
        far, fard = -1, tol
        for i in range(lo + 1, hi):
            px, py = points[i]
            if den > 0:
                t = ((px - ax) * dx + (py - ay) * dy) / den
                t = 0.0 if t < 0 else (1.0 if t > 1 else t)
                d = math.hypot(px - (ax + dx * t), py - (ay + dy * t))
            else:
                d = math.hypot(px - ax, py - ay)
            if d > fard:
                far, fard = i, d
        if far >= 0:
            keep[far] = True
            stack.append((lo, far))
            stack.append((far, hi))
    return [p for p, k in zip(points, keep) if k]


def thin_ring(ring, tol):
    """A closed ring, thinned, and still closed and still a ring.

    A ring that simplification reduces to fewer than four points is not a
    shape any more and is dropped by the caller; keeping it would put a
    degenerate sliver in the path."""
    closed = ring[0] == ring[-1]
    pts = ring[:-1] if closed else ring[:]
    out = simplify(pts + [pts[0]], tol)
    if out and out[0] != out[-1]:
        out.append(out[0])
    return out if len(out) >= 4 else []


# ---------------------------------------------------------------------------
# A SHARED BOUNDARY IS SIMPLIFIED ONCE, OR IT STOPS BEING SHARED.
#
# The first version thinned every ring on its own. That is wrong and it looks
# wrong: Kōgen and Keiki run along the same line, Douglas-Peucker keeps a
# different subset of it for each, and the two drawn edges no longer meet.
# What the reader sees is a scatter of white gashes through the middle of the
# country -- ocean showing between two provinces that share a border.
#
# The source is topologically clean, which is what makes the fix possible:
# 42,625 of its 1.6 million points are shared by exactly two provinces (eleven
# by three), with identical coordinates. So each ring is cut into runs at the
# points where sharing starts or stops, every run is thinned once, and a run
# that two provinces walk -- one forwards, one backwards -- is thinned on its
# first appearance and reused on its second. Both provinces then draw the same
# line and there is nothing between them.
#
# The key is the two ends and the length. Two different boundaries with the
# same endpoints and the same number of points would collide; with coordinates
# to seven decimal places that is not a thing that happens.
def shared_edges(features):
    """The edges two provinces have in common.

    EDGES AND NOT POINTS, which is the whole of why this works. Counting shared
    *points* looks like it should be enough and is not: where two provinces run
    along one boundary, one of them may carry a vertex the other does not, and
    a run cut at points then ends in a different place for each of them. The
    first attempt at this cut 456 runs and reused none of them — every single
    boundary was still being thinned twice, independently, and the counter
    below is what said so.

    An edge is shared when both provinces have it, which is exactly the
    condition for the two of them to be drawing the same line. Where one has a
    vertex the other lacks, the edges either side differ, the stretch is not
    shared, and both draw their own — which is the truth about that stretch.
    """
    seen = {}
    for f in features:
        if not PROVINCES.get(f["properties"].get("name_cn") or ""):
            continue
        here = set()
        for poly in f["geometry"]["coordinates"]:
            for ring in poly:
                pts = ring[:-1] if ring[0] == ring[-1] else ring
                n = len(pts)
                for i in range(n):
                    a = (pts[i][0], pts[i][1])
                    b = (pts[(i + 1) % n][0], pts[(i + 1) % n][1])
                    here.add((a, b) if a <= b else (b, a))
        for e in here:
            seen[e] = seen.get(e, 0) + 1
    return {e for e, n in seen.items() if n > 1}


def shared_keep(edges, tol):
    """Thin the shared boundary network once, and say which points survive.

    THE DECISION IS PER POINT AND IS MADE HERE, not while walking a ring. Runs
    cut out of two neighbouring rings very nearly always match -- 196 of 221 --
    and the twenty-five that do not are long boundaries the two sides tokenise
    differently, which no amount of care over the key will fix. So the shared
    network is taken on its own, before any ring is looked at: its edges are
    chained into arcs between junctions, each arc is thinned once, and what
    comes out is a set of points that survive. A ring then keeps a shared point
    if it is in that set, whoever is drawing it. Two provinces cannot disagree
    about a decision neither of them made.
    """
    adj = {}
    for a, b in edges:
        adj.setdefault(a, []).append(b)
        adj.setdefault(b, []).append(a)
    nodes = [p for p, ns in adj.items() if len(ns) != 2]
    keep = set(nodes)
    seen = set()

    def walk(start, first):
        arc = [start, first]
        seen.add((start, first) if start <= first else (first, start))
        prev, cur = start, first
        while len(adj.get(cur, [])) == 2:
            nxt = [q for q in adj[cur] if q != prev]
            if not nxt:
                break
            nxt = nxt[0]
            e = (cur, nxt) if cur <= nxt else (nxt, cur)
            if e in seen:
                break
            seen.add(e)
            arc.append(nxt)
            prev, cur = cur, nxt
        return arc

    arcs = []
    for p in nodes:
        for q in adj[p]:
            e = (p, q) if p <= q else (q, p)
            if e not in seen:
                arcs.append(walk(p, q))
    # what is left is closed loops with no junction on them: an enclave's whole
    # boundary. Start one anywhere; the point it starts at is kept, which is
    # the only asymmetry and is the same for both sides because it is chosen
    # here rather than by either ring.
    for a, b in sorted(edges):
        e = (a, b)
        if e in seen:
            continue
        keep.add(a)
        arcs.append(walk(a, b))
    for arc in arcs:
        keep.update(simplify(arc, tol))
    return keep


def thin_shared(ring, tol, edges, keep, cache, tally):
    """A closed ring thinned run by run, sharing what is shared.

    Cut at every change of degree, so a run is a stretch belonging to the same
    set of provinces from end to end. Two provinces walking one boundary then
    produce the same run — one forwards, one backwards — and the second gets
    the first one's answer.
    """
    closed = ring[0] == ring[-1]
    pts = ring[:-1] if closed else ring[:]
    if len(pts) < 3:
        return []
    n = len(pts)

    def shared(i):
        a, b = pts[i], pts[(i + 1) % n]
        return ((a, b) if a <= b else (b, a)) in edges

    flag = [shared(i) for i in range(n)]      # one per edge, not per point
    # start the walk where the sharing changes, so a seam between two runs is
    # never buried in the middle of the first one
    start = 0
    for i in range(n):
        if flag[i] != flag[i - 1]:
            start = i
            break
    runs, cur, curf = [], [pts[start]], flag[start]
    for j in range(n):
        i = (start + j) % n
        cur.append(pts[(i + 1) % n])
        nxt = flag[(i + 1) % n]
        if j < n - 1 and nxt != curf:
            runs.append((curf, cur))
            cur, curf = [pts[(i + 1) % n]], nxt
    runs.append((curf, cur))

    out = []
    for is_shared, run in runs:
        if len(run) < 2:
            continue
        if is_shared:
            # every point the network kept, plus the two ends of this run so
            # that it still joins what comes before and after it
            piece = [q for j, q in enumerate(run)
                     if q in keep or j == 0 or j == len(run) - 1]
            tally["shared"] += 1
            tally["points"] += len(piece)
        else:
            piece = simplify(run, tol)
        if out and piece and out[-1] == piece[0]:
            piece = piece[1:]
        out.extend(piece)
    if out and out[0] != out[-1]:
        out.append(out[0])
    return out if len(out) >= 4 else []


def convert(features, tol, min_km2, label):
    edges = shared_edges(features)
    keep = shared_keep(edges, tol)
    cache = {}
    tally = {"shared": 0, "points": 0}
    out, kept, dropped, vin, vout, small = [], 0, 0, 0, 0, 0
    for f in features:
        name = PROVINCES.get(f["properties"].get("name_cn") or "")
        if not name:
            continue
        polys = []
        geom = f["geometry"]
        raw = (geom["coordinates"] if geom["type"] == "MultiPolygon"
               else [geom["coordinates"]])
        for poly in raw:
            outer = poly[0]
            vin += sum(len(r) for r in poly)
            if ring_km2(outer) < min_km2:
                small += 1
                continue
            rings = []
            for i, ring in enumerate(poly):
                # a hole is kept only if it is still a hole at this tolerance
                if i and ring_km2(ring) < min_km2:
                    continue
                thin = thin_shared([tuple(p[:2]) for p in ring], tol,
                                   edges, keep, cache, tally)
                if thin:
                    rings.append([list(p) for p in thin])
            if rings:
                polys.append(rings)
                kept += 1
                vout += sum(len(r) for r in rings)
        out.append({"type": "Feature",
                    "properties": {"shapeName": name},
                    "geometry": {"type": "MultiPolygon", "coordinates": polys}})
    print("%-6s %2d provinces, %5d rings kept, %5d islands under %.2f km2 "
          "dropped" % (label, len(out), kept, small, min_km2))
    print("       %d shared boundary edges, thinned once into %d kept points; "
          "%d runs drawn from them" % (len(edges), len(keep), tally["shared"]))
    print("       %8d vertices in, %7d out (%.2f%% kept), tolerance %.4f deg"
          % (vin, vout, 100.0 * vout / max(1, vin), tol))
    return {"type": "FeatureCollection", "features": out}


def main():
    if not os.path.exists(SRC):
        sys.exit("missing %s" % SRC)
    with io.open(SRC, encoding="utf-8") as fh:
        src = json.load(fh)
    have = {f["properties"].get("name_cn") for f in src["features"]}
    missing = sorted(set(PROVINCES) - have)
    if missing:
        sys.exit("the source is missing: " + ", ".join(missing))
    for path, tol, floor, label in ((OUT_COARSE, COARSE_TOL, COARSE_MIN_KM2, "coarse"),
                                    (OUT_FINE, FINE_TOL, FINE_MIN_KM2, "fine")):
        doc = convert(src["features"], tol, floor, label)
        with io.open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False)
        print("       wrote %s (%.1f MB)"
              % (os.path.relpath(path, os.path.dirname(HERE)),
                 os.path.getsize(path) / 1048576.0))


if __name__ == "__main__":
    main()
