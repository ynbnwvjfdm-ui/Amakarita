import { createContext, useContext } from 'react';
import { PlayerCount, TeamMode } from './game/amaturufu';
import { QuizMode } from './game/quiz';

export interface SeatConfig {
  kind: 'human' | 'bot';
  /** null: use the default "Player N" name in the current language. */
  name: string | null;
  /** The learner profile this seat plays as; their answers count for that profile. */
  profileId?: string | null;
}

export interface AmaturufuConfig {
  deckId: string;
  playerCount: PlayerCount;
  teamMode: TeamMode;
  seats: SeatConfig[];
}

export interface MatatuConfig {
  deckId: string;
  handSize: number;
  seats: SeatConfig[];
}

export interface QuizConfig {
  /** A deck id, or 'mix' for all five suited decks. */
  deckId: string;
  mode: QuizMode;
  /** Attempts each player gets. */
  attempts: number;
  seats: SeatConfig[];
}

export interface IbisakuzoConfig {
  /** Riddles each player answers. */
  attempts: number;
  /** Two people: the first asks first. */
  seats: SeatConfig[];
}

/** The screens reached from the tab bar. */
export type TabName = 'home' | 'decks' | 'games';

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'games' }
  | { name: 'quizSetup' }
  | { name: 'quizGame'; config: QuizConfig }
  | { name: 'deck'; deckId: string }
  | { name: 'amaturufuSetup' }
  | { name: 'amaturufuGame'; config: AmaturufuConfig }
  | { name: 'matatuSetup' }
  | { name: 'matatuGame'; config: MatatuConfig }
  | { name: 'ibisakuzoSetup' }
  | { name: 'ibisakuzoGame'; config: IbisakuzoConfig }
  | { name: 'review' };

export interface Nav {
  push: (route: Route) => void;
  pop: () => void;
  /** Replace the top screen. */
  replace: (route: Route) => void;
  home: () => void;
  /** Switch to a tab, clearing anything opened on top. */
  tab: (name: TabName) => void;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav outside NavContext');
  return nav;
}
