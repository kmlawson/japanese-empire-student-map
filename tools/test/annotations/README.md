# The annotation tests

131 checks over the drawing tools: what loads and when, the four kinds of mark,
styling, measurement, undo and dragging, files in and out, the shared link, the
browser's own store, and the panel at four screen sizes with a mouse and with a
finger.

```sh
cd /path/to/this/repo
python3 -m http.server 8123 &          # the suite drives a real page
npm install puppeteer                  # node_modules/ is gitignored

node tools/test/annotations/run.js     # tools, styling, undo, dragging
node tools/test/annotations/run2.js    # files, saving, the link
node tools/test/annotations/run3.js    # the store, the map, projections, touch
node tools/test/annotations/run4.js    # four screen sizes
node tools/test/annotations/run5.js    # the running link-capacity counter
```

Each exits non-zero on a failure and prints which check failed.

## Five scripts rather than one

They were one, and it timed out: a single browser accumulating forty pages
across a hundred checks slows until `Runtime.callFunctionOn` gives up. `run4`
goes further and opens a fresh browser per screen size, because a viewport
change on a used page is not the same thing as a page that opened at that size.

**A related trap, which cost two debugging rounds.** Driving several pages
through one browser makes some of them report *zero* island labels — a timing
artefact, not a fault in the map. Measure one view per browser when a count
matters.

## Two things the harness has to do

`suite.js` shims `matchMedia` so `(hover: hover) and (pointer: fine)` matches:
headless Chrome does not, the map's hover handlers are then never wired, and a
mouse test silently measures nothing. The touch cases leave the shim off and
set `isMobile`/`hasTouch` instead, and drive with `mouse.down()`/`mouse.up()`
and a pause rather than `click()`, because the map reads pointer events and a
synthesised click can arrive without them. See the repository's `CLAUDE.md`.

`SPOT` finds an interior point of a country that is on screen and clear of
every panel, trying several countries and falling back to "anywhere the map is
genuinely the top element". It is written as one self-contained function
because `page.evaluate` ships that function and nothing else — a helper defined
beside it is not in the page and throws `ReferenceError` there.

## The fixtures

`fixtures/` holds nine small files, four good and five broken, one per way a
file can be wrong: not JSON at all, truncated, a bare array, a plausible type
that is not GeoJSON, an empty collection, and coordinates that are strings. The
tenth case is `tools/cache/india-rivers.geojson` — 63 features and 14,851
points, this project's own data — which is the test that a foreign file with no
styling loads, draws, and is too big for a link.

Every broken case asserts two things: that the message names what was found,
and that **nothing was half-loaded**. Validation runs before a single feature is
adopted, so a bad file must leave whatever is already drawn alone.
