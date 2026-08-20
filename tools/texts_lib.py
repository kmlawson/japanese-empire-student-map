#!/usr/bin/env python3
"""Read and write the contents of texts/.

Everything a reader of the map sees in words lives in texts/ : the names, the
dates, the descriptions, the legend labels, the About and Sources pages. This
module is the only thing that knows how those files are shaped, and both the
generator (tools/build_texts.py) and the one-off extractor that first filled the
folder use it, so the two cannot drift.

Two file kinds
--------------

**CSV** holds the short fields — identifiers, names in each script, a date
phrase, the level, which atoms a record is drawn from. One row per record, one
column per field, and a column is simply left out of a file when nothing in it
uses that field. An empty cell means the field is absent, which is not the same
as present-and-empty: a record with no `ja` shows no Japanese line at all.

**Markdown** holds the long prose, keyed to the CSV by the record's id::

    # China                     <- a divider, for the reader of the file only

    > Why this record is drawn   <- commentary, for the maintainer only
    > the way it is.

    ## manchuria                <- the key, matching the id column

    Chinese territory in 1930, run by the Fengtien clique …

The body of a `##` section is the string that ships, taken verbatim rather than
rendered: a note may contain `<em>` and it should reach the page as `<em>`. Soft
line wrapping is undone, so the file can be wrapped for editing. `#` dividers
and `>` commentary are for whoever edits the file and are never shipped, which
is where the explanations that used to sit as comments inside data.js now live.

`{{name}}` in a note body pulls in a shared sentence from texts/snippets.md, so
the reclamation caution on the South China Sea islands is written once.
"""

import csv
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TEXTS = os.path.join(ROOT, "texts")

# How a cell is read back into a value. Anything not named here is a string.
LIST_COLS = {"atoms", "lights", "edgeAtoms"}      # space-separated ids
NUM_LIST_COLS = {"edgeClip"}                      # space-separated numbers
NUM_COLS = {"lvl", "lat", "lon", "year", "edgeWidth", "lon0", "lat0",
            "lon1", "lat1"}
BOOL_COLS = {"adminOnly", "unseen", "outline"}

# The order fields are written in, for CSV columns and for the emitted objects.
# Identity first, then names, then the short phrases, then everything
# structural, so that the columns a person edits are the ones on the left.
FIELD_ORDER = [
    "epoch", "id", "key", "site", "cluster",
    "en", "ja", "orig", "zh", "ko",
    "when", "date", "rule", "source", "blurb",
    "cat", "lvl", "c", "atoms", "lights", "within", "under",
    "hatch", "edge", "edgeAtoms", "edgeClip", "edgeWidth",
    "outline", "outlineColor", "adminOnly", "unseen", "srcOnly",
    "lat", "lon", "lon0", "lat0", "lon1", "lat1", "note",
]


def field_key(name):
    try:
        return (0, FIELD_ORDER.index(name))
    except ValueError:
        return (1, name)


# ---------------------------------------------------------------- CSV

def read_csv(path):
    """Rows of a texts/ CSV as dicts, with absent fields left out.

    Values keep the spelling they have in the file. Numbers stay strings on
    purpose: `lat: 41.80` should still read 41.80 after a round trip, and a
    float would turn it into 41.8.
    """
    with open(path, encoding="utf-8", newline="") as fh:
        rows = []
        for raw in csv.DictReader(fh):
            row = {}
            for k, v in raw.items():
                if k is None or v is None:
                    continue
                v = v.strip()
                if v == "":
                    continue
                row[k] = v
            if row:
                rows.append(row)
        return rows


def write_csv(path, rows, columns=None):
    """Write rows, using only the columns something actually fills."""
    if columns is None:
        used = set()
        for r in rows:
            used.update(k for k, v in r.items() if v not in (None, ""))
        columns = sorted(used, key=field_key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=columns, extrasaction="ignore",
                       lineterminator="\n")
    w.writeheader()
    for r in rows:
        w.writerow({c: r.get(c, "") for c in columns})
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(buf.getvalue())


def cell_to_value(col, cell):
    """One cell as the value it stands for, ready to be emitted as JS."""
    if col in BOOL_COLS:
        return True if cell.lower() in ("yes", "true", "1") else None
    if col in LIST_COLS:
        return [p for p in cell.split() if p]
    if col in NUM_LIST_COLS:
        return [Raw(p) for p in cell.split() if p]
    if col in NUM_COLS:
        if not re.fullmatch(r"-?\d+(\.\d+)?", cell):
            raise ValueError("%s should be a number, not %r" % (col, cell))
        return Raw(cell)
    return cell


def value_to_cell(v):
    """The inverse, for the extractor."""
    if v is True:
        return "yes"
    if v is False or v is None:
        return ""
    if isinstance(v, list):
        return " ".join(str(x) for x in v)
    return str(v)


class Raw(str):
    """A string to be emitted into JS as it stands, not quoted.

    Numbers travel this way so that the digits in the file are the digits in
    the output: 41.80 stays 41.80, and 100 does not become 100.0.
    """


# ---------------------------------------------------------------- Markdown

_KEY_RE = re.compile(r"^##\s+(.+?)\s*$")
_DIVIDER_RE = re.compile(r"^#\s+(.+?)\s*$")


def read_notes(path):
    """Sections of a notes file as {key: {'note', 'commentary', 'group'}}.

    Missing files are empty, so a collection can start out with no prose.
    """
    out = {}
    if not os.path.exists(path):
        return out
    key = None
    group = None
    body = []
    commentary = []

    def flush():
        if key is None:
            return
        text = _join(body)
        out[key] = {"note": text, "commentary": list(commentary),
                    "group": group}

    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            m = _KEY_RE.match(line)
            if m:
                flush()
                key, body, commentary = m.group(1), [], []
                continue
            d = _DIVIDER_RE.match(line)
            if d and not _KEY_RE.match(line):
                flush()
                group, key, body, commentary = d.group(1), None, [], []
                continue
            if line.startswith(">"):
                commentary.append(line.lstrip("> ").rstrip())
                continue
            body.append(line)
    flush()
    return out


def _join(lines):
    """Soft-wrapped lines back into one string, blank lines as paragraph breaks.

    Nothing in the records is more than one paragraph long today, but a note
    that grows one keeps it: the paragraphs are joined with a space rather than
    silently run together, which is what the tooltips and the info panel want.
    """
    paras = []
    cur = []
    for line in lines:
        if line.strip() == "":
            if cur:
                paras.append(" ".join(cur))
                cur = []
        else:
            cur.append(line.strip())
    if cur:
        paras.append(" ".join(cur))
    return " ".join(p for p in paras if p)


def write_notes(path, sections, header=None, width=78):
    """Write a notes file. `sections` is a list of (kind, key, text) where
    kind is 'divider', 'commentary' or 'note'."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out = []
    if header:
        out.append(header.rstrip() + "\n")
    for kind, key, text in sections:
        if kind == "divider":
            out.append("\n# %s\n" % key)
        elif kind == "commentary":
            out.append("\n" + _wrap(text, width, prefix="> ") + "\n")
        else:
            out.append("\n## %s\n\n%s\n" % (key, _wrap(text, width)))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("".join(out).lstrip("\n"))


def _wrap(text, width, prefix=""):
    words = text.split()
    lines = []
    cur = prefix.rstrip() if prefix else ""
    cur = ""
    for w in words:
        cand = (cur + " " + w).strip()
        if cur and len(prefix) + len(cand) > width:
            lines.append(prefix + cur)
            cur = w
        else:
            cur = cand
    if cur:
        lines.append(prefix + cur)
    return "\n".join(lines)


# ------------------------------------------------------------- snippets

def read_snippets(path=None):
    path = path or os.path.join(TEXTS, "snippets.md")
    return {k: v["note"] for k, v in read_notes(path).items()}


_SNIP_RE = re.compile(r"\{\{\s*([\w-]+)\s*\}\}")


def expand(text, snippets):
    """Replace {{name}} with the shared sentence it names."""
    def sub(m):
        name = m.group(1)
        if name not in snippets:
            raise KeyError("texts/snippets.md has no %r" % name)
        return snippets[name]
    return _SNIP_RE.sub(sub, text)


# ------------------------------------------------------------- JS output

_ID_RE = re.compile(r"^[A-Za-z_$][\w$]*$")


def js_string(s):
    """A JS single-quoted string. Only the two characters that must be escaped
    are escaped, so the Japanese, Chinese and Korean stay readable in the
    output and the typographic apostrophes stay as themselves."""
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def js_value(v, indent=0):
    if isinstance(v, Raw):
        return str(v)
    if v is True:
        return "true"
    if v is False:
        return "false"
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        return js_string(v)
    if isinstance(v, list):
        return "[" + ", ".join(js_value(x) for x in v) + "]"
    if isinstance(v, dict):
        return js_object(v, indent)
    raise TypeError(type(v))


def js_key(k):
    return k if _ID_RE.match(k) else js_string(k)


def js_object(d, indent=0):
    """A one-line object if it is short, otherwise wrapped and indented.

    The output is read by people often enough — when a note has gone missing,
    or a colour is wrong — that it is worth keeping to about eighty columns.
    """
    parts = ["%s: %s" % (js_key(k), js_value(v, indent + 2))
             for k, v in d.items()]
    one = "{ " + ", ".join(parts) + " }"
    if indent + len(one) <= 96:
        return one
    pad = " " * (indent + 2)
    out = ["{"]
    line = pad
    for i, p in enumerate(parts):
        piece = p + ("," if i < len(parts) - 1 else "")
        if line.strip() and len(line) + 1 + len(piece) > 96:
            out.append(line.rstrip())
            line = pad
        line += (" " if line.strip() else "") + piece
    if line.strip():
        out.append(line.rstrip())
    out.append(" " * indent + "}")
    return "\n".join(out)


SKIP_COLS = ("epoch", "key", "site", "cluster")


def record_to_js(row, note=None, indent=4, note_field="note"):
    """A CSV row, plus the prose that belongs to it, as a JS object literal.

    The columns that only say where a row lives — which epoch, which sub-unit
    it names — are left out: they are the file's business, not the record's.
    """
    obj = {}
    for col in sorted(row.keys(), key=field_key):
        if col in SKIP_COLS:
            continue
        val = cell_to_value(col, row[col])
        if val is None or val == [] or val == "":
            continue
        obj[col] = val
    if note:
        obj[note_field] = note
    return js_object(obj, indent)


def note_for(sections, key, snippets):
    """The prose for one record, with its shared sentences pulled in."""
    sec = sections.get(key)
    if not sec or not sec["note"]:
        return None
    return expand(sec["note"], snippets)
