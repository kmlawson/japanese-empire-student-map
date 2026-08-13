"""Republican provinces from the Commons AMS-derived SVG maps.

Run by hand, like tools/trim_fine_sources.py, and its output is what the build
reads:

    python3 tools/roc_provinces.py

The source is a Wikimedia Commons SVG by User:Lilauid, CC BY-SA 4.0, traced
from the US Army Map Service 1:250,000 China series (L500/L531/L581), the AMS
1:50,000 Fukien sheets and the ROC 1301 series at 1:1,000,000. It is a picture
rather than a dataset: no CRS, no metadata, boundaries drawn as open arcs and
areas nowhere at all. Three things have to happen to make provinces of it.

**Georeference.** The frame comes from the base map it derives from, Uwe
Dedering's File:China edcp location map.svg: equidistant conic, central
meridian 104 E, central parallel 36 N, standard parallels 30 N and 42 N, and
the central meridian running from 57.0 N at the top of the frame to 17.96 N at
the bottom. That fixes the scale at 4,618.1 m to the SVG unit, and it checks
itself: it puts 37 deg 28.8 min at the vertical centre of the frame against the
37 deg 29 min the page states. Two things the page does not give were fitted
against Natural Earth's coastline — the central meridian sits 12.0 units right
of the viewBox centre, and the frame's top edge is 2,500 m north of 57.0 N.
With those the drawn coastline lands a median of 0.59 km from Natural Earth's.

**Polygonise.** 省界 (between provinces), 國界 (round the country) and 海岸線
(the sea) are noded into a planar arrangement and its faces traversed. Seven
coastal provinces do carry closed fills, but the interior ones are lines only,
so this is the general answer rather than a special case.

**Name.** Each face is named by asking the ENP-China sheet which province its
interior point falls in. ENP's positions are the thing being replaced — a
median of 9 km out, and 27 km on the Shaanxi-Shanxi line — but its identities
are right, and identity is all that is being borrowed.

Measured on the result: 28 provinces, 49,630 vertices against ENP's 20,400 for
the whole sheet, and the interior provinces improve six to thirteen times —
Shanxi from 21.4 km per vertex to 1.69, Henan 20.0 to 1.66, Hebei 11.0 to 1.40.
The Shaanxi-Shanxi boundary now runs a median of 0.85 km from the Yellow River
it is supposed to follow, where ENP's runs 27.02 km from it.
"""
import collections
import json
import math
import os
import re
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import shapefile  # noqa: E402

CACHE = os.path.join(HERE, "cache")
SVG_IN = os.path.join(os.path.dirname(HERE), "exports", "downloaded",
                      "Republic_of_China_edcp_location_map_1936.svg")
GEOJSON_OUT = os.path.join(CACHE, "roc-provinces-1936.geojson")
ENP_PROVINCES = os.path.join(CACHE, "enp", "1928-45", "1928_1945")
ENP_NAME_FIELD = "p_28_45_na"

NS = '{http://www.w3.org/2000/svg}'
NUM = re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?')


def load(path):
    raw = open(path, 'rb').read()
    enc = "utf-16" if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else "utf-8"
    return raw.decode(enc, errors="replace")


def unesc(i):
    return re.sub(r'_x([0-9A-Fa-f]{4})_', lambda m: chr(int(m.group(1), 16)), i or '')


def base(i):
    return unesc(i).split('_00000')[0]


def _bez(p0, p1, p2, p3, n=8):
    out = []
    for i in range(1, n + 1):
        t = i / n; u = 1 - t
        out.append((u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
                    u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]))
    return out


def parse_d(d):
    """Flatten a path's d into a list of polylines."""
    toks = re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', d)
    out, cur = [], []
    x = y = sx = sy = 0.0
    i, cmd = 0, None
    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v
    while i < len(toks):
        if re.fullmatch(r'[A-Za-z]', toks[i]):
            cmd = toks[i]; i += 1
            if cmd in 'Zz':
                if cur:
                    cur.append((sx, sy)); out.append(cur); cur = []
                x, y = sx, sy
                continue
        if i >= len(toks):
            break
        c = cmd
        if c in 'Mm':
            dx, dy = num(), num()
            x, y = (dx, dy) if c == 'M' else (x + dx, y + dy)
            if cur: out.append(cur)
            cur = [(x, y)]; sx, sy = x, y
            cmd = 'L' if c == 'M' else 'l'
        elif c in 'Ll':
            dx, dy = num(), num()
            x, y = (dx, dy) if c == 'L' else (x + dx, y + dy)
            cur.append((x, y))
        elif c in 'Hh':
            dx = num(); x = dx if c == 'H' else x + dx
            cur.append((x, y))
        elif c in 'Vv':
            dy = num(); y = dy if c == 'V' else y + dy
            cur.append((x, y))
        elif c in 'Cc':
            a1, b1, a2, b2, a3, b3 = (num() for _ in range(6))
            if c == 'c':
                p1 = (x + a1, y + b1); p2 = (x + a2, y + b2); p3 = (x + a3, y + b3)
            else:
                p1, p2, p3 = (a1, b1), (a2, b2), (a3, b3)
            cur += _bez((x, y), p1, p2, p3)
            x, y = p3
        elif c in 'Ss':
            a2, b2, a3, b3 = (num() for _ in range(4))
            p2 = (x + a2, y + b2) if c == 's' else (a2, b2)
            p3 = (x + a3, y + b3) if c == 's' else (a3, b3)
            cur += _bez((x, y), (x, y), p2, p3)
            x, y = p3
        else:
            i += 1
    if cur: out.append(cur)
    return [p for p in out if len(p) > 1]


def points_attr(s):
    v = [float(t) for t in NUM.findall(s or '')]
    return [(v[i], v[i+1]) for i in range(0, len(v) - 1, 2)]


def layers(path):
    """{layer name: [polyline, ...]} for every group whose id has Chinese in it."""
    root = ET.fromstring(load(path))
    out = {}
    for el in root.iter(NS + 'g'):
        name = base(el.get('id', ''))
        if not re.search(r'[一-鿿]', name):
            continue
        lines = []
        for p in el.iter(NS + 'path'):
            lines += parse_d(p.get('d', ''))
        for p in el.iter(NS + 'polygon'):
            q = points_attr(p.get('points'))
            if len(q) > 1: lines.append(q + [q[0]])
        for p in el.iter(NS + 'polyline'):
            q = points_attr(p.get('points'))
            if len(q) > 1: lines.append(q)
        if lines:
            out.setdefault(name, []).extend(lines)
    return out


# ---- equidistant conic, spherical, as PROJ's eqdc does it ------------------
#
# The frame comes from the description of the base map these are derived from,
# File:China edcp location map.svg by Uwe Dedering: equidistant conic, central
# meridian 104 E, central parallel 36 N, standard parallels 30 N and 42 N, and
# the central meridian running from 57.0 N at the top of the frame to 17.96 N
# at the bottom. That fixes the scale, and it self-checks: the latitude it puts
# at the vertical centre of the frame is 37 deg 28.8 min against the 37 deg 29
# min the page states.
#
# Two things the page does not give, fitted against Natural Earth's coastline:
# the central meridian sits 12.0 units right of the viewBox centre, and the top
# of the frame is 2,500 m further north than 57.0 N exactly. With those, the
# drawn coastline lands a median of 0.59 km from Natural Earth's, p90 1.10 km.
R = 6371000.0
LON0, LAT0, LAT1, LAT2 = 104.0, 36.0, 30.0, 42.0
VB_W, VB_H = 1206.0932617, 940.0
X_OFFSET = 12.0            # units, central meridian right of the viewBox centre
Y_OFFSET = 2500.0          # metres, top of frame above 57.0 N

_p1, _p2 = math.radians(LAT1), math.radians(LAT2)
_n = (math.cos(_p1) - math.cos(_p2)) / (_p2 - _p1)
_G = math.cos(_p1) / _n + _p1
_rho0 = R * (_G - math.radians(LAT0))
_ytop = _rho0 - R * (_G - math.radians(57.0)) + Y_OFFSET
_ybot = _rho0 - R * (_G - math.radians(17.96))
_scale = VB_H / (_ytop - Y_OFFSET - _ybot)
_xc = VB_W / 2 + X_OFFSET


def to_lonlat(x, y):
    """An SVG user-unit point of these maps, as longitude and latitude."""
    xm = (x - _xc) / _scale
    ym = _ytop - y / _scale
    rho = math.copysign(math.hypot(xm, _rho0 - ym), _n)
    th = math.atan2(xm, _rho0 - ym)
    return LON0 + math.degrees(th / _n), math.degrees(_G - rho / R)


def eqdc(lon, lat):
    """The forward direction, in metres."""
    rho = R * (_G - math.radians(lat))
    th = _n * math.radians(lon - LON0)
    return rho * math.sin(th), _rho0 - rho * math.cos(th)

SNAP = 0.02          # SVG units, about 92 m: merges endpoints meant to coincide
MIN_AREA = 4.0       # square SVG units, about 85 km^2


def key(p):
    return (round(p[0] / SNAP), round(p[1] / SNAP))


def collect(path, names=("省界", "國界", "海岸線")):
    L = layers(path)
    segs = []
    for nm in names:
        for ln in L.get(nm, []):
            for i in range(len(ln) - 1):
                a, b = ln[i], ln[i + 1]
                if key(a) != key(b):
                    segs.append((a, b))
    return segs


def split_at_intersections(segs, cell=4.0):
    """Split every segment where another crosses it."""
    grid = collections.defaultdict(list)
    for i, (a, b) in enumerate(segs):
        x0, x1 = sorted((a[0], b[0])); y0, y1 = sorted((a[1], b[1]))
        for gx in range(int(x0 // cell), int(x1 // cell) + 1):
            for gy in range(int(y0 // cell), int(y1 // cell) + 1):
                grid[(gx, gy)].append(i)
    cuts = collections.defaultdict(set)
    seen = set()
    for bucket in grid.values():
        for ii in range(len(bucket)):
            for jj in range(ii + 1, len(bucket)):
                i, j = bucket[ii], bucket[jj]
                if i > j: i, j = j, i
                if (i, j) in seen: continue
                seen.add((i, j))
                (p1, p2), (p3, p4) = segs[i], segs[j]
                d = ((p2[0]-p1[0])*(p4[1]-p3[1]) - (p2[1]-p1[1])*(p4[0]-p3[0]))
                if abs(d) < 1e-12: continue
                t = ((p3[0]-p1[0])*(p4[1]-p3[1]) - (p3[1]-p1[1])*(p4[0]-p3[0])) / d
                u = ((p3[0]-p1[0])*(p2[1]-p1[1]) - (p3[1]-p1[1])*(p2[0]-p1[0])) / d
                if 1e-9 < t < 1-1e-9 and 1e-9 < u < 1-1e-9:
                    cuts[i].add(t); cuts[j].add(u)
    out = []
    for i, (a, b) in enumerate(segs):
        ts = sorted(cuts.get(i, ()))
        prev = a
        for t in ts:
            q = (a[0] + t*(b[0]-a[0]), a[1] + t*(b[1]-a[1]))
            if key(prev) != key(q): out.append((prev, q))
            prev = q
        if key(prev) != key(b): out.append((prev, b))
    return out


def faces(segs):
    """Traverse the faces of the planar arrangement."""
    pos = {}
    adj = collections.defaultdict(list)
    for a, b in segs:
        ka, kb = key(a), key(b)
        if ka == kb: continue
        pos.setdefault(ka, a); pos.setdefault(kb, b)
        adj[ka].append(kb); adj[kb].append(ka)
    # de-duplicate parallel edges
    for k in adj:
        adj[k] = list(dict.fromkeys(adj[k]))
    ang = {}
    order = {}
    for k, nbrs in adj.items():
        p = pos[k]
        nbrs.sort(key=lambda q: math.atan2(pos[q][1]-p[1], pos[q][0]-p[0]))
        order[k] = {q: i for i, q in enumerate(nbrs)}
    out = []
    used = set()
    for k in adj:
        for nb in adj[k]:
            if (k, nb) in used: continue
            ring = []
            cur, nxt = k, nb
            while True:
                if (cur, nxt) in used: break
                used.add((cur, nxt))
                ring.append(pos[cur])
                back = order[nxt][cur]
                nbrs = adj[nxt]
                cur, nxt = nxt, nbrs[(back - 1) % len(nbrs)]
                if (cur, nxt) == (k, nb):
                    used.add((cur, nxt)); break
            if len(ring) > 3:
                out.append(ring)
    return out


def area(ring):
    a = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i]; x1, y1 = ring[(i+1) % len(ring)]
        a += x0*y1 - x1*y0
    return a / 2



def _pip(p, ring):
    x, y = p
    inside = False
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % n]
        if (y0 > y) != (y1 > y):
            if x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
                inside = not inside
    return inside


def interior_point(ring):
    """A point certainly inside the ring — the centroid of a concave face is
    often outside it, and a face named by a point in its neighbour is worse
    than a face with no name at all."""
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    if _pip((cx, cy), ring):
        return cx, cy
    ys = sorted({p[1] for p in ring})
    for y in ys[len(ys) // 4::max(1, len(ys) // 40)]:
        xs = []
        for i in range(len(ring)):
            x0, y0 = ring[i]
            x1, y1 = ring[(i + 1) % len(ring)]
            if (y0 > y) != (y1 > y):
                xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            if xs[i + 1] - xs[i] > 0.5:
                return (xs[i] + xs[i + 1]) / 2, y
    return cx, cy


def enp_namer():
    """A function from lon/lat to the ENP province it falls in, or None."""
    prov = collections.defaultdict(list)
    for att, rings in shapefile.read(ENP_PROVINCES):
        name = (att.get(ENP_NAME_FIELD) or "").strip()
        if name and rings:
            prov[name].extend(rings)
    boxes = {k: (min(p[0] for r in v for p in r), min(p[1] for r in v for p in r),
                 max(p[0] for r in v for p in r), max(p[1] for r in v for p in r))
             for k, v in prov.items()}

    def whose(p):
        for k, (x0, y0, x1, y1) in boxes.items():
            if x0 <= p[0] <= x1 and y0 <= p[1] <= y1:
                if any(_pip(p, r) for r in prov[k]):
                    return k
        return None
    return whose


def build(svg_path=SVG_IN):
    segs = split_at_intersections(collect(svg_path))
    rings = [r for r in faces(segs) if abs(area(r)) >= MIN_AREA and area(r) > 0]
    whose = enp_namer()
    out = collections.defaultdict(list)
    unnamed = 0
    for r in rings:
        name = whose(to_lonlat(*interior_point(r)))
        if name:
            out[name].append([list(to_lonlat(*p)) for p in r])
        else:
            unnamed += 1
    return out, len(rings), unnamed


def main():
    if not os.path.exists(SVG_IN):
        sys.stderr.write(
            "roc_provinces: %s is missing.\n"
            "Fetch it from Wikimedia Commons (CC BY-SA 4.0):\n"
            "  https://commons.wikimedia.org/wiki/File:"
            "Republic_of_China_edcp_location_map_1936.svg\n" % SVG_IN)
        return 1
    prov, nfaces, unnamed = build()
    feats = [{"type": "Feature",
              "properties": {"name": k, "rings": len(v)},
              "geometry": {"type": "MultiPolygon", "coordinates": [[r] for r in v]}}
             for k, v in sorted(prov.items())]
    with open(GEOJSON_OUT, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    verts = sum(len(r) for v in prov.values() for r in v)
    sys.stderr.write(
        f"roc_provinces: {nfaces} faces, {len(prov)} provinces, {verts:,} vertices"
        f" ({unnamed} faces outside China, left out)\n -> {GEOJSON_OUT}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
