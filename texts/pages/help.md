<!-- texts/pages/help.md — the ? dialog, spliced into index.html.
     Carved out of about.md: About is what the map *is* and where it comes
     from, and this is how to work it. They were one dialog and the reader
     who wanted to know which button drew a line had to scroll past the
     provenance to find out. The <h2> and the close button belong to the
     dialog and are not here. -->

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
* **Dates** - Optional **Start** and **End**, read leniently: `1937`, `Sept 1931` and `1941-12-08` all work. Once two dates are in play, a small clock appears on the map beside the zoom buttons: **‹** and **›** step through the dates at which something changes, showing only the marks that are in scope at that moment — together with every mark that carries no date at all, so the background of the argument stays put. **▶** runs it, two seconds a stage, and **×** puts everything back. The map does not move while it runs: you set the view, and the shapes appear and disappear over it.
* **Style** - Colour, weight, opacity, and for an area a separate fill. A **Point** can be one of twenty-five shapes, including military unit symbols and formation sizes. A **Line** can be dashed six ways and can label its own length, leg by leg or as a total. An **Arrow** can be curved, and can end in a solid head, a barbed one, an open one, a dot, or a bar meaning an advance that was stopped.
* **Text** - Drag out a box for a note. The **Description** fills it and the **Name** becomes a bold heading at the top; with no name the description starts at the top instead. Its three colours — text, box and border — can all be changed, and the size a little. **Scales** decides what happens when you zoom: off, the box keeps its size on screen, like a caption; on, it covers the same ground at every zoom and its text grows with it. Drag the corner to resize it, or the middle to move it.
* **Smooth** - Lines and areas can have their corners rounded off, by four degrees. The points you placed stay on the line; only the pieces between them bend.
* **Approximate areas** - An area can have a **Blurred** edge, which says "about here" rather than drawing a frontier the source never had.
* **Editing** - Click a mark to select it. Drag a corner to move it, drag the middle of an area to move the whole shape, right-click a corner to remove it, and press **Duplicate** for another one like it. Undo takes back one step, including the last corner of a shape you are still drawing.
* **Keeping it** - **Save file** writes a GeoJSON file. **Copy link** puts the whole set into a web address if it is small enough, and a counter above the buttons says how close you are. **Add file…** merges another set into this one rather than replacing it.
* **Sharing** - Someone who opens your link sees the marks locked, so a stray press cannot move them, and can read any of them by clicking. A pencil button unlocks the tools. Their own annotations are set aside, not overwritten, and one press brings them back.
