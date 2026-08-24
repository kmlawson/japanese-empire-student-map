#!/usr/bin/env python3
"""Inline the whole map into one HTML file.

    python3 tools/bundle.py

Writes stale/japan-empire-map-standalone.html, which opens straight from the file
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


# The anchor is matched by its href and not by its words. The sentence around
# it is prose spliced out of `texts/pages/about.md`, so it is rewritten
# whenever that page is edited — and a hard-coded copy of it here went stale
# without anyone noticing, which stopped the standalone build for two days.
SOURCES_LINK = re.compile(r'<a href="sources\.html">(.*?)</a>', re.S)


def inline_sources(html, sources):
    """Fold the sources page into About.

    There is no second file in the standalone build, so a link to sources.html
    goes nowhere. A data: URL is no help either — browsers refuse to navigate
    the top level to one — so the page's own body is folded into the About
    panel behind a disclosure triangle instead. Its heading, its summary
    paragraph and its two "back to the map" links are dropped: About already
    says what the page is, and there is nothing to go back from.
    """
    body = re.search(r'<div class="page">(.*?)</div>\s*</body>', sources, re.S)
    if not body:
        sys.exit("bundle: could not find the body of sources.html")
    body = body.group(1)
    for pattern in (r"<h1>.*?</h1>", r'<p class="lede">.*?</p>',
                    r'<p><a href="index\.html">.*?</a></p>'):
        body = re.sub(pattern, "", body, flags=re.S)

    m = SOURCES_LINK.search(html)
    if not m:
        sys.exit("bundle: could not find the sources link in index.html")
    # the link's own words, kept, with the link taken off them: whatever About
    # says about the sources page still reads correctly when the page is
    # folded in underneath instead of linked to
    html = html[:m.start()] + m.group(1) + html[m.end():]
    end = html.index("</p>", m.start()) + 4
    return (html[:end]
            + '\n  <details class="sources-inline"><summary>Sources in full</summary>'
            + body.strip() + "</details>\n"
            + html[end:])


def main():
    html = read("index.html")
    css = read("styles.css")
    data = read("data.js")
    gaz = read("cities-gaz.js") if os.path.exists(
        os.path.join(ROOT, "cities-gaz.js")) else ""
    js = read("map.js")
    # The annotation tools are a separate file that `map.js` fetches when a
    # reader asks for them — which a page opened from the file system cannot
    # do. Inlined here, `annLoad` finds `window.JMAP_ANNOTATE` already defined
    # and never reaches for the network.
    ann = read("annotate.js")
    svg = read("japan-empire-map.svg")
    admin = read("japan-empire-map-admin.svg")
    fine = read("japan-empire-map-fine.svg") if os.path.exists(
        os.path.join(ROOT, "japan-empire-map-fine.svg")) else ""

    # strip the XML declaration; it is only legal at the very top of a document
    svg = re.sub(r"^\s*<\?xml[^>]*\?>\s*", "", svg)

    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        "<style>\n" + css + "\n</style>",
    )
    html = html.replace(
        '<script src="data.js"></script>\n<script src="cities-gaz.js"></script>\n'
        '<script src="map.js"></script>',
        "<script>\n" + data + "\n</script>\n<script>\n" + gaz + "\n</script>\n"
        "<script>\nwindow.JMAP_INLINE_SVG = "
        + json.dumps(svg) + ";\nwindow.JMAP_INLINE_ADMIN = "
        + json.dumps(admin) + ";\nwindow.JMAP_INLINE_FINE = "
        + json.dumps(fine) + ";\n</script>\n<script>\n" + ann + "\n</script>"
        + "\n<script>\n" + js + "\n</script>",
    )

    if "JMAP_INLINE_SVG" not in html or "JMAP_INLINE_ADMIN" not in html:
        sys.exit("bundle: could not find the script tags to replace in index.html")
    if "<style>" not in html:
        sys.exit("bundle: the stylesheet link was not replaced")

    html = inline_sources(html, read("sources.html"))

    dest = os.path.join(ROOT, "stale", "japan-empire-map-standalone.html")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(html)
    sys.stderr.write(f"wrote {dest} ({os.path.getsize(dest)/1024:.0f} KB)\n")


if __name__ == "__main__":
    main()
