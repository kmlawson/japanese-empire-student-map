# A through train is printed once per line, and is still one train

*Why `build_mn_trains.py` joins table columns, and how it decides it may.*

## What the booklet does

The 滿洲・支那汽車時間表 is arranged **by line**. A train that runs over more
than one line is printed in each of their tables, with the same number, and
each printing shows only the part of the journey on that line.

Train **341** is the worked example — one service, Harbin to Chiamussu — and
it is in four tables:

| table | shown as | stops |
| --- | --- | ---: |
| 濱北線 | 哈爾濱 → 綏化 | 15 |
| 綏佳線, down | 哈爾濱 → 神樹 | 14 |
| 綏佳線, up | 綏化 → 佳木斯 | 18 |
| 綏佳線・鶴岡線 | 蓮江口 → 佳木斯 | 3 |

Read table by table, that is four trains. On the map it was four markers with
the same number crossing the same ground, and it was reported as *why are
there two train 341s*.

## And the day was wrong as well

The transcription's clock runs on from the top of **its own column**: a time
lower than the one above it is tomorrow's. That is right within a column and
wrong across them, because a column that begins in the middle of a journey
begins on the wrong day. 綏化 is `06.10` **tomorrow** in the pieces that start
at Harbin the previous evening, and `06.10` **today** in the piece that starts
at 綏化. So the copies were not merely doubled; they were a day apart, and at
08.03 two of them were running a hundred kilometres from each other.

## The test the build applies

Two columns are the same train when

1. they carry **the same number**, and
2. at a station they share, the times agree **to the minute once whole days
   are taken out** — `(a - b) % 1440 == 0`.

That is deliberately strict. Two genuinely different trains of one number
would have to call at the same station at the same minute; nothing in these
132 tables does. The difference `a - b` is also the answer to the day
question, so the same evidence that joins the columns also says how far to
shift them, and the merged train runs on one clock from its real origin.

Joining is transitive — the 濱北線 column joins the 綏佳線 down column, which
brings in the up column, which brings in the 鶴岡線 one — so a service is
gathered however many tables it is spread over.

**111 columns join** this way, taking 707 trains to 596. 341 comes out as one
train of 44 stops, 哈爾濱 23.50 to 佳木斯 22.50 the following day.

## What is left alone

A column that meets no other on this test stays as it is. That includes the
ordinary case of two unrelated trains sharing a number on different lines —
they share no station, so nothing joins them — and it includes anything the
transcription has too thinly to prove. The rule never guesses from geography,
from the destination field, or from the numbers being close: only from a
station and a clock.

The merged train keeps the line and direction of whichever column carried the
most of the journey, which is what the card names. For 341 that is the 綏佳線.
