# What this map costs, update by update

One JSON per update, written by `tools/stats.js`. `tools/stats_diff.js` puts
them in a row.

    python3 -m http.server 8123 &
    node tools/stats.js          # measure, write stats/<update>.json
    node tools/stats.js --print  # measure, write nothing
    node tools/stats_diff.js     # every run side by side
    node tools/stats_diff.js 218 220

## Why

Performance work here has twice been argued from memory — *it feels slower
since the stations went in* — and memory is not evidence. A number written down
at update 220 can be compared with the same number at 260 without anybody
having to remember what it used to be.

## What the numbers are, and what they are not

Everything runs in **headless Chrome**, which rasterises without a compositor
or vsync. **Scripting is measured faithfully. Paint is not.** A change that
halves the paint cost will not show here, and a regression that doubles it will
not either.

That is why the label counts are recorded. They are the paint proxy: the thing
that cannot be timed is counted instead, and when panning got slow it was these
that had moved, not `busy%`.

Every timing is the **median of three runs**. One run of anything here varies
by about a fifth between invocations; three medians land within a couple of per
cent — enough to see a real change, not enough to chase noise.

| | |
|---|---|
| `first paint needs` | the page, its scripts and the one SVG it opens with. Everything else is fetched only if asked for. |
| `ready` | to the first atom being in the document, not to a finished paint. |
| `busy%` | share of profiler samples not idle, over one fixed 80-step drag. A share rather than milliseconds, because it survives a change of machine. |
| `label share of busy%` | how much of that was `placeLabels`, `gateLabels` and their helpers. |
| `labels drawn on screen` | lettered **and** inside the frame — the rasteriser's work. |
| `labels lettered in all` | every label carrying words, on screen or not — the placer's work. |
| `bare` vs `with layers` | the map as it opens, against the map with both railways, both station layers, Other and Admin on. |

The four views are bounding boxes, so the same call frames the same ground on
any window: **world** the whole map, **region** East Asia, **island** Taiwan,
**local** one prefecture.

## What update 220 says

* Opening the map costs **4.3 MB** and is ready in **1.0 s** with 8,114 nodes.
* Turning the transport layers on **roughly doubles** scripting during a pan at
  every zoom — 16.3→26.6 at the world view, 11.0→21.5 over Taiwan. That is the
  price of the layers and it is flat with the zoom.
* What is *not* flat is the labels: **12 lettered at the world view, 53 over
  East Asia, 626 over Taiwan, 1,299 over one prefecture** — a hundredfold, and
  the reason panning feels heavier the further in you are. Only 59 of those
  1,299 are on screen, so most of that work is spent on labels nobody sees,
  which is where the next improvement is.
* Label work is **1% of scripting or less** now that a pan places at 10 Hz
  rather than every frame. Before that change it was 4.6% at the local view.

## Adding a run

Build first, so the file sizes match what is measured, then run the tool. The
version comes from `texts/version.csv`, so a run lands in the file named after
whatever update is current — bump before measuring a release, not after.
