#!/usr/bin/env python3
"""French Indochina: the traced administrative sheet, and the outlines drawn
from it.

`data/indochina/french-indochina-1930.geojson` is a hand-traced coverage of the
whole federation — 95 units in five protectorates, from the 1945 OSS map held
at Stanford as bv890bn4231. It replaces what the map drew before, which was
Natural Earth's Vietnam cut by two straight lines standing in for the watershed
between Tonkin, Annam and Cochinchina, next to geoBoundaries' modern provinces
of Laos and Cambodia. Those two sources did not draw their shared border in the
same place and the units were the wrong units; this is one source, drawn for
the period, and the divisions are the ones the administration actually had.

What this writes:

    french-indochina-admin.geojson            the coverage with every unit
                                              resolved: name, French name,
                                              note, protectorate, ceded
    french-indochina-1930-dissolved.geojson   the whole federation, one outline
    french-indochina-1942-dissolved.geojson   the same minus the 1941 cession
    french-indochina-1941-ceded.geojson       the cession, one outline per
                                              protectorate it came out of

build_map.py reads the first three. Resolving the coverage here rather than
there keeps the judgement calls — which protectorate an unnamed island belongs
to, which units the 1941 cession took — in one file that prints what it decided,
instead of spread through a 9,000-line build where nobody would find them.

The build draws the 1942 outline as the atom and the cession as `siamgain`,
because one geometry serves both sheets: in 1930 the ceded ground is still
Cambodia and Laos and is coloured with them, and in December 1942 it is
Thailand's. The 1930 dissolve is not used by the build — it is the file a
reader downloading "French Indochina" wants, and the one task #103 asks for.

## The dissolve is exact, not a tolerance

The coverage is topologically clean: of its 10,681 directed edges every one is
unique, and the 6,004 that lie on an interior boundary appear once in each
direction. So the outline is what is left when those cancel — no buffering, no
snapping, no grid. Nothing is moved and nothing is thinned, which is the point:
`simplify()` in build_map.py is where any reduction belongs, under the
tolerance that file argues for, and a dissolve that quietly rounded coordinates
would have thrown away tracing the author did by hand.

If the pairing ever breaks — an edited vertex on one side of a shared border
and not the other — `dissolve()` says so and names the count rather than
closing the ring through open country.
"""
import collections
import csv
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "indochina")
SRC = os.path.join(DATA, "french-indochina-1930.geojson")
TEXTS = os.path.join(ROOT, "texts", "territories", "sub-units", "indochina.csv")

ABSTRACT = "Traced from the 1945 OSS map held at Stanford as bv890bn4231"

# The five units of the federation, in the order the map lists them: the three
# Vietnamese pieces from north to south, then the two inland protectorates.
PROTECTORATES = ("Tonkin", "Annam", "Cochinchina", "Cambodia", "Laos")

# Battambang.
#
# The 1941 cession is flagged on the features themselves, `ceded: true`, and
# five carry it: the trans-Mekong part of Luang Prabang, Champasak west of the
# river, Siem Reap, and the slices of Stung Treng and Kampong Thom that became
# Preah Vihear. Battambang does not, and the Tokyo convention of 9 May 1941
# took the province entire — it was renamed Phra Tabong and administered from
# Bangkok until 1946. The map already drew it as Thailand's on the 1942 sheet,
# from `SIAM_1941_KHM` in build_map.py, so leaving the flag as it stands would
# have handed the province back to France four years early.
#
# Named here rather than edited into the source: the traced file is the author's
# and a build tool has no business rewriting it, but it also cannot draw a
# cession it has been told to ignore. If the flag is added upstream this set can
# go, and `check()` will say so rather than double-count.
CEDED_TOO = {("Cambodia", "Battambang")}

# Two features arrive with no name, and one of those with no protectorate
# either. Both are islands: fid 44 is the Cambodian group off Koh Kong, and
# fid 5 is 24 islands strung along 1,400 km of Vietnamese coast, from the Hạ
# Long group at 21.4 N to Côn Đảo at 8.65 N.
#
# Each island joins the nearest named province rather than becoming a unit of
# its own. That is what the administration did — Phú Quốc was governed from Hà
# Tiên, Côn Đảo from Bà Rịa, the Hạ Long islands from Quảng Yên — and it is the
# only choice here that invents nothing. Giving them a protectorate and no name
# would leave a reader who points at Cát Bà told "French Indochina" and no more;
# giving them names of their own would be five units the trace does not have.
#
# The assignment is by centroid distance and is printed, province by province,
# so it can be checked rather than trusted. Nothing is moved: the island keeps
# its own ring and simply answers to a neighbour's name.
# The assignment is by centroid distance and is printed, island by island, so
# it can be checked rather than trusted. Nothing is moved: the island keeps its
# own ring and simply answers to a neighbour's name.
ISLAND_FIDS = (5, 44)

# Where proximity gets it wrong, said outright.
#
# Keyed on the island's centroid to a hundredth of a degree — about a
# kilometre, which no two of these twenty-nine are within of each other — so an
# entry names one island and cannot silently start matching another. `check()`
# fails on an entry that matches nothing, so a re-traced coast cannot leave a
# correction pointing at open water.
#
# Phú Quốc, 559 km2 and the largest island in the federation, is 33 km off
# Cambodia and 53 off Cochinchina, so the nearest coast is the wrong answer:
# the island was administered from Hà Tiên, in Cochinchina, and its status is
# the one thing about it that has never stopped being argued over. Giving it to
# Kampot would have drawn the Cambodian claim as a fact.
#
# Côn Đảo — Poulo Condore — was not part of any province. It was the penal
# settlement, run directly under the Governor of Cochinchina, and proximity put
# it in Bạc Liêu 88 km away. It keeps its own name, which is what it had.
#
# The other twenty-seven are left to proximity and printed. Cát Hải (81 km2, at
# 106.82, 20.85) is the closest call of them: Quảng Yên by 0.05° and Kiến An by
# 0.08°, and it was Kiến An's. It is not corrected here because the two are
# neighbours drawn in one colour and the difference is a name in a tooltip; say
# so with an entry if that is worth fixing.
ISLAND_UNIT = {
    (103.98, 10.27): ("Cochinchina", "Hà Tiên"),
    (106.63, 8.71): ("Cochinchina", "Côn Đảo"),
}

Q = 10 ** 7          # 1e-7 degrees, about a centimetre: the trace's own precision

# A hole this small is not a hole.
#
# Where three units meet, the traced vertices do not always land on exactly one
# point, and the two edges that survive the cancellation close a triangle a few
# hundred metres on a side. Twenty-one of them came out of the 1930 dissolve and
# they came to 0.1 km2 between them, the largest 0.1 and the rest indistinguish-
# able from zero. Written into the outline they would paint sea inside Cambodia,
# and a four-point ring of no area is also what `check_no_zero_subpaths` in
# build_map.py exists to catch.
#
# Applied to holes only. An outer ring is an island and the smallest real one
# here is 10.2 km2, a hundredfold clear of this, so nothing the trace draws as
# land can be lost to it. What goes is printed.
HOLE_MIN_KM2 = 1.0


def qz(pt):
    return (int(round(pt[0] * Q)), int(round(pt[1] * Q)))


def unqz(k):
    return (k[0] / Q, k[1] / Q)


def rings_of(geom):
    """Every ring of a geometry, as lists of (lon, lat)."""
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" \
        else [geom["coordinates"]]
    for poly in polys:
        for ring in poly:
            if len(ring) >= 4:
                yield [(float(c[0]), float(c[1])) for c in ring]


def signed_area(ring):
    a = 0.0
    for i in range(len(ring) - 1):
        a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    return a / 2.0


def km2(ring):
    """Spherical area, so the figures printed are comparable with the sources."""
    a = 0.0
    for i in range(len(ring) - 1):
        x0, y0 = ring[i]
        x1, y1 = ring[i + 1]
        a += math.radians(x1 - x0) * (math.sin(math.radians(y1))
                                      + math.sin(math.radians(y0))) / 2.0
    return abs(a) * 6371.0088 ** 2


def centroid(ring):
    n = len(ring) - 1
    return (sum(p[0] for p in ring[:n]) / n, sum(p[1] for p in ring[:n]) / n)


def point_in_ring(p, ring):
    x, y = p
    inside = False
    for i in range(len(ring) - 1):
        x0, y0 = ring[i]
        x1, y1 = ring[i + 1]
        if (y0 > y) != (y1 > y):
            t = (y - y0) / (y1 - y0)
            if x < x0 + t * (x1 - x0):
                inside = not inside
    return inside


def dissolve(rings, what):
    """One outline out of a set of rings that share their interior edges.

    Every edge is kept once, in the direction it was given; an edge whose
    reverse is also present lies between two of the units and both go. What is
    left is chained end to end. A vertex where three units meet has two
    outgoing edges left, which is why the walk takes them in turn rather than
    assuming one.
    """
    out_edges = collections.defaultdict(list)
    seen = set()
    doubled = 0
    for ring in rings:
        pts = [qz(p) for p in ring]
        for a, b in zip(pts, pts[1:]):
            if a == b:
                continue
            if (a, b) in seen:
                doubled += 1
            seen.add((a, b))
    if doubled:
        raise SystemExit("%s: %d directed edges appear twice, so the coverage "
                         "overlaps itself and the outline cannot be trusted"
                         % (what, doubled))
    kept = [e for e in seen if (e[1], e[0]) not in seen]
    for a, b in kept:
        out_edges[a].append(b)

    loops = []
    for start in list(out_edges):
        while out_edges.get(start):
            chain = [start]
            here = start
            while True:
                nxt = out_edges.get(here)
                if not nxt:
                    raise SystemExit(
                        "%s: the outline runs off the end at %.5f,%.5f — a "
                        "shared border has been edited on one side only"
                        % ((what,) + unqz(here)))
                step = nxt.pop()
                if not nxt:
                    del out_edges[here]
                chain.append(step)
                here = step
                if here == start:
                    break
            if len(chain) >= 4:
                loops.append([unqz(k) for k in chain])
    return loops


def to_polygons(loops, what=""):
    """Nest the loops into GeoJSON polygons, outer ring first.

    A dissolve can produce a hole — a unit missing from the middle of the
    coverage, or ground the trace leaves out — and a hole written as a polygon
    of its own is painted as land. Containment is tested by a point of the
    smaller loop against the larger, which is safe here because the loops come
    out of one coverage and cannot cross.
    """
    order = sorted(range(len(loops)), key=lambda i: -abs(signed_area(loops[i])))
    parent = {}
    for pos, i in enumerate(order):
        p = loops[i][0]
        for j in order[:pos]:
            if point_in_ring(p, loops[j]):
                parent[i] = j
    outers = [i for i in order if i not in parent]
    polys = []
    dropped, dropped_km2 = 0, 0.0
    for i in outers:
        outer = loops[i]
        if signed_area(outer) < 0:
            outer = outer[::-1]              # RFC 7946: outer ring anticlockwise
        holes = []
        for j, par in parent.items():
            if par != i:
                continue
            h = loops[j]
            a = km2(h)
            if a < HOLE_MIN_KM2:
                dropped += 1
                dropped_km2 += a
                continue
            if signed_area(h) > 0:
                h = h[::-1]
            holes.append(h)
        polys.append([outer] + holes)
    if dropped:
        print("  %s: %d junction sliver(s) dropped, %.2f km2 between them"
              % (what or "dissolve", dropped, dropped_km2))
    return polys


def feature(polys, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": "MultiPolygon", "coordinates": polys}}


def write(path, feats, note):
    doc = {"type": "FeatureCollection",
           "name": os.path.basename(path)[:-len(".geojson")],
           "crs": {"type": "name",
                   "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
           "source": ABSTRACT,
           "note": note,
           "features": feats}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    n = sum(len(r) for f in feats for p in f["geometry"]["coordinates"] for r in p)
    print("  %-44s %2d feature(s), %5d vertices, %7.0f km2"
          % (os.path.basename(path), len(feats), n,
             sum(km2(r) for f in feats
                 for p in f["geometry"]["coordinates"] for r in p[:1])))


def nearest_unit(ring, mainland):
    """The named unit whose outline comes closest to this island's centroid.

    Every traced vertex is tested, not every seventh: the coast here is drawn
    finely and a stride would let an island fall to the province next door
    because the nearer one happened to be sampled on the wrong side of a
    headland. 10,681 vertices against 29 islands is nothing to compute.
    """
    c = centroid(ring)
    best, bd = None, None
    for ident, rings in mainland.items():
        for r in rings:
            for p in r:
                d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2
                if bd is None or d < bd:
                    bd, best = d, ident
    return best, math.sqrt(bd or 0)


def main():
    if not os.path.exists(SRC):
        raise SystemExit("missing %s" % SRC)
    with open(SRC, encoding="utf-8") as fh:
        doc = json.load(fh)
    feats = doc["features"]
    print("%s: %d features" % (os.path.basename(SRC), len(feats)))

    units = {}        # (protectorate, name, ceded) -> record
    islands = []
    mainland = {}
    order = []

    def ident(rec):
        return (rec["prot"], rec["name"], rec["ceded"])

    for f in feats:
        p = f["properties"]
        rings = list(rings_of(f["geometry"]))
        rec = {"fid": p.get("fid"),
               "prot": (p.get("protectorate_en") or "").strip(),
               "name": (p.get("name") or "").strip(),
               "french": (p.get("name_french") or "").strip(),
               "note": (p.get("Note") or "").strip(),
               "ceded": bool(p.get("ceded")),
               "rings": rings}
        if p.get("fid") in ISLAND_FIDS:
            islands.append(rec)
            continue
        if not rec["name"] or not rec["prot"]:
            raise SystemExit("fid %s has no name or no protectorate and is not "
                             "one of the island groups in ISLAND_FIDS"
                             % rec["fid"])
        if rec["prot"] not in PROTECTORATES:
            raise SystemExit("fid %s is in %r, which is not one of the five"
                             % (rec["fid"], rec["prot"]))
        k = ident(rec)
        if k in units:
            # two features of one unit: merge, and keep the fuller note
            units[k]["rings"].extend(rings)
            if len(rec["note"]) > len(units[k]["note"]):
                units[k]["note"] = rec["note"]
        else:
            units[k] = rec
            order.append(k)
        mainland.setdefault(k, []).extend(rings)

    # ---- the unnamed islands, each to the province nearest it -------------
    placed = []
    used = set()
    for rec in islands:
        for ring in rec["rings"]:
            c = centroid(ring)
            spot = (round(c[0], 2), round(c[1], 2))
            said = ISLAND_UNIT.get(spot)
            if said:
                used.add(spot)
                k, d, how = (said[0], said[1], False), 0.0, "stated"
                if k not in units:
                    units[k] = {"fid": rec["fid"], "prot": said[0],
                                "name": said[1], "french": "", "note": "",
                                "ceded": False, "rings": []}
                    order.append(k)
                    mainland.setdefault(k, [])
            else:
                # fid 44 states Cambodia; fid 5 states nothing. Where a
                # protectorate is given it is honoured, and only the provinces
                # inside it are candidates.
                pool = {k: v for k, v in mainland.items()
                        if not rec["prot"] or k[0] == rec["prot"]}
                k, d = nearest_unit(ring, pool)
                how = "nearest"
            units[k]["rings"].append(ring)
            placed.append((km2(ring), c, k, d, how))
    missed = set(ISLAND_UNIT) - used
    if missed:
        raise SystemExit("ISLAND_UNIT names %s, and no island has that "
                         "centroid — the coast has been re-traced and the "
                         "correction now points at open water"
                         % ", ".join("%.2f,%.2f" % m for m in sorted(missed)))
    print("  %d unnamed island(s), %.0f km2, folded into named provinces "
          "(%d stated, %d by proximity):"
          % (len(placed), sum(a for a, _, _, _, _ in placed),
             sum(1 for p in placed if p[4] == "stated"),
             sum(1 for p in placed if p[4] == "nearest")))
    for area, c, k, d, how in sorted(placed, reverse=True,
                                     key=lambda p: p[0]):
        print("      %6.1f km2 at %8.3f,%7.3f  ->  %-12s %-16s  %s"
              % (area, c[0], c[1], k[0], k[1],
                 "stated" if how == "stated" else "%.2f deg away" % d))

    # ---- the 1941 cession -------------------------------------------------
    for k in list(units):
        if (k[0], k[1]) in CEDED_TOO and not k[2]:
            rec = units.pop(k)
            order.remove(k)
            rec["ceded"] = True
            nk = ident(rec)
            if nk in units:
                units[nk]["rings"].extend(rec["rings"])
            else:
                units[nk] = rec
                order.append(nk)
        elif (k[0], k[1]) in CEDED_TOO:
            print("  note: %s is flagged ceded in the source now; CEDED_TOO "
                  "can go" % k[1])

    ceded = [units[k] for k in order if units[k]["ceded"]]
    kept = [units[k] for k in order if not units[k]["ceded"]]
    print("  %d units: %d still French in December 1942, %d ceded to Thailand "
          "in May 1941" % (len(units), len(kept), len(ceded)))
    print("  the cession, %.0f km2:"
          % sum(km2(r) for u in ceded for r in u["rings"]))
    for u in sorted(ceded, key=lambda u: -sum(km2(r) for r in u["rings"])):
        print("      %-12s %-16s %7.0f km2"
              % (u["prot"], u["name"], sum(km2(r) for r in u["rings"])))

    # ---- what gets written ------------------------------------------------
    print("writing:")
    admin = []
    for k in order:
        u = units[k]
        admin.append(feature(
            [[r] for r in u["rings"]],
            {"name": u["name"], "name_french": u["french"],
             "protectorate": u["prot"], "note": u["note"],
             "ceded": u["ceded"],
             "km2": round(sum(km2(r) for r in u["rings"]), 1)}))
    write(os.path.join(DATA, "french-indochina-admin.geojson"), admin,
          "The traced coverage with every unit resolved: the unnamed islands "
          "folded into the province nearest each, and the 1941 cession marked.")

    write(os.path.join(DATA, "french-indochina-1930-dissolved.geojson"),
          [feature(to_polygons(dissolve([r for u in units.values()
                                         for r in u["rings"]], "1930"), "1930"),
                   {"name": "French Indochina", "year": 1930,
                    "note": "The whole federation, before the 1941 cession to "
                            "Thailand."})],
          "The traced units dissolved into one outline.")

    write(os.path.join(DATA, "french-indochina-1942-dissolved.geojson"),
          [feature(to_polygons(dissolve([r for u in kept for r in u["rings"]],
                                        "1942"), "1942"),
                   {"name": "French Indochina", "year": 1942,
                    "note": "The federation as it stood in December 1942, the "
                            "territory ceded to Thailand in May 1941 left "
                            "out."})],
          "The traced units, less the 1941 cession, dissolved into one outline.")

    ced_feats = []
    for prot in PROTECTORATES:
        mine = [r for u in ceded if u["prot"] == prot for r in u["rings"]]
        if not mine:
            continue
        ced_feats.append(feature(
            to_polygons(dissolve(mine, "ceded/" + prot), "ceded/" + prot),
            {"name": prot, "year": 1941,
             "note": "Ceded to Thailand in May 1941 and returned in 1946."}))
    write(os.path.join(DATA, "french-indochina-1941-ceded.geojson"), ced_feats,
          "The 1941 cession, one outline per protectorate it came out of.")

    # ---- the 1930 sheet, where the cession has not happened ---------------
    #
    # Five provinces are cut by the 1941 line — Luang Prabang, Champasak, Siem
    # Reap, Stung Treng and Kampong Thom — and the map draws the two sides in
    # two atoms, because in December 1942 one side is Thailand's. On the 1930
    # sheet both sides are French Indochina and the cut had not been made, so
    # the reader should see one province and there was a seam down the middle
    # of each.
    #
    # Dissolved here rather than drawn twice and hidden: the two halves come
    # out of one traced coverage and share every vertex of the line between
    # them, so the seam cancels exactly and the result is the province as the
    # trace has it. Simplifying the two halves separately — which is what the
    # build does, each inside its own atom — is what made the seam visible in
    # the first place: the same edge thinned twice gives two slightly different
    # lines.
    by_name = collections.defaultdict(list)
    for k in order:
        by_name[(units[k]["prot"], units[k]["name"])].append(units[k])
    whole, split = [], []
    for (prot, name), group in by_name.items():
        rings = [r for u in group for r in u["rings"]]
        note = max((u["note"] for u in group), key=len, default="")
        if len(group) > 1:
            rings = [r for poly in to_polygons(dissolve(rings, "1930/" + name),
                                               "1930/" + name)
                     for r in poly]
            split.append(name)
        whole.append(feature([[r] for r in rings],
                             {"name": name, "name_french": group[0]["french"],
                              "protectorate": prot, "note": note,
                              "ceded": False,
                              "km2": round(sum(km2(r) for r in rings), 1)}))
    print("  the 1930 sheet: %d units, %d of them a province the cession cuts "
          "put back together (%s)"
          % (len(whole), len(split), ", ".join(sorted(split))))
    write(os.path.join(DATA, "french-indochina-1930-admin.geojson"), whole,
          "The coverage as it stood in 1930: the provinces the 1941 cession "
          "later cut are one shape each.")

    fill_texts([units[k] for k in order])


def fill_texts(units):
    """Put the traced names into texts/, without touching a word already there.

    The trace carries three things the map wants to show — the name, the French
    form of it, and whatever the tracer noted about the unit — and they have to
    reach `JMAP.PROVINCES` to be shown at all. They go through texts/ like every
    other name on this map, so that the author can write prose against them in
    texts/admin and have it survive the next run of this tool.

    **Blank cells only.** A cell with anything in it is the author's and is left
    exactly as it is; a row whose key is not in the trace is left alone too,
    because the five protectorates live in this file and are not units. New
    units are appended. That is the "fill whatever is blank now" rule from
    CLAUDE.md, and it is what makes the tool safe to run twice.

    Rows are addressed by `key` and never by position, for the reason that file
    gives: a row number is only true of one version of a file.
    """
    cols = ["key", "en", "short", "fr", "zh", "wiki"]
    rows, order = {}, []
    if os.path.exists(TEXTS):
        with open(TEXTS, newline="", encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                rows[r["key"]] = r
                order.append(r["key"])
    added, filled = [], collections.Counter()
    for u in units:
        want = {"key": u["name"], "en": u["name"], "short": u["note"],
                "fr": u["french"], "zh": "", "wiki": ""}
        row = rows.get(u["name"])
        if row is None:
            rows[u["name"]] = {c: want.get(c, "") for c in cols}
            order.append(u["name"])
            added.append(u["name"])
            continue
        for c in cols:
            if not (row.get(c) or "").strip() and want.get(c):
                row[c] = want[c]
                filled[c] += 1
    with open(TEXTS, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for k in order:
            w.writerow({c: rows[k].get(c, "") or "" for c in cols})
    print("  %s: %d row(s), %d added%s"
          % (os.path.relpath(TEXTS, ROOT), len(order), len(added),
             (", blanks filled: "
              + ", ".join("%s x%d" % (c, n) for c, n in sorted(filled.items())))
             if filled else ""))


if __name__ == "__main__":
    main()
