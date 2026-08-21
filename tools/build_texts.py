#!/usr/bin/env python3
"""Fold texts/ into the site.

    python3 tools/build_texts.py

Everything a reader sees in words lives in texts/ — the names in each script,
the dates, the notes, the legend labels, the About and Sources pages. This
script writes them into the places the browser actually reads:

    texts/*.csv, texts/**/*.md   ->  the generated half of data.js
    texts/pages/about.md         ->  the About dialog in index.html
    texts/pages/sources.md       ->  sources.html, and SOURCES.md at the root

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
    stamp = time.strftime("%d %B %Y, %H:%M")
    footer = ('  <p class="version">Version %s · last updated %s</p>\n'
              % (html_escape(version), html_escape(stamp)))

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
    with open(os.path.join(ROOT, "SOURCES.md"), "w", encoding="utf-8") as fh:
        fh.write("<!-- Generated from texts/pages/sources.md by "
                 "tools/build_texts.py. Edit that file, not this one. -->\n\n"
                 + src.lstrip())
    written.append("SOURCES.md")
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
