# Amakarita

Mobile app for traditional Rwandan card decks, built with Expo (React Native).

The main goal is teaching the Kinyarwanda printed on every card; the games
are how people practise it.

- **Amakarita** (question game): draw a card, answer its question, score
  the card's value. The phone checks the answer, or players ask each other
  out loud. Rules at the top of `src/game/quiz.ts`.
- **Matatu** (Amagande): 2–6 players, 4–7 cards each, rounds until one
  player is left. Rules at the top of `src/game/matatu.ts`.
- **Card of the day** on the home screen, and every card's question in the
  deck browser.
- Amaturufu (rules in `src/game/amaturufu.ts`) and Ibisakuzo are switched
  off for now.

## Questions

`tools/make_questions.py` turns every card into a question using the card's
own words with the answer left blank, and writes `src/data/questions.json`.
Corrections from the deck's author go into its `OVERRIDES`.

## Running the app

```sh
npm install
npx expo start          # scan the QR code with Expo Go on a phone
npm test                # game-rule tests
npm run typecheck
npm run lint
npm run export:web      # browser build in dist/
```

## Code

- `src/game/` — game rules, with no screen code: one file per game
  (`matatu.ts`, `amaturufu.ts`), a computer player for each (`*Bot.ts`),
  tests in `__tests__/`.
- `src/screens/` — the app's screens; `useMatatuTable.ts` and
  `useAmaturufuTable.ts` run a game (computer turns, pauses, passing the
  phone, Matatu's hidden 10-second "Warning!" timer).
- `src/ui/` — shared building blocks: theme (colours, fonts, each deck's
  colours), question card, flip card, deck carousel, game tickets, tab bar.
- `src/i18n.tsx` — every piece of on-screen text in Kinyarwanda and English.
- `src/decks.ts` — loads the deck data and card images.

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

The app's own text uses Space Grotesk (Open Font Licence, bundled from
Google Fonts), chosen by the deck's author. The card designs themselves stay
images.

The designs use Bebas, Futura, Futura Book, Sink and Wosker (suited decks), and
Futura, KorpenTag (personal-use edition), Krunc and Parslay (Ibisakuzo). Fonts are
not included in this repository; the page images contain the rendered designs.
Licences need confirming before any font is bundled into the app.
