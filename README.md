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
  Soviet, independent. In December 1942, at the greatest extent of the empire, they
  show how Japan held what it had taken: metropole, colonies, client states,
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
  many names the map shows. In 1942 that is 28, 71 and 115 items; in 1930, 21,
  42 and 71. Every territory stays clickable at every level, so you can always
  check something you can see.
* **English / 日本語 / 中文 / 한국어** — which name is shown. English gives the
  name as it was used at the time with the modern one in brackets — Mukden
  (Shenyang), Peking (Beijing), Taihoku (Taipei), Hsinking (Changchun), Batavia
  (Jakarta). Japanese gives the imperial-period form: Keijō for Seoul, Hōten for
  Mukden, Shōnantō for Singapore. Chinese is in traditional characters; Korean
  is in hangul with McCune-Reischauer romanisation. Notes stay in English
  throughout.
* **Layers** — turn cities, battles or territories out of the quiz, put names on
  the map, switch on a browse layer of about a hundred further cities for
  orientation, show the Yangzi and Yellow rivers, and show or hide the
  greatest-extent line.
* **The rivers** are drawn in the course they had at the date shown. On the Late
  1942 map the Yellow River runs south-east into the Huai, where it went after
  the Chinese army cut the dikes at Huayuankou in June 1938 and where it stayed
  until 1947.
* **The dashed perimeter** on the Dec 1942 map is the greatest extent of
  Japanese control, traced from the "War in the Pacific" map in Andrew Gordon,
  *A Modern History of Japan*. It is a front and a naval limit, not a boundary.
  Across China it is taken straight off the inland edge of the shaded occupied
  zone, so the two coincide: the line marks where Japanese forces were, and it
  has no business floating west of the shading that says the same thing. Out at
  sea it marks how far the navy reached rather than territory held.

Pan by dragging, zoom with the wheel, a pinch, the buttons, or `+` / `-`; `0`
returns to the opening view and `Esc` closes the detail card.

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
python3 tools/bundle.py     # writes japan-empire-map-standalone.html
```

That file opens by double-clicking and can be emailed or copied to a memory
stick. Rebuild it after any change to the site.

## Files

| | |
|---|---|
| `index.html`, `styles.css`, `map.js` | the application |
| `data.js` | all the teaching content: territories per epoch, sites, names, dates, notes, levels |
| `japan-empire-map.svg` | generated base map — atoms only, no names or colours |
| `SOURCES.md` | every data source, licence, and what was done to it |
| `tools/build_map.py` | regenerates the base map from the source data |
| `tools/shapefile.py` | a small stdlib-only shapefile reader used by the build |
| `tools/bundle.py` | builds the single-file version |

Adding a city or a battlefield needs nothing but a new entry in `data.js` with
its longitude and latitude; markers are projected at run time, so the SVG never
has to be touched. Changing the *shape* of the map, or adding a region a new
epoch needs, means editing and re-running `tools/build_map.py`.

The SVG holds **atoms** — the smallest regions any epoch needs — and `data.js`
composes them into territories separately for each date. Manchuria is three
Chinese provinces in 1930 and part of Manchukuo in 1942 without the file
carrying the geometry twice. Atoms that share a territory are painted fill and
stroke in the same colour, so no boundary shows between them: British India has
no line at the Punjab, French Indochina none at the Mekong, Korea none at the
38th parallel.

## The base map

`japan-empire-map.svg` is generated by `tools/build_map.py` from
[Natural Earth](https://www.naturalearthdata.com/) 1:50m vector data (public
domain) for the world, and the ENP-China project's Chinese provincial
boundaries for 1928–45 (CC BY 4.0) for everything inside China. It projects to
Mercator on a frame running 66°E–206°E and 13°S–55°N — British India to Pearl
Harbor — sorts units into historical regions, dissolves their internal
boundaries, clips, simplifies, and writes one path per atom. Source data is
cached in `tools/cache/`; pass `--download` to refresh the Natural Earth part.

Inside China the boundaries are the **actual provinces of the Republican
period**, not modern ones reassembled: Jehol, Chahar, Suiyuan, Liaoning, Jilin,
Heilongjiang, Xikang. So Manchukuo and Mengchiang have their historical
outlines rather than an approximation of them.

Island groups too small to see at the default zoom — the Ryukyus, the Kurils,
Micronesia, the Aleutians, the Andamans, Ogasawara — get a minimum-size disc so
they stay visible, and territories too small to hit — the Kwantung leasehold,
Hong Kong, Macao, Guam — get an invisible finger-sized target that shrinks back
inside them as you zoom in.

## A caution about borders

**[SOURCES.md](SOURCES.md) says how good each boundary is.** Karafuto is exact,
being a parallel. Manchukuo, Jehol, Mengchiang and the Kwantung lease line are
good — real historical boundaries. The area of Japanese-controlled China is
poor, and is labelled as such on the map: it is drawn as whole provinces,
whereas control there ran along the railways and around the cities, and much of
the countryside inside the line was never held.

Everything else uses modern coastlines and outlines as a stand-in. The front
line moved constantly between 1931 and 1945, and any single date is a snapshot.
For close work, use a proper historical atlas.

## Credits

See **[SOURCES.md](SOURCES.md)** for the full list of data sources, licences,
and the reading behind the place list and the notes.

Built with Anthropic's Claude, with Konrad Lawson at the prompt.
