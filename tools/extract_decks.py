"""Extract card data and page images from the original deck PDFs in source/.

The PDFs are the source of truth and are not modified. For every page this
writes a lossless WebP image, and for every card the text exactly as printed
(line breaks kept), split into segments flagged as accent (highlighted) or not.

Also writes src/data/decks/images.ts, the bundler's list of page images
(deckPages[deck][page - 1]).

Usage: python3 -I tools/extract_decks.py
Requires: pdfplumber, Pillow, poppler-utils (pdftoppm).
"""

import json
import os
import subprocess
import sys
import tempfile

import pdfplumber
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DPI = 108  # 820x1120 pt pages -> 1230x1680 px

DECKS = [
    {"id": "ntibavuga-bavuga", "title": "Ntibavuga Bavuga", "pdf": "Ntibavuga_Bavuga_-_Cards.pdf", "format": "suited"},
    {"id": "ikeshamvugo", "title": "Ikeshamvugo", "subtitle": "Inka n'amata", "pdf": "Ikeshamvugo_-_Cards.pdf", "format": "suited"},
    {"id": "imvugo", "title": "Imvugo", "pdf": "Imvugo_-_Cards.pdf", "format": "suited"},
    {"id": "kirazira", "title": "Kirazira", "pdf": "Kirazira_-_Cards.pdf", "format": "suited"},
    {"id": "indangagaciro", "title": "Indangagaciro", "pdf": "Indangagaciro_-_Cards.pdf", "format": "suited"},
    {"id": "ibisakuzo", "title": "Ibisakuzo", "pdf": "Ibisakuzo_-_Cards.pdf", "format": "riddle"},
]

RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
SUITS = ["spades", "hearts", "clubs", "diamonds"]  # page order in every suited PDF
SUIT_CODE = {"spades": "S", "hearts": "H", "clubs": "C", "diamonds": "D"}
FACE = {"J": "jack", "Q": "queen", "K": "king", "A": "ace"}

BODY_FONTS = {"Bebas-Regular"}
RIDDLE_FONT = "Futura"
RANK_FONT = "SinkRegular"
TITLE_FONT = "Wosker-Regular"


def font(word):
    return word["fontname"].split("+")[-1]


def cmyk_hex(c):
    """Naive CMYK -> sRGB. Approximate: print colour profiles are not applied."""
    if c is None:
        return None
    if len(c) == 1:
        v = round(255 * c[0])
        return "#%02x%02x%02x" % (v, v, v)
    if len(c) == 3:
        return "#%02x%02x%02x" % tuple(round(255 * x) for x in c)
    cy, m, y, k = c
    return "#%02x%02x%02x" % tuple(round(255 * (1 - x) * (1 - k)) for x in (cy, m, y))


def words(page):
    return page.extract_words(x_tolerance=6, extra_attrs=["fontname", "size", "non_stroking_color"])


def group_lines(ws, tol=6):
    lines = []
    for w in sorted(ws, key=lambda w: (round(w["top"]), w["x0"])):
        if lines and abs(lines[-1][0]["top"] - w["top"]) <= tol:
            lines[-1].append(w)
        else:
            lines.append([w])
    return [sorted(l, key=lambda w: w["x0"]) for l in lines]


def is_accent(color, palette):
    """True when a word's colour is nearer the deck's accent than its ink.

    Nearest-match rather than equality: some files use two near-identical
    swatches for the same printed colour.
    """
    if palette is None:
        return False
    ink, accent = palette
    dist = lambda a, b: sum((x - y) ** 2 for x, y in zip(a, b))
    return dist(color, accent) < dist(color, ink)


def spaced(line):
    """Yield (separator, word). A colour change inside one printed word splits
    it into two pdfplumber words with no gap (e.g. N' + UMUCO), so spaces come
    from the measured gap: ~0.2 em between words, 0 within a word."""
    prev = None
    for w in line:
        sep = "" if prev is None or w["x0"] - prev["x1"] < 0.1 * prev["size"] else " "
        yield sep, w
        prev = w


def line_text(line):
    return "".join(sep + w["text"] for sep, w in spaced(line))


def segments(line, palette):
    """Concatenating the segment texts gives the printed line exactly."""
    segs = []
    for sep, w in spaced(line):
        acc = is_accent(w["non_stroking_color"], palette)
        if segs and segs[-1]["accent"] == acc:
            segs[-1]["text"] += sep + w["text"]
        else:
            if segs:
                segs[-1]["text"] += sep
            segs.append({"text": w["text"], "accent": acc})
    return segs


def block(lines, palette):
    return {
        "text": "\n".join(line_text(l) for l in lines),
        "lines": [segments(l, palette) for l in lines],
    }


def plain_text(ws):
    return "\n".join(line_text(l) for l in group_lines(ws))


def render(pdf_path, out_dir, deck_id):
    os.makedirs(out_dir, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", str(DPI), "-png", pdf_path, os.path.join(tmp, "p")], check=True)
        names = sorted(os.listdir(tmp))
        for name in names:
            n = int(name.split("-")[1].split(".")[0])
            Image.open(os.path.join(tmp, name)).save(
                os.path.join(out_dir, "page-%02d.webp" % n), "WEBP", lossless=True
            )
    return len(names)


def image_path(deck_id, n):
    return "assets/decks/%s/page-%02d.webp" % (deck_id, n)


def extract_suited(deck, pdf):
    pages = pdf.pages
    assert len(pages) == 56, (deck["id"], len(pages))

    # Accent colour = rank colour on the red suits (hearts, page 15).
    # Ink colour = rank colour on the black suits (spades, page 2).
    accent_raw = [w for w in words(pages[14]) if font(w) == RANK_FONT][0]["non_stroking_color"]
    ink_raw = [w for w in words(pages[1]) if font(w) == RANK_FONT][0]["non_stroking_color"]
    accent, ink = cmyk_hex(accent_raw), cmyk_hex(ink_raw)
    palette = (ink_raw, accent_raw)

    cards = []
    for i in range(52):
        n = i + 2
        suit, rank = SUITS[i // 13], RANKS[i % 13]
        ws = words(pages[n - 1])
        printed = [w["text"] for w in ws if font(w) == RANK_FONT]
        assert printed and all(r in (rank, rank[::-1]) for r in printed), (deck["id"], n, rank, printed)
        rank_hex = cmyk_hex([w for w in ws if font(w) == RANK_FONT][0]["non_stroking_color"])
        assert rank_hex == (accent if suit in ("hearts", "diamonds") else ink), (deck["id"], n, rank_hex)
        body = [w for w in ws if font(w) in BODY_FONTS]
        assert body, (deck["id"], n)
        cards.append({
            "id": "%s-%s%s" % (deck["id"], rank, SUIT_CODE[suit]),
            "page": n,
            "image": image_path(deck["id"], n),
            "kind": FACE.get(rank, "number"),
            "rank": rank,
            "suit": suit,
            **block(group_lines(body), palette),
        })
    for j, n in enumerate((54, 55)):
        ws = words(pages[n - 1])
        assert any(font(w) == TITLE_FONT and w["text"] == "JOKER" for w in ws), (deck["id"], n)
        body = [w for w in ws if font(w) in BODY_FONTS]
        cards.append({
            "id": "%s-joker%d" % (deck["id"], j + 1),
            "page": n,
            "image": image_path(deck["id"], n),
            "kind": "joker",
            "rank": None,
            "suit": None,
            **block(group_lines(body), palette),
        })

    def side(n):
        return {"page": n, "image": image_path(deck["id"], n), "text": plain_text(words(pages[n - 1]))}

    return {"colors": {"ink": ink, "accent": accent}, "cover": side(1), "back": side(56), "cards": cards}


def extract_riddles(deck, pdf):
    pages = pdf.pages
    assert len(pages) == 56, (deck["id"], len(pages))
    mid = float(pages[0].height) / 2
    cards = []
    for n in range(3, 57):
        ws = [w for w in words(pages[n - 1]) if font(w) == RIDDLE_FONT and w["size"] >= 20]
        top = [w for w in ws if w["top"] < mid - 100]
        bottom = [w for w in ws if w["top"] > mid + 100]
        assert top and bottom and len(top) + len(bottom) == len(ws), (deck["id"], n)
        cards.append({
            "id": "%s-%02d" % (deck["id"], n - 2),
            "page": n,
            "image": image_path(deck["id"], n),
            "kind": "riddle",
            "rank": None,
            "suit": None,
            "riddle": block(group_lines(top), None),
            "answer": block(group_lines(bottom), None),
        })
    ink = cmyk_hex([w for w in words(pages[2]) if font(w) == RIDDLE_FONT][0]["non_stroking_color"])

    def side(n):
        return {"page": n, "image": image_path(deck["id"], n), "text": plain_text(words(pages[n - 1]))}

    return {"colors": {"ink": ink, "accent": None}, "cover": side(1), "back": side(2), "cards": cards}


def main():
    index = []
    for deck in DECKS:
        pdf_path = os.path.join(ROOT, "source", deck["pdf"])
        rendered = render(pdf_path, os.path.join(ROOT, "assets", "decks", deck["id"]), deck["id"])
        with pdfplumber.open(pdf_path) as pdf:
            fonts = sorted({font(c) for p in pdf.pages for c in p.chars})
            size = {"width": float(pdf.pages[0].width), "height": float(pdf.pages[0].height)}
            data = (extract_suited if deck["format"] == "suited" else extract_riddles)(deck, pdf)
        out = {
            "id": deck["id"],
            "title": deck["title"],
            **({"subtitle": deck["subtitle"]} if "subtitle" in deck else {}),
            "format": deck["format"],
            "source": "source/" + deck["pdf"],
            "pageCount": rendered,
            "pageSize": size,
            "fonts": fonts,
            **data,
        }
        path = os.path.join(ROOT, "src", "data", "decks", deck["id"] + ".json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
            f.write("\n")
        index.append({k: out[k] for k in ("id", "title", "format", "pageCount")} | {"cardCount": len(out["cards"])})
        print("%-18s %2d pages  %2d cards  ink=%s accent=%s" % (
            deck["id"], rendered, len(out["cards"]), out["colors"]["ink"], out["colors"]["accent"]), file=sys.stderr)
    with open(os.path.join(ROOT, "src", "data", "decks", "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
        f.write("\n")
    write_image_map(index)


def write_image_map(index):
    """Metro bundles images only through literal require() calls, so list them all."""
    lines = [
        "// Generated by tools/extract_decks.py. Do not edit.",
        "",
        "export const deckPages: Record<string, number[]> = {",
    ]
    for deck in index:
        lines.append("  '%s': [" % deck["id"])
        for n in range(1, deck["pageCount"] + 1):
            lines.append("    require('../../../%s')," % image_path(deck["id"], n))
        lines.append("  ],")
    lines += ["};", ""]
    with open(os.path.join(ROOT, "src", "data", "decks", "images.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    main()
