#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The two forms of every name inside the empire.

    python3 tools/build_localnames.py            # print what it would write
    python3 tools/build_localnames.py --write    # write it

The map can be read with Japanese names foremost — the names an official
document, a railway timetable or an army map of the period would print — or with
the local ones foremost. `en` carries the first and a new `local` column
carries the second, and `map.js` picks between them from one switch.

## Which places

Korea, Taiwan, Kwantung, Manchukuo and Mengjiang, down to the level of a
province, a district and a town. **Not the colony itself**: Chōsen, Taiwan and
Manchukuo are what those polities were called, and a switch about how their
insides are labelled has no business renaming them.

## The two directions are not the same job

  * **Korea and Taiwan** already read Japanese-first, so only `local` is
    derived: the first alternative becomes the head and the old head moves in
    front of the rest. `Keiki-dō (Kyŏnggi-do)` gives `Kyŏnggi-do (Keiki-dō)`.

  * **Manchukuo, Mengjiang and Kwantung** already read Chinese-first, from the
    pass that put Pinyin in front for China. There the *Japanese* form is the
    one that has to be built, out of the reading in the `ja` column, and `en`
    itself changes: `Hēihé (Heiho)` with `ja` of `黒河省 (Kokka)` gives
    `Kokka-shō (Hēihé, Heiho)`.

    So turning the switch on by default changes how those read today. That is
    the point of the switch, but it is a change and not a preservation.

## Taiwan's suffixes are built, not shuffled

Taiwan's heads carry an administrative suffix its parentheses do not — the
head is `Kagi-gun` and the alternative is a bare `Jiayi`. Swapping them
straight would demote a district to a place name, so the Chinese suffix is put
back from the kanji: 郡 is `-jun`, 市 `-shi`, 州 `-zhou`, 廳 `-ting`. That
keeps the local form parallel to Korea's, where `-do` was there already.

## Manchuria in 1930

Manchukuo's provinces are only drawn on the 1942 map, but its **cities** are on
both — and in 1930 Manchuria was Chinese. Calling Mukden `Hōten` on a map of
1930 would be an anachronism the switch cannot excuse, so those rows carry
`jpfrom: e1942` and read Chinese-first on the earlier map whatever the switch
says.

## Where it will be wrong

The local form is Pinyin, and for some of these places Pinyin is not the local
name at all. The four Hsingan provinces are Mongol banner country and the
Mengjiang leagues are Mongol; Musha is Seediq. Those want romanised Mongolian
and indigenous forms rather than Chinese ones, and this script cannot invent
them. It writes Pinyin, `OVERRIDE` below holds the ones that have been
corrected by hand, and the rest are honest placeholders.
"""
import argparse
import csv
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SUB = os.path.join(ROOT, "texts", "territories", "sub-units")

# The polities the switch governs, as `data/cities-*.csv` spells them, and
# which way round each one's `en` column starts.
JP_FIRST = ("Chōsen", "Formosa")                       # only `local` is derived
LOCAL_FIRST = ("Manchukuo", "Mengjiang", "Kwantung Leased Territory")
# and the epoch from which the Japanese form is true, where that is not always
FROM_1942 = ("Manchukuo", "Mengjiang")

# Names this script gets wrong, corrected by hand. The key is the row's id or
# key; the value is the local-first form to use instead of the derived one.
OVERRIDE = {
    # ", Pescadores" locates the town, it is not one of its names, so the
    # derived form swallowed it into the list of alternatives
    "makung": "Magong, Pescadores (Makō, Makung)",
}

# And the Japanese-first form, where building it from the reading is not right.
EN_OVERRIDE = {
    # a description rather than a name, so it does not take a capital inside
    # the brackets
    "The Mongol leagues": "Mōko renmei (the Mongol leagues)",
}

# Rows the switch has no business touching.
SKIP = {
    # Ejina is a Torghut banner in the far west of Inner Mongolia, a thousand
    # kilometres beyond anything Mengjiang administered, and it is listed under
    # it only because the polity column had to say something. Giving a Mongol
    # banner a katakana name on that basis would be inventing a fact.
    "hohhot2",
}

SUFFIX_TW = {"郡": "jun", "市": "shi", "州": "zhou", "廳": "ting",
             "庄": "zhuang", "街": "jie"}
SUFFIX_JP = {"省": "shō", "政廳": "seichō", "聯盟": "renmei"}


def parts(en):
    """`Head (a, b)` -> ('Head', ['a', 'b'])."""
    m = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", (en or "").strip())
    if not m:
        return (en or "").strip(), []
    return m.group(1).strip(), [x.strip() for x in m.group(2).split(",") if x.strip()]


def dedupe(head, alts):
    """No name printed twice. `Kirin-shō (Jílín, Kirin)` is one Kirin too many."""
    out = []
    seen = {head.lower()}
    for a in alts:
        if a.lower() not in seen:
            out.append(a)
            seen.add(a.lower())
    return out


def local_from(en, ja="", taiwan=False):
    """The local-first form of a name that is already Japanese-first."""
    head, alts = parts(en)
    if not alts:
        return ""                      # one name either way; nothing to switch
    first = alts[0]
    if taiwan:
        kanji = parts(ja)[0]
        suf = SUFFIX_TW.get(kanji[-1:], "")
        if suf and not first.endswith("-" + suf):
            first += "-" + suf
    rest = dedupe(first, [head] + alts[1:])
    return "%s (%s)" % (first, ", ".join(rest)) if rest else first


def jp_from(en, ja):
    """The Japanese-first form of a name that is already local-first."""
    ja_head, ja_alts = parts(ja)
    if not ja_alts:
        return ""                      # no reading recorded; leave it alone
    read = ja_alts[0]
    for kanji, suf in SUFFIX_JP.items():
        if ja_head.endswith(kanji) and not read.endswith(suf):
            read += "-" + suf
            break
    head, alts = parts(en)
    # `Jìnběi — the North Shansi Administration`: the em-dash half is a
    # description, not a name, and belongs after the brackets either way
    gloss = ""
    if " — " in head:
        head, gloss = head.split(" — ", 1)
        gloss = " — " + gloss
    rest = dedupe(read, [head] + alts)
    return "%s (%s)%s" % (read, ", ".join(rest), gloss) if rest else read + gloss


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    crlf = open(path, "rb").read().count(b"\r\n") > 0
    return rows, list(rows[0].keys()), crlf


def save(path, rows, fields, crlf):
    with io.open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields,
                           lineterminator="\r\n" if crlf else "\n")
        w.writeheader()
        w.writerows(rows)


def polity_of():
    """id -> the polity it was in, taking 1942 first: Manchukuo exists there."""
    out = {}
    for name in ("cities-1930.csv", "cities-1942.csv"):
        path = os.path.join(ROOT, "data", name)
        if not os.path.exists(path):
            continue
        for r in csv.DictReader(io.open(path, encoding="utf-8")):
            p = (r.get("polity") or "").strip()
            if p in JP_FIRST or p in LOCAL_FIRST:
                out[r["id"]] = p
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    touched = []

    def note(where, key, before, after, col):
        touched.append((where, key, before, after, col))

    # ---- the sub-units -----------------------------------------------------
    for name, mode in (("korea", "jp"), ("taiwan", "jp"),
                       ("manchukuo", "local"), ("mengjiang", "local")):
        path = os.path.join(SUB, "%s.csv" % name)
        if not os.path.exists(path):
            continue
        rows, fields, crlf = load(path)
        if "local" not in fields:
            fields = fields[:fields.index("en") + 1] + ["local"] \
                + [f for f in fields[fields.index("en") + 1:]]
        for r in rows:
            r.setdefault("local", "")
            if r["key"] in SKIP:
                continue
            if mode == "jp":
                loc = OVERRIDE.get(r["key"]) or local_from(
                    r["en"], r.get("ja", ""), taiwan=(name == "taiwan"))
                if loc and loc != r["local"]:
                    note(name, r["key"], r["en"], loc, "local")
                    r["local"] = loc
            else:
                jp = EN_OVERRIDE.get(r["key"]) or jp_from(r["en"], r.get("ja", ""))
                if jp and jp != r["en"]:
                    note(name, r["key"], r["en"], jp, "en+local")
                    r["local"] = OVERRIDE.get(r["key"]) or r["en"]
                    r["en"] = jp
        if args.write:
            save(path, rows, fields, crlf)

    # ---- the cities, in browse.csv and in sites.csv ------------------------
    pol = polity_of()
    for rel, idcol in (("texts/browse.csv", "id"), ("texts/sites/sites.csv", "id")):
        path = os.path.join(ROOT, rel)
        rows, fields, crlf = load(path)
        for extra in ("local", "jpfrom"):
            if extra not in fields:
                fields = fields[:fields.index("en") + 1] + [extra] \
                    + [f for f in fields[fields.index("en") + 1:]]
        for r in rows:
            r.setdefault("local", "")
            r.setdefault("jpfrom", "")
            p = pol.get(r[idcol])
            if not p or r[idcol] in SKIP:
                continue
            if p in JP_FIRST:
                loc = OVERRIDE.get(r[idcol]) or local_from(
                    r["en"], r.get("ja", ""), taiwan=(p == "Formosa"))
                if loc and loc != r["local"]:
                    note(os.path.basename(rel), r[idcol], r["en"], loc, "local")
                    r["local"] = loc
            else:
                jp = EN_OVERRIDE.get(r[idcol]) or jp_from(r["en"], r.get("ja", ""))
                if jp and jp != r["en"]:
                    note(os.path.basename(rel), r[idcol], r["en"], jp, "en+local")
                    r["local"] = OVERRIDE.get(r[idcol]) or r["en"]
                    r["en"] = jp
            if p in FROM_1942:
                r["jpfrom"] = "e1942"
        if args.write:
            save(path, rows, fields, crlf)

    for where, key, before, after, col in touched:
        print("  %-12s %-16s %-40s -> %s" % (where, key, before[:40], after))
    print("%d names %s" % (len(touched), "written" if args.write else "would change"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
