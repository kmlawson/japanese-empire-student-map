# Putting the map on your own server

The site is static — no PHP, no database, no build step on the server. Every
path in it is relative, so it works at a domain root, in a subdirectory, or off
a memory stick, without changing anything.

## The eleven files it needs

Nothing else in this repository is used at runtime. `texts/`, `tools/`,
`data/`, `occupation-maps/` and `reports/` are how the site is *made*; they are
not part of it.

| file | size | gzipped | when it loads |
|---|---:|---:|---|
| `index.html` | 16 KB | 5 KB | first |
| `styles.css` | 60 KB | 18 KB | first |
| `map.js` | 200 KB | 63 KB | first |
| `data.js` | 536 KB | 164 KB | first |
| `cities-gaz.js` | 96 KB | 23 KB | first |
| `japan-empire-map.svg` | 2.7 MB | 778 KB | first |
| `sources.html` | 52 KB | 19 KB | when the Sources page is opened |
| `japan-empire-map-admin.svg` | 1.1 MB | 328 KB | when Administrative is switched on |
| `japan-empire-map-fine.svg` | 636 KB | 129 KB | when the reader zooms deep into an island group |
| `japan-empire-map-roc.svg` | 700 KB | 244 KB | when the AMS province source is chosen in Layers |
| `admin.js` | 32 KB | — | only on option-click of Layers; leave it out if you would rather not ship the editing tools |

**About 6.1 MB in all, and about 1.8 MB over the wire with compression on.** A
first view costs roughly 1.05 MB gzipped; the other three SVGs are fetched only
if the reader asks for what is in them.

`japan-empire-map-standalone.html` is a single-file build for handing out
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
git sparse-checkout set --no-cone \
    /index.html /sources.html /styles.css /map.js /admin.js \
    /data.js /cities-gaz.js '/japan-empire-map*.svg'
```

That leaves exactly the eleven files. Then either point the domain at
`~/map-src` in the DreamHost panel, or keep the checkout separate from the web
root and copy into it:

```sh
rsync -a --delete --exclude '.git' ~/map-src/ ~/example.com/
```

**To update, afterwards:**

```sh
cd ~/map-src && git pull --depth 1 && \
  rsync -a --delete --exclude '.git' ~/map-src/ ~/example.com/
```

Save that as `~/update-map.sh`, `chmod +x` it, and it is one command from then
on. A DreamHost cron job (Panel → Goodies → Cron Jobs) will run it nightly if
you want the site to follow the repository on its own.

## The plain way: copy the files up

If you would rather not have git on the server at all, from your Mac:

```sh
rsync -avz --delete \
  index.html sources.html styles.css map.js admin.js data.js cities-gaz.js \
  japan-empire-map.svg japan-empire-map-admin.svg \
  japan-empire-map-fine.svg japan-empire-map-roc.svg \
  USER@SERVER:~/example.com/
```

SFTP with the same eleven files does the same job by hand.

## One `.htaccess` worth adding

DreamHost runs Apache and compresses HTML, CSS and JavaScript by default, but
**not SVG** — which is where three quarters of this site's weight is. Put this
in the web root:

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
  AddOutputFilterByType DEFLATE image/svg+xml application/json
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  # the map's data changes only when it is rebuilt, and index.html is small
  ExpiresByType image/svg+xml        "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
  ExpiresByType text/css             "access plus 7 days"
  ExpiresByType text/html            "access plus 10 minutes"
</IfModule>
```

The SVG line alone takes the opening view from about 2.9 MB to about 1.05 MB.
If you set the seven-day caches, remember that a reader who has been before
will keep the old map for a week after you update; shorten it to an hour or two
if you are pushing changes during a teaching week.

## Checked

A sparse checkout made exactly as above was served over plain HTTP and loaded
clean: 85 territories and 1,187 sub-units drawn, the Administrative layer
fetched and grafted on demand, no failed requests and no console errors.
