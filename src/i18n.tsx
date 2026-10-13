import { createContext, ReactNode, useContext, useState } from 'react';

export type Lang = 'rw' | 'en';

// Kinyarwanda wording to be reviewed by the deck author.
const STRINGS = {
  appTitle: { rw: 'Amakarita', en: 'Amakarita' },
  games: { rw: 'Imikino', en: 'Games' },
  decks: { rw: 'Amakarita', en: 'Card decks' },
  browseDecks: { rw: 'Reba amakarita', en: 'Browse the cards' },
  comingSoon: { rw: 'Biraza vuba', en: 'Coming soon' },
  back: { rw: 'Subira inyuma', en: 'Back' },
  amaturufuTagline: { rw: 'Abakinnyi 2, 4 cyangwa 6', en: '2, 4 or 6 players' },
  matatuTagline: { rw: 'Abakinnyi 2 kugeza kuri 6', en: '2 to 6 players' },
  ibisakuzoTagline: { rw: 'Sakwe sakwe — soma', en: 'Riddles: Sakwe sakwe — soma' },

  chooseDeck: { rw: 'Hitamo amakarita', en: 'Choose a deck' },
  players: { rw: 'Abakinnyi', en: 'Players' },
  howToPlay6: { rw: 'Abakinnyi 6 bakina gute?', en: 'How do 6 players play?' },
  teamsOf3: { rw: 'Amakipe 2 y’abantu 3', en: '2 teams of 3' },
  everyoneAlone: { rw: 'Buri wese ku giti cye', en: 'Everyone for themselves' },
  teamsNote4: { rw: 'Abakinnyi 4 bakina mu makipe 2. Abo mukinana mwicarana muteganye.', en: '4 players play in 2 teams. Partners sit opposite each other.' },
  whoPlays: { rw: 'Ni nde ukina?', en: 'Who is playing?' },
  person: { rw: 'Umuntu', en: 'Person' },
  phone: { rw: 'Telefoni', en: 'Phone' },
  playerN: { rw: 'Umukinnyi {n}', en: 'Player {n}' },
  you: { rw: 'Wowe', en: 'You' },
  team: { rw: 'Ikipe {n}', en: 'Team {n}' },
  start: { rw: 'Tangira', en: 'Start' },
  needOnePerson: { rw: 'Hagomba nibura umuntu umwe.', en: 'At least one player must be a person.' },

  trump: { rw: 'Turufu', en: 'Trump' },
  pile: { rw: 'Ibisigaye: {n}', en: 'Pile: {n}' },
  yourTurn: { rw: 'Ni wowe ukina', en: 'Your turn' },
  turnOf: { rw: 'Hakina {name}', en: '{name} is playing' },
  tookTrick: { rw: '{name} yatwaye', en: '{name} takes the trick' },
  youTookTrick: { rw: 'Watwaye', en: 'You take the trick' },
  tapToPlay: { rw: 'Kanda ikarita ushaka gukina', en: 'Tap the card you want to play' },
  playThisCard: { rw: 'Kina iyi karita', en: 'Play this card' },
  cancel: { rw: 'Reka', en: 'Cancel' },
  passPhoneTo: { rw: 'Hereza telefoni {name}', en: 'Pass the phone to {name}' },
  dontLook: { rw: 'Abandi ntibarebe!', en: 'Everyone else, look away!' },
  showMyCards: { rw: 'Ndi {name}: erekana amakarita yanjye', en: 'I am {name}: show my cards' },
  leaveGame: { rw: 'Kuva mu mukino', en: 'Leave game' },
  leaveConfirm: { rw: 'Urashaka kuva mu mukino?', en: 'Leave this game?' },
  yes: { rw: 'Yego', en: 'Yes' },
  no: { rw: 'Oya', en: 'No' },

  gameOver: { rw: 'Umukino warangiye', en: 'Game over' },
  points: { rw: 'Amanota', en: 'Points' },
  wins: { rw: '{name} aratsinze!', en: '{name} wins!' },
  teamWins: { rw: '{name} iratsinze!', en: '{name} wins!' },
  youWin: { rw: 'Watsinze!', en: 'You win!' },
  draw: { rw: 'Mwanganyije!', en: 'It’s a draw!' },
  playAgain: { rw: 'Ongera ukine', en: 'Play again' },
  home: { rw: 'Ahabanza', en: 'Home' },

  cardsEach: { rw: 'Amakarita kuri buri wese', en: 'Cards each' },
  cut: { rw: 'Gukata', en: 'Cut' },
  pickCard: { rw: 'Fata ikarita', en: 'Pick a card' },
  pickN: { rw: 'Fata {n}', en: 'Pick up {n}' },
  pickupWaiting: { rw: 'Hari {n} zo gufata!', en: '{n} to pick up!' },
  queenFollow: { rw: 'Shyiraho indi {suit} cyangwa ufate ikarita', en: 'Add another {suit} or pick a card' },
  askedSuit: { rw: 'Hasabwe', en: 'Asked' },
  chooseSuit: { rw: 'Hitamo ubwoko', en: 'Choose a suit' },
  cutQuestion: { rw: 'Urakata?', en: 'Cut the game?' },
  cutExplain: { rw: 'Umukino urarangira, buri wese abare amanota y’amakarita asigaranye.', en: 'The round ends and everyone counts the points of the cards in their hand.' },
  cutYes: { rw: 'Yego, kata', en: 'Yes, cut' },
  cutNo: { rw: 'Oya, komeza', en: 'No, keep playing' },
  drawnFits: { rw: 'Ikarita wafashe irakwiriye', en: 'The card you picked fits' },
  playIt: { rw: 'Yikine', en: 'Play it' },
  keepIt: { rw: 'Yibike', en: 'Keep it' },
  warning: { rw: 'Warning!', en: 'Warning!' },
  oneCard: { rw: 'Ikarita imwe!', en: 'One card!' },
  said: { rw: '{name}: {word}', en: '{name}: {word}' },
  caught: { rw: '{name} yafashwe! +{n}', en: '{name} was caught! +{n}' },
  roundOver: { rw: 'Umukino wa {n} urarangiye', en: 'Round {n} is over' },
  outLast: { rw: '{name} ni we wasigaranye amakarita, avuyemo.', en: '{name} was left holding cards and is out.' },
  outCut: { rw: '{cutter} yakase. {name} afite amanota menshi, avuyemo.', en: '{cutter} cut. {name} has the most points and is out.' },
  outLastYou: { rw: 'Ni wowe wasigaranye amakarita, uvuyemo.', en: 'You were left holding cards and are out.' },
  outCutYou: { rw: '{cutter} yakase. Ni wowe ufite amanota menshi, uvuyemo.', en: '{cutter} cut. You have the most points and are out.' },
  youCut: { rw: 'Wakase. {name} afite amanota menshi, avuyemo.', en: 'You cut. {name} has the most points and is out.' },
  youCaught: { rw: 'Wafashwe! +{n}', en: 'You were caught! +{n}' },
  nextRound: { rw: 'Komeza', en: 'Next round' },
  safe: { rw: 'Yarangije', en: 'Safe' },
  outBadge: { rw: 'Yavuyemo', en: 'Out' },
  cardsN: { rw: 'Amakarita {n}', en: '{n} cards' },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof STRINGS;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('rw');
  const t = (key: StringKey, vars: Record<string, string | number> = {}) =>
    STRINGS[key][lang].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
