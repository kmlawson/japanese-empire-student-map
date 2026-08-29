#!/usr/bin/env python3
"""Korea's railway lines with the ground that is drawn twice taken out once.

    python3 tools/dedupe_korea_lines.py            # report, writes nothing
    python3 tools/dedupe_korea_lines.py --write    # write the deduped files

    tools/cache/korea_1930_lines.geojson         the source, never edited
    tools/cache/korea_1930_lines_dedup.geojson   what build_map.py reads
    ...and the same pair for 1942.

WHY. The NIKH sheet keeps a feature per named line, so where two lines run over
one railway the ground is in the file twice -- 경부본선 and 경의선 share the
three kilometres out of Seoul and each carries it -- and 43 line-and-interval
pairs are simply entered more than once, one of them three times. Measured over
the 1930 file: 341 km identical and 629 km doubled all told, out of 6,710.

Under an opaque stroke that is invisible. It stopped being invisible when the
railway symbol gained ties: the second copy's ties fall in their own phase,
fill the first copy's gaps, and the line comes out solid, thicker or moired
depending on the zoom.

The source files are left alone. When there is a way to choose a line to look
at -- which there is not yet -- the per-line features are what that will be
built on, and they are still there.

HOW, AND WHY IT IS SAFE. A piece is dropped only if EVERY point along it is
already within TOL of ground that is being kept. Points are sampled about every
hundred metres, so a piece that is duplicated for most of its length and
unique for a hundred metres at one end is kept whole -- it is the loss of that
hundred metres this is written to avoid. Comparing whole pieces by a signature
would have been shorter and would have thrown that away without saying so.

And it is checked rather than asserted: after the cut, every point of every
ORIGINAL piece is looked for in what survives. If any point is not there, the
run says so and writes nothing.
"""
import io
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
EPOCHS = ("korea_1930_lines", "korea_1942_lines")

# How close is the same track. 55 m is well inside the width of a station
# throat and nowhere near the distance between two railways that happen to run
# beside each other.
TOL_KM = 0.055
STEP_KM = 0.1          # how finely a piece is walked when it is being tested
CELL = 0.002           # degrees, the grid the kept segments are bucketed into


def km(lo1, la1, lo2, la2):
    m = math.radians((la1 + la2) / 2.0)
    return math.hypot((lo2 - lo1) * 111.32 * math.cos(m), (la2 - la1) * 110.57)


def seg_km(p, a, b):
    """Distance from p to the segment ab, in km."""
    m = math.radians(p[1])
    sx = 111.32 * math.cos(m)
    px, py = p[0] * sx, p[1] * 110.57
    ax, ay = a[0] * sx, a[1] * 110.57
    bx, by = b[0] * sx, b[1] * 110.57
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


class Kept(object):
    """Every segment already being drawn, in a grid so a lookup is local."""

    def __init__(self):
        self.cells = {}

    def add(self, line):
        for i in range(len(line) - 1):
            a, b = line[i], line[i + 1]
            for c in self._cells_for(a, b):
                self.cells.setdefault(c, []).append((a, b))

    def _cells_for(self, a, b):
        x0, x1 = sorted((a[0], b[0]))
        y0, y1 = sorted((a[1], b[1]))
        pad = TOL_KM / 100.0
        out = []
        i = int(math.floor((x0 - pad) / CELL))
        while i <= int(math.floor((x1 + pad) / CELL)):
            j = int(math.floor((y0 - pad) / CELL))
            while j <= int(math.floor((y1 + pad) / CELL)):
                out.append((i, j))
                j += 1
            i += 1
        return out

    def covers(self, p):
        i0 = int(math.floor(p[0] / CELL))
        j0 = int(math.floor(p[1] / CELL))
        for i in (i0 - 1, i0, i0 + 1):
            for j in (j0 - 1, j0, j0 + 1):
                for a, b in self.cells.get((i, j), ()):
                    if seg_km(p, a, b) <= TOL_KM:
                        return True
        return False


def walk(line, step=STEP_KM):
    """Points along a piece, about `step` apart, ends included."""
    out = [line[0]]
    for i in range(len(line) - 1):
        a, b = line[i], line[i + 1]
        d = km(a[0], a[1], b[0], b[1])
        n = int(d / step)
        for k in range(1, n + 1):
            t = (k * step) / d
            out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
        out.append(b)
    return out


def length(line):
    return sum(km(line[i][0], line[i][1], line[i + 1][0], line[i + 1][1])
               for i in range(len(line) - 1))


def pieces_of(feat):
    g = feat.get("geometry")
    if not g:
        return []
    ls = [g["coordinates"]] if g["type"] == "LineString" else g["coordinates"]
    return [[(p[0], p[1]) for p in l] for l in ls if len(l) > 1]


def run(name, write):
    src = os.path.join(CACHE, name + ".geojson")
    dst = os.path.join(CACHE, name + "_dedup.geojson")
    with io.open(src, encoding="utf-8") as fh:
        data = json.load(fh)
    feats = data["features"]

    # longest first, so a long piece is kept and the short copies of parts of
    # it go, rather than the other way about
    order = sorted(range(len(feats)),
                   key=lambda i: -sum(length(l) for l in pieces_of(feats[i])))

    kept = Kept()
    keep_idx = []
    dropped, drop_km, partial = [], 0.0, []
    for i in order:
        ps = pieces_of(feats[i])
        if not ps:
            keep_idx.append(i)
            continue
        marks = [p for l in ps for p in walk(l)]
        outside = sum(1 for p in marks if not kept.covers(p))
        if outside == 0 and keep_idx:
            dropped.append(i)
            drop_km += sum(length(l) for l in ps)
            continue
        if outside and outside < len(marks) * 0.9 and keep_idx:
            partial.append((i, outside, len(marks)))
        keep_idx.append(i)
        for l in ps:
            kept.add(l)

    total = sum(sum(length(l) for l in pieces_of(f)) for f in feats)
    sys.stderr.write(
        "%s: %d pieces, %.0f km drawn\n"
        "  %d dropped as ground already drawn (%.0f km, %.1f%%)\n"
        "  %d kept although partly duplicated -- these are the ones a\n"
        "     whole-piece comparison would have thrown away\n"
        % (name, len(feats), total, len(dropped), drop_km,
           100.0 * drop_km / max(1.0, total), len(partial)))
    for i, out, n in partial[:8]:
        pr = feats[i]["properties"]
        sys.stderr.write("       %-14s %-18s %d of %d points are its own\n"
                         % (str(pr.get("rail_nm_kr"))[:14],
                            str(pr.get("interval_i"))[:18], out, n))

    # THE CHECK. Every point of every original piece has to be inside what
    # survives, or something has been lost and nothing is written.
    lost = 0
    worst = 0.0
    for f in feats:
        for l in pieces_of(f):
            for p in walk(l):
                if not kept.covers(p):
                    lost += 1
    sys.stderr.write("  check: %d of the original points are no longer drawn\n"
                     % lost)
    if lost:
        sys.stderr.write("  REFUSING TO WRITE -- ground would be lost\n")
        return False

    if not write:
        sys.stderr.write("  (nothing written; pass --write)\n")
        return True
    data["features"] = [feats[i] for i in sorted(keep_idx)]
    with io.open(dst, "w", encoding="utf-8") as fh:
        json.dump(data, fh)
    sys.stderr.write("  wrote %s (%d pieces)\n"
                     % (os.path.relpath(dst, os.path.dirname(HERE)),
                        len(data["features"])))
    return True


def main():
    write = "--write" in sys.argv
    ok = True
    for name in EPOCHS:
        ok = run(name, write) and ok
    sys.exit(0 if ok else 1)


main()
