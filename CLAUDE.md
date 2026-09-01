# Working notes for this project

## The map is version 1. Never make it version 2.

`texts/version.csv` holds one whole number: the **update number**. The reader
is shown *Version 1 update 203*, short form **1.203**, and the leading 1 is
not a counter. It does not roll over at a hundred, it does not follow from
anything the work does, and no amount of change earns it. **It moves only when
the author says the map is a version 2**, in those words. Until then every
release is another update of version 1.

Bump the update number by **one**, once, immediately before pushing.

```
python3 tools/build_texts.py --bump      # the release step: bump, then stamp
python3 tools/build_texts.py             # every other build: stamp only
```

It was a decimal once — 0.82 through 2.02 — and the hundredths were doing two
jobs at once, counting releases and implying that crossing x.99 meant
something. It did not. The number carried over by multiplying by a hundred, so
2.02 became update 202 and nothing a reader had already seen went backwards.

## The version number moves once per push, not once per build

`tools/build_texts.py` stamps the update number into the foot of the About
dialog with the date and time of the build.

Without `--bump` the number is left alone. This matters because a working
session rebuilds constantly — after a geometry change, after a text change,
after every measurement — and a bump on each of those is not a version, it is a
count of how many times a tool ran. It moved twenty in a single day that way,
with nothing released in between.

One push, one update. If a session pushes twice, that is two updates. If a
build is made and thrown away, the number does not move.

The date beside it is stamped on every build, bump or no bump, because its job
is to say how old the thing in front of the reader is.

## Read CSVs with a parser, never with awk or cut

`texts/` and `data/` hold quoted commas inside note fields, and a field-split
shifts every column after them. This has produced a real error already: two
Australian territories in `texts/territories/1930.csv` read as British, were
"corrected" on that basis, and had to be put back. Use `csv.DictReader`, and
write with `csv.DictWriter` so the quoting survives the round trip.

## Do not simplify geometry unless asked

Sources are traced or hand-clipped for a reason. When a new layer goes in,
report what fraction of its vertices survive the build, so that a tolerance
quietly undoing the work is visible rather than assumed away.

A hand-clipped edge belongs in `TRACED_TOL`. Burma is the worked example: its
source overlapped India and China by nothing at all, and thinned at the band a
country that size earns — 0.55 units, three kilometres — the drawn shape lay
over 390 km² of one and 585 of the other. The clipping was undone as fast as it
had been done.


## Map units and screen pixels are different things, and mixing them is this
## project's most-repeated bug

Everything drawn on the SVG lives in **map units**. Everything a reader
perceives — a stroke width, a blur, a gap, a hit target — is in **screen
pixels**. The two are related by one number, `view.w / containerWidth`, which
`rescale()` calls `k`. At the opening view `k` is about 1, so the two are
interchangeable and *every test passes*. Zoom in and `k` becomes a fraction;
zoom out and it grows. That is when the bug appears, and it never appears in
the view a test happens to open on.

It has now bitten three times:

* **The arrowhead detached from the shaft.** The trim was derived from the
  stroke width — screen pixels, because the stroke is `non-scaling-stroke` —
  and subtracted from a length along the curve, which is map units. Eight wheel
  steps in, the shaft was cut back until the head floated in open water.
* **A blurred polygon smeared across the map and then vanished.** The filter's
  `stdDeviation` is in user units. Left alone it grew with the zoom without
  limit; the reader saw it come back when they zoomed out, which is the
  signature of exactly this mistake.
* **And the fix for it was wrong the first time.** `primitiveUnits=
  "objectBoundingBox"` looks like it makes a filter relative — it does not. The
  fraction resolves against a bounding box that is itself in user units, so the
  deviation is still fixed in map units.

**The rules.**

1. If a quantity is something the reader *sees the size of*, it is in screen
   pixels. Convert it once, explicitly, and say so at the point of use.
2. `non-scaling-stroke` means the width is already in screen pixels. Anything
   computed from it is too.
3. A filter's `stdDeviation`, an `feOffset`, a dash array on a scaled path — all
   user units. They must be rewritten when the zoom changes. `rescale()` in
   `map.js` is where that happens and it hands `k` to the annotation module for
   exactly this.
4. **Test at more than one zoom.** A single check at the opening view proves
   nothing about any of this. `run10` measures the arrow tip and the blur at
   several zooms for that reason.

## Every table we draw can be taken away, with its source attached

A table of figures offers **Download CSV**, and the file carries the table's own
title, its columns and its rows, then a blank line, then a `Note` row for each
note the table shows and a `Source` row at the foot.

This is not a feature of the population tables; it is the rule for any table
this project draws. A table somebody can read is a table somebody will quote,
and a spreadsheet that has left the site with no source on it is a figure with
no provenance — which is the one thing a history map must never produce.

Two details that are easy to get wrong:

* **Write the figures, not the screen.** The cells carry a formatted string for
  reading — `1,933,326`, and `—` for nothing counted — and a number beside it.
  The CSV takes the number, and an empty cell where there is none, or the file
  cannot be added up.
* **Give the name its own columns.** The screen glues a place's romanisation
  and its characters into one string — `Kyŏnggi-do (Keiki-dō, 京畿道)` — because
  a cell is read at a glance. A file is not: one column of that cannot be
  sorted by name, matched against another table, or printed as characters
  alone. The first cell carries `name` and `kanji` beside its display string
  and the CSV writes `Name` and `Characters`.
* **Go through `popSortable`.** It keeps the columns and rows on the node as
  `tableSpec`, and `addCsvButton` reads that. A table built some other way has
  to hand the same spec over, or it will be exported by scraping the DOM —
  which gives whatever the reader last sorted it into.

## Record what changed in docs/tasks.md before marking it done

An entry says what was actually changed and what was measured, not what was
intended. Where something is unverified, say so in the entry.

## Never address a row in texts/ by its position

A row number is only true of one version of a file. Rewrite the file and row 47
is a different place — so an edit aimed at row 47, decided a while ago, lands on
a stranger. Two guards that look sufficient are not: `row < len(rows)` is still
true, and "is the field blank?" is still true, because the row you hit by
mistake was blank too. It writes confidently and wrongly and reports success.

This nearly happened. A three-hour name fill took its row numbers at the start
and wrote at the end; twenty commits landed in between and rebuilt several
tables — `burma.csv` went from 14 rows to 11, reordered. It came out clean only
because the files that moved and the files being written did not overlap.

**Address rows by their key.** Every table has one: `id` or `key`, and for the
five that need two columns, `COMPOUND_KEYS` in `tools/build_texts.py` and
`texts/admin/serve.py` names them. `build_texts.py` refuses to build if any key
is duplicated, so the guarantee is enforced rather than assumed. A row number
may be passed as a *hint* — it is usually still right and saves a scan — but it
must never be the address.

**And do not hold a decision across a slow gap.** If something takes minutes or
hours — a network fetch, a long conversation — split it: one pass that gathers
and writes nothing, a second that re-reads, decides and writes in the same
breath. The second pass should be safe to run again, filling whatever is blank
now.

## Snapshots are not a restore point here

`texts/admin/` writes a zip before every save, which is right for undoing an
edit and wrong for anything else. It restores *every* file to that moment, and
somebody else has probably written here since — so a zip from this morning
would revert their afternoon while appearing to undo five minutes of yours.

Use git. `git diff HEAD -- texts/` is what changed and `git checkout --` puts
one file back, and unlike a zip they know what everyone else did.

## Other sessions may be working in this checkout

`index.html`, `data.js`, `sources.html` and `SOURCES.md` are **built** from
`texts/`. Running `build_texts.py` while somebody is midway through editing the
prose splices a half-finished argument into the page. Check `git status` before
building, and before committing files you did not edit.

## A fix is not done until it works with a finger

There is no hover on a touch screen, and the map has a second set of
behaviours for that: `coarse` in `map.js` decides them, `hoverCapable` gates
the hover handlers, and a tap has to answer on its own what a mouse answers in
two moves — where the pointer is, and then what was clicked.

So anything that reads the pointer's state has to be checked twice, once with
a mouse and once with a finger. **Check both before saying it is fixed.**

Labuan is the worked example, and it cost two goes. Hovering it lit the
Straits Settlements correctly, so the bug looked closed; tapping it still
outlined North Borneo, because the selection was borrowing the *hover's*
cluster to know what to draw round. With a mouse the hover has set that before
the click lands. On a touch screen nothing ever sets it. The same fix had to
be made twice because the first one was only tested one way.

The two-tap rule is the other thing to hold in mind: on a coarse pointer the
first tap names the country and the second names the province under it. That
is right when the sub-unit is part of the country it sits in and wrong when it
is not — Labuan is a Straits Settlement drawn inside the North Borneo atom, so
its first tap has to name Labuan.

Both can be driven headlessly. Two cautions:

* Headless Chrome does not match `(hover: hover) and (pointer: fine)`, so the
  hover handlers are never wired and a mouse test silently measures nothing.
  Shim `matchMedia` in `evaluateOnNewDocument` to make those queries true.
* For the finger, open the page with `isMobile: true, hasTouch: true` in the
  viewport and leave the shim off. Drive it with `mouse.down()`/`mouse.up()`
  rather than `click()`, with a pause between: the map reads pointer events
  and a synthesised click can arrive without them.
