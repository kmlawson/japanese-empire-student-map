# Korea 1938 timetable — bundle for the map

Built by `tools/export_map.py` in the Korea 1938 transcription project from `transcription/*.tt` (201 tables, all of the booklet) — this bundle carries the 103 Korean railway tables only: 1089 trains over 42 lines calling at 863 stations, 695 of them placed from the NIKH historical GIS of Korean railways (checked by 김종혁), with the track between consecutive stops traced along the 1942 line geometry (846 segments).

`data.js` declares STATIONS, TRAINS, PATHS and LINE_COLORS in the shape of the Taiwan 1936 bundle; `tables.html` is the printed tables, one per page, in 24-hour time. The Manchurian and Japanese pages, the aviation tables and the bus list are in the transcription project's `edition/` and `korea_1938.sqlite`.
