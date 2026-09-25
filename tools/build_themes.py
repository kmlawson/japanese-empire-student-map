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
# The plate colours by command and draws two kinds of red line: solid between
# districts, dashed round an independent brigade area. The lines are worked
# out here, not traced: an edge is a boundary when another area lies against
# it — sharing its vertices, or within `EDGE_NEAR` of it where the tracing
# left a sliver — and the coast and the outer frontier, which the plate does
# not line in red, have nothing against them.
#
# Its own file, fetched when a reader chooses it: 36,000 vertices, every one
# the tracing has, is too much to send with Burma's theme to somebody who
# only wanted Burma. `themes.js` carries its name, its key and the file.
MIL_SRC = os.path.join(ROOT, "tools", "cache",
                       "1931-india-military-divisions.geojson")
MIL_OUT = os.path.join(SITE, "theme-india-military.js")

# The plate's colours, in the map's own palette where it has one: the
# Western Command in the British pink every British possession is drawn in.
MIL_COMMANDS = [
    ("Northern", "Northern Command", "#a998bf"),
    ("Western", "Western Command", "#b07f8e"),
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
    "keyLines": [
        {"en": "Boundaries of Districts within Commands", "dash": False},
        {"en": "Boundaries of Independent Brigade Areas", "dash": True},
    ],
}

# How close another area's edge has to be for this one to count as a
# boundary rather than the coast: about two kilometres. The tracing's slivers
# are narrower than that; the nearest coast-to-frontier gap is far wider.
EDGE_NEAR = 0.02
GRID = 0.05

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
    """What the hover says: the area, then the command it answers to."""
    cmd = (props.get("command") or "").strip()
    area = (props.get("name") or "").strip()
    div = (props.get("division") or "").strip()
    if cmd == "Burma Independent District":
        return cmd
    if area:
        return "%s Independent Brigade Area, %s Command" % (area, cmd)
    return "%s District, %s Command" % (div, cmd)


def build_military():
    """The theme's areas and its two kinds of line. Returns (meta, geometry)."""
    if not os.path.exists(MIL_SRC):
        raise SystemExit("%s is missing" % MIL_SRC)
    feats = rings_of(MIL_SRC)
    colour = dict((c[0], c[2]) for c in MIL_COMMANDS)
    areas = []
    brigade = []
    rings_by = []
    verts = 0
    for feat in feats:
        props = feat["properties"]
        cmd = (props.get("command") or "").strip()
        if cmd not in colour:
            raise SystemExit("the command %r is not one of the five this theme "
                             "knows. Add it to MIL_COMMANDS with a colour." % cmd)
        rs = [r for r in ic.rings_of(feat["geometry"]) if len(r) >= 4]
        verts += sum(len(r) for r in rs)
        areas.append({"en": mil_label(props), "cmd": cmd,
                      "r": [flat(r) for r in rs]})
        brigade.append(bool((props.get("name") or "").strip()))
        rings_by.append(rs)

    # every edge, keyed without direction, with the areas that have it
    def key(p):
        return (round(p[0], 6), round(p[1], 6))
    owners = {}
    for i, rs in enumerate(rings_by):
        for r in rs:
            for a, b in zip(r, r[1:]):
                owners.setdefault(frozenset((key(a), key(b))), set()).add(i)

    # a grid of every edge, for the ones no neighbour shares vertex for vertex
    grid = {}
    for i, rs in enumerate(rings_by):
        for r in rs:
            for a, b in zip(r, r[1:]):
                mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
                grid.setdefault((int(mx // GRID), int(my // GRID)), []).append((i, a, b))

    def near_other(i, m):
        best, who = EDGE_NEAR, None
        gx, gy = int(m[0] // GRID), int(m[1] // GRID)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for j, a, b in grid.get((gx + dx, gy + dy), ()):
                    if j == i:
                        continue
                    d = seg_dist(m, a, b)
                    if d < best:
                        best, who = d, j
        return who

    solid, dashed = [], []
    shared = near = 0
    for i, rs in enumerate(rings_by):
        for r in rs:
            for a, b in zip(r, r[1:]):
                own = owners[frozenset((key(a), key(b)))]
                if len(own) > 1:
                    j = min(o for o in own if o != i)
                    if j < i:
                        continue            # drawn once, from the lower side
                    shared += 1
                else:
                    j = near_other(i, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
                    if j is None:
                        continue            # the coast, or the frontier
                    if j < i and near_other(j, ((a[0] + b[0]) / 2,
                                                (a[1] + b[1]) / 2)) is not None:
                        continue            # its neighbour draws this stretch
                    near += 1
                (dashed if brigade[i] or brigade[j] else solid).append((a, b))

    geom = {"areas": areas, "solid": chains(solid), "dashed": chains(dashed)}
    meta = dict(MIL_THEME)
    meta["cats"] = [{"id": c[0], "en": c[1], "c": c[2]} for c in MIL_COMMANDS]
    print("military   %d areas, %d vertices; lines: %d shared edges, %d by "
          "nearness; %d solid and %d dashed chains"
          % (len(areas), verts, shared, near, len(geom["solid"]),
             len(geom["dashed"])))
    return meta, geom


def seg_dist(p, a, b):
    """Distance in degrees from p to the segment ab: short, so flat is fine."""
    ax, ay = a[0] - p[0], a[1] - p[1]
    bx, by = b[0] - p[0], b[1] - p[1]
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0.0 if not L else max(0.0, min(1.0, -(ax * dx + ay * dy) / L))
    x, y = ax + t * dx, ay + t * dy
    return (x * x + y * y) ** 0.5


def chains(segs):
    """Segments joined end to end into as few polylines as they make, each a
    flat [lon, lat, …] list. Order within a chain is the only thing decided
    here; no vertex is added, moved or dropped."""
    adj = {}
    for n, (a, b) in enumerate(segs):
        adj.setdefault(tuple(a[:2]), []).append(n)
        adj.setdefault(tuple(b[:2]), []).append(n)
    used = [False] * len(segs)
    out = []
    for n in range(len(segs)):
        if used[n]:
            continue
        used[n] = True
        a, b = segs[n]
        line = [tuple(a[:2]), tuple(b[:2])]
        for end in (1, 0):
            while True:
                tip = line[-1] if end else line[0]
                nxt = [m for m in adj.get(tip, ()) if not used[m]]
                if not nxt:
                    break
                m = nxt[0]
                used[m] = True
                c, d = tuple(segs[m][0][:2]), tuple(segs[m][1][:2])
                far = d if c == tip else c
                if end:
                    line.append(far)
                else:
                    line.insert(0, far)
        out.append(flat(line))
    return out


if __name__ == "__main__":
    main()
