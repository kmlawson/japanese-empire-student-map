#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Shaded relief for the map, one image per projection.

    python3 tools/build_relief.py                    # from SR_50M
    python3 tools/build_relief.py --src .../SR_HR.tif --width 8400

Reads a Natural Earth shaded-relief raster — an 8-bit grey equirectangular
sheet of the whole world — and writes three WebP files and a manifest:

    relief-mercator.webp  relief-albers.webp  relief-laea.webp
    relief.js             where each one goes, in map units

## Why three files

A raster is a grid of samples with a projection baked into it. Paths can be
reprojected in the browser — `reprojectDocument` does exactly that, coordinate
by coordinate — but an image cannot: there is nothing to move but the pixels
themselves, and moving those is a resample. So each projection gets its own
warp, done here where there is a real resampler, and the browser swaps the
`href` when the reader switches. Only the one in use is ever fetched.

## Why the file is small

56 MB in, about 350 KB out, and **no resolution is thrown away** to get there.
Two things do the work:

  * the map covers 66E..206E and 13S..55N, which is 6% of the world's surface.
    Clipping to it drops 94% of the pixels before anything else happens.
  * shaded relief is a smooth grey field, which is what WebP is good at. At
    quality 72 the clipped sheet is 347 KB against 1,645 KB for PNG.

The clip crosses the antimeridian, so the source is read as two windows —
66E..180E and 180W..154W — and the second is given a geotransform 360 degrees
further east so the two sit side by side. Warping across the seam without this
produces either a blank right-hand third or a world smeared backwards, both of
which happened before the shift went in.

## The projections have to be the map's own, not merely the same family

`map.js` draws its Albers on a **sphere** of radius `proj.R` map units, with
`albersRaw`; PROJ's `+proj=aea +R=...` is the same formula. The two agree
exactly, and the only difference between them is a uniform scale — `proj.R`
map units against 6,378,137 metres — because `pxPerDeg` is itself `R * pi/180`
(20.0 against 20.0, checked below rather than assumed). So the placement
rectangle can be computed in map units by the same sampling loop `fitOf` uses,
converted to metres for the warp, and handed back to the browser as the box to
draw the image in. Nothing is fitted by eye.
"""
import argparse
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SVG = os.path.join(ROOT, "japan-empire-map.svg")
DEFAULT_SRC = os.path.expanduser(
    "~/Library/CloudStorage/Dropbox/GIS/SR_50M/SR_50M.tif")

# the frame, as build_map.py draws it
LON_MIN, LON_MAX = 66.0, 206.0
LAT_MIN, LAT_MAX = -13.0, 55.0

R_EARTH = 6378137.0          # the sphere PROJ is told to use
RAD = math.pi / 180.0

# the same two definitions map.js carries, and they must stay the same two
ALBERS = {"lon0": 117.5, "lat1": 12.5, "lat2": 37.5, "lat0": 25.0}
LAEA = {"lon0": 115.0, "lat0": 25.0}


def svg_proj():
    """`lonMin`, `latMax`, `pxPerDeg` and `R` as the built SVG records them."""
    with open(SVG, encoding="utf-8") as fh:
        head = fh.read(4000)
    m = re.search(r'<metadata id="proj"([^>]*)>', head)
    if not m:
        sys.exit("build_relief: no proj metadata in %s — build the map first" % SVG)
    attr = dict(re.findall(r'data-([a-z-]+)="([^"]*)"', m.group(1)))
    return {"lonMin": float(attr["lon-min"]), "latMax": float(attr["lat-max"]),
            "pxPerDeg": float(attr["px-per-deg"]), "R": float(attr["r"])}


# ------------------------------------------------------------ the three maps
# Ported from map.js line for line. y is north-up here, as it is there; the
# flip into the document's y-down happens in `fit`, once.
def merc_raw(P, lon, lat):
    lon = lon + 360.0 if lon < P["lonMin"] else lon
    return ((lon - P["lonMin"]) * P["pxPerDeg"],
            P["R"] * math.log(math.tan(math.pi / 4 + lat * math.pi / 360)))


_alb = {}


def albers_const(P):
    if not _alb:
        p1, p2 = ALBERS["lat1"] * RAD, ALBERS["lat2"] * RAD
        p0 = ALBERS["lat0"] * RAD
        n = (math.sin(p1) + math.sin(p2)) / 2
        C = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
        _alb.update(n=n, C=C,
                    rho0=P["R"] * math.sqrt(max(0.0, C - 2 * n * math.sin(p0))) / n)
    return _alb


def albers_raw(P, lon, lat):
    a = albers_const(P)
    q = a["C"] - 2 * a["n"] * math.sin(lat * RAD)
    if q < 0:
        return None
    rho = P["R"] * math.sqrt(q) / a["n"]
    th = a["n"] * (lon - ALBERS["lon0"]) * RAD
    return (rho * math.sin(th), a["rho0"] - rho * math.cos(th))


def laea_raw(P, lon, lat):
    lam = (lon - LAEA["lon0"]) * RAD
    phi, p1 = lat * RAD, LAEA["lat0"] * RAD
    d = 1 + math.sin(p1) * math.sin(phi) + math.cos(p1) * math.cos(phi) * math.cos(lam)
    if d <= 1e-9:
        return None
    k = math.sqrt(2 / d) * P["R"]
    return (k * math.cos(phi) * math.sin(lam),
            k * (math.cos(p1) * math.sin(phi)
                 - math.sin(p1) * math.cos(phi) * math.cos(lam)))


RAWS = {"mercator": merc_raw, "albers": albers_raw, "laea": laea_raw}

PROJ4 = {
    "mercator": "+proj=merc +lon_0=0 +R=%.1f +units=m +no_defs" % R_EARTH,
    "albers": ("+proj=aea +lat_1=%(lat1)s +lat_2=%(lat2)s +lat_0=%(lat0)s "
               "+lon_0=%(lon0)s +x_0=0 +y_0=0 +R=%%.1f +units=m +no_defs"
               % ALBERS) % R_EARTH,
    "laea": ("+proj=laea +lat_0=%(lat0)s +lon_0=%(lon0)s +x_0=0 +y_0=0 "
             "+R=%%.1f +units=m +no_defs" % LAEA) % R_EARTH,
}


def fit(P, mode):
    """The frame's own box in this projection, in map units, y down.

    The same sampling loop `fitOf` runs in the browser and at the same density
    — the frame's edges are curves in two of the three, so its corners are not
    its extremes and four points would give the wrong box."""
    raw = RAWS[mode]
    x0 = y0 = float("inf")
    x1 = y1 = float("-inf")
    for i in range(101):
        for j in range(81):
            q = raw(P, LON_MIN + (LON_MAX - LON_MIN) * i / 100.0,
                    LAT_MIN + (LAT_MAX - LAT_MIN) * j / 80.0)
            if q is None:
                continue
            x0, x1 = min(x0, q[0]), max(x1, q[0])
            y0, y1 = min(y0, q[1]), max(y1, q[1])
    # map.js: x = raw.x + dx, y = dy - raw.y. Mercator is its own case there —
    # no fit, the document *is* the mercator box — so it is written that way.
    if mode == "mercator":
        return {"dx": 0.0, "dy": P["R"] * math.log(
            math.tan(math.pi / 4 + P["latMax"] * math.pi / 360)),
            "rawx0": x0, "rawx1": x1, "rawy0": y0, "rawy1": y1}
    return {"dx": -x0, "dy": y1,
            "rawx0": x0, "rawx1": x1, "rawy0": y0, "rawy1": y1}



# --------------------------------------------------------------- the water
def sea_value(gdal, vrt):
    """The flat grey the sheet paints water with.

    Shaded relief has no bathymetry: every sea pixel is one value, and in this
    frame — three quarters ocean — that value is simply the commonest one. Read
    rather than hardcoded, because it is a property of whichever sheet is
    handed to this script and SR_50M and SR_HR need not agree."""
    ds = gdal.Open(vrt)
    band = ds.GetRasterBand(1)
    # GDAL's own counter, not ReadAsArray: that one goes through gdal_array,
    # which imports numpy, and numpy on this machine is an empty stub. The
    # dataset is held in a local because a band outlives its dataset badly.
    h = band.GetHistogram(min=-0.5, max=255.5, buckets=256,
                          include_out_of_range=0, approx_ok=0)
    del band, ds
    return max(range(256), key=lambda v: h[v])


def neutralise(sea):
    """A lookup table putting the water at mid grey, so it blends to nothing.

    The image is laid over the map with `mix-blend-mode: soft-light`, which
    leaves the colour under it **unchanged** wherever the image is exactly
    128 and shades it either way on the two sides of that. So the sheet's own
    flat water value has to become 128 — otherwise the sea is tinted along
    with the land, and a shaded-relief sheet has nothing true to say about the
    sea in the first place.

    Piecewise linear, both sides stretched to fill their half, so no contrast
    is lost on land: the darkest shadow still reaches 0 and the brightest lit
    slope still reaches 255."""
    lut = []
    for v in range(256):
        if v <= sea:
            lut.append(int(round(v * 128.0 / sea)) if sea else 0)
        else:
            lut.append(int(round(128 + (v - sea) * 127.0 / (255 - sea)))
                       if sea < 255 else 128)
    return lut


def clip_source(gdal, src, work):
    """The frame's two longitude windows, side by side in one sheet.

    The eastern window is 180W..154W in the file and 180E..206E on the map, so
    its geotransform is moved 360 degrees east. Without that the warp has to
    cross the antimeridian and does not."""
    west = os.path.join(work, "rel-w.tif")
    east = os.path.join(work, "rel-e.tif")
    gdal.Translate(west, src, projWin=[LON_MIN, LAT_MAX, 180.0, LAT_MIN])
    gdal.Translate(east, src, projWin=[-180.0, LAT_MAX, LON_MAX - 360.0, LAT_MIN])
    ds = gdal.Open(east, 1)
    gt = list(ds.GetGeoTransform())
    gt[0] += 360.0
    ds.SetGeoTransform(gt)
    ds = None
    vrt = os.path.join(work, "rel-all.vrt")
    gdal.BuildVRT(vrt, [west, east])
    d = gdal.Open(vrt)
    return vrt, (d.RasterXSize, d.RasterYSize)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--src", default=DEFAULT_SRC,
                    help="the Natural Earth relief GeoTIFF (default: SR_50M)")
    ap.add_argument("--width", type=int, default=0,
                    help="output width in pixels (default: the clip's own)")
    ap.add_argument("--quality", type=int, default=72)
    ap.add_argument("--sea", type=int, default=0,
                    help="the flat grey the sheet uses for water "
                         "(default: the commonest value in the clip)")
    ap.add_argument("--out", default=ROOT)
    args = ap.parse_args()

    try:
        from osgeo import gdal
    except ImportError:
        sys.exit("build_relief: needs GDAL's Python bindings")
    try:
        from PIL import Image
    except ImportError:
        sys.exit("build_relief: needs Pillow")
    Image.MAX_IMAGE_PIXELS = None
    gdal.UseExceptions()

    if not os.path.exists(args.src):
        sys.exit("build_relief: no such file: %s" % args.src)
    P = svg_proj()
    # pxPerDeg has to be R in radians or mercator x and y are on different
    # scales and the image is stretched sideways. Checked, not assumed.
    want = P["R"] * RAD
    if abs(want - P["pxPerDeg"]) > 1e-6:
        sys.exit("build_relief: pxPerDeg %.6f is not R*pi/180 %.6f"
                 % (P["pxPerDeg"], want))

    work = os.path.join(HERE, "cache")
    os.makedirs(work, exist_ok=True)
    vrt, (sw, sh) = clip_source(gdal, args.src, work)
    sea = args.sea or sea_value(gdal, vrt)
    print("water sits at %d and is moved to 128, so soft-light leaves it alone" % sea)
    print("clipped to the frame: %d x %d  (%.1f Mpx of the world's %.1f)"
          % (sw, sh, sw * sh / 1e6,
             gdal.Open(args.src).RasterXSize * gdal.Open(args.src).RasterYSize / 1e6))

    scale = P["R"] / R_EARTH             # map units per projection metre
    out_w = args.width or sw
    manifest = {}
    for mode in ("mercator", "albers", "laea"):
        f = fit(P, mode)
        # the box in map units, y down, which is where the browser puts it
        box = {"x": f["rawx0"] + f["dx"], "y": f["dy"] - f["rawy1"],
               "w": f["rawx1"] - f["rawx0"], "h": f["rawy1"] - f["rawy0"]}
        # and the same box in the metres PROJ works in
        te = [f["rawx0"] / scale, f["rawy0"] / scale,
              f["rawx1"] / scale, f["rawy1"] / scale]
        out_h = max(1, int(round(out_w * box["h"] / box["w"])))
        tif = os.path.join(work, "rel-%s.tif" % mode)
        gdal.Warp(tif, vrt, dstSRS=PROJ4[mode], outputBounds=te,
                  width=out_w, height=out_h, resampleAlg="cubic",
                  srcNodata=None, dstAlpha=False)
        png = Image.open(tif).convert("L")
        png = png.point(neutralise(sea))
        name = "relief-%s.webp" % mode
        path = os.path.join(args.out, name)
        png.save(path, "WEBP", quality=args.quality, method=6)
        kb = os.path.getsize(path) // 1024
        manifest[mode] = {"src": name,
                          "x": round(box["x"], 2), "y": round(box["y"], 2),
                          "w": round(box["w"], 2), "h": round(box["h"], 2),
                          "px": [out_w, out_h]}
        print("  %-9s %5d x %-5d  %5d KB   box %8.1f %8.1f %8.1f %8.1f"
              % (mode, out_w, out_h, kb, box["x"], box["y"], box["w"], box["h"]))

    js = os.path.join(args.out, "relief.js")
    with open(js, "w", encoding="utf-8") as fh:
        fh.write("/* Generated by tools/build_relief.py. Do not edit.\n"
                 "   Shaded relief after Natural Earth, one warp per projection.\n"
                 "   x/y/w/h are the map units the image is drawn in. */\n"
                 "window.JMAP = window.JMAP || {};\n"
                 "JMAP.RELIEF = %s;\n"
                 % json.dumps(manifest, indent=2, sort_keys=True))
    print("wrote %s" % js)
    return 0


if __name__ == "__main__":
    sys.exit(main())
