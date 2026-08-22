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

## Record what changed in tasks.md before marking it done

An entry says what was actually changed and what was measured, not what was
intended. Where something is unverified, say so in the entry.

## Other sessions may be working in this checkout

`index.html`, `data.js`, `sources.html` and `SOURCES.md` are **built** from
`texts/`. Running `build_texts.py` while somebody is midway through editing the
prose splices a half-finished argument into the page. Check `git status` before
building, and before committing files you did not edit.
