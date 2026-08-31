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
| `in_short` | `no` keeps the dataset out of the short description altogether — its figures are on the card and in the table only. Taiwan's sixty-four districts are the case: sixty-four sentences nobody asked for on hover |
| `table_skip` | groups the box does not print, comma-separated. The figures stay on the card and in the data; this says a table of them is not worth the room — the fourteen cities by age was half a screen of columns nobody had asked a question of |
| `caption` | what was counted, without the place: *estimated population at 1 October 1942*. A card puts the name of the place it is about in front of this, so a province's figures are headed with the province; the whole-territory card is headed `pct_of` + this |
| `when` | the year the **figures** are of, which is not always the map they appear on: Taiwan's later return is the register at the end of 1941 and is drawn on the December 1942 map. The comparison table names its columns from this, and orders the dates by it. Left blank it is the epoch |
| `compare_note` | a caution under the comparison table, where the two dates do not count the same thing the same way |
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
| `apart` | this row is counted **inside** the others rather than beside them, so nothing may add it to them. The 1941 高砂族 of the demarcated 「蕃地」 are the case: they are also counted in the district their ground lies in. It keeps the row out of the choropleth's range and out of the bar chart. The *1930* 蕃地 row is not marked, because that return counts those people once and in a column of their own |
| `compare_pop` | the figure to set against another date, where the row's own is over different ground. Taiwan's two eastern 廳 are the case: the 1930 row is the coastal shelf the map draws, because that is what its density is over, and the 1941 row is the whole prefecture. Printed as they stand, Taitō grows 96% and nearly all of it is the demarcated 「蕃地」 changing sides |
| `compare_m_per_100_f` | and the sex ratio of *that* population, a ratio being a property of the people counted rather than of the row |
| `compare_why` | why, as a footnote under the comparison. A row that uses one is marked with a dagger and shows no density there, the density being over ground those figures are not of |
| `parent` | the unit this row sits inside, where the source counts both — a 郡 is read against its 州 |
| `parent_pop` | and how big that unit was |
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

## A figure that is a share, not a count

`fields.csv` names the columns and the block each belongs to, and a block is a
run of lines on a card and a table of its own in the box. Two conventions have
to be kept apart there.

**A column of counts is a column of people.** Korea's ages and occupations are.

**A column of shares says so in its label.** Japan's 1930 census printed its
age structure as 人口千中 — each group per thousand — and the columns are
`age_0_14_pct` and its two neighbours, under the heading *Ages, % of the
population*, holding the same figure with the decimal point moved: 366 per
thousand is 36.6 per cent. Per cent because that is the unit a reader already
has; the printed per-thousand is in the transcription beside it, so the two can
be checked against each other.

They are not the same column as Korea's `age_0_14` and must not be, because a
reader who takes 36.6 for a number of children has misread the map.
Multiplying the share by the population to make a count was the other
possibility and is worse: it invents four figures of precision the census did
not print.

**A share keeps its decimal places.** `build_texts.py` counts them per column
and writes `dp` on the field; `POP_FIG` in `map.js` formats to it. Without
that, `toLocaleString` drops a trailing zero and 56.0 prints as "56" in a
column of 36.6 and 7.4, which reads as a different quantity.

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


## The chart over a table is of parts, and only parts

Every table opens with one bar to each part, longest first, and a caption
saying how many there are and what they come to. Two kinds of row in a table
are not a part and are left out of the chart, or the bars would not add up to
the caption:

* **a container.** Taiwan's table carries the five 州 *and* the 市 and 郡
  inside them, which is right for a table — a reader looks up a district and
  reads it against its prefecture — and wrong for a chart, where Tainan-shū
  would stand beside its own districts. A row another row names as its `parent`
  is a container.
* **a row marked `apart`**, which says outright that it is counted inside the
  others.

What is left sums to the whole, and the whole is `pct_of`'s row where there is
one and the parts added up where there is not. Taiwan 1930 comes to 56 bars and
4,679,066; 1941 to 55 and 6,249,468; Japan to 47 and Korea to 13, neither
having any containers in it.

## Two dates against each other

Any layer with more than one date gets a comparison at the foot of its table:
the rows both dates carry, with the change and the percentage worked out. It
needs nothing but a shared `group` — it used to want `pct_of` as well, which
kept Taiwan out, the source printing no shares.

Three things it will not do.

**It will not call a date something it is not.** The columns are named from
`when`, the year the figures are of, so Taiwan reads *1930 and 1941 compared*
and not *1930 and 1942*. The sentence under the heading is built from the two
`caption`s — "the census of 1 October 1930 against the estimated population at
1 October 1942" — and only says they are different kinds of number when
`line_label` says they are.

**It will not subtract two rows that mean different things.** A row marked
`apart` on either date is left out. Taiwan's demarcated 「蕃地」 is the case: it
holds the people of that ground in 1930 and every 高砂族 in the colony in 1941.

**And where a row's own figure is over different ground from the other date's,
it uses `compare_pop` instead**, with `compare_m_per_100_f` beside it, marks
the row, drops its density and prints `compare_why` underneath. Two rows use
one — 臺東廳 and 花蓮港廳 — and without it Taitō reads +96% where the honest
figure is +57%.

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
| `summary` | a row with no place at all: *all fourteen 府 together*. It is pinned to the top of its table and appears on no card. The source prints a 府部 row for the population and the ages and none for the registers or the occupations, so those cells are summed from the fourteen — exact by construction, and the same sum the source itself prints where it prints one |

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
