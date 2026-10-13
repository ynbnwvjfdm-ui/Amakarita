# Amakarita

Mobile app for traditional Rwandan card decks. The app itself is not built yet;
this repository currently holds the six decks, taken in exactly as designed.

## Decks

| Deck | Format | Pages | Cards |
|---|---|---|---|
| Ntibavuga Bavuga | suited (52 + 2 jokers) | 56 | 54 |
| Ikeshamvugo (Inka n'amata) | suited (52 + 2 jokers) | 56 | 54 |
| Imvugo | suited (52 + 2 jokers) | 56 | 54 |
| Kirazira | suited (52 + 2 jokers) | 56 | 54 |
| Indangagaciro | suited (52 + 2 jokers) | 56 | 54 |
| Ibisakuzo | riddle (no suits or ranks) | 56 | 54 |

Suited PDFs: page 1 cover, pages 2–53 ♠ ♥ ♣ ♦ (2 → A each), 54–55 jokers,
56 back. Ibisakuzo: page 1 cover, page 2 introduction, pages 3–56 riddles.

## Layout

- `source/` — the original PDFs, byte-for-byte as uploaded. Source of truth.
- `assets/decks/<deck>/page-NN.webp` — every PDF page rendered at 1230×1680, lossless.
- `src/data/decks/<deck>.json` — card data; `index.json` lists the decks.
- `tools/extract_decks.py` — regenerates `assets/` and `src/data/` from `source/`.

## Card data

Text is stored exactly as printed: same spelling, punctuation and line breaks.
Nothing has been corrected or deduplicated.

```jsonc
{
  "id": "ntibavuga-bavuga-2S",
  "page": 2,
  "image": "assets/decks/ntibavuga-bavuga/page-02.webp",
  "kind": "number",            // number | jack | queen | king | ace | joker | riddle
  "rank": "2",                 // null for jokers and riddles
  "suit": "spades",            // null for jokers and riddles
  "text": "NTIBAVUGA CYAZE CYANGWA CYAKOZE\nBAVUGA ICYAKORA",
  "lines": [                   // one array per printed line
    [{ "text": "NTIBAVUGA ", "accent": false }, { "text": "CYAZE", "accent": true }, ...]
  ]
}
```

Joining a line's segment texts gives the printed line. `accent: true` marks
words printed in the deck's accent colour. Riddle cards carry `riddle` and
`answer` blocks in the same shape instead of `text`/`lines`.

`colors.ink` / `colors.accent` are naive CMYK→RGB conversions of the print
colours, so treat them as approximate; the page images are authoritative.

## Regenerating

```sh
python3 -I tools/extract_decks.py   # needs pdfplumber, Pillow, poppler-utils
```

The script checks every card's printed rank and suit colour against its
expected position and fails if anything is out of place.

## Fonts

The designs use Bebas, Futura, Futura Book, Sink and Wosker (suited decks), and
Futura, KorpenTag (personal-use edition), Krunc and Parslay (Ibisakuzo). Fonts are
not included in this repository; the page images contain the rendered designs.
Licences need confirming before any font is bundled into the app.
