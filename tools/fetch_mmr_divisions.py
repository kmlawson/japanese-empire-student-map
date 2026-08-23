"""Burma's eight commissioners' divisions, and Karenni, out of modern districts.

The divisions the map wants are the ones settled in June 1925 and unchanged
through both of its dates — Arakan, Pegu, Irrawaddy, Tenasserim, Magwe,
Mandalay, Sagaing and the Federated Shan States — with the Karenni states
beside them, which were never British territory at all. Myanmar's fourteen
modern states and regions cannot give them: Toungoo District belonged to
Tenasserim and is inside modern Bago Region, the Chin Hills were a district of
Magwe Division, and the Kachin Hill Tracts were tracts inside Sagaing's
Myitkyina, Bhamo and Katha districts. At ADM2 — seventy-four districts — every
one of those falls out cleanly, because each period division is a whole set of
modern districts.

The districts of one division are dissolved into a single shape, so the
divisions tile Burma with no crack between them and nothing has to be filled in
underneath. What is left over the traced Burma outline is clipped away when the
map is drawn, not here: see SUB_CLIP in build_map.py.

    python3 tools/fetch_mmr_divisions.py

writes tools/cache/mmr_divisions.json, which is committed. The ADM2 source is
5 MB and is not.
"""

import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
OUT = "mmr_divisions.json"

# A descriptive user-agent and no contact address.
UA = "japanese-empire-map/1.0 (offline teaching map build)"
API = "https://www.geoboundaries.org/api/current/gbOpen/MMR/ADM2/"

# district -> the division it was in on both of this map's dates
DIVISIONS = {
    # Arakan: Akyab, Kyaukpyu, Sandoway. The Arakan Hill Tracts — Paletwa —
    # cannot be separated at this level and stay inside Chin, below.
    "Sittwe": "Arakan", "Maungdaw": "Arakan", "Mrauk-U": "Arakan",
    "Kyaukpyu": "Arakan", "Thandwe": "Arakan",

    # Pegu: Pegu, Tharrawaddy, Prome, Hanthawaddy, Insein and Rangoon Town.
    # Toungoo is NOT here — it was Tenasserim's from 1870, apart from the
    # thirty months between December 1922 and June 1925.
    "Bago": "Pegu", "Thayarwady": "Pegu", "Pyay": "Pegu",
    "Yangon (East)": "Pegu", "Yangon (North)": "Pegu",
    "Yangon (South)": "Pegu", "Yangon (West)": "Pegu",

    # Irrawaddy: Bassein, Henzada, Myaungmya, Maubin, Pyapon
    "Pathein": "Irrawaddy", "Hinthada": "Irrawaddy", "Myaungmya": "Irrawaddy",
    "Labutta": "Irrawaddy", "Maubin": "Irrawaddy", "Pyapon": "Irrawaddy",

    # Tenasserim: Toungoo, Salween, Thaton, Amherst, Tavoy, Mergui. Hpapun is
    # the Salween District, a district of one township whose Deputy
    # Commissioner was a police officer and which was wholly an Excluded Area
    # after 1937; it is drawn inside its division rather than beside it.
    "Taungoo": "Tenasserim", "Hpapun": "Tenasserim", "Thaton": "Tenasserim",
    "Mawlamyine": "Tenasserim", "Hpa-An": "Tenasserim",
    "Kawkareik": "Tenasserim", "Myawaddy": "Tenasserim",
    "Dawei": "Tenasserim", "Myeik": "Tenasserim", "Kawthoung": "Tenasserim",

    # Magwe: Thayetmyo, Minbu, Magwe, Pakokku and the Chin Hills District,
    # which the 1931 census counts inside this division.
    "Thayet": "Magwe", "Minbu": "Magwe", "Magway": "Magwe",
    "Pakokku": "Magwe", "Gangaw": "Magwe",
    "Falam": "Magwe", "Hakha": "Magwe", "Mindat": "Magwe",

    # Mandalay: Mandalay, Kyaukse, Meiktila, Myingyan, Yamethin. Nay Pyi Taw's
    # two districts were cut out of Yamethin and Pyinmana in 2006.
    "Mandalay": "MandalayDiv", "Pyinoolwin": "MandalayDiv",
    "Kyaukse": "MandalayDiv", "Meiktila": "MandalayDiv",
    "Myingyan": "MandalayDiv", "Nyaung-U": "MandalayDiv",
    "Yamethin": "MandalayDiv", "Oke Ta Ra": "MandalayDiv",
    "Det Khi Na": "MandalayDiv",

    # Sagaing: Shwebo, Sagaing, Katha, Lower and Upper Chindwin, and — with
    # the Kachin Hill Tracts inside them — Bhamo and Myitkyina.
    "Sagaing": "Sagaing", "Shwebo": "Sagaing", "Kanbalu": "Sagaing",
    "Katha": "Sagaing", "Monywa": "Sagaing", "Yinmarbin": "Sagaing",
    "Kale": "Sagaing", "Mawlaik": "Sagaing", "Tamu": "Sagaing",
    "Hkamti": "Sagaing", "Bhamo": "Sagaing", "Myitkyina": "Sagaing",
    "Mohnyin": "Sagaing", "Puta-O": "Sagaing",

    # The Federated Shan States, one block. There were thirty-three of them,
    # and neither this source nor any other to hand draws them apart.
    "Taunggyi": "ShanStates", "Loilen": "ShanStates", "Langkho": "ShanStates",
    "Kengtung": "ShanStates", "Monghsat": "ShanStates",
    "Tachileik": "ShanStates", "Kyaukme": "ShanStates", "Lashio": "ShanStates",
    "Muse": "ShanStates", "Mongmit": "ShanStates", "Hopang": "ShanStates",
    "Matman": "ShanStates", "Laukkaing": "ShanStates",

    # Karenni: Kantarawadi, Bawlake and Kyebogyi, which were never annexed.
    "Loikaw": "Karenni", "Bawlake": "Karenni",
}


def get(url):
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=600)


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    return [poly[0] for poly in geom["coordinates"]]


def main():
    sys.path.insert(0, HERE)
    import build_map as bm

    meta = json.load(get(API))
    sys.stderr.write("geoBoundaries MMR ADM2, %s, %s units\n"
                     % (meta.get("boundaryYearRepresented"),
                        meta.get("admUnitCount")))
    adm2 = json.load(get(meta["gjDownloadURL"]))

    groups, unmapped = {}, []
    for feat in adm2["features"]:
        name = feat["properties"].get("shapeName")
        div = DIVISIONS.get(name)
        if not div:
            unmapped.append(name)
            continue
        groups.setdefault(div, []).extend(
            [[(round(x, 6), round(y, 6)) for x, y in r]
             for r in rings_of(feat["geometry"])])
    if unmapped:
        raise SystemExit("districts in no division: %s" % sorted(unmapped))

    feats = []
    for name, rs in sorted(groups.items()):
        merged = bm.dissolve(rs)
        how = "dissolved"
        if not merged:
            merged, how = bm.union_rings(rs), "welded"
        merged = [r for r in merged
                  if len(r) >= 3 and abs(bm.signed_ring_area(r)) > 1e-9]
        merged.sort(key=lambda r: -abs(bm.signed_ring_area(r)))
        sys.stderr.write("%-12s %2d districts -> %2d ring(s), %5d points, %s\n"
                         % (name, len(rs), len(merged),
                            sum(len(r) for r in merged), how))
        feats.append({"type": "Feature", "properties": {"shapeName": name},
                      "geometry": {"type": "MultiPolygon",
                                   "coordinates": [[[list(p) for p in r]]
                                                   for r in merged]}})
    dest = os.path.join(CACHE, OUT)
    with open(dest, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    sys.stderr.write("wrote %s, %.0f KB\n" % (dest, os.path.getsize(dest) / 1024))


if __name__ == "__main__":
    main()
