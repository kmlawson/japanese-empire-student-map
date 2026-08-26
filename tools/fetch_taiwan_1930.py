#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Taiwan as Japan administered it in January 1930.

    python3 tools/fetch_taiwan_1930.py

Reads one layer, already in TWD97 / EPSG:3826:

    tools/cache/taiwan_1930.geojson       62 units — 55 郡市 and 7 蕃地 blocks

and writes three files the map build reads:

    tools/cache/taiwan_1930_outline.json    the colony, dissolved
    tools/cache/taiwan_1930_districts.json  the districts, and the 蕃地 as one
    tools/cache/taiwan_1930_shu.json        the eight prefectures

**Why this replaced the 1926 sheet.** That one could not make a complete map.
It left 澎湖廳 out, collapsed the two eastern 廳 and every 蕃地 into a single
unnamed 19,000 km² residual, had no 高雄市 and no 基隆市, and carried schematic
boundaries round Takao — so Okayama-gun and Hōzan-gun were drawn as inland
fragments of themselves. The layer here is reconstructed from the 1920 街(庄)界
sheet, which is complete, with the administrative changes to January 1930
applied. The full account, including the coordinate-reference fault in the
distributed series and the 830 m displacement it causes, is the Taiwan entry in
`texts/pages/sources.md`.

## 蕃地 is one shape here, not seven

Seven of the 62 units are 蕃地 — the "savage districts" in the language of the
administration: the highland spine and the eastern country, which the colonial
state claimed, policed and took camphor out of, but never governed through the
ordinary 街庄 hierarchy that covered the plains.

They are drawn as **one** unit. The seven are an artefact of which prefecture
each piece was filed under, not a fact about the ground: it was one continuous
territory under one regime, and slicing it by prefecture on a teaching map
would be drawing the filing system rather than the country. It is also why the
merged unit has no parent prefecture — pointing at it says what it is, and
outlining whichever 州 happens to own that slice would say something untrue
about how the place was run.

## The prefectures are dissolved from the same units, not taken from a sheet

A 州 or 廳 reaches beyond its 郡 and 市 and into the 蕃地: the administered part
is a rind along the west and the prefecture runs back over the mountains. So a
prefecture is *not* the sum of the districts filed under it — but it is exactly
the sum of its districts **and its 蕃地 block**, and every unit in this layer
carries the prefecture it belonged to. Each of the eight is therefore dissolved
out of its own units by the same edge-cancelling above.

There is a `taiwan_1930_shu.geojson` beside the source with the eight drawn
directly, and it is deliberately not used. It is the **1926** sheet — its
`PERIOD` says 大正十五年七月 where the districts say 昭和五年一月 — and the two
do not agree: its 澎湖廳 has 131 rings and 143 km² against the districts' 18
rings and 128 km², so the outline drawn round Hōko-chō enclosed a dozen islets
that were not drawn on the map at all. Dissolving from the units the map is
made of cannot go wrong that way: the outline and the fill are the same
vertices.

## The dissolve is exact, not approximate

The districts tile the colony: every edge inside is shared by two units and
appears twice, every edge on the coast appears once. Measured on the file as
received — 62,527 distinct undirected edges, 38,434 of them shared and 24,093
unpaired. So the coastline is the unpaired edges chained head to tail, with no
unioning library, no snapping tolerance and no vertex moved.

The chaining is done in the source's own projected coordinates, where shared
vertices are bit-identical; only the result is turned into lon/lat. The other
way round would put a float conversion between two numbers that have to match
exactly.
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
SRC = os.path.join(CACHE, "taiwan_1930.geojson")
OUT_OUTLINE = os.path.join(CACHE, "taiwan_1930_outline.json")
OUT_DISTRICTS = os.path.join(CACHE, "taiwan_1930_districts.json")
OUT_SHU = os.path.join(CACHE, "taiwan_1930_shu.json")

# ---------------------------------------------------------------- projection
# EPSG:3826 — TWD97 / TM2 zone 121. GRS80, central meridian 121°E, scale 0.9999,
# false easting 250 000, latitude of origin 0. TWD97 is within a metre of WGS84,
# which at this map's scale is a hundredth of a pixel, so no datum shift is
# applied here. The shift that *does* matter — the 830 m one — was dealt with
# before the file reached this script; see sources.md.
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
# The readings are the colonial ones and are not guessable from the kanji, so
# every one was checked against the breakdown tables in the 州廳 articles rather
# than read off. 大湖 is Taiko and 大溪 is Daikei, which is the opposite of what
# the voicing rule suggests; 竹山 is Takeyama and not Chikuzan; 新豐 is Niitoyo;
# 文山 is Bunzan, 新莊 Shinshō, 蘇澳 Suō, 北港 Hokukō. 新高 is Niitaka, after
# Niitaka-yama — the name Japan gave Mount Morrison for standing higher than
# Fuji — and 基隆 is Kīrun, the Japanese rendering of Keelung.
#
# 大甲 (Taikō) and 大湖 (Taiko) differ only by a macron, so their keys are
# `TwTaikou` and `TwTaiko`: a key is an identifier and has to survive being
# typed, sorted and put in a URL.
NAMES = {
    # 臺北州 — Taihoku-shū
    "臺北市": ("TwTaihoku", "Taihoku-shi", "Taipei"),
    "基隆市": ("TwKirunShi", "Kīrun-shi", "Keelung"),
    "七星郡": ("TwShichisei", "Shichisei-gun", None),
    "文山郡": ("TwBunzan", "Bunzan-gun", None),
    "海山郡": ("TwKaizan", "Kaizan-gun", None),
    "基隆郡": ("TwKirun", "Kīrun-gun", None),
    "淡水郡": ("TwTansui", "Tansui-gun", "Tamsui"),
    "新莊郡": ("TwShinsho", "Shinshō-gun", "Xinzhuang"),
    "宜蘭郡": ("TwGiran", "Giran-gun", "Yilan"),
    "羅東郡": ("TwRato", "Ratō-gun", "Luodong"),
    "蘇澳郡": ("TwSuo", "Suō-gun", "Su-ao"),
    # 新竹州 — Shinchiku-shū
    "新竹市": ("TwShinchikuShi", "Shinchiku-shi", "Hsinchu"),
    "新竹郡": ("TwShinchiku", "Shinchiku-gun", None),
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
    "嘉義市": ("TwKagiShi", "Kagi-shi", "Chiayi"),
    "新豐郡": ("TwNiitoyo", "Niitoyo-gun", None),
    "新化郡": ("TwShinka", "Shinka-gun", "Xinhua"),
    "曾文郡": ("TwSobun", "Sobun-gun", "Zengwen"),
    "北門郡": ("TwHokumon", "Hokumon-gun", "Beimen"),
    "新營郡": ("TwShinei", "Shin'ei-gun", "Xinying"),
    "嘉義郡": ("TwKagi", "Kagi-gun", None),
    "東石郡": ("TwToseki", "Tōseki-gun", "Dongshi"),
    "北港郡": ("TwHokuko", "Hokukō-gun", "Beigang"),
    "虎尾郡": ("TwKobi", "Kobi-gun", "Huwei"),
    "斗六郡": ("TwToroku", "Toroku-gun", "Douliu"),
    # 高雄州 — Takao-shū
    "高雄市": ("TwTakaoShi", "Takao-shi", "Kaohsiung"),
    "岡山郡": ("TwOkayama", "Okayama-gun", "Gangshan"),
    "鳳山郡": ("TwHozan", "Hōzan-gun", "Fengshan"),
    "旗山郡": ("TwKizan", "Kizan-gun", "Qishan"),
    "屏東郡": ("TwHeito", "Heitō-gun", "Pingtung"),
    "潮州郡": ("TwChoshu", "Chōshū-gun", "Chaozhou"),
    "東港郡": ("TwToko", "Tōkō-gun", "Donggang"),
    "恆春郡": ("TwKoshun", "Kōshun-gun", "Hengchun"),
    # the three 廳, whose administered part carries the 廳's own name
    "臺東廳": ("TwTaito", "Taitō-chō", "Taitung"),
    "花蓮港廳": ("TwKarenko", "Karenkō-chō", "Hualien"),
    "澎湖廳": ("TwHoko", "Hōko-chō", "Penghu"),
}

# The prefecture each district was in: its romanized name for the card, and the
# key of the prefecture's own record, which the map writes onto every district
# as `data-parent`.
SHU = {
    "臺北州": "Taihoku-shū", "新竹州": "Shinchiku-shū", "臺中州": "Taichū-shū",
    "臺南州": "Tainan-shū", "高雄州": "Takao-shū", "臺東廳": "Taitō-chō",
    "花蓮港廳": "Karenkō-chō", "澎湖廳": "Hōko-chō",
}
SHU_KEY = {
    "臺北州": "TwShuTaihoku", "新竹州": "TwShuShinchiku", "臺中州": "TwShuTaichu",
    "臺南州": "TwShuTainan", "高雄州": "TwShuTakao", "臺東廳": "TwShuTaito",
    "花蓮港廳": "TwShuKarenko", "澎湖廳": "TwShuHoko",
}

# The one merged unit. See the note at the head of this file for why it is one.
BANCHI_KEY = "TwBanchi"


def rings_of(geom):
    """Every ring of a Polygon or MultiPolygon, as (outer, [inner...]) polys."""
    polys = ([geom["coordinates"]] if geom["type"] == "Polygon"
             else geom["coordinates"])
    return [[[tuple(c[:2]) for c in ring] for ring in poly] for poly in polys]


def dissolve(features):
    """The outer boundary of a set of polygons that tile without overlapping.

    Every edge two polygons share is walked once in each direction; every edge
    on the outside is walked once. So the boundary is the edges with no
    partner, chained head to tail. Exact — nothing snapped, nothing moved.
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


def ll_poly(poly):
    return [[list(to_wgs84(x, y)) for x, y in ring] for ring in poly]


def main():
    if not os.path.exists(SRC):
        sys.stderr.write("missing %s\n" % SRC)
        return 1
    with open(SRC) as fh:
        feats = json.load(fh)["features"]

    # ---- the colony, dissolved -------------------------------------------
    rings = dissolve(feats)
    rings.sort(key=len, reverse=True)
    ll = [[to_wgs84(x, y) for x, y in r] for r in rings]
    with open(OUT_OUTLINE, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": [{
            "type": "Feature",
            "properties": {"name": "Taiwan, dissolved from the 1930 districts"},
            "geometry": {"type": "MultiPolygon",
                         "coordinates": [[[list(p) for p in r] + [list(r[0])]]
                                         for r in ll]},
        }]}, fh)

    # ---- the districts, and 蕃地 as one ----------------------------------
    by_key = {}
    banchi = {
        "type": "Feature",
        "properties": {"key": BANCHI_KEY, "kanji": "蕃地",
                       "romaji": "Taiwan Indigenous Peoples",
                       "modern": None, "shu": "", "parent": ""},
        "geometry": {"type": "MultiPolygon", "coordinates": []},
    }
    banchi_parts = []
    for feat in feats:
        props = feat["properties"]
        kanji = (props.get("NAME") or "").strip()
        shu_kanji = (props.get("NAMED") or "").strip()
        if kanji.endswith("蕃地"):
            banchi_parts.append(shu_kanji)
            for poly in rings_of(feat["geometry"]):
                banchi["geometry"]["coordinates"].append(ll_poly(poly))
            continue
        if kanji not in NAMES:
            sys.stderr.write("unknown unit %r\n" % kanji)
            return 1
        key, romaji, modern = NAMES[kanji]
        rec = by_key.setdefault(key, {
            "type": "Feature",
            "properties": {"key": key, "kanji": kanji, "romaji": romaji,
                           "modern": modern, "shu": SHU.get(shu_kanji, ""),
                           "parent": SHU_KEY.get(shu_kanji, "")},
            "geometry": {"type": "MultiPolygon", "coordinates": []},
        })
        for poly in rings_of(feat["geometry"]):
            rec["geometry"]["coordinates"].append(ll_poly(poly))

    order = []
    for kanji in NAMES:
        key = NAMES[kanji][0]
        if key in by_key and key not in order:
            order.append(key)
    out = [by_key[k] for k in order]
    if banchi["geometry"]["coordinates"]:
        out.append(banchi)
    with open(OUT_DISTRICTS, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": out}, fh)

    # ---- the eight prefectures, dissolved from their own units -----------
    mine = {}
    for feat in feats:
        shu_kanji = (feat["properties"].get("NAMED") or "").strip()
        if shu_kanji in SHU_KEY:
            mine.setdefault(shu_kanji, []).append(feat)
    shu_out = []
    for kanji in SHU_KEY:
        group = mine.get(kanji)
        if not group:
            sys.stderr.write("no units for prefecture %r\n" % kanji)
            return 1
        rs = dissolve(group)
        rs.sort(key=len, reverse=True)
        shu_out.append({
            "type": "Feature",
            "properties": {"key": SHU_KEY[kanji], "kanji": kanji,
                           "romaji": SHU[kanji]},
            "geometry": {"type": "MultiPolygon",
                         "coordinates": [[[list(to_wgs84(x, y)) for x, y in r]
                                          + [list(to_wgs84(r[0][0], r[0][1]))]]
                                         for r in rs]},
        })
    with open(OUT_SHU, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": shu_out}, fh)

    verts = sum(len(r) for r in ll)
    print("outline: %d rings, %d vertices" % (len(ll), verts))
    print("districts: %d named units, and %d 蕃地 blocks merged into one "
          "(%s)" % (len(by_key), len(banchi_parts), ", ".join(banchi_parts)))
    print("prefectures: %d, dissolved from their own units (%s)"
          % (len(shu_out),
             ", ".join("%s %d rings" % (f["properties"]["romaji"],
                                        len(f["geometry"]["coordinates"]))
                       for f in shu_out)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
