# Handoff

Where the work stands, for whoever picks it up next (a new chat, or the author). Keep this file current: update it before every hand-over to a new chat.

_Last updated: 15 October 2026._

## Where things are

- **Working branch:** `claude/amaturufu`. Every new chat must start on this branch.
- **Pull requests (both drafts):**
  - #1 `claude/intake-card-decks` → `master`: the six decks as uploaded.
  - #2 `claude/amaturufu` → `claude/intake-card-decks`: the whole app.
- **`master` has only a `.gitignore`.** Until #1 and #2 are merged, a chat started from `master` sees none of the app. Merging is the author's decision.
- **Preview for the author:** https://claude.ai/artifact/YEgUa9g67n4gZA7bpPfa8x. It's a private claude.ai page with the `downloads` capability, so the share picture can be saved. How to update it is under "How to" below.
- **The author's Expo account:** `paintedblvck`. Expo Go 57 is installed on their iPhone and signed in to it.

## What the app has

The README has the full list and the rules of each game. In short:

- **Games:**
  - **Amakarita** question game (5/10/15 attempts, jokers).
  - **Matatu** (2–6 players, fines for wrong cards, "Gukata" pill).
  - **Ibisakuzo** riddles (two people, "Sakwe sakwe!" — "Soma!", the answer under a flap).
  - Amaturufu is built but switched off.
- **Learning:**
  - Saved progress per person (up to 8 profiles), using Leitner boxes.
  - Daily goal of 10 answers, with a streak.
  - Bronze, silver and gold medal per deck.
  - Points.
  - Answering cards in the deck browser.
  - Card of the day.
  - Daily review: "today's 10 cards" from Home (built 15 October).
- **Sharing:** "Sangiza" makes a picture of your progress drawn as a playing card.
- **Look:** card-first design in Space Grotesk; motion and haptics; a how-to-play guide for each game.
- **Feel (round 1 of the "smooth and fun" work, 15 October):** see "Motion" below.

## Decisions already made (don't reopen without the author)

- **Points:**
  - Each right answer is worth its card's value: number cards their number, J 11, Q 12, K 13, A 15, jokers 0.
  - Worked out from saved progress (`src/stats.ts`).
  - Riddle points stay inside the Ibisakuzo game.
- **Words:** "Amanota" only ever means points. The medal hint says "Hasigaye **amakarita** {n} ngo ubone…" because it counts cards.
- **Known card:** two right answers in a row (Leitner box 2).
  - Medals come at 25%, 60% and 100% of a deck known.
  - The streak counts days in a row with the daily goal met.
- **Deck browser:**
  - A card opens question-side up, because the printed card shows the answer.
  - Choosing an answer turns it over.
  - Choices are shuffled each time it opens.
  - Swipe for the next card.
  - Tapping the card turns it, with no on-screen hint (the author wants features found by playing).
- **Card of the day:** no hint pill; tapping turns it (hidden, same reason).
- **Ibisakuzo:**
  - The flap starts at 60% of the card's height. Measured over all 54 cards: the logo ends at 52.4% and the answers sit between 75.2% and 82.6%.
  - One point per right answer; players swap after every riddle.
- **Share card:**
  - A dark playing card on a dark plate.
  - The streak sits in the corners, points in the middle, a medal coin per deck.
  - Shared from a card, that card is shown in the app's lettering with the answer filled in.
- **Shadows:** on iPhone, cards use the native soft shadow over a backing in each page's edge colour (`tools/page_edges.py`). Box-shadow there ended in a hard line.
- **Setup screens:** one step per screen, never needing a scroll.
- **Motion** (author, 15 October: "everything must feel smooth, interactive and fun, for young people"). Done in rounds, each tried on the phone:
  - Round 1, done: touch and rewards. Every tappable thing sinks and springs back with a light tick (`Tap` in `src/ui/fx.tsx`, used instead of `Pressable` everywhere). Right answers get a medium burst of coloured bits and the points rise ("medium" was the author's choice: no full-screen confetti). Meeting the daily goal or winning a medal gets a bigger burst; medals spin in; numbers count up; progress bars fill; the streak flame pulses. The tab bar's lit square slides to the tapped tab. New screens slide in from the right, going back from the left, tabs fade.
  - Tabs stay tap-only (author's choice: no swiping between Ahabanza, Amakarita, Imikino).
  - Uses `react-native-reanimated` (with `react-native-worklets`), approved by the author; it is in Expo Go. Write shared values with `.get()`/`.set()`, which the lint accepts.
  - Floating effects carry `testID="fx"` so the overlap check skips them.
  - Round 2, next: swiping and scrolling (between decks, between games, smoother scrolling), then more creative touches. Ask the author first.
  - Everything honours the phone's "reduce motion" setting.
- **Daily review** (author's answers, 15 October):
  - Missed cards first, then half-learnt, then new, then known cards answered longest ago; all five decks; a new learner gets 10 new cards.
  - A card answered wrong comes back once after the 10.
  - The end screen offers "10 more" (never the same cards twice in one sitting).
  - Started from a button in the daily goal box on Home ("Tangira isubiramo ry’uyu munsi"; "Andi makarita 10" once the goal is met).
  - Every answer, second tries included, is saved like any other, so it counts for the goal, streak and points.

## Waiting on the author

1. **Kinyarwanda review** of text written by Claude:
   - the guide pages (Matatu 6, question game 5, Ibisakuzo 4);
   - the daily review lines: "Tangira isubiramo ry’uyu munsi", "Andi makarita 10", "Wongere ugerageze", "Isubiramo rirarangiye", "Ibisubizo by’ukuri ubwa mbere: {n}/{total}", "Wasubiyemo amakarita yose uyu munsi.";
   - the medal names, "Intego y'uyu munsi", "Bika / Siba", "Ongeraho umukinnyi", "Simbuka";
   - the Ibisakuzo lines: "{asker} arabaza, {name} arasubiza", "Soma igisakuzo mu ijwi, {name} agisubize", "Ibisakuzo mutabonye", "Buri wese asubiza ibisakuzo bingana…".
2. **Ibisakuzo:**
   - Should riddle points count on the share card, and how many per riddle?
   - Is there a traditional phrase for giving up?
   - Should it allow 3–6 players?
3. **Matatu:** the Joker's value when someone cuts (50) is a guess.
4. **Final app name and icon.**
5. **Merging** PRs #1 and #2 into `master`.
6. **Next build:** round 2 of the motion work (swiping between decks and games, smoother scrolling), after the author tries round 1 on the phone. Other options mentioned before:
   - English meanings of each saying (the author must check every one);
   - finishing Amaturufu.
7. **Live phone testing:** the tunnel from cloud chats can drop at any time (see "Test on the author's iPhone"). An Apple Developer account would allow a proper installed build.
8. **Not yet seen on a real phone:**
   - the share picture (made by `react-native-view-shot`);
   - the riddle flap;
   - the new shadows;
   - the daily review;
   - all of the motion work (it can only be judged on the phone; the web preview is rougher).

## How to

### Test on the author's iPhone (no steps needed from them)

Run `npm run phone` as a background job (in the Bash tool, `run_in_background`, timeout 7200000). When the log shows `READY`, tell the author to open Expo Go → Home → Development servers → **Amakarita**, or give them the `exp://` link from that line. The log is in `/tmp/amakarita-phone.log`.

- **It needs, already set up in the author's "Default" cloud environment:**
  - network access "Custom" with expo.dev, \*.expo.dev, exp.host, \*.exp.host, \*.expo.app and storage.googleapis.com;
  - the `EXPO_TOKEN` variable.
  - Never print or ask for the token.
- **Why the script exists:** in a cloud session everything must go through the session's proxy. Expo's tunnel websocket ignores the proxy, so `tools/phone/ws-proxy.cjs` gives it one. Without it the tunnel fails with `getaddrinfo ENOTFOUND …on.expo.app`.
- **It is not reliable, by nature.** The cloud proxy's notes (`/root/.ccr/README.md`) list websockets as not supported. The tunnel works through it anyway, but it can drop. On 15 October it dropped after 29 minutes, and Expo then exited ("Unexpected server response: 409").
  - The script starts Expo again 30 seconds after a drop. The link changes, and the "Development servers" entry follows it.
  - After three failed starts in a row it stops (`STOPPED` in the log); start it again from a fresh shell.
  - Tell the author it can drop. Don't promise a session will stay up.
- **Other limits:**
  - Background jobs stop after 2 hours.
  - The cloud container stops a while after the chat goes quiet. When either happens, the app stops loading on the phone, and cards it hasn't fetched yet come out blank.
  - Restart with `npm run phone`.
- **The reliable route** is an installed build. That needs an Apple Developer account ($99/year), then an EAS development or preview build, with updates by `eas update`. No tunnel is involved, and the app keeps working with this chat closed.

### Update the author's preview

`npm run preview` builds `preview/`. Then publish with the Artifact tool:
- `file_path`: `preview/page.html`
- `url`: the preview link above
- `files`: `{"app.js": "preview/app.js"}`

The fonts are already published, and the `downloads` capability carries over. If the publish refuses because you haven't seen the published files, list them first (`action: "list"`, `scope: "files"`).

### Check nothing overlaps

`npm run check:overlaps` builds the web version, serves it, and walks every screen at 390×844, 375×560, 360×520 and 360×640, plus English at 360×640. That takes about 20 minutes, so run it in the background. Zero findings means pass. `SIZES=390x844` runs one size. Screenshots go to `/tmp/amakarita-checks`. A new screen needs a new step in `tools/checks/overlaps.js`.

### Gotchas

- **`pkill -f <pattern>` / `pgrep -f`** can match the command running it and kill the shell (exit 144). Find the process with `ps` and kill it by its number.
- **Never run prettier** on this repo.
- **Expo commands without network to the Expo API:** use `EXPO_OFFLINE=1` for `npx expo install` and `npx expo export`. Never use it for `npm run phone`.
- **Playwright** comes with the cloud session: `NODE_PATH=$(npm root -g)`. Chromium is preinstalled; don't run `playwright install`.
- **Expo docs:** `docs.expo.dev` is reachable with `curl` (through the proxy) but not with the WebFetch tool. Append `.md` to a docs URL for the plain-text version.
- **Local test servers** (`python3 -m http.server`) die when the container restarts; start them again.
- **Packages:** the start-up hook (`.claude/hooks/session-start.sh`) installs them in each new cloud chat.
