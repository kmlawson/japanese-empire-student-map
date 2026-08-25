# The annotation tests

227 checks over the drawing tools: what loads and when, the four kinds of mark,
styling, measurement, undo and dragging, files in and out, the shared link, the
browser's own store, and the panel at four screen sizes with a mouse and with a
finger.

```sh
cd /path/to/this/repo
python3 -m http.server 8123 &          # the suite drives a real page
npm install puppeteer                  # node_modules/ is gitignored

node tools/test/annotations/all.js     # all of them, four at a time
node tools/test/annotations/all.js 7 9 # or just these
JOBS=2 node tools/test/annotations/all.js   # narrower, on a small machine
```

`all.js` buffers each script's output and prints it whole when that script
ends, so eleven interleaved streams do not become one unreadable one, and it
finishes with a table sorted by how long each took. Its exit code is the number
of scripts that failed. To run one on its own:

```sh
node tools/test/annotations/run.js     # tools, styling, undo, dragging
node tools/test/annotations/run2.js    # files, saving, the link
node tools/test/annotations/run3.js    # the store, the map, projections, touch
node tools/test/annotations/run4.js    # four screen sizes
node tools/test/annotations/run5.js    # the running link-capacity counter
node tools/test/annotations/run6.js    # a shared link opens locked
node tools/test/annotations/run7.js    # the warning before leaving unsaved work
node tools/test/annotations/run8.js    # right click, and the long press
node tools/test/annotations/run9.js    # the tools, the controls, undo, selection
node tools/test/annotations/run10.js   # arrows: heads, bend, and the handle
node tools/test/annotations/run11.js   # short note vs description, dashes, weightless points
```

Each exits non-zero on a failure and prints which check failed.

## Why it used to take seven minutes

Three things, and none of them was the tests doing work.

**`run7` waited 150 seconds for a dialog nobody answered.** Its last step
presses Clear, Clear asks "are you sure?", and `run7` builds its own page
rather than using `page()` from `suite.js` — so it had no `dialog` handler. The
`confirm()` blocked until the protocol timed out, and a `.catch(() => {})` on
the line swallowed the error. Eight checks, six seconds of work, two and a half
minutes of waiting. It is five seconds now.

**Every page slept 3,200 ms for a map that is ready in 730.** Measured: the
atoms and the first labels are in the document 730 ms after the navigation
resolves, and the annotation panel is open and wired at 1,014. `page()` waits
for those now instead, with a 250 ms settle — because the warning below still
stands, and a count read too early comes back zero. Thirty-odd page loads
across the suite were paying three and a half seconds each.

*A trap that cost one debugging round:* folding "and its marks are drawn" into
that same wait charges the **damaged-link** cases the full timeout, because
half the point of those cases is that a damaged link draws nothing. `run2` grew
a 26-second pause at exactly the check that says so. The marks are waited for
separately and briefly.

**And the fixtures were charged 1.8 seconds each** for a file that is read in a
fraction of it. They wait for the panel to have *said* something now, which is
what the next line reads anyway.

Sequentially the suite is about four minutes; four at a time, **74 seconds for
252 checks**.

## Eleven scripts rather than one

They were one, and it timed out: a single browser accumulating forty pages
across a hundred checks slows until `Runtime.callFunctionOn` gives up. `run4`
goes further and opens a fresh browser per screen size, because a viewport
change on a used page is not the same thing as a page that opened at that size.

**Closing the page does not undo the accumulation.** `run8` opened three pages
in turn, each closed before the next, and still timed out on the third; `run11`
was written with a browser per section from the start. When a script needs more
than two pages, give each one its own browser.

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
