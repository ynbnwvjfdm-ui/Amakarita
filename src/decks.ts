import { PlayingCard, Rank, Suit } from './game/cards';
import { deckPages } from './data/decks/images';

import ntibavugaBavuga from './data/decks/ntibavuga-bavuga.json';
import ikeshamvugo from './data/decks/ikeshamvugo.json';
import imvugo from './data/decks/imvugo.json';
import kirazira from './data/decks/kirazira.json';
import indangagaciro from './data/decks/indangagaciro.json';
import ibisakuzo from './data/decks/ibisakuzo.json';

export interface Segment {
  text: string;
  accent: boolean;
}

export interface TextBlock {
  text: string;
  lines: Segment[][];
}

export interface DeckCard {
  id: string;
  page: number;
  kind: 'number' | 'jack' | 'queen' | 'king' | 'ace' | 'joker' | 'riddle';
  rank: Rank | null;
  suit: Suit | null;
  text?: string;
  lines?: Segment[][];
  riddle?: TextBlock;
  answer?: TextBlock;
}

export interface Deck {
  id: string;
  title: string;
  subtitle?: string;
  format: 'suited' | 'riddle';
  pageCount: number;
  colors: { ink: string; accent: string | null };
  cover: { page: number; text: string };
  back: { page: number; text: string };
  cards: DeckCard[];
}

export const DECKS = [ntibavugaBavuga, ikeshamvugo, imvugo, kirazira, indangagaciro, ibisakuzo] as Deck[];

export const SUITED_DECKS = DECKS.filter((d) => d.format === 'suited');

export function getDeck(id: string): Deck {
  const deck = DECKS.find((d) => d.id === id);
  if (!deck) throw new Error(`Unknown deck ${id}`);
  return deck;
}

/** Image source for a page of a deck's PDF (1-based). */
export function pageImage(deckId: string, page: number): number {
  return deckPages[deckId][page - 1];
}

export function cardImage(deckId: string, cardId: string): number {
  const card = getDeck(deckId).cards.find((c) => c.id === cardId);
  if (!card) throw new Error(`Unknown card ${cardId}`);
  return pageImage(deckId, card.page);
}

/** The face-down side shown for hidden cards. */
export function backImage(deckId: string): number {
  return pageImage(deckId, getDeck(deckId).cover.page);
}

/** The 52 suited cards of a deck as playing cards (jokers excluded). */
export function playingCards(deckId: string): PlayingCard[] {
  return getDeck(deckId).cards.flatMap((c) =>
    c.rank && c.suit ? [{ id: c.id, rank: c.rank, suit: c.suit }] : [],
  );
}

/** Card image width / height, from the 820 x 1120 pt PDF pages. */
export const CARD_RATIO = 820 / 1120;
