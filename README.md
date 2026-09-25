# interactive-japan-map

An interactive map of the Japanese Empire for students, and a companion to the
interactive map of modern China used in the same module. It covers
the geography that recurs in the history of modern Japan from Perry's arrival in
1853 to the surrender in 1945: the home islands, the formal colonies, the
occupied territories and puppet states, the neighbouring countries, and the
cities, ports and battlefields tied to the events in the module timelines.

Plain HTML, CSS and JavaScript. No dependencies, no framework, and nothing to
build in order to use it: the site is the `deploy/` folder, served over HTTP.
The rest of the repository is how that folder is made.

## Using it

* **1930 / Dec 1942** — two maps, not one. In 1930, on the eve of the
  Manchurian Incident, the colours show whose empire each place belonged to:
  British, French, Dutch, American, Portuguese, Australian, Japanese, Chinese,
  Soviet, independent. In December 1942 they show how Japan held what it had
  taken: metropole, colonies, client states,
  military occupation, the fighting front. Names, dates and notes change with
  the date too — Singapore is Singapore in 1930 and Syonan-to in 1942.
* **Explore** — hover over, or tap, anything to get its name in all four
  languages, the date it changed hands, and a note on why it matters. Hovering
  also names the sub-unit under the pointer: the provinces of China, Manchukuo
  and colonial Korea, the prefectures of Japan, the districts of Taiwan and of
  Burma, the provinces of French Indochina, the changwat of Siam, the Malay
  states with their federated status, the residencies of the Indies, the
  provinces of the Philippines, and the island groups of the mandate. The
  hover carries a phrase; the card carries the whole note, and a Wikipedia link
  where there is a right article to link to.
* **Quiz** — you are asked to find a place and you click it on the map. Wrong
  answers tell you what you actually clicked; the places you missed are listed
  at the end.
* **Basic / Intermediate / Advanced** — how much the quiz asks about and how
  many names the map shows. The pool widens roughly 26 → 64 → 136 places in
  1930 and 28 → 72 → 143 in 1942; the exact figures move whenever content is
  added, so treat them as the shape of the thing rather than a count. Every
  territory stays clickable at every level, so you can always check something
  you can see.
* **Names in four scripts.** The headline is English, and it gives the name as
  it was used at the time with the modern one in brackets — Mukden (Shenyang),
  Peking (Beijing), Taihoku (Taipei), Hsinking (Changchun), Batavia (Jakarta).
  Underneath it come the other scripts that belong to the place, and only those:
  the imperial-period Japanese (Keijō for Seoul, Hōten for Mukden, Shōnantō for
  Singapore), Chinese in traditional characters, Korean in hangul. Notes are in
  English throughout. There is no language switch — every script a place answers
  to is shown at once, which is what a reader of a bilingual source needs.
* **Cities, Events, Administrative, Other** — the buttons along the top put
  cities, events, administrative boundaries and the other names on the map.
  Hold **Other** for the five kinds of name separately. With Administrative on,
  holding `Ctrl` shows every boundary the map has at once, and `Cmd`-click
  (`Ctrl`-click on Windows) pins an outline so it survives panning and zooming.
* **Layers** — everything else: the projection (Mercator, or an equal-area
  Albers or Lambert azimuthal), shaded relief, the graticule, the rivers, the
  1942 line of control and the occupation layers, the resistance base areas,
  the two sets of Chinese provincial boundaries (the ENP sheet, or the finer
  1936 AMS tracing), the railways and their stations, the air routes, and the
  population maps. Each layer has a note saying what it is and where it came
  from.
* **The key is a set of switches.** Hold the year at the top of the key and
  every row grows a tick box, so the colonies, or Kwantung alone, can be taken
  off the map.
* **Sharing a view.** The address bar rewrites itself as you pan, zoom and
  switch things on — `?bbox=120.9,24.5,122.3,25.68&layers=3j` — so copying it
  hands someone else the same ground and the same layers. The box is the ground
  that was on screen, and it is *contained* rather than matched: whoever opens
  the link sees at least what you saw, plus whatever margin their screen shape
  adds. `layers` is one base-36 number holding the year and every switch.
* **On a phone** the detail sheet opens as the name alone, with a `More` button
  for the rest, so the map is not buried under the answer.
* **The rivers** are drawn in the course they had at the date shown. On the Late
  1942 map the Yellow River runs south-east into the Huai, where it went after
  the Chinese army cut the dikes at Huayuankou in June 1938 and where it stayed
  until 1947.
* **The dashed perimeter** on the Dec 1942 map is the extent of Japanese
  control and the fighting front *at that date*, traced from the "War in the
  Pacific" map in Andrew Gordon, *A Modern History of Japan*, whose own legend
  calls it a greatest extent. It is labelled here for its date instead, because
  December 1942 is not a maximum: the naval perimeter was widest in July and
  August, the area of China under Japanese control was largest in 1944, and
  Kwangchowwan, the northern Malay states and direct rule in Indochina all came
  later. It is a front and a naval limit, not a boundary. Across China it is
  taken straight off the inland edge of the shaded occupied zone, so the two
  coincide: the line marks where Japanese forces were, and it has no business
  floating west of the shading that says the same thing. Out at sea it marks
  how far the navy reached rather than territory held.

* **Railways** — Taiwan, Korea, Karafuto, Manchuria, Japan and Burma, each
  from its own source, with the sugar company lines of Taiwan in 1929 under
  the government railway. Zoom in to ground a railway crossed and a track
  button appears beside the map, offering the networks by name, with a station
  button beside it. Japan's 12,800 stations are a switch of their own. None of
  it is fetched until it is asked for, and the Sources page links to the GIS files
  behind what is drawn, thinned and unthinned.
* **Train Tools** — a timetable, on the map it ran on. Four are in: Taiwan from
  the February 1936 working timetable (346 trains), Korea from a pocket
  timetable of early 1938 (1,668), Karafuto from the timetable of 15 April 1935
  (86), and Manchuria from the 滿洲・支那汽車時間表 of July 1942 (1,793), with
  the Korean and Japanese lines the same booklet prints behind a connections
  switch. The network is drawn in the colours the timetable gives its lines,
  and a strip at the foot of the map runs the day: press play and the trains
  move at two to twenty minutes a second. Tap a station for the trains that
  called there, a moving train for what it is and where it is going, or the
  track for the line and a day's working on it. Each links to its own printed
  table. One system runs at a time, and neither the interface nor its data is
  fetched until the first time it is wanted.
* **Air routes** — 110 routes, most of them read from the operators' own
  timetables, the sources named in the layer's note: Japan Airways, Manchuria Aviation, China Airways, CNAC, KNILM, Imperial Airways,
  Air France and others, fifteen on the 1930 map and the rest on 1942. The
  plane tools fly the timetable on a forty-eight-hour clock, so that a
  lay-over reads as a lay-over. `data/air/README.md` records every place the
  drawn timetable says something the printed one does not.
* **Demography** — population density for Korea, Taiwan, Japan and Manchukuo,
  shaded in five classes with the figure written on each unit; citizenship and
  occupation for Korea; and the 1931 census of Burma by ethnic group on each
  district's card. Every table offers **Download CSV**, and the file carries
  the table's notes and its source.
* **Thematic layers** — a book button beside the map opens a theme drawn over
  the districts. There is one so far: the administration map of Burma from the
  1931 census report.

Pan by dragging, zoom with the wheel, a pinch, the buttons, or `+` / `-`.
`Esc` closes the detail card, and returns to the opening view if none is open.
Single keys switch the common layers — `c` cities, `a` administrative, `e`
events, `o` other names, `t` topography, `r` railways, `f` air routes, `g` the
graticule, `0` and `2` the two dates — and `?` opens the help, which lists the
rest.

### Your own marks on the map

**Create**, at the top of the screen or under **Layers**, gives a reader five
tools of their own — point, arrow, line, area and text box — each mark with a
name, a short note for the hover, a description and a style. **Save file** writes
them to a GeoJSON file, styled with
[simplestyle-spec](https://github.com/mapbox/simplestyle-spec) so that QGIS,
geojson.io and GitHub's own preview all draw them as intended. **Load
annotations** reads such a file back — or any other GeoJSON, including this
project's own caches and anything exported from QGIS — draws it, and moves the
map to it; you can then keep adding and save again, and the new file carries
the old name with a timestamp.

**Copy link** puts the whole set into the address itself, deflated and
base64'd, for anything small enough to fit: a dozen annotations come to a few
hundred characters, and the reader is told the number and asked to send the
file instead when it will not. A link opens with the marks locked, so a stray
press cannot move them, and a pencil button unlocks the tools. **Set default
view** saves the frame a set should be looked at from, and **Add file…** merges
another set into this one.

Marks can carry a start and an end date. Once two dates are in play a small
clock appears beside the zoom buttons and steps, or plays, through the dates
at which something changes, over a map that stays where the reader put it.

Lines are measured in kilometres and areas in square kilometres, on the sphere
rather than on the flat, so an area in Hokkaido and the same area on the
equator read alike. A mark can be dragged, a shape reshaped by its corners,
and `Ctrl`/`⌘ Z` undoes. A point dropped on a country takes that country's name
without your typing it. Work is kept in the browser between visits and offered
back when you return.

The tools live in `annotate.js`, shipped as `deploy/lean/annotate.js` and
fetched only when one of the two buttons is pressed: a reader who never draws
never downloads it. The help dialog on the map (`?`) describes the tools in
full.

None of it goes anywhere. The file is written by the browser and read back by
it, which is the point for a class: a student can annotate a map, hand the file
to somebody else, and that person opens it with no account and no service that
might be gone next year.

## Running it

The site is the `deploy/` folder — everything a web server needs and nothing
else; the rest of the repository is how it is made. Any static web server
will do, started from the repository root so the tools and tests find it:

```sh
python3 -m http.server 8123
# then open http://localhost:8123/deploy/
```

Opening `index.html` straight off the disk will not work, because browsers
refuse to let a `file://` page read the neighbouring SVG. For that case there is
a single-file build with everything inlined:

```sh
python3 tools/bundle.py     # writes stale/japan-empire-map-standalone.html
```

That file opens by double-clicking and can be emailed or copied to a memory
stick. Rebuild it after any change to the site.

### Changing the words

Every word the map shows — names, dates, notes, legend labels, layer notes, the
About, Help and Sources pages — lives in `texts/` as CSV and Markdown. Edit
there and run:

```sh
python3 tools/build_texts.py          # every ordinary build: stamp the date only
python3 tools/build_texts.py --bump   # the release step: one update number, once, before a push
```

It writes `deploy/data.js`, the dialogs in `deploy/index.html`,
`deploy/sources.html`, `docs/SOURCES.md` and the comment-stripped copies of the
hand-written scripts in `deploy/lean/`. It also refuses to build on the faults
that have cost time before: a duplicated key in any table, a file the site can
fetch that `docs/UPLOAD.md` does not name, an air timetable that runs
backwards, a top-level function declared twice in one script.

`texts/README.md` says how that folder is arranged and what each column holds,
and `texts/admin/serve.py` is a local editor for it. The figures on the
population cards are not in `texts/`: they are in `data/population/` and
composed into the card at build. Changing the *shapes* is a separate job and a
separate script — `tools/build_map.py` — and neither needs the other to run.

The map is **version 1** and stays so; `texts/version.csv` holds the update
number, shown to the reader as *Version 1 update 373*. `CLAUDE.md` has the
rule, and the other working notes a contributor needs before touching
`map.js`.

### Testing

The tests drive the built site in headless Chrome. The runner starts its own
static server, runs eight scripts at a time, and picks what to run from what
git says has changed:

```sh
node tools/test/all.js smoke           # 26 scripts, about half a minute: before any push
node tools/test/all.js changed --dry   # what it would run for the current diff, and why
node tools/test/all.js changed
node tools/test/all.js                 # all 72 scripts, about four minutes: before a release
```

Each run is appended to `tools/test/runs.jsonl`, and each run prints what the
last run of the same set cost before it starts. A script fails on any uncaught
page error, and waits on the map's own idle signal (`calm(page)` in
`tools/test/settle.js`) rather than on a number of seconds.

## Files

**The site.** `deploy/` is everything a web server needs. `docs/UPLOAD.md`
lists every file in it with its size and what makes a browser ask for it.

| | |
|---|---|
| `deploy/index.html`, `deploy/styles.css` | the page; its About, Help and layer notes are spliced in from `texts/` |
| `deploy/lean/` | the comment-stripped copies of the five hand-written scripts, which is what the page loads |
| `deploy/data.js` | the map's settings, and the teaching content folded in from `texts/` — the part below the banner is generated |
| `deploy/cities-gaz.js` | the gazetteer behind the browse layer, from `data/cities-1930.csv` and `data/cities-1942.csv` |
| `deploy/japan-empire-map.svg` | generated base map — atoms only, no names or colours |
| `deploy/japan-empire-map-admin.svg`, `-fine.svg`, `-roc.svg`, `-korea.svg`, `-tw-sugar.svg` | the administrative divisions, the fine coastlines, the alternative Chinese provinces, Korea's provinces at survey resolution and Taiwan's sugar railways, each fetched only when asked for |
| `deploy/tw-`, `kr-`, `kf-`, `mn-trains.js`, `-times.js`, `-stations.js` | one railway each: the network the train tools draw, its timetable as a second file, and its stations |
| `deploy/jp-rails.js`, `deploy/jp-stations.js` | Japan's railways and their 12,800 stations |
| `deploy/themes.js` | the thematic layers |
| `deploy/relief.js`, `deploy/relief/` | shaded relief: nine WebP sheets, three zoom bands in each of three projections |
| `deploy/timetable/` | the printed tables as published, one page per timetable, linked from the cards |
| `deploy/gis/`, `deploy/gis/source/` | the downloads linked from Sources: what the map draws, and the unthinned files the build reads |
| `deploy/sources.html` | the Sources page, generated from `texts/pages/sources.md` |

**The sources of the site.**

| | |
|---|---|
| `map.js` | the application: one file, banner-sectioned |
| `annotate.js` | the drawing tools |
| `trains.js` | the train tools: the timetable interface |
| `air-play.js` | the plane tools: the air timetable, flown |
| `admin.js` | a panel of tools for working on the map, fetched only when Layers is option-clicked; no reader ever loads it |
| `texts/` | **every word the map shows**, as CSV and Markdown: territories per epoch, sub-units, sites, city names, layer notes, levels, and the About, Help and Sources pages |
| `data/` | what was counted and transcribed: `population/`, `air/`, the four timetable transcriptions, the traced sheets for Burma, Indochina, the Indies, Karafuto and Manchuria, and the city files. Several folders carry their own README |
| `occupation-maps/` | the period maps the occupied zone and the client states were traced from |

**The tools.**

| | |
|---|---|
| `tools/build_map.py` | regenerates the base map and its sister sheets from the source data |
| `tools/build_texts.py` | folds `texts/` and `data/population/` into the site, writes `deploy/lean/`, stamps the version, and runs the build's checks |
| `tools/build_burma.py`, `build_indochina.py`, `build_dei.py`, `build_korea_provinces.py` | the traced administrative sheets, each dissolved exactly into the outline `build_map.py` reads |
| `tools/build_tw_trains.py`, `build_kr_trains.py`, `build_kf_trains.py`, `build_mn_trains.py` | a timetable each, into its three files and its printed-table page; what they share is in `tools/trains_lib.py` |
| `tools/build_*_stations.py`, `build_jp_rails.py`, `build_tw_sugar.py` | the station layers, Japan's railways, Taiwan's sugar lines |
| `tools/build_themes.py`, `build_relief.py`, `build_cities.py`, `build_gis_sources.py` | the thematic layers, the relief sheets, the gazetteer, the downloads |
| `tools/texts_lib.py`, `tools/md.py`, `tools/shapefile.py`, `tools/gpkg.py` | stdlib-only readers: the CSV and Markdown of `texts/`, shapefiles, GeoPackages |
| `tools/apply_card_changes.py` | applies a JSON batch of card-text changes to the shared files in `texts/`, by key, so that several editors cannot overwrite one another |
| `tools/test/` | the test scripts, their harness (`suite.js`, `settle.js`) and the runner (`all.js`) |
| `tools/stats.js`, `tools/compare_perf.js` | what the map costs, measured the same way every time into `stats/`; and two builds timed side by side |
| `tools/export_india.py` | British India as one polygon, both ways, into `deploy/gis/`: the 1931 outline alone, and the 1930 territory with Burma and the Andamans |
| `tools/check_deploy.py` | fetches a deployed copy and checks every file against the key it was asked for |
| `tools/bundle.py` | builds the single-file version into `stale/` |

**The record.**

| | |
|---|---|
| `docs/tasks.md` | what has been changed and what was measured, entry by entry, and what is still open |
| `docs/SOURCES.md` | the Sources page as a plain file — generated |
| `docs/UPLOAD.md`, `docs/DEPLOY.md` | what to upload, and how |
| `reports/` | dated reviews and audits, from August 2026 on: the latest are the code review of 15 September and the card audits of 16 September |
| `CHECK.md` | what the author has checked against the originals, and what is still to check |
| `CLAUDE.md` | working notes for anyone, or anything, editing the project |

Adding a city or a battlefield needs nothing but a row in `texts/sites/sites.csv`
with its longitude and latitude, a `## id` section in `sites.md` for the note,
and a run of `tools/build_texts.py`; markers are projected at run time, so the
SVG never has to be touched. Changing the *shape* of the map, or adding a region
a new epoch needs, means editing and re-running `tools/build_map.py`.

The SVG holds **atoms** — the smallest regions any epoch needs — and the
territory files in `texts/` compose them into territories separately for each
date. Manchuria is three
Chinese provinces in 1930 and part of Manchukuo in 1942 without the file
carrying the geometry twice. Atoms that share a territory are painted fill and
stroke in the same colour, so no boundary shows between them: British India has
no line at the Punjab, French Indochina none at the Mekong, Korea none at the
38th parallel.

## The base map

`deploy/japan-empire-map.svg` is generated by `tools/build_map.py` from
[Natural Earth](https://www.naturalearthdata.com/) 1:10m vector data (public
domain) for the world, and the ENP-China project's Chinese provincial
boundaries for 1928–45 (CC BY 4.0) for everything inside China. It projects to
Mercator on a frame running 66°E–206°E and 13°S–55°N — British India to Pearl
Harbor — sorts units into historical regions, dissolves their internal
boundaries, clips, simplifies, and writes one path per atom. Source data is
cached in `tools/cache/`; pass `--download` to refresh the Natural Earth part.
The two equal-area projections offered in Layers are made in the browser from
the same sheet.

Geometry is not simplified beyond what each source's band allows, and a
hand-clipped or traced edge is kept at its own tolerance (`TRACED_TOL`); a new
layer reports what fraction of its vertices survive the build.

Inside China the boundaries are the **actual provinces of the Republican
period**, not modern ones reassembled: Jehol, Chahar, Suiyuan, Liaoning, Jilin,
Heilongjiang, Xikang. Those carry the 1930 map. On the 1942 map the two client
states are drawn from their own period sheets instead of from provinces standing
in for them — Manchukuo from 滿洲國地圖 1935, published by the South Manchuria
Railway, as one outline and as its fourteen provinces; Mengchiang from a traced
boundary of its own. What is left of Chahar and Suiyuan outside that line is
Free China's, and the map draws it so.

Several countries are drawn from a traced sheet of their own rather than from
modern outlines, each built by its own script and dissolved exactly into the
country's shape: French Indochina, 95 units in five protectorates, from the
1945 OSS map held at Stanford; Burma, 91 districts and states as of 1931; the
Netherlands Indies, 65 units with the residency boundaries of Robert Cribb's
*Historical Atlas of Indonesia*; and colonial Korea's thirteen provinces from
the National Institute of Korean History's historical districts. Siam and the
Philippines are thinned as coverages, so neighbours keep one shared border.
`docs/SOURCES.md` has each source in full.

Island groups too small to see at the default zoom — the Ryukyus, the Kurils,
Micronesia, the Aleutians, the Andamans, Ogasawara — get a minimum-size disc so
they stay visible, and territories too small to hit — the Kwantung leasehold,
Hong Kong, Macao, Guam — get an invisible finger-sized target that shrinks back
inside them as you zoom in.

## A caution about borders

**[SOURCES.md](docs/SOURCES.md) says how good each boundary is.** Karafuto is exact,
being a parallel. Manchukuo and Mengchiang are traced from period sheets;
Jehol and the Kwantung lease line are real historical boundaries. The area of
Japanese-controlled China is traced from a period map of the occupation rather
than drawn as whole provinces, which it once was — but it is still an
approximation and a generous one, and the map says so: control ran along the
railways and around the cities, and much of the countryside inside the line was
held by Communist and Nationalist guerrillas. Those base areas are a layer of
their own, for exactly that reason.

Everything else uses modern coastlines and outlines as a stand-in. The front
line moved constantly between 1931 and 1945, and any single date is a snapshot.
For close work, use a proper historical atlas.

## Credits

See **[SOURCES.md](docs/SOURCES.md)** for the full list of data sources, licences,
and the reading behind the place list and the notes.

Built with Anthropic's Claude, with Konrad Lawson at the prompt.

## Putting it on a server

Upload the `deploy/` folder; nothing outside it is used at run time. See
**[DEPLOY.md](docs/DEPLOY.md)** for what is in it, a sparse shallow checkout
that pulls the folder alone and can be updated with one `git pull`, and the
`.htaccess` inside it that makes Apache compress the lot. GitHub Pages
publishes the same folder through `.github/workflows/pages.yml`.

## Licence

The work done here — the code, the texts and the georeferencing — is public
domain under CC0. No copyright is claimed over any of the map sources, which
keep their own terms; attribution for the georeferencing is asked for but not
required. See [LICENSE.md](LICENSE.md), and `docs/SOURCES.md` for every source with
its licence.
