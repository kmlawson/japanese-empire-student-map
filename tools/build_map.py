#!/usr/bin/env python3
"""Build japan-empire-map.svg from public-domain / CC-BY vector data.

    python3 tools/build_map.py            # uses the cache in tools/cache/
    python3 tools/build_map.py --download # (re)fetch the source data

Sources
-------
Natural Earth 1:10m admin-0 and admin-1 (public domain) for the world.
ENP-China provincial boundaries for 1928-45 (CC BY 4.0) for everything inside
China. These are real Republican-era provinces — Jehol, Chahar, Suiyuan,
Liaoning, Jilin, Heilongjiang, Xikang — not modern ones reassembled, so the
Manchukuo and Mengchiang outlines are the historical ones.

What this produces
------------------
The SVG holds *atoms*: the smallest regions any historical snapshot needs, each
one path with a stable id "a-<atom>". The territory files in texts/ then
compose atoms into territories separately for each epoch, so Manchuria can be
part of China in 1930 and Manchukuo in 1942 without duplicating geometry.

The one remaining approximation inside China is the area under Japanese control
around 1940, which is drawn as a set of whole provinces and labelled on the map
as approximate: control there ran along the railways and around the cities.
"""

import argparse
import array
import collections
import hashlib
import inspect
import json
import math
import multiprocessing
import os
import re
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)          # so `shapefile` resolves next to this file

import shapefile  # noqa: E402
import gpkg  # noqa: E402

ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache")


# ---------------------------------------------------------------------------
# How fast to go about it
#
# Five optimisations, each switchable, and `--legacy` turns off all five to get
# the build that ran before they existed. None of them is allowed to change the
# output: every one is either an exact reformulation of the same predicate or a
# skip of work that provably cannot affect the answer, and the check is that
# the three SVGs come out byte for byte identical either way.
#
# They are worth having because this build spent 107 seconds of its 133 in one
# place: `point_in_ring`, called 873,000 times from the frontier seams, each
# call a linear scan of a ring averaging about 1,900 vertices.
# ---------------------------------------------------------------------------

class _Opt:
    """Which of the optimisations are on. Set from the command line in main."""
    index = True        # A: bucket ring edges by latitude band
    cache = True        # B: keep the computed seams on disk
    probe_bound = False # C: skip probes too short to reach the target.
                        #    Off by default, and measured rather than assumed:
                        #    with the index in place a probe costs about two
                        #    microseconds instead of a hundred and seventy, so
                        #    the extra nearest-vertex lookup it needs costs more
                        #    than the probes it saves — 0.6s worse over three
                        #    paired runs. It earns its keep only with --no-index.
    jobs = 1            # D: worker processes for the seam search, 1 = in-process
    fast_name = True    # E: index the OSM names instead of testing all pairs

    def flags(self):
        return (self.index, self.cache, self.probe_bound, self.jobs,
                self.fast_name)


OPT = _Opt()

# 1:10m, not 1:50m. The output size is governed by the simplification
# tolerance rather than by the input, so the finer source buys fidelity at
# roughly the same weight — and it narrows the seams where these outlines meet
# the ENP provinces and the Korean ones, which are finer than 1:50m.
SOURCES = {
    "admin0": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
    "rivers": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson",
}

# ENP-China provinces, shipped in tools/cache/enp/ rather than downloaded; see
# SOURCES.md. The 1928-45 sheet covers both epochs this map draws.
ENP_PROVINCES = os.path.join(CACHE, "enp", "1928-45", "1928_1945")
ENP_NAME_FIELD = "p_28_45_na"

# The same provinces from a much finer source, built by tools/roc_provinces.py
# out of a Commons SVG traced from the AMS 1:250,000 sheets. Offered as an
# alternative rather than a replacement: it is six to thirteen times finer on
# the interior boundaries — where ENP's are a median of 9 km from the line they
# stand for, and 27 km on the Shaanxi-Shanxi reach — but it is one contributor's
# tracing rather than a scholarly release, and 1936 rather than 1928-45. The
# reader chooses in the Layers panel; ENP remains the default.
ROC_PROVINCES = os.path.join(CACHE, "roc-provinces-1936.geojson")

# --- Projection -------------------------------------------------------------
LON_MIN, LON_MAX = 66.0, 206.0
LAT_MIN, LAT_MAX = -13.0, 55.0
PX_PER_DEG = 20.0
R = PX_PER_DEG * 180.0 / math.pi


def merc_y(lat):
    lat = max(min(lat, 85.0), -85.0)
    return R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


Y_TOP = merc_y(LAT_MAX)
WIDTH = (LON_MAX - LON_MIN) * PX_PER_DEG
HEIGHT = Y_TOP - merc_y(LAT_MIN)


def project(lon, lat):
    return ((lon - LON_MIN) * PX_PER_DEG, Y_TOP - merc_y(lat))


# ---------------------------------------------------------------------------
# Republican provinces -> atoms. Province outlines come from the ENP-China
# 1928-45 sheet, so Jehol, Chahar and Suiyuan are the historical provinces and
# Manchuria is Liaoning, Jilin and Heilongjiang as they were then — which
# already take in the eastern Inner Mongolian leagues that became Manchukuo's
# Hinggan provinces.
# ---------------------------------------------------------------------------

# Mengchiang was proclaimed over the whole of Suiyuan, but Japanese control
# never reached past Paotow: the west of the province — Wuyuan, Linhe, the
# Ordos — stayed Fu Tso-yi's throughout, and the occupied corridor on this map
# stops at 109.6E. The province is cut here so the client state does not
# swallow several hundred kilometres of free China.
SUIYUAN_CUT = 109.6

# The line of control across Suiyuan, and it is not a meridian any more.
#
# What Mengchiang held in that province was the eastern end of the Hetao and
# the country north of the Yellow River — Kweisui and Paotow, taken in
# February 1938 — while Fu Tso-yi held the irrigated plain west of Paotow, as
# the Wuyuan campaign of 1940 settled. A line of longitude at 109.6 gets that
# much right and then keeps going south, and in doing so hands the eastern
# Ordos banners to Mengchiang: Jungar and Junwang, in the Yekejao league,
# which sits *inside* the river's loop across the whole width of the province
# and which Mengchiang never securely held.
#
# So the cut is two conditions rather than one. Mengchiang's half is east of
# the line **and** north of the Yellow River's east-west reach through the
# Hetao, which runs at about 40.45 N from the Ningsia border to Paotow before
# the river turns south. Everything else — the plain to the west, and the whole
# Ordos south of the river — is Free China's.
#
# Still a generalisation, and still not the NIDS sheets, which would settle it
# properly: see the entry in tasks.md. But it is the river doing the work
# rather than a line of longitude, and it no longer awards ground to a regime
# on the strength of its being east of something.
SUIYUAN_ORDOS_LAT = 40.45

# Natural Earth's outline of the modern Chinese mainland, which used to be laid
# under the Republican provinces twice over: once in the neutral "elsewhere"
# grey, to plug the places where the two sources put a land frontier a kilometre
# or two apart, and once in China's own yellow, to stop that grey showing as a
# fringe along the coast.
#
# Both are off. The two outlines do not agree along the coast either, and
# Natural Earth's is much the coarser of them, so the map drew China's shore
# twice: a rough dark line where the modern outline ran and a fine one, a
# kilometre inside or outside it, where the provinces did. China's edge is the
# provinces and nothing else now — one line, at the full detail of the ENP
# sheet, with the seams between provinces dissolved away.
#
# What this gives up is the plug. Set it back to True to have it again.
NE_CHINA_MAINLAND = False

PROVINCE_ATOM = {
    "Liaoning": "manchuria", "Jilin": "manchuria", "Heilongjiang": "manchuria",
    "Jehol": "jehol",
    "Chahaer": "chahar",
    "Suiyuan": "suiyuan",
    "Xizang": "tibet",
    "Xinjiang": "xinjiang",
}

# The area actually under Japanese control in China, traced from the map
# "China 1900-1949: Japanese Occupation 1940" (US Army-style series, public
# domain, in occupation-maps/) and adjusted to December 1942: Changsha held out
# until 1944; Foochow was held for a fortnight in 1941 and again from late
# 1944; Chengchow was taken in October 1941 and given up again at the end of
# that month, and not held for good until Ichi-Go in April 1944, so it is
# outside the line and so is Loyang, which held until May 1944; the Chekiang
# gains of mid-1942 were mostly evacuated that autumn, leaving Kinhwa and
# Lanchi; Kwangchowwan was not taken until February 1943.
#
# It is not a set of provinces. Japan held the plains, the railways and the
# cities; the western halves of Shansi and Honan, the Communist base areas
# behind the lines, and most of Hunan, Kiangsi and Fukien were never taken. The
# blocks below are clipped to China's land at draw time.
#
# One name per block, in the same order. The zone used to be a single path, so
# the pointer could say nothing about it beyond "Japanese-occupied China" — a
# reader hovering over the ring round Amoy got no hint of what the ring was.
# Each block is drawn as its own sub-path with its name on it now, and because
# these are places rather than administrative divisions the names show whether
# or not the Administrative layer is on.
OCCUPIED_BLOCKS = (
    "North China and the Yangtze valley",
    "The Canton delta",
    "Hainan",
    "Amoy and Kinmen",
    "Swatow and Chaochow",
)

# The occupied zone as traced, in tools/cache. It replaces the hand-drawn
# blocks below, which were six generalised polygons standing in for the whole
# occupation: this is 727 rings and 6,438 vertices, with Hainan, the Canton
# delta, Swatow, Chungming, the Chusan archipelago and seven hundred islets
# drawn separately instead of being swept up in a block or clipped out of one.
# The blocks are kept because two things still read from them: the line of
# control's inland edge across China, and the names of the six regions, which
# the traced rings take by asking which block they fall in.
OCCUPIED_FILE = "japanese-occupied-territory-1941-2-v2.geojson"

OCCUPIED_ZONE = [
    # The northern and central mass, December 1942. West edge down the
    # Tatung-Puchow railway in Shansi, east of the Luliang mountains and the
    # Chin-Sui base area, to the Yellow River bend at Fenglingtu; east along
    # the river's north bank, so Loyang and Chengchow stay outside; then down
    # the 1938 Huayuankou flood course, round the Chinese pocket in north-west
    # Anhui and the Dabie Shan, up the Peking-Hankow railway to Sinyang, out
    # along the 11th Army's front to Ichang, down the Yangtze past Yochow,
    # across northern Kiangsi to the Nanchang lobe, and through Chekiang
    # taking in Kinhwa and Lanchi but not Kuchow, Chuchow or Wenchow.
    [
        (113.3, 40.5), (112.5, 39.0), (111.9, 38.6), (111.6, 38.1), (111.6, 37.6),
        (111.9, 37.1), (111.8, 36.7), (111.5, 36.3), (111.3, 35.9), (110.9, 35.5),
        (110.55, 35.05), (110.32, 34.72), (110.32, 34.58), (110.9, 34.74),
        (111.5, 34.82), (112.2, 34.88), (112.9, 34.92), (113.45, 34.92),
        (114.05, 34.55), (114.5, 34.05), (115.0, 33.6), (115.6, 33.2),
        (116.2, 32.9), (116.7, 32.6), (117.0, 32.1), (116.9, 31.7), (116.5, 31.4),
        (115.9, 31.2), (115.1, 31.15), (114.6, 31.3),
        (114.55, 31.9), (114.5, 32.3), (113.8, 32.25), (113.75, 31.8),
        (113.4, 31.6), (112.6, 31.2), (111.9, 31.05),
        # West to Ichang, which fell in June 1940 and was the head of the
        # occupied Yangtze, and then back east along the river's north bank.
        # The south bank opposite was Chinese all the way to Yochow, and the
        # old line cut straight across the river's loops, putting stretches of
        # both banks on the wrong side of it. These points sit just north of
        # the centreline as the map draws it -- except at Ichang itself, where
        # the zone takes in both banks, the city being on the north bank in
        # fact and a little south of Natural Earth's generalised centreline.
        (111.05, 30.88), (111.22, 30.62), (111.45, 30.50), (111.72, 30.48),
        (111.95, 30.42), (112.15, 30.34), (112.30, 30.28), (112.30, 30.12),
        (112.48, 30.06), (112.50, 29.85), (112.68, 29.90), (112.90, 29.86),
        (113.05, 29.82), (113.10, 29.55),
        (113.1, 29.1),
        (113.35, 28.9), (113.9, 28.85), (114.4, 29.0), (115.0, 29.05),
        (115.4, 28.6), (115.8, 28.15), (116.2, 28.2), (116.6, 28.6), (117.1, 29.1),
        (117.6, 29.6), (118.2, 29.85), (118.8, 29.6), (119.2, 29.35), (119.6, 28.9),
        (120.1, 29.0), (121.9, 29.2),
        # Out to sea from here up to the Gulf of Chihli, for the reason the
        # Bohai stretch is: the clip finds the coast, and a line drawn close in
        # cuts among the offshore islands and holds some and not others with
        # nothing behind the choice. The islands went with the coast they were
        # blockaded from — the Chusan archipelago was taken in 1939–40 and held
        # to the end as the base for the blockade of the Yangtze.
        (122.3, 29.35), (122.6, 29.65), (122.9, 30.05), (123.0, 30.45),
        (123.0, 30.95), (122.9, 31.7), (122.4, 32.5),
        (121.8, 33.5), (121.2, 34.5), (121.0, 35.0), (121.3, 36.1), (122.0, 36.7),
        (122.6, 37.0), (123.3, 37.35), (123.2, 37.9), (121.2, 38.1),
        # Straight across the Gulf of Chihli rather than round its shore. The
        # blocks are clipped to China's land, so the water inside this cut is
        # removed and the coast itself becomes the edge; the old line traced
        # the gulf by hand and cut inside every bulge in it, leaving a strip of
        # unoccupied yellow along the Luanhe delta and the Leting shore. All of
        # this coast was held: Tientsin, the Kailan mines, Tangshan,
        # Chinwangtao and the Peiping–Mukden railway along it. Nothing is
        # claimed for Japan by cutting wide, because Manchuria, Jehol and the
        # Kwantung leasehold on the far side are atoms of their own and are not
        # in China's clip.
        (121.55, 39.20), (121.20, 40.10), (120.30, 40.35),
        (119.0, 40.3), (117.2, 40.7),
        (115.0, 40.7),
    ],
    # the Canton delta and the West River, held from October 1938: the city,
    # the delta, the railway to Kowloon, Waichow, and the river up to Samshui
    [
        (112.65, 22.35), (113.2, 21.85), (113.9, 21.8), (114.5, 22.15),
        (114.6, 22.55), (114.55, 23.1), (113.9, 23.6), (113.15, 23.85),
        (112.85, 23.5), (112.6, 23.0),
    ],
    # Hainan, taken February 1939
    [
        (108.6, 18.2), (109.6, 18.1), (110.6, 18.6), (111.15, 19.5), (111.05, 20.0),
        (110.8, 20.25), (109.9, 20.2), (109.0, 19.8), (108.5, 19.0),
    ],
    # Amoy, taken May 1938, and Kinmen, taken October 1937. Both of these
    # southern ports were four-cornered boxes, and a box is exactly what a
    # beachhead is not: the shading is approximate either way, but a rectangle
    # claims a precision the tracing does not have. They are ellipses of
    # fourteen points, which Chaikin then rounds off properly -- it holds the
    # first and last vertex of an open line still, so a four-point ring came
    # out of it with two corners intact.
    [
        (118.58, 24.48), (118.544, 24.567), (118.444, 24.636), (118.3, 24.675),
        (118.14, 24.675), (117.996, 24.636), (117.896, 24.567), (117.86, 24.48),
        (117.896, 24.393), (117.996, 24.324), (118.14, 24.285), (118.3, 24.285),
        (118.444, 24.324), (118.544, 24.393),
    ],
    # Swatow and Chaochow, taken June 1939
    [
        (116.98, 23.45), (116.944, 23.593), (116.844, 23.708), (116.7, 23.772),
        (116.54, 23.772), (116.396, 23.708), (116.296, 23.593), (116.26, 23.45),
        (116.296, 23.307), (116.396, 23.192), (116.54, 23.128), (116.7, 23.128),
        (116.844, 23.192), (116.944, 23.307),
    ],
]

# The Kwantung Leased Territory: the tip of the Liaodong peninsula, leased by
# Russia in 1898 and won by Japan in 1905. Its northern boundary ran across the
# isthmus from Pulandian bay on the west to Pikou on the east. It stayed a
# separately administered Japanese leasehold until 1945 — it was never absorbed
# into Manchukuo.
#
# It used to be cut out of Liaoning with a line and a bounding box. Half-plane
# clipping is convex-only and Sutherland-Hodgman links the pieces of a concave
# ring along the clip edge, so the leasehold's coast was Liaoning's coast with
# corners taken off it here and there — and Manchuria's own filler showed
# through every one of them as a yellow fleck. It is drawn from the traced
# layer now, like the other leaseholds.
# The water side of Weihaiwei. Everything in this box that the leasehold does
# not cover is sea: the ENP sheet's Shantung coast runs a few hundred metres
# outside the traced leasehold along the whole of its northern shore, and
# showed as a rim of China above it and as an island in its bay.
WEIHAIWEI_SEA_BOX = (121.930, 37.470, 122.330, 37.620)

# Ground that is certainly land and which no source on this map covers. The
# Karakoram is the case that matters: geoBoundaries' India is the modern one
# and stops short of Aksai Chin, the ENP sheet's Sinkiang and Tibet stop at
# their own lines, and between the three of them about a degree and a half of
# the highest country on earth had nothing drawn on it at all — a bay of ocean
# in the middle of the continent, three hundred kilometres across. The seams
# cannot close it: their reach is half a degree, and this is not a crack.
#
# The same box takes in the Pamir and the Sinkiang–Soviet frontier, which is
# the other place the sources leave open ground.
#
# This is the same instrument as `chinabase` and it is used for the same
# reason: painted in the neutral colour under everything, so where the sources
# disagree the gap reads as a seam and not as one country leaking into the
# next — and here, in country nobody administered and two states claimed, the
# neutral answer is also the honest one. Every box must be land from corner to
# corner: this one is checked against Issyk-Kul and Lake Balkhash, which
# Natural Earth's Soviet Union already covers, so nothing that ought to be
# water is being painted over.
LAND_BASE = [
    (70.0, 29.0, 83.0, 45.0),      # Karakoram, Aksai Chin, the Pamir, Dzungaria
    # Where Burma, Assam and China meet, in the eastern Himalaya. The
    # Burma–India line does not quite reach the Chinese border in the sources,
    # and the seams close all but a speck or two of it; this is the ground
    # under the speck. Land from corner to corner: Nagaland and the Patkai in
    # the west, the Yunnan plateau in the east, and no water bigger than a
    # river anywhere between.
    (95.0, 26.0, 99.0, 29.5),
    # The northern Indochina frontier, where Tonkin, Laos, the Shan states and
    # Yunnan meet and four sources have to agree along one line. Eight points
    # in five thousand were open. Land corner to corner: the box stops at
    # 104.5 E, well inland of the Red River delta and its coast.
    (101.0, 21.0, 104.5, 23.5),
]


# Water round the two leaseholds, traced by hand.
#
# Both leaseholds are drawn from their own tracings and the country under them
# is Natural Earth's coarse outline, which at this scale is simply a different
# coastline. Round Kwangchowwan it painted the arms of Guangzhou Bay as land, so
# yellow China showed in the channels *between* the leasehold's six pieces;
# round the Liaodong tip it ran a little outside the traced leasehold along the
# whole coast and showed as a rim. Measured on the 1930 map at a tenth of a
# degree: 175 sample points of Manchuria's filler inside the Kwantung outline,
# 233 of China's inside the Kwangchowwan one.
#
# Everything inside these rings that the leasehold itself does not cover is
# water, and is painted as water — the same instrument as the Weihaiwei fringe
# and the Guangzhou Bay hull below, and for the same reason. The leasehold's own
# rings go into the path as even-odd holes so that nothing paints over them
# whatever the drawing order.
LEASEHOLD_SEA = [
    ("kwantung", [
        (121.17391, 39.46310), (121.28288, 39.46904), (121.35339, 39.49971),
        (121.43799, 39.47696), (121.46114, 39.45393), (121.46272, 39.34758),
        (121.66758, 39.34085), (121.76566, 39.37510), (121.84397, 39.37265),
        (121.88905, 39.39650), (122.40555, 39.38182), (122.96778, 39.31418),
        (123.21454, 39.20222), (123.23939, 38.90792), (121.21703, 38.60267),
        (120.71067, 38.78452), (121.02443, 39.27441),
    ]),
    ("guangzhouwan", [
        (110.65710, 21.21093), (110.51172, 21.33647), (110.37700, 21.32654),
        (110.26167, 21.27326), (110.10369, 21.05544), (110.16378, 20.99392),
        (110.19673, 20.92241), (110.53789, 20.83820), (110.67358, 20.83457),
        (110.70847, 21.05182),
    ]),
]


KWANTUNG_CUT = ((121.20, 39.66), (122.45, 39.28))
KWANTUNG_BOX = (120.55, 38.60, 123.00, 39.80)

# Layers taken from Konrad Lawson's own Modern East Asia GIS project, drawn in
# an azimuthal-equidistant projection centred on Wuhan and converted back to
# lon/lat here. See SOURCES.md.
#
# These are hand-traced shapes and the build does not touch them: no nudging,
# no simplification, no dissolve. Each of those was tried and each of them
# damaged the drawing. Weihaiwei was nudged a hundredth of a degree north to
# close a fringe, which moved a traced boundary off the ground it was traced
# from. Every one of them was being simplified by span, which gave Bhutan — a
# long thin country, 3.4 degrees across — the coarsest band in the build, three
# kilometres, and folded its outline over itself into a hole. And all of them
# were being run through `dissolve`, which cancels shared edges and is meant
# for rings that abut; Kwangchowwan is six separate pieces round a bay and
# Weihaiwei is a headland and three islands, and the dissolve tore both to
# pieces. They are drawn exactly as they arrive.
GIS_NUDGE = {}

# One named vertex moved, and nothing else. Empty, and it should stay that way.
# It held a two-kilometre shift of Weihaiwei's northernmost point, put there to
# close a wedge of China that showed above the top of the leasehold. That wedge
# was not a fault in the traced polygon: it was the projection. See
# `aeqd_to_lonlat` in tools/gpkg.py — the layers are stored in an azimuthal
# grid on the Clarke 1866 ellipsoid and were being inverted as though it were a
# sphere, which put every one of them two to six kilometres out, radially away
# from Wuhan. Fixing the conversion closed the wedge and this shift became an
# error of its own.
GIS_VERTEX_NUDGE = {}

GIS_LAYERS = {
    "tuva": "tunnu_tuva.gpkg",
    "weihaiwei": "weihaiwei_british.gpkg",
    "guangzhouwan": "guangzhouwan.gpkg",
    "sikkim": "sikkim.gpkg",
    "nepal": "nepal.gpkg",
    "bhutan": "bhutan.gpkg",
}

# Sikkim was a British protectorate, not part of British India, and belongs
# with Nepal and Bhutan rather than inside the Raj.
PROTECTORATES_IND = {"Sikkim"}

# Enclaves inside British India that were not the Raj. Puducherry carries all
# four French settlements — Pondicherry, Karikal, Yanaon and Mahe; the modern
# unit that holds Daman, Diu and Dadra was Portuguese in its entirety.
# ---------------------------------------------------------------------------
# Traced from a historical map for this project: British India as it stood in
# 1931, the French and Portuguese establishments one by one, and the two
# protectorates on the Himalayan frontier. They replace what was here before,
# which was modern first-level units standing in for all of it — geoBoundaries'
# India, Pakistan and Bangladesh for the Raj, its Goa and Puducherry units cut
# into settlements by bounding box, and a four-point rectangle for Chandernagore,
# which no modern unit answers to at all.
#
# The India outline carries the establishments as holes where they are inland —
# Damão, Dadrá, Nagar Aveli, Mahé, Chandernagore and the pieces around
# Pondicherry — and leaves out the coastal ones by its own boundary. The holes
# are wound against the outer ring, so they stay holes when the rings are put
# into one path.
INDIA_1931_FILE = "india-1931.geojson"

# The North China Area Army's own security map of the ground it held,
# September 1942: 『北支那方面軍占拠地域内治安概況』, held by NIDS and traced by
# the author of this map. Two of its three categories are polygons — pacified
# (治安地区) and un-pacified (未治安地区); the third, semi-pacified (準治安地区),
# is what the sheet leaves blank, and is left blank here too. It covers north
# China alone, 108-122.6 E and 33-42 N, which is the area that army was
# responsible for, so it is offered as an alternative reading rather than as a
# replacement: with it on, the map shows this and nothing else.
NCA_PACIFIED_FILE = "nca-pacified-1942.geojson"
NCA_UNPACIFIED_FILE = "nca-unpacified-1942.geojson"
NCA_ATOMS = {"nca_pacified": NCA_PACIFIED_FILE,
             "nca_unpacified": NCA_UNPACIFIED_FILE}
FRENCH_INDIA_FILE = "french-india.geojson"
PORTUGUESE_INDIA_FILE = "portuguese-india.geojson"
INDIA_PROTECTORATES_FILE = "india-protectorates.geojson"

# The names the map shows, against the names the tracing carries. English as the
# period used it, with the present-day form after it where they differ, which is
# the rule everywhere else on this map.
TRACED_ENCLAVE_NAMES = {
    "Pondichéry": "Pondicherry (Puducherry)",
    "Karikal": "Karikal (Karaikal)",
    "Yanaon": "Yanaon (Yanam)",
    "Chandernagor": "Chandernagore (Chandannagar)",
    "Mahé": "Mahé (Mahe)",
    "Goa": "Goa",
    "Damão": "Damão (Daman)",
    "Dadrá": "Dadrá (Dadra)",
    "Nagar Aveli": "Nagar Aveli (Nagar Haveli)",
    "Diu": "Diu",
}

_TRACED_CACHE = {}


def load_traced(fname):
    """[(properties, [rings])] out of one of the traced files.

    A part's rings come back together and in order, outer first, so that the
    holes stay holes when they are written into one path.
    """
    if fname in _TRACED_CACHE:
        return _TRACED_CACHE[fname]
    path = os.path.join(CACHE, fname)
    out = []
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    g = feat.get("geometry") or {}
                    polys = (g.get("coordinates") or []) if g.get("type") == "MultiPolygon" \
                        else [g.get("coordinates") or []]
                    rings = []
                    for poly in polys:
                        for ring in poly:
                            if len(ring) >= 3:
                                rings.append([(float(c[0]), float(c[1])) for c in ring])
                    if rings:
                        out.append((feat.get("properties") or {}, rings))
        except (OSError, ValueError):
            sys.stderr.write("note: %s unreadable\n" % fname)
    else:
        sys.stderr.write("note: %s missing; the modern units stand in for it\n"
                         % fname)
    _TRACED_CACHE[fname] = out
    return out


INDIA_ENCLAVES = {
    "Goa": "goa", "Dādra and Nagar Haveli and Damān and Diu": "goa",
    "Puducherry": "pondicherry",
}

# Each of these arrives as one modern unit holding several disjoint enclaves
# hundreds of kilometres apart, and they are the places on the map most worth
# naming one by one -- Mahe on the Malabar coast and Yanaon on the Godavari
# were as French as Pondicherry, and nothing on the map says so unless the
# pointer can tell them apart. Rings are sorted into settlements by where
# their centroid falls.
ENCLAVE_BOXES = [
    ("Goa", (73.60, 14.80, 74.40, 15.85)),
    ("Damão (Daman)", (72.78, 20.32, 72.95, 20.50)),
    ("Diu", (70.80, 20.62, 71.10, 20.80)),
    ("Dadra & Nagar Haveli", (72.90, 19.95, 73.35, 20.35)),
    ("Pondicherry (Puducherry)", (79.70, 11.80, 79.95, 12.10)),
    ("Karikal (Karaikal)", (79.72, 10.82, 79.95, 11.05)),
    ("Yanaon (Yanam)", (82.10, 16.62, 82.35, 16.85)),
    ("Mahé (Mahe)", (75.42, 11.62, 75.62, 11.82)),
]


def enclave_name(ring):
    cx, cy = centroid_of(ring)
    for name, (x0, y0, x1, y1) in ENCLAVE_BOXES:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return name
    return None

# Chandernagore on the Hooghly, French until 1950 and absorbed into West
# Bengal in 1954, so no modern unit answers to it. Drawn by hand.
CHANDERNAGORE = [
    (88.330, 22.833), (88.395, 22.833), (88.400, 22.885), (88.343, 22.885),
]

# The princely states, drawn together in one colour and named one by one.
# Forty polygons of the states as they stood in 1931, supplied for this map;
# see SOURCES.md. They replace what was here before, which was five modern
# Indian states standing in for the biggest of them — Telangana for
# Hyderabad, Karnataka for Mysore — an approximation the About text had to
# apologise for. These are the real outlines.
PRINCELY_FILE = "princely-states-india-1931-v1.2026.8.11.geojson"

# The file names nine of its forty polygons. The other thirty-one are
# identified here by where they are, keyed by the file's own fid. Every polygon
# is in the table, so every point of the layer answers with a state or an
# agency and none falls through to "princely states" alone; where a single
# state cannot be told from the outline the label is the agency it belonged to,
# which the position settles beyond doubt.
PRINCELY_NAMES = {
    1: "Kashmir & Jammu",
    2: "Hyderabad",                     # the file spells it Hyderbad
    3: "Bastar",
    # Savanur (14.97N 75.34E), Sandur (15.09N 76.55E) and Banganapalle
    # (15.31N 78.23E): three small states out on their own between the
    # Bombay Deccan and the Madras districts
    4: "Savanur, Sandur & Banganapalle",
    5: "Savanur, Sandur & Banganapalle",
    6: "Savanur, Sandur & Banganapalle",
    7: "Mysore",
    8: "Travancore & Cochin",
    9: "Pudukkottai",
    10: "Kolhapur & the Deccan States",
    # the rest of the Deccan States Agency and the Southern Maratha jagirs,
    # including Phaltan (12), Bhor (14) and Jawhar (16)
    11: "Kolhapur & the Deccan States",
    12: "Kolhapur & the Deccan States",
    13: "Kolhapur & the Deccan States",
    14: "Kolhapur & the Deccan States",
    15: "Kolhapur & the Deccan States",
    16: "Kolhapur & the Deccan States",
    17: "Cooch Behar",
    18: "The Khasi Hill States",
    19: "Manipur",
    20: "Tripura",
    21: "The Eastern States — Orissa and Chhattisgarh",
    22: "The Eastern States — Orissa and Chhattisgarh",   # Chhattisgarh
    23: "The Eastern States — Orissa and Chhattisgarh",   # feudatory states
    24: "Benares",                      # Chakia, the state's southern pargana
    25: "Benares",
    26: "Rajputana, Central India & the Gujarat States",  # Bundelkhand, in the
    27: "Rajputana, Central India & the Gujarat States",  # Central India Agency
    28: "Rampur",
    29: "Tehri Garhwal",
    # the Punjab Hill States: Bashahr and the eastern Simla states (30),
    # Mandi and Suket (31), Sirmur and the southern Simla states (32)
    30: "The Punjab Hill States — Bashahr, Mandi, Suket, Sirmur",
    31: "The Punjab Hill States — Bashahr, Mandi, Suket, Sirmur",
    32: "The Punjab Hill States — Bashahr, Mandi, Suket, Sirmur",
    33: "The Punjab States — Patiala, Jind, Nabha, Kapurthala",  # Kapurthala
    34: "The Punjab States — Patiala, Jind, Nabha, Kapurthala",  # and Phagwara
    35: "The Punjab States — Patiala, Jind, Nabha, Kapurthala",
    36: "The Baluchistan States — Kalat, Las Bela, Kharan, Makran",
    37: "Khairpur",
    38: "Chitral, Dir, Swat & Amb",
    # not a princely state but the tribal belt the 1931 atlas shades with them:
    # North and South Waziristan and the Gomal, west of Bannu and Dera Ismail
    # Khan, run by political agents rather than by the Punjab
    39: "Waziristan & the frontier tribal agencies",
    40: "Rajputana, Central India & the Gujarat States",
}

# Colonial Korea comes from tools/fetch_korea_1930.py, which builds the
# thirteen provinces and the coast that goes with them. It used to be
# assembled from the modern provinces of the two republics, which cannot be
# made to give the period map however they are grouped: Hwanghae was one
# province until 1954, Ryanggang and Jagang did not exist, and Kaesong was in
# Keiki-do rather than in Hwanghae.
KOREA_FILE = "korea_13_provinces.json"

# The atoms drawn from the ENP-China 1928-45 sheet. It is the authority for
# where China's boundaries were, and it is also a coarse drawing of them:
# Shansi is 96 vertices, Suiyuan 84, Honan 130, where Natural Earth's modern
# China is 11,896 for the mainland ring alone. A source that spare cannot
# afford to be simplified again, and it was: two thirds of its substantive
# rings survived and the rest of the loss was its islands.
ENP_ATOMS = {"china", "manchuria", "chahar", "suiyuan", "suiyuan_w", "jehol",
             "tibet", "xinjiang"}

# Drawn at the full detail of their source rather than simplified. Korea's
# provinces are traced finely enough to be the coastline as well as the
# boundaries, and simplifying them throws that away.
# Kengtung is a long thin salient down to Tachileik, and simplification
# takes the southern half of it off.
# The ENP provinces are here for the reason above: there is nothing to spare.
# The Kwantung leasehold is cut out of Liaoning, so its coast *is* Manchuria's
# coast — but only if the two are drawn alike. Simplified on its own it earned
# a small atom's tolerance while Manchuria kept the full detail of the sheet,
# and the finer coast underneath showed all round the coarser one as a yellow
# fringe: the leasehold looked like a blocky stamp laid on a real peninsula.
# The outer islands are a couple of square kilometres each, which is under the
# tolerance any band would give them; thinned at all they stop being shapes.
# A tolerance stated outright, for shapes traced by hand. The size bands below
# are for survey files with a vertex every few metres, where thinning a large
# country hard costs nothing that can be seen. A tracing is not that: it has the
# vertices somebody chose to put in it, and India's band was moving the drawn
# line a median of 2.3 pixels off the tracing at the deepest zoom and 7 at the
# ninetieth. Half a pixel at that zoom is what the rest of the map is thinned
# to, and 0.021 units is half a pixel. Exact would cost 231 KB against 63 and
# would not be visible at any zoom this map allows.
TRACED_TOL = {"india": 0.021, "nca_pacified": 0.021, "nca_unpacified": 0.021}

FULL_DETAIL = ({"korea", "saharat", "princely", "kwantung", "ccp", "malaya",
                "turtle", "mangsee", "miangas", "cocos",
                "spratly", "paracel", "pratas", "mengjiang", "manchukuo",
                "linephoenix", "uspacific", "nzpacific", "ellice",
                "mandate_jp", "mandate_au", "mandate_br",
                "mandate_ex_guam",
                # traced by hand for this map, and thinned by the size band it
                # earns as a large country the drawn line sat a median of 2.3
                # pixels from the tracing at the deepest zoom and 7 at the
                # ninetieth — against the half a pixel the band is meant to
                # cost. A tracing is not a survey file with a vertex every
                # metre; it has the vertices somebody chose to put in it.
                "goa", "pondicherry"} | ENP_ATOMS
               | set(GIS_LAYERS))

# Atoms whose rings are separate pieces of ground rather than neighbours that
# share edges. `dissolve` cancels the edges two rings have in common, which is
# what makes a country out of its provinces and what makes nonsense out of an
# archipelago: it re-chains the survivors and hands back one ring threading
# through all of them.
# and the eastern Pacific, which is two dozen atolls a thousand kilometres
# apart: dissolved, they come back as one ring threading through all of them
NO_DISSOLVE = ({"kwantung", "ccp", "linephoenix", "uspacific", "nzpacific", "ellice",
                "mandate_jp", "mandate_au", "mandate_br",
                "mandate_ex_guam",
                # traced: an outer ring with holes inside it, which is not a
                # set of rings that share edges and has nothing to dissolve
                "india", "goa", "pondicherry",
                # 64 and 53 separate areas off one sheet; dissolving them would
                # chain the lot into a single ring threading through all of them
                "nca_pacified", "nca_unpacified"}
               | set(GIS_LAYERS))

# Atoms whose backing is the union of their own sub-units rather than Natural
# Earth's outline of the same country. The backing exists to fill the cracks
# that open between sub-units drawn from *different* files; where they all come
# from one file they already share their edges, and a foreign outline
# underneath is a second, coarser drawing of the same coast — which showed as a
# double line whenever the selection was outlined. Korea has been doing this
# from the start, for the same reason.
# Malaya and North Borneo joined it when a reader found Penang drawn twice:
# Natural Earth's coast and geoBoundaries' states disagree, and a third of what
# the filler covered no state did, so the state's own outline fell inside the
# island rather than on its edge and read as a second coastline.
# Indochina joined them when the 1941 cessions turned out to be inside its
# filler: Laos and Cambodia were being laid underneath whole, so the outline of
# French Indochina still enclosed the ground Thailand had been given.
BACKING_FROM_SUBUNITS = {"philippines", "malaya", "northborneo", "indochina"}

# Sub-units that belong together and should light up together. Hovering
# Singapore lit the whole Malay peninsula, which says the wrong thing: the
# Straits Settlements were a Crown colony of four scattered pieces, and the
# states around them were protectorates that were never British soil. Lighting
# the colony rather than the peninsula is the distinction the map is for.
SUB_CLUSTERS = {
    ("malaya", "Singapore"): "Straits Settlements",
    ("malaya", "Penang"): "Straits Settlements",
    ("malaya", "Malacca"): "Straits Settlements",
    ("malaya", "Dindings"): "Straits Settlements",
    ("northborneo", "Labuan"): "Straits Settlements",
    ("christmas", "Christmas Island"): "Straits Settlements",
    # Laos and Cambodia are each drawn in two atoms: the part that stayed
    # French, in `indochina`, and the part ceded to Thailand in 1941, in
    # `siamgain`. On the 1930 map they were one country and hovering one half
    # showed only that half. The 1942 map is the other way round and the
    # ceded provinces leave the cluster there — see JMAP.CLUSTER_EPOCH.
    ("indochina", "Laos"): "Laos",
    ("siamgain", "Laos"): "Laos",
    ("indochina", "Cambodia"): "Cambodia",
    ("siamgain", "Cambodia"): "Cambodia",
}

# Saharat Thai Doem: the Shan states east of the Salween — Kengtung and part
# of Mongpan — occupied and administered by Thai forces from 1942 and formally
# handed to Thailand by Japan in August 1943. Taken district by district rather
# than cut off with a straight line: Kengtung State is the three districts of
# Kengtung, Monghsat and Tachileik exactly, and the trans-Salween part of
# Mongpan is the eastern end of Langkho. See SOURCES.md.
# The Dindings: the coastal strip of Perak around Lumut and Sitiawan with
# Pangkor island, ceded to Britain in 1826 and administered as part of the
# Straits Settlements until it was handed back to Perak on 16 February 1935.
# Drawn as a box until a reader said it looked too wide, and it was: the box is
# 0.33 square degrees and the territory about 0.13. These twelve points are the
# convex hull of the Manjung district of Perak, which is the Dindings district
# renamed in 1982 and has the same footprint; taken from OpenStreetMap's
# admin_level 6 relation, 3,919 points reduced to a hull that loses a
# thousandth of its area. Perak is still clipped to it, so the coastline is
# Perak's own and cannot disagree with itself.
DINDINGS_HULL = [
    (100.5283, 4.2301), (100.5398, 4.1872), (100.7543, 4.0002),
    (100.7767, 3.9961), (100.7979, 4.0073), (100.8120, 4.0225),
    (100.8294, 4.0518), (100.8595, 4.5130), (100.8600, 4.5374),
    (100.8564, 4.5524), (100.6240, 4.5292), (100.5740, 4.4221),
]

SAHARAT_FILE = "adm2_MMR_shan_east.json"
SAHARAT_WHOLE = {"Kengtung", "Monghsat", "Tachileik"}
SAHARAT_PARTIAL = {"Langkho": 98.15}       # district -> the meridian to cut it on

# Burma's divisions and the frontier areas, under their period names.
BURMA_DIVISIONS = {
    "Yangon": "Pegu", "Bago": "Pegu", "Ayeyarwady": "Irrawaddy",
    "Magway": "Magwe", "Mandalay": "MandalayDiv", "Saigang": "Sagaing",
    "Rakhine": "Arakan",
    "Shan": "ShanStates", "Kachin": "KachinHills", "Chin": "ChinHills",
    "Kayah": "Karenni",
    # Tenasserim ran from Toungoo down to Mergui. Thaton and Amherst — now Mon
    # State and most of Kayin — were its heart and held Moulmein, its capital.
    # Only Toungoo cannot be separated out, and stays with Pegu.
    "Tanitharyi": "Tenasserim", "Mon": "Tenasserim", "Kayin": "Tenasserim",
}

# The provinces of British India and the larger princely states, from the
# modern units of India, Pakistan and Bangladesh. Every one of these is an
# approximation: the Raj's provinces were interleaved with several hundred
# princely states whose territory the modern map has long since absorbed, and
# the two 1947 partitions cut Punjab and Bengal in half. Kashmir, Rajputana,
# Assam, Sind, Baluchistan and the North-West Frontier are close; Bombay,
# Madras and the Central Provinces are rough, because the states inside them
# are drawn here as though they were part of them.
# Modern first-level units of India that British India's atom must not draw.
# The Andamans are an atom of their own — British in 1930, Japanese-occupied
# from March 1942 — and India's unnamed remainder block was drawing them too,
# in the Raj's colour, on top of the atom that had them right. That is why they
# kept "going back to British": not a race with the epoch at all, but a second
# copy of them arriving with the administrative divisions. Lakshadweep is here
# because this map does not draw it and the remainder block should not smuggle
# it in either.
# Sikkim is a modern Indian state and was a protectorate under its own
# Chogyal, never a part of British India. It has an atom and a record of
# its own; drawn as an Indian province as well, it put India's own fill and
# India's own outline over it.
INDIA_NOT_DRAWN = {"Andaman and Nicobar Islands", "Lakshadweep", "Sikkim"}

INDIA_STATES = {
    # provinces of the Raj
    "Assam": "Assam", "Meghālaya": "Assam", "Nāgāland": "Assam",
    "Mizoram": "Assam", "Arunāchal Pradesh": "Assam", "Manipur": "Assam",
    "Tripura": "Assam",
    "West Bengal": "Bengal", "Barisal": "Bengal", "Chittagong": "Bengal",
    "Dhaka": "Bengal", "Khulna": "Bengal", "Mymensingh": "Bengal",
    "Rajshani": "Bengal", "Rangpur": "Bengal",
    "Sylhet": "Assam",              # a district of Assam until the 1947 referendum
    "Bihār": "Bihar", "Jhārkhand": "Bihar",
    "Odisha": "Orissa",
    "Uttar Pradesh": "UnitedProvinces", "Uttarākhand": "UnitedProvinces",
    "Punjab": "Punjab", "Haryāna": "Punjab", "Chandīgarh": "Punjab",
    "Himāchal Pradesh": "Punjab", "Islamabad Capital Territory": "Punjab",
    "Delhi": "Delhi",
    "Sindh": "Sind", "Balochistan": "Baluchistan",
    "Khyber Pakhtunkhwa": "NWFP",
    "Madhya Pradesh": "CentralProvinces", "Chhattīsgarh": "CentralProvinces",
    "Mahārāshtra": "Bombay", "Gujarāt": "Bombay",
    "Tamil Nādu": "Madras", "Andhra Pradesh": "Madras", "Lakshadweep": "Madras",
}

# Siam's changwat. The modern country has seventy-seven; in 1942 it had seventy,
# and every difference is a later split, so merging the children back into their
# parents recovers the period set. Under the 1930 map these sat inside the
# monthon, the "circles" abolished in 1933; the changwat themselves ran through
# both dates.
SIAM_SPLITS = {
    "Amnat Charoen": "Ubon Ratchathani", "Yasothon": "Ubon Ratchathani",
    "Kalasin": "Maha Sarakham",     # abolished into it 1932, restored only 1947
    "Mukdahan": "Nakhon Phanom", "Bueng Kan": "Nong Khai",
    "Nong Bua Lam Phu": "Udon Thani", "Phayao": "Chiang Rai",
    "Sa Kaeo": "Prachin Buri", "Bangkok": "Phra Nakhon",
}

# The Netherlands Indies below the level of the whole colony. Java had been
# divided into three provinces since 1926, with Jogjakarta and Surakarta left
# as princely lands under their own rulers; the Outer Possessions were run as
# residencies, gathered from 1938 into three great governments. Surakarta
# cannot be separated from Central Java on modern outlines. The Lesser Sundas,
# the Moluccas and Dutch New Guinea are left as islands, which is more useful
# on a map at this scale than the residencies that covered them.
DEI_RESIDENCIES = {
    "Aceh": "Atjeh",
    "North Sumatra": "SumatraEastCoast", "West Sumatra": "SumatraWestCoast",
    "Riau": "SumatraEastCoast", "Riau Islands": "Riouw", "Jambi": "Djambi",
    "South Sumatra": "Palembang", "Bangka-Belitung Islands": "BankaBilliton",
    "Bengkulu": "Benkoelen", "Lampung": "Lampongs",
    "Banten": "WestJava", "Jakarta Special Capital Region": "WestJava",
    "West Java": "WestJava", "Central Java": "CentralJava",
    "Special Region of Yogyakarta": "Jogjakarta", "East Java": "EastJava",
    "West Kalimantan": "WestBorneo",
    "Central Kalimantan": "SouthEastBorneo", "South Kalimantan": "SouthEastBorneo",
    "East Kalimantan": "SouthEastBorneo", "North Kalimantan": "SouthEastBorneo",
    "North Sulawesi": "Menado", "Gorontalo": "Menado",
    "Central Sulawesi": "Celebes", "West Sulawesi": "Celebes",
    "South Sulawesi": "Celebes", "Southeast Sulawesi": "Celebes",
}

# Vietnam under the French was three: the colony of Cochinchina in the south
# and the protectorates of Annam and Tonkin. These are the lines between them.
TONKIN_CUT = ((103.9, 20.2), (106.6, 19.6))
COCHIN_CUT = ((105.0, 12.4), (109.4, 11.2))

# Papua, an Australian territory, and New Guinea, a League mandate: the
# boundary ran from the Dutch border to the coast near Lae. Taken off the same
# traced 1927 mandate chart the mandate outlines come from, which is where this
# boundary is *drawn* — the two now agree instead of running a degree apart.
#
# It bends, and the bend is the point of it. A straight line between the two
# ends passes 1.0° — a hundred and ten kilometres — south of the traced line at
# the middle vertex, so the chord cannot stand in for it.
#
# The bend also decides how it has to be cut, and `clip_halfplanes` cannot do
# it: the line turns *right* going east, so the ground north of it is concave —
# neither a half-plane nor the intersection of two. Clipping it strip by strip
# and concatenating gets the right area and leaves a real edge down each strip
# boundary, which drew a line straight across New Guinea at the longitude of the
# bend. `clip_to_curve` treats the boundary as the curve it is, and the ring it
# hands back has the traced line for its edge.
PAPUA_CUT_LINE = [
    (140.915448729295292, -5.465505317455851),
    (144.216819619930561, -5.863222230150257),
    (147.141092367045701, -8.110735502353528),
]


def papua_cut_lat(lon):
    """The latitude of the Papua boundary at a longitude.

    Beyond the traced line's two ends it runs flat, at the latitude of the end
    it has reached, rather than carrying the last segment's slope on. Two
    reasons, and the second is the one that matters. It is right: the line met
    the east coast near Morobe and everything beyond that — the tail of the
    Papuan peninsula, the D'Entrecasteaux and the Louisiades — was Papua, while
    the Bismarcks and Bougainville north of it were the mandate, and a flat
    boundary at 8.11 S divides them exactly so. And it keeps the clip honest:
    carried on at its own slope the line dives south-east across the peninsula
    and cuts it a second time, which gives Sutherland-Hodgman two more crossings
    than the shape has sides and it bridges between them — measured, that put
    the boundary as much as 156 km south of where it belongs.
    """
    pts = PAPUA_CUT_LINE
    if lon <= pts[0][0]:
        return pts[0][1]
    if lon >= pts[-1][0]:
        return pts[-1][1]
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        if a[0] <= lon <= b[0]:
            return a[1] + (lon - a[0]) / (b[0] - a[0]) * (b[1] - a[1])
    return pts[-1][1]

# The Yellow River's lower course was cut at Huayuankou in June 1938, when the
# Chinese army breached the dikes to slow the Japanese advance. Until the
# channel was closed again in 1947 the river ran south-east into the Huai
# instead of north-east to the Bohai, so the two maps need different halves of
# it. This is where the generated path is split.
HUAYUANKOU = (113.68, 34.92)

# The rivers used to be thinned at 0.4 units and drawn as they came, which at
# any depth of zoom is a line of hard little corners. They are thinned at half
# that now and then rounded twice by corner-cutting, which softens the joints
# without moving the line: Chaikin puts each new vertex a quarter of the way
# along an existing segment, so nothing strays further from the original course
# than a quarter of a segment — about a tenth of a unit here, a twentieth of a
# pixel at the opening view.
#
# The cost is vertices: halving the tolerance roughly doubles them and each
# rounding pass doubles them again, so the two rivers go from about 1,600
# points to about 13,000. That is one SVG path element either way — the browser
# rasterises it once per zoom change and never touches it while panning — and
# 13,000 points is a fifth of what a single Chinese province carries. There is
# no measurable cost. Set RIVER_SMOOTH to 0 and RIVER_TOLERANCE back to 0.4 for
# exactly what was there before.
RIVER_TOLERANCE = 0.2
RIVER_SMOOTH = 2

# Natural Earth's Yangtze centreline stops at Chinkiang, about 200 km short of
# the sea, which makes the river look as though it ends in a field outside
# Nanking. This carries it down the estuary past Nantung to the mouth. It
# begins exactly where the centreline ends, or the join shows as a gap.
# The Yellow River's old course stops at 119.03 E, a little short of the Gulf
# of Chihli, for the same reason the Yangtze's did: Natural Earth's centreline
# ends before the sea. This carries it out through the delta to the mouth it
# used between 1855 and 1938.
YELLOW_TAIL = [
    (119.035, 37.803), (119.100, 37.788), (119.160, 37.775), (119.225, 37.760),
]

# The estuary is not one channel. Chungming Island splits it, and the river's
# navigable course — the one the gunboats and the Yangtze steamers used, and
# the one the map should draw — is the South Channel, between Chungming and the
# Shanghai shore, out past Woosung. The first version of this tail ran straight
# from Chinkiang to a point in the middle of the estuary, which crossed
# Chungming diagonally and then stopped in open water. These points are the
# measured mid-channel: at 121.5 E, Chungming's south shore is 31.554 and the
# mainland's north shore 31.366, so the river is at 31.46. It carries on past
# Chungming's eastern tip at 121.99 E and out to sea.
YANGZI_TAIL = [
    (119.61, 32.20), (119.90, 32.16), (120.15, 32.00), (120.45, 31.94),
    (120.75, 31.95), (121.00, 31.85), (121.20, 31.68), (121.30, 31.57),
    (121.40, 31.54), (121.50, 31.46), (121.60, 31.43), (121.70, 31.40),
    (121.80, 31.36), (121.90, 31.33),
    # Where it actually stops is decided by `trim_to_land` below, not here: the
    # estuary is drawn as water from somewhere around Kiangyin, and a river
    # drawn down the middle of it is a line over the sea however carefully the
    # channel is traced. These points give it the right course as far as it
    # goes; the trim decides how far that is.
]


def land_test(rings):
    """A closure answering "is this point on land", bbox-checked first."""
    boxed = []
    for r in rings:
        if len(r) < 3:
            continue
        xs = [p[0] for p in r]
        ys = [p[1] for p in r]
        boxed.append((min(xs), min(ys), max(xs), max(ys), r))

    def inside(p):
        px, py = p
        for x0, y0, x1, y1, r in boxed:
            if x0 <= px <= x1 and y0 <= py <= y1 and point_in_ring(p, r):
                return True
        return False
    return inside


def trim_to_land(line, inside, back=0.02):
    """Cut a river where it first leaves the land, and no further.

    A river centreline is a line down the middle of the water. That is right
    all the way inland, where the channel is far too narrow for the map to
    draw, and wrong the moment the map starts drawing the channel itself: from
    about Kiangyin the Yangtze's estuary is open water on this map, so the last
    hundred and fifty kilometres of the centreline is a line ruled across the
    sea, out past Chungming and back over its tip and out again.

    The line is run from whichever end is on land and stopped at the first
    crossing, found by bisection and then pulled back a couple of kilometres so
    that it ends on the shore rather than balanced on it.
    """
    if len(line) < 2:
        return line
    if not inside(line[0]) and inside(line[-1]):
        line = line[::-1]
    if not inside(line[0]):
        return []                      # never touches land: not a river here
    out = [line[0]]
    for a, b in zip(line, line[1:]):
        if inside(b):
            out.append(b)
            continue
        lo, hi = 0.0, 1.0
        for _ in range(30):
            m = (lo + hi) / 2.0
            q = (a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m)
            if inside(q):
                lo = m
            else:
                hi = m
        span = math.hypot(b[0] - a[0], b[1] - a[1]) or 1.0
        m = max(0.0, lo - back / span)
        out.append((a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m))
        break
    return out if len(out) >= 2 else []

# ---------------------------------------------------------------------------
# The greatest extent of Japanese control in late 1942, after the "War in the
# Pacific" map in Andrew Gordon, *A Modern History of Japan*.
#
# Where the limit was a land frontier the line is taken straight off the
# territory outlines, so it sits exactly on the Manchukuo, Burma and Indochina
# borders instead of floating near them. Where it ran over water, or across a
# front rather than a border, it is drawn by hand: the China front, the cut
# across New Guinea north of Port Moresby, and the ocean perimeter.
# ---------------------------------------------------------------------------

# The front in China: a broad, shifting and porous zone, not a border.
# The front in China is the inland edge of the occupied zone itself. The line
# marks where Japanese forces actually were, so it has no business floating
# west of the shading: it is taken straight off OCCUPIED_ZONE's first block,
# smoothed the same way, and the two coincide.
FRONT_START = (112.40, 39.15)     # where the front leaves the Mengjiang border


def china_front():
    """The front, taken off the edge of the shading, to the Chekiang coast.

    It is the inland edge of the occupied zone itself, because the line marks
    where Japanese forces actually were and has no business floating west of
    the ground the map shades as theirs.

    The occupation's mainland ring is one closed outline, part coast and part
    front. Both ends of the stretch wanted are known — where it leaves the
    Mengjiang border in the north-west, and where it hands over to the south
    China coast — and between two points on a closed ring there are exactly two
    arcs. The wanted one is the westerly: the front runs down through Shansi,
    Honan, Hupeh and Kiangsi at about 111 to 114 East, while the other way round
    is the Yellow River mouth, the Gulf of Chihli and the Shantung and Kiangsu
    coast at 118 to 122. Mean longitude tells them apart with a wide margin and
    needs no coastline test.

    Where to stop is found rather than fixed. A fixed index into the traced
    outline is a trap: adding points anywhere upstream of it cuts the front
    short, and the perimeter then closes the shortfall with a straight chord
    across four hundred kilometres of unoccupied China, which is how that bug
    appeared the first time.
    """
    rings = [r for _, r in load_occupied_rings()]
    if not rings:
        blk = OCCUPIED_ZONE[0]          # the hand-drawn blocks, if the file is gone
        head = EXTENT_SOUTH_CHINA[0]
        j = min(range(len(blk)),
                key=lambda i: (blk[i][0] - head[0]) ** 2 + (blk[i][1] - head[1]) ** 2)
        return [FRONT_START] + list(blk[:j + 1])

    ring = max(rings, key=lambda r: abs(signed_ring_area(r)))
    head = EXTENT_SOUTH_CHINA[0]

    def nearest(p):
        return min(range(len(ring)),
                   key=lambda i: (ring[i][0] - p[0]) ** 2 + (ring[i][1] - p[1]) ** 2)

    a, b = nearest(FRONT_START), nearest(head)
    fwd = ring[a:b + 1] if a <= b else ring[a:] + ring[:b + 1]
    back = list(reversed(ring[b:a + 1] if b <= a else ring[b:] + ring[:a + 1]))
    arc = min((fwd, back), key=lambda s: sum(p[0] for p in s) / max(1, len(s)))
    return [FRONT_START] + list(arc)


# The south China coast, from where the occupied zone meets the sea in Chekiang
# down to the Tonkin frontier. Everything seaward of this line is inside it, so
# the line runs just offshore — leaving the unoccupied coast of Fukien and
# Kwangtung outside — and turns inland at each place that was held: Amoy and
# Kinmen, Swatow and Chaochow, the Canton delta, and Kwangchowwan. It then goes
# through the Qiongzhou strait, which leaves the rest of the Leizhou peninsula
# north of it and outside, while Hainan, seaward of the line, falls inside
# without needing to be traced round.
#
# Kwangchowwan is the one place on this coast where the line and the colour
# disagree, and deliberately: the leasehold is drawn in the French colour,
# because that is whose it was, and it is inside the line, because Japanese
# forces were in it. The formal occupation is February 1943, two months after
# this map's date; the arrangement with Vichy that put them there is not.
# The stretches of that line that are meant to be inland, because the place
# they enclose was held: the two ports, the Canton delta, and the detour round
# Kwangchowwan. Everywhere else the line is a coastal line and belongs in the
# water — it was drawn by hand against a coarser coastline than the map now
# draws, so it wandered a few kilometres inland along Fukien and cut across the
# Leizhou peninsula, and a line of control drawn over unoccupied land says
# something about that land which is not true.
EXTENT_KEEP_INLAND = [
    (117.75, 24.20, 118.65, 24.80),     # Amoy and Kinmen
    (116.15, 23.05, 117.05, 23.90),     # Swatow and Chaochow
    (112.45, 22.25, 114.75, 23.95),     # the Canton delta and the West River
    (109.90, 20.80, 110.95, 21.65),     # Kwangchowwan
]

EXTENT_OFFSHORE = 0.085    # degrees; about nine kilometres clear of the shore
EXTENT_OFFSHORE_MAX = 1.2  # degrees; how far out to sea to look for the shore
                           # when pulling a vertex back in
EXTENT_REACH = 0.9         # degrees; how far inland a vertex may be and still
                           # be pulled out to sea rather than left alone


# The blocks of the traced occupation that the perimeter has to bulge inland to
# take in, and the box each of them lives in. The course was hand-drawn round
# these four before the occupation was traced, so the line still ran on ellipses
# while the shading beneath it had the real shapes.
# (block, box, atoms drawn as occupied that the trace does not include). Hong
# Kong is its own atom and its own record — Japan took it in December 1941 —
# so the delta's detour has to reach round it as well as round the traced block.
EXTENT_ENCLAVES = [
    ("Amoy and Kinmen", (117.75, 24.20, 118.65, 24.80), ()),
    ("Swatow and Chaochow", (116.15, 23.05, 117.05, 23.90), ()),
    ("The Canton delta", (112.45, 22.25, 114.75, 23.95), ("hongkong",)),
]


def enclave_detour(line, rings, box, on_land, margin=EXTENT_OFFSHORE,
                   extra=()):
    """Replace the part of `line` inside `box` with an arc round `rings`.

    The perimeter is one generalised line meant to enclose what was held rather
    than to trace it, so the detour is the convex hull of the block grown by the
    same margin the rest of the line keeps off the shore — a bulge round the
    enclave, not a copy of its coastline. `extra` adds rings that are drawn as
    occupied but are not part of the traced block: Hong Kong, in the delta.

    **The arc has to be the landward one.** All the way along this coast the
    perimeter has Free China on its landward side and the sea, which the navy
    had, on the other, so an enclave is enclosed by passing *inland* of it. The
    detour used to take the seaward arc, and the measurement of what that cost
    is worth keeping: Canton, Fatshan, Kongmoon, Amoy, Kinmen, Swatow, Chaochow
    and Chaoyang were every one of them outside the line of control on a map
    that shaded them as occupied. Only Hong Kong, Hainan and Kwangchowwan, which
    are not detours but real frontiers taken off their own outlines, were inside.
    """
    x0, y0, x1, y1 = box
    inside = [k for k, p in enumerate(line) if x0 <= p[0] <= x1 and y0 <= p[1] <= y1]
    if len(inside) < 2 or not rings:
        return line
    a, b = inside[0], inside[-1]
    # Where one ring is the block — the Canton delta is 99.5% of its own — the
    # detour follows that ring's own boundary, grown by the margin, so the line
    # keeps the shape of what was held. A hull round the delta took in a wide
    # crescent of Free China to the west and north that nobody held. Where the
    # block is two or three separate blobs — Amoy and Kinmen, Swatow and
    # Chaochow — no single outline will do and the grown hull is right.
    areas = sorted((ring_area(r), r) for r in rings)
    total = sum(a for a, _ in areas) or 1.0
    biggest, spine_ring = areas[-1]
    if biggest / total >= 0.9 and len(spine_ring) >= 8:
        hull = grow_ring(spine_ring, margin)
    else:
        pts = [p for r in rings for p in r] + [p for r in extra for p in r]
        hull = grow_ring(convex_hull(pts), margin)
    if len(hull) < 3:
        return line

    def nearest(pt):
        return min(range(len(hull)),
                   key=lambda i: (hull[i][0] - pt[0]) ** 2 + (hull[i][1] - pt[1]) ** 2)

    i, j = nearest(line[a]), nearest(line[b])
    fwd = hull[i:j + 1] if i <= j else hull[i:] + hull[:j + 1]
    back = list(reversed(hull[j:i + 1] if j <= i else hull[j:] + hull[:i + 1]))

    def ashore(arc):
        """How much of an arc is over land — sampled, not just its middle,
        because a hull corner can fall in a bay and answer for the whole."""
        if not arc:
            return -1.0
        picks = [arc[k * (len(arc) - 1) // 6] for k in range(7)]
        return sum(1 for p in picks if on_land(p)) / float(len(picks))

    arc = max((fwd, back), key=ashore)
    return line[:a] + list(arc) + line[b + 1:]


def hug_coast(line, on_land, coast=None, keep=EXTENT_KEEP_INLAND,
              margin=EXTENT_OFFSHORE, reach=EXTENT_REACH,
              offshore_max=EXTENT_OFFSHORE_MAX):
    """Push a coastal line off the land it strays onto.

    Each vertex that is on land, and not inside one of the stretches that are
    meant to be inland, is moved along the line's own normal until it is clear
    of the coast and then a little further. Which way is seaward is not asked in
    advance: both are tried and the one that gets off the land in fewer steps
    wins, which is the right answer on a peninsula as well as on a straight
    shore.
    """
    n = len(line)
    if n < 3:
        return line

    def normal(k):
        a = line[max(0, k - 2)]
        b = line[min(n - 1, k + 2)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        h = math.hypot(dx, dy) or 1.0
        return (dy / h, -dx / h)

    # First pass: how far, and which way, each vertex has to move.
    shift = []
    for k, p in enumerate(line):
        if any(x0 <= p[0] <= x1 and y0 <= p[1] <= y1 for x0, y0, x1, y1 in keep):
            shift.append((0.0, 0.0))
            continue
        if not on_land(p):
            # Out at sea. A coastal line belongs just off the shore and not out
            # in the water: the hand-traced course stands a long way off
            # Chekiang, and drawn there it is a curve across the East China Sea
            # with nothing on either side of it. Pull it back in to the same
            # margin the pushed vertices get.
            near = coast and _nearest_in(coast[0], coast[1], p, offshore_max)
            if near:
                dx, dy = p[0] - near[0], p[1] - near[1]
                h = math.hypot(dx, dy)
                if h > margin * 1.5:
                    want = max(margin, h - (h - margin))
                    shift.append(((near[0] + dx / h * want) - p[0],
                                  (near[1] + dy / h * want) - p[1]))
                    continue
            shift.append((0.0, 0.0))
            continue
        nx, ny = normal(k)
        best, bw = (0.0, 0.0), None
        for sign in (1.0, -1.0):
            w = 0.02
            while w <= reach:
                q = (p[0] + sign * nx * w, p[1] + sign * ny * w)
                if not on_land(q):
                    d = (sign * nx * (w + margin), sign * ny * (w + margin))
                    if not on_land((p[0] + d[0], p[1] + d[1])) \
                            and (bw is None or w < bw):
                        best, bw = d, w
                    break
                w += 0.02
        shift.append(best)

    # Smooth the displacement, not the line. Vertex by vertex the push varies —
    # one vertex a hair inland, the next well inland, the next inside a keep
    # box and not pushed at all — and applied raw that comes out as a flight of
    # right-angled steps along the coast, which is what the line was doing at
    # Amoy. Averaging the push over a few vertices moves the whole stretch
    # together and the line keeps its shape.
    n2 = len(shift)
    span = 3
    smooth = []
    for k in range(n2):
        lo = max(0, k - span)
        hi = min(n2, k + span + 1)
        sx = sum(shift[i][0] for i in range(lo, hi)) / (hi - lo)
        sy = sum(shift[i][1] for i in range(lo, hi)) / (hi - lo)
        smooth.append((sx, sy))

    # and a last pass for anything the averaging left on land, pushed on its own
    out = []
    for k, p in enumerate(line):
        q = (p[0] + smooth[k][0], p[1] + smooth[k][1])
        if on_land(q) and not any(x0 <= p[0] <= x1 and y0 <= p[1] <= y1
                                  for x0, y0, x1, y1 in keep):
            nx, ny = normal(k)
            for sign in (1.0, -1.0):
                w = 0.02
                found = False
                while w <= reach:
                    r = (q[0] + sign * nx * w, q[1] + sign * ny * w)
                    if not on_land(r):
                        r = (q[0] + sign * nx * (w + margin),
                             q[1] + sign * ny * (w + margin))
                        if not on_land(r):
                            q, found = r, True
                        break
                    w += 0.02
                if found:
                    break
        out.append(q)
    return out


EXTENT_SOUTH_CHINA = [
    (121.5, 28.8), (121.2, 28.3), (120.7, 27.8), (120.4, 27.2), (120.0, 26.6),
    (119.8, 26.0), (119.5, 25.5), (119.1, 25.0), (118.9, 24.75),
    # round the landward side of the Amoy blob, on an ellipse a little wider
    # than the shading so the line and the fill agree
    (118.584, 24.605), (118.43, 24.697), (118.22, 24.73), (118.01, 24.697),
    (117.856, 24.605), (117.8, 24.48), (117.856, 24.355), (118.01, 24.263),
    (117.4, 23.9),
    # and the same round Swatow and Chaochow
    (116.984, 23.645), (116.83, 23.788), (116.62, 23.84), (116.41, 23.788),
    (116.256, 23.645), (116.2, 23.45), (116.256, 23.255), (116.41, 23.112),
    (116.7, 23.0),
    (115.5, 22.7), (114.8, 22.5),
    (114.6, 22.55), (114.55, 23.1), (113.9, 23.6), (113.15, 23.85),
    (112.85, 23.5), (112.6, 23.0), (112.65, 22.35),
    (111.8, 21.8), (111.20, 21.60),
    # round the landward side of Kwangchowwan — north, west and south of the
    # leasehold — and back to the coast east of it
    (110.78, 21.52), (110.55, 21.47), (110.20, 21.45), (110.02, 21.41),
    (109.98, 21.15), (110.03, 20.94), (110.32, 20.89), (110.62, 20.87),
    # and on through the Qiongzhou strait, south of the peninsula's tip, so
    # that the rest of Leizhou stays outside and Hainan inside
    (110.40, 20.28), (109.6, 20.35),
    (109.4, 21.2), (108.6, 21.5), (108.1, 21.5),
]

# Ocean perimeter, running clockwise from the Bay of Bengal.
EXTENT_OCEAN = [
    (91.6, 20.0), (90.6, 16.0), (90.4, 12.0), (90.6, 8.0), (92.0, 3.5),
    (94.4, 0.0), (97.0, -3.6), (100.6, -6.6), (105.0, -8.6),
    # south round Christmas Island, taken on 31 March 1942 and three hundred
    # and fifty kilometres out from Java. The apex overshoots the island by a
    # little because the smoothing pulls an extreme point back in.
    (105.20, -9.55), (105.40, -10.45), (105.65, -11.10), (105.95, -10.50),
    (106.40, -9.70), (107.6, -9.75),
    (110.0, -10.2),
    (115.0, -11.0), (120.0, -11.4), (125.0, -11.6),
    # north of the Tiwi Islands and the Cobourg peninsula, which are Australian
    (129.0, -11.25), (131.0, -10.85), (132.6, -10.75), (134.0, -10.6),
    (137.0, -9.6),
    # New Guinea, redrawn. The line used to run offshore across the mouth of
    # the Gulf of Papua and along the south coast, which put the whole island
    # inside — Merauke, Daru, the Fly delta, Kerema, Yule Island and the rear
    # of the Kokoda campaign with it. None of that was Japanese. Merauke flew
    # the Dutch flag for the whole war and Merauke Force was raised there on
    # 31 December 1942, this map's own date; the Gulf coast was Australian
    # throughout. What Japan held in New Guinea at the end of 1942 was the
    # north coast and the far west, and in Papua nothing but the beachhead at
    # Buna and Sanananda, which was being reduced as the year ended.
    #
    # Across the Arafura Sea east of the Aru Islands to a landfall on the
    # Asmat coast. Where exactly it comes ashore is arbitrary — neither side
    # was on that coast — but Merauke, the Digul and Frederik Hendrik Island
    # have to end up outside, and they do.
    (135.8, -9.2), (136.8, -7.4), (137.4, -5.8), (137.8, -5.0),
    (138.6, -4.6), (139.6, -4.3), (140.6, -4.4), (141.2, -4.7),
    # along the main divide of the Territory of New Guinea: the north coast was
    # Japanese — Wewak taken on 18 December and Madang in the same week — while
    # the highlands stayed under Australian administration
    (142.2, -5.1), (143.4, -5.4), (144.4, -5.6), (145.4, -5.8),
    # between Salamaua and Mubo, which were held, and Wau and Bulolo, which
    # were not: the Japanese attack on Wau came a month later, in January
    (146.0, -6.3), (146.5, -7.0), (146.9, -7.3),
    # down the northern slope of the Owen Stanleys — Kokoda was retaken on
    # 2 November and Port Moresby never reached — to the Buna-Sanananda
    # beachhead, the only ground left to Japan in Papua at this date. Gona had
    # fallen on 9 December and Buna village on the 14th, but they are ten
    # kilometres from Sanananda and this map cannot draw the difference.
    (147.4, -7.75), (147.9, -8.15), (148.2, -8.40),
    (148.35, -8.70), (148.60, -8.72),
    # and out to sea, leaving Cape Nelson, Wanigela, Oro Bay and Milne Bay
    # outside, and the D'Entrecasteaux, Trobriands and Louisiades with them
    (149.6, -8.2), (150.4, -8.2), (151.1, -8.3), (152.6, -8.6),
    (154.6, -9.6), (156.0, -10.1), (157.2, -9.6),
    # north-west of Malaita, Tulagi and Guadalcanal, none of which Japan held
    # in December; Santa Isabel, New Georgia and Choiseul stay inside. The line
    # has to clear the whole of Santa Isabel -- its south-eastern tail reaches
    # to 8.6 S and the old line cut straight across it -- and then pass north
    # of Ndai, the small island off the top of Malaita, never taken either
    (158.3, -8.85), (159.0, -8.90), (159.6, -8.88), (160.05, -8.60),
    (160.3, -8.15), (160.62, -7.78), (160.95, -7.80), (161.3, -8.05),
    (161.6, -8.3),
    # East of the Santa Cruz group the line crosses open ocean to the date
    # line, and it has to pass *north* of the Ellice Islands, which Japan never
    # reached: the advance stopped at the Gilberts, six hundred miles short, and
    # the Ellice were where the Americans built the airfields they came back
    # through. At (175, -6.4) the line ran at 5.83 S under Nanumea's 5.69 S and
    # took the island inside — measured, and the only one of the eight it
    # caught. Raised to 5.0 S it passes at 4.83 S there, north of the whole
    # group. Nothing held lay between: the southernmost Gilbert, Arorae, is at
    # 2.65 S and stays well inside.
    (163.0, -10.6), (167.0, -9.4), (171.0, -7.0), (175.0, -5.0), (179.0, -4.4),
    (180.8, -1.0),
    # north along the dateline, then west along the Aleutians
    (181.2, 6.0), (181.4, 14.0), (181.4, 22.0), (181.2, 30.0), (180.8, 38.0),
    # south of the Aleutian chain, which stayed American but for Attu and
    # Kiska; those two get loops of their own further down
    (180.2, 45.0), (179.2, 48.6), (176.0, 50.2), (171.0, 50.8), (166.0, 51.4),
    # down the Pacific side of Kamchatka, which was Soviet throughout, and in
    # through the First Kuril Strait: Shumshu and Paramushir are inside the
    # line, Cape Lopatka and Petropavlovsk are outside it
    (160.5, 52.0), (158.3, 51.5), (157.6, 51.15), (157.1, 50.90),
    (156.80, 50.80), (156.62, 50.83), (156.50, 50.92),
    # then west across the Sea of Okhotsk, north of Shumshu and Araito and
    # south of Cape Lopatka, and along the 50th parallel, which is where
    # Karafuto ended and Soviet Sakhalin began
    (156.10, 50.99), (155.50, 51.02), (154.90, 50.95), (154.20, 50.70),
    (152.0, 50.45), (148.0, 50.18), (145.5, 50.03), (144.6, 50.0),
    (141.7, 50.0), (141.35, 49.3),
    # offshore down the Soviet Pacific coast to the Korean corner. Japan held
    # none of the Maritime Province, so the line stays out at sea rather than
    # cutting inland of Sovetskaya Gavan, Nakhodka and Vladivostok
    (141.1, 48.6), (140.6, 47.6), (139.9, 46.6), (139.2, 45.6), (138.2, 44.6),
    (137.0, 43.8), (135.4, 43.2), (133.6, 42.8), (132.2, 42.5), (131.0, 42.3),
    (130.7, 42.4),
]

# Anchors where the hand-drawn pieces hand over to a real frontier.
EXTENT_ARCS = [
    # (atom, from, to, via) — the northern frontier of mainland Southeast Asia.
    # Indochina takes two arcs because it is drawn from two sources that do not
    # weld: the China–Tonkin frontier, then the China–Laos one.
    ("indochina", (108.1, 21.5), (102.12, 22.40), (105.5, 23.4)),
    ("indochina", (102.13, 22.41), (101.2, 21.4), (101.5, 22.2)),
    ("burma", (101.0, 21.3), (92.3, 20.6), (97.5, 27.5)),
]
# The Manchukuo and Mengchiang frontier, taken off the provinces themselves.
# The Manchukuo and Mengchiang frontier, taken off the atoms themselves — and
# Mengchiang is now one of them rather than two Chinese provinces standing in
# for it, so the perimeter follows the traced line instead of a province edge
# and a meridian. It ends at Mengchiang's south-western corner, where the front
# through occupied China picks it up.
# Two arcs, not one, and the reason is worth stating: `dissolve` cancels the
# edges two rings *share*, so rings that merely overlap never merge. Mengchiang
# is traced and its neighbours are the ENP sheet's, so no amount of growing one
# into the other will weld them — the dissolved outline stayed Manchuria's
# alone, its nearest vertex to the hand-over point was 524 km away, and the
# perimeter ran there in a straight line, cutting clean across the client state
# and leaving it outside. They do share one vertex exactly, at 119.595 E
# 46.603 N, which is where the first arc hands over to the second.
# Manchukuo is traced now too, so the first arc comes off its own sheet rather
# than off Manchuria and Jehol dissolved. The two traces do not share a vertex —
# they are different sheets — and the closest their boundaries come near the
# hand-over is 4.8 km, at 119.635 E 46.619 N on Manchukuo's side against
# 119.595 E 46.603 N on Mengchiang's. Each arc ends on its own ring, so the
# perimeter steps that 4.8 km at the tripoint with Mongolia, which is a third of
# a pixel at the opening view and invisible at any zoom short of the deepest.
EXTENT_MANCHURIA = [
    (("manchukuo",), (130.7, 42.4), (119.635, 46.619), (120.0, 51.0)),
    (("mengjiang",), (119.595, 46.603), (112.40, 39.15), (111.60, 44.83)),
]

# Kinmen (Quemoy) sits in Natural Earth's Taiwan polygon because it is governed
# from Taipei today. It was not part of the Japanese colony: it belonged to
# Fujian throughout, and the ENP province data already includes it there. The
# Pescadores, which *were* ceded with Taiwan in 1895, stay put.
KINMEN_BOX = (117.9, 24.2, 118.8, 24.8)

# Territory transferred to Thailand by the Tokyo treaty of 9 May 1941, after
# the Franco-Thai war: the Cambodian provinces of Battambang and Siem Reap
# (renamed Phra Tabong and Phibunsongkhram) and the Lao territory west of the
# Mekong. Handed back in 1946. Angkor itself was left to France; the modern
# provinces below approximate the ceded blocks.
SIAM_1941_KHM = {
    "Battambang", "Bantey Meanchey", "Pailin", "Siem Reap", "Oddar Meanchey",
    "Preah Vihear",
}
SIAM_1941_LAO = {"Xaignabouli"}

# The four northern Malay states, handed to Thailand in October 1943 under the
# same alliance and returned in 1945. In December 1942 they are still under
# Japanese military administration, so the map draws them with Malaya but picks
# them out, with the coming transfer explained in the note.
SIAM_1943_MYS = {"Kedah", "Perlis", "Kelantan", "Terengganu"}

# British Borneo was four separate things before the war — Sarawak under the
# Brooke rajahs, the protected sultanate of Brunei, chartered-company North
# Borneo, and the Crown colony of Labuan — and one thing during the occupation,
# administered together as Kita Boruneo. Drawn as three polygons so the 1930
# map can show that, with Labuan folded into North Borneo.
BORNEO_MYS = {"Sarawak": "sarawak", "Sabah": "northborneo", "Labuan": "northborneo"}

# Peninsular Malaya, state by state, so hovering names the state.
MALAYA_MYS = {
    "Johor": "malaya", "Pahang": "malaya", "Perak": "malaya", "Selangor": "malaya",
    "Negeri Sembilan": "malaya", "Malacca": "malaya", "Penang": "malaya",
    "Kuala Lumpur": "malaya", "Putrajaya": "malaya",
}

# Islands worth naming when the pointer is over them. Matched by the centroid
# of each ring, so an island is named only if it falls squarely in the box.
RING_NAMES = {
    # Sumatra, Java, Borneo and Celebes come from the residencies instead, so
    # their outlines are dropped here ("-") and only the islands the residency
    # map leaves whole are named.
    "dei": [
        ("-", (95.0, -6.2, 106.5, 6.0)), ("-", (105.0, -8.9, 114.7, -5.8)),
        ("-", (112.6, -7.3, 114.2, -6.8)), ("-", (108.8, -4.3, 119.2, 4.4)),
        ("-", (118.7, -6.1, 125.3, 1.9)), ("-", (105.0, -3.3, 106.9, -1.4)),
        ("-", (107.4, -3.4, 108.4, -2.4)), ("-", (97.0, -1.3, 98.1, 1.5)),
        ("Bali", (114.4, -8.9, 115.8, -8.0)), ("Lombok", (115.8, -9.0, 116.8, -8.1)),
        ("Sumbawa", (116.8, -9.2, 119.2, -8.0)), ("Flores", (119.5, -9.0, 123.3, -8.0)),
        ("Sumba", (118.9, -10.4, 120.9, -9.1)), ("WestTimor", (123.5, -10.4, 125.2, -9.0)),
        ("Halmahera", (127.2, -0.9, 129.0, 2.7)), ("Seram", (127.7, -3.5, 131.2, -2.6)),
        ("Buru", (125.9, -3.9, 127.3, -3.0)),
        ("WestNewGuinea", (130.5, -9.2, 141.1, 0.5)),
    ],
    "nanyo": [
        ("Saipan", (145.6, 15.0, 145.9, 15.4)), ("Tinian", (145.5, 14.9, 145.7, 15.1)),
        ("Rota", (145.0, 14.0, 145.4, 14.3)), ("Pagan", (145.6, 18.0, 145.9, 18.2)),
        ("Agrihan", (145.5, 18.6, 145.9, 18.9)), ("Anatahan", (145.5, 16.2, 145.8, 16.5)),
        ("Babeldaob", (134.4, 7.2, 134.8, 7.8)), ("Peleliu", (134.1, 6.9, 134.4, 7.1)),
        ("Angaur", (134.0, 6.8, 134.2, 7.0)),
        ("Weno", (151.7, 7.3, 151.9, 7.5)), ("Kwajalein", (167.2, 8.6, 167.9, 9.5)),
        ("Majuro", (171.0, 7.0, 171.5, 7.2)), ("Jaluit", (169.4, 5.8, 169.8, 6.2)),
        ("Wotje", (169.9, 9.4, 170.3, 9.6)), ("Enewetak", (161.9, 11.3, 162.4, 11.6)),
        ("Bikini", (165.2, 11.5, 165.7, 11.8)), ("Ebon", (168.6, 4.5, 168.9, 4.7)),
        ("Marianas", (144.5, 13.8, 146.5, 20.7)), ("Palau", (130.5, 2.5, 135.2, 8.5)),
        ("Yap", (137.5, 8.9, 138.5, 9.8)), ("Chuuk", (150.8, 6.8, 152.6, 7.9)),
        ("Pohnpei", (157.7, 6.6, 159.0, 7.3)), ("Kosrae", (162.7, 5.1, 163.3, 5.6)),
        ("Marshalls", (165.0, 4.5, 173.0, 15.0)),
    ],
    "sarawak": [("Sarawak", (108.0, -1.0, 116.5, 6.0))],
    "northborneo": [("NorthBorneo", (114.0, 3.0, 120.0, 8.0))],
    "brunei": [("Brunei", (113.5, 3.8, 116.0, 5.5))],
}
# Champasak west of the Mekong went too; the river runs near this meridian.
SIAM_1941_CHAMPASAK_WEST = 105.85


# --- Geometry ---------------------------------------------------------------

def iter_rings(geom):
    t = geom["type"]
    if t == "Polygon":
        for ring in geom["coordinates"]:
            yield [(float(c[0]), float(c[1])) for c in ring]
    elif t == "MultiPolygon":
        for poly in geom["coordinates"]:
            for ring in poly:
                yield [(float(c[0]), float(c[1])) for c in ring]


def normalise_ring(ring):
    """Put a ring into the 0-360 frame, healing antimeridian crossings."""
    xs = [p[0] for p in ring]
    out = list(ring)
    if max(xs) - min(xs) > 180:
        out = [(x + 360 if x < 0 else x, y) for x, y in out]
        xs = [p[0] for p in out]
    if sum(xs) / len(xs) < 0:
        out = [(x + 360, y) for x, y in out]
    return out


def grow_ring(ring, d):
    """The ring pushed outward by `d`, along the normal at each vertex.

    Enough for closing a gap between two drawings of one shore; it is not a
    proper offset and will fold on a spike, which is why it is only ever used
    to fill under something else rather than to draw a boundary.
    """
    n = len(ring)
    if n < 3:
        return list(ring)
    out = []
    ccw = signed_ring_area(ring) > 0
    for i in range(n):
        ax, ay = ring[i - 1]
        bx, by = ring[i]
        cx, cy = ring[(i + 1) % n]
        nx, ny = 0.0, 0.0
        for (px, py), (qx, qy) in (((ax, ay), (bx, by)), ((bx, by), (cx, cy))):
            ex, ey = qx - px, qy - py
            L = math.hypot(ex, ey)
            if L == 0:
                continue
            # outward normal, for the winding this ring actually has
            if ccw:
                nx += ey / L
                ny -= ex / L
            else:
                nx -= ey / L
                ny += ex / L
        L = math.hypot(nx, ny)
        if L == 0:
            out.append((bx, by))
        else:
            out.append((bx + d * nx / L, by + d * ny / L))
    return out


def clip_halfplanes(ring, planes):
    """Sutherland-Hodgman against a set of half-planes (a convex region).

    Each plane is (a, b, c) meaning the point is kept when a*x + b*y + c >= 0.
    """
    poly = ring
    for a, b, c in planes:
        if not poly:
            return []
        def side(p):
            return a * p[0] + b * p[1] + c

        out = []
        n = len(poly)
        for i in range(n):
            p, q = poly[i], poly[(i + 1) % n]
            sp, sq = side(p), side(q)
            if sp >= 0:
                out.append(p)
                if sq < 0:
                    t = sp / (sp - sq)
                    out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
            elif sq >= 0:
                t = sp / (sp - sq)
                out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
        poly = out
    return poly


def quad_planes(poly):
    """Half-planes for a convex polygon given anticlockwise."""
    planes = []
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        planes.append(line_plane(a, b, keep_right=False))
    return planes


def box_planes(x0, y0, x1, y1):
    return [(1, 0, -x0), (-1, 0, x1), (0, 1, -y0), (0, -1, y1)]


def convex_hull(points):
    """The convex hull of a set of points, anticlockwise. Monotone chain."""
    pts = sorted(set(points))
    if len(pts) < 3:
        return list(pts)

    def half(seq):
        out = []
        for p in seq:
            while len(out) >= 2:
                (ax, ay), (bx, by) = out[-2], out[-1]
                if (bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax) > 0:
                    break
                out.pop()
            out.append(p)
        return out

    lower = half(pts)
    upper = half(reversed(pts))
    return lower[:-1] + upper[:-1]


def hull_planes(hull):
    """One half-plane per edge of a convex ring, all keeping the inside.

    Which side `line_plane` keeps depends on the ring's winding, so rather than
    assume one, the centroid is tested against the first edge and every plane
    flipped together if it fell outside."""
    cx = sum(p[0] for p in hull) / len(hull)
    cy = sum(p[1] for p in hull) / len(hull)
    planes = [line_plane(hull[i], hull[(i + 1) % len(hull)])
              for i in range(len(hull))]
    a, b, c = planes[0]
    if a * cx + b * cy + c < 0:
        planes = [(-a, -b, -c) for a, b, c in planes]
    return planes


def line_plane(p, q, keep_right=True):
    """Half-plane bounded by the line p->q, keeping one side."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    a, b = dy, -dx           # normal pointing to the right of p->q
    c = -(a * p[0] + b * p[1])
    return (a, b, c) if keep_right else (-a, -b, -c)


def clip_to_polyline(ring, pts, keep_above, lap=0.0):
    """Clip a ring to one side of a polyline that is monotone in longitude.

    `clip_halfplanes` cannot do this, and neither can Sutherland-Hodgman on its
    own. A half-plane is bounded by a straight line and this boundary bends: the
    Papua line turns right going east, so the ground north of it is concave —
    neither a half-plane nor the intersection of two. Clipping strip by strip and
    concatenating the pieces got the right area and left a real edge down each
    strip boundary, which drew a line straight across New Guinea at the
    longitude of the bend.

    Plain Sutherland-Hodgman gets it wrong a second way, and more quietly. It
    inserts a vertex where an *edge of the ring* crosses the boundary and then
    closes the polygon by joining one crossing to the next — a chord. The
    boundary's own bend is never emitted, so the cut came out as the straight
    line between the two coasts that the traced line exists to replace, bowing
    up to 92 km away from it at the bend. Measured, before and after.

    So the boundary's vertices are spliced in between an exit and the next
    entry, in the direction travelled, and the edge of the ring handed back *is*
    the traced line.

    `lap` pushes the boundary into the other side by that many degrees so the two
    halves overlap rather than abut: cut on the line exactly, each is simplified
    on its own afterwards, the shared edge comes back a hair apart and a line of
    sea opens down the middle of the island.
    """
    if len(ring) < 3 or len(pts) < 2:
        return []
    off = -lap if keep_above else lap
    line = [(p[0], p[1] + off) for p in pts]

    def lat_at(lon):
        if lon <= line[0][0]:
            return line[0][1]
        if lon >= line[-1][0]:
            return line[-1][1]
        for i in range(len(line) - 1):
            a, b = line[i], line[i + 1]
            if a[0] <= lon <= b[0]:
                return a[1] + (lon - a[0]) / (b[0] - a[0]) * (b[1] - a[1])
        return line[-1][1]

    inside = (lambda p: p[1] > lat_at(p[0])) if keep_above \
        else (lambda p: p[1] < lat_at(p[0]))

    def crossing(a, b):
        """Where a->b meets the boundary. The edge is straight and the boundary
        piecewise linear; forty rounds of bisection put it within a millionth of
        a degree, which is a tenth of a metre."""
        lo, hi, ina = 0.0, 1.0, inside(a)
        for _ in range(40):
            mid = (lo + hi) / 2
            p = (a[0] + (b[0] - a[0]) * mid, a[1] + (b[1] - a[1]) * mid)
            if inside(p) == ina:
                lo = mid
            else:
                hi = mid
        t = (lo + hi) / 2
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    # first pass: vertices kept, and the crossings, tagged exit or entry
    out = []
    n = len(ring)
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        ia, ib = inside(a), inside(b)
        if ia:
            out.append((a, None))
        if ia != ib:
            out.append((crossing(a, b), "exit" if ia else "entry"))
    if len(out) < 3:
        return []

    # second pass: between an exit and the next entry, walk the boundary
    res = []
    m = len(out)
    for i in range(m):
        p, tag = out[i]
        res.append(p)
        if tag != "exit":
            continue
        nxt = None
        for j in range(1, m + 1):
            q, qt = out[(i + j) % m]
            if qt == "entry":
                nxt = q
                break
            if qt == "exit":
                break
        if nxt is None:
            continue
        lo, hi = p[0], nxt[0]
        mids = [v for v in line if min(lo, hi) < v[0] < max(lo, hi)]
        if hi < lo:
            mids.reverse()
        res.extend(mids)
    return res if len(res) >= 3 else []


def grow_plane(plane, d):
    """Push a half-plane's boundary out by d degrees.

    Two pieces cut from one shape along the same line ought to meet exactly.
    They do not: each is simplified on its own afterwards, and the shared edge
    comes back a hair apart, which opens a line of sea down the middle of a
    country. Growing both sides makes them overlap instead — invisible, since
    they are the same colour, and there is nothing left to fall through.
    """
    a, b, c = plane
    return (a, b, c + d * math.hypot(a, b))


def point_in_poly(x, y, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inside = not inside
        j = i
    return inside


def ring_centroid(points):
    a = cx = cy = 0.0
    n = len(points)
    for i in range(n):
        x0, y0 = points[i]
        x1, y1 = points[(i + 1) % n]
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if abs(a) < 1e-12:
        return (sum(p[0] for p in points) / n, sum(p[1] for p in points) / n)
    a *= 0.5
    return (cx / (6 * a), cy / (6 * a))


# Sikkim's salient, and the box that holds it and nothing else of India's
# outline. Natural Earth's India is the modern one, so it takes in Sikkim, which
# the Chogyal ruled under British protection and which this map draws as its own
# territory. Painted over, that was invisible; hovered, it was not — the black
# outline of British India ran up the Nepal-Sikkim border, along the crest with
# Tibet and back down to Bhutan, enclosing a state that was never in it.
#
# Above 27.05 N and between 87.95 and 89.0 E, everything Natural Earth calls
# India is Sikkim: Nepal is west, Tibet north, Bhutan east, and Darjeeling, which
# is India's, lies below the box. Measured on the source ring: of its 6,761
# points exactly 106 fall in that box, in one unbroken run, entering at
# 87.99 E 27.08 N and leaving at 88.84 E 27.08 N — the two trijunctions. So the
# salient can be taken out by replacing that run, with no boolean geometry.
SIKKIM_BOX = (87.95, 27.05, 89.00, 28.20)


def cut_out_sikkim(rings, sikkim, box=SIKKIM_BOX):
    """India's rings with the Sikkim salient replaced by Sikkim's own south border.

    The run of India's ring that lies inside `box` is the detour round Sikkim.
    It is replaced by the arc of Sikkim's own ring between the same two ends —
    its southern side — so that the two shapes share that boundary exactly and no
    crack can open along it. The alternative, a straight chord, would have left
    India's line a few kilometres off the border it stands for.
    """
    if not sikkim:
        return rings, 0
    x0, y0, x1, y1 = box
    sik = max(sikkim, key=len)

    def inbox(p):
        return x0 <= p[0] <= x1 and y0 <= p[1] <= y1

    out, cut = [], 0
    for ring in rings:
        idx = [k for k, p in enumerate(ring) if inbox(p)]
        if not idx or len(idx) == len(ring):
            out.append(ring)
            continue
        # the run, allowing for one that straddles the ring's first vertex
        runs, cur = [], [idx[0]]
        for a, b in zip(idx, idx[1:]):
            if b == a + 1:
                cur.append(b)
            else:
                runs.append(cur)
                cur = [b]
        runs.append(cur)
        if len(runs) > 1 and runs[0][0] == 0 and runs[-1][-1] == len(ring) - 1:
            runs = [runs[-1] + runs[0]] + runs[1:-1]
        if len(runs) != 1:
            sys.stderr.write("note: Sikkim's box holds %d runs of India's ring, "
                             "left alone\n" % len(runs))
            out.append(ring)
            continue
        run = runs[0]
        a, b = ring[run[0]], ring[run[-1]]

        def nearest(pt):
            return min(range(len(sik)),
                       key=lambda i: (sik[i][0] - pt[0]) ** 2 + (sik[i][1] - pt[1]) ** 2)

        i, j = nearest(a), nearest(b)
        fwd = sik[i:j + 1] if i <= j else sik[i:] + sik[:j + 1]
        back = list(reversed(sik[j:i + 1] if j <= i else sik[j:] + sik[:i + 1]))
        # the southern arc is the one that stays low
        south = min((fwd, back),
                    key=lambda arc: sum(p[1] for p in arc) / max(1, len(arc)))
        head = ring[:run[0]]
        tail = ring[run[-1] + 1:]
        out.append(head + list(south) + tail)
        cut = len(run)
    return out, cut


def ring_edge_distance(pt, ring):
    """How far a point is from a ring's outline, not from its nearest vertex.

    On a simplified ring the two are very different: a vertex may be tens of
    kilometres from the nearest point of the edge it sits on. Used to decide
    which island a satellite islet belongs to.
    """
    px, py = pt
    best = float("inf")
    n = len(ring)
    for i in range(n):
        ax, ay = ring[i]
        bx, by = ring[(i + 1) % n]
        dx, dy = bx - ax, by - ay
        if dx == 0.0 and dy == 0.0:
            d = (px - ax) ** 2 + (py - ay) ** 2
        else:
            t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
            t = 0.0 if t < 0.0 else (1.0 if t > 1.0 else t)
            d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2
        if d < best:
            best = d
    return best ** 0.5


def ring_area_signed(points):
    """Twice the ring's area, sign kept — which is its winding direction."""
    a = 0.0
    n = len(points)
    for i in range(n):
        x0, y0 = points[i]
        x1, y1 = points[(i + 1) % n]
        a += x0 * y1 - x1 * y0
    return a / 2


def ring_area(points):
    return abs(ring_area_signed(points))


def dissolve(rings, quant=1e6):
    """Drop shared boundaries between rings that meet edge-for-edge.

    Directed edges that appear in both directions are interior to the group, so
    they are removed and the survivors stitched back into rings. Data that is
    not topologically clean simply fails to stitch, and the caller keeps the
    original rings.
    """
    edges = collections.Counter()
    for ring in rings:
        pts = [(round(x * quant), round(y * quant)) for x, y in ring]
        if pts[0] != pts[-1]:
            pts.append(pts[0])
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]
            if a != b:
                edges[(a, b)] += 1

    survivors = []
    for (a, b), n in edges.items():
        m = edges.get((b, a), 0)
        keep = n - m
        for _ in range(max(0, keep)):
            survivors.append((a, b))
    if not survivors:
        return None

    outgoing = collections.defaultdict(list)
    for a, b in survivors:
        outgoing[a].append(b)

    out = []
    for start in list(outgoing.keys()):
        while outgoing.get(start):
            ring = [start]
            cur = start
            ok = True
            for _ in range(len(survivors) + 2):
                nxt_list = outgoing.get(cur)
                if not nxt_list:
                    ok = False
                    break
                nxt = nxt_list.pop()
                if not nxt_list:
                    outgoing.pop(cur, None)
                if nxt == start:
                    break
                ring.append(nxt)
                cur = nxt
            else:
                ok = False
            if not ok or len(ring) < 3:
                return None
            out.append([(x / quant, y / quant) for x, y in ring])
    return out or None


# The Yalu and the Tumen, west to east — the land frontier between Korea and
# Manchuria, from the mouth at Antung to the last bend above the Soviet corner.
# It is used only to say which stretch of Korea's outline is the frontier and
# not the coast; the seam itself is computed from Korea's own vertices, so the
# trace need only be right to within the corridor radius below. It stops at
# 130.45 E because the last twenty kilometres of the Tumen are Korea's border
# with the Soviet Union, not with Manchuria.
YALU_TUMEN = [
    # the Yalu: Sinuiju, Sakchu, Chosan, Manpojin, then the loop north to
    # Chunggangjin and Linjiang before it turns back south-east for Hyesan
    (124.36, 39.82), (124.55, 39.95), (124.80, 40.10), (125.05, 40.25),
    (125.35, 40.40), (125.60, 40.60), (125.85, 40.85), (126.10, 41.00),
    (126.30, 41.10), (126.50, 41.45), (126.65, 41.65), (126.85, 41.80),
    (127.10, 41.70), (127.40, 41.60), (127.75, 41.50), (128.05, 41.42),
    # over the Paektu watershed and down the Tumen: Musan, Hoeryong, Onsong
    (128.10, 41.75), (128.10, 42.02), (128.50, 42.02), (128.95, 42.05),
    (129.35, 42.25), (129.75, 42.44), (130.00, 42.70), (130.05, 42.95),
    (130.25, 42.90), (130.45, 42.70),
]
FRONTIER_RADIUS = 0.40     # degrees; how far off the trace a vertex may lie
FRONTIER_MIN = 0.14        # degrees; the thinnest the seam is ever drawn,
                           # wide enough to survive the filler's own thinning
FRONTIER_MAX = 0.60        # degrees; wider than this and it is not a seam
FRONTIER_NIL = 0.02        # degrees; below this the seam is not drawn at all


def _seg_dist(p, a, b):
    """Distance from p to the segment ab, in degrees."""
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


# The atoms drawn from the ENP-China sheet. Their edge is the one the map keeps
# along every frontier of China, and everything else has to reach it.
# Manchukuo is not from that sheet but stands on the same side of the argument:
# it is traced from the railway company's own 1935 map, its neighbours are
# Natural Earth's, and the traced line is the one the map keeps. So the Soviet
# Union and Mongolia reach it, exactly as they reach China.
ENP_SIDE = ("china", "manchuria", "jehol", "chahar", "suiyuan", "suiyuan_w",
            "xinjiang", "tibet", "manchukuo")

# The neighbours drawn from some other source, which therefore put the frontier
# somewhere slightly different. Korea is not here: it has a seam of its own,
# built the other way round, because along the Yalu and the Tumen it is Korea's
# line that is the better one and Manchuria that has to reach it.
CHINA_NEIGHBOURS = ("ussr", "mongolia", "indochina", "burma", "siam", "india",
                    "nepal", "bhutan", "sikkim", "tuva", "saharat", "siamgain")

SEAM_STEP = 0.015          # degrees; how finely the gap is searched
SEAM_MAX = 0.50            # degrees; wider than this is not a seam but a hole

# Except where half a degree is not a crack but a bay. A seam reaches from one
# country's frontier until it is inside its neighbour, and where the two are
# separated by water rather than by a disagreement it should reach nothing at
# all — the reach is what tells a coastline from a frontier. Fifty-five
# kilometres is a fair allowance along the Himalaya, where two hand-traced
# lines can differ by tens of kilometres; in northern Borneo it is wider than
# Brunei Bay, and the strips went straight across it. Measured against the
# traced coastline, the map was drawing **10,324 sample points of sea as land**
# in that window. Six kilometres closes the source disagreements there, which
# are a few hundred metres, and cannot cross anything.
SEAM_REACH = {
    # The other way: the Pamir and the Tien Shan. The ENP sheet's Sinkiang is
    # the coarse half of a coarse source — its interior and frontier lines run
    # 9 to 12 km out of place, which is measured in Sources — and Natural
    # Earth's Soviet Union is much the better line there. The ground between
    # them is China's up to the Soviet border, so it is Sinkiang that reaches,
    # and it needs a hundred kilometres to do it.
    ("xinjiang", "ussr"): 0.9,
    ("xinjiang", "other"): 0.9,
    ("northborneo", "sarawak"): 0.055,
    ("northborneo", "brunei"): 0.055,
    ("northborneo", "dei"): 0.055,
    ("sarawak", "brunei"): 0.055,
    ("sarawak", "northborneo"): 0.055,
    ("brunei", "northborneo"): 0.055,
    ("brunei", "sarawak"): 0.055,
    ("dei", "timor_pt"): 0.055,
    ("dei", "northborneo"): 0.055,
    ("dei", "sarawak"): 0.055,
    ("dei", "brunei"): 0.055,
    ("malaya", "siam"): 0.12,
    ("malaya", "malaya_thai"): 0.12,
}


def seam_reach(mover, targets):
    """The reach for one job: the smallest any of its pairs asks for."""
    want = [SEAM_REACH[(mover, t)] for t in targets if (mover, t) in SEAM_REACH]
    return min(want) if len(want) == len(targets) and want else SEAM_MAX
SEAM_MIN_RUN = 3           # vertices; shorter runs draw a fleck, not a strip
SEAM_ASPECT = 26.0         # a strip longer than this many times its own
                           # width is a splinter, not a seam
SEAM_AIM = 0.18            # degrees; how near a target must be to be aimed at
SEAM_STRIDE = 0.25         # degrees; the furthest apart two vertices of a run
                           # may be. A strip is a quadrilateral per pair, and
                           # Natural Earth's rings can put two vertices two
                           # degrees apart along a coast — which made a strip
                           # two degrees long and half a degree wide, a spike
                           # of Siam reaching across the Andaman Sea. A run
                           # breaks where its own vertices are further apart
                           # than a strip is wide.
SEAM_OVER = 0.035          # degrees; how far past the first point inside the
                           # target a strip reaches. Stopping at the first one
                           # leaves the two edges touching rather than
                           # overlapping, and at a place where three countries
                           # meet — the Altai corner of Xinjiang, Mongolia and
                           # the Soviet Union — three strips that each only
                           # touch leave a wedge in the middle of them.

# Frontiers away from China where two sources disagree, as (who moves, who
# stays). The one that stays is always the better-drawn of the two: the traced
# protectorates over Natural Earth's India, Korea's own provinces over
# Manchuria's, the Shan states over Burma's divisions.
ELSEWHERE_SEAMS = (
    ("india", ("nepal", "sikkim", "bhutan")),
    ("india", ("burma",)),
    ("burma", ("saharat", "india")),
    ("siam", ("burma", "indochina", "saharat", "malaya", "malaya_thai")),
    ("indochina", ("siam", "siamgain", "burma")),
    ("siamgain", ("indochina", "siam")),
    ("ussr", ("mongolia", "tuva", "korea")),
    # And back the other way along the Sinkiang frontier. The Soviet Union
    # already reaches China, but the reach only closes a gap from the side it
    # starts on, and along the Pamir and the Tien Shan the two sources part
    # company by more than one strip can carry: five hundred sample points in
    # eighty thousand had neither country on them, and showed as ragged neutral
    # ground on the Soviet side of the line. With both sides reaching, they
    # meet.
    ("xinjiang", ("ussr", "other")),
    ("mongolia", ("tuva", "ussr")),
    ("malaya", ("malaya_thai", "siam")),
    ("dei", ("timor_pt", "northborneo", "sarawak", "brunei")),
    ("northborneo", ("sarawak", "brunei", "dei")),
    ("sarawak", ("brunei", "northborneo")),
    ("brunei", ("northborneo", "sarawak")),
)


class _RingBands:
    """One ring's edges bucketed by latitude band.

    The crossing test asks, of every edge, whether the query's y falls between
    its two ends — so an edge whose y-span does not straddle y can never be
    counted, and there is no reason to look at it. Bucketing the edges into
    bands of latitude and looking only in the band the query falls in turns a
    scan of a couple of thousand vertices into a scan of a couple of dozen.

    This is the same predicate as `point_in_ring`, not an approximation of it.
    An edge is filed in every band its y-span touches, so the band containing y
    holds every edge that could have been counted; the arithmetic that decides
    the crossing is copied across unchanged. Horizontal edges are dropped
    because `(y0 > y) != (y1 > y)` is false for them whatever y is.
    """
    __slots__ = ("x0", "y0", "x1", "y1", "h", "nb", "bands")

    def __init__(self, ring):
        n = len(ring)
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        self.x0, self.y0, self.x1, self.y1 = min(xs), min(ys), max(xs), max(ys)
        # About eight edges to a band, and never so many bands that the index
        # costs more to build than the scans it saves.
        self.nb = nb = max(1, min(1024, n // 8))
        span = self.y1 - self.y0
        self.h = (span / nb) if span > 0 else 1.0
        bands = [[] for _ in range(nb)]
        y0r, h = self.y0, self.h
        for i in range(n):
            ax, ay = ring[i]
            bx, by = ring[(i + 1) % n]
            if ay == by:
                continue
            lo, hi = (ay, by) if ay < by else (by, ay)
            b0 = int((lo - y0r) / h)
            b1 = int((hi - y0r) / h)
            if b0 < 0:
                b0 = 0
            if b1 >= nb:
                b1 = nb - 1
            e = (ax, ay, bx, by)
            for b in range(b0, b1 + 1):
                bands[b].append(e)
        self.bands = bands

    def contains(self, px, py):
        if px < self.x0 or px > self.x1 or py < self.y0 or py > self.y1:
            return False
        b = int((py - self.y0) / self.h)
        if b < 0:
            b = 0
        elif b >= self.nb:
            b = self.nb - 1
        inside = False
        for ax, ay, bx, by in self.bands[b]:
            if (ay > py) != (by > py):
                if px < ax + (py - ay) * (bx - ax) / (by - ay):
                    inside = not inside
        return inside


def _ring_test(rings):
    """A closure answering "is this point inside any of these rings"."""
    if not OPT.index:
        boxed = []
        for r in rings:
            if len(r) < 3:
                continue
            xs = [p[0] for p in r]
            ys = [p[1] for p in r]
            boxed.append((min(xs), min(ys), max(xs), max(ys), r))

        def inside(p):
            px, py = p
            for x0, y0, x1, y1, r in boxed:
                if x0 <= px <= x1 and y0 <= py <= y1 and point_in_ring(p, r):
                    return True
            return False
        return inside

    # The bounding boxes were scanned in a flat list too — a hundred and sixty
    # of them for every query, which was seven per cent of the build on its own.
    # The rings go in a coarse grid by the cells their box covers, so a query
    # looks at the few whose box is anywhere near it. A ring whose box holds the
    # point is registered in that point's cell by construction, so this rejects
    # nothing the flat scan would have kept.
    cell = 2.0
    grid = collections.defaultdict(list)
    for r in rings:
        if len(r) < 3:
            continue
        b = _RingBands(r)
        for gx in range(int(math.floor(b.x0 / cell)),
                        int(math.floor(b.x1 / cell)) + 1):
            for gy in range(int(math.floor(b.y0 / cell)),
                            int(math.floor(b.y1 / cell)) + 1):
                grid[(gx, gy)].append(b)
    grid = dict(grid)

    def inside(p):
        px, py = p
        for b in grid.get((int(math.floor(px / cell)),
                           int(math.floor(py / cell))), ()):
            if b.contains(px, py):
                return True
        return False
    return inside


def _ring_normal(ring, k, window=0.08):
    """The normal at vertex k, taken over a couple of kilometres.

    Vertex to vertex the direction swings through half a turn along a ragged
    shore, and a strip built on it fans out sideways in a starburst.
    """
    n = len(ring)

    def reach(step):
        j, p0 = k, ring[k]
        for _ in range(40):
            j = (j + step) % n
            if math.hypot(ring[j][0] - p0[0], ring[j][1] - p0[1]) >= window:
                break
        return ring[j]
    a, b = reach(-1), reach(1)
    dx, dy = b[0] - a[0], b[1] - a[1]
    h = math.hypot(dx, dy) or 1.0
    return (dy / h, -dx / h)


def _grid_of(rings, cell):
    """Vertices bucketed by cell, for "is anything near this point" questions."""
    grid = collections.defaultdict(list)
    for ring in rings:
        for x, y in ring:
            grid[(int(math.floor(x / cell)), int(math.floor(y / cell)))].append((x, y))
    return grid


def _nearest_in(grid, cell, p, radius):
    """The nearest bucketed vertex to p within radius, or None."""
    px, py = p
    gx, gy = int(math.floor(px / cell)), int(math.floor(py / cell))
    span = int(math.ceil(radius / cell))
    best, bd = None, radius
    for i in range(gx - span, gx + span + 1):
        for j in range(gy - span, gy + span + 1):
            for q in grid.get((i, j), ()):
                d = math.hypot(px - q[0], py - q[1])
                if d < bd:
                    bd, best = d, q
    return best


def _near_grid(grid, cell, p, radius):
    px, py = p
    gx, gy = int(math.floor(px / cell)), int(math.floor(py / cell))
    span = int(math.ceil(radius / cell))
    for i in range(gx - span, gx + span + 1):
        for j in range(gy - span, gy + span + 1):
            for q in grid.get((i, j), ()):
                if math.hypot(px - q[0], py - q[1]) <= radius:
                    return True
    return False


def _seam_cache_id(groups):
    """What the seams depend on, in one hash.

    Two kinds of input. The geometry — every ring of every country that takes
    part, mover or target — and the code and constants that decide what to do
    with it.

    The code is hashed by reading its own source rather than by a version
    number somebody has to remember to raise. A number is the usual way and it
    is the wrong way here: the failure it invites is silent, a changed search
    answered from a cache written before the change, and the symptom would be
    geometry that quietly does not match the code that claims to have made it.
    Reading the source costs a millisecond and cannot be forgotten.
    """
    h = hashlib.sha256()
    for fn in (push_seam, _ring_test, _RingBands, _ring_normal, _grid_of,
               _nearest_in, _near_grid, signed_ring_area, add_neighbour_seams,
               _seam_worker):
        try:
            h.update(inspect.getsource(fn).encode())
        except (OSError, TypeError):
            return None          # cannot prove freshness, so do not cache
    h.update(repr((SEAM_STEP, SEAM_MAX, SEAM_MIN_RUN, SEAM_ASPECT, SEAM_AIM,
                   SEAM_STRIDE, SEAM_OVER, ENP_SIDE, CHINA_NEIGHBOURS,
                   ELSEWHERE_SEAMS, sorted(SEAM_REACH.items()),
                   sorted(SEAM_DENSIFY.items()))).encode())
    keys = set(ENP_SIDE) | set(CHINA_NEIGHBOURS)
    for mover, targets in ELSEWHERE_SEAMS:
        keys.add(mover)
        keys.update(targets)
    for key in sorted(keys):
        h.update(key.encode())
        for ring in groups.get(key, ()):
            h.update(b"%d;" % len(ring))
            flat = array.array("d", [c for p in ring for c in p])
            h.update(flat.tobytes())
    return h.hexdigest()[:32]


def _seam_cache_path(cid):
    return os.path.join(CACHE, "seams-%s.json" % cid)


def _seam_cache_read(groups):
    if not OPT.cache:
        return None
    cid = _seam_cache_id(groups)
    if not cid:
        return None
    path = _seam_cache_path(cid)
    if not os.path.exists(path):
        return None
    try:
        with open(path) as fh:
            raw = json.load(fh)
    except (OSError, ValueError):
        return None
    sys.stderr.write("seam search: from cache %s\n" % os.path.basename(path))
    return {k: [[tuple(p) for p in ring] for ring in rings]
            for k, rings in raw.items()}


def _seam_cache_write(groups, seams):
    if not OPT.cache:
        return
    cid = _seam_cache_id(groups)
    if not cid:
        return
    os.makedirs(CACHE, exist_ok=True)
    path = _seam_cache_path(cid)
    tmp = path + ".tmp"
    try:
        with open(tmp, "w") as fh:
            json.dump({k: [[list(p) for p in ring] for ring in rings]
                       for k, rings in seams.items()}, fh)
        os.replace(tmp, path)
    except OSError:
        return
    # Old entries are the seams as they were before the last change to the
    # geometry or the search. Nothing reads them again; they are dropped so the
    # cache directory does not grow a copy per edit.
    for old in os.listdir(CACHE):
        if old.startswith("seams-") and old != os.path.basename(path):
            try:
                os.remove(os.path.join(CACHE, old))
            except OSError:
                pass


def add_neighbour_seams(groups):
    """Make every neighbour of China reach China's own boundary.

    China, Manchuria and the rest of the ENP-China atoms are drawn from the
    Republican province sheet; the Soviet Union, Mongolia, Indochina, Burma and
    the others are drawn from Natural Earth. The two put the frontier a
    kilometre or two apart, and a band belonging to neither shows all along it
    at deep zoom — bare ocean where nothing else is under it, or whatever filler
    is. Natural Earth's own outline of China used to be laid underneath to plug
    it, but that outline is much coarser than the provinces and drew China's
    coast a second time, a kilometre out to sea from where the provinces put it.

    So the plug is built where the problem is instead. Each neighbour's frontier
    vertices are pushed towards China until they are inside it, and the strip
    between where they were and where they end up is added to that neighbour's
    filler. The neighbour's own outline still runs where its source puts it —
    the strip is under it, not part of it — and because the far edge is inside
    China, the two now overlap instead of leaving a gap.

    A vertex that is already inside China, or that cannot reach China within
    `SEAM_MAX`, gets no strip: that is what tells a coastline from a frontier,
    with no need to say in advance which stretch of a country is which.
    """
    seams = collections.defaultdict(list)
    enp = [r for k in ENP_SIDE for r in groups.get(k, ())]
    if not enp:
        sys.stderr.write("note: no ENP-China rings, neighbour seams skipped\n")
        return seams

    cached = _seam_cache_read(groups)
    if cached is not None:
        return cached

    # The jobs, in the order their results have to be concatenated. A mover can
    # appear in both lists — India, Burma and Siam all do — and the strips it
    # gets from China come before the ones it gets from its other neighbours,
    # so the order here is part of the answer and not an implementation detail.
    #
    # The same problem away from China: Nepal, Sikkim and Bhutan are traced by
    # hand and British India is Natural Earth, and the two disagree along every
    # mile of those frontiers; the traced line is the better one, so it is India
    # that reaches. Burma and Siam are drawn from different files again.
    def mover_rings(key):
        rs = groups.get(key) or []
        step = SEAM_DENSIFY.get(key)
        return [densify(r, step) for r in rs] if step else rs

    jobs = [(key, mover_rings(key), enp, SEAM_MAX) for key in CHINA_NEIGHBOURS]
    for mover, targets in ELSEWHERE_SEAMS:
        want = [r for k in targets for r in groups.get(k, ())]
        if want:
            jobs.append((mover, mover_rings(mover), want,
                         seam_reach(mover, targets)))

    t0 = time.perf_counter()
    if OPT.jobs > 1 and len(jobs) > 1:
        # The twenty-five searches do not talk to each other, and the machine
        # has more than one core. Results are put back in job order, so which
        # worker finished first cannot change the answer.
        ctx = multiprocessing.get_context()
        with ctx.Pool(min(OPT.jobs, len(jobs)),
                      initializer=_seam_worker_init,
                      initargs=(OPT.flags(),)) as pool:
            results = pool.map(_seam_worker, jobs, chunksize=1)
    else:
        results = [push_seam(rings, target, reach)
                   for _, rings, target, reach in jobs]

    for (key, _, _, _), strips in zip(jobs, results):
        seams[key].extend(strips)
    out = {k: v for k, v in seams.items() if v}
    sys.stderr.write("seam search: %.1fs%s\n"
                     % (time.perf_counter() - t0,
                        f" on {min(OPT.jobs, len(jobs))} workers"
                        if OPT.jobs > 1 and len(jobs) > 1 else ""))
    _seam_cache_write(groups, out)
    return out


def _seam_worker_init(flags):
    """A worker process starts with the module's defaults; give it ours.

    `spawn` re-imports this module rather than inheriting its state, so the
    switches have to be handed over explicitly or a `--legacy` run would come
    back with optimised workers.
    """
    (OPT.index, OPT.cache, OPT.probe_bound, OPT.jobs, OPT.fast_name) = flags
    OPT.jobs = 1          # a worker does not start workers of its own


def _seam_worker(job):
    _key, rings, target, reach = job
    return push_seam(rings, target, reach)


# How far apart two vertices of a frontier may be before a seam search cannot
# see the ground between them. A seam is pushed out from the mover's own
# vertices, so a boundary drawn with very few of them has almost nothing to
# push: the ENP sheet gives the whole of Sinkiang 84 vertices, and a search
# that should have carried the frontier out to the Soviet line produced eight
# strips. Splitting the long edges first gives it something to work with, and
# adds no shape — every point inserted lies on the line it came from.
SEAM_DENSIFY = {"xinjiang": 0.04}


def densify(ring, step):
    """The same ring with no edge longer than `step`."""
    out = []
    n = len(ring)
    for i in range(n):
        ax, ay = ring[i]
        bx, by = ring[(i + 1) % n]
        out.append((ax, ay))
        d = math.hypot(bx - ax, by - ay)
        if d <= step:
            continue
        for k in range(1, int(d / step)):
            t = k * step / d
            out.append((ax + (bx - ax) * t, ay + (by - ay) * t))
    return out


def push_seam(rings, target, reach=SEAM_MAX):
    """Strips carrying `rings` outward until they overlap `target`.

    Each vertex is pushed along its own normal, a step at a time, and stops at
    the first distance that lands inside the target and outside the shape it
    came from — the smallest push that closes the gap. A vertex already inside
    the target, or one that cannot reach it within `reach`, gets nothing, and
    that is what tells a frontier from a coastline without anyone having to say
    in advance which stretch of a country is which.
    """
    out = []
    if not rings or not target:
        return out
    cell = 0.5
    grid = _grid_of(target, cell)
    in_target = _ring_test(target)
    in_own = _ring_test(rings)
    ref_wind = signed_ring_area(max(rings, key=len))

    # The longest edge in the target. A probe lands inside the target only if
    # the segment from the vertex to it crosses the target's boundary, so the
    # boundary has a point within the probe's own length — and the nearest
    # point of an edge is never further than the nearest of its two ends minus
    # that edge's own length. So a probe shorter than (distance to the nearest
    # target vertex) minus (longest edge) cannot possibly succeed, and the
    # thirty-three steps outward can start where success first becomes
    # geometrically possible instead of at the first step. This is a bound, not
    # a guess: nothing that could have been found is skipped.
    longest_edge = 0.0
    if OPT.probe_bound:
        for ring in target:
            n = len(ring)
            for i in range(n):
                ax, ay = ring[i]
                bx, by = ring[(i + 1) % n]
                d = math.hypot(bx - ax, by - ay)
                if d > longest_edge:
                    longest_edge = d

    for ring in rings:
        n = len(ring)
        if n < 8:
            continue
        piece = []
        for k in range(n + 1):
            p = ring[k % n] if k < n else None
            far = None
            if p is not None and _near_grid(grid, cell, p, reach) \
                    and not in_target(p):
                nx, ny = _ring_normal(ring, k % n)
                # Both ways along the normal, and straight at the nearest bit of
                # the target. The normal alone fails where two countries meet at
                # an angle rather than run alongside each other: in the Altai,
                # where Xinjiang, Mongolia and the Soviet Union come together,
                # the normal to Mongolia's line points along the gap instead of
                # across it, and a twenty-kilometre wedge stayed open.
                dirs = [(nx, ny), (-nx, -ny)]
                # Aiming straight at the target only when the target is close.
                # Given the whole reach it will happily aim across a strait —
                # a vertex on the Siamese coast at the nearest scrap of British
                # Malaya on an island, and the strip laid between them is a
                # spike of Siam over open water.
                near = _nearest_in(grid, cell, p, SEAM_AIM)
                if near:
                    dx, dy = near[0] - p[0], near[1] - p[1]
                    h = math.hypot(dx, dy) or 1.0
                    dirs.append((dx / h, dy / h))
                # the shortest probe that could reach the target at all
                floor_w = 0.0
                if OPT.probe_bound:
                    nq = _nearest_in(grid, cell, p, reach)
                    if nq is not None:
                        floor_w = (math.hypot(nq[0] - p[0], nq[1] - p[1])
                                   - longest_edge)
                w = SEAM_STEP
                # `w` is still accumulated a step at a time, and the body is
                # skipped rather than the loop restarted, so the sequence of
                # widths tried is exactly the sequence tried before — floating
                # point included.
                while w <= reach and far is None:
                    if w < floor_w:
                        w += SEAM_STEP
                        continue
                    for sign in dirs:
                        nx, ny = sign
                        sign = 1.0
                        q = (p[0] + sign * nx * w, p[1] + sign * ny * w)
                        # inside the target and out of its own country: a strip
                        # that doubles back into itself fills nothing and can
                        # cross a bay to do it
                        if in_target(q) and not in_own(q):
                            deep = (p[0] + sign * nx * (w + SEAM_OVER),
                                    p[1] + sign * ny * (w + SEAM_OVER))
                            far = deep if not in_own(deep) else q
                            break
                    w += SEAM_STEP
            if far is not None and (not piece or
                    math.hypot(p[0] - piece[-1][0][0],
                               p[1] - piece[-1][0][1]) <= SEAM_STRIDE):
                piece.append((p, far))
                continue
            if len(piece) >= SEAM_MIN_RUN:
                strip = [a for a, _ in piece] + [b for _, b in reversed(piece)]
                # A seam is a ribbon along a frontier. One many times longer
                # than it is wide is not a ribbon, it is a splinter thrown
                # across a bay — which is what appeared between the headlands
                # either side of Brunei Bay.
                run = sum(math.hypot(piece[i + 1][0][0] - piece[i][0][0],
                                     piece[i + 1][0][1] - piece[i][0][1])
                          for i in range(len(piece) - 1))
                wide = max(math.hypot(b[0] - a[0], b[1] - a[1])
                           for a, b in piece)
                if wide <= 0 or run / wide > SEAM_ASPECT:
                    piece = [(p, far)] if far is not None else []
                    continue
                # the strip overlaps its own country rather than abutting it,
                # and paths fill by the nonzero rule: wound the other way it
                # would cancel the overlap and punch a hole
                if signed_ring_area(strip) * ref_wind < 0:
                    strip.reverse()
                out.append(strip)
            # a run broken by the stride starts the next one at this vertex
            piece = [(p, far)] if far is not None else []
    return out


def add_frontier_seam(groups):
    """Close the gap between Korea's boundary and Manchuria's.

    Korea is drawn from a period map of its thirteen provinces and Manchuria
    from the ENP-China provinces; the two files put the Yalu and the Tumen in
    slightly different places, so a strip of bare land colour shows between
    them for the whole length of the frontier — up to forty kilometres of it.
    Korea's line is the better one and stays, so Manchuria has to reach it: a
    strip is built with Korea's own frontier vertices as its inner edge and
    those vertices pushed outward far enough to bury Manchuria's line as its
    outer one. Because the inner edge is Korea's line exactly, the seam cannot
    spill onto the Korean side, and Manchuria's outline still runs where the
    frontier runs.

    Returns the seam rings by atom, for the filler to add to whatever it is
    already building itself from. They must not go into `backing` directly:
    Manchuria has no Natural Earth outline there and the filler falls back to
    the union of its provinces, which putting a key in `backing` would silently
    replace with the seam alone.
    """
    seams = collections.defaultdict(list)
    korea = groups.get("korea")
    if not korea:
        return seams
    # Both of them: `manchuria` is the ENP sheet's and carries the 1930 map,
    # `manchukuo` is the traced 1935 sheet and carries 1942. They are different
    # lines along the same rivers and each needs its own strip, or whichever is
    # drawn on the epoch you are looking at has a bare gap beside Korea.
    for _mkey in ("manchuria", "manchukuo"):
        _seams = _korea_seam(groups, korea, _mkey)
        for k, v in _seams.items():
            seams[k].extend(v)
    if not seams:
        sys.stderr.write("note: no Korea frontier found, seam skipped\n")
    return seams


def _korea_seam(groups, korea, mkey):
    """The strip along the Yalu and the Tumen for one Manchurian atom."""
    seams = collections.defaultdict(list)
    manch = groups.get(mkey)
    if not manch:
        return seams
    # Korea is thirteen provinces, not one outline, so the frontier is shared
    # out between the four northern ones and has to be picked up ring by ring
    mvert = [p for r in manch for p in r]
    ref_wind = signed_ring_area(max(manch, key=len))

    def on_frontier(p):
        return min(_seg_dist(p, YALU_TUMEN[j], YALU_TUMEN[j + 1])
                   for j in range(len(YALU_TUMEN) - 1)) <= FRONTIER_RADIUS

    def outside_korea(p):
        return not any(point_in_ring(p, r) for r in korea)

    def inside_manchuria(p):
        return any(point_in_ring(p, r) for r in manch)

    for ring in korea:
        n = len(ring)
        if n < 8:
            continue
        mark = [i for i in range(n) if on_frontier(ring[i])]
        if len(mark) < 4:
            continue
        marked = set(mark)
        # unbroken stretches of the ring, read cyclically
        runs, seen = [], set()
        for i in mark:
            if i in seen or (i - 1) % n in marked:
                continue
            run, j = [], i
            while j in marked and len(run) < n:
                run.append(j)
                seen.add(j)
                j = (j + 1) % n
            runs.append(run)
        if not runs and mark:                        # the whole ring qualifies
            runs = [mark]

        for run in runs:
            if len(run) < 4:
                continue
            arc = [ring[i] for i in run]

            # The tangent is taken over a couple of kilometres rather than from
            # the neighbouring vertex. Korea is drawn at the full detail of its
            # source, so consecutive vertices are a few hundred metres apart
            # and the vertex-to-vertex direction swings through half a turn
            # along a ragged estuary; a normal built from it fans the seam out
            # into the sea in a starburst.
            def normal(k, arc=arc):
                def reach(step):
                    j, p0 = k, arc[k]
                    for _ in range(40):
                        n2 = j + step
                        if n2 < 0 or n2 >= len(arc):
                            break
                        j = n2
                        if math.hypot(arc[j][0] - p0[0], arc[j][1] - p0[1]) >= 0.08:
                            break
                    return arc[j]
                a, b = reach(-1), reach(1)
                dx, dy = b[0] - a[0], b[1] - a[1]
                h = math.hypot(dx, dy) or 1.0
                return (dy / h, -dx / h)

            def near_corridor(p, slack):
                return min(_seg_dist(p, YALU_TUMEN[j], YALU_TUMEN[j + 1])
                           for j in range(len(YALU_TUMEN) - 1)) <= slack

            widths = []
            for k, p in enumerate(arc):
                near = min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in mvert)
                w0 = min(FRONTIER_MAX, max(FRONTIER_MIN, near * 1.25))
                nx, ny = normal(k)
                # The seam is only ever allowed to reach from Korea into
                # Manchuria: the far end of it has to be out of Korea, in
                # Manchuria, and still beside the river. Where neither side
                # qualifies — the outward side is the next Korean province,
                # which happens along the stretch of provincial boundary inside
                # the corridor near Paektu, or it is open water, which is what
                # lies outward from the islands in the Yalu estuary — the strip
                # shrinks away to nothing instead of striking out across the
                # bay. Which side is outward is asked at every vertex rather
                # than once for the run: a run can turn a corner, and one
                # answer for the whole of it collapses the half it is wrong for.
                best = (0.0, p)
                for sign in (1.0, -1.0):
                    w = w0
                    while w > FRONTIER_NIL:
                        q = (p[0] + sign * nx * w, p[1] + sign * ny * w)
                        if outside_korea(q) and inside_manchuria(q) and \
                                near_corridor(q, FRONTIER_RADIUS + w):
                            break
                        w *= 0.5
                    if w > best[0]:
                        best = (w, (p[0] + sign * nx * w, p[1] + sign * ny * w))
                widths.append((p, best[1], best[0]))

            # A run can be part frontier and part coastline. Break it where the
            # strip has shrunk to nothing rather than carrying a hairline
            # through: a hairline fills no crack and is drawn as a little loop
            # of its own the moment Manchuria is selected.
            piece = []
            for p, q, w in widths + [(None, None, 0.0)]:
                if w > FRONTIER_NIL:
                    piece.append((p, q))
                    continue
                if len(piece) >= 4:
                    seam = [a for a, _ in piece] + [b for _, b in reversed(piece)]
                    # The seam overlaps Manchuria's own polygons rather than
                    # abutting them, and paths are filled by the nonzero rule:
                    # a ring wound the other way would cancel the overlap and
                    # punch a hole in the country along the whole frontier.
                    # Wind it the way Manchuria winds.
                    if signed_ring_area(seam) * ref_wind < 0:
                        seam.reverse()
                    # the filler only: the atom's own outline is Manchuria's own
                    # data, and a seam in it would be stroked on selection as a
                    # second line a few kilometres inside Korea
                    seams[mkey].append(seam)
                piece = []
    return seams


# Modern China as Natural Earth draws it, minus the things a 1930 or 1942 map
# must not take from it. The Paracels were not Chinese on either date: France
# claimed them for Annam and occupied them in 1938, and Japan took them in 1939
# and ran them from Taiwan.
PARACELS_BOX = (110.5, 15.5, 113.5, 17.5)


def china_island(ring):
    """Is this ring one of China's coastal islands?

    The Republican provinces do not carry the small islands, so they are taken
    from Natural Earth instead. Not the mainland, whose land frontiers disagree
    with the provinces and must stay under the neutral filler; not Hainan, which
    the provinces do carry; and not the Paracels, which were not China's.
    """
    a = abs(signed_ring_area(ring)) / 2.0
    if a < 0.00005 or a > 1.0:
        return False
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    x0, y0, x1, y1 = PARACELS_BOX
    return not (x0 <= cx <= x1 and y0 <= cy <= y1)



# A backing is a country's outline with its islands beside it. Anything small
# that ends up *inside* the outline is neither: it is the residue of dissolving
# provinces that do not quite share their edges, and China collected twenty-one
# of them, several bare triangles. They are invisible in the fill, which covers
# them, and they are not invisible when the country is hovered — the selection
# outline traces every ring it is given, so each one came out as a short stroke
# floating deep inland with nothing to explain it.
INTERIOR_SLIVER = 3.0        # square SVG units, about 95 sq km


def drop_interior_slivers(pieces, limit=INTERIOR_SLIVER):
    """Remove small rings that lie inside the largest ring of the same shape."""
    rings = []
    for pd in pieces:
        nums = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?", pd)]
        rings.append([(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)])
    if len(rings) < 2:
        return pieces
    big = max(range(len(rings)), key=lambda i: len(rings[i]))
    out = []
    for i, pd in enumerate(pieces):
        r = rings[i]
        if i != big and len(r) >= 3 and abs(ring_area(r)) < limit:
            cx = sum(p[0] for p in r) / len(r)
            cy = sum(p[1] for p in r) / len(r)
            if point_in_ring((cx, cy), rings[big]):
                continue
        out.append(pd)
    return out


_OCCUPIED_CACHE = []


def load_occupied_rings():
    """The traced occupation, as (block name, ring) pairs.

    Each ring takes the name of whichever hand-drawn block it falls in, so the
    pointer can still say which piece of the occupation it is on — North China
    and the Yangtze valley, Hainan, the Canton delta and the rest. A ring that
    falls in none of them, which is every offshore islet, goes to the nearest.
    """
    if _OCCUPIED_CACHE:
        return _OCCUPIED_CACHE[0]
    path = os.path.join(CACHE, OCCUPIED_FILE)
    if not os.path.exists(path):
        _OCCUPIED_CACHE.append([])
        return []
    try:
        with open(path) as fh:
            fc = json.load(fh)
    except (OSError, ValueError):
        sys.stderr.write("note: %s unreadable, occupied zone falls back\n" % path)
        return []
    blocks = [(OCCUPIED_BLOCKS[n] if n < len(OCCUPIED_BLOCKS) else "",
               normalise_ring(chaikin(b, 2)))
              for n, b in enumerate(OCCUPIED_ZONE)]
    out = []
    for feat in fc.get("features", []):
        g = feat.get("geometry") or {}
        polys = ([g["coordinates"]] if g.get("type") == "Polygon"
                 else g.get("coordinates") or [])
        for poly in polys:
            if not poly:
                continue
            ring = [(x, y) for x, y in poly[0]]
            if len(ring) < 3:
                continue
            cx = sum(p[0] for p in ring) / len(ring)
            cy = sum(p[1] for p in ring) / len(ring)
            label = ""
            for name, blk in blocks:
                if point_in_ring((cx, cy), blk):
                    label = name
                    break
            if not label and blocks:
                best, bd = "", float("inf")
                for name, blk in blocks:
                    for x, y in blk:
                        d = (x - cx) ** 2 + (y - cy) ** 2
                        if d < bd:
                            bd, best = d, name
                label = best
            out.append((label, ring))
    out.sort(key=lambda r: -abs(signed_ring_area(r[1])))
    _OCCUPIED_CACHE.append(out)
    return out


def load_roc_provinces(enp_provinces):
    """The finer Republican provinces, keyed by atom, or {} if absent.

    Sorted into atoms by the same table as ENP's, because the faces were named
    by asking ENP which province they fall in — so the names are ENP's names and
    need no second mapping. Suiyuan takes the same cut at Paotow.

    Where this source has no province that ENP has, ENP's own sub-unit is kept,
    so every atom is covered whichever source the reader picks. In practice that
    is Kirin: on the 1936 sheet Manchuria is one disputed block and its
    provinces are not drawn.
    """
    if not os.path.exists(ROC_PROVINCES):
        return {}
    try:
        with open(ROC_PROVINCES) as fh:
            fc = json.load(fh)
    except (OSError, ValueError):
        sys.stderr.write("note: %s unreadable, alternative provinces skipped\n"
                         % ROC_PROVINCES)
        return {}
    out = collections.defaultdict(list)
    seen = set()
    for feat in fc.get("features", []):
        name = (feat.get("properties") or {}).get("name") or ""
        rings = [[(x, y) for x, y in ring]
                 for poly in feat["geometry"]["coordinates"] for ring in poly]
        rings = [r for r in rings if len(r) >= 3]
        if not name or not rings:
            continue
        seen.add(name)
        if name == "Suiyuan":
            # Mengchiang's half: east of the line and north of the river.
            # Free China's: the plain west of the line, and the Ordos south of
            # the river whichever side of the line it falls. See SUIYUAN_CUT.
            east = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=True),
                    line_plane((0.0, SUIYUAN_ORDOS_LAT), (180.0, SUIYUAN_ORDOS_LAT),
                               keep_right=False)]
            west = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=False)]
            ordos = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=True),
                     line_plane((0.0, SUIYUAN_ORDOS_LAT), (180.0, SUIYUAN_ORDOS_LAT),
                                keep_right=True)]
            for sides, dest, label in (([east], "suiyuan", "Suiyuan"),
                                       ([west, ordos], "suiyuan_w", "SuiyuanWest")):
                cut = []
                for side in sides:
                    cut.extend(c for c in (clip_halfplanes(r, side) for r in rings)
                               if len(c) >= 3)
                if cut:
                    out[dest].append((label, cut))
            continue
        out[PROVINCE_ATOM.get(name) or "china"].append((name, rings))

    for key, blocks in enp_provinces.items():
        if key not in ENP_ATOMS:
            continue
        for pname, prings in blocks:
            if pname not in seen and pname not in ("Suiyuan", "SuiyuanWest"):
                out[key].append((pname, prings))
    return dict(out)


def nearest_enp_atom(ring, provinces, default="china"):
    """Which ENP atom an offshore island belongs to.

    By the nearest point of any of their sub-units — an island is a few
    kilometres off its own province and a long way from anyone else's, so
    nearness settles it without a table to keep up to date.
    """
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    best, bd = default, float("inf")
    for key in ENP_ATOMS:
        for _, rings in provinces.get(key, []):
            for r in rings:
                for x, y in r:
                    d = (x - cx) ** 2 + (y - cy) ** 2
                    if d < bd:
                        bd, best = d, key
    return best


def signed_ring_area(ring):
    """Twice the signed area: the sign is the ring's winding direction."""
    s = 0.0
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % n]
        s += x0 * y1 - x1 * y0
    return s


def point_in_ring(p, ring):
    x, y = p
    inside = False
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % n]
        if (y0 > y) != (y1 > y):
            xi = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
            if x < xi:
                inside = not inside
    return inside


def simplify(points, tol):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    tol2 = tol * tol
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, ay = points[i]
        bx, by = points[j]
        dx, dy = bx - ax, by - ay
        norm = dx * dx + dy * dy
        best, best_d = -1, tol2
        for k in range(i + 1, j):
            px, py = points[k]
            if norm == 0:
                d = (px - ax) ** 2 + (py - ay) ** 2
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / norm
                t = max(0.0, min(1.0, t))
                cx, cy = ax + t * dx, ay + t * dy
                d = (px - cx) ** 2 + (py - cy) ** 2
            if d > best_d:
                best, best_d = k, d
        if best >= 0:
            keep[best] = True
            stack.append((i, best))
            stack.append((best, j))
    return [p for p, k in zip(points, keep) if k]


def esc(text):
    """Escape a string for an XML attribute.

    The main SVG is inserted with innerHTML, which forgives a bare ampersand;
    the administrative file is parsed as XML, which does not. Sub-unit names
    like "Kashmir & Jammu" were stopping that parse at the first one.
    """
    return (str(text).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def fmt(v, nd=1):
    s = f"{v:.{nd}f}"
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s or "0"


def path_precision(points):
    """How finely to write a ring, and how close two points may be.

    A tenth of a unit is five hundred metres, which is nothing on a coastline
    and everything on an atoll: Wake is a mile and a half across, so rounding
    it to the usual grid flattened its three islets into a blob and folded the
    lagoon shut. Small shapes are written finely; nothing else changes.
    """
    span = max(max(p[0] for p in points) - min(p[0] for p in points),
               max(p[1] for p in points) - min(p[1] for p in points))
    if span < 2:
        return 2, 0.005
    return 1, 0.05


# The precision two shapes cut from the same coastline are written at. The
# dedupe in `ring_to_path` drops any vertex within `eps` of the one before it,
# and where two rings hold the same coast but start at different vertices — the
# Kwantung leasehold is Liaoning clipped, and Liaoning is drawn underneath it —
# the walk drops a different subset of each, so the two lines part company by
# up to `eps`. At a twentieth of a unit that is nothing at the opening view and
# five pixels at the deepest zoom, which is exactly the size of the flecks of
# Manchuria that were showing all round the leasehold.
FINE_PRECISION = (2, 0.002)


def ring_to_path(points, precision=None):
    nd, eps = precision or path_precision(points)
    d = [f"M{fmt(points[0][0], nd)} {fmt(points[0][1], nd)}"]
    px, py = points[0]
    for x, y in points[1:]:
        if abs(x - px) < eps and abs(y - py) < eps:
            continue
        d.append(f"L{fmt(x, nd)} {fmt(y, nd)}")
        px, py = x, y
    d.append("Z")
    return "".join(d)


# --- Source loading ---------------------------------------------------------

def iter_lines(geom):
    t = geom["type"]
    if t == "LineString":
        yield [(float(c[0]), float(c[1])) for c in geom["coordinates"]]
    elif t == "MultiLineString":
        for line in geom["coordinates"]:
            yield [(float(c[0]), float(c[1])) for c in line]


def line_to_path(points):
    d = [f"M{fmt(points[0][0])} {fmt(points[0][1])}"]
    px, py = points[0]
    for x, y in points[1:]:
        if abs(x - px) < 0.05 and abs(y - py) < 0.05:
            continue
        d.append(f"L{fmt(x)} {fmt(y)}")
        px, py = x, y
    return "".join(d) if len(d) > 1 else ""


def nearest_index(ring, p):
    best, bd = 0, 1e18
    for i, (x, y) in enumerate(ring):
        d = (x - p[0]) ** 2 + (y - p[1]) ** 2
        if d < bd:
            best, bd = i, d
    return best


def boundary_arc(ring, p_from, p_to, via):
    """The stretch of a closed ring between two points, on the side of `via`."""
    i = nearest_index(ring, p_from)
    j = nearest_index(ring, p_to)
    fwd = ring[i:j + 1] if i <= j else ring[i:] + ring[:j + 1]
    back = ring[j:i + 1] if j <= i else ring[j:] + ring[:i + 1]
    back = list(reversed(back))

    def dist(arc):
        return min((x - via[0]) ** 2 + (y - via[1]) ** 2 for x, y in arc)

    return fwd if dist(fwd) <= dist(back) else back


def chaikin(points, passes=2):
    """Round off a hand-drawn polyline without pulling it far off course."""
    for _ in range(passes):
        out = [points[0]]
        for a, b in zip(points, points[1:]):
            out.append((a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25))
            out.append((a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75))
        out.append(points[-1])
        points = out
    return points


def load(name, download):
    path = os.path.join(CACHE, f"{name}.geojson")
    legacy = os.path.join(CACHE, f"ne_50m_{name}.geojson")
    if os.path.exists(legacy) and not os.path.exists(path):
        path = legacy
    if download or not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        path = os.path.join(CACHE, f"{name}.geojson")
        sys.stderr.write(f"downloading {name}...\n")
        urllib.request.urlretrieve(SOURCES[name], path)
    with open(path) as fh:
        return json.load(fh)


# --- Ring splitters for admin-0 ---------------------------------------------

def centroid_of(ring):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return sum(xs) / len(xs), sum(ys) / len(ys)


def split_japan(ring):
    cx, cy = centroid_of(ring)
    if cy < 30.5 and cx < 132.5:
        return "ryukyu"
    if cx > 135.5 and cy < 31.5:
        return "ogasawara"
    return "japan"


def split_russia(ring):
    cx, cy = centroid_of(ring)
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    if 145.0 <= cx <= 157.5 and 43.0 <= cy <= 51.5 and (max(xs) - min(xs)) < 4 and (max(ys) - min(ys)) < 4:
        return "chishima"
    return "ussr"


# Attu and Kiska, taken in June 1942 and held until 1943 — the only North
# American soil Japan occupied. The rest of the chain stayed American, and the
# map used to shade all of it as contested.
ATTU_BOX = (172.2, 52.7, 173.4, 53.1)
KISKA_BOX = (177.0, 51.7, 177.9, 52.2)

# Guadalcanal, where Japanese forces were still ashore in December 1942.
GUADALCANAL_BOX = (159.55, -9.95, 160.90, -9.30)


# The Aleutians named island by island. Longitudes run past 180 here, so 183.5
# is 176.5 W. Only the islands worth naming are listed: the chain has hundreds
# of rocks, and an unnamed one simply answers with the territory.
ALEUTIAN_BOXES = [
    ("Attu", (172.3, 52.70, 173.50, 53.05)),
    ("Agattu", (173.30, 52.30, 173.85, 52.55)),
    ("Shemya & the Semichi Islands", (174.00, 52.65, 174.30, 52.80)),
    ("Buldir", (175.80, 52.30, 176.05, 52.42)),
    ("Kiska", (177.15, 51.80, 177.75, 52.18)),
    ("Rat Island", (178.15, 51.72, 178.45, 51.87)),
    ("Little Sitkin", (178.40, 51.86, 178.65, 52.02)),
    ("Amchitka", (178.60, 51.30, 179.50, 51.70)),
    ("Semisopochnoi", (179.45, 51.84, 179.85, 52.06)),
    ("Amatignak", (180.80, 51.18, 181.00, 51.32)),
    ("Ulak", (181.00, 51.28, 181.12, 51.42)),
    ("Gareloi", (181.10, 51.72, 181.30, 51.86)),
    ("Tanaga", (181.70, 51.56, 182.42, 51.95)),
    ("Kanaga", (182.25, 51.62, 183.00, 51.96)),
    ("Adak", (183.00, 51.55, 183.60, 52.00)),
    ("Kagalaska", (183.55, 51.70, 183.76, 51.89)),
    ("Great Sitkin", (183.78, 51.94, 184.06, 52.13)),
    ("Atka", (184.60, 51.98, 186.02, 52.45)),
    ("Amlia", (185.90, 52.00, 187.10, 52.18)),
    ("Seguam", (187.30, 52.22, 187.75, 52.42)),
    ("Amukta", (188.65, 52.42, 188.82, 52.56)),
    ("Yunaska", (189.10, 52.50, 189.48, 52.73)),
    ("Islands of Four Mountains", (189.95, 52.74, 190.36, 52.92)),
    ("Umnak", (190.85, 52.78, 192.25, 53.60)),
    ("Unalaska", (192.10, 53.20, 193.80, 54.03)),
    ("Akutan", (193.85, 54.00, 194.36, 54.24)),
    ("Akun", (194.30, 54.09, 194.62, 54.31)),
    ("Unimak", (195.00, 54.35, 197.00, 55.05)),
]


# The Kuriles, north-east to south-west down the chain. Japanese held the
# whole of it until 1945, and the northern islands are where the Aleutian
# operation was mounted from.
KURILE_BOXES = [
    ("Shumshu (Shimushu)", (156.10, 50.60, 156.60, 50.90)),
    ("Alaid (Araito)", (155.40, 50.78, 155.72, 50.95)),
    ("Paramushir (Paramushiro)", (155.15, 49.95, 156.16, 50.80)),
    ("Makanrushi (Makanruru)", (154.35, 49.70, 154.52, 49.84)),
    ("Onekotan", (154.58, 49.24, 154.93, 49.67)),
    ("Kharimkotan (Harimukotan)", (154.42, 49.06, 154.62, 49.19)),
    ("Ekarma", (153.88, 48.90, 154.03, 49.00)),
    ("Shiashkotan (Shasukotan)", (153.95, 48.70, 154.25, 48.94)),
    ("Matua (Matsuwa)", (153.14, 48.01, 153.31, 48.15)),
    ("Rasshua (Rasutsuwa)", (152.94, 47.66, 153.09, 47.83)),
    ("Ketoy (Ketoi)", (152.39, 47.28, 152.56, 47.40)),
    ("Simushir (Shimushiru)", (151.68, 46.75, 152.31, 47.19)),
    ("Chirpoy (Chirihoi)", (150.75, 46.42, 150.87, 46.50)),
    ("Urup (Uruppu)", (149.40, 45.56, 150.60, 46.25)),
    ("Etorofu (Iturup)", (146.84, 44.40, 148.88, 45.55)),
    ("Kunashiri (Kunashir)", (145.38, 43.62, 146.60, 44.53)),
    ("Shikotan", (146.58, 43.68, 146.96, 43.90)),
    ("the Habomai Islands", (146.05, 43.44, 146.26, 43.57)),
]

# The Ryukyus, north to south. The chain was Okinawa Prefecture, annexed in
# 1879 and Japanese throughout both dates on this map.
RYUKYU_BOXES = [
    ("Yakushima", (130.36, 30.20, 130.70, 30.48)),
    ("Kuchinoerabujima", (130.12, 30.40, 130.28, 30.50)),
    ("Kuchinoshima", (129.88, 29.93, 129.97, 30.02)),
    ("Nakanoshima", (129.82, 29.80, 129.94, 29.90)),
    ("Tairajima", (129.51, 29.87, 129.57, 29.92)),
    ("Suwanosejima", (129.69, 29.58, 129.77, 29.68)),
    ("Akusekijima", (129.57, 29.43, 129.63, 29.49)),
    ("Kikaijima", (129.90, 28.27, 130.05, 28.39)),
    ("Amami Ōshima", (129.13, 28.06, 129.74, 28.52)),
    ("Tokunoshima", (128.86, 27.66, 129.05, 27.93)),
    ("Okinoerabujima", (128.51, 27.33, 128.72, 27.47)),
    ("Yoronjima", (128.38, 27.00, 128.47, 27.08)),
    ("Iheyajima", (127.92, 26.98, 128.04, 27.11)),
    ("Izenajima", (127.90, 26.89, 127.97, 26.97)),
    ("Iejima", (127.74, 26.62, 127.89, 26.75)),
    ("Okinawa", (127.62, 26.06, 128.35, 26.90)),
    ("the Kerama Islands", (127.20, 26.12, 127.39, 26.27)),
    ("Kumejima", (126.69, 26.28, 126.84, 26.40)),
    ("Miyakojima", (125.12, 24.70, 125.48, 24.93)),
    ("Taramajima", (124.66, 24.62, 124.75, 24.69)),
    ("Ishigakijima", (124.06, 24.30, 124.35, 24.62)),
    ("Iriomotejima", (123.64, 24.24, 123.95, 24.45)),
    ("Haterumajima", (123.74, 24.03, 123.83, 24.09)),
    ("Yonagunijima", (122.92, 24.42, 123.06, 24.49)),
    ("the Daitō Islands", (131.19, 25.79, 131.35, 25.98)),
    ("the Senkaku / Diaoyu Islands", (123.48, 25.74, 123.57, 25.79)),
]

# atom key -> the list of islands it might be one of
# Sub-units that are places rather than administrative divisions, and so are
# named whether or not the Administrative layer is on.
ALWAYS_NAMED = frozenset({"goa", "pondicherry", "christmas", "ccp",
                          "turtle", "mangsee", "miangas", "cocos",
                          "spratly", "paracel", "pratas"})

# Kept in the main file rather than deferred to the Administrative one, without
# thereby being named when that layer is off. The four northern Malay states
# are here because they are the point of that corner of the map — British in
# 1930, handed to Thailand in 1943 — and deferring them meant they had no names
# at all in 1930 and, in 1942, that the outline drawn to mark them out had
# nothing to draw, the atom holding it being empty. They are still states of
# Malaya, though, so with Administrative off they are Malaya and nothing more.
NEVER_DEFERRED = ALWAYS_NAMED | frozenset({"malaya_thai"})

ISLAND_BOXES = {
    "aleutians": ALEUTIAN_BOXES,
    "aleutians_jp": ALEUTIAN_BOXES,
    "chishima": KURILE_BOXES,
    "ryukyu": RYUKYU_BOXES,
}


def island_name(key, ring):
    boxes = ISLAND_BOXES.get(key)
    if not boxes:
        return None
    cx, cy = centroid_of(ring)
    cx = cx + 360 if cx < 0 else cx
    for name, (x0, y0, x1, y1) in boxes:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return name
    return None


# Wake, taken on 23 December 1941 after a fortnight's defence and held to the
# surrender. Natural Earth's 1:10m countries do not carry it at all, so it is
# drawn by hand as Chandernagore is, and marked with an islet ring because at
# this scale it is smaller than the ring. The shape is the atoll's own: a
# wishbone of three islets round a lagoon that opens to the west — Wilkes and
# Wake making the long south-western and eastern arms, Peale the northern one —
# and not the rounded blob it was first given. Traced clockwise from the west
# tip of Wilkes: the ocean shore east and north to Peale's tip, then back along
# the lagoon.
# The Communist base areas and guerrilla zones, 1941–42, traced from sheet 199
# of 武月星主編《中國抗日戰爭史地圖集：1931–1945》. Seventy-five separate areas
# from the Shaan-Gan-Ning border region round Yenan to the coastal pockets of
# Shantung and the Yangtze delta. They are drawn over the occupied shading and
# not instead of it, because that is what they were: country inside the line
# the Japanese army had drawn round itself and did not hold. The occupied zone
# on this map is described as generous for exactly this reason, and this is the
# other half of that sentence.
CCP_FILE = "ccp-resistance-areas-1941-1942-p199.geojson"

# The atlas sheet the base areas are traced from labels its regions and not its
# polygons, and the polygons are many and small. These boxes group them, so
# that hovering any patch of shading answers with the base area it belongs to
# rather than with nothing. First match wins, so the boxes may overlap; the
# polygons themselves are not touched, and nothing is drawn for the boxes —
# they only decide which name a shape carries.
#
# This is a grouping and not a boundary. The areas moved from month to month
# and their edges are not these rectangles; a patch near a border may well be
# filed under its neighbour. What the reader gets is the name of the region
# they are looking at, which is what the sheet's own labels give.
CCP_ZONES = [
    ("Shaan-Gan-Ning", 105.0, 34.5, 110.6, 39.8),
    ("Jin-Sui", 110.6, 36.9, 113.4, 40.6),
    ("Jin-Cha-Ji", 113.4, 37.9, 116.9, 40.6),
    ("Jinan", 114.6, 36.0, 116.4, 37.9),
    ("Taihang and Taiyue", 110.6, 34.8, 114.6, 37.9),
    ("Ji-Lu-Yu", 113.9, 33.6, 117.1, 36.2),
    ("Qinghe", 116.9, 36.98, 119.3, 38.6),
    ("Jiaodong", 119.3, 36.4, 123.2, 38.4),
    ("Luzhong", 116.4, 35.4, 118.6, 36.98),
    ("Binhai", 118.4, 34.4, 119.8, 35.75),
    ("Lunan", 117.1, 34.4, 118.4, 35.75),
    ("Subei", 118.3, 33.15, 120.7, 35.0),
    ("Huainan", 116.8, 31.0, 119.2, 32.95),
    ("Huaibei", 116.4, 32.6, 118.4, 34.4),
    ("Suzhong", 119.2, 32.2, 121.9, 33.2),
    ("Sunan", 118.9, 30.9, 122.0, 32.2),
    ("Wanjiang", 117.2, 30.2, 118.9, 31.9),
    ("Zhedong", 120.5, 29.4, 122.2, 30.6),
    ("E-Yu-Wan", 111.9, 29.5, 116.2, 31.7),
]


def ccp_zone(ring):
    cx, cy = centroid_of(ring)
    for name, x0, y0, x1, y1 in CCP_ZONES:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return name
    return ""

# Christmas Island, annexed to the Straits Settlements in 1900 and run from
# Singapore, and taken by Japan on 31 March 1942 for its phosphate. Natural
# Earth files it under "Indian Ocean Territories" with the Cocos (Keeling)
# group, which is a fact about Australia after 1958 and not about either of the
# dates this map draws; the ring is taken from there and given a name of its
# own. Cocos is left out: it stayed British and Allied throughout, and putting
# it on the map would say something about the Japanese advance that is not so.
# Four groups of islands the map had no shape for, traced out of the OSM
# split-coastlines file by tools/extract_coast.py — 876,182 linestrings, 1.2 GB,
# gitignored; the 37 KB that can be drawn is in the cache and committed.
#
# Each is on the map because who held it is a question rather than an answer.
# The Turtle and Mangsee Islands were administered by the British North Borneo
# Company and allocated to the American Philippines by the treaty of 1930 — the
# transfer did not happen until 1947. Miangas is the Island of Palmas of the
# arbitration of 1928, claimed by the United States as part of the Philippines
# and awarded to the Netherlands. And Cocos was a Straits Settlement in the
# Indian Ocean that Japan shelled but never took, and which stayed Allied
# throughout, with the wireless station that made it worth shelling.
# The islands of the South China Sea. The full set is in the fine layer and is
# fetched only on a deep zoom into that water; what the base map carries is the
# largest island of each group, so the group exists, can be pointed at and can
# be named before any of that is loaded.
# Mengchiang, traced. The client regime used to be drawn as the ENP sheet's
# Chahar and the eastern half of Suiyuan, which is two provinces standing in for
# a state whose boundary was neither of them: it ran round the leagues and
# banners it actually administered, and cut across both. This is that boundary,
# traced in QGIS from the period maps in occupation-maps/ — 358 vertices against
# a province edge and a line of longitude.
#
# It is drawn *over* the provinces rather than instead of them, because they are
# still the 1930 map's Chahar and Suiyuan and are still what the ground outside
# Mengchiang is made of. Every point of it falls inside the ENP provinces —
# checked — so nothing of Mongolia or Manchukuo is painted by it.
# Traced from 支那全土並附近大地圖・欧洲現勢大地圖 rather than from the 1942.12
# sheet that stood here before. It is dated 1940, two years before this map's
# second date, and the note on the territory says what that means.
# Outer Mongolia off the same 1940 sheet, and Nepal and Afghanistan as the 1931
# Imperial Gazetteer drew them. All three replace Natural Earth's modern outline
# of the same ground, which is what the map used before. The features carry no
# names, so each is identified by a point that can only be inside one of them.
OUTER_MONGOLIA_FILE = "outer-mongolia-1940.geojson"
NEPAL_AFGHAN_FILE = "nepal-afghanistan-1931.geojson"
NEPAL_AFGHAN_POINTS = (("nepal", (85.32, 27.71)),        # Kathmandu
                       ("afghanistan", (69.18, 34.53)))  # Kabul

MENGJIANG_FILE = "mengjiang-1940.geojson"
_MENGJIANG_CACHE = []


def load_mengjiang():
    """The traced rings of Mengchiang, or [] if the file is not there."""
    if _MENGJIANG_CACHE:
        return _MENGJIANG_CACHE[0]
    path = os.path.join(CACHE, MENGJIANG_FILE)
    out = []
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    for ring in iter_rings(feat.get("geometry") or {}):
                        if len(ring) >= 3:
                            out.append(ring)
        except (OSError, ValueError):
            sys.stderr.write(f"note: {MENGJIANG_FILE} unreadable\n")
    else:
        sys.stderr.write(f"note: {MENGJIANG_FILE} missing, Mengchiang not traced\n")
    _MENGJIANG_CACHE.append(out)
    return out


# Manchukuo, traced from 滿洲國地圖 1935, 南滿洲鐡道株式會社資料課 — the South
# Manchuria Railway's own sheet of the state it was the instrument of. Two
# files: the state as one polygon, which is what is drawn when the
# Administrative layer is off, and its fourteen provinces for when it is on.
#
# It is an atom of its own and does not replace `manchuria` and `jehol`, which
# are the ENP sheet's Chinese provinces and are what the 1930 map is made of.
# It could not replace them even if that were wanted: Jehol is a province of
# Manchukuo in this source, annexed in 1933, and on the 1930 map it is a
# province of the Republic standing outside Manchuria altogether. So 1930 keeps
# the Three Eastern Provinces and Jehol beside them, and 1942 gets this. The
# same division of labour Mengchiang has.
#
# The province scheme is Manchukuo's own and dates from 1934, which is the
# other reason it is not shown on the 1930 map: those are not the provinces
# China had there.
# The Kwantung Leased Territory, traced by hand from a 1935 sheet: the mainland
# in one ring of 227 points and nineteen islands with it, where the leasehold
# used to be Liaoning clipped by a half-plane and a bounding box. Half-plane
# clipping is convex-only, so the old cut gave the leasehold a coast with
# corners taken off it and Manchuria's filler showed through each one.
KWANTUNG_FILE = "kwantung-1935.geojson"
_KWANTUNG_CACHE = []


def load_kwantung():
    """The traced leasehold, or [] if the file is not there."""
    if _KWANTUNG_CACHE:
        return _KWANTUNG_CACHE[0]
    path = os.path.join(CACHE, KWANTUNG_FILE)
    out = []
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    for ring in iter_rings(feat.get("geometry") or {}):
                        if len(ring) >= 3:
                            out.append(ring)
        except (OSError, ValueError):
            sys.stderr.write(f"note: {KWANTUNG_FILE} unreadable\n")
    else:
        sys.stderr.write(f"note: {KWANTUNG_FILE} missing, "
                         "the leasehold falls back to the old cut\n")
    _KWANTUNG_CACHE.append(out)
    return out


MANCHUKUO_FILE = "manchukuo-1935.geojson"
MANCHUKUO_PROVINCES_FILE = "manchukuo-provinces-v2.geojson"
_MANCHUKUO_CACHE = []
_MANCHUKUO_PROV_CACHE = []


def load_manchukuo():
    """Manchukuo as one polygon, or [] if the file is not there."""
    if _MANCHUKUO_CACHE:
        return _MANCHUKUO_CACHE[0]
    path = os.path.join(CACHE, MANCHUKUO_FILE)
    out = []
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    for ring in iter_rings(feat.get("geometry") or {}):
                        if len(ring) >= 3:
                            out.append(ring)
        except (OSError, ValueError):
            sys.stderr.write(f"note: {MANCHUKUO_FILE} unreadable\n")
    else:
        sys.stderr.write(f"note: {MANCHUKUO_FILE} missing\n")
    _MANCHUKUO_CACHE.append(out)
    return out


def load_manchukuo_provinces():
    """[(name, rings)] for Manchukuo's fourteen provinces, or []."""
    if _MANCHUKUO_PROV_CACHE:
        return _MANCHUKUO_PROV_CACHE[0]
    path = os.path.join(CACHE, MANCHUKUO_PROVINCES_FILE)
    out = []
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    props = feat.get("properties") or {}
                    # The sheet's own romanisation is the period one — Hsing An
                    # Peh, Chinchow, Je Hol — and that is the name a reader of
                    # 1935 would have met. Pinyin is carried beside it in
                    # texts/, where every other place keeps both.
                    name = (props.get("Name_old") or props.get("Name") or "").strip()
                    rings = [r for r in iter_rings(feat.get("geometry") or {})
                             if len(r) >= 3]
                    if name and rings:
                        out.append((name, rings))
        except (OSError, ValueError):
            sys.stderr.write(f"note: {MANCHUKUO_PROVINCES_FILE} unreadable\n")
    else:
        sys.stderr.write(f"note: {MANCHUKUO_PROVINCES_FILE} missing\n")
    _MANCHUKUO_PROV_CACHE.append(out)
    return out


SCS_ISLANDS = "scs-islands.geojson"
SCS_ATOMS = {
    "Spratly Islands": "spratly",
    "Paracel Islands": "paracel",
    "Pratas": "pratas",
}
SCS_COARSE_KM2 = 0.30       # the handful big enough to stand for their group
_SCS_CACHE = {}


def load_scs_islands(min_km2=0.0):
    """group -> rings, from the fine file, as closed lists of lon/lat."""
    key = round(min_km2, 4)
    if key in _SCS_CACHE:
        return _SCS_CACHE[key]
    path = os.path.join(CACHE, SCS_ISLANDS)
    out = collections.defaultdict(list)
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    props = feat.get("properties") or {}
                    if (props.get("km2") or 0) < min_km2:
                        continue
                    g = feat.get("geometry") or {}
                    if g.get("type") != "LineString":
                        continue
                    ring = [(x, y) for x, y in g["coordinates"]]
                    if len(ring) > 3 and ring[0] == ring[-1]:
                        ring = ring[:-1]
                    if len(ring) >= 3 and props.get("group") in SCS_ATOMS:
                        out[props["group"]].append(ring)
        except (OSError, ValueError):
            sys.stderr.write(f"note: {SCS_ISLANDS} unreadable\n")
    else:
        sys.stderr.write(f"note: {SCS_ISLANDS} missing, its islands not drawn\n")
    _SCS_CACHE[key] = dict(out)
    return _SCS_CACHE[key]


OUTER_ISLANDS = "outer-islands.geojson"

# The coast round Guangzhou Bay, traced from the same OSM coastlines, and used
# as a limit on the carve rather than as a shape to draw. See where the bay is
# cut out of China, below: the leasehold's convex hull takes in a good deal of
# the Leizhou mainland as well as the water, and this says which is which.
# Natural Earth was tried in this role first and is the wrong instrument — it
# resolves the bay and not the tidal creeks, so it took the mainland back and
# brought a yellow rim along every shore of the leasehold with it. This
# coastline resolves the creeks: 26 rings and 5,730 vertices against Natural
# Earth's dozen-point bay.
# The coastline is pulled back from its own edge before it is used to protect
# ground from the carve. The traced coast and the traced lease are two drawings
# of one shore and part company by a few hundred metres, so protecting the coast
# exactly left a thread of ENP's Kwangtung standing between the lease's edge and
# the coast's — the yellow along every creek, which is the thing the carve is
# for. Shrunk by a kilometre, the protection keeps the mainland and lets go of
# the fringe. It is only ever used to decide what to carve, never drawn.
GZW_COAST_SHRINK = -0.009

GZW_COAST = "guangzhouwan-coast.geojson"
_GZW_CACHE = {}


def load_gzw_coast():
    """The rings of land round Guangzhou Bay, or [] if the file is absent."""
    if _GZW_CACHE:
        return _GZW_CACHE.get("d", [])
    path = os.path.join(CACHE, GZW_COAST)
    out = []
    if os.path.exists(path):
        try:
            with open(path) as fh:
                for feat in json.load(fh).get("features", []):
                    g = feat.get("geometry") or {}
                    if g.get("type") != "Polygon":
                        continue
                    ring = [(x, y) for x, y in g["coordinates"][0]]
                    if len(ring) >= 3:
                        out.append(ring)
        except (OSError, ValueError):
            sys.stderr.write(f"note: {GZW_COAST} unreadable\n")
    _GZW_CACHE["d"] = out
    return out
# ---- the Pacific mandates --------------------------------------------------
#
# The three Class C League of Nations mandates over the former German Pacific,
# as they stood in 1927: Japan's north of the equator, Australia's over New
# Guinea and the Bismarcks, and the British one over Nauru. They are drawn as
# outlines and nothing else, because that is what they are — a mandate over an
# ocean is a line on a chart, and almost all the ground inside these lines is
# water. Filling them would bury the islands they are about.
#
# This replaces the hand-drawn rectangle that used to stand for the Japanese
# mandate alone, and which was switched off in map.js for being an
# approximation not good enough to sit beside the rest of the map.
MANDATES_FILE = "pacific-mandates-1927.geojson"
MANDATE_ATOMS = {
    "Japan": "mandate_jp",
    "Australia": "mandate_au",
    "Britain": "mandate_br",
}

# Guam is inside the Japanese mandate's line and was never in the mandate: the
# United States had held it since 1898, and it is the reason the Marianas are
# "the Marianas except Guam" in every description of the South Seas Mandate. A
# box round it says so, drawn in the American colour and in the same dashed
# grammar as the mandate lines it is an exception to. Built from Guam's own
# extent plus this margin rather than typed out, so it cannot come loose from
# the island if the coastline is ever redrawn.
GUAM_BOX_MARGIN = 0.28          # degrees
_MANDATE_CACHE = {}


def load_mandates():
    """{atom: [rings]} for the three Pacific mandates, or {}."""
    if _MANDATE_CACHE:
        return _MANDATE_CACHE.get("d", {})
    path = os.path.join(CACHE, MANDATES_FILE)
    out = collections.defaultdict(list)
    if not os.path.exists(path):
        sys.stderr.write("note: %s missing, no mandate outlines\n" % MANDATES_FILE)
        _MANDATE_CACHE["d"] = {}
        return {}
    try:
        with open(path) as fh:
            for feat in json.load(fh).get("features", []):
                power = (feat.get("properties") or {}).get("admin_power")
                key = MANDATE_ATOMS.get(power)
                if not key:
                    sys.stderr.write("note: mandate power %r not in the table\n" % power)
                    continue
                for ring in iter_rings(feat.get("geometry") or {}):
                    if len(ring) >= 3:
                        out[key].append(ring)
    except (OSError, ValueError):
        sys.stderr.write("note: %s unreadable\n" % MANDATES_FILE)
    if out:
        sys.stderr.write(
            "Pacific mandates: "
            + ", ".join("%s %d rings, %d vertices"
                        % (k, len(v), sum(len(r) for r in v))
                        for k, v in sorted(out.items())) + "\n")
    _MANDATE_CACHE["d"] = dict(out)
    return _MANDATE_CACHE["d"]


# ---- the islands east of the date line ------------------------------------
#
# Everything the map had east of the Gilberts was one invisible box saying
# "Polynesia is off this map". A good deal of it is not: the Line Islands, the
# Phoenix Islands, Tokelau, the northern Cooks and a scatter of American
# guano-act possessions all fall inside the frame, and they are the ground the
# Allied supply line to Australia ran across. They are cut out of Natural
# Earth's countries by this box, and drawn only where they also fall inside the
# map's own bounds — which, out here, the eastern edge decides.
PACIFIC_EAST_BOXES = [
    # east of the date line: the Line and Phoenix groups and the rest
    [(206.19354, 13.91489), (180.71812, 13.84194),
     (180.64297, -13.18254), (205.96809, -12.88969)],
    # and the Ellice Islands, west of it. They are the other half of the colony
    # the Gilberts belonged to and were on no version of this map: the 1930
    # record was called "Gilbert & Ellice Islands" and drew the Gilberts alone.
    # It matters most on the 1942 map, where Japan held the Gilberts and never
    # reached the Ellice, so drawing them one colour would have been false.
    [(175.0, -5.0), (180.6, -5.0), (180.6, -11.6), (175.0, -11.6)],
]

# Natural Earth is a modern source and these are named for what they were.
# Every polygon the box selects is matched to the nearest entry here and takes
# its name and its atom from it; anything selected that matches nothing is
# still drawn, under its Natural Earth name, and reported — the box is the
# authority on what is included and this table only says what to call it.
#
# The three atoms are the three flags. It happens that Natural Earth's modern
# sovereign would have done as well, because none of this changed hands between
# then and now — Kiribati is the Gilbert and Ellice Islands Colony under
# another name, and the American and New Zealand possessions are still theirs —
# but the islands are named one by one here anyway, so the map can say Canton
# and Fanning rather than "Kiribati".
PACIFIC_EAST = [
    # The Line Islands, British, run from the Gilbert and Ellice Islands Colony
    (199.600, 4.714, "Washington Island (Teraina)", "linephoenix"),
    (200.678, 3.858, "Fanning Island (Tabuaeran)", "linephoenix"),
    (202.598, 1.880, "Christmas Island (Kiritimati)", "linephoenix"),
    (205.023, -4.063, "Malden Island", "linephoenix"),
    (204.102, -5.618, "Starbuck Island", "linephoenix"),
    # The Phoenix Islands, the same colony. Canton and Enderbury were claimed
    # by both Britain and the United States and put under a joint
    # administration in 1939, which is in the record's note rather than in a
    # colour of its own.
    (188.332, -2.824, "Canton Island (Kanton)", "linephoenix"),
    (188.911, -3.131, "Enderbury Island", "linephoenix"),
    (188.751, -4.455, "Hull Island (Orona)", "linephoenix"),
    (187.793, -4.509, "Sydney Island (Manra)", "linephoenix"),
    (185.480, -4.680, "Gardner Island (Nikumaroro)", "linephoenix"),
    # American, most of them claimed under the Guano Islands Act
    (197.606, 6.439, "Kingman Reef", "uspacific"),
    (197.918, 5.882, "Palmyra Atoll", "uspacific"),
    (183.362, 0.800, "Howland Island", "uspacific"),
    (183.530, 0.209, "Baker Island", "uspacific"),
    (199.979, -0.379, "Jarvis Island", "uspacific"),
    (188.921, -11.057, "Swains Island (Olohega)", "uspacific"),
    # New Zealand: the northern Cook Islands, and Tokelau, which New Zealand
    # took over from the Gilbert and Ellice Islands Colony in 1925
    (202.029, -8.970, "Penrhyn (Tongareva)", "nzpacific"),
    (198.918, -10.036, "Rakahanga", "nzpacific"),
    (199.020, -10.386, "Manihiki", "nzpacific"),
    (194.183, -10.884, "Pukapuka", "nzpacific"),
    (187.512, -8.565, "Atafu", "nzpacific"),
    (188.807, -9.350, "Fakaofo", "nzpacific"),
    # The Ellice Islands, British, the southern half of the Gilbert and Ellice
    # Islands Colony. Nine rings for eight islands — Nukulaelae comes as two.
    (176.136, -5.689, "Nanumea", "ellice"),
    (176.319, -6.296, "Nanumanga", "ellice"),
    (177.346, -6.115, "Niutao", "ellice"),
    (177.152, -7.195, "Nui", "ellice"),
    (178.684, -7.481, "Vaitupu", "ellice"),
    (178.381, -8.055, "Nukufetau", "ellice"),
    (179.203, -8.509, "Funafuti", "ellice"),
    (179.872, -9.350, "Nukulaelae", "ellice"),
    (179.904, -9.402, "Nukulaelae", "ellice"),
]
PACIFIC_EAST_TOL = 0.3          # degrees; a match further off than this is not one
_PACIFIC_EAST_CACHE = {}


def load_pacific_east():
    """{atom: [(island name, rings)]} for the islands east of the date line."""
    if _PACIFIC_EAST_CACHE:
        return _PACIFIC_EAST_CACHE.get("d", {})
    path = os.path.join(CACHE, "admin0.geojson")
    out = collections.defaultdict(lambda: collections.defaultdict(list))
    if not os.path.exists(path):
        sys.stderr.write("note: admin0.geojson missing, no eastern Pacific\n")
        _PACIFIC_EAST_CACHE["d"] = {}
        return {}
    kept = skipped = unnamed = 0
    with open(path) as fh:
        data = json.load(fh)
    for feat in data.get("features", []):
        props = feat.get("properties") or {}
        ne_name = props.get("NAME_EN") or props.get("NAME") or "?"
        for ring in iter_rings(feat.get("geometry") or {}):
            if len(ring) < 3:
                continue
            # Natural Earth is in -180..180 and this map's frame runs east from
            # `LON_MIN`, so the far Pacific arrives as a negative number and has
            # to be turned into the map's own reading of the same meridian
            r = [(x + 360 if x < LON_MIN else x, y) for x, y in ring]
            cx = sum(p[0] for p in r) / len(r)
            cy = sum(p[1] for p in r) / len(r)
            if not any(point_in_ring((cx, cy), box) for box in PACIFIC_EAST_BOXES):
                continue
            # and only if it is on the map at all: the box overhangs the frame
            # at both the eastern edge and the southern one
            if not (LON_MIN <= cx <= LON_MAX and LAT_MIN <= cy <= LAT_MAX):
                skipped += 1
                continue
            best, bd = None, PACIFIC_EAST_TOL
            for lon, lat, name, atom in PACIFIC_EAST:
                d = math.hypot(cx - lon, cy - lat)
                if d < bd:
                    bd, best = d, (name, atom)
            if best is None:
                unnamed += 1
                sys.stderr.write(
                    "note: eastern Pacific ring at %.3f, %.3f is in the box and "
                    "in no table entry — drawn as %s\n" % (cx, cy, ne_name))
                best = (ne_name, "linephoenix")
            out[best[1]][best[0]].append(r)
            kept += 1
    sys.stderr.write(
        "eastern Pacific: %d rings kept, %d outside the frame, %d unnamed; %s\n"
        % (kept, skipped, unnamed,
           ", ".join("%s %d islands" % (k, len(v)) for k, v in sorted(out.items()))))
    res = {k: sorted(v.items()) for k, v in out.items()}
    _PACIFIC_EAST_CACHE["d"] = res
    return res


OUTER_ATOMS = {
    # Labuan is not an atom of its own: it is a sub-unit of North Borneo, and
    # the traced rings replace the adm1 polygon there. It is in the same file
    # because it comes from the same source in the same way.
    "Turtle Islands": "turtle",
    "Mangsee Islands": "mangsee",
    "Miangas": "miangas",
    "Cocos (Keeling) Islands": "cocos",
}
_OUTER_CACHE = {}


def load_outer_islands():
    """group name -> its rings, or {} if the file is not there."""
    if _OUTER_CACHE:
        return _OUTER_CACHE.get("d", {})
    path = os.path.join(CACHE, OUTER_ISLANDS)
    out = collections.defaultdict(list)
    if os.path.exists(path):
        try:
            with open(path) as fh:
                fc = json.load(fh)
            for feat in fc.get("features", []):
                g = feat.get("geometry") or {}
                name = (feat.get("properties") or {}).get("group")
                # Every group in the file, not only the ones that are atoms:
                # Labuan is a sub-unit of North Borneo and comes from here too.
                if g.get("type") != "Polygon" or not name:
                    continue
                ring = [(x, y) for x, y in g["coordinates"][0]]
                if len(ring) >= 3:
                    out[name].append(ring)
        except (OSError, ValueError):
            sys.stderr.write(f"note: {OUTER_ISLANDS} unreadable\n")
    else:
        sys.stderr.write(f"note: {OUTER_ISLANDS} missing, outer islands not drawn\n")
    _OUTER_CACHE["d"] = dict(out)
    return _OUTER_CACHE["d"]


CHRISTMAS_ISLAND = [
    (105.7041, -10.4308), (105.7147, -10.4372), (105.7127, -10.4509),
    (105.7114, -10.4699), (105.7063, -10.4942), (105.7063, -10.5143),
    (105.6979, -10.5290), (105.6999, -10.5534), (105.6946, -10.5649),
    (105.6787, -10.5660), (105.6735, -10.5491), (105.6672, -10.5333),
    (105.6641, -10.5185), (105.6493, -10.5131), (105.6282, -10.5090),
    (105.6050, -10.5100), (105.5850, -10.5164), (105.5818, -10.5048),
    (105.5923, -10.4985), (105.5996, -10.4806), (105.5942, -10.4667),
    (105.5942, -10.4540), (105.6072, -10.4584), (105.6271, -10.4689),
    (105.6546, -10.4699), (105.6693, -10.4562), (105.6852, -10.4404),
]

WAKE = [
    # the southern ocean shore, west to east: Wilkes, then Wake
    (166.5960, 19.2790), (166.6060, 19.2800), (166.6160, 19.2795),
    (166.6270, 19.2785), (166.6390, 19.2780), (166.6500, 19.2800),
    (166.6580, 19.2840),
    # round the south-eastern point and up the ocean side of Wake
    (166.6625, 19.2900), (166.6635, 19.2980), (166.6600, 19.3060),
    (166.6555, 19.3140), (166.6500, 19.3200),
    # Peale, north-westward to its tip
    (166.6440, 19.3240), (166.6350, 19.3245), (166.6260, 19.3225),
    (166.6180, 19.3180), (166.6130, 19.3130),
    # back along Peale's lagoon shore
    (166.6200, 19.3140), (166.6290, 19.3170), (166.6370, 19.3180),
    (166.6430, 19.3150),
    # down the lagoon shore of Wake's eastern arm
    (166.6480, 19.3080), (166.6510, 19.3000), (166.6520, 19.2930),
    (166.6470, 19.2880),
    # and west along the lagoon shore of the southern arm
    (166.6370, 19.2855), (166.6250, 19.2850), (166.6130, 19.2855),
    (166.6030, 19.2840),
]


def split_usa(ring):
    cx, cy = centroid_of(ring)
    cx = cx + 360 if cx < 0 else cx
    if 17.0 <= cy <= 23.5 and 198.0 <= cx <= 206.0:
        return "hawaii"
    if cy >= 50.0:
        for x0, y0, x1, y1 in (ATTU_BOX, KISKA_BOX):
            if x0 <= cx <= x1 and y0 <= cy <= y1:
                return "aleutians_jp"
        return "aleutians"
    return None


# The British Solomons in December 1942 were four different things at once.
# Japan held the western islands; the Americans had landed on Guadalcanal in
# August and were still fighting for it; Tulagi and the Florida group had
# fallen to them on 8 August; and Malaita, San Cristobal and Rennell were never
# occupied at all. Assigned by the centroid of each island.
SOLOMON_BOXES = [
    ("solomons_gc", (159.5, -10.0, 160.9, -9.2)),      # Guadalcanal
    ("solomons_us", (159.9, -9.20, 160.5, -8.90)),     # Tulagi and the Floridas
    ("solomons_ml", (160.5, -9.75, 161.5, -8.20)),     # Malaita
    # everything Japan actually held: the western chain, from the Shortlands
    # and Choiseul down through the New Georgia group to Santa Isabel and the
    # Russells. Naming this rather than defaulting to it matters, because the
    # protectorate reached 800 km further east than the occupation did. The
    # southern edge stops short of the Russell Islands and Savo: Japan used
    # both during the Guadalcanal fighting but garrisoned neither, and in
    # December they were no man's land rather than occupied ground.
    ("solomons_br", (155.0, -8.90, 160.4, -6.30)),
]

# San Cristobal, Ulawa, Rennell and Bellona, and the Santa Cruz group away to
# the east: British throughout, and never taken.
SOLOMON_DEFAULT = "solomons_al"


def split_solomons(ring):
    cx, cy = centroid_of(ring)
    for key, (x0, y0, x1, y1) in SOLOMON_BOXES:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return key
    return SOLOMON_DEFAULT


def split_taiwan(ring):
    """Kinmen is Fujian's, not the colony's."""
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    x0, y0, x1, y1 = KINMEN_BOX
    if x0 < min(xs) and max(xs) < x1 and y0 < min(ys) and max(ys) < y1:
        return None
    return "taiwan"


def split_malaysia(ring):
    # every Malaysian state comes from the ADM1 file instead, so they can be
    # named and, in the north, told apart. The outline is still wanted as the
    # filler that goes under them, which is what MALAYSIA_BACKING is for.
    return None


def malaysia_backing(ring):
    """Which atom a Malaysian outline ring belongs under."""
    cx, cy = centroid_of(ring)
    if cx < 105.0:
        return "malaya"
    if cy > 5.5 or cx > 117.0:
        return "northborneo"
    return "sarawak"


def split_india(ring):
    cx, cy = centroid_of(ring)
    if 91.0 < cx < 95.5 and 5.0 < cy < 14.5:
        return "andaman"
    return "india"


ADMIN0 = {
    # Korea is drawn from its own period provinces, not from these two
    "Mongolia": "mongolia",
    "Vietnam": "indochina", "Laos": "indochina", "Cambodia": "indochina",
    "Thailand": "siam",
    "Myanmar": "burma",
    "Brunei": "brunei",
    "Indonesia": "dei",
    "Philippines": "philippines",
    "Papua New Guinea": "newguinea_au",

    "East Timor": "timor_pt",
    "Palau": "nanyo", "Federated States of Micronesia": "nanyo",
    "Marshall Islands": "nanyo", "Northern Mariana Islands": "nanyo",
    "Nauru": "nauru_au",
    "Singapore and its islands": "malaya",
    "Spratly Islands": "spratly",
    "Paracel Islands": "paracel",
    "Pratas": "pratas",
    "Ulleung and the Liancourt Rocks": "korea",
    "Guam": "guam",
    "Kiribati": "gilberts",
    "Pakistan": "india", "Bangladesh": "india",
    "Sri Lanka": "ceylon",
    "Siachen Glacier": "india",
    "Australia": "australia",
    "Hong Kong S.A.R.": "hongkong",
    "Macao S.A.R": "macau",
    "Kazakhstan": "ussr", "Kyrgyzstan": "ussr", "Tajikistan": "ussr",
    "Turkmenistan": "ussr", "Uzbekistan": "ussr",
    "Afghanistan": "other",
}

SPLITTERS = {
    "Japan": split_japan,
    "Taiwan": split_taiwan,
    "Russia": split_russia,
    "United States of America": split_usa,
    "Malaysia": split_malaysia,
    "Solomon Islands": split_solomons,
    "India": split_india,
    "Singapore": lambda r: "malaya",
}

# Islands too small to see are marked with a ring. In the Pacific that is the
# only way to find them at all; over the Indies, the Philippines and the
# Andamans, where the islands are perfectly legible, the rings are just clutter.
ISLET_RINGS = {
    "wake", "christmas", "miangas", "cocos",
    "linephoenix", "uspacific", "nzpacific", "ellice",
    "nanyo", "gilberts", "ogasawara", "guam", "chishima", "aleutians",
    "hawaii", "ryukyu", "newguinea_au", "solomons_br", "nauru_au",
    "aleutians_jp", "solomons_gc", "solomons_us", "solomons_ml", "solomons_al",
}

# Groups whose islets are close enough together that one ring stands for all
# of them — see where specks are built, below.
ONE_ISLET = {"cocos"}

ARCHIPELAGOS = {
    "wake", "turtle", "mangsee", "miangas", "cocos",
    "linephoenix", "uspacific", "nzpacific", "ellice",
    "spratly", "paracel", "pratas",
    "nanyo", "gilberts", "ogasawara", "guam", "chishima", "aleutians",
    "aleutians_jp",
    "hawaii", "ryukyu", "newguinea_au", "solomons_br", "philippines",
    "timor_pt", "andaman", "nauru_au", "hongkong", "macau", "northborneo",
    "malaya", "solomons_gc", "solomons_us", "solomons_ml", "solomons_al",
}

# Which of those name their sub-units with the Administrative layer off. Being
# an archipelago is not the test: what matters is whether the sub-units are
# places or divisions. The Philippines is drawn from its 1939 provinces, Malaya
# and North Borneo from their states, and those are administrative units and
# belong to the switch — the Philippines was naming Cebu Province, and Malaya
# Selangor, whether the reader had asked for divisions or not.
ADMIN_SUBUNITS = {"philippines", "malaya", "northborneo"}

# Drawn after the occupied shading, so the small enclaves it would otherwise
# bury are still there to see and to click.
ON_TOP = ["weihaiwei", "guangzhouwan", "macau", "hongkong", "kwantung", "ccp",
          # the un-pacified areas sit over the pacified ones for the same
          # reason the base areas sit over the occupation: they are what
          # the shading beneath them is an overstatement of
          "nca_unpacified"]

ORDER = [
    # first, so that anything real drawn over it wins the pointer
    # under chinabase, which is itself a filler
    "chinabase_land",
    "chinabase", "andaman", "ceylon", "ussr", "mongolia", "tibet",
    "china", "xinjiang", "india", "princely", "goa", "pondicherry",
    "other", "nepal", "sikkim", "bhutan",
    "tuva", "weihaiwei", "guangzhouwan",
    # the occupation goes in here: over China, whose ground it is, and under
    # Mengjiang and Manchukuo, which were client states with their own colour
    # and not part of the shading. The resistance areas stay above it, being in
    # ON_TOP, because they are what the shading is an overstatement of.
    "mandate_jp", "mandate_au", "mandate_br", "mandate_ex_guam",
    "occupiedzone", "nca_pacified", "chahar", "suiyuan", "suiyuan_w", "mengjiang",
    "jehol", "manchuria", "manchukuo",
    "siam", "burma", "saharat", "indochina", "siamgain", "malaya", "malaya_thai", "sarawak", "northborneo", "brunei",
    "dei", "philippines", "christmas", "spratly", "paracel", "pratas", "turtle", "mangsee", "miangas", "cocos",
    "timor_pt", "newguinea_au", "solomons_br", "australia", "gilberts",
    "nauru_au", "guam", "wake", "hawaii", "aleutians", "aleutians_jp", "hongkong", "macau",
    "solomons_gc", "solomons_us", "solomons_ml", "solomons_al",
    "linephoenix", "uspacific", "nzpacific", "ellice",
    "korea", "taiwan", "karafuto", "chishima", "nanyo", "ryukyu",
    "ogasawara", "japan", "kwantung", "ccp",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--tolerance", type=float, default=0.55)
    ap.add_argument("--min-area", type=float, default=1.2)
    ap.add_argument("--legacy", action="store_true",
                    help="build the slow way: none of the optimisations, and "
                         "neither reading nor writing the seam cache. What the "
                         "output is checked against.")
    ap.add_argument("--no-index", action="store_true",
                    help="scan every ring edge instead of the latitude index")
    ap.add_argument("--no-cache", action="store_true",
                    help="recompute the frontier seams rather than reading them")
    ap.add_argument("--probe-bound", action="store_true",
                    help="skip seam probes too short to reach the target. Off "
                         "by default: it costs 0.6s more than it saves unless "
                         "--no-index is also given")
    ap.add_argument("--no-fast-name", action="store_true",
                    help="compare every fine ring with every OSM name")
    ap.add_argument("--jobs", type=int, default=1, metavar="N",
                    help="worker processes for the frontier seams (default 1; "
                         "0 for one per core)")
    ap.add_argument("--export", metavar="DIR", default=None,
                    help="also write the map's geometry as GeoJSON, in lon/lat, "
                         "for use in QGIS")
    args = ap.parse_args()

    OPT.index = not (args.legacy or args.no_index)
    OPT.cache = not (args.legacy or args.no_cache)
    OPT.probe_bound = args.probe_bound and not args.legacy
    OPT.fast_name = not (args.legacy or args.no_fast_name)
    if args.legacy:
        OPT.jobs = 1
    elif args.jobs == 0:
        OPT.jobs = max(1, (os.cpu_count() or 1))
    else:
        OPT.jobs = max(1, args.jobs)
    if args.legacy:
        sys.stderr.write("legacy build: no index, no cache, no probe bound, "
                         "no name index, one process\n")

    a0 = load("admin0", args.download)

    groups = collections.defaultdict(list)
    # The neutral ground under the interior gaps — see LAND_BASE above. It goes
    # in first so it is under everything, including chinabase.
    for bx0, by0, bx1, by1 in LAND_BASE:
        groups["chinabase_land"].append(
            [(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)])
    # Chinese atoms keep their provinces as separate sub-paths, so hovering can
    # name the province as well as the country.
    provinces = collections.defaultdict(list)
    # whole-country outlines kept aside to go under the sub-units; see
    # whole_union below
    backing = collections.defaultdict(list)

    # British India as it stood in 1931, traced. It goes in before anything
    # else so that the modern countries and their first-level units, which used
    # to stand in for it, can see that it is here and stand down.
    india_traced = [r for _p, rs in load_traced(INDIA_1931_FILE) for r in rs]
    if india_traced:
        groups["india"].extend(india_traced)
        backing["india"].extend(india_traced)
        sys.stderr.write("British India: %d traced rings (%d vertices), "
                         "one outline and %d holes\n"
                         % (len(india_traced), sum(len(r) for r in india_traced),
                            len(india_traced) - 1))
    # Outer Mongolia, Nepal and Afghanistan from period sources, each replacing
    # Natural Earth's modern outline of the same country. Loaded before the
    # Natural Earth sweep so that it can see they are here and stand down.
    outer_mongolia = [r for _p, rs in load_traced(OUTER_MONGOLIA_FILE) for r in rs]
    if outer_mongolia:
        groups["mongolia"].extend(outer_mongolia)
        sys.stderr.write("Outer Mongolia: traced, %d rings (%d vertices)\n"
                         % (len(outer_mongolia),
                            sum(len(r) for r in outer_mongolia)))

    neighbours_1931 = {}
    for _props, _rings in load_traced(NEPAL_AFGHAN_FILE):
        for _key, _pt in NEPAL_AFGHAN_POINTS:
            if any(point_in_ring(_pt, r) for r in _rings):
                if _key in neighbours_1931:
                    sys.stderr.write("note: two shapes in %s claim %s; the "
                                     "second is ignored\n"
                                     % (NEPAL_AFGHAN_FILE, _key))
                    break
                neighbours_1931[_key] = _rings
                break
        else:
            sys.stderr.write("note: a shape in %s holds neither Kathmandu nor "
                             "Kabul and is not drawn\n" % NEPAL_AFGHAN_FILE)
    if "nepal" in neighbours_1931:
        groups["nepal"].extend(neighbours_1931["nepal"])
    # Afghanistan is not a country this map names: it is drawn as Elsewhere,
    # with the rest of the ground beyond the frame of the story.
    if "afghanistan" in neighbours_1931:
        groups["other"].extend(neighbours_1931["afghanistan"])
    for _k, _rs in sorted(neighbours_1931.items()):
        sys.stderr.write("%s: traced 1931, %d rings (%d vertices)\n"
                         % (_k, len(_rs), sum(len(r) for r in _rs)))

    # The North China Area Army's own reading of the same ground, off the same
    # sheet. Not clipped to China's land: the areas are traced from a land map
    # and clipping them to the `china` atom would cut whatever falls over Jehol
    # or the Manchukuo border, which is ground the sheet does map.
    for _nca_key, _nca_file in NCA_ATOMS.items():
        _nca_rings = [r for _p, rs in load_traced(_nca_file) for r in rs]
        if _nca_rings:
            groups[_nca_key].extend(_nca_rings)
            sys.stderr.write("%s: %d traced rings (%d vertices)\n"
                             % (_nca_key, len(_nca_rings),
                                sum(len(r) for r in _nca_rings)))

    # rings added to a filler on top of whatever it builds itself from, rather
    # than replacing it: China's coastal islands, and the seams that make one
    # country reach a neighbour drawn from a different source. They cannot go
    # into `backing`, because a filler with no entry there falls back to the
    # union of its own sub-units and a key would silently replace that.
    extra = collections.defaultdict(list)
    china_islands = []
    # Natural Earth's own coastline of China, kept whether or not it is drawn:
    # Guangzhou Bay is cut out of the Republican provinces with it.
    ne_china_rings = []

    # ---- everything except China ------------------------------------------
    for feat in a0["features"]:
        admin = feat["properties"].get("ADMIN")
        if admin in ("Hong Kong S.A.R.", "Macao S.A.R"):
            # the backing needs them: ENP's Kwangtung stops at the colony's
            # border, so the ground between the two belongs to neither layer
            for ring in iter_rings(feat["geometry"]):
                groups["chinabase"].append(ring)
        if admin == "China":
            ne_china_rings.extend(iter_rings(feat["geometry"]))
            # China itself is drawn from the Republican provinces, but its
            # modern outline is kept as a backing layer. The two sources put
            # the land border in slightly different places, and without
            # something underneath those disagreements show as slivers of
            # ocean between China and its neighbours at deep zoom.
            #
            # It used to be cut in two so each half could take the colour of
            # what sits on top of it. That put a straight line of land across
            # the Bohai Gulf — the cut leaves the coast at Shanhaiguan and
            # comes ashore again on the Liaodong peninsula — and it made every
            # seam along a frontier read as one country leaking into another.
            # One piece in a neutral land colour is both simpler and honester:
            # a seam then looks like a seam.
            #
            # Its islands are another matter. The Republican provinces do not
            # carry the small ones, so an island Natural Earth knows about had
            # nothing over it and was drawn in the neutral colour, as if it
            # belonged to nobody — Shijiutuo, in the Gulf of Chihli, is the one
            # that gave this away. Every ring but the mainland is given to
            # China's own filler, which puts the coastal islands in the
            # country. The mainland ring is deliberately left out of it: that is
            # the ring whose land frontiers disagree with the Republican
            # provinces, and colouring those disagreements China's yellow rather
            # than the neutral grey is what the neutral grey exists to avoid.
            for ring in iter_rings(feat["geometry"]):
                if china_island(ring):
                    # which atom it belongs to is settled later, once the
                    # Republican provinces are loaded: the islands off the
                    # Liaotung peninsula are Manchuria's, not China's
                    groups["chinabase"].append(ring)
                    china_islands.append(ring)
                elif abs(signed_ring_area(ring)) / 2.0 > 1.0:
                    # The mainland, and it is not drawn at all — see
                    # NE_CHINA_MAINLAND above for why, and set that to True to
                    # put it back.
                    if NE_CHINA_MAINLAND:
                        groups["chinabase"].append(ring)
                        extra["china"].append(ring)
                else:
                    groups["chinabase"].append(ring)
            continue
        if admin == "Russia":
            kurils = collections.defaultdict(list)
            for ring in iter_rings(feat["geometry"]):
                xs = [p[0] for p in ring]
                ys = [p[1] for p in ring]
                # Sakhalin: south of the 50th parallel is Karafuto
                if 140.0 < min(xs) and max(xs) < 146.0 and 45.0 < min(ys) and max(ys) < 55.0:
                    south = clip_halfplanes(ring, box_planes(LON_MIN, LAT_MIN, LON_MAX, 50.0))
                    north = clip_halfplanes(ring, box_planes(LON_MIN, 50.0, LON_MAX, LAT_MAX))
                    if len(south) >= 3:
                        groups["karafuto"].append(south)
                    if len(north) >= 3:
                        groups["ussr"].append(north)
                    continue
                rkey = split_russia(ring)
                groups[rkey].append(ring)
                label = island_name(rkey, ring)
                if label:
                    kurils[label].append(ring)
            for label in sorted(kurils):
                provinces["chishima"].append((label, kurils[label]))
            continue
        if admin in ("South Korea", "North Korea"):
            # Korea is drawn from its period provinces and nothing else. They
            # are the finer source, they weld into a clean country outline,
            # and a modern coastline underneath would only show through where
            # the two disagree — which is what made a selected province stop
            # short of the sea.
            continue
        if admin == "Malaysia":
            for ring in iter_rings(feat["geometry"]):
                # Malaysia has its own branch, so it never met the test below
                # that keeps a foreign outline from being laid under states
                # that are already the finer source of the same coast
                key = malaysia_backing(ring)
                if key not in BACKING_FROM_SUBUNITS:
                    backing[key].append(ring)
            continue
        splitter = SPLITTERS.get(admin)
        if splitter:
            named = collections.defaultdict(lambda: collections.defaultdict(list))
            for ring in iter_rings(feat["geometry"]):
                key = splitter(ring)
                # India's splitter sends the Andamans one way and the mainland
                # the other, and the mainland has to stand down for the 1931
                # tracing here as well as in the plain branch below. It did not,
                # so the modern outline was drawn under the traced one and the
                # atom was the union of the two: Arunachal Pradesh, the whole
                # of Kashmir and the Chittagong tracts back inside the Raj.
                if key == "india" and india_traced:
                    continue
                if key:
                    groups[key].append(ring)
                    backing[key].append(ring)
                    label = island_name(key, ring)
                    if label:
                        named[key][label].append(ring)
                    # the most important of the Straits Settlements, and the
                    # one the pointer could not name
                    if admin == "Singapore":
                        provinces["malaya"].append(("Singapore", [ring]))
            for key, by_label in named.items():
                for label in sorted(by_label):
                    provinces[key].append((label, by_label[label]))
            continue
        key = ADMIN0.get(admin)
        if not key:
            continue
        # India, Pakistan and Bangladesh together stood in for British India.
        # With the 1931 tracing in hand they have nothing to say.
        if key == "india" and india_traced:
            continue
        # and the same for the three neighbours now drawn from period sources
        if key == "mongolia" and outer_mongolia:
            continue
        if key == "nepal" and "nepal" in neighbours_1931:
            continue
        if admin == "Afghanistan" and "afghanistan" in neighbours_1931:
            continue
        rings_here = list(iter_rings(feat["geometry"]))
        if admin in ("Laos", "Cambodia"):
            # Drawn from provinces below, minus the 1941 cessions — and the
            # filler underneath used to be the whole country, cessions and all.
            # That is the ground Thailand was given, so on the 1942 map it put
            # Indochina's own colour under Thailand's and, worse, gave
            # Indochina's outline the shape it had before the cession: hovering
            # French Indochina drew a black line round Battambang, Siem Reap
            # and the trans-Mekong strip, which by then were Thailand's. The
            # filler comes from the provinces now, so it stops where they stop.
            continue
        groups[key].extend(rings_here)
        if key not in BACKING_FROM_SUBUNITS:
            backing[key].extend(rings_here)
        if admin == "Vietnam":
            lap = 0.02
            tonkin_n = grow_plane(line_plane(*TONKIN_CUT, keep_right=False), lap)
            tonkin_s = grow_plane(line_plane(*TONKIN_CUT, keep_right=True), lap)
            cochin_n = grow_plane(line_plane(*COCHIN_CUT, keep_right=False), lap)
            cochin_s = grow_plane(line_plane(*COCHIN_CUT, keep_right=True), lap)
            north = [tonkin_n]
            south = [cochin_s]
            mid = [tonkin_s, cochin_n]
            for label, planes in (("Tonkin", north), ("Annam", mid), ("Cochinchina", south)):
                cut = [c for c in (clip_halfplanes(r, planes) for r in rings_here) if len(c) >= 3]
                if cut:
                    provinces["indochina"].append((label, cut))
        elif admin == "Papua New Guinea":
            for label, above in (("NewGuineaMandate", True), ("Papua", False)):
                cut = [c for c in (clip_to_polyline(r, PAPUA_CUT_LINE, above, 0.02)
                                   for r in rings_here) if len(c) >= 3]
                if cut:
                    provinces["newguinea_au"].append((label, cut))

    # ---- the French and Portuguese establishments -------------------------
    # Traced, and named in the tracing itself, so the settlements no longer have
    # to be told apart by which bounding box their centroid falls in. Each is
    # one sub-unit: Mahé on the Malabar coast and Yanaon on the Godavari were as
    # French as Pondicherry, and Dadrá and Nagar Aveli, which the modern unit
    # runs together, were two.
    traced_enclaves = False
    for _fname, _key in ((FRENCH_INDIA_FILE, "pondicherry"),
                         (PORTUGUESE_INDIA_FILE, "goa")):
        _feats = load_traced(_fname)
        if not _feats:
            continue
        traced_enclaves = True
        _named = []
        for _props, _rings in _feats:
            _raw = (_props.get("name") or "").strip()
            _label = TRACED_ENCLAVE_NAMES.get(_raw)
            if not _label:
                sys.stderr.write("note: %s has an unexpected name %r, kept as it "
                                 "stands\n" % (_fname, _raw))
                _label = _raw
            groups[_key].extend(_rings)
            provinces[_key].append((_label, _rings))
            _named.append(_label)
        sys.stderr.write("%s: %d traced settlements (%s)\n"
                         % (_key, len(_feats), ", ".join(_named)))

    ind_path = os.path.join(CACHE, "adm1_IND.json")
    if os.path.exists(ind_path) and not traced_enclaves:
        with open(ind_path) as fh:
            for feat in json.load(fh)["features"]:
                name = feat["properties"].get("shapeName")
                key = INDIA_ENCLAVES.get(name)
                if key:
                    named = collections.defaultdict(list)
                    for ring in iter_rings(feat["geometry"]):
                        groups[key].append(ring)
                        label = enclave_name(ring)
                        if label:
                            named[label].append(ring)
                    for label in sorted(named):
                        provinces[key].append((label, named[label]))
    # ---- the princely states, from the 1931 layer --------------------------
    ppath = os.path.join(CACHE, PRINCELY_FILE)
    if os.path.exists(ppath):
        with open(ppath) as fh:
            named = collections.defaultdict(list)
            rest = []
            for feat in json.load(fh)["features"]:
                props = feat.get("properties") or {}
                label = PRINCELY_NAMES.get(props.get("fid")) or props.get("name")
                rs = list(iter_rings(feat["geometry"]))
                groups["princely"].extend(rs)
                if label:
                    named[label].extend(rs)
                else:
                    rest.extend(rs)
            for label in sorted(named):
                provinces["princely"].append((label, named[label]))
            # An atom drawn from provinces is drawn *only* from them, so the
            # states the table does not name have to go in too or they vanish
            # off the map. The empty label means the pointer names the
            # territory and offers no guess at the state.
            if rest:
                provinces["princely"].append(("", rest))

    # ---- the Communist base areas, 1941-42 ---------------------------------
    cpath = os.path.join(CACHE, CCP_FILE)
    if os.path.exists(cpath):
        zones = collections.defaultdict(list)
        with open(cpath) as fh:
            for feat in json.load(fh)["features"]:
                for ring in iter_rings(feat["geometry"]):
                    if len(ring) >= 3:
                        groups["ccp"].append(ring)
                        zones[ccp_zone(ring)].append(ring)
        for label in sorted(zones):
            provinces["ccp"].append((label, zones[label]))
        unplaced = len(zones.get("", []))
        sys.stderr.write(
            f"base areas: {len(groups['ccp'])} shapes in {len(zones)} zones"
            + (f", {unplaced} unplaced" if unplaced else "") + "\n")
    else:
        sys.stderr.write(f"note: {CCP_FILE} missing, base areas not drawn\n")

    # ---- the outer islands, traced from the OSM coastlines -----------------
    # Four groups the map had no shape for, each of them a place where the
    # question of who held it is the point. See OUTER_ISLANDS.
    outer = load_outer_islands()
    for gname, key in OUTER_ATOMS.items():
        rings = outer.get(gname, [])
        if not rings:
            sys.stderr.write(f"note: no rings for {gname}\n")
            continue
        groups[key].extend(rings)
        provinces[key].append((gname, rings))
    if outer:
        sys.stderr.write(
            "outer islands: "
            + ", ".join(f"{g} {len(outer.get(g, []))}" for g in OUTER_ATOMS)
            + "\n")

    meng = load_mengjiang()
    if meng:
        groups["mengjiang"].extend(meng)
        provinces["mengjiang"].append(("Mengjiang", meng))
        sys.stderr.write(
            "Mengchiang: %d traced rings, %d vertices\n"
            % (len(meng), sum(len(r) for r in meng)))

    # Manchukuo: the whole is traced in its own right rather than dissolved out
    # of the provinces, so `backing` is set from it directly. The two files
    # agree — same source, same sheet — and a dissolve of fourteen provinces
    # would only put the sheet's own outline back with rounding on top of it.
    manchukuo = load_manchukuo()
    mk_provs = load_manchukuo_provinces()
    if manchukuo:
        # `groups` is the country's own shape — what the seams are cut against
        # and what the perimeter takes its arc off — so it gets the traced whole
        # and not the provinces as well. Putting both in left seventeen
        # overlapping rings for `dissolve` to fail to merge, since the two files
        # share no vertices even though they agree.
        groups["manchukuo"].extend(manchukuo)
        backing["manchukuo"].extend(manchukuo)
    for pname, prings in mk_provs:
        provinces["manchukuo"].append((pname, prings))
    if manchukuo or mk_provs:
        sys.stderr.write(
            "Manchukuo: %d rings whole (%d vertices), %d provinces (%d vertices)\n"
            % (len(manchukuo), sum(len(r) for r in manchukuo), len(mk_provs),
               sum(len(r) for _, rs in mk_provs for r in rs)))

    for _key, _rings in load_mandates().items():
        groups[_key].extend(_rings)
    # and the hole in the Japanese one, taken off Guam's own coastline
    if groups.get("mandate_jp") and groups.get("guam"):
        _gx = [p[0] for r in groups["guam"] for p in r]
        _gy = [p[1] for r in groups["guam"] for p in r]
        _m = GUAM_BOX_MARGIN
        groups["mandate_ex_guam"].append([
            (min(_gx) - _m, min(_gy) - _m), (max(_gx) + _m, min(_gy) - _m),
            (max(_gx) + _m, max(_gy) + _m), (min(_gx) - _m, max(_gy) + _m),
        ])
        sys.stderr.write(
            "Guam: excluded from the mandate by a box %.2f..%.2f E, %.2f..%.2f N\n"
            % (min(_gx) - _m, max(_gx) + _m, min(_gy) - _m, max(_gy) + _m))

    for _key, _islands in load_pacific_east().items():
        for _name, _rings in _islands:
            groups[_key].extend(_rings)
            provinces[_key].append((_name, _rings))

    scs = load_scs_islands(SCS_COARSE_KM2)
    for gname, key in SCS_ATOMS.items():
        rs = scs.get(gname) or []
        if not rs:
            continue
        groups[key].extend(rs)
        provinces[key].append((gname, rs))
    if scs:
        sys.stderr.write(
            "South China Sea: "
            + ", ".join(f"{g} {len(scs.get(g, []))}" for g in SCS_ATOMS)
            + " coarse islands\n")

    groups["wake"].append(list(WAKE))
    groups["christmas"].append(list(CHRISTMAS_ISLAND))
    provinces["christmas"].append(("Christmas Island", [list(CHRISTMAS_ISLAND)]))
    if not traced_enclaves:
        # no modern unit answers to Chandernagore; without the tracing it is a
        # rectangle drawn by hand
        groups["pondicherry"].append(list(CHANDERNAGORE))
        provinces["pondicherry"].append(("Chandernagore", [list(CHANDERNAGORE)]))

    # ---- Burma, division by division ---------------------------------------
    bpath = os.path.join(CACHE, "adm1_MMR.json")
    if os.path.exists(bpath):
        with open(bpath) as fh:
            blocks = collections.defaultdict(list)
            for feat in json.load(fh)["features"]:
                pname = feat["properties"].get("shapeName")
                label = BURMA_DIVISIONS.get(pname)
                if not label:
                    continue
                blocks[label].extend(iter_rings(feat["geometry"]))
            for label, rs in blocks.items():
                provinces["burma"].append((label, rs))

    # ---- the provinces and states of British India -------------------------
    # Drawn from India, Pakistan and Bangladesh together, since Punjab and
    # Bengal were single provinces until 1947.
    blocks = collections.defaultdict(list)
    for iso in ("IND", "PAK", "BGD"):
        path = os.path.join(CACHE, f"adm1_{iso}.json")
        if not os.path.exists(path):
            sys.stderr.write(f"note: adm1_{iso}.json missing, part of India not split\n")
            continue
        # Asked for: no provinces of British India for now, only the princely
        # states over it. The modern first-level units were the only source for
        # them and they do not fit the traced outline — measured against it,
        # a tenth of their vertices fall outside, and not by a little: Arunachal
        # Pradesh by up to 107 km, Mizoram by 51, Ladakh by 45, which are the
        # frontier tracts the tracing deliberately leaves out. Drawing them
        # would have put the Raj 100 km past its own line wherever the
        # Administrative layer was switched on.
        if india_traced:
            continue
        with open(path) as fh:
            for feat in json.load(fh)["features"]:
                shape = feat["properties"].get("shapeName")
                if shape in INDIA_NOT_DRAWN:
                    continue
                label = INDIA_STATES.get(shape)
                # The modern states that were mostly princely — Rajasthan,
                # Telangana, Karnataka, Kerala, Kashmir — answer to no British
                # province, so they go in under the empty label: the ground is
                # British India, the princely layer is drawn over it, and with
                # that layer switched off the pointer still finds the country
                # and offers no province, which is the truth about it.
                blocks[label or ""].extend(iter_rings(feat["geometry"]))
    for label, rs in blocks.items():
        provinces["india"].append((label, rs))

    # ---- Siam, changwat by changwat ----------------------------------------
    tpath = os.path.join(CACHE, "adm1_THA.json")
    if os.path.exists(tpath):
        with open(tpath) as fh:
            blocks = collections.defaultdict(list)
            for feat in json.load(fh)["features"]:
                name = (feat["properties"].get("shapeName") or "")
                name = name[:-9].strip() if name.endswith(" Province") else name
                name = SIAM_SPLITS.get(name, name)
                blocks[name.replace(" ", "")].extend(iter_rings(feat["geometry"]))
            for label, rs in blocks.items():
                provinces["siam"].append((label, rs))

    # ---- the Netherlands Indies, residency by residency ---------------------
    ipath = os.path.join(CACHE, "adm1_IDN.json")
    if os.path.exists(ipath):
        with open(ipath) as fh:
            blocks = collections.defaultdict(list)
            for feat in json.load(fh)["features"]:
                label = DEI_RESIDENCIES.get(feat["properties"].get("shapeName"))
                if label:
                    blocks[label].extend(iter_rings(feat["geometry"]))
            for label, rs in blocks.items():
                provinces["dei"].append((label, rs))

    # ---- the Philippines, province by province ------------------------------
    ppath = os.path.join(CACHE, "adm2_PHL_1939.json")
    if os.path.exists(ppath):
        with open(ppath) as fh:
            blocks = collections.defaultdict(list)
            for feat in json.load(fh)["features"]:
                blocks[feat["properties"]["shapeName"]].extend(iter_rings(feat["geometry"]))
            for label, rs in blocks.items():
                provinces["philippines"].append((label, rs))

    # ---- the Shan states east of the Salween, Thai-held from 1942 ----------
    spath = os.path.join(CACHE, SAHARAT_FILE)
    if os.path.exists(spath):
        with open(spath) as fh:
            for feat in json.load(fh)["features"]:
                pname = feat["properties"]["shapeName"]
                rs = list(iter_rings(feat["geometry"]))
                if pname in SAHARAT_WHOLE:
                    keep = rs
                elif pname in SAHARAT_PARTIAL:
                    east = [line_plane((SAHARAT_PARTIAL[pname], 0.0),
                                       (SAHARAT_PARTIAL[pname], 90.0), keep_right=True)]
                    keep = [c for c in (clip_halfplanes(r, east) for r in rs) if len(c) >= 3]
                else:
                    continue
                if keep:
                    groups["saharat"].extend(keep)
                    provinces["saharat"].append(
                        ("Kengtung" if pname in SAHARAT_WHOLE else "MongpanEast", keep))
    else:
        sys.stderr.write(f"note: {SAHARAT_FILE} missing, Saharat Thai Doem not drawn\n")

    # ---- Korea, province by province ---------------------------------------
    kpath = os.path.join(CACHE, KOREA_FILE)
    if os.path.exists(kpath):
        with open(kpath) as fh:
            for feat in json.load(fh)["features"]:
                pname = feat["properties"]["shapeName"]
                rs = list(iter_rings(feat["geometry"]))
                provinces["korea"].append((pname, rs))
                groups["korea"].extend(rs)
    else:
        sys.stderr.write(f"note: {KOREA_FILE} missing, Korea not drawn\n")

    # ---- Japan, prefecture by prefecture -----------------------------------
    jpath = os.path.join(CACHE, "adm1_JPN.json")
    if os.path.exists(jpath):
        with open(jpath) as fh:
            for feat in json.load(fh)["features"]:
                pname = (feat["properties"].get("shapeName") or "").replace(" Prefecture", "")
                if not pname:
                    continue
                bucket = "ryukyu" if pname == "Okinawa" else "japan"
                provinces[bucket].append((pname.replace(" ", ""), list(iter_rings(feat["geometry"]))))

    # ---- layers from the Modern East Asia GIS project ----------------------
    # Sikkim and Bhutan, traced. The file names neither, so each is claimed by
    # the capital that falls inside it — Gangtok and Thimphu. Nepal is not in
    # it, and rightly: it was an independent kingdom in treaty with Britain,
    # not a protectorate, and it keeps the layer it had.
    protectorates = {}
    for _props, _rings in load_traced(INDIA_PROTECTORATES_FILE):
        for _key, (_lon, _lat) in (("sikkim", (88.61, 27.33)),
                                   ("bhutan", (89.64, 27.47))):
            if any(point_in_ring((_lon, _lat), r) for r in _rings):
                if _key in protectorates:
                    sys.stderr.write("note: two traced shapes claim %s; the "
                                     "second is ignored\n" % _key)
                    break
                protectorates[_key] = _rings
                break
        else:
            sys.stderr.write("note: a shape in %s holds neither Gangtok nor "
                             "Thimphu and is not drawn\n"
                             % INDIA_PROTECTORATES_FILE)
    for _key, _rings in protectorates.items():
        groups[_key].extend(_rings)
        sys.stderr.write("%s: traced, %d rings (%d vertices)\n"
                         % (_key, len(_rings), sum(len(r) for r in _rings)))

    for key, fname in GIS_LAYERS.items():
        if key in protectorates:
            continue
        # Nepal is drawn from the 1931 Gazetteer now, not from the Wuhan project
        if key == "nepal" and "nepal" in neighbours_1931:
            continue
        path = os.path.join(CACHE, "gis", fname)
        if not os.path.exists(path):
            sys.stderr.write(f"note: {fname} missing, {key} not drawn\n")
            continue
        dx, dy = GIS_NUDGE.get(key, (0.0, 0.0))
        for ring in gpkg.rings_lonlat(path):
            if len(ring) >= 3:
                if dx or dy:
                    ring = [(x + dx, y + dy) for x, y in ring]
                for tx, ty, mx, my, span in GIS_VERTEX_NUDGE.get(key, ()):
                    k = min(range(len(ring)),
                            key=lambda i: (ring[i][0] - tx) ** 2 + (ring[i][1] - ty) ** 2)
                    if math.hypot(ring[k][0] - tx, ring[k][1] - ty) > 1e-4:
                        continue          # not this ring
                    moved = list(ring)
                    for j in range(-span, span + 1):
                        i = (k + j) % len(ring)
                        f = 0.5 * (1 + math.cos(math.pi * j / (span + 1)))
                        moved[i] = (moved[i][0] + mx * f, moved[i][1] + my * f)
                    ring = moved
                groups[key].append(ring)

    # Sikkim out of India, now that both are loaded. See cut_out_sikkim(). The
    # traced outline of 1931 already leaves Sikkim out, so there is nothing to
    # cut and the run-replacement would only find its own boundary.
    if groups.get("sikkim") and not india_traced:
        for _store, _name in ((groups, "groups"), (backing, "backing")):
            if _store.get("india"):
                _cut, _n = cut_out_sikkim(_store["india"], groups["sikkim"])
                _store["india"] = _cut
                if _n:
                    sys.stderr.write("Sikkim: %d points of India's %s ring "
                                     "replaced by its southern border\n"
                                     % (_n, _name))

    # ---- Laos and Cambodia, minus the territory ceded in 1941 -------------
    # Drawn province by province rather than as whole countries, so that the
    # blocks handed to Thailand are cut out of Indochina rather than covered
    # over by a shape laid on top of them. On the 1930 map the two are put back
    # together, because the cession had not happened yet; in December 1942 the
    # outline of Indochina stops where the cession begins.
    for iso, label in (("KHM", "Cambodia"), ("LAO", "Laos")):
        path = os.path.join(CACHE, f"adm1_{iso}.json")
        if not os.path.exists(path):
            sys.stderr.write(f"note: {path} missing, {label} drawn whole\n")
            continue
        keep = []
        wanted = SIAM_1941_KHM if iso == "KHM" else SIAM_1941_LAO
        with open(path) as fh:
            for feat in json.load(fh)["features"]:
                pname = feat["properties"].get("shapeName")
                if pname in wanted:
                    continue
                if iso == "LAO" and pname == "Champasak":
                    east = box_planes(SIAM_1941_CHAMPASAK_WEST, -90, 360, 90)
                    for ring in iter_rings(feat["geometry"]):
                        piece = clip_halfplanes(ring, east)
                        if len(piece) >= 3:
                            keep.append(piece)
                    continue
                keep.extend(iter_rings(feat["geometry"]))
        if keep:
            groups["indochina"].extend(keep)
            provinces["indochina"].append((label, keep))

    # ---- territory ceded to Thailand in 1941 -------------------------------
    for iso, wanted in (("KHM", SIAM_1941_KHM), ("LAO", SIAM_1941_LAO)):
        path = os.path.join(CACHE, f"adm1_{iso}.json")
        if not os.path.exists(path):
            sys.stderr.write(f"note: {path} missing, Thai gains not drawn\n")
            continue
        with open(path) as fh:
            adm1 = json.load(fh)
        for feat in adm1["features"]:
            pname = feat["properties"].get("shapeName")
            if pname in wanted:
                rs = list(iter_rings(feat["geometry"]))
                groups["siamgain"].extend(rs)
                # on the 1930 map this ground is simply Cambodia and Laos, and
                # the pointer should say so
                provinces["siamgain"].append(
                    ("Cambodia" if iso == "KHM" else "Laos", rs))
            elif iso == "LAO" and pname == "Champasak":
                west = box_planes(0, -90, SIAM_1941_CHAMPASAK_WEST, 90)
                cut = []
                for ring in iter_rings(feat["geometry"]):
                    piece = clip_halfplanes(ring, west)
                    if len(piece) >= 3 and ring_area(piece) > 0.002:
                        cut.append(piece)
                if cut:
                    groups["siamgain"].extend(cut)
                    provinces["siamgain"].append(("Laos", cut))

    # ---- the Borneo states -------------------------------------------------
    borneo_path = os.path.join(CACHE, "adm1_MYS.json")
    if os.path.exists(borneo_path):
        with open(borneo_path) as fh:
            for feat in json.load(fh)["features"]:
                pname = feat["properties"].get("shapeName")
                key = BORNEO_MYS.get(pname) or MALAYA_MYS.get(pname)
                if key:
                    prings = list(iter_rings(feat["geometry"]))
                    # Labuan comes from the traced coastline instead: see below
                    if key == "northborneo" and pname == "Labuan":
                        traced = load_outer_islands().get("Labuan") or []
                        if traced:
                            prings = traced
                    groups[key].extend(prings)
                    if key in ("malaya", "malaya_thai"):
                        label = {"Kuala Lumpur": "Selangor", "Putrajaya": "Selangor"}.get(pname, pname)
                        provinces[key].append((label.replace(" ", ""), prings))
                        if pname == "Perak":
                            # The Dindings — Lumut, Sitiawan and Pangkor — were
                            # a Straits Settlement from 1826 and went back to
                            # Perak in 1935, so no modern unit answers to them.
                            # Drawn as Perak clipped to the coastal strip and
                            # laid over Perak in the same colour: it changes
                            # nothing to look at and gives the pointer
                            # something to name.
                            cut = [c for c in (clip_halfplanes(r, hull_planes(DINDINGS_HULL))
                                               for r in prings) if len(c) >= 3]
                            if cut:
                                provinces[key].append(("Dindings", cut))
                    elif key == "northborneo" and pname == "Labuan":
                        # a Straits Settlement in 1930, not chartered-company
                        # territory, and worth being able to name.
                        #
                        # Drawn from the traced coastline rather than from the
                        # adm1 polygon, which at any depth of zoom is a fan of
                        # thin spikes and wedges rather than an island — the
                        # same fault as the Johor starburst, and the same cause.
                        # The traced island is 91.0 km2 against the 92 the
                        # gazetteers give, and brings Pulau Daat, Kuraman and
                        # the two Rusukan islets with it.
                        provinces[key].append(("Labuan", prings))

    # ---- the northern Malay states -----------------------------------------
    mys_path = os.path.join(CACHE, "adm1_MYS.json")
    if os.path.exists(mys_path):
        with open(mys_path) as fh:
            for feat in json.load(fh)["features"]:
                pn = feat["properties"].get("shapeName")
                if pn in SIAM_1943_MYS:
                    prings = list(iter_rings(feat["geometry"]))
                    groups["malaya_thai"].extend(prings)
                    provinces["malaya_thai"].append((pn, prings))

    # ---- China, by Republican province ------------------------------------
    kwantung_planes = ([line_plane(KWANTUNG_CUT[0], KWANTUNG_CUT[1], keep_right=True)]
                       + box_planes(*KWANTUNG_BOX))
    kwantung_traced = load_kwantung()
    if kwantung_traced:
        groups["kwantung"].extend(kwantung_traced)
        sys.stderr.write("Kwantung: %d traced rings (%d vertices)\n"
                         % (len(kwantung_traced),
                            sum(len(r) for r in kwantung_traced)))
    tally = collections.Counter()

    for att, rings in shapefile.read(ENP_PROVINCES):
        name = (att.get(ENP_NAME_FIELD) or "").strip()
        if not name or not rings:
            continue
        key = PROVINCE_ATOM.get(name) or "china"

        # Suiyuan is split at Paotow: only the east was Mengchiang's in fact.
        # The west goes to an atom of its own rather than into China, so that
        # the 1930 map can put the two halves back together — the cut is a fact
        # about 1942 and there was no such line in 1930, when Suiyuan had been
        # one province since 1928. Two atoms of one territory share a fill and
        # a stroke and show no boundary between them, so on that date it is one
        # province again and says so once.
        if name == "Suiyuan":
            # the same two conditions as in province_paths, above
            east = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=True),
                    line_plane((0.0, SUIYUAN_ORDOS_LAT), (180.0, SUIYUAN_ORDOS_LAT),
                               keep_right=False)]
            west = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=False)]
            ordos = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=True),
                     line_plane((0.0, SUIYUAN_ORDOS_LAT), (180.0, SUIYUAN_ORDOS_LAT),
                                keep_right=True)]
            for sides, dest, label in (([east], "suiyuan", "Suiyuan"),
                                       ([west, ordos], "suiyuan_w", "SuiyuanWest")):
                cut = []
                for side in sides:
                    cut.extend(c for c in (clip_halfplanes(r, side) for r in rings)
                               if len(c) >= 3)
                if cut:
                    tally[dest] += 1
                    groups[dest].extend(cut)
                    provinces[dest].append((label, cut))
            continue

        tally[key] += 1
        groups[key].extend(rings)
        provinces[key].append((name, rings))

        # The leasehold is carved out of Liaoning and drawn on top of it, and
        # it takes every piece of Liaoning inside the cut, however small.
        # Dropping the small ones left Liaoning showing through the leasehold
        # as a scatter of yellow flecks round its coast: the islands of the
        # Changshan group and the rocks off Dairen were the country underneath
        # showing where the leasehold above it had thrown them away.
        if name == "Liaoning" and not kwantung_traced:
            # The fallback, kept for a build without the traced file. Cut from
            # the *dissolved* province, which is the geometry the map draws
            # Manchuria from: clipping the raw rings gave the leasehold a coast
            # a few hundred metres off Manchuria's, and the province showed
            # through the difference as yellow chips round Pulandian bay.
            for ring in (dissolve(rings) if len(rings) > 1 else rings):
                piece = clip_halfplanes(ring, kwantung_planes)
                if len(piece) >= 3:
                    groups["kwantung"].append(piece)


    sys.stderr.write("provinces assigned: " + ", ".join(
        f"{k}={v}" for k, v in sorted(tally.items(), key=lambda kv: -kv[1])) + "\n")

    # ---- the 1942 greatest-extent line -------------------------------------
    def outlines(keys):
        rings = []
        for k in keys:
            rings.extend(groups.get(k, []))
        if not rings:
            return []
        merged = dissolve(rings) or rings
        return [r for r in merged if len(r) >= 3]

    def outline(keys):
        rings = outlines(keys)
        return max(rings, key=ring_area) if rings else None

    def ring_for(rings, a, b):
        """The ring an arc's two anchors actually sit on.

        French Indochina is Natural Earth's Vietnam next to geoBoundaries' Laos
        and Cambodia, and no dissolve will weld two sources together: the
        outline comes back as two rings of almost the same size. Taking the
        larger one put the arc on the Lao frontier and left the whole of Tonkin
        — Hanoi, Haiphong, Lang Son — outside the line."""
        def near(ring, p):
            return min((x - p[0]) ** 2 + (y - p[1]) ** 2 for x, y in ring)
        return min(rings, key=lambda r: near(r, a) + near(r, b))

    extent = []
    extent += chaikin(china_front())
    # the coastal islands count as land here: a line of control drawn across
    # one is drawn over ground, and Natural Earth's islands are the only record
    # of most of them
    _china_land = ([r for k in ENP_SIDE for r in groups.get(k, ())]
                   + list(groups.get("chinabase", [])))
    _on_land = _ring_test(_china_land)
    _south = hug_coast(chaikin(EXTENT_SOUTH_CHINA), _on_land,
                       coast=(_grid_of(_china_land, 0.5), 0.5))
    # and the four detours redrawn round the traced blocks — see
    # EXTENT_ENCLAVES. The hand-drawn course still bulged on ellipses while the
    # shading under it had the real shapes.
    _occ_by_block = collections.defaultdict(list)
    for _label, _ring in load_occupied_rings():
        _occ_by_block[_label].append(_ring)
    for _name, _box, _extra_keys in EXTENT_ENCLAVES:
        _rings = _occ_by_block.get(_name) or []
        _extra = [r for k in _extra_keys for r in (groups.get(k) or [])]
        if _rings:
            _south = enclave_detour(_south, _rings, _box, _on_land,
                                    extra=_extra)
    extent += _south
    for key, a, b, via in EXTENT_ARCS:
        rings = outlines([key])
        if rings:
            arc = boundary_arc(ring_for(rings, a, b), a, b, via)
            extent += simplify(arc, 0.03)
    extent += chaikin(EXTENT_OCEAN)
    for keys, a, b, via in EXTENT_MANCHURIA:
        _arc_rings = []
        for k in keys:
            _arc_rings.extend(groups.get(k) or [])
        _merged = dissolve(_arc_rings) or _arc_rings
        _merged = [r for r in _merged if len(r) >= 3]
        ring = max(_merged, key=ring_area) if _merged else None
        if ring:
            extent += simplify(boundary_arc(ring, a, b, via), 0.03)

    # the occupied zone, clipped to China's land so it stops at the coast and
    # at the frontier instead of being drawn as a blob over the sea
    occ_frame = box_planes(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX)
    occ_out = []
    occ_pieces, occ_moments = [], []
    occ_src = load_occupied_rings()
    if occ_src:
        sys.stderr.write(f"occupied zone: {len(occ_src)} traced rings\n")
    else:
        occ_src = [(OCCUPIED_BLOCKS[n] if n < len(OCCUPIED_BLOCKS) else "",
                    normalise_ring(chaikin(b, 2)))
                   for n, b in enumerate(OCCUPIED_ZONE)]

    # An island the trace cuts in half. The zone's seaward edge is a line drawn
    # across open water, and where it happens to pass over one of China's
    # coastal islands the island comes out part shaded and part not: Shijiutuo,
    # ten kilometres off the Kailan coast in the Gulf of Chihli, was a yellow
    # spike of unoccupied China in a gulf that was held all the way round —
    # Tientsin, Tangshan, Chinwangtao and the railway along it.
    #
    # An island is one place. Where the trace already covers part of one, the
    # whole of it is drawn held; where the trace does not reach an island at
    # all, nothing is claimed for it. So this completes the source's own answer
    # and never extends it, which is the same rule the east coast was given
    # when the islands were made to go with the coast they were blockaded from.
    occ_src = list(occ_src)
    # Mengchiang's own ring, grown a quarter degree, used to be added here so
    # that the occupation would reach under it: the two are traced from
    # different sheets, and where their common boundary is two lines rather
    # than one a ribbon of unoccupied yellow lay between them. It was the wrong
    # instrument. A ring grown is grown on every side, and Mengchiang's other
    # sides face Mongolia and Free China, where there is no occupation for the
    # ribbon to join up with — so a quarter degree of army shading stood along
    # the north-western frontier, outside the client state, with the line of
    # control drawn round the outside of that. What actually closed the ribbon
    # was widening `clip-china` to admit Chahar and Suiyuan (see below); with
    # that done this adds nothing. Sampled along the boundary at four places,
    # west, south-west, south and east: no Free China yellow between the two
    # anywhere, and the spill gone.
    if china_islands:
        boxed = []
        for label, ring in occ_src:
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            boxed.append((min(xs), min(ys), max(xs), max(ys), label, ring))
        whole = 0
        for isl in china_islands:
            xs = [p[0] for p in isl]
            ys = [p[1] for p in isl]
            ix0, iy0, ix1, iy1 = min(xs), min(ys), max(xs), max(ys)
            step = max(1, len(isl) // 24)
            probe = isl[::step]
            found = None
            for x0, y0, x1, y1, label, ring in boxed:
                if x1 < ix0 or x0 > ix1 or y1 < iy0 or y0 > iy1:
                    continue
                if any(point_in_ring(p, ring) for p in probe):
                    found = label
                    break
                # The other way round, and it is the commoner case: the trace
                # carries islets of its own, so what sits on the island is a
                # small occupied ring rather than the edge of a large one.
                # Shijiutuo is this — a six-point ring inside a coastal island
                # Natural Earth draws with fifty.
                if x0 >= ix0 and x1 <= ix1 and y0 >= iy0 and y1 <= iy1:
                    step2 = max(1, len(ring) // 24)
                    if any(point_in_ring(p, isl) for p in ring[::step2]):
                        found = label
                        break
            if found is not None:
                occ_src.append((found, isl))
                whole += 1
        if whole:
            sys.stderr.write(f"occupied zone: {whole} islands completed\n")

    occ_proj = []
    for label, src in occ_src:
        ring = clip_halfplanes(src, occ_frame)
        if len(ring) < 3:
            continue
        pts = [project(x, y) for x, y in ring]
        occ_proj.append(pts)
        occ_pieces.append((label, ring_to_path(pts)))
        a = ring_area(pts)
        cx, cy = ring_centroid(pts)
        occ_moments.append((a, cx, cy))
    occ_path = "".join(d for _, d in occ_pieces)
    if occ_moments:
        tot = sum(m[0] for m in occ_moments) or 1.0
        occ_anchor = (sum(m[0] * m[1] for m in occ_moments) / tot,
                      sum(m[0] * m[2] for m in occ_moments) / tot, tot)
    else:
        occ_anchor = (0, 0, 1)

    extent_path = ""
    if extent:
        pts = simplify([project(x, y) for x, y in extent], 0.35)
        extent_path = line_to_path(pts) + "Z"
        # Macao, cut out of the perimeter rather than swallowed by it.
        #
        # Portugal was neutral and Macao stayed Portuguese for the whole war;
        # it is the one place inside the delta detour that Japan did not hold.
        # The detour is a hull grown nine kilometres off the shore and Macao is
        # two kilometres across, so no offset line can miss it. It is taken out
        # instead: its own ring, wound against the perimeter, is a hole under
        # the non-zero rule, so the dashed line draws a small loop round the
        # enclave and the enclave itself is outside the line. Which is what a
        # reader should see — a neutral pocket the front went round.
        _macao = [r for r in (groups.get("macau") or []) if len(r) >= 3]
        if _macao:
            sys.stderr.write("extent: Macao cut out of the perimeter (%d rings)\n"
                             % len(_macao))
            _outer = ring_area_signed(pts)
            for _r in _macao:
                _loop = [project(x, y) for x, y in
                         grow_ring(normalise_ring(_r), 0.012)]
                if len(_loop) < 3:
                    continue
                if (ring_area_signed(_loop) > 0) == (_outer > 0):
                    _loop = list(reversed(_loop))
                extent_path += line_to_path(_loop + [_loop[0]]) + "Z"
        # Attu, Kiska and Guadalcanal are far from anything else Japan held,
        # and a bulge in the perimeter to reach them would take the whole
        # Aleutian chain, or Tulagi and Malaita, in with them. They get rings
        # of their own instead.
        for x0, y0, x1, y1 in (ATTU_BOX, KISKA_BOX, GUADALCANAL_BOX):
            box = [(x0 - 0.12, y0 - 0.08), (x1 + 0.12, y0 - 0.08),
                   (x1 + 0.12, y1 + 0.08), (x0 - 0.12, y1 + 0.08)]
            loop = [project(x, y) for x, y in chaikin(box + [box[0]], 2)]
            extent_path += line_to_path(loop) + "Z"
        sys.stderr.write(f"extent line: {len(pts)} points\n")

    # ---- name the islands worth naming --------------------------------------
    for key, table in RING_NAMES.items():
        rings = groups.get(key)
        if not rings:
            continue
        named = collections.defaultdict(list)
        for ring in rings:
            cx, cy = ring_centroid(ring)
            label = ""
            for name, (x0, y0, x1, y1) in table:
                if x0 <= cx <= x1 and y0 <= cy <= y1:
                    label = name
                    break
            named[label].append(ring)
        named.pop("-", None)                    # covered by an admin file instead
        if len(named) > 1 or (len(named) == 1 and "" not in named):
            # a group can already have sub-units from an admin file, as the
            # Indies do; the named islands go in front of them, so that where
            # the two overlap the finer admin outline is the one on top
            provinces[key][:0] = [(k, v) for k, v in named.items()]

    # ---- rivers ------------------------------------------------------------
    rivers = {}
    try:
        rv = load("rivers", args.download)
    except Exception:
        rv = None
    if rv:
        pieces = {"yangzi": [], "yellow_upper": [], "yellow_lower": []}
        for feat in rv["features"]:
            props = feat["properties"]
            label = (props.get("name_en") or props.get("name") or "")
            for line in iter_lines(feat["geometry"]):
                if len(line) < 3:
                    continue          # stray two-point fragments in the source
                if label == "Yangtze" or props.get("name") == "Chang Jiang":
                    pieces["yangzi"].append(line)
                elif label in ("Yellow", "Huang") or props.get("name") == "Huang":
                    bd = min((x - HUAYUANKOU[0]) ** 2 + (y - HUAYUANKOU[1]) ** 2
                             for x, y in line)
                    if bd > 4.0:
                        pieces["yellow_upper"].append(line)
                        continue
                    # Split at the breach itself, not at the nearest vertex to
                    # it: the nearest vertex can be past Huayuankou, and then
                    # the 1938 course starts by doubling back on the old one.
                    # Take the *first* crossing of the breach's meridian and
                    # not the last, or a meander that recrosses it downstream
                    # is drawn as a chord straight back to the breach.
                    if line[0][0] > line[-1][0]:
                        line = line[::-1]          # run it downstream
                    cut = None
                    for i in range(len(line) - 1):
                        a, b = line[i][0], line[i + 1][0]
                        if min(a, b) <= HUAYUANKOU[0] <= max(a, b):
                            cut = i
                            break
                    if cut is None:
                        pieces["yellow_lower"].append([HUAYUANKOU] + line)
                        continue
                    if cut >= 1:
                        pieces["yellow_upper"].append(line[:cut + 1] + [HUAYUANKOU])
                    if len(line) - cut >= 3:
                        pieces["yellow_lower"].append([HUAYUANKOU] + line[cut + 1:])
        if pieces["yangzi"]:
            pieces["yangzi"].append(YANGZI_TAIL)
        if pieces["yellow_lower"]:
            # The old course is one river. Natural Earth carries a second line
            # over the same ground that also crosses the breach and is cut with
            # it, and drawn together the two read as a fork and a chord across
            # the meanders. Keep the longest and give it a tail to the sea.
            pieces["yellow_lower"] = [max(pieces["yellow_lower"], key=len)]
            pieces["yellow_lower"].append(YELLOW_TAIL)
        # Both rivers are cut where they first reach water the map draws. The
        # land is China as the Republican provinces have it, which is the
        # coastline the map itself puts down.
        on_land = land_test([r for k in ENP_SIDE for r in groups.get(k, ())])
        for key in pieces:
            pieces[key] = [t for t in (trim_to_land(line, on_land)
                                       for line in pieces[key]) if t]

        if args.export:
            export_geojson(args.export, groups, provinces, pieces)

        for key, lines in pieces.items():
            out_paths = []
            for line in lines:
                pts = [project(x, y) for x, y in normalise_ring(line)]
                pts = simplify(pts, RIVER_TOLERANCE)
                if RIVER_SMOOTH and len(pts) > 2:
                    pts = chaikin(pts, RIVER_SMOOTH)
                path = line_to_path(pts)
                if path:
                    out_paths.append(path)
            if out_paths:
                rivers[key] = "".join(out_paths)

    # Natural Earth's coastal islands go to whichever Republican province is
    # nearest, not to China by default: the Changshan group off Dairen belongs
    # to Fengtien, and giving it to China drew Republic-of-China yellow inside
    # Manchukuo.
    for ring in china_islands:
        extra[nearest_enp_atom(ring, provinces)].append(ring)
        # An island inside the leasehold is the leasehold's. These come from
        # Natural Earth and the Republican provinces do not carry them, so the
        # leasehold — which is cut out of Liaoning and knows only what Liaoning
        # knows — had nothing over them, and Manchuria's own filler showed
        # through the middle of Kwantung as a scatter of yellow chips round
        # Pulandian bay and among the islands off Dairen.
        # The traced layer carries its own nineteen islands, so this is only
        # for a build without it.
        cx, cy = centroid_of(ring)
        if not kwantung_traced and KWANTUNG_BOX[0] <= cx <= KWANTUNG_BOX[2] \
                and KWANTUNG_BOX[1] <= cy <= KWANTUNG_BOX[3]:
            (ax, ay), (bx, by) = KWANTUNG_CUT
            if (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) < 0:
                groups["kwantung"].append(ring)

    # Seams are not part of any country's shape. They go in a layer of their
    # own, under every atom, and are never stroked and never outlined: a strip
    # added to an atom's own path is traced when that country is selected, and
    # came out as a black line cutting across Tibet into India, a doubled
    # border round Thailand and a scribble along every frontier of China.
    seamed = collections.defaultdict(list)
    for src in (add_neighbour_seams(groups), add_frontier_seam(groups)):
        for key, rings in src.items():
            seamed[key].extend(rings)
    if seamed:
        sys.stderr.write(
            "frontier seams: "
            + ", ".join(f"{k}={len(v)}" for k, v in sorted(seamed.items()))
            + "\n")

    # ---- dissolve, project, clip, simplify --------------------------------
    frame = box_planes(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX)
    paths, dots, anchors, stats, hits = {}, {}, {}, [], {}
    SMALL_ATOM_AREA = 2600      # kept in step with the same name in map.js

    for key, rings in groups.items():
        merged = (dissolve(rings)
                  if len(rings) > 1 and key not in NO_DISSOLVE else None)
        source = merged if merged else rings
        archipelago = key in ARCHIPELAGOS
        # the French and Portuguese enclaves are a few square kilometres each
        # and would otherwise fall through the minimum-area sieve
        # the leasehold keeps the small islands for the same reason it keeps
        # the full detail: they are in the coast it was cut out of, and a
        # sieve that drops them here and not there leaves them showing in the
        # country's colour inside the leasehold
        # The hand-traced layers keep every piece their author drew: two of
        # Weihaiwei's four are islands of a few square kilometres, and a sieve
        # set for Natural Earth's specks was quietly throwing them away.
        min_area = (0.0 if key in GIS_LAYERS or key in ("kwantung", "ccp")
                    # every hole the tracing has is one its author drew
                    or key in TRACED_TOL
                    or key in OUTER_ATOMS.values()
                    or key in SCS_ATOMS.values()
                    # Kingman Reef is a square kilometre of coral; every one of
                    # these is far under the floor an archipelago is given
                    or key in ("linephoenix", "uspacific", "nzpacific", "ellice")
                    else 0.04 if key in ("goa", "pondicherry")
                    else 0.12 if (archipelago or key in FULL_DETAIL)
                    else args.min_area)

        pieces, specks, moments = [], [], []
        for ring in source:
            ring = normalise_ring(ring)
            if key == "gilberts" and min(p[0] for p in ring) > 180:
                continue
            ring = clip_halfplanes(ring, frame)
            if len(ring) < 3:
                continue
            pts = [project(x, y) for x, y in ring]
            span = max(max(p[0] for p in pts) - min(p[0] for p in pts),
                       max(p[1] for p in pts) - min(p[1] for p in pts))
            if key in TRACED_TOL:
                # a hand-traced outline is thinned to what the deepest zoom
                # can actually show and no coarser: the span bands below would
                # move India's line a couple of pixels off the line its author
                # drew. Only the big rings: the holes are the enclaves and the
                # protectorates, a dozen points each, and thinning them at a
                # band meant for a coastline shrank them until the sieve below
                # threw them away.
                if span > 2 and len(pts) >= 4:
                    pts = simplify(pts, TRACED_TOL[key])
            elif key in FULL_DETAIL:
                pass          # the leasehold is a piece of a coast drawn here
                              # at full detail; thinned on its own it no longer
                              # matches the coast it was cut out of
            elif span > 60:
                pts = simplify(pts, args.tolerance)
            elif span > 12:
                pts = simplify(pts, args.tolerance * 0.5)
            elif span > 2:
                pts = simplify(pts, args.tolerance * 0.12)
            if len(pts) < 3:
                continue
            area = ring_area(pts)
            if area < min_area:
                continue
            pieces.append(ring_to_path(
                pts, FINE_PRECISION if key in FULL_DETAIL or key in TRACED_TOL
                    else None))
            rcx, rcy = ring_centroid(pts)
            moments.append((area, rcx, rcy))
            if key in ISLET_RINGS and area < 20:
                specks.append((rcx, rcy, max(2.6, math.sqrt(area / math.pi) * 1.5)))

        # A group of specks a couple of kilometres apart gets one ring, not one
        # per islet: the Turtle Islands are nine of them inside a fifth of a
        # degree, and nine overlapping circles read as a scribble rather than as
        # a place. The ring is centred on the group and drawn wide enough to
        # hold it.
        if key in ONE_ISLET and len(specks) > 1:
            xs = [c[0] for c in specks]
            ys = [c[1] for c in specks]
            cx = (min(xs) + max(xs)) / 2.0
            cy = (min(ys) + max(ys)) / 2.0
            span = max(max(xs) - min(xs), max(ys) - min(ys)) / 2.0
            specks = [(cx, cy, max(2.6, span + 1.4))]

        if not pieces:
            continue
        paths[key] = "".join(pieces)
        dots[key] = specks
        total = sum(m[0] for m in moments) or 1.0
        anchors[key] = (sum(m[0] * m[1] for m in moments) / total,
                        sum(m[0] * m[2] for m in moments) / total,
                        total)
        # A territory too small to hit reliably gets a finger-sized target laid
        # over it. One target at the middle of the whole thing lands in the gap
        # when the pieces are far apart — the Thai gains of 1941 are in Cambodia
        # and Laos, and their common centre is in Siam — so each piece gets its
        # own, biggest first.
        if total < SMALL_ATOM_AREA:
            hits[key] = [(m[1], m[2]) for m in sorted(moments, reverse=True)[:6]]
        stats.append((key, len(pieces), len(paths[key]), "dissolved" if merged else "raw"))

    # Guangzhou Bay as water: the bay's box, then Natural Earth's coastline
    # inside it, in one path filled by the even-odd rule so that the land
    # subtracts from the box. See where it is emitted, below.
    # Weihaiwei's seaward fringe, carved the same way as the bay below but with
    # a box rather than a hull: the leasehold is an arc of coast, so its hull's
    # chord runs across Chinese land inland and carving that would take away
    # ground the province is right about. The box holds only the water side.
    bay_path = ""
    wei = groups.get("weihaiwei")
    if wei:
        wx0, wy0, wx1, wy1 = WEIHAIWEI_SEA_BOX
        pieces = [ring_to_path([project(x, y) for x, y in
                                ((wx0, wy0), (wx1, wy0), (wx1, wy1), (wx0, wy1))],
                               FINE_PRECISION)]
        # The rings are cut to the box first. The lease is a semicircle of a
        # ten-mile radius round the bay and the box holds only its northern,
        # seaward strip, so most of that semicircle lies outside — and under
        # the even-odd rule a ring outside the box is not subtracting from
        # anything, it is a shape of its own, painted in the ocean colour. On
        # the 1930 map the leasehold is drawn over it and nothing shows; on the
        # 1942 map it was returned to China two months before the map's own
        # 1930 date, so nothing is drawn there and the whole semicircle came
        # out as a bite of sea taken out of the Shantung peninsula.
        planes = box_planes(wx0, wy0, wx1, wy1)
        for ring in wei:
            cut = clip_halfplanes(normalise_ring(ring), planes)
            if len(cut) < 3:
                continue
            pieces.append(ring_to_path([project(x, y) for x, y in cut],
                                       FINE_PRECISION))
        bay_path += "".join(pieces)

    if groups.get("guangzhouwan"):
        # The outer ring is the leasehold's own convex hull rather than a box:
        # a box leaves its corners standing out over the mainland as rectangles
        # of ocean, and the hull touches the leasehold at every extreme and
        # cuts nothing that the leasehold does not already reach around.
        hull = convex_hull([p for r in groups["guangzhouwan"] for p in r])
        pieces = [ring_to_path([project(x, y) for x, y in hull], FINE_PRECISION)]
        for ring in groups["guangzhouwan"]:
            pieces.append(ring_to_path([project(x, y) for x, y in
                                        normalise_ring(ring)], FINE_PRECISION))
        # The hull is convex and the leasehold is not, so it takes in a good
        # deal of the Leizhou mainland on its north-west as well as the bay —
        # 78 per cent more area than the leasehold's own — and all of that was
        # being painted as sea. The traced coastline goes into the same path to
        # say where the sea is not: a point inside the hull, outside the
        # leasehold and on land now has an even number of rings round it under
        # the even-odd rule, and is left alone. Clipped to the hull first,
        # because a ring reaching outside it would be a shape of its own rather
        # than something subtracting from it.
        coast = load_gzw_coast()
        if coast:
            planes = hull_planes(hull)
            kept = 0
            for ring in coast:
                pulled = grow_ring(normalise_ring(ring), GZW_COAST_SHRINK)
                cut = clip_halfplanes(pulled, planes)
                if len(cut) < 3:
                    continue
                pieces.append(ring_to_path([project(x, y) for x, y in cut],
                                           FINE_PRECISION))
                kept += 1
            sys.stderr.write(
                f"Guangzhou Bay: {kept} coastline rings limit the carve\n")
        bay_path += "".join(pieces) if len(pieces) > 1 else ""

    lease_sea_path = ""
    for _key, _ring in LEASEHOLD_SEA:
        _own = groups.get(_key) or []
        if not _own:
            continue
        _pieces = [ring_to_path([project(x, y) for x, y in _ring], FINE_PRECISION)]
        _kept = 0
        for _r in _own:
            _pieces.append(ring_to_path(
                [project(x, y) for x, y in normalise_ring(_r)], FINE_PRECISION))
            _kept += 1
        lease_sea_path += "".join(_pieces)
        sys.stderr.write("%s: water traced round it, %d of its own rings held back\n"
                         % (_key, _kept))

    # "occupiedzone" is a slot rather than an atom of its own — it has no
    # entry in `paths` — so it has to survive this filter to keep its place
    # in the order.
    ordered = ([k for k in ORDER if k in paths or k == "occupiedzone"]
               + [k for k in paths if k not in ORDER])
    # the enclaves that have to survive the occupied shading are held back and
    # drawn after it
    ordered = [k for k in ordered if k not in ON_TOP]

    def sub_min_area(key):
        # the same floor the archipelagos use when they are drawn whole: an
        # island chain assembled from its provinces should not lose the small
        # islands merely because it came in through a different door
        if key in ("goa", "pondicherry"):
            return 0.04          # Mahe is two square kilometres on this scale
        # China's coastal islands: dropping them from the country left them
        # showing as the neutral "elsewhere" grey, because `chinabase` — the
        # filler that makes disagreements between sources visible — keeps land
        # the country itself had thrown away. Shijiutuo in the Gulf of Chihli
        # was the one that gave it away.
        if key in ENP_ATOMS:
            return 0.12
        # The eastern Pacific by the same argument as its `min_area` above:
        # Kingman Reef is a square kilometre and Howland two, and the floor an
        # archipelago is given threw away twelve of the twenty-two islands —
        # which meant they were drawn, because the atom's own shape has no
        # floor, but had no name to give when they were pointed at.
        if key in ("linephoenix", "uspacific", "nzpacific", "ellice"):
            return 0.0
        return 0.12 if key in ARCHIPELAGOS else args.min_area

    def tol_for(pts):
        """The simplification tolerance a ring of this size earns."""
        span = max(max(p[0] for p in pts) - min(p[0] for p in pts),
                   max(p[1] for p in pts) - min(p[1] for p in pts))
        if span > 60:
            return args.tolerance
        if span > 12:
            return args.tolerance * 0.5
        if span > 2:
            return args.tolerance * 0.12
        return args.tolerance * 0.03

    def backing_tol(key):
        """The finest tolerance any of this atom's sub-units was given.

        The backing must never be coarser than what sits on top of it. Where it
        was, it poked out past the sub-units on one side and cut inside them on
        the other: a doubled outline when the territory is selected, and a
        scatter of flecks along every boundary. Giving it the whole atom's own
        band was the mistake — a country the size of Siam earns the coarsest
        band while its changwat earn a much finer one."""
        if key in TRACED_TOL:
            return TRACED_TOL[key]
        if key in FULL_DETAIL:
            return None
        best = args.tolerance
        for _, prings in provinces.get(key, []):
            for ring in prings:
                pts = [project(x, y) for x, y in normalise_ring(ring)]
                # only the sub-units big enough to share a boundary with the
                # backing's own large rings. A one-unit islet is its own ring
                # in the backing too, and matching its band would put the whole
                # country's coastline in at the finest setting for nothing.
                if len(pts) >= 4 and max(
                        max(p[0] for p in pts) - min(p[0] for p in pts),
                        max(p[1] for p in pts) - min(p[1] for p in pts)) > 2:
                    best = min(best, tol_for(pts))
        return best

    def thin(key, pts):
        """Simplify by how big the thing is, not by what it is part of.

        One tolerance for a whole country throws away small islands: the
        Visayas and the Moluccas are drawn from the same files as Luzon and
        Java, and what reads as a light touch on a landmass the size of Java
        erases a fifty-kilometre island altogether. The bands below are the
        ones the archipelagos already used, applied to everything that is
        assembled out of sub-units as well."""
        if key in TRACED_TOL:
            return simplify(pts, TRACED_TOL[key]) if len(pts) >= 4 else pts
        if key in FULL_DETAIL or len(pts) < 4:
            return pts
        return simplify(pts, tol_for(pts))
        # even the smallest islands are worth thinning: the boundary files
        # carry vertices a metre apart, and none of that survives the screen.
        # One SVG unit is one screen pixel at the opening view and the map
        # zooms to 40x, so nothing finer than a fortieth of a unit can ever
        # be seen; these bands sit just inside that. The smallest band has to be
        # gentler still, because the French and Portuguese enclaves are one or
        # two units across and a tolerance that reads as light on an island
        # would take Mahe down to a triangle.
        return simplify(pts, args.tolerance * 0.03)

    whole_pts = {}

    def whole_union(key):
        """The country outline that goes under a territory's sub-units.

        Adjacent sub-units share an edge in the source and lose it to
        simplification, so two that used to meet no longer quite do and a
        hairline of ocean opens between them. Dissolving the sub-units does not
        help — several of these sets come from files that never shared vertices
        in the first place — so the filler is Natural Earth's own outline of the
        countries concerned, which has no seams in it by construction. Drawn
        underneath in the same colour, it turns every crack into solid ground.

        The projected rings are kept in `whole_pts` on the way past. The
        occupied zone needs China's outline as coordinates and not only as a
        path string, to work out which stretches of coast it reaches."""
        # Korea has no separate coastline: its provinces are the finer source
        # and they dissolve into the country, so the filler comes from them
        rings = backing.get(key) or [r for _, rs in provinces.get(key, []) for r in rs]
        if not rings:
            return ""
        btol = backing_tol(key)
        pieces = []
        kept = whole_pts.setdefault(key, [])
        for ring in (dissolve(rings) if len(rings) > 1 else rings):
            ring = clip_halfplanes(normalise_ring(ring), frame)
            if len(ring) < 3:
                continue
            pts = [project(x, y) for x, y in ring]
            if btol is not None:
                pts = simplify(pts, btol)
            if len(pts) >= 3 and ring_area(pts) >= sub_min_area(key):
                kept.append(pts)
                pieces.append(ring_to_path(
                    pts, FINE_PRECISION if key in FULL_DETAIL or key in TRACED_TOL
                    else None))
        # Added rings are drawn exactly as given, after the dissolve. A seam's
        # inner edge is the neighbour's own boundary, so thinning it would move
        # that edge off the line it was built to meet and reopen the crack it
        # exists to close; an island is smaller than the tolerance its country
        # earns and would be thinned out of existence; and both overlap the
        # country rather than abutting it, which the dissolve cannot make sense
        # of.
        for ring in extra.get(key, []):
            ring = clip_halfplanes(normalise_ring(ring), frame)
            if len(ring) >= 3:
                pieces.append(ring_to_path([project(x, y) for x, y in ring]))
        return "".join(drop_interior_slivers(pieces))

    def province_paths(key, src=None):
        """One path per Republican province, for the atoms built from them.

        Hovering can then name the province as well as the country. The paths
        share the atom's fill and stroke colour, so the seams between them are
        invisible until something asks for them.

        `src` is which set of sub-units to draw — the default, or the finer
        Republican provinces, which go through exactly the same thinning and
        clipping so that the two are comparable."""
        blocks = []
        for pname, prings in (src if src is not None else provinces).get(key, []):
            merged = dissolve(prings) if len(prings) > 1 else None
            pieces = []
            for ring in (merged or prings):
                ring = clip_halfplanes(normalise_ring(ring), frame)
                if len(ring) < 3:
                    continue
                pts = thin(key, [project(x, y) for x, y in ring])
                if len(pts) >= 3 and ring_area(pts) >= sub_min_area(key):
                    pieces.append(ring_to_path(
                        pts, FINE_PRECISION if key in FULL_DETAIL or key in TRACED_TOL
                    else None))
            if pieces:
                blocks.append((pname, "".join(pieces)))
        return blocks


    # The fine coastlines are built here rather than at the end because the
    # main file has to carry their bounding boxes: the browser needs to know
    # where they are before deciding whether to fetch them.
    fine_svg, fine_boxes = build_fine_coast(groups)

    out = ['<?xml version="1.0" encoding="utf-8"?>']
    out.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(WIDTH)} {fmt(HEIGHT)}" '
        f'width="{fmt(WIDTH)}" height="{fmt(HEIGHT)}" id="jmap">'
    )
    out.append("  <title>The Japanese Empire in Asia and the Pacific</title>")
    boxes = " ".join(f"{k}:{v}" for k, v in sorted(fine_boxes.items()))
    out.append(
        f'  <metadata id="proj" data-lon-min="{LON_MIN}" data-lat-max="{LAT_MAX}" '
        f'data-px-per-deg="{PX_PER_DEG}" data-r="{R:.6f}" '
        f'data-fine="{esc(boxes)}"/>'
    )
    out.append("  <defs>")
    out.append(
        '    <pattern id="hatch" patternUnits="userSpaceOnUse" width="10" height="10" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="10" stroke="#1d1a15" stroke-opacity="0.30" stroke-width="2.4"/>'
        "</pattern>"
    )
    # The stripes say "Japanese forces are here" and are laid over somebody
    # else's colour -- Portuguese Timor, Thai Kengtung -- so they are drawn in
    # the occupation's own colour, which is what they mean.
    out.append(
        '    <pattern id="hatch-occ" patternUnits="userSpaceOnUse" width="9" height="9" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="9" stroke="#fb8072" stroke-opacity="1" stroke-width="4.4"/>'
        "</pattern>"
    )
    # and the other way round: American forces on ground drawn in the Japanese
    # occupation colour, which is Guadalcanal in December 1942
    out.append(
        '    <pattern id="hatch-us" patternUnits="userSpaceOnUse" width="9" height="9" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="9" stroke="#325d7b" stroke-opacity="1" stroke-width="4.4"/>'
        "</pattern>"
    )
    # British administration on ground allocated to somebody else: the Turtle
    # and Mangsee Islands, run by the British North Borneo Company and drawn
    # inside the American Philippines by the convention of 1930.
    out.append(
        '    <pattern id="hatch-brit" patternUnits="userSpaceOnUse" width="9" height="9" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="9" stroke="#bc8ba0" stroke-opacity="1" stroke-width="4.4"/>'
        "</pattern>"
    )
    # Allied ground inside the reach of the Japanese perimeter, shelled from it
    # and never taken: the Cocos (Keeling) Islands, where a submarine came on
    # Christmas Day 1942. Grey, because what it marks is not another power's
    # colour but a condition.
    out.append(
        '    <pattern id="hatch-raid" patternUnits="userSpaceOnUse" width="9" height="9" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="9" stroke="#6b6459" stroke-opacity="0.75" stroke-width="3.2"/>'
        "</pattern>"
    )
    # Thai forces on Japanese-held Burmese ground: Kengtung and the
    # trans-Salween Shan states, administered from Bangkok from late 1942 but
    # not transferred until August 1943.
    out.append(
        '    <pattern id="hatch-thai" patternUnits="userSpaceOnUse" width="9" height="9" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="9" stroke="#8dd3c7" stroke-opacity="1" stroke-width="4.4"/>'
        "</pattern>"
    )
    # The Communist base areas, laid over the occupied shading rather than
    # instead of it. Rotated the other way from the occupation's own stripes,
    # so that where the two cross — which is most of where these are — the
    # reader can see both: Japanese authority claimed here, and not held.
    out.append(
        '    <pattern id="hatch-ccp" patternUnits="userSpaceOnUse" width="2.5" height="2.5" '
        'patternTransform="rotate(-45)">'
        '<line x1="0" y1="0" x2="0" y2="2.5" stroke="#7a1730" stroke-opacity="0.6" stroke-width="0.75"/>'
        "</pattern>"
    )
    # The occupied zone is clipped to China's land. Clip it to the shape that is
    # actually drawn and not to the dissolved outline of the same rings, which
    # simplifies to a slightly different coastline and let the shading hang out
    # over the water. What is drawn is the provinces *and* the country outline
    # laid under them: wherever that backing reaches further out than the
    # provinces do -- which along the coast is most places -- clipping to the
    # provinces alone left a hairline of unoccupied yellow between the shading
    # and the sea.
    # China's own land, and two windows of Inner Mongolia besides.
    #
    # Chahar and Suiyuan used to be left out of this clip altogether, which is
    # what kept the shading off Mengchiang while the client state was *made* of
    # them. Mengchiang is traced now and is cut out of the occupation by a clip
    # of its own, so they were let in whole — and that was too much. The
    # occupation is traced from a 1940 US Army sheet and Mengchiang from a
    # different one, and the two disagree about the client state's edges in
    # both directions:
    #
    #  * East and south-east of Mengchiang the army's sheet reaches further, and
    #    the ground between the two lines is enclosed — Mengchiang on one side,
    #    Jehol and Manchukuo on the other, the occupation below. Drawn as Free
    #    China it was a bay of unoccupied yellow a hundred kilometres across
    #    inside a region held all the way round, which is not a thing that
    #    existed. That is what letting the provinces in was for.
    #
    #  * West and south-west of it the army's sheet also reaches further, but
    #    there the ground beyond is open Free China — Fu Tso-yi's, and the Ordos
    #    — and the same licence drew a band of army shading along the outside of
    #    the client state's own frontier, with the line of control round the
    #    outside of that.
    #
    # So the provinces come in through two windows and not as a whole. The boxes
    # are the enclosed ground, measured off the render by testing the occupied
    # geometry point by point against Mengchiang's and the provinces' — 268
    # cells in the eastern pocket and 126 in the southern one, against 73 in the
    # two western bands, which no box admits.
    MENG_POCKETS = [
        (116.15, 40.20, 117.60, 41.70),   # east of Mengchiang, towards Jehol
        (114.80, 39.50, 115.85, 40.45),   # south-east of it, above Peking
    ]
    china_drawn = "".join(pd for _, pd in province_paths("china")) + whole_union("china")
    for _k in ("chahar", "suiyuan", "suiyuan_w"):
        _rings = (backing.get(_k)
                  or [r for _, rs in provinces.get(_k, []) for r in rs])
        for _w, _s, _e, _n in MENG_POCKETS:
            _planes = box_planes(_w, _s, _e, _n)
            for _r in _rings:
                _cut = clip_halfplanes(normalise_ring(_r), _planes)
                if len(_cut) >= 3:
                    china_drawn += ring_to_path([project(x, y) for x, y in _cut])
    china_drawn = china_drawn or paths.get("china", "")
    if china_drawn:
        out.append(f'    <clipPath id="clip-china"><path d="{china_drawn}"/></clipPath>')
    # Which stretches of China's coast the occupation reaches. Computed here
    # because `whole_union("china")` has just run and left its rings behind;
    # drawn with the occupation, where the reason for it is written out.
    coast_runs, free_runs = (
        occupied_coast(whole_pts.get("china") or [], occ_proj)
        if (china_drawn and occ_proj) else ([], []))
    if coast_runs:
        sys.stderr.write(
            "occupied coast: %d stretches / %d points reached, "
            "%d / %d not, of China's %d-point outline\n"
            % (len(coast_runs), sum(len(r) for r in coast_runs),
               len(free_runs), sum(len(r) for r in free_runs),
               sum(len(r) for r in whole_pts.get("china") or [])))
    # Everything except the two client states. The occupation is clipped to
    # China's land, and both Mengchiang's and Manchukuo's traced boundaries
    # cross ground the occupation's own tracing claims — northern Shansi was
    # Mengchiang's, and the occupied file reaches over the Wall into Jehol,
    # which Manchukuo took in 1933. Measured: 101 cells of a quarter-degree
    # grid lie inside both the occupation and Manchukuo, over 115.75-119.75 E
    # and 40.25-41.75 N. With the Administrative layer on, Manchukuo's
    # provinces are drawn late enough to cover the shading and it never showed;
    # with the layer off there are no provinces, and the occupation's lighter
    # salmon was painted over the client state's own colour inside its outline.
    # A clip cannot subtract, but it can be the frame with a hole in it: the
    # rectangle and the client states' rings in one path under the even-odd
    # rule.
    client_rings = load_mengjiang() + load_manchukuo()
    if client_rings:
        hole = ring_to_path([(0.0, 0.0), (WIDTH, 0.0), (WIDTH, HEIGHT), (0.0, HEIGHT)])
        for ring in client_rings:
            cut = clip_halfplanes(normalise_ring(ring), frame)
            if len(cut) >= 3:
                hole += ring_to_path([project(x, y) for x, y in cut], FINE_PRECISION)
        out.append('    <clipPath id="clip-off-clients" clipPathUnits="userSpaceOnUse">'
                   f'<path clip-rule="evenodd" d="{hole}"/></clipPath>')
    # The Japanese mandate is drawn as a line, and under the pointer the
    # stylesheet gives it the faintest wash of Japan's colour. The wash covered
    # Guam, which is the one thing inside that boundary the mandate did not
    # include — the box round it says so in as many words. So the wash is
    # clipped: the frame with the box punched out of it under the even-odd rule.
    # Only the fill is affected; the dashed boundary is a separate copy in
    # #mandate-lift and is left alone.
    _guam_box = [r for r in (groups.get("mandate_ex_guam") or []) if len(r) >= 3]
    if _guam_box:
        hole = ring_to_path([(0.0, 0.0), (WIDTH, 0.0), (WIDTH, HEIGHT), (0.0, HEIGHT)])
        for ring in _guam_box:
            cut = clip_halfplanes(normalise_ring(ring), frame)
            if len(cut) >= 3:
                hole += ring_to_path([project(x, y) for x, y in cut])
        out.append('    <clipPath id="clip-off-guam" clipPathUnits="userSpaceOnUse">'
                   f'<path clip-rule="evenodd" d="{hole}"/></clipPath>')
    out.append("  </defs>")
    out.append(f'  <rect id="ocean" x="0" y="0" width="{fmt(WIDTH)}" height="{fmt(HEIGHT)}"/>')
    out.append('  <g id="land">')
    admin_out = []
    roc_out = []
    roc_provinces = load_roc_provinces(provinces)
    backings = []
    def emit(key):
        ax, ay, area = anchors[key]
        meta = f'data-cx="{fmt(ax)}" data-cy="{fmt(ay)}" data-area="{int(area)}"'
        # Sub-units are of two kinds. Most are administrative divisions -- the
        # provinces of China, the prefectures of Japan -- and belong with the
        # Administrative layer, which can be switched off. The rest are simply
        # separate pieces of ground with separate names: the islands of a
        # chain, the scattered settlements of French and Portuguese India.
        # Those keep their names whatever the layer says, because the name is
        # the place and not a fact about how it was governed.
        if (key in ARCHIPELAGOS or key in ALWAYS_NAMED) \
                and key not in ADMIN_SUBUNITS:
            meta += ' data-islands="1"'
        if key in hits:
            pts = " ".join(f"{fmt(x)},{fmt(y)}" for x, y in hits[key])
            meta += f' data-hits="{pts}"'
        if key.startswith("chinabase"):
            out.append(f'    <path id="{key}" class="chinabase" d="{paths[key]}"/>')
            return
        blocks = province_paths(key)
        specks = dots.get(key) or []
        if blocks:
            # Administrative divisions are more than half the weight of this
            # file, and the map opens with that layer off, so they are written
            # to a second file and fetched only when it is switched on. Islands
            # and enclaves stay, being places rather than divisions; so do the
            # northern Malay states, which are divisions but are needed in 1930
            # with the layer off.
            defer = not (key in ARCHIPELAGOS or key in NEVER_DEFERRED)
            whole = whole_union(key)
            cls = "atom deferred" if (defer and whole) else "atom"
            # The backing goes in a layer of its own, drawn before every atom.
            # Kept inside the atom it was painted in that atom's turn, so a
            # country whose turn came later covered its neighbour's provinces
            # with its own filler: the grey between China and Indochina, the
            # grey along the Fukien coast, the salmon on Thailand's frontier.
            # Underneath everything it can only ever show through a real hole.
            if whole:
                # China's filler does not stroke itself. Its outline is stroked
                # by two paths instead — yellow where the occupation does not
                # reach the coast and salmon where it does — which keeps the
                # yellow thread off the occupied shore without adding a single
                # stroked point to the map. See occupied_coast().
                _split = bool(key == "china" and free_runs)
                backings.append(
                    f'    <path class="whole{" nostroke" if _split else ""}"'
                    f' data-for="{key}"'
                    + (' data-deferred="1"' if defer else "")
                    + f' d="{whole}"/>')
                if _split:
                    _d = "".join(line_to_path(r) for r in free_runs)
                    backings.append(
                        '    <path class="whole-edge" '
                        f'data-edge-for="{key}" d="{_d}"/>')
            out.append(f'    <g id="a-{key}" class="{cls}" {meta}>')
            # The sub-units come from a different source than each other and
            # are simplified one ring at a time, so two that shared an edge no
            # longer quite do and a hairline of ocean opens between them. The
            # whole shape goes underneath them first, in the same colour, so a
            # crack shows the country rather than the sea.
            # with no whole underneath them the sub-units *are* the atom, so
            # those cannot be deferred whatever kind of sub-unit they are
            sink = admin_out if (defer and whole) else out
            if sink is admin_out:
                sink.append(f'  <g data-for="{key}">')
            for pname, pd in blocks:
                # an unnamed leftover gets no attribute at all: an empty one
                # reads as a sub-unit that can never be named or outlined
                attr = f' data-prov="{esc(pname)}"' if pname else ""
                cluster = SUB_CLUSTERS.get((key, pname))
                if cluster:
                    attr += f' data-cluster="{esc(cluster)}"'
                sink.append(f'      <path{attr} d="{pd}"/>')
            if sink is admin_out:
                sink.append("  </g>")
            # The same atom's sub-units from the finer source, in a file of
            # their own. Only the ENP atoms have an alternative, and only the
            # divisions are swapped: the country's own outline is not this
            # source's business and stays where it was.
            if key in ENP_ATOMS and roc_provinces.get(key):
                rblocks = province_paths(key, roc_provinces)
                if rblocks:
                    roc_out.append(f'  <g data-for="{key}">')
                    for pname, pd in rblocks:
                        attr = f' data-prov="{esc(pname)}"' if pname else ""
                        cluster = SUB_CLUSTERS.get((key, pname))
                        if cluster:
                            attr += f' data-cluster="{esc(cluster)}"'
                        roc_out.append(f'      <path{attr} d="{pd}"/>')
                    roc_out.append("  </g>")
            for cx, cy, r in specks:
                out.append(f'      <circle class="islet-hit" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
                out.append(f'      <circle class="islet" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
            out.append("    </g>")
            return
        # An atom that the fine coastlines will graft into has to be a group,
        # even with nothing else inside it: a <path> cannot hold children, and
        # grafting into one put Guadalcanal's finer outline somewhere it could
        # never be drawn while its coarse shape was pruned away for having been
        # replaced. The island vanished.
        if specks or key in fine_boxes:
            out.append(f'    <g id="a-{key}" class="atom" {meta}>')
            out.append(f'      <path d="{paths[key]}"/>')
            for cx, cy, r in specks:
                out.append(f'      <circle class="islet-hit" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
                out.append(f'      <circle class="islet" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
            out.append("    </g>")
        else:
            # A mandate is a line, not a country: it carries an extra class so
            # the stylesheet can leave it unfilled until it is pointed at, and
            # so that the islands inside it are not painted over.
            # `mandate` gets the dashed line and the lifted copy of it;
            # `mandate-cutout` is the exception to a mandate rather than a
            # mandate, and takes the line without the wash on hover.
            _cls = "atom"
            if key in MANDATE_ATOMS.values():
                _cls = "atom mandate"
            elif key == "mandate_ex_guam":
                _cls = "atom mandate mandate-cutout"
            _clip = (' clip-path="url(#clip-off-guam)"'
                     if (key == "mandate_jp" and _guam_box) else "")
            out.append(f'    <path id="a-{key}" class="{_cls}"{_clip} '
                       f'{meta} d="{paths[key]}"/>')
    if occ_path:
        ax, ay, area = occ_anchor
        # a group of named blocks rather than one path, so the pointer can say
        # which piece of the occupation it is on. data-islands because these are
        # places and not administrative divisions: they name themselves whether
        # or not the Administrative layer is on.
        # Clipped to China's own land, which does two things and I removed it
        # for a while having noticed only one of them. The obvious one is the
        # coast. The other is that the clip is China's provinces and China's
        # outline, and Mengjiang and Manchukuo are atoms of their own, so it is
        # also what keeps the shading off them — and with the Administrative
        # layer off those two are painted by their backing, which lives at the
        # head of the layer stack, so nothing drawn later can be under it and
        # no amount of reordering would have helped.
        # Two clips: China's own land, and then everything that is not one of
        # the client states. They intersect, which is what is wanted — the
        # shading stops at the coast, at the frontier, and at Mengchiang's and
        # Manchukuo's own lines.
        occ_out.append('    <g clip-path="url(#clip-off-clients)">'
                       if client_rings else '    <g>')
        occ_out.append(
            f'    <g id="a-occupiedzone" class="atom" '
            f'clip-path="url(#clip-china)" '
            f'data-islands="1" data-cx="{fmt(ax)}" data-cy="{fmt(ay)}" '
            f'data-area="{int(area)}">'
        )
        for label, d in occ_pieces:
            attr = f' data-prov="{esc(label)}"' if label else ""
            occ_out.append(f'      <path{attr} d="{d}"/>')
        occ_out.append("    </g>")
        # The occupied coast, drawn again in the occupation's own colour so
        # that China's yellow stroke does not fatten the shore. See
        # occupied_coast() for why this is a line and not a clip.
        #
        # A sibling of the atom rather than a child of it, and unclipped. Inside
        # it, three sweeps that walk an atom's own paths picked it up and had no
        # business doing so: the hover outline traced China's coastline island
        # by island instead of the occupied zone's own edge, the diagonals were
        # copied along it, and it counted towards whether the atom has geometry
        # of its own. It takes its colour the same way China's coastal edge does,
        # through data-edge-for, which is a promise about paint and nothing else.
        if coast_runs:
            d = "".join(line_to_path(r) for r in coast_runs)
            occ_out.append(f'    <path class="coast" data-edge-for="occupiedzone" '
                           f'd="{d}"/>')
        occ_out.append("    </g>")

    for key in ordered:
        if key == "occupiedzone":
            out.extend(occ_out)
            occ_out = []
            continue
        emit(key)
    # if the slot went missing from ORDER it still has to be drawn
    if occ_out:
        out.extend(occ_out)
    # Guangzhou Bay, cut back out of China: one path holding the bay's box and
    # the leasehold's own rings, filled by the even-odd rule so that what is
    # painted is the box minus the leasehold — a polygon difference done with a
    # fill rule, there being no polygon difference anywhere in this build.
    # Drawn under the leasehold and over everything else.
    if bay_path:
        out.append(f'    <path id="gzw-bay" fill-rule="evenodd" d="{bay_path}"/>')
    # The traced water round the two leaseholds. A path of its own rather than
    # part of the one above: they overlap, and two carves sharing an even-odd
    # path would cancel each other where they cross.
    if lease_sea_path:
        out.append('    <path id="lease-sea" fill-rule="evenodd" '
                   f'd="{lease_sea_path}"/>')
    # the shading stripes go on before the enclaves, so that Weihaiwei and
    # Macao are not painted over by the occupation they sat outside
    out.append('    <g id="hatching"></g>')
    for key in ON_TOP:
        if key in paths:
            emit(key)
    out.append("  </g>")
    if extent_path:
        out.append(f'  <path id="extent-1942" fill="none" d="{extent_path}"/>')
    if rivers:
        out.append('  <g id="rivers">')
        for key in ("yangzi", "yellow_upper", "yellow_lower"):
            if key in rivers:
                out.append(f'    <path id="river-{key}" class="river" fill="none" d="{rivers[key]}"/>')
        out.append("  </g>")
    out.append('  <g id="markers"></g>')
    # A frame on the drawing's own edge. The map can now be pushed past that
    # edge — a long way on a phone, where the cards take a third of the screen
    # and you need somewhere to put the thing you are looking at — so the ocean
    # has to end somewhere visible, or the sea just runs out into the page.
    out.append(
        f'  <rect id="frame" x="0" y="0" width="{fmt(WIDTH)}" height="{fmt(HEIGHT)}"/>'
    )
    out.append("</svg>")

    # Under every atom, but over chinabase — which is itself a filler, laid
    # under China because its provinces come from a different file from its
    # neighbours', and which would otherwise cover the backings that follow it.
    head = out.index('  <g id="land">') + 1
    for i, line in enumerate(out):
        if 'class="chinabase"' in line:
            head = i + 1
    # The seams go beneath the backings, which are themselves beneath every
    # atom. They fill the crack between two countries drawn from different
    # files and they are nothing else: no stroke, no pointer, no part of any
    # country's outline.
    seam_out = []
    for key in sorted(seamed):
        d = "".join(
            ring_to_path([project(x, y) for x, y in clip_halfplanes(
                normalise_ring(r), frame)])
            for r in seamed[key]
            if len(clip_halfplanes(normalise_ring(r), frame)) >= 3)
        if d:
            seam_out.append(f'      <path data-for="{key}" d="{d}"/>')
    # backings inserted first and seams second, so that the seams end up
    # *under* them: a seam reaches into its neighbour by design, and drawn on
    # top it would paint one country's colour a kilometre inside the other
    out[head:head] = ['    <g id="backings">'] + backings + ['    </g>']
    if seam_out:
        out[head:head] = ['    <g id="seams">'] + seam_out + ['    </g>']

    dest = os.path.join(ROOT, "japan-empire-map.svg")
    with open(dest, "w") as fh:
        fh.write("\n".join(out) + "\n")

    # The administrative divisions, in their own file. They are more than half
    # the weight of the map and the map opens without them.
    admin = ['<?xml version="1.0" encoding="utf-8"?>',
             f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(WIDTH)} {fmt(HEIGHT)}" '
             'id="jmap-admin">',
             "  <title>Administrative divisions</title>"]
    admin.extend(admin_out)
    admin.append("</svg>")
    adest = os.path.join(ROOT, "japan-empire-map-admin.svg")
    with open(adest, "w") as fh:
        fh.write("\n".join(admin) + "\n")
    ab = os.path.getsize(adest)
    sys.stderr.write(f"wrote {adest} ({ab // 1024} KB)\n")

    # The alternative Republican provinces, fetched only if the reader asks for
    # them in the Layers panel.
    if roc_out:
        roc = ['<?xml version="1.0" encoding="utf-8"?>',
               f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(WIDTH)} {fmt(HEIGHT)}" '
               'id="jmap-roc">',
               "  <title>Republican provinces, AMS 1:250,000</title>"]
        roc.extend(roc_out)
        roc.append("</svg>")
        rdest = os.path.join(ROOT, "japan-empire-map-roc.svg")
        with open(rdest, "w") as fh:
            fh.write("\n".join(roc) + "\n")
        sys.stderr.write(f"wrote {rdest} ({os.path.getsize(rdest) // 1024} KB)\n")

    if fine_svg:
        fdest = os.path.join(ROOT, "japan-empire-map-fine.svg")
        with open(fdest, "w") as fh:
            fh.write(fine_svg)
        sys.stderr.write(f"wrote {fdest} ({os.path.getsize(fdest) // 1024} KB)\n")

    sys.stderr.write(f"wrote {dest} ({os.path.getsize(dest)/1024:.0f} KB, {fmt(WIDTH)}x{fmt(HEIGHT)})\n")
    for key, n, size, how in sorted(stats, key=lambda s: -s[2]):
        sys.stderr.write(f"  {key:16s} {n:4d} rings {size/1024:7.1f} KB  {how}\n")


# ---------------------------------------------------------------------------
# The fine coastlines, in a third file fetched only on a deep zoom into one of
# the regions it covers. These come from OSM-derived surveys at roughly
# centimetre precision; the map can never show finer than about half a
# kilometre, so more than ninety per cent of every source vertex is thrown away
# here and nothing is lost that could have been seen. What they buy is the
# island *names*, which the base map has never had below the level of a few
# dozen well-known ones, and outlines several times finer than Natural Earth's.
# The trimmed extracts written by tools/trim_fine_sources.py, not the 55 MB of
# survey coastline they come from: see that script for what is dropped and why
# nothing that could be drawn is lost.
FINE_FILES = [
    ("japanese-home-islands-islands.geojson", ["osm-islands-japan.json"]),
    # Two windows the map had no fine coastline for, traced with
    # tools/extract_coast.py rather than fetched as a bulk extract.
    ("outer-fine-islands.geojson", ["osm-islands-outer.json"]),
    ("scs-islands.geojson", ["osm-islands-scs.json"]),
    ("pacific-islands-se-islands.geojson", [
        "osm-islands-marianas.json",
        "osm-islands-palau.json",
        "osm-islands-carolines.json",
        "osm-islands-newguinea.json",
        "osm-islands-solomons.json",
        "osm-islands-gilberts.json",
        "osm-islands-wake.json",
    ]),
    # The central Pacific. The bulk extract above stops at 176.85 E, the
    # eastern edge of the Gilberts, so it covers none of this: the Ellice
    # Islands, the Phoenix group, Tokelau, Swains, the two northern Cooks and
    # the American specks on the equator were drawn from Natural Earth alone,
    # one ring apiece. Traced out of the split-coastlines shapefile with
    # tools/extract_coast.py, seven windows, 424 closed rings out of 876,182
    # linestrings; Rotuma came with them and is left out, being Fijian and Fiji
    # not being on this map.
    ("central-pacific-islands.geojson", ["osm-islands-central-pacific.json"]),
]

# Only these windows are taken from the sources above; the Pacific file covers
# the whole south-west Pacific and only the Marianas are wanted from it so far.
# Each is (name, ja, lon0, lat0, lon1, lat1) and they are tested in order.
FINE_GROUPS = [
    ("Ōsumi Islands", "大隅諸島", 129.60, 30.15, 131.30, 31.40),
    ("Tokara Islands", "吐噶喇列島", 128.90, 28.90, 130.10, 30.15),
    ("Amami Islands", "奄美群島", 128.30, 27.00, 130.10, 28.90),
    ("Okinawa Islands", "沖縄諸島", 126.00, 25.80, 128.50, 27.20),
    ("Daitō Islands", "大東諸島", 130.90, 24.30, 131.60, 26.10),
    ("Senkaku Islands", "尖閣諸島", 123.20, 25.50, 124.80, 26.10),
    ("Miyako Islands", "宮古列島", 124.62, 24.40, 125.70, 25.20),
    ("Yaeyama Islands", "八重山列島", 122.80, 23.90, 124.62, 24.80),
    ("Izu Islands", "伊豆諸島", 138.90, 30.30, 140.60, 34.95),
    ("Bonin Islands", "小笠原群島", 141.85, 26.30, 142.60, 27.90),
    ("Volcano Islands", "火山列島", 140.90, 23.90, 141.70, 25.70),
    ("Mariana Islands", "マリアナ諸島", 144.40, 13.10, 146.30, 20.70),

    # The South Seas Mandate, which Japan held from 1919 and administered from
    # Koror and then Saipan. Japanese names throughout, because these were a
    # Japanese colony on both of this map's dates and the Japanese forms are
    # what the period sources use.
    ("Palau Islands", "パラオ諸島", 131.00, 2.00, 135.50, 8.50),
    ("Yap Islands", "ヤップ諸島", 137.00, 8.00, 140.50, 10.50),
    ("Truk Islands", "トラック諸島", 151.00, 6.50, 152.70, 8.10),
    ("Ponape", "ポナペ島", 157.70, 6.50, 159.00, 7.40),
    ("Kusaie", "クサイ島", 162.60, 5.10, 163.40, 5.60),
    ("Marshall Islands", "マーシャル諸島", 160.50, 4.00, 173.50, 15.00),
    # after the named groups above, so they take their own islands first
    ("Caroline Islands", "カロリン諸島", 135.50, 0.00, 165.00, 12.00),

    # Melanesia: Australian-mandated New Guinea, Australian Papua and the
    # British Solomons. English only — the map's rule is that Japanese belongs
    # to Japan proper, its colonies and the places it named, and these were
    # neither in 1930 nor renamed in 1942.
    ("Admiralty Islands", "", 145.50, -3.20, 148.50, -1.00),
    ("Bismarck Archipelago", "", 148.50, -7.00, 154.00, -1.00),
    ("Bougainville and Buka", "", 154.00, -7.20, 156.50, -4.80),
    ("Trobriand Islands", "", 150.60, -9.00, 151.60, -8.20),
    ("D’Entrecasteaux Islands", "", 149.50, -10.40, 151.50, -8.90),
    ("Louisiade Archipelago", "", 150.50, -12.20, 154.70, -10.00),
    ("Solomon Islands", "", 155.00, -12.60, 163.50, -4.80),
    ("Gilbert Islands", "", 171.50, -3.50, 178.50, 4.50),
    ("Nauru", "", 166.60, -0.90, 167.20, -0.30),
    # Singapore and its islands, and Ulleung with the Liancourt Rocks. Both
    # were Japanese-held on both of this map's dates — Singapore from February
    # 1942, Ulleung as part of Chōsen and the Liancourt Rocks as part of Shimane
    # prefecture since 1905 — and both are places a reader zooms into.
    ("Singapore and its islands", "昭南島", 103.55, 1.13, 104.15, 1.50),
    # The South China Sea. Fetched only on a deep zoom into that water, which is
    # where a reader has to be before any of these is more than a speck.
    ("Spratly Islands", "新南群島", 111.6, 7.2, 116.9, 11.9),
    ("Paracel Islands", "西沙群島", 110.8, 15.6, 113.2, 17.3),
    ("Pratas", "東沙島", 116.6, 20.5, 116.9, 20.9),
    ("Ulleung and the Liancourt Rocks", "鬱陵島・竹島", 130.70, 37.20, 131.95, 37.70),
    # Wake, which Japan renamed Ōtorishima after taking it in December 1941.
    # The base map draws it from eight points traced by hand because Natural
    # Earth does not carry the atoll at all; the survey has it in 876.
    ("Wake Island", "大鳥島", 166.45, 19.15, 166.80, 19.45),
    ("Ocean Island", "", 169.30, -1.00, 169.80, -0.60),

    # The central Pacific, west of the date line and then east of it, which is
    # why these boxes are the only ones here written in negative longitudes:
    # the group is decided on the ring as the source gives it, before it is
    # lifted into the map's 0-360 frame. English only, on the same rule as
    # Melanesia — none of these was Japanese on either date, and Japan never
    # came within six hundred miles of the Ellice.
    ("Ellice Islands", "", 175.00, -11.00, 180.00, -5.30),
    ("Phoenix Islands", "", -175.30, -5.30, -170.40, -2.40),
    ("Tokelau", "", -172.90, -9.70, -170.90, -8.20),
    ("Swains Island", "", -171.30, -11.25, -170.90, -10.85),
    ("Northern Cook Islands", "", -166.20, -11.90, -165.10, -10.60),
    ("Howland and Baker Islands", "", -176.90, -0.10, -176.20, 1.10),
]

# Which atom each group's islands belong to. By table rather than by whichever
# atom's geometry is nearest: nearness split the Ōsumi islands between Japan
# proper and the Ryukyus, because Yakushima is closer to Kyushu than to Okinawa
# while the map has always drawn it as part of the Ryukyu arc.
FINE_GROUP_ATOM = {
    "Ōsumi Islands": "ryukyu",
    "Tokara Islands": "ryukyu",
    "Amami Islands": "ryukyu",
    "Okinawa Islands": "ryukyu",
    "Daitō Islands": "ryukyu",
    "Senkaku Islands": "ryukyu",
    "Miyako Islands": "ryukyu",
    "Yaeyama Islands": "ryukyu",
    "Izu Islands": "japan",
    "Bonin Islands": "ogasawara",
    "Volcano Islands": "ogasawara",
    "Mariana Islands": "nanyo",     # except Guam, which is its own atom
    "Palau Islands": "nanyo",
    "Yap Islands": "nanyo",
    "Truk Islands": "nanyo",
    "Ponape": "nanyo",
    "Kusaie": "nanyo",
    "Marshall Islands": "nanyo",
    "Caroline Islands": "nanyo",
    "Admiralty Islands": "newguinea_au",
    "Bismarck Archipelago": "newguinea_au",
    "Bougainville and Buka": "newguinea_au",
    "Trobriand Islands": "newguinea_au",
    "D’Entrecasteaux Islands": "newguinea_au",
    "Louisiade Archipelago": "newguinea_au",
    "Gilbert Islands": "gilberts",
    "Nauru": "nauru_au",
    "Singapore and its islands": "malaya",
    "Spratly Islands": "spratly",
    "Paracel Islands": "paracel",
    "Pratas": "pratas",
    "Ulleung and the Liancourt Rocks": "korea",
    "Ocean Island": "gilberts",
    "Wake Island": "wake",
    "Ellice Islands": "ellice",
    "Phoenix Islands": "linephoenix",
    "Tokelau": "nzpacific",
    "Swains Island": "uspacific",
    "Northern Cook Islands": "nzpacific",
    "Howland and Baker Islands": "uspacific",
    # The Solomons are the one group whose islands do not share an atom. In
    # December 1942 the archipelago was cut in half by the fighting, and this
    # map already draws that: Guadalcanal contested, Tulagi taken, Malaita and
    # the south-east Allied, the north-west Japanese. So each island goes to
    # whichever of those atoms it is nearest, which is the same thing as asking
    # which one already draws it.
    "Solomon Islands": "*nearest",
}

# Atoms that stand for one named island each, and may only ever be given that
# island; and the two that hold the rest of the archipelago, north-west and
# south-east of the fighting.
SOLOMON_SINGLE = ["solomons_gc", "solomons_us", "solomons_ml"]
SOLOMON_BULK = ["solomons_br", "solomons_al"]

# Guam was American until December 1941 and is drawn as its own territory, so
# it cannot go in with the mandate. Everything in the Marianas south of this
# parallel is Guam; Rota, the next island north, is at 14.14 N.
GUAM_LAT = 13.9

# The Senkakus were administered from Okinawa on both of this map's dates and
# are drawn as Japanese, which is what the map is about; the Chinese names are
# given beside the Japanese because the islands are disputed and a reader who
# knows them by those names should find them. Traditional characters, as the
# rest of the map uses.
SENKAKU = {
    "魚釣島": ("Uotsuri-shima", "釣魚臺"),
    "久場島": ("Kuba-shima", "黃尾嶼"),
    "大正島": ("Taishō-tō", "赤尾嶼"),
    "北小島": ("Kita-kojima", "北小島"),
    "南小島": ("Minami-kojima", "南小島"),
}

# Islands a reader will look for under a name that is not the romanisation of
# the Japanese. Keyed by group and by the Japanese name, because there is more
# than one 硫黄島 in these waters and only one of them is Iwo Jima: the other is
# off Satsuma, five hundred miles away, and was never fought over.
# Keyed by group and by either the Japanese name or the English OSM gives.
FINE_ALIAS = {
    ("Volcano Islands", "硫黄島"): ("Iwo Jima (Iō-tō)",),
    ("Volcano Islands", "北硫黄島"): ("Kita-Iō-tō",),
    ("Volcano Islands", "南硫黄島"): ("Minami-Iō-tō",),
    ("Ōsumi Islands", "硫黄島"): ("Iōjima, off Satsuma",),
    ("Bonin Islands", "平島"): ("Hira-shima",),
    ("Okinawa Islands", "古宇利島"): ("Kouri-jima",),
    ("Okinawa Islands", "奥武島"): ("Ō-jima",),
    ("Okinawa Islands", "オーハ島"): ("Ōha-jima",),

    # The Pacific islands OSM gives their present-day local names, which are
    # not the names on a map of this period or in anything written about the
    # war there. Both are given, the period name first.
    ("Marshall Islands", "Kuwajleen"): ("Kwajalein (Kuwajleen)",),
    ("Marshall Islands", "Wotja Island"): ("Wotje",),
    ("Marshall Islands", "Enewetak"): ("Eniwetok (Enewetak)",),
    ("Marshall Islands", "Jabor"): ("Jaluit (Jabor)",),
    ("Ponape", "Pohnpei"): ("Ponape (Pohnpei)",),
    ("Kusaie", "Kosrae"): ("Kusaie (Kosrae)",),
    ("Truk Islands", "Tonowas"): ("Dublon (Tonowas)",),
    ("Truk Islands", "Weno"): ("Moen (Weno)",),
    ("Caroline Islands", "Enewetak"): ("Eniwetok (Enewetak)",),
}

# Micronesia, Melanesia, Polynesia: the region a group sits in, which is what a
# reader needs between the group and who held it.
FINE_REGION = {
    "Mariana Islands": "Micronesia", "Palau Islands": "Micronesia",
    "Yap Islands": "Micronesia", "Truk Islands": "Micronesia",
    "Ponape": "Micronesia", "Kusaie": "Micronesia",
    "Caroline Islands": "Micronesia", "Marshall Islands": "Micronesia",
    "Gilbert Islands": "Micronesia", "Nauru": "Micronesia",
    "Ocean Island": "Micronesia", "Wake Island": "Micronesia",
    "Admiralty Islands": "Melanesia", "Bismarck Archipelago": "Melanesia",
    "Bougainville and Buka": "Melanesia", "Trobriand Islands": "Melanesia",
    "D’Entrecasteaux Islands": "Melanesia", "Louisiade Archipelago": "Melanesia",
    "Solomon Islands": "Melanesia",
}

# Groups that sit inside a larger one. The Carolines run from Palau in the west
# to Kusaie in the east, so Palau, Yap, Truk, Ponape and Kusaie are all
# Caroline groups; naming only the small group loses that, and naming only the
# Carolines loses which part of them you are on, so both are given.
FINE_PARENT = {
    "Palau Islands": "Caroline Islands",
    "Yap Islands": "Caroline Islands",
    "Truk Islands": "Caroline Islands",
    "Ponape": "Caroline Islands",
    "Kusaie": "Caroline Islands",
}

# The Japanese names of the mandate's islands. Japan governed these for
# twenty-six years and named them; a map of the Japanese empire that gives only
# the present-day forms leaves the reader unable to match the map to anything
# written about the place at the time — Truk's inner islands in particular,
# which the navy renamed after the seasons and the days of the week and which
# appear under those names in every account of the base.
#
# Only the mandate. Guam was American, the Gilberts were British and the
# Solomons and the Bismarcks were Australian or British, and putting Japanese
# names on those would say something about them that was not true on either of
# this map's dates.
NANYO_JA = {
    # the Marianas, north of Guam
    "Saipan": "サイパン島 (Saipan-tō)",
    "Tinian": "テニアン島 (Tenian-tō)",
    "Rota": "ロタ島 (Rota-tō)",
    "Aguijan": "アギガン島 (Agigan-tō)",
    "Pagan": "パガン島 (Pagan-tō)",
    "Agrihan": "アグリハン島 (Agurihan-tō)",
    "Alamagan": "アラマガン島 (Aramagan-tō)",
    "Anatahan": "アナタハン島 (Anatahan-tō)",
    "Asuncion": "アスンシオン島 (Asunshion-tō)",
    "Sarigan": "サリガン島 (Sarigan-tō)",
    "Guguan": "グガン島 (Gugan-tō)",
    "Maug": "マウグ島 (Maugu-tō)",
    "Farallon de Medinilla": "メジニラ島 (Mejinira-tō)",
    "Farallon de Pajaros": "ウラカス島 (Urakasu-tō)",
    "Uracas": "ウラカス島 (Urakasu-tō)",
    # Palau
    "Babeldaob": "バベルダオブ島 (Baberudaobu-tō)",
    "Babelthuap": "バベルダオブ島 (Baberudaobu-tō)",
    "Koror": "コロール島 (Korōru-tō)",
    "Malakal": "マラカル島 (Marakaru-tō)",
    "Arakabesan": "アラカベサン島 (Arakabesan-tō)",
    "Peleliu": "ペリリュー島 (Peririyū-tō)",
    "Angaur": "アンガウル島 (Angauru-tō)",
    "Ngeruktabel": "ウルクターブル島 (Urukutāburu-tō)",
    "Sonsorol": "ソンソロール島 (Sonsorōru-tō)",
    "Tobi": "トビ島 (Tobi-tō)",
    # Yap and the western Carolines
    "Yap": "ヤップ島 (Yappu-tō)",
    "Ulithi": "ウリシー環礁 (Urishī Kanshō)",
    "Fais": "ファイス島 (Faisu-tō)",
    "Woleai": "ウォレアイ環礁 (Woreai Kanshō)",
    "Ifalik": "イファリク環礁 (Ifariku Kanshō)",
    "Lamotrek": "ラモトレック環礁 (Ramotorekku Kanshō)",
    "Satawal": "サタワル島 (Satawaru-tō)",
    "Puluwat": "プルワット環礁 (Puruwatto Kanshō)",
    # Truk, renamed island by island by the navy that based itself there
    "Moen (Weno)": "春島 (Haru-shima)",
    "Weno": "春島 (Haru-shima)",
    "Dublon (Tonowas)": "夏島 (Natsu-shima)",
    "Tonowas": "夏島 (Natsu-shima)",
    "Fefan": "秋島 (Aki-shima)",
    "Uman": "冬島 (Fuyu-shima)",
    "Tol": "水曜島 (Suiyō-tō)",
    "Udot": "月曜島 (Getsuyō-tō)",
    "Fanapanges": "火曜島 (Kayō-tō)",
    "Romanum": "金曜島 (Kinyō-tō)",
    "Eot": "木曜島 (Mokuyō-tō)",
    "Param": "楓島 (Kaede-shima)",
    "Eten": "竹島 (Take-shima)",
    "Etten": "竹島 (Take-shima)",
    # the eastern Carolines
    "Ponape (Pohnpei)": "ポナペ島 (Ponape-tō)",
    "Pohnpei": "ポナペ島 (Ponape-tō)",
    "Kusaie (Kosrae)": "クサイエ島 (Kusaie-tō)",
    "Kosrae": "クサイエ島 (Kusaie-tō)",
    "Pingelap": "ピンゲラップ環礁 (Pingerappu Kanshō)",
    "Mokil": "モキール環礁 (Mokīru Kanshō)",
    "Nukuoro": "ヌクオロ環礁 (Nukuoro Kanshō)",
    "Kapingamarangi": "カピンガマランギ環礁 (Kapingamarangi Kanshō)",
    # the Marshalls
    "Jaluit (Jabor)": "ヤルート環礁 (Yarūto Kanshō)",
    "Jabor": "ヤルート環礁 (Yarūto Kanshō)",
    "Kwajalein (Kuwajleen)": "クェゼリン環礁 (Kuwajerin Kanshō)",
    "Kuwajleen": "クェゼリン環礁 (Kuwajerin Kanshō)",
    "Wotje": "ウォッゼ環礁 (Wottsuje Kanshō)",
    "Maloelap": "マロエラップ環礁 (Maroerappu Kanshō)",
    "Mili": "ミレ環礁 (Mire Kanshō)",
    "Majuro": "マジュロ環礁 (Majuro Kanshō)",
    "Arno": "アルノ環礁 (Aruno Kanshō)",
    "Ebon": "エボン環礁 (Ebon Kanshō)",
    "Likiep": "リキエップ環礁 (Rikieppu Kanshō)",
    "Ailinglaplap": "アイリングラップラップ環礁 (Airingurappurappu Kanshō)",
    "Namu": "ナム環礁 (Namu Kanshō)",
    "Rongelap": "ロンゲラップ環礁 (Rongerappu Kanshō)",
    "Bikini": "ビキニ環礁 (Bikini Kanshō)",
    "Eniwetok (Enewetak)": "エニウェトク環礁 (Eniuetoku Kanshō)",
    "Enewetak": "エニウェトク環礁 (Eniuetoku Kanshō)",
    "Utirik": "ウチリック環礁 (Uchirikku Kanshō)",
    "Taroa": "タロア島 (Taroa-tō)",
}

ATOLL_MAX_DEG = 1.0        # a hundred kilometres; wider is a chain, not an atoll

# How far inland to look when asking whether the occupation reaches a stretch of
# coast, in projected units — about three kilometres.
COAST_INLAND = 0.6


def occupied_coast(outline, occupied):
    """China's coastline split in two: what the occupation reaches, and what it
    does not. Both come back as lists of open lines.

    Everything on this map is painted fill *and* stroke in its own colour, and
    the stroke does not scale: half of its 1.3 pixels falls outside the shape,
    which is what closes the hairline between two neighbours drawn from
    different files. At a coast it fattens the shore into the sea instead, and
    that is where the occupation had a problem no clip can solve. The shading is
    drawn through a clip cut to China's land, so its own stroke stops at the
    waterline while China's — Free China's yellow — does not, and a yellow
    thread one pixel wide ran the whole length of the occupied coast.

    A clip cannot help, because it is the clip that cuts the stroke off. Growing
    it cannot either: the overhang is a screen pixel, so in map units it is four
    times wider at the widest view than at the deepest. A mask of the same path
    filled and stroked white was right at the widest view and leaked again at
    the deepest.

    So the line is drawn twice in two colours instead — China's coast stroked
    yellow where the occupation does not reach it and salmon where it does —
    and the number of stroked points on the map is what it always was. Drawing
    the salmon half as an *extra* path, over a filler that went on stroking
    itself yellow underneath, added 2,975 points of stroked geometry that
    measured at nine per cent of the work of panning the 1942 map.

    Whether the occupation reaches a stretch of coast is asked of the land just
    inside it, along the ring's own normal, and not of the distance to the
    traced edge. The first attempt allowed eleven kilometres of slack, because
    the traced edge often stops short of the shore, and that painted the
    occupation's colour on coast it never held — 61 points of it on the unheld
    Fukien shore, more on Leizhou. Asking whether the land three kilometres
    inland is occupied is both cheaper and right: where the answer is no, the
    strip between the traced edge and the sea is Free China's, and its coast
    ought to be yellow.
    """
    boxes = []
    for ring in occupied:
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        boxes.append((min(xs), min(ys), max(xs), max(ys), ring))

    def held(p):
        x, y = p
        for bx0, by0, bx1, by1, ring in boxes:
            if bx0 <= x <= bx1 and by0 <= y <= by1 and point_in_ring(p, ring):
                return True
        return False

    def reaches(ring, i, depth):
        p = ring[i]
        if held(p):
            return True
        n = len(ring)
        ax, ay = ring[i - 1]
        bx, by = ring[(i + 1) % n]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / L * depth, dx / L * depth
        for cand in ((p[0] + nx, p[1] + ny), (p[0] - nx, p[1] - ny)):
            if point_in_ring(cand, ring) and held(cand):
                return True
        return False

    def depth_for(ring):
        """How far inside this particular ring to look.

        Three kilometres is the right question to ask of a mainland shore and
        the wrong one to ask of an island a kilometre across: the point lands
        in the sea on the other side, fails the test that it is inside the
        ring at all, and the island is called unoccupied. Off Penglai that put
        a yellow rim round the Miaodao islands, which the map fills as taken.
        So the reach is a quarter of the ring's own size where that is less.
        """
        xs = [q[0] for q in ring]
        ys = [q[1] for q in ring]
        span = min(max(xs) - min(xs), max(ys) - min(ys))
        return min(COAST_INLAND, span / 4.0) if span else COAST_INLAND

    def split(ring, flags, want):
        n = len(ring)
        if not any(f == want for f in flags):
            return []
        if all(f == want for f in flags):
            return [list(ring) + [ring[0]]]
        start = next(i for i in range(n) if flags[i] == want and flags[i - 1] != want)
        out, cur = [], []
        for k in range(n + 1):
            i = (start + k) % n
            if k < n and flags[i] == want:
                cur.append(ring[i])
            elif cur:
                if len(cur) > 1:
                    out.append(cur)
                cur = []
        return out

    held_runs, free_runs = [], []
    for ring in outline:
        if len(ring) < 3:
            continue
        depth = depth_for(ring)
        flags = [reaches(ring, i, depth) for i in range(len(ring))]
        held_runs.extend(split(ring, flags, True))
        free_runs.extend(split(ring, flags, False))
    return held_runs, free_runs


FINE_MIN_KM2 = 0.05        # five hectares; below this it is a dot on the map
FINE_TOL_DEG = 0.002       # about half a pixel at the deepest zoom the map has



def _fine_stitch(chunks):
    """Put a coastline back together.

    The sources cap every line at a thousand vertices, so a coastline of any
    size arrives as a run of open pieces and has to be rejoined end to end
    before it can be filled. They rejoin exactly: 256 pieces make 48 rings with
    nothing left over, and 1,037 make 150 with one.
    """
    ends = collections.defaultdict(list)
    for i, c in enumerate(chunks):
        ends[c[0]].append(i)
        ends[c[-1]].append(i)
    used = [False] * len(chunks)
    out = []
    for i in range(len(chunks)):
        if used[i]:
            continue
        used[i] = True
        cur = list(chunks[i])
        grew = True
        while grew:
            grew = False
            for j in ends.get(cur[-1], []):
                if used[j]:
                    continue
                c = chunks[j]
                if c[0] == cur[-1]:
                    cur += c[1:]
                elif c[-1] == cur[-1]:
                    cur += c[::-1][1:]
                else:
                    continue
                used[j] = True
                grew = True
                break
            if grew:
                continue
            for j in ends.get(cur[0], []):
                if used[j]:
                    continue
                c = chunks[j]
                if c[-1] == cur[0]:
                    cur = c[:-1] + cur
                elif c[0] == cur[0]:
                    cur = c[::-1][:-1] + cur
                else:
                    continue
                used[j] = True
                grew = True
                break
        out.append(cur)
    return out


def _ring_km2(ring):
    a = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % len(ring)]
        a += x0 * y1 - x1 * y0
    lat = sum(p[1] for p in ring) / len(ring)
    return abs(a / 2) * (111.32 ** 2) * math.cos(math.radians(lat))


def _bbox(ring):
    return (min(p[0] for p in ring), min(p[1] for p in ring),
            max(p[0] for p in ring), max(p[1] for p in ring))


def _iou(a, b):
    ix0 = max(a[0], b[0]); iy0 = max(a[1], b[1])
    ix1 = min(a[2], b[2]); iy1 = min(a[3], b[3])
    if ix1 <= ix0 or iy1 <= iy0:
        return 0.0
    inter = (ix1 - ix0) * (iy1 - iy0)
    ua = (a[2] - a[0]) * (a[3] - a[1])
    ub = (b[2] - b[0]) * (b[3] - b[1])
    return inter / (ua + ub - inter) if (ua + ub - inter) else 0.0


def _osm_islands(path):
    """The named islands of a cached Overpass extract.

    Overpass answers `out center bb` with a bounding box for ways and relations
    and a centre for nodes — not both. Every island of any size is a relation,
    so reading only the centre threw all of them away and left the map naming
    Okinawa after a rock in its bay.
    """
    if not os.path.exists(path):
        return []
    out = []
    for e in json.load(open(path))["elements"]:
        t = e.get("tags") or {}
        if t.get("place") == "archipelago":
            continue
        b = e.get("bounds")
        box = (b["minlon"], b["minlat"], b["maxlon"], b["maxlat"]) if b else None
        c = e.get("center")
        if (not c or c.get("lon") is None) and box:
            c = {"lon": (box[0] + box[2]) / 2, "lat": (box[1] + box[3]) / 2}
        if not c or c.get("lon") is None:
            continue
        out.append({"lon": c["lon"], "lat": c["lat"], "box": box, "t": t,
                    "isl": t.get("place") == "island"})
    return out


def _osm_atolls(path):
    """The atolls and island groups of a cached extract.

    An atoll is one place with thirty islets in it, and OSM names the atoll
    rather than the islets: Ulithi, Woleai, Namonuito and most of the rest of
    the Carolines come through as a `place=archipelago` with nothing named
    inside it. Reading only the islands left a hundred and thirty rings in the
    mandate with no name at all, which is to say with the pointer telling a
    reader looking at Ulithi that they were somewhere in the Caroline Islands.
    An islet that no one has named is named for the atoll it belongs to.
    """
    if not os.path.exists(path):
        return []
    out = []
    for e in json.load(open(path))["elements"]:
        t = e.get("tags") or {}
        if t.get("place") != "archipelago":
            continue
        b = e.get("bounds")
        box = (b["minlon"], b["minlat"], b["maxlon"], b["maxlat"]) if b else None
        c = e.get("center")
        if (not c or c.get("lon") is None) and box:
            c = {"lon": (box[0] + box[2]) / 2, "lat": (box[1] + box[3]) / 2}
        if not box:
            continue
        # An atoll is a few tens of kilometres across. OSM also files the
        # Carolines themselves, the Palau group and the Ratak and Ralik chains
        # of the Marshalls under the same tag, and those cover hundreds of
        # kilometres: an islet inside one of them is not "on" it in any sense
        # a reader wants, and taking the name gave forty-four separate islets
        # called "Ratak Chain" and two in Kusaie called "Ralik Chain", which is
        # eight hundred miles away.
        if max(box[2] - box[0], box[3] - box[1]) > ATOLL_MAX_DEG:
            continue
        span = (box[2] - box[0]) * (box[3] - box[1])
        out.append({"box": box, "t": t, "span": span})
    # smallest first, so an islet inside Ulithi is called Ulithi and not
    # "Caroline Islands", which is the archipelago Ulithi is inside
    out.sort(key=lambda a: a["span"])
    return out


def _atoll_of(ring, atolls):
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    for a in atolls:
        x0, y0, x1, y1 = a["box"]
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return a["t"]
    return None


def _name_rings(rings, osm):
    """Give each ring the OSM name that best fits it.

    Largest first, so Okinawa claims 沖縄本島 before an islet inside its bay
    can, and no name is used twice. A bounding box that really overlaps wins
    outright; failing that, a name whose point falls inside the ring.
    """
    out = {}
    used = set()

    # Every ring was compared with every name — four million bounding-box
    # overlaps to place a few thousand islands. A name can only win by
    # overlapping the ring's box or by having its point inside the ring, and
    # both of those are local, so the names go in a grid and a ring asks only
    # the cells its own box covers. Nothing that could have won is left out.
    cell = 1.0
    nidx = None
    if OPT.fast_name:
        nidx = collections.defaultdict(list)
        for pi, p in enumerate(osm):
            b = p["box"] or (p["lon"], p["lat"], p["lon"], p["lat"])
            for gx in range(int(math.floor(b[0] / cell)),
                            int(math.floor(b[2] / cell)) + 1):
                for gy in range(int(math.floor(b[1] / cell)),
                                int(math.floor(b[3] / cell)) + 1):
                    nidx[(gx, gy)].append(pi)

    for ri, (_, ring) in enumerate(rings):
        rb = _bbox(ring)
        span = max(rb[2] - rb[0], rb[3] - rb[1], 0.004)
        pad = 0.3 * span
        best, bestkey = None, None
        if nidx is None:
            candidates = range(len(osm))
        else:
            seen = set()
            for gx in range(int(math.floor((rb[0] - pad) / cell)),
                            int(math.floor((rb[2] + pad) / cell)) + 1):
                for gy in range(int(math.floor((rb[1] - pad) / cell)),
                                int(math.floor((rb[3] + pad) / cell)) + 1):
                    seen.update(nidx.get((gx, gy), ()))
            candidates = sorted(seen)
        for pi in candidates:
            p = osm[pi]
            if pi in used:
                continue
            ov = _iou(rb, p["box"]) if p["box"] else 0.0
            near = (rb[0] - pad <= p["lon"] <= rb[2] + pad and
                    rb[1] - pad <= p["lat"] <= rb[3] + pad)
            if ov < 0.25 and not (near and point_in_ring((p["lon"], p["lat"]), ring)):
                continue
            cx, cy = (rb[0] + rb[2]) / 2, (rb[1] + rb[3]) / 2
            key = (1 if ov >= 0.25 else 0, ov, 1 if p["isl"] else 0,
                   -math.hypot(p["lon"] - cx, p["lat"] - cy))
            if bestkey is None or key > bestkey:
                bestkey, best = key, pi
        if best is not None:
            out[ri] = best
            used.add(best)
    return out


def _fine_group(ring):
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    for name, ja, x0, y0, x1, y1 in FINE_GROUPS:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return name, ja
    return None, None


def _fine_atom(ring, group, groups):
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    key = FINE_GROUP_ATOM.get(group)
    if key == "nanyo" and group == "Mariana Islands" and cy < GUAM_LAT:
        return "guam"
    if key == "*nearest":
        # First: is this island one of the ones an atom was made to stand for?
        # Guadalcanal, Tulagi and Malaita are single islands drawn on their own
        # because control of them differed in December 1942.
        for k in SOLOMON_SINGLE:
            for r in groups.get(k, []):
                if point_in_ring((cx, cy), r):
                    return k
        # Otherwise it goes to whichever atom's coast it lies nearest — the
        # coast, not the nearest *vertex*. That distinction is the whole of it.
        # These rings are simplified, so a lagoon island a kilometre off a shore
        # can be twenty from the nearest surviving vertex of it: Alite, in
        # Langalanga Lagoon off Malaita, measured 17.6 km to Malaita's nearest
        # vertex and 100.8 to the Western Solomons', and a vertex test that
        # looked only at the two bulk atoms sent it to the Japanese half of the
        # archipelago. By edge it is 2.7 km from Malaita and 43.6 from anything
        # else. Measured over the cases that matter: Alite 2.7 km to Malaita,
        # Tulagi 1.0 and Tanambogo 2.4 to Tulagi's own atom, Nggela Sule 0.8,
        # Savo 0.5 km to the Allied group and 15.8 to Guadalcanal, Pavuvu 2.5 and
        # 62.2. Every one is within three kilometres of the right answer and the
        # runner-up is fifteen to a hundred away, so all five atoms can be in the
        # running now — which is what puts a satellite islet with its own island
        # instead of with whichever big coastline happens to be over the horizon.
        best, bd = SOLOMON_BULK[0], float("inf")
        for k in SOLOMON_SINGLE + SOLOMON_BULK:
            for r in groups.get(k, []):
                d = ring_edge_distance((cx, cy), r)
                if d < bd:
                    bd, best = d, k
        return best
    return key


def _fine_name(tags, group):
    """One name per script out of an OSM record.

    A contested island carries every claimant's name in one string — the
    Senkakus come through as "魚釣島/釣魚臺/钓鱼岛" and "Diaoyu Island;Uotsurijima
    Island". This map is of the Japanese empire and the islands were run from
    Okinawa on both its dates, so the Japanese name leads and the Chinese is
    kept beside it rather than dropped.
    """
    def first(v):
        if not v:
            return ""
        for sep in (";", " / ", "/"):
            if sep in v:
                return v.split(sep)[0].strip()
        return v.strip()

    ja = first(tags.get("name:ja"))
    # a good many of these carry the Japanese in `name` and have no `name:ja`
    # at all — Minami-Iō-tō is one — so take `name` when it is in characters
    if not ja:
        bare = first(tags.get("name"))
        if bare and any("぀" <= c <= "ヿ" or "㐀" <= c <= "鿿" for c in bare):
            ja = bare
    # Chinese only where the island is contested and the Chinese name is part
    # of what a reader is looking for; everywhere else these are Japanese
    # islands and the map's rule is Japanese alone. OSM's own name:zh is in
    # simplified characters, which this map does not use.
    # keyed by group as well as by name: there is a 久場島 in the Senkakus and
    # another beside Kume-jima, and only one of them is disputed
    sen = SENKAKU.get(ja) if group == "Senkaku Islands" else None
    zh = sen[1] if sen else ""
    en = tags.get("name:en") or ""
    if ";" in en or "/" in en:
        # the English is a list of claims; the romanised Japanese is not
        en = first(tags.get("name:ja-Latn")) or first(en)
    en = first(en) or first(tags.get("name:ja-Latn")) or first(tags.get("name"))
    # OSM has no English or romanisation for some of the smaller islands, and
    # the bare `name` on a disputed one is a list of scripts. A headline in
    # characters would sit oddly above the Japanese line, so let the Japanese
    # be the headline instead. Tested for CJK rather than for being ASCII,
    # which was the first thing tried and which quietly threw away every
    # romanisation with a macron in it — "Iō Island" is not ASCII, and Iwo
    # Jima ended up captioned in characters alone because of it.
    if en and any("぀" <= c <= "ヿ" or "㐀" <= c <= "鿿"
                  for c in en):
        en = (sen[0] if sen else "") or ""
    # and where the name a reader knows is not the romanisation of the
    # Japanese, both are given
    alias = FINE_ALIAS.get((group, ja)) or FINE_ALIAS.get((group, en))
    return (alias[0] if alias else en), ja, zh


def build_fine_coast(groups):
    """Returns the fine-coastline SVG and each atom's box within it."""
    rows = []
    for gj, osmfiles in FINE_FILES:
        path = os.path.join(CACHE, gj)
        if not os.path.exists(path):
            sys.stderr.write(f"note: {gj} missing, its fine coastlines not drawn\n")
            continue
        closed, chunks = [], []
        with open(path) as fh:
            for feat in json.load(fh)["features"]:
                g = feat.get("geometry") or {}
                segs = g.get("coordinates") or []
                if g.get("type") == "LineString":
                    segs = [segs]
                elif g.get("type") != "MultiLineString":
                    continue
                for s in segs:
                    if len(s) < 3:
                        continue
                    pts = [(round(c[0], 7), round(c[1], 7)) for c in s]
                    (closed if pts[0] == pts[-1] else chunks).append(pts)
        rings = closed + [r for r in _fine_stitch(chunks)
                          if r[0] == r[-1] and len(r) >= 4]
        keep = []
        for r in rings:
            if _ring_km2(r) < FINE_MIN_KM2:
                continue
            if _fine_group(r)[0] is None:
                continue
            keep.append((_ring_km2(r), r))
        keep.sort(key=lambda t: -t[0])
        osm, atolls = [], []
        for f in osmfiles:
            osm.extend(_osm_islands(os.path.join(CACHE, f)))
            atolls.extend(_osm_atolls(os.path.join(CACHE, f)))
        atolls.sort(key=lambda a: a["span"])
        names = _name_rings(keep, osm)
        for ri, (area, ring) in enumerate(keep):
            t = osm[names[ri]]["t"] if ri in names else {}
            if not t:
                # nothing named this islet; the atoll it lies in did
                t = _atoll_of(ring, atolls) or {}
            rows.append((area, ring, t))

    if not rows:
        return "", {}
    by_atom = collections.defaultdict(list)
    unnamed = 0
    for area, ring, t in rows:
        simp = simplify([(x, y) for x, y in ring], FINE_TOL_DEG)
        if len(simp) < 4:
            continue
        pts = [project(x, y) for x, y in normalise_ring(simp)]
        if len(pts) < 4:
            continue
        gname, gja = _fine_group(ring)
        key = _fine_atom(ring, gname, groups)
        if not key:
            continue
        en, ja, zh = _fine_name(t, gname)
        # The mandate's islands carry the names Japan gave them. Only the
        # mandate: `key == "nanyo"` is exactly the atom the South Seas Mandate
        # is drawn as, so Guam next door, the Gilberts and the Bismarcks are
        # left alone.
        if key == "nanyo" and not ja:
            # OSM spells some of these "Tinian Island" and some "Tinian"
            bare = re.sub(r"\s+(Island|Islands|Atoll)$", "", en or "")
            ja = NANYO_JA.get(en) or NANYO_JA.get(bare) or ""
        if not en and not ja:
            unnamed += 1
        by_atom[key].append((en or ja, ja, zh, gname, gja, ring_to_path(pts)))

    out = ['<?xml version="1.0" encoding="utf-8"?>',
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(WIDTH)} {fmt(HEIGHT)}" '
           'id="jmap-fine">',
           "  <title>Fine coastlines and island names</title>"]
    boxes = {}
    for key in sorted(by_atom):
        shapes = by_atom[key]
        xs = [v for _, _, _, _, _, d in shapes
              for v in [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", d)][0::2]]
        ys = [v for _, _, _, _, _, d in shapes
              for v in [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", d)][1::2]]
        box = f"{fmt(min(xs))},{fmt(min(ys))},{fmt(max(xs))},{fmt(max(ys))}"
        boxes[key] = box
        out.append(f'  <g data-for="{key}" data-box="{box}">')
        for en, ja, zh, gname, gja, d in shapes:
            attr = ""
            if en:
                attr += f' data-prov="{esc(en)}"'
            if ja:
                attr += f' data-ja="{esc(ja)}"'
            if zh:
                attr += f' data-zh="{esc(zh)}"'
            if gname:
                attr += f' data-group="{esc(gname)}"'
            if gja:
                attr += f' data-group-ja="{esc(gja)}"'
            parent = FINE_PARENT.get(gname)
            if parent:
                attr += f' data-parent="{esc(parent)}"'
            region = FINE_REGION.get(gname)
            if region:
                attr += f' data-region="{esc(region)}"'
            out.append(f'    <path{attr} d="{d}"/>')
        out.append("  </g>")
    out.append("</svg>")
    total = sum(len(v) for v in by_atom.values())
    sys.stderr.write(
        f"fine coastlines: {total} islands, {unnamed} unnamed, across "
        f"{', '.join(f'{k} {len(v)}' for k, v in sorted(by_atom.items()))}\n")
    return "\n".join(out) + "\n", boxes


def _fc(features):
    return {"type": "FeatureCollection",
            "crs": {"type": "name",
                    "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": features}


def _feat(geom_type, coords, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": geom_type, "coordinates": coords}}


def _round(ring, nd=6):
    return [[round(x, nd), round(y, nd)] for x, y in ring]


def export_geojson(dest, groups, provinces, pieces):
    """The map's own geometry, in lon/lat, for opening somewhere else.

    Written from the same data the SVG is drawn from and at the point the SVG
    is drawn from it — before projection and before any thinning — so what
    comes out is what the map means rather than what it happens to look like at
    one scale.
    """
    os.makedirs(dest, exist_ok=True)
    wrote = []

    def put(name, fc):
        path = os.path.join(dest, name)
        with open(path, "w") as fh:
            json.dump(fc, fh, ensure_ascii=False, separators=(",", ":"))
        wrote.append((name, len(fc["features"]), os.path.getsize(path)))

    # --- the two courses of the Yellow River, and the Yangtze ---------------
    RIVERS = [
        ("yellow-river-before-1938.geojson", ["yellow_upper", "yellow_lower"],
         "The Yellow River in the bed it held from 1855 to 1938, reaching the "
         "sea through the Gulf of Chihli"),
        ("yellow-river-1938-1947.geojson", ["yellow_upper", "yellow_1938"],
         "The Yellow River after the dikes were cut at Huayuankou in June 1938: "
         "down the Chia-lu into the Ying, the Ying into the Huai, and through "
         "Hungtse Lake and the Grand Canal into the Yangtze"),
        ("yangzi.geojson", ["yangzi"], "The Yangtze"),
    ]
    for name, keys, note in RIVERS:
        feats = []
        for key in keys:
            for line in pieces.get(key, []):
                if len(line) >= 2:
                    feats.append(_feat("LineString", _round(line),
                                       {"river": key, "note": note}))
        if feats:
            put(name, _fc(feats))

    # --- the occupied zone, block by block, with the names it carries -------
    feats = []
    for n, block in enumerate(OCCUPIED_ZONE):
        ring = normalise_ring(chaikin(block, 2))
        if len(ring) < 3:
            continue
        if ring[0] != ring[-1]:
            ring = list(ring) + [ring[0]]
        feats.append(_feat("Polygon", [_round(ring)], {
            "name": OCCUPIED_BLOCKS[n] if n < len(OCCUPIED_BLOCKS) else "",
            "date": "December 1942",
            "note": "Traced from a period map of the occupation and adjusted to "
                    "December 1942. Approximate, and generous: Japanese control "
                    "ran along the railways and around the cities. Clip to the "
                    "land to get what the map draws.",
        }))
    put("occupied-zone-1942.geojson", _fc(feats))

    # --- the sub-units, named, and the atom outlines ------------------------
    feats = []
    for key in sorted(provinces):
        for pname, rings in provinces[key]:
            polys = []
            for r in rings:
                r = normalise_ring(r)
                if len(r) < 3:
                    continue
                if r[0] != r[-1]:
                    r = list(r) + [r[0]]
                polys.append([_round(r)])
            if polys:
                feats.append(_feat("MultiPolygon", polys,
                                   {"atom": key, "name": pname or None}))
    put("sub-units.geojson", _fc(feats))

    feats = []
    for key in sorted(groups):
        polys = []
        for r in groups[key]:
            r = normalise_ring(r)
            if len(r) < 3:
                continue
            if r[0] != r[-1]:
                r = list(r) + [r[0]]
            polys.append([_round(r)])
        if polys:
            feats.append(_feat("MultiPolygon", polys, {"atom": key}))
    put("land.geojson", _fc(feats))

    sys.stderr.write("exported to %s:\n" % dest)
    for name, n, size in wrote:
        sys.stderr.write("  %-34s %5d features  %6d KB\n" % (name, n, size // 1024))


if __name__ == "__main__":
    main()
