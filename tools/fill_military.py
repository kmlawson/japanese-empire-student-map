"""Ground the 1931 military divisions leave uncovered, given to the area it
belongs to.

    python3 tools/fill_military.py

Reads `tools/cache/1931-india-military-divisions.geojson` — the tracing, which
is the author's and is never written to — and writes
`tools/cache/1931-india-military-divisions-filled.geojson`, which is what
`build_themes.py` draws and what the site offers as the download.

**What is filled.** The land the map draws for British India
(`deploy/gis/british-india-1930.geojson`) less every area of the tracing
leaves 134 pieces. Most are coastal slivers, the Andamans and Nicobars, and
Kashmir, which the plate does not colour either; those are left alone. The
pieces in `FILLS` are ones the author assigned, by the box their middle falls
in:

* the island of Bombay and Salsette, and the strips of coast beside them,
  which the tracing stops short of — to the Bombay District;
* the hill strip between the Presidency & Assam District and Burma, about
  2,000 km² at 93.0 E, 22.5 N — to Presidency & Assam.

**Merged, not appended.** A piece added as a ring of its own would be
outlined where it meets its area, drawing a boundary the plate does not have
across Bombay. So each area is unioned with its pieces (GEOS, through GDAL's
SQLite dialect), which also makes Bombay valid: its tracing runs 52 m out and
back along one line at 72.10 E, 21.27 N, a spike of no area that GEOS reads
as a self-intersection.

Rerun it whenever the tracing changes; the build reads only its output.
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "cache", "1931-india-military-divisions.geojson")
OUT = os.path.join(ROOT, "tools", "cache",
                   "1931-india-military-divisions-filled.geojson")
LAND = os.path.join(ROOT, "deploy", "gis", "british-india-1930.geojson")

# (the area, by `division`; the box the middle of a piece must fall in:
#  west, south, east, north)
FILLS = [
    ("Bombay", (72.6, 18.6, 73.1, 19.8)),
    ("Presidency & Assam", (92.5, 21.5, 93.7, 23.7)),
]


def run(*args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("%s failed:\n%s" % (args[0], r.stderr))
    return r.stdout


def count(geom):
    n = 0
    for poly in (geom["coordinates"] if geom["type"] == "MultiPolygon"
                 else [geom["coordinates"]]):
        for ring in poly:
            n += len(ring)
    return n


def main():
    for p in (SRC, LAND):
        if not os.path.exists(p):
            raise SystemExit("%s is missing" % p)
    tmp = tempfile.mkdtemp(prefix="milfill-")
    gpkg = os.path.join(tmp, "work.gpkg")
    run("ogr2ogr", "-f", "GPKG", gpkg, LAND, "-nln", "land",
        "-nlt", "PROMOTE_TO_MULTI")
    run("ogr2ogr", "-f", "GPKG", "-update", gpkg, SRC, "-nln", "mil",
        "-nlt", "PROMOTE_TO_MULTI")
    # every piece of the land no area covers, one row each
    run("ogr2ogr", "-f", "GPKG", "-update", gpkg, gpkg, "-nln", "gaps",
        "-dialect", "sqlite", "-explodecollections", "-sql",
        "SELECT ST_Difference(ST_Union(ST_MakeValid(l.geom)), "
        "(SELECT ST_Union(ST_MakeValid(geom)) FROM mil)) AS geom FROM land l")

    cases = []
    for div, (w, s, e, n) in FILLS:
        pick = ("(SELECT ST_Union(g.geom) FROM gaps g WHERE "
                "ST_X(ST_Centroid(g.geom)) BETWEEN %r AND %r AND "
                "ST_Y(ST_Centroid(g.geom)) BETWEEN %r AND %r)" % (w, e, s, n))
        cases.append("WHEN m.division = '%s' THEN "
                     "CastToMultiPolygon(ST_Union(ST_CollectionExtract(ST_MakeValid(m.geom), 3), %s))"
                     % (div.replace("'", "''"), pick))
    sql = ("SELECT m.fid AS fid, m.name AS name, m.division AS division, "
           "m.command AS command, CASE %s ELSE m.geom END AS geom FROM mil m "
           "ORDER BY m.fid" % " ".join(cases))
    out = os.path.join(tmp, "filled.geojson")
    run("ogr2ogr", "-f", "GeoJSON", out, gpkg, "-dialect", "sqlite",
        "-sql", sql, "-nln", "1931-india-military-divisions",
        "-lco", "COORDINATE_PRECISION=15")

    def key(f):
        p = f["properties"]
        return (p.get("division") or "", p.get("name") or "")
    with open(SRC, encoding="utf-8") as fh:
        src = json.load(fh)
    before = {key(f): f for f in src["features"]}
    with open(out, encoding="utf-8") as fh:
        doc = json.load(fh)
    if len(doc["features"]) != len(src["features"]):
        raise SystemExit("the filled file has %d features and the tracing %d"
                         % (len(doc["features"]), len(src["features"])))
    # the tracing's own `fid` goes back into the properties, where GDAL's
    # GeoJSON writer took it out to be the feature id
    for f, g in zip(doc["features"], sorted(src["features"],
                                            key=lambda x: x["properties"]["fid"])):
        f["properties"] = dict(g["properties"])
    for f in doc["features"]:
        b = before[key(f)]
        was, now = count(b["geometry"]), count(f["geometry"])
        if was != now:
            print("  %-20s %5d -> %5d vertices"
                  % (f["properties"]["division"] or f["properties"]["name"], was, now))
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False)
    print("wrote      %s (%d features)" % (os.path.relpath(OUT, ROOT),
                                           len(doc["features"])))


if __name__ == "__main__":
    sys.exit(main())
