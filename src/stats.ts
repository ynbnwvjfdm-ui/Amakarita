import { Deck, SUITED_DECKS } from './decks';
import { Medal, Progress, countKnown, medalFor, totalPoints } from './game/progress';
import { cardPoints } from './game/quiz';
import { QUESTIONS } from './questions';

export interface DeckStat {
  deck: Deck;
  known: number;
  total: number;
  medal: Medal | null;
}

const cardsOf = (deckId: string) =>
  Object.values(QUESTIONS)
    .filter((q) => q.deck === deckId)
    .map((q) => q.card);

/** Known cards and the medal earned, for each deck with questions. */
export function deckStats(p: Progress): DeckStat[] {
  return SUITED_DECKS.map((deck) => {
    const ids = cardsOf(deck.id);
    const known = countKnown(p, ids);
    return { deck, known, total: ids.length, medal: medalFor(known, ids.length) };
  });
}

/** Points from every right answer so far, each worth its card's value. */
export function pointsOf(p: Progress): number {
  return totalPoints(p, (id) => (QUESTIONS[id] ? cardPoints(QUESTIONS[id]) : 0));
}
