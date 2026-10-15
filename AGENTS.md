# Amakarita — read this first

Amakarita turns the author's own Rwandan card decks into games, to teach the Kinyarwanda printed on the cards. Before doing anything else in a new chat, read **HANDOFF.md**: where the work stands, decisions already made, questions waiting on the author, and what's next.

## The author's rules (never break these)

- Keep every card's words exactly as printed; never rewrite or "correct" them.
- Never change the card backs (UMUGAMBI). Covers, backs and Ibisakuzo cards are shown as printed.
- Keep each card's printed centre intact; redrawn frames and corners around it are fine.
- No audio.
- The interface is Kinyarwanda first, with English as the second language. New text needs both (`src/i18n.tsx`), and the author reviews the Kinyarwanda.
- Space Grotesk is the only font.
- Nothing on any screen may overlap, be cut off, or (on setup screens) need scrolling. Check with `npm run check:overlaps`.
- Talk to the author in plain, non-technical language. Ask questions as you go (AskUserQuestion), one round at a time, with a recommended option first.

## Working in this project

- **Long chats lose detail.** When this chat has been summarised (a summary appears at the top), or when a big feature is finished, tell the author it is time for a new chat. Before that, update HANDOFF.md, then commit and push. Offer to open the new chat yourself: `create_session` (claude-code-remote tools) with `source_url` set to this repository and `source_revision` set to the working branch named in HANDOFF.md. A chat started from `master` sees none of the app until the pull requests are merged.
- **Testing on the author's iPhone:** run `npm run phone` as a background job. When it prints `READY`, tell the author to open Expo Go → Home → Development servers → Amakarita (or give them the exp:// link it prints). No setup is needed on their side. The tunnel can drop, because the cloud proxy doesn't officially support websockets. The script restarts it with a new link; say so, and never promise it will stay up. Details in HANDOFF.md.
- **Navigation is not Expo Router.** The app uses its own small stack navigator (`App.tsx`, `src/navigation.ts`). Keep using it; the Expo Router advice below does not apply here.
- **Before saying a change is done:** `npm run lint`, `npm run typecheck`, `npm test`. For screen changes, also run `npm run check:overlaps` (one size: `SIZES=390x844 npm run check:overlaps`). Then update the preview: `npm run preview`, and publish it (HANDOFF.md).
- **Never run prettier** on this repository: it rewrites files in a different style.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
