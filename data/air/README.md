# The air network: what each line was read from

`routes.csv`, `stops.csv`, `timetable.csv` and `fares.csv` are the four files
the map builds its air layer from. A route is one row in `routes.csv`; its
stops are rows in `stops.csv` in flying order; a service's calls are rows in
`timetable.csv`. `build_texts.py` refuses to build if a `seq` names a different
stop than the one it points at, if any journey runs backwards on (day, time),
if a route has a timetable and no `season` saying which sheet it came off, or
if a through fare is not the sum of its legs.

This file records the transcriptions, and — more to the point — **the places
where the drawn timetable says something the printed one does not**. Where a
time is inferred it is inferred here, in the open, and repeated in the route's
own note so that the reader of the map sees it too.

---

## China Airways Co. (中華航空株式會社), 1940

Source: the company's 1940 timetable brochure, at
<https://www.timetableimages.com/ttimages/ckkk/ckkk40c/ckkk3.jpg>.

The company was set up in December 1938, a joint concern of 大日本航空 and the
Japanese-sponsored governments at Peking and Nanking. Four lines are on this
sheet. All four are drawn on the 1942 map only, in China Airways' own ink
(`#2c6e63`).

The brochure prints place names in characters and gives no romanisation; the
romanisations below and in the CSVs are this project's, matched to the map's
own city records so a stop lands on the dot a reader can already press.

### 上海線 — Shanghai line · 毎日運航 (daily) → `china-shanghai`

| stop | southbound 着 / 發 | northbound 着 / 發 | 粁程 | 運賃 |
|---|---|---|---|---|
| 北京 Peking | — / 9.30 | 15.00 / — | | |
| 天津 Tientsin | *(blank)* | *(blank)* | 120 | 15 |
| 濟南 Tsinan | 11.10 / 11.30 | 13.00 / 13.20 | 280 | 45 |
| 徐州 Hsuchow | 12.30 / 12.40 | 11.50 / 12.00 | 280 | 40 |
| 南京 Nanking | 13.40 / 14.00 | 10.30 / 10.50 | 290 | 45 |
| 上海 Shanghai | 15.00 / — | — / 9.30 | 270 | 25 |

**Tientsin is inferred.** The sheet marks it as a call and prints no clock
against it. Drawn as 10.00/10.10 southbound and 14.20/14.30 northbound: with
the ten-minute stop the brochure gives every other call, that makes
Peking–Tientsin thirty minutes and Tientsin–Tsinan an hour, and it closes
exactly on the printed 11.10 at Tsinan and 15.00 at Peking. Symmetric both
ways, which is the reason to believe it.

### 包頭線 — Paotow line → `china-baotou`

北京ヨリ月、水、金　復 火、木、土 — out from Peking Mon/Wed/Fri, home Tue/Thu/Sat.
Aircraft: 中島式A.T.機 (Nakajima AT-2).

| stop | outward 着 / 發 | return 着 / 發 | 粁程 | 運賃 |
|---|---|---|---|---|
| 北京 Peking | — / 10.00 | 14.55 / — | | |
| 張家口 Kalgan | 11.10 / 11.20 | 13.35 / 13.45 | 170 | 25 |
| 大同 Tatung | 12.20 / 12.40 | 12.15 / 12.35 | 150 | 22 |
| 厚和 Kōwa | 13.50 / 14.00 | 10.55 / 11.05 | 170 | 25 |
| 包頭 Paotow | 14.55 / — | — / 10.00 | 135 | 19 |

厚和 is Hohhot: 歸綏 Kweisui under the Chinese republic, renamed 厚和豪特 by the
Mengchiang régime in 1937, which is the name the brochure prints. It is the
map's `hohhot` record.

### 大連線 — Dairen line · 北京ヨリ毎日運航 (daily) → `china-dairen`

Aircraft: ダグラス機 D.C.3.

| stop | outward 着 / 發 | return 着 / 發 | 粁程 | 運賃 |
|---|---|---|---|---|
| 北京 Peking | — / 8.30 | 16.00 / — | | |
| 天津 Tientsin | *(blank)* | *(blank)* | 120 | 15 |
| 大連 Dairen | 10.20 / — | — / 14.00 | 380 | 50 |

**Tientsin is inferred** here too, and more tightly: 500 km in 110 minutes
leaves very little slack. Drawn as 8.55/9.05 out and 15.25/15.35 back, the
flying time apportioned by the printed distances.

The brochure's diagram carries the line on past Dairen with arrows 至新京・至奉天
and 至京城 — Hsinking, Mukden and Keijō, where the Japanese trunk services took
it up.

### 南京—上海—漢口線 · 毎日運航 (daily) → `china-hankou`

Aircraft: ロッキード機. Three services on one line, each its own column on the
card.

**a) Nanking–Hankow, calling at Anking and Kiukiang**

| stop | 發 / 着 out | 着 / 發 back | 粁程 | 運賃 |
|---|---|---|---|---|
| 南京 Nanking | — / 9.00 | 14.50 / — | | |
| 安慶 Anking | 10.00 / 10.10 | 13.40 / 13.50 | 250 | 40 |
| 九江 Kiukiang | 10.40 / 10.50 | 13.00 / 13.10 | 130 | 25 |
| 漢口 Hankow | 11.40 / — | — / 12.10 | 180 | 35 |

**b) Shanghai–Hankow, over Nanking** — Shanghai 9.00 → Nanking 10.10/10.25 →
Hankow 12.50; back Hankow 13.20 → Nanking 15.45/16.00 → Shanghai 17.10.
Shanghai–Nanking 270 km / 35 圓; Nanking–Hankow 560 km / 100 圓.

**c) Nanking–Shanghai shuttle** — Nanking 10.00 → Shanghai 11.10; Shanghai
14.00 → Nanking 15.10. 270 km / 35 圓.

**安慶 is not romanised on the sheet**, and the identification rests on the
figures. Nanking → Anqing → Jiujiang → Hankou is the Yangtze in order, and the
brochure's distances match the real spacing to within five per cent: 250 km
against a great-circle 240, 130 against 134, 180 against 191, and Shanghai–
Nanking 270 against 270. The three legs also sum to the 560 km given for the
nonstop Nanking–Hankow, and their fares — 40 + 25 + 35 — to its 100. Nothing
about that closes if the stop is anywhere else.

The through service is drawn flying straight from Nanking to Hankow, because it
is nonstop; the stopping service follows the river through Anking and Kiukiang.

**Currency.** The fares above are the brochure's 圓, and they are *not* in
`fares.csv`: the card's fare table is headed "Yen", which these are not, so
recording them there would mislabel them. They are kept here and in each
route's note instead.

---

## China National Aviation Corporation (中國航空公司), c. 1933

Sources: the company's own timetable —
<https://www.timetableimages.com/ttimages/cnaca.htm> for the Yangtze services,
and <https://www.timetableimages.com/ttimages/cn33c.htm> for the Chungking and
Peiping routes.

CNAC was a joint concern of the Nationalist government's Ministry of
Communications and Pan American Airways. Three lines, drawn on the **1930**
map — the schedule is about 1933, which is the nearest one found, and three
years later than the sheet.

Shasi and Haichow are not on the map's city list and their stops carry a
coordinate and no `id`, which the file allows (Ulsan is the precedent).
Shasi 沙市 is 30.32 N, 112.24 E; Haichow 海州 is 34.57 N, 119.13 E, today
Lianyungang.

### Shanghai – Hankow → `cnac-shanghai-hankou`

Daily except Mondays (days 2–7), both ways.

| stop | down 着 / 發 | up 着 / 發 |
|---|---|---|
| 上海 Shanghai | — / 8.00 | 15.05 / — |
| 南京 Nanking | 10.15 / 10.30 | 12.35 / 12.50 |
| 安慶 Anking | 12.15 / 12.20 | 10.45 / 10.50 |
| 九江 Kiukiang | 13.20 / 13.35 | 9.30 / 9.45 |
| 漢口 Hankow | 15.05 / — | — / 8.00 |

The same four towns 中華航空 would be flying seven years later on the 1942
sheet — this is the network that one replaced.

### Hankow – Chungking → `cnac-hankou-chungking`

Out Wednesdays and Saturdays (3, 6).

| stop | out 着 / 發 | back 着 / 發 |
|---|---|---|
| 漢口 Hankow | — / 7.50 | 15.50 / — |
| 沙市 Shasi | 9.20 / 9.25 | 14.15 / 14.20 |
| 宜昌 Ichang | 10.10 / 10.25 | 13.15 / 13.30 |
| 萬縣 Wanhsien | 12.35 / 12.50 | 10.50 / 11.05 |
| 重慶 Chungking | 14.40 / — | — / 9.00 |

**The days it came home are unresolved.** The reading gives "Tuesday, Thursday
and Saturday (Day 2, 4, 7)", and those disagree: Saturday is day 6 and day 7 is
Sunday. Drawn on 2, 4, 6 — the spelled-out names — and it is worth revisiting,
because two departures a week against three returns does not balance either
way.

### Shanghai – Peiping → `cnac-shanghai-peiping`

Out Tuesdays, Thursdays and Saturdays (2, 4, 6); home Wednesdays, Fridays and
Sundays (3, 5, 7).

| stop | out 着 / 發 | back 着 / 發 |
|---|---|---|
| 上海 Shanghai | — / 7.00 | 16.00 / — |
| 海州 Haichow | 10.00 / 10.15 | 12.45 / 13.00 |
| 青島 Tsingtao | 11.35 / 11.50 | 11.10 / 11.25 |
| 天津 Tientsin | 15.00 / 15.15 | 7.45 / 8.00 |
| 北平 Peiping | 16.00 / — | — / 7.00 |

Peiping, not Peking: the capital had moved to Nanking in 1928 and the city was
renamed 北平, which is what the timetable prints.
