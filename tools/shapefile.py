"""A very small ESRI shapefile reader — enough for polygons in lon/lat.

Only what this project needs: polygon and polyline geometry out of the .shp,
attributes out of the .dbf, no projection handling (the sources used here are
already WGS84). Written so the build has no dependencies beyond the standard
library.
"""

import struct


def read_dbf(path):
    """Return a list of dicts, one per record."""
    with open(path, "rb") as fh:
        data = fh.read()

    count, header_len, record_len = struct.unpack_from("<IHH", data, 4)
    fields = []
    pos = 32
    while data[pos] != 0x0D:
        raw = data[pos:pos + 32]
        name = raw[:11].split(b"\0")[0].decode("latin-1").strip()
        ftype = chr(raw[11])
        flen = raw[16]
        fields.append((name, ftype, flen))
        pos += 32

    out = []
    pos = header_len
    for _ in range(count):
        if pos >= len(data):
            break
        deleted = data[pos:pos + 1] == b"*"
        off = pos + 1
        row = {}
        for name, ftype, flen in fields:
            raw = data[off:off + flen]
            off += flen
            try:
                text = raw.decode("utf-8").strip()
            except UnicodeDecodeError:
                text = raw.decode("latin-1").strip()
            if ftype in "NF":
                try:
                    row[name] = float(text) if text else None
                except ValueError:
                    row[name] = None
            else:
                row[name] = text
        pos += record_len
        if not deleted:
            out.append(row)
    return out


def read_shp(path):
    """Return a list of shapes; each is a list of rings (lists of (lon, lat))."""
    with open(path, "rb") as fh:
        data = fh.read()

    shapes = []
    pos = 100                                   # skip the file header
    n = len(data)
    while pos + 8 <= n:
        _, content_len = struct.unpack_from(">II", data, pos)
        pos += 8
        end = pos + content_len * 2
        shape_type = struct.unpack_from("<I", data, pos)[0]

        if shape_type == 0:                     # null shape
            shapes.append([])
        elif shape_type in (3, 5, 13, 15, 23, 25):   # polyline / polygon (+Z/M)
            num_parts, num_points = struct.unpack_from("<II", data, pos + 36)
            parts_at = pos + 44
            parts = list(struct.unpack_from("<%dI" % num_parts, data, parts_at))
            points_at = parts_at + num_parts * 4
            coords = struct.unpack_from("<%dd" % (num_points * 2), data, points_at)
            rings = []
            for i, start in enumerate(parts):
                stop = parts[i + 1] if i + 1 < num_parts else num_points
                ring = [(coords[j * 2], coords[j * 2 + 1]) for j in range(start, stop)]
                if len(ring) >= 3:
                    rings.append(ring)
            shapes.append(rings)
        else:
            shapes.append([])                   # points and anything exotic
        pos = end
    return shapes


def read(basepath):
    """Read `basepath`.shp + `basepath`.dbf into [(attributes, rings), ...]."""
    shapes = read_shp(basepath + ".shp")
    try:
        records = read_dbf(basepath + ".dbf")
    except OSError:
        records = [{} for _ in shapes]
    out = []
    for i, rings in enumerate(shapes):
        out.append((records[i] if i < len(records) else {}, rings))
    return out
