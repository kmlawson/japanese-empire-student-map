#!/usr/bin/env python3
"""Fold texts/ into the site.

    python3 tools/build_texts.py

Everything a reader sees in words lives in texts/ — the names in each script,
the dates, the notes, the legend labels, the About and Sources pages. This
script writes them into the places the browser actually reads:

    texts/*.csv, texts/**/*.md   ->  the generated half of data.js
    texts/pages/about.md         ->  the About dialog in index.html
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


def build_data_js():
    snippets = T.read_snippets()
    parts = []

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
        inner.append("  e%s: [\n%s\n  ]," % (year, array(rows, ns, snippets)))
    parts.append("JMAP.TERRITORIES = {\n%s\n};" % "\n".join(inner))

    # -------------------------------------------------------------- sites
    rows = load("sites", "sites.csv")
    check_unique(rows, "id", "texts/sites/sites.csv")
    check_frame(rows, "texts/sites/sites.csv")
    ns = notes("sites", "sites.md")
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
    rows, ns, seen = [], {}, {}
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
        for r in rows:
            if r["key"] not in sub_keys:
                raise Problem("texts/territories/sub-units/%s overrides %r, "
                              "which no group file defines" % (name, r["key"]))
        inner.append("  e%s: {\n%s\n  }," % (m.group(1),
                                             keyed(rows, ns, snippets, indent=4)))
    parts.append(
        "/* One block per epoch, and the generator holds it to that: this "
        "object\n   carried two `e1942` keys for a long time and the later of "
        "them silently\n   discarded the earlier, so eleven overrides never "
        "took effect at all. */\nJMAP.PROVINCE_EPOCH = {\n%s\n};"
        % "\n".join(inner))

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
    # The number moves on a hundredth only when asked — `--bump`, which the
    # release step passes and an ordinary build does not. It used to move on
    # every run, and a session that rebuilds while measuring runs this twenty
    # times: the version went 0.82 to 1.02 in a day with nothing released in
    # between, which is a number that lies to the reader about how far the work
    # has come. A build is not a release. Counted in hundredths and not added
    # as a float, because 0.82 + 0.01 is 0.8300000000000001 and that would be
    # the version somebody read.
    if "--bump" in sys.argv and os.path.exists(vpath):
        try:
            version = "%.2f" % ((int(round(float(version) * 100)) + 1) / 100.0)
        except ValueError:
            pass
        else:
            with open(vpath, "w", encoding="utf-8", newline="") as fh:
                fh.write("version\n%s\n" % version)
    stamp = time.strftime("%d %B %Y, %H:%M")
    footer = ('  <p class="version">Version <span id="jem-version">%s</span>'
              ' · last updated %s</p>\n'
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
    # And the version onto every script and stylesheet the pages ask for, so
    # that a release changes their URLs and the browser cannot serve last
    # week's copy. `index.html` itself is short-cached, and it is the only
    # thing that has to be.
    for page in ("index.html", "sources.html"):
        ppath = os.path.join(ROOT, page)
        if not os.path.exists(ppath):
            continue
        txt = open(ppath, encoding="utf-8").read()
        def stamp_ref(m):
            return '%s="%s?v=%s"' % (m.group(1), m.group(2), version)
        out = re.sub(r'\b(src|href)="([A-Za-z0-9_.-]+\.(?:js|css))(?:\?v=[^"]*)?"',
                     stamp_ref, txt)
        if out != txt:
            with open(ppath, "w", encoding="utf-8") as fh:
                fh.write(out)
            written.append(page + " (asset versions)")

    mpath = os.path.join(ROOT, "map.js")
    if os.path.exists(mpath):
        mjs = open(mpath, encoding="utf-8").read()
        want = "  var JEM_VERSION = '%s';" % version
        pat = re.compile(r"^  var JEM_VERSION = '[^']*';", re.M)
        if pat.search(mjs):
            mjs2 = pat.sub(want.replace("\\", "\\\\"), mjs, count=1)
        else:
            mjs2 = mjs.replace("(function () {\n  'use strict';",
                               "(function () {\n  'use strict';\n" + want, 1)
        if mjs2 != mjs:
            with open(mpath, "w", encoding="utf-8") as fh:
                fh.write(mjs2)
            written.append("map.js (version stamp)")

    about = open(os.path.join(TEXTS, "pages", "about.md"),
                 encoding="utf-8").read()
    splice_between(os.path.join(ROOT, "index.html"), "about",
                   markdown.render(about, indent=2, drop_h1=True) + footer)
    written.append("index.html")

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
