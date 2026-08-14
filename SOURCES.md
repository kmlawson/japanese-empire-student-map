# Sources

Everything the map is built from, and what was done to it. Two kinds of source
are involved: the vector data the shapes are drawn from, and the historical
reading the boundaries, names and notes come from.

---

## 1. Geographic data

### Natural Earth — 1:10m Cultural Vectors

* **Used for:** all coastlines and national outlines outside China, and the
  modern outline of China itself as a backing layer beneath the Republican
  provinces.
* **Files:** `ne_10m_admin_0_countries.geojson`, `ne_10m_admin_1_states_provinces.geojson`
* **Obtained from:** <https://github.com/nvkelso/natural-earth-vector> (the
  `geojson/` directory of the master branch)
* **Home page:** <https://www.naturalearthdata.com/>
* **Licence:** public domain. Natural Earth's terms state that the data may be
  used, modified and redistributed for any purpose, commercial or
  non-commercial, without permission, and that no credit is required — though
  it is given here.
* **Cached at:** `tools/cache/admin0.geojson`, `tools/cache/admin1.geojson`

### ENP-China — Chinese provincial boundaries, 1928–1945

* **Used for:** every Chinese land region on the map. These are the **actual
  provinces of the Republican period** — Jehol, Chahar, Suiyuan, Liaoning,
  Jilin, Heilongjiang, Xikang, Ningxia — so the Manchukuo and Mengchiang
  outlines are historical rather than reconstructed from modern units. 29
  province polygons.
* **Files:** `1928-45/1928_1945.shp` and friends. The 1912–21 and 1922–28
  sheets are cached alongside them, unused for now, for any earlier snapshot.
* **Obtained from:** the ENP-China (Elites, Networks and Power in modern China)
  project's map services —
  <https://mapservices.huma-num.fr/p/home/item.html?id=c931aae6132d4281b439afdf5cd2f1c9>
* **Project:** <https://enepchina.hypotheses.org/3554>
* **Licence:** CC BY 4.0. "Provinces 1922–1928 © 2021 by ENP-China Project is
  licensed under CC BY 4.0", and the same for the other sheets. Attribution is
  required and is given in the About box and here.
* **Cached at:** `tools/cache/enp/1928-45/`, `.../1912-21/`, `.../1922-28/`
* **Provenance note:** these came from Konrad Lawson's own *Modern East Asia
  GIS* QGIS project, where they had already been gathered for teaching use.

### geoBoundaries — Cambodia, Laos and Malaysia, ADM1

* **Used for:** the territory transferred to Thailand under the Tokyo treaty of
  9 May 1941 — the Cambodian provinces of Battambang and Siem Reap and the Lao
  land west of the Mekong — which the Dec 1942 map shows as Thai; and the four
  northern Malay states of Kedah, Perlis, Kelantan and Terengganu, which Japan
  handed to Thailand in October 1943 and which are picked out on both maps.
* **Files:** `geoBoundaries-KHM-ADM1_simplified.geojson`,
  `geoBoundaries-LAO-ADM1_simplified.geojson`,
  `geoBoundaries-MYS-ADM1_simplified.geojson`
* **Obtained from:** <https://github.com/wmgeolab/geoBoundaries> (`gbOpen`)
* **Licence:** CC BY 4.0. Attribution required, and given here.
* **Citation:** Runfola, D. et al. (2020) "geoBoundaries: A global database of
  political administrative boundaries." *PLoS ONE* 15(4): e0231866.
* **Cached at:** `tools/cache/adm1_KHM.json`, `tools/cache/adm1_LAO.json`

### The princely states of India, 1931

* **Used for:** the princely states on both maps, drawn together in one colour
  and named one by one. They replace what was here before, which was five
  modern Indian states standing in for the largest of them — Telangana for
  Hyderabad, Karnataka for Mysore — an approximation the About text had to
  apologise for.
* **File:** `princely-states-india-1931-v1.2026.8.11.geojson` — 40 polygons,
  of which the file itself names nine. The rest are identified in
  `PRINCELY_NAMES` in `tools/build_map.py` by where they are, which for the
  large ones is unmistakable; anything not in that table answers with the
  territory rather than with a guess.
* **Obtained from:** supplied for this map by its author. **This entry still
  needs the upstream source, licence and citation** — it is the only dataset
  here without them.
* **Cached at:** `tools/cache/princely-states-india-1931-v1.2026.8.11.geojson`

### Natural Earth — 1:10m rivers and lake centerlines

* **Used for:** the Yangzi and the Yellow River. Natural Earth's Yangtze
  centreline stops about 170 km short of the sea, so the estuary past Shanghai
  is added by hand; the Yellow River is split at Huayuankou so the two maps can
  show its two courses.
* **File:** `ne_10m_rivers_lake_centerlines.geojson`
* **Licence:** public domain.
* **Cached at:** `tools/cache/rivers.geojson`

### spatialhistory.net — the thirteen provinces of colonial Korea

* **Used for:** Korea, both the province boundaries and the coastline. This
  replaces an assembly from the modern provinces of the two republics, which
  cannot give the period map however it is grouped: Hwanghae was one province
  until 1954, Ryanggang and Jagang did not exist, and Kaesong was in Keiki-dō
  rather than in Hwanghae.
* **Source:** <https://spatialhistory.net/yale/done/korea.html>, a QGIS map of
  the thirteen provinces drawn over Natural Earth 1:10m land.
* **How it is read:** the page is an SVG export in an equirectangular
  projection whose parameters it states in its own comments, so
  `tools/fetch_korea_1930.py` turns the drawing back into longitude and
  latitude. The residual offset was measured against Natural Earth's coastline
  over 253 matched points and corrected. Jeju, which the province layer omits,
  is taken from the land layer and put back into South Chŏlla.
* **Cached at:** `tools/cache/korea_13_provinces.json`

### geoBoundaries — India and Japan, ADM1

* **Used for:** Portuguese Goa and French Pondicherry as enclaves inside
  British India, and Hyderabad State approximated by Telangana; and the
  forty-seven Japanese prefectures.
* **Files:** `adm1_IND.json`, `adm1_JPN.json`
* **Licence:** CC BY 4.0. **Cached at:** `tools/cache/`
* **Note:** Hyderabad is the weakest of these. The Nizam's dominions also took
  in Marathi and Kannada districts now in Maharashtra and Karnataka, and the
  map says as much in the note.

### geoBoundaries — Myanmar ADM2, and the Xufanc map of Saharat Thai Doem

* **Used for:** Kengtung and the trans-Salween Shan states, occupied and
  administered by Thai forces from 1942 and formally transferred by Japan on
  20 August 1943. Kengtung State is the three modern districts of Kengtung,
  Monghsat and Tachileik exactly; the trans-Salween part of Mongpan is the
  eastern end of Langkho district, cut at 98.15°E.
* **Files:** `adm2_MMR_shan_east.json` (four districts, extracted from
  geoBoundaries `gbOpen` MMR ADM2). **Licence:** CC BY 4.0.
* **Extent checked against:** *Saharat Thai Doem map* by Wikimedia Commons user
  Xufanc, <https://commons.wikimedia.org/wiki/File:Saharat_Thai_Doem_map.png>,
  CC BY-SA 4.0 — which shows the territory Japan actually granted rather than
  everything Thailand claimed in the Shan and Karenni states.

### OpenStreetMap — coastlines and island names

* **Used for:** the fine coastlines fetched on a deep zoom into the Ryukyus,
  the Bonins, the Volcano and Izu Islands, Micronesia and Melanesia, together
  with the names of some nineteen hundred islands in them; and the shapes of
  four outer groups the map had no geometry for at all — the Turtle and Mangsee
  Islands in the Sulu Sea, Miangas, and the Cocos (Keeling) Islands.
* **Licence:** ODbL. © OpenStreetMap contributors; the geometry drawn here is a
  Produced Work under that licence. <https://www.openstreetmap.org/copyright>
* **How:** the coastline comes from the split-coastlines shapefile, 876,182
  linestrings and 1.2 GB. `tools/extract_coast.py` reads each record's own
  bounding box out of the `.shp` header and seeks past the geometry when it
  misses, which is 876,000 times out of 876,182, and chains the pieces that
  share an end back into closed islands. The island names come from an Overpass
  query for `place=island` and `place=islet`, matched to the geometry by
  bounding box. Both the extracts and the name index are cached in
  `tools/cache/` so the build never touches the network; the sources themselves
  are gitignored.

### Modern East Asia GIS (Konrad Lawson)

* **Used for:** Tannu Tuva, British Weihaiwei, French Kwangchowan, and Nepal,
  Sikkim and Bhutan as separate polygons.
* **Source:** layers from the author's own QGIS project, drawn in an
  azimuthal-equidistant projection centred on Wuhan. `tools/gpkg.py` reads the
  GeoPackages and inverts that projection back to lon/lat, so no reprojection
  library is needed.
* **Cached at:** `tools/cache/gis/`

### Reference maps of the occupation

* **Used for:** the shape of the occupied zone in China, which is traced rather
  than assembled from provinces.
* **Held in:** `occupation-maps/`, with a README giving each file's Commons
  page, licence and author. The principal one is the 1940 sheet of the *China
  1900–1949* series, which is in the public domain.
* **Also used:** the Sino-Japanese War card set from the module's own timeline
  review tool, for the dates the cities fell.

### Andrew Gordon, "War in the Pacific"

* **Used for:** the dashed line of control on the Dec 1942 map, labelled here
  for its date rather than as a maximum — see the note below.
* **Source:** the map captioned "War in the Pacific", with the legend "Greatest
  extent of Japanese control, late 1942", in Andrew Gordon, *A Modern History
  of Japan: From Tokugawa Times to the Present* (Oxford University Press).
* **How it is built:** only the parts that were *not* a land frontier are
  traced by hand — the front in China, the ocean perimeter, and the cut across
  the Papuan peninsula north of Port Moresby. Everywhere the limit followed a
  real border, the line is lifted straight off the territory outlines, so it
  sits exactly on the Manchukuo, Mengchiang, Burma and Indochina frontiers
  rather than floating near them. See `EXTENT_*` in `tools/build_map.py`.
* **Note:** Gordon's own line is a generalisation and this is a trace of it,
  except in China, where the line *is* the inland edge of the shaded occupied
  zone — taken off `OCCUPIED_ZONE`'s own block and smoothed the same way, so
  that the two cannot drift apart. A perimeter that claimed ground the shading
  did not was the worse of the two errors. Out at sea the line is a naval
  limit and stands on its own.

The Natural Earth cache can be refreshed with
`python3 tools/build_map.py --download`; the ENP shapefiles are shipped in the
repository because they are small and the download is not a plain file URL.

### What was done to the data

`tools/build_map.py` does all of it, and the exact operations are in that file:

1. **Projection.** Web Mercator, on a Pacific-centred frame running 66°E–206°E
   and 13°S–55°N — British India to Pearl Harbor, Sakhalin to northern
   Australia. Longitudes are normalised to 0–360 so the map is continuous
   across the antimeridian.
2. **Grouping.** Units are grouped into *atoms*, the smallest regions any
   snapshot needs. Chinese provinces map straight onto atoms by name;
   everything else is grouped by country, with a few groups split by ring
   (Sakhalin at the 50th parallel, the Ryukyus and Bonins out of Japan, the
   Andamans out of India, Hawaii and the Aleutians out of the United States).
   The modern outline of China is also kept, drawn beneath the provinces: the
   two sources put the land border in slightly different places, and without
   something underneath those disagreements open as slivers of sea at deep
   zoom.
3. **Dissolving.** Shared boundaries inside an atom are removed by cancelling
   directed edges that appear in both directions, and the survivors stitched
   back into rings. Where the source data is not topologically clean the
   stitch fails and the original rings are kept; the same-colour stroke used
   in rendering hides the seam either way.
4. **Clipping and simplification.** Rings are clipped to the frame with
   Sutherland–Hodgman and thinned with Douglas–Peucker at a tolerance of about
   half a pixel, less on small islands.
5. **Minimum sizes.** Islands smaller than a fingertip keep a minimum-size
   disc so they stay visible and tappable.

Output: `japan-empire-map.svg`, geometry only — no names, no colours, no
history. All of that lives in `data.js`.

---

## 2. Historical boundaries

Inside China these are now the real provincial boundaries of 1928–45, not
reconstructions. Elsewhere they are built from modern outlines.

| Territory | How it is built | Confidence |
|---|---|---|
| **Karafuto** | Sakhalin south of 50°N | Exact — the border was the parallel |
| **Manchukuo** | The Republican provinces of Liaoning, Jilin and Heilongjiang, plus Jehol | Good — historical province outlines, and the three eastern provinces already took in the Inner Mongolian leagues that became the Hinggan provinces |
| **Jehol** | The Republican province | Good |
| **Mengchiang** | The Republican provinces of Chahar and Suiyuan | Good |
| **Kwantung Leased Territory** | Liaoning cut on a straight line from Pulandian bay to Pikou | Good — the 1898 lease boundary was a surveyed line across the isthmus |
| **Tibet, Sinkiang** | The Xizang and Xinjiang polygons, which the source itself treats as polities apart from China | Good |
| **Territory ceded to Thailand, 1941** | Modern Battambang, Banteay Meanchey, Pailin, Siem Reap, Oddar Meanchey and Preah Vihear, plus Xaignabouli and Champasak west of the Mekong | Fair — the ceded blocks followed provincial lines close to these; Angkor was left to France and is not carved out here |
| **Japanese-occupied China** | Traced from a 1940 map of the occupation, adjusted to December 1942 against the module timeline, and clipped to China's land: the north China plain, the Yangtze corridor to Hankow, the railway west to Paotow, the Canton delta, Hainan, Amoy and Swatow | Fair for where Japanese authority *reached*. It is not a claim about where it went unchallenged: Communist base areas operated inside the line throughout, which is why the army ran repeated "mopping up" campaigns against them, and the note on the map says so. See `occupation-maps/` |

French Indochina is cut into Tonkin, Annam and Cochinchina along straight
lines at roughly the historical boundaries, with Cambodia and Laos taken whole;
Papua and the mandated Territory of New Guinea are separated by a straight line
from the Dutch border to the coast near Lae. Both are approximations of
boundaries that in reality followed watersheds.

Kinmen (Quemoy) is **not** drawn as part of the colony of Taiwan. Natural Earth
puts it in Taiwan because it is governed from Taipei today; it belonged to
Fujian throughout the colonial period, and it is drawn with China here.
The Pescadores, which *were* ceded with Taiwan in 1895, stay with the colony.

Territories that were one polity are drawn as one shape with no internal
boundary, because there was none at the time: British India has no line at the
Punjab, French Indochina none at the Mekong, Korea none at the 38th parallel,
and in 1930 Burma is inside British India, where it was until 1937.

Everything outside China uses modern coastlines and national outlines as a
stand-in for the historical ones. That is fine for coastlines and rough for
land borders.

---

## 3. Historical content

### The place list

Drawn from the three module timelines used in the course — Modern Japan
1850–1989; late Edo to Meiji, 1850–1912; and Taishō to the end of the
Occupation, 1912–1952. Those handouts are not included in this repository.

Every city, battle and incident on the map corresponds to an event in those
timelines, plus the territories needed to make sense of them.

### Reading behind the timelines and the notes

* Andrew Gordon, *A Modern History of Japan: From Tokugawa Times to the
  Present* (3rd ed., 2014)
* Elise K. Tipton, *Modern Japan: A Social and Political History* (2nd ed.,
  2008)
* Brett L. Walker, *A Concise History of Japan* (2015)
* Mikiso Hane and Louise G. Perez, *Modern Japan: A Historical Survey* (5th
  ed., 2013)
* Kenneth Henshall, *Historical Dictionary of Japan to 1945* (2014)
* William D. Hoover, *Historical Dictionary of Postwar Japan* (2019)
* Meryll Dean, *Japanese Legal System* (2nd ed., 2002)
* Jeremy A. Yellen, *Japan at War, 1914–1952* (2024)

### Place names

Four columns, chosen by the toggle in the bar.

**English** gives the name as it was used in English at the time, with the
present-day name in brackets where they differ — Mukden (Shenyang), Peking
(Beijing), Taihoku (Taipei), Hsinking (Changchun), Batavia (Jakarta). These
follow the Wade-Giles and postal-romanisation forms standard in Anglophone
writing and atlases of the period.

**Japanese** gives the imperial-period Japanese name: 京城 Keijō for Seoul,
奉天 Hōten for Mukden, 新京 Shinkyō for Changchun, 昭南島 Shōnantō for
Singapore, 樺太 Karafuto for southern Sakhalin, 大宮島 Ōmiyajima for Guam.

**Chinese** is in traditional characters, as the period used them.

**Korean** is in hangul, with McCune-Reischauer romanisation in brackets. Sino-
Korean readings are used for places in the Chinese and Japanese spheres, which
is how they were and are read in Korean — 奉天 as 봉천 Pongch'ŏn, 上海 as 상해
Sanghae.

A fifth field, `orig`, survives in `data.js` holding the local endonym where it
is neither Chinese nor Korean — Thai for Bangkok, Vietnamese for Hanoi, Malay
for Singapore. It is kept for reference and is not shown in the interface.

Names that changed between the two dates are held in `JMAP.EPOCH_OVERRIDES`,
so the 1930 map does not call Singapore Syonan-to or describe Changchun as the
capital of Manchukuo.

---

### The browse layer

`JMAP.BROWSE` in `data.js` holds about a hundred cities that are context rather
than content: the provincial capitals of Republican China and Manchukuo, and
the larger cities of Korea, Taiwan, Japan and Southeast Asia. They are drawn
smaller and grey, beneath the markers the quiz uses, and are never examined.
English names are the period ones with the modern name in brackets where they
differ — Paoting (Baoding), Taikyu (Taegu), Kirun (Keelung), Jesselton (Kota
Kinabalu).

## 4. Also examined, not used

From the same *Modern East Asia GIS* project: `Korea Pre-1945.gpkg` and
`modern-east-asia-gis.gpkg` (layers for Korea, Karafuto, the Andamans and
Kiribati). These turned out to be Natural Earth extracts cut the same way this
build already cuts them — merged Korea, Sakhalin south of the parallel, the
Andaman rings out of India — so they were checked and set aside rather than
imported. The georeferenced historical map scans in the same folder are raster
and not usable as vector boundaries.

## 5. Software

Written with Anthropic's Claude, with Konrad Lawson at the prompt. No
third-party JavaScript libraries: the page is plain HTML, CSS and JavaScript,
and the build scripts use only the Python standard library.

The companion interactive map of modern China, from which this one takes its
approach, is in `inspiration/china-map/`.
