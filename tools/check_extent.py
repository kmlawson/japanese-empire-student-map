#!/usr/bin/env python3
"""Which unoccupied ground the 1942 line of control encloses.

    python3 tools/check_extent.py

The rule this checks is the author's, stated plainly: **except for the red
occupied areas, everything yellow belongs outside the line.** A perimeter
that encloses ground the map itself paints as unheld contradicts the map
two pixels away.

"Yellow" is not a judgement made here. It is a piece of Chinese land — an
island, or any ring under 400 square units — with none of the traced
occupation over it, which is exactly what a reader sees as yellow. The test
is a point-in-polygon of its centroid against the built `#extent-1942` path
and against the occupation's own rings, all read out of the built SVG, so
it measures what shipped rather than what the source intended.

Reported as a list with each offender's position in longitude and latitude,
so a fix can be aimed. It exits non-zero while any remain.
"""

import re, io, math, sys
s = io.open('japan-empire-map.svg', encoding='utf-8').read()
meta = re.search(r'<metadata id="proj"[^>]*>', s).group(0)
LON0 = float(re.search(r'data-lon-min="([-\d.]+)"', meta).group(1))
LATMAX = float(re.search(r'data-lat-max="([-\d.]+)"', meta).group(1))
PPD = float(re.search(r'data-px-per-deg="([-\d.]+)"', meta).group(1))
R = float(re.search(r'data-r="([-\d.]+)"', meta).group(1))
def lonlat(x, y):
    lon = LON0 + x / PPD
    ytop = math.log(math.tan(math.pi/4 + math.radians(LATMAX)/2))
    return lon, math.degrees(2*(math.atan(math.exp(ytop - y / R)) - math.pi/4))
def rings_of(gid):
    i = s.find('id="%s"' % gid)
    if i < 0: return []
    seg = s[i:s.find('</g>', i)]
    out = []
    for m in re.finditer(r'\sd="(M[^"]+)"', seg):
        for sub in m.group(1).split('M'):
            if not sub.strip(): continue
            pts = [(float(a), float(b)) for a, b in
                   re.findall(r'(-?\d+\.?\d*)\s+(-?\d+\.?\d*)', 'M' + sub)]
            if len(pts) >= 3: out.append(pts)
    return out
d = re.search(r'<path id="extent-1942"[^>]*\sd="([^"]+)"', s).group(1)
ext = [(float(a), float(b)) for a, b in re.findall(r'(-?\d+\.?\d*)\s+(-?\d+\.?\d*)', d)]
def inside(poly, x, y):
    n=len(poly); c=False; j=n-1
    for i in range(n):
        xi,yi=poly[i]; xj,yj=poly[j]
        if (yi>y)!=(yj>y):
            if x < xi+(y-yi)*(xj-xi)/(yj-yi): c = not c
        j=i
    return c
def area(r):
    a=0
    for k in range(len(r)):
        x1,y1=r[k]; x2,y2=r[(k+1)%len(r)]
        a+=x1*y2-x2*y1
    return abs(a)/2
occ = rings_of('a-occupiedzone')
bad=[]
for gid in ('a-china','a-chahar','a-suiyuan'):
    for r in rings_of(gid):
        a=area(r)
        if a>400: continue
        cx=sum(p[0] for p in r)/len(r); cy=sum(p[1] for p in r)/len(r)
        if not inside(ext,cx,cy): continue
        if any(inside(o,cx,cy) for o in occ): continue
        lon,lat=lonlat(cx,cy)
        bad.append((a,lon,lat))
bad.sort(reverse=True)
print('yellow islands inside the line: %d  (total area %.1f)' % (len(bad), sum(b[0] for b in bad)))
for a,lon,lat in bad:
    print('    area %6.2f  %.3f E %.3f N' % (a,lon,lat))

import sys
sys.exit(1 if bad else 0)
