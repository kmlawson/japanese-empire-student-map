#!/usr/bin/env python3
"""Pull a few windows of coastline out of the OSM split-coastlines shapefile.

    python3 tools/extract_coast.py <shapefile-stem> <out.geojson> [name=w,s,e,n ...]

The file is 876,182 linestrings and 1.2 GB, and reading it through the little
shapefile reader in this directory takes longer than the whole build. Every
polyline record in a .shp carries its own bounding box in its header, so this
reads the header, decides, and seeks past the geometry when the box misses —
which is 876,000 times out of 876,182.

The coastlines come as open lines, not polygons: OSM's coastline is a set of
ways, and the "split" files chop them into manageable pieces. Pieces that share
an end are chained back together here, and a chain whose two ends meet is a
closed island.
"""

import json
import os
import struct
import sys


def windows_from(args):
    out = []
    for a in args:
        name, box = a.split("=", 1)
        w, s, e, n = (float(v) for v in box.split(","))
        out.append((name, w, s, e, n))
    return out


def scan(stem, windows):
    """Every polyline whose box falls inside one of the windows, by window."""
    hits = {name: [] for name, _, _, _, _ in windows}
    path = stem + ".shp"
    size = os.path.getsize(path)
    kept = seen = 0
    with open(path, "rb") as fh:
        fh.seek(100)                       # past the file header
        while fh.tell() < size:
            head = fh.read(8)
            if len(head) < 8:
                break
            _num, words = struct.unpack(">ii", head)
            length = words * 2             # content length, in bytes
            start = fh.tell()
            kind = struct.unpack("<i", fh.read(4))[0]
            seen += 1
            if kind != 3:                  # not a polyline
                fh.seek(start + length)
                continue
            x0, y0, x1, y1 = struct.unpack("<4d", fh.read(32))
            who = None
            for name, w, s, e, n in windows:
                if x0 >= w and x1 <= e and y0 >= s and y1 <= n:
                    who = name
                    break
            if who is None:
                fh.seek(start + length)
                continue
            nparts, npoints = struct.unpack("<ii", fh.read(8))
            parts = struct.unpack(f"<{nparts}i", fh.read(4 * nparts))
            pts = struct.unpack(f"<{2 * npoints}d", fh.read(16 * npoints))
            for p in range(nparts):
                a = parts[p]
                b = parts[p + 1] if p + 1 < nparts else npoints
                line = [(pts[2 * i], pts[2 * i + 1]) for i in range(a, b)]
                if len(line) > 1:
                    hits[who].append(line)
                    kept += 1
            fh.seek(start + length)
    sys.stderr.write(f"{seen} records read, {kept} lines kept\n")
    return hits


def chain(lines, tol=1e-9):
    """Join lines that share an end. Returns (closed rings, open lines)."""
    def key(p):
        return (round(p[0] / tol) * tol, round(p[1] / tol) * tol)

    pool = [list(l) for l in lines]
    rings, open_lines = [], []
    while pool:
        cur = pool.pop()
        moved = True
        while moved:
            moved = False
            for i, other in enumerate(pool):
                if key(cur[-1]) == key(other[0]):
                    cur = cur + other[1:]
                elif key(cur[-1]) == key(other[-1]):
                    cur = cur + other[::-1][1:]
                elif key(cur[0]) == key(other[-1]):
                    cur = other + cur[1:]
                elif key(cur[0]) == key(other[0]):
                    cur = other[::-1] + cur[1:]
                else:
                    continue
                pool.pop(i)
                moved = True
                break
        if len(cur) > 3 and key(cur[0]) == key(cur[-1]):
            rings.append(cur[:-1])
        else:
            open_lines.append(cur)
    return rings, open_lines


def km2(ring):
    import math
    a = 0.0
    for i in range(len(ring)):
        p, q = ring[i], ring[(i + 1) % len(ring)]
        a += p[0] * q[1] - q[0] * p[1]
    lat = sum(p[1] for p in ring) / len(ring)
    return abs(a / 2) * (111.32 ** 2) * math.cos(math.radians(lat))


def main():
    args = [a for a in sys.argv[1:] if a != "--as-lines"]
    as_lines = "--as-lines" in sys.argv     # what the fine-coastline loader reads
    if len(args) < 3:
        sys.stderr.write(__doc__)
        return 2
    stem, out_path = args[0], args[1]
    windows = windows_from(args[2:])
    hits = scan(stem, windows)
    feats = []
    for name, _, _, _, _ in windows:
        rings, opens = chain(hits[name])
        rings.sort(key=km2, reverse=True)
        sys.stderr.write(
            f"{name}: {len(rings)} closed, {len(opens)} open; "
            f"largest {km2(rings[0]):.3f} km2\n" if rings else
            f"{name}: nothing\n")
        for r in rings:
            coords = [list(p) for p in r] + [list(r[0])]
            feats.append({
                "type": "Feature",
                "properties": {"group": name, "km2": round(km2(r), 4)},
                # The fine-coastline loader in build_map.py reads lines and
                # closes them itself; the atom loader reads polygons.
                "geometry": ({"type": "LineString", "coordinates": coords}
                             if as_lines else
                             {"type": "Polygon", "coordinates": [coords]}),
            })
    with open(out_path, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    sys.stderr.write(f"wrote {out_path}: {len(feats)} rings\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
