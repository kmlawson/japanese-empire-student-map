# Tasks

What is outstanding, and what has been done and how. Every fix gets a line here
describing what was actually changed, before it is marked done.

---

## Open


- **The sources page in the standalone build.** `sources.html` is a separate
  file, so the link from About does not resolve in the single-file build. Either
  inline it or drop the link there.
- **Korea–Manchuria gap.** Korea's period boundary is finer than Manchuria's, so
  a strip of the neutral land colour shows between them along the Yalu and the
  Tumen. Manchuria's side has to reach Korea's line.
- **Bohai.** A wedge of Republic-of-China yellow along the Liaotung coast where
  the occupied shading falls short, and an island in the gulf drawn in the
  "elsewhere" grey instead of belonging to anything.
- **Every yellow leak along the occupied edge**, swept systematically rather
  than one screenshot at a time — and whether the mixed occupied/unoccupied
  islands off the central China coast are history or an artefact of the tracing.
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
