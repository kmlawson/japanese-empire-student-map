# Printed tables on the map: what shape arrives, and how each is shown

The statistics site sends one table in the address (`#t=`, its `build/MAPLINK_SPEC.md`,
version 1). `table-link.js` reads it. This note is the method for the tables that are
not a plain list of prefectures, and what the site has to send for each. The map side
of everything below is built and tested (`tools/test/tableshapes.js`); the site side
is a request until its spec says so.

## The one rule the map relies on

**A row is a place. A column is a measure.** Every shape below is turned into that
before it is sent. The map never transposes, guesses which axis is geography, or reads
a printed row label to find a year.

## Shapes seen so far

| Shape | Example | Sent as |
|---|---|---|
| Prefectures down the side | 警視廳統計書 1935 p0110_1 | as in spec v1 |
| The empire's parts down the side, a 帝國 row | 都市年鑑 1931 p0368_1, p0368_2 | `units: "territory"`; 帝國 → `total` |
| Colonies only, two-level headings | 都市年鑑 1936 p0032_1 | `territory`; headings with ` — ` |
| The parts across the top, measures down | 都市年鑑 1936 p0097_3 | turned: each printed row a column; 合計 → `total` |
| The parts across the top, dates down | 都市年鑑 1936 p0136_2 | turned: each year a column, one `series` |
| The parts across the top, three parts of dates and spans | 都市年鑑 1941 p0041_1 | turned; all three parts, headings `part — period`; `series` per comparable set |

## How the map shows them

* **Japan proper as one place.** `naichi` paints every prefecture one colour and
  answers as "Japan proper" from any of them, in the hover and on a tap; the tip names
  it, because the name above the tip is the prefecture's. It is not outlined when
  chosen: forty-seven outlines are a grid, not a place.
* **Few places: the key is the list.** Up to `FEW` (8) rows, the key lists each place
  with its figure, highest first, each a press away (the South Seas and Kwantung are
  too small to aim at). Five classes cut from six figures say less than the figures.
  The colours are still the five-class ramp.
* **The whole the table prints** (`total`) is in the key under the places as well as
  in the card, named by `total.en` and the printed label: "Empire 帝國: 90,395,041 人".
  Where the places mapped do not add up to it, the card says what they add up to, which
  is how a reader sees that a 帝國 total leaves out Kwantung and the South Seas.
* **Parts and two-level headings** fold in the column menu by their first level, named
  from the English heading when it has the same levels. The place card lists the
  figures under the same headings.
* **Arrows** either side of the column (`‹ ›`) when the table has more than six
  columns or any series. They step through the column's series, oldest first when every
  column of it has a `date`; for a series of one, or no series, through its heading group.
* **One scale for a series.** Columns sharing a `series` (and a `kind`) are classed
  together, so stepping 1920 → 1935 changes a colour only when a figure moved. The key
  says so in one line.
* **How the classes are cut** is the reader's choice, in a dropdown under the key, left
  of About this table: Quantiles (the default: the same number of places in each),
  Natural Breaks (Fisher–Jenks, each cut the roundest number between the classes it
  divides), Equal Intervals, Logarithmic (cuts at 1, 2 or 5 times a power of ten, not
  offered where a figure is at or below nought). It goes into the address as `tk=`
  beside `t=`. A diverging column with both signs keeps its split round nought and has
  no dropdown. A series is cut once, by the chosen method, over all its columns.
* **No per-capita view** for territory tables: the map has censuses for prefectures only.
* **No figures written on the map** for whole territories: one figure belongs to one
  shape, and there is no shape for Japan proper as a whole. The key carries them.

## What the statistics site should send (proposed additions to spec v1)

All additive: `v` stays 1 and unknown fields are ignored by older code, except that a
map older than this reads `units: "territory"` as "a kind of table the map cannot draw
yet", with the source link. **Publish territory links only once the live map has this.**

1. **Rows are places.** Turn a table printed with places across the top. Columns that
   are not places or measures (期間, 年數, 區分) are not sent; what they say goes into
   the headings ("Rate of increase — 1920–1925 (5 years)").
2. **`units: "territory"`** for a table of the empire's parts, colonies alone included.
   Ids: `naichi` 内地, `chosen` 朝鮮, `taiwan` 臺灣, `karafuto` 樺太, `kwantung` 關東州 and
   關東州及鐵道附屬地 (keep the printed label: it says the railway zone is in), `nanyo`
   南洋 / 南洋群島. A prefecture id in such a table, or `naichi` in a prefecture table,
   is dropped and counted as not placed.
3. **The whole is `total`, never a row**: 帝國, 總數, 合計, 全國. Add **`total.en`**
   ("Empire", "Total"), and `mismatch` against the places sent. A printed row that is
   a measure (p0097_3's 總數 of vehicles) is a column, not a total.
4. **Every part in one payload.** `name` is "part — column" with ` — ` (spaced em dash),
   and `en` has the same levels: `"人口 — 大正9年"` / `"Population — 1920 (Taishō 9)"`.
   A heading flattened with a plain space (`増加數 大正14—昭和5`) must be split
   properly. Shortened labels are written out (`14` under 大正9年 is 大正14年).
5. **Each column its own `kind`, `unit`, `color`**: an increase that can fall is
   `color: "div"`; a rate is `kind: "rate"`.
6. **`series`** (new, optional): the same string on columns that are one measure at
   several dates and should share a scale: population 1920, 1925, 1930, 1935. Not across
   things that are not comparable: 5-year and 10-year rates are separate series.
7. **`cols[].date`** (new, optional, same form as `date`): the date the column's figures
   are for. It orders a series for the arrows and stops the key adding the table's date
   to a column that has its own.
8. **Cells**: a footnote mark is not part of the figure (`* 163.1` → `163.1`); its
   meaning goes into `notes`. `…` and `—` are `"-"`.
9. **`def`**: the column most worth seeing first. Where the places differ a hundredfold
   in size, a rate or a share, not a raw count: for p0041_1 the 1920–1935 rate of increase.
10. **`date`** is the latest date in the table; `period` as before.

## Tables of cities (`units: "city"`, the site's spec section 4b)

Each row is one of the map's own city ids (`data/cities-1930.csv`, `cities-1942.csv`),
looked up in the gazetteer of the table's `period` and then the other date's. The
ground is not painted, and the map keeps its own colours under the points.

* **Sizes or Colours**, the reader's choice in a dropdown under the key, left of the
  class dropdown (`ts=` in the address). Sizes are five classes as five sizes of circle
  in one colour; Colours are one 6 px dot on the five-colour ramp. The class dropdown
  cuts either. A count or an amount opens as Sizes, anything else (a rate, an index, a
  temperature, a figure per head) as Colours. Sizes are greyed out where a figure is
  below nought.
* **Proportional** is a fifth choice in the class dropdown under Sizes: a circle whose
  area is the figure, up to 22 px across the radius for the largest of the column or of
  its series. It is offered for a count or an amount, not per head. The key draws three
  circles at round figures under the largest. Circles are drawn largest first, so a
  small city in a large one's circle can still be pressed.
* **Every city in the table is drawn at every zoom**, whatever the city layer would show.
  Marks are scalables, so their size is screen pixels; their place is kept in Mercator
  as every scalable's is, so a projection change carries them.
* **Hover and press** answer with the city's name, the label as printed and the figure,
  before the ground under it.
* **Per head** where `pc` is true: divided by the city's own census (1920, 1930 or 1940)
  nearest the column's date or the table's, named in the key, the tip and the card. A
  city with no census figure is left out of that view.
* **`unplaced`** (printed names the site could not match), with any row whose id the map
  does not have: "N cities in the table are not on the map." in the key, with the names
  in the card and the CSV.
