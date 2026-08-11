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

SOURCES = {
    "admin0": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
    "admin1": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson",
    "rivers": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson",
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
# domain, in occupation-maps/) and adjusted to December 1942 against the module
# timeline: Chengchow taken October 1941, Changsha held out until 1944, Foochow
# only briefly held in 1941.
#
# It is not a set of provinces. Japan held the plains, the railways and the
# cities; the western halves of Shansi and Honan, the Communist base areas
# behind the lines, and most of Hunan, Kiangsi and Fukien were never taken. The
# blocks below are clipped to China's land at draw time.
OCCUPIED_ZONE = [
    # the northern and central mass: Hopei, Shantung, eastern Shansi, eastern
    # Honan, the Yangtze corridor to Hankow, and the Kiangnan provinces
    [
        (113.2, 40.5), (115.0, 40.7), (117.2, 40.7), (119.0, 40.3), (120.0, 40.1),
        (119.3, 39.2), (118.2, 39.0), (117.6, 38.5), (118.9, 38.2), (119.8, 37.7),
        (121.0, 37.9), (122.7, 37.5), (121.2, 36.5), (120.5, 35.9), (119.9, 34.9),
        (119.6, 34.4), (120.5, 33.4), (121.2, 32.4), (121.9, 31.6), (122.0, 30.9),
        (121.6, 30.2), (122.0, 29.9), (121.7, 29.2), (121.0, 28.3), (120.4, 28.0),
        (119.4, 28.7), (118.4, 29.4), (117.4, 29.6), (116.7, 29.0), (116.0, 28.4),
        (115.4, 28.9), (114.7, 29.3), (113.6, 29.6), (112.9, 30.0), (111.6, 30.5),
        (111.2, 31.2), (111.7, 32.0), (112.5, 32.7), (113.4, 33.3), (113.7, 34.2),
        (112.5, 34.8), (111.8, 35.3), (112.2, 36.5), (112.6, 37.6), (113.0, 38.8),
    ],
    # the corridor west along the railway through Suiyuan to Paotow
    [
        (109.6, 40.4), (111.8, 40.1), (113.4, 39.9), (113.4, 41.0), (111.8, 41.2),
        (109.6, 41.1),
    ],
    # the Canton delta and the West River, held from October 1938: the city,
    # the delta, the railway to Kowloon and the river up to Samshui
    [
        (112.4, 22.1), (112.9, 21.9), (113.6, 21.8), (114.3, 22.0), (114.6, 22.4),
        (114.5, 23.0), (113.9, 23.4), (113.3, 23.6), (112.8, 23.5), (112.3, 23.2),
        (112.0, 22.7),
    ],
    # Hainan, taken February 1939
    [
        (108.6, 18.2), (109.6, 18.1), (110.6, 18.6), (111.1, 19.4), (110.8, 20.1),
        (109.9, 20.2), (109.0, 19.8), (108.5, 19.0),
    ],
    # Amoy, taken May 1938
    [(117.9, 24.3), (118.4, 24.3), (118.5, 24.7), (118.0, 24.7)],
    # Swatow, taken June 1939
    [(116.5, 23.1), (117.1, 23.2), (117.1, 23.6), (116.5, 23.5)],
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

# Enclaves and a princely state inside British India that were not the Raj.
# Hyderabad is approximated by Telangana, its Telugu core; the Nizam's dominion
# also took in Marathi and Kannada districts now in Maharashtra and Karnataka.
INDIA_ENCLAVES = {"Goa": "goa", "Puducherry": "pondicherry", "Telangāna": "hyderabad"}

# Colonial Korea's thirteen provinces, from the modern units that make them up.
# The units that did not exist yet go back where they came from: Ryanggang was
# split off South Hamgyong in 1954, Jagang off North Pyongan in 1949, and
# Hwanghae was one province until 1954. Kaesong, now in North Hwanghae, was in
# Keiki-do until 1945, which this cannot recover from provincial outlines.
KOREA_PROVINCES = {
    "Seoul": "Keiki", "Incheon": "Keiki", "Gyeonggi": "Keiki",
    "Gangwon": "Kogen", "Kangwon": "Kogen",
    "North Chungcheong": "Chuseihoku", "South Chungcheong": "Chuseinan",
    "Daejeon": "Chuseinan", "Sejong": "Chuseinan",
    "North Jeolla": "Zenrahoku", "South Jeolla": "Zenranan",
    "Gwangju": "Zenranan", "Jeju": "Zenranan",
    "North Gyeongsang": "Keishohoku", "Daegu": "Keishohoku",
    "South Gyeongsang": "Keishonan", "Busan": "Keishonan", "Ulsan": "Keishonan",
    "North Hwanghae": "Kokai", "South Hwanghae": "Kokai",
    "North Pyongan": "Heianhoku", "Jagang": "Heianhoku",
    "South Pyongan": "Heiannan", "Pyongyang": "Heiannan", "Nampo": "Heiannan",
    "North Hamgyong": "Kankyohoku",
    "South Hamgyong": "Kankyonan", "Ryanggang": "Kankyonan",
}

# Burma's divisions and the frontier areas, under their period names.
BURMA_DIVISIONS = {
    "Yangon": "Pegu", "Bago": "Pegu", "Ayeyarwady": "Irrawaddy",
    "Magway": "Magwe", "Mandalay": "MandalayDiv", "Saigang": "Sagaing",
    "Tanitharyi": "Tenasserim", "Rakhine": "Arakan",
    "Shan": "ShanStates", "Kachin": "KachinHills", "Chin": "ChinHills",
    "Kayah": "Karenni", "Kayin": "Salween", "Mon": "Pegu",
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
    # princely states large enough to be worth telling apart
    "Jammu and Kashmīr": "Kashmir", "Ladākh": "Kashmir", "Azad Kashmir": "Kashmir",
    "Gilgit-Baltistan": "Kashmir",
    "Rājasthān": "Rajputana",
    "Karnātaka": "Mysore", "Kerala": "TravancoreCochin",
    # provinces of the Raj
    "Assam": "Assam", "Meghālaya": "Assam", "Nāgāland": "Assam",
    "Mizoram": "Assam", "Arunāchal Pradesh": "Assam", "Manipur": "Assam",
    "Tripura": "Assam",
    "West Bengal": "Bengal", "Barisal": "Bengal", "Chittagong": "Bengal",
    "Dhaka": "Bengal", "Khulna": "Bengal", "Mymensingh": "Bengal",
    "Rajshani": "Bengal", "Rangpur": "Bengal", "Sylhet": "Bengal",
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
    "Dādra and Nagar Haveli and Damān and Diu": "Bombay",
    "Tamil Nādu": "Madras", "Andhra Pradesh": "Madras", "Lakshadweep": "Madras",
}

# Siam's changwat. The modern country has seventy-seven; in 1942 it had seventy,
# and every difference is a later split, so merging the children back into their
# parents recovers the period set. Under the 1930 map these sat inside the
# monthon, the "circles" abolished in 1933; the changwat themselves ran through
# both dates.
SIAM_SPLITS = {
    "Amnat Charoen": "Ubon Ratchathani", "Yasothon": "Ubon Ratchathani",
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

# Natural Earth's Yangtze centreline stops about 170 km short of the sea, which
# makes the river look as though it ends in a field outside Nanking. This
# carries it down the estuary past Shanghai.
YANGZI_TAIL = [
    (120.07, 31.96), (120.55, 31.98), (121.05, 31.80), (121.55, 31.60),
    (121.95, 31.42),
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
EXTENT_CHINA_FRONT = [
    (106.8, 40.4), (107.2, 39.2), (108.6, 38.4), (110.2, 37.8), (110.7, 36.2),
    (110.9, 34.6), (111.8, 33.4), (112.6, 32.2), (111.8, 31.0), (110.8, 30.2),
    (112.0, 29.2), (113.4, 28.4), (114.8, 27.8), (116.2, 27.0), (117.4, 25.8),
    (118.9, 24.9),
]
# The south China coast. Everything Japan held along it has to fall inside the
# loop: Amoy from May 1938, Swatow from June 1939, Canton and the delta from
# October 1938, Kwangchowwan, and Hainan, taken in February 1939 and held to
# the end. The line runs inland of the coastal cities and then straight west
# along the top of the Leizhou peninsula to the Tonkin frontier. It does not
# need to detour round Hainan: everything seaward of this line is inside, so
# tracing the island would have cut it out rather than taken it in.
EXTENT_SOUTH_CHINA = [
    (118.2, 24.6), (117.3, 24.0), (116.4, 23.9), (115.2, 23.6), (114.2, 23.7),
    (113.4, 24.0), (112.4, 23.5), (111.4, 22.5), (110.6, 21.9), (109.9, 21.9),
    (109.0, 21.7), (108.1, 21.5),
]
# Ocean perimeter, running clockwise from the Bay of Bengal.
EXTENT_OCEAN = [
    (91.6, 20.0), (90.6, 16.0), (90.4, 12.0), (90.6, 8.0), (92.0, 3.5),
    (94.4, 0.0), (97.0, -3.6), (100.6, -6.6), (105.0, -8.6), (110.0, -10.2),
    (115.0, -11.0), (120.0, -11.4), (125.0, -11.6), (130.0, -11.4),
    (134.0, -10.6), (137.0, -9.6),
    # along the Papuan peninsula, which Japan held the length of, bulging
    # north around Port Moresby on the south coast, which it never reached
    (139.5, -8.3), (142.0, -8.5), (144.0, -8.4), (145.6, -8.7), (146.5, -9.0),
    (147.4, -9.2), (148.4, -9.7), (149.7, -10.2), (150.9, -10.6),
    (152.6, -10.9), (155.4, -11.2), (159.0, -11.4),
    (163.0, -10.6), (167.0, -9.4), (171.0, -8.0), (175.0, -6.4), (179.0, -4.4),
    (180.8, -1.0),
    # north along the dateline, then west along the Aleutians
    (181.2, 6.0), (181.4, 14.0), (181.4, 22.0), (181.2, 30.0), (180.8, 38.0),
    (180.2, 45.0), (179.4, 50.0), (177.0, 52.8), (172.0, 53.4), (166.0, 53.0),
    (160.0, 52.4), (156.4, 51.4),
    # straight across the Sea of Okhotsk, leaving every Kurile inside
    (150.0, 50.9), (144.6, 50.3), (141.8, 50.3), (141.0, 49.2),
    # down the Soviet Pacific coast to the Korean corner
    (140.4, 48.6), (138.6, 47.0), (137.0, 45.6), (135.0, 44.3), (133.0, 43.0),
    (131.6, 42.8), (130.7, 42.4),
]

# Anchors where the hand-drawn pieces hand over to a real frontier.
EXTENT_ARCS = [
    # (atom, from, to, via) — the northern frontier of mainland Southeast Asia
    ("indochina", (108.1, 21.5), (101.2, 21.4), (104.5, 23.2)),
    ("burma", (101.0, 21.3), (92.3, 20.6), (97.5, 27.5)),
]
# The Manchukuo and Mengchiang frontier, taken off the provinces themselves.
EXTENT_MANCHURIA = (
    ("manchuria", "jehol", "chahar", "suiyuan"),
    (130.7, 42.4), (106.8, 40.4), (120.0, 51.0),
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


def split_usa(ring):
    cx, cy = centroid_of(ring)
    cx = cx + 360 if cx < 0 else cx
    if 17.0 <= cy <= 23.5 and 198.0 <= cx <= 206.0:
        return "hawaii"
    if cy >= 50.0:
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
    # named and, in the north, told apart
    return None


def split_india(ring):
    cx, cy = centroid_of(ring)
    if 91.0 < cx < 95.5 and 5.0 < cy < 14.5:
        return "andaman"
    return "india"


ADMIN0 = {
    "South Korea": "korea", "North Korea": "korea",
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

ARCHIPELAGOS = {
    "nanyo", "gilberts", "ogasawara", "guam", "chishima", "aleutians",
    "hawaii", "ryukyu", "newguinea_au", "solomons_br", "philippines",
    "timor_pt", "andaman", "nauru_au", "hongkong", "macau", "northborneo",
    "malaya",
}

# Drawn after the occupied shading, so the small enclaves it would otherwise
# bury are still there to see and to click.
ON_TOP = ["weihaiwei", "guangzhouwan", "macau", "hongkong", "kwantung"]

ORDER = [
    "chinabase", "andaman", "ceylon", "ussr", "mongolia", "tibet",
    "china", "xinjiang", "india", "hyderabad", "goa", "pondicherry",
    "other", "nepal", "sikkim", "bhutan",
    "tuva", "weihaiwei", "guangzhouwan", "chahar", "suiyuan", "jehol", "manchuria",
    "siam", "burma", "indochina", "siamgain", "malaya", "malaya_thai", "sarawak", "northborneo", "brunei",
    "dei", "philippines",
    "timor_pt", "newguinea_au", "solomons_br", "australia", "gilberts",
    "nauru_au", "guam", "hawaii", "aleutians", "hongkong", "macau",
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
    a1 = load("admin1", args.download)

    groups = collections.defaultdict(list)
    # Chinese atoms keep their provinces as separate sub-paths, so hovering can
    # name the province as well as the country.
    provinces = collections.defaultdict(list)

    # ---- everything except China ------------------------------------------
    for feat in a0["features"]:
        admin = feat["properties"].get("ADMIN")
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
        splitter = SPLITTERS.get(admin)
        if splitter:
            for ring in iter_rings(feat["geometry"]):
                key = splitter(ring)
                if key:
                    groups[key].append(ring)
            continue
        key = ADMIN0.get(admin)
        if not key:
            continue
        rings_here = list(iter_rings(feat["geometry"]))
        if admin in ("Laos", "Cambodia"):
            continue                  # both are rebuilt below, minus the 1941 cessions
        groups[key].extend(rings_here)
        if admin == "Vietnam":
            north = [line_plane(TONKIN_CUT[0], TONKIN_CUT[1], keep_right=False)]
            south = [line_plane(COCHIN_CUT[0], COCHIN_CUT[1], keep_right=True)]
            mid = [line_plane(TONKIN_CUT[0], TONKIN_CUT[1], keep_right=True),
                   line_plane(COCHIN_CUT[0], COCHIN_CUT[1], keep_right=False)]
            for label, planes in (("Tonkin", north), ("Annam", mid), ("Cochinchina", south)):
                cut = [c for c in (clip_halfplanes(r, planes) for r in rings_here) if len(c) >= 3]
                if cut:
                    provinces["indochina"].append((label, cut))
        elif admin == "Papua New Guinea":
            north = [line_plane(PAPUA_CUT[0], PAPUA_CUT[1], keep_right=False)]
            south = [line_plane(PAPUA_CUT[0], PAPUA_CUT[1], keep_right=True)]
            for label, planes in (("NewGuineaMandate", north), ("Papua", south)):
                cut = [c for c in (clip_halfplanes(r, planes) for r in rings_here) if len(c) >= 3]
                if cut:
                    provinces["newguinea_au"].append((label, cut))

    # ---- enclaves and a princely state inside British India ---------------
    ind_path = os.path.join(CACHE, "adm1_IND.json")
    if os.path.exists(ind_path):
        with open(ind_path) as fh:
            for feat in json.load(fh)["features"]:
                key = INDIA_ENCLAVES.get(feat["properties"].get("shapeName"))
                if key:
                    for ring in iter_rings(feat["geometry"]):
                        groups[key].append(ring)

    # ---- Burma, division by division ---------------------------------------
    bpath = os.path.join(CACHE, "adm1_MMR.json")
    if os.path.exists(bpath):
        with open(bpath) as fh:
            blocks = collections.defaultdict(list)
            for feat in json.load(fh)["features"]:
                label = BURMA_DIVISIONS.get(feat["properties"].get("shapeName"))
                if label:
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

    # ---- Korea, province by province ---------------------------------------
    for iso in ("KOR", "PRK"):
        kpath = os.path.join(CACHE, f"adm1_{iso}.json")
        if not os.path.exists(kpath):
            continue
        with open(kpath) as fh:
            for feat in json.load(fh)["features"]:
                pname = KOREA_PROVINCES.get(feat["properties"].get("shapeName"))
                if pname:
                    provinces["korea"].append((pname, list(iter_rings(feat["geometry"]))))

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
                for ring in iter_rings(feat["geometry"]):
                    groups["siamgain"].append(ring)
            elif iso == "LAO" and pname == "Champasak":
                west = box_planes(0, -90, SIAM_1941_CHAMPASAK_WEST, 90)
                for ring in iter_rings(feat["geometry"]):
                    piece = clip_halfplanes(ring, west)
                    if len(piece) >= 3 and ring_area(piece) > 0.002:
                        groups["siamgain"].append(piece)

    # ---- the Borneo states -------------------------------------------------
    if os.path.exists(mys_path if 'mys_path' in dir() else ''):
        pass
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
    def outline(keys):
        rings = []
        for k in keys:
            rings.extend(groups.get(k, []))
        if not rings:
            return None
        merged = dissolve(rings)
        return max(merged or rings, key=ring_area)

    extent = []
    extent += chaikin(EXTENT_CHINA_FRONT)
    extent += chaikin(EXTENT_SOUTH_CHINA)
    for key, a, b, via in EXTENT_ARCS:
        ring = outline([key])
        if ring:
            arc = boundary_arc(ring, a, b, via)
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
                if label == "Yangtze" or props.get("name") == "Chang Jiang":
                    pieces["yangzi"].append(line)
                elif label in ("Yellow", "Huang") or props.get("name") == "Huang":
                    best, bd = 0, 1e9
                    for i, (x, y) in enumerate(line):
                        d2 = (x - HUAYUANKOU[0]) ** 2 + (y - HUAYUANKOU[1]) ** 2
                        if d2 < bd:
                            best, bd = i, d2
                    if bd > 4.0:
                        pieces["yellow_upper"].append(line)
                    else:
                        if best >= 2:
                            pieces["yellow_upper"].append(line[:best + 1])
                        if len(line) - best >= 3:
                            pieces["yellow_lower"].append(line[best:])
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
        min_area = 0.12 if archipelago else args.min_area

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
            if archipelago and area < 20:
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
                pts = simplify([project(x, y) for x, y in ring], args.tolerance)
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
    out.append('  <g id="hatching"></g>')
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
