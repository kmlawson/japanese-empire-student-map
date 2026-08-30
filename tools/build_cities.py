"""Turn data/cities-1930.csv and data/cities-1942.csv into cities-gaz.js.

Run by hand when the CSVs change:

    python3 tools/build_cities.py

The CSVs are the working files: forty columns of population figures, sources
and reasoning, most of which the map has no use for. What it draws from is four
things — where the place is, how big it was, whether it was a capital and of
what — so that is all that is carried across. 88 KB of CSV becomes about 40 KB
of JavaScript.

Two files because the answer differs by date: a place can change size tier, and
it can stop or start being a capital. Hsinking is Manchukuo's capital in 1942
and nothing much in 1930; Nanking is China's capital in 1930 and Wang
Ching-wei's in 1942.
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "cities-gaz.js")

EPOCHS = (("e1930", "cities-1930.csv"), ("e1942", "cities-1942.csv"))

# The tiers as the CSV spells them, shortest first so the JS can index by number
TIERS = {"small": 0, "medium": 1, "large": 2, "largest": 3}

# `always`: this place is drawn whatever the zoom, and at the weight named
# here rather than at its size tier. It exists for a set of places the map is
# *about* — the fourteen 府 of colonial Korea are the first — where a reader
# looking at the peninsula should find the same towns at every scale instead of
# watching them appear and vanish as they zoom.
#
# Which weight is decided by the population *on that date*, at two round
# thresholds — 300,000 and 100,000 — chosen where the figures actually fall
# apart rather than at even intervals. In the 1930 census Keijō stands alone at
# 394,240, Pusan and P'yŏngyang make a tight pair at 146,098 and 140,703, and
# then there is a drop to Taegu at 93,319 and a long tail to Kunsan at 26,321.
# By 1940 six of the fourteen are over 100,000 and Keijō is at 935,000, so the
# 1942 map carries more medium dots than the 1930 one. That is the point of
# keeping the two tables apart: the dots grow because the cities did.
#
# The values are the tier numbers so that no new radius is introduced — these
# dots are the same three sizes the rest of the gazetteer draws — and the
# `size_tier` column is left alone, being a coarser statement about the whole
# 480-place table rather than about these fourteen.
ALWAYS = {"small": 0, "medium": 1, "big": 2}
CAPS = {"": 0, "capital-province": 1, "capital-territory": 2}


# The CSV names Chinese provinces in Wade-Giles, which is the period spelling
# and right for a source file. The map has said Pinyin first with tone marks
# everywhere in China since the naming pass, so a capital's line has to match
# the province label it sits next to rather than contradict it.
PINYIN = {
    "Anhwei": "Ānhuī", "Chahar": "Cháhā'ěr", "Chekiang": "Zhèjiāng",
    "Fengtien": "Fèngtiān", "Fukien": "Fújiàn", "Heilungkiang": "Hēilóngjiāng",
    "Honan": "Hénán", "Hopei": "Héběi", "Hunan": "Húnán", "Hupeh": "Húběi",
    "Jehol": "Rèhé", "Kansu": "Gānsù", "Kiangsi": "Jiāngxī",
    "Kiangsu": "Jiāngsū", "Kirin": "Jílín", "Kwangsi": "Guǎngxī",
    "Kwangtung": "Guǎngdōng", "Kweichow": "Guìzhōu", "Liaoning": "Liáoníng",
    "Ningsia": "Níngxià", "Ninghsia": "Níngxià", "Shansi": "Shānxī",
    "Shantung": "Shāndōng", "Shensi": "Shǎnxī", "Sikang": "Xīkāng",
    "Sinkiang": "Xīnjiāng", "Suiyuan": "Suíyuǎn", "Szechwan": "Sìchuān",
    "Tsinghai": "Qīnghǎi", "Yunnan": "Yúnnán", "Tibet": "Xīzàng",
}


def pinyin(name):
    """The province's Pinyin, keeping any parenthetical the CSV adds."""
    base, sep, tail = name.partition(" (")
    hit = PINYIN.get(base.strip())
    if not hit:
        return name
    return hit + (sep + tail if sep else "")


def read(path):
    out = []
    with open(path, newline="") as fh:
        for r in csv.DictReader(fh):
            try:
                lat = float(r["lat"]); lon = float(r["lon"])
            except (TypeError, ValueError):
                continue
            tier = TIERS.get((r.get("size_tier") or "").strip())
            if tier is None:
                continue
            cap = CAPS.get((r.get("capital_variant") or "").strip(), 0)
            rec = {"id": r["id"], "n": (r.get("name_en") or "").strip(),
                   "lat": round(lat, 4), "lon": round(lon, 4),
                   "t": tier, "c": cap}
            keep = (r.get("always") or "").strip()
            if keep:
                if keep not in ALWAYS:
                    raise SystemExit("build_cities: %s says always=%r; it must "
                                     "be one of %s"
                                     % (r["id"], keep, ", ".join(sorted(ALWAYS))))
                rec["a"] = ALWAYS[keep]
            of = pinyin((r.get("capital_of") or "").strip())
            if cap and of:
                rec["of"] = of
            pol = (r.get("polity") or "").strip()
            if pol:
                rec["p"] = pol
            out.append(rec)
    # largest first, so that where two dots overlap the bigger one is drawn
    # first and the smaller sits on top of it rather than being swallowed —
    # by drawn weight, which is what overlaps, and not by the size tier
    out.sort(key=lambda r: (-(r.get("a", r["t"])), r["n"]))
    return out


def main():
    epochs = {}
    for key, name in EPOCHS:
        path = os.path.join(DATA, name)
        if not os.path.exists(path):
            sys.stderr.write("build_cities: %s is missing\n" % path)
            return 1
        epochs[key] = read(path)
        tiers = {}
        caps = {}
        for r in epochs[key]:
            tiers[r["t"]] = tiers.get(r["t"], 0) + 1
            caps[r["c"]] = caps.get(r["c"], 0) + 1
        sys.stderr.write(
            f"{name}: {len(epochs[key])} places, tiers {tiers}, capitals {caps}\n")

    body = ",\n".join(
        '  %s: [\n%s\n  ]' % (k, ",\n".join(
            "    " + json.dumps(r, ensure_ascii=False, separators=(",", ":"))
            for r in v))
        for k, v in epochs.items())
    with open(OUT, "w") as fh:
        fh.write("/* Generated by tools/build_cities.py from data/cities-*.csv.\n"
                 "   Do not edit: change the CSVs and run the tool again.\n\n"
                 "   t: 0 small, 1 medium, 2 large, 3 largest\n"
                 "   a: drawn at this weight at every zoom (see ALWAYS)\n"
                 "   c: 0 not a capital, 1 provincial, 2 of a country or territory */\n"
                 "window.JMAP = window.JMAP || {};\n"
                 "JMAP.GAZ = {\n" + body + "\n};\n")
    sys.stderr.write("wrote %s (%d KB)\n" % (OUT, os.path.getsize(OUT) // 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
