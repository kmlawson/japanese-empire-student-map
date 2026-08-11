#!/usr/bin/env python3
"""Build japan-empire-map.svg from public-domain / CC-BY vector data.

    python3 tools/build_map.py            # uses the cache in tools/cache/
    python3 tools/build_map.py --download # (re)fetch the source data

Sources
-------
Natural Earth 1:50m admin-0 and admin-1 (public domain) for the world.
ENP-China provincial boundaries for 1928-45 (CC BY 4.0) for everything inside
China. These are real Republican-era provinces — Jehol, Chahar, Suiyuan,
Liaoning, Jilin, Heilongjiang, Xikang — not modern ones reassembled, so the
Manchukuo and Mengchiang outlines are the historical ones.

What this produces
------------------
The SVG holds *atoms*: the smallest regions any historical snapshot needs, each
one path with a stable id "a-<atom>". data.js then composes atoms into
territories separately for each epoch, so Manchuria can be part of China in 1930
and Manchukuo in 1942 without duplicating geometry.

The one remaining approximation inside China is the area under Japanese control
around 1940, which is drawn as a set of whole provinces and labelled on the map
as approximate: control there ran along the railways and around the cities.
"""

import argparse
import collections
import json
import math
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)          # so `shapefile` resolves next to this file

import shapefile  # noqa: E402
import gpkg  # noqa: E402

ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache")

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
        (113.4, 31.6), (112.6, 31.2), (111.9, 31.05), (111.1, 30.75),
        (111.5, 30.3), (112.3, 30.2), (112.8, 29.9), (113.0, 29.5), (113.1, 29.1),
        (113.35, 28.9), (113.9, 28.85), (114.4, 29.0), (115.0, 29.05),
        (115.4, 28.6), (115.8, 28.15), (116.2, 28.2), (116.6, 28.6), (117.1, 29.1),
        (117.6, 29.6), (118.2, 29.85), (118.8, 29.6), (119.2, 29.35), (119.6, 28.9),
        (120.1, 29.0), (121.9, 29.2), (122.0, 29.3), (122.2, 29.6),
        (122.4, 30.0), (122.2, 30.4), (122.4, 30.9), (122.3, 31.7), (121.8, 32.5),
        (121.2, 33.5), (120.4, 34.5), (120.3, 35.0), (120.9, 36.0), (121.6, 36.6),
        (122.3, 36.85), (123.3, 37.35), (123.2, 37.9), (121.2, 38.1), (119.8, 37.9), (118.7, 38.4), (117.5, 38.7),
        (118.6, 39.0), (119.35, 39.55), (119.95, 40.0), (120.3, 40.3),
        (119.0, 40.3), (117.2, 40.7),
        (115.0, 40.7),
    ],
    # the corridor west along the railway through Suiyuan to Paotow
    [
        (109.6, 40.4), (111.8, 40.1), (113.4, 39.9), (113.4, 41.0), (111.8, 41.2),
        (109.6, 41.1),
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
    # Amoy, taken May 1938, and Kinmen, taken October 1937
    [(117.9, 24.35), (118.8, 24.4), (118.8, 24.85), (117.9, 24.65)],
    # Swatow and Chaochow, taken June 1939
    [(116.3, 23.15), (116.95, 23.25), (116.85, 23.75), (116.3, 23.6)],
]

# The Kwantung Leased Territory: the tip of the Liaodong peninsula, leased by
# Russia in 1898 and won by Japan in 1905. Its northern boundary ran across the
# isthmus from Pulandian bay on the west to Pikou on the east. It stayed a
# separately administered Japanese leasehold until 1945 — it was never absorbed
# into Manchukuo. The bounding box keeps the cut from also slicing off islands
# elsewhere along the Liaoning coast.
KWANTUNG_CUT = ((121.20, 39.66), (122.45, 39.28))
KWANTUNG_BOX = (120.55, 38.60, 123.00, 39.80)

# Layers taken from Konrad Lawson's own Modern East Asia GIS project, drawn in
# an azimuthal-equidistant projection centred on Wuhan and converted back to
# lon/lat here. See SOURCES.md.
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
INDIA_ENCLAVES = {
    "Goa": "goa", "Dādra and Nagar Haveli and Damān and Diu": "goa",
    "Puducherry": "pondicherry",
}

# Chandernagore on the Hooghly, French until 1950 and absorbed into West
# Bengal in 1954, so no modern unit answers to it. Drawn by hand.
CHANDERNAGORE = [
    (88.330, 22.833), (88.395, 22.833), (88.400, 22.885), (88.343, 22.885),
]

# The princely states, drawn together in one colour and named one by one.
# Every one of them is an approximation from modern units: Hyderabad is
# Telangana, its Telugu core, and the Nizam's dominions also took in Marathi
# and Kannada districts now in Maharashtra and Karnataka; Mysore is drawn from
# the whole of Karnataka and the state itself was the southern third.
INDIA_PRINCELY = {
    "Telangāna": "Hyderabad",
    "Jammu and Kashmīr": "Kashmir", "Ladākh": "Kashmir",
    "Azad Kashmir": "Kashmir", "Gilgit-Baltistan": "Kashmir",
    "Rājasthān": "Rajputana", "Karnātaka": "Mysore",
    "Kerala": "TravancoreCochin",
}

# Colonial Korea comes from tools/fetch_korea_1930.py, which builds the
# thirteen provinces and the coast that goes with them. It used to be
# assembled from the modern provinces of the two republics, which cannot be
# made to give the period map however they are grouped: Hwanghae was one
# province until 1954, Ryanggang and Jagang did not exist, and Kaesong was in
# Keiki-do rather than in Hwanghae.
KOREA_FILE = "korea_13_provinces.json"

# Drawn at the full detail of their source rather than simplified. Korea's
# provinces are traced finely enough to be the coastline as well as the
# boundaries, and simplifying them throws that away.
# Kengtung is a long thin salient down to Tachileik, and simplification
# takes the southern half of it off.
FULL_DETAIL = {"korea", "saharat"}

# Saharat Thai Doem: the Shan states east of the Salween — Kengtung and part
# of Mongpan — occupied and administered by Thai forces from 1942 and formally
# handed to Thailand by Japan in August 1943. Taken district by district rather
# than cut off with a straight line: Kengtung State is the three districts of
# Kengtung, Monghsat and Tachileik exactly, and the trans-Salween part of
# Mongpan is the eastern end of Langkho. See SOURCES.md.
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
# boundary ran from the Dutch border to the coast near Lae.
PAPUA_CUT = ((141.0, -5.2), (147.4, -6.9))

# The Yellow River's lower course was cut at Huayuankou in June 1938, when the
# Chinese army breached the dikes to slow the Japanese advance. Until the
# channel was closed again in 1947 the river ran south-east into the Huai
# instead of north-east to the Bohai, so the two maps need different halves of
# it. This is where the generated path is split.
HUAYUANKOU = (113.43, 34.92)

# Natural Earth's Yangtze centreline stops at Chinkiang, about 200 km short of
# the sea, which makes the river look as though it ends in a field outside
# Nanking. This carries it down the estuary past Nantung to the mouth. It
# begins exactly where the centreline ends, or the join shows as a gap.
YANGZI_TAIL = [
    (119.61, 32.20), (120.20, 32.10), (120.90, 32.00), (121.40, 31.80),
    (121.90, 31.55),
]

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
def china_front():
    return [(109.6, 38.69)] + list(OCCUPIED_ZONE[0][:59])


# The south China coast, from where the occupied zone meets the sea in Chekiang
# down to the Tonkin frontier. Everything seaward of this line is inside it, so
# the line runs just offshore — leaving the unoccupied coast of Fukien and
# Kwangtung outside — and turns inland at each place that was held: Amoy and
# Kinmen, Swatow and Chaochow, the Canton delta. It goes through the Qiongzhou
# strait, which leaves the Leizhou peninsula and Kwangchowwan north of it and
# outside — Japan did not take Kwangchowwan until February 1943 — while Hainan,
# seaward of the line, falls inside without needing to be traced round.
EXTENT_SOUTH_CHINA = [
    (121.5, 28.8), (121.2, 28.3), (120.7, 27.8), (120.4, 27.2), (120.0, 26.6),
    (119.8, 26.0), (119.5, 25.5), (119.1, 25.0), (118.9, 24.75),
    (118.4, 24.9), (117.9, 24.65), (117.9, 24.35), (118.1, 24.2),
    (117.4, 23.9), (116.85, 23.75), (116.3, 23.6), (116.3, 23.15), (116.7, 23.0),
    (115.5, 22.7), (114.8, 22.5),
    (114.6, 22.55), (114.55, 23.1), (113.9, 23.6), (113.15, 23.85),
    (112.85, 23.5), (112.6, 23.0), (112.65, 22.35),
    (111.8, 21.8), (110.9, 21.4), (110.45, 20.95),
    (110.2, 20.25), (109.6, 20.35),
    (109.4, 21.2), (108.6, 21.5), (108.1, 21.5),
]

# Ocean perimeter, running clockwise from the Bay of Bengal.
EXTENT_OCEAN = [
    (91.6, 20.0), (90.6, 16.0), (90.4, 12.0), (90.6, 8.0), (92.0, 3.5),
    (94.4, 0.0), (97.0, -3.6), (100.6, -6.6), (105.0, -8.6), (110.0, -10.2),
    (115.0, -11.0), (120.0, -11.4), (125.0, -11.6),
    # north of the Tiwi Islands and the Cobourg peninsula, which are Australian
    (129.0, -11.25), (131.0, -10.85), (132.6, -10.75), (134.0, -10.6),
    (137.0, -9.6),
    # along the Papuan peninsula, which Japan held the length of, bulging
    # north around Port Moresby on the south coast, which it never reached
    (139.2, -8.85), (140.4, -9.05), (141.1, -9.35), (142.0, -8.75),
    (144.0, -8.4), (145.6, -8.7), (146.5, -9.0),
    (147.4, -9.2), (148.4, -9.7), (149.7, -10.2), (150.9, -10.6),
    (152.6, -10.9), (155.4, -11.2), (159.0, -11.4),
    (163.0, -10.6), (167.0, -9.4), (171.0, -8.0), (175.0, -6.4), (179.0, -4.4),
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
EXTENT_MANCHURIA = (
    ("manchuria", "jehol", "chahar", "suiyuan"),
    (130.7, 42.4), (109.6, 38.69), (120.0, 51.0),
)

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


def line_plane(p, q, keep_right=True):
    """Half-plane bounded by the line p->q, keeping one side."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    a, b = dy, -dx           # normal pointing to the right of p->q
    c = -(a * p[0] + b * p[1])
    return (a, b, c) if keep_right else (-a, -b, -c)


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


def ring_area(points):
    a = 0.0
    n = len(points)
    for i in range(n):
        x0, y0 = points[i]
        x1, y1 = points[(i + 1) % n]
        a += x0 * y1 - x1 * y0
    return abs(a) / 2


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


def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def ring_to_path(points):
    d = [f"M{fmt(points[0][0])} {fmt(points[0][1])}"]
    px, py = points[0]
    for x, y in points[1:]:
        if abs(x - px) < 0.05 and abs(y - py) < 0.05:
            continue
        d.append(f"L{fmt(x)} {fmt(y)}")
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
    "Solomon Islands": "solomons_br",
    "East Timor": "timor_pt",
    "Palau": "nanyo", "Federated States of Micronesia": "nanyo",
    "Marshall Islands": "nanyo", "Northern Mariana Islands": "nanyo",
    "Nauru": "nauru_au",
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
    "India": split_india,
    "Singapore": lambda r: "malaya",
}

# Islands too small to see are marked with a ring. In the Pacific that is the
# only way to find them at all; over the Indies, the Philippines and the
# Andamans, where the islands are perfectly legible, the rings are just clutter.
ISLET_RINGS = {
    "nanyo", "gilberts", "ogasawara", "guam", "chishima", "aleutians",
    "hawaii", "ryukyu", "newguinea_au", "solomons_br", "nauru_au",
    "aleutians_jp",
}

ARCHIPELAGOS = {
    "nanyo", "gilberts", "ogasawara", "guam", "chishima", "aleutians",
    "aleutians_jp",
    "hawaii", "ryukyu", "newguinea_au", "solomons_br", "philippines",
    "timor_pt", "andaman", "nauru_au", "hongkong", "macau", "northborneo",
    "malaya",
}

# Drawn after the occupied shading, so the small enclaves it would otherwise
# bury are still there to see and to click.
ON_TOP = ["weihaiwei", "guangzhouwan", "macau", "hongkong", "kwantung"]

ORDER = [
    "chinabase", "andaman", "ceylon", "ussr", "mongolia", "tibet",
    "china", "xinjiang", "india", "princely", "goa", "pondicherry",
    "other", "nepal", "sikkim", "bhutan",
    "tuva", "weihaiwei", "guangzhouwan", "chahar", "suiyuan", "jehol", "manchuria",
    "siam", "burma", "saharat", "indochina", "siamgain", "malaya", "malaya_thai", "sarawak", "northborneo", "brunei",
    "dei", "philippines",
    "timor_pt", "newguinea_au", "solomons_br", "australia", "gilberts",
    "nauru_au", "guam", "hawaii", "aleutians", "aleutians_jp", "hongkong", "macau",
    "korea", "taiwan", "karafuto", "chishima", "nanyo", "ryukyu",
    "ogasawara", "japan", "kwantung",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--tolerance", type=float, default=0.55)
    ap.add_argument("--min-area", type=float, default=1.2)
    args = ap.parse_args()

    a0 = load("admin0", args.download)

    groups = collections.defaultdict(list)
    # Chinese atoms keep their provinces as separate sub-paths, so hovering can
    # name the province as well as the country.
    provinces = collections.defaultdict(list)
    # whole-country outlines kept aside to go under the sub-units; see
    # whole_union below
    backing = collections.defaultdict(list)

    # ---- everything except China ------------------------------------------
    for feat in a0["features"]:
        admin = feat["properties"].get("ADMIN")
        if admin in ("Hong Kong S.A.R.", "Macao S.A.R"):
            # the backing needs them: ENP's Kwangtung stops at the colony's
            # border, so the ground between the two belongs to neither layer
            for ring in iter_rings(feat["geometry"]):
                groups["chinabase"].append(ring)
        if admin == "China":
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
            for ring in iter_rings(feat["geometry"]):
                groups["chinabase"].append(ring)
            continue
        if admin == "Russia":
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
                groups[split_russia(ring)].append(ring)
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
                backing[malaysia_backing(ring)].append(ring)
            continue
        splitter = SPLITTERS.get(admin)
        if splitter:
            for ring in iter_rings(feat["geometry"]):
                key = splitter(ring)
                if key:
                    groups[key].append(ring)
                    backing[key].append(ring)
                    # the most important of the Straits Settlements, and the
                    # one the pointer could not name
                    if admin == "Singapore":
                        provinces["malaya"].append(("Singapore", [ring]))
            continue
        key = ADMIN0.get(admin)
        if not key:
            continue
        rings_here = list(iter_rings(feat["geometry"]))
        if admin in ("Laos", "Cambodia"):
            # drawn from provinces below, minus the 1941 cessions, but the
            # filler underneath is the whole country
            backing[key].extend(rings_here)
            continue
        groups[key].extend(rings_here)
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
            north = [grow_plane(line_plane(*PAPUA_CUT, keep_right=False), 0.02)]
            south = [grow_plane(line_plane(*PAPUA_CUT, keep_right=True), 0.02)]
            for label, planes in (("NewGuineaMandate", north), ("Papua", south)):
                cut = [c for c in (clip_halfplanes(r, planes) for r in rings_here) if len(c) >= 3]
                if cut:
                    provinces["newguinea_au"].append((label, cut))

    # ---- enclaves and princely states inside British India ----------------
    ind_path = os.path.join(CACHE, "adm1_IND.json")
    if os.path.exists(ind_path):
        with open(ind_path) as fh:
            for feat in json.load(fh)["features"]:
                name = feat["properties"].get("shapeName")
                key = INDIA_ENCLAVES.get(name)
                if key:
                    for ring in iter_rings(feat["geometry"]):
                        groups[key].append(ring)
                label = INDIA_PRINCELY.get(name)
                if label:
                    rs = list(iter_rings(feat["geometry"]))
                    groups["princely"].extend(rs)
                    provinces["princely"].append((label, rs))
    groups["pondicherry"].append(list(CHANDERNAGORE))

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
        with open(path) as fh:
            for feat in json.load(fh)["features"]:
                label = INDIA_STATES.get(feat["properties"].get("shapeName"))
                if label:
                    blocks[label].extend(iter_rings(feat["geometry"]))
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
    for key, fname in GIS_LAYERS.items():
        path = os.path.join(CACHE, "gis", fname)
        if not os.path.exists(path):
            sys.stderr.write(f"note: {fname} missing, {key} not drawn\n")
            continue
        for ring in gpkg.rings_lonlat(path):
            if len(ring) >= 3:
                groups[key].append(ring)

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
                    groups[key].extend(prings)
                    if key in ("malaya", "malaya_thai"):
                        label = {"Kuala Lumpur": "Selangor", "Putrajaya": "Selangor"}.get(pname, pname)
                        provinces[key].append((label.replace(" ", ""), prings))
                    elif key == "northborneo" and pname == "Labuan":
                        # a Straits Settlement in 1930, not chartered-company
                        # territory, and worth being able to name
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
    tally = collections.Counter()

    for att, rings in shapefile.read(ENP_PROVINCES):
        name = (att.get(ENP_NAME_FIELD) or "").strip()
        if not name or not rings:
            continue
        key = PROVINCE_ATOM.get(name) or "china"

        # Suiyuan is split at Paotow: only the east was Mengchiang's in fact
        if name == "Suiyuan":
            east = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=True)]
            west = [line_plane((SUIYUAN_CUT, 0.0), (SUIYUAN_CUT, 90.0), keep_right=False)]
            for side, dest, label in ((east, "suiyuan", "Suiyuan"),
                                      (west, "china", "SuiyuanWest")):
                cut = [c for c in (clip_halfplanes(r, side) for r in rings) if len(c) >= 3]
                if cut:
                    tally[dest] += 1
                    groups[dest].extend(cut)
                    provinces[dest].append((label, cut))
            continue

        tally[key] += 1
        groups[key].extend(rings)
        provinces[key].append((name, rings))

        # the leasehold is carved out of Liaoning and drawn on top of it
        if name == "Liaoning":
            for ring in rings:
                piece = clip_halfplanes(ring, kwantung_planes)
                if len(piece) >= 3 and ring_area(piece) > 0.0015:
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
    extent += chaikin(EXTENT_SOUTH_CHINA)
    for key, a, b, via in EXTENT_ARCS:
        rings = outlines([key])
        if rings:
            arc = boundary_arc(ring_for(rings, a, b), a, b, via)
            extent += simplify(arc, 0.03)
    extent += chaikin(EXTENT_OCEAN)
    keys, a, b, via = EXTENT_MANCHURIA
    ring = outline(keys)
    if ring:
        extent += simplify(boundary_arc(ring, a, b, via), 0.03)

    # the occupied zone, clipped to China's land so it stops at the coast and
    # at the frontier instead of being drawn as a blob over the sea
    occ_frame = box_planes(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX)
    occ_pieces, occ_moments = [], []
    for block in OCCUPIED_ZONE:
        ring = clip_halfplanes(normalise_ring(chaikin(block, 2)), occ_frame)
        if len(ring) < 3:
            continue
        pts = [project(x, y) for x, y in ring]
        occ_pieces.append(ring_to_path(pts))
        a = ring_area(pts)
        cx, cy = ring_centroid(pts)
        occ_moments.append((a, cx, cy))
    occ_path = "".join(occ_pieces)
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
        # Attu and Kiska are a thousand kilometres from anything else Japan
        # held, so they are rings of their own rather than a bulge in the
        # perimeter that would take the whole Aleutian chain with it.
        for x0, y0, x1, y1 in (ATTU_BOX, KISKA_BOX):
            box = [(x0 - 0.25, y0 - 0.12), (x1 + 0.25, y0 - 0.12),
                   (x1 + 0.25, y1 + 0.12), (x0 - 0.25, y1 + 0.12)]
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
                    cut = None
                    for i, (x, y) in enumerate(line):
                        if x <= HUAYUANKOU[0]:
                            cut = i
                    if cut is None:
                        pieces["yellow_lower"].append([HUAYUANKOU] + line)
                        continue
                    if cut >= 1:
                        pieces["yellow_upper"].append(line[:cut + 1] + [HUAYUANKOU])
                    if len(line) - cut >= 3:
                        pieces["yellow_lower"].append([HUAYUANKOU] + line[cut + 1:])
        if pieces["yangzi"]:
            pieces["yangzi"].append(YANGZI_TAIL)
        for key, lines in pieces.items():
            out_paths = []
            for line in lines:
                pts = [project(x, y) for x, y in normalise_ring(line)]
                pts = simplify(pts, 0.4)
                path = line_to_path(pts)
                if path:
                    out_paths.append(path)
            if out_paths:
                rivers[key] = "".join(out_paths)

    # ---- dissolve, project, clip, simplify --------------------------------
    frame = box_planes(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX)
    paths, dots, anchors, stats, hits = {}, {}, {}, [], {}
    SMALL_ATOM_AREA = 2600      # kept in step with the same name in map.js

    for key, rings in groups.items():
        merged = dissolve(rings) if len(rings) > 1 else None
        source = merged if merged else rings
        archipelago = key in ARCHIPELAGOS
        # the French and Portuguese enclaves are a few square kilometres each
        # and would otherwise fall through the minimum-area sieve
        min_area = (0.04 if key in ("goa", "pondicherry")
                    else 0.12 if archipelago else args.min_area)

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
            if span > 60:
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
            pieces.append(ring_to_path(pts))
            rcx, rcy = ring_centroid(pts)
            moments.append((area, rcx, rcy))
            if key in ISLET_RINGS and area < 20:
                specks.append((rcx, rcy, max(2.6, math.sqrt(area / math.pi) * 1.5)))

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

    ordered = [k for k in ORDER if k in paths] + [k for k in paths if k not in ORDER]
    # the enclaves that have to survive the occupied shading are held back and
    # drawn after it
    ordered = [k for k in ordered if k not in ON_TOP]

    def whole_union(key):
        """The country outline that goes under a territory's sub-units.

        Adjacent sub-units share an edge in the source and lose it to
        simplification, so two that used to meet no longer quite do and a
        hairline of ocean opens between them. Dissolving the sub-units does not
        help — several of these sets come from files that never shared vertices
        in the first place — so the filler is Natural Earth's own outline of the
        countries concerned, which has no seams in it by construction. Drawn
        underneath in the same colour, it turns every crack into solid ground."""
        # Korea has no separate coastline: its provinces are the finer source
        # and they dissolve into the country, so the filler comes from them
        rings = backing.get(key) or [r for _, rs in provinces.get(key, []) for r in rs]
        if not rings:
            return ""
        pieces = []
        for ring in (dissolve(rings) if len(rings) > 1 else rings):
            ring = clip_halfplanes(normalise_ring(ring), frame)
            if len(ring) < 3:
                continue
            pts = [project(x, y) for x, y in ring]
            if key not in FULL_DETAIL:
                pts = simplify(pts, args.tolerance)
            if len(pts) >= 3 and ring_area(pts) >= args.min_area:
                pieces.append(ring_to_path(pts))
        return "".join(pieces)

    def province_paths(key):
        """One path per Republican province, for the atoms built from them.

        Hovering can then name the province as well as the country. The paths
        share the atom's fill and stroke colour, so the seams between them are
        invisible until something asks for them."""
        blocks = []
        for pname, prings in provinces.get(key, []):
            merged = dissolve(prings) if len(prings) > 1 else None
            pieces = []
            for ring in (merged or prings):
                ring = clip_halfplanes(normalise_ring(ring), frame)
                if len(ring) < 3:
                    continue
                pts = [project(x, y) for x, y in ring]
                if key not in FULL_DETAIL:
                    pts = simplify(pts, args.tolerance)
                if len(pts) >= 3 and ring_area(pts) >= args.min_area:
                    pieces.append(ring_to_path(pts))
            if pieces:
                blocks.append((pname, "".join(pieces)))
        return blocks


    out = ['<?xml version="1.0" encoding="utf-8"?>']
    out.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(WIDTH)} {fmt(HEIGHT)}" '
        f'width="{fmt(WIDTH)}" height="{fmt(HEIGHT)}" id="jmap">'
    )
    out.append("  <title>The Japanese Empire in Asia and the Pacific</title>")
    out.append(
        f'  <metadata id="proj" data-lon-min="{LON_MIN}" data-lat-max="{LAT_MAX}" '
        f'data-px-per-deg="{PX_PER_DEG}" data-r="{R:.6f}"/>'
    )
    out.append("  <defs>")
    out.append(
        '    <pattern id="hatch" patternUnits="userSpaceOnUse" width="10" height="10" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="10" stroke="#1d1a15" stroke-opacity="0.30" stroke-width="2.4"/>'
        "</pattern>"
    )
    out.append(
        '    <pattern id="hatch-occ" patternUnits="userSpaceOnUse" width="9" height="9" '
        'patternTransform="rotate(45)">'
        '<line x1="0" y1="0" x2="0" y2="9" stroke="#e0781f" stroke-opacity="0.85" stroke-width="3.4"/>'
        "</pattern>"
    )
    # The occupied zone is clipped to China's land. Clip it to the shape that
    # is actually drawn — the union of the provinces — and not to the dissolved
    # outline of the same rings, which simplifies to a slightly different
    # coastline and let the shading hang out over the water.
    china_drawn = "".join(pd for _, pd in province_paths("china")) or paths.get("china", "")
    if china_drawn:
        out.append(f'    <clipPath id="clip-china"><path d="{china_drawn}"/></clipPath>')
    out.append("  </defs>")
    out.append(f'  <rect id="ocean" x="0" y="0" width="{fmt(WIDTH)}" height="{fmt(HEIGHT)}"/>')
    out.append('  <g id="land">')
    def emit(key):
        ax, ay, area = anchors[key]
        meta = f'data-cx="{fmt(ax)}" data-cy="{fmt(ay)}" data-area="{int(area)}"'
        if key in hits:
            pts = " ".join(f"{fmt(x)},{fmt(y)}" for x, y in hits[key])
            meta += f' data-hits="{pts}"'
        if key.startswith("chinabase"):
            out.append(f'    <path id="{key}" class="chinabase" d="{paths[key]}"/>')
            return
        blocks = province_paths(key)
        specks = dots.get(key) or []
        if blocks:
            out.append(f'    <g id="a-{key}" class="atom" {meta}>')
            # The sub-units come from a different source than each other and
            # are simplified one ring at a time, so two that shared an edge no
            # longer quite do and a hairline of ocean opens between them. The
            # whole shape goes underneath them first, in the same colour, so a
            # crack shows the country rather than the sea.
            whole = whole_union(key)
            if whole:
                out.append(f'      <path class="whole" d="{whole}"/>')
            for pname, pd in blocks:
                # an unnamed leftover gets no attribute at all: an empty one
                # reads as a sub-unit that can never be named or outlined
                attr = f' data-prov="{pname}"' if pname else ""
                out.append(f'      <path{attr} d="{pd}"/>')
            for cx, cy, r in specks:
                out.append(f'      <circle class="islet-hit" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
                out.append(f'      <circle class="islet" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
            out.append("    </g>")
            return
        if specks:
            out.append(f'    <g id="a-{key}" class="atom" {meta}>')
            out.append(f'      <path d="{paths[key]}"/>')
            for cx, cy, r in specks:
                out.append(f'      <circle class="islet-hit" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
                out.append(f'      <circle class="islet" cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/>')
            out.append("    </g>")
        else:
            out.append(f'    <path id="a-{key}" class="atom" {meta} d="{paths[key]}"/>')
    for key in ordered:
        emit(key)
    if occ_path:
        ax, ay, area = occ_anchor
        out.append(
            f'    <path id="a-occupiedzone" class="atom" clip-path="url(#clip-china)" '
            f'data-cx="{fmt(ax)}" data-cy="{fmt(ay)}" data-area="{int(area)}" d="{occ_path}"/>'
        )
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
    out.append("</svg>")

    dest = os.path.join(ROOT, "japan-empire-map.svg")
    with open(dest, "w") as fh:
        fh.write("\n".join(out) + "\n")

    sys.stderr.write(f"wrote {dest} ({os.path.getsize(dest)/1024:.0f} KB, {fmt(WIDTH)}x{fmt(HEIGHT)})\n")
    for key, n, size, how in sorted(stats, key=lambda s: -s[2]):
        sys.stderr.write(f"  {key:16s} {n:4d} rings {size/1024:7.1f} KB  {how}\n")


if __name__ == "__main__":
    main()
