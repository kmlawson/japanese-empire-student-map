"""The Netherlands Indies, residency by residency, and the outline they make.

    python3 tools/build_dei.py

Reads `data/dei/dei-admin-1930.geojson` — 65 units, Natural Earth coastlines
with the residency boundaries of Robert Cribb's *Historical Atlas of
Indonesia* (2000) laid on them, Java at pp. 125-6, Sumatra 127, Borneo 129 and
the east 131 — and writes what the map reads:

    dei-1930-admin.geojson        the 65 units, one winding, with their
                                  Dutch name, alternative name, gouvernement
                                  and Wikipedia link
    dei-1930-dissolved.geojson    the colony as one shape, for the sheet with
                                  Administrative off

**The dissolve is exact and is not a buffer.** Every interior edge in the
coverage appears twice, once in each unit and in opposite directions, so
cancelling the pairs leaves the coast and nothing else. Nothing is snapped,
nothing is simplified, and the tool refuses rather than guessing if the
cancellation does not come out: an edge that appears twice in the *same*
direction means two units claim the same ground, and an outline that runs off
the end means a shared border has been edited on one side only.

**One thing has to be normalised first.** The source does not keep a
consistent winding — 254 directed edges arrive twice the same way round — so
each polygon is turned to RFC 7946 before anything is cancelled: outer ring
anticlockwise, holes clockwise. This is the same fact the arc work found in
the Republican provinces file, where 6,114 shared edges ran the same way round
in both provinces. Winding in a hand-assembled coverage cannot be trusted, and
it is cheaper to impose one than to write a dissolve that does not need one.

The heavy geometry is `build_indochina`'s. That tool established the exact
dissolve on a traced coverage and there is no reason for a second copy of it;
what is here is what differs — the winding, the gouvernements, and the report.
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_indochina as ic                                  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "dei")
SRC = os.path.join(DATA, "dei-admin-1930.geojson")
OUT_ADMIN = os.path.join(DATA, "dei-1930-admin.geojson")
OUT_WHOLE = os.path.join(DATA, "dei-1930-dissolved.geojson")
# The later sheet. Named 1941 by the author because that is the date of the
# boundaries -- the administration as it stood on the eve of the occupation --
# while the map's own later date is December 1942.
SRC_1942 = os.path.join(DATA, "dei-1941-admin.geojson")
OUT_ADMIN_1942 = os.path.join(DATA, "dei-1942-admin.geojson")
OUT_WHOLE_1942 = os.path.join(DATA, "dei-1942-dissolved.geojson")
TEXTS = os.path.join(ROOT, "texts", "territories", "sub-units", "dei.csv")

ABSTRACT = ("Natural Earth coastlines with the residency boundaries of Robert "
            "Cribb, Historical Atlas of Indonesia (2000), pp. 125-6 (Java), "
            "127 (Sumatra), 129 (Borneo), 131 (eastern)")

# **WHICH GROUPINGS ARE WORTH DRAWING, AND WHICH ARE NOT.**
#
# The source carries a `gouvernement` on 50 of the 65 units and leaves it empty
# on the other 15, which is the administration and not an omission: Java was
# three gouvernements of residencies with the two princely lands beside them,
# Borneo was two afdeelingen, and everything else on this list was a residency
# answering to Batavia with nothing between. So the shading has something to
# say over Java and Borneo and nothing to say over Sumatra, Celebes or the
# east, and the fifteen without one are not given a parent rather than being
# given a made-up one.
#
# Jogjakarta and Soerakarta name their own gouvernement in the source. They are
# kept — a group of one shades as itself and costs nothing, and the two
# princely lands *were* separate from Midden-Java, which is exactly what a
# reader looking at central Java wants to be shown.
GOUVERNEMENTS = (
    "West-Java", "Midden-Java", "Oost-Java", "Soerakarta", "Jogjakarta",
    "Westerafdeeling van Borneo", "Zuider- en Oosterafdeeling van Borneo",
    "Gouvernement der Molukken",
    # 1941 only: Borneo's two afdeelingen are one gouvernement by then, and
    # its eleven units carry that instead.
    "Gouvernement Borneo",
)

# **THE JAPANESE COMMAND, WHICH IS THE 1942 SHEET'S OTHER GROUPING.**
#
# Written down rather than taken from the file, for the same reason
# GOUVERNEMENTS is: a value nobody has declared gets no shade and no sentence,
# and would pass unnoticed. All 47 units carry one of these three.
MILITARY = ("Java 17th Army", "Japanese Navy", "Japanese 25th Army")

# **THE NAME THE READER SEES, FIXED ONCE HERE.**
#
# The source says `25th Army`, and the card's sentence — *this area was under
# the control of the 25th Army during the occupation* — does not say whose
# army. The other two carry it already: the Navy is named as Japanese and the
# 17th is named for Java. Renamed at the point the file is read, so that the
# attribute on the shape, the selector in styles.css, the shade, the sentence
# and the test are all one string; a display name applied later would be a
# second spelling to keep in step with the first.
MILITARY_RENAME = {"25th Army": "Japanese 25th Army"}

# **A UNIT THE SOURCE NAMES AND DOES NOT DRAW.**
#
# `Madioen` arrives with its properties and a null geometry -- 47 features and
# 46 shapes -- which would leave a 6,430 km2 hole in the middle of east Java
# and nothing for its neighbours' shared edges to cancel against. Its own note
# says what it is: *Formed from merger of Madioen and Ponorogo*, and both of
# those are units of the 1930 coverage. So it is rebuilt as the exact union of
# the two, by the same edge cancellation that makes every outline here: 27 and
# 62 vertices in, 78 out, 11 of shared border cancelling, one polygon, 3,451 +
# 2,980 = 6,430 km2.
#
# This is a reconstruction and not a tracing, and it is only sound because the
# source itself says the unit is precisely that sum. Anything else missing a
# geometry is an error and the tool refuses.
REBUILD_FROM_1930 = {"Madioen": ("Madioen", "Ponorogo")}


def norm_rings(geom):
    """Every ring of one feature, wound RFC 7946 per polygon.

    Outer ring anticlockwise, holes clockwise — decided by position within the
    polygon, which is what GeoJSON says it means, and not by area alone: a
    hole is a hole because of where it sits in the list.
    """
    polys = (geom["coordinates"] if geom["type"] == "MultiPolygon"
             else [geom["coordinates"]])
    out = []
    for poly in polys:
        for i, ring in enumerate(poly):
            area = ic.signed_area(ring)
            want_ccw = (i == 0)
            out.append(ring if (area > 0) == want_ccw else ring[::-1])
    return out


def unit_polys(geom):
    """One feature's polygons, kept nested, with the winding normalised."""
    polys = (geom["coordinates"] if geom["type"] == "MultiPolygon"
             else [geom["coordinates"]])
    out = []
    for poly in polys:
        fixed = []
        for i, ring in enumerate(poly):
            area = ic.signed_area(ring)
            want_ccw = (i == 0)
            fixed.append(ring if (area > 0) == want_ccw else ring[::-1])
        out.append(fixed)
    return out


def read_units(path, label, rebuild_from=None):
    """The units of one sheet, wound consistently and checked.

    `rebuild_from` is the 1930 units, keyed by name, and is what REBUILD_FROM_1930
    is resolved against. A unit with no geometry and no entry there is an
    error: the tool says which and stops, rather than writing a coverage with
    a hole in it.
    """
    if not os.path.exists(path):
        raise SystemExit("%s is missing" % path)
    feats = json.load(open(path, encoding="utf-8"))["features"]
    print("read %-28s %d units" % (os.path.basename(path), len(feats)))
    units, seen, rebuilt = [], set(), []
    for feat in feats:
        pr = feat["properties"]
        name = (pr.get("name") or "").strip()
        if not name:
            raise SystemExit("%s: fid %s has no name" % (label, pr.get("fid")))
        if name in seen:
            raise SystemExit("%s: two units are called %r; the map keys "
                             "sub-units by name and cannot hold both"
                             % (label, name))
        seen.add(name)
        gouv = (pr.get("gouvernement") or "").strip()
        if gouv and gouv not in GOUVERNEMENTS:
            raise SystemExit("%s: %s is in gouvernement %r, which "
                             "GOUVERNEMENTS does not know -- add it there "
                             "with a shade in styles.css, or the reader gets "
                             "a grouping nothing draws" % (label, name, gouv))
        mil = (pr.get("japanese-military") or "").strip()
        mil = MILITARY_RENAME.get(mil, mil)
        if mil and mil not in MILITARY:
            raise SystemExit("%s: %s is under %r, which MILITARY does not "
                             "know -- add it there with a shade, or the "
                             "reader gets a command nothing draws"
                             % (label, name, mil))
        geom = feat.get("geometry") or {}
        if geom.get("coordinates"):
            polys = unit_polys(geom)
        else:
            pair = (rebuild_from or {}) and REBUILD_FROM_1930.get(name)
            if not pair or not rebuild_from:
                raise SystemExit(
                    "%s: %s has no geometry. If the source means it to be the "
                    "union of earlier units, name them in REBUILD_FROM_1930; "
                    "otherwise the shape is missing from the export and this "
                    "coverage would be drawn with a hole in it."
                    % (label, name))
            missing = [n for n in pair if n not in rebuild_from]
            if missing:
                raise SystemExit("%s: %s is to be rebuilt from %s and %s is "
                                 "not in the 1930 coverage"
                                 % (label, name, " + ".join(pair),
                                    ", ".join(missing)))
            rings = [r for n in pair for p in rebuild_from[n]["polys"] for r in p]
            polys = ic.to_polygons(ic.dissolve(rings, "%s: %s" % (label, name)),
                                   "%s: %s" % (label, name))
            rebuilt.append("%s from %s" % (name, " + ".join(pair)))
        area = sum(ic.km2(p[0]) - sum(ic.km2(h) for h in p[1:]) for p in polys)
        units.append({
            "name": name,
            "alt": (pr.get("alt_name") or "").strip(),
            "gouv": gouv,
            "mil": mil,
            "link": (pr.get("link") or "").strip(),
            "note": (pr.get("notes") or "").strip(),
            "km2": round(area, 1),
            "polys": polys,
        })
    if rebuilt:
        print("  rebuilt from the 1930 coverage: %s" % "; ".join(rebuilt))
    return units


def write_sheet(units, out_admin, out_whole, label):
    """The units as the map reads them, and the colony dissolved from them."""
    verts_in = sum(len(r) for u in units for p in u["polys"] for r in p)
    area_units = sum(u["km2"] for u in units)
    ic.write(out_admin, [
        ic.feature(u["polys"], {
            "name": u["name"], "alt_name": u["alt"],
            "gouvernement": u["gouv"], "japanese_military": u["mil"],
            "link": u["link"], "note": u["note"], "km2": u["km2"],
        }) for u in units
    ], "the %d units of the Netherlands Indies, %s. %s"
       % (len(units), label, ABSTRACT))

    rings = [r for u in units for p in u["polys"] for r in p]
    polys = ic.to_polygons(ic.dissolve(rings, "the Netherlands Indies, " + label),
                           "the Netherlands Indies, " + label)
    area_whole = sum(ic.km2(p[0]) - sum(ic.km2(h) for h in p[1:]) for p in polys)
    ic.write(out_whole, [ic.feature(polys, {
        "name": "Netherlands East Indies", "km2": round(area_whole, 1),
    })], "the Netherlands Indies dissolved from its %d units, %s. %s"
         % (len(units), label, ABSTRACT))
    verts_out = sum(len(r) for p in polys for r in p)
    print("units      %d, %d vertices, %s km2"
          % (len(units), verts_in, f"{area_units:,.0f}"))
    print("dissolved  %d islands, %d vertices (%d of interior edge cancelled),"
          " %s km2" % (len(polys), verts_out, verts_in - verts_out,
                       f"{area_whole:,.0f}"))
    # The two areas are the same ground counted two ways, and a dissolve that
    # is exact cannot move it. A gap here would mean the cancellation had eaten
    # a boundary that was not shared.
    if abs(area_units - area_whole) > 1.5:
        raise SystemExit("%s: the units come to %.1f km2 and their outline to "
                         "%.1f -- the dissolve has moved the ground"
                         % (label, area_units, area_whole))


def report_groups(units, what):
    by = collections.Counter(u[what] or "(none)" for u in units)
    for g in (GOUVERNEMENTS if what == "gouv" else MILITARY):
        if by.get(g):
            print("  %-38s %2d units" % (g, by[g]))
    if by.get("(none)"):
        print("  %-38s %2d units" % ("(none)", by["(none)"]))


def main():
    units = read_units(SRC, "1930")
    write_sheet(units, OUT_ADMIN, OUT_WHOLE, "1930")
    print("gouvernements")
    report_groups(units, "gouv")
    print("names      %d with an alternative, %d with a Wikipedia article, "
          "%d with a note"
          % (sum(1 for u in units if u["alt"]),
             sum(1 for u in units if u["link"]),
             sum(1 for u in units if u["note"])))

    by_name = {u["name"]: u for u in units}
    later = read_units(SRC_1942, "1942", rebuild_from=by_name)
    write_sheet(later, OUT_ADMIN_1942, OUT_WHOLE_1942, "1942")
    print("gouvernements")
    report_groups(later, "gouv")
    print("Japanese command")
    report_groups(later, "mil")
    # Java's residencies were merged wholesale between the two sheets, and the
    # source says how in its own notes -- which is the most useful thing this
    # layer knows and is worth counting rather than leaving to be noticed.
    gone = sorted(set(by_name) - {u["name"] for u in later})
    new = sorted({u["name"] for u in later} - set(by_name))
    print("between the sheets  %d units become %d: %d names gone, %d new"
          % (len(units), len(later), len(gone), len(new)))
    print("  gone: %s" % ", ".join(gone))
    print("  new:  %s" % ", ".join(new))

    print("texts      %s" % fill_texts(units + later))


def fill_texts(units):
    """A row per unit in texts/, addressed by key and writing only blanks.

    The columns are the sub-unit table's own — `key`, `en`, `short`, `alt`,
    `wiki` — the same five French Indochina uses with `fr` where this has
    `alt`. `en` is the **Dutch** name, because that is what the administration
    called the place and what a reader will meet in a period source;
    `alt` is whatever else it answers to, which for most of these is the
    modern Indonesian spelling. `short` is left for a person: what a residency
    was is not derivable from its outline.

    Nothing written is ever overwritten and rows are found by key, never by
    position. The eight gouvernements get rows of their own, because the card
    looks their names up here to gloss the line above the country — without
    one the reader gets the raw `Zuider- en Oosterafdeeling van Borneo` and
    no explanation of what that was.
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
        put(u["name"], en=u["name"], alt=u["alt"], wiki=u["link"],
            short=u["note"])
    for g in GOUVERNEMENTS:
        if any(u["gouv"] == g for u in units):
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
