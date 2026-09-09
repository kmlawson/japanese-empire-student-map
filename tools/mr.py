"""McCune-Reischauer, from hangul.

    python3 tools/mr.py --check      # against the station table
    python3 tools/mr.py 경부선        # one name

**Why a transliterator and not a hand-written list.** The Korean line names on
this map were in Revised Romanization -- Gyeongbu, Jeolla, Bakcheon -- and the
map is McCune-Reischauer everywhere else: the stations carry it from the source
database, the provinces are Chŏllanam-do and Kyŏnggi-do, the cities are Pusan
and Kaesŏng. One name written two ways in one strip is the map contradicting
itself.

Converting *from* Revised Romanization is the wrong direction and would be a
guess: RR's `eo` is MR's `ŏ` reliably, but RR `g` is MR `k` or `g` depending on
where it stands, and RR spells no aspiration at all -- `cheon` is 천 (ch'ŏn)
and also 전 (chŏn) is `jeon`, and the two collapse in places. Hangul carries
what is needed and the tables are keyed by hangul, so this reads that.

**It is checked rather than trusted.** `kr-stations.js` holds 1,302 stations
with both the hangul and a McCune-Reischauer reading taken from the source
database and checked by the people who built it. `--check` runs this over every
one of them and prints what it gets wrong. That is a real test of the rules on
real names, and it is why this file can be used on the line names, which have
no such reading to check against.

**Where it stands: 848 of 850, and the two it misses are the same rule.**
팔당 is P'altang and 율동 Yultong, where ㄹ followed by ㄷ is tense and written
`t` rather than the `d` a voiced position would give. Whether a Sino-Korean
compound tenses there is a fact about the word and not about its hangul, so no
rule over these letters can get it right; a list of exceptions could, and there
is no call for one while the only two known cases are station names that
already carry their reading from the source. If this is ever used on a name
with ㄹㄷ in it, check that name by hand.
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# The jamo, in Unicode order. A syllable is (initial, vowel, final).
INITIALS = list("ㄱㄲㄴㄷㄸㄹㅁㅂㅃ"
                "ㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ")
VOWELS = list("ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘ"
              "ㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢ"
              "ㅣ")
FINALS = [""] + list("ㄱㄲㄳㄴㄵㄶㄷㄹㄺ"
                     "ㄻㄼㄽㄾㄿㅀㅁㅂㅄ"
                     "ㅅㅆㅇㅈㅊㅋㅌㅍㅎ")

VOWEL_ROM = {
    "ㅏ": "a",  "ㅐ": "ae", "ㅑ": "ya", "ㅒ": "yae",
    "ㅓ": "ŏ", "ㅔ": "e", "ㅕ": "yŏ", "ㅖ": "ye",
    "ㅗ": "o", "ㅘ": "wa", "ㅙ": "wae", "ㅚ": "oe",
    "ㅛ": "yo", "ㅜ": "u", "ㅝ": "wŏ", "ㅞ": "we",
    "ㅟ": "wi", "ㅠ": "yu", "ㅡ": "ŭ", "ㅢ": "ŭi",
    "ㅣ": "i",
}

# An initial at the head of a word, or after a consonant that does not voice it
INIT_PLAIN = {
    "ㄱ": "k", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "t", "ㄸ": "tt",
    "ㄹ": "r", "ㅁ": "m", "ㅂ": "p", "ㅃ": "pp", "ㅅ": "s",
    "ㅆ": "ss", "ㅇ": "", "ㅈ": "ch", "ㅉ": "tch",
    "ㅊ": "ch'", "ㅋ": "k'", "ㅌ": "t'", "ㅍ": "p'",
    "ㅎ": "h",
}
# The same initial between voiced sounds
INIT_VOICED = dict(INIT_PLAIN)
INIT_VOICED.update({"ㄱ": "g", "ㄷ": "d", "ㅂ": "b",
                    "ㅈ": "j"})

# A final, standing at the end of a word or before a consonant
FIN_PLAIN = {
    "": "", "ㄱ": "k", "ㄲ": "k", "ㄳ": "k", "ㄴ": "n",
    "ㄵ": "n", "ㄶ": "n", "ㄷ": "t", "ㄹ": "l",
    "ㄺ": "k", "ㄻ": "m", "ㄼ": "p", "ㄽ": "l",
    "ㄾ": "l", "ㄿ": "p", "ㅀ": "l", "ㅁ": "m",
    "ㅂ": "p", "ㅄ": "p", "ㅅ": "t", "ㅆ": "t",
    "ㅇ": "ng", "ㅈ": "t", "ㅊ": "t", "ㅋ": "k",
    "ㅌ": "t", "ㅍ": "p", "ㅎ": "t",
}
# A final that becomes something else before the next syllable's initial.
# Keyed (final, next initial) -> (final sound, initial sound). Only the
# assimilations that actually occur in place names are here; anything absent
# falls through to the plain pair, and `--check` is what says whether that is
# enough.
VOICING = set("ㄴㄹㅁㅇ")          # n l m ng: voice what follows


def split(ch):
    """A hangul syllable as (initial, vowel, final), or None."""
    o = ord(ch) - 0xAC00
    if o < 0 or o > 11171:
        return None
    return (INITIALS[o // 588], VOWELS[(o % 588) // 28], FINALS[o % 28])


def romanise(word):
    """One run of hangul, in McCune-Reischauer."""
    syls = [split(c) for c in word]
    if any(s is None for s in syls) or not syls:
        return None
    out = []
    for i, (ini, vow, fin) in enumerate(syls):
        prev = syls[i - 1] if i else None
        # the initial: voiced between a vowel or a voiced final and a vowel
        if i == 0:
            head = INIT_PLAIN[ini]
        else:
            pf = prev[2]
            voiced = (pf == "") or (pf in VOICING)
            head = (INIT_VOICED if voiced else INIT_PLAIN)[ini]
            head = assimilate_initial(pf, ini, head)
            # **`n` then `g` is not `ng`.** McCune-Reischauer parts them with
            # an apostrophe, or 전거리 and 정거리 would both be `chŏngŏri`.
            # It has to be decided here and not over the finished string:
            # what matters is that this `n` is a final ㄴ and that `g` is the
            # next syllable's own initial, and only this loop knows that. The
            # `ng` of a final ㅇ is one letter pair from one jamo and must
            # never be broken — the first try did exactly that and turned
            # 장흥 into `chan'ghŭn'g`.
            # Before `g` only. `n` before `h` needs no parting — there is no
            # `nh` digraph to be confused with — and the source database
            # writes 진해 Chinhae, 문화 Munhwa, 신흥리 Sinhŭngni without one.
            if out and out[-1] == "n" and head[:1] == "g":
                out.append("'")
        out.append(head)
        out.append(VOWEL_ROM[vow])
        # the final: what it sounds like before whatever comes next
        nxt = syls[i + 1][0] if i + 1 < len(syls) else None
        out.append(assimilate_final(fin, nxt))
    return "".join(out)


def assimilate_final(fin, nxt):
    """A final's sound, given the initial that follows it."""
    if not fin:
        return ""
    if nxt is None:
        return FIN_PLAIN[fin]
    # a stop before a nasal becomes the matching nasal: 백무 Paengmu,
    # 십만 simman, 국내 kungnae
    if nxt in ("ㄴ", "ㅁ"):                    # n, m
        if FIN_PLAIN[fin] == "k":
            return "ng"
        if FIN_PLAIN[fin] == "t":
            return "n"
        if FIN_PLAIN[fin] == "p":
            return "m"
    # ㄹ after ㄴ, and ㄴ after ㄹ, both become ll: 신라 Silla, 설날 Sŏllal
    if fin == "ㄴ" and nxt == "ㄹ":
        return "l"
    if fin == "ㄹ" and nxt in ("ㄴ", "ㄹ"):
        return "l"
    # ㄹ before ㅎ is written r, not l: 별하 Pyŏrha
    if fin == "ㄹ" and nxt == "ㅎ":
        return "r"
    # a stop before ㄹ nasalises and the ㄹ becomes n: 백리 paengni
    if nxt == "ㄹ":
        if FIN_PLAIN[fin] == "k":
            return "ng"
        if FIN_PLAIN[fin] == "p":
            return "m"
        if FIN_PLAIN[fin] in ("m", "ng"):
            return FIN_PLAIN[fin]
    # ㅎ before a stop aspirates it and is not written itself
    if fin == "ㅎ" and nxt in ("ㄱ", "ㄷ", "ㅂ", "ㅈ"):
        return ""
    # a final before ㅇ carries over to the next syllable, so it is written
    # there, not here
    if nxt == "ㅇ":
        return ""
    return FIN_PLAIN[fin]


def assimilate_initial(pf, ini, head):
    """An initial's sound, given the final before it."""
    # carried over from the previous syllable's final: 백암 Paegam, 목요 mogyo
    if ini == "ㅇ" and pf:
        carry = {"ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d",
                 "ㄹ": "r", "ㅁ": "m", "ㅂ": "b", "ㅅ": "s",
                 "ㅆ": "ss", "ㅇ": "ng", "ㅈ": "j",
                 "ㅊ": "ch'", "ㅋ": "k'", "ㅌ": "t'",
                 "ㅍ": "p'", "ㅎ": "h",
                 "ㄳ": "kk", "ㄵ": "nj", "ㄶ": "nh",
                 "ㄺ": "lg", "ㄻ": "lm", "ㄼ": "lb",
                 "ㄽ": "ls", "ㄾ": "lt'", "ㄿ": "lp'",
                 "ㅀ": "lh", "ㅄ": "ps"}
        return carry.get(pf, head)
    # ㅎ before a stop aspirates it: 좋다 chot'a, 국화 kukhwa -> kukhwa
    if pf == "ㅎ" and ini in ("ㄱ", "ㄷ", "ㅂ", "ㅈ"):
        return {"ㄱ": "k'", "ㄷ": "t'", "ㅂ": "p'",
                "ㅈ": "ch'"}[ini]
    # **ㄹ after ㄴ or ㄹ is ll, and this has to be asked before the rule
    #   below it.** 신리 is Silli and 수철리 Such'ŏlli; asked the other way
    #   round the stop-before-ㄹ rule answered first and gave silni, such'ŏlri.
    if ini == "ㄹ" and pf in ("ㄴ", "ㄹ"):
        return "l"
    # and ㄴ after ㄹ the same way round: 월내 Wŏllae
    if ini == "ㄴ" and pf == "ㄹ":
        return "l"
    # a stop before ㄹ turns the ㄹ into n: 백리 paengni
    if ini == "ㄹ" and pf and FIN_PLAIN[pf] not in ("l", ""):
        return "n"
    # after a stop, a following plain consonant is tense but MR does not write
    # tension; it stays as the plain letter
    return head


def name(word):
    """A whole string: hangul runs romanised, everything else left alone."""
    out = []
    for run in re.split(r"([가-힣]+)", word):
        if run and "가" <= run[0] <= "힣":
            r = romanise(run)
            out.append(r if r else run)
        else:
            out.append(run)
    return "".join(out)


def check():
    """Every station that carries both a hangul name and a checked reading."""
    s = io.open(os.path.join(ROOT, "kr-stations.js"), encoding="utf-8").read()
    recs = [json.loads(m) for m in
            re.findall(r'\{"[^\n]*?\}(?=,\n|\n\])', s)]
    pairs = [(r["kr"], r["mr"]) for r in recs if r.get("kr") and r.get("mr")]
    bad = []
    for kr, mr in pairs:
        got = romanise(kr)
        if not got:
            continue
        if got.lower() != mr.lower():
            bad.append((kr, mr, got))
    print("%d station names with both; %d disagree (%.1f%% right)"
          % (len(pairs), len(bad), 100.0 * (len(pairs) - len(bad)) / len(pairs)))
    seen = {}
    for kr, mr, got in bad:
        seen.setdefault((mr, got), []).append(kr)
    for (mr, got), krs in sorted(seen.items(), key=lambda kv: -len(kv[1]))[:30]:
        print("   %-16s want %-18s got %-18s" % (krs[0], mr, got))
    return len(bad)


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(1 if check() else 0)
    for w in sys.argv[1:]:
        print("%s  ->  %s" % (w, name(w)))
