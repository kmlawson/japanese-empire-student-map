#!/usr/bin/env python3
"""The readings the title-guess fetcher cannot reach, out of article histories.

    python3 tools/fetch_tw_readings_by_history.py --dry     # report only
    python3 tools/fetch_tw_readings_by_history.py           # fetch and write

WHY A SECOND FETCHER. `fetch_tw_station_readings.py` asks ja.wikipedia for
`大甲駅` and reads the furigana out of the lede. That works for the stations
whose colonial name is still their name, and it is why 153 of Taiwan's 206 are
verified. It cannot reach the rest, because those stations were *renamed*: the
article about 車路墘 is called 保安駅, the one about 番子田 is 隆田駅, and asking
for `車路墘駅` returns nothing at all.

Those articles do carry the answer, in the history section rather than the lede:

    保安駅  ->  「1900年 ... 車路墘停車場（しゃろけん-）として開業」

So this searches for the *old* name, opens the candidates, and takes a kana
gloss printed beside that old name anywhere in the text. The rule of the first
fetcher still holds and is the whole point: **a reading is only ever taken from
a source that states it in kana.** Nothing here reads a kanji.

WHY THE COORDINATE GUARD, WHICH IS THE REST OF THE POINT. Searching by
characters alone finds the wrong station. 大安 on this list is in 豐原郡,
Taichū-shū, at 24.32N 120.75E; the first thing ja.wikipedia offers for 大安駅 is
Taipei's, at 25.03N 121.54E — a hundred kilometres away, and its reading says
nothing about ours. Measured on the first two dozen names, about one match in
six was a different station of the same name.

So a candidate is accepted only if the article is about *our* station:

  * its coordinates are within MAX_KM of the ones we hold, or
  * the article names the 郡 or 州 our own note gives it.

An article with neither is refused however good the kana looks, and the station
stays `unverified`, which is the honest answer and the one it has now.
"""
import argparse
import csv
import io
import json
import math
import os
import re
import sys
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_tw_station_readings import romanise, spellings, UA, API, CSVP  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache", "ja_wiki_history.json")
MAX_KM = 6.0           # a station and its article should agree to walking distance
KANA = r"[ぁ-ゟ][ぁ-ゟー]{1,14}"

# ------------------------------------------------------------------ net ----
# One request a second with a long backoff. ja.wikipedia answers 429 readily
# and there is no hurry: the cache means a second run costs nothing.
_cache = None


def _load_cache():
    global _cache
    if _cache is None:
        try:
            with io.open(CACHE, encoding="utf-8") as fh:
                _cache = json.load(fh)
        except Exception:
            _cache = {}
    return _cache


def _save_cache():
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with io.open(CACHE, "w", encoding="utf-8") as fh:
        json.dump(_load_cache(), fh, ensure_ascii=False)


def api(**kw):
    kw.setdefault("format", "json")
    key = urllib.parse.urlencode(sorted(kw.items()))
    c = _load_cache()
    if key in c:
        return c[key]
    delay = 5.0
    for _ in range(7):
        try:
            req = urllib.request.Request(API + "?" + urllib.parse.urlencode(kw),
                                         headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as fh:
                d = json.load(fh)
            c[key] = d
            _save_cache()
            time.sleep(1.2)
            return d
        except Exception as e:
            if "429" in str(e):
                time.sleep(delay)
                delay = min(delay * 2, 120)
                continue
            return None
    return None


def km(a_lon, a_lat, b_lon, b_lat):
    R = 6371.0088
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp = p2 - p1
    dl = math.radians(b_lon - a_lon)
    x = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))


# The 州 and 廳 of the colony, and the places their ground is called today.
# Most of these articles carry no coordinates at all — 清水駅 (台中市) has none —
# so the identity check is geographical by name instead: the table says which 州
# a station stood in, and the article says which city its ground is in now.
SHU_TODAY = {
    "Taihoku-shū": ("台北", "臺北", "新北", "基隆", "宜蘭"),
    "Shinchiku-shū": ("新竹", "桃園", "苗栗"),
    "Taichū-shū": ("台中", "臺中", "彰化", "南投"),
    "Tainan-shū": ("台南", "臺南", "嘉義", "雲林"),
    "Takao-shū": ("高雄", "屏東"),
    "Karenkō-chō": ("花蓮",),
    "Taitō-chō": ("台東", "臺東"),
    "Hōko-chō": ("澎湖",),
}

# The article writes 豊原郡 where the table writes 豐原郡, and 台 for 臺. Both
# sides are folded before they are compared, which is the same fold the Korea
# build uses on its own names.
FOLD = {"豐": "豊", "臺": "台", "灣": "湾", "縣": "県", "驛": "駅", "鐵": "鉄"}


def fold(s):
    return "".join(FOLD.get(c, c) for c in (s or ""))


def region_words(row):
    """The names this station's ground goes by today, from its 州."""
    return SHU_TODAY.get((row.get("shu") or "").strip(), ())


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
    sys.stderr.write("%d stations without a reading\n" % len(todo))

    got, refused, nothing, failed = [], [], [], []
    for r in todo:
        name = r["hanji"]
        hit = None
        broke = False
        for form in spellings(name):
            s = api(action="query", list="search",
                    srsearch=form + "駅 台湾", srlimit=4)
            if s is None:
                # **A lookup that failed is not a station with no reading.**
                # `api` gives up after its backoff and returns None, and
                # counting that as "nothing stated" silently turned a
                # rate-limited run into a finding. Failures are reported on
                # their own and a second run picks them up, the successes
                # already being in the cache.
                broke = True
                continue
            for cand in s.get("query", {}).get("search", []):
                title = cand["title"]
                pg = api(action="query", prop="extracts|coordinates|pageprops",
                         explaintext=1, titles=title)
                if not pg:
                    continue
                page = list(pg["query"]["pages"].values())[0]
                text = page.get("extract", "") or ""
                # **A disambiguation page is not a source.** 大安駅 is one: it
                # lists Mie's, Taipei's, Taichung's and two in China, and its
                # lede gloss だいあん is a reading of the *title*, not of any
                # station. It also mentions 台中, so the region check passes it
                # — which is exactly how it got through the first time.
                if "disambiguation" in (page.get("pageprops") or {}):
                    refused.append((name, title, "-", "a disambiguation page"))
                    continue
                m = re.search(re.escape(form) + r"(?:駅|停車場|驛)?\s*[（(]\s*(" + KANA + r")", text)
                if not m:
                    continue
                # The gloss usually carries えき on the end — 車路墘（しゃろけん-）
                # keeps it as a hyphen, 日南駅（にちなんえき）spells it out — and
                # the reading of the place is what this wants, not the word for
                # station tacked onto it.
                kana_hit = re.sub(r"(えき|のえき)$", "", m.group(1)).rstrip("ー-")
                if not kana_hit:
                    continue
                # **And it has to be a station that existed then.** 苗栗's
                # reading びょうりつ is right, but the article offering it is the
                # Taiwan High Speed Rail one, which says in its own second
                # sentence 「在来線（台鉄）の苗栗駅とは別であり」 — a different
                # station. Citing it would put a source in the table that
                # denies being the source. So the article must show the
                # colonial railway or a date under Japanese rule.
                if not (re.search(r"台湾総督府鉄道|日本統治時代|日治", text)
                        or re.search(r"1(?:8[89]\d|9[0-3]\d|94[0-5])年", text)):
                    refused.append((name, title, kana_hit, "no colonial-era history"))
                    continue
                # --- the guard: is this article about *our* station? ---
                why = None
                co = (page.get("coordinates") or [None])[0]
                if co and r.get("lon") and r.get("lat"):
                    d = km(float(r["lon"]), float(r["lat"]), co["lon"], co["lat"])
                    if d <= MAX_KM:
                        why = "%.1f km" % d
                    else:
                        refused.append((name, title, kana_hit, "%.0f km away" % d))
                        continue
                if why is None:
                    hay = fold(title + " " + text)
                    # It has to be in Taiwan at all. This alone throws out
                    # Miyazaki's 日南駅 and Shiga's 甲南駅, which share our
                    # characters and are a thousand kilometres away.
                    if not ("台湾" in hay or "臺灣" in hay or "台灣" in hay):
                        refused.append((name, title, kana_hit, "not a Taiwanese station"))
                        continue
                    # And in the right part of it. Our note gives the 州; the
                    # article gives the city its ground is in now. This is what
                    # separates our 大安 in 豐原郡, 臺中州 from Taipei's.
                    want = region_words(r)
                    gun = fold(r.get("district_kanji") or "")
                    if gun and gun in hay:
                        why = "names " + gun
                    elif want and any(fold(w) in hay for w in want):
                        why = "in " + [w for w in want if fold(w) in hay][0]
                    elif not want:
                        refused.append((name, title, kana_hit, "the table names no 州"))
                        continue
                    else:
                        refused.append((name, title, kana_hit,
                                        "wrong region (wanted %s)" % "/".join(want)))
                        continue
                hit = (title, kana_hit, why)
                break
            if hit:
                break
        if hit:
            title, kana, why = hit
            rom = romanise(kana)
            if not rom:
                nothing.append(name)
                continue
            got.append((r, title, kana, rom, why))
            print("  %-8s %-14s %-16s  %s  (%s)" % (name, kana, rom, title, why))
        elif broke:
            failed.append(name)
        else:
            nothing.append(name)

    print("\n%d accepted, %d refused by the guard, %d with nothing stated, "
          "%d lookups failed"
          % (len(got), len(refused), len(nothing), len(failed)))
    if failed:
        print("   failed (run again; the cache keeps what worked): "
              + " ".join(failed))
    if refused:
        print("\nrefused — the article is a different station of the same name:")
        for n, t, k, why in refused:
            print("   %-8s %-14s %-22s %s" % (n, k, t, why))
    if args.dry:
        print("\n--dry: nothing written")
        return
    for r, title, kana, rom, why in got:
        r["romaji"] = rom
        r["kana"] = kana
        r["confidence"] = "verified"
        r["source_type"] = "wikipedia_ja"
        r["source_url"] = "https://ja.wikipedia.org/wiki/" + urllib.parse.quote(title)
    with io.open(CSVP, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print("\nwrote %d readings into %s" % (len(got), os.path.relpath(CSVP)))


if __name__ == "__main__":
    main()
