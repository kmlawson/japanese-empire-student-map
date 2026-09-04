# Korea 1938 timetable — bundle for the map

Built by `tools/export_map.py` in the Korea 1938 transcription project from `transcription/*.tt` (201 tables, all of the booklet) — this bundle carries the 173 Korean, Manchurian and Japanese railway and ferry tables (the connections drawn straight between city points): 1666 trains over 74 lines calling at 1302 stations, 782 of them placed (from the NIKH historical GIS of Korean railways, checked by 김종혁, or at the point of a city the map already draws), with the track between consecutive Korean stops traced along the 1942 line geometry (842 segments) and the connections as straight chords (87).

`data.js` declares STATIONS, TRAINS, PATHS, LINE_COLORS, CHORDS and APPROX_LINES in the shape of the Taiwan 1936 bundle; `tables.html` is the printed tables, one per page, in 24-hour time. The aviation tables and the bus list are in the transcription project's `edition/` and `korea_1938.sqlite`.
