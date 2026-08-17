# texts/

Every word the map shows. Names in each script, the date phrase under a name,
the notes, the legend labels, the epoch blurbs, and the About and Sources pages.
Nothing here is geometry and nothing here is code.

Edit these files and run:

```sh
python3 tools/build_texts.py
```

which writes the generated half of `data.js`, the About dialog inside
`index.html`, `sources.html`, and `SOURCES.md`. `tools/build_map.py` does not
need to run again — no shapes are involved — but `tools/bundle.py` does if you
want the standalone file to match.

Before this folder existed all of it lived in `data.js`, a 2,500-line file of
JavaScript object literals, and the same facts were written twice more by hand
in `sources.html` and `SOURCES.md`. Three copies of the sources list had already
drifted apart, and two records had quietly swallowed each other (see *What the
move turned up*, below).

## The two kinds of file

**CSV holds the short fields.** One row per record, one column per field. A
column that nothing in a file uses is simply left out, so the files stay
narrow. An empty cell means *absent*, which is not the same as
present-and-empty: a place with no `ja` cell shows no Japanese line at all,
rather than a blank one.

**Markdown holds the prose**, keyed to the CSV by the record's id:

```markdown
# China

> Manchuria, Jehol, Chahar, Suiyuan and Sinkiang are drawn as their own
> territories so each can be named, but in 1930 they are all the Republic.

## manchuria

Chinese territory in 1930, run by the Fengtien clique — Chang Tso-lin until
his assassination by Japanese officers in 1928 …
```

* `## key` starts a record's note. The key must match the `id` column (or the
  `key` column, for sub-units).
* The body **ships verbatim**, not rendered. Soft line wrapping is undone, so
  wrap the file however you like. `<em>` reaches the page as `<em>`.
* `> lines` are **commentary**: notes to whoever edits the file, never shown to
  a reader. This is where the explanations that used to be comments inside
  `data.js` live.
* `# Heading` is a divider, for finding your way down a long file. Also never
  shown.
* `{{reclaim}}` and any other `{{name}}` pulls in a shared sentence from
  `snippets.md`, so a caution said in five places is written once.

The two prose pages, `pages/about.md` and `pages/sources.md`, are the exception:
they *are* rendered, by `tools/md.py`, into the HTML those two places expect.

## What is where

| File | Holds |
|---|---|
| `epochs.csv` + `.md` | the two dates, and the paragraph each opens with |
| `categories.csv` | the legend: one row per category per epoch, with its colour |
| `site-categories.csv` | the two marker kinds, cities and events |
| `extent-1942.csv` | the label on the 1942 line of control |
| `browse.csv` + `.md` | the context cities, never asked about in the quiz |
| `snippets.md` | sentences reused in more than one note |
| `territories/1930.csv`, `1942.csv` + `.md` | one row per territory per epoch |
| `territories/sub-units/*.csv` + `.md` | the provinces, prefectures, residencies, states, divisions and islands — one file per group |
| `territories/sub-units/overrides-1930.csv`, `-1942.csv` | sub-units called something else on one of the two dates |
| `territories/sub-units/clusters.csv` | sub-units that should *not* light with their group in an epoch |
| `sites/sites.csv` + `.md` | the cities, ports, battles and incidents |
| `sites/overrides-1930.csv` + `.md` | what a city was in 1930, where that differs |
| `pages/about.md` | the About dialog |
| `pages/sources.md` | the Sources page, and `SOURCES.md` at the root |

The sub-units are split into 27 group files rather than one sheet of 485 rows —
`korea.csv`, `siam.csv`, `manchukuo.csv`, `aleutians.csv`, and so on — because
485 rows in one file is not a thing anyone can edit. The split is only for
editing: at build time they become a single table keyed by name.

## Columns

The ones that carry words:

| Column | Meaning |
|---|---|
| `id` / `key` | how the record is found. `id` for territories and sites, `key` for sub-units, and the key is the name the SVG carries in `data-prov` |
| `en` | English, as used at the time, with the present-day name after it in brackets where they differ |
| `ja` | Japanese in its imperial-period form |
| `zh` | Chinese in traditional characters |
| `ko` | Korean in hangul, with McCune–Reischauer in brackets |
| `orig` | the local endonym where it is neither Chinese nor Korean. Kept for reference; not shown |
| `when` / `date` | the one-line date phrase under the name |
| `rule` | who was actually in charge, where that needs saying separately |

And the ones that are structure rather than words — change these only if you
know what they do:

| Column | Meaning |
|---|---|
| `atoms` | which shapes in the SVG this record is drawn from, space separated |
| `cat` | which category colours it, matching an `id` in `categories.csv` |
| `lvl` | 1 basic, 2 intermediate, 3 advanced — what the quiz asks and what is labelled |
| `c` | an explicit colour, overriding the category's |
| `lights` | other records that light up with this one |
| `within` | the record this one sits inside, whose note shows underneath its own |
| `under` | what to call the parent on the tooltip's second line |
| `hatch` | diagonals across the fill: `us`, `brit`, `thai`, `occupied`, `raid` |
| `edge`, `edgeAtoms`, `edgeClip`, `edgeWidth` | a coloured frontier line, and the box it is drawn inside |
| `outline`, `outlineColor` | an outline round the whole record |
| `adminOnly` | drawn only when Administrative is on |
| `unseen` | no label, no highlight, no legend swatch |
| `lat`, `lon` | where a marker sits |
| `year` | the year a site is sorted by |

## The generator refuses rather than guesses

`tools/build_texts.py` stops, and says which file and which row, when:

* a territory has no note;
* two rows share an id, or a sub-unit name is in two group files;
* an override names a city or a sub-unit that does not exist;
* `{{something}}` names a snippet that is not in `snippets.md`;
* a number column holds something that is not a number.

Every one of those has been a real bug in this project, and each hid for months
in a file too long to read.

## What the move turned up

**`JMAP.PROVINCES` had two `Okinawa` entries.** One was the prefecture, one the
island in the fine coastline layer, and both shapes carry
`data-prov="Okinawa"`, so a single table cannot tell them apart. The
prefecture's came second in the file and silently replaced the island's, so the
line `Okinawa — Naha, and the battle of April–June 1945` was never once shown to
anybody. Only the prefecture's row is kept, so nothing on the map has changed;
`sub-units/ryukyus.md` records what was lost and what the fix is.

**Two records carried `when: ''`.** An empty date phrase reads the same as no
date phrase — `map.js` tests `rec.date || rec.when` — so the empty cell is
simply absent here, and the map is unchanged.
