# The Korean and Japanese lines in a Manchurian timetable

*Why `build_mn_trains.py` reads past page 53, and how it decides where a stop
in Korea or Japan stands.*

## The booklet is not only Manchuria's

滿洲・支那汽車時間表 昭和17年7月號 is the timetable a traveller out of Dairen
or Shinkyō would have carried, and it prints the whole network they could
reach. The transcription under `data/manchuria/timetable/` is 861 tables:

| section | tables | in the map |
| --- | ---: | --- |
| Manchuria — 滿鐵社線, 國線, 其他 (p12–53) | 128 | the network itself |
| Korea — 鮮鐵, 北鮮, 會寧炭礦 (p54–55, 72–83) | 42 | **a connection** |
| Japan — 鐵道省 (p84–102) | 58 | **a connection** |
| North and Central China — 華北, 華中 (p56–71) | 95 | no, see below |
| Taiwan, Karafuto | 11 | no |
| buses | 495 | no |
| through tables 日滿 (p8–11) | 12 | no: the same trains again |

**China cannot be drawn.** There is no station geometry for it in this map, so
its 95 tables have nowhere to put a stop. **Taiwan and Karafuto are not
connections**: both have their own bundles and their own dates, and no train
runs to either. Korea and Japan are the two that both connect and can be
placed — the Fuzan expresses cross the Yalu at Antung into these very tables —
and the map already carries 844 Korean stations and 12,800 Japanese ones with
the rails between them traced.

## Placing a stop, which is the whole difficulty

The tables give names, not coordinates. Three things had to be settled, each
of which produced a visibly wrong map first.

**1. Which country's file to ask.** One pool for both was wrong in a way that
looked right: 仁川 is not in Korea's 1938 station file, and there *is* a 仁川
in Hyōgo, so every Inch'ŏn local ran 838 km down the Keijin line in four
minutes and came back. A Korean table is answered from Korea's file and a
Japanese one from Japan's. A name neither has is left unplaced — 63 Korean and
11 Japanese, most of them halts opened after 1938 (東草, 館坪) or pier stations
the files do not carry (釜山棧橋, 高松棧橋).

**2. Which of the places of that name.** N05 has 10,866 distinct station names
over 12,800 places; 1,383 of those names are two places or more — 小倉 is five,
清水 six, 福島 seven — and **324 of the 668 stops the Japanese tables print are
ambiguous**. Taking the first row was a coin flip, and it showed: 門司港 to
小倉 measured 781 km in twenty minutes, 靜岡 to 清水 973 km in twelve.

The booklet answers it, not in words but in order. A table is a line and a line
is a sequence of places near each other, so a repeated name is settled by
**where its neighbours in the printed column already are**. The 344 unambiguous
names seed it and the rest fall out in a few rounds; a candidate more than
120 km from the nearest anchor is refused. All 104 repeated Japanese names and
all 4 Korean ones settle. See `resolve_beyond`.

**3. Whether Manchuria's station of that name is the same place.** 安東, 新京
and 奉天 head the Korean columns and *are* the Manchurian stations: they must
come out as one record or the Fuzan express is two trains with a hole over the
Yalu. But 鶴岡 is a stop on Manchuria's 鶴岡線 and a town in Yamagata on the
羽越本線, 1,259 km apart. Neither the name nor the line can tell those cases
apart. The distance can, and does it before anything is drawn: beyond 100 km
they are two records.

## What comes out

50 lines flagged `x`, 573 stops placed — 318 from Korea's file, 255 from
Japan's — and the track between them routed along the same traced rails the
map itself draws: `korea_1942_lines_dedup.geojson`,
`korea_1930_lines_dedup.geojson` and `japan-railway-lines-1942.geojson`, all
in one graph with Manchuria's so a train that changes country mid-run finds a
route the whole way.

**Stored thinner than it arrives.** N05 is a modern national dataset drawn at a
density this map cannot show — 長萬部 to 岩見澤 came back as 2,587 points for
214 km — and the bundle went to 7.5 MB before anything was done about it. The
connection stretches are thinned to 40 m, which is the tolerance the Japanese
layer is *drawn* at: 15% of the vertices survive and the bundle is 1,057 KB.
**Manchuria's own hand-traced track is not touched** — the thinning is done
after routing, on stretches with an end beyond Manchuria, and the surviving
fraction is printed at every build.

## What it cost Manchuria

Nothing in the lines or the stations: all 53 line records and all 905 station
records are identical, character for character, to what the build wrote before.
Adding Japan's network to the routing graph needs an 80 m weld (N05's 1,977
features come to 241 separate components), and that weld reaches Manchuria's
trace too: 45 of its 690 routed stretches changed, by **−4.9 km in total** —
the largest a 2.3 km *improvement* on 春陽→老松嶺, where the weld opened a
path that had not existed. Four long chords disappeared — 新義州→平壤,
輯安→滿浦, 南陽→羅津, 龍井→上三峰 — because the Korean stops between them are
now placed, so the through expresses run stop by stop instead of jumping.
