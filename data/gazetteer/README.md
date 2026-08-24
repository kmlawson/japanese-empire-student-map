# Gazetteer: populated places

A much finer settlement list than Natural Earth, for choosing and placing city markers.

Natural Earth's `ne_10m_populated_places` has **7,342 points for the whole world**. What is
here is **2,689,290 populated places** across the map's region, of which **896,262 are in
China**. The difference is not marginal: Natural Earth gives you provincial capitals and a
scattering of large towns, and this gives you every county seat and, in China, essentially
every village.

## Source

[GeoNames](https://www.geonames.org/), the country dumps and the `cities500` global file,
downloaded from <https://download.geonames.org/export/dump/>. Licensed **CC BY 4.0**, so it
can be used in the map with attribution.

Countries pulled: CN TW JP KP KR MN VN TH MM MY SG ID PH IN LK BD PK NP BT KH LA BN TL PG SB
VU NC FM MH PW GU MP AS WS FJ KI NR RU. Everything has been filtered to GeoNames feature
class **P** (populated places); the mountains, rivers and spot heights are discarded.

## Files

**Everything below lives in `data/ignored/`, and none of it is committed.** It
comes to 588 MB, which is too much for a repository whose whole published site
is 6 MB. What is tracked is this file and `build_geojson.py` — the recipe —
so that anyone can rebuild the layers from a fresh GeoNames download.

Nothing in the map's build reads any of it. `cities-gaz.js` is made from
`../cities-1930.csv` and `../cities-1942.csv`; this gazetteer was the pool
those 446 places were chosen from, and the choosing is done.

### The working layers — built by `build_geojson.py`

| file | features | what it is |
|---|---:|---|
| `places-merged.geojson` | 50,112 | **Start here.** Every administrative seat plus every place with a known population, deduplicated, clipped to 60°–180°E and 25°S–60°N. |
| `places-populated.geojson` | 48,704 | From `cities500`: every place with a population of 500 or more, in the map's frame. Sorted largest first. |
| `places-seats.geojson` | 30,836 | Administrative seats only (`PPLC`, `PPLA`, `PPLA2`–`PPLA5`, `PPLG`) — national capitals down to township seats. |
| `places-china.geojson` | 16,049 | The China subset of `places-merged`: 14,896 seats plus the populated places. This is the county-seat layer. |

### The dumps they are built from

| file | features | what it is |
|---|---:|---|
| `places-china-all.geojson` | 896,262 | Every populated place in China, 201 MB. Opens in QGIS, slowly. Not made by `build_geojson.py`. |
| `*.p.tsv` | 2,689,290 | The raw GeoNames records, one file per country, feature class P only. 339 MB, of which `CN` is 122 and `IN` 58. Tab-separated, no header — columns are as in the GeoNames [readme](https://download.geonames.org/export/dump/readme.txt). |
| `cities500.txt` | 235,285 | The unclipped global `cities500` dump, 41 MB. |

Rebuild the four layers from the TSVs with `python3 build_geojson.py`. It works
out `data/ignored/` from its own location, so it runs from any directory.

## Properties on each feature

`id` (GeoNames ID), `name`, `ascii`, `fcode`, `country`, `admin1`, `admin2`, `pop`.

`fcode` is the useful one for thinning a layer. Rough hierarchy:

* `PPLC` — national capital
* `PPLA` — first-order administrative seat (province)
* `PPLA2` — second-order (prefecture, in China)
* `PPLA3` — third-order (county)
* `PPLA4`, `PPLA5` — fourth and fifth order (township and below)
* `PPL` — a populated place with no administrative role
* `PPLQ` (25,118), `PPLW` (431), `PPLH` (353) — **abandoned, destroyed and historical
  places.** Worth a look for this project specifically.

## Two things to know before using it

**Only 29,254 of the 2.69 million have a population figure.** The country dumps are mostly
bare `PPL` points with `pop = 0`, which means *unknown*, not *empty*. Populations essentially
all come from `cities500`. So filter by `fcode` to thin the layer, not by `pop` — filtering
on population throws away almost everything, including real towns.

**GeoNames is a modern gazetteer.** Names are current: Shijiazhuang, not Shihkiachwang;
Pyongyang, not Heijō; Dalian, not Dairen. Coordinates are of the modern municipal centre,
which for a Chinese city can be some kilometres from the pre-war walled town, and modern
municipal boundaries are enormous — Shanghai's `pop` here is 24.8 million, the whole
municipality. For placing a marker to within a kilometre or two this is fine; for period
names and pre-war extents it is not, and `../cities.csv` carries those instead.

## The historical complement, not downloaded

For a map of the 1920s–40s the right companion is **CHGIS** (China Historical GIS,
Harvard/Fudan) — about 70,000 historical Chinese placenames and administrative seats with
the dates each was in use, which is exactly what GeoNames cannot give you. Version 6 is at
<https://dataverse.harvard.edu/dataverse/chgis_v6>, with time slices for 1820, 1911 and 1990.

I could not fetch it here: Harvard Dataverse serves its collection pages as a JavaScript
application and its API returned empty `202` responses to every request. It needs a browser.
The 1911 time slice is the one to get — it is the closest to this map's period, and it gives
county seats under their pre-pinyin names.
