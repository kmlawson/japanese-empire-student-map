# 新京特別市及省別人口 — Manchukuo by province, 1943

**第一表 新京特別市及省別人口**, from 滿洲國『臨時國勢調査報告』p. 5 —
<https://dl.ndl.go.jp/pid/3459064/1/15>. The plate reproduced beside it,
**第一圖 新京特別市及省別人口密度**, is the density map at the front of the same
report.

The images are kept here: `images/1943-Manchukuo-table1-population.png` and
`images/1943-Manchukuo-fig1-density-map.png`.

The figures are of **1943**, for 新京特別市 and the nineteen provinces. The
areas are the report's own — 暫定面積, *provisional area*, in 方粁 (square
kilometres) to three decimal places — and so are the two derived columns,
女100對男數 (males per hundred females) and 人口密度 (people per square
kilometre).

## Checked against the source's own arithmetic

Everything in this table can be checked against something else in it, and all
of it holds:

| check | |
|---|---|
| the twenty rows, population | 43,202,880 — the printed 總數, exactly |
| male | 23,908,082, exactly |
| female | 19,294,798, exactly |
| area | 1,303,143.252 方粁, exactly, to the last of the three decimals |
| male + female = total | in every one of the twenty rows |
| 女100對男數 | recomputed from the printed 男 and 女, every row within 0.05 |
| 人口密度 | recomputed from the printed 人口 and 暫定面積, every row within 0.05 |

## The map draws fourteen of these provinces, not nineteen

**This is the thing to know before using the table.** The Manchukuo provinces
on this map are traced from 滿洲國地圖 1935, and Manchukuo had **fourteen**
provinces then. Five more had been made out of them by the time of this
report — 通化, 北安, 東安, 四平 and 牡丹江 — and none of them was cut from a
single parent, so there is no way to add them back into the fourteen from these
figures.

What follows from that:

* the **fourteen the map draws** hold 35,140,793 of the 43,202,880 — 81.3 per
  cent. The other 8,062,087 were in the five it does not draw and in 新京特別市;
* a province's figure here is the population of the **1943** province, and the
  shape the map gives it is the **1935** one, which for most of the southern and
  central provinces is the larger. The card says so;
* so the density is the report's own, worked out from the report's own area. It
  is not over the polygon, which would be the wrong ground.

The five the map does not draw are in the table as rows without a place, and say
so.

## 第一表

| | 暫定面積 (方粁) | 人口 總數 | 男 | 女 | 女100對男數 | 人口密度 |
|---|---:|---:|---:|---:|---:|---:|
| 總數 | 1,303,143.252 | 43,202,880 | 23,908,082 | 19,294,798 | 123.9 | 33.2 |
| 新京特別市 | 437.650 | 555,009 | 347,075 | 207,934 | 166.9 | 1,268.2 |
| 吉林省 | 83,206.977 | 5,608,922 | 3,069,143 | 2,539,779 | 120.8 | 67.4 |
| 龍江省 | 68,027.539 | 2,093,500 | 1,163,200 | 930,300 | 125.0 | 30.8 |
| 北安省 | 76,183.235 | 2,318,957 | 1,317,989 | 1,000,968 | 131.7 | 30.4 |
| 黑河省 | 118,898.851 | 149,887 | 114,782 | 35,105 | 327.0 | 1.3 |
| 三江省 | 90,417.827 | 1,415,633 | 851,964 | 563,669 | 151.1 | 15.7 |
| 東安省 | 41,397.042 | 512,240 | 336,044 | 176,196 | 190.7 | 12.4 |
| 牡丹江省 | 32,974.684 | 688,424 | 446,880 | 241,544 | 185.0 | 20.9 |
| 濱江省 | 63,859.780 | 4,234,206 | 2,369,337 | 1,864,869 | 127.1 | 66.3 |
| 間島省 | 30,133.646 | 848,197 | 467,163 | 381,034 | 122.6 | 28.1 |
| 通化省 | 31,704.970 | 982,387 | 603,356 | 379,031 | 159.2 | 31.0 |
| 安東省 | 26,506.018 | 2,231,507 | 1,170,787 | 1,060,720 | 110.4 | 84.2 |
| 四平省 | 30,400.908 | 3,005,070 | 1,631,812 | 1,373,258 | 118.8 | 98.8 |
| 奉天省 | 49,631.971 | 7,565,599 | 4,108,878 | 3,456,721 | 118.9 | 152.4 |
| 錦州省 | 40,162.303 | 4,317,822 | 2,240,001 | 2,077,821 | 107.8 | 107.5 |
| 熱河省 | 103,061.898 | 4,553,228 | 2,448,898 | 2,104,330 | 116.4 | 44.2 |
| 興安西省 | 73,934.124 | 763,701 | 428,118 | 335,583 | 127.6 | 10.3 |
| 興安南省 | 76,866.261 | 1,026,635 | 580,885 | 445,750 | 130.3 | 13.4 |
| 興安東省 | 109,107.255 | 199,530 | 120,317 | 79,213 | 151.9 | 1.8 |
| 興安北省 | 156,230.313 | 132,426 | 91,453 | 40,973 | 223.2 | 0.8 |

## 第一圖, and the classes the map draws

The report's own plate shades the provinces in six steps, and the map uses the
first five of them rather than fitting a ladder of its own — the point of a
choropleth over a source that drew one is to draw the source's:

| the plate | |
|---|---|
| 5人未滿 | under 5 to the square kilometre |
| 5人以上 | 5 and over |
| 20人以上 | 20 and over |
| 40人以上 | 40 and over |
| 100人以上 | 100 and over |
| 1,268.2人 | 新京特別市 alone |

The sixth is one city, and this map draws 新京 as a point rather than as an
area, so five classes cover every shape it shades. All five are used: 黑河
(1.3), 興安北 (0.8) and 興安東 (1.8) in the first; 興安西, 興安南 and 三江 in the
second; 間島 and 龍江 in the third; 熱河, 濱江, 吉林 and 安東 in the fourth;
錦州 (107.5) and 奉天 (152.4) in the fifth.
