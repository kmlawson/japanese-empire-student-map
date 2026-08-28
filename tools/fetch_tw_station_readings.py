#!/usr/bin/env python3
"""Japanese readings for Taiwan's colonial stations, off ja.wikipedia's furigana.

    python3 tools/fetch_tw_station_readings.py            # fetch and write
    python3 tools/fetch_tw_station_readings.py --dry      # fetch and report only

WHY THIS IS ALLOWED TO ROMANISE AND NOTHING ELSE IS. Kanji cannot be
romanised by rule: 萬里橋 is Maribashi, 鹿野 is Shikano, 名間 is Nama, and no
amount of on-yomi gets you there, because the characters were picked for a
sound in Amis, Puyuma or Hokkien and not for their Sino-Japanese values.
*Kana* is different. かな to Hepburn is a table, it is exact, and it introduces
nothing. So this only ever converts a reading that a source states in kana --
it never reads a kanji.

The lede of a ja.wikipedia station article gives the reading directly:
`大甲駅（たいこうえき）`. That parenthesis is the whole source. If there is no
article, or the lede does not carry furigana, the station is left empty and
`unverified`, which is the correct answer.
"""
import argparse
import csv
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CSVP = os.path.join(ROOT, "data", "taiwan", "stations.csv")

# Descriptive, and deliberately carries no contact address.
UA = "japanese-empire-student-map/1.0 (historical station-name reconciliation)"
API = "https://ja.wikipedia.org/w/api.php"

# ---------------------------------------------------------------- kana ----
# Digraphs first, so きょ is kyo and never ki-yo.
KANA = [
    ("きゃ", "kya"), ("きゅ", "kyu"), ("きょ", "kyo"),
    ("しゃ", "sha"), ("しゅ", "shu"), ("しょ", "sho"),
    ("ちゃ", "cha"), ("ちゅ", "chu"), ("ちょ", "cho"),
    ("にゃ", "nya"), ("にゅ", "nyu"), ("にょ", "nyo"),
    ("ひゃ", "hya"), ("ひゅ", "hyu"), ("ひょ", "hyo"),
    ("みゃ", "mya"), ("みゅ", "myu"), ("みょ", "myo"),
    ("りゃ", "rya"), ("りゅ", "ryu"), ("りょ", "ryo"),
    ("ぎゃ", "gya"), ("ぎゅ", "gyu"), ("ぎょ", "gyo"),
    ("じゃ", "ja"), ("じゅ", "ju"), ("じょ", "jo"),
    ("ぢゃ", "ja"), ("ぢゅ", "ju"), ("ぢょ", "jo"),
    ("びゃ", "bya"), ("びゅ", "byu"), ("びょ", "byo"),
    ("ぴゃ", "pya"), ("ぴゅ", "pyu"), ("ぴょ", "pyo"),
    ("あ", "a"), ("い", "i"), ("う", "u"), ("え", "e"), ("お", "o"),
    ("か", "ka"), ("き", "ki"), ("く", "ku"), ("け", "ke"), ("こ", "ko"),
    ("さ", "sa"), ("し", "shi"), ("す", "su"), ("せ", "se"), ("そ", "so"),
    ("た", "ta"), ("ち", "chi"), ("つ", "tsu"), ("て", "te"), ("と", "to"),
    ("な", "na"), ("に", "ni"), ("ぬ", "nu"), ("ね", "ne"), ("の", "no"),
    ("は", "ha"), ("ひ", "hi"), ("ふ", "fu"), ("へ", "he"), ("ほ", "ho"),
    ("ま", "ma"), ("み", "mi"), ("む", "mu"), ("め", "me"), ("も", "mo"),
    ("や", "ya"), ("ゆ", "yu"), ("よ", "yo"),
    ("ら", "ra"), ("り", "ri"), ("る", "ru"), ("れ", "re"), ("ろ", "ro"),
    ("わ", "wa"), ("ゐ", "i"), ("ゑ", "e"), ("を", "o"), ("ん", "n"),
    ("が", "ga"), ("ぎ", "gi"), ("ぐ", "gu"), ("げ", "ge"), ("ご", "go"),
    ("ざ", "za"), ("じ", "ji"), ("ず", "zu"), ("ぜ", "ze"), ("ぞ", "zo"),
    ("だ", "da"), ("ぢ", "ji"), ("づ", "zu"), ("で", "de"), ("ど", "do"),
    ("ば", "ba"), ("び", "bi"), ("ぶ", "bu"), ("べ", "be"), ("ぼ", "bo"),
    ("ぱ", "pa"), ("ぴ", "pi"), ("ぷ", "pu"), ("ぺ", "pe"), ("ぽ", "po"),
    ("ー", "-"),
]
MACRON = {"a": "ā", "i": "ī", "u": "ū", "e": "ē", "o": "ō"}


def romanise(kana):
    """Hepburn, with the long vowels written as macrons."""
    out, i = [], 0
    while i < len(kana):
        if kana[i] == "っ":                    # gemination: the next consonant
            j, nxt = i + 1, None               # doubles, and っ before nothing
            for k, r in KANA:                  # is dropped
                if kana.startswith(k, j):
                    nxt = r
                    break
            if nxt and nxt[0] not in "aiueo":
                out.append("t" if nxt[0] == "c" else nxt[0])
            i += 1
            continue
        for k, r in KANA:
            if kana.startswith(k, i):
                out.append(r)
                i += len(k)
                break
        else:
            return None                        # something not in the table
    s = "".join(out)
    # ん before b, m or p is written m
    s = re.sub(r"n(?=[bmp])", "m", s)
    # おう and うう are long o and long u; ー is a long mark on whatever it follows
    s = re.sub(r"([aiueo])-", lambda m: MACRON[m.group(1)], s)
    s = re.sub(r"ou", "ō", s)
    s = re.sub(r"uu", "ū", s)
    s = re.sub(r"oo", "ō", s)
    return s.capitalize()


def fetch(titles):
    """Extracts for up to fifty titles in ONE request.

    The first version asked for each spelling of each name separately -- up to
    eight variants of a hundred and twenty-five names, a thousand requests --
    and Wikipedia rate-limited it into the ground after fifteen, which was the
    right response. The API takes titles by the fifty; this asks properly.
    """
    out = {}
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        q = urllib.parse.urlencode({
            "action": "query", "format": "json", "redirects": "1",
            "prop": "extracts", "explaintext": "1", "exintro": "1",
            "titles": "|".join(chunk)})
        for attempt in range(6):
            try:
                req = urllib.request.Request(API + "?" + q,
                                             headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as fh:
                    data = json.load(fh)
                break
            except Exception as err:
                wait = 2 ** attempt
                sys.stderr.write("  retrying in %ds (%s)\n" % (wait, err))
                time.sleep(wait)
        else:
            continue
        q2 = data.get("query", {})
        # a redirect answers under its target, so map both ways back
        back = {}
        for r in q2.get("redirects", []) or []:
            back[r["to"]] = r["from"]
        for r in q2.get("normalized", []) or []:
            back[r["to"]] = r["from"]
        for page in (q2.get("pages") or {}).values():
            if "extract" not in page:
                continue
            title = page.get("title")
            asked = back.get(title, title)
            out[asked] = (title, page["extract"])
        sys.stderr.write("  %d/%d titles asked\n" % (min(i + 40, len(titles)),
                                                      len(titles)))
        time.sleep(1.0)
    return out


VARIANTS = (("臺", "台"), ("萬", "万"), ("澤", "沢"), ("驛", "駅"),
            ("龍", "竜"), ("廣", "広"), ("圓", "円"), ("舊", "旧"))


def spellings(hanji):
    forms = {hanji}
    for a, b in VARIANTS:
        forms |= {f.replace(a, b) for f in forms}
    return sorted(forms)


# 大甲駅（たいこうえき） -- and sometimes with a comma or a note inside
LEDE = re.compile(r"[（(]\s*([ぁ-ゖー]+?)えき\s*[、,）)]")

# MOST OF THESE NAMES ARE ALSO STATIONS IN JAPAN, and the first pass walked
# straight into it: 桃園 came back Momozono, which is in Japan and not Tōen in
# Taiwan; 竹田 came back Takeda, which is in Ōita. The article has to be about
# a Taiwanese station before its furigana means anything here.
TAIWAN = re.compile(r"台湾|臺灣|台灣|台鉄|臺鐵|台湾総督府|台北|高雄|台南")

# And the reading has to be the colonial one. A modern article gives the
# station its present Mandarin-derived name in katakana -- 台北駅（タイペイえ
# き）-- which is not what this map is naming. The furigana pattern only
# matches hiragana, so those fall through and are reported rather than taken,
# which is the answer wanted.


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    with io.open(CSVP, encoding="utf-8", newline="") as fh:
        rows = list(csv.DictReader(fh))
    fields = list(rows[0])
    todo = [r for r in rows if r["hanji"] and not r["romaji"]]
    if args.limit:
        todo = todo[:args.limit]
    sys.stderr.write("looking up %d stations on ja.wikipedia\n" % len(todo))

    # every spelling of every name, asked for in a handful of requests
    want = []
    for r in todo:
        for f in spellings(r["hanji"]):
            t = f + "駅"
            if t not in want:
                want.append(t)
    sys.stderr.write("  %d titles to ask about\n" % len(want))
    pages = fetch(want)

    got, miss, rejected = 0, [], []
    for r in todo:
        hit = None
        for f in spellings(r["hanji"]):
            page = pages.get(f + "駅")
            if not page:
                continue
            if not TAIWAN.search(page[1]):
                rejected.append((r["hanji"], page[0]))
                continue
            m = LEDE.search(page[1])
            if m:
                hit = (page[0], m.group(1))
                break
        if not hit:
            miss.append(r["hanji"])
            continue
        title, kana = hit
        rom = romanise(kana)
        if not rom:
            miss.append(r["hanji"])
            sys.stderr.write("  %-6s kana %s did not convert\n" % (r["hanji"], kana))
            continue
        got += 1
        r["romaji"] = rom
        r["kana"] = kana
        r["confidence"] = "verified"
        r["source_type"] = "wikipedia_ja"
        r["source_url"] = ("https://ja.wikipedia.org/wiki/"
                           + urllib.parse.quote(title.replace(" ", "_")))
        sys.stderr.write("  %-8s %-14s %s\n" % (r["hanji"], rom, kana))

    sys.stderr.write("\n%d readings found, %d still without one\n"
                     % (got, len(set(miss))))
    if rejected:
        sys.stderr.write("  %d article(s) turned down as not about Taiwan: %s\n"
                         % (len(rejected),
                            ", ".join("%s->%s" % t for t in rejected)))
    if miss:
        sys.stderr.write("  %s\n" % " ".join(sorted(set(miss))))
    if args.dry:
        return
    with io.open(CSVP, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    sys.stderr.write("written to %s\n" % os.path.relpath(CSVP, ROOT))


if __name__ == "__main__":
    main()
