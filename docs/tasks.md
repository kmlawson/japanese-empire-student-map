# Tasks

What is outstanding, and what has been done and how. Every fix gets a line here
describing what was actually changed, before it is marked done.

---

## Open — asked for and not yet done

Seven entries. The first four are work asked for and not yet done; the last
three are measured rather than assumed, and everything else that once stood
here has been closed. Where a fix was a generalisation rather than an answer,
the source that would settle it is named at the foot of this file.

- **The India–Burma frontier: 469 km² of genuine disagreement left.**
  Mostly fixed, and the first diagnosis was wrong. Along the Chin Hills and the Chittagong tracts the map
  shows a lens of sea between the two countries with pink wedges across it, and
  the hover outline runs in one place while a second, thinner line runs in
  another. Three findings, each measured.

  *The sources disagree a little.* Rasterised at 0.01° and asked for ground in
  neither country but within 8 km of both, `india-1931` and
  `burma-modern-modified` leave **469 km²** between them. That is two hands
  tracing one frontier, and it is small.

  *The cache was stale, and that was the whole of the 4,085 km².*
  `tools/cache/india-1931.geojson` held 13,058 outer vertices reaching to
  96.671 E, exported at 17:05 on 20 August; the gpkg holds 13,380 reaching to
  **97.135 E**, saved at 20:33 the same evening — India was extended eastward,
  along this very frontier, three and a half hours after the export the map was
  still reading. Re-exported, the drawn gap falls from **4,085 km² to 469**,
  which is the source disagreement exactly. The build was faithful all along;
  it was drawing an older India. The "54 vertices up to 73 km from the source"
  reported here first were the old tracing measured against the new one.

  *Why QGIS looks clean.* There the two layers overlap and whichever draws on
  top hides the disagreement. Here each is its own atom with no filler beneath
  — China's went for the same reason — so any ground neither covers shows the
  ocean through it. The wedges are where the two boundaries cross each other
  repeatedly: covered and uncovered slivers alternating.

  *The second line is deliberate.* `britishindia` carries `edge: #8f5f6e`,
  `edgeAtoms: burma`, `edgeClip: 92 20.6 97.4 28.4` — a hairline round Burma
  inside the Raj, because in 1930 they share a colour and Burma was a province
  of India until 1937. It is drawn from **Burma's** outline while the hover
  outline traces the silhouette of the union, which follows **India's** where
  the two differ. One frontier, two sources, two lines a few kilometres apart.
  Nothing is broken here; it is the same disagreement seen twice.

  What to do about it is a separate decision: cut one source to the other, as
  Burma was cut to India and China, or let one of them own the frontier.

- **Wire the occupied-zone v3 layer, then re-test what it makes redundant.**
  `japanese-occupied-territory-1941-2-v3` was to replace the occupied zone
  because it is clipped properly. Confirm the filename first: what is in
  `tools/cache/` is `japanese-occupied-territory-1941-2.geojson` and
  `-vs.geojson`, with no `-v3`. Once it is in, test whether **`clip-china`**
  (16,406 vertices, 233 KB) and **`clip-off-clients`** are still doing
  anything, and re-examine the split stroke (`.whole-edge`, `.coast`, 76 KB).
  Do not assume the clips can go — measure with them removed. They are a
  frame-rate item as well as a size one: with the land stroke off by default
  the clips now account for 12-14% of a frame.

- **Export French Indochina to `GIS/French Indochina/`**, beside `China/` and
  `Japan/`, following the Taiwan pattern — the layer and a `.md` note in a
  sub-folder of its own. The pieces: Tonkin, Annam and Cochinchina; Cambodia
  and Laos whole; and the provinces ceded to Thailand in 1941. The note must
  say that the three-way cut of Vietnam is an approximation of watershed
  boundaries rather than a traced administrative line, that Angkor is not
  carved out, and that the coastlines are present-day Natural Earth and not a
  period source.

- **Reword the contested frontier north of India.** It reads *Frontier not
  settled*; it should read **Border contested or not clearly defined.** The
  English string is in four places and all four have to move together, or the
  legend and the shape will disagree: `texts/categories.csv` lines 13 and 30
  (the `e1930` and `e1942` legend rows, which carry the string twice each — as
  the name and as the `orig`), and `texts/territories/1930.csv:64` and
  `texts/territories/1942.csv:70` (the `contested` row's name). `data.js` is
  generated from these by `tools/build_texts.py` and must not be edited by
  hand. The Japanese and Chinese renderings stay as they are unless asked —
  未確定国境 and 未定國界 already say the same thing more briefly, and the Korean
  미확정 국경 with them.

  Worth doing at the same time, since it is the same legend row: the swatch
  beside it is a solid square of #5c554a rather than a sample of the
  `hatch-unclear` diagonals actually drawn on the map, so the key does not look
  like the thing it is keying.

- **The Kwantung leasehold: measured, and left.** Sampled by rendered colour
  over the whole leasehold at a hundred-kilometre view, Manchuria's colour shows
  through at **three pixels, in two clusters**, at 121.43 E 39.44 N and
  121.38 E 39.44 N. That is the residue of the cut and the path rounding each
  moving a vertex a little, it is invisible at any view a reader will use, and
  closing it means rebuilding the cut to share vertices with its parent. Not
  worth what it would cost; recorded so nobody measures it again.

- **Okinawa needs a key of its own for the island, apart from the prefecture.**
  Found by the move to `texts/`, which refuses to let two rows share a key. Two
  different shapes carry `data-prov="Okinawa"` — the prefecture, drawn when
  Administrative is on, and the island of Okinawa Hontō in the fine coastline
  layer — and the sub-unit table is keyed by that one name. `data.js` held an
  entry for each: the island's read *Okinawa — Naha, and the battle of
  April–June 1945*, the prefecture's *Okinawa-ken*. The prefecture's came second
  in the file and silently replaced the island's, so the battle line was never
  once shown to anybody. Only the prefecture's row is kept for now, so nothing
  on the map has changed; the fix is a distinct `data-prov` for the fine island
  in `tools/build_map.py`, after which the battle can be named where a reader
  zooming in on Okinawa would look for it. What was lost is recorded in
  `texts/territories/sub-units/ryukyus.md`.

- **Kwangchowwan wants a period source for the lease boundary itself.** The
  carve is right now — see below, where the traced coastline replaced Natural
  Earth as the limit on it, and land drawn as sea fell from 2,761 sample points
  to 442. What is still a guess is the boundary of the lease on land. The
  leasehold's own file holds six separate pieces round the bay, and where those
  pieces end is where the map says the lease ended; a period map draws one line
  round the bay and its shores instead, and that is the thing to trace. This is
  no longer a fault in the drawing, only a limit on what is being drawn.

---

## Done

### A yellow rim round the Miaodao islands, and where the extra islands come from

The islands off Penglai are filled as taken and were being outlined in Free
China's yellow. The inland test asks whether the land three kilometres inside a
stretch of coast is occupied, which is the right question for a mainland shore
and the wrong one for an island a kilometre across: the point lands in the sea on
the far side, fails the test that it is inside the ring at all, and the island is
called unoccupied. The reach is a quarter of the ring's own size where that is
less now. In that view the yellow stretches fall from 7 to 3, the rims are gone,
and the coast counts elsewhere are unchanged — Shantung 0 and 1, Canton 0, Fukien
237 to 227.

**And the islands that appear on hover are two tracings of the same rocks.** Over
one view of the Miaodao group there are **41 island rings in the occupied zone's
own traced file and 15 in China's coastline**. The fill shows the first clipped to
the second, so most of the 41 are cut to nothing and never appear. The hover
outline draws *both* boundaries on purpose — the occupied rings cut to China's
land, and China's outline cut to the occupied zone — because at a coast the
visible edge belongs to China's geometry and without the second half the whole
shore would have no line on it. Where the two tracings disagree, and off Penglai
they disagree by a few hundred metres, both are drawn and the result reads as
islands appearing out of nowhere.

That is the third symptom out of one root: two shapes standing in for one, with a
clip holding them together. The build-time intersection would end all three at
once — see the note above on what it would cost.

### Option-click to isolate one shape, in the admin panel

A third tool beside the backings switch and the polygon drawer. Option-click any
shape on the map and everything else goes away, so that one polygon can be looked
at on its own — its coastline, its holes, the islands it does or does not carry.
Option-click another to move to it, option-click the sea to bring the map back, or
press Escape. The readout names what is being shown and counts it: option-clicking
Korea gives "path, for korea, .whole.hot, 38 rings, 3839 points, 55.1 KB — 127
elements hidden", which is also how you find out that with Administrative off it is
the filler you are looking at and not an atom.

Nothing is deleted and nothing is redrawn. The siblings of the shape, and of each
of its parents, are hidden and put back with the display they had; a sibling that
was already hidden is left alone and left out of the undo, so an atom this epoch
was not drawing stays undrawn when you finish. Checked by comparing the display of
every shape in `#land` and `#backings` before and after: identical.

It lives in `admin.js`, which `map.js` fetches only when someone option-clicks
Layers, so a reader never loads a line of it.

### The occupied zone's outline traced China's coastline, not its own edge

Hovering the occupied zone came up with far more islands than the shading has,
and a line of much finer detail than the shape it was supposed to be tracing —
down coasts whose land is Free China's yellow. Not a second dataset: the salmon
line along the occupied coast is China's *own* outline, the same rings already in
the file as the country's filler, at the same detail. The fault was where I had
put it. It was a child of `#a-occupiedzone`, and three sweeps walk an atom's own
paths: the hover outline, which stroked it and so traced China's coastline island
by island; the diagonal shading, which would have copied it; and the test for
whether an atom has geometry of its own. **897 subpaths in the outline where the
occupied zone has 752.**

It is a sibling of the atom now, taking its colour through `data-edge-for` the
way China's own coastal edge does — a promise about paint and nothing else — and
`clip-china` is back on the atom itself, where the outline machinery looks for
it. That second part matters as much as the first: with the clip moved to an
inner group the outline had stopped finding it, so it was no longer being cut to
China's land at all.

The outline is now the edge of the shape a reader can see: the occupied zone's
own rings, and China's coastline only where the occupation covers it. Checked at
twice the device pixels, the yellow on the waterline is unchanged by the move —
Shantung 0 with Administrative off and 1 with it on, the Canton delta 0, Fukien
237 — so the paint is exactly as it was and only the silhouette changed.

### The coast line cost nine per cent of a pan, and is now cheaper than before it existed

Panning the 1942 map had got slower, and the cause was the fix for the yellow
thread along the occupied coast. Benchmarked by CPU time over a fixed 90-step
drag at twice the device pixels, against the build of 17 Aug 10:19: **2,296 and
2,331 ms before, 2,496 and 2,570 ms after — ten to twelve per cent.** Taking the
new path out and leaving everything else brought it back to 2,276. Every other
suspect was measured and cleared: the enlarged clip round the client states cost
about 49 ms, `#lease-sea` about 10, and the mandate's Guam clip nothing readable.

**It was the geometry, not the stroke.** Letting the line's stroke scale with the
zoom — the thing that usually costs — changed nothing at all (2,519 against
2,524). What cost was 2,975 points of stroked path re-rasterised on every frame,
laid on top of a coastline that was already being stroked underneath it. Nor
could it be thinned: the salmon has to sit within about half a pixel of the
yellow to cover it, and at that tolerance 99.1% of the points survive, because
China's outline is already at its own.

**So the line is divided rather than duplicated.** China's filler no longer
strokes itself; its outline is stroked by two paths instead — yellow where the
occupation does not reach the coast, salmon where it does. The number of stroked
points on the map is what it always was. Measured: **2,336 ms before the whole
business began, 2,118 and 2,162 now**, so the 1942 map pans about eight per cent
*faster* than it did before any of this.

**And the test for "reaches" was wrong as well.** It allowed eleven kilometres of
slack, because the traced edge often stops short of the shore — and that painted
the occupation's colour on coast it never held, 61 points of it on the unheld
Fukien shore and more on Leizhou. It asks the land three kilometres inland now,
along the ring's own normal: where that is not occupied, the strip between the
traced edge and the sea is Free China's and its coast ought to be yellow.

Near-pure yellow on the occupied waterline, counted in the rendered image against
the build from before any of this work: **Shantung 73 → 0 with Administrative off
and 124 → 1 with it on; the Canton delta 0 → 0; the Fukien coast 782 → 261**,
the remainder there being places where yellow coast legitimately abuts the
occupied enclaves at Amoy and Swatow.

**A correction.** Yesterday I reported the Canton delta as 37 → 22 yellow pixels.
Re-run twice, that figure does not reproduce: the coast path was byte-identical
in every commit since, so the map had not changed and the measurement had. The
pre-work build measures 0 there, and so does the map now.

### Sikkim out of British India's outline

Hovering British India drew a black line that ran up the Nepal–Sikkim border,
along the crest with Tibet and back down to Bhutan: it enclosed Sikkim, a state
the Chogyal ruled under British protection and which this map draws as its own
territory. Two sources put it there. Natural Earth's India is the modern one, so
its country ring takes Sikkim in — and that ring is India's **backing**, which is
what draws India when Administrative is off. And geoBoundaries' Sikkim is one of
India's ADM1 states, so with Administrative on it came in a second time, as an
Indian province with no name.

The province is simply not drawn now — Sikkim was never part of British India —
and the salient is cut out of the country ring. No boolean geometry was needed,
because the salient is separable: **above 27.05 N and between 87.95 and 89.0 E,
everything Natural Earth calls India is Sikkim** — Nepal west, Tibet north,
Bhutan east, and Darjeeling, which is India's, below the box. Measured on the
source ring: of its **6,761 points exactly 106 fall in that box, in one unbroken
run**, entering at 87.99 E 27.08 N and leaving at 88.84 E 27.08 N, which are the
two trijunctions. That run is replaced by the arc of Sikkim's own ring between the
same two ends — its southern side — so the two shapes share that border exactly
and no crack can open along it. A straight chord would have been easier and would
have left India's line a few kilometres off the border it stands for.

Checked: Gangtok and three other points in Sikkim are inside Sikkim and outside
India, in the fill and in the provinces both; Darjeeling, Kalimpong and Siliguri
are still India's; and of nineteen samples taken a kilometre south of Sikkim's
border along its whole length, none falls on ground that nothing covers.

### The central Solomons, researched island by island

A sub-agent was sent to establish the December 1942 status of the 55 named
islands inside a traced polygon over the Russells, Savo, Tulagi and the Florida
group, against the US Army and Marine Corps official histories, Morison, the
Solomon Islands Encyclopaedia, Bishop Baddeley's contemporary 1942 mission
report and the coastwatcher literature. Three findings mattered.

**Alite confirmed, and the reason it was wrong confirmed with it.** Malaita was
never occupied: the Resident Commissioner moved the protectorate headquarters to
Auki on Malaita on 11 February 1942 and the administration ran there
continuously. A Japanese party landed in July 1942, looted the mission hospital
at Fauabu and kept a post on the north coast until November, and that was all.
Alite, a few kilometres from Auki, was never held. Already corrected above.

**Tulagi and Florida were one atom under Tulagi's name, and they answer
differently.** The build has always called that atom "Tulagi and the Floridas";
the record was called "Tulagi, Gavutu and Tanambogo" and dated "Taken by the
Americans 8–9 August 1942". True of Tulagi, false of Florida. Tulagi was the
Japanese garrison here — seized 3 May 1942, assaulted on 7 August, secured the
following afternoon, with Gavutu and Tanambogo across the harbour taken in the
same two days and almost the whole garrison of some three hundred and fifty
killed; about forty swam to Florida. Florida itself was never Japanese-held: the
landings at Haleta and Halavo on 7 August were unopposed covering parties for the
assault on Tulagi and were withdrawn the same day. The record is "Tulagi and the
Florida Islands" now and the note says which is which.

**The Russells and Savo had no garrison of either side.** The colour is right —
British protectorate, not taken — but the one colour cannot say that nobody was
there. The Russells were a Japanese barge staging point during the Guadalcanal
campaign and had no garrison until **28 January 1943**, when six destroyers put
**328 men** ashore to cover the evacuation of Guadalcanal; they were gone by
11 February and the American landing on 21 February was unopposed. Savo, off
which the cruiser action of 9 August 1942 was fought, was visited by Japanese
boats and patrolled by American raiders on 4 September, and held by neither. Both
are now said in the note, and the record, which had held only the eastern chain
and the Santa Cruz group, is renamed for the central islands it also carries.

No change on Savo's, Mborokua's or the Sandfly Passage islets' colours: the
evidence supports leaving them as they are.

### Sikkim's protectorate, and Alite Island out of the Japanese half of the Solomons

**Sikkim: 1890 was the recognition, not the start.** The card said "British
protectorate from 1890", which is the Anglo-Chinese Convention of Calcutta of
17 March 1890 — the date China recognised the protectorate and the Sikkim–Tibet
boundary was defined. British protection began with the Treaty of Tumlong in
1861, after a punitive expedition, which put Sikkim's external relations in
British hands. Both maps now read "British protectorate from 1861, recognised by
China 1890", and the note says which instrument did what.

**Alite Island was drawn as Japanese-occupied, in the Western Solomons.** It is
in Langalanga Lagoon, a couple of kilometres off the west coast of Malaita, which
was raided but never held and keeps the British colour outright. The fault was in
how a satellite islet is given to an island: the fine layer asked which atom's
nearest *vertex* was closest, and these rings are simplified, so **Alite measured
17.6 km to Malaita's nearest vertex and 100.8 km to the Western Solomons' — and
the test looked only at the two bulk atoms, so it went to the Japanese half of
the archipelago.**

Measured by distance to the nearest *edge* instead, which is what "which island
is this off" actually means: **Alite 2.7 km to Malaita against 43.6 to anything
else; Tulagi 1.0 km and Tanambogo 2.4 to Tulagi's own atom; Nggela Sule 0.8;
Pavuvu 2.5 to the Allied group against 62.2; and Savo 0.5 km to the Allied group
against 15.8 to Guadalcanal**, which is the case the old rule was written to
avoid and which the edge test gets right anyway. So all five Solomon atoms can be
in the running now instead of two. The re-assignment moves 65 islands: Malaita
gains its own lagoon and barrier islands (Alite, Manaoba, Maramasike, Fanalei,
Auslaga, Hokawai and the rest — 4 to 40), Tulagi gains the Florida/Nggela group
and the Sandfly Passage islets (5 to 25), Guadalcanal gains the fringing islands
of Marau Sound (3 to 17), and Savo stays Allied where it belongs.

### Water traced round Kwantung and Kwangchowwan

**A traced leasehold over an untraced country shows the country's coastline, not
its own.** Both leaseholds come from hand tracings; what lies under them is
Natural Earth's outline of China, which at this scale is a different coastline
altogether. Round Kwangchowwan that outline treats the arms of Guangzhou Bay as
land, so yellow China showed in the channels *between* the leasehold's six
pieces — the map read as a blue shape with yellow cracks through it. Round the
Liaodong tip it runs a little outside the traced leasehold along the whole shore
and showed as a rim. Counted on the 1930 map by sampling at a hundredth of a
degree: **175 points of Manchuria's filler inside the Kwantung outline, 233 of
China's inside the Kwangchowwan one**, and every one of them from a `backings`
path rather than from an atom.

Two rings, traced by hand, say where the water is. Everything inside them that
the leasehold does not cover is painted as water — the same instrument as the
Weihaiwei fringe and the Guangzhou Bay hull already in the build, and for the
same reason — with the leasehold's own rings in the path as even-odd holes so
that nothing can paint over them whatever the drawing order. A path of its own
rather than an addition to `#gzw-bay`: the two carves overlap, and two of them
sharing one even-odd path cancel each other where they cross.

**Checked by rendered colour, not by hit-testing.** The overlay takes no pointer
events, so `elementFromPoint` reports what is underneath and answered 175 and
233 both before and after — the same trap the occupied coast set earlier in the
day. Screenshot, project the traced ring into screen pixels, count inside it:
**655 yellow pixels → 0 at Kwantung, 1,177 → 0 at Kwangchowwan.** The leaseholds
themselves are untouched, both keep all their rings, and the Chinese mainland
outside the rings is unbroken.

## Fine coastlines in the central Pacific, and four things measured on the coast

**The Ellice, the Phoenix group, Tokelau and the rest have coastlines now.** The
bulk Pacific extract stops at 176.85 E, the eastern edge of the Gilberts, so
everything east and south of that had one Natural Earth ring apiece and nothing
finer. Seven windows out of the 876,182-linestring split-coastlines shapefile
give **411 closed rings**, 130 of them above the five-hectare floor, and an
Overpass query gives the islet names: Fongafale and Funafala on Funafuti,
Nikumaroro, Rawaki, Enderbury and McKean in the Phoenix group, Atafu's motu,
Pukapuka and Nassau. Drawn: 92 rings across `ellice` 30, `linephoenix` 19,
`nzpacific` 40, `uspacific` 3. **Vertex retention: 583 of the 16,233 that clear
the floor, 3.6%** — against 14.9% for the South China Sea extract through the
same pipeline, because `FINE_TOL_DEG` is 0.002° and these atolls are surveyed at
about ten metres; what is dropped is a fifth of a pixel at the deepest zoom the
map allows. Rotuma came out of the same windows and is left out: it is Fijian and
Fiji is not on this map. The extractor writes polygons and the fine-coastline
loader reads lines, which is what `--as-lines` is for; the first build drew
nothing at all and said so only by the atoms missing from its own tally.

**The yellow thread along the occupied coast was the backing's stroke.** Every
shape here is painted fill *and* stroke in its own colour, 1.3 pixels that do not
scale, which is what closes the hairline between neighbours drawn from different
files; at a coast it fattens the shore seaward by half of that. The occupation is
the one shape drawn through a clip, so its own stroke stops at the waterline
while China's does not — Free China's yellow, from the backing with
Administrative off and from the province paths with it on. Measured by rendered
colour, not by hit-testing, which cannot see it: **235 near-pure yellow pixels on
the waterline of one Shantung view, 173 on another**. Two attempts failed and are
worth recording. A clip cannot help because it is the clip that cuts the stroke;
growing it cannot either, because the overhang is a screen pixel and so four
times wider in map units at the widest view than at the deepest. A mask of the
same path filled and stroked white was right at the widest view and leaked again
at the deepest. What works is `occupied_coast()`: the stretches of China's own
outline that the occupation reaches, found by point-in-ring with a grid index and
an eleven-kilometre reach, drawn again unclipped in the occupation's colour — two
strokes of the same width on the same line, the salmon one second. **96
stretches, 2,992 points of China's 6,248-point outline. Near-pure yellow on the
waterline: 235 → 0 in Shantung, 173 → 5 deep, 37 → 22 at Canton.**

**The occupation was painted over Manchukuo, and only with Administrative off.**
The traced occupied file reaches over the Wall into Jehol, which Manchukuo took
in 1933: **101 cells of a quarter-degree grid lie inside both**, over
115.75–119.75 E and 40.25–41.75 N. With the layer on, Manchukuo's fourteen
provinces are drawn late enough to cover the shading; with it off there are no
provinces and the occupation's lighter salmon showed inside the client state's own
outline, which is exactly what "the right outline with the wrong red inside it"
was. Manchukuo's rings join Mengchiang's in the even-odd hole that the shading is
clipped against — `clip-off-mengjiang` is `clip-off-clients` now.

**Every southern enclave was outside the line of control.** Asked of the extent
path itself: **Canton, Fatshan, Kongmoon, Amoy, Kinmen, Swatow, Chaochow and
Chaoyang were all outside** a line drawn to enclose them, because
`enclave_detour` took the *seaward* arc round each block. All along that coast the
perimeter has Free China landward and the sea, which the navy had, seaward, so an
enclave is enclosed by passing inland of it. The arc is chosen by how much of it
is over land now, sampled at seven points rather than at its middle. And where one
traced ring is the whole block — the Canton delta is 99.5% of its own — the detour
follows that ring's boundary offset nine kilometres instead of a hull, which had
taken in a wide crescent of Free China to the west and north. Hong Kong is folded
in as well, being occupied and not part of the trace. **Macao is cut out**: its own
ring, wound against the perimeter, is a hole, so the dashed line draws a small loop
round the neutral enclave. All fourteen occupied places inside, Macao outside,
Foochow and Wenchow outside, Tungan outside because the trace does not claim it.

**The Kwantung Leased Territory is traced.** 20 rings, 425 vertices, **every one
of them drawn** — it is in `FULL_DETAIL`, so nothing is thinned. It replaces
Liaoning clipped by a half-plane and a bounding box: convex-only clipping gave
the leasehold Liaoning's coast with corners taken off it, and Manchuria's filler
showed through each one. The Natural Earth island scoop that used to patch that
is kept only for a build without the traced file, which carries its own nineteen
islands.

**Two more, from the same batch.** The Japanese mandate's hover wash covered the
box round Guam, which is the one thing inside that boundary the mandate did not
include; the wash is clipped to the frame with the box punched out of it, and the
dashed boundary, being a separate copy in `#mandate-lift`, is untouched. And six
records were saying the same thing twice on two lines — the Ellice reading
"British colony; American bases from October 1942" above "Never occupied;
American base from October 1942", and the same fault on the 1930 Gilberts,
Tokelau, the Turtle Islands, the Paracels and Papua–New Guinea. Found by
comparing the two fields word by word rather than by reading them.

**Fine coastlines stay loaded until another window wants the room.** They used to
be dropped the moment the view went wider than `FINE_W`, so zooming out and back
in fetched and grafted the same shapes again. Now the drop pass runs only when
something new is wanted: zoom into the Spratlys and their 29 islands stay drawn
however far out you go, until a zoom into Truk replaces them with the mandate's
559. What does still depend on the zoom is whether a fine window *supersedes* the
coarse shape under it — at the wide view a fine island is a sub-pixel speck and
the ring the base map draws round an islet is what a reader needs, so
`liveFineBoxes()` answers with nothing above the threshold and `reprune()` puts
the coarse shapes back. Measured through the wheel, which moves the app's own
view state and not just the viewBox: Spratlys 29 live / 1 superseded deep, 29
live / 0 superseded zoomed out, then 559 nanyo / 51 superseded at Truk.

## Every word in texts/, and the site built from it

**Three copies of the same facts, kept by hand.** The teaching content — 62 and
66 territories, 78 sites, 170 browse cities, 485 sub-units, 29 per-epoch
overrides, 27 legend rows, two epoch blurbs — lived in `data.js` as 2,466 lines
of JavaScript object literals, with about 180 lines of comment threaded through
it explaining why each record read the way it did. The sources list was written
out twice more, once as `sources.html` and once as `SOURCES.md`, and the two had
drifted apart: the page had the AMS 1:250,000 alternative, the princely-states
gazetteer, the Communist base areas and the New Guinea corrections; the Markdown
file had the confidence table, the cache paths, the reading list and the software
note. Neither was a subset of the other.

**All of it is now in `texts/`**, as 39 CSV files and 35 Markdown files, and
`tools/build_texts.py` folds them into the four places the browser reads:
the generated half of `data.js`, the About dialog inside `index.html`,
`sources.html`, and `SOURCES.md`. `data.js` keeps a hand-written head — the home
view, the date the map opens on, and the Yellow River's 1938 flood course, none
of which are words — and everything below the banner is replaced wholesale.

**CSV for the short fields, Markdown for the prose.** One row per record, one
column per field, and a column a file does not use is left out rather than left
blank. The notes are keyed to the rows by id in a `## id` section and ship
verbatim, not rendered, so `<em>` still reaches the page as `<em>`. `> lines`
in those files are commentary — where the 180 lines of `data.js` comment went —
and `# headings` are dividers; neither is ever shown to a reader. `{{reclaim}}`
pulls in a shared sentence from `snippets.md`, which is how the reclamation
caution on the South China Sea islands is written once instead of five times.

**The 485 sub-units are split into 27 group files** — `korea.csv`, `siam.csv`,
`manchukuo.csv`, `philippines.csv`, `aleutians.csv`, `ryukyus.csv` and the rest —
because 485 rows in one sheet is not a thing anyone can edit. The split is for
editing only; at build time they become the single name-keyed table `map.js`
wants.

**Checked by round trip, not by eye.** The old `data.js` was loaded in Node and
dumped to JSON before the move; the generated one was dumped again after it and
the two compared field by field. **Two differences in 187 KB**, both of them the
same thing: a `when: ''` on the two "drawn for context" records, which `map.js`
reads as absent anyway (`rec.date || rec.when`), so the empty cell is simply not
there now. Everything else — every name in four scripts, every note, every
colour, every `edgeClip` and `hatch` and `lvl` — is identical. The generator is
idempotent: a second run leaves `data.js` byte for byte the same.

**The generator refuses rather than guesses.** A territory with no note, two
rows under one id, a sub-unit name in two group files, an override for a city
that does not exist, a `{{snippet}}` that is not defined, a number column with
something else in it — each stops the build and names the file and the row.
Every one of those has been a real bug here, and each hid for months in a file
too long to read. The first thing the check caught is now the third entry under
Open: `JMAP.PROVINCES` had **two `Okinawa` entries**, and the prefecture's had
been silently eating the island's since the fine coastline layer was built.

**The Sources page is one document again**, merged additively — nothing from
either copy was dropped, so it is longer than either was, and it now carries the
confidence table and the cache inventory as tables. `tools/md.py` is the small
stdlib-only renderer that makes the HTML: headings, paragraphs, lists, tables,
links, emphasis, code, and raw HTML passed through untouched. `SOURCES.md` is
written from the same file, so the two cannot drift again.

Swept afterwards: both epochs load, 0 console errors, tooltips and the info
panel read correctly off real mouse events, the legend rebuilds on the epoch
switch, `sources.html` renders 10 sections and 2 tables without scrolling
sideways, and `tools/bundle.py` still produces the 4.9 MB standalone file with
the About text and the sources page folded in.


### The Ellice Islands, and Ocean Island
**Half a colony was missing.** The 1930 record was called "Gilbert & Ellice
Islands" and drew the Gilberts alone: the Ellice group, six hundred miles south,
was on no version of this map. Nine rings for eight islands out of Natural Earth
— Nanumea, Nanumanga, Niutao, Nui, Vaitupu, Nukufetau, Funafuti, Nukulaelae —
each named, through the same box-selects-and-a-table-names machinery the eastern
Pacific uses, with a second box added west of the date line. Niulakita, the
ninth and smallest, Natural Earth does not carry.

**It matters most on the 1942 map**, which is why it was worth doing rather than
tidy. Japan took the Gilberts in December 1941 and never came within six hundred
miles of the Ellice; American marines landed on Funafuti on 2 October 1942 and
built the airfield the assault on Tarawa and Makin was mounted from. Drawn as one
colour the colony would have said the opposite of that. So 1930 has them as one
territory — one colony, correctly — and 1942 splits them: `gilberts` occupied,
`ellice` allied and never occupied. Checked: in 1930 both are British mauve and
both answer "Gilbert & Ellice Islands"; in 1942 the Gilberts are occupation
salmon and the Ellice mauve, and each island names itself.

**And the line of control had one of them inside it.** Tested by asking the
extent path itself, place by place: of the eight Ellice islands **Nanumea was
inside** — the perimeter ran (175, −6.4) → (179, −4.4), which is 5.83 S under
Nanumea's 5.69 S. Tarawa and Ocean Island are inside and belong there. The
stretch is raised to (171, −7.0) → (175, −5.0), passing 4.83 S under Nanumea, and
all eight are outside now while both occupied places stay in. Nothing held lay
between the two groups: the southernmost Gilbert, Arorae, is at 2.65 S.

**The bases are drawn as diagonals, not as a change of flag.** `cat: 'allied'`
with `hatch: 'us'` — the same grammar Guadalcanal uses in reverse, where the fill
is the occupation and the diagonals are the Americans ashore. The Ellice were
British throughout and never occupied; American marines landing on Funafuti did
not make them American, and colouring them so would have said they did.

**Ocean Island is in the Gilberts' note now**, as asked: Banaba, taken in August
1942, most of its people deported to Nauru, Kosrae and Tarawa, and the roughly
150 labourers who remained murdered by the garrison on 20 August 1945 — five days
after the surrender — with one man surviving by hiding in a cave.

**And a duplicate key that had been swallowing eleven overrides.**
`JMAP.PROVINCE_EPOCH` had **two `e1942` blocks**. In an object literal the later
key wins, so the first block — Sind, Orissa, Bihar, the United Provinces,
Liaoning, Heilongjiang, Si Sa Ket, Sukhothai, Labuan, the Dindings and Christmas
Island, eleven per-epoch names in all — had never taken effect on the 1942 map.
Nothing failed loudly; the names were simply the 1930 ones. Adding a third block
for Funafuti is how it surfaced. All merged into one, 14 entries, and the comment
above it says why it must stay that way.

The airfields sit in that `e1942` block rather than in the shared name table,
because "the American base from October 1942" on the 1930 sheet is an
anachronism — there these are nine atolls in a British colony and nothing else.

### The Pacific mandates, drawn as lines
Three Class C League of Nations mandates over the former German Pacific, traced
from a 1927 chart and added to the **1930 map only**: Japan's South Seas
Mandate, Australia's Territory of New Guinea, and the British one over Nauru.
They are outlines and nothing else, which is what a mandate over an ocean is —
almost everything inside these lines is water, and filling them would bury the
islands they are about.

Each is dashed in its mandatory power's own colour (#c2463d, #c9a6b0, #b07f8e)
and filled with `transparent` rather than `none`, because the fill is what the
pointer lands on. They sit early in `ORDER`, under every island, so **an island
inside a mandate answers for itself and only open water answers for the
mandate** — checked at Truk, Saipan, Guam, Rabaul and Nauru, which all give
their own record, and at open sea in each of the three, which gives the mandate.
Pointed at, the region takes a wash of its colour — and the strength is set per
mandate, because the three colours are nowhere near each other. Measured as CIE76
ΔE against the ocean the map draws: 8% of Japan's #c2463d is ΔE 5.19, while the
same 8% of Australia's #c9a6b0 is 2.19 — 42% of it, because that colour sits
close to the sea in lightness — and Britain's #b07f8e manages 3.19, 62%. Equal
percentages look nothing like equal. Set from the *rendered* result rather than
the model, by sampling the sea inside each mandate cold and hovered: 8%, 21% and
14% give ΔE 5.54, 4.80 and 4.65, so the two are at 87% and 84% of the Japanese
wash — visible, and still the softer pair. `unseen` keeps them out of the
legend, out of the labels and out of the black silhouette the hover otherwise
draws.

**Guam is boxed out of it.** It is inside the Japanese line and was never in the
mandate — American since 1898, which is why every description says "the Marianas
except Guam". The box is drawn in the American blue in the same dashed grammar,
and is built from Guam's own extent plus a margin rather than typed out, so it
cannot come loose from the island. It sits under Guam and over the mandate, so
the island answers for itself and the water round it says why it is an
exception.

It does **not** wash when pointed at, and that is the point: it is not a mandate
but American territory cut out of one, and washing it in the mandate grammar said
the opposite of what it is there to say. It keeps its line and the tooltip still
answers. `mandate-cutout` is the class that says so.

**And the line pruner had to be told.** A mandate outline is an annotation, not
a coastline, and a finer coastline does not supersede it — but `prune` marks any
`#land` path whose subpaths all fall inside a live fine-coastline window, and
the Guam box is one subpath sitting inside the Marianas window. It vanished the
moment that window opened. All four are exempt now; the same would have happened
to the Japanese mandate wherever it crosses the Caroline window, which carries
559 islands.

**The mandate lines are lifted over the land they cross, and cased.** The shape
itself has to stay under every island, because it is the hover target and an
island inside a mandate must answer for itself — but that buried the line
wherever it crossed ground, so the Australian mandate's boundary across New
Guinea showed over water and vanished at the coast. A stroked copy now sits
above all of `#land`, taking no pointer events, while the original keeps the fill
that answers and washes.

That was not the whole of it. Lifted, the line was *still* invisible over New
Guinea: it is drawn in its power's colour and Australian land is drawn in the
same colour — `#c9a6b0` on `#c9a6b0`. It reads over water because the sea is
blue. So each line is two paths, a pale casing and the colour over it, and now
reads against whatever it crosses. Both faults would have hit the Japanese line
over Japanese-coloured ground too.

**And the cut is clipped against the polyline, not around it.** This took three
tries and each failure is worth keeping.

The strip method — one half-plane per segment inside its own vertical strip,
pieces concatenated — gets the right *area* and leaves a real edge down each
strip boundary. That drew a line straight across New Guinea at the longitude of
the bend: a boundary that never existed.

Plain Sutherland-Hodgman against the curve gets it wrong more quietly. It
inserts a vertex where an *edge of the ring* crosses the boundary and then joins
one crossing to the next — a chord. The boundary's own bend is never emitted, so
the cut came back as the straight line between the two coasts that the traced
line exists to replace: measured, **bowing up to 92 km** away from it at the
bend, which is most of the 110 km the chord was worth in the first place.

Extending the line beyond its ends at its own slope is wrong too: it dives
south-east across the Papuan peninsula and cuts it a second time, giving the
clip two more crossings than the shape has sides, and it bridges between them —
**156 km** out at worst. Beyond its ends the boundary runs flat instead, which is
also what the history says: the line met the east coast near Morobe, and a flat
boundary at 8.11 S puts the Bismarcks and Bougainville in the mandate and the
tail of the peninsula, the D'Entrecasteaux and the Louisiades in Papua.

`clip_to_polyline` splices the boundary's own vertices in between an exit and
the next entry, so the ring's edge *is* the traced line. Tested standalone
against a box straddling the whole line: **0.0 km at every longitude, including
the bend, on both sides**. On the real coastline the two halves sit 2–3 km apart,
which is the deliberate 0.02° overlap that stops a hairline of sea opening
between them.

**The Papua boundary comes off the same chart.** It used to be `PAPUA_CUT`, one
straight line from the Dutch border to the coast near Lae. The traced mandate's
southern edge bends at 144.22 E, and the bend matters: a chord between its two
ends passes **1.0°, a hundred and ten kilometres, south of the traced line** at
that vertex.

The bend also decides how it can be cut. The line turns *right* going east,
which makes the ground north of it concave — so it is not the intersection of
two half-planes, and clipping it as one loses a wedge of the mandate east of the
bend. Checked before writing it: a point at 146.5 E 6.5 S is north of the traced
line and would have been thrown into Papua. Each segment is applied inside its
own vertical strip instead and the pieces concatenated, which is a union and is
the right shape. Six points either side of the line, at the bend, east of it and
at the Dutch end, all land on the correct side.

The hand-drawn rectangle that used to stand for the Japanese mandate is deleted
rather than left switched off — `JMAP.NANYO_BOUNDS`, `buildNanyoBounds`,
`NANYO_BOUNDS_SHOWN`, its legend row and its two stylesheet rules. Its own
comment said it was waiting for a traced one to replace it, and this is that.

### The islands east of the date line
Everything the map had out there was one invisible box saying "Polynesia is off
this map". A good deal of it is not. Cut out of Natural Earth's countries by the
box asked for — 180.64 to 206.19 E, −13.18 to 13.91 N — and drawn only where
they also fall inside the map's own bounds: **25 polygons, 22 islands, none
rejected by the frame**, in three atoms.

- **The Line and Phoenix Islands**, British, run from the Gilbert & Ellice
  Islands Colony: Washington, Fanning, Christmas (Kiritimati), Malden,
  Starbuck; Canton, Enderbury, Hull, Sydney, Gardner.
- **Palmyra, Kingman Reef, Howland, Baker, Jarvis and Swains**, American, most
  of them claimed under the Guano Islands Act.
- **Tokelau and the northern Cook Islands**, New Zealand: Atafu, Fakaofo;
  Penrhyn, Manihiki, Rakahanga, Pukapuka.

None was ever occupied, which is the point of drawing them: the advance stopped
at Tarawa and everything east of the date line stayed Allied and became the road
the counter-attack came up. The 1942 records say so.

**The box selects and a table names.** Natural Earth is a modern source; every
polygon it hands over is matched to the nearest of twenty-two entries carrying
the period name and the atom, within 0.3°, and anything selected that matches
nothing is still drawn under its Natural Earth name and reported — the box is
the authority on what is included and the table only says what to call it. As
it happens the modern sovereign would have done as well, none of this having
changed hands since, but then the map would say "Kiribati" where it now says
Canton and Fanning.

**Three floors had to be lifted for them**, and each was a different mechanism
saying the same thing — that a square kilometre of coral is not a country:
`NO_DISSOLVE`, or the two dozen atolls a thousand kilometres apart came back as
one ring threading through all of them; `min_area`, or they were dropped before
being drawn; and `sub_min_area`, which is the one that matters for reading — the
archipelago floor of 0.12 threw away twelve of the twenty-two, so they were
drawn but had no name to give.

**A limitation, stated rather than papered over.** All 22 carry their names in
the built SVG, but under the pointer it is the *group* that answers, because the
finger-sized target over each speck sits above the island's own path. Removing
that target at deep zoom was tried and is worse: an atoll is a rim round a
lagoon, and pointing at the middle of Canton then falls through the hole and
answers "Polynesia, beyond the edge of this map". The forgiving target and a
true group answer beat a precise one that misses.

**And the Polynesia box is gone.** It was an invisible rectangle of open water
from 178.6 to 205.9 E, there only to be hovered, answering "Fiji, Samoa and the
rest of Polynesia — beyond the edge of this map". It existed because a reader who
reached that blue had no way of telling empty sea from a missing place. Now that
everything inside the frame out there *is* drawn, the box was answering for water
that has nothing to say, and what lies past the frame needs no apology from
inside it. Removed in both epochs, along with `POLYNESIA_BOX`, its place in
`ORDER` and its two stylesheet rules; the sea east of the Line Islands is bare
sea again, and every island out there still answers for itself.

### The detail sheet: what is new first, and a phone that can still see the map

**The resistance areas stopped saying it twice.** Selecting Taihang and Taiyueh
gave the chip "Communist base areas & guerrilla zones", the name, and then, two
lines below, *Communist base areas and guerrilla zones 抗日根據地 (Kàngrì gēnjùdì)
中国共産党抗日根拠地 中共抗日根據地* — the same words the reader had just read, in four
scripts. The country line is dropped for `cat: 'ccp'` and nowhere else: for
every other place it is the useful half of the sheet, saying which empire the
province belonged to.

**The specific before the general, and set apart.** The sheet took its note from
the *parent* record only, so a reader who asked about Singapore was told about
the Straits Settlements and never about Singapore. Both are shown now, the
place's own first in the body size, then the group's below a hairline, smaller
and muted, so which half is new can be seen without reading either. Where a
sub-unit has no note of its own the group's moves up and takes the first
position rather than leaving a gap above itself.

**On a phone the sheet opens as the name.** A full description is several
paragraphs, and it was taking most of the screen the moment you touched
anything — you tapped a place to see where it was and the map went behind the
answer. Below 620 px the sheet is the chip, the name and its other scripts, and
a `More` button; opened, it takes at most 76% of the height and scrolls. Every
new selection starts closed, and the button is not drawn at all when there is
nothing behind it. Wider than that, nothing has changed: the sheet has always
shown everything and still does.

### Manchukuo is drawn from the railway company's own map
滿洲國地圖 1935, 南滿洲鐡道株式會社資料課 — the South Manchuria Railway's sheet of
the state it was the instrument of. Two files: **the state as one polygon,
5,875 vertices**, drawn when the Administrative layer is off, and **its fourteen
provinces, 7,994 vertices**, for when it is on. It replaces the Republican
provinces the 1942 map used to assemble Manchukuo from. Of the source's
vertices, **88% of the outline and 97% of the provinces survive the build** —
the outline's loss is coincident points merging at the output precision, not
simplification: `manchukuo` is in `FULL_DETAIL`.

**It is a new atom and does not replace `manchuria` and `jehol`.** It could not:
Jehol is a province *of Manchukuo* in this source, annexed in 1933, and on the
1930 map it is a province of the Republic standing outside Manchuria altogether.
So 1930 keeps the ENP sheet's Three Eastern Provinces with Jehol beside them,
and 1942 gets this — the same division of labour Mengchiang has. The province
scheme is Manchukuo's own and dates from 1934, which is the other reason it is
not shown on the 1930 map: those are not the provinces China had there.
Checked in both epochs: 1942 draws `manchukuo` and hides `manchuria` and
`jehol`; 1930 does the reverse. Hovering Mukden, Harbin, Chengteh, Hailar,
Yenki and Chinchow gives Manchukuo in 1942 and its right province with the layer
on — Fengtien, Pinkiang, Jehol, Hsingan North, Chientao, Chinchow — while 1930
still gives Liaoning, Kirin and Heilungkiang under Manchuria, and Jehol on its
own.

**The two files agree with each other.** Sampling a 0.05° grid over the whole
polygon, exactly **one cell of some 78,000** falls inside the state and in none
of its provinces, so the fourteen tile the outline. (A first pass said the
provinces covered 6% less by area; that was my ring arithmetic mishandling the
multipolygons, not the data. The grid is the honest test.)

**Two things had to be told about it.** The frontier seams, which make each
neighbour reach China's line, worked off a list of the ENP sheet's atoms;
Manchukuo is not from that sheet but stands on the same side of the argument —
its traced line is the one the map keeps — so the Soviet Union and Mongolia now
reach it, as they reach China. And the Korea seam along the Yalu and the Tumen
was written for `manchuria` alone; it is now built for both atoms, since each
carries a different epoch and whichever is drawn needs its own strip. The
perimeter's Manchurian arc comes off the traced ring too: the two sheets share
no vertex, and the closest their boundaries come at the hand-over to Mengchiang
is 4.8 km, so the dashed line steps that far at the tripoint with Mongolia —
a third of a pixel at the opening view.

Against the old geometry, 0.12% of sampled pixels change between land and sea
along the edges, which is two sources disagreeing about a coastline and not a
hole. The map's border with Mongolia does move: the 1935 sheet puts the Barga
frontier further east than Natural Earth does, which is the ground the Nomonhan
fighting was about, and the sheet is the better authority for what Manchukuo
claimed.

**What the fourteen say under the pointer.** One shape for all of them:

> Lóngjiāng (Lungkiang)
> 龍江省 (Ryūkō)
> Manchukuo (Manchuria)  滿洲國
> Japanese occupied. Nominally independent from March, 1932.

Pinyin with its tones first and the 1935 sheet's own romanisation after it, then
the characters with their Japanese reading, then the country, then what it was.
No city and no gloss: "— Mukden" and "— Harbin" are gone, because those are on
the Cities layer where a reader who wants them will look, and a province tooltip
that names a city as well reads as though the province were the city's suburb.
"— the Korean borderland" went with them, being the same kind of thing.

The country's line took a small piece of machinery. `nameKey` folds 滿洲國 and
満洲国 into one name — the variant table has 滿→満 and 國→国 in it, quite rightly —
and `otherNames` then keeps the *longer* of two spellings, which is whichever
carries a reading rather than whichever belongs to the place. So the line came
out 満洲国 (Manshūkoku), a third romanisation under a province that had already
given its name twice. Dropping `ja` from the record fixed that line and broke
another: the territory's own tooltip takes its second line from `rec.ja`
directly. Taking `orig` for every parent instead cost Japan its 内地 and the
Philippines their 比島, which are not duplicates of anything. So it is opt-in:
`under` is what a record says when it is standing beneath one of its own
provinces, Manchukuo is the only record that sets it, and everything else is
untouched — checked on the eleven probe points of the sweep.

`SOURCES.md` and the Sources page name the new sheet, and the Mengchiang entry
is corrected there at the same time — it still said the client state was the
Republican provinces of Chahar and Suiyuan, which stopped being true when it was
traced earlier this session.

### The India–Burma line reaches China, and the occupation stops at Mengchiang

**The hairline was clipped four hundredths of a degree short.** Burma was a
province of British India until 1937, so on the 1930 map the two share a colour
and the frontier between them is drawn as a coloured hairline — Burma's own
outline, stroked, and cut to a box so that only the part it shares with India is
drawn and not its frontiers with China, Siam and the sea. Measured against
India's ring, the shared stretch runs **92.17 to 97.36 E, 20.96 to 28.24 N**,
296 points of it; the box stopped at 97.3 E and threw away the last ten, which
are the leg from 97.31 to 97.36 E climbing to the trijunction. So the line
stopped in the hills and never met the Chinese border.

The box now ends at 97.4 E. All 296 points are kept, and only three points of
Burma's China frontier come in with them, at the junction itself where the two
meet anyway. Checked on the render: the drawn line now reaches 28.26 N, 97.37 E.

**And Mengchiang's shading no longer runs outside it.** `MENGJIANG_UNDERLAP`
grew the client state's ring by a quarter degree and added it to the occupied
geometry, so that the occupation would reach under Mengchiang where the two
traced sheets fail to meet. A ring grown is grown on every side, and
Mengchiang's other sides face Mongolia and Free China — so a quarter degree of
army shading stood along the north-western frontier *outside* the client state,
with the dashed line of control drawn round the outside of that.

It turns out to have been doing no work at all. What closed the ribbon was the
other half of that fix, widening `clip-china` to admit Chahar and Suiyuan;
without it, nothing added there could be drawn at all, which is why the grow
looked necessary. The constant and its code are deleted rather than zeroed.

**But the widened clip was itself too wide, and that was the rest of the band.**
Letting Chahar and Suiyuan into `clip-china` whole let the occupation be drawn
anywhere in them, and the army's sheet and the client state's disagree about
Mengchiang's edges in *both* directions:

- **East and south-east**, the army's sheet reaches further and the ground
  between the two lines is enclosed — Mengchiang on one side, Jehol and
  Manchukuo on the other, the occupation below. Drawn as Free China that was a
  bay of unoccupied yellow inside a region held all the way round. Letting the
  provinces in was for this.
- **West and south-west**, the army's sheet also reaches further, but there the
  ground beyond is open Free China — Fu Tso-yi's, and the Ordos. The same
  licence drew a band of army shading along the outside of the client state's
  own frontier, with the line of control round the outside of that.

So the provinces come in through **two windows** rather than whole:
`MENG_POCKETS`, the enclosed ground east of Mengchiang towards Jehol and
south-east of it above Peking, each province ring cut to the box with
`clip_halfplanes`. Measured by sampling the rendered colour over three views:
the western frontier loses **6,357 cells of army salmon** and gains 6,512 of
Free China yellow, while the eastern and southern pockets change by 102 and 202
cells out of 176,000 and 219,000 — that is, not at all — and still hold **no
Free China yellow whatever**. The client state's own line is the better
authority where it faces open country; the army's sheet is the better authority
where the ground between them is enclosed.

### A link carries the view and the layers
`?bbox=120.9,24.5,122.3,25.68&layers=3j` — the ground that was on screen and
what was switched on. Two decimal places, and the reasoning for it is worth
keeping because I first got it wrong in the other direction: the map is 140°
wide and `MAX_ZOOM` is 100, so the closest a reader can get is a view 1.4°
across, and a hundredth of a degree is 0.7% of that — six pixels on a phone,
three as a placement error once it is rounded rather than truncated. I had
written four places on the belief that a hundredth was "most of the screen at
the far end of the zoom", which is off by two orders of magnitude. The address bar rewrites itself as you pan,
zoom and toggle, on a 400 ms timer and through `replaceState`, because
`applyView` runs on every frame of a pan and a history entry per frame would
make the back button useless. Copying the address bar is the share.

**The query is built by hand, for the comma's sake.** The form-urlencoded
serialiser behind `URLSearchParams.toString` keeps only letters, digits and
`* - . _`; everything else is percent-encoded, so a comma came back as `%2C`
and the address bar filled up with them. Checked across fifteen candidates: by
that route only `-`, `_`, `*` and `.` survive, while a hand-built query keeps
`,` `~` `:` `;` `|` `/` `@` `(` — all legal in a query string — and loses only
`+`, which decodes back to a space. A comma is what every map URL uses and it
is never a minus sign, so a negative latitude needs no thinking about. Any
other parameter already in the query is put back through `URLSearchParams`,
none of it being ours to reformat; checked that a `utm_source=a b` survives.
A hyphen is still read, for the handful of links written while it was the
separator: a separator hyphen is the one with a digit before it and a minus
sign never has one, so `61.803--32.9547-201.803-68.7139` still comes apart.

**The box, not the viewport.** Screens differ; asking for the same viewport on a
different one gives a different piece of the world. The box is *contained* —
whoever opens the link sees at least everything the sharer saw, and on a
differently-shaped screen a margin of sea besides. Checked by sharing from
1200×860 and reopening at 1200×860, 430×900 and 1600×700: the reopened box
covers the shared one every time, the phone paying for it in latitude
(−72.7…84.0 against −33.0…68.7) and the wide desktop in longitude.

**Longitudes are not wrapped**, and getting that wrong cost a round trip.
`project` wraps: a longitude west of `lonMin` is taken to mean the same meridian
a turn later, which is right for placing a country and wrong for a box. The
opening view overhangs the drawing's western edge by four degrees, so its west
edge normalised to −158.2 and reprojected to *east* of its own east edge; the
link reopened 12.6° adrift. The box is written in the map's own frame instead,
running east from `lonMin` and never wrapped, so an east coordinate can read
201.8 rather than −158.2 — the same meridian, and one that survives the trip.

**The layers are one base-36 number**, two characters now and never more than
three: ten bits is 1,023 and three base-36 digits hold 46,655. Bit 0 is the
year, 1–3 the three buttons, 4 place names, 5 the line of control, 6 the rivers,
7 the Republic's provinces, 8–9 the detail level. The code is always written,
never dropped as a default: the opening state is not zero, because the line of
control and the rivers start on, and inverting two bits to make a tidier address
bar would not be worth the next person's confusion. Read before the controls are
built, so a shared year and its layers are what the map is *drawn* with rather
than something switched on afterwards in front of the reader.

### The backings are not a filler when Administrative is off — a correction
I reported that the backings are "completely covered by the atoms on top" and
that cutting them would take three quarters off the raster cost of a pan. That
is true with the Administrative layer **on** and false with it **off**, which is
the default and how most readers see the map.

An atom whose divisions live in the deferred administrative file is an empty
group until that file is fetched. With Administrative off, **19 drawn
territories have no geometry of their own** — China, India, Japan, Korea, Tibet,
Sinkiang, Manchuria, Jehol, Chahar, Suiyuan and its western strip, Siam, Burma,
Saharat, Indochina, the ceded provinces, Sarawak, Brunei and the Dutch East
Indies. For all of those the backing *is* the country. Detaching the layer
empties the map, which is what it did.

With Administrative on the list is empty: every atom has its provinces and the
backing is genuinely underneath. Measured on a 390×844 viewport at 4× CPU:

| | backings on | backings off |
|---|---|---|
| Administrative off | 2,490 ms | 620 ms — *and most of the map goes* |
| Administrative on | 3,164 ms | 1,366 ms — *and nothing visibly goes* |

So the 75% is the cost of drawing the world once, not of drawing it twice. The
redundancy is real only in the Administrative-on case, and it is 57% there. The
lever is not "cut the backings"; it is that with Administrative off the whole
map is drawn from one set of full-resolution country outlines, and those
outlines are what a pan is paying for. The panel says all of this now, and
counts the 19 for whatever epoch and layer state you are in.

### An admin panel, fetched only by whoever asks for it
Option-click (alt-click) **Layers** and `admin.js` is fetched and a panel opens
down the right-hand side. Nothing in `index.html` refers to it, and a reader who
never option-clicks never asks the server for it — checked: zero requests for
`admin.js` on load and on a plain click, one on an option-click, none on a
second.

It is deliberately almost detached from the map. It reads the projection off the
`#proj` element in the SVG and screen coordinates off the SVG's own CTM, so it
needs nothing exported. `map.js` gained three small things and no more: the
option-click, a loader, and one optional hook in `onPointerUp`
(`window.JMAP_TAP`) that lets a tool take a tap. The hook is offered at the tap
rather than at `click` for two reasons — a tool gets taps without having to tell
a tap from a drag itself, and panning and pinching go on working while a tool is
armed, which is the difference between a usable drawing tool and a toy.

The panel is `#stage`'s padding, not an overlay, so the map keeps its own box
and refits itself off a `resize` — checked at 1300 px wide, container 960→640
and the view's aspect following it to 0.759 exactly.

**Backings on and off.** The switch detaches `#backings` from the document
rather than hiding it, and it says what it is detaching: 37 paths, how many are
drawn in this epoch, 1,253 KB of path data. Driven through the panel exactly as
a person would, a pan on a 390×844 viewport at 4× CPU throttle goes from
**2,488 ms of raster to 628 ms — 75% less work**, which is the figure the
performance report arrived at by hiding the layer by hand. The setting is kept
in `localStorage` and the panel reopens itself on a reload, so the comparison can
be made across page loads and not only within one.

**Draw a polygon.** Tap to drop a point, drag to pan as usual; the ring closes
itself, reports its point count and a rough area, and offers the coordinates as
a lon/lat list or as a GeoJSON feature — in a textarea as well as on a Copy
button, because `navigator.clipboard` is not there over plain http or from a
`file://` page. The ring is drawn in the map's own coordinates so it stays where
it was put through a zoom; the vertex dots would grow with it, so they are
resized from a `MutationObserver` on the viewBox, rAF-throttled and connected
only while the tool is armed — it must cost nothing when the panel is being used
to measure a pan. Switching the tool off removes the layer and the points.

**Adding a tool** is pushing another object onto `TOOLS` in `admin.js`. Each one
is handed a titled section and the same small api: `toLonLat`, `clientToUser`,
`unitsPerPixel`, `onTap`, `copy`, and a persisted `setting`.

### The outline stopped being drawn twice
Hovering British Borneo came up with a second line just outside Brunei's own,
running parallel to it a few pixels away — the same shape drawn twice from two
sources that do not agree.

The second line was the **backing**. Under every atom whose sub-units come from
a provincial source there is a filler, `whole_union(key)`, because adjacent
sub-units share an edge in the source, lose it to being simplified one ring at a
time, and open a hairline of ocean between them; the filler is drawn underneath
in the same colour so that a crack shows the country instead of the sea. It is
**Natural Earth's outline of the country**, deliberately a different source from
the sub-units, and its coast lies a couple of pixels off theirs.

`composeEpoch` puts it in `atomsOf` so that it lights when its territory does,
and `atomsOf` is also what the silhouette is built from — so it was being
stroked alongside the atoms. British Borneo hovered handed `outlineOf` six
shapes for four atoms: Sarawak, North Borneo and Brunei each arrived as their
own paths *and* as their filler. Three of the six were the duplicates, and
Brunei's pair — 838 characters of path against the filler's 1,233 — is what a
reader sees as a double line.

`outlineOf` drops them now, the same way and in the same place it drops
`.superseded`: a backing fills, it does not describe. The exception is an atom
whose divisions are still in the administrative file — an empty group whose
backing is the only shape it has, which is the exception the hatching already
had to make. British Borneo is down to three outlined shapes from six, the
second coastline is gone across the whole of northern Borneo, and the seven
territories checked for it — China, British India, Siam, Korea, Thailand,
British Borneo, Japan — have no two outlined shapes starting at the same point.

The line that survives is the sub-units', so where the two sources disagree it
can run a pixel or so inside the filler showing beyond them. That is a
disagreement in the fill, not something the outline invented, and one line in
roughly the right place beats two.

**And the same three atoms were being emitted twice.** `spratly`, `paracel` and
`pratas` had been added to `ORDER` in two places, so each came out as two `<g>`
elements carrying the same `id` — 238 atoms where there were 235. Duplicate ids
are their own bug: `atomEls` keeps the last, `querySelector` finds the first,
and the two never have to be the same element. One copy each now.

### Mengchiang is drawn from its own boundary
It used to be the ENP sheet's Chahar plus the eastern half of Suiyuan — two
provinces standing in for a state whose boundary was neither of them. The traced
one, `mengjiang-1942.12.geojson`, is **one ring of 358 vertices** against a
province edge and a line of longitude, and every point of it falls inside the
ENP provinces, checked by sampling, so nothing of Mongolia or Manchukuo is
painted by it.

It is drawn *over* Chahar and Suiyuan rather than instead of them: those are
still the 1930 map's provinces, and on the 1942 map what is left of them outside
the traced line is Free China's — Fu Tso-yi's ground in the west and the
unoccupied steppe. The meridian cut through Suiyuan is no longer doing any work
on the 1942 map, though it stays for the atom.

**The occupation is carved back to it.** Mengchiang's boundary crosses China
proper — northern Shansi was part of the regime — so the shading ran underneath
it, and where the two traced lines nearly but not quite coincide it showed as a
fringe outside it. A clip cannot subtract, but it can be the frame with a hole
in it: `clip-off-mengjiang` is the whole rectangle and Mengchiang's rings in one
path under the even-odd rule, and the occupied group now carries both clips.
They intersect, which is what is wanted — the shading stops at the coast, at the
frontier, and at the client state's line.

**The line of control follows it too**, and getting it to took understanding why
it would not. `EXTENT_MANCHURIA` used to be one arc taken off Manchuria, Jehol
and Mengchiang dissolved together — but `dissolve` cancels the edges two rings
*share*, so rings that merely overlap never merge. Mengchiang is traced and its
neighbours are the ENP sheet's; they overlap and share nothing, and no amount of
growing one into the other welds them (0.05, 0.12 and 0.28 degrees were each
tried, each a no-op). The dissolved outline stayed Manchuria's alone, its
nearest vertex to the hand-over point was 524 km away, and the perimeter ran
there in a straight line — a 1,158-unit chord from 116.78 E 40.91 N, cutting
clean across the client state and leaving it outside the line.

The two rings do share one vertex exactly, at **119.595 E 46.603 N**, so the
perimeter is built as two arcs meeting there: Manchuria-and-Jehol from 130.7 E
42.4 N round to that vertex, then Mengchiang's own ring from it down to
112.40 E 39.15 N, where the front through occupied China picks up. Nothing is
grown for it, and the chord is gone.

**The occupation is carried up under Mengchiang.** The two boundaries are traced
from different sheets, so their common edge is two lines rather than one and a
ribbon of unoccupied yellow lay between them — ground that was neither the
client state's nor the army's, which is not a thing that existed. Mengchiang's
own ring, grown by `MENGJIANG_UNDERLAP` (0.25°), is added to the occupied
geometry; `clip-off-mengjiang` then takes Mengchiang itself back out, so what
survives is exactly the ribbon and it cannot spread anywhere else. For it to
survive at all, `clip-china` had to be widened: it was built from China proper's
provinces alone, and the ribbon lies in Chahar and Suiyuan, so every earlier
attempt was clipped away before it could be seen. The clip now takes `chahar`,
`suiyuan` and `suiyuan_w` in as well. Two pockets of about 100 km across, at
roughly 116.5 E 41 N and 114.5 E 40 N, are closed; the sampled yellow in that
frame drops from spanning 37.3–41.5 N to 37.3–40.3 N, all of it Free China to
the south-west, none of it between the two.

**A build that never ran.** For several attempts at that ribbon the measurements
were of a stale SVG: an edit had dropped three lines (`if china_islands:` and
the two after it) and the build was dying with an IndentationError, which the
probes had no way of noticing. Two approaches were judged "no effect" and one of
them was reverted on that evidence. The rule from the earlier instance of this
holds and is worth restating: check the build's own output before believing a
measurement of its product.

### The islands of the South China Sea
The Spratlys, the Paracels and Pratas, cut out of the OSM coastlines and drawn
where the map had nothing but open water. **78 features** survive the half-hectare
floor — 52 in the Spratlys, 24 in the Paracels, Pratas and its neighbour — and
the named ones land where they should: Itu Aba within 300 m, Spratly Island 200,
Thitu 200, Woody Island 700, Pratas 400.

They are a **fine set**, fetched only on a deep zoom into that water, which is
where a reader has to be before any of them is more than a speck. The largest
island of each group is carried on the base map as well, so the group exists,
can be pointed at and can be named before any of that is loaded — 16 coarse
islands in the Spratlys, 9 in the Paracels, 1 at Pratas.

**What they were.** In 1930 the Spratlys had just been annexed by France, in
April of that year, over an earlier British claim that had come to nothing;
France occupied Spratly Island and Itu Aba in 1933 and attached them to
Cochinchina, and Japan disputed it throughout while working the guano and the
phosphate. The Paracels were claimed by the Republic of China as part of
Kwangtung and by France for Annam, and administered continuously by neither.
Pratas was Chinese, bought back in 1909 from the Japanese merchant who had
occupied it. By December 1942 Japan held all of them: the Spratlys and Paracels
were taken in 1939 over French protest and annexed to Takao prefecture in Taiwan
as the **Shinnan Guntō**, the "new southern islands", an anchorage on the flank
of the route to Singapore and the Indies.

**And a warning, on every one of these records** — one sentence, and nowhere any
longer than one sentence: *"Islands are traced from present-day shapes, which
does not reflect more recent land reclamation."* It started as a paragraph on
the records and a shorter paragraph on the Sources page, explaining that most of
what is drawn has been built up since the 1970s and especially since 2013, that
Itu Aba was about 0.4 km² and Woody Island has roughly doubled, and that where a
shape looks like an island with a runway on it that is the reclamation and not
the period. All of that is true and none of it needed saying at that length: a
reader who wants the detail is not going to get it from a tooltip. Both copies
are the single sentence now.

**No ring drawn round them.** The islet ring that marks a group too small to see
is what the reader is meant to find these by *not* having: two circles the size
of Hainan sat over the Spratlys and the Paracels and announced them from across
the map. `spratly`, `paracel` and `pratas` are out of `ISLET_RINGS` and
`ONE_ISLET`, so at low zoom they are specks in open water and finding them is
the reader's own doing. The atoms still carry their geometry and still answer to
a pointer.

`turtle` and `mangsee` have gone the same way, and for a plainer reason: they
sit a few kilometres off North Borneo, where the coast and the islands round
them are perfectly legible at any zoom that shows them at all, so the ring was
not finding anything the reader could not already see. It was ruling two circles
across the Sulu Sea instead. The comment on `ISLET_RINGS` already made this
distinction — the rings are for the Pacific, and over the Indies and the
Philippines they are clutter — and these two were on the wrong side of it. The
islands still draw, and the record still names itself under a pointer.

**And the rings that remain go much sooner.** They were dropped at
`view.w < mapW / 5` — measured by wheeling in from the opening view, they
survived to **5.6× the opening width**, which is well past the point where the
Gilberts and the Carolines are large enough to point at and the rings have
become marks on the sea. They go at **1.6×** now: at the opening view and for
about three notches of the wheel past it, and no further.

Measured against the opening view rather than the map's full width, which is the
part that took thinking about. `mapW` is the whole drawing; the opening view is
not — a phone opens cropped to the empire and a wide desktop opens on the
hemisphere, so the same fraction of `mapW` is a different amount of zooming on
each. The question the threshold is asking is how far in the reader has come, so
it asks it of `defaultView()`, which `applyView` was already calling for the
reset button. Checked at 1200 and 430 px wide: rings at the opening view on
both, gone by 1.78× on both.

### The line of control follows the traced blocks, and one outline per shape
**The dashed line still ran on the old hand-drawn course** where it bulges
inland to take in the coastal enclaves: the shading beneath it had had the real
traced shapes since the occupation was retraced, and the perimeter was still
detouring round ellipses. `EXTENT_ENCLAVES` names the three blocks it has to
enclose — Amoy and Kinmen, Swatow and Chaochow, the Canton delta — and
`enclave_detour` replaces the part of the line inside each box with the convex
hull of that block grown by the same margin the rest of the line keeps off the
shore. The hull rather than the outline: the perimeter is one generalised line
meant to enclose what was held, not to trace it. Which of the two arcs round the
hull to take is decided by asking whether the middle of the arc is on land, so
the line goes round the seaward side without anyone saying which side that is.

**Thailand's divisions stop at the ceded provinces.** A country's divisions are
drawn for the country under the pointer, and `.subs` went on the atom under the
pointer alone — but Thailand in December 1942 is two atoms, its own ground and
the provinces ceded to it in 1941, so the changwat were drawn and the ceded
provinces left blank. That says they have no divisions rather than that they are
the same country's. The class follows the territory now.

**And one outline per shape.** The hover outline and the selection outline are
different widths, 3.3 against 3.7, so a country that was both selected and under
the pointer got drawn round twice and the two strokes read as one line changing
thickness along its length. The selection is the stronger statement and the one
that survives the pointer moving away, so it wins.

### The ragged grey on the Sinkiang frontier
Not contested territory — a source disagreement, and the map was showing it as
ragged neutral ground on the Soviet side of the line. Measured at three
hundredths of a degree over 80,100 sample points in that window, **500 of them
had no country on them at all**.

The cause is the ENP sheet, whose interior and frontier lines run 9 to 12 km out
of place — that is measured under the Sources entry — and which gives the whole
of Sinkiang **84 vertices**. A seam is pushed outward from the mover's own
vertices, so a boundary drawn with that few has almost nothing to push: a search
that should have carried Sinkiang out to the Soviet line produced eight strips.

`SEAM_DENSIFY` splits the long edges before the search — no shape is added,
every new point lying on the line it came from — and `SEAM_REACH` gives that
pair the hundred kilometres the disagreement actually spans. Sinkiang reaches
Afghanistan as well as the Soviet Union, the third party at the Pamir knot.
**Uncovered sample points fall from 500 to 67.**

The first figures written here — 288 points, 2,251 pixels — were wrong, and the
reason is worth keeping. `SEAM_DENSIFY` and `densify()` never landed in the
file: the edit that was supposed to add them asserted on an anchor that had
already moved, and only the line that *calls* them landed. The build then died
with a NameError, `python3 tools/build_map.py` left the previous SVGs in place,
and every measurement after that was of a build that did not contain the change.
It was committed in that state. The lesson is the same one as the tasks.md
entries that silently failed to write: check that the edit landed, and check
that the build ran, before believing a number.

Two things were built for this and thrown away. A grid fill that gave every
uncovered inland cell to the nearest country **added 1,424 rings and 81 KB to
Sinkiang and changed the drawing not at all** — the cells went into `groups`,
and the shape actually drawn for an atom of that kind comes from its province
list or its filler. Adding them to all three did make them appear, and by then
it was 3,750 squares standing in for a frontier, which is not a boundary but a
staircase. The seam does the same work as a ribbon.

### Cocos is Allied, and the ceded provinces stop wearing a band
Three reports in the same batch, and the first two turned out to be one thing.

**Cocos was grey on the 1942 map** because its record said `cat: 'british'` and
there is no British category on that date — the 1942 palette has one Allied
colour, which the Raj, Australia and the colonies all take. An unknown category
gets no colour, so it fell through to the Elsewhere grey. It is `allied` now, and
carries grey diagonals: Allied ground that lay inside the reach of the Japanese
perimeter, was shelled from it on Christmas Day 1942, and was never taken.

**French Indochina's outline still enclosed the ceded provinces** on the 1942
map. The provinces themselves were cut out of Indochina properly — that was done
when they were first drawn — but the *filler* underneath was Natural Earth's
Laos and Cambodia laid down whole, cessions and all, and the outline traces the
filler. So hovering French Indochina drew a black line round Battambang, Siem
Reap and the trans-Mekong strip, which by then were Thailand's. `indochina`
joins `BACKING_FROM_SUBUNITS`: its filler is built from its own provinces and
stops where they stop.

**And the ceded provinces had a thick band of their own colour inside the
outline** when hovered. It is Thailand's `edge` — a cover stroke six units wide
laid along its frontier to hide a crack between two datasets, in Thailand's own
colour so that it cannot be seen while nothing is hovered. The moment the ceded
provinces brighten, the stroke does not, and a four-pixel band of the unlit
colour appears inside the outline. Removing it is not an option: measured, it is
covering **1,222 pixels** of real crack, and letting Thailand's seams reach the
ceded provinces closes only 22 of them. So it brightens with the colour it is
painted in — as do the seam strips, which had the same problem for the same
reason and are also drawn in a colour they do not light with. Neither is
outlined or named by any of this; only the brightness follows.

Finding it took four wrong guesses, and the reason is worth writing down: seams
and cover strokes both carry `pointer-events: none`, so `elementsFromPoint`
never reports them and every probe said the only thing there was the backing.
Hiding groups one at a time is what found it — with `#land` hidden the band was
still there, which left only the layers outside it.

### Labuan is an island again, and the seams stop crossing Brunei Bay
Reported as two things — Labuan joined to the mainland, and a mess along the
North Borneo frontier — and they are one fault. Measured against the traced
coastline over 89,700 sample points in that window, the map was drawing
**10,324 points of sea as land.**

It is the seams. A seam reaches from one country's frontier until it is inside
its neighbour, and the reach is what tells a coastline from a frontier: a vertex
that cannot reach anything within `SEAM_MAX` gets no strip. Half a degree is a
fair allowance along the Himalaya, where two hand-traced lines differ by tens of
kilometres. In northern Borneo it is **wider than Brunei Bay**, so the strips
went straight across the water and filled it in — and Labuan, three kilometres
off the Klias peninsula, was welded to it.

`SEAM_REACH` gives a pair its own reach. The Borneo three and the Indies get
0.055° — six kilometres, which closes the source disagreements there, measured
in hundreds of metres, and cannot cross anything. Sea drawn as land falls from
**10,324 sample points to 1,195**; land drawn as sea rises from 135 to 365,
which is the strips no longer covering the genuine cracks, and is the trade.

**The sliver fill is reverted.** It was written earlier the same day to close
those cracks by giving uncovered cells to the nearest atom, with a flood inward
from the window edge to spare open water. The flood is not reliable at grid
resolution — a channel two kilometres wide can be closed off by cells that
straddle it, and the water behind it is then "enclosed" and gets filled. It was
not the cause of this report, but it is the same class of mistake and it bought
little: enclosed ocean fell from 2,452 pixels to 1,298, against a rule that can
drown a strait. Brunei Bay goes back to wanting a period source, as it did.

### Hovering occupied China froze the map
Reported as a crash on the 1942 map, and it was not far off one: at the opening
view, where the whole occupied zone is on screen, moving the pointer onto it
hung the renderer outright — driven from outside the page, the call never
returned inside three minutes.

`outlineOf` made one stroked copy per shape, and the occupied zone is **722
traced rings in as many children**. Each copy carries a mask reference and a
clip reference, so one hover asked the compositor for **755 masked, clipped
layers**, every one of which has to rasterise when the whole zone is in view.
The other atoms it is used on are a handful of shapes each, which is why nothing
else showed it and why it arrived with the traced occupation.

Every path of one element is now outlined as a single path: a stroke over the
concatenation of the subpaths is the same stroke as the union of the strokes,
and the mask solid concatenates the same way, so it is the same picture drawn in
two elements instead of 1,444. **755 outline paths become 4, and the hover
completes in 131 ms.**

### With the Administrative layer off, China is one unit
Hovering Jehol on the 1930 map named Jehol and outlined Jehol, when with
divisions switched off the whole of China — Manchuria, Jehol, Chahar and
Suiyuan, Sinkiang — should answer as one country. Two faults, and both had to go.

**The record.** Those five are drawn as territories of their own so that each
can be *named*; China's record already listed them in `lights`, so hovering
China lit all of them, but the relation ran one way and hovering a part lit and
named the part. `within: 'china'` says it on the part instead, and three things
read it: `recordFor` substitutes the whole while the layer is off, so the name,
the note and the outline are China's; `litFor` lights anything that says it is
within the hovered thing; and `labelVisible` refuses to label a part as a
country, which is what put "Rèhé (Jehol)" on the map beside "China".

On the 1942 map the same word does the same work for Sinkiang, which was Free
China's on that date and shares its colour — and Manchukuo and Mengchiang stay
separate, as they must, being different polities. Checked on both dates: **seven
atoms lit and China's name from all five places with the layer off, each naming
itself again with it on**, Tibet outside it throughout.

**The hairline down every join.** With that fixed the country lit as one and
still came up ruled off inside, a one-pixel line along each boundary between its
atoms — visible only while it was hovered, which is what gave it away. The
outline is a stroke with the shape's own mask cut out of it, and the mask was
built from the fills alone; two atoms of one territory abut without quite
meeting, and the 1.3 stroke on the atom is what closes that crack in the fill.
The mask is stroked at the same 1.3 now.

That widens the mask by half its stroke and takes the same off the visible
outline, so the highlight widths carry 1.3 more to compensate — 3.3 and 3.7
where they were 2 and 2.4. Measured on the rendered frame: **33,052 outline
pixels against 33,254 before**, 0.6 per cent apart, with 4,213 pixels of
internal join gone.

### Labuan is drawn from its coastline
The adm1 polygon for Labuan is a fan of thin spikes and wedges at any depth of
zoom rather than an island — the Johor fault again, in a place small enough that
there is nothing else to look at. It is traced out of the OSM coastlines now, as
the four outer groups are: **91.0 km² against the 92 the gazetteers give**, in
five rings, so Pulau Daat, Pulau Kuraman and the two Rusukan islets come with it.
Measured by sampling for ocean enclosed by land in a fifteen-kilometre window:
**486 samples before, 163 after**.

The rings replace the adm1 ones at the point where the atom's geometry is
collected, not after — the first attempt added them beside the old ones and the
union kept every spike, and the render was pixel-for-pixel identical, which is
what said so.

### Fine coastlines for Singapore and for Ulleung and the Liancourt Rocks
Two more windows in the fine layer, fetched on a deep zoom like the rest.
**Singapore** brings 33 islands — the island itself at 658 km², Pulau Tekong,
Pulau Ubin, Sentosa, the southern islands and the strait between them and Johor.
**Ulleung** brings five: Ulleungdo at 73.7 km², Jukdo, Gwaneumdo, and the two
islets of the Liancourt Rocks at 0.09 and 0.07 km². Both were inside the
Japanese empire on both dates — Ulleungdo as part of Chōsen, the Rocks
incorporated into Shimane prefecture in 1905, five years before the annexation
of Korea — so the map draws them one colour and the argument is about now.

The geometry comes from the same 876,182-line coastline file, through
`tools/extract_coast.py --as-lines`, and the names from a hand-written index in
the Overpass shape the build already reads. The fine file grows 551 KB to 561.

Two things in `map.js` had to give way, and both were wrong before this:

**A fine island names itself whether or not the Administrative layer is on.**
`provinceAt` let a sub-unit through only when its atom carried `data-islands` —
which the Ryukyu and Pacific atoms do and Korea and Malaya do not — so hovering
Ulleungdo with the layer off answered "Chōsen" and nothing else. An island is a
place, not an administrative division, and naming one has nothing to do with a
switch about provinces.

**And what data.js says about a fine island now reaches the reader.**
`provinceOf` built its record out of the shape's own attributes and returned it
without ever looking in `JMAP.PROVINCES` — so the entries written for the
Senkaku islands were never being read, and the note about the dispute was not
appearing on them either, though the task list has said it was since it was
written. The record is merged now, checked on Uotsurijima as well as on the
Liancourt Rocks.

### Four island groups the map had no shape for
The Turtle and Mangsee Islands, Miangas and the Cocos (Keeling) Islands, traced
out of the OSM split-coastlines file. Each is on the map because who held it is
a question rather than an answer.

**The Turtle and Mangsee Islands** in the Sulu Sea: administered by the British
North Borneo Company since the 1880s and placed inside the boundary of the
American Philippines by the Anglo-American convention of 2 January 1930, with
the Company left running them — the transfer was not actually made until 16
October 1947, to the independent Philippines. Drawn in the American colour with
British diagonals, which is what the arrangement was, and Japanese in 1942.
**Miangas** is the Island of Palmas: the United States claimed it as part of what
it had bought from Spain in 1898, and Max Huber awarded it to the Netherlands on
4 April 1928 — the case that made continuous and peaceful display of authority
the test of title. Dutch in 1930, Japanese in 1942. **Cocos (Keeling)** is a
Straits Settlement in the Indian Ocean, barely inside the frame at 96.85 E, and
one of the few places here that Japan neither took nor bypassed: a submarine
shelled it on Christmas Day 1942 and it stayed Allied throughout.

`tools/extract_coast.py` is how they were got. The source is 876,182 linestrings
and 1.2 GB, and reading it through the shapefile reader in this directory takes
longer than the whole build — so this reads each record's own bounding box out
of the `.shp` header and seeks past the geometry when it misses, which is
876,000 times out of 876,182. **1.7 seconds.** The coastline comes as open lines,
so pieces that share an end are chained back together and a chain whose ends
meet is an island. 30 rings survive at 0.02 km²: Turtle 9, Mangsee 3, Miangas 1,
Cocos 17, in a 37 KB cache file that is committed while the 1.2 GB source is not.

They keep every vertex — `FULL_DETAIL`, and no minimum area, because at two
square kilometres each any band would thin them out of existence. And they get
**one islet ring per group** rather than one per islet: the Turtle Islands are
nine specks inside a fifth of a degree, and nine overlapping circles read as a
scribble rather than as a place.

### The starburst in the Johor Strait was the estuary, simplified
A star of thin blue lines in the middle of Johor, visible without hovering
anything. The earlier guess — an unnamed leftover path with spiky geometry — was
wrong, and so were two fixes built on the way to the right one.

It is **the Skudai and Tebrau estuaries**. geoBoundaries draws that shore as it
really is, a dendritic tangle of tidal creeks, and the ring wanders in and out of
a tenth of a degree ten separate times. Simplified at the tolerance an atom of
Malaya's span earns, the convoluted stretch folds over itself: the sub-loops come
out wound the other way and the nonzero rule punches them into holes. So the
starburst was not a shape in the data at all — it was what was left of a shape
after thinning it.

`malaya` joins `FULL_DETAIL`. **1,223 vertices become 6,200** and the main SVG
grows 75.7 KB, 2.9 per cent, and what is drawn there now is two narrow winding
inlets, which is what is there.

Tried first and reverted, both measured:
**A patch rectangle** giving the ground back to Johor — Natural Earth calls every
point of it land, checked over 483 — which closed the middle of the star and none
of the spikes, because they radiate well beyond any box that fits inside the
state.
**Removing needles**, vertices where a ring doubles back on itself along its own
edge, which geoBoundaries has plenty of where a boundary was traced up a river
and back. It dropped 625 vertices of 250,643 across the whole build, 0.25 per
cent, and changed the star not at all. Correct and useless, so it is out: this
map does not change geometry that nothing asked it to change.

### A cluster can cross an atom now
`clusterOf` gathered siblings inside one atom, and two clusters do not fit in
one. **Laos and Cambodia** are each drawn in two — the part that stayed French,
in `indochina`, and the part ceded to Thailand in 1941, in `siamgain` — so
hovering Laos on the 1930 map outlined the French half and left the rest of the
country dark, though on that date it was all one country. And the **Straits
Settlements** are five scattered pieces in three atoms: Singapore, Penang,
Malacca and the Dindings in Malaya, Labuan in North Borneo, Christmas Island on
its own. The scoping had been quietly holding two of them out of their own
colony.

It searches `#land` now rather than one atom. Measured on the rendered outline:
hovering Laos in 1930 outlines four paths where it outlined two, hovering the
ceded strip outlines the same four, and hovering Singapore in 1930 outlines
seven where it outlined five.

The 1942 map is the other way round, and `JMAP.CLUSTER_EPOCH` says so:
Battambang, Siem Reap, Sisophon and the trans-Mekong strips were Thailand's by
then, and lighting them with Laos would say the opposite of what had happened.
Hovering Laos in 1942 outlines two paths, and hovering the ceded provinces
names them and outlines Thailand's gains instead.

### The Pacific says whose rule it was, and the Dindings leave the colony
Three small things that had been waiting, all of them about what a label says.

**A sovereignty line in the Pacific.** An atoll in the Carolines answered with
its name, its group, and then "South Seas Mandate" — which carries the
sovereignty inside a longer phrase and leaves the reader to parse out whose it
was. `rule` is a line of its own under the country: *Japanese mandate*, *British
colony*, *American territory*, *British protectorate*, *Mandate — Australia,
Britain and New Zealand*. Twenty records carry it, ten for each date, and the
1942 ones say what had happened to them: *American territory under Japanese
occupation* for Guam and Wake, *British colony under Japanese occupation* for
the Gilberts. It shows in the tooltip and in the detail card, and only where
there is a sub-unit to be the headline — a country hovered on its own is
already answering for itself.

**The Dindings leave the Straits Settlements in 1942.** They were a Settlement
from 1826 and were retroceded to Perak on 16 February 1935, and the name already
said so on the 1942 map; what still happened was that hovering them lit
Singapore, Penang and Malacca, because the cluster is written into the SVG and
the SVG serves both dates. `JMAP.CLUSTER_EPOCH` says which cluster a sub-unit
belongs to on a given date, and `clusterOf` reads it. Measured on the rendered
outline: hovering the Dindings outlines five paths in 1930 and the country's own
fifteen in 1942, and hovering Singapore outlines five in 1930 and four in 1942 —
the Dindings being the one that left.

**Labuan and Christmas Island carry their dates.** Labuan reads "a Crown colony
from 1848, attached to the Straits Settlements in 1907", and Christmas Island
"annexed 1900, a Straits Settlement from 1900 and run from Singapore".

### Aksai Chin and the Pamir were drawn as ocean
The northern top of India and the western end of Sinkiang are the same fault in
two places, and it is not a crack: geoBoundaries' India is the modern one and
stops short of Aksai Chin, the ENP sheet's Sinkiang and Tibet stop at their own
lines, and between the three of them **about a degree and a half of the highest
country on earth had nothing drawn on it at all** — a bay of ocean three hundred
kilometres across in the middle of the continent, with slivers of the same thing
along the Sinkiang–Soviet frontier. The seams could never close it: their reach
is half a degree.

`LAND_BASE` is a list of boxes that are land from corner to corner, painted in
the neutral colour under everything — the same instrument as `chinabase` and
used for the same reason, so that where the sources disagree the gap reads as a
seam rather than as one country leaking into the next. One box does both places:
70–83 E, 29–45 N. Measured by sweeping the region in tenth-degree steps: **453
uncovered points before in the Kashmir box and 153 along the frontier, and none
after**.

For Aksai Chin the neutral answer is also the honest one. Nobody administered it
on either of these dates; the maharaja's claim and China's both covered it, and
it reads now as it reads for Afghanistan and Nepal on this map — Elsewhere. The
box was checked against Issyk-Kul and Lake Balkhash, which Natural Earth's Soviet
Union already covers, so nothing that ought to be water is painted over.

### The Bohai: an island cut in half, and a bite taken out of Shantung
Two faults in that corner, and the second is much the larger.

**The spike** is Shijiutuo, ten kilometres off the Kailan coast. The traced zone
carries islets of its own, and one of them — a six-point ring — sits inside a
coastal island Natural Earth draws with fifty, so the island came out part
shaded and part not: a yellow arrow of unoccupied China in a gulf that was held
all the way round, Tientsin, Tangshan, Chinwangtao and the railway along it. An
island is one place. Where the trace already covers part of one, the whole of it
is drawn held; where the trace does not reach an island at all, nothing is
claimed for it — so this completes the source's own answer and never extends it,
which is the rule the east coast was given when the islands were made to go with
the coast they were blockaded from. **30 islands completed**, tested both ways
round because the commoner case is a small occupied ring sitting on a larger
island rather than the edge of a large ring crossing it.

**The bite** was a semicircle of sea cut out of the Shantung peninsula on the
1942 map, about thirty kilometres across. Weihaiwei's seaward fringe is carved
with a box and the leasehold's own rings under the even-odd rule — but the lease
is a semicircle of ten miles' radius round the bay and the box holds only its
northern, seaward strip. Everything of that semicircle lying outside the box was
not subtracting from anything: it was a shape of its own, painted in the ocean
colour. On the 1930 map the leasehold is drawn over it and nothing showed. On the
1942 map it had been returned to China twelve years earlier, so nothing is drawn
there, and the carve stood exposed with the Jiaodong base area's ruling over it.
The rings are cut to the box before they go into the path. 1930 is unchanged —
the leasehold still sits on its semicircle with no yellow fringe above it.

### One fine window at a time
The file covers fourteen windows holding 1,905 shapes, and a deep zoom anywhere
grafted **all of them**: a reader looking at Okinawa was carrying the Bonins, the
mandate, the Gilberts, New Guinea, five Solomons groups and Wake, and kept them
for the rest of the visit. Each window is grafted on its own now, when the view
reaches it, and taken out again when the view leaves.

Measured: deep on Okinawa, **126 shapes** are grafted and nothing else —
`{ryukyu: 126}` where it used to be all 1,905. Deep on Guadalcanal, five
Solomons windows whose boxes genuinely overlap the view — 557 shapes — and no
Ryukyus. Their boxes do overlap in the Pacific (Wake sits inside the mandate's
and the Gilberts reach into it), so this is a set and not a single answer; what
it will not do is give a reader in the Ryukyus the Solomons.

Taking a window out has to put the map back, and the coarse shapes had been
pruned in place — sub-paths cut out of a `d`, whole shapes marked superseded.
`coarseOrig` records what each shape was the first time anything touched it, and
`reprune()` restores every one of them and prunes again against whatever is
grafted now. That makes it idempotent: nothing depends on the order windows were
added in, and two overlapping windows can be added and removed in any order.
Checked by hashing the `d` and the superseded flag of all **1,434** coarse shapes
— identical at the opening view, after a return from the Ryukyus, and after a
return from the Solomons.

The file itself is still fetched once, in full, and kept parsed; it is 554 KB and
splitting it into fourteen would trade one request for many. What this saves is
the drawing, which is where the cost was.

### Nothing the browse layer knew about a city was lost
Checked rather than assumed, and something had been lost. The gazetteer CSVs
carry a name, a position, a size and a capital mark, and standing the browse
layer down took with it everything else data.js knew about those 170 places:
**131 Japanese readings, 102 Chinese forms and nine notes** — Trincomalee's
fleet base, the railhead of the Burma Road at Lashio, the oil at Tarakan, the
summer capital at Simla, Sabang at the head of Sumatra.

Every one of the 170 browse ids is in the gazetteer under the same id, so the two
are merged rather than one replacing the other: the dot is the gazetteer's and
what is said about the place is both. The 51 quiz sites that are the same place
under the same id give their names too — their notes and dates are not taken,
being about the event the marker stands for, and the marker is drawn over the dot
to say so. The 1930 set now carries 180 Japanese readings and 148 Chinese forms
where it carried none, and all nine notes are back.

The capital line no longer repeats the polity after itself: Delhi read "Capital
of British India · British India · Capital of the Raj from 1911".

### Kengtung has its Thai stripes, and no shading grows with the zoom
Two faults, and the second is the one behind "a diagonal line running out into
the ocean".

**Kengtung had no stripes at all** unless the Administrative layer happened to be
on. `#a-saharat` is a deferred atom — its districts live in the administrative
file — so with that layer off it is an empty group and what the reader sees is
its backing. `buildHatch` copied the atom's own paths and found none. It falls
back to the backing when the atom is empty, which is the same shape. Whose troops
were in the Shan states is not a question about districts, and it should not have
depended on a switch about them.

**Only one of the five shadings was being rescaled.** `rescale()` kept the plain
dark hatch a constant width on screen and left the four coloured ones — the
American stripes over Guadalcanal, the Thai over Kengtung, the Japanese over
Portuguese Timor and the ruling over the Communist base areas — pinned to the map
instead. So they shrank towards nothing at the opening view and grew with every
step of the zoom until a single American band was wider than the headland it
crossed and ran from one coast to the other: a broad diagonal ending at the
water, which is what it looked like. Measured before and after by sweeping the
whole island: **no hatch geometry lies outside the shape at any zoom, before or
after** — the hatch path is a copy of the drawn path, so it cannot — and the
stripe pitch now holds constant from a viewBox 280 units wide down to 28.

`HATCH_IDS` names the five patterns and the way each is turned; the base areas
are ruled the other way from the occupation's own stripes so that where the two
cross both can be read, and that survives the rescaling.

### A hovered Indian province shows its neighbours over the princely states
British India's provinces are built from modern first-level units, so they cover
the whole subcontinent, and the princely layer is painted on top of them. Every
province boundary that threads between the Deccan states, the Punjab hill states
or the Eastern States was therefore buried: measured by sampling 4,118 points
along the thirteen drawn boundaries, **1,168 of them — 28.4 per cent — had a
princely state over them.** The province under the pointer was never affected,
because its outline goes into the highlight layer above everything; it was the
neighbours, which are the thing the reader is being shown.

`#subs-lift` is a group above all of `#land` and below the standing outlines and
the labels. While the subs atom is one named in `SUBS_LIFT` — India alone — its
province paths are copied there stroke-only, and `.lifted` takes the stroke off
the paths in place, so each boundary is drawn exactly once and the only change is
which layer it is in. It comes and goes with the pointer and with the
Administrative switch, checked: a British province gives thirteen lifted lines, a
princely state none, China none, and switching the layer off clears them.

Two effects worth stating. A shared boundary now reads at its full 0.8 width: in
place, the province drawn later covered half of the stroke centred on their
common edge, so India's internal lines were at half strength and asymmetric.
And the lifted lines pass over Goa and Pondicherry, which are drawn after India
and are three pixels across. Copying the lines instead of moving them, and
clipping them to the princely layer, would have left both alone — but that is a
321 KB clip path re-rasterised on every zoom frame while the pointer sits on
India, which is not worth a hairline's width.

### Breaks deep inland when a country is hovered
Hovering China with the Administrative layer off drew short strokes floating in
the interior with nothing to explain them, and the same in Manchuria. They were
real rings: China's backing carried **twenty-one closed rings inside its own
mainland outline**, several of them bare three-point triangles — the residue of
dissolving provinces whose edges do not quite meet. Invisible in the fill, which
covers them, and not invisible when the country is hovered, because the
selection outline traces every ring it is given.

`drop_interior_slivers` removes any ring under three square units — about
95 km² — that lies inside the largest ring of the same shape. China goes from 21
to 7 and the Philippines from 1 to 0. The seven that stay are real: 18 to 60
points each and compactness 0.24 to 0.55, which is a shape rather than a
splinter — delta and river islands that happen to sit inside the outline. The
threshold separates the two cleanly; nothing between 2.1 and 4.3 square units
exists to argue about.

### Every Senkaku island explains the dispute, not just the group
The note was on the group, `the Senkaku / Diaoyu Islands`, and the group is what
the coarse map draws. At deep zoom the fine coastlines take over and OSM names
the islands separately — Uotsuri Shima, Kuba-shima, Kuba Island — so those
answered with a bare name while the group beside them explained the dispute.
All three carry the note now, with their Japanese and Chinese names. It shows on
both dates: the record is in `JMAP.PROVINCES`, which is not epoch-keyed.

### The occupied zone is traced, not assembled from six blocks
`tools/cache/japanese-occupied-territory-1941-2-v2.geojson` replaces the six
hand-drawn polygons of `OCCUPIED_ZONE`: **722 rings and 6,461 vertices** against
six generalised blocks, with Hainan, the Canton delta, Swatow, Chungming, the
Chusan archipelago and seven hundred islets drawn separately instead of being
swept into a block or clipped out of one. A million square kilometres in all.

The clip to China's land stays, and I took it off for a while having seen only
half of what it does. The obvious half is the coast. The other half is that the
clip is China's provinces and China's outline, and Mengjiang and Manchukuo are
atoms of their own — so it is also what keeps the shading off them. Without it
the occupation painted straight over both, and reordering could not fix that:
with the Administrative layer off those two are drawn by their *backing*, and
the backings live at the head of the layer stack, so nothing drawn later can
ever be underneath one. Checked by sampling the rendered pixels rather than the
geometry, which is the only test that sees a clip at all: Chahar, Suiyuan, Jehol
and Manchuria all read 241,92,75, the client-state colour, and Peking reads
251,128,114, the occupation's.

**The order it is drawn in** is the point of the change as much as the geometry.
`occupiedzone` now has a slot in `ORDER` between Guangzhouwan and Chahar: over
China, whose ground it is, and under Mengjiang and Manchukuo, which were client
states with a colour of their own and not part of the shading. The resistance
areas stay above it, being in `ON_TOP`, because they are what the shading is an
overstatement of. It needed a second small change — `ordered` filtered itself
down to keys that appear in `paths`, and this is a slot rather than an atom, so
it had to be let through.

The six region names survive. `OCCUPIED_ZONE` is kept, not deleted, and each
traced ring takes the name of whichever block its centroid falls in, with
islets going to the nearest — so the pointer still says North China and the
Yangtze valley, Hainan, the Canton delta, Amoy and Kinmen, Swatow and Chaochow.
Five of six; the Paotow corridor is gone because it was removed from the map
earlier.

**The line of control follows it.** `china_front()` takes the inland edge off
the traced outline now. The mainland ring is one closed line, part coast and
part front, and between two known points on a closed ring there are exactly two
arcs: the wanted one is the westerly, the front running down through Shansi,
Honan, Hupeh and Kiangsi at about 111–114 E, against the Yellow River mouth,
the Gulf of Chihli and the Shantung coast at 118–122 going the other way. Mean
longitude separates them with a wide margin and needs no coastline test.
Measured on the rendered geometry: the dashed line sits a median of **1.08 km**
from the edge of the shading, p90 2.57. The hand-drawn blocks remain as the
fallback if the file is ever missing.

### The cities are a gazetteer now, drawn as a map draws cities
444 places in 1930 and 446 in 1942, from `data/cities-1930.csv` and
`data/cities-1942.csv`. `tools/build_cities.py` takes the four columns the map
needs out of the forty the CSVs carry — where, how big, whether a capital, of
what — and writes `cities-gaz.js`.

Two things are said at once and the symbols keep them apart. **Size** is the
dot: four radii for the four tiers, 1.7 to 5.4 px. **Kind** is the mark around
it: nothing for a town, a ring for a provincial capital, a square for the
capital of a country or a territory. Cartographic convention rather than
invention, and it means a large provincial capital and a small one read as the
same kind of place at different sizes, which is the point. Black, because every
colour on this map already means sovereignty and a city is not a claim about
who held it — the territory underneath is already saying that.

1930 gives 9 largest, 41 large, 141 medium, 253 small, with 183 provincial and
46 territorial capitals; 1942 gives 15 / 52 / 150 / 229, with 198 and 52. The
two dates differ in more than size: Hsinking is a capital in 1942 and little in
1930, and the polity column moves a third of China from "Republic of China" to
"Occupied China" and "Free China".

The tiers come in with the zoom, as the labels do — the largest nine at the
opening view, everything by the time a reader has closed in on a province. Four
hundred dots at full extent is a rash rather than a map.

**Nothing was deleted.** The old browse layer is the same 170 places in one
undifferentiated grey; it and its data.js records are untouched and simply
stand down while the gazetteer is there — `!JMAP.GAZ && browseVisible()` — so
removing `cities-gaz.js` restores exactly what was there before. The quiz
markers stay on top: where a gazetteer city is also a quiz site the coloured
marker sits over the black dot, which reads as "this one is asked about".

The dots are named and hoverable on the same machinery as everything else,
which took three small things: their ids are prefixed `g_<epoch>_` because 222
of these places are already in data.js under the same name and two records
under one key is one record; `recordFor` had to be taught to see `.gaz` as well
as `.site` and `.browse`; and the name lives in `en`, which is what `nameOf`
reads. A capital's line — "Provincial capital — Hunan", "Capital of Manchukuo"
— goes in `when`, which is the field the tooltip puts under a name.

The legend now explains the four marks instead of advertising the browse layer.
`tools/bundle.py` inlines the new file, which it had to be told about.

### A second source for China's provinces, and a switch between them
The answer to "is there a better GIS source for Republican provinces that is
also fine along the coast" turned out to be yes, and not from any of the
institutional projects — CHGIS stops at 1911, Academia Sinica's vectors stop at
the Qing and forbid web use, and the China Data Center's 1:100,000 sheets are
campus-only. It is a Wikimedia Commons SVG by user Lilauid, traced from the AMS
1:250,000 China series, CC BY-SA 4.0.

It is a drawing and not a dataset: no coordinate system, boundaries as open
arcs, areas nowhere at all. `tools/roc_provinces.py` does three things to it.

**Georeferenced** from the frame its base map states — equidistant conic,
central meridian 104 E, central parallel 36 N, standard parallels 30 and 42 N,
the central meridian running 57.0 N at the top of the frame to 17.96 N at the
bottom. That fixes the scale at 4,618.1 m to the SVG unit and checks itself: it
puts 37°28.8′ at the vertical centre against the 37°29′ the page states. Two
things the page does not give were fitted against Natural Earth's coastline —
the central meridian sits 12.0 units right of the viewBox centre and the frame
top is 2,500 m north of 57.0 N. The scale needed no adjustment at all, which is
the sign of a model rather than a curve fit. Result: **the drawn coastline lands
a median of 0.59 km from Natural Earth's, p90 1.10.**

**Polygonised** by noding 省界, 國界 and 海岸線 into a planar arrangement —
65,734 segments — and traversing its faces. Seven coastal provinces do carry
closed fills, but the interior ones are lines only, so the general answer was
needed rather than a special case.

**Named** by asking ENP which province each face's interior point falls in.
ENP's positions are the thing being replaced; its identities are right, and
identity is all that is borrowed. All 28 provinces came out named with no hand
work, and 76 faces went unnamed — Mongolia, the USSR, Korea, Japan, India,
Burma, 4.18M km² that ENP does not cover, correctly left out.

Measured: 28 provinces, 49,630 vertices against ENP's 20,400 for its whole
sheet. Interior provinces improve six to thirteen times — Shanxi 21.4 km per
vertex to 1.69, Henan 20.0 to 1.66, Hebei 11.0 to 1.40, Xinjiang 27.6 to 5.18 —
and the two-populations problem is gone: the spread across all 28 is 1.2 to 7.6
km per vertex instead of 1.2 to 28. Areas agree with ENP's within ±8% for 20 of
the 28. Zhejiang and Fujian come out slightly coarser than ENP, which is the
honest trade: ENP's coast was always its good half.

**The switch** is a radio in Layers, ENP by default, and it swaps only the
divisions inside the eight ENP atoms — coastlines, country outlines and
everything outside China are untouched, because the fault reported was a
sub-unit boundary and nothing else needed to move. The alternative goes in
`japan-empire-map-roc.svg` (683 KB) and is fetched only if asked for. The two
sets are held apart rather than hidden: a hidden path still answers
`querySelectorAll`, and every sweep over sub-units would otherwise see both
sources and draw each boundary twice.

Measured on the rendered geometry in the live page, the Shaanxi–Shanxi boundary
against the drawn Yellow River: **ENP 30.51 km median and 2% within 3 km; the
alternative 0.96 km and 64%**; switching back gives 30.51 again, so the swap is
reversible and lossless. The three existing SVGs are byte-identical to what they
were before any of this.

Kept in mind and stated in Sources: it is 1936, so it predates Sikang's
promotion in 1939 and draws Manchuria as one disputed block — ENP's Manchurian
provinces are kept underneath for that reason, Kirin being the one province the
new source has no answer for. And it is one contributor's careful tracing rather
than a scholarly release; the two measurements above are the only check on it
there is. Hence ENP stays the default.

Also fixed on the way past: the Layers panel still credited Gordon by name for
the line of control, which had been taken out of the legend and reworded in
Sources but not there.

### The ENP sheet's interior boundaries, and a note in Sources
Asked why the Yellow River does not follow the eastern border of Shaanxi, which
historically it is. The river is right and the border is wrong, and the fault is
not confined to Shaanxi.

Fresh geometry was fetched from OSM for comparison — 黄河 and 长江/金沙江,
227 and 182 ways. Our Yellow River, Natural Earth's, sits a median of 0.5 km
from it through the gorge and within a kilometre of Hukou waterfall, Yumenkou
and Fugu; our Yangtze is within 0.6–1.4 km of OSM along its whole length. The
ENP Shaanxi–Shanxi boundary is 20–36 km east of the river at every parallel
measured, always east, which hands Shaanxi some 15,500 km² of Shanxi's west
bank. Shaanxi's east edge and Shanxi's west edge are identical to four decimals,
so the sheet is internally consistent and externally wrong.

Then the general case, 47 adjacent province pairs against Natural Earth's 10m
admin-1: median of medians 9.0 km, worst 37.2 (Hebei–Shanxi), best 2.4
(Fujian–Zhejiang). Shaanxi–Shanxi at 28.2 km is second, not unique — it is
simply the only place where something independent and well drawn crosses the
same ground and gives the error away.

The sheet is two datasets in one. Its coastline is within 1.49 km of Natural
Earth's at Shandong and runs 1–4 km per vertex; its interior boundaries run
17–28 km per vertex and 9–12 km out of place. And over 1,478 shared boundary
vertices the mean offset is 3.7 km against a mean magnitude of 12.1 km, so the
error scatters rather than shifts — the opposite signature from the Wuhan
azimuthal-equidistant bug, and not something a transform can undo.

Nothing was changed in the geometry. `sources.html` now carries a short note
under the ENP entry saying what the sheet is good at and where it is not, in
the same terms.

### The build takes 12 seconds instead of 133
Measured first, and the profile was blunt: `point_in_ring` and the bounding-box
scan above it were **107 seconds of the 133**, called 873,000 times by the
frontier seams, each call a linear walk of a ring averaging about 1,900
vertices. Everything else in the build put together was 26 seconds.

Five changes, each switchable, and `--legacy` turns off all five to get the old
build back. None of them may change the output, and the check is that the three
SVGs come out byte for byte identical either way. Verified across seven
configurations — `--legacy`, the default, `--jobs 0`, `--probe-bound`,
`--no-fast-name`, `--no-index`, and the default again off a warm cache — all
seven giving `f206013869cf / fc1faffe3e0b / f4bc0551f972`, which is what the
build produced before any of this was written.

| | | serial | with `--jobs 0` |
| --- | --- | ---: | ---: |
| `--legacy` | the old build | 135.3 s | — |
| default, cold cache | | 14.8 s | 13.1 s |
| default, warm cache | | 12.1 s | 12.0 s |

**A — `_RingBands`, the one that mattered.** A ring's edges are bucketed by
latitude band, and a crossing test looks only in the band the query falls in: an
edge whose y-span does not straddle the query can never be counted, so there is
no reason to look at it. Two thousand vertices become a couple of dozen. The
ring bounding boxes went into a coarse grid at the same time — those were a flat
scan of about a hundred and sixty boxes per query, seven per cent of the build
on their own. This is the whole win: **133.6 s → 15.1 s**, and with it switched
off (`--no-index`) the build is back to 133.6 s whatever else is on.

**B — the seams are cached on disk.** They depend only on the source rings and
the seam constants, so they are computed once and read back. Worth 2.7 s on top,
which is small against A but is the whole seam phase, so it will stay flat if the
geometry grows.

The cache is keyed on a hash of the *source* of the functions that compute it —
`push_seam`, `_ring_test`, `_ring_normal`, `_grid_of`, `_nearest_in`,
`_near_grid`, `signed_ring_area`, `add_neighbour_seams` — together with every
`SEAM_*` constant, the three tables of who reaches whom, and the coordinates of
every ring involved. A version number would have been the usual way and is the
wrong way here: the failure it invites is silent, a changed search answered out
of a cache written before the change, and the symptom is geometry that quietly
does not match the code claiming to have made it. Reading the source costs a
millisecond and cannot be forgotten. Checked: moving one vertex by 1e-6°
invalidates it, changing `SEAM_STEP` invalidates it, and a function whose source
cannot be read at all disables the cache rather than trusting it.

**C — the probe lower bound: implemented, measured, and off by default.** A
probe lands inside the target only if the segment to it crosses the target's
boundary, so no probe shorter than (distance to the nearest target vertex) minus
(longest edge in the target) can succeed, and the thirty-three steps outward can
start where success first becomes possible. The bound is sound and it does skip
the probes. It is also a net **loss of 0.6 s** over three paired runs, because
with A in place a probe costs about two microseconds instead of a hundred and
seventy and the extra nearest-vertex lookup the bound needs costs more than the
probes it saves. It is `--probe-bound`, opt-in, and worth having only with
`--no-index`. Left in because it is correct and cheap to keep, not because it
pays.

**D — `--jobs N` for the seam search.** The twenty-five searches do not talk to
each other. Results are collected in job order, so which worker finishes first
cannot change the answer. Worth 1.7 s on a cold cache and nothing on a warm one —
again small only because A already took the phase down to 3.3 s. Default is 1;
`--jobs 0` is one per core.

**E — the OSM names are indexed.** `_name_rings` compared every fine ring with
every name, 4.2 million bounding-box overlaps. A name can only win by
overlapping the ring's box or by having its point inside the ring, and both are
local, so the names go in a grid and a ring asks only the cells its own box
covers. Worth 2.5 s.

The lesson worth keeping: four of the five are worth between nothing and two and
a half seconds, and one is worth two minutes. The profile said so before any of
it was written, and the two that were guessed at rather than measured — C and D —
are the two that did not pay.

### The ocean boundary round occupied China — the real one
Reported four times, and I twice said it was something else. It is the
**outline of a block of the occupied zone when the pointer is on that block**.

The traced blocks run a long way out to sea deliberately: the layer is clipped
to China's land, so the clip finds the coast instead of a hand-drawn line
threading the offshore islands. `outlineOf` in `map.js` reads that clip with
`el.getAttribute('clip-path')` — and the clip sits on the atom's group,
`#a-occupiedzone`, while a sub-unit outline is handed the child path, which
carries none. So the territory outline and the selection outline were clipped
and correct, and the sub-unit outline alone was drawn raw: the block's ocean
edge, stroked at 2px as a smooth curve across the East China Sea from the
Chekiang front up to the Gulf of Chihli.

`clipOf(node)` walks up to the first ancestor with a clip and is used instead.
Measured before and after by sampling every drawn path for geometry in the
open-sea box 122.4–124.5 E, 29.5–34 N: one unclipped stroke of 151 points
there before, none after, and the hovered block gains the coastal half of its
outline, which it had been missing. `#a-occupiedzone` is the only clipped
element in any of the three SVGs, so nothing else can be affected.

The two earlier answers were both wrong about *this* symptom, though each was a
real fault and each is fixed:

### The line of control comes in off the water
`hug_coast` only ever pushed vertices that were on land out to sea; it never
pulled a vertex that was out at sea back in. The hand-traced course stands a
long way off Chekiang, and drawn there it is a curve across the East China Sea
with nothing on either side of it. A vertex further from the shore than the
offshore margin is now brought back to it, and the same averaging smooths the
result. Not the reported ocean boundary: that line is dashed and red, and the
one being reported is a solid dark hairline.

### The splinter across Brunei Bay
A seam is a ribbon along a frontier. `SEAM_ASPECT` throws away any strip more
than nine times longer than it is wide, which is not a ribbon but a splinter
thrown across a bay. That was the line between the headlands either side of
Brunei Bay, and it is the third and last of the seam faults from yesterday.

### Weihaiwei's seaward fringe
Carved like Guangzhou Bay, but with a box rather than a hull: the leasehold is
an arc of coast, so its hull's chord runs across Chinese land inland and
carving that would take away ground the province is right about. The box holds
only the water side — 121.94 to 122.30 E, 37.50 to 37.60 N — and everything in
it that the leasehold does not cover is drawn as sea.

### The princely states and the provinces answer differently
Hovering a princely state: the whole layer lightens, which says "these are the
states, there are six hundred of them", and the one under the pointer goes to a
flat #F5F0F1 and takes the only outline on the map. Hovering a province of
British India proper: that province darkens and is outlined, its neighbours get
the thin line the Administrative layer draws for the country under the pointer,
and the princely states are left entirely alone — they are not divisions of the
Raj and have nothing to do with the question being asked.

### The rivers are rounded off
They were thinned at 0.4 units and drawn as they came, which at any depth of
zoom is a line of hard little corners. `RIVER_TOLERANCE` is 0.2 now and
`RIVER_SMOOTH` rounds them twice by corner-cutting. Chaikin puts each new
vertex a quarter of the way along an existing segment, so nothing strays
further from the original course than a quarter of a segment — about a tenth of
a unit here, a twentieth of a pixel at the opening view. The line is softened,
not moved.

**Performance:** none worth measuring. The two rivers go from about 1,600
points to about 13,000 — halving the tolerance roughly doubles them and each
rounding pass doubles them again. That is still one SVG path element per river,
rasterised once per zoom change and untouched while panning, and 13,000 points
is a fifth of what a single Chinese province carries. The map grew 40 KB.
Set `RIVER_SMOOTH = 0` and `RIVER_TOLERANCE = 0.4` for exactly what was there
before; the previous file is in git at `d638f82`.

### Thailand's spikes across the Andaman Sea
Two faults in `push_seam`, both mine and both from the same afternoon. A strip
is a quadrilateral per pair of vertices, and Natural Earth's rings can put two
consecutive vertices two degrees apart along a coast — so a run of two made a
strip two degrees long and half a degree wide. `SEAM_MIN_RUN` is back to 3 and
`SEAM_STRIDE` breaks a run wherever its own vertices are further apart than a
strip is wide. And the "aim straight at the nearest bit of the target"
direction, added to close the Altai corner, was given the whole reach: from the
Siamese coast the nearest scrap of British Malaya is on an island across a
strait, and the strip laid between them was a spike of Siam over open water.
`SEAM_AIM` caps that direction at a fifth of a degree; the normals keep the
full reach.

### The line of control steps down the coast instead of stepping
`hug_coast` moved each vertex on its own — one a hair inland, the next well
inland, the next inside a keep-box and not moved at all — and applied raw that
came out as a flight of right angles, worst around Amoy. It computes the
displacement for every vertex first, averages it over a window of seven, and
applies that; a final pass pushes out anything the averaging left on land. The
stretch moves together and the line keeps the shape of the coast.

### Nothing is outlined except the country under the pointer
The Straits Settlements were the last exception, and Malacca's landward border
stood there as a line with nothing to say until the pointer arrived. The
princely states went the same way an hour earlier. A boundary on this map is an
answer to a question now, and the question is where the pointer is.

### The base areas in Pinyin
Jiāodōng, Qīnghé, Lǔzhōng, Lǔnán and Bīnhǎi, Sūběi, Huáiběi, Huáinán,
Sūzhōng, Sūnán, Wǎnjiāng, Zhèdōng, Jìnsuí, Jìnchájì, Jìnán, Tàiháng and
Tàiyuè, Jìlǔyù, Èyùwǎn, Shǎngānníng — with tone marks and without the hyphens,
in place of the Wade-Giles they were written in.

### Guangzhou Bay is cut out of China with a fill rule
The ENP sheet's Kwangtung is coarse enough to cover the bay and every one of
its tidal creeks, so the country showed through each channel of the leasehold
traced over it. The patch is one path holding the leasehold's own convex hull
and then the leasehold's rings, filled by the even-odd rule so that what is
painted is the hull minus the leasehold — a polygon difference done with a fill
rule, there being no polygon difference anywhere in this build. Drawn in the
ocean colour, under the leasehold and over everything else.

The hull rather than a bounding box: a box leaves its corners standing out over
the mainland as rectangles of ocean, which is what the first attempt did. The
hull touches the leasehold at every extreme and cuts nothing the leasehold does
not already reach around. Natural Earth's coastline was tried as the cutter
first and is not fine enough — it resolves the bay but not the creeks, and left
half the fringe behind.

### The base areas answer with the region they belong to
Seventy-five shapes traced from a sheet that labels its regions and not its
polygons. `CCP_ZONES` is eighteen boxes — Shaan-Gan-Ning, Jin-Sui, Jin-Cha-Ji,
Chi-nan, Taihang and Taiyue, Chi-Lu-Yü, Ch'ing-ho, Chiao-tung, Lu-chung, Lu-nan
and Pin-hai, Su-pei, Huai-pei, Huai-nan, Su-chung, Su-nan, Wan-chiang, Che-tung
and O-Yü-Wan — and every shape takes the name of the first box its centroid
falls in. Nothing is drawn for the boxes and no polygon is touched; they only
decide which name a shape carries. All 75 are placed.

This is a grouping and not a boundary: the areas moved from month to month,
their edges are not these rectangles, and a patch near a border may well be
filed under its neighbour. What the reader gets is the name of the region they
are looking at, which is what the sheet's own labels give. No historical
context is attached, per the request.

### Pinyin first, with tones, everywhere in China
124 names. Every Chinese city and event carries the present-day Pinyin with its
tone marks as the headline and the period spelling in brackets — Běijīng
(Peking / Peiping), Chóngqìng (Chungking), Wūlǔmùqí (Urumchi) — and so now do
the provinces (Shāndōng, Guǎngdōng, Jiāngsū, Hēilóngjiāng) and the territories
that were named in Chinese: Guǎngzhōuwān (Kwangchowan), Wēihǎiwèi, Měngjiāng,
Xiàmén (Amoy), Shàntóu (Swatow), Hǎinán. Places whose English name is an
English phrase rather than a romanisation keep it: the Kwantung Leased
Territory, the Republic of China, Manchukuo, Hong Kong, Macao.

### Christmas Island is inside the line of control
The perimeter ran along the south of Java and left it out. It dips south round
the island now. Checked by point-in-fill against the drawn perimeter: Christmas
Island and Java inside, Cocos, Merauke and Port Moresby outside, Wewak inside.

### The princely states, and sources.html
Only the state under the pointer is outlined now; the whole layer lightens and
desaturates when any of them is hovered, so the set is still visible as a set,
and the one being pointed at darkens and saturates against it. Six hundred
outlines at once is a mesh rather than a map.

sources.html could not be scrolled. It loads styles.css, which belongs to an
app shell that must never scroll — `html, body { height: 100%; overflow:
hidden }` and a flex column — so the page showed its first screenful and
nothing else. It undoes all three.

### The QGIS layers were in the wrong place, and it was the projection
This is the cause of a long run of things that have been treated as separate
problems for days: the fringe of China above Weihaiwei, the mess round
Kwangchowwan, the flecks along Kwantung's coast, and part of the gaps at the
Nepal, Sikkim and Bhutan frontiers.

The layers are stored in a projected CRS, not in longitude and latitude. Their
GeoPackages declare an azimuthal-equidistant grid centred on Wuhan
(114.29925 E, 30.591623 N), false easting and northing 50,000, on the **Clarke
1866 ellipsoid**. `gpkg.aeqd_to_lonlat` inverted it with the *spherical*
formula, using Clarke 1866's semi-major axis as though it were a radius. The
comment claimed the error would be a few hundred metres. Measured against the
ellipsoidal inversion, it is:

| layer | error |
| --- | --- |
| Sikkim, Bhutan, Nepal | 2.3 – 2.6 km |
| Weihaiwei | 2.8 km |
| Kwantung leasehold | 3.3 km |
| Kwangchowwan | 5.1 km |
| Tannu Tuva | 5.8 km |

The error grows with distance from Wuhan and points radially outward from it,
which is exactly the signature of treating an ellipsoid as a sphere. Every one
of those layers was drawn that far from where its author put it.

An azimuthal-equidistant grid stores, for each point, its true bearing and its
true distance from the centre, so inverting it *is* the geodesic direct
problem: go `hypot(x, y)` metres from Wuhan on bearing `atan2(x, y)`, on the
ellipsoid the CRS names. That is what PROJ does for an ellipsoidal `aeqd` and
so what QGIS did when the layers were drawn. `tools/gpkg.py` now solves it with
Vincenty's direct formula — no dependencies, converges to a millimetre.

Measured afterwards: the gap between Weihaiwei's northern shore and the
Shantung coast went from a median of 3.0 km to a median of 170 m, with a
maximum of 830 m. The vertex nudge added an hour earlier to paper over that gap
is removed, and `GIS_VERTEX_NUDGE` is empty again.

### The line of control across New Guinea was wrong, and is redrawn
It ran offshore across the mouth of the Gulf of Papua and along the south
coast, which put the whole island inside Japanese control — Merauke, Daru, the
Fly delta, Kerema, Yule Island and the rear of the Kokoda campaign with them.
None of that was Japanese at the end of 1942. Merauke flew the Dutch flag for
the whole war and Merauke Force was raised there on 31 December 1942, this
map's own date; the Gulf coast was Australian throughout; Kokoda had been
retaken on 2 November; Wanigela had been an Allied airhead since October and
Milne Bay Australian since September. What Japan held in New Guinea was the
north coast and the far west — Sorong, Fak-Fak, Manokwari, Hollandia, Aitape,
Wewak and Madang, both taken in mid-December, Lae, Salamaua, Finschhafen and
the forward post at Mubo — and in Papua nothing but the Buna–Sanananda
beachhead, which was being reduced as the year ended.

The line now crosses the Arafura Sea east of the Aru Islands, comes ashore on
the Asmat coast, runs along the southern flank of the central range leaving
Merauke and the Digul outside, follows the divide of the Territory of New
Guinea, passes between Salamaua and Wau, comes down the northern slope of the
Owen Stanleys and out to sea past the beachhead. Checked against forty-five
named places, before and after the smoothing: Aru, Nabire, Sarmi, Hollandia,
Aitape, Wewak, Madang, Lae, Salamaua, Mubo, Finschhafen, Sanananda, Buna
Mission and Cape Endaiadere inside; Merauke, Kimaam, Tanah Merah, Telefomin,
Mount Hagen, Kundiawa, Goroka, Bulolo, Wau, Port Moresby, Kokoda, Dobodura, Oro
Bay, Pongani, Tufi, Wanigela, Goodenough, Kiriwina, Milne Bay and Woodlark
outside.

Three generalisations a single perimeter cannot avoid, and which the line
therefore makes: the Asmat and Mimika south coast falls inside, though neither
side was on it; the interior of Dutch New Guinea and the Sepik, Ramu and
Markham valleys fall inside, though Japan held only coastal enclaves there; and
Gona, taken on 9 December, falls inside the beachhead nub, being ten kilometres
from Sanananda. Sources: Dudley McCarthy, *South-West Pacific Area — First
Year: Kokoda to Wau* (AWM 1959); Samuel Milner, *Victory in Papua*; the DVA
Anzac Portal on the beachheads and the Kokoda campaign; and the Wikipedia
articles on Merauke Force, Wewak Harbour, Buna–Gona, Oivi–Gorari and Goodenough
Island.

**Still to settle:** the *colour* has not been changed to match. All of New
Guinea is still drawn in the occupation salmon, so the line now says one thing
and the fill another.

### Guadalcanal kept its stripes at depth
The American stripes vanished as soon as a reader zoomed in far enough for the
island's real coastline to load. They are copies of the atom's own shapes, and
the sweep that stands a coarse shape down once a finer one has taken over walks
every path in `#land` — which included them. The hatching is built by a
function of its own now and rebuilt after the fine coastlines graft in, so it
follows the finer shape instead of being hidden with the coarser one.

### Nothing of Manchuria shows inside the Kwantung leasehold
The yellow chips round Pulandian bay and among the islands off Dairen were
Natural Earth's coastal islands. They are given to whichever Republican
province is nearest, and the leasehold is cut out of Liaoning and knows only
what Liaoning knows — so Manchuria's filler carried them and the leasehold
drawn over it did not. An island inside the cut now goes to the leasehold too.

### The Altai corner, and a seam that can turn a corner
`push_seam` tried two directions, both along the normal to the line it was
moving. Where two countries meet at an angle rather than run alongside each
other that is the wrong pair: at the Altai corner, where Xinjiang, Mongolia and
the Soviet Union come together, the normal to Mongolia's line points along the
gap instead of across it, and a twenty-kilometre wedge stayed open. It now also
tries straight at the nearest piece of the target, reaches half a degree
instead of a third, and overshoots the first point inside by a few kilometres
so that three strips meeting at a corner overlap rather than merely touch. Two
slivers survive at the exact triple point.

### Weihaiwei's northernmost point, and nothing else
Moved 0.021° north — about two kilometres, which is what the ENP sheet puts
between it and the Shantung coast there — tapering to nothing over the four
vertices either side so the shore does not come to a needle. Stated in
`GIS_VERTEX_NUDGE` as a point and a distance rather than as a redrawn polygon.
It does not close the fringe along the rest of that shore: the two sources
disagree by two to five kilometres for the whole northern arc, vertices 68 to
102 of the main ring, and only shifting that whole run would clear it. That is
a change to the traced shape and has not been made.

### Smaller things
Sikkim has a colour of its own, lighter than the Raj it was not part of and
pinker than Bhutan next door. The Okinawa label reads Ryūkyū rather than
Loochoo. The base-area hatching is denser again — 2.5 units between lines
rather than 3.6, at a finer stroke.

### The line of control stays off the coast
It was traced by hand against a coarser coastline than the map now draws, so
along Fukien it wandered a few kilometres inland and across the Leizhou
peninsula it cut over unoccupied land — and a line of control drawn over
unoccupied ground says something about that ground which is not true.
`hug_coast` walks the smoothed line and moves every vertex that has ended up on
land out along the line's own normal until it is clear of the shore and then
about six kilometres further. Which way is seaward is not asked in advance:
both are tried and whichever gets off the land in fewer steps wins, which is
the right answer on a peninsula as well as on a straight shore. Four stretches
are exempt, being inland on purpose because the ground inside them was held:
Amoy and Kinmen, Swatow and Chaochow, the Canton delta, and the detour round
Kwangchowwan.

### The zoom buttons were dead to the mouse
All three of them, since whenever the pointer capture was added. They sit
inside the map's own box, so a press on one reached `onPointerDown` first,
which captures the pointer to the container — and the click that follows is
then delivered to the container and never to the button. The reset button is
the one anybody noticed, because the wheel does the other two. `onPointerDown`
now leaves buttons, links and inputs alone.

### The selection outline traces the shape it is on
The outline is a stroke with everything inside the shape masked away, so what
shows is the outer half of it — which makes the stroke width a limit on how
fine a line it can trace: an inlet narrower than the visible half is bridged by
the stroke on either side and comes out as a straight line across the bay. At
six pixels, Manchukuo's outline cut every small bay off its Soviet frontier and
read as a visibly coarser line than the fill underneath it. 2.4 for the
selection, 2 for the hover. The mask is also sized to the shape now rather than
to the whole map, so its offscreen buffer is spent where the shape is.

### The line of control takes in Kwangchowwan and leaves Leizhou out
It ran round the whole peninsula. It turns inland round the leasehold now —
north, west and south of it — and returns to the coast before going on through
the Qiongzhou strait, so the rest of Leizhou stays outside and Hainan inside.
This is the one place on that coast where the line and the colour disagree, and
deliberately: the leasehold is drawn French because that is whose it was, and
sits inside the line because Japanese forces were in it. The formal occupation
is February 1943, two months after this map's date; the arrangement with Vichy
that put them there is not.

### The Communist base areas, over the occupied shading
Seventy-five areas traced from sheet 199 of 武月星主編《中國抗日戰爭史地圖集：
1931–1945》, in `tools/cache/ccp-resistance-areas-1941-1942-p199.geojson`.
Drawn on the 1942 map only, as the atom `ccp`, over everything else — the
`hatch-ccp` pattern is rotated the other way from the occupation's own stripes
so that where the two cross, which is most of where these are, both can be
read: Japanese authority claimed here, and not held. Full detail, no dissolve,
no minimum area, so all 75 arrive as traced. They are hoverable and have a
legend row of their own.

This is the other half of a sentence the map has been making since the
occupied zone was drawn: that the shading is an approximation and a generous
one. Free China's note used to end "The Communist base area lay around Yenan",
which was doing that work in words; the map does it now.

### The hand-traced layers are drawn as they arrive
Three things were being done to the Modern East Asia GIS layers and all three
were wrong. Weihaiwei was nudged 0.014° north to close a fringe, which moves a
traced boundary off the ground it was traced from. Every layer was simplified
by span, which gave Bhutan — long and thin, 3.4° across — the coarsest band in
the build, about three kilometres, and folded its outline over itself into a
hole. And every layer went through `dissolve`, which cancels the edges two
rings share and is meant for provinces that abut: Kwangchowwan is six separate
pieces round a bay and Weihaiwei is a headland and three islands, and the
dissolve re-chained them into nonsense. `GIS_NUDGE` is empty, the layers are in
`FULL_DETAIL` and in a new `NO_DISSOLVE`, and their minimum area is zero, so
Weihaiwei keeps all four of its pieces instead of two. The files in
`tools/cache/gis/` were checked byte for byte against the originals in Dropbox
and are identical; nothing needed reimporting.

### Seams are a layer of their own, not part of anyone's shape
They were being added to each atom's own path, which meant they were traced
whenever that country was selected. That is where the black line cutting across
Tibet into India came from, and the doubled border round Thailand, and the
scribbles along every frontier of China and the Soviet Union. `<g id="seams">`
sits under the backings and under every atom, takes its atom's fill, and has no
stroke and no pointer.

With that fixed the seam machinery could be widened. `push_seam` now closes any
pair of frontiers, and `ELSEWHERE_SEAMS` lists twelve more: India to Nepal,
Sikkim and Bhutan, India to Burma, Siam to its four neighbours, Indochina to
Siam, the Soviet Union to Mongolia and Korea, and the Borneo three to each
other. 785 strips in all. The blue slivers round Bhutan and along the Nepal
frontier are gone.

### The Kwantung leasehold keeps Liaoning's islands
The yellow flecks all round it were the country underneath showing through
where the leasehold had thrown its islands away: the clip kept only pieces
above 0.0015 square degrees, so the Changshan group and the rocks off Dairen
were in Liaoning and not in the leasehold drawn over it. It takes every piece
now — 105 rings instead of 5. (Drawing it from the traced
`kwantung_leased_territory.gpkg` was tried first and is worse: that coastline
is not the ENP sheet's, and it left a yellow rim along the whole shore.)

### The dotted line round the South Seas Mandate is not drawn
`NANYO_BOUNDS_SHOWN = false` in map.js. The ring is still in data.js and the
code that builds it is still there; a traced one will replace it.

### Divisions follow the Administrative switch again
`data-islands` was being put on every archipelago, and the test it stands for
is not "is this an archipelago" but "are these sub-units places or divisions".
The Philippines is drawn from its 1939 provinces, Malaya and North Borneo from
their states. Those three are in `ADMIN_SUBUNITS` and no longer name themselves
with the layer off — except the Straits Settlements, which are four scattered
specks in a peninsula of protectorates and are the point of that corner of the
map either way.

### City names come in with the zoom, and their notes are notes
Two hundred context-city names at the opening view is a grey mat across the
map, so they wait for `labelLevel() >= 2` — the dots are there as soon as
Cities is on, the names when the reader has closed in on somewhere. And nine
cities were carrying an explanation inside the name — "Trincomalee — the
Eastern Fleet's base, raided April 1942" — which is a caption, not a name. The
part after the dash is a `note` now and appears when the city is clicked.

### Natural Earth's China is gone, and the neighbours reach the provinces instead
China's shore was drawn twice. Natural Earth's outline of the modern mainland
was laid under the Republican provinces in two colours — neutral grey, to plug
the places where the two sources put a land frontier a kilometre or two apart,
and China's own yellow, to stop that grey showing as a fringe along the coast —
and it is far the coarser of the two outlines, so at deep zoom the coast came
out as a rough dark line where Natural Earth ran and a fine one, a kilometre
inside or outside it, where the provinces did. `NE_CHINA_MAINLAND = False` in
`tools/build_map.py` turns it off; set it back to `True` to have it again.

What that gave up was the plug, and `add_neighbour_seams` replaces it. Each of
China's neighbours — the Soviet Union, Mongolia, Indochina, Burma, Siam, India,
Nepal, Bhutan, Sikkim — has its frontier vertices pushed towards China until
they are inside it, and the strip between where they were and where they end up
is added to that neighbour's filler. The neighbour's own outline still runs
where its source puts it; the strip is under it. A vertex that cannot reach
China within 0.35° gets no strip, which is what tells a coastline from a
frontier with no need to say in advance which stretch is which. 236 strips:
ussr 70, indochina 34, nepal 32, mongolia 25, burma 22, india 16, saharat 12,
bhutan 8, sikkim 2. The measured effect at the Tonkin border: a continuous band
of bare ocean between China and Indochina, closed.

### Nothing shows above Weihaiwei or the Kwantung leasehold
Two different causes. Weihaiwei and Kwangchowwan are traced in QGIS against a
different coastline from the one the map draws, so China ended a kilometre or
two further out than they did and showed as a rim above them;
`add_enclave_seams` pushes their seaward vertices out until they are clear of
China, and leaves the landward ones alone because those never get clear.
Kwantung is cut out of Liaoning and so its coast *is* Manchuria's — but it was
being simplified on its own with a small atom's tolerance while Manchuria kept
the full detail of the ENP sheet, and it was losing its small islands to a
minimum-area sieve Manchuria was exempt from. It is in `FULL_DETAIL` now and
takes the archipelago floor for area. A few slivers survive where the cut, the
dissolve and the rounding each move a vertex; they were a continuous fringe.

### The Yangtze stops where the water starts
`trim_to_land` runs each river from whichever end is on land and cuts it at the
first crossing, found by bisection and pulled back twenty metres so it ends on
the shore rather than balanced on it. The Yangtze's hand-drawn estuary tail now
ends at 121.08 E instead of 121.90: from about Kiangyin the estuary is open
water on this map, and a centreline down the middle of it is a line ruled
across the sea, out past Chungming, over its tip and out again. Both rivers go
through the same trim; nothing upstream moved.

### Suiyuan is one province again in 1930
The cut at Paotow is a fact about 1942, when Mengchiang held the east and Fu
Tso-yi the west. The western half is its own atom now, `suiyuan_w`, which the
1930 map hands to the same territory as the east — two atoms of one territory
share a fill and a stroke and show no boundary between them — and the 1942 map
hands to Free China. The corridor west along the railway to Paotow has gone
from the occupied shading altogether.

### Administrative draws only the country under the pointer
Every division of every country at once is some fifteen hundred lines. Only the
atom the pointer is on carries `.subs` and draws them. The exceptions stay
drawn wherever the pointer is, and are the things that are not divisions of
what surrounds them: the princely states, Portuguese India, French India and
the Straits Settlements.

### The map opens on 1930 with nothing switched on
1930, no cities, no events, no divisions. The year and the three layer buttons
are deliberately not restored from `localStorage` any more: this is a teaching
map and every visit should start from the same place rather than wherever the
last reader left it, which on a shared machine is nowhere the next reader
chose. Labels, rivers, the line of control and the legend fold still carry over.

### Country names no longer wait for the Administrative button
`labelVisible` gated territory labels on `state.cats.territory`, so "Show names
on the map" showed no country names at all until a second, unrelated button was
pressed. A country's name has nothing to do with its divisions. The one
exception is a territory only drawn when that layer is on — the princely states
— which cannot be named while it is not there.

### One Cities button, and it shows the cities
The context cities had a switch of their own in Layers, which asked the reader
to know that this map has two kinds of city. They come in with Cities now and
that switch is gone. Two things had been hiding them: the zoom guard was never
satisfied at the opening view, because the map opens fitted to its full width,
so pressing the switch appeared to do nothing (it survives on touch screens
only); and `siteVisible` was filtering the dots by the detail level, which the
Layers panel says is for the quiz and the labels — Batavia, Kobe and Pusan were
on the map and invisible for that reason, not hidden under anything.

Thirty-nine cities added: twenty-four in India and Ceylon, from Bombay, Delhi
and Karachi to Trincomalee and Chittagong; three in Burma — Akyab, Lashio and
Myitkyina; twelve in the Netherlands Indies, from Jogjakarta and Padang to
Tarakan, Ambon and Koepang. Weihsien is gone; Jinan and Yan'an were already
there. 170 context cities in all.

### Chinese cities: Pinyin first
Sixty-four renamed — Shenyang (Mukden), Chongqing (Chungking), Beijing (Peking
/ Peiping), Guangzhou (Canton). A student meets the period spelling in what
they read about the war and the present-day one on every map they can look it
up in, and the second is the one that will find it. Countries and provinces
keep the period name first; this is cities only. Korea, Japan, Taiwan,
Indochina, Mongolia and India were left alone.

### Scripts trimmed on India, Thailand, the Indies and Portuguese Timor
British India, the princely states and every Indian city and province: English
only. Thailand: English and Thai. Portuguese Timor and Portuguese India:
English and Portuguese. The Netherlands Indies: no Chinese anywhere, Japanese
kept on the cities and given to the eighteen island names that had only
Chinese. 231 records.

### The Malay states follow the Administrative switch again
`ALWAYS_NAMED` was doing two jobs — keep this atom in the main file, and name
its sub-units whatever the layer says — and the northern Malay states needed
only the first. `NEVER_DEFERRED` is the first job; `ALWAYS_NAMED` is now the
second alone.

### Christmas Island
A Straits Settlement, annexed 1900 and run from Singapore; taken by Japan on 31
March 1942 for its phosphate. The ring comes from Natural Earth's
`ne_10m_admin_0_countries`, where it is filed with Cocos as "Indian Ocean
Territories" — an Australian arrangement of 1958. Drawn in the Straits
Settlements cluster in 1930 and in the occupied colour in 1942.

### A box east of the Gilberts for the islands the map does not reach
The frame stops short of Polynesia and the blue past the last atoll reads as
sea rather than as an edge. An `unseen` territory — no fill, no stroke, no
label, no legend swatch, no outline when hovered — answers "Fiji and the
Polynesian islands (not shown)". The Gilberts' own line now says "British
colony from 1916; a protectorate from 1892".

### The mandate's islands in Japanese, and the Carolines named
Fifty-four islands of the South Seas Mandate carry the names Japan gave them,
including Truk's inner islands, which the navy renamed after the seasons and
the days of the week — Moen is 春島, Dublon 夏島, Tol 水曜島 — and which appear
under those names in every account of the base. Only the mandate: Guam, the
Gilberts and the Bismarcks are left alone.

The Carolines were the worst-named part of the map because OSM files an atoll
as one `place=archipelago` with nothing named inside it, and the build was
skipping that tag. An islet nobody has named now takes the name of the atoll it
lies in, capped at one degree across so that "Ratak Chain" and "Caroline
Islands" — which are chains, not atolls — are not handed to forty-four separate
islets. The mandate went from 420 named shapes of 559 to 454, and the Gilberts
from 56 of 103 to 102.

### The occupied zone says which piece of itself you are on
It was one path, so the pointer could say nothing about it beyond
"Japanese-occupied China" — a reader hovering the ring round Amoy got no hint of
what the ring was. It is a group of six named sub-paths now, one per block of
`OCCUPIED_ZONE`, with `OCCUPIED_BLOCKS` holding the names in the same order:
North China and the Yangtze valley, the Paotow corridor, the Canton delta,
Hainan, Amoy and Kinmen, Swatow and Chaochow. The group carries
`data-islands`, because these are places and not administrative divisions, so
they name themselves whether or not the Administrative layer is on. Each has an
entry in `JMAP.PROVINCES` with the date it was taken.

Two things surfaced while checking it. The occupied territory's record said
"(approximate)" three times over — once in each of English, Chinese and
Japanese — and now says it once, in the English. And `otherNames()` was
dropping any name contained in a longer one, which is right for 内地 beside
日本内地 but wrong for 汕頭 (Suatō) beside 汕頭・潮州: the shorter form was the
only place the reading appeared, so the Japanese vanished. A name is treated as
a bare duplicate only if the longer one carries a reading too. Checked by
capturing tooltips at 26 places in both layer states before and after: five
lines change, all of them gaining a name, none losing one.

### The islands off the coast go with the coast
The complaint was that some islands off the central China coast were occupied
and some were not, with nothing apparently behind the choice. There was
nothing behind it: the occupied zone's east edge was traced close in and
wandered among the islands, holding whichever happened to fall inside. Counting
them: of 113 islands off the occupied coast, 53 were shaded and 66 were not.

The east coast now runs out to sea from the Chekiang front at 29.2 N up to the
Gulf of Chihli, the same way the Bohai stretch does, and the clip finds the
coastline. The islands go with the coast they were blockaded from — the Chusan
archipelago was taken in 1939–40 and held to the end as the base for the
blockade of the Yangtze. 69 of the 113 are shaded now, and the ones that are
not are south of the line at 29.2 N, off Taichow and Wenchow, which the
Japanese raided but did not hold. The boundary is a clean line out to sea
instead of a scatter.

Two things had to be fixed underneath it. The offshore islands taken from
Natural Earth were all being given to China, which drew the Changshan group off
Dairen in Republic-of-China yellow inside Manchukuo; `nearest_enp_atom()` now
gives each island to whichever Republican province is nearest, so those go to
Fengtien and the ones by the leasehold to Kwantung. And measuring occupancy
with `isPointInFill` on the clip path is unreliable — it is provinces and
filler concatenated, so the nonzero rule reads overlaps oddly — which sent me
after four islands that were rendering correctly all along. The rendered colour
is the honest test.

### The Yangtze reaches the sea down a real channel
It ran from Chinkiang straight to a point in the middle of the estuary, which
crossed Chungming Island diagonally and then stopped in open water. The estuary
is not one channel: Chungming splits it, and the navigable course — the one the
river steamers and the gunboats used — is the South Channel, between the island
and the Shanghai shore, out past Woosung. `YANGZI_TAIL` follows the measured
mid-channel: at 121.5 E, Chungming's south shore is 31.554 and the mainland's
north shore 31.366, so the river goes at 31.46. Five points became sixteen, and
it carries on past Chungming's eastern tip at 121.99 E and out to sea.

### The Andamans stopped going back to British
Caught at last, and it was never a race with the epoch. British India's atom
draws its unnamed remainder — every modern first-level unit the table does not
map to a British province — as one path, and modern India includes the Andaman
and Nicobar Islands. So a second copy of the Andamans was being drawn in the
Raj's mauve directly on top of the atom that had them right. `a-india` is
emitted after `a-andaman`, so the copy always won.

What made it intermittent is that India's sub-units are deferred: with the
Administrative layer off, `#a-india` is empty and the Andamans are correct, and
the wrong colour arrives with the administrative fetch. Hence "a reload fixes
it" — the reload starts with the layer off again.

`INDIA_NOT_DRAWN` keeps the Andamans and Lakshadweep out of the remainder
block. Twelve loads in a row now give the occupied colour where nine of twelve
gave mauve, and 1930 still shows them British, which is the atom taking British
India's colour as it should.

### The Administrative switch says what it is doing
The switch was never broken: 120 rapid presses, slow presses, and presses
across epoch changes all turned the provinces on and off correctly. What it
could not do is make three quarters of a megabyte arrive instantly, and it said
nothing while that happened, which on a slow line is indistinguishable from a
dead button. The button now carries a spinner while `adminState` is `loading`,
and if the fetch fails it says so with a mark and a tooltip instead of sitting
there switched on and empty — the next press retries, which the old code
allowed but never showed. Verified under a 220 KB/s throttle and with the
request aborted outright.

### The ENP provinces are drawn as supplied
Asked why Natural Earth is used for China at all, the answer is that it is not:
China's land is the ENP-China 1928–45 sheet and always has been. Natural Earth
touches China in two places only — `chinabase`, the neutral filler underneath
everything, which exists so that disagreements between ENP and the sources
around it read as a seam rather than as one country leaking into another; and,
since the Bohai fix, the coastal islands in the north, where ENP has none.

But measuring it to answer turned up something worse. ENP is not the finer
source; it is much the coarser. Its inland provinces are 84 to 265 vertices
each — Shansi 96, Suiyuan 84, Honan 130 — where Natural Earth's modern China
is 11,896 for the mainland ring alone. And the build was simplifying that
again: of the 17,561 vertices ENP gives the China atom, 5,030 were surviving,
29 per cent. Two thirds of its substantive rings; the rest of the loss was its
islands, 1,851 rings of them, which is why the Chusan archipelago and the
Fukien islands were mostly absent and the ones that did appear looked arbitrary.

`ENP_ATOMS` — china, manchuria, chahar, suiyuan, jehol, tibet, xinjiang — now
joins `FULL_DETAIL`, so nothing thins them, and takes the archipelago floor on
area, so islands down to about three and a half square kilometres are drawn.
5,030 vertices became 8,901: every vertex of the substantive rings, and 182
island rings instead of a handful. The SVGs grow 55 KB and 46 KB.

This does not close the question of which coastal islands were occupied — there
are simply more of them to answer for now, and the answer still comes from the
occupied zone's trace.

### The sources page reaches the standalone build
There is no second file in the single-file build, so About's link to
`sources.html` went nowhere. A `data:` URL is no help — browsers refuse to
navigate the top level to one — so `inline_sources()` in `tools/bundle.py` folds
the page's own body into the About panel behind a disclosure triangle, dropping
its heading, its summary paragraph and its two "back to the map" links, since
About already says what it is and there is nothing to go back from. The link
text becomes "listed below". `.sources-inline` in `styles.css` styles it;
on the web the link resolves and those rules match nothing. Checked by opening
the built file over `file://`: sixty-one atoms, the sources readable in About,
the Administrative layer still grafting its twenty-three princely paths out of
the inlined admin SVG, and no console errors.

### The Bohai: an island that belonged to nobody, and a coast that was not occupied
Two separate faults in the same place, both found by sweeping the coast for
thin ribbons of one colour sandwiched in another rather than by looking at
screenshots.

The island was Shijiutuo, in the Gulf of Chihli. Natural Earth carries it and
the Republican provinces do not, and China's filler is built from the provinces
— so nothing covered it and the only thing under it was `chinabase`, the neutral
filler that exists to make disagreements between sources visible. It read as
land belonging to no country. Every ring of Natural Earth's China except the
mainland now goes into China's filler as well, which puts the coastal islands in
the country. The mainland ring is deliberately left out: that is the ring whose
land frontiers disagree with the Republican provinces, and painting those
disagreements China's yellow instead of the neutral grey is the thing the
neutral grey exists to prevent.

Rings added this way go in after the dissolve and are not thinned — an island
is smaller than the tolerance its country earns and would be simplified out of
existence — which is the same treatment the Korea seam gets, so the two share
one mechanism now.

`china_island()` decides what to take. Not the mainland, for the reason above;
not Hainan, which the Republican provinces do carry, so taking Natural Earth's
copy would only have drawn it twice; and not the **Paracels**, which Natural
Earth gives to modern China and which were not China's on either of these
dates — France claimed them for Annam and occupied them in 1938, and Japan took
them in 1939 and administered them from Taiwan. They were below the minimum area
and had never actually been drawn, but they would have been the moment the
filler stopped thinning what it was given.

The coast was the occupied zone's own trace. It went round the Gulf of Chihli
by hand and cut inside every bulge, leaving unoccupied yellow along the Luanhe
delta and the Leting shore. It cuts straight across the gulf now: the blocks are
clipped to China's land, so the water inside the cut is removed and the coastline
itself becomes the edge. Nothing is claimed for Japan by cutting wide, because
Manchuria, Jehol and the Kwantung leasehold on the far side are atoms of their
own and are not in China's clip. All of that coast was held — Tientsin, the
Kailan mines, Tangshan, Chinwangtao and the Peiping–Mukden railway along it.

The first attempt at this moved the same vertices what was meant to be seaward
and was in fact inland, and made the strip wider.

### Wake is the atoll it was, not a dot
It had been drawn as an eight-point rounded blob. `WAKE` in
`tools/build_map.py` is now a twenty-nine-point trace of the real wishbone:
Wilkes along the south-west, Wake turning north up the eastern side, Peale as
the northern arm, and the lagoon between them open to the west.

Tracing it was not enough, because the path emitter rounds to a tenth of a
map unit — five hundred metres, which is nothing on a coastline and everything
on an atoll a mile and a half across. Wake's twenty-nine points collapsed onto
fourteen distinct columns, the three islets flattened into one bar and the
lagoon folded shut. `path_precision()` now writes any ring under two units
across to a hundredth of a unit instead, and drops the near-duplicate test to
match. The two SVGs grow by 66 KB and 7 KB, which buys real outlines for every
small island on the map, not just this one.

At the map's own scale Wake is still smaller than the islet ring drawn round
it; the shape is what you get when you zoom to it.

The four geometry changes of this batch together take the main SVG from 1,512
KB to 1,651 KB and the administrative one from 746 KB to 774 KB — nine per cent,
for finer small islands everywhere, Wake's real outline, China's coastal islands
and the Korea frontier seam. The administrative file is still fetched only when
the Administrative layer is turned on.

### Manchuria reaches Korea along the Yalu and the Tumen
Korea is drawn from a period map of its thirteen provinces and Manchuria from
the ENP-China provinces, and the two files put the rivers in slightly different
places, so bare land colour showed between them down the whole frontier — a
scan of the boundary in one-kilometre steps found eighty-seven columns of it,
the widest forty-one kilometres. Korea's line is the better one and was to be
kept, so `add_frontier_seam()` in `tools/build_map.py` makes Manchuria reach it:
Korea's own frontier vertices are the seam's inner edge and the same vertices
pushed outward are its outer edge, far enough at each point to bury Manchuria's
line. The same scan now finds none.

Four things had to be got right and each was wrong first:

- The seam goes to the **filler**, not into `backing`. Manchuria has no Natural
  Earth outline there, so the filler falls back to the union of its provinces —
  and putting a key in `backing` replaced all of Manchuria with the seam alone,
  which turned Manchukuo into "Elsewhere" grey.
- It is **wound the way Manchuria winds**. It overlaps rather than abuts, and
  paths fill by the nonzero rule, so a ring wound the other way cancelled the
  overlap and punched a hole down the whole frontier.
- It is **not simplified**, and it is not in the atom's own geometry. Its inner
  edge is Korea's boundary exactly; thinning it moves that edge off the line it
  was built to meet, and a copy in the atom is stroked on selection as a second
  outline a few kilometres inside Korea.
- The **tangent is measured over about nine kilometres**, not from the next
  vertex along. Korea is drawn at the full detail of its source, so consecutive
  vertices are a few hundred metres apart and the vertex-to-vertex direction
  swings wildly along a ragged estuary: the first version fanned out into Korea
  Bay in a starburst of red triangles.

The seam is only allowed to reach from Korea into Manchuria — the far end must
be out of Korea, inside Manchuria and still beside the river — and where none of
that holds it shrinks to nothing and the strip is broken there rather than
carried on as a hairline. That covers the islands of the Yalu estuary, where
outward is open water, and the stretch near Paektu where the corridor contains a
boundary between two Korean provinces.

`YALU_TUMEN` is the trace that says which part of Korea's outline is frontier
and not coast. Its first version cut the corner above Manpojin and missed the
loop north to Chunggangjin and Linjiang, leaving that stretch of the frontier
outside the corridor and unfixed; it follows the river now.

### Every princely state names itself
Half the layer was answering with nothing. `PRINCELY_NAMES` identified twenty of
the source's forty polygons, and `build_map.py` dissolves everything it cannot
name into a single unlabelled path — one shape with a bounding box the width of
the subcontinent, so a pointer anywhere in the other twenty got "Princely
states" and no more. The remaining twenty are placed in the table now, by
position, and folded into the agency each belonged to where the outline alone
will not tell one state from another: Savanur, Sandur and Banganapalle as a
group of three; Phaltan, Bhor, Jawhar and the Southern Maratha jagirs into
Kolhapur and the Deccan States; the Chhattisgarh feudatories into the Eastern
States; Bundelkhand into the Central India Agency; Chakia into Benares, whose
southern pargana it was; Bashahr, Mandi, Suket and Sirmur as the Punjab Hill
States; Kapurthala and Phagwara into the Punjab States; and Waziristan and the
Gomal as the frontier tribal agencies, which are not princely states but are
shaded with them in the 1931 atlas and are labelled for what they were. Twenty
named paths became twenty-three, none unlabelled. A 126-point sweep across the
layer named the right state at 124; the two misses are Cooch Behar and a Deccan
jagir, three and five pixels across at the default zoom, and they resolve when
zoomed.

### A sources page
`sources.html`, linked from About, listing every dataset with what it was used
for, where it came from and under what licence — Natural Earth, ENP-China,
geoBoundaries, the Yale Korea layer, the princely states, the Modern East Asia
GIS, the two river sources and the two traced maps — plus a section on what was
done to the data and one on names. The princely states are credited properly at
last: georeferenced by the author from the atlas volume of the *Imperial
Gazetteer of India*, 1931. The paragraph in About shrinks to a link and a
one-sentence summary.

### The Yellow River reaches the sea, and stops forking
Two faults in one place. The old course ended at 119.03 E, a little short of
the Gulf of Chihli, because Natural Earth's centreline runs out before the sea
— the same thing the Yangtze needed a hand-drawn tail for, and the flood course
had been given one while the pre-1938 course had not. `YELLOW_TAIL` carries it
through the delta to the mouth it used between 1855 and 1938.

And the chord across the meanders was not a bad split after all: Natural Earth
carries a second line over the same ground, which also crosses the breach and
was cut with it, so two courses were drawn together and read as a fork. The
old course is one river, so only the longest piece is kept.

### Wake Island exists
It was not on the map at all — not an atom, not a territory, only a marker.
Natural Earth's 1:10m countries do not carry the atoll, and `split_usa` knew
Hawaii and the Aleutians and dropped everything else the United States held in
the Pacific. It is drawn by hand now, as Chandernagore is: a V of eight points
round the lagoon, with an islet ring because at this scale it is smaller than
the ring. American in 1930, occupied in 1942, and its note carries what
happened there — the first landing thrown back at the water's edge on 11
December, the surrender on the 23rd, and the ninety-eight civilian prisoners
murdered on the island in October 1943.

### Only the scripts that belong to a place
Hangul was on every province in Asia and a Japanese reading on most of them.
Which script a place should carry is decided by which atom its sub-units belong
to, read out of the built SVG rather than guessed: hangul survives only on
Korea's thirteen provinces, and a Japanese reading only on Japan proper, the
colonies — Korea, Taiwan, Karafuto, Kwantung, the Nan'yō, the Ryukyus, the
Kuriles — and Manchuria, Chahar, Suiyuan and Jehol. 402 sub-units went to 126
carrying Japanese and 13 carrying hangul. Szechwan is 四川 and nothing else;
Bengal is 孟加拉省; Cebu is 宿霧.

The countries were carrying it too. Korean is gone from all but Chōsen, 316
entries; a Japanese reading is gone from the fifteen outside the Japanese
sphere — British India, the princely states, Ceylon, Australia, the Soviet
Union, Mongolia, Tuva, Nepal, Bhutan, Sikkim, Goa, Pondicherry, Hawaii, the
Aleutians — 30 entries. It stays on everything Japan held, occupied or named,
because 比島 and 泰国 and 重慶政権 are what this empire called those places.

Still open: Japanese on individual occupied cities, which the rule above
removes from provinces but which Manila and Batavia should keep.

### The fillers moved under everything
The one bug behind the grey between China and Indochina, the grey slivers along
the Fukien coast, and the grey and yellow inside Kwangchowwan. Each atom's
whole-country filler was drawn *inside* the atom, so it was painted in that
atom's turn and a country whose turn came later covered its neighbour's
provinces with it. `build_map.py` now emits them all into `<g id="backings">`
at the head of `#land` — above `chinabase`, which is itself a filler and would
otherwise cover them, and below every atom. `map.js` keeps `backingEls` beside
`atomEls`, colours and shows them with their territory, adds them to
`atomsOf[]` so they are outlined and lit with it, and lets one answer for its
territory when its sub-units are still in the administrative file. The three
leaks are gone and Kwangchowwan is blue.

Thailand's frontier is *not* this bug and still needs its cover stroke: it is a
genuine hole between geoBoundaries Thailand and geoBoundaries Cambodia that no
atom fills, so Indochina's filler shows through it — which is a filler doing
its job, in the wrong colour. Removing the stroke brings the flecks straight
back; it was tried.

### Suiyuan is one province again on the 1930 map
The cut at Paotow exists for 1942, where the corridor west along the railway
was occupied and the country beyond it was not; 1930 had inherited it. Both
halves are already the Republic's colour on that map, so only the labels
betrayed it: `JMAP.PROVINCE_EPOCH.e1930` said "Suiyuan — the eastern half of
the province" and "Western Suiyuan — Wuyuan, Linhe and the Ordos", and both now
say Suiyuan. The 1942 labels are untouched, and the geometry with them.

### Kwantung keeps the colony colour
It had been moved to the client-state colour because Manchukuo re-granted the
lease in 1932. The territory was Japanese and separately administered to the
end, so it goes back to `cat: 'colony'`; the hairline across the Liaodong
isthmus is what tells it from Manchuria.

### The hairlines are whispers again
`#sub-outlines .edge-line` went from 2.2 to 1.4, and the two that were running
further than they needed to are clipped tighter: the Burma–India line to
92.0–97.3 E and 20.6–28.4 N so it stops at the coast instead of running into
the Bay of Bengal, and the Chahar–Manchukuo line to 116.3–119.7 E and
40.2–45.6 N so it does not carry on along Chahar's northern edge with Mongolia.

### The backing was coarser than the sub-units it sits under
The jaggedness along provincial boundaries and the doubled outline on
selection. Each atom's backing was simplified by the band its own size earns,
and a country the size of Siam earns the coarsest band while its changwat earn
a much finer one — so the backing poked out past the provinces on one side and
cut inside them on the other. `backing_tol()` in `tools/build_map.py` now gives
each backing the finest tolerance any of its own sub-units was given, counting
only sub-units big enough to share a boundary with it. The Philippines had the
same fault in a second form, its backing being Natural Earth while its
provinces come from a 1939 file; it is now its own backing, as Korea has been
from the start.

### Administrative off by default, divisions fetched on demand
The province and princely-state paths are more than half the weight of the map.
`build_map.py` writes them to `japan-empire-map-admin.svg` and marks the atoms
they left `class="atom deferred"`; `loadAdmin()` in `map.js` fetches that file
the first time the switch is turned on and grafts each `<g data-for>` into its
atom. Sub-unit names had to be XML-escaped for it — "Kashmir & Jammu" was
stopping the parse at the ampersand — and `.atom.deferred > path.whole` takes
the pointer so the base map still answers. 2003 KB became 1462 KB at load plus
746 KB when asked for.

### The princely states, from the 1931 layer
Five modern Indian states standing in for six hundred princely ones, replaced
by 40 polygons of the states as they stood in 1931. Twenty name themselves: the
file names nine and `PRINCELY_NAMES` identifies eleven more by position. They
are drawn at the detail of their source — eight per cent of the vertices were
surviving the build until `princely` joined `FULL_DETAIL` — take British
India's own colour, and appear only when Administrative is on.

### The nearest thing first
The tooltip and the detail card put the sub-unit on the top line, its other
scripts under it, the country under that, then the note. Names are de-duplicated
by `nameKey()`, which strips the reading in brackets and folds kyūjitai and
traditional forms onto the modern ones, so 咸鏡南道 and 咸鏡南道 (Kankyōnan-dō)
are one entry and 内地 is dropped beside 日本内地.

### The quiz stopped showing its own answers
`reachable()` took its floor as `min(stage.bottom, quizBox.top)`; on a wide
screen the quiz card is beside the map, not below it, so that floor was 69 px
against an 843 px map and every question zoomed and recentred on its answer. It
measures against the map now, and uses the card as a floor only when the card
actually overlaps it. "Try again" was relabelled but only ever wired to
`revealAnswer`; it restarts the quiz.

### Tap for the country, tap again for the province
On a touch screen the first tap names the country alone and a second tap on the
same place names the sub-unit under the finger and outlines it. With the
Administrative layer off the second tap adds nothing.

### The line of control, labelled for its date
"Greatest extent" is Gordon's phrase and December 1942 is not a maximum — the
naval perimeter was widest in July and August, the area of China under Japanese
control largest in 1944. The legend, the Layers panel, the README, SOURCES.md
and the epoch blurb all say what the line is instead.

### Other fixes this session
- The perimeter closed a gap with a straight chord across four hundred
  kilometres of unoccupied China: `china_front()` handed over to the coast at a
  fixed index, and adding points upstream shifted everything after them. It
  hands over at the nearest traced point now.
- The middle Yangtze drawn as the front it was, from Ichang to Yochow following
  the river's north bank, with Ichang keeping both banks.
- The Yellow River's flood course redrawn from the disasterhistory.org channel
  map: down the Chia-lu into the Ying, down the Ying into the Huai, through
  Hungtse Lake and the Grand Canal into the Yangtze above Chinkiang.
- Indochina and Kwangchowwan drawn French with Japanese stripes, then reverted
  to occupied on the judgement that the Vichy administration was window
  dressing; Macao restored to Portuguese, which it was.
- The folded legend shrank from the full width of the screen to its own label:
  it was a 54 px strip that swallowed every tap along it.
- A frame round the drawing, and room to push the map past it — 45% of a
  viewport on a phone, 6% on a desktop.

### British India as traced, and not as three modern countries
Four hand-traced files replace what stood in for the Raj: `india-1931.geojson`
(one outline of 13,195 points with eleven holes), `french-india.geojson`,
`portuguese-india.geojson` and `india-protectorates.geojson`. India, Pakistan
and Bangladesh stand down for it, and so do the modern first-level units the
enclaves used to be cut from.

The stand-in was wrong in the way that matters: it drew the whole of Kashmir,
Arunachal Pradesh and the Chittagong tracts inside the 1931 frontier, and put
the line of Partition nowhere. Two things nearly kept it there.

The first is that `split_india` sends the Andamans one way and the mainland the
other, and the mainland goes through the splitter branch, which never saw the
line that makes India stand down for the tracing — that test sits in the plain
branch below it. So the modern outline was still being drawn, in the same path
as the traced one and with the same winding, and the atom was the union of the
two: 5,009 traced points and 6,119 modern ones, and every tract the tracing
leaves out back inside the Raj. The test is in both branches now.

The second is quality. A tracing is not a survey file — it has the vertices
somebody chose to put in it — and thinning it by the band a country of India's
size earns moved the drawn line a median of 2.3 pixels from the tracing at the
deepest zoom the map allows, and 7 at the ninetieth percentile, against the half
a pixel the bands are meant to cost. `TRACED_TOL` holds a traced layer to that
half pixel instead (0.021 units for India), in the atom's own path as well as in
`thin()` and `backing_tol()`, and writes it at the fine precision the small
shapes get, because the ordinary 0.1-unit write grid is itself 2.4 pixels at
that zoom and was the larger of the two errors. Measured back against the
tracing over the 10,623 source vertices inside the frame: median 0.07 pixels,
0.26 at the ninetieth, 0.47 at the ninety-ninth, 0.61 at the worst. 5,358 points
drawn, 72 KB against 24 KB for the union of two wrong outlines.

The holes are exempt from the thinning and from the small-shape sieve: they are
the enclaves and the protectorates, a dozen points each, and thinned at a band
meant for a coastline they shrank until the sieve threw nine of the eleven away.

The ten settlements are named from the tracing itself, so the pointer tells
Dadrá from Nagar Aveli and Karikal from Yanaon; `india-enclaves.csv` had one row
called *Dadra & Nagar Haveli* and it is two rows now, and Chandernagore's key
was short of the present-day name the SVG carries. All ten answer, and so do
Sikkim, Bhutan, Nepal, Delhi, Hyderabad and Ceylon.

**The provinces of British India are not drawn**, as asked. The only source for
them was the modern first-level units, and a tenth of their vertices fall
outside the traced outline — Arunachal Pradesh by up to 107 km, Mizoram by 51,
Ladakh by 45, which are exactly the tracts the tracing leaves out. Drawing them
would have put the Raj a hundred kilometres past its own line whenever the
Administrative layer was on. The princely states are still drawn over it.
`sub-units/british-india.csv`, the thirteen province names, is left in place
against a source that fits.

### Mitred joins on the land, and a third of the frame back
`stroke-linejoin: round` → `miter` with `stroke-miterlimit: 2` on the three rules
that carry the coastline: `.atom` (`styles.css:221`), `#backings path` (`:264`)
and `#land path.coast` (`:292`). Between them they stroke 161,408 vertices, and
a round join builds an arc — four to eight segments — at every one of them. This
is the first item acted on out of `reports/2026.08.18-recommendations.md`, where
three independent reviews of pan and zoom found that 85% of raster is the 1.3px
stroke and that the join alone is a quarter to a third of it.

Measured on a quiet machine (CPU canary flat at 14 ms desktop, 56 ms on the
throttled mobile profile), raster milliseconds per frame during a scripted pan,
round and miter sandwiched round/miter/round three times per view:

| view | desktop | mobile |
|---|---|---|
| 1930 China + admin | 71–74 → 44 (60–62%) | 72–73 → 45–46 (62–63%) |
| 1942 China + admin + extent | 100–103 → 69–71 (68–69%) | 89–90 → 59–60 (65–67%) |
| whole empire 1942 | 124–125 → 86–89 (69–71%) | 74–75 → 51 (68–69%) |
| India 1930 + admin | 155–158 → 96 (61–62%) | 72–73 → 46–47 (62–66%) |

Pixel-diffed at 1600×1000 dsf 2 over eight views — both fit views, the China
coast, the Ryukyus, the Aleutians, the Philippines, Okinawa at the deepest zoom
and the Kuriles, the last five chosen for having the spikiest corners on the
map. 0.113–1.082% of pixels differ at all and 0.017–0.162% by more than 8 per
channel, with a mean difference over the differing pixels of about 3 per
channel: sub-pixel antialiasing on islet corners. The two crops taken round the
worst-scoring 32-pixel cell in each of three views are indistinguishable.

The join changes corners, not the width along a segment, so the 1.3px line still
closes the hairline cracks it is there for; the miterlimit of 2 sends anything
sharp enough to throw a spike back to a bevel, which at 1.3px is also sub-pixel.
Nothing was found reopened in the diffs, though a diff over eight views is not a
proof over the whole map.

The dashed sub-unit outlines, the selection outlines in `#highlight`, the line of
control, the rivers, the mandate dashes and the text halos keep their round
joins: they are 1.8 to 3.5 pixels wide, or they are glyphs, and there the
difference would show. `map.js:2434`, which sets the join on the outline mask
copies, is left alone for the same reason.

### A gesture lets go of the selection
Asked for: when the reader starts panning or zooming, drop whatever is selected,
so the map does not carry the selection outline and the province divisions
through the gesture. They can select again when it stops. `dropForGesture()` in
`map.js` does it, called from three places: the drag, at the moment the pointer
travels far enough to stop being a tap; the pinch, when the second finger lands;
and the wheel.

It was worth more than expected. A selected territory is drawn as a stroke
through a `<mask>` in `#highlight`, and a mask renders into its own offscreen
buffer, which the compositor re-renders on every viewBox change — which is every
frame of a pan. Raster milliseconds per frame, scripted pan, three sandwiched
rounds each, canary flat:

| view | selected | dropped | ratio |
|---|---:|---:|---:|
| China 1942 + admin, desktop | 254 | 70 | **28%** |
| India 1930 + admin, desktop | 222 | 97 | 44% |
| whole empire 1942 + admin, desktop | 196 | 131 | 67% |
| China 1942 + admin, mobile at 4× | 133 | 54 | **41%** |
| India 1930 + admin, mobile | 96 | 41 | 43% |
| nothing selected — the control | 67 | 67 | 100% |

So a pan with something selected cost between 2.4 and 3.6 times a pan without,
and that is now the only kind of pan there is. The August 18 review had listed
this as a suspect it could not demonstrate: its test click landed on the USSR,
1,344 vertices, and measured nothing.

What is dropped: the selection, the hover outline, the hot province, the
divisions inside the pointed-at country and the tooltip. What is not: the quiz,
where the map is answering a question rather than being read — `dropForGesture`
returns at once in quiz mode. Nor the zoom buttons or the reset, which are
single steps with a settled frame after each, and a reader who presses + is
usually looking at the thing they just selected.

Two things about the ground this stands on. On a mouse, `onHover` (`map.js:2189`)
already threw away the hover outline and the divisions as soon as a drag began —
what it never dropped was the *selection*, which is where nearly all the cost
was. On a touch screen there is no mousemove, so none of it was being dropped;
that is the case this helps most, and it is the one where the frames were worst.

Checked on a touch profile, where no mousemove fires and so nothing but this
code can be doing the clearing: in explore mode a touch drag leaves the info
panel closed and `#highlight` empty; in quiz mode the same drag leaves the
divisions standing and the question untouched. A tap that does not travel still
selects.

### A switch for the 1.3px land stroke, in the admin panel
Asked for, to compare the two by eye and by feel. Option-click Layers, and
*Land stroke* turns off the stroke on `.atom`, `#backings path` and
`#land path.coast` — the three rules that carry it — leaving the fills. It
reports what it is turning off: 1,309 paths and 236,959 vertices in the 1942
China view with Administrative on.

The stroke is what closes the hairline cracks between neighbours simplified out
of different files, so with it off the cracks open and the coast thins by half a
pixel; that is the trade the switch is for. Profiling puts the land's fills at
about two percentage points of a frame and its strokes at 85, which is why it is
the most interesting switch in the panel. Like the backings switch beside it, the
setting is remembered in localStorage, so a reload comes back the way it was left.

### The hairline stroke is off by default, and switchable in Layers
Asked for, on the strength of the measurement: the 1.3px line round every filled
shape is off unless the reader turns it on. *Close the hairline gaps between
shapes*, in the Layers panel, brings it back. It is `#jmap.hairline` in
`styles.css`, `state.hairline` in `map.js`, remembered in localStorage like the
rivers and the line of control, and carried in the share link at bit 10 — bits 8
and 9 are the level, and `LAYER_FLAGS` is indexed by bit, so it could not simply
join the list.

Measured, raster milliseconds per frame during a scripted pan, off against on:

| view | desktop pan | desktop zoom | mobile pan | mobile zoom |
|---|---|---|---|---|
| 1930 China + admin | 45.3 → 11.4 (25%) | 27.2 → 6.9 (26%) | 45.4 → 8.0 (18%) | 26.4 → 5.1 (19%) |
| 1942 China + admin + extent | 70.5 → 30.7 (44%) | 55.2 → 30.1 (55%) | 59.6 → 16.2 (27%) | 40.8 → 14.4 (35%) |
| whole empire 1942 | 88.9 → 24.4 (27%) | 90.8 → 27.8 (31%) | 52.4 → 11.5 (22%) | 41.9 → 10.4 (25%) |
| India 1930 + admin | 98.4 → 17.2 (17%) | 85.4 → 13.8 (16%) | 46.8 → 6.7 (14%) | 38.7 → 5.2 (13%) |

**Every land stroke follows the switch, China's two outline paths included.**
They were held back for a day on the grounds that `.whole-edge` and `.coast` are
`fill: none`, so their stroke is the drawing rather than a repair to it — which
was the wrong way to see it, as the user said: China's *fill* already ends at the
coastline, and all those two add is the same fattened edge every other country
has just given up. Measured, keeping them cost 15 to 86 per cent more than
dropping them, and a view of India paid 15–17% of it, because `.whole-edge` is
the yellow half of China's whole outline and carries the western land frontier as
well as the coast.

What is actually lost, measured as pixels that are land with the line on and
background without, over six views with the divisions drawn:

| view | pixels differing | land → background |
|---|---:|---:|
| 1930 China, admin, hovering China | 0.70% | 0.002% |
| 1942 China, admin, hovering China | 0.69% | 0.000% |
| India, admin, hovering the Raj | 1.06% | 0.000% |
| Indochina and Siam | 0.76% | 0.045% |
| Korea and Manchuria, the Yalu | 0.44% | 0.009% |
| **Malaya and the Indies** | 0.98% | **0.557%** |

So the cracks the stroke was written for barely open: the seams and the backings
are doing that work, and along the Yalu — the frontier that needed a fix of its
own — the loss is nine ten-thousandths of the view. What the stroke was *also*
doing, unadvertised, is making small things visible. It straddles the edge, so
it fattened every shape outward by about two thirds of a pixel; take it away and
Brunei's two enclaves visibly shrink and the smallest islets of the Indies fall
under a pixel and disappear into the sea. That is the whole of the 0.557%.

The obvious refinement, not done: keep the stroke on small shapes and drop it on
the big ones. The cost is all in the long coastlines — an islet is a dozen
vertices — so this would be nearly free. It needs a class from the build,
because CSS cannot ask how big a path is.

### What the blunt switch was really doing
The admin panel's *Land stroke* switch is written with `!important`, which is
right for an instrument and wrong as a description of what the map would look
like without the stroke. It beats every other rule, so it was also taking off
strokes the map draws on purpose and not as a repair: **the province divisions
under the pointer** (`rgba(18, 15, 10, .62)` → none) and **the outlines round the
Communist base areas** (`rgb(122, 23, 48)` → none). Both survive the Layers
switch, which only removes the fill-colour strokes it names.

That is the second way the instrument misled: the first screenshots of
"stroke off" were showing a map with its administrative boundaries and its
base-area outlines stripped as well, and I read the damage as general. Its hint
now says what it is — the floor, not an option — and points at Layers for the
reader's version.

### The North China Area Army's own map, as an alternative reading
Asked for: a switch that swaps the occupation and the base areas for the two
polygon layers from `kmlawson.github.io/1942-occupation-map` — the tracing of
付図第五「北支那方面軍占拠地域内治安概況（昭和十七年九月中）」, the sheet `tasks.md`
had listed under *Sources worth fetching* for exactly this purpose.

*The occupation of China, Dec 1942* in the Layers panel, two radio buttons, next
to the province-source pair it is modelled on. `state.occSource`, remembered in
localStorage, carried in the share link at bit 11.

**The sheet covers north China and nothing else** — 108–122.6° E, 33–42° N, that
army's area of responsibility — so a straight swap was not available. Asked
which way to take it, the answer was one source at a time: with the sheet on,
the traced zone and Wu Yuexing's base areas are hidden everywhere, not only
where it has data, and the Yangtze valley, Canton, Amoy and Hainan go unshaded.
The line of control goes with them, because across China it *is* the inland edge
of the traced zone, and a dashed perimeter round shading that is not drawn
asserts the very thing the other source was chosen instead of.

One predicate does all of it. Records carry `srcOnly` — `traced` on the occupied
zone and the base areas, `nca` on the two new ones — and `srcOK()` gates
display, the label, the legend swatch and the quiz question. That last one
matters: `nanjinggov` is a level 1 record, so without it the quiz would have
asked a student to find Japanese-occupied China on a map that was not drawing
it.

Geometry: 84 rings and 3,099 vertices pacified, 53 and 1,819 un-pacified, 65 KB
of path data between them, held to `TRACED_TOL` like the India tracing and put
in `NO_DISSOLVE`, since 137 separate areas dissolved would come back as one ring
threading through all of them. Not clipped to China's land: the areas are traced
from a land map, and clipping them to the `china` atom would cut whatever falls
over Jehol or along the Manchukuo border, which is ground the sheet does map.
The un-pacified areas are in `ON_TOP`, above the pacified, for the same reason
the base areas sit above the occupation.

Colour: pacified took the occupation's own salmon at first, which put two
near-identical swatches in the legend — *Under military occupation*, which is
still what Burma and the Philippines are, and *Pacified areas*. It is a lighter
salmon from the same family now. The un-pacified areas took the base areas' dark
red to begin with and are navy (#1f3b73) since, asked for: the two readings are
never on together so there was no clash to fix, but a warm colour for the ground
being fought over read as another shade of the occupation, and the cold one
separates the army's two categories at a glance. Navy rather than the American
steel blue (#325d7b) or the French (#80b1d3), neither of which is ever on the
same ground. A diagonal hatch was tried on them and came to nothing visible, so
it is not in the file: the areas are large enough to read as solid colour.

Checked: hidden on the 1930 map and under the traced reading; shown under the
sheet; the legend swaps two rows and drops the line-of-control row; the label
for the occupied zone disappears when the sheet is on and comes back when it is
off, which is `srcOK` working through a second path; hover names both new
layers. The quiz exclusion is the same predicate on its first line, checked by
reading rather than by driving the quiz — two attempts to drive it from
Puppeteer killed the browser, and that is a harness problem, not a map one.

### The backings toggle reloads, as it was asked to
The admin panel's Backings switch detached the layer from the document and left
the reload to a separate button beside it. The brief said the toggle itself
should reload, so that what is measured afterwards is a page that has never had
the backings in it — no detached subtree still held by the closure, no heap or
layout state left from having parsed them once. It does now; the separate button
is gone, being what the switch does.

The view survives it. `map.js` keeps `bbox` and `layers` in the address bar, and
the panel reopens itself from its own localStorage key, so the reload comes back
to the same ground at the same zoom with the panel still open and the switch
still off. Checked both ways: off reloads and leaves 0 of 42 backing paths, on
reloads and brings all 42 back.

Worth knowing when reading the numbers it produces: with the hairline stroke now
off by default, detaching the backings is worth about 7% of a pan (20.5 → 19.0
raster ms/frame in the 1942 China view) rather than the 37% it was worth when
every one of those 42 paths was also stroked. The layer is still half the path
data in the file; it is the stroke that made it expensive to draw.

### The princely states layer, updated
Replaced with the copy from `Dropbox/GIS/India/1931 Imperial Gazetteer/`, which
carries the same version string as the one in the cache and different contents.
Diffed feature by feature, matching on centroid:

* **One new polygon**: the North-East Frontier Tract, 91.45–97.75° E, 27.02–29.18° N,
  53,156 km², 63 points, unnamed in the source and with no `fid`, so it joins the
  unlabelled group and answers with the territory rather than with a guess.
* **Madras States refined**: 1,901 points to 1,811, area unchanged to the square
  kilometre.
* Everything else byte-for-byte identical. 40 features and 54,509 vertices become
  41 and 54,482; the drawn atom goes 47 rings / 300.2 KB to 48 / 300.7 KB.

**The thing to know about the new tract**: measured against the traced outline of
British India, **0% of its area and 9 of its 63 vertices fall inside**. The 1931
tracing deliberately leaves the frontier tracts out — it is why the Indian
provinces are not drawn at all, Arunachal Pradesh being up to 107 km outside it —
so the tract is now shaded on ground the map otherwise gives to Tibet, and it
juts north-east out of the Raj's own line. That is faithful to the 1931 atlas the
princely layer comes from and unfaithful to the 1931 sheet the outline comes
from; the two sources disagree, and the map is now showing the disagreement.

Left as it is rather than quietly dropped, because it is the author's own data
and the mismatch is a real one between two period sources. Two ways to close it
if it should be closed: give the tract a name in `PRINCELY_NAMES` so it answers
for itself the way Waziristan and the Gomal do — which needs matching on position,
since it has no `fid` — or leave it out of the drawn layer and keep it in the file.

### Six layers replaced from the author's own GIS
All from `Dropbox/GIS`, all EPSG:4326, none of them carrying a name attribute, so
each feature is identified by a point that can only be inside one of them —
Kathmandu and Kabul for the two 1931 neighbours, Gangtok and Thimphu for the
protectorates, as before.

`tools/gpkg_to_geojson.py` is new and does the conversion. `gpkg.rings()` hands
back every ring in a layer as one flat list, which is all the build needed while
a GeoPackage held a single shape; these do not — Mengchiang is three pieces — and
a feature's holes have to stay with the feature they belong to. It reads the rows
itself, splits polygons from holes by the sign of the signed area, and does no
reprojection, these layers being in longitude and latitude already rather than in
the Wuhan azimuthal-equidistant grid `gpkg.rings_lonlat` exists for.

| layer | from | was | now |
|---|---|---|---|
| **Outer Mongolia** | `outermongolia-1940.gpkg` | Natural Earth's modern outline | 1 ring, 550 vertices |
| **Mengchiang** | `mengjiang-1940.gpkg` | 1 piece, 358 vertices, west to 108.7° E | **3 pieces, 887 vertices, west to 103.9° E** |
| **Sikkim, Bhutan** | `india-protectorates.gpkg` | 59 vertices | 61 |
| **Nepal** | `nepal-afghanistan.gpkg` | the Wuhan project's `nepal.gpkg` | 96 vertices, 1931 |
| **Afghanistan** | the same | Natural Earth, inside *Elsewhere* | 420 vertices, 1931, still *Elsewhere* |
| **British India** | `india-1931.gpkg` | 13,482 vertices | 13,345 |
| **China's provinces** | `1928_1945.shp` | 29 shapes, 20,400 points | 29 shapes, **20,505** |

Natural Earth stands down for Mongolia, Nepal and Afghanistan the same way it
already did for India: a test in the ADMIN0 sweep, so the modern outline is not
drawn under the period one. Nepal's GeoPackage in `GIS_LAYERS` stands down too.
This matters — the Indian tracing was drawn into the same path as the modern
outline for a day before anyone noticed, and the atom was the union of the two.

**Two things worth knowing about the new Mengchiang.** It is dated **1940**, two
years before this map's second date, and it reaches 480 km further west than the
tracing it replaces, taking in ground around Ningsia that the old line left to
Free China. The frontier moved during those two years and the note on the
territory already says the shading is an approximation; but the map now says 1940
where it says December 1942 elsewhere, and that is worth a sentence in the note
if it is not going to be re-cut.

Checked by hover: Ulan Bator answers Mongolian People's Republic, Kweisui and
Tatung answer Mengchiang, Kathmandu Nepal, Kabul Afghanistan, Gangtok Sikkim,
Thimphu Bhutan, Delhi British India, and Sian, Chengtu and Chengchow answer with
their provinces. The build reports no unknown provinces from the refreshed
shapefile.

### Tannu Tuva from the 1940 sheet
`tannu-tuva.gpkg` from the same folder as Mengchiang and Outer Mongolia, wired
the same way: converted to GeoJSON, drawn as a traced layer, and the Wuhan
project's `tunnu_tuva.gpkg` stands down in `GIS_LAYERS`.

**The exported layer holds the shape twice.** Two features, 96 points each,
geometrically identical down to the last coordinate — a duplicate from the QGIS
session it was written out of rather than two pieces of country. The loader drops
a ring identical to one it already has, so the map draws one; worth fixing in the
source file, since nothing here can tell a deliberate duplicate from an accident.
The `.gpkg-wal` and `.gpkg-shm` files beside it say the layer was open in QGIS
when it was read, which is probably where the second copy came from.

The country it draws is smaller and further east than the layer it replaces:
162,454 km² against 171,418, bbox 88.96–99.77° E against 87.87–98.90, and 96
vertices against 762. Hover checked: Kyzyl answers Tannu Tuva, the ground below
it answers the Mongolian People's Republic and above it the Soviet Union.

### The Soviet Union from the author's own layer
`China/soviet-union.gpkg`, the `sovietunion` layer: one feature, 201 polygons,
34,257 vertices, from 27° E to the dateline. The frame clip throws away nearly
all of it — the drawn atom is 11 rings and 18.7 KB.

It is period-correct where this map can see it, which is what made a wholesale
replacement safe: **Sakhalin stops at the 50th parallel** and **there is not a
single Kurile ring in the file**, both of those being Japanese in 1930 and 1942.
So Natural Earth's Russia goes on supplying Karafuto and Chishima and stands
down only for the `ussr` key. Checked: Vladivostok and Khabarovsk answer the
Soviet Union, south Sakhalin answers Karafuto, north Sakhalin the Soviet Union,
Iturup answers Etorofu, and the Manchuria–Soviet frontier that #100 closed is
still shut.

The file also carries a second layer called `difference` — 205 polygons, the
same extent, ~107,000 km² smaller and with the hole in the main ring gone. It
looks like the working half of a QGIS difference operation and it is not used.
The main ring has a hole of 0 km² at 99.66–99.77° E, which is a sliver rather
than a country.

### Mengchiang as its three governments
Asked: the 1940 sheet draws three features, and can they drive the
Administrative layer. They can, and they do now. The state was federated in
September 1939 out of three bodies and the sheet keeps them apart:

| polygon | area | named | claimed by |
|---|---:|---|---|
| 0 | 559,063 km² | The Mongol leagues 蒙古聯盟 | Kweisui |
| 1 | 27,151 km² | North Shansi (Jinbei) Administration 晉北政廳 | Tatung |
| 2 | 17,674 km² | South Chahar (Chanan) Administration 察南政廳 | Hsuanhua |

Identified by a town that can only be in one of them, the same way Sikkim and
Bhutan are. **Kalgan is deliberately not one of those towns**: it was Chanan's
seat, but this sheet draws it inside the Mongol block — which is also where the
federation as a whole was governed from — so using it would have put Chanan's
name on the Mongol leagues. Anything the three points do not claim would go in
unlabelled rather than off the map; nothing does.

Hover-checked with Administrative on: Kweisui and Kalgan answer the Mongol
leagues, Tatung answers Jinbei, Hsuanhua answers Chanan, and each shows
Mengchiang underneath as its parent.

### Korea exported for the GIS project
`tools/export_korea.py` writes two files into a folder given on the command
line, and they went to `Dropbox/GIS/Korea/`:

* `korea-provinces-1930.geojson` — the thirteen colonial provinces, 6,530
  vertices, each carrying the names the map shows for it in English, Japanese,
  Chinese and Korean, read out of `texts/`.
* `korea-1930.geojson` — the country as one outline, 4,081 vertices, **dissolved
  from those same provinces** rather than traced separately, so the two files
  agree to the vertex and the outline is exactly the provinces with their shared
  edges cancelled.

Coordinates are EPSG:4326 as they are in the cache: `fetch_korea_1930.py` has
already turned the source SVG's equirectangular grid back into degrees and
corrected its residual offset against Natural Earth's coastline. Nothing is
reprojected or simplified — this is the data the build starts from, not the
thinned version it draws.

### China as a whole, under everything
`1928-45 Provinces Republican China v2/1928_1945.shp` is the same sheet dissolved
to one polygon — one record, 2,013 rings, 18,008 points, the Republic entire:
Sinkiang, Tibet, Manchuria, Jehol, Chahar and Suiyuan all fall inside it. Asked
for as the basic shape of China, under the polygons for Tibet on both dates and
Manchukuo, Mengchiang and the occupation on the second. The v1 provinces are
untouched and still drive the Administrative layer.

It goes in as `chinabase`, the filler laid under the atoms: neutral colour, no
pointer, so a sliver between two disagreeing sources reads as a seam rather than
as one country leaking into the next. The drawn filler is 82 rings and 45.3 KB
after the dissolve and the frame clip.

**This is the thing `NE_CHINA_MAINLAND = False` gave up.** That flag turned off
Natural Earth's outline in the same role because it was much coarser than the
provinces and so drew China's shore twice — a rough dark line where the modern
outline ran and a fine one a kilometre away where the provinces did. This
polygon comes off the same sheet as the provinces, so it does not; the flag
stays off and the comment above it now says which layer took the job over.

Measured, filler-visible pixels with it on against it off: China's coast 0.058%
of the view on the 1930 map and 0.020% on the 1942, Tibet and Sinkiang 0.161%,
Manchuria 0.011%. The two long runs — 114 px and 102 px — are along frontiers
where the traced neighbours and the ENP sheet disagree, which is the gap it
exists to plug. Nothing shows as a fringe along the coast.

### The Soviet edits are not in the file yet
Re-exported `soviet-union.gpkg` and the `sovietunion` layer came back
byte-identical to what is committed: 201 polygons, 34,257 vertices, main ring
21,591 points, same bbox. The `.gpkg-wal` is 4 MB and the file's mtime matches
the QGIS session, so the edits look unsaved on that layer.

What *has* moved is the second layer, `difference`: 205 polygons, 19.7 million
km², reaching south to 32.4° N against 39.6°, and by point test it excludes
Vladivostok, Tuva and Ulan Bator while including Tashkent. That reads as a
working layer mid-operation rather than a finished USSR, so nothing was taken
from it and the Soviet Union is left as it was.

### Control-click takes a shape away
Asked for: the opposite of isolate. Option-click still hides everything except
the shape under the pointer; control-click now hides the shape itself and leaves
the rest, and doing it again takes the next layer off — which is how to see what
something is sitting on. The tool is *Isolate or remove a shape*.

Both share one undo stack, so *Show everything again* and **Escape** put back
whatever either of them hid, in reverse order and to the exact `display` each
element had. A shape the epoch was already hiding is skipped and stays hidden,
as before.

macOS turns control-click into a context menu, and depending on the browser the
pointer event that comes with it may or may not reach the tap hook. So the same
click is caught in both places — the hook and a `contextmenu` listener that
suppresses the menu — and whichever arrives second inside 400 ms is ignored.

Checked in the browser: control-clicking the 1942 China view took away the
occupied zone's main block (1,800 points), a second click took away Anhui
underneath it, and Escape restored both — hidden elements 418 → 419 → 420 → 418.
The readout names each shape as it goes.

### Why the Soviet coast did not look like the file
Reported: the USSR on the map looks very different from `soviet-union.gpkg` in
QGIS. Two causes, both mine, both now fixed. The file itself is unchanged — a
third re-export came back byte-identical, 201 polygons and 34,257 vertices.

**Sakhalin was drawn twice.** The Natural Earth branch has a special case for
Sakhalin that splits the island at the 50th parallel and appends the northern
half to `groups["ussr"]` *before* `split_russia` is consulted — so the guard
that makes Natural Earth stand down never saw it. The drawn atom carried two
116-point Sakhalins, one at lat 49.99 from the tracing and one at 50.00 from
Natural Earth, with two different coastlines a kilometre apart. The guard is on
that branch now: 11 subpaths to 10.

**And the coast was drawn at the coarsest band.** `ussr` spans more than three
degrees, so `tol_for` gave it 0.55 units — about three kilometres — and every
bay on the Okhotsk and Primorye shore was flattened. Measured against the file:
median **0.108 units (0.4 km)**, 90th 0.359 (1.3 km), max 0.580 (2.1 km). At the
zoom in the screenshots that is 5 to 26 device pixels, which is exactly the
difference reported.

It is a tracing, so it now goes in `TRACED_TOL` at 0.021 with British India and
the two NCA layers — half a pixel at the deepest zoom. Re-measured: median
**0.0024 units (10 metres)**, 90th 0.0052, max 0.0250. The drawn atom goes from
1,021 points and 17.4 KB to 6,483 and 88.2 KB; by the headroom figures in
`reports/2026.08.18-recommendations.md` that is about **0.37 ms a frame**, which
is inside the noise of a 29 ms frame.

The lesson for the next traced layer: a hand-drawn coast is worth nothing if it
is then thinned by the band its bounding box earns. Three of the six layers
swapped in this week needed `TRACED_TOL`, and it was found each time by
measuring the drawn line against the file rather than by looking at the map.

### Weihaiwei and Kwangchowwan exported for the GIS project
`tools/export_leaseholds.py`, on the pattern of `export_korea.py`, writing into
a folder each under `Dropbox/GIS/China/`:

| file | features | vertices | |
|---|---:|---:|---|
| `Weihaiwei/weihaiwei-1930.geojson` | 1 | 209 | 4 polygons, 346 km², 121.94–122.28° E |
| `Kwangchowwan/kwangchowwan-1930.geojson` | 1 | 497 | 6 polygons, 1,210 km², 110.09–110.63° E |
| `Kwangchowwan/kwangchowwan-1930-water.geojson` | 1 | 10 | the traced bay, see below |

Both are held in the *Modern East Asia GIS* project as GeoPackages in an
azimuthal-equidistant grid centred on Wuhan, on the Clarke 1866 ellipsoid, so
the export converts them to longitude and latitude the way the build does — by
solving the geodesic direct problem, which is what that grid is: a true bearing
and a true distance from the centre. Worth naming, because an earlier version of
this project inverted the same grid with the spherical formula and put every
layer two to six kilometres out of place, radially away from Wuhan.

Kwangchowwan gets a second file that is **not** a boundary: the hand-traced ring
of Guangzhou Bay's water, ten points, which exists only because Natural Earth
paints the arms of the bay as land and China's yellow was showing in the
channels between the leasehold's six pieces. Everything inside that ring which
the leasehold does not cover is painted as water. It is exported because it is
data this map holds and the GIS project does not; it should not be mistaken for
a claim about anything.

Nothing is simplified in either file — this is what the build starts from, not
what it draws. The names travel with the geometry, in the four scripts the map
shows them in.

### Taiwan exported, with a warning attached
`tools/export_taiwan.py` writes `GIS/Taiwan/taiwan-1930.geojson` — 7 rings, 531
vertices: the island (36,021 km², 406 points), the Pescadores in four pieces,
Green Island and Orchid Island.

**It is not a period source, and the file says so in its own properties.** Unlike
the Korea export beside it, or the two leaseholds, Taiwan is one of the places
this map draws Natural Earth's present-day coastline, because no period layer of
it has been made. Anyone taking this file for a 1930s outline would be taking a
2020s one.

Two editorial decisions travel with it, one applied and one deliberately not:

* **Kinmen is left out**, as it is on the map. Natural Earth files it under
  Taiwan because it is governed from Taipei today; it belonged to Fujian
  throughout the colonial period. Checked: Kinmen absent, Taipei and Makung
  present.
* **The Pescadores are kept**, having been ceded with Taiwan in 1895 and been
  part of the colony.

Unsimplified, like the others: what the build starts from, not what it draws.

Asked for afterwards, and right: the layer and its warning now sit together in
`GIS/Taiwan/taiwan-1930/`, as `taiwan-1930.geojson` and `taiwan-1930.md`, so the
note cannot be separated from the thing it warns about. The note says what the
file is, what it is not, where Kinmen went and how to get it back, that the
Pescadores are four of the seven rings, how to remake the file, and what tracing
a period Taiwan would involve — a Japanese colonial sheet, which would bring the
colonial prefectures with it and let the map name them as it names Korea's
provinces. The `Taiwan/` folder already held a railway-stations dataset, which
is why a folder per layer is the right shape there.

### Mengchiang dated to the map's own year
The date line read *Client regime from 1936–39*, which is the story of how it
came about and not what it was in December 1942. On a map of that date it also
read as though the thing had ended in 1939.

It says **Federated September 1939; Japanese client from 1936** now — the
federation is the state on the map, and 1936 is kept because that is when the
Japanese-sponsored Mongol governments start.

The note carries the clarification, in two sentences: Japanese-sponsored Mongol
governments date from 1936; the state drawn here is the September 1939
federation, which joined the Mongol leagues to Chanan out of southern Chahar and
Jinbei out of northern Shansi, and which is what stood in December 1942 — with a
pointer to the Administrative layer, where the three are named.

### Three layers replaced, and the frontiers nobody had settled
`soviet-union-v2`, `tannu-tuva-v3`, `outer-mongolia-v2` and a new
`border-unclear-contested`, all from the cache.

**The Soviet chords are gone.** The straight cuts across the Sinkiang frontier
that made the wedge — 6.19° and 5.82° long in v1 — are not in v2: the longest
segment in that window is now 0.918°, and the window holds 204 points against
150. Sakhalin still stops at 49.99° and there is still not a Kurile ring in the
file, so Karafuto and Chishima go on coming from Natural Earth.

**Tannu Tuva v3** is 104 points against 96, and the duplicate is gone — the
second feature is now an empty geometry rather than a second copy of the shape,
which the loader skips. **Outer Mongolia v2 is byte-identical to v1**; the
filename is updated so the cache matches what was handed over, and nothing on
the map moved.

**The four contested frontiers** are drawn over whatever they cross, in a
crossed hatch rather than the raked stripes every other overlay uses. The hatch
went in at 0.55 stroke-opacity and 1.1 width and stuck out — it read as a layer
of its own rather than as a caution laid over somebody else's ground. It is 0.3
and 0.95 now, on the same 7-unit grid. That is
deliberate: the stripes on this map mean *somebody else holds this ground too*,
and these mean *the line itself was not settled*, which should not read as a
third claimant. The atoms are `transparent`, so the countries underneath keep
their colours and only the crossing lines are added.

| stretch | area | claimed by |
|---|---:|---|
| Kachin country, Burma–Yunnan | 67,734 km² | 97.5, 26.3 |
| the Pamirs | 71,705 km² | 73.5, 37.5 |
| Aksai Chin | 42,200 km² | 78.5, 35.3 |
| the McMahon line | 79,371 km² | 94.0, 28.2 |

**The Burma stretch is a 1930 record only.** In December 1942 that ground was
under Japanese occupation, and saying so is more use than saying whose frontier
it had been — so `contested_burma` is its own atom and the 1942 record lists only
the other three. Checked: on the 1930 map all four answer *Frontier not settled*;
on the 1942 map the Kachin country answers *Burma — Taken 1942* and the other
three still answer *Frontier not settled*.

### Legend wording, and Australia without a row of its own
* **1942: *Allied* is now *British***. The row covers British India, Ceylon, the
  princely states, the British Pacific colonies and the eastern Solomons; the
  Japanese, Chinese and Korean forms are the ones the 1930 *British* row already
  used, so the two dates say the same word for the same thing.
* **1942: *Co-belligerent* is now *Thai (Japanese ally)***, and it is the only
  record in that category. A colour named for a relationship told a reader
  nothing about which country was being pointed at.
* **1930: *Independent* is now *Siam***, for the same reason — Siam is the only
  country in it.
* **Australia keeps a tint and loses its row.** The `australian` category is
  gone; Australia, Papua and the Territory of New Guinea, Nauru and the mandate
  boundary are all in `british` now and carry `c: #c9a6b0`, the shade that row
  used to have. Asked for on the grounds that a Dominion's independent standing
  is not worth a legend entry of its own on a map about somebody else's empire —
  but the ground still reads as not-quite-Britain, which is the useful part.

Nothing moved on the map: the four records keep the exact colour they had. The
1930 legend goes from thirteen rows to twelve and the 1942 legend keeps its
count. Checked in both epochs.

### Karafuto and the Kuriles exported
`tools/export_karafuto.py` writes two folders under `GIS/Japan/`, each with the
layer and a note beside it, as the Taiwan export does:

* `karafuto-1930/` — one polygon, 445 vertices: Natural Earth's Sakhalin cut at
  50° N.
* `kuriles-1930/` — 18 islands, 870 vertices, **all 18 named**: Etorofu,
  Kunashiri, Paramushir, Urup, Onekotan, Shikotan, Simushir, Shumshu,
  Shiashkotan, the Habomais, Rasshua, Kharimkotan, Ekarma, Matua, Makanrushi,
  Alaid, Chirpoy and Ketoy, one feature each.

**Karafuto's straight northern edge is not an approximation** and the note says
so: the 50th parallel *was* the border, from Portsmouth in 1905 to the Soviet
landings of August 1945. What is approximate is the coast, which is a
present-day one — no period layer of Sakhalin or the chain has been traced.

The Kuriles are picked out of Natural Earth's *Russia* by position, because
Natural Earth files them under the country that holds them today: a centroid
between 145 and 157.5° E and 43 and 51.5° N on a ring under four degrees across,
which is `split_russia` in the build. That is a rule about where the islands are
rather than about who held them, so it does not need revisiting per date.

### China's provinces redrawn, and three kinds of scaffolding removed
`republican-china-provinces-v5.geojson` replaces the ENP shapefile: 29 features,
one per province, names in the file, 25,773 vertices. The build reads it
directly and falls back to the old sheet if it is ever missing.

Three of its names are not the ones the rest of the build knows the provinces
by, so `CHINA_PROVINCE_ALIAS` translates them: **Rehe → Jehol, Chahar →
Chahaer, Tibet → Xizang**. With that, every province lands where it should:
china 21, manchuria 3, and one each for xinjiang, tibet, jehol, chahar, suiyuan
and suiyuan_w — the Paotow cut still works.

**No simplification**, as asked. Nothing had to be done for it: China's atoms
are in `ENP_ATOMS`, which is folded into `FULL_DETAIL`, so they were always
drawn at their source's own detail.

**What came out**, all of it scaffolding for disagreements that no longer exist:

* **The Guangzhou Bay carve-out** (`#gzw-bay`) and **Weihaiwei's seaward
  fringe** — both were even-odd subtractions standing in for a polygon
  difference this build does not have. The provinces are cut round the
  leaseholds now, so the leaseholds simply draw over China.
* **The traced Guangzhou Bay water** out of `LEASEHOLD_SEA`. Kwantung's ring
  stays: the country under *it* is still Natural Earth's coarse outline.
* **The whole-Republic filler** put into `chinabase` yesterday. With the
  provinces meeting their neighbours cleanly it had nothing to fill, and where
  it disagreed with them along the coast it showed as a grey fringe — worse
  than the crack it insured against. `CHINA_WHOLE` is left defined with a note
  saying where to put the rings back if a future source needs it.

Checked by eye at both leaseholds and across China: Kwangchowwan sits in its own
hole in Kwangtung with no water ring and no bay carve; Weihaiwei's semicircle
sits on Shantung with no fringe; the grey slivers along the coast are gone.

### A version and a build time at the foot of About
`texts/version.csv` holds the number and nothing else — **0.8** — and
`tools/build_texts.py` stamps the date and time when it runs, appending
*Version 0.8 · last updated 21 August 2026, 16:18* as the last line of the About
dialog.

The date is stamped rather than written by hand because it has one job — telling
a reader how old the thing in front of them is — and a hand-written one goes
stale the first time somebody forgets. It matches the push because the build is
what happens immediately before pushing; if a build is ever made and not pushed,
the stamp will be early by that gap and nothing else.

To cut a new version, edit the one line in `texts/version.csv`.

### Mengchiang: what it held, and what it claimed
`mengjiang-actual-occupied.geojson` becomes the fill — 1 ring, 761 vertices,
441,459 km² — and the 1940 sheet's 603,888 km² becomes a thick dotted line over
it, `#mengjiang-claim`, shown on the 1942 map only. So the map says both things
at once: the ground held, and the frontier every map of the state draws. The
west, beyond Paotow, is inside the line and outside the fill.

The three constituent governments are still named from the claim, since they can
only be told apart there.

**It did not.** The fill was still following the claim, and the reason was not
the atom's own rings but the filler under them. Settled below, under
*Mengchiang: a line round empty ground*.

### The base areas retraced
`ccp-resistance-areas-1941-1942-p199-v2.geojson` replaces the first tracing.
Seventy-five shapes in both, 2,063 vertices in both, and only two rings differ:
one pocket on the Shantung coast moves bodily 48 km west and 17 km south —
same area to five decimal places, so it is a repositioning and not a redraw —
and another loses about 3% of its area to two vertices. Both stay in the
Qinghe zone, so no patch changes the name it answers with.

Drawn at full fidelity, as before: `ccp` is in `FULL_DETAIL` and gets no
Douglas–Peucker at all. 1,986 vertices reach the SVG out of 1,988 distinct
ones — 2,063 less the 75 closing points — the last two lost where neighbouring
vertices round onto the same hundredth of a unit.

### Mengchiang: a line round empty ground
`mengjiang-unoccupied.geojson` is now the dotted line. Eight pieces, 162
vertices, every one of them drawn, in place of the whole 1940 claim. So the
line marks only the third of the claim that was never held, and the stretch
where claim and control agreed is left to the fill — a dashed frontier there
would have said the boundary was in doubt where it was the one part of it that
was not.

The fill was still following the claim, which is what task #101 suspected. The
cause was not the atom's own rings but the filler under them: `whole_union`
builds it by dissolving the sub-units, and the sub-units are the three claimed
governments. Two changes fix it — `backing["mengjiang"]` is set from the held
polygon directly, the way Manchukuo's is, and the three governments are drawn
through `clip-meng-held`, a clip of the held ground, so the Administrative
layer cannot paint past it either.

The clip is the held polygon rather than the complement of the unheld one,
though the two ought to be the same shape. They are not quite: about 700 km²
south of Kweisui, round 112.0 E 39.4 N, is inside the claim and inside neither
of the other two files. Clipping to what was held cannot show a gap between
them whatever the sources do — that ground now reads as Free China with no
dotted line over it, which is a fair account of a place no file claims.

An even-odd hole was tried first and abandoned: the unheld ground straddles the
boundary between the Mongol leagues and North Shansi, so a hole punched in one
would have left the other painting over it.

Measured over 300,000 points in the state's bounding box: no sub-unit paints
outside the held ground, against 131 before. Point tests — 105.5 E 41.5 N,
107.5 E 41.5 N and 106.5 E 42.0 N are unfilled and inside the dotted line;
Kweisui, Datong, Hsuanhua and Silingol are filled and outside it.

### The line of control leaves Free China outside it
Two stretches of `EXTENT_SOUTH_CHINA`, both the same fault: the dashed
perimeter enclosed country nobody held.

**The Canton delta.** `enclave_detour` followed the traced block down to about
22.46 N and the hand-drawn course then cut the corner straight to
Kwangchowwan, leaving the whole west bank inside — Taishan, Sunwui, Yanping,
Hoshan and the coast to Yeungkong. The new course is traced off the western
limit of the occupation itself, nineteen points from 112.95 E 22.46 N down to
the shore at Yeungkong, and it stays on the land the whole way: the water off
that coast was the navy's and belongs inside the line, so the detour goes round
the country and not round the bay. Two supporting changes: the delta's
keep-inland box reaches south to 21.50 so `hug_coast` leaves a traced course
where it was drawn, and the delta's detour box floor rises from 22.25 to 22.52,
because below that line an arc grown off the block would only put a
generalisation back on top of a tracing.

**The Leizhou peninsula.** The line swung north into the bay west of Haikang
and took the end of the peninsula with it. Four points now carry it south of
the tip through the Qiongzhou strait instead.

The fifth point of that set, 109.99962 20.44764, is deliberately left out. It
sits in the bay north of the others, and with it in, the line turns back north
and takes a strip of western Leizhou — Suikai and the coast above Techow —
inside instead. Measured rather than argued: it put about forty cells of Free
China on a five-kilometre grid back inside the line, which is the thing the
change exists to remove.

Measured over the whole country, 150,000 random points of which 92,146 fell on
China's land: Free China inside the line falls from **415 to 298**, 0.45% of the
land to 0.32%. Occupied ground left *outside* the line is unchanged at 73, which
is the test that matters as much — the line was moved to let country out, not to
push it in, and nothing was lost from the other side.

Three waypoints were added in the water down the peninsula's east coast, and
they are not cosmetic. Without them the smoothing dropped a vertex in the
middle of Leizhou, and `hug_coast`, asked which way the sea lay, answered along
the peninsula's own axis and threw it nine tenths of a degree west into the
Gulf of Tonkin. The perimeter crossed itself there and the whole peninsula read
as held.

### The occupied zone redrawn, and both clips taken out
`japanese-occupied-territory-1941-2-vs.geojson` replaces the v2 tracing —
`-vs` and not `-v3`, which is not in the cache; same file, going by the date it
was written and by what it does. The bounds are the same on three sides and the
northern limit falls from 41.87 N to 40.71 N: it no longer reaches over the
Wall into Jehol. 723 rings against 724, 7,717 vertices against 6,470, so it is
finer as well as shorter.

With it in, both clips on the occupied zone are gone.

* **`clip-china`** — every province path, China's own outline and three pieces
  of Chahar and Suiyuan clipped to two boxes, **373 subpaths and 21,254
  vertices, 295 KB**. It made the shading stop at the coast and at the
  frontier.
* **`clip-off-clients`** — the frame with Mengchiang's and Manchukuo's rings
  punched out under the even-odd rule, 6,038 vertices and 86 KB. It kept the
  shading off the two client states.

Both were insurance against a zone that overran its ground, and the new tracing
does not. Measured on the raw geometry, which is what gets painted once the
clips are off:

| | v2 unclipped | v3 unclipped |
|---|---|---|
| outside China's land | 17.25% | **0.36%** |
| over Manchukuo or Mengchiang | 19.51% | **0.00%** |

The remaining 0.36% is eleven samples in twenty-five thousand, every one of
them on a coast: the Yellow River delta round 118.6 E 37.9 N, which prograded
between the survey and Natural Earth's coastline, the Chekiang shore by Chusan,
and the south coast of Hainan. Sub-pixel disagreements between two sources
about where the water starts.

The main file falls from 3.1 MB to 2.7 MB.

Asked for as *put it underneath Manchukuo and Mengchiang*, and it is: the atoms
are emitted `occupiedzone`, `mengjiang`, `manchuria`, `manchukuo`, so all three
draw over it. The case that would still show is Administrative off, where those
two are painted by their backing and the backing sits at the head of the stack
under everything — but the overlap is zero, so there is nothing for it to show.
Worth knowing if a later zone file ever reaches over the Wall again.

### China answers as one country, and stops leaving a filler behind
Three separate things, and two of them turned out to be the same fault seen
from different sides.

**Selecting China on the 1930 map takes in all of it but Tibet.** The records
were right all along — `china` lists `lights: manchuria jehol chaharsuiyuan
xinjiang`, and each of those carries `within: china` — and hovering already
lit the lot. Clicking did not. `redrawHighlight` drew the hover outline round
`litFor(hot)` and the selection outline round `atomsOf[selected]`, so the two
disagreed by four territories: hover lit the Republic and the click then drew
round China proper alone. The selection uses `litFor` now, and the two say the
same thing. Tibet is untouched — it is neither in the `lights` list nor
`within` anything, which is the correct account of 1930.

**The filler under China is gone.** The leasehold at Kwangchowwan showed
China's colour through it with Administrative off, and the v5 provinces were
not at fault: measured over 23,944 sample points inside the leasehold, the
provinces cover **0.004%** of it and the filler covered **25.5%**. The filler
is `dissolve()` run over the province rings, and it manufactured three small
rings inside the Kwangchowwan indentation — 1.69, 9.35 and 4.17 square units,
against leasehold pieces of 1.88, 9.68 and 4.49 — out of nothing in the source.
Checked directly: `republican-china-provinces-v5.geojson` has **no ring at all**
whose bounding box lies inside the leasehold. Not a hole-winding problem
either; even-odd fill gives the same 25.5%, because these are standalone rings
and not holes.

So `NO_BACKING = {"china"}`, and the provinces stand as the atom. Coverage of
the leasehold falls to **0.00%**. `whole_union` still runs — `occupied_coast`
reads the rings it leaves in `whole_pts` — and only the path is dropped. China
can no longer be deferred, since with no filler the sub-units are the country,
so its divisions move from the Administrative file into the main one: the main
file goes 2.75 MB to 2.82 MB and the Administrative file 1.10 MB to 1.03 MB,
which is a wash.

**Burma, Thailand and French Indochina are drawn whole.** `NO_ADMIN_SUBUNITS`
suppresses their divisions, because none of the three sets is trustworthy for
the dates this map draws: Burma's are the present-day states and regions,
Thailand's the present-day changwat, and Indochina's Vietnamese three —
Tonkin, Annam, Cochinchina — are cut by two straight lines standing in for
watershed boundaries, which is a guess in the shape of a fact. The provinces
ceded to Thailand in 1941 keep theirs, being atoms of their own: `siamgain`
holds 8 and `saharat` 4. Point-tested after the change — Rangoon, Mandalay,
Bangkok, Chiang Mai, Hanoi, Saigon, Phnom Penh, Vientiane all still draw, and
Battambang and Siem Reap still answer as ceded ground. Every other atom's
filler is byte-identical to the last commit.

The Administrative file falls to 889 KB and the main file to 2.6 MB.

**Noticed in passing, not chased**: `saharat`'s filler does not seem to cover
Battambang, so with Administrative off the 1942 Thai annexation may be drawn
only where its sub-units are — which are deferred. It is unchanged by this
work and byte-identical to the last commit, so it is old, not new.

### Provinces and islands are named once the reader is close in
With *Show names* on and the view inside a twelfth of the map's width, the
divisions inside a country are labelled — and the Administrative switch is not
consulted. That switch is about drawing the **boundaries**; a reader who has
zoomed into Kwangtung wants to know it is Kwangtung whether or not there is a
line round it. Nothing is stroked, because nothing asks for `.subs`. The
geometry is fetched if it is not already in the document, which is all the
switch was ever guarding.

Two halves.

**The build now says where a name goes.** `province_paths` computes the
centroid and area of each sub-unit's largest ring and writes them as
`data-cx`, `data-cy` and `data-area` on the path. The largest ring and not the
whole block, so a province is named in its own main piece rather than in the
middle of an archipelago it happens to own — and computed here, where the
projected rings are already to hand, rather than by asking the browser for a
bounding box on two thousand paths at deep zoom. 242 sub-units in the main
file carry one and 149 in the Administrative file, all of them.

**Not everything wearing `data-prov` is a division.** The occupied zone names
its own blocks that way — *North China and the Yangtze valley*, *The Canton
delta*, *Hainan*, *Swatow and Chaochow* — and each is one shading in many
pieces, so labelling every piece would have written the same phrase 753 times
across China. Those are skipped: no centroid and no name on the shape. The
fine coastlines are the other kind — real islands, named on the shape itself,
from a source with no centroid — and those are wanted, so they fall through to
`getBBox`, which is affordable because there are a few hundred of them and they
are only in the document at deep zoom anyway.

Sub-unit labels are dropped when their shape goes: the atom is not drawn in
this epoch, or the alternative province source has replaced it. Read off the
inline style rather than the computed one, since that test runs over every
label on every zoom.

### Burma, cut to meet its neighbours
Two candidates in the GIS folder, measured against the two layers Burma has to
sit between — `india-1931` and the v5 Republican provinces. Rasterised at
0.01°, about 1.2 km a cell, over a window from 90.5 to 102.5 E and 8.5 to
29.5 N. Overlap is ground claimed twice; gap is ground in none of the three
within 3 km of both Burma and its neighbour.

| source | area km² | over India | over China | gap vs India | gap vs China |
|---|---|---|---|---|---|
| Natural Earth (what was drawn) | 665,613 | 379 | 4,409 | 644 | 539 |
| **burma-modern-modified** | 662,532 | **0** | **0** | **105** | **24** |
| burma-1931 | 636,970 | 13,825 | 16,954 | 228 | 251 |

`burma-modern-modified` is the one that was clipped: it overlaps neither
neighbour by a single square kilometre. `burma-1931` is a period tracing and
the worst fit of the three, over five per cent of its own area double-claimed;
left where it is until somebody reconciles it with the layers either side.

**The band undid the clipping as fast as it was done.** Wired in and thinned by
the band a country that size earns — 0.55 units, three kilometres — the drawn
shape lay over 390 km² of India and 585 of China, from a source that overlapped
by nothing. A clipped edge has to be drawn where it was clipped, so `burma` is
in `TRACED_TOL` at 0.021 with India and the Soviet Union. **4,082 of 4,523
source vertices survive the build, 90%**, and 39 rings out of 39: the old
drawing had 23, so sixteen islands off the Tenasserim coast that were being
sieved away are now on the map.

Drawn, against drawn: overlap with India falls from 379 km² to **3**, with
China from 4,409 to **8**; the gaps fall from 644 and 539 to **108** and **32**.

**It stops at 27.98 N and not 28.53**, which drops about 3,800 km² of the
Kachin salient. That ground is not lost — the contested-frontier layer already
covers it, tested at 97.60/28.10 and 97.40/28.40 — and hatching a frontier
nobody had surveyed is a better account of it than drawing it as Burma.

**The water body was not found.** Sampled across the whole of western Burma at
a quarter-degree and then the Arakan at a twentieth, every cell is accounted
for: India, Burma, Siam, or the Bay of Bengal. The one indentation that looks
like a lake on a coarse grid — about 94.0 E, 18.9 N — is the Kaladan and Lemro
estuaries at Combermere Bay, and both candidate polygons have it, so it is real
coastline. Whatever the corruption is, it is not a hole in the Burma polygon
and not a difference between these two files. Worth a screenshot.

### Two sessions, one tree
Recorded because it cost time twice. Another session was working the same
checkout — the Layers panel, the info card, the gazetteer prose, the pinyin
sweep through `texts/` — and its edits arrived in files this session was also
editing. `map.js`, `styles.css` and `index.html` each held both sets at once.
Nothing collided in the end, but only because the two were in different
functions and different paragraphs.

Two things worth knowing next time. `index.html` and `data.js` are **built**
from `texts/`, so running `build_texts.py` while somebody is halfway through
editing the prose splices a half-finished argument into the page — which
happened, and is why nothing was committed until that session had landed.
And the gazetteer's `rationale` column, 166 rows of it, is internal: the built
`cities-gaz.js` carries only `id`, `n`, `lat`, `lon`, `t`, `c`, `of` and `p`,
so it does not compete with the reader-facing notes. Checked rather than
assumed. If it ever does become reader-facing, its prose is still in postal
romanisation — "Peking–Hankow" — while `texts/` is now pinyin throughout.

**The version ran away.** `build_texts.py` moves the number on a hundredth every
time it runs, and a session that rebuilds while measuring runs it twenty times:
0.82 at the last commit, 1.01 at this one, with no release in between. The rule
does what it was asked to do; what it counts is a build and not a push.

**34 MB left out.** `data/gazetteer` holds four GeoJSON files built from the
GeoNames dumps — places-merged 12 MB, places-populated 11 MB, places-seats
7.1 MB, places-china 3.7 MB. Nothing on the site fetches one: `cities-gaz.js`
is built from `data/cities-*.csv`. They are ignored, and `README.md` and
`build_geojson.py` are committed instead, so anyone can rebuild them.

### Mengchiang hovers as the state it claimed to be, under the name it had
Two corrections, and the second is the one that matters.

**The outline traces the whole claim.** The fill is the ground held and the
dotted line is the frontier claimed, so hovering drew a line round the held
ground alone — which asserts that the frontier was where the fill stopped, the
very thing the dotted line exists to deny. `#mengjiang-whole` is the claim
entire, emitted with no fill, no stroke and no pointer: it is there so the
outline has the whole state to trace. It reaches Mengchiang's hover through a
new `data-lit-for` attribute, which `litFor` now collects, so the relation is
written on the shape rather than special-cased in the code. Three rings, 874
vertices, and the mask that makes the silhouette covers all three, so the lines
between the three governments do not show. Point-tested: the whole is exactly
the fill plus the dotted area, at six sample points inside, outside and in the
western wedge.

**The name was fifteen months out of date.** The record gave 蒙疆聯合自治政府,
the Mengchiang United Autonomous Government, which is the name from the
federation of September 1939. On 4 August 1941 the regime was renamed 蒙古自治邦,
the Mongol Autonomous Federation, and that is what it was called in December
1942 — the date this map draws. `orig`, `zh` and `ja` now carry 蒙古自治邦, the
Japanese reading is Mōko Jichihō, and `when` says when the change happened
rather than stopping at 1939. The English headline stays *Měngjiāng
(Mengchiang)*, which is what the territory is called in anything a student will
read; the formal name is the line underneath.

The prose says what the two shapes mean in one sentence: the line is the
claim, the fill the approximate area of control. It said it in a paragraph
first, with both areas in square kilometres and a line about Free China in
everything but name — too much text for a card somebody reads while pointing
at a map.

### The contested frontier reworded
*Frontier not settled* becomes **Border is contested or not fixed** — six
fields across three files, the legend rows for both epochs in
`texts/categories.csv` (name and `orig` each) and the `contested` row in both
territory tables. `data.js` is regenerated from those and now carries the new
wording at all four sites. The trailing full stop was dropped: it is a label on
a legend, not a sentence. The Japanese, Chinese and Korean renderings are
unchanged — 未確定国境, 未定國界, 미확정 국경 already say it.

### One push, one hundredth
The version bumped on every run of `build_texts.py`, and a session that
rebuilds while measuring runs it twenty times: 0.82 to 1.02 in a day, with
nothing released in between. A number that says a teaching map has passed 1.0
when it has not is a number that lies to the reader.

The bump is now opt-in — `python3 tools/build_texts.py --bump` — and an
ordinary build stamps the date and leaves the number alone. The rule is
written into a new project `CLAUDE.md` at the root, along with four others
this session learned the hard way: read CSVs with a parser and never with awk,
do not simplify geometry unasked, record what changed before marking it done,
and check `git status` before building, because `index.html` and `data.js` are
generated from `texts/` and another session may be halfway through editing it.

Set back to **0.84**: 0.82 was the last honest value, and there have been two
pushes since.

### Chahar and Suiyuan part company, and the provinces say something
**They were one record.** `chaharsuiyuan` carried three atoms — `chahar`,
`suiyuan`, `suiyuan_w` — so hovering either province lit both, and the headline
said *Chahar* while the line under it said *Chahar & Suiyuan*. They are two
records now, `chahar` with one atom and `suiyuan` with the two halves of its
own, and China's `lights` list names both. The prose splits with them.

That should also account for the line inside Suiyuan. `SUIYUAN_CUT` at 109.6 E
and `SUIYUAN_ORDOS_LAT` at 40.45 N divide the province for the 1942 map, where
the east was Mengchiang's and the west Free China's, and the two halves meet
exactly — checked vertex by vertex: 872.000/376.930 to 872.000/436.640 to
959.170/436.640 on one side, the same three points reversed on the other. No
element is stroked along either line; nothing is drawn there. What the reader
saw was the hover outline, which was covering all three atoms because they were
one record, and a mask built from two abutting fills leaves a seam between
them. Hovering Chahar no longer reaches Suiyuan at all. **Worth re-checking on
the Suiyuan hover**, where the two halves are still outlined together; if a
line survives there, the fix is to merge the shapes across elements in
`outlineOf` rather than only within one.

**Ejina was wrong, and by 240 km.** The note called it "the western end of the
country Mengchiang claimed and never held". Measured against the state's own
1940 sheet, whose westernmost point is 103.927 E: Ejina is at 101.05 E, **2.88
degrees — about 240 km — west of anything Mengchiang put on a map**, and inside
neither the claim nor the held area. It was the Ejine Torghut banner,
administered from Ningxia. The note now says so, and mentions Khara-Khoto
instead.

**Pinyin for people.** Zhang Xueliang, Zhang Zuolin, Wang Jingwei, Sheng
Shicai, Fu Zuoyi — six files. Chiang Kai-shek and Sun Yat-sen keep their
conventional forms, as asked. Place names in the `Pinyin (Postal)` pattern are
untouched: Fengtian is a province there, not a person.

**Twenty-nine provinces given a description.** What each was known for, who
held it in 1930 where that was the politics — Yan Xishan in Shanxi, ruling it
from 1911 to 1949 with its own railway gauge and its own currency; Long Yun in
Yunnan from 1927; Li Zongren and Bai Chongxi in Guangxi; Chen Jitang in
Guangdong; Han Fuju in Shandong; Ma Hongkui in Ningxia and Ma Bufang in
Qinghai; Sichuan divided among garrison-area warlords until 1935 — and, for
the provinces that did not last, when they went: Zhili renamed Hebei in 1928,
Jehol taken in 1933 and abolished in 1955, Xikang a region until 1939 and a
province until 1955, Chahar abolished in 1952, Suiyuan in 1954.

### The base areas stay on when somebody follows an old link
*Show resistance base areas* already started switched on — `ccp: true` in the
state and `checked` on the box — so the report that it was off pointed
somewhere else. Two things can turn it off after the default: a choice
remembered in `localStorage`, which is the switch doing its job; and the
`layers=` code in a shared address, which was not.

The bitfield could not tell *the sender had it off* from *the sender's build
had no such bit*. Bit 4096 was added today, and every link made before that
carries a zero there — read the obvious way round, an older address turned the
base areas off for whoever opened it. The base areas are the one layer in that
field that starts on, so it is the only one where a missing bit reads as a
decision.

The bit is inverted now: **set means off**. An absent bit is the default, which
is what an old link ought to mean. Round-tripped both ways, and a code with the
bit absent decodes to on.

Nothing else in the field needs it: every other layer there starts off, so zero
already means what it should.

### Seven rings that were never ground
The dotted line round Mengchiang's unheld west was also appearing as rows of
dots along the Mongolian frontier in the north and the Manchukuo frontier in
the east, where no such line belongs. Nothing had leaked: the line is drawn
from `mengjiang-unoccupied.geojson` and from nothing else, and that file holds
**eight features, not one**.

| fid | vertices | what it is |
|---|---|---|
| 5 | 132 | the unoccupied west, 164,809 km² — the one intended |
| 1, 2, 3, 4 | 4–5 | hairlines on the Mongolian frontier |
| 6, 7, 8 | 4–5 | hairlines on the Manchukuo frontier |

The seven come to **23.9 km² between them** and are 7 to 58 km long by **4 m to
334 m wide** — quadrilaterals with a length and no breadth. They are the
residue of the difference that made the file: where the claim and the held
polygon trace one border from two digitisations, subtracting leaves a hairline
where it should leave nothing. Measured, six of the seven sit **0 m** from the
claim outline and all within 645 m of the held one.

They are invisible in QGIS — a four-metre feature is far below a pixel at any
view of the whole state — and unmissable here, because every ring gets a 2.6 px
non-scaling stroke. A four-metre sliver drawn a thousand times its own width,
and dashed 1-on-5-off, is a row of dots.

`mengjiang-unoccupied-fixed.geojson` keeps fid 5 and nothing else, and is what
the build reads. The original is left beside it. `#mengjiang-claim` goes from
**8 subpaths and 162 vertices to 1 and 132**; the nearest dot to any of the six
places they used to appear is now **413 km away**, and the western wedge is
still enclosed at every point tested. `#mengjiang-whole`, the hover outline, is
untouched at 3 rings and 874 vertices — it comes from the 1940 claim, which
never had this problem.

A sieve in the build was discussed and not taken: small **and** slender, with a
line saying what it dropped. Worth having when the next differenced layer
arrives, since this class of artefact comes with the operation rather than with
the file.

### The physical map gets its own lettering
Thirty-seven names for the ground the rest of the map sits on: twenty seas,
gulfs and straits, seventeen deserts, plateaus, basins and ranges. They live in
`texts/features.csv`, which is a table of their own rather than territories
with no colour — the Gobi did not change hands in 1937, and a record with an
epoch and a ruler would be the wrong shape for it.

Lettered the way an atlas letters them: italic, letter-spaced at .14em, with a
halo so a name crossing a coast stays readable, and quieter than anything a
country or a city is given, because a sea is context and not a claim. Two
colours, water and land, so a reader can tell which kind of thing a name is
without a legend saying so. They carry no dot, answer no pointer, and are never
asked about in the quiz.

**Only when Show names is on**, and then by the zoom each earns. `lvl` 1 is the
thirteen that frame the whole picture — the Bay of Bengal, the Sea of Japan,
the Gobi, the Tibetan Plateau; `lvl` 3 is the eight worth naming only once
somebody is looking at them — the Hexi Corridor, the Dabie Shan, the Changbai
range, Tsushima Strait. They sort second in the label order, after countries
and before divisions and cities: a sea should not crowd out a country, and it
should not be crowded out by a town.

Chosen for what this map teaches rather than for completeness. Several are
places the prose already names and could not point to: the Hexi Corridor in
Gansu's description, the Dabie Shan in the account of the occupied zone, the
Ordos where the line of control turns, the Owen Stanley Range behind the Kokoda
beachhead.

The build refuses a row whose `kind` is neither `sea` nor `land`, since that is
what decides how it is lettered and a typo would otherwise produce an unstyled
name in the middle of an ocean.

### Sakhalin: one parallel, two layers, one instrument
The island was divided on the 50th parallel from Portsmouth in 1905 to 1945,
and the map drew the line twice. Karafuto is Natural Earth's Sakhalin cut south
of 50.0 by the build; the Soviet share is the traced layer, which carries its
own southern edge. The two hands did not meet. Measured against Karafuto's top,
142.160 to 144.005 E at 50.0:

* the eastern corner sat at **144.00204 E 50.01384 N** — 1.5 km of open sea
  between two countries that shared a land border, which is what showed as a
  pale wedge under the dashed control line;
* the western corner sat at **142.15884 E 49.99101 N** — 990 m the other way,
  overlapping into Karafuto, invisible only because Karafuto is drawn later.

Clipping the traced ring to the parallel was tried first and is half a fix: it
takes away what hangs below the line and can do nothing about what hangs above
it, so the western overlap went and the eastern gap stayed. Both corners are
**snapped** to the parallel now — any vertex within 0.02 degrees, 2.2 km — and
then clipped as a backstop. The two corners are 1.0 and 1.5 km out and the
coast either side is nowhere near that band, so this moves two points and no
others: 33,922 vertices in, 33,921 out.

Both edges now sit on the same line, and **0 of 7,500 samples** across the
border band are covered by neither country, against a strip 1.5 km wide before.

`SAKHALIN_BORDER` and `SAKHALIN_SNAP` are named, and the Karafuto cut reads
from the same constant, so the parallel is stated once.

### Place names in four scripts, taken rather than invented
Groundwork for an interface-language switch. The English name of every place
was there; the Japanese, Chinese and Korean were not, and the corpus had no
`ko` column at all in fourteen tables.

**Where the names came from.** Each record already cites an English Wikipedia
article. The language links on that article give the Japanese, Chinese and
Korean titles, so `texts/admin/langlinks.py` reads them back rather than
translating anything. A record with no link, or a link with no article in that
language, is left blank and counted. **480 cells filled — ja 91, zh 84, ko
305** — and 125 refused for want of a source.

CJK coverage now stands at **ja 92%, zh 94%, ko 67%**, against 61%, 63% and 21%
before.

**Three things it does to what comes back.** Administrative suffixes come off —
Wikipedia titles its article 遼陽市, the city *of* Liaoyang, and the corpus
names the place. Titles carrying a bracket are refused: the English *Lhasa*
links to 城関区 (ラサ市), a district inside it, and a link to something else is
not a translation. And Chinese comes back simplified where this corpus is
traditional throughout, so it is converted — by asking the article to render
its own title in the traditional variant, not from a table here.

**And one thing it will not do: write a romanisation.** The convention is
保定 (Hotei) and 경기도 (Kyŏnggi-do), but a reading is a fact about a place and
not about its spelling — 千葉 is Chiba because that is what the place is
called. So the characters are filled and the reading left to somebody who knows
it. The column is mixed, which is visible and fixable; a wrong reading would be
neither.

**Two bugs, both of which had been answering confidently and wrongly.**
`converttitles=zh-hant` is a no-op — every title came back exactly as it went
in — and 大分县 was about to be written into a traditional corpus. And asking
for all three languages at once lost most of the answer: `lllimit` counts
langlinks across the whole response, a well-linked article carries a hundred,
so the cap was spent on the first two titles and the rest came back bare. It
read as *Wikipedia has no Korean name for Baoding*, when nobody had asked.
One request per language, and all of them answer.

**Three bad links in the corpus, found by the same pass.** `jilincity` pointed
at *Jilin*, the province, so the Korean langlink followed it there and gave
지린성 — Jilin Province — for a city. `jinzhou` pointed at *Battle of Jinzhou*
and `hollandia` at *Battle of Hollandia*, events rather than places, in a table
of places. All three repointed.

**Twenty commits landed on main while this ran**, and they rebuilt much of
`texts/` — `burma.csv` came back with different rows in a different order. The
script had taken its row *positions* three hours earlier and wrote to them at
the end, which is precisely how a name gets written onto the wrong city, and
the first audit appeared to show it happening: eleven values shifted by one
row. That turned out to be my stale snapshot being compared against a rebuilt
file, not corruption. Checked properly — every written cell re-derived from its
own row's article — **479 of 480 agree, none disagree**, and the 84 Chinese
cells were re-checked against the source *and* its conversion rather than being
waved through. No row moved, none was lost, no existing value was overwritten.

It came out clean because the write pass re-reads each file immediately before
writing and the audit matched rows by key rather than by position. That is luck
and not design. The hazard is real and stays until the script is split: a
`fetch` that only fills a title-keyed cache and touches nothing, and an `apply`
that reads, decides and writes inside a millisecond and can be run again
whenever. Idempotent, so a later run fills whatever is newly blank instead of
being a migration with one chance to be right.

And the snapshot it took beforehand was deleted rather than kept. It predated
those twenty commits, so restoring it would have reverted somebody else's whole
day while appearing to undo the names. In a checkout more than one session
writes to, git is the restore mechanism and a zip is a trap;
`texts/admin/backups/READ-ME-FIRST.md` now says so where somebody would find it.

Left blank on purpose: 85 records with no link to follow, among them the 17
physical features and the 14 overrides in `sites/overrides-1930.csv`. And the
whole non-CJK half of the corpus — a Korean rendering of *Batavia* or a Chinese
one of *Kuala Lumpur* would be a transcription invented here, and the map would
show it in the same type as a researched name.

### A row is named, not numbered
The near-miss in the name fill was not bad luck to be avoided next time; it was
a way of addressing data that cannot be made safe. A row number is true of one
version of a file. Four changes, so that it stops being used as an address.

**Keys, compound where they have to be.** Forty of the forty-five tables have a
unique `id` or `key` already. The other five are unique on two columns together
— `categories.csv` on `epoch + id`, `clusters.csv` on `epoch + cluster`,
`overrides-1930.csv` on `site + en` — and that, not a missing identity, was the
reason the editor had fallen back on row numbers. `key_columns()` returns a
tuple now and everything addresses rows through it. A synthetic numbered key was
considered and rejected: it is a second identity to keep in sync with the real
one, it means nothing in a diff, and two sessions adding a row both reach for
the same next number.

**The guarantee is asserted, not assumed.** `build_texts.py` walks every table,
works out its key, and refuses to build on a duplicate — tested by planting one,
which fails the build with the file and both line numbers.

**The write finds the row by name.** `set_csv_cell` takes the key and searches
for it, using the row number only as a hint for where to look first. The old
`expect` check is kept and now means what it should — somebody edited this very
field — rather than standing in for a check it could not perform: it compares
*values*, so it could never tell a moved row from an unmoved one whenever the
field was blank at both ends, which is most of what this tool does.

Tested end to end: an edit aimed at row 1 was saved after the file had been
reordered so that row 1 was a different city. It landed on the right row and
left row 1 alone. A row that has been renamed away is refused by name; a field
somebody else has edited is refused as a conflict.

**Restore says what it would destroy.** It lists the files it would overwrite
with an older version and warns that anything written since is lost, including
another session's work. It restores everything or nothing, and that is now
visible before agreeing rather than after.

**And the knock-on effects, which is why this was inspected rather than
assumed.** `langlinks.py` had the original bug in its own write path and now
resolves each row by key, reporting any that moved out from under it instead of
silently skipping. Compound keys read as `e1930 / metropole`, which broke two
things in the region taxonomy: the pass that places an override note by the
record it overrides was matching the whole key rather than its first component,
and the notes files of vocabulary tables were no longer being recognised. Both
fixed, and `kashgar` — a city the other session added meanwhile — turned out to
sit west of the box that covers Xinjiang, so western Xinjiang has a box of its
own now, above the Karakoram so that it does not reach into Kashmir. Back to
**1,324 records, none unplaced**.

### China's provinces, at some length
All thirty rewritten from a clause into a paragraph, on the same three legs
each: what the country looks like, what it lived on, and what happened there
between 1920 and 1945. Median 637 characters, longest 816 — one chunky
paragraph and no more, which is about what a reader will take standing at a
map.

The point of the third leg is that a province stops being a shape. Henan is
where the dikes were cut at Huayuankou in 1938 and where two million died in
the famine of 1942–43. Shaanxi is where the Long March ended and where Chiang
Kai-shek was arrested in 1936, which is the event that turned a civil war into
a national one. Liaoning is where a bomb on the South Manchuria Railway began
fourteen years of war. Zhejiang is where the Japanese army spent three months
in 1942 destroying the airfields the Doolittle raiders might have used, and the
villages that had sheltered them.

Where a province is best explained by something that is not a battle, that is
what it gets: Sichuan's bamboo-cabled salt wells at Zigong, sunk deeper than
anyone else drilled for centuries; Fujian's remittances from Southeast Asia as
a real line in the provincial economy; Shanxi's own railway gauge, laid narrow
so that no outside army could use its track; Guizhou's saying about never three
days without rain or three acres of flat land.

The headline still splits off cleanly at the em dash in all thirty, so the card
shows *Shānxī (Shansi)* in bold with the paragraph beneath it, and Tibet — which
has no postal form to give — still reads simply *Tibet*.

### Two fillers, measured rather than believed
The China filler was reported as making no visible difference either way, which
is a claim that can be checked. Ring by ring, at a point certainly inside each
and against every other shape the map draws, `#land` and the Administrative
file together:

* **`chinabase_land` — 0 of 3 rings draw ground nothing else draws.** Three
  rectangles covering 3.1 million km², laid under the interior gaps when no
  source reached them. The Karakoram and Aksai Chin are under Xinjiang now and
  the Kachin corner under the 1931 India tracing, both replaced since the boxes
  went in. Removed; `LAND_BASE` keeps the coordinates should a future source
  retreat.
* **`chinabase` — 3 of 42.** Three small islands off Liaoning at 121.30,
  122.36 and 122.59 E, 231 km² between them. The other thirty-nine sit under a
  province or an atom that draws the same shore better. Sieved to the box those
  three are in: 42 rings and 12 KB become 6 and 3.4 KB, and nothing that was
  drawn stops being drawn.

The first sweep, sampling random points inside each ring, said 18 of 42 were
doing something. That was the sampling: a point near a ring's edge falls
outside the neighbouring shape by a hair and reads as bare ground. Testing at a
guaranteed interior point instead gave 3. Worth remembering — a coverage
question wants a point that is certainly inside, not a scatter that mostly is.

### Thailand's changwat reappear along the ceded frontier
Battambang and Siem Reap are an atom of their own, drawn after Siam and in the
same colour, so every changwat boundary running along that frontier disappeared
under them: the two ceded provinces read as though nothing bordered them.

The machinery for this already existed and was written for India, where the
princely states are a layer over the Raj and bury its provincial lines the same
way — `SUBS_LIFT`, which redraws the atom's own boundaries in a layer above all
of `#land` while taking the stroke off the originals, so each line is drawn
once and only its depth changes. Thailand joins India in it.

### Labuan, for the last time: it was inside North Borneo's own polygon
The card for Labuan was headed *Labuan* and then said *North Borneo — chartered
company from 1881*, followed by North Borneo's paragraph; hovering North Borneo
lit Labuan and drew a ring round it. This had been fixed twice in `map.js` and
came back both times, because the page was never the whole of it.

`RING_NAMES` names an atom's rings by which box their centroid falls in, and
`northborneo` claims everything between 114–120 E and 3–8 N. Labuan is at
115.2 E, 5.3 N. So the island was swept into the `NorthBorneo` sub-unit *and*
appended again as its own `Labuan` sub-unit: one piece of ground in two
sub-units at once, and inside North Borneo's own path. Nothing the page did
could take it out of a shape it was part of.

Three changes, and it needed all three:

* **The build.** A ring an explicit sub-unit already owns is no longer the
  box's to claim. `NorthBorneo`'s path goes from 13,878 characters to 13,592 —
  exactly Labuan's 286 removed — and its backing from 26 subpaths to 25, which
  is the same duplicate a second time. Nothing else in any of the five SVGs
  changes: Bali, Sarawak, Brunei, Saipan and the rest are where they were.
* **Whose it was.** `CLUSTER_HOME` says which territory a cluster answers to
  where the cluster is a polity rather than a country drawn in two pieces —
  `Straits Settlements: malaya`, and nothing else, because Laos and Cambodia
  are the other kind. The card and the tooltip name that instead of the atom.
  Christmas Island is deliberately not affected: its atom is Malaya's already.
* **The lighting.** `.atom.hot` is a filter on the whole group and no child can
  opt out of a filter above it — but a filter of its own composes with it, so
  `brightness(.8929)` undoes `brightness(1.12)` exactly.

Measured with a mouse and with a finger, as the two-tap rule requires. Tapping
Labuan on a touch screen names Labuan, the card reads *British Malaya &
Singapore · Straits Settlements & protected states*, and the selection outline
holds Labuan and the four other Settlements and not North Borneo. Hovering
North Borneo brightens its own path from 176,127,142 to 197,142,159 and leaves
Labuan at 176,127,142.

Not fixed: a shimmer of at most 10/255 on Labuan's own coastline pixels, where
the backing beneath it still carries the island and brightens with the atom.
Half the strength of the real thing, on the antialiased edge only.

This was committed inside `3f01023`, whose message is about deployment — the
other session committed a tree that had these changes uncommitted in it.

### The filler under each country is off, with a switch
Asked for: one polygon per country with the Administrative layer off, the
divisions with it on, and not both at once. The backings are deactivated rather
than deleted, and there is a checkbox in the Layers panel to put them back —
bit 13 of the layer code, so a link carries it.

Off means off where it is redundant, which is decided per atom and again when
the administrative file arrives: Siam's atom is an empty group until its
changwat load and its backing is the whole country, so hiding it then would
take Siam, Burma and Indochina off the map. With the layer off and the divisions
off, 23 of 37 backings are hidden; with the divisions on, all 37.

The cost, measured as ocean-coloured pixels enclosed by land, scanning a grid
of deep-zoom windows over each country:

* **Malaya** 801 → 1,262 (+58%)
* **The Philippines** 40 → 341 (8.5×)

That is what the second copy was buying. The switch is there to see it.

### Double tap to zoom, and hold the second tap to zoom with one thumb
A phone had no double tap at all. The map sets `touch-action: none` because it
drives pan and zoom itself, and that also stops the browser synthesising a
`dblclick` from a pair of taps — so the `dblclick` handler that zoomed a step
was a mouse-only feature, and on a touch screen the second tap of a fast pair
was recognised only in order to be thrown away.

Both gestures are read in the pointer path now, for the mouse as well as the
finger, and the `dblclick` listener is left with nothing to do but stop the
text selection. Two handlers would have zoomed twice on a mouse.

The second press of a pair does not pan. What it becomes is settled when it
ends: lifted where it landed, one step of `DBL_ZOOM` at that point; drawn up or
down the screen first, the continuous one-thumb zoom, at one doubling per 190
px. Down pulls the map away and up pushes into it, which is the way a pinch
already reads — the fingers going apart is the view getting narrower.

The drag is measured against where the gesture started rather than frame by
frame. A factor applied per frame accumulates its own rounding, and drawn down
and back up again the map would not return to the scale it left.

Measured, with a mouse and with a finger, as the two-tap rule requires:

* double tap, 1.900x both ways, which is what the wheel's double click was
* one tap, no zoom
* held and drawn 190 px down, exactly 2.000x wider; drawn back to where it
  started, back to the width it started at, to the last decimal
* held and drawn 190 px up, exactly 2.000x narrower
* the point under the thumb stays under the thumb: 0.01 screen pixels of drift
  across a 2x zoom anchored 130 px from the left edge
* a plain drag still pans and does not change the width
* pinch still pinches: 839 to 249
* and the two-tap rule survives, which was the thing to be careful of. Tapping
  Shanxi twice at a reader's pace still names China and then Shanxi and does
  not zoom; the same two taps 90 ms apart zoom 1.900x. 320 ms is what tells
  them apart, and a deliberate second tap is slower than that.

The first tap of a pair still selects what is under it, and the zoom then drops
the selection, so the card appears and goes again. Deferring every tap by 300
ms would stop that -- the quiz already does it, for the same reason -- at the
cost of making every single tap on the map feel late. Left as it is.

### The hover path costs a third of what it did
Three outlines shared one lifecycle in the highlight layer: `redrawHighlight`
emptied it and built all three again. The province under the pointer changes on
nearly every move inside a country, and it was taking the country's own
silhouette down with it and rebuilding it identically — `hot` had not changed
and neither had the shape.

Measured over 120 moves inside China with the divisions on: sixteen crossings,
thirty-two masks where sixteen would do, and 7.84 million characters of path
data copied. China's atom is 152,621 characters, read out, merged into one `d`,
written into the mask solid and written again into the stroked copy, twice a
crossing. Each outline has its own slot now, keyed on what it was built from,
and a slot whose key has not moved is left alone. **32 masks become 16, and
7.84 million characters become 0.11 million — 65 KB a move becomes 1 KB.**

That turned out to be worth 5%. Two wrong guesses before the right one, both
recorded here because the reasoning was plausible and wrong:

* `nearestSubUnit` looping `getBoundingClientRect` over every division — it
  fires only for the hit circles, and the common path calls it once.
* the mask rebuild flushing layout for a 5,947-element document — serving
  `getBBox` from a cache saved 4%.

The profiler found it in one pass, which is what should have been done first:
**`getBoundingClientRect`, 99 ms of self time over 240 moves**, one call a
move, from `showTooltip` measuring the tooltip immediately after rewriting it.
Mutate, measure, mutate — a forced synchronous layout of the whole document,
per pointer move. The words change only when the record under the pointer
changes, so the DOM is rebuilt then and not otherwise; and the measurement
moved into a frame callback, where the same read costs nothing because layout
is about to happen anyway. Moves arriving faster than frames coalesce for free.

With that gone the `getBBox` flush was worth 20% rather than 4%, so it is
cached too, against the generation counter the slots already use.

**120 pointer moves over China: 257 ms → 89 ms.** Layout 73 → 28, paint 63 →
32, script 96 → 22. Against the Leaflet build's 59 ms for the same sequence,
that is 1.5× rather than 4.2×.

The trap in it, which is why `hiGen` exists: `litFor(hot)` can return a
different set of shapes without `hot` changing — a fine coastline grafts in,
the administrative file arrives, an atom stands down. A key on the id alone
would go stale and stop redrawing while looking as though it works. Anything
that adds, removes or supersedes geometry has to bump it.

### The map's own names, separate from the card's
`label` in the territory tables is what to write across the map when that is
not what the record is called. A card has room for "Karafuto (southern
Sakhalin)" and a reader who asked for it; a name floating over the island has
room for one name. A single hyphen means write nothing at all.

Nineteen set. The princely states and the contested frontiers say nothing on
the map now — they are answers to a question asked by pointing. Kurile Islands,
Karafuto, Xīnjiāng, Soviet Union, Tannu Tuva, Měngjiāng, Guam, Guadalcanal drop
their brackets. "Japanese-occupied China (approximate)" becomes
**Japanese-occupied** — read literally from the request, and a word either way
if that was not the intention. And British Borneo becomes **Kita Boruneo**,
which is what that ground was administered as in December 1942; the card still
says both.

Miangas keeps its brackets and gets level 4 instead — a band above the three
the reader can ask for, for a name only worth the room once somebody has gone
looking for the speck. One square kilometre forty miles off Mindanao, and its
name was on the map from the opening view because a territory of its own earns
a territory's label however small it is. Nothing else is level 4 and nothing
below it is affected.

Dabie Shan is Dabie Mountains.

### The Indies get their island names back
Turning the residencies off turned the island names off with them, and the
largest colony on the map had not one name in it. The two are not the same
thing: a residency is a division and an island is a place, and Bali is Bali
whatever the Administrative switch says.

`DEI_RESIDENCIES` is gone from where it was read — thirty-four modern provinces
merged into seventeen units, with Bali, the Lesser Sundas, the Moluccas and New
Guinea in none of them, 29.7% of the colony carrying no unit at all. `dei`
leaves `NO_ADMIN_SUBUNITS` and joins `ARCHIPELAGOS`, so its islands are named
with the layer off and are never deferred. The eight boxes that were dropped
("-") because the residencies covered them are named, and
`netherlands-indies-islands.csv` had all eighteen names waiting in it.

Order is the logic in those boxes, as it is in `regions.py`: Madura sits inside
Java's box and Bangka and Nias inside Sumatra's, so those three are asked about
first. Verified by unprojecting every centroid — Madura at 113.36E 7.08S,
Bangka at 105.94E 2.17S, Nias at 97.53E 1.09N, all eighteen where they belong.

Nothing was lost by re-cutting: **204 rings become 257 and the path data grows
9.5 KB**, because `tol_for` gives an island-sized ring a finer band than a
country-sized one, so Bali and Madura keep detail they did not have when they
were part of one country's outline.

The backing was the cost — the union under eighteen islands that are never
deferred and never hidden is a second copy of ground nothing can ever be
looking at, and it was 167 KB. `dei` joins `china` in `NO_BACKING`, and the
sheet ends up **11 KB larger** rather than 167.

### The map's names stop repeating the card's
The `label` column was the wrong shape for what kept being asked for. Nine
separate requests in one session, all of them the same request: Chishima,
southern Sakhalin, Sinkiang, USSR, Tuvan People's Republic, Mengchiang,
Ōmiyajima, contested, Suiyuan, Chahar, Jehol, Formosa, Ogasawara, Korea,
Kwangchowan. So the rule moved into `mapLabel` instead: **a floating label
drops the gloss after an em dash and the alternative in brackets.** A card has
room for "Karafuto (southern Sakhalin)" and a reader who asked for it; a name
across the map has room for one name.

That left five explicit exceptions rather than nineteen redundant ones, and
redundancy in a table is a hazard — edit `en` and a stale `label` wins.
`princelystates` and `contested` say nothing on the map at all; `nanjinggov` is
*Japanese-occupied*; `borneo_br` is *Kita Boruneo*; `freechina` is *China*.

**`labelAt`** puts a name where it belongs when the middle of the shapes is the
wrong place. Two kinds of record need it and both were broken:

* The Republic in 1942 is the whole of China with the occupation drawn on top,
  so its name was computed into occupied ground, collided with
  "Japanese-occupied" and was dropped — the reader saw what Japan held and
  nothing to compare it against. Moved to Chungking, 106.5E 29.5N. Framed on
  China the 1942 sheet now shows *Japanese-occupied* and *China* together,
  which is the whole point of the pair.
* French India is five enclaves from Mahé to Chandernagore, and the mean of
  five specks two thousand kilometres apart is a point in the Deccan belonging
  to none of them. Both are on their capitals now.

The redundant brackets were a corpus-wide fault rather than the two the eye
caught. Comparing each name with its bracketed alternative after stripping the
tone marks found **fourteen**: Shanghai, Taiyuan, Kaifeng, Nanchang, Changsha,
Nanning, Kunming, Fushun, Anshan, Tangshan, Wuhu, Hengyang, Chaoyang and Yen
Bai. "Wúhú (Wuhu)" says nothing twice. Guìlín (Kweilin) is untouched, being a
different romanisation and not the same word typed twice.

Andong, not Dandong, which is a name from 1965. Běipíng on the 1930 sheet and
Běijīng on the 1942 one, through the epoch override, because it was renamed in
1928 and renamed back under the occupation. Wēihǎiwèi is the name the lease
went by, with Wēihǎi in the card. Battambang and Siem Reap drop to level 4 —
the ceded provinces were shouting over Thailand from the opening view.

### The Arafura islands were being called New Guinea
Reported as unnamed. They were worse than unnamed: the box for Dutch New Guinea
runs 130.5E to 141.1E and reached across the Arafura Sea to take in the Aru and
Tanimbar groups, so pointing at them answered "Dutch New Guinea". They are a
hundred miles and more off it and were governed from Amboina with the rest of
the Moluccas.

Twenty-six islands named, with an article and a description each: Aru,
Tanimbar, Kai, Raja Ampat, Biak, Yapen and Frederik Hendrik Island out of the
New Guinea box; Bacan and Morotai out of Halmahera's; Siberut and Simeulue out
of Sumatra's; and Wetar, Obi, Alor, Pantar, Lembata, Rote, Savu, Sula, Talaud,
Sangihe, Ambon, Babar, Natuna, Bawean and Komodo out of the bucket of rings
that matched no box at all — drawn, and answering the pointer as "Netherlands
East Indies", with nothing else to say for themselves.

Order is the logic in those boxes. Four had to go first because a larger box
reaches over them, and every centroid was unprojected and checked: 44 sub-units
in the atom, all where they belong.

### The rivers of India, on a switch
Natural Earth's rivers clipped to the subcontinent and Burma, from the
GeoPackage in Dropbox, converted to cached GeoJSON. 14,851 vertices thinned to
**3,515** at 0.30 units, 123 subpaths, one element — sixty-three separate paths
would be sixty-three more things to rasterise on every pan, and nothing points
at them or names them. Off unless asked for, bit 14 of the layer code, thinner
and paler than the Yangzi and the Yellow River, which are the two rivers this
map has an argument about.

### The Soviet Union's name comes off Mongolia
It was at 91.2E 49.8N — inside Mongolia's bounding box and immediately under
Tannu Tuva, because the mean of the Soviet Union's shapes on this map falls
there: the frame cuts at 55N, so what the map holds of the USSR is a band along
the top and its centre of area sits over the countries below it.

`labelAt` puts it at 112.0E 52.5N instead, north of eastern Outer Mongolia and
about two and a half degrees clear of the frontier on one side and the frame on
the other — the band is only 4.7 degrees deep there. Tested on both sheets:
the drawn box overlaps neither `#a-mongolia` nor `#a-tuva`, and collides with no
other label.

### The physical names wait for a turn of the wheel
Thirteen of the thirty-seven features are level 1 — nine seas, the Gobi, the
Taklamakan, the Tibetan Plateau and the Himalaya — and they all arrived at the
opening view, which is a mat of grey italic across the hemisphere before the
reader has looked at anything.

`featureLevel()` is a ladder of its own, measured against the opening view
rather than the drawing's width, as `zoomed-in` already is: nothing at rest,
the seas at a turn of the wheel, the deserts and the basins after that.
Measured at 1500 px: **0 names at the opening view, 7 after one wheel step.**

### A label that will not fit is moved before it is given up on
`placeLabels` was first-come-first-served with a hard drop. Nepal, Sikkim and
Bhutan are three small countries in a row along the Himalaya, all the same
level, so they were placed in file order and whichever came first kept its name
— and Nepal, much the largest of the three, was one that vanished.

Now a label that clashes tries ten small offsets before it is dropped. **Only
when it clashes**, so anything that already fits is placed exactly where it was
and this can add names to the map but never move one. The offsets are
deliberately short: a country's name nudged far enough to clear its neighbour
is a name over the neighbour.

That was not the whole of it, and the second half is worth writing down because
it caught two records. Nepal, Sikkim and Bhutan were level 3, which wants a
view under 280 units — and the three of them together span nearly 400, so
**there was no zoom at which all three could be on screen and lettered at
once.** They are level 2 now, and all three show with no overlap. The Spratly
and Paracel groups had the same fault for the same reason, being seven degrees
apart under one record; framed together at 258 units the name appears.

### Five smaller label decisions
Dōngshā says nothing across the map — the island still names itself at the zoom
where the sub-unit labels come in. Shinnan Guntō reads **Spratly & Paracel
Islands** there instead, the one place a Japanese administrative name is not
the useful one for a student. Turtle & Mangsee drops to level 4, so it waits
until the reader is over it: nothing at 411 units, named at 60.

### burma.md had a heading that reached nothing
`## Mandalay`, where the row is `MandalayDiv` — every other heading in the file
matches its key exactly, and the SVG says `data-prov="MandalayDiv"`. So it was
a typo, and the prose under it had never reached the map. It does now.

### The editor stops needing to be reloaded
`build_index()` already read every file on every request, so the server was
never stale; the page was, holding whatever it fetched when it was opened.
`load()` hands back its promise now, a place button on the home screen waits
for fresh records before it shows you the place, and coming back to the tab
refreshes it when nothing is part-written. `edits` and `open` are keyed by uid
and survive a refresh, and a save re-reads the columns from disk — tested on a
copy, an edit from a page that had never heard of `label` or `labelAt`
preserved both and left every other row byte-identical.

### A phrase on hover, the prose on the card
Two faults, and the first was the larger. `showTooltip` printed `nameOf(head)`
as its headline — the whole of `en`, which is written `Name — what it was` — so
hovering Qīnghǎi came up with **558 characters** of pasture and salt lake set
in bold. The card splits that gloss off and so does the map label; the tooltip
never did. It does now.

Under it went the record's full note: 150 characters for Sumatra, and 444 for
any changwat of Thailand, which is the shared explanation of how the changwat
were drawn — a thing to read once, not to be handed every time the mouse
crosses a frontier. That is replaced by `short`, and where there is no `short`
the gloss on the name serves, but only while it is under 88 characters. Past
that it is prose and belongs on the card.

**Coverage of the 583 sub-units:**

* **112** already carried a gloss short enough to be a phrase
* **317** derived from the first complete clause of their own note
* **25** written by hand, where no clause fitted
* **68** Siam's changwat, whose only note is the shared `{{siamprov}}` snippet
  — deliberately none: the name and "Thailand" are the answer, and the
  methodology is not
* **61** a name and a coordinate, with nothing written about them anywhere

So 454 say something and 129 do not, and none of the 129 is a place the map
knows a fact about and is withholding.

The derivation was measured before it was trusted. A first rule that cut at a
character count truncated half its output mid-thought — "the port through", "at
2,954 m the highest" — which is worse than silence, so it was thrown away. The
rule that shipped takes only **complete clauses**, extending while they still
fit and stopping when they do not, and where no clause fits at all it writes
nothing and reports the row for hand-work. That is what the 25 are.

The card is untouched: Qīnghǎi still opens with its 559 characters and China's
590-character note under it, the specific thing above the general one.

### The city dots go above the lines of the land
`#markers` is written into the SVG before `subs-lift`, `mandate-lift` and
`sub-outlines`, all three of which are appended in `init()` — so every line
lifted clear of the land was drawn straight across the city dots, and a dark
hairline through the white ring round a dot reads as a broken marker.

Bangkok is the case, and it is Thailand for a reason: `SUBS_LIFT` names India
and Siam, so hovering Thailand lifts its changwat lines above `#land` and, until
now, above the markers too. Reproduced at 8x magnification — the ring came up
rubbed out and mottled — and clean after.

The markers do **not** go above `#highlight` or `#labels`. That was a decision
made here before and the note on it still holds: a selection outline that a row
of city dots can rub out is not much of an outline. Only the lines that belong
to the land go under. `#browse`, `#gaz` and `#atom-hits` follow on their own,
each being inserted before `#markers` when it is built.

Worth recording, because it looked like a bug and is not: the dark square round
Bangkok in the report is Phra Nakhon, Thonburi, Nonthaburi and Samut Prakan —
four tiny changwat packed round the city and outlined by the Administrative
layer. They really are provinces.

### Suiyuan is one province again, and the meridian is gone
Two goes at this were wrong and the third was to stop patching it.

Suiyuan was cut in two by a meridian at 109.6E and a parallel at 40.45N,
standing in for how far Japanese control reached into the province. First I
closed the seam that cut left by overlapping the halves; then I found I had
overlapped them in the direction that pushed Free China's yellow into ground
Mengchiang held, and reversed it. Both were repairs to a line that should not
have been there.

**The cut is a guess in the shape of a fact, and it contradicts the sources
already on hand.** Sampling 30,000 points inside Mengchiang's traced polygon,
6.3% of them fell inside the western half of Suiyuan as the meridian defined
it, concentrated at 108.5-109.5E and 41-42.6N — the Wuyuan and Linhe plain.
The traced polygon of what Mengchiang held reaches well west of 109.6; the
meridian says control stopped there. Where two sources disagree the map showed
the disagreement, as a straight-edged seam and as yellow inside the client
state.

Nothing needed the cut. Both halves belonged to one territory on both sheets
anyway. On the 1942 sheet the question is answered by the two traced polygons —
what Mengchiang held, and what it claimed and did not hold — and on the 1930
sheet Suiyuan is simply a province of the Republic. So `SUIYUAN_CUT`,
`SUIYUAN_ORDOS_LAT`, `SUIYUAN_LAP`, the `suiyuan_w` atom, the `SuiyuanWest`
sub-unit and the build-time guard on the lap are all gone: 84 atoms where there
were 85, and Suiyuan is one ring.

Measured after: **0 of 2,528 sample points inside the Mengchiang shape are
painted Free China's yellow** with the Administrative layer off. With it on the
yellow that shows is inside the *claim* and outside the held polygon, which is
what the dotted line is for — 1% of it falls in the Jinbei box, at the level of
edge pixels.

The seam the whole business began with is still gone: 0 of 544 pixels on the
parallel and 0 of 344 on the meridian.

### UPLOAD.md
Ten files, and the list was arrived at rather than guessed: they were copied to
an empty directory, served alone, and put through every layer, both dates, the
province-source switch and a deep zoom. No failed requests, no console errors,
85 territories, 1,293 divisions, 127 markers. 6.1 MB raw, 1.8 MB gzipped, of
which only 3.7 MB / 1.08 MB is fetched before the map is on screen.

### An .htaccess, and the bug in the one we were recommending
DreamHost is Apache, and the `.htaccess` in DEPLOY.md had

    AddOutputFilterByType DEFLATE text/html text/css application/javascript

A current Apache serves `.js` as `text/javascript`; only an older one uses
`application/javascript`. So that rule matched nothing, and `map.js`, `data.js`
and `cities-gaz.js` went down uncompressed with nothing to show for it.

Run against a real Apache 2.4.62 with the site in the document root:

| | old block | both spellings |
| --- | ---: | ---: |
| `map.js` | 224,970 bytes, **no encoding** | 71,173, gzip |
| `data.js` | 577,934 bytes, **no encoding** | 173,799, gzip |
| `japan-empire-map.svg` | 819,759, gzip | 819,759, gzip |

616 KB a visitor was paying for. `.htaccess` is in the repository now, so there
is nothing to type, and every directive is inside an `<IfModule>` guard: a
missing module skips it rather than returning 500 and taking the site down.

### The rivers of India read as water
`#4d7f9e` at 0.6 opacity over the British mauve came out as a slightly cooler
mauve, and the lines read as a texture in the fill rather than as rivers. Their
own colour instead, `#6fa8cd` at 0.95 and 1.1 wide. The luminance ratio barely
moves — 1.20 to 1.28 — because what was wrong was the hue, not the lightness.

### Mengchiang draws itself, and the regression was mine
The author reported yellow inside Jinbei with the Administrative layer on, and
said it had been right before. It had. This is what I did to it.

`#a-mengjiang` has always been an *empty group* — its three governments are
divisions and were deferred to the administrative file — so what filled it was
its **backing**, set from the traced occupied polygon rather than dissolved out
of the sub-units above it. Then the backings toggle went in (`e483a89`) with a
rule that stands a backing down as redundant once its atom has paths of its
own. That rule assumes a backing is the same ground as the divisions over it.
Here it is not: the backing was what Mengchiang *held* and the sub-units are
the three governments it *claimed*, a larger and a different shape. So the
moment the administrative file grafted the governments in, the held ground
underneath was hidden and Free China's yellow came through. Exactly "it
reappears when admin is on".

The fix is not to patch the rule. Mengchiang no longer has a backing at all:

* it joins `china` in `NO_BACKING`
* and `NEVER_DEFERRED`, so its three governments are in the base sheet

The three governments, clipped to the occupied polygon, **are** the fill. With
the layer off they carry no stroke and read as one shape; with it on they are
the Mongol leagues, Jinbei and Chanan. Nothing is dissolved, merged or fitted
to anything, and the two traced files are used as they are: the occupied one is
the shape, the unoccupied one is the dotted line.

Measured inside the occupied polygon itself — sampling the clip path rather
than the claim, which is what my earlier probes kept getting wrong: **0 of
3,205 points painted Free China's yellow, with the layer off and with it on.**

One departure from the letter of the instruction, and it is the author's own
earlier instruction that it follows. `mengjiang-unoccupied.geojson` has eight
features: the claim, at 17.59 square degrees, and seven slivers of 0.000008 to
0.0013 scattered along the Mongolian and Manchukuo frontiers, which drew dotted
marks where the claim never reached and which the author asked to have removed.
They are dropped at a floor of 0.01 square degrees — four orders of magnitude
below anything real — so that the file the author draws in stays the file the
build reads, instead of a second trimmed copy going stale beside it. The dotted
line is one subpath of 132 vertices, which is the polygon exactly.

### The wheel does nothing on sources.html
`styles.css` belongs to the map, which is an app shell that must never scroll:
`html, body { height: 100%; overflow: hidden }` and `overscroll-behavior: none`
so that dragging the map cannot pull the page about. `sources.html` shares that
stylesheet and already undid the first part — but it undid it with
`overflow: auto`, and that was the bug.

`auto` makes `body` a scroll container of its own. `height: auto` then leaves it
exactly as tall as its content, so it has nothing to scroll. A wheel over the
text is delivered to that dead scroller, and `overscroll-behavior: none` —
still inherited — forbids it from chaining up to the viewport. Nothing moves.

The keyboard and the scrollbar never chain, so they worked the whole time,
which is what made it look like a wheel fault rather than a CSS one. Measured
before the fix: 3,968 px of content in an 800 px window, a 600 px wheel moved
`scrollY` by **0**, while `window.scrollTo(0, 500)` gave 500 and PageDown gave
760.

The first fix was `overflow: visible` with `overscroll-behavior: auto` in
sources.html's own override, and it worked — but undoing a lock from the far
end is the wrong shape. The lock is a fact about the *map*, not about the
stylesheet, and any other page that ever links `styles.css` would inherit it
and need the same dance.

Scoped to the page that wants it instead. `index.html` carries
`<html class="app">`, the rule is `html.app, html.app body`, and sources.html
overrides nothing at all.

Measured after: sources.html takes a 600 px wheel to `scrollY` 600, and the map
page still cannot scroll — `scrollHeight` 800 in an 800 px window, `scrollY` 0
after a 2,000 px wheel and an explicit `scrollTo(0, 900)` — while its own wheel
still zooms, 2800 to 1476.

### A second projection, worked out in the browser
Mercator's area scale is sec squared of the latitude: 1 at the equator, 1.5 at
35N, 2.0 at 45N, 3.0 at the top of this frame. So Karafuto and the Soviet Far
East are drawn at two to three times the area of Java and the mandate — on a
map whose subject is partly how much ocean this empire was, and which is
thinnest exactly where Mercator is kindest.

Layers now offers **Lambert azimuthal equal area on 20N 135E** beside it.

**No second sheet, and nothing extra over the wire.** Mercator inverts in
closed form, so every coordinate in the document can be turned back into
longitude and latitude and sent through another projection in the browser. The
switch walks the document once — 1,158 paths, 586 circles, 373 label anchors,
48 finger-target lists, about 200,000 coordinate pairs — in **1.6 seconds**,
and keeps the original string on each element so switching back is the file
exactly rather than a round trip through two projections.

What had to be found and moved, none of it obvious from the maths:

* `#ocean` and `#frame` are rectangles because a box of longitude and latitude
  is a box *in Mercator*. They are paths now, traced along the frame at 120
  points a side, and in Mercator the path is the same rectangle.
* `data-cx`/`data-cy`, where a label hangs, and `data-hits`, where the finger
  targets for a tiny country sit.
* The administrative sheet and the fine-coastline windows arrive later and
  arrive in Mercator, so they are moved as they are grafted.
* `unproject` had to gain the azimuthal inverse — solved rather than inverted,
  and it runs only when the reader asks where they are.
* The reader's place is held across the switch as the ground in the middle and
  the fraction of the drawing on screen, because the view is a rectangle in
  coordinates that are about to mean something else.

Checked in the new projection: hovering names the right country (China, the
Indies down to Sumatra, British India, the Philippines), the same eleven
territory labels and forty-eight city dots are placed, a deep zoom pulls the
fine coastlines and they land in the right place, the administrative graft puts
1,292 divisions where they belong, and switching back restores the viewBox to
the character.

**A straight line in one projection is not straight in another**, and this
turned up as the Soviet Union spilling over the top of the drawing. Every shape
cut to the frame has one long straight edge along it — the USSR's northern
limit is a single segment right across the sheet at 55N — and in Mercator that
is a horizontal line while in an azimuthal projection it is a curve. Moving
only the two ends of it draws the chord, which stands proud of the frame.

Segments longer than a degree are walked in degree steps now, interpolating in
longitude and latitude, which is the space the edge was straight in when it was
cut. Coastline vertices are already far closer together than that, so this adds
points to a handful of clipped edges and to nothing else. After it, **59 land
vertices of 186,025 fall outside the frame, the worst by 11.5 units in the
southern corner** — 0.4% of the width, and nothing at the top at all.

**A correction to what I said when this was only a discussion.** I put the
whole empire "within about 45 degrees of centre". That is true of Japan, at 16,
and the Indies, at 36 — not of British India at 64 or the corners of the frame
at 77, where tangential stretch is about 28%. The middle of the subject is
drawn well and the edges pay for it, which is the opposite trade from Mercator
and the reason both are offered rather than one being called correct.

---

## Selection under the alternative projections, and a share link that was wrong

**What was reported:** selection and mouseover of Korean provinces and Indian
princely states "a bit wonky" once an equal-area projection was on.

**Measured, and hit-testing is not the fault.** Administrative on, zoomed to
each region, an interior point of every sub-unit found with `isPointInFill` and
hovered, comparing what the map names against `document.elementFromPoint` — the
browser's own hit test on the geometry as rendered:

| | Mercator | Albers | LAEA |
| --- | ---: | ---: | ---: |
| Korea, 14 provinces | 1 | 1 | 1 |
| princely states, 23 | 5 | 1 | 5 |

In every Korean case the map's answer and the browser's were **the same**, so
the map is faithful to what is drawn; those are the sampling artefact of a
neighbour painted over that pixel. The five princely states are the same five
in Mercator as in LAEA — Chitral/Dir/Swat, Khairpur, Rajputana, Baluchistan and
Waziristan, every one of them on the north-west frontier — and they are
`clip-off-frontier` doing its job, which `isPointInFill` cannot see because it
ignores clipping. Pre-existing, identical across projections, not a fault here.

**What was actually broken was `viewForBox`, and it was mine.** It read a box
of longitude and latitude with `xForLon(w)` and `project(0, n)` — x from
longitude alone, y taken at the Greenwich meridian — which is true of the
Mercator cylinder and of nothing else. `viewBox()` *writes* a share link
correctly in any projection, because it goes out through `unproject`; reading
one back put the reader somewhere else. A Korean view, written in LAEA as
`107.38,72.54,131.39,79.66`, came back at **72 to 79 degrees north**. That is
what the reported wonkiness almost certainly was: the map was not mis-naming
provinces, it was in the wrong place.

The Mercator branch is kept exactly as it was, so no existing link moves. The
other two walk the four edges of the box in 24 steps and take the extremes,
because a parallel bows and a meridian leans and the corners no longer bound
the shape. Round-tripped — write a link, reload it, compare:

| | before | after |
| --- | --- | --- |
| Mercator | 0.00 deg | 0.00 deg |
| Albers | *(nonsense)* | 1.72 deg |
| LAEA | 39 deg of latitude | 1.46 deg |

The remaining degree and a half is inherent and not an error: the link records
the bounding box of a curved view, so reading it back fits a view that contains
that whole box, which is very slightly wider. It is centred correctly.

**One projection-linked effect left, unfixed and reported rather than assumed
away.** At the opening zoom Albers fits the sheet 3,052 units wide against
Mercator's 2,800, so the map is drawn about 8% smaller while the target circles
that make a tiny country reachable stay a constant 10.4 px. Kwantung's six
targets then reach across the Yellow Sea. Of 14 Korean provinces sampled at the
opening view, **3 answered something else in Mercator and 6 in Albers**. It is
a reachability trade that already existed and that the smaller fit makes worse;
changing it means touching `pick()`, which is the Labuan code, so it is left
alone until it is asked for.

**Also cleared, and unrelated to the projections:** `tools/bundle.py` matched
the sources link in `index.html` by an exact copy of its sentence, and that
sentence is prose spliced out of `texts/pages/about.md`. It had been rewritten,
so the standalone build had been failing since 22 August with `bundle: could
not find the sources link`. It matches on `href="sources.html"` now and keeps
whatever words are around it. Rebuilt: 5,607 KB, 84 atoms, sources folded in,
no console errors.

---

## The root holds what gets uploaded, and nothing else

Asked for: everything not deployed moved out of the root.

`stale/` — `rr.html`, `whg.tmp`, `recommendations.md`, `tasks-done.md`, and
`japan-empire-map-standalone.html`, which is a build output rather than part of
the site and which `DEPLOY.md` already described as going stale.

`docs/` — `DEPLOY.md`, `UPLOAD.md`, `SOURCES.md` and this file.

Left at the root: the ten runtime files, `.htaccess`, `admin.js`, and
`README.md`, `LICENSE.md` and `CLAUDE.md`, which belong there by convention.

Two tools write into what moved and were repointed: `build_texts.py` now writes
`docs/SOURCES.md`, `bundle.py` now writes `stale/`. Links were fixed in
`README.md`, `LICENSE.md`, `CLAUDE.md`, `texts/README.md`,
`texts/admin/README.md`, `texts/pages/sources.md` and `docs/UPLOAD.md`.
`reports/` and the body of this file were left alone: they are a record of what
was true when they were written, not a set of live paths.

---

## The filler toggle comes out of Layers

Asked for: remove **Draw each country's filler under its divisions** and its
paragraph.

The control and the hint are gone from `index.html`, along with the horizontal
rule that had been separating it from the resistance-base-areas row and that
would otherwise have been left hanging above the About slot. The Layers panel
is ten rows now.

`map.js` is untouched. The listener was already written as `var optBacks =
$('#opt-backings'); if (optBacks) { ... }`, so a missing control is simply never
wired; `state.backs` defaults to false, which is the off position, and
`backs-off` is confirmed on at load. Bit 13 of the layer code is still read and
written, so a link made while the switch existed still restores what it said —
there is now no way to turn the fillers off again from inside the map, which is
the same as having no control at all and was judged not worth breaking old
links over.

Checked: panel opens, ten rows, no `#opt-backings`, `backs-off` set, and with
Administrative on the map still grafts 1,230 divisions across 84 atoms with no
console errors.

---

## The gazetteer bulk moves into data/ignored/

Asked for: everything under `data/` that git ignores, gathered into one
directory, and `.gitignore` updated to match.

`data/` was **588 MB**, and 587 of it was `data/gazetteer/`. All 44 ignored
files are now in `data/ignored/`: the 38 GeoNames country dumps (339 MB, of
which `CN` is 122 and `IN` 58), `cities500.txt` (41 MB),
`places-china-all.geojson` (201 MB) and the four working layers (35 MB).
`data/gazetteer/` keeps the two tracked files, the recipe: `README.md` and
`build_geojson.py`. What git tracks under `data/` is the same seven files it
tracked before, checked with `git check-ignore` either side of the move.

Three ignore patterns become one directory. The comment that stood over them
said the four `places-*.geojson` layers were "what is committed and what gets
used", and the rule two lines below it excluded them; neither half was true, so
both were rewritten. Nothing in the map's build reads any of it — `grep` finds
no reference to `data/gazetteer` anywhere in `tools/` or `texts/` — and
`cities-gaz.js` comes from `data/cities-1930.csv` and `data/cities-1942.csv`,
which did not move. Rebuilt to confirm: byte-identical.

`build_geojson.py` had used bare relative filenames and so depended on being run
from its own directory. It now works `data/ignored/` out from its own location,
which is both what the move required and one less thing to get wrong. Checked
by running it from `/tmp` against a copied subset — two country dumps and a
trimmed `cities500` — which read and wrote in the new place and produced 1,079
merged features.

**Not moved, and worth saying so:** `data/cities.csv` stays. Its 446 ids are a
strict superset of the two epoch files and nothing reads it, but it is the
parent document `data/report.md` refers to five times, and it is 85 KB.

---

## The graticule over the map, and named

Asked for: the graticule drawn over the map rather than under it, and labelled.

**Over the land, under everything a reader interacts with.** It was inserted
before `#land` — under the countries, over the sea — so a reader who switched
it on to see where the parallels run was answered only over water, which is
where they least need it. It sits before `#markers` now: over the land, the
rivers and the hatching, under the city dots, the selection outline and the
names, which is the rule the mandate lines already follow. The position is
reasserted on every call rather than only at creation, because `#markers` is
appended during init and the graticule can be built either side of it
depending on whether the reader arrives with the layer already on from a link.
Measured in the DOM: graticule at index 16, `#land` at 4, `#markers` at 18,
`#labels` at 20.

**Named where each line enters the window.** Meridians are walked from the
north end and parallels from the west, and each is labelled at the first of its
own points that falls inside the view — so the names ride the top edge and the
left side, read left to right and top to bottom, and follow the pan.

Two attempts. The first cut the mesh at a fixed height below the top of the
view and interpolated the crossing, which is correct in Mercator and useless in
the other two: **the top of the sheet there is a curve, and a horizontal cut
taken above its apex crosses nothing at all** — the home view came up with a
full mesh and not one name on it, 0 labels in Albers and 1 in LAEA. Walking the
line's own points needs no cut, no inverse, and no special case: the points are
already computed at one-degree steps in whatever projection is on, so the label
lands on the curve exactly where the line does. Home view now gives 6 labels in
all three (90/120/150/180°E, 0°, 30°N), and a view over Japan gives 8
(115–135°E every 5, 25/30/35°N).

The text elements are reused between frames rather than rebuilt, since this
runs on every pan. Offsets are applied inside the scale transform so a label
stays the same number of pixels off the edge at every zoom. A white halo
(`paint-order: stroke`) was added because the names are over land now, and the
line itself went from 20% to 22% opacity in dark mode for the same reason.

---

## Island names: the largest first, and what that did not fix

Asked for: rank the fine-coastline labels by size before placing them, since
`placeLabels` is greedy and first-come-first-served and the order was whatever
the shapes were grafted in.

Done. `ensureSubLabels` already measured each island's box and kept only half
its height; it keeps the area now, and the `sub` block sorts on it descending
inside the existing kind rank. A division measured from `data-cx` has no box —
asking the browser for thirteen hundred of them is a layout flush the fine
coastlines do not cost — so it sorts as `Infinity` and stays ahead of the
islets, which is what the kind rank already intends. Sorting is stable, so
divisions keep their document order among themselves.

**Measured, on the western Solomons at 1108x740, the view that prompted this.**
183 fine islands on screen, 163 of them under 400 square pixels and 141 under
100. Before and after, 84 names are drawn. Seven change: **Ghebira, Karunjou,
Malangari, Mauru, Mbarambuni, Ramata and Singgo come in; Kapatene, Kokorana,
Lola, Mbaghumbaghu, Moluana Nggete, Nggulasa and Njapuana go out.** Islands of
ten square pixels or less fall from 18 to 15. Real, and small.

**And it does not fix Santa Isabel, which is what I said it would.** That claim
was wrong and the measurement says so: Santa Isabel is still unnamed after the
sort. Two separate faults, neither of them the ordering:

*Choiseul* — its label anchor is the centre of the shape's full bounding box,
and with the island half off the top of the window that centre is at y = -20.
`free()` rejects any box outside the frame, so the name is dropped although
two-thirds of the island is on screen. The anchor needs clamping to the visible
part of the shape.

*Santa Isabel* — its anchor is **57 pixels above the island's own centre**
(label at 955,271 against a shape centred on 955,328), and it is rejected for a
clash at that displaced position, with nothing at the true centre to stop it.
The anchor comes from `getBBox()` read once when the label is made, and it does
not agree with where the shape is rendered. Not chased further today.

Neither is the density quota that was actually asked about; that is still to
come, and it needs the anchor to be right first, since a quota that keeps the
largest island in a cell is no use if the largest island's name is thrown away
for standing in the wrong place.

---

## A density quota for island names

Asked for: cells over the map, each keeping its largest K islands, K falling as
the cell fills, so a lone islet keeps its name and a shoal of thirty does not.

`islandQuota` in `map.js`. K = `clamp(round(10 / sqrt(n)), 1, n)`: one island in
a cell keeps its name, three keep all three, nine keep three, thirty keep two.
Cells are anchored to the map's own origin and sized in map units, so they do
not slide under a pan — a boundary drifting across an island would make its
name blink as the reader dragged, which is worse than the clutter. Only the
fine coastlines are counted; a division has no measured box (`area` is Infinity)
and is never subject to it.

**The cell size steps on half-powers of two**, sized to about 170 screen pixels.
Whole powers were tried first and the cell can then be out by a factor of two
either way: across one notch of the zoom the count of names jumped between 30
and 49. On half-powers the same sweep runs 26–40.

Measured over a zoom sweep on the Solomons, 1108x740:

| view | islands on screen | named | under 100px² | ≤10px² |
| ---: | ---: | ---: | ---: | ---: |
| 100 units | 329 | 26 | 14 | 9 |
| 66.7 | 271 | 30 | 14 | 3 |
| 44.4 | 183 | 31 | 10 | 4 |
| 29.6 | 153 | 40 | 17 | 4 |
| 19.8 | 120 | 29 | 8 | 0 |
| 17.9 | 108 | 28 | 5 | 0 |

Against 84 names before, of which 48 were under 100px² and 15 were specks.

**And it leaves the sparse places alone, which was the point.** The Bonins, 18
islands on screen, keep 13 names (14 before). The Ryukyus, 66 islands, keep 21
(32 before). The Solomons, 183 islands, keep 31 (84 before). Zoom is the
release valve: because the cell is a fixed number of screen pixels, closing in
thins the crowd rather than magnifying it, and the shoal that gets two names
from across the Solomon Sea gets all thirty from among them.

---

## Every city has its description, in both epochs

Reported: detailed city descriptions missing from the info pane, and present in
1930 but not 1942.

**Found, and it was fifty-one cities in each epoch — the most important
fifty-one on the map.** `gazEnrich` takes a gazetteer dot's prose from the
browse layer and, by an explicit decision, took only *names* from the
examinable sites: "what a site's note and date say is about the event it is a
marker for". That is right for a battle and wrong for a city, and `siteById`
holds only the cities — `cat: 'city'`, 56 of the 127 — so the note it was
declining to copy was prose about the place.

The result: **Tokyo, Shanghai, Beijing, Singapore, Manila, Seoul, Hiroshima,
Nagasaki, Rangoon, Vladivostok** and forty-one others had no description at
all, while a county town in Húnán had one. It looked like descriptions going
missing at random because that is what it was, and it moved with the epoch
because whether the site's own marker is drawn over the dot — and so whether
the site record or the bare gazetteer one answers the pointer — depends on the
date.

One line: `if (!c.extra && s.note) c.extra = s.note;`. Measured, both epochs:
**51 cities with no prose becomes 1.**

The one left is `nikolaevsk`, which is a battle site and not a city site: its
note is about the 1920 massacre, not about the town, and that is exactly the
prose the original decision was right to keep off a city dot. Left as it is.

**And the tooltip needed trimming after it.** `short` was first set to the
whole "Capital of Japan · Japan" line, which the tooltip already prints as its
`when`, so Tokyo came up saying "Capital of Japan" twice, one under the other.
`short` now carries only the part `when` does not — the polity, and nothing
when the capital line has already named it. Checked across all 890 gazetteer
records in the two epochs: **none is left with nothing to say in the tooltip.**

Live, hovering and clicking the dots in both epochs: tooltip "Tokyo / 東京
(Tōkyō) / Capital of Japan", card "Capital of Japan · Edo until the
Restoration. The Great Kantō earthquake…" — the same in 1930 and 1942.

---

## Pan and zoom around India: measured, and not reproduced

Reported as bad again. **I could not reproduce it, and I am not going to change
geometry on a guess.** What was measured, all on a scripted pan and three zoom
steps over 68–90°E, 8–32°N with Administrative on:

*It is not JavaScript.* A CPU profile over 3.8 seconds of panning and zooming
is **3,520 ms idle**. The largest entry that is our own code is `onPointerMove`
at 3 ms. Hovering across the region for two seconds: 1,878 ms idle,
`querySelectorAll` 6 ms, `getBBox` 4 ms — against Japan's 3 and 2. Nothing here
is a hundred milliseconds, which is what the last one was.

*And headless cannot see the rest.* Frame times are pinned to vsync — India
16.2 ms mean, Japan 16.3, China 16.3, the Indies 16.3 — and the paint timeline
is flat across regions: PrePaint 45 ms, Layout 12, Paint 9 for India against
PrePaint 46, Layout 24, Paint 9 for Japan. India measures *cheaper* than Japan
on layout. Headless Chrome rasterises through SwiftShader and does not stress
a real compositor, so the absence of a signal here is not evidence of absence
on the reader's machine.

*The one structural suspect was tested and cleared.* `clip-burma` is a
**4,523-vertex clip path applied to nine separate paths**, and it is next to
India in the same view — by far the heaviest clip on the map (`clip-off-frontier`,
which the princely states use, is 92 vertices across 24 paths). Stripped at
runtime and re-traced, three runs each: **83 ms with it, 83 ms without.** No
difference in this harness.

For the record, what is in that view: `#a-princely` 24 paths and 24,166
vertices, `#a-india` 5,522, 33 clipped elements visible, the India rivers layer
off by default (3,505 vertices when on).

**What would settle it:** which browser, whether Administrative and Cities are
on, and whether it is the drag or the wheel that stutters. A profile from the
machine it is slow on would find it in one pass, as the last one did.

---

## India's pan and zoom: found on the second attempt, and it was a forced layout

The first attempt said "measured and not reproduced". That was true of what it
measured and it stopped one step short. Comparing the two deployed builds
against the working tree found it.

**The harness that worked.** The same scripted pan and zoom run against
`froginawell.net` (1.21), GitHub Pages (1.22) and localhost, three to four
repetitions each, **with `Emulation.setCPUThrottlingRate` at 6–8x**. Throttling
is what the earlier attempt lacked: unthrottled, headless pins every region to
vsync at 16.7 ms and the profile is 93% idle, so nothing shows. Slowed down,
the ranking is legible.

**No regression between the versions.** 1.21 and 1.22 measure the same —
1,171 ms busy against 1,240 at 6x, 1,618 against 1,573 at 8x, within the noise
of each other. Whatever the reader is seeing is not something the recent work
introduced; it has been there all along.

**And the largest single cost was a forced synchronous layout on every frame of
the drag.** Attributed by walking the profile's call tree rather than reading
self-time:

```
96 ms  getBoundingClientRect  <-  containerSize < defaultView < applyView
13 ms  getBBox                <-  activeBounds  < defaultView < applyView
```

`applyView` runs once a frame and asks `defaultView` how far in the reader has
come, for two comparisons: whether to drop the island rings, and whether the
reset button is idle. `defaultView` reads the container's rectangle and calls
`getBBox` **on every atom on the map**. Both force the browser to lay the
document out synchronously in the middle of a pointer handler — and the answer
is identical every time, because nothing it depends on can change during a
drag. India is the worst of it because India is where the most shapes are in
view: 74 ms with Administrative off, **96 ms with it on**.

This is the same shape of fault as the tooltip's 99 ms `getBoundingClientRect`,
and the same fix: do the read when the answer changes, not when it is wanted.
`containerSize` and `defaultView` are cached against a generation counter,
bumped by `onResize`, `applyState`, `composeEpoch`, `replaceInProjection`,
`graftFine` and `dropFine` — a resize, a change of state, a new epoch, a
reprojection, and each graft that puts more geometry on the map.

**After: `getBoundingClientRect` does not appear in the profile at all**, and
`activeBounds`'s `getBBox` falls from 13 ms to 0. At 8x throttle, 124–135 ms of
it in the two deployed builds against none here; frame p90 18.2 ms against
19.5.

**One bug on the way, caught by the test and not by reading.** `defaultView`
ends in `clampView`, which returns the object it was given, and four callers do
`view = defaultView()`. Handing back the cached object therefore made the cache
*be* the live view, so every pan and zoom mutated what the map believed its
opening view was. The symptom was the reset button: three notches in it still
called itself idle and did nothing, because `home.w` had followed `view.w`
down. `defaultView` returns a copy now. Checked against `HEAD` on the same
script — home, zoom in, reset, resize, resize back, change epoch, switch
Administrative on, reset again — and the two agree line for line.

---

## A script for comparing two builds before an update

`tools/compare_perf.js`. Asked for because this comparison will be wanted every
time the live site is about to be updated, and doing it by hand each time is
how the first attempt at it got the wrong answer.

```
node tools/compare_perf.js                                   # live, pages, local over India
node tools/compare_perf.js --region japan --targets live,local
node tools/compare_perf.js --admin --epoch 1942 --reps 5 --throttle 8
```

Targets are `live` (froginawell), `pages`, `local` (a server on 8123) or any
URL. Regions are india, japan, china, indies, solomons, home. It reports busy
script time, forced-layout time, and frame p50/p90/p99, averaged over the
repetitions, with a percentage against the first target.

**Two things it does that a hand-rolled run did not, and both were the reason
the earlier attempt failed.**

*It throttles the CPU.* Unthrottled, headless Chrome pins every region of this
map to vsync at 16.7 ms a frame and the profile comes back 93% idle, so every
build and every region measures the same. At 6x the ranking is legible. This is
recorded at the head of the file so nobody removes it as a needless
complication.

*It walks the call tree instead of reading self-time.* `getBoundingClientRect`
at the top of a profile is not actionable — the same call is a bug once a frame
and harmless once a click. The script reports the layout-forcing reads with
four frames of their caller, which is what turned "India feels slow" into
`containerSize < defaultView < applyView`.

Puppeteer is looked for rather than required, since it is 300 MB and nothing
the map ships needs it: `npm install puppeteer` here, or set `PUPPETEER_PATH`.
`node_modules/` was added to `.gitignore`.

**What it says today**, India with Administrative on, 6x, three repetitions:

| build | version | busy | forced layout | p90 |
| --- | --- | ---: | ---: | ---: |
| froginawell | 1.21 | 1,335 ms | **122 ms** | 18.7 |
| github pages | 1.23 | 1,279 ms | 5 ms | 17.8 |
| working tree | 1.23 | 1,239 ms | 5 ms | 17.8 |

and on the home view, where the whole map is drawn: froginawell 97 ms of forced
layout against **none worth reporting**.

Pages and the working tree are the same build and measure within 3% of each
other, which is the harness telling you what its own noise floor is — worth
knowing before reading anything into a small difference.

One bug written and fixed while writing it, and it is the one `CLAUDE.md`
already warns about: `console.log('%-7s %9s', ...)` prints the flags literally
in Node, which supports `%s` and `%d` and no width or alignment, and then every
argument after the first lands a column to the left. The table is padded by
hand now.

---

## City names with no dots under them

Reported: names for cities that "haven't landed yet" — a screen of them across
western China with nothing beneath.

**They had not failed to land; they were never going to.** When `JMAP.GAZ` is
present it is what draws the city dots, and `#browse`'s own dots are hidden
outright — `browseGroup.style.display = (!JMAP.GAZ && browseVisible())`. So the
names in `#labels` are the names of *gazetteer* dots. The gazetteer thins its
dots by tier as the reader pulls back, `gazMinTier()`, and the name asked no
such question: its whole gate was `browseVisible() && labelLevel() >= 2`. Below
the tier floor the dot went and the name stayed.

A browse label now also requires its own dot to be drawn, through a new
`gazFor(id)` index into the epoch's gazetteer records. Measured, counting names
with no visible dot within 30 px:

| view | names before | orphaned | names after | orphaned |
| --- | ---: | ---: | ---: | ---: |
| western China | 37 | **20** | 17 | **0** |
| British India | 45 | **18** | 27 | **0** |
| eastern China, Japan, home | 0 | 0 | 0 | 0 |

Wūlǔmùqí and Lánzhōu keep their names because their dots are above the floor;
Hami, Éjìnà, Yínchuān and Xīníng lose them at that zoom along with their dots,
and get them back on the way in.

---

## Forty island names, and no more

Asked for: at most the top forty islands named with Other on, in the Solomons
and off New Guinea.

`ISLAND_CAP = 40` in `placeLabels`. It needs no sorting of its own: the
divisions and islands are already ordered largest-first for the placer, so the
fortieth island drawn is by construction the fortieth largest that fitted. The
quota still runs underneath it and still does the useful half of the job —
deciding *which* island is worth naming in each patch of sea, so the forty are
spread rather than all in one shoal.

Measured at 1264x716, the reader's own window:

| view | islands on screen | named |
| --- | ---: | ---: |
| Solomons, the reported view | 295 | 37 |
| Solomons, tighter | 182 | **40** |
| north coast of New Guinea | 187 | 32 |
| Ryukyus | 66 | 22 |
| Bonins | 18 | 13 |

The cap binds where it was asked to and nowhere else: the Bonins and the
Ryukyus are under it and unaffected. Every island keeps its identity — still
hoverable, still named in the panel — it simply is not written across the sea
unless it is one of the forty largest in view. Santa Isabel and Choiseul are
named in that view now, which they were not before.

**A note on the harness, because it wasted time twice.** Running several pages
through one headless browser makes some of them report *zero* island labels —
a timing artefact, not a fault in the map. The same views measured one page at
a time are stable across repeated samples: Solomons 40, 40, 40; Bonins 13, 13,
13. Measure one view per browser when the number matters.

---

## A horizontal scrollbar across the legend, for two pixels of a caret

Reported as the info pane; it is the legend, and it was two pixels.

`#legend .legend-head`'s fold arrow is a 10px square — 8px plus a 2px border
on two sides — standing on one corner, `transform: rotate(45deg)`. A square
rotated 45 degrees has a bounding box 1.41 times its side: **14.1px against the
10px the layout gives it, so 2px past each edge.** `justify-content:
space-between` puts that box hard against the head's content edge, so the
corner stuck 2px out of the panel — and `overflow-y: auto` makes the other axis
`auto` too, so the browser answered with a full-width horizontal scrollbar for
a corner nobody could see sticking out.

`padding-right: 3px` on the head. Measured, `scrollWidth - clientWidth` on
`#legend` at 1500, 1300 and 1100 wide: **2px, 2px, 2px becomes 0, 0, 0**, and
0 at the narrow widths where it never happened. Checked open and folded — the
folded caret is the same square at -135 degrees and has the same bounding box —
and with an info card and the Layers dialog open, `#info`, `#quiz`,
`#dlg-options` and `.legend-body` all at 0.

Worth remembering as a shape of bug rather than as this one caret: **a rotated
element's layout box is not its painted extent**, and any ancestor with
`overflow` set on one axis will grow a scrollbar on the other to reach it.

---

## Annotations: a reader's own marks, saved as GeoJSON

Asked for: two buttons in Layers, drawing tools with styling and text, save to
a file, load one back, keep editing, and a shareable link for a small set.

**Where the styling lives, which was the open question.** GeoJSON says nothing
about how a feature should look, and there is one good answer:
**simplestyle-spec**, which QGIS, geojson.io, GitHub's GeoJSON preview, Mapbox
and the Leaflet plugins all read. It is plain members of `properties` —
`title`, `description`, `marker-color`, `marker-size`, `marker-symbol`,
`stroke`, `stroke-width`, `stroke-opacity`, `fill`, `fill-opacity` — so it
survives a tool that has never heard of it rather than being stripped as
foreign. The one thing it has no word for is the difference between a point and
an event, which this map draws as a dot and a diamond; that goes in
`marker-symbol`, which the spec leaves open to any string. Anything else
opening the file sees an unfamiliar symbol and draws its default, which is the
right failure.

A saved point comes out as:

```json
{"title":"Mukden","description":"Where the incident began, 18 September 1931.",
 "stroke":"#1b1b1b","stroke-width":3,"stroke-opacity":1,
 "marker-color":"#1b1b1b","marker-size":"medium","marker-symbol":"circle"}
```

**Loading.** Any GeoJSON: a FeatureCollection, a lone Feature, a bare geometry,
and all seven geometry types including the Multi- forms and GeometryCollection,
because a file from QGIS or from this project's own caches uses them. A foreign
file has no simplestyle at all, so every feature is given one on the way in —
taking a name from whichever of `title`, `name`, `NAME`, `Name` or `label` the
file happens to use — and it therefore saves back out styled rather than bare.

**Errors say what is wrong, not that something is.** Ten fixtures, all
measured:

| file | what the reader is told |
| --- | --- |
| `good.geojson` | Loaded 2 features — 5 points, and the map has moved to them. |
| `lone-feature.geojson` | Loaded 1 feature — 2 points… |
| `bare-geometry.geojson` | Loaded 1 feature — 1 point… |
| `india-rivers.geojson` (this project's own, 354 KB) | Loaded 63 features — 14,851 points… |
| `notjson.geojson` | That file is not valid JSON. Nothing was loaded. |
| `truncated.geojson` | …and the first thing wrong with it is at character 58. |
| `bare-array.geojson` | That file is a bare array. GeoJSON needs a "type" — a FeatureCollection, a Feature, or a geometry. |
| `wrong-type.geojson` | Its type is "Banana", which is not a GeoJSON type. |
| `empty.geojson` | That file is an empty FeatureCollection — nothing to draw. |
| `bad-coords.geojson` | Feature 1 has a geometry this map cannot read. |

Nothing is half-loaded: the check runs before a single feature is adopted, so a
bad file leaves what is already on the map alone. A file over 24 MB or with
more than 240,000 points is refused with the count, rather than being allowed
to hang the browser.

**The link.** Deflated through `CompressionStream('deflate-raw')` and base64url
encoded, with a one-character prefix saying whether it is compressed so that a
link made in one browser opens in another that lacks it. Two annotations with a
name and a sentence of description come to **576 characters**; the cap is 6,000
of payload, which keeps the whole address near 6.2 KB. Past it the reader is
told the number — `india-rivers` reports "160,528 characters compressed, past
the 6,000 a link can carry. Save the file and send that instead." A damaged
link says so rather than failing silently.

**Round-tripped.** Draw two features, copy the link, open it in a clean
browser: both features, both names, the description, and the map moved to their
extent. Loading a file and then drawing on top of it saves as
`good-20260824-2202.geojson` — the source name with a stamp — with all four
features.

**Held in longitude and latitude, so the projections come free.** Switching to
Albers and to LAEA moves the marks with the map and back to the pixel:
`[[600,400],[700,450]]` in Mercator, `[[574,410],[656,432]]` in Albers,
`[[577,399],[671,419]]` in LAEA, and exactly `[[600,400],[700,450]]` again on
the way back.

**Two bugs found by testing, neither by reading.**

*`[hidden]` lost to `display: flex`.* The finish-and-cancel row is marked
`hidden` in the markup, and `#annotate .ann-drawing { display: flex }` beats
the user agent's `[hidden] { display: none }` — so it stood there from the
moment the panel opened, offering to finish a shape nobody had started.

*The panel stood over the legend.* Below the rail's 1000px breakpoint both
float in the same corner and the annotation panel is the taller, so the
legend's colours showed faintly through it. The legend stands down while the
panel is open and comes back when it closes. And above the breakpoint the panel
was over the map rather than in the rail, because these rules are written at
the foot of the stylesheet and a later rule of equal specificity wins; the rail
rule is re-stated after them.

**Checked with a mouse and with a finger**, as the rule here requires. On both,
a tap with a tool armed places the mark and does *not* select the country under
it; with the tool off, the same tap selects China exactly as a control page
that never opened the panel does.

**What it costs.** `map.js` goes from 265,362 to 297,584 bytes, and **84,294 to
93,263 gzipped — 9 KB on the wire**, which is what every reader pays whether or
not they ever draw anything. No new file to upload, so `UPLOAD.md` and
`DEPLOY.md` are unchanged.

---

## Annotations, second pass: out of the payload, and much deeper

Six things asked for. All six done, and the testing found things reading would
not have.

### What a reader who never draws now pays

`annotate.js`, fetched the first time somebody presses one of the two buttons
or opens a link carrying a set. The panel's markup and its stylesheet went with
it — the file builds its own DOM and injects its own `<style>` — so `map.js`,
`styles.css` and `index.html` all shrank.

| | first load, gzipped |
| --- | ---: |
| before annotations existed | 108,849 |
| annotations inside `map.js` | 119,985 |
| **now, split out** | **110,874** |

**2 KB above where the map was before the feature existed**, against 11 KB when
it all sat in `map.js`. What is left in the base is the loader, the two buttons
and their rules. `annotate.js` is 17.8 KB gzipped and arrives only when asked
for. The single-file build inlines it instead, because a page opened from the
file system cannot fetch a neighbour — checked from `file://`: 84 atoms, the
panel opens, a mark can be placed, and **no request is made at all**.

### Copy link, and what was actually wrong

Reported as not working properly. It works on Chrome and it works on the live
site — measured end to end against GitHub Pages: a link of 483 characters,
opened in a clean browser, two marks, both names. What was wrong is
**Safari**, and the shape of the bug is worth recording.

Deflating is asynchronous. A clipboard write that happens after an `await` is
outside the click that caused it: Safari refuses it outright, and the old code
then fell to `window.prompt` — a dialog nobody asked for, which some browsers
suppress and which, when I first ran the live test, hung the test runner for
two minutes. That hang was the evidence.

So the set is now **packed before the button is pressed**, on a timer after
every change, and the press does nothing but read a string that is already
there: synchronous, inside the gesture, allowed everywhere. `window.prompt` is
gone; when a clipboard write is refused the link appears in a field in the
panel, selected and ready. Tested by making `writeText` reject as Safari does:
the field appears, holds a working URL, and no dialog is raised.

### A shared link opens folded

`fromUrl` opens the panel folded and says so: *"These annotations came with the
link. Open the panel above to add to them or save them."* The head keeps a
count — "1 mark" — so a folded panel still says what it holds, and an error
message unfolds it, because a message a folded panel cannot show is a message
nobody reads.

### What the editor can do now

* **Names on the map.** A name typed in the panel is written beside its mark,
  with a switch to take them off. Without this a reader types into a list and
  looks at anonymous dots.
* **Measurement.** A line in kilometres, an area in square kilometres, a point
  as a coordinate — in the list and under the fields. The area is the
  **spherical excess**, not a planar shoelace: on a map whose whole argument is
  that Mercator lies about area, calling a shape in Hokkaido a third smaller
  than the same shape on the equator would be a poor thing to do in its own
  annotations.
* **Dragging.** A mark can be moved and a shape reshaped by its corners, which
  is the difference between a drawing tool and a stamp. It only takes the
  pointer when the press landed on a mark and no tool is armed, or repositioning
  and panning would be one gesture with two meanings.
* **Undo**, 40 deep, on the button and on `Ctrl`/`⌘ Z`; `Delete` removes the
  selection; `Escape` cancels a shape and then puts the tool away.
* **The place names the mark.** A point dropped on China comes up called China.
  On a map like this one that is most of the typing a reader would do.
* **Four marker shapes**, dashed lines, and the style controls follow the
  selection — so pressing a colour after clicking a mark changes *that* mark.
* **Add file…** merges rather than replacing, for building a set from several.
* **Fit** and a per-row **⌖** to move the map to everything, or to one thing.
* **It survives a reload.** The set is kept in the browser and offered back on
  return; declining clears it rather than asking again.

### The interface, at four sizes and with a finger

The panel floated in the top-left corner. On a 390-pixel phone that was **34%
of the screen and half the map's width**, and it stood on the legend, which had
to be hidden to make room. It docks to the foot of the screen below the rail's
breakpoint now — the map is whole above it, the tools are under the thumb, and
the legend stays. And **while a tool is armed it collapses to the tools alone**:
46% of the height becomes 14%, so a reader drawing on a phone has 86% of the
screen to draw on.

### 120 checks, in `tools/test/annotations/`

Kept in the repository rather than thrown away, since this will be touched
again. Four scripts: tools and styling and undo and dragging; files and saving
and the link; the store, the map, the projections and touch; and the panel at
390, 768, 1100 and 1600 pixels. Every one passes.

Three things the tests taught, all recorded in the suite's own README:

*One browser cannot run them all.* Forty pages over a hundred checks slows a
headless browser until `Runtime.callFunctionOn` times out. `run4` opens a fresh
browser per screen size, because a viewport change on a used page is not the
same thing as a page that opened at that size.

*`page.evaluate` ships one function and nothing else.* A helper defined beside
it is not in the page and throws `ReferenceError` there. The spot-finder had to
be made self-contained.

*Three of the failures were the tests, not the code* — an assertion that
indexed a promise, an obsolete "the legend stands down" check left over from
the layout the bottom sheet replaced, and a spot-finder that gave up on a small
screen. Worth saying plainly, because a suite that is wrong in a way that
matches the code is worse than no suite.

---

## Japan disappeared, and had done since long before this week

Reported from a phone: Japan sometimes gone after zooming. Korea, Karafuto,
the Kuriles and Taiwan drawn, and no Honshu.

**Not the annotations, and not new.** The same test against `froginawell` at
1.21 loses Japan exactly as the working tree did, so this has been in the map
for as long as the fine coastlines have.

**What happens.** `#a-japan` is one of the empty atoms: the country is drawn by
its *backing*, the single polygon under the group. A backing is hidden as
`redundant` once its atom carries paths of its own, which is right for the
administrative sheet — Siam's atom is empty until the sheet arrives and carries
seventy changwat afterwards, and the backing beneath them is then a second copy
of the same ground.

The fine coastline layer is not that. It has a window of **62 small rings** for
the Japanese coast, and `FINE_W_FOR = { japan: 420 }` grafts it at a shallower
zoom than any other window. The moment it arrived the atom held paths, the
backing was called redundant and hidden, and what was left of Japan was those
62 islets. Nothing recomputed it on the way back out, so the country stayed
gone for the rest of the visit.

Measured, as painted area in square map units — the atom's live paths plus its
backing where it is showing:

| | 1.21, and the working tree before | after |
| --- | ---: | ---: |
| opening view | 133,425 | 133,425 |
| three notches in, window grafted | **495** | 133,919 |
| back out at the opening view | **495** | 133,919 |

**The fix is one selector and three call sites.** The redundancy rule counts
`path:not(.superseded):not(.fine)` — only a division makes a backing redundant,
and a grafted coastline is passed over. It was a loop buried in `applyState`;
it is `syncBackings()` now, called there and from `graftFine` and `dropFine`, so
it is right whenever a window comes or goes rather than only when a layer is
switched.

**Checked that the rule still does its job.** With the administrative sheet on,
fifteen backings still flip from live to redundant — Tibet, Xinjiang, the
princely states, Chahar, Suiyuan, Jehol, Manchuria, Manchukuo, Siam, Burma,
Saharat, Sarawak, Brunei, Korea and Japan. Deep in the Ryukyus, `ryukyu` stays
redundant because its atom has coarse paths of its own, and Japan stays live.

`tools/test/backings.js` is a regression test for it: it zooms in past the
Japanese window and back out and asserts the country is still painted, and that
the administrative sheet still stands the backings down.

---

## The annotation editor: shapes, opacity, hidden names, and honest limits

Six things asked for.

**Names can be hidden and are still readable.** The switch was already there;
what it lacked was anywhere else for a name to live. Pointing at a mark now
gives its name, its description and its measurement in the map's own tooltip —
`map.js` lends it out through the host as `tip`/`untip` — so hiding the names is
a display choice rather than a loss. A description was never on the map at any
setting, so this is the only way to read one at all. A tap on a mark selects it
in the panel, which is the useful answer now that shapes take the pointer;
before, a tap inside a drawn area reached the country underneath and now cannot.

**Ten shapes, not four.** Dot, ring, square, triangle, triangle-down, diamond,
star, cross, plus and pin. They ride in `marker-symbol`, which simplestyle
leaves open to any string, so a file opened elsewhere shows a marker with an
unfamiliar symbol and draws its default. Cross and plus have no fill to put a
casing round, so they are drawn twice — a thick light stroke under a thin
coloured one — which is the trick the mandate lines already use. The pin stands
on the point it marks, so the coordinate is the tip and not the middle of a
blob.

**Full colour and opacity.** The colour control was always a full RGB picker;
what was missing was opacity. Two sliders now: **Opacity** for the mark or the
line, **Fill** for an area, with the fill checkbox retired in favour of a
slider whose zero is "no fill". Stroke opacity is simplestyle's own
`stroke-opacity` and `fill-opacity`; a marker's has no word in the spec, so it
is `jem-marker-opacity`, prefixed so nobody mistakes it for standard. Measured
through a save: `stroke-opacity: 0.55`, `fill-opacity: 0` survive the round
trip to the file.

**A big set arrives with its names off.** Past 40 features or 4,000 points the
`Names on the map` switch comes up off and the message says why —
`india-rivers` loads as *"63 features — 14,851 points, and the map has moved to
them. Names are off — that is too many to write on the map at once."* The
reader can switch them straight back on; measured that they then appear.

**The ceiling came down, because it was not one.** It was 24 MB and 240,000
points, which at that size is hundreds of thousands of SVG nodes and a browser
that will not pan. **6 MB and 60,000 points** now — `india-rivers`, one of the
larger files anybody will hand it, is 354 KB and 14,851 points, a quarter of
the new ceiling. A refusal names both numbers and how far over.

**And the link warns before it is asked.** A set loaded from a file is very
often too big for an address, and being told so only on pressing Copy link is
being told at the wrong moment. A standing line appears the moment the set is
packed:

> Too much for a link: these 63 features come to 160,528 characters
> compressed, 27× the 6,000 an address can carry. Save file works; Copy link
> cannot. Fewer or simpler features would fit.

Copy link is struck through while it holds. Measured on `india-rivers`.

**Checked:** 19 new assertions across the six, plus the committed suite —
`run.js` 25 of 25 and `backings.js` 6 of 6. One of its assertions had to be
updated rather than the code: a marker is a `<g>` of one or two elements now,
and the old test asked the first child for its fill.

---

## A running count of what will fit in a link

Asked for: a concise `x / x` of the link's capacity in the panel, because names
and descriptions are characters too, and so are the vertices of a closely
traced shape.

A line above the buttons, there from the first mark: a thin bar and
`329 / 6,000 for a link`. It goes amber past 80% and red past 100%, where it
reads `160,528 / 6,000 for a link — file only` and Copy link is struck through.

**It counts the compressed length, which is the only number that means
anything** — that is what has to fit in an address. It also means the count
does not climb evenly, and the tests measure that rather than asserting it:

| | counter |
| --- | ---: |
| one mark | 329 |
| plus 1,200 characters of repeated text | 348 |
| plus 1,200 characters of *varied* text | 484 |
| 31 marks | 616 |
| `india-rivers`, 63 features | 160,528 |

The same 1,200 characters cost 19 or 155 depending on what they are, which is
exactly why a counter beats a count of features.

Packing is deflate and a description is typed a letter at a time, so it is
debounced by 250 ms — a quarter of a second after the last keystroke, rather
than forty compressions of the same set.

`tools/test/annotations/run5.js`, 11 checks, all passing.

**One thing that looked like a bug and was not.** A first pass at the test saw
the counter stall at exactly the seventh description, twice running. It was the
test addressing rows by `k * 11` in a list that had fewer rows than it assumed.
Driven properly, eight descriptions of 1,800 characters each moved the count
every time and all eight were in the store.

---

## The two serious bugs from the review, fixed

Both were confirmed twice before being touched — see
`reports/2026.08.25-bug-review.md` — and both are fixed and measured.

### Changing projection no longer empties the map

Two faults compounding, and both the same mistake: geometry captured under one
projection used as though it were in another.

*`wantsFine()` compared the live view against Mercator boxes.* `data-fine` is
written by the build and is therefore in Mercator units; `view` is in whatever
projection is on. An Okinawa view in Albers sits at x≈1308, outside the
Mercator `ryukyu` box and inside the Mercator `nanyo` box — so the Ryukyus were
dropped and **559 Caroline islands grafted in their place**. There is a
`viewMercBox()` now, sampling the frame 13×13 because off the cylinder a
parallel bows and the corners no longer bound the view. It is cheap: `syncFine`
is on a 220 ms timer, not on a frame.

*`reprune()` put coarse shapes back exactly as captured.* `coarseOrig` held raw
`d` strings with no record of the projection. It holds the **Mercator**
original now — `__d0` where the document has been reprojected, the attribute
where it has not — and restores it through whatever is on.

`rebuildFineHits()` is also called from `replaceInProjection` now: the reach
that lets a reader point at a reef is in map units, so it has to be rebuilt
when those units change.

Measured at Okinawa, `?bbox=126.5,25.8,128.6,26.9`:

| | fine paths in the Ryukyus | land shapes in view |
| --- | ---: | ---: |
| Mercator | 126 | 60 |
| Albers, before | **0** | **0** |
| Albers, after | 126 | 60 |

Switching mercator → albers → laea → mercator → laea → albers gives 126 and 60
every time. A cold Albers link, which never worked at all, now brings the fine
coast with it: 126 and 61. And LAEA after a pan: 126 and 55.

### A shared link no longer destroys the reader's own work

`fromUrl` skipped the restore offer, `loadText` replaced everything and
`store()` wrote it over the top — no dialog, nothing said. The reader's set is
**set aside rather than replaced** now: while a shared set is on screen the
store writes to a key of its own, their own is left exactly where it is, and a
button offers it back — *"Back to my 2 annotations"*. Measured: their
`["MY FIRST MARK","MY SECOND MARK"]` survives a shared link intact.

---

## Locked by default, a warning before leaving, and two new gestures

**A shared link opens locked.** Somebody who followed a link came to look, and
a set that is not theirs should not lose a point to a stray press. The marks
are drawn, the panel is not shown at all, and a pencil on a coloured disc in
the corner of the map is the way in. Hovering still names a mark — reading is
not editing. The panel has a padlock that puts it away again, and the pencil
exists only while there is something to edit.

**A warning before leaving unsaved work, and not the greedy kind.**
`beforeunload` is abused often enough that browsers have rules: the handler is
ignored unless the reader has interacted with the page, and the words are the
browser's own. Both suit us. The listener is **added only while there is
unsaved work and removed the moment there is not** — measured: a reader who has
drawn nothing is not stopped, nor one who has only opened the panel; one with a
mark of their own is; saving the file settles it; drawing again arms it.

**Right click takes a point out.** On a mark, the mark goes. On one corner of a
line or an area, only that corner goes and the shape stays — and below the
minimum, two points for a line and three for an area, the whole feature goes
and the message says so. One `Ctrl`/`⌘ Z` puts back exactly one of those.

**A long press moves a mark on a finger, which also fixes a bug the review
found.** `drag` had one call site, inside the map's `mousemove` handler, which
is wired only where a pointer can hover — so on a phone a press on a mark
cancelled the pan and then did nothing at all. Every pointer move reaches the
annotations now. A mouse still takes a mark the moment it goes down; a finger
has to hold it still for 330 ms first, with 10 px of slop for the wobble of a
held thumb, and a press that wanders off before then is a pan as it always was.

Measured, on a touch viewport: a quick drag off a mark still pans; a hold
announces itself; the finger then moves the mark while the map stays put; one
Undo puts it back.

**34 new checks**, in `run6`, `run7` and `run8`. The suite is 165.

**Three things the tests said that reading would not have.** The pencil opened
the panel *folded*, which is not what somebody who pressed edit asked for — a
real bug in the new code, fixed. And two of the failures were my own
assertions: one measured a locked mark's position in screen pixels, which a pan
changes even though the mark has not moved, and one hovered after a pan had
shifted what was under the pointer.

---

## Selecting Japan traced only the islets — the same mistake, a third time

Reported with a screenshot: tapping Japan without Administrative drew the
selection outline round Sado, Oki, Awaji, Tsushima and the Gotō islands, and
nothing round Honshu, Kyushu or Shikoku.

**The same predicate, written out a third time.** `outlineOf` drops a backing
from an outline unless the atom is empty, because a backing is Natural Earth's
coastline of the same country and stroking it beside the sub-units draws one
line twice. Its test for "empty" was `$$('path:not(.superseded)', atom).length`
— the same words as the backing-redundancy rule that lost Japan a week ago, and
wrong for the same reason. Once the fine window grafts 62 islets into
`#a-japan`, the atom "has shapes of its own", the backing is dropped, and what
is left to trace is the islets.

It is one function now — `ownShapes(atom)`, `path:not(.superseded):not(.fine)`
— and the three places that ask the question call it: the backing rule, the
outline, and the hatching, whose own comment already said it was "the same case
the hatching has to make an exception for".

Measured on a view over Japan with the window grafted, as the outline's own
bounding box against the country's:

| | outline paths | covers |
| --- | ---: | ---: |
| before | 1 | **70%** of the country, and none of the mainland |
| after, finger | 2 | **100%** |
| after, mouse | 3 | **100%** |

---

## The version number was lying, and it cost an afternoon

Japan was reported as still disappearing on `froginawell.net` after the fix,
and the About dialog there said 1.29 — a version that has the fix. Every
measurement of the live site said the map was correct: backing live, display
inline, right colour, opacity 1, no mask, no filter, no clip, 3,926 valid
points, painted area 133,425.

**`.htaccess` cached `index.html` for ten minutes and `map.js` for seven days.**
The version number lives in `index.html`. So a reader who had been to the site
before got a fresh page carrying a fresh version number over a `map.js` that
could be a week old — and the dialog reported the new number with complete
confidence. A fix that was pushed read as a fix that had not worked, and the
version number backed the reporter up.

Two changes, because either alone leaves the trap half-set.

*The code is cached for an hour, not a week.* The SVGs keep their seven days —
they are two thirds of the weight and change rarely — so almost all of the
saving is kept.

*And `map.js` carries its own stamp.* `build_texts.py` writes `JEM_VERSION`
into it, and About reports **that** number rather than the page's. Where the
two disagree it says so:

> Version 1.32 — the page says 1.40, so your browser is holding an old map.js.
> Reload with a hard refresh to get 1.40.

Measured both ways: in step, no warning; with the page's number forced to 1.40,
the dialog shows 1.32 and the sentence above. A stale script announces itself
now instead of lying about what it is.

---

## Cache busting, so a release really is a release

Asked for: whenever the code changes, the page should load fresh objects rather
than whatever the browser is holding.

`build_texts.py` writes the version onto every script and stylesheet the pages
ask for — `map.js?v=1.34` — and `map.js` puts it on everything **it** fetches:
the base SVG, the administrative sheet, the fine coastlines, the ROC provinces,
`annotate.js` and `admin.js`. A release therefore changes every URL, and a
browser holding last week's copy is holding it under a name nothing asks for.

Measured on a clean profile:

```
first load : styles.css?v=1.34  data.js?v=1.34  cities-gaz.js?v=1.34
             map.js?v=1.34      japan-empire-map.svg?v=1.34
on demand  : japan-empire-map-admin.svg?v=1.34  annotate.js?v=1.34
deep zoom  : japan-empire-map-fine.svg?v=1.34
```

**Which lets the week-long cache come back.** It had been cut to an hour as a
stopgap; `.htaccess` returns everything heavy to seven days, and `index.html`
stays at ten minutes because it is the one file that carries the new names. So
a returning reader gets the full saving between releases and a guaranteed-fresh
set the moment one is pushed.

### The downsides, which are real

*It cannot bust a change that was never released.* The number moves once per
push, by the rule in `CLAUDE.md`, so a file edited and uploaded without a bump
is now held for a week where before it was an hour. **This scheme makes an
unbumped push worse, not better.** If a fix goes out without a bump, the answer
is to bump and push again, not to wait.

*And it introduces one new failure, which is why the upload order changed.* The
server ignores `?v=` — the filename is unchanged — so if `index.html` goes up
before `map.js` does, a reader arriving in that gap asks for `map.js?v=1.34`
and is handed the **old** `map.js`, which their browser then keeps under the
new name for a week. The window is seconds and it takes somebody arriving
inside it, but it is silent and it lasts. `DEPLOY.md` and `UPLOAD.md` now say
to upload the scripts, the stylesheet and the SVGs first and the pages last,
and the `rsync` recipe is two passes rather than one — it used to list
`index.html` first, which is exactly the wrong order.

Smaller ones, for the record: a browser keeps a copy per version until it
evicts them, which is a little disk; and some very old caching proxies decline
to cache a URL with a query string, which no host this map is served from does.

`bundle.py` had to be taught to match those tags by pattern rather than by an
exact string — a literal kept in step with what the build writes is one that
will eventually drift. The single-file build still works from `file://`.

---

## A performance review, and a bug it found in our own tool

`reports/2026.08.25-performance-review.md`. Measured against a build pinned with
`git archive`, because this checkout was being edited while the sweep ran.

**The finding worth acting on first:** a pinch on a phone runs at half frame
rate, and **56% of the main thread is forced layout** — 1,994 ms of it
`getBoundingClientRect` under `uiBoxes` inside the once-a-frame `placeLabels`,
and 1,158 ms of `getScreenCTM` under `pinchState` for a conversion the drag path
already does with arithmetic. A prototype took p50 from 32.5 ms to 17.4 and
forced layout from 3,353 ms to 443, landing the viewBox within a hundredth of a
unit.

**Two results that overturn what we assumed.** India is no longer the worst
region — China and Japan are, by 20–50%, because of the fine-coastline graft
firing mid-gesture. And **turning the Administrative layer on makes a pan
cheaper**, consistently across ten paired rows, because the divisions replace
the one huge backing with many small shapes.

**And a bug in `tools/compare_perf.js`, which is ours.** `map.js` persists the
layer switches and the projection in `localStorage`, so a second page in the
same browser starts where the first finished — a run that "switches labels on"
actually switches them off. The tool reused one browser across targets and
repetitions, so every `--admin` run after the first was measuring something
other than what it said. Each measured page gets its own browser context now.
Its version column also read the *page's* number rather than the running code's;
it reads `JEM_VERSION` now, for the same reason About does.

---

## Bookmarks, and what an old version gets

Asked, before shipping the cache busting: does it touch bookmarking, and does a
call for an outdated version fail gracefully? Both measured.

**Bookmarks are untouched, because `?v=` never reaches the address bar.** It is
written onto `<script src>` and `<link href>` and onto what `map.js` fetches —
never onto the page's own URL. A reader who pans, switches Cities on and
bookmarks gets `?bbox=74.4,-25.87,214.4,68.84&layers=2q`, which is what they
would have got a week ago. Reopened in a clean profile it comes back to the
same view and the same layers.

The round trip drifts by **0.09 map units, three thousandths of one per cent of
the view width** — the link records a lon/lat box rounded to two decimals, so
that is arithmetic and not the caching. It behaved this way before any of this.

**An outdated version is served, never refused.** A server ignores the query —
the filename is unchanged — so `map.js?v=0.01`, `?v=nonsense` and `?v=%20%22'`
all return 200 and the same 279,939 bytes as `map.js`, on GitHub Pages and
locally alike. There is no 404 to handle because there is no such thing: the
worst case is a *cache hit* on a URL nobody asks for any more, which is the
whole point of the scheme.

**And that corrected the wording of the version warning, which was guessing.**
Because an old page asking for `map.js?v=1.20` is handed the *current* script,
the running code can be **newer** than the page that asked for it — the
opposite of the case the note was written for. It said "your browser is holding
an old map.js", which in that case is exactly backwards. It reports both
numbers now and does not pretend to know which way round it is:

> Version 1.34 — this page was built for 0.01, so one of the two is coming from
> your browser's cache. A hard reload will put them in step.

Measured in that direction — a page rewritten to ask for 0.01 — About shows
1.34, the map draws its 84 atoms, and nothing errors.

`tools/test/bookmarks.js`, 11 checks.

---

## The two caching downsides, actually fixed

They had been named and documented, which is not the same as fixed. Both are
dealt with now.

### The key is a hash of the file, not the version number

The hole was the size of the rule that governs the version: **it moves once per
push**, so a file edited and uploaded without a bump kept its old URL — and its
old place in a week-long cache, which is a week rather than the hour it used to
be. Documenting that as a caveat left the trap set.

`build_texts.py` now writes the first ten hex digits of each file's own
SHA-256. `map.js` is given a `JEM_ASSETS` table for the six files it fetches
itself; the pages carry their own. Nothing lists `map.js`'s own hash except
`index.html`, which is written after `map.js` is, so there is no circularity.

Proved by doing the thing the old scheme could not catch — an edit with no bump:

```
before  : map.js?v=d2e54ae7b8   version 1.35
after   : map.js?v=9d39e3edcb   version 1.35   ← the URL changed, the version did not
reverted: map.js?v=d2e54ae7b8                  ← and an unchanged file keeps its cache
```

Measured across the whole site: every first-load file carries a distinct
ten-character key, and so do the administrative sheet, the fine coastlines and
`annotate.js` when they are fetched later.

### And the upload-order trap is now findable

That one cannot be fixed in code — the server ignores the query, so a page that
goes up before its files does hands a reader old bytes under a new name. What
can be fixed is that it was **silent**: no error, no 404, nothing in the
console, and a week before it clears.

`tools/check_deploy.py <url>` fetches the deployed page, reads the keys out of
it and out of the deployed `map.js`, and fetches every file the site would —
reporting whether each is present, served compressed, and whose contents match
the key it was asked for. Exit 1 if anything is wrong, so it can go in a script.

**Two flaws in the checker itself, found by pointing it at the real sites.** It
cried "WRONG" at GitHub Pages, which is serving a build keyed on the version
number and is perfectly consistent — a version key simply cannot be checked
against contents, and saying so is the honest answer. And at `froginawell`,
which predates keys entirely, it printed "0 files, all matching" and exited 0 —
a cheerful all-clear for having checked nothing. Both fixed: it distinguishes a
ten-hex content key from a version key, and it fails when it could verify
nothing.

A checker that gives false alarms and false all-clears is worse than none, which
is why it was worth pointing at three real deployments before trusting it.

`tools/test/cache-keys.js`, 7 checks, keeps the scheme honest.

---

## Twelve changes to the annotation editor, and one bug that explained itself

### The shape menu stopped obeying, and the reason was the Event tool

Reported as "when I get to star it stops working", with the note that there was
nothing special about star. There was not. **Choosing `diamond` silently turned
the point into an *event***: `kindOf` read `marker-symbol === 'diamond'` as "this
is an event" so that the two tools could be told apart, and `styleChanged`
writes a symbol only for a *point*. Diamond was a one-way door, and star is
simply the next entry in the menu.

Measured before the fix — every shape applies until diamond, and nothing after
it ever does:

```
circle ok   ring ok   square ok   triangle ok   down-triangle ok   diamond ok
star   → stored diamond   ← IGNORED
circle → stored diamond   ← IGNORED
```

The Event tool was to be disabled anyway, so there is nothing left to tell
apart: `kindOf` reads the geometry alone, and a diamond is a shape like any
other. A file arriving with `marker-symbol: diamond` draws a diamond, which is
what it asked for. Now every shape applies, twice round.

### An Arrow tool in its place

Two presses — where it starts, where it points — and it finishes itself,
because an arrow has no middle. Five heads (solid, barbed, open, dot, none) and
a **Bend**, straight at zero, which can be dragged on the map by the square
handle at the arrow's apex.

It is a two-point `LineString` with `jem-kind: 'arrow'`, so anything reading
the file without knowing the word draws the line — the right failure.
`jem-curve` is a **signed fraction of the arrow's own length**, not a control
point in map units, so a bend keeps its shape through a zoom and through a
change of projection. The head is a scalable, like a mark, because the stroke
it belongs to is `non-scaling-stroke` and a head in map units would grow while
its own line did not.

The bend handle sits at the quadratic's apex, `(a + 2c + b) / 4`; dragging it
solves back for the control point, `c = (4·apex − a − b) / 2`, and records how
far that lies off the chord. Measured: dragging it bends the arrow and **the
two ends do not move**.

### A mark now answers for itself, whatever tool is out

Right-click did nothing and a press just panned, and both had the same cause:
`rightClick`, `grab` and `tap` all began `if (!on || tool …) return false`, and
**the tool stays armed after a point is placed**. So the ordinary way of
working — place one, then adjust it — met a map that ignored the mark and put a
second point on top of it.

A press that lands on a mark now addresses that mark: it selects, it drags, it
deletes on the right button. Placing happens on empty map, which is where
somebody who means to place is pointing. One CSS rule had to go with it —
`#map-container.ann-drawing .ann-mark { pointer-events: none }` made marks
unclickable exactly when a reader would first want them.

### And the rest

* **Undo takes back the last corner**, not the whole shape, while one is being
  drawn. Nine corners placed and the tenth misplaced wants the tenth back.
* **Only the controls that apply**: Shape with Point, Fill with Area, Dashed
  with Line or Arrow, Head and Bend with Arrow. They follow the tool that is
  out, or failing that the feature selected.
* **The selection halo is back and stronger.** Lightening the colour was tried
  and is worse — the point of choosing a colour is that the colour you chose is
  the colour you see. Two shadows now, a tight dark one and a wide soft one,
  and light ones over a dark map where black is invisible.
* **The legend folds** when the panel opens and comes back when it closes,
  unless the reader has meanwhile chosen otherwise.
* **Nothing runs under the rail's scrollbar.** On a Mac that scrollbar is an
  overlay drawn *over* the content, so a field at `width: 100%` ran beneath it
  and lost its right-hand border — which is what "too wide to fit everything"
  was. `scrollbar-gutter: stable` and three pixels of padding.

36 new checks in `run9` and `run10`.

**A correction to this entry as first written, and to commit `ddb2643`.** Both
said "201, all passing". That was not true when it was written: `run.js` was
crashing, because it still drove the Event tool that had just been removed —
`pickTool(p,'event')` returned null. It was fixed the same day by pointing that
case at the Arrow tool, and `run9` still asserted "three tools, no Event" until
the next session. The count was reported from the file rather than from a run.

**Still open, because the sentence was cut off.** "After finishing a line or
polygon, only show points on its vertices when the user has …" — vertices are
already drawn only for the selected feature, so I have left it as it is rather
than guess at the ending.


## A short note and a long one, a menu of dashes, and a point of no weight

### Two lengths of text, and two places to read them

A mark now carries a **short note** and a **description**. The short note is
what the pointer shows, beside the name; the description is what a click puts
in the info pane, where every other description on this map is read. Where
there is no short note the pointer falls back to the first clause of the
description, so a set written before this change still reads sensibly.

`jem-short` holds it — a prefixed extension, as the other non-simplestyle
properties are. The card is the map's own: `map.js` lends `host.card(title,
sub, prov, note)` to the annotation module, so a reader's mark is read in the
same box as Mukden.

**The click had to be caught in two places, and that is the whole of the bug
that took the longest here.** A finger's tap reaches `tap()`, which knew what
to do. A mouse never does: `grab()` takes a press on a mark *at once* so that
dragging works without a hold, and `onPointerDown` then sets `movedFar = true`
— it is a handle, not a tap — so `onPointerUp` never offers the tap at all. The
description could be read with a finger and not with a mouse. `drop()` now
opens the card when a press ends where it began, which is what a click on a
mark is. Measured both ways: nine checks with a mouse and five with a
finger, and the long press still moves the mark.

### A menu of dashes, in place of the checkbox

Six patterns — solid, dashed, dotted, dash-dot, long, fine — scaled to the line
weight rather than fixed, so a hairline and a 6-pixel line both read as dashed.
`jem-dash` now holds the name; the old `true` from the checkbox still loads and
means "dashed". Measured: six styles, six distinct `stroke-dasharray` values.

### A point of no weight

Weight 0 draws nothing but keeps the label and the target: a transparent 9-pixel
disc, so it can still be pointed at, tapped, dragged and deleted, with a faint
dashed ring when it is selected so the reader can find what they cannot see.
This is for putting a name on the map and nothing else. Measured: `stroke-width`
0 recorded, no visible shape, the name still drawn, and the tooltip still
answers.

### Three faults in the test harness, found while checking the above

* **`run3` had been dead from its fourth section on.** `SPOT` looks for an
  interior point of China, Japan, India, the Indies or Siam that is on screen
  and clear of the panels — and on a 900×1000 touch viewport it returned null,
  so the script threw rather than failing a check. Not a fault in the map: a
  portrait stage opens cropped to the empire by design (`computeDefaultView`),
  and China's *bounding box* is then mostly Sinkiang, off the left of the
  frame. `SPOT` now sweeps the screen itself as a last resort and takes any
  land the map has on top. 19 checks, which had not been running.
* **`run3`'s last section duplicated `run4`** and timed out where it stood, so
  it is gone; `run4` measures the four screen sizes with a browser apiece,
  which is the more honest test anyway.
* **Closing a page does not undo the accumulation.** `run8` opened three pages
  in turn, each closed before the next, and still timed out on the third. A
  browser per section fixes it. `run11` was written that way from the start.

`run9`'s "three tools, no Event" was stale from the day Arrow replaced Event;
it asserts four now. And `run11`'s own touch case had to re-measure the mark
before the long press: on a phone the card is a bottom sheet, so opening it
shrinks the map and moves the mark out from under the finger that just tapped
it. That is the map behaving correctly and the test holding a stale
coordinate — the same shape of mistake as addressing a row by its number.

**22 new checks in `run11`, and 19 in `run3` that were never running. The suite
is 227 across eleven scripts — and this time the number is from running them,
not from reading the files.**


## The dashed perimeter went with the occupation source, and should not have

Reported as "what happened to our 1942 boundary line — the dotted line going
round all Japanese imperial territory". It was not gone from the build. It was
switched off by something that gave no sign of doing it.

**Layers → Occupied China, Dec 1942 → "North China Area Army report September
1942" hid the whole perimeter.** Not the arc across China: the whole ring — the
Kuriles, the Pacific box out past the Marshalls, the Solomons, the Indies,
Burma. The "Show the 1942 approximate line of control" checkbox stayed ticked
throughout, so nothing on screen connected the two, and `occSource` is saved to
`localStorage`, so it stayed gone across reloads with no obvious way back.

`applyState` tied the line to `occSource === 'traced'`, and the comment gave the
reason: across China the dashed perimeter *is* the inland edge of the traced
zone, so drawing it beside the other reading's shading asserts the very extent
the reader has just chosen against. That is right about the China arc and about
nothing else. The rest of the ring — most of it, and the only line on the map
that says how far the empire reached — has no bearing on which reading of China
is drawn.

**The line is now drawn under both readings.** The alternative was to cut the
China arc out and keep the rest, which is the better answer and a real piece of
work: `#extent-1942` is a single path whose main subpath is one continuous ring
of 12,138 characters, x 489–2308 and y 49–1555, with the inland edge an arc
inside it, so separating them means cutting the ring at two points. Chosen
knowingly, with the cost stated: under the NCA reading the dashed line across
China now sits beside shading it does not describe. The legend entry carries
its "one of several maps used; see Sources" note in both readings.

`tools/test/extent.js`, 15 checks: 1930 draws none, 1942 draws it and names it
in the legend, both readings of occupied China keep it, it survives a reload
under the NCA reading, the checkbox is what turns it off and back on, and all
three projections draw it at a size.


## A sharp arrow at any weight, and much heavier arrows to be had

A thick arrow had a blunt nose, and there were two reasons, one of them
invisible in the code and obvious on screen.

**The shaft's own cap sat on the tip.** The line is drawn to the point the
reader placed, with `stroke-linecap: round`, so half its weight domes out
*beyond* that point — and the head's apex was at the same point, underneath the
dome. At weight 3 that is 1.5px against a 14px head and nobody sees it. At 12
it is 6px of rounded shaft sitting exactly where the point should be.

The apex now reaches as far as the cap would have, so the sharp thing is the
outermost thing, and the shaft is **cut short** so its cap is buried inside the
head rather than showing through. The head narrows towards the apex, so the
depth at which it is at least as wide as the shaft is `len·width / 2·half`;
that plus the cap's own reach is how far back the cut goes. Cut, not shortened:
the quadratic is subdivided by de Casteljau, because moving the end point back
along the tangent would straighten the last part of a bent arrow. Arc length is
approximated as the mean of the chord and the control net, which is much closer
than the chord alone on a hard bend and needs to be right only over the length
of a head.

**And the triangle was wider than it was long** — 1.15r by 1.24r, an apex of
57°, which reads as blunt at any weight and as a lozenge at a heavy one. It is
1.55r by 1.2r now: 42°. The barbed head is longer too. An open chevron and a
dot trim nothing, because neither covers the shaft.

**The weight slider goes to 16 rather than 6.** It is shared with points, so a
marker can be that much larger too — radius `2.6 + size·0.9`, so 17px at the
top of the range.

Measured, in `run10`: at weights 2, 6 and 16 the head is longer than it is wide
and its apex is outside the shaft's own bounding box, and at 16 the shaft's
recorded end is short of the point it was drawn to. 12 new checks; `run10` is
28. The section runs in a browser of its own — a second page in the first one
timed out, the same accumulation as `run8`.

`run11`'s touch case was flaky at about one run in three and is not any more:
the card is a bottom sheet on a phone, so opening it resizes the map and the
mark slides for a frame or two, and the test was measuring into that gap. It
waits for the position to stop changing now.


## Names on a switch, military symbols, dates that can be walked, and a map that can be stripped

### The names, globally and one at a time

"Names on the map" has moved out of the row of style controls to the top of the
panel, where a switch that governs everything below it belongs. Under the Name
field each mark now has its own answer — **Keep this one's name off the map** —
which overrides the global switch in the one direction that is useful. Six
units in a bay with their names in a heap is the case; the reader wants the
other forty named. The pointer still says it, so nothing is lost, only moved.

### An arrow that was stopped

A sixth head, `blocked`: the triangle with a bar across it at right angles,
drawn just beyond the tip so the arrow runs *into* the bar rather than through
it. It is the military sign for an advance that was held, and it follows the
tangent, so a curved arrow's bar sits square to where it arrived.

### Fifteen military symbols

A unit is a box with its branch inside — infantry a saltire, armour an oval,
artillery a dot, cavalry a bar, airborne a canopy, a headquarters its staff —
and the three formation sizes carry their echelon marks above: XX a division,
XXX a corps, XXXX an army. Then a warship, an aircraft, an anchor for a naval
base, crossed blades for a battle, and a bastioned trace for a fortification.
Grouped under four headings in the Shape menu.

Drawn plainly rather than to APP-6's letter. This is a teaching map, and a
shape a student can tell apart at fourteen pixels is worth more here than a
faithful one they cannot.

**Their names had to move down.** A fixed fifteen-pixel drop was right when
every symbol was a dot of about that size and wrong the moment there were
symbols reaching further down than across — an anchor's fluke, a headquarters'
staff, an aeroplane's tail. The name sat over them and its own pale halo, the
thing that makes it readable, rubbed out the bottom of the symbol it was
naming. Each symbol now says how far below the point it goes and the name
clears it.

### Dates, and a way to walk them

Optional **Start** and **End** fields, on a line of their own. They were asked
for beside the Name and there is no width for three fields in a 280px rail, let
alone on a phone; they sit under it instead, side by side while there is room.

They are read leniently: `1937`, `Sept 1931` and `1941-12-08` all parse, and an
absent month or day reads as the earliest it could be. A teaching map is
annotated with all three in the same set, and refusing two to be strict about
the third would only push the reader into typing the date into the name.

When two or more marks carry a start date, a row appears above the tools:
**« ‹ 3/7 1941-12-08 › »**. It steps through them in date order, selecting
each, moving the map to it and opening its card. Fewer than two and it is not
there — a pair of arrows that steps between one thing and itself is furniture.

### Three switches in Layers, for a map to draw on

* **Hide the Japanese occupation map**, a third choice beside the two readings.
  `srcOK` already asked whether a record's source matches the one chosen, so a
  source that matches nothing hides every layer tied to one — the traced zone,
  the NCA areas, the base areas — in a line.
* **Show Manchukuo** and **Show Mengjiang**, both on. Off, they are not
  removed: the land stays and still answers to the pointer, because Manchuria
  did not stop being Manchuria. It takes the neutral this map uses for ground
  it makes no claim about. Mengjiang's dotted claim goes with the state — a
  claim drawn round nothing is a line with no subject.
* **Make the map a single colour.** Every state and province one grey, the
  hatchings off, and the coastlines and frontiers *added* as hairlines —
  without them a single grey is a single grey blob, because on this map the
  fills are what separate one country from the next.

**Three things had to be excluded from it, each found by looking.** The
finger-sized targets over the smallest territories carry `.atom` too and came
out as eighty-three grey discs across the Pacific, each the size of a thumb —
which is the size they are, and the whole reason they are transparent. The
rings that trace a whole country are unclassed paths in the outline layer, so
naming `.edge-line` alone left Thailand teal and China red over grey land. And
`--edge-w` is six pixels on the Thai cessions, which is right in colour — they
are small enough that only a thick ring shows them — and wrong here, because a
6px ring round a small shape *is* the shape: Laos and Cambodia came out as a
block of rgb(189,182,166) against rgb(228,224,214) land. Measured off the
rendered pixels before and after; 1,453 wrong pixels down to 292 of a soft
grey ring.

All four survive a reload and a shared link: `occSource: 'none'` takes a second
bit read before the first, so a link written before it existed still says what
it meant, and the two client states go the same way round as the base areas
because they start on.

`tools/test/mapstrip.js`, 25 checks. `run4` caught the one regression: the new
rows pushed the phone panel from 22% of the screen to 23% while a tool is out,
and they now stand down with the fields, as that rule intends.

The suite is 252 across twelve annotation scripts and five map ones, all
passing.


## An approximate area, distances on a line, a smaller link, and a suite that runs in a minute

### An edge that says "about here"

Areas take a **Sharp / Blurred** choice. Blurred gives the shape a soft edge —
a Gaussian in map units, one filter per line weight so a heavy outline blurs
more than a hairline and the two read as equally uncertain. A hard edge on a
shape drawn from a sentence in a book asserts a frontier the source never had;
this says "about here", which is what the reader meant.

The blur is in **map units**, not screen units: the vagueness belongs to the
ground, so it widens as the reader zooms in, the way an uncertain frontier
should. First cut was `0.7 + w·0.45` and read as a slightly soft line at a
glance — indistinguishable from sharp beside a sharp one, which is the whole
test. `2.4 + w·1.7` is what makes the pair read differently.

### Distances, on the other side of the name

Lines take a **Distances** menu: none, each leg, or the total. Each leg labels
every segment; the total labels the whole, at the point **halfway along the
line** rather than the middle of the box round it — a line that doubles back
has a centroid off the line itself, and a total written there is a number
floating in the sea.

They go on the opposite side of the line from the name, because the name hangs
below the middle of the line and that is exactly where a total wants to be.
Above when there is a name to avoid, below when there is not.

### The link carries less than the file

The advice was to quantise coordinates, drop default style values, and compress
before base64. The third was already done — deflate, then base64url, with the
prefix saying which. The other two are now:

* **Coordinates cut to four decimals.** About 11 m at the equator and less
  further north, far below the accuracy of anything this map is traced from,
  and below a pixel at every zoom it allows. A river imported from a GIS file
  carries fifteen decimals; that is where the length of a link mostly goes.
* **Every property equal to its own default is dropped** — and only those the
  loader puts back. `stroke` is the counter-example and stays: dropped, `adopt`
  would hand the feature a palette colour rather than the black it had.

Measured: a normal teaching set of fourteen marks went **751 → 613** characters,
and `india-rivers` — 63 features, 14,851 points — went **160,528 → 122,972**, a
23% cut. Still far past a link, which the counter already says.

**The file is untouched.** A link is capped at 6,000 characters and a file is
not, so they are not the same document: the file is the archival copy.

*And one wrong value came out of it.* `adopt` wrote `marker-size: 'medium'`
whenever there was none — so a large marker came back through a link labelled
medium, and any foreign file with a weight and no size got the same wrong
label. It is derived from the weight now, which makes the round trip exact:
measured property by property across a link, identical to four decimals.

### The suite: seven minutes to seventy-four seconds

Three things, and none of them was the tests doing work.

* **`run7` waited 150 seconds for a dialog nobody answered.** Its last step
  presses Clear, Clear asks "are you sure?", and `run7` builds its own page
  rather than using `page()` — so it had no `dialog` handler. The `confirm()`
  blocked until the protocol timed out, and a `.catch(() => {})` swallowed the
  error. Eight checks, six seconds of work, two and a half minutes of waiting.
  **156s → 5s.**
* **Every page slept 3,200 ms for a map that is ready in 730.** Measured: atoms
  and first labels 730 ms after the navigation resolves, the annotation panel
  open and wired at 1,014. Thirty-odd page loads were each paying three and a
  half seconds for something that had already happened.
* **The fixtures were charged 1.8 seconds each** for a file read in a fraction
  of that. They wait for the panel to have *said* something now — which is what
  the next line reads anyway. **run2: 91s → 43s.**

A trap that cost one round: folding "and its marks are drawn" into the
readiness wait charges the **damaged-link** cases the full timeout, because
half the point of those cases is that a damaged link draws nothing. `run2` grew
a 26-second pause at exactly the check that says so. The marks are waited for
separately, briefly.

`tools/test/annotations/all.js` runs them four at a time, buffering each
script's output so eleven interleaved streams stay readable, and prints a table
sorted by duration. **252 checks in 73.9 seconds**, against about four minutes
run one after another.

### And the deep-zoom panning question, answered by measurement

`reports/2026.08.25-deep-zoom-panning.md`. Nothing was changed. The short of
it: **panning is not slower when zoomed in — it is cheaper.** Path commands
inside the frame fall from 211,173 at the opening view to 11,855 at sixteen
wheel steps; layout falls with them; the move handler costs 0.1 ms median at
every depth; 60 frames take about 1,000 ms at every depth, which is the
`requestAnimationFrame` interval, at 4× CPU throttling and device pixel ratio
2. No long task fired at any depth. The pan tracks the pointer 1:1 at every
zoom except the opening view, where `clampView` has reached the edge of the map
and it moves 95 px for 200 — if anything feels different, it is that.

The report says plainly what those numbers do not cover: GPU rasterising on a
real machine, Safari's SVG rasteriser, and — new today — a **blurred** polygon,
whose filter is re-evaluated every paint at a cost set by its area in device
pixels. That last one is the only thing on this map that gets dearer the
further in you go, and it is worth knowing before it is reported as a mystery.


## An outside review, verified — and the one bug that mattered

`codex` and `agy` were each given `annotate.js` and asked for bugs, correctness
problems and performance issues. Between them they raised thirty findings. They
were not relayed: each substantive claim was checked, and the serious ones were
checked **by driving the page**, not by reading.

### Confirmed, and fixed

**A press could not reach the map inside a shape already drawn.** `tap()` gave
an existing mark priority over the armed tool, and the reasoning behind that —
"place a point, then adjust it" — is about *handles*, which are a few pixels
across. An area is not. Draw one over China and the whole country stopped
accepting marks: measured, three presses inside an existing polygon with the
Area tool armed produced **no draft and no corners at all**, and the reader saw
their second area simply never appear. This is what "when I draw one area and
start drawing another, the first area disappears" was. A press on a *shape*
with a tool out is now a corner of the next one; handles keep their behaviour,
and with no tool out everything is selectable as before. Measured after: 1 → 2
areas, from inside the first.

**A stranger's link was filed as the reader's own work.** `store()` chose its
key on `shadowed`, which is only set when the reader *already had* something.
A reader with an empty browser who opened a classmate's link had it written
into `jem-annotations-v1` — their own place — and offered back as their own the
next time they came without the link. Confirmed by opening a link in a clean
profile: own-store features **1**. A separate `fromLink` flag decides the key
now; measured after, own-store features **0** and the set under the shared key.

**`geomOK` returned true at the first coordinate that looked right.**
`[[139,35], null]` passed validation, and the drawing code then dereferenced
the null — *after* `feats` had been replaced, so a file that should have been
refused whole had half-loaded. Every position is checked now. One good point is
not a good geometry.

**Cancel on the restore prompt deleted the only copy.** "You have 4 annotations
still in this browser. Bring them back?" — and Cancel removed them, with
nothing on screen to say that is what it meant. Cancel means "not now": they
stay, the prompt says so, and the offer is not made again that session. The
test asserted the old behaviour and has been rewritten to the new contract,
which is the more useful thing to have asserted all along.

### Raised, and not true

* **The blur filter does not break across a projection change.** Claimed as a
  broken cache; measured before and after switching to Albers — the filter is
  present both times.
* **Recolouring does not straighten an arrow bent by dragging.** Claimed to
  reset the curve to zero; measured, −0.44 → −0.45. That is the slider's own
  step quantising a dragged value by one hundredth, which is a real if tiny
  effect and not the one described.
* **The stale-pack race did not reproduce.** The identity check in `prepLink`
  is genuinely weak — it compares array identity while edits mutate in place —
  but driving the case it describes, the link carried the last edit every time.
  Recorded here rather than fixed on a theory.

### And a bug of my own, found by a screenshot rather than by either reviewer

**The arrowhead detached from the shaft when zoomed in.** The shaft is drawn in
map units and its width is in screen pixels — `non-scaling-stroke` — so the
trim, which is derived from the width, was a screen-pixel quantity subtracted
from a length in map units. At the opening view a map unit is about a pixel and
the two are interchangeable, which is why every test passed. Eight wheel steps
in, a map unit is a fraction of a pixel, the trim in units became enormous, and
the shaft was cut back until the head floated well past the end of the line.
Converted through `clientToSvg` now, and capped at a third of the arrow so a
short one with a heavy head cannot be trimmed away. Measured: shaft end to head
centre **2 px** on a bent arrow at that zoom.

### Standing, not acted on

The performance findings are real as descriptions and not as problems at this
scale: every keystroke rebuilds the list and the SVG and serialises the whole
set, and undo keeps up to forty complete copies. That is fine for the forty
marks a teaching set has and would not be for four thousand. The vertex ceiling
is what stands between the two. Worth knowing before somebody loads a shapefile
of every county in China.

Also true and unfixed: polygon holes are filled rather than cut; MultiPolygon
and MultiLineString show handles that cannot be dragged; the dateline is not
normalised anywhere; and `parseWhen` reads "08/12/1941" as 1 January 1941,
because it takes the year and drops two numbers it cannot order. That last one
is mine and is the most likely to bite — it puts a mark in the wrong place in
the walk rather than leaving it out.


## Room for the panel, a map that can be cut back to East Asia, and a better one colour

### The legend folds and stays folded

Pressing Create annotations folds the legend and sets the detail card aside.
The fold was already written — and lasted until the next hover, because the
legend's folded class is written by `buildLegend()` from `state.legend`, so
every `applyState` put it straight back. **The state has to move, not the
class.** `host.makeRoom()` does it from the map's side, and `giveBack()` puts
the legend where it was when the panel closes, unless the reader has decided
for themselves in between. The card goes at the same time: rail, legend and
card share one column, and somebody who has just asked for the drawing tools is
not reading a country's description.

### Hiding the occupation takes the base areas with it

They are the other half of the same argument — where the occupier's writ did
not run — and a map with the resistance shaded and nothing to resist reads as a
claim nobody made. Switched off, not disabled: the switch is still there.

### One colour, three corrections

* **A land grey that is not the sea.** `#e4e0d6` sat at almost the lightness of
  `--ocean`, so the coastline was the only thing separating them and at a
  glance the map was one field of pale. `#ded7c4` is warmer and a step darker —
  still light enough to draw over in any colour.
* **The mandates keep their line and lose their wash.** The wash is a claim
  about who administered the sea between the islands; the line is where the
  boundary was drawn, which is geography of a kind.
* **Every shape gets a line.** The outline was drawn on the whole-country
  fillers and on atoms that have none, which was right for not stroking every
  seam inside a country built out of pieces — and left the pieces of a country
  whose filler exists but is not drawn with no edge at all, running into their
  neighbours. A 0.55 hairline on the atom's own paths, thin enough that a dense
  one does not go grey.

### A map cut back to East Asia

**Show the whole map**, on by default. Off, the frame keeps China and Tibet,
Japan with the Ryūkyūs, Korea, Taiwan and Karafuto, the leased ground on the
China coast — Kwantung, Weihaiwei, Kwangchowan, Hong Kong, Macao — and on the
1942 map Manchukuo, Mengjiang and the occupied zone. Everything else is sea.

**And it was wrong on the first go: China was drawn without its north-west.**
Reported as "your optional view of just east Asia is missing Xinjiang", and
naming `china` alone was the fault — Xinjiang is a territory in its own right
in this file, as are Jehol, Chahar and Suiyuan on the 1930 map, because they
were governed apart and three of the four are what the 1930s in north China
were about. Dongsha and the Paracels went in with them; so did the Bonins and
the Kuriles, which are as much Japan as Kyūshū is and were being dropped from
"Japan"; and so did the contested-frontier hatching, without which Tibet's and
Xinjiang's edges assert lines nobody had settled. The South Seas Mandate stays
out although it is a Japanese colony: it is two thousand miles into the
Pacific, and the point of this frame is East Asia.

*Two departures from the request, both stated.* The switch is labelled for what
it does when it is on, because "Show only Japan, its colonies and China" being
**on** while the whole world is drawn would be a label that lies. And Manchukuo
and Mengjiang are kept although the list did not name them: they are the 1942
form of the same ground, "its colonies" plainly covers them, and dropping them
would leave a hole where Manchuria is, which reads as a fault rather than a
choice.

**Three things had to be hidden that are not the atom.** Measured each time by
looking at the render: the outline rings live in a separate layer and are drawn
from an atom's path, so Indochina's teal ring and Tuva's grey one were still
traced over open sea with the country gone from under them — they carry a
`data-id` now. The filler under each atom and the seam strips beside it left a
ghost of the coastline. And the 1942 perimeter runs out past the Marshalls and
round the Solomons, so with everything under it gone it was a dashed line round
empty sea; it goes with the world.

And it had to be **reversible**: the first version could only hide, so putting
the whole map back left 65 atoms hidden. What this rule hides it marks, so
turning it back on does not also un-hide the administrative-only territories
and whichever reading of the occupation is not showing. Measured after: 1 atom
still hidden on 1930, 3 on 1942, all of them legitimately.

`tools/test/mapstrip.js` is 34 checks now.


## The East Asia frame, finished — and a layer that vanished with it

### A bug: the Army report did not appear

Reported as "I switched to the 1942 army occupation map and it didn't appear",
and it was the East Asia rule doing it. `nca_pacified` and `nca_unpacified`
were not in the list of what that frame keeps, so a reader who had cut the map
back and *then* chose the Army report was shown nothing at all — the layer was
there and this rule was hiding it. They are China; they are in the list now.

**Everything that is not the atom had to go with the atom, and each was found
by looking at the render rather than by reasoning about the code:**

* **The shading.** A hatch is a *copy* of an atom's path in another layer, so
  hiding the atom left the stripes behind, drawn over open sea. Tagged with
  their territory: 13 hatch paths drawn in the East Asia view, now 1 — and that
  one is Mengjiang's claim, which belongs.
* **The names.** The label entries are built once, when the map is coloured, so
  nothing downstream knew the frame had been cut back.
* **The key.** It still listed British, French, Dutch, American, Portuguese,
  Soviet and Thai — seven colours that appeared nowhere on the map.

### The frame fits what is drawn

`activeBounds` measured every atom, drawn or not, so with the Pacific emptied
the frame still reached the Marshalls: **the land came to 61% of the view on a
desktop and 209% on a phone**, which is to say China ran off both sides of a
map the reader had asked to be smaller. Hidden atoms no longer set the edge,
the view is re-fitted when the switch moves, and a portrait screen no longer
crops *again* to the empire on top of a frame the reader has already narrowed —
answering a question they have just answered. Measured after: **94% in all
three projections, on a desktop and on a phone, on both maps.**

Getting the order wrong is easy and I did: the frame is measured from what is
drawn, so the atoms have to be hidden *before* it is worked out, and the cached
frame has to be cleared before `defaultView` is asked for it.

### A hidden client state is the rest of China, not a hole

Manchukuo and Mengjiang switched off now take the Republic's own yellow rather
than a neutral grey, and keep the provinces drawn on that ground in 1942. The
land did not become unclaimed when the reader switched the state off; on this
map's terms it became the rest of China, and a grey slab in the north-east
reads as a fault rather than as a country.

### And the panel

"Show the whole map" was under a heading called *Drawing your own*, which it
has nothing to do with; the two switches that decide what the map covers are
under **What the map covers** now. Three hints came out — the long one
explaining the East Asia frame is one line, the single-colour one is gone, and
the annotations paragraph has moved to the About list, where a reader looking
for what the map can do will actually find it.

`tools/test/mapstrip.js` is 42 checks.


## Dark mode was half-built, the 1942 pair moved to the bar, and Manchukuo got its provinces described

### Dark mode: a palette, not four patches

Reported as "the buttons look black unless moused over", and the cause was
worse than a wrong tint. **The page had no dark palette at all.** `--ink`,
`--panel` and `--bg` were never redefined, so `body` stayed `rgb(244,241,234)`
under `prefers-color-scheme: dark` — and yet four scattered dark blocks *did*
fire. One of them was:

```css
@media (prefers-color-scheme: dark) {
  .ann-row button { background: #1b232b; color: var(--ink); }
}
```

`#1b232b` is near-black and `--ink` was `#23201b`, also near-black. The two
annotation buttons were **black on black until the pointer crossed them**. The
much larger dark block inside `annotate.js` did the same to every tool button,
action button and field: they had all been written *assuming* a dark palette
that was never defined.

So the tokens move now, and the rules follow. The four patches are gone, the
chrome's hard-coded whites read `var(--panel)`, and the zoom controls and the
legend take the panel colour instead of a white tile with a pale `+` on it.

**The map's own colours do not change.** They are the argument — Japan's red,
the Republic's yellow, the occupied salmon — and inverting them to suit a
display preference would be inventing history. The *ocean* is darkened, because
a bright blue field behind a dark page is a lamp, and the neutral land tokens
with it so that a coastline still reads.

Measured: eleven controls, every one at a luminance difference above 130.

### The two 1942 controls in the bar

**Extent line**, and **General | Army report | Hide**, to the right of Other.
They appear on the December 1942 map only — the perimeter and the occupation
are both that date and nothing else — and only at 1120px and up, because the
bar already carries six controls and a title and wraps before it truncates.
Below that the Layers dialog is the way in, where the wording is fuller and
where both remain.

They are the same two settings, not a copy: pressing Army report in the bar
moves the radio in the dialog and draws the layer; choosing Hide in the dialog
moves the bar. Both directions measured.

### And a locked set can be read

A press on a mark did nothing while locked, because `tap()` began `if (!on ||
locked) return false`. But locked is what a reader who followed a link *is* —
the pointer already names a mark and gives its short note, and a press is how
the same reader asks for the description, which never goes on the map at any
setting. It was a set they could see and could not read. Reading works locked
now; editing, dragging and deleting still do not.

*Not reproduced:* "my drawn polygon getting hidden when I click away". Tried
with the tool put away and with it still armed, clicking empty ocean and
clicking a country, probing the pixels under the shape before and after — the
polygon stayed drawn, stored and listed every time. Recorded here rather than
guessed at.

### The Manchukuo provinces, described

All fourteen, and Mengjiang's three while the same gap was open: landscape
first, then what the place lived on, then what happened there between the wars
— the Nonni bridges in November 1931, the railway blown up outside Mukden,
Pingfang on the southern edge of Harbin, the Fengman dam and the labour that
built it, Jehol carried down to the Wall in 1933. Written into `short`, which
is the field the pointer and the card both read, and addressed by key.

### The record itself, audited

Asked to check whether anything had dropped out. Every request from the
morning has its own entry: the projection selection bug, the root cleared into
`stale/`, the graticule, island names by size and then by density, every city's
description in both epochs, India's pan and zoom found on the second attempt,
the two-build comparison script, city names with no dots under them, and the
legend's two-pixel scrollbar. Nothing missing.


## The blur smeared the map, and the rule that stops this happening a fourth time

Reported as a polygon that disappeared and "reappears when I zoom way out",
with a screenshot of a black cloud across Shantung, and: "blurred works on that
first unit but not on the second". Both halves are the same fault, and it is
the fault this project keeps making.

**A filter's `stdDeviation` is in user units.** Left alone it is a fixed number
of *map* units, so its size on screen multiplies with the zoom: at the opening
view it was the 7 pixels intended, and eight wheel steps in it was hundreds.
The shape softened into a cloud, then into nothing, and came back when the
reader zoomed out — which is the signature.

**And the region was wrong in a second way.** Under `filterUnits=
"userSpaceOnUse"` a percentage resolves against the *viewport*, not the shape,
so the filter's rectangle was a fixed patch of the map. A polygon outside it was
clipped and drew with no blur at all. That is the second unit that "didn't
work".

**The first fix was also wrong, and measuring caught it.**
`primitiveUnits="objectBoundingBox"` looks like it makes the deviation
relative. It does not: the fraction resolves against a bounding box that is
itself in user units, so the deviation is still fixed in map units. Eight wheel
steps in, the whole viewport was smeared. The screenshot is what disproved it.

**What it is now.** The region is left bbox-relative, which is the default and
follows the shape wherever it is. The deviation is written in user units and
**rewritten on every zoom**: `rescale()` in `map.js` already computes `k`, the
SVG units per screen pixel, for the constant-size marks, and now hands it to
the annotation module, which rewrites every blur from a size in screen pixels.

Measured: **6.7 screen pixels at viewBox width 2800, 804, 231, 66 and 25.**

### The rule, written down

This is the third time. The arrowhead detached from its shaft for exactly this
reason — a trim derived from a `non-scaling-stroke` width, which is in screen
pixels, subtracted from a length in map units. `CLAUDE.md` now carries the rule
and the three cases, and the point that matters most: **at the opening view a
map unit is about a screen pixel, so the two are interchangeable and every test
passes.** The bug only exists somewhere a test was not looking.

So `run10` measures the blur and the arrowhead at four zooms and asserts both
stay the same size on screen. That check is the guard; the prose is the reason.

### And the polygon that "disappeared" after editing

Not deleted, and not this: nothing was ever removed from the set. The **Area**
tool's "Opacity" slider is the *stroke* opacity, and with fill also turned down
the shape becomes a ghost — then clicking elsewhere takes away the selection
halo that was still making it findable. Measured: two shapes before, two after,
at `fill-opacity 0.1 / stroke-opacity 0.2`. The label is what misled, and the
label is being changed.


## Dark mode retuned, four provinces stop pretending to be countries, and the bar explains itself

* **Suiyuan, Chahar, Jehol and Sinkiang were set in a country's weight.** They
  are territories in this file because they were governed apart, and that made
  them *look* like four more countries beside China. A `sub` column marks a
  division; its name is 11.07px against a country's 13.5 and a shade lighter.
  Measured: four labels carry it, and China does not.
* **The ocean was a step too dark** — `#16303f` to `#1d3d4f`.
* **A pressed layer button was near-white text on a near-white fill.** On a
  light page it is dark ink under pale text; inverted it has to go the other
  way. Both come from one pair of tokens now, so the two cannot drift apart.
* **The radios take the map's own red**, like the checkboxes beside them: a
  green radio next to a red checkbox is two colours doing one job.
* **The feature names** — the Taklamakan is the case — carry a heavier dark
  halo and a lighter fill, because they have to hold over the dark sea *and*
  over the palest yellow on the map.
* **The 1942 perimeter** was a dark red dash on a dark sea; it is a light red
  one in dark mode.
* **General is Max, Army report is Army Report**, and every control in the bar
  now says what it does on hover — including the two date buttons, whose
  tooltips are set where they are built.
* **On an area, "Opacity" is called "Stroke"**, because that is what it is: the
  slider beside it is the fill's. The old name is what "the polygon
  disappeared" was.
* **The drawing tools are withdrawn below 700px**, with a line in Layers saying
  so. They need a panel with room for four tools, eight controls, four fields
  and a list, and a map to draw on beside it; below that the reader is drawing
  through a letterbox.


## A tool that does one thing, handles you can hit, and a copy of what you drew

* **A tool steps back after one shape.** One press arms it, a shape is made,
  and it puts itself away so the next press selects rather than draws. A tool
  that stayed out for ever meant every press after the first was another shape,
  and a reader who wanted to adjust what they had just drawn had to remember to
  put it down first. **Press it again and it sticks** — a shallow inset line
  says which — for the case where six of the same thing are wanted.
* **A handle is bigger than it looks.** Vertices are drawn at about three
  pixels, which is right to look at and much too small to hit, especially where
  two nearly touch. A transparent 11px disc under each gives the pointer
  something to find without changing what is seen.
* **The corners of a shape still being drawn are handles too.** They were plain
  dots with no `data-ann`, so a long press on one panned the map and a corner in
  the wrong place meant cancelling the whole shape. `-1` is the index for "the
  draft", which `drag` now understands.
* **Take hold of an area in the middle and the whole of it moves.** Only with
  no tool armed — with one out, a press on a shape is a corner of the next one,
  which is the rule that lets a second area be drawn inside the first.
* **Duplicate.** The selected mark again, a little to the south-east so the copy
  is not hidden under the original, and moved by the same apparent distance at
  every zoom.

**And a mistake worth recording.** The whole-shape drag read `here` — the
pointer's position in degrees — from a `var` declared thirty lines further
down. `var` hoists the name and not the value, so it was `undefined` and threw
on its first index, twice per drag, silently: the shape simply did not move.
Caught by watching `pageerror` rather than by reading.

### The suite had the old contract written into it

Five scripts placed two marks in a row and assumed the tool stayed out. That is
no longer true, and the tests were asserting the behaviour rather than the
intent — so `suite.js` grew `stickTool` (arm it *and* tell it to stay) and
`dropTool` (put it away), and each case now says which it means. `run9` asserts
the new contract directly: one press arms, a shape steps it back, a second
press makes it stay, a third puts it away.

### Every layer setting, out and back through the URL

Asked for after the term's worth of new switches. `tools/test/layers-url.js`
sets all sixteen to the opposite of their default, packs them, opens the
address in a fresh page and reads every one back. A bit written and not read,
or read at the wrong offset, is otherwise silent: the link opens, the map looks
plausible, and one setting is quietly wrong. All sixteen survive, and a code
written before any of the new bits existed still opens with the three that
start *on* still on — which is why they are stored inverted.

### And the last of the pale buttons

Layers, About and the two annotation buttons still went white on hover in dark
mode: `#f2ede2` is a pale cream that reads as a white slab under a dark
palette. There is no hard-coded hover colour left in `styles.css`, and the six
remaining `#fff` backgrounds in the panel's own stylesheet now read
`var(--panel)`. Measured: seven controls, none of them pale on hover.


## The annotations get their own section in About, and a mask bound that was measured in the wrong space

### About

The annotation paragraph that used to sit in the Layers panel is a section of
its own now, a sentence to each feature: the four tools and how a tool steps
back after one shape, the three kinds of text, the dates and the walk through
them, the styling, the blurred edge, the editing gestures, saving and sharing,
and what a reader who follows a link sees.

### A latent bug in the highlight mask — found while looking for something else

The outline of a hovered or selected shape is drawn through a mask, and the
mask's rectangle was intersected with the **document's** extent:

```js
var mx1 = mapW + pad, my1 = mapH + pad;      // the Mercator drawing's size
mx0 = Math.max(mx0, bb.x0 - pad);
mx1 = Math.min(mx1, bb.x1 + pad);
```

`mapW` and `mapH` are the Mercator drawing's dimensions. In Mercator that
intersection is a no-op — every shape is inside the document by definition —
but the projections move the ground, and a shape whose reprojected box falls
outside `0 … mapW` had its mask cut along a straight line. It is the same
mistake as the blur and the arrowhead in a different currency: **a quantity
measured in one space applied in another.**

The shape's own box already bounds the buffer, which is all the clamp was for,
so it is gone. **It cannot change Mercator, where it never bit.**

**And it is not yet confirmed to be the reported line across Rajputana.** Four
candidates were checked and ruled out by measurement: the reprojection is
densifying that path the same in both projections (5,741 segments either way);
`edgeClip` is only on British India's Burma window and Thailand's, neither of
them Rajputana; the bbox cache *is* invalidated on reprojection, so the mask is
not positioned from stale Mercator coordinates; and British India's own box
stays positive in both Albers and Lambert, so the clamp does not bite for it.
The fix above is right on its own terms and was made on that basis, not on a
claim that it closes the report. The report stays open.


## A box round one mark, and the flake that had been hiding in the suite

### Shift and drag

A box, and the first mark it touches is selected — "first" in drawing order,
and it stops looking the moment it has found something, because the reader
asked for one object and not a heap. The box is dashed while it has found
nothing and solid once it has, so the catch is visible without letting go.

**Shift, not a plain drag.** A plain drag on empty map pans and has to go on
doing so; a map you cannot move is worse than a map you must hold a key to
select on. It is the way to reach a mark that is under something else, or so
thin that pointing at it is a matter of luck.

**And it was swallowed for its first two attempts by a branch nobody was
thinking about.** `onPointerDown` already had a shift-drag: the admin
marquee, which `return`s. Mine was asked afterwards and so was never asked at
all — the shift-drag panned, and the pointer-up then selected whatever it had
landed on, which looked enough like working to be confusing. The annotation
box is asked first now. The two never both apply: the marquee belongs to
`admin.js`, which is reached by option-clicking Layers and which a reader never
loads.

*And a bad test caught a good behaviour.* The first version of the check dragged
from a point that had a shape under it, so the drag moved the shape instead of
panning — which is exactly right, and two sections earlier in the same file.
It looks for empty map now.

### The flake, found

One check in `run2` had been failing about one parallel run in three and
passing every time it was run alone: *"too much for a link says so with the
number"*. It pressed Copy link on the 63-feature, 14,851-point river file and
then slept 2.5 seconds. Packing that takes as long as it takes, and with four
browsers sharing the machine it took longer.

It waits for the counter now rather than for a number of milliseconds — the
same fix as the load waits, and the same reason: **the thing to wait for is the
thing the next line reads.** Three parallel runs, 270 checks, all passing.


## The cracks between provinces, closed without touching a single traced shape

Reported as breaks showing between the provinces of Siam, China, the
Philippines, Japan and Korea with Administrative switched **off**, and asked for
as merged `[country]-whole` polygons.

**No merge was needed, and the whole-country polygons already exist.** Each of
these countries has a filler under its atom — a single polygon, and its class in
the drawing is literally `whole`. The naming asked for is already the
convention.

### What the cracks actually were

Once the administrative file is fetched, a country's divisions are grafted into
its atom and stay there — seventy of them for Siam — and they stay *drawn* even
when the layer is switched off. Their stroke is `none`, so what shows is not a
boundary at all: it is the antialiasing seam where two abutting fills meet, a
pale hairline along every shared edge. In dark mode it reads as a crack.

Filling those seams is exactly what the filler beneath is for. But a filler is
marked **redundant** once its atom has divisions of its own, and
`#jmap.backs-off #backings path.redundant { display: none }` hid it — *at the
moment the divisions arrived*. The one thing that would have covered the seams
was switched off by the arrival of the thing that caused them.

The rule now reads `#jmap.backs-off.admin-on …`: the filler stands down only
while the divisions are actually on show. One line, no geometry.

### The version I tried first, and why it is not the one that shipped

The obvious reading was to hide the divisions when the layer is off and let the
filler draw alone. It looks right — Siam comes up as one clean polygon — and it
**breaks hit-testing**: the division paths *are* the country's targets. A press
inside Siam fell through to whatever was behind it, and `run.js` started
reporting the place under a new point as the Soviet Union.

Giving the filler `pointer-events: auto` did not rescue it either; a filler
lives in `#backings`, not in the atom, so the pointer path does not find a
territory through it. That would have needed a change in `pick`, and a
hit-testing change is not worth making for a cosmetic seam.

**Confirmed as mine before diagnosing it**: the check was stashed against the
previous `styles.css` and passed, which is the difference between "my change
broke this" and "this was already broken".

Keeping the divisions and restoring the filler *beneath* them gets both — the
seams are filled from below, and every target is where it was. Measured: 70
paths still in the atom and still hit-testable, no visible seam, and the whole
suite green.


## The straight line across Rajputana: a Mercator rectangle clipping in another space

Found, and it is the third member of the family the blur and the arrowhead
belong to — **a quantity worked out in one space and used in another.**

`drawEdge` restricts some territories' edge lines to a window given in longitude
and latitude: British India's line is held off Burma by `edgeClip = 92 20.6 97.4
28.4`. The rectangle is made by projecting two corners — and it was made **once**
and kept:

```js
var id = 'edge-clip-' + t.id;
if (!hiDefs.querySelector('#' + id)) { … project(b[0], b[1]) … }
```

Switch to an equal-area projection and that Mercator rectangle goes on clipping
in a space where it means something else. The window meant for Burma landed
across Rajputana, and the stroke it kept there is the straight line — dark,
running north-east to south-west across the princely states, in Albers and
Lambert and never in Mercator.

The clip is keyed by projection now and refitted whenever the document is
reprojected, because the colouring pass that used to build it does not run
again on a projection change. Measured: Mercator's window at x 520 w 108,
Lambert's at x 553 w 119 — a different rectangle, as it must be.

**It cannot change Mercator**, where the original rectangle was already right.

### What it took to find, and what that says

Four earlier candidates were ruled out by measurement — densification, the
bbox cache, the mask bounds, and the source geometry, which parses as clean
`M`/`L`/`Z` with nothing dropped. What settled it was **the reader's Mercator
screenshot of the same view**: identical data, an irregular frontier in one
projection and a dead-straight line in the other. Two screenshots did what four
rounds of reasoning had not.

Two mistakes of mine on the way, both worth keeping:

* I compared the view against itself. `layers=1f23` **already encodes Lambert**
  — bits 15–16 decode to projection 2 — so the run labelled "mercator" was
  Lambert too, and reported the geometry as identical, which it was.
* I twice screenshotted an unhighlighted map and read nothing into it. The
  province is only drawn pale while it is hovered, and a synthetic hover at the
  wrong zoom does not select it. An absent effect in a shot that could not have
  shown it is not evidence.

`tools/test/projclip.js`, 8 checks: each projection builds a window of its own,
the edge line uses that one rather than Mercator's, and the rectangle is not
Mercator's in a new coat.

## The names were moved and then drawn where they had been, and five other things an outside review found

`codex` was given `map.js` and asked for faults, inefficiencies and redundancy.
`agy` was asked the same and returned nothing — headless mode auto-denied a tool
it needed — so this was one reviewer, not two, and none of the "both agreed"
weight applies. Fifteen findings. Nine were real, one was a documented
trade-off, five were true and trivial. The verification, the measurements and a
correction to one of my own claims are in
`reports/2026.08.25-mapjs-review.md`; what follows is what changed.

### The nudge went into a variable and never onto the label

`placeLabels` moves a colliding name through ten offsets until one is free, then
reserves that box. It never moved the name. The offset went into local `x`, `y`
and into `box`, and the label's position comes from the `transform` `rescale()`
writes on its `scalables` entry, which nothing touched. So the map wrote the
name in the collision it had just found **and** blocked a third name from the
empty space it had claimed.

Caught in one frame: Karafuto drawn at top −32, its box recorded at top +5, the
nudge +37.26. Nine nudges fired in ten wheel steps from the opening view, up to
100 px. Nepal, Sikkim and Bhutan — the three the comment in `map.js` is written
about — had never worked.

Fixed by making `placeScalable()` the single place a scalable's transform is
written, and having `placeLabels` put the offset in `sc.nx`/`sc.ny`. **In screen
pixels**, because the `translate` after `scale(k)` is a screen-pixel space —
which is the same map-units-versus-pixels distinction as the blur and the
arrowhead, and the reason `placeScalable` carries a comment saying so.

### And the width it was placing against was a guess

Once the nudge worked, names still touched. `estimateWidth` counts 0.56 em for a
Latin letter and these are set bold: measured over the 51 names on the opening
view it is short by 11% in the middle and by 41% for "Guam". The placer believed
it, reserved a box narrower than the word, and let two names that genuinely
fought sit side by side.

`gateLabels` now reads the real width with `getComputedTextLength`, and does it
in a second pass after all the writing — interleaved, each read would force a
fresh layout, which with the administrative sheet in is thirteen hundred of
them. Measured: no change in cost, 0.6–2.7 ms shallow and 2.7–3.9 ms over the
Solomons, the same as before either way.

Overlapping names at the opening view and through six wheel steps: **18, 8, 2 →
0, 0, 0**, with the same number of names on screen. One name fewer fits at level
3 now, which is what an honest box costs.

### Leaving a fine-coastline window left its names behind

`dropFine` took out the islands and not their labels. `gateLabels` hides a label
whose shape has gone, which looks like enough; the entry stayed in `labels`,
`subLabels` and `scalables`, and the `<text>` stayed in the document. Coming
back imported the rings afresh, so the `WeakSet` had never seen them and built a
second complete set.

Measured, names on, between the Ryukyus and the Solomons: **909 labels → 4,305
over four round trips**, +802 each time, none of it given back, with
`placeLabels` walking the pile on every frame of every pan (0.26 → 1.12 ms).
Zooming in and out of the *same* window does not leak — the view has to leave
the region.

`dropLabelsFor()` now goes with the window, and only for the shapes that window
is taking out. Not "every label whose owner is detached", which would also catch
the province set held out of the document by `setProvinceSource` — those come
back, and dropping their labels would leave them nameless for good, because the
WeakSet would still recognise the elements. After: flat at 1,211 and 1,785
across four round trips, and the islands still named on return.

### A pan and a zoom in one frame lost the zoom, permanently

`applyView` captured `zoomed` in the closure it handed to
`requestAnimationFrame`. A second call before the frame ran updated `lastScaleW`
but could not upgrade the pending callback, so `rescale()` was skipped — and
because `lastScaleW` had moved, every later pan agreed there was nothing to do.

```
baseline                      wanted k 2.6415   drawn scale(2.6415)
after a pan + wheel, one frame wanted k 1.6345   drawn scale(2.6415)   62% oversize
after a further pan            wanted k 1.6345   drawn scale(2.6415)   not repaired
```

`rafZoomed` is a module-level flag now, set by any call and cleared by the frame
that runs. After: 1.6345 against 1.6345, and still right after a further pan.

### China was carrying both province sheets at once

A link with bit 128 — the Republic's own provinces, whose switch came out of the
Layers panel when the period sheet was redrawn — put **42 provinces inside
China's atom where there are 21**, on four loads out of four. Two causes, and
the second is the one that would have been missed:

* the administrative graft appended its own provinces whatever the reader had
  asked for; and
* **China's provinces are in the base map file, not the administrative sheet**,
  so they were never in `provSets` and the swap had nothing to take out. Fixing
  only the first would have left the fault exactly where it was.

The swap now also takes out whatever the atom is already carrying and remembers
it under the source it belongs to, so it goes back on the way back. Not the fine
coastline, which wears `data-prov` too and whose lifetime `graftFine` owns.

And the Republic's sheet was drawn in Mercator whatever projection was on, since
a set held out of the document is invisible to `reprojectDocument`. In Albers,
ROC Gansu at x 548 where the other sheet has it at x 786. `reprojectGraft` is
called on insert now, and it can put nodes *back* into Mercator as well as out
of it — a set that spent a projection change detached still carries the old
coordinates. Round-tripped three times in each projection: 21 provinces every
time, right source, right place.

Also on that path: a failed ROC fetch could never be retried (the caller only
started one from `none`, and the catch set `failed`), and the swap left
`lastProv` pointing at a detached node, so the card could go on naming a
province that was no longer on the map.

### The smaller ones

* **The outline stayed up when the annotation tools opened.** `makeRoom` cleared
  `selected` and closed the card without redrawing, so the expensive masked
  outline stood there with nothing selected. Same in `card()`.
* **A projection change did not rebuild the outline either**, and `applyState`
  bumping the generation only marks it stale. I reported this as clipping 695
  units off the Soviet Union; that number was wrong — I had compared the mask
  against the whole atom's bounding box rather than the shapes the outline is
  built from. Screenshotting select-then-switch against switch-then-select over
  eight territories found no visible difference at all, before the fix or after.
  Fixed anyway, and the fix is pixel-neutral.
* **A failed fine-coastline fetch was retried on every settled pan.** `failed`
  was documented and never used — the catch put it back to `none`, and
  `syncFine` runs on every settle, so an offline reader at deep zoom asked for a
  2 MB file every time they moved. One attempt every 30 seconds now, which is
  neither that nor "failed forever".
* **A hand-edited link could ask for level 4.** Two bits decode to 1–4 and
  everything else allows 1–3; clamped.
* **The standalone build had no error boundary.** The fetched path ends
  `.catch(showLoadError)`; the inline path did not, and `init` dereferenced
  `viewBox` and `#proj` unchecked. Both fixed.
* **Dead code confirmed and removed**: `terrLabelByEl`, written and never read;
  `lastDouble`, declared and never touched; and a `Object.keys(elById)` loop
  whose body could only `return` from its own callback.

### What was measured afterwards

Two new scripts: `tools/test/labels.js` (19 checks — the nudge, the leak's two
guards, the coalesced frame) and `tools/test/provsource.js` (9 — one sheet at a
time, in the projection that is on). Both were run against the code as it was
before: five failures and four. The whole suite is 270 annotation checks and 136
map checks, all passing, and the touch path was driven separately — tap, second
tap, the outline going with the card, and a two-finger pinch leaving the markers
at the right screen scale.

Fourteen map states were screenshotted before and after. Twelve are
byte-identical. The two that differ are "level 3 with names" and "1942 with
everything on", which is the label fix and is the point of it: Nepal/Sikkim/
Bhutan, Kwantung/Chōsen/Weihaiwei, Macao/Hong Kong/Guangzhouwan, North
Borneo/Brunei/Sarawak and Nauru/Gilbert & Ellice all legible where they were
printed over each other, and Běijīng, Shěnyáng, Lǚshùn, Nánjīng, Shànghǎi,
Nagasaki and Hiroshima placed on the 1942 map where they had been a smear.

Left alone: the whole fine file is still parsed and kept — the comment above it
argues for that, and the saving that was wanted was in what is drawn — and
`placeLabels` is still a full-inventory pass per frame, which is worth its own
look now that the inventory no longer grows.

## Taiwan stops being a modern coastline: the 1926 sheet, dissolved and divided

Taiwan was the last big place on the map drawn from Natural Earth's
present-day outline, with no boundary of any kind inside it. The export script
beside it said so and apologised. It is now a period source: Academia Sinica's
《日治時期臺灣行政區域沿革》 郡(市)界 for July 1926, reprojected by the author
from TWD67 to TWD97, and turned into map geometry by
`tools/fetch_taiwan_1926.py`.

### The coastline is the districts, added up

The sheet is 54 polygons that tile the island. Checked before anything was
built: 79,634 directed edges, of which 31,488 are shared pairs and 16,658 are
walked once. That is a clean partition, so the coast is exactly the unpaired
edges chained head to tail — no unioning library, no snapping tolerance, no
vertex moved. The chaining is done in the sheet's own projected coordinates,
where shared vertices are bit-identical; only the result is turned into
lon/lat, because doing it the other way round puts a float conversion between
two numbers that have to match.

It comes out at 20 rings and 16,658 vertices, and the areas identify
themselves: 35,758 km² for the main island (against 35,808 published), 46.5 for
Orchid Island, 15.1 for Green Island, 6.7 for Little Liuqiu, 2.8 for Guishan.
Drawn over Natural Earth's Taiwan the two agree everywhere except where you
would expect a century of reclamation — Takao, Taichū, and the lagoon coast of
Chiayi and Yunlin, where the modern shore is well out to sea of the 1926 one.

Thinned into the map at `TRACED_TOL` 0.021 units — about 107 m, half a pixel at
the deepest zoom — the main island keeps 1,131 of 15,230 vertices, 7.4%. The
size band it would otherwise have been given, 0.55 units, is three kilometres,
which would have flattened the Kōshun peninsula and the east-coast cliffs back
into the shapes Natural Earth had.

### What the sheet does not have, and what was not invented to fill it

Four of the 54 polygons carry no name, and two of them are large:

* **The central range and the east coast**, 19,089 km² — more than half the
  island. In 1926 that was 蕃地 together with Karenkō-chō and the mainland of
  Taitō-chō, none of which was cut into 郡 at all, so the sheet is right to
  have no name for it.
* **An 800 km² block of the south-western coastal plain**, which swallows
  Takao, Hōzan and Okayama while small fragments labelled 岡山郡 and 鳳山郡 sit
  inland of them. Takao had been a city since 1924; the sheet has no 高雄市 and
  no 基隆市 either, and Kīrun's ground is a hole inside Kīrun-gun. That is a
  gap in the source, not a misreading of it.

Both are drawn in the colony's colour and answer as Taiwan. Neither is named.
Okayama-gun's and Hōzan-gun's own cards say they are drawn short of the ground
they governed, and `sources.md` says the same at more length. Naming them would
have meant either inventing a unit the sheet does not have or repairing an
attribution by guesswork.

### Forty-nine districts, and the readings that are not guessable

Every 郡, 市 and 支廳 the sheet names is a sub-unit with its own card:
`Kagi-gun (Chiayi)`, with 嘉義郡 (Kagi-gun) beneath it, the prefecture it
belonged to in its first sentence, and a link to that prefecture's article
rather than to the district's — the eight 州廳 are the level a reader can
follow up, and most districts have no article anywhere.

**Ten of the readings in the first pass were wrong**, and none of them was
wrong in a way reading the kanji would catch. 大湖 is Taiko and 大溪 is Daikei,
which is the opposite of what the voicing rule suggests. 竹山 is Takeyama, not
Chikuzan. 新豐 is Niitoyo, not Shinpō. 文山 is Bunzan, 新莊 Shinshō, 蘇澳 Suō,
北港 Hokukō, 曾文 Sobun, 新營 Shin'ei. All fifty were then checked against the
breakdown tables in the Wikipedia articles for the five 州 and the 廳, which is
where the colonial readings actually live, and Takao-shū's seven came back
matching. 大甲 (Taikō) and 大湖 (Taiko) differ only by a macron, so their keys
are `TwTaikou` and `TwTaiko`.

### Two things this broke, and the fixes

**The Pescadores disappeared when Administrative went on.** They are the one
part of the colony the sheet does not cover, so they still come from Natural
Earth, and they were only in the filler underneath the atom. The filler is
stood down the moment an atom has divisions of its own — so with the layer off
they were drawn, and with it on they vanished. They are a named sub-unit now,
which is also what they were: Hōko-chō, taken back out of Takao-shū in 1926 and
made a chō again, and not divided into 郡.

**Taichū-shi and Hōzan-gun fell through the minimum-area sieve.** Both are
about 20 km², under the floor a country's provinces are given, and the colony's
third city was being dropped silently. `sub_min_area` now gives Taiwan 0.04.

**And a card with nothing in it.** A sub-unit's `short` line was going to the
tooltip and nowhere else, so a district with no long note opened a card with a
name, a kanji line and a link and no sentence at all. The card falls back to it
now, which is why every one of the forty-nine says which prefecture it was in.

### Measured after

49 districts drawn out of 49 named in the sheet, plus Hōko-chō. Cards checked
by clicking eight of them across the island. 22 rings in the atom, 31.4 KB. The
whole map suite — 136 checks — and the 270 annotation checks pass. Natural
Earth now contributes nothing to Taiwan but the Pescadores: the main island,
Orchid Island, Green Island and an 18 km² sandbar off Chiayi that the 1926
sheet does not have are all dropped, the sandbar being a bank that has moved
kilometres within living memory and had no business beside a 1926 shore.

## A clock on the map: the marks come and go, and the map stays where it is

The date walk that went in earlier stepped from one dated mark to the next and
flew the map to each. That is a way of *inspecting* a set. It is not a way of
showing one, which is what a class needs: the thing a sequence of maps does is
hold the ground still and let the shapes change over it.

So the walk is gone and a clock has taken its place.

### What a stage is

Every start date and every end date in the set, deduplicated and sorted.
Nothing is interpolated and no stage is invented — three marks starting in 1931
and one ending in 1933 make two stages, not three years' worth. At a stage, a
mark is drawn if its start has come and its end has not passed.

**A mark with no dates at all is always drawn.** It is the coastline of the
argument — the frontier the arrows are about, the line the reader put in first
— and hiding it would leave a class watching arrows over open sea.

The date is written to the precision it was given. `1931-09-18` reads as
"18 September 1931" and `1937` reads as "1937", not "1 January 1937", which
would be a precision nobody claimed. Which mark contributed the date decides
that, so a stage that two marks share takes the more precise of the two.

### Where it is, and why there

On the map, immediately left of the **+** button, and not in the annotation
panel. It is a control for *reading* a set rather than editing one: somebody
who followed a shared link has the marks and not the tools, and this is the one
control they are meant to have. It is hidden until there are two dates, because
a pair of arrows that steps between one thing and itself is furniture.

`‹` and `›` step. `▶` plays at two seconds a stage, from the beginning, and
stops at the end rather than looping — a loop makes a reader wait to find out
whether what they are looking at is the beginning or the end. Pressing it again
pauses where it is. `×` shows every mark again and only appears once a stage has
been chosen.

On a screen under 700px the clock moves to the foot of the map, where a 44-pixel
zoom stack and the header leave it no room in the corner.

### Nothing moves

A step redraws and does nothing else: no flying, no zooming, no selection.
Checked both ways — mouse and finger — by reading the `viewBox` before and
after three steps and comparing the strings.

### Measured

`tools/test/annotations/run12.js`, 25 checks, in the parallel runner. Four
marks and four dates: 8 shapes drawn with the clock off, 6 at 18 September
1931, 7 at July 1937, 8 at October 1938, and the undated line present at every
one of them. Play checked against the clock — still on stage 1 after 1.2
seconds, on stage 2 after 2.5 — and pause checked by waiting 2.4 seconds and
finding it where it was left. The whole suite is 295 annotation checks and 136
map checks.

## The tests stop leaving pictures in the repository root

Thirteen PNGs were lying in the top of the working tree. Six of them —
`barx.png`, `east.png`, `w-on.png`, `w-off.png`, `w-back-off.png`, `w3.png` —
were **committed**, from scratch scripts that no longer exist and that nothing
references. The other seven were the test suite's own screenshots, ignored
individually by name in `.gitignore`.

Naming them one at a time is why the six got in: anything a new test drew was
untracked and visible until somebody remembered to add a line, and the easy
mistake is `git add -A`. So the cause is fixed rather than the symptom.
`suite.js` has a `shot(name)` that makes `tools/test/shots/` on demand and
returns a path inside it, the four scripts that take pictures use it — run6 and
run10 had not been importing the suite at all — and `.gitignore` ignores the
one folder. The old per-file patterns stay, and `/w-*.png`, `/barx.png` and
`/east.png` join them, so a checkout that still has the debris lying about does
not offer it up.

The six tracked files are removed. `occupation-maps/*.png` are untouched: those
are the source maps the occupied zone was traced from and belong in the history.

Checked by running the full suite and looking: 295 checks pass, no PNG in the
root, seven in `tools/test/shots/`, and `git status` clean apart from the
change itself.

## Auditing the annotations: two ways to lose a reader's work, and one clock reading dates backwards

A thorough pass over `annotate.js` — my own driving of it, plus independent
reviews from `codex` (21 findings) and `agy` (12) with a context block saying
what the feature is for. The verified write-up is
`reports/2026.08.26-annotation-audit.md`; the raw reviews are beside it.

### Undo after a rename destroyed the set

A title, description or date edit took **no snapshot**. So Undo did not merely
fail to undo the rename — it reached past it and consumed whichever structural
snapshot was underneath. Measured:

    load two marks    ->  ['first', 'second']
    rename the first  ->  ['first RENAMED', 'second']
    Undo              ->  []
    Undo              ->  "Nothing left to undo."

The snapshot it found was the state before the load, and there is no redo. Two
presses, no warning, everything gone. Both reviewers found it independently.

The fix snapshots in `fieldChanged` and `styleChanged`, but **once per burst of
typing** — per keystroke would mean forty presses of Undo to get back through a
sentence, and a forty-deep stack holding one field. The first change in a burst
takes the snapshot, the rest ride on it, and the burst ends after 900 ms of
quiet or when the selection moves.

### "Unsaved" was asking a different question

`changed()` defined it as `feats.length > 0`. That is true the moment anything
is drawn and false again when the last mark is deleted, and it has nothing to
do with whether the set differs from the file. So an edit after saving left the
page willing to close without a word.

Worth recording how the fix went wrong first: setting the flag in `changed()`
did nothing, because `fieldChanged` and `styleChanged` do their own drawing and
never call it. The test caught that, which is the argument for writing the test
before believing the fix.

### The clock read an end date as the first of January

Mine, from the day before. `parseWhen` filled a missing month and day with 1
for starts and ends alike, so **start 1931, end 1931** vanished the moment the
clock reached September 1931, and **start 1931-05-01, end 1931** was never
visible at all — its end four months before its start. An end date now rounds
up to the end of whatever precision was written, with a real leap-year rule.

That exposed a second wart: a mark running through 1931 puts 1 January and 31
December into the stage list, so the reader stepped from "1931" to "1931". A
stage nothing starts at now reads "end of 1931".

And the clock was accidentally quadratic — `inScope()` called `stages()`, which
walks and sorts every feature, and `redraw()` calls `inScope()` per feature. The
stage date is worked out once per redraw now.

### Four reported faults that are not there

Driven in a browser and recorded so nobody looks again. **"Back to my
annotations then Undo overwrites the reader's own set"** was codex's top
finding and agy's second — the place they agreed most emphatically — and the
reader's own work was in storage throughout and intact after a reload.
**"Work added on top of a shared link is lost on reload"**, **"right-clicking
an arrow's bend handle deletes the arrow"** and **"a quick tap arms a drag that
teleports the mark"** did not happen either; the last was checked against the
saved coordinates rather than the screen position, because a pan moves
everything.

### And the small screens

"Annotation features are not supported on small screens" was not true — the
panel docks to the foot of a phone, every tool works with a finger, and the
suite tests exactly that. The buttons were nonetheless being removed below
700px. They are offered at every width now, with one sentence saying a desktop
is easier.

### Why agy came back empty last time

I had reported that headless agy could not open the file. That was the wrong
explanation: the skill already hands it the file inline. What happens is that
the prompt *invites* it to go and look — "review this file: annotate.js", cite
line numbers — and once in a while it takes the invitation, and in headless
mode any tool it asks for is auto-denied and it then produces nothing. It is
nondeterministic, which is why it worked today. Ruled out by testing: the same
163 KB inline works, the full rules on a small file work, and running from the
directory that holds the file works.

`ask-friends.sh` now tells agy it has no tools and needs none, gives it
`/dev/null` on stdin as codex already had, retries once if the permission
complaint comes back, and — the part that actually mattered — **says so in the
output file** when the result is too short to be a review. The cost last time
was not the missing review; it was that a one-reviewer round could be written
up as though two had agreed.

### Measured

`tools/test/annotations/run13.js`, 13 checks over the three work-loss fixes,
all failing on the code as it was. Round trip checked separately and clean: a
polygon with a hole, a MultiLineString, a dateline-crossing line, a point at
nine decimal places and a GeometryCollection all came back with their geometry
type, titles and coordinates intact. Scale checked: 500 marks load in 75 ms and
a keystroke costs 10 ms. Suite: 308 annotation checks and 136 map checks.

What is real and still open is listed at the end of the report — a file load
replacing unsaved work without asking, storage failures being swallowed,
unfinished drafts discarded without confirmation, and polygon holes drawn
filled rather than cut.

## A Text tool, a ? of its own, fifteen steps, and the review's own findings acted on

Nine things at once, so the short version first: a new annotation tool, four
pieces of interface work, and the reasonable half of what the outside review
found last time.

### The Text tool

A note on the map: drag out a box, and the **Description** fills it with the
**Name** as a bold heading above. With no name there is no heading and no gap
where one would be — the description starts at the top.

It is stored as an ordinary Polygon with `jem-kind: text`, so a reader who
opens the file in QGIS gets the rectangle, which is where the words are and so
is the right failure. Three colours (text, box, border) and four font sizes,
because a note that can be set at headline size stops being a note.

**Scales is the whole of the design.** A box can mean two different things and
the reader has to be able to say which:

* **off** (the default) — constant size on screen, anchored by its top-left
  corner. A caption *about* the map, readable at every zoom.
* **on** — drawn from its rectangle in degrees, so it covers the same ground
  however far in you go and its text grows with it. A label *on* the map, for
  when the note belongs to an area.

Off is the default because a note that shrinks to nothing two turns of the
wheel out is a note nobody can read, and that is the surprising failure.

The first version got the off case wrong in exactly the way CLAUDE.md warns
about: it computed a width in map units that came to the right number of screen
pixels *at the zoom it was written at*, and a redraw does not happen on every
zoom, so the box grew from 180 px to 627 px over three wheel steps. It rides
the map's own `scalables` mechanism now — a group at the anchor with `scale(k)`
rewritten by `rescale()` — which is the same trick the city dots use. Measured
before and after across three wheel steps, which is the only way to tell the
two modes apart.

### Fifteen steps, and the reader is told which one

Weight, Stroke and Fill were three different scales — 0 to 16, 10 to 100 in
fives, 0 to 100 in fives — with no answer to "how heavy is heavy?" beside a
number in pixels. All three are 1 to 15 now. What the slider carries is the
*step*; a table turns it into the stroke width or opacity that goes in the
file, so nothing about the format changes and a width read out of somebody
else's file becomes the nearest step rather than being rounded in place.

The tables are deliberately not linear: weight matters at the thin end, where 1
and 2 and 3 are visibly different, and not at the top, where 14 and 16 are not.
While a slider is moving, the step shows over the thumb — `12 / 15` — and fades
a moment after it stops. Permanently beside the slider it would be clutter in a
280px rail; absent, the slider is a guess.

### Smooth

Lines and areas can have their corners rounded off, in four degrees. A
Catmull-Rom spline written as cubic Béziers, and **through** the points, not
near them: the vertices the reader placed stay on the line and dragging one
still moves the line to it. Only the pieces between bend. That matters for a
shape traced off a map, where smoothing that pulled the line away from the
corners would be quietly editing somebody's tracing.

### The interface work

* **Create and Load in the bar**, on screens wide enough, with tooltips. They
  are what a teacher reaches for first and they lived two presses deep in the
  Layers dialog. The dialog keeps its pair — a narrow bar has no room, and
  somebody who has learned where they are should still find them there.
* **A ? beside About**, at every width, holding *How to use it* and *Drawing
  your own annotations*, carved out of About into `texts/pages/help.md`. About
  is what the map is and where it came from; a reader wanting to know which
  button draws a line should not scroll past the provenance to find out.
* **The Administrative button already had a tooltip.** What did not: Explore,
  Quiz, +, −, Basic, Intermediate and Advanced. All seven now do.
* **The name field was losing its right-hand border** under the rail's overlay
  scrollbar. Six pixels narrower.
* **A point is called "point"**, not named for the ground under it. Naming it
  after the nearest place was meant to save typing and did the opposite: a
  reader wanting "8th Route Army HQ" had to clear "Yan'an" out first, and one
  wanting no name at all got a place name they never asked for written across
  the map. The place is still said in the message, which is where it helps.
* A text box no longer gets its name written over the middle of itself as well
  as in its own heading.

### And the review's findings, where they were reasonable

* **A backup that failed in silence now says so.** Every `localStorage`
  exception was swallowed — private browsing, a full quota — and this is the
  only automatic copy of a reader's work. Once per session, not per keystroke.
* **A load that replaces unsaved work says what it replaced.** A modal was
  tried first and is the wrong instrument: the old set is already snapshotted,
  so the load is undoable, and asking before every load punishes the ordinary
  case to guard a rare one. What was missing was notice, not permission —
  "This replaced 5 unsaved marks — Undo brings them back."
* **An unfinished trace is kept rather than thrown away.** Twenty corners round
  a coast, a stray press on another tool, and it was gone with no undo. A
  question was tried here too and is also wrong: it stops the reader to ask
  about something they can simply be given. If the draft is already a shape it
  is finished as one, which is undoable and deletable in a press.

### What the tests caught, and one that had been lying

Three assertions encoded contracts I had deliberately changed — four tools not
five, a point named for its ground, a weight slider whose `max` was 16 — and
were updated with the reasoning written into them.

The interesting one was not a failure at all. `openPanel` in `suite.js` waited
for `.ann-tool` count `=== 4`. Adding a fifth tool meant it waited the full
twenty seconds on every page and then carried on regardless — five pages a
script, a hundred seconds a script, **and every check still passed**, so
nothing said why the suite had gone from 80 seconds to 151. It is `>= 4` now.
The other half of that was `beforeunload`: unsaved work warns properly now, and
the suite's dialog handler was dismissing those, which means "stay on the
page", so any script that navigated after drawing sat there until the protocol
gave up. `beforeunload` is always accepted now; `opts.accept` still governs the
confirms the panel asks.

### Measured

`tools/test/annotations/run14.js`, 22 checks over the text box, the sliders and
Smooth. Suite: **330 annotation checks across 14 scripts in 80 seconds**, and
136 map checks. All passing.

## Taiwan's two levels: a district points at its prefecture, and only prefectures are written

Two requests about the 1926 sheet, and they turn out to be the same fact stated
twice: a 郡 or a 市 is inside a 州 or a 廳, and the map did not know it.

### Pointing at a district

Hovering Kagi-gun outlined Kagi-gun faintly and the whole of Taiwan strongly,
which answers neither question a reader is actually asking. It now draws both
levels: the **prefecture** as the main outline and the **district** picked out
more lightly inside it. Measured on the built map — the island is 51 units
wide, the prefecture outline 14, the district 9, and the district's box sits
inside the prefecture's.

The card and the tooltip are unchanged: they still name the district, with the
prefecture in the first line of its description, as they did before.

### Writing the names

With Other on, the names layer wanted to write fifty district names across an
island fifty pixels wide at the opening view. That is not a map, it is a
smudge — and the placer would have dropped most of them anyway and kept an
arbitrary handful, which is worse than dropping them all. Seven prefecture
names go on instead, each in the middle of the ground its districts cover, and
not one district name is written. Taiwan's own name stays.

### One attribute, and what it is not

Both come off `data-parent`, written onto every district at build time from the
districts file, which already carried the 州廳 for the card. Fifty of fifty
carry it, coming to seven prefectures — seven and not eight, because Karenkō-chō
has no districts in this sheet at all and so has no shapes to hang a name on.

**It is deliberately not a cluster.** A cluster is a scattered polity whose
pieces sit inside other people's atoms and which *replaces* the territory when
one of its pieces is pointed at — the Straits Settlements, and Labuan inside
the North Borneo atom. That machinery carries `CLUSTER_HOME` and `foreignSub`
with it and would have changed what the card is headed. This is a plain
hierarchy inside one country, and it *adds* an outline rather than replacing
anything, so it is its own attribute and its own three lines in
`redrawHighlight`.

The eight prefectures are now records in their own right in
`texts/territories/sub-units/taiwan.csv`, each with the article the reader
asked for, so the name written on the map is a thing the map knows about rather
than a string lifted off a district.

### Measured

`tools/test/taiwan.js`, 12 checks: every district carries a parent, they come
to seven, pointing at one draws two outlines with the smaller inside the
larger, the larger is a fraction of the island rather than the whole of it, the
tooltip still names the district and says its prefecture, and the names layer
writes prefectures and no districts. 330 annotation checks and 148 map checks
pass.

## A polygon that tore itself apart, a text box that knows when it is too small, and a view a set can remember

Nine things. The bug first, because it was the one doing damage.

### Dragging a polygon stretched one corner away

Reported with a screenshot: an area dragged by its middle came out pulled into
a spike. The cause is one character. `finish()` closed a ring with
`pts.concat([pts[0]])` — the closing coordinate was **the same array object**
as the opening one, so `shiftGeom`, which walks every coordinate, moved that
one twice. Every drag pulled the first corner away at double speed.

Fixed twice over. The ring closes on a copy now, and `shiftGeom` keeps a
WeakSet of the coordinate objects it has already moved — because closing a ring
on its own opening array is legal GeoJSON, so a file from anywhere may arrive
that way and would otherwise tear itself apart the first time it was dragged.
Measured after: all five coordinates shift by exactly 7.2414, −3.7672.

### Two highlights that could actually be told apart

The prefecture and the district were both drawn at 3.3 weight, which reads as
one confused edge rather than two levels. The prefecture takes the emphatic
line now — 4.2, and darker — and the district drops to a hairline at 1 and
30% opacity, because `prov-hot` already lifts its fill and that is what says
which district the pointer is on. The prefecture lifts very slightly too, 1.03
against the district's 1.09, so its reach is visible without reading the line
at all.

And every district's first sentence now carries the kanji: *In Tainan-shū
(臺南州)*, because the prefecture is named nowhere else on the card.

### The text box, and what it becomes

**Scales is on by default**, because a note usually belongs to the ground it is
about.

Turning it on used to make the box explode with a border to match: it was
redrawn from a rectangle in degrees fixed when the box was made, so a reader
who had zoomed in since watched it leap to several times its size. The ground
rectangle is re-derived from where the box is *at that instant* now, so the
switch changes what happens next and not what is on the screen. Measured: the
box is 180×84 before, during and after switching it both ways.

Scaled, it has three forms, and the reader crosses between them by zooming:

| on screen | what is drawn |
|---|---|
| box wide enough to read | the box, heading and words |
| words under about 6.5 px | the box, empty — a coloured rectangle over its ground |
| box under 22 px | a small square that behaves like a city: still there, still clickable |

Measured, drawing a box zoomed in and pulling back: `180×92 words → 119×61
words → 78×40 → 52×27 → 34×18 → dot 8px`, and back to a box on the way in.

That needed one thing that was not obvious: **zooming does not redraw**, it
rescales, so a box drawn at one zoom kept its form for ever and a note the size
of a full stop still tried to render two paragraphs inside itself. `rescaled()`
now works out which of the three forms each scaling box should be in and
redraws only when one of them actually changes — a redraw on every wheel click
is the cost this whole mechanism exists to avoid.

The border needed the same care in the other direction: inside a
`foreignObject` a length is a *user* unit, so `1px` of border is one map unit
and grows into a slab as the box scales up. It is set in the units the box is
drawn in.

### The rest

* **Smooth has eight steps**, four of them new and rounder. Above a
  Catmull-Rom tension of 0.5 a spline stops merely rounding a corner and starts
  bulging past it — wanted for a coast sketched from memory, and firmly the far
  end of the dial.
* **A tool left out** is marked with a thick coloured line under it rather than
  an inset shadow that read as a bevel.
* **Set default view**, at the top of the panel, writes the current frame onto
  the set — into the file and into the link. Anyone opening it starts there,
  and once they wander more than a tenth of the frame away a button appears
  under the map's own reset control to bring them back. It is hidden when there
  is nowhere to go or nowhere to go back *from*, because a button that does
  nothing is furniture and this one sits next to a button that resets somewhere
  else.
* **The help page** gained the text box, the eight smoothing steps, Enter and
  Escape and Backspace, what Undo covers, the two-press sticky tool, the
  locked/unlocked distinction at the top where it belongs, Set default view,
  and a warning that this is a drawing tool and not a GIS — a QGIS export with
  tens of thousands of points in one shape will make the whole map slow to
  draw, to pan and to answer. A missing word was fixed in the islands bullet.

### Measured

`run14.js` grew to 27 checks, including the three forms and the "switching does
not move the box" case. 335 annotation checks across 14 scripts and 148 map
checks pass. `run2` failed once under parallel load and passed three times
alone — a flake, not a regression, and recorded as such rather than chased.

### And then: does dragging work in the other two projections?

Asked after the ring fix, and worth the check, because a whole-shape drag adds
the same number of degrees to every coordinate — which is a constant step on
screen only while the projection is linear, and none of the three quite is.

Dragged a 20° × 25° block 144 px in each. **The shape is under the pointer
where it was dropped in all three**, confirmed by hit-testing the drop point.
What does change is the shape's drawn outline: 3.5% in height in Mercator,
about 2% in Albers and Lambert, and a corner ten degrees from the pointer
travels 9 px differently from the pointer in Mercator and 21 to 25 px in the
equal-area two.

That is not lag and it is not a bug to fix. The shape keeps its extent in
degrees, so those corners land where *their own ground* lands, and ground
carried north is drawn taller in Mercator and a different shape again in an
equal-area projection. It is the point of moving a piece of ground rather than
a picture of one.

An anchored version was written and thrown away: nailing one corner to the
pointer instead makes that corner exact and everything else worse, and the
measurement that seemed to justify it was comparing the shape's *centre* while
the code anchored a *corner* — two different things. The original behaviour is
right; what it lacked was a comment saying why, which it now has.

## Taiwan again, from a 1930 reconstruction, and 蕃地 drawn as one country

The 1926 sheet is gone. It could not make a complete map: no 澎湖廳, no 高雄市
and no 基隆市, both eastern 廳 and every 蕃地 collapsed into one unnamed
19,000 km² residual, and schematic boundaries round Takao that left Okayama-gun
and Hōzan-gun as inland fragments of themselves. What replaces it is a
reconstruction from the 1920 街(庄)界 sheet with the administrative changes to
January 1930 applied — the full account, including the coordinate-reference
fault that displaces the whole distributed series about 830 m west, is now the
Taiwan entry in `sources.md`.

What arrives with it: **55 郡 and 市** against 49 before, including Kīrun-shi,
Takao-shi, Shinchiku-shi and Kagi-shi; both eastern 廳 as administered units;
澎湖廳 as part of the sheet rather than borrowed from Natural Earth; and seven
blocks of 蕃地. Natural Earth now contributes **nothing at all** to Taiwan.

The dissolve is the same exact trick and still checks out: 62,527 undirected
edges, 38,434 of them shared and 24,093 unpaired, so the coastline is the
unpaired ones chained head to tail. 154 rings, 35,939 km², of which 35,738 is
the main island.

### 蕃地 is one shape, and points at nothing above it

More than half the island. The source divides it into seven blocks, one per
prefecture, and those seven are a fact about the filing rather than about the
ground: it was one continuous territory under one regime — outside the 州/郡/
街庄 hierarchy entirely, run by the police bureau under a separate law, with
the 隘勇線 guard cordon drawn round it and pushed inward as the camphor was
taken. Slicing it by prefecture on a teaching map would be drawing the
registry, so the seven are emitted as one path with one name: **Taiwan
Indigenous Peoples**, with 蕃地 beside it.

For the same reason it has no parent prefecture. Pointing at it outlines the
colony, not whichever 州 that slice happened to be filed under, because the
prefecture says nothing true about how the place was governed.

### A prefecture is not the sum of its districts

This is the part that needed new geometry. A 州 runs back over the mountains
into the 蕃地 while its 郡 are a rind along the west coast, so adding the
districts up drew a prefecture that stopped at the foothills — which is what
the map did until now. The eight are carried at their own full extent in a
`taiwan_1930_shu.json` of their own, emitted as paths with `data-shu`, no fill,
no stroke and no pointer events: they exist to be traced round and for nothing
else, the way `#mengjiang-whole` does for the claim Mengchiang made.

Measured: Tainan-shū's own shape is 19 map units wide where the districts filed
under it come to 14.

### And a book title set in italics rather than in asterisks

The prose in `texts/` marks a title the way prose does — *Outcasts of Empire* —
and the card was setting `textContent`, so the reader saw the asterisks. It has
been doing that for a while: `*The People of Alor*` and `*smong*` were already
in the corpus.

`setProse` turns `*…*` into an `<em>` and `**…**` into a `<strong>`, and does
nothing else. Two things about how it is written:

* **It builds text nodes; it never assigns `innerHTML`.** The notes here are
  authored and trustworthy, but the same card is lent to the annotation panel
  to show a description that arrived in a shared link from a stranger. A parser
  that can only ever produce a text node, an `<em>` or a `<strong>` cannot be
  talked into producing a `<script>`, whatever it is handed. Checked: a note
  containing `<script>alert(1)</script>` comes out as those characters.
* **No lookbehind**, which the obvious pattern wants for "no space before the
  closing marker". Safari only learned lookbehind in 16.4, and a two-year-old
  iPad would throw a SyntaxError on the whole of `map.js` — not a broken card
  but a map that does not load. The rule is checked in code instead.

`3 * 4 * 5` and a lone asterisk are left exactly as written.

### Measured

`tools/test/taiwan.js` grew to 23 checks: the 蕃地 is one shape and not seven,
pointing at it outlines the colony rather than a prefecture, a prefecture's own
shape is wider than the districts inside it, the names layer writes eight
prefecture names and the indigenous territory and no districts, and the book
title comes out as a real `<em>` with no asterisk left on screen and nothing in
the note the parser could not have made. 335 annotation checks and 148 map
checks pass.

---

## The prefecture outline stops disagreeing with the fill it is drawn round

Two faults, both showing the reader the same thing: an outline in the strait
round nothing. The screenshot that started it was Hōko-chō, where a dozen small
islands in the Pescadores were traced and not coloured.

### The 1926 sheet under the 1930 map

The eight prefectures were being read from `taiwan_1930_shu.geojson`, which
despite the name is the **1926** sheet: its `PERIOD` says 大正十五年七月 where
the districts say 昭和五年一月. The two do not agree about the Pescadores. On
澎湖廳 the prefecture layer carries 131 rings and 143 km²; the districts carry
18 and 128. So the outline traced islets the districts had never heard of.

`tools/fetch_taiwan_1930.py` no longer opens that file. Each prefecture is now
**dissolved out of its own units** — its 郡, its 市 and its 蕃地 block, all of
which carry the prefecture they were filed under — by the same exact
edge-cancelling the coastline already used. That keeps what the separate sheet
was needed for, which is that a 州 reaches back over the mountains beyond the
districts inside it:

```
prefecture     rings   own km²   its districts    the 蕃地 it also holds
Taihoku-shū       12    3722.1        2158.8         1563.3
Shinchiku-shū     11    3626.9        2112.2         1514.7
Taichū-shū        12    5986.2        2875.3         3110.8
Tainan-shū         4    4562.4        4164.0          398.4
Takao-shū         22    4813.6        2421.6         2392.0
Taitō-chō          5    2960.5        1212.1         1748.4
Karenkō-chō        2    3792.9        1069.2         2723.7
Hōko-chō          18     105.1         105.1            0.0
```

Hōko is the check: it has no 蕃地, so its prefecture is exactly its districts,
and the difference is 0.0 km².

### And then the build undid it again

Dissolving from the right units is not enough on its own. The emitter in
`tools/build_map.py` wrote the prefectures at `FINE_PRECISION` with no
thinning and no minimum area, while the districts beside them went through
`thin()` and `sub_min_area()`. Measured on the built sheet: the districts kept
10,410 of 101,101 source vertices — 10.3% — and Hōko's districts came out as
**11 rings, 523 vertices** against the prefecture's **18 rings, 4,055**. Seven
whole islands outlined and not filled, and the rest traced four times finer
than the shape underneath.

The prefectures now go through the same `thin()` and the same
`sub_min_area()`. Hōko's outline is 11 rings and 523 vertices, the same as its
fill, and the eleven islands agree in position and size to within 0.010 map
units — a hundredth of a pixel at the opening view. They are not
bit-identical strings and are not expected to be: a dissolved ring starts
wherever the chain was picked up, and Douglas–Peucker beginning at a different
vertex keeps a different one or two. Four of the eleven differ by a single
point that way.

Across all eight, 35,060 of 35,951 dissolved vertices survive the build
(97.5%) before thinning; after it the outlines run 365 to 919 vertices.

### The outline that would not move between prefectures

Reported separately and fixed in the same pass. Moving the pointer straight
from a district in one 州 to a district in the next left the *first*
prefecture outlined; going out to open sea and back in worked.

`redrawHighlight()` was building the territory slot's key as
`slotKey('t', hotParent ? 'parent' : hot, ...)` — the literal word `parent`
for every prefecture there is. `slotKey` then falls back to `'c'` for a set
with no cluster name, so all eight came out as the same string,
`t|parent|c:1|1|gen`, and `fillSlot` returns early when the key has not
changed. Sea in between worked because the empty key broke the run.

It now passes the prefecture's own key. Measured on Kagi-gun → Kizan-gun with
no gap between: the outline moved from `[1080.6, 831.6, 18.5, 20.6]` to
`[1083.6, 839.5, 17.4, 34.1]`, where before it did not move at all.

### The 蕃地 note, cut to four sentences

`## TwBanchi` in `texts/territories/sub-units/taiwan.md` was five paragraphs on
the guard line, the police bureau, the camphor and Musha. Replaced with the
four sentences asked for: what the demarcation is, that it is the
administration's own and not an account of where people lived, and Barclay's
*Outcasts of Empire* to read on it. The longer account is still there — it is
the `# 蕃地, and what the word was doing` section at the head of the same file,
which is where a reader who wants it will be.

### Measured

`tools/test/taiwan.js` is 25 checks, two of them new and both guarding this:
Hōko-chō is outlined on exactly the islands it is filled on, ring for ring by
bounding box to a hundredth of a unit; and no piece of any prefecture's outline
sits over open water, which is the general form for the seven that do reach
into the 蕃地 and so cannot be checked against their districts alone.

The rest: labels 19, provsource 9, backings 6, mapstrip 42, projclip 8,
layers-url 19, extent 15, bookmarks 11, cache-keys 7 — 136 map checks, all
passing.

---

## The test suite reviewed: one runner, and one guard that was not guarding

Asked whether the scripts are all still worth keeping, and whether the slow
ones earn it. Measured rather than judged.

### Nothing is redundant

371 distinct check labels across 496 checks in 24 scripts. The only label that
appears in more than one script is `no page errors`, which is in seventeen and
belongs in all of them — it is per-page and costs nothing. Three others repeat
trivially (`two marks`, `and it is recorded`, `the pencil opens the panel`).
There is no script whose subject another covers, and none testing a feature
that has since gone.

### The cost was never redundancy, it was that half the suite ran serially

`annotations/all.js` has pooled its fourteen scripts four at a time since they
were sped up. The ten map suites never got that and were run one at a time by
hand: 206s in a row, of which the longest single script is 45s.

`tools/test/all.js` now pools all 24 together — both halves in one queue, so a
long map suite and a long annotation suite overlap instead of queueing behind
their own kind — longest-first so the tail is short jobs filling gaps.

```
before   206s (map, serial) + 98s (annotations, pooled)  =  304s
after    496 checks across 24 scripts, 4 at a time, in 134s
```

`node tools/test/all.js`, or `all.js map`, `all.js ann`, or a list of names.

### What is left is fixed sleeps, and they are the other half

Counted across every script: 52% of the map suites' serial time is literal
`sleep(n)` — 27.6s of mapstrip's 45s, 16s of extent's 26s, 12.8s of
cache-keys' 15s. The annotation scripts are at 39%, having already been through
this once. Applying the same `waitForFunction` treatment to the map half is the
next real saving; mapstrip is the one that matters, because it is the critical
path.

### And `backings.js` was not testing what it says

The thinnest script — six checks for 15s — so it was the one asked to earn its
place, by mutation: put the `:not(.fine)` back out of `ownShapes`, which is
exactly the regression the file was written against, the one that emptied Japan
from 133,425 square units to 495.

**It reported six checks passing.**

The reason is that all four of its zoom checks measured *painted area*, and
`redundant` is a class that nothing acts on but one rule:

```css
#jmap.backs-off.admin-on #backings path.redundant { display: none; }
```

With Administrative off — which is where the script did its zoom round trip —
a backing marked redundant is still drawn, so the fault paints nothing
differently. And with Administrative on it cannot be seen either, because Japan
then has 46 prefectures of its own and its backing is redundant for a good
reason. Neither state can show it.

It now asserts the invariant instead of the symptom: three steps in, with the
fine window grafted, Japan's atom holds 68 `.fine` paths, no paths of its own,
and its backing is **not** marked redundant. A coastline is not a division.
Nine checks, still 15s, and the mutation now fails it —
`0 own paths, 68 grafted, redundant=true`.

Worth saying plainly: this is one script of 24 checked this way. The others
have not been mutation-tested, and a passing suite is weaker evidence than it
looked.

### Flakiness the parallel run brought into view

Four runs of all 24. Two were clean; one lost four scripts in under three
seconds each, and one lost `run2` to a puppeteer `Target.setAutoAttach`
timeout at 181s. Both are contention, not truth: four browsers starting at
once on a ten-core machine, and one of them losing.

Two things done about it. The runner now retries, exactly once and at the back
of the queue, any script that dies in under five seconds without reporting a
count — a real failure reports its checks and is never retried, and a retried
script is marked `*` in the summary so it is not silently hidden. And `run2`'s
30-second wait for the over-length caption was raised to 60: it timed out
under load and then reported a failing check, which is a false negative with
no way to tell it from a true one.

Last four runs: 499 checks, all passing, 134.9s.

---

## Taiwan's names: the name of the day first, and the colonial word off the places

### 蕃 is not used as a name for anywhere

The term stays in two places and leaves everywhere else. It stays in the
`# 蕃地, and what the word was doing` section at the head of
`texts/territories/sub-units/taiwan.md`, which exists to say what the word was
doing, and in the one sentence of the `## TwBanchi` card that names whose
demarcation it was. It is gone from:

* the **tooltip**, which was `蕃地 in the colonial administration: the highlands
  and the east…` — the tooltip is where a reader meets a place with no context
  round it, so the term was leading as the name. Now `The highlands and the
  east: country the colonial state claimed and policed but never governed as it
  did the plains`.
* the **Japanese name field**, which was `蕃地 (banchi)` and is drawn beside the
  title wherever Japanese script is on. Now 台湾原住民族 (Taiwan genjūminzoku),
  with 臺灣原住民族 for Chinese. The unit has no name of its own that is not the
  administration's word for it, so the modern term for the peoples is used.
* **Taitō-chō's description**, which ended "and the interior of the chō is 蕃地"
  and now ends "Taiwan Indigenous Peoples' territory".

`tools/test/taiwan.js` now asserts the tooltip carries no 蕃 at all, where it
used to assert the opposite.

### One rule for every Taiwanese place

**Title: the name it had at the time. Brackets: the Pinyin of the same
characters, then the spelling a reader is likelier to have met, where that is
different.** So `Kagi-gun (Jiayi, Chiayi)`, `Takao-shi (Gaoxiong, Kaohsiung)`,
`Kīrun (Jilong, Keelung)`. Where Pinyin and the Japanese reading are the same
word there are no brackets: Tainan-shi, Tainan-shū.

32 of the 64 sub-units changed; the other 32 already carried the right Pinyin
and needed nothing. Four **cities** were the other way round —
`Pingtung (Heitō)`, `Changhua (Shōka)`, `Yilan (Giran)`, `Taitung (Taitō)` —
putting the modern name where every other place on the map puts the
contemporary one. And Kirun gained the macron it has everywhere else.

### Three lists, not one

The cities are in **three** files and the first pass changed the wrong two.
`data/cities-1930.csv` and `data/cities-1942.csv` feed `cities-gaz.js`;
`texts/sites/sites.csv` feeds the two quiz sites; and `texts/browse.csv` feeds
`JMAP.BROWSE`, which is what the browse layer actually draws. Measured after
changing only the first two: the island still read `Kirun`, `Changhua`,
`Pingtung`, `Taitung`, `Yilan`. All three are updated and all three are checked.

(`data/cities.csv` is a fourth, older file that nothing now reads —
`build_cities.py` takes the two epoch files — and it was left alone.)

### The brackets stay off the island

`mapLabel` strips a trailing bracket, so the map draws `Taihoku-shū` and the
card gets `(Taibei, Taipei)`. Two things defeated that and were caught by
measuring what is drawn rather than what is stored:

* `Taihoku-shū (Taibei, Taipei), prefecture` — the qualifier after the bracket
  meant the whole string was painted across the island. The eight prefectures
  say "The whole prefecture." at the head of their note instead, which is where
  it was needed: three of them — 臺東廳, 澎湖廳, 花蓮港廳 — had no 郡 at all and
  so share a name with the district drawn inside them.
* `Makō (Makung), Pescadores` — the same fault, and the label read that way in
  full across the strait. Now `Makō, Pescadores (Magong, Makung)`, drawn as
  `Makō, Pescadores`.

### Measured

Drawn on the island with Cities and Names on: Taihoku, Takao, Tainan, Taichū,
Kīrun, Karenkō, Shinchiku, Kagi, Makō/Pescadores, Shōka, Heitō, Taitō, Giran,
and the eight prefectures and Taiwan Indigenous Peoples. Not one bracket among
them. The tooltip on Taihoku-shi reads `Taihoku-shi (Taibei, Taipei)`.

`tools/test/taiwan.js` is 31 checks, six of them new: every city drawn under
its Japanese name, none under a modern one, no bracket painted on the island,
Makō still saying where it is, the record carrying both romanisations, and the
tooltip carrying no 蕃. Whole suite: 505 checks across 24 scripts, all passing.

---

## Sources worth fetching

- **Suiyuan, 1942: a better boundary than a meridian.** The date is defensible
  — Japan only created a western administrative region out of Paotow and the
  Urad banners in June 1943, six months after this map — but a straight line of
  longitude is the wrong instrument, and it hands the eastern Ordos banners
  (Jungar, Junwang) to Mengchiang, which never securely held them. Options: cut
  along the railway and the limit of cultivation instead; or draw the corridor
  as a railway-and-garrison reach rather than an area. The Yekejao league sits
  south of the Yellow River across the whole width of the province, which a
  meridional cut ignores. Best source found: NIDS serves the North China Area
  Army's own maps of what it held, dated to within three months —
  『北支那方面軍占拠地域治安概況』(Sept 1942), appendix 050_332, and 『北支那方面
  敵情要図』(end Sept 1942), 050_331. Better than the 1940 US Army sheet the
  occupied zone is currently traced from, for the whole zone and not just this.
