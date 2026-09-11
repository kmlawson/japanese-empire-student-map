"""The Japanese positions for the Korean timetable's connection stops.

A thin reader over tools/cache/kr-japan-stations.json, which
tools/link_kr_japan.py writes. Kept apart from that tool so the build does not
import a resolver it never runs: the cache is the contract, filling it is a
separate job, and a checkout without one builds exactly as it did before.

    import jp_link
    jl = jp_link.get_for(station_label, station_lines)
    if jl: rec['lon'], rec['lat'] = jl['lon'], jl['lat']

The key is the line as well as the name. 門司 is on both the 鹿兒島本線 and the
山陽本線 in these tables and they are different points; a name on its own would
give whichever was written last.
"""
import collections
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", "cache", "kr-japan-stations.json")

_by_line_name = None
_counts = collections.Counter()


def _load():
    global _by_line_name
    if _by_line_name is not None:
        return _by_line_name
    _by_line_name = {}
    if os.path.exists(CACHE):
        for v in json.load(open(CACHE, encoding="utf-8")).values():
            _by_line_name[(v["line"], v["station"])] = v
    return _by_line_name


def get_for(name, lines):
    """The position for this stop, on whichever of its lines the cache knows.

    A stop that is not in the cache — because no candidate was near its line,
    or because the clock refused the match — returns None and keeps whatever
    position the build already gave it. That is the "leave it out" case, and it
    leaves the line no worse than it was.
    """
    tab = _load()
    for ln in lines or ():
        hit = tab.get((ln, name))
        if hit:
            return hit
    return None


def count(key):
    _counts[key] += 1


def report():
    tab = _load()
    return {"cached": len(tab), "used": _counts["placed"]}
