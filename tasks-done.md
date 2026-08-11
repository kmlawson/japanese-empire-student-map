# Completed work

A running record of the requests that have been carried out, in the order they
were numbered. Open items are not listed here.

## Names, boundaries and sub-units

1. **Sub-unit names and extents corrected across every country** — the units
   are those of the period and carry their period names: Kankyōhoku-dō rather
   than North Hamgyŏng, Tayabas rather than Quezon, Chiengmai rather than
   Chiang Mai, Celebes rather than Sulawesi.
2. **Korea rebuilt from its thirteen period provinces**, using the Yale
   spatial-history layer, and drawn without simplification — the provinces are
   the finer source, so they are the coastline as well as the boundaries.
3. **Countries assembled from their sub-units** — where an atom is built out of
   provinces, a whole-country outline goes underneath it in the same colour, so
   a crack between two simplified neighbours shows the country rather than the
   sea. Korea takes that backing from its own provinces; everywhere else it
   comes from Natural Earth, and the union means the more detailed of the two
   sources always wins the silhouette.
4. **Base geometry moved to Natural Earth 1:10m** from 1:50m.
5. **Islands drawn at the size they are** — simplification now goes by the size
   of the ring rather than by one tolerance for a whole country, and the area
   floor the archipelagos use applies to island groups assembled from
   provinces too. The Philippines roughly trebled in detail; the Indies and
   Japan gained in the same way.
6. **Layer leaks closed** along coasts and frontiers; the ocean hairlines
   between neighbouring sub-units were more than halved.
7. **Kengtung shaped by district**, not cut off with a straight line, and drawn
   at full detail so the Tachileik salient survives.
8. **The Burma–India boundary** marked with the darker line, and only along the
   western side where it is wanted.
9. **Princely states** gathered into one darker colour on both maps, with
   Sikkim among them. (The Harvard dataset was checked: 998 states, CC0, but
   tabular only — no geometry.)
10. **Missing enclaves added** — Portuguese Diu, Damão, Dadra and Nagar Haveli;
    French Mahé, Karikal, Yanaon and Chandernagore.
11. **Saharat Thai Doem** — Kengtung and the trans-Salween Shan states under
    Thai occupation from 1942.
12. **Tuva and Mongolia** the same colour in both epochs, with a faint line
    between them; India and the USSR likewise unchanged across the two dates.
13. **No separate polygons for the later cessions on the 1930 map**, and islet
    rings confined to the Pacific.

## The 1942 line of greatest extent

14. **The occupied zone retraced for December 1942** — the front runs down the
    Tatung–Puchow railway in Shansi to the Yellow River bend and along the
    river's north bank, so Loyang and Chengchow fall outside it; then down the
    1938 flood course, round the Chinese pocket in north-west Anhui and the
    Dabie Shan, out to Ichang, past Yochow, and through Chekiang taking in
    Kinhwa but not Chuchow or Wenchow.
15. **The line follows the shading it describes** rather than wandering, and
    the rule throughout is the one that was given: if a place was occupied it
    is inside the line, and if it was only claimed it is outside.
16. **Tonkin restored** — a 116,000 km² error where the arc had been taken off
    the wrong ring.
17. **Karafuto and the northern Kuriles** corrected, and the Amur and Kamchatka
    bulges removed.
18. **The Aleutians** — only Attu and Kiska inside the line, in closed loops of
    their own, with the rest of the chain Allied.
19. **Eastern New Guinea** — the line moved north of Milne Bay, Goodenough, the
    Trobriands and the Louisiades, none of which were held.
20. **The Solomons divided by who held them** — the western chain occupied;
    Guadalcanal contested; Tulagi, Gavutu and Tanambogo American from 8 August;
    Malaita never occupied; and San Cristobal, Ulawa, Rennell, Bellona and the
    Santa Cruz group British throughout.

## Rivers

21. **The Yangzi mended near its mouth** — the hand-drawn estuary now starts
    exactly where Natural Earth's centreline stops, instead of half a degree
    away.
22. **The Yellow River** no longer doubles back on itself at Huayuankou: both
    the old course and the 1938 flood course end and begin at the breach.

## Colour

23. **ColorBrewer Set3, one colour per empire**, so that no two are confusable
    and none of them shouts. Everything Japan held runs down a ramp built from
    Set3's salmon, darkest at the centre: the metropole, the colonies and
    leased territory, the client states, the territory under military
    occupation. The 1930 map takes the first two, so Japan and its colonies
    look the same on both dates. Tibet is a darker shade of China's yellow,
    Mongolia and Tuva a lighter shade of the Soviet lilac, Australia a lighter
    shade of the British mauve — each family readable as a family.
24. **The diagonals dropped from occupied China**, which was the only thing
    carrying them.
25. **Manchukuo and Mengchiang share a fill**, told apart by a hairline down
    Chahar's eastern edge; **Kwantung** joins them, since the lease was
    re-granted by Manchukuo in 1932, and is told from Manchuria by its own
    boundary across the Liaodong isthmus.
26. **Siam and the territories it took from Indochina** in teal on both dates,
    with Kengtung striped over the same colour.
27. **Tibet** in a shade of its own, self-governing and neutral; Sinkiang
    back with the Republic of China, which is where December 1942 leaves it.
28. **The Portuguese enclaves** — Goa, Damão, Diu, Dadra — keep the Timor
    purple on both maps; **Macao** takes the occupation colour on the 1942 map,
    with a note saying plainly that Japan never raised a flag there.
29. **Mixed control reserved for Guadalcanal** — New Guinea occupied outright,
    Malaita plain British. Guadalcanal itself is the occupation colour with
    American stripes across it, the only place on the map with two flags over
    it; Portuguese Timor and Thai Kengtung keep their own fill and take
    Japanese stripes instead.
30. **Weihaiwei dropped from the 1942 map** — it went back to China in October
    1930, and drawing its old lease boundary in 1942 said otherwise.
31. **Pondicherry** given more contrast.

## Markers and interface

32. **The Battle of the Coral Sea** added to the 1942 map at the advanced
    level.
33. **Mobile** — overlapping marker hit-discs resolved by nearest-marker search
    rather than stacking order, the landscape opening view cropped to the
    empire, the legend made collapsible and moved out of the map's way, and
    double-tap detected on pointer-up so quiz answers register.
34. **Cities / Events / Administrative switches** in the header in place of the
    level buttons, which move into the Layers panel with their own explanation.
    On a phone the three words shrink to the marks the map already uses.
35. **Language buttons moved into the Layers panel** as well, so the header is
    two rows on a 320px phone.
36. **Administrative off means off** — with the layer switched off a country is
    one thing: no province is named and none is outlined. Islands and enclaves
    are exempt, their sub-units being places rather than administrative
    divisions.
37. **Sub-units that can name themselves** — the nine French and Portuguese
    settlements in India, twenty-eight Aleutian islands, eighteen Kuriles,
    twenty-three Ryukyus, and the Dindings, which were a Straits Settlement
    until 1935 and part of Perak after it.
38. **Hit-testing for shapes smaller than a pixel** — Karikal is two square
    kilometres and the browser hit-tests British India through it, so the small
    atoms' target circles now win, but only when the shape really is too small
    to hit and the pointer is really on it.
39. **The Yellow River's flood course redrawn** from the channel map at
    disasterhistory.org: down the Chia-lu into the Ying, down the Ying into the
    Huai, and through Hungtse Lake and the Grand Canal into the Yangtze above
    Chinkiang. For nine years it reached the sea through the Yangtze's mouth.
    A stray chord across its meanders on the 1930 map is gone too.
40. **The middle Yangtze drawn as the front it was** — from Ichang down to
    Yochow the shading follows the river's north bank instead of striding
    across its loops, with Ichang itself keeping both banks.
41. **"Free China" retired** in favour of Republic of China on both maps, and
    the notes on Sinkiang and the Soviet Union rewritten — the latter now
    placing Nomonhan, which is a large part of why 1941 went south.
