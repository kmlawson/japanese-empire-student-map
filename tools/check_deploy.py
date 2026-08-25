#!/usr/bin/env python3
"""Check that a deployed copy of the map is whole and in step.

    python3 tools/check_deploy.py https://froginawell.net/reference/japanese-empire/
    python3 tools/check_deploy.py https://kmlawson.github.io/japanese-empire-student-map/

Fetches the deployed `index.html`, reads the cache keys out of it and out of
the deployed `map.js`, and fetches every file the site would fetch — checking
that each one is present, that it is served compressed, and that **its contents
match the key it was asked for**.

WHY THIS EXISTS. The cache key on each URL is a hash of that file's contents,
so a release changes the URL of whatever changed. A server ignores the query
string, though — the filename is unchanged — so if `index.html` goes up before
`map.js` does, a reader arriving in that gap asks for `map.js?v=<new hash>`,
is handed the *old* `map.js`, and their browser keeps those bytes under the new
name for a week. Nothing about that is visible: no error, no 404, no warning in
the console. It is a few seconds' window, and it lasts.

Uploading the pages last is what avoids it, and `DEPLOY.md` says so. This is
how you find out whether it worked, and it takes one command.

Exit code 0 if everything matches, 1 if anything does not.
"""
import hashlib
import gzip
import io
import json
import re
import sys
import urllib.error
import urllib.request

UA = "japanese-empire-map/1.0 (deployment check)"


def fetch(url):
    """The bytes at a URL, and whether the server compressed them."""
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Encoding": "gzip",
    })
    with urllib.request.urlopen(req, timeout=45) as res:
        raw = res.read()
        gz = (res.headers.get("Content-Encoding") or "").lower() == "gzip"
        if gz:
            raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
        return raw, gz, len(raw)


def key_of(data):
    return hashlib.sha256(data).hexdigest()[:10]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__.strip().splitlines()[0] + "\n\nusage: "
                 "python3 tools/check_deploy.py <url of the site>")
    base = sys.argv[1]
    if not base.endswith("/"):
        base += "/"

    print("checking %s\n" % base)
    try:
        page, page_gz, _ = fetch(base)
    except urllib.error.URLError as err:
        sys.exit("could not fetch the page: %s" % err)
    page_text = page.decode("utf-8", "replace")

    # what the page asks for, and with which key
    refs = re.findall(r'\b(?:src|href)="([A-Za-z0-9_.-]+\.(?:js|css))\?v=([A-Za-z0-9.]+)"',
                      page_text)
    if not refs:
        print("  ! the page carries no cache keys at all — an old build, or a "
              "page that predates them")

    # and what map.js asks for on its own account
    asset_refs = []
    version = "?"
    m = re.search(r'<span id="jem-version">([^<]*)</span>', page_text)
    if m:
        version = m.group(1).strip()
    for name, _ in refs:
        if name == "map.js":
            break
    try:
        mjs, _, _ = fetch(base + "map.js")
        mtext = mjs.decode("utf-8", "replace")
        mv = re.search(r"var JEM_VERSION = '([^']*)'", mtext)
        ma = re.search(r"var JEM_ASSETS = (\{[^\n]*\});", mtext)
        if ma:
            asset_refs = sorted(json.loads(ma.group(1)).items())
        if mv and mv.group(1) != version:
            print("  ! the page says version %s and map.js says %s — one of "
                  "them did not go up" % (version, mv.group(1)))
    except urllib.error.URLError as err:
        print("  ! map.js could not be fetched: %s" % err)

    bad = 0
    checked = 0
    unhashed = []
    print("  %-30s %10s %9s  %s" % ("file", "bytes", "gzipped", "key"))
    print("  " + "-" * 62)
    for name, want in list(refs) + asset_refs:
        url = base + name + "?v=" + want
        try:
            data, gz, size = fetch(url)
        except urllib.error.URLError as err:
            print("  %-30s  MISSING  (%s)" % (name, err))
            bad += 1
            continue
        checked += 1
        got = key_of(data)
        # A key that is a content hash can be checked against the bytes. One
        # that is a version number — what earlier builds wrote — cannot be, and
        # saying so is the honest answer rather than calling it wrong.
        hashed = bool(re.fullmatch(r"[0-9a-f]{10}", want))
        if not hashed:
            unhashed.append(name)
            note = "   (a version key, not a content hash — cannot be checked)"
        elif got == want:
            note = ""
        else:
            bad += 1
            note = "   ← SERVED %s, WHICH IS NOT WHAT WAS ASKED FOR" % got
        print("  %-30s %10d %9s  %s%s" % (
            name, size, "yes" if gz else "NO", want, note))

    print()
    if not checked:
        print("  Nothing could be checked: the page names no files with keys.")
        print("  That is a build from before content-keyed URLs. Re-run")
        print("  `python3 tools/build_texts.py` and upload again.")
        return 1
    if bad:
        print("  %d of %d wrong.\n" % (bad, checked))
        print("  A file whose contents do not match the key it was asked for is")
        print("  the upload-order trap: the page went up before the file did, so")
        print("  a reader in that gap caches the old bytes under the new name —")
        print("  for a week, silently. Upload the file again and re-run this.")
        return 1
    if unhashed:
        print("  %d files checked for presence, %d of them keyed on the version"
              % (checked, len(unhashed)))
        print("  rather than on their contents, so they could be fetched but not")
        print("  verified. Rebuild and upload to key them on their contents.")
        return 0
    print("  %d files, all present and all matching their keys." % checked)
    print("  Nothing is being served under a name that does not describe it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
