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


# Clarke 1866, which is the ellipsoid the Wuhan project's CRS declares:
#   PROJCS["unnamed", GEOGCS["Clarke 1866", SPHEROID["clrk66",6378206.4,294.978…]],
#   PROJECTION["Azimuthal_Equidistant"],
#   PARAMETER["latitude_of_center",30.591623], PARAMETER["longitude_of_center",114.29925],
#   PARAMETER["false_easting",50000], PARAMETER["false_northing",50000]]
CLARKE_A = 6378206.4
CLARKE_INVF = 294.9786982138982
WUHAN_LON, WUHAN_LAT = 114.29925, 30.591623


def _vincenty_direct(lat1, lon1, alpha1, s, a=CLARKE_A, invf=CLARKE_INVF):
    """Where you arrive going `s` metres on bearing `alpha1` from a point.

    The geodesic direct problem on the ellipsoid, by Vincenty. Iterates to
    about a millimetre in a dozen rounds; the loop below is capped well past
    that.
    """
    import math
    f = 1.0 / invf
    b = a * (1 - f)
    lat1, lon1, alpha1 = map(math.radians, (lat1, lon1, alpha1))
    sin_a1, cos_a1 = math.sin(alpha1), math.cos(alpha1)
    tan_u1 = (1 - f) * math.tan(lat1)
    cos_u1 = 1 / math.sqrt(1 + tan_u1 * tan_u1)
    sin_u1 = tan_u1 * cos_u1
    sigma1 = math.atan2(tan_u1, cos_a1)
    sin_alpha = cos_u1 * sin_a1
    cos_sq_alpha = 1 - sin_alpha * sin_alpha
    u_sq = cos_sq_alpha * (a * a - b * b) / (b * b)
    A = 1 + u_sq / 16384 * (4096 + u_sq * (-768 + u_sq * (320 - 175 * u_sq)))
    B = u_sq / 1024 * (256 + u_sq * (-128 + u_sq * (74 - 47 * u_sq)))
    sigma = s / (b * A)
    for _ in range(100):
        cos2sm = math.cos(2 * sigma1 + sigma)
        sin_sigma, cos_sigma = math.sin(sigma), math.cos(sigma)
        d_sigma = B * sin_sigma * (cos2sm + B / 4 * (
            cos_sigma * (-1 + 2 * cos2sm ** 2)
            - B / 6 * cos2sm * (-3 + 4 * sin_sigma ** 2) * (-3 + 4 * cos2sm ** 2)))
        prev, sigma = sigma, s / (b * A) + d_sigma
        if abs(sigma - prev) < 1e-12:
            break
    sin_sigma, cos_sigma = math.sin(sigma), math.cos(sigma)
    cos2sm = math.cos(2 * sigma1 + sigma)
    tmp = sin_u1 * sin_sigma - cos_u1 * cos_sigma * cos_a1
    lat2 = math.atan2(sin_u1 * cos_sigma + cos_u1 * sin_sigma * cos_a1,
                      (1 - f) * math.hypot(sin_alpha, tmp))
    lam = math.atan2(sin_sigma * sin_a1,
                     cos_u1 * cos_sigma - sin_u1 * sin_sigma * cos_a1)
    C = f / 16 * cos_sq_alpha * (4 + f * (4 - 3 * cos_sq_alpha))
    L = lam - (1 - C) * f * sin_alpha * (
        sigma + C * sin_sigma * (cos2sm + C * cos_sigma * (-1 + 2 * cos2sm ** 2)))
    return math.degrees(lon1 + L), math.degrees(lat2)


def aeqd_to_lonlat(x, y, lon0=WUHAN_LON, lat0=WUHAN_LAT,
                   false_easting=50000.0, false_northing=50000.0):
    """Invert the azimuthal-equidistant projection the Wuhan project uses.

    An azimuthal-equidistant grid stores, for every point, its true bearing and
    its true distance from the centre. Inverting it is therefore the geodesic
    direct problem: go `hypot(x, y)` metres from Wuhan on bearing
    `atan2(x, y)`, on the ellipsoid the CRS names, and that is where the point
    is. This is what PROJ does for an ellipsoidal `aeqd`, and so what QGIS did
    when the layers were drawn.

    This used to use the *spherical* inverse with the Clarke 1866 semi-major
    axis standing in for a radius, on the reasoning that the error would be a
    few hundred metres. It is not: the error grows with distance from Wuhan and
    is radial, and at the distances these layers sit at it runs from 2.3 km
    (Sikkim, Bhutan, Nepal) through 2.8 km (Weihaiwei) and 3.3 km (the Kwantung
    leasehold) to 5.1 km at Kwangchowwan and 5.8 km at Tannu Tuva. Every one of
    those layers was therefore drawn in the wrong place, radially outward from
    Wuhan, by about the width of the fringes that kept appearing between them
    and the coastlines they were traced against — which is what those fringes
    were.
    """
    import math
    x = x - false_easting
    y = y - false_northing
    s = math.hypot(x, y)
    if s < 1e-9:
        return lon0, lat0
    return _vincenty_direct(lat0, lon0, math.degrees(math.atan2(x, y)), s)


def rings_lonlat(path, table=None, **kw):
    """Rings from a Wuhan-azimuthal layer, converted to lon/lat."""
    return [[aeqd_to_lonlat(x, y, **kw) for x, y in ring] for ring in rings(path, table)]
