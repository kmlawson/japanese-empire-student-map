# Tasks

What is outstanding, and what has been done and how. Every fix gets a line here
describing what was actually changed, before it is marked done.

---

## Open — asked for and not yet done

Three entries, and each of them is measured rather than assumed. Everything else
that stood here has been closed; where a fix was a generalisation rather than an
answer, the source that would settle it is named at the foot of this file.

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
