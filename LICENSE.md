# Licence

There are two different kinds of thing in this repository and they are not
under the same terms. The short version: the work done here is public domain,
no copyright is claimed over any of the map sources, and attribution for the
georeferencing is asked for but not required.

## 1. The work done here — public domain

Everything written for this project is dedicated to the public domain under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). That
covers:

* **the code** — `map.js`, `admin.js`, `styles.css`, `index.html`, and
  everything under `tools/`;
* **the prose** — everything under `texts/`, and the `data.js`, `sources.html`
  and `SOURCES.md` built out of it;
* **the georeferencing, tracing and clipping** described in `SOURCES.md`: the
  work of putting drawn sheets on the ground, chaining open coastlines back
  into islands, cutting shapes to the frontiers of a particular date, and
  deciding which shape stands for which place on which map. This includes the
  tracing of the North China Area Army's security map of September 1942 and of
  the occupied zone in China.

To the extent possible under law, the author waives all copyright and related
or neighbouring rights in that work. Copy it, change it, republish it, teach
from it, sell it — no permission is needed and no conditions attach.

## 2. The map sources — no copyright is claimed over any of them

None of the underlying map data originates here, and **no copyright over any of
it is claimed by this project**. Every source keeps whatever terms its own
author put on it, and nothing above alters them in any way.

`SOURCES.md` names every source with its licence and a link, and
`occupation-maps/README.md` does the same for the scanned sheets. In summary:

| | |
|---|---|
| **Public domain** | Natural Earth's 1:10m vectors; the AMS *China 1900–1949* sheet the occupied zone is traced from |
| **CC BY 4.0** | ENP-China's provincial boundaries, 1928–1945 (© 2021 ENP-China Project, Aix-Marseille University); geoBoundaries ADM1 and ADM2 |
| **CC BY-SA 4.0** | the Republican provinces traced by Wikimedia Commons user Lilauid; Xufanc's *Saharat Thai Doem* map |
| **ODbL** | OpenStreetMap — © OpenStreetMap contributors. The fine coastline geometry drawn from it is a Produced Work under that licence |

Where a shape in this repository is derived from one of those, **the source's
conditions travel with the shape**. A share-alike source stays share-alike; an
attribution source still has to be attributed. The dedication in section 1
cannot release anyone from those obligations and does not attempt to. If you
are taking geometry rather than code, read `SOURCES.md` first and find out
which source it came from.

## 3. A request, not a condition

CC0 asks for nothing, and this asks for nothing either. It is a request, and
you are free to ignore it without asking.

If you use this map, or shapes taken out of it, please acknowledge the
**georeferencing**. That is where most of the time here went: not in drawing
new borders, but in working out where somebody else's drawing actually sits on
the earth, and in reconciling half a dozen sources that disagree by a
kilometre or two about the same coast. Something like

> Georeferencing and tracing: Konrad Lawson, *An interactive map of the
> Japanese Empire*.
> https://github.com/kmlawson/japanese-empire-student-map

is plenty.

Where the shape came from a source that has its own attribution requirement,
that requirement is the one that must be met. This request is in addition to
it and is no substitute for it.
