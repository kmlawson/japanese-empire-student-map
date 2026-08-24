# What to upload

Ten files. Nothing else in this repository is used at runtime — `texts/`,
`tools/`, `data/` and `occupation-maps/` are how the map is *made*, and
uploading them costs bandwidth and gives a reader nothing.

Put all ten in the same directory. Every path in the site is relative, so it
works at a domain root, in a subdirectory, or off a memory stick, with nothing
to configure.

## The files

| file | size | gzipped | when it loads |
| --- | ---: | ---: | --- |
| `index.html` | 12 KB | 5 KB | first |
| `styles.css` | 57 KB | 18 KB | first |
| `map.js` | 219 KB | 69 KB | first |
| `data.js` | 564 KB | 169 KB | first |
| `cities-gaz.js` | 94 KB | 23 KB | first |
| `japan-empire-map.svg` | 2,784 KB | 797 KB | first |
| `japan-empire-map-admin.svg` | 1,159 KB | 327 KB | when **Administrative** is pressed |
| `japan-empire-map-fine.svg` | 635 KB | 128 KB | on a deep zoom, for the fine coastlines |
| `japan-empire-map-roc.svg` | 698 KB | 243 KB | if the reader switches China's province source |
| `sources.html` | 48 KB | 18 KB | from the link in About |
| **total** | **6.1 MB** | **1.8 MB** | |

Only the first six are fetched before the map is on screen: **3.7 MB raw,
1.08 MB gzipped**. The other four wait until something asks for them, and a
reader who never presses Administrative never downloads it.

## Serve them gzipped

The map is 1.8 MB compressed against 6.1 MB raw, so this is the one server
setting worth checking. Most hosts do it for `.html`, `.css` and `.js` already
and forget `.svg`, which is where two thirds of the weight is. If your host has
a switch for "compress SVG" or a MIME list to add `image/svg+xml` to, use it.

GitHub Pages, Netlify, Cloudflare Pages and Vercel all do this without being
asked.

## Checking it worked

Open the page and press each of **Cities**, **Events**, **Administrative** and
**Other**, then switch to **Dec 1942** and zoom in a long way. That exercises
every file in the list: Administrative pulls the admin sheet, a deep zoom pulls
the fine coastlines, and the province-source radio in Layers pulls the ROC one.
If the console stays empty, everything it needs is there.

That is how the list above was arrived at rather than guessed: the ten files
were copied to an empty directory, served on their own, and put through exactly
that sequence — no failed requests, no console errors, 85 territories, 1,293
divisions, 127 city markers.

## If you would rather upload one file

```
python3 tools/bundle.py
```

writes `japan-empire-map-standalone.html`, which inlines the base map and needs
nothing beside it. It is a single large download with no deferred layers, so it
is slower to first paint and heavier for a reader who only wants a look — but
it is one file, and it works from a memory stick or an email attachment.

`DEPLOY.md` has the rest: URLs, caching headers, and putting it behind a
subdirectory.
