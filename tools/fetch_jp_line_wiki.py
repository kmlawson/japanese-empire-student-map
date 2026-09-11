"""An article and a romanisation for each of Japan's railway lines.

    python3 tools/fetch_jp_line_wiki.py            # fills the cache
    python3 tools/fetch_jp_line_wiki.py --report   # says what it holds

Writes tools/cache/jp-line-wiki.json, which tools/build_jp_rails.py reads. The
network is only touched to *fill* the cache: a line already in it is never
asked about again, so a rebuild costs nothing and the result does not drift
under us between builds.

WHAT IS LOOKED UP, AND WHY IT IS THE PAIR AND NOT THE NAME.

The map's own layer carries three columns and 路線名 is one of them, but a line
name is not unique: 152 of the 936 distinct names in the source belong to more
than one company, and 本線 alone — "main line" — is used by 31. So the key here
is (運営会社, 路線名), 1,134 of them, and the company comes from the source
GeoJSON at build time rather than being shipped to the reader.

**The bare name is only tried when it is unambiguous, and this matters.**
Asking ja.wikipedia for 大社線 returns JR West's Taisha Line, which is not the
一畑電気鉄道 line of that name — two companies in this data use it. Falling back
to the bare title wherever the specific one missed would have quietly attached
the wrong article, the wrong English name and the wrong romanisation to lines
all over the country, and nothing downstream would have noticed. So the bare
form is used only where this dataset itself knows exactly one company for that
name, and every record says which form answered.

THE ROMANISATION IS TAKEN, NEVER DERIVED.

CLAUDE.md's rule for station readings is that a Japanese reading comes from a
source that states it and is never worked out from the characters — 萬里橋 is
Maribashi and no amount of on-yomi gets you there. The same holds for a line.
Two sources are used, in this order:

* **the English article's title**, which for a Japanese railway line is its
  romanisation with "Line" on the end — 東北本線 is "Tōhoku Main Line". Any
  parenthetical disambiguator is dropped: "Taisha Line (Bataden)" is the Taisha
  Line.
* **the furigana in the Japanese article's lede**, where there is no English
  article. 「東北本線（とうほくほんせん）」 gives the kana, and the kana are
  converted by table.

A line with neither is left without a romanisation rather than given a guessed
one. The card then shows the characters alone, which is what the map knows.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "jp-rails", "japan-railway-lines-1942.geojson")
CACHE = os.path.join(ROOT, "tools", "cache", "jp-line-wiki.json")

# Descriptive and carrying no contact address: Wikimedia's user-agent policy
# invites one and an invitation is not permission to publish somebody's.
UA = "japanese-empire-student-map/1.0 (historical railway line reconciliation)"


def api(host, params):
    p = dict(params)
    p["format"] = "json"
    p["formatversion"] = "2"
    url = "https://%s/w/api.php?%s" % (host, urllib.parse.urlencode(p))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    # **429 is the one that actually happens here.** A first run of all 1,134
    # pairs was refused partway through with "Too Many Requests"; the cache was
    # only written at the end, so the whole run was lost. Both halves of that
    # are fixed — this waits and tries again, honouring Retry-After where the
    # server sends one, and `main` saves the cache as it goes.
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == 5:
                raise
            wait = float(e.headers.get("Retry-After") or 0) or (5 * (2 ** attempt))
            sys.stderr.write("    %d; waiting %.0fs\n" % (e.code, wait))
            time.sleep(min(wait, 120))
        except (urllib.error.URLError, TimeoutError):
            if attempt == 5:
                raise
            time.sleep(3 * (attempt + 1))
    return {}


def clean_co(co):
    """The company as an article title would spell it."""
    co = re.sub(r"（[^）]*）", "", co)          # 北海道旅客鉄道（旧国鉄）
    co = co.replace("株式会社", "")
    return co.strip()


# --- kana -> romaji, for the lines with no English article ------------------
# Hepburn with macrons, which is what the rest of this map uses.
KANA = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','ゐ':'i','ゑ':'e','を':'o','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'ー':'-',
}
YOON = {
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
}
LONG = {'a':'ā', 'i':'ī', 'u':'ū', 'e':'ē', 'o':'ō'}


def romaji(kana):
    """Hiragana to Hepburn, and then to a line's name in English.

    Returns '' on anything it cannot read cleanly, which is the point: a
    half-converted reading is worse than none.

    **The long vowels have to be done on the syllables, not on the string.**
    おう is ō and うう is ū, so えきまえせん is Ekimae and びばいてつどう is
    Bibai Tetsudō — written straight through the table they come out
    "...dou", which is not a romanisation anybody uses.

    **And 線 is a word.** The kana run the whole title together, so the naive
    output is `Ekimaesen` where every English article on the subject says
    "Ekimae Line". 鉄道 likewise: びばいてつどうせん is the Bibai Railway Line.
    Both are split off the end here, which is what makes these names sit
    beside the ones taken from the English titles rather than looking like a
    different kind of thing.
    """
    kana = kana.strip()
    if not kana or not re.fullmatch(r"[ぁ-んー・\s]+", kana):
        return ""
    syl, i = [], 0
    while i < len(kana):
        two = kana[i:i + 2]
        if two in YOON:
            syl.append(YOON[two]); i += 2; continue
        c = kana[i]
        if c == 'っ':                       # a doubled consonant
            r = YOON.get(kana[i + 1:i + 3], KANA.get(kana[i + 1:i + 2], ''))
            if r:
                syl.append('t' if r.startswith('ch') else r[0])
            i += 1
            continue
        if c in ('\u3000', ' ', '・'):
            syl.append(' '); i += 1; continue
        if c == 'ー':
            if syl and syl[-1] and syl[-1][-1] in LONG:
                syl[-1] = syl[-1][:-1] + LONG[syl[-1][-1]]
            i += 1
            continue
        if c not in KANA:
            return ""
        syl.append(KANA[c]); i += 1

    # おう -> ō and うう -> ū, on the syllables while they are still separate
    merged = []
    for s2 in syl:
        # おう and うう are long, and so is おお — にしおおじ is Nishiōji, which
        # written straight through came out "Nishiooji".
        if merged and merged[-1] and merged[-1][-1] in ('o', 'u') and (
                s2 == 'u' or (s2 == 'o' and merged[-1][-1] == 'o')):
            merged[-1] = merged[-1][:-1] + LONG[merged[-1][-1]]
            continue
        merged.append(s2)
    out = ''.join(merged).strip()

    # 鉄道 and 線 are words, not syllables of the name
    out = re.sub(r"tetsud[ōo]honsen$", " Railway Main Line", out)
    out = re.sub(r"tetsud[ōo]sen$", " Railway Line", out)
    out = re.sub(r"honsen$", " Main Line", out)
    out = re.sub(r"tetsud[ōo]$", " Railway", out)
    out = re.sub(r"sen$", " Line", out)
    # 電車 and 軌道 end a name the way 線 does: 明神電車 is the Meishin Densha
    # and not "Meishindensha".
    out = re.sub(r"densha$", " Densha", out)
    out = re.sub(r"kid[ōo]$", " Kidō", out)
    out = re.sub(r"\s+", " ", out).strip()
    if not out:
        return ""
    return out[:1].upper() + out[1:]


def en_name(title):
    """The English title as a name: the disambiguator is not part of it."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", title or "").strip()


def load_pairs():
    doc = json.load(open(SRC, encoding="utf-8"))
    pairs = sorted({(f["properties"]["運営会社"], f["properties"]["路線名"])
                    for f in doc["features"]})
    bycount = {}
    for co, ln in pairs:
        bycount.setdefault(ln, set()).add(co)
    return pairs, bycount


def load_cache():
    if os.path.exists(CACHE):
        return json.load(open(CACHE, encoding="utf-8"))
    return {}


def save_cache(c):
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with open(CACHE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(c, f, ensure_ascii=False, indent=1, sort_keys=True)


def key(co, ln):
    return co + "\t" + ln


def resolve_titles(titles):
    """ja.wikipedia: which of these exist, and what is the English article.

    Fifty at a time, which is the API's limit for a multi-title query, and
    redirects are followed so 東北線 lands on 東北本線.
    """
    out = {}
    titles = [t for t in titles if t]
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        r = api("ja.wikipedia.org",
                {"action": "query", "titles": "|".join(chunk),
                 "prop": "langlinks", "lllang": "en", "lllimit": "500",
                 "redirects": "1"})
        q = r.get("query", {})
        # what the API normalised or redirected, so a hit can be traced back
        alias = {}
        for kind in ("normalized", "redirects"):
            for m in q.get(kind, []) or []:
                alias[m["from"]] = m["to"]
        for pg in q.get("pages", []) or []:
            if pg.get("missing"):
                continue
            ll = pg.get("langlinks") or []
            out[pg["title"]] = ll[0]["title"] if ll else ""
        for src, dst in alias.items():
            if dst in out and src not in out:
                out[src] = out[dst]
        time.sleep(0.6)
    return out


def furigana(titles, cache=None, saver=None):
    """The reading in the lede, for the lines with no English article.

    `prop=extracts` caps `exlimit` at 1 whenever the full text is asked for —
    that cost this project 695 titles once — so these go one at a time and only
    for the handful that need it.
    """
    out = {}
    for n, t in enumerate(titles, 1):
        r = api("ja.wikipedia.org",
                {"action": "query", "titles": t, "prop": "extracts",
                 "exintro": "1", "explaintext": "1", "redirects": "1"})
        pages = r.get("query", {}).get("pages", []) or []
        txt = (pages[0].get("extract", "") if pages else "")[:400]
        m = re.search(r"[（(]([ぁ-んー・\s]{2,40})[）)]", txt)
        out[t] = m.group(1) if m else ""
        if n % 25 == 0:
            sys.stderr.write("    furigana %d/%d\n" % (n, len(titles)))
            if cache is not None and saver:
                saver(cache)
        time.sleep(0.6)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true",
                    help="say what the cache holds and fetch nothing")
    ap.add_argument("--limit", type=int, default=0,
                    help="stop after this many new lookups (for a trial run)")
    args = ap.parse_args()

    pairs, bycount = load_pairs()
    cache = load_cache()

    if args.report:
        done = [cache[key(c, l)] for c, l in pairs if key(c, l) in cache]
        art = [r for r in done if r.get("ja")]
        en = [r for r in done if r.get("en")]
        ro = [r for r in done if r.get("romaji")]
        print("pairs           %d" % len(pairs))
        print("in the cache    %d" % len(done))
        print("  with an article  %d (%.0f%%)" % (len(art), 100.0 * len(art) / max(1, len(done))))
        print("  English article  %d" % len(en))
        print("  romanised        %d" % len(ro))
        src = {}
        for r in done:
            src[r.get("via", "?")] = src.get(r.get("via", "?"), 0) + 1
        print("  how it was found:", src)
        return

    todo = [(c, l) for c, l in pairs if key(c, l) not in cache]
    if args.limit:
        todo = todo[:args.limit]
    print("%d pairs, %d already cached, %d to look up"
          % (len(pairs), len(pairs) - len([1 for c, l in pairs if key(c, l) not in cache]), len(todo)))
    if not todo:
        return

    # --- the candidate titles, most specific first --------------------------
    want, forms = [], {}
    for co, ln in todo:
        c = clean_co(co)
        cands = [c + ln]
        if c and ln.startswith(c):
            cands.append(ln)
        # The bare name ONLY where this dataset knows one company for it; see
        # the module docstring on 大社線.
        if len(bycount.get(ln, ())) == 1:
            cands.append(ln)
        forms[(co, ln)] = list(dict.fromkeys(cands))
        want += forms[(co, ln)]
    want = list(dict.fromkeys(want))
    print("  resolving %d candidate titles" % len(want))
    found = resolve_titles(want)
    print("  %d of them are articles" % len(found))
    save_cache(cache)      # nothing to lose yet, but the file exists from here

    # --- and what each pair got --------------------------------------------
    need_kana = []
    for co, ln in todo:
        rec = {"co": co, "line": ln, "ja": "", "en": "", "romaji": "", "via": "none"}
        for i, t in enumerate(forms[(co, ln)]):
            if t in found:
                rec["ja"] = t
                rec["en"] = found[t]
                rec["via"] = "company+line" if i == 0 else "bare name"
                break
        if rec["en"]:
            rec["romaji"] = en_name(rec["en"])
        elif rec["ja"]:
            need_kana.append(rec["ja"])
        cache[key(co, ln)] = rec

    if need_kana:
        need_kana = list(dict.fromkeys(need_kana))
        print("  %d have a Japanese article only; reading the lede for furigana"
              % len(need_kana))
        kana = furigana(need_kana, cache, save_cache)
        for co, ln in todo:
            rec = cache[key(co, ln)]
            if rec["romaji"] or not rec["ja"]:
                continue
            r = romaji(kana.get(rec["ja"], ""))
            if r:
                rec["romaji"] = r
                rec["kana"] = kana[rec["ja"]]

    dropped = verify_bare(cache)
    if dropped:
        print("  refused %d bare-name hits that redirected elsewhere" % dropped)
    save_cache(cache)
    got = sum(1 for c, l in todo if cache[key(c, l)]["ja"])
    print("  wrote %s: %d of %d new pairs have an article"
          % (os.path.relpath(CACHE, ROOT), got, len(todo)))


if __name__ == "__main__":
    main()


def verify_bare(cache):
    """A bare-name hit that redirected is not to be trusted.

    The bare name is already restricted to names this dataset knows one company
    for, which stops 大社線 becoming JR West's. It does not stop a name from
    redirecting *somewhere else entirely*: asking ja.wikipedia for 大森線 lands
    on the Hakodate tram operator's article, so the line came out romanised
    "Hakodate Transportation" — the company, not the line — and 日田線 lands on
    日田彦山線, a later line that absorbed it.

    A redirect is the signal in both cases, and it means something different
    depending on how the title was built. For `company+line` it is benign and
    usually helpful: 東北線 redirects to 東北本線, which is the same railway
    under its full name. For a bare name it means the name alone did not have
    an article of its own, and whatever caught it is a guess. Those are dropped
    back to no article at all, which is the honest answer.
    """
    bare = [k for k, r in cache.items()
            if r.get("via") == "bare name" and r.get("ja")]
    if not bare:
        return 0
    titles = sorted({cache[k]["ja"] for k in bare})
    final = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        r = api("ja.wikipedia.org",
                {"action": "query", "titles": "|".join(chunk), "redirects": "1"})
        q = r.get("query", {})
        for m in (q.get("redirects") or []):
            final[m["from"]] = m["to"]
        for m in (q.get("normalized") or []):
            final.setdefault(m["from"], m["to"])
        time.sleep(0.6)
    dropped = 0
    for k in bare:
        t = cache[k]["ja"]
        if t in final and final[t] != t:
            cache[k].update({"ja": "", "en": "", "romaji": "",
                             "via": "bare name redirected, refused",
                             "redirected_to": final[t]})
            dropped += 1
    return dropped
