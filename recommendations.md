# Recommendations

Three independent reviews of the project, commissioned 11 August 2026: one on
the history, one on teaching and interface, one on the engineering and the
cartography. Each was asked to be critical rather than complimentary. What
follows is their findings, edited for overlap and ordered within each section
by how much it would improve the map.

Nothing here has been acted on except where marked **done**.

---

## 1. History and content

### Framing that undercuts the map's own argument

1. **Indochina, Macao and Kwangchowan are classified three different ways for
   the same situation.** The 1942 palette is a ramp of *how* Japan held
   ground — annexation, rule through others, rule by the army. French
   Indochina is drawn as military occupation although its own note says Vichy
   officials stayed in place until March 1945; Kwangchowan, administratively
   part of Indochina, is drawn French; Macao, which Japan never occupied, is
   drawn occupied. The device that would fix both is already on the map and
   used correctly for Portuguese Timor: the owner's fill with Japanese
   stripes. As drawn, the map tells students that Indochina in December 1942
   was under Japanese military government, which is the thing that was not
   true until 9 March 1945.

2. **Wang Ching-wei's Nanking government is drawn as occupation while
   Manchukuo and Mengchiang are drawn as client states, and the reasoning is
   nowhere given.** The territory id is `nanjinggov` and the note calls it
   collaborationist government, but the fill says army rule. The
   Reorganised National Government had a flag, an army, a central bank and,
   from January 1943, a declaration of war. Either colour it as a client state
   with the occupation hatch over it, or say in the note why not. The map has
   an argument and will not state it.

3. **"The greatest extent of the empire" is not December 1942.** The maritime
   perimeter peaked in July–August 1942, before Guadalcanal, Milne Bay and the
   Kokoda retreat; the continental empire peaked in 1944 after Ichi-Gō; and
   Japan acquired Kwangchowan in February 1943, the four Malay states in
   October 1943 and direct rule in Indochina in March 1945. December 1942 is a
   defensible teaching snapshot — it is Gordon's "late 1942" — but the epoch
   blurb and the README assert a maximum that is not one.

4. **Sovereignty is framed inconsistently between Tibet and Mongolia.** Tibet
   is "de facto independent"; the Mongolian People's Republic and Tannu Tuva,
   which had more of the apparatus of statehood, are painted in the Soviet
   colour, which reads as Soviet possession. That mirrors in reverse the
   Chinese nationalist claim the map declines to make for Tibet.

5. **Kwantung's colour contradicts its own note.** It is drawn as a client
   state because Manchukuo re-granted the lease in 1932; the note says it was
   in practice a Japanese leasehold with its own administration to the end. A
   student reading by shade alone — which the palette comment invites — learns
   the wrong thing.

6. **Three texts described an extent line the map no longer draws.** The
   README, `SOURCES.md` and the Layers panel all explained why the dashed
   perimeter deliberately does not follow the edge of the occupied shading.
   The China front is now taken off that shading's own block. **Done**, 11
   August 2026.

### Datable errors

7. Hawaii 1930: "from 1919 the base of the US Pacific Fleet at Pearl Harbor"
   is wrong. The drydock opened in 1919; the fleet was based on the American
   west coast until May 1940, and Roosevelt's decision to keep it at Pearl is
   itself part of the story.
8. Philippines 1930: "a commonwealth with promised independence from 1935" is
   an anachronism on a 1930 map. In 1930 the instrument is the Jones Act of
   1916.
9. Jehol and Chengteh: Operation Nekka opened on 23 February 1933 and Chengteh
   fell on 4 March. Both the territory note and the marker date say February.
10. Nan'yō 1942: "fortified through the 1930s in defiance of the mandate's
    terms" is the wartime American allegation, and it is the claim Peattie's
    *Nan'yō* (1988) set out to test and rejected. Base construction is
    essentially a 1939–41 story. The secrecy of the administration is what made
    the accusation credible, and the accusation shaped American planning — that
    is the more interesting sentence.
11. Ceylon 1930: Trincomalee became the Eastern Fleet's base in 1942 *because*
    Singapore fell. In 1930 the whole design rested on Singapore, as the map's
    own Malaya note says.
12. Tibet 1942: Lhasa refused *military* transit in 1942; non-military goods
    moved by mule caravan. As written the refusal is overstated.
13. Mengchiang is short by northern Shansi. The 1939 federation took in the
    South Chahar and North Shansi governments, and from 1941 subordinated them.
    Datong's coal is a large part of why Japan wanted it.
14. Small data bugs: the `other` territory reads "Afghanistan" in English and
    "Afghanistan · Nepal · Bhutan" in the other three, though Nepal and Bhutan
    are separate atoms; `nanjinggov` leaves "(approximate)" untranslated inside
    the Japanese name; Midway's note says four carriers sunk in a single day —
    all four were hit on 4 June, two were scuttled on the 5th.

### What is missing

15. **The empire's non-territorial reach is the largest single gap, and the
    map's own text notices it.** The 1930 China note mentions the Tientsin
    concession, the north China garrison and the South Manchuria Railway zone;
    none of the three is drawn. For a course on this empire the 1930 map's most
    important object is arguably the SMR zone. A "reach" layer would carry the
    SMR and Chinese Eastern lines and their zones, the Japanese concessions
    (Tientsin, Hankow, Soochow, Hangchow, Chungking, Amoy), the Shanghai
    International Settlement, and the Boxer Protocol garrison. Two events would
    then have somewhere to land: the seizure of the International Settlement on
    8 December 1941, and the abolition of extraterritoriality in January 1943.
16. **Forced labour, prisoners of war and the comfort-station system are
    almost entirely absent.** The most teachable omission is the Burma–Thailand
    railway, under construction at the map's own date: begun June 1942,
    completed October 1943, roughly 60,000 Allied prisoners and more than
    200,000 Asian *rōmusha*, with mortality an order of magnitude worse among
    the latter. Also missing: the Javanese *rōmusha* levies, Korean and Chinese
    conscript labour inside Japan, the comfort stations, and prisoner-of-war
    camps as a category. Hainan's note — "worked with forced labour for its
    iron ore" — shows the register the rest of the map should be using.
17. **The 1930 map has almost no events**: none at Basic, four at Advanced for
    the whole period 1853–1930. Candidates that cost one data entry each: the
    Musha Incident of 27 October 1930, contemporaneous with the map's own date
    and the obvious way to put the violence of Taiwanese colonial rule on it;
    the Kwangju student movement of 1929; Huanggutun 1928; Port Arthur 1894;
    the London Naval Treaty and the shooting of Hamaguchi; the rice riots of
    1918; the Tōhoku famine and the silk crash, which are the economic ground
    under everything the 1942 map shows.
18. **Communist base areas are named in prose and drawn nowhere.** Yenan is a
    city marker; the Shaan-Gan-Ning border region is not on the map. Drawing
    two or three base areas inside the shading would convert "the shading is
    approximate" from a disclaimer into a visible historical fact.
19. **Resource geography is absent, and it is the strategic logic of the whole
    1942 map**: Palembang, Balikpapan, Miri, Tarakan, Bangka tin, Malayan
    rubber, Burmese and Cochinchinese rice, Fushun coal, Anshan iron. Several
    are already unremarked grey dots in the browse layer.
20. **Railways are missing while rivers are present.** For this empire the rail
    net matters more: the SMR, the CER, the Korean trunk lines, the
    Peking–Hankow and Tientsin–Pukow lines — which *are* the shape of the
    occupation — the Burma Road, the Hump, the Ledo Road.
21. **Manchukuo's internal structure is flattened**: no Hinggan provinces, no
    settler colonisation programme, no Concordia Association, no opium
    monopoly, no depopulated strip along the Korean border.
22. **The Japanese diaspora is invisible**: not Davao's abaca colony, not the
    settler majority in the Nan'yō, not the Okinawan migration streams, not the
    1924 American Immigration Act, not Brazil.

### Notes and wording

23. Taiwan's notes are disproportionately bland beside Korea's: nothing on the
    1895–1902 pacification war, the campaigns against the highland peoples,
    Musha, *kōminka*, sugar, or the Takasago volunteers. The two colonies are
    morally weighted very differently for no stated reason.
24. "Untouched by the war so far" (Japan, 1942) means "not yet bombed" and
    reads as untouched by war, in a year of mobilisation, conscription and
    rationing.
25. Unit 731: "biological warfare experiments" is euphemistic for human
    vivisection and the field-testing of plague and cholera. Chemical warfare
    in China is absent entirely.
26. The March First Movement "met with mass repression" gives no magnitude.
    The contested range — several hundred by Japanese official figures against
    about 7,500 by Korean nationalist estimates — is itself the lesson.
27. Okinawa's note is good on the civilian death rate and silent on the army's
    part in it.
28. Thailand's note could carry the standard complication in a sentence: the
    ambassador in Washington refused to deliver the declaration of war, the
    United States never treated Thailand as an enemy, and Seri Thai operated
    throughout.
29. Indochina 1942 should carry the Tonkin famine of 1944–45 — the largest
    civilian death toll of the Southeast Asian occupation, and absent.
30. The 1930 Sinkiang note is written in a different register from every other
    note and reads as a patch.

---

## 2. Engineering, size and cartography

### Measured

`japan-empire-map.svg` is 1,459 KB, of which 96.4% is `d=` attributes: 469
paths, 228,886 coordinate numbers, 129,747 segments. The `class="whole"`
backing layer is 355 KB — 24.3% of the file — of pure duplicate geometry, and
`clipPath#clip-china` is another 74.5 KB duplicate. The largest atoms are the
Indies (198 KB), the Philippines (196 KB), Korea (123 KB) and Japan (123 KB).

| | raw | gzip | brotli |
|---|---|---|---|
| as built | 1459 KB | 397 KB | 237 KB |
| relative path encoding | 867 KB | 214 KB | 171 KB |
| …and no backing layer | 659 KB | 177 KB | 146 KB |

Load on a 390×844 phone profile with the CPU throttled 6×:

| network | first paint | SVG arrives | map usable |
|---|---|---|---|
| WiFi | 232 ms | 536 ms | 1.9 s |
| Slow 4G | 652 ms | 4.8 s | 6.1 s |
| Fast 3G | 1.1 s | 10.6 s | **11.7 s** |

Panning holds 60 fps. Hovering does not: outlining the Philippines builds
201 KB of stroke paths and a 253 KB mask, 137 new nodes, and blocks for
**69.7 ms** at 6× CPU. The same path runs on tap and on the quiz flash.

### Recommendations

1. **Serve the SVG compressed.** The largest measured win for no change to any
   geometry: 1,459 KB to 237 KB, and Fast-3G time-to-map from 11.7 s to about
   2.5 s. The README currently tells students to run `python3 -m http.server`,
   which sends it raw.
2. **Put a regression harness in the repository.** There is none: every check
   lives in a scratch directory outside the repo. The build is deterministic,
   so golden-file testing is cheap. It should cover the SHA of the emitted SVG
   with an `--update` flag; the closure of the extent perimeter; per-atom size
   budgets; that `data.js` and the SVG agree about which atoms exist; that
   `SMALL_ATOM_AREA` matches between Python and JavaScript; and that every
   `data-prov` value has an entry in `JMAP.PROVINCES`.
3. **Break the silent coupling between the hand-entered constants.**
   Demonstrated: moving `SUIYUAN_CUT` from 109.6 to 110.4 leaves a 44 km
   straight chord across the perimeter, with no error and no warning, because
   `china_front()`'s seed and `EXTENT_MANCHURIA`'s anchor are hard-coded to the
   old value. `109.6` appears seven times in the file. Worse, seven of the ten
   points of the Canton block in `OCCUPIED_ZONE` are copy-pasted verbatim into
   `EXTENT_SOUTH_CHINA`. Three pairs of boxes describe the same island with
   different numbers — `ATTU_BOX` against the Attu entry in `ALEUTIAN_BOXES`,
   and the same for Kiska and Guadalcanal — one deciding which atom a ring
   joins and the other what it is called.
4. **Make `simplify()` topology-preserving, then delete the backing layer.**
   Douglas–Peucker anchored at the first and last vertex is not
   rotation-invariant on a closed ring, which is exactly why two neighbours
   from different sources open a hairline of sea between them. The 355 KB
   backing layer, `grow_plane`, and the clip-to-what-is-drawn rule all exist to
   hide that. A shared-arc model would remove the crack class of bugs outright
   and de-duplicate every interior boundary, each of which is currently written
   twice.
5. **Encode paths relatively.** 1,459 KB to 867 KB with no loss of precision.
   Reducing coordinate precision is *not* the lever: one unit is 40 screen
   pixels at maximum zoom, so 0.1 is already coarser than the deepest zoom
   resolves.
6. **Stop rebuilding the whole highlight on every hover.** Build each
   territory's mask and outline once, or stroke the silhouette rather than the
   fifty sub-units.
7. **Split `main()`**, which is 844 lines holding eight dictionaries and eight
   closures, and nothing in it is unit-testable. While in there: `point_in_poly`
   and `quad_planes` are dead, and the build's own size report understates the
   output threefold because it measures a value that is computed and discarded
   for the forty atoms emitted as groups.
8. **Preload the SVG.** Its fetch starts only after `data.js` and `map.js` have
   both landed and `map.js` has run — about 1.4 s of serialisation on Fast 3G
   in front of the largest asset.
9. **The occupied zone does not read as a different kind of claim.** The map
   has three claim-strengths to express and draws two: the dashed perimeter for
   reach, solid fill for control, and nothing for approximate. Occupied China
   is the identical salmon as the Philippines and Malaya, which were
   administered wall to wall. The whole hedge rests on the word "(approximate)"
   in a label that vanishes when labels are off. *(Note: the diagonals were
   removed from occupied China at the author's explicit request, so this needs
   a different device — a stipple, a softer edge, or a second dashed inner
   line.)*
10. **The extent line is the faintest thing on the map**: 1.8 px at 0.55
    opacity, competing with two other dashed warm lines of similar weight. It
    is the most important line on the 1942 map and the weakest of the three.
11. **The frame amputates territory the map draws and names.** `LON_MIN = 66`
    cuts through British India — 533 of Pakistan's admin-0 vertices lie west of
    it, reaching to 60.84°E — ending in a dead-straight vertical edge in the
    middle of a labelled, clickable, quizzable territory. Australia at the
    bottom edge is a legitimate frame; Baluchistan is not.
12. **Mercator is the wrong family for this subject.** Areal exaggeration is
    ×1.70 at 40°N and ×2.42 at 50°N: Attu is drawn 2.7 times too large relative
    to Java. On a map whose whole point is the extent of an empire spanning
    13°S to 55°N, that answers the reader's main question wrongly. The
    architecture makes the change cheap — x stays linear in longitude for any
    cylindrical projection, so only `merc_y` and its four-line twin in `map.js`
    move. At minimum, add a graticule so the stretch is visible.
13. Smaller build items: `chaikin()` treats each occupied-zone block as an open
    polyline, leaving two sharp corners and an unsmoothed closing chord —
    145 km of dead-straight line near Kalgan; `boundary_arc()` picks between
    two arcs by minimum distance to a via-point, which is arbitrary when both
    pass near it; `centroid_of` (vertex mean) and `ring_centroid` (area
    centroid) are both used to answer the same question in different code
    paths, and already disagree about one Unalaska ring; `dissolve()` returns
    nothing for an entire group on any stitching failure and says nothing;
    `tools/bundle.py` checks that the SVG was inlined but not the stylesheet,
    so an edit to that tag yields a silently unstyled standalone build.

---

## 3. Teaching, interface and accessibility

All of this was measured by driving the real page, not read off the source.

### Defects that break the thing the map is for

1. **The quiz frames the answer for you on every question.** `reachable()` in
   `map.js` takes its floor as `min(stage.bottom, quizBox.top)`. On a desktop
   the quiz panel is in the right-hand sidebar, not below the map, so that
   floor is 69 px against an 843 px map. Every territory therefore scores about
   zero visible area, `ensureOnScreen` falls through to `focusOn`, and the map
   zooms and recentres on the answer before the student has clicked. Measured
   viewBox per question: 2800 at rest, 900 for Karafuto, 1260 centred on north
   China for Peking. Clip against `#map-container`, and use the quiz panel as a
   floor only when it actually overlaps the map.
2. **"Try again" at the end of a quiz does nothing.** `finishQuiz()` relabels
   `#q-reveal`, but the button is only ever wired to `revealAnswer`, which
   returns immediately when there is no current question. The only way to
   re-run is End quiz, then Quiz.
3. **The quiz cannot be taken with a keyboard at all.** There are no focusable
   elements inside the map: no marker or territory has a `tabindex`, and the
   global key handler offers only Escape and zoom. A keyboard-only or switch
   user is locked out of Quiz mode entirely and out of Explore beyond zooming.
4. **A screen reader gets no quiz either.** `#q-target` and `#q-feedback` have
   no `aria-live` and no role, so the question changes and the correct/wrong
   feedback appears in silence.

### Pedagogy

5. **Difficulty is two clicks deep behind a button called "Layers"** — a word
   that promises map layers, not "how hard is my revision" — and nothing in the
   main interface shows which level or language is active, so a student cannot
   tell mid-quiz what they are being tested on. *(This is a consequence of
   moving both controls off the header; the header space they freed bought two
   rows on a phone, so the fix is probably to surface the level in the quiz
   panel rather than to move it back.)*
6. **There is no short quiz and no way to drill what you missed.** Pool sizes:
   23/54/96 for 1930 and 28/71/133 for 1942, and `startQuiz` always queues the
   whole pool. Nobody finishes a 133-question sitting. The end summary is a
   flat list of names — not clickable, no notes. A "practise the fourteen you
   missed" button plus a session length of ten or twenty is the single
   highest-value addition to the application.
7. **Wrong-answer feedback names your error but teaches nothing about the
   target.** Naming what you actually hit is the best thing in the quiz and
   should stay. But every record carries a note and a date — zero sites and
   zero territories lack one — and none of it is used. A second attempt should
   offer the target's date or a directional hint, and the summary should carry
   the note for each missed place. That is exactly what a paper map cannot do
   and it is currently left on the table.
8. **"Show me" is too weak to teach.** It flashes a brightness filter three
   times over 1.5 seconds and moves on. On a 5.5 px dark dot over a red fill it
   is nearly invisible; a reveal of Shanghai shows two identical dots at the
   Yangtze mouth with no way to tell which was named. Draw the place's label
   beside it and hold it until the student advances.
9. **Only one question type exists**: find X, click it. No reverse direction
   (point at a place, name it), no category or date questions, and no
   cross-language drill — which wastes the four-language dataset, the map's
   most distinctive asset. Prompting in Japanese, Chinese or Korean and
   answering on the map is a genuinely better revision tool than a paper map.
10. **The 1930 Events layer is empty**, so on that map the Events switch is a
    control that does nothing while the legend still offers "Battles &
    incidents". `buildLegend` gates territory categories on whether any is
    drawn but gates marker categories only on the switch.
11. **Nine battles on the December 1942 map postdate December 1942.**
    `siteInEpoch` filters by year for 1930 only, so the 1942 map carries
    Tarawa, Kwajalein, Truk, Peleliu, Tinian, Saipan, Imphal, Leyte Gulf and
    Iwo Jima. Saipan is level 1, so a Basic student on a map captioned "the
    greatest extent of the empire" is asked to find a 1944 battle.

### Explore mode

12. **Place names are off by default**, and the switch is inside the Layers
    dialog. A teaching map opens showing no names at all. At Basic with labels
    on, twenty legible labels place themselves without collisions and the map
    teaches immediately.
13. **The Administrative switch changes nothing visible.** Two screenshots with
    it on and off are byte-identical; it only changes what the pointer names
    and what the quiz asks. It sits in the same group as Cities and Events,
    which visibly remove markers, so a student will press it, see nothing, and
    conclude the map is broken. Either rename it, move it, or give it something
    visible to do — drawing the sub-unit boundaries when it is on would be the
    obvious thing.
14. **The epoch blurb is unreachable on first load.** It fires only on an epoch
    button *click*, so the two best pieces of orientation text in the
    application are never seen unless the student switches dates and comes
    back.
15. **On a phone, city markers swallow the countries.** The touch catchment is
    22 px. At 390×844 Korea's on-screen box is 61×116 px, and of 1600 sampled
    points inside it 34% land on a marker and only 25% reach Korea itself. At
    the opening zoom a student physically cannot tap Korea. Quiz mode already
    narrows the catchment; Explore needs the same care.
16. **The mobile layer switches are three unlabelled marks.** The `aria-label`
    is right, but a sighted student gets no clue what the control is.

### Accessibility

17. `role="application"` on `#map-container` switches screen readers out of
    browse mode on a promise of keyboard handling that does not exist. The
    injected SVG has no role and no accessible name, only an inner `<title>`.
18. **`aria-pressed` is missing from four of the five segmented groups** — mode,
    epoch, level and language all convey state through a CSS class alone. Only
    the layer switches set it.
19. Focus is lost when a dialog closes: after Escape, `activeElement` is the
    body rather than the button that opened it.
20. `#info` carries `aria-live="polite"` on a section that is hidden until the
    moment it is filled, which NVDA and VoiceOver announce unreliably. Move
    focus to it instead. The tooltip is deliberately silent, which is right, but
    it means hover information has no non-visual equivalent at all.
21. **CJK names carry no `lang` attribute**, so a screen reader pronounces
    東京・東京・도쿄 with the English voice. The language *buttons* already do
    this correctly, so the pattern is known.

**Contrast passes comfortably.** White on the accent red is 8.35:1, muted text
5.18:1, body ink 14.4:1, legend text 16.0:1. Legend swatches put the label
beside the colour rather than on it, which is the right choice.

**Colour discrimination is the real weakness.** The four reds are separated
almost purely by lightness (L* 33 / 47 / 59 / 67) and survive deuteranopia as
four olives — thin but workable. The damaging collisions are elsewhere, and a
red-blind student will read the map *wrongly* rather than merely find it hard:

| pair | ΔE normal | ΔE protanopia | consequence |
|---|---|---|---|
| co-belligerent `#8dd3c7` / Elsewhere `#ded8cb` | 40+ | **6.4** | Thailand reads as unmapped |
| French `#80b1d3` / neutral `#bebada` | 18.1 | **6.9** | Indochina reads as the USSR |
| British `#b07f8e` / Australian `#c9a6b0` (1930) | **14.7** | 13.8 | fails for everyone |
| Portuguese `#fccde5` / neutral `#bebada` | 19.1 | 11.3 | Macao reads as neutral |
| Republic of China `#ffffb3` / de facto independent `#e7de7e` | **16.1** | — | free China against Tibet |

The British/Australian pair is my own doing — "close to the British colour" was
the instruction, and 14.7 is too close. The file already carries three hatch
patterns; extending that to the co-belligerent and Portuguese categories would
do more than a fifth shade. City markers on the American fill are 1.59:1, and
the 1.6 px halo is doing all the work of keeping Manila visible.

### First ten seconds

Desktop is calm and mostly right — but what a student actually sees is a map
with no names on it and an eighteen-row legend of colour words, with no way to
connect a legend row to the shapes it describes. The default date is 1942, so
the first thing shown is the end of the story rather than its beginning; that
is defensible as a hook, but then the blurb explaining what "greatest extent"
means ought to be visible, and it is not. The view is also letterboxed: the
default is 2145 units tall against a 1585-unit drawing, leaving pale bands
above and below the ocean at 1440×900.

Mobile is better: the legend starts folded and the opening view sensibly drops
the Pacific. The three icon-only switches are the one thing that will confuse.

### If only five

Fix `reachable()`'s floor so the quiz stops framing its own answers; wire "Try
again"; give the quiz panel live regions; add "practise what I missed"; turn
labels on by default.

---

## 4. Further historical resources

### Verified reachable

| Resource | URL | What it would let the project do |
|---|---|---|
| CShapes 2.0 (ETH) | `https://icr.ethz.ch/data/cshapes/` | Independent-state boundaries with valid-date ranges from 1886 — a peer-reviewed cross-check on Siam, the MPR, Nepal, Bhutan and Afghanistan. Sovereign states only, so no colonies. |
| historical-basemaps | `https://github.com/aourednik/historical-basemaps` | Year-sliced world GeoJSON including interwar and 1938/1945 layers. Crude, but the cheapest independent check on where the map has silently modernised an outline. |
| Historical Administrative Districts (ROIS-DS CODH / NII) | `https://geoshape.ex.nii.ac.jp/` | Japanese prefectural *and municipal* boundaries back to the 1920 census. Would replace the 47 modern prefectures with the period set. |
| JACAR | `https://www.jacar.go.jp/english/` | Digitised Foreign Ministry, Army and Navy records with an English interface — the primary-source layer, and a place to send advanced students. |
| David Rumsey Map Collection | `https://www.davidrumsey.com/` | 1920s–40s Japanese and Western atlases of East Asia, many georeferenced and served as tiles. The route to a *period* basemap rather than a modern one. |
| Perry–Castañeda, UT Austin | `https://maps.lib.utexas.edu/maps/historical/` | Public-domain US Army series including the China 1900–1949 sheets, plus West Point campaign atlases with **dated** front lines — what is needed to move the occupied zone off a single 1940 sheet. |
| Taiwan Century Historical Maps (Academia Sinica) | `https://gis.sinica.edu.tw/googlemap/` | Georeferenced Japanese-era topographic and administrative maps of Taiwan. Real colonial-period *shū* boundaries instead of none, and Musha located precisely. |
| National Diet Library Digital Collections | `https://dl.ndl.go.jp/` | The statistical spine: the Government-General yearbooks for Korea and Taiwan, the Nan'yō-chō yearbook, Manchukuo yearbooks. Population, settler numbers, rice and sugar exports. |
| POW Research Network Japan | `http://www.powresearch.jp/en/` | Camp-by-camp lists with locations, directly convertible into a marker layer. |
| CHGIS (Fairbank Center) | `https://sites.fas.harvard.edu/~chgis/` | Time-sliced Chinese administrative geography and a historical-place gazetteer. Coverage ends at 1911, so it supplements rather than replaces ENP-China, but it is the fastest way to verify the Wade-Giles and postal forms. |
| MapWarper | `https://mapwarper.net/` | Free georeferencing for the scans in `occupation-maps/`, so the traced zone can be digitised against a warped raster and its residual error measured and stated. |

### Exists, unverified from this machine

- **外邦図 (gaihōzu)** — the Imperial Japanese Army's overseas map series,
  digitised at Tohoku University (`chiri.es.tohoku.ac.jp/~gaihozu/`) and Kyoto
  University. The single most valuable unexploited source for this project: the
  army's own 1:50,000–1:200,000 sheets for Korea, Manchuria, north China,
  Southeast Asia and Micronesia — the empire's cartography of itself. It would
  allow colonial Korea, Karafuto, Manchukuo's provinces and the Nan'yō to be
  drawn from period surveys, and it is a superb teaching object in its own
  right.
- **The Asian Women's Fund digital museum** — the `awf.or.jp/e-museum/` path
  now 404s. For the documentary base, Yoshimi Yoshiaki's *Comfort Women*
  (Columbia UP, 2000) reproduces the key military documents.

### Books

**On what the shading in China should mean.** Timothy Brook, *Collaboration:
Japanese Agents and Local Elites in Wartime China* (Harvard UP, 2005) — the
direct corrective to province-shaped occupation. Lincoln Li, *The Japanese Army
in North China, 1937–1941* (Oxford UP, 1975), on the army's own graded
pacified / semi-pacified / unpacified categories, a better model for the fill
than a single flat colour. 防衛庁防衛研修所戦史室, 『戦史叢書』, especially
『北支の治安戦』, with dated front-line and pacification maps. Hsu Long-hsuen and
Chang Ming-kai, *History of the Sino-Japanese War (1937–1945)* (Taipei, 1971).
Micah Muscolino, *The Ecology of War in China* (Cambridge UP, 2015), for a
current death-toll estimate at Huayuankou rather than the 400,000–800,000 range
the map carries. Rana Mitter, *China's War with Japan, 1937–1945* (2013); Diana
Lary, *The Chinese People at War* (Cambridge UP, 2010).

**On the colonies and the mandate.** Ramon Myers and Mark Peattie (eds), *The
Japanese Colonial Empire, 1895–1945* (Princeton UP, 1984), with statistical
appendices that could become layers. Mark Peattie, *Nan'yō* (Hawaii UP, 1988).
Louise Young, *Japan's Total Empire* (California UP, 1998); Prasenjit Duara,
*Sovereignty and Authenticity* (2003). Jun Uchida, *Brokers of Empire* (Harvard
UP, 2011); Sidney Xu Lu, *The Making of Japanese Settler Colonialism*
(Cambridge UP, 2019); Eiichiro Azuma, *Between Two Empires* (Oxford UP, 2005) —
together, the diaspora layer. Leo Ching, *Becoming "Japanese"* (California UP,
2001), for the Taiwan notes.

**On the southern occupation and its cost.** Christopher Bayly and Tim Harper,
*Forgotten Armies* (Allen Lane, 2004). Paul Kratoska (ed.), *Asian Labour in
the Wartime Japanese Empire* (2005) and *The Japanese Occupation of Malaya*
(Hurst, 1998). Yoshimi Yoshiaki, *Comfort Women* (Columbia UP, 2000). Michael
Barnhart, *Japan Prepares for Total War* (Cornell UP, 1987), for the resource
logic.

**Statistics.** Mizoguchi Toshiyuki and Umemura Mataji (eds), *Basic Economic
Statistics of Former Japanese Colonies, 1895–1938* (Tokyo, 1988).
