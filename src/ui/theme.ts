/**
 * The app frame: a soft lavender-grey ground, white cards, near-black ink and
 * one violet accent, with each deck bringing its own colours (deckTheme).
 */
export const colors = {
  bg: '#EEEDF5',
  surface: '#FFFFFF',
  ink: '#15131C',
  muted: '#6B6880',
  line: '#DCD9EA',
  accent: '#5B4CF0',
  accentInk: '#FFFFFF',
  // Bright blocks for game tickets and feedback.
  lime: '#D7FF3F',
  coral: '#FF5A4E',
  mint: '#BDF5DE',
  pink: '#FFD3EC',
  sky: '#A9CFFF',
  // Card tables for Matatu and Amaturufu.
  table: '#1F3B2D',
  tableInk: '#F4EFE6',
  tableMuted: '#A9BFB2',
  highlight: '#F2C14E',
  teams: ['#F2C14E', '#7FB2F0', '#E58A8A', '#9FD39A', '#C9A3E6', '#F0A86A'],
};

/** Space Grotesk throughout, chosen by the deck's author. */
export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  bold: 'SpaceGrotesk_600SemiBold',
  semibold: 'SpaceGrotesk_500Medium',
  body: 'SpaceGrotesk_400Regular',
  /** Card phrases on question cards and answer choices. */
  card: 'SpaceGrotesk_700Bold',
};

export const radius = { card: 8, button: 14, panel: 22, pill: 999 };

/** Widest the layout grows on tablets and in the browser preview. */
export const MAX_WIDTH = 480;

export interface DeckTheme {
  /** The deck's signature colour: headers, game table, chips. */
  base: string;
  onBase: string;
  /** Card face background, its text and its highlight. */
  face: string;
  ink: string;
  accent: string;
}

/** Colours sampled from each deck's printed pages. */
const DECK_THEMES: Record<string, DeckTheme> = {
  'ntibavuga-bavuga': { base: '#AE1B2B', onBase: '#FFFFFF', face: '#E4E4E3', ink: '#2F2E2E', accent: '#AE1B2B' },
  // Darker than the purple card face so the cards stand out on it.
  ikeshamvugo: { base: '#2B1645', onBase: '#E0F4E3', face: '#412262', ink: '#E0F4E3', accent: '#AEDE73' },
  imvugo: { base: '#1A2738', onBase: '#EFF8D2', face: '#EFF8D2', ink: '#1A2738', accent: '#611321' },
  kirazira: { base: '#374339', onBase: '#F3FAF6', face: '#F3FAF6', ink: '#374339', accent: '#681B38' },
  indangagaciro: { base: '#27204C', onBase: '#FFFFFF', face: '#FAFBFB', ink: '#27204C', accent: '#20614A' },
  ibisakuzo: { base: '#991A23', onBase: '#EDF8EF', face: '#EDF8EF', ink: '#991A23', accent: '#991A23' },
};

/** All five decks mixed together. */
export const MIX_THEME: DeckTheme = { base: colors.ink, onBase: '#FFFFFF', face: '#FFFFFF', ink: colors.ink, accent: colors.accent };

export function deckTheme(deckId: string): DeckTheme {
  return DECK_THEMES[deckId] ?? MIX_THEME;
}
