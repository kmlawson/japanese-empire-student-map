# Tasks

What is outstanding, and what has been done and how. Every fix gets a line here
describing what was actually changed, before it is marked done.

---

## Open

- **Every yellow leak along the occupied edge**, swept systematically rather
  than one screenshot at a time — and whether the mixed occupied/unoccupied
  islands off the central China coast are history or an artefact of the tracing.
  A ribbon sweep of eight views along the coast (see the Bohai entry below for
  the method) now finds only two things left: **Kwangchowwan**, where bands of
  Republic yellow and French blue interleave over 110.09–110.62 E, 20.97–21.39 N
  with a 112-pixel pocket in the middle of them — the leasehold is still messy
  and wants redrawing rather than patching — and the **Suiyuan meridian**, a
  four-pixel band of Mengchiang colour against China's along 109.60–109.64 E,
  which is the straight cut recorded as its own task below.
- **The coastal enclaves.** Amoy, Swatow and Canton have no name of their own on
  hover, and the shapes are visibly circles: they were boxes, I made them
  fourteen-point ellipses, which replaced one guess with a rounder guess. They
  want a period source and a label each.
- **The Yangtze's tail** runs diagonally across the estuary and stops in open
  water instead of following a channel out to the sea.
- **The Administrative switch is unreliable** — sometimes it works, sometimes
  not. If that is the fetch, show a spinner beside the button; either way it
  must turn provinces on and off every time.
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
  The 1930 agent for this never reported — it failed on the monthly spend
  limit, twice.
- **The Andamans keep the British colour sometimes.** Switching to 1942 leaves
  them Allied mauve now and then; a reload fixes it. Not reproduced: switching
  epochs six times, with the Administrative layer both off and on, gave the
  right colour every time (`andaman / #fb8072`). Suspect a race with the
  administrative fetch or with `composeEpoch`, and needs catching in the act.

---

## Done

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
