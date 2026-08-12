#!/usr/bin/env python3
"""Cut the OSM coastline extracts down to what the map actually uses.

    python3 tools/trim_fine_sources.py

The two files this reads are 11 MB and 44 MB of survey-grade coastline. The map
can never show anything finer than about half a kilometre, uses only a dozen
windows out of them, and throws away every island under five hectares. Carrying
the originals in the repository would put 55 MB into every clone for ever, so
the parts that can be drawn are written to `*-islands.geojson` — 683 KB and
89 KB — and those are what the build reads and what is committed.

What this costs, stated plainly. Douglas-Peucker at 0.00015 degrees moves no
point more than about seventeen metres; the build then thins at 0.002 degrees,
about two hundred and twenty, and the map cannot resolve better than four
hundred and fifty at its deepest zoom. So the drawn coastline is the same
coastline — the same hundred and seventy islands, differing by a fraction of a
pixel — but it is not byte-for-byte what the full sources give, and this is the
reason. The originals are gitignored; keep them if you want to widen the
windows in `FINE_GROUPS`, and re-run this afterwards.
"""

import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")

sys.path.insert(0, HERE)
from build_map import FINE_GROUPS, FINE_MIN_KM2, FINE_FILES  # noqa: E402

PAD = 0.05          # degrees of slack round each window
PRE_TOL = 0.00015   # about 17 m; the build itself thins at 0.002, about 220 m


def in_windows(seg):
    for x, y in seg:
        for _, _, x0, y0, x1, y1 in FINE_GROUPS:
            if x0 - PAD <= x <= x1 + PAD and y0 - PAD <= y <= y1 + PAD:
                return True
    return False


def km2(ring):
    a = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % len(ring)]
        a += x0 * y1 - x1 * y0
    lat = sum(p[1] for p in ring) / len(ring)
    return abs(a / 2) * (111.32 ** 2) * math.cos(math.radians(lat))


def thin(pts, tol):
    n = len(pts)
    if n < 3:
        return pts
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    t2 = tol * tol
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        dd = dx * dx + dy * dy
        best, bi = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if dd == 0:
                d = (px - ax) ** 2 + (py - ay) ** 2
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / dd
                t = 0.0 if t < 0 else (1.0 if t > 1 else t)
                d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2
            if d > best:
                best, bi = d, i
        if best > t2:
            keep[bi] = True
            stack.append((a, bi))
            stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]


def main():
    for trimmed, _ in FINE_FILES:
        src = os.path.join(CACHE, trimmed.replace("-islands.geojson", ".geojson"))
        if not os.path.exists(src):
            sys.stderr.write(f"note: {os.path.basename(src)} not here, skipped\n")
            continue
        with open(src) as fh:
            data = json.load(fh)
        feats, lines, verts = [], 0, 0
        for f in data["features"]:
            g = f.get("geometry") or {}
            segs = g.get("coordinates") or []
            if g.get("type") == "LineString":
                segs = [segs]
            elif g.get("type") != "MultiLineString":
                continue
            keep = []
            for s in segs:
                if len(s) < 3 or not in_windows(s):
                    continue
                pts = [(c[0], c[1]) for c in s]
                closed = pts[0] == pts[-1]
                # a ring the build would drop as a speck need not be carried;
                # open pieces are all kept, because they have to stitch
                if closed and km2(pts) < FINE_MIN_KM2:
                    continue
                simp = thin(pts, PRE_TOL)
                if closed and simp[0] != simp[-1]:
                    simp.append(simp[0])
                keep.append([[round(x, 6), round(y, 6)] for x, y in simp])
                lines += 1
                verts += len(simp)
            if keep:
                feats.append({"type": "Feature", "properties": {},
                              "geometry": {"type": "MultiLineString",
                                           "coordinates": keep}})
        dst = os.path.join(CACHE, trimmed)
        with open(dst, "w") as fh:
            json.dump({"type": "FeatureCollection", "features": feats}, fh,
                      separators=(",", ":"))
        sys.stderr.write(
            f"wrote {os.path.basename(dst)}: {lines} lines, {verts} vertices, "
            f"{os.path.getsize(dst) // 1024} KB "
            f"(from {os.path.getsize(src) // (1024 * 1024)} MB)\n")


if __name__ == "__main__":
    main()
