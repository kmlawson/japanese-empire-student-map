# -*- coding: utf-8 -*-
"""Pre-war character forms for Japanese place names, and the guards on them.

The map's `ja` column holds modern shinjitai — 金沢, 豊橋 — and the ask for the
Kanji/Hanzi/Hanja switch named 旧字 for Japan and Karafuto. `ja_kyu` carries
that where it is known, and this module is the whole of what the build believes
about it.

**Nothing here converts the data.** `SAFE` exists to *find candidates* and to
let the build check what a person entered; the values in `texts/` are written
once, by hand or by a one-off pass, and thereafter only verified. The reason is
the asymmetry that makes any of this safe at all:

    kyū -> shin is deterministic and many-to-one.
    shin -> kyū is not.

So the build can verify what no tool should generate. `BACK` runs every
`ja_kyu` back through the one-to-one table and refuses the build unless it
comes out equal to `ja`. That catches a typo, a wrong disambiguation, a name
entered on the wrong row, and a modern Chinese or Soviet form pasted in — 
霍爾姆斯克 fails on the first character.
"""

# **Safe one-to-one.** The reverse mapping is unambiguous for place names:
# one shinjitai character, one kyūjitai character, no context needed.
SAFE = {
    "沢": "澤", "広": "廣", "浜": "濱", "関": "關", "児": "兒", "戸": "戶",
    "徳": "德", "呉": "吳", "豊": "豐", "横": "橫", "静": "靜", "会": "會",
    "国": "國", "県": "縣", "気": "氣", "蔵": "藏", "亀": "龜", "鉄": "鐵",
    "対": "對", "満": "滿", "浅": "淺", "栄": "榮", "円": "圓", "真": "眞",
    "恵": "惠", "姫": "姬", "覇": "霸", "経": "經", "済": "濟", "総": "總",
    "両": "兩", "仏": "佛", "払": "拂", "楽": "樂", "穂": "穗", "弾": "彈",
    "駅": "驛", "湾": "灣", "検": "檢", "験": "驗", "権": "權", "労": "勞",
    "楼": "樓", "録": "錄", "医": "醫", "拡": "擴", "覚": "覺", "帰": "歸",
    "続": "續", "荘": "莊", "転": "轉", "独": "獨", "読": "讀", "発": "發",
    "変": "變", "豊": "豐", "誉": "譽", "様": "樣", "覧": "覽", "緑": "綠",
    "霊": "靈", "顕": "顯", "厳": "嚴", "縦": "縱", "従": "從", "渋": "澁",
    "銭": "錢", "双": "雙", "遅": "遲", "昼": "晝", "庁": "廳", "聴": "聽",
    "逓": "遞", "点": "點", "伝": "傳", "党": "黨", "灯": "燈", "当": "當",
    "難": "難", "脳": "腦", "廃": "廢", "拝": "拜", "売": "賣", "麦": "麥",
    "蛮": "蠻", "秘": "祕", "並": "竝", "宝": "寶", "訳": "譯", "薬": "藥",
    "来": "來", "頼": "賴", "乱": "亂", "隣": "鄰", "涙": "淚", "歴": "歷",
    "恋": "戀", "炉": "爐", "郎": "郞", "渓": "溪", "営": "營", "峡": "峽",
    "巌": "巖", "駆": "驅", "顔": "顏", "様": "樣", "旧": "舊", "寛": "寬",
}

# **Never automatically.** The reverse mapping is one-to-many, or both forms
# were genuinely current in pre-war print. A name containing one of these has
# to be settled against a source, by a person, or left alone.
NEVER = {
    "弁": "辨/瓣/辯/辮 — and shrine names like 弁天 vary by shrine",
    "芸": "藝, but 芸 is its own character; 安芸/安藝 needs a source",
    "予": "豫; 伊予/伊豫",
    "余": "餘; 余市",
    "台": "臺/颱 — and 仙台/仙臺 is contested in period print",
    "欠": "缺",
    "缶": "罐",
    "糸": "絲 is a different character",
    "虫": "蟲",
    "証": "證",
    "体": "體, but 体 existed as a vulgar form",
    "万": "萬/万 both standard pre-war",
    "与": "與/与 both attested",
    "塩": "鹽/塩 both in official pre-war use — 塩竈 famously fussy",
    "竜": "龍/竜 both pre-war",
    "弥": "彌/弥 both",
    "斉": "齊/齋 — chronically confused in names",
    "斎": "齊/齋 — chronically confused in names",
    "辺": "邊/邉 itaiji split",
}

# **Variant families, which are a different thing and must not block a name.**
# 島/嶋/嶌, 峰/峯, 曽/曾, 崎/﨑 are alternative spellings rather than pre-war
# forms of one character, so they are simply absent from SAFE and pass through
# untouched. Blocking on them was the first cut of this and it was wrong: it
# stopped 徳島 -> 德島, where the only character that moves is 徳 and 島 does
# not move at all. They are listed so the next person does not put them back
# into either table by mistake.
VARIANTS = "島嶋嶌峰峯曽曾崎﨑"

# the reverse direction, which is deterministic and is what the build checks
BACK = {}
for shin, kyu in SAFE.items():
    BACK[kyu] = shin
