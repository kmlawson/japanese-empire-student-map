"""Japan's railways and their stations, from the 1942 filtering of N05.

    python3 tools/build_jp_rails.py

Writes deploy/jp-rails.js and deploy/jp-stations.js, both fetched on demand —
the lines when the layer is switched on, the stations when the station layer
is, which is the rule every other railway on this map follows.

ONE FILE FOR BOTH DATES.

The source came as four exports, 1930 and 1942 of each. Measured, **every one
of the 1,806 line features in the 1930 export is byte-identical to a feature in
the 1942 export, and so is every one of its 13,416 stations** — 1942 is a
strict superset, 1930 a filtering of it by the same column. So the 1930 files
are redundant and are not read. What the 1930 map draws is decided here, by
`供用開始年`: a line or a station whose service began in 1930 or earlier is on
both maps, one that began between 1931 and 1942 is on the later map only. The
counts come back exactly — 1,806 lines and 13,416 station rows at `"3042"`, which
is the 1930 export's own totals.

WHAT THE LAYER IS, AND IS NOT.

N05 is a record of the railways of Japan **from 1950 onward**, and these were
filtered on the opening year alone. Two consequences, both of which the card
has to admit rather than the build quietly absorb:

* the alignment drawn is the post-1950 survey, not the track as it lay in 1930;
* a line that opened before the date and closed before 1950 is not in the
  source at all, so it is missing here — this is the network that opened by
  the date *and survived to 1950*, which is not the same thing as the network
  of that year.

THE GEOMETRY IS THINNED AT 40 METRES, WHICH WAS ASKED FOR.

The source is survey-grade: 877,918 vertices over 62,168 km, 4.06 MB gzipped,
against 2.65 MB for the whole of the rest of the site. Douglas–Peucker at 40 m
keeps 9.5% of them for 0.31 MB. Forty metres is about one screen pixel at the
deepest zoom a desktop reader can reach and two on a phone, so a sharp curve
can cut its corner by a pixel at maximum magnification and by nothing at all
anywhere else.

CLAUDE.md forbids thinning a traced source without being asked. This was asked
for, on 11 September 2026, from a table of four tolerances with the cost and
the worst-case error of each. **The survival rate is printed on every build**,
which is the other half of that rule.
"""
import collections
import json
import math
import os
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "deploy")
SRC = os.path.join(ROOT, "data", "jp-rails")

LINES_IN = os.path.join(SRC, "japan-railway-lines-1942.geojson")
# Filled by tools/fetch_jp_line_wiki.py; absent on a machine that has not run
# it, in which case the lines simply go out without a romanisation or a link.
WIKI = os.path.join(ROOT, "tools", "cache", "jp-line-wiki.json")
STATIONS_IN = os.path.join(SRC, "japan-railway-stations-1942.geojson")
OUT_LINES = os.path.join(SITE, "jp-rails.js")
OUT_STATIONS = os.path.join(SITE, "jp-stations.js")

TOL_M = 40.0        # asked for; see the module docstring
DP = 5              # decimal places: 1.1 m, well under the tolerance above
EPOCH_SPLIT = 1930  # 1930 or earlier is on both maps; later is on 1942 only


def perp_m(p, a, b):
    """Metres from p to the segment a-b, flat-earth locally.

    A local plate carrée is right here to well under a metre: the longest
    segment considered is a few kilometres and the error of the approximation
    over that is far below the 40 m the result is compared against.
    """
    latm = 111132.0
    lonm = 111320.0 * math.cos(math.radians(p[1]))
    px, py = p[0] * lonm, p[1] * latm
    ax, ay = a[0] * lonm, a[1] * latm
    bx, by = b[0] * lonm, b[1] * latm
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(pts, tol):
    """Douglas–Peucker, iteratively — the recursion is 800,000 points deep.

    Returns (kept, worst) where `worst` is the largest deviation actually
    discarded, so the build can report the error it caused rather than the
    error it allowed.
    """
    if len(pts) < 3:
        return list(pts), 0.0
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    worst = 0.0
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        dmax, idx = 0.0, -1
        for k in range(i + 1, j):
            d = perp_m(pts[k], pts[i], pts[j])
            if d > dmax:
                dmax, idx = d, k
        if dmax > tol:
            keep[idx] = True
            stack.append((i, idx))
            stack.append((idx, j))
        else:
            worst = max(worst, dmax)
    return [p for p, k in zip(pts, keep) if k], worst


def km(pts):
    R = 6371.0
    t = 0.0
    for i in range(1, len(pts)):
        a, b = pts[i - 1], pts[i]
        p1, p2 = math.radians(a[1]), math.radians(b[1])
        dp_, dl = p2 - p1, math.radians(b[0] - a[0])
        h = math.sin(dp_ / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        t += 2 * R * math.asin(min(1.0, math.sqrt(h)))
    return t


def load_wiki():
    """Article and romanisation per (運営会社, 路線名).

    Keyed on the pair because a line name is not unique — 152 of the 936 names
    in this source belong to more than one company. See the docstring of
    tools/fetch_jp_line_wiki.py for why the bare name is not enough.
    """
    if not os.path.exists(WIKI):
        return {}
    return json.load(open(WIKI, encoding="utf-8"))


def wiki_url(rec):
    """The English article where there is one, the Japanese one otherwise.

    Asked for in that order: a reader of this map is reading it in English, so
    the English article is the more use to them, and the Japanese one is what
    there is when no English article exists.
    """
    if not rec:
        return ""
    if rec.get("en"):
        return "https://en.wikipedia.org/wiki/" + quote(rec["en"].replace(" ", "_"))
    if rec.get("ja"):
        return "https://ja.wikipedia.org/wiki/" + quote(rec["ja"].replace(" ", "_"))
    return ""


def build_lines():
    doc = json.load(open(LINES_IN, encoding="utf-8"))
    wiki = load_wiki()
    out = []
    linked = romanised = 0
    vin = vout = 0
    worst = 0.0
    km_in = km_out = 0.0
    for f in doc["features"]:
        c = f["geometry"]["coordinates"]
        p = f["properties"]
        year = int(p["供用開始年"])
        vin += len(c)
        km_in += km(c)
        kept, w = simplify(c, TOL_M)
        worst = max(worst, w)
        vout += len(kept)
        km_out += km(kept)
        flat = []
        for x, y in kept:
            flat.append(round(x, DP))
            flat.append(round(y, DP))
        rec = wiki.get(p["運営会社"] + "\t" + p["路線名"]) or {}
        url = wiki_url(rec)
        ro = rec.get("romaji") or ""
        if url:
            linked += 1
        if ro:
            romanised += 1
        out.append({
            "n": p["路線名"],
            "y": year,
            # Absent rather than empty where nothing was found: the card shows
            # the characters alone and offers no dead link.
            **({"ro": ro} if ro else {}),
            **({"w": url} if url else {}),
            # Which maps it is drawn on, in the string the rest of this map
            # already uses for the question -- "3042" for both, "42" for the
            # later one alone. `stationInEpoch` in map.js reads exactly this,
            # so the stations need no special case and neither do these.
            "e": "3042" if year <= EPOCH_SPLIT else "42",
            "p": flat,
        })
    return out, vin, vout, worst, km_in, km_out, linked, romanised


def build_stations():
    """One record per place, not per line through it.

    The source lists a station once for each line that calls there, so Fukaya
    appears three times at the same coordinate with three 路線名. 16,262 rows
    come to 12,800 distinct (name, position) pairs. The earliest opening year
    wins, which is the year the place got a station — a junction whose second
    line arrived in 1935 was still a station in 1930.
    """
    doc = json.load(open(STATIONS_IN, encoding="utf-8"))
    by = collections.OrderedDict()
    for f in doc["features"]:
        p = f["properties"]
        lon, lat = (round(v, DP) for v in f["geometry"]["coordinates"])
        key = (p["駅名"], lon, lat)
        year = int(p["供用開始年"])
        r = by.get(key)
        if r is None:
            by[key] = {"n": p["駅名"], "y": year,
                       "e": "3042" if year <= EPOCH_SPLIT else "42",
                       "lon": lon, "lat": lat}
        elif year < r["y"]:
            r["y"] = year
            r["e"] = "3042" if year <= EPOCH_SPLIT else "42"
    rows = list(by.values())
    # **An id apiece, because the map keys every record by one.** The marks are
    # drawn with `data-id` and looked up in `byId`, so records without one all
    # collapse onto the key "undefined" -- 12,800 stations overwriting each
    # other until only the last survived, whose epoch then decided whether the
    # whole layer was drawn. It was not: every square was hidden on the 1930
    # map. Same shape as the other three systems' ids (kfs001, tws108).
    for i, r in enumerate(rows, 1):
        r["id"] = "jps%05d" % i
    return rows, len(doc["features"])


def write(path, var, head, payload):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(head)
        f.write("window.JMAP = window.JMAP || {};\n")
        f.write("JMAP.%s = " % var)
        f.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
        f.write(";\n")


def main():
    lines, vin, vout, worst, km_in, km_out, linked, romanised = build_lines()
    e0 = sum(1 for r in lines if r["e"] == "3042")
    head = (
        "/* Built by tools/build_jp_rails.py -- do not edit.\n"
        " * Japan's railways: %d lines, %d of them open by 1930 and %d opened\n"
        " * between 1931 and 1942. Each carries its name, the year service began\n"
        " * and `e`, which is 0 for a line on both maps and 1 for one on the 1942\n"
        " * map only. `p` is a flat run of lon, lat.\n"
        " * Source: N05, the railway dataset of the Kokudo Suuchi Jouhou service,\n"
        " * filtered on the opening year. That record begins in 1950, so the\n"
        " * alignment is the later survey and a line closed before 1950 is not\n"
        " * here at all.\n"
        " * Thinned at %.0f m (Douglas-Peucker), keeping %.1f%% of %d vertices. */\n"
        % (len(lines), e0, len(lines) - e0, TOL_M, 100.0 * vout / vin, vin))
    write(OUT_LINES, "JP_RAILS", head, lines)

    stations, rows_in = build_stations()
    s0 = sum(1 for r in stations if r["e"] == "3042")
    shead = (
        "/* Built by tools/build_jp_rails.py -- do not edit.\n"
        " * Japan's railway stations: %d places, %d of them open by 1930 and %d\n"
        " * opened between 1931 and 1942. The source lists a station once per\n"
        " * line calling there; these are %d such rows reduced to one record per\n"
        " * place, the earliest opening year winning.\n"
        " * Source: N05, as for jp-rails.js. */\n"
        % (len(stations), s0, len(stations) - s0, rows_in))
    write(OUT_STATIONS, "JP_STATIONS", shead, stations)

    kb = lambda p: os.path.getsize(p) / 1024.0
    print("lines      %d features, %d of them on the 1930 map"
          % (len(lines), e0))
    print("           %d vertices in, %d out (%.1f%% kept) -- thinned at %.0f m, "
          "worst deviation actually caused %.1f m"
          % (vin, vout, 100.0 * vout / vin, TOL_M, worst))
    print("           track %.0f km in, %.0f km out (%.2f%% shorter)"
          % (km_in, km_out, 100.0 * (km_in - km_out) / km_in))
    print("wikipedia  %d of %d lines have an article, %d a romanisation"
          % (linked, len(lines), romanised))
    print("stations   %d rows -> %d places, %d of them on the 1930 map"
          % (rows_in, len(stations), s0))
    print("wrote      %s (%.0f KB) + %s (%.0f KB)"
          % (os.path.basename(OUT_LINES), kb(OUT_LINES),
             os.path.basename(OUT_STATIONS), kb(OUT_STATIONS)))


if __name__ == "__main__":
    main()
