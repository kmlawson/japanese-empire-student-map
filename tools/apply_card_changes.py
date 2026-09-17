#!/usr/bin/env python3
"""Apply a batch of card-text changes to the shared files in texts/.

    python3 tools/apply_card_changes.py reports/2026.09.16-cards-china.changes.json [more.json ...]
    python3 tools/apply_card_changes.py --dry ...      # say what would change, write nothing

Written for the card audit of 16 September 2026, when three agents worked on
three regions at once and all three needed to edit the same files —
`texts/city-names.md`, `texts/sites/sites.md`, `texts/territories/1942.md` and
their CSVs. Two editors rewriting one file in the same minute lose one
another's work silently, so each wrote its changes to a JSON file and this
applies them one after another. The shape:

    {
      "texts/city-names.md":  { "<id>": "<whole new note, or \\"\\" to drop it>" },
      "texts/city-names.csv": { "<id>": { "wiki": "<url or \\"\\">", "en": "..." } }
    }

A `.md` change replaces the prose of the `## <key>` section and keeps the
section's own `>` commentary above it; a key the file does not have is
appended at the end; an empty note removes the section unless it carries
commentary, in which case the heading and the commentary stay. Nothing else
in the file is touched — not the wrapping of other sections, not the
dividers, not the order. A `.csv` change writes the named cells of the row
whose `id` (or `key`) matches and leaves every other byte alone, line
endings included (three of these files are CRLF). A key that is not in the
file is an error and stops the run before anything is written.
"""
import csv
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get("CARD_ROOT") or os.path.dirname(HERE)   # CARD_ROOT: a copy, for trying it out
KEY_RE = re.compile(r"^##\s+(.+?)\s*$")
DIVIDER_RE = re.compile(r"^#\s+(.+?)\s*$")
WIDTH = 78


def wrap(text):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        cand = (cur + " " + w).strip()
        if cur and len(cand) > WIDTH:
            lines.append(cur)
            cur = w
        else:
            cur = cand
    if cur:
        lines.append(cur)
    return lines


def apply_md(path, changes, dry):
    raw = open(path, encoding="utf-8").read()
    nl = "\r\n" if "\r\n" in raw else "\n"
    lines = raw.split(nl)
    # the sub-unit and territory notes are wrapped at 78; the city notes are
    # one line each, and a wrapped note among them would look like a mistake
    wrapped = max((len(l) for l in lines if l and not l.startswith(">")), default=0) <= 100
    fmt = wrap if wrapped else (lambda t: [" ".join(t.split())])
    # section boundaries: heading index -> (start, end) of the lines after it
    heads = {}
    order = []
    for i, line in enumerate(lines):
        m = KEY_RE.match(line)
        if m:
            heads[m.group(1)] = i
            order.append(i)
    missing = [k for k in changes if k not in heads and changes[k] == ""]
    if missing:
        raise SystemExit("%s: cannot drop a note that is not there: %s" % (path, ", ".join(missing)))
    out = []
    i = 0
    n_changed = 0
    while i < len(lines):
        line = lines[i]
        m = KEY_RE.match(line)
        if not m or m.group(1) not in changes:
            out.append(line)
            i += 1
            continue
        key = m.group(1)
        j = i + 1
        while j < len(lines) and not KEY_RE.match(lines[j]) and not DIVIDER_RE.match(lines[j]):
            j += 1
        body = lines[i + 1:j]
        commentary = [l for l in body if l.startswith(">")]
        new = changes[key]
        if new == "" and not commentary:
            pass                                   # the whole section goes
        else:
            out.append(line)
            out.extend(commentary)
            if new:
                out.append("")
                out.extend(fmt(new))
            out.append("")
        n_changed += 1
        i = j
    # keep exactly one blank line before a following heading, as the files do
    for key, new in changes.items():
        if key in heads or not new:
            continue
        while out and out[-1] == "":
            out.pop()
        out.extend(["", "## " + key, ""])
        out.extend(fmt(new))
        out.append("")
        n_changed += 1
    text = nl.join(out)
    if not text.endswith(nl):
        text += nl
    if not dry:
        open(path, "w", encoding="utf-8", newline="").write(text)
    return n_changed


def apply_csv(path, changes, dry):
    raw = open(path, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in raw else "\n"
    rows = list(csv.DictReader(io.StringIO(raw)))
    cols = list(rows[0].keys())
    keycol = "id" if "id" in cols else "key"
    by = {r[keycol]: r for r in rows}
    missing = [k for k in changes if k not in by]
    if missing:
        raise SystemExit("%s: no row with %s %s" % (path, keycol, ", ".join(missing)))
    bad = [c for k in changes for c in changes[k] if c not in cols]
    if bad:
        raise SystemExit("%s: no column %s" % (path, ", ".join(sorted(set(bad)))))
    n = 0
    for k, cells in changes.items():
        for c, v in cells.items():
            if by[k][c] != v:
                by[k][c] = v
                n += 1
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=cols, lineterminator=nl)
    w.writeheader()
    w.writerows(rows)
    if not dry:
        open(path, "w", encoding="utf-8", newline="").write(out.getvalue())
    return n


def main(argv):
    dry = "--dry" in argv
    files = [a for a in argv if not a.startswith("--")]
    if not files:
        raise SystemExit(__doc__)
    total = 0
    for f in files:
        changes = json.load(open(f, encoding="utf-8"))
        for rel, ch in changes.items():
            if not ch:
                continue
            path = os.path.join(ROOT, rel)
            if not os.path.exists(path):
                raise SystemExit("%s: %s does not exist" % (f, rel))
            if rel.endswith(".md"):
                n = apply_md(path, ch, dry)
            elif rel.endswith(".csv"):
                n = apply_csv(path, ch, dry)
            else:
                raise SystemExit("%s: %s is neither .md nor .csv" % (f, rel))
            print("  %s%s: %d change(s) from %s" % ("would write " if dry else "", rel, n, os.path.basename(f)))
            total += n
    print("%d change(s)%s" % (total, " (dry)" if dry else ""))


if __name__ == "__main__":
    main(sys.argv[1:])
