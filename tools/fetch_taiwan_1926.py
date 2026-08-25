#!/usr/bin/env python3
"""Taiwan as Japan administered it in July 1926, out of the RCHSS layer.

    python3 tools/fetch_taiwan_1926.py

Reads `tools/cache/taiwan_1926.geojson` — the 郡(市)界 sheet from Academia
Sinica's 《日治時期臺灣行政區域沿革》, reprojected to TWD97 / EPSG:3826 — and
writes two files the map build reads:

    tools/cache/taiwan_1926_outline.json     the island, dissolved
    tools/cache/taiwan_1926_districts.json   the 49 named 郡・市・支廳

**Why this replaces what was there.** Taiwan used to be drawn from Natural
Earth's present-day coastline, with no boundary of any kind inside it — the
Sources page said so and the export script beside this one apologised for it.
This is a period sheet: the coast as the colonial survey had it, and the
divisions the colony was actually run in.

## The dissolve is exact, not approximate

The source is a clean partition: every edge inside the island is shared by
exactly two districts and appears twice, every edge on the coast appears once.
Measured on the file as received — 79,634 directed edges, 31,488 shared pairs,
16,658 unpaired. So the coastline is simply the unpaired edges, chained into
rings, with no unioning library, no snapping tolerance and no vertex moved.

The chaining is done in the source's own projected coordinates, where the
shared vertices are bit-identical, and only the result is turned into lon/lat.
Doing it the other way round would put a float conversion between two numbers
that have to match exactly.

## What is named and what is not

Two features in the sheet carry no name, and between them they are more than
half the island: the central range with the east coast — which in 1926 was
蕃地 together with 花蓮港廳 and 臺東廳, none of which were divided into 郡 —
and a block of the southern coastal plain around Takao whose attribution the
sheet has lost, with Takao, Hōzan and Okayama all inside it while small
fragments labelled 岡山郡 and 鳳山郡 sit inland of them.

Neither is given a name. Both are still *written out*, with an empty key: with
Administrative on, an atom is drawn from its divisions and nothing else, so
leaving them out of this file took half of Taiwan off the map the moment the
layer went on — the island came up as a rind of coastal districts round a hole.
They go in as unnamed blocks, which the build draws in the colony's colour and
leaves unnameable and unoutlineable, so the island is whole and pointing at the
mountains answers "Taiwan".

Naming them would mean either inventing a unit the sheet does not have or
repairing an attribution from guesswork, and this is a map students are marked
on.

## Provenance

《日治時期臺灣行政區域沿革》 <https://data.depositar.io/dataset/rd09-10>,
1926年7月郡(市)界, Academia Sinica RCHSS, CC BY-NC-SA 4.0. Reprojected from
TWD67 to TWD97 (EPSG:3826) before it reached this script; this script does the
TWD97 → WGS84 leg itself, with the standard inverse transverse Mercator, so the
build has no projection dependency to install.
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
SRC = os.path.join(CACHE, "taiwan_1926.geojson")
OUT_OUTLINE = os.path.join(CACHE, "taiwan_1926_outline.json")
OUT_DISTRICTS = os.path.join(CACHE, "taiwan_1926_districts.json")

# ---------------------------------------------------------------- projection
# EPSG:3826 — TWD97 / TM2 zone 121. GRS80, central meridian 121°E, scale 0.9999,
# false easting 250 000, latitude of origin 0. TWD97 is within a metre of WGS84,
# which at this map's scale is a hundredth of a pixel, so no datum shift is
# applied.
_A = 6378137.0
_F = 1.0 / 298.257222101
_E2 = _F * (2 - _F)
_EP2 = _E2 / (1 - _E2)
_K0 = 0.9999
_LON0 = math.radians(121.0)
_FE = 250000.0


def to_wgs84(east, north):
    """One TWD97 easting/northing to (lon, lat) in degrees."""
    x = east - _FE
    m = north / _K0
    mu = m / (_A * (1 - _E2 / 4 - 3 * _E2 * _E2 / 64 - 5 * _E2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - _E2)) / (1 + math.sqrt(1 - _E2))
    phi = (mu
           + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
           + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
           + (151 * e1 ** 3 / 96) * math.sin(6 * mu)
           + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))
    s, c, t = math.sin(phi), math.cos(phi), math.tan(phi)
    c1 = _EP2 * c * c
    t1 = t * t
    n1 = _A / math.sqrt(1 - _E2 * s * s)
    r1 = _A * (1 - _E2) / (1 - _E2 * s * s) ** 1.5
    d = x / (n1 * _K0)
    lat = phi - (n1 * t / r1) * (
        d * d / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * _EP2) * d ** 4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * _EP2 - 3 * c1 * c1)
        * d ** 6 / 720)
    lon = _LON0 + (
        d
        - (1 + 2 * t1 + c1) * d ** 3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * _EP2 + 24 * t1 * t1)
        * d ** 5 / 120) / c
    return (round(math.degrees(lon), 6), round(math.degrees(lat), 6))


# ------------------------------------------------------------------- the names
# Kanji as the sheet writes it -> (key, romanized Japanese, the name today).
#
# The key is what `data-prov` carries and what `texts/territories/sub-units/
# taiwan.csv` is addressed by, so it is ASCII and unique across every sub-unit
# table in the project — `build_texts.py` refuses to build if two collide.
#
# The readings are the colonial ones and are not guessable from the kanji, so
# every one of them was checked against the breakdown tables in the five 州 and
# two 廳 articles rather than read off. Ten of a first pass were wrong that way:
# 大湖 is Taiko and 大溪 is Daikei, which is the opposite of what the voicing
# rule suggests; 竹山 is Takeyama and not Chikuzan; 新豐 is Niitoyo and not
# Shinpō; 文山 is Bunzan, 新莊 Shinshō, 蘇澳 Suō, 北港 Hokukō. 新高 is Niitaka,
# after Niitaka-yama — the name Japan gave Mount Morrison for standing higher
# than Fuji — and 基隆 is Kīrun, the Japanese rendering of Keelung.
#
# 大甲 (Taikō) and 大湖 (Taiko) differ only by a macron, so their keys are
# `TwTaikou` and `TwTaiko`: a key is an identifier and has to survive being
# typed, sorted and put in a URL.
NAMES = {
    # 臺北州 — Taihoku-shū
    "臺北市": ("TwTaihoku", "Taihoku-shi", "Taipei"),
    "七星郡": ("TwShichisei", "Shichisei-gun", None),
    "文山郡": ("TwBunzan", "Bunzan-gun", None),
    "海山郡": ("TwKaizan", "Kaizan-gun", None),
    "基隆郡": ("TwKirun", "Kīrun-gun", "Keelung"),
    "淡水郡": ("TwTansui", "Tansui-gun", "Tamsui"),
    "新莊郡": ("TwShinsho", "Shinshō-gun", "Xinzhuang"),
    "宜蘭郡": ("TwGiran", "Giran-gun", "Yilan"),
    "羅東郡": ("TwRato", "Ratō-gun", "Luodong"),
    "蘇澳郡": ("TwSuo", "Suō-gun", "Su-ao"),
    # 新竹州 — Shinchiku-shū
    "新竹郡": ("TwShinchiku", "Shinchiku-gun", "Hsinchu"),
    "竹東郡": ("TwChikuto", "Chikutō-gun", "Zhudong"),
    "竹南郡": ("TwChikunan", "Chikunan-gun", "Zhunan"),
    "苗栗郡": ("TwByoritsu", "Byōritsu-gun", "Miaoli"),
    "大湖郡": ("TwTaiko", "Taiko-gun", "Dahu"),
    "桃園郡": ("TwToen", "Tōen-gun", "Taoyuan"),
    "中壢郡": ("TwChureki", "Chūreki-gun", "Zhongli"),
    "大溪郡": ("TwDaikei", "Daikei-gun", "Daxi"),
    # 臺中州 — Taichū-shū
    "臺中市": ("TwTaichu", "Taichū-shi", "Taichung"),
    "大屯郡": ("TwDaiton", "Daiton-gun", None),
    "大甲郡": ("TwTaikou", "Taikō-gun", "Dajia"),
    "豐原郡": ("TwToyohara", "Toyohara-gun", "Fengyuan"),
    "東勢郡": ("TwTosei", "Tōsei-gun", "Dongshi"),
    "彰化郡": ("TwShoka", "Shōka-gun", "Changhua"),
    "員林郡": ("TwInrin", "Inrin-gun", "Yuanlin"),
    "北斗郡": ("TwHokuto", "Hokuto-gun", "Beidou"),
    "南投郡": ("TwNanto", "Nantō-gun", "Nantou"),
    "新高郡": ("TwNiitaka", "Niitaka-gun", None),
    "能高郡": ("TwNoko", "Nōkō-gun", "Puli"),
    "竹山郡": ("TwTakeyama", "Takeyama-gun", "Zhushan"),
    # 臺南州 — Tainan-shū
    "臺南市": ("TwTainan", "Tainan-shi", "Tainan"),
    "新豐郡": ("TwNiitoyo", "Niitoyo-gun", None),
    "新化郡": ("TwShinka", "Shinka-gun", "Xinhua"),
    "曾文郡": ("TwSobun", "Sobun-gun", "Zengwen"),
    "北門郡": ("TwHokumon", "Hokumon-gun", "Beimen"),
    "新營郡": ("TwShinei", "Shin'ei-gun", "Xinying"),
    "嘉義郡": ("TwKagi", "Kagi-gun", "Chiayi"),
    "東石郡": ("TwToseki", "Tōseki-gun", "Dongshi"),
    "北港郡": ("TwHokuko", "Hokukō-gun", "Beigang"),
    "虎尾郡": ("TwKobi", "Kobi-gun", "Huwei"),
    "斗六郡": ("TwToroku", "Toroku-gun", "Douliu"),
    # 高雄州 — Takao-shū
    "岡山郡": ("TwOkayama", "Okayama-gun", "Gangshan"),
    "鳳山郡": ("TwHozan", "Hōzan-gun", "Fengshan"),
    "旗山郡": ("TwKizan", "Kizan-gun", "Qishan"),
    "屏東郡": ("TwHeito", "Heitō-gun", "Pingtung"),
    "潮州郡": ("TwChoshu", "Chōshū-gun", "Chaozhou"),
    "東港郡": ("TwToko", "Tōkō-gun", "Donggang"),
    "恆春郡": ("TwKoshun", "Kōshun-gun", "Hengchun"),
    # 臺東廳 — Taitō-chō. Two features, both islands: Kōtōsho (Orchid Island)
    # and Kasho-tō (Green Island). One 支廳, so one entry.
    "臺東支廳": ("TwTaito", "Taitō-shichō", None),
}

# Which 州 or 廳 each one was in, for the card's second line.
SHU = {
    "臺北州": "Taihoku-shū", "新竹州": "Shinchiku-shū", "臺中州": "Taichū-shū",
    "臺南州": "Tainan-shū", "高雄州": "Takao-shū", "臺東廳": "Taitō-chō",
}


def rings_of(geom):
    """Every ring of a Polygon or MultiPolygon, as (outer, [inner...]) polys."""
    polys = ([geom["coordinates"]] if geom["type"] == "Polygon"
             else geom["coordinates"])
    return [[[tuple(c[:2]) for c in ring] for ring in poly] for poly in polys]


def dissolve(features):
    """The outer boundary of a set of polygons that tile without overlapping.

    Every edge that two polygons share is walked once in each direction; every
    edge on the outside is walked once. So the boundary is the edges with no
    partner, chained head to tail. Exact — nothing is snapped and nothing moves.
    """
    seen = {}
    for feat in features:
        for poly in rings_of(feat["geometry"]):
            for ring in poly:
                r = ring[:-1] if ring[0] == ring[-1] else ring
                for i in range(len(r)):
                    a, b = r[i], r[(i + 1) % len(r)]
                    key = (a, b) if a <= b else (b, a)
                    seen[key] = seen.get(key, 0) + 1

    out_edges = {}
    for feat in features:
        for poly in rings_of(feat["geometry"]):
            for ring in poly:
                r = ring[:-1] if ring[0] == ring[-1] else ring
                for i in range(len(r)):
                    a, b = r[i], r[(i + 1) % len(r)]
                    key = (a, b) if a <= b else (b, a)
                    if seen[key] == 1:
                        out_edges.setdefault(a, []).append(b)

    rings, used = [], 0
    total = sum(len(v) for v in out_edges.values())
    while used < total:
        start = None
        for a, bs in out_edges.items():
            if bs:
                start = a
                break
        if start is None:
            break
        ring, here = [start], start
        while True:
            nxt = out_edges.get(here)
            if not nxt:
                break
            step = nxt.pop()
            used += 1
            if step == start:
                break
            ring.append(step)
            here = step
        if len(ring) > 2:
            rings.append(ring)
    return rings


def main():
    if not os.path.exists(SRC):
        sys.stderr.write("missing %s\n" % SRC)
        return 1
    with open(SRC) as fh:
        src = json.load(fh)
    feats = src["features"]

    # ---- the island, dissolved ------------------------------------------
    rings = dissolve(feats)
    rings.sort(key=len, reverse=True)
    ll = [[to_wgs84(x, y) for x, y in r] for r in rings]
    with open(OUT_OUTLINE, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": [{
            "type": "Feature",
            "properties": {"name": "Taiwan, dissolved from the 1926 districts"},
            "geometry": {"type": "MultiPolygon",
                         "coordinates": [[[list(p) for p in r] + [list(r[0])]]
                                         for r in ll]},
        }]}, fh)

    # ---- the districts ---------------------------------------------------
    by_key = {}
    skipped = []
    unnamed = {"type": "Feature",
               "properties": {"key": "", "kanji": "", "romaji": "",
                              "modern": None, "shu": ""},
               "geometry": {"type": "MultiPolygon", "coordinates": []}}
    for feat in feats:
        kanji = feat["properties"].get("NAME")
        if not kanji:
            # the ground the sheet does not divide: drawn, and not named
            skipped.append(feat["properties"]["fid"])
            for poly in rings_of(feat["geometry"]):
                unnamed["geometry"]["coordinates"].append(
                    [[list(to_wgs84(x, y)) for x, y in ring] for ring in poly])
            continue
        if kanji not in NAMES:
            sys.stderr.write("unknown district %r\n" % kanji)
            return 1
        key, romaji, modern = NAMES[kanji]
        shu = SHU.get(feat["properties"].get("NAMEC") or "", "")
        rec = by_key.setdefault(key, {
            "type": "Feature",
            "properties": {"key": key, "kanji": kanji, "romaji": romaji,
                           "modern": modern, "shu": shu},
            "geometry": {"type": "MultiPolygon", "coordinates": []},
        })
        for poly in rings_of(feat["geometry"]):
            rec["geometry"]["coordinates"].append(
                [[list(to_wgs84(x, y)) for x, y in ring] for ring in poly])

    order = []
    for kanji, (key, _r, _m) in NAMES.items():
        if key in by_key and key not in order:
            order.append(key)
    out = [by_key[k] for k in order]
    if unnamed["geometry"]["coordinates"]:
        out.append(unnamed)
    with open(OUT_DISTRICTS, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": out}, fh)

    verts = sum(len(r) for r in ll)
    print("outline: %d rings, %d vertices" % (len(ll), verts))
    print("districts: %d named units from %d features; %d unnamed features "
          "written as one unnameable block (fids %s)"
          % (len(by_key), len(feats) - len(skipped), len(skipped),
             ", ".join(str(f) for f in skipped)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
