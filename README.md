# interactive-japan-map

An interactive map of the Japanese Empire for students, and a companion to the
interactive map of modern China used in the same module. It covers
the geography that recurs in the history of modern Japan from Perry's arrival in
1853 to the surrender in 1945: the home islands, the formal colonies, the
occupied territories and puppet states, the neighbouring countries, and the
cities, ports and battlefields tied to the events in the module timelines.

Plain HTML, CSS and JavaScript. No build step to use it, no dependencies, no
framework. Serve the folder over HTTP, or hand out the single-file build.

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
  and colonial Korea, the prefectures of Japan, the parts of French Indochina,
  the Malay states with their federated status, the islands of the Indies and
  the Philippines, and the island groups of the mandate.
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
* **Layers** — turn cities, battles or territories out of the quiz, put names on
  the map, switch on a browse layer of further cities for orientation, show the
  Yangzi and Yellow rivers, show or hide the 1942 line of control, and choose
  between the two sets of Chinese provincial boundaries (the ENP sheet, or the
  finer 1936 AMS tracing).
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

* **Train Tools** — a timetable, on the map it ran on. Tick it under **Layers →
  Transport** and zoom in to a railway that has one — Taiwan, from the
  February 1936 working timetable, or Korea, from a pocket timetable of early
  1938 — and the network is drawn in the colours the timetable gives its lines, with a strip at the foot of the map that
  runs the day: press play and 346 trains move at two to twenty minutes a
  second. Tap a station for the trains that called there, with their numbers,
  their lines and where they were going; tap a moving train for what it is and
  where it is going, or the track for the line and a day's working on it. Each
  links to its own printed table. Two buttons beside the zoom controls mark the
  stations on any railway that is drawn, and put the train tools away — the
  railway stays, in one plain colour. It appears when you are close enough for it to mean anything and
  is put away when you leave, and neither the interface nor its data is fetched
  until the first time that happens.

Pan by dragging, zoom with the wheel, a pinch, the buttons, or `+` / `-`; `0`
returns to the opening view and `Esc` closes the detail card.

### Your own marks on the map

**Layers → Annotations** gives a reader points, events, lines and areas of
their own, each with a name, a description and a colour. **Save file** writes
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
file instead when it will not. A link opens with the panel folded — the marks
are the point, the tools are one tap away.

Lines are measured in kilometres and areas in square kilometres, on the sphere
rather than on the flat, so an area in Hokkaido and the same area on the
equator read alike. A mark can be dragged, a shape reshaped by its corners,
and `Ctrl`/`⌘ Z` undoes. A point dropped on a country takes that country's name
without your typing it. Work is kept in the browser between visits and offered
back when you return.

The tools live in `annotate.js`, fetched only when one of the two buttons is
pressed: a reader who never draws never downloads it.

None of it goes anywhere. The file is written by the browser and read back by
it, which is the point for a class: a student can annotate a map, hand the file
to somebody else, and that person opens it with no account and no service that
might be gone next year.

## Running it

Any static web server will do:

```sh
python3 -m http.server
# then open http://localhost:8000/
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

Every word the map shows — names, dates, notes, legend labels, the About and
Sources pages — lives in `texts/` as CSV and Markdown. Edit there and run:

```sh
python3 tools/build_texts.py   # writes data.js, index.html's About, sources.html, docs/SOURCES.md
```

`texts/README.md` says how that folder is arranged and what each column holds.
The generated half of `data.js` is overwritten by that script, so nothing should
be edited in it directly. Changing the *shapes* is a separate job and a separate
script — `tools/build_map.py` — and neither needs the other to run.

## Files

| | |
|---|---|
| `index.html`, `styles.css`, `map.js` | the application |
| `texts/` | **every word the map shows**, as CSV and Markdown: territories per epoch, sub-units, sites, names, dates, notes, levels, and the About and Sources pages |
| `data.js` | the map's settings, and the teaching content folded in from `texts/` — the part below the banner is generated |
| `cities-gaz.js` | the gazetteer behind the browse layer |
| `japan-empire-map.svg` | generated base map — atoms only, no names or colours |
| `japan-empire-map-admin.svg` | the administrative divisions, fetched only when that layer is switched on |
| `japan-empire-map-fine.svg` | fine coastlines, fetched only on a deep zoom into the window that needs them |
| `japan-empire-map-roc.svg` | the alternative Chinese provinces, fetched only if chosen in Layers |
| `admin.js` | a panel of tools for working on the map, fetched only when Layers is option-clicked; no reader ever loads it |
| `sources.html` | the Sources page, linked from About — generated from `texts/pages/sources.md` |
| `docs/SOURCES.md` | the same page as a plain file: every data source, licence, and what was done to it — also generated |
| `docs/tasks.md` | what has been fixed and how, and what is still open |
| `tools/build_map.py` | regenerates the base map from the source data |
| `tools/build_texts.py` | folds `texts/` into `data.js`, `index.html`, `sources.html` and `docs/SOURCES.md` |
| `tools/texts_lib.py`, `tools/md.py` | the CSV/Markdown readers, and just enough Markdown for the two prose pages |
| `tools/shapefile.py` | a small stdlib-only shapefile reader used by the build |
| `tools/bundle.py` | builds the single-file version |
| `annotate.js` | the drawing tools, fetched on demand and inlined into the single-file build |
| `trains.js` | the Train Tools: the timetable interface, fetched only when a reader zooms in to a railway that has one |
| `tw-trains.js` | Taiwan's February 1936 timetable — 346 trains, their stops and the track between them — fetched with it |
| `timetable/taiwan-1936.html` | the eighteen printed tables, as published, linked from a station's card |
| `data/tw-1936-timetable/` | the transcription those two are built from, vendored so the build needs no network |
| `tools/build_tw_trains.py` | writes `tw-trains.js` and the timetable page from it |
| `kr-trains.js` | Korea's timetable of early 1938 — 1,666 trains over 74 lines, the Manchurian and Japanese connections and the ferries among them, their stops and the track between them — fetched with the tools over Korea |
| `timetable/korea-1938.html` | the 173 printed tables of the Korean, Manchurian and Japanese pages, linked from a station's card |
| `data/kr-1938-timetable/` | the transcription those two are built from, vendored from the Korea 1938 project |
| `tools/build_kr_trains.py` | writes `kr-trains.js` and the Korea timetable page from it |
| `tools/check_deploy.py` | fetches a deployed copy and checks every file against the key it was asked for |
| `tools/compare_perf.js` | pan-and-zoom timings for two builds side by side, for checking a new version against the live one before updating it |

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

`japan-empire-map.svg` is generated by `tools/build_map.py` from
[Natural Earth](https://www.naturalearthdata.com/) 1:10m vector data (public
domain) for the world, and the ENP-China project's Chinese provincial
boundaries for 1928–45 (CC BY 4.0) for everything inside China. It projects to
Mercator on a frame running 66°E–206°E and 13°S–55°N — British India to Pearl
Harbor — sorts units into historical regions, dissolves their internal
boundaries, clips, simplifies, and writes one path per atom. Source data is
cached in `tools/cache/`; pass `--download` to refresh the Natural Earth part.

Inside China the boundaries are the **actual provinces of the Republican
period**, not modern ones reassembled: Jehol, Chahar, Suiyuan, Liaoning, Jilin,
Heilongjiang, Xikang. Those carry the 1930 map. On the 1942 map the two client
states are drawn from their own period sheets instead of from provinces standing
in for them — Manchukuo from 滿洲國地圖 1935, published by the South Manchuria
Railway, as one outline and as its fourteen provinces; Mengchiang from a traced
boundary of its own. What is left of Chahar and Suiyuan outside that line is
Free China's, and the map draws it so.

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

It is eleven static files and about 6 MB. See **[DEPLOY.md](docs/DEPLOY.md)** for
the list, a sparse shallow checkout that pulls 8 MB instead of 420 and can be
updated with one `git pull`, and the one `.htaccess` worth adding.

## Licence

The work done here — the code, the texts and the georeferencing — is public
domain under CC0. No copyright is claimed over any of the map sources, which
keep their own terms; attribution for the georeferencing is asked for but not
required. See [LICENSE.md](LICENSE.md), and `docs/SOURCES.md` for every source with
its licence.
