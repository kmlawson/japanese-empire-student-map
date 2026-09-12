"""Route a stretch of timetable along the railway the map draws.

The track between two consecutive stops comes from the transcription
project, traced along the line GIS — except where it does not. Where the
stops between two placed stations could not be placed, the project drew a
chord: the Hwanghae Line's 55 km from Hakhyŏn north to Sŏsariwŏn was two
points, a straight line across country the map's own railway layer bends
around a few pixels away. And a pair of consecutive placed stops with no path
at all is drawn straight by trains.js, at the same cost.

This walks the railway instead. The map already carries the line file for
each system (KR_RAIL_FILES and the rest in build_map.py); its vertices make a
graph, the two stations snap onto the nearest piece of track, and the
shortest path between them along the rails is the stretch. Used only where
the source gave a chord or nothing, never over a traced path, and accepted
only when it is plausible: both stations within SNAP_KM of a rail, and the
route no longer than STRETCH times the straight line. What was routed is
listed in the bundle as `routed`, so a reader taking the file away can tell
a survey (the traced path) from an inference (this) from an assertion (the
chord).

    from rail_route import fill
    fill(doc, [path, ...])      # doc is the bundle about to be written
"""
import heapq
import json
import math
import os
import sys

SNAP_KM = 1.2          # a station further from any rail than this is not on it
STRETCH = 1.6          # a route longer than this times the chord is a detour
CHORD_KM = 3.0         # a two-point "trace" shorter than this is left alone
BRIDGE_KM = 15.0       # the same limit trains.js draws a chord under


def _km(a, b):
    return math.hypot((a[0] - b[0]) * math.cos(math.radians((a[1] + b[1]) / 2)),
                      a[1] - b[1]) * 111.0


def _key(p):
    return (round(p[0], 5), round(p[1], 5))


class Network:
    """The railway as a graph: nodes are rounded vertices, edges the pieces
    of line between them, weighted in kilometres.

    **`weld_m` joins nodes that are close but not identical.** A node is the
    vertex rounded to five places, about a metre, which is right for a file
    whose features were traced to share their endpoints — Korea's are. N05,
    the Japanese source, is not: measured, its 1,977 features come to 241
    separate components, so 糸崎 and 尾道 have no path between them although
    they are adjacent stations eight kilometres apart on the same main line,
    and Ōsaka to Kyōto routes 196 km for a 39 km chord by going round.

    With a weld of a few tens of metres those pieces join. It is a real
    judgement and not a free one: two railways that pass within the tolerance
    without connecting will be joined, and a route may then take a turning that
    did not exist. Kept small for that reason, and the effect is reported.
    """

    def __init__(self, files, weld_m=0):
        self.adj = {}
        self.segs = []            # (a, b) for snapping, as keys
        seen = set()
        for path in files:
            if not os.path.exists(path):
                sys.stderr.write("rail_route: %s missing\n" % path)
                continue
            with open(path) as fh:
                feats = json.load(fh)["features"]
            for f in feats:
                g = f.get("geometry") or {}
                lines = ([g["coordinates"]] if g.get("type") == "LineString"
                         else g.get("coordinates", []) if g.get("type") == "MultiLineString"
                         else [])
                for line in lines:
                    pts = [_key(c) for c in line]
                    for a, b in zip(pts, pts[1:]):
                        if a == b:
                            continue
                        e = (a, b) if a < b else (b, a)
                        if e in seen:
                            continue
                        seen.add(e)
                        d = _km(a, b)
                        self.adj.setdefault(a, []).append((b, d))
                        self.adj.setdefault(b, []).append((a, d))
                        self.segs.append(e)
        if weld_m:
            self._weld(weld_m)

    def _weld(self, weld_m):
        """Join nodes within `weld_m` of each other with a zero-cost edge.

        The nodes are left where they are and an edge of no length is added
        between them, rather than moving one onto the other. Moving nodes would
        change the drawn geometry of every route through them; this changes
        only what is reachable, which is the thing that was wrong.

        Buckets of the weld size, and each node looks at its own bucket and the
        eight around it, so this is linear in the number of nodes rather than
        quadratic. Reports how many components it closed.
        """
        deg = weld_m / 111000.0
        buck = {}
        for n in self.adj:
            buck.setdefault((int(n[0] / deg), int(n[1] / deg)), []).append(n)
        joined = 0
        for (bx, by), here in buck.items():
            near = []
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    near += buck.get((bx + dx, by + dy), ())
            for a in here:
                for b in near:
                    if a >= b:
                        continue
                    if _km(a, b) * 1000.0 <= weld_m:
                        self.adj[a].append((b, 0.0))
                        self.adj[b].append((a, 0.0))
                        joined += 1
        sys.stderr.write("rail_route: welded %d node pairs within %.0f m\n"
                         % (joined, weld_m))

    def snap(self, p):
        """The nearest point on any edge to `p`: (foot, edge, km away)."""
        best = None
        px, py = p
        cosl = math.cos(math.radians(py))
        for a, b in self.segs:
            ax, ay = a
            bx, by = b
            # crude box reject, in degrees
            if (min(ax, bx) - 0.05 > px or max(ax, bx) + 0.05 < px
                    or min(ay, by) - 0.05 > py or max(ay, by) + 0.05 < py):
                continue
            dx, dy = (bx - ax) * cosl, by - ay
            if dx == 0 and dy == 0:
                continue
            t = ((px - ax) * cosl * dx + (py - ay) * dy) / (dx * dx + dy * dy)
            t = max(0.0, min(1.0, t))
            fx, fy = ax + (bx - ax) * t, ay + (by - ay) * t
            d = _km(p, (fx, fy))
            if best is None or d < best[2]:
                best = ((fx, fy), (a, b), d)
        return best

    def route(self, A, B):
        """Points along the rails from A to B, or None."""
        sa, sb = self.snap(A), self.snap(B)
        if not sa or not sb or sa[2] > SNAP_KM or sb[2] > SNAP_KM:
            return None
        # temporary nodes at the two feet, joined to their edges' ends
        extra = {}
        for name, (foot, (a, b), _) in (("A", sa), ("B", sb)):
            extra[name] = [(a, _km(foot, a)), (b, _km(foot, b))]
        if sa[1] == sb[1]:                    # both on one edge: straight along it
            return [A, sa[0], sb[0], B]
        dist = {"A": 0.0}
        prev = {}
        tick = 0                              # a tie-breaker: nodes do not compare
        heap = [(0.0, tick, "A")]
        while heap:
            d, _, n = heapq.heappop(heap)
            if d > dist.get(n, float("inf")):
                continue
            if n == "B":
                break
            nbrs = list(extra["A"]) if n == "A" else list(self.adj.get(n, []))
            # the far foot is reachable from either end of its edge
            if n != "A":
                for end, dd in extra["B"]:
                    if end == n:
                        nbrs.append(("B", dd))
            for m, dd in nbrs:
                nd = d + dd
                if nd < dist.get(m, float("inf")):
                    dist[m] = nd
                    prev[m] = n
                    tick += 1
                    heapq.heappush(heap, (nd, tick, m))
        if "B" not in dist:
            return None
        chain = []
        n = "B"
        while n != "A":
            chain.append(n)
            n = prev[n]
        chain.append("A")
        chain.reverse()
        pts = [A]
        for n in chain:
            pts.append(sa[0] if n == "A" else sb[0] if n == "B" else n)
        pts.append(B)
        return pts


def _perp_m(p, a, b):
    latm, lonm = 111132.0, 111320.0 * math.cos(math.radians(p[1]))
    px, py = p[0] * lonm, p[1] * latm
    ax, ay = a[0] * lonm, a[1] * latm
    bx, by = b[0] * lonm, b[1] * latm
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def _thin(pts, tol_m):
    """Douglas-Peucker on a routed stretch.

    **Routed on the dense source, stored at the drawn tolerance.** The route has
    to be found on the full-resolution network — thinning the *graph* first
    destroys the interior vertices that hold neighbouring features together,
    and measured, routing over the 40 m lines fell from 120 stretches to 33.
    But storing the full-resolution answer put 1.4 MB into kr-trains.js to draw
    a line finer than the layer it follows. So: dense graph, thinned result.
    """
    if len(pts) < 3:
        return list(pts)
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        dmax, idx = 0.0, -1
        for k in range(i + 1, j):
            d = _perp_m(pts[k], pts[i], pts[j])
            if d > dmax:
                dmax, idx = d, k
        if dmax > tol_m:
            keep[idx] = True
            stack.append((i, idx))
            stack.append((idx, j))
    return [p for p, k in zip(pts, keep) if k]


def fill(doc, files, name="the bundle", weld_m=0, bridge_km=None, simplify_m=0,
         stretch=None, skip_li=None):
    """Route the chords in `doc` along the rails in `files`. Adds `routed`.

    `doc` is the bundle as written: `stations` with lon/lat, `trains` with
    `st` rows of [station, arr, dep, flags], `paths` keyed "lo|hi". Returns
    the list of keys routed and prints what was done.

    `skip_li` is a set of line indices whose trains are left alone whatever
    rails they pass near. **A ferry is the case it exists for**: nothing
    sails along a railway, so a crossing that finds a route has found a
    wrong answer rather than a better one. See the caller."""
    net = Network(files, weld_m=weld_m)
    stations = doc["stations"]
    paths = doc["paths"]
    # every pair of consecutive placed stops, as trains.js walks them
    pairs = set()
    for t in doc["trains"]:
        if skip_li and t.get("li") in skip_li:
            continue
        prev = -1
        for s in t["st"]:
            fl = s[3] if len(s) > 3 and s[3] else 0
            if fl & 1:
                prev = -1
                continue
            st = stations[s[0]]
            if st.get("lon") is None:
                continue
            if prev >= 0 and prev != s[0]:
                pairs.add((min(prev, s[0]), max(prev, s[0])))
            prev = s[0]
    routed = []
    tried = 0
    for lo, hi in sorted(pairs):
        k = "%d|%d" % (lo, hi)
        A = (stations[lo]["lon"], stations[lo]["lat"])
        B = (stations[hi]["lon"], stations[hi]["lat"])
        chord = _km(A, B)
        flat = paths.get(k)
        if flat and len(flat) > 4:
            continue                         # a traced path: left alone
        if flat is None and chord > (BRIDGE_KM if bridge_km is None else bridge_km):
            # trains.js draws nothing between two stops this far apart with no
            # path, so ordinarily there is nothing to improve on. `bridge_km`
            # lifts that where a *real* railway is known to run between them:
            # the Korean tables' Japanese connections are long-distance by
            # nature — Ōsaka to Kyōto is 39 km and Okayama to Onomichi 72 — and
            # routing them turns nothing-drawn into the line as it was built.
            # The STRETCH test below is what keeps that honest.
            continue
        if flat is not None and chord < CHORD_KM:
            continue                         # a short straight is a short straight
        tried += 1
        pts = net.route(A, B)
        if not pts:
            continue
        length = sum(_km(a, b) for a, b in zip(pts, pts[1:]))
        if length > (STRETCH if stretch is None else stretch) * chord:
            sys.stderr.write("rail_route: %s %s→%s: rails run %.1f km for a %.1f km chord, kept straight\n"
                             % (name, stations[lo]["n"], stations[hi]["n"], length, chord))
            continue
        if simplify_m:
            pts = _thin(pts, simplify_m)
        out = []
        last = None
        for p in pts:
            q = (round(p[0], 5), round(p[1], 5))
            if q == last:
                continue
            last = q
            out.extend(q)
        paths[k] = out
        routed.append(k)
        sys.stderr.write("rail_route: %s %s→%s: %.1f km chord routed along %.1f km of rail, %d points\n"
                         % (name, stations[lo]["n"], stations[hi]["n"], chord, length, len(out) // 2))
    doc["routed"] = routed
    sys.stderr.write("rail_route: %s: %d of %d chords routed along the drawn railway\n"
                     % (name, len(routed), tried))
    return routed
