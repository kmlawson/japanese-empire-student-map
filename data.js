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
      note: 'Honshū, Kyūshū, Shikoku and Hokkaidō. Hokkaidō was itself a settler frontier, colonised from 1869 at the expense of the Ainu.'
    },
    {
      id: 'ryukyu', en: 'Ryūkyū and Ōsumi Islands', ja: '沖縄県・鹿児島県 (Okinawa-ken・Kagoshima-ken)',
      orig: '琉球 (Ruuchuu)', zh: '琉球・沖繩縣', when: 'Annexed 1879',
      rule: 'Okinawa Prefecture, and Kagoshima from the Amami group north', cat: 'metropole',
      lvl: 1, atoms: ['ryukyu'],
      note: 'The Ryūkyū Kingdom paid tribute to both China and Satsuma until Japan abolished it and created Okinawa Prefecture in 1879. Only the southern half of this chain is that prefecture. Satsuma had taken the Amami islands from the kingdom in 1609, and they stayed with Kagoshima after 1879 as Ōshima-gun, along with the Tokara and Ōsumi groups north of them.'
    },
    {
      id: 'ogasawara', en: 'Bonin Islands (Ogasawara)', ja: '小笠原諸島 (Ogasawara Shotō)',
      orig: '小笠原諸島', zh: '小笠原群島', when: 'Claimed 1876',
      rule: 'Japanese, part of Tokyo prefecture', cat: 'metropole', lvl: 3,
      atoms: ['ogasawara'],
      note: 'A scattering of volcanic islands 1,000 km south of Tokyo, including Iwo Jima.'
    },
    {
      id: 'chishima', en: 'Kurile Islands (Chishima)', ja: '千島列島 (Chishima Rettō)',
      orig: 'Курильские острова', zh: '千島群島', when: 'Japanese from 1875', cat: 'metropole',
      lvl: 2, atoms: ['chishima'],
      note: 'Traded to Japan by Russia in the 1875 Treaty of Saint Petersburg, in exchange for Japanese claims to Sakhalin.'
    },
    {
      id: 'chosen', en: 'Chōsen (Korea)', ja: '朝鮮 (Chōsen)', orig: '조선 (Chosŏn)', zh: '朝鮮',
      ko: '조선 (Chosŏn)', when: 'Protectorate 1905, annexed 1910', cat: 'jpcolony', lvl: 1,
      atoms: ['korea'],
      note: 'Opened by the Kanghwa Treaty of 1876, made a protectorate after the Russo-Japanese War and annexed outright in August 1910. The March First Movement of 1919 was met with mass repression.'
    },
    {
      id: 'formosa', en: 'Taiwan (Formosa)', ja: '臺灣 (Taiwan)', orig: '臺灣 (Tâi-oân)', zh: '臺灣',
      when: 'Japanese colony from 1895', cat: 'jpcolony', lvl: 1, atoms: ['taiwan'],
      note: 'Japan’s first modern colony, ceded by the Qing in the 1895 Treaty of Shimonoseki after the First Sino-Japanese War.'
    },
    {
      id: 'karafuto', en: 'Karafuto (southern Sakhalin)', ja: '樺太 (Karafuto)',
      orig: 'Южный Сахалин', zh: '樺太（南薩哈林）', when: 'Japanese from 1905', cat: 'jpcolony',
      lvl: 1, atoms: ['karafuto'],
      note: 'Sakhalin south of the 50th parallel, taken from Russia by the 1905 Treaty of Portsmouth.'
    },
    {
      id: 'kwantung', en: 'Kwantung Leased Territory', ja: '関東州 (Kantōshū)',
      orig: '關東州 (Guāndōngzhōu)', zh: '關東州', when: 'Leased from China 1905–1945',
      cat: 'jpcolony', lvl: 2, atoms: ['kwantung'],
      note: 'The tip of the Liaodong peninsula, leased by Russia in 1898 and transferred to Japan in 1905. Lüshun and Dalian sat inside it, and so did the garrison that became the Kwantung Army.'
    },
    {
      id: 'nanyo', en: 'South Seas Mandate', ja: '南洋群島 (Nan’yō Guntō)', zh: '南洋群島',
      when: 'Japanese from 1914; League mandate from 1920', rule: 'Japanese mandate',
      cat: 'jpcolony', lvl: 2, atoms: ['nanyo'],
      note: 'The Marianas, Carolines and Marshalls: seized from Germany in 1914 and held by Japan from 1920 under a League of Nations Class C mandate, which meant governing them as an integral part of its own territory. The dotted line shows the boundary of the mandate, since the islands themselves are specks at this scale. Guam, in the middle of the Marianas, stayed American.'
    },
    {
      id: 'china', en: 'China (Republic of China)', ja: '中華民国 (Chūka Minkoku)',
      orig: '中華民國 (Zhōnghuá Mínguó)', zh: '中華民國',
      when: 'Republic from 1912; warlord rule, nominal unity from 1928', cat: 'chinese', lvl: 1,
      atoms: ['china'], lights: ['manchuria', 'jehol', 'chahar', 'suiyuan', 'xinjiang'],
      note: 'A republic in name from 1912, but from 1916 to 1928 the country was fought over by regional militarists — the warlord era — with rival governments claiming to be the real one. The Northern Expedition of 1926–28 brought most of it under the Nationalists at Nanjing, but the unity was nominal: warlords kept their armies and their provinces, Manchuria answered to Zhang Xueliang, the Communists held rural base areas, and Xinjiang and Tibet went their own way. Japan meanwhile held a concession at Tianjin, a garrison in north China and the South Manchuria Railway zone.'
    },
    {
      id: 'manchuria', en: 'Manchuria (the Three Eastern Provinces)', ja: '満洲 (Manshū)',
      orig: '東三省 (Dōngsānshěng)', zh: '滿洲（東三省）', when: 'Chinese, under Zhang Xueliang',
      cat: 'chinese', lvl: 1, atoms: ['manchuria'], within: 'china',
      note: 'Chinese territory in 1930, run by the Fengtian clique — Zhang Zuolin until his assassination by Japanese officers in 1928, then his son Zhang Xueliang, who declared for Nanjing. Japan already held the railway zone and the Kwantung leasehold inside it. The Kwantung Army invaded in September 1931.'
    },
    {
      id: 'jehol', en: 'Rèhé (Jehol)', ja: '熱河 (Nekka)', orig: '熱河省 (Rèhé shěng)', zh: '熱河省',
      when: 'Chinese province from 1928', cat: 'chinese', lvl: 3, atoms: ['jehol'],
      within: 'china',
      note: 'The province between the Great Wall and Manchuria, made a full province in 1928. Japan took it in February and March 1933 and attached it to Manchukuo.'
    },
    {
      id: 'chahar', en: 'Cháhā’ěr (Chahar)', ja: '察哈爾 (Chaharu)', orig: '察哈爾', zh: '察哈爾',
      when: 'Chinese province from 1928', cat: 'chinese', lvl: 3, atoms: ['chahar'],
      within: 'china',
      note: 'The steppe province north-west of the Wall, made a province in 1928 out of one of the old frontier special districts, with Zhangjiakou at its gate — the Kalgan of the caravan trade, where the brick tea and wool of Outer Mongolia came south. From 1936 the Mongol prince Demchugdongrub headed a Japanese-sponsored government in the north of it; after Japan took Zhangjiakou in 1937 that grew, with the Chinese autonomous governments of southern Chahar and northern Shanxi, into the client regime of Mengchiang, federated in 1939 and governed from Zhangjiakou. The province was abolished in 1952 and divided between Hebei, Shanxi and Inner Mongolia.'
    },
    {
      id: 'suiyuan', en: 'Suíyuǎn (Suiyuan)', ja: '綏遠 (Suien)', orig: '綏遠', zh: '綏遠',
      when: 'Chinese province from 1928', cat: 'chinese', lvl: 3,
      atoms: ['suiyuan', 'suiyuan_w'], within: 'china',
      note: 'The northern bend of the Yellow River, irrigated at Hetao and dry beyond it, with Baotou the wool railhead of the steppe and the western end of the Beijing–Suiyuan railway. Also a province from 1928, and in 1930 within Yan Xishan\'s reach from Shanxi; Fu Zuoyi took the chairmanship in 1931 and held the western half of it through the whole war. The eastern half is what Mengchiang held after 1937. Abolished in 1954 into Inner Mongolia.'
    },
    {
      id: 'xinjiang', en: 'Xīnjiāng (Sinkiang)', ja: '新疆 (Shinkyō)', orig: 'شىنجاڭ (Shinjang)',
      zh: '新疆', when: 'Under largely autonomous provincial rule', cat: 'chinese', lvl: 3,
      atoms: ['xinjiang'], within: 'china',
      note: 'A province of the Republic in name, and Nanjing recognised Jin Shuren as its chairman. In practice his government ran its own army, finances and foreign trade, and Nanjing\'s writ reached almost nothing of it.'
    },
    {
      id: 'tibet', en: 'Tibet', ja: 'チベット (Chibetto)', orig: 'བོད་ (Bod)', zh: '西藏',
      when: 'De facto independent from 1913', cat: 'frontier', lvl: 3, atoms: ['tibet'],
      note: 'Claimed by the Republic of China, but self-governing in practice from 1913, when the 13th Dalai Lama expelled the last Chinese officials, until 1951. Shown here in the independent colour on that basis; no foreign power recognised it.'
    },
    {
      id: 'britishindia', en: 'British India (including Burma)',
      when: 'Burma a province of India until 1937', cat: 'british', lvl: 1,
      atoms: ['india', 'andaman', 'burma', 'saharat'], edge: '#8f5f6e', edgeAtoms: ['burma'],
      edgeClip: [92, 20.6, 97.4, 28.4],
      note: 'Burma was governed as a province of British India until it was separated in 1937. The Andaman and Nicobar Islands were run from India as a penal settlement.'
    },
    {
      id: 'goa', en: 'Portuguese India — Goa, Damão, Diu, Dadra & Nagar Haveli',
      orig: 'Estado da Índia', when: 'Portuguese from 1510', cat: 'portuguese', lvl: 3,
      atoms: ['goa'],
      note: 'Goa, with Damão and Diu on the Gujarat coast and Dadrá and Nagar Aveli inland behind them, is the seat of the Estado da Índia and the oldest European possession in Asia, held since 1510. It would stay Portuguese until India took it by force in 1961.'
    },
    {
      id: 'pondicherry', en: 'French India — Pondicherry, Karikal, Yanaon, Mahé, Chandernagore',
      orig: 'Établissements français dans l’Inde', when: 'French from 1674', cat: 'french',
      lvl: 3, atoms: ['pondicherry'],
      note: 'Five scattered enclaves left to France when Britain took the rest of India: Pondicherry and Karikal on the Coromandel coast, Yanaon on the Godavari, Mahé on the Malabar coast, and Chandernagore on the Hooghly above Calcutta. They would declare for the Free French in 1940 and pass to India in the 1950s.'
    },
    {
      id: 'princelystates', en: 'Princely states',
      when: 'Rulers in subsidiary alliance with the Crown', cat: 'british', lvl: 3,
      atoms: ['princely'], adminOnly: true,
      note: 'British India was a patchwork: nine governors\' provinces and a handful of smaller chief commissioners\' ones, ruled directly, and beside them some six hundred princely states whose rulers kept their thrones under treaties with the Crown. Hyderabad, the largest, had its own army and currency, and the Nizam was reckoned the richest man alive. The states are drawn here from a layer of their 1931 boundaries rather than approximated from modern units, so the shapes are the shapes: the Rajputana and Central India agencies as one western mass, the Baluchistan states of Kalat and Las Bela, the Eastern States through Orissa and Chhattisgarh, the hill states along the frontier, and the small Deccan states scattered through Bombay. The very smallest of the six hundred are below the resolution of this map and are drawn inside whichever province surrounded them.'
    },
    {
      id: 'ceylon', en: 'Ceylon', orig: 'ලංකාව (Lanka)', zh: '錫蘭', when: 'Crown colony',
      cat: 'british', lvl: 3, atoms: ['ceylon'],
      note: 'A separate Crown colony, not part of British India, and the Royal Navy’s main base in the eastern Indian Ocean.'
    },
    {
      id: 'malaya', en: 'British Malaya & Singapore', ja: '英領馬来 (Eiryō Marai)',
      orig: 'Tanah Melayu / Singapura', zh: '馬來亞・新加坡',
      when: 'Straits Settlements & protected states', cat: 'british', lvl: 2,
      atoms: ['malaya', 'malaya_thai', 'christmas'],
      note: 'The Straits Settlements and the protected Malay states, with the Singapore naval base begun in 1923 as the anchor of British power east of Suez. The four northern states — Kedah, Perlis, Kelantan and Trengganu — had been Siamese until the Anglo-Siamese Treaty of 1909.'
    },
    {
      id: 'sarawak', en: 'Sarawak', ja: 'サラワク (Sarawaku)', orig: 'Sarawak', zh: '砂拉越',
      when: 'Ruled by the Brooke family, 1841–1946', cat: 'british', lvl: 3, atoms: ['sarawak'],
      note: 'The private kingdom of the "White Rajahs": James Brooke took it from the sultan of Brunei in 1841 and his family ruled it for a century. A British protectorate from 1888, ceded to the Crown in 1946.'
    },
    {
      id: 'northborneo', en: 'North Borneo', ja: '北ボルネオ (Kita Boruneo)',
      orig: 'North Borneo / Labuan', zh: '北婆羅洲', when: 'Chartered company from 1881',
      cat: 'british', lvl: 3, atoms: ['northborneo'],
      note: 'Governed not by the Crown but by the British North Borneo Chartered Company, one of the last trading companies to rule territory in its own right. Labuan, a Crown colony since 1848, was attached to the Straits Settlements in 1907.'
    },
    {
      id: 'brunei', en: 'Brunei', ja: 'ブルネイ (Burunei)', orig: 'Brunei', zh: '汶萊',
      when: 'Protectorate from 1888', cat: 'british', lvl: 3, c: '#c79aa8', atoms: ['brunei'],
      note: 'What was left of the sultanate that had once ruled the whole north coast of Borneo, after Sarawak and North Borneo were carved out of it. A British protectorate with a Resident from 1906; oil was struck at Seria in 1929.'
    },
    {
      id: 'hongkong', en: 'Hong Kong', ja: '香港 (Honkon)', orig: '香港 (Hēunggóng)', zh: '香港',
      when: 'British from 1842', cat: 'british', lvl: 2, atoms: ['hongkong'],
      note: 'Hong Kong Island was ceded in 1842, Kowloon in 1860, and the New Territories leased for ninety-nine years in 1898.'
    },
    {
      id: 'solomons_br', en: 'British Solomon Islands', ja: 'ソロモン諸島', orig: 'Solomon Islands',
      zh: '所羅門群島', when: 'Protectorate from 1893', rule: 'British protectorate', cat: 'british',
      lvl: 3,
      atoms: ['solomons_br', 'solomons_gc', 'solomons_us', 'solomons_ml', 'solomons_al'],
      note: 'A British protectorate; Guadalcanal would become the turning point of the Pacific War in 1942–43.'
    },
    {
      id: 'mandate_jp', en: 'South Seas Mandate — the mandate boundary', ja: '南洋群島委任統治領の境界',
      zh: '南洋群島委任統治地界', when: 'Japanese from 1914; League Class C mandate from 1920',
      cat: 'jpcolony', lvl: 2, c: '#c2463d', atoms: ['mandate_jp'], unseen: true,
      note: 'Some two thousand islands — the Marianas except Guam, the Carolines and the Marshalls — with about 2,100 km² of land scattered across three million square miles of ocean, which is why the mandate is drawn here as a line and not as a shape. Japan took them from Germany in October 1914, held them under naval administration, and was granted them as a Class C mandate by the League in December 1920; Class C meant a territory could be governed as an integral part of the mandatory’s own. A civil South Seas Bureau ran them from Koror in Palau from 1922. Japanese settlers came with the sugar industry on Saipan and Tinian and outnumbered the islanders by the mid-1930s. Fortifying the islands was forbidden both by the mandate and by the Washington naval treaty; Japan gave notice of leaving the League in 1933, kept the islands, and fortified them anyway. They became the American Trust Territory of the Pacific Islands in 1947.'
    },
    {
      id: 'mandate_ex_guam', en: 'Guam — inside the line, outside the mandate',
      when: 'American since 1898; never part of the mandate', cat: 'american', lvl: 3,
      c: '#325d7b', atoms: ['mandate_ex_guam'], unseen: true,
      note: 'The mandate covered the Marianas <em>except Guam</em>, which is why every description of it says so. Spain ceded Guam to the United States in 1898, so when Japan took the German Marianas in 1914 it took the chain round an American island: Saipan, ninety miles north, was Japanese, and Guam was a US naval station with a small Marine garrison. The Japanese landed there on 10 December 1941, two days after Pearl Harbor, renamed it Ōmiyajima, and held it until the Americans retook it in July and August 1944.'
    },
    {
      id: 'mandate_au', en: 'Territory of New Guinea — the mandate boundary',
      when: 'Australian Class C mandate from 1920, run from Rabaul', cat: 'british', lvl: 3,
      c: '#c9a6b0', atoms: ['mandate_au'], unseen: true,
      note: 'German New Guinea south of the equator — the Kaiser-Wilhelmsland mainland, the Bismarck Archipelago, Bougainville and Buka — held by Australia as a Class C mandate from 1920 and administered from Rabaul, separately from Papua next door, which was Australian territory outright. Japan landed at Rabaul in January 1942 and made it the base for the whole southern campaign.'
    },
    {
      id: 'mandate_br', en: 'Nauru — the mandate boundary',
      when: 'British Class C mandate from 1920, administered by Australia', cat: 'british',
      lvl: 3, c: '#b07f8e', atoms: ['mandate_br'], unseen: true,
      note: 'One island, held as a Class C mandate jointly by Britain, Australia and New Zealand under the Nauru Island Agreement of 1919 and administered in practice by Australia. What it was held for was phosphate, worked by the British Phosphate Commissioners. Japan took it in August 1942 and deported most of the population to Truk.'
    },
    {
      id: 'gilberts', en: 'Gilbert & Ellice Islands', ja: 'ギルバート諸島', orig: 'Tungaru',
      zh: '吉爾伯特群島', when: 'British colony from 1916; a protectorate from 1892', cat: 'british',
      lvl: 3, atoms: ['gilberts', 'ellice'],
      note: 'Two scatters of atolls governed as one colony from Tarawa: the Gilberts on the equator, the Ellice Islands six hundred miles south, and Ocean Island — Banaba — off to the west, which was worked for phosphate by the British Phosphate Commissioners and is where the administration actually sat. Japan took the Gilberts in December 1941 and never reached the Ellice.'
    },
    {
      id: 'linephoenix', en: 'The Line & Phoenix Islands',
      when: 'Gilbert & Ellice Islands Colony', rule: 'British colony', cat: 'british', lvl: 3,
      atoms: ['linephoenix'],
      note: 'Two scatters of atolls east of the date line, run from Tarawa. Fanning carried the trans-Pacific telegraph cable from Vancouver to Australia, landed in 1902 and the reason these specks were worth holding. The Phoenix group was almost empty until the settlement scheme of 1938–40 moved Gilbertese families there against overcrowding at home. Canton Island and Enderbury were claimed by Britain and by the United States at once, and in 1939 the two agreed to administer them jointly for fifty years; Pan American Airways put a flying-boat base on Canton Island that year, on the route to New Zealand.'
    },
    {
      id: 'uspacific', en: 'Palmyra, Kingman Reef, Howland, Baker, Jarvis & Swains',
      when: 'American; most claimed under the Guano Islands Act', rule: 'American',
      cat: 'american', lvl: 3, atoms: ['uspacific'],
      note: 'Coral specks claimed for their guano in the 1850s and remembered eighty years later for their runways: an aircraft crossing the Pacific needed somewhere to land. Howland, Baker and Jarvis were settled in 1935–36 by young Hawaiians sent out to hold them, and the airstrip on Howland was built for Amelia Earhart, who vanished on the way to it in July 1937. Palmyra became a naval air station. Swains is a private copra island administered with American Samoa.'
    },
    {
      id: 'nzpacific', en: 'Tokelau & the northern Cook Islands',
      when: 'Administered by New Zealand', cat: 'british', lvl: 3, atoms: ['nzpacific'],
      note: 'Penrhyn, Manihiki, Rakahanga and Pukapuka are the northern Cooks, annexed by New Zealand in 1901. Tokelau — Atafu, Nukunonu and Fakaofo — was run from the Gilbert & Ellice Islands Colony until 1925 and handed to New Zealand then. They are drawn in the British colour because the map has no New Zealand one; the line above says who actually administered them.'
    },
    {
      id: 'indochina', en: 'French Indochina', ja: '仏印 (Futsuin)',
      orig: 'Đông Dương thuộc Pháp', zh: '法屬印度支那', when: 'French from the 1880s', cat: 'french',
      lvl: 1, atoms: ['indochina', 'siamgain'],
      note: 'Tonkin, Annam, Cochinchina, Cambodia and Laos under a single Governor-General at Hanoi. Shown as one territory because that is what it was: the borders of Vietnam, Laos and Cambodia are later.'
    },
    {
      id: 'dei', en: 'Netherlands East Indies', orig: 'Nederlandsch-Indië', when: 'Dutch',
      cat: 'dutch', lvl: 1, atoms: ['dei'],
      note: 'Java, Sumatra, the Dutch share of Borneo, the eastern islands and western New Guinea. Its oil would be the central economic prize of Japan’s southern advance.'
    },
    {
      id: 'philippines', en: 'Philippine Islands', ja: '比島 (Hitō)', orig: 'Pilipinas',
      zh: '菲律賓', when: 'American from 1898', cat: 'american', lvl: 1, atoms: ['philippines'],
      note: 'Taken from Spain in 1898 and held after a brutal war against Filipino republicans. A commonwealth with promised independence from 1935.'
    },
    {
      id: 'wake', en: 'Wake Island', orig: 'Wake', when: 'American from 1899',
      rule: 'American territory', cat: 'american', lvl: 3, atoms: ['wake'],
      note: 'An atoll on the trans-Pacific air route, annexed in 1899 and a Pan American flying-boat stop from 1935. A naval air station was begun in 1941.'
    },
    {
      id: 'guam', en: 'Guam', ja: 'グアム (Guamu)', orig: 'Guåhan', zh: '關島',
      when: 'American from 1898', rule: 'American territory', cat: 'american', lvl: 3,
      atoms: ['guam'],
      note: 'A US naval station sitting in the middle of the Japanese-held Marianas.'
    },
    {
      id: 'hawaii', en: 'Hawaii', orig: 'Hawaiʻi', zh: '夏威夷', when: 'Annexed 1898',
      rule: 'American territory', cat: 'american', lvl: 2, atoms: ['hawaii'],
      note: 'A US territory with a large Japanese immigrant population, and from 1919 the base of the US Pacific Fleet at Pearl Harbor.'
    },
    {
      id: 'aleutians', en: 'Aleutian Islands', orig: 'Unangam Tanangin', zh: '阿留申群島',
      when: 'Part of the Alaska Territory', rule: 'American territory', cat: 'american', lvl: 3,
      atoms: ['aleutians', 'aleutians_jp'],
      note: 'The chain reaching from Alaska towards Kamchatka; Attu and Kiska at its western end would be occupied by Japan in 1942.'
    },
    {
      id: 'turtle', en: 'Turtle & Mangsee Islands', orig: 'Kepulauan Penyu / Mangsee',
      when: 'Allocated to the Philippines by treaty, 2 January 1930',
      rule: 'Administered by British North Borneo', cat: 'american', lvl: 3,
      atoms: ['turtle', 'mangsee'], hatch: 'brit',
      note: 'Two small groups in the Sulu Sea that the British North Borneo Company had administered since the 1880s. The Anglo-American convention of 2 January 1930 placed them inside the boundary of the American Philippine Islands, but left the Company running them: the transfer was not actually made until 16 October 1947, to the independent Philippines. Drawn in the American colour with British diagonals, which is what the arrangement was.'
    },
    {
      id: 'miangas', en: 'Miangas (Palmas)', ja: 'ミアンガス島', orig: 'Miangas',
      when: 'Awarded to the Netherlands, 4 April 1928', cat: 'dutch', lvl: 3,
      atoms: ['miangas'],
      note: 'The Island of Palmas of the arbitration: the United States claimed it as part of the Philippines it had bought from Spain in 1898, the Netherlands claimed it by long administration, and Max Huber awarded it to the Netherlands on 4 April 1928 — the case that made continuous and peaceful display of authority the test of title, and one of the most cited decisions in international law. It lies nearer Mindanao than any Dutch island.'
    },
    {
      id: 'cocos', en: 'Cocos (Keeling) Islands', orig: 'Pulu Kokos',
      when: 'A Straits Settlement from 1903', rule: 'British colony, run from Singapore',
      cat: 'british', lvl: 3, atoms: ['cocos'],
      note: 'Two atolls in the Indian Ocean, held by the Clunies-Ross family under a grant of 1886 and attached to the Straits Settlements in 1903. The cable station on Direction Island linked Australia, Africa and Ceylon, which is why the Emden came for it in 1914 and was destroyed there.'
    },
    {
      id: 'spratly', en: 'Spratly Islands', ja: '新南群島 (Shinnan Guntō)',
      orig: 'Trường Sa / Kapuluan ng Kalayaan', zh: '南沙群島',
      when: 'Annexed by France, April 1930',
      rule: 'Claimed by France; Britain had claimed them earlier', cat: 'french', lvl: 3,
      atoms: ['spratly'],
      note: 'A scatter of sandbanks, cays and reefs with no permanent population. Britain claimed them from 1877 and did nothing with them; France occupied Spratly Island in April 1930 and annexed the group — nine islands, Itu Aba among them — in 1933, attaching it to Cochinchina. Japan disputed the claim throughout, worked the guano and phosphate, and took them in 1939. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'paracel', en: 'Paracel Islands', ja: '西沙群島 (Seisa Guntō)', orig: 'Hoàng Sa',
      zh: '西沙群島', when: 'Claimed by China and by France', cat: 'chinese', lvl: 3,
      atoms: ['paracel'],
      note: 'Claimed by the Republic of China as part of Guangdong and by France on behalf of Annam, and administered by neither in any continuous way in 1930. France occupied them in 1938 and Japan took them in 1939. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'pratas', en: 'Dōngshā (Pratas Island)', ja: '東沙島 (Tōsa-tō)', orig: '東沙島 (Dōngshā)',
      zh: '東沙島', when: 'Chinese, in Kwangtung province', cat: 'chinese', lvl: 3,
      atoms: ['pratas'],
      note: 'One island and its reef, 340 km south-east of Hong Kong. A Japanese merchant occupied it and worked the guano from 1907; China bought him out in 1909 and it has been administered from the mainland, and later from Taiwan, ever since. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'timor_pt', en: 'Portuguese Timor', orig: 'Timor Português', when: 'Portuguese',
      cat: 'portuguese', lvl: 3, atoms: ['timor_pt'],
      note: 'The eastern half of Timor, and one of the last fragments of the old Portuguese seaborne empire.'
    },
    {
      id: 'macau', en: 'Macao', ja: 'マカオ (Makao)', orig: '澳門 (Ou-mun)', zh: '澳門',
      when: 'Portuguese from the 1550s', cat: 'portuguese', lvl: 3, atoms: ['macau'],
      note: 'The oldest European settlement in East Asia, and neutral throughout the Pacific War.'
    },
    {
      id: 'siam', en: 'Siam', orig: 'สยาม (Sayam)', when: 'Never colonised', cat: 'independent',
      lvl: 2, atoms: ['siam'],
      note: 'The one state in Southeast Asia that kept its independence, by playing Britain and France against each other and ceding territory to both. Renamed Thailand in 1939.'
    },
    {
      id: 'ussr', en: 'Soviet Union (USSR)', orig: 'СССР (SSSR)', zh: '蘇聯', when: 'From 1922',
      cat: 'soviet', lvl: 1, atoms: ['ussr'],
      note: 'Japan had intervened in the Russian Civil War in Siberia from 1918 to 1922 and held northern Sakhalin until 1925. Relations along the Manchurian border stayed tense.'
    },
    {
      id: 'mongolia', en: 'Mongolian People’s Republic (Outer Mongolia)',
      orig: 'Бүгд Найрамдах Монгол Ард Улс', zh: '蒙古人民共和國', when: 'From 1924', cat: 'soviet',
      lvl: 2, c: '#d3d1e6', atoms: ['mongolia'],
      note: 'Independent of China in fact from 1911 and a Soviet satellite from 1924, though only the USSR recognised it.'
    },
    {
      id: 'australia', en: 'Australia', orig: 'Australia', zh: '澳大利亞', when: 'Dominion',
      cat: 'british', lvl: 2, c: '#c9a6b0', atoms: ['australia'],
      note: 'A self-governing dominion whose defence rested on the British naval base at Singapore.'
    },
    {
      id: 'newguinea_au', en: 'Papua & the Territory of New Guinea', ja: 'ニューギニア',
      orig: 'Niugini', zh: '新幾內亞', when: 'Australian territory & mandate', cat: 'british',
      lvl: 3, c: '#c9a6b0', atoms: ['newguinea_au'],
      note: 'Papua was an Australian territory; German New Guinea, taken in 1914, was held from 1920 under a League mandate — the southern counterpart of Japan’s.'
    },
    {
      id: 'nauru_au', en: 'Nauru', ja: 'ナウル', orig: 'Naoero', zh: '諾魯',
      when: 'Mandate from 1920', rule: 'Mandate — Australia, Britain and New Zealand',
      cat: 'british', lvl: 3, c: '#c9a6b0', atoms: ['nauru_au'],
      note: 'A phosphate island held under a mandate shared by Australia, Britain and New Zealand.'
    },
    {
      id: 'weihaiwei', en: 'Wēihǎi (Weihaiwei)', ja: '威海衛 (Ikaiei)', orig: '威海衛 (Wēihǎiwèi)',
      zh: '威海衛', when: 'Leased 1898, returned 1 October 1930', cat: 'british', lvl: 3,
      c: '#c08a99', atoms: ['weihaiwei'],
      note: 'Britain took the lease in 1898 to balance the Russian one at Lüshun, and used the harbour as the Royal Navy’s summer station. It was handed back to China in October 1930 — so on this map it is in its last months.'
    },
    {
      id: 'guangzhouwan', en: 'Guǎngzhōuwān (Kwangchowan)', ja: '広州湾 (Kōshūwan)',
      orig: 'Kouang-Tchéou-Wan', zh: '廣州灣', when: 'Leased to France 1898–1945', cat: 'french',
      lvl: 3, atoms: ['guangzhouwan'],
      note: 'A French leased territory on the Leizhou peninsula, administered from Indochina. Japan occupied it in February 1943; it went back to China in 1945.'
    },
    {
      id: 'tuva', en: 'Tannu Tuva (Tuvan People’s Republic)', orig: 'Тыва Арат Республик',
      zh: '唐努圖瓦', when: 'Independent in name from 1921', cat: 'soviet', lvl: 3, c: '#d3d1e6',
      atoms: ['tuva'], edge: '#bebada',
      note: 'Qing territory until 1911, then a Russian protectorate, then a nominally independent republic from 1921 — recognised only by the Soviet Union and Mongolia. Absorbed into the USSR in 1944. China went on claiming it.'
    },
    {
      id: 'nepal', en: 'Nepal', orig: 'नेपाल (Nepāl)', zh: '尼泊爾',
      when: 'Independent, in treaty with Britain', cat: 'other', lvl: 3, c: '#e2d9c6',
      atoms: ['nepal'],
      note: 'Never colonised, and recognised as fully independent by Britain in 1923, though bound to it by treaty and supplying the Gurkha regiments.'
    },
    {
      id: 'sikkim', en: 'Sikkim', orig: 'འབྲས་ལྗོངས (Drenjong)', zh: '錫金',
      when: 'British protectorate from 1861, recognised by China 1890', cat: 'british', lvl: 3,
      c: '#dcc2ce', atoms: ['sikkim'],
      note: 'A Himalayan kingdom under British protection, not a part of British India — which is why it is drawn apart from it here. The protectorate began with the Treaty of Tumlong in 1861, which followed a British punitive expedition and put Sikkim’s external relations in British hands; China recognised it, and the Sikkim–Tibet boundary was drawn, by the Convention of Calcutta of 17 March 1890.'
    },
    {
      id: 'bhutan', en: 'Bhutan', orig: 'འབྲུག་ཡུལ (Druk Yul)', zh: '不丹',
      when: 'British protectorate from 1910', cat: 'other', lvl: 3, c: '#c9a6b0',
      atoms: ['bhutan'],
      note: 'Internally self-governing, with Britain conducting its foreign relations under the Treaty of Punakha.'
    },
    {
      id: 'other', en: 'Afghanistan', orig: 'Afghanistan, Nepal, Bhutan', zh: '阿富汗・尼泊爾・不丹',
      cat: 'other', lvl: 3, atoms: ['other'],
      note: 'Outside the story of the Japanese Empire, drawn for context. Nepal, Bhutan and Sikkim were British protectorates rather than parts of British India, which is why they are not drawn inside it.'
    },
    {
      id: 'contested', en: 'Border is contested or not fixed', ja: '未確定国境', zh: '未定國界',
      cat: 'contested', lvl: 3, c: 'transparent', atoms: ['contested', 'contested_burma'],
      hatch: 'unclear',
      note: 'Four stretches of frontier that the sources on this map do not agree about, and that no treaty had settled: the Kachin country between Burma and Yunnan, the Pamirs where Xinjiang, Afghanistan and Kashmir meet, Aksai Chin, and the McMahon line east of Bhutan. The colours underneath are what the map draws elsewhere; the crossing lines say the line itself was in dispute.'
    },
  ],
  e1942: [
    {
      id: 'japan', en: 'Japan', ja: '内地 (Naichi)', orig: '日本 (Nihon)', zh: '日本內地',
      when: 'The metropole', cat: 'metropole', lvl: 1, atoms: ['japan'],
      note: 'Untouched by the war so far, apart from the Doolittle raid of April 1942. Systematic bombing would begin once the Marianas fell in 1944.'
    },
    {
      id: 'ryukyu', en: 'Ryūkyū and Ōsumi Islands', ja: '沖縄県・鹿児島県 (Okinawa-ken・Kagoshima-ken)',
      orig: '琉球 (Ruuchuu)', zh: '琉球・沖繩縣', when: 'Annexed 1879',
      rule: 'Okinawa Prefecture, and Kagoshima from the Amami group north', cat: 'metropole',
      lvl: 1, atoms: ['ryukyu'],
      note: 'A prefecture, not a colony, though it was governed and garrisoned as a frontier. The Battle of Okinawa in 1945 killed roughly a quarter of the civilian population.'
    },
    {
      id: 'ogasawara', en: 'Bonin Islands (Ogasawara)', ja: '小笠原諸島 (Ogasawara Shotō)',
      orig: '小笠原諸島', zh: '小笠原群島', when: 'Claimed 1876',
      rule: 'Japanese, part of Tokyo prefecture', cat: 'metropole', lvl: 3,
      atoms: ['ogasawara'],
      note: 'The chain that includes Iwo Jima, fortified as the last barrier on the direct approach to Tokyo.'
    },
    {
      id: 'chishima', en: 'Kurile Islands (Chishima)', ja: '千島列島 (Chishima Rettō)',
      orig: 'Курильские острова', zh: '千島群島', when: 'Japanese from 1875', cat: 'metropole',
      lvl: 2, atoms: ['chishima'],
      note: 'The Pearl Harbor strike force sailed from Hitokappu Bay in these islands in November 1941. Seized by the USSR in 1945 and still disputed.'
    },
    {
      id: 'chosen', en: 'Chōsen (Korea)', ja: '朝鮮 (Chōsen)', orig: '조선 (Chosŏn)', zh: '朝鮮',
      ko: '조선 (Chosŏn)', when: 'Annexed 1910–1945', cat: 'colony', lvl: 1, atoms: ['korea'],
      note: 'By 1942 under the assimilation drive: Korean-language teaching suppressed, Japanese names imposed from 1940, and mobilisation of labour and, from 1944, conscription.'
    },
    {
      id: 'formosa', en: 'Taiwan (Formosa)', ja: '臺灣 (Taiwan)', orig: '臺灣 (Tâi-oân)', zh: '臺灣',
      when: 'Japanese colony 1895–1945', cat: 'colony', lvl: 1, atoms: ['taiwan'],
      note: 'The oldest colony and the staging ground for the invasion of the Philippines in December 1941.'
    },
    {
      id: 'karafuto', en: 'Karafuto (southern Sakhalin)', ja: '樺太 (Karafuto)',
      orig: 'Южный Сахалин', zh: '樺太（南薩哈林）', when: 'Japanese 1905–1945', cat: 'colony', lvl: 1,
      atoms: ['karafuto'],
      note: 'Coal, timber and fisheries, and the only land border Japan shared with the Soviet Union. Lost in August 1945.'
    },
    {
      id: 'kwantung', en: 'Kwantung Leased Territory', ja: '関東州 (Kantōshū)',
      orig: '關東州 (Guāndōngzhōu)', zh: '關東州', when: 'Leased 1905–1945', cat: 'colony', lvl: 2,
      atoms: ['kwantung'], edge: '#9a1813',
      note: 'Nominally Manchukuo’s, in that the new state re-granted the lease in 1932; in practice a Japanese leasehold with its own administration to the end, and the seat of the Kwantung Army that had taken Manchuria. Lüshun and Dalian are inside it.'
    },
    {
      id: 'nanyo', en: 'South Seas Mandate', ja: '南洋群島 (Nan’yō Guntō)', zh: '南洋群島',
      when: 'Japanese from 1914; League mandate from 1920', rule: 'Japanese mandate',
      cat: 'colony', lvl: 2, atoms: ['nanyo'],
      note: 'Fortified through the 1930s in defiance of the mandate’s terms, and the anchorage of the Combined Fleet at Truk. The dotted line shows the boundary of the mandate; the islands themselves are specks at this scale. The Americans took them atoll by atoll in 1943–44.'
    },
    {
      id: 'manchukuo', en: 'Manchukuo (Manchuria)', ja: '満洲国 (Manshūkoku)', orig: '滿洲國',
      zh: '滿洲國', when: 'Japanese-occupied; nominally independent from March 1932',
      cat: 'puppet', lvl: 1, atoms: ['manchukuo'], under: '滿洲國',
      note: 'Invaded from September 1931 and proclaimed independent under the last Qing emperor Puyi. Rehe was added in 1933; the eastern Inner Mongolian leagues had been part of the three provinces all along and became its Hinggan provinces. Real power lay with the Kwantung Army and Japanese vice-ministers.'
    },
    {
      id: 'mengjiang', en: 'Měngjiāng (Mengchiang)', ja: '蒙古自治邦 (Mōko Jichihō)', orig: '蒙古自治邦',
      zh: '蒙古自治邦',
      when: 'Renamed the Mongol Autonomous Federation, August 1941; federated September 1939; Japanese client from 1936',
      cat: 'puppet', lvl: 2, atoms: ['mengjiang'],
      note: 'The Inner Mongolian autonomous government under Prince Demchugdongrub, with its capital at Zhangjiakou and built out of the Chinese provinces of Chahar and Suiyuan. Japanese-sponsored Mongol governments date from 1936, and the regime changed its name more than once: the federation of September 1939 joined the Mongol leagues to two Chinese-populated administrations — Chanan out of southern Chahar and Jinbei out of northern Shanxi — as the Mengchiang United Autonomous Government, and in August 1941 that was renamed the Mongol Autonomous Federation, 蒙古自治邦, which is what it was called in December 1942. Switch Administrative on and the three parts are named. The line indicates claimed Mengjiang territory and the fill indicates approximate simplified area of control.'
    },
    {
      id: 'nanjinggov', en: 'Japanese-occupied China (approximate)', ja: '日本占領地区',
      orig: '日軍佔領區', zh: '日軍佔領區（大略）',
      when: 'Occupied from 1937; Nanking government from March 1940', cat: 'occupied', lvl: 1,
      atoms: ['occupiedzone'], srcOnly: 'traced',
      note: 'Governed on paper by Wang Jingwei’s collaborationist government at Nanjing, with the far south under military administration instead. Traced from a 1940 map of the occupation and adjusted to December 1942: the plains, the railways and the cities of the north and the Yangtze valley, the Guangzhou delta from October 1938, Hainan from February 1939, and the ports of Xiamen and Shantou. Western Shanxi and Henan, most of Hunan, Jiangxi and Fujian were never taken, Changsha held out until 1944, and Communist and Nationalist guerrillas operated in force inside the line as well as beyond it — the shading marks where Japanese authority reached, not where it was unchallenged.'
    },
    {
      id: 'indochina', en: 'French Indochina', ja: '仏印 (Futsuin)',
      orig: 'Đông Dương thuộc Pháp', zh: '法屬印度支那', when: 'Occupied September 1940 – July 1941',
      cat: 'occupied', lvl: 2, atoms: ['indochina'],
      note: 'Japanese troops entered the north in September 1940 and the south in July 1941 — the step that brought the American oil embargo. Vichy French governors, courts and police stayed at their desks until the coup of 9 March 1945, but they governed on Japanese terms: the colony is drawn as occupied because that is what decided things in it. Japan set the rice quotas, took the airfields and the ports, and let Thailand carry off four provinces in 1941. Requisition and the collapse of transport then produced the Tonkin famine of 1944–45, in which perhaps a million people died.'
    },
    {
      id: 'burma', en: 'Burma', ja: '緬甸 (Biruma)', orig: 'မြန်မာ (Myanma)', zh: '緬甸',
      when: 'Taken 1942; nominal independence August 1943', cat: 'occupied', lvl: 2,
      atoms: ['burma'],
      note: 'Separated from British India in 1937 and overrun in the first half of 1942, closing the Burma Road to Chongqing. Ba Maw headed the nominally independent state declared in 1943.'
    },
    {
      id: 'saharat', en: 'Kengtung and the trans-Salween Shan states',
      orig: 'สหรัฐไทยเดิม (Saharat Thai Doem)',
      when: 'Thai-occupied 1942; transferred August 1943', cat: 'occupied', lvl: 3,
      atoms: ['saharat'], hatch: 'thai', outline: true, outlineColor: '#3da492',
      note: 'Thai troops crossed into the Shan states behind the Japanese advance in May 1942 and took Kengtung, and by December they were administering the country east of the Salween. It was still legally Burmese: Japan did not hand it over until 20 August 1943, when it became Saharat Thai Doem, the "original Thai territories". Not everything Thailand claimed in the Shan and Karenni states was granted. It went back to Burma in 1945.'
    },
    {
      id: 'malaya', en: 'Malaya & Shōnantō (Singapore)', ja: '馬来 (Marai)・昭南島 (Shōnantō)',
      orig: 'Tanah Melayu / Syonan', zh: '馬來亞・昭南島',
      when: 'Invaded 8 December 1941; Singapore fell 15 February 1942', cat: 'occupied', lvl: 1,
      atoms: ['malaya', 'christmas'],
      note: 'The seventy-day campaign down the peninsula ended in the largest capitulation in British military history. Singapore was renamed Shōnantō, "light of the south"; the Sook Ching massacres of Chinese residents followed within weeks.'
    },
    {
      id: 'malaya_thai', en: 'Kedah, Perlis, Kelantan & Trengganu', ja: 'マレー北部四州',
      orig: 'Kedah, Perlis, Kelantan, Terengganu', zh: '馬來北部四邦',
      when: 'Transferred to Thailand, October 1943', cat: 'occupied', lvl: 3,
      atoms: ['malaya_thai'], outline: true, outlineColor: '#dd3e2c',
      note: 'In December 1942 these four northern Malay states are under Japanese military administration with the rest of Malaya. On 20 August 1943 Japan agreed to hand them to Thailand, and the transfer took effect that October — the price of the alliance, and a restoration of what Siam had given up to Britain in 1909. They went back to British rule in 1945.'
    },
    {
      id: 'borneo_br', en: 'British Borneo (Kita Boruneo)', ja: '北ボルネオ (Kita Boruneo)',
      orig: 'Borneo', zh: '英屬婆羅洲',
      when: 'Landings 16 December 1941; British surrender 1 April 1942', cat: 'occupied',
      lvl: 3, atoms: ['sarawak', 'northborneo', 'brunei'],
      note: 'Taken first, and quickly, for the oilfields at Miri and Seria. Sarawak, Brunei, North Borneo and Labuan lost their separate identities: Japan ran them together as one military administration under Kawaguchi Kiyotake and called the whole Kita Boruneo, northern Borneo, with Labuan renamed Maeda-shima. British administration returned in September 1945.'
    },
    {
      id: 'dei', en: 'Netherlands East Indies', orig: 'Nederlandsch-Indië',
      when: 'Conquered January – March 1942', cat: 'occupied', lvl: 1, atoms: ['dei'],
      note: 'The object of the whole southern advance. The Dutch surrendered on 8 March 1942; Sukarno and other nationalists chose to work with the occupation.'
    },
    {
      id: 'philippines', en: 'Philippine Islands', ja: '比島 (Hitō)', orig: 'Pilipinas',
      zh: '菲律賓', when: 'Invaded December 1941; Corregidor fell 6 May 1942', cat: 'occupied',
      lvl: 1, atoms: ['philippines'],
      note: 'A US commonwealth, promised full independence in 1946. MacArthur withdrew to Australia in March 1942. On 14 October 1943 Japan declared the Second Philippine Republic under José Laurel — nominal independence inside the Greater East Asia Co-Prosperity Sphere, with Japanese troops in place and a large guerrilla resistance in the hills. MacArthur returned in October 1944.'
    },
    {
      id: 'hongkong', en: 'Hong Kong', ja: '香港 (Honkon)', orig: '香港 (Hēunggóng)', zh: '香港',
      when: 'Attacked 8 December 1941; surrendered 25 December 1941', cat: 'occupied', lvl: 2,
      atoms: ['hongkong'],
      note: 'Held for eighteen days and then occupied until 1945, its population halved by deportation and hunger.'
    },
    {
      id: 'turtle', en: 'Turtle & Mangsee Islands', orig: 'Kepulauan Penyu / Mangsee',
      when: 'Taken with British Borneo, January 1942', rule: 'Under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['turtle', 'mangsee'],
      note: 'Still administered by the British North Borneo Company on paper, and inside the Philippine boundary drawn in 1930; in December 1942 both they and the Philippines were Japanese, and the transfer that the 1930 treaty provided for was made in 1947, five years after this map.'
    },
    {
      id: 'miangas', en: 'Miangas (Palmas)', ja: 'ミアンガス島', orig: 'Miangas',
      when: 'Taken with the Netherlands Indies, 1942', cat: 'occupied', lvl: 3,
      atoms: ['miangas'],
      note: 'Dutch since the arbitration of 1928, which the United States had brought claiming it as part of the Philippines. Japan took both in the same three months.'
    },
    {
      id: 'cocos', en: 'Cocos (Keeling) Islands', orig: 'Pulu Kokos',
      when: 'Never occupied; shelled 25 December 1942',
      rule: 'British colony, run from Singapore — Allied throughout', cat: 'allied', lvl: 3,
      atoms: ['cocos'], hatch: 'raid',
      note: 'One of the few places inside this frame that Japan neither took nor bypassed but simply could not reach. The garrison held the cable and wireless station through the war; a submarine shelled the islands on Christmas Day 1942, and in May 1942 the Ceylon Garrison Artillery detachment mutinied there and three men were hanged — the only British Commonwealth soldiers executed for mutiny in the war. Airfields were built in 1944 for the bombing of Java and Singapore.'
    },
    {
      id: 'spratly', en: 'Shinnan Guntō (Spratly & Paracel Islands)', ja: '新南群島・西沙群島',
      orig: 'Trường Sa / Hoàng Sa', zh: '南沙群島・西沙群島', when: 'Annexed to Taiwan, 30 March 1939',
      rule: 'Japanese, administered from Takao in Taiwan', cat: 'colony', lvl: 3,
      atoms: ['spratly', 'paracel'],
      note: 'Japan took both groups in 1939, over French protest, and attached them to Takao prefecture in Taiwan as the Shinnan Guntō — the "new southern islands". They were a submarine and seaplane anchorage on the flank of the route to Singapore and the Indies, and Itu Aba had a garrison and a small base. Both went back to being disputed in 1945. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'pratas', en: 'Dōngshā (Pratas Island)', ja: '東沙島 (Tōsa-tō)', orig: '東沙島 (Dōngshā)',
      zh: '東沙島', when: 'Occupied by Japan', cat: 'occupied', lvl: 3, atoms: ['pratas'],
      note: 'Held by Japan through the war as a weather and radio station on the approach to Hong Kong and the Guangzhou delta. Islands are traced from present-day shapes, which does not reflect more recent land reclamation.'
    },
    {
      id: 'timor_pt', en: 'Portuguese Timor (contested)', orig: 'Timor Português',
      when: 'Invaded February 1942; Allied withdrawal December 1942 – February 1943',
      cat: 'portuguese', lvl: 3, atoms: ['timor_pt'], hatch: 'occupied',
      note: 'Neutral Portuguese territory, invaded anyway in February 1942 after a small Allied force landed there first. In December 1942 it is still being fought over: Australian and Dutch commandos are running a guerrilla campaign in the hills, and are withdrawn over the following two months, after which Japan holds the colony to the end of the war. Drawn in the Portuguese colour with Japanese stripes across it for that reason. Between 40,000 and 70,000 Timorese died.'
    },
    {
      id: 'wake', en: 'Wake Island', ja: 'ウェーク島・大鳥島 (Ōtorishima)', orig: 'Wake',
      when: 'Taken 23 December 1941', rule: 'American territory under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['wake'],
      note: 'The garrison beat off the first landing on 11 December — one of the very few times in the war an amphibious assault was stopped at the water’s edge — and surrendered to the second on the 23rd. Renamed Ōtorishima. Japan held it to the surrender in 1945, bypassed and starving; ninety-eight American civilian prisoners kept on the island were murdered there in October 1943.'
    },
    {
      id: 'guam', en: 'Guam (Ōmiyajima)', ja: '大宮島 (Ōmiyajima)', orig: 'Guåhan', zh: '關島',
      when: 'Taken 10 December 1941', rule: 'American territory under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['guam'],
      note: 'The one American possession inside the Japanese-held Marianas, renamed Ōmiyajima and retaken in 1944.'
    },
    {
      id: 'gilberts', en: 'Gilbert Islands', ja: 'ギルバート諸島', orig: 'Tungaru', zh: '吉爾伯特群島',
      when: 'Occupied December 1941', rule: 'British colony under Japanese occupation',
      cat: 'occupied', lvl: 3, atoms: ['gilberts'],
      note: 'The outermost ring of the perimeter. The assault on Tarawa in November 1943 opened the American drive across the central Pacific — seventy-six hours of fighting for an islet of barely more than a square kilometre, and the casualty lists that followed changed how the rest of the campaign was planned. Ocean Island (Banaba), off to the west, was taken in August 1942 and most of its people deported to Nauru, Kosrae and Tarawa; the garrison there murdered the roughly 150 labourers who remained on 20 August 1945, five days after the surrender, and one man survived by hiding in a cave. The Ellice Islands, the southern half of the same colony, were never occupied and are drawn separately here for that reason.'
    },
    {
      id: 'ellice', en: 'Ellice Islands',
      when: 'Never occupied; American bases from October 1942', rule: 'British colony',
      cat: 'allied', lvl: 3, atoms: ['ellice'], hatch: 'us',
      note: 'Nine atolls and reef islands, the southern half of the Gilbert & Ellice Islands Colony, and the nearest unoccupied ground to the Gilberts. American marines landed on Funafuti on 2 October 1942 and built an airfield there, with two more on Nanumea and Nukufetau the following year; Funafuti was the base the assault on Tarawa and Makin was mounted from in November 1943. Japanese aircraft bombed it from the Gilberts in the meantime. The islanders were moved off the airfield sites and the atolls were left with the runways, the scrap and the borrow pits when the war moved north.'
    },
    {
      id: 'linephoenix', en: 'The Line & Phoenix Islands', when: 'Never occupied',
      rule: 'British colony', cat: 'allied', lvl: 3, atoms: ['linephoenix'],
      note: 'Part of the same colony as the Gilberts and never reached by it. American troops landed on Christmas Island and Fanning in February 1942 and built airfields there, under British sovereignty, to cover the ferry route to Australia; Canton Island, already an airline base under the joint Anglo-American administration agreed in 1939, became a staging field and a submarine refuelling point. Japan came no further east than Tarawa, six hundred miles away.'
    },
    {
      id: 'uspacific', en: 'Palmyra, Kingman Reef, Howland, Baker, Jarvis & Swains',
      when: 'Shelled December 1941; held throughout', rule: 'American', cat: 'american', lvl: 3,
      atoms: ['uspacific'],
      note: 'Japanese bombers from Kwajalein struck Howland and Baker on 8 December 1941, the day after Pearl Harbor, killing two of the young Hawaiian colonists; the survivors were taken off at the end of January. Palmyra was a naval air station and was shelled once; Kingman Reef was a seaplane anchorage. None of them was taken, and the chain of runways across these atolls is what made the supply line to Australia and the Solomons possible.'
    },
    {
      id: 'nzpacific', en: 'Tokelau & the northern Cook Islands', when: 'Never occupied',
      rule: 'New Zealand administration', cat: 'allied', lvl: 3, atoms: ['nzpacific'],
      note: 'Penrhyn was surveyed for an airfield in 1942 and built by American engineers that year as a staging point on the southern ferry route; the other atolls saw the war only as ships passing. They are drawn in the Allied colour because the map has no New Zealand one; the line above says who administered them.'
    },
    {
      id: 'nauru_au', en: 'Nauru', ja: 'ナウル', orig: 'Naoero', zh: '諾魯',
      when: 'Occupied August 1942', rule: 'Mandate under Japanese occupation', cat: 'occupied',
      lvl: 3, atoms: ['nauru_au'],
      note: 'Held for its phosphate and then bypassed and starved; most of the population was deported to Truk.'
    },
    {
      id: 'andaman', en: 'Andaman & Nicobar Islands', ja: '安達曼・ニコバル諸島',
      orig: 'Andaman & Nicobar', zh: '安達曼・尼科巴群島',
      when: 'Occupied March 1942; ceded to Azad Hind December 1943', cat: 'occupied', lvl: 2,
      atoms: ['andaman'],
      note: 'The only Indian territory Japan held. In December 1943 they were handed nominally to Subhas Chandra Bose’s Provisional Government of Free India and renamed Shaheed and Swaraj — "martyr" and "self-rule". The transfer was a gesture: the Japanese navy kept real control, and the occupation was harsh.'
    },
    {
      id: 'newguinea_au', en: 'New Guinea (Papua & the Mandated Territory)', ja: 'ニューギニア',
      orig: 'Niugini', zh: '新幾內亞', when: 'Taken from Australia in 1942',
      rule: 'Australian territory and mandate, part under Japanese occupation', cat: 'occupied',
      lvl: 2, atoms: ['newguinea_au'],
      note: 'Rabaul, on New Britain, fell in January 1942 and became the greatest Japanese base south of Truk, and the north coast of the mainland followed. Port Moresby was the objective and was never reached: the overland push across the Kokoda Track was turned back in September 1942, and in December the fighting was at the Buna–Gona beachhead. The island was the southern limit of the advance and the ground the counter-offensive started from.'
    },
    {
      id: 'solomons_br', en: 'Western Solomons', ja: 'ソロモン諸島西部', orig: 'Solomon Islands',
      zh: '所羅門群島西部', when: 'Occupied from early 1942',
      rule: 'British protectorate under Japanese occupation', cat: 'occupied', lvl: 2,
      atoms: ['solomons_br'],
      note: 'Choiseul, Santa Isabel, New Georgia, Kolombangara and the Shortlands were Japanese, with airfields and a seaplane base at Rekata Bay, and stayed so until the Allies came up the chain through 1943.'
    },
    {
      id: 'guadalcanal_i', en: 'Guadalcanal (contested)', ja: 'ガダルカナル島（争奪中）',
      orig: 'Guadalcanal', zh: '瓜達爾卡納爾島（爭奪中）',
      when: 'American landing 7 August 1942; fought over into February 1943', cat: 'occupied',
      lvl: 2, atoms: ['solomons_gc'], hatch: 'us',
      note: 'In December 1942 the island was divided: the Americans held the airfield and the perimeter around it, the Japanese the ground to the west, and neither could dislodge the other. It is drawn in the occupation colour with American stripes across it for that reason — the only place on the map with two flags over it. Japan evacuated in the first week of February 1943, and the campaign is usually taken as the point at which the initiative changed hands.'
    },
    {
      id: 'tulagi', en: 'Tulagi and the Florida Islands', ja: 'ツラギ・フロリダ諸島', orig: 'Tulagi',
      zh: '圖拉吉・佛羅里達群島', when: 'Taken by the Americans 7–8 August 1942', cat: 'allied', lvl: 3,
      atoms: ['solomons_us'],
      note: 'Two different places under one shape, and they answer differently. Tulagi was the old seat of the British protectorate and the Japanese garrison in this corner of the Solomons: seized on 3 May 1942 and held until the Marines landed on 7 August, with Tulagi secured the following afternoon and Gavutu and Tanambogo, the two islets across the harbour, taken in the same two days. Almost the whole garrison of about three hundred and fifty died; some forty swam across to Florida. Florida itself — Nggela Sule and Nggela Pile, the large island north of Tulagi, with the islets round it — was never Japanese- held. The landings there on 7 August, at Haleta and Halavo, were unopposed covering parties for the assault on Tulagi and were withdrawn the same day. By this map’s date Tulagi’s harbour was an Allied base with a motor torpedo boat flotilla at Sesapi, and the seaplane base at Halavo on Florida was being built.'
    },
    {
      id: 'malaita', en: 'Malaita (never fully occupied)', ja: 'マライタ島', orig: 'Malaita',
      zh: '馬萊塔島', when: 'Raided but never held', cat: 'allied', lvl: 3, atoms: ['solomons_ml'],
      note: 'Japanese patrols and coastwatcher hunts reached the island, but it was never occupied: the protectorate administration and its coastwatchers stayed on it throughout, which is why it keeps the British colour outright.'
    },
    {
      id: 'solomons_allied', en: 'The central & eastern Solomons and the Santa Cruz Islands',
      ja: 'ソロモン諸島中部・東部・サンタクルーズ諸島', orig: 'Makira / Nendö', zh: '所羅門群島中部・東部・聖克魯斯群島',
      when: 'British throughout', cat: 'allied', lvl: 3, atoms: ['solomons_al'],
      note: 'San Cristobal, Ulawa, Rennell and Bellona, and the Santa Cruz group 500 km further east — Nendö, Utupua, Vanikoro and Tinakula. Nearer in, the Russell Islands, Savo and the Nggela islets. All of it was the British protectorate and none of it was taken: the occupation stopped in the western chain, and the perimeter runs west of these islands. The carrier battle of the Santa Cruz Islands was fought north of them in October 1942 and the naval battle of Rennell Island off Rennell in January 1943. Two of these had no garrison of either side at this date, which the one colour cannot show. Savo, off which the cruiser action of 9 August 1942 was fought, was visited by Japanese boats and patrolled by American raiders in September, and held by neither. The Russell Islands were a Japanese barge staging point during the Guadalcanal campaign but had no garrison until 28 January 1943, when six destroyers put 328 men ashore to cover the evacuation of Guadalcanal; they were gone by 11 February, and the American landing on 21 February was unopposed.'
    },
    {
      id: 'attukiska', en: 'Attu and Kiska', ja: 'アッツ島・キスカ島', orig: 'Atan / Qisxa',
      zh: '阿圖島・基斯卡島',
      when: 'Occupied June 1942; Attu retaken May 1943, Kiska evacuated July 1943',
      cat: 'occupied', lvl: 3, atoms: ['aleutians_jp'],
      note: 'The only North American soil Japan occupied, taken during the Midway operation and held for a year. Attu fell to the Americans in May 1943 after the garrison charged and was destroyed; Kiska was evacuated under cover of fog in July and the landing three weeks later met nobody. The rest of the Aleutian chain stayed American throughout, which is why the line round these two is drawn on its own.'
    },
    {
      id: 'aleutians', en: 'Aleutian Islands', orig: 'Unangam Tanangin', zh: '阿留申群島',
      when: 'American throughout, but for Attu and Kiska', rule: 'American territory',
      cat: 'american', lvl: 3, atoms: ['aleutians'],
      note: 'The chain runs from Alaska almost to Kamchatka. Japan took only Attu and Kiska at its western end; the rest was American, and Adak and Amchitka became the bases from which they were retaken.'
    },
    {
      id: 'thailand', en: 'Thailand', orig: 'ประเทศไทย (Prathet Thai)',
      when: 'Alliance signed 21 December 1941', cat: 'cobelligerent', lvl: 2,
      atoms: ['siam', 'siamgain'], edge: '#8dd3c7', edgeAtoms: ['siam', 'siamgain'],
      edgeClip: [100, 11.5, 106.2, 20.6], edgeWidth: 6,
      note: 'Invaded on 8 December 1941, it capitulated in hours, granted passage to the invasion of Malaya and Burma, allied with Japan and declared war on Britain and the United States. It was rewarded with territory in Malaya, Burma, Cambodia and Laos.'
    },
    {
      id: 'cededthai', en: 'Battambang & Siem Reap (ceded to Thailand, 1941)',
      ja: '泰国への割譲地 (1941)', orig: 'Phra Tabong / Phibunsongkhram / Lan Chang',
      zh: '割讓予泰國之地（1941）', when: 'Ceded 9 May 1941, returned 1946', cat: 'cobelligerent',
      lvl: 3, atoms: ['siamgain'],
      note: 'Taken from French Indochina after the Franco-Thai war and handed to Thailand under Japanese mediation: Battambang and Siem Reap in Cambodia, and the Lao country west of the Mekong. Renamed Phra Tabong, Phibunsongkhram, Nakhon Champasak and Lan Chang. Angkor itself was left to France. All of it went back in 1946.'
    },
    {
      id: 'freechina', en: 'Republic of China (Nationalist government)',
      ja: '中華民国・重慶政権 (Chūka Minkoku)', orig: '中華民國 (Zhōnghuá Mínguó)', zh: '中華民國（重慶國民政府）',
      when: 'Capital at Chungking from 1938', cat: 'freechina', lvl: 1,
      atoms: ['china', 'suiyuan_w', 'chahar', 'suiyuan'],
      note: 'The unoccupied interior, governed by Chiang Kai-shek from Chongqing and supplied over the Burma Road until 1942 and then by air over "the Hump". The Communist base areas are drawn separately, in cross-hatching.'
    },
    {
      id: 'ccp', en: 'Communist base areas and guerrilla zones', ja: '中国共産党抗日根拠地',
      orig: '抗日根據地 (Kàngrì gēnjùdì)', zh: '中共抗日根據地', when: 'As they stood in 1941–1942',
      cat: 'ccp', lvl: 2, atoms: ['ccp'], srcOnly: 'traced',
      note: 'The base areas and guerrilla zones of the Eighth Route Army and the New Fourth Army, and the reason the occupied shading on this map is described as generous. Almost all of this ground lies inside the line the Japanese army had drawn round itself: Japan held the cities, the railways and the plains between them, and the countryside behind that line was fought over. The largest is Shǎngānníng, the border region round Yan’an, which was never occupied at all; the rest — Jìnchájì in the Wutai mountains, Jìlǔyù on the Hebei–Shandong plain, the Shandong and coastal pockets, and the New Fourth Army areas along the lower Yangtze — were inside it. Their extent moved from month to month, and the "mopping-up" campaigns of 1941–42 cut some of them badly; these are the areas as one atlas draws them for those two years, not a line anyone held.'
    },
    {
      id: 'britishindia', en: 'British India', when: 'The western limit of the advance',
      cat: 'allied', lvl: 1, atoms: ['india'],
      note: 'The front stopped at the Burmese border in 1942. The Quit India movement was suppressed that August, while the Indian National Army formed on the other side.'
    },
    {
      id: 'goa', en: 'Portuguese India — Goa, Damão, Diu, Dadra & Nagar Haveli',
      orig: 'Estado da Índia', when: 'Portuguese from 1510', cat: 'portuguese', lvl: 3,
      atoms: ['goa'],
      note: 'Goa, with Damão and Diu on the Gujarat coast and Dadrá and Nagar Aveli inland behind them, was the seat of the Estado da Índia and the oldest European possession in Asia. Portugal was neutral, and it stayed Portuguese until India took it by force in 1961.'
    },
    {
      id: 'pondicherry', en: 'French India — Pondicherry, Karikal, Yanaon, Mahé, Chandernagore',
      orig: 'Établissements français dans l’Inde', when: 'French from 1674', cat: 'french',
      lvl: 3, atoms: ['pondicherry'],
      note: 'Five scattered enclaves left to France when Britain took the rest of India: Pondicherry and Karikal on the Coromandel coast, Yanaon on the Godavari, Mahé on the Malabar coast, and Chandernagore on the Hooghly above Calcutta. They declared for the Free French in 1940 and were transferred to India in the 1950s.'
    },
    {
      id: 'princelystates', en: 'Princely states',
      when: 'Rulers in subsidiary alliance with the Crown', cat: 'allied', lvl: 3,
      atoms: ['princely'], adminOnly: true,
      note: 'British India was a patchwork: eleven provinces ruled directly, and beside them some six hundred princely states whose rulers kept their thrones under treaties with the Crown. Hyderabad, the largest, had its own army and currency, and the Nizam was reckoned the richest man alive. The states are drawn here from a layer of their 1931 boundaries rather than approximated from modern units, so the shapes are the shapes: the Rajputana and Central India agencies as one western mass, the Baluchistan states of Kalat and Las Bela, the Eastern States through Orissa and Chhattisgarh, the hill states along the frontier, and the small Deccan states scattered through Bombay. The very smallest of the six hundred are below the resolution of this map and are drawn inside whichever province surrounded them.'
    },
    {
      id: 'ceylon', en: 'Ceylon', orig: 'ලංකාව (Lanka)', zh: '錫蘭', when: 'Raided April 1942',
      cat: 'allied', lvl: 3, atoms: ['ceylon'],
      note: 'The Indian Ocean raid of April 1942 struck Colombo and Trincomalee and drove the Royal Navy west to East Africa.'
    },
    {
      id: 'australia', en: 'Australia', orig: 'Australia', zh: '澳大利亞',
      when: 'Bombed from February 1942', cat: 'allied', lvl: 2, c: '#c9a6b0',
      atoms: ['australia'],
      note: 'Never invaded, but Darwin was bombed from February 1942 and Australia became the base from which the counter-offensive in New Guinea was mounted.'
    },
    {
      id: 'hawaii', en: 'Hawaii', orig: 'Hawaiʻi', zh: '夏威夷', when: 'Attacked 7 December 1941',
      rule: 'American territory', cat: 'american', lvl: 1, atoms: ['hawaii'],
      note: 'The US Pacific Fleet base at Pearl Harbor. The attack missed the carriers and the fuel farm, and both would decide the war within a year.'
    },
    {
      id: 'ussr', en: 'Soviet Union (USSR)', orig: 'СССР (SSSR)', zh: '蘇聯',
      when: 'Neutrality Pact, April 1941', cat: 'neutral', lvl: 1, atoms: ['ussr'],
      note: 'At war with Germany but not with Japan: the Neutrality Pact of April 1941 held until the Soviet invasion of Manchuria in August 1945. Both sides kept large armies on the Manchurian border throughout. The frontier had already been fought over: an undeclared border war ran through the late 1930s and was settled at Nomonhan on the Manchukuo–Mongolian border in the summer of 1939, where Zhukov destroyed a Japanese division. That defeat is a large part of why the Japanese advance in 1941 went south rather than north.'
    },
    {
      id: 'mongolia', en: 'Mongolian People’s Republic', orig: 'Бүгд Найрамдах Монгол Ард Улс',
      zh: '蒙古人民共和國', when: 'Soviet satellite', cat: 'neutral', lvl: 2, c: '#d3d1e6',
      atoms: ['mongolia'],
      note: 'Its border with Manchukuo was the scene of the undeclared war at Nomonhan in 1939, whose outcome helped turn Japanese strategy south rather than north.'
    },
    {
      id: 'xinjiang', en: 'Xīnjiāng (Sinkiang)', ja: '新疆 (Shinkyō)', orig: 'شىنجاڭ (Shinjang)',
      zh: '新疆', when: 'Realigned with Chungking in 1942', cat: 'freechina', lvl: 3,
      atoms: ['xinjiang'], within: 'freechina',
      note: 'A province of the Republic in name, run since 1933 by Sheng Shicai on Soviet money and with Soviet troops in the province. He broke with Moscow in 1942 and turned to Chongqing, but he was still governing in December, and central rule only followed his removal in 1944. The overland road through Xinjiang had carried Soviet aid to China from 1937 to 1941.'
    },
    {
      id: 'tibet', en: 'Tibet', ja: 'チベット (Chibetto)', orig: 'བོད་ (Bod)', zh: '西藏',
      when: 'De facto independent', cat: 'frontier', lvl: 3, atoms: ['tibet'],
      note: 'Self-governing in practice and neutral in the war, it refused passage to an Allied supply route to China.'
    },
    {
      id: 'macau', en: 'Macao', ja: 'マカオ (Makao)', orig: '澳門 (Ou-mun)', zh: '澳門',
      when: 'Portuguese and neutral throughout', cat: 'portuguese', lvl: 3, atoms: ['macau'],
      note: 'Japan never occupied Macao and never raised its flag here: Portugal was neutral, the colony stayed Portuguese to the end of the war, and it filled with refugees from Hong Kong and Guangzhou — its population several times what it had been. That neutrality was held on Japanese sufferance, though. The colony was surrounded, and it was fed and policed by agreement; from 1943 Japanese "advisers" were installed and had their way in most things. It is drawn Portuguese because that is what it was, and this note is where the qualification belongs.'
    },
    {
      id: 'guangzhouwan', en: 'Guǎngzhōuwān (Kwangchowan)', ja: '広州湾 (Kōshūwan)',
      orig: 'Kouang-Tchéou-Wan', zh: '廣州灣', when: 'Leased to France 1898–1945', cat: 'french',
      lvl: 3, atoms: ['guangzhouwan'],
      note: 'A French leased territory on the Leizhou peninsula, run from Indochina and drawn like it: the French colour with Japanese stripes across it. In December 1942 Vichy French administration continued inside a Japanese-occupied region, and it was the last neutral door into south China — a smuggling route and an escape route. Japanese troops moved in in February 1943.'
    },
    {
      id: 'tuva', en: 'Tannu Tuva (Tuvan People’s Republic)', orig: 'Тыва Арат Республик',
      zh: '唐努圖瓦', when: 'Independent in name from 1921', cat: 'neutral', lvl: 3, c: '#d3d1e6',
      atoms: ['tuva'], edge: '#bebada',
      note: 'Qing territory until 1911, then a Russian protectorate, then a nominally independent republic from 1921 — recognised only by the Soviet Union and Mongolia. Absorbed into the USSR in 1944. China went on claiming it.'
    },
    {
      id: 'nepal', en: 'Nepal', orig: 'नेपाल (Nepāl)', zh: '尼泊爾',
      when: 'Independent, in treaty with Britain', cat: 'other', lvl: 3, c: '#e2d9c6',
      atoms: ['nepal'],
      note: 'Never colonised, and recognised as fully independent by Britain in 1923, though bound to it by treaty and supplying the Gurkha regiments.'
    },
    {
      id: 'sikkim', en: 'Sikkim', orig: 'འབྲས་ལྗོངས (Drenjong)', zh: '錫金',
      when: 'British protectorate from 1861, recognised by China 1890', cat: 'allied', lvl: 3,
      c: '#dcc2ce', atoms: ['sikkim'],
      note: 'A Himalayan kingdom under British protection, not a part of British India — which is why it is drawn apart from it here. The protectorate began with the Treaty of Tumlong in 1861, which followed a British punitive expedition and put Sikkim’s external relations in British hands; China recognised it, and the Sikkim–Tibet boundary was drawn, by the Convention of Calcutta of 17 March 1890.'
    },
    {
      id: 'bhutan', en: 'Bhutan', orig: 'འབྲུག་ཡུལ (Druk Yul)', zh: '不丹',
      when: 'British protectorate from 1910', cat: 'other', lvl: 3, c: '#c9a6b0',
      atoms: ['bhutan'],
      note: 'Internally self-governing, with Britain conducting its foreign relations under the Treaty of Punakha.'
    },
    {
      id: 'other', en: 'Afghanistan', orig: 'Afghanistan, Nepal, Bhutan', zh: '阿富汗・尼泊爾・不丹',
      cat: 'other', lvl: 3, atoms: ['other'],
      note: 'Outside the story of the Japanese Empire, drawn for context. Nepal, Bhutan and Sikkim were British protectorates rather than parts of British India, which is why they are not drawn inside it.'
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
      note: 'Three stretches of frontier that no treaty had settled and that the sources on this map do not agree about: the Pamirs, Aksai Chin, and the McMahon line east of Bhutan. The fourth, the Kachin country on the Burma frontier, is not marked on this date: by December 1942 that ground was under Japanese occupation, which is the more useful thing to say about it.'
    },
  ],
};

JMAP.SITES = [
  {
    id: 'tokyo', en: 'Tokyo', ja: '東京 (Tōkyō)', orig: '東京 (Tōkyō)', zh: '東京',
    date: 'Capital from 1868', cat: 'city', lvl: 1, lat: 35.68, lon: 139.76, year: 1868,
    note: 'Edo until the Restoration. The Great Kantō earthquake struck in 1923 and was followed by the massacre of Koreans; young officers of the Imperial Way faction seized the government quarter in the 2.26 Incident of February 1936 and killed three ministers; the firebombing of 9–10 March 1945 killed some 100,000 people in a night.'
  },
  {
    id: 'yokohama', en: 'Yokohama', ja: '横浜 (Yokohama)', orig: '横浜 (Yokohama)', zh: '橫濱',
    date: 'Treaty port opened 1859', cat: 'city', lvl: 2, lat: 35.44, lon: 139.64, year: 1859,
    note: 'The foreign settlement nearest Edo, and the terminus of Japan’s first railway in 1872.'
  },
  {
    id: 'uraga', en: 'Uraga', ja: '浦賀 (Uraga)', orig: '浦賀 (Uraga)', zh: '浦賀', date: 'July 1853',
    cat: 'battle', lvl: 3, lat: 35.25, lon: 139.72, year: 1853,
    note: 'Where Commodore Perry’s squadron anchored and demanded that Japan open. He returned in February 1854 with a larger fleet.'
  },
  {
    id: 'shimoda', en: 'Shimoda', ja: '下田 (Shimoda)', orig: '下田 (Shimoda)', zh: '下田',
    date: 'Opened 1854', cat: 'city', lvl: 3, lat: 34.67, lon: 138.95, year: 1854,
    note: 'One of the two ports opened by the Treaty of Kanagawa; Townsend Harris was the first American consul here, and negotiated the 1858 commercial treaty.'
  },
  {
    id: 'kyoto', en: 'Kyoto', ja: '京都 (Kyōto)', orig: '京都 (Kyōto)', zh: '京都',
    date: 'Imperial seat until 1868', cat: 'city', lvl: 2, lat: 35.01, lon: 135.77, year: 1868,
    note: 'The emperor’s city for over a thousand years, until the court moved to Tokyo. The Takikawa Incident at its Imperial University in 1933 marked the closing of academic freedom.'
  },
  {
    id: 'osaka', en: 'Osaka', ja: '大阪 (Ōsaka)', orig: '大阪 (Ōsaka)', zh: '大阪',
    date: 'Opened 1868', cat: 'city', lvl: 2, lat: 34.69, lon: 135.5, year: 1868,
    note: 'The commercial capital of Tokugawa Japan and later a centre of heavy industry and of labour organising. The rice riots of 1918, which began among fishermen\'s wives in Toyama, were at their worst here.'
  },
  {
    id: 'kobe', en: 'Kobe', ja: '神戸 (Kōbe)', orig: '神戸 (Kōbe)', zh: '神戶',
    date: 'Treaty port opened 1868', cat: 'city', lvl: 3, lat: 34.69, lon: 135.2, year: 1868,
    note: 'Shipbuilding and the main emigration port for Japanese leaving for Hawaii and the Americas.'
  },
  {
    id: 'nagoya', en: 'Nagoya', ja: '名古屋 (Nagoya)', orig: '名古屋 (Nagoya)', zh: '名古屋',
    date: 'Bombed 1944–1945', cat: 'city', lvl: 3, lat: 35.18, lon: 136.91, year: 1889,
    note: 'The centre of the aircraft industry, and for that reason among the most heavily bombed cities of the war.'
  },
  {
    id: 'hiroshima', en: 'Hiroshima', ja: '広島 (Hiroshima)', orig: '広島 (Hiroshima)', zh: '廣島',
    date: 'Atomic bomb, 6 August 1945', cat: 'city', lvl: 1, lat: 34.39, lon: 132.46,
    year: 1894,
    note: 'Army headquarters and the embarkation port for the continent since 1894. Destroyed by the first atomic bomb; around 140,000 were dead by the end of the year.'
  },
  {
    id: 'nagasaki', en: 'Nagasaki', ja: '長崎 (Nagasaki)', orig: '長崎 (Nagasaki)', zh: '長崎',
    date: 'Atomic bomb, 9 August 1945', cat: 'city', lvl: 1, lat: 32.74, lon: 129.87,
    year: 1641,
    note: 'The Dutch post at Dejima made this Japan’s only window on Europe under the Tokugawa. Destroyed by the second atomic bomb; around 70,000 were dead by the end of the year.'
  },
  {
    id: 'shimonoseki', en: 'Shimonoseki', ja: '下関 (Shimonoseki)', orig: '下関 (Shimonoseki)',
    zh: '下關', date: 'Bombarded 1864; treaty signed April 1895', cat: 'city', lvl: 2, lat: 33.96,
    lon: 130.94, year: 1864,
    note: 'Chōshū’s straits, shelled by a four-power squadron in 1864. The Treaty of Shimonoseki ended the First Sino-Japanese War and handed Taiwan to Japan.'
  },
  {
    id: 'kagoshima', en: 'Kagoshima', ja: '鹿児島 (Kagoshima)', orig: '鹿児島 (Kagoshima)', zh: '鹿兒島',
    date: 'Bombarded 1863; rebellion 1877', cat: 'city', lvl: 2, lat: 31.6, lon: 130.56,
    year: 1863,
    note: 'Castle town of Satsuma, shelled by the Royal Navy in 1863 over the Richardson Affair, and the base of Saigō Takamori’s rebellion in 1877.'
  },
  {
    id: 'hakodate', en: 'Hakodate', ja: '函館 (Hakodate)', orig: '函館 (Hakodate)', zh: '函館',
    date: 'Opened 1854; Republic of Ezo 1869', cat: 'city', lvl: 3, lat: 41.77, lon: 140.73,
    year: 1854,
    note: 'One of the first two ports opened to the Americans, and the site of the last Tokugawa resistance in the Boshin War.'
  },
  {
    id: 'sapporo', en: 'Sapporo', ja: '札幌 (Sapporo)', orig: '札幌 (Sapporo)', zh: '札幌',
    date: 'Founded 1869', cat: 'city', lvl: 3, lat: 43.06, lon: 141.35, year: 1869,
    note: 'Laid out on a grid as the headquarters of the Hokkaidō Colonisation Commission, the agency that settled the island and dispossessed the Ainu.'
  },
  {
    id: 'tsushima', en: 'Tsushima Strait', ja: '対馬海峡 (Tsushima Kaikyō)', zh: '對馬海峽',
    ko: '대한해협 (Taehan Haehyŏp)', date: '27–28 May 1905', cat: 'battle', lvl: 3, lat: 34.4,
    lon: 129.33, year: 1905,
    note: 'Tōgō destroyed the Russian Baltic Fleet here after its eighteen-thousand-mile voyage — the decisive battle of the Russo-Japanese War and the first modern defeat of a European power by an Asian one.'
  },
  {
    id: 'naha', en: 'Naha', ja: '那覇 (Naha)', orig: '那覇 (Naafa)', zh: '那霸',
    date: 'Battle of Okinawa, April–June 1945', cat: 'city', lvl: 1, lat: 26.21, lon: 127.68,
    year: 1879,
    note: 'Port of the Ryūkyū Kingdom, and the site of the only land battle of the war fought on Japanese soil among a civilian population, in which around a quarter of Okinawans died.'
  },
  {
    id: 'iwojima', en: 'Iwo Jima (Iō-tō)', ja: '硫黄島 (Iō-tō)', orig: '硫黄島 (Iō-tō)', zh: '硫磺島',
    date: '19 February – 26 March 1945', cat: 'battle', lvl: 2, lat: 24.78, lon: 141.32,
    year: 1945,
    note: 'Taken at a cost of nearly 7,000 American and over 18,000 Japanese dead, to give fighter cover to the bombers over Japan.'
  },
  {
    id: 'seoul', en: 'Keijō (Seoul)', ja: '京城 (Keijō)', zh: '京城（漢城）',
    ko: '서울 / 한성 (Sŏul / Hansŏng)', date: 'Renamed Keijō in 1910', cat: 'city', lvl: 1,
    lat: 37.57, lon: 126.98, year: 1876,
    note: 'Capital of Chosŏn Korea as Hansŏng, and of the colony as Keijō. The Kapsin Coup of 1884 and the March First Movement of 1919 both began here; Queen Min was murdered in the palace in 1895.'
  },
  {
    id: 'pusan', en: 'Fusan (Pusan)', ja: '釜山 (Fusan)', zh: '釜山', ko: '부산 (Pusan)',
    date: 'Opened by treaty 1876', cat: 'city', lvl: 2, lat: 35.18, lon: 129.08, year: 1876,
    note: 'The port closest to Japan, long the site of a Japanese trading enclave, and the southern end of the ferry and rail link that tied Korea into the Japanese economy.'
  },
  {
    id: 'incheon', en: 'Jinsen (Chemulpo, Inchon)', ja: '仁川 (Jinsen)', zh: '仁川',
    ko: '인천 / 제물포 (Inch’ŏn / Chemulp’o)', date: 'Naval action 9 February 1904', cat: 'city',
    lvl: 3, lat: 37.46, lon: 126.71, year: 1883,
    note: 'Seoul’s port, known to foreigners as Chemulpo. The Japanese attack on Russian ships here opened the Russo-Japanese War.'
  },
  {
    id: 'kanghwa', en: 'Kanghwa Island', ja: '江華島 (Kōkatō)', zh: '江華島', ko: '강화도 (Kanghwado)',
    date: 'Treaty signed 26 February 1876', cat: 'battle', lvl: 3, lat: 37.75, lon: 126.48,
    year: 1876,
    note: 'Japanese gunboat diplomacy — an engineered incident in 1875, then a fleet — produced the Kanghwa Treaty, Korea’s own unequal treaty, on the model of the ones imposed on Japan twenty years before.'
  },
  {
    id: 'pyongyang', en: 'Heijō (Pyongyang)', ja: '平壌 (Heijō)', zh: '平壤', ko: '평양 (P’yŏngyang)',
    date: 'Battle, 15 September 1894', cat: 'city', lvl: 3, lat: 39.02, lon: 125.75, year: 1894,
    note: 'Site of a decisive Japanese victory over Qing forces in the First Sino-Japanese War, and later a centre of colonial industry and of Korean Christianity.'
  },
  {
    id: 'mukden', en: 'Shěnyáng (Mukden)', ja: '奉天 (Hōten)', orig: '瀋陽 (Shěnyáng)',
    zh: '瀋陽（奉天）', date: 'Battle 1905; Manchurian Incident 18 September 1931', cat: 'city',
    lvl: 1, lat: 41.8, lon: 123.43, year: 1905,
    note: 'The Manchu dynastic capital, and the prize of the largest land battle of the Russo-Japanese War. The explosion staged on the South Manchuria Railway just outside the city on 18 September 1931 was the pretext for the invasion of Manchuria.'
  },
  {
    id: 'changchun', en: 'Chángchūn (Hsinking)', ja: '新京 (Shinkyō)', orig: '長春 (Chángchūn)',
    zh: '長春（新京）', date: 'Capital of Manchukuo from 1932', cat: 'city', lvl: 2, lat: 43.88,
    lon: 125.32, year: 1907,
    note: 'Renamed Hsinking, "new capital", and rebuilt on a planned grid with boulevards and ministries as the showpiece of the puppet state.'
  },
  {
    id: 'harbin', en: 'Hā’ěrbīn (Harbin)', ja: 'ハルビン (Harubin)', orig: '哈爾濱 (Hā’ěrbīn)',
    zh: '哈爾濱', date: 'Itō assassinated 26 October 1909', cat: 'city', lvl: 2, lat: 45.8,
    lon: 126.53, year: 1909,
    note: 'A Russian-built railway city with a large émigré population. Itō Hirobumi was shot at its station by the Korean independence activist An Chunggŭn. Unit 731 ran human vivisection at Pingfang on the outskirts from 1936, and field-tested plague and cholera on Chinese towns.'
  },
  {
    id: 'portarthur', en: 'Lǚshùn (Port Arthur, Ryojun)', ja: '旅順 (Ryojun)',
    orig: '旅順 (Lǚshùn)', zh: '旅順', date: 'Siege, August 1904 – January 1905', cat: 'city',
    lvl: 1, lat: 38.82, lon: 121.22, year: 1894,
    note: 'Taken from China in 1894, given up under the Triple Intervention of 1895, leased by Russia in 1898, and won back at enormous cost in the siege of 1904–05. The pivot of Japanese continental policy for fifty years.'
  },
  {
    id: 'dairen', en: 'Dàlián (Dairen, Dalny)', ja: '大連 (Dairen)', orig: '大連 (Dàlián)',
    zh: '大連', date: 'Japanese from 1905', cat: 'city', lvl: 2, lat: 38.91, lon: 121.61,
    year: 1905,
    note: 'The commercial capital of the Kwantung Leased Territory and headquarters of the South Manchuria Railway Company, the vehicle of Japanese economic power in the region.'
  },
  {
    id: 'chengde', en: 'Chéngdé (Chengteh)', ja: '承徳 (Shōtoku)', orig: '承德 (Chéngdé)', zh: '承德',
    date: 'Occupied 4 March 1933', cat: 'city', lvl: 3, lat: 40.98, lon: 117.94, year: 1933,
    note: 'The Qing emperors’ summer capital, and capital of Rehe province — English sources often call the city itself Rehe. Taken in a ten-day campaign and attached to Manchukuo; the Tanggu Truce followed in May.'
  },
  {
    id: 'nomonhan', en: 'Nuòménhǎn (Nomonhan, Khalkhin Gol)', ja: 'ノモンハン事件 (Nomonhan jiken)',
    orig: 'Халхын гол', zh: '諾門罕', date: 'May – September 1939', cat: 'battle', lvl: 3,
    lat: 47.73, lon: 118.55, year: 1939,
    note: 'An undeclared war on the Manchukuo–Mongolian border. Zhukov’s encirclement destroyed a Japanese division and helped settle the strategic argument in favour of striking south rather than north.'
  },
  {
    id: 'wanpaoshan', en: 'Wànbǎoshān (Wanpaoshan)', ja: '万宝山事件 (Manpōzan jiken)',
    orig: '萬寶山 (Wànbǎoshān)', zh: '萬寶山', date: 'July 1931', cat: 'battle', lvl: 3, lat: 44.95,
    lon: 125.4, year: 1931,
    note: 'A quarrel over an irrigation ditch between Korean and Chinese farmers, inflamed by Japanese press reports into anti-Chinese riots in Korea, two months before the invasion of Manchuria.'
  },
  {
    id: 'beijing', en: 'Běijīng (Peking / Peiping)', ja: '北京 (Pekin)',
    orig: '北京 / 北平 (Běijīng / Běipíng)', zh: '北京（北平）',
    date: 'Renamed Peiping in 1928; occupied July–August 1937', cat: 'city', lvl: 1, lat: 39.9,
    lon: 116.4, year: 1900,
    note: 'The Qing capital, demoted to "Peiping" when the Nationalists moved the capital to Nanjing in 1928. Japanese troops joined the eight-nation force that relieved the legations in 1900, and took the city outright in August 1937.'
  },
  {
    id: 'marcopolo', en: 'Lúgōuqiáo (the Marco Polo Bridge)', ja: '盧溝橋事件 (Rokōkyō jiken)',
    orig: '盧溝橋 (Lúgōuqiáo)', zh: '盧溝橋', date: '7 July 1937', cat: 'battle', lvl: 2, lat: 39.85,
    lon: 116.21, year: 1937,
    note: 'A night exercise, a missing soldier and an exchange of fire — the skirmish that opened eight years of full-scale war in China.'
  },
  {
    id: 'tianjin', en: 'Tiānjīn (Tientsin)', ja: '天津 (Tenshin)', orig: '天津 (Tiānjīn)', zh: '天津',
    date: 'Convention 1885; occupied 1937', cat: 'city', lvl: 2, lat: 39.13, lon: 117.2,
    year: 1885,
    note: 'The treaty port for Beijing, carved into eight foreign concessions including a Japanese one. The Tianjin Convention of 1885 regulated Chinese and Japanese troops in Korea, and broke down in 1894; the Tanggu Truce of May 1933, signed at its port, gave north China a demilitarised zone that Japan spent the next four years pushing into.'
  },
  {
    id: 'kalgan', en: 'Zhāngjiākǒu (Kalgan, Changchiakou)', ja: '張家口 (Chōkakō)',
    orig: '張家口 (Zhāngjiākǒu)', zh: '張家口', date: 'Capital of Mengchiang from 1939', cat: 'city',
    lvl: 3, lat: 40.81, lon: 114.88, year: 1937,
    note: 'The old caravan gate through the Great Wall to Mongolia, and the seat of the Japanese-sponsored Inner Mongolian regime.'
  },
  {
    id: 'jinan', en: 'Jǐnán (Tsinan)', ja: '済南 (Sainan)', orig: '濟南 (Jǐnán)', zh: '濟南',
    date: 'May 1928', cat: 'city', lvl: 3, lat: 36.67, lon: 116.99, year: 1928,
    note: 'Japanese troops sent to "protect residents" clashed with the Nationalist Northern Expedition; thousands of Chinese were killed, and a Chinese diplomat mutilated and executed.'
  },
  {
    id: 'qingdao', en: 'Qīngdǎo (Tsingtao)', ja: '青島 (Seitō)', orig: '青島 (Qīngdǎo)', zh: '青島',
    date: 'Seized from Germany, November 1914', cat: 'city', lvl: 2, lat: 36.07, lon: 120.38,
    year: 1914,
    note: 'The German leasehold in Shandong, taken by Japan in 1914. Keeping it was the first of the Twenty-One Demands and was confirmed at Versailles, which set off the May Fourth Movement. Returned in 1922.'
  },
  {
    id: 'weihai', en: 'Wēihǎi (Weihaiwei)', ja: '威海衛 (Ikaiei)', orig: '威海衛 (Wēihǎiwèi)',
    zh: '威海衛', date: 'Battle, January–February 1895', cat: 'city', lvl: 3, lat: 37.51,
    lon: 122.12, year: 1895,
    note: 'The Peiyang Fleet’s base, destroyed by Japan in the closing weeks of the First Sino-Japanese War; afterwards a British leased territory until 1930.'
  },
  {
    id: 'nanjing', en: 'Nánjīng (Nanking)', ja: '南京 (Nankin)', orig: '南京 (Nánjīng)', zh: '南京',
    date: 'Fell 13 December 1937', cat: 'city', lvl: 1, lat: 32.06, lon: 118.8, year: 1927,
    note: 'Nationalist capital from 1927. Its capture on 13 December 1937 was followed by weeks of mass killing and rape — the Nanjing Massacre — in which the dead are counted from the tens of thousands to 300,000, depending on the period and the boundary taken. From 1940 it housed Wang Jingwei\'s collaborationist government.'
  },
  {
    id: 'shanghai', en: 'Shànghǎi (Shanghai)', ja: '上海 (Shanhai)', orig: '上海 (Shànghǎi)',
    zh: '上海', date: 'Fighting 1932; battle August–November 1937', cat: 'city', lvl: 1,
    lat: 31.23, lon: 121.47, year: 1863,
    note: 'The largest treaty port in China, with an International Settlement and a French Concession. Fighting in January 1932 and again in 1937, when three months of street and river fighting cost both armies enormously and destroyed China’s best divisions.'
  },
  {
    id: 'wuhan', en: 'Wǔhàn (Hankow)', ja: '漢口 (Hankō)', orig: '武漢 / 漢口 (Wǔhàn / Hànkǒu)',
    zh: '武漢（漢口）', date: 'Fell 25 October 1938', cat: 'city', lvl: 2, lat: 30.58, lon: 114.28,
    year: 1861,
    note: 'The Nationalist government’s refuge after Nanjing. Its fall ended the first mobile phase of the war; from then on the fighting in China settled into stalemate.'
  },
  {
    id: 'chongqing', en: 'Chóngqìng (Chungking)', ja: '重慶 (Jūkei)', orig: '重慶 (Chóngqìng)',
    zh: '重慶', date: 'Wartime capital 1938–1945', cat: 'city', lvl: 2, lat: 29.56, lon: 106.55,
    year: 1891,
    note: 'Chosen for the gorges and the fog that shielded it. Bombed for five years in one of the first sustained campaigns against a civilian population.'
  },
  {
    id: 'yanan', en: 'Yán’ān (Yenan)', ja: '延安 (En’an)', orig: '延安 (Yán’ān)', zh: '延安',
    date: 'Communist base 1936–1947', cat: 'city', lvl: 3, lat: 36.6, lon: 109.49, year: 1936,
    note: 'The Long March ended in northern Shaanxi in 1935 and the party moved here at the end of 1936. From it Mao consolidated his leadership and the party grew from tens of thousands to over a million. The American observers of the Dixie Mission arrived in July 1944, the first official contact between Washington and the Communists.'
  },
  {
    id: 'xian', en: 'Xī’ān (Sian)', ja: '西安 (Seian)', orig: '西安 (Xī’ān)', zh: '西安',
    date: 'December 1936', cat: 'city', lvl: 3, lat: 34.34, lon: 108.94, year: 1936,
    note: 'Chiang Kai-shek was kidnapped here by his own generals and released only after agreeing to a united front with the Communists against Japan.'
  },
  {
    id: 'guangzhou', en: 'Guǎngzhōu (Canton)', ja: '広州 (Kōshū)', orig: '廣州 (Guǎngzhōu)',
    zh: '廣州', date: 'Fell 21 October 1938', cat: 'city', lvl: 2, lat: 23.13, lon: 113.26,
    year: 1842,
    note: 'The original treaty port and the cradle of the Nationalist revolution, taken in 1938 to cut the supply line from Hong Kong.'
  },
  {
    id: 'xiamen', en: 'Xiàmén (Amoy)', ja: '厦門 (Amoi)', orig: '廈門 (Xiàmén)', zh: '廈門',
    date: 'Occupied May 1938', cat: 'city', lvl: 3, lat: 24.48, lon: 118.09, year: 1842,
    note: 'A treaty port opposite Taiwan, and a main point of departure for Chinese emigration to Southeast Asia.'
  },
  {
    id: 'hainan', en: 'Hǎinándǎo (Hainan Island)', ja: '海南島 (Kainantō)',
    orig: '海南島 (Hǎinándǎo)', zh: '海南島', date: 'Occupied February 1939', cat: 'battle', lvl: 3,
    lat: 19.55, lon: 109.6, year: 1939,
    note: 'Seized to blockade south China and as a stepping stone towards Indochina; worked with forced labour for its iron ore.'
  },
  {
    id: 'taipei', en: 'Taihoku (Taipei)', ja: '臺北 (Taihoku)', orig: '臺北 (Tâi-pak)', zh: '臺北',
    date: 'Colonial capital from 1895', cat: 'city', lvl: 2, lat: 25.03, lon: 121.57,
    year: 1895,
    note: 'Seat of the Governor-General of Taiwan, and the administrative model that later colonies were built on.'
  },
  {
    id: 'kaohsiung', en: 'Takao (Kaohsiung)', ja: '高雄 (Takao)', orig: '高雄 (Ko-hiông)', zh: '高雄',
    date: 'Developed from 1908', cat: 'city', lvl: 3, lat: 22.63, lon: 120.3, year: 1908,
    note: 'The southern port built up by the colonial government, and the springboard for the "southward advance" into Southeast Asia.'
  },
  {
    id: 'vladivostok', en: 'Vladivostok', ja: '浦潮 (Urajio)', orig: 'Владивосток', zh: '海參崴',
    date: 'Japanese landing, August 1918', cat: 'city', lvl: 2, lat: 43.12, lon: 131.89,
    year: 1918,
    note: 'Russia’s Pacific naval base and the terminus of the Trans-Siberian. The Siberian Intervention put 70,000 Japanese troops ashore here, and they stayed until 1922 — long after the other Allies had gone.'
  },
  {
    id: 'nikolaevsk', en: 'Nikolaevsk-on-Amur', ja: '尼港事件 (Nikō jiken)',
    orig: 'Николаевск-на-Амуре', zh: '廟街（尼港）', date: 'March – May 1920', cat: 'battle', lvl: 3,
    lat: 53.14, lon: 140.73, year: 1920,
    note: 'Partisans killed the Japanese garrison and much of the Japanese and Russian civilian population. Japan used the massacre to justify occupying northern Sakhalin until 1925.'
  },
  {
    id: 'hanoi', en: 'Hanoi', ja: 'ハノイ (Hanoi)', orig: 'Hà Nội', zh: '河內',
    date: 'Japanese troops enter September 1940', cat: 'city', lvl: 2, lat: 21.03, lon: 105.85,
    year: 1902,
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
    year: 1782,
    note: 'Capital of the one uncolonised state in the region. Phibun’s government granted passage within hours of the invasion and allied with Japan a fortnight later.'
  },
  {
    id: 'singapore', en: 'Shōnantō (Singapore)', ja: '昭南島 (Shōnantō)', orig: 'Singapura',
    zh: '新加坡', date: 'Surrendered 15 February 1942', cat: 'city', lvl: 1, lat: 1.29,
    lon: 103.85, year: 1819,
    note: 'Britain’s great naval base, whose guns are often wrongly said to have pointed only out to sea; the real failures were air cover and the loss of the Prince of Wales and Repulse. 80,000 troops went into captivity.'
  },
  {
    id: 'kotabharu', en: 'Kota Bharu', orig: 'Kota Bharu', date: '8 December 1941',
    cat: 'battle', lvl: 3, lat: 6.13, lon: 102.24, year: 1941,
    note: 'The landing in northern Malaya began roughly an hour before the first bombs fell on Pearl Harbor — on the other side of the date line, so the calendars disagree.'
  },
  {
    id: 'manila', en: 'Manila', ja: 'マニラ (Manira)', orig: 'Maynila', zh: '馬尼拉',
    date: 'Occupied 2 January 1942', cat: 'city', lvl: 2, lat: 14.6, lon: 120.98, year: 1898,
    note: 'Declared an open city and occupied without a fight; devastated three years later during its recapture, when perhaps 100,000 civilians died.'
  },
  {
    id: 'corregidor', en: 'Bataan & Corregidor', ja: 'バターン・コレヒドール (Batān Korehidōru)',
    orig: 'Bataan / Corregidor', zh: '巴丹・科雷希多', date: 'April – 6 May 1942', cat: 'battle',
    lvl: 3, lat: 14.38, lon: 120.57, year: 1942,
    note: 'The last American and Filipino stand. The surrender was followed by the Bataan Death March, in which thousands died.'
  },
  {
    id: 'leyte', en: 'Leyte Gulf', ja: 'レイテ沖海戦 (Reite-oki kaisen)', orig: 'Golpo ng Leyte',
    zh: '雷伊泰灣', date: '23–26 October 1944', cat: 'battle', lvl: 2, lat: 10.8, lon: 125.4,
    year: 1944,
    note: 'The largest naval battle ever fought. It destroyed the Imperial Navy as a fighting force and saw the first organised kamikaze attacks.'
  },
  {
    id: 'rangoon', en: 'Rangoon (Yangon)', ja: 'ラングーン (Rangūn)', orig: 'ရန်ကုန် (Yangon)',
    zh: '仰光', date: 'Fell 8 March 1942', cat: 'city', lvl: 2, lat: 16.87, lon: 96.2, year: 1852,
    note: 'Capital of British Burma and the port at the head of the Burma Road; its loss cut China’s last land supply line.'
  },
  {
    id: 'imphal', en: 'Imphal & Kohima', ja: 'インパール作戦 (Inpāru sakusen)',
    orig: 'Imphal / Kohima', zh: '英帕爾', date: 'March – July 1944', cat: 'battle', lvl: 2,
    lat: 24.82, lon: 93.94, year: 1944,
    note: 'The attempt to invade India, fought alongside Bose’s Indian National Army and launched without adequate supply. Some 55,000 Japanese casualties, most from starvation and disease — the worst defeat in Japanese military history to that point.'
  },
  {
    id: 'batavia', en: 'Batavia (Jakarta)', ja: 'ジャカルタ (Jakaruta)', orig: 'Batavia / Jakarta',
    zh: '巴達維亞', date: 'Dutch surrender, 8 March 1942', cat: 'city', lvl: 2, lat: -6.21,
    lon: 106.85, year: 1619,
    note: 'Capital of the Netherlands East Indies for three centuries. Sukarno and Hatta chose to work with the occupation, and declared independence two days after the surrender in 1945.'
  },
  {
    id: 'surabaya', en: 'Surabaya', ja: 'スラバヤ (Surabaya)', orig: 'Surabaya',
    date: 'Battle of the Java Sea, 27 February 1942', cat: 'city', lvl: 3, lat: -7.25,
    lon: 112.75, year: 1942,
    note: 'The main Dutch naval base. The Allied squadron that sailed from here was annihilated, opening Java to invasion.'
  },
  {
    id: 'pearlharbor', en: 'Pearl Harbor', ja: '真珠湾攻撃 (Shinjuwan kōgeki)', orig: 'Puʻuloa',
    zh: '珍珠港', date: '7 December 1941 (8 December in Japan)', cat: 'battle', lvl: 1, lat: 21.35,
    lon: -157.95, year: 1941,
    note: 'Six carriers, two waves, two hours. Eight battleships hit and over 2,400 killed — but the American carriers were at sea and the fuel tanks and dockyards were left intact.'
  },
  {
    id: 'coralsea', en: 'Coral Sea', ja: '珊瑚海海戦 (Sangokai kaisen)', zh: '珊瑚海海戰',
    date: '4–8 May 1942', cat: 'battle', lvl: 3, lat: -13.5, lon: 154, year: 1942,
    note: 'The first battle fought entirely by carrier aircraft, with the fleets never in sight of each other. It cost the Americans the <em>Lexington</em> and the Japanese the light carrier <em>Shōhō</em>; <em>Shōkaku</em> was bombed and <em>Zuikaku</em>’s air group destroyed, and both missed Midway a month later. Tactically a draw; strategically the first check on the Japanese advance, because the seaborne attempt on Port Moresby turned back and was never resumed.'
  },
  {
    id: 'midway', en: 'Midway', ja: 'ミッドウェー海戦 (Middowē kaisen)', orig: 'Pihemanu', zh: '中途島',
    date: '4–7 June 1942', cat: 'battle', lvl: 1, lat: 28.21, lon: -177.37, year: 1942,
    note: 'All four Japanese fleet carriers fatally hit within a day, against one American. The offensive initiative in the Pacific never came back.'
  },
  {
    id: 'saipan', en: 'Saipan', ja: 'サイパン (Saipan)', orig: 'Saipan', zh: '塞班島',
    date: '15 June – 9 July 1944', cat: 'battle', lvl: 1, lat: 15.19, lon: 145.75, year: 1944,
    note: 'Its loss put Japan within B-29 range and brought down the Tōjō cabinet. Hundreds of Japanese civilians killed themselves at Marpi Point rather than surrender.'
  },
  {
    id: 'tinian', en: 'Tinian', ja: 'テニアン (Tenian)', orig: 'Tinian', zh: '天寧島',
    date: 'Taken July–August 1944', cat: 'battle', lvl: 3, lat: 15, lon: 145.62, year: 1944,
    note: 'Its airfields, the busiest in the world by 1945, launched the atomic bomb missions to Hiroshima and Nagasaki.'
  },
  {
    id: 'truk', en: 'Truk (Chuuk)', ja: 'トラック島 (Torakku-tō)', orig: 'Chuuk', zh: '特魯克',
    date: 'Operation Hailstone, 17–18 February 1944', cat: 'battle', lvl: 3, lat: 7.42,
    lon: 151.78, year: 1944,
    note: 'The Combined Fleet’s central Pacific anchorage — "the Gibraltar of the Pacific" — wrecked by carrier raids and then bypassed and left to rot.'
  },
  {
    id: 'peleliu', en: 'Peleliu (Beliliou)', ja: 'ペリリュー (Peririyū)', orig: 'Beliliou',
    zh: '貝里琉', date: 'September – November 1944', cat: 'battle', lvl: 3, lat: 7, lon: 134.25,
    year: 1944,
    note: 'Expected to take four days and took over two months. It introduced the deep cave defence that would be used again on Iwo Jima and Okinawa.'
  },
  {
    id: 'wake', en: 'Wake Island', ja: '大鳥島 (Ōtorishima)', orig: 'Wake Island', zh: '威克島',
    date: 'Fell 23 December 1941', cat: 'battle', lvl: 2, lat: 19.28, lon: 166.65, year: 1941,
    note: 'A small Marine garrison beat off the first landing before being overwhelmed. Ninety-eight captured civilian workers were murdered there in 1943.'
  },
  {
    id: 'kwajalein', en: 'Kwajalein', ja: 'クェゼリン (Kuezerin)', orig: 'Kuwajleen', zh: '瓜加林',
    date: 'January – February 1944', cat: 'battle', lvl: 3, lat: 9.19, lon: 167.47, year: 1944,
    note: 'The first pre-war Japanese mandate territory to be taken, breaching the outer ring of the defensive perimeter.'
  },
  {
    id: 'tarawa', en: 'Tarawa', ja: 'タラワ (Tarawa)', orig: 'Tarawa', zh: '塔拉瓦',
    date: '20–23 November 1943', cat: 'battle', lvl: 3, lat: 1.33, lon: 172.98, year: 1943,
    note: 'Seventy-six hours, over a thousand American dead on a coral islet of barely more than a square kilometre, and almost the whole garrison killed. The cost changed how the rest of the island campaign was planned.'
  },
  {
    id: 'rabaul', en: 'Rabaul', ja: 'ラバウル (Rabauru)', orig: 'Rabaul', zh: '拉包爾',
    date: 'Captured January 1942', cat: 'city', lvl: 2, lat: -4.2, lon: 152.16, year: 1942,
    note: 'Built into the great forward base of the South Pacific, with five airfields and over 100,000 troops. Bypassed from 1944 and left isolated until the surrender.'
  },
  {
    id: 'guadalcanal', en: 'Guadalcanal', ja: 'ガダルカナル (Gadarukanaru)', orig: 'Guadalcanal',
    zh: '瓜達爾卡納爾', date: 'August 1942 – February 1943', cat: 'battle', lvl: 2, lat: -9.58,
    lon: 160.15, year: 1942,
    note: 'A half-built airfield became the first sustained Allied offensive of the Pacific War. Six months of attrition on land, sea and air that Japan could not afford; the withdrawal marked the turn of the tide.'
  },
  {
    id: 'portmoresby', en: 'Port Moresby', ja: 'ポートモレスビー (Pōto Moresubī)', orig: 'Port Moresby',
    zh: '莫爾茲比港', date: 'Coral Sea May 1942; Kokoda July–November 1942', cat: 'battle', lvl: 3,
    lat: -9.44, lon: 147.18, year: 1942,
    note: 'The objective Japan never reached. The seaborne attempt was turned back at the Coral Sea and the overland push failed on the Kokoda Track, within sight of its goal.'
  },
  {
    id: 'darwin', en: 'Darwin', ja: 'ダーウィン (Dāwin)', orig: 'Darwin', zh: '達爾文',
    date: '19 February 1942', cat: 'battle', lvl: 3, lat: -12.46, lon: 130.84, year: 1942,
    note: 'More bombs fell on Darwin than on Pearl Harbor, delivered by many of the same aircrew. Raids on northern Australia continued into 1943.'
  },
  {
    id: 'attu', en: 'Attu', ja: 'アッツ島 (Attsu-tō)', orig: 'Atan', zh: '阿圖島',
    date: 'Occupied June 1942, retaken May 1943', cat: 'battle', lvl: 3, lat: 52.88,
    lon: 173.18, year: 1942,
    note: 'Of some 2,600 defenders, fewer than 30 were taken alive. Tokyo called the annihilation gyokusai — "shattering the jewel" — and made it a model.'
  },
  {
    id: 'kiska', en: 'Kiska', ja: 'キスカ島 (Kisuka-tō)', orig: 'Qisxa', zh: '基斯卡島',
    date: 'Occupied June 1942, evacuated July 1943', cat: 'battle', lvl: 3, lat: 51.97,
    lon: 177.53, year: 1942,
    note: 'The garrison was lifted off under cover of fog before the Allied landing, which went ashore against an empty island and still took casualties from friendly fire.'
  },
  {
    id: 'pingxingguan', en: 'Píngxíngguān (Pinghsingkuan)', ja: '平型関 (Heikeikan)', zh: '平型關',
    date: '25 September 1937', cat: 'battle', lvl: 3, lat: 39.36, lon: 113.93, year: 1937,
    note: 'A pass in the Wutai mountains where Lin Biao\'s division ambushed a Japanese supply column on 25 September 1937 — a small action, and the Eighth Route Army\'s first, which the party made a great deal of afterwards.'
  },
  {
    id: 'taierzhuang', en: 'Tái’érzhuāng (Taierhchuang)', ja: '台児荘 (Taijisō)', zh: '台兒莊',
    date: 'March – April 1938', cat: 'battle', lvl: 3, lat: 34.56, lon: 117.73, year: 1938,
    note: 'The first clear Chinese victory of the war. Li Zongren let two Japanese divisions push into the town and closed on them from both flanks, and they broke and ran in early April 1938. It did not save Xuzhou, which fell six weeks later, but it ended the belief that the army could not win.'
  },
  {
    id: 'huangqiao', en: 'Huángqiáo (Hwangchiao)', ja: '黄橋 (Kōkyō)', zh: '黃橋',
    date: 'October 1940', cat: 'battle', lvl: 3, lat: 32.27, lon: 120.24, year: 1940,
    note: 'Nationalist and Communist forces fought each other here in October 1940, north of the Yangtze, while the war with Japan went on around them. The New Fourth Army won, and Chiang Kai-shek\'s answer three months later was the New Fourth Army Incident.'
  },
  {
    id: 'dushan', en: 'Dúshān (Tushan)', ja: '独山 (Dokusan)', zh: '獨山', date: 'December 1944',
    cat: 'battle', lvl: 3, lat: 25.83, lon: 107.55, year: 1944,
    note: 'The furthest inland the war ever came. The Ichigo offensive reached this small town in Guizhou in December 1944, a hundred miles short of Guiyang, and turned back for want of supply.'
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
      date: 'Renamed Peiping in 1928',
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
      note: 'The treaty port for Beijing, carved into eight foreign concessions including a Japanese one. The Tianjin Convention of 1885 regulated Chinese and Japanese troops in Korea, and broke down in 1894.'
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
    id: 'paoting', en: 'Bǎodìng (Paoting)', ja: '保定 (Hotei)', zh: '保定', lat: 38.87, lon: 115.47,
    note: 'On the Beijing–Hankou railway, and the seat of the military academy that trained a generation of Republican officers. Fell on 24 September 1937; Shijiazhuang, the junction south of it, went in October.'
  },
  {
    id: 'taiyuan', en: 'Tàiyuán (Taiyuan)', ja: '太原 (Taigen)', zh: '太原', lat: 37.87,
    lon: 112.55,
    note: 'Yan Xishan\'s capital for thirty years, with the arsenal and steelworks he built to keep Shanxi independent of everyone. Lin Biao\'s ambush at Pingxingguan in September 1937 and the battle of Xinkou in October delayed its fall until 9 November.'
  },
  {
    id: 'kaifeng', en: 'Kāifēng (Kaifeng)', ja: '開封 (Kaihō)', zh: '開封', lat: 34.8, lon: 114.31,
    note: 'The Northern Song capital, and a station on the Lunghai railway. Fell on 6 June 1938; the dikes at Huayuankou were cut three days later to stop the advance beyond it.'
  },
  {
    id: 'hefei', en: 'Héféi (Hofei)', ja: '合肥 (Gōhi)', zh: '合肥', lat: 31.86, lon: 117.28,
    note: 'The seat of Anhui, on the road between the Yangtze and the Huai. Occupied in 1938, though the front bent round the Chinese pocket in the north-west of the province beyond it.'
  },
  {
    id: 'anqing', en: 'Ānqìng (Anking)', ja: '安慶 (Ankei)', zh: '安慶', lat: 30.51, lon: 117.05,
    note: 'The old provincial capital of Anhui, and a river port on the Yangtze. Fell on 12 June 1938, opening the campaign up the river to Hankou. The New Fourth Army Incident of January 1941 was fought in the mountains south of it.'
  },
  {
    id: 'hangzhou', en: 'Hángzhōu (Hangchow)', ja: '杭州 (Kōshū)', zh: '杭州', lat: 30.27,
    lon: 120.16,
    note: 'Silk, and the southern end of the Grand Canal. Fell on 24 December 1937.'
  },
  {
    id: 'nanchang', en: 'Nánchāng (Nanchang)', ja: '南昌 (Nanshō)', zh: '南昌', lat: 28.68,
    lon: 115.89,
    note: 'Where the Communist rising of 1 August 1927 gave the Red Army its founding date, and where Chiang launched the New Life Movement seven years later. Fell on 27 March 1939.'
  },
  {
    id: 'fuzhou', en: 'Fúzhōu (Foochow)', ja: '福州 (Fukushū)', zh: '福州', lat: 26.07, lon: 119.3,
    note: 'A treaty port from 1842 and the great tea shipping port of the nineteenth century. Taken in April 1941, retaken by Chinese forces that September, and taken again in October 1944.'
  },
  {
    id: 'changsha', en: 'Chángshā (Changsha)', ja: '長沙 (Chōsa)', zh: '長沙', lat: 28.23,
    lon: 112.94,
    note: 'The rice bowl of Hunan and a junction on the Guangzhou–Hankou line. Its own garrison burned it down by mistake in November 1938; it then beat off three Japanese offensives and fell at last on 18 June 1944.'
  },
  {
    id: 'guilin', en: 'Guìlín (Kweilin)', ja: '桂林 (Keirin)', zh: '桂林', lat: 25.27, lon: 110.29,
    note: 'A Nationalist air base among the limestone hills, and the refuge of the universities of the south. Destroyed by its own garrison and abandoned on 10 November 1944.'
  },
  {
    id: 'nanning', en: 'Nánníng (Nanning)', ja: '南寧 (Nannei)', zh: '南寧', lat: 22.82,
    lon: 108.32,
    note: 'The road and rail gate to Indochina, which is why it was taken in November 1939, given up in 1940, and taken again in 1944.'
  },
  {
    id: 'guiyang', en: 'Guìyáng (Kweiyang)', ja: '貴陽 (Kiyō)', zh: '貴陽', lat: 26.65, lon: 106.63,
    note: 'The hinge of the road system of the south-west, where the routes from Chongqing, Kunming and Guangxi met. Never occupied: the Japanese advance of December 1944 reached Dushan, a hundred miles short of it, and turned back — the furthest inland the war ever came.'
  },
  {
    id: 'kunming', en: 'Kūnmíng (Kunming)', ja: '昆明 (Konmei)', zh: '昆明', lat: 25.04,
    lon: 102.72,
    note: 'The terminus of the Burma Road, of the railway from Haiphong, and after both were cut of the air route over the Hump. Peking University, Tsinghua and Nankai spent the war here as Lianda, the National Southwest Associated University. Never occupied.'
  },
  {
    id: 'chengdu', en: 'Chéngdū (Chengtu)', ja: '成都 (Seito)', zh: '成都', lat: 30.66, lon: 104.07,
    note: 'The rice and silk capital of the Sichuan basin. Never occupied — and the four airfields built round it by hand in 1944 were the first from which B-29s bombed Japan.'
  },
  {
    id: 'lanzhou', en: 'Lánzhōu (Lanchow)', ja: '蘭州 (Ranshū)', zh: '蘭州', lat: 36.06,
    lon: 103.83,
    note: 'Where the road to Xinjiang crosses the Yellow River, and the point through which Soviet aid and Soviet aircraft entered China. Bombed for it from 1937; never occupied.'
  },
  {
    id: 'xining', en: 'Xīníng (Sining)', ja: '西寧 (Seinei)', zh: '西寧', lat: 36.62, lon: 101.78,
    note: 'The seat of the Ma family who governed Qinghai for the Republic, and the wool and hide market of the Tibetan borderland. Never occupied.'
  },
  {
    id: 'yinchuan', en: 'Yínchuān (Ningsia)', ja: '寧夏 (Neika)', zh: '寧夏（銀川）', lat: 38.49,
    lon: 106.23,
    note: 'The oasis capital of Ningxia on the upper Yellow River, held for the Republic by Ma Hongkui throughout. Never occupied.'
  },
  {
    id: 'hohhot', en: 'Hūhéhàotè (Kweisui)', ja: '厚和 (Kōwa)', zh: '歸綏（呼和浩特）', lat: 40.84,
    lon: 111.75,
    note: 'The Inner Mongolian trade and lamasery city on the Beijing–Suiyuan railway. Taken on 14 October 1937 and renamed Kōwa; Demchugdongrub\'s Mongol government sat here before the seat moved to Zhangjiakou.'
  },
  {
    id: 'baotou', en: 'Bāotóu (Paotow)', ja: '包頭 (Hōtō)', zh: '包頭', lat: 40.66, lon: 109.84,
    note: 'The railhead of the Beijing–Suiyuan line and the wool market of the steppe. Taken in October 1937, and the western limit of Japanese control; the country beyond stayed with Fu Zuoyi.'
  },
  {
    id: 'qiqihar', en: 'Qíqíhā’ěr (Tsitsihar)', ja: 'チチハル (Chichiharu)', zh: '齊齊哈爾', lat: 47.35,
    lon: 123.92,
    note: 'The seat of Heilongjiang and the junction of the Chinese Eastern Railway with the line north. Taken on 19 November 1931 after the fighting at the Nen bridges.'
  },
  {
    id: 'jilincity', en: 'Jílín (Kirin)', ja: '吉林 (Kirin)', zh: '吉林', lat: 43.84, lon: 126.55,
    note: 'A timber and river city on the Songhua, taken in September 1931 when its provincial governor went over to the Japanese.'
  },
  {
    id: 'mudanjiang', en: 'Mǔdānjiāng (Mutankiang)', ja: '牡丹江 (Botankō)', zh: '牡丹江', lat: 44.58,
    lon: 129.6,
    note: 'A garrison town and railway junction on the eastern line to Vladivostok, and the first objective of the Soviet armies in August 1945.'
  },
  {
    id: 'fushun', en: 'Fǔshùn (Fushun)', ja: '撫順 (Bujun)', zh: '撫順', lat: 41.88, lon: 123.94,
    note: 'The open-cast coal mine that fuelled the South Manchuria Railway and much of Japanese industry. Chinese labourers died here in tens of thousands.'
  },
  {
    id: 'anshan', en: 'Ānshān (Anshan)', ja: '鞍山 (Anzan)', zh: '鞍山', lat: 41.11, lon: 122.99,
    note: 'The Shōwa Steel Works, the largest ironworks in the empire outside Japan, and the target of the first B-29 raid on Manchuria in July 1944.'
  },
  {
    id: 'jinzhou', en: 'Jǐnzhōu (Chinchow)', ja: '錦州 (Kinshū)', zh: '錦州', lat: 41.1,
    lon: 121.13,
    note: 'The gate between Manchuria and the Wall, on the railway from Shenyang to Beijing. Taken on 3 January 1932, which ended organised Chinese resistance in Manchuria.'
  },
  {
    id: 'yingkou', en: 'Yíngkǒu (Newchwang)', ja: '営口 (Eikō)', zh: '營口', lat: 40.67,
    lon: 122.24,
    note: 'The old treaty port of Yingkou at the mouth of the Liao, once the outlet for Manchurian soya beans and long overtaken by Dalian.'
  },
  {
    id: 'dandong', en: 'Dāndōng (Antung)', ja: '安東 (Antō)', zh: '安東', lat: 40.13, lon: 124.39,
    note: 'Where the railway crosses the Yalu into Korea — the bridge that carried the army to the continent — and the port for the timber floated down the river.'
  },
  {
    id: 'urumqi', en: 'Wūlǔmùqí (Urumchi)', ja: '迪化 (Tekika)', zh: '迪化（烏魯木齊）', lat: 43.83,
    lon: 87.62,
    note: 'The seat of Sheng Shicai, who ran Xinjiang on Soviet money until he turned to Chongqing in 1942, and the end of the road that carried Soviet aid. Never Japanese.'
  },
  {
    id: 'kashgar', en: 'Kāshí (Kashgar)', ja: 'カシュガル (Kashugaru)', zh: '喀什噶爾', lat: 39.47,
    lon: 75.99,
    note: 'The caravan city of the southern Tarim, with a British and a Soviet consulate watching each other across it. Never Japanese.'
  },
  {
    id: 'lhasa', en: 'Lhasa', lat: 29.65, lon: 91.14,
    note: 'The seat of the Tibetan government, which stayed neutral and refused passage to an Allied supply route into China.'
  },
  {
    id: 'kangding', en: 'Kāngdìng (Kangting)', ja: '康定 (Kōtei)', zh: '康定', lat: 30.05,
    lon: 101.96,
    note: 'The old tea-and-horse gate between Sichuan and Tibet, and the seat of Xikang.'
  },
  {
    id: 'zhenjiang', en: 'Zhènjiāng (Chinkiang)', ja: '鎮江 (Chinkō)', zh: '鎮江', lat: 32.19,
    lon: 119.43,
    note: 'Where the Grand Canal meets the Yangtze, and the provincial capital of Jiangsu until 1937. Fell in December 1937.'
  },
  {
    id: 'shantou', en: 'Shàntóu (Swatow)', ja: '汕頭 (Santō)', zh: '汕頭', lat: 23.35, lon: 116.68,
    note: 'A treaty port from 1860, the departure point for much of the Chinese emigration to Southeast Asia, and the outlet for Guangdong\'s sugar. Occupied on 21 June 1939.'
  },
  {
    id: 'ningbo', en: 'Níngbō (Ningpo)', ja: '寧波 (Neiha)', zh: '寧波', lat: 29.87, lon: 121.55,
    note: 'A treaty port from 1842 and a merchant city whose bankers ran much of Shanghai. Occupied in April 1941; Unit 731 dropped plague-infected fleas on it in 1940.'
  },
  {
    id: 'wenzhou', en: 'Wēnzhōu (Wenchow)', ja: '温州 (Onshū)', zh: '溫州', lat: 28, lon: 120.7,
    note: 'A minor treaty port behind a mountain wall, taken and given up three times between 1941 and 1945. It lies outside the line of control drawn here for December 1942.'
  },
  {
    id: 'yantai', en: 'Yāntái (Chefoo)', ja: '芝罘 (Shifu)', zh: '芝罘（煙臺）', lat: 37.46,
    lon: 121.45,
    note: 'The treaty port of Yantai, known for lace, silk and the missionary school. Occupied in February 1938.'
  },
  {
    id: 'taegu', en: 'Taikyū (Taegu)', ja: '大邱 (Taikyū)', zh: '大邱', lat: 35.87, lon: 128.6,
    note: 'The provincial seat of North Kyŏngsang, and the apple and textile town of the south-east. The March First Movement reached it on 8 March 1919 and was put down by troops.'
  },
  {
    id: 'kwangju', en: 'Kōshū (Kwangju)', ja: '光州 (Kōshū)', zh: '光州', lat: 35.16, lon: 126.85,
    note: 'Where the student movement of November 1929 began, after Japanese schoolboys harassed Korean girls on the Naju train; it spread to some two hundred schools across the colony.'
  },
  {
    id: 'taejon', en: 'Taiden (Taejon)', ja: '大田 (Taiden)', zh: '大田', lat: 36.35, lon: 127.38,
    note: 'The junction where the Seoul–Pusan trunk line meets the Honam line down to the rice country of the south-west.'
  },
  {
    id: 'wonsan', en: 'Genzan (Wonsan)', ja: '元山 (Genzan)', zh: '元山', lat: 39.15, lon: 127.44,
    note: 'Opened to Japanese trade in 1880, and by the 1930s the east-coast port for the fisheries and for the oil refinery built beside it.'
  },
  {
    id: 'chongjin', en: 'Seishin (Chongjin)', ja: '清津 (Seishin)', zh: '清津', lat: 41.8,
    lon: 129.78,
    note: 'Steel and a deep-water harbour built to carry Manchurian ore and soya to Japan. Soviet marines landed here on 13 August 1945.'
  },
  {
    id: 'hamhung', en: 'Kankō (Hamhung)', ja: '咸興 (Kankō)', zh: '咸興', lat: 39.92, lon: 127.54,
    note: 'Beside it at Hŭngnam stood Noguchi\'s Chōsen Chisso works, the largest chemical plant in the empire — fertiliser, and later explosives, on power from the Pujŏn river dams.'
  },
  {
    id: 'sinuiju', en: 'Shingishū (Sinuiju)', ja: '新義州 (Shingishū)', zh: '新義州', lat: 40.1,
    lon: 124.39,
    note: 'The Korean end of the Yalu bridge to Dandong, and downstream of the Suiho dam, which was the largest in Asia when it was finished in 1941.'
  },
  {
    id: 'kaesong', en: 'Kaijō (Kaesong)', ja: '開城 (Kaijō)', zh: '開城', lat: 37.97, lon: 126.55,
    note: 'The Koryŏ capital, and the ginseng town. It was in Keiki-dō in the colonial period, which is where this map draws it, not in Hwanghae.'
  },
  {
    id: 'nampo', en: 'Chinnampo (Nampo)', ja: '鎮南浦 (Chinnanpo)', zh: '鎮南浦', lat: 38.74,
    lon: 125.41, note: 'Pyongyang\'s port, and the smelter that took Korean and Manchurian ore.'
  },
  {
    id: 'mokpo', en: 'Moppo (Mokpo)', ja: '木浦 (Mokupo)', zh: '木浦', lat: 34.79, lon: 126.39,
    note: 'The cotton and rice port of the south-west, through which the Honam harvest left for Japan.'
  },
  {
    id: 'najin', en: 'Rashin (Najin)', ja: '羅津 (Rashin)', zh: '羅津', lat: 42.24, lon: 130.29,
    note: 'Built from a fishing village in the 1930s as the terminus of the short sea route from Manchuria to Japan, bypassing the long haul round Korea.'
  },
  {
    id: 'tainan', en: 'Tainan', ja: '臺南 (Tainan)', zh: '臺南', lat: 22.99, lon: 120.2,
    note: 'The old capital of the island under the Dutch and the Qing, and the seat of the south until Japanese rule moved the centre to Taihoku.'
  },
  {
    id: 'taichung', en: 'Taichū (Taichung)', ja: '臺中 (Taichū)', zh: '臺中', lat: 24.15,
    lon: 120.67,
    note: 'The centre of the rice plain, and the prefecture in which the Musha rising broke out in October 1930 — the last armed resistance by Taiwan\'s indigenous peoples, put down with aircraft and poison gas.'
  },
  {
    id: 'keelung', en: 'Kirun (Keelung)', ja: '基隆 (Kīrun)', zh: '基隆', lat: 25.13, lon: 121.74,
    note: 'The northern coaling port and the ferry terminus for Japan. The first American raids on Taiwan struck its harbour in 1944.'
  },
  {
    id: 'hualien', en: 'Karenkō (Hualien)', ja: '花蓮港 (Karenkō)', zh: '花蓮港', lat: 23.98,
    lon: 121.6,
    note: 'The port of the east coast, cut off from the rest of the island by the central range and settled late.'
  },
  {
    id: 'hsinchu', en: 'Shinchiku (Hsinchu)', ja: '新竹 (Shinchiku)', zh: '新竹', lat: 24.81,
    lon: 120.97,
    note: 'Natural gas and an air base. American bombers from China hit its airfields on 25 November 1943, the first raid of the war on Taiwan.'
  },
  {
    id: 'chiayi', en: 'Kagi (Chiayi)', ja: '嘉義 (Kagi)', zh: '嘉義', lat: 23.48, lon: 120.45,
    note: 'The foot of the Alishan forest railway, built by the colonial government to bring the cypress down off the mountain.'
  },
  {
    id: 'makung', en: 'Makō (Makung), Pescadores', ja: '馬公 (Makō)', zh: '馬公（澎湖）', lat: 23.57,
    lon: 119.57,
    note: 'The naval anchorage in the Pescadores, which Japan took in March 1895 — a month before the treaty that gave it Taiwan.'
  },
  {
    id: 'fukuoka', en: 'Fukuoka', ja: '福岡 (Fukuoka)', zh: '福岡', lat: 33.59, lon: 130.4,
    note: 'The city of the northern Kyūshū coalfield and the port for Korea. Firebombed on 19 June 1945.'
  },
  {
    id: 'sendai', en: 'Sendai', ja: '仙台 (Sendai)', zh: '仙台', lat: 38.27, lon: 140.87,
    note: 'The garrison and university city of the north-east. Firebombed on 10 July 1945.'
  },
  {
    id: 'niigata', en: 'Niigata', ja: '新潟 (Niigata)', zh: '新潟', lat: 37.92, lon: 139.04,
    note: 'The Japan Sea port for Korea and Manchuria. It was kept on the atomic target list and so was left largely unbombed.'
  },
  {
    id: 'kanazawa', en: 'Kanazawa', ja: '金沢 (Kanazawa)', zh: '金澤', lat: 36.56, lon: 136.66,
    note: 'A castle town of the Maeda, and one of the largest cities in Japan the bombing never reached.'
  },
  {
    id: 'kumamoto', en: 'Kumamoto', ja: '熊本 (Kumamoto)', zh: '熊本', lat: 32.8, lon: 130.71,
    note: 'The Sixth Division\'s garrison town, and the seat of the Kyūshū command. Firebombed on 1 July 1945.'
  },
  {
    id: 'okayama', en: 'Okayama', ja: '岡山 (Okayama)', zh: '岡山', lat: 34.66, lon: 133.93,
    note: 'On the line to Shikoku and Kyūshū. Firebombed on 29 June 1945.'
  },
  {
    id: 'matsuyama', en: 'Matsuyama', ja: '松山 (Matsuyama)', zh: '松山', lat: 33.84, lon: 132.77,
    note: 'The largest city of Shikoku. Firebombed on 26 July 1945.'
  },
  {
    id: 'kure', en: 'Kure', ja: '呉 (Kure)', zh: '吳', lat: 34.25, lon: 132.57,
    note: 'The navy yard that built the <em>Yamato</em>. Carrier raids in July 1945 sank what was left of the fleet at its moorings.'
  },
  {
    id: 'yokosuka', en: 'Yokosuka', ja: '横須賀 (Yokosuka)', zh: '橫須賀', lat: 35.28, lon: 139.67,
    note: 'The oldest of the navy yards, built with French help from 1865, and the base that guarded the approaches to Tokyo Bay.'
  },
  {
    id: 'sasebo', en: 'Sasebo', ja: '佐世保 (Sasebo)', zh: '佐世保', lat: 33.18, lon: 129.72,
    note: 'The naval base facing Korea and China, from which the fleet sailed in 1894 and again in 1904.'
  },
  {
    id: 'maizuru', en: 'Maizuru', ja: '舞鶴 (Maizuru)', zh: '舞鶴', lat: 35.45, lon: 135.33,
    note: 'The Japan Sea naval base, and after the surrender the port through which millions of repatriates came home from the continent.'
  },
  {
    id: 'aomori', en: 'Aomori', ja: '青森 (Aomori)', zh: '青森', lat: 40.82, lon: 140.75,
    note: 'The ferry crossing to Hokkaidō, and the bottleneck of the northern railway. Firebombed on 28 July 1945.'
  },
  {
    id: 'toyohara', en: 'Toyohara (Yuzhno-Sakhalinsk)', ja: '豊原 (Toyohara)', zh: '豐原',
    lat: 46.96, lon: 142.73,
    note: 'The capital of Karafuto, laid out on a grid by the colonial government. Soviet troops took it in August 1945 and it is Yuzhno-Sakhalinsk now.'
  },
  {
    id: 'haiphong', en: 'Haiphong', ja: 'ハイフォン (Haifon)', zh: '海防', lat: 20.86, lon: 106.68,
    note: 'Tonkin\'s port, and where Japanese troops came ashore in September 1940 to close the rail route carrying supplies to Chongqing.'
  },
  {
    id: 'hue', en: 'Hue', ja: 'フエ (Fue)', zh: '順化', lat: 16.46, lon: 107.6,
    note: 'The seat of the Nguyễn emperors, where Bảo Đại reigned under French protection and declared independence under Japanese auspices in March 1945.'
  },
  {
    id: 'phnompenh', en: 'Phnom Penh', lat: 11.56, lon: 104.92,
    note: 'The Cambodian royal capital under a French résident supérieur. Japan swept the French administration away here on 9 March 1945.'
  },
  {
    id: 'vientiane', en: 'Vientiane', lat: 17.97, lon: 102.6,
    note: 'The French administrative seat in Laos, on the Mekong. The country west of the river went to Thailand in 1941.'
  },
  {
    id: 'luangprabang', en: 'Luang Prabang', lat: 19.89, lon: 102.14,
    note: 'The Lao royal capital, and the one part of Laos with a king of its own under the protectorate.'
  },
  {
    id: 'chiangmai', en: 'Chiengmai (Chiang Mai)', lat: 18.79, lon: 98.98,
    note: 'The seat of the old Lanna kingdom and the northern capital of Siam, from which Thai troops moved into the Shan states in May 1942.'
  },
  {
    id: 'mandalay', en: 'Mandalay', ja: 'マンダレー (Mandarē)', zh: '曼德勒', lat: 21.98, lon: 96.08,
    note: 'The last royal capital of Burma, taken on 1 May 1942 as the army fell back to India, and retaken on 20 March 1945.'
  },
  {
    id: 'moulmein', en: 'Moulmein', lat: 16.49, lon: 97.63,
    note: 'Fell on 31 January 1942. Thanbyuzayat, the western railhead of the Burma–Siam railway, lies just south of it.'
  },
  {
    id: 'kualalumpur', en: 'Kuala Lumpur', ja: 'クアラルンプール', lat: 3.14, lon: 101.69,
    note: 'The capital of the Federated Malay States, taken on 11 January 1942 as the campaign came down the west coast.'
  },
  {
    id: 'penang', en: 'Penang (Georgetown)', lat: 5.41, lon: 100.34,
    note: 'Bombed on 11 December 1941 and abandoned on the 19th; the European population was evacuated and the rest was not, which was remembered.'
  },
  {
    id: 'ipoh', en: 'Ipoh', ja: 'イポー (Ipō)', lat: 4.6, lon: 101.09,
    note: 'The tin town of the Kinta valley, taken on 28 December 1941.'
  },
  {
    id: 'johore', en: 'Johore Bahru', ja: 'ジョホールバル', lat: 1.49, lon: 103.74,
    note: 'Reached on 31 January 1942, the day the causeway was blown, and the ground from which the assault on Singapore was mounted a week later.'
  },
  {
    id: 'malacca', en: 'Malacca', ja: 'マラッカ (Marakka)', lat: 2.19, lon: 102.25,
    note: 'The oldest European settlement in Malaya, Portuguese then Dutch then British, taken on 15 January 1942.'
  },
  {
    id: 'kuching', en: 'Kuching', ja: 'クチン (Kuchin)', lat: 1.55, lon: 110.34,
    note: 'The Brooke capital of Sarawak, taken on 24 December 1941 with the airfield beside it.'
  },
  {
    id: 'jesselton', en: 'Jesselton (Kota Kinabalu)', ja: 'ジェッセルトン', lat: 5.98, lon: 116.07,
    note: 'The North Borneo Company\'s seat, taken on 9 January 1942. The rising here in October 1943 was crushed with mass executions.'
  },
  {
    id: 'brunei', en: 'Brunei Town', ja: 'ブルネイ (Burunei)', lat: 4.89, lon: 114.94,
    note: 'The sultan\'s town, taken on 6 January 1942 for the oilfield at Seria and the refinery at Lutong.'
  },
  {
    id: 'bandung', en: 'Bandung', ja: 'バンドン (Bandon)', lat: -6.91, lon: 107.61,
    note: 'The Dutch army\'s headquarters in the hills above Batavia. The surrender of the Indies was signed at Kalijati north of it on 8 March 1942.'
  },
  {
    id: 'semarang', en: 'Semarang', ja: 'スマラン (Sumaran)', lat: -6.97, lon: 110.42,
    note: 'The port of central Java, taken in March 1942.'
  },
  {
    id: 'medan', en: 'Medan', ja: 'メダン (Medan)', lat: 3.59, lon: 98.67,
    note: 'The town the Sumatran plantation belt was run from — tobacco, rubber and palm oil, worked by indentured Javanese and Chinese labour.'
  },
  {
    id: 'palembang', en: 'Palembang', ja: 'パレンバン (Parenban)', lat: -2.99, lon: 104.76,
    note: 'The refineries here were the richest prize of the southern advance, taken by parachute assault on 14 February 1942 before they could be destroyed.'
  },
  {
    id: 'makassar', en: 'Makassar', ja: 'マカッサル (Makassaru)', lat: -5.15, lon: 119.43,
    note: 'The port of Celebes and the base of the Dutch eastern squadron, taken on 9 February 1942.'
  },
  {
    id: 'balikpapan', en: 'Balikpapan', ja: 'バリクパパン', lat: -1.24, lon: 116.85,
    note: 'The Borneo oil port, taken on 24 January 1942; a Dutch demolition party fired the wells and its members were killed for it.'
  },
  {
    id: 'cebu', en: 'Cebu', ja: 'セブ (Sebu)', zh: '宿霧', lat: 10.32, lon: 123.89,
    note: 'The second city of the islands, taken in April 1942 and a centre of the guerrilla resistance afterwards.'
  },
  {
    id: 'davao', en: 'Davao', ja: 'ダバオ (Dabao)', lat: 7.07, lon: 125.61,
    note: 'Taken on 20 December 1941, and before the war the largest Japanese settlement overseas — some twenty thousand people growing abaca.'
  },
  {
    id: 'iloilo', en: 'Iloilo', ja: 'イロイロ (Iroiro)', zh: '伊洛伊洛', lat: 10.72, lon: 122.56,
    note: 'The sugar port of Panay, taken in April 1942.'
  },
  {
    id: 'baguio', en: 'Baguio', ja: 'バギオ (Bagio)', zh: '碧瑤', lat: 16.41, lon: 120.6,
    note: 'The American summer capital in the mountains, taken on 27 December 1941.'
  },
  {
    id: 'dili', en: 'Dili', ja: 'ディリ (Diri)', lat: -8.56, lon: 125.56,
    note: 'Australian and Dutch troops landed here on 17 December 1941 to forestall Japan, in a neutral Portuguese colony; the Japanese came on 19 February 1942.'
  },
  {
    id: 'khabarovsk', en: 'Khabarovsk', ja: 'ハバロフスク', zh: '伯力', lat: 48.48, lon: 135.08,
    note: 'The seat of the Soviet Far Eastern command, and of the armies that stood against the Kwantung Army for a decade and crossed the border in August 1945.'
  },
  {
    id: 'ulanbator', en: 'Urga (Ulan Bator)', ja: '庫倫 (Kuron)', zh: '庫倫（烏蘭巴托）', lat: 47.89,
    lon: 106.91,
    note: 'Urga until 1924, and the capital of a republic that only the Soviet Union recognised.'
  },
  {
    id: 'calcutta', en: 'Calcutta', lat: 22.57, lon: 88.36,
    note: 'The second city of the empire and the base of the Burma front. Japanese aircraft bombed the docks in December 1942, and the Bengal famine of 1943 killed some three million people in the country behind it while the city itself was fed.'
  },
  {
    id: 'madras', en: 'Madras', lat: 13.08, lon: 80.27,
    note: 'Shelled by the <em>Emden</em> in 1914, and partly evacuated in April 1942 when a Japanese landing was thought to be coming.'
  },
  {
    id: 'dacca', en: 'Dacca (Dhaka)', lat: 23.81, lon: 90.41,
    note: 'The old Mughal capital of Bengal and the jute city of the east, which the famine of 1943 struck hard.'
  },
  {
    id: 'colombo', en: 'Colombo', lat: 6.93, lon: 79.86,
    note: 'Raided by carrier aircraft on Easter Sunday, 5 April 1942, in the operation that drove the Eastern Fleet out of the Indian Ocean.'
  },
  {
    id: 'honolulu', en: 'Honolulu', ja: 'ホノルル (Honoruru)', zh: '檀香山', lat: 21.31, lon: -157.86,
    note: 'The territorial capital, where a third of the population was of Japanese descent; martial law was declared here on 7 December 1941 and lasted almost three years.'
  },
  {
    id: 'agana', en: 'Agana (Hagatna)', ja: 'アガナ (Agana)', zh: '阿加尼亞', lat: 13.47, lon: 144.75,
    note: 'Guam\'s capital, taken on 10 December 1941 and renamed Akashi. American shelling in July 1944 left almost nothing of it standing.'
  },
  {
    id: 'koror', en: 'Koror', ja: 'コロール (Korōru)', lat: 7.34, lon: 134.48,
    note: 'The seat of the South Seas Bureau, which governed the whole mandate from Palau from 1922.'
  },
  {
    id: 'tangshan', en: 'Tángshān (Tangshan)', ja: '唐山 (Tōzan)', zh: '唐山', lat: 39.63,
    lon: 118.18,
    note: 'The Kailuan mines, the largest coal workings in north China and British-managed until Japan took them over in 1941.'
  },
  {
    id: 'shanhaiguan', en: 'Shānhǎiguān (Shanhaikuan)', ja: '山海関 (Sankaikan)', zh: '山海關',
    lat: 40.01, lon: 119.75,
    note: 'Where the Great Wall meets the sea and the Manchurian railway crosses into China proper. Taken on 1 January 1933, opening the Rehe campaign.'
  },
  {
    id: 'datong', en: 'Dàtóng (Tatung)', ja: '大同 (Daidō)', zh: '大同', lat: 40.09, lon: 113.3,
    note: 'Coal, and the junction of the two railways the occupation ran on. Taken on 13 September 1937 and attached to the Japanese-sponsored government of northern Shanxi.'
  },
  {
    id: 'luoyang', en: 'Luòyáng (Loyang)', ja: '洛陽 (Rakuyō)', zh: '洛陽', lat: 34.62, lon: 112.45,
    note: 'The Longhai railway city and one of the old capitals of China. Held out until 25 May 1944 — one of the two cities the December 1942 line of control leaves outside the occupation. The Henan famine of 1942–43 killed some two million people in the country round it.'
  },
  {
    id: 'zhengzhou', en: 'Zhèngzhōu (Chengchow)', ja: '鄭州 (Teishū)', zh: '鄭州', lat: 34.75,
    lon: 113.63,
    note: 'The junction of the north–south and east–west trunk railways, and the reason the Huayuankou dikes were cut. Taken briefly in October 1941, given up again, and held from April 1944.'
  },
  {
    id: 'suzhou', en: 'Sūzhōu (Soochow)', ja: '蘇州 (Soshū)', zh: '蘇州', lat: 31.3, lon: 120.62,
    note: 'Silk, gardens, and the Shanghai–Nanjing railway. Fell on 19 November 1937 in the pursuit from Shanghai.'
  },
  {
    id: 'wuxi', en: 'Wúxī (Wusih)', ja: '無錫 (Mushaku)', zh: '無錫', lat: 31.57, lon: 120.3,
    note: 'The cotton and silk mill town of the lower Yangtze, second only to Shanghai in the region\'s industry. Fell on 25 November 1937.'
  },
  {
    id: 'xuzhou', en: 'Xúzhōu (Hsuchow)', ja: '徐州 (Joshū)', zh: '徐州', lat: 34.26, lon: 117.19,
    note: 'The crossing of the north–south and east–west trunk railways, and for that reason the object of the largest campaign of 1938. The Chinese victory at Taierzhuang in April held it until 19 May, and the army got away rather than be encircled.'
  },
  {
    id: 'wuhu', en: 'Wúhú (Wuhu)', ja: '蕪湖 (Buko)', zh: '蕪湖', lat: 31.35, lon: 118.38,
    note: 'The great rice market of the lower Yangtze. Fell on 10 December 1937, three days before Nanjing, cutting the river escape route from the capital.'
  },
  {
    id: 'bengbu', en: 'Bèngbù (Pengpu)', ja: '蚌埠 (Bōfu)', zh: '蚌埠', lat: 32.92, lon: 117.39,
    note: 'On the Tianjin–Pukow railway where it crosses the Huai. Taken in February 1938 in the drive north towards Xuzhou.'
  },
  {
    id: 'jiujiang', en: 'Jiǔjiāng (Kiukiang)', ja: '九江 (Kyūkō)', zh: '九江', lat: 29.71, lon: 116,
    note: 'The tea port of Jiangxi and the outlet of the Poyang lake. Fell on 26 July 1938, halfway up the river to Hankou.'
  },
  {
    id: 'yichang', en: 'Yíchāng (Ichang)', ja: '宜昌 (Gishō)', zh: '宜昌', lat: 30.69, lon: 111.29,
    note: 'Where cargo transferred from steamer to junk for the passage of the gorges. Taken on 12 June 1940 and held as the furthest Japanese post up the Yangtze, below the water that shielded Chongqing.'
  },
  {
    id: 'hengyang', en: 'Héngyáng (Hengyang)', ja: '衡陽 (Kōyō)', zh: '衡陽', lat: 26.89,
    lon: 112.57,
    note: 'The junction of the Guangzhou–Hankou and Hunan–Guangxi railways, and the airfield the Ichigo offensive was launched to take. Its garrison held for forty-seven days and surrendered on 8 August 1944.'
  },
  {
    id: 'yueyang', en: 'Yuèyáng (Yochow)', ja: '岳陽 (Gakuyō)', zh: '岳陽', lat: 29.36, lon: 113.13,
    note: 'The Tungting lake port on the Guangzhou–Hankou line, taken in November 1938 and the base from which every attack on Changsha was mounted.'
  },
  {
    id: 'shaoguan', en: 'Sháoguān (Shiuchow)', ja: '韶関 (Shōkan)', zh: '韶關', lat: 24.81,
    lon: 113.6,
    note: 'The wartime capital of Guangdong after Guangzhou fell, on the railway north to Hunan, and not taken until January 1945.'
  },
  {
    id: 'wuzhou', en: 'Wúzhōu (Wuchow)', ja: '梧州 (Goshū)', zh: '梧州', lat: 23.48, lon: 111.28,
    note: 'Where the West River leaves Guangxi for Guangzhou, and the trade route between them. Taken in the 1944 offensive.'
  },
  {
    id: 'zunyi', en: 'Zūnyì (Tsunyi)', ja: '遵義 (Jungi)', zh: '遵義', lat: 27.73, lon: 106.93,
    note: 'Where the Communist leadership met in January 1935, in the middle of the Long March, and Mao emerged in charge of the party\'s military line.'
  },
  {
    id: 'dali', en: 'Dàlǐ (Tali)', ja: '大理 (Dairi)', zh: '大理', lat: 25.61, lon: 100.27,
    note: 'The old Nanzhao capital, on the Burma Road through western Yunnan along which the fighting came in 1944.'
  },
  {
    id: 'wanxian', en: 'Wànzhōu (Wanhsien)', ja: '万県 (Manken)', zh: '萬縣', lat: 30.81,
    lon: 108.41,
    note: 'The upper Yangtze port above the gorges, and the scene of a British naval bombardment in 1926 that did much to turn Chinese opinion against the treaty powers.'
  },
  {
    id: 'baoji', en: 'Bǎojī (Paoki)', ja: '宝鶏 (Hōkei)', zh: '寶雞', lat: 34.36, lon: 107.14,
    note: 'The railhead of the line west from Sian, and the road to Gansu and the Soviet supply route.'
  },
  {
    id: 'tianshui', en: 'Tiānshuǐ (Tienshui)', ja: '天水 (Tensui)', zh: '天水', lat: 34.58,
    lon: 105.72,
    note: 'On the Gansu corridor where the Lunghai railway ran out, a stage on the overland road that carried Soviet aid until 1941.'
  },
  {
    id: 'chaoyang', en: 'Cháoyáng (Chaoyang)', ja: '朝陽 (Chōyō)', zh: '朝陽', lat: 41.57,
    lon: 120.45,
    note: 'On the road from the Wall into Rehe, taken in the campaign of February and March 1933.'
  },
  {
    id: 'yanji', en: 'Yánjí (Yenki)', ja: '延吉 (Enkichi)', zh: '延吉', lat: 42.91, lon: 129.51,
    note: 'The seat of Jiandao, the one Manchurian province with a Korean majority, and the ground of both Korean resistance and the counter-insurgency against it.'
  },
  {
    id: 'jiamusi', en: 'Jiāmùsī (Kiamusze)', ja: '佳木斯 (Kamusu)', zh: '佳木斯', lat: 46.81,
    lon: 130.32,
    note: 'The seat of Sankiang on the Songhua, and the country the Manchukuo settler schemes were pushed into hardest.'
  },
  {
    id: 'yining', en: 'Yīníng (Ining)', ja: '伊寧 (Inei)', zh: '伊寧', lat: 43.91, lon: 81.32,
    note: 'The Ili valley at the Soviet frontier, where a Turkic rising against Chinese rule broke out in 1944.'
  },
  {
    id: 'shigatse', en: 'Shigatse', lat: 29.27, lon: 88.88,
    note: 'The seat of the Panchen Lama at Tashilhunpo, and the second city of Tibet.'
  },
  {
    id: 'hohhot2', en: 'Éjìnà (Etsina)', ja: '額済納 (Gakusaina)', zh: '額濟納', lat: 41.03,
    lon: 101.05,
    note: 'The oasis where the Edsin Gol dies in the Gobi, and the seat of the Ejine Torghut banner, administered from Ningxia. Khara-Khoto, the Tangut city Kozlov dug out of the sand in 1908, lies a short way downstream. Nothing to do with Mengchiang: the nearest ground that state put on its own maps is 240 km to the east, and this was never within its reach or Japan\'s.'
  },
  {
    id: 'bombay', en: 'Bombay (Mumbai)', lat: 18.94, lon: 72.83,
    note: 'The Congress passed the Quit India resolution here on 8 August 1942; the arrests began the next morning and the movement was suppressed within weeks.'
  },
  {
    id: 'delhi', en: 'Delhi & New Delhi', lat: 28.61, lon: 77.21,
    note: 'Capital of the Raj from 1911.'
  },
  {
    id: 'karachi', en: 'Karachi', lat: 24.86, lon: 67.01,
    note: 'The port of Sind and the airfield on the trunk route from Britain to India and beyond.'
  },
  {
    id: 'lahore', en: 'Lahore', lat: 31.55, lon: 74.34,
    note: 'The capital of the Punjab, and the city where the Muslim League passed the Lahore Resolution in March 1940.'
  },
  {
    id: 'amritsar', en: 'Amritsar', lat: 31.63, lon: 74.87,
    note: 'Where troops fired on a penned crowd at Jallianwala Bagh in April 1919, killing several hundred and turning a generation against British rule.'
  },
  {
    id: 'peshawar', en: 'Peshawar', lat: 34.01, lon: 71.58,
    note: 'The garrison city at the mouth of the Khyber, and the base for the frontier campaigns of the 1930s.'
  },
  {
    id: 'quetta', en: 'Quetta', lat: 30.18, lon: 66.99,
    note: 'The Baluchistan garrison and staff college, destroyed by the earthquake of 1935 in which some thirty thousand died.'
  },
  { id: 'simla', en: 'Simla (Shimla)', lat: 31.1, lon: 77.17, note: 'The summer capital.' },
  {
    id: 'lucknow', en: 'Lucknow', lat: 26.85, lon: 80.95,
    note: 'The seat of the United Provinces, and a centre of the Congress and of the Muslim League alike.'
  },
  {
    id: 'cawnpore', en: 'Cawnpore (Kanpur)', lat: 26.45, lon: 80.33,
    note: 'The cotton and leather mills that clothed and shod the Indian Army.'
  },
  {
    id: 'agra', en: 'Agra', lat: 27.18, lon: 78.01,
    note: 'On the trunk road and railway of the Gangetic plain.'
  },
  {
    id: 'benares', en: 'Benares (Varanasi)', lat: 25.32, lon: 83.01,
    note: 'The pilgrimage city on the Ganges, and one of the princely states drawn inside the United Provinces on this map.'
  },
  {
    id: 'jaipur', en: 'Jaipur', lat: 26.92, lon: 75.79,
    note: 'The seat of one of the larger Rajputana states, whose ruler kept his throne under treaty with the Crown.'
  },
  {
    id: 'ahmedabad', en: 'Ahmedabad', lat: 23.03, lon: 72.58,
    note: 'The mill city of Gujarat, and where Gandhi\'s Sabarmati ashram stood; the Salt March set out from it in March 1930.'
  },
  {
    id: 'nagpur', en: 'Nagpur', lat: 21.15, lon: 79.09,
    note: 'The seat of the Central Provinces, and the junction of the north–south and east–west trunk lines.'
  },
  {
    id: 'poona', en: 'Poona (Pune)', lat: 18.52, lon: 73.86,
    note: 'The Deccan garrison town. Gandhi was interned in the Aga Khan\'s palace here from August 1942, and his wife died in it.'
  },
  {
    id: 'hyderabaddn', en: 'Hyderabad', lat: 17.38, lon: 78.49,
    note: 'Capital of the Nizam’s dominions.'
  },
  {
    id: 'bangalore', en: 'Bangalore (Bengaluru)', lat: 12.97, lon: 77.59,
    note: 'A cantonment and, by the war, the site of India\'s first aircraft factory.'
  },
  {
    id: 'mysorecity', en: 'Mysore', lat: 12.3, lon: 76.64,
    note: 'The seat of one of the largest and best-run princely states, whose ruler kept his throne under treaty with the Crown.'
  },
  {
    id: 'cochin', en: 'Cochin (Kochi)', lat: 9.93, lon: 76.27,
    note: 'The old spice port of the Malabar coast, with a Portuguese, then Dutch, then British history behind it.'
  },
  {
    id: 'trivandrum', en: 'Trivandrum (Thiruvananthapuram)', lat: 8.52, lon: 76.94,
    note: 'The seat of Travancore, the princely state of the far south-west.'
  },
  {
    id: 'vizag', en: 'Vizagapatam (Visakhapatnam)', lat: 17.69, lon: 83.22,
    note: 'The east-coast port, shelled from the sea by a Japanese submarine in April 1942.'
  },
  {
    id: 'chittagong', en: 'Chittagong', lat: 22.36, lon: 91.78,
    note: 'The base for the Arakan front.'
  },
  {
    id: 'trincomalee', en: 'Trincomalee', lat: 8.59, lon: 81.21,
    note: 'The Eastern Fleet’s base, raided April 1942.'
  },
  {
    id: 'akyab', en: 'Akyab (Sittwe)', lat: 20.15, lon: 92.9,
    note: 'The port of Arakan, taken in 1942 and the objective of three Allied offensives before it was retaken in January 1945.'
  },
  { id: 'lashio', en: 'Lashio', lat: 22.94, lon: 97.75, note: 'Railhead of the Burma Road.' },
  {
    id: 'myitkyina', en: 'Myitkyina', lat: 25.38, lon: 97.4,
    note: 'The northern railhead and airfield, taken in May 1942 and retaken in August 1944 after a siege that opened the road to China.'
  },
  {
    id: 'jogjakarta', en: 'Jogjakarta (Yogyakarta)', ja: 'ジョクジャカルタ', lat: -7.8, lon: 110.37,
    note: 'The sultanate left under its own ruler by the Dutch, and a centre of the nationalist movement that declared independence in 1945.'
  },
  {
    id: 'soerakarta', en: 'Soerakarta (Surakarta, Solo)', ja: 'スラカルタ', lat: -7.57, lon: 110.83,
    note: 'The other princely land of central Java, ruled by its susuhunan under Dutch oversight.'
  },
  {
    id: 'buitenzorg', en: 'Buitenzorg (Bogor)', ja: 'ボイテンゾルグ', lat: -6.6, lon: 106.8,
    note: 'The governor-general\'s seat in the hills, and its botanical garden, which was the scientific centre of the colony.'
  },
  {
    id: 'cheribon', en: 'Cheribon (Cirebon)', ja: 'チレボン', lat: -6.71, lon: 108.55,
    note: 'A north-coast sugar port on the Java trunk railway.'
  },
  {
    id: 'malang', en: 'Malang', ja: 'マラン', lat: -7.98, lon: 112.63,
    note: 'The hill town of east Java, and a Dutch garrison and air base.'
  },
  {
    id: 'padang', en: 'Padang', ja: 'パダン', lat: -0.95, lon: 100.35,
    note: 'The west Sumatran port, and the way out for those who got away in 1942.'
  },
  {
    id: 'sabang', en: 'Sabang', ja: 'サバン', lat: 5.89, lon: 95.32,
    note: 'The naval station at the head of Sumatra.'
  },
  {
    id: 'pontianak', en: 'Pontianak', ja: 'ポンティアナック', lat: -0.02, lon: 109.34,
    note: 'The west Borneo port, where the Japanese navy executed several thousand people in the Mandor killings of 1943 and 1944.'
  },
  {
    id: 'bandjermasin', en: 'Bandjermasin (Banjarmasin)', ja: 'バンジェルマシン', lat: -3.32,
    lon: 114.59, note: 'The south Borneo port, taken on 10 February 1942.'
  },
  {
    id: 'tarakan', en: 'Tarakan', ja: 'タラカン', lat: 3.3, lon: 117.59,
    note: 'Oil, taken 11 January 1942.'
  },
  {
    id: 'manado', en: 'Menado (Manado)', ja: 'メナド', lat: 1.49, lon: 124.84,
    note: 'Taken by parachute assault on 11 January 1942, the first Japanese airborne operation of the war.'
  },
  {
    id: 'ambon', en: 'Ambon (Amboina)', ja: 'アンボン', lat: -3.7, lon: 128.18,
    note: 'Taken on 3 February 1942. More than three hundred Australian and Dutch prisoners were killed at Laha airfield in the days that followed.'
  },
  {
    id: 'kupang', en: 'Koepang (Kupang)', ja: 'クーパン', lat: -10.17, lon: 123.61,
    note: 'Dutch Timor\'s capital, taken on 20 February 1942 with a parachute landing behind the Australian force, which withdrew into the hills of Portuguese Timor.'
  },
  {
    id: 'shijiazhuang', en: 'Shíjiāzhuāng (Shihkiachwang)', ja: '石家荘 (Sekkasō)', zh: '石家莊',
    lat: 38.04, lon: 114.51,
    note: 'The junction where the Beijing–Hankou trunk line meets the railway west into Shanxi, which is the whole reason for the place: it was a village until the lines came. Fell in October 1937, a fortnight after Baoding.'
  },
  {
    id: 'tanggu', en: 'Tánggū (Tangku)', ja: '塘沽 (Tōko)', zh: '塘沽', lat: 39.00, lon: 117.65,
    note: 'Tianjin\'s port at the mouth of the Hai. The truce signed here in May 1933 ended the fighting after Rehe and gave north China a demilitarised zone, which Japan spent the next four years pushing into.'
  },
];

JMAP.PROVINCES = {
  Attu: { en: 'Attu', zh: '阿圖島' },
  Kiska: { en: 'Kiska', zh: '基斯卡島' },
  Agattu: { en: 'Agattu — uninhabited', zh: '阿加圖島' },
  'Shemya & the Semichi Islands': { en: 'Shemya & the Semichi Islands — American airfield from May 1943', zh: '謝米亞島' },
  Buldir: { en: 'Buldir — uninhabited', zh: '布爾迪爾島' },
  'Rat Island': { en: 'Rat Island — uninhabited', zh: '鼠島' },
  'Little Sitkin': { en: 'Little Sitkin — uninhabited', zh: '小錫特金島' },
  Amchitka: { en: 'Amchitka — American landing January 1943', zh: '阿姆奇特卡島' },
  Semisopochnoi: { en: 'Semisopochnoi — uninhabited', zh: '謝米索波奇諾伊島' },
  Amatignak: { en: 'Amatignak — uninhabited', zh: '阿馬蒂格納克島' },
  Ulak: { en: 'Ulak — uninhabited', zh: '烏拉克島' },
  Gareloi: { en: 'Gareloi — uninhabited', zh: '加雷洛伊島' },
  Tanaga: { en: 'Tanaga — uninhabited', zh: '塔納加島' },
  Kanaga: { en: 'Kanaga — uninhabited', zh: '卡納加島' },
  Adak: { en: 'Adak — American base from August 1942', zh: '阿達克島' },
  Kagalaska: { en: 'Kagalaska — uninhabited', zh: '卡加拉斯卡島' },
  'Great Sitkin': { en: 'Great Sitkin — uninhabited', zh: '大錫特金島' },
  Atka: { en: 'Atka — the village burned in June 1942 and its people moved south', zh: '阿特卡島' },
  Amlia: { en: 'Amlia — uninhabited', zh: '阿姆利亞島' },
  Seguam: { en: 'Seguam — uninhabited', zh: '塞瓜姆島' },
  Amukta: { en: 'Amukta — uninhabited', zh: '阿穆克塔島' },
  Yunaska: { en: 'Yunaska — uninhabited', zh: '尤納斯卡島' },
  'Islands of Four Mountains': { en: 'The Islands of Four Mountains — uninhabited', zh: '四山群島' },
  Umnak: { en: 'Umnak — Fort Glenn, the secret airfield of 1942', zh: '烏姆納克島' },
  Unalaska: { en: 'Unalaska — Dutch Harbor, bombed 3–4 June 1942', zh: '烏納拉斯卡島' },
  Akutan: { en: 'Akutan — where the intact Zero was recovered in July 1942', zh: '阿庫坦島' },
  Akun: { en: 'Akun', zh: '阿昆島' },
  Unimak: { en: 'Unimak — Fort Randall at Cold Bay', zh: '烏尼馬克島' },
  Assam: { en: 'Assam Province — with Sylhet, and with Manipur and Tripura inside it' },
  Bengal: { en: 'Bengal Presidency' },
  Bihar: { en: 'Bihar Province' },
  Orissa: { en: 'Orissa — the Orissa States are drawn inside it' },
  UnitedProvinces: { en: 'United Provinces of Agra and Oudh' },
  Punjab: { en: 'Punjab Province' },
  Delhi: { en: 'Delhi (chief commissioner’s province)' },
  Sind: { en: 'Sind Province (separated from Bombay, 1936)' },
  Baluchistan: { en: 'Baluchistan (agency territory)' },
  NWFP: { en: 'North-West Frontier Province' },
  CentralProvinces: {
    en: 'Central Provinces — Berar and Nagpur are drawn with Bombay, the Central India states with this'
  },
  Bombay: { en: 'Bombay Presidency — drawn with Berar, Nagpur and the western states inside it' },
  Madras: { en: 'Madras Presidency' },
  Pegu: { en: 'Pegu Division (Toungoo district was Tenasserim’s)', zh: '勃固省' },
  Irrawaddy: { en: 'Irrawaddy Division', zh: '伊洛瓦底省' },
  Magwe: { en: 'Magwe Division', zh: '馬圭省' },
  MandalayDiv: { en: 'Mandalay Division', zh: '曼德勒省' },
  Sagaing: { en: 'Sagaing Division', zh: '實皆省' },
  Tenasserim: { en: 'Tenasserim Division — Thaton, Amherst, Tavoy, Mergui', zh: '丹那沙林省' },
  Arakan: { en: 'Arakan Division', zh: '阿拉干省' },
  MongpanEast: { en: 'Mongpan east of the Salween', zh: '孟畔東部' },
  Kengtung: { en: 'Kengtung State — Kengtung, Monghsat and Tachileik', zh: '景棟' },
  ShanStates: { en: 'Shan States (federated)', zh: '撣邦' },
  KachinHills: { en: 'Kachin Hills', zh: '克欽山區' },
  ChinHills: { en: 'Chin Hills', zh: '欽丘陵' },
  Karenni: { en: 'Karenni States', zh: '克倫尼' },
  Salween: { en: 'Salween District — the Papun hills, inside Tenasserim', zh: '薩爾溫地區' },
  'Shaan-Gan-Ning': { en: 'Shǎngānníng border region — Yenan', zh: '陝甘寧邊區' },
  'Jin-Sui': { en: 'Jìnsuí — Shansi and Suiyuan', zh: '晉綏' },
  'Jin-Cha-Ji': { en: 'Jìnchájì — Shansi, Chahar and Hopei', zh: '晉察冀' },
  Jinan: { en: 'Jìnán (Chi-nan) — southern Hopei', zh: '冀南' },
  'Taihang and Taiyue': { en: 'Tàiháng and Tàiyuè', zh: '太行・太岳' },
  'Ji-Lu-Yu': { en: 'Jìlǔyù — Hopei, Shantung and Honan', zh: '冀魯豫' },
  Qinghe: { en: 'Qīnghé — the Yellow River delta', zh: '清河' },
  Jiaodong: { en: 'Jiāodōng — the Shantung peninsula', zh: '膠東' },
  Luzhong: { en: 'Lǔzhōng — central Shantung', zh: '魯中' },
  Lunan: { en: 'Lǔnán — southern Shantung', zh: '魯南' },
  Binhai: { en: 'Bīnhǎi — the Shantung coast south of Kiaochow', zh: '濱海' },
  Subei: { en: 'Sūběi — northern Kiangsu', zh: '蘇北' },
  Huaibei: { en: 'Huáiběi — north of the Huai', zh: '淮北' },
  Huainan: { en: 'Huáinán — south of the Huai', zh: '淮南' },
  Suzhong: { en: 'Sūzhōng — central Kiangsu', zh: '蘇中' },
  Sunan: { en: 'Sūnán — southern Kiangsu', zh: '蘇南' },
  Wanjiang: { en: 'Wǎnjiāng — the Anhwei Yangtze', zh: '皖江' },
  Zhedong: { en: 'Zhèdōng — eastern Chekiang', zh: '浙東' },
  'E-Yu-Wan': { en: 'Èyùwǎn — Hupeh, Honan and Anhwei', zh: '鄂豫皖' },
  Anhui: {
    en: 'Ānhuī (Anhwei) — the Huai plain and the lower Yangtze, rice and wheat, and the floods the Huai brought almost yearly'
  },
  Chahaer: {
    en: 'Cháhā’ěr (Chahar) — steppe and the caravan road north from Zhangjiakou, which handled the brick tea and wool of Outer Mongolia. Japanese-sponsored Mongol government in the north from 1936; abolished in 1952'
  },
  Fujian: {
    en: 'Fújiàn (Fukien) — mountains to the sea, tea from the Wuyi hills, and the province most of Southeast Asia\'s Chinese emigrants came from'
  },
  Gansu: {
    en: 'Gānsù (Kansu) — the Hexi corridor, the old road to Central Asia between the Qilian mountains and the desert; wool, and Muslim generals of the Ma family in the west'
  },
  Guangdong: {
    en: 'Guǎngdōng (Kwangtung) — the Pearl River delta, silk and rice, Canton\'s trade, and the emigration that built the Chinese communities of the Americas. Chen Jitang ran it in near-independence from 1929'
  },
  Guangxi: {
    en: 'Guǎngxī (Kwangsi) — karst hills and poor soil, and the base of the Guangxi clique under Li Zongren and Bai Chongxi, who fought Chiang Kai-shek in 1929 and again in 1930'
  },
  Guizhou: {
    en: 'Guìzhōu (Kweichow) — the poorest province of the interior, mountains and mist, opium the one crop that paid to carry out'
  },
  Hebei: {
    en: 'Héběi (Hopei) — called Zhili, the \'directly ruled\' province, until 1928, when the capital moved to Nanjing and Beijing became Beiping; wheat, cotton and the coal at Kailuan'
  },
  Heilongjiang: {
    en: 'Hēilóngjiāng (Heilungkiang) — the black-earth north, soybeans and timber; called Lungkiang under Manchukuo'
  },
  Henan: {
    en: 'Hénán (Honan) — the north China plain either side of the Yellow River, wheat and cotton, and the Longhai and Pinghan railways crossing at Zhengzhou'
  },
  Hubei: {
    en: 'Húběi (Hupeh) — the Yangtze and the Han meeting at Wuhan, cotton and the iron at Daye that fed the Hanyang works'
  },
  Hunan: {
    en: 'Húnán — rice from the Dongting basin, and the antimony at Xikuangshan, the largest deposit in the world'
  },
  Jehol: {
    en: 'Rèhé (Jehol) — forest and grassland beyond the Wall, made a province in 1928 and taken by Japan in February 1933, when it was attached to Manchukuo; abolished in 1955 and divided between Hebei, Liaoning and Inner Mongolia'
  },
  Jiangsu: {
    en: 'Jiāngsū (Kiangsu) — the Yangtze delta, silk, cotton and the richest farmland in China; Nanjing was the capital from 1928 and Shanghai sat inside it'
  },
  Jiangxi: {
    en: 'Jiāngxī (Kiangsi) — rice, the tungsten of the southern hills and the porcelain kilns at Jingdezhen; the Communist base areas that became the Jiangxi Soviet were forming here in 1930'
  },
  Jilin: {
    en: 'Jílín (Kirin) — soybeans and forest, and the South Manchuria Railway\'s northern reach'
  },
  Liaoning: {
    en: 'Liáoníng — renamed from Fengtien in 1929 and called Fengtien again under Manchukuo; the industrial heart of the north-east, with the coal at Fushun and the steel at Anshan'
  },
  Ningxia: {
    en: 'Níngxià (Ninghsia) — the Yellow River\'s irrigated bend and desert either side of it, made a province in 1928 and run by Ma Hongkui'
  },
  Qinghai: {
    en: 'Qīnghǎi (Tsinghai) — high pasture round the salt lake of Kokonor, Tibetan and Mongol herders, made a province in 1928 and run by Ma Bufang'
  },
  Shaanxi: {
    en: 'Shǎnxī (Shensi) — the loess plateau and the Wei valley below it, wheat and cotton; the Communists reached northern Shaanxi at the end of the Long March in 1935'
  },
  Shandong: {
    en: 'Shāndōng (Shantung) — wheat and groundnuts on a peninsula between two seas, Confucius\'s Qufu, and the German legacy at Qingdao. Han Fuju governed it from 1930'
  },
  Shanxi: {
    en: 'Shānxī (Shansi) — the richest coalfield in China under a loess plateau, and Yan Xishan\'s province: he ruled it from 1911 to 1949, ran it with its own railway gauge and its own currency, and led the coalition that fought Chiang Kai-shek in the Central Plains War of 1930'
  },
  Sichuan: {
    en: 'Sìchuān (Szechwan) — the Red Basin behind its gorges, rice, salt from the wells at Zigong and a great deal of opium; divided in 1930 among garrison-area warlords, Liu Xiang and Liu Wenhui the largest, and not brought under Nanjing until 1935'
  },
  Suiyuan: {
    en: 'Suíyuǎn (Suiyuan) — the Yellow River\'s northern bend, irrigated at Hetao, with Baotou the wool railhead of the steppe. Made a province in 1928; the eastern half is what Mengchiang held'
  },
  SuiyuanWest: { en: 'Western Suíyuǎn — Wuyuan, Linhe and the Ordos, held by Fu Zuoyi throughout' },
  Xikang: {
    en: 'Xīkāng (Sikang) — eastern Kham, Tibetan in speech and religion, claimed by both Nanjing and Lhasa; a special administrative region until 1939, then a province, and abolished in 1955 between Sichuan and Tibet'
  },
  Xinjiang: {
    en: 'Xīnjiāng (Sinkiang) — oases round the Taklamakan, cotton and livestock, and a trade that ran to the Soviet Union rather than to China; Jin Shuren governed in 1930, Sheng Shicai from 1933'
  },
  Xizang: { en: 'Tibet' },
  Yunnan: {
    en: 'Yúnnán — high plateau on the Burmese and Indochinese frontier, tin from Gejiu, copper and opium, and a French railway to Haiphong. Long Yun ruled it from 1927 to 1945 with little reference to Nanjing'
  },
  Zhejiang: {
    en: 'Zhèjiāng (Chekiang) — silk from the Hangzhou basin, tea, and a coast of fishing ports and islands'
  },
  Nanumea: {
    en: 'Nanumea',
    note: 'An American airfield was built here in 1943, one of three in the Ellice from which the Gilberts were attacked.'
  },
  Nanumanga: {
    en: 'Nanumanga (Nanumaga)',
    note: 'Never occupied by either side. A wartime American landing party is remembered chiefly for what it did to the reef.'
  },
  Niutao: {
    en: 'Niutao',
    note: 'Never occupied. The Ellice were the nearest unoccupied ground to the Japanese perimeter.'
  },
  Nui: { en: 'Nui', note: 'Never occupied.' },
  Vaitupu: {
    en: 'Vaitupu',
    note: 'The most populous of the Ellice, and the site of the colony\'s secondary school.'
  },
  Nukufetau: {
    en: 'Nukufetau',
    note: 'An American airfield from 1943, the second of the three built in the group.'
  },
  Funafuti: { en: 'Funafuti — the seat of the Ellice Islands' },
  Nukulaelae: {
    en: 'Nukulaelae',
    note: 'Never occupied. Half its people had been carried off by Peruvian slavers in 1863 and it never recovered the numbers.'
  },
  Goa: { en: 'Goa' },
  'Damão (Daman)': { en: 'Damão (Daman)' },
  Diu: { en: 'Diu' },
  'Dadrá (Dadra)': { en: 'Dadrá (Dadra)' },
  'Nagar Aveli (Nagar Haveli)': { en: 'Nagar Aveli (Nagar Haveli)' },
  'Pondicherry (Puducherry)': { en: 'Pondicherry (Puducherry)' },
  'Karikal (Karaikal)': { en: 'Karikal (Karaikal)' },
  'Yanaon (Yanam)': { en: 'Yanaon (Yanam)' },
  'Mahé (Mahe)': { en: 'Mahé (Mahe)' },
  'Chandernagore (Chandannagar)': { en: 'Chandernagore (Chandannagar)' },
  Tonkin: { en: 'Tonkin (protectorate)', zh: '東京' },
  Annam: { en: 'Annam (protectorate)', zh: '安南' },
  Cochinchina: { en: 'Cochinchina (colony)', zh: '交趾支那' },
  Cambodia: { en: 'Cambodia (protectorate)', zh: '柬埔寨' },
  Laos: { en: 'Laos (protectorate)', zh: '寮國' },
  Hokkaido: { en: 'Hokkaidō-chō', ja: '北海道庁 (Hokkaidō-chō)', zh: '北海道廳' },
  Aomori: { en: 'Aomori-ken', ja: '青森県 (Aomori)', zh: '青森縣' },
  Iwate: { en: 'Iwate-ken', ja: '岩手県 (Iwate)', zh: '岩手縣' },
  Miyagi: { en: 'Miyagi-ken', ja: '宮城県 (Miyagi)', zh: '宮城縣' },
  Akita: { en: 'Akita-ken', ja: '秋田県 (Akita)', zh: '秋田縣' },
  Yamagata: { en: 'Yamagata-ken', ja: '山形県 (Yamagata)', zh: '山形縣' },
  Fukushima: { en: 'Fukushima-ken', ja: '福島県 (Fukushima)', zh: '福島縣' },
  Ibaraki: { en: 'Ibaraki-ken', ja: '茨城県 (Ibaraki)', zh: '茨城縣' },
  Tochigi: { en: 'Tochigi-ken', ja: '栃木県 (Tochigi)', zh: '栃木縣' },
  Gunma: { en: 'Gunma-ken', ja: '群馬県 (Gunma)', zh: '群馬縣' },
  Saitama: { en: 'Saitama-ken', ja: '埼玉県 (Saitama)', zh: '埼玉縣' },
  Chiba: { en: 'Chiba-ken', ja: '千葉県 (Chiba)', zh: '千葉縣' },
  Tokyo: { en: 'Tōkyō-fu', ja: '東京府 (Tōkyō)', zh: '東京府' },
  Kanagawa: { en: 'Kanagawa-ken', ja: '神奈川県 (Kanagawa)', zh: '神奈川縣' },
  Niigata: { en: 'Niigata-ken', ja: '新潟県 (Niigata)', zh: '新潟縣' },
  Toyama: { en: 'Toyama-ken', ja: '富山県 (Toyama)', zh: '富山縣' },
  Ishikawa: { en: 'Ishikawa-ken', ja: '石川県 (Ishikawa)', zh: '石川縣' },
  Fukui: { en: 'Fukui-ken', ja: '福井県 (Fukui)', zh: '福井縣' },
  Yamanashi: { en: 'Yamanashi-ken', ja: '山梨県 (Yamanashi)', zh: '山梨縣' },
  Nagano: { en: 'Nagano-ken', ja: '長野県 (Nagano)', zh: '長野縣' },
  Gifu: { en: 'Gifu-ken', ja: '岐阜県 (Gifu)', zh: '岐阜縣' },
  Shizuoka: { en: 'Shizuoka-ken', ja: '静岡県 (Shizuoka)', zh: '靜岡縣' },
  Aichi: { en: 'Aichi-ken', ja: '愛知県 (Aichi)', zh: '愛知縣' },
  Mie: { en: 'Mie-ken', ja: '三重県 (Mie)', zh: '三重縣' },
  Shiga: { en: 'Shiga-ken', ja: '滋賀県 (Shiga)', zh: '滋賀縣' },
  Kyoto: { en: 'Kyōto-fu', ja: '京都府 (Kyōto)', zh: '京都府' },
  Osaka: { en: 'Ōsaka-fu', ja: '大阪府 (Ōsaka)', zh: '大阪府' },
  Hyogo: { en: 'Hyōgo-ken', ja: '兵庫県 (Hyōgo)', zh: '兵庫縣' },
  Nara: { en: 'Nara-ken', ja: '奈良県 (Nara)', zh: '奈良縣' },
  Wakayama: { en: 'Wakayama-ken', ja: '和歌山県 (Wakayama)', zh: '和歌山縣' },
  Tottori: { en: 'Tottori-ken', ja: '鳥取県 (Tottori)', zh: '鳥取縣' },
  Shimane: { en: 'Shimane-ken', ja: '島根県 (Shimane)', zh: '島根縣' },
  Okayama: { en: 'Okayama-ken', ja: '岡山県 (Okayama)', zh: '岡山縣' },
  Hiroshima: { en: 'Hiroshima-ken', ja: '広島県 (Hiroshima)', zh: '廣島縣' },
  Yamaguchi: { en: 'Yamaguchi-ken', ja: '山口県 (Yamaguchi)', zh: '山口縣' },
  Tokushima: { en: 'Tokushima-ken', ja: '徳島県 (Tokushima)', zh: '德島縣' },
  Kagawa: { en: 'Kagawa-ken', ja: '香川県 (Kagawa)', zh: '香川縣' },
  Ehime: { en: 'Ehime-ken', ja: '愛媛県 (Ehime)', zh: '愛媛縣' },
  Kochi: { en: 'Kōchi-ken', ja: '高知県 (Kōchi)', zh: '高知縣' },
  Fukuoka: { en: 'Fukuoka-ken', ja: '福岡県 (Fukuoka)', zh: '福岡縣' },
  Saga: { en: 'Saga-ken', ja: '佐賀県 (Saga)', zh: '佐賀縣' },
  Nagasaki: { en: 'Nagasaki-ken', ja: '長崎県 (Nagasaki)', zh: '長崎縣' },
  Kumamoto: { en: 'Kumamoto-ken', ja: '熊本県 (Kumamoto)', zh: '熊本縣' },
  Oita: { en: 'Ōita-ken', ja: '大分県 (Ōita)', zh: '大分縣' },
  Miyazaki: { en: 'Miyazaki-ken', ja: '宮崎県 (Miyazaki)', zh: '宮崎縣' },
  Kagoshima: { en: 'Kagoshima-ken', ja: '鹿児島県 (Kagoshima)', zh: '鹿兒島縣' },
  Okinawa: { en: 'Okinawa-ken', ja: '沖縄県 (Okinawa)', zh: '沖繩縣' },
  Ulleungdo: {
    en: 'Ullŭngdo (Utsuryō-tō) — part of Chōsen', ja: '鬱陵島 (Utsuryō-tō)', ko: '울릉도 (Ullŭngdo)',
    note: 'The largest island off the east coast of Korea, and the base from which Korean and Japanese fishermen worked the Liancourt Rocks 87 km to the south-east.'
  },
  Jukdo: { en: 'Chukto (Chikuyo) — off Ullŭngdo', ja: '竹嶼 (Chikuyo)', ko: '죽도 (Chukto)' },
  Gwaneumdo: { en: 'Kwanŭmdo (Kannondō) — off Ullŭngdo', ja: '觀音島 (Kannondō)', ko: '관음도 (Kwanŭmdo)' },
  'Seodo, the west islet of the Liancourt Rocks': {
    en: 'Sŏdo (Nishijima) — the west islet of the Liancourt Rocks', ja: '西島 (Nishijima)',
    ko: '서도 (Sŏdo)',
    note: 'Dokdo to Korea, Takeshima to Japan, the Liancourt Rocks to everyone else. Japan incorporated them into Shimane prefecture in 1905, five years before it annexed Korea, so on both of this map’s dates they were inside the same empire as Ullŭngdo and nothing turned on the difference. South Korea has held them with a police detachment since 1954; Japan claims them still.'
  },
  'Dongdo, the east islet of the Liancourt Rocks': {
    en: 'Tongdo (Higashijima) — the east islet of the Liancourt Rocks', ja: '東島 (Higashijima)',
    ko: '동도 (Tongdo)',
    note: 'Dokdo to Korea, Takeshima to Japan, the Liancourt Rocks to everyone else. Japan incorporated them into Shimane prefecture in 1905, five years before it annexed Korea, so on both of this map’s dates they were inside the same empire as Ullŭngdo and nothing turned on the difference. South Korea has held them with a police detachment since 1954; Japan claims them still.'
  },
  Keiki: { en: 'Keiki-dō (Kyŏnggi-do)', ja: '京畿道 (Keiki-dō)', zh: '京畿道', ko: '경기도 (Kyŏnggi-do)' },
  Kogen: { en: 'Kōgen-dō (Kangwŏn-do)', ja: '江原道 (Kōgen-dō)', zh: '江原道', ko: '강원도 (Kangwŏn-do)' },
  Chuseihoku: {
    en: 'Chūseihoku-dō (Ch’ungch’ŏngbuk-to)', ja: '忠清北道 (Chūseihoku-dō)', zh: '忠清北道',
    ko: '충청북도 (Ch’ungch’ŏngbuk-to)'
  },
  Chuseinan: {
    en: 'Chūseinan-dō (Ch’ungch’ŏngnam-do)', ja: '忠清南道 (Chūseinan-dō)', zh: '忠清南道',
    ko: '충청남도 (Ch’ungch’ŏngnam-do)'
  },
  Zenrahoku: {
    en: 'Zenrahoku-dō (Chŏllabuk-to)', ja: '全羅北道 (Zenrahoku-dō)', zh: '全羅北道',
    ko: '전라북도 (Chŏllabuk-to)'
  },
  Zenranan: {
    en: 'Zenranan-dō (Chŏllanam-do)', ja: '全羅南道 (Zenranan-dō)', zh: '全羅南道',
    ko: '전라남도 (Chŏllanam-do)'
  },
  Keishohoku: {
    en: 'Keishōhoku-dō (Kyŏngsangbuk-to)', ja: '慶尚北道 (Keishōhoku-dō)', zh: '慶尚北道',
    ko: '경상북도 (Kyŏngsangbuk-to)'
  },
  Keishonan: {
    en: 'Keishōnan-dō (Kyŏngsangnam-do)', ja: '慶尚南道 (Keishōnan-dō)', zh: '慶尚南道',
    ko: '경상남도 (Kyŏngsangnam-do)'
  },
  Kokai: { en: 'Kōkai-dō (Hwanghae-do)', ja: '黄海道 (Kōkai-dō)', zh: '黃海道', ko: '황해도 (Hwanghae-do)' },
  Heianhoku: {
    en: 'Heianhoku-dō (P’yŏnganbuk-to)', ja: '平安北道 (Heianhoku-dō)', zh: '平安北道',
    ko: '평안북도 (P’yŏnganbuk-to)'
  },
  Heiannan: {
    en: 'Heiannan-dō (P’yŏngannam-do)', ja: '平安南道 (Heiannan-dō)', zh: '平安南道',
    ko: '평안남도 (P’yŏngannam-do)'
  },
  Kankyohoku: {
    en: 'Kankyōhoku-dō (Hamgyŏngbuk-to)', ja: '咸鏡北道 (Kankyōhoku-dō)', zh: '咸鏡北道',
    ko: '함경북도 (Hamgyŏngbuk-to)'
  },
  Kankyonan: {
    en: 'Kankyōnan-dō (Hamgyŏngnam-do)', ja: '咸鏡南道 (Kankyōnan-dō)', zh: '咸鏡南道',
    ko: '함경남도 (Hamgyŏngnam-do)'
  },
  'Shumshu (Shimushu)': {
    en: 'Shumshu (Shimushu)', ja: '占守島 (Shumushu-tō)', zh: '占守島',
    note: 'The northernmost island, heavily garrisoned and facing Kamchatka. Soviet troops landed here on 18 August 1945, three days after the surrender, in the last battle of the war.'
  },
  'Alaid (Araito)': {
    en: 'Alaid (Araito)', ja: '阿頼度島 (Araito-tō)', zh: '阿賴度島',
    note: 'A volcanic cone off Shumshu, uninhabited but for a fishery station.'
  },
  'Paramushir (Paramushiro)': {
    en: 'Paramushir (Paramushiro)', ja: '幌筵島 (Paramushiro-tō)', zh: '幌筵島',
    note: 'The naval and air base from which the Aleutian operation was mounted, and the target of American bombers flying from Attu after 1943.'
  },
  'Makanrushi (Makanru)': {
    en: 'Makanrushi (Makanru)', ja: '磨勘留島 (Makanru-tō)', zh: '磨勘留島',
    note: 'Uninhabited, and used only by fishing crews in season.'
  },
  Onekotan: {
    en: 'Onekotan', ja: '温禰古丹島 (Onnekotan-tō)', zh: '溫禰古丹島',
    note: 'Uninhabited but for a garrison in the war.'
  },
  'Kharimkotan (Harimukotan)': {
    en: 'Kharimkotan (Harimukotan)', ja: '春牟古丹島 (Harimukotan-tō)', zh: '春牟古丹島',
    note: 'Uninhabited; its 1933 eruption swept the shore.'
  },
  Ekarma: { en: 'Ekarma', ja: '越渇磨島 (Ekaruma-tō)', zh: '越渴磨島', note: 'Uninhabited.' },
  'Shiashkotan (Shasukotan)': {
    en: 'Shiashkotan (Shasukotan)', ja: '捨子古丹島 (Shasukotan-tō)', zh: '捨子古丹島',
    note: 'A small settlement and a fox farm, abandoned when the islands changed hands.'
  },
  'Matua (Matsuwa)': {
    en: 'Matua (Matsuwa)', ja: '松輪島 (Matsuwa-tō)', zh: '松輪島',
    note: 'An airfield in the middle of the chain, bombed from the Aleutians and bypassed.'
  },
  'Rasshua (Rasuwa)': { en: 'Rasshua (Rasuwa)', ja: '羅処和島 (Rasuwa-tō)', zh: '羅處和島', note: 'Uninhabited.' },
  'Ketoy (Ketoi)': { en: 'Ketoy (Ketoi)', ja: '計吐夷島 (Ketoi-tō)', zh: '計吐夷島', note: 'Uninhabited.' },
  'Simushir (Shimushiru)': {
    en: 'Simushir (Shimushiru)', ja: '新知島 (Shimushiru-tō)', zh: '新知島',
    note: 'A garrison and a sheltered anchorage in a flooded crater.'
  },
  'Chirpoy (Chirihoi)': { en: 'Chirpoy (Chirihoi)', ja: '知理保以島 (Chirihoi-tō)', zh: '知理保以島', note: 'Uninhabited.' },
  'Urup (Uruppu)': {
    en: 'Urup (Uruppu)', ja: '得撫島 (Uruppu-tō)', zh: '得撫島',
    note: 'Sea otter hunting ground, and Russian until the exchange of 1875.'
  },
  'Etorofu (Iturup)': {
    en: 'Etorofu (Iturup) — the Pearl Harbor fleet sailed from Hitokappu Bay',
    ja: '択捉島 (Etorofu-tō)', zh: '擇捉島'
  },
  'Kunashiri (Kunashir)': {
    en: 'Kunashiri (Kunashir)', ja: '国後島 (Kunashiri-tō)', zh: '國後島',
    note: 'The southernmost large island, Japanese-settled and taken by Soviet troops on 1 September 1945. Japan claims it still.'
  },
  Shikotan: {
    en: 'Shikotan', ja: '色丹島 (Shikotan-tō)', zh: '色丹島',
    note: 'Taken by Soviet troops on 1 September 1945; its Japanese inhabitants were deported in 1947 and Japan claims it still.'
  },
  'the Habomai Islands': {
    en: 'The Habomai Islands', ja: '歯舞群島 (Habomai Guntō)', zh: '齒舞群島',
    note: 'A scatter of islets in sight of Hokkaidō, taken between 1 and 5 September 1945 — after the surrender — and claimed by Japan ever since.'
  },
  Sarawak: { en: 'Sarawak' },
  NorthBorneo: { en: 'North Borneo' },
  Labuan: { en: 'Labuan — a Straits Settlement from 1907 until 1946, not company territory' },
  Brunei: { en: 'Brunei' },
  Johor: { en: 'Johore — Unfederated Malay State' },
  Pahang: { en: 'Pahang — Federated Malay State' },
  Perak: { en: 'Perak — Federated Malay State' },
  Selangor: { en: 'Selangor — Federated Malay State' },
  NegeriSembilan: { en: 'Negri Sembilan — Federated Malay State' },
  Malacca: { en: 'Malacca — Straits Settlement, a Crown colony ruled from Singapore' },
  Singapore: { en: 'Singapore — Straits Settlement, and the capital of the colony' },
  Penang: { en: 'Penang — Straits Settlement, with Province Wellesley on the mainland' },
  Dindings: { en: 'The Dindings — Straits Settlement until 1935' },
  'Christmas Island': {
    en: 'Christmas Island — annexed 1888, attached to the Straits Settlements in 1900 and run from Singapore, worked for phosphate',
    ja: 'クリスマス島 (Kurisumasu-tō)'
  },
  Kedah: { en: 'Kedah — Unfederated Malay State' },
  Perlis: { en: 'Perlis — Unfederated Malay State' },
  Kelantan: { en: 'Kelantan — Unfederated Malay State' },
  Terengganu: { en: 'Trengganu — Unfederated Malay State' },
  'Hsing An Peh': { en: 'Xīng’ānběi (Hsingan North)', ja: '興安北省 (Kōan-hoku)', zh: '興安北省' },
  'Hsing An Tung': { en: 'Xīng’āndōng (Hsingan East)', ja: '興安東省 (Kōan-tō)', zh: '興安東省' },
  'Hsing An Si': { en: 'Xīng’ānxī (Hsingan West)', ja: '興安西省 (Kōan-sei)', zh: '興安西省' },
  'Hsing An Nan': { en: 'Xīng’ānnán (Hsingan South)', ja: '興安南省 (Kōan-nan)', zh: '興安南省' },
  Heiho: { en: 'Hēihé (Heiho)', ja: '黒河省 (Kokka)', zh: '黑河省' },
  Lungkiang: { en: 'Lóngjiāng (Lungkiang)', ja: '龍江省 (Ryūkō)', zh: '龍江省' },
  Sankiang: { en: 'Sānjiāng (Sankiang)', ja: '三江省 (Sankō)', zh: '三江省' },
  'Pin Kiang': { en: 'Bīnjiāng (Pinkiang)', ja: '濱江省 (Hinkō)', zh: '濱江省' },
  'Chien Tao': { en: 'Jiāndǎo (Chientao)', ja: '間島省 (Kantō)', zh: '間島省' },
  'Feng Tien': { en: 'Fèngtiān (Fengtien)', ja: '奉天省 (Hōten)', zh: '奉天省' },
  'An Tung': { en: 'Āndōng (Antung)', ja: '安東省 (Antō)', zh: '安東省' },
  Kirin: { en: 'Jílín (Kirin)', ja: '吉林省 (Kirin)', zh: '吉林省' },
  Chinchow: { en: 'Jǐnzhōu (Chinchow)', ja: '錦州省 (Kinshū)', zh: '錦州省' },
  'Je Hol': {
    en: 'Rèhé (Jehol)', ja: '熱河省 (Nekka)', zh: '熱河省',
    note: 'A province of the Republic until February 1933, when the Kwantung Army took it and attached it to Manchukuo.'
  },
  Marianas: {
    en: 'Mariana Islands', ja: 'マリアナ諸島 (Mariana Shotō)',
    note: 'The chain Japan took from Germany in 1914, less Guam. Its fall in the summer of 1944 put Japan within B-29 range and brought down the Tōjō cabinet.'
  },
  Palau: {
    en: 'Palau', ja: 'パラオ (Parao)',
    note: 'The seat of the South Seas Bureau at Koror from 1922, and the westernmost of the mandate. Peleliu and Angaur were taken in 1944; the rest was bypassed.'
  },
  Yap: {
    en: 'Yap', ja: 'ヤップ (Yappu)',
    note: 'A cable and radio station, and the subject of a long dispute between Japan and the United States in the 1920s. Bypassed and bombed.'
  },
  Chuuk: {
    en: 'Truk (Chuuk)', ja: 'トラック (Torakku)',
    note: 'Truk lagoon, the Combined Fleet\'s central Pacific anchorage — the "Gibraltar of the Pacific" until the carrier raids of February 1944 showed it was nothing of the kind.'
  },
  Pohnpei: {
    en: 'Ponape (Pohnpei)', ja: 'ポナペ (Ponape)',
    note: 'Ponape, the wettest and most fertile of the Carolines, with a Japanese agricultural station. Bypassed and bombed.'
  },
  Kosrae: {
    en: 'Kusaie (Kosrae)', ja: 'クサイエ (Kusaie)',
    note: 'Kusaie, the easternmost of the Carolines. Bypassed entirely.'
  },
  Marshalls: {
    en: 'Marshall Islands', ja: 'マーシャル諸島 (Māsharu Shotō)',
    note: 'The outermost ring of the mandate, and the first of it to go: Kwajalein and Majuro fell in January 1944 and Enewetak in February.'
  },
  Saipan: {
    en: 'Saipan', ja: 'サイパン (Saipan)', zh: '塞班',
    note: 'Sugar, and the largest Japanese civilian population in the mandate. The Americans landed on 15 June 1944 and took it by 9 July; hundreds of civilians killed themselves at Marpi Point rather than surrender.'
  },
  Tinian: {
    en: 'Tinian', ja: 'テニアン (Tenian)', zh: '天寧',
    note: 'Taken between 24 July and 1 August 1944. Its airfields became the busiest in the world, and the atomic missions to Hiroshima and Nagasaki flew from them.'
  },
  Rota: {
    en: 'Rota', ja: 'ロタ (Rota)', zh: '羅塔',
    note: 'Between Saipan and Guam, and never assaulted: its garrison was bypassed and held out until the surrender in 1945.'
  },
  Pagan: {
    en: 'Pagan', ja: 'パガン (Pagan)', zh: '帕甘',
    note: 'An airstrip in the northern Marianas, bombed and then left behind; the garrison was still there in 1945.'
  },
  Agrihan: {
    en: 'Agrihan', ja: 'アグリハン (Agurihan)', zh: '阿格里漢',
    note: 'A volcano in the northern Marianas with a few dozen people on it, bypassed entirely.'
  },
  Anatahan: {
    en: 'Anatahan', ja: 'アナタハン (Anatahan)', zh: '阿納塔漢',
    note: 'Bypassed and forgotten. Some of its garrison refused to believe the war was over and did not give themselves up until June 1951.'
  },
  Babeldaob: {
    en: 'Babeldaob (Palau)', ja: 'バベルダオブ (Baberudaobu)', zh: '巴貝爾道布',
    note: 'The main island of Palau. After Peleliu the Americans left it alone, and its garrison of some twenty-five thousand was starving by 1945.'
  },
  Peleliu: {
    en: 'Peleliu', ja: 'ペリリュー (Peririyū)', zh: '貝里琉',
    note: 'Landed on 15 September 1944 in an operation expected to take four days; it took over two months and introduced the deep cave defence used again on Iwo Jima and Okinawa.'
  },
  Angaur: {
    en: 'Angaur', zh: '安加爾',
    note: 'Phosphate, worked since the German period. Taken between 17 September and 22 October 1944, alongside Peleliu.'
  },
  Weno: {
    en: 'Moen (Weno), Truk', ja: '春島 (Harushima)', zh: '春島',
    note: 'Moen, the main island of Truk and the seat of the anchorage. Operation Hailstone wrecked the fleet base here on 17–18 February 1944, after which Truk was bypassed and left to rot.'
  },
  Kwajalein: {
    en: 'Kwajalein', zh: '瓜加林',
    note: 'Taken between 31 January and 3 February 1944 — the first territory Japan had held since before the war to be taken from her, and the breach of the outer perimeter.'
  },
  Majuro: {
    en: 'Majuro', ja: 'マジュロ (Majuro)', zh: '馬久羅',
    note: 'Taken without a fight on 31 January 1944 and turned into the fleet anchorage from which the drive across the central Pacific was mounted.'
  },
  Jaluit: {
    en: 'Jaluit', ja: 'ヤルート (Yarūto)', zh: '賈盧伊特',
    note: 'The administrative centre of the Marshalls under both the German and the Japanese administrations. Bypassed in 1944, bombed, and starved to the surrender.'
  },
  Wotje: {
    en: 'Wotje', zh: '沃杰',
    note: 'An air base bypassed in 1944 and bombed for the rest of the war; its garrison was never assaulted.'
  },
  Enewetak: {
    en: 'Enewetak', zh: '埃內韋塔克',
    note: 'Taken between 17 and 23 February 1944, which carried the Americans to the western edge of the Marshalls.'
  },
  Bikini: {
    en: 'Bikini', zh: '比基尼',
    note: 'Never fought over. Its people were moved off in 1946 for the American nuclear tests and have never been able to return.'
  },
  Ebon: {
    en: 'Ebon', ja: 'エボン (Ebon)', zh: '埃邦',
    note: 'The southernmost of the Marshalls, and the first of them to be reached by missionaries. Bypassed in the war.'
  },
  'The Mongol leagues': { en: 'The Mongol leagues', ja: '蒙古聯盟 (Mōko renmei)', zh: '蒙古各盟' },
  'North Shansi (Jinbei) Administration': { en: 'Jìnběi — the North Shansi Administration', ja: '晉北政廳 (Shinpoku seichō)', zh: '晉北政廳' },
  'South Chahar (Chanan) Administration': { en: 'Chánán — the South Chahar Administration', ja: '察南政廳 (Satsunan seichō)', zh: '察南政廳' },
  Sumatra: {
    en: 'Sumatra', ja: 'スマトラ (Sumatora)',
    note: 'Rubber, tobacco and above all the oil of Palembang, which was taken by parachute assault on 14 February 1942 before the refineries could be destroyed.'
  },
  Java: {
    en: 'Java', ja: 'ジャワ (Jawa)',
    note: 'The centre of the colony and of its population: two thirds of the Indies lived here. The Dutch surrendered on 8 March 1942, and the Japanese levied the <em>rōmusha</em> labour drafts from it.'
  },
  Madura: {
    en: 'Madura', ja: 'マドゥラ (Madura)',
    note: 'Salt, and cattle, and the island\'s own princely houses.'
  },
  Borneo: {
    en: 'Borneo (Kalimantan)', ja: 'ボルネオ (Boruneo)',
    note: 'Oil at Balikpapan and Tarakan, which was the reason the southern advance came this way at all. Taken in January and February 1942.'
  },
  Sulawesi: {
    en: 'Celebes (Sulawesi)', ja: 'セレベス (Serebesu)',
    note: 'Celebes, taken between January and February 1942, and put under naval rather than army administration for the rest of the war.'
  },
  Bali: {
    en: 'Bali', ja: 'バリ (Bari)',
    note: 'Taken on 19 February 1942; the naval action in the strait off it a few nights earlier was one of the few Allied successes of the campaign.'
  },
  Lombok: {
    en: 'Lombok', ja: 'ロンボク (Ronboku)',
    note: 'Between Bali and Sumbawa, and the strait through which the Allied ships that got away from Java escaped south.'
  },
  Sumbawa: {
    en: 'Sumbawa', ja: 'スンバワ (Sunbawa)',
    note: 'A dry island of horses and sandalwood, and of Tambora, whose eruption in 1815 cooled the whole world.'
  },
  Flores: {
    en: 'Flores', ja: 'フローレス (Furōresu)',
    note: 'Taken in 1942 and used for an airstrip; otherwise left to itself.'
  },
  Sumba: {
    en: 'Sumba', ja: 'スンバ (Sunba)',
    note: 'Horses and ikat weaving, and little else the occupation wanted.'
  },
  WestTimor: {
    en: 'Dutch Timor', ja: 'チモール (Chimōru)',
    note: 'The Dutch half of Timor, taken on 20 February 1942 with a parachute landing behind the Australian force at Koepang.'
  },
  Halmahera: {
    en: 'Halmahera', ja: 'ハルマヘラ (Harumahera)',
    note: 'Bypassed in 1944 when the Americans took Morotai beside it instead, and its garrison was left to starve.'
  },
  Seram: {
    en: 'Ceram (Seram)', ja: 'セラム (Seramu)',
    note: 'Ceram, and the oil at Bula on its eastern end.'
  },
  Buru: {
    en: 'Buru', ja: 'ブル (Buru)',
    note: 'A quiet island off Ceram, later notorious as an Indonesian prison colony.'
  },
  Bangka: {
    en: 'Banka (Bangka)', ja: 'バンカ (Banka)',
    note: 'Tin, worked by Chinese labour since the eighteenth century. Off its coast in February 1942 Japanese troops machine-gunned twenty-two Australian nurses who had survived a sinking; one lived.'
  },
  Belitung: {
    en: 'Billiton (Belitung)', ja: 'ビリトン (Biriton)',
    note: 'Tin, like Banka beside it, and worked the same way.'
  },
  Nias: {
    en: 'Nias', ja: 'ニアス (Niasu)',
    note: 'Off the west coast of Sumatra, and famous for its megaliths and stone-jumping.'
  },
  WestNewGuinea: {
    en: 'Dutch New Guinea', ja: '西部ニューギニア (Seibu Nyūginia)',
    note: 'The Dutch half of New Guinea, hardly administered before the war and the ground the Americans came back through in 1944 — Hollandia, Biak, Sansapor.'
  },
  Atjeh: { en: 'Atjeh and Dependencies (Sumatra)' },
  SumatraEastCoast: { en: 'Sumatra’s East Coast and Tapanoeli' },
  SumatraWestCoast: { en: 'Sumatra’s West Coast' },
  Riouw: { en: 'Riouw and Dependencies' },
  Djambi: { en: 'Djambi (Sumatra)' },
  Palembang: { en: 'Palembang (Sumatra)' },
  BankaBilliton: { en: 'Banka and Billiton' },
  Benkoelen: { en: 'Benkoelen (Sumatra)' },
  Lampongs: { en: 'The Lampongs (Sumatra)' },
  WestJava: { en: 'West Java — Bantam, Batavia, Preanger' },
  CentralJava: { en: 'Central Java — with the princely land of Soerakarta' },
  Jogjakarta: { en: 'Jogjakarta (princely land)' },
  EastJava: { en: 'East Java — with Madura' },
  WestBorneo: { en: 'West Borneo' },
  SouthEastBorneo: { en: 'South and East Borneo' },
  Menado: { en: 'Menado — northern and central Celebes' },
  Celebes: { en: 'Celebes and Dependencies' },
  Papua: {
    en: 'Territory of Papua', zh: '巴布亞',
    note: 'Australian territory outright, not a mandate. Japan never took Port Moresby: the seaborne attempt turned back at the Coral Sea and the overland push was stopped on the Kokoda Track in September 1942.'
  },
  NewGuineaMandate: {
    en: 'Territory of New Guinea (mandate)', zh: '新幾內亞委任統治地',
    note: 'The former German colony, held by Australia under a League mandate and administered from Rabaul — which Japan took in January 1942 and made the base for the whole southern campaign.'
  },
  'North China and the Yangtze valley': { en: 'North China and the Yangtze valley — the main occupied mass', zh: '華北與長江流域' },
  'The Canton delta': { en: 'The Guǎngzhōu (Canton) delta and the West River, held from October 1938', zh: '廣州三角洲' },
  Hainan: { en: 'Hǎinán (Hainan), taken February 1939', ja: '海南島 (Kainan-tō)', zh: '海南島' },
  'Amoy and Kinmen': {
    en: 'Xiàmén (Amoy), taken May 1938, and Jīnmén (Kinmen), taken October 1937',
    ja: '厦門 (Amoi)', zh: '廈門・金門'
  },
  'Swatow and Chaochow': {
    en: 'Shàntóu (Swatow) and Cháozhōu (Chaochow), taken June 1939', ja: '汕頭 (Suatō)',
    zh: '汕頭・潮州'
  },
  Luzon: {
    en: 'Luzon',
    note: 'The main island, with Manila and the rice plain behind it. Invaded in December 1941, lost with Corregidor in May 1942, and fought over again from January 1945 in the longest campaign of the Pacific war.'
  },
  Mindanao: {
    en: 'Mindanao',
    note: 'The southern island, with the Japanese abaca colony at Davao that was the largest Japanese settlement overseas before the war. Taken in 1942 and retaken in 1945.'
  },
  Palawan: {
    en: 'Palawan',
    note: 'The long island reaching towards Borneo. In December 1944 the garrison at Puerto Princesa burned some 140 American prisoners alive rather than let them be liberated.'
  },
  Mindoro: {
    en: 'Mindoro',
    note: 'Taken by the Americans in December 1944 for its airfields, as the stepping stone from Leyte to Luzon.'
  },
  Panay: {
    en: 'Panay',
    note: 'Sugar, and the port of Iloilo. Taken in April 1942 and held afterwards by one of the strongest guerrilla organisations in the islands.'
  },
  Negros: {
    en: 'Negros',
    note: 'The sugar island, whose plantations supplied much of the Philippine crop.'
  },
  Cebu: {
    en: 'Cebu',
    note: 'The oldest Spanish settlement in the islands and the busiest port after Manila.'
  },
  Bohol: {
    en: 'Bohol',
    note: 'A quiet island of rice and coconut, taken without much fighting in 1942.'
  },
  Leyte: {
    en: 'Leyte',
    note: 'Where MacArthur came ashore on 20 October 1944, and off which the largest naval battle ever fought was decided four days later.'
  },
  Samar: {
    en: 'Samar',
    note: 'Off its coast on 25 October 1944 a handful of American escort carriers and destroyers turned back a Japanese battleship force, in the action that decided Leyte Gulf.'
  },
  Masbate: { en: 'Masbate', note: 'Cattle and gold, in the middle of the archipelago.' },
  Abra: { en: 'Abra (Luzon)' },
  Agusan: { en: 'Agusan (Mindanao)' },
  Albay: { en: 'Albay (Luzon, with the sub-province of Catanduanes)' },
  Antique: { en: 'Antique (Panay)' },
  Bataan: { en: 'Bataan (Luzon)' },
  Batanes: { en: 'Batanes' },
  Batangas: { en: 'Batangas (Luzon)' },
  Bukidnon: { en: 'Bukidnon (Mindanao)' },
  Bulacan: { en: 'Bulacan (Luzon)' },
  Cagayan: { en: 'Cagayan (Luzon)' },
  CamarinesNorte: { en: 'Camarines Norte (Luzon)' },
  CamarinesSur: { en: 'Camarines Sur (Luzon)' },
  Capiz: { en: 'Capiz (Panay)' },
  Cavite: { en: 'Cavite (Luzon)' },
  Cotabato: { en: 'Cotabato (Mindanao)' },
  Davao: { en: 'Davao (Mindanao)' },
  IlocosNorte: { en: 'Ilocos Norte (Luzon)' },
  IlocosSur: { en: 'Ilocos Sur (Luzon)' },
  Iloilo: { en: 'Iloilo (Panay)' },
  Isabela: { en: 'Isabela (Luzon)' },
  Laguna: { en: 'Laguna (Luzon)' },
  LaUnion: { en: 'La Union (Luzon)' },
  Lanao: { en: 'Lanao (Mindanao)' },
  Manila: { en: 'City of Manila' },
  Marinduque: { en: 'Marinduque' },
  MisamisOccidental: { en: 'Misamis Occidental (Mindanao)' },
  MisamisOriental: { en: 'Misamis Oriental (Mindanao)' },
  MountainProvince: { en: 'Mountain Province (Luzon)' },
  NegrosOccidental: { en: 'Negros Occidental' },
  NegrosOriental: { en: 'Negros Oriental' },
  NuevaEcija: { en: 'Nueva Ecija (Luzon)' },
  NuevaVizcaya: { en: 'Nueva Vizcaya (Luzon)' },
  Pampanga: { en: 'Pampanga (Luzon)' },
  Pangasinan: { en: 'Pangasinan (Luzon)' },
  Rizal: { en: 'Rizal (Luzon)' },
  Romblon: { en: 'Romblon' },
  Sorsogon: { en: 'Sorsogon (Luzon)' },
  Sulu: { en: 'Sulu' },
  Surigao: { en: 'Surigao (Mindanao)' },
  Tarlac: { en: 'Tarlac (Luzon)' },
  Tayabas: { en: 'Tayabas (Luzon; renamed Quezon in 1946)' },
  Zambales: { en: 'Zambales (Luzon)' },
  Zamboanga: { en: 'Zamboanga (Mindanao, with Basilan)' },
  'Kashmir & Jammu': { en: 'Kashmir & Jammu' },
  Hyderabad: { en: 'Hyderabad — the Nizam’s dominions, the largest of the states' },
  Mysore: { en: 'Mysore' },
  'Travancore & Cochin': { en: 'Travancore & Cochin' },
  'Rajputana, Central India & the Gujarat States': { en: 'Rajputana, Central India and the Gujarat states' },
  'The Baluchistan States — Kalat, Las Bela, Kharan, Makran': { en: 'The Baluchistan states — Kalat, Las Bela, Kharan and Makran' },
  'The Eastern States — Orissa and Chhattisgarh': { en: 'The Eastern States — the Orissa and Chhattisgarh states' },
  'The Punjab States — Patiala, Jind, Nabha, Kapurthala': { en: 'The Punjab states — Patiala, Jind, Nabha and Kapurthala' },
  'Chitral, Dir, Swat & Amb': { en: 'Chitral, Dir, Swat and Amb — the frontier states' },
  'Kolhapur & the Deccan States': { en: 'Kolhapur and the Deccan states' },
  'The Khasi Hill States': { en: 'The Khasi Hill states' },
  Bastar: { en: 'Bastar' },
  Manipur: { en: 'Manipur' },
  Tripura: { en: 'Tripura (Hill Tippera)' },
  'Cooch Behar': { en: 'Cooch Behar' },
  Khairpur: { en: 'Khairpur' },
  'Tehri Garhwal': { en: 'Tehri Garhwal' },
  Rampur: { en: 'Rampur' },
  Benares: { en: 'Benares (Banaras) — Ramnagar, Bhadohi and Chakia' },
  Pudukkottai: { en: 'Pudukkottai' },
  'The Punjab Hill States — Bashahr, Mandi, Suket, Sirmur': { en: 'The Punjab Hill states — Bashahr, Mandi, Suket and Sirmur' },
  'Savanur, Sandur & Banganapalle': { en: 'Savanur, Sandur and Banganapalle' },
  'Waziristan & the frontier tribal agencies': { en: 'Waziristan and the frontier tribal agencies — political agents, not the Punjab' },
  Yakushima: {
    en: 'Yakushima', ja: '屋久島 (Yakushima)', zh: '屋久島',
    note: 'Kagoshima, not Okinawa: the cedar forests here were logged for the navy, and some of the trees standing are thousands of years old.'
  },
  Kuchinoerabujima: {
    en: 'Kuchinoerabujima', ja: '口永良部島 (Kuchinoerabujima)', zh: '口永良部島',
    note: 'Kagoshima. An active volcano with a few hundred people on it.'
  },
  Kuchinoshima: {
    en: 'Kuchinoshima', ja: '口之島 (Kuchinoshima)', zh: '口之島',
    note: 'The northernmost of the Tokara islands, and Kagoshima\'s.'
  },
  Nakanoshima: {
    en: 'Nakanoshima', ja: '中之島 (Nakanoshima)', zh: '中之島',
    note: 'Tokara, and Kagoshima\'s; the highest of the group.'
  },
  Tairajima: { en: 'Tairajima', ja: '平島 (Tairajima)', zh: '平島', note: 'Tokara, and Kagoshima\'s.' },
  Suwanosejima: {
    en: 'Suwanosejima', ja: '諏訪之瀬島 (Suwanosejima)', zh: '諏訪之瀨島',
    note: 'Tokara, and Kagoshima\'s. Its volcano drove the islanders off for seventy years in the nineteenth century.'
  },
  Akusekijima: { en: 'Akusekijima', ja: '悪石島 (Akusekijima)', zh: '惡石島', note: 'Tokara, and Kagoshima\'s.' },
  Kikaijima: {
    en: 'Kikaijima', ja: '喜界島 (Kikaijima)', zh: '喜界島',
    note: 'Amami, and Kagoshima\'s. Its airfield was a staging point for the kamikaze sorties flown against the fleet off Okinawa in 1945.'
  },
  'Amami Ōshima': {
    en: 'Amami Ōshima', ja: '奄美大島 (Amami Ōshima)', zh: '奄美大島',
    note: 'The largest of the Amami group, taken from the Ryūkyū kingdom by Satsuma in 1609 and administered from Kagoshima as Ōshima-gun ever since — not Okinawa Prefecture. The United States held it separately until 1953.'
  },
  Tokunoshima: {
    en: 'Tokunoshima', ja: '徳之島 (Tokunoshima)', zh: '德之島',
    note: 'Amami, and Kagoshima\'s. Its three airfields were bombed hard in the spring of 1945.'
  },
  Okinoerabujima: {
    en: 'Okinoerabujima', ja: '沖永良部島 (Okinoerabujima)', zh: '沖永良部島',
    note: 'Amami, and Kagoshima\'s; sugar and lilies.'
  },
  Yoronjima: {
    en: 'Yoronjima', ja: '与論島 (Yoronjima)', zh: '與論島',
    note: 'The southernmost of the Amami group and of Kagoshima, twenty kilometres from Okinawa.'
  },
  Iheyajima: {
    en: 'Iheyajima', ja: '伊平屋島 (Iheyajima)', zh: '伊平屋島',
    note: 'Okinawa Prefecture, north-west of the main island, and never fought over.'
  },
  Izenajima: {
    en: 'Izenajima', ja: '伊是名島 (Izenajima)', zh: '伊是名島',
    note: 'Okinawa Prefecture. The Shō dynasty of the Ryūkyū kings came from here.'
  },
  Iejima: {
    en: 'Iejima', ja: '伊江島 (Iejima)', zh: '伊江島',
    note: 'Taken between 16 and 21 April 1945 for its airfield. The war correspondent Ernie Pyle was killed on it.'
  },
  'the Kerama Islands': {
    en: 'The Kerama Islands — taken first, 26 March 1945', ja: '慶良間諸島 (Kerama Shotō)',
    zh: '慶良間群島'
  },
  Kumejima: {
    en: 'Kumejima', ja: '久米島 (Kumejima)', zh: '久米島',
    note: 'Okinawa Prefecture. Taken in June 1945; the garrison murdered twenty islanders it accused of collaborating.'
  },
  Miyakojima: {
    en: 'Miyakojima', ja: '宮古島 (Miyakojima)', zh: '宮古島',
    note: 'Garrisoned by some thirty thousand men, bombed and blockaded, and never assaulted — the troops and the islanders were both close to starving by the surrender.'
  },
  Taramajima: {
    en: 'Taramajima', ja: '多良間島 (Taramajima)', zh: '多良間島',
    note: 'Between Miyako and Ishigaki, bypassed with them.'
  },
  Ishigakijima: {
    en: 'Ishigakijima', ja: '石垣島 (Ishigakijima)', zh: '石垣島',
    note: 'The seat of the Yaeyama islands, bypassed and bombed. Three captured American airmen were executed here in 1945, and the officers responsible were tried for it.'
  },
  Iriomotejima: {
    en: 'Iriomotejima', ja: '西表島 (Iriomotejima)', zh: '西表島',
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
    note: 'Uninhabited until 1900, then settled from Hachijōjima and worked for sugar by a single company that owned the whole of them.'
  },
  'the Senkaku / Diaoyu Islands': {
    en: 'The Senkaku / Diaoyu Islands — administered from Okinawa', ja: '尖閣諸島 (Senkaku Shotō)',
    zh: '釣魚臺列嶼',
    note: 'Five islets and three rocks off the north-east of Taiwan, incorporated into Okinawa Prefecture in 1895. A settlement on Uotsurijima worked albatross feathers and dried bonito until the 1940s. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  'Uotsuri Shima': {
    en: 'Uotsurijima — the largest of the Senkaku / Diaoyu Islands', ja: '魚釣島 (Uotsurijima)',
    zh: '釣魚島',
    note: 'The largest of the group, and the only one anybody has lived on: Koga Tatsushirō\'s plant employed a couple of hundred people here before the First World War. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  'Kuba-shima': {
    en: 'Kubajima — in the Senkaku / Diaoyu Islands', ja: '久場島 (Kubajima)', zh: '黃尾嶼',
    note: 'A bare volcanic islet north-east of Uotsurijima, used as a bombing range by the United States after the war and never resettled. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  'Kuba Island': {
    en: 'Kubajima — in the Senkaku / Diaoyu Islands', ja: '久場島 (Kubajima)', zh: '黃尾嶼',
    note: 'A bare volcanic islet north-east of Uotsurijima, used as a bombing range by the United States after the war and never resettled. Claimed today by Japan, by the People’s Republic of China and by Taiwan; uninhabited, and administered by Japan.'
  },
  AngThong: { en: 'Ang Thong' },
  BuriRam: { en: 'Buriram' },
  Chachoengsao: { en: 'Chachoengsao (Paet Riu)' },
  ChaiNat: { en: 'Chainat' },
  Chaiyaphum: { en: 'Chaiyaphum' },
  Chanthaburi: { en: 'Chanthaburi (Chantaboon)' },
  ChiangMai: { en: 'Chiengmai (Chiang Mai)' },
  ChiangRai: { en: 'Chiengrai (Chiang Rai)' },
  ChonBuri: { en: 'Chonburi' },
  Chumphon: { en: 'Chumphon' },
  Kalasin: { en: 'Kalasin' },
  KamphaengPhet: { en: 'Kamphaeng Phet' },
  Kanchanaburi: { en: 'Kanchanaburi (Kanburi)' },
  KhonKaen: { en: 'Khon Kaen' },
  Krabi: { en: 'Krabi' },
  Lampang: { en: 'Nakhon Lampang' },
  Lamphun: { en: 'Lamphun' },
  Loei: { en: 'Loei' },
  Lopburi: { en: 'Lopburi' },
  MaeHongSon: { en: 'Mae Hong Son' },
  MahaSarakham: { en: 'Maha Sarakham — Kalasin was abolished into it in 1932' },
  NakhonNayok: { en: 'Nakhon Nayok' },
  NakhonPathom: { en: 'Nakhon Pathom' },
  NakhonPhanom: { en: 'Nakhon Phanom' },
  NakhonRatchasima: { en: 'Nakhon Ratchasima (Korat)' },
  NakhonSawan: { en: 'Nakhon Sawan (Paknampho)' },
  NakhonSiThammarat: { en: 'Nakhon Si Thammarat (Ligor)' },
  Nan: { en: 'Nan' },
  Narathiwat: { en: 'Bang Nara (Narathiwat)' },
  NongKhai: { en: 'Nong Khai' },
  Nonthaburi: { en: 'Nonthaburi' },
  PathumThani: { en: 'Pathum Thani' },
  Pattani: { en: 'Patani' },
  Phangnga: { en: 'Phangnga' },
  Phatthalung: { en: 'Phatthalung' },
  Phetchabun: { en: 'Phetchabun' },
  Phetchaburi: { en: 'Petchaburi' },
  Phichit: { en: 'Phichit' },
  Phitsanulok: { en: 'Phitsanulok' },
  PhraNakhon: { en: 'Phra Nakhon and Thonburi (Bangkok)' },
  PhraNakhonSiAyutthaya: { en: 'Ayudhya (Ayutthaya)' },
  Phrae: { en: 'Phrae' },
  Phuket: { en: 'Puket (Phuket)' },
  PrachinBuri: { en: 'Prachinburi' },
  PrachuapKhiriKhan: { en: 'Prachuap Khiri Khan' },
  Ranong: { en: 'Ranong' },
  Ratchaburi: { en: 'Rajburi (Ratchaburi)' },
  Rayong: { en: 'Rayong' },
  RoiEt: { en: 'Roi Et' },
  SakonNakhon: { en: 'Sakon Nakhon' },
  SamutPrakan: { en: 'Samut Prakan (Paknam)' },
  SamutSakhon: { en: 'Samut Sakhon (Tachin)' },
  SamutSongkhram: { en: 'Samut Songkhram (Meklong)' },
  Saraburi: { en: 'Saraburi' },
  Satun: { en: 'Satun (Setul)' },
  SiSaKet: { en: 'Khukhan (renamed Sisaket in 1938)' },
  SingBuri: { en: 'Singburi' },
  Songkhla: { en: 'Songkhla (Singora)' },
  Sukhothai: { en: 'Sawankhalok (Sukhothai)' },
  SuphanBuri: { en: 'Suphanburi' },
  SuratThani: { en: 'Surat Thani (Bandon)' },
  Surin: { en: 'Surin' },
  Tak: { en: 'Tak (Raheng)' },
  Trang: { en: 'Trang' },
  Trat: { en: 'Trat' },
  UbonRatchathani: { en: 'Ubon Ratchathani' },
  UdonThani: { en: 'Udon Thani (Udorn)' },
  UthaiThani: { en: 'Uthai Thani' },
  Uttaradit: { en: 'Uttaradit' },
  Yala: { en: 'Yala (Jala)' },
  'Singapore (Pulau Ujong)': {
    en: 'Singapore (Pulau Ujong) — Shōnantō from February 1942', ja: '昭南島 (Shōnantō)',
    orig: 'Pulau Ujong',
    note: 'The island itself, as distinct from the Settlement. Japan renamed it Shōnantō, "light of the south", on 16 February 1942, the day after the surrender.'
  },
  'Sentosa (Pulau Blakang Mati)': {
    en: 'Sentosa (Pulau Blakang Mati)', orig: 'Pulau Blakang Mati',
    note: 'A garrison island guarding the western approach, with the coastal batteries at Fort Siloso — the guns that faced the wrong way in the accounts, though they were turned and fired north in February 1942.'
  },
  'Jurong Island — reclaimed from seven islands after 1995': {
    en: 'Jurong Island — reclaimed from seven islands after 1995',
    note: 'Not a shape of this period at all: the coastline drawn here is the modern one, and this island was made by joining seven smaller ones from 1995. It is on the map because the coastline source is a modern one; see Sources.'
  },
};

/* One block per epoch, and the generator holds it to that: this object
   carried two `e1942` keys for a long time and the later of them silently
   discarded the earlier, so eleven overrides never took effect at all. */
JMAP.PROVINCE_EPOCH = {
  e1930: {
    Sind: { en: 'Sind — a division of the Bombay Presidency until 1936' },
    Orissa: { en: 'Bihar and Orissa Province — one province until 1936' },
    Bihar: { en: 'Bihar and Orissa Province — one province until 1936' },
    UnitedProvinces: { en: 'United Provinces of Agra and Oudh' },
    NWFP: { en: 'North-West Frontier Province — a chief commissioner’s province until 1932' },
    Liaoning: { en: 'Liáoníng (Fengtien until 1929)', ja: '遼寧 (Ryōnei)', zh: '遼寧', ko: '요녕 (Yonyŏng)' },
    Heilongjiang: { en: 'Hēilóngjiāng (Heilungkiang)', zh: '黑龍江' },
    Suiyuan: { en: 'Suíyuǎn (Suiyuan)', zh: '綏遠' },
    SuiyuanWest: { en: 'Suíyuǎn (Suiyuan)', zh: '綏遠' },
    MahaSarakham: { en: 'Maha Sarakham (Kalasin was still separate until 1932)' },
    SiSaKet: { en: 'Khukhan' },
    Sukhothai: { en: 'Sawankhalok (Sukhothai was merged into it in 1931)' },
    Tenasserim: { en: 'Tenasserim Division — Thaton, Amherst, Tavoy, Mergui' },
    Labuan: { en: 'Labuan — a Crown colony from 1848, attached to the Straits Settlements in 1907' },
    Dindings: {
      en: 'The Dindings — Straits Settlement: Lumut, Sitiawan and Pangkor, British since 1826 and ruled from Singapore'
    },
  },
  e1942: {
    Funafuti: {
      en: 'Funafuti — the American base from October 1942',
      note: 'The lagoon and the airstrip the assault on Tarawa and Makin was mounted from in November 1943. Marines landed on 2 October 1942 and the islanders of the main islet were moved to make room for the runway.'
    },
    Nukufetau: { en: 'Nukufetau — an American airfield from 1943' },
    Nanumea: { en: 'Nanumea — an American airfield from 1943' },
    Sind: { en: 'Sind Province' },
    Orissa: { en: 'Orissa Province — the Orissa States are drawn inside it' },
    Bihar: { en: 'Bihar Province' },
    UnitedProvinces: { en: 'United Provinces' },
    Liaoning: { en: 'Fèngtiān (Fengtien)', ja: '奉天 (Hōten)', zh: '奉天', ko: '봉천 (Pongch’ŏn)' },
    Heilongjiang: { en: 'Lóngjiāng (Lungkiang)', zh: '龍江' },
    SiSaKet: { en: 'Sisaket (Khukhan until 1938)' },
    Sukhothai: { en: 'Sukhothai (Sawankhalok until 1939)' },
    Labuan: { en: 'Labuan — under the Japanese military administration of British Borneo' },
    Dindings: { en: 'The Dindings — part of Perak again since 16 February 1935' },
    'Christmas Island': {
      en: 'Christmas Island — taken by Japan on 31 March 1942 for its phosphate',
      ja: 'クリスマス島 (Kurisumasu-tō)'
    },
    Singapore: { en: 'Singapore — Shōnantō under Japanese military administration' },
    Penang: { en: 'Penang — under the Japanese military administration of Malaya' },
    Malacca: { en: 'Malacca — under the Japanese military administration of Malaya' },
  },
};

JMAP.CLUSTER_EPOCH = {
  e1942: {
    'malaya/Dindings': null,
    'siamgain/Laos': null,
    'siamgain/Cambodia': null,
  },
};
