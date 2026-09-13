"""The unthinned sources, copied into the site so they can be downloaded.

    python3 tools/build_gis_sources.py

`deploy/gis/` already holds what the *map* draws, written back out of the
built geometry — true to what a reader sees and thinned to what a browser can
pan. This puts the other thing beside it: the files the build reads, exactly
as they came, for somebody who wants the detail the map gave up.

**Only what the build actually reads.** `data/` holds working files too —
earlier drafts, a network's 1930 sheet that turned out to be derivable from
the 1942 one, a layer that was never wired up — and shipping those would
publish as a source something this map is not drawn from. So the list is
checked against `tools/*.py` here, at build: a file named below that no build
script opens stops this rather than going quietly onto the site.
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "deploy", "gis", "source")

# (path under the repository, the name it is published as)
#
# The name is flattened — one folder of files rather than the shape of the
# working tree — because these are a published set and the folders they sit in
# here are an accident of how the work was done.
FILES = [
    ("data/burma/burma-1931-admin.geojson", "burma-1931-admin.geojson"),
    ("data/burma/burma-1931-admin-units.geojson", "burma-1931-admin-units.geojson"),
    ("data/burma/burma-1931-dissolved.geojson", "burma-1931-dissolved.geojson"),
    ("data/burma/burma-1931-rule-categories.geojson",
     "burma-1931-rule-categories.geojson"),
    ("data/burma/burma-railway-lines-1930.geojson", "burma-railway-lines-1930.geojson"),

    ("data/dei/dei-admin-1930.geojson", "dei-admin-1930.geojson"),
    ("data/dei/dei-1930-admin.geojson", "dei-1930-admin.geojson"),
    ("data/dei/dei-1930-dissolved.geojson", "dei-1930-dissolved.geojson"),
    ("data/dei/dei-1941-admin.geojson", "dei-1941-admin.geojson"),
    ("data/dei/dei-1942-admin.geojson", "dei-1942-admin.geojson"),
    ("data/dei/dei-1942-dissolved.geojson", "dei-1942-dissolved.geojson"),

    ("data/indochina/french-indochina-1930.geojson", "french-indochina-1930.geojson"),
    ("data/indochina/french-indochina-admin.geojson", "french-indochina-admin.geojson"),
    ("data/indochina/french-indochina-1930-admin.geojson",
     "french-indochina-1930-admin.geojson"),
    ("data/indochina/french-indochina-1930-dissolved.geojson",
     "french-indochina-1930-dissolved.geojson"),
    ("data/indochina/french-indochina-1941-ceded.geojson",
     "french-indochina-1941-ceded.geojson"),
    ("data/indochina/french-indochina-1942-dissolved.geojson",
     "french-indochina-1942-dissolved.geojson"),

    # **The 1942 sheets only.** The 1930 network is derived from these by the
    # opening and closing years each line carries, so `japan-railway-lines-
    # 1930.geojson` is a working file the build does not read — and 26 MB of
    # it. Shipping it would say this map is drawn from something it is not.
    ("data/jp-rails/japan-railway-lines-1942.geojson", "japan-railway-lines-1942.geojson"),
    ("data/jp-rails/japan-railway-stations-1942.geojson",
     "japan-railway-stations-1942.geojson"),

    ("data/karafuto/karafuto-coast-detailed.geojson", "karafuto-coast-detailed.geojson"),
    ("data/kf-1935-timetable/karafuto-1935-stations.geojson",
     "karafuto-1935-stations.geojson"),
]


def read_by_build(name):
    """Does any build script open this file? Checked by name rather than by
    path, because the scripts build their paths out of a directory constant
    and a basename and a match on the full path would find nothing."""
    tools = os.path.join(ROOT, "tools")
    for f in sorted(os.listdir(tools)):
        if not f.endswith(".py") or f == os.path.basename(__file__):
            continue
        with open(os.path.join(tools, f), encoding="utf-8") as fh:
            if name in fh.read():
                return f
    return ""


def main():
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    have = set(os.listdir(OUT))
    total = 0
    for src, name in FILES:
        p = os.path.join(ROOT, src)
        if not os.path.exists(p):
            raise SystemExit("%s is named here and is not on disk" % src)
        who = read_by_build(os.path.basename(src))
        if not who:
            raise SystemExit(
                "%s is named here and no build script reads it. This folder is "
                "the sources the map is drawn from; a working file published "
                "as one is a claim about the map that is not true. Either wire "
                "it up or take it out of FILES." % src)
        shutil.copyfile(p, os.path.join(OUT, name))
        have.discard(name)
        n = os.path.getsize(p)
        total += n
        print("  %-42s %7.1f KB   %s" % (name, n / 1024.0, who))
    # a file that used to be published and is not in the list any more is a
    # dead link in sources.md, so say so rather than leaving it lying there
    for extra in sorted(have):
        print("  note: %s is in deploy/gis/source and not in this list" % extra)
    print("gis/source  %d file(s), %.1f MB" % (len(FILES), total / 1048576.0))


if __name__ == "__main__":
    main()
