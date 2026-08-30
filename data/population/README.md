# Population data

One file to a dataset, and `index.csv` says what each one is.

The figures that appear on the cards are **not written into `texts/`**. They are
kept here and composed into the short description at build time by
`tools/build_texts.py`, which is why a province's prose and a province's numbers
can be edited without either treading on the other. `texts/` holds the sentence
about the place; this folder holds what was counted there.

## index.csv

| column | |
|---|---|
| `file` | the dataset, in this folder |
| `epoch` | which map it appears on — `1930` or `1942`, and nothing is shown on the other |
| `label` | what the dataset is, for a human reading this folder |
| `pct_of` | the whole that `pct_of_total` is a share of, as it should read: `Korea` gives *% of Total Korea* |
| `country` | the place the group is about. It is the sub-heading in the Layers panel, with the maps of that place as radios under it |
| `group` | the **layer** this file is one date of. Every file sharing a group is one switch in the Layers panel, and the map draws whichever of them matches the date the reader is on; a date with no file leaves the switch on and says so. Each group needs a bit in `POP_BITS` in `map.js` |
| `layer` | the name of that switch, and the heading over its key. The year is added to the key from the file's own `epoch`, so the label itself should not carry one |
| `label` | what the dataset is, in the table's heading and on the button that switches to it. Left blank it is built from `pct_of` and `caption` |
| `line_label` | what kind of number this is, in the short description: *Census Population* for 1930, *Estimated Population* for 1942. A sentence that called the census an estimate would be wrong on the face of it |
| `note` | a sentence under the table's heading, about the figures as a whole — that the 1942 columns are Government-General estimates, for instance |
| `caption` | what was counted, without the place: *estimated population at 1 October 1942*. A card puts the name of the place it is about in front of this, so a province's figures are headed with the province; the whole-territory card is headed `pct_of` + this |
| `source` | where the numbers come from. The same citation belongs on `texts/pages/sources.md`, which is what the reader sees |

## A dataset file

| column | |
|---|---|
| `scope` | `territory` for a country card, `sub-unit` for a province |
| `key` | the `id` in `texts/territories/<epoch>.csv`, or the `key` in a `texts/territories/sub-units/` group file. The build fails on a key it cannot find, so a renamed province cannot quietly lose its figures |
| `en` | the name, for reading this file. The map takes its name from `texts/`, not from here |
| `population` | |
| `m_per_100_f` | males per 100 females |
| `pct_of_total` | share of the whole, as printed |
| `area_km2` | see below |
| `same_as` | this place has no figures of its own because the source counts it inside another one. It carries that row's, and its `note` should say so. Cheju is the case: the 1942 returns fold it into Zenranan-dō. One hop only — a row that points at a row that points elsewhere is refused |
| `note` | a sentence after the figures, or instead of them |

**And as many more columns as the source counted.** `fields.csv` names them:

| column | |
|---|---|
| `column` | the column as it is spelled in a dataset file |
| `label` | what to call it on a card and at the head of a table |
| `group` | which block it belongs to — *Ages*, *Register and nationality*, *Occupation*. A group is a table of its own in the box and a headed run of lines on a card |

A dataset carries whichever of these its source has; a column no file fills is
simply not shown. **None of it reaches the short description.** That is a
sentence, and a sentence has room for a population and a density and not for
twenty-one columns of a census.

**Every field is optional and none is invented.** A field that is blank is left
off the card: the country line carries a population and a sex ratio and no
share, because a country is not a share of itself.

## The areas are measured here, not taken from the source

There is no area column in the 1942 returns, so `area_km2` is measured from the
polygons this map draws — `tools/cache/korea_13_provinces_fine.json`, by
spherical excess on a sphere of radius 6371.0088 km. The density on the card is
`population / area_km2`, computed at build.

Two things follow, and both are on purpose. The density belongs to *the shape
the reader is looking at*, so a hover cannot disagree with the map under it. And
because that shape is simplified and drops the smallest islands, the areas run a
little under the received figures — 219,847 km² for the thirteen provinces
against the ~220,800 usually given for the peninsula, four parts in a thousand.
At the printed precision that moves a density by one at most.


## The choropleth, and where its classes begin

A dataset with densities in it earns a shading layer: a row in the Layers
panel, a button at the foot of every card it covers, and a key on the map. The
class breaks are computed at build by `density_breaks` in
`tools/build_texts.py` and shipped in `data.js`, so the key and the map cannot
disagree about where a class begins.

**Log-spaced, then nudged onto round numbers.** Density is a ratio and reads as
one — 200 per km² is to 100 as 100 is to 50 — and equal steps on a linear scale
put nine of Korea's thirteen provinces in the bottom class and leave three of
the five colours unused. Equal steps on a log scale spread them properly but
land on 73.0, 96.9, 128.7, 170.9, which no reader can hold in their head, while
pure powers of ten are too coarse a ladder to have more than one rung inside
one map's range. So each break is snapped — in log space, the space it was
computed in — to the nearest rung of

    1, 1.5, 2, 2.5, 3, 4, 5, 7.5  × 10ⁿ

and where two breaks land on the same rung the second is pushed to the next one
up. Korea 1942 comes out **under 75, 75–100, 100–150, 150–200, 200 and over**.

The 75–100 class is empty, and that is the map speaking rather than a fault in
the ladder: nothing in Korea sat between 69 and 111 per km², the mountains and
the paddy being what they are. An empty class is left in the key, because
taking it out would make the ramp lie about the spacing.

Five classes, and the ends are open: nothing falls off either end of the ramp.
The colours are a cool five-step blue, in `POP_RAMP` in `map.js` — cool because
the map is warm, and shaded ground should never be mistaken for a country's own
colour.


## Scopes

`scope` says what kind of thing a row is about, and what is checked:

| scope | |
|---|---|
| `territory` | a country card — the `id` in `texts/territories/<epoch>.csv` |
| `sub-unit` | a province — the `key` in a `texts/territories/sub-units/` group file |
| `city` | a place in the gazetteer — the `id` in `data/cities-<epoch>.csv`. The build fails on a city that map does not draw |
| `summary` | a row with no place at all: *all fourteen 府 together*. It is pinned to the top of its table and appears on no card |

## One ladder for a layer, not one per date

The class breaks are computed from **every date in a group at once**. A
choropleth that switches by date exists to be compared across those dates, and
breaks fitted to each separately would give one colour two meanings: Korea runs
from 37 per km² in 1930 to 224 in 1942, and split per date the pale end of the
1942 ramp would be the deep end of the 1930 one. Pooled, the ladder is under
50, 50–75, 75–100, 100–150, 150 and over, and a province that is pale on one
map and deep on the other has actually changed.

## sources/

The transcriptions the figures were read from, as they were handed over. They
are not read by any build step — the CSVs beside them are — and they are here
so that a figure on a card can be traced to the table it came from without
leaving the repository.


## Three maps, one at a time

A group offers as many maps as its data can draw, and the panel gives them as
radios because they are answers to different questions about the same shapes:

| mode | drawn from | how |
|---|---|---|
| `density` | `population` and `area_km2` | the choropleth, five classes |
| `citizenship` | the *Register and nationality* group | a pie at each unit |
| `occupation` | the *Occupation* group | a pie at each unit, as a share of those in gainful occupation |

A mode whose group has no columns in a dataset is greyed out on that date
rather than offered. The slices, their colours and their folding are
`POP_SLICES` in `map.js`; the modes are `POP_MODES`, and each group takes two
bits of the layers code's high field — see `POP_BITS` and `layerCode`.
