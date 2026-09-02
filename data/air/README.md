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
