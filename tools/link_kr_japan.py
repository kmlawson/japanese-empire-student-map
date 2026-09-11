"""Put the Korean timetable's Japanese connections onto the Japanese track.

    python3 tools/link_kr_japan.py            # resolve, and write the cache
    python3 tools/link_kr_japan.py --report   # say what the cache holds

Writes tools/cache/kr-japan-stations.json, which tools/build_kr_trains.py reads
to place the stations of the twelve Japan-bound connection lines. Once they are
placed, `rail_route.fill` can walk the Japanese rails between them and the
chords become traced track.

WHAT WAS WRONG WITH THEM.

The 1938 Korean tables carry the Japanese network the boat trains connect to —
the Tōkaidō and San'yō, the Tōhoku, the Kagoshima line and nine more. This map
had no Japanese line geometry when those were transcribed, so the stations were
put at *the city point the map already drew* and the track between them was a
straight chord. That is why they are drawn faint and why their cards say the
alignment is unsourced.

There is a Japanese line layer now, so they can be put on it.

HOW A STATION IS CHOSEN, AND WHY IT IS NOT BY NAME.

Matching a name against 12,800 stations is not enough: 米原 comes back three
times and 尾道 twice, and picking the first would scatter stops across the
country. Two facts narrow it, and they are the ones a timetable actually gives.

* **The line.** A stop on the 山陽本線 is on the 山陽線's own track, so
  candidates further than `NEAR_KM` from that line's geometry are not it. This
  alone settles 74 of the 159 stops.

* **The order, and the distance implied by the clock.** A train does not
  double back: its stops run along the line and the gaps between them are
  roughly the time between them times a speed. So the remaining choice is made
  by taking the set of candidates that gives the *shortest total run* over the
  stop sequence — a Kyōto two hundred kilometres off the route is rejected
  because it makes the journey longer, not because anything knows it is wrong.

  That is a shortest-path problem over the sequence and is solved exactly, by
  dynamic programming over the candidates at each stop rather than by walking
  greedily forward. A greedy walk commits to a cheap early choice and pays for
  it three stops later.

**Then the clock is asked whether the answer is plausible**, which is a check
and not an input: for each consecutive pair whose times are both known, the
distance chosen divided by the time gives a speed, and a pair implying less
than `SLOW_KMH` or more than `FAST_KMH` is refused. A 1938 express did not
average 150 km/h and a train did not take four hours to go ten kilometres;
either says the match is wrong.

**A stop that cannot be settled is left out**, which was asked for explicitly.
It keeps whatever the Korean build already gave it — a city point, drawn as a
chord, exactly as now — so the line still runs and says the same thing about
itself that it says today. Nothing here makes a line worse than it was.
"""
import argparse
import collections
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "deploy")
JP_LINES = os.path.join(ROOT, "data", "jp-rails", "japan-railway-lines-1942.geojson")
CACHE = os.path.join(ROOT, "tools", "cache", "kr-japan-stations.json")

NEAR_KM = 2.0      # a candidate further than this from the line is not on it
SLOW_KMH = 8.0     # slower than this over a whole leg is not a train
FAST_KMH = 130.0   # faster than this is not a train of 1938
DAY = 1440

# The connection lines of the Korean tables that are Japanese railways, and the
# 路線名 of the Japanese layer they run over. The timetable writes 舊字體 and
# names the trunk routes with 本; N05 writes modern forms and mostly without.
# Both are allowed for by `variants` below, but the pairing itself is stated
# here rather than guessed, because a wrong pairing would put a whole line's
# stops on somebody else's track and every check downstream would agree with it.
CONNECTIONS = {
    # **The San'yō main line of 1938 ran inland through Iwakuni.** The 岩徳線
    # was opened in 1934 as a shorter route and carried the 山陽本線's own name
    # until 1944, when the coastal 柳井線 took it back. So a 1938 table's San'yō
    # stops include 周防高森, which is on the Gantoku and on no other line, and
    # without this the timetable's own route is missing from the map.
    "東海道・山陽本線": ["東海道本線", "山陽本線", "岩徳線", "柳井線"],
    "關西線・參宮線": ["關西線", "參宮線"],
    "鹿兒島本線": ["鹿兒島本線"],
    "長崎本線": ["長崎本線"],
    "日豐本線": ["日豐本線"],
    "豐肥本線": ["豐肥本線"],
    "山陰本線": ["山陰本線"],
    "大社線": ["大社線"],
    "宮津線": ["宮津線"],
    "北陸・信越・羽越本線": ["北陸本線", "信越本線", "羽越本線"],
    "關西本線": ["關西本線"],
    "東北本線・常磐線・奧羽本線": ["東北本線", "常磐線", "奧羽本線"],
}

# The ferries are not railways and no track layer will ever hold them.
FERRIES = ["關門連絡船", "青函連絡船", "關釜連絡船", "長項—群山 連絡線"]

OLD2NEW = str.maketrans({
    '兒': '児', '豐': '豊', '關': '関', '奧': '奥', '參': '参', '鐵': '鉄',
    '濱': '浜', '澤': '沢', '驛': '駅', '國': '国', '廣': '広', '壽': '寿',
    '榮': '栄', '靜': '静', '齋': '斎', '萬': '万', '龍': '竜', '會': '会',
    '櫻': '桜', '邊': '辺', '藥': '薬', '醫': '医', '鹽': '塩', '臺': '台',
    '舊': '旧', '圓': '円', '號': '号', '德': '徳', '龜': '亀', '黑': '黒',
    '卷': '巻', '狹': '狭', '嶋': '島', '聲': '声', '彌': '弥',
    # Found by a station that would not match: 橫手 is 横手 and 尻內 is
    # 尻内. Both characters are common in place names and were simply
    # missing from the table.
    '橫': '横', '內': '内', '澁': '渋',
})


# **Stations the timetable names by a name N05 does not carry.**
#
# N05's survey begins in 1950 and records a station under the name it had then,
# so a station renamed between 1938 and 1950 is in the table under its later
# name and matches nothing. These are the ones that came up, each checked by
# hand; the value is the name N05 uses.
#
# Kept short and explicit on purpose. A fuzzy rule — "try dropping 町", "try the
# prefecture prefix" — would match far more and be wrong somewhere nobody would
# look, and a station put on the wrong line is worse than a station left out.
RENAMED = {
    "麻里布": "岩国",      # renamed 岩国 in 1942, the old 岩国 becoming 西岩国
    "宮島": "宮島口",      # renamed 宮島口 in 1942; the ferry pier, not the island
    # Keyed on the name AFTER the character conversion above, which is the
    # order `norm` applies them in: 川內町 is already 川内町 by the time this
    # is consulted, and a key written with the old 內 would never be reached.
    "川内町": "川内",      # the 町 dropped; Sendai in Kagoshima, not the Tōhoku one
}


def norm(s):
    s = (s or "").translate(OLD2NEW)
    return RENAMED.get(s, s)


def variants(p):
    """A line name, and the same name with 本 put in or taken out.

    N05 calls the trunk routes 東北線 and 山陽線 where the timetable calls them
    東北本線 and 山陽本線. Same railway, and the difference is systematic.
    """
    n = norm(p)
    out = {n}
    if n.endswith("本線"):
        out.add(n[:-2] + "線")
    elif n.endswith("線"):
        out.add(n[:-1] + "本線")
    return out


def km(a, b):
    """Kilometres, flat locally. Good to a metre or two at these distances."""
    return math.hypot((a[0] - b[0]) * math.cos(math.radians((a[1] + b[1]) / 2)),
                      a[1] - b[1]) * 111.0


class Grid:
    """Vertices of one line, in a tenth-degree grid, for a nearest-point ask."""

    def __init__(self, verts):
        self.g = collections.defaultdict(list)
        for v in verts:
            self.g[(round(v[0], 1), round(v[1], 1))].append(v)

    def near(self, p):
        best = 1e9
        for dx in (-0.1, 0.0, 0.1):
            for dy in (-0.1, 0.0, 0.1):
                for v in self.g.get((round(p[0] + dx, 1), round(p[1] + dy, 1)), ()):
                    d = km(p, v)
                    if d < best:
                        best = d
        return best


def read_bundle(path, var):
    txt = open(path, encoding="utf-8").read()
    at = txt.index("JMAP." + var + " = ") + len("JMAP." + var + " = ")
    return json.loads(txt[at:].strip().rstrip(";"))


def stop_sequence(times, li, stations):
    """The order this line's stops run in, as the longest train sees them.

    A line's trains do not all call everywhere, so the order is taken from the
    train with the most stops on it — which is the one the printed table is
    built round — and any stop no train of that length reaches is appended in
    the order some other train has it. Down trains only: an up train is the
    same sequence reversed and mixing the two would make nonsense of the order.
    """
    best = []
    for t in times:
        if t["li"] != li or t.get("dir"):
            continue
        seq = [s[0] for s in t["st"] if not ((s[3] if len(s) > 3 else 0) & 1)]
        if len(seq) > len(best):
            best = seq
    if not best:                       # a line with only up trains
        for t in times:
            if t["li"] != li:
                continue
            seq = [s[0] for s in t["st"] if not ((s[3] if len(s) > 3 else 0) & 1)]
            if len(seq) > len(best):
                best = list(reversed(seq))
    seen = set(best)
    for t in times:
        if t["li"] != li:
            continue
        for s in t["st"]:
            if s[0] not in seen:
                seen.add(s[0])
                best.append(s[0])
    return best


def choose(seq, cands):
    """One candidate per stop, minimising the total run.

    Dynamic programming over the sequence: `cost[i][c]` is the shortest total
    distance that reaches stop i having chosen candidate c for it. A stop with
    no candidate at all breaks the chain, so the run restarts after it — which
    is right, since an unplaceable stop should not drag its neighbours out of
    position to reach it.

    Exact, and cheap: the longest of these lines has 23 stops and no stop has
    more than a handful of candidates.
    """
    n = len(seq)
    best = [None] * n
    prev = [None] * n
    for i in range(n):
        cs = cands[i]
        if not cs:
            continue
        if i == 0 or best[i - 1] is None:
            best[i] = [0.0] * len(cs)
            prev[i] = [-1] * len(cs)
            continue
        pcs = cands[i - 1]
        best[i] = []
        prev[i] = []
        for c in cs:
            bd, bj = 1e18, -1
            for j, pc in enumerate(pcs):
                d = best[i - 1][j] + km([pc["lon"], pc["lat"]], [c["lon"], c["lat"]])
                if d < bd:
                    bd, bj = d, j
            best[i].append(bd)
            prev[i].append(bj)
    # walk back from the last stop that has an answer
    out = [None] * n
    i = n - 1
    while i >= 0:
        if best[i] is None:
            i -= 1
            continue
        j = min(range(len(best[i])), key=lambda x: best[i][x])
        while i >= 0 and best[i] is not None:
            out[i] = cands[i][j]
            j = prev[i][j]
            if j < 0:
                i -= 1
                break
            i -= 1
    return out


def check_speeds(seq, chosen, times, li):
    """Does the clock agree with the distances just chosen?

    For every consecutive pair a train actually runs between, with a time at
    both ends, the distance over the time is a speed. A pair implying less than
    SLOW_KMH or more than FAST_KMH is refused — a 1938 express did not average
    150 km/h and no train took four hours to cover ten kilometres, so either
    says the match is wrong. Returns the set of positions to drop and the
    speeds seen, which the report prints.
    """
    pos = {s: i for i, s in enumerate(seq)}
    bad = collections.Counter()
    seen = collections.Counter()
    speeds = []
    for t in times:
        if t["li"] != li:
            continue
        rows = [s for s in t["st"] if not ((s[3] if len(s) > 3 else 0) & 1)]
        for a, b in zip(rows, rows[1:]):
            ia, ib = pos.get(a[0]), pos.get(b[0])
            if ia is None or ib is None:
                continue
            ca, cb = chosen[ia], chosen[ib]
            if not ca or not cb:
                continue
            dep = a[2] if a[2] is not None else a[1]
            arr = b[1] if b[1] is not None else b[2]
            if dep is None or arr is None:
                continue
            dt = (arr - dep) % DAY
            if dt <= 0:
                continue
            d = km([ca["lon"], ca["lat"]], [cb["lon"], cb["lat"]])
            if d < 0.5:
                continue
            v = d / (dt / 60.0)
            speeds.append(v)
            seen[ia] += 1; seen[ib] += 1
            if v < SLOW_KMH or v > FAST_KMH:
                bad[ia] += 1; bad[ib] += 1
    # a stop is dropped when most of the legs it takes part in are implausible
    drop = {i for i in bad if bad[i] * 2 > seen[i]}
    return drop, speeds


def resolve():
    kr = read_bundle(os.path.join(SITE, "kr-trains.js"), "KR_TRAINS")
    times = read_bundle(os.path.join(SITE, "kr-times.js"), "KR_TIMES")
    jps = read_bundle(os.path.join(SITE, "jp-stations.js"), "JP_STATIONS")
    jp = json.load(open(JP_LINES, encoding="utf-8"))

    by_line = collections.defaultdict(list)
    for f in jp["features"]:
        by_line[f["properties"]["路線名"]].append(f)
    by_name = collections.defaultdict(list)
    for s in jps:
        by_name[norm(s["n"])].append(s)

    name_of = {i: l["n"] for i, l in enumerate(kr["lines"])}
    out, stats = {}, collections.Counter()
    report = []

    for li, lname in name_of.items():
        parts = CONNECTIONS.get(lname)
        if not parts:
            continue
        verts = []
        for p in parts:
            vs = variants(p)
            for nm in by_line:
                if norm(nm) in vs:
                    for f in by_line[nm]:
                        verts += f["geometry"]["coordinates"]
        if not verts:
            sys.stderr.write("link_kr_japan: no track for %s\n" % lname)
            continue
        grid = Grid(verts)

        seq = stop_sequence(times, li, kr["stations"])
        cands = []
        for idx in seq:
            st = kr["stations"][idx]
            pool = by_name.get(norm(st.get("n", "")), [])
            near = [c for c in pool if grid.near([c["lon"], c["lat"]]) < NEAR_KM]
            cands.append(near)
        chosen = choose(seq, cands)
        drop, speeds = check_speeds(seq, chosen, times, li)

        placed = 0
        for i, idx in enumerate(seq):
            st = kr["stations"][idx]
            c = chosen[i]
            if i in drop:
                stats["refused by the clock"] += 1
                c = None
            if c is None:
                stats["left out"] += 1
                continue
            moved = (km([st["lon"], st["lat"]], [c["lon"], c["lat"]])
                     if st.get("lon") is not None else None)
            out["%d\t%s" % (li, st.get("n", ""))] = {
                "line": lname, "station": st.get("n", ""),
                "lon": c["lon"], "lat": c["lat"],
                "matched": c["n"], "opened": c.get("y"),
                "candidates": len(cands[i]),
                "moved_km": round(moved, 2) if moved is not None else None,
                "was_placed": st.get("lon") is not None,
            }
            placed += 1
            stats["placed"] += 1
            if cands[i] and len(cands[i]) > 1:
                stats["settled by the run"] += 1
        speeds.sort()
        report.append({
            "line": lname, "stops": len(seq), "placed": placed,
            "median_kmh": round(speeds[len(speeds) // 2], 1) if speeds else None,
        })
    return out, stats, report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()
    out, stats, report = resolve()
    if not args.report:
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with open(CACHE, "w", encoding="utf-8", newline="\n") as f:
            json.dump(out, f, ensure_ascii=False, indent=1, sort_keys=True)
    print("%-26s %5s %6s %9s" % ("line", "stops", "placed", "median"))
    for r in report:
        print("  %-24s %5d %6d %7s km/h"
              % (r["line"][:24], r["stops"], r["placed"],
                 r["median_kmh"] if r["median_kmh"] is not None else "--"))
    print()
    for k in ("placed", "settled by the run", "refused by the clock", "left out"):
        print("  %-22s %d" % (k, stats[k]))
    moved = [r["moved_km"] for r in out.values() if r["moved_km"] is not None]
    if moved:
        moved.sort()
        print("  of the %d that already had a position, it moves by a median of "
              "%.1f km (worst %.1f)" % (len(moved), moved[len(moved) // 2], moved[-1]))
    if not args.report:
        print("\n  wrote %s" % os.path.relpath(CACHE, ROOT))


if __name__ == "__main__":
    main()
