import { createContext, useContext } from 'react';
import { PlayerCount, TeamMode } from './game/amaturufu';

export interface SeatConfig {
  kind: 'human' | 'bot';
  /** null: use the default "Player N" name in the current language. */
  name: string | null;
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

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'deck'; deckId: string }
  | { name: 'amaturufuSetup' }
  | { name: 'amaturufuGame'; config: AmaturufuConfig }
  | { name: 'matatuSetup' }
  | { name: 'matatuGame'; config: MatatuConfig };

export interface Nav {
  push: (route: Route) => void;
  pop: () => void;
  /** Replace the top screen. */
  replace: (route: Route) => void;
  home: () => void;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav outside NavContext');
  return nav;
}
