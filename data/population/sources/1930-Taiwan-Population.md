# Taiwan at the end of 1930 — transcription

**昭和五年 臺灣總督府統計書** — 第35表 戶口靜態總表 and 第37表 地方別現住人口,
pp. 28–37 — <https://dl.ndl.go.jp/pid/1445212>. Published 1932; the figures are
those of the household registers at the end of 1930, which is why the map calls
them a *resident population* and not a census.

Two files, as they were handed over: this one for the colony and the eight
jurisdictions, and `1930-Taiwan-Districts.md` beside it for the seven 市 and
forty-five 郡.

## What the source counts, and where

The 1930 return puts the Indigenous Peoples — 「蕃人」 in its own word — in a
column of their own, and table 37's district figures leave them out. So the
86,154 counted in the Government-General's demarcated 「蕃地」 are counted there
and nowhere else, and three things follow:

* every 市 and 郡 figure is the population of exactly the ground this map gives
  that district, the 蕃地 being drawn as a shape apart;
* a prefecture is *larger* than its own districts added up, by that column
  exactly — checked below;
* the colony's four categories add with the 蕃人 once, not twice.

**The 1941 return does the opposite** and the note on `taiwan-1941.csv` says so:
there the 高砂族 of the 蕃地 are also counted in the district their ground lies
in, so the same shape carries a figure that is over its ground and a bit of
somebody else's.

## Checked against the source's own arithmetic

| check | |
|---|---|
| 內地人 + 本島人 + 蕃人 + 外國人 | 232,299 + 4,313,922 + 86,154 + 46,691 = **4,679,066**, the printed 總數 |
| the five 州 and three 廳 | sum to 4,679,066 exactly |
| 臺北州's 2 市 and 9 郡 | 933,483 = 939,021 − 5,538 蕃人 |
| 新竹州's 1 市 and 8 郡 | 669,382 = 681,552 − 12,170 |
| 臺中州's 1 市 and 11 郡 | 1,016,014 = 1,031,508 − 15,494 |
| 臺南州's 2 市 and 10 郡 | 1,180,005 = 1,181,569 − 1,564 |
| 高雄州's 1 市 and 7 郡 | 608,465 = 637,902 − 29,437 |
| every row | its four categories add to its own total |
| males per 100 females | computed from the printed 男 and 女; the colony comes to 105.01 and the 蕃人 to 102.10, which are the two the source prints |

The one row the source does not balance is 員林郡, and the transcription leaves
it as printed rather than mending it: 外國人男 405 + 外國人女 125 = 530 against a
printed 外國人總數 of 531. The row's own total and its four categories are
consistent, so nothing above turns on it.

## The areas

The statistical book has none. `area_km2` is the same measurement the 1941
dataset uses — the polygons this map draws, by spherical excess — because both
dates draw the same fifty-five shapes. The 蕃地 is given none, so no density is
drawn over it.

---

# Taiwan population, 1930 — transcription

Source: `1930 Population Tiawan.pdf`, pp. 28–29 of the scanned volume.

Scope: the portions of tables 35 and 36 for 昭和5年末 (end of 1930). The earlier annual rows in table 35 are outside the requested year and are not reproduced here. Numbers are transcribed as printed; commas have been added as thousands separators.

## Table 35. 戶口靜態總表 — 昭和5年 (1930)

### Population by category

| Category | Total | Male | Female | % of total residents | Males per 100 females |
|---|---:|---:|---:|---:|---:|
| 總數 | 4,679,066 | 2,396,730 | 2,282,336 | 100.00 | 105.01 |
| 內地人 | 232,299 | 125,238 | 107,061 | 4.96 | 116.98 |
| 本島人 | 4,313,922 | 2,195,472 | 2,118,450 | 92.20 | 103.64 |
| 蕃人 | 86,154 | 43,525 | 42,629 | 1.84 | 102.10 |
| 外國人 | 46,691 | 32,495 | 14,196 | 1.00 | 228.90 |

### 地方別 (regional breakdown, including 蕃人)

| 州及廳 | 總數 | 男 | 女 | 內地人 總數 | 內地人 男 | 內地人 女 | 本島人 總數 | 本島人 男 | 本島人 女 | 蕃人 總數 | 蕃人 男 | 蕃人 女 | 外國人 總數 | 外國人 男 | 外國人 女 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|:---|---:|---:|---:|---:|---:|
| 總數 | 4,679,066 | 2,396,730 | 2,282,336 | 232,299 | 125,238 | 107,061 | 4,313,922 | 2,195,472 | 2,118,450 | 86,154 | 43,525 | 42,629 | 46,691 | 32,495 | 14,196 |
| 臺北州 | 939,021 | 489,442 | 449,579 | 103,218 | 55,581 | 47,637 | 807,808 | 415,742 | 392,066 | 5,538 | 2,730 | 2,808 | 22,457 | 15,389 | 7,068 |
| 新竹州 | 681,552 | 346,192 | 335,360 | 12,395 | 6,538 | 5,857 | 655,015 | 332,278 | 322,737 | 12,170 | 6,013 | 6,157 | 1,972 | 1,363 | 609 |
| 臺中州 | 1,031,508 | 525,780 | 505,728 | 27,980 | 15,008 | 12,972 | 983,188 | 499,504 | 483,684 | 15,494 | 7,834 | 7,660 | 4,846 | 3,434 | 1,412 |
| 臺南州 | 1,181,569 | 602,664 | 578,905 | 39,967 | 21,758 | 18,209 | 1,132,134 | 574,606 | 557,528 | 1,564 | 831 | 733 | 7,904 | 5,469 | 2,435 |
| 高雄州 | 637,902 | 325,983 | 311,919 | 28,512 | 15,104 | 13,408 | 573,255 | 291,035 | 282,220 | 29,437 | 15,022 | 14,415 | 6,698 | 4,822 | 1,876 |
| 臺東廳 | 59,335 | 30,703 | 28,632 | 4,406 | 2,475 | 1,931 | 42,398 | 21,658 | 20,740 | 11,793 | 6,038 | 5,755 | 738 | 532 | 206 |
| 花蓮港廳 | 85,458 | 45,497 | 39,961 | 12,686 | 6,946 | 5,740 | 60,588 | 32,048 | 28,540 | 10,158 | 5,057 | 5,101 | 2,026 | 1,446 | 580 |
| 澎湖廳 | 62,721 | 30,469 | 32,252 | 3,135 | 1,828 | 1,307 | 59,536 | 28,601 | 30,935 | … | … | … | 50 | 40 | 10 |

## Table 36. 地方別現住人口 — 昭和5年末 (end of 1930)

This table excludes the 蕃人 column used in table 35; consequently its grand total is 86,154 lower than table 35.

| 州及廳 | 總數 | 男 | 女 | 內地人 總數 | 內地人 男 | 內地人 女 | 本島人 總數 | 本島人 男 | 本島人 女 | 外國人 總數 | 外國人 男 | 外國人 女 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 總數 | 4,592,912 | 2,353,205 | 2,239,707 | 232,299 | 125,238 | 107,061 | 4,313,922 | 2,195,472 | 2,118,450 | 46,691 | 32,495 | 14,196 |
| 臺北州 | 933,483 | 486,712 | 446,771 | 103,218 | 55,581 | 47,637 | 807,808 | 415,742 | 392,066 | 22,457 | 15,389 | 7,068 |
| 新竹州 | 669,382 | 340,179 | 329,203 | 12,395 | 6,538 | 5,857 | 655,015 | 332,278 | 322,737 | 1,972 | 1,363 | 609 |
| 臺中州 | 1,016,014 | 517,946 | 498,068 | 27,980 | 15,008 | 12,972 | 983,188 | 499,504 | 483,684 | 4,846 | 3,434 | 1,412 |
| 臺南州 | 1,180,005 | 601,833 | 578,172 | 39,967 | 21,758 | 18,209 | 1,132,134 | 574,606 | 557,528 | 7,904 | 5,469 | 2,435 |
| 高雄州 | 608,465 | 310,961 | 297,504 | 28,512 | 15,104 | 13,408 | 573,255 | 291,035 | 282,220 | 6,698 | 4,822 | 1,876 |
| 臺東廳 | 47,542 | 24,665 | 22,877 | 4,406 | 2,475 | 1,931 | 42,398 | 21,658 | 20,740 | 738 | 532 | 206 |
| 花蓮港廳 | 75,300 | 40,440 | 34,860 | 12,686 | 6,946 | 5,740 | 60,588 | 32,048 | 28,540 | 2,026 | 1,446 | 580 |
| 澎湖廳 | 62,721 | 30,469 | 32,252 | 3,135 | 1,828 | 1,307 | 59,536 | 28,601 | 30,935 | 50 | 40 | 10 |

## Reading notes

- The scan prints blanks/ellipsis marks for 澎湖廳 in the 蕃人 columns; these are preserved as `…`, not converted to zero.
- A few digits in the regional part of table 35 are faint. In particular, 臺北州 total/female and the 蕃人 figures were checked against both `male + female = total` and the sum of the four population categories.
- The printed total in table 36 intentionally differs from table 35 because table 36 omits 蕃人. This is not a transcription discrepancy.
