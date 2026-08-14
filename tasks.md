# Tasks

What is outstanding, and what has been done and how. Every fix gets a line here
describing what was actually changed, before it is marked done.

---

## Open — asked for and not yet done

- **The slivers at Brunei Bay.** Reproduced, diagnosed twice, and it wants a
  source. Where geoBoundaries' Sabah, Sarawak and Brunei meet, the three
  polygons do not close on each other: at 115.36 E 5.23 N and 115.48 E 5.12 N
  nothing covers the ground at all, and two more wedges nearby are covered only
  by a North Borneo seam showing through the hole. The seams cannot close it — a
  strip reaches from one country's boundary to another's, and here three
  boundaries are involved and none of them is where the others expect.
  It is also the answer to "selecting Sarawak highlights North Borneo": it does
  not — hovering Sarawak lights only Sarawak, checked — but Sarawak's seam
  strips show through North Borneo's holes in Sarawak's colour, so part of
  North Borneo is painted Sarawak whatever the pointer does.

  Two fixes were built and measured and neither is worth keeping, which is the
  useful part of this entry.
  **Full detail** for the three, on the theory that one line in the source was
  being thinned into two by tolerances each atom's own span earns: at full
  detail the wedges are the same and the two SVGs are 120 KB larger. It is not
  simplification; the polygons genuinely do not close.
  **A neutral base under the island**, Natural Earth's own Borneo laid
  underneath in the neutral colour with a stroke to bridge the gaps, clipped to
  the coastline so it could never reach the sea. It closes nothing here, because
  **Natural Earth calls those wedges water too** — checked point by point — and
  across the whole island it is the only cover at 34 of 18,900 sample points,
  all of them coastline detail in southern Kalimantan. Brunei Bay is a real bay,
  the head of it is genuinely dendritic, and Brunei is genuinely cut in two by
  Limbang; what the map is showing is three drawings of one shore that disagree,
  and no filler can decide between them. It wants a period source for the bay.


These are the outstanding half of the batch of 13 August. Each is real work
rather than a tweak, and none of it is started.

- **Turtle Islands and Mangsee Islands**, off North Borneo, extracted from
  `/Users/kml/Downloads/coastlines-split-4326` (OSM coastlines, 876,182
  linestrings, 1.2 GB). Two groups, labelled separately, "Under British North
  Borneo Company administration; claimed/allocated to the U.S. Philippine
  Islands", American colour with British diagonals in 1930 and the Japanese
  colour in 1942.

- **Miangas**, from the same file, Dutch East Indies in 1930 and Japanese in
  1942, with a note from the Island of Palmas arbitration of 1928.

- **A better shape for Labuan**, from the OSM coastlines file, if the present
  one will not do. Its label now carries the dates (below); the shape does not.

- **Cocos (Keeling)**, if it is inside the frame — 96.85 E, 12.15 S, and the
  frame's south-west corner is 66 E, 13 S, so it is, barely. Straits
  Settlements, with the date; raided by a U-boat in December 1942 but never
  occupied, and Allied throughout.

- **A fine coastline set for Singapore and its islands**, on the same terms as
  the Ryukyus and the Pacific: fetched only on a deep zoom into that window,
  carrying the metadata and colours over.

- **A fine set for Ulleung and the Liancourt Rocks**, with their Korean and
  Japanese names, Japanese-held on both dates, with a note on the dispute
  today.

- **Guangzhouwan, the last of it**: the hull carve cuts into the mainland on
  the north-west, one yellow island inside the leasehold survives, and there is
  a small leak on the far south-eastern island.

  Tried and reverted: **Natural Earth's coastline as a limit on the carve**,
  put into the same even-odd path so that ground inside the hull but on
  Natural Earth's land would be left alone. It does take the north-western
  strip back, and it brings the whole fringe with it — a yellow rim along every
  shore of the leasehold, because Natural Earth resolves the bay and not the
  tidal creeks, which is the same reason it will not serve as the cutter. Worse
  than what it replaced, and reverted. The honest fix remains a period source
  for the lease boundary, as the Kwangchowwan entry below says.

- **North-west Indochina, about 102.5 E 22.4 N**: which side of the frontier a
  wedge there belongs to, and the black outline agreeing with whatever the
  answer is. Not yet traced against a period source.

- **Three frontiers still want checking against a source rather than against
  each other**: the Burma–India line does not quite reach the Chinese border;
  the northern India–China boundary is drawn differently in 1930 and in 1942
  and should be the 1942 line on both; and the eastern end of Afghanistan.
  These are source disagreements, not build faults — the seams close the gaps
  but cannot decide which line is right.

- **A few slivers of Manchuria still show through the Kwantung leasehold.**
  Down from a continuous fringe to about half a dozen specks. They are the
  residue of the cut, the dissolve and the path rounding each moving a vertex a
  little; closing them properly means giving the leasehold the parent ring's
  own vertices rather than a clipped copy of them.

- **Kwangchowwan** — needs a period source after all. Diagnosed properly this
  time. The leasehold's own file holds six separate pieces round Guangchow Bay,
  and the yellow between them is not a leak: it is ENP's Kwangtung, whose
  coastline is coarse enough to cover the bay and its tidal creeks, showing
  through where the lease's finer outline says water. So the mess is the base
  map poking through a finer overlay, the same shape of problem as the Korea
  frontier — but this one cannot be closed by reaching outward, because what is
  wanted is to cut the bay *out* of China, and `clip_halfplanes` is convex-only
  with no polygon difference anywhere in the build.
  Filling the concavities instead was measured and rejected: the convex hull of
  all six pieces overshoots their area by 78 per cent, and per-piece hulls by
  11 to 73 per cent, which would swallow Chinese land the lease never held. The
  honest fix is the lease boundary as a period map draws it — one line round the
  bay and its shores — and that is a source I do not have.
- **The shapes of the coastal enclaves.** Amoy, Swatow and the Canton delta are
  named now, but Amoy and Swatow are still fourteen-point ellipses — a guess
  with the corners rounded off. They want a period source. (Naming them is
  done; see below.)
- **A grey wedge on the Liaotung coast**, 121.5–122.1 E, 39.0–39.5 N, about six
  pixels across. Not source-blocked, but not obviously worth what it would cost.
  It is `chinabase` — Natural Earth's China, drawn in the neutral colour beneath
  everything — sticking out past ENP's Fengtien, which is the seam-showing it
  exists to do, except that on a coast rather than a frontier it reads as a
  mystery strip instead of as a disagreement. Closing it means either extending
  Manchuria out to Natural Earth's coastline, which is the source this map
  deliberately does not use for China, or trimming `chinabase` back to whatever
  sits on it, which is the opposite of its purpose. Left alone on the judgement
  that a visible seam is better than a silently wrong coastline.
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

---

## Done

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
