"""What the four train builders share.

`build_tw_trains.py`, `build_kr_trains.py`, `build_kf_trains.py` and
`build_mn_trains.py` each read the station table the map draws, each read
`const NAME = <json>;` lines out of a transcription bundle, and two of them
patch the transcription project's own HTML page by asserted substitution. The
9 September and 15 September reviews both found the copies; this is the one
place they live now. Nothing here decides anything about a timetable -- it
reads, it parses, it patches, and every caller keeps its own judgement.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "deploy")


def read_stations(sys):
    """The map's own station table for a system, `deploy/<sys>-stations.js`.

    The file is JSON inside a JS wrapper -- `JMAP.X_STATIONS = [ ... ];` --
    with a trailing comma after every record, which is what lets a diff show
    one station at a time. The comma is stripped before parsing, so this reads
    the one-record-per-line files (kf, mn) and the wrapped-array ones (tw, kr)
    alike."""
    txt = open(os.path.join(SITE, "%s-stations.js" % sys), encoding="utf-8").read()
    body = txt[txt.index("["):txt.rindex("]") + 1]
    return json.loads(re.sub(r",\s*([\]}])", r"\1", body))


def grab(text, name):
    """One `const NAME = <json>;` line out of a transcription bundle."""
    m = re.search(r"^const %s = " % re.escape(name), text, re.M)
    if not m:
        raise SystemExit("no `const %s = ` in the bundle" % name)
    i = m.end()
    j = text.index("\n", i)
    return json.loads(text[i:j].rstrip().rstrip(";"))


def read_consts(path, names):
    """Several `const` lines from one bundle, as {name: value}."""
    text = open(path, encoding="utf-8").read()
    return {n: grab(text, n) for n in names}


class Patch:
    """A page patched by asserted substitution.

    Every `sub` insists on finding its target exactly `count` times, so a
    transcription project that changes its page fails the build instead of
    quietly shipping a page missing half of what was asked for. `what` names
    the patch in the message, because a failing substring is not a sentence."""

    def __init__(self, text, label="the page"):
        self.text = text
        self.label = label

    def sub(self, old, new, what, count=1):
        n = self.text.count(old)
        if count is not None and n != count:
            raise SystemExit("%s: %s -- expected %s of %r, found %d"
                             % (self.label, what, count, old[:60], n))
        self.text = self.text.replace(old, new)
        return self.text
