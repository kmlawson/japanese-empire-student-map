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
| `note` | a sentence instead of, or after, the figures — for a place the returns do not break out |

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
