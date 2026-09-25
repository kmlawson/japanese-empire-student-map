# What to upload

The `deploy/` folder, whole. Nothing else in this repository is used at run
time — `texts/`, `tools/`, `data/` and `occupation-maps/` are how the map is
*made*, and the scripts at the root are the sources of the copies in
`deploy/lean/`. Uploading any of it costs bandwidth and gives a reader nothing.

Every path in the site is relative, so `deploy/` works as a domain root, in a
subdirectory, or off a memory stick, with nothing to configure. The files
below are what it holds, named relative to it.

## The files

| file | size | gzipped | when it loads |
| --- | ---: | ---: | --- |
| `index.html` | 71 KB | 23 KB | first |
| `styles.css` | 186 KB | 58 KB | first |
| `lean/map.js` | 455 KB | 117 KB | first — the shipped copy of `map.js`, comments stripped; the source stays at the repository root |
| `data.js` | 1,223 KB | 288 KB | first |
| `cities-gaz.js` | 105 KB | 26 KB | first |
| `japan-empire-map.svg` | 4,139 KB | 1,133 KB | first |
| `lean/annotate.js` | 152 KB | 39 KB | when **Create** or **Load annotations** is pressed — the shipped copy of `annotate.js` |
| `lean/trains.js` | 45 KB | 13 KB | when the train tools are asked for — the shipped copy of `trains.js` |
| `lean/air-play.js` | 20 KB | 7 KB | when the plane tools are asked for — the shipped copy of `air-play.js` |
| `lean/admin.js` | 59 KB | 16 KB | if the author option-clicks Layers — the shipped copy of `admin.js` |
| `japan-empire-map-admin.svg` | 1,773 KB | 446 KB | when **Administrative** is pressed |
| `japan-empire-map-fine.svg` | 976 KB | 186 KB | on a deep zoom, for the fine coastlines |
| `japan-empire-map-roc.svg` | 710 KB | 244 KB | if the reader switches China's province source |
| `japan-empire-map-korea.svg` | 1,376 KB | 348 KB | on a deep zoom over Korea, for its provinces |
| `japan-empire-map-tw-sugar.svg` | 181 KB | 37 KB | when Taiwan's sugar railways are switched on |
| `japan-empire-map-ne.svg` | 1,778 KB | 604 KB | only by `admin.js`, as an unsimplified coastline to check against; no reader loads it |
| `sources.html` | 44 KB | 17 KB | from the link in About |
| `relief.js` | 1 KB | 0.4 KB | when **Topo** is pressed — the manifest for the sheets in `relief/` |
| `tw-trains.js` | 181 KB | 46 KB | with the train tools, over Taiwan — the track, the stations and the line colours |
| `tw-times.js` | 101 KB | 23 KB | and its timetable, when the reader runs the clock or opens a line or a station |
| `kr-trains.js` | 1,018 KB | 305 KB | with them, over Korea, its connections routed along Manchuria's track |
| `kr-times.js` | 455 KB | 100 KB | and its timetable, on the same terms |
| `kf-trains.js` | 45 KB | 15 KB | with them, over Karafuto |
| `kf-times.js` | 23 KB | 6 KB | and its timetable, on the same terms |
| `mn-trains.js` | 1,061 KB | 280 KB | with them, over Manchuria — and, behind the connections switch, the Korean and Japanese lines the same booklet prints |
| `mn-times.js` | 495 KB | 106 KB | and its timetable, on the same terms |
| `tw-stations.js` | 52 KB | 11 KB | when Taiwan's stations are switched on (fetched then, not with the page) |
| `kr-stations.js` | 230 KB | 38 KB | when Korea's are |
| `kf-stations.js` | 41 KB | 8 KB | when Karafuto's are |
| `mn-stations.js` | 181 KB | 35 KB | when Manchuria's are |
| `jp-rails.js` | 1,784 KB | 338 KB | when **Japan Railways** is switched on — 1,977 lines, never with the page |
| `jp-stations.js` | 1,058 KB | 215 KB | when **Show Japan Stations** is — 12,800 places |
| `themes.js` | 112 KB | 35 KB | when a **thematic layer** is opened from the book beside the map |
| `theme-india-military.js` | 345 KB | 111 KB | when the **1931 military divisions of British India** are chosen from that book |
| `timetable/` (6 pages) | 4,074 KB | 682 KB | one at a time, when a card's link to its printed table is followed |
| `relief/` (9 `.webp` sheets) | 7,127 KB | — | when **Topo** is pressed; one sheet per projection and zoom band, fetched as asked for |
| **total** | **29.7 MB** | **12.4 MB** | |

Sizes measured on 17 September 2026, at update 372, gzip level 6.

Only the first six are fetched before the map is on screen: **6.0 MB raw,
1.61 MB gzipped**. The rest wait until something asks for them, and a reader
who never presses Administrative — or never draws on the map, or never runs a
timetable — never downloads those.

**The list is checked at build.** `tools/build_texts.py` refuses to build if a
file the site can fetch at run time is not named here. It was hand-kept before
and it drifted: the plane tools shipped, the mirror was updated without
`air-play.js`, and the button was there with nothing behind it. A list nobody
can forget is worth more than a list somebody remembers.

## The downloads

`deploy/gis/` holds what the map draws, written back out of the built geometry,
and `deploy/gis/source/` the files the build reads, exactly as they came. A
reader reaches them from the links in **Sources**, and the two British India
files (`india-1931.geojson`, `british-india-1930.geojson`) from the right-click
menu over India as well. Nothing on the map waits for them and nothing breaks
if they are left behind — but the links and those two menu items go dead, so
upload them with the rest.

`gis/source/` is **35 MB**, and 28 MB of that is Japan's two 1942 railway
sheets. On a metered host that is worth knowing before it goes up.

## Two optional extras

`.htaccess` — upload it too if the server is Apache, which DreamHost is. The
map works without it; what it does is make the compression below actually
happen. It is a dotfile, so an SFTP client will hide it until you turn on
"show hidden files".

`lean/admin.js` (59 KB) is the text-editing tool, fetched only if you option-click
Layers, and `japan-empire-map-ne.svg` (1.7 MB) is fetched only by it. A reader
never loads either. Leave them out unless you want them.

## Send index.html last

The page names the versions of everything else — `map.js?v=1.34` — and the
server ignores the `?v=`. If the page goes up before the script does, a reader
arriving in the gap asks for `map.js?v=1.34`, is handed the *old* `map.js`, and
their browser keeps it under the new name for a week. Upload the scripts, the
stylesheet and the SVGs first; upload `index.html` and `sources.html` last.

It is a few seconds' window and it takes somebody arriving inside it — but it
is silent and it lasts a week, so it is worth the ordering.

## Serve them gzipped

A first view is 1.61 MB compressed against 6.0 MB raw, so this is the one server
setting worth checking. Most hosts do it for `.html` and `.css`
already and forget `.svg`, which is where two thirds of the weight is. On
Apache the `.htaccess` in this repository handles it.

One trap, if you are writing the rules yourself: `.js` is served as
`text/javascript` by a current Apache and `application/javascript` by an older
one, so a compression rule naming only one of them silently misses `map.js`,
`data.js` and `cities-gaz.js` — 1.7 MB where 431 KB would do. List both.

GitHub Pages, Netlify, Cloudflare Pages and Vercel all do this without being
asked.

## Checking it worked

```
python3 tools/check_deploy.py https://your.host/path/to/the/map/
```

fetches the deployed page, reads the cache keys out of it, and fetches every
file the site would fetch — checking that each is present, that it is served
compressed, and that its contents match the key it was asked for. Exit code 0
if everything matches.

By hand: open the page and press each of **Cities**, **Events**,
**Administrative**, **Other** and **Topo**, then switch to **Dec 1942**, zoom
in a long way, and switch on a railway and its train tools. If the console
stays empty, everything those asked for is there. It does not reach every file
in the table — the station layers, the thematic layers and the plane tools
each have a switch of their own — which is why the script exists.

## If you would rather upload one file

```
python3 tools/bundle.py
```

writes `stale/japan-empire-map-standalone.html`, which inlines the base map and needs
nothing beside it. It is a single large download with no deferred layers, so it
is slower to first paint and heavier for a reader who only wants a look — but
it is one file, and it works from a memory stick or an email attachment.

`DEPLOY.md`, beside it, has the rest: URLs, caching headers, and putting it behind a
subdirectory.
