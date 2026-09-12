"""Burma in 1931, district by district, and the outline they make.

    python3 tools/build_burma.py

Reads `data/burma/burma-1931-admin.geojson` — 91 features, the districts of
Burma proper with the Shan and Karenni states — and writes what the map reads:

    burma-1931-admin.geojson      the units, one winding, with the group each
                                  belonged to
    burma-1931-dissolved.geojson  Burma as one shape, for the sheet with
                                  Administrative off and for the atom itself

The dissolve is exact and by edge cancellation, the same as French Indochina's
and the Indies': every interior edge appears twice in opposite directions, and
what is left when the pairs cancel is the frontier and the coast. Nothing is
snapped and nothing is simplified.

**Four things in the source have to be settled first, and none of them is a
judgement about where a boundary runs.**

1. **Two zero-area needles on the Myitkyina–Triangle border.** The coverage
   refused to dissolve on four directed edges appearing twice — and they are
   two segments, each written out and back along itself in *both* units:
   97.98958-97.99375 E at 25.76458 N, and 98.28750-98.29375 E at 26.49792 N.
   A spur of no width is not an overlap and not a border; it is a digitising
   artefact, and `despike` takes it out. Nothing with area is touched, and the
   count is reported.

2. **`Hanthawaddy` is in the file twice**, 4,095 km2 and 4,833 km2, north and
   south of Rangoon. That is one district in two pieces, which this map draws
   perfectly well — but the sub-unit key is the name, so the two features are
   merged into one unit of two polygons rather than fighting over it.

3. **Five units have no name at all**: three in the Shan States, one in
   Karenni, one with no group either, between 67 and 415 km2. They are real
   ground and they stay in the coverage, because the dissolve needs every
   piece or the outline grows a hole — but they are written with no name, so
   the map draws them as Burma with no division on them. Inventing a name for
   a shape the source leaves blank would be the worse error.

4. **`Tribal Area` is `The Triangle`**, renamed at the author's instruction.

The groups are the seven Divisions of Burma proper, the Federated Shan States
gathered from the five `Shan States…` spellings the source uses, and Karenni.
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_indochina as ic                                  # noqa: E402
import build_dei                                              # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "burma")
SRC = os.path.join(DATA, "burma-1931-admin.geojson")
OUT_ADMIN = os.path.join(DATA, "burma-1931-admin-units.geojson")
OUT_WHOLE = os.path.join(DATA, "burma-1931-dissolved.geojson")
TEXTS = os.path.join(ROOT, "texts", "territories", "sub-units", "burma-admin.csv")

ABSTRACT = ("the divisions and districts of Burma, drawn from the Imperial "
            "Gazetteer of India, Atlas: 1931, digitised by the University of "
            "Chicago Digital South Asia Library")

# **THE GROUPS, AND WHAT THE SOURCE CALLS THEM.**
#
# Seven Divisions in Burma proper, and the Shan States under five spellings —
# plain, North, Central, Myelat — which are one thing on the ground: the
# Federated Shan States, constituted in 1922. They are gathered under one name
# so that pointing at Mong Nai shades the federation rather than one of the
# source's spellings of it. Karenni is kept apart because it was: four states
# in treaty relations with the Crown, never annexed and never part of Burma
# proper, and the author's instruction named the Shan States alone.
DIVISIONS = ("Tenasserim", "Arakan", "Pegu", "Irrawaddy", "Sagaing",
             "Mandalay", "Magwe")
SHAN = "Federated Shan States"
KARENNI = "Karenni States"
GROUP_OF = {d: d + " Division" for d in DIVISIONS}
GROUP_OF["Karenni"] = KARENNI

# Asked for by name: the source's `Tribal Area` is the wedge between the
# Chindwin's headwaters and the Chinese frontier, and The Triangle is what it
# was called.
RENAME = {"Tribal Area": "The Triangle"}


def group_of(state):
    """Which larger unit a district sat in, or '' where the source gives none."""
    state = (state or "").strip()
    if not state:
        return ""
    if state.startswith("Shan States"):
        return SHAN
    if state in GROUP_OF:
        return GROUP_OF[state]
    raise SystemExit("the group %r is not one this tool knows. Add it to "
                     "DIVISIONS or GROUP_OF with a shade in styles.css, or "
                     "the reader gets a grouping nothing draws" % state)


def despike(ring):
    """A ring with its zero-width spurs removed, and how many went.

    A spur is a vertex whose neighbours are the same point: the line goes out
    to it and comes straight back, enclosing no area. It cannot be a boundary
    and it stops the dissolve dead, because the segment appears in both
    directions in the same ring and again in the neighbour's.

    Run to a fixed point, since taking one spur out can reveal another behind
    it. Compared on the dissolve's own 1e-6-degree grid, so two vertices the
    cancellation would treat as one are treated as one here too.
    """
    out = [tuple(p[:2]) for p in ring]
    closed = len(out) > 1 and ic.qz(out[0]) == ic.qz(out[-1])
    if closed:
        out = out[:-1]
    gone = 0
    changed = True
    while changed and len(out) > 3:
        changed = False
        keep = []
        i = 0
        n = len(out)
        while i < n:
            prv = out[(i - 1) % n]
            nxt = out[(i + 1) % n]
            if n > 3 and ic.qz(prv) == ic.qz(nxt):
                gone += 1
                changed = True
                i += 1                      # drop this vertex
                continue
            keep.append(out[i])
            i += 1
        if changed:
            out = keep
            n = len(out)
    if closed:
        out = out + [out[0]]
    return out, gone


def main():
    if not os.path.exists(SRC):
        raise SystemExit("%s is missing" % SRC)
    feats = json.load(open(SRC, encoding="utf-8"))["features"]
    print("read %-28s %d features" % (os.path.basename(SRC), len(feats)))

    # ---- the units, merged by name and cleaned --------------------------
    units = collections.OrderedDict()      # name -> unit; "" is not merged
    blanks = []
    spikes = 0
    verts_in = 0
    for feat in feats:
        pr = feat["properties"]
        geom = feat.get("geometry") or {}
        if not geom.get("coordinates"):
            raise SystemExit("fid %s has no geometry" % pr.get("fid"))
        name = RENAME.get((pr.get("name") or "").strip(),
                          (pr.get("name") or "").strip())
        group = group_of(pr.get("state"))
        polys = []
        for poly in build_dei.unit_polys(geom):
            fixed = []
            for ring in poly:
                verts_in += len(ring)
                cleaned, gone = despike(ring)
                spikes += gone
                if len(cleaned) >= 4:
                    fixed.append(cleaned)
            if fixed:
                polys.append(fixed)
        if not polys:
            raise SystemExit("fid %s came to nothing after cleaning"
                             % pr.get("fid"))
        if not name:
            # kept for the dissolve, drawn with no division on it
            blanks.append({"name": "", "group": group, "polys": polys,
                           "fid": pr.get("fid")})
            continue
        if name in units:
            # one district in two pieces: the map draws that, the key cannot
            units[name]["polys"].extend(polys)
            units[name]["merged"] += 1
            if group and not units[name]["group"]:
                units[name]["group"] = group
        else:
            units[name] = {"name": name, "group": group, "polys": polys,
                           "merged": 0}
    merged = [u["name"] for u in units.values() if u["merged"]]
    print("  %d spike vertex(es) removed, no area touched" % spikes)
    if merged:
        print("  merged by name: %s" % ", ".join(merged))
    print("  %d unit(s) the source leaves unnamed, kept and not named: %s"
          % (len(blanks), ", ".join("fid " + str(b["fid"]) for b in blanks)))

    named = list(units.values())
    every = named + blanks
    for u in every:
        u["km2"] = round(sum(ic.km2(p[0]) - sum(ic.km2(h) for h in p[1:])
                             for p in u["polys"]), 1)

    ic.write(OUT_ADMIN, [
        ic.feature(u["polys"], {"name": u["name"], "group": u["group"],
                                "km2": u["km2"]})
        for u in every
    ], "the units of Burma, 1931. " + ABSTRACT)

    # ---- and Burma as one shape ------------------------------------------
    #
    # **THE OUTLINE KEEPS NO HOLES, AND THE BIGGEST ONE IS RANGOON.**
    #
    # A hole in this dissolve is not a hole in the country. Burma had no
    # enclave of anybody else's territory inside it, so every gap the
    # cancellation leaves is ground the source gives to no district — and the
    # largest is 88.6 km2 at 96.246 E 16.781 N, which is **Rangoon**: the town
    # was its own administration and is not one of the 91 features, so the two
    # pieces of Hanthawaddy surround a space where the capital should be. Left
    # as a hole it would show the ocean through the middle of Rangoon.
    #
    # So they are filled, and counted, and the largest are named with their
    # coordinates: an outline that quietly swallowed 132 km2 would be a worse
    # answer than one that says where it did.
    rings = [r for u in every for p in u["polys"] for r in p]
    loops = ic.dissolve(rings, "Burma")
    _save = ic.HOLE_MIN_KM2
    ic.HOLE_MIN_KM2 = 0.0                  # nest them, then decide here
    nested = ic.to_polygons(loops, "Burma")
    ic.HOLE_MIN_KM2 = _save
    holes = [h for p in nested for h in p[1:]]
    polys = [[p[0]] for p in nested]       # outers only: the gaps are filled
    area_whole = sum(ic.km2(p[0]) for p in polys)
    ic.write(OUT_WHOLE, [ic.feature(polys, {
        "name": "Burma", "km2": round(area_whole, 1)})],
        "Burma dissolved from its %d units, interior gaps filled. %s"
        % (len(every), ABSTRACT))

    area_units = sum(u["km2"] for u in every)
    verts_out = sum(len(r) for p in polys for r in p)
    kept = sum(len(r) for u in every for p in u["polys"] for r in p)
    print("units      %d named + %d unnamed, %d vertices in, %d after cleaning,"
          " %s km2" % (len(named), len(blanks), verts_in, kept,
                       f"{area_units:,.0f}"))
    print("dissolved  %d piece(s), %d vertices (%d of interior edge cancelled),"
          " %s km2" % (len(polys), verts_out, kept - verts_out,
                       f"{area_whole:,.0f}"))
    if holes:
        holes.sort(key=ic.km2, reverse=True)
        print("  %d interior gap(s) filled, %.1f km2 between them; the "
              "largest:" % (len(holes), sum(ic.km2(h) for h in holes)))
        for h in holes[:4]:
            cx, cy = ic.centroid(h)
            print("    %8.2f km2 at %.3f, %.3f" % (ic.km2(h), cx, cy))
    # **The check is a bound, not an equality.** The outline has to hold every
    # unit and may hold a little more, because the gaps above are inside it and
    # in no unit. What it must never do is come out *smaller* than the ground
    # it is made of, which is what an overlap or an eaten boundary looks like.
    spare = area_whole - area_units
    print("  %s km2 of the outline is in no unit (the gaps above)"
          % f"{spare:,.1f}")
    if spare < -2.0:
        raise SystemExit("the units come to %.1f km2 and their outline to only "
                         "%.1f -- the dissolve has lost ground"
                         % (area_units, area_whole))
    if spare > 400.0:
        raise SystemExit("%.1f km2 of the outline belongs to no unit, which is "
                         "more than Rangoon and a scatter of junctions can "
                         "account for -- look for a district missing from the "
                         "source" % spare)

    by = collections.Counter(u["group"] or "(none)" for u in every)
    print("groups")
    for g in [GROUP_OF[d] for d in DIVISIONS] + [SHAN, KARENNI, "(none)"]:
        if by.get(g):
            print("  %-30s %2d units" % (g, by[g]))

    print("texts      %s" % fill_texts(named))


def fill_texts(units):
    """A row per named unit in texts/, addressed by key, writing only blanks.

    The same five columns the other sub-unit tables use. `en` is the name the
    source gives; what a district or a Shan state *was* is for a person to
    write, so `short` is left empty. The groups get rows of their own, because
    the card looks their names up here to gloss the line above the country.
    """
    import csv
    cols = ["key", "en", "short", "alt", "wiki"]
    rows = []
    if os.path.exists(TEXTS):
        with open(TEXTS, encoding="utf-8", newline="") as fh:
            rd = csv.DictReader(fh)
            if rd.fieldnames and set(rd.fieldnames) >= {"key", "en"}:
                cols = list(rd.fieldnames)
                rows = list(rd)
    by_key = {r.get("key"): r for r in rows}
    added = touched = 0

    def put(key, **vals):
        nonlocal added, touched
        row = by_key.get(key)
        if row is None:
            row = {c: "" for c in cols}
            row["key"] = key
            rows.append(row)
            by_key[key] = row
            added += 1
        for col, val in vals.items():
            if col in cols and val and not (row.get(col) or "").strip():
                row[col] = val
                touched += 1

    for u in units:
        put(u["name"], en=u["name"])
    for g in [GROUP_OF[d] for d in DIVISIONS] + [SHAN, KARENNI]:
        if any(u["group"] == g for u in units):
            put(g, en=g)

    with open(TEXTS, "w", encoding="utf-8", newline="") as fh:
        wr = csv.DictWriter(fh, fieldnames=cols)
        wr.writeheader()
        for r in rows:
            wr.writerow({c: r.get(c, "") for c in cols})
    return "%d row(s) added, %d blank cell(s) filled, %d in the file" % (
        added, touched, len(rows))


if __name__ == "__main__":
    main()
