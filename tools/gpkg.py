"""Read polygon layers out of a GeoPackage, with no dependencies.

A GeoPackage is a SQLite file whose geometry columns hold a short GP header
followed by ordinary WKB. That is all this needs to understand.
"""

import sqlite3
import struct


def _read_polygon(buf, off, end):
    nrings = struct.unpack_from(end + "I", buf, off)[0]
    off += 4
    rings = []
    for _ in range(nrings):
        npts = struct.unpack_from(end + "I", buf, off)[0]
        off += 4
        pts = struct.unpack_from(end + "%dd" % (npts * 2), buf, off)
        off += npts * 16
        rings.append([(pts[i * 2], pts[i * 2 + 1]) for i in range(npts)])
    return rings, off


def _read_wkb(buf, off):
    order = buf[off]
    off += 1
    end = "<" if order == 1 else ">"
    typ = struct.unpack_from(end + "I", buf, off)[0]
    off += 4
    base = typ % 1000
    if base == 3:
        rings, off = _read_polygon(buf, off, end)
        return rings, off
    if base == 6:
        n = struct.unpack_from(end + "I", buf, off)[0]
        off += 4
        rings = []
        for _ in range(n):
            off += 5                       # per-polygon byte order + type
            more, off = _read_polygon(buf, off, end)
            rings.extend(more)
        return rings, off
    return [], off


def _read_blob(blob):
    if not blob or blob[:2] != b"GP":
        return []
    envelope = (blob[3] >> 1) & 0x07
    sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    rings, _ = _read_wkb(blob, 8 + sizes.get(envelope, 0))
    return rings


def rings(path, table=None):
    """All polygon rings in a layer, as lists of (lon, lat)."""
    con = sqlite3.connect(path)
    try:
        if table is None:
            row = con.execute(
                "select table_name from gpkg_contents where data_type='features' limit 1"
            ).fetchone()
            if not row:
                return []
            table = row[0]
        col = con.execute(
            "select column_name from gpkg_geometry_columns where table_name=?", (table,)
        ).fetchone()
        col = col[0] if col else "geom"
        out = []
        for (blob,) in con.execute('select "%s" from "%s"' % (col, table)):
            out.extend(_read_blob(blob))
        return out
    finally:
        con.close()


def aeqd_to_lonlat(x, y, lon0=114.29925, lat0=30.591623,
                   radius=6378206.4, false_easting=50000.0, false_northing=50000.0):
    """Invert the azimuthal-equidistant projection the Wuhan project uses.

    Spherical inverse, which is what QGIS applies for this definition; good to
    a few hundred metres at this scale, far inside the width of a drawn line.
    """
    import math
    x = x - false_easting
    y = y - false_northing
    rho = math.hypot(x, y)
    if rho < 1e-9:
        return lon0, lat0
    c = rho / radius
    sin_c, cos_c = math.sin(c), math.cos(c)
    lat0r, lon0r = math.radians(lat0), math.radians(lon0)
    lat = math.asin(cos_c * math.sin(lat0r) + (y * sin_c * math.cos(lat0r) / rho))
    lon = lon0r + math.atan2(x * sin_c,
                             rho * math.cos(lat0r) * cos_c - y * math.sin(lat0r) * sin_c)
    return math.degrees(lon), math.degrees(lat)


def rings_lonlat(path, table=None, **kw):
    """Rings from a Wuhan-azimuthal layer, converted to lon/lat."""
    return [[aeqd_to_lonlat(x, y, **kw) for x, y in ring] for ring in rings(path, table)]
