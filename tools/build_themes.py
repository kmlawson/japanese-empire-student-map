"""The thematic layers, and which district each of their categories covers.

    python3 tools/build_themes.py

Writes `deploy/themes.js`, fetched only when a reader asks for a theme — the
same arrangement `jp-rails.js` has, and for the same reason: this is 6,371
vertices for a layer that is off until somebody presses the book, and it has
no business in the sheet everybody loads.

**A thematic layer is not an administrative one.** The Administrative layer
answers *what was this place called*; a theme answers a question somebody
asked of the place — here, *how was it actually governed* — and the two are
meant to be read together. So the theme is drawn over the districts at an
opacity that leaves them legible, takes no pointer events, and contributes its
categories to the key rather than replacing anything.

The first is **the 1931 administration map of Burma**, from the map at p. xi
of the Census of India, 1931, Volume XI, Burma, Part I — Report: four
categories of territory, from the regularly administered delta and dry zone to
the Wa States the administration did not reach at all.

Two things are computed here rather than at runtime.

* **The rings go out in lon/lat**, not projected. map.js holds the projection
  and the reader can change it, so a pre-projected path would be wrong the
  moment they did. `buildJpRails` established this and `reprojectGraft`
  finishes the job.
* **Which category each district falls in** is worked out here, by testing the
  district's own centroid against the category rings, and shipped as a plain
  table. The alternative is a point-in-polygon in the hover handler, which
  runs on every mouse move over eight thousand nodes; this runs 90 times, once,
  at build.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_indochina as ic                                  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "deploy")
OUT = os.path.join(SITE, "themes.js")

BURMA_DIR = os.path.join(ROOT, "data", "burma")
RULE_SRC = os.path.join(BURMA_DIR, "burma-1931-rule-categories.geojson")
DISTRICTS = os.path.join(BURMA_DIR, "burma-1931-admin-units.geojson")
# Burma as one shape, for the islands the source's own outline omits
BURMA_WHOLE = os.path.join(BURMA_DIR, "burma-1931-dissolved.geojson")

# **THE FOUR CATEGORIES, IN THE SOURCE'S OWN COLOURS.**
#
# Read off the map at p. xi: the regularly administered country in amber, the
# loosely administered hills in green, the specially administered tracts in
# red, and the ground the administration did not reach in black. The names in
# the key are the ones the author asked for, which are plainer than the map's
# own shorthand — the source writes "unadministered" and "loosely" and leaves
# the reader to supply the noun.
#
# `status` is what the file carries; the order here is the order of the key,
# from most governed to least, because that is the gradient the map is about.
# The two middle colours were read off the sheet the wrong way round first
# — green taken for loose administration and red for special, which is the
# order the *key* lists them in and not the order the ground is painted.
# Corrected on the author's reading of the original: the Shan and Karenni
# states, specially administered, are the green; the red is the loosely
# administered hill country of the north and west.
CATS = [
    ("Regular", "Regular Administration", "#efc93f"),
    ("Loosely", "Loosely Administered", "#e8352c"),
    ("Special", "Special Administration", "#2e8c77"),
    ("Unadministered", "Unadministered", "#191410"),
]

THEME = {
    "id": "burma-rule",
    "atom": "burma",
    "en": "1931 Administration Map of Burma",
    "when": "1931",
    "source": ("the map at p. xi of the Census of India, 1931, Volume XI, "
               "Burma, Part I — Report"),
}

# ---------------------------------------------------------------------------
# **THE 1931 MILITARY DIVISIONS OF BRITISH INDIA.**
#
# From the *Military Divisions* plate of the Imperial Gazetteer Atlas of India
# (1931), traced into `tools/cache/1931-india-military-divisions.geojson`:
# eighteen areas, each under a `command`. An area is either a district of a
# command, named in `division` (Lahore, Deccan, Meerut), or an independent
# brigade area, named in `name` (Zhob, Sind, Poona, Delhi). Burma is a
# district that is also a command.
#
# Read from the *filled* copy `tools/fill_military.py` writes — the tracing
# with the ground it stops short of at Bombay and on the Chin hills given to
# the area the author assigned it. The tracing itself is never written to.
#
# Each area is drawn with a black outline of its own, so the boundaries
# between them are whole wherever the areas meet; they were worked out from
# shared edges once, and broke wherever the tracing's neighbours did not
# quite touch. And each carries a name, placed at the point deepest inside
# it: districts in small capitals, brigade areas letter-spaced, as the key
# explains.
#
# Its own file, fetched when a reader chooses it: 36,000 vertices, every one
# the tracing has, is too much to send with Burma's theme to somebody who
# only wanted Burma. `themes.js` carries its name, its key and the file.
MIL_SRC = os.path.join(ROOT, "tools", "cache",
                       "1931-india-military-divisions-filled.geojson")
MIL_OUT = os.path.join(SITE, "theme-india-military.js")

# The plate's colours. Western is the plate's own light pink rather than the
# map's British, which is darker and read as a different thing.
MIL_COMMANDS = [
    ("Northern", "Northern Command", "#a998bf"),
    ("Western", "Western Command", "#e3b3c0"),
    ("Eastern", "Eastern Command", "#a9bf7a"),
    ("Southern", "Southern Command", "#efd96b"),
    ("Burma Independent District", "Burma Independent District", "#ec9a5b"),
]

MIL_THEME = {
    "id": "india-military",
    "atom": "india",
    "en": "1931 Military Divisions of British India",
    "when": "1931",
    "source": "Map from the 1931 Imperial Gazetteer of India",
    "file": "theme-india-military.js",
    # drawn over the country as it is: its own boundaries and names, not
    # the provinces', and not clipped to one atom — it covers two
    "admin": False,
    "clip": False,
    "download": "gis/source/india-1931-military-divisions.geojson",
    # what the two kinds of name on the map are, for the key
    "keyLabels": [
        {"kind": "district", "sample": "Lahore",
         "en": "District within a command"},
        {"kind": "brigade", "sample": "Delhi",
         "en": "Independent brigade area"},
    ],
}

# Four decimals is about eleven metres, which is finer than the source map at
# fifty miles to the inch can possibly be. It is the precision `jp-rails.js`
# ships its track at and there is no reason for this to be finer.
PREC = 4


def rings_of(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["features"]


def flat(ring):
    """A ring as one flat list, [lon, lat, lon, lat, …], rounded once."""
    out = []
    for pt in ring:
        out.append(round(pt[0], PREC))
        out.append(round(pt[1], PREC))
    return out


def main():
    if not os.path.exists(RULE_SRC):
        raise SystemExit("%s is missing" % RULE_SRC)

    by_cat = {}
    rings_for = {}
    verts = 0
    for feat in rings_of(RULE_SRC):
        status = (feat["properties"].get("status") or "").strip()
        if status not in dict((c[0], c) for c in CATS):
            raise SystemExit("the status %r is not one of the four this theme "
                             "knows. Add it to CATS with a colour, or the "
                             "reader gets ground in a category the key does "
                             "not explain." % status)
        for ring in ic.rings_of(feat["geometry"]):
            if len(ring) < 4:
                continue
            by_cat.setdefault(status, []).append(flat(ring))
            rings_for.setdefault(status, []).append(ring)
            verts += len(ring)

    # **THE ISLANDS THE SOURCE'S OUTLINE LEAVES OUT.**
    #
    # The map at p. xi draws the mainland and the categories across it; the
    # coastal islands — the Arakan fringe, the mouths of the delta, the
    # Mergui archipelago — are not in it. Drawn as nothing they came out in
    # the country's own colour while the theme was up, which reads as "no
    # category" and is wrong twice over: they *were* regularly administered
    # districts, and the reader was being shown a gap the source does not
    # claim.
    #
    # So every piece of Burma the categories do not reach is added to
    # Regular. Only whole rings the categories miss entirely — tested by
    # centroid, then confirmed by every vertex being outside — so nothing is
    # added over ground a category already has and no fill is laid on a fill:
    # at 0.55 opacity two coats would read as a fifth colour.
    added = 0
    if os.path.exists(BURMA_WHOLE):
        for feat in rings_of(BURMA_WHOLE):
            for ring in ic.rings_of(feat["geometry"]):
                if len(ring) < 4:
                    continue
                cx, cy = ic.centroid(ring)
                covered = False
                for status in rings_for:
                    for cat_ring in rings_for[status]:
                        if ic.point_in_ring((cx, cy), cat_ring):
                            covered = True
                            break
                    if covered:
                        break
                if covered:
                    continue
                # and it must be wholly outside, not merely centred outside
                touches = False
                for status in rings_for:
                    for cat_ring in rings_for[status]:
                        if any(ic.point_in_ring(p, cat_ring) for p in ring[::7]):
                            touches = True
                            break
                    if touches:
                        break
                if touches:
                    continue
                by_cat.setdefault("Regular", []).append(flat(ring))
                rings_for.setdefault("Regular", []).append(ring)
                verts += len(ring)
                added += 1
    if added:
        print("  %d island(s) the source's outline leaves out, added to Regular"
              % added)

    cats = []
    for status, label, colour in CATS:
        rs = by_cat.get(status) or []
        if not rs:
            print("  note: no ground in %s" % status)
            continue
        cats.append({"id": status, "en": label, "c": colour, "r": rs})
        print("  %-16s %-24s %2d ring(s), %5d vertices"
              % (status, label, len(rs), sum(len(r) // 2 for r in rs)))

    # ---- and which category each district sits in ------------------------
    #
    # By the district's own centroid. A district that straddles two categories
    # is answered by where its middle is, which is the honest simple rule and
    # is right for all but one case: the Arakan Hill Tracts are half specially
    # administered, and the source draws that half separately, so the district
    # takes whichever the centroid lands in. The card says which category the
    # *ground under the pointer* is in, not the district's, so nothing is lost
    # by this being coarse — it is a convenience for the district's own card.
    rule = {}
    unplaced = []
    if os.path.exists(DISTRICTS):
        for feat in rings_of(DISTRICTS):
            name = feat["properties"].get("name") or ""
            if not name:
                continue
            outer = None
            best = 0.0
            for ring in ic.rings_of(feat["geometry"]):
                a = abs(ic.signed_area(ring))
                if a > best:
                    best, outer = a, ring
            if not outer:
                continue
            cx, cy = ic.centroid(outer)
            hit = ""
            for status, _label, _c in CATS:
                for ring in rings_for.get(status, []):
                    if ic.point_in_ring((cx, cy), ring):
                        hit = status
                        break
                if hit:
                    break
            if hit:
                rule[name] = hit
            else:
                unplaced.append(name)
    else:
        sys.stderr.write("note: %s missing, no district table written\n"
                         % os.path.basename(DISTRICTS))

    doc = dict(THEME)
    doc["cats"] = cats
    doc["rule"] = rule

    head = (
        "/* Built by tools/build_themes.py -- do not edit.\n"
        " * The thematic layers: category outlines in lon/lat, which map.js\n"
        " * projects, and a table of which category each district falls in by\n"
        " * its own centroid. Fetched only when a reader asks for a theme. */\n"
    )
    mil_meta, mil_geom = build_military()
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(head)
        fh.write("JMAP.THEMES = ")
        json.dump({THEME["id"]: doc, MIL_THEME["id"]: mil_meta}, fh,
                  ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    with open(MIL_OUT, "w", encoding="utf-8") as fh:
        fh.write("/* Built by tools/build_themes.py -- do not edit.\n"
                 " * The 1931 military divisions of British India: the areas and\n"
                 " * the two kinds of boundary, in lon/lat. Fetched when chosen. */\n")
        fh.write("JMAP.THEME_GEOM = JMAP.THEME_GEOM || {};\n")
        fh.write("JMAP.THEME_GEOM[%s] = " % json.dumps(MIL_THEME["id"]))
        json.dump(mil_geom, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    print("wrote      %s (%.0f KB)" % (os.path.relpath(MIL_OUT, ROOT),
                                      os.path.getsize(MIL_OUT) / 1024.0))

    kb = os.path.getsize(OUT) / 1024.0
    print("themes     %d category(ies), %d vertices, %d district(s) placed"
          % (len(cats), verts, len(rule)))
    if unplaced:
        print("  in no category by their centroid: %s" % ", ".join(unplaced))
    print("wrote      %s (%.0f KB)" % (os.path.relpath(OUT, ROOT), kb))


def mil_label(props):
    """The area, its command, and the name written on the map."""
    cmd = (props.get("command") or "").strip()
    area = (props.get("name") or "").strip()
    div = (props.get("division") or "").strip()
    if cmd == "Burma Independent District":
        return {"unit": cmd, "cmdEn": "", "short": "Burma", "kind": "district"}
    if area:
        return {"unit": "%s Independent Brigade Area" % area,
                "cmdEn": "%s Command" % cmd, "short": area, "kind": "brigade"}
    return {"unit": "%s District" % div, "cmdEn": "%s Command" % cmd,
            "short": div, "kind": "district"}


def map_west():
    """The map's western edge, in degrees: the base sheet says, in
    `data-lon-min`. A name placed west of it is not on the map."""
    import re
    with open(os.path.join(SITE, "japan-empire-map.svg"), encoding="utf-8") as fh:
        head = fh.read(20000)
    m = re.search(r'data-lon-min="([-\d.]+)"', head)
    return float(m.group(1)) if m else -180.0


def label_point(rings, west=-180.0):
    """The point deepest inside the largest polygon's outer ring — where a
    name can be written without running over the edge, which a centroid does
    not promise for Bombay's coast or the crescent of the Central Provinces.
    A grid search refined three times, distances in kilometres so that a
    degree of longitude counts for what it is at that latitude."""
    outer = max(rings, key=lambda r: abs(ic.signed_area(r)))
    # a copy of about 400 points to search against: placing a name needs a
    # few kilometres, not the tracing's every vertex, and the search is a
    # point-in-ring and a distance per point per candidate. Only for this;
    # what is drawn keeps every vertex.
    step = max(1, len(outer) // 400)
    outer = outer[::step] + [outer[0]]
    xs = [p[0] for p in outer]
    ys = [p[1] for p in outer]
    lat0 = (min(ys) + max(ys)) / 2
    kx = math.cos(math.radians(lat0))

    def inside(p):
        return ic.point_in_ring(p, outer)

    def depth(p):
        best = 1e18
        for a, b in zip(outer, outer[1:]):
            ax, ay = (a[0] - p[0]) * kx, a[1] - p[1]
            bx, by = (b[0] - p[0]) * kx, b[1] - p[1]
            dx, dy = bx - ax, by - ay
            L = dx * dx + dy * dy
            t = 0.0 if not L else max(0.0, min(1.0, -(ax * dx + ay * dy) / L))
            x, y = ax + t * dx, ay + t * dy
            d = x * x + y * y
            if d < best:
                best = d
        return best

    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    best, at = -1.0, ic.centroid(outer)
    for _ in range(4):
        n = 24
        for i in range(n + 1):
            for j in range(n + 1):
                p = (x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * j / n)
                # and on the map with room for the word: Baluchistan's
                # deepest point is west of the edge, and a name centred half a
                # degree in ran off it at the opening view
                if p[0] < west + 1.8 or not inside(p):
                    continue
                d = depth(p)
                if d > best:
                    best, at = d, p
        wx, wy = (x1 - x0) / 6, (y1 - y0) / 6
        x0, x1, y0, y1 = at[0] - wx, at[0] + wx, at[1] - wy, at[1] + wy
    return [round(at[0], PREC), round(at[1], PREC)]


# **INTERIOR BOUNDARIES, SIMPLIFIED ON THE AUTHOR'S ASKING.** The tracing
# follows some frontiers vertex by vertex — a kilometre apart along Central
# Provinces and Meerut — and others in long straight runs, and side by side
# the dense ones read as a different kind of line. So a boundary two areas
# share is simplified (Douglas-Peucker, `MIL_SIMPLIFY` degrees, about 6 km);
# the coast, and anything not shared vertex for vertex, is left as traced.
# Each shared stretch is simplified once, in one fixed direction, and both
# areas take that one answer, so the two sides of a frontier still meet
# exactly. Where three areas meet, and where a frontier reaches the coast,
# the point is kept. The download is the unsimplified file.
MIL_SIMPLIFY = 0.06


def dp(pts, tol):
    """Douglas-Peucker on a run of lon/lat points, ends kept. Distances with a
    degree of longitude shortened by the latitude, as on the ground."""
    if len(pts) < 3:
        return list(pts)
    kx = math.cos(math.radians(pts[0][1]))
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a][0] * kx, pts[a][1]
        bx, by = pts[b][0] * kx, pts[b][1]
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        best, at = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i][0] * kx - ax, pts[i][1] - ay
            if L:
                t = max(0.0, min(1.0, (px * dx + py * dy) / L))
                ex, ey = px - t * dx, py - t * dy
            else:
                ex, ey = px, py
            d = ex * ex + ey * ey
            if d > best:
                best, at = d, i
        if at > 0 and best > tol * tol:
            keep[at] = True
            stack.append((a, at))
            stack.append((at, b))
    return [p for p, k in zip(pts, keep) if k]


def _cross(a, b, c, d):
    """Do segments ab and cd cross, other than at a shared end?"""
    if a == c or a == d or b == c or b == d:
        return False
    def o(p, q, r):
        v = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
        return (v > 0) - (v < 0)
    return (o(a, b, c) != o(a, b, d) and o(c, d, a) != o(c, d, b))


def simplify_shared(areas_rings, tol):
    """Every ring of every area, with its shared stretches simplified and its
    unshared ones untouched. `areas_rings` is a list (per area) of rings.

    **And no stretch straightened across another line.** Douglas-Peucker
    knows nothing of what lies beside the stretch it is working on, and a
    frontier that doubles back on itself can be cut across its own bend —
    measured, the Central Provinces–Meerut frontier near 79.16 E and the
    Chin hills seam near 92.84 E. So every simplified stretch is checked
    against every other line of the two areas it divides, and one that
    crosses is done again at half the tolerance, down to the tracing itself
    if need be."""
    def key(p):
        return (round(p[0], 9), round(p[1], 9))
    owners = {}
    for i, rings in enumerate(areas_rings):
        for r in rings:
            for a, b in zip(r, r[1:]):
                owners.setdefault(frozenset((key(a), key(b))), set()).add(i)

    # each ring as a list of pieces: ('as-is', points) or ('shared', canon, rev)
    runs = {}                   # canon -> the traced points, in canon order
    plan = []
    for i, rings in enumerate(areas_rings):
        mine = []
        for r in rings:
            pts = r[:-1] if r[0] == r[-1] else r[:]
            n = len(pts)
            def lab_of(k):
                o = owners[frozenset((key(pts[k]), key(pts[(k + 1) % n])))]
                return frozenset(o) if len(o) > 1 else None
            lab = [lab_of(k) for k in range(n)]
            start = next((k for k in range(n) if lab[k] != lab[k - 1]), None)
            if start is None:
                mine.append([("as-is", r)])
                continue
            pts = pts[start:] + pts[:start]
            lab = lab[start:] + lab[:start]
            pieces = []
            k = 0
            while k < n:
                j = k
                while j + 1 < n and lab[j + 1] == lab[k]:
                    j += 1
                run = pts[k:j + 2] if j + 1 < n else pts[k:] + [pts[0]]
                if lab[k] is None:
                    pieces.append(("as-is", run))
                else:
                    fwd = tuple(key(p) for p in run)
                    back = fwd[::-1]
                    canon, rev = (fwd, False) if fwd <= back else (back, True)
                    runs.setdefault(canon, run[::-1] if rev else run)
                    pieces.append(("shared", canon, rev))
                k = j + 1
            mine.append(pieces)
        plan.append(mine)

    tol_of = dict((c, tol) for c in runs)
    done = {}

    def assemble():
        out = []
        for mine in plan:
            rings = []
            for pieces in mine:
                if len(pieces) == 1 and pieces[0][0] == "as-is" and \
                        pieces[0][1][0] == pieces[0][1][-1]:
                    rings.append(pieces[0][1])
                    continue
                res, tags = [], []
                for pc in pieces:
                    if pc[0] == "as-is":
                        seg, tag = pc[1], None
                    else:
                        c = pc[1]
                        if c not in done:
                            t = tol_of[c]
                            done[c] = dp(runs[c], t) if t > 0 else list(runs[c])
                        seg = done[c][::-1] if pc[2] else done[c]
                        tag = c
                    res.extend(seg[:-1])
                    tags.extend([tag] * (len(seg) - 1))
                res.append(res[0])
                rings.append((res, tags))
            out.append(rings)
        return out

    for _round in range(8):
        built = assemble()
        bad = set()
        for rings in built:
            segs = []
            for rg in rings:
                if isinstance(rg, tuple):
                    pts, tags = rg
                    segs.extend((pts[k], pts[k + 1], tags[k]) for k in range(len(tags)))
                else:
                    segs.extend((rg[k], rg[k + 1], None) for k in range(len(rg) - 1))
            grid = {}
            for n_, (a, b, t) in enumerate(segs):
                for gx in range(int(min(a[0], b[0]) // 0.1), int(max(a[0], b[0]) // 0.1) + 1):
                    for gy in range(int(min(a[1], b[1]) // 0.1), int(max(a[1], b[1]) // 0.1) + 1):
                        grid.setdefault((gx, gy), []).append(n_)
            for cell in grid.values():
                for x in range(len(cell)):
                    sa = segs[cell[x]]
                    for y in range(x + 1, len(cell)):
                        sb = segs[cell[y]]
                        if sa[2] is None and sb[2] is None:
                            continue        # two traced lines: not ours to judge
                        # a crossing, or one line laid back along another —
                        # a narrow tongue whose two sides were straightened
                        # onto the same line, which is a shape collapsed to
                        # nothing and crosses nothing
                        same = {sa[0], sa[1]} == {sb[0], sb[1]}
                        if same or _cross(sa[0], sa[1], sb[0], sb[1]):
                            for t in (sa[2], sb[2]):
                                if t is not None:
                                    bad.add(t)
        # and a point the drawn outline visits twice that the tracing did not
        for i_area, rings in enumerate(built):
            traced_seen = {}
            for r in areas_rings[i_area]:
                for p_ in r[:-1]:
                    traced_seen[key(p_)] = traced_seen.get(key(p_), 0) + 1
            for rg in rings:
                if not isinstance(rg, tuple):
                    continue
                pts, tags = rg
                seen = {}
                for k_, p_ in enumerate(pts[:-1]):
                    kk = key(p_)
                    if kk in seen and traced_seen.get(kk, 0) < 2:
                        for t in (tags[k_], tags[k_ - 1], tags[seen[kk]],
                                  tags[seen[kk] - 1]):
                            if t is not None:
                                bad.add(t)
                    seen[kk] = k_
        if not bad:
            break
        for c in bad:
            tol_of[c] = tol_of[c] / 2 if tol_of[c] > tol / 64 else 0
            done.pop(c, None)
    else:
        sys.stderr.write("note: %d stretch(es) still cross after eight rounds\n" % len(bad))

    final = []
    for rings in assemble():
        final.append([rg[0] if isinstance(rg, tuple) else rg for rg in rings])
    redone = sum(1 for c in tol_of if tol_of[c] < tol)
    if redone:
        print("  %d shared stretch(es) done again finer, where the first pass "
              "cut across another line" % redone)
    return final


def build_military():
    """The theme's areas, each with its name and where to write it.
    Returns (meta, geometry)."""
    if not os.path.exists(MIL_SRC):
        raise SystemExit("%s is missing: run tools/fill_military.py" % MIL_SRC)
    feats = rings_of(MIL_SRC)
    colour = dict((c[0], c[2]) for c in MIL_COMMANDS)
    west = map_west()
    # rounded as they will be written before anything is simplified or
    # checked, so the crossing test sees the lines that are drawn: rounding
    # after it once turned a clean stretch at the Chin hills seam into one
    # that crossed itself
    def rounded(r):
        out = []
        for p in r:
            q = (round(p[0], PREC), round(p[1], PREC))
            if not out or q != out[-1]:
                out.append(q)
        return out
    traced = [[rounded(r) for r in ic.rings_of(f["geometry"]) if len(r) >= 4]
              for f in feats]
    drawn = simplify_shared(traced, MIL_SIMPLIFY)
    areas = []
    verts = 0
    kept = 0
    for fi, feat in enumerate(feats):
        props = feat["properties"]
        cmd = (props.get("command") or "").strip()
        if cmd not in colour:
            raise SystemExit("the command %r is not one of the five this theme "
                             "knows. Add it to MIL_COMMANDS with a colour." % cmd)
        rs = traced[fi]
        verts += sum(len(r) for r in rs)
        kept += sum(len(r) for r in drawn[fi])
        lab = mil_label(props)
        area = {"cmd": cmd, "r": [flat(r) for r in drawn[fi]],
                "at": label_point(rs, west)}
        area.update(lab)
        area["en"] = lab["unit"] + (", " + lab["cmdEn"] if lab["cmdEn"] else "")
        areas.append(area)
    geom = {"areas": areas}
    meta = dict(MIL_THEME)
    meta["cats"] = [{"id": c[0], "en": c[1], "c": c[2]} for c in MIL_COMMANDS]
    print("military   %d areas; %d of %d vertices drawn (%.0f%%): the coast as "
          "traced, shared frontiers simplified at %.2f°"
          % (len(areas), kept, verts, 100.0 * kept / verts, MIL_SIMPLIFY))
    return meta, geom


if __name__ == "__main__":
    main()
