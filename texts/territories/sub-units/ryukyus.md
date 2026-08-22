<!-- texts/territories/sub-units/ryukyus.md -->

> The chain north to south. Only the southern half is Okinawa Prefecture,
> annexed in 1879: the Ōsumi and Tokara groups and the Amami islands down to
> Yoronjima were Kagoshima, Amami as Ōshima-gun, and Yakushima and Tanegashima
> are not usually counted as Ryūkyū at all. The islands here are the ones the
> fine coastline layer draws when you zoom in on them, which is why there are
> so many and why the smallest of them are named at all.

> **Okinawa itself is missing from this list, and that is a defect, not a
> choice.** Two different shapes carry `data-prov="Okinawa"` — the prefecture,
> drawn when Administrative is on, and the island of Okinawa Hontō in the fine
> coastline layer. A sub-unit table is keyed by that one name, so the two
> cannot be told apart, and data.js used to hold an entry for each: the island's
> read `Okinawa — Naha, and the battle of April–June 1945`, and the
> prefecture's `Okinawa-ken`. The prefecture's came second in the file and
> silently replaced the island's, so the battle line was never once shown. Only
> the prefecture's row is kept here, in japan.csv, so that nothing on the map
> changes; the fix is to give the fine island a key of its own in
> tools/build_map.py, and then the battle can be named where a reader zooming
> in on Okinawa would look for it.

## Yakushima
