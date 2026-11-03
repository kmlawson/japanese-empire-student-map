# Languages of India, 1931: the source for the census language themes

Copied unchanged from <https://github.com/kmlawson/playground-india-language>,
`data/`, at commit `96ae2ccc6f54f929bd8913c63edd52966510a26a` (24 September
2026). The live site is <https://kmlawson.github.io/playground-india-language/>.

| file | what | read by |
|---|---|---|
| `census.js` | Vol. I, Part II, Table XV Part I: the classification tree and every figure, per province and state | `tools/build_census.py` |
| `geo.js` | the province map's geometry, as SVG paths in that site's Mercator | `tools/build_census.py` |
| `districts.js` | the district map's units: geometry, figures, member areas, scan leaves | `tools/build_census.py` |
| `bilingual.js` | Vol. I, Table XV Part II: second languages | `tools/build_census.py` |
| `LICENSE` | that repository's licence statement | |

**To update:** copy the four files over, change the commit above, and run
`python3 tools/build_themes.py`.

**Licences** (`LICENSE` has them in full). The transcriptions and code are CC0.
The geometry is not: `geo.js` derives from plague_india (LGPL-3.0),
geoBoundaries (India ODbL 1.0, Pakistan public domain, Bangladesh CC BY 3.0
IGO), OpenStreetMap (ODbL 1.0) and Natural Earth; `districts.js` from
geoBoundaries and Natural Earth, and for Burma from this map's own
administrative layer. `deploy/theme-census-province.js` and
`deploy/theme-census-district.js` carry those terms with them.

**What the map does not take from it:** the population series 1901–2011, the
1931 atlas plate links, the district-level second languages and the provincial
volume tables (`regional.js`). The cards link to the full site for those.
