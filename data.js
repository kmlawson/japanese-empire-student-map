/* The map's own settings, and the words it shows.
 *
 * The SVG holds "atoms" — the smallest regions any snapshot needs. This file
 * composes them into territories separately for each epoch, so Manchuria can
 * be three Chinese provinces in 1930 and Manchukuo in 1942 without the map
 * carrying two copies of the geometry. Atoms given the same colour in an epoch
 * show no boundary between them, which is how British India comes out as one
 * shape with no line at the Punjab and Indochina as one shape with no line at
 * the Mekong.
 *
 * Only the head of this file is written by hand: the view the map opens on,
 * the date it opens on, and the course the Yellow River took after 1938. All
 * the words — every name, date, note and legend label — live in texts/ and are
 * folded in below by tools/build_texts.py. texts/README.md says how that
 * folder is arranged and what each column holds; edit there, not here.
 */

const JMAP = {};

/* The region the map opens on when the whole frame will not fit usefully. */
JMAP.HOME = { lon0: 100, lat0: -4, lon1: 160, lat1: 52 };

/* The map opens on 1930 and moves forward. Starting on 1942 showed the answer
   before the question: a student who has never seen the empire small has
   nothing to measure the large one against. */
JMAP.DEFAULT_EPOCH = 'e1930';

/* The Yellow River after the dikes were cut at Huayuankou in June 1938 to slow
 * the Japanese advance. The river left its bed and ran south-east down the
 * Chia-lu into the Ying, down the Ying into the Huai, and through Hungtse Lake
 * and the Grand Canal into the Yangtze above Chinkiang — so for nine years the
 * Yellow River reached the sea through the Yangtze's mouth. It drowned several
 * thousand villages and killed somewhere between 400,000 and 800,000 people,
 * and it stayed there until the breach was closed in 1947. The Late 1942 map
 * uses this course; the 1930 map uses the old one. Traced from the channel
 * map at disasterhistory.org (Chris Courtney, after Saito et al. 2000). */

JMAP.YELLOW_1938 = [
  /* The breach itself, on the south bank just below Chengchow */
  [113.68, 34.92],
  /* down the Chia-lu (Jialu) past Chungmou, Weishih, Fukou and Hsihua */
  [114.02, 34.72], [114.19, 34.41], [114.39, 34.06], [114.53, 33.79],
  /* into the Ying at Choukou, then down it past Shenchiu, Chiehshou and
     Fuyang to Yingshang, where the Ying meets the Huai */
  [114.65, 33.63], [115.10, 33.40], [115.36, 33.26], [115.82, 32.90],
  [116.26, 32.63],
  /* east down the Huai past Chengyangkuan, Shouhsien and Pengpu */
  [116.53, 32.53], [116.79, 32.55], [117.36, 32.94], [117.89, 33.14],
  [118.22, 33.46],
  /* into Hungtse Lake, and out of it down the San-ho and the Grand Canal
     past Kaoyu and Shaopo */
  [118.55, 33.30], [119.02, 33.02], [119.44, 32.79], [119.42, 32.55],
  /* to the Yangtze at Sanchiangying, above Chinkiang */
  [119.50, 32.24],
];

/* ==================================================================
 * Generated from texts/ by tools/build_texts.py — do not edit below.
 *
 * Every name, date and note below comes from a CSV or a Markdown file in
 * texts/, which is where they are edited and where the explanations of why
 * each record reads the way it does now live. Anything changed here is lost
 * the next time that script runs.
 * ================================================================== */

JMAP.EPOCHS = [
  {
    id: 'e1930', en: '1930', ja: '1930年', orig: '1930', zh: '1930年', ko: '1930년',
    blurb: 'Before the Manchurian Incident. Japan holds Taiwan, Korea, Karafuto, the Kwantung leasehold and the South Seas Mandate. Everything else in the region belongs to somebody else’s empire, and the colours here show whose.'
  },
  {
    id: 'e1942', en: 'Dec 1942', ja: '1942年12月', orig: 'Dec 1942', zh: '1942年12月',
    ko: '1942년 12월',
    blurb: 'Ten years of expansion in China and a year of conquest in Southeast Asia and the Pacific. The naval perimeter is at its widest a few months behind this date and the tide has just turned: the fighting on Guadalcanal is in its fifth month and the army will be withdrawn in February. The largest area of China under Japanese control is still two years away.'
  },
];

JMAP.CATEGORIES = {
  e1930: [
    {
      id: 'metropole', en: 'Japan proper', ja: '内地', orig: 'Japan proper', zh: '日本內地',
      ko: '일본 본토', c: '#9a1813'
    },
    {
      id: 'jpcolony', en: 'Japanese colonies', ja: '日本の外地', orig: 'Japanese colonies',
      zh: '日本殖民地', ko: '일본 식민지', c: '#c2463d'
    },
    {
      id: 'chinese', en: 'Republic of China', ja: '中華民国', orig: 'Republic of China', zh: '中華民國',
      ko: '중화민국', c: '#ffffb3'
    },
    {
      id: 'british', en: 'British', ja: 'イギリス領', orig: 'British', zh: '英國領', ko: '영국령',
      c: '#b07f8e'
    },
    {
      id: 'french', en: 'French', ja: 'フランス領', orig: 'French', zh: '法國領', ko: '프랑스령',
      c: '#80b1d3'
    },
    {
      id: 'dutch', en: 'Dutch', ja: 'オランダ領', orig: 'Dutch', zh: '荷蘭領', ko: '네덜란드령', c: '#fdb462'
    },
    {
      id: 'american', en: 'American', ja: 'アメリカ領', orig: 'American', zh: '美國領', ko: '미국령',
      c: '#325d7b'
    },
    {
      id: 'portuguese', en: 'Portuguese', ja: 'ポルトガル領', orig: 'Portuguese', zh: '葡萄牙領',
      ko: '포르투갈령', c: '#fccde5'
    },
    { id: 'soviet', en: 'Soviet', ja: 'ソ連', orig: 'Soviet', zh: '蘇聯', ko: '소련', c: '#bebada' },
    {
      id: 'frontier', en: 'De facto independent', ja: '事実上の独立', orig: 'De facto independent',
      zh: '事實上獨立', ko: '사실상 독립', c: '#e7de7e'
    },
    { id: 'independent', en: 'Siam', ja: 'シャム', orig: 'Siam', zh: '暹羅', ko: '시암', c: '#8dd3c7' },
    {
      id: 'contested', en: 'Border is contested or not fixed', ja: '未確定国境',
      orig: 'Border is contested or not fixed', zh: '未定國界', ko: '미확정 국경', c: '#5c554a'
    },
    {
      id: 'other', en: 'Elsewhere', ja: 'その他', orig: 'Elsewhere', zh: '其他', ko: '기타',
      c: '#ded8cb'
    },
  ],
  e1942: [
    {
      id: 'metropole', en: 'Japan proper', ja: '内地', orig: 'Japan proper', zh: '日本內地',
      ko: '일본 본토', c: '#9a1813'
    },
    {
      id: 'colony', en: 'Colonies & leased territory', ja: '外地・租借地', orig: 'Colonies',
      zh: '殖民地與租借地', ko: '외지·조차지', c: '#c2463d'
    },
    {
      id: 'puppet', en: 'Client states', ja: '傀儡国家', orig: 'Client states', zh: '傀儡國家',
      ko: '괴뢰국', c: '#f15c4b'
    },
    {
      id: 'occupied', en: 'Under military occupation', ja: '軍政地域', orig: 'Occupied', zh: '軍政地區',
      ko: '군정 지역', c: '#fb8072'
    },
    {
      id: 'cobelligerent', en: 'Thai (Japanese ally)', ja: 'タイ（日本の同盟国）', orig: 'Thai',
      zh: '泰國（日本盟國）', ko: '태국(일본의 동맹국)', c: '#8dd3c7'
    },
    {
      id: 'freechina', en: 'Republic of China', ja: '中華民国', orig: 'Republic of China',
      zh: '中華民國', ko: '중화민국', c: '#ffffb3'
    },
    {
      id: 'ccp', en: 'Communist base areas & guerrilla zones', ja: '中国共産党根拠地',
      orig: 'Communist base areas', zh: '中共抗日根據地', ko: '중국공산당 항일근거지', c: '#7a1730'
    },
    {
      id: 'pacified', en: 'Pacified areas (治安地区)', ja: '治安地区', orig: 'Pacified areas',
      zh: '治安地區', ko: '치안지구', c: '#f4a582'
    },
    {
      id: 'unpacified', en: 'Un-pacified areas (未治安地区)', ja: '未治安地区', orig: 'Un-pacified areas',
      zh: '未治安地區', ko: '미치안지구', c: '#1f3b73'
    },
    {
      id: 'frontier', en: 'De facto independent', ja: '事実上の独立', orig: 'De facto independent',
      zh: '事實上獨立', ko: '사실상 독립', c: '#e7de7e'
    },
    {
      id: 'allied', en: 'Allied', ja: '連合国側', orig: 'Allied', zh: '同盟國', ko: '연합국측',
      c: '#b07f8e'
    },
    {
      id: 'american', en: 'American', ja: 'アメリカ領', orig: 'American', zh: '美國領', ko: '미국령',
      c: '#325d7b'
    },
    {
      id: 'french', en: 'French', ja: 'フランス領', orig: 'French', zh: '法國領', ko: '프랑스령',
      c: '#80b1d3'
    },
    {
      id: 'portuguese', en: 'Portuguese', ja: 'ポルトガル領', orig: 'Portuguese', zh: '葡萄牙領',
      ko: '포르투갈령', c: '#fccde5'
    },
    {
      id: 'neutral', en: 'Neutral', ja: '中立', orig: 'Neutral', zh: '中立', ko: '중립', c: '#bebada'
    },
    {
      id: 'contested', en: 'Border is contested or not fixed', ja: '未確定国境',
      orig: 'Border is contested or not fixed', zh: '未定國界', ko: '미확정 국경', c: '#5c554a'
    },
    {
      id: 'other', en: 'Elsewhere', ja: 'その他', orig: 'Elsewhere', zh: '其他', ko: '기타',
      c: '#ded8cb'
    },
  ],
};

JMAP.SITE_CATEGORIES = [
  {
    id: 'city', en: 'Cities & ports', ja: '都市・港', orig: 'Cities & ports', zh: '城市・港口',
    ko: '도시·항구', c: '#1f3d5c'
  },
  {
    id: 'battle', en: 'Battles & incidents', ja: '戦闘・事件', orig: 'Battles & incidents',
    zh: '戰役・事件', ko: '전투·사건', c: '#8e1f57'
  },
];

JMAP.TERRITORIES = {
  e1930: [
    {
      id: 'japan', en: 'Japan', ja: '内地 (Naichi)', orig: '日本 (Nihon)', zh: '日本內地',
      when: 'The metropole', cat: 'metropole', lvl: 1, atoms: ['japan'],
      wiki: 'https://en.wikipedia.org/wiki/Empire_of_Japan',
      note: 'Honshū, Kyūshū, Shikoku and Hokkaidō. Hokkaidō was itself a settler frontier, colonised from 1869 at the expense of the Ainu.'
    },
    {
      id: 'ryukyu', en: 'Ryūkyū and Ōsumi Islands', ja: '沖縄県・鹿児島県 (Okinawa-ken・Kagoshima-ken)',
      orig: '琉球 (Ruuchuu)', zh: '琉球・沖繩縣', when: 'Annexed 1879',
      rule: 'Okinawa Prefecture, and Kagoshima from the Amami group north', cat: 'metropole',
      lvl: 1, atoms: ['ryukyu'], wiki: 'https://en.wikipedia.org/wiki/Ryukyu_Islands',
      note: 'The Ryūkyū Kingdom paid tribute to both China and Satsuma until Japan abolished it and created Okinawa Prefecture in 1879. Only the southern half of this chain is that prefecture. Satsuma had taken the Amami islands from the kingdom in 1609, and they stayed with Kagoshima after 1879 as Ōshima-gun, along with the Tokara and Ōsumi groups north of them.'
    },
    {
      id: 'ogasawara', en: 'Bonin Islands (Ogasawara)', ja: '小笠原諸島 (Ogasawara Shotō)',
      orig: '小笠原諸島', zh: '小笠原群島', when: 'Claimed 1876',
      rule: 'Japanese, part of Tokyo prefecture', cat: 'metropole', lvl: 3,
      atoms: ['ogasawara'], wiki: 'https://en.wikipedia.org/wiki/Bonin_Islands',
      note: 'A scattering of volcanic islands 1,000 km south of Tokyo. The Bonins proper were claimed in 1876 and settled from Chichijima; the Volcano Islands 250 km further south, Iwo Jima among them, were annexed in 1891. Both are governed from Tokyo.'
    },
    {
      id: 'chishima', en: 'Kurile Islands (Chishima)', ja: '千島列島 (Chishima Rettō)',
      orig: 'Курильские острова', zh: '千島群島', when: 'Japanese from 1875', cat: 'metropole',
      lvl: 2, atoms: ['chishima'], wiki: 'https://en.wikipedia.org/wiki/Kuril_Islands',
      note: 'Traded to Japan by Russia in the 1875 Treaty of Saint Petersburg, in exchange for Japanese claims to Sakhalin.'
    },
    {
      id: 'chosen', en: 'Chōsen (Korea)', ja: '朝鮮 (Chōsen)', orig: '조선 (Chosŏn)', zh: '朝鮮',
      ko: '조선 (Chosŏn)', when: 'Protectorate 1905, annexed 1910', cat: 'jpcolony', lvl: 1,
      atoms: ['korea'], wiki: 'https://en.wikipedia.org/wiki/Korea_under_Japanese_rule',
      note: 'Opened by the Kanghwa Treaty of 1876, made a protectorate after the Russo-Japanese War and annexed outright in August 1910. The March First Movement of 1919 was met with mass repression.'
    },
    {
      id: 'formosa', en: 'Taiwan (Formosa)', ja: '臺灣 (Taiwan)', orig: '臺灣 (Tâi-oân)', zh: '臺灣',
      when: 'Japanese colony from 1895', cat: 'jpcolony', lvl: 1, atoms: ['taiwan'],
      wiki: 'https://en.wikipedia.org/wiki/Taiwan_under_Japanese_rule',
      note: 'Japan’s first modern colony, ceded by the Qing in the 1895 Treaty of Shimonoseki after the First Sino-Japanese War.'
    },
    {
      id: 'karafuto', en: 'Karafuto (southern Sakhalin)', ja: '樺太 (Karafuto)',
      orig: 'Южный Сахалин', zh: '樺太（南薩哈林）', ko: '가라후토청', when: 'Japanese from 1905',
      cat: 'jpcolony', lvl: 1, atoms: ['karafuto'],
      wiki: 'https://en.wikipedia.org/wiki/Karafuto_Prefecture',
      note: 'Sakhalin south of the 50th parallel, taken from Russia by the 1905 Treaty of Portsmouth.'
    },
    {
      id: 'kwantung', en: 'Kwantung Leased Territory', ja: '関東州 (Kantōshū)',
      orig: '關東州 (Guāndōngzhōu)', zh: '關東州', ko: '관동주', when: 'Leased from China 1905–1945',
      cat: 'jpcolony', lvl: 2, atoms: ['kwantung'],
      wiki: 'https://en.wikipedia.org/wiki/Kwantung_Leased_Territory',
      note: 'The tip of the Liaodong peninsula, leased by Russia in 1898 and transferred to Japan in 1905. Lüshun and Dalian sat inside it, and so did the garrison that became the Kwantung Army.'
    },
    {
      id: 'nanyo', en: 'South Seas Mandate', ja: '南洋群島 (Nan’yō Guntō)', zh: '南洋群島',
      when: 'Japanese from 1914; League mandate from 1920', rule: 'Japanese mandate',
      cat: 'jpcolony', lvl: 2, atoms: ['nanyo'],
      wiki: 'https://en.wikipedia.org/wiki/South_Seas_Mandate',
      note: 'The Marianas, Carolines and Marshalls: seized from Germany in 1914 and held by Japan from 1920 under a League of Nations Class C mandate, which meant governing them as an integral part of its own territory. The dotted line shows the boundary of the mandate, since the islands themselves are specks at this scale. Guam, in the middle of the Marianas, stayed American.'
    },
    {
      id: 'china', en: 'China (Republic of China)', ja: '中華民国 (Chūka Minkoku)',
      orig: '中華民國 (Zhōnghuá Mínguó)', zh: '中華民國',
      when: 'Republic from 1912; warlord rule, nominal unity from 1928', cat: 'chinese', lvl: 1,
      atoms: ['china'], lights: ['manchuria', 'jehol', 'chahar', 'suiyuan', 'xinjiang'],
      wiki: 'https://en.wikipedia.org/wiki/Republic_of_China_(1912%E2%80%931949)',
      note: 'A republic in name from 1912, but from 1916 to 1928 the country was fought over by regional militarists — the warlord era — with rival governments claiming to be the real one. The Northern Expedition of 1926–28 brought most of it under the Nationalists at Nanjing, but the unity was nominal: warlords kept their armies and their provinces, Manchuria answered to Zhang Xueliang, the Communists held rural base areas, and Xinjiang and Tibet went their own way. Japan meanwhile held a concession at Tianjin, a garrison in north China and the South Manchuria Railway zone.'
    },
    {
      id: 'manchuria', en: 'Manchuria (the Three Eastern Provinces)', ja: '満洲 (Manshū)',
      orig: '東三省 (Dōngsānshěng)', zh: '滿洲（東三省）', ko: '만주',
      when: 'Chinese, under Zhang Xueliang', cat: 'chinese', lvl: 1, atoms: ['manchuria'],
      within: 'china', wiki: 'https://en.wikipedia.org/wiki/Manchuria',
      note: 'Chinese territory in 1930, run by the Fengtian clique — Zhang Zuolin until his assassination by Japanese officers in 1928, then his son Zhang Xueliang, who declared for Nanjing. Japan already held the railway zone and the Kwantung leasehold inside it. The Kwantung Army invaded in September 1931.'
    },
    {
      id: 'jehol', en: 'Rèhé (Jehol)', ja: '熱河 (Nekka)', orig: '熱河省 (Rèhé shěng)', zh: '熱河省',
      when: 'Chinese province from 1928', cat: 'chinese', lvl: 3, atoms: ['jehol'],
      within: 'china', wiki: 'https://en.wikipedia.org/wiki/Rehe_Province', sub: '1',
      note: 'The province between the Great Wall and Manchuria, made a full province in 1928. Japan took it in February and March 1933 and attached it to Manchukuo.'
    },
    {
      id: 'chahar', en: 'Cháhā’ěr (Chahar)', ja: '察哈爾 (Chaharu)', orig: '察哈爾', zh: '察哈爾',
      ko: '차하얼성', when: 'Chinese province from 1928', cat: 'chinese', lvl: 3, atoms: ['chahar'],
      within: 'china', wiki: 'https://en.wikipedia.org/wiki/Chahar_Province', sub: '1',
      note: 'The steppe province north-west of the Wall, made a province in 1928 out of one of the old frontier special districts, with Zhangjiakou at its gate — the Kalgan of the caravan trade, where the brick tea and wool of Outer Mongolia came south. From 1936 the Mongol prince Demchugdongrub headed a Japanese-sponsored government in the north of it; after Japan took Zhangjiakou in 1937 that grew, with the Chinese autonomous governments of southern Chahar and northern Shanxi, into the client regime of Mengchiang, federated in 1939 and governed from Zhangjiakou. The province was abolished in 1952 and divided between Hebei, Shanxi and Inner Mongolia.'
    },
    {
      id: 'suiyuan', en: 'Suíyuǎn (Suiyuan)', ja: '綏遠 (Suien)', orig: '綏遠', zh: '綏遠',
      ko: '쑤이위안성', when: 'Chinese province from 1928', cat: 'chinese', lvl: 3,
      atoms: ['suiyuan'], within: 'china', wiki: 'https://en.wikipedia.org/wiki/Suiyuan',
      sub: '1',
      note: 'The northern bend of the Yellow River, irrigated at Hetao and dry beyond it, with Baotou the wool railhead of the steppe and the western end of the Beijing–Suiyuan railway. Also a province from 1928, and in 1930 within Yan Xishan\'s reach from Shanxi; Fu Zuoyi took the chairmanship in 1931 and held the western half of it through the whole war. The eastern half is what Mengchiang held after 1937. Abolished in 1954 into Inner Mongolia.'
    },
    {
      id: 'xinjiang', en: 'Xīnjiāng (Sinkiang)', ja: '新疆 (Shinkyō)', orig: 'شىنجاڭ (Shinjang)',
      zh: '新疆', when: 'Under largely autonomous provincial rule', cat: 'chinese', lvl: 3,
      atoms: ['xinjiang'], within: 'china', wiki: 'https://en.wikipedia.org/wiki/Xinjiang',
      sub: '1',
      note: 'Oasis towns round the rim of the Taklamakan, watered off the Tian Shan and the Kunlun, growing cotton, wheat and melons, with pastoral country in the north; Uyghur, Kazakh and Hui more than Han, and Turkic and Muslim more than Chinese. A quarter of the Republic\'s area and about one per cent of its people. A province in name, and Nanjing recognised Jin Shuren as its chairman after Yang Zengxin was assassinated in 1928 — but the government ran its own army, currency, finances and foreign trade, its roads and its telegraph ran to Soviet Central Asia rather than to China, and Nanjing\'s writ reached almost nothing of it.'
    },
    {
      id: 'tibet', en: 'Tibet', ja: 'チベット (Chibetto)', orig: 'བོད་ (Bod)', zh: '西藏',
      when: 'De facto independent from 1913', cat: 'frontier', lvl: 3, atoms: ['tibet'],
      wiki: 'https://en.wikipedia.org/wiki/Tibet_(1912%E2%80%931951)',
      note: 'The highest inhabited country on earth: grassland and rock above 4,000 metres, barley in the valleys, yaks on everything else, and the monasteries as landlords and government together. Claimed by the Republic of China and self- governing in practice since 1913, when the 13th Dalai Lama expelled the last Chinese officials — with its own army, currency, postage and foreign relations, and no Chinese garrison anywhere in it. Shown here in the independent colour on that basis, though no foreign power recognised it. The Simla convention of 1914, which drew the McMahon line, was signed by Britain and Tibet and never ratified by China, which is why that frontier is argued over still.'
    },
    {
      id: 'britishindia', en: 'British India (including Burma)',
      when: 'Burma a province of India until 1937', cat: 'british', lvl: 1,
      atoms: ['india', 'andaman', 'burma', 'saharat'], edge: '#8f5f6e', edgeAtoms: ['burma'],
      edgeClip: [92, 20.6, 97.4, 28.4], wiki: 'https://en.wikipedia.org/wiki/British_Raj',
      note: 'Burma was governed as a province of British India until it was separated in 1937. The Andaman and Nicobar Islands were run from India as a penal settlement.'
    },
    {
      id: 'goa', en: 'Portuguese India — Goa, Damão, Diu, Dadra & Nagar Haveli',
      orig: 'Estado da Índia', when: 'Portuguese from 1510', cat: 'portuguese', lvl: 3,
      atoms: ['goa'], wiki: 'https://en.wikipedia.org/wiki/Portuguese_India',
      labelAt: '73.9,15.4',
      note: 'Goa, with Damão and Diu on the Gujarat coast and Dadrá and Nagar Aveli inland behind them, is the seat of the Estado da Índia and the oldest European possession in Asia, held since 1510. It would stay Portuguese until India took it by force in 1961.'
    },
    {
      id: 'pondicherry', en: 'French India — Pondicherry, Karikal, Yanaon, Mahé, Chandernagore',
      orig: 'Établissements français dans l’Inde', when: 'French from 1674', cat: 'french',
      lvl: 3, atoms: ['pondicherry'], wiki: 'https://en.wikipedia.org/wiki/French_India',
      labelAt: '79.83,11.93',
      note: 'Five scattered enclaves left to France when Britain took the rest of India: Pondicherry and Karikal on the Coromandel coast, Yanaon on the Godavari, Mahé on the Malabar coast, and Chandernagore on the Hooghly above Calcutta. They would declare for the Free French in 1940 and pass to India in the 1950s.'
    },
    {
      id: 'princelystates', en: 'Princely states',
      when: 'Rulers in subsidiary alliance with the Crown', cat: 'british', lvl: 3,
      atoms: ['princely'], adminOnly: true,
      wiki: 'https://en.wikipedia.org/wiki/Princely_state', label: '-',
      note: 'British India was a patchwork: nine governors\' provinces and a handful of smaller chief commissioners\' ones, ruled directly, and beside them some six hundred princely states whose rulers kept their thrones under treaties with the Crown. Hyderabad, the largest by population and revenue, had its own army and currency, and the Nizam was reckoned the richest man alive. The states are drawn here from a layer of their 1931 boundaries rather than approximated from modern units, so the shapes are the shapes: the Rajputana and Central India agencies as one western mass, the Baluchistan states of Kalat and Las Bela, the Eastern States through Orissa and Chhattisgarh, the hill states along the frontier, and the small Deccan states scattered through Bombay. The very smallest of the six hundred are below the resolution of this map and are drawn inside whichever province surrounded them.'
    },
    {
      id: 'ceylon', en: 'Ceylon', orig: 'ලංකාව (Lanka)', zh: '錫蘭', when: 'Crown colony',
      cat: 'british', lvl: 3, atoms: ['ceylon'],
      wiki: 'https://en.wikipedia.org/wiki/British_Ceylon',
      note: 'A separate Crown colony, not part of British India, and the Royal Navy’s main base in the eastern Indian Ocean.'
    },
    {
      id: 'malaya', en: 'British Malaya & Singapore', ja: '英領馬来 (Eiryō Marai)',
      orig: 'Tanah Melayu / Singapura', zh: '馬來亞・新加坡',
      when: 'Straits Settlements & protected states', cat: 'british', lvl: 2,
      atoms: ['malaya', 'malaya_thai', 'christmas'],
      wiki: 'https://en.wikipedia.org/wiki/British_Malaya',
      note: 'The Straits Settlements and the protected Malay states, with the Singapore naval base begun in 1923 as the anchor of British power east of Suez. The four northern states — Kedah, Perlis, Kelantan and Trengganu — had been Siamese until the Anglo-Siamese Treaty of 1909.'
    },
    {
      id: 'sarawak', en: 'Sarawak', ja: 'サラワク (Sarawaku)', orig: 'Sarawak', zh: '砂拉越',
      when: 'Ruled by the Brooke family, 1841–1946', cat: 'british', lvl: 3, atoms: ['sarawak'],
      wiki: 'https://en.wikipedia.org/wiki/Raj_of_Sarawak',
      note: 'The private kingdom of the "White Rajahs": James Brooke took it from the sultan of Brunei in 1841 and his family ruled it for a century. A British protectorate from 1888, ceded to the Crown in 1946.'
    },
    {
      id: 'northborneo', en: 'North Borneo', ja: '北ボルネオ (Kita Boruneo)', zh: '北婆羅洲',
      when: 'Chartered company from 1881', cat: 'british', lvl: 3, atoms: ['northborneo'],
      wiki: 'https://en.wikipedia.org/wiki/North_Borneo',
      note: 'Governed not by the Crown but by the British North Borneo Chartered Company, one of the last trading companies to rule territory in its own right. Labuan, a Crown colony since 1848, was attached to the Straits Settlements in 1907.'
    },
    {
      id: 'brunei', en: 'Brunei', ja: 'ブルネイ (Burunei)', orig: 'Brunei', zh: '汶萊',
      when: 'Protectorate from 1888', cat: 'british', lvl: 3, c: '#c79aa8', atoms: ['brunei'],
      wiki: 'https://en.wikipedia.org/wiki/Brunei',
      note: 'What was left of the sultanate that had once ruled the whole north coast of Borneo, after Sarawak and North Borneo were carved out of it. A British protectorate with a Resident from 1906; oil was struck at Seria in 1929.'
    },
    {
      id: 'hongkong', en: 'Hong Kong', ja: '香港 (Honkon)', orig: '香港 (Hēunggóng)', zh: '香港',
      when: 'British from 1842', cat: 'british', lvl: 2, atoms: ['hongkong'],
      wiki: 'https://en.wikipedia.org/wiki/British_Hong_Kong',
      note: 'Hong Kong Island was ceded in 1842, Kowloon in 1860, and the New Territories leased for ninety-nine years in 1898.'
    },
    {
      id: 'solomons_br', en: 'British Solomon Islands', ja: 'ソロモン諸島', orig: 'Solomon Islands',
      zh: '所羅門群島', when: 'Protectorate from 1893', rule: 'British protectorate', cat: 'british',
      lvl: 3,
      atoms: ['solomons_br', 'solomons_gc', 'solomons_us', 'solomons_ml', 'solomons_al'],
      wiki: 'https://en.wikipedia.org/wiki/British_Solomon_Islands',
      note: 'A British protectorate; Guadalcanal would become the turning point of the Pacific War in 1942–43.'
    },
    {
      id: 'mandate_jp', en: 'South Seas Mandate — the mandate boundary', ja: '南洋群島委任統治領の境界',
      zh: '南洋群島委任統治地界', when: 'Japanese from 1914; League Class C mandate from 1920',
      cat: 'jpcolony', lvl: 2, c: '#c2463d', atoms: ['mandate_jp'], unseen: true,
      wiki: 'https://en.wikipedia.org/wiki/South_Seas_Mandate',
      note: 'Some two thousand islands — the Marianas except Guam, the Carolines and the Marshalls — with about 2,100 km² of land scattered across three million square miles of ocean, which is why the mandate is drawn here as a line and not as a shape. Japan took them from Germany in October 1914, held them under naval administration, and was granted them as a Class C mandate by the League in December 1920; Class C meant a territory could be governed as an integral part of the mandatory’s own. A civil South Seas Bureau ran them from Koror in Palau from 1922. Japanese settlers came with the sugar industry on Saipan and Tinian and outnumbered the islanders by the mid-1930s. Fortifying the islands was forbidden both by the mandate and by the Washington naval treaty; Japan gave notice of leaving the League in 1933, kept the islands, and fortified them anyway. They would become the American Trust Territory of the Pacific Islands in 1947.'
    },
    {
      id: 'mandate_ex_guam', en: 'Guam — inside the line, outside the mandate',
      when: 'American since 1898; never part of the mandate', cat: 'american', lvl: 3,
      c: '#325d7b', atoms: ['mandate_ex_guam'], unseen: true,
      wiki: 'https://en.wikipedia.org/wiki/Guam',
      note: 'The mandate covered the Marianas except Guam, which is why every description of it says so. Spain ceded Guam to the United States in 1898, so when Japan took the German Marianas in 1914 it took the chain round an American island: Saipan, a hundred and thirty miles north, was Japanese, and Guam was a US naval station with a small Marine garrison. Japan would land there on 10 December 1941, two days after Pearl Harbor, rename it Ōmiyajima, and hold it until the Americans retook it in the summer of 1944.'
    },
    {
      id: 'mandate_au', en: 'Territory of New Guinea — the mandate boundary',
      when: 'Australian Class C mandate from 1920, run from Rabaul', cat: 'british', lvl: 3,
      c: '#c9a6b0', atoms: ['mandate_au'], unseen: true,
      wiki: 'https://en.wikipedia.org/wiki/Territory_of_New_Guinea',
      note: 'German New Guinea south of the equator — the Kaiser-Wilhelmsland mainland, the Bismarck Archipelago, Bougainville and Buka — held by Australia as a Class C mandate from 1920 and administered from Rabaul, separately from Papua next door, which was Australian territory outright. Japan landed at Rabaul in January 1942 and made it the base for the whole southern campaign.'
    },
    {
      id: 'mandate_br', en: 'Nauru — the mandate boundary',
      when: 'British Class C mandate from 1920, administered by Australia', cat: 'british',
      lvl: 3, c: '#b07f8e', atoms: ['mandate_br'], unseen: true,
      wiki: 'https://en.wikipedia.org/wiki/Nauru',
      note: 'One island, held as a Class C mandate jointly by Britain, Australia and New Zealand under the Nauru Island Agreement of 1919 and administered in practice by Australia. What it was held for was phosphate, worked by the British Phosphate Commissioners. Japan took it in August 1942 and deported most of the population to Truk.'
    },
    {
      id: 'gilberts', en: 'Gilbert & Ellice Islands', ja: 'ギルバート諸島', orig: 'Tungaru',
      zh: '吉爾伯特群島', when: 'British colony from 1916; a protectorate from 1892', cat: 'british',
      lvl: 3, atoms: ['gilberts', 'ellice'],
      wiki: 'https://en.wikipedia.org/wiki/Gilbert_and_Ellice_Islands',
      note: 'Two scatters of atolls governed as one colony from Ocean Island: the Gilberts on the equator, the Ellice Islands six hundred miles south, and Ocean Island — Banaba — off to the west, which was worked for phosphate by the British Phosphate Commissioners and is where the administration actually sat. Japan took the Gilberts in December 1941 and never reached the Ellice.'
    },
    {
      id: 'linephoenix', en: 'The Line & Phoenix Islands',
      when: 'Gilbert & Ellice Islands Colony', rule: 'British colony', cat: 'british', lvl: 3,
      atoms: ['linephoenix'], wiki: 'https://en.wikipedia.org/wiki/Line_Islands',
      note: 'Two scatters of atolls east of the date line, run from Ocean Island. Fanning carried the trans-Pacific telegraph cable from Vancouver to Australia, landed in 1902 and the reason these specks were worth holding. The Phoenix group was almost empty until the settlement scheme of 1938–40 moved Gilbertese families there against overcrowding at home. Canton Island and Enderbury were claimed by Britain and by the United States at once, and in 1939 the two agreed to administer them jointly for fifty years; Pan American Airways put a flying-boat base on Canton Island that year, on the route to New Zealand.'
    },
    {
      id: 'uspacific', en: 'Palmyra, Kingman Reef, Howland, Baker, Jarvis & Swains',
      when: 'American; most claimed under the Guano Islands Act', rule: 'American',
      cat: 'american', lvl: 3, atoms: ['uspacific'],
      wiki: 'https://en.wikipedia.org/wiki/United_States_Minor_Outlying_Islands',
      note: 'Coral specks claimed for their guano in the 1850s and remembered eighty years later for their runways: an aircraft crossing the Pacific needed somewhere to land. Howland, Baker and Jarvis were settled in 1935–36 by young Hawaiians sent out to hold them, and the airstrip on Howland was built for Amelia Earhart, who vanished on the way to it in July 1937. Palmyra became a naval air station. Swains is a private copra island administered with American Samoa.'
    },
    {
      id: 'nzpacific', en: 'Tokelau & the northern Cook Islands',
      when: 'Administered by New Zealand', cat: 'british', lvl: 3, atoms: ['nzpacific'],
      wiki: 'https://en.wikipedia.org/wiki/Tokelau',
      note: 'Penrhyn, Manihiki, Rakahanga and Pukapuka are the northern Cooks, annexed by New Zealand in 1901. Tokelau — Atafu, Nukunonu and Fakaofo — was run from the Gilbert & Ellice Islands Colony until 1925 and handed to New Zealand then. They are drawn in the British colour because the map has no New Zealand one; the line above says who actually administered them.'
    },
    {
      id: 'indochina', en: 'French Indochina', ja: '仏印 (Futsuin)',
      orig: 'Đông Dương thuộc Pháp', zh: '法屬印度支那', when: 'French from the 1880s', cat: 'french',
      lvl: 1, atoms: ['indochina', 'siamgain'],
      wiki: 'https://en.wikipedia.org/wiki/French_Indochina',
      note: 'Tonkin, Annam, Cochinchina, Cambodia and Laos under a single Governor-General at Hanoi. Shown as one territory because that is what it was: the borders of Vietnam, Laos and Cambodia are later.'
    },
    {
      id: 'dei', en: 'Netherlands East Indies', orig: 'Nederlandsch-Indië', when: 'Dutch',
      cat: 'dutch', lvl: 1, atoms: ['dei'],
      wiki: 'https://en.wikipedia.org/wiki/Dutch_East_Indies',
      note: 'Java, Sumatra, the Dutch share of Borneo, the eastern islands and western New Guinea. Its oil would be the central economic prize of Japan’s southern advance.'
    },
    {
      id: 'philippines', en: 'Philippine Islands', ja: '比島 (Hitō)', orig: 'Pilipinas',
      zh: '菲律賓', when: 'American from 1898', cat: 'american', lvl: 1, atoms: ['philippines'],
      wiki: 'https://en.wikipedia.org/wiki/Insular_Government_of_the_Philippine_Islands',
      note: 'Taken from Spain in 1898 and held after a brutal war against Filipino republicans. A commonwealth with a promise of independence would follow in 1935.'
    },
    {
      id: 'wake', en: 'Wake Island', orig: 'Wake', when: 'American from 1899',
      rule: 'American territory', cat: 'american', lvl: 3, atoms: ['wake'],
      wiki: 'https://en.wikipedia.org/wiki/Wake_Island',
      note: 'Three islets round a lagoon, with no fresh water and nobody living on them: the Marshallese came for birds and shells and called it Enen-kio. The United States annexed it in 1899 and left it empty until Pan American built a hotel and a flying-boat station on Peale in 1935, for the Honolulu–Guam–Manila run. The Navy began an air station there in January 1941.'
    },
    {
      id: 'guam', en: 'Guam', ja: 'グアム (Guamu)', orig: 'Guåhan', zh: '關島',
      when: 'American from 1898', rule: 'American territory', cat: 'american', lvl: 3,
      atoms: ['guam'], wiki: 'https://en.wikipedia.org/wiki/Guam',
      note: 'A US naval station sitting in the middle of the Japanese-held Marianas.'
    },
    {
      id: 'hawaii', en: 'Hawaii', orig: 'Hawaiʻi', zh: '夏威夷', when: 'Annexed 1898',
      rule: 'American territory', cat: 'american', lvl: 2, atoms: ['hawaii'],
      wiki: 'https://en.wikipedia.org/wiki/Territory_of_Hawaii',
      note: 'A US territory with a large Japanese immigrant population. Pearl Harbor had a navy yard and a drydock from 1919, but the Pacific Fleet was based on the California coast until it was ordered to stay at Hawaii in May 1940.'
    },
    {
      id: 'aleutians', en: 'Aleutian Islands', orig: 'Unangam Tanangin', zh: '阿留申群島',
      when: 'Part of the Alaska Territory', rule: 'American territory', cat: 'american', lvl: 3,
      atoms: ['aleutians', 'aleutians_jp'],
      wiki: 'https://en.wikipedia.org/wiki/Aleutian_Islands',
      note: 'The chain reaching from Alaska towards Kamchatka; Attu and Kiska at its western end would be occupied by Japan in 1942.'
    },
    {
      id: 'turtle', en: 'Turtle & Mangsee Islands', orig: 'Kepulauan Penyu / Mangsee',
      when: 'Allocated to the Philippines by treaty, 2 January 1930',
      rule: 'Administered by British North Borneo', cat: 'american', lvl: 4,
      atoms: ['turtle', 'mangsee'], hatch: 'brit',
      wiki: 'https://en.wikipedia.org/wiki/Turtle_Islands,_Tawi-Tawi',
      note: 'Two small groups in the Sulu Sea that the British North Borneo Company had administered since the 1880s. The Anglo-American convention of 2 January 1930 placed them inside the boundary of the American Philippine Islands, but left the Company running them: the transfer was not actually made until 16 October 1947, to the independent Philippines. Drawn in the American colour with British diagonals, which is what the arrangement was.'
    },
    {
      id: 'miangas', en: 'Miangas (Palmas)', ja: 'ミアンガス島', orig: 'Miangas',
      when: 'Awarded to the Netherlands, 4 April 1928', cat: 'dutch', lvl: 4,
      atoms: ['miangas'], wiki: 'https://en.wikipedia.org/wiki/Miangas',
      note: 'The Island of Palmas of the arbitration: the United States claimed it as part of the Philippines it had bought from Spain in 1898, the Netherlands claimed it by long administration, and Max Huber awarded it to the Netherlands on 4 April 1928 — the case that made continuous and peaceful display of authority the test of title, and one of the most cited decisions in international law. It lies nearer Mindanao than any Dutch island.'
    },
    {
      id: 'cocos', en: 'Cocos (Keeling) Islands', orig: 'Pulu Kokos',
      when: 'A Straits Settlement from 1903', rule: 'British colony, run from Singapore',
      cat: 'british', lvl: 3, atoms: ['cocos'],
      wiki: 'https://en.wikipedia.org/wiki/Cocos_(Keeling)_Islands',
      note: 'Two atolls in the Indian Ocean, held by the Clunies-Ross family under a grant of 1886 and attached to the Straits Settlements in 1903. The cable station on Direction Island linked Australia, Africa and Ceylon, which is why the Emden came for it in 1914 and was destroyed there.'
    },
    {
      id: 'spratly', en: 'Spratly Islands', ja: '新南群島 (Shinnan Guntō)',
      orig: 'Trường Sa / Kapuluan ng Kalayaan', zh: '南沙群島',
      when: 'Occupied by France, April 1930; annexed 1933',
      rule: 'Claimed by France; Britain had claimed them earlier', cat: 'french', lvl: 3,
      atoms: ['spratly'], wiki: 'https://en.wikipedia.org/wiki/Spratly_Islands',
      note: 'A scatter of sandbanks, cays and reefs with no permanent population. Britain claimed them from 1877 and did nothing with them; France occupied Spratly Island in April 1930 and annexed the group — nine islands, Itu Aba among them — in 1933, attaching it to Cochinchina. Japan disputed the claim throughout, worked the guano and phosphate, and took them in 1939. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'paracel', en: 'Paracel Islands', ja: '西沙群島 (Seisa Guntō)', orig: 'Hoàng Sa',
      zh: '西沙群島', when: 'Claimed by China and by France', cat: 'chinese', lvl: 3,
      atoms: ['paracel'], wiki: 'https://en.wikipedia.org/wiki/Paracel_Islands',
      note: 'Claimed by the Republic of China as part of Guangdong and by France on behalf of Annam, and administered by neither in any continuous way in 1930. France occupied them in 1938 and Japan took them in 1939. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'pratas', en: 'Dōngshā (Pratas Island)', ja: '東沙島 (Tōsa-tō)', orig: '東沙島 (Dōngshā)',
      zh: '東沙島', ko: '프라타스섬', when: 'Chinese, in Kwangtung province', cat: 'chinese', lvl: 3,
      atoms: ['pratas'], wiki: 'https://en.wikipedia.org/wiki/Pratas_Island', label: '-',
      note: 'One island and its reef, 340 km south-east of Hong Kong. A Japanese merchant occupied it and worked the guano from 1907; China bought him out in 1909 and it has been administered from the mainland, and later from Taiwan, ever since. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'timor_pt', en: 'Portuguese Timor', orig: 'Timor Português', when: 'Portuguese',
      cat: 'portuguese', lvl: 3, atoms: ['timor_pt'],
      wiki: 'https://en.wikipedia.org/wiki/Portuguese_Timor',
      note: 'The eastern half of Timor, and one of the last fragments of the old Portuguese seaborne empire.'
    },
    {
      id: 'macau', en: 'Macao', ja: 'マカオ (Makao)', orig: '澳門 (Ou-mun)', zh: '澳門',
      when: 'Portuguese from the 1550s', cat: 'portuguese', lvl: 3, atoms: ['macau'],
      wiki: 'https://en.wikipedia.org/wiki/Portuguese_Macau',
      note: 'The oldest European settlement in East Asia, and neutral throughout the Pacific War.'
    },
    {
      id: 'siam', en: 'Siam', orig: 'สยาม (Sayam)', when: 'Never colonised', cat: 'independent',
      lvl: 2, atoms: ['siam'], wiki: 'https://en.wikipedia.org/wiki/Thailand',
      note: 'The one state in Southeast Asia that kept its independence, by playing Britain and France against each other and ceding territory to both. Renamed Thailand in 1939.'
    },
    {
      id: 'ussr', en: 'Soviet Union (USSR)', orig: 'СССР (SSSR)', zh: '蘇聯', when: 'From 1922',
      cat: 'soviet', lvl: 1, atoms: ['ussr'],
      wiki: 'https://en.wikipedia.org/wiki/Soviet_Union', labelAt: '112.0,52.5',
      note: 'Japan had intervened in the Russian Civil War in Siberia from 1918 to 1922 and held northern Sakhalin until 1925. Relations along the Manchurian border stayed tense.'
    },
    {
      id: 'mongolia', en: 'Mongolian People’s Republic (Outer Mongolia)',
      orig: 'Бүгд Найрамдах Монгол Ард Улс', zh: '蒙古人民共和國', when: 'From 1924', cat: 'soviet',
      lvl: 2, c: '#d3d1e6', atoms: ['mongolia'],
      wiki: 'https://en.wikipedia.org/wiki/Mongolian_People\'s_Republic',
      note: 'Independent of China in fact from 1911 and a Soviet satellite from 1924, though only the USSR recognised it.'
    },
    {
      id: 'australia', en: 'Australia', orig: 'Australia', zh: '澳大利亞', when: 'Dominion',
      cat: 'british', lvl: 2, c: '#c9a6b0', atoms: ['australia'],
      wiki: 'https://en.wikipedia.org/wiki/Australia',
      note: 'A self-governing dominion whose defence rested on the British naval base at Singapore.'
    },
    {
      id: 'newguinea_au', en: 'Papua & the Territory of New Guinea', ja: 'ニューギニア',
      orig: 'Niugini', zh: '新幾內亞', when: 'Australian territory & mandate', cat: 'british',
      lvl: 3, c: '#c9a6b0', atoms: ['newguinea_au'],
      wiki: 'https://en.wikipedia.org/wiki/Territory_of_Papua',
      note: 'Papua was an Australian territory; German New Guinea, taken in 1914, was held from 1920 under a League mandate — the southern counterpart of Japan’s.'
    },
    {
      id: 'nauru_au', en: 'Nauru', ja: 'ナウル', orig: 'Naoero', zh: '諾魯',
      when: 'Mandate from 1920', rule: 'Mandate — Australia, Britain and New Zealand',
      cat: 'british', lvl: 3, c: '#c9a6b0', atoms: ['nauru_au'],
      wiki: 'https://en.wikipedia.org/wiki/Nauru',
      note: 'A phosphate island held under a mandate shared by Australia, Britain and New Zealand.'
    },
    {
      id: 'weihaiwei', en: 'Wēihǎiwèi (Wēihǎi)', ja: '威海衛 (Ikaiei)', orig: '威海衛 (Wēihǎiwèi)',
      zh: '威海衛', when: 'Leased 1898, returned 1 October 1930', cat: 'british', lvl: 3,
      c: '#c08a99', atoms: ['weihaiwei'],
      wiki: 'https://en.wikipedia.org/wiki/British_Weihaiwei', label: 'Wēihǎiwèi',
      note: 'Britain took the lease in 1898 to balance the Russian one at Lüshun, and used the harbour as the Royal Navy’s summer station. It was handed back to China in October 1930 — so on this map it is in its last months.'
    },
    {
      id: 'guangzhouwan', en: 'Guǎngzhōuwān (Kwangchowan)', ja: '広州湾 (Kōshūwan)',
      orig: 'Kouang-Tchéou-Wan', zh: '廣州灣', when: 'Leased to France 1898–1945', cat: 'french',
      lvl: 3, atoms: ['guangzhouwan'], wiki: 'https://en.wikipedia.org/wiki/Guangzhouwan',
      note: 'A French leased territory on the Leizhou peninsula, administered from Indochina. Japan occupied it in February 1943; it went back to China in 1945.'
    },
    {
      id: 'tuva', en: 'Tannu Tuva (Tuvan People’s Republic)', orig: 'Тыва Арат Республик',
      zh: '唐努圖瓦', when: 'Independent in name from 1921', cat: 'soviet', lvl: 3, c: '#d3d1e6',
      atoms: ['tuva'], edge: '#bebada',
      wiki: 'https://en.wikipedia.org/wiki/Tuvan_People\'s_Republic',
      note: 'Qing territory until 1911, then a Russian protectorate, then a nominally independent republic from 1921 — recognised only by the Soviet Union and Mongolia. Absorbed into the USSR in 1944. China went on claiming it.'
    },
    {
      id: 'nepal', en: 'Nepal', orig: 'नेपाल (Nepāl)', zh: '尼泊爾',
      when: 'Independent, in treaty with Britain', cat: 'other', lvl: 2, c: '#e2d9c6',
      atoms: ['nepal'], wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Nepal',
      note: 'Never colonised, and recognised as fully independent by Britain in 1923, though bound to it by treaty and supplying the Gurkha regiments.'
    },
    {
      id: 'sikkim', en: 'Sikkim', orig: 'འབྲས་ལྗོངས (Drenjong)', zh: '錫金',
      when: 'British protectorate from 1861, recognised by China 1890', cat: 'british', lvl: 2,
      c: '#dcc2ce', atoms: ['sikkim'], wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Sikkim',
      note: 'A Himalayan kingdom under British protection, not a part of British India — which is why it is drawn apart from it here. The protectorate began with the Treaty of Tumlong in 1861, which followed a British punitive expedition and put Sikkim’s external relations in British hands; China recognised it, and the Sikkim–Tibet boundary was drawn, by the Convention of Calcutta of 17 March 1890.'
    },
    {
      id: 'bhutan', en: 'Bhutan', orig: 'འབྲུག་ཡུལ (Druk Yul)', zh: '不丹',
      when: 'British protectorate from 1910', cat: 'other', lvl: 2, c: '#c9a6b0',
      atoms: ['bhutan'], wiki: 'https://en.wikipedia.org/wiki/Bhutan',
      note: 'Internally self-governing, with Britain conducting its foreign relations under the Treaty of Punakha.'
    },
    {
      id: 'other', en: 'Afghanistan', orig: 'Afghanistan, Nepal, Bhutan', zh: '阿富汗・尼泊爾・不丹',
      cat: 'other', lvl: 3, atoms: ['other'],
      wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Afghanistan',
      note: 'Drawn for context rather than as part of the story. Afghanistan and Nepal were independent states; Bhutan and Sikkim were British protectorates, outside the directly administered provinces of British India.'
    },
    {
      id: 'contested', en: 'Border is contested or not fixed', ja: '未確定国境', zh: '未定國界',
      cat: 'contested', lvl: 3, c: 'transparent', atoms: ['contested', 'contested_burma'],
      hatch: 'unclear', label: '-',
      note: 'These stretches of frontier were contested or the sources for this map disagree about them. They include the Pamirs where Afghanistan, the Soviet Union and China meet; the Aksai Chin plateau in northeastern Kashmir; the frontier east of Bhutan; and the frontier between Burma and Yunnan.'
    },
  ],
  e1942: [
    {
      id: 'japan', en: 'Japan', ja: '内地 (Naichi)', orig: '日本 (Nihon)', zh: '日本內地',
      when: 'The metropole', cat: 'metropole', lvl: 1, atoms: ['japan'],
      wiki: 'https://en.wikipedia.org/wiki/Empire_of_Japan',
      note: 'Untouched by the war so far, apart from the Doolittle raid of April 1942. Systematic bombing would begin once the Marianas fell in 1944.'
    },
    {
      id: 'ryukyu', en: 'Ryūkyū and Ōsumi Islands', ja: '沖縄県・鹿児島県 (Okinawa-ken・Kagoshima-ken)',
      orig: '琉球 (Ruuchuu)', zh: '琉球・沖繩縣', when: 'Annexed 1879',
      rule: 'Okinawa Prefecture, and Kagoshima from the Amami group north', cat: 'metropole',
      lvl: 1, atoms: ['ryukyu'], wiki: 'https://en.wikipedia.org/wiki/Ryukyu_Islands',
      note: 'A prefecture, not a colony, though it was governed and garrisoned as a frontier. The Battle of Okinawa in 1945 killed roughly a quarter of the civilian population.'
    },
    {
      id: 'ogasawara', en: 'Bonin Islands (Ogasawara)', ja: '小笠原諸島 (Ogasawara Shotō)',
      orig: '小笠原諸島', zh: '小笠原群島', when: 'Claimed 1876',
      rule: 'Japanese, part of Tokyo prefecture', cat: 'metropole', lvl: 3,
      atoms: ['ogasawara'], wiki: 'https://en.wikipedia.org/wiki/Bonin_Islands',
      note: 'The chain that includes Iwo Jima, fortified as the last barrier on the direct approach to Tokyo.'
    },
    {
      id: 'chishima', en: 'Kurile Islands (Chishima)', ja: '千島列島 (Chishima Rettō)',
      orig: 'Курильские острова', zh: '千島群島', when: 'Japanese from 1875', cat: 'metropole',
      lvl: 2, atoms: ['chishima'], wiki: 'https://en.wikipedia.org/wiki/Kuril_Islands',
      note: 'The Pearl Harbor strike force sailed from Hitokappu Bay in these islands in November 1941. Seized by the USSR in 1945 and still disputed.'
    },
    {
      id: 'chosen', en: 'Chōsen (Korea)', ja: '朝鮮 (Chōsen)', orig: '조선 (Chosŏn)', zh: '朝鮮',
      ko: '조선 (Chosŏn)', when: 'Annexed 1910–1945', cat: 'colony', lvl: 1, atoms: ['korea'],
      wiki: 'https://en.wikipedia.org/wiki/Korea_under_Japanese_rule',
      note: 'By 1942 under the assimilation drive: Korean-language teaching suppressed, Japanese names imposed from 1940, and mobilisation of labour and, from 1944, conscription.'
    },
    {
      id: 'formosa', en: 'Taiwan (Formosa)', ja: '臺灣 (Taiwan)', orig: '臺灣 (Tâi-oân)', zh: '臺灣',
      when: 'Japanese colony 1895–1945', cat: 'colony', lvl: 1, atoms: ['taiwan'],
      wiki: 'https://en.wikipedia.org/wiki/Taiwan_under_Japanese_rule',
      note: 'The oldest colony and the staging ground for the invasion of the Philippines in December 1941.'
    },
    {
      id: 'karafuto', en: 'Karafuto (southern Sakhalin)', ja: '樺太 (Karafuto)',
      orig: 'Южный Сахалин', zh: '樺太（南薩哈林）', ko: '가라후토청', when: 'Japanese 1905–1945',
      cat: 'colony', lvl: 1, atoms: ['karafuto'],
      wiki: 'https://en.wikipedia.org/wiki/Karafuto_Prefecture',
      note: 'Coal, timber and fisheries, and — apart from Korea\'s short frontier on the lower Tumen — the empire\'s land border with the Soviet Union. Lost in August 1945.'
    },
    {
      id: 'kwantung', en: 'Kwantung Leased Territory', ja: '関東州 (Kantōshū)',
      orig: '關東州 (Guāndōngzhōu)', zh: '關東州', ko: '관동주', when: 'Leased 1905–1945', cat: 'colony',
      lvl: 2, atoms: ['kwantung'], edge: '#9a1813',
      wiki: 'https://en.wikipedia.org/wiki/Kwantung_Leased_Territory',
      note: 'Nominally Manchukuo’s, in that the new state re-granted the lease in 1932; in practice a Japanese leasehold with its own administration to the end, and the seat of the Kwantung Army that had taken Manchuria. Lüshun and Dalian are inside it.'
    },
    {
      id: 'nanyo', en: 'South Seas Mandate', ja: '南洋群島 (Nan’yō Guntō)', zh: '南洋群島',
      when: 'Japanese from 1914; League mandate from 1920', rule: 'Japanese mandate',
      cat: 'colony', lvl: 2, atoms: ['nanyo'],
      wiki: 'https://en.wikipedia.org/wiki/South_Seas_Mandate',
      note: 'Fortified through the 1930s in defiance of the mandate’s terms, and the anchorage of the Combined Fleet at Truk. The dotted line shows the boundary of the mandate; the islands themselves are specks at this scale. The Americans came through it from November 1943 and did not take most of it: they landed on the atolls that carried an airfield or an anchorage — Kwajalein, Enewetak, Saipan, Tinian, Peleliu — and flew past the rest, which left those garrisons behind the front without supply until the surrender in August 1945. Truk, the strongest place in the mandate, was one of the ones they went round.'
    },
    {
      id: 'manchukuo', en: 'Manchukuo (Manchuria)', ja: '満洲国 (Manshūkoku)', orig: '滿洲國',
      zh: '滿洲國', ko: '만주국', when: 'Japanese-occupied; nominally independent from March 1932',
      cat: 'puppet', lvl: 1, atoms: ['manchukuo'], under: '滿洲國',
      wiki: 'https://en.wikipedia.org/wiki/Manchukuo',
      note: 'Invaded from September 1931 and proclaimed independent under the last Qing emperor Puyi. Rehe was added in 1933; the eastern Inner Mongolian leagues had been part of the three provinces all along and became its Hinggan provinces. Real power lay with the Kwantung Army and Japanese vice-ministers.'
    },
    {
      id: 'mengjiang', en: 'Měngjiāng (Mengchiang)', ja: '蒙古自治邦 (Mōko Jichihō)', orig: '蒙古自治邦',
      zh: '蒙古自治邦', ko: '몽강연합자치정부',
      when: 'Renamed the Mongol Autonomous Federation, August 1941; federated September 1939; Japanese client from 1936',
      cat: 'puppet', lvl: 2, atoms: ['mengjiang'],
      wiki: 'https://en.wikipedia.org/wiki/Mengjiang',
      note: 'The Inner Mongolian autonomous government under Prince Demchugdongrub, with its capital at Zhangjiakou, assembled out of eastern Chahar, the Mongol leagues and a strip of northern Shanxi. Japanese-sponsored Mongol governments date from 1936, and the regime changed its name more than once: the federation of September 1939 joined the Mongol leagues to two Chinese-populated administrations — Chanan out of southern Chahar and Jinbei out of northern Shanxi — as the Mengchiang United Autonomous Government, and in August 1941 that was renamed the Mongol Autonomous Federation, 蒙古自治邦, which is what it was called in December 1942. Switch Administrative on and the three parts are named. The line indicates claimed Mengjiang territory and the fill indicates approximate simplified area of control.'
    },
    {
      id: 'nanjinggov', en: 'Japanese-occupied China (approximate)', ja: '日本占領地区',
      orig: '日軍佔領區', zh: '日軍佔領區（大略）',
      when: 'Occupied from 1937; Nanking government from March 1940', cat: 'occupied', lvl: 1,
      atoms: ['occupiedzone'], srcOnly: 'traced',
      wiki: 'https://en.wikipedia.org/wiki/Wang_Jingwei_regime', label: 'Japanese-occupied',
      note: 'Governed on paper by Wang Jingwei’s collaborationist government at Nanjing, with the far south under military administration instead. Traced from a 1940 map of the occupation and adjusted to December 1942: the plains, the railways and the cities of the north and the Yangtze valley, the Guangzhou delta from October 1938, Hainan from February 1939, and the ports of Xiamen and Shantou. Western Shanxi and Henan, most of Hunan, Jiangxi and Fujian were never taken, Changsha held out until 1944, and Communist and Nationalist guerrillas operated in force inside the line as well as beyond it — the shading marks where Japanese authority reached, not where it was unchallenged.'
    },
    {
      id: 'indochina', en: 'French Indochina', ja: '仏印 (Futsuin)',
      orig: 'Đông Dương thuộc Pháp', zh: '法屬印度支那', when: 'Occupied September 1940 – July 1941',
      cat: 'occupied', lvl: 2, atoms: ['indochina'],
      wiki: 'https://en.wikipedia.org/wiki/French_Indochina',
      note: 'Japanese troops entered the north in September 1940 and the south in July 1941 — the step that brought the American oil embargo. Vichy French governors, courts and police stayed at their desks until the coup of 9 March 1945, but they governed on Japanese terms: the colony is drawn as occupied because that is what decided things in it. Japan set the rice quotas, took the airfields and the ports, and let Thailand carry off four provinces in 1941. Requisition and the collapse of transport then produced the Tonkin famine of 1944–45, in which perhaps a million people died.'
    },
    {
      id: 'burma', en: 'Burma', ja: '緬甸 (Biruma)', orig: 'မြန်မာ (Myanma)', zh: '緬甸',
      when: 'Taken 1942; nominal independence August 1943', cat: 'occupied', lvl: 2,
      atoms: ['burma'], wiki: 'https://en.wikipedia.org/wiki/Japanese_occupation_of_Burma',
      note: 'Separated from British India in 1937 and overrun in the first half of 1942, closing the Burma Road to Chongqing. Ba Maw headed the nominally independent state declared in 1943.'
    },
    {
      id: 'saharat', en: 'Kengtung and the trans-Salween Shan states',
      orig: 'สหรัฐไทยเดิม (Saharat Thai Doem)',
      when: 'Thai-occupied 1942; transferred August 1943', cat: 'occupied', lvl: 3,
      atoms: ['saharat'], hatch: 'thai', outline: true, outlineColor: '#3da492',
      wiki: 'https://en.wikipedia.org/wiki/Saharat_Thai_Doem',
      note: 'Thai troops crossed into the Shan states behind the Japanese advance in May 1942 and took Kengtung, and by December they were administering the country east of the Salween. It was still legally Burmese: Japan did not hand it over until 20 August 1943, when it became Saharat Thai Doem, the "original Thai territories". Not everything Thailand claimed in the Shan and Karenni states was granted. It went back to Burma in 1945.'
    },
    {
      id: 'malaya', en: 'Malaya & Shōnantō (Singapore)', ja: '馬来 (Marai)・昭南島 (Shōnantō)',
      orig: 'Tanah Melayu / Syonan', zh: '馬來亞・昭南島',
      when: 'Invaded 8 December 1941; Singapore fell 15 February 1942', cat: 'occupied', lvl: 1,
      atoms: ['malaya', 'christmas'], wiki: 'https://en.wikipedia.org/wiki/British_Malaya',
      note: 'The seventy-day campaign down the peninsula ended in the largest capitulation in British military history. Singapore was renamed Shōnantō, "light of the south"; the Sook Ching massacres of Chinese residents followed within weeks.'
    },
    {
      id: 'malaya_thai', en: 'Kedah, Perlis, Kelantan & Trengganu', ja: 'マレー北部四州',
      orig: 'Kedah, Perlis, Kelantan, Terengganu', zh: '馬來北部四邦',
      when: 'Transferred to Thailand, October 1943', cat: 'occupied', lvl: 3,
      atoms: ['malaya_thai'], outline: true, outlineColor: '#dd3e2c',
      wiki: 'https://en.wikipedia.org/wiki/Si_Rat_Malai',
      note: 'In December 1942 these four northern Malay states are under Japanese military administration with the rest of Malaya. On 20 August 1943 Japan agreed to hand them to Thailand, and the transfer took effect that October — the price of the alliance, and a restoration of what Siam had given up to Britain in 1909. They went back to British rule in 1945.'
    },
    {
      id: 'borneo_br', en: 'British Borneo (Kita Boruneo)', ja: '北ボルネオ (Kita Boruneo)',
      orig: 'Borneo', zh: '英屬婆羅洲',
      when: 'Landings 16 December 1941; British surrender 1 April 1942', cat: 'occupied',
      lvl: 3, atoms: ['sarawak', 'northborneo', 'brunei'],
      wiki: 'https://en.wikipedia.org/wiki/Japanese_occupation_of_British_Borneo',
      label: 'Kita Boruneo',
      note: 'Taken first, and quickly, for the oilfields at Miri and Seria. Sarawak, Brunei, North Borneo and Labuan lost their separate identities: Japan ran them together as one military administration under Kawaguchi Kiyotake and called the whole Kita Boruneo, northern Borneo, with Labuan renamed Maeda-shima. British administration returned in September 1945.'
    },
    {
      id: 'dei', en: 'Netherlands East Indies', orig: 'Nederlandsch-Indië',
      when: 'Conquered January – March 1942', cat: 'occupied', lvl: 1, atoms: ['dei'],
      wiki: 'https://en.wikipedia.org/wiki/Dutch_East_Indies',
      note: 'The object of the whole southern advance. The Dutch surrendered on 8 March 1942; Sukarno and other nationalists chose to work with the occupation.'
    },
    {
      id: 'philippines', en: 'Philippine Islands', ja: '比島 (Hitō)', orig: 'Pilipinas',
      zh: '菲律賓', when: 'Invaded December 1941; Corregidor fell 6 May 1942', cat: 'occupied',
      lvl: 1, atoms: ['philippines'],
      wiki: 'https://en.wikipedia.org/wiki/Commonwealth_of_the_Philippines',
      note: 'A US commonwealth, promised full independence in 1946. MacArthur withdrew to Australia in March 1942. On 14 October 1943 Japan declared the Second Philippine Republic under José Laurel — nominal independence inside the Greater East Asia Co-Prosperity Sphere, with Japanese troops in place and a large guerrilla resistance in the hills. MacArthur returned in October 1944.'
    },
    {
      id: 'hongkong', en: 'Hong Kong', ja: '香港 (Honkon)', orig: '香港 (Hēunggóng)', zh: '香港',
      when: 'Attacked 8 December 1941; surrendered 25 December 1941', cat: 'occupied', lvl: 2,
      atoms: ['hongkong'], wiki: 'https://en.wikipedia.org/wiki/British_Hong_Kong',
      note: 'Held for eighteen days and then occupied until 1945, its population halved by deportation and hunger.'
    },
    {
      id: 'turtle', en: 'Turtle & Mangsee Islands', orig: 'Kepulauan Penyu / Mangsee',
      when: 'Taken with British Borneo, January 1942', rule: 'Under Japanese occupation',
      cat: 'occupied', lvl: 4, atoms: ['turtle', 'mangsee'],
      wiki: 'https://en.wikipedia.org/wiki/Turtle_Islands,_Tawi-Tawi',
      note: 'Still administered by the British North Borneo Company on paper, and inside the Philippine boundary drawn in 1930; in December 1942 both they and the Philippines were Japanese, and the transfer that the 1930 treaty provided for was made in 1947, five years after this map.'
    },
    {
      id: 'miangas', en: 'Miangas (Palmas)', ja: 'ミアンガス島', orig: 'Miangas',
      when: 'Taken with the Netherlands Indies, 1942', cat: 'occupied', lvl: 4,
      atoms: ['miangas'], wiki: 'https://en.wikipedia.org/wiki/Miangas',
      note: 'Dutch since the arbitration of 1928, which the United States had brought claiming it as part of the Philippines. Japan took both in the same three months.'
    },
    {
      id: 'cocos', en: 'Cocos (Keeling) Islands', orig: 'Pulu Kokos',
      when: 'Never occupied; shelled 25 December 1942',
      rule: 'British colony, run from Singapore — Allied throughout', cat: 'allied', lvl: 3,
      atoms: ['cocos'], hatch: 'raid',
      wiki: 'https://en.wikipedia.org/wiki/Cocos_(Keeling)_Islands',
      note: 'One of the few places inside this frame that Japan neither took nor bypassed but simply could not reach. The garrison held the cable and wireless station through the war; a submarine shelled the islands on Christmas Day 1942, and in May 1942 the Ceylon Garrison Artillery detachment mutinied there and three men were hanged — the only British Commonwealth soldiers executed for mutiny in the war. Airfields were built in 1944 for the bombing of Java and Singapore.'
    },
    {
      id: 'spratly', en: 'Shinnan Guntō (Spratly & Paracel Islands)', ja: '新南群島・西沙群島',
      orig: 'Trường Sa / Hoàng Sa', zh: '南沙群島・西沙群島', when: 'Annexed to Taiwan, 30 March 1939',
      rule: 'Japanese, administered from Takao in Taiwan', cat: 'colony', lvl: 3,
      atoms: ['spratly', 'paracel'], wiki: 'https://en.wikipedia.org/wiki/Spratly_Islands',
      label: 'Spratly & Paracel Islands',
      note: 'Japan took both groups in 1939, over French protest, and attached them to Takao prefecture in Taiwan as the Shinnan Guntō — the "new southern islands". They were a submarine and seaplane anchorage on the flank of the route to Singapore and the Indies, and Itu Aba had a garrison and a small base. Both went back to being disputed in 1945. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'pratas', en: 'Dōngshā (Pratas Island)', ja: '東沙島 (Tōsa-tō)', orig: '東沙島 (Dōngshā)',
      zh: '東沙島', ko: '프라타스섬', when: 'Occupied by Japan', cat: 'occupied', lvl: 3,
      atoms: ['pratas'], wiki: 'https://en.wikipedia.org/wiki/Pratas_Island', label: '-',
      note: 'Held by Japan through the war as a weather and radio station on the approach to Hong Kong and the Guangzhou delta. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'timor_pt', en: 'Portuguese Timor (contested)', orig: 'Timor Português',
      when: 'Invaded February 1942; Allied withdrawal December 1942 – February 1943',
      cat: 'portuguese', lvl: 3, atoms: ['timor_pt'], hatch: 'occupied',
      wiki: 'https://en.wikipedia.org/wiki/Portuguese_Timor',
      note: 'Neutral Portuguese territory, invaded anyway in February 1942 after a small Allied force landed there first. In December 1942 it is still being fought over: Australian and Dutch commandos are running a guerrilla campaign in the hills, and are withdrawn over the following two months, after which Japan holds the colony to the end of the war. Drawn in the Portuguese colour with Japanese stripes across it for that reason. Between 40,000 and 70,000 Timorese died.'
    },
    {
      id: 'wake', en: 'Wake Island', ja: 'ウェーク島・大鳥島 (Ōtorishima)', orig: 'Wake',
      when: 'Taken 23 December 1941', rule: 'American territory under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['wake'],
      wiki: 'https://en.wikipedia.org/wiki/Wake_Island',
      note: 'The garrison beat off the first landing on 11 December — one of the very few times in the war an amphibious assault was stopped at the water’s edge — and surrendered to the second on the 23rd. Renamed Ōtorishima. Japan held it to the surrender in 1945, bypassed and starving; ninety-eight American civilian prisoners kept on the island were murdered there in October 1943.'
    },
    {
      id: 'guam', en: 'Guam (Ōmiyajima)', ja: '大宮島 (Ōmiyajima)', orig: 'Guåhan', zh: '關島',
      when: 'Taken 10 December 1941', rule: 'American territory under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['guam'], wiki: 'https://en.wikipedia.org/wiki/Guam',
      note: 'The one American possession inside the Japanese-held Marianas, renamed Ōmiyajima and retaken in 1944.'
    },
    {
      id: 'gilberts', en: 'Gilbert Islands', ja: 'ギルバート諸島', orig: 'Tungaru', zh: '吉爾伯特群島',
      when: 'Occupied December 1941', rule: 'British colony under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['gilberts'],
      wiki: 'https://en.wikipedia.org/wiki/Gilbert_and_Ellice_Islands',
      note: 'The outermost ring of the perimeter. The assault on Tarawa in November 1943 opened the American drive across the central Pacific — seventy-six hours of fighting for an islet of barely more than a square kilometre, and the casualty lists that followed changed how the rest of the campaign was planned. Ocean Island (Banaba), off to the west, was taken in August 1942 and most of its people deported to Nauru, Kosrae and Tarawa; the garrison there murdered the roughly 150 labourers who remained on 20 August 1945, five days after the surrender, and one man survived by hiding in a cave. The Ellice Islands, the southern half of the same colony, were never occupied and are drawn separately here for that reason.'
    },
    {
      id: 'ellice', en: 'Ellice Islands',
      when: 'Never occupied; American bases from October 1942', rule: 'British colony',
      cat: 'allied', lvl: 3, atoms: ['ellice'], hatch: 'us',
      wiki: 'https://en.wikipedia.org/wiki/Tuvalu',
      note: 'Eight atolls and reef islands are drawn here — Niulakita, the ninth and empty then, is not — the southern half of the Gilbert & Ellice Islands Colony, and the nearest unoccupied ground to the Gilberts. American marines landed on Funafuti on 2 October 1942 and built an airfield there, with two more on Nanumea and Nukufetau the following year; Funafuti was the base the assault on Tarawa and Makin was mounted from in November 1943. Japanese aircraft bombed it from the Gilberts in the meantime. The islanders were moved off the airfield sites and the atolls were left with the runways, the scrap and the borrow pits when the war moved north.'
    },
    {
      id: 'linephoenix', en: 'The Line & Phoenix Islands', when: 'Never occupied',
      rule: 'British colony', cat: 'allied', lvl: 3, atoms: ['linephoenix'],
      wiki: 'https://en.wikipedia.org/wiki/Line_Islands',
      note: 'Part of the same colony as the Gilberts and never reached by it. American troops landed on Christmas Island and Fanning in February 1942 and built airfields there, under British sovereignty, to cover the ferry route to Australia; Canton Island, already an airline base under the joint Anglo-American administration agreed in 1939, became a staging field and a submarine refuelling point. Japan came no further east than Tarawa, six hundred miles away.'
    },
    {
      id: 'uspacific', en: 'Palmyra, Kingman Reef, Howland, Baker, Jarvis & Swains',
      when: 'Shelled December 1941; held throughout', rule: 'American', cat: 'american', lvl: 3,
      atoms: ['uspacific'],
      wiki: 'https://en.wikipedia.org/wiki/United_States_Minor_Outlying_Islands',
      note: 'Japanese bombers from Kwajalein struck Howland and Baker on 8 December 1941, the day after Pearl Harbor, killing two of the young Hawaiian colonists; the survivors were taken off at the end of January. Palmyra was a naval air station and was shelled once; Kingman Reef was a seaplane anchorage. None of them was taken, and the chain of runways across these atolls is what made the supply line to Australia and the Solomons possible.'
    },
    {
      id: 'nzpacific', en: 'Tokelau & the northern Cook Islands', when: 'Never occupied',
      rule: 'New Zealand administration', cat: 'allied', lvl: 3, atoms: ['nzpacific'],
      wiki: 'https://en.wikipedia.org/wiki/Tokelau',
      note: 'Penrhyn was surveyed for an airfield in 1942 and built by American engineers that year as a staging point on the southern ferry route; the other atolls saw the war only as ships passing. They are drawn in the Allied colour because the map has no New Zealand one; the line above says who administered them.'
    },
    {
      id: 'nauru_au', en: 'Nauru', ja: 'ナウル', orig: 'Naoero', zh: '諾魯',
      when: 'Occupied August 1942', rule: 'Mandate under Japanese occupation', cat: 'occupied',
      lvl: 3, atoms: ['nauru_au'], wiki: 'https://en.wikipedia.org/wiki/Nauru',
      note: 'Held for its phosphate and then bypassed and starved; most of the population was deported to Truk.'
    },
    {
      id: 'andaman', en: 'Andaman & Nicobar Islands', ja: '安達曼・ニコバル諸島',
      orig: 'Andaman & Nicobar', zh: '安達曼・尼科巴群島',
      when: 'Occupied March 1942; ceded to Azad Hind December 1943', cat: 'occupied', lvl: 2,
      atoms: ['andaman'], wiki: 'https://en.wikipedia.org/wiki/Andaman_and_Nicobar_Islands',
      note: 'The only Indian territory Japan held. In December 1943 they were handed nominally to Subhas Chandra Bose’s Provisional Government of Free India and renamed Shaheed and Swaraj — "martyr" and "self-rule". The transfer was a gesture: the Japanese navy kept real control, and the occupation was harsh.'
    },
    {
      id: 'newguinea_au', en: 'New Guinea (Papua & the Mandated Territory)', ja: 'ニューギニア',
      orig: 'Niugini', zh: '新幾內亞', when: 'Taken from Australia in 1942',
      rule: 'Australian territory and mandate, part under Japanese occupation', cat: 'occupied',
      lvl: 2, atoms: ['newguinea_au'], wiki: 'https://en.wikipedia.org/wiki/Territory_of_Papua',
      note: 'Rabaul, on New Britain, fell in January 1942 and became the greatest Japanese base south of Truk, and the north coast of the mainland followed. Port Moresby was the objective and was never reached: the overland push across the Kokoda Track was turned back in September 1942, and in December the fighting was at the Buna–Gona beachhead. The island was the southern limit of the advance and the ground the counter-offensive started from.'
    },
    {
      id: 'solomons_br', en: 'Western Solomons', ja: 'ソロモン諸島西部', orig: 'Solomon Islands',
      zh: '所羅門群島西部', when: 'Occupied from early 1942',
      rule: 'British protectorate under Japanese occupation', cat: 'occupied', lvl: 2,
      atoms: ['solomons_br'], wiki: 'https://en.wikipedia.org/wiki/British_Solomon_Islands',
      note: 'Choiseul, Santa Isabel, New Georgia, Kolombangara and the Shortlands were Japanese, with airfields and a seaplane base at Rekata Bay, and stayed so until the Allies came up the chain through 1943.'
    },
    {
      id: 'guadalcanal_i', en: 'Guadalcanal (contested)', ja: 'ガダルカナル島（争奪中）',
      orig: 'Guadalcanal', zh: '瓜達爾卡納爾島（爭奪中）',
      when: 'American landing 7 August 1942; fought over into February 1943', cat: 'occupied',
      lvl: 2, atoms: ['solomons_gc'], hatch: 'us',
      wiki: 'https://en.wikipedia.org/wiki/Guadalcanal',
      note: 'In December 1942 the island was divided: the Americans held the airfield and the perimeter around it, the Japanese the ground to the west, and neither could dislodge the other. It is drawn in the occupation colour with American stripes across it for that reason — the only ground on the map the two were contesting at this date. Japan evacuated in the first week of February 1943, and the campaign is usually taken as the point at which the initiative changed hands.'
    },
    {
      id: 'tulagi', en: 'Tulagi and the Florida Islands', ja: 'ツラギ・フロリダ諸島', orig: 'Tulagi',
      zh: '圖拉吉・佛羅里達群島', when: 'Taken by the Americans 7–8 August 1942', cat: 'allied', lvl: 3,
      atoms: ['solomons_us'], wiki: 'https://en.wikipedia.org/wiki/Tulagi',
      note: 'Two different places under one shape, and they answer differently. Tulagi was the old seat of the British protectorate and the Japanese garrison in this corner of the Solomons: seized on 3 May 1942 and held until the Marines landed on 7 August, with Tulagi secured the following afternoon and Gavutu and Tanambogo, the two islets across the harbour, taken in the same two days. Almost the whole garrison of about three hundred and fifty died; some forty swam across to Florida. Florida itself — Nggela Sule and Nggela Pile, the large island north of Tulagi, with the islets round it — was never Japanese- held. The landings there on 7 August, at Haleta and Halavo, were unopposed covering parties for the assault on Tulagi and were withdrawn the same day. By this map’s date Tulagi’s harbour was an Allied base with a motor torpedo boat flotilla at Sesapi, and the seaplane base at Halavo on Florida was being built.'
    },
    {
      id: 'malaita', en: 'Malaita (never fully occupied)', ja: 'マライタ島', orig: 'Malaita',
      zh: '馬萊塔島', when: 'Raided but never held', cat: 'allied', lvl: 3, atoms: ['solomons_ml'],
      wiki: 'https://en.wikipedia.org/wiki/Malaita',
      note: 'Japanese patrols and coastwatcher hunts reached the island, but it was never occupied: the protectorate administration and its coastwatchers stayed on it throughout, which is why it keeps the British colour outright.'
    },
    {
      id: 'solomons_allied', en: 'The central & eastern Solomons and the Santa Cruz Islands',
      ja: 'ソロモン諸島中部・東部・サンタクルーズ諸島', orig: 'Makira / Nendö', zh: '所羅門群島中部・東部・聖克魯斯群島',
      when: 'British throughout', cat: 'allied', lvl: 3, atoms: ['solomons_al'],
      wiki: 'https://en.wikipedia.org/wiki/Solomon_Islands_(archipelago)',
      note: 'San Cristobal, Ulawa, Rennell and Bellona, and the Santa Cruz group 500 km further east — Nendö, Utupua, Vanikoro and Tinakula. Nearer in, the Russell Islands, Savo and the Nggela islets. All of it was the British protectorate and none of it was taken: the occupation stopped in the western chain, and the perimeter runs west of these islands. The carrier battle of the Santa Cruz Islands was fought north of them in October 1942 and the naval battle of Rennell Island off Rennell in January 1943. Two of these had no garrison of either side at this date, which the one colour cannot show. Savo, off which the cruiser action of 9 August 1942 was fought, was visited by Japanese boats and patrolled by American raiders in September, and held by neither. The Russell Islands were a Japanese barge staging point during the Guadalcanal campaign but had no garrison until 28 January 1943, when six destroyers put 328 men ashore to cover the evacuation of Guadalcanal; they were gone by 11 February, and the American landing on 21 February was unopposed.'
    },
    {
      id: 'attukiska', en: 'Attu and Kiska', ja: 'アッツ島・キスカ島', orig: 'Atan / Qisxa',
      zh: '阿圖島・基斯卡島',
      when: 'Occupied June 1942; Attu retaken May 1943, Kiska evacuated July 1943',
      cat: 'occupied', lvl: 3, atoms: ['aleutians_jp'],
      wiki: 'https://en.wikipedia.org/wiki/Aleutian_Islands_campaign',
      note: 'The only North American soil Japan occupied, taken during the Midway operation and held for a year. Attu fell to the Americans in May 1943 after the garrison charged and was destroyed; Kiska was evacuated under cover of fog in July and the landing three weeks later met nobody. The rest of the Aleutian chain stayed American throughout, which is why the line round these two is drawn on its own.'
    },
    {
      id: 'aleutians', en: 'Aleutian Islands', orig: 'Unangam Tanangin', zh: '阿留申群島',
      when: 'American throughout, but for Attu and Kiska', rule: 'American territory',
      cat: 'american', lvl: 3, atoms: ['aleutians'],
      wiki: 'https://en.wikipedia.org/wiki/Aleutian_Islands',
      note: 'The chain runs from Alaska almost to Kamchatka. Japan took only Attu and Kiska at its western end; the rest was American, and Adak and Amchitka became the bases from which they were retaken.'
    },
    {
      id: 'thailand', en: 'Thailand', orig: 'ประเทศไทย (Prathet Thai)',
      when: 'Alliance signed 21 December 1941', cat: 'cobelligerent', lvl: 2,
      atoms: ['siam', 'siamgain'], edge: '#8dd3c7', edgeAtoms: ['siam', 'siamgain'],
      edgeClip: [100, 11.5, 106.2, 20.6], edgeWidth: 6,
      wiki: 'https://en.wikipedia.org/wiki/Thailand_in_World_War_II',
      note: 'Invaded on 8 December 1941, it capitulated in hours, granted passage to the invasion of Malaya and Burma, allied with Japan and declared war on Britain and the United States. Cambodia and Laos had already given up territory to it under the Franco-Thai settlement of May 1941; Malaya and Burma were the reward for the alliance.'
    },
    {
      id: 'cededthai', en: 'Battambang & Siem Reap (ceded to Thailand, 1941)',
      ja: '泰国への割譲地 (1941)', orig: 'Phra Tabong / Phibunsongkhram / Lan Chang',
      zh: '割讓予泰國之地（1941）', when: 'Ceded 9 May 1941, returned 1946', cat: 'cobelligerent',
      lvl: 4, atoms: ['siamgain'], wiki: 'https://en.wikipedia.org/wiki/Franco-Thai_War',
      note: 'Taken from French Indochina after the Franco-Thai war and handed to Thailand under Japanese mediation: Battambang and Siem Reap in Cambodia, and the Lao country west of the Mekong. Renamed Phra Tabong, Phibunsongkhram, Nakhon Champasak and Lan Chang. Angkor itself was left to France. All of it went back in 1946.'
    },
    {
      id: 'freechina', en: 'Republic of China (Nationalist government)',
      ja: '中華民国・重慶政権 (Chūka Minkoku)', orig: '中華民國 (Zhōnghuá Mínguó)', zh: '中華民國（重慶國民政府）',
      when: 'Capital at Chungking from 1938', cat: 'freechina', lvl: 1,
      atoms: ['china', 'chahar', 'suiyuan'],
      wiki: 'https://en.wikipedia.org/wiki/Republic_of_China_(1912%E2%80%931949)',
      label: 'China', labelAt: '106.5,29.5',
      note: 'The unoccupied interior — some two thirds of the country\'s area and rather less than half its people — with the government at Chongqing, up the Yangtze gorges behind the mountains of Sichuan, where it moved in 1938 after Nanjing and then Wuhan fell. A capital chosen for being hard to reach: fog for half the year, no railway to it, and bombed from 1938 to 1943 all the same. Cut off from the sea, it was supplied over the Burma Road from Rangoon until Burma fell in the spring of 1942, and after that only by air over the Hump from Assam. The universities came too, and the arsenals; the currency collapsed by degrees. The Communist base areas, in the same nominal united front and by 1941 barely on speaking terms with Chongqing, are drawn separately in cross- hatching.'
    },
    {
      id: 'ccp', en: 'Communist base areas and guerrilla zones', ja: '中国共産党抗日根拠地',
      orig: '抗日根據地 (Kàngrì gēnjùdì)', zh: '中共抗日根據地', when: 'As they stood in 1941–1942',
      cat: 'ccp', lvl: 2, atoms: ['ccp'], srcOnly: 'traced',
      wiki: 'https://en.wikipedia.org/wiki/Revolutionary_base_area',
      note: 'The base areas and guerrilla zones of the Eighth Route Army and the New Fourth Army, and the reason the occupied shading on this map is described as generous. Almost all of this ground lies inside the line the Japanese army had drawn round itself: Japan held the cities, the railways and the plains between them, and the countryside behind that line was fought over. The largest is Shǎngānníng, the border region round Yan’an, which was never occupied at all; the rest — Jìnchájì in the Wutai mountains, Jìlǔyù on the Hebei–Shandong plain, the Shandong and coastal pockets, and the New Fourth Army areas along the lower Yangtze — were inside it. Their extent moved from month to month, and the "mopping-up" campaigns of 1941–42 cut some of them badly; these are the areas as one atlas draws them for those two years, not a line anyone held.'
    },
    {
      id: 'britishindia', en: 'British India', when: 'The western limit of the advance',
      cat: 'allied', lvl: 1, atoms: ['india'],
      wiki: 'https://en.wikipedia.org/wiki/British_Raj',
      note: 'The front stopped at the Burmese border in 1942. The Quit India movement was suppressed that August, while the Indian National Army formed on the other side.'
    },
    {
      id: 'goa', en: 'Portuguese India — Goa, Damão, Diu, Dadra & Nagar Haveli',
      orig: 'Estado da Índia', when: 'Portuguese from 1510', cat: 'portuguese', lvl: 3,
      atoms: ['goa'], wiki: 'https://en.wikipedia.org/wiki/Portuguese_India',
      labelAt: '73.9,15.4',
      note: 'Goa, with Damão and Diu on the Gujarat coast and Dadrá and Nagar Aveli inland behind them, was the seat of the Estado da Índia and the oldest European possession in Asia. Portugal was neutral, and it stayed Portuguese until India took it by force in 1961.'
    },
    {
      id: 'pondicherry', en: 'French India — Pondicherry, Karikal, Yanaon, Mahé, Chandernagore',
      orig: 'Établissements français dans l’Inde', when: 'French from 1674', cat: 'french',
      lvl: 3, atoms: ['pondicherry'], wiki: 'https://en.wikipedia.org/wiki/French_India',
      labelAt: '79.83,11.93',
      note: 'Five scattered enclaves left to France when Britain took the rest of India: Pondicherry and Karikal on the Coromandel coast, Yanaon on the Godavari, Mahé on the Malabar coast, and Chandernagore on the Hooghly above Calcutta. They declared for the Free French in 1940 and were transferred to India in the 1950s.'
    },
    {
      id: 'princelystates', en: 'Princely states',
      when: 'Rulers in subsidiary alliance with the Crown', cat: 'allied', lvl: 3,
      atoms: ['princely'], adminOnly: true,
      wiki: 'https://en.wikipedia.org/wiki/Princely_state', label: '-',
      note: 'British India was a patchwork: eleven provinces ruled directly, and beside them some six hundred princely states whose rulers kept their thrones under treaties with the Crown. Hyderabad, the largest by population and revenue, had its own army and currency, and the Nizam was reckoned the richest man alive. The states are drawn here from a layer of their 1931 boundaries rather than approximated from modern units, so the shapes are the shapes: the Rajputana and Central India agencies as one western mass, the Baluchistan states of Kalat and Las Bela, the Eastern States through Orissa and Chhattisgarh, the hill states along the frontier, and the small Deccan states scattered through Bombay. The very smallest of the six hundred are below the resolution of this map and are drawn inside whichever province surrounded them.'
    },
    {
      id: 'ceylon', en: 'Ceylon', orig: 'ලංකාව (Lanka)', zh: '錫蘭', when: 'Raided April 1942',
      cat: 'allied', lvl: 3, atoms: ['ceylon'],
      wiki: 'https://en.wikipedia.org/wiki/British_Ceylon',
      note: 'The Indian Ocean raid of April 1942 struck Colombo and Trincomalee and drove the Royal Navy west to East Africa.'
    },
    {
      id: 'australia', en: 'Australia', orig: 'Australia', zh: '澳大利亞',
      when: 'Bombed from February 1942', cat: 'allied', lvl: 2, c: '#c9a6b0',
      atoms: ['australia'], wiki: 'https://en.wikipedia.org/wiki/Australia',
      note: 'Never invaded, but Darwin was bombed from February 1942 and Australia became the base from which the counter-offensive in New Guinea was mounted.'
    },
    {
      id: 'hawaii', en: 'Hawaii', orig: 'Hawaiʻi', zh: '夏威夷', when: 'Attacked 7 December 1941',
      rule: 'American territory', cat: 'american', lvl: 1, atoms: ['hawaii'],
      wiki: 'https://en.wikipedia.org/wiki/Territory_of_Hawaii',
      note: 'The US Pacific Fleet base at Pearl Harbor. The attack missed the carriers and the fuel farm, and both would decide the war within a year.'
    },
    {
      id: 'ussr', en: 'Soviet Union (USSR)', orig: 'СССР (SSSR)', zh: '蘇聯',
      when: 'Neutrality Pact, April 1941', cat: 'neutral', lvl: 1, atoms: ['ussr'],
      wiki: 'https://en.wikipedia.org/wiki/Soviet_Union', labelAt: '112.0,52.5',
      note: 'At war with Germany but not with Japan: the Neutrality Pact of April 1941 held until the Soviet invasion of Manchuria in August 1945. Both sides kept large armies on the Manchurian border throughout. The frontier had already been fought over: an undeclared border war ran through the late 1930s and was settled at Nomonhan on the Manchukuo–Mongolian border in the summer of 1939, where Zhukov destroyed a Japanese division. That defeat is a large part of why the Japanese advance in 1941 went south rather than north.'
    },
    {
      id: 'mongolia', en: 'Mongolian People’s Republic', orig: 'Бүгд Найрамдах Монгол Ард Улс',
      zh: '蒙古人民共和國', when: 'Soviet satellite', cat: 'neutral', lvl: 2, c: '#d3d1e6',
      atoms: ['mongolia'], wiki: 'https://en.wikipedia.org/wiki/Mongolian_People\'s_Republic',
      note: 'Its border with Manchukuo was the scene of the undeclared war at Nomonhan in 1939, whose outcome helped turn Japanese strategy south rather than north.'
    },
    {
      id: 'xinjiang', en: 'Xīnjiāng (Sinkiang)', ja: '新疆 (Shinkyō)', orig: 'شىنجاڭ (Shinjang)',
      zh: '新疆', when: 'Realigned with Chungking in 1942', cat: 'freechina', lvl: 3,
      atoms: ['xinjiang'], within: 'freechina', wiki: 'https://en.wikipedia.org/wiki/Xinjiang',
      sub: '1',
      note: 'Oasis towns round the rim of the Taklamakan, watered off the Tian Shan and the Kunlun, growing cotton, wheat and melons, with pastoral country in the north; Uyghur, Kazakh and Hui more than Han, and its trade running to Soviet Central Asia rather than to China. A province in name only. A Muslim rising in 1931 grew into the East Turkestan Republic proclaimed at Kashgar in 1933 and put down with Soviet help; Sheng Shicai then governed on Soviet money, with Soviet advisers, aircraft and a garrison at Hami, running the province as a Soviet dependency in all but name. He broke with Moscow in 1942 and turned to Chongqing — he was still governing in December — and within two years had lost the confidence of both.'
    },
    {
      id: 'tibet', en: 'Tibet', ja: 'チベット (Chibetto)', orig: 'བོད་ (Bod)', zh: '西藏',
      when: 'De facto independent', cat: 'frontier', lvl: 3, atoms: ['tibet'],
      wiki: 'https://en.wikipedia.org/wiki/Tibet_(1912%E2%80%931951)',
      note: 'The highest inhabited country on earth: grassland and rock above 4,000 metres, barley in the valleys and yaks on everything else, governed from Lhasa by the monasteries and the noble houses together, with the 14th Dalai Lama a child of seven. Self-governing in practice since 1913 and claimed by China throughout. Neutral in the war, and it refused passage to an Allied supply route from India to China — which mattered once Burma fell in 1942 and left only the airlift over the Hump; Britain and the United States pressed hard and Lhasa did not give way.'
    },
    {
      id: 'macau', en: 'Macao', ja: 'マカオ (Makao)', orig: '澳門 (Ou-mun)', zh: '澳門',
      when: 'Portuguese and neutral throughout', cat: 'portuguese', lvl: 3, atoms: ['macau'],
      wiki: 'https://en.wikipedia.org/wiki/Portuguese_Macau',
      note: 'Japan never occupied Macao and never raised its flag here: Portugal was neutral, the colony stayed Portuguese to the end of the war, and it filled with refugees from Hong Kong and Guangzhou — its population several times what it had been. That neutrality was held on Japanese sufferance, though. The colony was surrounded, and it was fed and policed by agreement; from 1943 Japanese "advisers" were installed and had their way in most things. It is drawn Portuguese because that is what it was, and this note is where the qualification belongs.'
    },
    {
      id: 'guangzhouwan', en: 'Guǎngzhōuwān (Kwangchowan)', ja: '広州湾 (Kōshūwan)',
      orig: 'Kouang-Tchéou-Wan', zh: '廣州灣', when: 'Leased to France 1898–1945', cat: 'french',
      lvl: 3, atoms: ['guangzhouwan'], wiki: 'https://en.wikipedia.org/wiki/Guangzhouwan',
      note: 'A French leased territory on the Leizhou peninsula, run from Indochina and drawn like it. In December 1942 Vichy French administration continued inside a Japanese-occupied region, and it was the last neutral door into south China — a smuggling route and an escape route. Japanese troops moved in in February 1943.'
    },
    {
      id: 'tuva', en: 'Tannu Tuva (Tuvan People’s Republic)', orig: 'Тыва Арат Республик',
      zh: '唐努圖瓦', when: 'Independent in name from 1921', cat: 'neutral', lvl: 3, c: '#d3d1e6',
      atoms: ['tuva'], edge: '#bebada',
      wiki: 'https://en.wikipedia.org/wiki/Tuvan_People\'s_Republic',
      note: 'Qing territory until 1911, then a Russian protectorate, then a nominally independent republic from 1921 — recognised only by the Soviet Union and Mongolia. Absorbed into the USSR in 1944. China went on claiming it.'
    },
    {
      id: 'nepal', en: 'Nepal', orig: 'नेपाल (Nepāl)', zh: '尼泊爾',
      when: 'Independent, in treaty with Britain', cat: 'other', lvl: 2, c: '#e2d9c6',
      atoms: ['nepal'], wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Nepal',
      note: 'Never colonised, and recognised as fully independent by Britain in 1923, though bound to it by treaty and supplying the Gurkha regiments.'
    },
    {
      id: 'sikkim', en: 'Sikkim', orig: 'འབྲས་ལྗོངས (Drenjong)', zh: '錫金',
      when: 'British protectorate from 1861, recognised by China 1890', cat: 'allied', lvl: 2,
      c: '#dcc2ce', atoms: ['sikkim'], wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Sikkim',
      note: 'A Himalayan kingdom under British protection, not a part of British India — which is why it is drawn apart from it here. The protectorate began with the Treaty of Tumlong in 1861, which followed a British punitive expedition and put Sikkim’s external relations in British hands; China recognised it, and the Sikkim–Tibet boundary was drawn, by the Convention of Calcutta of 17 March 1890.'
    },
    {
      id: 'bhutan', en: 'Bhutan', orig: 'འབྲུག་ཡུལ (Druk Yul)', zh: '不丹',
      when: 'British protectorate from 1910', cat: 'other', lvl: 2, c: '#c9a6b0',
      atoms: ['bhutan'], wiki: 'https://en.wikipedia.org/wiki/Bhutan',
      note: 'Internally self-governing, with Britain conducting its foreign relations under the Treaty of Punakha.'
    },
    {
      id: 'other', en: 'Afghanistan', orig: 'Afghanistan, Nepal, Bhutan', zh: '阿富汗・尼泊爾・不丹',
      cat: 'other', lvl: 3, atoms: ['other'],
      wiki: 'https://en.wikipedia.org/wiki/Kingdom_of_Afghanistan',
      note: 'Drawn for context rather than as part of the story. Afghanistan and Nepal were independent states; Bhutan and Sikkim were British protectorates, outside the directly administered provinces of British India.'
    },
    {
      id: 'nca_pacified', en: 'Pacified areas (治安地区)', ja: '治安地区', zh: '治安地區',
      when: 'September 1942', rule: 'The North China Area Army\'s own classification',
      cat: 'pacified', lvl: 3, atoms: ['nca_pacified'], srcOnly: 'nca',
      note: 'Ground the North China Area Army classed as pacified — 治安地区 — in its own survey of September 1942. Not the same claim as the shading it replaces: that is where Japanese authority reached at all, this is where the army itself thought it had the country in hand. It comes to about 275,000 square kilometres, roughly a quarter of the area the occupation is otherwise drawn over, and it sits along the railways and around the cities much as the note on the occupation says. The sheet’s third category, semi-pacified — 準治安地区 — is what it leaves blank, and it is left blank here too, so unshaded ground inside north China is not a claim that nobody was there.'
    },
    {
      id: 'nca_unpacified', en: 'Un-pacified areas (未治安地区)', ja: '未治安地区', zh: '未治安地區',
      when: 'September 1942', rule: 'The North China Area Army\'s own classification',
      cat: 'unpacified', lvl: 3, atoms: ['nca_unpacified'], srcOnly: 'nca',
      note: 'Ground the same survey classed as un-pacified — 未治安地区: about 182,000 square kilometres, in fifty-three separate areas, most of them in the mountains of Shanxi and Hebei and along the Shandong hills. This is the army’s own account of where it was being fought, drawn by the people doing the fighting, and it is worth setting beside the Communist base areas from Wu Yuexing’s atlas, which is the other reading this map offers. They are not the same map and were not drawn to answer the same question.'
    },
    {
      id: 'contested', en: 'Border is contested or not fixed', ja: '未確定国境', zh: '未定國界',
      cat: 'contested', lvl: 3, c: 'transparent', atoms: ['contested'], hatch: 'unclear',
      label: '-',
      note: 'These stretches of frontier were contested or the sources for this map disagree about them. They include the Pamirs where Afghanistan, the Soviet Union and China meet; the Aksai Chin plateau in northeastern Kashmir; the frontier east of Bhutan; and the frontier between Burma and Yunnan.'
    },
  ],
};

JMAP.SITES = [
  {
    id: 'tokyo', en: 'Tokyo', ja: '東京 (Tōkyō)', orig: '東京 (Tōkyō)', zh: '東京', ko: '도쿄도',
    date: 'Capital from 1868', cat: 'city', lvl: 1, lat: 35.68, lon: 139.76,
    wiki: 'https://en.wikipedia.org/wiki/Tokyo', year: 1868,
    note: 'Edo until the Restoration. The Great Kantō earthquake struck in 1923 and was followed by the massacre of Koreans; young officers of the Imperial Way faction seized the government quarter in the 2.26 Incident of February 1936 and killed three senior figures, the finance minister among them; the firebombing of 9–10 March 1945 killed some 100,000 people in a night.'
  },
  {
    id: 'yokohama', en: 'Yokohama', ja: '横浜 (Yokohama)', orig: '横浜 (Yokohama)', zh: '橫濱',
    ko: '요코하마', date: 'Treaty port opened 1859', cat: 'city', lvl: 2, lat: 35.44, lon: 139.64,
    wiki: 'https://en.wikipedia.org/wiki/Yokohama', year: 1859,
    note: 'The foreign settlement nearest Edo, and the terminus of Japan’s first railway in 1872.'
  },
  {
    id: 'uraga', en: 'Uraga', ja: '浦賀 (Uraga)', orig: '浦賀 (Uraga)', zh: '浦賀', date: 'July 1853',
    cat: 'battle', lvl: 3, both: true, lat: 35.25, lon: 139.72,
    wiki: 'https://en.wikipedia.org/wiki/Perry_Expedition', year: 1853,
    note: 'Four American warships anchored here on 8 July 1853 and Perry refused to leave until his letter was taken. He returned in February 1854 with twice as many ships, and the Treaty of Kanagawa followed in March.'
  },
  {
    id: 'shimoda', en: 'Shimoda', ja: '下田 (Shimoda)', orig: '下田 (Shimoda)', zh: '下田',
    date: 'Opened 1854', cat: 'city', lvl: 3, lat: 34.67, lon: 138.95,
    wiki: 'https://en.wikipedia.org/wiki/Shimoda_Ropeway', year: 1854,
    note: 'One of the two ports opened by the Treaty of Kanagawa; Townsend Harris was the first American consul here, and negotiated the 1858 commercial treaty.'
  },
  {
    id: 'kyoto', en: 'Kyoto', ja: '京都 (Kyōto)', orig: '京都 (Kyōto)', zh: '京都', ko: '교토',
    date: 'Imperial seat until 1868', cat: 'city', lvl: 2, lat: 35.01, lon: 135.77,
    wiki: 'https://en.wikipedia.org/wiki/Kyoto', year: 1868,
    note: 'The emperor’s city for over a thousand years, until the court moved to Tokyo. The Takikawa Incident at its Imperial University in 1933 marked the closing of academic freedom.'
  },
  {
    id: 'osaka', en: 'Osaka', ja: '大阪 (Ōsaka)', orig: '大阪 (Ōsaka)', zh: '大阪', ko: '오사카',
    date: 'Opened 1868', cat: 'city', lvl: 2, lat: 34.69, lon: 135.5,
    wiki: 'https://en.wikipedia.org/wiki/Osaka', year: 1868,
    note: 'The commercial capital of Tokugawa Japan and later a centre of heavy industry and of labour organising. The rice riots of 1918, which began among fishermen\'s wives in Toyama, were at their worst here.'
  },
  {
    id: 'kobe', en: 'Kobe', ja: '神戸 (Kōbe)', orig: '神戸 (Kōbe)', zh: '神戶', ko: '고베',
    date: 'Treaty port opened 1868', cat: 'city', lvl: 3, lat: 34.69, lon: 135.2,
    wiki: 'https://en.wikipedia.org/wiki/Kobe', year: 1868,
    note: 'Shipbuilding and the main emigration port for Japanese leaving for Hawaii and the Americas.'
  },
  {
    id: 'nagoya', en: 'Nagoya', ja: '名古屋 (Nagoya)', orig: '名古屋 (Nagoya)', zh: '名古屋', ko: '나고야',
    date: 'Bombed 1944–1945', cat: 'city', lvl: 3, lat: 35.18, lon: 136.91,
    wiki: 'https://en.wikipedia.org/wiki/Nagoya', year: 1889,
    note: 'The centre of the aircraft industry, and for that reason among the most heavily bombed cities of the war.'
  },
  {
    id: 'hiroshima', en: 'Hiroshima', ja: '広島 (Hiroshima)', orig: '広島 (Hiroshima)', zh: '廣島',
    ko: '히로시마', date: 'Atomic bomb, 6 August 1945', cat: 'city', lvl: 1, both: true, lat: 34.39,
    lon: 132.46, wiki: 'https://en.wikipedia.org/wiki/Hiroshima', year: 1894,
    note: 'Army headquarters and the embarkation port for the continent since 1894. Destroyed by the first atomic bomb; around 140,000 were dead by the end of the year.'
  },
  {
    id: 'nagasaki', en: 'Nagasaki', ja: '長崎 (Nagasaki)', orig: '長崎 (Nagasaki)', zh: '長崎',
    ko: '나가사키', date: 'Atomic bomb, 9 August 1945', cat: 'city', lvl: 1, both: true, lat: 32.74,
    lon: 129.87, wiki: 'https://en.wikipedia.org/wiki/Nagasaki', year: 1641,
    note: 'The Dutch post at Dejima made this Japan’s only window on Europe under the Tokugawa. Destroyed by the second atomic bomb; around 70,000 were dead by the end of the year.'
  },
  {
    id: 'shimonoseki', en: 'Shimonoseki', ja: '下関 (Shimonoseki)', orig: '下関 (Shimonoseki)',
    zh: '下關', ko: '시모노세키', date: 'Bombarded 1864; treaty signed April 1895', cat: 'city',
    lvl: 2, lat: 33.96, lon: 130.94, wiki: 'https://en.wikipedia.org/wiki/Shimonoseki',
    year: 1864,
    note: 'Chōshū’s straits, shelled by a four-power squadron in 1864. The Treaty of Shimonoseki ended the First Sino-Japanese War and handed Taiwan to Japan.'
  },
  {
    id: 'kagoshima', en: 'Kagoshima', ja: '鹿児島 (Kagoshima)', orig: '鹿児島 (Kagoshima)', zh: '鹿兒島',
    ko: '가고시마', date: 'Bombarded 1863; rebellion 1877', cat: 'city', lvl: 2, lat: 31.6,
    lon: 130.56, wiki: 'https://en.wikipedia.org/wiki/Kagoshima', year: 1863,
    note: 'Castle town of Satsuma, shelled by the Royal Navy in 1863 over the Richardson Affair, and the base of Saigō Takamori’s rebellion in 1877.'
  },
  {
    id: 'hakodate', en: 'Hakodate', ja: '函館 (Hakodate)', orig: '函館 (Hakodate)', zh: '函館',
    ko: '하코다테', date: 'Opened 1854; Republic of Ezo 1869', cat: 'city', lvl: 3, lat: 41.77,
    lon: 140.73, wiki: 'https://en.wikipedia.org/wiki/Hakodate', year: 1854,
    note: 'One of the first two ports opened to the Americans, and the site of the last Tokugawa resistance in the Boshin War.'
  },
  {
    id: 'sapporo', en: 'Sapporo', ja: '札幌 (Sapporo)', orig: '札幌 (Sapporo)', zh: '札幌', ko: '삿포로',
    date: 'Founded 1869', cat: 'city', lvl: 3, lat: 43.06, lon: 141.35,
    wiki: 'https://en.wikipedia.org/wiki/Sapporo', year: 1869,
    note: 'Laid out on a grid as the headquarters of the Hokkaidō Colonisation Commission, the agency that settled the island and dispossessed the Ainu.'
  },
  {
    id: 'tsushima', en: 'Tsushima Strait', ja: '対馬海峡 (Tsushima Kaikyō)', zh: '對馬海峽',
    ko: '대한해협 (Taehan Haehyŏp)', date: '27–28 May 1905', cat: 'battle', lvl: 3, both: true,
    lat: 34.35, lon: 129.78, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Tsushima',
    year: 1905,
    note: 'Tōgō destroyed the Russian Baltic Fleet here after its eighteen-thousand-mile voyage — the decisive battle of the Russo-Japanese War and the first modern defeat of a European power by an Asian one.'
  },
  {
    id: 'naha', en: 'Naha', ja: '那覇 (Naha)', orig: '那覇 (Naafa)', zh: '那霸', ko: '나하',
    date: 'Battle of Okinawa, April–June 1945', cat: 'city', lvl: 1, both: true, lat: 26.21,
    lon: 127.68, wiki: 'https://en.wikipedia.org/wiki/Naha', year: 1879,
    note: 'Port of the Ryūkyū Kingdom, and the site of the largest land battle of the war fought on Japanese soil among a civilian population, in which around a quarter of Okinawans died.'
  },
  {
    id: 'iwojima', en: 'Iwo Jima (Iō-tō)', ja: '硫黄島 (Iō-tō)', orig: '硫黄島 (Iō-tō)', zh: '硫磺島',
    date: '19 February – 26 March 1945', cat: 'battle', lvl: 2, both: true, lat: 24.78,
    lon: 141.32, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Iwo_Jima', year: 1945,
    note: 'Taken at a cost of nearly 7,000 American and over 18,000 Japanese dead, to give fighter cover to the bombers over Japan.'
  },
  {
    id: 'seoul', en: 'Keijō (Kyŏngsŏng, Seoul)', ja: '京城 (Keijō)', zh: '京城（漢城）',
    ko: '서울 / 한성 (Sŏul / Hansŏng)', date: 'Renamed Keijō in 1910', cat: 'city', lvl: 1,
    lat: 37.57, lon: 126.98, wiki: 'https://en.wikipedia.org/wiki/Keij%C5%8D',
    local: 'Kyŏngsŏng (Keijō, Seoul)', year: 1876,
    note: 'Capital of Chosŏn Korea as Hansŏng, and of the colony as Keijō. The Kapsin Coup of 1884 and the March First Movement of 1919 both began here; Queen Min was murdered in the palace in 1895.'
  },
  {
    id: 'pusan', en: 'Fusan (Pusan)', ja: '釜山 (Fusan)', zh: '釜山', ko: '부산 (Pusan)',
    date: 'Opened by treaty 1876', cat: 'city', lvl: 2, lat: 35.18, lon: 129.08,
    wiki: 'https://en.wikipedia.org/wiki/Busan', local: 'Pusan (Fusan)', year: 1876,
    note: 'The port closest to Japan, long the site of a Japanese trading enclave, and the southern end of the ferry and rail link that tied Korea into the Japanese economy.'
  },
  {
    id: 'incheon', en: 'Jinsen (Inch’ŏn)', ja: '仁川 (Jinsen)', zh: '仁川',
    ko: '인천 / 제물포 (Inch’ŏn / Chemulp’o)', date: 'Naval action 9 February 1904', cat: 'city',
    lvl: 3, lat: 37.46, lon: 126.71, wiki: 'https://en.wikipedia.org/wiki/Incheon',
    local: 'Inch’ŏn (Jinsen)', year: 1883,
    note: 'Seoul’s port, known to foreigners as Chemulpo. The Japanese attack on Russian ships here opened the Russo-Japanese War.'
  },
  {
    id: 'kanghwa', en: 'Kanghwa Island', ja: '江華島 (Kōkatō)', zh: '江華島', ko: '강화도 (Kanghwado)',
    date: 'Treaty signed 26 February 1876', cat: 'battle', lvl: 3, both: true, lat: 37.75,
    lon: 126.48, wiki: 'https://en.wikipedia.org/wiki/Japan%E2%80%93Korea_Treaty_of_1876',
    year: 1876,
    note: 'Japanese gunboat diplomacy — an engineered incident in 1875, then a fleet — produced the Kanghwa Treaty, Korea’s own unequal treaty, on the model of the ones imposed on Japan twenty years before.'
  },
  {
    id: 'pyongyang', en: 'Heijō (P’yŏngyang)', ja: '平壌 (Heijō)', zh: '平壤',
    ko: '평양 (P’yŏngyang)', date: 'Battle, 15 September 1894', cat: 'city', lvl: 3, lat: 39.02,
    lon: 125.75, wiki: 'https://en.wikipedia.org/wiki/Pyongyang', local: 'P’yŏngyang (Heijō)',
    year: 1894,
    note: 'Site of a decisive Japanese victory over Qing forces in the First Sino-Japanese War, and later a centre of colonial industry and of Korean Christianity.'
  },
  {
    id: 'mukden', en: 'Hōten (Shěnyáng, Mukden)', ja: '奉天 (Hōten)', orig: '瀋陽 (Shěnyáng)',
    zh: '瀋陽（奉天）', ko: '선양', date: 'Battle 1905; Manchurian Incident 18 September 1931',
    cat: 'city', lvl: 1, both: true, lat: 41.8, lon: 123.43,
    wiki: 'https://en.wikipedia.org/wiki/Shenyang', jpfrom: 'e1942', local: 'Shěnyáng (Mukden)',
    year: 1905,
    note: 'The Manchu dynastic capital, and the prize of the largest land battle of the Russo-Japanese War. The explosion staged on the South Manchuria Railway just outside the city on 18 September 1931 was the pretext for the invasion of Manchuria.'
  },
  {
    id: 'changchun', en: 'Shinkyō (Chángchūn, Hsinking)', ja: '新京 (Shinkyō)',
    orig: '長春 (Chángchūn)', zh: '長春（新京）', ko: '창춘', date: 'Capital of Manchukuo from 1932',
    cat: 'city', lvl: 2, lat: 43.88, lon: 125.32,
    wiki: 'https://en.wikipedia.org/wiki/Changchun', jpfrom: 'e1942',
    local: 'Chángchūn (Hsinking)', year: 1907,
    note: 'Renamed Hsinking, "new capital", and rebuilt on a planned grid with boulevards and ministries as the showpiece of the puppet state.'
  },
  {
    id: 'harbin', en: 'Harubin (Hā’ěrbīn, Harbin)', ja: 'ハルビン (Harubin)',
    orig: '哈爾濱 (Hā’ěrbīn)', zh: '哈爾濱', ko: '하얼빈', date: 'Itō assassinated 26 October 1909',
    cat: 'city', lvl: 2, lat: 45.8, lon: 126.53, wiki: 'https://en.wikipedia.org/wiki/Harbin',
    jpfrom: 'e1942', local: 'Hā’ěrbīn (Harbin)', year: 1909,
    note: 'A Russian-built railway city with a large émigré population. Itō Hirobumi was shot at its station by the Korean independence activist An Chunggŭn. Unit 731 ran human vivisection at Pingfang on the outskirts from 1936, and field-tested plague and cholera on Chinese towns.'
  },
  {
    id: 'portarthur', en: 'Ryojun (Lǚshùn, Port Arthur)', ja: '旅順 (Ryojun)',
    orig: '旅順 (Lǚshùn)', zh: '旅順', ko: '뤼순커우구', date: 'Siege, August 1904 – January 1905',
    cat: 'city', lvl: 1, lat: 38.82, lon: 121.22,
    wiki: 'https://en.wikipedia.org/wiki/L%C3%BCshunkou', local: 'Lǚshùn (Port Arthur, Ryojun)',
    year: 1894,
    note: 'Taken from China in 1894, given up under the Triple Intervention of 1895, leased by Russia in 1898, and won back at enormous cost in the siege of 1904–05. The pivot of Japanese continental policy for fifty years.'
  },
  {
    id: 'dairen', en: 'Dairen (Dàlián, Dalny)', ja: '大連 (Dairen)', orig: '大連 (Dàlián)',
    zh: '大連', ko: '다롄', date: 'Japanese from 1905', cat: 'city', lvl: 2, lat: 38.91,
    lon: 121.61, wiki: 'https://en.wikipedia.org/wiki/Dalian', local: 'Dàlián (Dairen, Dalny)',
    year: 1905,
    note: 'The commercial capital of the Kwantung Leased Territory and headquarters of the South Manchuria Railway Company, the vehicle of Japanese economic power in the region.'
  },
  {
    id: 'chengde', en: 'Shōtoku (Chéngdé, Chengteh)', ja: '承徳 (Shōtoku)', orig: '承德 (Chéngdé)',
    zh: '承德', ko: '청더', date: 'Occupied 4 March 1933', cat: 'city', lvl: 3, lat: 40.98,
    lon: 117.94, wiki: 'https://en.wikipedia.org/wiki/Chengde', jpfrom: 'e1942',
    local: 'Chéngdé (Chengteh)', year: 1933,
    note: 'The Qing emperors’ summer capital, and capital of Rehe province — English sources often call the city itself Rehe. Taken in a ten-day campaign and attached to Manchukuo; the Tanggu Truce followed in May.'
  },
  {
    id: 'nomonhan', en: 'Nuòménhǎn (Nomonhan, Khalkhin Gol)', ja: 'ノモンハン事件 (Nomonhan jiken)',
    orig: 'Халхын гол', zh: '諾門罕', date: 'May – September 1939', cat: 'battle', lvl: 3,
    both: true, lat: 47.73, lon: 118.55,
    wiki: 'https://en.wikipedia.org/wiki/Battles_of_Khalkhin_Gol', year: 1939,
    note: 'An undeclared war on the Manchukuo–Mongolian border. Zhukov’s encirclement destroyed a Japanese division and helped settle the strategic argument in favour of striking south rather than north.'
  },
  {
    id: 'wanpaoshan', en: 'Wànbǎoshān (Wanpaoshan)', ja: '万宝山事件 (Manpōzan jiken)',
    orig: '萬寶山 (Wànbǎoshān)', zh: '萬寶山', date: 'July 1931', cat: 'battle', lvl: 3, lat: 44.95,
    lon: 125.4, wiki: 'https://en.wikipedia.org/wiki/Wanpaoshan_Incident', year: 1931,
    note: 'A quarrel over an irrigation ditch between Korean and Chinese farmers, inflamed by Japanese press reports into anti-Chinese riots in Korea, two months before the invasion of Manchuria.'
  },
  {
    id: 'beijing', en: 'Běijīng (Peking)', ja: '北京 (Pekin)',
    orig: '北京 / 北平 (Běijīng / Běipíng)', zh: '北京 (Běijīng)', ko: '베이징',
    date: 'Renamed Peiping in 1928; occupied July–August 1937', cat: 'city', lvl: 1, lat: 39.9,
    lon: 116.4, wiki: 'https://en.wikipedia.org/wiki/Beijing', year: 1900,
    note: 'The Qing capital, demoted to "Peiping" when the Nationalists moved the capital to Nanjing in 1928. Japanese troops joined the eight-nation force that relieved the legations in 1900, and took the city outright in August 1937.'
  },
  {
    id: 'marcopolo', en: 'Lúgōuqiáo (the Marco Polo Bridge)', ja: '盧溝橋事件 (Rokōkyō jiken)',
    orig: '盧溝橋 (Lúgōuqiáo)', zh: '盧溝橋', date: '7 July 1937', cat: 'battle', lvl: 2, both: true,
    lat: 39.85, lon: 116.21, wiki: 'https://en.wikipedia.org/wiki/Marco_Polo_Bridge_incident',
    year: 1937,
    note: 'A night exercise, a missing soldier and an exchange of fire — the skirmish that opened eight years of full-scale war in China.'
  },
  {
    id: 'tianjin', en: 'Tiānjīn (Tientsin)', ja: '天津 (Tenshin)', orig: '天津 (Tiānjīn)', zh: '天津',
    ko: '톈진', date: 'Convention 1885; occupied 1937', cat: 'city', lvl: 2, lat: 39.13,
    lon: 117.2, wiki: 'https://en.wikipedia.org/wiki/Tianjin', year: 1885,
    note: 'The treaty port for Beijing, carved into nine foreign concessions at their greatest extent, a Japanese one among them. The Tianjin Convention of 1885 regulated Chinese and Japanese troops in Korea, and broke down in 1894; the Tanggu Truce of May 1933, signed at its port, gave north China a demilitarised zone that Japan spent the next four years pushing into.'
  },
  {
    id: 'kalgan', en: 'Chōkakō (Zhāngjiākǒu, Kalgan, Changchiakou)', ja: '張家口 (Chōkakō)',
    orig: '張家口 (Zhāngjiākǒu)', zh: '張家口', date: 'Capital of Mengchiang from 1939', cat: 'city',
    lvl: 3, lat: 40.81, lon: 114.88, wiki: 'https://en.wikipedia.org/wiki/Zhangjiakou',
    jpfrom: 'e1942', local: 'Zhāngjiākǒu (Kalgan, Changchiakou)', year: 1937,
    note: 'The old caravan gate through the Great Wall to Mongolia, and the seat of the Japanese-sponsored Inner Mongolian regime.'
  },
  {
    id: 'jinan', en: 'Jǐnán (Tsinan)', ja: '済南 (Sainan)', orig: '濟南 (Jǐnán)', zh: '濟南',
    ko: '지난', date: 'May 1928', cat: 'city', lvl: 3, lat: 36.67, lon: 116.99,
    wiki: 'https://en.wikipedia.org/wiki/Jinan', year: 1928,
    note: 'Japanese troops sent to "protect residents" clashed with the Nationalist Northern Expedition; thousands of Chinese were killed, and a Chinese diplomat mutilated and executed.'
  },
  {
    id: 'qingdao', en: 'Qīngdǎo (Tsingtao)', ja: '青島 (Seitō)', orig: '青島 (Qīngdǎo)', zh: '青島',
    ko: '칭다오', date: 'Seized from Germany, November 1914', cat: 'city', lvl: 2, lat: 36.07,
    lon: 120.38, wiki: 'https://en.wikipedia.org/wiki/Qingdao', year: 1914,
    note: 'The German leasehold in Shandong, taken by Japan in 1914. Keeping it was the first of the Twenty-One Demands and was confirmed at Versailles, which set off the May Fourth Movement. Returned in 1922.'
  },
  {
    id: 'weihai', en: 'Wēihǎi (Weihaiwei)', ja: '威海衛 (Ikaiei)', orig: '威海衛 (Wēihǎiwèi)',
    zh: '威海衛', ko: '웨이하이', date: 'Battle, January–February 1895', cat: 'city', lvl: 3,
    lat: 37.51, lon: 122.12, wiki: 'https://en.wikipedia.org/wiki/Weihai', year: 1895,
    note: 'The Peiyang Fleet’s base, destroyed by Japan in the closing weeks of the First Sino-Japanese War; afterwards a British leased territory until 1930.'
  },
  {
    id: 'nanjing', en: 'Nánjīng (Nanking)', ja: '南京 (Nankin)', orig: '南京 (Nánjīng)', zh: '南京',
    ko: '난징', date: 'Fell 13 December 1937', cat: 'city', lvl: 1, both: true, lat: 32.06,
    lon: 118.8, wiki: 'https://en.wikipedia.org/wiki/Nanjing', year: 1927,
    note: 'Nationalist capital from 1927. Its capture on 13 December 1937 was followed by weeks of mass killing and rape — the Nanjing Massacre — in which the dead are counted from the tens of thousands to 300,000, depending on the period and the boundary taken. From 1940 it housed Wang Jingwei\'s collaborationist government.'
  },
  {
    id: 'shanghai', en: 'Shànghǎi', ja: '上海 (Shanhai)', orig: '上海 (Shànghǎi)', zh: '上海',
    ko: '상하이', date: 'Fighting 1932; battle August–November 1937', cat: 'city', lvl: 1,
    lat: 31.23, lon: 121.47, wiki: 'https://en.wikipedia.org/wiki/Shanghai', year: 1863,
    note: 'The largest treaty port in China, with an International Settlement and a French Concession. Fighting in January 1932 and again in 1937, when three months of street and river fighting cost both armies enormously and destroyed China’s best divisions.'
  },
  {
    id: 'wuhan', en: 'Wǔhàn (Hankow)', ja: '漢口 (Hankō)', orig: '武漢 / 漢口 (Wǔhàn / Hànkǒu)',
    zh: '武漢（漢口）', ko: '우한', date: 'Fell 25 October 1938', cat: 'city', lvl: 2, lat: 30.58,
    lon: 114.28, wiki: 'https://en.wikipedia.org/wiki/Wuhan', year: 1861,
    note: 'The Nationalist government’s refuge after Nanjing. Its fall ended the first mobile phase of the war; from then on the fighting in China settled into stalemate.'
  },
  {
    id: 'chongqing', en: 'Chóngqìng (Chungking)', ja: '重慶 (Jūkei)', orig: '重慶 (Chóngqìng)',
    zh: '重慶', ko: '충칭', date: 'Wartime capital 1938–1945', cat: 'city', lvl: 2, lat: 29.56,
    lon: 106.55, wiki: 'https://en.wikipedia.org/wiki/Chongqing', year: 1891,
    note: 'Chosen for the gorges and the fog that shielded it. Bombed for five years in one of the first sustained campaigns against a civilian population.'
  },
  {
    id: 'yanan', en: 'Yán’ān (Yenan)', ja: '延安 (En’an)', orig: '延安 (Yán’ān)', zh: '延安',
    ko: '옌안', date: 'Communist base 1936–1947', cat: 'city', lvl: 3, lat: 36.6, lon: 109.49,
    wiki: 'https://en.wikipedia.org/wiki/Yan\'an', year: 1936,
    note: 'The Long March ended in northern Shaanxi in 1935 and the party moved here at the end of 1936. From it Mao consolidated his leadership and the party grew from tens of thousands to over a million. The American observers of the Dixie Mission arrived in July 1944, the first official contact between Washington and the Communists.'
  },
  {
    id: 'xian', en: 'Xī’ān (Sian)', ja: '西安 (Seian)', orig: '西安 (Xī’ān)', zh: '西安', ko: '시안',
    date: 'December 1936', cat: 'city', lvl: 3, lat: 34.34, lon: 108.94,
    wiki: 'https://en.wikipedia.org/wiki/Xi\'an', year: 1936,
    note: 'Chiang Kai-shek was kidnapped here by his own generals and released only after agreeing to a united front with the Communists against Japan.'
  },
  {
    id: 'guangzhou', en: 'Guǎngzhōu (Canton)', ja: '広州 (Kōshū)', orig: '廣州 (Guǎngzhōu)',
    zh: '廣州', ko: '광저우', date: 'Fell 21 October 1938', cat: 'city', lvl: 2, lat: 23.13,
    lon: 113.26, wiki: 'https://en.wikipedia.org/wiki/Guangzhou', year: 1842,
    note: 'The original treaty port and the cradle of the Nationalist revolution, taken in 1938 to cut the supply line from Hong Kong.'
  },
  {
    id: 'xiamen', en: 'Xiàmén (Amoy)', ja: '厦門 (Amoi)', orig: '廈門 (Xiàmén)', zh: '廈門', ko: '샤먼',
    date: 'Occupied May 1938', cat: 'city', lvl: 3, lat: 24.48, lon: 118.09,
    wiki: 'https://en.wikipedia.org/wiki/Xiamen', year: 1842,
    note: 'A treaty port opposite Taiwan, and a main point of departure for Chinese emigration to Southeast Asia.'
  },
  {
    id: 'hainan', en: 'Hǎinándǎo (Hainan Island)', ja: '海南島 (Kainantō)',
    orig: '海南島 (Hǎinándǎo)', zh: '海南島', date: 'Occupied February 1939', cat: 'battle', lvl: 3,
    lat: 19.55, lon: 109.6, wiki: 'https://en.wikipedia.org/wiki/Hainan_Island_Operation',
    year: 1939,
    note: 'Landings on 10 February 1939 took the island to blockade the south China coast and as a step towards Indochina. Its iron ore was then worked with forced labour, much of it Chinese prisoners and conscripted Hainanese.'
  },
  {
    id: 'taipei', en: 'Taihoku (Taibei, Taipei)', ja: '臺北 (Taihoku)', orig: '臺北 (Tâi-pak)',
    zh: '臺北', ko: '다이호쿠주', date: 'Colonial capital from 1895', cat: 'city', lvl: 2, lat: 25.03,
    lon: 121.57, wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Taibei (Taihoku, Taipei)', year: 1895,
    note: 'Seat of the Governor-General of Taiwan, and the administrative model that later colonies were built on.'
  },
  {
    id: 'kaohsiung', en: 'Takao (Gaoxiong, Kaohsiung)', ja: '高雄 (Takao)', orig: '高雄 (Ko-hiông)',
    zh: '高雄', date: 'Developed from 1908', cat: 'city', lvl: 3, lat: 22.63, lon: 120.3,
    wiki: 'https://en.wikipedia.org/wiki/Xin-Fu-Hwa', local: 'Gaoxiong (Takao, Kaohsiung)',
    year: 1908,
    note: 'The southern port built up by the colonial government, and the springboard for the "southward advance" into Southeast Asia.'
  },
  {
    id: 'vladivostok', en: 'Vladivostok', ja: '浦潮 (Urajio)', orig: 'Владивосток', zh: '海參崴',
    date: 'Japanese landing, August 1918', cat: 'city', lvl: 2, lat: 43.12, lon: 131.89,
    wiki: 'https://en.wikipedia.org/wiki/Vladivostok', year: 1918,
    note: 'Russia’s Pacific naval base and the terminus of the Trans-Siberian. The Siberian Intervention put 70,000 Japanese troops ashore here, and they stayed until 1922 — long after the other Allies had gone.'
  },
  {
    id: 'nikolaevsk', en: 'Nikolaevsk-on-Amur', ja: '尼港事件 (Nikō jiken)',
    orig: 'Николаевск-на-Амуре', zh: '廟街（尼港）', date: 'March – May 1920', cat: 'battle', lvl: 3,
    lat: 53.14, lon: 140.73, wiki: 'https://en.wikipedia.org/wiki/Nikolayevsk_incident',
    year: 1920,
    note: 'Partisans killed the Japanese garrison and much of the Japanese and Russian civilian population. Japan used the massacre to justify occupying northern Sakhalin until 1925.'
  },
  {
    id: 'hanoi', en: 'Hanoi', ja: 'ハノイ (Hanoi)', orig: 'Hà Nội', zh: '河內',
    date: 'Japanese troops enter September 1940', cat: 'city', lvl: 2, lat: 21.03, lon: 105.85,
    wiki: 'https://en.wikipedia.org/wiki/Hanoi', year: 1902,
    note: 'Capital of French Indochina. Japan occupied the north to cut the rail supply route to Chongqing, while leaving the French administration nominally in charge.'
  },
  {
    id: 'saigon', en: 'Saigon', ja: 'サイゴン (Saigon)', orig: 'Sài Gòn', zh: '西貢',
    date: 'Occupied July 1941', cat: 'city', lvl: 2, lat: 10.82, lon: 106.63, year: 1859,
    note: 'The move into southern Indochina put Japanese bombers within range of Malaya and the Indies, and brought the American oil embargo and asset freeze that made war all but certain.'
  },
  {
    id: 'bangkok', en: 'Bangkok', orig: 'กรุงเทพฯ (Krung Thep)',
    date: 'Alliance signed 21 December 1941', cat: 'city', lvl: 2, lat: 13.75, lon: 100.5,
    wiki: 'https://en.wikipedia.org/wiki/Bangkok', year: 1782,
    note: 'Capital of the one uncolonised state in the region. Phibun’s government granted passage within hours of the invasion and allied with Japan a fortnight later.'
  },
  {
    id: 'singapore', en: 'Shōnantō (Singapore)', ja: '昭南島 (Shōnantō)', orig: 'Singapura',
    zh: '新加坡', date: 'Surrendered 15 February 1942', cat: 'city', lvl: 1, both: true, lat: 1.29,
    lon: 103.85, wiki: 'https://en.wikipedia.org/wiki/Japanese_occupation_of_Singapore',
    year: 1819,
    note: 'Britain’s great naval base, whose guns are often wrongly said to have pointed only out to sea; the real failures were air cover and the loss of the Prince of Wales and Repulse. 80,000 troops went into captivity.'
  },
  {
    id: 'kotabharu', en: 'Kota Bharu', orig: 'Kota Bharu', date: '8 December 1941',
    cat: 'battle', lvl: 3, lat: 6.13, lon: 102.24,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Kota_Bharu', year: 1941,
    note: 'The landing in northern Malaya began roughly an hour before the first bombs fell on Pearl Harbor — on the other side of the date line, so the calendars disagree.'
  },
  {
    id: 'manila', en: 'Manila', ja: 'マニラ (Manira)', orig: 'Maynila', zh: '馬尼拉',
    date: 'Occupied 2 January 1942', cat: 'city', lvl: 2, lat: 14.6, lon: 120.98,
    wiki: 'https://en.wikipedia.org/wiki/Manila', year: 1898,
    note: 'Declared an open city and occupied without a fight; devastated three years later during its recapture, when perhaps 100,000 civilians died.'
  },
  {
    id: 'corregidor', en: 'Bataan & Corregidor', ja: 'バターン・コレヒドール (Batān Korehidōru)',
    orig: 'Bataan / Corregidor', zh: '巴丹・科雷希多', date: 'April – 6 May 1942', cat: 'battle',
    lvl: 3, both: true, lat: 14.38, lon: 120.57,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Corregidor', year: 1942,
    note: 'Bataan surrendered on 9 April 1942 and the death march followed, in which thousands died; Corregidor held out in its tunnels until 6 May.'
  },
  {
    id: 'leyte', en: 'Leyte Gulf', ja: 'レイテ沖海戦 (Reite-oki kaisen)', orig: 'Golpo ng Leyte',
    zh: '雷伊泰灣', date: '23–26 October 1944', cat: 'battle', lvl: 2, both: true, lat: 10.8,
    lon: 125.4, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Leyte_Gulf', year: 1944,
    note: 'Four separate actions over three days in October 1944, and by most measures the largest naval battle ever fought. It destroyed the Imperial Navy as a fighting force and saw the first organised kamikaze attacks.'
  },
  {
    id: 'rangoon', en: 'Rangoon (Yangon)', ja: 'ラングーン (Rangūn)', orig: 'ရန်ကုန် (Yangon)',
    zh: '仰光', date: 'Fell 8 March 1942', cat: 'city', lvl: 2, lat: 16.87, lon: 96.2,
    wiki: 'https://en.wikipedia.org/wiki/Yangon', year: 1852,
    note: 'Capital of British Burma and the port at the head of the Burma Road; its loss cut China’s last land supply line.'
  },
  {
    id: 'imphal', en: 'Imphal & Kohima', ja: 'インパール作戦 (Inpāru sakusen)',
    orig: 'Imphal / Kohima', zh: '英帕爾', date: 'March – July 1944', cat: 'battle', lvl: 2,
    lat: 24.82, lon: 93.94, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Imphal', year: 1944,
    note: 'The attempt to invade India, fought alongside Bose’s Indian National Army and launched without adequate supply. Some 55,000 Japanese casualties, most from starvation and disease — the worst defeat in Japanese military history to that point.'
  },
  {
    id: 'batavia', en: 'Batavia (Jakarta)', ja: 'ジャカルタ (Jakaruta)', orig: 'Batavia / Jakarta',
    zh: '巴達維亞', date: 'Dutch surrender, 8 March 1942', cat: 'city', lvl: 2, lat: -6.21,
    lon: 106.85, wiki: 'https://en.wikipedia.org/wiki/Manggarai_railway_station', year: 1619,
    note: 'Capital of the Netherlands East Indies for three centuries. Sukarno and Hatta chose to work with the occupation, and declared independence two days after the surrender in 1945.'
  },
  {
    id: 'surabaya', en: 'Surabaya', ja: 'スラバヤ (Surabaya)', orig: 'Surabaya',
    date: 'Battle of the Java Sea, 27 February 1942', cat: 'city', lvl: 3, lat: -7.25,
    lon: 112.75, wiki: 'https://en.wikipedia.org/wiki/Surabaya', year: 1942,
    note: 'The main Dutch naval base. The Allied squadron that sailed from here was annihilated, opening Java to invasion.'
  },
  {
    id: 'pearlharbor', en: 'Pearl Harbor', ja: '真珠湾攻撃 (Shinjuwan kōgeki)', orig: 'Puʻuloa',
    zh: '珍珠港', date: '7 December 1941 (8 December in Japan)', cat: 'battle', lvl: 1, both: true,
    lat: 21.35, lon: -157.95, wiki: 'https://en.wikipedia.org/wiki/Attack_on_Pearl_Harbor',
    year: 1941,
    note: 'Six carriers, two waves, two hours. Eight battleships hit and over 2,400 killed — but the American carriers were at sea and the fuel tanks and dockyards were left intact.'
  },
  {
    id: 'coralsea', en: 'Coral Sea', ja: '珊瑚海海戦 (Sangokai kaisen)', zh: '珊瑚海海戰',
    date: '4–8 May 1942', cat: 'battle', lvl: 3, both: true, lat: -12.5, lon: 155.0,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_the_Coral_Sea', year: 1942,
    note: 'The first battle fought entirely by carrier aircraft, with the fleets never in sight of each other. It cost the Americans the Lexington and the Japanese the light carrier Shōhō; Shōkaku was bombed and Zuikaku’s air group destroyed, and both missed Midway a month later. Tactically a draw; strategically the first check on the Japanese advance, because the seaborne attempt on Port Moresby turned back and was never resumed.'
  },
  {
    id: 'midway', en: 'Midway', ja: 'ミッドウェー海戦 (Middowē kaisen)', orig: 'Pihemanu', zh: '中途島',
    date: '4–7 June 1942', cat: 'battle', lvl: 1, both: true, lat: 28.21, lon: -177.37,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Midway', year: 1942,
    note: 'All four Japanese fleet carriers fatally hit within a day, against one American. The offensive initiative in the Pacific never came back.'
  },
  {
    id: 'saipan', en: 'Saipan', ja: 'サイパン (Saipan)', orig: 'Saipan', zh: '塞班島',
    date: '15 June – 9 July 1944', cat: 'battle', lvl: 1, both: true, lat: 15.19, lon: 145.75,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Saipan', year: 1944,
    note: 'Its loss put Japan within B-29 range and brought down the Tōjō cabinet. Hundreds of Japanese civilians killed themselves at Marpi Point rather than surrender.'
  },
  {
    id: 'tinian', en: 'Tinian', ja: 'テニアン (Tenian)', orig: 'Tinian', zh: '天寧島',
    date: 'Taken July–August 1944', cat: 'battle', lvl: 3, lat: 15, lon: 145.62,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Tinian', year: 1944,
    note: 'Taken between 24 July and 1 August 1944 in a landing often called the best-executed of the Pacific war. Its airfields were the busiest in the world by 1945, and both atomic missions flew from them.'
  },
  {
    id: 'truk', en: 'Truk (Chuuk)', ja: 'トラック島 (Torakku-tō)', orig: 'Chuuk', zh: '特魯克',
    date: 'Operation Hailstone, 17–18 February 1944', cat: 'battle', lvl: 3, lat: 7.42,
    lon: 151.78, wiki: 'https://en.wikipedia.org/wiki/Operation_Hailstone', year: 1944,
    note: 'The Combined Fleet’s central Pacific anchorage — "the Gibraltar of the Pacific" — wrecked by carrier raids and then bypassed and left to rot.'
  },
  {
    id: 'peleliu', en: 'Peleliu (Beliliou)', ja: 'ペリリュー (Peririyū)', orig: 'Beliliou',
    zh: '貝里琉', date: 'September – November 1944', cat: 'battle', lvl: 3, lat: 7, lon: 134.25,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Peleliu', year: 1944,
    note: 'Expected to take four days and took over two months. It introduced the deep cave defence that would be used again on Iwo Jima and Okinawa.'
  },
  {
    id: 'wake', en: 'Wake Island', ja: '大鳥島 (Ōtorishima)', orig: 'Wake Island', zh: '威克島',
    date: 'Fell 23 December 1941', cat: 'battle', lvl: 2, lat: 19.28, lon: 166.65,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Wake_Island', year: 1941,
    note: 'A small Marine garrison beat off the first landing on 11 December 1941 and surrendered to the second on the 23rd. Ninety-eight captured civilian workers were murdered on the island in October 1943.'
  },
  {
    id: 'kwajalein', en: 'Kwajalein', ja: 'クェゼリン (Kuezerin)', orig: 'Kuwajleen', zh: '瓜加林',
    date: 'January – February 1944', cat: 'battle', lvl: 3, lat: 9.19, lon: 167.47,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Kwajalein', year: 1944,
    note: 'Taken between 31 January and 3 February 1944, with Majuro, in the first assault on territory Japan had held since before the war.'
  },
  {
    id: 'tarawa', en: 'Tarawa', ja: 'タラワ (Tarawa)', orig: 'Tarawa', zh: '塔拉瓦',
    date: '20–23 November 1943', cat: 'battle', lvl: 3, lat: 1.33, lon: 172.98,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Tarawa', year: 1943,
    note: 'Seventy-six hours, over a thousand American dead on a coral islet of barely more than a square kilometre, and almost the whole garrison killed. The cost changed how the rest of the island campaign was planned.'
  },
  {
    id: 'rabaul', en: 'Rabaul', ja: 'ラバウル (Rabauru)', orig: 'Rabaul', zh: '拉包爾',
    date: 'Captured January 1942', cat: 'city', lvl: 2, lat: -4.2, lon: 152.16, year: 1942,
    note: 'Built into the great forward base of the South Pacific, with five airfields and over 100,000 troops. Bypassed from 1944 and left isolated until the surrender.'
  },
  {
    id: 'guadalcanal', en: 'Guadalcanal', ja: 'ガダルカナル (Gadarukanaru)', orig: 'Guadalcanal',
    zh: '瓜達爾卡納爾', date: 'August 1942 – February 1943', cat: 'battle', lvl: 2, both: true,
    lat: -9.58, lon: 160.15, wiki: 'https://en.wikipedia.org/wiki/Guadalcanal_campaign',
    year: 1942,
    note: 'A half-built airfield became the first sustained Allied offensive of the Pacific War. Six months of attrition on land, sea and air that Japan could not afford; the withdrawal marked the turn of the tide.'
  },
  {
    id: 'portmoresby', en: 'Port Moresby', ja: 'ポートモレスビー (Pōto Moresubī)', orig: 'Port Moresby',
    zh: '莫爾茲比港', date: 'Coral Sea May 1942; Kokoda July–November 1942', cat: 'battle', lvl: 3,
    lat: -9.44, lon: 147.18, wiki: 'https://en.wikipedia.org/wiki/Kokoda_Track_campaign',
    year: 1942,
    note: 'The objective Japan never reached. The seaborne attempt was turned back at the Coral Sea and the overland push failed on the Kokoda Track, within sight of its goal.'
  },
  {
    id: 'darwin', en: 'Darwin', ja: 'ダーウィン (Dāwin)', orig: 'Darwin', zh: '達爾文',
    date: '19 February 1942', cat: 'battle', lvl: 3, lat: -12.46, lon: 130.84,
    wiki: 'https://en.wikipedia.org/wiki/Bombing_of_Darwin', year: 1942,
    note: 'More bombs fell on Darwin than on Pearl Harbor, delivered by many of the same aircrew. Raids on northern Australia continued into 1943.'
  },
  {
    id: 'attu', en: 'Attu', ja: 'アッツ島 (Attsu-tō)', orig: 'Atan', zh: '阿圖島',
    date: 'Occupied June 1942, retaken May 1943', cat: 'battle', lvl: 3, lat: 52.88,
    lon: 173.18, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Attu', year: 1942,
    note: 'Of some 2,600 defenders, fewer than 30 were taken alive. Tokyo called the annihilation gyokusai — "shattering the jewel" — and made it a model.'
  },
  {
    id: 'kiska', en: 'Kiska', ja: 'キスカ島 (Kisuka-tō)', orig: 'Qisxa', zh: '基斯卡島',
    date: 'Occupied June 1942, evacuated July 1943', cat: 'battle', lvl: 3, lat: 51.97,
    lon: 177.53, wiki: 'https://en.wikipedia.org/wiki/Operation_Cottage', year: 1942,
    note: 'The garrison was lifted off under cover of fog before the Allied landing, which went ashore against an empty island and still took casualties from friendly fire.'
  },
  {
    id: 'pingxingguan', en: 'Píngxíngguān (Pinghsingkuan)', ja: '平型関 (Heikeikan)', zh: '平型關',
    date: '25 September 1937', cat: 'battle', lvl: 3, lat: 39.36, lon: 113.93,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Pingxingguan', year: 1937,
    note: 'A pass in the Wutai mountains where Lin Biao\'s division ambushed a Japanese supply column on 25 September 1937 — a small action, and the Eighth Route Army\'s first, which the party made a great deal of afterwards.'
  },
  {
    id: 'taierzhuang', en: 'Tái’érzhuāng (Taierhchuang)', ja: '台児荘 (Taijisō)', zh: '台兒莊',
    date: 'March – April 1938', cat: 'battle', lvl: 3, lat: 34.56, lon: 117.73,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Taierzhuang', year: 1938,
    note: 'The first clear Chinese victory of the war. Li Zongren let two Japanese divisions push into the town and closed on them from both flanks, and they broke and ran in early April 1938. It did not save Xuzhou, which fell six weeks later, but it ended the belief that the army could not win.'
  },
  {
    id: 'huangqiao', en: 'Huángqiáo (Hwangchiao)', ja: '黄橋 (Kōkyō)', zh: '黃橋',
    date: 'October 1940', cat: 'battle', lvl: 3, lat: 32.27, lon: 120.24,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Rugao%E2%80%93Huangqiao', year: 1940,
    note: 'Nationalist and Communist forces fought each other here in October 1940, north of the Yangtze, while the war with Japan went on around them. The New Fourth Army won, and Chiang Kai-shek\'s answer three months later was the New Fourth Army Incident.'
  },
  {
    id: 'musha', en: 'Musha (Wushe)', ja: '霧社事件 (Musha jiken)', zh: '霧社',
    date: '27 October 1930', cat: 'battle', lvl: 2, lat: 24.02, lon: 121.14,
    wiki: 'https://en.wikipedia.org/wiki/Musha_Incident', year: 1930,
    note: 'Seediq villagers attacked the Japanese at a school sports day on 27 October 1930 and killed 134. The suppression took two months, mountain artillery and aircraft dropping gas; about half the Seediq of the district were dead by the end, and the survivors were moved off their land.'
  },
  {
    id: 'huanggutun', en: 'Huánggūtún (Huangkutun)',
    ja: '張作霖爆殺事件 (Chō Sakurin bakusatsu jiken)', zh: '皇姑屯', date: '4 June 1928', cat: 'battle',
    lvl: 2, lat: 41.83, lon: 123.35, wiki: 'https://en.wikipedia.org/wiki/Huanggutun_incident',
    year: 1928,
    note: 'Kwantung Army officers blew up Zhang Zuolin\'s train where the South Manchuria Railway crosses the Peking line, on 4 June 1928. Tokyo disowned it and the plotters went unpunished, which is most of why 1931 happened the way it did.'
  },
  {
    id: 'dandi', en: 'Dandi', ja: 'ダンディ (Dandi)', orig: 'દાંડી', date: '6 April 1930',
    cat: 'battle', lvl: 2, lat: 20.92, lon: 72.71,
    wiki: 'https://en.wikipedia.org/wiki/Salt_March', year: 1930,
    note: 'Gandhi reached the sea here on 6 April 1930 after walking 240 miles from Ahmedabad, and made salt in defiance of the government monopoly. Some sixty thousand people were imprisoned in the civil disobedience that followed.'
  },
  {
    id: 'yenbai', en: 'Yên Bái', ja: 'イエンバイ (Ienbai)', orig: 'Yên Bái', zh: '安沛',
    date: '10 February 1930', cat: 'battle', lvl: 3, lat: 21.7, lon: 104.87,
    wiki: 'https://en.wikipedia.org/wiki/Y%C3%AAn_B%C3%A1i_mutiny', year: 1930,
    note: 'Vietnamese soldiers of the garrison mutinied on 10 February 1930 and killed their French officers. The rising was put down in a day, the VNQDD leadership was guillotined, and the initiative in Vietnamese nationalism passed to the communists.'
  },
  {
    id: 'chittagongraid', en: 'Chittagong', ja: 'チッタゴン (Chittagon)', orig: 'চট্টগ্রাম',
    date: '18 April 1930', cat: 'battle', lvl: 3, lat: 22.36, lon: 91.78,
    wiki: 'https://en.wikipedia.org/wiki/Chittagong_armoury_raid', year: 1930,
    note: 'Revolutionaries under Surya Sen took the two armouries here on 18 April 1930 and held the hills outside the town for four days — armed nationalism beside the civil disobedience of the same spring.'
  },
  {
    id: 'cheamri', en: 'Cheam-ri', ja: '堤岩里 (Teiganri)', zh: '堤岩里', ko: '제암리 (Cheam-ri)',
    date: '15 April 1919', cat: 'battle', lvl: 2, lat: 37.13, lon: 126.86,
    wiki: 'https://en.wikipedia.org/wiki/Jeamni_massacre', year: 1919,
    note: 'On 15 April 1919, after the March First Movement, troops locked some thirty villagers into the church here and burned it. It is the single episode that fixed the movement\'s suppression in Korean memory.'
  },
  {
    id: 'uozu', en: 'Uozu', ja: '魚津 (Uozu)', zh: '魚津', date: '23 July 1918', cat: 'battle',
    lvl: 3, lat: 36.83, lon: 137.4, wiki: 'https://en.wikipedia.org/wiki/Rice_riots_of_1918',
    year: 1918,
    note: 'Fishermen\'s wives blocked the loading of rice here on 23 July 1918 in protest at the price. The riots spread to most of the country within six weeks and brought down the Terauchi cabinet.'
  },
  {
    id: 'amritsar', en: 'Amritsar', ja: 'アムリットサル (Amurittosaru)', orig: 'ਅੰਮ੍ਰਿਤਸਰ',
    date: '13 April 1919', cat: 'battle', lvl: 2, lat: 31.62, lon: 74.88,
    wiki: 'https://en.wikipedia.org/wiki/Jallianwala_Bagh_massacre', year: 1919,
    note: 'Troops fired on a penned crowd at Jallianwala Bagh on 13 April 1919, killing several hundred. More than anything else it turned a generation of Indians against British rule.'
  },
  {
    id: 'kwangjustudent', en: 'Kōshū (Kwangju)', ja: '光州学生事件 (Kōshū gakusei jiken)', zh: '光州',
    ko: '광주 (Kwangju)', date: 'November 1929', cat: 'battle', lvl: 3, lat: 35.15, lon: 126.92,
    wiki: 'https://en.wikipedia.org/wiki/Gwangju_Student_Independence_Movement', year: 1929,
    note: 'A quarrel on the Naju train in November 1929 between Japanese and Korean students spread into the largest colonial-era protest after 1919, reaching some two hundred schools and lasting into the spring.'
  },
  {
    id: 'tapani', en: 'Tapani (Yujing)', ja: '噍吧哖事件 (Shahanē jiken)', zh: '噍吧哖', date: '1915',
    cat: 'battle', lvl: 3, lat: 23.13, lon: 120.46,
    wiki: 'https://en.wikipedia.org/wiki/Tapani_incident', year: 1915,
    note: 'The Xilai\'an rising of 1915, the last and largest armed revolt by Han Taiwanese against Japanese rule. Over eight hundred death sentences followed, most later commuted after the scale of it became known in Tokyo.'
  },
  {
    id: 'huayuankou', en: 'Huāyuánkǒu (Huayuankow)', ja: '花園口 (Kaenkō)', zh: '花園口',
    date: '9 June 1938', cat: 'battle', lvl: 2, both: true, lat: 34.92, lon: 113.69,
    wiki: 'https://en.wikipedia.org/wiki/1938_Yellow_River_flood', year: 1938,
    note: 'Nationalist troops, on Chiang Kai-shek\'s orders, blew the Yellow River dikes here on 9 June 1938 to stop the Japanese advance on Wuhan. The villages downstream were given no warning. The river left its bed for nine years, drowned several thousand villages, killed somewhere between 400,000 and 800,000 people, and left the country behind it open to the famine of 1942–43.'
  },
  {
    id: 'changkufeng', en: 'Zhānggǔfēng (Changkufeng) / Lake Khasan',
    ja: '張鼓峰事件 (Chōkohō jiken)', orig: 'озеро Хасан', zh: '張鼓峰', date: 'July – August 1938',
    cat: 'battle', lvl: 3, lat: 42.44, lon: 130.66,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Lake_Khasan', year: 1938,
    note: 'Soviet and Japanese forces fought for a fortnight in July and August 1938 over a hill where Manchukuo, Korea and the Soviet Maritime Province meet. Japan came off worse, and did it again at Nomonhan the following summer.'
  },
  {
    id: 'bunagona', en: 'Buna–Gona', ja: 'ブナ・ゴナ (Buna-Gona)', orig: 'Buna / Gona', zh: '布納・戈納',
    date: 'November 1942 – January 1943', cat: 'battle', lvl: 2, lat: -8.65, lon: 148.38,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Buna%E2%80%93Gona', year: 1942,
    note: 'The fighting in progress at this map\'s date. The Japanese beachhead on the north Papuan coast was reduced between November 1942 and January 1943, at a cost proportionally heavier than Guadalcanal\'s.'
  },
  {
    id: 'milnebay', en: 'Milne Bay', ja: 'ミルン湾 (Mirun-wan)', orig: 'Milne Bay', zh: '米爾恩灣',
    date: '25 August – 7 September 1942', cat: 'battle', lvl: 3, lat: -10.31, lon: 150.47,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Milne_Bay', year: 1942,
    note: 'Australian and American troops threw back a Japanese landing between 25 August and 7 September 1942 — the first amphibious assault of the war to be defeated outright, and the eastern limit of the advance.'
  },
  {
    id: 'midnapore', en: 'Midnapore (Medinipur)', ja: 'ミドナポール (Midonapōru)', orig: 'মেদিনীপুর',
    date: '1942–43', cat: 'battle', lvl: 2, lat: 22.43, lon: 87.32,
    wiki: 'https://en.wikipedia.org/wiki/Bengal_famine_of_1943', year: 1942,
    note: 'The district hit hardest by the requisition of boats and rice in 1942, and the centre of the Bengal famine that followed: some three million people died in the province while the war economy in Calcutta was fed.'
  },
  {
    id: 'pingdingshan', en: 'Píngdǐngshān (Pingtingshan)', ja: '平頂山事件 (Heichōzan jiken)',
    zh: '平頂山', date: '16 September 1932', cat: 'battle', lvl: 3, lat: 41.88, lon: 123.88,
    wiki: 'https://en.wikipedia.org/wiki/Pingdingshan_massacre', year: 1932,
    note: 'Japanese troops killed the inhabitants of this mining village near Fushun on 16 September 1932, a year to the day after the Mukden Incident, in reprisal for a guerrilla raid. Some three thousand died.'
  },
  {
    id: 'pochonbo', en: 'Poch’ŏnbo', ja: '普天堡 (Futenpo)', zh: '普天堡', ko: '보천보 (Poch’ŏnbo)',
    date: '4 June 1937', cat: 'battle', lvl: 3, lat: 41.4, lon: 128.29,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Pochonbo', year: 1937,
    note: 'Korean and Chinese partisans crossed the Yalu and raided the police post and county offices here on 4 June 1937 — the largest action of the border guerrilla war, and the founding episode of the North Korean state\'s account of itself.'
  },
  {
    id: 'savo', en: 'Savo Island', ja: 'サボ島沖海戦 (Sabo-tō oki kaisen)', orig: 'Savo', zh: '薩沃島',
    date: '9 August 1942', cat: 'battle', lvl: 3, lat: -9.13, lon: 159.85,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Savo_Island', year: 1942,
    note: 'Japanese cruisers surprised the Allied screen off Guadalcanal on the night of 9 August 1942 and sank four heavy cruisers in half an hour, the worst surface defeat in United States naval history.'
  },
  {
    id: 'okunoshima', en: 'Ōkunoshima', ja: '大久野島 (Ōkunoshima)', zh: '大久野島', ko: '오쿠노시마섬',
    date: 'Army gas plant from 1929', cat: 'city', lvl: 3, lat: 34.31, lon: 133.0,
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Ckunoshima', year: 1929,
    note: 'The army\'s poison gas plant from 1929, making mustard and lewisite for use in China. The island was taken off published maps while it worked, and the labourers were not told what they were handling.'
  },
  {
    id: 'supung', en: 'Suihō (Sup’ung) Dam', ja: '水豊ダム (Suihō damu)', zh: '水豐',
    ko: '수풍 (Sup’ung)', date: 'Generating from 1941', cat: 'city', lvl: 3, lat: 40.46,
    lon: 124.96, year: 1941,
    note: 'Finished on the Yalu in 1941 and the largest dam in Asia, built with conscript labour and the clearance of whole villages. Its power ran the chemical works at Hŭngnam and much of Manchurian industry.'
  },
  {
    id: 'ruijin', en: 'Ruìjīn (Juichin)', ja: '瑞金 (Zuikin)', zh: '瑞金',
    date: 'Soviet capital 1931–34', cat: 'city', lvl: 3, lat: 25.89, lon: 116.03, year: 1931,
    note: 'Capital of the Chinese Soviet Republic from November 1931 until the fifth encirclement campaign forced the party out in October 1934 and the Long March began.'
  },
  {
    id: 'consan', en: 'Côn Sơn (Poulo Condore)', ja: 'コンソン島 (Konson-tō)', orig: 'Côn Sơn',
    zh: '崑崙島', date: 'Penal island from 1862', cat: 'city', lvl: 3, lat: 8.69, lon: 106.61,
    wiki: 'https://en.wikipedia.org/wiki/C%C3%B4n_S%C6%A1n_Island', year: 1862,
    note: 'The French penal islands, in use from 1862. Most of the leadership of the Vietnamese communist party passed through them, which is how a prison became a political school.'
  },
  {
    id: 'bovendigoel', en: 'Boven Digoel', ja: 'ボーフェン・ディグル (Bōfen Diguru)',
    orig: 'Boven Digoel', date: 'Internment camp from 1927', cat: 'city', lvl: 3, lat: -6.1,
    lon: 140.3, wiki: 'https://en.wikipedia.org/wiki/Boven_Digoel_Regency', year: 1927,
    note: 'The camp the Dutch built in 1927 in the New Guinea swamps for the leaders of the nationalist and communist movements, Hatta and Sjahrir among them. Malaria did the work that a sentence did not have to.'
  },
  {
    id: 'ashio', en: 'Ashio', ja: '足尾 (Ashio)', zh: '足尾', ko: '아시오정',
    date: 'Copper, and the pollution case', cat: 'city', lvl: 3, lat: 36.65, lon: 139.45,
    wiki: 'https://en.wikipedia.org/wiki/Ashio,_Tochigi', year: 1890,
    note: 'Furukawa\'s copper mine, and the pollution that poisoned the Watarase valley below it. Tanaka Shōzō\'s campaign on behalf of the ruined villages was the first environmental protest in Japan, and the state answered it by drowning one of them under a reservoir.'
  },
  {
    id: 'taiwanexped', en: 'The Taiwan Expedition', ja: '台湾出兵 (Taiwan shuppei)', zh: '牡丹社事件',
    date: 'May – December 1874', cat: 'battle', lvl: 3, both: true, lat: 22.05, lon: 120.75,
    wiki: 'https://en.wikipedia.org/wiki/1874_Japanese_expedition_to_Taiwan', year: 1874,
    note: 'Japan\'s first overseas expedition, sent in 1874 against the Paiwan of southern Taiwan after shipwrecked Ryūkyūan sailors were killed. More soldiers died of disease than of fighting, but China paid an indemnity, and in doing so conceded that the Ryūkyūs were Japan\'s.'
  },
  {
    id: 'pyongyangbattle', en: 'Battle of Pyongyang', ja: '平壌の戦い (Heijō no tatakai)',
    zh: '平壤戰役', ko: '평양 전투 (P’yŏngyang chŏnt’u)', date: '15 September 1894', cat: 'battle',
    lvl: 2, both: true, lat: 39.02, lon: 125.75,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Pyongyang_(1894)', year: 1894,
    note: 'The Japanese army took the city on 15 September 1894 and the Qing forces broke northward — the land battle that decided the first Sino-Japanese War before the fleets met at the Yalu two days later.'
  },
  {
    id: 'portarthursiege', en: 'Siege of Lǚshùn (Port Arthur)', ja: '旅順攻囲戦 (Ryojun kōisen)',
    zh: '旅順圍城戰', date: 'August 1904 – 2 January 1905', cat: 'battle', lvl: 2, both: true,
    lat: 38.82, lon: 121.22, wiki: 'https://en.wikipedia.org/wiki/Siege_of_Port_Arthur',
    year: 1904,
    note: 'Five months, eleven-inch howitzers firing on the harbour, and something like sixty thousand Japanese casualties for a fortress that surrendered on 2 January 1905. The scale of the losses set the pattern the next war would follow.'
  },
  {
    id: 'itoharbin', en: 'Assassination of Itō Hirobumi', ja: '伊藤博文暗殺 (Itō Hirobumi ansatsu)',
    zh: '伊藤博文遇刺', ko: '이토 히로부미 저격 (Itʻo Hirobumi chŏgyŏk)', date: '26 October 1909',
    cat: 'battle', lvl: 2, both: true, lat: 45.77, lon: 126.63,
    wiki: 'https://en.wikipedia.org/wiki/An_Jung-geun', year: 1909,
    note: 'An Chunggŭn shot Itō Hirobumi on the platform at Harbin on 26 October 1909. Itō had been Korea\'s resident-general and, latterly, a brake on outright annexation; Korea was annexed within the year.'
  },
  {
    id: 'tsingtaosiege', en: 'Siege of Qīngdǎo (Tsingtao)', ja: '青島の戦い (Chintao no tatakai)',
    zh: '青島戰役', date: '27 August – 7 November 1914', cat: 'battle', lvl: 3, lat: 36.07,
    lon: 120.38, wiki: 'https://en.wikipedia.org/wiki/Siege_of_Tsingtao', year: 1914,
    note: 'Japan and a small British contingent took the German leasehold between August and November 1914 — Japan\'s whole war in Europe\'s war, and the beginning of the Shandong question that produced May Fourth.'
  },
  {
    id: 'siberia', en: 'The Siberian Intervention', ja: 'シベリア出兵 (Shiberia shuppei)',
    orig: 'Сибирская интервенция', zh: '西伯利亞干涉', date: 'From August 1918', cat: 'battle',
    lvl: 3, lat: 43.12, lon: 131.89,
    wiki: 'https://en.wikipedia.org/wiki/Siberian_intervention', year: 1918,
    note: 'Japan landed at Vladivostok in August 1918 with the other Allies and stayed after they left, holding the Maritime Province with some 70,000 troops until 1922 and northern Sakhalin until 1925. It came home with nothing.'
  },
  {
    id: 'marchfirst', en: 'The March First Movement', ja: '三・一運動 (San-ichi undō)', zh: '三一運動',
    ko: '삼일운동 (Samil undong)', date: 'From 1 March 1919', cat: 'battle', lvl: 1, both: true,
    lat: 37.571, lon: 126.988, wiki: 'https://en.wikipedia.org/wiki/March_First_Movement',
    year: 1919,
    note: 'Thirty-three signatories read a declaration of independence in Seoul on 1 March 1919 and the demonstrations spread to every province: perhaps two million people took part over the following months. The suppression killed some seven thousand, and the colonial government swapped military rule for what it called cultural rule.'
  },
  {
    id: 'mayfourth', en: 'The May Fourth Movement', ja: '五・四運動 (Go-shi undō)', zh: '五四運動',
    date: '4 May 1919', cat: 'battle', lvl: 1, both: true, lat: 39.9, lon: 116.39,
    wiki: 'https://en.wikipedia.org/wiki/May_Fourth_Movement', year: 1919,
    note: 'Students marched in Beijing on 4 May 1919 when Versailles handed Germany\'s Shandong holdings to Japan rather than back to China. The strikes and boycotts that followed are where modern Chinese nationalism is usually dated from.'
  },
  {
    id: 'pongodong', en: 'Fengwudong (Pongodong)', ja: '鳳梧洞の戦い (Hōgodō no tatakai)', zh: '鳳梧洞',
    ko: '봉오동 (Pongodong)', date: 'June 1920', cat: 'battle', lvl: 3, lat: 42.47, lon: 129.76,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Fengwudong', year: 1920,
    note: 'Korean independence units under Hong Beom-do beat a Japanese pursuit column in the Manchurian border hills in June 1920 — the first victory of the armed resistance.'
  },
  {
    id: 'chongsanri', en: 'Qingshanli (Chŏngsan-ri)', ja: '青山里の戦い (Seizanri no tatakai)',
    zh: '青山里', ko: '청산리 (Chŏngsan-ri)', date: 'October 1920', cat: 'battle', lvl: 3, lat: 42.6,
    lon: 128.8, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Qingshanli', year: 1920,
    note: 'Kim Chwa-chin\'s and Hong Beom-do\'s units fought a Japanese division over six days in October 1920 and got away. The reprisal fell on the Korean villages of Jiandao instead, and thousands were killed.'
  },
  {
    id: 'kantoquake', en: 'The Great Kantō Earthquake', ja: '関東大震災 (Kantō daishinsai)',
    zh: '關東大地震', date: '1 September 1923', cat: 'battle', lvl: 1, both: true, lat: 35.4,
    lon: 139.5, wiki: 'https://en.wikipedia.org/wiki/Great_Kant%C5%8D_Earthquake', year: 1923,
    note: 'The earthquake of 1 September 1923 and the fires after it killed about 105,000 people in Tokyo and Yokohama. In the days that followed, rumour and vigilante bands — with police and soldiers among them — killed several thousand Koreans.'
  },
  {
    id: 'erlin', en: 'Èrlín (Erhlin)', ja: '二林事件 (Nirin jiken)', zh: '二林', date: 'October 1925',
    cat: 'battle', lvl: 3, lat: 23.9, lon: 120.38, year: 1925,
    note: 'Cane farmers at Erlin refused the price the Lin Pen-yuan sugar company set in October 1925 and were arrested in their hundreds. It is where the Taiwanese peasant union movement began.'
  },
  {
    id: 'wonsanstrike', en: 'The Wonsan general strike', ja: '元山ゼネスト (Genzan zenesuto)',
    zh: '元山總罷工', ko: '원산 총파업 (Wŏnsan ch’ongp’aŏp)', date: 'January – April 1929', cat: 'battle',
    lvl: 3, lat: 39.15, lon: 127.44, year: 1929,
    note: 'Four months of strike through the winter of 1929, some 2,200 workers out and the port at a standstill — the largest labour action of the colonial period in Korea, and it lost.'
  },
  {
    id: 'liutiaohu', en: 'The Mukden Incident', ja: '柳条湖事件 (Ryūjōko jiken)', zh: '柳條湖事件',
    ko: '만주사변', date: '18 September 1931', cat: 'battle', lvl: 1, both: true, lat: 41.85,
    lon: 123.47, wiki: 'https://en.wikipedia.org/wiki/Mukden_incident', year: 1931,
    note: 'Kwantung Army officers set a small charge on the South Manchuria Railway just north of Mukden on the night of 18 September 1931, blamed Chinese troops, and used it to occupy the city by morning. The damage was slight enough that a train passed over the line minutes later.'
  },
  {
    id: 'shanghaibattle', en: 'Battle of Shànghǎi', ja: '第二次上海事変 (Dainiji Shanhai jihen)',
    zh: '淞滬會戰', date: '13 August – 26 November 1937', cat: 'battle', lvl: 1, both: true,
    lat: 31.23, lon: 121.47, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Shanghai',
    year: 1937,
    note: 'Three months of street and river fighting from 13 August 1937, and the first time Chiang Kai-shek committed his German-trained divisions. They were destroyed in it, and the road to Nanjing was open.'
  },
  {
    id: 'nanjingmassacre', en: 'The Nanjing Massacre', ja: '南京事件 (Nankin jiken)', zh: '南京大屠殺',
    date: 'December 1937 – February 1938', cat: 'battle', lvl: 1, both: true, lat: 32.06,
    lon: 118.8, wiki: 'https://en.wikipedia.org/wiki/Nanjing_Massacre', year: 1937,
    note: 'Japanese troops entered the capital on 13 December 1937 and the killing and rape went on for weeks. Estimates of the dead run from the tens of thousands to 300,000, depending on the period and the boundary taken.'
  },
  {
    id: 'changshafire', en: 'The Changsha fire', ja: '長沙大火 (Chōsa taika)', zh: '文夕大火',
    date: '13 November 1938', cat: 'battle', lvl: 3, lat: 28.23, lon: 112.94,
    wiki: 'https://en.wikipedia.org/wiki/1938_Changsha_fire', year: 1938,
    note: 'The garrison burned the city on 13 November 1938 on a false report that the Japanese were at the gates. They were still a hundred miles away. Some twenty thousand people died and most of Changsha was lost, in what remains one of the worst self-inflicted disasters of the war.'
  },
  {
    id: 'chongqingraids', en: 'The bombing of Chóngqìng', ja: '重慶爆撃 (Jūkei bakugeki)',
    zh: '重慶大轟炸', date: '3–4 May 1939, and for five years after', cat: 'battle', lvl: 2,
    lat: 29.56, lon: 106.55, wiki: 'https://en.wikipedia.org/wiki/Bombing_of_Chongqing',
    year: 1939,
    note: 'The raids of 3 and 4 May 1939 killed several thousand people in the crowded riverside districts. The bombing of the wartime capital went on for five years — one of the first sustained air campaigns against a civilian population anywhere.'
  },
  {
    id: 'newfourtharmy', en: 'The New Fourth Army Incident', ja: '皖南事変 (Kannan jihen)',
    zh: '皖南事變', date: 'January 1941', cat: 'battle', lvl: 3, lat: 30.63, lon: 118.42,
    wiki: 'https://en.wikipedia.org/wiki/New_Fourth_Army_Incident', year: 1941,
    note: 'Nationalist troops surrounded the New Fourth Army\'s headquarters column in southern Anhui in January 1941 and destroyed it. The united front survived on paper and not in fact, and both sides spent the rest of the war watching each other.'
  },
  {
    id: 'henanfamine', en: 'The Hénán famine', ja: '河南大飢饉 (Kanan daikikin)', zh: '河南大饑荒',
    date: '1942–43', cat: 'battle', lvl: 2, lat: 33.9, lon: 113.8,
    wiki: 'https://en.wikipedia.org/wiki/Chinese_famine_of_1942%E2%80%931943', year: 1942,
    note: 'Drought, requisition and the ground left broken by the 1938 flood killed somewhere between two and three million people in Henan across 1942 and 1943, while grain was still being taken for the army.'
  },
  {
    id: 'hiroshimabomb', en: 'The Hiroshima bomb', ja: '広島原爆 (Hiroshima genbaku)', zh: '廣島原子彈',
    date: '6 August 1945', cat: 'battle', lvl: 1, both: true, lat: 34.39, lon: 132.46,
    wiki: 'https://en.wikipedia.org/wiki/Atomic_bombings_of_Hiroshima_and_Nagasaki', year: 1945,
    note: 'The first atomic bomb, dropped at 8.15 on the morning of 6 August 1945. Around 70,000 died at once and some 140,000 by the end of the year.'
  },
  {
    id: 'nagasakibomb', en: 'The Nagasaki bomb', ja: '長崎原爆 (Nagasaki genbaku)', zh: '長崎原子彈',
    date: '9 August 1945', cat: 'battle', lvl: 1, both: true, lat: 32.74, lon: 129.87,
    wiki: 'https://en.wikipedia.org/wiki/Atomic_bombings_of_Hiroshima_and_Nagasaki', year: 1945,
    note: 'The second, on 9 August 1945, aimed at the Mitsubishi yards and dropped through cloud over the Urakami valley. Around 40,000 died at once and some 70,000 by the end of the year.'
  },
];

JMAP.EPOCH_OVERRIDES = {
  hiroshima: { e1930: {
      date: 'Army headquarters from 1894',
      note: 'Base of the Fifth Division and the embarkation port for the continent. Imperial General Headquarters moved here during the war with China in 1894–95, and the emperor with it.'
    } },
  nagasaki: { e1930: {
      date: 'Dutch trade from 1641; treaty port 1859',
      note: 'The Dutch post at Dejima made this Japan’s only window on Europe under the Tokugawa. After 1859 a treaty port, and by 1930 a shipbuilding city dominated by the Mitsubishi yard.'
    } },
  naha: { e1930: {
      date: 'Okinawa Prefecture from 1879',
      note: 'Port of the Ryūkyū Kingdom. Japan abolished the kingdom in 1879, deposed its king and pensioned him off in Tokyo, and turned the islands into a prefecture.'
    } },
  nagoya: { e1930: {
      date: 'Castle town and industrial city',
      note: 'A Tokugawa castle town that became a centre of the textile trade and, later, of the aircraft industry.'
    } },
  mukden: { e1930: {
      date: 'Battle of Mukden, February–March 1905',
      note: 'The Manchu dynastic capital, and the prize of the largest land battle of the Russo-Japanese War. In 1930 it is the seat of Zhang Xueliang’s government, with the Japanese South Manchuria Railway running through it and the Kwantung Army guarding the line.'
    } },
  changchun: { e1930: {
      en: 'Chángchūn', ja: '長春 (Chōshun)', zh: '長春', date: 'Railway junction',
      note: 'Where the Russian Chinese Eastern Railway met the Japanese South Manchuria Railway — the seam between the two spheres in Manchuria. It would be rebuilt as Hsinking, capital of Manchukuo, after 1932.'
    } },
  beijing: { e1930: {
      en: 'Běipíng (Peiping)', zh: '北平 (Běipíng)', date: 'Renamed Peiping in 1928',
      note: 'The Qing capital until 1912 and the seat of the warlord governments after it; demoted to Peiping — "northern peace" — when the Nationalists moved the capital to Nanjing in 1928. Japanese troops had joined the eight-nation force that relieved the legations here in 1900.'
    } },
  nanjing: { e1930: {
      date: 'Nationalist capital from 1927',
      note: 'Capital of the Republic after the Northern Expedition, and the seat of Chiang Kai-shek’s government — such as its writ ran.'
    } },
  shanghai: { e1930: {
      date: 'Treaty port from 1843',
      note: 'The largest treaty port in China: an International Settlement run by its foreign ratepayers, a French Concession beside it, and the Chinese city around them. Japan had the largest foreign community in the city.'
    } },
  tianjin: { e1930: {
      date: 'Convention of 1885',
      note: 'The treaty port for Beijing, carved into nine foreign concessions at their greatest extent, a Japanese one among them. The Tianjin Convention of 1885 regulated Chinese and Japanese troops in Korea, and broke down in 1894.'
    } },
  guangzhou: { e1930: {
      date: 'Treaty port from 1842',
      note: 'The original treaty port and the cradle of the Nationalist revolution; the Northern Expedition set out from here in 1926.'
    } },
  wuhan: { e1930: {
      date: 'Treaty port from 1861',
      note: 'The tri-city on the middle Yangtze where the 1911 revolution began, and briefly the seat of the left Nationalist government in 1927.'
    } },
  chongqing: { e1930: {
      date: 'Treaty port from 1891',
      note: 'The head of steam navigation on the upper Yangtze, deep in the Sichuan interior and a fortnight from the coast.'
    } },
  xiamen: { e1930: {
      date: 'Treaty port from 1842',
      note: 'One of the first five treaty ports, and a main point of departure for Chinese emigration to Southeast Asia.'
    } },
  bangkok: { e1930: {
      date: 'Capital of Siam',
      note: 'Capital of the one state in the region never colonised; the Chakri kings had kept their independence by ceding territory to Britain and France in turn.'
    } },
  singapore: { e1930: {
      en: 'Singapore', ja: 'シンガポール (Shingapōru)', date: 'Naval base begun 1923',
      note: 'Capital of the Straits Settlements and the site of the great naval base begun in 1923, on which the whole of British strategy east of Suez depended.'
    } },
  hanoi: { e1930: {
      date: 'Capital of French Indochina from 1902',
      note: 'Seat of the Governor-General of Indochina, and of the colonial administration that ran Tonkin, Annam, Cochinchina, Cambodia and Laos together.'
    } },
  saigon: { e1930: {
      date: 'French from 1859',
      note: 'Capital of Cochinchina, the oldest French possession in Indochina, and the rice-exporting port of the Mekong delta.'
    } },
  rangoon: { e1930: {
      en: 'Rangoon', date: 'British from 1852',
      note: 'Capital of British Burma — still a province of British India in 1930 — and a great rice port with an Indian majority in its population.'
    } },
  manila: { e1930: {
      date: 'American from 1898',
      note: 'Capital of the American-ruled Philippines, taken from Spain in 1898 and promised eventual independence.'
    } },
  batavia: { e1930: {
      en: 'Batavia', ja: 'バタビア (Batabia)', orig: 'Batavia', date: 'Dutch from 1619',
      note: 'Capital of the Netherlands East Indies and seat of the Governor-General, built by the Dutch East India Company on the ruins of Jayakarta.'
    } },
};

JMAP.EXTENT_1942 = {
  en: 'Extent of Japanese control and the front, December 1942', ja: '日本の支配の範囲と戦線（1942年12月）',
  zh: '日本控制範圍與戰線（1942年12月）', ko: '일본 지배 범위와 전선 (1942년 12월)',
  source: 'one of several maps used; see Sources'
};

JMAP.BROWSE = [
  {
    id: 'paoting', en: 'Bǎodìng (Paoting)', ja: '保定 (Hotei)', zh: '保定', ko: '바오딩', lat: 38.87,
    lon: 115.47, wiki: 'https://en.wikipedia.org/wiki/Baoding',
    note: 'On the Beijing–Hankou railway, and the seat of the military academy that trained a generation of Republican officers. Fell on 24 September 1937; Shijiazhuang, the junction south of it, went in October.'
  },
  {
    id: 'taiyuan', en: 'Tàiyuán', ja: '太原 (Taigen)', zh: '太原', ko: '타이위안', lat: 37.87,
    lon: 112.55, wiki: 'https://en.wikipedia.org/wiki/Taiyuan',
    note: 'Yan Xishan\'s capital for thirty years, with the arsenal and steelworks he built to keep Shanxi independent of everyone. Lin Biao\'s ambush at Pingxingguan in September 1937 and the battle of Xinkou in October delayed its fall until 9 November.'
  },
  {
    id: 'kaifeng', en: 'Kāifēng', ja: '開封 (Kaihō)', zh: '開封', ko: '카이펑', lat: 34.8, lon: 114.31,
    wiki: 'https://en.wikipedia.org/wiki/Kaifeng',
    note: 'The Northern Song capital, and a station on the Lunghai railway. Fell on 6 June 1938; the dikes at Huayuankou were cut three days later to stop the advance beyond it.'
  },
  {
    id: 'hefei', en: 'Héféi (Hofei)', ja: '合肥 (Gōhi)', zh: '合肥', ko: '허페이', lat: 31.86,
    lon: 117.28, wiki: 'https://en.wikipedia.org/wiki/Hefei',
    note: 'The seat of Anhui, on the road between the Yangtze and the Huai. Occupied in 1938, though the front bent round the Chinese pocket in the north-west of the province beyond it.'
  },
  {
    id: 'anqing', en: 'Ānqìng (Anking)', ja: '安慶 (Ankei)', zh: '安慶', ko: '안칭', lat: 30.51,
    lon: 117.05, wiki: 'https://en.wikipedia.org/wiki/Anqing',
    note: 'The old provincial capital of Anhui, and a river port on the Yangtze. Fell on 12 June 1938, opening the campaign up the river to Hankou. The New Fourth Army Incident of January 1941 was fought in the mountains south of it.'
  },
  {
    id: 'hangzhou', en: 'Hángzhōu (Hangchow)', ja: '杭州 (Kōshū)', zh: '杭州', ko: '항저우',
    lat: 30.27, lon: 120.16, wiki: 'https://en.wikipedia.org/wiki/Hangzhou',
    note: 'Silk, and the southern end of the Grand Canal. Fell on 24 December 1937.'
  },
  {
    id: 'nanchang', en: 'Nánchāng', ja: '南昌 (Nanshō)', zh: '南昌', ko: '난창', lat: 28.68,
    lon: 115.89, wiki: 'https://en.wikipedia.org/wiki/Nanchang',
    note: 'Where the Communist rising of 1 August 1927 gave the Red Army its founding date, and where Chiang launched the New Life Movement seven years later. Fell on 27 March 1939.'
  },
  {
    id: 'fuzhou', en: 'Fúzhōu (Foochow)', ja: '福州 (Fukushū)', zh: '福州', ko: '푸저우', lat: 26.07,
    lon: 119.3, wiki: 'https://en.wikipedia.org/wiki/Fuzhou',
    note: 'A treaty port from 1842 and the great tea shipping port of the nineteenth century. Taken in April 1941, retaken by Chinese forces that September, and taken again in October 1944.'
  },
  {
    id: 'changsha', en: 'Chángshā', ja: '長沙 (Chōsa)', zh: '長沙', ko: '창사', lat: 28.23,
    lon: 112.94, wiki: 'https://en.wikipedia.org/wiki/Changsha',
    note: 'The rice bowl of Hunan and a junction on the Guangzhou–Hankou line. Its own garrison burned it down by mistake in November 1938; it then beat off three Japanese offensives and fell at last on 18 June 1944.'
  },
  {
    id: 'guilin', en: 'Guìlín (Kweilin)', ja: '桂林 (Keirin)', zh: '桂林', ko: '구이린', lat: 25.27,
    lon: 110.29, wiki: 'https://en.wikipedia.org/wiki/Guilin',
    note: 'A Nationalist air base among the limestone hills, and the refuge of the universities of the south. Destroyed by its own garrison and abandoned on 10 November 1944.'
  },
  {
    id: 'nanning', en: 'Nánníng', ja: '南寧 (Nannei)', zh: '南寧', lat: 22.82, lon: 108.32,
    wiki: 'https://en.wikipedia.org/wiki/Nanning',
    note: 'The road and rail gate to Indochina, which is why it was taken in November 1939, given up in 1940, and taken again in 1944.'
  },
  {
    id: 'guiyang', en: 'Guìyáng (Kweiyang)', ja: '貴陽 (Kiyō)', zh: '貴陽', ko: '구이양', lat: 26.65,
    lon: 106.63, wiki: 'https://en.wikipedia.org/wiki/Guiyang',
    note: 'The hinge of the road system of the south-west, where the routes from Chongqing, Kunming and Guangxi met. Never occupied: the Japanese advance of December 1944 reached Dushan, a hundred miles short of it, and turned back — the furthest inland the war ever came.'
  },
  {
    id: 'kunming', en: 'Kūnmíng', ja: '昆明 (Konmei)', zh: '昆明', ko: '쿤밍', lat: 25.04,
    lon: 102.72, wiki: 'https://en.wikipedia.org/wiki/Kunming',
    note: 'The terminus of the Burma Road, of the railway from Haiphong, and after both were cut of the air route over the Hump. Peking University, Tsinghua and Nankai spent the war here as Lianda, the National Southwest Associated University. Never occupied.'
  },
  {
    id: 'chengdu', en: 'Chéngdū (Chengtu)', ja: '成都 (Seito)', zh: '成都', lat: 30.66, lon: 104.07,
    wiki: 'https://en.wikipedia.org/wiki/Chengdu',
    note: 'The rice and silk capital of the Sichuan basin. Never occupied — and the four airfields built round it by hand in 1944 were the first from which B-29s bombed Japan.'
  },
  {
    id: 'lanzhou', en: 'Lánzhōu (Lanchow)', ja: '蘭州 (Ranshū)', zh: '蘭州', lat: 36.06,
    lon: 103.83, wiki: 'https://en.wikipedia.org/wiki/Lanzhou',
    note: 'Where the road to Xinjiang crosses the Yellow River, and the point through which Soviet aid and Soviet aircraft entered China. Bombed for it from 1937; never occupied.'
  },
  {
    id: 'xining', en: 'Xīníng (Sining)', ja: '西寧 (Seinei)', zh: '西寧', lat: 36.62, lon: 101.78,
    wiki: 'https://en.wikipedia.org/wiki/Xining',
    note: 'The seat of the Ma family who governed Qinghai for the Republic, and the wool and hide market of the Tibetan borderland. Never occupied.'
  },
  {
    id: 'yinchuan', en: 'Yínchuān (Ningsia)', ja: '寧夏 (Neika)', zh: '寧夏（銀川）', ko: '인촨',
    lat: 38.49, lon: 106.23, wiki: 'https://en.wikipedia.org/wiki/Yinchuan',
    note: 'The oasis capital of Ningxia on the upper Yellow River, held for the Republic by Ma Hongkui throughout. Never occupied.'
  },
  {
    id: 'hohhot', en: 'Kōwa (Hūhéhàotè, Kweisui)', ja: '厚和 (Kōwa)', zh: '歸綏（呼和浩特）', ko: '후허하오터',
    lat: 40.84, lon: 111.75, wiki: 'https://en.wikipedia.org/wiki/Hohhot', jpfrom: 'e1942',
    local: 'Hūhéhàotè (Kweisui)',
    note: 'The Inner Mongolian trade and lamasery city on the Beijing–Suiyuan railway. Taken on 14 October 1937 and renamed Kōwa; Demchugdongrub\'s Mongol government sat here before the seat moved to Zhangjiakou.'
  },
  {
    id: 'baotou', en: 'Hōtō (Bāotóu, Paotow)', ja: '包頭 (Hōtō)', zh: '包頭', ko: '바오터우',
    lat: 40.66, lon: 109.84, wiki: 'https://en.wikipedia.org/wiki/Baotou', jpfrom: 'e1942',
    local: 'Bāotóu (Paotow)',
    note: 'The railhead of the Beijing–Suiyuan line and the wool market of the steppe. Taken in October 1937, and the western limit of Japanese control; the country beyond stayed with Fu Zuoyi.'
  },
  {
    id: 'qiqihar', en: 'Chichiharu (Qíqíhā’ěr, Tsitsihar)', ja: 'チチハル (Chichiharu)', zh: '齊齊哈爾',
    ko: '치치하얼', lat: 47.35, lon: 123.92, wiki: 'https://en.wikipedia.org/wiki/Qiqihar',
    jpfrom: 'e1942', local: 'Qíqíhā’ěr (Tsitsihar)',
    note: 'The seat of Heilongjiang and the junction of the Chinese Eastern Railway with the line north. Taken on 19 November 1931 after the fighting at the Nen bridges.'
  },
  {
    id: 'jilincity', en: 'Kirin (Jílín)', ja: '吉林 (Kirin)', zh: '吉林', ko: '지린시', lat: 43.84,
    lon: 126.55, wiki: 'https://en.wikipedia.org/wiki/Jilin_City', jpfrom: 'e1942',
    local: 'Jílín (Kirin)',
    note: 'A timber and river city on the Songhua, taken in September 1931 when its provincial governor went over to the Japanese.'
  },
  {
    id: 'mudanjiang', en: 'Botankō (Mǔdānjiāng, Mutankiang)', ja: '牡丹江 (Botankō)', zh: '牡丹江',
    ko: '무단장', lat: 44.58, lon: 129.6, wiki: 'https://en.wikipedia.org/wiki/Mudanjiang',
    jpfrom: 'e1942', local: 'Mǔdānjiāng (Mutankiang)',
    note: 'A garrison town and railway junction on the eastern line to Vladivostok, and the first objective of the Soviet armies in August 1945.'
  },
  {
    id: 'fushun', en: 'Bujun (Fǔshùn)', ja: '撫順 (Bujun)', zh: '撫順', ko: '푸순', lat: 41.88,
    lon: 123.94, wiki: 'https://en.wikipedia.org/wiki/Fushun', jpfrom: 'e1942', local: 'Fǔshùn',
    note: 'The open-cast coal mine that fuelled the South Manchuria Railway and much of Japanese industry. Chinese labourers died here in tens of thousands.'
  },
  {
    id: 'anshan', en: 'Anzan (Ānshān)', ja: '鞍山 (Anzan)', zh: '鞍山', lat: 41.11, lon: 122.99,
    wiki: 'https://en.wikipedia.org/wiki/Anshan', jpfrom: 'e1942', local: 'Ānshān',
    note: 'The Shōwa Steel Works, the largest ironworks in the empire outside Japan, and the target of the first B-29 raid on Manchuria in July 1944.'
  },
  {
    id: 'jinzhou', en: 'Kinshū (Jǐnzhōu, Chinchow)', ja: '錦州 (Kinshū)', zh: '錦州', lat: 41.1,
    lon: 121.13, wiki: 'https://en.wikipedia.org/wiki/Jinzhou', jpfrom: 'e1942',
    local: 'Jǐnzhōu (Chinchow)',
    note: 'The gate between Manchuria and the Wall, on the railway from Shenyang to Beijing. Taken on 3 January 1932, which put Japanese troops on the Wall; Harbin held out until February.'
  },
  {
    id: 'yingkou', en: 'Eikō (Yíngkǒu, Newchwang)', ja: '営口 (Eikō)', zh: '營口', ko: '잉커우',
    lat: 40.67, lon: 122.24, wiki: 'https://en.wikipedia.org/wiki/Yingkou', jpfrom: 'e1942',
    local: 'Yíngkǒu (Newchwang)',
    note: 'The old treaty port of Yingkou at the mouth of the Liao, once the outlet for Manchurian soya beans and long overtaken by Dalian.'
  },
  {
    id: 'dandong', en: 'Antō (Āndōng, Dandong)', ja: '安東 (Antō)', zh: '安東', ko: '단둥',
    lat: 40.13, lon: 124.39, wiki: 'https://en.wikipedia.org/wiki/Dandong', jpfrom: 'e1942',
    local: 'Āndōng (Dandong)',
    note: 'Where the railway crosses the Yalu into Korea — the bridge that carried the army to the continent — and the port for the timber floated down the river.'
  },
  {
    id: 'urumqi', en: 'Wūlǔmùqí (Urumchi)', ja: '迪化 (Tekika)', zh: '迪化（烏魯木齊）', lat: 43.83,
    lon: 87.62, wiki: 'https://en.wikipedia.org/wiki/%C3%9Cr%C3%BCmqi',
    note: 'The seat of Sheng Shicai, who ran Xinjiang on Soviet money until he turned to Chongqing in 1942, and the end of the road that carried Soviet aid. Never Japanese.'
  },
  {
    id: 'kashgar', en: 'Kāshí (Kashgar)', ja: 'カシュガル (Kashugaru)', zh: '喀什噶爾', lat: 39.47,
    lon: 75.99, wiki: 'https://en.wikipedia.org/wiki/Kashgar',
    note: 'The caravan city of the southern Tarim, with a British and a Soviet consulate watching each other across it. Never Japanese.'
  },
  {
    id: 'lhasa', en: 'Lhasa', lat: 29.65, lon: 91.14,
    wiki: 'https://en.wikipedia.org/wiki/Lhasa',
    note: 'The seat of the Tibetan government, which stayed neutral and refused passage to an Allied supply route into China.'
  },
  {
    id: 'kangding', en: 'Kāngdìng (Kangting)', ja: '康定 (Kōtei)', zh: '康定', lat: 30.05,
    lon: 101.96, wiki: 'https://en.wikipedia.org/wiki/Kangding',
    note: 'The old tea-and-horse gate between Sichuan and Tibet, and the seat of Xikang.'
  },
  {
    id: 'zhenjiang', en: 'Zhènjiāng (Chinkiang)', ja: '鎮江 (Chinkō)', zh: '鎮江', ko: '전장',
    lat: 32.19, lon: 119.43, wiki: 'https://en.wikipedia.org/wiki/Zhenjiang',
    note: 'Where the Grand Canal meets the Yangtze, and the provincial capital of Jiangsu until 1937. Fell in December 1937.'
  },
  {
    id: 'shantou', en: 'Shàntóu (Swatow)', ja: '汕頭 (Santō)', zh: '汕頭', ko: '산터우', lat: 23.35,
    lon: 116.68, wiki: 'https://en.wikipedia.org/wiki/Shantou',
    note: 'A treaty port from 1860, the departure point for much of the Chinese emigration to Southeast Asia, and the outlet for Guangdong\'s sugar. Occupied on 21 June 1939.'
  },
  {
    id: 'ningbo', en: 'Níngbō (Ningpo)', ja: '寧波 (Neiha)', zh: '寧波', ko: '닝보', lat: 29.87,
    lon: 121.55, wiki: 'https://en.wikipedia.org/wiki/Ningbo',
    note: 'A treaty port from 1842 and a merchant city whose bankers ran much of Shanghai. Occupied in April 1941; Unit 731 dropped plague-infected fleas on it in 1940.'
  },
  {
    id: 'wenzhou', en: 'Wēnzhōu (Wenchow)', ja: '温州 (Onshū)', zh: '溫州', ko: '원저우', lat: 28,
    lon: 120.7, wiki: 'https://en.wikipedia.org/wiki/Wenzhou',
    note: 'A minor treaty port behind a mountain wall, taken and given up three times between 1941 and 1945. It lies outside the line of control drawn here for December 1942.'
  },
  {
    id: 'yantai', en: 'Yāntái (Chefoo)', ja: '芝罘 (Shifu)', zh: '芝罘（煙臺）', ko: '옌타이', lat: 37.46,
    lon: 121.45, wiki: 'https://en.wikipedia.org/wiki/Yantai',
    note: 'The treaty port of Yantai, known for lace, silk and the missionary school. Occupied in February 1938.'
  },
  {
    id: 'taegu', en: 'Taikyū (Taegu)', ja: '大邱 (Taikyū)', zh: '大邱', ko: '대구광역', lat: 35.87,
    lon: 128.6, wiki: 'https://en.wikipedia.org/wiki/Daegu', local: 'Taegu (Taikyū)',
    note: 'The provincial seat of North Kyŏngsang, and the apple and textile town of the south-east. The March First Movement reached it on 8 March 1919 and was put down by troops.'
  },
  {
    id: 'kwangju', en: 'Kōshū (Kwangju)', ja: '光州 (Kōshū)', zh: '光州', ko: '광주광역', lat: 35.16,
    lon: 126.85, wiki: 'https://en.wikipedia.org/wiki/Gwangju', local: 'Kwangju (Kōshū)',
    note: 'Where the student movement of November 1929 began, after Japanese schoolboys harassed Korean girls on the Naju train; it spread to some two hundred schools across the colony.'
  },
  {
    id: 'taejon', en: 'Taiden (Taejŏn)', ja: '大田 (Taiden)', zh: '大田', ko: '대전광역', lat: 36.35,
    lon: 127.38, wiki: 'https://en.wikipedia.org/wiki/Daejeon', local: 'Taejŏn (Taiden)',
    note: 'The junction where the Seoul–Pusan trunk line meets the Honam line down to the rice country of the south-west.'
  },
  {
    id: 'wonsan', en: 'Genzan (Wŏnsan)', ja: '元山 (Genzan)', zh: '元山', ko: '원산', lat: 39.15,
    lon: 127.44, wiki: 'https://en.wikipedia.org/wiki/Wonsan', local: 'Wŏnsan (Genzan)',
    note: 'Opened to Japanese trade in 1880, and by the 1930s the east-coast port for the fisheries and for the oil refinery built beside it.'
  },
  {
    id: 'chongjin', en: 'Seishin (Ch’ŏngjin)', ja: '清津 (Seishin)', zh: '清津', ko: '청진',
    lat: 41.8, lon: 129.78, wiki: 'https://en.wikipedia.org/wiki/Chongjin',
    local: 'Ch’ŏngjin (Seishin)',
    note: 'Steel and a deep-water harbour built to carry Manchurian ore and soya to Japan. Soviet marines landed here on 13 August 1945.'
  },
  {
    id: 'hamhung', en: 'Kankō (Hamhŭng)', ja: '咸興 (Kankō)', zh: '咸興', ko: '함흥', lat: 39.92,
    lon: 127.54, wiki: 'https://en.wikipedia.org/wiki/Hamhung', local: 'Hamhŭng (Kankō)',
    note: 'Beside it at Hŭngnam stood Noguchi\'s Chōsen Chisso works, the largest chemical plant in the empire — fertiliser, and later explosives, on power from the Pujŏn river dams.'
  },
  {
    id: 'sinuiju', en: 'Shingishū (Sinŭiju)', ja: '新義州 (Shingishū)', zh: '新義州', ko: '신의주',
    lat: 40.1, lon: 124.39, wiki: 'https://en.wikipedia.org/wiki/Sinuiju',
    local: 'Sinŭiju (Shingishū)',
    note: 'The Korean end of the Yalu bridge to Dandong, and downstream of the Suiho dam, which was the largest in Asia when it was finished in 1941.'
  },
  {
    id: 'kaesong', en: 'Kaijō (Kaesŏng)', ja: '開城 (Kaijō)', zh: '開城', ko: '개성', lat: 37.97,
    lon: 126.55, wiki: 'https://en.wikipedia.org/wiki/Kaesong', local: 'Kaesŏng (Kaijō)',
    note: 'The Koryŏ capital, and the ginseng town. It was in Keiki-dō in the colonial period, which is where this map draws it, not in Hwanghae.'
  },
  {
    id: 'nampo', en: 'Chinnanpo (Chinnamp’o)', ja: '鎮南浦 (Chinnanpo)', zh: '鎮南浦', ko: '남포',
    lat: 38.74, lon: 125.41, wiki: 'https://en.wikipedia.org/wiki/Nampo',
    local: 'Chinnamp’o (Chinnanpo)',
    note: 'Pyongyang\'s port, and the smelter that took Korean and Manchurian ore.'
  },
  {
    id: 'mokpo', en: 'Moppo (Mokp’o)', ja: '木浦 (Mokupo)', zh: '木浦', ko: '목포', lat: 34.79,
    lon: 126.39, wiki: 'https://en.wikipedia.org/wiki/Mokpo', local: 'Mokp’o (Moppo)',
    note: 'The cotton and rice port of the south-west, through which the Honam harvest left for Japan.'
  },
  {
    id: 'najin', en: 'Rashin (Najin)', ja: '羅津 (Rashin)', zh: '羅津', ko: '라진구역', lat: 42.24,
    lon: 130.29, wiki: 'https://en.wikipedia.org/wiki/Rajin-guyok', local: 'Najin (Rashin)',
    note: 'Built from a fishing village in the 1930s as the terminus of the short sea route from Manchuria to Japan, bypassing the long haul round Korea.'
  },
  {
    id: 'tainan', en: 'Tainan', ja: '臺南 (Tainan)', zh: '臺南', ko: '타이난', lat: 22.99, lon: 120.2,
    wiki: 'https://en.wikipedia.org/wiki/Tainan',
    note: 'The old capital of the island under the Dutch and the Qing, and the seat of the south until Japanese rule moved the centre to Taihoku.'
  },
  {
    id: 'taichung', en: 'Taichū (Taizhong, Taichung)', ja: '臺中 (Taichū)', zh: '臺中', ko: '다이추주',
    lat: 24.15, lon: 120.67, wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Taizhong (Taichū, Taichung)',
    note: 'The centre of the rice plain, and the prefecture in which the Musha rising broke out in October 1930 — the last armed resistance by Taiwan\'s indigenous peoples, put down with aircraft and poison gas.'
  },
  {
    id: 'keelung', en: 'Kīrun (Jilong, Keelung)', ja: '基隆 (Kīrun)', zh: '基隆', ko: '지룽',
    lat: 25.13, lon: 121.74, wiki: 'https://en.wikipedia.org/wiki/Keelung',
    local: 'Jilong (Kīrun, Keelung)',
    note: 'The northern coaling port and the ferry terminus for Japan. American carrier raids struck its harbour in October 1944.'
  },
  {
    id: 'hualien', en: 'Karenkō (Hualiangang, Hualien)', ja: '花蓮港 (Karenkō)', zh: '花蓮港',
    ko: '가렌코청', lat: 23.98, lon: 121.6,
    wiki: 'https://en.wikipedia.org/wiki/Karenk%C5%8D_Prefecture',
    local: 'Hualiangang (Karenkō, Hualien)',
    note: 'The port of the east coast, cut off from the rest of the island by the central range and settled late.'
  },
  {
    id: 'hsinchu', en: 'Shinchiku (Xinzhu, Hsinchu)', ja: '新竹 (Shinchiku)', zh: '新竹',
    ko: '신치쿠주', lat: 24.81, lon: 120.97,
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Xinzhu (Shinchiku, Hsinchu)',
    note: 'Natural gas and an air base. American bombers from China hit its airfields on 25 November 1943, the first raid of the war on Taiwan.'
  },
  {
    id: 'chiayi', en: 'Kagi (Jiayi, Chiayi)', ja: '嘉義 (Kagi)', zh: '嘉義', ko: '자이', lat: 23.48,
    lon: 120.45, wiki: 'https://en.wikipedia.org/wiki/Chiayi', local: 'Jiayi (Kagi, Chiayi)',
    note: 'The foot of the Alishan forest railway, built by the colonial government to bring the cypress down off the mountain.'
  },
  {
    id: 'makung', en: 'Makō, Pescadores (Magong, Makung)', ja: '馬公 (Makō)', zh: '馬公（澎湖）',
    lat: 23.57, lon: 119.57, wiki: 'https://en.wikipedia.org/wiki/Longgui_Park',
    local: 'Magong, Pescadores (Makō, Makung)',
    note: 'The naval anchorage in the Pescadores, which Japan took in March 1895 — a month before the treaty that gave it Taiwan.'
  },
  {
    id: 'fukuoka', en: 'Fukuoka', ja: '福岡 (Fukuoka)', zh: '福岡', ko: '후쿠오카', lat: 33.59,
    lon: 130.4, wiki: 'https://en.wikipedia.org/wiki/Fukuoka',
    note: 'The city of the northern Kyūshū coalfield and the port for Korea. Firebombed on 19 June 1945.'
  },
  {
    id: 'sendai', en: 'Sendai', ja: '仙台 (Sendai)', zh: '仙台', ko: '센다이', lat: 38.27, lon: 140.87,
    wiki: 'https://en.wikipedia.org/wiki/Sendai',
    note: 'The garrison and university city of the north-east. Firebombed on 10 July 1945.'
  },
  {
    id: 'niigata', en: 'Niigata', ja: '新潟 (Niigata)', zh: '新潟', lat: 37.92, lon: 139.04,
    wiki: 'https://en.wikipedia.org/wiki/Ch%C5%AB%C5%8D-ku,_Niigata',
    note: 'The Japan Sea port for Korea and Manchuria. It was kept on the atomic target list and so was left largely unbombed.'
  },
  {
    id: 'kanazawa', en: 'Kanazawa', ja: '金沢 (Kanazawa)', zh: '金澤', ko: '가나자와', lat: 36.56,
    lon: 136.66, wiki: 'https://en.wikipedia.org/wiki/Kanazawa',
    note: 'A castle town of the Maeda, and one of the largest cities in Japan the bombing never reached.'
  },
  {
    id: 'kumamoto', en: 'Kumamoto', ja: '熊本 (Kumamoto)', zh: '熊本', ko: '구마모토', lat: 32.8,
    lon: 130.71, wiki: 'https://en.wikipedia.org/wiki/Kumamoto',
    note: 'The Sixth Division\'s garrison town, and the seat of the Kyūshū command. Firebombed on 1 July 1945.'
  },
  {
    id: 'okayama', en: 'Okayama', ja: '岡山 (Okayama)', zh: '岡山', ko: '오카야마', lat: 34.66,
    lon: 133.93, wiki: 'https://en.wikipedia.org/wiki/Okayama',
    note: 'On the line to Shikoku and Kyūshū. Firebombed on 29 June 1945.'
  },
  {
    id: 'matsuyama', en: 'Matsuyama', ja: '松山 (Matsuyama)', zh: '松山', ko: '마쓰야마', lat: 33.84,
    lon: 132.77, wiki: 'https://en.wikipedia.org/wiki/Matsuyama',
    note: 'A castle town and the largest city of northern Shikoku. Firebombed on 26 July 1945.'
  },
  {
    id: 'kure', en: 'Kure', ja: '呉 (Kure)', zh: '吳', ko: '구레', lat: 34.25, lon: 132.57,
    wiki: 'https://en.wikipedia.org/wiki/Kure,_Hiroshima',
    note: 'The navy yard that built the Yamato. Carrier raids in July 1945 sank what was left of the fleet at its moorings.'
  },
  {
    id: 'yokosuka', en: 'Yokosuka', ja: '横須賀 (Yokosuka)', zh: '橫須賀', ko: '요코스카', lat: 35.28,
    lon: 139.67, wiki: 'https://en.wikipedia.org/wiki/Yokosuka',
    note: 'The oldest of the navy yards, built with French help from 1865, and the base that guarded the approaches to Tokyo Bay.'
  },
  {
    id: 'sasebo', en: 'Sasebo', ja: '佐世保 (Sasebo)', zh: '佐世保', ko: '사세보', lat: 33.18,
    lon: 129.72, wiki: 'https://en.wikipedia.org/wiki/Sasebo',
    note: 'The naval base facing Korea and China, from which the fleet sailed in 1894 and again in 1904.'
  },
  {
    id: 'maizuru', en: 'Maizuru', ja: '舞鶴 (Maizuru)', zh: '舞鶴', ko: '마이즈루', lat: 35.45,
    lon: 135.33, wiki: 'https://en.wikipedia.org/wiki/Maizuru',
    note: 'The Japan Sea naval base, and after the surrender the longest-serving of the repatriation ports: some 660,000 people came home through it over thirteen years.'
  },
  {
    id: 'aomori', en: 'Aomori', ja: '青森 (Aomori)', zh: '青森', ko: '아오모리', lat: 40.82,
    lon: 140.75, wiki: 'https://en.wikipedia.org/wiki/Aomori',
    note: 'The ferry crossing to Hokkaidō, and the bottleneck of the northern railway. Firebombed on 28 July 1945.'
  },
  {
    id: 'toyohara', en: 'Toyohara (Yuzhno-Sakhalinsk)', ja: '豊原 (Toyohara)', zh: '豐原',
    ko: '유즈노사할린스크', lat: 46.96, lon: 142.73,
    wiki: 'https://en.wikipedia.org/wiki/Yuzhno-Sakhalinsk',
    note: 'The capital of Karafuto, laid out on a grid by the colonial government. Soviet troops took it in August 1945 and it is Yuzhno-Sakhalinsk now.'
  },
  {
    id: 'haiphong', en: 'Haiphong', ja: 'ハイフォン (Haifon)', zh: '海防', lat: 20.86, lon: 106.68,
    wiki: 'https://en.wikipedia.org/wiki/Haiphong',
    note: 'Tonkin\'s port, and where Japanese troops came ashore in September 1940 to close the rail route carrying supplies to Chongqing.'
  },
  {
    id: 'hue', en: 'Hue', ja: 'フエ (Fue)', zh: '順化', lat: 16.46, lon: 107.6,
    wiki: 'https://en.wikipedia.org/wiki/Hu%E1%BA%BF',
    note: 'The seat of the Nguyễn emperors, where Bảo Đại reigned under French protection and declared independence under Japanese auspices in March 1945.'
  },
  {
    id: 'phnompenh', en: 'Phnom Penh', lat: 11.56, lon: 104.92,
    wiki: 'https://en.wikipedia.org/wiki/Phnom_Penh',
    note: 'The Cambodian royal capital under a French résident supérieur. Japan swept the French administration away here on 9 March 1945.'
  },
  {
    id: 'vientiane', en: 'Vientiane', lat: 17.97, lon: 102.6,
    wiki: 'https://en.wikipedia.org/wiki/Vientiane',
    note: 'The French administrative seat in Laos, on the Mekong. The country west of the river went to Thailand in 1941.'
  },
  {
    id: 'luangprabang', en: 'Luang Prabang', lat: 19.89, lon: 102.14,
    wiki: 'https://en.wikipedia.org/wiki/Luang_Prabang',
    note: 'The Lao royal capital, and the one part of Laos with a king of its own under the protectorate.'
  },
  {
    id: 'chiangmai', en: 'Chiengmai (Chiang Mai)', lat: 18.79, lon: 98.98,
    wiki: 'https://en.wikipedia.org/wiki/Chiang_Mai',
    note: 'The seat of the old Lanna kingdom and the northern capital of Siam, from which Thai troops moved into the Shan states in May 1942.'
  },
  {
    id: 'mandalay', en: 'Mandalay', ja: 'マンダレー (Mandarē)', zh: '曼德勒', lat: 21.98, lon: 96.08,
    wiki: 'https://en.wikipedia.org/wiki/Mandalay',
    note: 'The last royal capital of Burma, taken on 1 May 1942 as the army fell back to India, and retaken on 20 March 1945.'
  },
  {
    id: 'moulmein', en: 'Moulmein', lat: 16.49, lon: 97.63,
    wiki: 'https://en.wikipedia.org/wiki/Mawlamyine',
    note: 'Fell on 31 January 1942. Thanbyuzayat, the western railhead of the Burma–Siam railway, lies just south of it.'
  },
  {
    id: 'kualalumpur', en: 'Kuala Lumpur', ja: 'クアラルンプール', lat: 3.14, lon: 101.69,
    wiki: 'https://en.wikipedia.org/wiki/Kuala_Lumpur',
    note: 'The capital of the Federated Malay States, taken on 11 January 1942 as the campaign came down the west coast.'
  },
  {
    id: 'penang', en: 'Penang (Georgetown)', lat: 5.41, lon: 100.34,
    wiki: 'https://en.wikipedia.org/wiki/Penang',
    note: 'Bombed on 11 December 1941 and abandoned on the 19th; the European population was evacuated and the rest was not, which was remembered.'
  },
  {
    id: 'ipoh', en: 'Ipoh', ja: 'イポー (Ipō)', lat: 4.6, lon: 101.09,
    wiki: 'https://en.wikipedia.org/wiki/Ipoh',
    note: 'The tin town of the Kinta valley, taken on 28 December 1941.'
  },
  {
    id: 'johore', en: 'Johore Bahru', ja: 'ジョホールバル', lat: 1.49, lon: 103.74,
    note: 'Reached on 31 January 1942, the day the causeway was blown, and the ground from which the assault on Singapore was mounted a week later.'
  },
  {
    id: 'malacca', en: 'Malacca', ja: 'マラッカ (Marakka)', lat: 2.19, lon: 102.25,
    wiki: 'https://en.wikipedia.org/wiki/Malacca',
    note: 'The oldest European settlement in Malaya, Portuguese then Dutch then British, taken on 15 January 1942.'
  },
  {
    id: 'kuching', en: 'Kuching', ja: 'クチン (Kuchin)', lat: 1.55, lon: 110.34,
    wiki: 'https://en.wikipedia.org/wiki/Kuching',
    note: 'The Brooke capital of Sarawak, taken on 24 December 1941 with the airfield beside it.'
  },
  {
    id: 'jesselton', en: 'Jesselton (Kota Kinabalu)', ja: 'ジェッセルトン', lat: 5.98, lon: 116.07,
    wiki: 'https://en.wikipedia.org/wiki/Kota_Kinabalu',
    note: 'The North Borneo Company\'s seat, taken on 9 January 1942. The rising here in October 1943 was crushed with mass executions.'
  },
  {
    id: 'brunei', en: 'Brunei Town', ja: 'ブルネイ (Burunei)', lat: 4.89, lon: 114.94,
    wiki: 'https://en.wikipedia.org/wiki/Bandar_Seri_Begawan',
    note: 'The sultan\'s town, taken on 6 January 1942 for the oilfield at Seria and the refinery at Lutong.'
  },
  {
    id: 'bandung', en: 'Bandung', ja: 'バンドン (Bandon)', lat: -6.91, lon: 107.61,
    wiki: 'https://en.wikipedia.org/wiki/Bandung',
    note: 'The Dutch army\'s headquarters in the hills above Batavia. The surrender of the Indies was signed at Kalijati north of it on 8 March 1942.'
  },
  {
    id: 'semarang', en: 'Semarang', ja: 'スマラン (Sumaran)', lat: -6.97, lon: 110.42,
    wiki: 'https://en.wikipedia.org/wiki/Semarang',
    note: 'The port of central Java and the outlet for its sugar, taken in March 1942.'
  },
  {
    id: 'medan', en: 'Medan', ja: 'メダン (Medan)', lat: 3.59, lon: 98.67,
    wiki: 'https://en.wikipedia.org/wiki/Medan',
    note: 'The town the Sumatran plantation belt was run from — tobacco, rubber and palm oil, worked by indentured Javanese and Chinese labour.'
  },
  {
    id: 'palembang', en: 'Palembang', ja: 'パレンバン (Parenban)', lat: -2.99, lon: 104.76,
    wiki: 'https://en.wikipedia.org/wiki/Palembang',
    note: 'The refineries here were the richest prize of the southern advance, taken by parachute assault on 14 February 1942 before they could be destroyed.'
  },
  {
    id: 'makassar', en: 'Makassar', ja: 'マカッサル (Makassaru)', lat: -5.15, lon: 119.43,
    wiki: 'https://en.wikipedia.org/wiki/Makassar',
    note: 'The port of Celebes and the base of the Dutch eastern squadron, taken on 9 February 1942.'
  },
  {
    id: 'balikpapan', en: 'Balikpapan', ja: 'バリクパパン', lat: -1.24, lon: 116.85,
    wiki: 'https://en.wikipedia.org/wiki/Balikpapan',
    note: 'The Borneo oil port, taken on 24 January 1942; a Dutch demolition party fired the wells and its members were killed for it.'
  },
  {
    id: 'cebu', en: 'Cebu', ja: 'セブ (Sebu)', zh: '宿霧', lat: 10.32, lon: 123.89,
    wiki: 'https://en.wikipedia.org/wiki/Cebu',
    note: 'The second city of the islands, taken in April 1942 and a centre of the guerrilla resistance afterwards.'
  },
  {
    id: 'davao', en: 'Davao', ja: 'ダバオ (Dabao)', lat: 7.07, lon: 125.61,
    wiki: 'https://en.wikipedia.org/wiki/Davao_(province)',
    note: 'Taken on 20 December 1941, and before the war the largest Japanese settlement overseas — some twenty thousand people growing abaca.'
  },
  {
    id: 'iloilo', en: 'Iloilo', ja: 'イロイロ (Iroiro)', zh: '伊洛伊洛', lat: 10.72, lon: 122.56,
    wiki: 'https://en.wikipedia.org/wiki/Iloilo_City',
    note: 'The sugar port of Panay and the second city of the Visayas, taken in April 1942.'
  },
  {
    id: 'baguio', en: 'Baguio', ja: 'バギオ (Bagio)', zh: '碧瑤', lat: 16.41, lon: 120.6,
    wiki: 'https://en.wikipedia.org/wiki/Baguio',
    note: 'The American summer capital in the mountains, taken on 27 December 1941.'
  },
  {
    id: 'dili', en: 'Dili', ja: 'ディリ (Diri)', lat: -8.56, lon: 125.56,
    wiki: 'https://en.wikipedia.org/wiki/Dili',
    note: 'Australian and Dutch troops landed here on 17 December 1941 to forestall Japan, in a neutral Portuguese colony; the Japanese came on 19 February 1942.'
  },
  {
    id: 'khabarovsk', en: 'Khabarovsk', ja: 'ハバロフスク', zh: '伯力', lat: 48.48, lon: 135.08,
    wiki: 'https://en.wikipedia.org/wiki/Khabarovsk',
    note: 'The seat of the Soviet Far Eastern command, and of the armies that stood against the Kwantung Army for a decade and crossed the border in August 1945.'
  },
  {
    id: 'ulanbator', en: 'Urga (Ulan Bator)', ja: '庫倫 (Kuron)', zh: '庫倫（烏蘭巴托）', lat: 47.89,
    lon: 106.91, wiki: 'https://en.wikipedia.org/wiki/Zaisan_Bridge',
    note: 'Urga until 1924, and the capital of a republic that only the Soviet Union recognised.'
  },
  {
    id: 'calcutta', en: 'Calcutta', lat: 22.57, lon: 88.36,
    wiki: 'https://en.wikipedia.org/wiki/Kolkata',
    note: 'The second city of the empire and the base of the Burma front. Japanese aircraft bombed the docks in December 1942, and the Bengal famine of 1943 killed some three million people in the country behind it while the city itself was fed.'
  },
  {
    id: 'madras', en: 'Madras', lat: 13.08, lon: 80.27,
    wiki: 'https://en.wikipedia.org/wiki/Chennai',
    note: 'Shelled by the Emden in 1914, and partly evacuated in April 1942 when a Japanese landing was thought to be coming.'
  },
  {
    id: 'dacca', en: 'Dacca (Dhaka)', lat: 23.81, lon: 90.41,
    wiki: 'https://en.wikipedia.org/wiki/Dhaka',
    note: 'The old Mughal capital of Bengal and the jute city of the east, which the famine of 1943 struck hard.'
  },
  {
    id: 'colombo', en: 'Colombo', lat: 6.93, lon: 79.86,
    wiki: 'https://en.wikipedia.org/wiki/Colombo',
    note: 'Raided by carrier aircraft on Easter Sunday, 5 April 1942, in the operation that drove the Eastern Fleet out of the Indian Ocean.'
  },
  {
    id: 'honolulu', en: 'Honolulu', ja: 'ホノルル (Honoruru)', zh: '檀香山', lat: 21.31, lon: -157.86,
    wiki: 'https://en.wikipedia.org/wiki/Honolulu',
    note: 'The territorial capital, where a third of the population was of Japanese descent; martial law was declared here on 7 December 1941 and lasted almost three years.'
  },
  {
    id: 'agana', en: 'Agana (Hagatna)', ja: 'アガナ (Agana)', zh: '阿加尼亞', lat: 13.47, lon: 144.75,
    wiki: 'https://en.wikipedia.org/wiki/Hag%C3%A5t%C3%B1a,_Guam',
    note: 'Guam\'s capital, taken on 10 December 1941 and renamed Akashi. American shelling in July 1944 left almost nothing of it standing.'
  },
  {
    id: 'koror', en: 'Koror', ja: 'コロール (Korōru)', lat: 7.34, lon: 134.48,
    wiki: 'https://en.wikipedia.org/wiki/Koror',
    note: 'The seat of the South Seas Bureau, which governed the whole mandate from Palau from 1922.'
  },
  {
    id: 'tangshan', en: 'Tángshān', ja: '唐山 (Tōzan)', zh: '唐山', ko: '탕산', lat: 39.63,
    lon: 118.18, wiki: 'https://en.wikipedia.org/wiki/Tangshan',
    note: 'The Kailuan mines, the largest coal workings in north China and British-managed until Japan took them over in 1941.'
  },
  {
    id: 'shanhaiguan', en: 'Shānhǎiguān (Shanhaikuan)', ja: '山海関 (Sankaikan)', zh: '山海關',
    ko: '산해관', lat: 40.01, lon: 119.75, wiki: 'https://en.wikipedia.org/wiki/Shanhai_Pass',
    note: 'Where the Great Wall meets the sea and the Manchurian railway crosses into China proper. Taken on 1 January 1933, opening the Rehe campaign.'
  },
  {
    id: 'datong', en: 'Daidō (Dàtóng, Tatung)', ja: '大同 (Daidō)', zh: '大同', ko: '다퉁',
    lat: 40.09, lon: 113.3, wiki: 'https://en.wikipedia.org/wiki/Datong', jpfrom: 'e1942',
    local: 'Dàtóng (Tatung)',
    note: 'Coal, and the junction of the two railways the occupation ran on. Taken on 13 September 1937 and attached to the Japanese-sponsored government of northern Shanxi.'
  },
  {
    id: 'luoyang', en: 'Luòyáng (Loyang)', ja: '洛陽 (Rakuyō)', zh: '洛陽', ko: '뤄양', lat: 34.62,
    lon: 112.45, wiki: 'https://en.wikipedia.org/wiki/Luoyang',
    note: 'The Longhai railway city and one of the old capitals of China. Held out until 25 May 1944, and the December 1942 line of control leaves it outside the occupation. The Henan famine of 1942–43 killed some two million people in the country round it.'
  },
  {
    id: 'zhengzhou', en: 'Zhèngzhōu (Chengchow)', ja: '鄭州 (Teishū)', zh: '鄭州', ko: '정저우',
    lat: 34.75, lon: 113.63, wiki: 'https://en.wikipedia.org/wiki/Zhengzhou',
    note: 'The junction of the north–south and east–west trunk railways, and the reason the Huayuankou dikes were cut. Taken briefly in October 1941, given up again, and held from April 1944.'
  },
  {
    id: 'suzhou', en: 'Sūzhōu (Soochow)', ja: '蘇州 (Soshū)', zh: '蘇州', ko: '쑤저우', lat: 31.3,
    lon: 120.62, wiki: 'https://en.wikipedia.org/wiki/Suzhou',
    note: 'Silk, gardens, and the Shanghai–Nanjing railway. Fell on 19 November 1937 in the pursuit from Shanghai.'
  },
  {
    id: 'wuxi', en: 'Wúxī (Wusih)', ja: '無錫 (Mushaku)', zh: '無錫', ko: '우시', lat: 31.57,
    lon: 120.3, wiki: 'https://en.wikipedia.org/wiki/Wuxi',
    note: 'The cotton and silk mill town of the lower Yangtze, second only to Shanghai in the region\'s industry. Fell on 25 November 1937.'
  },
  {
    id: 'xuzhou', en: 'Xúzhōu (Hsuchow)', ja: '徐州 (Joshū)', zh: '徐州', ko: '쉬저우', lat: 34.26,
    lon: 117.19, wiki: 'https://en.wikipedia.org/wiki/Xuzhou',
    note: 'The crossing of the north–south and east–west trunk railways, and for that reason the object of the largest campaign of 1938. The Chinese victory at Taierzhuang in April held it until 19 May, and the army got away rather than be encircled.'
  },
  {
    id: 'wuhu', en: 'Wúhú', ja: '蕪湖 (Buko)', zh: '蕪湖', ko: '우후', lat: 31.35, lon: 118.38,
    wiki: 'https://en.wikipedia.org/wiki/Wuhu',
    note: 'The great rice market of the lower Yangtze. Fell on 10 December 1937, three days before Nanjing, cutting the river escape route from the capital.'
  },
  {
    id: 'bengbu', en: 'Bèngbù (Pengpu)', ja: '蚌埠 (Bōfu)', zh: '蚌埠', ko: '벙부', lat: 32.92,
    lon: 117.39, wiki: 'https://en.wikipedia.org/wiki/Bengbu',
    note: 'On the Tianjin–Pukow railway where it crosses the Huai. Taken in February 1938 in the drive north towards Xuzhou.'
  },
  {
    id: 'jiujiang', en: 'Jiǔjiāng (Kiukiang)', ja: '九江 (Kyūkō)', zh: '九江', ko: '주장', lat: 29.71,
    lon: 116, wiki: 'https://en.wikipedia.org/wiki/Jiujiang',
    note: 'The tea port of Jiangxi and the outlet of the Poyang lake. Fell on 26 July 1938, halfway up the river to Hankou.'
  },
  {
    id: 'yichang', en: 'Yíchāng (Ichang)', ja: '宜昌 (Gishō)', zh: '宜昌', ko: '이창', lat: 30.69,
    lon: 111.29, wiki: 'https://en.wikipedia.org/wiki/Yichang',
    note: 'Where cargo transferred from steamer to junk for the passage of the gorges. Taken on 12 June 1940 and held as the furthest Japanese post up the Yangtze, below the water that shielded Chongqing.'
  },
  {
    id: 'hengyang', en: 'Héngyáng', ja: '衡陽 (Kōyō)', zh: '衡陽', ko: '헝양', lat: 26.89,
    lon: 112.57, wiki: 'https://en.wikipedia.org/wiki/Hengyang',
    note: 'The junction of the Guangzhou–Hankou and Hunan–Guangxi railways, and the airfield the Ichigo offensive was launched to take. Its garrison held for forty-seven days and surrendered on 8 August 1944.'
  },
  {
    id: 'yueyang', en: 'Yuèyáng (Yochow)', ja: '岳陽 (Gakuyō)', zh: '岳陽', ko: '웨양', lat: 29.36,
    lon: 113.13, wiki: 'https://en.wikipedia.org/wiki/Yueyang',
    note: 'The Tungting lake port on the Guangzhou–Hankou line, taken in November 1938 and the base from which every attack on Changsha was mounted.'
  },
  {
    id: 'shaoguan', en: 'Sháoguān (Shiuchow)', ja: '韶関 (Shōkan)', zh: '韶關', ko: '사오관',
    lat: 24.81, lon: 113.6, wiki: 'https://en.wikipedia.org/wiki/Shaoguan',
    note: 'The wartime capital of Guangdong after Guangzhou fell, on the railway north to Hunan, and not taken until January 1945.'
  },
  {
    id: 'wuzhou', en: 'Wúzhōu (Wuchow)', ja: '梧州 (Goshū)', zh: '梧州', ko: '우저우', lat: 23.48,
    lon: 111.28, wiki: 'https://en.wikipedia.org/wiki/Wuzhou',
    note: 'Where the West River leaves Guangxi for Guangzhou, and the trade route between them. Taken in the 1944 offensive.'
  },
  {
    id: 'zunyi', en: 'Zūnyì (Tsunyi)', ja: '遵義 (Jungi)', zh: '遵義', ko: '쭌이', lat: 27.73,
    lon: 106.93, wiki: 'https://en.wikipedia.org/wiki/Zunyi',
    note: 'Where the Communist leadership met in January 1935, in the middle of the Long March, and Mao emerged in charge of the party\'s military line.'
  },
  {
    id: 'dali', en: 'Dàlǐ (Tali)', ja: '大理 (Dairi)', zh: '大理', lat: 25.61, lon: 100.27,
    note: 'The old Nanzhao capital, on the Burma Road through western Yunnan along which the fighting came in 1944.'
  },
  {
    id: 'wanxian', en: 'Wànzhōu (Wanhsien)', ja: '万県 (Manken)', zh: '萬縣', ko: '완저우구',
    lat: 30.81, lon: 108.41, wiki: 'https://en.wikipedia.org/wiki/Wanzhou,_Chongqing',
    note: 'The upper Yangtze port above the gorges, and the scene of a British naval bombardment in 1926 that did much to turn Chinese opinion against the treaty powers.'
  },
  {
    id: 'baoji', en: 'Bǎojī (Paoki)', ja: '宝鶏 (Hōkei)', zh: '寶雞', ko: '바오지', lat: 34.36,
    lon: 107.14, wiki: 'https://en.wikipedia.org/wiki/Baoji',
    note: 'The railhead of the line west from Sian, and the road to Gansu and the Soviet supply route.'
  },
  {
    id: 'tianshui', en: 'Tiānshuǐ (Tienshui)', ja: '天水 (Tensui)', zh: '天水', ko: '톈수이',
    lat: 34.58, lon: 105.72, wiki: 'https://en.wikipedia.org/wiki/Tianshui',
    note: 'On the Gansu corridor where the Lunghai railway ran out, a stage on the overland road that carried Soviet aid until 1941.'
  },
  {
    id: 'chaoyang', en: 'Chōyō (Cháoyáng)', ja: '朝陽 (Chōyō)', zh: '朝陽', ko: '차오양', lat: 41.57,
    lon: 120.45, wiki: 'https://en.wikipedia.org/wiki/Chaoyang,_Liaoning', jpfrom: 'e1942',
    local: 'Cháoyáng',
    note: 'On the road from the Wall into Rehe, taken in the campaign of February and March 1933.'
  },
  {
    id: 'yanji', en: 'Enkichi (Yánjí, Yenki)', ja: '延吉 (Enkichi)', zh: '延吉', ko: '옌지',
    lat: 42.91, lon: 129.51, wiki: 'https://en.wikipedia.org/wiki/Yanji', jpfrom: 'e1942',
    local: 'Yánjí (Yenki)',
    note: 'The seat of Jiandao, the one Manchurian province with a Korean majority, and the ground of both Korean resistance and the counter-insurgency against it.'
  },
  {
    id: 'jiamusi', en: 'Kamusu (Jiāmùsī, Kiamusze)', ja: '佳木斯 (Kamusu)', zh: '佳木斯', ko: '자무쓰',
    lat: 46.81, lon: 130.32, wiki: 'https://en.wikipedia.org/wiki/Jiamusi', jpfrom: 'e1942',
    local: 'Jiāmùsī (Kiamusze)',
    note: 'The seat of Sankiang on the Songhua, and the country the Manchukuo settler schemes were pushed into hardest.'
  },
  {
    id: 'yining', en: 'Yīníng (Ining)', ja: '伊寧 (Inei)', zh: '伊寧', lat: 43.91, lon: 81.32,
    wiki: 'https://en.wikipedia.org/wiki/Yining',
    note: 'The Ili valley at the Soviet frontier, where a Turkic rising against Chinese rule broke out in 1944.'
  },
  {
    id: 'shigatse', en: 'Shigatse', lat: 29.27, lon: 88.88,
    wiki: 'https://en.wikipedia.org/wiki/Shigatse',
    note: 'The seat of the Panchen Lama at Tashilhunpo, and the second city of Tibet.'
  },
  {
    id: 'hohhot2', en: 'Éjìnà (Etsina)', ja: '額済納 (Gakusaina)', zh: '額濟納', lat: 41.03,
    lon: 101.05, wiki: 'https://en.wikipedia.org/wiki/Ejin_Banner',
    note: 'The oasis where the Edsin Gol dies in the Gobi, and the seat of the Ejine Torghut banner, administered from Ningxia. Khara-Khoto, the Tangut city Kozlov dug out of the sand in 1908, lies a short way downstream. Nothing to do with Mengchiang: the nearest ground that state put on its own maps is 240 km to the east, and this was never within its reach or Japan\'s.'
  },
  {
    id: 'bombay', en: 'Bombay (Mumbai)', lat: 18.94, lon: 72.83,
    wiki: 'https://en.wikipedia.org/wiki/Mumbai',
    note: 'The Congress passed the Quit India resolution here on 8 August 1942; the arrests began the next morning and the movement was suppressed within weeks.'
  },
  {
    id: 'delhi', en: 'Delhi & New Delhi', lat: 28.61, lon: 77.21,
    note: 'The capital of the Raj from 1911, with New Delhi still being built beside the old city into the 1930s.'
  },
  {
    id: 'karachi', en: 'Karachi', lat: 24.86, lon: 67.01,
    wiki: 'https://en.wikipedia.org/wiki/Karachi',
    note: 'The port of Sind and the airfield on the trunk route from Britain to India and beyond.'
  },
  {
    id: 'lahore', en: 'Lahore', lat: 31.55, lon: 74.34,
    wiki: 'https://en.wikipedia.org/wiki/Lahore',
    note: 'The capital of the Punjab, and the city where the Muslim League passed the Lahore Resolution in March 1940.'
  },
  {
    id: 'amritsar', en: 'Amritsar', lat: 31.63, lon: 74.87,
    wiki: 'https://en.wikipedia.org/wiki/Amritsar',
    note: 'Where troops fired on a penned crowd at Jallianwala Bagh in April 1919, killing several hundred and turning a generation against British rule.'
  },
  {
    id: 'peshawar', en: 'Peshawar', lat: 34.01, lon: 71.58,
    wiki: 'https://en.wikipedia.org/wiki/Peshawar',
    note: 'The garrison city at the mouth of the Khyber, and the base for the frontier campaigns of the 1930s.'
  },
  {
    id: 'quetta', en: 'Quetta', lat: 30.18, lon: 66.99,
    note: 'The Baluchistan garrison and staff college, destroyed by the earthquake of 1935 in which some thirty thousand died.'
  },
  {
    id: 'simla', en: 'Simla (Shimla)', lat: 31.1, lon: 77.17,
    wiki: 'https://en.wikipedia.org/wiki/Shimla',
    note: 'The hill station the Government of India moved to every summer, so that the empire was run for half the year from a ridge in the Himalayan foothills.'
  },
  {
    id: 'lucknow', en: 'Lucknow', lat: 26.85, lon: 80.95,
    wiki: 'https://en.wikipedia.org/wiki/Lucknow',
    note: 'The seat of the United Provinces, and a centre of the Congress and of the Muslim League alike.'
  },
  {
    id: 'cawnpore', en: 'Cawnpore (Kanpur)', lat: 26.45, lon: 80.33,
    wiki: 'https://en.wikipedia.org/wiki/Kanpur',
    note: 'The cotton and leather mills that clothed and shod the Indian Army.'
  },
  {
    id: 'agra', en: 'Agra', lat: 27.18, lon: 78.01, wiki: 'https://en.wikipedia.org/wiki/Agra',
    note: 'On the trunk road and railway of the Gangetic plain.'
  },
  {
    id: 'benares', en: 'Benares (Varanasi)', lat: 25.32, lon: 83.01,
    wiki: 'https://en.wikipedia.org/wiki/Varanasi',
    note: 'The pilgrimage city on the Ganges, and one of the princely states drawn inside the United Provinces on this map.'
  },
  {
    id: 'jaipur', en: 'Jaipur', lat: 26.92, lon: 75.79,
    wiki: 'https://en.wikipedia.org/wiki/Jaipur',
    note: 'The seat of one of the larger Rajputana states, whose ruler kept his throne under treaty with the Crown.'
  },
  {
    id: 'ahmedabad', en: 'Ahmedabad', lat: 23.03, lon: 72.58,
    wiki: 'https://en.wikipedia.org/wiki/Ahmedabad',
    note: 'The mill city of Gujarat, and where Gandhi\'s Sabarmati ashram stood; the Salt March set out from it in March 1930.'
  },
  {
    id: 'nagpur', en: 'Nagpur', lat: 21.15, lon: 79.09,
    wiki: 'https://en.wikipedia.org/wiki/Nagpur',
    note: 'The seat of the Central Provinces, and the junction of the north–south and east–west trunk lines.'
  },
  {
    id: 'poona', en: 'Poona (Pune)', lat: 18.52, lon: 73.86,
    wiki: 'https://en.wikipedia.org/wiki/Pune',
    note: 'The Deccan garrison town. Gandhi was interned in the Aga Khan\'s palace here from August 1942, and his wife died in it.'
  },
  {
    id: 'hyderabaddn', en: 'Hyderabad', lat: 17.38, lon: 78.49,
    wiki: 'https://en.wikipedia.org/wiki/Hyderabad',
    note: 'The Nizam\'s capital, seat of the largest princely state by population and revenue, with its own army, currency and railway.'
  },
  {
    id: 'bangalore', en: 'Bangalore (Bengaluru)', lat: 12.97, lon: 77.59,
    wiki: 'https://en.wikipedia.org/wiki/Bengaluru',
    note: 'A cantonment and, by the war, the site of India\'s first aircraft factory.'
  },
  {
    id: 'mysorecity', en: 'Mysore', lat: 12.3, lon: 76.64,
    wiki: 'https://en.wikipedia.org/wiki/Mysore',
    note: 'The seat of one of the largest and best-run princely states, whose ruler kept his throne under treaty with the Crown.'
  },
  {
    id: 'cochin', en: 'Cochin (Kochi)', lat: 9.93, lon: 76.27,
    wiki: 'https://en.wikipedia.org/wiki/Kochi',
    note: 'The old spice port of the Malabar coast, with a Portuguese, then Dutch, then British history behind it.'
  },
  {
    id: 'trivandrum', en: 'Trivandrum (Thiruvananthapuram)', lat: 8.52, lon: 76.94,
    wiki: 'https://en.wikipedia.org/wiki/Thiruvananthapuram',
    note: 'The seat of Travancore, the princely state of the far south-west.'
  },
  {
    id: 'vizag', en: 'Vizagapatam (Visakhapatnam)', lat: 17.69, lon: 83.22,
    wiki: 'https://en.wikipedia.org/wiki/Visakhapatnam',
    note: 'The east-coast port, shelled from the sea by a Japanese submarine in April 1942.'
  },
  {
    id: 'chittagong', en: 'Chittagong', lat: 22.36, lon: 91.78,
    wiki: 'https://en.wikipedia.org/wiki/Chittagong',
    note: 'The port of eastern Bengal and the base of the Arakan front, through which the supplies for the Burma campaign came.'
  },
  {
    id: 'trincomalee', en: 'Trincomalee', lat: 8.59, lon: 81.21,
    wiki: 'https://en.wikipedia.org/wiki/Trincomalee',
    note: 'One of the finest natural harbours in Asia and the Eastern Fleet\'s base, raided by Japanese carriers in April 1942.'
  },
  {
    id: 'akyab', en: 'Akyab (Sittwe)', lat: 20.15, lon: 92.9,
    wiki: 'https://en.wikipedia.org/wiki/Sittwe',
    note: 'The port of Arakan, taken in 1942 and the objective of three Allied offensives before it was retaken in January 1945.'
  },
  {
    id: 'lashio', en: 'Lashio', lat: 22.94, lon: 97.75,
    wiki: 'https://en.wikipedia.org/wiki/Lashio',
    note: 'The railhead where the Burma Road began its climb to Yunnan, and the reason the road could be cut by taking one town.'
  },
  {
    id: 'myitkyina', en: 'Myitkyina', lat: 25.38, lon: 97.4,
    wiki: 'https://en.wikipedia.org/wiki/Myitkyina',
    note: 'The northern railhead and airfield, taken in May 1942 and retaken in August 1944 after a siege that opened the road to China.'
  },
  {
    id: 'jogjakarta', en: 'Jogjakarta (Yogyakarta)', ja: 'ジョクジャカルタ', lat: -7.8, lon: 110.37,
    wiki: 'https://en.wikipedia.org/wiki/Yogyakarta',
    note: 'The sultanate left under its own ruler by the Dutch, and a centre of the nationalist movement that declared independence in 1945.'
  },
  {
    id: 'soerakarta', en: 'Soerakarta (Surakarta, Solo)', ja: 'スラカルタ', lat: -7.57, lon: 110.83,
    wiki: 'https://en.wikipedia.org/wiki/Surakarta',
    note: 'The other princely land of central Java, ruled by its susuhunan under Dutch oversight.'
  },
  {
    id: 'buitenzorg', en: 'Buitenzorg (Bogor)', ja: 'ボイテンゾルグ', lat: -6.6, lon: 106.8,
    wiki: 'https://en.wikipedia.org/wiki/Bogor',
    note: 'The governor-general\'s seat in the hills, and its botanical garden, which was the scientific centre of the colony.'
  },
  {
    id: 'cheribon', en: 'Cheribon (Cirebon)', ja: 'チレボン', lat: -6.71, lon: 108.55,
    wiki: 'https://en.wikipedia.org/wiki/Cirebon',
    note: 'A north-coast sugar port on the Java trunk railway, and the seat of one of the island\'s residencies.'
  },
  {
    id: 'malang', en: 'Malang', ja: 'マラン', lat: -7.98, lon: 112.63,
    wiki: 'https://en.wikipedia.org/wiki/Malang',
    note: 'The hill town of east Java, and a Dutch garrison and air base.'
  },
  {
    id: 'padang', en: 'Padang', ja: 'パダン', lat: -0.95, lon: 100.35,
    wiki: 'https://en.wikipedia.org/wiki/Padang',
    note: 'The west Sumatran port, and the way out for those who got away in 1942.'
  },
  {
    id: 'sabang', en: 'Sabang', ja: 'サバン', lat: 5.89, lon: 95.32,
    note: 'A coaling and naval station on an island off the northern tip of Sumatra, commanding the western approach to the Malacca Strait.'
  },
  {
    id: 'pontianak', en: 'Pontianak', ja: 'ポンティアナック', lat: -0.02, lon: 109.34,
    wiki: 'https://en.wikipedia.org/wiki/Pontianak',
    note: 'The west Borneo port, where the Japanese navy executed several thousand people in the Mandor killings of 1943 and 1944.'
  },
  {
    id: 'bandjermasin', en: 'Bandjermasin (Banjarmasin)', ja: 'バンジェルマシン', lat: -3.32,
    lon: 114.59, wiki: 'https://en.wikipedia.org/wiki/Banjarmasin',
    note: 'The south Borneo river port, taken on 10 February 1942 as the advance closed on Java.'
  },
  {
    id: 'tarakan', en: 'Tarakan', ja: 'タラカン', lat: 3.3, lon: 117.59,
    wiki: 'https://en.wikipedia.org/wiki/Tarakan',
    note: 'A small island of oil derricks off north-east Borneo, taken on 11 January 1942 within weeks of the war beginning.'
  },
  {
    id: 'manado', en: 'Menado (Manado)', ja: 'メナド', lat: 1.49, lon: 124.84,
    wiki: 'https://en.wikipedia.org/wiki/Manado',
    note: 'Taken by parachute assault on 11 January 1942, the first Japanese airborne operation of the war.'
  },
  {
    id: 'ambon', en: 'Ambon (Amboina)', ja: 'アンボン', lat: -3.7, lon: 128.18,
    wiki: 'https://en.wikipedia.org/wiki/Ambon_Island',
    note: 'Taken on 3 February 1942. More than three hundred Australian and Dutch prisoners were killed at Laha airfield in the days that followed.'
  },
  {
    id: 'kupang', en: 'Koepang (Kupang)', ja: 'クーパン', lat: -10.17, lon: 123.61,
    wiki: 'https://en.wikipedia.org/wiki/Kupang',
    note: 'Dutch Timor\'s capital, taken on 20 February 1942 with a parachute landing behind the Australian force, which withdrew into the hills of Portuguese Timor.'
  },
  {
    id: 'shijiazhuang', en: 'Shíjiāzhuāng (Shihkiachwang)', ja: '石家荘 (Sekkasō)', zh: '石家莊',
    ko: '스자좡', lat: 38.04, lon: 114.51, wiki: 'https://en.wikipedia.org/wiki/Shijiazhuang',
    note: 'The junction where the Beijing–Hankou trunk line meets the railway west into Shanxi, which is the whole reason for the place: it was a village until the lines came. Fell in October 1937, a fortnight after Baoding.'
  },
  {
    id: 'tanggu', en: 'Tánggū (Tangku)', ja: '塘沽 (Tōko)', zh: '塘沽', ko: '탕구구', lat: 39.00,
    lon: 117.65, wiki: 'https://en.wikipedia.org/wiki/Tanggu,_Tianjin',
    note: 'Tianjin\'s port at the mouth of the Hai. The truce signed here in May 1933 ended the fighting after Rehe and gave north China a demilitarised zone, which Japan spent the next four years pushing into.'
  },
  {
    id: 'sydney', en: 'Sydney', lat: -33.87, lon: 151.21,
    wiki: 'https://en.wikipedia.org/wiki/Sydney',
    note: 'Japanese midget submarines entered the harbour on 31 May 1942 and sank a depot ship — the war\'s closest approach to an Australian city.'
  },
  {
    id: 'brisbane', en: 'Brisbane', lat: -27.47, lon: 153.03,
    wiki: 'https://en.wikipedia.org/wiki/Brisbane',
    note: 'MacArthur\'s General Headquarters for the South West Pacific from 1942, and the base the New Guinea campaign was directed from.'
  },
  {
    id: 'kowloon', en: 'Kowloon', ja: '九龍', zh: '九龍', ko: '가우룽', lat: 22.32, lon: 114.17,
    wiki: 'https://en.wikipedia.org/wiki/Kowloon',
    note: 'The mainland half of the city, and where the December 1941 fighting was decided.'
  },
  {
    id: 'hongkong', en: 'Victoria, Hong Kong', ja: 'ヴィクトリア', zh: '維多利亞城', ko: '빅토리아시티',
    lat: 22.28, lon: 114.16, wiki: 'https://en.wikipedia.org/wiki/Victoria,_Hong_Kong',
    note: 'The largest British city in East Asia and the busiest port on the China coast, attacked on 8 December 1941 and surrendered on Christmas Day. The territory is already drawn; the city is not on the layer at all.'
  },
  {
    id: 'baroda', en: 'Baroda (Vadodara)', lat: 22.31, lon: 73.18,
    wiki: 'https://en.wikipedia.org/wiki/Vadodara',
    note: 'The Gaekwad\'s capital, and one of the best-administered of the princely states: free primary schooling from 1906 and a state bank of its own.'
  },
  {
    id: 'chiba', en: 'Chiba', ja: '千葉中央駅', zh: '千葉', ko: '지바추오역', lat: 35.61, lon: 140.12,
    wiki: 'https://en.wikipedia.org/wiki/Chiba_(city)',
    note: 'The bay city east of Tokyo, with the army\'s railway and engineer schools and, by the war, steelworks on the reclaimed shore.'
  },
  {
    id: 'cholon', en: 'Cholon', lat: 10.75, lon: 106.65,
    wiki: 'https://en.wikipedia.org/wiki/B%C3%ACnh_T%C3%A2y',
    note: 'Saigon’s Chinese twin city, counted separately in the colonial censuses and together with Saigon the largest urban area in Indochina.'
  },
  {
    id: 'changde', en: 'Chángdé (Changteh)', ja: '常徳', zh: '常德', ko: '창더', lat: 29.03,
    lon: 111.7, wiki: 'https://en.wikipedia.org/wiki/Changde',
    note: 'The battle of November–December 1943, and one of the confirmed targets of Unit 731’s plague attacks in 1941.'
  },
  {
    id: 'fukui', en: 'Fukui', zh: '福井', lat: 36.06, lon: 136.22,
    wiki: 'https://en.wikipedia.org/wiki/Fukui_(city)',
    note: 'A textile town on the Japan Sea side, known for habutae silk.'
  },
  {
    id: 'gifu', en: 'Gifu', ja: '岐阜', zh: '岐阜', ko: '기후', lat: 35.42, lon: 136.76,
    wiki: 'https://en.wikipedia.org/wiki/Gifu',
    note: 'Paper lanterns, umbrellas and cormorant fishing on the Nagara, and an aircraft plant by the war.'
  },
  {
    id: 'gwalior', en: 'Gwalior', lat: 26.22, lon: 78.18,
    wiki: 'https://en.wikipedia.org/wiki/Gwalior',
    note: 'The Scindia capital under its fortress rock, and a state that kept its own coinage and railway.'
  },
  {
    id: 'hamamatsu', en: 'Hamamatsu', ja: '浜松', zh: '濱松', ko: '하마마쓰', lat: 34.71, lon: 137.73,
    wiki: 'https://en.wikipedia.org/wiki/Hamamatsu',
    note: 'Aircraft and instrument industry; bombed and shelled from the sea in 1945.'
  },
  {
    id: 'imphalcity', en: 'Imphal', lat: 24.82, lon: 93.94,
    wiki: 'https://en.wikipedia.org/wiki/Imphal',
    note: 'Already a battle marker; also the capital of Manipur state and the town the 1944 fighting was about.'
  },
  {
    id: 'indore', en: 'Indore', lat: 22.72, lon: 75.86,
    wiki: 'https://en.wikipedia.org/wiki/Indore',
    note: 'The Holkar capital, and the cotton and opium market of central India.'
  },
  {
    id: 'jamshedpur', en: 'Jamshedpur', lat: 22.8, lon: 86.18,
    note: 'Tata Iron and Steel: the industrial base of the Indian war effort and the largest steelworks in the British Empire.'
  },
  {
    id: 'jodhpur', en: 'Jodhpur', lat: 26.24, lon: 73.02,
    note: 'The Rathore capital in the Marwar desert, and the state that gave the Indian Army its Jodhpur Lancers.'
  },
  {
    id: 'kabul', en: 'Kabul', lat: 34.53, lon: 69.17,
    note: 'Capital of the one independent state on the map’s western edge, and a centre of Axis and Allied intrigue over the frontier.'
  },
  {
    id: 'kathmandu', en: 'Kathmandu', lat: 27.71, lon: 85.32,
    wiki: 'https://en.wikipedia.org/wiki/Kathmandu',
    note: 'The capital of an independent state the map already draws, and the source of the Gurkha regiments.'
  },
  {
    id: 'kawasaki', en: 'Kawasaki', ja: '川崎区', zh: '川崎區', ko: '가와사키구', lat: 35.53, lon: 139.7,
    wiki: 'https://en.wikipedia.org/wiki/Kawasaki-ku,_Kawasaki',
    note: 'Steel and shipbuilding between Tokyo and Yokohama, some 300,000 people by 1940, and among the most heavily firebombed places in Japan.'
  },
  {
    id: 'kokura', en: 'Kokura', ja: '小倉', zh: '小倉', ko: '고쿠라', lat: 33.88, lon: 130.88,
    wiki: 'https://en.wikipedia.org/wiki/Kokura',
    note: 'Primary target for the second atomic bomb, 9 Aug 1945; cloud cover diverted the mission to Nagasaki. Arsenal city.'
  },
  {
    id: 'kochi', en: 'Kōchi', ja: '高知', zh: '高知', ko: '고치', lat: 33.56, lon: 133.53,
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dchi,_K%C5%8Dchi',
    note: 'The old Tosa domain on the Pacific coast of Shikoku, and the home of much of the Meiji Restoration\'s leadership.'
  },
  {
    id: 'kofu', en: 'Kōfu', ja: '甲府', zh: '甲府', ko: '고후', lat: 35.66, lon: 138.57,
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dfu',
    note: 'The Kōfu basin: vines, orchards and the silk that went out over the pass to Yokohama.'
  },
  {
    id: 'liuzhou', en: 'Liǔzhōu (Liuchow)', ja: '柳州', zh: '柳州', ko: '류저우', lat: 24.31,
    lon: 109.42, wiki: 'https://en.wikipedia.org/wiki/Liuzhou',
    note: 'A principal Fourteenth Air Force base, and with Kweilin the objective of the Ichi-gō offensive of 1944.'
  },
  {
    id: 'luzhou', en: 'Lúzhōu (Luchow)', ja: '瀘州', zh: '瀘州', ko: '루저우', lat: 28.87, lon: 105.44,
    wiki: 'https://en.wikipedia.org/wiki/Luzhou',
    note: 'The Yangtze port below Chongqing where the Tuo river comes in, and a salt and sugar market.'
  },
  {
    id: 'macaucity', en: 'Macao (Cidade do Santo Nome de Deus)', ja: 'マカオ', zh: '澳門', ko: '마카오',
    lat: 22.19, lon: 113.54, wiki: 'https://en.wikipedia.org/wiki/Macau',
    note: 'Neutral Portuguese territory throughout the war; its population several times over as refugees came in from Hong Kong and Canton.'
  },
  {
    id: 'maebashi', en: 'Maebashi', ja: '前橋', zh: '前橋', ko: '마에바시', lat: 36.39, lon: 139.06,
    wiki: 'https://en.wikipedia.org/wiki/Maebashi',
    note: 'The silk-reeling town of Gunma, at the centre of the trade that paid for Japan\'s industrialisation.'
  },
  {
    id: 'moji', en: 'Moji', ja: '門司区', zh: '門司區', ko: '모지구', lat: 33.94, lon: 130.96,
    wiki: 'https://en.wikipedia.org/wiki/Moji-ku,_Kitaky%C5%ABsh%C5%AB',
    note: 'The Kanmon Strait coaling and transhipment port; the embarkation point for the continent.'
  },
  {
    id: 'morioka', en: 'Morioka', ja: '盛岡', zh: '盛岡', ko: '모리오카', lat: 39.7, lon: 141.15,
    wiki: 'https://en.wikipedia.org/wiki/Morioka',
    note: 'The seat of northern Iwate, and iron-casting since the Nanbu domain.'
  },
  {
    id: 'nagano', en: 'Nagano', ja: '長野聖救主教会', lat: 36.65, lon: 138.18,
    wiki: 'https://en.wikipedia.org/wiki/Nagano_Holy_Saviour_Church',
    note: 'The temple town of Zenkōji, and the silk country of the Shinano valleys.'
  },
  {
    id: 'nanchong', en: 'Nánchōng (Nanchung)', ja: '南充', zh: '南充', ko: '난충', lat: 30.8,
    lon: 106.08, wiki: 'https://en.wikipedia.org/wiki/Nanchong',
    note: 'A silk town on the Jialing north of Chongqing, in the Free China interior.'
  },
  {
    id: 'nantong', en: 'Nántōng (Nantung)', ja: '南通', zh: '南通', ko: '난퉁', lat: 32.01,
    lon: 120.86, wiki: 'https://en.wikipedia.org/wiki/Nantong',
    note: 'Zhang Jian\'s cotton mills on the north bank of the Yangtze, the first modern industrial town founded by a Chinese reformer.'
  },
  {
    id: 'otaru', en: 'Otaru', ja: '小樽', zh: '小樽', ko: '오타루', lat: 43.19, lon: 140.99,
    wiki: 'https://en.wikipedia.org/wiki/Otaru',
    note: 'Hokkaidō’s main port and the terminal for the Karafuto and Japan Sea trade.'
  },
  {
    id: 'patna', en: 'Patna', lat: 25.61, lon: 85.14,
    wiki: 'https://en.wikipedia.org/wiki/Patna',
    note: 'The seat of Bihar on the Ganges, and the old Mauryan capital of Pataliputra beneath it.'
  },
  {
    id: 'sakai', en: 'Sakai', ja: '堺市', zh: '堺市', lat: 34.57, lon: 135.48,
    wiki: 'https://en.wikipedia.org/wiki/Sakai',
    note: 'The free port that armed the sixteenth-century wars and, by the 1930s, an industrial suburb of Osaka.'
  },
  {
    id: 'shizuoka', en: 'Shizuoka', ja: '静岡市中央体育館', lat: 34.98, lon: 138.38,
    wiki: 'https://en.wikipedia.org/wiki/Shizuoka_City_Central_Gymnasium',
    note: 'Tea and mandarins, and the port of Shimizu that shipped both.'
  },
  {
    id: 'shaoxing', en: 'Shàoxīng (Shaohing)', ja: '紹興', zh: '紹興', ko: '사오싱', lat: 30.0,
    lon: 120.58, wiki: 'https://en.wikipedia.org/wiki/Shaoxing',
    note: 'Rice wine, and the town Lu Xun came from; taken in 1941.'
  },
  {
    id: 'srinagar', en: 'Srinagar', lat: 34.08, lon: 74.8,
    wiki: 'https://en.wikipedia.org/wiki/Srinagar',
    note: 'The summer capital of Kashmir, the largest princely state by area — a Hindu dynasty ruling a Muslim majority, which is the whole of the later quarrel in one sentence.'
  },
  {
    id: 'takamatsu', en: 'Takamatsu', ja: '高松', zh: '高松', ko: '다카마쓰', lat: 34.34, lon: 134.05,
    wiki: 'https://en.wikipedia.org/wiki/Takamatsu',
    note: 'The castle port of Shikoku facing the Inland Sea, and the ferry crossing to Honshū.'
  },
  {
    id: 'thonburi', en: 'Thonburi', lat: 13.72, lon: 100.49,
    wiki: 'https://en.wikipedia.org/wiki/Thonburi',
    note: 'Bangkok’s twin across the river, a separate province and separately enumerated until 1971.'
  },
  {
    id: 'tokushima', en: 'Tokushima', ja: '徳島', zh: '德島', ko: '도쿠시마', lat: 34.07, lon: 134.55,
    wiki: 'https://en.wikipedia.org/wiki/Tokushima_(city)',
    note: 'Indigo, the crop that made the old Awa domain rich, on the Shikoku side of the Naruto strait.'
  },
  {
    id: 'toyama', en: 'Toyama', ja: '富山駅', zh: '富山', ko: '도야마역', lat: 36.7, lon: 137.21,
    wiki: 'https://en.wikipedia.org/wiki/Toyama_(city)',
    note: 'The 1–2 August 1945 firebombing destroyed about 99% of the built-up area, the highest destruction rate of any Japanese city.'
  },
  {
    id: 'toyohashi', en: 'Toyohashi', ja: '豊橋', zh: '豐橋', ko: '도요하시', lat: 34.77, lon: 137.39,
    wiki: 'https://en.wikipedia.org/wiki/Toyohashi',
    note: 'A garrison and silk town on the Tōkaidō between Nagoya and Shizuoka.'
  },
  {
    id: 'utsunomiya', en: 'Utsunomiya', ja: '宇都宮', zh: '宇都宮', ko: '우쓰노미야', lat: 36.56,
    lon: 139.88, wiki: 'https://en.wikipedia.org/wiki/Utsunomiya',
    note: 'The garrison town north of Tokyo on the road to Nikkō.'
  },
  {
    id: 'wakayama', en: 'Wakayama', ja: '和歌山', zh: '和歌山', ko: '와카야마', lat: 34.23, lon: 135.17,
    wiki: 'https://en.wikipedia.org/wiki/Wakayama_(city)',
    note: 'The old Kii domain south of Osaka, with cotton mills and the mikan orchards behind it.'
  },
  {
    id: 'yawata', en: 'Yawata (Yahata)', ko: '야하타', lat: 33.86, lon: 130.81,
    wiki: 'https://en.wikipedia.org/wiki/Yahata,_Fukuoka',
    note: 'Imperial Steel Works, the centre of Japanese heavy industry, and the target of the first B-29 raid on the home islands, 15 June 1944.'
  },
  {
    id: 'yangzhou', en: 'Yángzhōu (Yangchow)', ja: '揚州', zh: '揚州', ko: '양저우', lat: 32.39,
    lon: 119.42, wiki: 'https://en.wikipedia.org/wiki/Yangzhou',
    note: 'The salt-merchant city where the Grand Canal meets the Yangtze, long past its eighteenth-century wealth.'
  },
  {
    id: 'zamboanga', en: 'Zamboanga', lat: 6.91, lon: 122.08,
    wiki: 'https://en.wikipedia.org/wiki/Zamboanga_(province)',
    note: 'The old Spanish fort at the tip of the Mindanao peninsula, and the seat of the Moro Province.'
  },
  {
    id: 'zigong', en: 'Zìgòng (Tzukung)', lat: 29.34, lon: 104.78,
    wiki: 'https://en.wikipedia.org/wiki/Zigong',
    note: 'The salt wells that supplied wartime free China after the coastal salt was lost.'
  },
  {
    id: 'oita', en: 'Ōita', ja: '大分県', zh: '大分縣', ko: '오이타현', lat: 33.24, lon: 131.61,
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cita_Prefecture',
    note: 'The hot-spring country of eastern Kyūshū, and a port facing the Inland Sea.'
  },
  {
    id: 'omuta', en: 'Ōmuta', ja: '大牟田', zh: '大牟田', ko: '오무타', lat: 33.03, lon: 130.45,
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cmuta,_Fukuoka',
    note: 'The Miike coal mines: Mitsui’s largest pit, worked by Korean, Chinese and Allied prisoner labour.'
  },
  {
    id: 'akita', en: 'Akita', ja: '秋田市八橋運動公園球技場', zh: '八橋球技場', lat: 39.72, lon: 140.1,
    wiki: 'https://en.wikipedia.org/wiki/Akita_Sports_Plus_ASP_Stadium',
    note: 'Rice, sake and the Kosaka copper mines behind it, on the Japan Sea coast.'
  },
  {
    id: 'aleksandrovsk', en: 'Aleksandrovsk-Sakhalinsky', ja: 'アレクサンドロフスク・サハリンスキー',
    zh: '薩哈林島亞歷山德羅夫斯克', ko: '알렉산드롭스크사할린스키', lat: 50.9, lon: 142.16,
    wiki: 'https://en.wikipedia.org/wiki/Alexandrovsk-Sakhalinsky_(town)',
    note: 'The capital of Soviet northern Sakhalin, occupied by Japan 1920–25 in reprisal for Nikolaevsk.'
  },
  {
    id: 'alorsetar', en: 'Alor Setar', lat: 6.12, lon: 100.37,
    wiki: 'https://en.wikipedia.org/wiki/Alor_Setar',
    note: 'State capital, and one of the four states transferred to Thailand in 1943.'
  },
  {
    id: 'amagasaki', en: 'Amagasaki', ja: '尼崎', zh: '尼崎', ko: '아마가사키', lat: 34.73, lon: 135.41,
    wiki: 'https://en.wikipedia.org/wiki/Amagasaki',
    note: 'Steel, chemicals and shipyards on the Osaka bay shore — the western end of the Hanshin industrial belt, and heavily bombed for it.'
  },
  {
    id: 'angeles', en: 'Angeles (Clark Field)', lat: 15.15, lon: 120.59,
    wiki: 'https://en.wikipedia.org/wiki/Angeles_City',
    note: 'Clark Field, destroyed on the ground on 8 December 1941.'
  },
  {
    id: 'aparri', en: 'Aparri', lat: 18.36, lon: 121.64,
    wiki: 'https://en.wikipedia.org/wiki/Aparri',
    note: 'The first Japanese landing in the Philippines, 10 December 1941.'
  },
  {
    id: 'apia', en: 'Apia', lat: -13.83, lon: -171.77,
    wiki: 'https://en.wikipedia.org/wiki/Apia',
    note: 'Optional, and off the present frame: a New Zealand mandate and an American garrison base.'
  },
  {
    id: 'asahikawa', en: 'Asahikawa', ja: '旭川', zh: '旭川', ko: '아사히카와', lat: 43.77, lon: 142.36,
    wiki: 'https://en.wikipedia.org/wiki/Asahikawa',
    note: 'The garrison town of northern Hokkaidō and home of the 7th Division, which was destroyed on Attu in 1943.'
  },
  {
    id: 'ayutthaya', en: 'Ayutthaya', lat: 14.35, lon: 100.58,
    wiki: 'https://en.wikipedia.org/wiki/Phra_Nakhon_Si_Ayutthaya_province',
    note: 'The Siamese capital for four centuries until the Burmese sacked it in 1767, after which the court moved downriver to Bangkok.'
  },
  {
    id: 'bacolod', en: 'Bacolod', lat: 10.67, lon: 122.95,
    wiki: 'https://en.wikipedia.org/wiki/Bacolod',
    note: 'The sugar capital of Negros, and the centre of the plantation economy of the Visayas.'
  },
  {
    id: 'bassein', en: 'Bassein (Pathein)', lat: 16.78, lon: 94.73,
    wiki: 'https://en.wikipedia.org/wiki/Shwemokhtaw_Pagoda',
    note: 'The delta rice port west of Rangoon, and one of the outlets of the Irrawaddy crop.'
  },
  {
    id: 'battambang', en: 'Battambang', lat: 13.1, lon: 103.2,
    wiki: 'https://en.wikipedia.org/wiki/Battambang',
    note: 'Capital of the province Thailand took in 1941 and the map already draws as ceded.'
  },
  {
    id: 'bengkulu', en: 'Benkoelen (Bengkulu)', lat: -3.79, lon: 102.26,
    wiki: 'https://en.wikipedia.org/wiki/Bengkulu',
    note: 'The old British pepper post on the west coast of Sumatra, and where the Dutch held Sukarno in exile from 1938 until the Japanese came.'
  },
  {
    id: 'betio', en: 'Betio (Tarawa)', lat: 1.36, lon: 172.92,
    wiki: 'https://en.wikipedia.org/wiki/Betio',
    note: 'Already a battle marker; the settlement and the colony’s administrative centre.'
  },
  {
    id: 'bhamo', en: 'Bhamo', lat: 24.26, lon: 97.23,
    wiki: 'https://en.wikipedia.org/wiki/Bhamo',
    note: 'On the Burma Road and the Ledo Road’s junction with it.'
  },
  {
    id: 'bhopal', en: 'Bhopal', lat: 23.26, lon: 77.41,
    wiki: 'https://en.wikipedia.org/wiki/Bhopal',
    note: 'The largest of the Muslim-ruled states after Hyderabad, and governed by four successive women rulers between 1819 and 1926.'
  },
  {
    id: 'blagoveshchensk', en: 'Blagoveshchensk', ja: 'ブラゴヴェシチェンスク', zh: '海蘭泡', lat: 50.28,
    lon: 127.54, wiki: 'https://en.wikipedia.org/wiki/Blagoveshchensk',
    note: 'The Soviet city on the Amur, facing Heihe across the river — the two sat in sight of each other with the frontier between them.'
  },
  {
    id: 'broome', en: 'Broome', lat: -17.96, lon: 122.24,
    wiki: 'https://en.wikipedia.org/wiki/Anglican_Church_of_the_Annunciation,_Broome',
    note: 'The refugee air route out of Java, and the raid of 3 March 1942 that killed evacuees in the flying boats.'
  },
  {
    id: 'buin', en: 'Buin (Bougainville)', lat: -6.74, lon: 155.72,
    wiki: 'https://en.wikipedia.org/wiki/Buin,_Papua_New_Guinea',
    note: 'The airfield off which Yamamoto was shot down on 18 April 1943.'
  },
  {
    id: 'benxi', en: 'Běnxī (Penhsihu)', ja: '本渓', zh: '本溪', ko: '번시', lat: 41.29, lon: 123.77,
    wiki: 'https://en.wikipedia.org/wiki/Benxi', jpfrom: 'e1942',
    note: 'Iron and coal; the Penhsihu colliery explosion of 1942 killed over 1,500 miners, the worst in history.'
  },
  {
    id: 'cabanatuan', en: 'Cabanatuan', lat: 15.49, lon: 120.97,
    wiki: 'https://en.wikipedia.org/wiki/Cabanatuan',
    note: 'The largest American prisoner-of-war camp in the Pacific, and the raid that emptied it in January 1945.'
  },
  {
    id: 'cagayandeoro', en: 'Cagayan de Misamis', lat: 8.48, lon: 124.65,
    wiki: 'https://en.wikipedia.org/wiki/Cagayan_de_Oro',
    note: 'Where MacArthur was flown out of the Philippines in March 1942.'
  },
  {
    id: 'camranh', en: 'Cam Ranh', lat: 11.92, lon: 109.16,
    wiki: 'https://en.wikipedia.org/wiki/Cam_Ranh',
    note: 'The anchorage where the invasion convoys for Malaya and the Indies assembled in December 1941.'
  },
  {
    id: 'canberra', en: 'Canberra', lat: -35.28, lon: 149.13,
    wiki: 'https://en.wikipedia.org/wiki/Canberra',
    note: 'The federal capital, laid out on open ground in 1913 and still half-built in 1942; the war was run from Melbourne and Brisbane rather than here.'
  },
  {
    id: 'capas', en: 'Capas (Camp O’Donnell)', lat: 15.33, lon: 120.59,
    wiki: 'https://en.wikipedia.org/wiki/Capas',
    note: 'The end of the Bataan Death March, where thousands more died in the weeks that followed.'
  },
  {
    id: 'changhua', en: 'Shōka (Zhanghua, Changhua)', ja: '彰化', zh: '彰化', ko: '장화', lat: 24.08,
    lon: 120.54, wiki: 'https://en.wikipedia.org/wiki/Changhua',
    local: 'Zhanghua (Shōka, Changhua)',
    note: 'On the Taiwan trunk railway at the foot of Baguashan, in the centre of the rice and sugar plain.'
  },
  {
    id: 'chifeng', en: 'Chifeng (Ulanhad)', ja: '赤峰', zh: '赤峰', ko: '츠펑', lat: 42.26,
    lon: 118.89, wiki: 'https://en.wikipedia.org/wiki/Chifeng', jpfrom: 'e1942',
    note: 'The Mongol trade town in western Rehe, on the road from the Wall to the steppe.'
  },
  {
    id: 'chinju', en: 'Shinshū (Chinju)', ko: '진주', lat: 35.19, lon: 128.08,
    wiki: 'https://en.wikipedia.org/wiki/Jinju', local: 'Chinju (Shinshū)',
    note: 'The seat of South Kyŏngsang until 1925, and the site of one of the great sieges of the Japanese invasions of the 1590s.'
  },
  {
    id: 'chita', en: 'Chita', lat: 52.03, lon: 113.5,
    wiki: 'https://en.wikipedia.org/wiki/Chita_Oblast',
    note: 'Headquarters of the Trans-Baikal Front, and the capital of the Far Eastern Republic 1920–22.'
  },
  {
    id: 'choibalsan', en: 'Choibalsan', lat: 48.07, lon: 114.54,
    wiki: 'https://en.wikipedia.org/wiki/Choibalsan_Thermal_Power_Plant',
    note: 'The Soviet and Mongolian supply base for Khalkhin Gol, and the railhead the campaign of 1939 was run from.'
  },
  {
    id: 'quanzhou', en: 'Chüanchow (Quanzhou)', ja: '泉州', zh: '泉州', ko: '취안저우', lat: 24.87,
    lon: 118.68, wiki: 'https://en.wikipedia.org/wiki/Quanzhou',
    note: 'The medieval port foreign traders knew as Zaiton, and the home district of much of the Chinese population of Southeast Asia.'
  },
  {
    id: 'chonju', en: 'Zenshū (Chŏnju)', ja: '全州', zh: '全州', ko: '전주', lat: 35.82, lon: 127.15,
    wiki: 'https://en.wikipedia.org/wiki/Jeonju', local: 'Chŏnju (Zenshū)',
    note: 'The seat of North Chŏlla and the old Chosŏn dynasty\'s ancestral home, in the rice country of the south-west.'
  },
  {
    id: 'chunchon', en: 'Shunsen (Ch’unch’ŏn)', ja: '春川', zh: '春川', ko: '춘천', lat: 37.88,
    lon: 127.73, wiki: 'https://en.wikipedia.org/wiki/Chuncheon', local: 'Ch’unch’ŏn (Shunsen)',
    note: 'The seat of Kangwŏn, in the lake and mountain country east of Seoul.'
  },
  {
    id: 'chongju', en: 'Seishū (Ch’ŏngju)', ja: '清州', zh: '清州', ko: '청주', lat: 36.64,
    lon: 127.49, wiki: 'https://en.wikipedia.org/wiki/Cheongju', local: 'Ch’ŏngju (Seishū)',
    note: 'The seat of North Ch\'ungch\'ŏng, on the road and rail line south from Seoul.'
  },
  {
    id: 'yapcolonia', en: 'Colonia (Yap)', lat: 9.51, lon: 138.13,
    wiki: 'https://en.wikipedia.org/wiki/Colonia,_Federated_States_of_Micronesia',
    note: 'The administrative town of Yap, and the cable station that was argued over between Japan and the United States in the 1920s.'
  },
  {
    id: 'cuttack', en: 'Cuttack', lat: 20.46, lon: 85.88,
    wiki: 'https://en.wikipedia.org/wiki/Cuttack',
    note: 'The seat of Orissa on the Mahanadi delta, and the province\'s old capital before Bhubaneswar was built.'
  },
  {
    id: 'dalat', en: 'Dalat', lat: 11.94, lon: 108.44,
    wiki: 'https://en.wikipedia.org/wiki/Dalat_Palace_Hotel',
    note: 'The hill station the French built as a retreat from the delta heat, and where the administration went in summer.'
  },
  {
    id: 'denpasar', en: 'Denpasar (Bali)', lat: -8.65, lon: 115.22,
    wiki: 'https://en.wikipedia.org/wiki/Denpasar',
    note: 'The southern Balinese court town, and where the Dutch conquest ended in the mass suicide of the royal house in 1906.'
  },
  {
    id: 'digboi', en: 'Digboi', lat: 27.39, lon: 95.62,
    wiki: 'https://en.wikipedia.org/wiki/Digboi',
    note: 'India’s oilfield and refinery, and the fuel behind the Assam front.'
  },
  {
    id: 'duolun', en: 'Dolonnor (Duolun)', zh: '多倫諾爾鎮', lat: 42.19, lon: 116.47,
    wiki: 'https://en.wikipedia.org/wiki/Dolon_Nor', jpfrom: 'e1942',
    note: 'Taken in 1933 and a staging point for the push into Inner Mongolia.'
  },
  {
    id: 'dublon', en: 'Dublon (Tonoas), Truk', lat: 7.36, lon: 151.87,
    wiki: 'https://en.wikipedia.org/wiki/Tonowas',
    note: 'The naval town and headquarters of the Combined Fleet’s great anchorage.'
  },
  {
    id: 'esutoru', en: 'Esutoru (Uglegorsk)', lat: 49.08, lon: 142.07,
    wiki: 'https://en.wikipedia.org/wiki/Uglegorsk,_Sakhalin_Oblast',
    note: 'Pulp and coal town, the largest settlement of northern Karafuto.'
  },
  {
    id: 'etajima', en: 'Etajima', ja: '江田島', zh: '江田島', ko: '에타지마섬', lat: 34.23, lon: 132.46,
    wiki: 'https://en.wikipedia.org/wiki/Etajima',
    note: 'The Imperial Naval Academy, on an island in the Inland Sea, through which almost every Japanese admiral of the war had passed.'
  },
  {
    id: 'zhanjiang', en: 'Fort Bayard (Zhanjiang)', lat: 21.27, lon: 110.36,
    wiki: 'https://en.wikipedia.org/wiki/Zhanjiang',
    note: 'The capital of the French leased territory the map already draws, and the smuggling channel into free China until the Japanese took it in February 1943.'
  },
  {
    id: 'fukushima', en: 'Fukushima', ja: '福島', zh: '福島', ko: '후쿠시마', lat: 37.76, lon: 140.47,
    wiki: 'https://en.wikipedia.org/wiki/Fukushima_(city)',
    note: 'Silk-reeling and the orchards of the Fukushima basin, on the northern trunk railway.'
  },
  {
    id: 'chichijima', en: 'Futami (Chichijima)', lat: 27.09, lon: 142.19,
    wiki: 'https://en.wikipedia.org/wiki/Chichijima_Airfield',
    note: 'The administrative centre of the Bonins and a fortified base; the Chichijima incident of 1944–45.'
  },
  {
    id: 'fuxin', en: 'Fùxīn (Fuhsin)', ja: '阜新', zh: '阜新', ko: '푸신', lat: 42.02, lon: 121.67,
    wiki: 'https://en.wikipedia.org/wiki/Fuxin', jpfrom: 'e1942',
    note: 'Open-cast coal in western Manchuria, worked largely by conscripted Chinese labour under the South Manchuria Railway.'
  },
  {
    id: 'gangtok', en: 'Gangtok', lat: 27.33, lon: 88.61,
    wiki: 'https://en.wikipedia.org/wiki/Gangtok',
    note: 'The Sikkimese capital on the trade road to Tibet, through which the wool and the mule caravans came over the Nathu La.'
  },
  {
    id: 'garapan', en: 'Garapan (Saipan)', lat: 15.21, lon: 145.72,
    wiki: 'https://en.wikipedia.org/wiki/Garapan,_Saipan',
    note: 'The largest Japanese town in Micronesia, about 15,000 people and the administrative and sugar capital of the Marianas, destroyed in the battle of June 1944. Saipan is a battle marker; the town is not on the layer.'
  },
  {
    id: 'gyantse', en: 'Gyantse', lat: 28.95, lon: 89.6,
    wiki: 'https://en.wikipedia.org/wiki/Gyantse',
    note: 'The British trade agency and garrison, the furthest permanent British presence in Tibet.'
  },
  {
    id: 'ganzhou', en: 'Gànzhōu (Kanchow)', ja: '贛州', zh: '贛州', ko: '간저우', lat: 25.83,
    lon: 114.93, wiki: 'https://en.wikipedia.org/wiki/Ganzhou',
    note: 'Where Chiang Ching-kuo ran southern Jiangxi from 1939 to 1945, and made the reputation that carried him later.'
  },
  {
    id: 'haeju', en: 'Kaishū (Haeju)', ja: '海州', zh: '海州', ko: '해주', lat: 38.04, lon: 125.71,
    wiki: 'https://en.wikipedia.org/wiki/Haeju', local: 'Haeju (Kaishū)',
    note: 'The seat of Hwanghae, and the port for the wheat and iron of the west coast.'
  },
  {
    id: 'haikou', en: 'Haikou (Kiungchow)', lat: 20.04, lon: 110.34,
    wiki: 'https://en.wikipedia.org/wiki/Haikou',
    note: 'Hainan was occupied in February 1939 and the map marks the landing; the island’s only real town is not on the layer.'
  },
  {
    id: 'hailar', en: 'Hailar', ja: 'ハイラル区', zh: '海拉爾', ko: '하이라얼구', lat: 49.2, lon: 119.7,
    wiki: 'https://en.wikipedia.org/wiki/Hailar_District', jpfrom: 'e1942',
    note: 'The Hulunbuir garrison and fortified zone facing Mongolia; the base for the Nomonhan fighting.'
  },
  {
    id: 'hami', en: 'Hami (Kumul)', lat: 42.83, lon: 93.51,
    wiki: 'https://en.wikipedia.org/wiki/Hami',
    note: 'The gate between Sinkiang and Kansu, and the terminus of the Soviet supply road into China.'
  },
  {
    id: 'heihe', en: 'Heihe (Sakhalyan/Aigun)', ja: '黒河', zh: '黑河', ko: '헤이허', lat: 50.25,
    lon: 127.53, wiki: 'https://en.wikipedia.org/wiki/Heihe', jpfrom: 'e1942',
    note: 'The Amur crossing facing Blagoveshchensk, and the northern end of the Manchurian frontier the Kwantung Army fortified.'
  },
  {
    id: 'hitachi', en: 'Hitachi', ja: '日立', zh: '日立', ko: '히타치', lat: 36.6, lon: 140.65,
    wiki: 'https://en.wikipedia.org/wiki/Hitachi,_Ibaraki',
    note: 'Heavy electrical works; shelled from the sea in July 1945.'
  },
  {
    id: 'hollandia', en: 'Hollandia (Jayapura)', lat: -2.53, lon: 140.72,
    wiki: 'https://en.wikipedia.org/wiki/Jayapura',
    note: 'MacArthur’s landing of 22 April 1944, which leapfrogged the Japanese Eighteenth Army, and afterwards his headquarters.'
  },
  {
    id: 'handan', en: 'Hándān', ja: '邯鄲', zh: '邯鄲', ko: '한단', lat: 36.63, lon: 114.54,
    wiki: 'https://en.wikipedia.org/wiki/Handan',
    note: 'A junction on the Beijing–Hankou railway in southern Hebei, in the country the base areas worked.'
  },
  {
    id: 'hungnam', en: 'Kōnan (Hŭngnam)', ja: '興南区域', zh: '興南區域', ko: '흥남구역', lat: 39.83,
    lon: 127.62, wiki: 'https://en.wikipedia.org/wiki/Hungnam', local: 'Hŭngnam (Kōnan)',
    note: 'Noguchi Jun’s chemical combine, the largest industrial complex in the empire outside Japan, built on Korean and later forced labour.'
  },
  {
    id: 'ise', en: 'Ise (Uji-Yamada)', ja: '伊勢国', zh: '伊勢國', ko: '이세국', lat: 34.49, lon: 136.71,
    wiki: 'https://en.wikipedia.org/wiki/Ise_Province',
    note: 'The Ise Grand Shrine, the ritual centre of the state cult.'
  },
  {
    id: 'jaluit', en: 'Jaluit', lat: 5.92, lon: 169.64,
    note: 'The administrative seat of the Marshalls under the Germans and then the Japanese, bypassed in 1944 and left to starve.'
  },
  {
    id: 'jambi', en: 'Jambi', lat: -1.61, lon: 103.61,
    note: 'A river port and oilfield south of Palembang, on the same Sumatran field.'
  },
  {
    id: 'jolo', en: 'Jolo', lat: 6.05, lon: 121.0,
    note: 'The Sulu sultanate\'s seat, and the ground of the longest resistance to American rule in the Philippines.'
  },
  {
    id: 'kanchanaburi', en: 'Kanchanaburi', lat: 14.02, lon: 99.53,
    wiki: 'https://en.wikipedia.org/wiki/Kanchanaburi',
    note: 'The eastern end of the Burma–Siam railway, the bridge over the Khwae Yai, and the largest of the prisoner-of-war camps.'
  },
  {
    id: 'kandy', en: 'Kandy', lat: 7.29, lon: 80.64,
    wiki: 'https://en.wikipedia.org/wiki/Kandy',
    note: 'South East Asia Command’s headquarters from April 1944 — Mountbatten’s seat and the place the Southeast Asian war was directed from.'
  },
  {
    id: 'kangar', en: 'Kangar', lat: 6.44, lon: 100.2,
    wiki: 'https://en.wikipedia.org/wiki/Kangar',
    note: 'The seat of Perlis, the smallest of the Malay states, transferred to Thailand in 1943 and returned in 1945.'
  },
  {
    id: 'kavieng', en: 'Kavieng', lat: -2.58, lon: 150.8,
    wiki: 'https://en.wikipedia.org/wiki/Kavieng',
    note: 'The New Ireland anchorage that with Rabaul made the northern hinge of the Bismarcks position, bypassed and bombed from 1943.'
  },
  {
    id: 'kendari', en: 'Kendari', lat: -3.97, lon: 122.51,
    wiki: 'https://en.wikipedia.org/wiki/Kendari',
    note: 'The airfield taken in January 1942 — the best in the Indies, and the base from which Java and Darwin were bombed.'
  },
  {
    id: 'kengtung', en: 'Kengtung', lat: 21.3, lon: 99.6,
    wiki: 'https://en.wikipedia.org/wiki/Kengtung',
    note: 'The capital of the trans-Salween Shan states the map already draws as Thai-administered.'
  },
  {
    id: 'khotan', en: 'Khotan (Hotan)', lat: 37.11, lon: 79.93,
    wiki: 'https://en.wikipedia.org/wiki/Hotan',
    note: 'The jade and silk oasis on the southern rim of the Tarim, and a centre of the 1933 Turkic republic.'
  },
  {
    id: 'kolonia', en: 'Kolonia (Ponape)', lat: 6.96, lon: 158.21,
    wiki: 'https://en.wikipedia.org/wiki/Kolonia',
    note: 'The administrative town of Ponape, with a Japanese agricultural station and the ruins of Nan Madol beyond it.'
  },
  {
    id: 'kongju', en: 'Kōshū (Kongju)', ja: '公州', zh: '公州', ko: '공주', lat: 36.45, lon: 127.12,
    wiki: 'https://en.wikipedia.org/wiki/Gongju', local: 'Kongju (Kōshū)',
    note: 'Capital of South Ch’ungch’ŏng until 1932, when the seat moved to Taejŏn.'
  },
  {
    id: 'kotabharu_c', en: 'Kota Bharu', lat: 6.13, lon: 102.24,
    wiki: 'https://en.wikipedia.org/wiki/Kota_Bharu',
    note: 'Already a battle marker for the first landing of the Pacific War; also a state capital, and one of the four states transferred to Thailand in 1943.'
  },
  {
    id: 'kualalipis', en: 'Kuala Lipis', lat: 4.18, lon: 102.05,
    wiki: 'https://en.wikipedia.org/wiki/Kuala_Lipis',
    note: 'The seat of Pahang, chosen because it sat on the railway rather than because anyone lived there.'
  },
  {
    id: 'kualaterengganu', en: 'Kuala Terengganu', lat: 5.33, lon: 103.14,
    wiki: 'https://en.wikipedia.org/wiki/Kuala_Terengganu',
    note: 'The seat of Trengganu, one of the four northern states handed to Thailand in 1943 and returned in 1945.'
  },
  {
    id: 'kuantan', en: 'Kuantan', lat: 3.81, lon: 103.33,
    wiki: 'https://en.wikipedia.org/wiki/Kuantan',
    note: 'The landing of 8 December 1941, and the sea off it where Prince of Wales and Repulse were sunk on the 10th.'
  },
  {
    id: 'kunsan', en: 'Gunzan (Kunsan)', ja: '群山', zh: '群山', ko: '군산', lat: 35.98, lon: 126.72,
    wiki: 'https://en.wikipedia.org/wiki/Gunsan', local: 'Kunsan (Gunzan)',
    note: 'The rice port: the outlet through which the Chŏlla harvest left for Japan, and a heavily Japanese town.'
  },
  {
    id: 'kushiro', en: 'Kushiro', ja: '釧路', zh: '釧路', ko: '구시로', lat: 42.98, lon: 144.38,
    wiki: 'https://en.wikipedia.org/wiki/Kushiro',
    note: 'The coal port of eastern Hokkaidō, and a fishing base for the northern grounds. Shelled from the sea in July 1945.'
  },
  {
    id: 'bandaaceh', en: 'Kutaraja (Banda Aceh)', lat: 5.55, lon: 95.32,
    wiki: 'https://en.wikipedia.org/wiki/Banda_Aceh',
    note: 'The residency seat at the northern tip of Sumatra, and the capital of a sultanate that fought the Dutch for thirty years.'
  },
  {
    id: 'kyzyl', en: 'Kyzyl', lat: 51.72, lon: 94.44,
    wiki: 'https://en.wikipedia.org/wiki/Kyzyl',
    note: 'Capital of the Tuvan People’s Republic, which the map draws and which declared war on Germany in June 1941.'
  },
  {
    id: 'labuan', en: 'Labuan', lat: 5.28, lon: 115.25,
    wiki: 'https://en.wikipedia.org/wiki/Labuan',
    note: 'A Straits Settlement off Borneo; the Australian landing of June 1945 and the war-crimes trials afterwards.'
  },
  {
    id: 'lae', en: 'Lae', lat: -6.73, lon: 146.99, wiki: 'https://en.wikipedia.org/wiki/Lae',
    note: 'Taken in March 1942, the Japanese base on the mainland, and retaken in September 1943.'
  },
  {
    id: 'langson', en: 'Lang Son', lat: 21.85, lon: 106.76,
    wiki: 'https://en.wikipedia.org/wiki/L%E1%BA%A1ng_S%C6%A1n_(city)',
    note: 'The frontier post attacked by the Japanese army on 22–25 September 1940, the opening of the Japanese presence in Indochina.'
  },
  {
    id: 'ledo', en: 'Ledo', lat: 27.3, lon: 95.74,
    wiki: 'https://en.wikipedia.org/wiki/Ledo_Airfield',
    note: 'The railhead where the Ledo Road began, the overland supply line built to replace the Burma Road.'
  },
  {
    id: 'legazpi', en: 'Legazpi', lat: 13.14, lon: 123.73,
    wiki: 'https://en.wikipedia.org/wiki/Legazpi_Cathedral',
    note: 'Under the Mayon volcano, and one of the December 1941 landing points from which the drive on Manila began.'
  },
  {
    id: 'lingayen', en: 'Lingayen', lat: 16.02, lon: 120.23,
    wiki: 'https://en.wikipedia.org/wiki/Lingayen',
    note: 'The gulf used for the Japanese landing of December 1941 and the American landing of January 1945.'
  },
  {
    id: 'liaoyang', en: 'Liáoyáng', ja: '遼陽', zh: '遼陽', ko: '랴오양', lat: 41.27, lon: 123.17,
    wiki: 'https://en.wikipedia.org/wiki/Liaoyang', jpfrom: 'e1942',
    note: 'The old capital of the Liao country and the field of the largest battle of 1904 before Mukden.'
  },
  {
    id: 'lorengau', en: 'Lorengau (Manus)', lat: -2.02, lon: 147.27,
    wiki: 'https://en.wikipedia.org/wiki/Lorengau',
    note: 'The Admiralties, taken in early 1944 and turned into the largest Allied base in the south-west Pacific.'
  },
  {
    id: 'linfen', en: 'Línfén', ja: '臨汾', zh: '臨汾', ko: '린펀', lat: 36.09, lon: 111.52,
    wiki: 'https://en.wikipedia.org/wiki/Linfen',
    note: 'On the Fen river in southern Shanxi, taken in 1938 and held as a garrison town on the road south.'
  },
  {
    id: 'laohekou', en: 'Lǎohékǒu (Laohokow)', ja: '老河口', zh: '老河口', ko: '라오허커우', lat: 32.39,
    lon: 111.67, wiki: 'https://en.wikipedia.org/wiki/Laohekou',
    note: 'Fourteenth Air Force base and the object of the last Japanese offensive in China, 1945.'
  },
  {
    id: 'manzhouli', en: 'Manchouli (Manzhouli)', ja: '満洲里', zh: '滿洲里', ko: '만저우리', lat: 49.6,
    lon: 117.45, wiki: 'https://en.wikipedia.org/wiki/Manzhouli', jpfrom: 'e1942',
    note: 'The rail frontier with the Soviet Union on the Chinese Eastern Railway.'
  },
  {
    id: 'maoka', en: 'Maoka (Kholmsk)', ja: 'ホルムスク', zh: '霍爾姆斯克', ko: '홀름스크', lat: 47.06,
    lon: 142.05, wiki: 'https://en.wikipedia.org/wiki/Kholmsk',
    note: 'West-coast port; the Soviet landing of 20 August 1945 and the telephone operators’ suicides.'
  },
  {
    id: 'masan', en: 'Masan', ja: '馬山', zh: '馬山', ko: '마산', lat: 35.2, lon: 128.57,
    wiki: 'https://en.wikipedia.org/wiki/Masan',
    note: 'A south-coast port opened to Japanese trade in 1899, and a naval anchorage in the Russo-Japanese War.'
  },
  {
    id: 'matsue', en: 'Matsue', ja: '松江', zh: '松江', ko: '마쓰에', lat: 35.47, lon: 133.05,
    wiki: 'https://en.wikipedia.org/wiki/Matsue',
    note: 'The castle town on the Shinji lagoon, where Lafcadio Hearn taught in the 1890s.'
  },
  {
    id: 'meiktila', en: 'Meiktila', lat: 20.88, lon: 95.86,
    wiki: 'https://en.wikipedia.org/wiki/Meiktila',
    note: 'The battle of February–March 1945 that broke the Japanese army in Burma; the road and airfield hub behind Mandalay.'
  },
  {
    id: 'mergui', en: 'Mergui (Myeik)', lat: 12.44, lon: 98.6,
    wiki: 'https://en.wikipedia.org/wiki/Myeik,_Myanmar',
    note: 'The southernmost Burmese port, in the Tenasserim tin country and the archipelago of the Moken.'
  },
  {
    id: 'miri', en: 'Miri', lat: 4.4, lon: 113.99, wiki: 'https://en.wikipedia.org/wiki/Miri',
    note: 'The Sarawak oilfields and refinery, seized on 16 December 1941 — the first objective in Borneo.'
  },
  {
    id: 'mito', en: 'Mito', ja: '水戸東照宮', zh: '水戶東照宮', lat: 36.37, lon: 140.47,
    wiki: 'https://en.wikipedia.org/wiki/Mito_T%C5%8Dsh%C5%8D-g%C5%AB',
    note: 'The seat of a senior Tokugawa house, and of the school of thought that supplied the slogans of the Restoration.'
  },
  {
    id: 'miyazaki', en: 'Miyazaki', ja: '宮崎', zh: '宮崎', ko: '미야자키', lat: 31.91, lon: 131.42,
    wiki: 'https://en.wikipedia.org/wiki/Miyazaki_(city)',
    note: 'The Hyūga coast of south-eastern Kyūshū, and the shrine the wartime state made much of as the site of the first emperor\'s accession.'
  },
  {
    id: 'morotai', en: 'Morotai (Daruba)', lat: 2.05, lon: 128.32,
    wiki: 'https://en.wikipedia.org/wiki/Morotai_Island_Regency',
    note: 'The September 1944 landing that gave the airfields for the return to the Philippines.'
  },
  {
    id: 'bangka', en: 'Muntok (Bangka)', lat: -2.07, lon: 105.16,
    wiki: 'https://en.wikipedia.org/wiki/Muntok',
    note: 'The Bangka Island massacre of Australian nurses, 16 February 1942, and the tin islands.'
  },
  {
    id: 'muroran', en: 'Muroran', ja: '室蘭', zh: '室蘭', ko: '무로란', lat: 42.32, lon: 140.97,
    wiki: 'https://en.wikipedia.org/wiki/Muroran',
    note: 'Steel and coal port; shelled by US battleships in July 1945.'
  },
  {
    id: 'korat', en: 'Nakhon Ratchasima (Korat)', lat: 14.97, lon: 102.1,
    wiki: 'https://en.wikipedia.org/wiki/Nakhon_Ratchasima',
    note: 'The gateway to the Khorat plateau, and the railhead from which the Thai army moved on the Lao and Cambodian territories in 1941.'
  },
  {
    id: 'namdinh', en: 'Nam Dinh', lat: 20.42, lon: 106.17,
    wiki: 'https://en.wikipedia.org/wiki/Nam_%C4%90%E1%BB%8Bnh',
    note: 'The textile mills of Tonkin and the largest industrial workforce in Indochina, which is why the strikes of the 1930s began here.'
  },
  {
    id: 'nara', en: 'Nara', ja: '奈良', zh: '奈良', ko: '나라', lat: 34.69, lon: 135.81,
    wiki: 'https://en.wikipedia.org/wiki/Nara_(city)',
    note: 'The 8th-century capital; spared the bombing and central to the state’s account of its own antiquity.'
  },
  {
    id: 'noumea', en: 'Nouméa', lat: -22.28, lon: 166.46,
    wiki: 'https://en.wikipedia.org/wiki/Noum%C3%A9a',
    note: 'Optional, and off the present frame: Free French from September 1940 and the headquarters of the South Pacific Area.'
  },
  {
    id: 'panjim', en: 'Nova Goa (Panjim)', lat: 15.5, lon: 73.83,
    wiki: 'https://en.wikipedia.org/wiki/Panaji',
    note: 'Capital of Portuguese India, drawn on the map and neutral throughout — and the scene of the March 1943 Operation Creek raid on German ships in Mormugao harbour.'
  },
  {
    id: 'olongapo', en: 'Olongapo (Subic Bay)', lat: 14.83, lon: 120.28,
    wiki: 'https://en.wikipedia.org/wiki/Olongapo',
    note: 'The American naval station on Subic Bay, and the repair yard for the Asiatic Fleet.'
  },
  {
    id: 'pattani', en: 'Pattani', lat: 6.87, lon: 101.25,
    wiki: 'https://en.wikipedia.org/wiki/Pattani_province',
    note: 'An old Malay sultanate absorbed by Siam, and one of the beaches Japanese troops came ashore on before dawn on 8 December 1941.'
  },
  {
    id: 'pegu', en: 'Pegu (Bago)', lat: 17.34, lon: 96.48,
    wiki: 'https://en.wikipedia.org/wiki/Bago,_Myanmar',
    note: 'The old Mon capital north-east of Rangoon, and the junction on the railway to Mandalay.'
  },
  {
    id: 'pekanbaru', en: 'Pekanbaru', lat: 0.51, lon: 101.45,
    wiki: 'https://en.wikipedia.org/wiki/Pekanbaru',
    note: 'The Sumatra railway, built 1943–45 by prisoner and rōmusha labour and finished on the day of the surrender.'
  },
  {
    id: 'petropavlovsk', en: 'Petropavlovsk-Kamchatsky', lat: 53.02, lon: 158.65,
    wiki: 'https://en.wikipedia.org/wiki/Petropavlovsk-Kamchatsky',
    note: 'The staging point for the Soviet seizure of the Kuriles in August 1945.'
  },
  {
    id: 'phuket', en: 'Phuket', lat: 7.88, lon: 98.39,
    wiki: 'https://en.wikipedia.org/wiki/Phuket_province',
    note: 'Tin, and the Andaman coast the map already gives Thailand.'
  },
  {
    id: 'pingfang', en: 'Pingfang', ja: '平房区', ko: '핑팡구', lat: 45.61, lon: 126.63,
    wiki: 'https://en.wikipedia.org/wiki/Pingfang,_Harbin', jpfrom: 'e1942',
    note: 'Unit 731. A village rather than a city, but the site of the biological-warfare programme and its human experiments.'
  },
  {
    id: 'pingtung', en: 'Heitō (Pingdong, Pingtung)', zh: '屏東', lat: 22.68, lon: 120.49,
    wiki: 'https://en.wikipedia.org/wiki/Pingtung_City', local: 'Pingdong (Heitō, Pingtung)',
    note: 'An army airfield in the southern sugar plain, from which aircraft flew against the Philippines in December 1941.'
  },
  {
    id: 'pondicherrycity', en: 'Pondicherry', lat: 11.93, lon: 79.83,
    wiki: 'https://en.wikipedia.org/wiki/Pondicherry',
    note: 'Capital of French India, which declared for the Free French in September 1940.'
  },
  {
    id: 'portblair', en: 'Port Blair', lat: 11.62, lon: 92.73,
    wiki: 'https://en.wikipedia.org/wiki/Port_Blair',
    note: 'The only Indian territory Japan occupied, from March 1942; nominally handed to the Provisional Government of Free India in 1943, and the site of the penal settlement.'
  },
  {
    id: 'prachuap', en: 'Prachuap Khiri Khan', lat: 11.81, lon: 99.8,
    wiki: 'https://en.wikipedia.org/wiki/Prachuap_Khiri_Khan',
    note: 'A landing point of 8 December 1941 and the sharpest Thai resistance.'
  },
  {
    id: 'prome', en: 'Prome (Pyay)', lat: 18.82, lon: 95.22,
    wiki: 'https://en.wikipedia.org/wiki/Pyay',
    note: 'The Irrawaddy river port on the road north, taken in the retreat of 1942.'
  },
  {
    id: 'punakha', en: 'Punakha', lat: 27.59, lon: 89.88,
    wiki: 'https://en.wikipedia.org/wiki/Punakha',
    note: 'The winter capital and seat of government of a state the map already draws.'
  },
  {
    id: 'quzhou', en: 'Qúzhōu (Chuchow)', ja: '渠県', zh: '渠縣', ko: '취현', lat: 28.94, lon: 118.87,
    wiki: 'https://en.wikipedia.org/wiki/Qu_County',
    note: 'A Doolittle raid recovery airfield, and the reason for the Chekiang–Kiangsi campaign of 1942 and the biological attacks that accompanied it.'
  },
  {
    id: 'saga', en: 'Saga', lat: 33.26, lon: 130.3,
    note: 'The old Hizen domain, an early adopter of Western guns and shipbuilding, and the porcelain kilns at Arita behind it.'
  },
  {
    id: 'sanya', en: 'Samah (Sanya)', lat: 18.25, lon: 109.51,
    wiki: 'https://en.wikipedia.org/wiki/Sanya_River',
    note: 'The naval base and iron-ore port at the southern tip of Hainan, worked by prisoner and conscript labour.'
  },
  {
    id: 'samarinda', en: 'Samarinda', lat: -0.5, lon: 117.15,
    wiki: 'https://en.wikipedia.org/wiki/Samarinda',
    note: 'The Kutai oilfields on the Mahakam, and the river port that shipped them.'
  },
  {
    id: 'sandakan', en: 'Sandakan', lat: 5.84, lon: 118.12,
    wiki: 'https://en.wikipedia.org/wiki/Sandakan',
    note: 'The capital of North Borneo until 1946, the prisoner-of-war camp, and the starting point of the death marches to Ranau in 1945, which six men survived.'
  },
  {
    id: 'savannakhet', en: 'Savannakhet', lat: 16.56, lon: 104.75,
    wiki: 'https://en.wikipedia.org/wiki/Savannakhet',
    note: 'A Mekong town on the road across Laos to Vietnam, and the crossing to Thailand.'
  },
  {
    id: 'seremban', en: 'Seremban', lat: 2.73, lon: 101.94,
    wiki: 'https://en.wikipedia.org/wiki/Seremban',
    note: 'The seat of Negri Sembilan, in the tin country south of Kuala Lumpur.'
  },
  {
    id: 'seria', en: 'Seria', lat: 4.61, lon: 114.33,
    wiki: 'https://en.wikipedia.org/wiki/Seria',
    note: 'The Brunei oilfield, struck in 1929, and the reason Japanese troops came ashore here in December 1941.'
  },
  {
    id: 'shikuka', en: 'Shikuka (Poronaysk)', ja: 'ポロナイスク', zh: '波羅奈斯克', ko: '포로나이스크',
    lat: 49.22, lon: 143.1, wiki: 'https://en.wikipedia.org/wiki/Poronaysk',
    note: 'The northernmost Japanese town on Sakhalin, on the frontier with the Soviet half.'
  },
  {
    id: 'shillong', en: 'Shillong', lat: 25.58, lon: 91.89,
    wiki: 'https://en.wikipedia.org/wiki/Shillong',
    note: 'Provincial capital, and the rear base of the Assam front.'
  },
  {
    id: 'songkhla', en: 'Songkhla', lat: 7.2, lon: 100.6,
    wiki: 'https://en.wikipedia.org/wiki/Songkhla',
    note: 'One of the main Japanese landing beaches on the morning of 8 December 1941, and the road to Malaya.'
  },
  {
    id: 'suifenhe', en: 'Suifenho (Pogranichnaya)', lat: 44.4, lon: 131.15,
    wiki: 'https://en.wikipedia.org/wiki/Suifenhe', jpfrom: 'e1942',
    note: 'The eastern rail crossing to Vladivostok, and a fortified belt.'
  },
  {
    id: 'suwon', en: 'Suigen (Suwŏn)', ja: '水原', zh: '水原', ko: '수원', lat: 37.26, lon: 127.01,
    wiki: 'https://en.wikipedia.org/wiki/Suwon', local: 'Suwŏn (Suigen)',
    note: 'The colonial agricultural experiment station, where the rice varieties that fed the empire\'s grain shipments were bred.'
  },
  {
    id: 'siping', en: 'Sìpíng (Ssupingkai)', ja: '四平', zh: '四平', ko: '쓰핑', lat: 43.17,
    lon: 124.35, wiki: 'https://en.wikipedia.org/wiki/Siping,_Jilin', jpfrom: 'e1942',
    note: 'The junction where the line from Changchun meets the branch west into the Mongol country.'
  },
  {
    id: 'songjin', en: 'Jōshin (Sŏngjin)', ja: '金策', zh: '金策', ko: '김책', lat: 40.67, lon: 129.2,
    wiki: 'https://en.wikipedia.org/wiki/Kimchaek', local: 'Sŏngjin (Jōshin)',
    note: 'Magnesite and steel, and one of the northern ports built to move Manchurian ore to Japan.'
  },
  {
    id: 'tacloban', en: 'Tacloban', lat: 11.24, lon: 125.0,
    wiki: 'https://en.wikipedia.org/wiki/Tacloban',
    note: 'MacArthur came ashore here on 20 October 1944; the seat of the restored Commonwealth government until Manila was retaken.'
  },
  {
    id: 'taiping', en: 'Taiping', lat: 4.85, lon: 100.74,
    wiki: 'https://en.wikipedia.org/wiki/Taiping_Island',
    note: 'The Perak tin town where the Larut wars brought in British rule in 1874, and the wettest place in Malaya.'
  },
  {
    id: 'taitung', en: 'Taitō (Taidong, Taitung)', lat: 22.76, lon: 121.14,
    wiki: 'https://en.wikipedia.org/wiki/Taitung_Performing_Art_Center',
    local: 'Taidong (Taitō, Taitung)',
    note: 'The last of the eight Taiwanese prefectural seats missing from the layer.'
  },
  {
    id: 'taunggyi', en: 'Taunggyi', lat: 20.79, lon: 97.04,
    wiki: 'https://en.wikipedia.org/wiki/Taunggyi',
    note: 'The hill station the Shan States were governed from, cool enough for the British and central enough for the sawbwas to be summoned to.'
  },
  {
    id: 'tavoy', en: 'Tavoy (Dawei)', lat: 14.08, lon: 98.19,
    wiki: 'https://en.wikipedia.org/wiki/Dawei,_Myanmar',
    note: 'A Tenasserim port whose airfields put Japanese aircraft within range of Rangoon in 1942.'
  },
  {
    id: 'tawau', en: 'Tawau', lat: 4.25, lon: 117.89,
    wiki: 'https://en.wikipedia.org/wiki/Tawau',
    note: 'The company plantation town in the south-east of North Borneo, growing tobacco and hemp.'
  },
  {
    id: 'ternate', en: 'Ternate', lat: 0.79, lon: 127.38,
    wiki: 'https://en.wikipedia.org/wiki/Ternate',
    note: 'A clove sultanate that Portugal, Spain and the Dutch fought over for a century, reduced by 1930 to a residency seat under a volcano.'
  },
  {
    id: 'thanbyuzayat', en: 'Thanbyuzayat', lat: 15.97, lon: 97.73,
    wiki: 'https://en.wikipedia.org/wiki/Thanbyuzayat',
    note: 'The western terminus of the Burma–Siam railway and its cemetery.'
  },
  {
    id: 'cilacap', en: 'Tjilatjap (Cilacap)', lat: -7.73, lon: 109.01,
    wiki: 'https://en.wikipedia.org/wiki/Cilacap_Regency',
    note: 'Java’s only south-coast port and the evacuation channel in March 1942; the ships leaving it were hunted down.'
  },
  {
    id: 'tottori', en: 'Tottori', ja: '鳥取市歴史博物館', lat: 35.5, lon: 134.24,
    wiki: 'https://en.wikipedia.org/wiki/Tottori_City_Historical_Museum',
    note: 'Sand dunes, pears and a small castle town on the Japan Sea.'
  },
  {
    id: 'toungoo', en: 'Toungoo', lat: 18.94, lon: 96.43,
    wiki: 'https://en.wikipedia.org/wiki/Taungoo',
    note: 'Where Chennault trained the American Volunteer Group before the war reached Burma; taken in the advance of 1942.'
  },
  {
    id: 'danang', en: 'Tourane (Da Nang)', lat: 16.07, lon: 108.22,
    wiki: 'https://en.wikipedia.org/wiki/Da_Nang',
    note: 'The port the French took in 1858 to begin the conquest of Vietnam, and the deep-water anchorage of Annam.'
  },
  {
    id: 'townsville', en: 'Townsville', lat: -19.26, lon: 146.82,
    wiki: 'https://en.wikipedia.org/wiki/Townsville',
    note: 'The forward base for the New Guinea campaign, and bombed in July 1942.'
  },
  {
    id: 'tsu', en: 'Tsu', ja: '摂津国', zh: '攝津國', ko: '셋쓰국', lat: 34.72, lon: 136.51,
    wiki: 'https://en.wikipedia.org/wiki/Settsu_Province',
    note: 'The seat of Mie, on the bay road to the Ise shrines.'
  },
  {
    id: 'tulagitown', en: 'Tulagi', lat: -9.1, lon: 160.15,
    wiki: 'https://en.wikipedia.org/wiki/Tulagi',
    note: 'The capital of the protectorate, taken in May 1942 and the first objective of the Guadalcanal landings.'
  },
  {
    id: 'tongzhou', en: 'Tungchow (Tongzhou)', lat: 39.91, lon: 116.66,
    wiki: 'https://en.wikipedia.org/wiki/Xinhua_Subdistrict,_Beijing',
    note: 'The Tungchow Mutiny of 29 July 1937, in which the East Hopei puppet garrison turned on the Japanese and killed most of the Japanese and Korean residents; used afterwards to justify escalation.'
  },
  {
    id: 'tonghua', en: 'Tōnghuà', ja: '通化', zh: '通化', ko: '퉁화', lat: 41.73, lon: 125.94,
    wiki: 'https://en.wikipedia.org/wiki/Tonghua', jpfrom: 'e1942',
    note: 'Manchukuo’s final capital in August 1945, and the redoubt planned for the Kwantung Army’s last stand.'
  },
  {
    id: 'ube', en: 'Ube', ja: '宇部', zh: '宇部', ko: '우베', lat: 33.95, lon: 131.25,
    wiki: 'https://en.wikipedia.org/wiki/Ube,_Yamaguchi',
    note: 'Coal and chemicals; undersea pits worked by conscripted Korean labour.'
  },
  {
    id: 'urawa', en: 'Urawa', ja: '浦和宿', lat: 35.86, lon: 139.65,
    wiki: 'https://en.wikipedia.org/wiki/Urawa-shuku',
    note: 'A commuter town on the Nakasendō north of Tokyo, and the seat of Saitama.'
  },
  {
    id: 'victoriapoint', en: 'Victoria Point (Kawthaung)', lat: 9.98, lon: 98.55,
    wiki: 'https://en.wikipedia.org/wiki/Kawthaung,_Myanmar',
    note: 'The southernmost point of Burma, taken on 15 December 1941 to cut the air-reinforcement route to Singapore.'
  },
  {
    id: 'vigan', en: 'Vigan', lat: 17.57, lon: 120.39,
    wiki: 'https://en.wikipedia.org/wiki/Vigan',
    note: 'The Spanish colonial town of the Ilocos coast, and a December 1941 landing point.'
  },
  {
    id: 'vinh', en: 'Vinh', lat: 18.68, lon: 105.68, wiki: 'https://en.wikipedia.org/wiki/Vinh',
    note: 'The industrial town of northern Annam and the centre of the Nghe-Tinh soviets of 1930–31, which the French put down with aircraft.'
  },
  {
    id: 'ussuriysk', en: 'Voroshilov (Ussuriysk/Nikolsk)', lat: 43.8, lon: 131.95,
    wiki: 'https://en.wikipedia.org/wiki/Ussuriysk',
    note: 'The rail junction behind Vladivostok and the Soviet Far Eastern army’s main base.'
  },
  {
    id: 'wewak', en: 'Wewak', lat: -3.55, lon: 143.63,
    wiki: 'https://en.wikipedia.org/wiki/Wewak',
    note: 'The Japanese Eighteenth Army’s main base, wrecked from the air in August 1943 and then bypassed.'
  },
  {
    id: 'xiangyang', en: 'Xiāngyáng (Siangyang)', ja: '襄陽', zh: '襄陽', ko: '샹양', lat: 32.01,
    lon: 112.12, wiki: 'https://en.wikipedia.org/wiki/Xiangyang',
    note: 'The double city on the Han river, the classic gate between the north China plain and the middle Yangtze.'
  },
  {
    id: 'yamagata', en: 'Yamagata', lat: 38.24, lon: 140.36,
    note: 'Safflower and silk in the Mogami basin, behind the Ōu mountains.'
  },
  {
    id: 'yamaguchi', en: 'Yamaguchi', ja: '山口', zh: '山口', ko: '야마구치', lat: 34.19, lon: 131.47,
    wiki: 'https://en.wikipedia.org/wiki/Yamaguchi_(city)',
    note: 'The seat of the old Chōshū domain, which supplied more of the Meiji leadership than anywhere else.'
  },
  {
    id: 'nauru', en: 'Yaren (Nauru)', lat: -0.55, lon: 166.92,
    wiki: 'https://en.wikipedia.org/wiki/Yaren',
    note: 'Phosphate; occupied in August 1942, bypassed and starved, and most of the islanders deported to Truk.'
  },
  {
    id: 'yenangyaung', en: 'Yenangyaung', lat: 20.46, lon: 94.87,
    wiki: 'https://en.wikipedia.org/wiki/Yenangyaung',
    note: 'The Irrawaddy oilfields — a principal reason for the invasion of Burma, and destroyed by the retreating British in April 1942.'
  },
  {
    id: 'yilan', en: 'Giran (Yilan)', zh: '甲子蘭酒文物館', lat: 24.76, lon: 121.75,
    wiki: 'https://en.wikipedia.org/wiki/Yilan_Distillery_Chia_Chi_Lan_Liquor_Museum',
    local: 'Yilan (Giran)',
    note: 'The rice plain behind the north-east coast of Taiwan, cut off from Taipei by the mountains until the railway.'
  },
  {
    id: 'anyang', en: 'Ānyáng (Changteh)', ja: '安陽', zh: '安陽', lat: 36.1, lon: 114.39,
    wiki: 'https://en.wikipedia.org/wiki/Anyang',
    note: 'The last Shang capital, excavated from 1928 — the dig that founded modern Chinese archaeology.'
  },
  {
    id: 'enshi', en: 'Ēnshī (Enshih)', ja: '恩施', zh: '恩施', ko: '언스', lat: 30.3, lon: 109.49,
    wiki: 'https://en.wikipedia.org/wiki/Enshi_City',
    note: 'Hubei\'s wartime capital in the western gorges after Wuhan fell, and out of reach of the Japanese army for the rest of the war.'
  },
  {
    id: 'ominato', en: 'Ōminato', ja: 'むつ', zh: '陸奧', ko: '무쓰', lat: 41.29, lon: 141.12,
    wiki: 'https://en.wikipedia.org/wiki/Mutsu,_Aomori',
    note: 'The naval district guarding the Tsugaru Strait between Honshū and Hokkaidō.'
  },
  {
    id: 'otomari', en: 'Ōtomari (Korsakov)', ja: 'コルサコフ管区', zh: '科爾薩科夫區', lat: 46.63,
    lon: 142.78, wiki: 'https://en.wikipedia.org/wiki/Korsakovsky_District,_Sakhalin_Oblast',
    note: 'Karafuto\'s ferry port to Hokkaidō, and the way almost everyone entered and left the colony.'
  },
  {
    id: 'otsu', en: 'Ōtsu', ja: '大津', zh: '大津', ko: '오쓰', lat: 35.02, lon: 135.85,
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Ctsu',
    note: 'On Lake Biwa at the head of the Tōkaidō, where a policeman wounded the Russian crown prince in 1891.'
  },
  {
    id: 'komsomolsk', en: 'Komsomolsk-on-Amur', lat: 50.55, lon: 137.01,
    wiki: 'https://en.wikipedia.org/wiki/Komsomolsk-on-Amur',
    note: 'Built from 1932 as the Soviet Far East’s arms and aircraft city, out of range of Japanese attack.'
  },
  {
    id: 'quezoncity', en: 'Quezon City', lat: 14.68, lon: 121.04,
    note: 'Laid out from 1939 as a new capital to replace Manila, and still mostly plans and open ground when the war reached it.'
  },
  {
    id: 'beihai', en: 'Pakhoi (Beihai)', lat: 21.48, lon: 109.12,
    wiki: 'https://en.wikipedia.org/wiki/Beihai',
    note: 'The Gulf of Tonkin treaty port opened in 1876, the outlet for Guangxi before the French built the railway from Haiphong, and occupied in 1940.'
  },
  {
    id: 'daxi', en: 'Daikei (Daxi)', ja: '大溪 (Daikei)', zh: '大溪', lat: 24.8806, lon: 121.2871,
    wiki: 'https://en.wikipedia.org/wiki/Daxi_District', local: 'Daxi (Daikei)',
    note: 'A camphor and tea town on the Dahan, at the head of the navigable water. It was called Dakekan until 1920, and the name a reader meets in accounts of the camphor frontier is that one.'
  },
  {
    id: 'tamsui', en: 'Tansui (Danshui, Tamsui)', ja: '淡水 (Tansui)', zh: '淡水', lat: 25.1719,
    lon: 121.4439, wiki: 'https://en.wikipedia.org/wiki/Tamsui_District',
    local: 'Danshui (Tansui, Tamsui)',
    note: 'The treaty port at the mouth of the river below Taipei, and the way in for foreign trade and missionaries under the Qing. Its bar silted through the nineteenth century and the trade went to Keelung.'
  },
  {
    id: 'beipu', en: 'Hoppo (Beipu)', ja: '北埔 (Hoppo)', zh: '北埔', lat: 24.6639, lon: 121.0681,
    wiki: 'https://en.wikipedia.org/wiki/Beipu,_Hsinchu', local: 'Beipu (Hoppo)',
    note: 'A Hakka village in the hills behind Hsinchu, laid out in the 1830s as a base for clearing land toward the mountains. In November 1907 a rising here killed some sixty Japanese; it was the first of the armed revolts of the middle colonial period.'
  },
  {
    id: 'puli', en: 'Hori (Puli)', ja: '埔里 (Hori)', zh: '埔里', lat: 23.9667, lon: 120.9667,
    wiki: 'https://en.wikipedia.org/wiki/Puli,_Nantou', local: 'Puli (Hori)',
    note: 'The basin at almost the exact centre of the island, ringed by mountains, and the last town on the road up into the highlands. Everything that went to or came from Musha passed through it.'
  },
  {
    id: 'wushe', en: 'Musha (Wushe)', ja: '霧社 (Musha)', zh: '霧社', lat: 24.0212, lon: 121.1323,
    wiki: 'https://en.wikipedia.org/wiki/Musha_Incident', local: 'Wushe (Musha)',
    note: 'A police post and Atayal settlement in the mountains above Puli, inside the territory the administration governed separately. In October 1930 the Seediq of six villages attacked the schoolyard here during a sports day and killed 134 Japanese; the reprisal that followed, with aircraft and gas, destroyed the villages that had risen.'
  },
  {
    id: 'fangliao', en: 'Hōryō (Fangliao)', ja: '枋寮 (Hōryō)', zh: '枋寮', lat: 22.3656,
    lon: 120.5936, wiki: 'https://en.wikipedia.org/wiki/Fangliao,_Pingtung',
    local: 'Fangliao (Hōryō)',
    note: 'The last town on the coast road south, where the western plain runs out against the mountains. The line from Takao reached it in 1941.'
  },
  {
    id: 'checheng', en: 'Shajō (Checheng)', ja: '車城 (Shajō)', zh: '車城', lat: 22.0798,
    lon: 120.7457, wiki: 'https://en.wikipedia.org/wiki/Checheng,_Pingtung',
    local: 'Checheng (Shajō)',
    note: 'The bay on the south-west coast where the Japanese expedition of 1874 put its troops ashore — Japan\'s first overseas military action, and the beginning of the argument that ended with Taiwan being ceded twenty-one years later.'
  },
  {
    id: 'mudan', en: 'Botansha (Mudan)', ja: '牡丹社 (Botansha)', zh: '牡丹', lat: 22.1262,
    lon: 120.7743, wiki: 'https://en.wikipedia.org/wiki/Mudan,_Pingtung',
    local: 'Mudan (Botansha)',
    note: 'The Paiwan settlement the 1874 expedition was sent against, after Ryūkyūan sailors wrecked on this coast were killed here three years before. It lay inside the highland territory and was never a Japanese municipality.'
  },
  {
    id: 'hengchun', en: 'Kōshun (Hengchun)', ja: '恆春 (Kōshun)', zh: '恆春', lat: 22.0039,
    lon: 120.7473, wiki: 'https://en.wikipedia.org/wiki/Hengchun', local: 'Hengchun (Kōshun)',
    note: 'The walled town at the southern tip, built by the Qing after the 1874 expedition to hold a coast they had just been shown they did not control. Hot enough for rubber and coconut trials under Japanese rule.'
  },
  {
    id: 'chamdo', en: 'Chamdo (Qamdo)', zh: '昌都', lat: 31.143, lon: 97.17,
    wiki: 'https://en.wikipedia.org/wiki/Chamdo',
    note: 'The seat of the Tibetan governor of Kham and the garrison town on the road to Szechwan — the eastern end of what Lhasa administered, and the frontier the Republic disputed.'
  },
  {
    id: 'nagchuka', en: 'Nagchuka (Nagqu, Naqu)', zh: '那曲', lat: 31.476, lon: 92.051,
    wiki: 'https://en.wikipedia.org/wiki/Nagqu',
    note: 'The staging post on the northern plain where the caravan road from Sining comes down to Lhasa, and where Tibet met the Mongol and Chinese trade.'
  },
  {
    id: 'rudok', en: 'Rudok (Rutog)', zh: '日土', lat: 33.38, lon: 79.732,
    wiki: 'https://en.wikipedia.org/wiki/Rutog_County',
    note: 'A fort and salt-trading centre in the far north-west, on the caravan route over to Ladakh and Sinkiang.'
  },
  {
    id: 'gartok', en: 'Gartok (Gar)', zh: '噶爾', lat: 31.728, lon: 80.337,
    wiki: 'https://en.wikipedia.org/wiki/Gartok',
    note: 'One of the three marts opened to British trade by the 1904 convention, and the western Tibetan government post — a tent encampment for most of the year rather than a town.'
  },
];

JMAP.FEATURES = [
  {
    id: 'seajapan', en: 'Sea of Japan (East Sea)', ja: '日本海 (Nihonkai)', zh: '日本海', lvl: 1,
    lat: 40.2, lon: 135.0, kind: 'sea'
  },
  {
    id: 'yellowsea', en: 'Yellow Sea (West Sea)', ja: '黄海 (Kōkai)', zh: '黃海', lvl: 1, lat: 35.4,
    lon: 123.4, kind: 'sea'
  },
  {
    id: 'eastchinasea', en: 'East China Sea', ja: '東シナ海 (Higashi Shina-kai)', zh: '東海', lvl: 1,
    lat: 28.6, lon: 125.4, kind: 'sea'
  },
  {
    id: 'southchinasea', en: 'South China Sea', ja: '南シナ海 (Minami Shina-kai)', zh: '南海', lvl: 1,
    lat: 14.5, lon: 115.0, kind: 'sea'
  },
  {
    id: 'bohai', en: 'Bohai Bay', ja: '渤海 (Bokkai)', zh: '渤海', lvl: 2, lat: 38.6, lon: 119.4,
    kind: 'sea'
  },
  {
    id: 'okhotsk', en: 'Sea of Okhotsk', ja: 'オホーツク海 (Ohōtsuku-kai)', zh: '鄂霍次克海', lvl: 1,
    lat: 52.5, lon: 148.5, kind: 'sea'
  },
  {
    id: 'philippinesea', en: 'Philippine Sea', ja: 'フィリピン海 (Firipin-kai)', zh: '菲律賓海', lvl: 1,
    lat: 18.0, lon: 132.0, kind: 'sea'
  },
  {
    id: 'bengal', en: 'Bay of Bengal', ja: 'ベンガル湾 (Bengaru-wan)', zh: '孟加拉灣', lvl: 1, lat: 16.0,
    lon: 88.5, kind: 'sea'
  },
  {
    id: 'andamansea', en: 'Andaman Sea', ja: 'アンダマン海 (Andaman-kai)', zh: '安達曼海', lvl: 2,
    lat: 11.5, lon: 96.0, kind: 'sea'
  },
  {
    id: 'siamgulf', en: 'Gulf of Siam', ja: 'シャム湾 (Shamu-wan)', zh: '暹羅灣', lvl: 2, lat: 9.5,
    lon: 101.5, kind: 'sea'
  },
  {
    id: 'javasea', en: 'Java Sea', ja: 'ジャワ海 (Jawa-kai)', zh: '爪哇海', lvl: 2, lat: -5.2,
    lon: 111.0, kind: 'sea'
  },
  {
    id: 'celebessea', en: 'Celebes Sea', ja: 'セレベス海 (Serebesu-kai)', zh: '西里伯斯海', lvl: 2,
    lat: 3.6, lon: 122.5, kind: 'sea'
  },
  {
    id: 'bandasea', en: 'Banda Sea', ja: 'バンダ海 (Banda-kai)', zh: '班達海', lvl: 2, lat: -5.8,
    lon: 127.5, kind: 'sea'
  },
  {
    id: 'arafura', en: 'Arafura Sea', ja: 'アラフラ海 (Arafura-kai)', zh: '阿拉弗拉海', lvl: 2, lat: -9.5,
    lon: 135.0, kind: 'sea'
  },
  {
    id: 'coralsea', en: 'Coral Sea', ja: '珊瑚海 (Sango-kai)', zh: '珊瑚海', lvl: 1, lat: -12.2,
    lon: 155.0, kind: 'sea'
  },
  {
    id: 'beringsea', en: 'Bering Sea', ja: 'ベーリング海 (Bēringu-kai)', zh: '白令海', lvl: 1, lat: 54.0,
    lon: 178.0, kind: 'sea'
  },
  {
    id: 'taiwanstrait', en: 'Taiwan Strait', ja: '台湾海峡 (Taiwan-kaikyō)', zh: '臺灣海峽', lvl: 3,
    lat: 24.4, lon: 119.4, kind: 'sea'
  },
  {
    id: 'tsushima', en: 'Tsushima Strait', ja: '対馬海峡 (Tsushima-kaikyō)', zh: '對馬海峽', lvl: 3,
    lat: 33.95, lon: 129.98, kind: 'sea'
  },
  {
    id: 'malacca', en: 'Strait of Malacca', ja: 'マラッカ海峡 (Marakka-kaikyō)', zh: '馬六甲海峽', lvl: 2,
    lat: 3.6, lon: 99.8, kind: 'sea'
  },
  {
    id: 'luzonstrait', en: 'Luzon Strait', ja: 'ルソン海峡 (Ruson-kaikyō)', zh: '呂宋海峽', lvl: 3,
    lat: 20.4, lon: 121.2, kind: 'sea'
  },
  {
    id: 'gobi', en: 'Gobi Desert', ja: 'ゴビ砂漠 (Gobi-sabaku)', zh: '戈壁沙漠', lvl: 1, lat: 43.4,
    lon: 104.5, kind: 'land'
  },
  {
    id: 'ordos', en: 'Ordos Plateau', ja: 'オルドス高原 (Orudosu-kōgen)', zh: '鄂爾多斯高原', lvl: 2,
    lat: 38.9, lon: 108.6, kind: 'land'
  },
  {
    id: 'taklamakan', en: 'Taklamakan Desert', ja: 'タクラマカン砂漠 (Takuramakan-sabaku)',
    zh: '塔克拉瑪干沙漠', lvl: 1, lat: 38.6, lon: 82.5, kind: 'land'
  },
  {
    id: 'loess', en: 'Loess Plateau', ja: '黄土高原 (Ōdo-kōgen)', zh: '黃土高原', lvl: 2, lat: 36.6,
    lon: 108.5, kind: 'land'
  },
  {
    id: 'tibetplateau', en: 'Tibetan Plateau', ja: 'チベット高原 (Chibetto-kōgen)', zh: '青藏高原',
    lvl: 1, lat: 33.2, lon: 88.0, kind: 'land'
  },
  {
    id: 'northchinaplain', en: 'North China Plain', ja: '華北平原 (Kahoku-heigen)', zh: '華北平原',
    lvl: 2, lat: 35.4, lon: 115.6, kind: 'land'
  },
  {
    id: 'redbasin', en: 'Red Basin', ja: '四川盆地 (Shisen-bonchi)', zh: '四川盆地', lvl: 2, lat: 30.4,
    lon: 105.2, kind: 'land'
  },
  {
    id: 'khingan', en: 'Greater Khingan Range', ja: '大興安嶺 (Dai-Kōanrei)', zh: '大興安嶺', lvl: 2,
    lat: 48.5, lon: 122.0, kind: 'land'
  },
  {
    id: 'changbai', en: 'Changbai Mountains', ja: '長白山脈 (Chōhaku-sanmyaku)', zh: '長白山脈', lvl: 3,
    lat: 42.2, lon: 128.2, kind: 'land'
  },
  {
    id: 'hexi', en: 'Hexi Corridor', ja: '河西回廊 (Kasei-kairō)', zh: '河西走廊', lvl: 3, lat: 39.4,
    lon: 99.0, kind: 'land'
  },
  {
    id: 'qinling', en: 'Qinling Mountains', ja: '秦嶺 (Shinrei)', zh: '秦嶺', lvl: 3, lat: 33.7,
    lon: 107.8, kind: 'land'
  },
  {
    id: 'dabie', en: 'Dabie Mountains', ja: '大別山 (Daibetsu-san)', zh: '大別山', lvl: 3, lat: 31.2,
    lon: 115.6, kind: 'land'
  },
  {
    id: 'himalaya', en: 'Himalaya', ja: 'ヒマラヤ山脈 (Himaraya-sanmyaku)', zh: '喜馬拉雅山脈', lvl: 1,
    lat: 28.6, lon: 84.0, kind: 'land'
  },
  {
    id: 'thar', en: 'Thar Desert', ja: 'タール砂漠 (Tāru-sabaku)', zh: '塔爾沙漠', lvl: 2, lat: 27.0,
    lon: 71.5, kind: 'land'
  },
  {
    id: 'deccan', en: 'Deccan Plateau', ja: 'デカン高原 (Dekan-kōgen)', zh: '德干高原', lvl: 2,
    lat: 17.5, lon: 77.0, kind: 'land'
  },
  {
    id: 'malaypeninsula', en: 'Malay Peninsula', ja: 'マレー半島 (Marē-hantō)', zh: '馬來半島', lvl: 2,
    lat: 5.5, lon: 102.2, kind: 'land'
  },
  {
    id: 'owenstanley', en: 'Owen Stanley Range', ja: 'オーエンスタンレー山脈 (Ōen Sutanrē-sanmyaku)',
    zh: '歐文斯坦利山脈', lvl: 3, lat: -9.2, lon: 147.8, kind: 'land'
  },
];

JMAP.PROVINCES = {
  Attu: { en: 'Attu', zh: '阿圖島', wiki: 'https://en.wikipedia.org/wiki/Attu_Island' },
  Kiska: { en: 'Kiska', zh: '基斯卡島', wiki: 'https://en.wikipedia.org/wiki/Kiska' },
  Agattu: { en: 'Agattu — uninhabited', zh: '阿加圖島', wiki: 'https://en.wikipedia.org/wiki/Agattu' },
  'Shemya & the Semichi Islands': { en: 'Shemya & the Semichi Islands — American airfield from May 1943', zh: '謝米亞島' },
  Buldir: {
    en: 'Buldir — uninhabited', zh: '布爾迪爾島', wiki: 'https://en.wikipedia.org/wiki/Buldir_Island'
  },
  'Rat Island': { en: 'Rat Island — uninhabited', zh: '鼠島' },
  'Little Sitkin': {
    en: 'Little Sitkin — uninhabited', zh: '小錫特金島',
    wiki: 'https://en.wikipedia.org/wiki/Little_Sitkin_Island'
  },
  Amchitka: {
    en: 'Amchitka — American landing January 1943', zh: '阿姆奇特卡島',
    wiki: 'https://en.wikipedia.org/wiki/Amchitka_Island'
  },
  Semisopochnoi: {
    en: 'Semisopochnoi — uninhabited', zh: '謝米索波奇諾伊島',
    wiki: 'https://en.wikipedia.org/wiki/Semisopochnoi_Island'
  },
  Amatignak: {
    en: 'Amatignak — uninhabited', zh: '阿馬蒂格納克島',
    wiki: 'https://en.wikipedia.org/wiki/Amatignak_Island'
  },
  Ulak: { en: 'Ulak — uninhabited', zh: '烏拉克島', wiki: 'https://en.wikipedia.org/wiki/Ulak_Island' },
  Gareloi: { en: 'Gareloi — uninhabited', zh: '加雷洛伊島' },
  Tanaga: {
    en: 'Tanaga — uninhabited', zh: '塔納加島', wiki: 'https://en.wikipedia.org/wiki/Tanaga_Island'
  },
  Kanaga: {
    en: 'Kanaga — uninhabited', zh: '卡納加島', wiki: 'https://en.wikipedia.org/wiki/Kanaga_Island'
  },
  Adak: {
    en: 'Adak — American base from August 1942', zh: '阿達克島',
    wiki: 'https://en.wikipedia.org/wiki/Adak,_Alaska'
  },
  Kagalaska: { en: 'Kagalaska — uninhabited', zh: '卡加拉斯卡島' },
  'Great Sitkin': {
    en: 'Great Sitkin — uninhabited', zh: '大錫特金島',
    wiki: 'https://en.wikipedia.org/wiki/Great_Sitkin_Island'
  },
  Atka: {
    en: 'Atka — the village burned in June 1942 and its people moved south', zh: '阿特卡島',
    wiki: 'https://en.wikipedia.org/wiki/Atka,_Alaska'
  },
  Amlia: { en: 'Amlia — uninhabited', zh: '阿姆利亞島', wiki: 'https://en.wikipedia.org/wiki/Amlia' },
  Seguam: {
    en: 'Seguam — uninhabited', zh: '塞瓜姆島', wiki: 'https://en.wikipedia.org/wiki/Seguam_Island'
  },
  Amukta: {
    en: 'Amukta — uninhabited', zh: '阿穆克塔島', wiki: 'https://en.wikipedia.org/wiki/Mount_Amukta'
  },
  Yunaska: {
    en: 'Yunaska — uninhabited', zh: '尤納斯卡島',
    wiki: 'https://en.wikipedia.org/wiki/Yunaska_Island'
  },
  'Islands of Four Mountains': { en: 'The Islands of Four Mountains — uninhabited', zh: '四山群島' },
  Umnak: {
    en: 'Umnak — Fort Glenn, the secret airfield of 1942', zh: '烏姆納克島',
    wiki: 'https://en.wikipedia.org/wiki/Umnak'
  },
  Unalaska: {
    en: 'Unalaska — Dutch Harbor, bombed 3–4 June 1942', zh: '烏納拉斯卡島',
    wiki: 'https://en.wikipedia.org/wiki/Unalaska,_Alaska'
  },
  Akutan: {
    en: 'Akutan — where the intact Zero was recovered in July 1942', zh: '阿庫坦島',
    wiki: 'https://en.wikipedia.org/wiki/Akutan_Island'
  },
  Akun: { en: 'Akun', zh: '阿昆島' },
  Chichijima: {
    en: 'Chichijima', ja: '父島 (Chichijima)', zh: '父島', ko: '지치지마섬',
    wiki: 'https://en.wikipedia.org/wiki/Chichijima',
    short: 'The administrative centre of the group and its only good harbour, Futami',
    note: 'The administrative centre of the group and its only good harbour, Futami. The first settlement was made in 1830 by a party of Americans, Europeans and Hawaiians; Perry called in 1853 and wanted a coaling station on it. Japan annexed the islands in 1876 and naturalised the settlers, whose descendants live on the island still.'
  },
  Hahajima: {
    en: 'Hahajima', ja: '母島 (Hahajima)', zh: '母島', ko: '하하지마섬',
    wiki: 'https://en.wikipedia.org/wiki/Hahajima',
    short: 'The second settlement of the Bonins, forty kilometres south of Chichijima',
    note: 'The second settlement of the Bonins, forty kilometres south of Chichijima, growing sugar cane and vegetables for the Tokyo market.'
  },
  Mukojima: {
    en: 'Mukojima', ja: '聟島 (Mukojima)', zh: '聟島', ko: '무코지마섬',
    wiki: 'https://en.wikipedia.org/wiki/Muko-jima',
    short: 'The northernmost cluster of the Bonins, uninhabited',
    note: 'The northernmost cluster of the Bonins, uninhabited, and grazed bare by the goats landed on it in the nineteenth century.'
  },
  'Iwo Jima (Iō-tō)': {
    en: 'Iwo Jima (Iō-tō)', ja: '硫黄島 (Iō-tō)', zh: '硫磺島', ko: '이오섬',
    wiki: 'https://en.wikipedia.org/wiki/Iwo_Jima',
    short: 'The name means sulphur island and the sulphur was worked from the 1890s',
    note: 'The name means sulphur island and the sulphur was worked from the 1890s, alongside sugar and coca, by about a thousand settlers in two villages. It is the only one of the Volcano Islands flat enough to build an airfield on, which is what decided its history.'
  },
  'Kita-Iō-tō': {
    en: 'Kita-Iō-tō (North Iwo Jima)', ja: '北硫黄島 (Kita-Iōtō)', zh: '北硫磺島', ko: '기타이오섬',
    wiki: 'https://en.wikipedia.org/wiki/North_Iwo_Jima',
    short: 'A cone with no harbour and no flat ground',
    note: 'A cone with no harbour and no flat ground, farmed in terraces by a few hundred people until they were taken off in 1944. Uninhabited since.'
  },
  'Minami-Iō-tō': {
    en: 'Minami-Iō-tō (South Iwo Jima)', ja: '南硫黄島 (Minami-Iōtō)', zh: '南硫磺島', ko: '미나미이오섬',
    wiki: 'https://en.wikipedia.org/wiki/South_Iwo_Jima',
    short: 'Cliffs on every side, never settled and never garrisoned',
    note: 'Cliffs on every side, never settled and never garrisoned. It is a nature reserve now and almost nobody is allowed to land.'
  },
  Assam: {
    en: 'Assam Province — with Sylhet, and with Manipur and Tripura inside it',
    wiki: 'https://en.wikipedia.org/wiki/Assam_Province'
  },
  Bengal: { en: 'Bengal Presidency', wiki: 'https://en.wikipedia.org/wiki/Bengal_Presidency' },
  Bihar: { en: 'Bihar Province', wiki: 'https://en.wikipedia.org/wiki/Bihar_Province' },
  Orissa: {
    en: 'Orissa — the Orissa States are drawn inside it',
    wiki: 'https://en.wikipedia.org/wiki/Odisha'
  },
  UnitedProvinces: {
    en: 'United Provinces of Agra and Oudh',
    wiki: 'https://en.wikipedia.org/wiki/United_Provinces_(1937%E2%80%931950)'
  },
  Punjab: {
    en: 'Punjab Province', wiki: 'https://en.wikipedia.org/wiki/Punjab_Province_(British_India)'
  },
  Delhi: { en: 'Delhi (chief commissioner’s province)', wiki: 'https://en.wikipedia.org/wiki/Delhi' },
  Sind: {
    en: 'Sind Province (separated from Bombay, 1936)',
    wiki: 'https://en.wikipedia.org/wiki/Sindh'
  },
  Baluchistan: {
    en: 'Baluchistan (agency territory)',
    wiki: 'https://en.wikipedia.org/wiki/Baluchistan_Agency'
  },
  NWFP: {
    en: 'North-West Frontier Province',
    wiki: 'https://en.wikipedia.org/wiki/North-West_Frontier_Province'
  },
  CentralProvinces: {
    en: 'Central Provinces — Berar and Nagpur are drawn with Bombay, the Central India states with this',
    wiki: 'https://en.wikipedia.org/wiki/Central_Provinces'
  },
  Bombay: {
    en: 'Bombay Presidency — drawn with Berar, Nagpur and the western states inside it',
    wiki: 'https://en.wikipedia.org/wiki/Bombay_Presidency'
  },
  Madras: { en: 'Madras Presidency', wiki: 'https://en.wikipedia.org/wiki/Madras_Presidency' },
  Arakan: {
    en: 'Arakan Division', zh: '阿拉干省', wiki: 'https://en.wikipedia.org/wiki/Arakan_Division',
    short: 'The coast west of the Arakan Yoma',
    note: 'The coast west of the Arakan Yoma, shut off from the rest of Burma by a range with no road across it and reached instead by sea, which is why it looks to the Bay of Bengal and to Chittagong rather than to Rangoon. Akyab, at the mouth of the Kaladan, was one of the great rice ports of the world in the nineteenth century and still shipped the delta\'s crop in these years; behind it the division ran down through Kyaukpyu and Sandoway to the Arakan Hill Tracts, a district of a few thousand people whose Deputy Commissioner was a police officer and which was an Excluded Area after 1937. Seasonal and then permanent migration from Bengal had made Akyab district heavily Muslim, and when the front passed through in 1942 the communal killing that followed emptied whole tracts in both directions.'
  },
  Pegu: {
    en: 'Pegu Division', zh: '勃固省', wiki: 'https://en.wikipedia.org/wiki/Bago_Region',
    short: 'The lower Sittang and the country round Rangoon',
    note: 'The lower Sittang and the country round Rangoon: the richest rice ground in Burma and the division through which nearly everything the country sold left it. Rangoon Town was a district in its own right and the division\'s headquarters, the third port of the Indian empire, with the rice mills along the Pazundaung creek, the Burmah Oil refineries at Syriam across the river, and a population more Indian than Burmese for much of this period. Prome and Tharrawaddy behind it are old rice districts, and Tharrawaddy is where Saya San proclaimed himself king in December 1930 and set off the rising that took two years and several divisions of troops to put down. Toungoo is not here: it was Tenasserim\'s, apart from the thirty months between December 1922 and June 1925.'
  },
  Irrawaddy: {
    en: 'Irrawaddy Division', zh: '伊洛瓦底省',
    wiki: 'https://en.wikipedia.org/wiki/Ayeyarwady_Region',
    short: 'The delta proper — Bassein, Henzada, Myaungmya, Maubin and Pyapon',
    note: 'The delta proper — Bassein, Henzada, Myaungmya, Maubin and Pyapon — and the largest single work of land clearance in nineteenth-century Asia: after 1852 the British opened the swamp and tidal forest to settlement, and Burmese cultivators moving down from the dry zone turned it into the rice bowl that fed India and much of the East. The money came from Chettiar bankers out of Madras lending against the land, and when the price of rice collapsed after 1930 the mortgages were foreclosed on a scale that transferred a quarter of the delta\'s paddy to non-agriculturist owners inside a decade. That is the ground the tenancy agitation and the anti-Indian riots of the 1930s grew out of, and the division was also where the Karen Christian communities of the delta lived.'
  },
  Tenasserim: {
    en: 'Tenasserim Division', zh: '丹那沙林省',
    wiki: 'https://en.wikipedia.org/wiki/Tanintharyi_Region',
    short: 'The longest of the divisions',
    note: 'The longest of the divisions, running from Toungoo on the Sittang down the narrow coast almost to the Kra isthmus. Moulmein, in Amherst district, was the second port of Burma and the teak town, where the logs came down the Salween to be sawn and shipped; Tavoy and Mergui in the south had the tin and wolfram that made Burma one of the world\'s larger producers of both in the 1930s, worked in lode mines and by dredge, and the Mergui archipelago\'s eight hundred islands lie off them. At its head is the Salween District — one township of Karen hills round Papun, the smallest district in Burma by population, with no town in it and a police officer for a Deputy Commissioner, and wholly an Excluded Area after 1937.'
  },
  Magwe: {
    en: 'Magwe Division', zh: '馬圭省', wiki: 'https://en.wikipedia.org/wiki/Magway_Region',
    short: 'The dry zone: the middle Irrawaddy in the rain shadow of the Arakan Yoma',
    note: 'The dry zone: the middle Irrawaddy in the rain shadow of the Arakan Yoma, where under nine hundred millimetres fall in a year and the crops are sesame, millet, groundnut, beans and cotton rather than rice. Its wealth was oil — the seepages at Yenangyaung had been worked by hereditary hand-diggers for centuries and by the Burmah Oil Company from 1886, and the field supplied the greater part of British India\'s petroleum until the British fired it on 16 April 1942 as they withdrew. Behind it stand the Chin Hills, a district of this division on paper and a country of terraced villages and tribal chiefs in practice, administered under the Chin Hills Regulation of 1896 and an Excluded Area from 1937.'
  },
  MandalayDiv: {
    en: 'Mandalay Division', zh: '曼德勒省', wiki: 'https://en.wikipedia.org/wiki/Mandalay_Region',
    short: 'The last royal capital, taken in November 1885',
    note: 'The last royal capital, taken in November 1885, and the cultural centre of Buddhist Burma: the palace inside its moat, the monasteries, the Kuthodaw pagoda with the Tipitaka cut into seven hundred and twenty-nine marble slabs. The division is the other half of the dry zone and depends on irrigation — the Kyaukse weirs are among the oldest working waterworks in South-East Asia, and the canals of Mandalay, Shwebo and Meiktila carried the rice that the rainfall would not. Maymyo, up in the hills at a thousand metres, was where the government of Burma moved for the hot weather, and the division held the army\'s Burmese and Gurkha depots. The palace burned in the fighting of March 1945.'
  },
  Sagaing: {
    en: 'Sagaing Division', zh: '實皆省', wiki: 'https://en.wikipedia.org/wiki/Sagaing_Region',
    short: 'The largest division and the emptiest',
    note: 'The largest division and the emptiest, running from the Shwebo plain up the Chindwin and the Irrawaddy to Putao and the Triangle, and taking in Bhamo and Myitkyina with the Kachin Hill Tracts inside them. It is teak country — the Chindwin forests were the Bombay Burmah Trading Corporation\'s, and it was a quarrel over their leases that gave Britain its pretext for the war of 1885 — with jade at Hpakant, amber in the Hukawng and gold in the northern rivers. Much of it was not administered at all: the 1931 census left 28,118 square miles of the province unenumerated and most of that was here, in the Naga country, the Hukawng, the Triangle and the Putao subdivision. The Kachin Hill Tracts were Part I Excluded Areas from 1937 and the rest of Myitkyina and Bhamo Part II.'
  },
  ShanStates: {
    en: 'The Federated Shan States', zh: '撣邦',
    wiki: 'https://en.wikipedia.org/wiki/Shan_States', short: 'The plateau east of the Sittang',
    note: 'The plateau east of the Sittang, a thousand metres up and cut through by the Salween gorge, held not as districts but as thirty-three states under their own saohpa, myoza and ngwekunhmu — federated in 1922 under a Commissioner at Taunggyi with a council of chiefs and a Federal Fund fed by a share of each state\'s revenue. Rice grew in the valleys and opium in the hills; the Bawdwin mine at Namtu, worked since the Ming for silver and reopened by Herbert Hoover\'s syndicate before the First World War, was the largest lead and silver producer in the British Empire, with its own railway down to Lashio. The Federation was an Excluded Area under the 1935 Act, outside the Burmese legislature altogether, and beyond it to the east lay the Wa country, which nobody administered and whose boundary with China was not settled until 1941.'
  },
  Karenni: {
    en: 'The Karenni States — never annexed', zh: '克倫尼',
    wiki: 'https://en.wikipedia.org/wiki/Karenni_States',
    note: 'Three small states — Kantarawadi, Bawlake and Kyebogyi — which were never British territory at all. The agreement Britain made with King Mindon on 21 June 1875 declared Western Karenni "separate and independent", and after the annexation of Upper Burma in 1886 Britain held to the position that the Karenni chiefs had never been the king\'s subjects and were not now its own: they took sanads in 1889 and 1892 and were supervised by the Superintendent of the Southern Shan States, but they were left out of the Second Schedule of the 1935 Act entirely, as ground "not part of His Majesty\'s dominions", and the suzerainty lapsed only in 1948. The country is steep and forested, its people Kayah, Kayan, Bre and Padaung, and its one industry of weight was the Mawchi mine, which in the late 1930s was among the largest producers of tungsten in the world.'
  },
  Kengtung: {
    en: 'Kengtung State — Kengtung, Monghsat and Tachileik', zh: '景棟',
    wiki: 'https://en.wikipedia.org/wiki/Kengtung_State',
    note: 'The largest of the Shan states by a distance — some twelve thousand square miles across the Salween, reaching to the Mekong and the borders of China, Laos and Siam — and the one with the fewest ties to Burma: its saohpa\'s country was Tai Khün, and its trade ran east and north into Yunnan and Siam rather than down to Rangoon. Its ruler was one of only four Shan chiefs granted a permanent nine-gun salute in 1903, with Hsipaw, Yawnghwe and Möng Nai. That Tai connection is why Thailand had a claim to press here and not to the rest of the Shan States, and why this state and the trans-Salween strip beside it were the part that went.'
  },
  MongpanEast: {
    en: 'Mongpan east of the Salween', zh: '孟畔東部',
    short: 'The part of the Shan state of Mongpan lying east of the Salween',
    note: 'The part of the Shan state of Mongpan lying east of the Salween, taken with Kengtung in 1942 and handed to Thailand with it in 1943. The river is the boundary that mattered: everything east of it went, and the rest of Mongpan stayed Burmese, which is why this is a piece of a state and not a state.'
  },
  'Shaan-Gan-Ning': {
    en: 'Shǎngānníng border region — Yenan', ja: '陝甘寧辺区', zh: '陝甘寧邊區',
    wiki: 'https://en.wikipedia.org/wiki/Yan\'an_Soviet',
    note: 'The party\'s own ground, and the only base area Japan never entered: the Nationalist blockade to the south mattered more here than the Japanese line to the east. Yan\'an was its seat from 1937, and it was governed as a border region with its own currency, taxes and land policy.'
  },
  'Jin-Sui': {
    en: 'Jìnsuí — Shansi and Suiyuan', zh: '晉綏',
    note: 'The corridor between Yan\'an and the rest of the movement. Everyone and everything crossing the Yellow River into Shaan-Gan-Ning came through it, which is what it was held for; it was poor country and never fed itself.'
  },
  'Jin-Cha-Ji': {
    en: 'Jìnchájì — Shansi, Chahar and Hopei', zh: '晉察冀',
    note: 'The first base area established behind the Japanese line, from November 1937 under Nie Rongzhen, and the one the others were modelled on. It ran the elections and the rent-reduction policy that became the standard, and took the worst of the mopping-up campaigns of 1941 and 1942.'
  },
  Jinan: {
    en: 'Jìnán (Chi-nan) — southern Hopei', zh: '冀南',
    note: '冀南, the southern Hebei plain — flat, densely farmed and with no hills to retreat into, which made it the hardest kind of ground to hold. It was cut apart by blockhouse lines and ditches in 1941 and 1942 and survived as tunnels and night movement rather than as territory.'
  },
  'Taihang and Taiyue': {
    en: 'Tàiháng and Tàiyuè', zh: '太行・太岳',
    short: 'The mountain spine the Eighth Route Army\'s 129th Division held',
    note: 'The mountain spine the Eighth Route Army\'s 129th Division held, and the headquarters of the whole north China command. The Hundred Regiments Offensive was launched from here in August 1940, and the reprisals that followed fell hardest on these valleys.'
  },
  'Ji-Lu-Yu': {
    en: 'Jìlǔyù — Hopei, Shantung and Honan', zh: '冀魯豫',
    note: 'Where Hebei, Shandong and Henan meet, astride the course the Yellow River took after the 1938 breach. The flood country gave cover that the plain elsewhere did not.'
  },
  Qinghe: {
    en: 'Qīnghé — the Yellow River delta', zh: '清河',
    note: 'The Yellow River delta in northern Shandong: salt flats, reed beds and silt islands, poor for farming and awkward for a mechanised army to enter.'
  },
  Jiaodong: {
    en: 'Jiāodōng — the Shantung peninsula', zh: '膠東',
    note: 'The Shandong peninsula, with the gold mines that helped pay for the movement and a coastline that kept contact open with the areas across the gulf.'
  },
  Luzhong: {
    en: 'Lǔzhōng — central Shantung', zh: '魯中',
    note: 'The hill country of central Shandong, and the seat of the Shandong command for much of the war.'
  },
  Lunan: {
    en: 'Lǔnán — southern Shantung', zh: '魯南',
    note: 'Southern Shandong, on the Tianjin–Pukou railway, where the base area\'s business was cutting the line as much as holding ground.'
  },
  Binhai: {
    en: 'Bīnhǎi — the Shantung coast south of Kiaochow', zh: '濱海',
    note: 'The coastal strip south of Jiaozhou Bay, which linked the Shandong areas to the New Fourth Army country across the Jiangsu border.'
  },
  Subei: {
    en: 'Sūběi — northern Kiangsu', zh: '蘇北',
    note: 'Northern Jiangsu, and the New Fourth Army\'s main ground after the January 1941 incident: the army was rebuilt here under Chen Yi when Chongqing declared it disbanded.'
  },
  Huaibei: {
    en: 'Huáiběi — north of the Huai', zh: '淮北',
    note: 'North of the Huai, between the railway and the lakes, and a crossing point between the Shandong areas and the Yangtze ones.'
  },
  Huainan: {
    en: 'Huáinán — south of the Huai', zh: '淮南',
    note: 'Between the Huai and the Yangtze, close enough to Nanjing and Bengbu that it was raided constantly and never quiet.'
  },
  Suzhong: {
    en: 'Sūzhōng — central Kiangsu', zh: '蘇中',
    note: 'Central Jiangsu, the rice and cotton country north of the Yangtze, and the richest ground any of the base areas held.'
  },
  Sunan: {
    en: 'Sūnán — southern Kiangsu', zh: '蘇南',
    note: 'South of the Yangtze, between Nanjing and Shanghai — the most heavily occupied country in China, and held as scattered pockets rather than as a region.'
  },
  Wanjiang: {
    en: 'Wǎnjiāng — the Anhwei Yangtze', zh: '皖江',
    note: 'The Anhui bank of the Yangtze, west of Nanjing, rebuilt after the New Fourth Army Incident had destroyed the headquarters column not far to the south.'
  },
  Zhedong: {
    en: 'Zhèdōng — eastern Chekiang', zh: '浙東',
    note: 'Eastern Zhejiang, behind the coast south of Hangzhou Bay, and the last of the base areas to be established.'
  },
  'E-Yu-Wan': {
    en: 'Èyùwǎn — Hupeh, Honan and Anhwei', zh: '鄂豫皖',
    note: 'Where Hubei, Henan and Anhui meet in the Dabie mountains. It had been one of the largest soviets of the early 1930s, was lost in the encirclement campaigns, and was taken up again by the New Fourth Army in the war.'
  },
  Anhui: {
    en: 'Ānhuī (Anhwei) — cut in two by the Huai and again by the Yangtze: wheat and sweet potato on the northern plain, rice and tea in the hills south of the river, and between them a floodplain that drowned somewhere almost every year. Poor, populous and a byword for famine relief. The Nationalists broke the Yellow River dikes at Huayuankou in June 1938 to slow the Japanese advance, and the flood ran across northern Anhui for the next nine years; the province stayed divided for the rest of the war between the occupied railway corridor, the Nationalist pocket in the north-west, and the New Fourth Army in the hills — where in January 1941 Nationalist troops destroyed its headquarters, the Wannan Incident, and the united front effectively ended.',
    ja: '安徽 (Anki)', zh: '安徽', ko: '안후이성', wiki: 'https://en.wikipedia.org/wiki/Anhui',
    short: 'Cut in two by the Huai and again by the Yangtze'
  },
  Chahaer: {
    en: 'Cháhā’ěr (Chahar) — steppe rising north from the Wall, thin soil, mostly grazed rather than ploughed, with Zhangjiakou at its gate: the Kalgan of the caravan trade, where the brick tea, wool and hides of Outer Mongolia came south. Made a province out of a frontier special district in 1928. Japanese pressure detached the north from 1935, and from 1936 the Mongol prince Demchugdongrub headed a Japanese-sponsored government there; after Zhangjiakou fell in 1937 the province became the core of Mengchiang. Abolished in 1952 and divided between Hebei, Shanxi and Inner Mongolia.',
    ja: '察哈爾 (Chaharu)', zh: '察哈爾', ko: '차하얼성',
    wiki: 'https://en.wikipedia.org/wiki/Chahar_Province',
    short: 'Steppe rising north from the Wall, thin soil, mostly grazed rather than ploughed'
  },
  Fujian: {
    en: 'Fújiàn (Fukien) — mountains that come almost to the sea, so little flat land that the province never fed itself and the sea did the work instead: tea from the Wuyi hills, timber down the Min, and the ports that sent more emigrants to Southeast Asia than anywhere else in China, whose remittances were a real part of the provincial economy. The 19th Route Army, sent to suppress the Communists, revolted instead and declared the People\'s Government of Fujian in November 1933; Chiang Kai-shek crushed it by January. Japan took Xiamen in May 1938 and Fuzhou twice, but never the interior.',
    ja: '福建 (Fukken)', zh: '福建', ko: '푸젠성', wiki: 'https://en.wikipedia.org/wiki/Fujian',
    short: 'Mountains that come almost to the sea'
  },
  Gansu: {
    en: 'Gānsù (Kansu) — the Hexi corridor, a thread of oasis towns between the Qilian snows and the desert, carrying the old road to Central Asia and, after 1937, the lorries bringing Soviet aid to Free China. Wool, wheat where there is water, and very little else; the Muslim generals of the Ma family held the west in near-independence. One of the poorest and most isolated provinces, and a byword for famine: the drought of 1928–30 is thought to have killed millions, and the earthquake of 1920 in the loess hills perhaps 200,000 more.',
    ja: '甘粛 (Kanshuku)', zh: '甘肅', ko: '간쑤성', wiki: 'https://en.wikipedia.org/wiki/Gansu',
    short: 'The Hexi corridor, a thread of oasis towns between the Qilian snows and the desert'
  },
  Guangdong: {
    en: 'Guǎngdōng (Kwangtung) — the Pearl River delta, warm and wet enough for two or three crops a year, with silk, sugar and fruit alongside the rice, and Canton at the centre of a trade that had run to the outside world for longer than anywhere else in China. The province that sent most of the emigrants who built the Chinese communities of the Americas and Southeast Asia, and whose remittances paid for much of what was modern in it. The Nationalist revolution began here — the Canton–Hong Kong strike of 1925–26, the Northern Expedition setting out in 1926, the Canton Commune of 1927. Chen Jitang then ran it in near-independence from 1929 until 1936. Japan landed at Bias Bay in October 1938 and had Canton within ten days, cutting the last railway to Hong Kong.',
    ja: '広東 (Kanton)', zh: '廣東', ko: '광둥성', wiki: 'https://en.wikipedia.org/wiki/Guangdong',
    short: 'The Pearl River delta, warm and wet enough for two or three crops a year, with silk'
  },
  Guangxi: {
    en: 'Guǎngxī (Kwangsi) — karst towers over thin red soil, more hill than field, and poor: rice in the valleys, timber and star anise off the slopes, and not much surplus in any of it. What it exported was soldiers. The Guangxi clique under Li Zongren and Bai Chongxi ran the province as a model militarised state, conscripting and drilling on a scale nowhere else attempted, and used it to fight Chiang Kai-shek in 1929 and again in 1930 before becoming, after 1937, among the most effective commanders of the war. Japan drove down the province in 1939 to cut the road from Indochina, and again in the Ichigō offensive of 1944, which took Guilin and Liuzhou and the American airfields on them.',
    ja: '広西 (Kōsei)', zh: '廣西', wiki: 'https://en.wikipedia.org/wiki/Guangxi',
    short: 'Karst towers over thin red soil, more hill than field, and poor: rice in the valleys'
  },
  Guizhou: {
    en: 'Guìzhōu (Kweichow) — the poorest province of the interior and the one least able to feed itself: limestone hills, thin soil, cloud for much of the year, and a saying that there are never three days without rain or three acres of flat land. Maize and buckwheat where rice will not grow, mercury from Wanshan, and opium as the one crop worth the cost of carrying out. Home to Miao and Bouyei peoples with a long history of revolt against Han administration. The Long March crossed it in 1935, and at Zunyi in January that year the Party conference met that left Mao Zedong in effective command. From 1937 the road from Chongqing to Burma ran through Guiyang, and the province mattered more in five years than it had in fifty.',
    ja: '貴州 (Kishū)', zh: '貴州', ko: '구이저우성', wiki: 'https://en.wikipedia.org/wiki/Guizhou',
    short: 'The poorest province of the interior and the one least able to feed itself'
  },
  Hebei: {
    en: 'Héběi (Hopei) — the north China plain, flat, dusty and intensively farmed in wheat, millet and cotton, with the coal at Kailuan and the ports of Tianjin and Qinhuangdao. Called Zhili, the \'directly ruled\' province, until 1928: the capital moved to Nanjing that year, Beijing became Beiping, and the province was renamed to say so. Then the frontier of every Japanese encroachment in turn — the Tanggu Truce of 1933 demilitarised its north-east, the He–Umezu agreement of 1935 pushed Nationalist forces out altogether, and the East Hebei Autonomous Council was set up under Japanese sponsorship. The war proper began at the Marco Polo Bridge outside Beiping on 7 July 1937.',
    ja: '河北 (Kahoku)', zh: '河北', ko: '허베이성', wiki: 'https://en.wikipedia.org/wiki/Hebei',
    short: 'The north China plain, flat, dusty and intensively farmed in wheat, millet and cotton'
  },
  Heilongjiang: {
    en: 'Hēilóngjiāng (Heilungkiang) — the black-earth north, the deepest and best soil in China, thinly settled until the great migration from Shandong and Hebei filled it in the 1920s and 30s. Soybeans above all — Manchuria supplied most of the world\'s crop, and this province much of Manchuria\'s — with wheat, timber from the Khingan forests, and Harbin as a Russian-built railway city on the Sungari. Occupied by Japan in the winter of 1931–32 after fighting at the Nen river bridges, and folded into Manchukuo, where it was broken up and the name Lungkiang given to a smaller province. Unit 731 built its compound at Pingfang outside Harbin.',
    ja: '黒竜江 (Kokuryūkō)', zh: '黑龍江', ko: '헤이룽장성',
    wiki: 'https://en.wikipedia.org/wiki/Heilongjiang',
    short: 'The black-earth north, the deepest and best soil in China'
  },
  Henan: {
    en: 'Hénán (Honan) — the north China plain either side of the Yellow River, wheat and cotton and too many people for the land, with the Longhai and Pinghan railways crossing at Zhengzhou and making it the hinge of every campaign fought in the north. The Nationalists broke the dikes at Huayuankou in June 1938 to stop the Japanese advance on Wuhan: the river left its bed and ran south-east into the Huai, drowning several hundred thousand people and displacing millions, and did not return until 1947. The famine of 1942–43, drought compounded by requisitioning, killed perhaps two million more. Ichigō overran what was left in 1944.',
    ja: '河南 (Kanan)', zh: '河南', ko: '허난성', wiki: 'https://en.wikipedia.org/wiki/Henan',
    short: 'The north China plain either side of the Yellow River'
  },
  Hubei: {
    en: 'Húběi (Hupeh) — the Yangtze and the Han meeting at Wuhan, which by the 1920s was the industrial centre of the interior: the Hanyang ironworks and arsenal fed by the ore at Daye, cotton mills, and the head of navigation for ocean shipping. Rice and cotton on the lake plains, and floods when the river rose over them. The revolution of 1911 began at Wuchang, and the Nationalist government moved here in 1926–27 before splitting. After Nanjing fell in 1937 Wuhan became China\'s capital in all but name until the four-month battle for it ended in October 1938, when the government withdrew up the gorges to Chongqing.',
    ja: '湖北 (Kohoku)', zh: '湖北', ko: '후베이성', wiki: 'https://en.wikipedia.org/wiki/Hubei',
    short: 'The Yangtze and the Han meeting at Wuhan'
  },
  Hunan: {
    en: 'Húnán — rice from the Dongting lake plains, enough that the province was one of the country\'s granaries, with tea, timber and the antimony at Xikuangshan, the largest deposit in the world. Hills and lakes, and a strong provincial tradition of soldiering and dissent: Mao Zedong was born at Shaoshan, and the Autumn Harvest Uprising of 1927 was fought here. Changsha was burned by its own garrison in November 1938, in a scorched-earth order given in panic and carried out on a city that had not yet been threatened — one of the war\'s worst self-inflicted disasters. The city was then defended successfully three times between 1939 and 1942 before falling in 1944.',
    ja: '湖南 (Konan)', zh: '湖南', ko: '후난성', wiki: 'https://en.wikipedia.org/wiki/Hunan',
    short: 'Rice from the Dongting lake plains'
  },
  Jehol: {
    en: 'Rèhé (Jehol) — forest, grassland and dry hills beyond the Wall, the old Qing hunting country with the summer palace at Chengde, thinly populated and poor, its cash crop opium. Made a province in 1928 out of one of the frontier special districts. Japan took it in a three-week campaign in February and March 1933 and attached it to Manchukuo, which brought the frontier to the Great Wall and produced the Tanggu Truce; the province was the first ground beyond Manchuria that Japan annexed outright. Abolished in 1955 and divided between Hebei, Liaoning and Inner Mongolia.',
    ja: '熱河 (Nekka)', zh: '熱河', short: 'Forest, grassland and dry hills beyond the Wall'
  },
  Jiangsu: {
    en: 'Jiāngsū (Kiangsu) — the Yangtze delta, flat, wet, and the richest farmland in China: rice, wheat, cotton and silk, canals instead of roads, and the greatest concentration of industry in the country round Shanghai, which sat inside the province but was governed apart from it. Nanjing became the national capital in 1928. Japan landed on the Shanghai front in August 1937; the battle lasted three months and cost the Nationalists their best divisions, and Nanjing fell on 13 December, when the Japanese army massacred somewhere between tens of thousands and 300,000 people in the city and around it. The province was occupied for the rest of the war, and the collaborationist government under Wang Jingwei sat in the same capital from 1940.',
    ja: '江蘇 (Kōso)', zh: '江蘇', ko: '장쑤성', wiki: 'https://en.wikipedia.org/wiki/Jiangsu',
    short: 'The Yangtze delta, flat, wet, and the richest farmland in China: rice, wheat'
  },
  Jiangxi: {
    en: 'Jiāngxī (Kiangsi) — the Gan valley draining north into Poyang lake, rice on the flats, tungsten in the southern hills — the world\'s main source — and the porcelain kilns at Jingdezhen, working for six centuries. Also where the Chinese Communist Party built its first state: the Jiangxi Soviet, proclaimed at Ruijin in 1931, survived four encirclement campaigns and fell to the fifth in 1934, and the Long March set out from here in October of that year. Japan took Nanchang in 1939; the Ichigō offensive cleared the railway in 1944.',
    ja: '江西 (Kōsei)', zh: '江西', ko: '장시성', wiki: 'https://en.wikipedia.org/wiki/Jiangxi',
    short: 'The Gan valley draining north into Poyang lake, rice on the flats'
  },
  Jilin: {
    en: 'Jílín (Kirin) — soybeans, sorghum and forest between the Sungari and the Changbai mountains, a frontier province settled late and fast by migrants from Shandong. Changchun sat on it, an ordinary railway town until Japan made it the capital of Manchukuo in 1932, renamed it Hsinking, the New Capital, and rebuilt it with boulevards and ministries for a state that answered to the Kwantung Army. The province was occupied in the first weeks after the Mukden Incident of September 1931, and its army units split between surrender and resistance under Ma Zhanshan and others.',
    ja: '吉林 (Kirin)', zh: '吉林', ko: '지린성', wiki: 'https://en.wikipedia.org/wiki/Jilin',
    short: 'Soybeans, sorghum and forest between the Sungari and the Changbai mountains'
  },
  Liaoning: {
    en: 'Liáoníng — the industrial heart of the north-east and the most developed province in China: coal at Fushun, the open pit the largest in Asia; iron and steel at Anshan; Dalian and Yingkou for shipping; and the South Manchuria Railway, which was less a railway than a Japanese state within a state, owning mines, towns and its own garrison. Soybeans and sorghum on the Liao plain besides. Renamed from Fengtien in 1929 by Zhang Xueliang, and called Fengtien again under Manchukuo. The Mukden Incident of 18 September 1931 — a bomb on the railway, laid by Japanese officers — began the occupation here, and with it the fourteen years of war.',
    ja: '遼寧 (Ryōnei)', zh: '遼寧', ko: '랴오닝성', wiki: 'https://en.wikipedia.org/wiki/Liaoning',
    short: 'The industrial heart of the north-east and the most developed province in China'
  },
  Ningxia: {
    en: 'Níngxià (Ninghsia) — the Yellow River\'s irrigated bend, green in a band a few miles wide, with desert and the Helan mountains either side. Wheat and rice under canals dug for a thousand years, sheep and wool, and the goji and liquorice that were about all it exported. Made a province in 1928 and run as a family holding by Ma Hongkui of the Muslim Ma clique, who kept his own army and his own politics; the Communists reached its southern edge on the Long March. Never occupied by Japan, though bombed, and the frontier with Japanese-held Suiyuan ran across the desert to the east.',
    ja: '寧夏 (Neika)', zh: '寧夏', wiki: 'https://en.wikipedia.org/wiki/Ningxia',
    short: 'The Yellow River\'s irrigated bend, green in a band a few miles wide'
  },
  Qinghai: {
    en: 'Qīnghǎi (Tsinghai) — high pasture round the salt lake of Kokonor, cold, dry and mostly above 3,000 metres, grazed by Tibetan and Mongol herders rather than farmed; the Yellow and Yangtze both rise here. Wool and hides were the export, carried out by caravan. Made a province in 1928 and run by Ma Bufang of the Ma clique, whose cavalry mauled the Communist Fourth Front Army\'s Western Column in 1936–37. Nominally Chinese and in practice governed from Xining by agreement with the monasteries and the tribes; Lhasa claimed the southern grasslands throughout.',
    ja: '青海 (Seikai)', zh: '青海', ko: '칭하이성', wiki: 'https://en.wikipedia.org/wiki/Qinghai',
    short: 'High pasture round the salt lake of Kokonor, cold, dry and mostly above 3,000 metres'
  },
  Shaanxi: {
    en: 'Shǎnxī (Shensi) — the loess plateau, wind-blown yellow soil cut into ravines, and the Wei valley below it, where wheat and cotton grow and Chinese history begins: Xi\'an was the capital of eleven dynasties. Poor, eroded and drought-stricken in the north. The Long March ended here in October 1935, and Yan\'an became the Communist capital for the next decade, the base from which the Party rebuilt itself. In December 1936 Zhang Xueliang arrested Chiang Kai-shek at Xi\'an and held him until he agreed to a united front against Japan — the single event that turned the civil war into a national one.',
    ja: '陝西 (Sensei)', zh: '陝西', wiki: 'https://en.wikipedia.org/wiki/Shaanxi',
    short: 'The loess plateau, wind-blown yellow soil cut into ravines, and the Wei valley below it'
  },
  Shandong: {
    en: 'Shāndōng (Shantung) — wheat, millet, cotton and groundnuts on a densely farmed plain, a hilly peninsula between two seas, and more people than the land could hold, which is why Shandong supplied most of the migrants who filled Manchuria. Confucius\'s Qufu, Tai Shan, and at Qingdao a German colony taken by Japan in 1914 and returned in 1922, leaving a brewery and a European town behind it. The Japanese army clashed with the Northern Expedition at Jinan in 1928 and killed several thousand. Han Fuju governed from 1930, withdrew without fighting in December 1937, and was shot for it. Much of the countryside then passed to Communist base areas that the occupation never cleared.',
    ja: '山東 (Santō)', zh: '山東', ko: '산둥성', wiki: 'https://en.wikipedia.org/wiki/Shandong',
    short: 'Wheat, millet, cotton and groundnuts on a densely farmed plain'
  },
  Shanxi: {
    en: 'Shānxī (Shansi) — the richest coalfield in China under a dry loess plateau, ringed by mountains that made it easy to hold and hard to enter, with the Fen valley for wheat and millet and very little rain. Yan Xishan ruled it from 1911 to 1949, ran it with its own narrow-gauge railway so that no outside army could use it, its own currency and its own bank, built an arsenal and a steelworks at Taiyuan, and led the coalition that fought Chiang Kai-shek in the Central Plains War of 1930. Japan invaded in 1937 and took Taiyuan in November after the battles at Pingxingguan and Xinkou; the Eighth Route Army then made the Taihang mountains a base area, and the Hundred Regiments Offensive of 1940 was fought largely across this province.',
    ja: '山西 (Sansei)', zh: '山西', wiki: 'https://en.wikipedia.org/wiki/Shanxi',
    short: 'The richest coalfield in China under a dry loess plateau'
  },
  Sichuan: {
    en: 'Sìchuān (Szechwan) — the Red Basin behind the Yangtze gorges, warm, wet and walled in by mountains, the most populous province in China and among the most fertile: rice, silk, tea, tung oil, and salt from the deep bored wells at Zigong, sunk with bamboo cable centuries before anyone else drilled that far. Also a great deal of opium. Cut off enough to go its own way, and divided in the 1920s among garrison-area warlords — Liu Xiang and Liu Wenhui the largest — who fought each other steadily and were not brought under Nanjing until 1935. When the government withdrew up the gorges in 1938 and made Chongqing its wartime capital, the province became Free China\'s arsenal and granary, and was bombed for five years for it.',
    ja: '四川 (Shisen)', zh: '四川', ko: '쓰촨성', wiki: 'https://en.wikipedia.org/wiki/Sichuan',
    short: 'The Red Basin behind the Yangtze gorges, warm, wet and walled in by mountains'
  },
  Suiyuan: {
    en: 'Suíyuǎn (Suiyuan) — the Yellow River\'s northern bend, where the Hetao canals make a strip of irrigated wheat and sugar beet between the desert and the Ordos, with Baotou the railhead where the wool of the steppe met the line to Beijing. Made a province in 1928. Fu Zuoyi beat back a Japanese-sponsored Mongol force at Bailingmiao in November 1936 — the Suiyuan campaign, the first clear Chinese victory over Japanese-backed troops, and a considerable boost to national morale on the eve of the war. Japan took Baotou and the east in 1937 and it became part of Mengchiang; the west stayed Chinese throughout. Abolished in 1954 into Inner Mongolia.',
    ja: '綏遠 (Suien)', zh: '綏遠', ko: '쑤이위안성', wiki: 'https://en.wikipedia.org/wiki/Suiyuan',
    short: 'The Yellow River\'s northern bend'
  },
  Xikang: {
    en: 'Xīkāng (Sikang) — eastern Kham, a country of gorges and 5,000-metre ranges where the Yangtze, Mekong and Salween run parallel within a hundred miles of each other; Tibetan in speech, dress and religion, with monasteries rather than magistrates as the real government. Barley, yaks, and the brick tea carried west from Sichuan in exchange for wool and hides. Claimed by both Nanjing and Lhasa and effectively held by neither: Liu Wenhui ran the eastern part from Kangding after being pushed out of Sichuan in 1933. A special administrative region until 1939, then a province, and abolished in 1955 between Sichuan and Tibet.',
    ja: '西康 (Seikō)', zh: '西康', ko: '시캉성', wiki: 'https://en.wikipedia.org/wiki/Xikang',
    short: 'Eastern Kham, a country of gorges and 5,000-metre ranges where the Yangtze'
  },
  Xinjiang: {
    en: 'Xīnjiāng (Sinkiang)', ja: '新疆 (Shinkyō)', zh: '新疆',
    wiki: 'https://en.wikipedia.org/wiki/Xinjiang'
  },
  Xizang: {
    en: 'Tibet', ja: '西蔵 (Seizō)', zh: '西藏', ko: '티베트',
    wiki: 'https://en.wikipedia.org/wiki/Tibet'
  },
  Yunnan: {
    en: 'Yúnnán — a high plateau of red earth broken by gorges, on the Burmese and Indochinese frontier, mild enough to be called the land of eternal spring and mountainous enough to have kept two dozen non-Han peoples distinct. Tin from Gejiu, one of the world\'s great deposits, copper, and a very great deal of opium; a French metre-gauge railway ran from Kunming to Haiphong and did more of the province\'s trade than the rest of China did. Long Yun ruled it from 1927 to 1945 with little reference to Nanjing. When the coast was lost the province became Free China\'s back door: the Burma Road opened from Kunming in 1938, the universities of Beijing, Tsinghua and Nankai moved there as the National Southwestern Associated University, and after Burma fell in 1942 the airlift over the Hump came in over the same mountains.',
    ja: '雲南 (Unnan)', zh: '雲南', ko: '윈난성', wiki: 'https://en.wikipedia.org/wiki/Yunnan',
    short: 'A high plateau of red earth broken by gorges, on the Burmese and Indochinese frontier'
  },
  Zhejiang: {
    en: 'Zhèjiāng (Chekiang) — silk from the Hangzhou basin and the country round Lake Tai, tea from the hills, rice on the plain and a coast of fishing ports and thousands of islands; small, crowded, and among the wealthiest provinces per head. Ningbo\'s merchants ran much of Shanghai\'s banking. Japan took the north in 1937 and the coast in stages; after the Doolittle raiders of April 1942 came down in the province, the Japanese army spent three months destroying the airfields they might have used and the villages that had sheltered them, in a campaign that killed perhaps a quarter of a million people.',
    ja: '浙江 (Sekkō)', zh: '浙江', ko: '저장성', wiki: 'https://en.wikipedia.org/wiki/Zhejiang',
    short: 'Silk from the Hangzhou basin and the country round Lake Tai, tea from the hills'
  },
  Nanumea: {
    en: 'Nanumea', wiki: 'https://en.wikipedia.org/wiki/Nanumea',
    short: 'An American airfield was built here in 1943',
    note: 'An American airfield was built here in 1943, one of three in the Ellice from which the Gilberts were attacked.'
  },
  Nanumanga: {
    en: 'Nanumanga (Nanumaga)', wiki: 'https://en.wikipedia.org/wiki/Nanumanga',
    short: 'Never occupied by either side',
    note: 'Never occupied by either side. A wartime American landing party is remembered chiefly for what it did to the reef.'
  },
  Niutao: {
    en: 'Niutao', wiki: 'https://en.wikipedia.org/wiki/Niutao',
    short: 'Never occupied. The Ellice were the nearest unoccupied ground to the Japanese perimeter',
    note: 'Never occupied. The Ellice were the nearest unoccupied ground to the Japanese perimeter.'
  },
  Nui: {
    en: 'Nui', wiki: 'https://en.wikipedia.org/wiki/Nui_(atoll)',
    short: 'Never occupied; its people speak a Gilbertese dialect',
    note: 'Never occupied, and one of the Ellice atolls whose people speak a Gilbertese dialect rather than Tuvaluan — the boundary between the two groups runs through it.'
  },
  Vaitupu: {
    en: 'Vaitupu', wiki: 'https://en.wikipedia.org/wiki/Vaitupu',
    short: 'The most populous of the Ellice',
    note: 'The most populous of the Ellice, and the site of the colony\'s secondary school.'
  },
  Nukufetau: {
    en: 'Nukufetau', wiki: 'https://en.wikipedia.org/wiki/Nukufetau',
    short: 'An American airfield from 1943',
    note: 'An American airfield from 1943, the second of the three built in the group.'
  },
  Funafuti: {
    en: 'Funafuti — the seat of the Ellice Islands',
    wiki: 'https://en.wikipedia.org/wiki/Funafuti'
  },
  Nukulaelae: {
    en: 'Nukulaelae', wiki: 'https://en.wikipedia.org/wiki/Nukulaelae',
    short: 'Never occupied; two thirds of its people were carried off by slavers in 1863',
    note: 'Never occupied. Two thirds of its people had been carried off by Peruvian slavers in 1863 and it never recovered the numbers.'
  },
  Goa: {
    en: 'Goa', wiki: 'https://en.wikipedia.org/wiki/Goa',
    short: 'Portuguese since 1510, and the capital of their Indian empire',
    note: 'Afonso de Albuquerque took Goa from the sultan of Bijapur in 1510 and it became the capital of the Estado da Índia, the seat of an archbishop, a viceroy and, from 1560, the Inquisition — "Golden Goa", a city said to rival Lisbon before malaria and cholera emptied it and the government moved down the Mandovi to Panjim in 1843. The territory is a laterite plateau cut by two estuaries, with the Western Ghats rising behind it, and it lived on coconut, cashew — which the Portuguese brought from Brazil and which is distilled here into feni — rice, salt and fish, with manganese and iron ore only beginning to be worked on any scale. Its largest export by this period was people: Goans went to Bombay and to the shipping lines in such numbers that the territory ran on remittances. Portugal was neutral, so Goa stayed out of the war — except in March 1943, when a British commando party from Calcutta rowed into Mormugão harbour and the German ship interned there was scuttled to avoid capture.'
  },
  'Damão (Daman)': {
    en: 'Damão (Daman)', wiki: 'https://en.wikipedia.org/wiki/Daman,_India',
    short: 'A stretch of the Gujarat coast taken in 1559 and held ever since',
    note: 'A stretch of the Gujarat coast taken in 1559 and held ever since, split by the Damanganga river into Moti Daman inside its walls, with the fort, the churches and the administration, and Nani Daman across the water where the harbour and the boatyards are. It is flat, sandy country with salt pans, coconut and a shallow river mouth that would take nothing larger than a country craft, and its living came from fishing, from building and sailing wooden boats along the coast to Africa and Arabia, and from a distilling trade whose customers were on the other side of the frontier. The Bombay Presidency introduced prohibition in 1939, at which point a small Portuguese port a few kilometres away became considerably more interesting than it had been.'
  },
  Diu: {
    en: 'Diu', wiki: 'https://en.wikipedia.org/wiki/Diu,_India',
    short: 'An island of two hundred metres of channel off the southern tip of Saurashtra',
    note: 'An island of two hundred metres of channel off the southern tip of Saurashtra, taken in 1535 after the Portuguese helped the sultan of Gujarat against the Mughals and kept in 1546 after one of the celebrated sieges of the sixteenth century — the fortress that came out of it runs the whole length of the seaward side and is the reason anyone remembers the place. By this period it was a town of a few thousand behind the walls, living on fishing, salt evaporated in pans along the creek, and the coconut and date palms that will grow on sand. Like the rest of Portuguese India it exported its young men, in Diu\'s case largely to Mozambique.'
  },
  'Dadrá (Dadra)': {
    en: 'Dadrá (Dadra)', wiki: 'https://en.wikipedia.org/wiki/Dadra',
    short: 'Seven square kilometres and a single village',
    note: 'Seven square kilometres and a single village, sitting by itself a few kilometres inland from Daman and entirely surrounded by British India. It came to Portugal in 1783 with Nagar Haveli, made over by the Marathas in settlement of a claim for a ship taken at sea, and nothing much happened to it afterwards. It is farmland — rice, ragi and grazing on the plain below the hills — with a customs post, which in the twentieth century was the most economically significant thing about it.'
  },
  'Nagar Aveli (Nagar Haveli)': {
    en: 'Nagar Aveli (Nagar Haveli)', wiki: 'https://en.wikipedia.org/wiki/Nagar_Haveli',
    short: 'Some seventy villages of hill country inland from Damão',
    note: 'Some seventy villages spread over about five hundred square kilometres of hill country inland from Daman, ceded by the Marathas in 1783 in the same settlement as Dadra, and by far the largest piece of Portuguese India outside Goa. The land is broken and forested, drained by the Damanganga, and the great majority of the people are Warli, Dhodia and Koli cultivators who were not Portuguese-speaking and not Catholic and who were administered lightly and taxed through their own headmen. Timber cut in the forests and floated down to Daman was the territory\'s export; rice and millet were what it ate.'
  },
  'Pondicherry (Puducherry)': {
    en: 'Pondicherry (Puducherry)', wiki: 'https://en.wikipedia.org/wiki/Pondicherry',
    short: 'French from 1674, and the capital of French India',
    note: 'François Martin founded the settlement in 1674 and Dupleix made it the capital of French India and very nearly the capital of a French empire in the Carnatic before the wars of the 1750s settled that question the other way. What survived is a town laid out on a grid behind a sea wall, divided by a canal into a Ville Blanche of colonnaded houses and a Ville Noire of streets and temples, with four small districts of paddy and coconut behind it. Its old industry was cotton — the plain blue guinée cloth woven and dyed here was shipped to Senegal for the West African trade — and by the 1930s it had a spinning mill, oil presses and a brisk business in carrying goods across a customs line into British India. Sri Aurobindo had settled here in 1910 to be out of British reach, and the ashram built round him from 1926 made the town a place people came to for a quite different reason.'
  },
  'Karikal (Karaikal)': {
    en: 'Karikal (Karaikal)', wiki: 'https://en.wikipedia.org/wiki/Karaikal',
    short: 'Bought from the raja of Thanjavur in 1739',
    note: 'Bought from the raja of Thanjavur in 1739, a compact block of the Cauvery delta with a small port at its mouth, which is to say some of the most productive rice land in southern India. It grew paddy, coconut and groundnut, milled and shipped rice, and had one of the very few sea outlets that was not under British customs. Beyond that it was a quiet town of temples and a colonial administration, tied to Pondicherry a hundred kilometres up the coast.'
  },
  'Yanaon (Yanam)': {
    en: 'Yanaon (Yanam)', wiki: 'https://en.wikipedia.org/wiki/Yanaon',
    short: 'A few square kilometres on a creek of the Godavari delta',
    note: 'A few square kilometres on a creek of the Godavari delta, held from the 1720s and never more than a village with a residency, a customs house and a couple of thousand people. The delta round it is heavy irrigated rice country and the enclave grew the same, with a little coastal trade and, again, the advantage of being outside British India for anything the British taxed. It is the smallest and least visited of the five French settlements, and the one furthest from Pondicherry\'s reach.'
  },
  'Mahé (Mahe)': {
    en: 'Mahé (Mahe)', wiki: 'https://en.wikipedia.org/wiki/Mah%C3%A9',
    short: 'The French post on the Malabar coast',
    note: 'The French post on the Malabar coast, established in 1721 at the mouth of a river running out of the Western Ghats, and originally there for one thing: the pepper that came down from the hills behind. The pepper trade went to the British in the nineteenth century and what remained was a town of some ten thousand people on nine square kilometres, growing coconut and areca and enclosed on every side by British Malabar. Its twentieth-century economy was frankly the frontier — tobacco, liquor and cloth carried the short distance into Madras Presidency — and the enclave\'s own politics were shaped by the Malayali world it sat inside rather than by Pondicherry.'
  },
  'Chandernagore (Chandannagar)': {
    en: 'Chandernagore (Chandannagar)', wiki: 'https://en.wikipedia.org/wiki/Chandannagar',
    short: 'A French factory on the Hooghly from 1673, thirty-five kilometres above Calcutta',
    note: 'A French factory on the Hooghly from 1673, thirty-five kilometres above Calcutta, which was a serious rival to the British settlement until Clive took and dismantled it in 1757 and the wars of 1794 and 1803 finished the job. What was left was a riverside town of some twenty-five thousand people with a strand, a church, a French school and jute mills at Gondalpara, prosperous enough but with no hinterland at all. Its real importance in this period was jurisdictional: a few square kilometres of French soil in the middle of Bengal, half an hour from Calcutta, where Bengali revolutionaries could print, meet and shelter beyond the reach of British police — which they did, from the Swadeshi years onwards, and which the two governments argued about for decades.'
  },
  Tonkin: { en: 'Tonkin (protectorate)', zh: '東京', wiki: 'https://en.wikipedia.org/wiki/Tonkin' },
  Annam: {
    en: 'Annam (protectorate)', zh: '安南',
    wiki: 'https://en.wikipedia.org/wiki/Annam_(French_protectorate)'
  },
  Cochinchina: { en: 'Cochinchina (colony)', zh: '交趾支那', wiki: 'https://en.wikipedia.org/wiki/Cochinchina' },
  Cambodia: { en: 'Cambodia (protectorate)', zh: '柬埔寨', wiki: 'https://en.wikipedia.org/wiki/Cambodia' },
  Laos: { en: 'Laos (protectorate)', zh: '寮國', wiki: 'https://en.wikipedia.org/wiki/Laos' },
  'Sado Island': {
    en: 'Sado (Sadogashima)', ja: '佐渡島 (Sadogashima)', zh: '佐渡島', ko: '사도가섬',
    wiki: 'https://en.wikipedia.org/wiki/Sado_Island',
    short: 'Gold and silver, worked from 1601',
    note: 'The gold and silver of Sado were worked from 1601 and paid for a good deal of the Tokugawa state; before that it was where the court sent people it wanted out of the way, Emperor Juntoku and the priest Nichiren among them. Korean and Chinese conscripts were worked in the mines during the war.'
  },
  'Tsushima Island': {
    en: 'Tsushima', ja: '対馬 (Tsushima)', zh: '對馬', ko: '쓰시마섬',
    wiki: 'https://en.wikipedia.org/wiki/Tsushima_Island',
    short: 'Halfway between Kyūshū and Korea',
    note: 'Halfway between Kyūshū and Korea, and for three centuries the Sō family held the Korea trade from it under the shogunate\'s licence. Fortified from the 1880s as the gate to the strait, and the Russian fleet was destroyed off it in May 1905.'
  },
  'Iki Island': {
    en: 'Iki', ja: '壱岐島 (Ikinoshima)', zh: '壹岐島', ko: '이키섬',
    wiki: 'https://en.wikipedia.org/wiki/Iki_Island',
    short: 'On the same road to Korea, and where the Mongol fleets landed in 1274 and again in 1281',
    note: 'On the same road to Korea, and where the Mongol fleets landed in 1274 and again in 1281, killing most of the population both times.'
  },
  'Awaji Island': {
    en: 'Awajishima', ja: '淡路島 (Awajishima)', zh: '淡路島', ko: '아와지섬',
    wiki: 'https://en.wikipedia.org/wiki/Awaji_Island',
    short: 'In the Inland Sea between Kōbe and Shikoku, and known for its onions',
    note: 'In the Inland Sea between Kōbe and Shikoku, and known for its onions, its roof tiles and a puppet theatre older than Bunraku.'
  },
  Shodoshima: {
    en: 'Shōdoshima', ja: '小豆島 (Shōdoshima)', zh: '小豆島', ko: '쇼도섬',
    wiki: 'https://en.wikipedia.org/wiki/Sh%C5%8Ddoshima',
    short: 'Where olives were first grown in Japan, from 1908',
    note: 'Where olives were first grown in Japan, from 1908, on land the government thought might suit them. Soy sauce and stone for Osaka Castle came from it too.'
  },
  Dōgo: {
    en: 'Dōgo — the main island of the Oki group', ja: '隠岐島後 (Oki Dōgo)', zh: '隱岐島後',
    wiki: 'https://en.wikipedia.org/wiki/Oki_Islands',
    note: 'The largest of the Oki islands, and the court\'s furthest place of exile: the emperors Go-Toba and Go-Daigo were both sent here, and Go-Daigo got away again.'
  },
  Shimoshima: {
    en: 'Shimoshima — the larger of the Amakusa islands', ja: '天草下島 (Amakusa Shimoshima)',
    zh: '天草下島', wiki: 'https://en.wikipedia.org/wiki/Amakusa',
    note: 'The larger of the Amakusa islands, and Christian country until the rebellion of 1637 was put down and the survivors went underground for two centuries.'
  },
  'Rishiri Island': {
    en: 'Rishiri', ja: '利尻島 (Rishiritō)', zh: '利尻島', ko: '리시리섬',
    wiki: 'https://en.wikipedia.org/wiki/Rishiri_Island',
    short: 'A single volcanic cone off north-west Hokkaidō, and a herring station',
    note: 'A single volcanic cone off the north-west of Hokkaidō, and a herring station in the years when the herring still came.'
  },
  'Rebun Island': {
    en: 'Rebun', ja: '礼文島 (Rebuntō)', zh: '禮文島', ko: '레분섬',
    wiki: 'https://en.wikipedia.org/wiki/Rebun_Island',
    short: 'The northernmost island of Hokkaidō\'s coast, treeless and flowered',
    note: 'The northernmost island of Hokkaidō\'s coast, treeless and flowered, and a herring and kelp fishery.'
  },
  'Okushiri-to': {
    en: 'Okushiri', ja: '奥尻島 (Okushiritō)', zh: '奧尻島', ko: '오쿠시리섬',
    wiki: 'https://en.wikipedia.org/wiki/Okushiri_Island',
    short: 'A herring island off south-west Hokkaidō',
    note: 'Off the south-west of Hokkaidō, a herring island whose catch collapsed with the rest of the fishery between the wars.'
  },
  Izuoshima: {
    en: 'Izu Ōshima', ja: '伊豆大島 (Izu Ōshima)', zh: '伊豆大島', ko: '이즈오섬',
    wiki: 'https://en.wikipedia.org/wiki/Izu_%C5%8Cshima',
    short: 'The nearest of the Izu islands to Tokyo',
    note: 'The nearest of the Izu islands to Tokyo, and its volcano Mihara was close enough to the capital to be a day\'s outing — and, in the 1930s, notorious as a place people went to jump into it.'
  },
  Kamishima: {
    en: 'Kamishima', ja: '天草上島 (Amakusa Kamishima)', zh: '天草上島',
    wiki: 'https://en.wikipedia.org/wiki/Kamishima_Island,_Amakusa',
    short: 'The eastern of the two Amakusa islands',
    note: 'The eastern of the two Amakusa islands. Amakusa was Christian ground in the sixteenth century and rose with Shimabara in 1637; after the rising it was held directly by the shogunate, and lived on fish, salt and a little coal.'
  },
  Nagashima: {
    en: 'Nagashima', ja: '長島 (Nagashima)', zh: '長島',
    wiki: 'https://en.wikipedia.org/wiki/Nagashima_Island,_Kagoshima',
    short: 'Off the northern tip of Kagoshima across the narrow Kuronoseto strait',
    note: 'Off the northern tip of Kagoshima across the narrow Kuronoseto strait, and Satsuma\'s outpost on that side. Terraced fields and yellowtail fishing; no bridge until 1974.'
  },
  'Ōyanojima': {
    en: 'Ōyanojima', ja: '大矢野島 (Ōyanojima)', zh: '大矢野島',
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cyano-jima',
    short: 'The Amakusa island nearest the Kyūshū shore',
    note: 'The Amakusa island nearest the Kyūshū shore, and where Amakusa Shirō, the boy who led the Shimabara rising of 1637, is said to have been born.'
  },
  Nishinoshima: {
    en: 'Nishinoshima', ja: '西ノ島 (Nishinoshima)', zh: '西之島', ko: '니시노시마정',
    wiki: 'https://en.wikipedia.org/wiki/Nishinoshima,_Shimane',
    short: 'One of the three Dōzen islands of Oki, the rim of a drowned crater',
    note: 'One of the three Dōzen islands of Oki, the rim of a drowned crater. The retired emperor Go-Toba was exiled here after the Jōkyū war of 1221 and died on the island in 1239.'
  },
  'Chiburi-jima': {
    en: 'Chiburijima', ja: '知夫里島 (Chiburijima)', zh: '知夫里島', ko: '지부리섬',
    wiki: 'https://en.wikipedia.org/wiki/Chiburijima',
    short: 'The smallest and southernmost of the Oki Dōzen',
    note: 'The smallest and southernmost of the Oki Dōzen, cliffs down its western side and common grazing on top. Go-Daigo was held somewhere in these islands from 1332 and escaped in 1333; by one account it was from here.'
  },
  Hachijojima: {
    en: 'Hachijōjima', ja: '八丈島 (Hachijōjima)', zh: '八丈島', ko: '하치조섬',
    wiki: 'https://en.wikipedia.org/wiki/Hachij%C5%8D-jima',
    short: 'Two volcanoes joined at the waist, 290 km south of Tokyo',
    note: 'Two volcanoes joined at the waist, 290 km south of Tokyo, and an exile island under the Tokugawa: Ukita Hideie, on the losing side at Sekigahara, was sent here and lived on it fifty years. Its export was kihachijō, a yellow silk pongee woven by the island\'s women.'
  },
  Miyakejima: {
    en: 'Miyakejima', ja: '三宅島 (Miyakejima)', zh: '三宅島', ko: '미야케섬',
    wiki: 'https://en.wikipedia.org/wiki/Miyake-jima',
    short: 'A volcano that erupts about every twenty years — 1874, 1940, 1962',
    note: 'A volcano that erupts about every twenty years — 1874, 1940, 1962 — and an exile island before that. The eruption of 1940 killed eleven people.'
  },
  Niijima: {
    en: 'Niijima', ja: '新島 (Niijima)', zh: '新島', ko: '니지마섬',
    wiki: 'https://en.wikipedia.org/wiki/Nii-jima',
    short: 'Quarried for kōga stone, a pale volcanic rock carried to Tokyo for building',
    note: 'Quarried for kōga stone, a pale volcanic rock carried to Tokyo for building, and one of the Izu exile islands.'
  },
  Kozushima: {
    en: 'Kōzushima', ja: '神津島 (Kōzushima)', zh: '神津島', ko: '고즈섬',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dzu-shima',
    short: 'Obsidian was carried from here to the mainland in the Jōmon period',
    note: 'Obsidian was carried from here to the mainland in the Jōmon period, across forty kilometres of open sea — the earliest evidence of sea crossing in Japan. Christians were exiled to the island after 1614.'
  },
  Mikurajima: {
    en: 'Mikurajima', ja: '御蔵島 (Mikurajima)', zh: '御藏島', ko: '미쿠라섬',
    wiki: 'https://en.wikipedia.org/wiki/Mikura-jima',
    short: 'Steep on every side, one village of a few hundred people',
    note: 'Steep on every side, one village of a few hundred people, and a ferry that lands only when the sea allows. Old-growth forest on the slopes above it.'
  },
  Toshima: {
    en: 'Toshima', ja: '利島 (Toshima)', zh: '利島',
    wiki: 'https://en.wikipedia.org/wiki/To-shima,_Tokyo',
    short: 'A single cone with no harbour and about three hundred people, living by the camellias',
    note: 'A single cone with no harbour and about three hundred people, living by the camellias — the oil pressed from their seed is what the island sells.'
  },
  'Shikine-jima': {
    en: 'Shikinejima', ja: '式根島 (Shikinejima)', zh: '式根島', ko: '시키네섬',
    wiki: 'https://en.wikipedia.org/wiki/Shikine-jima',
    short: 'Split from Niijima by an earthquake, the islanders say',
    note: 'Split from Niijima by an earthquake, the islanders say, and left with hot springs among the rocks at the water\'s edge.'
  },
  Aogashima: {
    en: 'Aogashima', ja: '青ヶ島 (Aogashima)', zh: '青島', ko: '아오가섬',
    wiki: 'https://en.wikipedia.org/wiki/Aogashima', short: 'A crater within a crater',
    note: 'A crater within a crater, 360 km south of Tokyo and the remotest inhabited island of the Izu chain. The eruption of 1785 killed about half the islanders; the rest fled to Hachijōjima and did not return for fifty years.'
  },
  Torishima: {
    en: 'Torishima', ja: '鳥島 (Torishima)', zh: '鳥島',
    wiki: 'https://en.wikipedia.org/wiki/Tori-shima_(Izu_Islands)',
    short: 'Albatross were killed here for their feathers from 1887, millions of them',
    note: 'Albatross were killed here for their feathers from 1887, millions of them, until the eruption of 1902 killed all 125 people on the island. It is uninhabited now, and the last breeding ground of the short-tailed albatross.'
  },
  Naoshima: {
    en: 'Naoshima', ja: '直島 (Naoshima)', zh: '直島', ko: '나오시마정',
    wiki: 'https://en.wikipedia.org/wiki/Naoshima',
    short: 'A Mitsubishi copper smelter opened here in 1917 and the island lived by it',
    note: 'A Mitsubishi copper smelter opened here in 1917 and the island lived by it; the fumes stripped the hills. The art museums came in the 1990s.'
  },
  Teshima: {
    en: 'Teshima', ja: '豊島 (Teshima)', zh: '豐島', ko: '데시마섬',
    wiki: 'https://en.wikipedia.org/wiki/Teshima',
    short: 'Spring water and terraced rice, which most Inland Sea islands lack, and granite quarries',
    note: 'Spring water and terraced rice, which most Inland Sea islands lack, and granite quarries. Half a million tonnes of industrial waste were dumped on it from 1975 and took until 2017 to clear away.'
  },
  Inujima: {
    en: 'Inujima', ja: '犬島 (Inujima)', zh: '犬島', wiki: 'https://en.wikipedia.org/wiki/Inujima',
    short: 'Quarried for the granite of Osaka Castle',
    note: 'Quarried for the granite of Osaka Castle, and a copper refinery worked here from 1909 to 1919; its brick chimneys are still standing.'
  },
  Hokkaido: {
    en: 'Hokkaidō-chō', ja: '北海道庁 (Hokkaidō-chō)', zh: '北海道廳',
    short: 'Not a prefecture but the Hokkaidō-chō, an agency of the central government',
    note: 'Not a prefecture but the Hokkaidō-chō, an agency of the central government, and the one part of Japan settled as a frontier: the Colonisation Commission began in 1869, farm households were brought in from the poorer parts of Tōhoku, and the Ainu were dispossessed of the land and then of the right to hunt on it. The island was worth taking for coal — the Ishikari field and Yūbari above all, which fed the navy and the railways — and for herring, timber and the only large arable frontier the country had. Sapporo was laid out on an American grid by the Commission and is the youngest large city in Japan.'
  },
  Aomori: {
    en: 'Aomori-ken', ja: '青森県 (Aomori)', zh: '青森縣', ko: '아오모리현',
    wiki: 'https://en.wikipedia.org/wiki/Aomori_Prefecture',
    short: 'The northern end of Honshū, made out of the Tsugaru and Nanbu country',
    note: 'The northern end of Honshū, made out of the Tsugaru and Nanbu country, with the castle town of Hirosaki as the older centre and the port of Aomori as the newer. Aomori was the ferry terminus for Hakodate, so everything going to and from Hokkaidō passed through it, and the Tsugaru plain has grown apples for export since the 1870s. Ōminato, on Mutsu Bay, was a naval guard district, and Hirosaki was the garrison town of the 8th Division, the division whose men died in the Hakkōda snow march of 1902.'
  },
  Iwate: {
    en: 'Iwate-ken', ja: '岩手県 (Iwate)', zh: '岩手縣', ko: '이와테현',
    wiki: 'https://en.wikipedia.org/wiki/Iwate_Prefecture',
    short: 'The largest prefecture on Honshū and the poorest',
    note: 'The largest prefecture on Honshū and the poorest, the old Nanbu domain with its castle town at Morioka, cold enough that the summer yamase wind off the Pacific can take the rice crop altogether. The failures of 1931, 1934 and 1935 are the ones the country noticed: families in the Sanriku villages sold daughters into service and the army officers who mutinied in 1936 talked about this coast. Its one industry of weight was iron — Kamaishi, where the first Western-style blast furnace in Japan was blown in in 1857 and a modern works built in 1880, and which American and British battleships shelled from the sea in July and August 1945.'
  },
  Miyagi: {
    en: 'Miyagi-ken', ja: '宮城県 (Miyagi)', zh: '宮城縣', ko: '미야기현',
    wiki: 'https://en.wikipedia.org/wiki/Miyagi_Prefecture', short: 'The old Date domain',
    note: 'The old Date domain, whose castle town Sendai was and is the largest city in Tōhoku and the region\'s commercial and military capital, with the 2nd Division quartered there. The Sendai plain is good rice country and the coast north of it is the drowned Sanriku shore, deep-water bays that make fine harbours and funnel tsunami — the wave of 1933 killed some three thousand people along it. Matsushima, in the bay, was one of the three views a Japanese traveller was expected to have seen.'
  },
  Akita: {
    en: 'Akita-ken', ja: '秋田県 (Akita)', zh: '秋田縣',
    short: 'Rice on the Yokote basin and the Ōdate country',
    note: 'Rice on the Yokote basin and the Ōdate country, cedar forests that supplied timber to the whole north, and two things scarce in Japan: metal and oil. The Kosaka and Osarizawa mines were among the country\'s largest copper producers, and the Yabase field at Akita city was one of the very few domestic oilfields, which mattered a great deal to a state whose fuel came by sea from somewhere else. The prefecture is also snow country, cut off for months, and lost people steadily to Tokyo and to Hokkaidō.'
  },
  Yamagata: {
    en: 'Yamagata-ken', ja: '山形県 (Yamagata)', zh: '山形縣', ko: '야마가타현',
    wiki: 'https://en.wikipedia.org/wiki/Yamagata_Prefecture',
    short: 'The Mogami valley behind the Dewa mountains, opening on the Japan Sea at Sakata',
    note: 'The Mogami valley behind the Dewa mountains, opening on the Japan Sea at Sakata, which shipped the north\'s rice down the coast to Osaka in the sailing-ship years and kept the warehouses to prove it. Yonezawa, the Uesugi castle town in the south, wove silk and was one of the places where a domain deliberately turned itself into a textile district in the nineteenth century. Safflower for dye had been the cash crop, killed by chemical dyes; sericulture, rice and fruit took its place.'
  },
  Fukushima: {
    en: 'Fukushima-ken', ja: '福島県 (Fukushima)', zh: '福島縣', ko: '후쿠시마현',
    wiki: 'https://en.wikipedia.org/wiki/Fukushima_Prefecture',
    short: 'The largest prefecture in Tōhoku and three countries in one: the Hamadōri coast',
    note: 'The largest prefecture in Tōhoku and three countries in one: the Hamadōri coast, the Nakadōri basins along the road north, and Aizu behind the mountains. Aizu- Wakamatsu was the domain that fought for the shogunate to the end in 1868, and the boys of the Byakkotai who killed themselves on Iimoriyama were a set piece of schoolbook patriotism afterwards. It lived on silk in the basins and on coal at Jōban, the field that runs into Ibaraki and was the one large coalfield near Tokyo.'
  },
  Ibaraki: {
    en: 'Ibaraki-ken', ja: '茨城県 (Ibaraki)', zh: '茨城縣', ko: '이바라키현',
    wiki: 'https://en.wikipedia.org/wiki/Ibaraki_Prefecture',
    short: 'Mito, the castle town, was the seat of a Tokugawa branch house and of the Mito school',
    note: 'Mito, the castle town, was the seat of a Tokugawa branch house and of the Mito school, the scholarship that gave the slogan "revere the emperor, expel the barbarian" to the men who brought the shogunate down. The prefecture is flat and agricultural, and Lake Kasumigaura carried the naval air station and flying school where most of Japan\'s naval pilots were trained. Hitachi, on the coast, grew from a copper mine into the electrical works that took its name, and was bombed and shelled from the sea in 1945 for that reason.'
  },
  Tochigi: {
    en: 'Tochigi-ken', ja: '栃木県 (Tochigi)', zh: '栃木縣', ko: '도치기현',
    wiki: 'https://en.wikipedia.org/wiki/Tochigi_Prefecture',
    short: 'Nikkō is here — the mausoleum of Ieyasu',
    note: 'Nikkō is here — the mausoleum of Ieyasu, the most elaborate building complex in Japan and a place every schoolchild was taken to — and so is Ashikaga, weaving silk since the middle ages. The prefecture\'s other fame is unhappier: the Ashio copper mine poisoned the Watarase river from the 1880s, ruined the farmland below it, and produced in Tanaka Shōzō the first sustained environmental protest in the country, which he took as far as attempting to petition the emperor in person. Otherwise it is rice, hemp and the plain north of Tokyo.'
  },
  Gunma: {
    en: 'Gunma-ken', ja: '群馬県 (Gunma)', zh: '群馬縣', ko: '군마현',
    wiki: 'https://en.wikipedia.org/wiki/Gunma_Prefecture',
    short: 'The centre of the raw silk that paid for Japan\'s industrialisation: Tomioka',
    note: 'The centre of the raw silk that paid for Japan\'s industrialisation: Tomioka, the government\'s model filature of 1872, is here, and so are Maebashi and the weaving town of Kiryū. Silk was the country\'s largest export until the American market collapsed after 1929, and the collapse fell on the farm households of this prefecture harder than on anyone. Mount Asama, an active volcano, stands on its border, and the mountains behind it were where the Nakasendō crossed to the Japan Sea side.'
  },
  Saitama: {
    en: 'Saitama-ken', ja: '埼玉県 (Saitama)', zh: '埼玉縣',
    short: 'Market gardens, wheat and mulberry on the plain immediately north of Tokyo',
    note: 'Market gardens, wheat and mulberry on the plain immediately north of Tokyo, close enough to feed the capital and to lose its young people to it. Kawagoe kept a street of fireproof warehouse-fronted merchant houses from the years when it was the river port for that trade. In the hills at Chichibu, in 1884, a debt-ridden peasant army of several thousand took over the county for a week and had to be put down by troops — the largest armed rising against the Meiji state after Satsuma.'
  },
  Chiba: {
    en: 'Chiba-ken', ja: '千葉県 (Chiba)', zh: '千葉縣', ko: '지바현',
    wiki: 'https://en.wikipedia.org/wiki/Chiba_Prefecture',
    short: 'The Bōsō peninsula, farming and fishing, and the soy-sauce towns: Noda and Chōshi',
    note: 'The Bōsō peninsula, farming and fishing, and the soy-sauce towns: Noda and Chōshi, where the brewers who became Kikkoman and Yamasa had been at work since the seventeenth century, sending the sauce up the river to Edo. Chōshi is also one of Japan\'s great fishing ports, on the shelf where the cold and warm currents meet. The army kept much of its school system on the sandy uplands here — cavalry, railways and other branches at Narashino and Chiba — because the ground was cheap and Tokyo was an hour away.'
  },
  Tokyo: {
    en: 'Tōkyō-fu', ja: '東京府 (Tōkyō)', zh: '東京府', ko: '도쿄부',
    wiki: 'https://en.wikipedia.org/wiki/Tokyo_Prefecture_(1868%E2%80%931943)',
    short: 'Tokyo-fu: the prefecture',
    note: 'Tokyo-fu: the prefecture, which contained Tokyo City until the two were abolished and merged into the Tokyo Metropolis on 1 July 1943, and which also runs out to sea to take in the Izu and Bonin islands. It held the palace, the Diet, the ministries, the general staff, the universities and about a tenth of the country\'s people, and it had been almost entirely rebuilt once already after the earthquake and fire of 1 September 1923 killed something over a hundred thousand people. The Doolittle raid touched it in April 1942; the firebombing of the night of 9–10 March 1945 burnt out sixteen square miles of it and killed on the order of a hundred thousand in a single night, the deadliest air raid of the war.'
  },
  Kanagawa: {
    en: 'Kanagawa-ken', ja: '神奈川県 (Kanagawa)', zh: '神奈川縣', ko: '가나가와현',
    wiki: 'https://en.wikipedia.org/wiki/Kanagawa_Prefecture',
    short: 'Yokohama was opened to foreign trade in 1859 and became the country\'s gate',
    note: 'Yokohama was opened to foreign trade in 1859 and became the country\'s gate: raw silk went out through it, ideas and people came in through it, and by 1930 it was the second port of Japan. Yokosuka, round the point, was the navy\'s oldest modern dockyard and the headquarters of a naval district; Kawasaki, between Yokohama and Tokyo, was one long belt of steel, chemicals and shipbuilding. All three were destroyed from the air in 1945, Yokohama in a single raid on 29 May.'
  },
  Niigata: {
    en: 'Niigata-ken', ja: '新潟県 (Niigata)', zh: '新潟縣', ko: '니가타현',
    wiki: 'https://en.wikipedia.org/wiki/Niigata_Prefecture',
    short: 'The country\'s rice prefecture, the long Echigo plain behind sand dunes',
    note: 'The country\'s rice prefecture, the long Echigo plain behind sand dunes, and the deepest snow in inhabited Japan. Niigata city was the main Japan Sea port for the run to Korea and Manchuria, and the prefecture also had oil — the Niitsu field — and the gold and silver of Sado, which is administratively part of it. Tanaka Kakuei\'s later politics of tunnels and subsidies came out of exactly this combination: fertile, populous, and cut off behind mountains for half the year.'
  },
  Toyama: {
    en: 'Toyama-ken', ja: '富山県 (Toyama)', zh: '富山縣', ko: '도야마현',
    wiki: 'https://en.wikipedia.org/wiki/Toyama_Prefecture',
    short: 'Water is what this prefecture sold',
    note: 'Water is what this prefecture sold. The rivers off the Tateyama range fall fast enough to make hydro-electricity cheaply, and from the 1920s that power drew the aluminium, carbide and chemical works that clustered on Toyama Bay. It is also where the rice riots of 1918 began — fishermen\'s wives at Uozu blocking the rice being shipped out while the price at home rose — and the disturbances spread across the country and brought down the Terauchi cabinet. Its older trade was the travelling medicine seller, who left a box of remedies in a house and collected for what had been used on the next round.'
  },
  Ishikawa: {
    en: 'Ishikawa-ken', ja: '石川県 (Ishikawa)', zh: '石川縣', ko: '이시카와현',
    wiki: 'https://en.wikipedia.org/wiki/Ishikawa_Prefecture',
    short: 'Kanazawa was the castle town of the Maeda',
    note: 'Kanazawa was the castle town of the Maeda, the richest house in Japan after the shogun with more than a million koku, and a domain that spent its money on craft: gold leaf, Kutani porcelain, Kaga silk dyeing, lacquer at Wajima. It was big enough and old enough that the city came through the war unbombed, which is why it still has its tea districts and its samurai streets. The 9th Division was raised here, and the Noto peninsula behind it is fishing and salt country.'
  },
  Fukui: {
    en: 'Fukui-ken', ja: '福井県 (Fukui)', zh: '福井縣', ko: '후쿠이현',
    wiki: 'https://en.wikipedia.org/wiki/Fukui_Prefecture',
    short: 'Habutae, a plain smooth silk',
    note: 'Habutae, a plain smooth silk, was woven here in enormous quantity for export to America and Europe, and Fukui was the centre of it — a single-crop industry that went down with the silk market after 1929. Tsuruga, on the bay, was the port for the Japan Sea crossing to Vladivostok, and so the beginning of the overland route to Europe: the through tickets sold in Tokyo went by rail to Tsuruga, ship to Vladivostok and Trans-Siberian to Berlin. Eiheiji, the head temple of the Sōtō Zen school, is in the mountains behind it.'
  },
  Yamanashi: {
    en: 'Yamanashi-ken', ja: '山梨県 (Yamanashi)', zh: '山梨縣', ko: '야마나시현',
    wiki: 'https://en.wikipedia.org/wiki/Yamanashi_Prefecture',
    short: 'A basin ringed by mountains with Kōfu in the middle, the old Kai of Takeda Shingen',
    note: 'A basin ringed by mountains with Kōfu in the middle, the old Kai of Takeda Shingen, landlocked and short of flat land. It grew grapes — Katsunuma has made wine since the 1870s, the first in Japan — and raised silkworms on the slopes where rice would not go. Mount Fuji stands on its southern border, and the prefecture\'s other export was people, to Tokyo over the Kōshū road.'
  },
  Nagano: {
    en: 'Nagano-ken', ja: '長野県 (Nagano)', zh: '長野縣', ko: '나가노현',
    wiki: 'https://en.wikipedia.org/wiki/Nagano_Prefecture', short: 'The silk prefecture',
    note: 'The silk prefecture: the filatures at Okaya and round Lake Suwa were the largest concentration of reeling machinery in the country, worked by girls hired out of farm households on yearly contracts, whose conditions were the subject of the first serious factory investigations in Japan. It is also the most mountainous prefecture, with the ranges the English called the Japanese Alps, and Zenkōji at Nagano drew pilgrims from all over the country. More settlers went from here to Manchuria than from anywhere else — the prefecture organised its own village brigades — and more of them died in 1945.'
  },
  Gifu: {
    en: 'Gifu-ken', ja: '岐阜県 (Gifu)', zh: '岐阜縣', ko: '기후현',
    wiki: 'https://en.wikipedia.org/wiki/Gifu_Prefecture',
    short: 'Two prefectures in one: the Nōbi plain in the south',
    note: 'Two prefectures in one: the Nōbi plain in the south, which is industrial and part of Nagoya\'s world, and the Hida mountains in the north, which are timber and isolation. Mino paper and Seki cutlery are old trades here, and Kakamigahara on the plain held one of the army\'s chief air bases and the Kawasaki aircraft works beside it. The Nōbi earthquake of 1891, the largest inland earthquake in recorded Japanese history, was centred in this prefecture and is what started seismology as a state science in Japan.'
  },
  Shizuoka: {
    en: 'Shizuoka-ken', ja: '静岡県 (Shizuoka)', zh: '靜岡縣', ko: '시즈오카현',
    wiki: 'https://en.wikipedia.org/wiki/Shizuoka_Prefecture',
    short: 'Tea and mandarins above the Tōkaidō, and the largest tea crop in the country',
    note: 'Tea and mandarins on the slopes above the Tōkaidō, and the largest tea crop in the country by a distance — the Makinohara plateau was cleared for it after 1869 by unemployed retainers of the last shogun, who had retired to Sunpu here. Shimizu was the port that shipped the tea, and mandarins came off the same warm slopes above the bay. Hamamatsu at the western end made textile machinery, musical instruments and, later, aircraft engines, which is why it was one of the most heavily bombed medium-sized cities in Japan and was shelled from the sea as well.'
  },
  Aichi: {
    en: 'Aichi-ken', ja: '愛知県 (Aichi)', zh: '愛知縣', ko: '아이치현',
    wiki: 'https://en.wikipedia.org/wiki/Aichi_Prefecture',
    short: 'Nagoya was the third city of Japan and its most important arms centre',
    note: 'Nagoya was the third city of Japan and its most important arms centre: the Mitsubishi works there built the A6M Zero, the Aichi company built naval aircraft, and the whole Nōbi plain was engineering, textile machinery and pottery. The Toyoda family\'s automatic loom business, in Kariya, turned itself into a car company in 1937. The city was bombed repeatedly from December 1944 and burnt in March and May 1945; the castle, one of the great surviving keeps, went with it.'
  },
  Mie: {
    en: 'Mie-ken', ja: '三重県 (Mie)', zh: '三重縣', ko: '미에현',
    wiki: 'https://en.wikipedia.org/wiki/Mie_Prefecture', short: 'The Ise Shrine is here',
    note: 'The Ise Shrine is here, and after 1868 that made the prefecture the centre of gravity of state Shinto — school parties, army recruits and organised pilgrim associations came in millions, and the shrine is rebuilt every twenty years to the same plan. Toba, on the same coast, is where Mikimoto Kōkichi produced the first cultured pearls in 1893 and built an industry that was one of Japan\'s more unusual exports. Yokkaichi on Ise Bay was already an industrial port, and the Kii mountains in the south are forest and very little else.'
  },
  Shiga: {
    en: 'Shiga-ken', ja: '滋賀県 (Shiga)', zh: '滋賀縣', ko: '시가현',
    wiki: 'https://en.wikipedia.org/wiki/Shiga_Prefecture',
    short: 'Lake Biwa, the largest lake in Japan',
    note: 'Lake Biwa, the largest lake in Japan, with the prefecture wrapped round it and Ōtsu at its southern outlet. The Ōmi merchants of this province were one of the three great merchant networks of the Tokugawa period and their houses turn up running businesses all over the country. Hikone keeps its castle, one of the twelve original keeps left standing, and the Lake Biwa Canal cut through to Kyoto in 1890 gave that city its first hydro-electric power and its trams.'
  },
  Kyoto: {
    en: 'Kyōto-fu', ja: '京都府 (Kyōto)', zh: '京都府', ko: '교토부',
    wiki: 'https://en.wikipedia.org/wiki/Kyoto_Prefecture',
    short: 'Kyoto-fu, made of the old capital and the country running north to the Japan Sea',
    note: 'Kyoto-fu, made of the old capital and the country running north to the Japan Sea. The city had been the emperor\'s seat for a thousand years until 1869 and remained the centre of the crafts that went with a court — Nishijin silk weaving, Kiyomizu ware, dyeing on the Kamo river — as well as of Buddhist scholarship and of two imperial universities\' worth of students. Maizuru, on the northern coast, was a naval district and base facing Korea and the Soviet Maritime Province. The city itself was on the atomic target list and was taken off it, and was never seriously bombed.'
  },
  Osaka: {
    en: 'Ōsaka-fu', ja: '大阪府 (Ōsaka)', zh: '大阪府', ko: '오사카부',
    wiki: 'https://en.wikipedia.org/wiki/Osaka_Prefecture',
    short: 'The merchant city — "the kitchen of the realm" under the Tokugawa',
    note: 'The merchant city — "the kitchen of the realm" under the Tokugawa, where the rice of the whole country was sold and where the first futures exchange in the world had operated since the 1730s. By 1930 it was the industrial capital as well: cotton spinning above all, the trading houses that ran the raw-cotton and yarn trade with India and China, and the Osaka Arsenal, the largest army arsenal in the empire. It was firebombed from 13 March 1945 onwards and lost the greater part of its built area.'
  },
  Hyogo: {
    en: 'Hyōgo-ken', ja: '兵庫県 (Hyōgo)', zh: '兵庫縣', ko: '효고현',
    wiki: 'https://en.wikipedia.org/wiki/Hy%C5%8Dgo_Prefecture',
    short: 'Reaches from the Inland Sea to the Japan Sea',
    note: 'The prefecture reaches from the Inland Sea to the Japan Sea and holds both the most modern and the most old-fashioned things in the region. Kobe was the port that handled the emigrant traffic and much of the western trade, with the Kawasaki and Mitsubishi yards along its waterfront; Nada, next door, brewed a large share of Japan\'s sake with water from the Rokkō hills. Himeji keeps the finest castle in Japan, which survived the firebombing of the town around it in July 1945; Kobe had been burnt out in March.'
  },
  Nara: {
    en: 'Nara-ken', ja: '奈良県 (Nara)', zh: '奈良縣', ko: '나라현',
    wiki: 'https://en.wikipedia.org/wiki/Nara_Prefecture',
    short: 'The capital in the eighth century, and what is left of it is the reason people come',
    note: 'The capital in the eighth century, and what is left of it is the reason people come: Tōdaiji with the Great Buddha, Kōfukuji, and Hōryūji, whose main hall is the oldest wooden building standing anywhere. Under the Tokugawa this was mostly temple land and small farming, and it stayed a prefecture with no city of any size and no industry to speak of. Its money came from the Yoshino forests, which grow cedar in dense stands for building timber, and from brushes, ink and sake.'
  },
  Wakayama: {
    en: 'Wakayama-ken', ja: '和歌山県 (Wakayama)', zh: '和歌山縣', ko: '와카야마현',
    wiki: 'https://en.wikipedia.org/wiki/Wakayama_Prefecture',
    short: 'Kii: the Kii peninsula\'s steep forested spine',
    note: 'Kii: the Kii peninsula\'s steep forested spine, the Kumano shrines that pilgrims have walked to since the eleventh century, and Kōyasan, the mountain monastery Kūkai founded in 816. Taiji on its coast is the town where organised whaling in Japan began in the seventeenth century. It is also one of the prefectures that sent most people abroad — to Hawaii, California and Australia — because the land would not carry them, and mandarin oranges and forestry were what was left.'
  },
  Tottori: {
    en: 'Tottori-ken', ja: '鳥取県 (Tottori)', zh: '鳥取縣', ko: '돗토리현',
    wiki: 'https://en.wikipedia.org/wiki/Tottori_Prefecture',
    short: 'The least populous prefecture in Japan, on the Japan Sea behind the Chūgoku mountains',
    note: 'The least populous prefecture in Japan, on the Japan Sea behind the Chūgoku mountains, with the sand dunes east of Tottori city that are the largest in the country. Sakaiminato at the western end is a major fishing port, and the Daisen volcano and the pear orchards below it are the rest of the prefecture\'s stock in trade. The earthquake of 10 September 1943 flattened much of Tottori city and killed over a thousand people, two years before the bombing would have.'
  },
  Shimane: {
    en: 'Shimane-ken', ja: '島根県 (Shimane)', zh: '島根縣', ko: '시마네현',
    wiki: 'https://en.wikipedia.org/wiki/Shimane_Prefecture',
    short: 'The old Izumo, which is where the myths that were not about the sun goddess came from',
    note: 'The old Izumo, which is where the myths that were not about the sun goddess came from: Izumo Taisha, the shrine of Ōkuninushi, is the second most important in the country and the oldest in form. Iwami Ginzan, in the west, was one of the great silver mines of the world in the sixteenth century and supplied a third of the silver in circulation globally at its peak; by this period it was finished. The prefecture also administers the Oki islands, exile country for two emperors, and — since Japan incorporated them in 1905 — the Liancourt Rocks that Korea calls Dokdo.'
  },
  Okayama: {
    en: 'Okayama-ken', ja: '岡山県 (Okayama)', zh: '岡山縣', ko: '오카야마현',
    wiki: 'https://en.wikipedia.org/wiki/Okayama_Prefecture',
    short: 'Inland Sea country: mild, dry and fertile',
    note: 'Inland Sea country: mild, dry and fertile, with the castle town of Okayama and its Kōrakuen, one of the three gardens Japanese guidebooks list together. Kurashiki was a shogunal storehouse town that turned into a cotton-spinning centre — Kurabō — under the Ōhara family, who spent the proceeds on a labour research institute and on the first museum of Western art in Japan. Mizushima on the coast was developed as an aircraft plant during the war and bombed for it; the prefecture is otherwise known for peaches and muscat grapes.'
  },
  Hiroshima: {
    en: 'Hiroshima-ken', ja: '広島県 (Hiroshima)', zh: '廣島縣', ko: '히로시마현',
    wiki: 'https://en.wikipedia.org/wiki/Hiroshima_Prefecture',
    short: 'The army\'s western capital: the 5th Division was raised here',
    note: 'The army\'s western capital: the 5th Division was raised here, imperial headquarters moved to the city during the war with China in 1894, and the port of Ujina at its mouth was where the divisions embarked for the continent from that war onwards. Kure, twenty kilometres away, was the largest naval arsenal in Asia and built the battleship Yamato. At 8.15 in the morning of 6 August 1945 an atomic bomb was dropped over the centre of the city; something like 70,000 people died at once and about as many again by the end of the year.'
  },
  Yamaguchi: {
    en: 'Yamaguchi-ken', ja: '山口県 (Yamaguchi)', zh: '山口縣', ko: '야마구치현',
    wiki: 'https://en.wikipedia.org/wiki/Yamaguchi_Prefecture',
    short: 'Chōshū, the domain that with Satsuma overthrew the shogunate',
    note: 'Chōshū, the domain that with Satsuma overthrew the shogunate, and which then supplied the Meiji state with prime ministers and the army with its leadership — Yamagata Aritomo, Itō Hirobumi, Terauchi, Tanaka Giichi. The Shimonoseki strait at its tip is the gate between the Inland Sea and the Japan Sea and the crossing to Kyūshū, and the town gave its name to the treaty of 1895 that took Taiwan from China. Ube and Onoda in the west lived on coal — mined out under the sea — and on cement.'
  },
  Tokushima: {
    en: 'Tokushima-ken', ja: '徳島県 (Tokushima)', zh: '德島縣', ko: '도쿠시마현',
    wiki: 'https://en.wikipedia.org/wiki/Tokushima_Prefecture',
    short: 'Awa, the eastern corner of Shikoku, whose crop was indigo',
    note: 'Awa, the eastern corner of Shikoku, whose crop was indigo: the Yoshino river plain grew the country\'s dye and Tokushima\'s merchants sold it, until synthetic indigo arrived in the 1890s and took the trade away within a generation. What was left was sweet potatoes, lumber off the mountains and emigration. The Awa-odori dance in August and the whirlpools in the Naruto strait are the things the prefecture is known for now.'
  },
  Kagawa: {
    en: 'Kagawa-ken', ja: '香川県 (Kagawa)', zh: '香川縣',
    short: 'The smallest prefecture in Japan, on the sheltered Inland Sea side of Shikoku',
    note: 'The smallest prefecture in Japan, on the sheltered Inland Sea side of Shikoku, and one of the driest places in the country — the ponds that dot it are irrigation reservoirs, some of them fourteen centuries old. Sakaide and the flats along the coast were the country\'s principal salt fields, evaporating sea water in graded pans. Kotohira\'s shrine, sacred to sailors, drew pilgrims from every port in Japan, and Takamatsu was the ferry head for the Honshū crossing.'
  },
  Ehime: {
    en: 'Ehime-ken', ja: '愛媛県 (Ehime)', zh: '愛媛縣', ko: '에히메현',
    wiki: 'https://en.wikipedia.org/wiki/Ehime_Prefecture',
    short: 'Matsuyama and its castle, with the Dōgo hot spring beside it',
    note: 'Matsuyama and its castle, with the Dōgo hot spring beside it — reputedly the oldest in Japan and the setting of Natsume Sōseki\'s Botchan. The mountain behind Niihama holds the Besshi copper mine, worked continuously from 1691 and the foundation of the whole Sumitomo enterprise, with a smelter on the coast whose fumes were the cause of one of Japan\'s earliest pollution settlements. The lowlands grow mandarins, which is still what the prefecture is best known for.'
  },
  Kochi: {
    en: 'Kōchi-ken', ja: '高知県 (Kōchi)', zh: '高知縣', ko: '고치현',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dchi_Prefecture',
    short: 'Tosa, shut off from the rest of Shikoku by the mountains and facing the open Pacific',
    note: 'Tosa, shut off from the rest of Shikoku by the mountains and facing the open Pacific, which made it both poor and unusually political: Sakamoto Ryōma, who brokered the alliance that ended the shogunate, and Itagaki Taisuke, who founded the first party and the freedom and popular rights movement, were both Tosa men. Its living came from the sea — skipjack tuna, caught with a pole and a barbless hook and dried into katsuobushi, the hard smoked block that the whole country\'s cooking is built on. Behind the coast it is forest, and it rains more here than almost anywhere else in Japan.'
  },
  Fukuoka: {
    en: 'Fukuoka-ken', ja: '福岡県 (Fukuoka)', zh: '福岡縣', ko: '후쿠오카현',
    wiki: 'https://en.wikipedia.org/wiki/Fukuoka_Prefecture',
    short: 'The industrial heart of Kyūshū and the point where Japan touches the continent',
    note: 'The industrial heart of Kyūshū and the point where Japan touches the continent. The Chikuhō basin was the largest coalfield in the empire, and in 1901 the state put the Yawata Iron and Steel Works beside it at the mouth of the Dōkai bay, which made the rails, plate and armour the country had been importing. Hakata and Moji were the ports for Korea and China, and Fukuoka was where the ferry and later the aeroplane left from; the industrial belt was bombed hard in 1945, and Kokura was the first target on 9 August, saved by cloud.'
  },
  Saga: {
    en: 'Saga-ken', ja: '佐賀県 (Saga)', zh: '佐賀縣', short: 'The Nabeshima domain',
    note: 'The Nabeshima domain, which had been given charge of the Nagasaki defences and used the position to buy Western guns and build the first reverberatory furnace in Japan, so that in 1868 it had the best-armed force of any han. Its lasting export is porcelain: Arita has made it since Korean potters were brought back in the 1590s and found kaolin nearby, and it went to Europe through the port of Imari, whose name stuck to it. The Saga plain, reclaimed from the Ariake sea, is some of the best rice land in Kyūshū.'
  },
  Nagasaki: {
    en: 'Nagasaki-ken', ja: '長崎県 (Nagasaki)', zh: '長崎縣', ko: '나가사키현',
    wiki: 'https://en.wikipedia.org/wiki/Nagasaki_Prefecture',
    short: 'For two centuries the only place in Japan where Europeans could trade at all',
    note: 'For two centuries the only place in Japan where Europeans could trade at all — the Dutch factory on the artificial island of Dejima — and so the channel through which Western medicine, astronomy and gunnery reached the country. Mitsubishi\'s shipyard, taken over from the government in 1884, was the largest private yard in Japan and built the battleship Musashi in a covered slip so that nobody could see it. Sasebo, in the north-west, was a naval district and base; the prefecture also includes the Gotō islands, the hidden-Christian country, and Tsushima. An atomic bomb was dropped on the Urakami valley on 9 August 1945, killing some forty thousand people outright.'
  },
  Kumamoto: {
    en: 'Kumamoto-ken', ja: '熊本県 (Kumamoto)', zh: '熊本縣', ko: '구마모토현',
    wiki: 'https://en.wikipedia.org/wiki/Kumamoto_Prefecture',
    short: 'Katō Kiyomasa\'s castle here is the most heavily fortified in Japan',
    note: 'Katō Kiyomasa\'s castle here is the most heavily fortified in Japan, and it was put to the test in 1877 when Saigō Takamori\'s Satsuma army besieged the garrison for fifty days and failed to take it — the Satsuma Rebellion turned on that siege. The 6th Division was raised in the city afterwards. Inland is Aso, a caldera twenty-five kilometres across with villages and railways inside it; on the coast at Minamata the Chisso corporation had been making carbide and fertiliser since 1908, and would poison the bay with methylmercury after this map\'s dates.'
  },
  Oita: {
    en: 'Ōita-ken', ja: '大分県 (Ōita)', zh: '大分縣', ko: '오이타현',
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cita_Prefecture',
    short: 'Beppu, and more hot spring water than anywhere else in Japan',
    note: 'Beppu, on the bay, produces more hot spring water than anywhere else in Japan and by the 1930s was a full-scale resort town with hospitals, hotels and a municipal bathing industry. Usa Jingū above it is the head shrine of the Hachiman cult, the god of war, with some forty thousand branch shrines under it — and the navy put one of its main air training bases on the plain beside it, from which kamikaze units flew in 1945. The rest is farming and forestry in narrow valleys, and the prefecture has been one of the emptier parts of Kyūshū since.'
  },
  Miyazaki: {
    en: 'Miyazaki-ken', ja: '宮崎県 (Miyazaki)', zh: '宮崎縣', ko: '미야자키현',
    wiki: 'https://en.wikipedia.org/wiki/Miyazaki_Prefecture',
    short: 'Hyūga, the coast facing the Pacific, poor',
    note: 'Hyūga, the coast facing the Pacific, poor, remote and famous chiefly for what the Kojiki says happened here: Ninigi came down at Takachiho and Jimmu set out from this coast to found the state. That made the prefecture useful in 1940, the official 2,600th anniversary of the founding, when the government built the Hakkō Ichiu tower at Miyazaki out of stones sent from all over the empire — the slogan on it, "the eight corners of the world under one roof", was the justification of the New Order. Its living came from sweet potatoes, cattle and cedar.'
  },
  Kagoshima: {
    en: 'Kagoshima-ken', ja: '鹿児島県 (Kagoshima)', zh: '鹿兒島縣', ko: '가고시마현',
    wiki: 'https://en.wikipedia.org/wiki/Kagoshima_Prefecture',
    short: 'Satsuma: the domain that fought the British at Kagoshima in 1863',
    note: 'Satsuma: the domain that fought the British at Kagoshima in 1863, then bought their ships, and with Chōshū made the Restoration and afterwards gave the navy most of its admirals, Tōgō Heihachirō among them. Sakurajima in the bay erupted in 1914, killed some sixty people and poured out enough lava to join the island to the mainland, which it has been part of ever since. The prefecture is volcanic ash and sweet potatoes rather than rice, it administers the Ōsumi, Tokara and Amami islands, and in 1945 the airfield at Chiran was the main base from which army kamikaze units flew to Okinawa.'
  },
  Okinawa: {
    en: 'Okinawa-ken', ja: '沖縄県 (Okinawa)', zh: '沖繩縣', ko: '오키나와현',
    wiki: 'https://en.wikipedia.org/wiki/Okinawa_Prefecture',
    short: 'The Ryūkyū Kingdom, until Japan abolished it in 1879',
    note: 'The Ryūkyū Kingdom paid tribute to both China and Satsuma until Japan abolished it in 1879 and made the islands a prefecture, and it stayed the poorest one: sugar cane on land that would not grow enough rice, awamori distilled from imported Thai rice, and emigration to Hawaii, Peru and the Philippines on a scale no other prefecture matched. Okinawan speech, names and religion were treated as things to be corrected, and Okinawans in the mainland labour market were treated accordingly. The American landing of 1 April 1945 opened an eighty-two-day battle that destroyed Shuri and killed something like a quarter of the civilian population; the islands were then under American administration until 1972.'
  },
  Ulleungdo: {
    en: 'Ullŭngdo (Utsuryō-tō) — part of Chōsen', ja: '鬱陵島 (Utsuryō-tō)', zh: '鬱陵島',
    ko: '울릉도 (Ullŭngdo)', wiki: 'https://en.wikipedia.org/wiki/Ulleungdo',
    note: 'The largest island off the east coast of Korea, and the base from which Korean and Japanese fishermen worked the Liancourt Rocks 87 km to the south-east.'
  },
  Jukdo: { en: 'Chukto (Chikuyo) — off Ullŭngdo', ja: '竹嶼 (Chikuyo)', ko: '죽도 (Chukto)' },
  Gwaneumdo: { en: 'Kwanŭmdo (Kannondō) — off Ullŭngdo', ja: '觀音島 (Kannondō)', ko: '관음도 (Kwanŭmdo)' },
  'Seodo, the west islet of the Liancourt Rocks': {
    en: 'Sŏdo (Nishijima) — the west islet of the Liancourt Rocks', ja: '西島 (Nishijima)',
    zh: '獨島', ko: '서도 (Sŏdo)', wiki: 'https://en.wikipedia.org/wiki/Liancourt_Rocks',
    note: 'Dokdo to Korea, Takeshima to Japan, and also known the Liancourt Rocks on some maps. Japan incorporated them into Shimane prefecture in 1905, five years before it annexed Korea, so on both of this map’s dates they were inside the same empire as Ullŭngdo and nothing turned on the difference. South Korea has held them with a police detachment since 1954; Japan claims them still.'
  },
  'Dongdo, the east islet of the Liancourt Rocks': {
    en: 'Tongdo (Higashijima) — the east islet of the Liancourt Rocks', ja: '東島 (Higashijima)',
    ko: '동도 (Tongdo)',
    note: 'Dokdo to Korea, Takeshima to Japan, and also known the Liancourt Rocks on some maps. Japan incorporated them into Shimane prefecture in 1905, five years before it annexed Korea, so on both of this map’s dates they were inside the same empire as Ullŭngdo and nothing turned on the difference. South Korea has held them with a police detachment since 1954; Japan claims them still.'
  },
  Keiki: {
    en: 'Keiki-dō (Kyŏnggi-do)', ja: '京畿道 (Keiki-dō)', zh: '京畿道', ko: '경기도 (Kyŏnggi-do)',
    wiki: 'https://en.wikipedia.org/wiki/Keiki_Province', local: 'Kyŏnggi-do (Keiki-dō)',
    short: 'The Han river plain around Keijō — Seoul, renamed and rebuilt as the colonial capital',
    note: 'The Han river plain around Keijō — Seoul, renamed and rebuilt as the colonial capital, with the Government-General\'s new granite headquarters put up directly in front of the old royal palace in 1926 to make the point. Jinsen (Inch\'ŏn) is its port, the one the Japanese landed at in 1894 and 1904, and the province is the hub of every railway in the peninsula: the main line south to Pusan and north to Sinŭiju and Mukden crosses here. Otherwise it is good rice and vegetable country feeding the city, with the ginseng of Kaesŏng — a state monopoly under the Government-General — as its one specialised crop.'
  },
  Kogen: {
    en: 'Kōgen-dō (Kangwŏn-do)', ja: '江原道 (Kōgen-dō)', zh: '江原道', ko: '강원도 (Kangwŏn-do)',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dgen_Province', local: 'Kangwŏn-do (Kōgen-dō)',
    short: 'The Taebaek range down its spine, and very little flat ground',
    note: 'The Taebaek range runs down the spine of this province and leaves very little flat ground: it is the most mountainous part of southern Korea, forested, thinly settled and poor, with the Diamond Mountains at its northern end drawing Japanese tourists on a purpose-built railway. Its wealth was underground and offshore — the Sangdong tungsten deposit, one of the largest in the world, and a coast where the winter pollack and the summer sardine runs supported a fishing industry that Japanese boats came to dominate. Timber floated down its rivers, and slash-and-burn cultivators worked the slopes that nothing else could use.'
  },
  Chuseihoku: {
    en: 'Chūseihoku-dō (Ch’ungch’ŏngbuk-to)', ja: '忠清北道 (Chūseihoku-dō)', zh: '忠清北道',
    ko: '충청북도 (Ch’ungch’ŏngbuk-to)',
    wiki: 'https://en.wikipedia.org/wiki/Ch%C5%ABseihoku_Province',
    local: 'Ch’ungch’ŏngbuk-to (Chūseihoku-dō)',
    short: 'The only province in Korea with no coastline',
    note: 'The only province in Korea with no coastline: a set of basins in the middle of the peninsula, ringed by hills, with Seishū (Ch\'ŏngju) as its seat. Rice grows in the basin floors and the slopes above them carried the country\'s tobacco, another Government-General monopoly, along with mulberry for silk. Being inland and off the main line it stayed one of the least developed provinces, and its surplus population went to the mills of Japan and the farms of Manchuria.'
  },
  Chuseinan: {
    en: 'Chūseinan-dō (Ch’ungch’ŏngnam-do)', ja: '忠清南道 (Chūseinan-dō)', zh: '忠清南道',
    ko: '충청남도 (Ch’ungch’ŏngnam-do)',
    wiki: 'https://en.wikipedia.org/wiki/Ch%C5%ABseinan_Province',
    local: 'Ch’ungch’ŏngnam-do (Chūseinan-dō)',
    short: 'The lower Kŭm river and the tidal flats of the west coast',
    note: 'The lower Kŭm river and the tidal flats of the west coast, with Kōshū (Kongju) the old seat and Taiden (Taejŏn) — a village until the railway arrived — growing into the real centre because two main lines crossed there. This is broad, flat, well-watered rice country, and Kanggyŏng on the river was one of the largest grain markets in Korea. It was also where Japanese landlord companies bought most heavily, so that a high proportion of the rice grown here left for Japan while the people who grew it moved to millet.'
  },
  Zenrahoku: {
    en: 'Zenrahoku-dō (Chŏllabuk-to)', ja: '全羅北道 (Zenrahoku-dō)', zh: '全羅北道',
    ko: '전라북도 (Chŏllabuk-to)', wiki: 'https://en.wikipedia.org/wiki/Zenrahoku_Province',
    local: 'Chŏllabuk-to (Zenrahoku-dō)',
    short: 'The Honam plain, the largest stretch of paddy in Korea',
    note: 'The Honam plain, the largest continuous stretch of paddy in Korea and the reason this province mattered to Japan: rice from here fed the industrial cities of the home islands, and Gunzan (Kunsan) was built up as the port to ship it, with a Japanese quarter, a customs house and warehouses along the estuary. The irrigation works and land surveys of the 1910s and 1920s concentrated ownership in Japanese hands faster here than anywhere else in the country. Behind the plain the Noryŏng hills carry paper mulberry and bamboo, and Chŏnju was the old provincial capital and the home town of the Yi dynasty.'
  },
  Zenranan: {
    en: 'Zenranan-dō (Chŏllanam-do)', ja: '全羅南道 (Zenranan-dō)', zh: '全羅南道',
    ko: '전라남도 (Chŏllanam-do)', wiki: 'https://en.wikipedia.org/wiki/Zenranan_Province',
    local: 'Chŏllanam-do (Zenranan-dō)',
    short: 'The south-western corner and its archipelago — several thousand islands',
    note: 'The south-western corner and its archipelago — several thousand islands, the richest inshore fishing grounds in Korea, and the volcanic island of Saishū (Cheju) administered from here as a county. Mokp\'o was opened as a treaty port in 1897 and grew on two exports, rice and raw cotton, the cotton grown under an official campaign to supply Japanese spinning mills. It is warm, wet and fertile, and it was also the most persistently rebellious province in the peninsula, from the Tonghak rising of 1894 to the Kwangju student movement of 1929, which began with an incident on a commuter train and spread into a nationwide strike of schools.'
  },
  Keishohoku: {
    en: 'Keishōhoku-dō (Kyŏngsangbuk-to)', ja: '慶尚北道 (Keishōhoku-dō)', zh: '慶尚北道',
    ko: '경상북도 (Kyŏngsangbuk-to)',
    wiki: 'https://en.wikipedia.org/wiki/Keish%C5%8Dhoku_Province',
    local: 'Kyŏngsangbuk-to (Keishōhoku-dō)',
    short: 'The Naktong river\'s upper basin, hills and small plains',
    note: 'The Naktong river\'s upper basin, hills and small plains, with Taikyū (Taegu) at its centre — the third city of Korea, a market town that became the country\'s apple district after Japanese varieties were introduced, and a textile centre. Kyŏngju in the south-east was the capital of Silla for a thousand years, and the colonial government excavated and restored its tombs and the Sŏkkuram grotto, partly as scholarship and partly as an argument about a shared ancient past. Hemp, tobacco and cattle came off the uplands, and the north of the province is forest.'
  },
  Keishonan: {
    en: 'Keishōnan-dō (Kyŏngsangnam-do)', ja: '慶尚南道 (Keishōnan-dō)', zh: '慶尚南道',
    ko: '경상남도 (Kyŏngsangnam-do)', wiki: 'https://en.wikipedia.org/wiki/Keish%C5%8Dnan_Province',
    local: 'Kyŏngsangnam-do (Keishōnan-dō)',
    short: 'The end of the peninsula facing Japan, and the province the colony was entered through',
    note: 'The end of the peninsula facing Japan, and the province the colony was entered through: Fusan (Pusan) took the ferry from Shimonoseki, had the largest Japanese settler population in Korea, and was the southern terminus of the railway that ran to Manchuria and, in principle, to Europe. The fisheries off this coast were the most valuable in Korea and were worked increasingly by Japanese boats and canneries; the Naktong delta behind the city is heavy rice ground. Chinkai (Chinhae), on the sheltered bay, was built as a naval base for the Japanese fleet after 1905.'
  },
  Kokai: {
    en: 'Kōkai-dō (Hwanghae-do)', ja: '黄海道 (Kōkai-dō)', zh: '黃海道', ko: '황해도 (Hwanghae-do)',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dkai_Province', local: 'Hwanghae-do (Kōkai-dō)',
    short: 'The province between the capital and P\'yŏngyang, rolling hills opening on the Yellow Sea',
    note: 'The province between the capital and P\'yŏngyang, rolling hills opening on the Yellow Sea, drier than the south and given as much to wheat, millet and barley as to rice. Its ore is what the colonial economy wanted: the gold of Suan and Sŏngch\'ŏn, worked hard through the 1930s when Japan needed foreign exchange, and the iron that fed the Kyŏmip\'o works on the Taedong estuary, built by Mitsubishi in 1918 and the first modern steel plant in Korea. Haeju was the seat, and the long indented coast made salt in evaporation pans on the tidal flats.'
  },
  Heianhoku: {
    en: 'Heianhoku-dō (P’yŏnganbuk-to)', ja: '平安北道 (Heianhoku-dō)', zh: '平安北道',
    ko: '평안북도 (P’yŏnganbuk-to)', wiki: 'https://en.wikipedia.org/wiki/Heianhoku_Province',
    local: 'P’yŏnganbuk-to (Heianhoku-dō)',
    short: 'The north-western march, with the Yalu as its border: the river carried the timber trade',
    note: 'The north-western march, with the Yalu as its border: the river carried the timber trade, logs cut in the interior and floated down to Sinŭiju to be sawn, and Sinŭiju itself faced Antung across the bridge and became a chemical and paper town. From 1937 the Sup\'ung dam was built across the Yalu, and when it was finished in 1941 it was among the largest hydro-electric stations in the world, supplying Manchuria and northern Korea together. Inland the province is high, cold and forested, with gold at Unsan — the concession an American company held from 1896, and the largest gold mine in the Far East.'
  },
  Heiannan: {
    en: 'Heiannan-dō (P’yŏngannam-do)', ja: '平安南道 (Heiannan-dō)', zh: '平安南道',
    ko: '평안남도 (P’yŏngannam-do)', local: 'P’yŏngannam-do (Heiannan-dō)',
    short: 'P\'yŏngyang, the oldest city in Korea and the one with the largest Christian community',
    note: 'P\'yŏngyang, the oldest city in Korea and the one with the largest Christian community, sat here on the Taedong; it had been a mission and printing centre since the 1890s and became an industrial one under the colonial state. The province holds Korea\'s principal anthracite, in the Anju and P\'yŏngyang fields, and the smelter and port of Chinnamp\'o at the river mouth handled the ore of the north-west. The hills grow apples, chestnuts and millet on ground too dry for much rice, and the province was one of the chief sources of the labour conscripted to Japan after 1939.'
  },
  Kankyohoku: {
    en: 'Kankyōhoku-dō (Hamgyŏngbuk-to)', ja: '咸鏡北道 (Kankyōhoku-dō)', zh: '咸鏡北道',
    ko: '함경북도 (Hamgyŏngbuk-to)', wiki: 'https://en.wikipedia.org/wiki/Kanky%C5%8Dhoku_Province',
    local: 'Hamgyŏngbuk-to (Kankyōhoku-dō)',
    short: 'The far north-east, against the Tumen and the Soviet and Manchurian borders: mountains',
    note: 'The far north-east, against the Tumen and the Soviet and Manchurian borders: mountains, larch and pine forest, and the coldest winters in the country. The 1930s turned it into a frontier of a new kind — Rashin (Najin), Yūki (Unggi) and Seishin (Ch\'ŏngjin) were developed as the ports through which Manchurian soya, coal and iron would reach Japan by the short sea route, and Rashin was laid out from nothing after 1932 as the terminus of that plan. The Musan deposit inland is one of the largest iron ore bodies in East Asia, and the province\'s own people lived on dry-field grain, fishing and the timber that came down the Tumen.'
  },
  Kankyonan: {
    en: 'Kankyōnan-dō (Hamgyŏngnam-do)', ja: '咸鏡南道 (Kankyōnan-dō)', zh: '咸鏡南道',
    ko: '함경남도 (Hamgyŏngnam-do)', wiki: 'https://en.wikipedia.org/wiki/Kanky%C5%8Dnan_Province',
    local: 'Hamgyŏngnam-do (Kankyōnan-dō)',
    short: 'A narrow coastal shelf under high mountains',
    note: 'A narrow coastal shelf under high mountains, and the site of the largest industrial complex in the empire outside Japan itself: at Kōnan (Hŭngnam), Noguchi Shitagau\'s Chōsen Chisso built a nitrogen fertiliser works from 1927 that grew into carbide, explosives and synthetic oil, running on power diverted from the Pujŏn and Changjin rivers through the watershed to fall down the seaward side. Kankō (Hamhŭng) beside it was the administrative town, and the workforce was Korean and largely unskilled, housed in company barracks. Behind the plants the province is forest and terraced dry field, with the Kaema plateau — the highest and emptiest ground in Korea — filling its interior.'
  },
  Saishu: {
    en: 'Saishū-tō (Cheju-do)', ja: '済州島 (Saishū-tō)', zh: '濟州島', ko: '제주도 (Cheju-do)',
    wiki: 'https://en.wikipedia.org/wiki/Jeju_Island', local: 'Cheju-do (Saishū-tō)',
    short: 'A volcanic island a hundred kilometres off the south coast',
    note: 'A volcanic island a hundred kilometres off the south coast, administered as a county of South Chŏlla and unlike anywhere on the mainland: Halla-san, a shield volcano of 1,950 m, stands in the middle of it with some three hundred and sixty cinder cones around its flanks, and the ground is porous basalt that will not hold surface water, so the island grew barley, millet and tangerines rather than rice. The Mongols pastured horses here from the thirteenth century and Cheju horses remained a byword afterwards; the Chosŏn state used the island as a place of exile; and the haenyŏ, the women who dive without air for abalone and seaweed, were the island\'s cash economy and are still what it is known for. In the war it mattered for its position — bombers of the Kanoya and Kisarazu groups flew from Cheju to raid Nanjing in August 1937, in what were then the longest over-water bombing missions ever flown — and from 1945 the Japanese army turned the whole island into a fortress against the invasion that never came, tunnelling the coastal cones and building airfields at Moseulp\'o.'
  },
  'Shumshu (Shimushu)': {
    en: 'Shumshu (Shimushu)', ja: '占守島 (Shumushu-tō)', zh: '占守島', ko: '슘슈섬',
    wiki: 'https://en.wikipedia.org/wiki/Shumshu',
    short: 'The northernmost island, heavily garrisoned and facing Kamchatka',
    note: 'The northernmost island, heavily garrisoned and facing Kamchatka. Soviet troops landed here on 18 August 1945, three days after the surrender, in the last battle of the war.'
  },
  'Alaid (Araito)': {
    en: 'Alaid (Araito)', ja: '阿頼度島 (Araito-tō)', zh: '阿賴度島', ko: '아틀라소프섬',
    wiki: 'https://en.wikipedia.org/wiki/Atlasov_Island', short: 'A volcanic cone off Shumshu',
    note: 'A volcanic cone off Shumshu, uninhabited but for a fishery station.'
  },
  'Paramushir (Paramushiro)': {
    en: 'Paramushir (Paramushiro)', ja: '幌筵島 (Paramushiro-tō)', zh: '幌筵島', ko: '파라무시르섬',
    wiki: 'https://en.wikipedia.org/wiki/Paramushir',
    short: 'The naval and air base from which the Aleutian operation was mounted',
    note: 'The naval and air base from which the Aleutian operation was mounted, and the target of American bombers flying from Attu after 1943.'
  },
  'Makanrushi (Makanru)': {
    en: 'Makanrushi (Makanru)', ja: '磨勘留島 (Makanru-tō)', zh: '磨勘留島', ko: '마칸루시섬',
    wiki: 'https://en.wikipedia.org/wiki/Makanrushi',
    short: 'Uninhabited, and used only by fishing crews in season',
    note: 'Uninhabited, and used only by fishing crews in season.'
  },
  Onekotan: {
    en: 'Onekotan', ja: '温禰古丹島 (Onnekotan-tō)', zh: '溫禰古丹島', ko: '오네코탄섬',
    wiki: 'https://en.wikipedia.org/wiki/Onekotan',
    short: 'Uninhabited but for its wartime garrison, and two great calderas',
    note: 'Uninhabited but for its wartime garrison, and two great calderas, one holding a lake with an island in it.'
  },
  'Kharimkotan (Harimukotan)': {
    en: 'Kharimkotan (Harimukotan)', ja: '春牟古丹島 (Harimukotan-tō)', zh: '春牟古丹島', ko: '하림코탄섬',
    wiki: 'https://en.wikipedia.org/wiki/Harimkotan',
    short: 'Uninhabited; its 1933 eruption swept the shore',
    note: 'Uninhabited; its 1933 eruption swept the shore.'
  },
  Ekarma: {
    en: 'Ekarma', ja: '越渇磨島 (Ekaruma-tō)', zh: '越渴磨島', ko: '예카르마섬',
    wiki: 'https://en.wikipedia.org/wiki/Ekarma', short: 'Uninhabited', note: 'Uninhabited.'
  },
  'Shiashkotan (Shasukotan)': {
    en: 'Shiashkotan (Shasukotan)', ja: '捨子古丹島 (Shasukotan-tō)', zh: '捨子古丹島', ko: '시아시코탄섬',
    wiki: 'https://en.wikipedia.org/wiki/Shiashkotan',
    short: 'A small settlement and a fox farm',
    note: 'A small settlement and a fox farm, abandoned when the islands changed hands.'
  },
  'Matua (Matsuwa)': {
    en: 'Matua (Matsuwa)', ja: '松輪島 (Matsuwa-tō)', zh: '松輪島', ko: '마투아섬',
    wiki: 'https://en.wikipedia.org/wiki/Matua_(island)',
    short: 'An airfield in the middle of the chain',
    note: 'An airfield in the middle of the chain, bombed from the Aleutians and bypassed.'
  },
  'Rasshua (Rasuwa)': {
    en: 'Rasshua (Rasuwa)', ja: '羅処和島 (Rasuwa-tō)', zh: '羅處和島', short: 'Uninhabited',
    note: 'Uninhabited.'
  },
  'Ketoy (Ketoi)': {
    en: 'Ketoy (Ketoi)', ja: '計吐夷島 (Ketoi-tō)', zh: '計吐夷島', ko: '케토이섬',
    wiki: 'https://en.wikipedia.org/wiki/Ketoy', short: 'Uninhabited', note: 'Uninhabited.'
  },
  'Simushir (Shimushiru)': {
    en: 'Simushir (Shimushiru)', ja: '新知島 (Shimushiru-tō)', zh: '新知島', ko: '시무시르섬',
    wiki: 'https://en.wikipedia.org/wiki/Simushir',
    short: 'A garrison, and a flooded crater making one of the few anchorages',
    note: 'A garrison, and a flooded crater at Broughton Bay that makes one of the few sheltered anchorages in the chain.'
  },
  'Chirpoy (Chirihoi)': {
    en: 'Chirpoy (Chirihoi)', ja: '知理保以島 (Chirihoi-tō)', zh: '知理保以島', ko: '초르니예브라티야섬',
    wiki: 'https://en.wikipedia.org/wiki/Chyornye_Bratya', short: 'Uninhabited',
    note: 'Uninhabited.'
  },
  'Urup (Uruppu)': {
    en: 'Urup (Uruppu)', ja: '得撫島 (Uruppu-tō)', zh: '得撫島', ko: '우루프섬',
    wiki: 'https://en.wikipedia.org/wiki/Urup', short: 'Sea otter hunting ground',
    note: 'Sea otter hunting ground, and Russian until the exchange of 1875.'
  },
  'Etorofu (Iturup)': {
    en: 'Etorofu (Iturup) — the Pearl Harbor fleet sailed from Hitokappu Bay',
    ja: '択捉島 (Etorofu-tō)', zh: '擇捉島', ko: '이투루프섬', wiki: 'https://en.wikipedia.org/wiki/Iturup'
  },
  'Kunashiri (Kunashir)': {
    en: 'Kunashiri (Kunashir)', ja: '国後島 (Kunashiri-tō)', zh: '國後島', ko: '쿠나시르섬',
    wiki: 'https://en.wikipedia.org/wiki/Kunashir', short: 'The southernmost large island',
    note: 'The southernmost large island, Japanese-settled and taken by Soviet troops on 1 September 1945. Japan claims it still.'
  },
  Shikotan: {
    en: 'Shikotan', ja: '色丹島 (Shikotan-tō)', zh: '色丹島', ko: '시코탄섬',
    wiki: 'https://en.wikipedia.org/wiki/Shikotan',
    short: 'Taken by Soviet troops on 1 September 1945',
    note: 'Taken by Soviet troops on 1 September 1945; its Japanese inhabitants were deported in 1947 and Japan claims it still.'
  },
  'the Habomai Islands': {
    en: 'The Habomai Islands', ja: '歯舞群島 (Habomai Guntō)', zh: '齒舞群島',
    short: 'A scatter of islets in sight of Hokkaidō, taken between 1 and 5 September 1945',
    note: 'A scatter of islets in sight of Hokkaidō, taken between 1 and 5 September 1945 — after the surrender — and claimed by Japan ever since.'
  },
  Sarawak: {
    en: 'Sarawak', wiki: 'https://en.wikipedia.org/wiki/Sarawak',
    short: 'A private kingdom under the Brooke rajahs',
    note: 'A private kingdom: James Brooke put down a revolt for the Sultan of Brunei and was made rajah of Sarawak in 1841, and his family governed it as their own until 1946, under British protection from 1888. It is a country of rivers running out of forested mountains through swamp — the Rejang is the longest in Borneo — and the Brookes deliberately kept plantation capital out, so its economy stayed smallholder pepper and gambier grown by Chinese settlers, sago from the Melanau coast, jungle produce and a little gold and antimony at Bau. Oil changed that: the first well at Miri came in in 1910 and by the 1930s Sarawak Shell\'s field and refinery there were the most valuable thing the raj had. Japanese troops landed at Miri on 16 December 1941, three days ahead of Kuching, for exactly that reason.'
  },
  NorthBorneo: {
    en: 'North Borneo', wiki: 'https://en.wikipedia.org/wiki/North_Borneo',
    short: 'Governed by the British North Borneo Chartered Company from 1881',
    note: 'Governed by the British North Borneo Chartered Company from 1881, one of the last places on earth run by a company with a royal charter, and a British protectorate from 1888. The country rises from a mangrove coast through forest to Mount Kinabalu, at 4,095 m the highest mountain between the Himalaya and New Guinea, and its wealth was standing timber — some of the finest hardwood in the tropics — cut and shipped from Sandakan, which was the capital. Tobacco estates in the 1880s and 1890s gave way to rubber, copra and hemp, worked largely by Chinese and Javanese labour, and a railway was pushed inland from Jesselton on the west coast. The Japanese took it in January 1942; Sandakan became a prisoner-of-war camp from which, in 1945, some two thousand five hundred Australian and British prisoners were marched inland and all but six died.'
  },
  Labuan: {
    en: 'Labuan — a Straits Settlement from 1907 until 1946, not company territory',
    wiki: 'https://en.wikipedia.org/wiki/Labuan',
    note: 'A small island in Brunei Bay, ceded by the Sultan of Brunei in 1846 and made a Crown colony in 1848, largely because Britain wanted a coaling station on the route to China and a base against piracy. The coal was real but poor and the seams at Tanjung Kubong were abandoned by 1912; what was left was a free port with a good deep-water anchorage and a few thousand people. It was administered with the Straits Settlements from 1907, which is why it lights with Singapore, Penang and Malacca and not with the Borneo territories around it. Japanese forces landed on 1 January 1942 and renamed it Maida Island.'
  },
  Brunei: {
    en: 'Brunei', wiki: 'https://en.wikipedia.org/wiki/Brunei',
    short: 'What was left of a sultanate that had claimed the whole of northern Borneo',
    note: 'What remained of a sultanate that had once claimed the whole of northern Borneo and the Sulu islands, whittled down over sixty years by cessions to the Brookes and the Chartered Company until it was two separate pieces of coast with a few thousand square kilometres between them. A British Resident was accepted in 1906, and until the end of the 1920s the state was so poor that its administration ran at a loss. Oil was struck at Seria in 1929 and the field proved to be one of the largest in the region, which reversed the position entirely; the Japanese landed at Kuala Belait on 16 December 1941 and the retreating British fired the wells.'
  },
  Johor: {
    en: 'Johore — Unfederated Malay State',
    note: 'The southern tip of the peninsula, facing Singapore across a strait a kilometre wide, and the state that modernised on its own terms: Abu Bakar built an administration, a constitution and a capital at Johor Bahru, and Johor was the last state to accept a British General Adviser, in 1914. Its interior was opened in the nineteenth century by the kangchu system, under which Chinese headmen took river concessions and planted gambier and pepper, and after 1900 the same ground went over to rubber, with pineapple canning beside it. The causeway carrying the railway and road to Singapore opened in 1923, and in January 1942 it carried the Japanese army the other way.'
  },
  Pahang: {
    en: 'Pahang — Federated Malay State', wiki: 'https://en.wikipedia.org/wiki/Pahang',
    note: 'The largest state in the peninsula and the emptiest: a mountainous, densely forested interior draining east through the Pahang river to a straight sandy coast with a monsoon that closes it for months. The British Resident imposed in 1888 provoked a war that ran from 1891 to 1895 before the state was pacified. Its money came out of the ground — gold in the old workings, and above all tin at Sungai Lembing, one of the largest underground tin mines in the world, worked in shafts rather than the open-cast and dredging of the western states — with rubber estates along the valleys.'
  },
  Perak: {
    en: 'Perak — Federated Malay State', wiki: 'https://en.wikipedia.org/wiki/Perak',
    note: 'The tin state. The Kinta valley was the richest tin field ever found, and by the 1930s Malaya produced about a third of the world\'s tin and most of it came from here — first from Chinese labour working open-cast with the palong and the chain-pump, later from European bucket dredges. The scramble for it produced the Larut wars between Chinese secret societies and the Malay chiefs backing them, and the Pangkor Engagement of 1874 that ended them is where British intervention in the peninsula begins. Ipoh grew out of the field and Taiping out of Larut; behind them the state is limestone hills, jungle and the Perak river.'
  },
  Selangor: {
    en: 'Selangor — Federated Malay State', wiki: 'https://en.wikipedia.org/wiki/Selangor',
    note: 'The Klang valley: tin brought Chinese and Malay prospectors up the river in the 1850s, the settlement at the muddy confluence became Kuala Lumpur, and in 1896 Kuala Lumpur became the capital of the Federated Malay States and so of the whole administered peninsula. The state was tin first and rubber afterwards — the plantation belt down the western lowlands was laid out from about 1905 with Tamil labour brought from South India — and Port Swettenham on the coast handled both. The limestone caves at Batu, north of the capital, are a Tamil pilgrimage site and the setting of Thaipusam.'
  },
  NegeriSembilan: {
    en: 'Negri Sembilan — Federated Malay State',
    wiki: 'https://en.wikipedia.org/wiki/Negeri_Sembilan',
    note: '"The nine states": a confederation of small Minangkabau settlements, founded by migrants from Sumatra, which is why land and title here descend through women under adat perpatih and why the ruler is elected by the territorial chiefs rather than inheriting. It is hill and valley country between Selangor and Malacca, with tin in the north and rubber over most of the rest, and Seremban as its administrative town. It joined the Federated Malay States at their formation in 1896.'
  },
  Malacca: {
    en: 'Malacca — Straits Settlement, a Crown colony ruled from Singapore',
    wiki: 'https://en.wikipedia.org/wiki/Malacca',
    note: 'The oldest European possession in Asia: Portuguese from 1511, Dutch from 1641, and British from 1824 by the treaty that swapped it for Bencoolen. By this period the harbour had silted, the trade had gone to Singapore and Penang, and the town lived on rubber, fishing and its own past — the ruins of A Famosa, the Dutch Stadthuys, and the Baba-Nyonya community descended from Chinese merchants who had married locally over four centuries. It was one of the three Straits Settlements and therefore British soil, governed from Singapore, with a large Malay smallholding population inland.'
  },
  Singapore: {
    en: 'Singapore — Straits Settlement, and the capital of the colony',
    wiki: 'https://en.wikipedia.org/wiki/Singapore',
    note: 'Raffles landed in 1819, the East India Company made it a free port, and within a century it was the greatest entrepôt in Asia: the tin and rubber of the peninsula, the produce of the Indies and the Chinese junk trade all passed across it, and the population was three-quarters Chinese. From 1923 Britain built the naval base at Sembawang to hold the eastern empire — the King George VI graving dock, oil tanks, the largest floating dock in the world — and finished it in 1938 without ever having a fleet to put in it. The Japanese came down the peninsula instead of by sea, and the garrison surrendered on 15 February 1942 with some eighty thousand men, the largest capitulation in British military history; the island was renamed Syonan-to and its Chinese population screened, with tens of thousands killed in the Sook Ching.'
  },
  Penang: {
    en: 'Penang — Straits Settlement, with Province Wellesley on the mainland',
    wiki: 'https://en.wikipedia.org/wiki/Penang',
    note: 'Francis Light took the island for the East India Company in 1786, which makes it the first British settlement in the Malay world, and George Town on its northern point grew as a free port on the Straits of Malacca with a Chinese, Indian, Malay and Arab merchant population. The Company added Province Wellesley on the mainland opposite in 1800, so the settlement had rice land as well as a harbour. By this period it handled the tin of northern Malaya and southern Siam — the Eastern Smelting Company\'s works at Butterworth was one of the two great tin smelters in the region — and it was a Straits Settlement, British soil governed from Singapore.'
  },
  Dindings: {
    en: 'The Dindings — Straits Settlement until 1935',
    note: 'A strip of the Perak coast with the island of Pangkor off it, ceded to Britain by the Pangkor Engagement of 1874 to suppress piracy and keep the approaches to the tin rivers open, and administered as part of the Straits Settlements. It never justified itself: the population was a few thousand, the revenue was negligible, and the settlement at Lumut existed mainly because the flag was there. Britain handed it back to Perak on 16 February 1935, which is why the 1930 map lights it with Singapore and Penang and the 1942 map does not.'
  },
  'Christmas Island': {
    en: 'Christmas Island — annexed 1888, attached to the Straits Settlements in 1900 and run from Singapore, worked for phosphate',
    ja: 'クリスマス島 (Kurisumasu-tō)', wiki: 'https://en.wikipedia.org/wiki/Christmas_Island',
    short: 'A single block of limestone in the Indian Ocean, uninhabited until the 1880s',
    note: 'A single block of limestone in the Indian Ocean, uninhabited until the 1880s, annexed by Britain in 1888 once John Murray\'s survey showed that the rock was almost pure phosphate of lime. The Christmas Island Phosphate Company began mining in 1899 with Chinese indentured labour and a few hundred Malays, and the island was attached to the Straits Settlements in 1900 and administered from Singapore. Japan took it on 31 March 1942 for the phosphate, and worked it with what was left of the labour force until the mine was abandoned.'
  },
  Kedah: {
    en: 'Kedah — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Kedah',
    note: 'The rice bowl of the peninsula: the coastal plain behind Alor Star is the largest continuous stretch of padi in Malaya, drained and bunded over centuries, and the state fed a good deal of the rest of the country. It had been a tributary of Siam and was transferred to British suzerainty by the Anglo-Siamese Treaty of 1909, after which it took a British Adviser but stayed outside the Federation and kept its own civil service. Langkawi and the other islands off its coast belong to it, rubber came in on the higher ground, and in October 1943 Japan handed the state back to Thailand along with the other three northern states.'
  },
  Perlis: {
    en: 'Perlis — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Perlis',
    note: 'The smallest state in Malaya, a piece of Kedah detached in 1843 for a rival branch of the ruling family and never reunited, running from the Thai border to the sea in about eight hundred square kilometres. It is flat rice country under limestone outcrops, with Kangar as its town and Kuala Perlis as its little port, and almost no plantation industry at all. It passed to Britain with Kedah in 1909, took an Adviser, stayed unfederated, and was transferred to Thailand in 1943.'
  },
  Kelantan: {
    en: 'Kelantan — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Kelantan',
    note: 'The north-eastern corner, a broad delta of rice villages under coconut palms with one of the densest and most solidly Malay peasant populations in the peninsula, and very little of the immigrant labour that reshaped the west coast. Cut off from the rest of Malaya by mountains and from the sea for months by the north-east monsoon, it kept its own manner of doing things: wayang kulit, silat, kite-flying and top-spinning survived here as living village practice and were studied as such. It was Siamese until 1909, unfederated after it, and Kota Bharu was where Japanese troops came ashore on 8 December 1941, an hour or so before the attack on Pearl Harbor and the first land fighting of the Pacific war.'
  },
  Terengganu: {
    en: 'Trengganu — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Terengganu',
    note: 'A long east-coast state of fishing villages, boat-builders and rice deltas, with forested hills behind and a monsoon coast that beaches the boats from November to February. Its people were almost entirely Malay and its administration the most traditional in the peninsula; the British Adviser accepted after the transfer of 1909 pressed land and tax rules on it, and in 1928 a peasant rising led by Haji Abdul Rahman Limbong had to be put down by police and troops. Iron ore at Dungun, worked by a Japanese company from 1929 and shipped straight to Japan, was the one modern industry it had.'
  },
  'Hsing An Peh': {
    en: 'Kōan-hoku-shō (Xīng’ānběi, Hsingan North)', ja: '興安北省 (Kōan-hoku)', zh: '興安北省',
    local: 'Xīng’ānběi (Hsingan North)',
    short: 'The Hulun Buir grasslands west of the Greater Khingan — Mongol banners, horses and sheep, and the Trans-Manchurian line running out to the Soviet frontier at Manchouli'
  },
  'Hsing An Tung': {
    en: 'Kōan-tō-shō (Xīng’āndōng, Hsingan East)', ja: '興安東省 (Kōan-tō)', zh: '興安東省',
    local: 'Xīng’āndōng (Hsingan East)',
    short: 'The eastern slope of the Greater Khingan falling to the Nen — larch and birch forest above, Daur and Mongol grazing below, and logging camps worked for the railway'
  },
  'Hsing An Si': {
    en: 'Kōan-sei-shō (Xīng’ānxī, Hsingan West)', ja: '興安西省 (Kōan-sei)', zh: '興安西省',
    local: 'Xīng’ānxī (Hsingan West)',
    short: 'Dry steppe between the Khingan and the Mongolian plateau, too thin to plough: pasture, and the caravan roads that carried wool south before the railways took the traffic'
  },
  'Hsing An Nan': {
    en: 'Kōan-nan-shō (Xīng’ānnán, Hsingan South)', ja: '興安南省 (Kōan-nan)', zh: '興安南省',
    local: 'Xīng’ānnán (Hsingan South)',
    short: 'The southern tail of the Khingan where the steppe meets the farmed land — Mongol banners losing ground to Chinese settlement, a frontier of tillage that had been moving north for a century'
  },
  Heiho: {
    en: 'Kokka-shō (Hēihé, Heiho)', ja: '黒河省 (Kokka)', zh: '黑河省', ko: '헤이허',
    wiki: 'https://en.wikipedia.org/wiki/Heihe', local: 'Hēihé (Heiho)',
    short: 'Taiga and the Amur, facing Blagoveshchensk across the water — gold along the tributaries, and after 1932 a garrison frontier watched from both banks'
  },
  Lungkiang: {
    en: 'Ryūkō-shō (Lóngjiāng, Lungkiang)', ja: '龍江省 (Ryūkō)', zh: '龍江省', ko: '헤이룽장성',
    wiki: 'https://en.wikipedia.org/wiki/Heilongjiang', local: 'Lóngjiāng (Lungkiang)',
    short: 'The Nonni plain, black earth and the great soya and wheat country of the north; Tsitsihar its capital, and the first serious fighting of the Manchurian Incident fought at the Nonni bridges in November 1931'
  },
  Sankiang: {
    en: 'Sankō-shō (Sānjiāng, Sankiang)', ja: '三江省 (Sankō)', zh: '三江省',
    local: 'Sānjiāng (Sankiang)',
    short: 'The marshy confluence of the Sungari and the Amur — the Sanjiang plain, drained and broken in the 1930s for the Japanese agricultural colonies, the largest settlement scheme of the empire'
  },
  'Pin Kiang': {
    en: 'Hinkō-shō (Bīnjiāng, Pinkiang)', ja: '濱江省 (Hinkō)', zh: '濱江省', ko: '빈장구',
    wiki: 'https://en.wikipedia.org/wiki/Binjiang,_Hangzhou', local: 'Bīnjiāng (Pinkiang)',
    short: 'Harbin and the Sungari: the junction of the Chinese Eastern Railway, a city of Russian émigrés, grain and distilling — and, at Pingfang on its southern edge, the Kwantung Army’s biological warfare establishment, Unit 731'
  },
  'Chien Tao': {
    en: 'Kantō-shō (Jiāndǎo, Chientao)', ja: '間島省 (Kantō)', zh: '間島省', ko: '간도',
    wiki: 'https://en.wikipedia.org/wiki/Jiandao', local: 'Jiāndǎo (Chientao)',
    short: 'The Tumen frontier with Korea, mountainous and mostly Korean-settled; the ground on which the anti-Japanese partisan bands of the 1930s formed, and were hunted through'
  },
  'Feng Tien': {
    en: 'Hōten-shō (Fèngtiān, Fengtien)', ja: '奉天省 (Hōten)', zh: '奉天省', ko: '랴오닝성',
    wiki: 'https://en.wikipedia.org/wiki/Liaoning', local: 'Fèngtiān (Fengtien)',
    short: 'The Liao plain and Mukden — headquarters of the South Manchuria Railway, the region’s arsenal and heavy industry, and the place where the line was blown up on 18 September 1931'
  },
  'An Tung': {
    en: 'Antō-shō (Āndōng, Antung)', ja: '安東省 (Antō)', zh: '安東省', ko: '안동',
    wiki: 'https://en.wikipedia.org/wiki/Andong', local: 'Āndōng (Antung)',
    short: 'The Yalu frontier, timber floated down from the interior and milled at Antung, and the bridge across to Sinuiju that carried the traffic between Manchuria and Korea'
  },
  Kirin: {
    en: 'Kirin-shō (Jílín, Kirin)', ja: '吉林省 (Kirin)', zh: '吉林省', ko: '지린성',
    wiki: 'https://en.wikipedia.org/wiki/Jilin', local: 'Jílín (Kirin)',
    short: 'The upper Sungari in forested hills — lumber, and the Fengman dam begun in 1937, one of the largest hydroelectric works in Asia, built with conscripted labour'
  },
  Chinchow: {
    en: 'Kinshū-shō (Jǐnzhōu, Chinchow)', ja: '錦州省 (Kinshū)', zh: '錦州省',
    wiki: 'https://en.wikipedia.org/wiki/Jinzhou_Operation', local: 'Jǐnzhōu (Chinchow)',
    short: 'The corridor between the Gulf of Chihli and the mountains — the road and railway into China proper, taken in January 1932, which is how the fighting passed south of the Wall',
    note: 'The corridor between the Gulf of Chihli and the mountains: the road and the railway into China proper, and so the ground the Kwantung Army had to hold if the fighting was to pass south of the Wall. It is also where the war in the air began. Chang Hsüeh-liang had withdrawn his government here after Mukden, and on **8 October 1931** eleven Japanese aircraft bombed the city — one of the first aerial bombardments of an undefended town, and the first anywhere to be reported live to the League of Nations, whose observers were in China at the time. The raid did more than any other single act to turn foreign opinion, and it is what prompted Stimson to begin drafting the non-recognition doctrine that bears his name. Chinchow itself was occupied on **3 January 1932**, and with it the last Chinese administration in Manchuria went.'
  },
  'Je Hol': {
    en: 'Nekka-shō (Rèhé, Jehol)', ja: '熱河省 (Nekka)', zh: '熱河省', local: 'Rèhé (Jehol)',
    short: 'Mountain country north of the Great Wall, thin farming and opium; invaded in the spring of 1933 and attached to Manchukuo, which carried the frontier down to the Wall itself',
    note: 'A province of the Republic until February 1933, when the Kwantung Army took it and attached it to Manchukuo.'
  },
  Marianas: {
    en: 'Mariana Islands', ja: 'マリアナ諸島 (Mariana Shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Mariana_Islands',
    short: 'The chain Japan took from Germany in 1914, less Guam',
    note: 'The chain Japan took from Germany in 1914, less Guam, and the most heavily settled part of the mandate. The Americans took Saipan, Tinian and Guam between June and August 1944 and left the northern islands alone; the fall of Saipan put Japan within B-29 range and brought down the Tōjō cabinet. The Commonwealth of the Northern Mariana Islands since 1978.'
  },
  Palau: {
    en: 'Palau', ja: 'パラオ (Parao)', wiki: 'https://en.wikipedia.org/wiki/Palau',
    short: 'The seat of the South Seas Bureau at Koror from 1922, and the westernmost of the mandate',
    note: 'The seat of the South Seas Bureau at Koror from 1922, and the westernmost of the mandate. The Americans took Peleliu and Angaur in September 1944 and went round the rest, leaving some 25,000 troops on Babeldaob to grow their own food until the surrender. The Republic of Palau since 1994.'
  },
  Yap: {
    en: 'Yap', ja: 'ヤップ (Yappu)', wiki: 'https://en.wikipedia.org/wiki/Yap',
    short: 'A cable and radio station',
    note: 'A cable and radio station, and the subject of a long dispute between Japan and the United States in the 1920s. The Americans never landed: they bombed the airfields from 1944 and went past. Its stone money and its navigators are what it is known for now. Federated States of Micronesia.'
  },
  Chuuk: {
    en: 'Truk (Chuuk)', ja: 'トラック (Torakku)',
    short: 'Truk lagoon, the Combined Fleet\'s central Pacific anchorage',
    note: 'Truk lagoon, the Combined Fleet\'s central Pacific anchorage — the "Gibraltar of the Pacific" until the American carrier raids of February 1944 showed it was nothing of the kind. No landing was ever made on it: it was left behind the front and starved. Chuuk State, Federated States of Micronesia.'
  },
  Pohnpei: {
    en: 'Ponape (Pohnpei)', ja: 'ポナペ (Ponape)', wiki: 'https://en.wikipedia.org/wiki/Pohnpei',
    short: 'Ponape, the wettest and most fertile of the Carolines',
    note: 'Ponape, the wettest and most fertile of the Carolines, with a Japanese agricultural station and the basalt city of Nan Madol on its reef. The Americans shelled and bombed it from 1944 and never landed; its garrison of about 8,000 was still there in August 1945. Federated States of Micronesia.'
  },
  Kosrae: {
    en: 'Kusaie (Kosrae)', ja: 'クサイエ (Kusaie)', wiki: 'https://en.wikipedia.org/wiki/Kosrae',
    short: 'The easternmost of the Carolines, with the basalt ruins of Lelu on its shore',
    note: 'The easternmost of the Carolines, with the basalt ruins of Lelu on its shore. The Americans passed it by altogether — no landing and little bombing — and its garrison of some 4,000 surrendered in September 1945. A state of the Federated States of Micronesia.'
  },
  Marshalls: {
    en: 'Marshall Islands', ja: 'マーシャル諸島 (Māsharu Shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Marshall_Islands',
    short: 'The outermost ring of the mandate, and the first of it to go',
    note: 'The outermost ring of the mandate, and the first of it to go: the Americans took Kwajalein and Majuro in January 1944 and Enewetak in February, and left the other atolls — Jaluit, Wotje, Mili, Maloelap — bombed and unsupplied behind the front. The Republic of the Marshall Islands since 1986.'
  },
  Saipan: {
    en: 'Saipan', ja: 'サイパン (Saipan)', zh: '塞班',
    wiki: 'https://en.wikipedia.org/wiki/Saipan,_Northern_Mariana_Islands',
    short: 'The largest of the Marianas and the sugar island: Nan\'yō Kōhatsu\'s cane and mills',
    note: 'The largest of the Marianas and the sugar island: Nan\'yō Kōhatsu\'s cane and mills, a narrow-gauge railway round the coast, and about 29,000 Japanese and Okinawan settlers by the late 1930s against some 4,000 Chamorro and Carolinian islanders. Garapan was the largest town in the mandate. The Americans landed on 15 June 1944 and took it by 9 July; nearly the whole garrison of 30,000 died, and hundreds of Japanese civilians threw themselves off the cliffs at Marpi Point rather than surrender. The B-29 fields built here began the bombing of Japan. It is the seat of the Commonwealth of the Northern Mariana Islands.'
  },
  Tinian: {
    en: 'Tinian', ja: 'テニアン (Tenian)', zh: '天寧',
    wiki: 'https://en.wikipedia.org/wiki/Tinian,_Northern_Mariana_Islands',
    short: 'Flat limestone three miles from Saipan and almost all of it under cane',
    note: 'Flat limestone three miles from Saipan and almost all of it under cane: some 15,000 settlers, a sugar mill and a company town. The Marines landed on 24 July 1944 and had the island by 1 August, in what their own official history calls the best-executed amphibious operation of the war. North Field\'s six runways then made it the busiest airfield in the world, and the aircraft that bombed Hiroshima and Nagasaki flew from them. Northern Marianas, with much of the island still leased to the American military.'
  },
  Rota: {
    en: 'Rota', ja: 'ロタ (Rota)', zh: '羅塔',
    wiki: 'https://en.wikipedia.org/wiki/Rota,_Northern_Mariana_Islands',
    short: 'Between Saipan and Guam, with sugar and a few thousand people, Chamorro and Japanese',
    note: 'Between Saipan and Guam, with sugar and a few thousand people, Chamorro and Japanese. It was never assaulted — the Americans took the islands they wanted and flew past this one — so its garrison of about 3,000 sat out the war under bombing and surrendered on 2 September 1945. The quietest of the Northern Marianas now.'
  },
  Pagan: {
    en: 'Pagan', ja: 'パガン (Pagan)', zh: '帕甘',
    wiki: 'https://en.wikipedia.org/wiki/Pagan_(island)',
    short: 'Two volcanoes joined by an isthmus in the northern Marianas',
    note: 'Two volcanoes joined by an isthmus in the northern Marianas, with a copra settlement and an airstrip built in the 1930s. Bombed from 1944 and then left behind the front; the garrison of about 2,000 was still there, and hungry, at the surrender. Mount Pagan erupted in 1981 and the island has been evacuated ever since. Northern Marianas.'
  },
  Agrihan: {
    en: 'Agrihan', ja: 'アグリハン (Agurihan)', zh: '阿格里漢',
    wiki: 'https://en.wikipedia.org/wiki/Agrihan',
    short: 'The highest island in the Marianas — a volcano of 965 m',
    note: 'The highest island in the Marianas — a volcano of 965 m — with a few dozen people on it growing copra. The Americans never came near it; the handful of troops on it gave themselves up in 1945. All but uninhabited now. Northern Marianas.'
  },
  Anatahan: {
    en: 'Anatahan', ja: 'アナタハン (Anatahan)', zh: '阿納塔漢',
    wiki: 'https://en.wikipedia.org/wiki/Anatahan',
    short: 'A volcanic ridge with no harbour and a small copra settlement',
    note: 'A volcanic ridge with no harbour and a small copra settlement. No landing was ever made on it. Thirty-odd Japanese survivors of ships sunk in 1944 lived on it after the surrender and would not believe the war was over; the last of them came off in June 1951, with a woman, Higa Kazuko, among them, whose presence the newspapers made the whole of the story. Evacuated after the 2003 eruption. Northern Marianas.'
  },
  Babeldaob: {
    en: 'Babeldaob (Palau)', ja: 'バベルダオブ (Baberudaobu)', zh: '巴貝爾道布',
    wiki: 'https://en.wikipedia.org/wiki/Babeldaob',
    short: 'The largest island of the mandate, volcanic and forested',
    note: 'The largest island of the mandate, volcanic and forested, with bauxite mined from the late 1930s. The South Seas Bureau governed the whole mandate from Koror on its doorstep from 1922, and there were some 25,000 Japanese in Palau by 1940 — more than there were Palauans. After Peleliu the Americans left it alone, and its garrison of about 25,000 spent the last year of the war growing its own food and going hungry. The capital of the Republic of Palau moved onto it, to Ngerulmud, in 2006.'
  },
  Peleliu: {
    en: 'Peleliu', ja: 'ペリリュー (Peririyū)', zh: '貝里琉',
    wiki: 'https://en.wikipedia.org/wiki/Peleliu',
    short: 'A low coral island with the airfield the Americans came for',
    note: 'A low coral island with the airfield the Americans came for. They landed on 15 September 1944 expecting four days; it took over two months and cost some 1,800 American and 10,000 Japanese lives. Nakagawa Kunio gave up the beaches and fought from the caves of the Umurbrogol ridge — the defence used again at Iwo Jima and Okinawa. Whether the island needed taking at all has been argued ever since. Palau.'
  },
  Angaur: {
    en: 'Angaur', zh: '安加爾', wiki: 'https://en.wikipedia.org/wiki/Angaur',
    short: 'Eight square kilometres of phosphate',
    note: 'Eight square kilometres of phosphate, mined by the Germans from 1909 and by Japan after them, worked by labour brought in from the Carolines and the Marianas. Taken between 17 September and 22 October 1944 alongside Peleliu and turned into a bomber field. Palau.'
  },
  Weno: {
    en: 'Moen (Weno), Truk', ja: '春島 (Harushima)', zh: '春島',
    wiki: 'https://en.wikipedia.org/wiki/Weno',
    short: 'Moen, the main island of Truk lagoon — the Combined Fleet\'s forward anchorage and',
    note: 'Moen, the main island of Truk lagoon — the Combined Fleet\'s forward anchorage and, in the phrase of the time, the Gibraltar of the Pacific: airfields, a seaplane base, a Japanese town and some 27,000 troops. Operation Hailstone on 17–18 February 1944 sank about forty ships and destroyed some 250 aircraft in two days, after which the Americans left Truk behind the front and it starved. The wrecks in the lagoon are dived on now. Weno is the capital of Chuuk State, Federated States of Micronesia.'
  },
  Kwajalein: {
    en: 'Kwajalein', zh: '瓜加林', wiki: 'https://en.wikipedia.org/wiki/Kwajalein_Atoll',
    short: 'The largest coral atoll in the world by the area of its lagoon',
    note: 'The largest coral atoll in the world by the area of its lagoon, ninety-odd islets round it, and the Japanese headquarters in the Marshalls. Taken between 31 January and 4 February 1944 — the first assault on ground Japan had held before the war began, and the breach of the outer perimeter. It is an American missile range now, leased from the Marshall Islands and the largest employer in the country.'
  },
  Majuro: {
    en: 'Majuro', ja: 'マジュロ (Majuro)', zh: '馬久羅', wiki: 'https://en.wikipedia.org/wiki/Majuro',
    short: 'A thin ring of islets round a deep lagoon',
    note: 'A thin ring of islets round a deep lagoon. The small Japanese garrison had already gone when the Americans arrived on 31 January 1944, so it was taken without a shot and became the fleet anchorage the drive across the central Pacific was mounted from. The capital of the Republic of the Marshall Islands.'
  },
  Jaluit: {
    en: 'Jaluit', ja: 'ヤルート (Yarūto)', zh: '賈盧伊特',
    wiki: 'https://en.wikipedia.org/wiki/Jaluit_Atoll',
    short: 'The seat of the Marshalls under the Germans from 1885 and under Japan after 1914',
    note: 'The seat of the Marshalls under the Germans from 1885 and under Japan after 1914, with a trading town at Jabor and the copra trade run from it. The Americans went round it in 1944, bombed it and left it to starve; the garrison surrendered in August 1945 and a typhoon finished the town off in 1958. Marshall Islands.'
  },
  Wotje: {
    en: 'Wotje', zh: '沃杰', wiki: 'https://en.wikipedia.org/wiki/Wotje_Atoll',
    short: 'One of the four Marshalls atolls Japan built an airfield on',
    note: 'One of the four Marshalls atolls Japan built an airfield on, with some 3,000 troops on it. The Americans left it behind the front in 1944 and bombed it for the rest of the war without ever landing on it; the garrison, reduced to fishing and gardening, surrendered in 1945. Marshall Islands.'
  },
  Enewetak: {
    en: 'Enewetak', zh: '埃內韋塔克', wiki: 'https://en.wikipedia.org/wiki/Enewetak_Atoll',
    short: 'A large atoll at the western edge of the Marshalls, with an airstrip on Engebi',
    note: 'A large atoll at the western edge of the Marshalls, with an airstrip on Engebi. Taken between 17 and 23 February 1944, which carried the Americans past the last of the Marshalls. Its people were moved off in 1947 and forty-three nuclear tests were fired here, among them Ivy Mike in 1952, the first hydrogen bomb, which left a crater where the islet of Elugelab had been. The contaminated debris is under a concrete dome on Runit. Marshall Islands.'
  },
  Bikini: {
    en: 'Bikini', zh: '比基尼', wiki: 'https://en.wikipedia.org/wiki/Bikini_Atoll',
    short: 'A northern atoll with no airfield and no battle',
    note: 'A northern atoll with no airfield and no battle: the Japanese watch post on it was killed in February 1944 and that was the war. Its 167 people were moved off in 1946 for Operation Crossroads and twenty-three tests followed, Castle Bravo in 1954 the largest the United States ever fired. They have never been able to go back. Marshall Islands.'
  },
  Ebon: {
    en: 'Ebon', ja: 'エボン (Ebon)', zh: '埃邦', wiki: 'https://en.wikipedia.org/wiki/Ebon_Atoll',
    short: 'The southernmost atoll of the Marshalls',
    note: 'The southernmost atoll of the Marshalls, and where American missionaries first landed in 1857 — the church has been at the centre of Marshallese life ever since. Copra, no airfield, and nothing the war wanted: it was passed over entirely. Marshall Islands.'
  },
  'The Mongol leagues': {
    en: 'Mōko renmei (the Mongol leagues)', ja: '蒙古聯盟 (Mōko renmei)', zh: '蒙古各盟',
    local: 'The Mongol leagues',
    short: 'The Ulanchab and Silingol leagues on the plateau north of the Wall — grazing land, Mongol banners, and the constituency for the autonomy Prince Demchugdongrub was offered and Japan supervised'
  },
  'North Shansi (Jinbei) Administration': {
    en: 'Shinpoku seichō (Jìnběi) — the North Shansi Administration',
    ja: '晉北政廳 (Shinpoku seichō)', zh: '晉北政廳', local: 'Jìnběi — the North Shansi Administration',
    short: 'The loess uplands of northern Shansi around Tatung, coal country — the mines worked hard through the occupation, and the ground the Eighth Route Army contested from the hills'
  },
  'South Chahar (Chanan) Administration': {
    en: 'Satsunan seichō (Chánán) — the South Chahar Administration',
    ja: '察南政廳 (Satsunan seichō)', zh: '察南政廳', local: 'Chánán — the South Chahar Administration',
    short: 'The Chahar basin around Kalgan, the old gate on the caravan road to Urga; the administrative seat of the federation and the junction of its railways'
  },
  Sumatra: {
    en: 'Sumatra', ja: 'スマトラ (Sumatora)', wiki: 'https://en.wikipedia.org/wiki/Sumatra',
    short: 'Rubber, tobacco and above all the oil of Palembang',
    note: 'Rubber, tobacco and above all the oil of Palembang, which was taken by parachute assault on 14 February 1942 before the refineries could be destroyed.'
  },
  Java: {
    en: 'Java', ja: 'ジャワ (Jawa)',
    short: 'The centre of the colony and of its population: two thirds of the Indies lived here',
    note: 'The centre of the colony and of its population: two thirds of the Indies lived here. The Dutch surrendered on 8 March 1942, and the Japanese levied the rōmusha labour drafts from it.'
  },
  Madura: {
    en: 'Madura', ja: 'マドゥラ (Madura)', wiki: 'https://en.wikipedia.org/wiki/Madura',
    short: 'Salt from the pans along its south coast, cattle',
    note: 'Salt from the pans along its south coast, cattle, and two courts of its own under the Dutch — poor, dry and densely peopled.'
  },
  Borneo: {
    en: 'Borneo (Kalimantan)', ja: 'ボルネオ (Boruneo)',
    wiki: 'https://en.wikipedia.org/wiki/Borneo', short: 'Oil at Balikpapan and Tarakan',
    note: 'Oil at Balikpapan and Tarakan, which was the reason the southern advance came this way at all. Taken in January and February 1942.'
  },
  Sulawesi: {
    en: 'Celebes (Sulawesi)', ja: 'セレベス (Serebesu)',
    wiki: 'https://en.wikipedia.org/wiki/Sulawesi',
    short: 'Celebes, taken between January and February 1942',
    note: 'Celebes, taken between January and February 1942, and put under naval rather than army administration for the rest of the war.'
  },
  Bali: {
    en: 'Bali', ja: 'バリ (Bari)', wiki: 'https://en.wikipedia.org/wiki/Bali',
    short: 'Taken on 19 February 1942',
    note: 'Taken on 19 February 1942. The action in Badung Strait the following night went the other way: four Japanese destroyers beat off a much larger Allied force and sank a Dutch destroyer.'
  },
  Lombok: {
    en: 'Lombok', ja: 'ロンボク (Ronboku)', wiki: 'https://en.wikipedia.org/wiki/Lombok',
    short: 'Between Bali and Sumbawa',
    note: 'Between Bali and Sumbawa, and the strait through which the Allied ships that got away from Java escaped south.'
  },
  Sumbawa: {
    en: 'Sumbawa', ja: 'スンバワ (Sunbawa)', wiki: 'https://en.wikipedia.org/wiki/Sumbawa',
    short: 'A dry island of horses and sandalwood, and of Tambora',
    note: 'A dry island of horses and sandalwood, and of Tambora, whose eruption in 1815 cooled the whole world.'
  },
  Flores: {
    en: 'Flores', ja: 'フローレス (Furōresu)', wiki: 'https://en.wikipedia.org/wiki/Flores',
    short: 'Taken in 1942 and used for an airstrip',
    note: 'Taken in 1942 and used for an airstrip; otherwise left to itself.'
  },
  Sumba: {
    en: 'Sumba', ja: 'スンバ (Sunba)', wiki: 'https://en.wikipedia.org/wiki/Sumba',
    short: 'Horses, sandalwood and ikat weaving',
    note: 'Horses, sandalwood and ikat weaving, and a society of clans and megalithic tombs that the Dutch reached late and governed lightly.'
  },
  WestTimor: {
    en: 'Dutch Timor', ja: 'チモール (Chimōru)', wiki: 'https://en.wikipedia.org/wiki/West_Timor',
    short: 'The Dutch half of Timor',
    note: 'The Dutch half of Timor, taken on 20 February 1942 with a parachute landing behind the Australian force at Koepang.'
  },
  Halmahera: {
    en: 'Halmahera', ja: 'ハルマヘラ (Harumahera)', wiki: 'https://en.wikipedia.org/wiki/Halmahera',
    short: 'Bypassed in 1944 when the Americans took Morotai beside it instead',
    note: 'Bypassed in 1944 when the Americans took Morotai beside it instead, and its garrison was left to starve.'
  },
  Seram: {
    en: 'Ceram (Seram)', ja: 'セラム (Seramu)', wiki: 'https://en.wikipedia.org/wiki/Seram_Island',
    short: 'Sago and the oil at Bula on its eastern end',
    note: 'Sago and the oil at Bula on its eastern end. The mountainous interior was never properly administered.'
  },
  Buru: {
    en: 'Buru', ja: 'ブル (Buru)', wiki: 'https://en.wikipedia.org/wiki/Buru',
    short: 'A quiet island off Ceram',
    note: 'A quiet island off Ceram, later notorious as an Indonesian prison colony.'
  },
  Bangka: {
    en: 'Banka (Bangka)', ja: 'バンカ (Banka)',
    wiki: 'https://en.wikipedia.org/wiki/Bangka_Island',
    short: 'Tin, worked by Chinese labour since the eighteenth century',
    note: 'Tin, worked by Chinese labour since the eighteenth century. Off its coast in February 1942 Japanese troops machine-gunned twenty-two Australian nurses who had survived a sinking; one lived.'
  },
  Belitung: {
    en: 'Billiton (Belitung)', ja: 'ビリトン (Biriton)',
    wiki: 'https://en.wikipedia.org/wiki/Belitung',
    short: 'Tin, worked by Chinese labour since the nineteenth century under the Billiton company',
    note: 'Tin, worked by Chinese labour since the nineteenth century under the Billiton company — which later gave half its name to BHP Billiton.'
  },
  Nias: {
    en: 'Nias', ja: 'ニアス (Niasu)', wiki: 'https://en.wikipedia.org/wiki/Nias',
    short: 'Off the west coast of Sumatra',
    note: 'Off the west coast of Sumatra, and famous for its megaliths and stone-jumping.'
  },
  WestNewGuinea: {
    en: 'Dutch New Guinea', ja: '西部ニューギニア (Seibu Nyūginia)',
    wiki: 'https://en.wikipedia.org/wiki/Dutch_New_Guinea',
    short: 'The Dutch half of New Guinea',
    note: 'The Dutch half of New Guinea, hardly administered before the war and the ground the Americans came back through in 1944 — Hollandia, Biak, Sansapor.'
  },
  Aru: {
    en: 'Aru Islands', ja: 'アル諸島 (Aru-shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Aru_Islands',
    short: 'A low, swampy group off New Guinea across the Arafura Sea',
    note: 'A low, swampy group off New Guinea across the Arafura Sea, governed from Amboina with the rest of the Moluccas and not from New Guinea at all. Pearl shell and birds of paradise were what the outside world came for; the Japanese took it in 1942 and used Dobo as a seaplane base.'
  },
  Tanimbar: {
    en: 'Tanimbar Islands', ja: 'タニンバル諸島 (Taninbaru-shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Tanimbar_Islands',
    short: 'The largest of the south-eastern Moluccas, Yamdena and its neighbours',
    note: 'The largest of the south-eastern Moluccas, Yamdena and its neighbours. Australian and Dutch aircraft raided Saumlaki through 1942, and the Japanese held it as the eastern shoulder of the Banda Sea.'
  },
  Kai: {
    en: 'Kai Islands', ja: 'カイ諸島 (Kai-shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Kai_Islands',
    short: 'Two islands of very different make — Kai Besar high and forested, Kai Kecil flat coral',
    note: 'Two islands of very different make — Kai Besar high and forested, Kai Kecil flat coral — famous for the boatbuilders of Banda Eli. Taken in 1942 and used as a staging point for the Arafura Sea.'
  },
  RajaAmpat: {
    en: 'Raja Ampat Islands', wiki: 'https://en.wikipedia.org/wiki/Raja_Ampat_Islands',
    short: 'Waigeo, Batanta, Salawati and Misool, off the western tip of New Guinea',
    note: 'Waigeo, Batanta, Salawati and Misool, off the western tip of New Guinea. Nominally under the Sultan of Tidore until the Dutch took the claim over, and among the least administered ground in the colony.'
  },
  Biak: {
    en: 'Biak', ja: 'ビアク島 (Biaku-tō)', wiki: 'https://en.wikipedia.org/wiki/Biak_Island',
    short: 'Taken by the Japanese in 1942 and turned into an airfield complex',
    note: 'Taken by the Japanese in 1942 and turned into an airfield complex. The American landing of 27 May 1944 met a defence dug into the coral terraces above the strips and cost more than any other operation in New Guinea.'
  },
  Yapen: {
    en: 'Japen (Yapen)', wiki: 'https://en.wikipedia.org/wiki/Yapen',
    short: 'A long ridge of an island in Geelvink Bay, between Biak and the New Guinea shore',
    note: 'A long ridge of an island in Geelvink Bay, between Biak and the New Guinea shore. Held by the Japanese from 1942 and taken by American forces in 1944.'
  },
  Kolepom: {
    en: 'Frederik Hendrik Island', wiki: 'https://en.wikipedia.org/wiki/Dolak_Island',
    short: 'Frederik Hendrik Island, called Dolak now',
    note: 'Frederik Hendrik Island, called Dolak now — a slab of swamp and grass the size of Bali off the south coast, separated from New Guinea by a channel a few hundred metres wide.'
  },
  Wetar: {
    en: 'Wetar', wiki: 'https://en.wikipedia.org/wiki/Wetar',
    short: 'Dry, mountainous and barely populated, north of Timor across the strait',
    note: 'Dry, mountainous and barely populated, north of Timor across the strait. It mattered in 1942 only as the ground the Japanese had to hold to seal the Timor campaign off from the sea.'
  },
  Obi: {
    en: 'Obi Islands', wiki: 'https://en.wikipedia.org/wiki/Obi_Islands',
    short: 'Forested and almost empty, between Halmahera and Sula',
    note: 'Forested and almost empty, between Halmahera and Sula. The Dutch worked it for timber and a little gold; the Japanese passed it by in favour of Halmahera.'
  },
  Alor: {
    en: 'Alor', wiki: 'https://en.wikipedia.org/wiki/Alor_Island',
    short: 'A crowded, mountainous island north of Timor',
    note: 'A crowded, mountainous island north of Timor, better known to anthropology than to administration: Cora Du Bois worked here in 1938 and 1939, and *The People of Alor* came out of it in 1944.'
  },
  Pantar: {
    en: 'Pantar', wiki: 'https://en.wikipedia.org/wiki/Pantar', short: 'Volcanic, dry and poor',
    note: 'Volcanic, dry and poor, west of Alor and governed with it.'
  },
  Lembata: {
    en: 'Lomblen (Lembata)', wiki: 'https://en.wikipedia.org/wiki/Lembata',
    short: 'Lomblen, in the Solor chain east of Flores',
    note: 'Lomblen, in the Solor chain east of Flores, where the whaling village of Lamalera still took sperm whales from open boats.'
  },
  Rote: {
    en: 'Roti (Rote)', wiki: 'https://en.wikipedia.org/wiki/Rote_Island',
    short: 'The southernmost island of the Indies, dry and low',
    note: 'The southernmost island of the Indies, dry and low, with the lontar palm at the centre of its economy. Its people were among the earliest and most thoroughly Christianised in the archipelago.'
  },
  Savu: {
    en: 'Savu (Sabu)', wiki: 'https://en.wikipedia.org/wiki/Savu',
    short: 'A small dry island between Sumba and Timor, living off the lontar palm as Roti did',
    note: 'A small dry island between Sumba and Timor, living off the lontar palm as Roti did, and sending migrants across the eastern islands.'
  },
  Sula: {
    en: 'Sula Islands', wiki: 'https://en.wikipedia.org/wiki/Sula_Islands',
    short: 'Taliabu, Mangole and Sanana, west of Halmahera. Ruled from Ternate before the Dutch',
    note: 'Taliabu, Mangole and Sanana, west of Halmahera. Ruled from Ternate before the Dutch, and left largely to itself after.'
  },
  Talaud: {
    en: 'Talaud Islands', wiki: 'https://en.wikipedia.org/wiki/Talaud_Islands',
    short: 'The northernmost land of the Indies, closer to Mindanao than to Celebes',
    note: 'The northernmost land of the Indies, closer to Mindanao than to Celebes, and the first Dutch territory the Japanese passed on the way south.'
  },
  Sangihe: {
    en: 'Sangihe Islands', ja: 'サンギヘ諸島 (Sangihe-shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Sangir_Islands',
    short: 'A volcanic chain between Celebes and the Philippines',
    note: 'A volcanic chain between Celebes and the Philippines. Awu erupted repeatedly through the colonial period, and its people migrated in numbers to Minahasa and Mindanao.'
  },
  Ambon: {
    en: 'Ambon', ja: 'アンボン島 (Anbon-tō)', wiki: 'https://en.wikipedia.org/wiki/Ambon_Island',
    short: 'The seat of government for the Moluccas and the centre of the old spice trade',
    note: 'The seat of government for the Moluccas and the centre of the old spice trade. Taken between 30 January and 3 February 1942; the Australian and Dutch garrison surrendered, and more than three hundred prisoners were killed at Laha airfield in the days that followed.'
  },
  Babar: {
    en: 'Babar Islands', wiki: 'https://en.wikipedia.org/wiki/Babar_Islands',
    short: 'A small group east of Timor',
    note: 'A small group east of Timor, among the least visited of the Dutch possessions.'
  },
  Bacan: {
    en: 'Batjan (Bacan)', wiki: 'https://en.wikipedia.org/wiki/Bacan',
    short: 'Batjan, south of Halmahera',
    note: 'Batjan, south of Halmahera, once a sultanate of its own and by 1930 a quiet island of forest and clove gardens.'
  },
  Morotai: {
    en: 'Morotai', ja: 'モロタイ島 (Morotai-tō)',
    wiki: 'https://en.wikipedia.org/wiki/Morotai_Island',
    short: 'North of Halmahera, and the one island in the group the Allies wanted',
    note: 'North of Halmahera, and the one island in the group the Allies wanted. The American landing of 15 September 1944 was almost unopposed, and the airfields built here carried the return to the Philippines.'
  },
  Natuna: {
    en: 'Natuna Islands', wiki: 'https://en.wikipedia.org/wiki/Natuna_Islands',
    short: 'In the South China Sea between Borneo and the Malay peninsula',
    note: 'In the South China Sea between Borneo and the Malay peninsula, Dutch by treaty and Malay by population.'
  },
  Siberut: {
    en: 'Siberut', wiki: 'https://en.wikipedia.org/wiki/Siberut',
    short: 'The largest of the Mentawai islands off west Sumatra, kept deliberately apart',
    note: 'The largest of the Mentawai islands off west Sumatra, kept deliberately apart: its people were left to themselves for longer than almost anywhere else in the colony.'
  },
  Simeulue: {
    en: 'Simalur (Simeulue)', wiki: 'https://en.wikipedia.org/wiki/Simeulue',
    short: 'Simalur, off the Acehnese coast',
    note: 'Simalur, off the Acehnese coast, with a clove and coconut economy and a long memory of the sea — the warning song about *smong*, the retreating tide, is from here.'
  },
  Bawean: {
    en: 'Bawean', wiki: 'https://en.wikipedia.org/wiki/Bawean',
    short: 'Its men migrated to Singapore and Malaya in such numbers that most lived abroad',
    note: 'A small island in the Java Sea whose men migrated to Singapore and Malaya in such numbers that the Bawean community there long outnumbered the one at home.'
  },
  Komodo: {
    en: 'Komodo', wiki: 'https://en.wikipedia.org/wiki/Komodo_(island)',
    short: 'Dry, rugged and almost uninhabited between Sumbawa and Flores',
    note: 'Dry, rugged and almost uninhabited between Sumbawa and Flores. The monitor lizard was described for science in 1912 and the Dutch protected it from 1931.'
  },
  Atjeh: { en: 'Atjeh and Dependencies (Sumatra)', wiki: 'https://en.wikipedia.org/wiki/Aceh' },
  SumatraEastCoast: { en: 'Sumatra’s East Coast and Tapanoeli' },
  SumatraWestCoast: { en: 'Sumatra’s West Coast' },
  Riouw: { en: 'Riouw and Dependencies' },
  Djambi: { en: 'Djambi (Sumatra)', wiki: 'https://en.wikipedia.org/wiki/Jambi' },
  Palembang: { en: 'Palembang (Sumatra)', wiki: 'https://en.wikipedia.org/wiki/Palembang' },
  BankaBilliton: { en: 'Banka and Billiton' },
  Benkoelen: { en: 'Benkoelen (Sumatra)', wiki: 'https://en.wikipedia.org/wiki/Bengkulu' },
  Lampongs: { en: 'The Lampongs (Sumatra)', wiki: 'https://en.wikipedia.org/wiki/Sumatra' },
  WestJava: {
    en: 'West Java — Bantam, Batavia, Preanger', wiki: 'https://en.wikipedia.org/wiki/West_Java'
  },
  CentralJava: {
    en: 'Central Java — with the princely land of Soerakarta',
    wiki: 'https://en.wikipedia.org/wiki/Central_Java'
  },
  Jogjakarta: { en: 'Jogjakarta (princely land)' },
  EastJava: { en: 'East Java — with Madura', wiki: 'https://en.wikipedia.org/wiki/East_Java' },
  WestBorneo: { en: 'West Borneo', wiki: 'https://en.wikipedia.org/wiki/West_Kalimantan' },
  SouthEastBorneo: { en: 'South and East Borneo' },
  Menado: { en: 'Menado — northern and central Celebes', wiki: 'https://en.wikipedia.org/wiki/Manado' },
  Celebes: { en: 'Celebes and Dependencies' },
  Papua: {
    en: 'Territory of Papua', zh: '巴布亞',
    wiki: 'https://en.wikipedia.org/wiki/Territory_of_Papua',
    short: 'Australian territory outright, not a mandate. Japan never took Port Moresby',
    note: 'Australian territory outright, not a mandate. Japan never took Port Moresby: the seaborne attempt turned back at the Coral Sea and the overland push was stopped on the Kokoda Track in September 1942.'
  },
  NewGuineaMandate: {
    en: 'Territory of New Guinea (mandate)', zh: '新幾內亞委任統治地',
    wiki: 'https://en.wikipedia.org/wiki/Territory_of_New_Guinea',
    short: 'The former German colony',
    note: 'The former German colony, held by Australia under a League mandate and administered from Rabaul — which Japan took in January 1942 and made the base for the whole southern campaign.'
  },
  'North China and the Yangtze valley': {
    en: 'North China and the Yangtze valley — the main occupied mass', ja: '日中戦争',
    zh: '華北與長江流域', wiki: 'https://en.wikipedia.org/wiki/Second_Sino-Japanese_War',
    note: 'The main mass: the north China plain and the railway towns on it, taken between July 1937 and the summer of 1938, and then the Yangtze valley up to Wuhan in October 1938 and Yichang in June 1940. On paper it was governed from March 1940 by Wang Jingwei\'s Reorganized National Government at Nanjing, with the north under the North China Political Council and the army behind both. What the shading cannot show is how thin it was: Japanese authority ran along the railways and around the cities, and much of the countryside inside this line was worked by Communist and Nationalist guerrillas, which is what the base-area layer and the army\'s own security map are for.'
  },
  'The Canton delta': {
    en: 'The Guǎngzhōu (Canton) delta and the West River, held from October 1938', ja: '広東攻略戦',
    zh: '廣州三角洲', wiki: 'https://en.wikipedia.org/wiki/Canton_Operation',
    short: 'Taken from Bias Bay in October 1938',
    note: 'Japanese troops landed at Bias Bay on 12 October 1938 and were in Guangzhou nine days later, with almost no fighting: the Nationalist divisions had been drawn north to Wuhan. Taking the delta cut the Guangzhou–Hankou railway and closed the port through which the greater part of China\'s imported arms and fuel had been arriving, which is why it was done in the same weeks as Wuhan. Control reached up the West River and along the rail line, and Hong Kong, forty miles away, was left as the one gap until December 1941.'
  },
  Hainan: {
    en: 'Hǎinán (Hainan), taken February 1939', ja: '海南島 (Kainan-tō)', zh: '海南島',
    wiki: 'https://en.wikipedia.org/wiki/Hainan_Island_Operation',
    short: 'Taken in a fortnight in February 1939',
    note: 'Landings on 10 February 1939 at Haikou and Yulin took the island in a fortnight against a small garrison. It was worth having for three things: a naval and air base commanding the Gulf of Tonkin and the approaches to French Indochina, which mattered a great deal when Japan moved into Indochina in 1940; the iron ore at Shilu, which was mined with conscripted and prisoner labour and shipped to Japan\'s furnaces; and the closing of another stretch of coast. The garrison held it until the surrender, and the island\'s Li and Miao interior was never brought under control.'
  },
  'Amoy and Kinmen': {
    en: 'Xiàmén (Amoy), taken May 1938, and Jīnmén (Kinmen), taken October 1937',
    ja: '厦門 (Amoi)', zh: '廈門・金門', wiki: 'https://en.wikipedia.org/wiki/Amoy_Operation',
    short: 'Kinmen was taken in October 1937 and Xiamen by a naval landing on 10 May 1938',
    note: 'Kinmen was taken in October 1937 and Xiamen by a naval landing on 10 May 1938 — a treaty port since 1842, and the harbour through which the coast\'s remittance and emigrant traffic with South-East Asia ran. The small island of Gulangyu in the harbour was an International Settlement with its own municipal council, and it stayed nominally neutral, and crowded with refugees, until Japan occupied it in December 1941. The point of the operation was blockade rather than ground: Xiamen faces Taiwan across the strait and had been the obvious hole in it.'
  },
  'Swatow and Chaochow': {
    en: 'Shàntóu (Swatow) and Cháozhōu (Chaochow), taken June 1939', ja: '汕頭 (Suatō)',
    zh: '汕頭・潮州', wiki: 'https://en.wikipedia.org/wiki/Swatow_Operation',
    short: 'Shantou was taken on 21 June 1939 and Chaozhou four days later',
    note: 'Shantou was taken on 21 June 1939 and Chaozhou four days later, the last of the southern ports to go. This is the Teochew country of the Han river delta, whose people had emigrated to Siam, Malaya and the Indies for a century and whose remittances came back through this port — and by 1939 so did a good deal of the war material still reaching Free China, which is what the landing was for. With Shantou closed the coast between Shanghai and Hong Kong was shut, and supply had to come overland through Burma or Indochina.'
  },
  Luzon: {
    en: 'Luzon', wiki: 'https://en.wikipedia.org/wiki/Luzon',
    short: 'The main island, with Manila and the rice plain behind it. Invaded in December 1941',
    note: 'The main island, with Manila and the rice plain behind it. Invaded in December 1941, lost with Corregidor in May 1942, and fought over again from January 1945 in the longest campaign of the Pacific war.'
  },
  Mindanao: {
    en: 'Mindanao', wiki: 'https://en.wikipedia.org/wiki/Mindanao',
    short: 'The southern island, with the Japanese abaca colony at Davao',
    note: 'The southern island, with the Japanese abaca colony at Davao, the largest Japanese settlement in Southeast Asia before the war. Taken in 1942 and retaken in 1945.'
  },
  Palawan: {
    en: 'Palawan', wiki: 'https://en.wikipedia.org/wiki/Palawan',
    short: 'The long island reaching towards Borneo',
    note: 'The long island reaching towards Borneo. In December 1944 the garrison at Puerto Princesa burned some 140 American prisoners alive rather than let them be liberated.'
  },
  Mindoro: {
    en: 'Mindoro', wiki: 'https://en.wikipedia.org/wiki/Mindoro',
    short: 'Taken by the Americans in December 1944 for its airfields',
    note: 'Taken by the Americans in December 1944 for its airfields, as the stepping stone from Leyte to Luzon.'
  },
  Panay: {
    en: 'Panay', wiki: 'https://en.wikipedia.org/wiki/Panay',
    short: 'Sugar, and the port of Iloilo',
    note: 'Sugar, and the port of Iloilo. Taken in April 1942 and held afterwards by one of the strongest guerrilla organisations in the islands.'
  },
  Negros: {
    en: 'Negros', wiki: 'https://en.wikipedia.org/wiki/Negros',
    short: 'The sugar island, whose plantations supplied much of the Philippine crop',
    note: 'The sugar island, whose plantations supplied much of the Philippine crop.'
  },
  Cebu: {
    en: 'Cebu', wiki: 'https://en.wikipedia.org/wiki/Cebu',
    short: 'The oldest Spanish settlement in the islands and the busiest port after Manila',
    note: 'The oldest Spanish settlement in the islands and the busiest port after Manila.'
  },
  Bohol: {
    en: 'Bohol', wiki: 'https://en.wikipedia.org/wiki/Bohol',
    short: 'A quiet island of rice and coconut',
    note: 'A quiet island of rice and coconut, taken without much fighting in 1942.'
  },
  Leyte: {
    en: 'Leyte', wiki: 'https://en.wikipedia.org/wiki/Leyte',
    short: 'Where MacArthur came ashore on 20 October 1944',
    note: 'Where MacArthur came ashore on 20 October 1944, and off which the largest naval battle ever fought was decided four days later.'
  },
  Samar: {
    en: 'Samar', wiki: 'https://en.wikipedia.org/wiki/Samar',
    short: 'Off it, escort carriers turned back a battleship force in October 1944',
    note: 'Off its coast on 25 October 1944 a handful of American escort carriers and destroyers turned back a Japanese battleship force, in the action that decided Leyte Gulf.'
  },
  Masbate: {
    en: 'Masbate', wiki: 'https://en.wikipedia.org/wiki/Masbate',
    short: 'Cattle ranches and the gold mines at Aroroy',
    note: 'Cattle ranches and the gold mines at Aroroy, which were among the largest producers in the Philippines before the war.'
  },
  Abra: {
    en: 'Abra (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Abra_(province)',
    short: 'A landlocked basin in the foothills of the Cordillera',
    note: 'A landlocked basin in the foothills of the Cordillera, drained by the Abra river and shut in by mountains on three sides, with Bangued as its town. The valley floor is Ilocano and grows irrigated rice, maize and — since the Spanish tobacco monopoly reached up here — leaf for the Manila factories; the ridges above it are Tinguian country, worked in swidden and terrace. Gold was panned out of the river gravels, and pine and hardwood came off the slopes, but the province had no road worth the name until the American period and stayed one of the poorest and least visited in Luzon. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Agusan: {
    en: 'Agusan (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Agusan_(province)',
    short: 'The valley of the Agusan river',
    note: 'The valley of the Agusan river, running north through eastern Mindanao to the sea at Butuan, with one of the largest freshwater marshes in South-East Asia filling its middle course — thousands of hectares of swamp forest, floating villages and seasonal lake. The province lived on timber, which the American period turned into a serious industry as sawmills went up along the river, and on abaca and coconut planted on the drier ground. Its people were Manobo, Higaonon and Mamanwa in the interior with Cebuano and Boholano settlers along the coast and the road, a pattern the government\'s resettlement schemes deliberately encouraged. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Albay: {
    en: 'Albay (Luzon, with the sub-province of Catanduanes)',
    wiki: 'https://en.wikipedia.org/wiki/Albay',
    short: 'Mayon stands over this province — a volcanic cone of 2,462 m',
    note: 'Mayon stands over this province — a volcanic cone of 2,462 m, as close to symmetrical as any on earth, which erupted in 1897, 1928 and 1938 and buried villages each time. The ash makes exceptionally good soil, and Albay was the centre of the abaca country: Manila hemp, stripped from the stalks of a wild banana relative, was the world\'s rope fibre before synthetics and the Philippines\' second export after sugar. Legazpi was the port that shipped it, Tabaco and Ligao the market towns, and the sub-province of Catanduanes, a typhoon-battered island to the east, was administered from here. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Antique: {
    en: 'Antique (Panay)', wiki: 'https://en.wikipedia.org/wiki/Antique_(province)',
    short: 'The narrow western coast of Panay',
    note: 'The narrow western coast of Panay, a strip of shore between the Central Panay mountains and the Sulu Sea, with no harbour of consequence and the mountains cutting it off from the richer provinces on the other side. Its people farmed rice and maize on the coastal flats and fished from the beach, and the interior was Iraya and Sulod country in the uplands. It was the poorest province on the island and lost people steadily to Iloilo, Negros and Manila; San Jose de Buenavista was the capital and never grew large. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Bataan: {
    en: 'Bataan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Bataan',
    short: 'The mountainous peninsula that closes Manila Bay on the west',
    note: 'The mountainous peninsula that closes Manila Bay on the west, forested from the shore to the summits of Natib and Samat, with a thin fringe of rice land and fishing villages round its edge. Charcoal, timber and fish were what it sold, and Balanga was a market town of a few thousand. In January 1942 the American and Filipino army withdrew into it and held the line across the peninsula for three months on half rations; the surrender on 9 April was the largest in American history, and the march of some sixty to eighty thousand prisoners north to Camp O\'Donnell killed thousands of them on the road. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Batanes: {
    en: 'Batanes', wiki: 'https://en.wikipedia.org/wiki/Batanes',
    short: 'Ten small islands in the strait between Luzon and Taiwan',
    note: 'Ten small islands in the strait between Luzon and Taiwan, in the direct path of the typhoons, which is why the Ivatan build their houses of metre-thick limestone and lime mortar with thatch roofs lashed down and no windows on the weather side. There is almost no flat land: the living was root crops, garlic, cattle grazed on the cliff tops and fishing for flying fish in the season, with Basco on Batan as the only town. It is the northernmost Philippine territory and the closest to Japan, and Japanese troops came ashore there on 8 December 1941 — the first landing of the Philippines campaign, made before the attacks on Luzon. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Batangas: {
    en: 'Batangas (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Batangas',
    short: 'South-western Luzon',
    note: 'South-western Luzon: rolling volcanic uplands and cattle country round the caldera lake of Taal, with the small active cone inside it, and a coastline of deep bays on the Verde Island passage. It grew the coffee that made Lipa briefly one of the richest towns in the islands, until blight destroyed the trees in the 1880s and the ground went over to sugar, maize and cattle. Batangueños have a reputation for being difficult that they earned twice: the province was one of the first to rise in 1896, and General Bell\'s campaign against it in 1901–02, with the population concentrated into zones, was the harshest of the Philippine–American war. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Bukidnon: {
    en: 'Bukidnon (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Bukidnon',
    short: 'A grassland plateau in the interior of northern Mindanao',
    note: 'A grassland plateau six hundred to a thousand metres up in the interior of northern Mindanao, cooler than the coast, with pine on the higher ground and deep canyons cut into it. Its people were Bukidnon, Higaonon and Manobo, herding and farming in the open country, and cattle ranching was the first commercial use the plateau was put to. Then in 1926 the Del Monte corporation planted pineapple at Camp Phillips on land leased from the government — within a decade it was among the largest pineapple plantations in the world, with a cannery down at Bugo on the coast and a railway between them. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Bulacan: {
    en: 'Bulacan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Bulacan',
    short: 'The alluvial plain immediately north of Manila, flat',
    note: 'The alluvial plain immediately north of Manila, flat, densely settled and heavily irrigated, running down to fishponds and mangrove along the bay. It grew rice for the capital and raised milkfish in the ponds, and its towns kept unusually specialised crafts — goldsmiths and jewellers at Meycauayan, fireworks at Bocaue, buntal hats at Baliuag. It has a place in the country\'s political memory out of proportion to its size: Marcelo H. del Pilar and the poet Balagtas came from here, and the congress of the First Philippine Republic met in the church at Malolos in 1898 and wrote a constitution there. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Cagayan: {
    en: 'Cagayan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Cagayan',
    short: 'The lower valley of the Cagayan, the largest river in the Philippines',
    note: 'The lower valley of the Cagayan, the largest river in the Philippines, running north between the Cordillera and the Sierra Madre to a delta at Aparri. The Spanish tobacco monopoly of 1782 forced this valley to grow leaf for the crown, and long after the monopoly ended in 1882 Cagayan and Isabela were still the tobacco provinces, supplying the cigar factories of Manila and an export trade to Spain. Rice and maize filled the rest of the floodplain, hardwood came off the Sierra Madre, and the whole province took the full force of the typhoons that come in from the Pacific every year. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  CamarinesNorte: {
    en: 'Camarines Norte (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Camarines_Norte',
    short: 'The northern shoulder of the Bicol peninsula',
    note: 'The northern shoulder of the Bicol peninsula, hilly and forested with a broken coast on the Pacific side and Daet as its town. Paracale here is one of the oldest gold districts in the country — worked before the Spanish arrived, named for the placer channels dug to get at the gravels, and revived on a large scale in the gold boom of the 1930s when American and Filipino companies sank shafts along the coast. Coconut and abaca covered most of the rest of the province, and the iron deposits at Larap were opened in the same years. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  CamarinesSur: {
    en: 'Camarines Sur (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Camarines_Sur',
    short: 'The waist of the Bicol peninsula',
    note: 'The waist of the Bicol peninsula, with Mount Isarog and Mount Iriga standing over the Bicol river plain and Lake Bato, and coasts on both the Pacific and San Miguel Bay. It is fertile volcanic country: rice on the plain, abaca and coconut on the slopes, and fishing in the bay and the lakes. Naga, which the Spanish called Nueva Cáceres, was one of the few cities they chartered outright and the seat of the bishopric for the whole region, and the Peñafrancia procession down the Bicol river every September is the largest Marian devotion in the country. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Capiz: {
    en: 'Capiz (Panay)', wiki: 'https://en.wikipedia.org/wiki/Capiz',
    short: 'The northern side of Panay',
    note: 'The northern side of Panay, where the Panay river comes down to a broad coastal plain on the Sibuyan Sea — rice ground, with fishponds and a fishing fleet working the shallow gulf. It was a quieter and less commercial province than Iloilo across the mountains, sending its rice and its people there rather than trading on its own account. The translucent windowpane oyster shell used for lanterns and sliding screens all over the archipelago is called capiz after this province, and Manuel Roxas, the Commonwealth\'s last vice-president and the republic\'s first president, was born in the capital. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Cavite: {
    en: 'Cavite (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Cavite',
    short: 'The province on the south shore of Manila Bay',
    note: 'The province on the south shore of Manila Bay, with the sandy hook of Cavite point running out into it and the uplands of Tagaytay behind. The Spanish put their naval yard on that point, and it was there that Dewey destroyed the Spanish squadron on 1 May 1898; the Americans kept it as a naval station and it was bombed to pieces in December 1941. Inland the province was friar estate country — sugar, coffee and rice held by the religious orders and worked by tenants — which is why the revolution of 1896 caught here first and hardest, and why Aguinaldo, a Kawit man, ended up leading it. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Cotabato: {
    en: 'Cotabato (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Cotabato',
    short: 'The largest province in the Philippines: the basin of the Pulangi or Mindanao river',
    note: 'The largest province in the Philippines: the basin of the Pulangi or Mindanao river, a great alluvial plain with marsh and lake in its middle, hemmed by mountains and opening on Illana Bay. This was the country of the Maguindanao sultanate, brought under American administration only after 1900, and from the 1910s the government planted agricultural colonies here — settlers from Luzon and the Visayas given land in the valley — which by the 1930s had begun to change the province\'s population and its politics for good. Rice, maize and abaca were what it grew, with forest over most of the rest of it, and the roads were few enough that the river was still the way in. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Davao: {
    en: 'Davao (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Davao_(province)',
    short: 'The gulf of Davao and the shoulders of Mount Apo',
    note: 'The gulf of Davao and the shoulders of Mount Apo, at 2,954 m the highest mountain in the Philippines, with rainforest, volcanic soil and no dry season worth the name. Abaca made it: Ohta Kyozaburo began planting in 1907, other Japanese companies followed, and by the late 1930s Japanese planters held most of the hemp land and the Japanese community in Davao numbered some twenty thousand — with its own schools, hospital and newspapers, and enough autonomy that Manila newspapers called the place Davaokuo. The province supplied a large part of the world\'s rope fibre, and Japanese forces landed there on 20 December 1941 and were welcomed by part of that community. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  IlocosNorte: {
    en: 'Ilocos Norte (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Ilocos_Norte',
    short: 'A narrow shelf of coast between the Cordillera and the South China Sea',
    note: 'A narrow shelf of coast between the Cordillera and the South China Sea, with more people on it than the land can feed — the reason Ilocanos have been leaving for four hundred years. What it grows it grows intensively: irrigated rice on the terraces, then tobacco, garlic, onions and cotton in the dry season, with fishing off a straight and dangerous coast. From 1906 the province supplied the Hawaiian sugar plantations with contract labour, and later the farms of California, and the remittances that came back paid for much of what was built here. Paoay\'s buttressed church and the Spanish town plan of Laoag are what survives from the earlier centuries. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  IlocosSur: {
    en: 'Ilocos Sur (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Ilocos_Sur',
    short: 'The same coast further south',
    note: 'The same coast further south, with the Abra river breaking through the mountains to the sea, and the same crowded, terraced, water-managed agriculture: rice, tobacco, maize and cotton, with indigo in the Spanish period. Vigan, at the river mouth, grew rich on that trade and is the best-preserved Spanish colonial town in the country, its merchant houses built by Chinese-mestizo families who ran the tobacco and indigo business. The province rose against the tobacco monopoly and the state liquor monopoly more than once — the Basi Revolt of 1807 is commemorated in a series of paintings still in Vigan — and it exported people at the same rate as its northern neighbour. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Iloilo: {
    en: 'Iloilo (Panay)', wiki: 'https://en.wikipedia.org/wiki/Iloilo',
    short: 'The south-eastern quarter of Panay and the richest of the Visayan provinces',
    note: 'The south-eastern quarter of Panay and the richest of the Visayan provinces: broad rice plains, and a port that from the 1850s handled the sugar of Negros across the strait. Iloilo City had the customs house, the consulates, the sugar warehouses and the merchant families, British and Chinese-mestizo, who financed the Negros haciendas, and it called itself the Queen City of the South until Cebu overtook it. Its own older industry was weaving — piña from pineapple fibre and jusi silk, made in Molo and Jaro and worn all over the islands — which machine-made imports had largely destroyed by the 1880s. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Isabela: {
    en: 'Isabela (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Isabela_(province)',
    short: 'The middle Cagayan valley, the second of the tobacco provinces',
    note: 'The middle Cagayan valley, the second of the tobacco provinces, with the Sierra Madre on one side and the Cordillera on the other and a floodplain between them wide enough to make it one of the great grain provinces of Luzon. Tobacco under the monopoly gave way to rice and maize on a large scale, and the forests on both ranges were logged hard once the sawmills and the roads arrived. Its population was assembled rather than native: Ibanag and Gaddang villages, Ilongot and Agta in the mountains, and a steady inflow of Ilocano settlers from over the pass, who by this period were the majority. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Laguna: {
    en: 'Laguna (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Laguna_(province)',
    short: 'The province wrapped round the southern and eastern shores of Laguna de Bay',
    note: 'The province wrapped round the southern and eastern shores of Laguna de Bay, the largest lake in the country, with Mount Makiling and the Sierra Madre behind it. Coconut is what it grew — the copra belt of southern Luzon begins here — with rice on the lake plain, citrus on the slopes and freshwater fishing in the lake itself. Los Baños on Makiling\'s flank held the College of Agriculture of the University of the Philippines from 1909, the country\'s main agricultural research station; Calamba, next door, was a Dominican estate and José Rizal\'s birthplace, and the dispute over that estate was one of the things that made him a revolutionary\'s inspiration. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  LaUnion: {
    en: 'La Union (Luzon)', wiki: 'https://en.wikipedia.org/wiki/La_Union',
    short: 'A short strip of the Ilocos coast, made a province in 1850',
    note: 'A short strip of the Ilocos coast made into a province in 1850 out of pieces of Ilocos Sur and Pangasinan, which is why it is small and why its people are Ilocano and Pangasinan both. The coastal plain grows rice and tobacco, the beaches south of San Fernando make salt in pans and the potters of San Juan and Bacnotan have turned out the big burnay storage jars for centuries. San Fernando is the port and the capital, and the Naguilian road that climbs from here to Baguio was one of the two ways up to the mountain capital. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Lanao: {
    en: 'Lanao (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Lanao_(province)',
    short: 'The plateau of western Mindanao round Lake Lanao, seven hundred metres up, cool',
    note: 'The plateau of western Mindanao round Lake Lanao, seven hundred metres up, cool, and the heartland of the Maranao — the largest of the Muslim peoples of the Philippines and the last to be brought under outside control, which the American army did between 1902 and 1913 at a considerable cost in lives on both sides. The lake plain grows rice and maize, and the province\'s crafts — brass casting, the okir carving on the great torogan houses, malong weaving — were among the most elaborate in the islands. Dansalan, later Marawi, on the northern shore, was the administrative town, and the Agus river falling out of the lake to Iligan was the hydro-electric site the government had its eye on. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Manila: {
    en: 'City of Manila', wiki: 'https://en.wikipedia.org/wiki/Manila',
    short: 'The capital and the reason for everything else',
    note: 'The capital and the reason for everything else: the port through which the country\'s trade passed, the seat of the Insular and then Commonwealth government, the university, the banks and the newspapers, with something over six hundred thousand people by 1939. Intramuros, the walled Spanish city at the mouth of the Pasig, held the churches, the archives and the Ateneo; outside it Daniel Burnham had laid out in 1905 the boulevards, the Luneta and the neoclassical government buildings that gave the twentieth-century city its shape. It was declared an open city on 26 December 1941 and occupied on 2 January 1942; in February 1945 it was fought over street by street and burnt, and something like a hundred thousand civilians died in a month — the worst destruction of any Allied capital except Warsaw. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Marinduque: {
    en: 'Marinduque', wiki: 'https://en.wikipedia.org/wiki/Marinduque',
    short: 'A nearly circular island between the tail of Luzon and Mindoro',
    note: 'A nearly circular island between the tail of Luzon and Mindoro, mountainous in the middle with a fringe of coastal plain, and small enough to be a province of one island and a few islets. Coconut and rice were the ordinary living, with fishing all round the coast, and from the 1930s the Marinduque Iron Mines Corporation worked an open-cut iron deposit at Santa Cruz and shipped the ore to Japan — one of several such contracts that later looked different than they had. The Moriones pageant at Easter, with its carved Roman helmets and masks, was and is the island\'s best-known thing. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  MisamisOccidental: {
    en: 'Misamis Occidental (Mindanao)',
    wiki: 'https://en.wikipedia.org/wiki/Misamis_Occidental',
    short: 'A narrow province on the western shore of the Panguil Bay inlet',
    note: 'A narrow province on the western shore of the Panguil Bay inlet, a strip of coast under a mountain spine with almost no interior at all — you can cross it in an hour. Coconut was the crop, with maize on the slopes and a large inshore fishery in the bay and along the Iligan Bay coast, and Ozamiz and Oroquieta were its towns. Its people were Cebuano and Subanen, and the province was cut off from its eastern namesake in 1929 because the two halves had nothing to do with each other except a name. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  MisamisOriental: {
    en: 'Misamis Oriental (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Misamis_Oriental',
    short: 'The north coast of Mindanao along Macajalar and Gingoog bays',
    note: 'The north coast of Mindanao along Macajalar and Gingoog bays, a shelf of coconut and maize under the escarpment of the Bukidnon plateau. Cagayan de Misamis, later Cagayan de Oro, was the port at the foot of the road up to that plateau, and so the outlet for its cattle, coffee and above all for the pineapple: Del Monte\'s cannery at Bugo took the fruit down from Camp Phillips and shipped the tins from here. Fishing, copra and abaca made up the rest, and the province was one of the first parts of Mindanao settled from the Visayas. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  MountainProvince: {
    en: 'Mountain Province (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Mountain_Province',
    short: 'The whole Cordillera Central as a single province until long after this map\'s dates',
    note: 'The whole Cordillera Central as a single province until long after this map\'s dates, divided into the sub-provinces of Benguet, Bontoc, Ifugao, Kalinga and Apayao — high, folded country of pine and cloud forest, home to peoples the Spanish never subdued and the Americans governed separately as non-Christian tribes. Two things brought outsiders in. Gold: the Benguet lodes at Balatoc, Antamok and Acupan were worked from 1903 on a scale that made the Philippines one of the larger gold producers in the world by the late 1930s. And Baguio: laid out by Burnham from 1904 as the summer capital, reached by the Kennon Road up the Bued gorge, and the place the Insular government moved to every hot season. The rice terraces of Ifugao, cut into the mountainsides over centuries, are the other thing the province is known for. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  NegrosOccidental: {
    en: 'Negros Occidental', wiki: 'https://en.wikipedia.org/wiki/Negros_Occidental',
    short: 'The sugar province',
    note: 'The sugar province. The western plain of Negros was cleared from the 1850s by planters who came over from Iloilo, and by this period it grew the larger part of the Philippine crop — cane cut by sacadas, migrant labourers brought in for the season from Panay and Antique, and milled in a dozen big centrals connected to the fields by their own railways. The American market took that sugar duty-free under quota, which made the province rich, its hacienda families conspicuous and its labour relations bitter. Bacolod was the capital, Kanlaon the volcano behind the plain, and the province spoke Hiligaynon like Iloilo across the strait. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  NegrosOriental: {
    en: 'Negros Oriental', wiki: 'https://en.wikipedia.org/wiki/Negros_Oriental',
    short: 'The eastern side of the island, narrower and steeper',
    note: 'The eastern side of the island, narrower and steeper, where the mountains come down close to the sea and there was never room for sugar on the western scale. Coconut, maize and fishing were what it lived on, with some sugar on the coastal flats round Bais, and the people spoke Cebuano rather than Hiligaynon, looking across to Cebu rather than over the mountains. Dumaguete, its capital, has been a university town since 1901, when American Presbyterians founded Silliman — the first American institution of higher learning in Asia — and the town\'s economy was largely built round it. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  NuevaEcija: {
    en: 'Nueva Ecija (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Nueva_Ecija',
    short: 'The heart of the central Luzon rice bowl: a wide, flat',
    note: 'The heart of the central Luzon rice bowl: a wide, flat, irrigated plain that grew more rice than any other province, mostly on large estates worked by tenants on a half-share. That arrangement, and the debt that went with it, made the province the most agrarian-conflicted in the country — the Sakdalista rising of May 1935 took town halls here, and the Hukbalahap, formed in 1942, had its strongest base in these villages. Cabanatuan was the market town and later the site of the largest American prisoner-of-war camp in the islands. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  NuevaVizcaya: {
    en: 'Nueva Vizcaya (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Nueva_Vizcaya',
    short: 'A basin in the upper Cagayan valley, ringed by the Caraballo and Sierra Madre mountains',
    note: 'A basin in the upper Cagayan valley, ringed by the Caraballo and Sierra Madre mountains, with the road from the central plain climbing through the Dalton Pass to reach it — the only practical way into the valley from the south. It grows rice and maize on the flats, citrus and vegetables on the slopes, and lumber came off the mountains once the sawmills arrived. Its people were Isinai, Gaddang, Ifugao and Ilongot, with Ilocano settlers taking up land through the American period; Bayombong was the capital and the province stayed small and hard to reach. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Pampanga: {
    en: 'Pampanga (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Pampanga',
    short: 'The delta country at the head of Manila Bay',
    note: 'The delta country at the head of Manila Bay, half of it swamp and fishpond and the rest some of the most productive rice and sugar land in Luzon, with big centrals at Del Carmen and Pasudeco. Kapampangan society was sharply divided between hacienda families and tenants, and the province was, with Nueva Ecija and Tarlac, the ground the peasant unions and then the Hukbalahap grew out of. Clark Field at Angeles was the United States Army\'s principal air base in the Far East, and its destruction on the ground on 8 December 1941, hours after the warning from Pearl Harbor, cost the defence of the Philippines most of its aircraft. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Pangasinan: {
    en: 'Pangasinan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Pangasinan',
    short: 'The plain behind the Lingayen Gulf, whose name means the place where salt is made',
    note: 'The plain behind the Lingayen Gulf, whose name means the place where salt is made — the coastal flats have produced salt and bagoong fish paste for centuries, alongside rice on the plain, fishponds in the delta and the milkfish fry trade. Dagupan was the terminus of the first railway in the islands, opened from Manila in 1892, which made the province the capital\'s granary. The gulf is a natural landing beach and both armies used it: the Japanese Fourteenth Army came ashore there on 22 December 1941 and the American Sixth Army did the same on 9 January 1945. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Rizal: {
    en: 'Rizal (Luzon)', short: 'The ring of towns round Manila to the east and south',
    note: 'The ring of towns round Manila to the east and south — created in 1901 out of parts of the old province of Manila and Morong, and named for José Rizal. It is the Marikina valley and the hills up to the Sierra Madre: rice and vegetables for the capital\'s markets, quarries and the Wawa dam in the Montalban gorge that supplied Manila\'s water, and a shoemaking industry at Marikina that clothed most of the country\'s feet. Antipolo, up in the hills, holds the shrine of the Virgin of Peace and Good Voyage, brought from Mexico on the galleons, and the May pilgrimage to it was one of the great annual movements of people in Luzon. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Romblon: {
    en: 'Romblon', short: 'Islands in mid-archipelago, between Mindoro and Panay',
    note: 'Three main islands and a scatter of smaller ones in the middle of the archipelago between Mindoro and Panay, hilly, with narrow coastal strips and no large town. Coconut, maize and fishing were the ordinary living, and the province\'s one distinctive export was marble: Romblon island is largely crystalline limestone, quarried and cut here since the Spanish period and used for church floors, altars and monuments all over the country. Its position in the middle of the sea lanes made it a place ships passed rather than called at. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Sorsogon: {
    en: 'Sorsogon (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Sorsogon',
    short: 'The southern tip of the Bicol peninsula',
    note: 'The southern tip of the Bicol peninsula, wrapped round a deep sheltered bay with the Bulusan volcano behind it, and the crossing at Matnog to Samar at its end — the link between Luzon and the Visayas for anything travelling by road. It grew abaca and coconut like the rest of Bicol, with rice on the small plains and a substantial fishery in the bay and the San Bernardino strait. The strait is deep and swift, and both navies used it in 1944. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Sulu: {
    en: 'Sulu', wiki: 'https://en.wikipedia.org/wiki/Sulu',
    short: 'The archipelago that runs from Zamboanga to within sight of Borneo',
    note: 'The archipelago that runs from Zamboanga to within sight of Borneo — several hundred islands, and the seat of the Sultanate of Sulu, which had been a power in these seas for centuries and was subdued by the Americans only after long and bloody fighting, at Bud Dajo in 1906 and Bud Bagsak in 1913. The Tausug and Samal lived by the sea: pearling above all, on beds that were among the richest in the world and were worked by divers from Jolo and Siasi, with copra, seaweed and a trade to British North Borneo that no customs service ever controlled. Jolo, the walled town on the main island, was the capital and the market. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Surigao: {
    en: 'Surigao (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Surigao_(province)',
    short: 'The north-eastern corner of Mindanao',
    note: 'The north-eastern corner of Mindanao, a heavily indented coast of bays and small islands facing the Pacific, with forest over most of the interior and a wet climate that has no real dry season. Gold was placer-mined at Placer and the rivers round it, and the hills hold enormous lateritic nickel and iron deposits that were known but scarcely touched in this period; coconut, abaca and timber were what actually paid. The Surigao Strait at its southern end, between Mindanao and Leyte, was where in October 1944 an American battle line crossed the Japanese T in the last engagement between battleships ever fought. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Tarlac: {
    en: 'Tarlac (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Tarlac',
    short: 'A central Luzon province between Pampanga and Pangasinan',
    note: 'A central Luzon province between Pampanga and Pangasinan, half of it the flat rice plain and half the drier ground rising to the Zambales mountains, with large estates and sugar centrals along the railway. Like its neighbours it was tenant country with a long history of peasant organisation, and it was for a few weeks in 1899 the seat of Aguinaldo\'s republic as it retreated northwards. Camp O\'Donnell, on its northern edge, was the prison camp the Bataan march ended at in April 1942, where thousands of Filipino and American prisoners died of disease and neglect in the following months. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Tayabas: {
    en: 'Tayabas (Luzon; renamed Quezon in 1946)', wiki: 'https://en.wikipedia.org/wiki/Quezon',
    short: 'The long province down the eastern side of southern Luzon',
    note: 'The long province down the eastern side of southern Luzon, from Mount Banahaw to the Bondoc peninsula, with the Polillo islands offshore — renamed Quezon in 1946 for the Commonwealth president, who was born at Baler in its northern district. It was the coconut province: copra from Tayabas and Laguna made the Philippines the largest exporter of coconut oil in the world, and the trees ran unbroken for miles along the coast roads. Mount Banahaw, a dormant volcano on its border with Laguna, was and is the centre of a set of folk-religious sects who hold the mountain to be sacred ground. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Zambales: {
    en: 'Zambales (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Zambales',
    short: 'The west coast of Luzon under the Zambales mountains',
    note: 'The west coast of Luzon under the Zambales mountains, a strip of rice land and fishing villages backed by ridges of serpentine rock — which is what made the province matter. The Coto mine at Masinloc, opened in 1935, sat on one of the largest refractory chromite deposits in the world, and Philippine chromite went into the furnace linings of the American steel industry through the war. At the southern end Subic Bay, a deep and sheltered anchorage, held a United States naval station and the town of Olongapo that served it, and the Aeta of the mountains behind were among the oldest inhabitants of the islands. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  Zamboanga: {
    en: 'Zamboanga (Mindanao, with Basilan)',
    wiki: 'https://en.wikipedia.org/wiki/Zamboanga_(province)',
    short: 'The long peninsula reaching south-west from Mindanao towards Borneo',
    note: 'The long peninsula reaching south-west from Mindanao towards Borneo, with the island of Basilan off its tip, mountainous and forested along its spine and planted with coconut round its edges. Zamboanga City, under the Spanish fort of Pilar, was the old military capital of the Moro country and the seat of the American Moro Province, and its people speak Chavacano, a Spanish creole that exists nowhere else in the country. Copra was the province\'s export, Basilan grew rubber on a Goodyear plantation opened in 1928, and the fishing fleets working out of Zamboanga were among the largest in the islands. Provinces are a 1930 approximation, not the revised 1942 occupation period provinces.'
  },
  'Kashmir & Jammu': {
    en: 'Kashmir & Jammu',
    wiki: 'https://en.wikipedia.org/wiki/Jammu_and_Kashmir_(princely_state)',
    short: 'The largest princely state by area — the Jammu plains, the Vale of Kashmir, Ladakh',
    note: 'The largest princely state by area — the Jammu plains, the Vale of Kashmir, Ladakh, Baltistan and the Gilgit country, some 220,000 square kilometres of it, most of it above the tree line. The Dogra dynasty had it because Gulab Singh bought it from the East India Company in 1846 for seven and a half million rupees under the Treaty of Amritsar, which left a Hindu house ruling a large Muslim majority — the arrangement that made the state\'s politics from the 1931 agitation onwards. Its economy was the Vale: rice and saffron on the valley floor, orchards, and the shawl and carpet weaving that had made Kashmir a word in English, with a state silk filature at Srinagar and deodar logs floated down the Jhelum. It also had a summer visitor trade, and the houseboats on the Dal lake exist because the state would not let Europeans own land.'
  },
  Hyderabad: {
    en: 'Hyderabad — the Nizam’s dominions, the largest of the states',
    wiki: 'https://en.wikipedia.org/wiki/Hyderabad_State',
    note: 'The premier state of India: sixteen million people, an area the size of Britain, its own currency, its own railway and a nizam, Osman Ali Khan, whom Time put on its cover as the richest man in the world. The land is the Deccan plateau, black cotton soil and granite outcrops under an uncertain monsoon, and it grew cotton, jowar and groundnut, with the Singareni collieries in the east supplying the whole southern railway system and the Godavari and Krishna crossing it without being much use to it. Persian and then Urdu was the language of government over a population that mostly spoke Telugu, Marathi or Kannada, and Osmania University, founded in 1918, was the first in India to teach in Urdu. Hyderabad city, with the Charminar and Golconda behind it, was the fourth or fifth largest in India.'
  },
  Mysore: {
    en: 'Mysore', wiki: 'https://en.wikipedia.org/wiki/Mysore_State',
    short: 'Held up by the British as the model state, and with reason',
    note: 'Held up by the British as the model state, and with reason: under the Wodeyars and dewans like Sheshadri Iyer and M. Visvesvaraya it built the first large hydro-electric station in India at Shivanasamudra in 1902, the Krishnaraja Sagara dam across the Cauvery, an iron and steel works at Bhadravati and a university at Mysore. What paid for it was the Kolar Gold Fields, then among the deepest mines in the world and for decades the source of most of India\'s gold — the reason the hydro station was built in the first place. The state is high plateau, dry in the east where millet and groundnut grow, wet on the Ghats in the west where coffee, cardamom and sandalwood do; Bangalore, its second city, had the cantonment, the Indian Institute of Science and the beginnings of an aircraft industry.'
  },
  'Travancore & Cochin': {
    en: 'Travancore & Cochin', short: 'The two states of the Malabar coast',
    note: 'The two states of the Malabar coast, wedged between the Western Ghats and the Arabian Sea: a strip of lagoon, backwater and coconut palm, rising through rubber and tea estates on the High Range to the Cardamom Hills. They produced what the coast has always produced — pepper, cardamom, ginger and coconut — with coir spun and woven at Alleppey, cashew shelled at Quilon by a very large female workforce, and tea and rubber on the hills above. Travancore had the highest literacy of any Indian territory, a consequence of a state school system begun in the 1810s and of the Syrian Christian and mission schools, and in 1936 its maharaja issued the Temple Entry Proclamation opening state temples to Ezhavas and Pulayas, which no British province had managed. Cochin\'s harbour was cut through the sand bar between 1928 and 1936 and gave the coast its first deep-water port.'
  },
  'Rajputana, Central India & the Gujarat States': {
    en: 'Rajputana, Central India and the Gujarat states',
    short: 'Three agencies covering the largest concentration of states in India',
    note: 'Three agencies covering the largest concentration of states in India: Rajputana alone had twenty-odd, from Jodhpur and Jaipur and Udaipur down to holdings of a few villages, and the Western India and Gujarat States Agency counted its members in the hundreds. The country runs from the Thar desert, where the living was millet, camels and cattle and the towns lived on the caravan trade until the railways killed it, across the Aravallis to the Malwa plateau, which grew the opium that had gone to China and was being wound down under the international agreements, and on to the cotton black soil of Kathiawar and Gujarat. Sambhar lake produced salt on a large scale, Jaipur and Jodhpur had planned capitals and model administrations, and the whole region was chronically short of water: the famines of 1899–1900 and 1918 fell on it harder than on British India.'
  },
  'The Baluchistan States — Kalat, Las Bela, Kharan, Makran': {
    en: 'The Baluchistan states — Kalat, Las Bela, Kharan and Makran',
    note: 'The Khan of Kalat\'s confederacy and its three feudatories, covering an enormous area of mountain and desert with almost nobody in it. Rainfall is a few centimetres a year over most of it, so the economy was sheep, goats and camels moved between summer and winter grazing, dates in the Kech valley and Panjgur — Makran\'s dates were its one export — and pockets of irrigated wheat where a karez tunnel could be dug. The British interest was strategic rather than economic: the Bolan Pass and the Quetta garrison guarded the approach from Afghanistan and Persia, and the state ceded the districts round them for the railway. Gwadar, on the Makran coast, was not Baluchi at all but an enclave of the Sultan of Muscat and Oman, and stayed so until 1958.'
  },
  'The Eastern States — Orissa and Chhattisgarh': {
    en: 'The Eastern States — the Orissa and Chhattisgarh states',
    note: 'Twenty-six states along the hill and forest belt behind the Orissa coast and into the Chhattisgarh uplands, administered together as the Eastern States Agency from 1933. The country is sal and teak forest over broken hills, with a very large Adivasi population — Munda, Ho, Santal, Gond and Kondh — cultivating in clearings and taking a living out of the forest in lac, tussar silk, mahua and timber. Its importance to the industrial economy was ore: the Mayurbhanj hills held the iron that Tata\'s works at Jamshedpur were built to smelt, and manganese came out of Keonjhar and Bonai. The states were small, poor and autocratic, and the prajamandal movements of the late 1930s against their rulers were among the sharpest political conflicts anywhere in princely India.'
  },
  'The Punjab States — Patiala, Jind, Nabha, Kapurthala': {
    en: 'The Punjab states — Patiala, Jind, Nabha and Kapurthala',
    note: 'The Phulkian states of the Punjab plain, Sikh dynasties that had made their peace with the Company early and kept substantial territories for it. This is canal-irrigated wheat and cotton country, some of the most productive farmland in India after the Chenab and Sutlej colonies were cut, with sugar mills and grain markets at Patiala and Ludhiana; the states were also among the heaviest recruiting grounds for the Indian Army, and each maintained Imperial Service Troops of its own that served overseas in both wars. Patiala was much the largest and its maharaja, Bhupinder Singh, chancellor of the Chamber of Princes, was the most conspicuous Indian ruler of the 1920s. Kapurthala\'s ruler built himself a palace modelled on Versailles and conducted his court in French.'
  },
  'Chitral, Dir, Swat & Amb': {
    en: 'Chitral, Dir, Swat and Amb — the frontier states',
    note: 'The mountain states north of Peshawar, in the valleys of the Hindu Kush, held under the Malakand and Dir–Swat–Chitral Agencies because the road to Chitral had to be kept open — the siege and relief of Chitral in 1895 is why the British were there at all. The valleys are irrigated from snowmelt and grow rice, maize, wheat and fruit, with pine forest above them and grazing on the high pastures, and almost nothing else: the country is Pashtun and Kho, tribal, and had been without any central government to speak of. Swat was the exception — Miangul Abdul Wadud, recognised as Wali in 1926, put a state together out of the Yusufzai country and built roads, schools, hospitals and a telephone system in a generation, and his son continued it.'
  },
  'Kolhapur & the Deccan States': {
    en: 'Kolhapur and the Deccan states',
    short: 'Kolhapur was the senior Maratha state, its ruler a Chhatrapati descended from Shivaji',
    note: 'Kolhapur was the senior Maratha state, its ruler a Chhatrapati descended from Shivaji, and its country the black cotton soil of the upper Krishna with the Ghats behind it: jowar, cotton, groundnut and, where the new canals reached, sugarcane. Shahu Chhatrapati, who ruled from 1894 to 1922, reserved half the posts in his administration for non-Brahmins in 1902 — the first reservation of its kind anywhere in India — and built hostels, schools and a dam; his state also became the first centre of Marathi cinema, with Baburao Painter\'s studio and then Prabhat Film Company working here from the 1920s. Around it the Deccan States Agency held some seventeen smaller states of the same kind, scattered through the Bombay Presidency.'
  },
  'The Khasi Hill States': {
    en: 'The Khasi Hill states',
    short: 'Some twenty-five small states in the Khasi and Jaintia hills of Assam',
    note: 'Some twenty-five small states in the Khasi and Jaintia hills of Assam, each under a syiem or other chief, which had never been annexed and were held by engagements rather than by conquest. The hills catch the full force of the Bengal monsoon as it comes off the plain, and Cherrapunji and Mawsynram record the heaviest rainfall on earth — upwards of eleven metres a year — which is why the country is deep gorge, orchid and the living root bridges the Khasis grow across the streams. Khasi society is matrilineal, with property and clan name passing through the youngest daughter, and the economy was potatoes, oranges, bay leaf, lime and a little coal and iron. Shillong, the summer capital of Assam, sat on ground acquired from these states, so a British hill station and its government stood in the middle of them.'
  },
  Bastar: {
    en: 'Bastar', wiki: 'https://en.wikipedia.org/wiki/Bastar_State',
    short: 'One of the largest states in India by area and one of the emptiest',
    note: 'One of the largest states in India by area and one of the emptiest: some 34,000 square kilometres of the Chhattisgarh plateau, almost all of it sal and teak forest, with the Indravati falling over the Chitrakote falls in the middle of it. The great majority of its people were Adivasi — Gond, Maria, Muria, Halba — and its economy was shifting cultivation, forest produce and cattle, with the state\'s revenue coming largely from timber. That was the trouble: the reservation of the forests and the restrictions that came with it provoked the Bhumkal rising of 1910, which the state and the Central Provinces police put down with some severity. The Bailadila hills in the south hold one of the richest iron ore bodies in Asia, unworked in this period.'
  },
  Manipur: {
    en: 'Manipur', wiki: 'https://en.wikipedia.org/wiki/Manipur',
    short: 'A flat oval valley about forty kilometres across, ringed on every side by hills',
    note: 'A flat oval valley about forty kilometres across, ringed on every side by hills: the Meiteis in the valley, growing wet rice and weaving — a loom in almost every house — and Naga and Kuki peoples in the hills around them under a quite separate administration. Britain fought the state in 1891, hanged its senapati, and left it under a Political Agent with the raja in place. Loktak, the great floating-weed lake in the south of the valley, gave fish and reed; polo was played here before anywhere else and was taken from Manipur to Calcutta and thence to the world. The state sat on the Burma road, which is why in 1944 the Japanese army\'s advance into India stopped at Imphal and Kohima.'
  },
  Tripura: {
    en: 'Tripura (Hill Tippera)', wiki: 'https://en.wikipedia.org/wiki/Tripura',
    short: 'A hill state on the Bengal frontier under the Manikya dynasty',
    note: 'A hill state on the Bengal frontier under the Manikya dynasty, one of the oldest ruling houses in India, with a rulership that had long looked two ways — to the hills whose Tripuri, Reang and Jamatia people practised jhum cultivation, and to the Bengali plains from which its revenue, its administration and increasingly its population came. The country is low forested ridges running north to south, with narrow valleys between; rice, jhum crops and forest produce were the staples, and tea gardens were opened from the 1910s along the same lines as in Assam. Agartala, on the plains edge, was the capital, and the court\'s connection with Rabindranath Tagore — who visited repeatedly and whose Bengali the state patronised — is the thing outsiders knew about it.'
  },
  'Cooch Behar': {
    en: 'Cooch Behar', wiki: 'https://en.wikipedia.org/wiki/Cooch_Behar_State',
    short: 'A small, flat and unusually fertile state in northern Bengal',
    note: 'A small, flat and unusually fertile state in northern Bengal, on the alluvium between the Himalayan foothills and the Brahmaputra plain, watered by the Torsa and the Tista and given to jute, rice, tobacco and mustard. It was one of the most Anglicised courts in India: Nripendra Narayan, who ruled from 1863 to 1911, was educated in England, married Suniti Devi, daughter of the Brahmo leader Keshub Chandra Sen, and laid out a capital of straight roads round the Victor Jubilee Palace. The state\'s revenue was good for its size, its administration was run on British provincial lines, and its rulers were as well known in London as in Calcutta.'
  },
  Khairpur: {
    en: 'Khairpur', wiki: 'https://en.wikipedia.org/wiki/Khairpur_(princely_state)',
    short: 'A Talpur state on the left bank of the Indus in upper Sind',
    note: 'A Talpur state on the left bank of the Indus in upper Sind, running from the riverine belt eastwards into the sandhills of the Nara and the Thar. Before 1932 it depended on inundation canals that ran only when the river rose; the Sukkur Barrage, opened that year, brought perennial irrigation to the western part of the state and turned it into wheat, cotton and rice ground. Its own speciality is dates — the groves round Khairpur town are among the largest in the subcontinent — and the desert half of the state remained grazing for camels and sheep. It was the only state of any size in Sind and was administered directly with the Governor-General\'s agent after Sind was separated from Bombay in 1936.'
  },
  'Tehri Garhwal': {
    en: 'Tehri Garhwal', wiki: 'https://en.wikipedia.org/wiki/Tehri_Garhwal_district',
    short: 'The Garhwal Himalaya: the upper Bhagirathi and Bhilangna valleys',
    note: 'The Garhwal Himalaya: the upper Bhagirathi and Bhilangna valleys, with Gangotri and the source of the Ganges inside the state and Yamunotri on its edge, so that its main visitors were pilgrims. The living was terraced millet, barley and potatoes on steep slopes, transhumant grazing on the high meadows, and above all forest — deodar and chir pine felled on the hills and floated down the rivers to the timber depots of the plains. That trade was the state\'s principal revenue and the reason for its principal grievance: the reservation of forests and the restriction of grazing and lopping rights produced repeated protest, and in 1930 the state\'s troops fired on a gathering of villagers at Tilari and killed a number of them.'
  },
  Rampur: {
    en: 'Rampur', short: 'A small Rohilla state on the Ganges plain of the United Provinces',
    note: 'A small Rohilla state on the Ganges plain of the United Provinces, all of it canal-irrigated alluvium growing sugarcane, wheat and rice, with sugar mills and a good deal of orchard. What made it notable was not its size but its patronage: the Nawabs collected manuscripts on a scale that made the Raza Library one of the great repositories of Persian, Arabic, Turkish and Sanskrit texts in Asia, including a Qur\'an attributed to Ali. The court kept musicians as a matter of policy — the Rampur–Sahaswan gharana of khyal singing came out of it, and so did much of the surviving tradition of the been — and Urdu poets went there when Delhi and Lucknow could no longer pay.'
  },
  Benares: {
    en: 'Benares (Banaras) — Ramnagar, Bhadohi and Chakia',
    wiki: 'https://en.wikipedia.org/wiki/Benares_State',
    note: 'Made a state only in 1911, out of the family domains of the Maharaja of Benares, who had held them under British suzerainty since 1794 without the rank; the city of Banaras itself stayed British territory, and the state\'s seat was across the river at Ramnagar. The country is Ganges plain — sugarcane, rice, wheat and mango groves — and the state\'s income came from land revenue rather than from anything the city did. Its ruler\'s public role was ceremonial and religious: he was the patron of the Ramnagar Ramlila, the month-long cycle staged across the town every autumn, which is still the most elaborate performance of the Ramayana anywhere.'
  },
  Pudukkottai: {
    en: 'Pudukkottai', wiki: 'https://en.wikipedia.org/wiki/Pudukkottai_State',
    short: 'The only princely state in the Tamil country',
    note: 'The only princely state in the Tamil country, held by the Tondaiman family since the seventeenth century and surrounded on every side by the Madras Presidency. It is dry, thin-soiled and stony, without a perennial river, so its agriculture depended on rain-fed tanks and on the millets, pulses and groundnut that will grow with little water, and it was one of the poorer states of the south. Its rulers ran it as an administrative experiment with a succession of able dewans, building schools and a hospital out of a small revenue; it also sent out labourers and clerks in numbers, to Madras, to Ceylon and to Malaya.'
  },
  'The Punjab Hill States — Bashahr, Mandi, Suket, Sirmur': {
    en: 'The Punjab Hill states — Bashahr, Mandi, Suket and Sirmur',
    note: 'The Simla Hill States, thirty-odd of them in the ranges between the Sutlej and the Yamuna, mostly very small. The country is terraced fields on steep valley sides, deodar and pine forest above them, and alpine grazing above that; the living was maize, wheat, potatoes and apples, with the forests leased to contractors and floated down to the plains. Bashahr was the largest and reached to the Tibetan border, so the Hindustan–Tibet road and the wool and borax trade over the Shipki pass ran through it, and Mandi had rock salt at Drang and Guma — one of the few sources in northern India, and a state monopoly. Simla, the summer capital of the Government of India, stood on ground taken from these states, so the empire was governed for half of every year from among them.'
  },
  'Savanur, Sandur & Banganapalle': {
    en: 'Savanur, Sandur and Banganapalle', short: 'Three very small states in the south',
    note: 'Three very small states in the south, each of a few hundred square kilometres and each entirely enclosed by British districts. Sandur, in the Bellary hills, is the one that mattered: the ridges inside it hold high-grade iron ore and manganese, and the manganese was being mined for export by the 1930s, which gave a state of some twenty thousand people a revenue out of all proportion to its size. Banganapalle, in the Kurnool country, was a Muslim ruled state of dry black soil and jowar whose lasting contribution is the mango that carries its name. Savanur, in the Dharwad country, was a Nawab\'s estate of cotton and millet on the black soil, older than either and by this time the least significant.'
  },
  'Waziristan & the frontier tribal agencies': {
    en: 'Waziristan and the frontier tribal agencies — political agents, not the Punjab',
    note: 'Not states at all: the tribal territory beyond the administered districts of the North-West Frontier Province — Khyber, Kurram, North and South Waziristan and the Malakand — where no Indian law ran and the Political Agents dealt with maliks and jirgas under the Frontier Crimes Regulation. It is bare mountain and narrow valley, too dry and too broken to feed the people on it, so the Wazir and Mahsud economy was flocks, a little irrigated grain, the transit trade with Afghanistan, and what could be got from service in the militias and scouts or from raiding across the border. The British kept roads, forts and scouts in it rather than government, and the campaign against the Faqir of Ipi from 1936 tied down some forty thousand troops for years without settling anything. It is drawn here because on the map it is neither British India nor Afghanistan.'
  },
  'Okinawa Island': {
    en: 'Okinawa Hontō', ja: '沖縄本島 (Okinawa Hontō)', zh: '沖繩本島', ko: '오키나와섬',
    wiki: 'https://en.wikipedia.org/wiki/Okinawa_Island',
    short: 'Naha and the castle at Shuri, and a third of the prefecture\'s people',
    note: 'Naha and the castle at Shuri, and a third of the prefecture\'s people. The American landing on 1 April 1945 opened a battle of eighty-two days that killed roughly a quarter of the civilian population, destroyed Shuri, and left the island an American base for the next twenty-seven years.'
  },
  Yakushima: {
    en: 'Yakushima', ja: '屋久島 (Yakushima)', zh: '屋久島', ko: '야쿠섬',
    wiki: 'https://en.wikipedia.org/wiki/Yakushima',
    short: 'Kagoshima, not Okinawa: the cedar forests here were logged for the navy',
    note: 'Kagoshima, not Okinawa: the cedar forests here were logged for the navy, and some of the trees standing are thousands of years old.'
  },
  Kuchinoerabujima: {
    en: 'Kuchinoerabujima', ja: '口永良部島 (Kuchinoerabujima)', zh: '口永良部島', ko: '구치노에라부섬',
    wiki: 'https://en.wikipedia.org/wiki/Kuchinoerabu-jima',
    short: 'Kagoshima. An active volcano with a few hundred people on it',
    note: 'Kagoshima. An active volcano with a few hundred people on it.'
  },
  Kuchinoshima: {
    en: 'Kuchinoshima', ja: '口之島 (Kuchinoshima)', zh: '口之島',
    wiki: 'https://en.wikipedia.org/wiki/Kuchinoshima',
    short: 'The northernmost of the Tokara islands and Kagoshima\'s',
    note: 'The northernmost of the Tokara islands and Kagoshima\'s, at the top of the chain where the Kuroshio runs hardest.'
  },
  Nakanoshima: {
    en: 'Nakanoshima', ja: '中之島 (Nakanoshima)', zh: '中之島',
    wiki: 'https://en.wikipedia.org/wiki/Tokara_Islands',
    short: 'The highest of the Tokara islands, Kagoshima\'s',
    note: 'The highest of the Tokara islands, Kagoshima\'s, with a volcano that has smoked through most of recorded history.'
  },
  Tairajima: {
    en: 'Tairajima', ja: '平島 (Tairajima)', zh: '平島',
    wiki: 'https://en.wikipedia.org/wiki/Tairajima',
    short: 'One of the smaller Tokara islands, Kagoshima\'s',
    note: 'One of the smaller Tokara islands, Kagoshima\'s, with a few dozen people on it.'
  },
  Suwanosejima: {
    en: 'Suwanosejima', ja: '諏訪之瀬島 (Suwanosejima)', zh: '諏訪之瀨島', ko: '스와노세섬',
    wiki: 'https://en.wikipedia.org/wiki/Suwanosejima', short: 'Tokara, and Kagoshima\'s',
    note: 'Tokara, and Kagoshima\'s. Its volcano drove the islanders off for seventy years in the nineteenth century.'
  },
  Akusekijima: {
    en: 'Akusekijima', ja: '悪石島 (Akusekijima)', zh: '惡石島',
    wiki: 'https://en.wikipedia.org/wiki/Akusekijima', short: 'A Tokara island of Kagoshima',
    note: 'A Tokara island of Kagoshima, remote enough that it kept its own dialect and its own festivals.'
  },
  Kikaijima: {
    en: 'Kikaijima', ja: '喜界島 (Kikaijima)', zh: '喜界島', ko: '기카이섬',
    wiki: 'https://en.wikipedia.org/wiki/Kikaijima', short: 'Amami, and Kagoshima\'s',
    note: 'Amami, and Kagoshima\'s. Its airfield was a staging point for the kamikaze sorties flown against the fleet off Okinawa in 1945.'
  },
  'Amami Ōshima': {
    en: 'Amami Ōshima', ja: '奄美大島 (Amami Ōshima)', zh: '奄美大島', ko: '아마미오시마',
    wiki: 'https://en.wikipedia.org/wiki/Amami_%C5%8Cshima',
    short: 'The largest of the Amami group',
    note: 'The largest of the Amami group, taken from the Ryūkyū kingdom by Satsuma in 1609 and administered from Kagoshima as Ōshima-gun ever since — not Okinawa Prefecture. The United States held it separately until 1953.'
  },
  Tokunoshima: {
    en: 'Tokunoshima', ja: '徳之島 (Tokunoshima)', zh: '德之島', ko: '도쿠노섬',
    wiki: 'https://en.wikipedia.org/wiki/Tokunoshima', short: 'Amami, and Kagoshima\'s',
    note: 'Amami, and Kagoshima\'s. Its three airfields were bombed hard in the spring of 1945.'
  },
  Okinoerabujima: {
    en: 'Okinoerabujima', ja: '沖永良部島 (Okinoerabujima)', zh: '沖永良部島', ko: '오키노에라부섬',
    wiki: 'https://en.wikipedia.org/wiki/Okinoerabujima', short: 'Sugar and Easter lilies',
    note: 'Sugar and Easter lilies — the bulbs were exported to America until the war closed the trade. Kagoshima\'s, not Okinawa\'s.'
  },
  Yoronjima: {
    en: 'Yoronjima', ja: '与論島 (Yoronjima)', zh: '與論島', ko: '요론섬',
    wiki: 'https://en.wikipedia.org/wiki/Yoronjima',
    short: 'The southernmost of the Amami group and of Kagoshima',
    note: 'The southernmost of the Amami group and of Kagoshima, twenty kilometres from Okinawa.'
  },
  Iheyajima: {
    en: 'Iheyajima', ja: '伊平屋島 (Iheyajima)', zh: '伊平屋島', ko: '이헤야섬',
    wiki: 'https://en.wikipedia.org/wiki/Iheya_Island',
    short: 'Okinawa Prefecture, north-west of the main island',
    note: 'Okinawa Prefecture, north-west of the main island, and never fought over.'
  },
  Izenajima: {
    en: 'Izenajima', ja: '伊是名島 (Izenajima)', zh: '伊是名島', ko: '이제나섬',
    wiki: 'https://en.wikipedia.org/wiki/Izena_Island', short: 'Okinawa Prefecture',
    note: 'Okinawa Prefecture. The Shō dynasty of the Ryūkyū kings came from here.'
  },
  Iejima: {
    en: 'Iejima', ja: '伊江島 (Iejima)', zh: '伊江島', ko: '이에섬',
    wiki: 'https://en.wikipedia.org/wiki/Iejima',
    short: 'Taken between 16 and 21 April 1945 for its airfield',
    note: 'Taken between 16 and 21 April 1945 for its airfield. The war correspondent Ernie Pyle was killed on it.'
  },
  'the Kerama Islands': {
    en: 'The Kerama Islands — taken first, 26 March 1945', ja: '慶良間諸島 (Kerama Shotō)',
    zh: '慶良間群島'
  },
  Kumejima: {
    en: 'Kumejima', ja: '久米島 (Kumejima)', zh: '久米島', ko: '구메지마정',
    wiki: 'https://en.wikipedia.org/wiki/Kumejima,_Okinawa',
    short: 'Okinawa Prefecture. Taken in June 1945',
    note: 'Okinawa Prefecture. Taken in June 1945; the garrison murdered twenty islanders it accused of collaborating.'
  },
  Miyakojima: {
    en: 'Miyakojima', ja: '宮古島 (Miyakojima)', zh: '宮古島', ko: '미야코섬',
    wiki: 'https://en.wikipedia.org/wiki/Miyako_Island',
    short: 'Garrisoned by some thirty thousand men, bombed and blockaded, and never assaulted',
    note: 'Garrisoned by some thirty thousand men, bombed and blockaded, and never assaulted — the troops and the islanders were both close to starving by the surrender.'
  },
  Taramajima: {
    en: 'Taramajima', ja: '多良間島 (Taramajima)', zh: '多良間島',
    short: 'A flat coral island between Miyako and Ishigaki',
    note: 'A flat coral island between Miyako and Ishigaki, bypassed with them and blockaded to the surrender.'
  },
  Ishigakijima: {
    en: 'Ishigakijima', ja: '石垣島 (Ishigakijima)', zh: '石垣島', ko: '이시가키섬',
    wiki: 'https://en.wikipedia.org/wiki/Ishigaki_Island',
    short: 'The seat of the Yaeyama islands, bypassed and bombed',
    note: 'The seat of the Yaeyama islands, bypassed and bombed. Three captured American airmen were executed here in 1945, and the officers responsible were tried for it.'
  },
  Iriomotejima: {
    en: 'Iriomotejima', ja: '西表島 (Iriomotejima)', zh: '西表島', ko: '이리오모테섬',
    wiki: 'https://en.wikipedia.org/wiki/Iriomote_Island', short: 'Jungle and malaria',
    note: 'Jungle and malaria, and the island the people of Hateruma were forced to evacuate to in 1945.'
  },
  Haterumajima: {
    en: 'Haterumajima — the southernmost inhabited island of Japan proper',
    ja: '波照間島 (Haterumajima)', zh: '波照間島',
    note: 'The southernmost inhabited island of Japan proper. Its people were driven to Iriomote in 1945 by an army order and a third of them died of malaria there.'
  },
  Yonagunijima: {
    en: 'Yonagunijima — 110 km from Taiwan', ja: '与那国島 (Yonagunijima)', zh: '與那國島',
    note: 'The westernmost point of Japan, in sight of Taiwan on a clear day, and a smuggling route to it after the war.'
  },
  'the Daitō Islands': {
    en: 'The Daitō Islands', ja: '大東諸島 (Daitō Shotō)', zh: '大東群島',
    short: 'Uninhabited until 1900',
    note: 'Uninhabited until 1900, then settled from Hachijōjima and worked for sugar by a single company that owned the whole of them.'
  },
  'the Senkaku / Diaoyu Islands': {
    en: 'The Senkaku / Diaoyu Islands — administered from Okinawa', ja: '尖閣諸島 (Senkaku Shotō)',
    zh: '釣魚臺列嶼',
    note: 'Five islets and three rocks off the north-east of Taiwan, incorporated into Okinawa Prefecture in 1895. A settlement on Uotsurijima worked albatross feathers and dried bonito until the 1940s. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  'Uotsuri Shima': {
    en: 'Uotsurijima — the largest of the Senkaku / Diaoyu Islands', ja: '魚釣島 (Uotsurijima)',
    zh: '釣魚島', wiki: 'https://en.wikipedia.org/wiki/Senkaku_Islands',
    note: 'The largest of the group, and the only one anybody has lived on: Koga Tatsushirō\'s plant employed a couple of hundred people here before the First World War. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  'Kuba-shima': {
    en: 'Kubajima — in the Senkaku / Diaoyu Islands', ja: '久場島 (Kubajima)', zh: '黃尾嶼',
    wiki: 'https://en.wikipedia.org/wiki/Senkaku_Islands',
    note: 'A bare volcanic islet north-east of Uotsurijima, used as a bombing range by the United States after the war and never resettled. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  'Kuba Island': {
    en: 'Kubajima — in the Senkaku / Diaoyu Islands', ja: '久場島 (Kubajima)', zh: '黃尾嶼',
    wiki: 'https://en.wikipedia.org/wiki/Senkaku_Islands',
    note: 'A bare volcanic islet north-east of Uotsurijima, used as a bombing range by the United States after the war and never resettled. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  AngThong: {
    en: 'Ang Thong', wiki: 'https://en.wikipedia.org/wiki/Ang_Thong',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  BuriRam: {
    en: 'Buriram', wiki: 'https://en.wikipedia.org/wiki/Buriram',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Chachoengsao: {
    en: 'Chachoengsao (Paet Riu)', wiki: 'https://en.wikipedia.org/wiki/Chachoengsao',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  ChaiNat: {
    en: 'Chainat', wiki: 'https://en.wikipedia.org/wiki/Chai_Nat',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Chaiyaphum: {
    en: 'Chaiyaphum', wiki: 'https://en.wikipedia.org/wiki/Chaiyaphum',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Chanthaburi: {
    en: 'Chanthaburi (Chantaboon)', wiki: 'https://en.wikipedia.org/wiki/Chanthaburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  ChiangMai: {
    en: 'Chiengmai (Chiang Mai)', wiki: 'https://en.wikipedia.org/wiki/Chiang_Mai',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  ChiangRai: {
    en: 'Chiengrai (Chiang Rai)', wiki: 'https://en.wikipedia.org/wiki/Chiang_Rai',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  ChonBuri: {
    en: 'Chonburi', wiki: 'https://en.wikipedia.org/wiki/Chonburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Chumphon: {
    en: 'Chumphon', wiki: 'https://en.wikipedia.org/wiki/Chumphon',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  KamphaengPhet: {
    en: 'Kamphaeng Phet', wiki: 'https://en.wikipedia.org/wiki/Kamphaeng_Phet',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Kanchanaburi: {
    en: 'Kanchanaburi (Kanburi)', wiki: 'https://en.wikipedia.org/wiki/Kanchanaburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  KhonKaen: {
    en: 'Khon Kaen', wiki: 'https://en.wikipedia.org/wiki/Khon_Kaen',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Krabi: {
    en: 'Krabi', wiki: 'https://en.wikipedia.org/wiki/Krabi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Lampang: {
    en: 'Nakhon Lampang', wiki: 'https://en.wikipedia.org/wiki/Lampang',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Lamphun: {
    en: 'Lamphun', wiki: 'https://en.wikipedia.org/wiki/Lamphun',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Loei: {
    en: 'Loei', wiki: 'https://en.wikipedia.org/wiki/Loei',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Lopburi: {
    en: 'Lopburi', wiki: 'https://en.wikipedia.org/wiki/Lopburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  MaeHongSon: {
    en: 'Mae Hong Son', wiki: 'https://en.wikipedia.org/wiki/Mae_Hong_Son',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  MahaSarakham: {
    en: 'Maha Sarakham — Kalasin was abolished into it in 1932',
    wiki: 'https://en.wikipedia.org/wiki/Maha_Sarakham',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NakhonNayok: {
    en: 'Nakhon Nayok', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Nayok',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NakhonPathom: {
    en: 'Nakhon Pathom', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Pathom',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NakhonPhanom: {
    en: 'Nakhon Phanom', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Phanom',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NakhonRatchasima: {
    en: 'Nakhon Ratchasima (Korat)', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Ratchasima',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NakhonSawan: {
    en: 'Nakhon Sawan (Paknampho)', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Sawan',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NakhonSiThammarat: {
    en: 'Nakhon Si Thammarat (Ligor)',
    wiki: 'https://en.wikipedia.org/wiki/Nakhon_Si_Thammarat',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Nan: {
    en: 'Nan', wiki: 'https://en.wikipedia.org/wiki/Nan_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Narathiwat: {
    en: 'Narathiwat', wiki: 'https://en.wikipedia.org/wiki/Narathiwat',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  NongKhai: {
    en: 'Nong Khai', wiki: 'https://en.wikipedia.org/wiki/Nong_Khai',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Nonthaburi: {
    en: 'Nonthaburi', wiki: 'https://en.wikipedia.org/wiki/Nonthaburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  PathumThani: {
    en: 'Pathum Thani', wiki: 'https://en.wikipedia.org/wiki/Pathum_Thani',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Pattani: {
    en: 'Patani',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phangnga: {
    en: 'Phangnga', wiki: 'https://en.wikipedia.org/wiki/Phang_Nga',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phatthalung: {
    en: 'Phatthalung', wiki: 'https://en.wikipedia.org/wiki/Phatthalung',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phetchabun: {
    en: 'Phetchabun', wiki: 'https://en.wikipedia.org/wiki/Phetchabun',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phetchaburi: {
    en: 'Petchaburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phichit: {
    en: 'Phichit', wiki: 'https://en.wikipedia.org/wiki/Phichit',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phitsanulok: {
    en: 'Phitsanulok', wiki: 'https://en.wikipedia.org/wiki/Phitsanulok',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  PhraNakhon: {
    en: 'Phra Nakhon (Bangkok, left bank)', wiki: 'https://en.wikipedia.org/wiki/Phra_Nakhon',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  PhraNakhonSiAyutthaya: {
    en: 'Ayudhya (Ayutthaya)',
    wiki: 'https://en.wikipedia.org/wiki/Phra_Nakhon_Si_Ayutthaya_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phrae: {
    en: 'Phrae', wiki: 'https://en.wikipedia.org/wiki/Phrae',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Phuket: {
    en: 'Puket (Phuket)', wiki: 'https://en.wikipedia.org/wiki/Phuket_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  PrachinBuri: {
    en: 'Prachinburi', wiki: 'https://en.wikipedia.org/wiki/Prachinburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  PrachuapKhiriKhan: {
    en: 'Prachuap Khiri Khan', wiki: 'https://en.wikipedia.org/wiki/Prachuap_Khiri_Khan',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Ranong: {
    en: 'Ranong',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Ratchaburi: {
    en: 'Rajburi (Ratchaburi)',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Rayong: {
    en: 'Rayong',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  RoiEt: {
    en: 'Roi Et',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SakonNakhon: {
    en: 'Sakon Nakhon', wiki: 'https://en.wikipedia.org/wiki/Sakon_Nakhon',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SamutPrakan: {
    en: 'Samut Prakan (Paknam)', wiki: 'https://en.wikipedia.org/wiki/Samut_Prakan',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SamutSakhon: {
    en: 'Samut Sakhon (Tachin)', wiki: 'https://en.wikipedia.org/wiki/Samut_Sakhon',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SamutSongkhram: {
    en: 'Samut Songkhram (Meklong)', wiki: 'https://en.wikipedia.org/wiki/Samut_Songkhram',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Saraburi: {
    en: 'Saraburi', wiki: 'https://en.wikipedia.org/wiki/Saraburi',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Satun: {
    en: 'Satun (Setul)', wiki: 'https://en.wikipedia.org/wiki/Satun',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SiSaKet: {
    en: 'Khukhan (renamed Sisaket in 1938)',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SingBuri: {
    en: 'Singburi', wiki: 'https://en.wikipedia.org/wiki/Sing_Buri_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Songkhla: {
    en: 'Songkhla (Singora)', wiki: 'https://en.wikipedia.org/wiki/Songkhla',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Sukhothai: {
    en: 'Sawankhalok (Sukhothai)', wiki: 'https://en.wikipedia.org/wiki/Sukhothai_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SuphanBuri: {
    en: 'Suphanburi', wiki: 'https://en.wikipedia.org/wiki/Suphan_Buri',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  SuratThani: {
    en: 'Surat Thani (Bandon)', wiki: 'https://en.wikipedia.org/wiki/Surat_Thani',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Surin: {
    en: 'Surin', wiki: 'https://en.wikipedia.org/wiki/Surin_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Tak: {
    en: 'Tak (Raheng)', wiki: 'https://en.wikipedia.org/wiki/Tak_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Thonburi: {
    en: 'Thonburi (Bangkok, right bank)', wiki: 'https://en.wikipedia.org/wiki/Thonburi',
    short: 'The right bank of the Chao Phraya, and a province of its own until 1971',
    note: 'The right bank of the Chao Phraya, and a province of its own until 1971: the capital King Taksin built after the fall of Ayutthaya in 1767, before Rama I crossed the river and began Bangkok on the other side. Through both of this map\'s dates it was the working half of the city — rice mills, sawmills, the docks and the klong network — against Phra Nakhon\'s palaces and ministries opposite. It is drawn here from the fifteen modern khet that descend from its districts. These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Trang: {
    en: 'Trang', wiki: 'https://en.wikipedia.org/wiki/Trang_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Trat: {
    en: 'Trat', wiki: 'https://en.wikipedia.org/wiki/Trat',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  UbonRatchathani: {
    en: 'Ubon Ratchathani', wiki: 'https://en.wikipedia.org/wiki/Ubon_Ratchathani',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  UdonThani: {
    en: 'Udon Thani (Udorn)', wiki: 'https://en.wikipedia.org/wiki/Udon_Thani',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  UthaiThani: {
    en: 'Uthai Thani', wiki: 'https://en.wikipedia.org/wiki/Uthai_Thani',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Uttaradit: {
    en: 'Uttaradit', wiki: 'https://en.wikipedia.org/wiki/Uttaradit',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  Yala: {
    en: 'Yala (Jala)', wiki: 'https://en.wikipedia.org/wiki/Yala_province',
    note: 'These are the changwat as they stood from 1933 to 1947. On the 1930 map they are an approximation twice over: the changwat then sat inside the monthon, the circles abolished in 1933 and not drawn here, and nine provinces that existed in 1930 — Sukhothai, Lom Sak, Thanyaburi, Kalasin, Lang Suan, Takua Pa, Sai Buri, Phra Pradaeng and Min Buri — were abolished on 1 April 1932 into the provinces around them, whose boundaries are the ones drawn.'
  },
  'Singapore (Pulau Ujong)': {
    en: 'Singapore (Pulau Ujong) — Shōnantō from February 1942', ja: '昭南島 (Shōnantō)',
    orig: 'Pulau Ujong', wiki: 'https://en.wikipedia.org/wiki/Singapore',
    note: 'The island itself, as distinct from the Settlement. Japan renamed it Shōnantō, "light of the south", on 16 February 1942, the day after the surrender.'
  },
  'Sentosa (Pulau Blakang Mati)': {
    en: 'Sentosa (Pulau Blakang Mati)', orig: 'Pulau Blakang Mati',
    wiki: 'https://en.wikipedia.org/wiki/Sentosa',
    short: 'A garrison island guarding the western approach',
    note: 'A garrison island guarding the western approach, with the coastal batteries at Fort Siloso — the guns that faced the wrong way in the accounts, though they were turned and fired north in February 1942.'
  },
  'Jurong Island — reclaimed from seven islands after 1995': {
    en: 'Jurong Island — reclaimed from seven islands after 1995',
    note: 'Not a shape of this period at all: the coastline drawn here is the modern one, and this island was made by joining seven smaller ones from 1995. It is on the map because the coastline source is a modern one; see Sources.'
  },
  TwTaihoku: {
    en: 'Taihoku-shi (Taibei, Taipei)', ja: '臺北市 (Taihoku-shi)', zh: '臺北市',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Taibei-shi (Taihoku-shi, Taipei)',
    short: 'In Taihoku-shū (臺北州). The colony\'s capital, and the seat of the Governor-General',
    note: 'Taihoku, the capital, laid out inside and then over the walls of the Ch\'ing prefectural city. The Government-General\'s new headquarters, finished in 1919, is the tallest building in the empire outside Japan, and the city around it is the one place in the colony built to be looked at: the museum, the hospital, the imperial university of 1928, and a grid of Japanese quarters west of the old Chinese streets of Daitōtei, which went on doing the tea trade regardless.'
  },
  TwShichisei: {
    en: 'Shichisei-gun (Qixing)', ja: '七星郡 (Shichisei-gun)', zh: '七星郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Qixing-jun (Shichisei-gun)',
    short: 'In Taihoku-shū (臺北州). The volcanic hills north of the capital, the hot springs at Hokutō and the tea slopes above them'
  },
  TwBunzan: {
    en: 'Bunzan-gun (Wenshan)', ja: '文山郡 (Bunzan-gun)', zh: '文山郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture', local: 'Wenshan-jun (Bunzan-gun)',
    short: 'In Taihoku-shū (臺北州). Tea country in the hills south of the capital, and the gorge the city drinks from'
  },
  TwKaizan: {
    en: 'Kaizan-gun (Haishan)', ja: '海山郡 (Kaizan-gun)', zh: '海山郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture', local: 'Haishan-jun (Kaizan-gun)',
    short: 'In Taihoku-shū (臺北州). Coal measures and brick kilns along the southern branch of the Tamsui'
  },
  TwKirun: {
    en: 'Kīrun-gun (Jilong, Keelung)', ja: '基隆郡 (Kīrun-gun)', zh: '基隆郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Jilong-jun (Kīrun-gun, Keelung)',
    short: 'In Taihoku-shū (臺北州). The coalfield and fishing coast around the port, the port itself being a city apart',
    note: 'The north\'s port, and the reason the island could be held: coal from the Zuihō seams behind it, a harbour dredged and re-dredged through the 1920s, and the ferry to Moji that every official, soldier and settler arrived on. It rains here about two hundred days a year. The city itself was Kīrun-shi, a municipality separate from this district since 1924, and the sheet leaves its ground blank.'
  },
  TwTansui: {
    en: 'Tansui-gun (Danshui, Tamsui)', ja: '淡水郡 (Tansui-gun)', zh: '淡水郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Danshui-jun (Tansui-gun, Tamsui)',
    short: 'In Taihoku-shū (臺北州). The old treaty port at the Tamsui mouth, silted up and long past its trade'
  },
  TwShinsho: {
    en: 'Shinshō-gun (Xinzhuang)', ja: '新莊郡 (Shinshō-gun)', zh: '新莊郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Xinzhuang-jun (Shinshō-gun)',
    short: 'In Taihoku-shū (臺北州). Rice land on the plain upstream of the capital'
  },
  TwGiran: {
    en: 'Giran-gun (Yilan)', ja: '宜蘭郡 (Giran-gun)', zh: '宜蘭郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture', local: 'Yilan-jun (Giran-gun)',
    short: 'In Taihoku-shū (臺北州). The Giran plain on the east coast, cut off from the rest of the prefecture by the mountains'
  },
  TwRato: {
    en: 'Ratō-gun (Luodong)', ja: '羅東郡 (Ratō-gun)', zh: '羅東郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture', local: 'Luodong-jun (Ratō-gun)',
    short: 'In Taihoku-shū (臺北州). The southern half of the Giran plain, and the camphor forest behind it'
  },
  TwSuo: {
    en: 'Suō-gun (Su’ao)', ja: '蘇澳郡 (Suō-gun)', zh: '蘇澳郡',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture', local: 'Su’ao-jun (Suō-gun)',
    short: 'In Taihoku-shū (臺北州). The harbour at the north end of the east-coast cliff road, and the marble the road was cut through'
  },
  TwShinchiku: {
    en: 'Shinchiku-gun (Xinzhu, Hsinchu)', ja: '新竹郡 (Shinchiku-gun)', zh: '新竹郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Xinzhu-jun (Shinchiku-gun, Hsinchu)',
    short: 'In Shinchiku-shū (新竹州). The rice country round the seat, the town itself being a city apart'
  },
  TwChikuto: {
    en: 'Chikutō-gun (Zhudong)', ja: '竹東郡 (Chikutō-gun)', zh: '竹東郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Zhudong-jun (Chikutō-gun)',
    short: 'In Shinchiku-shū (新竹州). The foothills east of Shinchiku — camphor, coal, and the edge of the aboriginal territory'
  },
  TwChikunan: {
    en: 'Chikunan-gun (Zhunan)', ja: '竹南郡 (Chikunan-gun)', zh: '竹南郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Zhunan-jun (Chikunan-gun)',
    short: 'In Shinchiku-shū (新竹州). The coast south of Shinchiku, and the gas wells at Shutsuryōkō'
  },
  TwByoritsu: {
    en: 'Byōritsu-gun (Miaoli)', ja: '苗栗郡 (Byōritsu-gun)', zh: '苗栗郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Miaoli-jun (Byōritsu-gun)',
    short: 'In Shinchiku-shū (新竹州). Hakka farming country in the hills, and the colony\'s oilfield'
  },
  TwTaiko: {
    en: 'Taiko-gun (Dahu)', ja: '大湖郡 (Taiko-gun)', zh: '大湖郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture', local: 'Dahu-jun (Taiko-gun)',
    short: 'In Shinchiku-shū (新竹州). A basin deep in the mountains, opened late and held against the Atayal'
  },
  TwToen: {
    en: 'Tōen-gun (Taoyuan)', ja: '桃園郡 (Tōen-gun)', zh: '桃園郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture', local: 'Taoyuan-jun (Tōen-gun)',
    short: 'In Shinchiku-shū (新竹州). The pond country of the northern terrace — thousands of irrigation tanks on ground no river reaches'
  },
  TwChureki: {
    en: 'Chūreki-gun (Zhongli)', ja: '中壢郡 (Chūreki-gun)', zh: '中壢郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Zhongli-jun (Chūreki-gun)',
    short: 'In Shinchiku-shū (新竹州). Hakka rice and tea on the Tōen terrace'
  },
  TwDaikei: {
    en: 'Daikei-gun (Daxi)', ja: '大溪郡 (Daikei-gun)', zh: '大溪郡',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture', local: 'Daxi-jun (Daikei-gun)',
    short: 'In Shinchiku-shū (新竹州). The Daikei river gorge and the camphor forests above it'
  },
  TwTaichu: {
    en: 'Taichū-shi (Taizhong, Taichung)', ja: '臺中市 (Taichū-shi)', zh: '臺中市',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Taizhong-shi (Taichū-shi, Taichung)',
    short: 'In Taichū-shū (臺中州). The colony\'s third city, laid out new on a grid with the first modern drainage in Taiwan',
    note: 'Taichū was built rather than inherited: a new grid on the Taichū basin, laid out by the Japanese from 1900 with the first proper drainage in Taiwan after an earlier plan for a provincial capital there had been abandoned by the Ch\'ing. It is the market town for the whole middle of the island, and the head of the line up into the mountains.'
  },
  TwDaiton: {
    en: 'Daiton-gun (Datun)', ja: '大屯郡 (Daiton-gun)', zh: '大屯郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Datun-jun (Daiton-gun)',
    short: 'In Taichū-shū (臺中州). The basin ringed round Taichū, with the city itself a hole in the middle of it'
  },
  TwTaikou: {
    en: 'Taikō-gun (Dajia)', ja: '大甲郡 (Taikō-gun)', zh: '大甲郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Dajia-jun (Taikō-gun)',
    short: 'In Taichū-shū (臺中州). The coast at the Taikō river mouth, and the rush mats and straw hats it exported'
  },
  TwToyohara: {
    en: 'Toyohara-gun (Fengyuan)', ja: '豐原郡 (Toyohara-gun)', zh: '豐原郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Fengyuan-jun (Toyohara-gun)',
    short: 'In Taichū-shū (臺中州). The Toyohara plain — sugar, rice, and the junction of the mountain railway'
  },
  TwTosei: {
    en: 'Tōsei-gun (Dongshi)', ja: '東勢郡 (Tōsei-gun)', zh: '東勢郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Dongshi-jun (Tōsei-gun)',
    short: 'In Taichū-shū (臺中州). The upper Taikō, timber and camphor at the mouth of the central range'
  },
  TwShoka: {
    en: 'Shōka-gun (Zhanghua, Changhua)', ja: '彰化郡 (Shōka-gun)', zh: '彰化郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Zhanghua-jun (Shōka-gun, Changhua)',
    short: 'In Taichū-shū (臺中州). The rice plain behind the Shōka coast, and the great irrigation canal that made it'
  },
  TwInrin: {
    en: 'Inrin-gun (Yuanlin)', ja: '員林郡 (Inrin-gun)', zh: '員林郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Yuanlin-jun (Inrin-gun)',
    short: 'In Taichū-shū (臺中州). Sugar and fruit on the southern half of the Shōka plain'
  },
  TwHokuto: {
    en: 'Hokuto-gun (Beidou)', ja: '北斗郡 (Hokuto-gun)', zh: '北斗郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Beidou-jun (Hokuto-gun)',
    short: 'In Taichū-shū (臺中州). The Dakusui river\'s delta — sugar cane, and flood'
  },
  TwNanto: {
    en: 'Nantō-gun (Nantou)', ja: '南投郡 (Nantō-gun)', zh: '南投郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Nantou-jun (Nantō-gun)',
    short: 'In Taichū-shū (臺中州). The hill basins of the interior, betel and bananas, and the road up to Sun-Moon Lake'
  },
  TwNiitaka: {
    en: 'Niitaka-gun (Xingao)', ja: '新高郡 (Niitaka-gun)', zh: '新高郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Xingao-jun (Niitaka-gun)',
    short: 'In Taichū-shū (臺中州). Named for Niitaka-yama, Mount Morrison — renamed in 1897 for standing higher than Fuji — and mostly the mountain itself',
    note: 'Almost entirely mountain. Niitaka-yama is Mount Morrison, 3,952 metres, renamed in 1897 for being higher than Fuji and so the tallest mountain in the empire — the name the Combined Fleet used in December 1941 for the signal to attack.'
  },
  TwNoko: {
    en: 'Nōkō-gun (Nenggao)', ja: '能高郡 (Nōkō-gun)', zh: '能高郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Nenggao-jun (Nōkō-gun)',
    short: 'In Taichū-shū (臺中州). The Puri basin at the island\'s centre, and the hydro-electric works at Sun-Moon Lake',
    note: 'The Puri basin, almost exactly the centre of the island, and Sun-Moon Lake above it — dammed through the 1920s and 30s for the hydro-electric scheme that powered the colony\'s industry. This was also the district of Musha, where in 1930 the Seediq rose and killed 134 Japanese at a school sports day, and where the reprisal that followed — poison gas among it — destroyed the villages that took part.'
  },
  TwTakeyama: {
    en: 'Takeyama-gun (Zhushan)', ja: '竹山郡 (Takeyama-gun)', zh: '竹山郡',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Zhushan-jun (Takeyama-gun)',
    short: 'In Taichū-shū (臺中州). Bamboo country in the foothills below the Rokudō gorge'
  },
  TwTainan: {
    en: 'Tainan-shi', ja: '臺南市 (Tainan-shi)', zh: '臺南市',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture',
    short: 'In Tainan-shū (臺南州). The oldest city in Taiwan, and the Ch\'ing capital of the island until 1885',
    note: 'The oldest city in Taiwan and its capital until 1885 — Dutch fort, Ch\'ing prefecture, and the temples of both still standing. By 1926 the harbour it grew on had silted into fish ponds and the trade had gone to Takao, and Tainan was what it has stayed since: the place the island keeps its past in.'
  },
  TwNiitoyo: {
    en: 'Niitoyo-gun (Xinfeng)', ja: '新豐郡 (Niitoyo-gun)', zh: '新豐郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Xinfeng-jun (Niitoyo-gun)',
    short: 'In Tainan-shū (臺南州). The salt pans and fish ponds along the coast south of Tainan'
  },
  TwShinka: {
    en: 'Shinka-gun (Xinhua)', ja: '新化郡 (Shinka-gun)', zh: '新化郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Xinhua-jun (Shinka-gun)',
    short: 'In Tainan-shū (臺南州). The hills east of Tainan, and the badlands above them'
  },
  TwSobun: {
    en: 'Sobun-gun (Zengwen)', ja: '曾文郡 (Sobun-gun)', zh: '曾文郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Zengwen-jun (Sobun-gun)',
    short: 'In Tainan-shū (臺南州). The Sobun river basin, and the reservoir that watered the Kanan plain'
  },
  TwHokumon: {
    en: 'Hokumon-gun (Beimen)', ja: '北門郡 (Hokumon-gun)', zh: '北門郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Beimen-jun (Hokumon-gun)',
    short: 'In Tainan-shū (臺南州). The salt fields of the west coast, worked since the seventeenth century'
  },
  TwShinei: {
    en: 'Shin\'ei-gun (Xinying)', ja: '新營郡 (Shin\'ei-gun)', zh: '新營郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture',
    local: 'Xinying-jun (Shin\'ei-gun)',
    short: 'In Tainan-shū (臺南州). Sugar country on the Kanan plain, below the great Ushantou dam'
  },
  TwKagi: {
    en: 'Kagi-gun (Jiayi, Chiayi)', ja: '嘉義郡 (Kagi-gun)', zh: '嘉義郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture',
    local: 'Jiayi-jun (Kagi-gun, Chiayi)',
    short: 'In Tainan-shū (臺南州). The plain below Mount Ari, and the forest railway that brought its cypress down',
    note: 'The plain below Mount Ari, and the reason anyone in Japan had heard of it: the forest railway that climbs 2,200 metres out of Kagi into the cypress and hinoki of Arisan, built from 1906 to bring the timber down. The trees went to shrines and temples across the empire, including Meiji Jingū.'
  },
  TwToseki: {
    en: 'Tōseki-gun (Dongshi)', ja: '東石郡 (Tōseki-gun)', zh: '東石郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Dongshi-jun (Tōseki-gun)',
    short: 'In Tainan-shū (臺南州). The lagoon coast and oyster beds at the Hokukō river mouth'
  },
  TwHokuko: {
    en: 'Hokukō-gun (Beigang)', ja: '北港郡 (Hokukō-gun)', zh: '北港郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Beigang-jun (Hokukō-gun)',
    short: 'In Tainan-shū (臺南州). The old junk port on the Hokukō river, and the Matsu temple that outlived its trade'
  },
  TwKobi: {
    en: 'Kobi-gun (Huwei)', ja: '虎尾郡 (Kobi-gun)', zh: '虎尾郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Huwei-jun (Kobi-gun)',
    short: 'In Tainan-shū (臺南州). The largest sugar refinery in the colony, and the cane fields round it'
  },
  TwToroku: {
    en: 'Toroku-gun (Douliu)', ja: '斗六郡 (Toroku-gun)', zh: '斗六郡',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture', local: 'Douliu-jun (Toroku-gun)',
    short: 'In Tainan-shū (臺南州). Rice and sugar on the Toroku plain, at the foot of the central range'
  },
  TwOkayama: {
    en: 'Okayama-gun (Gangshan)', ja: '岡山郡 (Okayama-gun)', zh: '岡山郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture', local: 'Gangshan-jun (Okayama-gun)',
    short: 'In Takao-shū (高雄州). Drawn short of its own coast: the sheet leaves the ground round Okayama town unattributed'
  },
  TwHozan: {
    en: 'Hōzan-gun (Fengshan)', ja: '鳳山郡 (Hōzan-gun)', zh: '鳳山郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture', local: 'Fengshan-jun (Hōzan-gun)',
    short: 'In Takao-shū (高雄州). Drawn as a fragment: the sheet leaves the ground round Hōzan town — and Takao city with it — unattributed'
  },
  TwKizan: {
    en: 'Kizan-gun (Qishan)', ja: '旗山郡 (Kizan-gun)', zh: '旗山郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture', local: 'Qishan-jun (Kizan-gun)',
    short: 'In Takao-shū (高雄州). Bananas and sugar in the hill basins of the upper Kaohei'
  },
  TwHeito: {
    en: 'Heitō-gun (Pingdong, Pingtung)', ja: '屏東郡 (Heitō-gun)', zh: '屏東郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture',
    local: 'Pingdong-jun (Heitō-gun, Pingtung)',
    short: 'In Takao-shū (高雄州). The Heitō plain — sugar, pineapple, and the airfield built on it'
  },
  TwChoshu: {
    en: 'Chōshū-gun (Chaozhou)', ja: '潮州郡 (Chōshū-gun)', zh: '潮州郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture', local: 'Chaozhou-jun (Chōshū-gun)',
    short: 'In Takao-shū (高雄州). The eastern side of the Heitō plain, Hakka villages under the Dawu range'
  },
  TwToko: {
    en: 'Tōkō-gun (Donggang)', ja: '東港郡 (Tōkō-gun)', zh: '東港郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture', local: 'Donggang-jun (Tōkō-gun)',
    short: 'In Takao-shū (高雄州). The fishing port at the Kaohei mouth, with Ryūkyū island offshore'
  },
  TwKoshun: {
    en: 'Kōshun-gun (Hengchun)', ja: '恆春郡 (Kōshun-gun)', zh: '恆春郡',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture', local: 'Hengchun-jun (Kōshun-gun)',
    short: 'In Takao-shū (高雄州). The peninsula at the island\'s southern tip, and the lighthouse at Garanpi',
    note: 'The southern tip, hot enough for rubber and coconut trials, and the site of the 1874 expedition: Japan\'s first overseas military action, sent after Ryūkyūan sailors were killed by Paiwan villagers here, and the beginning of the argument that ended with Taiwan being ceded twenty-one years later.'
  },
  TwTaito: {
    en: 'Taitō-chō (Taidong, Taitung)', ja: '臺東廳 (Taitō-chō)', zh: '臺東廳',
    wiki: 'https://en.wikipedia.org/wiki/Tait%C5%8D_Prefecture',
    local: 'Taidong-ting (Taitō-chō, Taitung)',
    short: 'The administered coast of Taitō-chō in the south-east, with Kōtōsho and Kasho-tō offshore',
    note: 'The administered coast of Taitō-chō: a strip of the south-east between the mountains and the sea, with Kōtōsho (Orchid Island) and Kasho-tō (Green Island) offshore. Kōtōsho was left largely alone as a reservation for the Yami, and the interior of the chō is Taiwan Indigenous Peoples\' territory.'
  },
  TwHoko: {
    en: 'Hōko-chō (Penghu, the Pescadores)', ja: '澎湖廳 (Hōko-chō)', zh: '澎湖廳',
    wiki: 'https://en.wikipedia.org/wiki/H%C5%8Dko_Prefecture',
    local: 'Penghu-ting (Hōko-chō, the Pescadores)',
    short: 'The Pescadores: taken back out of Takao-shū in 1926 and made a chō of their own again. Fishing, groundnuts and wind',
    note: 'The Pescadores: sixty-odd islands of basalt and wind in the strait, taken by Japan in March 1895 before the treaty that ceded Taiwan was signed, and used as the fleet\'s forward anchorage. Too dry and too windy for rice — groundnuts, sweet potato and fish — and the first part of the colony to be taken and the last thing on it a visitor expects.'
  },
  TwShuTaihoku: {
    en: 'Taihoku-shū (Taibei, Taipei)', ja: '臺北州 (Taihoku-shū)', zh: '臺北州',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Taibei-zhou (Taihoku-shū, Taipei)',
    short: 'The whole prefecture. The north: the capital, the port of Kīrun and its coalfield, the tea hills, and the Giran plain beyond the mountains'
  },
  TwShuShinchiku: {
    en: 'Shinchiku-shū (Xinzhu, Hsinchu)', ja: '新竹州 (Shinchiku-shū)', zh: '新竹州',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Xinzhu-zhou (Shinchiku-shū, Hsinchu)',
    short: 'The whole prefecture. The Hakka terrace country of the north-west, its thousands of irrigation ponds, and the colony\'s oilfield'
  },
  TwShuTaichu: {
    en: 'Taichū-shū (Taizhong, Taichung)', ja: '臺中州 (Taichū-shū)', zh: '臺中州',
    wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    local: 'Taizhong-zhou (Taichū-shū, Taichung)',
    short: 'The whole prefecture. From the Taichū basin across the irrigated rice plain of Shōka to the central mountains and Sun-Moon Lake'
  },
  TwShuTainan: {
    en: 'Tainan-shū', ja: '臺南州 (Tainan-shū)', zh: '臺南州',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture',
    short: 'The whole prefecture. The old south-west: the island\'s oldest city, the salt coast, and the Kanan plain the Ushantou dam turned to paddy'
  },
  TwShuTakao: {
    en: 'Takao-shū (Gaoxiong, Kaohsiung)', ja: '高雄州 (Takao-shū)', zh: '高雄州',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture',
    local: 'Gaoxiong-zhou (Takao-shū, Kaohsiung)',
    short: 'The whole prefecture. The far south: sugar and pineapple on the Heitō plain, the harbour at Takao, and the peninsula below them'
  },
  TwShuKarenko: {
    en: 'Karenkō-chō (Hualiangang, Hualien)', ja: '花蓮港廳 (Karenkō-chō)', zh: '花蓮港廳',
    wiki: 'https://en.wikipedia.org/wiki/Karenk%C5%8D_Prefecture',
    local: 'Hualiangang-ting (Karenkō-chō, Hualien)',
    short: 'The whole prefecture. The east coast north of Taitō, thinly settled and not divided into districts at all in 1926'
  },
  TwShuTaito: {
    en: 'Taitō-chō (Taidong, Taitung)', ja: '臺東廳 (Taitō-chō)', zh: '臺東廳',
    wiki: 'https://en.wikipedia.org/wiki/Tait%C5%8D_Prefecture',
    local: 'Taidong-ting (Taitō-chō, Taitung)',
    short: 'The whole prefecture. The south-east coast and the two islands off it; the mainland of the chō was not divided into districts'
  },
  TwShuHoko: {
    en: 'Hōko-chō (Penghu, the Pescadores)', ja: '澎湖廳 (Hōko-chō)', zh: '澎湖廳',
    wiki: 'https://en.wikipedia.org/wiki/H%C5%8Dko_Prefecture',
    local: 'Penghu-ting (Hōko-chō, the Pescadores)',
    short: 'The whole prefecture. The Pescadores, taken back out of Takao-shū in 1926 and made a chō of their own again'
  },
  TwKirunShi: {
    en: 'Kīrun-shi (Jilong, Keelung)', ja: '基隆市 (Kīrun-shi)', zh: '基隆市',
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture',
    local: 'Jilong-shi (Kīrun-shi, Keelung)',
    short: 'In Taihoku-shū (臺北州). The colony\'s northern port, raised to a city in 1924: coal from the Zuihō seams, and the ferry every official and settler arrived on'
  },
  TwShinchikuShi: {
    en: 'Shinchiku-shi (Xinzhu, Hsinchu)', ja: '新竹市 (Shinchiku-shi)', zh: '新竹市',
    wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    local: 'Xinzhu-shi (Shinchiku-shi, Hsinchu)',
    short: 'In Shinchiku-shū (新竹州). The prefectural seat on the windy northern plain, raised to a city in January 1930'
  },
  TwKagiShi: {
    en: 'Kagi-shi (Jiayi, Chiayi)', ja: '嘉義市 (Kagi-shi)', zh: '嘉義市',
    wiki: 'https://en.wikipedia.org/wiki/Tainan_Prefecture',
    local: 'Jiayi-shi (Kagi-shi, Chiayi)',
    short: 'In Tainan-shū (臺南州). Raised to a city in January 1930; the head of the forest railway that climbs into the cypress of Arisan'
  },
  TwTakaoShi: {
    en: 'Takao-shi (Gaoxiong, Kaohsiung)', ja: '高雄市 (Takao-shi)', zh: '高雄市',
    wiki: 'https://en.wikipedia.org/wiki/Takao_Prefecture',
    local: 'Gaoxiong-shi (Takao-shi, Kaohsiung)',
    short: 'In Takao-shū (高雄州). The southern harbour, dredged through the 1920s into the colony\'s sugar and cement port, and a city since 1924'
  },
  TwKarenko: {
    en: 'Karenkō-chō (Hualiangang, Hualien)', ja: '花蓮港廳 (Karenkō-chō)', zh: '花蓮港廳',
    wiki: 'https://en.wikipedia.org/wiki/Karenk%C5%8D_Prefecture',
    local: 'Hualiangang-ting (Karenkō-chō, Hualien)',
    short: 'The administered coast of Karenkō-chō, a thin shelf between the mountains and the Pacific, settled late and largely by Japanese immigrants'
  },
  TwBanchi: {
    en: 'Taiwan Indigenous Peoples', ja: '台湾原住民族 (Taiwan genjūminzoku)', zh: '臺灣原住民族',
    wiki: 'https://en.wikipedia.org/wiki/Taiwanese_indigenous_peoples',
    short: 'The highlands and the east: country the colonial state claimed and policed but never governed as it did the plains',
    note: 'This territory is the Taiwan Government-General\'s demarcated "Aborigine Territory" (蕃地) for around 1930. It is drawn from the administration\'s own demarcation, not from any account of where people actually lived. Please see *Outcasts of Empire: Japan\'s Rule on Taiwan\'s "Savage Border," 1874–1945* by Paul Barclay for more discussion on representations of this territory and its peoples.'
  },
  'Peale Island': {
    en: 'Peale Island', ja: 'ピール島 (Pīru-tō)', zh: '皮爾島',
    wiki: 'https://en.wikipedia.org/wiki/Peale_Island',
    short: 'Pan American\'s stop on the Clipper route: a forty-eight-room hotel',
    note: 'Pan American\'s stop on the Clipper route: a forty-eight-room hotel, a pier and a radio mast, put up in 1935 on an islet that had never had a building on it. The seaplane base was destroyed in the first Japanese air raid on 8 December 1941.'
  },
};

/* One block per epoch, and the generator holds it to that: this object
   carried two `e1942` keys for a long time and the later of them silently
   discarded the earlier, so eleven overrides never took effect at all. */
JMAP.PROVINCE_EPOCH = {
  e1930: {
    Sind: {
      en: 'Sind — a division of the Bombay Presidency until 1936',
      wiki: 'https://en.wikipedia.org/wiki/Sindh'
    },
    Orissa: {
      en: 'Bihar and Orissa Province — one province until 1936',
      wiki: 'https://en.wikipedia.org/wiki/Bihar_and_Orissa_Province'
    },
    Bihar: {
      en: 'Bihar and Orissa Province — one province until 1936',
      wiki: 'https://en.wikipedia.org/wiki/Bihar_and_Orissa_Province'
    },
    UnitedProvinces: {
      en: 'United Provinces of Agra and Oudh',
      wiki: 'https://en.wikipedia.org/wiki/United_Provinces_(1937%E2%80%931950)'
    },
    NWFP: {
      en: 'North-West Frontier Province — a chief commissioner’s province until 1932',
      wiki: 'https://en.wikipedia.org/wiki/North-West_Frontier_Province'
    },
    Liaoning: {
      en: 'Liáoníng (Fengtien until 1929)', ja: '遼寧 (Ryōnei)', zh: '遼寧', ko: '요녕 (Yonyŏng)',
      wiki: 'https://en.wikipedia.org/wiki/Liaoning'
    },
    Heilongjiang: {
      en: 'Hēilóngjiāng (Heilungkiang)', ja: '黒竜江省', zh: '黑龍江', ko: '헤이룽장성',
      wiki: 'https://en.wikipedia.org/wiki/Heilongjiang'
    },
    Suiyuan: {
      en: 'Suíyuǎn (Suiyuan)', ja: '綏遠省', zh: '綏遠', ko: '쑤이위안성',
      wiki: 'https://en.wikipedia.org/wiki/Suiyuan'
    },
    MahaSarakham: {
      en: 'Maha Sarakham (Kalasin was still separate until 1932)',
      wiki: 'https://en.wikipedia.org/wiki/Maha_Sarakham'
    },
    SiSaKet: { en: 'Khukhan' },
    Sukhothai: {
      en: 'Sawankhalok (Sukhothai was merged into it in 1931)',
      wiki: 'https://en.wikipedia.org/wiki/Sukhothai_province'
    },
    Tenasserim: {
      en: 'Tenasserim Division — Thaton, Amherst, Tavoy, Mergui',
      wiki: 'https://en.wikipedia.org/wiki/Tanintharyi_Region'
    },
    Labuan: {
      en: 'Labuan — a Crown colony from 1848, attached to the Straits Settlements in 1907',
      wiki: 'https://en.wikipedia.org/wiki/Labuan'
    },
    Dindings: {
      en: 'The Dindings — Straits Settlement: Lumut, Sitiawan and Pangkor, ceded by Perak in 1874 and ruled from Singapore',
      short: 'Straits Settlement: Lumut, Sitiawan and Pangkor'
    },
  },
  e1942: {
    Funafuti: {
      en: 'Funafuti — the American base from October 1942',
      wiki: 'https://en.wikipedia.org/wiki/Funafuti',
      note: 'The lagoon and the airstrip the assault on Tarawa and Makin was mounted from in November 1943. Marines landed on 2 October 1942 and the islanders of the main islet were moved to make room for the runway.'
    },
    Nukufetau: {
      en: 'Nukufetau — an American airfield from 1943',
      wiki: 'https://en.wikipedia.org/wiki/Nukufetau'
    },
    Nanumea: {
      en: 'Nanumea — an American airfield from 1943',
      wiki: 'https://en.wikipedia.org/wiki/Nanumea'
    },
    Sind: { en: 'Sind Province', wiki: 'https://en.wikipedia.org/wiki/Sindh' },
    Orissa: {
      en: 'Orissa Province — the Orissa States are drawn inside it',
      wiki: 'https://en.wikipedia.org/wiki/Orissa_Province'
    },
    Bihar: { en: 'Bihar Province', wiki: 'https://en.wikipedia.org/wiki/Bihar_Province' },
    UnitedProvinces: {
      en: 'United Provinces',
      wiki: 'https://en.wikipedia.org/wiki/United_Provinces_(1937%E2%80%931950)'
    },
    Liaoning: {
      en: 'Fèngtiān (Fengtien)', ja: '奉天 (Hōten)', zh: '奉天', ko: '봉천 (Pongch’ŏn)',
      wiki: 'https://en.wikipedia.org/wiki/Liaoning'
    },
    Heilongjiang: {
      en: 'Lóngjiāng (Lungkiang)', ja: '黒竜江省', zh: '龍江', ko: '헤이룽장성',
      wiki: 'https://en.wikipedia.org/wiki/Heilongjiang'
    },
    SiSaKet: { en: 'Sisaket (Khukhan until 1938)', wiki: 'https://en.wikipedia.org/wiki/Sisaket' },
    Sukhothai: {
      en: 'Sukhothai (Sawankhalok until 1939)',
      wiki: 'https://en.wikipedia.org/wiki/Sukhothai_province'
    },
    Labuan: {
      en: 'Labuan — under the Japanese military administration of British Borneo',
      wiki: 'https://en.wikipedia.org/wiki/Labuan'
    },
    Dindings: { en: 'The Dindings — part of Perak again since 16 February 1935' },
    'Christmas Island': {
      en: 'Christmas Island — taken by Japan on 31 March 1942 for its phosphate',
      ja: 'クリスマス島 (Kurisumasu-tō)', wiki: 'https://en.wikipedia.org/wiki/Christmas_Island'
    },
    Singapore: {
      en: 'Singapore — Shōnantō under Japanese military administration',
      wiki: 'https://en.wikipedia.org/wiki/Singapore'
    },
    Penang: {
      en: 'Penang — under the Japanese military administration of Malaya',
      wiki: 'https://en.wikipedia.org/wiki/Penang'
    },
    Malacca: {
      en: 'Malacca — under the Japanese military administration of Malaya',
      wiki: 'https://en.wikipedia.org/wiki/Malacca'
    },
    'Iwo Jima (Iō-tō)': {
      short: 'Its civilians taken off in 1944, and the island made a fortress',
      note: 'The thousand civilians were taken off in July 1944 and the island was turned into a fortress of tunnels. Kuribayashi Tadamichi gave up any thought of holding the beaches and fought from underground with some 21,000 men, almost all of whom died. The landing on 19 February 1945 took five weeks and cost nearly 7,000 American lives; the airfields then served the B-29s over Tokyo.'
    },
    Chichijima: {
      short: 'A fortified naval base, bombed from 1944 but never invaded',
      note: 'A fortified naval base, bombed from 1944 but never invaded, and the garrison held out to the surrender. George H. W. Bush was shot down off it in September 1944. Officers on the island killed several captured American airmen and ate part of them, and were tried and hanged for it in 1946.'
    },
    Hahajima: {
      short: 'Shelled and bombed and then left alone',
      note: 'Shelled and bombed and then left alone. Its people were evacuated to the mainland with those of Chichijima in 1944.'
    },
  },
};

JMAP.CLUSTER_EPOCH = {
  e1942: {
    'malaya/Dindings': null,
  },
};
