"""The two language-census themes, from `data/india-language-1931/`.

    python3 tools/build_themes.py        # calls this; there is no separate step

Writes three files beside `themes.js`, each fetched only when a reader chooses
one of the two census rows in the book:

* `deploy/theme-census-langs.js`    the classification tree, the Vol. I figures
                                    and the second languages; both themes need it
* `deploy/theme-census-province.js` the 35 provinces and states, in lon/lat
* `deploy/theme-census-district.js` the 349 district units, with their figures

**The rings go out in lon/lat**, for the reason `build_themes.py` gives: map.js
holds the projection. The source holds SVG paths in its own Mercator (origin
60° E, 20 px per degree, top at 38° N), so this inverts them. That is the same
scale the map draws at, and three decimals of a degree is a fiftieth of the
0.1 px the source was written to, so inverting loses nothing. `main` checks
that: every vertex is projected back and compared.

**Nothing is simplified here.** The source simplified once, across the whole
coverage so that neighbours keep one shared line (`shapely.coverage_simplify`),
and what it published is drawn: the count of vertices in and out is printed so
that a change to that shows up.

Which units have figures to map is worked out here rather than in the page, for
the one case that needs a number the page does not get: a Gwalior district
whose printed population cannot be read is judged against its 1931 population
in Census 2011 Table A-2, and the series itself stays behind.
"""
import json
import math
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "deploy")
SRC = os.path.join(ROOT, "data", "india-language-1931")

PROVINCE_ID = "india-census-province"
DISTRICT_ID = "india-census-district"
FULL_SITE = "https://kmlawson.github.io/playground-india-language/"

LANGS_FILE = "theme-census-langs.js"
PROVINCE_FILE = "theme-census-province.js"
DISTRICT_FILE = "theme-census-district.js"
MODULE_FILE = "theme-census.js"

# The source's Mercator, from `proj` in its geo.js.
LON0 = 60.0
PX_PER_DEG = 20.0
LAT_MAX = 38.0
R = PX_PER_DEG * 180.0 / math.pi
YTOP = R * math.log(math.tan(math.pi / 4 + LAT_MAX * math.pi / 360))
PREC = 3

# ---- what the province map says that its data files do not carry -----------
# All of these are the source site's own, from its app.js.

# Hand-placed label points, where a unit is scattered or its largest piece is
# not where a reader looks for it. Lon, lat.
LABEL_AT = {
    "21": [73.5, 23.2], "31": [75.9, 30.1], "30": [77.4, 31.3], "4": [67.6, 30.4],
    "17": [65.3, 27.6], "13": [70.6, 32.0], "29": [72.4, 35.3], "35": [70.6, 22.3],
    "22": [75.3, 22.7], "23": [83.1, 23.3], "20": [84.9, 21.6], "19": [91.3, 23.8],
    "16": [93.9, 24.7], "34": [78.5, 30.8], "27": [76.7, 9.3], "18": [73.1, 22.3],
    "1": [74.6, 26.2], "11": [77.2, 28.6], "10": [75.8, 12.4], "33": [88.5, 27.6],
    "2": [92.8, 11.8], "8": [96.0, 21.0], "3": [92.6, 26.5], "26": [75.8, 34.2],
    "14": [73.4, 31.0], "32": [73.6, 26.5], "24": [77.8, 25.4], "12": [79.3, 14.0],
    "25": [78.3, 17.8], "28": [76.4, 13.4], "9": [79.3, 21.4], "6": [85.7, 24.6],
    "5": [89.2, 23.6], "15": [80.8, 27.0], "7": [74.6, 19.5],
}

# Units whose figures do not describe the population of the area drawn.
UNIT_NOTES = {
    "29": ("Only 46,451 people were enumerated here, 44,635 of them men: in effect "
           "the garrisons, posts and cantonments. The tribal population (estimated "
           "at 2,212,837) was not enumerated and is not in Table XV, so these "
           "figures describe troops and officials, not the tribes."),
    "7": ("Includes Aden (51,478 people, shown separately below). Sind was part of "
          "Bombay in 1931. The estimated population of Ahmedabad city (75,735), "
          "where the census was boycotted, is not in Table XV."),
    "8": ("Burma was part of British India until 1937. The census area (233,492 "
          "sq. mi) left out unadministered tracts on the northern frontier, and the "
          "19,649 people estimated for East Manglun (Shan States) are not in "
          "Table XV."),
    "3": "The grey frontier tracts to the north and east were largely "
         "unadministered and not enumerated.",
    "35": ("Kathiawar, Cutch and the Palanpur agency, as constituted in 1931. The "
           "Rann of Kutch (grey) is not counted in the area."),
}

# Drawn, and not census units in Table XV.
EXTRA_NAMES = {
    "tribal_ne": ("North-east frontier tracts", "Largely unadministered, not "
                  "enumerated (or only along the plains edge, counted in Assam)."),
    "goa": ("Portuguese India", "Goa, Daman, Diu, Dadra and Nagar Haveli."),
    "french": ("French India", "Pondicherry, Karikal, Mahé, Yanam; Chandernagore is "
               "too small to draw."),
    "gwadar": ("Gwadar", "A possession of Muscat until 1958."),
    "rann": ("Rann of Kutch", "Salt waste, not counted in any unit's area."),
}

# Printed separately inside a province's or a state's row.
SUBS = {"7": ["7a"], "27": ["27a", "27b", "27c"]}

# What a language table is about, for its source line.
SOURCE_PROVINCE = ("Census of India, 1931, Vol. I (India), Part II (Imperial "
                   "Tables), Table XV Part I, transcribed in Languages of India, "
                   "1931 (" + FULL_SITE + ")")
SOURCE_DISTRICT = ("Census of India, 1931, provincial and state volumes, Table XV "
                   "Part I, transcribed in Languages of India, 1931 (" + FULL_SITE + ")")
SOURCE_BILINGUAL = ("Census of India, 1931, Vol. I (India), Part II (Imperial "
                    "Tables), Table XV Part II, transcribed in Languages of India, "
                    "1931 (" + FULL_SITE + ")")
VOL_I_ITEM = "india.history.resource.92539"


def meta():
    """The two rows of the book. Goes in `themes.js`, with the others."""
    common = {
        "atom": "india-census",
        "when": "1931",
        "admin": False,
        "clip": False,
        "mod": "census",
        # the map's own atoms the theme stands on: see `themeUnderlay` in map.js
        "under": ["india", "princely", "andaman", "burma", "saharat"],
        "more": {"href": FULL_SITE,
                 "en": "Explore the full 1931 census language maps and tables"},
    }
    prov = dict(common, id=PROVINCE_ID, level="province",
                en="1931 Census Languages of India, by Province",
                source="Census of India, 1931, Vol. I, Table XV",
                files=[MODULE_FILE, LANGS_FILE, PROVINCE_FILE])
    dist = dict(common, id=DISTRICT_ID, level="district",
                en="1931 Census Languages of India, by District",
                source="Census of India, 1931, provincial and state volumes, Table XV",
                files=[MODULE_FILE, LANGS_FILE, DISTRICT_FILE])
    return {PROVINCE_ID: prov, DISTRICT_ID: dist}


def read_js(name, var):
    with open(os.path.join(SRC, name), encoding="utf-8") as fh:
        raw = fh.read()
    start = raw.index("=", raw.index("window." + var)) + 1
    return json.JSONDecoder().raw_decode(raw[start:].strip())[0]


def lon_lat(x, y):
    lon = x / PX_PER_DEG + LON0
    lat = (2 * math.atan(math.exp((YTOP - y) / R)) - math.pi / 2) * 180 / math.pi
    return [round(lon, PREC), round(lat, PREC)]


def to_px(lon, lat):
    x = (lon - LON0) * PX_PER_DEG
    y = YTOP - R * math.log(math.tan(math.pi / 4 + lat * math.pi / 360))
    return x, y


TOKEN = re.compile(r"[MLZ]|-?\d+(?:\.\d+)?")


class Tally:
    """How many vertices came in, how many went out, and how far the worst
    one lands from where the source put it when projected back."""

    def __init__(self):
        self.vertices = 0
        self.written = 0
        self.worst = 0.0


def rings_of_path(d, tally):
    """An SVG path of M, L and Z as flat [lon, lat, ...] rings, in their own
    order and direction: holes are holes by even-odd, as the source draws them."""
    rings = []
    cur = None
    tok = TOKEN.findall(d)
    i = 0
    while i < len(tok):
        t = tok[i]
        if t == "Z":
            if cur:
                rings.append(cur)
            cur = None
            i += 1
            continue
        if t == "M":
            if cur:
                rings.append(cur)
            cur = []
            i += 1
            continue
        if t == "L":
            i += 1
            continue
        x, y = float(tok[i]), float(tok[i + 1])
        i += 2
        p = lon_lat(x, y)
        tally.vertices += 1
        tally.written += 1
        bx, by = to_px(p[0], p[1])
        tally.worst = max(tally.worst, abs(bx - x), abs(by - y))
        cur.extend(p)
    if cur:
        rings.append(cur)
    return rings


def write_js(name, head, var, doc):
    path = os.path.join(SITE, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(head)
        fh.write(var + " = ")
        json.dump(doc, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    print("wrote      %s (%.0f KB)" % (os.path.relpath(path, ROOT),
                                      os.path.getsize(path) / 1024.0))


def build_langs():
    census = read_js("census.js", "CENSUS")
    bilingual = read_js("bilingual.js", "BILINGUAL")
    langs = []
    for i, l in enumerate(census["langs"]):
        if l["id"] != i:
            raise SystemExit("census.js: a language's id is not its position (%r). "
                             "The page indexes the tree by id." % l["name"])
        o = {"name": l["name"], "parent": l["parent"], "kids": l["kids"], "v": l.get("v") or {}}
        for key in ("col", "page", "leaf", "note", "f", "computed"):
            if l.get(key):
                o[key] = l[key]
        langs.append(o)
    doc = {
        "langs": langs,
        "units": census["units"],
        "bil": bilingual,
        "unitNotes": UNIT_NOTES,
        "subs": SUBS,
        "volI": VOL_I_ITEM,
        "sources": {"province": SOURCE_PROVINCE, "district": SOURCE_DISTRICT,
                    "bilingual": SOURCE_BILINGUAL},
    }
    write_js(LANGS_FILE,
             "/* Built by tools/build_census.py -- do not edit.\n"
             " * Census of India, 1931, Table XV: the classification and every\n"
             " * figure of Vol. I, and the second languages of Part II. */\n",
             "JMAP.CENSUS_DATA", doc)
    print("census     %d classification entries, %d second-language entries"
          % (len(langs), len(bilingual)))


def build_province():
    geo = read_js("geo.js", "GEO")
    census = read_js("census.js", "CENSUS")
    tally = Tally()
    units = []
    for code, g in geo["units"].items():
        if code not in census["units"]:
            raise SystemExit("geo.js draws %r, which census.js does not know" % code)
        at = LABEL_AT.get(code) or lon_lat(g["lx"], g["ly"])
        units.append({"code": code, "r": rings_of_path(g["d"], tally), "at": at,
                      "nb": g.get("nb") or [], "ar": g.get("ar") or 0})
    extra = []
    for key, g in geo["extra"].items():
        name, note = EXTRA_NAMES[key]
        extra.append({"key": key, "name": name, "note": note,
                      "r": rings_of_path(g["d"], tally)})
    write_js(PROVINCE_FILE,
             "/* Built by tools/build_census.py -- do not edit.\n"
             " * The provinces and states of the 1931 census, in lon/lat. Derived from\n"
             " * plague_india (LGPL-3.0), geoBoundaries (India ODbL 1.0), OpenStreetMap\n"
             " * (ODbL 1.0) and Natural Earth: data/india-language-1931/LICENSE. */\n"
             "JMAP.THEME_GEOM = JMAP.THEME_GEOM || {};\n",
             "JMAP.THEME_GEOM[%s]" % json.dumps(PROVINCE_ID),
             {"units": units, "extra": extra})
    print("province   %d units and %d other areas; %d of %d vertices written (100%%), "
          "worst round trip %.3f px"
          % (len(units), len(extra), tally.written, tally.vertices, tally.worst))
    return tally


def short_name(u):
    """The name a district unit goes by: its 1931 names, or failing those its
    areas, or failing those the present-day shapes it is drawn from."""
    names = (u["names31"] or [m["area"] for m in u["members"]]
             or [re.sub(r" \((India|Pakistan|Bangladesh|Burma, 1931)\)$", "", s)
                 for s in u["shapes"]])
    more = len(names) - 3
    return ", ".join(names[:3]) + (" +%d more" % more if more > 0 else "")


def build_district():
    dist = read_js("districts.js", "DISTRICTS")
    tally = Tally()
    units = []
    damaged = 0
    for u in dist["units"]:
        vals = u["vals"]
        pop = u.get("pop") or [0, 0, 0]
        total = sum(v[0] for v in vals.values())
        people = max(pop[0] or 0, total)
        pop_missing = any(m["vol"] != "india" and not (m.get("check") and m["check"][0])
                          for m in u["members"])
        a31 = u["series"][3] if u.get("series") else None
        by_a31 = bool(pop_missing and a31 and total < 0.8 * a31)
        dmg = bool(people) and (total / people < 0.8 or by_a31)
        damaged += dmg
        o = {
            "r": rings_of_path(u["d"], tally),
            "at": lon_lat(u["lx"], u["ly"]),
            "short": short_name(u),
            "status": u["status"],
            "pop": pop,
            "S": total,
            "P": people,
            "vals": vals,
            "shapes": u["shapes"],
            "nb": u.get("nb") or [],
            "ar": u.get("ar") or 0,
            "members": [{"vol": m["vol"], "area": m["area"], "path": m.get("path") or [],
                         "leaves": m.get("leaves") or [], "pages": m.get("pages") or [],
                         "flags": [f for f in (m.get("flags") or []) if f != "V"],
                         "check": m.get("check")}
                        for m in u["members"]],
        }
        for key in ("note", "coarse", "missing31"):
            if u.get(key):
                o[key] = u[key]
        if dmg:
            o["dmg"] = True
            if by_a31 and not total / people < 0.8:
                o["a31"] = a31
        units.append(o)
    prov = [{"g": p["g"], "r": rings_of_path(p["d"], tally)} for p in dist["prov"]]
    vols = dict((k, {"title": v.get("title"), "id": v.get("identifier")})
                for k, v in dist["vols"].items())
    write_js(DISTRICT_FILE,
             "/* Built by tools/build_census.py -- do not edit.\n"
             " * The district units of the 1931 census language map, in lon/lat, with\n"
             " * their figures. Derived from geoBoundaries (India ODbL 1.0, Pakistan\n"
             " * public domain, Bangladesh CC BY 3.0 IGO) and Natural Earth:\n"
             " * data/india-language-1931/LICENSE. */\n"
             "JMAP.THEME_GEOM = JMAP.THEME_GEOM || {};\n",
             "JMAP.THEME_GEOM[%s]" % json.dumps(DISTRICT_ID),
             {"units": units, "prov": prov, "vols": vols})
    print("district   %d units (%d not mapped: pages damaged), %d province outlines; "
          "%d of %d vertices written (100%%), worst round trip %.3f px"
          % (len(units), damaged, len(prov), tally.written, tally.vertices, tally.worst))
    return tally


def main():
    if not os.path.isdir(SRC):
        raise SystemExit("%s is missing" % SRC)
    build_langs()
    for tally in (build_province(), build_district()):
        # a fiftieth of the source's own 0.1 px; past this the rounding above
        # is moving shared edges apart, and it should be heard about
        if tally.worst > 0.02:
            raise SystemExit("a vertex moved %.3f px on its way to lon/lat" % tally.worst)


if __name__ == "__main__":
    main()
