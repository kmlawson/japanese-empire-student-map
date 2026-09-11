"""The drawing half of a timetable bundle, and the timetable half.

A `*-trains.js` used to be one object with four parts, and for Korea the
timetable was 440 KB of the 1,185 — 37% of a file fetched before a single
line of track could be drawn. Nothing on screen needs it. The track, the
stations, the line names and their colours are the other 63%, and they are
what the reader is waiting for.

So the file is written twice: `kr-trains.js` keeps `lines`, `stations`,
`paths` and the rest, and `kr-times.js` carries `trains` alone, fetched when
something actually asks a question of the timetable — the clock, a line's
card, a station's departures.

**The one thing that stood in the way was `lineOwns`.** Which line owns a
stretch of track, and therefore what colour that stretch is drawn in, was
worked out at mount time by walking every stop of every train: `buildLines`
in trains.js counted, per pair of consecutive stops, how many trains of each
line ran over it, and gave the stretch to the line that ran the most. So the
*drawing* depended on the timetable, and deferring the timetable would have
left the network in one undifferentiated colour until it arrived.

It is computed here instead and shipped with the geometry. Korea's 786
stretches come to about 6 KB against the 440 it lets us defer, and the mount
no longer walks 21,789 stop rows to learn something a build can know.

tools/test/owns.js holds this against the runtime derivation for all three
networks, because a precomputed value that has drifted from the code it
replaced would show up as nothing worse than slightly wrong colours — which
is exactly the kind of wrong nobody notices. It compares against
`deriveOwns` in trains.js itself rather than against a third copy of the
rule, and puts the tie-break and the chain break to both implementations
directly, no real network having a tie to exercise them with.
"""
import json
import os


def line_owns(doc):
    """Which line owns each stretch of track, as `buildLines` works it out.

    Keyed "lo|hi" on the pair of station indices, low first. Returns
    (owns, shared) where `shared` is how many stretches more than one line
    ran over — the figure the build already prints.

    The two details that have to match the JavaScript exactly:

    * **A stop flagged 1 breaks the chain.** It is timed on another line's
      table, so the train's own path does not run through it.
    * **A station with no coordinate is stepped over, not stopped at.** 22 of
      Taiwan's 187 have none, and joining only table-consecutive pairs left a
      hole in the track wherever one stood. `prev` therefore holds the last
      *placed* station, not the last row.

    And the tie: JavaScript iterates an object's integer-like keys in
    ascending numeric order, and `buildLines` keeps the first strict maximum,
    so a stretch two lines ran equally often goes to the lower line index.
    `sorted()` with a strict `>` is the same rule.
    """
    stations = doc['stations']
    use = {}
    for t in doc['trains']:
        prev = -1
        for s in t['st']:
            fl = s[3] if len(s) > 3 and s[3] else 0
            if fl & 1:
                prev = -1
                continue
            idx = s[0]
            st = stations[idx] if 0 <= idx < len(stations) else None
            if not st or st.get('lon') is None:
                continue
            if prev >= 0 and prev != idx:
                k = '%d|%d' % (min(prev, idx), max(prev, idx))
                counts = use.setdefault(k, {})
                counts[t['li']] = counts.get(t['li'], 0) + 1
            prev = idx
    owns, shared = {}, 0
    for k in use:
        counts = use[k]
        if len(counts) > 1:
            shared += 1
        best, best_n = -1, -1
        for li in sorted(counts):
            if counts[li] > best_n:
                best_n, best = counts[li], li
        owns[k] = best
    return owns, shared


def write(out_js, out_times, var_name, doc, head, note):
    """Write the pair, and say what each cost.

    `var_name` is the geometry's — `TW_TRAINS` — and the timetable's is the
    same name with TRAINS swapped for TIMES, so the two are obviously a pair
    in the file as well as on disk.

    `sharedN` goes with `owns` — how many stretches more than one line ran
    over, counted by the same pass. The runtime only reports it as a mount
    statistic, but shipping it means that figure stays measured rather than
    becoming a sentinel once the walk that produced it no longer runs.

    The timetable gets a header of its own saying what it holds and how to
    read a stop row, because a 455 KB file of bare arrays is otherwise
    unreadable to anyone who opens it.
    """
    owns, shared = line_owns(doc)
    times = doc['trains']
    geom = dict(doc)
    geom.pop('trains')
    geom['owns'] = owns
    geom['sharedN'] = shared

    times_var = var_name.replace('TRAINS', 'TIMES')
    with open(out_js, 'w', encoding='utf-8', newline='\n') as f:
        f.write(head)
        f.write('window.JMAP = window.JMAP || {};\n')
        f.write('JMAP.%s = ' % var_name)
        f.write(json.dumps(geom, ensure_ascii=False, separators=(',', ':')))
        f.write(';\n')
    with open(out_times, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* %s\n'
                ' * The timetable alone: %d trains, %d stop rows. Fetched when\n'
                ' * the reader asks the timetable a question -- runs the clock,\n'
                ' * opens a line, opens a station -- and not to draw the track,\n'
                ' * which is in the file beside this one.\n'
                ' * Stop rows are [station, arrival, departure, flags] in minutes\n'
                ' * from midnight, past 1440 meaning the small hours of the next\n'
                ' * day; flags are 1 timed on another line, 2 passes without\n'
                ' * stopping, 4 the printed reading is uncertain. The station is\n'
                ' * an index into `stations` in the geometry file. */\n'
                % (note, len(times), sum(len(t['st']) for t in times)))
        f.write('window.JMAP = window.JMAP || {};\n')
        f.write('JMAP.%s = ' % times_var)
        f.write(json.dumps(times, ensure_ascii=False, separators=(',', ':')))
        f.write(';\n')

    kb = lambda p: os.path.getsize(p) / 1024.0
    print('owns       %d stretches, %d run over by more than one line'
          % (len(owns), shared))
    print('wrote      %s (%.0f KB) + %s (%.0f KB deferred, %.0f%% of the pair)'
          % (os.path.basename(out_js), kb(out_js),
             os.path.basename(out_times), kb(out_times),
             100.0 * kb(out_times) / max(1.0, kb(out_js) + kb(out_times))))
    return owns
