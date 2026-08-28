# 근대지리정보 — Modern Geographic Information (NIKH)

Symbol points read off the colonial 1:50,000 and 1:10,000 topographic sheets
of Korea, published as an open dataset by the **National Institute of Korean
History** (국사편찬위원회). **12,343 points**, the whole peninsula, both
halves of it, dated 1914–1934 with the bulk at 1915–1918.

Downloaded 28 August 2026. **Nothing in the map reads this yet.**

- Landing page: <https://hgis.history.go.kr/mod_g1/main.do>
- The open-dataset list it comes from: <https://hgis.history.go.kr/pro_g1/dataset.do>
- `fetch.sh` gets it again. There is no direct link to the file — the page
  posts a form to `fileDownload.do` with a stored name and a display name,
  and that is what the script reproduces.

## What is here

| | |
|---|---|
| `mk_mod_info.zip` | exactly as served, 1.0 MB, checksum in `mk_mod_info.zip.sha256` |
| `shp/` | the shapefile unpacked — **19 MB, not committed** |
| `근대지리역사공간정보DB_명세.hwp` | the field specification that ships inside the zip |
| `fetch.sh` | downloads and unpacks |

The zip is what is kept in the history: it is small, it is byte-for-byte what
the institute served, and `shp/` comes back out of it in a second. The DBF
alone is 19 MB — fixed-width records with five 100- and 200-character name
fields, nearly all of it padding, which is also why the zip is a twentieth of
the size.

## The layer

`place_modern_open` — points, **EPSG:5179** (UTM-K / Korea 2000 Unified,
GRS80), attributes in **UTF-8** (there is a `.cpg` saying so, so a reader that
honours it needs no coaxing).

To look at it in lon/lat:

```
ogr2ogr -f GeoJSON places.geojson shp/place_modern_open.shp -t_srs EPSG:4326
```

Fields: `id_sym`, `nm_chn` (the name in hanja, as printed on the sheet),
`nm_kor` (hangul), `ref_nm` (which sheet or source it was read from),
`sym_cls1`–`sym_cls3` (what kind of thing it is), `legendtype`, `id_map`
(sheet id), `basetime` (the year of the sheet), `id_adm` and `adm_lv1`–`3`
(province, prefecture, township, in hanja), `long`/`lat` (the same point again
as decimal degrees, so the geometry can be checked against the table), plus
provenance columns naming the researchers and the build.

Everything is `sym_cls1 = 시설물`, a built thing. Below that:

| `sym_cls2` | | n |
|---|---|--:|
| 행정시설 | administrative | 2,842 |
| 산업시설 | industrial | 1,760 |
| 종교시설 | religious | 1,678 |
| 사회문화시설 | social and cultural | 1,324 |
| 교육시설 | educational | 1,003 |
| 군사시설 | military | 957 |
| 상업시설 | commercial | 920 |
| 치안시설 | police | 690 |
| 통신시설 | post and telegraph | 496 |
| 교통시설 | transport | 381 |
| 의료시설 | medical | 111 |
| 사법시설 | judicial | 100 |
| 금융시설 | financial | 51 |
| 기타시설 | other | 30 |

The transport 381 break down as **228 railway stations** (철도역), 103
anchorages (기항소), 32 lighthouses (등대), 12 trading ports (상항), 2
bridges, 4 other.

By province, in hanja as the table gives them: 京畿道 1,575 · 慶尙北道 1,175 ·
黃海道 1,100 · 平安北道 1,059 · 慶尙南道 1,057 · 全羅南道 1,044 · 江原道 968 ·
全羅北道 840 · 平安南道 833 · 咸鏡南道 821 · 忠淸南道 783 · 咸鏡北道 582 ·
忠淸北道 436, and 70 with no province given.

## Two things to know before using it

**The names are not all the same kind of thing.** `nm_chn` holds a proper name
where the sheet printed one — 崇實大學, 大川驛 — and a bare category where it
did not: 市場 "market", 面事務所 "township office" occur hundreds of times over
as the whole of the name. Anything that labels these points has to decide
which it is looking at.

**The stations are dated by their sheet, not by a survey year.** `basetime` is
the year of the map the point was read off, and the sheets run 1914–1934, so a
station carrying 1930 may well have existed in 1917 and a station carrying
1915 may have closed before 1942. It is not a snapshot of one date.

## Licence

**No restriction.** The institute registered this dataset on the national
open-data portal, and the licence field there reads
**`이용허락범위 제한 없음`** — scope of permitted use, unrestricted.

- <https://www.data.go.kr/data/15080850/fileData.do> — 교육부 국사편찬위원회_근대지리정보,
  registered 2021-10-28, last touched 2025-05-30, SHP, 무료. The portal does
  not host the file: 제공형태 is `기관자체에서 다운로드` pointing back at
  `hgis.history.go.kr/mod_g1/main.do`, so what `fetch.sh` gets is the file the
  registration refers to.

That is a deliberate setting, not an empty field. The same institute files
other datasets under a named licence — 한국사데이터베이스's 한국사료총서 원문 is
`공공저작물 : 출처표시, 상업적 이용금지, 변경금지 (제4유형)`, KOGL Type 4 — while
this one and its neighbours are registered unrestricted. The portal is where
Korean public bodies state terms per dataset, and this is what it states for
this one.

**Two things still worth knowing.** The dataset page itself says nothing, and
the institute's site-wide copyright policy is narrower than the registration:
it grants free use of works it wholly owns "학술, 연구 등의 개인적인 목적으로만",
academic and research purposes only, and requires the source be given
specifically — 국사편찬위원회 명칭 및 홈페이지 URL, 저작자 성명, 발행연도. Where
it does not hold the whole copyright, anything past reading is barred. That
policy governs the site in general; the portal registration governs this
dataset. Nothing here needs the difference resolved — a teaching map is
academic use either way — but credit it properly when it goes in:

> 국사편찬위원회, 한국근대지리정보 (National Institute of Korean History, Korean
> Modern Geographic Information), <https://hgis.history.go.kr/mod_g1/main.do>,
> built 2019 by the 역사 공간 정보 DB 구축 연구팀.

Checked 28 August 2026.

## Also on that page, not fetched

The same `fileDownload.do` form serves twenty-odd other files. The two that
bear on this map:

- `data_set_09_01.zip` — 철도망 라인정보 공간데이터, the **railway network as
  lines**. Korea's counterpart to the Taiwan railway layer.
- `data_set_03_01.zip` / `data_set_03_02.gpkg` — 행정구역 GIS 데이터
  1910–1945, **administrative boundaries** as polygons, province through
  township.

Both come down by putting their name into `fetch.sh` in place of
`mk_mod_info.zip`, with the matching `orgFileName` from the dataset page.
