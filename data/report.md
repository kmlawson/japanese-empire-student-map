# The cities layer: what is missing, and how big everything was

Five files come out of this exercise:

* **`sources.csv`** — 48 sources for city populations in this region between 1920 and 1950,
  with links and notes on what each one actually covers and where it lies to you.
* **`cities.csv`** — 446 places: the 220 already on the map (50 quiz sites in the `city`
  category and 170 in `JMAP.BROWSE`) and 226 proposed additions. Each carries population
  figures at four moments, a size tier, and where it applies a capital marking.
* **`cities-1930.csv`** and **`cities-1942.csv`** — the same list re-categorised for the
  map's two epochs, `e1930` and `e1942`. Sizes are taken from the nearest figure to each
  date and the capital markings follow the politics of that year, so Hsinking is not a
  capital in 1930 and Mukden is a provincial seat of the Republic of China rather than the
  largest city of Manchukuo. See §11.
* **this report** — what is not on the layer and should be, and why.

---

## 1. How the four tiers were drawn

Every place has a reference population, `pop_ref`, taken from the closest thing to a 1940
figure that exists for it: the 1940 census where there was one, otherwise a 1936 or 1931
estimate, otherwise the first post-war count. The year used is in `pop_ref_year`, and the
four period columns are there so you can see the trajectory rather than a single number.

| tier | threshold | count | what it looks like |
|---|---|---|---|
| **largest** | 1,000,000+ | 15 | Tokyo, Shanghai, Osaka, Calcutta, Tientsin, Hong Kong, Peking, Bombay |
| **large** | 250,000–999,999 | 49 | Yokohama, Keijō, Bangkok, Madras, Harbin, Manila, Singapore, Dairen |
| **medium** | 75,000–249,999 | 149 | Hiroshima was 344,000 and is *large*; Nagasaki 253,000, also *large*; Taichū 89,000 is *medium* |
| **small** | under 75,000 | 233 | Yenan, Lhasa, Koror, Kota Bharu, Port Blair, Tulagi |

The cut at a million puts fifteen cities in the top tier, which is about as many as a map
at this scale can carry at maximum weight. The cut at 250,000 is what separates a city
that dominates its region from one that merely runs a province. Both are adjustable in one
line if the dots come out wrong.

Two warnings about the ranking. The first is that **city boundaries are not comparable**.
Tokyo's 1940 figure of 6.78 million is the 35-ward city created by the 1932 expansion;
its 1930 figure of 2.07 million is the old 15-ward city, and the apparent tripling in ten
years is mostly a line on a map moving. Osaka does the same thing in 1925. Shanghai's
figure includes the International Settlement and the French Concession, which were not
under Chinese municipal government at all. Where a city is ranked against the tier
boundary rather than in the middle of a tier, check what unit the number describes.

The second is that **the war moves everything**. Hong Kong was about 1.64 million when the
Japanese arrived in December 1941 and about 600,000 when they left, because the occupation
deported people to the mainland by the hundred thousand. Manila, among the most thoroughly
destroyed cities of the war, went from 623,000 in 1939 to 984,000 in 1948 despite being
flattened in between. Japanese cities empty in 1944–45 and refill afterwards: Kure is 276,000 in 1940
and 188,000 in 1950. A single dot size for the whole period is a compromise, and the map
should probably say so somewhere.

---

## 2. The check that found most of it

The map draws **58 territories** in the 1942 epoch. Ask of each one, *is its capital named
on the cities layer?* — and eighteen come back empty. That is the single most productive
test I ran, because these are places the map has already committed to showing as polities,
whose administrative centre a student then cannot find.

| missing capital | of |
|---|---|
| **Victoria, Hong Kong** | Hong Kong |
| **Macao city** | Macao |
| **Fort Bayard (Zhanjiang)** | Kwangchowan |
| **Port Blair** | Andaman & Nicobar Islands |
| **Kabul** | Afghanistan |
| **Kathmandu** | Nepal |
| Nova Goa (Panjim) | Portuguese India |
| Pondicherry | French India |
| Kengtung | Saharat Thai Doem |
| Kyzyl | Tannu Tuva |
| Gangtok | Sikkim |
| Punakha | Bhutan |
| Futami (Chichijima) | Ogasawara Islands |
| Tulagi | British Solomon Islands |
| Yaren | Nauru |
| Canberra | Australia |
| Apia | Western Samoa |
| Nouméa | New Caledonia |

**Hong Kong is the serious one.** It is the largest British city in Asia, the busiest port
on the China coast, and at 1.64 million in 1941 it belongs in the top tier alongside Peking
and Bombay. The territory is drawn, the attack of 8 December 1941 and the surrender on
Christmas Day are part of every account of the war's opening, and there is no marker on the
layer at all — not in `SITES`, not in `BROWSE`. A student looking for Hong Kong on this map
finds a shape and no name. That is the first thing to fix.

**Macao** is the second, and for a different reason: the map already carries a long and
careful note about Portuguese neutrality, and the city that note is about is not on the
layer. Its population roughly trebled during the war as refugees came in from Hong Kong and
Canton, which is the demographic fact that makes the neutrality argument concrete.

**Fort Bayard** matters because the map went to the trouble of drawing Guangzhouwan as a
distinct French leased territory — the git history records the fill-rule work that cut it
out of Kwangtung — and then left it anonymous. It was the smuggling channel into free China
until February 1943, which is why it was worth taking.

**Port Blair** is the only Indian territory Japan occupied. Bose raised the flag of the
Provisional Government of Free India there in December 1943. It was also the penal
settlement, which is most of why the name means anything in India. The islands are drawn;
the town is not.

The rest of the list is small places, but they are cheap: a capital dot on a territory the
map already draws costs one row and answers an obvious question.

---

## 3. Japan proper

The largest single gap, by count. Forty-six Japanese places are proposed, and they fall
into three groups.

**Cities that are on the map's own subject matter and simply absent.**

* **Kokura** — the primary target for the second atomic bomb on the morning of 9 August
  1945. Cloud and smoke over the city sent the aircraft to its secondary target, Nagasaki.
  Nagasaki is on the map with a level-1 marker; the city it was substituted for is not on
  the map at all. For a teaching map this is close to indefensible.
* **Yawata** — the Imperial Steel Works, the centre of Japanese heavy industry, and the
  target of the first B-29 raid on the home islands on 15 June 1944. 261,000 people.
* **Toyama** — the firebombing of 1–2 August 1945 destroyed about 99% of the built-up area,
  the highest destruction rate of any Japanese city. If the map wants one city to carry the
  scale of the incendiary campaign beyond Tokyo, this is it.
* **Kawasaki** — 301,000 in 1940 and the heart of the Keihin industrial belt.
* **Ōmuta** — the Miike mines, worked by Korean, Chinese and Allied prisoner labour; one of
  the places where the empire's labour system is most legible.
* **Ube**, **Hitachi**, **Muroran** — coal and chemicals, heavy electrical, steel. Muroran
  and Hitachi were both shelled from the sea by American battleships in July 1945, which is
  a fact students find startling and is hard to show without the dots.
* **Ōminato** — the northern guard district, watching the Tsugaru Strait. The map has the
  four naval districts proper — Kure, Yokosuka, Sasebo, Maizuru — and stops one short of the
  home fleet's base structure.
* **Nara** and **Ise** — the eighth-century capital and the shrine complex, the two places
  the imperial state pointed at when it explained itself. Neither is large; both are
  ideologically central.

**The prefectural capitals.** The map has 18 of the 47 and misses 28. That is fine as long
as nothing depends on the set being complete — but the moment you introduce a
*capital-of-prefecture* variant, a half-populated set reads as an error rather than a
selection. Either add the remaining 28 (they are all in `cities.csv`, mostly in the 50,000–
130,000 range and mostly *medium* or *small*) or do not apply the variant inside Japan.
I would add them: prefectures are the unit Japanese students are taught in, and 47 dots at
the smallest weight is not a crowded map.

**Karafuto.** Toyohara is on the layer and is the only settlement in the territory that is.
Ōtomari was the ferry port to Hokkaidō; Maoka is where the Soviet landing came ashore on 20
August 1945, two weeks after the surrender; Esutoru was the largest town in the north.
Karafuto is drawn on the map and currently has one name on it.

---

## 4. Korea, Taiwan, Manchuria

**Korea** is well covered — fifteen places, including all the northern industrial ports. Two
things are missing. Four of the thirteen provincial capitals are absent (**Ch'ŏngju**,
**Chŏnju**, **Haeju**, **Ch'unch'ŏn**), which again matters only once the variant exists.
And **Hŭngnam** is missing, which matters regardless: Noguchi Jun's chemical combine there
was the largest industrial complex anywhere in the empire outside Japan, built with Korean
and later conscripted labour, and it is the single best illustration of what colonial
industrialisation meant in practice. **Kunsan** is the complement — the port through which
the Chŏlla rice harvest left for Japan.

**Taiwan** needs one addition to complete a set: **Taitung**, the last of the eight
prefectural seats. Pingtung, Changhua and Yilan are worth having; they are not urgent.

**Manchukuo** is generously covered already. The gaps are functional rather than
demographic:

* **Benxi** — iron and coal, and the colliery explosion of 1942 that killed over 1,500
  miners, the worst in the history of mining anywhere.
* **Hailar** and **Manzhouli** — the western fortified zone and the rail frontier with the
  Soviet Union. Nomonhan is on the map as a battle; the places the army fought it from are
  not.
* **Suifenhe** — the eastern crossing to Vladivostok, the other end of the same problem.
* **Tonghua** — Manchukuo's capital for its last few days in August 1945, and the redoubt
  the Kwantung Army planned to hold.
* **Pingfang** — Unit 731. A village, not a city, and it sits awkwardly in a size-graded
  layer. But its absence from a map of the Japanese empire is a choice, and worth making
  deliberately rather than by default.

---

## 5. China

**Shijiazhuang** is the clearest omission. It is the junction of the Peking–Hankow and
Chengtai railways, and therefore the hinge of every north China campaign, the base the
Hundred Regiments Offensive was fought against, and one of the largest Japanese garrisons in
China. The map's own note explains that Japanese control ran along the railways; this is the
place where the railways cross.

**Hainan** is drawn as an occupied territory and marked with a battle dot, and has no
settlement on it. **Haikou** and **Samah (Sanya)** — the naval base and iron-ore port at the
southern tip, worked by prisoner and conscript labour — would fix that.

**Liuzhou** belongs with Kweilin, which is already on the layer: the two were the principal
Fourteenth Air Force bases and the joint objective of the Ichi-gō offensive of 1944.

Two places carry episodes rather than population. **Changde** was the battle of November–
December 1943 and one of the confirmed targets of Unit 731's plague attacks in 1941.
**Quzhou** was a Doolittle raid recovery airfield, and the reason for the Chekiang–Kiangsi
campaign and the biological attacks that came with it. If the map means to show that the
war in China included biological warfare, these are the two dots that do it.

**Tungchow** is the site of the mutiny of 29 July 1937, when the East Hopei puppet garrison
turned on its Japanese employers and killed most of the Japanese and Korean residents of the
town — used afterwards in Japan to justify the escalation into full war. The Marco Polo
Bridge is on the map three weeks earlier; this is the other half of that summer.

Also proposed, on size alone: **Nantong**, **Yangzhou**, **Shaoxing**, **Zigong** (the salt
wells that supplied free China after the coast was lost), **Luzhou**, **Nanchong**. And
**Enshi**, Hubei's wartime provincial capital after Wuchang fell, which the province-capital
variant will want.

---

## 6. Southeast Asia

**Malaya.** **Kota Bharu** is already on the map as a battle marker — correctly, since the
landing there began an hour or so before Pearl Harbor — but not as a settlement, and it is
also the capital of Kelantan and one of the four states handed to Thailand in 1943. The
same is true of **Alor Setar**, **Kuala Terengganu** and **Kangar**: the map draws
`malaya_thai` as a distinct territory and names none of its four capitals.

**Sandakan** is the important addition. It was the capital of North Borneo, the prisoner-of-
war camp, and the starting point of the death marches to Ranau in 1945, which six men
survived out of about 2,400. **Miri** is where the Borneo campaign actually started, on 16
December 1941, because of the oilfields. **Labuan** is where the Australians landed in June
1945 and where the war-crimes trials were held afterwards.

**Thailand.** The map gives Thailand two cities. The landings of 8 December 1941 came ashore
at **Songkhla**, **Pattani**, **Prachuap Khiri Khan**, Chumphon, Nakhon Si Thammarat and
Surat Thani, and the first three are proposed here. **Kanchanaburi** is the eastern terminus
of the Burma–Siam railway and the largest of the prisoner camps; **Thanbyuzayat**, at the
Burmese end, is proposed too. Between them they let the railway be shown as a line with two
ends rather than a fact in a note. **Thonburi** is Bangkok's twin across the river, a
separate province enumerated separately until 1971 — worth knowing if you are comparing
Bangkok's size with anywhere else.

**Burma.** **Meiktila** is the battle of February–March 1945 that broke the Japanese army in
Burma, and it is not on the map. **Yenangyaung** is the Irrawaddy oilfield — a principal
reason for invading Burma at all, and destroyed by the retreating British in April 1942.
**Victoria Point**, at the southern tip, was taken on 15 December 1941 to cut the air
reinforcement route to Singapore, and is the reason the map's Burma extends as far south as
it does.

**Indochina.** **Cholon** is Saigon's Chinese twin, larger than Saigon proper in the 1936
returns and counted separately; showing one without the other understates the largest urban
area in Indochina by about two thirds. **Lang Son** is where the Japanese army attacked in
September 1940, which is where the Japanese presence in Indochina begins. **Cam Ranh** is
where the invasion convoys for Malaya and the Indies assembled in December 1941. **Nam
Dinh** had the largest industrial workforce in Tonkin. **Battambang** is the capital of the
province the map already draws as ceded to Thailand.

**The Indies.** The list is already strong. **Hollandia** is the gap that matters:
MacArthur's landing of 22 April 1944 leapfrogged an entire Japanese army and became his
headquarters, and the whole New Guinea coast is currently unnamed. **Morotai** gave the
airfields for the return to the Philippines. **Kendari** was the best airfield in the Indies
and the base Java and Darwin were bombed from. **Tjilatjap** was Java's only south-coast
port and the evacuation channel in March 1942. **Pekanbaru** is the Sumatra railway, the
Burma railway's forgotten twin, finished on the day of the surrender. **Muntok** is the town
on Bangka, off whose beaches the Australian nurses were massacred on 16 February 1942.

**The Philippines** are thin — five places for a country of sixteen million where the war
was fought twice. **Tacloban** is the most needed: MacArthur came ashore there on 20 October
1944 and it was the seat of the restored Commonwealth government until Manila was retaken.
**Lingayen** took both the Japanese landing of December 1941 and the American landing of
January 1945. **Cabanatuan** was the largest American prisoner-of-war camp in the Pacific
and the object of the raid that emptied it. **Capas** is where the Bataan Death March ended
and where thousands more died in the weeks after. **Aparri**, **Vigan** and **Legazpi** are
the December 1941 landing points; **Clark Field** is where the American air force was
destroyed on the ground on 8 December.

---

## 7. The Pacific

The Pacific is currently handled almost entirely through battle markers, and it works, but
it leaves the mandate looking uninhabited. **Garapan** on Saipan was the administrative and
sugar capital of the Marianas and the largest Japanese town in Micronesia — about 15,000
people, most of them settlers, destroyed in the battle of June 1944. Saipan is on the map as
a battle; the town that was there is not. The same applies to **Dublon** at Truk, the naval
town at the Combined Fleet's great anchorage, and to the district seats at **Ponape**,
**Jaluit** and **Yap**.

This is the difference between a mandate shown as a scatter of contested rocks and one shown
as a place that was colonised — by 1937 the Japanese and Okinawan settlers on Saipan heavily
outnumbered the Chamorro and Carolinian population, which is the fact the sugar towns carry.

On the mainland side, **Lae**, **Wewak**, **Kavieng**, **Lorengau** and **Buin** are the
Japanese base network the Rabaul note already describes without naming.

---

## 8. South Asia

The Indian coverage is already generous — 28 places — and mostly needs completing rather
than extending.

* **Kandy** is the notable absence. South East Asia Command moved there in April 1944, and
  it is where the Southeast Asian war was directed from for its last eighteen months.
* **Imphal** is a battle marker and should also be a settlement: it is the capital of
  Manipur and the town the 1944 fighting was about.
* **Ledo** is where the Ledo Road began, and **Digboi** is the oilfield behind the Assam
  front.
* **Jamshedpur** is Tata Iron and Steel — the industrial base of the Indian war effort and
  the largest steelworks in the British Empire.
* Three provincial capitals are missing: **Patna**, **Cuttack**, **Shillong**.
* Six princely capitals are missing — **Srinagar**, **Baroda**, **Gwalior**, **Indore**,
  **Bhopal**, **Jodhpur** — which is the set the *princely state* variant needs if it is to
  mean anything. The map already draws `princelystates` as a category.

---

## 9. Judgement calls, and things deliberately left out

**The frame.** `JMAP.HOME` runs from 100°E to 160°E and −4° to 52°N. Several proposals sit
outside it: Australia, Nouméa, Apia, and India west of about 100°E — although the browse
layer already carries Bombay and Karachi, so the frame is evidently elastic. **Canberra**,
**Brisbane** (MacArthur's headquarters 1942–44), **Sydney** (the midget submarine attack),
**Townsville** and **Broome** are in `cities.csv` and flagged in their rationale as optional.
Australia is drawn as a territory and is a belligerent with no city on it, which is odd; but
extending the default view southward is a design decision, not a data one, so I have not
assumed it.

**Kowloon** is listed separately from Victoria because the 1941 fighting was decided on the
mainland and the two were separately enumerated. On most maps one dot for Hong Kong is
right, and Kowloon can be dropped.

**Pingfang**, **Capas** and **Thanbyuzayat** are villages carrying atrocities. They do not
belong in a size-graded layer on their size, and a map that sizes dots by population will
draw them as specks. If they go in, they may want a category of their own rather than a
tier.

**Not proposed**, though I considered them: Cheju, Ranau, Kalijati, Banda Neira, Sittang,
Kohima as a separate dot from Imphal, and about forty more Japanese and Chinese cities in
the 30,000–70,000 range. The layer is already at 446 rows and the marginal one stops
teaching anything.

---

## 10. What to trust in `cities.csv`

The `pop_quality` column has two values and they mean different things.

**`census (rounded)`** — a published census or official return, rounded to the nearest
thousand. Japan, Korea, Taiwan, India, Ceylon, Malaya, the Indies, the Philippines and the
USSR are mostly this, because those places were properly enumerated on a known date. These
are good to about the rounding.

**`estimate`** — everything else, and it covers a wide range of confidence. Republican China
never took a census, so every Chinese figure before 1953 is a municipal or provincial return
of unknown method; the 1953 column beside it is the first trustworthy number and is often
two or three times larger, which tells you how much the earlier ones were missing.
Manchukuo's non-census figures are police registration. Indochina's are administrative
counts that handle the Chinese population of Cholon differently from year to year. The small
Pacific and Borneo figures come from colonial annual reports and are frequently round
numbers in the original. **Use the estimates to place a city in a tier, and go to
`sources.csv` before quoting any of them.**

`pop_sources` gives the `source_id` values from `sources.csv` for each row, so every figure
points at where to check it.

**There is no `wikidata_qid` column, deliberately.** The intention was to carry one, both as
a join key and so any figure could be checked against Wikidata's own. Two things stopped it.
The first is that Wikidata's coverage of 1920–1950 populations in this region is thin and
heavily skewed towards Japan and India, where census series have been imported wholesale;
for China, Southeast Asia and the Pacific it is close to empty, so it would not have
supplied many numbers anyway. That is why the population columns here are compiled rather
than harvested. The second is practical: resolving 446 places against the Wikidata search
API tripped its rate limiter, and only 49 were matched before the throttle set in. A column
that is 49/446 filled is worse than no column, because the blanks read as *no such item*
rather than *not looked up*.

If you want it, the reliable way is to resolve by coordinate rather than by name — for each
row, query the Wikidata API for items near `lat`/`lon` and keep the nearest settlement with
the most sitelinks — running single-threaded with a half-second delay and honouring `429`
with a long back-off. Budget an hour for the full set, and expect a handful of period names
(Hsinking, Karenkō, Fort Bayard, Toyohara) to need matching by hand.

---

## 11. The two epoch files

`cities.csv` is period-neutral: it takes the best figure available for each place and
categorises on that. The map, though, has two epochs, and a good many of these places were
different sizes and different things in each. So the same 446 rows are also written twice:

* **`cities-1930.csv`** — 444 rows. Quezon City (founded 1939) and Komsomolsk-on-Amur
  (founded 1932) are dropped, since neither existed.
* **`cities-1942.csv`** — 446 rows.

They carry the same columns, with `polity` in place of `polity_1940` and one addition,
`pop_basis`, which says whether the size came from a figure taken near that epoch or was
inferred from a more distant one.

### What changes in the sizes

| tier | 1930 | 1942 |
|---|---|---|
| largest | 9 | 15 |
| large | 41 | 52 |
| medium | 141 | 150 |
| small | 253 | 229 |

Forty-nine places change tier between the two, and the pattern is the history: Nagoya,
Kyoto, Hankow, Nanking, Hong Kong and Mukden all cross the million mark; Hsinking, Taihoku,
Pusan, Pyongyang, Kawasaki, Yawata and Kure move up as the empire industrialises; Anshan
goes from a village to a steel town. Nothing moves down, because the destruction of 1944–45
falls outside both epochs — a 1945 file would look very different, and Hong Kong, Manila,
Naha and most of urban Japan would fall a tier or two.

### What changes in the capitals

1930 has 46 territory capitals and 183 provincial ones; 1942 has 52 and 198. The
substantive differences are:

* **No Manchukuo.** Mukden is the seat of Liaoning province, Kirin of Kirin, Tsitsihar of
  Heilungkiang, Chengteh of Jehol — all within the Republic of China. Changchun is not a
  capital of anything and Harbin is a special district, not a provincial seat.
* **No Mengjiang and no occupation.** Kalgan is the capital of Chahar, Kweisui of Suiyuan,
  and every Chinese city carries `Republic of China` rather than `Occupied China` or
  `Free China`. Nanking is the national capital; Chungking is an ordinary city and Yenan is
  nothing at all — the Communists did not arrive until 1935–36.
* **Provinces that had not been created.** Sind (1936) and Orissa (1936) mean Karachi and
  Cuttack are not provincial capitals in 1930; Sikang (1939) means Kangting is not; the
  Soviet krais (1937–38) mean Vladivostok and Chita are not, and Khabarovsk is the seat of
  the whole Far Eastern Krai instead.
* **Seats that moved.** Kwangsi's was Nanning until 1936 and Kweilin after; Anhwei's was
  Anking; South Ch'ungch'ŏng's was Kongju until 1932, not Taejŏn.
* **Burma was a province of British India** until 1937, so Rangoon is `capital-province`
  in 1930 and `capital-territory` in 1942. Kengtung is a Shan state in 1930 and the capital
  of Saharat Thai Doem in 1942.
* **Names.** Siam rather than Thailand; the Philippine Islands under the Insular Government
  rather than the Commonwealth, which dates from 1935.

In 1942 the four northern Malay states — Kelantan, Kedah, Terengganu, Perlis — are marked as
under Japanese military administration, not Thai: the transfer to Thailand came in October
1943, after the epoch.

### How far to trust the 1930 sizes

The 1942 file rests on contemporary figures for 401 of its 446 rows. **The 1930 file is
weaker: 314 contemporary and 130 inferred**, because the interwar censuses are thinner than
the wartime ones and many colonial places were first counted properly in 1940.

Where inference from a 1940 figure would badly mislead, I put a 1930 estimate in instead
rather than let it stand. That mattered most for the places Japanese investment
transformed after 1931 — Mukden, Harbin, Dairen, Hsinking, Fushun, Anshan, Penhsihu and the
rest of industrial Manchuria; Ch'ŏngjin, Hŭngnam, Rashin and Sŏngjin in northern Korea,
which were essentially built in the 1930s; and Shihkiachwang, which grew with the railway.
Those estimates are marked `estimate` in `pop_quality` like any other. The remaining 130
inferred rows are mostly small places whose tier would not change either way, but a row
reading `inferred from 1940` in a 1930 file should be read as an upper bound.
