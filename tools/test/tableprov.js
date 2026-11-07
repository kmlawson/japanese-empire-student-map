/* Tables of provinces, districts, island groups and countries from the address.
 *
 *     node tools/test/tableprov.js        # needs a server on 8123
 *
 * The statistics site's MAPLINK_SPEC section 4c: `china-province`, `korea-province`,
 * `manchukuo-province`, `nanyo-group`, `taiwan-prefecture`, `taiwan-district`, each
 * row a key of the map's own sub-units, and `country`, each row a territory record.
 * Real payloads as the site sends them (decoded from its published links), and for
 * Taiwan, which no link uses yet, payloads made from the map's own figures. Asked of
 * it: each kind is shaded on the date that places its rows; a province the table has
 * no row for is white; what is not on the map is said; Taiwan's prefectures colour
 * their districts; the South Seas groups are dots as well; a country is its atoms on
 * that date's map, Siam answering for Thailand; hover and press answer with the place,
 * with a mouse and with a finger, and after a zoom.
 *
 * It fetches nothing from the statistics site. */
'use strict';
const zlib = require('zlib');
const { sleep, calm, check, report, launch, open } = require('./suite.js');

const encode = o => zlib.deflateRawSync(Buffer.from(JSON.stringify(o), 'utf8'), { level: 9 })
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const link = (o, where) => '?where=' + where + '&layers=2w#t=' + encode(o);

/* From the tables site's china-peking-1921 p0336_1. */
const CHINA = {"v":1,"src":{"url":"https://froginawell.net/reference/old-tables/book/china-peking-1921/#p0336_1","path":"book/china-peking-1921/#p0336_1","book":"china-peking-1921","table":"p0336_1"},"title":{"ja":"Model Prisons in China"},"volume":{"title":"Peking: A Social Survey 1921","year":"1921"},"date":"1918","period":"1930","part":null,"units":"china-province","cols":[{"name":"Number of Prisons","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Number of Prisoners Accommodated","unit":"","kind":"count","pc":true,"color":"seq"}],"def":0,"rows":[{"id":"Hebei","label":"Chihli","row":1,"v":[1,461]},{"id":"Liaoning","label":"Fengtien","row":2,"v":[5,2184]},{"id":"Jilin","label":"Kirin","row":3,"v":[1,690]},{"id":"Shandong","label":"Shantung","row":4,"v":[2,627]},{"id":"Shanxi","label":"Shansi","row":5,"v":[2,695]},{"id":"Jiangsu","label":"Kiangsu","row":6,"v":[2,613]},{"id":"Anhui","label":"Anhui","row":9,"v":[1,344]},{"id":"Jiangxi","label":"Kiangsi","row":10,"v":[2,753]},{"id":"Fujian","label":"Fukien","row":11,"v":[1,241]},{"id":"Zhejiang","label":"Chekiang","row":12,"v":[1,675]},{"id":"Hubei","label":"Hupeh","row":13,"v":[3,1002]},{"id":"Shaanxi","label":"Shensi","row":14,"v":[6,899]},{"id":"Gansu","label":"Kansu","row":15,"v":[1,157]},{"id":"Sichuan","label":"Szechuan","row":16,"v":[1,365]},{"id":"Guangxi","label":"Kuangsi","row":17,"v":[1,586]},{"id":"Yunnan","label":"Yunnan","row":18,"v":[1,456]}],"total":{"label":"Total","row":19,"v":[39,14185]},"unplaced":["Peking","Shanghai","Soochow"],"notes":[]};

/* From the tables site's korea-nenkan-1940 p0072_1. */
const KOREA = {"v":1,"src":{"url":"https://froginawell.net/reference/old-tables/book/korea-nenkan-1940/#p0072_1","path":"book/korea-nenkan-1940/#p0072_1","book":"korea-nenkan-1940","table":"p0072_1"},"title":{"ja":"道・郡・府・邑・面數","en":"Number of Provinces, Counties, Cities, Towns and Townships"},"volume":{"title":"朝鮮年鑑 1940","year":"1940","en":"Chōsen nenkan (Korea Yearbook), 昭和十五年度版 (Shōwa 15 edition), published 1939"},"date":"1939","period":"1942","part":null,"units":"korea-province","cols":[{"name":"府","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"郡","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"島","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"邑","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"面","unit":"","kind":"count","pc":true,"color":"seq"}],"def":0,"rows":[{"id":"Keiki","label":"京畿道","row":0,"v":[3,20,"-",4,"?"]},{"id":"Chuseihoku","label":"忠淸北道","row":1,"v":["-",10,"-",2,104]},{"id":"Chuseinan","label":"忠淸南道","row":2,"v":[1,14,"-",6,167]},{"id":"Zenrahoku","label":"全羅北道","row":3,"v":[2,14,"-",4,172]},{"id":"Zenranan","label":"全羅南道","row":4,"v":[2,21,1,8,244]},{"id":"Keishohoku","label":"慶尙北道","row":5,"v":[1,22,1,8,234]},{"id":"Keishonan","label":"慶尙南道","row":6,"v":[2,19,"-",13,230]},{"id":"Kokai","label":"黃海道","row":7,"v":[1,17,"-",8,204]},{"id":"Heiannan","label":"平安南道","row":8,"v":[2,14,"-",1,139]},{"id":"Heianhoku","label":"平安北道","row":9,"v":[1,19,"-",4,174]},{"id":"Kogen","label":"江原道","row":10,"v":["-",21,"-",7,169]},{"id":"Kankyonan","label":"咸鏡南道","row":11,"v":[2,16,"-",4,126]},{"id":"Kankyohoku","label":"咸鏡北道","row":12,"v":[2,11,"-",5,72]}],"total":{"label":"計","row":13,"v":[19,218,2,74,2276]},"unplaced":[],"notes":[]};

/* From the tables site's manchuria-1936 p0104_1. */
const MANCHUKUO = {"v":1,"src":{"url":"https://froginawell.net/reference/old-tables/book/manchuria-1936/#p0104_1","path":"book/manchuria-1936/#p0104_1","book":"manchuria-1936","table":"p0104_1"},"title":{"ja":"Population in Manchuria"},"volume":{"title":"Fifth Report on Progress in Manchuria 1936","year":"1936","en":"Fifth Report on Progress in Manchuria to 1936"},"date":"1936","period":"1930","part":"(1) Population of Manchoukuo by Provinces (December 31, 1934)","units":"manchukuo-province","cols":[{"name":"Manchoukuoans","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Japanese","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Chosenese","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Foreigners","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Total","unit":"","kind":"count","pc":true,"color":"seq"}],"def":0,"rows":[{"id":"Kirin","label":"Kirin","row":0,"v":[4757356,9774,30013,334,4797477]},{"id":"Lungkiang","label":"Lungkiang","row":1,"v":[2162137,8896,3494,557,2175084]},{"id":"Heiho","label":"Heiho","row":2,"v":[50051,741,1293,651,52736]},{"id":"Sankiang","label":"Sankiang","row":3,"v":[895076,1942,15204,160,912382]},{"id":"Pin Kiang","label":"Pinkiang","row":4,"v":[4167571,2819,39427,140,4209957]},{"id":"Chien Tao","label":"Chientao","row":5,"v":[153163,7202,439093,225,599683]},{"id":"An Tung","label":"Antung","row":6,"v":[2736167,556,46879,40,2783642]},{"id":"Feng Tien","label":"Fengtien","row":7,"v":[9431831,7737,69577,886,9510031]},{"id":"Chinchow","label":"Chinchow","row":8,"v":[3270472,5529,1047,51,3277099]},{"id":"Je Hol","label":"Jehol","row":9,"v":[2606472,4035,602,48,2611157]},{"id":"Hsing An Si","label":"West Hsingan","row":13,"v":[401811,147,186,14,402158]},{"id":"Hsing An Nan","label":"South Hsingan","row":14,"v":[583590,1161,4597,7,589355]},{"id":"Hsing An Tung","label":"East Hsingan","row":15,"v":[56165,356,46,474,57041]},{"id":"Hsing An Peh","label":"North Hsingan","row":16,"v":[36562,132,"-",6372,43066]}],"total":{"label":"Total","row":17,"v":[32052219,76429,662861,77545,32869054]},"unplaced":["Hsinking Special Municipality","Harbin Special Municipality","North Manchuria Special District"],"notes":["(1) (Based upon the statistics compiled by the Statistics Bureau of the Manchoukuo Government)","(2) (Based upon statistics compiled by the Statistics Bureau of the Manchoukuo Government)","* Those figures do not include the population of S. M. R. Zone which is as follows:"]};

/* From the tables site's gyosei-nenpo-1929 p0041_1. */
const NANYO = {"v":1,"src":{"url":"https://froginawell.net/reference/old-tables/book/gyosei-nenpo-1929/#p0041_1","path":"book/gyosei-nenpo-1929/#p0041_1","book":"gyosei-nenpo-1929","table":"p0041_1"},"title":{"ja":"公學校兒童就學歩合累年表","en":"Public School Attendance Ratio by Year"},"volume":{"title":"日本帝國委任統治地域行政年報 1929","year":"1929","en":"Nihon teikoku inin tōchi chiiki gyōsei nenpō (Annual Report on the Administration of the Territory under Japanese Mandate), 千九百二十九年度 (for 1929)"},"date":"1929","period":"1930","part":null,"units":"nanyo-group","cols":[{"name":"1929年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1928年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1927年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1926年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1925年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1924年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1923年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"},{"name":"1922年 (%)","unit":"","kind":"rate","pc":false,"color":"seq"}],"def":0,"rows":[{"id":"Marianas","label":"サイパン","row":0,"v":[61.95,62.25,64.27,67.29,70.16,65.04,68.17,61.96]},{"id":"Yap","label":"ヤップ","row":1,"v":[56.98,54.29,51.27,70.22,53.24,53.85,49.21,38.24]},{"id":"Palau","label":"パラオ","row":2,"v":[91.63,88.89,86.77,91.32,97.15,97.74,96.93,98.62]},{"id":"Chuuk","label":"トラック","row":3,"v":[19.38,18.25,14.25,15.57,39.85,38.81,39.33,31.63]},{"id":"Pohnpei","label":"ポナペ","row":4,"v":[66.67,65.06,67.27,83.87,84.98,84.8,79.82,79.25]},{"id":"Marshalls","label":"ヤルート","row":5,"v":[32.35,26.26,34.85,39.33,52.38,49.36,46.53,47.67]}],"total":{"label":"計","row":6,"v":[45.73,44.08,43.61,48.55,64.85,63.84,62.01,56.88]},"unplaced":[],"notes":["註 (一) 就學歩合ハ滿八歳ヨリ滿十四歳迄ノ兒童ニ就キ調査スルモ公學校（本科）在學者ノ中ニハ滿十四歳以上ノ者千九百二十九年三月一日現在ニ於テ左ノ通相當數ノ數アルヲ以テ實際ノ就學歩合ハ本調査ノ數ヨリ上位ニアルヘシ尚「トラック」「ヤルート」ノ如キ其ノ他支廳管内ニ比シ低位ナルハ此等支廳管内ニハ交通不便ナル離島多ク就學ニ不便ナルカ爲ナリ","(二) 一九二五年度以前ノ就學歩合ハ主トシテ公學校ノ通學區域ニ依リ調査シ離島ノ兒童ハ算入セサリシカ一九二六年度ヨリ各村別ニ調査スルコトトシ離島ノ兒童ヲモ算入スルコトト爲シタルカ爲就學歩合著シク低下セリ然ルニ一九二六年度ノ分ハ「ヤップ」「パラオ」「ポナペ」ノ各支廳管内ニ於テ尚離島ノ年齡別人口未詳ナル所アリ之ヲ省キテ調査シタルカ一九二七年度ニ於テハ未詳ノ人口モ判明シ全部離島ノ兒童ヲ算入シタルヲ以テ又幾分ノ低下ヲ示セリ斯ク就學歩合ハ一九二六年度ニ於テ著シク低下シ一九二七年度ニ於テ又幾分ノ低下ヲ示セルモ是從來算入セサリシ離島兒童ヲ算入シタルカ爲ニシテ實質ニ於テハ寧ロ幾分增加シツツアリ"]};

/* From the tables site's pacific-survey-1941-42 p2-0024_1. */
const PACIFIC = {"v":1,"src":{"url":"https://froginawell.net/reference/old-tables/book/pacific-survey-1941-42/#p2-0024_1","path":"book/pacific-survey-1941-42/#p2-0024_1","book":"pacific-survey-1941-42","table":"p2-0024_1"},"title":{"ja":"Principal Countries Sharing in the Overseas Shipping of Pacific Area Nations"},"volume":{"title":"An Economic Survey of the Pacific Area 1941-42","year":"1941–42","en":"Part I: Population and Land Utilization (Karl J. Pelzer, 1941) · Part II: Transportation (Katrine R. C. Greene, 1941) · Part III: Industrialization of the Western Pacific (Kate L. Mitchell, 1942)"},"date":"1941","period":"1942","part":"A. Latest Pre-War Data","units":"country","cols":[{"name":"American","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"British","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Japanese","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Netherland","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Norwegian","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"Total","unit":"","kind":"count","pc":true,"color":"seq"}],"def":0,"rows":[{"id":"manchuria","label":"Manchuria","row":2,"v":[1.0,9.8,42.4,1.5,"..",100.0]},{"id":"china","label":"China","row":3,"v":[6.9,35.7,20.8,3.1,4.3,100.0]},{"id":"thailand","label":"Thailand","row":5,"v":[0.7,22.5,16.0,10.3,28.5,100.0]},{"id":"philippines","label":"Philippine Islands","row":8,"v":[15.8,33.6,16.4,6.8,9.4,100.0]},{"id":"australia","label":"Australia","row":10,"v":[3.2,"73.0(j)",5.5,2.8,7.0,100.0]}],"total":null,"unplaced":["Japan","Indo-China","Malaya","Netherlands India","New Zealand","Canada","United States"],"notes":["(a) Including Netherlands India.","(b) „ 12.7% Chinese, 21.8% Kwantungese and 3.0% Manchoukuoan","(c) „ 16.2% Chinese."]};

/* From the tables site's far-east-1941 IMG_5332_1. */
const FAREAST = {"v":1,"src":{"url":"https://froginawell.net/reference/old-tables/book/far-east-1941/#IMG_5332_1","path":"book/far-east-1941/#IMG_5332_1","book":"far-east-1941","table":"IMG_5332_1"},"title":{"ja":"Gross Imports and Exports of China, by Countries"},"volume":{"title":"The Far East Year Book 1941","year":"1941"},"date":"1941","period":"1942","part":null,"units":"country","cols":[{"name":"Year","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"From:","unit":"","kind":"count","pc":true,"color":"seq"},{"name":"To:","unit":"","kind":"count","pc":true,"color":"seq"}],"def":0,"rows":[{"id":"australia","label":"Australia","row":16,"v":[1937,16336,5401]},{"id":"britishindia","label":"British India","row":44,"v":[1937,12467,11791]},{"id":"burma","label":"Burma","row":60,"v":[1937,8220,4503]},{"id":"ceylon","label":"Ceylon","row":76,"v":[1937,255,""]},{"id":"hongkong","label":"Hongkong","row":164,"v":[1937,18078,162904]},{"id":"macau","label":"Macao","row":196,"v":[1937,904,5127]},{"id":"dei","label":"Netherlands East Indies","row":216,"v":[1937,80718,6228]}],"total":null,"unplaced":["Aden, Perim, etc.","Aden, Perim, etc.","Aden, Perim, etc.","Aden, Perim, etc.","Algeria","Algeria","Algeria","Algeria","Arabia","Arabia","Arabia","Arabia","Argentina","Argentina","Argentina","Argentina","Australia","Australia","Australia","Belgian Congo and Ruanda-Urundi","Belgian Congo and Ruanda-Urundi","Belgian Congo and Ruanda-Urundi","Belgian Congo and Ruanda-Urundi","Belgium","Belgium","Belgium","Belgium","Brazil","Brazil","Brazil","Brazil","British Central America","British Central America","British Central America","British Central America","British East Africa","British East Africa","British East Africa","British East Africa","British Guiana and Falkland Island","British Guiana and Falkland Island","British Guiana and Falkland Island","British Guiana and Falkland Island","British India","British India","British India","British N. Borneo","British N. Borneo","British N. Borneo","British N. Borneo","British W. Africa","British W. Africa","British W. Africa","British W. Africa","Bulgaria","Bulgaria","Bulgaria","Bulgaria","Burma","Burma","Burma","Canada","Canada","Canada","Canada","Central America: Republics of","Central America: Republics of","Central America: Republics of","Central America: Republics of","Central America: U.S. Territories","Central America: U.S. Territories","Central America: U.S. Territories","Central America: U.S. Territories","Ceylon","Ceylon","Ceylon","Chile","Chile","Chile","Chile"],"notes":[]};

/* From the map's own data/population/taiwan-1930.csv, as the spec says a table of this kind is sent. */
const TW_SHU = {"v":1,"src":{"url":"https://kmlawson.github.io/playground-stat-tables/book/test/#tw","path":"book/test/#tw"},"title":{"en":"Taiwan, resident population, end of 1930 (taiwan-prefecture)"},"volume":{"title":"test","year":"1931"},"date":"1930-12-31","period":"1930","units":"taiwan-prefecture","cols":[{"name":"人口","en":"Population","unit":"人","kind":"count","pc":true},{"name":"男100に對する女","en":"Males per 100 females","kind":"rate"}],"def":0,"rows":[{"id":"TwShuTaihoku","label":"臺北州","v":[939021,108.87]},{"id":"TwShuShinchiku","label":"新竹州","v":[681552,103.23]},{"id":"TwShuTaichu","label":"臺中州","v":[1031508,103.96]},{"id":"TwShuTainan","label":"臺南州","v":[1181569,104.1]},{"id":"TwShuTakao","label":"高雄州","v":[637902,104.51]},{"id":"TwShuTaito","label":"臺東廳","v":[47542,107.82]},{"id":"TwShuKarenko","label":"花蓮港廳","v":[75300,116.01]},{"id":"TwShuHoko","label":"澎湖廳","v":[62721,94.47]}],"total":null,"unplaced":[]};

/* From the map's own data/population/taiwan-1930.csv, as the spec says a table of this kind is sent. */
const TW_GUN = {"v":1,"src":{"url":"https://kmlawson.github.io/playground-stat-tables/book/test/#tw","path":"book/test/#tw"},"title":{"en":"Taiwan, resident population, end of 1930 (taiwan-district)"},"volume":{"title":"test","year":"1931"},"date":"1930-12-31","period":"1930","units":"taiwan-district","cols":[{"name":"人口","en":"Population","unit":"人","kind":"count","pc":true},{"name":"男100に對する女","en":"Males per 100 females","kind":"rate"}],"def":0,"rows":[{"id":"TwTaito","label":"臺東廳","v":[47542,107.82]},{"id":"TwKarenko","label":"花蓮港廳","v":[75300,116.01]},{"id":"TwHoko","label":"澎湖廳","v":[62721,94.47]},{"id":"TwTaihoku","label":"臺北市","v":[240435,108.5]},{"id":"TwKirunShi","label":"基隆市","v":[78214,108.55]},{"id":"TwShichisei","label":"七星郡","v":[99969,105.77]},{"id":"TwTansui","label":"淡水郡","v":[48459,110.31]},{"id":"TwKirun","label":"基隆郡","v":[87726,114.39]},{"id":"TwGiran","label":"宜蘭郡","v":[93047,111.59]},{"id":"TwRato","label":"羅東郡","v":[63753,107.5]},{"id":"TwSuo","label":"蘇澳郡","v":[15359,113.14]},{"id":"TwBunzan","label":"文山郡","v":[58529,110.65]},{"id":"TwKaizan","label":"海山郡","v":[92116,105.98]},{"id":"TwShinsho","label":"新莊郡","v":[55876,106.99]},{"id":"TwShinchikuShi","label":"新竹市","v":[45867,100.27]},{"id":"TwShinchiku","label":"新竹郡","v":[106331,103.76]},{"id":"TwChureki","label":"中壢郡","v":[96005,109.49]},{"id":"TwToen","label":"桃園郡","v":[80711,106.27]},{"id":"TwDaikei","label":"大溪郡","v":[50228,103.69]},{"id":"TwChikuto","label":"竹東郡","v":[65704,102.22]},{"id":"TwChikunan","label":"竹南郡","v":[82683,100.53]},{"id":"TwByoritsu","label":"苗栗郡","v":[114234,98.6]},{"id":"TwTaiko","label":"大湖郡","v":[27619,108.4]},{"id":"TwTaichu","label":"臺中市","v":[55347,115.17]},{"id":"TwDaiton","label":"大屯郡","v":[89742,104.43]},{"id":"TwToyohara","label":"豐原郡","v":[81823,100.7]},{"id":"TwTosei","label":"東勢郡","v":[39606,102.94]},{"id":"TwTaikou","label":"大甲郡","v":[126455,101.29]},{"id":"TwShoka","label":"彰化郡","v":[172889,101.2]},{"id":"TwInrin","label":"員林郡","v":[155136,105.56]},{"id":"TwHokuto","label":"北斗郡","v":[114824,101.54]},{"id":"TwNanto","label":"南投郡","v":[80130,104.59]},{"id":"TwNiitaka","label":"新高郡","v":[25343,112.75]},{"id":"TwNoko","label":"能高郡","v":[37113,110.52]},{"id":"TwTakeyama","label":"竹山郡","v":[37606,105.97]},{"id":"TwTainan","label":"臺南市","v":[98114,109.25]},{"id":"TwKagiShi","label":"嘉義市","v":[58276,107.59]},{"id":"TwNiitoyo","label":"新豐郡","v":[92476,101.42]},{"id":"TwShinka","label":"新化郡","v":[79424,101.68]},{"id":"TwSobun","label":"曾文郡","v":[68267,101.5]},{"id":"TwHokumon","label":"北門郡","v":[115931,101.56]},{"id":"TwShinei","label":"新營郡","v":[97718,102.65]},{"id":"TwKagi","label":"嘉義郡","v":[136131,107.33]},{"id":"TwToroku","label":"斗六郡","v":[91429,103.87]},{"id":"TwKobi","label":"虎尾郡","v":[116077,101.44]},{"id":"TwHokuko","label":"北港郡","v":[91418,106.06]},{"id":"TwToseki","label":"東石郡","v":[134744,104.76]},{"id":"TwTakaoShi","label":"高雄市","v":[62633,112.52]},{"id":"TwOkayama","label":"岡山郡","v":[121825,104.55]},{"id":"TwHozan","label":"鳳山郡","v":[87355,104.79]},{"id":"TwKizan","label":"旗山郡","v":[66402,101.51]},{"id":"TwHeito","label":"屏東郡","v":[92190,104.93]},{"id":"TwChoshu","label":"潮州郡","v":[71695,100.13]},{"id":"TwToko","label":"東港郡","v":[79727,104.61]},{"id":"TwKoshun","label":"恆春郡","v":[26638,103.5]}],"total":null,"unplaced":["蕃地"]};

const up = p => p.waitForFunction(() => !!document.getElementById('tbl-flag') || /Table not shown/.test(document.getElementById('info').innerText),
  { timeout: 30000 }).catch(() => {});
const cardText = p => p.evaluate(() => document.getElementById('info').innerText);
const keyText = p => p.evaluate(() => document.getElementById('legend').innerText);
const epoch = p => p.evaluate(() => document.querySelector('#epoch-seg button.on').getAttribute('data-epoch'));
const fill = (p, key) => p.evaluate(k => {
  const e = document.querySelector('#land [data-prov="' + k + '"]');
  return e ? e.style.getPropertyValue('--c') : null;
}, key);
const atomFills = (p, atom) => p.evaluate(a => {
  const el = document.getElementById('a-' + a);
  if (!el) return null;
  const ps = el.tagName === 'path' ? [el] : [...el.querySelectorAll('path:not(.fine)')];
  return [...new Set(ps.map(x => x.style.getPropertyValue('--c')))];
}, atom);
/* A point on a shape that a press there would hit. */
const pointOn = (p, sel) => p.evaluate(q => {
  const els = [...document.querySelectorAll(q)];
  els.sort((a, b) => b.getBBox().width * b.getBBox().height - a.getBBox().width * a.getBBox().height);
  for (const el of els.slice(0, 3)) {
    const r = el.getBoundingClientRect();
    for (const [fx, fy] of [[.5, .5], [.4, .5], [.6, .5], [.5, .4], [.5, .6], [.35, .35], [.65, .65]]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit === el || (hit && el.contains(hit))) return { x, y };
    }
  }
  return null;
}, sel);
async function press(p, at) {
  await p.mouse.move(at.x, at.y);
  await p.mouse.down();
  await sleep(60);               // a press, not a flick
  await p.mouse.up();
  await sleep(450);              // past the 320 ms double-tap window
  await calm(p);
}
async function hover(p, at) {
  await p.mouse.move(at.x - 4, at.y - 4);
  await p.mouse.move(at.x, at.y, { steps: 3 });
  await sleep(250);              // the tooltip's delay
  await calm(p);
  return p.evaluate(() => { const t = document.getElementById('tooltip'); return t && !t.hidden ? t.innerText : ''; });
}
const RAMP = ['#dfeaf4', '#c3d6e8', '#8fb4d4', '#5286b4', '#1f5b8f'];

(async () => {
  const b = await launch({ downloads: true });

  console.log('\n— China, by province —');
  const c = await open(b, link(CHINA, '73.5,17.5,135.5,53.8'), { width: 1280, height: 800 });
  await up(c);
  await calm(c);
  let card = await cardText(c);
  check('a table of China’s provinces opens, not the notice', !/Table not shown|cannot draw/.test(card) && /Model Prisons/.test(card), card.slice(0, 160));
  check('  on the 1930 map, as it asks', await epoch(c) === 'e1930');
  const shaanxi = await fill(c, 'Shaanxi');
  check('  a province is shaded on the ramp', RAMP.includes(shaanxi), shaanxi);
  const missing = CHINA.rows.map(r => r.id);
  const blank = await c.evaluate(m => (window.JMAP.SUB_SETS['china-province'] || []).filter(k => !m.includes(k))
    .map(k => { const e = document.querySelector('#land [data-prov="' + k + '"]'); return e && e.style.getPropertyValue('--c'); }), missing);
  check('  one it has no row for is white', blank.length > 0 && blank.every(x => x === '#ffffff'), JSON.stringify(blank));
  let key = await keyText(c);
  check('the key says what is not on the map, as rows', /3 rows in the table are not on the map\./.test(key), key.slice(0, 400));
  check('  and the card names them', /Peking, Shanghai, Soochow/.test(card), card.slice(0, 900));
  check('  figures are written on the provinces', await c.evaluate(() => document.querySelectorAll('#labels text.popval').length) > 5);
  let at = await pointOn(c, '#land [data-prov="Shaanxi"]');
  let tip = await hover(c, at);
  check('hovering a province gives the figure as printed', /6/.test(tip) && /陝西|Shensi/.test(tip), tip);
  await press(c, at);
  card = await cardText(c);
  check('  pressing it opens the province', /Shǎnxī|Shaanxi/.test(card) && /Printed as/.test(card), card.slice(0, 200));
  for (let i = 0; i < 4; i++) { await c.mouse.move(at.x, at.y); await c.mouse.wheel({ deltaY: -200 }); }
  await calm(c);
  check('zoomed in, still shaded', await fill(c, 'Shaanxi') === shaanxi);
  at = await pointOn(c, '#land [data-prov="Shaanxi"]');
  tip = at ? await hover(c, at) : '';
  check('  and still answers', /陝西|Shensi/.test(tip), tip);
  await c.close();

  console.log('\n— Korea, by province —');
  const k = await open(b, link(KOREA, '124,33,131,43.5'), { width: 1280, height: 800 });
  await up(k);
  await calm(k);
  check('a table of Korea’s provinces goes on the 1942 map it asks for', await epoch(k) === 'e1942');
  const kf = await k.evaluate(rows => rows.map(r => { const e = document.querySelector('#land [data-prov="' + r.id + '"]'); return e && e.style.getPropertyValue('--c'); }),
    KOREA.rows);
  check('  all thirteen provinces shaded', kf.length === 13 && kf.every(Boolean), JSON.stringify(kf));
  await k.close();

  console.log('\n— Manchukuo, by province —');
  const m = await open(b, link(MANCHUKUO, '115,38,135,54'), { width: 1280, height: 800 });
  await up(m);
  await calm(m);
  check('a table of Manchukuo’s provinces goes on the 1942 map, where they are drawn, though it says 1930', await epoch(m) === 'e1942');
  check('  Fengtien shaded', RAMP.includes(await fill(m, 'Feng Tien')));
  key = await keyText(m);
  check('  the municipalities it cannot place are said', /3 rows in the table are not on the map/.test(key), key.slice(0, 500));
  if (await m.evaluate(() => !!document.getElementById('tbl-percap'))) {
    await m.click('#tbl-percap');
    await calm(m);
    key = await keyText(m);
    check('  per head divides by the map’s own count, and says which', /population at the count of May 1943/.test(key), key.slice(0, 300));
  }
  await m.close();

  console.log('\n— the South Seas, by island group —');
  const n = await open(b, link(NANYO, '128,0,175,24'), { width: 1280, height: 800 });
  await up(n);
  await calm(n);
  check('the island groups are shaded', RAMP.includes(await fill(n, 'Palau')) && RAMP.includes(await fill(n, 'Marshalls')));
  const dots = await n.evaluate(() => [...document.querySelectorAll('#tbl-points .tbl-pt')].map(g => g.getAttribute('data-id')));
  check('  and each is a dot as well, too small otherwise to see', dots.length === 6, dots.join());
  const pd = await n.evaluate(() => { const r = document.querySelector('#tbl-points .tbl-pt[data-id="Palau"] .mk').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  tip = await hover(n, pd);
  check('  a dot’s tip names the group and its figure', /Palau/.test(tip) && /91\.63/.test(tip), tip);
  await press(n, pd);
  card = await cardText(n);
  check('  and pressing it opens the group', /Palau/.test(card) && /Printed as/.test(card), card.slice(0, 200));
  check('the key lists the six', (await n.evaluate(() => document.querySelectorAll('#legend .tbl-key-place').length)) === 6);
  await n.close();

  console.log('\n— Taiwan, by prefecture and by district —');
  const t = await open(b, link(TW_SHU, '119.5,21.8,122.2,25.4'), { width: 1280, height: 800 });
  await up(t);
  await calm(t);
  const tf = { shichisei: await fill(t, 'TwShichisei'), kirun: await fill(t, 'TwKirunShi'), giran: await fill(t, 'TwGiran'),
    tainan: await fill(t, 'TwShinka'), banchi: await fill(t, 'TwBanchi') };
  check('a prefecture’s districts and cities all take its colour', tf.shichisei && tf.shichisei === tf.kirun && tf.kirun === tf.giran, JSON.stringify(tf));
  check('  another prefecture’s are another colour', tf.tainan && tf.tainan !== tf.shichisei, JSON.stringify(tf));
  check('  and the demarcated 蕃地, in no prefecture, is white', tf.banchi === '#ffffff', tf.banchi);
  at = await pointOn(t, '#land [data-prov="TwShichisei"]');
  tip = await hover(t, at);
  check('hovering a district names its prefecture, and the prefecture’s figure', /Taihoku-shū/.test(tip) && /939,021/.test(tip), tip);
  await press(t, at);
  card = await cardText(t);
  check('  pressing it opens the prefecture', /Taihoku-shū/.test(card), card.slice(0, 200));
  check('  outlined as its districts', await t.evaluate(() => document.querySelectorAll('.tbl-sel').length) >= 11);
  await t.close();
  const d = await open(b, link(TW_GUN, '119.5,21.8,122.2,25.4'), { width: 1280, height: 800 });
  await up(d);
  await calm(d);
  check('a table by district shades all 55', await d.evaluate(() => document.querySelectorAll('#land path.pop-shaded').length) >= 55);
  await d.click('#tbl-percap');
  await calm(d);
  key = await keyText(d);
  check('  per head divides by the map’s own resident population, and says so', /resident population at the end of 1930/.test(key), key.slice(0, 300));
  await d.close();

  console.log('\n— countries —');
  const pa = await open(b, link(PACIFIC, '60,-15,160,55'), { width: 1280, height: 800 });
  await up(pa);
  await calm(pa);
  check('a table naming “China” and “Manchuria” goes on the 1930 map, whose records they are', await epoch(pa) === 'e1930');
  const cf = { china: await atomFills(pa, 'china'), siam: await atomFills(pa, 'siam'), ph: await atomFills(pa, 'philippines') };
  check('  each country is its shapes, in one colour', [cf.china, cf.ph].every(x => x && x.length === 1 && RAMP.includes(x[0])), JSON.stringify(cf));
  check('  Siam answers for “Thailand”', cf.siam && cf.siam.length === 1 && RAMP.includes(cf.siam[0]), JSON.stringify(cf.siam));
  key = await keyText(pa);
  check('  the key lists them once each', !/China \(Republic of China\) China/.test(key) && /Thailand|Siam/.test(key), key.slice(0, 400));
  at = await pointOn(pa, '#a-philippines path');
  await press(pa, at);
  card = await cardText(pa);
  check('pressing a country opens it', /Philippine/.test(card) && /15\.8/.test(card), card.slice(0, 200));
  await pa.close();
  const fe = await open(b, link(FAREAST, '60,-15,160,55'), { width: 1280, height: 800 });
  await up(fe);
  await calm(fe);
  check('a table naming Burma apart from British India goes on the 1942 map', await epoch(fe) === 'e1942');
  key = await keyText(fe);
  check('  and calls British India what that map does', /British India/.test(key) && !/including Burma/.test(key), key.slice(0, 300));
  await fe.close();

  console.log('\n— with a finger —');
  const f = await open(b, link(KOREA, '124,33,131,43.5'), { touch: true, width: 390, height: 664 });
  await up(f);
  await calm(f);
  await f.evaluate(() => document.getElementById('info-close').click());
  await calm(f);
  // the first province a finger can reach: the key covers the foot of a phone
  let got = null;
  for (const id of ['Kankyohoku', 'Kankyonan', 'Heianhoku', 'Kogen', 'Keiki', 'Heiannan']) {
    at = await pointOn(f, '#land [data-prov="' + id + '"]');
    if (at) { got = KOREA.rows.find(r => r.id === id); break; }
  }
  if (at) await press(f, at);
  card = await cardText(f);
  check('a tap on a province answers with it', !!got && card.includes(got.label), (got && got.label) + ' ' + card.slice(0, 200));
  await f.close();

  await b.close();
  report();
})().catch(e => { console.error(e); process.exit(1); });
