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
      flip: true, atoms: ['china'],
      lights: ['manchuria', 'jehol', 'chahar', 'suiyuan', 'xinjiang'],
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
      note: 'British India was a patchwork: nine governors\' provinces and a handful of smaller chief commissioners\' ones, ruled directly, and beside them some six hundred princely states whose rulers kept their thrones under treaties with the Crown. Hyderabad, the largest by population and revenue, had its own army and currency, and the Nizam was reckoned the richest man alive. The states are drawn here from a layer of their 1931 boundaries rather than approximated from modern units, so the shapes are the shapes: the Rajputana and Central India agencies as one western mass, the Baluchistan states of Kalat and Las Bela, the Eastern States through Orissa and Chhattisgarh, the hill states along the frontier, and the small Deccan states scattered through Bombay. The very smallest of the six hundred are below the resolution of this map and are drawn inside whichever province surrounded them.'
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
      note: 'Some two thousand islands — the Marianas except Guam, the Carolines and the Marshalls — with about 2,100 km² of land scattered across three million square miles of ocean, which is why the mandate is drawn here as a line and not as a shape. Japan took them from Germany in October 1914, held them under naval administration, and was granted them as a Class C mandate by the League in December 1920; Class C meant a territory could be governed as an integral part of the mandatory’s own. A civil South Seas Bureau ran them from Koror in Palau from 1922. Japanese settlers came with the sugar industry on Saipan and Tinian and outnumbered the islanders by the mid-1930s. Fortifying the islands was forbidden both by the mandate and by the Washington naval treaty; Japan gave notice of leaving the League in 1933, kept the islands, and fortified them anyway. They would become the American Trust Territory of the Pacific Islands in 1947.'
    },
    {
      id: 'mandate_ex_guam', en: 'Guam — inside the line, outside the mandate',
      when: 'American since 1898; never part of the mandate', cat: 'american', lvl: 3,
      c: '#325d7b', atoms: ['mandate_ex_guam'], unseen: true,
      note: 'The mandate covered the Marianas except Guam, which is why every description of it says so. Spain ceded Guam to the United States in 1898, so when Japan took the German Marianas in 1914 it took the chain round an American island: Saipan, a hundred and thirty miles north, was Japanese, and Guam was a US naval station with a small Marine garrison. Japan would land there on 10 December 1941, two days after Pearl Harbor, rename it Ōmiyajima, and hold it until the Americans retook it in the summer of 1944.'
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
      note: 'Two scatters of atolls governed as one colony from Ocean Island: the Gilberts on the equator, the Ellice Islands six hundred miles south, and Ocean Island — Banaba — off to the west, which was worked for phosphate by the British Phosphate Commissioners and is where the administration actually sat. Japan took the Gilberts in December 1941 and never reached the Ellice.'
    },
    {
      id: 'linephoenix', en: 'The Line & Phoenix Islands',
      when: 'Gilbert & Ellice Islands Colony', rule: 'British colony', cat: 'british', lvl: 3,
      atoms: ['linephoenix'],
      note: 'Two scatters of atolls east of the date line, run from Ocean Island. Fanning carried the trans-Pacific telegraph cable from Vancouver to Australia, landed in 1902 and the reason these specks were worth holding. The Phoenix group was almost empty until the settlement scheme of 1938–40 moved Gilbertese families there against overcrowding at home. Canton Island and Enderbury were claimed by Britain and by the United States at once, and in 1939 the two agreed to administer them jointly for fifty years; Pan American Airways put a flying-boat base on Canton Island that year, on the route to New Zealand.'
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
      note: 'Taken from Spain in 1898 and held after a brutal war against Filipino republicans. A commonwealth with a promise of independence would follow in 1935.'
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
      note: 'A US territory with a large Japanese immigrant population. Pearl Harbor had a navy yard and a drydock from 1919, but the Pacific Fleet was based on the California coast until it was ordered to stay at Hawaii in May 1940.'
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
      when: 'Occupied by France, April 1930; annexed 1933',
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
      note: 'Coal, timber and fisheries, and — apart from Korea\'s short frontier on the lower Tumen — the empire\'s land border with the Soviet Union. Lost in August 1945.'
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
      note: 'The Inner Mongolian autonomous government under Prince Demchugdongrub, with its capital at Zhangjiakou, assembled out of eastern Chahar, the Mongol leagues and a strip of northern Shanxi. Japanese-sponsored Mongol governments date from 1936, and the regime changed its name more than once: the federation of September 1939 joined the Mongol leagues to two Chinese-populated administrations — Chanan out of southern Chahar and Jinbei out of northern Shanxi — as the Mengchiang United Autonomous Government, and in August 1941 that was renamed the Mongol Autonomous Federation, 蒙古自治邦, which is what it was called in December 1942. Switch Administrative on and the three parts are named. The line indicates claimed Mengjiang territory and the fill indicates approximate simplified area of control.'
    },
    {
      id: 'nanjinggov', en: 'Japanese-occupied China (approximate)', ja: '日本占領地区',
      orig: '日軍佔領區', zh: '日軍佔領區（大略）',
      when: 'Occupied from 1937; Nanking government from March 1940', cat: 'occupied', lvl: 1,
      flip: true, atoms: ['occupiedzone'], srcOnly: 'traced',
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
      note: 'Eight atolls and reef islands are drawn here — Niulakita, the ninth and empty then, is not — the southern half of the Gilbert & Ellice Islands Colony, and the nearest unoccupied ground to the Gilberts. American marines landed on Funafuti on 2 October 1942 and built an airfield there, with two more on Nanumea and Nukufetau the following year; Funafuti was the base the assault on Tarawa and Makin was mounted from in November 1943. Japanese aircraft bombed it from the Gilberts in the meantime. The islanders were moved off the airfield sites and the atolls were left with the runways, the scrap and the borrow pits when the war moved north.'
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
      note: 'In December 1942 the island was divided: the Americans held the airfield and the perimeter around it, the Japanese the ground to the west, and neither could dislodge the other. It is drawn in the occupation colour with American stripes across it for that reason — the only ground on the map the two were contesting at this date. Japan evacuated in the first week of February 1943, and the campaign is usually taken as the point at which the initiative changed hands.'
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
      note: 'Invaded on 8 December 1941, it capitulated in hours, granted passage to the invasion of Malaya and Burma, allied with Japan and declared war on Britain and the United States. Cambodia and Laos had already given up territory to it under the Franco-Thai settlement of May 1941; Malaya and Burma were the reward for the alliance.'
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
      note: 'British India was a patchwork: eleven provinces ruled directly, and beside them some six hundred princely states whose rulers kept their thrones under treaties with the Crown. Hyderabad, the largest by population and revenue, had its own army and currency, and the Nizam was reckoned the richest man alive. The states are drawn here from a layer of their 1931 boundaries rather than approximated from modern units, so the shapes are the shapes: the Rajputana and Central India agencies as one western mass, the Baluchistan states of Kalat and Las Bela, the Eastern States through Orissa and Chhattisgarh, the hill states along the frontier, and the small Deccan states scattered through Bombay. The very smallest of the six hundred are below the resolution of this map and are drawn inside whichever province surrounded them.'
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
      note: 'A French leased territory on the Leizhou peninsula, run from Indochina and drawn like it. In December 1942 Vichy French administration continued inside a Japanese-occupied region, and it was the last neutral door into south China — a smuggling route and an escape route. Japanese troops moved in in February 1943.'
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
      cat: 'pacified', lvl: 3, flip: true, atoms: ['nca_pacified'], srcOnly: 'nca',
      note: 'Ground the North China Area Army classed as pacified — 治安地区 — in its own survey of September 1942. Not the same claim as the shading it replaces: that is where Japanese authority reached at all, this is where the army itself thought it had the country in hand. It comes to about 275,000 square kilometres, roughly a quarter of the area the occupation is otherwise drawn over, and it sits along the railways and around the cities much as the note on the occupation says. The sheet’s third category, semi-pacified — 準治安地区 — is what it leaves blank, and it is left blank here too, so unshaded ground inside north China is not a claim that nobody was there.'
    },
    {
      id: 'nca_unpacified', en: 'Un-pacified areas (未治安地区)', ja: '未治安地区', zh: '未治安地區',
      when: 'September 1942', rule: 'The North China Area Army\'s own classification',
      cat: 'unpacified', lvl: 3, flip: true, atoms: ['nca_unpacified'], srcOnly: 'nca',
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
    date: 'Capital from 1868', cat: 'city', lvl: 1, lat: 35.68, lon: 139.76,
    wiki: 'https://en.wikipedia.org/wiki/Tokyo', year: 1868,
    note: 'Edo until the Restoration. The Great Kantō earthquake struck in 1923 and was followed by the massacre of Koreans; young officers of the Imperial Way faction seized the government quarter in the 2.26 Incident of February 1936 and killed three senior figures, the finance minister among them; the firebombing of 9–10 March 1945 killed some 100,000 people in a night.'
  },
  {
    id: 'yokohama', en: 'Yokohama', ja: '横浜 (Yokohama)', orig: '横浜 (Yokohama)', zh: '橫濱',
    date: 'Treaty port opened 1859', cat: 'city', lvl: 2, lat: 35.44, lon: 139.64,
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
    id: 'kyoto', en: 'Kyoto', ja: '京都 (Kyōto)', orig: '京都 (Kyōto)', zh: '京都',
    date: 'Imperial seat until 1868', cat: 'city', lvl: 2, lat: 35.01, lon: 135.77,
    wiki: 'https://en.wikipedia.org/wiki/Kyoto', year: 1868,
    note: 'The emperor’s city for over a thousand years, until the court moved to Tokyo. The Takikawa Incident at its Imperial University in 1933 marked the closing of academic freedom.'
  },
  {
    id: 'osaka', en: 'Osaka', ja: '大阪 (Ōsaka)', orig: '大阪 (Ōsaka)', zh: '大阪',
    date: 'Opened 1868', cat: 'city', lvl: 2, lat: 34.69, lon: 135.5,
    wiki: 'https://en.wikipedia.org/wiki/Osaka', year: 1868,
    note: 'The commercial capital of Tokugawa Japan and later a centre of heavy industry and of labour organising. The rice riots of 1918, which began among fishermen\'s wives in Toyama, were at their worst here.'
  },
  {
    id: 'kobe', en: 'Kobe', ja: '神戸 (Kōbe)', orig: '神戸 (Kōbe)', zh: '神戶',
    date: 'Treaty port opened 1868', cat: 'city', lvl: 3, lat: 34.69, lon: 135.2,
    wiki: 'https://en.wikipedia.org/wiki/Kobe', year: 1868,
    note: 'Shipbuilding and the main emigration port for Japanese leaving for Hawaii and the Americas.'
  },
  {
    id: 'nagoya', en: 'Nagoya', ja: '名古屋 (Nagoya)', orig: '名古屋 (Nagoya)', zh: '名古屋',
    date: 'Bombed 1944–1945', cat: 'city', lvl: 3, lat: 35.18, lon: 136.91,
    wiki: 'https://en.wikipedia.org/wiki/Nagoya', year: 1889,
    note: 'The centre of the aircraft industry, and for that reason among the most heavily bombed cities of the war.'
  },
  {
    id: 'hiroshima', en: 'Hiroshima', ja: '広島 (Hiroshima)', orig: '広島 (Hiroshima)', zh: '廣島',
    date: 'Atomic bomb, 6 August 1945', cat: 'city', lvl: 1, both: true, lat: 34.39,
    lon: 132.46, wiki: 'https://en.wikipedia.org/wiki/Hiroshima', year: 1894,
    note: 'Army headquarters and the embarkation port for the continent since 1894. Destroyed by the first atomic bomb; around 140,000 were dead by the end of the year.'
  },
  {
    id: 'nagasaki', en: 'Nagasaki', ja: '長崎 (Nagasaki)', orig: '長崎 (Nagasaki)', zh: '長崎',
    date: 'Atomic bomb, 9 August 1945', cat: 'city', lvl: 1, both: true, lat: 32.74,
    lon: 129.87, wiki: 'https://en.wikipedia.org/wiki/Nagasaki', year: 1641,
    note: 'The Dutch post at Dejima made this Japan’s only window on Europe under the Tokugawa. Destroyed by the second atomic bomb; around 70,000 were dead by the end of the year.'
  },
  {
    id: 'shimonoseki', en: 'Shimonoseki', ja: '下関 (Shimonoseki)', orig: '下関 (Shimonoseki)',
    zh: '下關', date: 'Bombarded 1864; treaty signed April 1895', cat: 'city', lvl: 2, lat: 33.96,
    lon: 130.94, wiki: 'https://en.wikipedia.org/wiki/Shimonoseki', year: 1864,
    note: 'Chōshū’s straits, shelled by a four-power squadron in 1864. The Treaty of Shimonoseki ended the First Sino-Japanese War and handed Taiwan to Japan.'
  },
  {
    id: 'kagoshima', en: 'Kagoshima', ja: '鹿児島 (Kagoshima)', orig: '鹿児島 (Kagoshima)', zh: '鹿兒島',
    date: 'Bombarded 1863; rebellion 1877', cat: 'city', lvl: 2, lat: 31.6, lon: 130.56,
    wiki: 'https://en.wikipedia.org/wiki/Kagoshima', year: 1863,
    note: 'Castle town of Satsuma, shelled by the Royal Navy in 1863 over the Richardson Affair, and the base of Saigō Takamori’s rebellion in 1877.'
  },
  {
    id: 'hakodate', en: 'Hakodate', ja: '函館 (Hakodate)', orig: '函館 (Hakodate)', zh: '函館',
    date: 'Opened 1854; Republic of Ezo 1869', cat: 'city', lvl: 3, lat: 41.77, lon: 140.73,
    wiki: 'https://en.wikipedia.org/wiki/Hakodate', year: 1854,
    note: 'One of the first two ports opened to the Americans, and the site of the last Tokugawa resistance in the Boshin War.'
  },
  {
    id: 'sapporo', en: 'Sapporo', ja: '札幌 (Sapporo)', orig: '札幌 (Sapporo)', zh: '札幌',
    date: 'Founded 1869', cat: 'city', lvl: 3, lat: 43.06, lon: 141.35,
    wiki: 'https://en.wikipedia.org/wiki/Sapporo', year: 1869,
    note: 'Laid out on a grid as the headquarters of the Hokkaidō Colonisation Commission, the agency that settled the island and dispossessed the Ainu.'
  },
  {
    id: 'tsushima', en: 'Tsushima Strait', ja: '対馬海峡 (Tsushima Kaikyō)', zh: '對馬海峽',
    ko: '대한해협 (Taehan Haehyŏp)', date: '27–28 May 1905', cat: 'battle', lvl: 3, both: true,
    lat: 34.4, lon: 129.33, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Tsushima',
    year: 1905,
    note: 'Tōgō destroyed the Russian Baltic Fleet here after its eighteen-thousand-mile voyage — the decisive battle of the Russo-Japanese War and the first modern defeat of a European power by an Asian one.'
  },
  {
    id: 'naha', en: 'Naha', ja: '那覇 (Naha)', orig: '那覇 (Naafa)', zh: '那霸',
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
    id: 'seoul', en: 'Keijō (Seoul)', ja: '京城 (Keijō)', zh: '京城（漢城）',
    ko: '서울 / 한성 (Sŏul / Hansŏng)', date: 'Renamed Keijō in 1910', cat: 'city', lvl: 1,
    lat: 37.57, lon: 126.98, wiki: 'https://en.wikipedia.org/wiki/Keij%C5%8D', year: 1876,
    note: 'Capital of Chosŏn Korea as Hansŏng, and of the colony as Keijō. The Kapsin Coup of 1884 and the March First Movement of 1919 both began here; Queen Min was murdered in the palace in 1895.'
  },
  {
    id: 'pusan', en: 'Fusan (Pusan)', ja: '釜山 (Fusan)', zh: '釜山', ko: '부산 (Pusan)',
    date: 'Opened by treaty 1876', cat: 'city', lvl: 2, lat: 35.18, lon: 129.08,
    wiki: 'https://en.wikipedia.org/wiki/Busan', year: 1876,
    note: 'The port closest to Japan, long the site of a Japanese trading enclave, and the southern end of the ferry and rail link that tied Korea into the Japanese economy.'
  },
  {
    id: 'incheon', en: 'Jinsen (Chemulpo, Inchon)', ja: '仁川 (Jinsen)', zh: '仁川',
    ko: '인천 / 제물포 (Inch’ŏn / Chemulp’o)', date: 'Naval action 9 February 1904', cat: 'city',
    lvl: 3, lat: 37.46, lon: 126.71, wiki: 'https://en.wikipedia.org/wiki/Incheon', year: 1883,
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
    id: 'pyongyang', en: 'Heijō (Pyongyang)', ja: '平壌 (Heijō)', zh: '平壤', ko: '평양 (P’yŏngyang)',
    date: 'Battle, 15 September 1894', cat: 'city', lvl: 3, lat: 39.02, lon: 125.75,
    wiki: 'https://en.wikipedia.org/wiki/Korean_Art_Gallery', year: 1894,
    note: 'Site of a decisive Japanese victory over Qing forces in the First Sino-Japanese War, and later a centre of colonial industry and of Korean Christianity.'
  },
  {
    id: 'mukden', en: 'Shěnyáng (Mukden)', ja: '奉天 (Hōten)', orig: '瀋陽 (Shěnyáng)',
    zh: '瀋陽（奉天）', date: 'Battle 1905; Manchurian Incident 18 September 1931', cat: 'city',
    lvl: 1, both: true, lat: 41.8, lon: 123.43, wiki: 'https://en.wikipedia.org/wiki/Shenyang',
    year: 1905,
    note: 'The Manchu dynastic capital, and the prize of the largest land battle of the Russo-Japanese War. The explosion staged on the South Manchuria Railway just outside the city on 18 September 1931 was the pretext for the invasion of Manchuria.'
  },
  {
    id: 'changchun', en: 'Chángchūn (Hsinking)', ja: '新京 (Shinkyō)', orig: '長春 (Chángchūn)',
    zh: '長春（新京）', date: 'Capital of Manchukuo from 1932', cat: 'city', lvl: 2, lat: 43.88,
    lon: 125.32, wiki: 'https://en.wikipedia.org/wiki/Changchun', year: 1907,
    note: 'Renamed Hsinking, "new capital", and rebuilt on a planned grid with boulevards and ministries as the showpiece of the puppet state.'
  },
  {
    id: 'harbin', en: 'Hā’ěrbīn (Harbin)', ja: 'ハルビン (Harubin)', orig: '哈爾濱 (Hā’ěrbīn)',
    zh: '哈爾濱', date: 'Itō assassinated 26 October 1909', cat: 'city', lvl: 2, lat: 45.8,
    lon: 126.53, wiki: 'https://en.wikipedia.org/wiki/Harbin', year: 1909,
    note: 'A Russian-built railway city with a large émigré population. Itō Hirobumi was shot at its station by the Korean independence activist An Chunggŭn. Unit 731 ran human vivisection at Pingfang on the outskirts from 1936, and field-tested plague and cholera on Chinese towns.'
  },
  {
    id: 'portarthur', en: 'Lǚshùn (Port Arthur, Ryojun)', ja: '旅順 (Ryojun)',
    orig: '旅順 (Lǚshùn)', zh: '旅順', date: 'Siege, August 1904 – January 1905', cat: 'city',
    lvl: 1, lat: 38.82, lon: 121.22, wiki: 'https://en.wikipedia.org/wiki/L%C3%BCshunkou',
    year: 1894,
    note: 'Taken from China in 1894, given up under the Triple Intervention of 1895, leased by Russia in 1898, and won back at enormous cost in the siege of 1904–05. The pivot of Japanese continental policy for fifty years.'
  },
  {
    id: 'dairen', en: 'Dàlián (Dairen, Dalny)', ja: '大連 (Dairen)', orig: '大連 (Dàlián)',
    zh: '大連', date: 'Japanese from 1905', cat: 'city', lvl: 2, lat: 38.91, lon: 121.61,
    wiki: 'https://en.wikipedia.org/wiki/Dalian', year: 1905,
    note: 'The commercial capital of the Kwantung Leased Territory and headquarters of the South Manchuria Railway Company, the vehicle of Japanese economic power in the region.'
  },
  {
    id: 'chengde', en: 'Chéngdé (Chengteh)', ja: '承徳 (Shōtoku)', orig: '承德 (Chéngdé)', zh: '承德',
    date: 'Occupied 4 March 1933', cat: 'city', lvl: 3, lat: 40.98, lon: 117.94,
    wiki: 'https://en.wikipedia.org/wiki/Chengde', year: 1933,
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
    id: 'beijing', en: 'Běijīng (Peking / Peiping)', ja: '北京 (Pekin)',
    orig: '北京 / 北平 (Běijīng / Běipíng)', zh: '北京（北平）',
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
    date: 'Convention 1885; occupied 1937', cat: 'city', lvl: 2, lat: 39.13, lon: 117.2,
    wiki: 'https://en.wikipedia.org/wiki/Tianjin', year: 1885,
    note: 'The treaty port for Beijing, carved into nine foreign concessions at their greatest extent, a Japanese one among them. The Tianjin Convention of 1885 regulated Chinese and Japanese troops in Korea, and broke down in 1894; the Tanggu Truce of May 1933, signed at its port, gave north China a demilitarised zone that Japan spent the next four years pushing into.'
  },
  {
    id: 'kalgan', en: 'Zhāngjiākǒu (Kalgan, Changchiakou)', ja: '張家口 (Chōkakō)',
    orig: '張家口 (Zhāngjiākǒu)', zh: '張家口', date: 'Capital of Mengchiang from 1939', cat: 'city',
    lvl: 3, lat: 40.81, lon: 114.88, wiki: 'https://en.wikipedia.org/wiki/Zhangjiakou',
    year: 1937,
    note: 'The old caravan gate through the Great Wall to Mongolia, and the seat of the Japanese-sponsored Inner Mongolian regime.'
  },
  {
    id: 'jinan', en: 'Jǐnán (Tsinan)', ja: '済南 (Sainan)', orig: '濟南 (Jǐnán)', zh: '濟南',
    date: 'May 1928', cat: 'city', lvl: 3, lat: 36.67, lon: 116.99,
    wiki: 'https://en.wikipedia.org/wiki/Jinan', year: 1928,
    note: 'Japanese troops sent to "protect residents" clashed with the Nationalist Northern Expedition; thousands of Chinese were killed, and a Chinese diplomat mutilated and executed.'
  },
  {
    id: 'qingdao', en: 'Qīngdǎo (Tsingtao)', ja: '青島 (Seitō)', orig: '青島 (Qīngdǎo)', zh: '青島',
    date: 'Seized from Germany, November 1914', cat: 'city', lvl: 2, lat: 36.07, lon: 120.38,
    wiki: 'https://en.wikipedia.org/wiki/Qingdao', year: 1914,
    note: 'The German leasehold in Shandong, taken by Japan in 1914. Keeping it was the first of the Twenty-One Demands and was confirmed at Versailles, which set off the May Fourth Movement. Returned in 1922.'
  },
  {
    id: 'weihai', en: 'Wēihǎi (Weihaiwei)', ja: '威海衛 (Ikaiei)', orig: '威海衛 (Wēihǎiwèi)',
    zh: '威海衛', date: 'Battle, January–February 1895', cat: 'city', lvl: 3, lat: 37.51,
    lon: 122.12, wiki: 'https://en.wikipedia.org/wiki/Weihai', year: 1895,
    note: 'The Peiyang Fleet’s base, destroyed by Japan in the closing weeks of the First Sino-Japanese War; afterwards a British leased territory until 1930.'
  },
  {
    id: 'nanjing', en: 'Nánjīng (Nanking)', ja: '南京 (Nankin)', orig: '南京 (Nánjīng)', zh: '南京',
    date: 'Fell 13 December 1937', cat: 'city', lvl: 1, both: true, lat: 32.06, lon: 118.8,
    wiki: 'https://en.wikipedia.org/wiki/Nanjing', year: 1927,
    note: 'Nationalist capital from 1927. Its capture on 13 December 1937 was followed by weeks of mass killing and rape — the Nanjing Massacre — in which the dead are counted from the tens of thousands to 300,000, depending on the period and the boundary taken. From 1940 it housed Wang Jingwei\'s collaborationist government.'
  },
  {
    id: 'shanghai', en: 'Shànghǎi (Shanghai)', ja: '上海 (Shanhai)', orig: '上海 (Shànghǎi)',
    zh: '上海', date: 'Fighting 1932; battle August–November 1937', cat: 'city', lvl: 1,
    lat: 31.23, lon: 121.47, wiki: 'https://en.wikipedia.org/wiki/Shanghai', year: 1863,
    note: 'The largest treaty port in China, with an International Settlement and a French Concession. Fighting in January 1932 and again in 1937, when three months of street and river fighting cost both armies enormously and destroyed China’s best divisions.'
  },
  {
    id: 'wuhan', en: 'Wǔhàn (Hankow)', ja: '漢口 (Hankō)', orig: '武漢 / 漢口 (Wǔhàn / Hànkǒu)',
    zh: '武漢（漢口）', date: 'Fell 25 October 1938', cat: 'city', lvl: 2, lat: 30.58, lon: 114.28,
    wiki: 'https://en.wikipedia.org/wiki/Wuhan', year: 1861,
    note: 'The Nationalist government’s refuge after Nanjing. Its fall ended the first mobile phase of the war; from then on the fighting in China settled into stalemate.'
  },
  {
    id: 'chongqing', en: 'Chóngqìng (Chungking)', ja: '重慶 (Jūkei)', orig: '重慶 (Chóngqìng)',
    zh: '重慶', date: 'Wartime capital 1938–1945', cat: 'city', lvl: 2, lat: 29.56, lon: 106.55,
    wiki: 'https://en.wikipedia.org/wiki/Chongqing', year: 1891,
    note: 'Chosen for the gorges and the fog that shielded it. Bombed for five years in one of the first sustained campaigns against a civilian population.'
  },
  {
    id: 'yanan', en: 'Yán’ān (Yenan)', ja: '延安 (En’an)', orig: '延安 (Yán’ān)', zh: '延安',
    date: 'Communist base 1936–1947', cat: 'city', lvl: 3, lat: 36.6, lon: 109.49,
    wiki: 'https://en.wikipedia.org/wiki/Yan\'an', year: 1936,
    note: 'The Long March ended in northern Shaanxi in 1935 and the party moved here at the end of 1936. From it Mao consolidated his leadership and the party grew from tens of thousands to over a million. The American observers of the Dixie Mission arrived in July 1944, the first official contact between Washington and the Communists.'
  },
  {
    id: 'xian', en: 'Xī’ān (Sian)', ja: '西安 (Seian)', orig: '西安 (Xī’ān)', zh: '西安',
    date: 'December 1936', cat: 'city', lvl: 3, lat: 34.34, lon: 108.94,
    wiki: 'https://en.wikipedia.org/wiki/Xi\'an', year: 1936,
    note: 'Chiang Kai-shek was kidnapped here by his own generals and released only after agreeing to a united front with the Communists against Japan.'
  },
  {
    id: 'guangzhou', en: 'Guǎngzhōu (Canton)', ja: '広州 (Kōshū)', orig: '廣州 (Guǎngzhōu)',
    zh: '廣州', date: 'Fell 21 October 1938', cat: 'city', lvl: 2, lat: 23.13, lon: 113.26,
    wiki: 'https://en.wikipedia.org/wiki/Guangzhou', year: 1842,
    note: 'The original treaty port and the cradle of the Nationalist revolution, taken in 1938 to cut the supply line from Hong Kong.'
  },
  {
    id: 'xiamen', en: 'Xiàmén (Amoy)', ja: '厦門 (Amoi)', orig: '廈門 (Xiàmén)', zh: '廈門',
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
    id: 'taipei', en: 'Taihoku (Taipei)', ja: '臺北 (Taihoku)', orig: '臺北 (Tâi-pak)', zh: '臺北',
    date: 'Colonial capital from 1895', cat: 'city', lvl: 2, lat: 25.03, lon: 121.57,
    wiki: 'https://en.wikipedia.org/wiki/Taihoku_Prefecture', year: 1895,
    note: 'Seat of the Governor-General of Taiwan, and the administrative model that later colonies were built on.'
  },
  {
    id: 'kaohsiung', en: 'Takao (Kaohsiung)', ja: '高雄 (Takao)', orig: '高雄 (Ko-hiông)', zh: '高雄',
    date: 'Developed from 1908', cat: 'city', lvl: 3, lat: 22.63, lon: 120.3,
    wiki: 'https://en.wikipedia.org/wiki/Xin-Fu-Hwa', year: 1908,
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
    date: '4–8 May 1942', cat: 'battle', lvl: 3, both: true, lat: -13.5, lon: 154,
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
    id: 'yenbai', en: 'Yen Bai (Yên Bái)', ja: 'イエンバイ (Ienbai)', orig: 'Yên Bái', zh: '安沛',
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
    id: 'okunoshima', en: 'Ōkunoshima', ja: '大久野島 (Ōkunoshima)', zh: '大久野島',
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
    id: 'ashio', en: 'Ashio', ja: '足尾 (Ashio)', zh: '足尾',
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
    date: '18 September 1931', cat: 'battle', lvl: 1, both: true, lat: 41.85, lon: 123.47,
    wiki: 'https://en.wikipedia.org/wiki/Mukden_incident', year: 1931,
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
    id: 'paoting', en: 'Bǎodìng (Paoting)', ja: '保定 (Hotei)', zh: '保定', lat: 38.87, lon: 115.47,
    wiki: 'https://en.wikipedia.org/wiki/Baoding',
    note: 'On the Beijing–Hankou railway, and the seat of the military academy that trained a generation of Republican officers. Fell on 24 September 1937; Shijiazhuang, the junction south of it, went in October.'
  },
  {
    id: 'taiyuan', en: 'Tàiyuán (Taiyuan)', ja: '太原 (Taigen)', zh: '太原', lat: 37.87,
    lon: 112.55, wiki: 'https://en.wikipedia.org/wiki/Taiyuan',
    note: 'Yan Xishan\'s capital for thirty years, with the arsenal and steelworks he built to keep Shanxi independent of everyone. Lin Biao\'s ambush at Pingxingguan in September 1937 and the battle of Xinkou in October delayed its fall until 9 November.'
  },
  {
    id: 'kaifeng', en: 'Kāifēng (Kaifeng)', ja: '開封 (Kaihō)', zh: '開封', lat: 34.8, lon: 114.31,
    wiki: 'https://en.wikipedia.org/wiki/Kaifeng',
    note: 'The Northern Song capital, and a station on the Lunghai railway. Fell on 6 June 1938; the dikes at Huayuankou were cut three days later to stop the advance beyond it.'
  },
  {
    id: 'hefei', en: 'Héféi (Hofei)', ja: '合肥 (Gōhi)', zh: '合肥', lat: 31.86, lon: 117.28,
    wiki: 'https://en.wikipedia.org/wiki/Hefei',
    note: 'The seat of Anhui, on the road between the Yangtze and the Huai. Occupied in 1938, though the front bent round the Chinese pocket in the north-west of the province beyond it.'
  },
  {
    id: 'anqing', en: 'Ānqìng (Anking)', ja: '安慶 (Ankei)', zh: '安慶', lat: 30.51, lon: 117.05,
    wiki: 'https://en.wikipedia.org/wiki/Anqing',
    note: 'The old provincial capital of Anhui, and a river port on the Yangtze. Fell on 12 June 1938, opening the campaign up the river to Hankou. The New Fourth Army Incident of January 1941 was fought in the mountains south of it.'
  },
  {
    id: 'hangzhou', en: 'Hángzhōu (Hangchow)', ja: '杭州 (Kōshū)', zh: '杭州', lat: 30.27,
    lon: 120.16, wiki: 'https://en.wikipedia.org/wiki/Hangzhou',
    note: 'Silk, and the southern end of the Grand Canal. Fell on 24 December 1937.'
  },
  {
    id: 'nanchang', en: 'Nánchāng (Nanchang)', ja: '南昌 (Nanshō)', zh: '南昌', lat: 28.68,
    lon: 115.89, wiki: 'https://en.wikipedia.org/wiki/Nanchang',
    note: 'Where the Communist rising of 1 August 1927 gave the Red Army its founding date, and where Chiang launched the New Life Movement seven years later. Fell on 27 March 1939.'
  },
  {
    id: 'fuzhou', en: 'Fúzhōu (Foochow)', ja: '福州 (Fukushū)', zh: '福州', lat: 26.07, lon: 119.3,
    wiki: 'https://en.wikipedia.org/wiki/Fuzhou',
    note: 'A treaty port from 1842 and the great tea shipping port of the nineteenth century. Taken in April 1941, retaken by Chinese forces that September, and taken again in October 1944.'
  },
  {
    id: 'changsha', en: 'Chángshā (Changsha)', ja: '長沙 (Chōsa)', zh: '長沙', lat: 28.23,
    lon: 112.94, wiki: 'https://en.wikipedia.org/wiki/Changsha',
    note: 'The rice bowl of Hunan and a junction on the Guangzhou–Hankou line. Its own garrison burned it down by mistake in November 1938; it then beat off three Japanese offensives and fell at last on 18 June 1944.'
  },
  {
    id: 'guilin', en: 'Guìlín (Kweilin)', ja: '桂林 (Keirin)', zh: '桂林', lat: 25.27, lon: 110.29,
    wiki: 'https://en.wikipedia.org/wiki/Guilin',
    note: 'A Nationalist air base among the limestone hills, and the refuge of the universities of the south. Destroyed by its own garrison and abandoned on 10 November 1944.'
  },
  {
    id: 'nanning', en: 'Nánníng (Nanning)', ja: '南寧 (Nannei)', zh: '南寧', lat: 22.82,
    lon: 108.32, wiki: 'https://en.wikipedia.org/wiki/Nanning',
    note: 'The road and rail gate to Indochina, which is why it was taken in November 1939, given up in 1940, and taken again in 1944.'
  },
  {
    id: 'guiyang', en: 'Guìyáng (Kweiyang)', ja: '貴陽 (Kiyō)', zh: '貴陽', lat: 26.65, lon: 106.63,
    wiki: 'https://en.wikipedia.org/wiki/Guiyang',
    note: 'The hinge of the road system of the south-west, where the routes from Chongqing, Kunming and Guangxi met. Never occupied: the Japanese advance of December 1944 reached Dushan, a hundred miles short of it, and turned back — the furthest inland the war ever came.'
  },
  {
    id: 'kunming', en: 'Kūnmíng (Kunming)', ja: '昆明 (Konmei)', zh: '昆明', lat: 25.04,
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
    id: 'yinchuan', en: 'Yínchuān (Ningsia)', ja: '寧夏 (Neika)', zh: '寧夏（銀川）', lat: 38.49,
    lon: 106.23, wiki: 'https://en.wikipedia.org/wiki/Yinchuan',
    note: 'The oasis capital of Ningxia on the upper Yellow River, held for the Republic by Ma Hongkui throughout. Never occupied.'
  },
  {
    id: 'hohhot', en: 'Hūhéhàotè (Kweisui)', ja: '厚和 (Kōwa)', zh: '歸綏（呼和浩特）', lat: 40.84,
    lon: 111.75, wiki: 'https://en.wikipedia.org/wiki/Hohhot',
    note: 'The Inner Mongolian trade and lamasery city on the Beijing–Suiyuan railway. Taken on 14 October 1937 and renamed Kōwa; Demchugdongrub\'s Mongol government sat here before the seat moved to Zhangjiakou.'
  },
  {
    id: 'baotou', en: 'Bāotóu (Paotow)', ja: '包頭 (Hōtō)', zh: '包頭', lat: 40.66, lon: 109.84,
    wiki: 'https://en.wikipedia.org/wiki/Baotou',
    note: 'The railhead of the Beijing–Suiyuan line and the wool market of the steppe. Taken in October 1937, and the western limit of Japanese control; the country beyond stayed with Fu Zuoyi.'
  },
  {
    id: 'qiqihar', en: 'Qíqíhā’ěr (Tsitsihar)', ja: 'チチハル (Chichiharu)', zh: '齊齊哈爾', lat: 47.35,
    lon: 123.92, wiki: 'https://en.wikipedia.org/wiki/Qiqihar',
    note: 'The seat of Heilongjiang and the junction of the Chinese Eastern Railway with the line north. Taken on 19 November 1931 after the fighting at the Nen bridges.'
  },
  {
    id: 'jilincity', en: 'Jílín (Kirin)', ja: '吉林 (Kirin)', zh: '吉林', lat: 43.84, lon: 126.55,
    wiki: 'https://en.wikipedia.org/wiki/Jilin',
    note: 'A timber and river city on the Songhua, taken in September 1931 when its provincial governor went over to the Japanese.'
  },
  {
    id: 'mudanjiang', en: 'Mǔdānjiāng (Mutankiang)', ja: '牡丹江 (Botankō)', zh: '牡丹江', lat: 44.58,
    lon: 129.6, wiki: 'https://en.wikipedia.org/wiki/Mudanjiang',
    note: 'A garrison town and railway junction on the eastern line to Vladivostok, and the first objective of the Soviet armies in August 1945.'
  },
  {
    id: 'fushun', en: 'Fǔshùn (Fushun)', ja: '撫順 (Bujun)', zh: '撫順', lat: 41.88, lon: 123.94,
    wiki: 'https://en.wikipedia.org/wiki/Fushun',
    note: 'The open-cast coal mine that fuelled the South Manchuria Railway and much of Japanese industry. Chinese labourers died here in tens of thousands.'
  },
  {
    id: 'anshan', en: 'Ānshān (Anshan)', ja: '鞍山 (Anzan)', zh: '鞍山', lat: 41.11, lon: 122.99,
    wiki: 'https://en.wikipedia.org/wiki/Anshan',
    note: 'The Shōwa Steel Works, the largest ironworks in the empire outside Japan, and the target of the first B-29 raid on Manchuria in July 1944.'
  },
  {
    id: 'jinzhou', en: 'Jǐnzhōu (Chinchow)', ja: '錦州 (Kinshū)', zh: '錦州', lat: 41.1,
    lon: 121.13, wiki: 'https://en.wikipedia.org/wiki/Battle_of_Jinzhou',
    note: 'The gate between Manchuria and the Wall, on the railway from Shenyang to Beijing. Taken on 3 January 1932, which put Japanese troops on the Wall; Harbin held out until February.'
  },
  {
    id: 'yingkou', en: 'Yíngkǒu (Newchwang)', ja: '営口 (Eikō)', zh: '營口', lat: 40.67,
    lon: 122.24, wiki: 'https://en.wikipedia.org/wiki/Yingkou',
    note: 'The old treaty port of Yingkou at the mouth of the Liao, once the outlet for Manchurian soya beans and long overtaken by Dalian.'
  },
  {
    id: 'dandong', en: 'Dāndōng (Antung)', ja: '安東 (Antō)', zh: '安東', lat: 40.13, lon: 124.39,
    wiki: 'https://en.wikipedia.org/wiki/Dandong',
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
    id: 'zhenjiang', en: 'Zhènjiāng (Chinkiang)', ja: '鎮江 (Chinkō)', zh: '鎮江', lat: 32.19,
    lon: 119.43, wiki: 'https://en.wikipedia.org/wiki/Zhenjiang',
    note: 'Where the Grand Canal meets the Yangtze, and the provincial capital of Jiangsu until 1937. Fell in December 1937.'
  },
  {
    id: 'shantou', en: 'Shàntóu (Swatow)', ja: '汕頭 (Santō)', zh: '汕頭', lat: 23.35, lon: 116.68,
    wiki: 'https://en.wikipedia.org/wiki/Shantou',
    note: 'A treaty port from 1860, the departure point for much of the Chinese emigration to Southeast Asia, and the outlet for Guangdong\'s sugar. Occupied on 21 June 1939.'
  },
  {
    id: 'ningbo', en: 'Níngbō (Ningpo)', ja: '寧波 (Neiha)', zh: '寧波', lat: 29.87, lon: 121.55,
    wiki: 'https://en.wikipedia.org/wiki/Ningbo',
    note: 'A treaty port from 1842 and a merchant city whose bankers ran much of Shanghai. Occupied in April 1941; Unit 731 dropped plague-infected fleas on it in 1940.'
  },
  {
    id: 'wenzhou', en: 'Wēnzhōu (Wenchow)', ja: '温州 (Onshū)', zh: '溫州', lat: 28, lon: 120.7,
    wiki: 'https://en.wikipedia.org/wiki/Wenzhou',
    note: 'A minor treaty port behind a mountain wall, taken and given up three times between 1941 and 1945. It lies outside the line of control drawn here for December 1942.'
  },
  {
    id: 'yantai', en: 'Yāntái (Chefoo)', ja: '芝罘 (Shifu)', zh: '芝罘（煙臺）', lat: 37.46,
    lon: 121.45, wiki: 'https://en.wikipedia.org/wiki/Yantai',
    note: 'The treaty port of Yantai, known for lace, silk and the missionary school. Occupied in February 1938.'
  },
  {
    id: 'taegu', en: 'Taikyū (Taegu)', ja: '大邱 (Taikyū)', zh: '大邱', lat: 35.87, lon: 128.6,
    wiki: 'https://en.wikipedia.org/wiki/Daegu',
    note: 'The provincial seat of North Kyŏngsang, and the apple and textile town of the south-east. The March First Movement reached it on 8 March 1919 and was put down by troops.'
  },
  {
    id: 'kwangju', en: 'Kōshū (Kwangju)', ja: '光州 (Kōshū)', zh: '光州', lat: 35.16, lon: 126.85,
    wiki: 'https://en.wikipedia.org/wiki/Gwangju%E2%80%93Daegu_Expressway',
    note: 'Where the student movement of November 1929 began, after Japanese schoolboys harassed Korean girls on the Naju train; it spread to some two hundred schools across the colony.'
  },
  {
    id: 'taejon', en: 'Taiden (Taejon)', ja: '大田 (Taiden)', zh: '大田', lat: 36.35, lon: 127.38,
    wiki: 'https://en.wikipedia.org/wiki/Daejeon',
    note: 'The junction where the Seoul–Pusan trunk line meets the Honam line down to the rice country of the south-west.'
  },
  {
    id: 'wonsan', en: 'Genzan (Wonsan)', ja: '元山 (Genzan)', zh: '元山', lat: 39.15, lon: 127.44,
    wiki: 'https://en.wikipedia.org/wiki/Wonsan',
    note: 'Opened to Japanese trade in 1880, and by the 1930s the east-coast port for the fisheries and for the oil refinery built beside it.'
  },
  {
    id: 'chongjin', en: 'Seishin (Chongjin)', ja: '清津 (Seishin)', zh: '清津', lat: 41.8,
    lon: 129.78, wiki: 'https://en.wikipedia.org/wiki/Pohang-guyok',
    note: 'Steel and a deep-water harbour built to carry Manchurian ore and soya to Japan. Soviet marines landed here on 13 August 1945.'
  },
  {
    id: 'hamhung', en: 'Kankō (Hamhung)', ja: '咸興 (Kankō)', zh: '咸興', lat: 39.92, lon: 127.54,
    wiki: 'https://en.wikipedia.org/wiki/Hamhung',
    note: 'Beside it at Hŭngnam stood Noguchi\'s Chōsen Chisso works, the largest chemical plant in the empire — fertiliser, and later explosives, on power from the Pujŏn river dams.'
  },
  {
    id: 'sinuiju', en: 'Shingishū (Sinuiju)', ja: '新義州 (Shingishū)', zh: '新義州', lat: 40.1,
    lon: 124.39, wiki: 'https://en.wikipedia.org/wiki/Sinuiju',
    note: 'The Korean end of the Yalu bridge to Dandong, and downstream of the Suiho dam, which was the largest in Asia when it was finished in 1941.'
  },
  {
    id: 'kaesong', en: 'Kaijō (Kaesong)', ja: '開城 (Kaijō)', zh: '開城', lat: 37.97, lon: 126.55,
    wiki: 'https://en.wikipedia.org/wiki/Kaesong',
    note: 'The Koryŏ capital, and the ginseng town. It was in Keiki-dō in the colonial period, which is where this map draws it, not in Hwanghae.'
  },
  {
    id: 'nampo', en: 'Chinnampo (Nampo)', ja: '鎮南浦 (Chinnanpo)', zh: '鎮南浦', lat: 38.74,
    lon: 125.41, wiki: 'https://en.wikipedia.org/wiki/Nampo',
    note: 'Pyongyang\'s port, and the smelter that took Korean and Manchurian ore.'
  },
  {
    id: 'mokpo', en: 'Moppo (Mokpo)', ja: '木浦 (Mokupo)', zh: '木浦', lat: 34.79, lon: 126.39,
    wiki: 'https://en.wikipedia.org/wiki/Mokpo',
    note: 'The cotton and rice port of the south-west, through which the Honam harvest left for Japan.'
  },
  {
    id: 'najin', en: 'Rashin (Najin)', ja: '羅津 (Rashin)', zh: '羅津', lat: 42.24, lon: 130.29,
    wiki: 'https://en.wikipedia.org/wiki/Rajin-guyok',
    note: 'Built from a fishing village in the 1930s as the terminus of the short sea route from Manchuria to Japan, bypassing the long haul round Korea.'
  },
  {
    id: 'tainan', en: 'Tainan', ja: '臺南 (Tainan)', zh: '臺南', lat: 22.99, lon: 120.2,
    wiki: 'https://en.wikipedia.org/wiki/Tainan',
    note: 'The old capital of the island under the Dutch and the Qing, and the seat of the south until Japanese rule moved the centre to Taihoku.'
  },
  {
    id: 'taichung', en: 'Taichū (Taichung)', ja: '臺中 (Taichū)', zh: '臺中', lat: 24.15,
    lon: 120.67, wiki: 'https://en.wikipedia.org/wiki/Taich%C5%AB_Prefecture',
    note: 'The centre of the rice plain, and the prefecture in which the Musha rising broke out in October 1930 — the last armed resistance by Taiwan\'s indigenous peoples, put down with aircraft and poison gas.'
  },
  {
    id: 'keelung', en: 'Kirun (Keelung)', ja: '基隆 (Kīrun)', zh: '基隆', lat: 25.13, lon: 121.74,
    wiki: 'https://en.wikipedia.org/wiki/Keelung',
    note: 'The northern coaling port and the ferry terminus for Japan. American carrier raids struck its harbour in October 1944.'
  },
  {
    id: 'hualien', en: 'Karenkō (Hualien)', ja: '花蓮港 (Karenkō)', zh: '花蓮港', lat: 23.98,
    lon: 121.6, wiki: 'https://en.wikipedia.org/wiki/Karenk%C5%8D_Prefecture',
    note: 'The port of the east coast, cut off from the rest of the island by the central range and settled late.'
  },
  {
    id: 'hsinchu', en: 'Shinchiku (Hsinchu)', ja: '新竹 (Shinchiku)', zh: '新竹', lat: 24.81,
    lon: 120.97, wiki: 'https://en.wikipedia.org/wiki/Shinchiku_Prefecture',
    note: 'Natural gas and an air base. American bombers from China hit its airfields on 25 November 1943, the first raid of the war on Taiwan.'
  },
  {
    id: 'chiayi', en: 'Kagi (Chiayi)', ja: '嘉義 (Kagi)', zh: '嘉義', lat: 23.48, lon: 120.45,
    wiki: 'https://en.wikipedia.org/wiki/Chiayi',
    note: 'The foot of the Alishan forest railway, built by the colonial government to bring the cypress down off the mountain.'
  },
  {
    id: 'makung', en: 'Makō (Makung), Pescadores', ja: '馬公 (Makō)', zh: '馬公（澎湖）', lat: 23.57,
    lon: 119.57, wiki: 'https://en.wikipedia.org/wiki/Longgui_Park',
    note: 'The naval anchorage in the Pescadores, which Japan took in March 1895 — a month before the treaty that gave it Taiwan.'
  },
  {
    id: 'fukuoka', en: 'Fukuoka', ja: '福岡 (Fukuoka)', zh: '福岡', lat: 33.59, lon: 130.4,
    wiki: 'https://en.wikipedia.org/wiki/Fukuoka',
    note: 'The city of the northern Kyūshū coalfield and the port for Korea. Firebombed on 19 June 1945.'
  },
  {
    id: 'sendai', en: 'Sendai', ja: '仙台 (Sendai)', zh: '仙台', lat: 38.27, lon: 140.87,
    wiki: 'https://en.wikipedia.org/wiki/Sendai',
    note: 'The garrison and university city of the north-east. Firebombed on 10 July 1945.'
  },
  {
    id: 'niigata', en: 'Niigata', ja: '新潟 (Niigata)', zh: '新潟', lat: 37.92, lon: 139.04,
    wiki: 'https://en.wikipedia.org/wiki/Ch%C5%AB%C5%8D-ku,_Niigata',
    note: 'The Japan Sea port for Korea and Manchuria. It was kept on the atomic target list and so was left largely unbombed.'
  },
  {
    id: 'kanazawa', en: 'Kanazawa', ja: '金沢 (Kanazawa)', zh: '金澤', lat: 36.56, lon: 136.66,
    wiki: 'https://en.wikipedia.org/wiki/Kanazawa',
    note: 'A castle town of the Maeda, and one of the largest cities in Japan the bombing never reached.'
  },
  {
    id: 'kumamoto', en: 'Kumamoto', ja: '熊本 (Kumamoto)', zh: '熊本', lat: 32.8, lon: 130.71,
    wiki: 'https://en.wikipedia.org/wiki/Kumamoto',
    note: 'The Sixth Division\'s garrison town, and the seat of the Kyūshū command. Firebombed on 1 July 1945.'
  },
  {
    id: 'okayama', en: 'Okayama', ja: '岡山 (Okayama)', zh: '岡山', lat: 34.66, lon: 133.93,
    wiki: 'https://en.wikipedia.org/wiki/Okayama',
    note: 'On the line to Shikoku and Kyūshū. Firebombed on 29 June 1945.'
  },
  {
    id: 'matsuyama', en: 'Matsuyama', ja: '松山 (Matsuyama)', zh: '松山', lat: 33.84, lon: 132.77,
    wiki: 'https://en.wikipedia.org/wiki/Matsuyama',
    note: 'A castle town and the largest city of northern Shikoku. Firebombed on 26 July 1945.'
  },
  {
    id: 'kure', en: 'Kure', ja: '呉 (Kure)', zh: '吳', lat: 34.25, lon: 132.57,
    wiki: 'https://en.wikipedia.org/wiki/Kure,_Hiroshima',
    note: 'The navy yard that built the Yamato. Carrier raids in July 1945 sank what was left of the fleet at its moorings.'
  },
  {
    id: 'yokosuka', en: 'Yokosuka', ja: '横須賀 (Yokosuka)', zh: '橫須賀', lat: 35.28, lon: 139.67,
    wiki: 'https://en.wikipedia.org/wiki/Yokosuka',
    note: 'The oldest of the navy yards, built with French help from 1865, and the base that guarded the approaches to Tokyo Bay.'
  },
  {
    id: 'sasebo', en: 'Sasebo', ja: '佐世保 (Sasebo)', zh: '佐世保', lat: 33.18, lon: 129.72,
    wiki: 'https://en.wikipedia.org/wiki/Sasebo',
    note: 'The naval base facing Korea and China, from which the fleet sailed in 1894 and again in 1904.'
  },
  {
    id: 'maizuru', en: 'Maizuru', ja: '舞鶴 (Maizuru)', zh: '舞鶴', lat: 35.45, lon: 135.33,
    wiki: 'https://en.wikipedia.org/wiki/Maizuru',
    note: 'The Japan Sea naval base, and after the surrender the longest-serving of the repatriation ports: some 660,000 people came home through it over thirteen years.'
  },
  {
    id: 'aomori', en: 'Aomori', ja: '青森 (Aomori)', zh: '青森', lat: 40.82, lon: 140.75,
    wiki: 'https://en.wikipedia.org/wiki/Aomori',
    note: 'The ferry crossing to Hokkaidō, and the bottleneck of the northern railway. Firebombed on 28 July 1945.'
  },
  {
    id: 'toyohara', en: 'Toyohara (Yuzhno-Sakhalinsk)', ja: '豊原 (Toyohara)', zh: '豐原',
    lat: 46.96, lon: 142.73, wiki: 'https://en.wikipedia.org/wiki/Yuzhno-Sakhalinsk',
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
    id: 'tangshan', en: 'Tángshān (Tangshan)', ja: '唐山 (Tōzan)', zh: '唐山', lat: 39.63,
    lon: 118.18, wiki: 'https://en.wikipedia.org/wiki/Tangshan',
    note: 'The Kailuan mines, the largest coal workings in north China and British-managed until Japan took them over in 1941.'
  },
  {
    id: 'shanhaiguan', en: 'Shānhǎiguān (Shanhaikuan)', ja: '山海関 (Sankaikan)', zh: '山海關',
    lat: 40.01, lon: 119.75, wiki: 'https://en.wikipedia.org/wiki/Shanhai_Pass',
    note: 'Where the Great Wall meets the sea and the Manchurian railway crosses into China proper. Taken on 1 January 1933, opening the Rehe campaign.'
  },
  {
    id: 'datong', en: 'Dàtóng (Tatung)', ja: '大同 (Daidō)', zh: '大同', lat: 40.09, lon: 113.3,
    wiki: 'https://en.wikipedia.org/wiki/Datong',
    note: 'Coal, and the junction of the two railways the occupation ran on. Taken on 13 September 1937 and attached to the Japanese-sponsored government of northern Shanxi.'
  },
  {
    id: 'luoyang', en: 'Luòyáng (Loyang)', ja: '洛陽 (Rakuyō)', zh: '洛陽', lat: 34.62, lon: 112.45,
    wiki: 'https://en.wikipedia.org/wiki/Luoyang',
    note: 'The Longhai railway city and one of the old capitals of China. Held out until 25 May 1944, and the December 1942 line of control leaves it outside the occupation. The Henan famine of 1942–43 killed some two million people in the country round it.'
  },
  {
    id: 'zhengzhou', en: 'Zhèngzhōu (Chengchow)', ja: '鄭州 (Teishū)', zh: '鄭州', lat: 34.75,
    lon: 113.63, wiki: 'https://en.wikipedia.org/wiki/Zhengzhou',
    note: 'The junction of the north–south and east–west trunk railways, and the reason the Huayuankou dikes were cut. Taken briefly in October 1941, given up again, and held from April 1944.'
  },
  {
    id: 'suzhou', en: 'Sūzhōu (Soochow)', ja: '蘇州 (Soshū)', zh: '蘇州', lat: 31.3, lon: 120.62,
    wiki: 'https://en.wikipedia.org/wiki/Suzhou',
    note: 'Silk, gardens, and the Shanghai–Nanjing railway. Fell on 19 November 1937 in the pursuit from Shanghai.'
  },
  {
    id: 'wuxi', en: 'Wúxī (Wusih)', ja: '無錫 (Mushaku)', zh: '無錫', lat: 31.57, lon: 120.3,
    wiki: 'https://en.wikipedia.org/wiki/Wuxi',
    note: 'The cotton and silk mill town of the lower Yangtze, second only to Shanghai in the region\'s industry. Fell on 25 November 1937.'
  },
  {
    id: 'xuzhou', en: 'Xúzhōu (Hsuchow)', ja: '徐州 (Joshū)', zh: '徐州', lat: 34.26, lon: 117.19,
    wiki: 'https://en.wikipedia.org/wiki/Xuzhou',
    note: 'The crossing of the north–south and east–west trunk railways, and for that reason the object of the largest campaign of 1938. The Chinese victory at Taierzhuang in April held it until 19 May, and the army got away rather than be encircled.'
  },
  {
    id: 'wuhu', en: 'Wúhú (Wuhu)', ja: '蕪湖 (Buko)', zh: '蕪湖', lat: 31.35, lon: 118.38,
    wiki: 'https://en.wikipedia.org/wiki/Wuhu',
    note: 'The great rice market of the lower Yangtze. Fell on 10 December 1937, three days before Nanjing, cutting the river escape route from the capital.'
  },
  {
    id: 'bengbu', en: 'Bèngbù (Pengpu)', ja: '蚌埠 (Bōfu)', zh: '蚌埠', lat: 32.92, lon: 117.39,
    wiki: 'https://en.wikipedia.org/wiki/Bengbu',
    note: 'On the Tianjin–Pukow railway where it crosses the Huai. Taken in February 1938 in the drive north towards Xuzhou.'
  },
  {
    id: 'jiujiang', en: 'Jiǔjiāng (Kiukiang)', ja: '九江 (Kyūkō)', zh: '九江', lat: 29.71, lon: 116,
    wiki: 'https://en.wikipedia.org/wiki/Jiujiang',
    note: 'The tea port of Jiangxi and the outlet of the Poyang lake. Fell on 26 July 1938, halfway up the river to Hankou.'
  },
  {
    id: 'yichang', en: 'Yíchāng (Ichang)', ja: '宜昌 (Gishō)', zh: '宜昌', lat: 30.69, lon: 111.29,
    wiki: 'https://en.wikipedia.org/wiki/Yichang',
    note: 'Where cargo transferred from steamer to junk for the passage of the gorges. Taken on 12 June 1940 and held as the furthest Japanese post up the Yangtze, below the water that shielded Chongqing.'
  },
  {
    id: 'hengyang', en: 'Héngyáng (Hengyang)', ja: '衡陽 (Kōyō)', zh: '衡陽', lat: 26.89,
    lon: 112.57, wiki: 'https://en.wikipedia.org/wiki/Hengyang',
    note: 'The junction of the Guangzhou–Hankou and Hunan–Guangxi railways, and the airfield the Ichigo offensive was launched to take. Its garrison held for forty-seven days and surrendered on 8 August 1944.'
  },
  {
    id: 'yueyang', en: 'Yuèyáng (Yochow)', ja: '岳陽 (Gakuyō)', zh: '岳陽', lat: 29.36, lon: 113.13,
    wiki: 'https://en.wikipedia.org/wiki/Yueyang',
    note: 'The Tungting lake port on the Guangzhou–Hankou line, taken in November 1938 and the base from which every attack on Changsha was mounted.'
  },
  {
    id: 'shaoguan', en: 'Sháoguān (Shiuchow)', ja: '韶関 (Shōkan)', zh: '韶關', lat: 24.81,
    lon: 113.6, wiki: 'https://en.wikipedia.org/wiki/Shaoguan',
    note: 'The wartime capital of Guangdong after Guangzhou fell, on the railway north to Hunan, and not taken until January 1945.'
  },
  {
    id: 'wuzhou', en: 'Wúzhōu (Wuchow)', ja: '梧州 (Goshū)', zh: '梧州', lat: 23.48, lon: 111.28,
    wiki: 'https://en.wikipedia.org/wiki/Wuzhou',
    note: 'Where the West River leaves Guangxi for Guangzhou, and the trade route between them. Taken in the 1944 offensive.'
  },
  {
    id: 'zunyi', en: 'Zūnyì (Tsunyi)', ja: '遵義 (Jungi)', zh: '遵義', lat: 27.73, lon: 106.93,
    wiki: 'https://en.wikipedia.org/wiki/Zunyi',
    note: 'Where the Communist leadership met in January 1935, in the middle of the Long March, and Mao emerged in charge of the party\'s military line.'
  },
  {
    id: 'dali', en: 'Dàlǐ (Tali)', ja: '大理 (Dairi)', zh: '大理', lat: 25.61, lon: 100.27,
    note: 'The old Nanzhao capital, on the Burma Road through western Yunnan along which the fighting came in 1944.'
  },
  {
    id: 'wanxian', en: 'Wànzhōu (Wanhsien)', ja: '万県 (Manken)', zh: '萬縣', lat: 30.81,
    lon: 108.41, wiki: 'https://en.wikipedia.org/wiki/Wanzhou,_Chongqing',
    note: 'The upper Yangtze port above the gorges, and the scene of a British naval bombardment in 1926 that did much to turn Chinese opinion against the treaty powers.'
  },
  {
    id: 'baoji', en: 'Bǎojī (Paoki)', ja: '宝鶏 (Hōkei)', zh: '寶雞', lat: 34.36, lon: 107.14,
    wiki: 'https://en.wikipedia.org/wiki/Baoji',
    note: 'The railhead of the line west from Sian, and the road to Gansu and the Soviet supply route.'
  },
  {
    id: 'tianshui', en: 'Tiānshuǐ (Tienshui)', ja: '天水 (Tensui)', zh: '天水', lat: 34.58,
    lon: 105.72, wiki: 'https://en.wikipedia.org/wiki/Tianshui',
    note: 'On the Gansu corridor where the Lunghai railway ran out, a stage on the overland road that carried Soviet aid until 1941.'
  },
  {
    id: 'chaoyang', en: 'Cháoyáng (Chaoyang)', ja: '朝陽 (Chōyō)', zh: '朝陽', lat: 41.57,
    lon: 120.45, wiki: 'https://en.wikipedia.org/wiki/Chaoyang,_Liaoning',
    note: 'On the road from the Wall into Rehe, taken in the campaign of February and March 1933.'
  },
  {
    id: 'yanji', en: 'Yánjí (Yenki)', ja: '延吉 (Enkichi)', zh: '延吉', lat: 42.91, lon: 129.51,
    wiki: 'https://en.wikipedia.org/wiki/Yanji',
    note: 'The seat of Jiandao, the one Manchurian province with a Korean majority, and the ground of both Korean resistance and the counter-insurgency against it.'
  },
  {
    id: 'jiamusi', en: 'Jiāmùsī (Kiamusze)', ja: '佳木斯 (Kamusu)', zh: '佳木斯', lat: 46.81,
    lon: 130.32, wiki: 'https://en.wikipedia.org/wiki/Jiamusi',
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
    lat: 38.04, lon: 114.51, wiki: 'https://en.wikipedia.org/wiki/Shijiazhuang',
    note: 'The junction where the Beijing–Hankou trunk line meets the railway west into Shanxi, which is the whole reason for the place: it was a village until the lines came. Fell in October 1937, a fortnight after Baoding.'
  },
  {
    id: 'tanggu', en: 'Tánggū (Tangku)', ja: '塘沽 (Tōko)', zh: '塘沽', lat: 39.00, lon: 117.65,
    wiki: 'https://en.wikipedia.org/wiki/Tanggu,_Tianjin',
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
    id: 'kowloon', en: 'Kowloon', lat: 22.32, lon: 114.17,
    wiki: 'https://en.wikipedia.org/wiki/Kowloon',
    note: 'The mainland half of the city, and where the December 1941 fighting was decided.'
  },
  {
    id: 'hongkong', en: 'Victoria, Hong Kong', lat: 22.28, lon: 114.16,
    wiki: 'https://en.wikipedia.org/wiki/Victoria,_Hong_Kong',
    note: 'The largest British city in East Asia and the busiest port on the China coast, attacked on 8 December 1941 and surrendered on Christmas Day. The territory is already drawn; the city is not on the layer at all.'
  },
  {
    id: 'baroda', en: 'Baroda (Vadodara)', lat: 22.31, lon: 73.18,
    wiki: 'https://en.wikipedia.org/wiki/Vadodara',
    note: 'The Gaekwad\'s capital, and one of the best-administered of the princely states: free primary schooling from 1906 and a state bank of its own.'
  },
  {
    id: 'chiba', en: 'Chiba', lat: 35.61, lon: 140.12,
    wiki: 'https://en.wikipedia.org/wiki/Chiba-Ch%C5%AB%C5%8D_Station',
    note: 'The bay city east of Tokyo, with the army\'s railway and engineer schools and, by the war, steelworks on the reclaimed shore.'
  },
  {
    id: 'cholon', en: 'Cholon', lat: 10.75, lon: 106.65,
    wiki: 'https://en.wikipedia.org/wiki/B%C3%ACnh_T%C3%A2y',
    note: 'Saigon’s Chinese twin city, counted separately in the colonial censuses and together with Saigon the largest urban area in Indochina.'
  },
  {
    id: 'changde', en: 'Chángdé (Changteh)', lat: 29.03, lon: 111.7,
    wiki: 'https://en.wikipedia.org/wiki/Changde',
    note: 'The battle of November–December 1943, and one of the confirmed targets of Unit 731’s plague attacks in 1941.'
  },
  {
    id: 'fukui', en: 'Fukui', lat: 36.06, lon: 136.22,
    wiki: 'https://en.wikipedia.org/wiki/Fukui_Station_(Fukui)',
    note: 'A textile town on the Japan Sea side, known for habutae silk.'
  },
  {
    id: 'gifu', en: 'Gifu', lat: 35.42, lon: 136.76, wiki: 'https://en.wikipedia.org/wiki/Gifu',
    note: 'Paper lanterns, umbrellas and cormorant fishing on the Nagara, and an aircraft plant by the war.'
  },
  {
    id: 'gwalior', en: 'Gwalior', lat: 26.22, lon: 78.18,
    wiki: 'https://en.wikipedia.org/wiki/Gwalior',
    note: 'The Scindia capital under its fortress rock, and a state that kept its own coinage and railway.'
  },
  {
    id: 'hamamatsu', en: 'Hamamatsu', lat: 34.71, lon: 137.73,
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
    id: 'kawasaki', en: 'Kawasaki', lat: 35.53, lon: 139.7,
    wiki: 'https://en.wikipedia.org/wiki/Kawasaki-ku,_Kawasaki',
    note: 'Steel and shipbuilding between Tokyo and Yokohama, some 300,000 people by 1940, and among the most heavily firebombed places in Japan.'
  },
  {
    id: 'kokura', en: 'Kokura', lat: 33.88, lon: 130.88,
    wiki: 'https://en.wikipedia.org/wiki/Kokura',
    note: 'Primary target for the second atomic bomb, 9 Aug 1945; cloud cover diverted the mission to Nagasaki. Arsenal city.'
  },
  {
    id: 'kochi', en: 'Kōchi', lat: 33.56, lon: 133.53,
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dchi,_K%C5%8Dchi',
    note: 'The old Tosa domain on the Pacific coast of Shikoku, and the home of much of the Meiji Restoration\'s leadership.'
  },
  {
    id: 'kofu', en: 'Kōfu', lat: 35.66, lon: 138.57,
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dfu',
    note: 'The Kōfu basin: vines, orchards and the silk that went out over the pass to Yokohama.'
  },
  {
    id: 'liuzhou', en: 'Liǔzhōu (Liuchow)', lat: 24.31, lon: 109.42,
    wiki: 'https://en.wikipedia.org/wiki/Liuzhou',
    note: 'A principal Fourteenth Air Force base, and with Kweilin the objective of the Ichi-gō offensive of 1944.'
  },
  {
    id: 'luzhou', en: 'Lúzhōu (Luchow)', lat: 28.87, lon: 105.44,
    wiki: 'https://en.wikipedia.org/wiki/Luzhou',
    note: 'The Yangtze port below Chongqing where the Tuo river comes in, and a salt and sugar market.'
  },
  {
    id: 'macaucity', en: 'Macao (Cidade do Santo Nome de Deus)', lat: 22.19, lon: 113.54,
    wiki: 'https://en.wikipedia.org/wiki/Macau',
    note: 'Neutral Portuguese territory throughout the war; its population several times over as refugees came in from Hong Kong and Canton.'
  },
  {
    id: 'maebashi', en: 'Maebashi', lat: 36.39, lon: 139.06,
    wiki: 'https://en.wikipedia.org/wiki/Maebashi',
    note: 'The silk-reeling town of Gunma, at the centre of the trade that paid for Japan\'s industrialisation.'
  },
  {
    id: 'moji', en: 'Moji', lat: 33.94, lon: 130.96,
    wiki: 'https://en.wikipedia.org/wiki/Moji-ku,_Kitaky%C5%ABsh%C5%AB',
    note: 'The Kanmon Strait coaling and transhipment port; the embarkation point for the continent.'
  },
  {
    id: 'morioka', en: 'Morioka', lat: 39.7, lon: 141.15,
    wiki: 'https://en.wikipedia.org/wiki/Morioka',
    note: 'The seat of northern Iwate, and iron-casting since the Nanbu domain.'
  },
  {
    id: 'nagano', en: 'Nagano', lat: 36.65, lon: 138.18,
    wiki: 'https://en.wikipedia.org/wiki/Nagano_Holy_Saviour_Church',
    note: 'The temple town of Zenkōji, and the silk country of the Shinano valleys.'
  },
  {
    id: 'nanchong', en: 'Nánchōng (Nanchung)', lat: 30.8, lon: 106.08,
    wiki: 'https://en.wikipedia.org/wiki/Nanchong',
    note: 'A silk town on the Jialing north of Chongqing, in the Free China interior.'
  },
  {
    id: 'nantong', en: 'Nántōng (Nantung)', lat: 32.01, lon: 120.86,
    wiki: 'https://en.wikipedia.org/wiki/Nantong',
    note: 'Zhang Jian\'s cotton mills on the north bank of the Yangtze, the first modern industrial town founded by a Chinese reformer.'
  },
  {
    id: 'otaru', en: 'Otaru', lat: 43.19, lon: 140.99,
    wiki: 'https://en.wikipedia.org/wiki/Otaru',
    note: 'Hokkaidō’s main port and the terminal for the Karafuto and Japan Sea trade.'
  },
  {
    id: 'patna', en: 'Patna', lat: 25.61, lon: 85.14,
    wiki: 'https://en.wikipedia.org/wiki/Patna',
    note: 'The seat of Bihar on the Ganges, and the old Mauryan capital of Pataliputra beneath it.'
  },
  {
    id: 'sakai', en: 'Sakai', lat: 34.57, lon: 135.48,
    wiki: 'https://en.wikipedia.org/wiki/Sakai',
    note: 'The free port that armed the sixteenth-century wars and, by the 1930s, an industrial suburb of Osaka.'
  },
  {
    id: 'shizuoka', en: 'Shizuoka', lat: 34.98, lon: 138.38,
    wiki: 'https://en.wikipedia.org/wiki/Shizuoka_City_Central_Gymnasium',
    note: 'Tea and mandarins, and the port of Shimizu that shipped both.'
  },
  {
    id: 'shaoxing', en: 'Shàoxīng (Shaohing)', lat: 30.0, lon: 120.58,
    wiki: 'https://en.wikipedia.org/wiki/Shaoxing',
    note: 'Rice wine, and the town Lu Xun came from; taken in 1941.'
  },
  {
    id: 'srinagar', en: 'Srinagar', lat: 34.08, lon: 74.8,
    wiki: 'https://en.wikipedia.org/wiki/Srinagar',
    note: 'The summer capital of Kashmir, the largest princely state by area — a Hindu dynasty ruling a Muslim majority, which is the whole of the later quarrel in one sentence.'
  },
  {
    id: 'takamatsu', en: 'Takamatsu', lat: 34.34, lon: 134.05,
    wiki: 'https://en.wikipedia.org/wiki/Takamatsu',
    note: 'The castle port of Shikoku facing the Inland Sea, and the ferry crossing to Honshū.'
  },
  {
    id: 'thonburi', en: 'Thonburi', lat: 13.72, lon: 100.49,
    wiki: 'https://en.wikipedia.org/wiki/Thonburi',
    note: 'Bangkok’s twin across the river, a separate province and separately enumerated until 1971.'
  },
  {
    id: 'tokushima', en: 'Tokushima', lat: 34.07, lon: 134.55,
    wiki: 'https://en.wikipedia.org/wiki/Tokushima_(city)',
    note: 'Indigo, the crop that made the old Awa domain rich, on the Shikoku side of the Naruto strait.'
  },
  {
    id: 'toyama', en: 'Toyama', lat: 36.7, lon: 137.21,
    wiki: 'https://en.wikipedia.org/wiki/Toyama_Station',
    note: 'The 1–2 August 1945 firebombing destroyed about 99% of the built-up area, the highest destruction rate of any Japanese city.'
  },
  {
    id: 'toyohashi', en: 'Toyohashi', lat: 34.77, lon: 137.39,
    wiki: 'https://en.wikipedia.org/wiki/Toyohashi',
    note: 'A garrison and silk town on the Tōkaidō between Nagoya and Shizuoka.'
  },
  {
    id: 'utsunomiya', en: 'Utsunomiya', lat: 36.56, lon: 139.88,
    wiki: 'https://en.wikipedia.org/wiki/Utsunomiya',
    note: 'The garrison town north of Tokyo on the road to Nikkō.'
  },
  {
    id: 'wakayama', en: 'Wakayama', lat: 34.23, lon: 135.17,
    wiki: 'https://en.wikipedia.org/wiki/Wakayama_(city)',
    note: 'The old Kii domain south of Osaka, with cotton mills and the mikan orchards behind it.'
  },
  {
    id: 'yawata', en: 'Yawata (Yahata)', lat: 33.86, lon: 130.81,
    wiki: 'https://en.wikipedia.org/wiki/Yahata,_Fukuoka',
    note: 'Imperial Steel Works, the centre of Japanese heavy industry, and the target of the first B-29 raid on the home islands, 15 June 1944.'
  },
  {
    id: 'yangzhou', en: 'Yángzhōu (Yangchow)', lat: 32.39, lon: 119.42,
    wiki: 'https://en.wikipedia.org/wiki/Yangzhou',
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
    id: 'oita', en: 'Ōita', lat: 33.24, lon: 131.61,
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cita_Prefecture',
    note: 'The hot-spring country of eastern Kyūshū, and a port facing the Inland Sea.'
  },
  {
    id: 'omuta', en: 'Ōmuta', lat: 33.03, lon: 130.45,
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cmuta,_Fukuoka',
    note: 'The Miike coal mines: Mitsui’s largest pit, worked by Korean, Chinese and Allied prisoner labour.'
  },
  {
    id: 'akita', en: 'Akita', lat: 39.72, lon: 140.1,
    wiki: 'https://en.wikipedia.org/wiki/Akita_Sports_Plus_ASP_Stadium',
    note: 'Rice, sake and the Kosaka copper mines behind it, on the Japan Sea coast.'
  },
  {
    id: 'aleksandrovsk', en: 'Aleksandrovsk-Sakhalinsky', lat: 50.9, lon: 142.16,
    wiki: 'https://en.wikipedia.org/wiki/Alexandrovsk-Sakhalinsky_(town)',
    note: 'The capital of Soviet northern Sakhalin, occupied by Japan 1920–25 in reprisal for Nikolaevsk.'
  },
  {
    id: 'alorsetar', en: 'Alor Setar', lat: 6.12, lon: 100.37,
    wiki: 'https://en.wikipedia.org/wiki/Alor_Setar',
    note: 'State capital, and one of the four states transferred to Thailand in 1943.'
  },
  {
    id: 'amagasaki', en: 'Amagasaki', lat: 34.73, lon: 135.41,
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
    id: 'asahikawa', en: 'Asahikawa', lat: 43.77, lon: 142.36,
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
    id: 'blagoveshchensk', en: 'Blagoveshchensk', lat: 50.28, lon: 127.54,
    wiki: 'https://en.wikipedia.org/wiki/Blagoveshchensk',
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
    id: 'benxi', en: 'Běnxī (Penhsihu)', lat: 41.29, lon: 123.77,
    wiki: 'https://en.wikipedia.org/wiki/Benxi',
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
    id: 'changhua', en: 'Changhua (Shōka)', lat: 24.08, lon: 120.54,
    wiki: 'https://en.wikipedia.org/wiki/Changhua',
    note: 'On the Taiwan trunk railway at the foot of Baguashan, in the centre of the rice and sugar plain.'
  },
  {
    id: 'chifeng', en: 'Chifeng (Ulanhad)', lat: 42.26, lon: 118.89,
    wiki: 'https://en.wikipedia.org/wiki/Chifeng',
    note: 'The Mongol trade town in western Rehe, on the road from the Wall to the steppe.'
  },
  {
    id: 'chinju', en: 'Chinju (Shinshū)', lat: 35.19, lon: 128.08,
    wiki: 'https://en.wikipedia.org/wiki/Jinju',
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
    id: 'quanzhou', en: 'Chüanchow (Quanzhou)', lat: 24.87, lon: 118.68,
    wiki: 'https://en.wikipedia.org/wiki/Quanzhou',
    note: 'The medieval port foreign traders knew as Zaiton, and the home district of much of the Chinese population of Southeast Asia.'
  },
  {
    id: 'chonju', en: 'Chŏnju (Zenshū)', lat: 35.82, lon: 127.15,
    wiki: 'https://en.wikipedia.org/wiki/Jeonju',
    note: 'The seat of North Chŏlla and the old Chosŏn dynasty\'s ancestral home, in the rice country of the south-west.'
  },
  {
    id: 'chunchon', en: 'Ch’unch’ŏn (Shunsen)', lat: 37.88, lon: 127.73,
    wiki: 'https://en.wikipedia.org/wiki/Camp_Page',
    note: 'The seat of Kangwŏn, in the lake and mountain country east of Seoul.'
  },
  {
    id: 'chongju', en: 'Ch’ŏngju (Seishū)', lat: 36.64, lon: 127.49,
    wiki: 'https://en.wikipedia.org/wiki/Cheongju',
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
    id: 'duolun', en: 'Dolonnor (Duolun)', lat: 42.19, lon: 116.47,
    wiki: 'https://en.wikipedia.org/wiki/Dolon_Nor',
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
    id: 'etajima', en: 'Etajima', lat: 34.23, lon: 132.46,
    wiki: 'https://en.wikipedia.org/wiki/Etajima',
    note: 'The Imperial Naval Academy, on an island in the Inland Sea, through which almost every Japanese admiral of the war had passed.'
  },
  {
    id: 'zhanjiang', en: 'Fort Bayard (Zhanjiang)', lat: 21.27, lon: 110.36,
    wiki: 'https://en.wikipedia.org/wiki/Zhanjiang',
    note: 'The capital of the French leased territory the map already draws, and the smuggling channel into free China until the Japanese took it in February 1943.'
  },
  {
    id: 'fukushima', en: 'Fukushima', lat: 37.76, lon: 140.47,
    wiki: 'https://en.wikipedia.org/wiki/Fukushima_(city)',
    note: 'Silk-reeling and the orchards of the Fukushima basin, on the northern trunk railway.'
  },
  {
    id: 'chichijima', en: 'Futami (Chichijima)', lat: 27.09, lon: 142.19,
    wiki: 'https://en.wikipedia.org/wiki/Chichijima_Airfield',
    note: 'The administrative centre of the Bonins and a fortified base; the Chichijima incident of 1944–45.'
  },
  {
    id: 'fuxin', en: 'Fùxīn (Fuhsin)', lat: 42.02, lon: 121.67,
    wiki: 'https://en.wikipedia.org/wiki/Fuxin',
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
    id: 'ganzhou', en: 'Gànzhōu (Kanchow)', lat: 25.83, lon: 114.93,
    wiki: 'https://en.wikipedia.org/wiki/Ganzhou',
    note: 'Where Chiang Ching-kuo ran southern Jiangxi from 1939 to 1945, and made the reputation that carried him later.'
  },
  {
    id: 'haeju', en: 'Haeju (Kaishū)', lat: 38.04, lon: 125.71,
    wiki: 'https://en.wikipedia.org/wiki/Haeju',
    note: 'The seat of Hwanghae, and the port for the wheat and iron of the west coast.'
  },
  {
    id: 'haikou', en: 'Haikou (Kiungchow)', lat: 20.04, lon: 110.34,
    wiki: 'https://en.wikipedia.org/wiki/Haikou',
    note: 'Hainan was occupied in February 1939 and the map marks the landing; the island’s only real town is not on the layer.'
  },
  {
    id: 'hailar', en: 'Hailar', lat: 49.2, lon: 119.7,
    wiki: 'https://en.wikipedia.org/wiki/Hailar_District',
    note: 'The Hulunbuir garrison and fortified zone facing Mongolia; the base for the Nomonhan fighting.'
  },
  {
    id: 'hami', en: 'Hami (Kumul)', lat: 42.83, lon: 93.51,
    wiki: 'https://en.wikipedia.org/wiki/Hami',
    note: 'The gate between Sinkiang and Kansu, and the terminus of the Soviet supply road into China.'
  },
  {
    id: 'heihe', en: 'Heihe (Sakhalyan/Aigun)', lat: 50.25, lon: 127.53,
    wiki: 'https://en.wikipedia.org/wiki/Heihe',
    note: 'The Amur crossing facing Blagoveshchensk, and the northern end of the Manchurian frontier the Kwantung Army fortified.'
  },
  {
    id: 'hitachi', en: 'Hitachi', lat: 36.6, lon: 140.65,
    wiki: 'https://en.wikipedia.org/wiki/Hitachi,_Ibaraki',
    note: 'Heavy electrical works; shelled from the sea in July 1945.'
  },
  {
    id: 'hollandia', en: 'Hollandia (Jayapura)', lat: -2.53, lon: 140.72,
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Hollandia',
    note: 'MacArthur’s landing of 22 April 1944, which leapfrogged the Japanese Eighteenth Army, and afterwards his headquarters.'
  },
  {
    id: 'handan', en: 'Hándān', lat: 36.63, lon: 114.54,
    wiki: 'https://en.wikipedia.org/wiki/Handan',
    note: 'A junction on the Beijing–Hankou railway in southern Hebei, in the country the base areas worked.'
  },
  {
    id: 'hungnam', en: 'Hŭngnam (Konan)', lat: 39.83, lon: 127.62,
    wiki: 'https://en.wikipedia.org/wiki/Hungnam',
    note: 'Noguchi Jun’s chemical combine, the largest industrial complex in the empire outside Japan, built on Korean and later forced labour.'
  },
  {
    id: 'ise', en: 'Ise (Uji-Yamada)', lat: 34.49, lon: 136.71,
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
    id: 'kongju', en: 'Kongju (Kōshū)', lat: 36.45, lon: 127.12,
    wiki: 'https://en.wikipedia.org/wiki/Gongju',
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
    id: 'kunsan', en: 'Kunsan (Gunzan)', lat: 35.98, lon: 126.72,
    wiki: 'https://en.wikipedia.org/wiki/Gunsan',
    note: 'The rice port: the outlet through which the Chŏlla harvest left for Japan, and a heavily Japanese town.'
  },
  {
    id: 'kushiro', en: 'Kushiro', lat: 42.98, lon: 144.38,
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
    id: 'liaoyang', en: 'Liáoyáng', lat: 41.27, lon: 123.17,
    wiki: 'https://en.wikipedia.org/wiki/Liaoyang',
    note: 'The old capital of the Liao country and the field of the largest battle of 1904 before Mukden.'
  },
  {
    id: 'lorengau', en: 'Lorengau (Manus)', lat: -2.02, lon: 147.27,
    wiki: 'https://en.wikipedia.org/wiki/Lorengau',
    note: 'The Admiralties, taken in early 1944 and turned into the largest Allied base in the south-west Pacific.'
  },
  {
    id: 'linfen', en: 'Línfén', lat: 36.09, lon: 111.52,
    wiki: 'https://en.wikipedia.org/wiki/Linfen',
    note: 'On the Fen river in southern Shanxi, taken in 1938 and held as a garrison town on the road south.'
  },
  {
    id: 'laohekou', en: 'Lǎohékǒu (Laohokow)', lat: 32.39, lon: 111.67,
    wiki: 'https://en.wikipedia.org/wiki/Laohekou',
    note: 'Fourteenth Air Force base and the object of the last Japanese offensive in China, 1945.'
  },
  {
    id: 'manzhouli', en: 'Manchouli (Manzhouli)', lat: 49.6, lon: 117.45,
    wiki: 'https://en.wikipedia.org/wiki/Manzhouli',
    note: 'The rail frontier with the Soviet Union on the Chinese Eastern Railway.'
  },
  {
    id: 'maoka', en: 'Maoka (Kholmsk)', lat: 47.06, lon: 142.05,
    wiki: 'https://en.wikipedia.org/wiki/Kholmsk',
    note: 'West-coast port; the Soviet landing of 20 August 1945 and the telephone operators’ suicides.'
  },
  {
    id: 'masan', en: 'Masan', lat: 35.2, lon: 128.57,
    wiki: 'https://en.wikipedia.org/wiki/Masan',
    note: 'A south-coast port opened to Japanese trade in 1899, and a naval anchorage in the Russo-Japanese War.'
  },
  {
    id: 'matsue', en: 'Matsue', lat: 35.47, lon: 133.05,
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
    id: 'mito', en: 'Mito', lat: 36.37, lon: 140.47,
    wiki: 'https://en.wikipedia.org/wiki/Mito_T%C5%8Dsh%C5%8D-g%C5%AB',
    note: 'The seat of a senior Tokugawa house, and of the school of thought that supplied the slogans of the Restoration.'
  },
  {
    id: 'miyazaki', en: 'Miyazaki', lat: 31.91, lon: 131.42,
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
    id: 'muroran', en: 'Muroran', lat: 42.32, lon: 140.97,
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
    id: 'nara', en: 'Nara', lat: 34.69, lon: 135.81,
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
    id: 'pingfang', en: 'Pingfang', lat: 45.61, lon: 126.63,
    wiki: 'https://en.wikipedia.org/wiki/Pingfang,_Harbin',
    note: 'Unit 731. A village rather than a city, but the site of the biological-warfare programme and its human experiments.'
  },
  {
    id: 'pingtung', en: 'Pingtung (Heitō)', lat: 22.68, lon: 120.49,
    wiki: 'https://en.wikipedia.org/wiki/Pingtung_County_Council',
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
    id: 'quzhou', en: 'Qúzhōu (Chuchow)', lat: 28.94, lon: 118.87,
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
    id: 'shikuka', en: 'Shikuka (Poronaysk)', lat: 49.22, lon: 143.1,
    wiki: 'https://en.wikipedia.org/wiki/Poronaysk',
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
    wiki: 'https://en.wikipedia.org/wiki/Suifenhe',
    note: 'The eastern rail crossing to Vladivostok, and a fortified belt.'
  },
  {
    id: 'suwon', en: 'Suwŏn (Suigen)', lat: 37.26, lon: 127.01,
    wiki: 'https://en.wikipedia.org/wiki/Suwon',
    note: 'The colonial agricultural experiment station, where the rice varieties that fed the empire\'s grain shipments were bred.'
  },
  {
    id: 'siping', en: 'Sìpíng (Ssupingkai)', lat: 43.17, lon: 124.35,
    wiki: 'https://en.wikipedia.org/wiki/Siping,_Jilin',
    note: 'The junction where the line from Changchun meets the branch west into the Mongol country.'
  },
  {
    id: 'songjin', en: 'Sŏngjin (Jōshin)', lat: 40.67, lon: 129.2,
    wiki: 'https://en.wikipedia.org/wiki/Kimchaek',
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
    id: 'taitung', en: 'Taitung (Taitō)', lat: 22.76, lon: 121.14,
    wiki: 'https://en.wikipedia.org/wiki/Taitung_Performing_Art_Center',
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
    id: 'tottori', en: 'Tottori', lat: 35.5, lon: 134.24,
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
    id: 'tsu', en: 'Tsu', lat: 34.72, lon: 136.51,
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
    id: 'tonghua', en: 'Tōnghuà', lat: 41.73, lon: 125.94,
    wiki: 'https://en.wikipedia.org/wiki/Tonghua',
    note: 'Manchukuo’s final capital in August 1945, and the redoubt planned for the Kwantung Army’s last stand.'
  },
  {
    id: 'ube', en: 'Ube', lat: 33.95, lon: 131.25,
    wiki: 'https://en.wikipedia.org/wiki/Ube,_Yamaguchi',
    note: 'Coal and chemicals; undersea pits worked by conscripted Korean labour.'
  },
  {
    id: 'urawa', en: 'Urawa', lat: 35.86, lon: 139.65,
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
    id: 'xiangyang', en: 'Xiāngyáng (Siangyang)', lat: 32.01, lon: 112.12,
    wiki: 'https://en.wikipedia.org/wiki/Xiangyang',
    note: 'The double city on the Han river, the classic gate between the north China plain and the middle Yangtze.'
  },
  {
    id: 'yamagata', en: 'Yamagata', lat: 38.24, lon: 140.36,
    note: 'Safflower and silk in the Mogami basin, behind the Ōu mountains.'
  },
  {
    id: 'yamaguchi', en: 'Yamaguchi', lat: 34.19, lon: 131.47,
    wiki: 'https://en.wikipedia.org/wiki/Yamaguchi_Prefectural_Museum',
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
    id: 'yilan', en: 'Yilan (Giran)', lat: 24.76, lon: 121.75,
    wiki: 'https://en.wikipedia.org/wiki/Yilan_Distillery_Chia_Chi_Lan_Liquor_Museum',
    note: 'The rice plain behind the north-east coast of Taiwan, cut off from Taipei by the mountains until the railway.'
  },
  {
    id: 'anyang', en: 'Ānyáng (Changteh)', lat: 36.1, lon: 114.39,
    wiki: 'https://en.wikipedia.org/wiki/Anyang',
    note: 'The last Shang capital, excavated from 1928 — the dig that founded modern Chinese archaeology.'
  },
  {
    id: 'enshi', en: 'Ēnshī (Enshih)', lat: 30.3, lon: 109.49,
    wiki: 'https://en.wikipedia.org/wiki/Enshi_City',
    note: 'Hubei\'s wartime capital in the western gorges after Wuhan fell, and out of reach of the Japanese army for the rest of the war.'
  },
  {
    id: 'ominato', en: 'Ōminato', lat: 41.29, lon: 141.12,
    wiki: 'https://en.wikipedia.org/wiki/Mutsu,_Aomori',
    note: 'The naval district guarding the Tsugaru Strait between Honshū and Hokkaidō.'
  },
  {
    id: 'otomari', en: 'Ōtomari (Korsakov)', lat: 46.63, lon: 142.78,
    wiki: 'https://en.wikipedia.org/wiki/Korsakovsky_District,_Sakhalin_Oblast',
    note: 'Karafuto\'s ferry port to Hokkaidō, and the way almost everyone entered and left the colony.'
  },
  {
    id: 'otsu', en: 'Ōtsu', lat: 35.02, lon: 135.85,
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
];

JMAP.FEATURES = [
  {
    id: 'seajapan', en: 'Sea of Japan', ja: '日本海 (Nihonkai)', zh: '日本海', lvl: 1, lat: 40.2,
    lon: 135.0, kind: 'sea'
  },
  {
    id: 'yellowsea', en: 'Yellow Sea', ja: '黄海 (Kōkai)', zh: '黃海', lvl: 1, lat: 35.4,
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
    id: 'coralsea', en: 'Coral Sea', ja: '珊瑚海 (Sango-kai)', zh: '珊瑚海', lvl: 1, lat: -15.5,
    lon: 153.0, kind: 'sea'
  },
  {
    id: 'beringsea', en: 'Bering Sea', ja: 'ベーリング海 (Bēringu-kai)', zh: '白令海', lvl: 1, lat: 57.0,
    lon: 178.0, kind: 'sea'
  },
  {
    id: 'taiwanstrait', en: 'Taiwan Strait', ja: '台湾海峡 (Taiwan-kaikyō)', zh: '臺灣海峽', lvl: 3,
    lat: 24.4, lon: 119.4, kind: 'sea'
  },
  {
    id: 'tsushima', en: 'Tsushima Strait', ja: '対馬海峡 (Tsushima-kaikyō)', zh: '對馬海峽', lvl: 3,
    lat: 34.4, lon: 129.4, kind: 'sea'
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
    id: 'dabie', en: 'Dabie Shan', ja: '大別山 (Daibetsu-san)', zh: '大別山', lvl: 3, lat: 31.2,
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
  Pegu: {
    en: 'Pegu Division (Toungoo district was Tenasserim’s)', zh: '勃固省',
    wiki: 'https://en.wikipedia.org/wiki/Bago_Region'
  },
  Irrawaddy: {
    en: 'Irrawaddy Division', zh: '伊洛瓦底省',
    wiki: 'https://en.wikipedia.org/wiki/Ayeyarwady_Region'
  },
  Magwe: { en: 'Magwe Division', zh: '馬圭省', wiki: 'https://en.wikipedia.org/wiki/Magway_Region' },
  MandalayDiv: { en: 'Mandalay Division', zh: '曼德勒省', wiki: 'https://en.wikipedia.org/wiki/Mandalay_Region' },
  Sagaing: { en: 'Sagaing Division', zh: '實皆省' },
  Tenasserim: {
    en: 'Tenasserim Division — Thaton, Amherst, Tavoy, Mergui', zh: '丹那沙林省',
    wiki: 'https://en.wikipedia.org/wiki/Tanintharyi_Region'
  },
  Arakan: { en: 'Arakan Division', zh: '阿拉干省', wiki: 'https://en.wikipedia.org/wiki/Arakan_Division' },
  MongpanEast: { en: 'Mongpan east of the Salween', zh: '孟畔東部' },
  Kengtung: {
    en: 'Kengtung State — Kengtung, Monghsat and Tachileik', zh: '景棟',
    wiki: 'https://en.wikipedia.org/wiki/Kengtung_State'
  },
  ShanStates: { en: 'Shan States (federated)', zh: '撣邦', wiki: 'https://en.wikipedia.org/wiki/Shan_States' },
  KachinHills: { en: 'Kachin Hills', zh: '克欽山區' },
  ChinHills: { en: 'Chin Hills', zh: '欽丘陵', wiki: 'https://en.wikipedia.org/wiki/Chin_Hills' },
  Karenni: { en: 'Karenni States', zh: '克倫尼', wiki: 'https://en.wikipedia.org/wiki/Karenni_States' },
  Salween: { en: 'Salween District — the Papun hills, inside Tenasserim', zh: '薩爾溫地區' },
  'Shaan-Gan-Ning': {
    en: 'Shǎngānníng border region — Yenan', zh: '陝甘寧邊區',
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
    en: 'Ānhuī (Anhwei) — the Huai plain and the lower Yangtze, rice and wheat, and the floods the Huai brought almost yearly',
    wiki: 'https://en.wikipedia.org/wiki/Anhui'
  },
  Chahaer: {
    en: 'Cháhā’ěr (Chahar) — steppe and the caravan road north from Zhangjiakou, which handled the brick tea and wool of Outer Mongolia. Japanese-sponsored Mongol government in the north from 1936; abolished in 1952',
    wiki: 'https://en.wikipedia.org/wiki/Chahar_Province'
  },
  Fujian: {
    en: 'Fújiàn (Fukien) — mountains to the sea, tea from the Wuyi hills, and the province most of Southeast Asia\'s Chinese emigrants came from',
    wiki: 'https://en.wikipedia.org/wiki/Fujian'
  },
  Gansu: {
    en: 'Gānsù (Kansu) — the Hexi corridor, the old road to Central Asia between the Qilian mountains and the desert; wool, and Muslim generals of the Ma family in the west',
    wiki: 'https://en.wikipedia.org/wiki/Gansu'
  },
  Guangdong: {
    en: 'Guǎngdōng (Kwangtung) — the Pearl River delta, silk and rice, Canton\'s trade, and the emigration that built the Chinese communities of the Americas. Chen Jitang ran it in near-independence from 1929',
    wiki: 'https://en.wikipedia.org/wiki/Guangdong'
  },
  Guangxi: {
    en: 'Guǎngxī (Kwangsi) — karst hills and poor soil, and the base of the Guangxi clique under Li Zongren and Bai Chongxi, who fought Chiang Kai-shek in 1929 and again in 1930',
    wiki: 'https://en.wikipedia.org/wiki/Guangxi'
  },
  Guizhou: {
    en: 'Guìzhōu (Kweichow) — the poorest province of the interior, mountains and mist, opium the one crop that paid to carry out',
    wiki: 'https://en.wikipedia.org/wiki/Guizhou'
  },
  Hebei: {
    en: 'Héběi (Hopei) — called Zhili, the \'directly ruled\' province, until 1928, when the capital moved to Nanjing and Beijing became Beiping; wheat, cotton and the coal at Kailuan',
    wiki: 'https://en.wikipedia.org/wiki/Hebei'
  },
  Heilongjiang: {
    en: 'Hēilóngjiāng (Heilungkiang) — the black-earth north, soybeans and timber; called Lungkiang under Manchukuo',
    wiki: 'https://en.wikipedia.org/wiki/Heilongjiang'
  },
  Henan: {
    en: 'Hénán (Honan) — the north China plain either side of the Yellow River, wheat and cotton, and the Longhai and Pinghan railways crossing at Zhengzhou',
    wiki: 'https://en.wikipedia.org/wiki/Henan'
  },
  Hubei: {
    en: 'Húběi (Hupeh) — the Yangtze and the Han meeting at Wuhan, cotton and the iron at Daye that fed the Hanyang works',
    wiki: 'https://en.wikipedia.org/wiki/Hubei'
  },
  Hunan: {
    en: 'Húnán — rice from the Dongting basin, and the antimony at Xikuangshan, the largest deposit in the world',
    wiki: 'https://en.wikipedia.org/wiki/Hunan'
  },
  Jehol: {
    en: 'Rèhé (Jehol) — forest and grassland beyond the Wall, made a province in 1928 and taken by Japan in February 1933, when it was attached to Manchukuo; abolished in 1955 and divided between Hebei, Liaoning and Inner Mongolia'
  },
  Jiangsu: {
    en: 'Jiāngsū (Kiangsu) — the Yangtze delta, silk, cotton and the richest farmland in China; Nanjing was the capital from 1928 and Shanghai sat inside it',
    wiki: 'https://en.wikipedia.org/wiki/Jiangsu'
  },
  Jiangxi: {
    en: 'Jiāngxī (Kiangsi) — rice, the tungsten of the southern hills and the porcelain kilns at Jingdezhen; the Communist base areas that became the Jiangxi Soviet were forming here in 1930',
    wiki: 'https://en.wikipedia.org/wiki/Jiangxi'
  },
  Jilin: {
    en: 'Jílín (Kirin) — soybeans and forest, and the South Manchuria Railway\'s northern reach',
    wiki: 'https://en.wikipedia.org/wiki/Jilin'
  },
  Liaoning: {
    en: 'Liáoníng — renamed from Fengtien in 1929 and called Fengtien again under Manchukuo; the industrial heart of the north-east, with the coal at Fushun and the steel at Anshan',
    wiki: 'https://en.wikipedia.org/wiki/Liaoning'
  },
  Ningxia: {
    en: 'Níngxià (Ninghsia) — the Yellow River\'s irrigated bend and desert either side of it, made a province in 1928 and run by Ma Hongkui',
    wiki: 'https://en.wikipedia.org/wiki/Ningxia'
  },
  Qinghai: {
    en: 'Qīnghǎi (Tsinghai) — high pasture round the salt lake of Kokonor, Tibetan and Mongol herders, made a province in 1928 and run by Ma Bufang',
    wiki: 'https://en.wikipedia.org/wiki/Qinghai'
  },
  Shaanxi: {
    en: 'Shǎnxī (Shensi) — the loess plateau and the Wei valley below it, wheat and cotton; the Communists reached northern Shaanxi at the end of the Long March in 1935',
    wiki: 'https://en.wikipedia.org/wiki/Shaanxi'
  },
  Shandong: {
    en: 'Shāndōng (Shantung) — wheat and groundnuts on a peninsula between two seas, Confucius\'s Qufu, and the German legacy at Qingdao. Han Fuju governed it from 1930',
    wiki: 'https://en.wikipedia.org/wiki/Shandong'
  },
  Shanxi: {
    en: 'Shānxī (Shansi) — the richest coalfield in China under a loess plateau, and Yan Xishan\'s province: he ruled it from 1911 to 1949, ran it with its own railway gauge and its own currency, and led the coalition that fought Chiang Kai-shek in the Central Plains War of 1930',
    wiki: 'https://en.wikipedia.org/wiki/Shanxi'
  },
  Sichuan: {
    en: 'Sìchuān (Szechwan) — the Red Basin behind its gorges, rice, salt from the wells at Zigong and a great deal of opium; divided in 1930 among garrison-area warlords, Liu Xiang and Liu Wenhui the largest, and not brought under Nanjing until 1935',
    wiki: 'https://en.wikipedia.org/wiki/Sichuan'
  },
  Suiyuan: {
    en: 'Suíyuǎn (Suiyuan) — the Yellow River\'s northern bend, irrigated at Hetao, with Baotou the wool railhead of the steppe. Made a province in 1928; the eastern half is what Mengchiang held',
    wiki: 'https://en.wikipedia.org/wiki/Suiyuan'
  },
  SuiyuanWest: { en: 'Western Suíyuǎn — Wuyuan, Linhe and the Ordos, held by Fu Zuoyi throughout' },
  Xikang: {
    en: 'Xīkāng (Sikang) — eastern Kham, Tibetan in speech and religion, claimed by both Nanjing and Lhasa; a special administrative region until 1939, then a province, and abolished in 1955 between Sichuan and Tibet',
    wiki: 'https://en.wikipedia.org/wiki/Xikang'
  },
  Xinjiang: {
    en: 'Xīnjiāng (Sinkiang) — oases round the Taklamakan, cotton and livestock, and a trade that ran to the Soviet Union rather than to China; Jin Shuren governed in 1930, Sheng Shicai from 1933',
    wiki: 'https://en.wikipedia.org/wiki/Xinjiang'
  },
  Xizang: { en: 'Tibet', wiki: 'https://en.wikipedia.org/wiki/Tibet' },
  Yunnan: {
    en: 'Yúnnán — high plateau on the Burmese and Indochinese frontier, tin from Gejiu, copper and opium, and a French railway to Haiphong. Long Yun ruled it from 1927 to 1945 with little reference to Nanjing',
    wiki: 'https://en.wikipedia.org/wiki/Yunnan'
  },
  Zhejiang: {
    en: 'Zhèjiāng (Chekiang) — silk from the Hangzhou basin, tea, and a coast of fishing ports and islands',
    wiki: 'https://en.wikipedia.org/wiki/Zhejiang'
  },
  Nanumea: {
    en: 'Nanumea', wiki: 'https://en.wikipedia.org/wiki/Nanumea',
    note: 'An American airfield was built here in 1943, one of three in the Ellice from which the Gilberts were attacked.'
  },
  Nanumanga: {
    en: 'Nanumanga (Nanumaga)', wiki: 'https://en.wikipedia.org/wiki/Nanumanga',
    note: 'Never occupied by either side. A wartime American landing party is remembered chiefly for what it did to the reef.'
  },
  Niutao: {
    en: 'Niutao', wiki: 'https://en.wikipedia.org/wiki/Niutao',
    note: 'Never occupied. The Ellice were the nearest unoccupied ground to the Japanese perimeter.'
  },
  Nui: {
    en: 'Nui', wiki: 'https://en.wikipedia.org/wiki/Nui_(atoll)',
    note: 'Never occupied, and one of the Ellice atolls whose people speak a Gilbertese dialect rather than Tuvaluan — the boundary between the two groups runs through it.'
  },
  Vaitupu: {
    en: 'Vaitupu', wiki: 'https://en.wikipedia.org/wiki/Vaitupu',
    note: 'The most populous of the Ellice, and the site of the colony\'s secondary school.'
  },
  Nukufetau: {
    en: 'Nukufetau', wiki: 'https://en.wikipedia.org/wiki/Nukufetau',
    note: 'An American airfield from 1943, the second of the three built in the group.'
  },
  Funafuti: {
    en: 'Funafuti — the seat of the Ellice Islands',
    wiki: 'https://en.wikipedia.org/wiki/Funafuti'
  },
  Nukulaelae: {
    en: 'Nukulaelae', wiki: 'https://en.wikipedia.org/wiki/Nukulaelae',
    note: 'Never occupied. Two thirds of its people had been carried off by Peruvian slavers in 1863 and it never recovered the numbers.'
  },
  Goa: { en: 'Goa', wiki: 'https://en.wikipedia.org/wiki/Goa' },
  'Damão (Daman)': { en: 'Damão (Daman)', wiki: 'https://en.wikipedia.org/wiki/Daman,_India' },
  Diu: { en: 'Diu', wiki: 'https://en.wikipedia.org/wiki/Diu,_India' },
  'Dadrá (Dadra)': { en: 'Dadrá (Dadra)', wiki: 'https://en.wikipedia.org/wiki/Dadra' },
  'Nagar Aveli (Nagar Haveli)': { en: 'Nagar Aveli (Nagar Haveli)', wiki: 'https://en.wikipedia.org/wiki/Nagar_Haveli' },
  'Pondicherry (Puducherry)': { en: 'Pondicherry (Puducherry)', wiki: 'https://en.wikipedia.org/wiki/Pondicherry' },
  'Karikal (Karaikal)': { en: 'Karikal (Karaikal)', wiki: 'https://en.wikipedia.org/wiki/Karaikal' },
  'Yanaon (Yanam)': { en: 'Yanaon (Yanam)', wiki: 'https://en.wikipedia.org/wiki/Yanaon' },
  'Mahé (Mahe)': { en: 'Mahé (Mahe)', wiki: 'https://en.wikipedia.org/wiki/Mah%C3%A9' },
  'Chandernagore (Chandannagar)': { en: 'Chandernagore (Chandannagar)', wiki: 'https://en.wikipedia.org/wiki/Chandannagar' },
  Tonkin: { en: 'Tonkin (protectorate)', zh: '東京', wiki: 'https://en.wikipedia.org/wiki/Tonkin' },
  Annam: {
    en: 'Annam (protectorate)', zh: '安南',
    wiki: 'https://en.wikipedia.org/wiki/Annam_(French_protectorate)'
  },
  Cochinchina: { en: 'Cochinchina (colony)', zh: '交趾支那', wiki: 'https://en.wikipedia.org/wiki/Cochinchina' },
  Cambodia: { en: 'Cambodia (protectorate)', zh: '柬埔寨', wiki: 'https://en.wikipedia.org/wiki/Cambodia' },
  Laos: { en: 'Laos (protectorate)', zh: '寮國', wiki: 'https://en.wikipedia.org/wiki/Laos' },
  Hokkaido: { en: 'Hokkaidō-chō', ja: '北海道庁 (Hokkaidō-chō)', zh: '北海道廳' },
  Aomori: {
    en: 'Aomori-ken', ja: '青森県 (Aomori)', zh: '青森縣',
    wiki: 'https://en.wikipedia.org/wiki/Aomori_Prefecture'
  },
  Iwate: {
    en: 'Iwate-ken', ja: '岩手県 (Iwate)', zh: '岩手縣',
    wiki: 'https://en.wikipedia.org/wiki/Iwate_Prefecture'
  },
  Miyagi: {
    en: 'Miyagi-ken', ja: '宮城県 (Miyagi)', zh: '宮城縣',
    wiki: 'https://en.wikipedia.org/wiki/Miyagi_Prefecture'
  },
  Akita: { en: 'Akita-ken', ja: '秋田県 (Akita)', zh: '秋田縣' },
  Yamagata: {
    en: 'Yamagata-ken', ja: '山形県 (Yamagata)', zh: '山形縣',
    wiki: 'https://en.wikipedia.org/wiki/Yamagata_Prefecture'
  },
  Fukushima: {
    en: 'Fukushima-ken', ja: '福島県 (Fukushima)', zh: '福島縣',
    wiki: 'https://en.wikipedia.org/wiki/Fukushima_Prefecture'
  },
  Ibaraki: {
    en: 'Ibaraki-ken', ja: '茨城県 (Ibaraki)', zh: '茨城縣',
    wiki: 'https://en.wikipedia.org/wiki/Ibaraki_Prefecture'
  },
  Tochigi: {
    en: 'Tochigi-ken', ja: '栃木県 (Tochigi)', zh: '栃木縣',
    wiki: 'https://en.wikipedia.org/wiki/Tochigi_Prefecture'
  },
  Gunma: {
    en: 'Gunma-ken', ja: '群馬県 (Gunma)', zh: '群馬縣',
    wiki: 'https://en.wikipedia.org/wiki/Gunma_Prefecture'
  },
  Saitama: { en: 'Saitama-ken', ja: '埼玉県 (Saitama)', zh: '埼玉縣' },
  Chiba: {
    en: 'Chiba-ken', ja: '千葉県 (Chiba)', zh: '千葉縣',
    wiki: 'https://en.wikipedia.org/wiki/Chiba_Prefecture'
  },
  Tokyo: {
    en: 'Tōkyō-fu', ja: '東京府 (Tōkyō)', zh: '東京府',
    wiki: 'https://en.wikipedia.org/wiki/Tokyo_Prefecture_(1868%E2%80%931943)'
  },
  Kanagawa: {
    en: 'Kanagawa-ken', ja: '神奈川県 (Kanagawa)', zh: '神奈川縣',
    wiki: 'https://en.wikipedia.org/wiki/Kanagawa_Prefecture'
  },
  Niigata: {
    en: 'Niigata-ken', ja: '新潟県 (Niigata)', zh: '新潟縣',
    wiki: 'https://en.wikipedia.org/wiki/Niigata_Prefecture'
  },
  Toyama: {
    en: 'Toyama-ken', ja: '富山県 (Toyama)', zh: '富山縣',
    wiki: 'https://en.wikipedia.org/wiki/Toyama_Prefecture'
  },
  Ishikawa: {
    en: 'Ishikawa-ken', ja: '石川県 (Ishikawa)', zh: '石川縣',
    wiki: 'https://en.wikipedia.org/wiki/Ishikawa_Prefecture'
  },
  Fukui: {
    en: 'Fukui-ken', ja: '福井県 (Fukui)', zh: '福井縣',
    wiki: 'https://en.wikipedia.org/wiki/Fukui_Prefecture'
  },
  Yamanashi: {
    en: 'Yamanashi-ken', ja: '山梨県 (Yamanashi)', zh: '山梨縣',
    wiki: 'https://en.wikipedia.org/wiki/Yamanashi_Prefecture'
  },
  Nagano: {
    en: 'Nagano-ken', ja: '長野県 (Nagano)', zh: '長野縣',
    wiki: 'https://en.wikipedia.org/wiki/Nagano_Prefecture'
  },
  Gifu: {
    en: 'Gifu-ken', ja: '岐阜県 (Gifu)', zh: '岐阜縣',
    wiki: 'https://en.wikipedia.org/wiki/Gifu_Prefecture'
  },
  Shizuoka: {
    en: 'Shizuoka-ken', ja: '静岡県 (Shizuoka)', zh: '靜岡縣',
    wiki: 'https://en.wikipedia.org/wiki/Shizuoka_Prefecture'
  },
  Aichi: {
    en: 'Aichi-ken', ja: '愛知県 (Aichi)', zh: '愛知縣',
    wiki: 'https://en.wikipedia.org/wiki/Aichi_Prefecture'
  },
  Mie: {
    en: 'Mie-ken', ja: '三重県 (Mie)', zh: '三重縣',
    wiki: 'https://en.wikipedia.org/wiki/Mie_Prefecture'
  },
  Shiga: {
    en: 'Shiga-ken', ja: '滋賀県 (Shiga)', zh: '滋賀縣',
    wiki: 'https://en.wikipedia.org/wiki/Shiga_Prefecture'
  },
  Kyoto: {
    en: 'Kyōto-fu', ja: '京都府 (Kyōto)', zh: '京都府',
    wiki: 'https://en.wikipedia.org/wiki/Kyoto_Prefecture'
  },
  Osaka: {
    en: 'Ōsaka-fu', ja: '大阪府 (Ōsaka)', zh: '大阪府',
    wiki: 'https://en.wikipedia.org/wiki/Osaka_Prefecture'
  },
  Hyogo: {
    en: 'Hyōgo-ken', ja: '兵庫県 (Hyōgo)', zh: '兵庫縣',
    wiki: 'https://en.wikipedia.org/wiki/Hy%C5%8Dgo_Prefecture'
  },
  Nara: {
    en: 'Nara-ken', ja: '奈良県 (Nara)', zh: '奈良縣',
    wiki: 'https://en.wikipedia.org/wiki/Nara_Prefecture'
  },
  Wakayama: {
    en: 'Wakayama-ken', ja: '和歌山県 (Wakayama)', zh: '和歌山縣',
    wiki: 'https://en.wikipedia.org/wiki/Wakayama_Prefecture'
  },
  Tottori: {
    en: 'Tottori-ken', ja: '鳥取県 (Tottori)', zh: '鳥取縣',
    wiki: 'https://en.wikipedia.org/wiki/Tottori_Prefecture'
  },
  Shimane: {
    en: 'Shimane-ken', ja: '島根県 (Shimane)', zh: '島根縣',
    wiki: 'https://en.wikipedia.org/wiki/Shimane_Prefecture'
  },
  Okayama: {
    en: 'Okayama-ken', ja: '岡山県 (Okayama)', zh: '岡山縣',
    wiki: 'https://en.wikipedia.org/wiki/Okayama_Prefecture'
  },
  Hiroshima: {
    en: 'Hiroshima-ken', ja: '広島県 (Hiroshima)', zh: '廣島縣',
    wiki: 'https://en.wikipedia.org/wiki/Hiroshima_Prefecture'
  },
  Yamaguchi: {
    en: 'Yamaguchi-ken', ja: '山口県 (Yamaguchi)', zh: '山口縣',
    wiki: 'https://en.wikipedia.org/wiki/Yamaguchi_Prefecture'
  },
  Tokushima: {
    en: 'Tokushima-ken', ja: '徳島県 (Tokushima)', zh: '德島縣',
    wiki: 'https://en.wikipedia.org/wiki/Tokushima_Prefecture'
  },
  Kagawa: { en: 'Kagawa-ken', ja: '香川県 (Kagawa)', zh: '香川縣' },
  Ehime: {
    en: 'Ehime-ken', ja: '愛媛県 (Ehime)', zh: '愛媛縣',
    wiki: 'https://en.wikipedia.org/wiki/Ehime_Prefecture'
  },
  Kochi: {
    en: 'Kōchi-ken', ja: '高知県 (Kōchi)', zh: '高知縣',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dchi_Prefecture'
  },
  Fukuoka: {
    en: 'Fukuoka-ken', ja: '福岡県 (Fukuoka)', zh: '福岡縣',
    wiki: 'https://en.wikipedia.org/wiki/Fukuoka_Prefecture'
  },
  Saga: { en: 'Saga-ken', ja: '佐賀県 (Saga)', zh: '佐賀縣' },
  Nagasaki: {
    en: 'Nagasaki-ken', ja: '長崎県 (Nagasaki)', zh: '長崎縣',
    wiki: 'https://en.wikipedia.org/wiki/Nagasaki_Prefecture'
  },
  Kumamoto: {
    en: 'Kumamoto-ken', ja: '熊本県 (Kumamoto)', zh: '熊本縣',
    wiki: 'https://en.wikipedia.org/wiki/Kumamoto_Prefecture'
  },
  Oita: {
    en: 'Ōita-ken', ja: '大分県 (Ōita)', zh: '大分縣',
    wiki: 'https://en.wikipedia.org/wiki/%C5%8Cita_Prefecture'
  },
  Miyazaki: {
    en: 'Miyazaki-ken', ja: '宮崎県 (Miyazaki)', zh: '宮崎縣',
    wiki: 'https://en.wikipedia.org/wiki/Miyazaki_Prefecture'
  },
  Kagoshima: {
    en: 'Kagoshima-ken', ja: '鹿児島県 (Kagoshima)', zh: '鹿兒島縣',
    wiki: 'https://en.wikipedia.org/wiki/Kagoshima_Prefecture'
  },
  Okinawa: {
    en: 'Okinawa-ken', ja: '沖縄県 (Okinawa)', zh: '沖繩縣',
    wiki: 'https://en.wikipedia.org/wiki/Okinawa_Prefecture'
  },
  Ulleungdo: {
    en: 'Ullŭngdo (Utsuryō-tō) — part of Chōsen', ja: '鬱陵島 (Utsuryō-tō)', ko: '울릉도 (Ullŭngdo)',
    wiki: 'https://en.wikipedia.org/wiki/Ulleungdo',
    note: 'The largest island off the east coast of Korea, and the base from which Korean and Japanese fishermen worked the Liancourt Rocks 87 km to the south-east.'
  },
  Jukdo: { en: 'Chukto (Chikuyo) — off Ullŭngdo', ja: '竹嶼 (Chikuyo)', ko: '죽도 (Chukto)' },
  Gwaneumdo: { en: 'Kwanŭmdo (Kannondō) — off Ullŭngdo', ja: '觀音島 (Kannondō)', ko: '관음도 (Kwanŭmdo)' },
  'Seodo, the west islet of the Liancourt Rocks': {
    en: 'Sŏdo (Nishijima) — the west islet of the Liancourt Rocks', ja: '西島 (Nishijima)',
    ko: '서도 (Sŏdo)', wiki: 'https://en.wikipedia.org/wiki/Liancourt_Rocks',
    note: 'Dokdo to Korea, Takeshima to Japan, the Liancourt Rocks to everyone else. Japan incorporated them into Shimane prefecture in 1905, five years before it annexed Korea, so on both of this map’s dates they were inside the same empire as Ullŭngdo and nothing turned on the difference. South Korea has held them with a police detachment since 1954; Japan claims them still.'
  },
  'Dongdo, the east islet of the Liancourt Rocks': {
    en: 'Tongdo (Higashijima) — the east islet of the Liancourt Rocks', ja: '東島 (Higashijima)',
    ko: '동도 (Tongdo)',
    note: 'Dokdo to Korea, Takeshima to Japan, the Liancourt Rocks to everyone else. Japan incorporated them into Shimane prefecture in 1905, five years before it annexed Korea, so on both of this map’s dates they were inside the same empire as Ullŭngdo and nothing turned on the difference. South Korea has held them with a police detachment since 1954; Japan claims them still.'
  },
  Keiki: {
    en: 'Keiki-dō (Kyŏnggi-do)', ja: '京畿道 (Keiki-dō)', zh: '京畿道', ko: '경기도 (Kyŏnggi-do)',
    wiki: 'https://en.wikipedia.org/wiki/Keiki_Province'
  },
  Kogen: {
    en: 'Kōgen-dō (Kangwŏn-do)', ja: '江原道 (Kōgen-dō)', zh: '江原道', ko: '강원도 (Kangwŏn-do)',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dgen_Province'
  },
  Chuseihoku: {
    en: 'Chūseihoku-dō (Ch’ungch’ŏngbuk-to)', ja: '忠清北道 (Chūseihoku-dō)', zh: '忠清北道',
    ko: '충청북도 (Ch’ungch’ŏngbuk-to)',
    wiki: 'https://en.wikipedia.org/wiki/Ch%C5%ABseihoku_Province'
  },
  Chuseinan: {
    en: 'Chūseinan-dō (Ch’ungch’ŏngnam-do)', ja: '忠清南道 (Chūseinan-dō)', zh: '忠清南道',
    ko: '충청남도 (Ch’ungch’ŏngnam-do)',
    wiki: 'https://en.wikipedia.org/wiki/Ch%C5%ABseinan_Province'
  },
  Zenrahoku: {
    en: 'Zenrahoku-dō (Chŏllabuk-to)', ja: '全羅北道 (Zenrahoku-dō)', zh: '全羅北道',
    ko: '전라북도 (Chŏllabuk-to)', wiki: 'https://en.wikipedia.org/wiki/Zenrahoku_Province'
  },
  Zenranan: {
    en: 'Zenranan-dō (Chŏllanam-do)', ja: '全羅南道 (Zenranan-dō)', zh: '全羅南道',
    ko: '전라남도 (Chŏllanam-do)', wiki: 'https://en.wikipedia.org/wiki/Zenranan_Province'
  },
  Keishohoku: {
    en: 'Keishōhoku-dō (Kyŏngsangbuk-to)', ja: '慶尚北道 (Keishōhoku-dō)', zh: '慶尚北道',
    ko: '경상북도 (Kyŏngsangbuk-to)', wiki: 'https://en.wikipedia.org/wiki/Keish%C5%8Dhoku_Province'
  },
  Keishonan: {
    en: 'Keishōnan-dō (Kyŏngsangnam-do)', ja: '慶尚南道 (Keishōnan-dō)', zh: '慶尚南道',
    ko: '경상남도 (Kyŏngsangnam-do)', wiki: 'https://en.wikipedia.org/wiki/Keish%C5%8Dnan_Province'
  },
  Kokai: {
    en: 'Kōkai-dō (Hwanghae-do)', ja: '黄海道 (Kōkai-dō)', zh: '黃海道', ko: '황해도 (Hwanghae-do)',
    wiki: 'https://en.wikipedia.org/wiki/K%C5%8Dkai_Province'
  },
  Heianhoku: {
    en: 'Heianhoku-dō (P’yŏnganbuk-to)', ja: '平安北道 (Heianhoku-dō)', zh: '平安北道',
    ko: '평안북도 (P’yŏnganbuk-to)', wiki: 'https://en.wikipedia.org/wiki/Heianhoku_Province'
  },
  Heiannan: {
    en: 'Heiannan-dō (P’yŏngannam-do)', ja: '平安南道 (Heiannan-dō)', zh: '平安南道',
    ko: '평안남도 (P’yŏngannam-do)'
  },
  Kankyohoku: {
    en: 'Kankyōhoku-dō (Hamgyŏngbuk-to)', ja: '咸鏡北道 (Kankyōhoku-dō)', zh: '咸鏡北道',
    ko: '함경북도 (Hamgyŏngbuk-to)', wiki: 'https://en.wikipedia.org/wiki/Kanky%C5%8Dhoku_Province'
  },
  Kankyonan: {
    en: 'Kankyōnan-dō (Hamgyŏngnam-do)', ja: '咸鏡南道 (Kankyōnan-dō)', zh: '咸鏡南道',
    ko: '함경남도 (Hamgyŏngnam-do)', wiki: 'https://en.wikipedia.org/wiki/Kanky%C5%8Dnan_Province'
  },
  'Shumshu (Shimushu)': {
    en: 'Shumshu (Shimushu)', ja: '占守島 (Shumushu-tō)', zh: '占守島',
    wiki: 'https://en.wikipedia.org/wiki/Shumshu',
    note: 'The northernmost island, heavily garrisoned and facing Kamchatka. Soviet troops landed here on 18 August 1945, three days after the surrender, in the last battle of the war.'
  },
  'Alaid (Araito)': {
    en: 'Alaid (Araito)', ja: '阿頼度島 (Araito-tō)', zh: '阿賴度島',
    wiki: 'https://en.wikipedia.org/wiki/Atlasov_Island',
    note: 'A volcanic cone off Shumshu, uninhabited but for a fishery station.'
  },
  'Paramushir (Paramushiro)': {
    en: 'Paramushir (Paramushiro)', ja: '幌筵島 (Paramushiro-tō)', zh: '幌筵島',
    wiki: 'https://en.wikipedia.org/wiki/Paramushir',
    note: 'The naval and air base from which the Aleutian operation was mounted, and the target of American bombers flying from Attu after 1943.'
  },
  'Makanrushi (Makanru)': {
    en: 'Makanrushi (Makanru)', ja: '磨勘留島 (Makanru-tō)', zh: '磨勘留島',
    wiki: 'https://en.wikipedia.org/wiki/Makanrushi',
    note: 'Uninhabited, and used only by fishing crews in season.'
  },
  Onekotan: {
    en: 'Onekotan', ja: '温禰古丹島 (Onnekotan-tō)', zh: '溫禰古丹島',
    wiki: 'https://en.wikipedia.org/wiki/Onekotan',
    note: 'Uninhabited but for its wartime garrison, and two great calderas, one holding a lake with an island in it.'
  },
  'Kharimkotan (Harimukotan)': {
    en: 'Kharimkotan (Harimukotan)', ja: '春牟古丹島 (Harimukotan-tō)', zh: '春牟古丹島',
    wiki: 'https://en.wikipedia.org/wiki/Harimkotan',
    note: 'Uninhabited; its 1933 eruption swept the shore.'
  },
  Ekarma: {
    en: 'Ekarma', ja: '越渇磨島 (Ekaruma-tō)', zh: '越渴磨島',
    wiki: 'https://en.wikipedia.org/wiki/Ekarma', note: 'Uninhabited.'
  },
  'Shiashkotan (Shasukotan)': {
    en: 'Shiashkotan (Shasukotan)', ja: '捨子古丹島 (Shasukotan-tō)', zh: '捨子古丹島',
    wiki: 'https://en.wikipedia.org/wiki/Shiashkotan',
    note: 'A small settlement and a fox farm, abandoned when the islands changed hands.'
  },
  'Matua (Matsuwa)': {
    en: 'Matua (Matsuwa)', ja: '松輪島 (Matsuwa-tō)', zh: '松輪島',
    wiki: 'https://en.wikipedia.org/wiki/Matua_(island)',
    note: 'An airfield in the middle of the chain, bombed from the Aleutians and bypassed.'
  },
  'Rasshua (Rasuwa)': { en: 'Rasshua (Rasuwa)', ja: '羅処和島 (Rasuwa-tō)', zh: '羅處和島', note: 'Uninhabited.' },
  'Ketoy (Ketoi)': {
    en: 'Ketoy (Ketoi)', ja: '計吐夷島 (Ketoi-tō)', zh: '計吐夷島',
    wiki: 'https://en.wikipedia.org/wiki/Ketoy', note: 'Uninhabited.'
  },
  'Simushir (Shimushiru)': {
    en: 'Simushir (Shimushiru)', ja: '新知島 (Shimushiru-tō)', zh: '新知島',
    wiki: 'https://en.wikipedia.org/wiki/Simushir',
    note: 'A garrison, and a flooded crater at Broughton Bay that makes one of the few sheltered anchorages in the chain.'
  },
  'Chirpoy (Chirihoi)': {
    en: 'Chirpoy (Chirihoi)', ja: '知理保以島 (Chirihoi-tō)', zh: '知理保以島',
    wiki: 'https://en.wikipedia.org/wiki/Chyornye_Bratya', note: 'Uninhabited.'
  },
  'Urup (Uruppu)': {
    en: 'Urup (Uruppu)', ja: '得撫島 (Uruppu-tō)', zh: '得撫島',
    wiki: 'https://en.wikipedia.org/wiki/Urup',
    note: 'Sea otter hunting ground, and Russian until the exchange of 1875.'
  },
  'Etorofu (Iturup)': {
    en: 'Etorofu (Iturup) — the Pearl Harbor fleet sailed from Hitokappu Bay',
    ja: '択捉島 (Etorofu-tō)', zh: '擇捉島', wiki: 'https://en.wikipedia.org/wiki/Iturup'
  },
  'Kunashiri (Kunashir)': {
    en: 'Kunashiri (Kunashir)', ja: '国後島 (Kunashiri-tō)', zh: '國後島',
    wiki: 'https://en.wikipedia.org/wiki/Kunashir',
    note: 'The southernmost large island, Japanese-settled and taken by Soviet troops on 1 September 1945. Japan claims it still.'
  },
  Shikotan: {
    en: 'Shikotan', ja: '色丹島 (Shikotan-tō)', zh: '色丹島',
    wiki: 'https://en.wikipedia.org/wiki/Shikotan',
    note: 'Taken by Soviet troops on 1 September 1945; its Japanese inhabitants were deported in 1947 and Japan claims it still.'
  },
  'the Habomai Islands': {
    en: 'The Habomai Islands', ja: '歯舞群島 (Habomai Guntō)', zh: '齒舞群島',
    note: 'A scatter of islets in sight of Hokkaidō, taken between 1 and 5 September 1945 — after the surrender — and claimed by Japan ever since.'
  },
  Sarawak: { en: 'Sarawak', wiki: 'https://en.wikipedia.org/wiki/Sarawak' },
  NorthBorneo: { en: 'North Borneo', wiki: 'https://en.wikipedia.org/wiki/North_Borneo' },
  Labuan: {
    en: 'Labuan — a Straits Settlement from 1907 until 1946, not company territory',
    wiki: 'https://en.wikipedia.org/wiki/Labuan'
  },
  Brunei: { en: 'Brunei', wiki: 'https://en.wikipedia.org/wiki/Brunei' },
  Johor: { en: 'Johore — Unfederated Malay State' },
  Pahang: { en: 'Pahang — Federated Malay State', wiki: 'https://en.wikipedia.org/wiki/Pahang' },
  Perak: { en: 'Perak — Federated Malay State', wiki: 'https://en.wikipedia.org/wiki/Perak' },
  Selangor: { en: 'Selangor — Federated Malay State', wiki: 'https://en.wikipedia.org/wiki/Selangor' },
  NegeriSembilan: {
    en: 'Negri Sembilan — Federated Malay State',
    wiki: 'https://en.wikipedia.org/wiki/Negeri_Sembilan'
  },
  Malacca: {
    en: 'Malacca — Straits Settlement, a Crown colony ruled from Singapore',
    wiki: 'https://en.wikipedia.org/wiki/Malacca'
  },
  Singapore: {
    en: 'Singapore — Straits Settlement, and the capital of the colony',
    wiki: 'https://en.wikipedia.org/wiki/Singapore'
  },
  Penang: {
    en: 'Penang — Straits Settlement, with Province Wellesley on the mainland',
    wiki: 'https://en.wikipedia.org/wiki/Penang'
  },
  Dindings: { en: 'The Dindings — Straits Settlement until 1935' },
  'Christmas Island': {
    en: 'Christmas Island — annexed 1888, attached to the Straits Settlements in 1900 and run from Singapore, worked for phosphate',
    ja: 'クリスマス島 (Kurisumasu-tō)', wiki: 'https://en.wikipedia.org/wiki/Christmas_Island'
  },
  Kedah: { en: 'Kedah — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Kedah' },
  Perlis: { en: 'Perlis — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Perlis' },
  Kelantan: { en: 'Kelantan — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Kelantan' },
  Terengganu: {
    en: 'Trengganu — Unfederated Malay State', wiki: 'https://en.wikipedia.org/wiki/Terengganu'
  },
  'Hsing An Peh': { en: 'Xīng’ānběi (Hsingan North)', ja: '興安北省 (Kōan-hoku)', zh: '興安北省' },
  'Hsing An Tung': { en: 'Xīng’āndōng (Hsingan East)', ja: '興安東省 (Kōan-tō)', zh: '興安東省' },
  'Hsing An Si': { en: 'Xīng’ānxī (Hsingan West)', ja: '興安西省 (Kōan-sei)', zh: '興安西省' },
  'Hsing An Nan': { en: 'Xīng’ānnán (Hsingan South)', ja: '興安南省 (Kōan-nan)', zh: '興安南省' },
  Heiho: {
    en: 'Hēihé (Heiho)', ja: '黒河省 (Kokka)', zh: '黑河省',
    wiki: 'https://en.wikipedia.org/wiki/Heihe'
  },
  Lungkiang: {
    en: 'Lóngjiāng (Lungkiang)', ja: '龍江省 (Ryūkō)', zh: '龍江省',
    wiki: 'https://en.wikipedia.org/wiki/Heilongjiang'
  },
  Sankiang: { en: 'Sānjiāng (Sankiang)', ja: '三江省 (Sankō)', zh: '三江省' },
  'Pin Kiang': {
    en: 'Bīnjiāng (Pinkiang)', ja: '濱江省 (Hinkō)', zh: '濱江省',
    wiki: 'https://en.wikipedia.org/wiki/Binjiang,_Hangzhou'
  },
  'Chien Tao': {
    en: 'Jiāndǎo (Chientao)', ja: '間島省 (Kantō)', zh: '間島省',
    wiki: 'https://en.wikipedia.org/wiki/Jiandao'
  },
  'Feng Tien': {
    en: 'Fèngtiān (Fengtien)', ja: '奉天省 (Hōten)', zh: '奉天省',
    wiki: 'https://en.wikipedia.org/wiki/Liaoning'
  },
  'An Tung': {
    en: 'Āndōng (Antung)', ja: '安東省 (Antō)', zh: '安東省',
    wiki: 'https://en.wikipedia.org/wiki/Andong'
  },
  Kirin: {
    en: 'Jílín (Kirin)', ja: '吉林省 (Kirin)', zh: '吉林省',
    wiki: 'https://en.wikipedia.org/wiki/Jilin'
  },
  Chinchow: {
    en: 'Jǐnzhōu (Chinchow)', ja: '錦州省 (Kinshū)', zh: '錦州省',
    wiki: 'https://en.wikipedia.org/wiki/Jinzhou'
  },
  'Je Hol': {
    en: 'Rèhé (Jehol)', ja: '熱河省 (Nekka)', zh: '熱河省',
    note: 'A province of the Republic until February 1933, when the Kwantung Army took it and attached it to Manchukuo.'
  },
  Marianas: {
    en: 'Mariana Islands', ja: 'マリアナ諸島 (Mariana Shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Mariana_Islands',
    note: 'The chain Japan took from Germany in 1914, less Guam. Its fall in the summer of 1944 put Japan within B-29 range and brought down the Tōjō cabinet.'
  },
  Palau: {
    en: 'Palau', ja: 'パラオ (Parao)', wiki: 'https://en.wikipedia.org/wiki/Palau',
    note: 'The seat of the South Seas Bureau at Koror from 1922, and the westernmost of the mandate. Peleliu and Angaur were taken in 1944; the rest was bypassed.'
  },
  Yap: {
    en: 'Yap', ja: 'ヤップ (Yappu)', wiki: 'https://en.wikipedia.org/wiki/Yap',
    note: 'A cable and radio station, and the subject of a long dispute between Japan and the United States in the 1920s. Bypassed and bombed.'
  },
  Chuuk: {
    en: 'Truk (Chuuk)', ja: 'トラック (Torakku)',
    note: 'Truk lagoon, the Combined Fleet\'s central Pacific anchorage — the "Gibraltar of the Pacific" until the carrier raids of February 1944 showed it was nothing of the kind.'
  },
  Pohnpei: {
    en: 'Ponape (Pohnpei)', ja: 'ポナペ (Ponape)', wiki: 'https://en.wikipedia.org/wiki/Pohnpei',
    note: 'Ponape, the wettest and most fertile of the Carolines, with a Japanese agricultural station. Bypassed and bombed.'
  },
  Kosrae: {
    en: 'Kusaie (Kosrae)', ja: 'クサイエ (Kusaie)', wiki: 'https://en.wikipedia.org/wiki/Kosrae',
    note: 'The easternmost of the Carolines, with the basalt ruins of Lelu on its shore. Bypassed entirely and never assaulted.'
  },
  Marshalls: {
    en: 'Marshall Islands', ja: 'マーシャル諸島 (Māsharu Shotō)',
    wiki: 'https://en.wikipedia.org/wiki/Marshall_Islands',
    note: 'The outermost ring of the mandate, and the first of it to go: Kwajalein and Majuro fell in January 1944 and Enewetak in February.'
  },
  Saipan: {
    en: 'Saipan', ja: 'サイパン (Saipan)', zh: '塞班',
    note: 'Sugar, and the largest Japanese civilian population in the mandate. The Americans landed on 15 June 1944 and took it by 9 July; hundreds of civilians killed themselves at Marpi Point rather than surrender.'
  },
  Tinian: {
    en: 'Tinian', ja: 'テニアン (Tenian)', zh: '天寧',
    wiki: 'https://en.wikipedia.org/wiki/Tinian,_Northern_Mariana_Islands',
    note: 'Taken between 24 July and 1 August 1944. Its airfields became the busiest in the world, and the atomic missions to Hiroshima and Nagasaki flew from them.'
  },
  Rota: {
    en: 'Rota', ja: 'ロタ (Rota)', zh: '羅塔',
    note: 'Between Saipan and Guam, and never assaulted: its garrison was bypassed and held out until the surrender in 1945.'
  },
  Pagan: {
    en: 'Pagan', ja: 'パガン (Pagan)', zh: '帕甘',
    wiki: 'https://en.wikipedia.org/wiki/Pagan_(island)',
    note: 'An airstrip in the northern Marianas, bombed and then left behind; the garrison was still there in 1945.'
  },
  Agrihan: {
    en: 'Agrihan', ja: 'アグリハン (Agurihan)', zh: '阿格里漢',
    wiki: 'https://en.wikipedia.org/wiki/Agrihan',
    note: 'A volcano in the northern Marianas with a few dozen people on it, bypassed entirely.'
  },
  Anatahan: {
    en: 'Anatahan', ja: 'アナタハン (Anatahan)', zh: '阿納塔漢',
    wiki: 'https://en.wikipedia.org/wiki/Anatahan',
    note: 'Bypassed and forgotten. Some of its garrison refused to believe the war was over and did not give themselves up until June 1951.'
  },
  Babeldaob: {
    en: 'Babeldaob (Palau)', ja: 'バベルダオブ (Baberudaobu)', zh: '巴貝爾道布',
    wiki: 'https://en.wikipedia.org/wiki/Babeldaob',
    note: 'The main island of Palau. After Peleliu the Americans left it alone, and its garrison of some twenty-five thousand was starving by 1945.'
  },
  Peleliu: {
    en: 'Peleliu', ja: 'ペリリュー (Peririyū)', zh: '貝里琉',
    wiki: 'https://en.wikipedia.org/wiki/Peleliu',
    note: 'Landed on 15 September 1944 in an operation expected to take four days; it took over two months and introduced the deep cave defence used again on Iwo Jima and Okinawa.'
  },
  Angaur: {
    en: 'Angaur', zh: '安加爾', wiki: 'https://en.wikipedia.org/wiki/Angaur',
    note: 'Phosphate, worked since the German period. Taken between 17 September and 22 October 1944, alongside Peleliu.'
  },
  Weno: {
    en: 'Moen (Weno), Truk', ja: '春島 (Harushima)', zh: '春島',
    wiki: 'https://en.wikipedia.org/wiki/Weno',
    note: 'Moen, the main island of Truk and the seat of the anchorage. Operation Hailstone wrecked the fleet base here on 17–18 February 1944, after which Truk was bypassed and left to rot.'
  },
  Kwajalein: {
    en: 'Kwajalein', zh: '瓜加林', wiki: 'https://en.wikipedia.org/wiki/Kwajalein_Atoll',
    note: 'Taken between 31 January and 3 February 1944, with Majuro — the first assault on territory Japan had held since before the war, and the breach of the outer perimeter.'
  },
  Majuro: {
    en: 'Majuro', ja: 'マジュロ (Majuro)', zh: '馬久羅', wiki: 'https://en.wikipedia.org/wiki/Majuro',
    note: 'Taken without a fight on 31 January 1944 and turned into the fleet anchorage from which the drive across the central Pacific was mounted.'
  },
  Jaluit: {
    en: 'Jaluit', ja: 'ヤルート (Yarūto)', zh: '賈盧伊特',
    note: 'The administrative centre of the Marshalls under both the German and the Japanese administrations. Bypassed in 1944, bombed, and starved to the surrender.'
  },
  Wotje: {
    en: 'Wotje', zh: '沃杰', wiki: 'https://en.wikipedia.org/wiki/Wotje_Atoll',
    note: 'An air base bypassed in 1944 and bombed for the rest of the war; its garrison was never assaulted.'
  },
  Enewetak: {
    en: 'Enewetak', zh: '埃內韋塔克', wiki: 'https://en.wikipedia.org/wiki/Enewetak_Atoll',
    note: 'Taken between 17 and 23 February 1944, which carried the Americans to the western edge of the Marshalls.'
  },
  Bikini: {
    en: 'Bikini', zh: '比基尼', wiki: 'https://en.wikipedia.org/wiki/Bikini_Atoll',
    note: 'Never fought over. Its people were moved off in 1946 for the American nuclear tests and have never been able to return.'
  },
  Ebon: {
    en: 'Ebon', ja: 'エボン (Ebon)', zh: '埃邦', wiki: 'https://en.wikipedia.org/wiki/Ebon_Atoll',
    note: 'The southernmost of the Marshalls, and the first of them to be reached by missionaries. Bypassed in the war.'
  },
  'The Mongol leagues': { en: 'The Mongol leagues', ja: '蒙古聯盟 (Mōko renmei)', zh: '蒙古各盟' },
  'North Shansi (Jinbei) Administration': { en: 'Jìnběi — the North Shansi Administration', ja: '晉北政廳 (Shinpoku seichō)', zh: '晉北政廳' },
  'South Chahar (Chanan) Administration': { en: 'Chánán — the South Chahar Administration', ja: '察南政廳 (Satsunan seichō)', zh: '察南政廳' },
  Sumatra: {
    en: 'Sumatra', ja: 'スマトラ (Sumatora)', wiki: 'https://en.wikipedia.org/wiki/Sumatra',
    note: 'Rubber, tobacco and above all the oil of Palembang, which was taken by parachute assault on 14 February 1942 before the refineries could be destroyed.'
  },
  Java: {
    en: 'Java', ja: 'ジャワ (Jawa)',
    note: 'The centre of the colony and of its population: two thirds of the Indies lived here. The Dutch surrendered on 8 March 1942, and the Japanese levied the rōmusha labour drafts from it.'
  },
  Madura: {
    en: 'Madura', ja: 'マドゥラ (Madura)', wiki: 'https://en.wikipedia.org/wiki/Madura',
    note: 'Salt from the pans along its south coast, cattle, and two courts of its own under the Dutch — poor, dry and densely peopled.'
  },
  Borneo: {
    en: 'Borneo (Kalimantan)', ja: 'ボルネオ (Boruneo)',
    wiki: 'https://en.wikipedia.org/wiki/Borneo',
    note: 'Oil at Balikpapan and Tarakan, which was the reason the southern advance came this way at all. Taken in January and February 1942.'
  },
  Sulawesi: {
    en: 'Celebes (Sulawesi)', ja: 'セレベス (Serebesu)',
    wiki: 'https://en.wikipedia.org/wiki/Sulawesi',
    note: 'Celebes, taken between January and February 1942, and put under naval rather than army administration for the rest of the war.'
  },
  Bali: {
    en: 'Bali', ja: 'バリ (Bari)', wiki: 'https://en.wikipedia.org/wiki/Bali',
    note: 'Taken on 19 February 1942. The action in Badung Strait the following night went the other way: four Japanese destroyers beat off a much larger Allied force and sank a Dutch destroyer.'
  },
  Lombok: {
    en: 'Lombok', ja: 'ロンボク (Ronboku)', wiki: 'https://en.wikipedia.org/wiki/Lombok',
    note: 'Between Bali and Sumbawa, and the strait through which the Allied ships that got away from Java escaped south.'
  },
  Sumbawa: {
    en: 'Sumbawa', ja: 'スンバワ (Sunbawa)', wiki: 'https://en.wikipedia.org/wiki/Sumbawa',
    note: 'A dry island of horses and sandalwood, and of Tambora, whose eruption in 1815 cooled the whole world.'
  },
  Flores: {
    en: 'Flores', ja: 'フローレス (Furōresu)', wiki: 'https://en.wikipedia.org/wiki/Flores',
    note: 'Taken in 1942 and used for an airstrip; otherwise left to itself.'
  },
  Sumba: {
    en: 'Sumba', ja: 'スンバ (Sunba)', wiki: 'https://en.wikipedia.org/wiki/Sumba',
    note: 'Horses, sandalwood and ikat weaving, and a society of clans and megalithic tombs that the Dutch reached late and governed lightly.'
  },
  WestTimor: {
    en: 'Dutch Timor', ja: 'チモール (Chimōru)', wiki: 'https://en.wikipedia.org/wiki/West_Timor',
    note: 'The Dutch half of Timor, taken on 20 February 1942 with a parachute landing behind the Australian force at Koepang.'
  },
  Halmahera: {
    en: 'Halmahera', ja: 'ハルマヘラ (Harumahera)', wiki: 'https://en.wikipedia.org/wiki/Halmahera',
    note: 'Bypassed in 1944 when the Americans took Morotai beside it instead, and its garrison was left to starve.'
  },
  Seram: {
    en: 'Ceram (Seram)', ja: 'セラム (Seramu)', wiki: 'https://en.wikipedia.org/wiki/Seram_Island',
    note: 'Sago and the oil at Bula on its eastern end. The mountainous interior was never properly administered.'
  },
  Buru: {
    en: 'Buru', ja: 'ブル (Buru)', wiki: 'https://en.wikipedia.org/wiki/Buru',
    note: 'A quiet island off Ceram, later notorious as an Indonesian prison colony.'
  },
  Bangka: {
    en: 'Banka (Bangka)', ja: 'バンカ (Banka)',
    wiki: 'https://en.wikipedia.org/wiki/Bangka_Island',
    note: 'Tin, worked by Chinese labour since the eighteenth century. Off its coast in February 1942 Japanese troops machine-gunned twenty-two Australian nurses who had survived a sinking; one lived.'
  },
  Belitung: {
    en: 'Billiton (Belitung)', ja: 'ビリトン (Biriton)',
    wiki: 'https://en.wikipedia.org/wiki/Belitung',
    note: 'Tin, worked by Chinese labour since the nineteenth century under the Billiton company — which later gave half its name to BHP Billiton.'
  },
  Nias: {
    en: 'Nias', ja: 'ニアス (Niasu)', wiki: 'https://en.wikipedia.org/wiki/Nias',
    note: 'Off the west coast of Sumatra, and famous for its megaliths and stone-jumping.'
  },
  WestNewGuinea: {
    en: 'Dutch New Guinea', ja: '西部ニューギニア (Seibu Nyūginia)',
    wiki: 'https://en.wikipedia.org/wiki/Dutch_New_Guinea',
    note: 'The Dutch half of New Guinea, hardly administered before the war and the ground the Americans came back through in 1944 — Hollandia, Biak, Sansapor.'
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
    note: 'Australian territory outright, not a mandate. Japan never took Port Moresby: the seaborne attempt turned back at the Coral Sea and the overland push was stopped on the Kokoda Track in September 1942.'
  },
  NewGuineaMandate: {
    en: 'Territory of New Guinea (mandate)', zh: '新幾內亞委任統治地',
    wiki: 'https://en.wikipedia.org/wiki/Territory_of_New_Guinea',
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
    en: 'Luzon', wiki: 'https://en.wikipedia.org/wiki/Luzon',
    note: 'The main island, with Manila and the rice plain behind it. Invaded in December 1941, lost with Corregidor in May 1942, and fought over again from January 1945 in the longest campaign of the Pacific war.'
  },
  Mindanao: {
    en: 'Mindanao', wiki: 'https://en.wikipedia.org/wiki/Mindanao',
    note: 'The southern island, with the Japanese abaca colony at Davao, the largest Japanese settlement in Southeast Asia before the war. Taken in 1942 and retaken in 1945.'
  },
  Palawan: {
    en: 'Palawan', wiki: 'https://en.wikipedia.org/wiki/Palawan',
    note: 'The long island reaching towards Borneo. In December 1944 the garrison at Puerto Princesa burned some 140 American prisoners alive rather than let them be liberated.'
  },
  Mindoro: {
    en: 'Mindoro', wiki: 'https://en.wikipedia.org/wiki/Mindoro',
    note: 'Taken by the Americans in December 1944 for its airfields, as the stepping stone from Leyte to Luzon.'
  },
  Panay: {
    en: 'Panay', wiki: 'https://en.wikipedia.org/wiki/Panay',
    note: 'Sugar, and the port of Iloilo. Taken in April 1942 and held afterwards by one of the strongest guerrilla organisations in the islands.'
  },
  Negros: {
    en: 'Negros', wiki: 'https://en.wikipedia.org/wiki/Negros',
    note: 'The sugar island, whose plantations supplied much of the Philippine crop.'
  },
  Cebu: {
    en: 'Cebu', wiki: 'https://en.wikipedia.org/wiki/Cebu',
    note: 'The oldest Spanish settlement in the islands and the busiest port after Manila.'
  },
  Bohol: {
    en: 'Bohol', wiki: 'https://en.wikipedia.org/wiki/Bohol',
    note: 'A quiet island of rice and coconut, taken without much fighting in 1942.'
  },
  Leyte: {
    en: 'Leyte', wiki: 'https://en.wikipedia.org/wiki/Leyte',
    note: 'Where MacArthur came ashore on 20 October 1944, and off which the largest naval battle ever fought was decided four days later.'
  },
  Samar: {
    en: 'Samar', wiki: 'https://en.wikipedia.org/wiki/Samar',
    note: 'Off its coast on 25 October 1944 a handful of American escort carriers and destroyers turned back a Japanese battleship force, in the action that decided Leyte Gulf.'
  },
  Masbate: {
    en: 'Masbate', wiki: 'https://en.wikipedia.org/wiki/Masbate',
    note: 'Cattle ranches and the gold mines at Aroroy, which were among the largest producers in the Philippines before the war.'
  },
  Abra: { en: 'Abra (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Abra_(province)' },
  Agusan: { en: 'Agusan (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Agusan_(province)' },
  Albay: {
    en: 'Albay (Luzon, with the sub-province of Catanduanes)',
    wiki: 'https://en.wikipedia.org/wiki/Albay'
  },
  Antique: { en: 'Antique (Panay)', wiki: 'https://en.wikipedia.org/wiki/Antique_(province)' },
  Bataan: { en: 'Bataan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Bataan' },
  Batanes: { en: 'Batanes', wiki: 'https://en.wikipedia.org/wiki/Batanes' },
  Batangas: { en: 'Batangas (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Batangas' },
  Bukidnon: { en: 'Bukidnon (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Bukidnon' },
  Bulacan: { en: 'Bulacan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Bulacan' },
  Cagayan: { en: 'Cagayan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Cagayan' },
  CamarinesNorte: { en: 'Camarines Norte (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Camarines_Norte' },
  CamarinesSur: { en: 'Camarines Sur (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Camarines_Sur' },
  Capiz: { en: 'Capiz (Panay)', wiki: 'https://en.wikipedia.org/wiki/Capiz' },
  Cavite: { en: 'Cavite (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Cavite' },
  Cotabato: { en: 'Cotabato (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Cotabato' },
  Davao: { en: 'Davao (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Davao_(province)' },
  IlocosNorte: { en: 'Ilocos Norte (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Ilocos_Norte' },
  IlocosSur: { en: 'Ilocos Sur (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Ilocos_Sur' },
  Iloilo: { en: 'Iloilo (Panay)', wiki: 'https://en.wikipedia.org/wiki/Iloilo' },
  Isabela: { en: 'Isabela (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Isabela_(province)' },
  Laguna: { en: 'Laguna (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Laguna_(province)' },
  LaUnion: { en: 'La Union (Luzon)', wiki: 'https://en.wikipedia.org/wiki/La_Union' },
  Lanao: { en: 'Lanao (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Lanao_(province)' },
  Manila: { en: 'City of Manila', wiki: 'https://en.wikipedia.org/wiki/Manila' },
  Marinduque: { en: 'Marinduque', wiki: 'https://en.wikipedia.org/wiki/Marinduque' },
  MisamisOccidental: {
    en: 'Misamis Occidental (Mindanao)',
    wiki: 'https://en.wikipedia.org/wiki/Misamis_Occidental'
  },
  MisamisOriental: { en: 'Misamis Oriental (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Misamis_Oriental' },
  MountainProvince: { en: 'Mountain Province (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Mountain_Province' },
  NegrosOccidental: { en: 'Negros Occidental', wiki: 'https://en.wikipedia.org/wiki/Negros_Occidental' },
  NegrosOriental: { en: 'Negros Oriental', wiki: 'https://en.wikipedia.org/wiki/Negros_Oriental' },
  NuevaEcija: { en: 'Nueva Ecija (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Nueva_Ecija' },
  NuevaVizcaya: { en: 'Nueva Vizcaya (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Nueva_Vizcaya' },
  Pampanga: { en: 'Pampanga (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Pampanga' },
  Pangasinan: { en: 'Pangasinan (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Pangasinan' },
  Rizal: { en: 'Rizal (Luzon)' },
  Romblon: { en: 'Romblon' },
  Sorsogon: { en: 'Sorsogon (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Sorsogon' },
  Sulu: { en: 'Sulu', wiki: 'https://en.wikipedia.org/wiki/Sulu' },
  Surigao: { en: 'Surigao (Mindanao)', wiki: 'https://en.wikipedia.org/wiki/Surigao_(province)' },
  Tarlac: { en: 'Tarlac (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Tarlac' },
  Tayabas: {
    en: 'Tayabas (Luzon; renamed Quezon in 1946)', wiki: 'https://en.wikipedia.org/wiki/Quezon'
  },
  Zambales: { en: 'Zambales (Luzon)', wiki: 'https://en.wikipedia.org/wiki/Zambales' },
  Zamboanga: {
    en: 'Zamboanga (Mindanao, with Basilan)',
    wiki: 'https://en.wikipedia.org/wiki/Zamboanga_(province)'
  },
  'Kashmir & Jammu': {
    en: 'Kashmir & Jammu',
    wiki: 'https://en.wikipedia.org/wiki/Jammu_and_Kashmir_(princely_state)'
  },
  Hyderabad: {
    en: 'Hyderabad — the Nizam’s dominions, the largest of the states',
    wiki: 'https://en.wikipedia.org/wiki/Hyderabad_State'
  },
  Mysore: { en: 'Mysore', wiki: 'https://en.wikipedia.org/wiki/Mysore_State' },
  'Travancore & Cochin': { en: 'Travancore & Cochin' },
  'Rajputana, Central India & the Gujarat States': { en: 'Rajputana, Central India and the Gujarat states' },
  'The Baluchistan States — Kalat, Las Bela, Kharan, Makran': { en: 'The Baluchistan states — Kalat, Las Bela, Kharan and Makran' },
  'The Eastern States — Orissa and Chhattisgarh': { en: 'The Eastern States — the Orissa and Chhattisgarh states' },
  'The Punjab States — Patiala, Jind, Nabha, Kapurthala': { en: 'The Punjab states — Patiala, Jind, Nabha and Kapurthala' },
  'Chitral, Dir, Swat & Amb': { en: 'Chitral, Dir, Swat and Amb — the frontier states' },
  'Kolhapur & the Deccan States': { en: 'Kolhapur and the Deccan states' },
  'The Khasi Hill States': { en: 'The Khasi Hill states' },
  Bastar: { en: 'Bastar', wiki: 'https://en.wikipedia.org/wiki/Bastar_State' },
  Manipur: { en: 'Manipur', wiki: 'https://en.wikipedia.org/wiki/Manipur' },
  Tripura: { en: 'Tripura (Hill Tippera)', wiki: 'https://en.wikipedia.org/wiki/Tripura' },
  'Cooch Behar': { en: 'Cooch Behar', wiki: 'https://en.wikipedia.org/wiki/Cooch_Behar_State' },
  Khairpur: { en: 'Khairpur', wiki: 'https://en.wikipedia.org/wiki/Khairpur_(princely_state)' },
  'Tehri Garhwal': { en: 'Tehri Garhwal', wiki: 'https://en.wikipedia.org/wiki/Tehri_Garhwal_district' },
  Rampur: { en: 'Rampur' },
  Benares: {
    en: 'Benares (Banaras) — Ramnagar, Bhadohi and Chakia',
    wiki: 'https://en.wikipedia.org/wiki/Benares_State'
  },
  Pudukkottai: { en: 'Pudukkottai', wiki: 'https://en.wikipedia.org/wiki/Pudukkottai_State' },
  'The Punjab Hill States — Bashahr, Mandi, Suket, Sirmur': { en: 'The Punjab Hill states — Bashahr, Mandi, Suket and Sirmur' },
  'Savanur, Sandur & Banganapalle': { en: 'Savanur, Sandur and Banganapalle' },
  'Waziristan & the frontier tribal agencies': { en: 'Waziristan and the frontier tribal agencies — political agents, not the Punjab' },
  Yakushima: {
    en: 'Yakushima', ja: '屋久島 (Yakushima)', zh: '屋久島',
    wiki: 'https://en.wikipedia.org/wiki/Yakushima',
    note: 'Kagoshima, not Okinawa: the cedar forests here were logged for the navy, and some of the trees standing are thousands of years old.'
  },
  Kuchinoerabujima: {
    en: 'Kuchinoerabujima', ja: '口永良部島 (Kuchinoerabujima)', zh: '口永良部島',
    wiki: 'https://en.wikipedia.org/wiki/Kuchinoerabu-jima',
    note: 'Kagoshima. An active volcano with a few hundred people on it.'
  },
  Kuchinoshima: {
    en: 'Kuchinoshima', ja: '口之島 (Kuchinoshima)', zh: '口之島',
    wiki: 'https://en.wikipedia.org/wiki/Kuchinoshima',
    note: 'The northernmost of the Tokara islands and Kagoshima\'s, at the top of the chain where the Kuroshio runs hardest.'
  },
  Nakanoshima: {
    en: 'Nakanoshima', ja: '中之島 (Nakanoshima)', zh: '中之島',
    wiki: 'https://en.wikipedia.org/wiki/Tokara_Islands',
    note: 'The highest of the Tokara islands, Kagoshima\'s, with a volcano that has smoked through most of recorded history.'
  },
  Tairajima: {
    en: 'Tairajima', ja: '平島 (Tairajima)', zh: '平島',
    wiki: 'https://en.wikipedia.org/wiki/Tairajima',
    note: 'One of the smaller Tokara islands, Kagoshima\'s, with a few dozen people on it.'
  },
  Suwanosejima: {
    en: 'Suwanosejima', ja: '諏訪之瀬島 (Suwanosejima)', zh: '諏訪之瀨島',
    wiki: 'https://en.wikipedia.org/wiki/Suwanosejima',
    note: 'Tokara, and Kagoshima\'s. Its volcano drove the islanders off for seventy years in the nineteenth century.'
  },
  Akusekijima: {
    en: 'Akusekijima', ja: '悪石島 (Akusekijima)', zh: '惡石島',
    wiki: 'https://en.wikipedia.org/wiki/Akusekijima',
    note: 'A Tokara island of Kagoshima, remote enough that it kept its own dialect and its own festivals.'
  },
  Kikaijima: {
    en: 'Kikaijima', ja: '喜界島 (Kikaijima)', zh: '喜界島',
    wiki: 'https://en.wikipedia.org/wiki/Kikaijima',
    note: 'Amami, and Kagoshima\'s. Its airfield was a staging point for the kamikaze sorties flown against the fleet off Okinawa in 1945.'
  },
  'Amami Ōshima': {
    en: 'Amami Ōshima', ja: '奄美大島 (Amami Ōshima)', zh: '奄美大島',
    wiki: 'https://en.wikipedia.org/wiki/Amami_%C5%8Cshima',
    note: 'The largest of the Amami group, taken from the Ryūkyū kingdom by Satsuma in 1609 and administered from Kagoshima as Ōshima-gun ever since — not Okinawa Prefecture. The United States held it separately until 1953.'
  },
  Tokunoshima: {
    en: 'Tokunoshima', ja: '徳之島 (Tokunoshima)', zh: '德之島',
    wiki: 'https://en.wikipedia.org/wiki/Tokunoshima',
    note: 'Amami, and Kagoshima\'s. Its three airfields were bombed hard in the spring of 1945.'
  },
  Okinoerabujima: {
    en: 'Okinoerabujima', ja: '沖永良部島 (Okinoerabujima)', zh: '沖永良部島',
    wiki: 'https://en.wikipedia.org/wiki/Okinoerabujima',
    note: 'Sugar and Easter lilies — the bulbs were exported to America until the war closed the trade. Kagoshima\'s, not Okinawa\'s.'
  },
  Yoronjima: {
    en: 'Yoronjima', ja: '与論島 (Yoronjima)', zh: '與論島',
    wiki: 'https://en.wikipedia.org/wiki/Yoronjima',
    note: 'The southernmost of the Amami group and of Kagoshima, twenty kilometres from Okinawa.'
  },
  Iheyajima: {
    en: 'Iheyajima', ja: '伊平屋島 (Iheyajima)', zh: '伊平屋島',
    wiki: 'https://en.wikipedia.org/wiki/Iheya_Island',
    note: 'Okinawa Prefecture, north-west of the main island, and never fought over.'
  },
  Izenajima: {
    en: 'Izenajima', ja: '伊是名島 (Izenajima)', zh: '伊是名島',
    wiki: 'https://en.wikipedia.org/wiki/Izena_Island',
    note: 'Okinawa Prefecture. The Shō dynasty of the Ryūkyū kings came from here.'
  },
  Iejima: {
    en: 'Iejima', ja: '伊江島 (Iejima)', zh: '伊江島', wiki: 'https://en.wikipedia.org/wiki/Iejima',
    note: 'Taken between 16 and 21 April 1945 for its airfield. The war correspondent Ernie Pyle was killed on it.'
  },
  'the Kerama Islands': {
    en: 'The Kerama Islands — taken first, 26 March 1945', ja: '慶良間諸島 (Kerama Shotō)',
    zh: '慶良間群島'
  },
  Kumejima: {
    en: 'Kumejima', ja: '久米島 (Kumejima)', zh: '久米島',
    wiki: 'https://en.wikipedia.org/wiki/Kumejima,_Okinawa',
    note: 'Okinawa Prefecture. Taken in June 1945; the garrison murdered twenty islanders it accused of collaborating.'
  },
  Miyakojima: {
    en: 'Miyakojima', ja: '宮古島 (Miyakojima)', zh: '宮古島',
    wiki: 'https://en.wikipedia.org/wiki/Miyako_Island',
    note: 'Garrisoned by some thirty thousand men, bombed and blockaded, and never assaulted — the troops and the islanders were both close to starving by the surrender.'
  },
  Taramajima: {
    en: 'Taramajima', ja: '多良間島 (Taramajima)', zh: '多良間島',
    note: 'A flat coral island between Miyako and Ishigaki, bypassed with them and blockaded to the surrender.'
  },
  Ishigakijima: {
    en: 'Ishigakijima', ja: '石垣島 (Ishigakijima)', zh: '石垣島',
    wiki: 'https://en.wikipedia.org/wiki/Ishigaki_Island',
    note: 'The seat of the Yaeyama islands, bypassed and bombed. Three captured American airmen were executed here in 1945, and the officers responsible were tried for it.'
  },
  Iriomotejima: {
    en: 'Iriomotejima', ja: '西表島 (Iriomotejima)', zh: '西表島',
    wiki: 'https://en.wikipedia.org/wiki/Iriomote_Island',
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
  AngThong: { en: 'Ang Thong', wiki: 'https://en.wikipedia.org/wiki/Ang_Thong' },
  BuriRam: { en: 'Buriram', wiki: 'https://en.wikipedia.org/wiki/Buriram' },
  Chachoengsao: { en: 'Chachoengsao (Paet Riu)', wiki: 'https://en.wikipedia.org/wiki/Chachoengsao' },
  ChaiNat: { en: 'Chainat', wiki: 'https://en.wikipedia.org/wiki/Chai_Nat' },
  Chaiyaphum: { en: 'Chaiyaphum', wiki: 'https://en.wikipedia.org/wiki/Chaiyaphum' },
  Chanthaburi: { en: 'Chanthaburi (Chantaboon)', wiki: 'https://en.wikipedia.org/wiki/Chanthaburi' },
  ChiangMai: { en: 'Chiengmai (Chiang Mai)', wiki: 'https://en.wikipedia.org/wiki/Chiang_Mai' },
  ChiangRai: { en: 'Chiengrai (Chiang Rai)', wiki: 'https://en.wikipedia.org/wiki/Chiang_Rai' },
  ChonBuri: { en: 'Chonburi', wiki: 'https://en.wikipedia.org/wiki/Chonburi' },
  Chumphon: { en: 'Chumphon', wiki: 'https://en.wikipedia.org/wiki/Chumphon' },
  Kalasin: { en: 'Kalasin', wiki: 'https://en.wikipedia.org/wiki/Kalasin' },
  KamphaengPhet: { en: 'Kamphaeng Phet', wiki: 'https://en.wikipedia.org/wiki/Kamphaeng_Phet' },
  Kanchanaburi: { en: 'Kanchanaburi (Kanburi)', wiki: 'https://en.wikipedia.org/wiki/Kanchanaburi' },
  KhonKaen: { en: 'Khon Kaen', wiki: 'https://en.wikipedia.org/wiki/Khon_Kaen' },
  Krabi: { en: 'Krabi', wiki: 'https://en.wikipedia.org/wiki/Krabi' },
  Lampang: { en: 'Nakhon Lampang', wiki: 'https://en.wikipedia.org/wiki/Lampang' },
  Lamphun: { en: 'Lamphun', wiki: 'https://en.wikipedia.org/wiki/Lamphun' },
  Loei: { en: 'Loei', wiki: 'https://en.wikipedia.org/wiki/Loei' },
  Lopburi: { en: 'Lopburi', wiki: 'https://en.wikipedia.org/wiki/Lopburi' },
  MaeHongSon: { en: 'Mae Hong Son', wiki: 'https://en.wikipedia.org/wiki/Mae_Hong_Son' },
  MahaSarakham: {
    en: 'Maha Sarakham — Kalasin was abolished into it in 1932',
    wiki: 'https://en.wikipedia.org/wiki/Maha_Sarakham'
  },
  NakhonNayok: { en: 'Nakhon Nayok', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Nayok' },
  NakhonPathom: { en: 'Nakhon Pathom', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Pathom' },
  NakhonPhanom: { en: 'Nakhon Phanom', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Phanom' },
  NakhonRatchasima: { en: 'Nakhon Ratchasima (Korat)', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Ratchasima' },
  NakhonSawan: { en: 'Nakhon Sawan (Paknampho)', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Sawan' },
  NakhonSiThammarat: {
    en: 'Nakhon Si Thammarat (Ligor)', wiki: 'https://en.wikipedia.org/wiki/Nakhon_Si_Thammarat'
  },
  Nan: { en: 'Nan', wiki: 'https://en.wikipedia.org/wiki/Nan_province' },
  Narathiwat: { en: 'Bang Nara (Narathiwat)', wiki: 'https://en.wikipedia.org/wiki/Narathiwat' },
  NongKhai: { en: 'Nong Khai', wiki: 'https://en.wikipedia.org/wiki/Nong_Khai' },
  Nonthaburi: { en: 'Nonthaburi', wiki: 'https://en.wikipedia.org/wiki/Nonthaburi' },
  PathumThani: { en: 'Pathum Thani', wiki: 'https://en.wikipedia.org/wiki/Pathum_Thani' },
  Pattani: { en: 'Patani' },
  Phangnga: { en: 'Phangnga', wiki: 'https://en.wikipedia.org/wiki/Phang_Nga' },
  Phatthalung: { en: 'Phatthalung', wiki: 'https://en.wikipedia.org/wiki/Phatthalung' },
  Phetchabun: { en: 'Phetchabun', wiki: 'https://en.wikipedia.org/wiki/Phetchabun' },
  Phetchaburi: { en: 'Petchaburi' },
  Phichit: { en: 'Phichit', wiki: 'https://en.wikipedia.org/wiki/Phichit' },
  Phitsanulok: { en: 'Phitsanulok', wiki: 'https://en.wikipedia.org/wiki/Phitsanulok' },
  PhraNakhon: { en: 'Phra Nakhon and Thonburi (Bangkok)', wiki: 'https://en.wikipedia.org/wiki/Bangkok' },
  PhraNakhonSiAyutthaya: {
    en: 'Ayudhya (Ayutthaya)',
    wiki: 'https://en.wikipedia.org/wiki/Phra_Nakhon_Si_Ayutthaya_province'
  },
  Phrae: { en: 'Phrae', wiki: 'https://en.wikipedia.org/wiki/Phrae' },
  Phuket: { en: 'Puket (Phuket)', wiki: 'https://en.wikipedia.org/wiki/Phuket_province' },
  PrachinBuri: { en: 'Prachinburi', wiki: 'https://en.wikipedia.org/wiki/Prachinburi' },
  PrachuapKhiriKhan: { en: 'Prachuap Khiri Khan', wiki: 'https://en.wikipedia.org/wiki/Prachuap_Khiri_Khan' },
  Ranong: { en: 'Ranong' },
  Ratchaburi: { en: 'Rajburi (Ratchaburi)' },
  Rayong: { en: 'Rayong' },
  RoiEt: { en: 'Roi Et' },
  SakonNakhon: { en: 'Sakon Nakhon', wiki: 'https://en.wikipedia.org/wiki/Sakon_Nakhon' },
  SamutPrakan: { en: 'Samut Prakan (Paknam)', wiki: 'https://en.wikipedia.org/wiki/Samut_Prakan' },
  SamutSakhon: { en: 'Samut Sakhon (Tachin)', wiki: 'https://en.wikipedia.org/wiki/Samut_Sakhon' },
  SamutSongkhram: { en: 'Samut Songkhram (Meklong)', wiki: 'https://en.wikipedia.org/wiki/Samut_Songkhram' },
  Saraburi: { en: 'Saraburi', wiki: 'https://en.wikipedia.org/wiki/Saraburi' },
  Satun: { en: 'Satun (Setul)', wiki: 'https://en.wikipedia.org/wiki/Satun' },
  SiSaKet: { en: 'Khukhan (renamed Sisaket in 1938)' },
  SingBuri: { en: 'Singburi', wiki: 'https://en.wikipedia.org/wiki/Sing_Buri_province' },
  Songkhla: { en: 'Songkhla (Singora)', wiki: 'https://en.wikipedia.org/wiki/Songkhla' },
  Sukhothai: { en: 'Sawankhalok (Sukhothai)', wiki: 'https://en.wikipedia.org/wiki/Sukhothai_province' },
  SuphanBuri: { en: 'Suphanburi', wiki: 'https://en.wikipedia.org/wiki/Suphan_Buri' },
  SuratThani: { en: 'Surat Thani (Bandon)', wiki: 'https://en.wikipedia.org/wiki/Surat_Thani' },
  Surin: { en: 'Surin', wiki: 'https://en.wikipedia.org/wiki/Surin_province' },
  Tak: { en: 'Tak (Raheng)', wiki: 'https://en.wikipedia.org/wiki/Tak_province' },
  Trang: { en: 'Trang', wiki: 'https://en.wikipedia.org/wiki/Trang_province' },
  Trat: { en: 'Trat', wiki: 'https://en.wikipedia.org/wiki/Trat' },
  UbonRatchathani: { en: 'Ubon Ratchathani', wiki: 'https://en.wikipedia.org/wiki/Ubon_Ratchathani' },
  UdonThani: { en: 'Udon Thani (Udorn)', wiki: 'https://en.wikipedia.org/wiki/Udon_Thani' },
  UthaiThani: { en: 'Uthai Thani', wiki: 'https://en.wikipedia.org/wiki/Uthai_Thani' },
  Uttaradit: { en: 'Uttaradit', wiki: 'https://en.wikipedia.org/wiki/Uttaradit' },
  Yala: { en: 'Yala (Jala)', wiki: 'https://en.wikipedia.org/wiki/Yala_province' },
  'Singapore (Pulau Ujong)': {
    en: 'Singapore (Pulau Ujong) — Shōnantō from February 1942', ja: '昭南島 (Shōnantō)',
    orig: 'Pulau Ujong', wiki: 'https://en.wikipedia.org/wiki/Singapore',
    note: 'The island itself, as distinct from the Settlement. Japan renamed it Shōnantō, "light of the south", on 16 February 1942, the day after the surrender.'
  },
  'Sentosa (Pulau Blakang Mati)': {
    en: 'Sentosa (Pulau Blakang Mati)', orig: 'Pulau Blakang Mati',
    wiki: 'https://en.wikipedia.org/wiki/Sentosa',
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
      en: 'Hēilóngjiāng (Heilungkiang)', zh: '黑龍江',
      wiki: 'https://en.wikipedia.org/wiki/Heilongjiang'
    },
    Suiyuan: { en: 'Suíyuǎn (Suiyuan)', zh: '綏遠', wiki: 'https://en.wikipedia.org/wiki/Suiyuan' },
    SuiyuanWest: { en: 'Suíyuǎn (Suiyuan)', zh: '綏遠', wiki: 'https://en.wikipedia.org/wiki/Suiyuan' },
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
      en: 'The Dindings — Straits Settlement: Lumut, Sitiawan and Pangkor, ceded by Perak in 1874 and ruled from Singapore'
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
      en: 'Lóngjiāng (Lungkiang)', zh: '龍江', wiki: 'https://en.wikipedia.org/wiki/Heilongjiang'
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
  },
};

JMAP.CLUSTER_EPOCH = {
  e1942: {
    'malaya/Dindings': null,
    'siamgain/Laos': null,
    'siamgain/Cambodia': null,
  },
};
