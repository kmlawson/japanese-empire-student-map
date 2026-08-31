# 昭和15年国勢調査人口 全国・道府県 — Japan by prefecture, 1940

**The population of the 1940 census: all Japan, dō, fu and ken**, printed pp.
17–19. Scanned and hosted by the Program for Constructing Data Infrastructure
for the Humanities and Social Sciences at the Institute of Economic Research,
Hitotsubashi University (一橋大学経済研究所 人文学・社会科学データインフラス
トラクチャー構築推進事業) —
<https://d-infra.ier.hit-u.ac.jp/Japanese/govstat-database/statistical-yb/1940/>.

Three tables of the same shape: 総数, 男, 女. Each gives every prefecture under
three headings, in the source's own bilingual wording:

| the source | |
|---|---|
| 全人口 / All persons including military personnel | Total, Inlanders, Oversea's landers, Foreigners |
| 銃後人口 / All persons except military personnel | the same four |
| 軍人軍属の数 / Military personnel | Total, Inlanders, Oversea's landers |

*Inlanders* are 內地人, people on the household registers of Japan proper.
*Oversea's landers* — the source's own spelling — are 外地人, registered in
Korea, Taiwan, Karafuto or the leased territory and living in Japan proper;
1,265,049 of them in 1940, most of them Koreans. The map's cards say
**Registered in Japan proper** and **Registered in the 外地** rather than
reproducing the 1940 English, which no reader today would take the intended
meaning from.

**The service personnel are inside each total, not beside it.** 全人口 =
銃後人口 + 軍人軍属, checked below, so the three registers add to the whole and
the military column does not.

## Okinawa, twice

The report prints the country both ways — 全国 excluding Okinawa and 全国
including it — because Okinawa was surveyed on a different footing. This map
draws Okinawa, so the figure it uses is **73,114,308**, the one that includes
it. The other is 72,539,729, and 574,579 is the difference.

## Checked against the source's own arithmetic

| check | |
|---|---|
| the forty-seven prefectures, total | 73,114,308 — the printed 全国 (includes Okinawa), exactly |
| male | 36,566,010, exactly |
| female | 36,548,298, exactly |
| male + female = total | in every one of the forty-seven, and in the two 全国 rows |
| Inlanders + Oversea's landers + Foreigners = Total | in every row of all three tables |
| 銃後人口 + 軍人軍属 = 全人口 | in every row of all three tables |
| 全国 excluding Okinawa + Okinawa | = 全国 including Okinawa |

## The areas, and what they are shared with

`area_km2` is the same measurement the 1930 dataset uses — the polygons this map
draws, by spherical excess — because both dates draw the same forty-seven
shapes. The two departures noted there hold here too: Hokkaidō's area is the
shape drawn and excludes the Kuriles, and the island prefectures run a little
under because the smallest islands are not in the outlines.

## What it does to the 1930 map

The class breaks are pooled over a layer's dates, so putting 1940 beside 1930
moved Japan's ladder from **under 75 / 75–200 / 200–500 / 500–1000 / 1000 and
over** to **under 100 / 100–200 / 200–500 / 500–1500 / 1500 and over**. That is
the rule working: a colour has to mean the same thing on both maps or the
comparison the switch exists for is a lie. The 1930 map's colours moved with it.

## Notes on the transcription

- Numbers are as printed; the source spaces its thousands and a hyphen is a
  hyphen, not a zero.
- 群馬 is printed **Gumma** in the source's romanisation and is keyed `Gunma`
  here, which is what the 1930 dataset and the map's own tables call it.
