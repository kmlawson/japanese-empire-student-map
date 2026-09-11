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
| `index.html` | 12 KB | 5 KB | first |
| `styles.css` | 57 KB | 18 KB | first |
| `lean/map.js` | 411 KB | 105 KB | first — the shipped copy of `map.js`, comments stripped |
| `lean/annotate.js` | — | — | when **Create** or **Load annotations** is pressed |
| `lean/admin.js` | — | — | if the author option-clicks Layers |
| `lean/trains.js` | — | — | when the train tools are asked for |
| `lean/air-play.js` | — | — | when the plane tools are asked for |
| `map.js` | 844 KB | 272 KB | never fetched by a reader: the source, kept beside its lean copy |
| `data.js` | 564 KB | 169 KB | first |
| `cities-gaz.js` | 94 KB | 23 KB | first |
| `japan-empire-map.svg` | 2,784 KB | 797 KB | first |
| `japan-empire-map-admin.svg` | 1,159 KB | 327 KB | when **Administrative** is pressed |
| `japan-empire-map-fine.svg` | 635 KB | 128 KB | on a deep zoom, for the fine coastlines |
| `japan-empire-map-roc.svg` | 698 KB | 243 KB | if the reader switches China's province source |
| `japan-empire-map-korea.svg` | 1,376 KB | 349 KB | on a deep zoom over Korea, for its provinces |
| `sources.html` | 48 KB | 18 KB | from the link in About |
| `annotate.js` | 61 KB | 17 KB | when **Create** or **Load annotations** is pressed |
| `relief.js` | 2 KB | 1 KB | when **Topo** is pressed |
| `trains.js` | 46 KB | 15 KB | when the train tools are asked for |
| `tw-trains.js` | 182 KB | 46 KB | with them, over Taiwan — the track, the stations and the line colours |
| `tw-times.js` | 102 KB | 22 KB | and its timetable, when the reader runs the clock or opens a line or a station |
| `kr-trains.js` | 766 KB | 217 KB | with them, over Korea |
| `kr-times.js` | 455 KB | 97 KB | and its timetable, on the same terms |
| `kf-trains.js` | 45 KB | 16 KB | with them, over Karafuto |
| `kf-times.js` | 24 KB | 7 KB | and its timetable, on the same terms |
| `tw-stations.js` | 50 KB | 11 KB | when Taiwan's stations are switched on (fetched then, not with the page) |
| `kr-stations.js` | 229 KB | 38 KB | when Korea's are |
| `kf-stations.js` | 41 KB | 8 KB | when Karafuto's are |
| `jp-rails.js` | 1,706 KB | 328 KB | when **Japan Railways** is switched on — 1,977 lines, never with the page |
| `jp-stations.js` | 1,059 KB | 210 KB | when **Show Japan Stations** is — 12,800 places |
| `air-play.js` | 29 KB | 11 KB | when the plane tools are asked for |
| **total** | **9.4 MB** | **2.65 MB** | |

Only the first six are fetched before the map is on screen: **3.7 MB raw,
1.08 MB gzipped**. The rest wait until something asks for them, and a reader
who never presses Administrative — or never draws on the map, or never runs a
timetable — never downloads those.

**The list is checked at build.** `tools/build_texts.py` refuses to build if a
file the site can fetch at run time is not named here. It was hand-kept before
and it drifted: the plane tools shipped, the mirror was updated without
`air-play.js`, and the button was there with nothing behind it. A list nobody
can forget is worth more than a list somebody remembers.

## Two optional extras

`.htaccess` — upload it too if the server is Apache, which DreamHost is. The
map works without it; what it does is make the compression below actually
happen. It is a dotfile, so an SFTP client will hide it until you turn on
"show hidden files".

`admin.js` (32 KB) is the text-editing tool, fetched only if you option-click
Layers. A reader never loads it. Leave it out unless you want it.

## Send index.html last

The page names the versions of everything else — `map.js?v=1.34` — and the
server ignores the `?v=`. If the page goes up before the script does, a reader
arriving in the gap asks for `map.js?v=1.34`, is handed the *old* `map.js`, and
their browser keeps it under the new name for a week. Upload the scripts, the
stylesheet and the SVGs first; upload `index.html` and `sources.html` last.

It is a few seconds' window and it takes somebody arriving inside it — but it
is silent and it lasts a week, so it is worth the ordering.

## Serve them gzipped

The map is 1.8 MB compressed against 6.1 MB raw, so this is the one server
setting worth checking. Most hosts do it for `.html` and `.css`
already and forget `.svg`, which is where two thirds of the weight is. On
Apache the `.htaccess` in this repository handles it.

One trap, if you are writing the rules yourself: `.js` is served as
`text/javascript` by a current Apache and `application/javascript` by an older
one, so a compression rule naming only one of them silently misses `map.js`,
`data.js` and `cities-gaz.js` — 877 KB where 261 KB would do. List both.

GitHub Pages, Netlify, Cloudflare Pages and Vercel all do this without being
asked.

## Checking it worked

Open the page and press each of **Cities**, **Events**, **Administrative** and
**Other**, then switch to **Dec 1942** and zoom in a long way. That exercises
every file in the list: Administrative pulls the admin sheet, a deep zoom pulls
the fine coastlines, and the province-source radio in Layers pulls the ROC one.
If the console stays empty, everything it needs is there.

That is how the list above was arrived at rather than guessed: the ten files
were copied to an empty directory, served on their own, and put through exactly
that sequence — no failed requests, no console errors, 85 territories, 1,293
divisions, 127 city markers.

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
