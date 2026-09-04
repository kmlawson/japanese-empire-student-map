#!/usr/bin/env python3
"""Build kr-trains.js and timetable/korea-1938.html from the 1938 timetable.

The source is the transcription of a 1938 朝鮮・滿洲・內地 pocket timetable
(the Korea 1938 project), vendored under data/kr-1938-timetable/ in the same
shape as the Taiwan bundle so this build does not depend on the network. Two
things come out of it:

  kr-trains.js               the lines, the stations, the 1,666 trains and the
                             track between consecutive stops, in the compact
                             form trains.js reads -- the Korean pages and, drawn
                             straight between city points, the Manchurian and
                             Japanese connections and the ferries
  timetable/korea-1938.html  the 173 printed tables of those pages, with
                             an anchor per table so a station card can link
                             to the line the reader is looking at

WHAT IS NOT DONE HERE. No geometry is simplified. The track between two
stations is carried point for point from the source -- the NIKH 1942 railway
lines, along which the transcription project traced each pair of consecutive
stops -- rounded to five decimal places, and the count of points in and out
is printed so a silent loss would show.

THE STATIONS ARE MATCHED TO OUR OWN TABLE BY NAME, folded through a table of
舊字體 variants, because the timetable prints 淸津 and 鎭南浦 and
kr-stations.js, built from the same GIS, prints them as that file happens to
spell them. Where a match is found the timetable station carries our
station's id, and that is the whole of the link between a square on the map
and a column of departure times. Where none is found -- the bus stops, the
halts of the narrow-gauge private lines, and 安東, 奉天 and 新京 in the
reference rows -- the station still animates if it has a coordinate and is
simply not clickable if it has none.
"""

import json
import os
import re
import sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'data', 'kr-1938-timetable')
OUT_JS = os.path.join(ROOT, 'kr-trains.js')
OUT_HTML = os.path.join(ROOT, 'timetable', 'korea-1938.html')

# The same fold the transcription project uses to match its names to the GIS
# (tools/edition_lib.py there). Applied to both sides before comparing, because
# neither the booklet nor the GIS is consistent about which form it prints.
VARIANTS = {
    '淸': '清', '鎭': '鎮', '龜': '亀', '黃': '黄', '晋': '晉', '靑': '青',
    '眞': '真', '兩': '両', '廣': '広', '澤': '沢', '驛': '駅', '鐵': '鉄',
    '靈': '霊', '豐': '豊', '峯': '峰', '巖': '岩', '巌': '岩', '舘': '館',
    '內': '内', '齋': '斎', '濟': '済', '溫': '温', '鷄': '鶏', '雞': '鶏',
    '臺': '台', '壽': '寿', '榮': '栄', '樂': '楽', '關': '関', '龍': '竜',
    '灣': '湾', '邊': '辺', '德': '徳', '惠': '恵', '萬': '万', '舊': '旧',
    '彌': '弥', '會': '会', '國': '国', '學': '学', '區': '区', '圖': '図',
    '來': '来', '發': '発', '單': '単', '對': '対', '當': '当', '應': '応',
    '檢': '検', '勞': '労', '營': '営', '嚴': '厳', '嶽': '岳', '觀': '観',
    '劍': '剣', '劒': '剣', '爲': '為', '兒': '児', '燒': '焼', '稻': '稲',
    '穗': '穂', '橫': '横', '點': '点', '麥': '麦', '嶋': '島', '嶌': '島',
    '絲': '糸', '壤': '壌', '鹽': '塩', '總': '総', '聲': '声', '繩': '縄',
    '歸': '帰', '將': '将', '號': '号', '讀': '読', '錄': '録', '緣': '縁',
    '綠': '緑', '樑': '梁', '澁': '渋', '藝': '芸', '寶': '宝', '氣': '気',
    '鑛': '鉱', '礦': '鉱', '亞': '亜', '傳': '伝', '佛': '仏', '轉': '転',
    '乘': '乗', '莊': '荘', '壯': '壮', '圓': '円', '藥': '薬', '據': '拠',
    '晝': '昼', '峽': '峡', '參': '参', '雙': '双', '寬': '寛', '滿': '満',
    '濱': '浜', '齊': '斉', '戶': '戸', '獨': '独', '狹': '狭', '懷': '懐',
    '歡': '歓', '黑': '黒', '肅': '粛', '熙': '煕', '鄕': '郷', '鄉': '郷',
    '靜': '静', '淺': '浅', '寢': '寝', '瀧': '滝', '櫻': '桜', '曾': '曽',
}

# What each line was, in a sentence or two, for the card a tap on the track
# opens. Kept to the route, the builder and the date where those are well
# established; the figures a reader can check against the printed table one
# link away are the ones the card measures for itself.
LINE_NOTES = {
    '京釜本線': 'The trunk of the peninsula, Fuzan to Keijō, opened through on 1 January 1905 by the Keifu Railway Company and taken over by the Government-General a year later. In this table the special express あかつき runs the 450 km in six and three-quarter hours, and ひかり and のぞみ run on over the Yalu to Hōten and Shinkyō.',
    '京義本線': 'Keijō to Shingishū and over the Yalu bridge to Antung, built as a military line during the Russo-Japanese War and opened in 1906; with the bridge of 1911 it became the through route from Japan to Manchuria. The expresses from Fuzan pass down it by night.',
    '京元・咸鏡本線': 'The Keigen line, Keijō to Genzan, opened in 1914; the Kankyō line carried it on up the east coast to Seishin and Kainei, and was completed in 1928. The through trains in this table run from Keijō to Shinhokusei and on to Seishin, a night and a day on the road.',
    '湖南本線': 'Taiden to Moppo through the rice plains of the south-west, opened in 1914. The through trains connect with the trunk line at Taiden.',
    '全羅線': 'Riri to Zenshū and on to the port of Reisui, a private light railway of 1914 rebuilt to standard gauge by the Government Railways and reaching Reisui in 1936, two years before this table.',
    '慶全線': 'Two sections of the line that was meant to join Keishō and Zenra provinces along the south coast: from Sanrōshin on the trunk line through Masan to Shinshū, and from Shōteiri on the Honam line to Junten. The middle was not built until after the war.',
    '東海線': 'Three sections of the east-coast line: from Fuzan by Urusan to Keishū in the south, the former narrow-gauge Keitō line from Taikyū to Kakuzan in the middle, and from Genzan down to Jōyō in the north. The gap between Jōyō and Keishū was never closed.',
    '京仁線': 'The first railway in Korea: Noryangjin to Chemulpo, opened on 18 September 1899, and carried over the Han into Keijō the next year. In this table it is a suburban line with a train most hours.',
    '龍山線': 'A short loop from Ryūzan round the west of Keijō by Seikō, with a branch to Tōjinri; the tables print the same stations twice because the trains run out and back.',
    '群山線': 'Riri to the port of Gunzan, opened in 1912 for the rice trade.',
    '光州線': 'A branch from Kōshū, the Zennan provincial capital, to Tan\'yō.',
    '鎭海線': 'From Shōgen on the Masan line to the naval port of Chinkai, opened in 1926.',
    '平壤炭礦線': 'A colliery line east from Heijō to Shōkori on the Taedong, opened in 1911.',
    '滿浦線': 'North from Heijō through Junsen towards the Yalu at Manpō, still building in 1938: the trains in this table turn at Kōkai.',
    '平元線': 'Heijō to Genzan across the waist of the peninsula, built from both ends and not joined until 1941; this table has the western section to Yōtoku and the eastern from Kōgen to Jōnai.',
    '龍登線': 'A short coal branch from Kyūjō on the Manpō line to Ryūtō.',
    '新義州江岸線': 'The shuttle between Shingishū river-bank and Antung, across the Yalu bridge.',
    '兼二浦線': 'From Kōshū on the Keigi line to the ironworks at Kenjiho, opened in 1910.',
    '价川線': 'A narrow-gauge line of the Chōsen Railway from Shin\'anshū to Kaisen, opened in 1916.',
    '平南線': 'Heijō to its port at Chinnampo, opened in 1910.',
    '博川線': 'A branch from Mōchūri on the Keigi line to Hakusen.',
    '北青線': 'A short branch from Shinhokusei on the Kankyō line to the town of Hokusei.',
    '惠山線': 'From Kisshū on the Kankyō line into the mountains to Keizanchin on the Yalu, opened in stages through the 1930s.',
    '白茂線': 'A narrow-gauge forest railway from Hakugan on the Keizan line towards Mosan, still building in 1938.',
    '鐵山・遮湖線': 'From the port of Shako to the Rigen iron mine, two short lines worked as one.',
    '川內里線': 'A branch from Ryūtan on the Kankyō line to the cement works at Sennairi.',
    '水仁線': 'A narrow-gauge line of the Keitō Railway from Suigen to the port of Jinsen, opened in 1937.',
    '黃海線': 'The narrow-gauge network of the Chōsen Railway in Kōkai province: Shariin to Chōen, Kaishū to Toseong and Jōkai, and the harbour lines round Kaishū itself.',
    '咸平軌道': 'A light tramway from Kakkyō on the Honam line to the town of Kanpei.',
    '水驪線': 'A narrow-gauge line of the Keitō Railway from Suigen east to Yoshū.',
    '慶北線': 'Kinsen on the trunk line to Antō in North Keishō, completed in 1931.',
    '忠北線': 'A Chōsen Railway line from Chōchiin on the trunk line to Chūshū, opened in stages between 1921 and 1928.',
    '咸南線': 'The narrow-gauge line of the Shinkō Railway from Kankō up the Seikō valley to Jōtsū, built for the hydro-electric works on the Chōshin and Fusen rivers.',
    '松興線': 'The Shinkō Railway\'s line from Kannan-Shinkō up to Kogan on the Fusen reservoir, climbing the pass by an incline.',
    '長津線': 'The Shinkō Railway\'s line from Jōtsū up to Shisui by the Chōshin dam, with an incline over the divide.',
    '興南線': 'A local line from Nishi-Kankō to Seikori by the nitrogen works at Kōnan, with a train most hours.',
    '金剛山電氣鐵道': 'The electric railway from Tetsugen on the Keigen line to Naikongō in the Diamond Mountains, opened in stages between 1924 and 1931 for the pilgrims and tourists who went there.',
    '咸北線': 'From Komosan on the Kankyō line to the iron mine at Mosan on the Tumen.',
    '忠南線': 'The Keinan Railway from Tenan on the trunk line down to Chōkō on the Kum estuary, with a ferry across to Gunzan; the timetable prints the ferry with it.',
    '京畿線': 'The Keinan Railway\'s line from Tenan inland to Chōkoin.',
    '北鮮線': 'Seishin to Rashin, built by the South Manchuria Railway in the 1930s as the sea outlet for Manchukuo and worked by the Manchukuo State Railways in this table.',
    '會寧炭礦線': 'A colliery line from Kainei to Shinkeirin.',
    # THE CONNECTIONS. Drawn straight between the cities the map already
    # places, because no station GIS for Manchuria or Japan is in the map yet;
    # each note says so. They are the network the Korean tables connect to.
    '朝開線': 'A Manchukuo line from Kamisanpō on the Tumen across to Chōyōsen, over the border from the Kankyō line.',
    '京圖線': 'Shinkyō east to Kitsurin, Tonka and the Tumen at Tomon, the Manchukuo State Railways\' route to the Korean ports.',
    '琿春鐵路線': 'A short line to Konshun from the Tumen valley.',
    '圖佳線': 'North from the Tumen at Nan\'yō to Botankō, opened in the mid-1930s.',
    '奉山線': 'Hōten south-west to Sankaikan and the Great Wall, the old Peking–Mukden line.',
    '拉濱線': 'Rappō on the Keito line north to Harbin.',
    '錦承線・葉峰線': 'Kinken west through Chōyō to Sekihō and Shōtoku in Jehol.',
    '京濱線': 'Shinkyō north to Harbin, the former Chinese Eastern Railway\'s southern branch.',
    '奉吉線': 'Hōten east to Kitsurin.',
    '平齊線・齊北線・北黑線・濱北線': 'Shiheigai north-west to Chichiharu and on to Hokuan and Harbin, the lines through the Manchurian plain.',
    '濱綏線・濱洲線': 'The former Chinese Eastern Railway across the north of Manchukuo, Suifenhe through Harbin to Manchouli on the Soviet border.',
    '連京線': 'The South Manchuria Railway\'s main line, Dairen north through Hōten to Shinkyō and Harbin; the あじあ runs it in this table.',
    '營口線': 'The branch from Daisekkyō to the port of Eikō.',
    '旅順線': 'Dairen to the naval port of Ryojun.',
    '安奉線': 'Antung on the Yalu to Hōten, the South Manchuria Railway\'s link with Korea, over which the Fuzan expresses ran.',
    '撫順線': 'Hōten to the collieries at Bujun.',
    '東海道・山陽本線': 'Tōkyō to Shimonoseki, the trunk of Japan, with 富士 and さくら running it in nineteen hours to meet the Kanpu ferry.',
    '關西線・參宮線': 'Feeder rows from Nagoya to Toba and Uji-Yamada, printed with the trunk tables.',
    '關門連絡船': 'The fifteen-minute ferry across the strait between Shimonoseki and Moji, sailing every hour or two.',
    '鹿兒島本線': 'Moji down the west of Kyūshū to Kumamoto and Kagoshima.',
    '長崎本線': 'Tosu to Nagasaki and Sasebo.',
    '日豐本線': 'Moji down the east of Kyūshū by Ōita and Miyazaki to Kagoshima.',
    '豐肥本線': 'Kumamoto across the island to Ōita.',
    '山陰本線': 'Shimonoseki up the Japan Sea coast by Matsue and Tottori to Fukuchiyama and Kyōto.',
    '大社線': 'Shuttles between Izumo-Imaichi and the great shrine at Taisha.',
    '宮津線': 'Toyooka to Maizuru, printed as feeder rows.',
    '北陸・信越・羽越本線': 'Ōsaka up the Japan Sea coast by Kanazawa and Niigata to Aomori, and over the mountains to Ueno.',
    '關西本線': 'Kameyama to Nara and Minatomachi in Ōsaka.',
    '東北本線・常磐線・奧羽本線': 'Ueno north to Sendai, Morioka and Aomori for the Hakodate ferry, by the inland and the coast routes and the Ōu line.',
    '青函連絡船': 'The ferry between Aomori and Hakodate, four and a half hours across the Tsugaru strait.',
    '關釜連絡船': 'The Fuzan–Shimonoseki ferry, seven and a half hours across the strait, two boats a day each way: the day boat met the 特急 at Shimonoseki and ひかり at Fuzan, the night boat のぞみ and あかつき. Reconstructed from the connecting rows printed over the trains.',
    '長項—群山 連絡線': 'The ferry across the Kum estuary between the Keinan Railway at Chōkō and Gunzan, thirty crossings a day.',
}

# The Japanese reading of each line's name, for when the reader has asked for
# Japanese names; McCune-Reischauer is the local romanisation on this map and
# the English name is used the rest of the time.
LINE_JA = {
    '京釜本線': 'Keifu honsen', '京義本線': 'Keigi honsen',
    '京元・咸鏡本線': 'Keigen–Kankyō honsen', '湖南本線': 'Konan honsen',
    '全羅線': 'Zenra-sen', '慶全線': 'Keizen-sen', '東海線': 'Tōkai-sen',
    '京仁線': 'Keijin-sen', '龍山線': 'Ryūzan-sen', '群山線': 'Gunzan-sen',
    '光州線': 'Kōshū-sen', '鎭海線': 'Chinkai-sen', '平壤炭礦線': 'Heijō tankō-sen',
    '滿浦線': 'Manpo-sen', '平元線': 'Heigen-sen', '龍登線': 'Ryūtō-sen',
    '新義州江岸線': 'Shingishū kōgan-sen', '兼二浦線': 'Kenjiho-sen',
    '价川線': 'Kaisen-sen', '平南線': 'Heinan-sen', '博川線': 'Hakusen-sen',
    '北青線': 'Hokusei-sen', '惠山線': 'Keizan-sen', '白茂線': 'Hakumu-sen',
    '鐵山・遮湖線': 'Tessan–Shako-sen', '川內里線': 'Sennairi-sen',
    '水仁線': 'Suijin-sen', '黃海線': 'Kōkai-sen', '咸平軌道': 'Kanpei kidō',
    '水驪線': 'Suiyo-sen', '慶北線': 'Keihoku-sen', '忠北線': 'Chūhoku-sen',
    '咸南線': 'Kannan-sen', '松興線': 'Shōkō-sen', '長津線': 'Chōshin-sen',
    '興南線': 'Kōnan-sen', '金剛山電氣鐵道': 'Kongōsan denki tetsudō',
    '咸北線': 'Kanhoku-sen', '忠南線': 'Chūnan-sen', '京畿線': 'Keiki-sen',
    '北鮮線': 'Hokusen-sen', '會寧炭礦線': 'Kainei tankō-sen',
    '朝開線': 'Chōkai-sen', '京圖線': 'Keito-sen', '琿春鐵路線': 'Konshun tetsuro',
    '圖佳線': 'Toka-sen', '奉山線': 'Hōzan-sen', '拉濱線': 'Rahin-sen',
    '錦承線・葉峰線': 'Kinshō-sen', '京濱線': 'Keihin-sen', '奉吉線': 'Hōkichi-sen',
    '平齊線・齊北線・北黑線・濱北線': 'Heisei-sen', '濱綏線・濱洲線': 'Hinsui–Hinshū-sen',
    '連京線': 'Renkyō-sen', '營口線': 'Eikō-sen', '旅順線': 'Ryojun-sen',
    '安奉線': 'Anpō-sen', '撫順線': 'Bujun-sen',
    '東海道・山陽本線': 'Tōkaidō–San\'yō honsen', '關西線・參宮線': 'Kansai–Sangū-sen',
    '關門連絡船': 'Kanmon renrakusen', '鹿兒島本線': 'Kagoshima honsen',
    '長崎本線': 'Nagasaki honsen', '日豐本線': 'Nippō honsen', '豐肥本線': 'Hōhi honsen',
    '山陰本線': 'San\'in honsen', '大社線': 'Taisha-sen', '宮津線': 'Miyazu-sen',
    '北陸・信越・羽越本線': 'Hokuriku–Shin\'etsu–Uetsu honsen', '關西本線': 'Kansai honsen',
    '東北本線・常磐線・奧羽本線': 'Tōhoku–Jōban–Ōu honsen', '青函連絡船': 'Seikan renrakusen',
    '關釜連絡船': 'Kanpu renrakusen', '長項—群山 連絡線': 'Chōkō–Gunzan renrakusen',
}

LINE_EN = {
    '京釜本線': 'Gyeongbu Line', '京義本線': 'Gyeongui Line',
    '京元・咸鏡本線': 'Gyeongwon–Hamgyong Line', '湖南本線': 'Honam Line',
    '全羅線': 'Jeolla Line', '慶全線': 'Gyeongjeon Line', '東海線': 'East Sea Line',
    '京仁線': 'Gyeongin Line', '龍山線': 'Yongsan Line', '群山線': 'Gunsan Line',
    '光州線': 'Gwangju Line', '鎭海線': 'Jinhae Line', '平壤炭礦線': 'Pyongyang Colliery Line',
    '滿浦線': 'Manpo Line', '平元線': 'Pyongwon Line', '龍登線': 'Yongdeung Line',
    '新義州江岸線': 'Sinuiju River-bank Line', '兼二浦線': 'Gyeomipo Line',
    '价川線': 'Gaecheon Line', '平南線': 'Pyongnam Line', '博川線': 'Bakcheon Line',
    '北青線': 'Bukcheong Line', '惠山線': 'Hyesan Line', '白茂線': 'Baengmu Line',
    '鐵山・遮湖線': 'Cheolsan–Chaho Line', '川內里線': 'Cheonnaeri Line',
    '水仁線': 'Suin Line', '黃海線': 'Hwanghae Line', '咸平軌道': 'Hampyeong Tramway',
    '水驪線': 'Suryeo Line', '慶北線': 'Gyeongbuk Line', '忠北線': 'Chungbuk Line',
    '咸南線': 'Hamnam Line', '松興線': 'Songheung Line', '長津線': 'Jangjin Line',
    '興南線': 'Heungnam Line', '金剛山電氣鐵道': 'Kumgangsan Electric Railway',
    '咸北線': 'Hambuk Line', '忠南線': 'Chungnam Line', '京畿線': 'Gyeonggi Line',
    '北鮮線': 'Bukseon Line', '會寧炭礦線': 'Hoeryong Colliery Line',
    '朝開線': 'Chaokai Line', '京圖線': 'Jingtu Line', '琿春鐵路線': 'Hunchun Railway',
    '圖佳線': 'Tujia Line', '奉山線': 'Fengshan Line', '拉濱線': 'Labin Line',
    '錦承線・葉峰線': 'Jincheng–Yefeng Line', '京濱線': 'Jingbin Line', '奉吉線': 'Fengji Line',
    '平齊線・齊北線・北黑線・濱北線': 'Pingqi–Qibei–Beihei–Binbei Line', '濱綏線・濱洲線': 'Binsui–Binzhou Line',
    '連京線': 'Lianjing Line (SMR main line)', '營口線': 'Yingkou Line', '旅順線': 'Lüshun Line',
    '安奉線': 'Anfeng Line', '撫順線': 'Fushun Line',
    '東海道・山陽本線': 'Tōkaidō–San\'yō Line', '關西線・參宮線': 'Kansai–Sangū feeders',
    '關門連絡船': 'Kanmon Ferry', '鹿兒島本線': 'Kagoshima Line', '長崎本線': 'Nagasaki Line',
    '日豐本線': 'Nippō Line', '豐肥本線': 'Hōhi Line', '山陰本線': 'San\'in Line',
    '大社線': 'Taisha Line', '宮津線': 'Miyazu Line', '北陸・信越・羽越本線': 'Hokuriku–Shin\'etsu–Uetsu Line',
    '關西本線': 'Kansai Line', '東北本線・常磐線・奧羽本線': 'Tōhoku–Jōban–Ōu Line',
    '青函連絡船': 'Seikan Ferry', '關釜連絡船': 'Kanpu Ferry', '長項—群山 連絡線': 'Changhang–Gunsan Ferry',
}

# Korean Wikipedia where it has the article, which is the local language on
# this map; only lines whose article is known to exist.
LINE_WIKI = {
    '京釜本線': ('ko', '경부선'), '京義本線': ('ko', '경의선'),
    '京元・咸鏡本線': ('ko', '경원선'), '湖南本線': ('ko', '호남선'),
    '全羅線': ('ko', '전라선'), '慶全線': ('ko', '경전선'),
    '東海線': ('ko', '동해남부선'), '京仁線': ('ko', '경인선'),
    '群山線': ('ko', '군산선'), '鎭海線': ('ko', '진해선'),
    '滿浦線': ('ko', '만포선'), '平元線': ('ko', '평원선'),
    '平南線': ('ko', '평남선'), '惠山線': ('ko', '혜산선'),
    '白茂線': ('ko', '백무선'), '水仁線': ('ko', '수인선'),
    '水驪線': ('ko', '수려선'), '慶北線': ('ko', '경북선'),
    '忠北線': ('ko', '충북선'), '金剛山電氣鐵道': ('ko', '금강산선'),
    '忠南線': ('ko', '장항선'),
}


def name_key(s):
    s = re.sub(r'\s*[（(][^)）]*[)）]\s*', '', str(s))
    s = re.sub(r'[\s·・,，]', '', s)
    return ''.join(VARIANTS.get(c, c) for c in s)


def grab(text, name):
    """One `const NAME = <json>;` line out of the source bundle."""
    i = text.index('const %s = ' % name) + len('const %s = ' % name)
    j = text.index('\n', i)
    return json.loads(text[i:j].rstrip().rstrip(';'))


def our_stations():
    """kr-stations.js, which is JSON with a JS wrapper and trailing commas."""
    txt = open(os.path.join(ROOT, 'kr-stations.js'), encoding='utf-8').read()
    body = txt[txt.index('['):txt.rindex(']') + 1]
    return json.loads(re.sub(r',\s*([\]}])', r'\1', body))


def build_js(anchors=None):
    src = open(os.path.join(SRC, 'data.js'), encoding='utf-8').read()
    stations = grab(src, 'STATIONS')
    trains = grab(src, 'TRAINS')
    paths = grab(src, 'PATHS')
    colours = grab(src, 'LINE_COLORS')
    # THE CONNECTIONS ARE DRAWN STRAIGHT. The Manchurian and Japanese pages
    # and the ferries have no line GIS behind them yet: their stations sit at
    # the map's own city points and the track between two of them is a chord,
    # kept apart in the bundle as CHORDS and the lines it belongs to listed as
    # APPROX_LINES, so the module can draw them fainter and the card can say
    # so. Until a source for the alignment arrives that is the honest picture.
    chords = grab(src, 'CHORDS') if 'const CHORDS = ' in src else {}
    approx = set(grab(src, 'APPROX_LINES') if 'const APPROX_LINES = ' in src else [])

    # ONE HANJA CAN BE TWO STATIONS -- kr-stations.js has 豊山, 松亭 and 高山
    # twice, in different provinces -- so a name maps to a list, and the
    # bundle's own coordinate (already resolved by the line the table is on)
    # picks the nearer. A station with no coordinate takes the first, which
    # is the only guess left and is said so here.
    ours = {}
    for r in our_stations():
        ours.setdefault(name_key(r['han']), []).append(r)

    def nearest(cands, s):
        if not cands:
            return None
        if s.get('lon') is None or len(cands) == 1:
            return cands[0]
        return min(cands, key=lambda r: (r['lon'] - s['lon']) ** 2 + (r['lat'] - s['lat']) ** 2)

    line_names = list(colours.keys())
    line_ix = {n: i for i, n in enumerate(line_names)}

    st_ix = {}
    out_st = []
    matched = coordless = 0
    for s in stations:
        st_ix[s['name']] = len(out_st)
        # Only a station the Korean GIS placed can own one of the map's
        # squares: the same name on a Manchurian page (京城 in a reference
        # row of the 安奉線 table) is a record without a coordinate, and if it
        # took the square the card would open on the wrong copy and be empty.
        mine = None
        if s.get('lon') is not None and not s.get('approx'):
            mine = nearest(ours.get(name_key(s.get('label') or s['name'])), s)
        if mine:
            matched += 1
        if s['lon'] is None:
            coordless += 1
        # `name` is the bundle's key (松亭@dhn_008 where one name is two
        # places); `label` is what the station is called
        rec = {'n': s.get('label') or s['name']}
        # The names as this map holds them, so a card can print the
        # characters, the McCune-Reischauer and the Japanese reading in one
        # row without asking a second file at run time. `py` is the local
        # romanisation slot trains.js reads -- pinyin for Taiwan, M-R here.
        if mine:
            rec['sid'] = mine['id']
            if mine.get('mr'):
                rec['py'] = mine['mr']
            if mine.get('ro'):
                rec['ro'] = mine['ro']
            if mine.get('kr'):
                rec['kr'] = mine['kr']
        # and where the map has no square, the GIS reading the bundle carries
        if not rec.get('py') and s.get('mr'):
            rec['py'] = s['mr']
        if not rec.get('ro') and s.get('romaji'):
            rec['ro'] = s['romaji']
        if not rec.get('kr') and s.get('hangul'):
            rec['kr'] = s['hangul']
        if s['lon'] is not None:
            rec['lon'] = round(s['lon'], 5)
            rec['lat'] = round(s['lat'], 5)
        rec['li'] = [line_ix[l] for l in s['lines'] if l in line_ix]
        out_st.append(rec)

    out_tr = []
    for t in trains:
        stops = []
        for st in t['stops']:
            fl = 0
            if st.get('r'):
                fl |= 1        # timed on another line's table, not this one
            if st.get('p'):
                fl |= 2        # passes without stopping
            if st.get('u'):
                fl |= 4        # the source reading is uncertain
            row = [st_ix[st['s']], st.get('am'), st.get('dm')]
            if fl:
                row.append(fl)
            stops.append(row)
        rec = {'no': t['no'], 'li': line_ix.get(t['line'], -1),
               'dir': 0 if t['dir'].startswith(('下', '西')) else 1,
               'cls': t.get('cls') or '', 'dest': t.get('dest') or '',
               'st': stops}
        if t.get('marks'):
            rec['mk'] = t['marks']
        out_tr.append(rec)

    # Re-keyed from a pair of names to a pair of indices, and the coordinates
    # made to run from the lower index to the higher one so the reader of this
    # file needs no second rule about which way round it is stored.
    pts_in = pts_out = 0
    out_pa = {}
    ends_ok = ends_seen = 0
    allp = dict(paths)
    for k, pts in chords.items():
        allp.setdefault(k, pts)
    for k, pts in allp.items():
        a, b = k.split('|')
        if a not in st_ix or b not in st_ix:
            continue
        ia, ib = st_ix[a], st_ix[b]
        pts_in += len(pts)
        run = list(pts) if ia < ib else list(reversed(pts))
        lo, hi = (ia, ib) if ia < ib else (ib, ia)
        flat = []
        last = None
        for p in run:
            q = (round(p[0], 5), round(p[1], 5))
            if q == last:
                continue          # the snapped node repeating the station
            last = q
            flat.append(q[0])
            flat.append(q[1])
        pts_out += len(flat) // 2
        out_pa['%d|%d' % (lo, hi)] = flat
        s0 = out_st[lo]
        if 'lon' in s0:
            ends_seen += 1
            if abs(flat[0] - s0['lon']) < 0.02 and abs(flat[1] - s0['lat']) < 0.02:
                ends_ok += 1

    doc = {
        'year': 1938,
        'issued': 'early 1938',
        'local': 'M–R',
        'lines': [{'n': n, 'en': LINE_EN.get(n, n), 'c': colours[n],
                   'a': (anchors or {}).get(n, ''),
                   'x': 1 if n in approx else 0,
                   'd': LINE_NOTES.get(n, ''),
                   'ja': LINE_JA.get(n, ''),
                   'wl': LINE_WIKI.get(n, ('', ''))[0],
                   'w': ('https://%s.wikipedia.org/wiki/%s'
                         % (LINE_WIKI[n][0], quote(LINE_WIKI[n][1])))
                        if n in LINE_WIKI else ''}
                  for n in line_names],
        'stations': out_st,
        'trains': out_tr,
        'paths': out_pa,
    }
    head = (
        '/* Built by tools/build_kr_trains.py -- do not edit.\n'
        ' * The 1938 Korean railway timetable and its connections: %d trains over %d lines,\n'
        ' * calling at %d stations, with the track between consecutive stops.\n'
        ' * Source: the transcription in data/kr-1938-timetable/, from a\n'
        ' * 1938 Korea-Manchuria-Japan pocket timetable (revisions of\n'
        ' * December 1937 and January 1938).\n'
        ' * Stop rows are [station, arrival, departure, flags] in minutes from\n'
        ' * midnight, past 1440 meaning the small hours of the next day; flags\n'
        ' * are 1 timed on another line, 2 passes without stopping, 4 the\n'
        ' * printed reading is uncertain. Path keys are a pair of station\n'
        ' * indices, low first, and the coordinates run that way. A line with\n'
        ' * x=1 is drawn straight between city points, its alignment unsourced. */\n'
        % (len(out_tr), len(line_names), len(out_st)))
    body = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    with open(OUT_JS, 'w', encoding='utf-8') as f:
        f.write(head)
        f.write('window.JMAP = window.JMAP || {};\n')
        f.write('JMAP.KR_TRAINS = ')
        f.write(body)
        f.write(';\n')

    print('stations   %d, %d matched to kr-stations.js, %d with no coordinate'
          % (len(out_st), matched, coordless))
    print('trains     %d, %d stop rows'
          % (len(out_tr), sum(len(t['st']) for t in out_tr)))
    print('paths      %d segments (%d of them straight chords between city points), '
          '%d points in, %d out (%.1f%% kept; the loss is a station\'s snapped node '
          'repeating its own coordinate)'
          % (len(out_pa), len(chords), pts_in, pts_out, 100.0 * pts_out / max(1, pts_in)))
    print('lines      %d, %d drawn approximately' % (len(line_names), len(approx)))
    print('           %d of %d segments start within 0.02 deg of their station'
          % (ends_ok, ends_seen))
    print('wrote      %s (%d KB)' % (os.path.relpath(OUT_JS, ROOT),
                                     os.path.getsize(OUT_JS) // 1024))
    return doc


# ---------------------------------------------------------------------------
# THE PRINTED TABLES, IN THREE LANGUAGES.
#
# The page furniture is translated and the tables are not, as on the Taiwan
# page: the tables are a transcription of a printed document, and the only
# thing that happens inside one is that a station name gains its reading on a
# second line. The languages are Japanese, Korean and English -- Korean rather
# than Chinese because that is the local language of the places in it, and
# the reading under a name is the Japanese one in Japanese, the hangul in
# Korean and McCune-Reischauer in English.
UI = {
    'title': ('朝鮮鐵道時刻表（昭和13年・1938）— 転記',
              '조선 철도 시각표 (1938년) — 전사',
              'Korean Railway Timetable, early 1938 — transcription'),
    'map': ('地圖', '지도', 'Map'),
    'warn': (
        '注：本頁の時刻は寫眞から Claude Code の畫像モデルが轉記したものです。'
        '判読に迷った箇所は赤い ? で示しています。午前・午後は活字の太さと連絡船の'
        '時刻から判定しました。時刻と線名はまだ人間による確認を經ておらず、'
        '今後の品質管理の對象です。訂正のご連絡をお待ちしています。',
        '주: 이 페이지의 시각은 원본 사진에서 Claude Code 의 이미지 모델이 옮긴 '
        '것입니다. 판독이 불확실한 곳은 빨간 ? 로 표시했습니다. 시각과 노선명은 '
        '아직 사람이 검토하지 않았으며, 향후 품질 관리 대상입니다. 정정 제보를 '
        '환영합니다.',
        'Note: these times were transcribed by Claude Code\u2019s vision model '
        'from photographs of the original; a red ? marks a reading it doubted. '
        'Morning and afternoon were settled from the weight of the type and '
        'the ferry connections. The times and lines have not yet been '
        'carefully checked (by a human!) yet, but will be part of a planned '
        'data quality control check. In the meantime corrections are '
        'welcome.'),
    'legend': (
        '時刻は24時間表記（原本: 細字=午前・太字=午後）。'
        '↓=通過、*=他線の參考時刻、赤?=判読不確実。',
        '시각은 24시간제 (원본: 가는 글씨=오전, 굵은 글씨=오후). '
        '↓=통과, *=다른 노선의 참고 시각, 빨간 ?=판독 불확실.',
        'Times are on the 24-hour clock — in the original, light type is '
        'morning and bold is afternoon. ↓ means the train passes without '
        'stopping, * a reference time from another line\'s table, and a red ? '
        'that the print could not be read with certainty.'),
    'page': ('原本', '원본', 'Original'),
    'notes': ('轉記者の註記', '전사자의 주석', 'Notes on the page, as transcribed'),
    'readings': ('讀み', '읽기', 'Readings'),
    'down': ('下り', '하행', 'down'),
    'up': ('上り', '상행', 'up'),
    'from': ('この頁は 1938 年の朝鮮・滿洲・內地聯絡時刻表の轉記のうち朝鮮の頁を收めたものです。'
             '滿洲・內地の頁と航空・自動車の表は轉記プロジェクトの方にあります。',
             '이 페이지는 1938년 조선·만주·내지 연락 시각표 전사 가운데 조선 부분입니다.',
             'This page holds the Korean pages of the 1938 transcription; the '
             'Manchurian and Japanese pages, the air timetables and the bus '
             'list are in the transcription project itself.'),
}

COLS_EN = {
    '粁程': 'km', '驛名': 'Station', '等級': 'Class', '行先': 'To',
    '記事': 'Notes', '著': 'arr', '發': 'dep',
}


def page_extras(stations):
    reads = {}
    for st in stations:
        if st.get('py') or st.get('kr') or st.get('ro'):
            reads[st['n']] = [st.get('py', ''), st.get('kr', ''), st.get('ro', '')]
    css = """
.warn{margin:6px 0 10px;padding:7px 10px;border-left:3px solid #a33;
background:#f7ece4;color:#5a2b1e;font-size:12.5px;max-width:70em}
#langbar{display:flex;gap:6px;align-items:center;margin-left:auto;font-size:12px}
#langbar button{font:inherit;padding:3px 9px;border:1px solid #8a7a5c;border-radius:5px;
background:transparent;color:#e8c988;cursor:pointer}
#langbar button:hover{border-color:#e8c988}
#langbar button[aria-pressed=true]{background:#f5f0e6;color:#3a2b1e;border-color:#f5f0e6}
#langbar label{color:#e8c988;display:flex;gap:4px;align-items:center;cursor:pointer}
.rd{display:block;font-size:10px;line-height:1.25;color:#7a6a52;font-weight:400;
white-space:nowrap}
body.no-rd .rd{display:none}
.notes-head{margin:18px 0 4px;font-size:13px;color:#666}
"""
    js = ("(function(){\n"
          "var UI=" + json.dumps({k: list(v) for k, v in UI.items()},
                                 ensure_ascii=False) + ";\n"
          "var RD=" + json.dumps(reads, ensure_ascii=False) + ";\n"
          "var COLS=" + json.dumps(COLS_EN, ensure_ascii=False) + ";\n"
          + PAGE_JS + "})();")
    return css, js


PAGE_JS = r"""
var IX = {ja:0, ko:1, en:2};
/* English first: this page is read by students of the empire more often
   than by readers of its languages, and the buttons are right there for
   anyone who wants the original's own. A choice already made is
   remembered, so nobody is moved back. */
var lang = 'en';
try { lang = localStorage.getItem('kt-lang') || 'en'; } catch (e) {}
var asked = (location.search.match(/[?&]lang=(\w+)/) || [])[1];
if (asked) lang = asked;
if (!(lang in IX)) lang = 'en';

/* Every station name in the tables gets its reading on a second line. Matched
   on the whole text of a cell, so it catches the station column and the
   destination row at the head of each table as well. */
function annotate() {
  var cells = document.querySelectorAll('td, th');
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];
    if (c.querySelector('.rd')) continue;
    var t = (c.textContent || '').trim();
    if (!t || !RD[t]) continue;
    var rd = document.createElement('span');
    rd.className = 'rd';
    c.appendChild(rd);
    c.setAttribute('data-stn', t);
  }
}

function words(key) { return (UI[key] || ['', '', ''])[IX[lang]]; }

function apply() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (UI[k]) el.textContent = words(k);
  });
  document.querySelectorAll('h2[data-dir]').forEach(function (h) {
    var dir = h.getAttribute('data-dir') === 'up' ? words('up') : words('down');
    h.textContent = h.getAttribute('data-line') + ' ' + dir + ' '
      + h.getAttribute('data-ends');
  });
  document.querySelectorAll('p.pg').forEach(function (p) {
    var pages = p.getAttribute('data-pages') || '';
    var open = lang === 'en' ? ' (' : '（', shut = lang === 'en' ? ')' : '）';
    p.textContent = words('page') + ' ' + pages + open
      + (p.getAttribute('data-src') || '') + shut;
  });
  document.querySelectorAll('tr.hd th').forEach(function (th) {
    var was = th.getAttribute('data-was');
    if (was === null) { was = (th.textContent || '').trim(); th.setAttribute('data-was', was); }
    if (!COLS[was]) return;
    th.textContent = lang === 'en' ? COLS[was] : was;
    th.title = lang === 'en' ? was : '';
  });
  document.querySelectorAll('td').forEach(function (td) {
    var was = td.getAttribute('data-was');
    if (was === null) {
      was = (td.textContent || '').trim();
      if (was !== '著' && was !== '發') return;
      td.setAttribute('data-was', was);
    }
    if (!COLS[was]) return;
    td.textContent = lang === 'en' ? COLS[was] : was;
  });
  /* the reading: Japanese in Japanese, hangul in Korean, M-R in English */
  document.querySelectorAll('[data-stn]').forEach(function (c) {
    var r = RD[c.getAttribute('data-stn')] || ['', '', ''];
    var rd = c.querySelector('.rd');
    if (rd) rd.textContent = lang === 'ja' ? r[2] : lang === 'ko' ? r[1] : r[0];
  });
  document.querySelectorAll('#langbar button').forEach(function (b) {
    b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang
                                   ? 'true' : 'false');
  });
  document.title = words('title');
}

function boot() {
  annotate();
  var bar = document.getElementById('langbar');
  bar.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-lang]') : null;
    if (!b) return;
    lang = b.getAttribute('data-lang');
    try { localStorage.setItem('kt-lang', lang); } catch (err) {}
    apply();
  });
  var box = document.getElementById('rd-on');
  var on = true;
  try { on = localStorage.getItem('kt-rd') !== '0'; } catch (err) {}
  box.checked = on;
  document.body.classList.toggle('no-rd', !on);
  box.addEventListener('change', function () {
    document.body.classList.toggle('no-rd', !box.checked);
    try { localStorage.setItem('kt-rd', box.checked ? '1' : '0'); } catch (err) {}
  });
  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }
"""

LANG_BAR = (
    '<span id="langbar">'
    '<button type="button" data-lang="ja" aria-pressed="true">日本語</button>'
    '<button type="button" data-lang="ko" aria-pressed="false">한국어</button>'
    '<button type="button" data-lang="en" aria-pressed="false">English</button>'
    '<label><input type="checkbox" id="rd-on" checked>'
    '<span data-i18n="readings">讀み</span></label>'
    '</span>')


def build_html(stations):
    """The printed tables of the Korean pages, made readable in three
    languages. Only anchors, data- attributes and the readings are added inside
    a table; the times and the names are the transcription untouched."""
    html = open(os.path.join(SRC, 'tables.html'), encoding='utf-8').read()
    seen = {}
    order = []
    first = {}

    def anchor(m):
        head = m.group(1)
        bits = head.split(' ')
        line = bits[0]
        raw = bits[1] if len(bits) > 1 else ''
        direction = 'up' if raw.startswith(('上', '東')) else 'down'
        ends = ' '.join(bits[2:])
        if line not in seen:
            order.append(line)
        seen[line] = seen.get(line, 0) + 1
        slug = 'line-%d-%d' % (order.index(line) + 1, seen[line])
        first.setdefault(line, slug)
        return ('<h2 id="%s" data-line="%s" data-dir="%s" data-ends="%s">%s</h2>'
                % (slug, line, direction, ends, head))

    html, n = re.subn(r'<h2>([^<]*)</h2>', anchor, html)

    def pages(m):
        return ('<p class="pg" data-pages="%s" data-src="%s">原本 %s（%s）</p>'
                % (m.group(1), m.group(2), m.group(1), m.group(2)))
    html, npg = re.subn(r'<p class="pg">原本 ([^（<]*)（([^）]*)）</p>', pages, html)

    html = html.replace(
        '<h1>朝鮮鐵道時刻表（昭和13年・1938）— 転記</h1>',
        '<h1 data-i18n="title">朝鮮鐵道時刻表（昭和13年・1938）— 転記</h1>')
    html = html.replace('<a href="index.html">地圖</a></header>',
                        '<a href="../index.html" data-i18n="map">地圖</a>'
                        + LANG_BAR + '</header>')
    old_legend = html[html.index('<p class="legend">'):
                      html.index('</p>', html.index('<p class="legend">')) + 4]
    html = html.replace(old_legend,
                        '<p class="warn" data-i18n="warn"></p>'
                        '<p class="legend" data-i18n="legend"></p>', 1)
    html = html.replace('<div class="notes">',
                        '<p class="notes-head" data-i18n="notes"></p>'
                        '<div class="notes">')
    css, js = page_extras(stations)
    html = html.replace('</style>', css + '</style>', 1)
    html = html.replace(
        '</main>',
        '<p class="legend" data-i18n="from"></p></main>\n<script>\n'
        + js + '\n</script>')
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)
    with open(OUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html)
    print('tables     %d headings anchored, %d page references, three '
          'languages -> %s (%d KB)'
          % (n, npg, os.path.relpath(OUT_HTML, ROOT),
             os.path.getsize(OUT_HTML) // 1024))
    if n != npg:
        print('WARNING: %d headings but %d page references' % (n, npg),
              file=sys.stderr)
    return first


if __name__ == '__main__':
    doc = build_js()
    anchors = build_html(doc['stations'])
    doc = build_js(anchors)
    missing = [l['n'] for l in doc['lines'] if not l['a']]
    if missing:
        print('WARNING: no table anchor found for ' + ', '.join(missing),
              file=sys.stderr)
    blank = [l['n'] for l in doc['lines'] if not l['d']]
    if blank:
        print('WARNING: no description written for ' + ', '.join(blank),
              file=sys.stderr)
