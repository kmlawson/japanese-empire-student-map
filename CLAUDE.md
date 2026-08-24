# Working notes for this project

## The version number moves once per push, not once per build

`texts/version.csv` holds one number and `tools/build_texts.py` stamps it into
the foot of the About dialog with the date and time of the build.

**Bump it by 0.01 once, immediately before pushing.** Not once per build.

```
python3 tools/build_texts.py --bump      # the release step: bump, then stamp
python3 tools/build_texts.py             # every other build: stamp only
```

Without `--bump` the number is left alone. This matters because a working
session rebuilds constantly — after a geometry change, after a text change,
after every measurement — and a bump on each of those is not a version, it is a
count of how many times a tool ran. It went 0.82 to 1.02 in a single day that
way, with nothing released in between, which tells a student the map has passed
1.0 when it has not.

One push, one hundredth. If a session pushes twice, that is two hundredths. If
a build is made and thrown away, the number does not move.

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
