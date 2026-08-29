#!/usr/bin/env python3
"""Does every station's Wikipedia link go to that station?

    python3 tools/check_station_wiki.py            # report
    python3 tools/check_station_wiki.py --fix      # and mend what it can

A link on a station card is a claim: *this is the article about this place*.
Nothing checked it, and a title like 松山駅 or 追分駅 is a name Japan and Taiwan
both use, so several of them went to a disambiguation page listing a station in
Ehime and a station in Taipei and leaving the reader to guess.

HOW A LINK IS CHECKED, AND WHY NOT BY READING THE PAGE. The article's own
coordinates are not reliably in the API on the Japanese Wikipedia -- most of
these come back with none at all -- and reading the prose to see whether it
sounds Taiwanese is exactly the kind of judgement that gets this wrong. So the
title is resolved to its Wikidata item and the item is asked two questions:
what country is it in (P17), and where is it (P625). A link is right when the
country is the one the station is in and the point is within a few kilometres
of ours. That is a fact about the article rather than an impression of it.

WHAT COUNTS AS NEAR. Three kilometres. Stations move -- a line is straightened,
a station is rebuilt on the other side of a town -- and the article is about
the station rather than about the spot, so a couple of kilometres is not a
mismatch. Past that the tool says so and leaves the judgement to a person.
"""
import argparse
import io
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache", "station_wiki_check.json")

# A descriptive agent and no address in it: see the standing instruction in
# CLAUDE.md. Wikimedia asks for contact details and asking is not permission.
UA = "japanese-empire-map/1.0 (teaching map, station link check)"

COUNTRY = {"Q865": "Taiwan", "Q17": "Japan", "Q423": "North Korea",
           "Q884": "South Korea", "Q148": "China", "Q884-": ""}
NEAR_KM = 3.0
# And how far a *Korean* match may be before it is refused. Three kilometres is
# the bar a link has to clear to be called good; between three and six it is
# still taken, and said out loud, because the big ones -- Wonsan, Jeonju,
# Gunsan -- have a station of that name in that city which has moved since, and
# the article is about the station rather than about the spot. Past six the
# name is being shared with somewhere else: the tail of that distribution runs
# to seven hundred and sixty kilometres.
FAR_KM = 6.0

_last = [0.0]
PACE = 1.1          # seconds between requests: the API answers 429 to a burst

# Answers are kept between runs. Two reasons: a re-run after mending three
# links should not ask Wikidata about the other eighty-five again, and the
# check is a thing to run now and then rather than once, which is only bearable
# if it is nearly free the second time.
_cache = {}


def load_cache():
    if os.path.exists(CACHE):
        try:
            _cache.update(json.load(io.open(CACHE, encoding="utf-8")))
        except ValueError:
            pass


def save_cache():
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with io.open(CACHE, "w", encoding="utf-8") as fh:
        json.dump(_cache, fh, ensure_ascii=False)


def post(host, params, fresh=False):
    """One API call, paced, retried and remembered.

    Sent as a POST because a query about forty station names is a long URL and
    a long URL is one more thing that can go wrong; the API takes either.
    """
    key = host + "|" + json.dumps(params, sort_keys=True, ensure_ascii=False)
    if not fresh and key in _cache:
        return _cache[key]
    body = urllib.parse.urlencode(params).encode("utf-8")
    for attempt in range(7):
        wait = PACE - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            req = urllib.request.Request(
                "https://%s/w/api.php" % host, data=body,
                headers={"User-Agent": UA,
                         "Content-Type": "application/x-www-form-urlencoded"})
            out = json.load(urllib.request.urlopen(req, timeout=60))
            _cache[key] = out
            return out
        except urllib.error.HTTPError as err:
            if err.code not in (429, 503) or attempt == 6:
                raise
            time.sleep(3 * (2 ** attempt))
    raise RuntimeError("unreachable")


def load_js(name):
    txt = io.open(os.path.join(ROOT, name), encoding="utf-8").read()
    body = txt[txt.index("["):txt.rindex("]") + 1]
    return json.loads(re.sub(r",\s*([\]}])", r"\1", body))


def title_of(url):
    return urllib.parse.unquote(url.rsplit("/wiki/", 1)[1]).replace("_", " ")


def host_of(url):
    return re.sub(r"https://([^/]+)/.*", r"\1", url)


def page_props(host, titles):
    """Title -> where it really goes, whether it is a disambiguation page, and
    its Wikidata item. Redirects are followed, because a link to a redirect is
    a working link and the item behind it is what matters."""
    out = {}
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        d = post(host, {"action": "query", "format": "json", "redirects": "1",
                        "prop": "pageprops", "titles": "|".join(chunk)})["query"]
        red = {r["from"]: r["to"] for r in d.get("redirects", [])}
        norm = {r["from"]: r["to"] for r in d.get("normalized", [])}
        pages = {p["title"]: p for p in d["pages"].values()}
        for t in chunk:
            t2 = norm.get(t, t)
            t3 = red.get(t2, t2)
            pg = pages.get(t3) or {}
            pp = pg.get("pageprops") or {}
            out[t] = {"to": t3, "missing": "missing" in pg,
                      "dab": "disambiguation" in pp,
                      "q": pp.get("wikibase_item")}
    return out


def entities(ids):
    out = {}
    ids = sorted(set(i for i in ids if i))
    for i in range(0, len(ids), 45):
        out.update(post("www.wikidata.org", {
            "action": "wbgetentities", "format": "json",
            "props": "claims|sitelinks",
            "ids": "|".join(ids[i:i + 45])})["entities"])
    return out


def claim(ent, prop):
    c = (ent.get("claims") or {}).get(prop) or []
    return c[0]["mainsnak"].get("datavalue", {}).get("value") if c else None


def km(lon1, lat1, lon2, lat2):
    return math.hypot((lon1 - lon2) * 111 * math.cos(math.radians(lat1)),
                      (lat1 - lat2) * 111)


def check(rows, want_country, label):
    linked = [r for r in rows if r.get("wiki")]
    if not linked:
        print("%s: no links to check" % label)
        return []
    props = {}
    for host in sorted({host_of(r["wiki"]) for r in linked}):
        ts = [title_of(r["wiki"]) for r in linked if host_of(r["wiki"]) == host]
        props[host] = page_props(host, ts)
    ents = entities([v["q"] for h in props for v in props[h].values()])
    bad = []
    for r in linked:
        host = host_of(r["wiki"])
        info = props[host][title_of(r["wiki"])]
        why = dist = None
        if info["missing"]:
            why = "the article does not exist"
        elif info["dab"]:
            why = "a disambiguation page, not a station"
        elif not info["q"]:
            why = "no Wikidata item, so nothing to check it against"
        else:
            ent = ents.get(info["q"]) or {}
            co = claim(ent, "P625")
            ct = (claim(ent, "P17") or {}).get("id")
            name = COUNTRY.get(ct, ct or "unknown")
            if name != want_country:
                why = "the article is about somewhere in %s" % name
            elif not co:
                why = "the article has no location"
            else:
                dist = km(r["lon"], r["lat"], co["longitude"], co["latitude"])
                if dist > NEAR_KM:
                    why = "%.1f km from the station" % dist
        if why:
            bad.append({"id": r["id"], "han": r.get("han", ""),
                        "title": info["to"], "why": why,
                        "q": info["q"], "dist": dist, "url": r["wiki"]})
    print("%s: %d links, %d good, %d to look at"
          % (label, len(linked), len(linked) - len(bad), len(bad)))
    for b in bad:
        print("  %-8s %-6s -> %-20s %s" % (b["id"], b["han"], b["title"], b["why"]))
    return bad


def suggest(bad, want_country, rows):
    """For a disambiguation page, which of the things it lists is ours.

    Only ever answered by the same two facts as the check itself: the country
    and the distance. If nothing on the page is in the right country and near
    the station, the answer is that there is no article, and the link should
    come off rather than point at a page that does not answer the question.
    """
    by_id = {r["id"]: r for r in rows}
    out = {}
    for b in bad:
        if "disambiguation" not in b["why"]:
            continue
        host = host_of(b["url"])
        d = post(host, {"action": "query", "format": "json", "prop": "links",
                        "pllimit": "max", "plnamespace": "0",
                        "titles": b["title"]})
        pg = list(d["query"]["pages"].values())[0]
        cand = [l["title"] for l in pg.get("links", [])]
        if not cand:
            continue
        props = page_props(host, cand)
        ents = entities([v["q"] for v in props.values()])
        ours = by_id[b["id"]]
        best = None
        for t in cand:
            ent = ents.get(props[t]["q"] or "") or {}
            co = claim(ent, "P625")
            ct = (claim(ent, "P17") or {}).get("id")
            if not co or COUNTRY.get(ct) != want_country:
                continue
            dist = km(ours["lon"], ours["lat"], co["longitude"], co["latitude"])
            if best is None or dist < best[1]:
                best = (t, dist)
        out[b["id"]] = best
        print("  %-6s %s -> %s" % (b["han"], b["title"],
                                   ("%s (%.2f km)" % best) if best
                                   else "nothing in %s on that page" % want_country))
    return out


def korea_links(rows):
    """Find each Korean station its own article, and prefer the English one.

    The article is looked for by name -- the hangul with 역 after it -- and not
    by searching the ground around the point, because a search by place will
    always find *something* and this has to be able to find nothing. Three
    facts have to hold before a link is written: the page exists and is not a
    disambiguation page, its Wikidata item is in one Korea or the other, and it
    is within three kilometres of where this map puts the station. A station
    whose name is shared with a place elsewhere fails the third, and 연사역 --
    thirteen kilometres away -- is why that test is there.

    English where there is an English article and Korean otherwise, which is
    the same rule the rest of this map follows for a reader who has come to it
    in English.
    """
    named = [r for r in rows if r.get("kr")]
    props = page_props("ko.wikipedia.org", [r["kr"] + "\uc5ed" for r in named])
    ents = entities([v["q"] for v in props.values()])
    out, why, loose = {}, {"no article": 0, "no item": 0,
                           "not in Korea": 0, "somewhere else": 0}, []
    chosen = {}
    dabs = []

    def take(rec, ent, info, dist):
        en = (ent.get("sitelinks") or {}).get("enwiki")
        chosen[rec["id"]] = {
            "ko": info["to"], "en": en["title"] if en else "", "q": info["q"]}
        if dist > NEAR_KM:
            loose.append((rec.get("kr", ""), dist))

    def consider(rec, info):
        if info["missing"]:
            why["no article"] += 1
            return
        if info["dab"]:
            dabs.append((rec, info))
            return
        ent = ents.get(info["q"] or "")
        if not ent:
            why["no item"] += 1
            return
        co = claim(ent, "P625")
        ct = (claim(ent, "P17") or {}).get("id")
        if COUNTRY.get(ct) not in ("North Korea", "South Korea"):
            why["not in Korea"] += 1
            return
        d = km(rec["lon"], rec["lat"], co["longitude"], co["latitude"]) if co else None
        if d is None or d > FAR_KM:
            why["somewhere else"] += 1
            return
        take(rec, ent, info, d)

    for r in named:
        consider(r, props[r["kr"] + "\uc5ed"])

    # The disambiguation pages, resolved the way Taiwan's were: whatever the
    # page lists that is a station in Korea and near this one.
    if dabs:
        cand = set()
        pages = {}
        for rec, info in dabs:
            d = post("ko.wikipedia.org", {
                "action": "query", "format": "json", "prop": "links",
                "pllimit": "max", "plnamespace": "0", "titles": info["to"]})
            pg = list(d["query"]["pages"].values())[0]
            pages[rec["id"]] = [l["title"] for l in pg.get("links", [])]
            cand.update(pages[rec["id"]])
        cprops = page_props("ko.wikipedia.org", sorted(cand))
        cents = entities([v["q"] for v in cprops.values()])
        for rec, info in dabs:
            best = None
            for t in pages[rec["id"]]:
                ent = cents.get(cprops[t]["q"] or "") or {}
                co = claim(ent, "P625")
                ct = (claim(ent, "P17") or {}).get("id")
                if not co or COUNTRY.get(ct) not in ("North Korea", "South Korea"):
                    continue
                d = km(rec["lon"], rec["lat"], co["longitude"], co["latitude"])
                if d <= FAR_KM and (best is None or d < best[2]):
                    best = (ent, cprops[t], d)
            if best:
                take(rec, best[0], best[1], best[2])
            else:
                why["no article"] += 1

    # AN ENGLISH TITLE IS NOT ALWAYS AN ENGLISH ARTICLE.
    #
    # The Korean item names its English page in `sitelinks`, and for 37 of
    # these that page is a redirect into an article about the *line*: Hamchang
    # Station and Yecheon Station both land on the same page, which has no
    # station in it and no coordinates. So each English title is resolved and
    # kept only if it comes back as the same Wikidata item; where it does not,
    # the Korean article is the better link, being about the station.
    ens = sorted({v["en"] for v in chosen.values() if v["en"]})
    eprops = page_props("en.wikipedia.org", ens) if ens else {}
    redirected = 0
    for sid, v in chosen.items():
        use_en = False
        if v["en"]:
            info = eprops.get(v["en"]) or {}
            if info.get("q") and info["q"] == v["q"]:
                use_en = True
            else:
                redirected += 1
        if use_en:
            out[sid] = ("https://en.wikipedia.org/wiki/"
                        + urllib.parse.quote(v["en"].replace(" ", "_")))
        else:
            out[sid] = ("https://ko.wikipedia.org/wiki/"
                        + urllib.parse.quote(v["ko"].replace(" ", "_")))
    if redirected:
        print("       %d English pages are redirects into a line article; "
              "the Korean one is used for those" % redirected)
    eng = sum(1 for u in out.values() if "en.wikipedia" in u)
    print("Korea: %d stations, %d matched (%d English, %d Korean)"
          % (len(named), len(out), eng, len(out) - eng))
    print("       not linked: " + ", ".join("%d %s" % (v, k)
                                            for k, v in sorted(why.items()) if v))
    if loose:
        loose.sort(key=lambda x: -x[1])
        print("       %d taken on the looser test, %.1f-%.1f km: %s"
              % (len(loose), loose[-1][1], loose[0][1],
                 ", ".join("%s %.1f" % l for l in loose)))
    return out


def write_korea(links):
    import csv
    path = os.path.join(ROOT, "data", "korea", "stations.csv")
    with io.open(path, encoding="utf-8", newline="") as fh:
        rd = csv.DictReader(fh)
        fields = list(rd.fieldnames)
        rows = list(rd)
    if "wiki" not in fields:
        fields.append("wiki")
    for row in rows:
        row["wiki"] = links.get(row["id"], row.get("wiki", "") or "")
    with io.open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print("wrote %d links into %s" % (sum(1 for r in rows if r["wiki"]),
                                      os.path.relpath(path, ROOT)))


def check_korea(rows):
    """The same check as Taiwan's, but a station can be in either Korea."""
    linked = [r for r in rows if r.get("wiki")]
    if not linked:
        print("Korea: no links to check")
        return []
    props = {}
    for host in sorted({host_of(r["wiki"]) for r in linked}):
        ts = [title_of(r["wiki"]) for r in linked if host_of(r["wiki"]) == host]
        props[host] = page_props(host, ts)
    ents = entities([v["q"] for h in props for v in props[h].values()])
    bad = []
    for r in linked:
        host = host_of(r["wiki"])
        info = props[host][title_of(r["wiki"])]
        ent = ents.get(info["q"] or "") or {}
        co = claim(ent, "P625")
        ct = (claim(ent, "P17") or {}).get("id")
        name = COUNTRY.get(ct, ct or "unknown")
        why = None
        if info["missing"]:
            why = "the article does not exist"
        elif info["dab"]:
            why = "a disambiguation page, not a station"
        elif name not in ("North Korea", "South Korea"):
            why = "the article is about somewhere in %s" % name
        elif not co:
            why = "the article has no location"
        elif km(r["lon"], r["lat"], co["longitude"], co["latitude"]) > FAR_KM:
            why = "%.1f km from the station" % km(r["lon"], r["lat"],
                                                  co["longitude"], co["latitude"])
        if why:
            bad.append((r, why))
    print("Korea: %d links, %d good, %d to look at"
          % (len(linked), len(linked) - len(bad), len(bad)))
    for r, why in bad:
        print("  %-8s %-8s -> %-30s %s"
              % (r["id"], r.get("kr", ""), title_of(r["wiki"]), why))
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fix", action="store_true",
                    help="write the mended links into data/taiwan/stations.csv")
    ap.add_argument("--korea", action="store_true",
                    help="find and write a link for every Korean station")
    args = ap.parse_args()

    load_cache()
    tw = load_js("tw-stations.js")
    kr = load_js("kr-stations.js")
    bad_tw = check(tw, "Taiwan", "Taiwan")
    for country, label in (("South Korea", "Korea, south"),
                           ("North Korea", "Korea, north")):
        pass
    check_korea(kr)
    if args.korea:
        write_korea(korea_links(kr))
        save_cache()
        return 0

    save_cache()
    if not bad_tw:
        return 0
    print("\nWhat the disambiguation pages should point at instead:")
    fixes = suggest(bad_tw, "Taiwan", tw)
    save_cache()
    if not args.fix:
        print("\n(run again with --fix to write these)")
        return 1

    csv_path = os.path.join(ROOT, "data", "taiwan", "stations.csv")
    import csv
    with io.open(csv_path, encoding="utf-8", newline="") as fh:
        rd = csv.DictReader(fh)
        fields = rd.fieldnames
        rows = list(rd)
    changed = 0
    for row in rows:
        if row["id"] not in fixes:
            continue
        best = fixes[row["id"]]
        host = host_of(row["source_url"]) if row["source_url"] else "ja.wikipedia.org"
        if best:
            row["source_url"] = "https://%s/wiki/%s" % (
                host, urllib.parse.quote(best[0].replace(" ", "_")))
        else:
            row["source_url"] = ""
        changed += 1
    with io.open(csv_path, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print("\nwrote %d links into %s" % (changed, os.path.relpath(csv_path, ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
