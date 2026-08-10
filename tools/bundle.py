#!/usr/bin/env python3
"""Inline the whole map into one HTML file.

    python3 tools/bundle.py

Writes japan-empire-map-standalone.html, which opens straight from the file
system with no web server: useful for handing to students on a memory stick,
or for working offline.
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as fh:
        return fh.read()


def main():
    html = read("index.html")
    css = read("styles.css")
    data = read("data.js")
    js = read("map.js")
    svg = read("japan-empire-map.svg")

    # strip the XML declaration; it is only legal at the very top of a document
    svg = re.sub(r"^\s*<\?xml[^>]*\?>\s*", "", svg)

    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        "<style>\n" + css + "\n</style>",
    )
    html = html.replace(
        '<script src="data.js"></script>\n<script src="map.js"></script>',
        "<script>\n" + data + "\n</script>\n<script>\nwindow.JMAP_INLINE_SVG = "
        + json.dumps(svg) + ";\n</script>\n<script>\n" + js + "\n</script>",
    )

    if "JMAP_INLINE_SVG" not in html:
        sys.exit("bundle: could not find the script tags to replace in index.html")

    dest = os.path.join(ROOT, "japan-empire-map-standalone.html")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(html)
    sys.stderr.write(f"wrote {dest} ({os.path.getsize(dest)/1024:.0f} KB)\n")


if __name__ == "__main__":
    main()
