#!/usr/bin/env python3
"""Just enough Markdown for the two prose pages.

The About dialog and the Sources page are written in texts/pages/*.md and this
turns them into the HTML those two places expect. It is deliberately small —
the build has no dependencies and is not going to acquire one for two files —
and it handles only what those two pages use:

    # / ## / ###      headings
    paragraphs        blank-line separated
    * item            unordered lists, one level
    1. item           ordered lists, one level
    | a | b |         pipe tables, with the ---|--- rule under the header
    ---               a rule
    **bold**  *em*    inline emphasis
    `code`            inline code
    [text](href)      links
    <https://…>       bare autolinks
    <em>…</em>        raw HTML, passed through untouched

Anything it does not recognise it passes through, so a stretch of hand-written
HTML in the middle of a page still works.
"""

import re

BLOCK_HTML = re.compile(r"^\s*<(?:/?)(?:p|div|ul|ol|li|h[1-6]|details|summary"
                        r"|table|tr|td|th|blockquote|section|figure)\b")


def render(src, indent=0, drop_h1=False):
    """Markdown to HTML, indented by `indent` spaces for the file it lands in."""
    out = []
    for kind, payload in blocks(src):
        if kind == "heading":
            level, text = payload
            if level == 1 and drop_h1:
                continue
            out.append("<h%d>%s</h%d>" % (level, inline(text), level))
        elif kind == "rule":
            out.append("<hr>")
        elif kind in ("list", "ordered"):
            tag = "ul" if kind == "list" else "ol"
            items = "".join("\n  <li>%s</li>" % inline(i) for i in payload)
            out.append("<%s>%s\n</%s>" % (tag, items, tag))
        elif kind == "table":
            head, rows = payload
            cells = "".join("<th>%s</th>" % inline(c) for c in head)
            body = "".join(
                "\n  <tr>%s</tr>"
                % "".join("<td>%s</td>" % inline(c) for c in r) for r in rows)
            out.append('<div class="scroll"><table>\n  <tr>%s</tr>%s\n'
                       "</table></div>" % (cells, body))
        elif kind == "html":
            out.append(payload)
        else:
            cls, text = payload
            attr = ' class="%s"' % cls if cls else ""
            out.append("<p%s>%s</p>" % (attr, inline(text)))
    pad = " " * indent
    body = "\n\n".join(out)
    if not pad:
        return body
    return "\n".join(pad + l if l.strip() else l for l in body.split("\n"))


def blocks(src):
    """Walk the source, yielding (kind, payload) a block at a time."""
    lines = src.replace("\r\n", "\n").split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        # a comment of the writer's own, not for the page
        if line.lstrip().startswith("<!--"):
            while i < len(lines) and "-->" not in lines[i]:
                i += 1
            i += 1
            continue
        m = re.match(r"(#{1,6})\s+(.*)$", line)
        if m:
            yield "heading", (len(m.group(1)), m.group(2).strip())
            i += 1
            continue
        if re.fullmatch(r"\s*([-*_])\s*(\1\s*){2,}", line):
            yield "rule", None
            i += 1
            continue
        if line.lstrip().startswith("|"):
            rows = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append([c.strip() for c in
                             lines[i].strip().strip("|").split("|")])
                i += 1
            # the |---|---| rule under the header row is a separator, not data
            body = [r for r in rows[1:]
                    if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
            yield "table", (rows[0], body)
            continue
        bullet = (r"[*+-]" if re.match(r"\s*[*+-]\s+", line)
                  else r"\d+\." if re.match(r"\s*\d+\.\s+", line) else None)
        if bullet:
            items = []
            while i < len(lines) and re.match(r"\s*%s\s+" % bullet, lines[i]):
                item = [re.sub(r"^\s*%s\s+" % bullet, "", lines[i])]
                i += 1
                # a wrapped continuation line, indented or not
                while (i < len(lines) and lines[i].strip()
                       and not re.match(r"\s*(?:[*+-]|\d+\.)\s+", lines[i])
                       and not re.match(r"#{1,6}\s", lines[i])):
                    item.append(lines[i].strip())
                    i += 1
                items.append(" ".join(item))
            yield ("list" if bullet == r"[*+-]" else "ordered"), items
            continue
        if BLOCK_HTML.match(line):
            block = [line]
            i += 1
            while i < len(lines) and lines[i].strip():
                block.append(lines[i])
                i += 1
            yield "html", "\n".join(block)
            continue
        para = []
        while i < len(lines) and lines[i].strip():
            if re.match(r"(#{1,6})\s+", lines[i]) or re.match(r"\s*[*+-]\s+",
                                                              lines[i]):
                break
            para.append(lines[i].strip())
            i += 1
        text = " ".join(para)
        # {.lede} at the end of a paragraph gives it a class, which the
        # Sources page uses for its opening summary.
        m = re.search(r"\s*\{\.([\w-]+)\}$", text)
        cls = ""
        if m:
            cls, text = m.group(1), text[: m.start()]
        yield "para", (cls, text)


def inline(text):
    """Inline emphasis, code, links. Raw HTML in the source is left alone."""
    out = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "`":
            end = text.find("`", i + 1)
            if end > i:
                out.append("<code>%s</code>" % escape(text[i + 1:end]))
                i = end + 1
                continue
        if ch == "<":
            m = re.match(r"<((?:https?|mailto):[^>\s]+)>", text[i:])
            if m:
                url = m.group(1)
                out.append('<a href="%s">%s</a>' % (url, url))
                i += m.end()
                continue
            m = re.match(r"</?[A-Za-z][^>]*>", text[i:])
            if m:                      # raw HTML tag, kept as written
                out.append(m.group(0))
                i += m.end()
                continue
        if ch == "[":
            m = re.match(r"\[([^\]]*)\]\(([^)\s]+)\)", text[i:])
            if m:
                out.append('<a href="%s">%s</a>' % (m.group(2),
                                                    inline(m.group(1))))
                i += m.end()
                continue
        if text.startswith("**", i):
            end = text.find("**", i + 2)
            if end > i:
                out.append("<strong>%s</strong>" % inline(text[i + 2:end]))
                i = end + 2
                continue
        if ch == "*":
            end = text.find("*", i + 1)
            if end > i and text[i + 1:end].strip():
                out.append("<em>%s</em>" % inline(text[i + 1:end]))
                i = end + 1
                continue
        if ch == "&" and not re.match(r"&(#\d+|#x[0-9a-fA-F]+|\w+);", text[i:]):
            out.append("&amp;")
            i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def escape(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
