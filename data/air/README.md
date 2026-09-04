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

---

## CNAC again, October 1940 — on the 1942 map

Source: the company's own timetable of October 1940. No scan is linked: the
times were supplied by the author and the sheet has not been re-read here, so
`source_url` is left blank rather than pointed at something that has not been
checked.

### Chungking – Rangoon → `cnac-chungking-rangoon`

Out Mondays, home Tuesdays. Douglas.

| stop | out 着 / 發 | back 着 / 發 |
|---|---|---|
| 重慶 Chungking | — / 7.30 | 15.10 / — |
| 昆明 Kunming | 10.10 / 10.40 | 12.00 / 12.30 |
| 臘戌 Lashio | 13.10 / 13.40 | 9.00 / 9.30 |
| 仰光 Rangoon | 16.40 / — | — / 6.00 |

### Chungking – Chengtu → `cnac-chungking-chengtu`

**Two schedules on one line**, carried as two services so both animate:

* Mondays, Tuesdays, Wednesdays, Fridays and Saturdays — out 10.00, in 11.30;
  back 12.00, in 13.30.
* Thursdays and Sundays — out 10.00, in 11.20; back 12.00, in 13.20.

### Chungking – Kiating → `cnac-chungking-kiating`

Mondays and Thursdays, both ways.

| stop | out 着 / 發 | back 着 / 發 |
|---|---|---|
| 重慶 Chungking | — / 12.00 | 11.30 / — |
| 瀘州 Luchow | 13.00 / 13.15 | 10.15 / 10.30 |
| 宜賓 Suifu | 14.00 / 14.30 | 9.00 / 9.30 |
| 樂山 Kiating | 15.30 / — | — / 8.00 |

Suifu is Yibin and Kiating is Leshan; neither is on the map's city list, so
their stops carry a coordinate of their own — Suifu 28.77 N, 104.62 E; Kiating
29.56 N, 103.76 E.

---

## CNAC's coast line, 1935 times — on the 1930 map

Source: the company's 1935 timetable. `source_url` is blank: the times were
supplied and the sheet has not been re-read here.

### Shanghai – Canton → `cnac-shanghai-canton`

**In operation from October 1933; these times are from 1935**, so the line is
two years older than the schedule drawn for it. Said on the card.
Southbound Tuesdays and Fridays; northbound Thursdays and Sundays.

| stop | south 着 / 發 | north 着 / 發 |
|---|---|---|
| 上海 Shanghai | — / 6.30 | 15.00 / — |
| 溫州 Wenchow | 8.25 / 8.45 | 12.45 / 13.05 |
| 福州 Foochow | 10.05 / 10.25 | 11.05 / 11.25 |
| 廈門 Amoy | 11.35 / 11.55 | 9.35 / 9.55 |
| 汕頭 Swatow | 12.55 / 13.15 | 8.15 / 8.35 |
| 廣州 Canton | 15.00 / — | — / 6.30 |

Every treaty port down a coast that had no through railway, which is the point
of the service.

### Named and not drawn

The Shanghai–Peiping sheet lists two later additions flown from Chungking:
**Chungking–Chengtu**, which is on the 1942 map here from the October 1940
timetable, and **Chungking–Kweiyang**, for which no times have been found. The
Peiping card says both.

---

## Manchuria Aviation Company (満洲航空株式会社), winter 1935 — on the 1942 map

Source: <https://www.timetableimages.com/ttimages/mkkk35.htm>. Seven years
earlier than the sheet they are drawn on; each card says so.

### Manchouli – Shinkyō → `mkkk-manchouli-hsinking`

| stop | south 着 / 發 | north 着 / 發 | 粁 |
|---|---|---|---|
| 満洲里 Manchouli | — / 9.30 | 14.50 / — | |
| 海拉爾 Hailar | 10.25 / 10.35 | 13.40 / 13.50 | |
| 斉斉哈爾 Tsitsihar | 12.50 / 13.00 | 11.00 / 11.10 | |
| 哈爾濱 Harbin | 14.20 / 14.30 | 9.10 / 9.20 | |
| 新京 Shinkyō | 15.35 / — | — / 8.00 | |

**Two services, not one.** Tsitsihar–Harbin–Shinkyō runs daily; beyond
Tsitsihar to Hailar and Manchouli it is twice a week — southbound Tuesdays and
Fridays, northbound Mondays and Thursdays. Carried as two services with
non-overlapping days (the whole line on 2/5 south and 1/4 north; the inner
portion on the other five days each way) so that exactly one aeroplane works
the Tsitsihar–Shinkyō stretch on any given day, which is what "daily" means.

Measured: beyond Tsitsihar days 1, 2, 4, 5; inner portion all seven.

### Harbin – Dairen → `mkkk-harbin-dairen`

Daily both ways.

| stop | south 着 / 發 | north 着 / 發 |
|---|---|---|
| 哈爾濱 Harbin | — / 10.00 | 14.50 / — |
| 新京 Shinkyō | 11.15 / 11.25 | 13.30 / 13.40 |
| 奉天 Mukden | 12.55 / 13.05 | 11.55 / 12.05 |
| 大連 Dairen | 14.50 / — | — / 10.00 |

### Shinkyō – Shingishū, for Tokyo → `mkkk-hsinking-shingishu`

Daily except Mondays. Shinkyō 4.00 → Mukden 5.40 / 6.00 → Shingishū 7.15,
where the Japanese carrier took the aeroplane on down the peninsula.

**Southbound only.** The service ran both ways; the reading gives one
direction, so the map flies it one way rather than inventing the other.

**And it lies on top of an existing line.** The untimed `manchuria` route —
Shingishū–Hōten–Shinkyō, from the 1938–39 Japanese timetable — is the same
three cities. Both are drawn and both notes now say so. Worth a decision: the
untimed one is a candidate for retiring now that this corridor has times.

---

## One KNILM line that leaves the Indies

`knilm-tarakan-manila` — Tarakan across the Sulu Sea to Manila, from the same
c. 1935 route map as the other twenty-five, and like them **no times**: the
source is a route map, not a timetable. The only KNILM line on this map that
ends outside the Dutch East Indies, and the only one that touches American
territory. Both ends were Japanese by the end of January 1942, eleven months
before the sheet it is drawn on.

---

## Two more on the 1930 map: the Philippines and Siam

### PATCO, Manila – Baguio → `patco-manila-baguio`

Source: <https://www.timetableimages.com/ttimages/patco.htm>, an undated
brochure of about the mid-1930s. Daily. Manila 6.30 → Baguio 7.30; Baguio 7.40
→ Manila 8.40.

The card also names what the map does **not** draw, so that one line is not
mistaken for the whole of Philippine aviation: Manila–Paracale by 1937;
INAEC's Manila–Iloilo, Manila–Iloilo–Davao and Iloilo–Bacolod by 1939;
Paracale–Legaspi on Philippine Air Lines, Inc. by 1941. (The reading gave
"INEAC"; written here as **INAEC**, the Iloilo–Negros Air Express Company.)

### Aerial Transport Company of Siam → `siam-korat-nakhonphanom`

Source: <https://www.timetableimages.com/ttimages/siam.htm>, 1933.
**One route, two services**, rather than two routes: the short working
overflies Roi Et, so a second route would have drawn the Khon Kaen–Udon Thani
leg twice, one line on top of the other. As services, the short one is drawn
flying straight where the long one bends — which is what it did.

| stop | out 着/發 | back 着/發 |
|---|---|---|
| Korat | — / 7.00 | 12.40 / — |
| Roi Et | 8.40 | 11.20 |
| Khon Kaen | 9.40 | 10.20 |
| Udon Thani | 10.50 | 9.15 |
| Nakhon Phanom | 12.40 / — | — / 7.00 |

Out Wednesdays, home Thursdays, overnighting at Nakhon Phanom.

The short circuit, Mondays both ways: Korat 7.00 → Khon Kaen 8.35 → Udon Thani
9.20; back 11.00 → 12.00 → 13.15, an hour and forty on the ground.

**One time per intermediate stop, not two.** The source does not record how
long the aeroplane stood at Roi Et or Khon Kaen, so it is drawn arriving and
leaving at the same minute rather than having a dwell invented for it.

Roi Et, Khon Kaen, Udon Thani and Nakhon Phanom are not on the map's city list
and carry their own coordinates.

---

## Indian National Airways

Source for all three: <https://www.timetableimages.com/ttimages/id.htm>.
**All times are Indian standard time.** Every line on this map keeps the local
time of the country that flew it, so the animation's single dial is right for
reading one service and wrong for timing a connection between two networks.

### 10 December 1933, on the 1930 map

**Calcutta – Rangoon** → `ina-calcutta-rangoon`. East on Tuesdays, west on
Fridays; one machine out and back.

| stop | east 着 / 發 | west 着 / 發 |
|---|---|---|
| Calcutta | — / 7.00 | 16.15 / — |
| Chittagong | 9.30 / 9.50 | 13.39 / 13.59 |
| Akyab | 12.00 / 12.45 | 11.20 / 12.05 |
| Bassein | 15.45 / 16.10 | 8.00 / 8.20 |
| Rangoon | 17.15 / — | — / 7.00 |

**Calcutta – Dacca** → `ina-calcutta-dacca`. Two schedules, two circuits:
weekdays out 7.00 arriving 8.52 and back 11.32 arriving 13.03; Sundays the
homeward leg only, Dacca 16.00 arriving 17.31.

### November 1938, on the 1942 map

**Delhi – Karachi** → `ina-delhi-karachi`, and neither service is the other
reversed:

* *Delhi – Karachi.* Down Sundays, Tuesdays and Thursdays: Delhi 11.45, Lahore
  13.20/14.00, Multan 15.15/15.30, Jacobabad 17.00/17.30, Karachi 19.10. Up
  Mondays, Wednesdays and Thursdays: Karachi 5.45, Jacobabad 7.25/8.00, Multan
  9.30/9.45, Lahore 11.00/11.30, Delhi 13.05.
* *Lahore – Karachi.* Down Wednesdays and Saturdays: Lahore 11.00, Multan
  13.00/13.15, Jacobabad 15.45/16.00, Karachi 19.00. Up Sundays and Tuesdays:
  Karachi 5.30, Jacobabad 8.30/8.45, Multan 11.15/11.30, Lahore 13.30.

Measured: something is in the air on every day but Friday, which is what the
two services between them give.

Multan and Jacobabad are not on the map's city list and carry their own
coordinates.

---

## The European lines

### Air Orient, summer 1931 — on the 1930 map

`airorient-jask-saigon`, from
<https://www.timetableimages.com/ttimages/airori.htm>. The eastern half of the
Marseilles–Saigon service: Jask, Karachi, Allahabad, Calcutta, Rangoon,
Bangkok, Saigon, one stage a day.

**The times are not in the source**, which gives a day of the week at each stop
and no clock. Drawn leaving at 08:00 and taking as long as the distance needs
at **180 km/h** — the median block speed of the 266 timed legs already on this
map, and right for the aeroplanes of 1931. Every call says so in its
`frequency`, so the caveat reaches the aeroplane card too.

Westbound the source's days are matched exactly. Eastbound it puts the Saigon
arrival on the Sunday, one day later than a stage-a-day schedule reaches it.

Jask is at 57°E and the frame begins at 66°, so the line runs to the edge and
the marker there is where it leaves rather than a place — the same treatment
the KLM trunk already had.

### Imperial Airways, 16 May 1931 — on the 1930 map

`iaw-karachi-delhi`. Real times throughout. Jask (57°E) and Gwadar (62°E) are
both off the western edge, so only Karachi–Jodhpur–Delhi is drawn; the Karachi
card still carries the true arrival from Gwadar at 15:35 and the departure for
it at 08:30.

### Air France, 1938 — on the 1942 map

`airfrance-karachi-hongkong` and the inland branch
`airfrance-bangkok-hanoi`. Times assumed the same way, at **320 km/h**, the
Dewoitine 338's cruise. A day is a stage with several hops in it: inside a day
the aeroplane flies on after a twenty-minute turn-round rather than starting
again at eight.

**Grounded from Bangkok** on the main line and **end to end** on the branch:
Japanese forces entered Indochina in September 1940 and Thailand in December
1941, and Air France was not flying there by the date the map shows.

### Imperial Airways, August 1939 — on the 1942 map

`iaw39-karachi-darwin` and `iaw39-karachi-calcutta`. Real times, except the
Calcutta arrival on the first, which the sheet marks only as a night stop:
17:10 is Allahabad's 13:05 departure plus what the leg needs at the speed the
day's other stages imply, about 190 km/h.

**Grounded from Akyab** — one stop west of Rangoon, not at it, because a leg
that *lands* at Rangoon is as impossible as one that leaves it.

## The July 1942 sheet: 満洲航空 and 中華航空 as reprinted that summer

Source: the aviation pages (118–121) of a Japanese railway timetable for July 1942 (昭和17年7月號), photographed by the project. Page 118 is the 航空案内 (rules, booking offices, a 日滿支 fare matrix); 119–120 carry 滿洲航空 tables stamped 昭和17.6.1改正; 121 carries 中華航空 tables stamped 昭和17.4.1改正. The reading is in the Korea 1938 project as `manchuria1942.7/air_1942_7.md`, and `air_rows.py` beside it writes these rows.

**Every row from this sheet is marked.** Route ids begin `mkkk42-` or `cak42-`, the operator string ends "· July 1942 sheet" / "· April 1942 sheet", the `season` names the 改正 stamp, and the two companies get their own inks (`#b5473a`, `#4a9a88`) beside the winter-1935 (`#8c2f39`) and 1940 (`#2c6e63`) lines already drawn, so that where the sheets overlap — Shinkyō–Mukden–Dairen, Shinkyō–Manchouli, Peking–Dairen, Peking–Paotow, Shanghai–Hankow — a reader can see which sheet a line came off. Nothing from the earlier sheets was removed.

**運休.** A table headed 運休 instead of a 改正 stamp is a suspended service. Those are carried with the printed times, `grounded_from` their first stop, so they draw dimmed and fly nothing.

**Places.** Stops that are cities of the map carry the city id and sit on its dot. The frontier towns of the Sungari, Ussuri and Amur lines (Tumen, Hunchun, Tungliao, Kailu, Lintung, Linhsi, Peian, Sunwu, Fuchin, Paoching, Jaoho, Hutou, Hulin, Tungan, Tungho, Ilan, Foshan, Wuyun, Huma, Oupu, Mohe, Lopei, Tungkiang, Fuyuan, Paichengtzu, Huanjen, Chian, Hsiuyen, Chungkiangchen, Tungning, Chining, Fenghsiangchen, Yüncheng, Hsinhsiang) are not, and carry coordinates of this project's own to two decimals; Oupu, Wuyun, Lopei and Fenghsiangchen are approximate.

**Days.** Where the sheet gives days of the week they are on the service rows (`down_days` / `up_days`); 每日運航 is all seven. Times are as printed, 24-hour, local.

### 新京・東京間直通 — Shinkyō – Tokyo, through service → `mkkk42-hsinking-tokyo`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 9.00 | 16.30 / — |
| 東京 Tokyo | 1600 | 265 | 265 | 15.00 / — | — / 9.00 |

Mondays, Tuesdays, Thursdays and Fridays.

**July 1942 sheet** (昭和17年6月1日改正). The through service to Tokyo, tabled nonstop: Shinkyō 9.00, Tokyo 15.00; back Tokyo 9.00, Shinkyō 16.30, four days a week. 1,600 km for 265 yen. The sheet prints no intermediate call, so none is drawn; the Japan Airways lines on this map show the ground it flew over.

### 新京・奉天・京城間 — Shinkyō – Mukden – Keijō → `mkkk42-hsinking-keijo`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 7.30 | 16.40 / — |
| 奉天 Mukden (Shenyang) | 270 | 26 | 26 | 8.40 / 9.00 | 15.10 / 15.30 |
| 京城 Keijō (Seoul) | 840 | 90 | 64 | 11.10 / — | — / 13.00 |

Out Tuesdays and Fridays; back Wednesdays and Saturdays.

**July 1942 sheet** (昭和17年6月1日改正). Two days a week each way to the Korean capital: out Tuesdays and Fridays, back Wednesdays and Saturdays. This is the Manchurian carrier flying into Korea; the Japan Airways Keijō–Shinkyō line of 1938–39 is the same corridor from the other side.

### 新京・奉天・大連間 — Shinkyō – Mukden – Dairen → `mkkk42-hsinking-dairen`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 12.20 | 11.55 / — |
| 奉天 Mukden (Shenyang) | 270 | 26 | 26 | 13.40 / 13.50 | 10.30 / 10.40 |
| 大連 Dairen (Dalian) | 625 | 58 | 32 | 15.20 / — | — / 9.00 |

Mondays, Wednesdays and Fridays.

**July 1942 sheet** (昭和17年6月1日改正). Three days a week, an afternoon run south and a morning run north. The winter-1935 Harbin–Dairen line on this map is the same trunk seven years earlier, daily and from Harbin; by 1942 the northern leg is the daily Shinkyō–Harbin–Kiamusze service.

### 奉天・安東・大連間 — Mukden – Antung – Dairen, by the Yalu → `mkkk42-mukden-antung-dairen`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 奉天 Mukden (Shenyang) |  |  |  | — / 10.20 | 14.25 / — |
| 桓仁 Huanjen (Huanren) | 175 | 17 | 17 | 11.20 / 11.25 | 13.10 / 13.15 |
| 通化 Tunghua (Tonghua) | … |  | 7 | 11.55 / 12.05 | 12.30 / 12.40 |
| 輯安 Chian (Ji'an) | … |  | 7 | 12.35 / 12.40 | 11.55 / 12.00 |
| 安東 Antung (Dandong) | 495 | 55 | 24 | 14.00 / 14.10 | 10.25 / 10.35 |
| 岫巖 Hsiuyen (Xiuyan) | … |  | 10 | — / — | — / — |
| 大連 Dairen (Dalian) | 800 | 86 | 21 | 15.55 / — | — / 8.50 |

Out Mondays, Wednesdays and Fridays; back Tuesdays, Thursdays and Saturdays.

**July 1942 sheet** (昭和17年6月1日改正). Flights 21 and 22: Mukden east into the mountains, down the Yalu through Chian to Antung, then west along the coast to Dairen. 岫巖 Hsiuyen is tabled (590 km, 65 yen) and passed without a call both ways (レ). Out Mondays, Wednesdays and Fridays; back Tuesdays, Thursdays and Saturdays.

### 新京・哈爾濱・佳木斯間 — Shinkyō – Harbin – Kiamusze → `mkkk42-hsinking-kiamusze`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 12.10 | 11.40 / — |
| 哈爾濱 Harbin | 250 | 22 | 22 | 13.15 / 13.25 | 10.25 / 10.35 |
| 佳木斯 Kiamusze (Jiamusi) | 555 | 72 | 50 | 14.45 / — | — / 9.00 |

Daily.

**July 1942 sheet** (昭和17年6月1日改正). Flights 1 and 2, daily: the capital to Harbin and on down the Sungari to Kiamusze, the hub of the eastern lines. Northbound is a morning flight, southbound an afternoon one.

### 奉天・天津・北京間 — Mukden – Tientsin – Peking → `mkkk42-mukden-peking` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 奉天 Mukden (Shenyang) |  |  |  | — / 9.00 | 15.50 / — |
| 天津 Tientsin (Tianjin) | … | 66 | 66 | 11.40 / 11.45 | 13.25 / 13.30 |
| 北京 Peking (Beijing) | … | 86 | 20 | 12.25 / — | — / 12.45 |

Daily.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 13 and 14, tabled daily: Mukden 9.00, Tientsin 11.40, Peking 12.25; back 12.45, 13.25 / 13.30, 15.50. The sheet prints the Tientsin distance as 250 km, which the fares (66 yen, against 86 to Peking at 855 km) say is a misprint for something near 750; the distance is left off that leg.

### 奉天・承德間 — Mukden – Chinchow – Chengteh → `mkkk42-mukden-chengteh` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 奉天 Mukden (Shenyang) |  |  |  | — / 9.20 | 15.55 / — |
| 錦州 Chinchow (Jinzhou) | 200 | 20 | 20 | 10.30 / 10.40 | 14.40 / 14.50 |
| 承德 Chengteh (Chengde) | 480 | 48 | 28 | 12.20 / — | — / 13.15 |

Daily.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 11 and 12, tabled daily, to the old summer capital in Jehol.

### 承德・張家口・包頭間 — Chengteh – Kalgan – Paotow → `mkkk42-chengteh-paotow` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 承德 Chengteh (Chengde) |  |  |  | — / 12.40 | 12.45 / — |
| 張家口 Kalgan (Zhangjiakou) | 255 | 36 | 36 | 14.20 / 14.35 | 11.10 / 11.25 |
| 大同 Tatung (Datong) | … |  | 28 | 15.30 / 15.40 | 10.10 / 10.20 |
| 厚和 Houho (Hohhot) | … |  | 32 | 16.45 / 16.50 | 9.15 / 9.20 |
| 包頭 Paotow (Baotou) | 710 | 121 | 25 | 17.40 / — | — / 8.30 |

Out Tuesdays and Saturdays; back Wednesdays and Sundays.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 50 and 51 across Inner Mongolia: out Tuesdays and Saturdays in the afternoon, back Sundays and Wednesdays in the morning. 厚和 is Houho (Kweisui, today Hohhot) under its Mengchiang name. The China Airways Peking–Paotow line covers the same three western stops.

### 新京・赤峰間 — Shinkyō – Chihfeng, for Chengteh → `mkkk42-hsinking-chihfeng`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 8.40 | 14.10 / — |
| 通遼 Tungliao (Tongliao) | 240 | 29 | 29 | 10.10 / 10.20 | 12.30 / 12.40 |
| 開魯 Kailu | … |  | 12 | 10.55 / 11.00 | 11.50 / 11.55 |
| 林東 Lintung (Lindong) | … |  | 24 | 12.05 / 12.10 | 10.50 / 10.55 |
| 林西 Linhsi (Linxi) | … |  | 15 | 13.00 / 13.05 | 10.00 / 10.05 |
| 赤峰 Chihfeng (Chifeng) | 755 | 102 | 22 | 14.05 / — | — / 9.00 |
| 承德 Chengteh (Chengde) | 925 | 124 | 22 | — / — | — / — |

Out Thursdays; back Fridays.

**July 1942 sheet** (昭和17年6月1日改正). Flights 15 and 16, once a week: out Thursdays, back Fridays, across the Mongol banners of western Manchukuo. Chengteh is tabled beyond Chihfeng (925 km, 124 yen) with no times at all, so that leg is drawn and not flown.

### 新京・通化・中江鎮間 — Shinkyō – Tunghua – Chungkiangchen → `mkkk42-hsinking-linkiang` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 8.40 | 14.20 / — |
| 通化 Tunghua (Tonghua) | 265 | 32 | 32 | 10.40 / 10.50 | 12.20 / 12.30 |
| 中江鎮 Chungkiangchen (Linjiang) | 350 | 42 | 10 | 11.30 / — | — / 11.35 |

Mondays, Wednesdays and Fridays.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 7 and 8, tabled Mondays, Wednesdays and Fridays, to 中江鎮 on the upper Yalu (Linkiang), opposite Korea.

### 新京・圖們・琿春間 — Shinkyō – Yenki – Tumen – Hunchun → `mkkk42-hsinking-hunchun` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 8.40 | 13.30 / — |
| 延吉 Yenki (Yanji) | 375 | 37 | 37 | 10.20 / 10.25 | 11.50 / 11.55 |
| 圖們 Tumen | … |  | 5 | 10.40 / 10.50 | 11.25 / 11.35 |
| 琿春 Hunchun | 440 | 49 | 7 | 11.05 / — | — / 11.10 |

Tuesdays, Thursdays and Saturdays.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 9 and 10, tabled Tuesdays, Thursdays and Saturdays, to the Tumen corner where Manchukuo, Korea and the Soviet Union meet.

### 牡丹江・東寧間 — Mutankiang – Suifenho – Tungning → `mkkk42-mutankiang-tungning`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 牡丹江 Mutankiang (Mudanjiang) |  |  |  | — / 10.30 | 13.30 / — |
| 綏芬河 Suifenho (Suifenhe) | 125 | 18 | 18 | 11.25 / 11.30 | 12.25 / 12.30 |
| 東寧 Tungning (Dongning) | 175 | 25 | 7 | 11.55 / — | — / 12.00 |

Mondays, Wednesdays and Fridays.

**July 1942 sheet** (昭和17年6月1日改正). Flights 23 and 24, Mondays, Wednesdays and Fridays: a short morning hop to the Soviet frontier and back, timed to connect at Mutankiang with the daily Shinkyō–Harbin service, which stands there from 10.05 to 15.10.

### 新京・滿洲里間 — Shinkyō – Tsitsihar – Hailar – Manchouli → `mkkk42-hsinking-manchouli` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 8.40 | 14.10 (day 2) / — |
| 白城子 Paichengtzu (Baicheng) | 270 | 28 | 28 | 10.10 / 10.15 | 12.40 (day 2) / 12.45 (day 2) |
| 齊齊哈爾 Tsitsihar (Qiqihar) | … |  | 22 | 11.25 / 11.35 | 11.25 (day 2) / 11.35 (day 2) |
| 海拉爾 Hailar | … |  | 48 | 13.50 / 9.40 (day 2) | 12.25 / 9.30 (day 2) |
| 滿洲里 Manchouli (Manzhouli) | 1065 | 119 | 21 | 11.00 (day 2) / — | — / 11.10 |

Out Mondays, Wednesdays and Fridays; back Tuesdays, Thursdays and Saturdays; a night at Hailar each way.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 5 and 6, a two-day journey each way with the night at Hailar: out Mondays, Wednesdays and Fridays as far as Hailar, on to Manchouli the next morning; back on Tuesdays, Thursdays and Saturdays. The winter-1935 Manchouli–Shinkyō line on this map is the same route by way of Harbin; by 1942 it ran by Paichengtzu instead.

### 哈爾濱・海拉爾間 — Harbin – Tsitsihar – Hailar → `mkkk42-harbin-hailar`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 哈爾濱 Harbin |  |  |  | — / 8.30 | 13.20 / — |
| 齊齊哈爾 Tsitsihar (Qiqihar) | 275 | 27 | 27 | 10.10 / 10.20 | 11.35 / 11.45 |
| 海拉爾 Hailar | 685 | 75 | 48 | 12.30 / — | — / 9.30 |

Out Thursdays; back Fridays.

**July 1942 sheet** (昭和17年6月1日改正). Once a week: out Thursdays, back Fridays. With the Shinkyō–Manchouli line suspended this was the only tabled service to the Barga steppe in July 1942.

### 哈爾濱・黑河間 — Harbin – Peian – Sunwu – Heiho → `mkkk42-harbin-heiho`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 哈爾濱 Harbin |  |  |  | — / 8.20 | 15.20 / — |
| 北安 Peian (Bei'an) | 275 | 28 | 28 | 9.55 / 10.00 | 13.45 / 13.50 |
| 孫呉 Sunwu | … |  | 14 | 10.50 / 10.55 | 12.45 / 12.50 |
| 黑河 Heiho (Heihe) | 565 | 57 | 15 | 11.40 / — | — / 12.00 |

Mondays, Wednesdays and Fridays.

**July 1942 sheet** (昭和17年6月1日改正). Flights 17 and 18, Mondays, Wednesdays and Fridays, north to the Amur opposite Blagoveshchensk. The sheet tables the line as a circuit going on from Heiho by Nunkiang and Tsitsihar back to Harbin (1,320 km, 137 yen) but prints no times beyond Heiho, so only the timed arm is drawn.

### 新京・牡丹江・哈爾濱間 — Shinkyō – Mutankiang – Harbin → `mkkk42-hsinking-mutankiang-harbin`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 新京 Xinjing (Changchun) |  |  |  | — / 8.30 | 16.45 / — |
| 牡丹江 Mutankiang (Mudanjiang) | 380 | 54 | 54 | 10.05 / 15.10 | 10.10 / 15.00 |
| 哈爾濱 Harbin | 630 | 84 | 30 | 16.40 / — | — / 8.40 |

Daily.

**July 1942 sheet** (昭和17年6月1日改正). Flights 26 and 25, daily: a morning leg to Mutankiang, a five-hour stand while the Tungning and Paoching feeders go out and come back, and an afternoon leg on. The two halves are printed in separate columns on the sheet and are one aeroplane here.

### 牡丹江・東安・寶清間 — Mutankiang – Tungan – Paoching → `mkkk42-mutankiang-paoching`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 牡丹江 Mutankiang (Mudanjiang) |  |  |  | — / 10.30 | 14.40 / — |
| 鷄寧 Chining (Jixi) | 180 | 21 | 21 | 11.15 / 11.20 | 13.45 / 13.50 |
| 東安 Tungan (Mishan) | … |  | 11 | 11.50 / 11.55 | 13.10 / 13.15 |
| 寶清 Paoching (Baoqing) | 325 | 46 | 14 | 12.30 / — | — / 12.35 |

Tuesdays, Thursdays and Saturdays.

**July 1942 sheet** (昭和17年6月1日改正). Tuesdays, Thursdays and Saturdays, out and back in a day, connecting at Mutankiang with the daily Shinkyō–Harbin service. 東安 Tungan is Mishan under its Manchukuo name; 鷄寧 Chining is Jixi.

### 富錦・虎頭・東安間 — Fuchin – Jaoho – Hutou – Hulin – Tungan → `mkkk42-fuchin-tungan`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 富錦 Fuchin (Fujin) |  |  |  | — / 8.00 | 16.40 / — |
| 饒河 Jaoho (Raohe) | 215 | 34 | 34 | 9.35 / 9.45 | 14.50 / 15.00 |
| 虎頭 Hutou | … |  | 14 | 10.40 / 10.45 | 13.55 / 14.00 |
| 虎林 Hulin | … |  | 9 | 11.20 / 11.25 | 13.15 / 13.20 |
| 東安 Tungan (Mishan) | … | 70 | 13 | 12.15 / — | — / 12.25 |

Tuesdays and Saturdays.

**July 1942 sheet** (昭和17年6月1日改正). Tuesdays and Saturdays, down the Ussuri frontier from the Sungari to Tungan (Mishan). The sheet prints no distance for Hulin; 445 km end to end.

### 佳木斯・寶清・饒河間 — Kiamusze – Paoching – Fuchin – Jaoho → `mkkk42-kiamusze-jaoho`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 佳木斯 Kiamusze (Jiamusi) |  |  |  | — / 9.10 | 14.50 / — |
| 寶清 Paoching (Baoqing) | 150 | 23 | 23 | 10.15 / 10.20 | 13.40 / 13.45 |
| 富錦 Fuchin (Fujin) | … |  | 19 | 10.55 / 11.00 | — / — |
| 饒河 Jaoho (Raohe) | … | 86 | 44 | 12.35 / — | — / 12.40 |

Tuesdays, Thursdays and Saturdays.

**July 1942 sheet** (昭和17年6月1日改正). Tuesdays, Thursdays and Saturdays, and printed as a zigzag: Kiamusze to Paoching (150 km, 23 yen), north to Fuchin (95 km, 19), back through Paoching (11.35 / 11.40, 19 yen) and on to Jaoho (25 yen; no distance printed). The return calls at Paoching only (13.40 / 13.45) and passes Fuchin (レ). The map draws each stop once, so the second Paoching call is on this note and the Fuchin–Jaoho leg carries the two fares together (44 yen).

### 哈爾濱・佳木斯・富錦間 — Harbin – Ilan – Kiamusze – Fuchin → `mkkk42-harbin-fuchin`

| stop | 粁 | 運賃 | leg | Harbin – Kiamusze  着 / 發 (out) | 着 / 發 (back) | Kiamusze – Fuchin  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|---|---|
| 哈爾濱 Harbin |  |  |  | — / 8.50 | 15.15 / — | | |
| 通河 Tungho (Tonghe) | 160 | 24 | 24 | 9.45 / 9.50 | 14.10 / 14.15 | | |
| 依蘭 Ilan (Yilan) | … |  | 11 | 10.15 / 10.20 | 13.35 / 13.40 | | |
| 佳木斯 Kiamusze (Jiamusi) | 315 | 47 | 12 | 10.50 / — | — / 13.05 | — / 11.00 | 12.55 / — |
| 富錦 Fuchin (Fujin) | 455 | 68 | 21 | | | 11.50 / — | — / 12.00 |

Harbin – Kiamusze: Daily except Sundays.

Kiamusze – Fuchin: Tuesdays, Thursdays and Saturdays.

**July 1942 sheet** (昭和17年6月1日改正). Flights 19 and 20 down the Sungari: Harbin–Kiamusze every day but Sunday, the Kiamusze–Fuchin end on Tuesdays, Thursdays and Saturdays. Carried as two services on their own days.

### 佳木斯・黑河・漠河間 — Kiamusze – Heiho – Mohe, up the Amur → `mkkk42-kiamusze-mohe`

| stop | 粁 | 運賃 | leg | Kiamusze – Heiho  着 / 發 (out) | 着 / 發 (back) | Heiho – Mohe  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|---|---|
| 佳木斯 Kiamusze (Jiamusi) |  |  |  | — / 8.50 | 12.45 / — | | |
| 佛山 Foshan (Jiayin) | 230 | 39 | 39 | 10.40 / 10.45 | 10.35 / 10.50 | | |
| 烏雲 Wuyun | … |  | 13 | 11.20 / 11.25 | 9.55 / 10.00 | | |
| 孫呉 Sunwu | … |  | 33 | 12.30 / 12.35 | 8.50 / 8.55 | | |
| 黑河 Heiho (Heihe) | 645 | 100 | 15 | 13.25 / — | — / 8.00 | — / 8.00 | 16.25 / — |
| 呼瑪 Huma | … |  | 38 | | | 9.30 / 9.40 | 14.50 / 15.00 |
| 鷗浦 Oupu | … |  | 22 | | | 10.40 / 10.45 | 14.00 / 14.05 |
| 漠河 Mohe | 1260 | 204 | 44 | | | 12.30 / — | — / 12.35 |

Kiamusze – Heiho: Mondays.

Heiho – Mohe: Tuesdays and Thursdays.

**July 1942 sheet** (昭和17年6月1日改正). Flights 37 and 38, the longest of the frontier lines: 1,260 km up the Amur to Mohe at the top of Manchukuo. Two aeroplanes on the sheet — Kiamusze–Heiho on Mondays, Heiho–Mohe on Tuesdays and Thursdays — carried as two services. 佛山 Foshan is today's Jiayin; Oupu and Wuyun are river posts placed approximately.

### 佳木斯・蘿北・撫遠間 — Kiamusze – Lopei – Fuchin – Tungkiang – Fuyuan → `mkkk42-kiamusze-fuyuan`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 佳木斯 Kiamusze (Jiamusi) |  |  |  | — / — | — / — |
| 蘿北 Lopei (Luobei) | 125 | 20 | 20 | — / — | — / — |
| 富錦 Fuchin (Fujin) | … |  | 13 | — / 9.00 | 13.10 / — |
| 同江 Tungkiang (Tongjiang) | … |  | 10 | 9.30 / 9.35 | 12.30 / 12.35 |
| 撫遠 Fuyuan | 460 | 70 | 27 | 10.55 / — | — / 11.05 |

Wednesdays and Fridays.

**July 1942 sheet** (昭和17年6月1日改正). Wednesdays and Fridays. The sheet tables the whole line but prints times only from Fuchin: 9.00 out, Tungkiang 9.30 / 9.35, Fuyuan 10.55; back 11.05, 12.30 / 12.35, Fuchin 13.10. Kiamusze–Lopei–Fuchin is drawn from the fare columns and not flown. Lopei is placed at the old county town on the Amur, approximately.

### 佳木斯・鳳翔鎮・富錦間 — Kiamusze – Fenghsiangchen – Fuchin → `mkkk42-kiamusze-fenghsiang-fuchin` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 佳木斯 Kiamusze (Jiamusi) |  |  |  | — / 9.10 | 15.35 / — |
| 鳳翔鎮 Fenghsiangchen (Fengxiang) | … | 16 | 16 | 10.05 / 10.10 | 14.40 / 14.45 |
| 富錦 Fuchin (Fujin) | … | 32 | 16 | 10.40 / — | — / 14.10 |

Fridays.

**Suspended (運休) in the July 1942 sheet.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Tabled for Fridays, a morning run down the Sungari with the return in the afternoon. No distances are printed; 16 yen a leg. Fenghsiangchen is placed approximately.

### 北京・大連間 — Peking – Tientsin – Dairen → `cak42-peking-dairen`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 北京 Peking (Beijing) |  |  |  | — / 9.10 | 17.25 / — |
| 天津 Tientsin (Tianjin) | 130 | 20 | 20 | 9.45 / 9.55 | 16.40 / 16.50 |
| 大連 Dairen (Dalian) | 500 | 85 | 65 | 11.25 / — | — / 15.00 |

Tuesdays, Thursdays and Saturdays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 5 and 6, Tuesdays, Thursdays and Saturdays. The 1940 China Airways Dairen line on this map is the same route two years earlier, then daily.

### 北京・南京・上海間 — Peking – Tsinan – Hsüchow – Nanking – Shanghai → `cak42-peking-shanghai`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 北京 Peking (Beijing) |  |  |  | — / 9.30 | 15.10 / — |
| 天津 Tientsin (Tianjin) | 130 | 20 | 20 | 10.05 / 10.15 | 14.25 / 14.35 |
| 濟南 Tsinan (Jinan) | … |  | 50 | 11.25 / 11.45 | 12.55 / 13.15 |
| 徐州 Hsüchow (Xuzhou) | … |  | 55 | 12.55 / 13.15 | 11.25 / 11.45 |
| 南京 Nanking (Nanjing) | 980 | 185 | 60 | 14.35 / — | — / 10.10 |
| 上海 Shanghai | 1250 | 235 | 50 | — / — | — / — |

Out Mondays, Wednesdays and Fridays; back Tuesdays, Thursdays and Saturdays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 1 and 2 down the Tientsin–Pukow corridor: south Mondays, Wednesdays and Fridays, north Tuesdays, Thursdays and Saturdays. Nanking–Shanghai is tabled (50 yen, 270 km) with no times, so that leg is drawn and not flown. Compare the daily 1940 Shanghai line.

### 北京・張家口・包頭間 — Peking – Kalgan – Tatung – Houho – Paotow → `cak42-peking-paotow`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 北京 Peking (Beijing) |  |  |  | — / 9.00 | 14.00 / — |
| 張家口 Kalgan (Zhangjiakou) | 170 | 30 | 30 | 10.10 / 10.30 | 12.40 / 13.00 |
| 大同 Tatung (Datong) | … |  | 28 | 11.30 / 11.40 | 11.30 / 11.40 |
| 厚和 Houho (Hohhot) | … |  | 32 | 12.45 / 12.55 | 10.20 / 10.30 |
| 包頭 Paotow (Baotou) | 635 | 115 | 25 | 13.50 / — | — / 9.30 |

Out Thursdays; back Saturdays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 7 and 8, once a week: out Thursdays, back Saturdays. The 1940 Paotow line on this map is the same route.

### 北京・青島・上海間 — Peking – Tientsin – Tsingtao – Shanghai → `cak42-peking-tsingtao-shanghai`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 北京 Peking (Beijing) |  |  |  | — / 9.20 | 15.15 / — |
| 天津 Tientsin (Tianjin) | 130 | 20 | 20 | 9.55 / 10.05 | 14.30 / 14.40 |
| 青島 Tsingtao (Qingdao) | … |  | 85 | 11.45 / 12.05 | 12.30 / 12.50 |
| 上海 Shanghai | 1200 | 235 | 130 | 14.25 / — | — / 10.00 |

Out Tuesdays and Saturdays; back Mondays and Fridays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 32 and 31, by the coast: south Tuesdays and Saturdays, north Mondays and Fridays.

### 上海・臺北・廣東 — Shanghai – Taihoku – Canton → `cak42-shanghai-taihoku-canton` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 上海 Shanghai |  |  |  | — / 9.00 | 16.00 / — |
| 臺北 Taihoku (Taipei) | 740 | 135 | 135 | 11.50 / 12.30 | 12.30 / 13.10 |
| 廣東 Canton (Guangzhou) | 1565 | 300 | 165 | 16.00 / — | — / 9.00 |

Out Mondays and Thursdays; back Tuesdays and Fridays.

**Suspended (運休) in the July 1942 reprint.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 13 and 14, tabled Mondays and Thursdays south, Tuesdays and Fridays north, with forty minutes on the ground at Taihoku. The only line on the sheet to touch Taiwan.

### 北京・運城間 — Peking – Shihmen – Taiyuan – Linfen – Yüncheng → `cak42-peking-yuncheng`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 北京 Peking (Beijing) |  |  |  | — / 9.00 | 15.20 / — |
| 石門 Shihmen (Shijiazhuang) | 270 | 50 | 50 | 10.40 / 10.50 | 13.30 / 13.40 |
| 太原 Taiyuan | … |  | 40 | 12.00 / 12.10 | 12.00 / 12.20 |
| 臨汾 Linfen | … |  | 50 | 13.40 / 13.50 | 10.20 / 10.30 |
| 運城 Yüncheng (Yuncheng) | 815 | 170 | 30 | 14.40 / — | — / 9.30 |

Out Mondays; back Tuesdays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 27 and 28 into Shansi, once a week: out Mondays, back Tuesdays. 石門 Shihmen is Shihchiachuang.

### 北京・開封間 — Peking – Shihmen – Changte – Hsinhsiang – Kaifeng → `cak42-peking-kaifeng`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 北京 Peking (Beijing) |  |  |  | — / 9.00 | 14.25 / — |
| 石門 Shihmen (Shijiazhuang) | 270 | 50 | 50 | 10.40 / 10.50 | 12.25 / 12.45 |
| 彰德 Changte (Anyang) | … |  | 40 | 12.00 / 12.10 | 10.55 / 11.05 |
| 新鄉 Hsinhsiang (Xinxiang) | … |  | 22 | 13.05 / 13.15 | 10.00 / 10.10 |
| 開封 Kaifeng | 660 | 132 | 20 | 13.45 / — | — / 9.30 |

Out Wednesdays; back Thursdays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 23 and 24 down the Peking–Hankow railway to the Yellow River, once a week: out Wednesdays, back Thursdays. The sheet prints the Changte arrival as 12.20 and the departure as 12.10; the arrival is taken as 12.00.

### 南京・九江・漢口間 — Nanking – Anking – Kiukiang – Hankow → `cak42-nanking-hankow`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 南京 Nanking (Nanjing) |  |  |  | — / 9.00 | 15.10 / — |
| 安慶 Anking (Anqing) | 240 | 63 | 63 | 10.00 / 10.10 | 14.00 / 14.10 |
| 九江 Kiukiang (Jiujiang) | … |  | 37 | 10.50 / 11.00 | 13.10 / 13.20 |
| 漢口 Hankow (Wuhan) | 570 | 150 | 50 | 11.50 / — | — / 12.20 |

Tuesdays, Thursdays and Fridays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 11 and 12 up the Yangtze, Tuesdays, Thursdays and Fridays, calling at the two river ports the through Shanghai–Hankow flight passes.

### 上海・南京・漢口間 — Shanghai – Nanking – Hankow → `cak42-shanghai-hankow`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 上海 Shanghai |  |  |  | — / 8.30 | 16.20 / — |
| 南京 Nanking (Nanjing) | 270 | 50 | 50 | 9.40 / 10.00 | 14.50 / 15.10 |
| 漢口 Hankow (Wuhan) | 830 | 200 | 150 | 12.10 / — | — / 12.40 |

Mondays, Wednesdays and Saturdays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 15 and 16, Mondays, Wednesdays and Saturdays: the Yangtze trunk, nonstop from Nanking to Hankow. The 1940 line on this map called at Anking and Kiukiang as well.

### 廣東・海口間 — Canton – Hoihow → `cak42-canton-hoihow` · 運休

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 廣東 Canton (Guangzhou) |  |  |  | — / 9.00 | 13.50 / — |
| 海口 Hoihow (Haikou) | 475 | 120 | 120 | 10.50 / — | — / 12.00 |

Mondays.

**Suspended (運休) in the July 1942 reprint.** The times are the ones printed beside the 運休 mark; the line is drawn dimmed and no aeroplane flies it. Flights 35 and 36, tabled for Mondays, across to Hainan.

### 廣東・汕頭間 — Canton – Swatow → `cak42-canton-swatow`

| stop | 粁 | 運賃 | leg |  着 / 發 (out) | 着 / 發 (back) |
|---|---|---|---|---|---|
| 廣東 Canton (Guangzhou) |  |  |  | — / 9.10 | 14.10 / — |
| 汕頭 Swatow (Shantou) | 350 | 80 | 80 | 10.40 / — | — / 12.40 |

Fridays.

**April 1942 sheet** (昭和17年4月1日改正), as reprinted in July 1942. Flights 37 and 38, Fridays, along the Kwangtung coast.

---

## `grounded_from`, and what it does

A route names the stop it is grounded at. From there on:

* the line is drawn **faint whether the week is running or not**;
* it still answers a press, and its airports still open their cards;
* **no aeroplane is ever put on it** — decided in `air-play.js`'s `buildPlans`,
  not in the drawing, because those are two different files and the first cut
  dimmed the stretch while the aeroplanes went on flying down it.

## The clock

Every timetable here keeps the local time of the place it was printed for. The
animation puts them all on one dial, which costs two things, both documented in
the layer's "i":

* across networks the dial is meaningless — 07:00 at Calcutta and 07:00 at
  Tokyo are three and a half hours apart;
* within a line, a stage that crosses a zone has its drawn duration stretched
  or squeezed. **49 of the 322 timed legs cross one**, by 23 to 90 minutes.
  Bangkok–Penang reads as 4h00 and was 5h30.

Converting to one reference time would fix the animation and break every card
against its own source. The times stay local.
