#!/usr/bin/env python3
"""One EPSG:4326 GeoPackage layer -> one GeoJSON file, feature by feature.

`gpkg.rings()` hands back every ring in a layer as one flat list, which is all
the build needs when a layer is a single shape. These newer layers are not:
Mengchiang is three pieces, the protectorates are two, and a feature's holes
have to stay with the feature they belong to. So this walks the rows itself and
keeps the polygon structure, which is what a GeoJSON reader downstream expects.

No reprojection. The layers this is used for declare EPSG:4326 and the build
reads longitude and latitude; anything else should go through `gpkg.rings_lonlat`
instead, which solves the geodesic for the Wuhan azimuthal-equidistant grid.

    python3 tools/gpkg_to_geojson.py in.gpkg out.geojson [table]
"""
import json
import sqlite3
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import gpkg


def features(path, table=None):
    con = sqlite3.connect(path)
    try:
        if table is None:
            row = con.execute("select table_name from gpkg_contents "
                              "where data_type='features' limit 1").fetchone()
            if not row:
                return []
            table = row[0]
        srs = con.execute("select srs_id from gpkg_contents where table_name=?",
                          (table,)).fetchone()
        if srs and srs[0] not in (4326, 0, -1):
            sys.stderr.write("warning: %s declares SRS %s, not 4326; the "
                             "coordinates are passed through unchanged\n"
                             % (table, srs[0]))
        col = con.execute("select column_name from gpkg_geometry_columns "
                          "where table_name=?", (table,)).fetchone()
        col = col[0] if col else "geom"
        cols = [r[1] for r in con.execute('pragma table_info("%s")' % table)]
        keep = [c for c in cols if c != col]
        out = []
        for row in con.execute('select "%s"%s from "%s"'
                               % (col, "".join(', "%s"' % c for c in keep), table)):
            rings = gpkg._read_blob(row[0])
            if not rings:
                continue
            props = {k: v for k, v in zip(keep, row[1:]) if v is not None}
            # A ring list from one row may be several polygons. Outer rings wind
            # one way and holes the other, so a ring whose signed area has the
            # same sign as the first one starts a new polygon and anything else
            # is a hole in the polygon before it.
            polys, sign = [], None
            for r in rings:
                a = 0.0
                for i in range(len(r)):
                    x0, y0 = r[i]
                    x1, y1 = r[(i + 1) % len(r)]
                    a += x0 * y1 - x1 * y0
                s = 1 if a >= 0 else -1
                if sign is None:
                    sign = s
                if s == sign or not polys:
                    polys.append([[list(p) for p in r]])
                else:
                    polys[-1].append([list(p) for p in r])
            geom = ({"type": "Polygon", "coordinates": polys[0]} if len(polys) == 1
                    else {"type": "MultiPolygon", "coordinates": polys})
            out.append({"type": "Feature", "properties": props, "geometry": geom})
        return out
    finally:
        con.close()


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    table = sys.argv[3] if len(sys.argv) > 3 else None
    feats = features(src, table)
    with open(dst, "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh)
    rings = sum(len(p) for f in feats
                for p in ([f["geometry"]["coordinates"]]
                          if f["geometry"]["type"] == "Polygon"
                          else f["geometry"]["coordinates"]))
    verts = sum(len(r) for f in feats
                for poly in ([f["geometry"]["coordinates"]]
                             if f["geometry"]["type"] == "Polygon"
                             else f["geometry"]["coordinates"])
                for r in poly)
    sys.stderr.write("%s: %d features, %d rings, %d vertices\n"
                     % (dst.rsplit("/", 1)[-1], len(feats), rings, verts))
