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


def keep_whole_islands(segs, wanted):
    """Extend a selection to every piece of the same coastline.

    The sources cap a line at a thousand vertices, so an island's coast is a
    run of open pieces that only mean anything joined end to end. Keeping the
    pieces that fall in a window and dropping the rest breaks the run: New
    Britain, the largest island in the Pacific file at 35,592 km², reaches
    148.31 E and the window began at 148.50, so one piece of it was dropped,
    the ring would not close, and the whole island silently disappeared from
    the map. Anything sharing an endpoint with something wanted is wanted too.
    """
    ends = {}
    for i, s in enumerate(segs):
        for p in (tuple(s[0]), tuple(s[-1])):
            ends.setdefault(p, []).append(i)
    keep = set(wanted)
    stack = list(wanted)
    while stack:
        i = stack.pop()
        for p in (tuple(segs[i][0]), tuple(segs[i][-1])):
            for j in ends.get(p, ()):
                if j not in keep:
                    keep.add(j)
                    stack.append(j)
    return keep


def main():
    for trimmed, _ in FINE_FILES:
        src = os.path.join(CACHE, trimmed.replace("-islands.geojson", ".geojson"))
        if not os.path.exists(src):
            sys.stderr.write(f"note: {os.path.basename(src)} not here, skipped\n")
            continue
        with open(src) as fh:
            data = json.load(fh)
        # Every line in the file, flat, so the open pieces of one coastline can
        # be followed from one to the next whichever feature they arrived in
        segs, closed_of = [], []
        for f in data["features"]:
            g = f.get("geometry") or {}
            got = g.get("coordinates") or []
            if g.get("type") == "LineString":
                got = [got]
            elif g.get("type") != "MultiLineString":
                continue
            for s in got:
                if len(s) < 3:
                    continue
                pts = [(c[0], c[1]) for c in s]
                segs.append(pts)
                closed_of.append(pts[0] == pts[-1])

        wanted = set()
        for i, pts in enumerate(segs):
            if not in_windows(pts):
                continue
            # a ring the build would drop as a speck need not be carried at all
            if closed_of[i] and km2(pts) < FINE_MIN_KM2:
                continue
            wanted.add(i)
        # and with them, the rest of any coastline they are part of
        opens = [i for i, c in enumerate(closed_of) if not c]
        if opens:
            sub = [segs[i] for i in opens]
            back = {n: i for n, i in enumerate(opens)}
            picked = keep_whole_islands(
                sub, {n for n, i in back.items() if i in wanted})
            for n in picked:
                wanted.add(back[n])

        feats, lines, verts = [], 0, 0
        keep = []
        for i in sorted(wanted):
            pts = segs[i]
            simp = thin(pts, PRE_TOL)
            if closed_of[i] and simp[0] != simp[-1]:
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
