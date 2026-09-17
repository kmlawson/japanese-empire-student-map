# Putting the map on your own server

The site is static — no PHP, no database, no build step on the server. Every
path in it is relative, so it works at a domain root, in a subdirectory, or off
a memory stick, without changing anything.

## One folder: `deploy/`

Everything the web server needs is in **`deploy/`**, and nothing outside it is
used at run time — `texts/`, `tools/`, `data/`, `occupation-maps/` and
`reports/` are how the site is *made*, and the hand-written scripts at the
root (`map.js`, `annotate.js`, `admin.js`, `trains.js`, `air-play.js`) are
the *sources* of the comment-stripped copies the site serves from
`deploy/lean/`. Upload `deploy/` whole, as the web root or as a subdirectory;
every path inside it is relative. **`docs/UPLOAD.md` is the list of what it
holds** — every file, its size raw and gzipped, and what makes a reader's
browser ask for it — and the build refuses to run if a file the site can fetch
is missing from it. There was a second copy of that table here and it drifted;
there is one now.

In round figures, measured 17 September 2026 at update 372: the folder's
runtime files are about **30 MB**, of which `relief/` is 6.9 MB of WebP that
does not compress further and `timetable/` is 4 MB of printed tables opened
one at a time. **A first view costs 1.57 MB gzipped** — the page, the
stylesheet, `lean/map.js`, `data.js`, `cities-gaz.js` and the base SVG.
Everything else waits until the reader asks for what is in it. `gis/`, the
downloads linked from Sources, is a further 57 MB and nothing on the map
waits for it.

Beside them is `.htaccess`, which is not part of the site — the map works without
it — but which is what makes the compression above actually happen on Apache.
See the last section.

`stale/japan-empire-map-standalone.html` is a single-file build for handing out
offline. It is **not** part of the website and it goes stale — rebuild it with
`python3 tools/bundle.py` before you give it to anyone.

## The easy way: a sparse, shallow checkout you can `git pull`

Cloning the whole repository would pull about 420 MB of history and 159 MB of
working tree, most of it scanned maps and GIS caches. This pulls **8.4 MB**,
of which 2.3 MB is git's own metadata, and gives you a directory you can update
with one command afterwards.

On the DreamHost VPS, over SSH:

```sh
cd ~
git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/kmlawson/japanese-empire-student-map.git map-src
cd map-src
git sparse-checkout set deploy
```

That leaves `deploy/` and nothing else. Then either point the domain at
`~/map-src/deploy` in the DreamHost panel, or keep the checkout separate from
the web root and copy into it:

```sh
rsync -a --delete ~/map-src/deploy/ ~/example.com/
```

**To update, afterwards:**

```sh
cd ~/map-src && git pull --depth 1 && \
  rsync -a --delete ~/map-src/deploy/ ~/example.com/
```

Save that as `~/update-map.sh`, `chmod +x` it, and it is one command from then
on. A DreamHost cron job (Panel → Goodies → Cron Jobs) will run it nightly if
you want the site to follow the repository on its own.

## The plain way: copy the files up

If you would rather not have git on the server at all, from your Mac:

**Send `index.html` last.** It is the file that names the versions —
`map.js?v=1.34` — and the server ignores the `?v=`, so if the page goes up
before the script does, a reader arriving in the gap asks for `map.js?v=1.34`
and is handed the *old* `map.js`, which their browser then keeps under the new
name for a week. Two passes, everything else and then the page:

```sh
# from the repository root: everything but the two pages, then the pages
rsync -avz --exclude /index.html --exclude /sources.html --exclude .DS_Store \
  deploy/ USER@SERVER:~/example.com/

rsync -avz deploy/index.html deploy/sources.html USER@SERVER:~/example.com/
```

The window is a few seconds and it takes a reader arriving inside it, so this
is a small risk — but it is a silent one that lasts a week, and the cost of
avoiding it is one extra line.

SFTP with the same files does the same job by hand, in the same order. Note
that `.htaccess` is a dotfile and many SFTP clients hide it until you turn on
“show hidden files”.

## One `.htaccess` worth adding

DreamHost runs Apache and compresses HTML and CSS by default but **not SVG**,
which is where two thirds of this site's weight is. It is in the repository as
`.htaccess`: upload it beside `index.html` and there is nothing to type.

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain
  AddOutputFilterByType DEFLATE text/javascript application/javascript application/x-javascript
  AddOutputFilterByType DEFLATE image/svg+xml application/json
</IfModule>

<IfModule mod_mime.c>
  AddType image/svg+xml .svg
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  # the map's data changes only when it is rebuilt, and index.html is small
  ExpiresByType image/svg+xml          "access plus 7 days"
  ExpiresByType text/javascript        "access plus 1 hour"
  ExpiresByType application/javascript "access plus 1 hour"
  ExpiresByType text/css               "access plus 1 hour"
  ExpiresByType text/html              "access plus 10 minutes"
</IfModule>
```

**Both spellings of the JavaScript type are needed and an earlier version of
this file had only one.** A current Apache serves `.js` as `text/javascript`
and an older one as `application/javascript`; a rule naming only the second
matches nothing on a server using the first, and then `map.js`, `data.js` and
`cities-gaz.js` — 877 KB, which gzip takes to 261 KB — go down uncompressed
with nothing to show that anything is wrong. Checked against what a server
actually sends: `Content-type: text/javascript`.

The SVG line alone takes the opening view from about 2.9 MB to about 1.05 MB.

**The code is cached for an hour and the geometry for a week, and that split
matters.** `index.html` carries the version number and refreshes every ten
minutes. With `map.js` held for seven days a returning reader got a fresh page
reporting a fresh version over a week-old script — and the About dialog said so
with complete confidence. A bug that had been fixed and pushed was reported as
still present, with the version number backing the reporter up. An hour still
saves almost all of the traffic; the SVGs, which are two thirds of the weight
and change rarely, keep their week.

`map.js` also carries its own version stamp now, and About reports *that* one,
saying plainly when the two disagree — so a stale script announces itself
instead of lying.

**How the week is made safe.** `build_texts.py` writes the version onto every
script, stylesheet and SVG the pages ask for, and `map.js` puts it on everything
it fetches itself, so a release changes every URL and a browser holding last
week's copy is holding it under a name nothing asks for. `index.html` is the one
file that has to stay short-cached, because it is what carries the new names.

Two things this does **not** do, and both are worth knowing:

* **The key is a hash of each file's own contents, not the version number.**
  That matters: the version moves once per push, so keying on it meant a file
  edited and uploaded without a bump kept its old URL and readers kept the old
  file. A content hash cannot be forgotten — bump or not, an edited file gets a
  new name and an unedited one keeps its cache.
* **It relies on the upload order above.** See the two-pass `rsync`, and check
  it worked:

```sh
python3 tools/check_deploy.py https://example.com/path/to/the/map/
```

  That fetches the deployed page, reads the keys out of it and out of the
  deployed `map.js`, and fetches every file the site would — reporting whether
  each is present, served compressed, and **whose contents match the key it was
  asked for**. A mismatch is the upload-order trap, which is otherwise
  completely silent: no error, no 404, nothing in the console. Exit code 1 if
  anything is wrong, so it can go in a script.

## Checked

A sparse checkout made exactly as above was served over plain HTTP and loaded
clean: 85 territories and 1,293 sub-units drawn, the Administrative layer
fetched and grafted on demand, no failed requests and no console errors.
