<!-- texts/pages/about.md — the About dialog, spliced into index.html.
     The <h2> heading and the close button belong to the dialog itself and are
     not here; this file starts at the first paragraph. -->

## About this map

This interactive map is for exploring the geography of the Japanese Empire. It allows you to compare two moments: Japan's colonial empire in 1930, prior to the invasion of northeast China and the establishment of a nominally independent Manchurian state, and around December 1942, just after the peak of Japanese expansion in the Pacific War and not long before Japanese forces withdrew from the island of Guadalcanal. 

### How to use it

* **1930 / Dec 1942** — which map you are looking at. In 1930 the colours show whose empire each place belonged to, on the eve of the Manchurian Incident. In December 1942 they show how Japan held what it had taken. You may may also choose to view the general approximate extent of Japanese occupation in China (which hides the fragmented nature of that occupation), or switch to a layer which shows a version of a September, 1942 Japanese military report's depiction of so-called "pacified" and "un-pacified" areas.
* **Explore** — hover over, or tap, any territory or marker to see what it is, what it was called, when it changed hands, and why it matters. Many entries also provide links to Wikipedia entries when these are available.
* ** Cities, Events, Administrative boundaries, and other labels** - Buttons at the top of the screen allow you to toggle the visibility of cities, some historical events, administrative boundaries for some of the countries shown and other labels. These may be the same in the 1930 and 1942 maps or may differ somewhat.
* **Other Layers** - See the Layers pane for options to add or swap out layers to display.
* **Island Details** - Some islands will get swapped out with a more detailed as you zoom in closer to them. 
* **Annotations** - Draw your own marks over the map, name them, describe them and share them. See **Drawing your own annotations** below.
* **Links** - If you pan or zoom to a location, and copy the URL, it will keep the bounding box information in the link allowing the person you are sharing the link with to view roughly the same location you are looking at. Useful if you want to share a specific view. Click on the page title in the top left to load the default view.


### Drawing your own annotations

Open **Layers** and press **Create annotations**. Nothing is sent anywhere: the file is written by your own browser and read back by it, and a map you load stays on your machine. The tools need a reasonably wide screen and are not offered on a small one.

* **The four tools** - **Point** places a single mark, **Arrow** takes a start and an end, **Line** takes as many corners as you like, and **Area** closes into a shape. Press a tool once and it draws one thing and then steps back; press it a second time and it stays out until you put it away.
* **Naming and describing** - A **Name** is written on the map beside the mark, and can be kept off it for one mark without hiding the rest. A **Short note** is what the pointer shows. A **Description** is the longer account, and it opens in the panel on the right when the mark is clicked.
* **Dates** - Optional **Start** and **End**, read leniently: `1937`, `Sept 1931` and `1941-12-08` all work. Once two marks carry a date, a row of arrows appears that walks through them in order, moving the map to each in turn.
* **Style** - Colour, weight, opacity, and for an area a separate fill. A **Point** can be one of twenty-five shapes, including military unit symbols and formation sizes. A **Line** can be dashed six ways and can label its own length, leg by leg or as a total. An **Arrow** can be curved, and can end in a solid head, a barbed one, an open one, a dot, or a bar meaning an advance that was stopped.
* **Approximate areas** - An area can have a **Blurred** edge, which says "about here" rather than drawing a frontier the source never had.
* **Editing** - Click a mark to select it. Drag a corner to move it, drag the middle of an area to move the whole shape, right-click a corner to remove it, and press **Duplicate** for another one like it. Undo takes back one step, including the last corner of a shape you are still drawing.
* **Keeping it** - **Save file** writes a GeoJSON file. **Copy link** puts the whole set into a web address if it is small enough, and a counter above the buttons says how close you are. **Add file…** merges another set into this one rather than replacing it.
* **Sharing** - Someone who opens your link sees the marks locked, so a stray press cannot move them, and can read any of them by clicking. A pencil button unlocks the tools. Their own annotations are set aside, not overwritten, and one press brings them back.

### Caution Around the Maps

* Some of the coastlines, island shapes, and rivers are taken from the coastlines of today. This means you will be looking at coastlines and river courses in many, but not all cases, which are anachronistic and reflect land reclamation efforts, etc. 
* Georeferencing is tricky, and assembling georeferenced sources together is a matter of judgement and minute detail work, some of which was deferred in order to get this map to viewers earlier. You will notice in places that the borders between different units, drawn as they are from different historical maps, do not quite match up perfectly. These flaws will become increasingly visible as you zoom in.

### A Todo List

A few things planned but not yet implemented:

* **Missing Admin Boundaries** - There are still some places that have missing administrative units at the sub-national level, or which have not been carefully checked for period accuracy. 
* **More India Options** - While not key for a map on Japanese empire, the map could be more useful for students of European empire if the India side of the map better captured the multiple ways of depicting its complex territories.
* **More rivers** - Only two major rivers currently shown in China, and none of the important rivers that connect into it or others. Need to explore more what these look like at the time and which to include without cluttering the map up too much.
* **Events and Cities** - The current set is not great. More improvements in what settlements are shown and what events are depicted for both the 1930 and 1942 view.
* **Slides** - An option to walk through slides that jump from one point on the map to another, with custom descriptions, layer settings, and custom layers. Will be useful to walk someone through a series of events.
* **Sets** - A set of special extra layers that can be loaded, perhaps for use in combination with **slides**.
* **Annotate** - Allow the user to add their own dots, polygons, and custom labels (but this won't be saved on the server) and load/download a set of these.
* **Additional Moments** - I'd like to add two or three more moments. One early post-1945 early postwar moment, and at least one earlier moment in late 19th century or early 20th century. 
* **Topography** - This is hard in a simple SVG based map like this because performance of panning and zooming is heavily impacted by the data being loaded. However, it might be nice to add some kind of topography visibility. Needs careful feasibility testing.

_ 

### Sources and credits

**[See the sources used for this map here](sources.html)**. Some maps make use of existing GIS datasets, some modify these while comparing with historical maps, and some historical maps were georeferenced. 

Built with Anthropic's Claude, with [Konrad M. Lawson](https://muninn.net/) at the prompt, primarily as a tool for students in his University of St Andrews honours module, [MO3335](https://github.com/kmlawson/japanese-empire-mo3335/).

Code for the website may be found [here](https://github.com/kmlawson/japanese-empire-student-map).
