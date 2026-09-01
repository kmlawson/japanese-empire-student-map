#!/usr/bin/env python3
"""Fold texts/ into the site.

    python3 tools/build_texts.py

Everything a reader sees in words lives in texts/ — the names in each script,
the dates, the notes, the legend labels, the About and Sources pages. This
script writes them into the places the browser actually reads:

    texts/*.csv, texts/**/*.md   ->  the generated half of data.js
    texts/pages/about.md         ->  the About dialog in index.html
    texts/pages/help.md          ->  the ? dialog in index.html
    texts/pages/sources.md       ->  sources.html, and docs/SOURCES.md

data.js keeps a hand-written head — the home view, which date the map opens on,
and the Yellow River's 1938 flood course, none of which are words — and
everything after the banner is replaced wholesale. index.html and sources.html
are spliced between markers, so the rest of those files is left alone.

Run it after editing anything in texts/, and before tools/bundle.py.
tools/build_map.py does not need to run again: no geometry is involved.

It refuses rather than guesses. A territory with no note, a sub-unit named in
two group files, a duplicate id, an override for a city that does not exist —
each stops the build and says which file and which row. That is deliberate:
every one of those was a real bug that hid in data.js for months, and the
generator is the place they can be caught for good.
"""

import csv
import hashlib
import json
import math
import os
import time
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from html import escape as html_escape
import md as markdown
import texts_lib as T

ROOT = T.ROOT
TEXTS = T.TEXTS

BANNER = """/* ==================================================================
 * Generated from texts/ by tools/build_texts.py — do not edit below.
 *
 * Every name, date and note below comes from a CSV or a Markdown file in
 * texts/, which is where they are edited and where the explanations of why
 * each record reads the way it does now live. Anything changed here is lost
 * the next time that script runs.
 * ================================================================== */"""


def load(*parts):
    return T.read_csv(os.path.join(TEXTS, *parts))


def notes(*parts):
    return T.read_notes(os.path.join(TEXTS, *parts))


class Problem(Exception):
    pass


def check_unique(rows, field, where):
    seen = {}
    for i, r in enumerate(rows):
        k = r.get(field)
        if k in seen:
            raise Problem("%s: %r is in rows %d and %d. Two records under one "
                          "key means the second quietly replaces the first."
                          % (where, k, seen[k] + 2, i + 2))
        seen[k] = i


# Where one column does not name a row on its own. Each of these is unique on
# the columns named together. Checked across all 45 tables; these five are the
# whole of the exception.
COMPOUND_KEYS = {
    "categories.csv": ("epoch", "id"),
    "extent-1942.csv": ("en", "ja"),
    "version.csv": ("version",),
    "territories/sub-units/clusters.csv": ("epoch", "cluster"),
    "sites/overrides-1930.csv": ("site", "en"),
}


def check_every_table_has_unique_keys():
    """Every row in texts/ must be nameable, and no two may share a name.

    This is what lets a tool address a row by what it is rather than by which
    line it sits on. A row number is only true of one version of a file: rewrite
    the file and row 47 is somewhere else, and an edit aimed at it lands on a
    stranger. A key survives the file being rebuilt, but only while it is
    unique — so the guarantee is asserted here rather than assumed by every
    tool that relies on it.
    """
    bad = []
    for base, dirs, names in os.walk(TEXTS):
        dirs[:] = [d for d in dirs if d != "admin"]
        for n in sorted(names):
            if not n.endswith(".csv"):
                continue
            path = os.path.join(base, n)
            rel = os.path.relpath(path, TEXTS).replace(os.sep, "/")
            with open(path, encoding="utf-8", newline="") as fh:
                r = csv.DictReader(fh)
                cols = r.fieldnames or []
                rows = list(r)
            kcols = COMPOUND_KEYS.get(rel)
            if not (kcols and all(c in cols for c in kcols)):
                kcols = next(((c,) for c in ("id", "key") if c in cols), None)
            if not kcols:
                bad.append("%s has no column that names a row; give it an `id`, "
                           "or add it to COMPOUND_KEYS" % rel)
                continue
            seen = {}
            for i, row in enumerate(rows):
                k = tuple((row.get(c) or "").strip() for c in kcols)
                if k in seen:
                    bad.append("%s: %s is in rows %d and %d — two records under "
                               "one name, and the second quietly replaces the "
                               "first" % (rel, " / ".join(k) or "(blank)",
                                          seen[k] + 2, i + 2))
                seen[k] = i
    if bad:
        raise Problem("keys are not unique:\n  " + "\n  ".join(bad))


# ------------------------------------------------------------ collections

# ------------------------------------------------------------- population
# The figures on the cards — a population, a sex ratio, a share, a density —
# are data, not prose, and they live in data/population/, one file to a
# dataset, with index.csv saying what each one is and which map it belongs to.
# They are composed into `short` here rather than written into texts/, so that
# the sentence about a place and the numbers counted there can be edited
# without either overwriting the other, and so that adding next year's table is
# adding a file.
#
# Nothing is invented. A blank field is left off the line: the country carries a
# population and a sex ratio and no share, because a country is not a share of
# itself. `area_km2` never appears — it is there to divide by.

POP = os.path.join(ROOT, "data", "population")


# The ladder a class break is allowed to land on. A choropleth's breaks are
# log-spaced — density is a ratio and reads as one, and equal steps on a linear
# scale put nine of thirteen provinces in the bottom class — but a reader
# cannot hold 72.0, 96.9, 128.7 in their head, and a pure power of ten is too
# coarse a ladder to have more than two rungs inside one map's range. So each
# break is snapped to the nearest rung *in log space*, which is the space it
# was computed in: 73 → 75, 97 → 100, 129 and 171 → 150 and, because two
# breaks cannot be one break, the second is pushed up to 200.
#
# The result for Korea in 1942 is under 75, 75–100, 100–150, 150–200, 200 and
# over. One of those classes is empty, and that is the map speaking rather than
# a fault in the ladder: nothing in Korea sat between 69 and 111 per km², the
# mountains and the paddy being what they are.
LADDER = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5]


def nice_above(v):
    """The next rung strictly above v."""
    e = math.floor(math.log10(v)) - 1
    while True:
        for m in LADDER:
            r = m * 10 ** e
            if r > v * 1.000001:
                return r
        e += 1


def snap(v):
    """The rung nearest v, measured the way the break was computed: in logs."""
    e = math.floor(math.log10(v))
    best = None
    for de in (-1, 0, 1):
        for m in LADDER:
            r = m * 10 ** (e + de)
            d = abs(math.log(r / v))
            if best is None or d < best[0]:
                best = (d, r)
    return best[1]


def density_breaks(values, classes=5):
    """The class boundaries for a choropleth: log-spaced, snapped to LADDER.

    Returns the `classes - 1` interior breaks, ascending. A value below the
    first belongs to the lightest class, one at or above the last to the
    darkest — so the ends are open and no reading falls outside the ramp.
    """
    vals = sorted(v for v in values if v > 0)
    if len(vals) < 2:
        return []
    lo, hi = vals[0], vals[-1]
    out = []
    for i in range(1, classes):
        raw = lo * (hi / lo) ** (i / float(classes))
        b = snap(raw)
        while out and b <= out[-1]:
            b = nice_above(out[-1])
        out.append(int(b) if float(b).is_integer() else b)
    return out


def population_fields():
    """The columns beyond the core four, in the order they should be shown.

    A dataset file may carry as many as the source has — ages, register and
    nationality, occupation — and `fields.csv` says what each column is called
    and which group it belongs in. Nothing here reaches the short description:
    that is a sentence, and a sentence has room for a population and a density
    and not for twenty-one columns of a census.
    """
    path = os.path.join(POP, "fields.csv")
    if not os.path.exists(path):
        return []
    # `role` marks a column that is a *total* of the ones under it rather than
    # one of them — 滿洲人 over its Manchu, Han, Mongolian and Hui — so a card
    # can set it apart from its own parts instead of listing eight things at
    # one weight and leaving the reader to work out which contains which.
    return [{"c": r["column"], "label": r["label"], "group": r["group"],
             "role": (r.get("role") or "").strip()}
            for r in T.read_csv(path)]


def gazetteer_ids(epoch):
    """The city ids the map draws on that date, for checking a city row."""
    path = os.path.join(ROOT, "data", "cities-%s.csv" % epoch)
    if not os.path.exists(path):
        return set()
    return set(r["id"] for r in T.read_csv(path))


def population_data():
    """The datasets in data/population/, read and composed once.

    Each is {meta…, rows: {key: {…, line}}}, where `line` is the sentence the
    tooltip and the short description carry and the rest is what the card and
    the choropleth read. A row may say `same_as`: the place is counted inside
    another one and has no figures of its own, so it carries that row's and
    says so — Cheju inside Zenranan-dō, which the 1942 returns do not break out.
    """
    index = os.path.join(POP, "index.csv")
    if not os.path.exists(index):
        return []
    fields = population_fields()
    sets = []
    for d in T.read_csv(index):
        where = "data/population/" + d["file"]
        rows = T.read_csv(os.path.join(POP, d["file"]))
        check_unique(rows, "key", where)
        cities = gazetteer_ids(d["epoch"])
        for r in rows:
            # `unmapped` names a place the source counts and this map does not
            # draw — Manchukuo's five post-1935 provinces. It has no key to
            # check, appears in the table and the chart so the parts still sum
            # to the whole, and never on a card, there being nothing to point
            # at. Its `note` should say so.
            if r["scope"] == "city" and cities and r["key"] not in cities:
                raise Problem("%s has a row for the city %r, and no city of that "
                              "id is on the %s map. The key is the `id` in "
                              "data/cities-%s.csv."
                              % (where, r["key"], d["epoch"], d["epoch"]))
        # which of the extra columns this file actually carries a figure in
        used = [f for f in fields
                if any((r.get(f["c"]) or "").strip() for r in rows)]
        # And how many decimal places each of them was written with. A share
        # needs it: 35.0 in a column of 39.3 and 30.7 must not print as "35",
        # and `toLocaleString` drops a trailing zero unless it is told not to.
        # Taken from the column rather than from the value, so the whole column
        # is written to one precision — which is what makes it a column.
        used = [dict(f, dp=max([0] + [len((r.get(f["c"]) or "").strip()
                                          .split(".", 1)[1])
                                      for r in rows
                                      if "." in (r.get(f["c"]) or "")]))
                for f in used]
        # the whole that a share is a share of. A table of cities is a list of
        # places rather than the parts of something, so it has none and prints
        # no share column.
        whole = (d.get("pct_of") or "").strip()
        by_key = dict((r["key"], r) for r in rows)
        out = {}
        for r in rows:
            src = r
            if r.get("same_as"):
                if r["same_as"] not in by_key:
                    raise Problem("%s: %s is said to be counted in %s, and "
                                  "there is no such row"
                                  % (where, r["key"], r["same_as"]))
                src = by_key[r["same_as"]]
                if src.get("same_as"):
                    raise Problem("%s: %s points at %s, which points at "
                                  "somebody else in turn. One hop only."
                                  % (where, r["key"], r["same_as"]))
            rec = {"scope": r["scope"], "en": r.get("en", "")}
            bits = []
            if src.get("population"):
                rec["pop"] = int(src["population"])
                # what kind of number this is, in the dataset's own words: 1930
                # is a census and 1942 an estimate, and a sentence that called
                # the census an estimate would be wrong on the face of it
                # The year the *figures* are of, not the map they are drawn
                # on. Taiwan's later return is the register at the end of 1941
                # and Manchukuo's count is of 1943, and both are on the
                # December 1942 sheet — so the sentence a reader hovers said
                # "1942 Resident Population" over figures that were not of
                # 1942. Korea's and Japan's `when` is their epoch, so nothing
                # already on the map moves.
                bits.append("%s %s: %s"
                            % ((d.get("when") or "").strip() or d["epoch"],
                               d.get("line_label") or "Estimated Population",
                               "{:,}".format(rec["pop"])))
            if src.get("m_per_100_f"):
                rec["mf"] = src["m_per_100_f"]
                bits.append("Males per 100 Females: %s" % rec["mf"])
            if src.get("pct_of_total") and whole:
                rec["pct"] = src["pct_of_total"]
                bits.append("%% of Total %s: %s" % (whole, rec["pct"]))
            if src.get("population") and src.get("area_km2"):
                rec["km2"] = int(round(float(src["area_km2"])))
                raw = rec["pop"] / float(src["area_km2"])
                # A whole number is right for a province of Korea and wrong for
                # one of Manchuria: Kōan-hoku is 0.8 to the square kilometre and
                # Kokka 1.3, and rounded to integers both print 1 and the map
                # says two very different places are the same. Ten is where the
                # first decimal stops carrying anything — nothing already on the
                # map is under it, so no figure a reader has seen moves.
                rec["dens"] = int(round(raw)) if raw >= 10 else round(raw, 1)
                bits.append("Per km²: %s" % rec["dens"])
            line = " · ".join(bits)
            if r.get("note"):
                rec["note"] = r["note"]
                line = (line + " " + r["note"]).strip()
            if r.get("same_as"):
                rec["sameAs"] = r["same_as"]
            # The figure to set against another date where this row's own is
            # over different ground. Taiwan's two eastern 廳 are the case: the
            # 1930 row is the coastal shelf the map draws and the 1941 one is
            # the whole prefecture, so a change worked out from the two as
            # printed is mostly a change of definition. `compare_why` says
            # which figure was used and why, as a footnote under the table.
            if r.get("compare_pop"):
                rec["cmpPop"] = int(r["compare_pop"])
                # and the sex ratio of *that* population, which is a property
                # of the people counted and not of the row
                if r.get("compare_m_per_100_f"):
                    rec["cmpMf"] = r["compare_m_per_100_f"]
                if r.get("compare_why"):
                    rec["cmpWhy"] = r["compare_why"]
            # the unit this one sits inside, where the source counts both: a
            # 郡 is read against its 州, and the card says so in a line
            # a row that is counted *inside* the others rather than beside
            # them: the 高砂族 of the demarcated territory are also in the
            # district their ground lies in, so nothing may sum it with them
            if (r.get("apart") or "").strip().lower() in ("yes", "true", "1"):
                rec["apart"] = True
            if r.get("parent"):
                rec["parent"] = r["parent"]
                if r.get("parent_pop"):
                    rec["parentPop"] = int(r["parent_pop"])
            # and everything else the source counted, kept as it was read: the
            # card and the tables lay it out, and neither invents a total
            extra = {}
            for f in used:
                v = (src.get(f["c"]) or "").strip()
                if v:
                    extra[f["c"]] = float(v) if "." in v else int(v)
            if extra:
                rec["x"] = extra
            if not line and not extra:
                continue
            if line:
                rec["line"] = line
            out[r["key"]] = rec
        # The choropleth is over the sub-units, so the country's own density —
        # which is not shown anywhere — has no business setting the range.
        # `unmapped` is out of it too: it is a real place with real figures and
        # no shape on this map, so there is nothing to shade.
        dens = [v["dens"] for k, v in out.items()
                if v.get("dens") and v["scope"] == "sub-unit"
                and not v.get("sameAs") and not v.get("apart")]
        # and the share of the population on the Japanese register, which is a
        # different quantity and gets a ladder of its own
        jp = []
        for k, v in out.items():
            if v["scope"] != "sub-unit" or v.get("sameAs") or v.get("apart"):
                continue
            n = (v.get("x") or {}).get("reg_jp")
            if n and v.get("pop"):
                jp.append(100.0 * n / v["pop"])
        # `group` is the *layer*, and a dataset is one date of it: the panel
        # offers "Korea Population Density" once and the map draws whichever
        # file belongs to the date the reader is on. Without it every year of
        # every country would be its own switch, and the reader would have to
        # know which of them matched the map in front of them.
        # The caption is the half of the heading that is about the table
        # rather than about the place — "estimated population at 1 October
        # 1942" — because the card puts the place's own name in front of it: a
        # province's figures are headed with the province, not with Korea. The
        # whole-colony card keeps `label`, which is that caption under the name
        # of the whole.
        caption = d.get("caption") or d.get("label") or ""
        label = d.get("label") or (("%s, %s" % (whole, caption)) if whole
                                   else caption[:1].upper() + caption[1:])
        sets.append({"id": d["file"][:-4], "epoch": d["epoch"],
                     "group": d.get("group") or d["file"][:-4],
                     # the sub-heading the Layers panel gives this group: the
                     # place, because the radios under it are the maps
                     "country": d.get("country") or "",
                     "caption": caption,
                     "note": d.get("note") or "",
                     "inShort": (d.get("in_short") or "").strip().lower()
                                not in ("no", "false", "0"),
                     # groups the box does not print. The figures stay on the
                     # card and in the data; what this says is that a table of
                     # them is not worth the room — the fourteen cities by age
                     # was half a screen of columns nobody had asked a question
                     # of.
                     "tableSkip": [g.strip() for g in
                                   (d.get("table_skip") or "").split(",")
                                   if g.strip()],
                     "fields": used,
                     # The year the *figures* are of, which is not always the
                     # map they appear on: Taiwan's later return is the
                     # register at the end of 1941 and is drawn on the December
                     # 1942 map. The comparison table sets two dates side by
                     # side and must name them for what they are.
                     "when": (d.get("when") or "").strip() or d["epoch"],
                     # popped below, once the group's ladder is settled
                     "breaks_want": d.get("breaks") or "",
                     # what kind of number it is, in the dataset's own words
                     "lineLabel": d.get("line_label") or "",
                     # a caution shown under the comparison, where the two
                     # dates do not count the same thing the same way
                     "compareNote": d.get("compare_note") or "",
                     "label": label, "pctOf": whole,
                     "source": d["source"],
                     "layer": d.get("layer") or label,
                     "dens": dens,
                     "jp": jp,
                     "rows": out})

    # The classes are the layer's, not each date's. A choropleth that switches
    # by date exists to be compared across the dates, and breaks fitted to each
    # one separately would give the same colour two meanings: Korea's densities
    # run from 37 in 1930 to 224 in 1942, and split per date the pale end of
    # 1942 would be the deep end of 1930. So every file sharing a `group` is
    # measured against the pooled range and gets the same ladder.
    pooled, pooled_jp = {}, {}
    for d in sets:
        pooled.setdefault(d["group"], []).extend(d.pop("dens"))
        pooled_jp.setdefault(d["group"], []).extend(d.pop("jp"))
    # A source that drew its own choropleth gets its own ladder rather than a
    # fitted one: the point of shading Manchukuo is to reproduce the plate at
    # the front of the report, whose classes are 5, 20, 40 and 100. `breaks` in
    # index.csv is those numbers, comma-separated; without it the ladder is
    # computed as before.
    fixed = {}
    for d in sets:
        want = (d.get("breaks_want") or "").strip()
        if want:
            fixed[d["group"]] = [float(x) if "." in x else int(x)
                                 for x in want.split(",") if x.strip()]
    breaks = dict((g, fixed.get(g) or density_breaks(v))
                  for g, v in pooled.items())
    # the Japanese share runs from a fraction of a per cent to a quarter of a
    # city, so it wants the same log ladder and its own rungs
    jpb = dict((g, density_breaks(v)) for g, v in pooled_jp.items())
    for d in sets:
        d.pop("breaks_want", None)
        d["breaks"] = breaks.get(d["group"], [])
        d["jpBreaks"] = jpb.get(d["group"], [])
    return sets


def population_lines():
    """{(epoch, scope, key): line} — one composed line per row of data."""
    out = {}
    for d in population_data():
        # a dataset can say its figures belong on the card and not in the
        # sentence. Taiwan's districts are the case: sixty-four of them, and
        # the hover already carries what the district was
        if not d.get("inShort", True):
            continue
        for key, rec in d["rows"].items():
            # only what the map itself carries a description for: a city's
            # figures live on its card, not in a sentence about a province
            if rec["scope"] not in ("territory", "sub-unit") or not rec.get("line"):
                continue
            k = (d["epoch"], rec["scope"], key)
            if k in out:
                raise Problem("data/population/: %s is given twice for %s on "
                              "%s" % (key, rec["scope"], d["epoch"]))
            out[k] = rec["line"]
    return out


def with_population(row, line, base=""):
    """The short the card shows: the sentence about the place, then the count."""
    text = (row.get("short") or base or "").strip()
    if not text:
        return line
    if text[-1] not in ".!?…":
        text += "."
    return text + " " + line


def array(rows, ns, snippets, key="id", indent=4, note_field="note"):
    """Rows as the body of a JS array literal, one record to a line-group."""
    out = []
    for r in rows:
        note = T.note_for(ns, r.get(key), snippets)
        out.append(" " * indent
                   + T.record_to_js(r, note, indent, note_field) + ",")
    return "\n".join(out)


def keyed(rows, ns, snippets, key="key", indent=2):
    """Rows as a name-keyed JS object, for the sub-units and the overrides."""
    out = []
    for r in rows:
        name = r[key]
        note = T.note_for(ns, name, snippets)
        out.append("%s%s: %s," % (" " * indent, T.js_key(name),
                                  T.record_to_js(r, note, indent)))
    return "\n".join(out)


# The drawn frame, from tools/build_map.py. A record outside it is placed off
# the edge of the map and simply never seen — which is how the Bering Sea label
# sat two degrees above the top of the sheet without anyone noticing.
FRAME = (66.0, 206.0, -13.0, 55.0)


def check_frame(rows, where):
    for r in rows:
        try:
            lat = float(r.get("lat", "") or "nan")
            lon = float(r.get("lon", "") or "nan")
        except ValueError:
            continue
        if lat != lat or lon != lon:
            continue
        if lon < FRAME[0]:
            lon += 360.0
        if not (FRAME[0] <= lon <= FRAME[1]) or not (FRAME[2] <= lat <= FRAME[3]):
            sys.stderr.write("  note: %s: %s is outside the drawn frame at %s, %s\n"
                             % (where, r.get("id") or r.get("key") or "?", lat, lon))


# The four weights a point can be drawn at, smallest first, so that the index
# is also the tier the zoom rule compares against. They are the gazetteer's own
# four, deliberately: a curated point and a gazetteer point that are the same
# size should be the same size, and one ladder is the only way to promise that.
SIZES = ("small", "medium", "large", "largest")


def check_vocabulary(rows, subtypes, where):
    """A size must be on the ladder and a subtype in its type's vocabulary.

    Both columns mean nothing to the drawing code when they are misspelled —
    the marker keeps its default and no error is raised — so the spelling is
    checked here, where a build can refuse, rather than being discovered by
    somebody wondering why a change did nothing.
    """
    for r in rows:
        size = (r.get("size") or "").strip()
        if size and size not in SIZES:
            raise Problem("%s: %s has size %r; it must be one of %s"
                          % (where, r["id"], size, ", ".join(SIZES)))
        sub = (r.get("subtype") or "").strip()
        if not sub:
            continue
        allowed = subtypes.get(r.get("cat") or "")
        if not allowed:
            raise Problem("%s: %s is a %s, which has no subtypes; it cannot "
                          "have subtype %r"
                          % (where, r["id"], r.get("cat"), sub))
        if sub not in allowed:
            raise Problem("%s: %s has subtype %r; a %s may be one of %s"
                          % (where, r["id"], sub, r.get("cat"),
                             ", ".join(allowed)))


def build_data_js():
    snippets = T.read_snippets()
    parts = []
    pop = population_lines()
    pop_used = set()

    # ------------------------------------------------------------- epochs
    rows = load("epochs.csv")
    check_unique(rows, "id", "texts/epochs.csv")
    ns = notes("epochs.md")
    for r in rows:
        if not T.note_for(ns, r["id"], snippets):
            raise Problem("texts/epochs.md has no '## %s'" % r["id"])
    parts.append("JMAP.EPOCHS = [\n%s\n];"
                 % array(rows, ns, snippets, indent=2, note_field="blurb"))

    # --------------------------------------------------------- categories
    rows = load("categories.csv")
    by_epoch = {}
    for r in rows:
        by_epoch.setdefault(r["epoch"], []).append(r)
    inner = []
    for ep, group in by_epoch.items():
        check_unique(group, "id", "texts/categories.csv (%s)" % ep)
        inner.append("  %s: [\n%s\n  ]," % (T.js_key(ep),
                                            array(group, {}, snippets)))
    parts.append("JMAP.CATEGORIES = {\n%s\n};" % "\n".join(inner))

    rows = load("site-categories.csv")
    check_unique(rows, "id", "texts/site-categories.csv")
    parts.append("JMAP.SITE_CATEGORIES = [\n%s\n];"
                 % array(rows, {}, snippets, indent=2))
    subtypes = {r["id"]: [w for w in (r.get("subtypes") or "").split(";") if w]
                for r in rows}

    # -------------------------------------------------------- territories
    inner = []
    for year in ("1930", "1942"):
        rows = load("territories", "%s.csv" % year)
        check_unique(rows, "id", "texts/territories/%s.csv" % year)
        ns = notes("territories", "%s.md" % year)
        bare = [r["id"] for r in rows
                if not T.note_for(ns, r["id"], snippets)]
        if bare:
            raise Problem("texts/territories/%s.md has no note for: %s"
                          % (year, ", ".join(bare)))
        for r in rows:
            line = pop.get((year, "territory", r["id"]))
            if line:
                r["short"] = with_population(r, line)
                pop_used.add((year, "territory", r["id"]))
        inner.append("  e%s: [\n%s\n  ]," % (year, array(rows, ns, snippets)))
    parts.append("JMAP.TERRITORIES = {\n%s\n};" % "\n".join(inner))

    # -------------------------------------------------------------- sites
    rows = load("sites", "sites.csv")
    check_unique(rows, "id", "texts/sites/sites.csv")
    check_frame(rows, "texts/sites/sites.csv")
    ns = notes("sites", "sites.md")
    check_vocabulary(rows, subtypes, "texts/sites/sites.csv")
    parts.append("JMAP.SITES = [\n%s\n];" % array(rows, ns, snippets, indent=2))
    known = set(r["id"] for r in rows)

    per_site = {}
    for name in sorted(os.listdir(os.path.join(TEXTS, "sites"))):
        m = re.fullmatch(r"overrides-(\d{4})\.csv", name)
        if not m:
            continue
        rows = load("sites", name)
        check_unique(rows, "site", "texts/sites/" + name)
        ns = notes("sites", "overrides-%s.md" % m.group(1))
        for r in rows:
            if r["site"] not in known:
                raise Problem("texts/sites/%s has a row for %r, which is not "
                              "in sites.csv" % (name, r["site"]))
            note = T.note_for(ns, r["site"], snippets)
            per_site.setdefault(r["site"], []).append(
                (m.group(1), T.record_to_js(r, note, 4)))
    inner = []
    for site, blocks in per_site.items():
        body = ", ".join("e%s: %s" % (year, js) for year, js in blocks)
        inner.append("  %s: { %s }," % (T.js_key(site), body))
    parts.append("JMAP.EPOCH_OVERRIDES = {\n%s\n};" % "\n".join(inner))

    # ------------------------------------------------------------- extent
    rows = load("extent-1942.csv")
    if len(rows) != 1:
        raise Problem("texts/extent-1942.csv should hold exactly one row")
    parts.append("JMAP.EXTENT_1942 = %s;"
                 % T.record_to_js(rows[0], None, 0))

    # ------------------------------------------------------------- browse
    rows = load("browse.csv")
    check_unique(rows, "id", "texts/browse.csv")
    ns = notes("browse.md")
    parts.append("JMAP.BROWSE = [\n%s\n];" % array(rows, ns, snippets, indent=2))

    # ----------------------------------------------------------- features
    # The physical map: seas, gulfs and straits, deserts, plateaus and ranges.
    # They belong to neither epoch and to no polity, so they are a table of
    # their own rather than territories with no colour — the Gobi did not
    # change hands in 1937. `lvl` is the zoom they earn: 1 for the things that
    # frame the whole map, 3 for the ones only worth naming once the reader is
    # close in on them.
    rows = load("features.csv")
    check_unique(rows, "id", "texts/features.csv")
    for r in rows:
        if r.get("kind") not in ("sea", "land"):
            raise Problem("texts/features.csv: %r has kind %r; it must be "
                          "'sea' or 'land', which is what decides how it is "
                          "lettered" % (r.get("id"), r.get("kind")))
    parts.append("JMAP.FEATURES = [\n%s\n];"
                 % array(rows, {}, snippets, indent=2))

    # ---------------------------------------------------------- sub-units
    sub = os.path.join(TEXTS, "territories", "sub-units")
    groups = sorted(n for n in os.listdir(sub)
                    if n.endswith(".csv") and not n.startswith("overrides-")
                    and n != "clusters.csv")
    rows, ns, seen, base_short = [], {}, {}, {}
    for name in groups:
        group = load("territories", "sub-units", name)
        for r in group:
            k = r["key"]
            if k in seen:
                raise Problem(
                    "the sub-unit %r is in both %s and %s. Both would be the "
                    "one entry in JMAP.PROVINCES and the second would win — "
                    "which is how the Okinawa collision stayed hidden. Give "
                    "one of them a key of its own in tools/build_map.py, or "
                    "fold the two rows into one." % (k, seen[k], name))
            seen[k] = name
            base_short[k] = r.get("short", "")
        rows.extend(group)
        ns.update(notes("territories", "sub-units", name[:-4] + ".md"))
    parts.append("JMAP.PROVINCES = {\n%s\n};" % keyed(rows, ns, snippets))
    sub_keys = set(seen)

    inner = []
    for name in sorted(os.listdir(sub)):
        m = re.fullmatch(r"overrides-(\d{4})\.csv", name)
        if not m:
            continue
        rows = load("territories", "sub-units", name)
        check_unique(rows, "key", "texts/territories/sub-units/" + name)
        ns = notes("territories", "sub-units", "overrides-%s.md" % m.group(1))
        year = m.group(1)
        for r in rows:
            if r["key"] not in sub_keys:
                raise Problem("texts/territories/sub-units/%s overrides %r, "
                              "which no group file defines" % (name, r["key"]))
            line = pop.get((year, "sub-unit", r["key"]))
            if line:
                r["short"] = with_population(r, line, base_short[r["key"]])
                pop_used.add((year, "sub-unit", r["key"]))
        # A province with figures and no override of its own still needs an
        # entry, because the override is where an epoch's text lives. It gets
        # one holding nothing but the composed short, so every other field
        # still falls through to the group file.
        for (ep, scope, key), line in sorted(pop.items()):
            if ep != year or scope != "sub-unit" or (ep, scope, key) in pop_used:
                continue
            if key not in sub_keys:
                continue
            rows.append({"key": key,
                         "short": with_population({}, line, base_short[key])})
            pop_used.add((ep, scope, key))
        inner.append("  e%s: {\n%s\n  }," % (m.group(1),
                                             keyed(rows, ns, snippets, indent=4)))
    parts.append(
        "/* One block per epoch, and the generator holds it to that: this "
        "object\n   carried two `e1942` keys for a long time and the later of "
        "them silently\n   discarded the earlier, so eleven overrides never "
        "took effect at all. */\nJMAP.PROVINCE_EPOCH = {\n%s\n};"
        % "\n".join(inner))

    # The same figures again, as a table rather than a sentence: the card
    # prints them a field to a line, and the choropleth needs the densities and
    # the class breaks. Composed once in population_data() so that the line the
    # tooltip carries and the rows the card shows cannot say different things.
    parts.append("JMAP.POPULATION = %s;"
                 % json.dumps(population_data(), ensure_ascii=False,
                              indent=2, sort_keys=False))

    lost = sorted(set(pop) - pop_used)
    if lost:
        raise Problem(
            "data/population/ has figures for %s, and nothing on the map "
            "carries that key on that date. A key here is the `id` in "
            "texts/territories/<epoch>.csv or the `key` in a sub-units group "
            "file; if a province has been renamed, rename it here too rather "
            "than leaving the numbers pointing at nobody."
            % ", ".join("%s %s %s" % (e, sc, k) for e, sc, k in lost))

    rows = load("territories", "sub-units", "clusters.csv")
    by_epoch = {}
    for r in rows:
        by_epoch.setdefault(r["epoch"], []).append(r["cluster"])
    inner = []
    for ep, names in by_epoch.items():
        body = "\n".join("    %s: null," % T.js_string(n) for n in names)
        inner.append("  %s: {\n%s\n  }," % (T.js_key(ep), body))
    parts.append("JMAP.CLUSTER_EPOCH = {\n%s\n};" % "\n".join(inner))

    return BANNER + "\n\n" + "\n\n".join(parts) + "\n"


# ------------------------------------------------------------------ splice

BANNER_RE = re.compile(r"/\* =+\n \* Generated from texts/.*?=+ \*/\n", re.S)


def splice_data_js():
    path = os.path.join(ROOT, "data.js")
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    m = BANNER_RE.search(src)
    if not m:
        raise Problem("data.js has no 'Generated from texts/' banner. The "
                      "hand-written head has to end with one — see the "
                      "docstring at the top of this script.")
    head = src[: m.start()].rstrip("\n")
    # Built in full before the file is opened for writing: opening truncates,
    # and a Problem raised half way through would leave data.js empty.
    body = build_data_js()
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(head + "\n\n" + body)


def splice_between(path, marker, html):
    """Replace whatever lies between <!-- BEGIN x --> and <!-- END x -->."""
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    pat = re.compile(r"(<!-- BEGIN %s -->\n).*?(<!-- END %s -->)"
                     % (marker, marker), re.S)
    if not pat.search(src):
        raise Problem("%s has no <!-- BEGIN %s --> … <!-- END %s --> markers"
                      % (os.path.basename(path), marker, marker))
    out = pat.sub(lambda m: m.group(1) + html + "\n" + m.group(2), src)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(out)


def build_pages():
    check_every_table_has_unique_keys()
    written = []

    # The version, and when this build was made. The date is stamped here
    # rather than written by hand because it has one job — to tell a reader how
    # old the thing in front of them is — and a hand-written one goes stale the
    # first time somebody forgets. The build runs immediately before the push,
    # so the stamp is the push time.
    version = "?"
    vpath = os.path.join(TEXTS, "version.csv")
    if os.path.exists(vpath):
        rows = T.read_csv(vpath)
        if rows:
            version = rows[0].get("version", version)
    # `version.csv` holds the UPDATE NUMBER — a whole number that counts
    # releases of version 1 — and the reader is shown "Version 1 update 203",
    # short form 1.203. THE LEADING 1 DOES NOT MOVE. It is not a major version
    # that a hundred updates roll over: it changes when the author says the map
    # is a version 2, and at no other time. See CLAUDE.md.
    #
    # It was a decimal, 0.82 through 2.02, and hundredths were doing two jobs
    # at once — counting releases and implying that passing x.99 meant
    # something. It did not. The number carried over from that scheme by
    # multiplying by a hundred, so 2.02 became update 202 and nothing a reader
    # had seen went backwards.
    #
    # The number moves by one only when asked — `--bump`, which the release
    # step passes and an ordinary build does not. It used to move on every run,
    # and a session that rebuilds while measuring runs this twenty times: it
    # went 0.82 to 1.02 in a day with nothing released in between, which is a
    # number that lies to the reader about how far the work has come. A build
    # is not a release.
    if "--bump" in sys.argv and os.path.exists(vpath):
        try:
            version = str(int(version) + 1)
        except ValueError:
            pass
        else:
            with open(vpath, "w", encoding="utf-8", newline="") as fh:
                fh.write("version\n%s\n" % version)
    stamp = time.strftime("%d %B %Y, %H:%M")
    footer = ('  <p class="version">Version 1 update '
              '<span id="jem-version">%s</span> · last updated %s</p>\n'
              % (html_escape(version), html_escape(stamp)))

    # And the same number into map.js, so the About dialog can report the
    # version of the code that is actually running.
    #
    # index.html is cached for ten minutes and map.js for seven days — see
    # `.htaccess` — so a reader who came back to the site got a fresh page
    # carrying a fresh version number over a `map.js` that could be a week
    # old, and the About dialog said so with complete confidence. That cost a
    # long afternoon: a bug fixed and pushed was reported as still present,
    # and the version number agreed with the reporter.
    #
    # `map.js` now carries its own, and the dialog prefers it. When the two
    # disagree the dialog says both, which is the only honest thing it can do
    # and turns an invisible problem into a visible one.
    # ------------------------------------------------------------ cache keys
    #
    # The URL of every file the site fetches carries a short hash of that
    # file's own contents, so a release changes the URL of whatever actually
    # changed and of nothing else.
    #
    # It was the version number, and that had a hole in it the size of the
    # rule that governs the version number: it moves once per push, so a file
    # edited and uploaded *without* a bump kept its old URL and readers kept
    # the old file — for a week, since the versioned URLs are what let the
    # week-long cache come back. A content hash cannot be forgotten. Bump or
    # not, an edited file gets a new name; an unedited one keeps its cache.
    #
    # `map.js` is given the table for the files it fetches itself, and the
    # pages are given the rest. Nothing lists `map.js`'s own hash except
    # `index.html`, which is written after `map.js` is, so there is no
    # circularity to resolve.
    def digest(path):
        with open(path, "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:10]

    # what map.js fetches for itself
    FETCHED = ("japan-empire-map.svg", "japan-empire-map-admin.svg",
               "japan-empire-map-fine.svg", "japan-empire-map-roc.svg",
               # Korea's provinces at survey resolution, fetched only on a
               # deep zoom over Korea
               "japan-empire-map-korea.svg",
               "annotate.js", "admin.js",
               # the train tools and their timetable, both fetched only when a
               # reader zooms in to a railway that has one
               "trains.js", "tw-trains.js",
               # and the printed tables, which a station's card links to
               "timetable/taiwan-1936.html",
               # the relief is three images map.js fetches by name, one per
               # projection, and they are not .js or .css so the page's own
               # stamper below never sees them
               ) + tuple(
                   "relief/relief-%s-%s.webp" % (lvl, mode)
                   for lvl in ("coarse", "fine", "finest")
                   for mode in ("mercator", "albers", "laea"))
    assets = {}
    for name in FETCHED:
        apath = os.path.join(ROOT, name)
        if os.path.exists(apath):
            assets[name] = digest(apath)

    mpath = os.path.join(ROOT, "map.js")
    if os.path.exists(mpath):
        mjs = open(mpath, encoding="utf-8").read()
        stamps = ["  var JEM_VERSION = '%s';" % version,
                  "  var JEM_ASSETS = %s;" % json.dumps(assets, sort_keys=True)]
        want = "\n".join(stamps)
        pat = re.compile(r"^  var JEM_VERSION = '[^']*';(?:\n  var JEM_ASSETS = \{[^\n]*\};)?", re.M)
        if pat.search(mjs):
            mjs2 = pat.sub(lambda m: want, mjs, count=1)
        else:
            mjs2 = mjs.replace("(function () {\n  'use strict';",
                               "(function () {\n  'use strict';\n" + want, 1)
        if mjs2 != mjs:
            with open(mpath, "w", encoding="utf-8") as fh:
                fh.write(mjs2)
            written.append("map.js (version and asset hashes)")

    # and now the pages, with map.js hashed as it now stands
    for page in ("index.html", "sources.html"):
        ppath = os.path.join(ROOT, page)
        if not os.path.exists(ppath):
            continue
        txt = open(ppath, encoding="utf-8").read()

        def stamp_ref(m):
            name = m.group(2)
            fpath = os.path.join(ROOT, name)
            key = digest(fpath) if os.path.exists(fpath) else version
            return '%s="%s?v=%s"' % (m.group(1), name, key)

        out = re.sub(r'\b(src|href)="([A-Za-z0-9_.-]+\.(?:js|css))(?:\?v=[^"]*)?"',
                     stamp_ref, txt)
        if out != txt:
            with open(ppath, "w", encoding="utf-8") as fh:
                fh.write(out)
            written.append(page + " (cache keys)")

    about = open(os.path.join(TEXTS, "pages", "about.md"),
                 encoding="utf-8").read()
    splice_between(os.path.join(ROOT, "index.html"), "about",
                   markdown.render(about, indent=2, drop_h1=True) + footer)
    written.append("index.html")

    # How to work the map, in a dialog of its own behind the ? button. About is
    # what the map is and where it comes from; this is how to use it, and the
    # two were one page that a reader had to scroll through to find either.
    help_md = open(os.path.join(TEXTS, "pages", "help.md"),
                   encoding="utf-8").read()
    splice_between(os.path.join(ROOT, "index.html"), "help",
                   markdown.render(help_md, indent=2, drop_h1=True))

    src = open(os.path.join(TEXTS, "pages", "sources.md"),
               encoding="utf-8").read()
    splice_between(os.path.join(ROOT, "sources.html"), "sources",
                   markdown.render(src, indent=0, drop_h1=True))
    written.append("sources.html")

    # The same words as a plain file, for reading in the repository itself.
    with open(os.path.join(ROOT, "docs", "SOURCES.md"), "w", encoding="utf-8") as fh:
        fh.write("<!-- Generated from texts/pages/sources.md by "
                 "tools/build_texts.py. Edit that file, not this one. -->\n\n"
                 + src.lstrip())
    written.append("docs/SOURCES.md")
    return written


def main():
    try:
        splice_data_js()
        print("data.js       <- texts/*.csv, texts/**/*.md")
        for name in build_pages():
            print("%-13s <- texts/pages/" % name)
    except Problem as exc:
        sys.stderr.write("texts: %s\n" % exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
