"""Rebuild tools/cache/adm2_PHL_1939.json — the provinces of the Philippines
as they stood under the Commonwealth, c. 1939.

The modern country has 82 provinces; in 1939 it had 49 plus the City of Manila.
Almost every difference is a post-war split, so the period map can be recovered
by merging the children back into the parent. Where a province was carved out
of two parents the whole of it is assigned to the larger one, which is why a
few boundaries here are close rather than exact.

geoBoundaries ships a full-resolution ADM2 file of about 440 MB; this uses the
simplified one, which is plenty at the scale the map is drawn.
"""

import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
URL = ("https://github.com/wmgeolab/geoBoundaries/raw/41af8f1/releaseData/"
       "gbOpen/PHL/ADM2/geoBoundaries-PHL-ADM2_simplified.geojson")

# The modern province of Palawan reaches out to the Spratlys, which were no
# part of it: unclaimed in 1930, and annexed by Japan in March 1939 as the
# Shinnan Gunto and attached to Takao prefecture in Taiwan. Anything west of
# this meridian is dropped.
PALAWAN_WEST = 116.9
UA = "japanese-empire-student-map/1.0 (teaching map build)"

# modern province -> the province of 1939 it belonged to
TO_1939 = {
    "Abra": "Abra",
    "Apayao": "MountainProvince", "Kalinga": "MountainProvince",
    "Ifugao": "MountainProvince", "Mountain Province": "MountainProvince",
    "Benguet": "MountainProvince",
    "Agusan del Norte": "Agusan", "Agusan del Sur": "Agusan",
    # Catanduanes was a sub-province of Albay until Commonwealth Act 687
    # separated it in October 1945
    "Albay": "Albay", "Catanduanes": "Albay",
    "Sorsogon": "Sorsogon", "Masbate": "Masbate",
    "Camarines Norte": "CamarinesNorte", "Camarines Sur": "CamarinesSur",
    "Antique": "Antique", "Capiz": "Capiz", "Aklan": "Capiz",
    "Iloilo": "Iloilo", "Guimaras": "Iloilo",
    "Bataan": "Bataan", "Batanes": "Batanes", "Batangas": "Batangas",
    "Bohol": "Bohol", "Bukidnon": "Bukidnon", "Bulacan": "Bulacan",
    "Cagayan": "Cagayan", "Cavite": "Cavite", "Cebu": "Cebu",
    "Cotabato": "Cotabato", "South Cotabato": "Cotabato",
    "Sultan Kudarat": "Cotabato", "Sarangani": "Cotabato",
    "Maguindanao": "Cotabato", "Cotabato City": "Cotabato",
    "Davao del Norte": "Davao", "Davao del Sur": "Davao",
    "Davao Oriental": "Davao", "Davao Occidental": "Davao",
    "Compostela Valley": "Davao",
    "Ilocos Norte": "IlocosNorte", "Ilocos Sur": "IlocosSur",
    "La Union": "LaUnion", "Pangasinan": "Pangasinan",
    "Isabela": "Isabela",
    "Nueva Vizcaya": "NuevaVizcaya", "Quirino": "NuevaVizcaya",
    "Laguna": "Laguna",
    "Rizal": "Rizal", "NCR, Second District": "Rizal",
    "NCR, Third District": "Rizal", "NCR, Fourth District": "Rizal",
    "NCR, City of Manila, First District": "Manila",
    "Lanao del Norte": "Lanao", "Lanao del Sur": "Lanao",
    "Leyte": "Leyte", "Southern Leyte": "Leyte", "Biliran": "Leyte",
    "Marinduque": "Marinduque",
    "Occidental Mindoro": "Mindoro", "Oriental Mindoro": "Mindoro",
    "Romblon": "Romblon",
    "Misamis Occidental": "MisamisOccidental",
    "Misamis Oriental": "MisamisOriental", "Camiguin": "MisamisOriental",
    "Negros Occidental": "NegrosOccidental",
    "Negros Oriental": "NegrosOriental", "Siquijor": "NegrosOriental",
    "Nueva Ecija": "NuevaEcija", "Palawan": "Palawan",
    "Pampanga": "Pampanga", "Tarlac": "Tarlac", "Zambales": "Zambales",
    "Samar": "Samar", "Northern Samar": "Samar", "Eastern Samar": "Samar",
    "Sulu": "Sulu", "Tawi-Tawi": "Sulu",
    "Surigao del Norte": "Surigao", "Surigao del Sur": "Surigao",
    "Dinagat Islands": "Surigao",
    "Quezon": "Tayabas", "Aurora": "Tayabas",
    "Zamboanga del Norte": "Zamboanga", "Zamboanga del Sur": "Zamboanga",
    "Zamboanga Sibugay": "Zamboanga", "Basilan": "Zamboanga",
    "City of Isabela": "Zamboanga",
}


def drop_west(geom, meridian):
    """Throw away whole rings that lie west of a meridian."""
    def keep(ring):
        return max(p[0] for p in ring) >= meridian

    if geom["type"] == "Polygon":
        rings = [r for r in geom["coordinates"] if keep(r)]
        return {"type": "Polygon", "coordinates": rings} if rings else None
    if geom["type"] == "MultiPolygon":
        polys = [p for p in geom["coordinates"] if p and keep(p[0])]
        return {"type": "MultiPolygon", "coordinates": polys} if polys else None
    return geom


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    data = json.loads(urllib.request.urlopen(req).read())
    out, missing = [], []
    for feat in data["features"]:
        name = feat["properties"].get("shapeName")
        key = TO_1939.get(name)
        if not key:
            missing.append(name)
            continue
        geom = feat["geometry"]
        if key == "Palawan":
            geom = drop_west(geom, PALAWAN_WEST)
            if geom is None:
                continue
        out.append({"type": "Feature", "properties": {"shapeName": key},
                    "geometry": geom})
    if missing:
        raise SystemExit("unmapped modern provinces: %s" % sorted(set(missing)))
    dest = os.path.join(CACHE, "adm2_PHL_1939.json")
    os.makedirs(CACHE, exist_ok=True)
    with open(dest, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": out}, fh)
    n = len({f["properties"]["shapeName"] for f in out})
    print("wrote %s: %d provinces, %.1f MB" % (dest, n, os.path.getsize(dest) / 1e6))


if __name__ == "__main__":
    main()
