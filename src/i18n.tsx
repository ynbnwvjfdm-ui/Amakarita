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
  amagandeTagline: { rw: 'Uwa mbere ushizemo aratsinda', en: 'First to empty their hand wins' },
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
