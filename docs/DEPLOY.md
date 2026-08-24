# Putting the map on your own server

The site is static — no PHP, no database, no build step on the server. Every
path in it is relative, so it works at a domain root, in a subdirectory, or off
a memory stick, without changing anything.

## The twelve files it needs, and one more worth adding

Nothing else in this repository is used at runtime. `texts/`, `tools/`,
`data/`, `occupation-maps/` and `reports/` are how the site is *made*; they are
not part of it.

| file | size | gzipped | when it loads |
|---|---:|---:|---|
| `index.html` | 12 KB | 5 KB | first |
| `styles.css` | 57 KB | 18 KB | first |
| `map.js` | 219 KB | 69 KB | first |
| `data.js` | 564 KB | 169 KB | first |
| `cities-gaz.js` | 94 KB | 23 KB | first |
| `japan-empire-map.svg` | 2.8 MB | 797 KB | first |
| `sources.html` | 48 KB | 18 KB | when the Sources page is opened |
| `japan-empire-map-admin.svg` | 1.1 MB | 327 KB | when Administrative is switched on |
| `japan-empire-map-fine.svg` | 635 KB | 128 KB | when the reader zooms deep into an island group |
| `japan-empire-map-roc.svg` | 698 KB | 243 KB | when the AMS province source is chosen in Layers |
| `annotate.js` | 61 KB | 17 KB | when a reader presses Create or Load annotations in Layers |
| `admin.js` | 32 KB | — | only on option-click of Layers; leave it out if you would rather not ship the editing tools |

**About 6.1 MB in all, and about 1.8 MB over the wire with compression on.** A
first view costs roughly 1.05 MB gzipped; the other three SVGs are fetched only
if the reader asks for what is in them.

Twelfth is `.htaccess`, which is not part of the site — the map works without
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
git sparse-checkout set --no-cone \
    /index.html /sources.html /styles.css /map.js /admin.js /annotate.js \
    /data.js /cities-gaz.js /.htaccess '/japan-empire-map*.svg'
```

That leaves exactly those files and the `.htaccess`. Then either point the domain at
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
  index.html sources.html styles.css map.js admin.js annotate.js data.js cities-gaz.js .htaccess \
  japan-empire-map.svg japan-empire-map-admin.svg \
  japan-empire-map-fine.svg japan-empire-map-roc.svg \
  USER@SERVER:~/example.com/
```

SFTP with the same files does the same job by hand. Note that `.htaccess`
is a dotfile and many SFTP clients hide it until you turn on “show hidden
files”.

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
  ExpiresByType text/javascript        "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
  ExpiresByType text/css               "access plus 7 days"
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
If you set the seven-day caches, remember that a reader who has been before
will keep the old map for a week after you update; shorten it to an hour or two
if you are pushing changes during a teaching week.

## Checked

A sparse checkout made exactly as above was served over plain HTTP and loaded
clean: 85 territories and 1,293 sub-units drawn, the Administrative layer
fetched and grafted on demand, no failed requests and no console errors.
